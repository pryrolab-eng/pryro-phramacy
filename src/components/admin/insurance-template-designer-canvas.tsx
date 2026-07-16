"use client";

import { useRef, useState } from "react";
import type { CSSProperties, DragEvent, MouseEvent as ReactMouseEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  DollarSign,
  Hash,
  Image,
  Minus,
  Type,
  User,
} from "lucide-react";

import { AnimatedGroup } from "@/components/ui/animated-group";
import type { CanvasElement } from "@/lib/admin/insurance-template-canvas";
import { PLACEHOLDER_LOGO } from "@/lib/admin/insurance-template-placeholders";
import { cn } from "@/lib/utils";

export const CANVAS_WIDTH = 595;
export const CANVAS_HEIGHT = 842;

export type CanvasComponentDef = {
  type: string;
  label: string;
  icon: LucideIcon;
  defaultProps: Record<string, unknown>;
};

export const INSURANCE_CANVAS_COMPONENTS: CanvasComponentDef[] = [
  { type: "text", label: "Text", icon: Type, defaultProps: { text: "Sample Text", fontSize: "16px", width: 150, height: 28 } },
  { type: "title", label: "Title", icon: Type, defaultProps: { text: "Invoice Title", fontSize: "24px", fontWeight: "bold", width: 300, height: 36 } },
  { type: "variable", label: "Variable", icon: Hash, defaultProps: { variable: "insurance_name", label: "Insurance Name", width: 200, height: 28 } },
  { type: "date", label: "Date", icon: Calendar, defaultProps: { variable: "date", label: "Date", width: 180, height: 28 } },
  { type: "amount", label: "Amount", icon: DollarSign, defaultProps: { variable: "amount", label: "Amount", suffix: " RWF", width: 180, height: 30 } },
  { type: "patient", label: "Patient", icon: User, defaultProps: { variable: "patient_name", label: "Patient Name", width: 200, height: 30 } },
  { type: "image", label: "Image", icon: Image, defaultProps: { src: PLACEHOLDER_LOGO, alt: "Logo", width: 100, height: 100 } },
  { type: "line", label: "Line", icon: Minus, defaultProps: { width: 300, height: 2, backgroundColor: "#000" } },
];

