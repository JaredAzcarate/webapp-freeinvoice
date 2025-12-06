# 4. API Consumption Flow

> How to correctly consume APIs in Next.js: API Routes → Hooks → Layouts → Components

[← Back: Naming Conventions](./03-NAMING-CONVENTIONS.md) | [Index](./README.md) | [Next: State Management →](./05-STATE-MANAGEMENT.md)

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Fundamental Rules](#-fundamental-rules)
3. [Layer 1: Next.js API Routes](#-layer-1-nextjs-api-routes)
4. [Layer 2: Hooks](#-layer-2-hooks)
5. [Layer 3: Layouts](#-layer-3-layouts)
6. [Layer 4: Components](#-layer-4-components)
7. [Complete Flow](#-complete-flow)
8. [Best Practices](#-best-practices)
9. [Common Mistakes](#-common-mistakes)

---

## 🎯 Overview

API consumption follows a **4-layer flow** well-defined:

```
┌─────────────────────────────────────────────────────────┐
│              1. NEXT.JS API ROUTE                       │
│         (app/api/users/route.ts)                        │
│  Backend endpoint - handles database/external APIs      │
│  Returns full response with .data property              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP Response (full response)
                     ↓
┌─────────────────────────────────────────────────────────┐
│                     2. HOOK                             │
│         (features/users/hooks/useUsers.ts)              │
│  Calls /api/users directly                             │
│  Extracts .data and transforms                          │
│  ✅ HERE extracts response.data                         │
└────────────────────┬────────────────────────────────────┘
                     │ Ready data
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    3. LAYOUT                            │
│     (features/users/ui/layouts/UserListLayout/)         │
│  Uses hook and orchestrates components                  │
│  Passes data via props                                  │
└────────────────────┬────────────────────────────────────┘
                     │ Data via props
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  4. COMPONENT                           │
│       (features/users/ui/components/UserCard/)          │
│  Only UI - receives data via props                      │
│  ❌ Does NOT make API calls                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📏 Fundamental Rules

### 🔴 Rule 1: Next.js API Routes return full response

```typescript
// ✅ GOOD - API route returns full response with .data
export async function GET() {
  const users = await getUsersFromDatabase();
  return NextResponse.json({
    data: users,
    total: users.length,
    success: true,
  });
}

// ❌ BAD - API route returns only data
export async function GET() {
  const users = await getUsersFromDatabase();
  return NextResponse.json(users); // ❌ Should wrap in { data: ... }
}
```

### 🟢 Rule 2: Hooks call endpoints directly and extract .data

```typescript
// ✅ GOOD - Hook extracts .data
export function useUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const json = await response.json();
      return json.data;
    },
  });

  return {
    users: data || [], // ✅ data already contains extracted .data
    isLoading,
  };
}

// ❌ BAD - Hook doesn't extract .data
export function useUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      return response.json(); // ❌ Don't extract .data
    },
  });

  return {
    data, // ❌ Don't return raw response
    isLoading,
  };
}
```

### 🔵 Rule 3: Layouts use Hooks

```typescript
// ✅ GOOD - Layout uses hook
export default function UserListLayout() {
  const { users, isLoading } = useUsers();

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} {...user} />
      ))}
    </div>
  );
}

// ❌ BAD - Layout calls API function directly
export default function UserListLayout() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then((response) => {
      setUsers(response.data); // ❌ Don't do this!
    });
  }, []);
}
```

### 🟡 Rule 4: Components receive props only

```typescript
// ✅ GOOD - Component receives props
export default function UserCard({ firstName, email }: UserCardProps) {
  return (
    <div>
      <h3>{firstName}</h3>
      <p>{email}</p>
    </div>
  );
}

