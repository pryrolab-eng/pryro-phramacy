"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type AnimatedTextLine = {
  text: string;
  className?: string;
};

const defaultLines: AnimatedTextLine[] = [
  { text: "Initializing ...", className: "text-blue-500" },
  { text: "Fetching Data...", className: "text-orange-400" },
  { text: "Rendering...", className: "text-teal-400" },
  { text: "System Ready", className: "text-sky-500" },
];

export type AnimatedTextRollerProps = {
  lines?: AnimatedTextLine[];
  /** Prefix shown before the rolling lines (demo default). */
  prefix?: string;
  className?: string;
  lineClassName?: string;
  intervalMs?: number;
};

export function AnimatedTextRoller({
  lines = defaultLines,
  prefix,
  className,
  lineClassName = "h-8 flex items-center justify-start text-xl sm:text-2xl",
  intervalMs = 2000,
}: AnimatedTextRollerProps) {
  const [index, setIndex] = useState(0);
  const lineHeightRem = 2;

  useEffect(() => {
    if (lines.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % lines.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [lines.length, intervalMs]);

  if (lines.length === 0) return null;

  const active = lines[index] ?? lines[0];

  if (lines.length === 1) {
    return (
      <p className={cn(lineClassName, active.className, className)}>
        {active.text}
      </p>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {prefix ? (
        <p className="text-xl sm:text-2xl text-foreground">{prefix}</p>
      ) : null}
      <div
        className="overflow-hidden text-center"
        style={{ height: `${lineHeightRem}rem` }}
      >
        <div
          className="transition-transform duration-700 ease-in-out"
          style={{ transform: `translateY(-${index * lineHeightRem}rem)` }}
        >
          {lines.map((line, i) => (
            <p
              key={`${line.text}-${i}`}
              className={cn(lineClassName, line.className)}
              style={{ height: `${lineHeightRem}rem` }}
            >
              {line.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnimatedTextRoller;
