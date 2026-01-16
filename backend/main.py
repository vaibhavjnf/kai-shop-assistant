"""
KAI Shop Assistant - FastAPI Backend
Handles AI, voice processing, and order management
"""

import os
import json
import csv
from datetime import datetime
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
ORDERS_DIR = DATA_DIR / "orders"
MENU_PATH = DATA_DIR / "menu.md"

# Ensure directories exist
ORDERS_DIR.mkdir(parents=True, exist_ok=True)


# ============================================================================
# RATE LIMITING
# ============================================================================

class RateLimiter:
    def __init__(self, requests_per_minute: int):
        self.requests_per_minute = requests_per_minute
        self.requests = []
    
    def can_request(self) -> bool:
        now = datetime.now()
        # Remove requests older than 1 minute
        self.requests = [r for r in self.requests if (now - r).seconds < 60]
        return len(self.requests) < self.requests_per_minute
    
    def add_request(self):
        self.requests.append(datetime.now())


# Rate limiters
deepgram_limiter = RateLimiter(int(os.getenv("DEEPGRAM_REQUESTS_PER_MINUTE", 60)))
gemini_limiter = RateLimiter(int(os.getenv("GEMINI_REQUESTS_PER_MINUTE", 30)))


# ============================================================================
# USAGE TRACKING
# ============================================================================

class UsageTracker:
    def __init__(self):
        self.deepgram_seconds = 0.0
        self.gemini_tokens_in = 0
        self.gemini_tokens_out = 0
        self.sessions_today = 0
        self.orders_today = 0
        self.start_time = datetime.now()
    
    def add_deepgram_usage(self, seconds: float):
        self.deepgram_seconds += seconds
    
    def add_gemini_usage(self, tokens_in: int, tokens_out: int):
        self.gemini_tokens_in += tokens_in
        self.gemini_tokens_out += tokens_out
    
    def get_stats(self) -> dict:
        # Pricing estimates
        deepgram_cost = self.deepgram_seconds / 60 * 0.0043  # $0.0043/min
        gemini_cost = (self.gemini_tokens_in + self.gemini_tokens_out) / 1000 * 0.000125  # rough estimate
        
        return {
            "deepgram_minutes": round(self.deepgram_seconds / 60, 2),
            "gemini_tokens_in": self.gemini_tokens_in,
            "gemini_tokens_out": self.gemini_tokens_out,
            "estimated_cost_usd": round(deepgram_cost + gemini_cost, 4),
            "estimated_cost_inr": round((deepgram_cost + gemini_cost) * 83, 2),
            "sessions_today": self.sessions_today,
            "orders_today": self.orders_today,
            "uptime_minutes": round((datetime.now() - self.start_time).seconds / 60, 1)
        }


usage = UsageTracker()


# ============================================================================
# MENU LOADING
# ============================================================================

def load_menu() -> str:
    """Load menu markdown file as context for AI."""
    if MENU_PATH.exists():
        return MENU_PATH.read_text(encoding="utf-8")
    return "Menu not available"


MENU_CONTEXT = load_menu()


# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = f"""You are KAI, a warm and efficient shop assistant at Jodhpur Namkeen - a beloved snack shop since 1971.

PERSONALITY:
- Friendly, warm, and professional
- Speak in simple Hinglish (Hindi + English mix)
- Quick and helpful, never pushy
- Use phrases like "Ji", "Bilkul", "Zaroor"

YOUR ROLE:
- Take orders verbally from customers
- Confirm each item and quantity clearly
- Suggest 1-2 complementary items (max)
- Calculate totals accurately
- Handle modifications gracefully

RESPONSE FORMAT (JSON):
You MUST respond in this JSON format:
{{
  "speech": "Your spoken response to customer in Hinglish",
  "items_added": [
    {{"name": "Item Name", "quantity": 1, "price": 35, "total": 35}}
  ],
  "items_removed": [],
  "suggestions": ["Suggested item 1"],
  "order_status": "taking_order" | "confirming" | "complete",
  "total": 0
}}

MENU (use ONLY these items and prices):
{MENU_CONTEXT}

