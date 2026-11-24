import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Layers
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';

/**
 * AdminAnalyticsPage — Laboratory Analytics & Performance Reports (TASK-017 / FR-10)
 *
 * Dedicated reporting workbench for Laboratory Administrators:
 * 1. Date Range Filter: Quick presets (Today, Last 7 Days, Last 30 Days) + Custom Start/End date picker.
 * 2. Summary KPI Cards: Total tests, completed, pending backlog, and average Turnaround Time (TAT).
 * 3. Daily Test Volume (Bar Chart): Shows daily diagnostic test demand across the selected window.
 * 4. Test Category Distribution (Pie/Donut Chart): Visualizes tests by medical department (Haematology, etc.).
 * 5. Turnaround Time Trend (Area/Line Chart): Tracks average verification speed (in minutes/hours) over time.
 *
 * Designed to be 100% viva-explainable and beginner-friendly for a solo CS student.
 */
export default function AdminAnalyticsPage() {
  // Preset options for quick filtering
  const PRESET_TODAY = 'today';
  const PRESET_7_DAYS = '7days';
  const PRESET_30_DAYS = '30days';
  const PRESET_CUSTOM = 'custom';

  // Format a Date object to YYYY-MM-DD string for input and API query params
  const formatDateToIso = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State management
  const [activePreset, setActivePreset] = useState(PRESET_7_DAYS);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return formatDateToIso(d);
  });
  const [endDate, setEndDate] = useState(() => formatDateToIso(new Date()));

  // Custom picker temporary state (for editing before pressing "Apply")
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);

  // Data fetching state
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches analytics datasets from Spring Boot backend API:
   * GET /api/dashboard/analytics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  const fetchAnalytics = useCallback(async (start, end) => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getAnalyticsStats(start, end);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics datasets:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load analytics metrics from server. Please verify backend is running.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and whenever active date range changes
  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, [startDate, endDate, fetchAnalytics]);

  /**
   * Handles quick preset button clicks (Today, 7 Days, 30 Days)
   */
  const handleSelectPreset = (preset) => {
    const today = new Date();
    let newStart = '';
    const newEnd = formatDateToIso(today);

    if (preset === PRESET_TODAY) {
      newStart = newEnd;
    } else if (preset === PRESET_7_DAYS) {
      const past7 = new Date();
      past7.setDate(today.getDate() - 6);
      newStart = formatDateToIso(past7);
    } else if (preset === PRESET_30_DAYS) {
      const past30 = new Date();
      past30.setDate(today.getDate() - 29);
      newStart = formatDateToIso(past30);
    }

    setActivePreset(preset);
    setStartDate(newStart);
    setEndDate(newEnd);
    setCustomStart(newStart);
    setCustomEnd(newEnd);
  };

  /**
   * Handles applying custom date inputs
   */
  const handleApplyCustomDates = (e) => {
    e.preventDefault();
    if (!customStart || !customEnd) {
      alert('Please select both a start date and an end date.');
      return;
    }

    if (new Date(customStart) > new Date(customEnd)) {
      alert('Start date cannot be after end date.');
      return;
    }

    setActivePreset(PRESET_CUSTOM);
    setStartDate(customStart);
    setEndDate(customEnd);
  };

  // Color palette for category pie chart slices
  const CATEGORY_COLORS = [
    '#3B82F6', // Blue (Haematology)
    '#10B981', // Emerald (Biochemistry)
    '#8B5CF6', // Purple (Microbiology)
    '#F59E0B', // Amber (Urinalysis)
    '#EC4899', // Pink (Immunology)
    '#06B6D4', // Cyan (Serology)
    '#64748B', // Slate (Other)
  ];

  return (
    <Layout title="Analytics & Performance Reports">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">

        {/* ------------------------------------------------------------- */}
        {/* TOP HEADER & CONTROLS BAR                                     */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Laboratory Analytics & Performance
                </h1>
                <p className="text-xs text-slate-500">
                  Real-time intelligence on test volume, Turnaround Time (TAT), and category distribution
                </p>
              </div>
            </div>
          </div>

          {/* Refresh Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAnalytics(startDate, endDate)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all border border-slate-300/70 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* DATE RANGE FILTER TOOLBAR                                     */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Quick Preset Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                Range:
              </span>

              <button
                type="button"
                onClick={() => handleSelectPreset(PRESET_TODAY)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreset === PRESET_TODAY
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(PRESET_7_DAYS)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreset === PRESET_7_DAYS
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Last 7 Days
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset(PRESET_30_DAYS)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePreset === PRESET_30_DAYS
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Last 30 Days
              </button>
            </div>

            {/* Custom Date Form */}
            <form onSubmit={handleApplyCustomDates} className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">From:</span>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <span className="text-xs text-slate-500 font-medium">To:</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 active:scale-95 transition-all shadow-sm"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Active Range Summary Tag */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing metrics from <strong className="text-slate-800 font-mono">{startDate}</strong> to{' '}
              <strong className="text-slate-800 font-mono">{endDate}</strong>
            </span>
            <span className="text-slate-400 text-[11px]">All figures computed from live database</span>
          </div>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* KPI SUMMARY STAT CARDS (4 CARDS)                              */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1. Total Tests Ordered */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tests Ordered</p>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {loading ? '...' : analytics?.totalTestsInRange?.toLocaleString() || 0}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Diagnostic test units</p>
            </div>
          </div>

          {/* 2. Completed Tests */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved Reports</p>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {loading ? '...' : analytics?.completedTestsInRange?.toLocaleString() || 0}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Verified & certified</p>
            </div>
          </div>

          {/* 3. Pending In Pipeline */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Pipeline</p>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {loading ? '...' : analytics?.pendingTestsInRange?.toLocaleString() || 0}
              </h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Pending collection / analysis</p>
            </div>
          </div>

          {/* 4. Turnaround Time (TAT) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Average TAT</p>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
                {loading ? '...' : analytics?.formattedOverallTat || 'N/A'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Order to supervisor sign-off</p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MAIN VISUAL CHARTS GRID (2 COLUMNS)                           */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* CHART 1: Daily Diagnostic Test Volume (Bar Chart) — 2 Columns wide */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Daily Diagnostic Test Volume</h3>
                    <p className="text-xs text-slate-400">Total individual tests ordered per calendar day</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700">
                  Daily Demand
                </span>
              </div>

              {/* Chart Content Area */}
              <div className="h-72 w-full mt-4">
                {analytics?.dailyVolume && analytics.dailyVolume.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.dailyVolume}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e2e8f0' }}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderRadius: '0.75rem',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ color: '#93c5fd' }}
                        labelStyle={{ fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px' }}
                        formatter={(val) => [`${val} tests`, 'Volume']}
                      />
                      <Bar
                        dataKey="count"
                        name="Tests Ordered"
                        fill="#3B82F6"
                        radius={[6, 6, 0, 0]}
                        barSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                    <FlaskConical className="w-8 h-8 text-slate-300 mb-2" />
                    <span>No test volume recorded in this date range</span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-3 pt-3 border-t border-slate-100">
              💡 Tip: Click quick buttons above to compare day-by-day workload across previous weeks.
            </p>
          </div>

          {/* CHART 2: Tests by Category (Pie / Donut Chart) — 1 Column wide */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Tests by Category</h3>
                    <p className="text-xs text-slate-400">Department distribution</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">
                  Specialty Share
                </span>
              </div>

              {/* Donut Chart */}
              <div className="h-64 w-full flex items-center justify-center">
                {analytics?.byCategory && analytics.byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.byCategory}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {analytics.byCategory.map((entry, index) => (
                          <Cell
                            key={`slice-${index}`}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderRadius: '0.75rem',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(val, name) => [`${val} tests`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Layers className="w-8 h-8 text-slate-300 mb-2" />
                    <span>No category data available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Category Legend */}
            <div className="mt-2 pt-3 border-t border-slate-100 space-y-1.5">
              {analytics?.byCategory && analytics.byCategory.map((cat, idx) => (
                <div key={cat.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-slate-700 font-medium truncate max-w-[140px]">
                      {cat.category}
                    </span>
                  </div>
                  <span className="font-semibold text-slate-900 font-mono">
                    {cat.count} <span className="text-[10px] text-slate-400 font-normal">tests</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* CHART 3: TURNAROUND TIME (TAT) TREND (FULL WIDTH AREA CHART) */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Turnaround Time (TAT) Efficiency Trend
                </h3>
                <p className="text-xs text-slate-400">
                  Average duration (in minutes) from test registration to final Senior Lab Tech approval
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                <Clock className="w-3.5 h-3.5" />
                Overall Avg: <strong>{analytics?.formattedOverallTat || 'N/A'}</strong>
              </span>
            </div>
          </div>

          {/* Area Chart Content */}
          <div className="h-64 w-full mt-4">
            {analytics?.avgTatTrend && analytics.avgTatTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.avgTatTrend}
                  margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="tatGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    unit="m"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '0.75rem',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px' }}
                    formatter={(val, name, item) => [
                      `${val} mins (${item.payload.formattedTat})`,
                      'Average TAT'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgTatMinutes"
                    name="Average TAT"
                    stroke="#8B5CF6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#tatGradient)"
                    dot={{ fill: '#8B5CF6', r: 4 }}
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <Clock className="w-8 h-8 text-slate-300 mb-2" />
                <span>No approved results available in this date range to calculate turnaround time</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 gap-2">
            <span>
              ℹ️ Clinical standard: A lower Turnaround Time indicates faster diagnostics release to patients.
            </span>
            <span className="font-medium text-slate-500">
              Calculation: (Timestamp Verified - Timestamp Created)
            </span>
          </div>
        </div>

      </div>
    </Layout>
  );
}
