import { useState, useEffect } from "react";
import { FiUsers } from "react-icons/fi";

export default function LiveVisitors() {
  const [count, setCount] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const next = prev + change;
        return Math.max(5, Math.min(28, next));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-[#0d1b2f]/90 backdrop-blur-sm border border-white/[0.08] rounded-full">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      <FiUsers className="w-3.5 h-3.5 text-white/50" />
      <span className="text-white/60 text-xs font-medium">
        {count} personnes consultent
      </span>
    </div>
  );
}
