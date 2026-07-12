"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
}

export function PasswordInput({ id, label, error, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const inputId = id;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-[13px] font-medium text-[#0A0A0A]">
        {label}
      </label>
      <div className="relative">
        <Input
          id={inputId}
          type={visible ? "text" : "password"}
          className={`pr-10 ${error ? "border-[#EF4444]" : ""} ${className ?? ""}`}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#0A0A0A] transition-colors"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-[12px] text-[#EF4444]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
