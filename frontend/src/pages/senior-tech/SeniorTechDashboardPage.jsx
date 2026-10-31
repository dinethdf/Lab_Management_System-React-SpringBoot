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
  CheckCircle2,
  AlertTriangle,
  FlaskConical,
  Users,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowRight,
  ClipboardCheck,
  AlertOctagon,
} from 'lucide-react';
import resultService from '../../services/resultService';

/**
 * SeniorTechDashboardPage — Command center for Senior Lab Technicians.
 *
 * Implements verification-first workflows:
 * - Direct visibility into pending results waiting for supervisor verification
 * - Immediate highlighting of abnormal & critical panic thresholds
 * - Shortcuts to verification queue, bench result recording, and patient reception
 * - Fast-lookup barcode scanner for specimen review
 */
const SeniorTechDashboardPage = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Senior Technician';

  // Queue and dashboard data
  const [pendingQueue, setPendingQueue] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick scanner error state
  const [scanError, setScanError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pendingData, myResultsData] = await Promise.all([
        resultService.getPendingVerification(),
        resultService.getMyResults(),
      ]);
      setPendingQueue(pendingData || []);
      setMyResults(myResultsData || []);
    } catch (err) {
      console.error('Failed to load senior technician dashboard data:', err);
      setError(
        err.response?.data?.message ||
          'Failed to load verification queue. Please verify backend service availability.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Quick Scan handler: Jump directly to Result Entry / Review
  const handleQuickScan = (scannedCode) => {
    setScanError(null);
    if (!scannedCode || !scannedCode.trim()) {
      setScanError('Please enter or scan a valid container barcode or sample code.');
      return;
    }

    navigate('/results/entry', {
      state: { prefillCode: scannedCode.trim() },
    });
  };

  // Metrics
  const pendingCount = pendingQueue.length;
  const criticalCount = pendingQueue.reduce((acc, r) => acc + (r.criticalCount || 0), 0);
  const approvedCount = myResults.filter((r) => r.status === 'APPROVED').length;
  const myDraftCount = myResults.filter((r) => r.status === 'DRAFT').length;

  // Columns for Pending Verification spotlight table
  const columns = [
    {
      header: 'Sample Code',
      render: (row) => (
        <span className="font-mono font-bold text-indigo-600 text-xs">
          {row.testSampleCode}
        </span>
      ),
    },
    {
      header: 'Patient Details',
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
      header: 'Test Name',
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
      header: 'Submitted By',
      render: (row) => (
        <span className="text-xs text-gray-600 font-medium">
          {row.enteredByUsername || 'Technician'}
        </span>
      ),
    },
    {
      header: 'Findings Flag',
      render: (row) => {
        if (row.criticalCount > 0) {
          return (
            <Badge variant="red" className="animate-pulse flex items-center gap-1">
              <AlertOctagon size={12} />
              {row.criticalCount} Critical
            </Badge>
          );
        }
        if (row.abnormalCount > 0) {
          return <Badge variant="orange">{row.abnormalCount} Abnormal</Badge>;
        }
        return <Badge variant="green">Within Normal Bounds</Badge>;
      },
    },
    {
      header: 'Action',
      render: (row) => (
        <Button
          variant="primary"
          size="xs"
          rightIcon={<ArrowRight size={12} />}
          onClick={() => navigate('/verification-queue')}
        >
          Verify in Queue
        </Button>
      ),
    },
  ];

  return (
    <Layout title="Senior Technician Dashboard">
      {/* ========================================================================= */}
      {/* 1. WELCOME BANNER                                                         */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-800 via-indigo-700 to-indigo-900 rounded-2xl shadow-sm mb-6 p-6 sm:p-8 text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2.5 text-purple-200">
              <ShieldCheck size={14} />
              Senior Lab Technician Command
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {username.split('@')[0]}
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm mt-1 max-w-xl">
              You have {pendingCount} laboratory test {pendingCount === 1 ? 'result' : 'results'} awaiting supervisory verification and release.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ClipboardCheck size={15} />}
              onClick={() => navigate('/verification-queue')}
              className="bg-white text-indigo-900 hover:bg-gray-100 font-bold border-none shadow-md"
            >
              Open Verification Queue ({pendingCount})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchDashboardData}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -right-20 -top-24 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-purple-500/20 rounded-full blur-xl pointer-events-none"></div>
      </div>

      {error && <ErrorAlert message={error} className="mb-6" onClose={() => setError(null)} />}

      {/* ========================================================================= */}
      {/* 2. STATS OVERVIEW CARDS                                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Pending Verification"
          value={loading ? '...' : pendingCount}
          icon={Clock}
          trend={pendingCount > 0 ? 'Requires sign-off' : 'Queue empty'}
          trendUp={pendingCount === 0}
        />
        <StatCard
          title="Critical Findings"
          value={loading ? '...' : criticalCount}
          icon={AlertTriangle}
          trend={criticalCount > 0 ? 'Immediate attention' : 'Zero criticals'}
          trendUp={criticalCount === 0}
        />
        <StatCard
          title="Approved by Me"
          value={loading ? '...' : approvedCount}
          icon={CheckCircle2}
          trend="Released"
          trendUp={true}
        />
        <StatCard
          title="My Bench Drafts"
          value={loading ? '...' : myDraftCount}
          icon={FlaskConical}
          trend="In Progress"
          trendUp={true}
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
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Specimen Review
              </span>
              <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Scanner Active
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Quick Container Lookup</h3>
            <p className="text-xs text-gray-500 mb-4">
              Scan a tube barcode to instantly review test measurements, verify parameter flags, or record revisions.
            </p>

            <BarcodeInput
              label="Barcode / Test Sample Code"
              hint="Enter container code (e.g. TSC-00456-01-P1) to inspect"
              onScan={handleQuickScan}
              error={scanError}
              prefix="TSC-"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Barcode scanner or manual entry</span>
            <span className="font-mono text-gray-400">Press [Enter] to submit</span>
          </div>
        </div>

        {/* Right: Quick Action Cards */}
        <div className="lg:col-span-7 flex flex-col gap-3 justify-center">
          <QuickActionCard
            title="Verification & Release Queue"
            description="Examine submitted results, inspect sex-matched reference limits, and approve or reject tests with required reasoning."
            icon={ClipboardCheck}
            to="/verification-queue"
            badge={`${pendingCount} Pending`}
            color="indigo"
          />

          <QuickActionCard
            title="Result Entry Workbench"
            description="Enter raw parameters, check automatic abnormality flags, and save drafts for any active order."
            icon={FlaskConical}
            to="/results/entry"
            badge="Bench"
            color="teal"
          />

          <QuickActionCard
            title="Patient Reception & Slip Issuance"
            description="Register new patients, look up patient histories, and configure test orders with barcode slips."
            icon={Users}
            to="/reception"
            badge="Reception"
            color="blue"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PENDING VERIFICATION QUEUE SPOTLIGHT TABLE                             */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Awaiting Supervisory Sign-off</h3>
            <p className="text-xs text-gray-500">
              Results submitted by laboratory technicians requiring senior verification before release.
            </p>
          </div>
          <Button
            variant="secondary"
            size="xs"
            rightIcon={<ArrowRight size={13} />}
            onClick={() => navigate('/verification-queue')}
          >
            Go to Full Queue ({pendingQueue.length})
          </Button>
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Loading pending verification queue..." />
          </div>
        ) : pendingQueue.length === 0 ? (
          <EmptyState
            title="Verification queue is all clear"
            description="There are currently no submitted test results pending supervisory review. All reports have been processed."
            actionText="Go to Result Entry"
            onAction={() => navigate('/results/entry')}
          />
        ) : (
          <DataTable
            columns={columns}
            data={pendingQueue}
            pagination={true}
            pageSize={5}
          />
        )}
      </div>
    </Layout>
  );
};

export default SeniorTechDashboardPage;
