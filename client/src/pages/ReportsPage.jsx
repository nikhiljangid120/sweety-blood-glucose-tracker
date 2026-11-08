import React, { useState, useEffect } from 'react';
import {
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Layers,
  Clock,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import EmptyState from '../components/EmptyState';
import GlucoseChart from '../components/GlucoseChart';

export default function ReportsPage() {
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'month-to-date' | 'monthly'
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getAllReports(selectedDate);
        setReports(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedDate]);

  const activeReport = reports ? reports[activeTab === 'month-to-date' ? 'monthToDate' : activeTab] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Glucose Reports & Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clinical summaries across Daily, Month-to-Date, and Monthly intervals
          </p>
        </div>

        {/* Reference Date Picker */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase">
            Reference Date:
          </label>
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              max={getTodayStr()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'daily'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          Daily Report ({selectedDate})
        </button>

        <button
          onClick={() => setActiveTab('month-to-date')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'month-to-date'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Month-to-Date Report
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeTab === 'monthly'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Monthly Report (Previous Month)
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-rose-500" />
          <p className="text-sm font-medium">Generating reports...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-sm font-medium">
          {error}
        </div>
      ) : activeReport ? (
        <div className="space-y-8">
          {/* Report Metadata Banner */}
          <div className="bg-gradient-to-r from-rose-50 via-pink-50/50 to-white rounded-2xl p-5 border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                {activeReport.type.toUpperCase()} REPORT
              </span>
              <h2 className="text-lg font-black text-slate-900">
                {activeReport.type === 'daily' && `Daily Log for ${activeReport.selectedDate}`}
                {activeReport.type === 'month-to-date' &&
                  `Month-to-Date: ${activeReport.startDate} to ${activeReport.endDate}`}
                {activeReport.type === 'monthly' &&
                  `Whole Previous Month: ${activeReport.startDate} to ${activeReport.endDate}`}
              </h2>
            </div>
            <div className="text-xs font-semibold text-slate-600 bg-white/80 px-3.5 py-1.5 rounded-xl border border-rose-100/60 shadow-2xs">
              Date Range: {activeReport.startDate} — {activeReport.endDate}
            </div>
          </div>

          {/* KPI Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Average Glucose"
              value={activeReport.average}
              unit="mg/dl"
              subtitle="Rounded to 1 decimal place"
              icon={Calculator}
              color="blue"
            />
            <StatCard
              title="Highest Reading"
              value={activeReport.highest}
              unit="mg/dl"
              subtitle="Peak recorded level"
              icon={ArrowUpRight}
              color="rose"
            />
            <StatCard
              title="Lowest Reading"
              value={activeReport.lowest}
              unit="mg/dl"
              subtitle="Minimum recorded level"
              icon={ArrowDownRight}
              color="emerald"
            />
            <StatCard
              title="Number of Readings"
              value={activeReport.count}
              unit="entries"
              subtitle={`Total logs in date range`}
              icon={Layers}
              color="amber"
            />
          </div>

          {/* Empty State when no readings */}
          {activeReport.count === 0 ? (
            <EmptyState
              title={`No readings for this ${activeReport.type} period`}
              description={`There are no blood glucose records found between ${activeReport.startDate} and ${activeReport.endDate}.`}
            />
          ) : (
            <>
              {/* Daily Report Slot-by-Slot List requirement: "The daily report also lists each reading with its slot." */}
              {activeReport.type === 'daily' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">
                    Daily Readings Breakdown ({activeReport.readings.length} of 4)
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Time Slot</th>
                          <th className="pb-3">Value</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {activeReport.readings.map((r) => {
                          const isHigh = r.value > 140;
                          const isLow = r.value < 70;
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/50">
                              <td className="py-3.5 pl-2 font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                {r.slot}
                              </td>
                              <td className="py-3.5 font-black text-sm text-slate-900">
                                {r.value}{' '}
                                <span className="text-[10px] font-normal text-slate-400">
                                  mg/dl
                                </span>
                              </td>
                              <td className="py-3.5">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isLow
                                      ? 'bg-amber-100 text-amber-800'
                                      : isHigh
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {isLow ? 'Low' : isHigh ? 'Elevated' : 'Normal'}
                                </span>
                              </td>
                              <td className="py-3.5 text-slate-500">
                                {r.notes || <span className="text-slate-300 italic">None</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bonus Trend Line Chart for Month-to-date and Monthly reports */}
              {(activeReport.type === 'month-to-date' || activeReport.type === 'monthly') && (
                <GlucoseChart
                  readings={activeReport.readings}
                  title={`${activeReport.type === 'monthly' ? 'Previous Month' : 'Month-to-Date'} Glucose Curve`}
                />
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
