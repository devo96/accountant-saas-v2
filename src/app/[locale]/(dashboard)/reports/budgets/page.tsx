import { redirect } from "next/navigation";

export default async function BudgetsRedirectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/budgets`);
}
