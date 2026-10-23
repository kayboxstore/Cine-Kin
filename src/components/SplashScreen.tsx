import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const HOLD_MS = 1_250;
const FADE_MS = 300;

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fading, setFading] = useState(false);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFading(true);
    window.setTimeout(() => onFinishRef.current(), FADE_MS);
  };

  useEffect(() => {
    const timer = window.setTimeout(finish, HOLD_MS);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Introduction Ciné Kin Premium"
      initial={{ opacity: 1 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: FADE_MS / 1_000, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#0a1628]"
    >
      <motion.div
        aria-hidden="true"
        className="absolute h-72 w-72 rounded-full bg-[#5a6b4e]/20 blur-3xl"
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 0.65, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 1.12, filter: "blur(8px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.75, ease: "easeOut" }}
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          className="text-4xl font-bold tracking-wide text-white sm:text-5xl"
        >
          Ciné<span className="font-light text-[#8a9d79]">Kin</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.35 }}
          className="mt-3 text-xs uppercase tracking-[0.2em] text-white/70"
        >
          Le streaming qui tient ses promesses
        </motion.p>
        <button
          type="button"
          onClick={finish}
          className="mt-8 rounded-full border border-white/20 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.08]"
        >
          Passer l’introduction
        </button>
      </div>
    </motion.div>
  );
}
