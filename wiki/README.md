# Architecture Wiki - Next.js + Tailwind + React Query + Ant Design

> A comprehensive guide for building scalable, maintainable front-end applications with modern technologies

---

## 🎯 Technology Stack

This wiki is specifically designed for projects using:

- **Next.js** (App Router) - React framework with API routes
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **Ant Design** - React UI component library

---

## 📚 Wiki Contents

### [1. Principles](./01-PRINCIPLES.md)

Learn the fundamental architectural principles that guide our decisions:

- **SOLID** (SRP, OCP, LSP, ISP, DIP)
- **Clean Architecture**
- **Domain-Driven Design (DDD)**
- **Separation of Concerns**
- **DRY (Don't Repeat Yourself)**

[📖 Read Principles →](./01-PRINCIPLES.md)

---

### [2. Architecture](./02-ARCHITECTURE.md)

Understand how to organize code and structure features:

- **Features vs Globals** - When to use each
- **Folder Structure** - Standard organization
- **Data Flow** - How layers communicate
- **Components and Layouts** - Differences and usage
- **Hooks** - React Query integration with Next.js API routes

[📖 Read Architecture →](./02-ARCHITECTURE.md)

---

### [3. Naming Conventions](./03-NAMING-CONVENTIONS.md)

Learn naming patterns and code conventions:

- **Files and Folders** - Naming rules
- **Components** - Naming patterns
- **Hooks, API Functions, and Utils** - Conventions
- **Variables and Functions** - Code style
- **CSS Classes** - Tailwind patterns
- **Imports** - Organization and path mapping

[📖 Read Naming Conventions →](./03-NAMING-CONVENTIONS.md)

---

### [4. API Consumption](./04-API-CONSUMPTION.md)

Understand the correct flow for consuming APIs:

- **Next.js API Routes** - Backend endpoint creation (`app/api/.../route.ts`)
- **Hooks** - React Query integration, calling endpoints directly
- **Layouts** - Orchestrating components
- **Components** - Pure UI with props
- **Complete Examples** - End-to-end flow

[📖 Read API Consumption →](./04-API-CONSUMPTION.md)

---

### [5. State Management](./05-STATE-MANAGEMENT.md)

Learn to manage states, queries, mutations, and lifecycles:

- **4 Required States** - Loading, Error, Empty, Success (Queries)
- **Mutation States** - isLoading, isSuccess, isError (Writes)
- **Combined States** - Avoiding visual "flash" in deletions
- **Try/Catch in API Functions** - Error capture and propagation
- **Global Components** - Skeleton, ErrorContent, Empty
- **Best Practices** - Logs, retry, specific messages

[📖 Read State Management →](./05-STATE-MANAGEMENT.md)

---

### [6. Notifications](./06-NOTIFICATIONS.md)

Learn to use Ant Design for user notifications:

- **4 Types** - Success, Error, Warning, Info
- **Message API** - Simple toast notifications
- **Notification API** - Rich notifications with actions
- **Modal Confirmations** - Confirming destructive actions
- **Golden Rule** - Notifications in components, NEVER in hooks
- **useNotification Hook** - Global notification management
- **Complete Examples** - Create, Delete, Follow, Upload

[📖 Read Notifications →](./06-NOTIFICATIONS.md)

---

## 🚀 Quick Start

### For New Developers

1. Start by reading **[Principles](./01-PRINCIPLES.md)** to understand the foundation
2. Learn the **[Architecture](./02-ARCHITECTURE.md)** patterns and folder structure
3. Study **[Naming Conventions](./03-NAMING-CONVENTIONS.md)** for consistency
4. Understand **[API Consumption](./04-API-CONSUMPTION.md)** flow with Next.js
5. Master **[State Management](./05-STATE-MANAGEMENT.md)** with React Query
6. Learn **[Notifications](./06-NOTIFICATIONS.md)** with Ant Design

### For Experienced Developers

- Use as a quick reference when in doubt
- Consult practical examples in each section
- Review before opening a PR

### During Code Review

- Validate that code follows principles
- Check folder architecture
- Confirm naming conventions
- Verify state handling

---

## 📋 Quick Checklist

Before opening a PR, verify:

- [ ] Followed SOLID principles?
- [ ] Separated responsibilities into layers (types, hooks, ui)?
- [ ] Used consistent naming conventions (camelCase, PascalCase)?
- [ ] Componentized correctly (features vs globals)?
- [ ] Documented with JSDoc?
- [ ] Handled loading/error/empty states?
- [ ] Removed unnecessary console.log?
- [ ] Used path mapping with `@/`?
- [ ] Followed Tailwind best practices?

---

## 🎓 Key Concepts

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│              Next.js API Routes                     │
│              (app/api/*/route.ts)                   │
│  - Backend endpoint creation                        │
│  - Returns full response                            │
└───────────────────┬─────────────────────────────────┘
                    ↓ HTTP Response
┌─────────────────────────────────────────────────────┐
│                   Hooks                             │
│          (features/*/hooks/use*.ts)                 │
│  - React Query (useQuery, useMutation)              │
│  - Call endpoints directly (/api/...)               │
│  - Extract .data from response                      │
│  - Return states + data                             │
└───────────────────┬─────────────────────────────────┘
                    ↓ Transformed Data
┌─────────────────────────────────────────────────────┐
│                 Layouts                             │
│        (features/*/ui/layouts/*)                    │
│  - Use hooks                                        │
│  - Handle 4 states                                  │
│  - Orchestrate components                           │
└───────────────────┬─────────────────────────────────┘
                    ↓ Props
┌─────────────────────────────────────────────────────┐
│               Components                            │
│       (features/*/ui/components/*)                  │
│  - Pure UI                                          │
│  - Receive data via props                           │
│  - No data fetching                                 │
└─────────────────────────────────────────────────────┘
```

### Feature Structure

```
features/
└── [feature-name]/
    ├── types/          # TypeScript types
    ├── hooks/          # React Query hooks (call app/api/...)
    ├── utils/          # Helper functions
    └── ui/             # User interface
        ├── components/ # Reusable components
        └── layouts/    # Page/section layouts
```

---

## 🔄 Philosophy

### Core Principles

1. **Separation of Concerns** - Each layer has a single responsibility
2. **Mobile-First** - Start with mobile, enhance for larger screens
3. **Type Safety** - Leverage TypeScript for reliability
4. **Reusability** - DRY principle, extract common patterns
5. **Testability** - Pure functions, predictable behavior

### Design Decisions

- **Why Next.js?** - Full-stack framework, API routes, SSR/SSG
- **Why Tailwind?** - Utility-first, consistency, rapid development
- **Why React Query?** - Server state management, caching, background updates
- **Why Ant Design?** - Complete component library, consistent UX

---

## 📚 External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Ant Design Documentation](https://ant.design/components/overview/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 🤝 Contributing

This wiki is a living document that evolves with best practices:

- Add practical examples
- Improve explanations
- Update with new patterns
- Fix errors or inconsistencies

---

## 🎯 Next Steps

Choose a page to start learning:

→ [**Principles**](./01-PRINCIPLES.md) - Theoretical foundations  
→ [**Architecture**](./02-ARCHITECTURE.md) - Structure and organization  
→ [**Naming Conventions**](./03-NAMING-CONVENTIONS.md) - Code conventions  
→ [**API Consumption**](./04-API-CONSUMPTION.md) - Next.js API Routes → Hooks → Layouts  
→ [**State Management**](./05-STATE-MANAGEMENT.md) - React Query states and lifecycles  
→ [**Notifications**](./06-NOTIFICATIONS.md) - Ant Design notifications

---

**Last Updated:** December 2025  
**Version:** 1.0.0

