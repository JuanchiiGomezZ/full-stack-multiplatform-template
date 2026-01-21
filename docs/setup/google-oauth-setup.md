# Google OAuth Setup Guide

This guide covers the setup required to enable Google Sign-In in the mobile app.

---

## Prerequisites

- A Firebase project with Authentication enabled
- Google Sign-In provider configured in Firebase Console
- Xcode configured for iOS development (for iOS)
- Android Studio configured for Android development (for Android)

---

## Step 1: Firebase Console Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Analytics (optional)

### 1.2 Enable Authentication

1. Go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Enable the toggle and save
4. (Optional) Enable **Apple** for Apple Sign-In support

### 1.3 Get Configuration Files

#### iOS (.plist)

1. Go to **Project Settings** > **Your apps** > **iOS app**
2. Download `GoogleService-Info.plist`
3. Place it in the root of `mobile/` directory

#### Android (json)

1. Go to **Project Settings** > **Your apps** > **Android app**
2. Add your app package name (e.g., `com.yourcompany.yourapp`)
3. Download `google-services.json`
4. Place it in the root of `mobile/` directory

### 1.4 Get OAuth Client IDs

1. Go to **Project Settings** > **Your apps** > **iOS app**
2. Note the **iOS client ID** (starts with `...apps.googleusercontent.com`)
3. Repeat for Android app to get **Web client ID** and **Android client ID**

---

## Step 2: Environment Variables

### 2.1 Backend Configuration

Copy these variables to `backend/.env`:

```env
# Firebase Admin SDK (for token validation)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

To get the private key:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Copy the `private_key` value from the JSON file

### 2.2 Mobile Configuration

Copy `mobile/.env.example` to `mobile/.env.local` and fill in:

```env
# API
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google Sign-In Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
```

---

## Step 3: Platform-Specific Configuration

### 3.1 iOS Configuration

The `GoogleService-Info.plist` should already be placed in the mobile root directory. The app.json is already configured to use it.

If using a custom bundle identifier, update `mobile/app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

### 3.2 Android Configuration

The `google-services.json` should already be placed in the mobile root directory.

If using a custom package name, update `mobile/app.json`:

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.yourapp",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### 3.3 SHA-1 Fingerprint (Android)

For Android, you need to add the SHA-1 fingerprint to Firebase:

#### Debug Key

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

#### Release Key

```bash
keytool -list -v -keystore your-release-keystore.jks -alias your-alias
```

Add the fingerprint to Firebase Console:
1. Project Settings > Your apps > Android app
2. Add fingerprint > Paste SHA-1 hash

---

## Step 4: Native Build Setup

### 4.1 iOS Pods

```bash
cd mobile
npx expo prebuild --platform ios
cd ios && pod install
```

### 4.2 Android Build

```bash
cd mobile
npx expo prebuild --platform android
```

---

## Step 5: Testing

### 5.1 Local Development

1. Start the backend: `cd backend && npm run start:dev`
2. Start the mobile app: `cd mobile && npm run start`
3. Run on simulator/device

### 5.2 Test Flow

1. Open the app - should redirect to login
2. Tap "Sign in with Google"
3. Select account and grant permissions
4. Should redirect to onboarding screen
5. Tap "Get Started" - should redirect to main app

---

## Troubleshooting

### iOS: "Google Sign-In cancelled"

- Verify `GoogleService-Info.plist` is in the correct location
- Check bundle identifier matches Firebase configuration
- Ensure iOS client ID is set in `.env.local`

### Android: "Sign-in failed" / No accounts found

- Verify `google-services.json` is in the correct location
- Check SHA-1 fingerprint is added to Firebase
- Ensure package name matches Firebase configuration

### Backend: "Invalid token" on login

- Verify Firebase Admin credentials in `backend/.env`
- Check that `FIREBASE_PRIVATE_KEY` has newlines properly escaped
- Ensure the token is not expired

---

## Files Modified/Added

### Backend

| File | Description |
|------|-------------|
| `prisma/schema.prisma` | Updated User model for OAuth |
| `src/core/config/firebase.config.ts` | Firebase configuration |
| `src/modules/auth/lib/firebase-admin.ts` | Firebase Admin service |
| `src/modules/auth/dto/google-auth.dto.ts` | Google auth DTO |
| `src/modules/auth/auth.service.ts` | Google login logic |
| `src/modules/auth/auth.controller.ts` | `/auth/google` endpoint |
| `src/modules/auth/auth.module.ts` | Auth module updated |

### Mobile

| File | Description |
|------|-------------|
| `app.json` | Firebase plugins and config files |
| `src/shared/lib/google-signin.ts` | Google Sign-In configuration |
| `src/features/auth/services/auth.service.ts` | API calls with Google login |
| `src/features/auth/stores/auth.store.ts` | Zustand store with MMKV |
| `src/shared/lib/api.ts` | API client with interceptors |
| `src/features/auth/hooks/useAuth.ts` | Auth hooks with Google login |
| `src/features/auth/components/GoogleSignInButton.tsx` | Google Sign-In button |
| `src/app/(onboarding)/` | Onboarding screens |
| `src/app/providers.tsx` | Providers with Google init |

---

## Rollback Steps

If you need to remove Google OAuth:

1. Remove `@react-native-google-signin/google-signin` from `package.json`
2. Remove `@react-native-firebase/app` and `@react-native-firebase/auth` from `package.json`
3. Remove `googleServicesFile` from `app.json`
4. Remove Google-related plugins from `app.json`
5. Delete `mobile/src/shared/lib/google-signin.ts`
6. Delete `mobile/src/features/auth/components/GoogleSignInButton.tsx`
7. Restore original `prisma/schema.prisma`
