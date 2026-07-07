"use client";

import {
  ArrowDown,
  ArrowUp,
  BringToFront,
  Copy,
  Grid3x3,
  Magnet,
  Redo,
  SendToBack,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  CopyPlus,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CanvasToolbarProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onLockToggle: () => void;
  isLocked: boolean;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  snapEnabled: boolean;
  onSnapToggle: () => void;
  showGuides: boolean;
  onGuidesToggle: () => void;
  hasSelection: boolean;
  elementCount: number;
};

function ToolbarButton({
  onClick,
  disabled,
  title,
  children,
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md transition-colors",
        "hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70",
        "disabled:pointer-events-none disabled:opacity-30",
        active && "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-neutral-200 dark:bg-neutral-700" />;
}

export function CanvasToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCopy,
  onCut,
  onPaste,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onLockToggle,
  isLocked,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  snapEnabled,
  onSnapToggle,
  showGuides,
  onGuidesToggle,
  hasSelection,
  elementCount,
}: CanvasToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-0.5 rounded-lg border border-neutral-200/80 bg-white px-2 py-1.5 text-xs dark:border-neutral-700 dark:bg-neutral-900/60">
      {/* History */}
      <ToolbarButton onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        <Redo className="size-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Clipboard */}
      <ToolbarButton onClick={onCopy} disabled={!hasSelection} title="Copy (Ctrl+C)">
        <Copy className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={onCut} disabled={!hasSelection} title="Cut (Ctrl+X)">
        <CopyPlus className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={onPaste} title="Paste (Ctrl+V)">
        <CopyPlus className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={onDuplicate} disabled={!hasSelection} title="Duplicate (Ctrl+D)">
        <Copy className="size-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Delete */}
      <ToolbarButton onClick={onDelete} disabled={!hasSelection} title="Delete (Del)">
        <Trash2 className="size-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Z-index */}
      <ToolbarButton onClick={onBringToFront} disabled={!hasSelection} title="Bring to front">
        <BringToFront className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={onBringForward} disabled={!hasSelection} title="Bring forward">
        <ArrowUp className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={onSendBackward} disabled={!hasSelection} title="Send backward">
        <ArrowDown className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={onSendToBack} disabled={!hasSelection} title="Send to back">
        <SendToBack className="size-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Lock */}
      <ToolbarButton onClick={onLockToggle} disabled={!hasSelection} title="Toggle lock (Ctrl+L)" active={isLocked}>
        {isLocked ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
      </ToolbarButton>

      <Divider />

      {/* Settings */}
      <ToolbarButton onClick={onSnapToggle} title="Toggle snap to grid" active={snapEnabled}>
        <Magnet className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={onGuidesToggle} title="Toggle alignment guides" active={showGuides}>
        <Grid3x3 className="size-3.5" />
      </ToolbarButton>

      <Divider />

      {/* Zoom */}
      <ToolbarButton onClick={onZoomOut} title="Zoom out">
        <ZoomOut className="size-3.5" />
      </ToolbarButton>
      <button
        type="button"
        onClick={onZoomReset}
        title="Reset zoom"
        className="min-w-[3rem] rounded-md px-1.5 py-0.5 text-center text-xs font-medium tabular-nums hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ToolbarButton onClick={onZoomIn} title="Zoom in">
        <ZoomIn className="size-3.5" />
      </ToolbarButton>

      {/* Right side info */}
      <div className="ml-auto flex items-center gap-2 pl-2 text-neutral-400 dark:text-neutral-500">
        <span>{elementCount} element{elementCount !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}
