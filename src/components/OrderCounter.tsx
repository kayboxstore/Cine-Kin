import { useState, useEffect } from "react";
import { FiShoppingBag } from "react-icons/fi";

// Simulated real-time order counter
function generateOrderCount() {
  const hour = new Date().getHours();
  // More orders during peak hours (18h-23h)
  const base = hour >= 18 && hour <= 23 ? 80 : hour >= 8 && hour <= 17 ? 45 : 20;
  const random = Math.floor(Math.random() * 30);
  return base + random;
}

export default function OrderCounter() {
  const [count, setCount] = useState(generateOrderCount());

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        const change = Math.random() > 0.4 ? 1 : 0;
        return prev + change;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-20 right-6 z-40 flex items-center gap-2 px-4 py-2 bg-[#0d1b2f]/90 backdrop-blur-sm border border-white/[0.08] rounded-full">
      <FiShoppingBag className="w-3.5 h-3.5 text-[#6b7c5c]" />
      <span className="text-white/60 text-xs font-medium">
        {count} commandes aujourd'hui
      </span>
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6b7c5c] opacity-50" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#6b7c5c]" />
      </span>
    </div>
  );
}
