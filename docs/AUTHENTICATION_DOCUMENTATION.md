# Documentación de Autenticación - Daily Loop

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Backend (NestJS)](#backend-nestjs)
3. [Frontend Web (Next.js)](#frontend-web-nextjs)
4. [Mobile (Expo/React Native)](#mobile-expo-react-native)
5. [Credenciales y Configuraciones](#credenciales-y-configuraciones)
6. [Flujos de Autenticación](#flujos-de-autenticación)
7. [Configuración de Plataformas](#configuración-de-plataformas)
8. [Pasos para Replicar en Nuevo Proyecto](#pasos-para-replicar-en-nuevo-proyecto)

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ Google      │───▶│ Firebase    │───▶│ Google Sign-In     │  │
│  │ Sign-In     │    │ Auth        │    │ SDK (Native)       │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                  │              │
│                                                  ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Auth Store (Zustand + SecureStore)          │  │
│  │  - accessToken  - refreshToken  - user                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              API Client (Axios + Interceptors)           │  │
│  │  - Bearer token injection  - Token refresh on 401       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS (JSON)
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND API                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │ JWT Auth    │───▶│ Passport    │───▶│ Prisma (PostgreSQL) │  │
│  │ Guard       │    │ Strategy    │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│                                                  │              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Auth Service                           │  │
│  │  - loginWithGoogle()  - loginWithApple()  - refresh()   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend (NestJS)

### Dependencias

```json
{
  "@nestjs/jwt": "^11.0.2",
  "@nestjs/passport": "^11.0.5",
  "passport": "^0.7.0",
  "passport-jwt": "^4.0.1",
  "firebase-admin": "^13.6.0"
}
```

### Estructura de Archivos

```
backend/src/modules/auth/
├── auth.module.ts           # Configuración del módulo
├── auth.service.ts          # Lógica de autenticación
├── auth.controller.ts       # Endpoints REST
├── dto/
│   ├── google-auth.dto.ts   # DTO para login con Google
│   ├── apple-auth.dto.ts    # DTO para login con Apple
│   └── refresh-token.dto.ts # DTO para refresh token
├── strategies/
│   └── jwt.strategy.ts      # Passport JWT Strategy
└── guards/
    └── jwt-auth.guard.ts    # Guard de autenticación
```

### Configuración del Módulo (auth.module.ts)

```typescript
@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('jwt.secret');
        const expiresIn = configService.get<string>('jwt.expiresIn') || '7d';
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
```

### JWT Strategy (jwt.strategy.ts)

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.secret');

    const options: StrategyOptionsWithoutRequest = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    };

    super(options);
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      sub: payload.sub,
      email: payload.email,
    };
  }
}
```

### JwtAuthGuard con Rutas Públicas

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

// Decorador para rutas públicas
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### Endpoints del Controlador

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/google` | Login con Google OAuth | Public |
| POST | `/auth/apple` | Login con Apple Sign In | Public |
| GET | `/auth/me` | Obtener usuario actual | Required |
| PATCH | `/auth/profile` | Actualizar perfil | Required |
| POST | `/auth/logout` | Logout | Required |
| POST | `/auth/refresh` | Renovar access token | Public |

### Variables de Entorno (backend/.env)

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=30m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=30d

# Firebase Admin SDK (para validar tokens)
FIREBASE_PROJECT_ID=dailyloop-1d5a5
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@dailyloop-1d5a5.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### Modelo de Usuario (Prisma)

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  provider    String   // "google" | "apple"
  providerId  String   // ID del usuario en el provider externo
  firstName   String?
  timezone    String   @default("UTC")
  hasCompletedOnboarding Boolean @default(false)

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tasks           Task[]
  dailyStats      DailyStats[]
  reminderSettings ReminderSettings?

  @@map("users")
}
```

---

## Frontend Web (Next.js)

### Dependencias

```json
{
  "axios": "^1.13.2",
  "zustand": "^5.0.9"
}
```

### Estructura de Archivos

```
frontend/src/features/auth/
├── services/
│   └── auth.service.ts     # API calls
├── stores/
│   └── auth.store.ts       # Zustand store con persistencia
└── types/
    └── auth.types.ts       # Tipos TypeScript
```

### Auth Store (Zustand)

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
      }),

      login: (user) => set({
        user,
        isAuthenticated: true,
        isLoading: false,
      }),

      logout: () => set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

---

## Mobile (Expo/React Native)

### Dependencias

```json
{
  "@react-native-firebase/auth": "^23.7.0",
  "@react-native-google-signin/google-signin": "^16.1.1",
  "expo-secure-store": "^15.0.8",
  "axios": "^1.13.2",
  "zustand": "^5.0.9"
}
```

### Estructura de Archivos

```
mobile/src/features/auth/
├── services/
│   └── auth.service.ts     # API calls + Firebase integration
├── stores/
│   └── auth.store.ts       # Zustand + SecureStore
├── hooks/
│   └── useAuth.ts          # React Query hooks
└── types/
    └── auth.types.ts       # Tipos TypeScript
```

### Configuración de Firebase (mobile/src/shared/lib/firebase.ts)

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export const googleSignIn = {
  signIn: async () => GoogleSignin.signIn(),
  getTokens: async () => GoogleSignin.getTokens(),
  signOut: async () => GoogleSignin.signOut(),
};
```

### Flujo de Login (mobile/src/features/auth/services/auth.service.ts)

```typescript
export const authApi = {
  loginWithGoogle: async (): Promise<AuthResponse> => {
    // 1. Sign out first to ensure account picker is shown
    await googleSignIn.signOut();

    // 2. Sign in with Google using native module
    await googleSignIn.signIn();
    const tokens = await googleSignIn.getTokens();

    if (!tokens.idToken) {
      throw new Error("loginCancelled");
    }

    // 3. Send token to backend
    const response = await api.post("/auth/google", { idToken: tokens.idToken });

    return {
      user: response.data.user,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };
  },
};
```

### Auth Store con SecureStore (mobile/src/features/auth/stores/auth.store.ts)

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: async () => {
        await secureStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE);
        try {
          await googleSignIn.signOut();
        } catch (error) {
          console.log("[AuthStore] Google signOut error:", error);
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: STORAGE_KEYS.AUTH_STORAGE,
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
```

### API Client con Interceptors (mobile/src/shared/lib/api.ts)

```typescript
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { API_URL, STORAGE_KEYS } from "@/constants";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const auth = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_STORAGE);
    const authData = auth ? JSON.parse(auth) : null;
    const token = authData?.state?.accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Response interceptor - handle 401 errors with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const auth = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_STORAGE);
        const authData = auth ? JSON.parse(auth) : null;
        const refreshToken = authData?.state?.refreshToken;

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await api.post(`/auth/refresh`, { refreshToken });
        const { accessToken } = response.data.data;

        // Update stored access token
        const updatedAuth = {
          ...authData,
          state: { ...authData.state, accessToken },
        };
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_STORAGE, JSON.stringify(updatedAuth));

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_STORAGE);
        router.replace("/(auth)/auth");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

