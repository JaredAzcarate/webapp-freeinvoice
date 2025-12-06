# 1. Fundamental Principles

> The architectural principles that guide our development decisions

[← Back to Index](./README.md) | [Next: Architecture →](./02-ARCHITECTURE.md)

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [SOLID](#-solid)
3. [Clean Architecture](#-clean-architecture)
4. [Domain-Driven Design](#-domain-driven-design)
5. [Separation of Concerns](#-separation-of-concerns)
6. [DRY - Don't Repeat Yourself](#-dry---dont-repeat-yourself)
7. [Practical Application](#-practical-application)

---

## 🎯 Overview

These principles are the **fundamental rules** that guide how we write and organize code. They ensure:

- ✅ **Clean and maintainable code**
- ✅ **Easy comprehension** by new developers
- ✅ **Testability** and quality
- ✅ **Project scalability**
- ✅ **Efficient collaboration** within the team

---

## 🔷 SOLID

SOLID is an acronym for five object-oriented software design principles. We apply these concepts in React/TypeScript:

### **S - Single Responsibility Principle (SRP)**

> Each module/file should have a single, well-defined responsibility.

#### ✅ Good Example

```typescript
// ❌ BAD - UserCard doing too many things
export default function UserCard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetches data
    setLoading(true);
    fetch("/api/users")
      .then((response) => response.json())
      .then((data) => {
        // Transforms data
        const formatted = data.map((u) => ({
          ...u,
          fullName: `${u.firstName} ${u.lastName}`,
        }));
        setUsers(formatted);
      })
      .finally(() => setLoading(false));
  }, []);

  // Renders UI
  return <div>{/* ... */}</div>;
}
```

```typescript
// ✅ GOOD - Each file with one responsibility

// 1. Next.js API Route - responsible only for backend logic
// app/api/users/route.ts
export async function GET() {
  // Backend logic, database queries, etc.
  const users = await getUsersFromDatabase();
  return NextResponse.json({ data: users });
}

// 2. Hook - responsible only for managing state and calling endpoints
// features/users/hooks/useUsers.ts
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      return response.json();
    },
  });
}

// 3. Util - responsible only for transforming data
// features/users/utils/formatUser.ts
export function formatUserName(user: User) {
  return `${user.firstName} ${user.lastName}`;
}

// 4. Component - responsible only for rendering UI
// features/users/ui/components/UserCard/index.tsx
export default function UserCard() {
  const { data: users } = useUsers();

  return (
    <div>
      {users?.map((u) => (
        <span key={u.id}>{formatUserName(u)}</span>
      ))}
    </div>
  );
}
```

#### 📊 Benefits

- Easy to test each part separately
- Easy to find where to make changes
- Code reusability

---

### **O - Open/Closed Principle (OCP)**

> Modules should be open for extension but closed for modification.

#### ✅ Good Example

```typescript
// ❌ BAD - Need to modify component to add new types
export default function Button({
  variant,
}: {
  variant: "primary" | "secondary";
}) {
  if (variant === "primary") {
    return <button className="btn-primary">Click</button>;
  } else if (variant === "secondary") {
    return <button className="btn-secondary">Click</button>;
  }
  // If adding 'tertiary', need to modify this function
}
```

```typescript
// ✅ GOOD - Can extend without modifying
export default function ButtonBase({
  className,
  children,
  ...props
}: ButtonBaseProps) {
  return (
    <button className={`btn-base ${className}`} {...props}>
      {children}
    </button>
  );
}

// Extension without modifying ButtonBase
export function ButtonPrimary(props: ButtonProps) {
  return <ButtonBase className="btn-primary" {...props} />;
}

export function ButtonSecondary(props: ButtonProps) {
  return <ButtonBase className="btn-secondary" {...props} />;
}
```

---

### **L - Liskov Substitution Principle (LSP)**

> Objects of a derived class should be able to replace objects of the base class without altering program behavior.

#### ✅ React Example

```typescript
// Base interface
interface CardProps {
  title: string;
  description: string;
  onClick?: () => void;
}

// Base component
export function CardBase({ title, description, onClick }: CardProps) {
  return (
    <div onClick={onClick} className="card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// Extensions that maintain the contract
export function UserCard({ name, bio, onClick }: UserCardProps) {
  // Can be used where CardBase is expected
  return <CardBase title={name} description={bio} onClick={onClick} />;
}

export function ProductCard({ name, description, onClick }: ProductCardProps) {
  // Can be used where CardBase is expected
  return <CardBase title={name} description={description} onClick={onClick} />;
}
```

---

### **I - Interface Segregation Principle (ISP)**

> Clients should not be forced to depend on interfaces they don't use.

#### ✅ Good Example

```typescript
// ❌ BAD - Interface too large, forcing components to implement everything
interface CardProps {
  title: string;
  description: string;
  image?: string;
  tags?: string[];
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  // ... many other props not every card uses
}

// ✅ GOOD - Segregated interfaces
interface CardBaseProps {
  title: string;
  description: string;
}

interface CardWithImageProps extends CardBaseProps {
  image: string;
}

interface CardWithTagsProps extends CardBaseProps {
  tags: string[];
}

interface CardCompleteProps extends CardWithImageProps, CardWithTagsProps {
  actions: React.ReactNode;
}
```

---

### **D - Dependency Inversion Principle (DIP)**

> High-level modules should not depend on low-level modules. Both should depend on abstractions.

#### ✅ Good Example

```typescript
// ❌ BAD - Component depending directly on specific implementation
export default function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Direct dependency on API
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
  }, []);

  return <div>{/* ... */}</div>;
}

// ✅ GOOD - Component depends on abstraction (hook)
export default function UserList() {
  // Depends on abstraction (hook), not implementation
  const { users } = useUsers();

  return <div>{/* ... */}</div>;
}

// Implementation can change (fetch, axios, different endpoint)
// without affecting the component
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const json = await response.json();
      return json.data;
    },
  });
}
```

---

## 🏛️ Clean Architecture

Clean Architecture organizes code into layers with **unidirectional dependencies**.

### Layers in Our Application

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                           │
│  (Pages, Layouts, Components)                           │
│  - Rendering                                            │
│  - User interaction                                     │
└───────────────────┬─────────────────────────────────────┘
                    │ depends on ↓
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                    │
│  (Hooks, State Management)                              │
│  - State management                                     │
│  - Presentation logic                                   │
└───────────────────┬─────────────────────────────────────┘
                    │ depends on ↓
┌─────────────────────────────────────────────────────────┐
│                    Business Layer                       │
│  (Utils, Formatters, Validators)                        │
│  - Business rules                                       │
│  - Data transformations                                 │
└───────────────────┬─────────────────────────────────────┘
                    │ depends on ↓
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                         │
│  (API Functions, Next.js Routes)                        │
│  - Backend communication                                │
│  - Data persistence                                     │
└─────────────────────────────────────────────────────────┘
```

### Rules

1. **Higher layers** can depend on **lower layers**
2. **Lower layers** CANNOT depend on **higher layers**
3. Each layer has clear responsibilities

### Practical Example

```typescript
// ❌ BAD - Violating dependencies
// API function (low layer) importing component (high layer)
import { showNotification } from "@/components/notification";

export async function fetchUsers() {
  const data = await fetch("/api/users");
  showNotification("Users loaded!"); // ❌ No!
  return data;
}

// ✅ GOOD - Respecting dependencies
// API function only returns data
export async function fetchUsers() {
  const response = await fetch("/api/users");
  return response;
}

// Hook (higher layer) handles notification
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const json = await response.json();
      return json.data;
    },
    onSuccess: () => {
      showNotification("Users loaded!"); // ✅ Correct!
    },
  });
}
```

---

## 🎯 Domain-Driven Design (DDD)

We organize code by **business domain**, not by technical type.

### ❌ Organization by Technical Type (avoid)

```
src/
├── components/      # ALL components mixed
│   ├── UserCard.tsx
│   ├── ProductCard.tsx
│   ├── UserFilters.tsx
│   └── ProductFilters.tsx
├── hooks/           # ALL hooks mixed
│   ├── useUsers.ts
│   └── useProducts.ts
└── api/             # ALL API routes mixed
    ├── users/route.ts
    └── products/route.ts
```

### ✅ Organization by Domain (use)

```
features/
├── users/           # Everything related to USERS
│   ├── hooks/
│   ├── types/
│   └── ui/
└── products/        # Everything related to PRODUCTS
    ├── hooks/
    ├── types/
    └── ui/

app/
└── api/             # All API routes
    ├── users/route.ts
    └── products/route.ts
```

### Benefits

- **Cohesion**: Related code stays together
- **Maintainability**: Easy to find and modify
- **Scalability**: Add new domains without affecting others
- **Teamwork**: Each developer can work on a domain

---

## 🔀 Separation of Concerns

We separate concerns into **distinct layers**.

### Layers in Our Application

```
types/      → WHAT the data represents
app/api/    → WHERE to fetch/send data (Next.js API routes)
utils/      → HOW to transform data
hooks/      → WHEN and HOW to manage state (call app/api/...)
ui/         → HOW to display data
```

### Complete Example

```typescript
// 1. TYPES - Define data structure
// features/users/types/apiTypesUser.ts
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// 2. NEXT.JS API ROUTE - Backend endpoint
// app/api/users/route.ts
export async function GET() {
  const users = await getUsersFromDatabase();
  return NextResponse.json({ data: users });
}

// 3. UTIL - Transform data
// features/users/utils/formatUser.ts
export function formatUserEmail(user: User): string {
  return user.email.toLowerCase();
}

// 4. HOOK - Manage state and call endpoint
// features/users/hooks/useUsers.ts
export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const data = await response.json();
      return data.data; // Extract .data from response
    },
  });
}

