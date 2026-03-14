"use client";

import { useState, useCallback } from "react";

interface InputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  type?: "text" | "number";
  suffix?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (raw: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

function formatWithComma(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR");
}

export default function Input({
  label,
  placeholder,
  error,
  type = "text",
  suffix,
  value: controlledValue,
  defaultValue,
  onChange,
  onValueChange,
  name,
  id,
  disabled = false,
  className = "",
}: InputProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(
    defaultValue !== undefined && type === "number"
      ? formatWithComma(defaultValue)
      : defaultValue ?? ""
  );

  const displayValue = isControlled
    ? type === "number"
      ? formatWithComma(controlledValue)
      : controlledValue
    : internalValue;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      if (type === "number") {
        const digitsOnly = raw.replace(/[^\d]/g, "");
        const formatted = formatWithComma(digitsOnly);

        if (!isControlled) {
          setInternalValue(formatted);
        }

        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: digitsOnly },
        } as React.ChangeEvent<HTMLInputElement>;

        onChange?.(syntheticEvent);
        onValueChange?.(digitsOnly);
      } else {
        if (!isControlled) {
          setInternalValue(raw);
        }
        onChange?.(e);
        onValueChange?.(raw);
      }
    },
    [type, isControlled, onChange, onValueChange]
  );

  const inputId = id ?? name;
  const borderStyle = error
    ? "border-danger focus:border-danger"
    : "border-border focus:border-accent";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-primary"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type="text"
          inputMode={type === "number" ? "numeric" : "text"}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          disabled={disabled}
          className={`
            w-full rounded-[12px] border bg-white px-4 py-3 text-base text-primary
            placeholder:text-secondary
            transition-colors duration-200
            outline-none
            disabled:cursor-not-allowed disabled:bg-surface disabled:text-secondary
            ${suffix ? "pr-14" : ""}
            ${borderStyle}
          `.trim()}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-secondary">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
