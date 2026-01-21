# Diseño: Google OAuth para Template

**Fecha:** 2026-01-21
**Estado:** Aprobado
**Objetivo:** Implementar Google OAuth en el template mobile, listo para usar con solo agregar credenciales.

---

## Resumen de Decisiones

| Aspecto | Decisión |
|---------|----------|
| Plataformas | Solo Mobile (template listo para usar) |
| Método de auth | Google OAuth principal, estructura preparada para email/password |
| Validación tokens | Firebase Admin SDK |
| Providers | Solo Google (estructura preparada para Apple) |
| Post-login | Onboarding opcional con `hasCompletedOnboarding` |
| SDK Mobile | @react-native-google-signin/google-signin |
| Storage | MMKV (simplificado, sin SecureStore) |
| Esquema DB | Minimalista (User + RefreshToken) |

---

## 1. Modelo de Datos

### Esquema Prisma (Limpio)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique

  // OAuth
  provider       String   @default("google") // "google" | "apple" | "email"
  providerId     String?  @map("provider_id")

  // Profile
  firstName      String?  @map("first_name")
  lastName       String?  @map("last_name")
  avatarUrl      String?  @map("avatar_url")

  // State
  role           Role     @default(USER)
  hasCompletedOnboarding Boolean @default(false) @map("has_completed_onboarding")

  // Audit
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  // Relations
  refreshTokens  RefreshToken[]

  @@unique([provider, providerId])
  @@index([email])
  @@map("users")
}

model RefreshToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String    @map("user_id")
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime  @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

**Eliminado del template original:**
- Tabla `Organization` (se agrega según proyecto)
- Campo `password` (OAuth only por defecto)
- Campos `isActive`, `emailVerified`, `createdBy`, `updatedBy`
- Role `SUPER_ADMIN`

**Agregado:**
- `provider` y `providerId` para OAuth
- `avatarUrl` para foto de perfil de Google
- `hasCompletedOnboarding` para flujo post-login

---

## 2. Backend (NestJS)

### Estructura de Archivos

```
backend/src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── dto/
│   ├── google-auth.dto.ts    # { idToken: string }
│   └── refresh-token.dto.ts  # { refreshToken: string }
├── strategies/
│   └── jwt.strategy.ts
├── guards/
│   └── jwt-auth.guard.ts
└── lib/
    └── firebase-admin.ts     # Inicialización Firebase Admin
```

### Endpoints

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/google` | Login/registro con Google | Public |
| POST | `/auth/refresh` | Renovar access token | Public |
| POST | `/auth/logout` | Revocar refresh token | Public |
| GET | `/auth/me` | Obtener usuario actual | Required |
| PATCH | `/auth/onboarding` | Marcar onboarding completado | Required |

### Flujo de Login con Google

```typescript
async loginWithGoogle(idToken: string) {
  // 1. Verificar token con Firebase Admin
  const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);

  // 2. Buscar o crear usuario
  const user = await this.prisma.user.upsert({
    where: { email: decodedToken.email },
    create: {
      email: decodedToken.email,
      provider: 'google',
      providerId: decodedToken.uid,
      firstName: decodedToken.name?.split(' ')[0],
      avatarUrl: decodedToken.picture,
    },
    update: {
      providerId: decodedToken.uid,
      avatarUrl: decodedToken.picture,
    },
  });

  // 3. Generar JWT tokens
  const { accessToken, refreshToken } = await this.generateTokens(user);

  return { user, accessToken, refreshToken };
}
```

### Variables de Entorno

```env
# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## 3. Mobile (Expo)

### Dependencias

```json
{
  "@react-native-google-signin/google-signin": "^16.1.1",
  "@react-native-firebase/app": "^23.7.0",
  "@react-native-firebase/auth": "^23.7.0"
}
```

### Estructura de Archivos

```
mobile/src/features/auth/
├── services/
│   └── auth.service.ts       # loginWithGoogle(), logout()
├── stores/
│   └── auth.store.ts         # user, accessToken, refreshToken (MMKV)
├── hooks/
│   └── useAuth.ts            # useGoogleLogin mutation
├── components/
│   └── GoogleSignInButton.tsx
├── types/
│   └── auth.types.ts
└── index.ts

mobile/src/shared/lib/
├── api.ts                    # Axios con interceptors
└── google-signin.ts          # GoogleSignin.configure()
```

### Auth Store (MMKV)

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/shared/utils/storage';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: async () => {
        try {
          await GoogleSignin.signOut();
        } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
```

### Servicio de Auth

```typescript
// auth.service.ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { api } from '@/shared/lib/api';

