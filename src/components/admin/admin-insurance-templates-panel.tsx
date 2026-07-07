"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Layers,
  Printer,
  Save,
  ShieldPlus,
  Table2,
  Trash2,
} from "lucide-react";
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
  DashboardTabsList,
  Dialog,
  DashboardDialogBody,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogActions,
  dashboardSurfaces,
  dashboardText,
} from "@/components/dashboard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
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
import { printInsuranceTemplatePreview } from "@/lib/admin/insurance-template-print";
import {
  INSURANCE_PRESET_LABELS,
  loadInsuranceTemplatePreset,
  type InsuranceTemplatePresetId,
} from "@/lib/admin/insurance-template-presets";
import { AdminInsuranceProvidersPanel } from "@/components/admin/admin-insurance-providers-panel";
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
import { AnimatePresence, motion } from "motion/react";

const panelTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

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
  const [selectedElement, setSelectedElement] = useState<CanvasElement | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState(emptyProviderForm);
  const [providerSubmitting, setProviderSubmitting] = useState(false);
  const [addProviderOpen, setAddProviderOpen] = useState(false);
  const [presetPickerKey, setPresetPickerKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"design" | "providers">("design");

  const savedTemplates = templatesQuery.data ?? [];
  const providerOptions = useMemo(() => {
    const names = (providersQuery.data ?? [])
      .map((p) => String(p.name ?? "").trim())
      .filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [providersQuery.data]);

  const activeInsurersCount = useMemo(
    () =>
      (providersQuery.data ?? []).filter((p) => p.is_active !== false).length,
    [providersQuery.data],
  );

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
    if (!savedTemplateId) return;
    try {
      await deleteMutation.mutateAsync(savedTemplateId);
      handleNewDraft();
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
      setAddProviderOpen(false);
      setActiveTab("providers");
      toast.success("Insurance provider added");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add provider",
      );
    } finally {
      setProviderSubmitting(false);
    }
  };

  const handlePrintPreview = () => {
    if (elements.length === 0) {
      toast.error("Add elements to the canvas or load a preset before printing.");
      return;
    }
    const opened = printInsuranceTemplatePreview({
      elements,
      templateName: templateName.trim() || "Insurance template preview",
      insuranceProvider: insuranceProvider.trim() || undefined,
    });
    if (!opened) {
      toast.error("Could not open print preview. Allow pop-ups for this site.");
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
            Build printable monthly claim layouts for all pharmacies. Match the
            insurer name exactly (e.g. RSSB, MMI). Use placeholders in HTML:{" "}
            <code className="text-xs">
              {"{{pharmacy_name}}"}, {"{{insurance_provider}}"}, {"{{report_month}}"},
              {"{{report_year}}"}, {"{{total_claim_amount}}"}, {"{{claims_table}}"}
            </code>
            . Pharmacies print from Reports → Insurance claims.
            {templatesQuery.isError ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {templatesQuery.error instanceof Error
                  ? templatesQuery.error.message
                  : "Could not load templates."}
              </p>
            ) : null}
          </>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "design" | "providers")}
        className="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DashboardTabsList>
            <TabsTrigger value="design">
              <Layers className="mr-1.5 size-4" />
              Template design
            </TabsTrigger>
            <TabsTrigger value="providers">
              <ShieldPlus className="mr-1.5 size-4" />
              Insurance providers
            </TabsTrigger>
          </DashboardTabsList>
          <DashboardButton
            tone="primary"
            size="sm"
            onClick={() => setAddProviderOpen(true)}
          >
            <ShieldPlus className="mr-1.5 size-4" />
            Add provider
          </DashboardButton>
        </div>

        <DashboardMetricGrid>
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
          <DashboardStatCard
            label="Active insurers"
            icon={Table2}
            value={activeInsurersCount}
          />
        </DashboardMetricGrid>

        <AnimatePresence mode="wait">
          {activeTab === "design" ? (
            <motion.div
              key="design-tab"
              role="tabpanel"
              aria-label="Template design"
              className="mt-0 space-y-4"
              {...panelTransition}
            >
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200/80 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
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
            <Select
              key={presetPickerKey}
              onValueChange={(v) => {
                applyPreset(v as InsuranceTemplatePresetId);
                setPresetPickerKey((k) => k + 1);
              }}
            >
              <SelectTrigger className="h-8 w-[min(100%,220px)] shrink-0">
                <SelectValue placeholder="Starter layout" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(INSURANCE_PRESET_LABELS) as InsuranceTemplatePresetId[]
                ).map((key) => (
                  <SelectItem key={key} value={key}>
                    {INSURANCE_PRESET_LABELS[key].title} —{" "}
                    {INSURANCE_PRESET_LABELS[key].subtitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
              <DashboardButton tone="outline" size="sm" onClick={handlePrintPreview}>
                <Printer className="mr-1.5 size-4" />
                Print preview
              </DashboardButton>
              <DashboardButton
                tone="primary"
                size="sm"
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

              <Accordion
                type="single"
                collapsible
                defaultValue="components"
                className={cn(dashboardSurfaces.card, "overflow-hidden")}
              >
                <AccordionItem value="components" className="border-0">
                  <AccordionTrigger
                    className={cn(
                      dashboardSurfaces.sectionHeader,
                      "border-b border-neutral-100 py-3 hover:no-underline sm:py-4 dark:border-neutral-800",
                      dashboardText.sectionTitle,
                    )}
                  >
                    Components
                  </AccordionTrigger>
                  <AccordionContent className={dashboardSurfaces.sectionBody}>
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <InsuranceComponentPalette onDragStart={() => undefined} />
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="lg:col-span-6">
              <InsuranceTemplateDesignerCanvas
                elements={elements}
                selectedElement={selectedElement}
                onElementsChange={setElements}
                onSelectElement={setSelectedElement}
                onDropComponent={handleDropComponent}
              />
            </div>

            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {selectedElement ? (
                  <motion.div
                    key={String(selectedElement.id)}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
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
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === selectedElement.id
                                  ? {
                                      ...el,
                                      text: selectedElement.text
                                        ? undefined
                                        : e.target.value,
                                      label: selectedElement.label
                                        ? undefined
                                        : e.target.value,
                                    }
                                  : el,
                              ),
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
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === selectedElement.id
                                  ? { ...el, src: e.target.value }
                                  : el,
                              ),
                            )
                          }
                        />
                      </div>
                    ) : null}
                    <div className="grid gap-2">
                      <Label>Font size</Label>
                      <Input
                        type="number"
                        value={Number(selectedElement.fontSize ?? 16)}
                        onChange={(e) =>
                          setElements((prev) =>
                            prev.map((el) =>
                              el.id === selectedElement.id
                                ? { ...el, fontSize: Number(e.target.value) }
                                : el,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <Label>X</Label>
                        <Input
                          type="number"
                          min={0}
                          max={595}
                          value={Number(selectedElement.x ?? 0)}
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === selectedElement.id
                                  ? { ...el, x: Math.max(0, Math.min(595, Number(e.target.value))) }
                                  : el,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Y</Label>
                        <Input
                          type="number"
                          min={0}
                          max={842}
                          value={Number(selectedElement.y ?? 0)}
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === selectedElement.id
                                  ? { ...el, y: Math.max(0, Math.min(842, Number(e.target.value))) }
                                  : el,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <Label>Width</Label>
                        <Input
                          type="number"
                          min={20}
                          value={Number(selectedElement.width ?? 100)}
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === selectedElement.id
                                  ? { ...el, width: Math.max(20, Number(e.target.value)) }
                                  : el,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Height</Label>
                        <Input
                          type="number"
                          min={20}
                          value={Number(selectedElement.height ?? 30)}
                          onChange={(e) =>
                            setElements((prev) =>
                              prev.map((el) =>
                                el.id === selectedElement.id
                                  ? { ...el, height: Math.max(20, Number(e.target.value)) }
                                  : el,
                              ),
                            )
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
                  </motion.div>
                ) : (
                  <motion.div
                    key="properties-empty"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <DashboardSectionCard title="Properties">
                      <p className="text-sm text-neutral-500">
                        Select an element on the canvas to edit its properties.
                      </p>
                    </DashboardSectionCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
            </motion.div>
          ) : (
            <motion.div
              key="providers-tab"
              role="tabpanel"
              aria-label="Insurance providers"
              className="mt-0 space-y-4"
              {...panelTransition}
            >
              <AdminInsuranceProvidersPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </Tabs>

      <Dialog
        open={addProviderOpen}
        onOpenChange={(open) => {
          setAddProviderOpen(open);
          if (!open) setProviderForm(emptyProviderForm());
        }}
      >
        <DashboardDialogContent className="max-w-lg">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Add insurance provider</DashboardDialogTitle>
            <DashboardDialogDescription>
              Creates a global provider visible to pharmacies at POS.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="add-prov-name">Provider name</Label>
              <Input
                id="add-prov-name"
                placeholder="e.g. RSSB, MMI"
                value={providerForm.name}
                onChange={(e) =>
                  setProviderForm({ ...providerForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-prov-coverage">Default coverage %</Label>
              <Input
                id="add-prov-coverage"
                type="number"
                min={0}
                max={100}
                value={providerForm.coverage_percentage}
                onChange={(e) =>
                  setProviderForm({
                    ...providerForm,
                    coverage_percentage: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-prov-email">Contact email</Label>
              <Input
                id="add-prov-email"
                type="email"
                placeholder="billing@insurer.com"
                value={providerForm.contact_email}
                onChange={(e) =>
                  setProviderForm({
                    ...providerForm,
                    contact_email: e.target.value,
                  })
                }
              />
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel={providerSubmitting ? "Adding…" : "Add provider"}
            onCancel={() => {
              if (!providerSubmitting) {
                setAddProviderOpen(false);
                setProviderForm(emptyProviderForm());
              }
            }}
            onConfirm={() => void handleAddProvider()}
            confirmDisabled={providerSubmitting || !providerForm.name.trim()}
            confirmLoading={providerSubmitting}
          />
        </DashboardDialogContent>
      </Dialog>

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
