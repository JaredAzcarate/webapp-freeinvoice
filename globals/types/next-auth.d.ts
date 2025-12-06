import "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id?: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    accessToken?: string;
    refreshToken?: string;
  }
}
