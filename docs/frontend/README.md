# Frontend Documentation

This documentation serves as context for AI coding assistants and developers working on this codebase.

## 📚 Documentation Index

| Document                                  | Description                                            |
| ----------------------------------------- | ------------------------------------------------------ |
| [Architecture](./architecture.md)         | Project structure, conventions, file organization      |
| [Components](./components.md)             | shadcn/ui usage, custom components, naming conventions |
| [Features](./features.md)                 | Feature module pattern, public API, boundaries         |
| [API Patterns](./api-patterns.md)         | Axios setup, TanStack Query patterns, error handling   |
| [State Management](./state-management.md) | Zustand store patterns                                 |
| [Forms](./forms.md)                       | React Hook Form + Zod validation                       |
| [i18n](./i18n.md)                         | Internationalization with next-intl                    |
| [Testing](./testing.md)                   | Vitest setup, mocking, utilities                       |
| [Styling](./styling.md)                   | Tailwind CSS conventions, theming                      |

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: Zustand
- **Data Fetching**: TanStack Query + Axios
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl
- **Testing**: Vitest + Testing Library

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure Overview

```
src/
├── app/                 # Next.js App Router
│   └── [locale]/        # i18n routes
│       ├── (marketing)/ # SSR landing pages
│       ├── (tool)/      # CSR protected app
│       └── (auth)/      # Auth pages
├── features/            # Business modules
├── shared/              # Shared code
├── i18n/                # Internationalization
└── test/                # Testing utilities
```
