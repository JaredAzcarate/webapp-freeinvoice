# 7. RBAC - Role-Based Access Control

> How to manage roles, permissions, and access control in the application

[← Back: Notifications](./06-NOTIFICATIONS.md) | [Index](./README.md) | [Next: Middleware →](./08-MIDDLEWARE.md)

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Concepts](#-concepts)
3. [Database Structure](#-database-structure)
4. [Roles Defined](#-roles-defined)
5. [Permissions Defined](#-permissions-defined)
6. [File Structure](#-file-structure)
7. [Using RBAC in Code](#-using-rbac-in-code)

---

## 🎯 Overview

RBAC (Role-Based Access Control) is a security model that restricts access based on user roles and permissions. In this project, we use RBAC to:

- Control what users can see and do based on their role
- Manage permissions at a granular level (resource:action)
- Scale access control as the application grows
- Maintain security and separation of concerns

### Why RBAC?

- **Flexibility**: Easy to add new roles and permissions without changing code
- **Security**: Centralized access control logic
- **Maintainability**: Clear separation between roles and permissions
- **Scalability**: Easy to extend for new features

---

## 🧠 Concepts

### Roles

A **role** represents a user's position or responsibility in the system. Users can have multiple roles.

**Examples:**

- `guest` - Read-only access
- `owner` - Full access to all resources

### Permissions

A **permission** represents a specific action that can be performed on a resource. Permissions follow the format: `resource:action`

**Examples:**

- `calendar:read` - View calendar events
- `calendar:create` - Create calendar events
- `settings:update` - Update settings

### Resources and Actions

- **Resource**: The entity or feature being accessed (e.g., `calendar`, `settings`, `auth`)
- **Action**: The operation being performed (e.g., `read`, `create`, `update`, `delete`)

### Relationships

```
User ──has──> Roles ──have──> Permissions
```

- Users have roles (many-to-many)
- Roles have permissions (many-to-many)
- Permissions are checked through roles

---

## 🗄️ Database Structure

### Tables

#### 1. `roles`

Stores the available roles in the system.

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. `permissions`

Stores all available permissions.

```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. `role_permissions`

Many-to-many relationship: roles have permissions.

```sql
CREATE TABLE role_permissions (
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

#### 4. `user_roles`

Many-to-many relationship: users have roles.

```sql
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);
```

### Indexes

For performance optimization:

```sql
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_permissions_resource ON permissions(resource);
```

### Relationship Diagram

```
┌─────────┐         ┌──────────────┐         ┌─────────────┐
│  Users  │────────│  user_roles  │────────│    Roles    │
└─────────┘         └──────────────┘         └──────┬──────┘
                                                    │
                                                    │
                                            ┌───────▼────────┐
                                            │ role_permissions│
                                            └───────┬────────┘
                                                    │
                                            ┌───────▼─────────┐
                                            │   Permissions   │
                                            └─────────────────┘
```

---

## 👥 Roles Defined

### `guest`

**Description:** Read-only access

**Permissions:**

- All `read` permissions (calendar:read, settings:read, auth:read)

**Use Case:**

- Users who can view content but cannot modify it
- Temporary access or limited accounts

### `owner`

**Description:** Full access to all resources

**Permissions:**

- All permissions (read, create, update, delete) for all resources

**Use Case:**

- Primary account holders
- Administrators
- Users with full control

### Default Role Assignment

**New users** are automatically assigned the `owner` role when they register or sign in for the first time.

---

## 🔐 Permissions Defined

### Format

All permissions follow the pattern: `resource:action`

### Calendar Permissions

| Permission        | Resource | Action | Description            |
| ----------------- | -------- | ------ | ---------------------- |
| `calendar:read`   | calendar | read   | View calendar events   |
| `calendar:create` | calendar | create | Create calendar events |
| `calendar:update` | calendar | update | Update calendar events |
| `calendar:delete` | calendar | delete | Delete calendar events |

### Settings Permissions

| Permission        | Resource | Action | Description     |
| ----------------- | -------- | ------ | --------------- |
| `settings:read`   | settings | read   | View settings   |
| `settings:update` | settings | update | Update settings |

### Auth Permissions

| Permission    | Resource | Action | Description                   |
| ------------- | -------- | ------ | ----------------------------- |
| `auth:read`   | auth     | read   | View login methods            |
| `auth:update` | auth     | update | Change password, set password |
| `auth:delete` | auth     | delete | Delete account                |

### Users Permissions (Future)

| Permission     | Resource | Action | Description  |
| -------------- | -------- | ------ | ------------ |
| `users:read`   | users    | read   | View users   |
| `users:update` | users    | update | Update users |
| `users:delete` | users    | delete | Delete users |

---

## 📁 File Structure

### Database Layer

Located in `database/rbac/`:

```
database/rbac/
  ├── roles.ts          - CRUD operations for roles
  ├── permissions.ts    - CRUD operations for permissions
  ├── userRoles.ts      - Assign/remove roles to users
  └── rbac.ts           - Permission verification (queries multiple tables)
```

**Purpose:** Direct database access and queries.

### Shared Layer

Located in `shared/auth/`:

```
shared/auth/
  ├── roles.ts          - Role constants (ROLES.GUEST, ROLES.OWNER)
  ├── permissions.ts    - Permission constants (PERMISSIONS.CALENDAR_READ, etc.)
  └── rbac.ts           - Helper functions (checkPermission, checkRole, etc.)
```

**Purpose:** Constants and helper functions for use in application code.

---

## 💻 Using RBAC in Code

### Constants

Import constants from `shared/auth/`:

```typescript
import { ROLES } from "@/shared/auth/roles";
import { PERMISSIONS } from "@/shared/auth/permissions";

// Use constants
const userRole = ROLES.OWNER;
const permission = PERMISSIONS.CALENDAR_READ;
```

### Checking Permissions in API Routes

**Example:** Protecting an API route with permission check

```typescript
// app/api/calendar/events/route.ts

import { PERMISSIONS } from "@/shared/auth/permissions";
import { checkPermission } from "@/shared/auth/rbac";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Check permission
    const hasPermission = await checkPermission(
      session.user.id,
      PERMISSIONS.CALENDAR_READ
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "No tienes permiso para ver eventos" },
        { status: 403 }
      );
    }

    // Continue with logic...
    return NextResponse.json({ data: events });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener eventos" },
      { status: 500 }
    );
  }
}
```

### Checking Roles

```typescript
import { checkRole } from "@/shared/auth/rbac";
import { ROLES } from "@/shared/auth/roles";

const isOwner = await checkRole(userId, ROLES.OWNER);
if (isOwner) {
  // Allow full access
}
```

### Helper Functions

**Available helpers in `shared/auth/rbac.ts`:**

```typescript
// Check permission
await checkPermission(userId, PERMISSIONS.CALENDAR_READ);

// Check role
await checkRole(userId, ROLES.OWNER);

// Get all roles for user
const roles = await getRolesForUser(userId);

// Get all permissions for user
const permissions = await getPermissionsForUser(userId);

// Check if user is owner
const isOwner = await isOwner(userId);

// Check if user is guest
const isGuest = await isGuest(userId);
```

### Permission Helpers by Resource

**Calendar Permissions:**

```typescript
import { CalendarPermissions } from "@/shared/auth/rbac";

const canRead = await CalendarPermissions.canRead(userId);
const canCreate = await CalendarPermissions.canCreate(userId);
const canUpdate = await CalendarPermissions.canUpdate(userId);
const canDelete = await CalendarPermissions.canDelete(userId);
```

**Settings Permissions:**

```typescript
import { SettingsPermissions } from "@/shared/auth/rbac";

const canRead = await SettingsPermissions.canRead(userId);
const canUpdate = await SettingsPermissions.canUpdate(userId);
```

**Auth Permissions:**

```typescript
import { AuthPermissions } from "@/shared/auth/rbac";

const canRead = await AuthPermissions.canRead(userId);
const canUpdate = await AuthPermissions.canUpdate(userId);
const canDelete = await AuthPermissions.canDelete(userId);
```

---

## ➕ Adding Permissions for New Features

**Important:** When adding a new feature to the application, you must also add the corresponding permissions for that feature. This includes:

- Defining permission constants in `shared/auth/permissions.ts`
- Creating database migrations to insert the new permissions
- Ensuring the `owner` role has access to the new permissions (so owners automatically get access to new features)

The specific implementation approach (migrations, scripts, triggers, etc.) is left to the developer's discretion based on the project's needs.

---

## 📚 Next Steps

→ Learn about [**Middleware**](./08-MIDDLEWARE.md) for route protection  
→ Review [**Best Practices**](./09-BEST-PRACTICES.md) for RBAC implementation

---

[← Back: Notifications](./06-NOTIFICATIONS.md) | [Index](./README.md) | [Next: Middleware →](./08-MIDDLEWARE.md)

**Last Updated:** December 2025
