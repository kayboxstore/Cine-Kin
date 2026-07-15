import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

interface ScrambleTextProps {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "span" | "div";
}

export default function ScrambleText({
  text,
  className = "",
  duration = 1.5,
  delay = 0,
  as: Tag = "span",
}: ScrambleTextProps) {
  const [display, setDisplay] = useState(text);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const timeout = setTimeout(() => {
      const totalFrames = Math.floor(duration * 60);
      let frame = 0;

      const interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const revealed = Math.floor(progress * text.length);

        let result = "";
        for (let i = 0; i < text.length; i++) {
          if (i < revealed) {
            result += text[i];
          } else if (text[i] === " ") {
            result += " ";
          } else {
            result += CHARS[Math.floor(Math.random() * CHARS.length)];
          }
        }
        setDisplay(result);

        if (frame >= totalFrames) {
          clearInterval(interval);
          setDisplay(text);
        }
      }, 1000 / 60);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [text, duration, delay]);

  return <Tag className={className}>{display}</Tag>;
}
