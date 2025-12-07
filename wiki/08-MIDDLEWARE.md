# 8. Middleware

> How to protect routes and handle authentication with Next.js middleware

[← Back: RBAC](./07-RBAC.md) | [Index](./README.md) | [Next: Best Practices →](./09-BEST-PRACTICES.md)

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Location](#-location)
3. [Purpose](#-purpose)
4. [Public Routes](#-public-routes)
5. [Protected Routes](#-protected-routes)
6. [How It Works](#-how-it-works)
7. [Example](#-example)

---

## 🎯 Overview

The middleware in Next.js runs before a request is completed, allowing you to modify the response by rewriting, redirecting, or modifying headers. In this project, we use middleware to:

- Protect routes based on authentication status
- Redirect unauthenticated users from protected routes
- Redirect authenticated users from public routes (like login)
- Handle route protection at the edge

---

## 📍 Location

`middleware.ts` in the root of the project.

```
project/
├── middleware.ts    ← Middleware file
├── app/
├── features/
└── ...
```

---

## 🎯 Purpose

The middleware serves three main purposes:

1. **Route Protection**: Prevent unauthenticated users from accessing protected routes
2. **Smart Redirects**: Redirect authenticated users away from public routes (like login)
3. **Session Validation**: Check if user has a valid session token before allowing access

---

## 🌐 Public Routes

Routes that don't require authentication:

```typescript
const publicRoutes = ["/", "/register", "/verify-email"];
```

These routes are accessible to everyone, including unauthenticated users.

**Examples:**

- `/` - Login page
- `/register` - Registration page
- `/verify-email` - Email verification page

---

## 🔒 Protected Routes

Routes that require authentication:

```typescript
const protectedRoutes = ["/welcome", "/settings"];
```

These routes require a valid session. Unauthenticated users are redirected to the login page.

**Examples:**

- `/welcome` - Welcome/dashboard page
- `/settings` - User settings page

---

## ⚙️ How It Works

### Flow

1. **Request arrives** → Middleware intercepts it
2. **Check session token** → Verify if user is authenticated
3. **Route classification** → Determine if route is public or protected
4. **Decision:**
   - If accessing **protected route** without authentication → redirect to `/`
   - If accessing **public route** (like `/`) with authentication → redirect to `/welcome`
   - Otherwise → allow request to continue

### API Routes

API routes are **not** handled by middleware. They handle their own authentication and permission checks internally.

```typescript
// API routes - let them handle their own authentication
if (pathname.startsWith("/api/")) {
  return NextResponse.next();
}
```

---

## 💻 Example

Complete middleware implementation:

```typescript
// middleware.ts

import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Public routes (no authentication required)
  const publicRoutes = ["/", "/register", "/verify-email"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Protected routes (authentication required)
  const protectedRoutes = ["/welcome", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // API routes - let them handle their own authentication
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // If accessing protected route and not authenticated
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If accessing public route and already authenticated
  if (isPublicRoute && token && pathname === "/") {
    return NextResponse.redirect(new URL("/welcome", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### Key Components

1. **`getToken()`**: Retrieves the JWT token from the NextAuth session
2. **`pathname`**: Current route being accessed
3. **Route arrays**: Define which routes are public vs protected
4. **Redirects**: Use `NextResponse.redirect()` to send users to appropriate pages
5. **`config.matcher`**: Defines which routes the middleware should run on

---

## ✅ Best Practices

### 1. Keep Route Lists Updated

When adding new routes, update the corresponding arrays:

```typescript
// ✅ GOOD - Keep lists updated
const publicRoutes = ["/", "/register", "/verify-email", "/new-public-route"];
const protectedRoutes = ["/welcome", "/settings", "/new-protected-route"];
```

### 2. Use Path Matching for Sub-routes

Use `startsWith()` for routes with sub-paths:

```typescript
// ✅ GOOD - Matches /settings and /settings/profile
const isProtectedRoute = protectedRoutes.some((route) =>
  pathname.startsWith(route)
);
```

### 3. Let API Routes Handle Themselves

Don't try to authenticate API routes in middleware. They have their own logic:

```typescript
// ✅ GOOD
if (pathname.startsWith("/api/")) {
  return NextResponse.next();
}
```

### 4. Use Environment Variables

Always use environment variables for secrets:

```typescript
// ✅ GOOD
const token = await getToken({
  req: request,
  secret: process.env.NEXTAUTH_SECRET,
});
```

---

## 📚 Next Steps

→ Learn about [**Best Practices**](./09-BEST-PRACTICES.md) for RBAC

---

[← Back: RBAC](./07-RBAC.md) | [Index](./README.md) | [Next: Best Practices →](./09-BEST-PRACTICES.md)

**Last Updated:** December 2025
