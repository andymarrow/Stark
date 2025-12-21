import DesktopNavbar from './_components/DesktopNavbar';
import MobileTabBar from './_components/MobileTabBar';

export default function HomeLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* DESKTOP NAV - Hidden on Mobile */}
      <div className="hidden md:block sticky top-0 z-50">
         <DesktopNavbar />
      </div>

      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* MOBILE NAV - Hidden on Desktop */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileTabBar />
      </div>
    </div>
  );
}