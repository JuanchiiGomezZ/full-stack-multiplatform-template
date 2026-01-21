---
name: mobile-i18n
description: >
  Implements i18next internationalization patterns.
  Trigger: When adding translations, creating new language files, or using text.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.1"
  scope: [mobile]
  auto_invoke: "i18n, translation, translate, language, locale, text"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## When to Use

- Adding user-facing text
- Creating new translation namespaces
- Adding a new language
- Implementing language switcher

---

## Critical Rules - NON-NEGOTIABLE

### File Structure

- **ALWAYS**: Translations in `shared/locales/{lang}/{namespace}.json`
- **ALWAYS**: One namespace per feature/area
- **ALWAYS**: Update types in `shared/i18n/types.ts`
- **NEVER**: Hardcode user-facing strings

### Configuration

- **ALWAYS**: Register namespace in `shared/i18n/config.ts`
- **ALWAYS**: Add to `ns` array in config
- **ALWAYS**: Import for both languages (en, es)
- **NEVER**: Skip type registration

### Usage

- **ALWAYS**: Use `useTranslation(namespace)`
- **ALWAYS**: Type-safe keys
- **NEVER**: Inline translation strings

---

## Decision Tree

```
New feature? → Create namespace JSON files
New text in existing feature? → Add to existing namespace
Need parameters? → Use {param} syntax
Need plurals? → Use zero/one/other keys
```

---

## Workflow

### 1. Create Translation Files

**Path:** `shared/locales/{lang}/{namespace}.json`

### 2. Update TypeScript Types

**File:** `shared/i18n/types.ts`

### 3. Register in Config

**File:** `shared/i18n/config.ts`

### 4. Use in Component

`useTranslation('namespace')`

---

## Code Examples

### Step 1: Create Translation Files

**File:** `shared/locales/en/products.json`

```json
{
  "title": "Products",
  "create": "Create Product",
  "edit": "Edit Product",
  "delete": "Delete Product",
  "name": "Name",
  "price": "Price",
  "stock": "Stock",
  "form": {
    "errors": {
      "required": "This field is required",
      "invalid": "Invalid value"
    }
  },
  "list": {
    "empty": "No products found",
    "loading": "Loading products..."
  },
  "messages": {
    "created": "Product created successfully",
    "updated": "Product updated successfully",
    "deleted": "Product deleted successfully"
  }
}
```

**File:** `shared/locales/es/products.json`

```json
{
  "title": "Productos",
  "create": "Crear Producto",
  "edit": "Editar Producto",
  "delete": "Eliminar Producto",
  "name": "Nombre",
  "price": "Precio",
  "stock": "Stock",
  "form": {
    "errors": {
      "required": "Este campo es obligatorio",
      "invalid": "Valor inválido"
    }
  },
  "list": {
    "empty": "No se encontraron productos",
    "loading": "Cargando productos..."
  },
  "messages": {
    "created": "Producto creado correctamente",
    "updated": "Producto actualizado correctamente",
    "deleted": "Producto eliminado correctamente"
  }
}
```

### Step 2: Update Types

**File:** `shared/i18n/types.ts`

```typescript
import "i18next";

import type commonEN from "@shared/locales/en/common.json";
import type authEN from "@shared/locales/en/auth.json";
import type productsEN from "@shared/locales/en/products.json"; // ADD

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: {
      common: typeof commonEN;
      auth: typeof authEN;
      products: typeof productsEN; // ADD
    };
  }
}
```

### Step 3: Register in Config

**File:** `shared/i18n/config.ts`

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { mmkvLanguageDetector } from "./storage";

// Import translations
import commonEN from "@shared/locales/en/common.json";
import commonES from "@shared/locales/es/common.json";
import authEN from "@shared/locales/en/auth.json";
import authES from "@shared/locales/es/auth.json";
import productsEN from "@shared/locales/en/products.json"; // ADD
import productsES from "@shared/locales/es/products.json"; // ADD

const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    products: productsEN, // ADD
  },
  es: {
    common: commonES,
    auth: authES,
    products: productsES, // ADD
  },
} as const;

i18n
  .use(mmkvLanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    defaultNS: "common",
    ns: ["common", "auth", "products"], // ADD to array
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    compatibilityJSON: "v4",
  });

export default i18n;
```

### Step 4: Use in Component

```typescript
import { useTranslation } from 'react-i18next';

function ProductsScreen() {
  const { t } = useTranslation('products');

  return (
    <View>
      <Text>{t('title')}</Text>
      <Button>{t('create')}</Button>
    </View>
  );
}
```

### Using Nested Keys

```typescript
const { t } = useTranslation("products");

t("form.errors.required"); // "This field is required"
t("messages.created"); // "Product created successfully"
```

### With Parameters

**JSON:**

```json
{
  "welcome": "Welcome, {{name}}!",
  "items": "You have {{count}} items"
}
```

**Component:**

```typescript
t("welcome", { name: "John" }); // "Welcome, John!"
t("items", { count: 5 }); // "You have 5 items"
```

### Plurals

**JSON:**

```json
{
  "count": {
    "zero": "No items",
    "one": "1 item",
    "other": "{{count}} items"
  }
}
```

**Component:**

```typescript
t("count", { count: 0 }); // "No items"
t("count", { count: 1 }); // "1 item"
t("count", { count: 5 }); // "5 items"
```

### Language Switcher

```typescript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: 'en' | 'es') => {
    i18n.changeLanguage(lang);
  };

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Button
        variant={i18n.language === 'en' ? 'primary' : 'outline'}
        onPress={() => changeLanguage('en')}
      >
        EN
      </Button>
      <Button
        variant={i18n.language === 'es' ? 'primary' : 'outline'}
        onPress={() => changeLanguage('es')}
      >
        ES
      </Button>
    </View>
  );
}
```

### MMKV Language Detector

**File:** `shared/i18n/storage.ts`

```typescript
import { storage } from "@shared/utils/storage";
import { STORAGE_KEYS } from "@/constants";
import type { LanguageDetectorModule } from "i18next";

export const mmkvLanguageDetector: LanguageDetectorModule = {
  type: "languageDetector",
  init: () => {},
  detect: () => {
    const savedLanguage = storage.getString(STORAGE_KEYS.LANGUAGE);
    return savedLanguage || "es";
  },
  cacheUserLanguage: (lng: string) => {
    storage.set(STORAGE_KEYS.LANGUAGE, lng);
  },
};
```

---

## Commands

```bash
# Create translation files
mkdir -p mobile/src/shared/locales/{en,es}
touch mobile/src/shared/locales/en/{namespace}.json
touch mobile/src/shared/locales/es/{namespace}.json

# Check existing translations
ls mobile/src/shared/locales/en/

# Check i18n config
cat mobile/src/shared/i18n/config.ts
```

---

## Checklist

- [ ] JSON files created for en and es
- [ ] Same keys in both language files
- [ ] Type import added to `types.ts`
- [ ] Namespace added to `resources` in config
- [ ] Namespace added to `ns` array in config
- [ ] Using `useTranslation(namespace)` in component
- [ ] No hardcoded strings in UI

---

## Resources

- **i18n Config**: `mobile/src/shared/i18n/config.ts`
- **Types**: `mobile/src/shared/i18n/types.ts`
- **Locales**: `mobile/src/shared/locales/`
- **i18next Docs**: https://www.i18next.com/