// ❌ BAD - Component fetches data
export default function UserCard({ id }: { id: string }) {
  const { user } = useUser(id); // ❌ Component doesn't use data hooks!

  return (
    <div>
      <h3>{user?.firstName}</h3>
    </div>
  );
}
```

---

## 🌐 Layer 1: Next.js API Routes

**Responsibility:** Handle backend logic, database queries, external API calls

**Location:** `app/api/[endpoint]/route.ts`

### Structure

```typescript
// app/api/users/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/users - Fetch all users
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get("name");
    const role = searchParams.get("role");

    // Query database or external API
    const users = await database.users.findMany({
      where: {
        ...(name && { name: { contains: name } }),
        ...(role && { role }),
      },
    });

    // Return formatted response
    return NextResponse.json({
      data: users,
      total: users.length,
      success: true,
    });
  } catch (error) {
    console.error("[API /users] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", success: false },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.email || !body.firstName) {
      return NextResponse.json(
        { error: "Missing required fields", success: false },
        { status: 400 }
      );
    }

    // Create user in database
    const newUser = await database.users.create({
      data: body,
    });

    return NextResponse.json({
      data: newUser,
      success: true,
    });
  } catch (error) {
    console.error("[API /users] Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user", success: false },
      { status: 500 }
    );
  }
}
```

### Dynamic Routes

```typescript
// app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/users/[id] - Fetch single user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await database.users.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: user,
      success: true,
    });
  } catch (error) {
    console.error(`[API /users/${params.id}] Error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user", success: false },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id] - Update user
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const updatedUser = await database.users.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json({
      data: updatedUser,
      success: true,
    });
  } catch (error) {
    console.error(`[API /users/${params.id}] Error updating:`, error);
    return NextResponse.json(
      { error: "Failed to update user", success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id] - Delete user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await database.users.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error(`[API /users/${params.id}] Error deleting:`, error);
    return NextResponse.json(
      { error: "Failed to delete user", success: false },
      { status: 500 }
    );
  }
}
```

---

## 🪝 Layer 2: Hooks

**Responsibility:** Call Next.js API routes directly, extract `.data`, manage state, transform data

### Structure

```typescript
// features/[name]/hooks/use[Entity].ts

import { useQuery } from "@tanstack/react-query";
import { FetchUsersParams } from "../types/apiTypesUser";

/**
 * Hook to fetch and manage user list
 *
 * @param filters - Search filters
 * @returns Ready data for UI
 */
export function useUsers(filters: FetchUsersParams = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", filters],
    queryFn: async () => {
      // ✅ Call endpoint directly
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.set(key, String(value));
        }
      });

      const response = await fetch(`/api/users?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      // ✅ Extract .data here
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  return {
    users: data || [],
    total: data?.length || 0,

    // States
    isLoading,
    isError,
    error,

    // Actions
    refetch,
  };
}
```

### Real Example

```typescript
// features/users/hooks/useUsers.ts

import { useQuery } from "@tanstack/react-query";
import { FetchUsersParams } from "../types/apiTypesUser";

/**
 * Hook to fetch and manage user list
 */
export function useUsers(filters: FetchUsersParams = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", filters],
    queryFn: async () => {
      // Build query string
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.set(key, String(value));
        }
      });

      // Call endpoint directly
      const response = await fetch(`/api/users?${queryParams.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      // ✅ Extract .data from response
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    users: data || [],
    total: data?.length || 0,

    // Loading/error states
    isLoading,
    isError,
    error,

    // Actions
    refetch,
  };
}
```

### Hook with Data Transformation

```typescript
// features/users/hooks/useUserFilters.ts

import { useQuery } from "@tanstack/react-query";
import { fetchRoles, fetchDepartments } from "../api/apiUserFilters";
import {
  mapRolesToOptions,
  mapDepartmentsToOptions,
} from "../utils/mapUserFilters";

/**
 * Hook to fetch filter options
 * Returns data already transformed for UI
 */
export function useUserFilters() {
  // Fetch roles
  const { data: roles, isLoading: isLoadingRoles } = useQuery({
    queryKey: ["user-filters-roles"],
    queryFn: fetchRoles,
  });

  // Fetch departments
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["user-filters-departments"],
    queryFn: fetchDepartments,
  });

  // ✅ Extract .data and transform here
  const roleOptions = roles?.data ? mapRolesToOptions(roles.data) : [];
  const departmentOptions = departments?.data
    ? mapDepartmentsToOptions(departments.data)
    : [];

  // Consolidated loading
  const isLoading = isLoadingRoles || isLoadingDepartments;

  return {
    roleOptions, // ✅ Data already transformed
    departmentOptions, // ✅ Ready to use
    isLoading,
  };
}
```

### Hook with Mutation

```typescript
// features/users/hooks/useFollowUser.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
// Hooks call endpoints directly, no need to import API functions

/**
 * Hook to follow/unfollow users
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  const follow = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate cache to update list
      queryClient.invalidateQueries(["users"]);
    },
  });

  const unfollow = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}/unfollow`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
    },
  });

  return {
    follow: follow.mutate,
    unfollow: unfollow.mutate,
    isLoading: follow.isLoading || unfollow.isLoading,
  };
}
```

### What Hooks Should NOT Do

```typescript
// ❌ BAD - Call API directly
export function useUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        // ❌ Don't call API directly
        setUsers(data.data);
      });
  }, []);

  return { users };
}

