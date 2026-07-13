"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type A2UIField = {
  id: string;
  type: "text" | "choice" | "number";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

type A2UIQuestionData = {
  a2ui: true;
  questionId: string;
  surfaceId: string;
  messages: unknown[];
  fields: A2UIField[];
  question: string;
};

type A2UIQuestionProps = {
  data: A2UIQuestionData;
  onSubmit?: (questionId: string, answers: Record<string, string>) => void;
  disabled?: boolean;
};

export function A2UIQuestion({
  data,
  onSubmit,
  disabled = false,
}: A2UIQuestionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of data.fields) {
      initial[field.id] = "";
    }
    return initial;
  });

  const handleSubmit = () => {
    onSubmit?.(data.questionId, answers);
  };

  const updateField = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <p className="mb-3 text-sm font-semibold text-foreground">
        {data.question}
      </p>

      <div className="space-y-3">
        {data.fields.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <Label htmlFor={field.id} className="text-xs font-medium">
              {field.label}
              {field.required !== false && (
                <span className="ml-1 text-destructive">*</span>
              )}
            </Label>

            {field.type === "choice" && field.options ? (
              <RadioGroup
                value={answers[field.id]}
                onValueChange={(v) => updateField(field.id, v)}
                disabled={disabled}
              >
                {field.options.map((opt) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                    <Label
                      htmlFor={`${field.id}-${opt}`}
                      className="text-sm font-normal"
                    >
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Input
                id={field.id}
                type={field.type === "number" ? "number" : "text"}
                placeholder={field.placeholder}
                value={answers[field.id]}
                onChange={(e) => updateField(field.id, e.target.value)}
                disabled={disabled}
                className="h-9 text-sm"
              />
            )}
          </div>
        ))}
      </div>

      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={disabled || data.fields.some((f) => f.required !== false && !answers[f.id])}
        className="mt-4 h-8 gap-1.5 text-xs"
      >
        <Send className="h-3 w-3" />
        Submit
      </Button>
    </motion.div>
  );
}

export type { A2UIQuestionData };
