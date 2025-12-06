# 5. State Management and Lifecycle

> How to manage states with React Query: queries, mutations, and component lifecycles

[← Back: API Consumption](./04-API-CONSUMPTION.md) | [Index](./README.md) | [Next: Notifications →](./06-NOTIFICATIONS.md)

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [The 4 Required States (Queries)](#-the-4-required-states-queries)
3. [Mutation States (Write Operations)](#-mutation-states-write-operations)
4. [Combined States](#-combined-states)
5. [Layer 1: API Functions - Try/Catch](#-layer-1-api-functions---trycatch)
6. [Layer 2: Hooks - Error Propagation](#-layer-2-hooks---error-propagation)
7. [Layer 3: Layouts - State Handling](#-layer-3-layouts---state-handling)
8. [Global Components](#-global-components)
9. [Complete Flow](#-complete-flow)
10. [Best Practices](#-best-practices)

---

## 🎯 Overview

State management follows a **3-layer flow** and distinguishes between:

- **Queries (Read)** - Fetch data (GET)
- **Mutations (Write)** - Create, Update, Delete (POST, PUT, DELETE)

Both have lifecycles and states that must be handled correctly.

### 3-Layer Flow

```
┌─────────────────────────────────────────────────────────┐
│                  API FUNCTION                           │
│  try { ... } catch (error) { throw error }              │
│  ✅ Captures backend error                              │
└────────────────────┬────────────────────────────────────┘
                     │ error propagated
                     ↓
┌─────────────────────────────────────────────────────────┐
│                     HOOK                                │
│  React Query captures error                             │
│  Returns: { isError, error }                            │
└────────────────────┬────────────────────────────────────┘
                     │ states available
                     ↓
┌─────────────────────────────────────────────────────────┐
│                LAYOUT/COMPONENT                         │
│  Handles 4 states: Loading, Error, Empty, Success       │
│  Uses global components for each state                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔢 The 4 Required States (Queries)

> **FUNDAMENTAL RULE:** Every component consuming data (queries) MUST handle 4 states

These states apply to **read operations** (useQuery - GET):

### 1. 🔄 Loading

**When:** Data is being loaded

**How to handle:** Use skeleton component

```typescript
if (isLoading) {
  return <UserCardSkeleton />;
}
```

### 2. ❌ Error

**When:** Request failed or error occurred

**How to handle:** Use `ErrorContent` component

```typescript
if (isError) {
  return (
    <ErrorContent
      title="Error loading data"
      message={error?.message}
    />
  );
}
```

### 3. 📭 Empty

**When:** Request OK but no data

**How to handle:** Use `Empty` from Ant Design

```typescript
import { Empty } from "antd";

if (users.length === 0) {
  return <Empty description="No users found" />;
}
```

### 4. ✅ Success

**When:** Data loaded successfully

**How to handle:** Render content normally

```typescript
return (
  <div>
    {users.map((user) => (
      <UserCard key={user.id} {...user} />
    ))}
  </div>
);
```

### Visual Flow

```
Component renders
       ↓
  isLoading?
    ↓       ↓
  YES      NO
    ↓       ↓
 Loading  isError?
            ↓       ↓
          YES      NO
            ↓       ↓
         Error  data.length === 0?
                  ↓           ↓
                YES          NO
                  ↓           ↓
               Empty       Success
                           (render)
```

---

## ✍️ Mutation States (Write Operations)

> For **create, update, and delete** operations (useMutation - POST, PUT, DELETE)

### Difference: Query vs Mutation

```
┌──────────────────────────────────────────────────────────┐
│                    QUERY (Read)                          │
│  - Fetch data (GET)                                      │
│  - States: isLoading, isError, data                      │
│  - Executes automatically                                │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   MUTATION (Write)                       │
│  - Modify data (POST, PUT, DELETE)                       │
│  - States: isLoading, isSuccess, isError                 │
│  - Executes manually (on button click)                   │
└──────────────────────────────────────────────────────────┘
```

### Mutation States

```typescript
const mutation = useMutation({
  mutationFn: (data) => createProduct(data),
});

// Available states:
mutation.isLoading; // true while executing
mutation.isSuccess; // true when completes successfully
mutation.isError; // true when fails
mutation.error; // error object (if any)
mutation.data; // returned data (if any)
```

### Mutation Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│  1. Initial State (idle)                                │
│     isLoading: false                                    │
│     isSuccess: false                                    │
│     isError: false                                      │
└───────────────────────┬─────────────────────────────────┘
                        ↓
                    User clicks
                        ↓
┌─────────────────────────────────────────────────────────┐
│  2. Executing (loading)                                 │
│     isLoading: true  ← Show loading on button          │
│     isSuccess: false                                    │
│     isError: false                                      │
└───────────────────────┬─────────────────────────────────┘
                        ↓
           Request completes
                ↓               ↓
           SUCCESS           ERROR
                ↓               ↓
┌────────────────────┐  ┌────────────────────┐
│  3a. Success       │  │  3b. Error         │
│  isLoading: false  │  │  isLoading: false  │
│  isSuccess: true ← │  │  isSuccess: false  │
│  isError: false    │  │  isError: true ←   │
└────────────────────┘  └────────────────────┘
```

### Example: Hook for Create Product

```typescript
// features/products/hooks/useManageProduct.ts

export function useManageProduct() {
  const queryClient = useQueryClient();

  // MUTATION: Create product
  const createMutation = useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      // Invalidate queries to update list
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.log("Error creating product:", error);
    },
  });

  // MUTATION: Delete product
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      console.log("Error deleting product:", error);
    },
  });

  return {
    // Functions
    createProduct: (data: CreateProductRequest) =>
      createMutation.mutate(data),
    deleteProduct: (id: string) => deleteMutation.mutate(id),

    // ✅ Creation States
    isLoadingCreate: createMutation.isLoading,
    isSuccessCreate: createMutation.isSuccess,
    isErrorCreate: createMutation.isError,
    errorCreate: createMutation.error,

    // ✅ Deletion States
    isLoadingDelete: deleteMutation.isLoading,
    isSuccessDelete: deleteMutation.isSuccess, // ← IMPORTANT!
    isErrorDelete: deleteMutation.isError,
    errorDelete: deleteMutation.error,
  };
}
```

### States Returned by Mutations

```typescript
// ✅ GOOD - Returns all necessary states
return {
  create: mutation.mutate,
  isLoading: mutation.isLoading, // For button loading
  isSuccess: mutation.isSuccess, // To close modal or show success
  isError: mutation.isError, // To show error
  error: mutation.error, // For specific error message
};

// ❌ BAD - Returns only the function
return {
  create: mutation.mutate,
  // ❌ Missing states!
};
```

### Usage in Component

```typescript
export default function CreateProductForm() {
  const [form] = Form.useForm();
  const { createProduct, isLoadingCreate, isSuccessCreate, isErrorCreate } =
    useManageProduct();

  const handleSubmit = () => {
    const values = form.getFieldsValue();
    createProduct(values);
  };

  // Close modal after success
  useEffect(() => {
    if (isSuccessCreate) {
      setModalOpen(false);
      message.success("Product created successfully!");
    }
  }, [isSuccessCreate]);

  // Show error
  useEffect(() => {
    if (isErrorCreate) {
      message.error("Error creating product");
    }
  }, [isErrorCreate]);

  return (
    <Form form={form}>
      {/* Form fields */}

      <Button
        type="primary"
        onClick={handleSubmit}
        loading={isLoadingCreate} // ← Loading on button
      >
        Save
      </Button>
    </Form>
  );
}
```

---

## 🔀 Combined States

> When to combine multiple states for better visual feedback

### Pattern: Overlay During Deletion

For destructive actions that remove items from list, use combined states to avoid "flash":

```typescript
// ✅ GOOD - Overlay remains until card disappears
<OverlayLoading
  visible={isLoadingDelete || isSuccessDelete}
  message={
    isLoadingDelete ? "Deleting product..." : "Product deleted successfully!"
  }
/>
```

### Why Combine States?

**Problem without `isSuccessDelete`:**

```typescript
// ❌ BAD - Only isLoading
<OverlayLoading visible={isLoadingDelete} message="Deleting..." />

// Flow:
// 1. isLoadingDelete = true  → Overlay appears
// 2. Deletion completes
// 3. isLoadingDelete = false → Overlay DISAPPEARS
// 4. React Query invalidates
// 5. Card disappears
// ⚠️ PROBLEM: User sees normal card between steps 3-5 (FLASH)
```

**Solution with combined states:**

```typescript
// ✅ GOOD - isLoading + isSuccess
<OverlayLoading
  visible={isLoadingDelete || isSuccessDelete}
  message={isLoadingDelete ? "Deleting..." : "Deleted successfully!"}
/>

// Flow:
// 1. isLoadingDelete = true  → Overlay appears
// 2. Deletion completes
// 3. isLoadingDelete = false, isSuccessDelete = true
// 4. Overlay STAYS visible (changes message)
// 5. React Query invalidates
// 6. Card disappears
// ✅ NO FLASH: Overlay remains until the end
```

### Complete Example: Card with Deletion

```typescript
export default function ProductCard({ id, name, ...props }) {
  const { deleteProduct, isLoadingDelete, isSuccessDelete } =
    useManageProduct();
  const [modalOpen, setModalOpen] = useState(false);

  const handleConfirmDelete = async () => {
    await deleteProduct(id);
    setModalOpen(false); // Close modal immediately
  };

  return (
    <div className="relative bg-white rounded-lg shadow p-4">
      {/* OVERLAY: uses combined states */}
      {(isLoadingDelete || isSuccessDelete) && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            {isLoadingDelete && (
              <>
                <Spin />
                <p>Deleting product...</p>
              </>
            )}
            {isSuccessDelete && <p>Product deleted successfully!</p>}
          </div>
        </div>
      )}

      {/* Card content */}
      <h3>{name}</h3>
      <Button danger onClick={() => setModalOpen(true)}>
        Delete
      </Button>

      {/* Confirmation modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleConfirmDelete}
        confirmLoading={isLoadingDelete}
        title="Delete Product"
      >
        Are you sure you want to delete "{name}"?
      </Modal>
    </div>
  );
}
```

### When to Use Combined States

✅ **Use when:**

- Item will be removed from list after action
- Need to avoid content "flash"
- Want to show success feedback before removing
- Overlay should remain until React Query updates

❌ **DON'T use when:**

- Item is not removed (only updated)
- No risk of visual flash
- Success feedback is via toast/notification

---

## 🌐 Layer 1: API Functions - Try/Catch

> **MANDATORY:** Every API function MUST have try-catch

### Standard Structure

```typescript
/**
 * [Description of what it does]
 *
 * @param parameters - Description
 * @returns Full response
 * @throws Error if the request fails
 */
export async function functionName(parameters: Type): Promise<ResponseType> {
  try {
    const response = await fetch(`/api/endpoint`, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Success log
    console.log("[fileName] Success:", relevantInfo);

    return data;
  } catch (error) {
    // Error log with context
    console.error("[fileName] Error:", error, "| Params:", parameters);

    // ✅ IMPORTANT: Propagate error to hook
    throw error;
  }
}
```

### Real Example

```typescript
// app/api/users/route.ts

/**
 * GET /api/users - Fetch users based on filters
 *
 * @param request - Next.js request with query parameters
 * @returns Response with user list
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      name: searchParams.get("name"),
      role: searchParams.get("role"),
    };

    // Query database
    const users = await getUsersFromDatabase(filters);

    console.log(
      "[API /users] Users found:",
      users.length,
      "| Filters:",
      filters
    );

    return NextResponse.json({
      data: users,
      total: users.length,
      success: true,
    });
  } catch (error) {
    // Capture backend error
    console.error(
      "[API /users] Error fetching users:",
      error
    );

    // Return error response
    return NextResponse.json(
      { error: "Failed to fetch users", success: false },
      { status: 500 }
    );
  }
}
```

### What to Do in Catch

```typescript
// ✅ GOOD - Capture, log, and propagate
catch (error) {
    console.error("[API /users] Error:", error);
  throw error; // Propagate to hook
}

// ❌ BAD - Don't propagate
catch (error) {
  console.error(error);
  // ❌ Don't return nothing - hook won't know about error!
}

// ❌ BAD - Return default value
catch (error) {
  return { data: [] }; // ❌ Hides the error!
}

// ❌ BAD - Swallow error
catch (error) {
  // Silent - nothing happens
}
```

---

## 🪝 Layer 2: Hooks - Error Propagation

> Hooks receive errors from API functions via React Query

### Standard Structure

```typescript
export function useHookName(parameters) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["key", parameters],
    queryFn: () => apiFunction(parameters),
    // Optional configurations
    retry: 1, // Try 1x before failing
    onError: (error) => {
      // Optional: custom action on error
      console.error("Error captured in hook:", error);
    },
  });

  return {
    data: data?.data || [],
    total: data?.total || 0,
    isLoading,
    isError, // ✅ Always return
    error, // ✅ Always return
    refetch,
  };
}
```

### Real Example

```typescript
// features/users/hooks/useUsers.ts

/**
 * Hook to fetch and manage users
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
      const json = await response.json();
      return json.data;
    },
    retry: 1, // Try 1x before considering error
    staleTime: 5 * 60 * 1000,
    onError: (error: any) => {
      // Additional log if necessary
      console.error("Error fetching users:", error.message);
    },
  });

  return {
    users: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 10,

    // ✅ ALWAYS return error states
    isLoading,
    isError,
    error,

    refetch,
  };
}
```

### Hook with Mutation

```typescript
// features/users/hooks/useFollowUser.ts

/**
 * Hook to follow/unfollow users
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  const follow = useMutation({
    mutationFn: (userId: string) => followUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries(["users"]);
      // Optional: show success notification
    },
    onError: (error: any) => {
      // Error log
      console.error("Error following user:", error);
      // Optional: show error notification to user
    },
  });

  return {
    follow: follow.mutate,
    isLoading: follow.isLoading,
    isError: follow.isError, // ✅ Return error state
    error: follow.error, // ✅ Return error
  };
}
```

### Retry Configurations

```typescript
// Try multiple times before failing
useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
  retry: 3, // Try 3x
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Don't retry
useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
  retry: false, // Immediate failure
});

// Retry only on some errors
useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
  retry: (failureCount, error: any) => {
    // Don't retry on 404
    if (error.response?.status === 404) return false;
    // Try up to 2x on other errors
    return failureCount < 2;
  },
});
```

---

## 🎨 Layer 3: Layouts - State Handling

> **MANDATORY:** Layouts MUST handle 4 states

### Standard Template

```typescript
import { useEntity } from "@/features/[name]/hooks/useEntity";
import ComponentSkeleton from "../../components/Component/skeleton";
import Component from "../../components/Component";
import ErrorContent from "@/globals/ui/components/ErrorContent";
import { Empty } from "antd";

export default function EntityLayout() {
  // Hook that returns data and states
  const { entities, isLoading, isError, error } = useEntity();

  // 1️⃣ State: Loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        <ComponentSkeleton />
        <ComponentSkeleton />
        <ComponentSkeleton />
      </div>
    );
  }

  // 2️⃣ State: Error
  if (isError) {
    return (
      <ErrorContent
        title="Error loading data"
        message={error?.message || "Unexpected error"}
      />
    );
  }

  // 3️⃣ State: Empty
  if (entities.length === 0) {
    return <Empty description="No results found" />;
  }

  // 4️⃣ State: Success
  return (
    <div className="space-y-4">
      {entities.map((item) => (
        <Component key={item.id} {...item} />
      ))}
    </div>
  );
}
```

### Real Example

```typescript
// features/users/ui/layouts/UserListLayout/index.tsx

import { Empty } from "antd";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useUserFilters } from "@/features/users/hooks/useUserFilters";
import UserCard from "../../components/UserCard";
import UserCardSkeleton from "../../components/UserCard/skeleton";
import UserFilters from "../../components/UserFilters";
import ErrorContent from "@/globals/ui/components/ErrorContent";

export default function UserListLayout() {
  // Fetch filter options
  const {
    roleOptions,
    departmentOptions,
    isLoading: isLoadingOptions,
  } = useUserFilters();

  // Fetch users
  const { users, total, isLoading, isError, error } = useUsers();

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
        {/* 1️⃣ State: Loading */}
        {isLoading && (
          <div className="space-y-4">
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
          </div>
        )}

        {/* 2️⃣ State: Error */}
        {isError && (
          <ErrorContent
            title="Error fetching users"
            message={error?.message || "Error loading data"}
          />
        )}

        {/* 3️⃣ State: Empty */}
        {!isLoading && !isError && users.length === 0 && (
          <Empty description="No users found" />
        )}

        {/* 4️⃣ State: Success */}
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

---

## 🎨 Global Components

### 1. Loading (Skeleton)

Each component should have its own skeleton:

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

**Usage:**

```typescript
if (isLoading) {
  return (
    <>
      <UserCardSkeleton />
      <UserCardSkeleton />
      <UserCardSkeleton />
    </>
  );
}
```

### 2. ErrorContent (Error)

Global component to display errors:

```typescript
// globals/ui/components/ErrorContent/index.tsx

interface ErrorContentProps {
  title?: string;
  message?: string;
}

/**
 * Component to show server errors
 * Used when there's failure loading data from API
 */
export default function ErrorContent({
  title = "Error loading data",
  message = "An error occurred while loading data. Please try again later.",
}: ErrorContentProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-red-500 mb-2">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
```

**Usage:**

```typescript
if (isError) {
  return (
    <ErrorContent
      title="Error fetching users"
      message={error?.message || "Error loading data"}
    />
  );
}

// Or simple usage
if (isError) {
  return <ErrorContent />;
}
```

### 3. Empty (from Ant Design)

Use Ant Design's Empty component:

```typescript
import { Empty } from "antd";

// Basic usage
if (users.length === 0) {
  return <Empty />;
}

// With custom message
if (users.length === 0) {
  return <Empty description="No users found" />;
}

// Dynamic message based on filters
if (users.length === 0) {
  return (
    <Empty
      description={
        hasActiveFilters
          ? "No users found with these filters"
          : "No users registered yet"
      }
    />
  );
}
```

---

## 🔄 Complete Flow

### Example End-to-End: Fetch Users

#### 1. Next.js API Route

```typescript
// app/api/users/route.ts

export async function POST(request: NextRequest) {
  try {
    const filters = await request.json();
    
    const users = await getUsersFromDatabase(filters);
    
    console.log("[API /users] Success:", users.length);
    
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
```

#### 2. Hook

```typescript
// features/users/hooks/useUsers.ts

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
      const json = await response.json();
      return json.data; // Extract .data
    },
    retry: 1,
  });

  return {
    users: data || [],
    total: data?.length || 0,
    isLoading, // ✅ Returns
    isError, // ✅ Returns
    error, // ✅ Returns
    refetch,
  };
}
```

#### 3. Layout

```typescript
// features/users/ui/layouts/UserListLayout/index.tsx

export default function UserListLayout() {
  const { users, isLoading, isError, error, refetch } = useUsers();

  // 1️⃣ Loading
  if (isLoading) return <UserCardSkeleton />;

  // 2️⃣ Error
  if (isError) return <ErrorContent error={error} onRetry={refetch} />;

  // 3️⃣ Empty
  if (users.length === 0) return <Empty description="No users found" />;

  // 4️⃣ Success
  return (
    <div>
      {users.map((u) => (
        <UserCard key={u.id} {...u} />
      ))}
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
  return await fetch("/api/data"); // No handling
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

## 📋 Checklist

### API Function

- [ ] Has try-catch?
- [ ] Logs error with context `[fileName]`?
- [ ] Propagates error with `throw error`?
- [ ] Doesn't return default value in catch?

### Hook

- [ ] Uses React Query (useQuery/useMutation)?
- [ ] Returns `isLoading`?
- [ ] Returns `isError`?
- [ ] Returns `error`?
- [ ] Returns `refetch` (when applicable)?

### Layout/Component

- [ ] Handles Loading state?
- [ ] Handles Error state?
- [ ] Handles Empty state?
- [ ] Renders Success?
- [ ] Uses global components (skeleton, ErrorContent, Empty)?

---

## 🎓 Summary

### Golden Rules

1. **API Function**: ALWAYS use try-catch and propagate error
2. **Hook**: ALWAYS return isError and error
3. **Layout**: ALWAYS handle 4 states
4. **Global Components**: ALWAYS use (skeleton, ErrorContent, Empty)

### Error Flow

```
Backend returns error
      ↓
API function captures in catch
      ↓
API function propagates with throw
      ↓
React Query captures
      ↓
Hook returns isError + error
      ↓
Layout handles and displays ErrorContent
```

### The 4 States

```
1️⃣ Loading  →  Component skeleton
2️⃣ Error    →  ErrorContent (global)
3️⃣ Empty    →  Empty (Ant Design)
4️⃣ Success  →  Render normal content
```

---

## 📚 Next Steps

Now that you understand state management:

→ Review [**API Consumption**](./04-API-CONSUMPTION.md) for complete flow  
→ Check [**Notifications**](./06-NOTIFICATIONS.md) for user feedback  
→ See [**Architecture**](./02-ARCHITECTURE.md) to organize components

---

[← Back: API Consumption](./04-API-CONSUMPTION.md) | [Index](./README.md) | [Next: Notifications →](./06-NOTIFICATIONS.md)

