import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Clock, Activity, FileText } from 'lucide-react';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

export default function ReadingFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isSubmitting = false,
  apiError = null,
}) {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(getTodayStr());
  const [slot, setSlot] = useState(SLOTS[0]);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date || getTodayStr());
      setSlot(initialData.slot || SLOTS[0]);
      setValue(initialData.value !== undefined ? String(initialData.value) : '');
      setNotes(initialData.notes || '');
    } else {
      setDate(getTodayStr());
      setSlot(SLOTS[0]);
      setValue('');
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    const today = getTodayStr();

    // 1. Date cannot be in the future
    if (!date) {
      errs.date = 'Date is required.';
    } else if (date > today) {
      errs.date = 'Date cannot be in the future.';
    }

    // 2. Slot is required
    if (!slot) {
      errs.slot = 'Slot is required.';
    }

    // 3. Value validations
    if (value === undefined || value === null || String(value).trim() === '') {
      errs.value = 'Please enter a glucose value.';
    } else {
      const numVal = Number(value);
      if (!Number.isInteger(numVal) || numVal < 40 || numVal > 600) {
        errs.value = 'Value must be between 40 and 600 mg/dl.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      date,
      slot,
      value: parseInt(value, 10),
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {initialData ? 'Edit Glucose Reading' : 'Record Glucose Reading'}
              </h2>
              <p className="text-xs text-slate-500">
                {initialData ? 'Update your blood sugar record' : 'Keep your daily log up to date'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global / Backend Error Banner */}
        {apiError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="font-semibold">{apiError}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Date Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Reading Date
            </label>
            <div className="relative">
              <input
                type="date"
                max={getTodayStr()}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                  errors.date
                    ? 'border-rose-300 ring-rose-100 text-rose-900 bg-rose-50/30'
                    : 'border-slate-300 focus:border-rose-500 focus:ring-rose-100'
                }`}
              />
            </div>
            {errors.date && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.date}
              </p>
            )}
          </div>

          {/* Slot Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Time Slot
            </label>
            <div className="relative">
              <select
                value={slot}
                onChange={(e) => {
                  setSlot(e.target.value);
                  if (errors.slot) setErrors((prev) => ({ ...prev, slot: null }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all appearance-none bg-white ${
                  errors.slot
                    ? 'border-rose-300 ring-rose-100 text-rose-900 bg-rose-50/30'
                    : 'border-slate-300 focus:border-rose-500 focus:ring-rose-100'
                }`}
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            {errors.slot && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.slot}
              </p>
            )}
          </div>

          {/* Blood Glucose Value */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Glucose Value
              </label>
              <span className="text-xs text-slate-400 font-medium">Whole number (40–600 mg/dl)</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="40"
                max="600"
                step="1"
                placeholder="e.g. 110"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (errors.value) setErrors((prev) => ({ ...prev, value: null }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-2 transition-all ${
                  errors.value
                    ? 'border-rose-300 ring-rose-100 text-rose-900 bg-rose-50/30'
                    : 'border-slate-300 focus:border-rose-500 focus:ring-rose-100'
                }`}
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                mg/dl
              </span>
            </div>
            {errors.value && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.value}
              </p>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Felt dizzy, had oatmeal with walnuts..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:border-rose-500 focus:ring-2 focus:ring-rose-100 focus:outline-none transition-all resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-xl shadow-sm hover:shadow transition-all"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Reading' : 'Save Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