// 5. UI - Render
// features/users/ui/components/UserCard/index.tsx
export default function UserCard({ user }: UserCardProps) {
  const formattedEmail = formatUserEmail(user);

  return (
    <div>
      <h3>{user.firstName} {user.lastName}</h3>
      <p>{formattedEmail}</p>
    </div>
  );
}
```

---

## 🚫 DRY - Don't Repeat Yourself

We avoid code duplication through **reusability**.

### When to Extract for Reusability

#### 1. **Utils** - Functions used 2+ times

```typescript
// ❌ BAD - Duplicating logic
function ComponentA() {
  const formatted = value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

function ComponentB() {
  const formatted = value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

// ✅ GOOD - Reusing function
// globals/utils/formatPhone.ts
export function formatPhone(phone: string): string {
  return phone
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

function ComponentA() {
  const formatted = formatPhone(value);
}

function ComponentB() {
  const formatted = formatPhone(value);
}
```

#### 2. **Hooks** - State logic used in multiple components

```typescript
// ❌ BAD - Duplicating query params logic
function ComponentA() {
  const router = useRouter();
  const filter = router.query.filter as string;

  const setFilter = (value: string) => {
    router.push({ pathname: router.pathname, query: { filter: value } });
  };
}

function ComponentB() {
  const router = useRouter();
  const filter = router.query.filter as string;

  const setFilter = (value: string) => {
    router.push({ pathname: router.pathname, query: { filter: value } });
  };
}

// ✅ GOOD - Reusable hook
// globals/hooks/useQueryParams.ts
export function useQueryParams() {
  const router = useRouter();

  const getQueryParam = (key: string) => router.query[key] as string;
  const setQueryParam = (key: string, value: string) => {
    router.push({ pathname: router.pathname, query: { [key]: value } });
  };

  return { getQueryParam, setQueryParam };
}

function ComponentA() {
  const { getQueryParam, setQueryParam } = useQueryParams();
  const filter = getQueryParam("filter");
}

function ComponentB() {
  const { getQueryParam, setQueryParam } = useQueryParams();
  const filter = getQueryParam("filter");
}
```

#### 3. **Components** - UI used in 3+ places

```typescript
// ❌ BAD - Duplicating button structure
function ComponentA() {
  return (
    <button className="btn-primary flex items-center gap-2" onClick={handleClick}>
      <SaveIcon />
      <span>Save</span>
    </button>
  );
}

function ComponentB() {
  return (
    <button className="btn-primary flex items-center gap-2" onClick={handleSend}>
      <SendIcon />
      <span>Send</span>
    </button>
  );
}

// ✅ GOOD - Reusable component
// globals/ui/components/ButtonBase/index.tsx
export default function ButtonBase({ icon, text, onClick }: ButtonBaseProps) {
  return (
    <button className="btn-primary flex items-center gap-2" onClick={onClick}>
      {icon && <span>{icon}</span>}
      <span>{text}</span>
    </button>
  );
}

function ComponentA() {
  return <ButtonBase icon={<SaveIcon />} text="Save" onClick={handleClick} />;
}

function ComponentB() {
  return <ButtonBase icon={<SendIcon />} text="Send" onClick={handleSend} />;
}
```

---

## 💡 Practical Application

### Checklist: Are You Following the Principles?

Before committing, ask yourself:

#### SRP

- [ ] Does each file have ONE responsibility?
- [ ] Did I separate api, hooks, utils, and UI?

#### OCP

- [ ] Can I extend without modifying existing code?
- [ ] Did I use composition instead of conditionals?

#### LSP

- [ ] Do my extensions respect the base contract?

#### ISP

- [ ] Are my interfaces focused and specific?
- [ ] Are components not forced to implement unnecessary props?

#### DIP

- [ ] Do components depend on hooks (abstractions), not direct APIs?
- [ ] Are higher layers not imported by lower layers?

#### Clean Architecture

- [ ] Did I respect dependency flow (UI → Hooks → Utils → API)?

#### DDD

- [ ] Did I organize by business domain?
- [ ] Is related code together?

#### Separation of Concerns

- [ ] Are types, api, hooks, and UI separated?

#### DRY

- [ ] Did I extract duplicated code into utils/hooks/components?

---

## 📚 Next Steps

Now that you understand the fundamental principles:

→ [**Architecture**](./02-ARCHITECTURE.md) - See how we apply these principles in practice

---

[← Back to Index](./README.md) | [Next: Architecture →](./02-ARCHITECTURE.md)

