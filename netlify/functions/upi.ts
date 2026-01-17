import type { Config } from "@netlify/functions"

export default async () => {
    return new Response(JSON.stringify({
        upi_id: process.env.UPI_ID || 'test@upi',
        shop_name: process.env.UPI_NAME || 'KAI Shop'
    }), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

export const config: Config = {
    path: "/api/upi"
}
