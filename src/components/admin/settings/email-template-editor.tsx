"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SAMPLE_VARS: Record<string, string> = {
  actionUrl: "https://app.pryrox.com/reset-password?token=demo-preview",
  signInUrl: "https://app.pryrox.com/sign-in",
  pharmacyName: "Kigali Central Pharmacy",
  fullName: "Jane Uwase",
  role: "Pharmacist",
  temporaryPassword: "TempPass123!",
  planName: "Growth",
  amount: "45,000",
  currency: "RWF",
  invoiceNumber: "INV-2026-0042",
  paymentMethod: "Card",
  paidAt: "16 Jul 2026, 11:20",
  title: "Scheduled maintenance",
  message:
    "Pryrox will undergo scheduled maintenance this Sunday from 02:00–04:00 CAT.",
  email: "jane@example.com",
};

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Lightweight HTML highlighter for the code overlay (no editor dependency). */
export function highlightHtmlSource(source: string): string {
  let out = escapeHtml(source);

  // Comments
  out = out.replace(
    /(&lt;!--[\s\S]*?--&gt;)/g,
    '<span class="text-neutral-500">$1</span>',
  );

  // Mustache / template variables
  out = out.replace(
    /(\{\{[a-zA-Z0-9_.]+\}\})/g,
    '<span class="text-amber-300">$1</span>',
  );

  // Tags: &lt;/tag&gt; or &lt;tag ...&gt;
  out = out.replace(
    /(&lt;\/?)([a-zA-Z][\w:-]*)(.*?)(\/?&gt;)/g,
    (_m, open, tag, rest, close) => {
      const coloredRest = rest.replace(
        /([a-zA-Z_:][\w:.-]*)(=)(&quot;[^&]*&quot;|&apos;[^&]*&apos;|[^\s&]+)?/g,
        (_a: string, name: string, eq: string, val?: string) => {
          const value = val
            ? `<span class="text-emerald-300">${val}</span>`
            : "";
          return `<span class="text-sky-300">${name}</span><span class="text-neutral-400">${eq}</span>${value}`;
        },
      );
      return (
        `<span class="text-neutral-500">${open}</span>` +
        `<span class="text-fuchsia-300">${tag}</span>` +
        coloredRest +
        `<span class="text-neutral-500">${close}</span>`
      );
    },
  );

  return out;
}

export function applyEmailPreviewVars(
  template: string,
  extras?: Record<string, string>,
): string {
  const vars = { ...SAMPLE_VARS, ...extras };
  return template.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_m, key: string) => {
    return vars[key] ?? `{{${key}}}`;
  });
}

type HtmlCodeEditorProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
};

export function HtmlCodeEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 14,
  className,
}: HtmlCodeEditorProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const highlighted = useMemo(() => highlightHtmlSource(value || " "), [value]);

  const syncScroll = () => {
    const area = areaRef.current;
    const pre = preRef.current;
    if (!area || !pre) return;
    pre.scrollTop = area.scrollTop;
    pre.scrollLeft = area.scrollLeft;
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-inner",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-neutral-800 bg-neutral-900/80 px-3 py-1.5">
        <span className="size-2 rounded-full bg-red-400/80" />
        <span className="size-2 rounded-full bg-amber-400/80" />
        <span className="size-2 rounded-full bg-emerald-400/80" />
        <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          HTML
        </span>
      </div>
      <div className="relative">
        <pre
          ref={preRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-[12px] leading-5 text-neutral-200"
          dangerouslySetInnerHTML={{ __html: highlighted + "\n" }}
        />
        <textarea
          ref={areaRef}
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          spellCheck={false}
          onScroll={syncScroll}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "relative z-10 w-full resize-y bg-transparent p-3 font-mono text-[12px] leading-5",
            "text-transparent caret-sky-300 selection:bg-sky-500/30",
            "placeholder:text-neutral-600 focus:outline-none",
          )}
        />
      </div>
    </div>
  );
}

type EmailTemplatePreviewProps = {
  subject: string;
  html: string;
  className?: string;
};

export function EmailTemplatePreview({
  subject,
  html,
  className,
}: EmailTemplatePreviewProps) {
  const previewSubject = useMemo(
    () => applyEmailPreviewVars(subject || "(no subject)"),
    [subject],
  );
  const previewHtml = useMemo(() => applyEmailPreviewVars(html || ""), [html]);
  const [srcDoc, setSrcDoc] = useState("");

  useEffect(() => {
    // Defer so rapid typing doesn't thrash the iframe every keystroke frame.
    const id = window.setTimeout(() => {
      setSrcDoc(
        previewHtml.trim()
          ? previewHtml
          : "<p style='font-family:system-ui;color:#666;padding:24px'>No HTML body yet.</p>",
      );
    }, 120);
    return () => window.clearTimeout(id);
  }, [previewHtml]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/50",
        className,
      )}
    >
      <div className="border-b border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Subject
        </p>
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
          {previewSubject}
        </p>
      </div>
      <div className="bg-[linear-gradient(45deg,#e5e5e5_25%,transparent_25%),linear-gradient(-45deg,#e5e5e5_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e5e5_75%),linear-gradient(-45deg,transparent_75%,#e5e5e5_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] p-3 dark:bg-none dark:bg-neutral-900">
        <iframe
          title="Email template preview"
          sandbox=""
          srcDoc={srcDoc}
          className="h-[420px] w-full rounded-md border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-700"
        />
      </div>
      <p className="border-t border-neutral-200 px-3 py-1.5 text-[10px] text-neutral-500 dark:border-neutral-800">
        Preview substitutes sample values for {"{{variables}}"}. Links are inert.
      </p>
    </div>
  );
}
