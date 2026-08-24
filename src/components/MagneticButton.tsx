interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export default function MagneticButton({
  children,
  className = "",
}: MagneticButtonProps) {
  // This component is always rendered inside a Link. Keeping it non-interactive
  // avoids the invalid and inaccessible link > button nesting used previously.
  return <span className={className}>{children}</span>;
}
