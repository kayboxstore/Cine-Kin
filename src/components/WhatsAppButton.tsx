import { motion } from "framer-motion";
import { FiMessageCircle } from "react-icons/fi";
import { SITE_CONFIG } from "@/data/siteData";

export default function WhatsAppButton() {
  return (
    <motion.a
      href={`https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-green-500/30 transition-shadow duration-300"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
      <FiMessageCircle className="w-6 h-6 text-white relative z-10" />
    </motion.a>
  );
}
