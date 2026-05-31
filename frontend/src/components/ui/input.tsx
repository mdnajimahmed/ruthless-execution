import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base — spec §9.2
          "flex h-10 w-full rounded-md border border-input bg-white px-3 py-2",
          "text-sm text-foreground placeholder:text-muted-foreground",
          "shadow-sm",
          // Focus — teal-500 border + teal-400 ring
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-teal-500",
          // Error state applied externally via aria-invalid
          "aria-[invalid=true]:border-[#fca5a5] aria-[invalid=true]:ring-[#fca5a5]",
          // Disabled
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:border-muted",
          // File input reset
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
