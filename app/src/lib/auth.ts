import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { getOrCreateUser } from './db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.email) {
        await getOrCreateUser(user.email, user.name ?? undefined, user.image ?? undefined);
      }
      return true;
    },
    async session({ session }) {
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
