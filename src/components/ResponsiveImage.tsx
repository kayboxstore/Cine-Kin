import type { ImgHTMLAttributes } from "react";

type ResponsiveImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet"
> & {
  src: string;
  sizes?: string;
};

function responsiveWebpSrcSet(src: string): string | undefined {
  if (!/\.jpe?g$/i.test(src)) return undefined;
  const base = src.replace(/\.jpe?g$/i, "");
  return `${base}-480.webp 480w, ${base}-1024.webp 1024w`;
}

export default function ResponsiveImage({
  src,
  alt = "",
  sizes = "100vw",
  loading = "lazy",
  decoding = "async",
  ...props
}: ResponsiveImageProps) {
  const webpSrcSet = responsiveWebpSrcSet(src);

  return (
    <picture className="contents">
      {webpSrcSet && (
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
      )}
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        loading={loading}
        decoding={decoding}
        {...props}
      />
    </picture>
  );
}
