"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Layers, Printer, Save, ShieldPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  InsuranceComponentPalette,
  InsuranceTemplateDesignerCanvas,
  type CanvasComponentDef,
} from "@/components/admin/insurance-template-designer-canvas";
import {
  DashboardButton,
  DashboardMetricGrid,
  DashboardPageLoading,
  DashboardSectionCard,
  DashboardStatCard,
} from "@/components/dashboard";
import { AlertDialog } from "@/components/ui/alert-dialog";
import {
  DashboardAlertDialogActions,
  DashboardAlertDialogContent,
  DashboardAlertDialogDescription,
  DashboardAlertDialogHeader,
  DashboardAlertDialogTitle,
} from "@/components/dashboard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseCanvasHtml,
  serializeCanvas,
  type CanvasElement,
} from "@/lib/admin/insurance-template-canvas";
import {
  INSURANCE_PRESET_LABELS,
  loadInsuranceTemplatePreset,
  type InsuranceTemplatePresetId,
} from "@/lib/admin/insurance-template-presets";
import { createInsuranceProvider } from "@/lib/http/insurance";
import { insuranceProvidersQueryKey } from "@/lib/http/insurance";
import {
  useAdminInsuranceTemplates,
  useCreateAdminInsuranceTemplateMutation,
  useDeleteAdminInsuranceTemplateMutation,
  useUpdateAdminInsuranceTemplateMutation,
} from "@/hooks/useAdminInsuranceTemplates";
import { useInsuranceProviders } from "@/hooks/useInsuranceProviders";
import { cn } from "@/lib/utils";

const emptyProviderForm = () => ({
  name: "",
  coverage_percentage: 80,
  contact_email: "",
  contact_phone: "",
  policy_number: "",
});

