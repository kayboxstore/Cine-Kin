import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface GSAPScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
}

export default function GSAPScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 40,
  duration = 0.8,
}: GSAPScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const getFrom = () => {
      switch (direction) {
        case "up": return { y: distance, opacity: 0 };
        case "down": return { y: -distance, opacity: 0 };
        case "left": return { x: distance, opacity: 0 };
        case "right": return { x: -distance, opacity: 0 };
        default: return { y: distance, opacity: 0 };
      }
    };

    const ctx = gsap.context(() => {
      gsap.from(ref.current!, {
        ...getFrom(),
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current!,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [delay, direction, distance, duration]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
