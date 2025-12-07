# 2. Project Architecture

> How we organize and structure code in modern React applications

[← Back: Principles](./01-PRINCIPLES.md) | [Index](./README.md) | [Next: Naming Conventions →](./03-NAMING-CONVENTIONS.md)

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Features vs Shared](#-features-vs-shared)
3. [Grouping Sub-Features](#-grouping-sub-features)
4. [Feature Structure](#-feature-structure)
5. [Shared Structure](#-shared-structure)
6. [Data Flow](#-data-flow)
7. [Practical Examples](#-practical-examples)
8. [Implementation Checklist](#-implementation-checklist)

---

## 🎯 Overview

Our architecture follows a **modular organization** based on business domains (Domain-Driven Design).

### Root Project Structure

```
project/
├── app/               → Next.js App Router (pages & API routes)
├── features/          → Domain-specific code
├── shared/            → Shared code across features
├── public/            → Static assets
├── styles/            → Global styles & Tailwind config
└── ...
```

### Central Principle

```
┌────────────────────────────────────────────────────────┐
│  If specific to a domain     → features/[domain]/      │
│  If used in 3+ domains       → shared/                 │
└────────────────────────────────────────────────────────┘
```

---

## 🔀 Features vs Shared

### 📁 Features - Domain-Specific Code

**Location:** `/features/[feature-name]/`

**What goes here:**

- ✅ Domain-specific components
- ✅ Hooks managing domain logic
- ✅ API functions for specific endpoints
- ✅ Types exclusive to the feature
- ✅ Utils that only make sense in this context

**Example features:**

```
features/
├── users/         → User management and profiles
├── products/      → Product catalog and details
├── orders/        → Order processing
└── auth/          → Authentication and authorization
```

**Example:**

```typescript
// ✅ Goes in features/users/
- UserCard                → displays users only
- useUsers()              → fetches users (calls /api/users)
- UserFilters             → filters users only
```

---

### 🌐 Shared - Shared Code

**Location:** `/shared/`

**What goes here:**

- ✅ Components used in **3+ features**
- ✅ Generic hooks (query params, pagination, etc)
- ✅ Shared API functions (locations, file uploads)
- ✅ Reusable types (FormOption, etc)
- ✅ Generic formatting utils (phone, date, currency)

**Structure:**

```
shared/
├── hooks/         → useQueryParams, usePagination
├── types/         → FormOption, shared interfaces
├── ui/            → ButtonBase, CardBase, form fields
└── utils/         → formatPhone, formatDate, formatCurrency
```

**Example:**

```typescript
// ✅ Goes in shared/
- ButtonBase              → used in users, products, orders
- useQueryParams()        → used in all features with filters
- formatPhone()           → generic phone formatting
- InputEmail              → form field used everywhere
```

---

### 🤔 Decision Rule

```
QUESTION: Will this code be used in other features?
│
├─ YES ──────────────────────────────┐
│                                    │
│  QUESTION: In how many?            │
│  │                                 │
│  ├─ 1-2 features → features/      │
│  └─ 3+ features  → shared/        │
│                                    │
└─ NO ────────────────────────────┐ │
                                  │ │
                            features/│
                                     └──> shared/
```

**Practical examples:**

| Code              | Used in                   | Where to place           |
| ----------------- | ------------------------- | ------------------------ |
| `UserCard`        | Only in features/users    | `features/users/`        |
| `ProductCard`     | Only in features/products | `features/products/`     |
| `ButtonBase`      | users, products, orders   | `shared/`                |
| `useQueryParams`  | users, products, orders   | `shared/`                |
| `formatEventDate` | Only in events            | `features/events/utils/` |
| `formatDate`      | users, products, orders   | `shared/utils/`          |

---

## 🗂️ Grouping Sub-Features

> When multiple features belong to the **same business domain**, consider grouping them in a parent folder.

### When to Group

**✅ Group when:**

- Multiple features (3+) belong to the same business domain
- They share context and similar business rules
- Facilitates navigation and code organization
- Allows scalability for new related sub-features

**❌ DON'T group when:**

- Single feature with no relation to others
- Only 1-2 related features
- Forcing grouping without clear benefit

### Structure with Grouping

```
features/
├── auth/                  # Parent domain: Authentication
│   ├── login/             # Sub-feature: Login
│   ├── register/          # Sub-feature: Registration
│   ├── forgot-password/   # Sub-feature: Password recovery
│   └── (future: oauth/)   # Sub-feature: OAuth
│
├── ecommerce/            # Parent domain: E-commerce
│   ├── products/          # Sub-feature: Product catalog
│   ├── cart/              # Sub-feature: Shopping cart
│   └── checkout/          # Sub-feature: Checkout process
│
└── users/                 # Single domain (no grouping)
    ├── hooks/
    ├── api/
    └── ui/
```

### Benefits of Grouping

- **Clear organization** - Domain and sub-domains visible
- **Scalability** - Easy to add new related sub-features
- **Intuitive navigation** - Self-explanatory folder structure
- **Cohesion** - Related features stay close
- **Maintainability** - Domain changes stay isolated

### Practical Examples

| Domain       | Sub-Features                            | Justification                         |
| ------------ | --------------------------------------- | ------------------------------------- |
| `auth/`      | login, register, forgot-password, oauth | All related to authentication process |
| `ecommerce/` | products, cart, checkout                | All related to e-commerce domain      |
| `users/`     | (single)                                | Single domain, no need for grouping   |
| `posts/`     | (single)                                | Single domain, no need for grouping   |

### Imports with Grouping

```typescript
// ✅ GOOD - Path reflects business domain
import { useLogin } from "@/features/auth/login/hooks/useLogin";
import { useRegister } from "@/features/auth/register/hooks/useRegister";
import { useForgotPassword } from "@/features/auth/forgot-password/hooks/useForgotPassword";

// It's clear they all belong to the auth domain
```

### Route Correspondence

When using feature grouping, **recommend** reflecting the same structure in routes:

```
Code (features):               Routes (app):
features/auth/                 app/auth/
├── login/                →    ├── login/page.tsx         (/auth/login)
├── register/             →    ├── register/page.tsx      (/auth/register)
└── forgot-password/      →    └── forgot-password/page.tsx (/auth/forgot-password)
```

**Benefits of correspondence:**

- ✅ Total coherence between code and URL
- ✅ Semantic and organized URLs
- ✅ Easy to understand project structure by looking at URL
- ✅ Scalable for new features in the same domain

---

## 🏗️ Feature Structure

Every feature follows this pattern:

```
features/
└── [feature-name]/
    ├── types/        🎯 Feature-specific TypeScript types
    ├── hooks/        🪝 State and effects logic (call app/api/...)
    ├── utils/        🔧 Utility functions
    └── ui/           🎨 User interface
        ├── components/  → Reusable components within feature
        └── layouts/     → Page/section structures
```

### 🎯 types/

**Purpose:** Define feature's data structure

**Files:**

- `apiTypes[Entity].ts` - API request/response types
- `types[Component].ts` - Component-specific prop types

**Example:**

```typescript
// features/users/types/apiTypesUser.ts

/**
 * Parameters for fetching users
 */
export interface FetchUsersParams {
  name?: string;
  role?: string;
  page?: number;
  limit?: number;
}

/**
 * User summary (for lists)
 */
export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: string;
}

/**
 * API response for user search
 */
export interface FetchUsersResponse {
  data: UserSummary[];
  total: number;
  page: number;
  limit: number;
}
```

---

### 🪝 hooks/

**Purpose:** Manage state, effects, and presentation logic

**File pattern:** `use[Entity].ts`

**Responsibilities:**

- Call Next.js API routes directly (`/api/...`)
- Fetch data with React Query
- Extract `.data` from response
- Manage local states
- Transform API data for UI format
- Consolidate loading/error states

**Example:**

```typescript
// features/users/hooks/useUsers.ts

import { useQuery } from "@tanstack/react-query";
import { FetchUsersParams, FetchUsersResponse } from "../types/apiTypesUser";

/**
 * Hook to fetch and manage user list
 *
 * @param filters - Search filters
 * @returns Users, states, and errors
 */
export function useUsers(filters: FetchUsersParams = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", filters],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    users: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,

    // States
    isLoading,
    isError,
    error,

    // Actions
    refetch,
  };
}
```

**Hook with multiple queries:**

```typescript
// features/users/hooks/useUserFilters.ts

import { useQuery } from "@tanstack/react-query";
import { fetchRoles, fetchDepartments } from "../api/apiUserFilters";
import {
  mapRolesToOptions,
  mapDepartmentsToOptions,
} from "../utils/mapUserFilters";

/**
 * Hook to fetch all filter options
 */
export function useUserFilters() {
  // Fetch roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["user-filters-roles"],
    queryFn: async () => {
      const response = await fetch("/api/users/filters/roles");
      return response.json();
    },
  });

  // Fetch departments
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["user-filters-departments"],
    queryFn: async () => {
      const response = await fetch("/api/users/filters/departments");
      return response.json();
    },
  });

  // Transform to UI format
  const roleOptions = roles?.data ? mapRolesToOptions(roles.data) : [];
  const departmentOptions = departments?.data
    ? mapDepartmentsToOptions(departments.data)
    : [];

  // Consolidated loading
  const isLoading = isLoadingRoles || isLoadingDepartments;

  return {
    roleOptions,
    departmentOptions,
    isLoading,
  };
}
```

---

### 🔧 utils/

**Purpose:** Pure transformation/formatting functions

**File pattern:**

- `[verb][Entity].ts` - Ex: `formatUserFilters.ts`
- `map[Entity].ts` - Ex: `mapUserFilters.ts`

**Characteristics:**

- Pure functions (no side effects)
- Testable in isolation
- Single clear responsibility

**Example:**

```typescript
// features/users/utils/formatUserFilters.ts

import { FetchUsersParams } from "../types/apiTypesUser";
import { UserFiltersUI } from "../ui/components/UserFilters/types";

/**
 * Convert filters from UI format (arrays) to API format (CSV strings)
 *
 * @param filter - Filters from component
 * @returns Parameters formatted for API
 */
export function formatUserFiltersForAPI(
  filter: UserFiltersUI
): FetchUsersParams {
  return {
    name: filter.name,
    roles: filter.roles?.length ? filter.roles.join(",") : undefined,
    departments: filter.departments?.length
      ? filter.departments.join(",")
      : undefined,
  };
}
```

```typescript
// features/users/utils/mapUserFilters.ts

import { FormOption } from "@/shared/types/form";

/**
 * Map roles from API to select format
 *
 * @param roles - Role list from API
 * @returns Options for select component
 */
export function mapRolesToOptions(
  roles: { id: number; name: string }[]
): FormOption[] {
  return roles.map((role) => ({
    label: role.name,
    value: role.id,
  }));
}
```

---

### 🎨 ui/

Contains components and layouts of the feature.

```
ui/
├── components/      → Reusable components within feature
│   ├── UserCard/
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   ├── UserCard.module.css  (optional, if not using Tailwind)
│   │   └── skeleton.tsx (optional)
│   └── UserFilters/
│       ├── index.tsx
│       └── types.ts
└── layouts/         → Page/section structures
    └── UserListLayout/
        └── index.tsx
```

#### Component

**Standard structure:**

```
ComponentExample/
├── index.tsx            → Logic and rendering
├── types.ts             → Props and local types
├── Component.module.css → Styles (optional with Tailwind)
└── skeleton.tsx         → Loading state (optional)
```

**Complete example:**

```typescript
// features/users/ui/components/UserCard/types.ts

export interface UserCardProps {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  email: string;
  onClick?: () => void;
}
```

```typescript
// features/users/ui/components/UserCard/index.tsx

import { Avatar } from "antd";
import { UserCardProps } from "./types";

/**
 * Card to display user summary information
 */
export default function UserCard({
  firstName,
  lastName,
  avatar,
  role,
  email,
  onClick,
}: UserCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <Avatar src={avatar} alt={`${firstName} ${lastName}`} size={64} />

        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            {firstName} {lastName}
          </h3>
          <p className="text-gray-600">{role}</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// features/users/ui/components/UserCard/skeleton.tsx

import { Skeleton } from "antd";

/**
 * Skeleton for UserCard during loading
 */
export default function UserCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-4">
        <Skeleton.Avatar active size={64} />
        <div className="flex-1 space-y-2">
          <Skeleton.Input active size="small" style={{ width: 200 }} />
          <Skeleton.Input active size="small" style={{ width: 150 }} />
          <Skeleton.Input active size="small" style={{ width: 180 }} />
        </div>
      </div>
    </div>
  );
}
```

#### Layout

**Responsibility:**

- Structure the page/section
- Fetch data (using hooks)
- Orchestrate components
- Handle states (loading, error, empty)

**Example:**

```typescript
// features/users/ui/layouts/UserListLayout/index.tsx

import { Empty } from "antd";
import { useUsers } from "@/features/users/hooks/useUsers";
import UserCard from "../../components/UserCard";
import UserCardSkeleton from "../../components/UserCard/skeleton";
import ErrorContent from "@/shared/ui/components/ErrorContent";

export default function UserListLayout() {
  const { users, isLoading, isError } = useUsers();

  // State: Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <UserCardSkeleton />
        <UserCardSkeleton />
        <UserCardSkeleton />
      </div>
    );
  }

  // State: Error
  if (isError) {
    return <ErrorContent />;
  }

  // State: Empty
  if (users.length === 0) {
    return <Empty description="No users found" />;
  }

  // State: Success
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard key={user.id} {...user} />
      ))}
    </div>
  );
}
```

---

## 🌍 Shared Structure

```
shared/
├── hooks/              → Reusable hooks
│   ├── useQueryParams.ts
│   ├── usePagination.ts
│   └── useDebounce.ts
│
├── api/                → Shared API functions
│   ├── apiLocations.ts
│   └── apiFileUpload.ts
│
├── types/              → Reusable types
│   ├── form.ts
│   ├── api.ts
│   └── common.ts
│
├── ui/                 → Global UI components
│   └── components/
│       ├── ButtonBase/
│       ├── CardBase/
│       ├── ErrorContent/
│       └── EmptyContent/
│
└── utils/              → Utility functions
    ├── formatPhone.ts
    ├── formatDate.ts
    └── formatCurrency.ts
```

### Example: Shared Hook

```typescript
// shared/hooks/useQueryParams.ts

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook to manage query parameters consistently
 * Used in multiple features for filters, search, pagination
 */
export function useQueryParams() {
  const router = useRouter();

  const getQueryParam = useCallback((key: string): string | undefined => {
    if (typeof window === "undefined") return undefined;
    const params = new URLSearchParams(window.location.search);
    return params.get(key) || undefined;
  }, []);

  const setQueryParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(window.location.search);

      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      router.push(`${window.location.pathname}?${params.toString()}`);
    },
    [router]
  );

  return {
    getQueryParam,
    setQueryParam,
  };
}
```

### Example: Shared Component

```typescript
// shared/ui/components/ButtonBase/types.ts

export interface ButtonBaseProps {
  type?: "primary" | "default" | "dashed";
  size?: "large" | "middle" | "small";
  text?: string;
  icon?: React.ReactNode;
  onlyIcon?: boolean;
  onClick?: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}
```

```typescript
// shared/ui/components/ButtonBase/index.tsx

import { Button } from "antd";
import { ButtonBaseProps } from "./types";

/**
 * Base button reusable across the application
 */
export default function ButtonBase({
  type = "primary",
  size = "middle",
  text,
  icon,
  onlyIcon = false,
  onClick,
  loading = false,
  disabled = false,
}: ButtonBaseProps) {
  return (
    <Button
      type={type}
      size={size}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      icon={icon}
    >
      {!onlyIcon && text}
    </Button>
  );
}
```

---

## 🔄 Data Flow

### Layered Architecture

```
┌──────────────────────────────────────────────────────┐
│                 PAGE (Next.js)                       │
│  app/users/page.tsx                                  │
│  - Application route                                 │
│  - Uses Layout                                       │
└──────────────────┬───────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────┐
│                    LAYOUT                            │
│  features/users/ui/layouts/UserListLayout/           │
│  - Page structure                                    │
│  - Fetches data (hooks)                              │
│  - Orchestrates components                           │
└──────────────────┬───────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────┐
│                 COMPONENTS                           │
│  features/users/ui/components/UserCard/              │
│  - Renders UI                                        │
│  - Receives props                                    │
│  - Dispatches events                                 │
└──────────────────┬───────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────┐
│                    HOOKS                             │
│  features/users/hooks/useUsers                       │
│  - Calls /api/users directly                         │
│  - React Query                                       │
│  - Extracts .data from response                      │
│  - Transforms data                                   │
└──────────────────┬───────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTE                       │
│  app/api/users/route.ts                              │
│  - Backend logic                                     │
│  - Database queries                                  │
│  - Returns full response with .data                  │
└──────────────────────────────────────────────────────┘
```

---

## 💡 Practical Examples

### Complete Example: Users Feature

```
features/users/
├── types/
│   └── apiTypesUser.ts          # API interfaces
│
├── hooks/
│   └── useUsers.ts               # Calls /api/users, extracts .data
│
├── utils/
│   ├── formatUserFilters.ts      # UI → API
│   └── mapUserFilters.ts         # API → UI
│
└── ui/
    ├── components/
    │   ├── UserCard/             # Individual card
    │   └── UserFilters/          # Filters
    └── layouts/
        └── UserListLayout/       # Complete list

app/
└── api/
    └── users/
        └── route.ts              # Backend endpoint
```

**Flow:**

1. **Page** calls Layout
2. **Layout** uses `useUsers()`
3. **Hook** calls `/api/users` directly
4. **Next.js API Route** handles backend logic
5. **Hook** extracts `.data` and transforms response
6. **Layout** renders `UserCard`

---

## ✅ Implementation Checklist

### Before Starting

- [ ] Is the feature well defined?
- [ ] Does something similar exist in other features?
- [ ] Which shared/ components can I reuse?
- [ ] Have I planned the folder structure?

### Creating the Structure

- [ ] Created `features/[name]/`
- [ ] Created subfolders: `types/`, `api/`, `hooks/`, `utils/`, `ui/`
- [ ] In `ui/` created `components/` and `layouts/`

### Types

- [ ] Types for API (request/response)
- [ ] Types for component props
- [ ] Complete JSDoc
- [ ] Naming: `apiTypes[Entity].ts`

### Next.js API Routes

- [ ] Created `app/api/[endpoint]/route.ts`
- [ ] Handles backend logic and database queries
- [ ] Returns full response with `.data` property
- [ ] Complete JSDoc

### Hooks

- [ ] React Query configured
- [ ] Calls `/api/...` endpoints directly
- [ ] Extracts `.data` from response
- [ ] Data transformation API → UI
- [ ] Consolidated states (loading, error)
- [ ] Naming: `use[Entity].ts`

### Utils

- [ ] Pure functions
- [ ] Testable
- [ ] JSDoc
- [ ] Naming: `[verb][Entity].ts`

### UI

- [ ] Each component in its folder
- [ ] Structure: index.tsx, types.ts
- [ ] Skeleton when necessary
- [ ] States handled (loading, error, empty)

### Quality

- [ ] No lint errors
- [ ] No console.log in production
- [ ] Organized imports
- [ ] English names
- [ ] English comments

---

## 📚 Next Steps

→ [**Naming Conventions**](./03-NAMING-CONVENTIONS.md) - Learn naming patterns

---

[← Back: Principles](./01-PRINCIPLES.md) | [Index](./README.md) | [Next: Naming Conventions →](./03-NAMING-CONVENTIONS.md)
