import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      role: string;
      permissions?: Record<string, boolean> | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    organizationId?: string;
    role?: string;
    permissions?: Record<string, boolean> | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId: string;
    role: string;
    permissions?: Record<string, boolean> | null;
  }
}
