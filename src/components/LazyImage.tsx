import { useState, useEffect, useRef } from "react";
import ResponsiveImage from "./ResponsiveImage";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}

export default function LazyImage({
  src,
  alt,
  className = "",
  sizes,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Blur placeholder */}
      <div
        className={`absolute inset-0 bg-white/[0.03] transition-opacity duration-700 ${
          isLoaded ? "opacity-0" : "opacity-100"
        }`}
      />

      {isInView && (
        <ResponsiveImage
          src={src}
          alt={alt}
          sizes={sizes}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover ${isLoaded ? "blur-0 opacity-100 scale-100" : "blur-lg opacity-0 scale-105"} transition-all duration-700`}
          loading="lazy"
        />
      )}
    </div>
  );
}
