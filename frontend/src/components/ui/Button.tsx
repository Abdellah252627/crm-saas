import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "../Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  isLoading?: boolean;
  children: ReactNode;
}

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400",
  secondary:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",
};

export function Button({
  variant = "primary",
  isLoading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...rest}
    >
      {isLoading ? <Spinner className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}
