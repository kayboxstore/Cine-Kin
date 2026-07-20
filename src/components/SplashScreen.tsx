import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Timeline (ms) — mirrors the validated prototype.
const BUILD_UP = 2100; // anticipation: breathing halo
const IMPACT = 550; // blur/zoom settling to a sharp logo
const SLOGAN_DELAY = 400; // after impact
const HOLD = 2600; // logo + slogan on screen
const FADE = 700; // final fade to the real route
const REDUCED_HOLD = 1000; // static hold when prefers-reduced-motion

type AudioCtor = typeof AudioContext;

function getAudioCtor(): AudioCtor | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioCtor }).webkitAudioContext ??
    null
  );
}

// Signature sting generated with the Web Audio API (no external asset):
// a low "thump" (sine 95→38Hz) immediately followed by a bright shimmer
// (triangle 540→920Hz).
function playImpactSting(ctx: AudioContext): void {
  const now = ctx.currentTime;

  const thumpOsc = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thumpOsc.type = "sine";
  thumpOsc.frequency.setValueAtTime(95, now);
  thumpOsc.frequency.exponentialRampToValueAtTime(38, now + 0.28);
  thumpGain.gain.setValueAtTime(0.0001, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.55, now + 0.02);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
  thumpOsc.connect(thumpGain).connect(ctx.destination);
  thumpOsc.start(now);
  thumpOsc.stop(now + 0.4);

  const shimmerOsc = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  shimmerOsc.type = "triangle";
  shimmerOsc.frequency.setValueAtTime(540, now + 0.04);
  shimmerOsc.frequency.exponentialRampToValueAtTime(920, now + 0.42);
  shimmerGain.gain.setValueAtTime(0.0001, now + 0.04);
  shimmerGain.gain.exponentialRampToValueAtTime(0.22, now + 0.09);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  shimmerOsc.connect(shimmerGain).connect(ctx.destination);
  shimmerOsc.start(now + 0.04);
  shimmerOsc.stop(now + 0.65);
}

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const reduce = useReducedMotion();
  // When reduced motion is requested, jump straight to the final frame.
  const [impacted, setImpacted] = useState<boolean>(!!reduce);
  const [sloganVisible, setSloganVisible] = useState<boolean>(!!reduce);
  const [fading, setFading] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Best-effort audio unlock: browsers block autoplay without a gesture, so
  // if the user taps/keys anywhere during the splash we resume the context —
  // the impact sting can then be heard. No blocking "Enter" gate.
  useEffect(() => {
    if (reduce) return;
    const unlock = () => {
      const Ctor = getAudioCtor();
      if (!Ctor) return;
      try {
        const ctx = audioCtxRef.current ?? new Ctor();
        audioCtxRef.current = ctx;
        void ctx.resume().catch(() => {});
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [reduce]);

  const triggerSting = () => {
    if (reduce) return;
    try {
      const Ctor = getAudioCtor();
      if (!Ctor) return;
      const ctx = audioCtxRef.current ?? new Ctor();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      playImpactSting(ctx);
    } catch {
      /* audio unavailable — visuals continue regardless */
    }
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (reduce) {
      // No blur/zoom/flash and no sound: hold the final frame briefly, fade.
      timers.push(setTimeout(() => setFading(true), REDUCED_HOLD));
      timers.push(setTimeout(() => onFinish(), REDUCED_HOLD + FADE));
      return () => timers.forEach(clearTimeout);
    }

    timers.push(
      setTimeout(() => {
        setImpacted(true);
        triggerSting();
      }, BUILD_UP),
    );
    timers.push(setTimeout(() => setSloganVisible(true), BUILD_UP + IMPACT + SLOGAN_DELAY));
    const fadeAt = BUILD_UP + IMPACT + SLOGAN_DELAY + HOLD;
    timers.push(setTimeout(() => setFading(true), fadeAt));
    timers.push(setTimeout(() => onFinish(), fadeAt + FADE));

    return () => timers.forEach(clearTimeout);
    // triggerSting/onFinish intentionally excluded: the timeline must run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Release the AudioContext when the splash unmounts.
  useEffect(() => {
    return () => {
      void audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: FADE / 1000, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#0a1628]"
    >
      {/* Anticipation halo — breathes behind the logo, removed at impact */}
      {!impacted && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            background:
              "radial-gradient(circle, rgba(90,107,78,0.22) 0%, rgba(90,107,78,0) 70%)",
          }}
          animate={{ opacity: [0.22, 0.5, 0.22], scale: [0.9, 1.12, 0.9] }}
          transition={{ duration: BUILD_UP / 1000, ease: "easeInOut", repeat: Infinity }}
        />
      )}

      {/* Impact flash — quick radial olive-light burst (skipped when reduced) */}
      {impacted && !reduce && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(122,143,106,0.55) 0%, rgba(122,143,106,0) 62%)",
          }}
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 1.55, filter: "blur(16px)" }}
          animate={{
            opacity: impacted ? 1 : 0,
            scale: impacted ? 1 : 1.55,
            filter: impacted ? "blur(0px)" : "blur(16px)",
          }}
          transition={{ duration: IMPACT / 1000, ease: [0.22, 0.8, 0.2, 1] }}
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          className="text-4xl sm:text-5xl font-bold tracking-wide text-white"
        >
          Ciné<span className="font-light text-[#6b7c5c]">Kin</span>
        </motion.div>

        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: sloganVisible ? 1 : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-3 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-white/50"
        >
          Le streaming qui tient ses promesses
        </motion.p>
      </div>
    </motion.div>
  );
}
