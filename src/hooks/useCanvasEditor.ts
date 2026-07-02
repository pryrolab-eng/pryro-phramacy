"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CanvasElement } from "@/lib/admin/insurance-template-canvas";
import type { CanvasComponentDef } from "@/components/admin/insurance-template-designer-canvas";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/components/admin/insurance-template-designer-canvas";

const GRID_SIZE = 10;
const MAX_HISTORY = 50;

function snapToGrid(val: number): number {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function cloneElements(elements: CanvasElement[]): CanvasElement[] {
  return elements.map((el) => ({ ...el }));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export type AlignmentGuide = {
  type: "horizontal" | "vertical";
  pos: number;
  min: number;
  max: number;
};

type CanvasEditorOptions = {
  initialElements?: CanvasElement[];
  onElementsChange?: (elements: CanvasElement[]) => void;
};

export function useCanvasEditor(opts: CanvasEditorOptions = {}) {
  const { initialElements = [], onElementsChange } = opts;

  const [elements, setElementsState] = useState<CanvasElement[]>(initialElements);

  // Export setElements for external use
  const setElements = setElementsState;
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  const historyRef = useRef<CanvasElement[][]>([initialElements]);
  const historyIndexRef = useRef(0);
  const isUndoRedoRef = useRef(false);

  const setElementsCallback = useCallback(
    ( updater: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
      setElementsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (!isUndoRedoRef.current) {
          historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
          historyRef.current.push(cloneElements(next));
          if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.shift();
          } else {
            historyIndexRef.current++;
          }
        }
        isUndoRedoRef.current = false;
        onElementsChange?.(next);
        return next;
      });
    },
    [onElementsChange],
  );

  // ── Selection ──────────────────────────────────────────────────────────

  const selectedElement = elements.find((el) => selectedIds.has(el.id)) ?? null;
  const selectedElements = elements.filter((el) => selectedIds.has(el.id));

  const selectElement = useCallback(
    (el: CanvasElement | null, additive = false) => {
      if (!el) {
        setSelectedIds(new Set());
        return;
      }
      setSelectedIds((prev) => {
        const next = new Set(additive ? prev : []);
        if (next.has(el.id)) {
          next.delete(el.id);
        } else {
          next.add(el.id);
        }
        return next;
      });
    },
    [],
  );

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(elements.map((el) => el.id)));
  }, [elements]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ── History ────────────────────────────────────────────────────────────

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    isUndoRedoRef.current = true;
    setElementsState(cloneElements(historyRef.current[historyIndexRef.current]));
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    isUndoRedoRef.current = true;
    setElementsState(cloneElements(historyRef.current[historyIndexRef.current]));
  }, []);

  // ── Element CRUD ───────────────────────────────────────────────────────

  const addElement = useCallback(
    (element: CanvasElement) => {
      setElementsCallback((prev) => [...prev, element]);
      setSelectedIds(new Set([element.id]));
    },
    [setElements],
  );

  // Wrapper for adding components from palette
  const addComponent = useCallback(
    (component: CanvasComponentDef, x: number, y: number) => {
      const newElement: CanvasElement = {
        id: generateId(),
        type: component.type,
        ...component.defaultProps,
        x,
        y,
      };
      addElement(newElement);
    },
    [addElement],
  );

  const updateElement = useCallback(
    (id: string | number, updates: Partial<CanvasElement>) => {
      setElementsCallback((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el)),
      );
    },
    [setElements],
  );

  const deleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setElementsCallback((prev) => prev.filter((el) => !selectedIds.has(el.id)));
    setSelectedIds(new Set());
  }, [selectedIds, setElements]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const offset = 20;
    const newIds: (string | number)[] = [];
    setElementsCallback((prev) => {
      const duplicates = prev
        .filter((el) => selectedIds.has(el.id))
        .map((el) => {
          const id = generateId();
          newIds.push(id);
          return {
            ...el,
            id,
            x: clamp(Number(el.x ?? 0) + offset, 0, CANVAS_WIDTH),
            y: clamp(Number(el.y ?? 0) + offset, 0, CANVAS_HEIGHT),
          };
        });
      return [...prev, ...duplicates];
    });
    setSelectedIds(new Set(newIds));
  }, [selectedIds, setElements]);

  // ── Clipboard ──────────────────────────────────────────────────────────

  const copySelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setClipboard(elements.filter((el) => selectedIds.has(el.id)));
  }, [elements, selectedIds]);

  const cutSelected = useCallback(() => {
    copySelected();
    deleteSelected();
  }, [copySelected, deleteSelected]);

  const paste = useCallback(() => {
    if (clipboard.length === 0) return;
    const offset = 20;
    const newIds: (string | number)[] = [];
    setElementsCallback((prev) => {
      const pasted = clipboard.map((el) => {
        const id = generateId();
        newIds.push(id);
        return {
          ...el,
          id,
          x: clamp(Number(el.x ?? 0) + offset, 0, CANVAS_WIDTH),
          y: clamp(Number(el.y ?? 0) + offset, 0, CANVAS_HEIGHT),
        };
      });
      return [...prev, ...pasted];
    });
    setSelectedIds(new Set(newIds));
  }, [clipboard, setElements]);

  // ── Z-Index ────────────────────────────────────────────────────────────

  const bringForward = useCallback(() => {
    if (selectedIds.size === 0) return;
    setElementsCallback((prev) => {
      const result = [...prev];
      for (let i = result.length - 2; i >= 0; i--) {
        if (selectedIds.has(result[i].id) && !selectedIds.has(result[i + 1].id)) {
          [result[i], result[i + 1]] = [result[i + 1], result[i]];
        }
      }
      return result;
    });
  }, [selectedIds, setElements]);

  const sendBackward = useCallback(() => {
    if (selectedIds.size === 0) return;
    setElementsCallback((prev) => {
      const result = [...prev];
      for (let i = 1; i < result.length; i++) {
        if (selectedIds.has(result[i].id) && !selectedIds.has(result[i - 1].id)) {
          [result[i], result[i - 1]] = [result[i - 1], result[i]];
        }
      }
      return result;
    });
  }, [selectedIds, setElements]);

  const bringToFront = useCallback(() => {
    if (selectedIds.size === 0) return;
    setElementsCallback((prev) => {
      const selected = prev.filter((el) => selectedIds.has(el.id));
      const rest = prev.filter((el) => !selectedIds.has(el.id));
      return [...rest, ...selected];
    });
  }, [selectedIds, setElements]);

  const sendToBack = useCallback(() => {
    if (selectedIds.size === 0) return;
    setElementsCallback((prev) => {
      const selected = prev.filter((el) => selectedIds.has(el.id));
      const rest = prev.filter((el) => !selectedIds.has(el.id));
      return [...selected, ...rest];
    });
  }, [selectedIds, setElements]);

  // ── Element Locking ────────────────────────────────────────────────────

  const toggleLockSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    setElementsCallback((prev) =>
      prev.map((el) =>
        selectedIds.has(el.id) ? { ...el, locked: !el.locked } : el,
      ),
    );
  }, [selectedIds, setElements]);

  // ── Element Visibility ─────────────────────────────────────────────────

  const toggleVisibility = useCallback(
    (id: string | number) => {
      setElementsCallback((prev) =>
        prev.map((el) =>
          el.id === id ? { ...el, visible: el.visible === false ? true : false } : el,
        ),
      );
    },
    [setElements],
  );

  // ── Move (nudge with arrows) ──────────────────────────────────────────

  const nudgeSelected = useCallback(
    (dx: number, dy: number) => {
      if (selectedIds.size === 0) return;
      setElementsCallback((prev) =>
        prev.map((el) => {
          if (!selectedIds.has(el.id)) return el;
          if (el.locked) return el;
          return {
            ...el,
            x: clamp(Number(el.x ?? 0) + dx, 0, CANVAS_WIDTH - Number(el.width ?? 100)),
            y: clamp(Number(el.y ?? 0) + dy, 0, CANVAS_HEIGHT - Number(el.height ?? 30)),
          };
        }),
      );
    },
    [selectedIds, setElements],
  );

  // ── Drag element ──────────────────────────────────────────────────────

  const dragElement = useCallback(
    (id: string | number, rawX: number, rawY: number, width: number, height: number) => {
      const el = elements.find((e) => e.id === id);
      if (!el || el.locked) return;

      let x = snapEnabled ? snapToGrid(rawX) : rawX;
      let y = snapEnabled ? snapToGrid(rawY) : rawY;
      x = clamp(x, 0, CANVAS_WIDTH - width);
      y = clamp(y, 0, CANVAS_HEIGHT - height);

      // Alignment guides
      if (showGuides && selectedIds.size <= 1) {
        const guides: AlignmentGuide[] = [];
        const cx = x + width / 2;
        const cy = y + height / 2;

        for (const other of elements) {
          if (other.id === id) continue;
          const ox = Number(other.x ?? 0);
          const oy = Number(other.y ?? 0);
          const ow = Number(other.width ?? 100);
          const oh = Number(other.height ?? 30);

          // Center X alignment
          const otherCX = ox + ow / 2;
          if (Math.abs(cx - otherCX) < 5) {
            x = otherCX - width / 2;
            guides.push({ type: "vertical", pos: otherCX, min: Math.min(y, oy), max: Math.max(y + height, oy + oh) });
          }
          // Center Y alignment
          const otherCY = oy + oh / 2;
          if (Math.abs(cy - otherCY) < 5) {
            y = otherCY - height / 2;
            guides.push({ type: "horizontal", pos: otherCY, min: Math.min(x, ox), max: Math.max(x + width, ox + ow) });
          }
          // Left edge
          if (Math.abs(x - ox) < 5) {
            x = ox;
            guides.push({ type: "vertical", pos: ox, min: Math.min(y, oy), max: Math.max(y + height, oy + oh) });
          }
          // Top edge
          if (Math.abs(y - oy) < 5) {
            y = oy;
            guides.push({ type: "horizontal", pos: oy, min: Math.min(x, ox), max: Math.max(x + width, ox + ow) });
          }
          // Right edge
          if (Math.abs(x + width - (ox + ow)) < 5) {
            x = ox + ow - width;
            guides.push({ type: "vertical", pos: ox + ow, min: Math.min(y, oy), max: Math.max(y + height, oy + oh) });
          }
          // Bottom edge
          if (Math.abs(y + height - (oy + oh)) < 5) {
            y = oy + oh - height;
            guides.push({ type: "horizontal", pos: oy + oh, min: Math.min(x, ox), max: Math.max(x + width, ox + ow) });
          }
        }
        setAlignmentGuides(guides);
      }

      setElementsCallback((prev) =>
        prev.map((el) => (el.id === id ? { ...el, x, y } : el)),
      );
    },
    [elements, snapEnabled, showGuides, selectedIds, setElements],
  );

  const clearGuides = useCallback(() => {
    setAlignmentGuides([]);
  }, []);

  // ── Resize element ────────────────────────────────────────────────────

  const resizeElement = useCallback(
    (id: string | number, rawW: number, rawH: number, x: number, y: number) => {
      const el = elements.find((e) => e.id === id);
      if (!el || el.locked) return;

      let w = snapEnabled ? snapToGrid(rawW) : rawW;
      let h = snapEnabled ? snapToGrid(rawH) : rawH;
      w = clamp(w, 20, CANVAS_WIDTH - x);
      h = clamp(h, 20, CANVAS_HEIGHT - y);

      setElementsCallback((prev) =>
        prev.map((el) => (el.id === id ? { ...el, width: w, height: h } : el)),
      );
    },
    [elements, snapEnabled, setElements],
  );

  // ── Reorder ────────────────────────────────────────────────────────────

  const moveElementUp = useCallback(
    (id: string | number) => {
      setElementsCallback((prev) => {
        const idx = prev.findIndex((el) => el.id === id);
        if (idx < 0 || idx >= prev.length - 1) return prev;
        const result = [...prev];
        [result[idx], result[idx + 1]] = [result[idx + 1], result[idx]];
        return result;
      });
    },
    [setElements],
  );

  const moveElementDown = useCallback(
    (id: string | number) => {
      setElementsCallback((prev) => {
        const idx = prev.findIndex((el) => el.id === id);
        if (idx <= 0) return prev;
        const result = [...prev];
        [result[idx], result[idx - 1]] = [result[idx - 1], result[idx]];
        return result;
      });
    },
    [setElements],
  );

  // ── Zoom ───────────────────────────────────────────────────────────────

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.1, 3)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.1, 0.3)), []);
  const zoomReset = useCallback(() => setZoom(1), []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (isInput) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
        return;
      }

      // Arrow keys
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        nudgeSelected(dx, dy);
        return;
      }

      // Ctrl+Z / Ctrl+Shift+Z
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (ctrl && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      if (ctrl && e.key === "y") {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+D duplicate
      if (ctrl && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Ctrl+C copy
      if (ctrl && e.key === "c") {
        e.preventDefault();
        copySelected();
        return;
      }

      // Ctrl+X cut
      if (ctrl && e.key === "x") {
        e.preventDefault();
        cutSelected();
        return;
      }

      // Ctrl+V paste
      if (ctrl && e.key === "v") {
        e.preventDefault();
        paste();
        return;
      }

      // Ctrl+A select all
      if (ctrl && e.key === "a") {
        e.preventDefault();
        selectAll();
        return;
      }

      // Ctrl+L lock
      if (ctrl && e.key === "l") {
        e.preventDefault();
        toggleLockSelected();
        return;
      }

      // Escape deselect
      if (e.key === "Escape") {
        deselectAll();
        return;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [deleteSelected, nudgeSelected, undo, redo, duplicateSelected, copySelected, cutSelected, paste, selectAll, toggleLockSelected, deselectAll]);

  return {
    // State
    elements,
    selectedIds,
    selectedElement,
    selectedElements,
    zoom,
    snapEnabled,
    showGuides,
    clipboard,
    alignmentGuides,

    // Element operations
    setElements,
    addElement,
    addComponent,
    updateElement,
    deleteSelected,
    duplicateSelected,
    dragElement,
    resizeElement,

    // Selection
    selectElement,
    selectAll,
    deselectAll,

    // Clipboard
    copySelected,
    cutSelected,
    paste,

    // Z-index
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,

    // Reorder
    moveElementUp,
    moveElementDown,

    // Locking / visibility
    toggleLockSelected,
    toggleVisibility,

    // Nudge
    nudgeSelected,

    // History
    undo,
    redo,
    canUndo,
    canRedo,

    // Zoom
    zoomIn,
    zoomOut,
    zoomReset,

    // Guides
    clearGuides,

    // Settings
    setSnapEnabled,
    setShowGuides,
  };
}