export const authApi = {
  loginWithGoogle: async (): Promise<AuthResponse> => {
    // 1. Forzar selector de cuenta
    await GoogleSignin.signOut();
    await GoogleSignin.signIn();

    // 2. Obtener idToken
    const { idToken } = await GoogleSignin.getTokens();

    if (!idToken) {
      throw new Error('Login cancelled');
    }

    // 3. Enviar al backend
    const response = await api.post('/auth/google', { idToken });
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    await api.post('/auth/logout', { refreshToken });
  },

  completeOnboarding: async () => {
    const response = await api.patch('/auth/onboarding');
    return response.data;
  },
};
```

### API Client con Token Refresh

```typescript
// shared/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '@/features/auth';
import { router } from 'expo-router';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - agregar token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - refresh en 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const { refreshToken, logout } = useAuthStore.getState();

      if (!refreshToken) {
        await logout();
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }

      try {
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken: newToken } = response.data;

        useAuthStore.setState({ accessToken: newToken });
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch {
        await logout();
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
```

---

## 4. Navegación y Onboarding

### Estructura de Rutas

```
mobile/src/app/
├── _layout.tsx              # Root layout + providers
├── index.tsx                # Redirect según auth state
├── (auth)/
│   ├── _layout.tsx          # Stack sin header
│   └── login.tsx            # GoogleSignInButton
├── (onboarding)/
│   ├── _layout.tsx          # Stack para onboarding
│   ├── welcome.tsx          # Pantalla de bienvenida
│   └── profile.tsx          # Completar perfil (opcional)
└── (tabs)/
    ├── _layout.tsx          # Tab navigator
    ├── index.tsx            # Home
    └── profile.tsx          # Perfil
```

### Lógica de Redirección

```typescript
// app/index.tsx
export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  // No autenticado → Login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Sin onboarding → Onboarding
  if (!user?.hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  // Listo → Home
  return <Redirect href="/(tabs)" />;
}
```

---

## 5. Configuración para Nuevo Proyecto

### Archivos Requeridos

```
mobile/
├── GoogleService-Info.plist   # iOS (Firebase Console)
├── google-services.json       # Android (Firebase Console)
└── .env.local
```

### Variables de Entorno Mobile

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx.apps.googleusercontent.com
```

### app.json

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "com.yourcompany.yourapp",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

---

## 6. Archivos a Crear/Modificar

### CREAR

**Backend:**
- `backend/src/modules/auth/dto/google-auth.dto.ts`
- `backend/src/modules/auth/lib/firebase-admin.ts`
- `backend/src/core/config/firebase.config.ts`

**Mobile:**
- `mobile/src/shared/lib/google-signin.ts`
- `mobile/src/features/auth/components/GoogleSignInButton.tsx`
- `mobile/src/app/(onboarding)/_layout.tsx`
- `mobile/src/app/(onboarding)/welcome.tsx`
- `mobile/src/app/(onboarding)/profile.tsx`

**Documentación:**
- `docs/GOOGLE_AUTH_SETUP.md`

### MODIFICAR

**Backend:**
- `backend/prisma/schema.prisma` — Esquema limpio
- `backend/src/modules/auth/auth.service.ts` — loginWithGoogle
- `backend/src/modules/auth/auth.controller.ts` — Nuevos endpoints
- `backend/src/modules/auth/auth.module.ts` — Firebase module
- `backend/.env.example` — Variables Firebase

**Mobile:**
- `mobile/package.json` — Dependencias
- `mobile/app.json` — Plugins
- `mobile/src/features/auth/stores/auth.store.ts` — MMKV + tokens
- `mobile/src/features/auth/services/auth.service.ts` — loginWithGoogle
- `mobile/src/features/auth/hooks/useAuth.ts` — useGoogleLogin
- `mobile/src/features/auth/types/auth.types.ts` — Tipos
- `mobile/src/shared/lib/api.ts` — Interceptor refresh
- `mobile/src/app/index.tsx` — Redirección
- `mobile/src/app/(auth)/login.tsx` — Botón Google
- `mobile/.env.example` — Variables

### ELIMINAR

**Backend:**
- `backend/src/modules/auth/dto/auth.dto.ts` — Reemplazado

---

## 7. Checklist de Setup (Para Documentación)

1. [ ] Crear proyecto en Firebase Console
2. [ ] Habilitar Google Sign-In en Authentication
3. [ ] Registrar app iOS con bundle identifier
4. [ ] Registrar app Android con package name
5. [ ] Descargar `GoogleService-Info.plist` (iOS)
6. [ ] Descargar `google-services.json` (Android)
7. [ ] Copiar Web Client ID e iOS Client ID
8. [ ] Generar SHA-1 para Android: `keytool -list -v -keystore ~/.android/debug.keystore`
9. [ ] Agregar SHA-1 en Firebase Console
10. [ ] Configurar variables en `.env.local` y backend `.env`
11. [ ] Ejecutar `npx expo prebuild`
12. [ ] Descargar service account JSON de Firebase (para backend)
