import { MarketingLayout } from "@/components/layouts/marketing-layout";
import type { ReactNode } from "react";

export default function MarketingRootLayout({ children }: { children: ReactNode }) {
  return <MarketingLayout>{children}</MarketingLayout>;
}
