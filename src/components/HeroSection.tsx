import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiPlay,
  FiArrowRight,
  FiUsers,
  FiMessageCircle,
  FiShield,
  FiZap,
} from "react-icons/fi";
import ScrambleText from "@/components/ScrambleText";
import MagneticButton from "@/components/MagneticButton";

// Real guarantees replacing the former fabricated social proof
// ("15 000+ clients dans 40 pays" badge). See AUDIT §7.1.
const GUARANTEES = [
  {
    icon: FiMessageCircle,
    title: "Support WhatsApp direct",
    desc: "Une équipe humaine qui répond, pas un robot.",
  },
  {
    icon: FiShield,
    title: "Sans engagement",
    desc: "Aucun abonnement forcé, vous arrêtez quand vous voulez.",
  },
  {
    icon: FiZap,
    title: "Activation rapide",
    desc: "Vos accès en quelques minutes après confirmation.",
  },
];

export default function HeroSection() {
  // Honor the user's reduced-motion preference: disable looping/background
  // motion and soften the entrance animations. (AUDIT §5.2)
  const reduce = useReducedMotion();

  const entrance = (delay: number) =>
    reduce
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3, delay } }
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: "easeOut" as const },
        };

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-[#0a1628]">
      {/* Ambient glow (static, no animation) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(90,107,78,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(107,124,92,0.06) 0%, transparent 40%)",
        }}
      />
      {/* Very subtle grid (static) */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 pt-28 pb-16 text-center">
        {/* Headline */}
        <motion.h1
          {...entrance(0.1)}
          className="font-display font-bold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-[-0.03em] mb-6 leading-[1.0]"
        >
          <span className="text-white block">L'Expérience</span>
          <span className="bg-gradient-to-r from-[#5a6b4e] via-[#7a8f6a] to-[#9aaf8a] bg-clip-text text-transparent block">
            TV Ultime
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.div {...entrance(0.3)} className="mb-12 max-w-lg mx-auto">
          <ScrambleText
            text="15 000+ chaînes, films et séries en 4K UHD"
            className="text-base sm:text-lg text-white/85 font-light tracking-wide block"
            duration={1.2}
            delay={0.6}
          />
          <p className="text-white/80 text-base font-light mt-2 tracking-wide">
            Tous vos appareils. Sans interruption. Partout.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          {...entrance(0.5)}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/offres">
            <MagneticButton
              className="group px-8 py-4 text-base font-semibold text-white bg-[#5a6b4e] rounded-full hover:bg-[#4d5d42] transition-all duration-300 flex items-center gap-2.5 tracking-wide shadow-lg shadow-[#5a6b4e]/20"
              strength={0.15}
            >
              <FiPlay className="w-4 h-4" />
              Voir les offres
              <FiArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </MagneticButton>
          </Link>
          <Link to="/revendeurs">
            <MagneticButton
              className="px-8 py-4 text-base font-medium text-white/80 border border-white/[0.12] rounded-full hover:border-[#5a6b4e]/30 hover:text-white transition-all duration-300 flex items-center gap-2.5 tracking-wide bg-white/[0.02]"
              strength={0.15}
            >
              <FiUsers className="w-4 h-4" />
              Devenir revendeur
            </MagneticButton>
          </Link>
        </motion.div>

        {/* Real guarantees (replaces the fabricated social-proof badge) */}
        <motion.div
          {...entrance(0.7)}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
        >
          {GUARANTEES.map((g) => (
            <div
              key={g.title}
              className="flex flex-col items-center text-center gap-2 rounded-2xl border border-white/[0.06] bg-[#111d32]/50 px-4 py-5 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-[#5a6b4e]/15 flex items-center justify-center">
                <g.icon className="w-5 h-5 text-[#6b7c5c]" />
              </div>
              <div className="font-display font-semibold text-white text-sm">
                {g.title}
              </div>
              <p className="text-white/80 text-xs font-light leading-relaxed">
                {g.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator — looping motion disabled under reduced-motion */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0.3 : 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={reduce ? undefined : { repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-4 h-7 rounded-full border border-white/[0.12] flex items-start justify-center p-1"
        >
          <div className="w-[2px] h-1.5 bg-white/40 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
