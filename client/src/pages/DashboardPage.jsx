import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Layers,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import ReadingCard from '../components/ReadingCard';
import EmptyState from '../components/EmptyState';
import ReadingFormModal from '../components/ReadingFormModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Pagination from '../components/Pagination';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

export default function DashboardPage() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [viewMode, setViewMode] = useState('date'); // 'date' | 'all'
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state (for 'all' mode)
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Daily statistics
  const [dailyStats, setDailyStats] = useState({
    highest: null,
    lowest: null,
    average: null,
    count: 0,
  });

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [deletingReading, setDeletingReading] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Fetch readings based on current viewMode & selectedDate
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (viewMode === 'date') {
        const res = await api.getReadings({ date: selectedDate });
        const list = res.data?.readings || [];
        setReadings(list);
        setTotal(list.length);
        setTotalPages(1);

        // Compute daily summary
        if (list.length > 0) {
          const vals = list.map((r) => r.value);
          const highest = Math.max(...vals);
          const lowest = Math.min(...vals);
          const sum = vals.reduce((a, b) => a + b, 0);
          const average = Number((sum / vals.length).toFixed(1));
          setDailyStats({ highest, lowest, average, count: list.length });
        } else {
          setDailyStats({ highest: null, lowest: null, average: null, count: 0 });
        }
      } else {
        // 'all' mode with pagination
        const res = await api.getReadings({ page, limit });
        setReadings(res.data?.readings || []);
        setTotal(res.data?.total || 0);
        setTotalPages(res.data?.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load readings.');
    } finally {
      setLoading(false);
    }
  }, [viewMode, selectedDate, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Form submission (Create or Update)
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setModalError(null);
    try {
      if (editingReading) {
        await api.updateReading(editingReading.id, formData);
      } else {
        await api.createReading(formData);
      }
      setIsFormOpen(false);
      setEditingReading(null);
      await loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to save reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete reading
  const handleDeleteConfirm = async () => {
    if (!deletingReading) return;
    setIsSubmitting(true);
    try {
      await api.deleteReading(deletingReading.id);
      setDeletingReading(null);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete reading.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAddModal = (defaultSlot = null) => {
    setModalError(null);
    setEditingReading(
      defaultSlot ? { date: selectedDate, slot: defaultSlot, value: '' } : null
    );
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (reading) => {
    setModalError(null);
    setEditingReading(reading);
    setIsFormOpen(true);
  };

  // Find recorded slots for selected date
  const recordedSlots = readings.reduce((acc, r) => {
    if (r.date === selectedDate) {
      acc[r.slot] = r;
    }
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Glucose Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Log up to 4 readings per day across designated meal intervals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              max={getTodayStr()}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setViewMode('date');
              }}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('date')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'date'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Selected Date
            </button>
            <button
              onClick={() => {
                setViewMode('all');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'all'
                  ? 'bg-white text-rose-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Readings
            </button>
          </div>

          {/* Add Reading Button */}
          <button
            onClick={() => handleOpenAddModal()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-200 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Reading
          </button>
        </div>
      </div>

      {/* Date Overview / Slot Status Bar (when in 'date' mode) */}
      {viewMode === 'date' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold text-slate-900">
                Daily Slots for {selectedDate}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                {dailyStats.count} / 4 Slots Recorded
              </span>
            </div>
            {selectedDate === getTodayStr() && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Today
              </span>
            )}
          </div>

          {/* 4 Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SLOTS.map((slotName) => {
              const recorded = recordedSlots[slotName];
              return (
                <div
                  key={slotName}
                  className={`rounded-2xl p-4 border transition-all ${
                    recorded
                      ? 'bg-rose-50/30 border-rose-200/80'
                      : 'bg-slate-50/70 border-dashed border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-600 truncate">{slotName}</span>
                    {recorded ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Logged
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-medium">
                        Empty
                      </span>
                    )}
                  </div>

                  {recorded ? (
                    <div className="flex items-baseline justify-between mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900">
                          {recorded.value}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">mg/dl</span>
                      </div>
                      <button
                        onClick={() => handleOpenEditModal(recorded)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <button
                        onClick={() => handleOpenAddModal(slotName)}
                        className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-rose-600 transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Record
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Average Glucose"
          value={viewMode === 'date' ? dailyStats.average : null}
          unit="mg/dl"
          subtitle={viewMode === 'date' ? `Target: 70–140 mg/dl` : 'Switch to Reports for full stats'}
          icon={Calculator}
          color="blue"
        />
        <StatCard
          title="Highest Reading"
          value={viewMode === 'date' ? dailyStats.highest : null}
          unit="mg/dl"
          subtitle={viewMode === 'date' ? `Peak value for this date` : 'Switch to Reports for full stats'}
          icon={ArrowUpRight}
          color="rose"
        />
        <StatCard
          title="Lowest Reading"
          value={viewMode === 'date' ? dailyStats.lowest : null}
          unit="mg/dl"
          subtitle={viewMode === 'date' ? `Lowest value for this date` : 'Switch to Reports for full stats'}
          icon={ArrowDownRight}
          color="emerald"
        />
        <StatCard
          title="Total Readings"
          value={viewMode === 'date' ? dailyStats.count : total}
          unit="readings"
          subtitle={viewMode === 'date' ? `Max 4 per day` : `Total in history`}
          icon={Layers}
          color="amber"
        />
      </div>

      {/* Main Readings Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            {viewMode === 'date'
              ? `Readings for ${selectedDate}`
              : `All Historical Readings (${total})`}
          </h2>
          {loading && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading...
            </span>
          )}
        </div>

        {readings.length === 0 && !loading ? (
          <EmptyState
            title={viewMode === 'date' ? `No readings for ${selectedDate}` : 'No readings yet'}
            description={
              viewMode === 'date'
                ? 'You have not recorded any readings for this date. Start by adding one.'
                : 'Your blood glucose history is currently empty.'
            }
            actionLabel="Add Glucose Reading"
            onAction={() => handleOpenAddModal()}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {readings.map((reading) => (
                <ReadingCard
                  key={reading.id}
                  reading={reading}
                  onEdit={handleOpenEditModal}
                  onDelete={setDeletingReading}
                />
              ))}
            </div>

            {viewMode === 'all' && (
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      <ReadingFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReading(null);
          setModalError(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={
          editingReading || {
            date: selectedDate,
            slot: SLOTS[0],
            value: '',
            notes: '',
          }
        }
        isSubmitting={isSubmitting}
        apiError={modalError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingReading}
        reading={deletingReading}
        onClose={() => setDeletingReading(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isSubmitting}
      />
    </div>
  );
}
