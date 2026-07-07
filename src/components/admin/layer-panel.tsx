"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  GripVertical,
  Lock,
  Unlock,
  Type,
  Hash,
  Calendar,
  DollarSign,
  User,
  Image,
  Minus,
} from "lucide-react";
import type { CanvasElement } from "@/lib/admin/insurance-template-canvas";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, typeof Type> = {
  text: Type,
  title: Type,
  variable: Hash,
  date: Calendar,
  amount: DollarSign,
  patient: User,
  image: Image,
  line: Minus,
};

function getElementLabel(el: CanvasElement): string {
  if (el.type === "line") return "Line";
  if (el.type === "image") return String(el.alt ?? "Image");
  if (el.type === "variable" || el.type === "date" || el.type === "amount" || el.type === "patient") {
    return String(el.label ?? el.variable ?? el.type);
  }
  const text = String(el.text ?? "");
  return text.length > 24 ? text.slice(0, 24) + "..." : text || el.type;
}

type LayerPanelProps = {
  elements: CanvasElement[];
  selectedIds: Set<string | number>;
  onSelectElement: (el: CanvasElement | null, additive?: boolean) => void;
  onToggleVisibility: (id: string | number) => void;
  onToggleLock: (id: string | number) => void;
  onMoveUp: (id: string | number) => void;
  onMoveDown: (id: string | number) => void;
};

export function LayerPanel({
  elements,
  selectedIds,
  onSelectElement,
  onToggleVisibility,
  onToggleLock,
  onMoveUp,
  onMoveDown,
}: LayerPanelProps) {
  const reversed = [...elements].reverse();

  return (
    <div className="space-y-1">
      {reversed.length === 0 ? (
        <p className="py-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
          No layers yet
        </p>
      ) : (
        reversed.map((el, idx) => {
          const Icon = TYPE_ICONS[el.type] ?? Type;
          const isSelected = selectedIds.has(el.id);
          const isHidden = el.visible === false;
          const isLocked = el.locked === true;

          return (
            <div
              key={String(el.id)}
              className={cn(
                "group flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
                "cursor-pointer select-none",
                isSelected
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60",
                isHidden && "opacity-40",
              )}
              onClick={(e) => onSelectElement(el, e.shiftKey)}
            >
              <GripVertical className="size-3 shrink-0 text-neutral-300 dark:text-neutral-600" />

              <Icon className="size-3.5 shrink-0" />

              <span className="min-w-0 flex-1 truncate font-medium">
                {getElementLabel(el)}
              </span>

              {/* Visibility */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVisibility(el.id);
                }}
                className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-neutral-200/70 group-hover:opacity-100 dark:hover:bg-neutral-700/70"
                title={isHidden ? "Show" : "Hide"}
              >
                {isHidden ? (
                  <EyeOff className="size-3 text-neutral-400" />
                ) : (
                  <Eye className="size-3 text-neutral-400" />
                )}
              </button>

              {/* Lock */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(el.id);
                }}
                className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-neutral-200/70 group-hover:opacity-100 dark:hover:bg-neutral-700/70"
                title={isLocked ? "Unlock" : "Lock"}
              >
                {isLocked ? (
                  <Lock className="size-3 text-neutral-400" />
                ) : (
                  <Unlock className="size-3 text-neutral-400" />
                )}
              </button>

              {/* Move up/down */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(el.id);
                }}
                className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-neutral-200/70 group-hover:opacity-100 dark:hover:bg-neutral-700/70"
                title="Move up"
              >
                <ArrowUp className="size-3 text-neutral-400" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(el.id);
                }}
                className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-neutral-200/70 group-hover:opacity-100 dark:hover:bg-neutral-700/70"
                title="Move down"
              >
                <ArrowDown className="size-3 text-neutral-400" />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
