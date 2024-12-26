import { type VariantProps, cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

export const buttonVariants = cva(
  "flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        error:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-secondary/15 bg-transparent text-secondary hover:bg-secondary/10",
        secondary:
          "border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "border-transparent text-primary hover:bg-primary/10 hover:text-primary",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 rounded-sm px-4 text-sm",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "size-10 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
