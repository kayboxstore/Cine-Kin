import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiClock } from "react-icons/fi";

function getTimeRemaining() {
  const now = new Date();
  // Target: end of current day at 23:59:59
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const diff = target.getTime() - now.getTime();

  return {
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer() {
  const [time, setTime] = useState(getTimeRemaining());

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeRemaining()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pads = (n: number) => String(n).padStart(2, "0");

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#5a6b4e]/10 border-b border-[#5a6b4e]/20 py-2.5"
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-center gap-3 flex-wrap">
        <FiClock className="w-4 h-4 text-[#6b7c5c]" />
        <span className="text-white/60 text-sm">
          Offre Flash : <span className="text-white font-semibold">-20% sur l'abonnement 12 mois</span> se termine dans
        </span>
        <div className="flex items-center gap-1">
          {[
            { value: time.hours, label: "h" },
            { value: time.minutes, label: "m" },
            { value: time.seconds, label: "s" },
          ].map((unit, i) => (
            <span key={i} className="flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-7 bg-[#5a6b4e]/20 rounded text-white font-mono text-sm font-bold">
                {pads(unit.value)}
              </span>
              <span className="text-white/30 text-xs ml-0.5 mr-1">{unit.label}</span>
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
