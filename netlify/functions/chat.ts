/**
 * KAI Chat Function - Netlify Serverless
 * Handles AI conversation with Gemini
 */
import type { Config, Context } from "@netlify/functions"
import { GoogleGenAI } from "@anthropic-ai/sdk"

// Menu context - embedded for serverless
const MENU_CONTEXT = `
# Jodhpur Namkeen - Menu

## Namkeen & Snacks
| Item | Price (₹) |
|------|-----------|
| Jodhpuri Samosa | 20 |
| Pyaaz Kachori | 35 |
| Dal Kachori | 30 |
| Mirchi Vada | 25 |
| Aloo Tikki | 15 |
| Khasta Kachori | 25 |
| Mawa Kachori | 45 |
| Bikaneri Bhujia | 40/100g |
| Moong Dal | 35/100g |
| Aloo Bhujia | 30/100g |

## Sweets
| Item | Price (₹) |
|------|-----------|
| Ghewar | 60 |
| Malpua | 40 |
| Gulab Jamun | 25 |
| Rasgulla | 30 |
| Jalebi | 35/100g |
| Kalakand | 45/100g |
| Barfi | 40/100g |

## Beverages
| Item | Price (₹) |
|------|-----------|
| Masala Chai | 15 |
| Lassi | 30 |
| Chaas | 20 |
| Cold Coffee | 40 |
`

const SYSTEM_PROMPT = `You are KAI, a warm and efficient shop assistant at Jodhpur Namkeen - a beloved snack shop since 1971.

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
{
  "speech": "Your spoken response to customer in Hinglish",
  "items_added": [
    {"name": "Item Name", "quantity": 1, "price": 35, "total": 35}
  ],
  "items_removed": [],
  "suggestions": ["Suggested item 1"],
  "order_status": "taking_order" | "confirming" | "complete",
  "total": 0
}

MENU (use ONLY these items and prices):
${MENU_CONTEXT}

RULES:
1. ONLY suggest items from the menu above
2. NEVER make up items or prices
3. Always confirm quantities
4. Keep responses SHORT (1-2 sentences)
5. When customer says "done", "bas", "that's all" → set order_status to "confirming"
6. When customer confirms → set order_status to "complete"
`

// Rate limiting storage (in-memory for serverless)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const record = requestCounts.get(ip)

    if (!record || now > record.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + 60000 })
        return true
    }

    if (record.count >= 30) {
        return false
    }

    record.count++
    return true
}

export default async (req: Request, context: Context) => {
    // Only allow POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    // Rate limiting
    const clientIP = context.ip || 'unknown'
    if (!checkRateLimit(clientIP)) {
        return new Response(JSON.stringify({
            speech: "Thoda ruko, bahut busy hai abhi. Ek minute mein baat karte hain.",
            items_added: [],
            items_removed: [],
            suggestions: [],
            order_status: "taking_order",
            total: 0
        }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const { session_id, message, current_cart } = await req.json()

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Call Gemini API
        const apiKey = process.env.GOOGLE_API_KEY
        if (!apiKey) {
            throw new Error('GOOGLE_API_KEY not configured')
        }

        const cartContext = current_cart?.length
            ? `\nCURRENT CART: ${JSON.stringify(current_cart)}`
            : '\nCART IS EMPTY'

        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `Customer says: "${message}"${cartContext}\n\nRespond in JSON format.` }]
                }],
                systemInstruction: {
                    parts: [{ text: SYSTEM_PROMPT }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500
                }
            })
        })

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`)
        }

        const data = await response.json()
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

        // Parse JSON from response
        if (text.startsWith('```')) {
            text = text.split('```')[1]
            if (text.startsWith('json')) {
                text = text.slice(4)
            }
        }

        const parsed = JSON.parse(text.trim())

        return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Chat function error:', error)
        return new Response(JSON.stringify({
            speech: "Maaf kijiye, kuch gadbad ho gayi. Phir se try kijiye.",
            items_added: [],
            items_removed: [],
            suggestions: [],
            order_status: "taking_order",
            total: 0
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

export const config: Config = {
    path: "/api/chat"
}
