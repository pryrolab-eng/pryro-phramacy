import { forwardRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Input>;

export const DashboardSearchInput = forwardRef<HTMLInputElement, Props>(
  function DashboardSearchInput({ className, ...props }, ref) {
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          ref={ref}
          className={cn(
            "h-8 rounded-lg border-neutral-200/80 bg-white pl-8 text-sm shadow-sm dark:border-neutral-700 dark:bg-neutral-900",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
