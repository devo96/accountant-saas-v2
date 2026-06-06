import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <h2 className="text-6xl font-bold text-primary-600 mb-4">404</h2>
        <p className="text-gray-500 mb-6">{t("pageNotFound")}</p>
        <Link href="/dashboard">
          <Button><ArrowLeft className="h-4 w-4 ms-1" /> {t("backToDashboard")}</Button>
        </Link>
      </div>
    </div>
  );
}