export function AdminInsuranceTemplatesPanel() {
  const queryClient = useQueryClient();
  const templatesQuery = useAdminInsuranceTemplates();
  const providersQuery = useInsuranceProviders();
  const createMutation = useCreateAdminInsuranceTemplateMutation();
  const updateMutation = useUpdateAdminInsuranceTemplateMutation();
  const deleteMutation = useDeleteAdminInsuranceTemplateMutation();

  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(
    null,
  );
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState(emptyProviderForm);
  const [providerSubmitting, setProviderSubmitting] = useState(false);

  const savedTemplates = templatesQuery.data ?? [];
  const providerOptions = useMemo(() => {
    const names = (providersQuery.data ?? [])
      .map((p) => String(p.name ?? "").trim())
      .filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [providersQuery.data]);

  const updateElementProperty = (property: string, value: unknown) => {
    if (!selectedElement) return;
    setElements((prev) =>
      prev.map((el) =>
        el.id === selectedElement.id ? { ...el, [property]: value } : el,
      ),
    );
    setSelectedElement({ ...selectedElement, [property]: value });
  };

  const handleNewDraft = () => {
    setSavedTemplateId(null);
    setTemplateName("");
    setInsuranceProvider("");
    setElements([]);
    setSelectedElement(null);
  };

  const handleLoadSaved = (id: string) => {
    const row = savedTemplates.find((t) => t.id === id);
    if (!row) return;
    setSavedTemplateId(row.id);
    setTemplateName(row.name);
    setInsuranceProvider(row.insurance_provider);
    setElements(parseCanvasHtml(row.template_html));
    setSelectedElement(null);
  };

  const handleSave = async () => {
    if (!templateName.trim() || !insuranceProvider.trim()) {
      toast.error("Template name and insurance provider are required");
      return;
    }
    const body = {
      name: templateName.trim(),
      insurance_provider: insuranceProvider.trim(),
      template_html: serializeCanvas(elements),
      template_css: "",
    };
    try {
      if (savedTemplateId) {
        await updateMutation.mutateAsync({ id: savedTemplateId, body });
        toast.success("Template updated");
      } else {
        const { template } = await createMutation.mutateAsync(body);
        setSavedTemplateId(template.id);
        toast.success("Template saved");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save template",
      );
    }
  };

  const handleDeleteSaved = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      if (savedTemplateId === deleteTargetId) handleNewDraft();
      setDeleteTargetId(null);
      toast.success("Template deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete template",
      );
    }
  };

  const handleAddProvider = async () => {
    if (!providerForm.name.trim()) return;
    setProviderSubmitting(true);
    try {
      await createInsuranceProvider(providerForm);
      await queryClient.invalidateQueries({
        queryKey: insuranceProvidersQueryKey,
      });
      setInsuranceProvider(providerForm.name.trim());
      setProviderForm(emptyProviderForm());
      toast.success("Insurance provider added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add provider",
      );
    } finally {
      setProviderSubmitting(false);
    }
  };

  const applyPreset = (preset: InsuranceTemplatePresetId) => {
    setElements(loadInsuranceTemplatePreset(preset));
    setSelectedElement(null);
    if (!templateName.trim()) {
      setTemplateName(INSURANCE_PRESET_LABELS[preset].title);
    }
  };

  const handleDropComponent = (
    component: CanvasComponentDef,
    offsetX: number,
    offsetY: number,
  ) => {
    const newElement: CanvasElement = {
      id: `${Date.now()}-${Math.random()}`,
      type: component.type,
      ...component.defaultProps,
      x: offsetX,
      y: offsetY,
    };
    setElements((prev) => [...prev, newElement]);
  };

  if (templatesQuery.isLoading) {
    return <DashboardPageLoading label="Loading template designer…" />;
  }

  return (
    <>
      <AdminPageHeader
        pinTitle="Template Designer"
        title={
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
            Insurance template designer
          </h1>
        }
        description={
          <>
            Build printable insurance claim layouts for all pharmacies. Designs
            are stored as platform templates (
            <code className="text-xs">insurance_templates</code>). POS print
            integration is still planned.
            {templatesQuery.isError ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {templatesQuery.error instanceof Error
                  ? templatesQuery.error.message
                  : "Could not load templates."}
              </p>
            ) : null}
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <DashboardButton tone="outline" onClick={() => window.print()}>
              <Printer className="mr-1.5 size-4" />
              Print preview
            </DashboardButton>
            <DashboardButton
              tone="primary"
              onClick={() => void handleSave()}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !templateName.trim() ||
                !insuranceProvider.trim()
              }
            >
              <Save className="mr-1.5 size-4" />
              {savedTemplateId ? "Update template" : "Save template"}
            </DashboardButton>
          </div>
        }
      />

      <DashboardMetricGrid className="mb-4 lg:grid-cols-3">
        <DashboardStatCard
          label="Saved templates"
          icon={FileText}
          value={savedTemplates.length}
        />
        <DashboardStatCard
          label="Canvas elements"
          icon={Layers}
          value={elements.length}
        />
        <DashboardStatCard
          label="Insurance providers"
          icon={ShieldPlus}
          value={providerOptions.length}
        />
      </DashboardMetricGrid>

      <DashboardSectionCard
        title="Starter layouts"
        description="Load a preset onto the canvas (replaces current elements)"
        className="mb-4"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(INSURANCE_PRESET_LABELS) as InsuranceTemplatePresetId[]).map(
            (key) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={cn(
                  "rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-neutral-700 dark:bg-neutral-800/30 dark:hover:border-blue-800",
                )}
              >
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {INSURANCE_PRESET_LABELS[key].title}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {INSURANCE_PRESET_LABELS[key].subtitle}
                </p>
              </button>
            ),
          )}
        </div>
      </DashboardSectionCard>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200/80 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
        <DashboardButton tone="outline" size="sm" onClick={handleNewDraft}>
          New draft
        </DashboardButton>
        <DashboardButton
          tone="outline"
          size="sm"
          onClick={() => {
            setElements([]);
            setSelectedElement(null);
          }}
        >
          Clear canvas
        </DashboardButton>
        <span className="text-sm text-neutral-500">
          {savedTemplateId ? "Editing saved template" : "Unsaved draft"}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-3">
          <DashboardSectionCard title="Saved templates" description="Platform-wide layouts">
            <div className="space-y-3">
              <Select
                value={savedTemplateId ?? "__new__"}
                onValueChange={(v) => {
                  if (v === "__new__") handleNewDraft();
                  else handleLoadSaved(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__">New draft</SelectItem>
                  {savedTemplates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} · {t.insurance_provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {savedTemplateId ? (
                <DashboardButton
                  tone="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => setDeleteTargetId(savedTemplateId)}
                >
                  <Trash2 className="mr-1.5 size-3.5" />
                  Delete saved template
                </DashboardButton>
              ) : null}
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard title="Template details">
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label>Template name</Label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. RSSB medical claim"
                />
              </div>
              <div className="grid gap-2">
                <Label>Insurance provider</Label>
                <Select
                  value={insuranceProvider}
                  onValueChange={setInsuranceProvider}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DashboardSectionCard>

          <DashboardSectionCard title="Components">
            <InsuranceComponentPalette onDragStart={() => undefined} />
          </DashboardSectionCard>

          <DashboardSectionCard
            title="Add insurance provider"
            description="Creates a global provider visible to pharmacies"
          >
            <div className="space-y-3">
              <Input
                placeholder="Provider name"
                value={providerForm.name}
                onChange={(e) =>
                  setProviderForm({ ...providerForm, name: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Coverage %"
                value={providerForm.coverage_percentage}
                onChange={(e) =>
                  setProviderForm({
                    ...providerForm,
                    coverage_percentage: Number(e.target.value) || 0,
                  })
                }
              />
              <Input
                placeholder="Contact email"
                value={providerForm.contact_email}
                onChange={(e) =>
                  setProviderForm({
                    ...providerForm,
                    contact_email: e.target.value,
                  })
                }
              />
              <DashboardButton
                tone="outline"
                className="w-full"
                disabled={providerSubmitting || !providerForm.name.trim()}
                onClick={() => void handleAddProvider()}
              >
                {providerSubmitting ? "Adding…" : "Add provider"}
              </DashboardButton>
            </div>
          </DashboardSectionCard>
        </div>

        <div className="lg:col-span-6">
          <DashboardSectionCard
            title="Design canvas"
            description="Drag components from the left; click to select and resize"
            contentClassName="p-4"
          >
            <div id="insurance-template-print">
              <InsuranceTemplateDesignerCanvas
                elements={elements}
                selectedElement={selectedElement}
                onElementsChange={setElements}
                onSelectElement={setSelectedElement}
                onDropComponent={handleDropComponent}
              />
            </div>
          </DashboardSectionCard>
        </div>

        <div className="lg:col-span-3">
          {selectedElement ? (
            <DashboardSectionCard title="Properties">
              <div className="space-y-3">
                {selectedElement.type !== "line" &&
                selectedElement.type !== "image" ? (
                  <div className="grid gap-2">
                    <Label>Text / label</Label>
                    <Input
                      value={String(
                        selectedElement.text ?? selectedElement.label ?? "",
                      )}
                      onChange={(e) =>
                        updateElementProperty(
                          selectedElement.text ? "text" : "label",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                ) : null}
                {selectedElement.type === "image" ? (
                  <div className="grid gap-2">
                    <Label>Image URL</Label>
                    <Input
                      value={String(selectedElement.src ?? "")}
                      onChange={(e) => updateElementProperty("src", e.target.value)}
                    />
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Label>Font size</Label>
                  <Input
                    type="number"
                    value={Number(selectedElement.fontSize ?? 16)}
                    onChange={(e) =>
                      updateElementProperty("fontSize", Number(e.target.value))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label>Width</Label>
                    <Input
                      type="number"
                      value={Number(selectedElement.width ?? 0)}
                      onChange={(e) =>
                        updateElementProperty("width", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Height</Label>
                    <Input
                      type="number"
                      value={Number(selectedElement.height ?? 0)}
                      onChange={(e) =>
                        updateElementProperty("height", Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <DashboardButton
                  tone="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => {
                    setElements((prev) =>
                      prev.filter((el) => el.id !== selectedElement.id),
                    );
                    setSelectedElement(null);
                  }}
                >
                  Remove element
                </DashboardButton>
              </div>
            </DashboardSectionCard>
          ) : (
            <DashboardSectionCard title="Properties">
              <p className="text-sm text-neutral-500">
                Select an element on the canvas to edit its properties.
              </p>
            </DashboardSectionCard>
          )}
        </div>
      </div>

      <AlertDialog
        open={Boolean(deleteTargetId)}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <DashboardAlertDialogContent>
          <DashboardAlertDialogHeader>
            <DashboardAlertDialogTitle>Delete template?</DashboardAlertDialogTitle>
            <DashboardAlertDialogDescription>
              This removes the saved layout for all pharmacies. The canvas draft
              will be cleared if you were editing it.
            </DashboardAlertDialogDescription>
          </DashboardAlertDialogHeader>
          <DashboardAlertDialogActions
            cancelLabel="Cancel"
            confirmLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
            confirmTone="destructive"
            onCancel={() => !deleteMutation.isPending && setDeleteTargetId(null)}
            onConfirm={() => void handleDeleteSaved()}
            confirmDisabled={deleteMutation.isPending}
          />
        </DashboardAlertDialogContent>
      </AlertDialog>
    </>
  );
}
