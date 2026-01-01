"use client";

/**
 * Tool Layout (CSR)
 *
 * This layout is for the protected application area.
 * It's a Client Component for interactivity.
 */
export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Add your app header/nav/sidebar here */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
