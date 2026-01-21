"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

/**
 * Dashboard Page (CSR)
 *
 * Protected route - requires authentication.
 */
export default function DashboardPage() {
  const t = useTranslations("navigation");

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t("dashboard")}</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is your protected dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
