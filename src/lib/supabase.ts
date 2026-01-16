/**
 * Supabase Client for KAI Shop Assistant
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface Order {
    id?: string
    session_id: string
    items: Array<{
        name: string
        quantity: number
        price: number
        total: number
    }>
    total: number
    status?: string
    created_at?: string
}

export interface Session {
    id?: string
    session_id: string
    messages: Array<{
        role: 'kai' | 'customer'
        text: string
        timestamp: string
    }>
    started_at?: string
    last_activity?: string
}

// Save order to Supabase
export async function saveOrderToSupabase(order: Order) {
    const { data, error } = await supabase
        .from('orders')
        .insert([{
            session_id: order.session_id,
            items: order.items,
            total: order.total,
            status: order.status || 'completed'
        }])
        .select()
        .single()

    if (error) {
        console.error('Supabase insert error:', error)
        throw error
    }

    return data
}

// Get orders (for admin)
export async function getOrders() {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}
