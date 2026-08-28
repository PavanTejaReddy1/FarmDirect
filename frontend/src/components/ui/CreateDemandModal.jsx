import { useState, useEffect, useRef } from "react";
import { X, Package } from "lucide-react";
import Button from "./Button";
import { CATEGORIES, LOCATIONS } from "../../data/demand";

const UNITS = ["kg", "g", "dozen", "bunch", "litre", "tray (30)", "piece"];

const EMPTY_FORM = {
  name: "",
  category: "",
  quantity: "",
  unit: "kg",
  deliveryDate: "",
  location: "",
  note: "",
};

function Field({ label, htmlFor, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
        {label}
        {required && <span className="text-amber-600 ml-0.5" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS =
  "w-full rounded-xl border border-forest-800/12 bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-forest-600 transition-colors";
const SELECT_CLS = INPUT_CLS + " cursor-pointer";

export default function CreateDemandModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const firstFieldRef = useRef(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setTimeout(() => firstFieldRef.current?.focus(), 50);
    }
  }, [open]);

  // Trap Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required.";
    if (!form.category) e.category = "Please choose a category.";
    if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) <= 0)
      e.quantity = "Enter a valid quantity greater than 0.";
    if (!form.deliveryDate) e.deliveryDate = "Choose a preferred delivery date.";
    if (!form.location) e.location = "Please choose a location.";
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      ...form,
      quantity: Number(form.quantity),
      id: `my-${Date.now()}`,
      matched: 0,
      status: "open",
      createdAt: new Date().toISOString().slice(0, 10),
    });
    onClose();
  }

  // Today's date string for min on deliveryDate
  const today = new Date().toISOString().slice(0, 10);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-forest-950/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cd-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-canvas-raised rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-reveal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-forest-800/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-forest-800/[0.08] flex items-center justify-center text-forest-700" aria-hidden="true">
              <Package size={17} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-600">New demand</p>
              <h2 id="cd-modal-title" className="font-display text-lg text-forest-950 leading-tight">
                What do you need?
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full text-ink-faint hover:text-forest-900 hover:bg-forest-800/[0.08] transition-colors"
            aria-label="Close modal"
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
            {/* Product name */}
            <Field label="Product name" htmlFor="cd-name" required>
              <input
                ref={firstFieldRef}
                id="cd-name"
                type="text"
                placeholder="e.g. Tomatoes, Spinach, Rice"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={INPUT_CLS}
                aria-describedby={errors.name ? "cd-name-err" : undefined}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p id="cd-name-err" className="text-xs text-amber-700" role="alert">{errors.name}</p>
              )}
            </Field>

            {/* Category */}
            <Field label="Category" htmlFor="cd-category" required>
              <select
                id="cd-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={SELECT_CLS}
                aria-describedby={errors.category ? "cd-category-err" : undefined}
                aria-invalid={!!errors.category}
              >
                <option value="">Select a category</option>
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.category && (
                <p id="cd-category-err" className="text-xs text-amber-700" role="alert">{errors.category}</p>
              )}
            </Field>

            {/* Quantity + Unit row */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity needed" htmlFor="cd-qty" required>
                <input
                  id="cd-qty"
                  type="number"
                  min="1"
                  step="0.5"
                  placeholder="e.g. 10"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  className={INPUT_CLS}
                  aria-describedby={errors.quantity ? "cd-qty-err" : undefined}
                  aria-invalid={!!errors.quantity}
                />
                {errors.quantity && (
                  <p id="cd-qty-err" className="text-xs text-amber-700" role="alert">{errors.quantity}</p>
                )}
              </Field>
              <Field label="Unit" htmlFor="cd-unit">
                <select
                  id="cd-unit"
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  className={SELECT_CLS}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Delivery date + Location row */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Preferred delivery" htmlFor="cd-date" required>
                <input
                  id="cd-date"
                  type="date"
                  min={today}
                  value={form.deliveryDate}
                  onChange={(e) => set("deliveryDate", e.target.value)}
                  className={INPUT_CLS}
                  aria-describedby={errors.deliveryDate ? "cd-date-err" : undefined}
                  aria-invalid={!!errors.deliveryDate}
                />
                {errors.deliveryDate && (
                  <p id="cd-date-err" className="text-xs text-amber-700" role="alert">{errors.deliveryDate}</p>
                )}
              </Field>
              <Field label="Location" htmlFor="cd-location" required>
                <select
                  id="cd-location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  className={SELECT_CLS}
                  aria-describedby={errors.location ? "cd-location-err" : undefined}
                  aria-invalid={!!errors.location}
                >
                  <option value="">Select area</option>
                  {LOCATIONS.filter((l) => l !== "All").map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                {errors.location && (
                  <p id="cd-location-err" className="text-xs text-amber-700" role="alert">{errors.location}</p>
                )}
              </Field>
            </div>

            {/* Optional note */}
            <Field label="Notes (optional)" htmlFor="cd-note">
              <textarea
                id="cd-note"
                rows={2}
                placeholder="Any preferences — variety, ripeness, packaging…"
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                className={INPUT_CLS + " resize-none"}
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 flex flex-col sm:flex-row gap-2.5 border-t border-forest-800/10">
            <Button type="submit" variant="primary" size="md" className="flex-1">
              Add to demand pool
            </Button>
            <Button type="button" variant="outline" size="md" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
