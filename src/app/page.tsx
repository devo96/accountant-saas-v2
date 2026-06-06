import { redirect } from "next/navigation";
import { headers } from "next/headers";

const SUPPORTED = ["ar", "en"] as const;

export default async function RootPage() {
  const hdrs = await headers();
  const acceptLang = hdrs.get("accept-language") || "";
  const locale = SUPPORTED.find((l) => acceptLang.startsWith(l)) ?? "ar";
  redirect(`/${locale}`);
}
