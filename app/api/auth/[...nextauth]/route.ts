import {
  createOrUpdateUser,
  getUserByEmail,
  mergeAccountWithGoogle,
  verifyPassword,
} from "@/database/users";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await verifyPassword(
          credentials.email,
          credentials.password
        );

        if (!user) {
          return null;
        }

        if (!user.email_verified) {
          throw new Error("Email no verificado");
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await getUserByEmail(user.email);

          if (existingUser) {
            if (!existingUser.google_id) {
              const mergedUser = await mergeAccountWithGoogle(
                user.email,
                account.providerAccountId,
                user.name || undefined,
                user.image || undefined
              );
              // Store user ID in user object for jwt callback
              user.id = mergedUser.id.toString();
            } else {
              const updatedUser = await createOrUpdateUser(
                user.email,
                user.name || undefined,
                user.image || undefined,
                account.providerAccountId
              );
              // Store user ID in user object for jwt callback
              user.id = updatedUser.id.toString();
            }
          } else {
            const newUser = await createOrUpdateUser(
              user.email,
              user.name || undefined,
              user.image || undefined,
              account.providerAccountId
            );
            // Store user ID in user object for jwt callback
            user.id = newUser.id.toString();
          }
        } catch (error) {
          console.error("Error al guardar usuario en la base de datos:", error);
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      if (user) {
        // user.id should be set by signIn callback for Google, or directly for credentials
        if (user.id) {
          token.id = parseInt(user.id, 10);
        } else if (user.email && account?.provider === "google") {
          // Fallback: fetch from database if not set by signIn callback
          try {
            const dbUser = await getUserByEmail(user.email);
            if (dbUser) {
              token.id = dbUser.id;
            }
          } catch (error) {
            console.error("[NextAuth jwt] Error fetching user:", error);
          }
        }
      }

      // Keep existing token.id on subsequent requests
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      if (token.id) {
        session.user.id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url === baseUrl) {
        return `${baseUrl}/welcome`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/welcome`;
    },
  },
  pages: {
    signIn: "/",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
