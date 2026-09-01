import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppWidget from "./WhatsAppWidget";
import Breadcrumbs from "./Breadcrumbs";
import ScrollProgress from "./ScrollProgress";
import BackToTop from "./BackToTop";
import { ToastProvider } from "./Toast";

export default function Layout() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#0a1628] text-white relative selection:bg-[#5a6b4e]/20 selection:text-white">
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <ScrollProgress />
        <Navbar />
        <Breadcrumbs />
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <Footer />
        <WhatsAppWidget />
        <BackToTop />
      </div>
    </ToastProvider>
  );
}
