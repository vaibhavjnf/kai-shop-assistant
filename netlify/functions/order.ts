/**
 * KAI Order Function - Netlify Serverless
 * Saves orders to Supabase
 */
import type { Config, Context } from "@netlify/functions"
import { createClient } from '@supabase/supabase-js'

export default async (req: Request, context: Context) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const { session_id, items, total, status } = await req.json()

        if (!session_id || !items || !total) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Initialize Supabase client
        const supabaseUrl = process.env.SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase configuration missing')
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Save order to Supabase
        const { data, error } = await supabase
            .from('orders')
            .insert([{
                session_id,
                items,
                total,
                status: status || 'completed'
            }])
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
            throw error
        }

        return new Response(JSON.stringify({
            status: 'saved',
            order_id: data.id,
            session_id: data.session_id
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Order function error:', error)
        return new Response(JSON.stringify({ error: 'Failed to save order' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}

export const config: Config = {
    path: "/api/order"
}
