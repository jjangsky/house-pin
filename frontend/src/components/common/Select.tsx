"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface SelectOption {
  value: string;
  label: string;
}

type SelectSize = "xs" | "sm" | "md";

interface SelectProps {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  size?: SelectSize;
}

const sizeStyles: Record<SelectSize, { trigger: string; option: string }> = {
  xs: { trigger: "px-2.5 py-1.5 text-xs", option: "px-2.5 py-1.5 text-xs" },
  sm: { trigger: "px-3 py-2 text-sm", option: "px-3 py-2 text-sm" },
  md: { trigger: "px-4 py-3 text-base", option: "px-4 py-3 text-base" },
};

export default function Select({
  label,
  options,
  placeholder,
  value,
  onValueChange,
  name,
  id,
  disabled = false,
  className = "",
  size = "md",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = id ?? name;

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label ?? placeholder ?? "선택하세요";
  const isPlaceholder = !selectedOption;

  const handleToggle = useCallback(() => {
    if (!disabled) setIsOpen((prev) => !prev);
  }, [disabled]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onValueChange?.(optionValue);
      setIsOpen(false);
    },
    [onValueChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown" && isOpen) {
        e.preventDefault();
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const nextIndex = Math.min(currentIndex + 1, options.length - 1);
        onValueChange?.(options[nextIndex].value);
      } else if (e.key === "ArrowUp" && isOpen) {
        e.preventDefault();
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const prevIndex = Math.max(currentIndex - 1, 0);
        onValueChange?.(options[prevIndex].value);
      }
    },
    [disabled, isOpen, options, value, onValueChange]
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`flex flex-col gap-2 ${className}`} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Trigger button */}
        <button
          type="button"
          id={selectId}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={`
            flex w-full items-center justify-between rounded-[12px] border
            ${sizeStyles[size].trigger} text-left transition-all duration-200
            outline-none
            ${
              isOpen
                ? "border-accent ring-2 ring-accent/10"
                : "border-border hover:border-secondary"
            }
            ${isPlaceholder ? "text-secondary" : "text-primary"}
            ${
              disabled
                ? "cursor-not-allowed bg-surface text-secondary"
                : "cursor-pointer bg-white"
            }
          `.trim()}
        >
          <span className="truncate">{displayText}</span>
          <svg
            className={`shrink-0 text-secondary transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 7.5L10 12.5L15 7.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <ul
            role="listbox"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[12px] border border-border bg-white py-1 shadow-lg"
          >
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={`
                    flex cursor-pointer items-center justify-between ${sizeStyles[size].option}
                    transition-colors duration-100
                    ${
                      isSelected
                        ? "bg-accent-light text-accent font-medium"
                        : "text-primary hover:bg-surface"
                    }
                  `.trim()}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 8.5L6.5 11.5L12.5 4.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
