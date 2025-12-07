# 9. Best Practices - RBAC

> Best practices for implementing and using RBAC in the application

[← Back: Middleware](./08-MIDDLEWARE.md) | [Index](./README.md)

---

## 📋 Table of Contents

- [9. Best Practices - RBAC](#9-best-practices---rbac)
  - [📋 Table of Contents](#-table-of-contents)
  - [1. Always Use Constants](#1-always-use-constants)
  - [2. Check Permissions in API Routes](#2-check-permissions-in-api-routes)
  - [3. Use Helper Functions](#3-use-helper-functions)
  - [4. Handle Errors Gracefully](#4-handle-errors-gracefully)
  - [5. Don't Expose Permission Logic in UI](#5-dont-expose-permission-logic-in-ui)
  - [➕ Adding Permissions for New Features](#-adding-permissions-for-new-features)
  - [📚 Next Steps](#-next-steps)

---

## 1. Always Use Constants

Never use hardcoded permission strings. Always import and use constants from `shared/auth/permissions.ts`.

```typescript
// ✅ GOOD
import { PERMISSIONS } from "@/shared/auth/permissions";
await checkPermission(userId, PERMISSIONS.CALENDAR_READ);

// ❌ BAD
await checkPermission(userId, "calendar:read");
```

**Why?**

- Type safety: TypeScript will catch typos
- Refactoring: Easy to rename permissions
- Consistency: Single source of truth
- IDE support: Autocomplete and navigation

---

## 2. Check Permissions in API Routes

Always verify permissions in API routes, not just in the UI. The UI can show/hide elements, but API routes must enforce permissions.

```typescript
// ✅ GOOD - Check in API route
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const hasPermission = await checkPermission(
    session.user.id,
    PERMISSIONS.CALENDAR_DELETE
  );

  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete logic...
}
```

**Why?**

- Security: UI can be bypassed
- Server-side enforcement: Always checked
- Defense in depth: Multiple layers of security

---

## 3. Use Helper Functions

Prefer helper functions for cleaner and more readable code.

```typescript
// ✅ GOOD
import { CalendarPermissions } from "@/shared/auth/rbac";

const canDelete = await CalendarPermissions.canDelete(userId);
if (canDelete) {
  // Delete logic...
}

// ❌ BAD
const canDelete = await checkPermission(userId, PERMISSIONS.CALENDAR_DELETE);
```

**Available Helpers:**

```typescript
// Calendar permissions
import { CalendarPermissions } from "@/shared/auth/rbac";
await CalendarPermissions.canRead(userId);
await CalendarPermissions.canCreate(userId);
await CalendarPermissions.canUpdate(userId);
await CalendarPermissions.canDelete(userId);

// Settings permissions
import { SettingsPermissions } from "@/shared/auth/rbac";
await SettingsPermissions.canRead(userId);
await SettingsPermissions.canUpdate(userId);

// Auth permissions
import { AuthPermissions } from "@/shared/auth/rbac";
await AuthPermissions.canRead(userId);
await AuthPermissions.canUpdate(userId);
await AuthPermissions.canDelete(userId);
```

**Why?**

- Readability: More descriptive function names
- Consistency: Same pattern across the codebase
- Maintainability: Easier to update logic in one place

---

## 4. Handle Errors Gracefully

Always return appropriate HTTP status codes and user-friendly error messages.

```typescript
// ✅ GOOD
if (!hasPermission) {
  return NextResponse.json(
    { error: "No tienes permiso para realizar esta acción" },
    { status: 403 }
  );
}

// ❌ BAD
if (!hasPermission) {
  return NextResponse.json({ error: "Forbidden" });
  // Missing status code, unclear message
}
```

**HTTP Status Codes:**

- `401 Unauthorized`: User is not authenticated
- `403 Forbidden`: User is authenticated but lacks permission
- `404 Not Found`: Resource doesn't exist
- `500 Internal Server Error`: Server error

**Why?**

- Clear communication: Users understand what went wrong
- Proper status codes: Frontend can handle errors appropriately
- Debugging: Easier to identify issues

---

## 5. Don't Expose Permission Logic in UI

Keep permission checks server-side. UI can show/hide elements for UX, but API routes must enforce permissions.

```typescript
// ✅ GOOD - UI can hide button, but API enforces
// Component
{
  userCanDelete && <Button onClick={handleDelete}>Delete</Button>;
}

// API Route
export async function DELETE(request: NextRequest) {
  const hasPermission = await checkPermission(
    userId,
    PERMISSIONS.CALENDAR_DELETE
  );
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Delete logic...
}
```

**Why?**

- Security: Client-side checks can be bypassed
- Single source of truth: Server is authoritative
- Better UX: Hide unavailable actions, but always verify server-side

---

## ➕ Adding Permissions for New Features

**Important:** When adding a new feature to the application, you must also add the corresponding permissions for that feature. This includes:

- Defining permission constants in `shared/auth/permissions.ts`
- Creating database migrations to insert the new permissions
- Ensuring the `owner` role has access to the new permissions (so owners automatically get access to new features)

The specific implementation approach (migrations, scripts, triggers, etc.) is left to the developer's discretion based on the project's needs.

---

## 📚 Next Steps

→ Review [**RBAC**](./07-RBAC.md) for complete RBAC documentation  
→ Review [**Middleware**](./08-MIDDLEWARE.md) for route protection

---

[← Back: Middleware](./08-MIDDLEWARE.md) | [Index](./README.md)

**Last Updated:** December 2025