---

## Credenciales y Configuraciones

### Firebase Console Setup

1. **Crear proyecto en Firebase Console**
   - Ir a: https://console.firebase.google.com/
   - Crear nuevo proyecto: `dailyloop-1d5a5`

2. **Habilitar Authentication**
   - Authentication > Sign-in method
   - Habilitar "Google" y "Apple" providers

3. **Configurar Google Sign-In**
   - Obtener Web Client ID y iOS Client ID de Firebase Console

### Variables de Entorno Mobile (mobile/.env.local)

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD6SCb5oDhzTWPm_PnGuPiwzejyNYHYBmU
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=dailyloop-1d5a5.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=dailyloop-1d5a5
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=dailyloop-1d5a5.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=893149421338
EXPO_PUBLIC_FIREBASE_APP_ID=1:893149421338:web:340bdedd8195a5985416a3

# Google SignIn Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=893149421338-41dr8jpm538ulnld7ngdcqvt5e1sqo7h.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=893149421338-73qbl7v08r57s2c3ue97ll0puqj0a166.apps.googleusercontent.com

# Backend API
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
```

---

## Configuración de Plataformas

### iOS Configuration

#### GoogleService-Info.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CLIENT_ID</key>
  <string>893149421338-73qbl7v08r57s2c3ue97ll0puqj0a166.apps.googleusercontent.com</string>
  <key>REVERSED_CLIENT_ID</key>
  <string>com.googleusercontent.apps.893149421338-73qbl7v08r57s2c3ue97ll0puqj0a166</string>
  <key>API_KEY</key>
  <string>AIzaSyBkF-FiOe0tMmeuFmZattNiuCNpJ4sbJeM</string>
  <key>GCM_SENDER_ID</key>
  <string>893149421338</string>
  <key>PLIST_VERSION</key>
  <string>1</string>
  <key>BUNDLE_ID</key>
  <string>com.expandia.dailyloop</string>
  <key>PROJECT_ID</key>
  <string>dailyloop-1d5a5</string>
  <key>STORAGE_BUCKET</key>
  <string>dailyloop-1d5a5.firebasestorage.app</string>
  <key>IS_ADS_ENABLED</key>
  <false/>
  <key>IS_ANALYTICS_ENABLED</key>
  <false/>
  <key>IS_APPINVITE_ENABLED</key>
  <true/>
  <key>IS_GCM_ENABLED</key>
  <true/>
  <key>IS_SIGNIN_ENABLED</key>
  <true/>
  <key>GOOGLE_APP_ID</key>
  <string>1:893149421338:ios:9c069bb7001312d55416a3</string>
</dict>
</plist>
```

