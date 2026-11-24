"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-[transform,translate,box-shadow] duration-(--duration-interface) ease-links outline-none select-none active:not-aria-[haspopup]:translate-y-press focus-visible:outline-solid focus-visible:outline-(length:--spacing-focus) focus-visible:outline-ring focus-visible:outline-offset-(--spacing-focus-offset) disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-foreground bg-primary text-primary-foreground hover:bg-background hover:text-foreground focus-visible:bg-background focus-visible:text-foreground",
        outline:
          "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background aria-expanded:bg-foreground aria-expanded:text-background",
        raised: "border-foreground bg-panel text-foreground shadow-panel active:not-aria-[haspopup]:shadow-panel-pressed hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        header:
          "text-sm font-medium text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:decoration-(length:--spacing-header-underline) aria-[current=page]:underline-offset-(--spacing-link-underline)",
        headerIcon: "text-foreground",
        swatch: "w-full items-end justify-start whitespace-normal break-all border-border bg-(--swatch) text-left font-normal text-(--swatch-text)",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "link-text focus-visible:outline-auto focus-visible:outline-(length:--spacing-hairline) focus-visible:outline-offset-(--spacing-link-focus-offset) focus-visible:outline-link-focus",
      },
      size: {
        swatch: "h-20 p-2",
        swatchCompact: "h-12 p-1",
        row: "grid h-auto w-full min-w-0 grid-cols-1 justify-items-start gap-3 whitespace-normal p-4 text-left sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6",
        link: "h-auto gap-1.5 p-0 text-sm",
        header: "h-8 gap-1.5 px-2.5",
        navigation: "min-h-action min-w-navigation px-4 py-control-inline text-sm font-normal whitespace-normal",
        play: "h-action w-full font-normal [&_svg:not([class*='size-'])]:size-6",
        toolbar: "h-toolbar w-full font-normal [&_svg:not([class*='size-'])]:size-[1.125rem]",
        pause: "h-8 min-w-8 px-control-inline py-control-block font-normal [&_svg:not([class*='size-'])]:size-[0.9375rem]",
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-none px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-none px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs": "size-6 rounded-none [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-none",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
