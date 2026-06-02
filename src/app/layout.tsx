import { ReactNode } from "react";
import { notoSans, notoSansArabic } from "@/lib/fonts";

type Props = { children: ReactNode };

export default function RootLayout({ children }: Props) {
  return (
    <html
      suppressHydrationWarning
      className={`${notoSans.variable} ${notoSansArabic.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
