import { Link } from "react-router-dom";
import { FiActivity, FiArrowRight } from "react-icons/fi";
import ScrollReveal from "./ScrollReveal";
import { COMMERCIAL_INFO } from "@/data/commercial";

export default function ServerStatus() {
  return (
    <section className="py-20 bg-[#0a1628]">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <ScrollReveal>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 sm:p-10 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#5a6b4e]/10">
              <FiActivity className="h-6 w-6 text-[#6b7c5c]" />
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-3">
              État technique <span className="text-[#6b7c5c]">vérifiable</span>
            </h2>
            <p className="mx-auto mb-7 max-w-2xl text-sm leading-relaxed text-white/60">
              {COMMERCIAL_INFO.status.scope}
            </p>
            <Link
              to="/status"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5a6b4e] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4d5d42]"
            >
              Vérifier la plateforme
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
