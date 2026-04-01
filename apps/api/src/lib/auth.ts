import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { twoFactor, admin } from 'better-auth/plugins'
import { db } from '../db/index.js'
import * as schema from '../db/schema.js'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      account: schema.accounts,
      session: schema.sessions,
      verification: schema.verifications,
    }
  }),
  account: {
    skipStateCookieCheck: true
  },
  trustedOrigins: [
    'http://localhost:3000',
    'https://career-architect-jobtrack.vercel.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : [])
  ],
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: 'select_account',
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }
  },
  plugins: [
    twoFactor({
      issuer: 'JobTracker',
      otpOptions: {
        digits: 6,
        period: 30
      }
    }),
    admin()
  ],
  user: {
    additionalFields: {
      title: {
        type: 'string',
        required: false
      },
      bio: {
        type: 'string',
        required: false
      }
    }
  }
})