// ❌ BAD - Return raw response
export function useUsers() {
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      return response.json(); // ❌ Don't extract .data
    },
  });

  return { data }; // ❌ Return raw response
}

// ❌ BAD - Render UI
export function useUsers() {
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const json = await response.json();
      return json.data;
    },
  });

  return (
    <div>
      {/* ❌ Hook doesn't render UI */}
      {data?.data.map((u) => (
        <span>{u.firstName}</span>
      ))}
    </div>
  );
}
```

---

## 📐 Layer 3: Layouts

**Responsibility:** Use hooks, orchestrate components, pass data via props

### Structure

```typescript
// features/[name]/ui/layouts/[Name]Layout/index.tsx

import { Empty } from "antd";
import { useUsers } from "@/features/users/hooks/useUsers";
import UserCard from "../../components/UserCard";
import UserCardSkeleton from "../../components/UserCard/skeleton";
import ErrorContent from "@/globals/ui/components/ErrorContent";

export default function UserListLayout() {
  // ✅ Use hook to fetch data
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

  // State: Success - Pass data via props
  return (
    <div className="space-y-4">
      {users.map((user) => (
        <UserCard key={user.id} {...user} />
      ))}
    </div>
  );
}
```

### Real Example

```typescript
// features/users/ui/layouts/UserListLayout/index.tsx

import { Empty } from "antd";
import { useRouter } from "next/navigation";

import { useUsers } from "@/features/users/hooks/useUsers";
import { useUserFilters } from "@/features/users/hooks/useUserFilters";
import { formatUserFiltersForAPI } from "@/features/users/utils/formatUserFilters";

import UserFilters from "../../components/UserFilters";
import UserCard from "../../components/UserCard";
import UserCardSkeleton from "../../components/UserCard/skeleton";
import ErrorContent from "@/globals/ui/components/ErrorContent";

export default function UserListLayout() {
  const router = useRouter();

  // ✅ Hook for filter options
  const {
    roleOptions,
    departmentOptions,
    isLoading: isLoadingOptions,
  } = useUserFilters();

  // Build filters from URL (you'd use useQueryParams here)
  const filtersUI = {
    name: "", // Get from URL
    roles: [], // Get from URL
  };

  // Format for API
  const filtersAPI = formatUserFiltersForAPI(filtersUI);

  // ✅ Hook to fetch users
  const { users, total, isLoading, isError } = useUsers(filtersAPI);

  return (
    <div className="flex gap-6">
      {/* Sidebar with filters */}
      <aside className="w-64">
        <UserFilters
          roleOptions={roleOptions}
          departmentOptions={departmentOptions}
          isLoading={isLoadingOptions}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
          </div>
        )}

        {/* Error */}
        {isError && <ErrorContent />}

        {/* Empty */}
        {!isLoading && !isError && users.length === 0 && (
          <Empty description="No users found" />
        )}

        {/* Success - Pass data via props */}
        {!isLoading && !isError && users.length > 0 && (
          <>
            <div className="mb-4 text-gray-600">
              {total} {total === 1 ? "user" : "users"} found
            </div>

            <div className="space-y-4">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  id={user.id}
                  firstName={user.firstName}
                  lastName={user.lastName}
                  email={user.email}
                  role={user.role}
                  avatar={user.avatar}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
```

### What Layouts Should NOT Do

```typescript
// ❌ BAD - Call API function directly
export default function UserListLayout() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers({}).then((response) => {
      // ❌ Don't call API function directly
      setUsers(response.data);
    });
  }, []);
}

// ❌ BAD - Use fetch/axios directly
export default function UserListLayout() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data.data)); // ❌ Don't use fetch directly
  }, []);
}

