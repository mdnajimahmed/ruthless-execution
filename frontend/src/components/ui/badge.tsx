import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Badge — spec §9.8
const badgeVariants = cva(
  "inline-flex items-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Neutral
        default:
          "border-transparent bg-muted text-muted-foreground px-2.5 py-0.5 text-xs",
        // Primary — teal
        primary:
          "border-transparent bg-teal-100 text-teal-700 px-2.5 py-0.5 text-xs",
        // Success
        success:
          "border-transparent bg-[#f0fdf4] text-[#166534] px-2.5 py-0.5 text-xs",
        // Warning
        warning:
          "border-transparent bg-[#fffbeb] text-[#92400e] px-2.5 py-0.5 text-xs",
        // Error / Destructive
        destructive:
          "border-transparent bg-[#fef2f2] text-[#991b1b] px-2.5 py-0.5 text-xs",
        // Outline teal
        outline:
          "border border-teal-300 bg-transparent text-teal-600 px-2.5 py-0.5 text-xs",
        // Secondary (neutral alias — keeps shadcn compat)
        secondary:
          "border-transparent bg-muted text-muted-foreground px-2.5 py-0.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
