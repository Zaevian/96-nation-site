"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { FormType } from "@/lib/validations/forms";

type FieldConfig =
  | { name: string; label: string; type: "text" | "email" | "tel" | "textarea"; required?: boolean; autoComplete?: string; rows?: number }
  | { name: string; label: string; type: "select"; required?: boolean; options: { value: string; label: string }[] }
  | { name: string; label: string; type: "checkbox-group"; options: { value: string; label: string }[] };

type PublicFormProps = {
  formType: FormType;
  fields: FieldConfig[];
  submitLabel?: string;
  sourcePath?: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const fieldClass =
  "mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-fg placeholder:text-muted min-h-11 focus:border-accent";

const labelClass = "block text-sm font-medium text-fg";

export function PublicForm({
  formType,
  fields,
  submitLabel = "Submit",
  sourcePath,
}: PublicFormProps) {
  const formId = useId();
  const statusId = `${formId}-status`;
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    setStatus({ kind: "submitting" });

    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Record<string, unknown> = {};

    for (const field of fields) {
      if (field.type === "checkbox-group") {
        const values = fd.getAll(field.name).map(String);
        body[field.name] = values;
      } else if (field.type === "textarea" || field.type === "text" || field.type === "email" || field.type === "tel" || field.type === "select") {
        body[field.name] = String(fd.get(field.name) ?? "").trim();
      }
    }

    // Honeypot
    body.website = String(fd.get("website") ?? "");

    try {
      const res = await fetch(`/api/forms/${formType}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sourcePath ? { "x-source-path": sourcePath } : {}),
        },
        body: JSON.stringify(body),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        issues?: { path: string; message: string }[];
      };

      if (res.status === 429) {
        setStatus({
          kind: "error",
          message: data.error ?? "Too many submissions. Please try again later.",
        });
        return;
      }

      if (!res.ok) {
        if (data.issues?.length) {
          const next: Record<string, string> = {};
          for (const issue of data.issues) {
            if (issue.path) next[issue.path] = issue.message;
          }
          setFieldErrors(next);
          setStatus({
            kind: "error",
            message: data.error ?? "Please fix the highlighted fields.",
          });
          return;
        }
        setStatus({
          kind: "error",
          message: data.error ?? "Something went wrong. Please try again.",
        });
        return;
      }

      form.reset();
      setStatus({ kind: "success" });
    } catch {
      setStatus({
        kind: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5"
      noValidate
      aria-describedby={statusId}
    >
      {fields.map((field) => {
        const id = `${formId}-${field.name}`;
        const error = fieldErrors[field.name];
        const errorId = error ? `${id}-error` : undefined;

        if (field.type === "checkbox-group") {
          return (
            <fieldset key={field.name} className="space-y-2">
              <legend className={labelClass}>{field.label}</legend>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {field.options.map((opt) => (
                  <label
                    key={opt.value}
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-fg"
                  >
                    <input
                      type="checkbox"
                      name={field.name}
                      value={opt.value}
                      className="size-4 rounded border-border accent-accent"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {error ? (
                <p id={errorId} className="text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </fieldset>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.name}>
              <label htmlFor={id} className={labelClass}>
                {field.label}
                {field.required ? (
                  <span className="text-danger" aria-hidden>
                    {" "}
                    *
                  </span>
                ) : null}
              </label>
              <select
                id={id}
                name={field.name}
                required={field.required}
                className={fieldClass}
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId}
                defaultValue=""
              >
                <option value="" disabled>
                  Select…
                </option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {error ? (
                <p id={errorId} className="mt-1 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <div key={field.name}>
              <label htmlFor={id} className={labelClass}>
                {field.label}
                {field.required ? (
                  <span className="text-danger" aria-hidden>
                    {" "}
                    *
                  </span>
                ) : null}
              </label>
              <textarea
                id={id}
                name={field.name}
                required={field.required}
                rows={field.rows ?? 4}
                className={`${fieldClass} min-h-[6rem]`}
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId}
              />
              {error ? (
                <p id={errorId} className="mt-1 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          );
        }

        return (
          <div key={field.name}>
            <label htmlFor={id} className={labelClass}>
              {field.label}
              {field.required ? (
                <span className="text-danger" aria-hidden>
                  {" "}
                  *
                </span>
              ) : null}
            </label>
            <input
              id={id}
              name={field.name}
              type={field.type}
              required={field.required}
              autoComplete={field.autoComplete}
              className={fieldClass}
              aria-invalid={error ? true : undefined}
              aria-describedby={errorId}
            />
            {error ? (
              <p id={errorId} className="mt-1 text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}

      {/* Honeypot — hidden from humans, filled by bots */}
      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden="true"
      >
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="submit"
          disabled={status.kind === "submitting"}
          aria-busy={status.kind === "submitting"}
        >
          {status.kind === "submitting" ? "Sending…" : submitLabel}
        </Button>
        <p
          id={statusId}
          className="text-sm"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {status.kind === "success" ? (
            <span className="text-accent">
              Thanks — we received your message.
            </span>
          ) : null}
          {status.kind === "error" ? (
            <span className="text-danger">{status.message}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}

export const signupFields: FieldConfig[] = [
  {
    name: "name",
    label: "Full name",
    type: "text",
    required: true,
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    required: true,
    autoComplete: "tel",
  },
  {
    name: "interests",
    label: "Interests",
    type: "checkbox-group",
    options: [
      { value: "events", label: "Events" },
      { value: "community", label: "Community" },
      { value: "volunteer", label: "Volunteer" },
      { value: "media", label: "Media / content" },
    ],
  },
  {
    name: "message",
    label: "Message (optional)",
    type: "textarea",
    rows: 3,
  },
];

export const serviceInquiryFields: FieldConfig[] = [
  {
    name: "name",
    label: "Full name",
    type: "text",
    required: true,
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    required: true,
    autoComplete: "tel",
  },
  {
    name: "serviceType",
    label: "Service type",
    type: "select",
    required: true,
    options: [
      { value: "event_production", label: "Event production" },
      { value: "booking", label: "Booking / talent" },
      { value: "media", label: "Media / content" },
      { value: "other", label: "Other" },
    ],
  },
  {
    name: "message",
    label: "Tell us about your needs",
    type: "textarea",
    required: true,
    rows: 4,
  },
];

export const contactFields: FieldConfig[] = [
  {
    name: "name",
    label: "Full name",
    type: "text",
    required: true,
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Phone (optional)",
    type: "tel",
    autoComplete: "tel",
  },
  {
    name: "message",
    label: "Message",
    type: "textarea",
    required: true,
    rows: 4,
  },
];
