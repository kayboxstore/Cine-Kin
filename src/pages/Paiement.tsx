import { motion } from "framer-motion";
import { FiSmartphone, FiCreditCard, FiDollarSign, FiInfo, FiCheck, FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import { PAYMENT_METHODS, SITE_CONFIG } from "@/data/siteData";

const iconMap: Record<string, React.ElementType> = {
  FiSmartphone, FiCreditCard, FiDollarSign,
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export default function Paiement() {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950 to-dark-900" />
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/commande" className="inline-flex items-center gap-2 text-white/50 hover:text-cyan-400 transition-colors text-sm mb-6">
              <FiArrowLeft className="w-4 h-4" />
              Retour à la commande
            </Link>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white mb-4">
              Moyens de <span className="text-gradient-cyan">paiement</span>
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Choisissez le mode de paiement qui vous convient le mieux.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="relative py-16 pb-24">
        <div className="absolute inset-0 bg-dark-900" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Info message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-6 border border-cyan-500/20 mb-12"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <FiInfo className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-white mb-1">Processus de paiement</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Après validation de votre commande, notre équipe vous enverra les instructions de paiement détaillées via WhatsApp. 
                  Une fois le paiement confirmé, votre accès sera activé sous quelques minutes.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {PAYMENT_METHODS.map((method, i) => {
              const Icon = iconMap[method.icon] || FiDollarSign;
              return (
                <motion.div
                  key={method.id}
                  variants={fadeInUp}
                  custom={i}
                  className="glass-card glass-card-hover p-6 rounded-2xl text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-white mb-1">{method.name}</h3>
                  <p className="text-white/50 text-sm mb-4">{method.description}</p>
                  <div className="flex items-center justify-center gap-1.5 text-cyan-400 text-xs">
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>Disponible</span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 glass-card rounded-2xl p-8 border border-white/5"
          >
            <h3 className="font-display font-semibold text-xl text-white mb-6 text-center">
              Comment ça marche ?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Commandez", desc: "Remplissez le formulaire de commande avec vos informations." },
                { step: "2", title: "Recevez les instructions", desc: `Notre équipe vous contacte sur WhatsApp avec les détails de paiement.` },
                { step: "3", title: "Accès activé", desc: "Après confirmation du paiement, vos identifiants sont envoyés." },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center mx-auto mb-3">
                    <span className="font-display font-bold text-cyan-400">{s.step}</span>
                  </div>
                  <h4 className="font-display font-medium text-white mb-1">{s.title}</h4>
                  <p className="text-white/50 text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-white/50 text-sm mb-4">
              Une question concernant le paiement ?
            </p>
            <a
              href={`https://wa.me/${SITE_CONFIG.whatsappNumber.replace(/[+\s]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 rounded-xl hover:from-green-400 hover:to-green-500 transition-all"
            >
              <FiSmartphone className="w-4 h-4" />
              Nous contacter sur WhatsApp
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
