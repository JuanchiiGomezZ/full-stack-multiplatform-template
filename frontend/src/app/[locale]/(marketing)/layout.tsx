/**
 * Marketing Layout (SSR)
 *
 * This layout is for public marketing pages.
 * It's a Server Component for SEO optimization.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Add your marketing header/nav here */}
      {children}
      {/* Add your marketing footer here */}
    </div>
  );
}
