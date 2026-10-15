import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  // data-pdf-keep: the PDF export never breaks a page inside a card.
  <div ref={ref} data-pdf-keep="" className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";
