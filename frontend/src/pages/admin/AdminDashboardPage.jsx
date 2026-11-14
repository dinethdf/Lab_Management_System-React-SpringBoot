import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  StatCard,
  Badge,
  Button,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
} from '../../components/ui';
import { WelcomeBanner } from '../../components/WelcomeBanner';
import {
  Users,
  FlaskConical,
  FileText,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Barcode,
  ShieldCheck,
  Activity,
  Layers,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import dashboardService from '../../services/dashboardService';

/**
 * AdminDashboardPage — Command center for Laboratory Administrators.
 *
 * Fully integrated with real Spring Boot + MySQL metrics:
 * - Dynamic Welcome Banner showing logged-in user and today's activity
 * - 4 Real-time Stat Cards (Total Patients, Active Staff, Catalog Tests, Total Orders)
 * - Recent Laboratory Orders activity feed with status badges
 * - Lab Orders Lifecycle Pipeline (Pending, In Progress, Review, Completed)
 * - Direct quick-action shortcuts for administrators
 */
const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Administrator';

  // State
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real-time statistics from backend API
  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin dashboard stats:', err);
      setError(
        err.response?.data?.message ||
          'Failed to connect to the backend server. Please verify Spring Boot is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Helper for order status badge styling
  const renderStatusBadge = (status) => {
    const s = (status || 'PENDING').toUpperCase();
    switch (s) {
      case 'COMPLETED':
      case 'REPORTED':
        return <Badge variant="green">{s}</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="blue">IN PROGRESS</Badge>;
      case 'COLLECTED':
        return <Badge variant="indigo">COLLECTED</Badge>;
      default:
        return <Badge variant="amber">{s}</Badge>;
    }
  };

  // Banner stats based on real counts
  const bannerStats = stats
    ? [
        {
          label: 'New Patients Today',
          value: String(stats.todayPatients || 0),
          icon: Users,
          colorClass: 'bg-blue-100 text-blue-600',
        },
        {
          label: 'Orders Placed Today',
          value: String(stats.todayOrders || 0),
          icon: FlaskConical,
          colorClass: 'bg-emerald-100 text-emerald-600',
        },
      ]
    : null;

  return (
    <Layout title="Administrator Dashboard">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        
        {/* ========================================================================= */}
        {/* 1. DYNAMIC WELCOME BANNER                                                 */}
        {/* ========================================================================= */}
        <WelcomeBanner
          title={`Welcome back, ${username.split('@')[0]}`}
          subtitle={
            stats
              ? `${stats.todayOrders} order(s) placed today. ${stats.pendingReviewCount || 0} result(s) currently awaiting supervisor sign-off.`
              : 'Hospital Laboratory Operations Overview'
          }
          stats={bannerStats}
        />

        {/* Global Error Banner with Retry */}
        {error && (
          <ErrorAlert
            title="Backend Connection Notice"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* ========================================================================= */}
        {/* 2. REAL-TIME STAT CARDS (4 CORE LAB METRICS)                              */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="Total Patients"
            value={loading ? '...' : (stats?.totalPatients ?? 0)}
            icon={Users}
            trend={stats?.todayPatients > 0 ? `+${stats.todayPatients} new today` : 'Registered'}
            trendUp={true}
          />
          <StatCard
            title="Active Staff Users"
            value={loading ? '...' : (stats?.totalStaff ?? 0)}
            icon={ShieldCheck}
            trend="Active Accounts"
            trendUp={true}
          />
          <StatCard
            title="Tests in Catalog"
            value={loading ? '...' : (stats?.totalTestsInCatalog ?? 0)}
            icon={FlaskConical}
            trend="Active Profiles"
            trendUp={true}
          />
          <StatCard
            title="Total Lab Orders"
            value={loading ? '...' : (stats?.totalOrders ?? 0)}
            icon={FileText}
            trend={stats?.todayOrders > 0 ? `+${stats.todayOrders} placed today` : 'Total Recorded'}
            trendUp={true}
          />
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN DASHBOARD CONTENT: RECENT ORDERS + WORKLOAD PIPELINE              */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Side (7 Cols): Recent Laboratory Orders Activity Feed */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Recent Diagnostic Orders</h2>
                    <p className="text-[11px] text-gray-400">Live feed of latest patient orders created</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="xs"
                    leftIcon={<RefreshCw size={12} className={loading ? 'animate-spin' : ''} />}
                    onClick={fetchDashboardStats}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="primary"
                    size="xs"
                    rightIcon={<ArrowRight size={12} />}
                    onClick={() => navigate('/reception')}
                  >
                    Reception Desk
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 flex justify-center">
                  <LoadingSpinner message="Loading live operational metrics..." />
                </div>
              ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
                <EmptyState
                  title="No orders placed yet"
                  description="When patients register and request diagnostic tests, their orders will appear here automatically."
                  actionText="Go to Reception Desk"
                  onAction={() => navigate('/reception')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Slip Barcode</th>
                        <th className="py-2.5 px-3">Patient</th>
                        <th className="py-2.5 px-3">Tests</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-800">
                      {stats.recentOrders.map((ord) => {
                        const formattedDate = ord.createdAt
                          ? new Date(ord.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'N/A';

                        return (
                          <tr key={ord.orderId} className="hover:bg-gray-50/80 transition-colors">
                            <td className="py-3 px-3 whitespace-nowrap text-gray-500 font-medium">
                              {formattedDate}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 font-mono font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                <Barcode size={11} className="text-gray-500" />
                                {ord.labSlipBarcode}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-gray-900 leading-tight">{ord.patientName}</p>
                              {ord.patientContact && (
                                <p className="text-[10px] text-gray-400">{ord.patientContact}</p>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1 max-w-[160px]">
                                {ord.testNames?.map((testName, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium truncate max-w-[150px]"
                                    title={testName}
                                  >
                                    {testName}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {renderStatusBadge(ord.status)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>Displaying 5 most recent orders from database</span>
              <span className="font-mono">Live API sync</span>
            </div>
          </div>

          {/* Right Side (5 Cols): Orders Lifecycle Pipeline & Quick Shortcuts */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Pipeline Breakdown Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Lab Orders Pipeline</h3>
                  <p className="text-[11px] text-gray-400">Real-time status distribution</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
                    Pending Collection
                  </span>
                  <span className="text-2xl font-extrabold text-amber-900 mt-1">
                    {loading ? '...' : (stats?.pendingOrdersCount ?? 0)}
                  </span>
                  <span className="text-[10px] text-amber-600 mt-0.5">Awaiting phlebotomy</span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                    In Progress
                  </span>
                  <span className="text-2xl font-extrabold text-blue-900 mt-1">
                    {loading ? '...' : (stats?.inProgressOrdersCount ?? 0)}
                  </span>
                  <span className="text-[10px] text-blue-600 mt-0.5">At testing benches</span>
                </div>

                <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">
                    Pending Review
                  </span>
                  <span className="text-2xl font-extrabold text-purple-900 mt-1">
                    {loading ? '...' : (stats?.pendingReviewCount ?? 0)}
                  </span>
                  <span className="text-[10px] text-purple-600 mt-0.5">Awaiting senior sign-off</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                    Completed
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-900 mt-1">
                    {loading ? '...' : (stats?.completedOrdersCount ?? 0)}
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5">Released reports</span>
                </div>
              </div>
            </div>

            {/* Quick Management Shortcuts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Administrator Shortcuts</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start text-xs font-semibold"
                  leftIcon={<Users size={15} className="text-blue-600" />}
                  onClick={() => navigate('/admin/users')}
                >
                  Staff Management
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start text-xs font-semibold"
                  leftIcon={<FlaskConical size={15} className="text-purple-600" />}
                  onClick={() => navigate('/tests')}
                >
                  Test Catalog
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start text-xs font-semibold"
                  leftIcon={<UserPlus size={15} className="text-teal-600" />}
                  onClick={() => navigate('/reception')}
                >
                  Reception Desk
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="justify-start text-xs font-semibold"
                  leftIcon={<CheckCircle2 size={15} className="text-indigo-600" />}
                  onClick={() => navigate('/verification-queue')}
                >
                  Verification Queue
                </Button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
};

export default AdminDashboardPage;
