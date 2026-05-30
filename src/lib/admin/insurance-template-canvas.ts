export type CanvasElement = Record<string, unknown> & {
  id: number | string;
  type: string;
};

export type SavedTemplatePayload = {
  version: 1;
  elements: CanvasElement[];
};

export function serializeCanvas(elements: CanvasElement[]): string {
  const payload: SavedTemplatePayload = { version: 1, elements };
  return JSON.stringify(payload);
}

export function parseCanvasHtml(templateHtml: string | null | undefined): CanvasElement[] {
  if (!templateHtml?.trim()) return [];
  try {
    const parsed = JSON.parse(templateHtml) as Partial<SavedTemplatePayload>;
    if (Array.isArray(parsed.elements)) {
      return parsed.elements as CanvasElement[];
    }
  } catch {
    /* legacy or HTML — treat as empty canvas */
  }
  return [];
}
