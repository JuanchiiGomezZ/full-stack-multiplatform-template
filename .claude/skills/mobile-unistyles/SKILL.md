---
name: mobile-unistyles
description: >
  Implements Unistyles theming and styling patterns.
  Trigger: When styling components, using theme, or creating stylesheets.
license: MIT
metadata:
  author: juanma-gomez
  version: "1.1"
  scope: [mobile]
  auto_invoke: "style, theme, unistyles, color, spacing, dark mode"
allowed-tools: Read, Edit, Write, Glob, Grep
---

## When to Use

- Creating component styles
- Using theme colors, spacing, typography
- Implementing dark mode support
- Creating responsive styles

---

## Critical Rules - NON-NEGOTIABLE

### Styling

- **ALWAYS**: Use `StyleSheet.create` from `react-native-unistyles`
- **ALWAYS**: Access theme via `theme` parameter in stylesheet
- **ALWAYS**: Use `style` prop directly with the stylesheet object
- **NEVER**: Use `createStyleSheet` (does not exist)
- **NEVER**: Hardcode colors, use `theme.colors.*`
- **NEVER**: Hardcode spacing, use `theme.spacing()`

### Theme Access

- **ALWAYS**: `theme.colors.primary` not `'#007AFF'`
- **ALWAYS**: `theme.spacing(4)` not `16`
- **ALWAYS**: `theme.radius.md` not `12`
- **NEVER**: Inline style objects with hardcoded values

### Component Logic

- **OPTIONAL**: Use `useUnistyles` hook when needing access to the theme object inside the component logic (e.g. for conditional rendering colors).

---

## Decision Tree

```
Need colors? → theme.colors.*
Need spacing? → theme.spacing(n) (4pt grid)
Need border radius? → theme.radius.*
Need font size? → theme.fontSize.*
Need font family? → theme.fontFamily.*
Need theme in logic? → const { theme } = useUnistyles()
```

---

## Workflow

### 1. Import Unistyles

```typescript
import { StyleSheet, useUnistyles } from "react-native-unistyles";
```

### 2. Create Stylesheet

```typescript
const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing(4),
  },
}));
```

### 3. Use in Component

```typescript
// Direct usage
<View style={styles.container}>...</View>

// Icon handles theme colors internally
<Icon color="primary" />
```

---

## Code Examples

### Basic Component

**File:** `shared/components/ui/Card.tsx`

```typescript
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface CardProps {
  children: React.ReactNode;
}

export function Card({ children }: CardProps) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing(4),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
}));
```

### Using Theme in Logic

```typescript
import { useUnistyles } from 'react-native-unistyles';

export function StatusIcon({ isActive }) {
  // Icon component handles the color mapping
  return (
    <Icon
      name="check"
      color={isActive ? 'success' : 'muted'}
    />
  );
}
```

### Dynamic Styles

```typescript
import { Pressable, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface ButtonProps {
  variant: 'primary' | 'secondary';
}

export function Button({ variant }: ButtonProps) {
  return (
    <Pressable style={[styles.button, styles[`button_${variant}`]]}>
      <Text style={styles.text}>Click me</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  button: {
    padding: theme.spacing(3),
    borderRadius: theme.radius.md,
  },
  button_primary: {
    backgroundColor: theme.colors.primary,
  },
  button_secondary: {
    backgroundColor: theme.colors.secondary,
  },
  text: {
    color: theme.colors.text.inverse,
  }
}));
```

---

## Commands

```bash
# Check theme file
cat mobile/src/shared/styles/theme.ts

# Check unistyles config
cat mobile/src/shared/styles/unistyles.ts
```

---

## Checklist

- [ ] Using `StyleSheet.create` from unistyles
- [ ] All colors from `theme.colors.*`
- [ ] All spacing from `theme.spacing()`
- [ ] No hardcoded values
- [ ] `useUnistyles` only used when theme access needed in JS logic
- [ ] Dark mode works correctly

---

## Resources

- **Theme Definition**: `mobile/src/shared/styles/theme.ts`
- **Unistyles Config**: `mobile/src/shared/styles/unistyles.ts`
- **Example Component**: `mobile/src/shared/components/ui/Button.tsx`
