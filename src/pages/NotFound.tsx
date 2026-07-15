import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiArrowLeft } from "react-icons/fi";
import SEO from "@/components/SEO";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
      <SEO
        title="Page non trouvée - 404"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="font-display font-black text-[120px] sm:text-[160px] leading-none text-white/[0.03] select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-bold text-6xl sm:text-7xl text-[#6b7c5c]">
              404
            </span>
          </div>
        </div>

        <h2 className="font-display font-semibold text-2xl text-white mb-3">
          Page introuvable
        </h2>
        <p className="text-white/60 text-base mb-8 font-light leading-relaxed">
          La page que vous recherchez n'existe pas ou a été déplacée. Retournez à l'accueil ou explorez nos offres.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3.5 bg-[#5a6b4e] text-white font-semibold rounded-xl hover:bg-[#4d5d42] transition-all flex items-center justify-center gap-2 text-sm"
          >
            <FiHome className="w-4 h-4" />
            Accueil
          </Link>
          <Link
            to="/offres"
            className="w-full sm:w-auto px-6 py-3.5 bg-white/[0.05] text-white/70 border border-white/[0.08] font-semibold rounded-xl hover:bg-white/[0.08] transition-all flex items-center justify-center gap-2 text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            Nos offres
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
