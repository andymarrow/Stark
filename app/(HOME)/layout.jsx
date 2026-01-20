import DesktopNavbar from './_components/DesktopNavbar';
import MobileTabBar from './_components/MobileTabBar';
import GlobalBanner from './_components/GlobalBanner';

export default function HomeLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      
      {/* 1. Global Banner (Stacked Top) */}
      <div className="z-[60] relative">
         <GlobalBanner />
      </div>

      
      <div className="hidden md:block sticky top-0 z-50">
         <DesktopNavbar />
      </div>

      {/* 3. Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* 4. Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileTabBar />
      </div>
    </div>
  );
}