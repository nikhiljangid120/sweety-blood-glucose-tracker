import React from 'react';
import { Edit2, Trash2, Clock, Calendar, FileText } from 'lucide-react';

export default function ReadingCard({ reading, onEdit, onDelete }) {
  // Clinical categorization reference
  // Fasting/Pre-meal normal: 70-99 / 70-130; Post-meal normal: < 140; Elevated: 140-180; High: > 180; Low: < 70
  const getValueBadge = (val) => {
    if (val < 70) {
      return {
        label: 'Low',
        classes: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    }
    if (val <= 140) {
      return {
        label: 'Normal',
        classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    }
    if (val <= 180) {
      return {
        label: 'Elevated',
        classes: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    }
    return {
      label: 'High',
      classes: 'bg-rose-100 text-rose-800 border-rose-200',
    };
  };

  const badge = getValueBadge(reading.value);

  const slotIcons = {
    'Morning (fasting)': '🌅',
    'After breakfast': '🍳',
    'After lunch': '🥗',
    'After dinner': '🍲',
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <span>{slotIcons[reading.slot] || '⏱️'}</span>
            <span>{reading.slot}</span>
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.classes}`}>
            {badge.label}
          </span>
        </div>

        <div className="my-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {reading.value}
          </span>
          <span className="text-sm font-semibold text-slate-500">mg/dl</span>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{reading.date}</span>
        </div>

        {reading.notes && (
          <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="line-clamp-2">{reading.notes}</p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          onClick={() => onEdit(reading)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          title="Edit reading"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
          Edit
        </button>
        <button
          onClick={() => onDelete(reading)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
          title="Delete reading"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
          Delete
        </button>
      </div>
    </div>
  );
}
