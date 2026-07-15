import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { motion } from "framer-motion";
import { FiStar, FiMessageSquare } from "react-icons/fi";
import "swiper/css";
import "swiper/css/pagination";
import { TESTIMONIALS } from "@/data/siteData";

export default function TestimonialCarousel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="testimonial-swiper !pb-12"
      >
        {TESTIMONIALS.map((t, i) => (
          <SwiperSlide key={i}>
            <div className="border border-white/[0.04] rounded-xl p-5 h-full flex flex-col bg-[#111d32]/40 hover:border-white/[0.08] transition-colors duration-300">
              <FiMessageSquare className="w-5 h-5 text-white/[0.06] mb-3" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <FiStar key={j} className={`w-3 h-3 ${j < t.rating ? "text-[#5a6b4e]/50 fill-[#5a6b4e]/50" : "text-white/[0.06]"}`} />
                ))}
              </div>
              <p className="text-white/50 text-sm leading-relaxed flex-1 mb-4 font-light">
                "{t.content}"
              </p>
              <div className="pt-3 border-t border-white/[0.03]">
                <div className="font-display font-medium text-white/80 text-sm">{t.name}</div>
                <div className="text-white/60 text-xs tracking-wide">{t.role}</div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style>{`
        .testimonial-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.08) !important;
          opacity: 1 !important;
          width: 6px !important;
          height: 6px !important;
          transition: all 0.3s !important;
        }
        .testimonial-swiper .swiper-pagination-bullet-active {
          background: rgba(90,107,78,0.5) !important;
          width: 20px !important;
          border-radius: 3px !important;
        }
      `}</style>
    </motion.div>
  );
}
