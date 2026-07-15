import { useState } from "react";
import { motion } from "framer-motion";
import { FiZap } from "react-icons/fi";
import QuickOrderModal from "./QuickOrderModal";

export default function QuickOrderButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring" }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 z-40 w-14 h-14 bg-[#5a6b4e] hover:bg-[#4d5d42] rounded-full flex items-center justify-center shadow-lg shadow-[#5a6b4e]/30 transition-all hover:scale-105 group"
        aria-label="Commander rapidement"
      >
        <FiZap className="w-6 h-6 text-white" />
        {/* Ping animation */}
        <span className="absolute inset-0 rounded-full bg-[#5a6b4e] animate-ping opacity-20" />
      </motion.button>

      {/* Modal */}
      <QuickOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
