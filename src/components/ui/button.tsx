import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all duration-200 ease-spring-smooth active:scale-[0.95] active:transition-[transform_0.1s]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-t border-white/20 shadow-soft hover:-translate-y-0.5 hover:shadow-premium hover:scale-[1.01]",
        destructive: "bg-destructive text-destructive-foreground border-t border-white/10 shadow-soft hover:-translate-y-0.5 hover:shadow-soft-md hover:scale-[1.01]",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5",
        secondary: "bg-secondary text-secondary-foreground border border-white/10 shadow-soft hover:-translate-y-0.5 hover:shadow-soft-md hover:scale-[1.01]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-gradient-to-b from-orange-400 to-orange-500 text-white border-t border-white/20 shadow-soft hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(249,115,22,0.35)] hover:scale-[1.01]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
