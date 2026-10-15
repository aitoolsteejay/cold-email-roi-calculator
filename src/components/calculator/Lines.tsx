import { cn } from "@/lib/utils";

/** Short facts shown one per line instead of run together in a paragraph. */
export function Lines({ items, className }: { items: React.ReactNode[]; className?: string }) {
  return (
    <ul className={cn("space-y-0.5", className)}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
