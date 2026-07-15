import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import { useAnalytics } from "./hooks/useAnalytics";

// Lazy load pages for performance
const Offres = lazy(() => import("./pages/Offres"));
const Revendeurs = lazy(() => import("./pages/Revendeurs"));
const Commande = lazy(() => import("./pages/Commande"));
const Paiement = lazy(() => import("./pages/Paiement"));
const Support = lazy(() => import("./pages/Support"));
const APropos = lazy(() => import("./pages/APropos"));
const Conditions = lazy(() => import("./pages/Conditions"));
const Contact = lazy(() => import("./pages/Contact"));
const PolitiqueConfidentialite = lazy(() => import("./pages/PolitiqueConfidentialite"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const Tutoriels = lazy(() => import("./pages/Tutoriels"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const Faq = lazy(() => import("./pages/Faq"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const Status = lazy(() => import("./pages/Status"));

const pageVariants = {
  initial: { opacity: 0, y: 30, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.98 },
};

const pageTransition = {
  type: "tween" as const,
  ease: "easeOut" as const,
  duration: 0.35,
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a1628] flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-[#5a6b4e]/20 border-t-[#6b7c5c] rounded-full animate-spin" />
          <span className="text-white/40 text-sm font-light">Chargement...</span>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  const location = useLocation();
  useAnalytics();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
          <Route path="/offres" element={<LazyPage><AnimatedPage><Offres /></AnimatedPage></LazyPage>} />
          <Route path="/revendeurs" element={<LazyPage><AnimatedPage><Revendeurs /></AnimatedPage></LazyPage>} />
          <Route path="/commande" element={<LazyPage><AnimatedPage><Commande /></AnimatedPage></LazyPage>} />
          <Route path="/paiement" element={<LazyPage><AnimatedPage><Paiement /></AnimatedPage></LazyPage>} />
          <Route path="/support" element={<LazyPage><AnimatedPage><Support /></AnimatedPage></LazyPage>} />
          <Route path="/a-propos" element={<LazyPage><AnimatedPage><APropos /></AnimatedPage></LazyPage>} />
          <Route path="/conditions" element={<LazyPage><AnimatedPage><Conditions /></AnimatedPage></LazyPage>} />
          <Route path="/contact" element={<LazyPage><AnimatedPage><Contact /></AnimatedPage></LazyPage>} />
          <Route path="/politique-confidentialite" element={<LazyPage><AnimatedPage><PolitiqueConfidentialite /></AnimatedPage></LazyPage>} />
          <Route path="/mentions-legales" element={<LazyPage><AnimatedPage><MentionsLegales /></AnimatedPage></LazyPage>} />
          <Route path="/tutoriels" element={<LazyPage><AnimatedPage><Tutoriels /></AnimatedPage></LazyPage>} />
          <Route path="/admin" element={<LazyPage><AnimatedPage><Dashboard /></AnimatedPage></LazyPage>} />
          <Route path="/blog" element={<LazyPage><AnimatedPage><Blog /></AnimatedPage></LazyPage>} />
          <Route path="/blog/:id" element={<LazyPage><AnimatedPage><BlogArticle /></AnimatedPage></LazyPage>} />
          <Route path="/faq" element={<LazyPage><AnimatedPage><Faq /></AnimatedPage></LazyPage>} />
          <Route path="/merci" element={<LazyPage><AnimatedPage><ThankYou /></AnimatedPage></LazyPage>} />
          <Route path="/status" element={<LazyPage><AnimatedPage><Status /></AnimatedPage></LazyPage>} />
          <Route path="*" element={<LazyPage><AnimatedPage><NotFound /></AnimatedPage></LazyPage>} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}
