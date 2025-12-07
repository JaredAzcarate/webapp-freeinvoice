# 3. Naming Conventions

> Naming patterns and code conventions for consistency

[← Back: Architecture](./02-ARCHITECTURE.md) | [Index](./README.md) | [Next: API Consumption →](./04-API-CONSUMPTION.md)

---

## 📋 Table of Contents

1. [General Rules](#-general-rules)
2. [Files and Folders](#-files-and-folders)
3. [React Components](#-react-components)
4. [Hooks](#-hooks)
5. [API Functions](#-api-functions)
6. [Types](#-types)
7. [Utils](#-utils)
8. [Variables and Functions](#-variables-and-functions)
9. [CSS and Styles](#-css-and-styles)
10. [Imports](#-imports)
11. [Comments and Documentation](#-comments-and-documentation)

---

## 🎯 General Rules

### Language

**ALWAYS use ENGLISH** for:

- ✅ Variable names
- ✅ Function names
- ✅ Component names
- ✅ File names
- ✅ CSS class names
- ✅ Comments
- ✅ Documentation

**Exceptions** (remain as is):

- External libraries (React, Next.js, etc)
- Technical words without clear translation (hooks, props, state)
- npm package names

### Case Styles

| Context              | Pattern    | Example        |
| -------------------- | ---------- | -------------- |
| **Files**            | camelCase  | `userCard.tsx` |
| **Folders**          | camelCase  | `userFilters/` |
| **Components**       | PascalCase | `UserCard`     |
| **Hooks**            | camelCase  | `useUsers`     |
| **Functions**        | camelCase  | `fetchUsers`   |
| **Variables**        | camelCase  | `userList`     |
| **Constants**        | camelCase  | `maxItems`     |
| **Types/Interfaces** | PascalCase | `UserSummary`  |
| **CSS Classes**      | camelCase  | `.userCard`    |

---

## 📁 Files and Folders

### Golden Rule

> **The file name should EXACTLY reflect what it exports**

### Components

```typescript
// ✅ GOOD
UserCard.tsx            → export default function UserCard()
userFilters.tsx         → export default function UserFilters()
ButtonBase.tsx          → export default function ButtonBase()

// ❌ BAD
user-card.tsx           → kebab-case
USERCARD.tsx            → UPPERCASE
card.tsx                → Too generic
```

### Hooks

```typescript
// ✅ GOOD
useUsers.ts             → export function useUsers()
useUserFilters.ts       → export function useUserFilters()
useQueryParams.ts       → export function useQueryParams()

// ❌ BAD
users-hook.ts           → kebab-case
UsersHook.ts            → PascalCase
hookUsers.ts            → Wrong prefix (must be "use")
```

### Types

```typescript
// ✅ GOOD
apiTypesUser.ts         → FetchUsersParams, FetchUsersResponse
apiTypesProduct.ts      → FetchProductsParams, ProductResponse

// ❌ BAD
users.types.ts          → Wrong format
UsersTypes.ts           → PascalCase
types.ts                → Too generic (in features/)
```

### Utils

```typescript
// ✅ GOOD
formatUserFilters.ts    → Verb + context
mapUserFilters.ts       → Verb + context
formatPhone.ts          → Verb + what
calculateAge.ts         → Verb + what

// ❌ BAD
user-filters.ts         → kebab-case
usersUtils.ts           → Suffix instead of prefix
utils.ts                → Too generic
```

### Folders

```typescript
// ✅ GOOD - camelCase, descriptive
features/users/
features/products/
ui/components/UserCard/
ui/layouts/UserListLayout/

// ❌ BAD
features/Users/              → PascalCase
features/users-feature/      → kebab-case + redundancy
ui/components/user-card/     → kebab-case
```

---

## ⚛️ React Components

### Naming Pattern

```
[Type][Action?][Entity][Context?]
```

**Parts:**

- **type**: Card, Button, Input, Filter, Modal, etc
- **action** (optional): Edit, Create, Delete, etc
- **entity**: User, Product, Post, etc
- **context** (optional): Modal, Mobile, etc

### Compound Components

```typescript
// ✅ GOOD - Pattern: type + action + entity + context
UserCard; // User card
OrderSummaryCard; // Order summary card
ButtonEdit; // Edit button
ButtonClearFilters; // Button to clear filters
ModalCreateProduct; // Modal to create product
ProductFilters; // Product filters
FormEditProfile; // Form to edit profile

// ❌ BAD
CardUser; // Wrong order
Card; // Too generic
CardToDisplayUser; // Too verbose
user_card; // Wrong case
```

### Pure Visual Elements (Base)

```typescript
// ✅ GOOD - Generic/base components
ButtonBase; // Generic button
CardBase; // Generic card
InputBase; // Generic input
TagBase; // Generic tag

// ❌ BAD
BaseButton; // Wrong order
GenericButton; // Redundant
Btn; // Abbreviation
```

### Layouts

```typescript
// ✅ GOOD - Pattern: layout + entity + context
UserListLayout; // User list layout
ProductListLayout; // Product list layout
OrderDetailLayout; // Order detail layout
CreateProductLayout; // Product creation layout

// ❌ BAD
UsersLayout; // Missing specificity
UserList; // Missing "layout" prefix
PageLayout; // Too generic
```

### Components with Skeleton

```typescript
// Recommended structure
UserCard/
├── index.tsx                // Main component
├── skeleton.tsx             // Skeleton version
├── types.ts
└── UserCard.module.css

// ✅ GOOD - Skeleton in separate file
export default function UserCardSkeleton() { }

// ❌ BAD
export function UserCardLoading() { }  // Inconsistent name
```

---

## 🪝 Hooks

### Pattern

```
use[Entity][Complement?]
```

### Data Hooks

```typescript
// ✅ GOOD - Fetch/manage entity data
useUsers(); // Fetch users
useProducts(); // Fetch products
useUserFilters(); // Fetch filter options
useCompanyBenefits(); // Fetch company benefits

// ❌ BAD
getUsers(); // Not a hook (missing "use")
hookUsers(); // Wrong prefix
useFetchUsers(); // Redundant
```

### Behavior Hooks

```typescript
// ✅ GOOD - Manage behavior/state
useQueryParams(); // Manage query params
useLoadMore(); // Load more logic
useSearchAndSort(); // Search and sort logic
useNotification(); // Notifications

// ❌ BAD
useParams(); // Too generic (conflicts with Next.js)
loadMore(); // Not a hook
useGetQueryParams(); // Redundant
```

### Specific vs Generic Hooks

```typescript
// ✅ Features - Specific hooks
features / users / hooks / useUsers.ts;
features / products / hooks / useProducts.ts;

// ✅ Shared - Generic hooks
shared / hooks / useQueryParams.ts;
shared / hooks / useLocations.ts;
shared / hooks / useLoadMore.ts;
```

### Hooks with Clear Action

```typescript
// ✅ GOOD - Clear action in name

// Fetch/Get data
useFetchUsers(); // or useUsers()
useGetProducts(); // or useProducts()
useLoadPosts(); // or usePosts()

// Create/Update/Delete
useCreateUser();
useUpdateProduct();
useDeletePost();

// Manage/Handle
useManageCart();
useHandlePayment();
useControlModal();
```

---

## 🌐 Next.js API Routes

### Pattern

API routes are located in `app/api/[endpoint]/route.ts` and follow RESTful conventions.

### Route Naming

```typescript
// ✅ GOOD - RESTful endpoints
app / api / users / route.ts; // GET /api/users, POST /api/users
app / api / users / [id] / route.ts; // GET /api/users/:id, PUT /api/users/:id
app / api / users / [id] / follow / route.ts; // POST /api/users/:id/follow

// ❌ BAD
app / api / getUsers / route.ts; // Avoid verbs in route names
app / api / user / route.ts; // Use plural for resources
```

### HTTP Methods in Route Handlers

```typescript
// app/api/users/route.ts
export async function GET() {} // Fetch users
export async function POST() {} // Create user

// app/api/users/[id]/route.ts
export async function GET() {} // Get user by ID
export async function PUT() {} // Update user
export async function DELETE() {} // Delete user
```

---

## 🎯 Types

### Interfaces and Types

```typescript
// ✅ GOOD - Clear, descriptive names

// API Types
export interface FetchUsersParams {}
export interface FetchUsersResponse {}
export interface CreateUserRequest {}
export interface CreateUserResponse {}

// Domain Types
export interface User {}
export interface UserSummary {}
export interface UserDetail {}
export interface UserProfile {}

// Component Props
export interface UserCardProps {}
export interface ProductFiltersProps {}

// Form Types
export interface UserFormValues {}
export interface ProductFormData {}

// ❌ BAD
export interface IUser {} // Hungarian notation
export interface user {} // camelCase
export interface UserType {} // Redundant suffix
export interface TUser {} // Unnecessary prefix
```

### Naming by Context

```typescript
// API requests/responses
FetchUsersParams;
FetchUsersResponse;
CreateProductRequest;
CreateProductResponse;

// UI/Component
UserCardProps;
ProductListProps;
FilterOptions;

// Forms
UserFormValues;
ProductFormData;
LoginFormFields;

// States
UserListState;
ProductDetailState;
CartState;
```

---

## 🔧 Utils

### Pattern

```
[verb][Entity][Complement?]
```

### Formatting Functions

```typescript
// ✅ GOOD
formatUserFilters(); // Format user filters
formatPhone(); // Format phone number
formatDate(); // Format date
formatCurrency(); // Format currency
formatUserName(); // Format user name

// ❌ BAD
userFiltersFormat(); // Wrong order
formatter(); // Too generic
fmt(); // Abbreviation
```

### Mapping Functions

```typescript
// ✅ GOOD
mapUsersToOptions(); // Map users to options
mapRolesToSelectItems(); // Map roles to select
mapProductsToCards(); // Map products to cards

// ❌ BAD
usersMapper(); // Wrong order
map(); // Too generic
toOptions(); // Missing entity
```

### Validation Functions

```typescript
// ✅ GOOD
validateEmail(); // Validate email
validatePhoneNumber(); // Validate phone
isValidUser(); // Check if user is valid
hasPermission(); // Check permission

// ❌ BAD
emailValidator(); // Noun instead of verb
check(); // Too generic
valid(); // Unclear
```

### Calculation Functions

```typescript
// ✅ GOOD
calculateTotal(); // Calculate total
calculateDiscount(); // Calculate discount
calculateAge(); // Calculate age
computeTax(); // Compute tax

// ❌ BAD
total(); // No verb
getTotal(); // Use calculate for computations
doCalculation(); // Too generic
```

---

## 📝 Variables and Functions

### Variables

```typescript
// ✅ GOOD - Descriptive camelCase
const userList = [];
const selectedUser = null;
const isLoading = false;
const hasPermission = true;
const itemCount = 0;

// ❌ BAD
const list = []; // Too generic
const user_list = []; // snake_case
const UserList = []; // PascalCase
const ul = []; // Abbreviation
```

### Boolean Variables

```typescript
// ✅ GOOD - Use is/has/should/can prefix
const isLoading = true;
const hasError = false;
const shouldRender = true;
const canEdit = false;
const isVisible = true;
const hasPermission = false;

// ❌ BAD
const loading = true; // No prefix
const error = false; // Ambiguous
const visible = true; // No prefix
```

### Constants

```typescript
// ✅ GOOD
const maxItemsPerPage = 10;
const defaultTimeout = 5000;
const apiBaseUrl = "https://api.example.com";

// ❌ BAD
const MAX_ITEMS_PER_PAGE = 10; // SCREAMING_SNAKE_CASE (use for true constants)
const max_items = 10; // snake_case
```

### Arrays

```typescript
// ✅ GOOD - Plural form
const users = [];
const products = [];
const selectedItems = [];

// ❌ BAD
const user = []; // Singular for array
const userArray = []; // Redundant suffix
const listOfUsers = []; // Verbose
```

### Functions

```typescript
// ✅ GOOD - Verb + noun
function fetchUsers() {}
function createProduct() {}
function handleSubmit() {}
function validateForm() {}

// ❌ BAD
function users() {} // No verb
function create() {} // No noun
function handleIt() {} // Unclear
```

---

## 🎨 CSS and Styles

### Tailwind Classes

```tsx
// ✅ GOOD - Descriptive, organized
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <Avatar size={64} />
  <div className="flex-1">
    <h3 className="text-lg font-semibold">Name</h3>
    <p className="text-sm text-gray-600">Description</p>
  </div>
</div>

// ❌ BAD - Unorganized, hardcoded values
<div className="flex p-6 shadow-md items-center rounded-lg bg-white gap-4">
  <div style={{ width: "200px" }}>  {/* Avoid inline styles */}
```

### CSS Modules (if used)

```scss
// UserCard.module.css

// ✅ GOOD
.userCard {
}
.userCardHeader {
}
.userCardContent {
}
.userCardActions {
}

// ❌ BAD
.user-card {
} // kebab-case
.UserCard {
} // PascalCase
.card {
} // Too generic
```

---

## 📦 Imports

### Import Order

```typescript
// ✅ GOOD - Organized by source

// 1. External libraries
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Modal } from "antd";

// 2. Internal - Absolute imports (@/)
import { useUsers } from "@/features/users/hooks/useUsers";
import ButtonBase from "@/shared/ui/components/ButtonBase";

// 3. Internal - Relative imports
import UserCard from "../../components/UserCard";
import { formatUserName } from "../../utils/formatUser";

// 4. Types
import type { User, UserCardProps } from "./types";

// 5. Styles
import styles from "./UserList.module.css";
```

### Path Mapping

```typescript
// ✅ GOOD - Use @ alias for absolute imports
import { useUsers } from "@/features/users/hooks/useUsers";
import ButtonBase from "@/shared/ui/components/ButtonBase";
import { formatPhone } from "@/shared/utils/formatPhone";

// ❌ BAD - Deep relative paths
import { useUsers } from "../../../features/users/hooks/useUsers";
import ButtonBase from "../../../../shared/ui/components/ButtonBase";
```

---

## 💬 Comments and Documentation

### JSDoc for Functions

````typescript
// ✅ GOOD - Complete documentation
/**
 * Fetch users based on search filters
 *
 * @param filters - Search parameters (name, role, etc)
 * @returns Promise with user list and pagination info
 * @throws Error if the request fails
 *
 * @example
 * ```ts
 * const users = await fetchUsers({ name: "John", role: "admin" });
 * ```
 */
export async function fetchUsers(
  filters: FetchUsersParams
): Promise<FetchUsersResponse> {
  // Implementation
}

// ❌ BAD - No documentation
export async function fetchUsers(filters: FetchUsersParams) {
  // Implementation
}
````

### Inline Comments

```typescript
// ✅ GOOD - Explain WHY, not WHAT
// Transform API format (CSV) to UI format (array)
const roles = response.roles?.split(",") || [];

// Prevent duplicate submissions during API call
if (isLoading) return;

// ❌ BAD - Obvious comments
// Set loading to true
setLoading(true);

// Map users
users.map((u) => u.name);
```

### Component Documentation

````typescript
// ✅ GOOD
/**
 * Card component to display user summary information
 *
 * @component
 * @example
 * ```tsx
 * <UserCard
 *   id="123"
 *   firstName="John"
 *   lastName="Doe"
 *   email="john@example.com"
 *   onClick={() => console.log("clicked")}
 * />
 * ```
 */
export default function UserCard({
  id,
  firstName,
  lastName,
  email,
  onClick,
}: UserCardProps) {
  // Implementation
}
````

### TODO Comments

```typescript
// ✅ GOOD - Specific and actionable
// TODO: Add loading state for better UX
// TODO: Handle error case when API returns 404
// FIXME: This causes infinite loop on empty array

// ❌ BAD - Vague
// TODO: fix this
// TODO: improve
```

---

## 📋 Quick Reference

### File Naming Cheat Sheet

| Type      | Pattern                   | Example                  |
| --------- | ------------------------- | ------------------------ |
| Component | `[Name].tsx`              | `UserCard.tsx`           |
| Hook      | `use[Name].ts`            | `useUsers.ts`            |
| API Route | `app/api/[name]/route.ts` | `app/api/users/route.ts` |
| Type      | `apiTypes[Name].ts`       | `apiTypesUser.ts`        |
| Util      | `[verb][Name].ts`         | `formatUser.ts`          |
| Layout    | `[Name]Layout.tsx`        | `UserListLayout.tsx`     |

### Component Naming Cheat Sheet

| Pattern                 | Example              | Usage                |
| ----------------------- | -------------------- | -------------------- |
| `[Entity]Card`          | `UserCard`           | Display entity       |
| `[Entity]List`          | `ProductList`        | List of entities     |
| `[Entity]Filters`       | `UserFilters`        | Filter entities      |
| `Modal[Action][Entity]` | `ModalCreateProduct` | Modal for action     |
| `Button[Action]`        | `ButtonEdit`         | Action button        |
| `Form[Action][Entity]`  | `FormEditProfile`    | Form for action      |
| `[Name]Base`            | `ButtonBase`         | Base/generic variant |

---

## 📚 Next Steps

→ [**API Consumption**](./04-API-CONSUMPTION.md) - Learn the data flow with Next.js API routes

---

[← Back: Architecture](./02-ARCHITECTURE.md) | [Index](./README.md) | [Next: API Consumption →](./04-API-CONSUMPTION.md)
