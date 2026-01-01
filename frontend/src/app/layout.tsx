import "./globals.css";

/**
 * Root Layout
 *
 * This is a minimal root layout required by Next.js.
 * The actual layout with providers is in [locale]/layout.tsx
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
