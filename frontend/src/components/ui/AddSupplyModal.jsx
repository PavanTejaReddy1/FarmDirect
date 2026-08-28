import { useState, useEffect, useRef } from "react";
import { X, Sprout } from "lucide-react";
import Button from "./Button";
import { FARMER_CATEGORIES, FARMER_LOCATIONS, SUPPLY_UNITS } from "../../data/farmerDemand";

const EMPTY_FORM = {
  name: "",
  category: "",
  availableQty: "",
  unit: "kg",
  availableFrom: "",
  availableUntil: "",
  location: "",
  notes: "",
};

const INPUT_CLS =
  "w-full rounded-xl border border-forest-800/12 bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-forest-600 transition-colors";
const SELECT_CLS = INPUT_CLS + " cursor-pointer";

function Field({ label, htmlFor, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
        {label}
        {required && (
          <span className="text-amber-600 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

/**
 * Modal for declaring a new supply item.
 * Props:
 *   open      boolean
 *   onClose   () => void
 *   onSubmit  (supplyItem) => void
 */
export default function AddSupplyModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const firstRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
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
    if (!form.category) e.category = "Please select a category.";
    if (!form.availableQty || isNaN(Number(form.availableQty)) || Number(form.availableQty) <= 0)
      e.availableQty = "Enter a valid quantity greater than 0.";
    if (!form.availableFrom) e.availableFrom = "Enter the date your supply is available from.";
    if (!form.availableUntil) e.availableUntil = "Enter the last date your supply is available.";
    if (form.availableFrom && form.availableUntil && form.availableUntil < form.availableFrom)
      e.availableUntil = "End date must be on or after start date.";
    if (!form.location) e.location = "Please select a location.";
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
      id: `sup-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      availableQty: Number(form.availableQty),
      committedQty: 0,
      unit: form.unit,
      availableFrom: form.availableFrom,
      availableUntil: form.availableUntil,
      location: form.location,
      notes: form.notes.trim(),
      status: "available",
    });
    onClose();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-forest-950/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="as-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full sm:max-w-lg bg-canvas-raised rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-reveal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-forest-800/10">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl bg-forest-800/[0.08] flex items-center justify-center text-forest-700"
              aria-hidden="true"
            >
              <Sprout size={17} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-forest-600">
                Declare supply
              </p>
              <h2
                id="as-modal-title"
                className="font-display text-lg text-forest-950 leading-tight"
              >
                What can you supply?
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
            <Field label="Product" htmlFor="as-name" required>
              <input
                ref={firstRef}
                id="as-name"
                type="text"
                placeholder="e.g. Tomatoes, Rice, Spinach"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className={INPUT_CLS}
                aria-describedby={errors.name ? "as-name-err" : undefined}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p id="as-name-err" className="text-xs text-amber-700" role="alert">
                  {errors.name}
                </p>
              )}
            </Field>

            {/* Category */}
            <Field label="Category" htmlFor="as-category" required>
              <select
                id="as-category"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className={SELECT_CLS}
                aria-describedby={errors.category ? "as-category-err" : undefined}
                aria-invalid={!!errors.category}
              >
                <option value="">Select a category</option>
                {FARMER_CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p id="as-category-err" className="text-xs text-amber-700" role="alert">
                  {errors.category}
                </p>
              )}
            </Field>

            {/* Quantity + unit */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Available quantity" htmlFor="as-qty" required>
                <input
                  id="as-qty"
                  type="number"
                  min="1"
                  step="0.5"
                  placeholder="e.g. 200"
                  value={form.availableQty}
                  onChange={(e) => set("availableQty", e.target.value)}
                  className={INPUT_CLS}
                  aria-describedby={errors.availableQty ? "as-qty-err" : undefined}
                  aria-invalid={!!errors.availableQty}
                />
                {errors.availableQty && (
                  <p id="as-qty-err" className="text-xs text-amber-700" role="alert">
                    {errors.availableQty}
                  </p>
                )}
              </Field>
              <Field label="Unit" htmlFor="as-unit">
                <select
                  id="as-unit"
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  className={SELECT_CLS}
                >
                  {SUPPLY_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Available from / until */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Available from" htmlFor="as-from" required>
                <input
                  id="as-from"
                  type="date"
                  min={today}
                  value={form.availableFrom}
                  onChange={(e) => set("availableFrom", e.target.value)}
                  className={INPUT_CLS}
                  aria-describedby={errors.availableFrom ? "as-from-err" : undefined}
                  aria-invalid={!!errors.availableFrom}
                />
                {errors.availableFrom && (
                  <p id="as-from-err" className="text-xs text-amber-700" role="alert">
                    {errors.availableFrom}
                  </p>
                )}
              </Field>
              <Field label="Available until" htmlFor="as-until" required>
                <input
                  id="as-until"
                  type="date"
                  min={form.availableFrom || today}
                  value={form.availableUntil}
                  onChange={(e) => set("availableUntil", e.target.value)}
                  className={INPUT_CLS}
                  aria-describedby={errors.availableUntil ? "as-until-err" : undefined}
                  aria-invalid={!!errors.availableUntil}
                />
                {errors.availableUntil && (
                  <p id="as-until-err" className="text-xs text-amber-700" role="alert">
                    {errors.availableUntil}
                  </p>
                )}
              </Field>
            </div>

            {/* Location */}
            <Field label="Your location" htmlFor="as-location" required>
              <select
                id="as-location"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className={SELECT_CLS}
                aria-describedby={errors.location ? "as-location-err" : undefined}
                aria-invalid={!!errors.location}
              >
                <option value="">Select nearest area</option>
                {FARMER_LOCATIONS.filter((l) => l !== "All").map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {errors.location && (
                <p id="as-location-err" className="text-xs text-amber-700" role="alert">
                  {errors.location}
                </p>
              )}
            </Field>

            {/* Notes */}
            <Field label="Notes (optional)" htmlFor="as-notes">
              <textarea
                id="as-notes"
                rows={2}
                placeholder="Grade, variety, packaging, minimum order…"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className={INPUT_CLS + " resize-none"}
              />
            </Field>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 flex flex-col sm:flex-row gap-2.5 border-t border-forest-800/10">
            <Button type="submit" variant="primary" size="md" className="flex-1">
              Add to my supply
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
