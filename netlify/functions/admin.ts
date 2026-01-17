import type { Config } from "@netlify/functions"

export default async () => {
    return new Response(JSON.stringify({
        total_orders: 0,
        total_revenue: 0,
        message: "Admin stats not yet connected to Supabase"
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

export const config: Config = {
    path: "/api/admin/stats"
}
