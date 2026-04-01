import { createAuthClient } from "better-auth/react"
import { adminClient, multiSessionClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    // Use dynamic baseURL to support both local and unified Vercel domain
    baseURL: typeof window !== 'undefined' 
        ? window.location.origin + '/api' 
        : (import.meta.env.VITE_API_URL || "http://localhost:4000/api"),
    plugins: [
        adminClient(),
        multiSessionClient()
    ]
})
