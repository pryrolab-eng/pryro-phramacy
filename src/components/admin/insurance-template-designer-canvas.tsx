"use client";

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

import type { CanvasElement } from "@/lib/admin/insurance-template-canvas";
import { cn } from "@/lib/utils";

export type CanvasComponentDef = {
  type: string;
  label: string;
  icon: LucideIcon;
  defaultProps: Record<string, unknown>;
};

export const INSURANCE_CANVAS_COMPONENTS: CanvasComponentDef[] = [
  { type: "text", label: "Text", icon: Type, defaultProps: { text: "Sample Text", fontSize: "16px" } },
  { type: "title", label: "Title", icon: Type, defaultProps: { text: "Invoice Title", fontSize: "24px", fontWeight: "bold" } },
  { type: "variable", label: "Variable", icon: Hash, defaultProps: { variable: "insurance_name", label: "Insurance Name" } },
  { type: "date", label: "Date", icon: Calendar, defaultProps: { variable: "date", label: "Date" } },
  { type: "amount", label: "Amount", icon: DollarSign, defaultProps: { variable: "amount", label: "Amount", suffix: " RWF" } },
  { type: "patient", label: "Patient", icon: User, defaultProps: { variable: "patient_name", label: "Patient Name", fontSize: 16, width: 200, height: 30 } },
  { type: "image", label: "Image", icon: Image, defaultProps: { src: "https://via.placeholder.com/100x100/3b82f6/ffffff?text=Logo", alt: "Logo", width: 100, height: 100 } },
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
  const handleElementDrag = (elementId: number | string, newX: number, newY: number) => {
    onElementsChange(
      elements.map((el) =>
        el.id === elementId ? { ...el, x: newX, y: newY } : el,
      ),
    );
  };

  const handleElementResize = (
    elementId: number | string,
    newWidth: number,
    newHeight: number,
  ) => {
    onElementsChange(
      elements.map((el) =>
        el.id === elementId ? { ...el, width: newWidth, height: newHeight } : el,
      ),
    );
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/insurance-component");
    if (!raw) return;
    try {
      const component = JSON.parse(raw) as CanvasComponentDef;
      onDropComponent(component, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    } catch {
      /* ignore */
    }
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElement?.id === element.id;
    const x = Number(element.x ?? 0);
    const y = Number(element.y ?? 0);
    const style: CSSProperties = {
      position: "absolute",
      left: x,
      top: y,
      width: element.width !== undefined ? Number(element.width) : "auto",
      height: element.height !== undefined ? Number(element.height) : "auto",
      fontSize: element.fontSize as CSSProperties["fontSize"],
      fontWeight: element.fontWeight as CSSProperties["fontWeight"],
      border: isSelected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
      cursor: "move",
      padding: "4px",
      backgroundColor: "white",
    };

    const handleMouseDown = (e: ReactMouseEvent) => {
      e.preventDefault();
      onSelectElement(element);
      const startX = e.clientX - x;
      const startY = e.clientY - y;

      const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
        handleElementDrag(
          element.id,
          Math.max(0, moveEvent.clientX - startX),
          Math.max(0, moveEvent.clientY - startY),
        );
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
        className="absolute -bottom-1 -right-1 size-3 cursor-se-resize rounded-full bg-blue-500"
        onMouseDown={(e) => {
          e.stopPropagation();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = Number(element.width ?? 100);
          const startHeight = Number(element.height ?? 30);

          const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
            handleElementResize(
              element.id,
              Math.max(20, startWidth + (moveEvent.clientX - startX)),
              Math.max(20, startHeight + (moveEvent.clientY - startY)),
            );
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
        />
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
    <div
      className={cn(
        "relative min-h-[560px] rounded-lg border-2 border-dashed border-neutral-200/90 bg-white p-6 shadow-inner dark:border-neutral-700 dark:bg-neutral-900",
        className,
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        backgroundImage:
          "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
        backgroundSize: "20px 20px",
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
  );
}

export function InsuranceComponentPalette({
  onDragStart,
}: {
  onDragStart: (e: DragEvent, component: CanvasComponentDef) => void;
}) {
  return (
    <div className="space-y-2">
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
          className="flex cursor-move items-center gap-2 rounded-lg border border-neutral-200/80 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50"
        >
          <component.icon className="size-4 shrink-0 text-neutral-500" />
          {component.label}
        </div>
      ))}
    </div>
  );
}
