import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function configureGoogleSignIn() {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}

export const googleSignIn = {
  signIn: async () => {
    await GoogleSignin.hasPlayServices();
    return GoogleSignin.signIn();
  },

  getTokens: async () => {
    return GoogleSignin.getTokens();
  },

  signOut: async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // Ignore sign out errors
    }
  },
};
