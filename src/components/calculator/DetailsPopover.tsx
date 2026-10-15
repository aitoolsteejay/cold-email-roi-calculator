import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Props {
  /** Accessible name for the trigger, e.g. "Bounce rate details". */
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Info button that opens a small card: on hover with a mouse, on tap with touch, and with Enter or Space.
 * Unlike a tooltip it stays open while the pointer moves into it, so links inside can be clicked.
 */
/** True on screens wide enough for the card to open beside the inputs column. */
function useWideScreen() {
  const query = "(min-width: 1024px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return wide;
}

export function DetailsPopover({ label, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const wide = useWideScreen();
  const closeTimer = useRef<number | undefined>(undefined);
  const openedByHover = useRef(false);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hideSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) openedByHover.current = false;
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onPointerEnter={(e) => {
            if (e.pointerType !== "mouse" || open) return;
            openedByHover.current = true;
            show();
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === "mouse" && openedByHover.current) hideSoon();
          }}
          onClick={(e) => {
            // A click after a hover-open pins the card open instead of closing it.
            e.preventDefault();
            if (openedByHover.current) {
              openedByHover.current = false;
              show();
            } else setOpen((o) => !o);
          }}
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:text-foreground",
            className,
          )}
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={wide ? "right" : "bottom"}
        align={wide ? "start" : "center"}
        className="w-80 text-sm"
        onPointerEnter={(e) => e.pointerType === "mouse" && openedByHover.current && show()}
        onPointerLeave={(e) => e.pointerType === "mouse" && openedByHover.current && hideSoon()}
        // Hovering should not pull keyboard focus away from where the visitor is.
        onOpenAutoFocus={(e) => openedByHover.current && e.preventDefault()}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

/** A labelled block inside a details card. */
export function DetailsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 border-b border-border pb-3 last:border-0 last:pb-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="text-sm leading-snug text-foreground">{children}</div>
    </div>
  );
}

/** Source links for a details card. */
export function SourceLinks({ sources }: { sources: { name: string; url: string; note: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {sources.map((s) => (
        <li key={s.name + s.note} className="leading-snug">
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-primary decoration-2 underline-offset-2 hover:text-foreground/80">
            {s.name}
          </a>
          <span className="block text-xs text-muted-foreground">{s.note}</span>
        </li>
      ))}
    </ul>
  );
}