const SAMPLE_DATA: Record<string, string> = {
  insurance_name: "RSSB Insurance",
  policy_number: "POL-2024-001",
  patient_name: "John Doe",
  date: new Date().toLocaleDateString(),
  amount: "50,000",
  coverage_percentage: "80",
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

type Props = {
  elements: CanvasElement[];
  selectedElement: CanvasElement | null;
  onElementsChange: (elements: CanvasElement[]) => void;
  onSelectElement: (element: CanvasElement | null) => void;
  onDropComponent: (component: CanvasComponentDef, offsetX: number, offsetY: number) => void;
  className?: string;
};

export function InsuranceTemplateDesignerCanvas({
  elements,
  selectedElement,
  onElementsChange,
  onSelectElement,
  onDropComponent,
  className,
}: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  const handleElementDrag = (elementId: number | string, newX: number, newY: number, width: number, height: number) => {
    onElementsChange(
      elements.map((el) =>
        el.id === elementId
          ? { ...el, x: clamp(newX, 0, CANVAS_WIDTH - width), y: clamp(newY, 0, CANVAS_HEIGHT - height) }
          : el,
      ),
    );
  };

  const handleElementResize = (
    elementId: number | string,
    newWidth: number,
    newHeight: number,
    x: number,
    y: number,
  ) => {
    onElementsChange(
      elements.map((el) =>
        el.id === elementId
          ? { ...el, width: clamp(newWidth, 20, CANVAS_WIDTH - x), height: clamp(newHeight, 20, CANVAS_HEIGHT - y) }
          : el,
      ),
    );
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/insurance-component");
    if (!raw) return;
    try {
      const component = JSON.parse(raw) as CanvasComponentDef;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const offsetX = clamp(e.clientX - rect.left, 0, CANVAS_WIDTH - Number(component.defaultProps.width ?? 100));
      const offsetY = clamp(e.clientY - rect.top, 0, CANVAS_HEIGHT - Number(component.defaultProps.height ?? 30));
      onDropComponent(component, offsetX, offsetY);
    } catch {
      /* ignore */
    }
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElement?.id === element.id;
    const x = Number(element.x ?? 0);
    const y = Number(element.y ?? 0);
    const w = Number(element.width ?? 100);
    const h = Number(element.height ?? 30);

    const style: CSSProperties = {
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      fontSize: element.fontSize as CSSProperties["fontSize"],
      fontWeight: element.fontWeight as CSSProperties["fontWeight"],
      border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
      cursor: "move",
      padding: "4px",
      backgroundColor: "white",
      overflow: "hidden",
      userSelect: "none",
    };

    const handleMouseDown = (e: ReactMouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onSelectElement(element);
      const startX = e.clientX - x;
      const startY = e.clientY - y;

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        handleElementDrag(element.id, moveEvent.clientX - startX, moveEvent.clientY - startY, w, h);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const resizeHandle = isSelected ? (
      <div
        className="absolute -bottom-1 -right-1 size-3 cursor-se-resize rounded-full bg-blue-500 hover:bg-blue-600"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = w;
          const startHeight = h;

          const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
            handleElementResize(element.id, startWidth + (moveEvent.clientX - startX), startHeight + (moveEvent.clientY - startY), x, y);
          };

          const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
      />
    ) : null;

    const varKey = typeof element.variable === "string" ? element.variable : "";
    const sampleVal = varKey && varKey in SAMPLE_DATA ? SAMPLE_DATA[varKey] : "";

    if (element.type === "image") {
      return (
        <div key={String(element.id)} style={style} onMouseDown={handleMouseDown}>
          <img
            src={String(element.src ?? "")}
            alt={String(element.alt ?? "")}
            className="size-full object-contain"
            draggable={false}
          />
          {resizeHandle}
        </div>
      );
    }

    if (element.type === "line") {
      return (
        <div
          key={String(element.id)}
          style={{
            ...style,
            backgroundColor: String(element.backgroundColor ?? "#000"),
          }}
          onMouseDown={handleMouseDown}
        >
          {resizeHandle}
        </div>
      );
    }

    let content = "";
    if (
      element.type === "variable" ||
      element.type === "date" ||
      element.type === "amount" ||
      element.type === "patient"
    ) {
      content = `${String(element.label ?? "")}: ${sampleVal}${String(element.suffix ?? "")}`;
    } else {
      content = String(element.text ?? "");
    }

    return (
      <div key={String(element.id)} style={style} onMouseDown={handleMouseDown}>
        {content}
        {resizeHandle}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Canvas toolbar */}
      <div className="flex items-center justify-between rounded-md bg-neutral-50 px-3 py-1.5 text-xs text-neutral-500 dark:bg-neutral-800/50 dark:text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="font-medium">{CANVAS_WIDTH} x {CANVAS_HEIGHT}px</span>
          <span className="text-neutral-300 dark:text-neutral-600">|</span>
          <span>{elements.length} element{elements.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Type className="size-3" />
          <span>Drag to position</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, Math.min(3, z - 0.1)))}
            className="px-2 py-0.5 rounded hover:bg-neutral-200/70"
            title="Zoom out"
          >
            -
          </button>
          <span className="px-2 py-0.5 text-neutral-400">Zoom: {Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, Math.min(3, z + 0.1)))}
            className="px-2 py-0.5 rounded hover:bg-neutral-200/70"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-0.5 rounded hover:bg-neutral-200/70"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Scrollable canvas wrapper */}
      <div
        className="relative overflow-auto rounded-lg border-2 border-dashed border-neutral-200/90 bg-white shadow-inner dark:border-neutral-700 dark:bg-neutral-900"
        style={{ maxHeight: "70vh" }}
      >
        {/* Canvas surface */}
        <div
          ref={canvasRef}
          className="relative shrink-0 origin-top-left"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${zoom})`,
            backgroundImage:
              "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSelectElement(null);
            }
          }}
        >
          {elements.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-neutral-400">
                <p className="text-lg font-medium">Drop components here</p>
                <p className="text-sm">Or load a starter preset above</p>
              </div>
            </div>
          ) : null}
          {elements.map(renderElement)}
        </div>
      </div>
    </div>
  );
}

export function InsuranceComponentPalette({
  onDragStart,
}: {
  onDragStart: (e: DragEvent, component: CanvasComponentDef) => void;
}) {
  return (
    <AnimatedGroup preset="slide" className="space-y-2">
      {INSURANCE_CANVAS_COMPONENTS.map((component) => (
        <div
          key={component.type}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(
              "application/insurance-component",
              JSON.stringify(component),
            );
            onDragStart(e, component);
          }}
          className="flex cursor-move items-center gap-2 rounded-lg border border-neutral-200/80 px-3 py-2 text-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
        >
          <component.icon className="size-4 shrink-0 text-neutral-500" />
          {component.label}
        </div>
      ))}
    </AnimatedGroup>
  );
}