#### app.json (iOS section)

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.dailyloop.app",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

#### Podfile Configuration

```ruby
require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")

platform :ios, '15.1'

target 'DailyLoop' do
  use_expo_modules!

  # Required for Firebase pods to work as static libraries
  use_modular_headers!

  # Static linking required for react-native-firebase
  use_frameworks! :linkage => :static

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
    )

    # Fix for RNFBAuth missing FirebaseAuth-Swift.h header
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        config.build_settings['GCC_WARN_ERROR'] = 'NO'
      end
    end
  end
end
```

### Android Configuration

#### google-services.json

```json
{
  "project_info": {
    "project_number": "893149421338",
    "project_id": "dailyloop-1d5a5",
    "storage_bucket": "dailyloop-1d5a5.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:893149421338:android:e7c2b6ed8ff5573e5416a3",
        "android_client_info": {
          "package_name": "com.juanma.dailyloop"
        }
      },
      "oauth_client": [
        {
          "client_id": "893149421338-pinp70pjcibhh1slne5vl8huupkrefu6.apps.googleusercontent.com",
          "client_type": 1,
          "android_info": {
            "package_name": "com.juanma.dailyloop",
            "certificate_hash": "5e8f16062ea3cd2c4a0d547876baa6f38cabf625"
          }
        }
      ],
      "api_key": [
        {
          "current_key": "AIzaSyBKbrk9YLOD-6GCssRSkVOKHYg-EmjdC2c"
        }
      ]
    }
  ]
}
```

#### SHA-1 Configuration

Para Android, necesitas generar el hash SHA-1 del certificado de debug y producción:

```bash
# Debug certificate
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Production certificate (release)
keytool -list -v -keystore your-release-keystore.jks -alias your-alias
```

**Importante:** Agregar los hashes SHA-1 en Firebase Console:
1. Firebase Console > Project Settings
2. Your apps > Android app
3. Add fingerprint > Paste SHA-1 hash

#### app.json (Android section)

```json
{
  "expo": {
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.juanma.dailyloop",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

---

## Flujos de Autenticación

### Flujo de Login con Google

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Mobile    │     │   Google     │     │   Backend    │     │  Database    │
│     App      │     │   Sign-In    │     │    API       │     │  (Prisma)    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │ 1. Sign In         │                    │                    │
       │───────────────────▶│                    │                    │
       │                    │                    │                    │
       │ 2. Get ID Token    │                    │                    │
       │◀───────────────────│                    │                    │
       │                    │                    │                    │
       │ 3. POST /auth/google                    │                    │
       │   { idToken }      │                    │                    │
       │────────────────────────────────────────▶│                    │
       │                    │                    │                    │
       │                    │ 4. Validate Google Token                │
       │                    │   (decode/check expiration)             │
       │                    │   ────────────────────────────────      │
       │                    │   TODO: Verify with Firebase Admin     │
       │                    │                    │                    │
       │                    │                    │ 5. Find/Create User
       │                    │                    │───────────────────▶│
       │                    │                    │                    │
       │                    │                    │ 6. Return User     │
       │                    │◀────────────────────────────────────────│
       │                    │                    │                    │
       │ 7. Generate JWTs   │                    │                    │
       │   (access + refresh)                    │                    │
       │◀────────────────────────────────────────│                    │
       │                    │                    │                    │
       │ 8. Store tokens    │                    │                    │
       │   (SecureStore)    │                    │                    │
       │                    │                    │                    │
       │ 9. Redirect to Home│                    │                    │
       └────────────────────┘                    └────────────────────┘
```

### Flujo de Token Refresh

