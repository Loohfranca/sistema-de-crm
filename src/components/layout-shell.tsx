"use client";

import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { useSidebarCollapsed } from "@/lib/sidebar-state";
import { EASE_OUT_EXPO } from "@/lib/motion";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed] = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isBareRoute = pathname?.startsWith("/financeiro/relatorio") ?? false;

  // Fecha drawer ao navegar (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isBareRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <main
        className={`flex-1 min-h-screen transition-[margin] duration-300 ease-out ${
          collapsed ? "md:ml-20" : "md:ml-72"
        }`}
      >
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <div className="p-4 md:p-8 md:pt-4 max-w-[1440px] mx-auto pb-28 md:pb-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
          >
            {children}
          </motion.div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
