"use client";

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export default function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  id,
  className = "",
}: ToggleProps) {
  const toggleId = id ?? `toggle-${label?.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <label
      htmlFor={toggleId}
      className={`
        inline-flex items-center gap-3
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        ${className}
      `.trim()}
    >
      <button
        id={toggleId}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative h-[28px] w-[52px] shrink-0 rounded-full
          transition-colors duration-200 ease-in-out
          outline-none
          focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
          ${checked ? "bg-accent" : "bg-border"}
        `.trim()}
      >
        <span
          className={`
            absolute top-[2px] left-[2px]
            h-[24px] w-[24px] rounded-full bg-white
            transition-transform duration-200 ease-in-out
            ${checked ? "translate-x-[24px]" : "translate-x-0"}
          `.trim()}
        />
      </button>
      {label && (
        <span className="text-base text-primary">{label}</span>
      )}
    </label>
  );
}
