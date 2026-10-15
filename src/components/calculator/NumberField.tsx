import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseNumberInput } from "@/lib/format";
import { InfoTip } from "./InfoTip";

interface NumberFieldProps {
  id: string;
  label: string;
  help: React.ReactNode;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  locale?: string;
  prefix?: string;
  integer?: boolean;
  max?: number;
  hint?: React.ReactNode;
  labelClassName?: string;
}

function display(value: number | null, locale: string) {
  return value === null ? "" : new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
}

/** Text input that accepts commas and spaces, never emits NaN, and formats on blur. */
export function NumberField({
  id,
  label,
  help,
  value,
  onChange,
  placeholder,
  locale = "en-US",
  prefix,
  integer,
  max,
  hint,
  labelClassName,
}: NumberFieldProps) {
  const [text, setText] = useState(display(value, locale));
  const [focused, setFocused] = useState(false);

  // Keep in sync with outside changes (reset, currency locale) while not typing.
  useEffect(() => {
    if (!focused) setText(display(value, locale));
  }, [value, locale, focused]);

  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
        <InfoTip label={label}>{help}</InfoTip>
      </div>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="text"
          inputMode={integer ? "numeric" : "decimal"}
          autoComplete="off"
          placeholder={placeholder}
          aria-describedby={hintId}
          value={text}
          style={prefix ? { paddingLeft: `${0.75 + prefix.length * 0.55}rem` } : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setText(display(value, locale));
          }}
          onChange={(e) => {
            const raw = e.target.value;
            setText(raw);
            let n = parseNumberInput(raw);
            if (n !== null && integer) n = Math.floor(n);
            if (n !== null && max !== undefined) n = Math.min(n, max);
            onChange(n);
          }}
        />
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
