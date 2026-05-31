import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base — matches spec §9.1
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold tracking-[0.01em] rounded-md transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary — teal-700 bg, white text
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground",
        // Danger
        destructive:
          "bg-[#ef4444] text-white hover:bg-[#dc2626] active:bg-[#b91c1c] disabled:bg-muted disabled:text-muted-foreground",
        // Secondary / Outline — teal-500 border, teal-700 text
        outline:
          "border border-[1.5px] border-teal-500 bg-transparent text-teal-700 hover:bg-teal-50 hover:border-teal-700 disabled:text-muted-foreground disabled:border-muted",
        // Ghost
        ghost:
          "bg-transparent text-teal-700 hover:bg-teal-50 active:bg-teal-100 disabled:text-muted-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        link:
          "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-[10px]",
        sm:      "h-8 px-[14px] py-[6px] text-xs",
        lg:      "h-12 px-7 py-[14px] text-base",
        icon:    "h-10 w-10 p-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
