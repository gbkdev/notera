import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:opacity-90",
  accent: "bg-accent text-accent-foreground hover:opacity-90",
  outline: "border border-input bg-card hover:bg-muted",
  ghost: "hover:bg-muted",
  destructive: "bg-destructive text-white hover:opacity-90",
} as const;
const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base", icon: "h-10 w-10" } as const;

export function buttonVariants({ variant = "default", size = "md", className }: {
  variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    variants[variant], sizes[size], className
  );
}

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants; size?: keyof typeof sizes };
export const Button = React.forwardRef<HTMLButtonElement, Props>(({ className, variant, size, type = "button", ...props }, ref) => (
  <button ref={ref} type={type} className={buttonVariants({ variant, size, className })} {...props} />
));
Button.displayName = "Button";

export function LinkButton({ href, variant, size, className, children, ...rest }: {
  href: string; variant?: keyof typeof variants; size?: keyof typeof sizes; className?: string; children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return <Link href={href} className={buttonVariants({ variant, size, className })} {...rest}>{children}</Link>;
}
