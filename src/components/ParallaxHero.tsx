import { useEffect, useRef } from "react";

interface ParallaxHeroProps {
  children: React.ReactNode;
}

export default function ParallaxHero({ children }: ParallaxHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    // Respect the user's reduced-motion preference: skip the parallax entirely.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let cancelled = false;
    let ctx: { revert: () => void } | undefined;

    // Load GSAP lazily so it stays out of the initial (above-the-fold) bundle.
    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !containerRef.current || !contentRef.current) return;

      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.to(contentRef.current, {
          yPercent: 30,
          opacity: 0.3,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }, containerRef);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      <div ref={contentRef} className="relative z-10">
        {children}
      </div>
    </div>
  );
}
