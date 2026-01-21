---
name: mobile-feature
description: >
  Creates new feature modules following feature-first architecture.
  Trigger: When creating a new feature, module, or screen structure in mobile.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.0"
  scope: [mobile]
  auto_invoke: "feature, module, crear feature, new feature, estructura"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## When to Use

- Creating a new feature module
- Adding a new screen with its associated logic
- Structuring a new domain (products, users, orders, etc.)

---

## Critical Rules - NON-NEGOTIABLE

### Structure

- **ALWAYS**: Create features in `src/features/{feature-name}/`
- **ALWAYS**: Include all subdirectories: `components/`, `hooks/`, `services/`, `stores/`, `types/`, `schemas/`
- **ALWAYS**: Create `index.ts` barrel file for public exports
- **NEVER**: Put feature-specific code in `shared/` or `app/`

### Naming

- **ALWAYS**: Feature folder in `kebab-case` (`user-profile/`)
- **ALWAYS**: Component files in `PascalCase.tsx` (`UserCard.tsx`)
- **ALWAYS**: Hooks in `camelCase.ts` (`useAuth.ts`)
- **NEVER**: Mix naming conventions

### Location Rules

- **Feature-specific** → `features/{feature}/components/`
- **Reusable base** → `shared/components/ui/`
- **Shared composite** → `shared/components/common/`

---

## Decision Tree

```
New domain/entity? → Create feature in src/features/
Reusable UI component? → Create in shared/components/ui/
Feature-specific component? → Create in features/{name}/components/
Shared hook? → Create in shared/hooks/
Feature hook? → Create in features/{name}/hooks/
```

---

## Workflow

### 1. Create Feature Structure

```bash
mkdir -p mobile/src/features/{feature-name}/{components,hooks,schemas,services,stores,types,utils}
touch mobile/src/features/{feature-name}/index.ts
```

### 2. Create Types First

**File:** `features/{name}/types/{name}.types.ts`

```typescript
export interface Product {
  id: string;
  name: string;
  price: number;
  createdAt: string;
}

export interface CreateProductDto {
  name: string;
  price: number;
}

export interface UpdateProductDto {
  name?: string;
  price?: number;
}
```

### 3. Create Barrel Export

**File:** `features/{name}/index.ts`

```typescript
export * from './types';
export * from './schemas';
export * from './services';
export * from './hooks';
export * from './stores';
export * from './components';
```

### 4. Create Route (if screen)

```bash
mkdir -p mobile/src/app/(tabs)/{feature-name}
touch mobile/src/app/(tabs)/{feature-name}/index.tsx
```

---

## Code Examples

### Feature Structure

```
features/products/
├── components/
│   ├── ProductCard.tsx
│   ├── ProductList.tsx
│   └── index.ts
├── hooks/
│   ├── useProducts.ts
│   └── index.ts
├── schemas/
│   ├── product.schema.ts
│   └── index.ts
├── services/
│   ├── products.service.ts
│   └── index.ts
├── stores/
│   ├── products.store.ts
│   └── index.ts
├── types/
│   ├── products.types.ts
│   └── index.ts
├── utils/
│   └── index.ts
└── index.ts
```

### Component Index

**File:** `features/products/components/index.ts`

```typescript
export { ProductCard } from './ProductCard';
export { ProductList } from './ProductList';
```

### Types Index

**File:** `features/products/types/index.ts`

```typescript
export * from './products.types';
```

---

## Commands

```bash
# Create feature structure
mkdir -p mobile/src/features/{name}/{components,hooks,schemas,services,stores,types,utils}

# Create all index files
touch mobile/src/features/{name}/{components,hooks,schemas,services,stores,types}/index.ts
touch mobile/src/features/{name}/index.ts

# Create route
mkdir -p mobile/src/app/(tabs)/{name}
touch mobile/src/app/(tabs)/{name}/index.tsx
```

---

## Checklist

- [ ] Feature folder created in `src/features/`
- [ ] All subdirectories created (components, hooks, etc.)
- [ ] Types defined first
- [ ] Barrel `index.ts` created with exports
- [ ] Route created if screen needed
- [ ] No feature code in `shared/` or `app/`

---

## Resources

- **Canonical Example**: `mobile/src/features/auth/`
- **Types Pattern**: `mobile/src/features/auth/types/auth.types.ts`
