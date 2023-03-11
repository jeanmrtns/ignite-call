import { PrismaAdapter } from '@/lib/auth/prisma-adapter'
import { NextApiRequest, NextApiResponse, NextPageContext } from 'next'
import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider, { GoogleProfile } from 'next-auth/providers/google'

const googleScopes = {
  email: 'https://www.googleapis.com/auth/userinfo.email',
  profile: 'https://www.googleapis.com/auth/userinfo.profile',
  calendar: 'https://www.googleapis.com/auth/calendar',
}

export function buildNextAuthOptions(
  req: NextApiRequest | NextPageContext['req'],
  res: NextApiResponse | NextPageContext['res'],
): NextAuthOptions {
  return {
    adapter: PrismaAdapter(req, res),
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        authorization: {
          params: {
            scope: `${googleScopes.email} ${googleScopes.profile} ${googleScopes.calendar}`,
          },
        },
        profile(profile: GoogleProfile) {
          return {
            id: profile.sub,
            email: profile.email,
            name: profile.name,
            username: '',
            avatar_url: profile.picture,
          }
        },
      }),
    ],
    callbacks: {
      async signIn({ account }) {
        if (!account?.scope?.includes(googleScopes.calendar)) {
          return '/register/connect-calendar/?error=permissions'
        }

        return true
      },
      async session({ session, user }) {
        return {
          ...session,
          user,
        }
      },
    },
  }
}

export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, buildNextAuthOptions(req, res))
}
