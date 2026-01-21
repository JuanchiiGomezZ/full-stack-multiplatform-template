import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { Button } from "@/shared/components/ui/Button";
import { useLogout } from "@/features/auth/hooks/useAuth";

export default function HomeScreen() {
  const { theme } = useUnistyles();
  const user = useAuthStore((state) => state.user);
  const { mutateAsync: logout, isPending } = useLogout();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Welcome, {user?.firstName || "User"}!
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          This is your home screen placeholder.
        </Text>

        <View style={styles.spacer} />

        <Button title="Logout" variant="outline" onPress={() => logout()} loading={isPending} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  spacer: {
    height: 48,
  },
});
