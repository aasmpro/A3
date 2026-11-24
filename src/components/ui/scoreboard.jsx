import { cn } from "cn";

export function Scoreboard({ entries, variant = "inline", className, ...props }) {
  return (
    <dl data-slot="scoreboard" data-variant={variant} aria-label="Scores"
      className={cn(
        variant === "hud" ? "grid w-max grid-cols-[max-content_max-content] gap-x-3 font-bold whitespace-nowrap" : "flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-foreground py-score-block text-base leading-description",
        className,
      )} {...props}>
      {entries.map(([label, value]) => (
        <div key={label} className={variant === "hud" ? "contents" : "inline-flex items-baseline gap-2"}>
          <dt>{label}</dt>
          <dd className={cn("m-0 text-left tabular-nums", variant !== "hud" && "text-2xl font-bold")}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
