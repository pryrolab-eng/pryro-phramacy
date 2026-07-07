import { cn } from "@/lib/utils";

function ShortcutKey({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      data-shortcut-kbd
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[5px]",
        "border border-neutral-300/80 bg-neutral-100/90 font-sans text-[12px] font-medium leading-none text-neutral-500",
        "shadow-[0_1px_0_rgba(0,0,0,0.04)]",
        "dark:border-neutral-600/80 dark:bg-neutral-800/90 dark:text-neutral-400",
        className,
      )}
    >
      <span className="leading-none">{children}</span>
    </kbd>
  );
}

export function NavMenuShortcut({
  keys,
  className,
}: {
  keys: string[];
  className?: string;
}) {
  return (
    <div
      role="presentation"
      className={cn("ml-auto flex shrink-0 items-center gap-1", className)}
    >
      {keys.map((key) => (
        <ShortcutKey key={key}>{key}</ShortcutKey>
      ))}
    </div>
  );
}
