import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  StatCard,
  QuickActionCard,
  BarcodeInput,
  DataTable,
  Badge,
  Button,
  LoadingSpinner,
  ErrorAlert,
  EmptyState,
} from '../../components/ui';
import {
  FlaskConical,
  Users,
  Droplet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import resultService from '../../services/resultService';

/**
 * TechDashboardPage — Primary operational dashboard for Lab Technicians.
 *
 * Implements core technician workflows:
 * - High-speed barcode scanning to jump straight into Result Entry
 * - Quick-action navigation for reception & patient test ordering
 * - Live summary of active workbench samples (Draft, Submitted, Rejected)
 * - Traceable recent test queue with status badges and one-click reopening
 */
const TechDashboardPage = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Technician';

  // Worklist & recent results state
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick scanner error state
  const [scanError, setScanError] = useState(null);

  // Fetch technician's assigned & recently touched results
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await resultService.getMyResults();
      setMyResults(data || []);
    } catch (err) {
      console.error('Failed to load technician dashboard data:', err);
      setError(
        err.response?.data?.message ||
          'Failed to connect to the backend server. Please verify Spring Boot is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle Barcode Scan from the dashboard quick-box
  const handleQuickScan = (scannedCode) => {
    setScanError(null);
    if (!scannedCode || !scannedCode.trim()) {
      setScanError('Please enter or scan a valid container barcode or sample code.');
      return;
    }

    // Direct navigation to ResultEntryPage with code pre-filled
    navigate('/results/entry', {
      state: { prefillCode: scannedCode.trim() },
    });
  };

  // Calculate live worklist counts from results
  const draftCount = myResults.filter((r) => r.status === 'DRAFT').length;
  const submittedCount = myResults.filter((r) => r.status === 'SUBMITTED').length;
  const approvedCount = myResults.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = myResults.filter((r) => r.status === 'REJECTED').length;

  // Status badge color mapping
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="green">Approved</Badge>;
      case 'SUBMITTED':
        return <Badge variant="indigo">Under Review</Badge>;
      case 'REJECTED':
        return <Badge variant="red">Rejected (Needs Rework)</Badge>;
      case 'DRAFT':
        return <Badge variant="amber">Draft in Progress</Badge>;
      default:
        return <Badge variant="blue">{status || 'Pending'}</Badge>;
    }
  };

  // Table columns definition for Recent Results
  const columns = [
    {
      header: 'Test Sample Code',
      render: (row) => (
        <span className="font-mono font-bold text-blue-600 text-xs">
          {row.testSampleCode}
        </span>
      ),
    },
    {
      header: 'Patient',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900 text-xs">{row.patientName || 'Anonymous'}</p>
          <p className="text-[11px] text-gray-500">
            {row.patientSex || '-'} • {row.patientAgeYears ? `${row.patientAgeYears} yrs` : 'Age N/A'}
          </p>
        </div>
      ),
    },
    {
      header: 'Lab Test',
      render: (row) => (
        <div>
          <span className="font-medium text-gray-800 text-xs">{row.testName}</span>
          {row.testCategory && (
            <span className="block text-[10px] text-gray-400 uppercase tracking-wide">
              {row.testCategory}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => renderStatusBadge(row.status),
    },
    {
      header: 'Findings',
      render: (row) => {
        if (row.criticalCount > 0) {
          return (
            <Badge variant="red" className="animate-pulse">
              {row.criticalCount} Critical
            </Badge>
          );
        }
        if (row.abnormalCount > 0) {
          return <Badge variant="orange">{row.abnormalCount} Abnormal</Badge>;
        }
        return <span className="text-xs text-gray-400">Normal / In Progress</span>;
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          size="xs"
          rightIcon={<ArrowRight size={12} />}
          onClick={() =>
            navigate('/results/entry', {
              state: { prefillCode: row.testSampleCode },
            })
          }
        >
          Open Form
        </Button>
      ),
    },
  ];

  return (
    <Layout title="Technician Workbench">
      {/* ========================================================================= */}
      {/* 1. WELCOME BANNER                                                         */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 rounded-2xl shadow-sm mb-6 p-6 sm:p-8 text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2.5 text-blue-100">
              <FlaskConical size={14} />
              Lab Technician Workbench
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {username.split('@')[0]}
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
              Scan sample containers, enter analytical parameters, or issue patient lab slips for diagnostic orders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchDashboardData}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Refresh Queue
            </Button>
          </div>
        </div>

        {/* Decorative background visual circles */}
        <div className="absolute -right-16 -top-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-32 -bottom-20 w-56 h-56 bg-indigo-500/20 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {error && <ErrorAlert message={error} className="mb-6" onClose={() => setError(null)} />}

      {/* ========================================================================= */}
      {/* 2. STATS OVERVIEW CARDS                                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Draft Results"
          value={loading ? '...' : draftCount}
          icon={FileText}
          trend="Saved on bench"
          trendUp={true}
        />
        <StatCard
          title="Under Senior Review"
          value={loading ? '...' : submittedCount}
          icon={Clock}
          trend="Pending sign-off"
          trendUp={true}
        />
        <StatCard
          title="Approved Today"
          value={loading ? '...' : approvedCount}
          icon={CheckCircle2}
          trend="Released"
          trendUp={true}
        />
        <StatCard
          title="Requires Correction"
          value={loading ? '...' : rejectedCount}
          icon={AlertTriangle}
          trend={rejectedCount > 0 ? 'Needs attention' : 'All clear'}
          trendUp={rejectedCount === 0}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SECTION: QUICK SCAN + QUICK ACTIONS                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left: Quick Barcode Scanner Box */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Instant Access
              </span>
              <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Scanner Active
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Quick Container Scan</h3>
            <p className="text-xs text-gray-500 mb-4">
              Scan any specimen tube barcode or enter a Test Sample Code to open the result entry workbench immediately.
            </p>

            <BarcodeInput
              label="Barcode / Test Sample Code"
              hint="Supports container barcodes (e.g. TSC-00456-01-P1) and Test Sample Codes"
              onScan={handleQuickScan}
              error={scanError}
              prefix="TSC-"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Manual Keyboard Entry supported</span>
            <span className="font-mono text-gray-400">Press [Enter] to submit</span>
          </div>
        </div>

        {/* Right: Quick Action Cards */}
        <div className="lg:col-span-7 flex flex-col gap-3 justify-center">
          <QuickActionCard
            title="Patient Reception & Slip Issuance"
            description="Look up registered patients by phone number, create test orders, and print barcode collection slips."
            icon={Users}
            to="/reception"
            badge="Reception"
            color="blue"
          />

          <QuickActionCard
            title="Result Entry Workbench"
            description="Record quantitative and discrete qualitative test values with automatic sex-matched reference range validation."
            icon={FlaskConical}
            to="/results/entry"
            badge="Workbench"
            color="teal"
          />

          <QuickActionCard
            title="Design System & Component Playground"
            description="Inspect all validated UI components, status indicators, and modal behaviors in the shared laboratory library."
            icon={ShieldCheck}
            to="/components"
            badge="Library"
            color="indigo"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MY RECENT WORK QUEUE TABLE                                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">My Recent Workbench Tests</h3>
            <p className="text-xs text-gray-500">
              Overview of results you have worked on, submitted, or need to correct.
            </p>
          </div>
          <span className="text-xs text-gray-400">
            Showing {myResults.length} test result records
          </span>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading your recent workbench queue..." />
          </div>
        ) : myResults.length === 0 ? (
          <EmptyState
            title="No tests recorded yet"
            description="You have not entered any test results yet. Scan a container barcode above or open the Result Entry workbench to begin."
            actionText="Go to Result Entry"
            onAction={() => navigate('/results/entry')}
          />
        ) : (
          <DataTable
            columns={columns}
            data={myResults}
            pagination={true}
            pageSize={5}
          />
        )}
      </div>
    </Layout>
  );
};

export default TechDashboardPage;
