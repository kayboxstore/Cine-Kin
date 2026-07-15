interface LogoProps {
  className?: string;
  size?: number;
  variant?: "full" | "icon";
}

export default function Logo({ className = "", size = 40, variant = "full" }: LogoProps) {
  const s = size;

  if (variant === "icon") {
    return (
      <img
        src="/images/logo-main.png"
        alt="Ciné Kin Premium"
        width={s}
        height={s}
        className={`rounded-xl object-cover ${className}`}
        style={{ width: s, height: s }}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/images/logo-main.png"
        alt=""
        width={s}
        height={s}
        className="rounded-xl object-cover"
        style={{ width: s, height: s }}
      />
      <span
        className="font-display font-bold tracking-tight"
        style={{
          fontSize: s * 0.45,
          lineHeight: 1,
        }}
      >
        <span className="text-white">Ciné Kin</span>{" "}
        <span className="bg-gradient-to-r from-[#5a6b4e] to-[#8aaf8a] bg-clip-text text-transparent">
          Premium
        </span>
      </span>
    </div>
  );
}