RULES:
1. ONLY suggest items from the menu above
2. NEVER make up items or prices
3. Always confirm quantities
4. Keep responses SHORT (1-2 sentences)
5. When customer says "done", "bas", "that's all" → set order_status to "confirming"
6. When customer confirms → set order_status to "complete"
"""


# ============================================================================
# MODELS
# ============================================================================

class OrderItem(BaseModel):
    name: str
    quantity: int
    price: float
    total: float


class Order(BaseModel):
    session_id: str
    items: list[OrderItem]
    total: float
    timestamp: str
    status: str = "pending"


class ChatRequest(BaseModel):
    session_id: str
    message: str
    current_cart: list[dict] = []


class ChatResponse(BaseModel):
    speech: str
    items_added: list[dict] = []
    items_removed: list[dict] = []
    suggestions: list[str] = []
    order_status: str = "taking_order"
    total: float = 0


# ============================================================================
# AI AGENT
# ============================================================================

from google import genai
from google.genai import types

# Initialize Gemini client with new SDK
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))


async def process_order_message(session_id: str, message: str, current_cart: list) -> ChatResponse:
    """Process customer message and return AI response."""
    
    # Rate limiting
    if not gemini_limiter.can_request():
        return ChatResponse(
            speech="Thoda ruko, bahut busy hai abhi. Ek minute mein baat karte hain.",
            order_status="taking_order"
        )
    
    gemini_limiter.add_request()
    
    # Build context with current cart
    cart_context = f"\nCURRENT CART: {json.dumps(current_cart)}" if current_cart else "\nCART IS EMPTY"
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=f'Customer says: "{message}"{cart_context}\n\nRespond in JSON format.',
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.7,
            )
        )
        
        # Track usage
        usage.add_gemini_usage(
            tokens_in=len(message.split()) * 2,  # rough estimate
            tokens_out=len(response.text.split()) * 2
        )
        
        # Parse JSON response
        text = response.text.strip()
        # Remove markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        data = json.loads(text)
        
        return ChatResponse(**data)
        
    except json.JSONDecodeError:
        return ChatResponse(
            speech="Ji, aapne kya kaha? Zara phir se boliye.",
            order_status="taking_order"
        )
    except Exception as e:
        print(f"AI Error: {e}")
        return ChatResponse(
            speech="Maaf kijiye, kuch gadbad ho gayi. Phir se try kijiye.",
            order_status="taking_order"
        )


# ============================================================================
# ORDER STORAGE
# ============================================================================

def save_order(order: Order):
    """Save order to CSV files."""
    
    # Save to master orders.csv
    master_file = ORDERS_DIR / "orders.csv"
    file_exists = master_file.exists()
    
    with open(master_file, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["session_id", "timestamp", "items", "total", "status"])
        writer.writerow([
            order.session_id,
            order.timestamp,
            json.dumps([item.dict() for item in order.items]),
            order.total,
            order.status
        ])
    
    # Save individual session file
    session_file = ORDERS_DIR / f"{order.session_id}.csv"
    with open(session_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["item", "quantity", "price", "total"])
        for item in order.items:
            writer.writerow([item.name, item.quantity, item.price, item.total])
        writer.writerow(["TOTAL", "", "", order.total])
    
    usage.orders_today += 1


# ============================================================================
# FASTAPI APP
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 KAI Shop Assistant Backend Starting...")
    print(f"📁 Menu loaded: {len(MENU_CONTEXT)} characters")
    print(f"📊 Rate limits: Deepgram {deepgram_limiter.requests_per_minute}/min, Gemini {gemini_limiter.requests_per_minute}/min")
    yield
    print("👋 KAI Backend Shutting Down...")


app = FastAPI(
    title="KAI Shop Assistant API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {"status": "ok", "message": "KAI Shop Assistant API"}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/menu")
async def get_menu():
    """Return menu as markdown."""
    return {"menu": MENU_CONTEXT}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Process chat message and return AI response."""
    usage.sessions_today = max(usage.sessions_today, 1)  # At least 1 session
    return await process_order_message(
        request.session_id,
        request.message,
        request.current_cart
    )


@app.post("/order/save")
async def save_order_endpoint(order: Order):
    """Save completed order."""
    order.timestamp = datetime.now().isoformat()
    save_order(order)
    return {"status": "saved", "session_id": order.session_id}


@app.get("/admin/stats")
async def get_stats(password: str = ""):
    """Get usage statistics (admin only)."""
    if password != os.getenv("ADMIN_PASSWORD", "kai2026"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return usage.get_stats()


@app.get("/upi")
async def get_upi_info():
    """Get UPI payment info."""
    return {
        "upi_id": os.getenv("UPI_ID", "hackdomland-4@okhdfcbank"),
        "shop_name": os.getenv("SHOP_NAME", "Jodhpur Namkeen")
    }


# ============================================================================
# RUN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
