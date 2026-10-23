interface ParallaxHeroProps {
  children: React.ReactNode;
}

export default function ParallaxHero({ children }: ParallaxHeroProps) {
  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
