import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/button";

/**
 * Marketing Landing Page (SSR)
 *
 * This is a Server Component by default for SEO optimization.
 */
export default function HomePage() {
  const t = useTranslations("landing");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {t("hero.title")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          {t("hero.subtitle")}
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/tool/dashboard">{t("hero.cta")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
