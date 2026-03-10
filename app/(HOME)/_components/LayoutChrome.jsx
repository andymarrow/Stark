"use client";

import { usePathname } from "next/navigation";
import DesktopNavbar from "./DesktopNavbar";
import MobileTabBar from "./MobileTabBar";
import GlobalBanner from "./GlobalBanner";

export default function LayoutChrome({ children }) {
  const pathname = usePathname();
  const isEventDashboard = pathname?.match(/^\/events\/[^/]+\/dashboard/);

  return (
    <div className="min-h-screen flex flex-col">
      {!isEventDashboard && (
        <>
          <div className="z-[60] relative">
            <GlobalBanner />
          </div>
          <div className="hidden md:block sticky top-0 z-50">
            <DesktopNavbar />
          </div>
        </>
      )}

      <main className={isEventDashboard ? "flex-1" : "flex-1 pb-20 md:pb-0"}>
        {children}
      </main>

      {!isEventDashboard && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <MobileTabBar />
        </div>
      )}
    </div>
  );
}
