import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { withTenantTransaction } from "./tenant";
import { verifyPassword } from "./password";
import { logAudit } from "./audit";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    id: string;
    clientId: string;
    role: UserRole;
    tokenVersion: number;
    firstName?: string;
    lastName?: string;
  }

  interface Session {
    user: {
      id: string;
      clientId: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours bounded session
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Sell.do Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        domain: { label: "Domain", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        // 1. Resolve tenant context
        let resolvedClientId: string | null = null;

        if (credentials.domain) {
          const client = await db.client.findUnique({
            where: { domain: String(credentials.domain).trim() },
            select: { id: true },
          });
          resolvedClientId = client?.id || null;
        }

        if (!resolvedClientId) {
          // Use security-definer helper to discover user's tenant from email
          const lookupResult = await db.$queryRaw<Array<{ get_user_tenant_for_auth: string | null }>>`
            SELECT get_user_tenant_for_auth(${email}) as get_user_tenant_for_auth;
          `;
          resolvedClientId = lookupResult[0]?.get_user_tenant_for_auth || null;
        }

        if (!resolvedClientId) {
          return null;
        }

        // 2. Perform authentication within the resolved tenant's RLS transaction
        return await withTenantTransaction(resolvedClientId, async (tx) => {
          const user = await tx.user.findFirst({
            where: {
              clientId: resolvedClientId!,
              email,
              status: "ACTIVE",
            },
          });

          if (!user) {
            return null;
          }

          // Account Lockout check (5 failed attempts = 15 min lock)
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            await logAudit(
              {
                clientId: user.clientId,
                userId: user.id,
                action: "AUTH_LOGIN_BLOCKED_LOCKED",
                entityType: "User",
                entityId: user.id,
                metadata: { reason: "Account locked" },
              },
              tx
            );
            throw new Error("Account is temporarily locked. Please try again later.");
          }

          // Verify password hash using OWASP Argon2id
          const isValid = await verifyPassword(user.passwordHash, password);

          if (!isValid) {
            const attempts = user.failedAttempts + 1;
            const lockedUntil =
              attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

            await tx.user.update({
              where: { id: user.id },
              data: {
                failedAttempts: attempts,
                lockedUntil,
              },
            });

            await logAudit(
              {
                clientId: user.clientId,
                userId: user.id,
                action: "AUTH_LOGIN_FAILED",
                entityType: "User",
                entityId: user.id,
                metadata: { attempts },
              },
              tx
            );

            return null;
          }

          // Reset failed attempts on success
          await tx.user.update({
            where: { id: user.id },
            data: {
              failedAttempts: 0,
              lockedUntil: null,
            },
          });

          await logAudit(
            {
              clientId: user.clientId,
              userId: user.id,
              action: "AUTH_LOGIN_SUCCESS",
              entityType: "User",
              entityId: user.id,
            },
            tx
          );

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            clientId: user.clientId,
            role: user.role,
            tokenVersion: user.tokenVersion,
          };
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.clientId = user.clientId;
        token.role = user.role;
        token.tokenVersion = user.tokenVersion;
      }

      // Real-time Session Revocation Check:
      // Verify tokenVersion inside tenant transaction
      if (token.id && token.clientId) {
        try {
          const dbUser = await withTenantTransaction(
            token.clientId as string,
            async (tx) => {
              return tx.user.findUnique({
                where: { id: token.id as string },
                select: { tokenVersion: true, status: true },
              });
            }
          );

          if (
            !dbUser ||
            dbUser.status !== "ACTIVE" ||
            dbUser.tokenVersion !== token.tokenVersion
          ) {
            // Token is revoked or user is inactive
            return null as unknown as typeof token;
          }
        } catch {
          return null as unknown as typeof token;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.clientId = token.clientId as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
