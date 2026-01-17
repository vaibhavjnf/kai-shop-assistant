/**
 * API Client for KAI Backend
 */

// Smartly determine API_BASE
// If explicit env var is set, use it.
// If on localhost client-side, default to python backend port 8000.
// Otherwise (production/serverless), use relative '/api' path.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : '/api');

export interface ChatRequest {
    session_id: string;
    message: string;
    current_cart: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
    }>;
}

export interface ChatResponse {
    speech: string;
    items_added: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
    }>;
    items_removed: Array<{ name: string }>;
    suggestions: string[];
    order_status: 'taking_order' | 'confirming' | 'complete';
    total: number;
}

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error('Failed to send message');
    }

    return response.json();
}

export async function saveOrder(order: {
    session_id: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
    }>;
    total: number;
    status: string;
}) {
    // Note: Netlify function is at /api/order, not /order/save
    const response = await fetch(`${API_BASE}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...order,
            timestamp: new Date().toISOString(),
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to save order');
    }

    return response.json();
}

export async function getUPIInfo(): Promise<{ upi_id: string; shop_name: string }> {
    const response = await fetch(`${API_BASE}/upi`);
    if (!response.ok) {
        throw new Error('Failed to get UPI info');
    }
    return response.json();
}

export async function getAdminStats(password: string) {
    const response = await fetch(`${API_BASE}/admin/stats?password=${password}`);
    if (!response.ok) {
        throw new Error('Unauthorized or failed to get stats');
    }
    return response.json();
}
