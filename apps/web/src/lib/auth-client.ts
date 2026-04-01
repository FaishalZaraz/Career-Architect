import { createAuthClient } from "better-auth/react"
import { adminClient, multiSessionClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    // Better Auth auto-appends /api/auth/ — baseURL should be just the origin
    baseURL: typeof window !== 'undefined' 
        ? window.location.origin 
        : "http://localhost:4000",
    plugins: [
        adminClient(),
        multiSessionClient()
    ]
})
