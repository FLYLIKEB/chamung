import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-0 bg-transparent text-sm font-medium underline underline-offset-[0.32em] decoration-[0.04em] decoration-current transition-colors disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:underline focus-visible:decoration-[0.08em] aria-invalid:text-destructive",
  {
    variants: {
      variant: {
        default: "text-foreground hover:text-foreground/65",
        destructive: "text-destructive hover:text-destructive/70",
        outline: "text-foreground hover:text-foreground/65",
        secondary: "text-muted-foreground hover:text-foreground",
        ghost: "text-foreground hover:text-foreground/65",
        link: "text-foreground hover:text-foreground/65",
      },
      size: {
        default: "min-h-10 px-0 py-2 has-[>svg]:px-0",
        sm: "min-h-8 gap-1.5 px-0 py-1 has-[>svg]:px-0",
        lg: "min-h-11 px-0 py-2.5 has-[>svg]:px-0 text-base",
        icon: "size-10 p-0 no-underline",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