```
┌──────────────┐     ┌──────────────┐
│    Mobile    │     │   Backend    │
│     App      │     │    API       │
└──────┬───────┘     └──────┬───────┘
       │                    │
       │ 1. API Request +   │
       │    Access Token    │
       │───────────────────▶│
       │                    │
       │                    │ 2. Validate Token
       │                    │   (expired?)
       │                    │
       │◀───────────────────│
       │     401 Unauthorized
       │                    │
       │ 3. POST /auth/refresh
       │   { refreshToken } │
       │───────────────────▶│
       │                    │
       │                    │ 4. Validate Refresh Token
       │                    │   (check type='refresh')
       │                    │
       │ 5. New Access Token│
       │◀───────────────────│
       │                    │
       │ 6. Retry Original  │
       │    Request         │
       │───────────────────▶│
```

---

## Pasos para Replicar en Nuevo Proyecto

### 1. Backend (NestJS)

```bash
# Instalar dependencias
npm install @nestjs/jwt @nestjs/passport passport passport-jwt firebase-admin

# Crear módulo de auth
nest g module auth
nest g service auth
nest g controller auth
nest g guard jwt-auth
nest g strategy jwt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con valores reales
```

**Pasos específicos:**
1. Copiar estructura de `backend/src/modules/auth/`
2. Configurar JWT en `auth.module.ts`
3. Configurar decorators `@Public()` y `@CurrentUser()`
4. Configurar Firebase Admin SDK en `.env`
5. Ejecutar migraciones de Prisma

### 2. Mobile (Expo/React Native)

```bash
# Instalar dependencias
npx expo install @react-native-firebase/auth @react-native-google-signin/google-signin
npx expo install expo-secure-store

# Configurar Firebase
# Descargar GoogleService-Info.plist de Firebase Console
# Descargar google-services.json de Firebase Console
```

**Pasos específicos:**
1. Copiar `GoogleService-Info.plist` a raíz del proyecto mobile
2. Copiar `google-services.json` a raíz del proyecto mobile
3. Configurar `mobile/.env.local` con variables de Firebase
4. Configurar `mobile/app.json` con bundle identifier y paths
5. Ejecutar `npx expo prebuild` para generar native projects
6. Configurar Podfile (ver sección anterior)
7. Configurar SHA-1 en Firebase Console (Android)

### 3. Firebase Console Checklist

- [ ] Crear proyecto Firebase
- [ ] Habilitar Authentication > Google Sign-In
- [ ] Descargar GoogleService-Info.plist (iOS)
- [ ] Descargar google-services.json (Android)
- [ ] Agregar SHA-1 fingerprint (Android)
- [ ] Configurar Web Client ID y iOS Client ID
- [ ] Habilitar Apple Sign In (si aplica)

### 4. Configuración de Desarrollo

```bash
# Backend
cd backend
cp .env.example .env
# Editar .env con JWT secrets y Firebase credentials
npm run start:dev

# Mobile
cd mobile
cp .env.example .env.local
# Editar .env.local con Firebase vars
npx expo start
```

---

## Troubleshooting Común

### iOS

**Error: "FirebaseAuth-Swift.h not found"**
- Solución: Agregar `use_frameworks! :linkage => :static` en Podfile
- Agregar flags de compilación en post_install

**Error: "Google Sign-In cancelled"**
- Verificar que GoogleService-Info.plist está en la ubicación correcta
- Verificar bundle identifier en Firebase Console

### Android

**Error: "SHA-1 fingerprint not found"**
- Generar hash SHA-1: `keytool -list -v -keystore ~/.android/debug.keystore`
- Agregar fingerprint en Firebase Console > Project Settings

**Error: "Google Play Services not available"**
- Verificar que google-services.json tiene el package name correcto
- Regenerar native projects: `npx expo prebuild`

### General

**Error: 401 en todas las requests**
- Verificar que accessToken no es null
- Verificar que Bearer token está correctamente formateado
- Verificar que JWT_SECRET coincide en backend y frontend

**Error: Token refresh falla**
- Verificar que refreshToken no está expirado
- Verificar que JWT_REFRESH_SECRET es correcto
- Verificar que el usuario aún existe en la base de datos

---

## Referencias

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [React Native Firebase Auth](https://rnfirebase.io/auth/social-auth)
- [NestJS JWT Auth](https://docs.nestjs.com/security/authentication)
- [Passport JWT Strategy](https://github.com/mikenicholson/passport-jwt)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)
