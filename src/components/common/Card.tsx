type CardVariant = "default" | "highlighted";

interface CardProps {
  variant?: CardVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({
  variant = "default",
  title,
  children,
  className = "",
  onClick,
}: CardProps) {
  const variantStyles: Record<CardVariant, string> = {
    default: "bg-surface",
    highlighted: "bg-accent-light border-l-[3px] border-l-accent",
  };

  return (
    <div
      className={`
        rounded-[16px] p-6
        ${variantStyles[variant]}
        ${className}
      `.trim()}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {title && (
        <h3 className="mb-3 text-lg font-semibold text-primary">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
