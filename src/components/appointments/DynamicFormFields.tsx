import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ServiceFormField } from "@/hooks/useAppointmentData";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Image } from "lucide-react";

interface DynamicFormFieldsProps {
  fields: ServiceFormField[];
  values: Record<string, string>;
  fileValues: Record<string, File[]>;
  existingUrls: Record<string, string[]>;
  onChange: (fieldName: string, value: string) => void;
  onFileChange: (fieldName: string, files: File[]) => void;
  errors: Record<string, string>;
}

export const DynamicFormFields = ({
  fields,
  values,
  fileValues,
  existingUrls,
  onChange,
  onFileChange,
  errors,
}: DynamicFormFieldsProps) => {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.id}>
          <Label>
            {field.field_label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>

          {field.field_type === "text" && (
            <Input
              value={values[field.field_name] ?? ""}
              onChange={(e) => onChange(field.field_name, e.target.value)}
            />
          )}

          {field.field_type === "number" && (
            <Input
              type="number"
              value={values[field.field_name] ?? ""}
              onChange={(e) => onChange(field.field_name, e.target.value)}
            />
          )}

          {field.field_type === "textarea" && (
            <Textarea
              rows={3}
              value={values[field.field_name] ?? ""}
              onChange={(e) => onChange(field.field_name, e.target.value)}
            />
          )}

          {field.field_type === "checkbox" && (
            <div className="flex items-center gap-2 mt-1">
              <Checkbox
                checked={values[field.field_name] === "true"}
                onCheckedChange={(v) => onChange(field.field_name, v ? "true" : "false")}
              />
              <span className="text-sm">{field.field_label}</span>
            </div>
          )}

          {field.field_type === "select" && field.options && (
            <Select
              value={values[field.field_name] ?? ""}
              onValueChange={(v) => onChange(field.field_name, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {(field.options as string[]).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.field_type === "photo_upload" && (
            <div className="space-y-2 mt-1">
              {/* Existing photos */}
              {existingUrls[field.field_name] && existingUrls[field.field_name].length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {existingUrls[field.field_name].map((url, i) => (
                    <div key={i} className="w-20 h-20 rounded border border-border overflow-hidden bg-muted">
                      <img
                        src={supabase.storage.from("appointment-photos").getPublicUrl(url).data.publicUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* New files preview */}
              {fileValues[field.field_name] && fileValues[field.field_name].length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {fileValues[field.field_name].map((file, i) => (
                    <div key={i} className="relative w-20 h-20 rounded border border-border overflow-hidden bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5"
                        onClick={() => {
                          const newFiles = [...fileValues[field.field_name]];
                          newFiles.splice(i, 1);
                          onFileChange(field.field_name, newFiles);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-border bg-muted/40 px-4 py-2 text-sm hover:bg-muted transition-colors">
                <Upload className="w-4 h-4" />
                Adicionar fotos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const existing = fileValues[field.field_name] ?? [];
                    const newFiles = Array.from(e.target.files ?? []);
                    onFileChange(field.field_name, [...existing, ...newFiles]);
                  }}
                />
              </label>
            </div>
          )}

          {errors[field.field_name] && (
            <p className="text-xs text-destructive mt-1">{errors[field.field_name]}</p>
          )}
        </div>
      ))}
    </div>
  );
};
