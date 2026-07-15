import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageCircle, FiX, FiSend, FiZap } from "react-icons/fi";
import { SITE_CONFIG } from "@/data/siteData";

interface ChatMessage {
  type: "bot" | "user";
  text: string;
  delay: number;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    type: "bot",
    text: "Bonjour ! Bienvenue sur Ciné Kin Premium. Comment puis-je vous aider aujourd'hui ?",
    delay: 0,
  },
  {
    type: "bot",
    text: "Nos forfaits commencent à 9.99€/mois avec +15 000 chaînes. Souhaitez-vous un essai gratuit de 24h ?",
    delay: 4000,
  },
];

const QUICK_REPLIES = [
  "Tarifs ?",
  "Essai gratuit",
  "Comment ça marche ?",
  "Revendeur",
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userReply, setUserReply] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-open chat after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasOpened) {
        setIsOpen(true);
        setHasOpened(true);
      }
    }, 15000);
    return () => clearTimeout(timer);
  }, [hasOpened]);

  // Show messages with delay
  useEffect(() => {
    if (!isOpen) return;
    INITIAL_MESSAGES.forEach((msg) => {
      setTimeout(() => {
        setChatMessages((prev) => [...prev, msg]);
      }, msg.delay + 500);
    });
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showTyping]);

  const handleQuickReply = (reply: string) => {
    setChatMessages((prev) => [...prev, { type: "user" as const, text: reply, delay: 0 }]);
    setShowTyping(true);

    setTimeout(() => {
      setShowTyping(false);
      const botResponses: Record<string, string> = {
        "Tarifs ?": "Nos tarifs : 9.99€/mois, 24.99€/3 mois, 39.99€/6 mois, 69.99€/12 mois. Tous avec +15 000 chaînes et VOD !",
        "Essai gratuit": "Parfait ! Pour activer votre essai gratuit 24h, contactez-nous sur WhatsApp au +243 830 240 073. Aucune carte bancaire requise.",
        "Comment ça marche ?": "Simple : 1) Choisissez votre formule 2) Commandez via WhatsApp 3) Recevez vos codes d'activation 4) Installez l'app et profitez !",
        "Revendeur": "Nos packs revendeur : Starter 20 codes (49.99€), Business 50 codes (99.99€), Pro 100 codes (179.99€), VIP 500 codes (749.99€). Contactez-nous !",
      };
      setChatMessages((prev) => [
        ...prev,
        { type: "bot" as const, text: botResponses[reply] || "Contactez-nous sur WhatsApp pour plus d'infos !", delay: 0 },
      ]);
    }, 1500);
  };

  const handleSend = () => {
    if (!userReply.trim()) return;
    handleQuickReply(userReply);
    setUserReply("");
  };

  const whatsappLink = `https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}?text=${encodeURIComponent("Bonjour Ciné Kin Premium ! J'ai une question.")}`;

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 3, type: "spring" }}
        onClick={() => {
          setIsOpen(!isOpen);
          setHasOpened(true);
        }}
        className="fixed bottom-20 left-6 z-40 w-14 h-14 bg-[#5a6b4e] hover:bg-[#4d5d42] rounded-full flex items-center justify-center shadow-lg transition-all"
        aria-label="Chat"
      >
        {isOpen ? (
          <FiX className="w-6 h-6 text-white" />
        ) : (
          <FiMessageCircle className="w-6 h-6 text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
            1
          </span>
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-36 left-6 z-40 w-[340px] max-w-[calc(100vw-48px)] bg-[#0d1b2f] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: "480px" }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/[0.06] flex items-center gap-3 flex-shrink-0 bg-[#5a6b4e]/5">
              <div className="w-9 h-9 rounded-full bg-[#5a6b4e]/20 flex items-center justify-center">
                <FiZap className="w-4 h-4 text-[#6b7c5c]" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">Ciné Kin Assistant</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-white/55 text-[10px]">En ligne</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.type === "user"
                        ? "bg-[#5a6b4e] text-white rounded-br-md"
                        : "bg-white/[0.05] text-white/75 border border-white/[0.06] rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {showTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.05] border border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/25 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Quick replies */}
              {chatMessages.length > 0 && !showTyping && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full text-white/50 text-xs hover:bg-[#5a6b4e]/10 hover:text-[#6b7c5c] hover:border-[#5a6b4e]/20 transition-all"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userReply}
                  onChange={(e) => setUserReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Écrivez un message..."
                  className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#5a6b4e]/30"
                />
                <button
                  onClick={handleSend}
                  className="w-10 h-10 flex items-center justify-center bg-[#5a6b4e] rounded-xl text-white hover:bg-[#4d5d42] transition-all flex-shrink-0"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-[#6b7c5c] text-[10px] mt-2 hover:underline"
              >
                Passer sur WhatsApp pour une réponse humaine
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
