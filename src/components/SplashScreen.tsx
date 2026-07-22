import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Timeline (ms) — mirrors the validated impact prototype.
// The name's *progressive zoom* is the centrepiece; there is no long silent
// wait on an empty screen anymore.
const INITIAL_DELAY = 200; // let the page settle, then start almost immediately
const ZOOM = 3200; // "CinéKin" scales 1.7→1 / blur 20→0 / opacity 0→1
const IMPACT = 350; // micro shake of the whole scene at the end of the zoom
const SLOGAN_DELAY = 500; // after impact
const SLOGAN_FADE = 600;
const HOLD = 5500; // name + slogan held together
const FADE = 800; // final fade to the real route
const REDUCED_HOLD = 1000; // static hold when prefers-reduced-motion

// Derived anchors (ms from mount).
const IMPACT_AT = INITIAL_DELAY + ZOOM; // 3400
const SLOGAN_AT = IMPACT_AT + SLOGAN_DELAY; // 3900
const FADE_AT = SLOGAN_AT + HOLD; // 9400
const FINISH_AT = FADE_AT + FADE; // 10200

// Bouncy settle for the scale only; opacity/blur ease out normally.
const ZOOM_SCALE_EASE: [number, number, number, number] = [0.28, 1.2, 0.35, 1];

type AudioCtor = typeof AudioContext;

function getAudioCtor(): AudioCtor | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioCtor }).webkitAudioContext ??
    null
  );
}

// --- Signature sound, in four movements (Web Audio API, no external asset) ---

// Swell: two rising sines (220 & 330 Hz) that grow in volume across the whole
// zoom, laid down the moment the zoom begins.
function playSwell(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const dur = ZOOM / 1000;
  for (const freq of [220, 330]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + dur); // crescendo over the zoom
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.45); // release just after impact
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.5);
  }
}

// Impact: low thump + detuned shimmer chorus + a final high sparkle.
function playImpact(ctx: AudioContext): void {
  const now = ctx.currentTime;

  // Thump — sine 100→32 Hz.
  const thumpOsc = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thumpOsc.type = "sine";
  thumpOsc.frequency.setValueAtTime(100, now);
  thumpOsc.frequency.exponentialRampToValueAtTime(32, now + 0.3);
  thumpGain.gain.setValueAtTime(0.0001, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.6, now + 0.02);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  thumpOsc.connect(thumpGain).connect(ctx.destination);
  thumpOsc.start(now);
  thumpOsc.stop(now + 0.42);

  // Shimmer chorus — two slightly detuned triangles rising ×1.7.
  for (const base of [540, 548]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(base, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(base * 1.7, now + 0.42);
    gain.gain.setValueAtTime(0.0001, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + 0.04);
    osc.stop(now + 0.66);
  }

  // Sparkle — two brief high notes, offset ~90 ms, for the finish.
  const sparkles: { freq: number; at: number }[] = [
    { freq: 1200, at: 0.5 },
    { freq: 1600, at: 0.59 },
  ];
  for (const { freq, at } of sparkles) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now + at);
    gain.gain.setValueAtTime(0.0001, now + at);
    gain.gain.exponentialRampToValueAtTime(0.08, now + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + at);
    osc.stop(now + at + 0.26);
  }
}

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const reduce = useReducedMotion();
  // Under reduced motion, jump straight to the final frame (no zoom/impact).
  const [zooming, setZooming] = useState<boolean>(!!reduce);
  const [impacted, setImpacted] = useState<boolean>(!!reduce);
  const [sloganVisible, setSloganVisible] = useState<boolean>(!!reduce);
  const [fading, setFading] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Best-effort audio unlock: browsers block autoplay without a gesture, so if
  // the user taps/keys anywhere during the splash we resume the context. No
  // blocking "Enter" gate — visuals never wait on audio.
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

  const withCtx = (play: (ctx: AudioContext) => void) => {
    if (reduce) return;
    try {
      const Ctor = getAudioCtor();
      if (!Ctor) return;
      const ctx = audioCtxRef.current ?? new Ctor();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
      play(ctx);
    } catch {
      /* audio unavailable — visuals continue regardless */
    }
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (reduce) {
      // Static frame already shown: brief hold, fade, no sound.
      timers.push(setTimeout(() => setFading(true), REDUCED_HOLD));
      timers.push(setTimeout(() => onFinish(), REDUCED_HOLD + FADE));
      return () => timers.forEach(clearTimeout);
    }

    // Kick off the zoom (and the swell) almost immediately.
    timers.push(
      setTimeout(() => {
        setZooming(true);
        withCtx(playSwell);
      }, INITIAL_DELAY),
    );
    // Impact at the exact moment the zoom lands.
    timers.push(
      setTimeout(() => {
        setImpacted(true);
        withCtx(playImpact);
      }, IMPACT_AT),
    );
    timers.push(setTimeout(() => setSloganVisible(true), SLOGAN_AT));
    timers.push(setTimeout(() => setFading(true), FADE_AT));
    timers.push(setTimeout(() => onFinish(), FINISH_AT));

    return () => timers.forEach(clearTimeout);
    // withCtx/onFinish intentionally excluded: the timeline must run once.
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
      className="fixed inset-0 z-[100] overflow-hidden bg-[#0a1628]"
    >
      {/* Background — very slight push-in during the zoom (scale 1 → 1.12) */}
      {!reduce && (
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 46%, rgba(90,107,78,0.14) 0%, rgba(10,22,40,0) 60%)",
          }}
          initial={{ scale: 1 }}
          animate={{ scale: zooming ? 1.12 : 1 }}
          transition={{ duration: ZOOM / 1000, ease: "easeOut" }}
        />
      )}

      {/* Scene — micro shake at the moment of impact */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={impacted && !reduce ? { scale: [1, 1.025, 1] } : { scale: 1 }}
        transition={{ duration: IMPACT / 1000, ease: "easeInOut" }}
      >
        {/* Halo — grows behind the name in step with the zoom (not before) */}
        {!reduce && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 260,
              height: 260,
              background:
                "radial-gradient(circle, rgba(90,107,78,0.5) 0%, rgba(90,107,78,0) 70%)",
            }}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: zooming ? 0.55 : 0, scale: zooming ? 1.1 : 0.4 }}
            transition={{ duration: ZOOM / 1000, ease: "easeOut" }}
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
            initial={reduce ? false : { opacity: 0, scale: 1.7, filter: "blur(20px)" }}
            animate={{
              opacity: zooming ? 1 : 0,
              scale: zooming ? 1 : 1.7,
              filter: zooming ? "blur(0px)" : "blur(20px)",
            }}
            transition={{
              scale: { duration: ZOOM / 1000, ease: ZOOM_SCALE_EASE },
              opacity: { duration: ZOOM / 1000, ease: "easeOut" },
              filter: { duration: ZOOM / 1000, ease: "easeOut" },
            }}
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            className="text-4xl sm:text-5xl font-bold tracking-wide text-white"
          >
            Ciné<span className="font-light text-[#6b7c5c]">Kin</span>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: sloganVisible ? 1 : 0 }}
            transition={{ duration: SLOGAN_FADE / 1000, ease: "easeOut" }}
            className="mt-3 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-white/50"
          >
            Le streaming qui tient ses promesses
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
}
