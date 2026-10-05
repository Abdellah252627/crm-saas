import type { InputHTMLAttributes } from "react";
import { FIELD_CLASS, LABEL_CLASS } from "../../lib/ui";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

export function Input({ id, label, error, className = "", ...rest }: InputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className={LABEL_CLASS}
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error !== undefined}
        className={`mt-1 ${FIELD_CLASS} ${
          error === undefined ? "" : "border-red-400"
        } ${className}`}
        {...rest}
      />
      {error === undefined ? null : (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
