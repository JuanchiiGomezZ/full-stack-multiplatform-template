# Frontend

Next.js 16 SaaS frontend template.

## Quick Start

```bash
npm install
npm run dev
```

## Scripts

| Script                  | Description              |
| ----------------------- | ------------------------ |
| `npm run dev`           | Start development server |
| `npm run build`         | Build for production     |
| `npm run start`         | Start production server  |
| `npm run lint`          | Run ESLint               |
| `npm run test`          | Run tests (watch)        |
| `npm run test:coverage` | Run tests with coverage  |

## Documentation

See [/docs/frontend/](../docs/frontend/README.md) for complete documentation.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

| Variable               | Description     |
| ---------------------- | --------------- |
| `NEXT_PUBLIC_APP_URL`  | App URL         |
| `NEXT_PUBLIC_API_URL`  | Backend API URL |
| `NEXT_PUBLIC_APP_NAME` | App name        |