// ❌ BAD - Complex business logic
export default function UserListLayout() {
  const { users } = useUsers();

  // ❌ Don't do complex transformations here
  const sortedUsers = users
    .filter((u) => u.active)
    .sort((a, b) => a.firstName.localeCompare(b.firstName))
    .map((u) => ({
      ...u,
      fullName: `${u.firstName} ${u.lastName}`,
      age: calculateAge(u.birthDate),
    }));

  // This should be in the hook or util
}
```

---

## 🎨 Layer 4: Components

**Responsibility:** Only render UI with data received via props

### Structure

```typescript
// features/[name]/ui/components/[Name]/types.ts

export interface UserCardProps {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  onClick?: () => void;
}
```

```typescript
// features/[name]/ui/components/[Name]/index.tsx

import { Avatar } from "antd";
import { UserCardProps } from "./types";

/**
 * Card to display user information
 * Pure component - only UI
 */
export default function UserCard({
  firstName,
  lastName,
  email,
  role,
  avatar,
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

### Component with Action

```typescript
// features/products/ui/components/ProductCard/types.ts

export interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  inCart: boolean;
  onAddToCart?: () => void;
  isAddingToCart?: boolean;
}
```

```typescript
// features/products/ui/components/ProductCard/index.tsx

import { Button } from "antd";
import { ProductCardProps } from "./types";

export default function ProductCard({
  name,
  description,
  price,
  inCart,
  onAddToCart,
  isAddingToCart = false,
}: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-gray-600">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xl font-bold">${price}</span>

        {!inCart && (
          <Button
            type="primary"
            onClick={onAddToCart}
            loading={isAddingToCart}
            disabled={isAddingToCart}
          >
            Add to Cart
          </Button>
        )}
      </div>
    </div>
  );
}
```

### What Components Should NOT Do

```typescript
// ❌ BAD - Fetch data
export default function UserCard({ id }: { id: string }) {
  const { user, isLoading } = useUser(id); // ❌ Component doesn't use data hooks

  if (isLoading) return <Skeleton />;

  return <div>{user?.firstName}</div>;
}

// ❌ BAD - Call API
export default function UserCard({ id }: { id: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(id).then((response) => {
      // ❌ Component doesn't call API functions
      setUser(response.data);
    });
  }, [id]);

  return <div>{user?.firstName}</div>;
}

// ❌ BAD - Business logic
export default function UserCard({ user }: UserCardProps) {
  // ❌ Component doesn't do complex calculations
  const age = calculateAge(user.birthDate);
  const category = classifyByAge(age);
  const fullName = `${user.firstName} ${user.lastName}`;

  return <div>{fullName}</div>;
}
```

---

## 🔄 Complete Flow

### Example: Fetch and Display Users

#### 1. Next.js API Route

```typescript
// app/api/users/route.ts

export async function GET(request: NextRequest) {
  try {
    const users = await database.users.findMany();

    return NextResponse.json({
      data: users,
      total: users.length,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
```

#### 2. Hook

```typescript
// features/users/hooks/useUsers.ts

export function useUsers() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      // ✅ Extracts .data
      return json.data;
    },
  });

  return {
    users: data || [],
    total: data?.length || 0,
    isLoading,
    isError,
  };
}
```

#### 4. Layout

```typescript
// features/users/ui/layouts/UserListLayout/index.tsx

export default function UserListLayout() {
  const { users, isLoading } = useUsers(); // ✅ Uses hook

  if (isLoading) return <UserCardSkeleton />;

  return (
    <div>
      {/* ✅ Passes data via props */}
      {users.map((user) => (
        <UserCard key={user.id} {...user} />
      ))}
    </div>
  );
}
```

#### 4. Component

```typescript
// features/users/ui/components/UserCard/index.tsx

export default function UserCard({ firstName, email }: UserCardProps) {
  // ✅ Only renders data received via props
  return (
    <div>
      <h3>{firstName}</h3>
      <p>{email}</p>
    </div>
  );
}
```

---

## ✅ Best Practices

### 1. Always Use Try-Catch in API Functions

```typescript
// ✅ GOOD
export async function fetchData() {
  try {
    return await fetch("/api/data");
  } catch (error) {
    console.error("[apiName] Error:", error);
    throw error;
  }
}

// ❌ BAD
export async function fetchData() {
  return await fetch("/api/data"); // No error handling
}
```

### 2. Always Return isError and error in Hooks

```typescript
// ✅ GOOD
export function useData() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["data"],
    queryFn: fetchData,
  });

  return {
    data: data?.data || [],
    isLoading,
    isError, // ✅ Always
    error, // ✅ Always
  };
}

// ❌ BAD
export function useData() {
  const { data, isLoading } = useQuery({
    queryKey: ["data"],
    queryFn: fetchData,
  });

  return {
    data: data?.data || [],
    isLoading,
    // ❌ Missing isError and error
  };
}
```

### 3. Always Handle 4 States in Layouts

```typescript
// ✅ GOOD
export default function Layout() {
  const { data, isLoading, isError } = useData();

  if (isLoading) return <Skeleton />; // 1️⃣
  if (isError) return <ErrorContent />; // 2️⃣
  if (data.length === 0) return <Empty />; // 3️⃣
  return <Content data={data} />; // 4️⃣
}

// ❌ BAD
export default function Layout() {
  const { data, isLoading } = useData();

  if (isLoading) return <Skeleton />;
  // ❌ Missing: Error and Empty
  return <Content data={data} />;
}
```

---

## ❌ Common Mistakes

### Mistake 1: Extract .data in API Function

```typescript
// ❌ ERROR
export async function fetchUsers() {
  const response = await fetch("/api/users");
  const data = await response.json();
  return data.data; // ❌ Don't extract here!
}

// ✅ CORRECT - In Next.js API Route
export async function GET() {
  const users = await getUsersFromDatabase();
  return NextResponse.json({
    data: users, // ✅ Wrap in { data: ... }
    success: true,
  });
}
```

### Mistake 2: Don't Extract .data in Hook

```typescript
// ❌ ERROR
export function useUsers() {
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const json = await response.json();
      return json.data;
    },
  });
  return { data }; // ❌ Returns raw response
}

// ✅ CORRECT
export function useUsers() {
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const json = await response.json();
      return json.data; // ✅ Extracts .data
    },
  });
  return {
    users: data || [],
    total: data?.length || 0,
  };
}
```

### Mistake 3: Component Fetching Data

```typescript
// ❌ ERROR
export default function UserCard({ id }: { id: string }) {
  const { user } = useUser(id); // ❌ Component using data hook
  return <div>{user?.firstName}</div>;
}

// ✅ CORRECT
export default function UserCard({ firstName }: UserCardProps) {
  return <div>{firstName}</div>; // ✅ Receives via props
}
```

---

## 📋 Checklist

### API Function

- [ ] Documented function with JSDoc?
- [ ] Returns **full** response (doesn't extract .data)?
- [ ] Try-catch with descriptive logs?
- [ ] Correct typing (input and output)?

### Hook

- [ ] Uses React Query (useQuery or useMutation)?
- [ ] Extracts `.data` from response?
- [ ] Transforms data if necessary?
- [ ] Returns ready data + states?
- [ ] Consolidates loading/error when using multiple queries?

### Layout

- [ ] Uses hooks (doesn't call API functions directly)?
- [ ] Handles all states (loading, error, empty, success)?
- [ ] Passes data to components via props?
- [ ] Doesn't do complex transformations?

### Component

- [ ] Receives data via props?
- [ ] Does NOT use data hooks?
- [ ] Does NOT call API functions?
- [ ] Only renders UI?
- [ ] Typed props?

---

## 🎓 Summary

### Data Flow

```
Next.js API Route (handles backend logic)
    ↓
API Function (raw data)
    ↓
Hook (extracts .data + transforms)
    ↓
Layout (uses hook + orchestrates)
    ↓
Component (receives props + renders)
```

### Golden Rules

1. **API Function**: Returns full response (doesn't extract .data)
2. **Hook**: Extracts .data and prepares data for UI
3. **Layout**: Uses hooks and passes data via props
4. **Component**: Only UI, receives props

---

## 📚 Next Steps

Now that you understand the API consumption flow:

→ Review [**Architecture**](./02-ARCHITECTURE.md) to see how to organize code  
→ Check [**State Management**](./05-STATE-MANAGEMENT.md) to handle states properly

---

[← Back: Naming Conventions](./03-NAMING-CONVENTIONS.md) | [Index](./README.md) | [Next: State Management →](./05-STATE-MANAGEMENT.md)

