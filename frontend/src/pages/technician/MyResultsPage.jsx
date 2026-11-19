import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  PageHeader,
  DataTable,
  Badge,
  Button,
  EmptyState,
  useToast,
} from '../../components/ui';
import {
  FileText,
  RefreshCw,
  Download,
  ExternalLink,
  Edit,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Copy,
} from 'lucide-react';
import resultService from '../../services/resultService';
import reportService from '../../services/reportService';

/**
 * MyResultsPage — Technician workbench to track their submitted diagnostic results.
 * Allows technicians to:
 * 1. View all results entered by their account (Draft, Submitted, Approved, Rejected).
 * 2. Filter by status (All, Draft, Submitted, Approved, Rejected).
 * 3. Inspect Senior Lab Tech rejection reasons and resume editing with 1-click.
 * 4. View and download official PDF reports for approved results.
 */
const MyResultsPage = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch results entered by current user
  const fetchMyResults = async () => {
    setLoading(true);
    try {
      const data = await resultService.getMyResults();
      setResults(data || []);
    } catch (err) {
      console.error('Failed to load my results:', err);
      showError(err.response?.data?.message || 'Failed to load your test results.', 'Fetch Error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPatientLink = async (row) => {
    try {
      const reports = await reportService.lookupReportsByBarcode(row.testSampleCode);
      if (reports && reports.length > 0) {
        const rep = reports[0];
        const link = rep.shareLink || `${window.location.origin}/report/${rep.shareToken}`;
        navigator.clipboard.writeText(link);
        showSuccess('Patient web report link copied to clipboard! You can share this with the patient.', 'Link Copied');
      } else {
        showWarning('Could not resolve report link for this sample code.', 'Notice');
      }
    } catch (err) {
      showError('Failed to copy patient link.', 'Error');
    }
  };

  useEffect(() => {
    fetchMyResults();
  }, []);

  // Filter results by status tab and search term
  const filteredResults = results.filter((item) => {
    const matchesTab = activeTab === 'ALL' || item.status === activeTab;
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesTab;

    const matchesSearch =
      (item.testSampleCode && item.testSampleCode.toLowerCase().includes(query)) ||
      (item.testName && item.testName.toLowerCase().includes(query)) ||
      (item.patientName && item.patientName.toLowerCase().includes(query));

    return matchesTab && matchesSearch;
  });

  // Calculate status counts for tab badges
  const draftCount = results.filter((r) => r.status === 'DRAFT').length;
  const submittedCount = results.filter((r) => r.status === 'SUBMITTED').length;
  const approvedCount = results.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = results.filter((r) => r.status === 'REJECTED').length;

  // Navigate to Result Entry page and auto-load the test
  const handleResumeEntry = (testSampleCode) => {
    navigate('/results/entry', { state: { prefillCode: testSampleCode } });
  };

  // Status badge styling helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="green">APPROVED</Badge>;
      case 'SUBMITTED':
        return <Badge variant="blue">SUBMITTED</Badge>;
      case 'REJECTED':
        return <Badge variant="red">REJECTED</Badge>;
      case 'DRAFT':
      default:
        return <Badge variant="amber">DRAFT</Badge>;
    }
  };

  // Table columns definition
  const columns = [
    {
      header: 'Sample Code',
      accessor: 'testSampleCode',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">
          {row.testSampleCode}
        </span>
      ),
    },
    {
      header: 'Test Investigation',
      accessor: 'testName',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.testName}</span>
          <span className="text-[11px] text-gray-400">{row.testCategory}</span>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      accessor: 'patientName',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{row.patientName}</span>
          <span className="text-[11px] text-gray-400">
            {row.patientAgeYears ? `${row.patientAgeYears}y` : ''} • {row.patientSex || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <div className="flex flex-col gap-1 items-start">
          {renderStatusBadge(row.status)}
          {row.rejectionReason && row.status === 'REJECTED' && (
            <span
              className="text-[11px] text-red-600 font-medium line-clamp-1 max-w-[180px]"
              title={`Rejection Reason: ${row.rejectionReason}`}
            >
              Reason: {row.rejectionReason}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Clinical Flags',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.criticalCount > 0 && <Badge variant="red">{row.criticalCount} Critical</Badge>}
          {row.abnormalCount > 0 && <Badge variant="amber">{row.abnormalCount} Abnormal</Badge>}
          {row.criticalCount === 0 && row.abnormalCount === 0 && <Badge variant="green">Normal</Badge>}
        </div>
      ),
    },
    {
      header: 'Submitted / Verified',
      accessor: 'submittedAt',
      cell: (row) => (
        <div className="flex flex-col text-xs text-gray-500">
          <span>{row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '-'}</span>
          <span className="text-[11px] text-gray-400">
            {row.submittedAt ? new Date(row.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {/* For Drafts or Rejected: Allow technician to resume editing */}
          {(row.status === 'DRAFT' || row.status === 'REJECTED') && (
            <Button
              variant={row.status === 'REJECTED' ? 'danger' : 'secondary'}
              size="xs"
              leftIcon={<Edit size={13} />}
              onClick={() => handleResumeEntry(row.testSampleCode)}
              title={row.status === 'REJECTED' ? 'Correct and resubmit result' : 'Continue editing draft'}
            >
              {row.status === 'REJECTED' ? 'Correct & Resubmit' : 'Resume Entry'}
            </Button>
          )}

          {/* For Submitted: Waiting on senior tech */}
          {row.status === 'SUBMITTED' && (
            <span className="text-xs text-gray-400 italic flex items-center gap-1">
              <Clock size={12} /> Under Review
            </span>
          )}

          {/* For Approved: Allow viewing & downloading report PDF */}
          {row.status === 'APPROVED' && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="xs"
                leftIcon={<ExternalLink size={13} />}
                onClick={() => reportService.openReportPdfInNewTab(row.id)}
                title="View Official Diagnostic PDF"
              >
                View
              </Button>
              <Button
                variant="ghost"
                size="xs"
                leftIcon={<Copy size={13} />}
                onClick={() => handleCopyPatientLink(row)}
                title="Copy Patient Web Link"
              >
                Copy Link
              </Button>
              <Button
                variant="primary"
                size="xs"
                leftIcon={<Download size={13} />}
                onClick={() => reportService.downloadReportPdfByResultId(row.id, `report-${row.testSampleCode}.pdf`)}
                title="Download PDF"
              >
                Download
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout title="My Results">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <PageHeader
          title="My Entered Results"
          subtitle="Track the verification status, supervisor feedback, and official reports for your recorded test results."
          tabs={[
            { label: 'All', value: 'ALL', count: results.length },
            { label: 'Drafts', value: 'DRAFT', count: draftCount },
            { label: 'Under Review', value: 'SUBMITTED', count: submittedCount },
            { label: 'Approved', value: 'APPROVED', count: approvedCount },
            { label: 'Rejected', value: 'REJECTED', count: rejectedCount },
          ]}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchMyResults}
              disabled={loading}
              leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            >
              Refresh
            </Button>
          }
        />

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 flex items-center gap-3">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by test sample code (e.g. TSC-00001-01), test name, or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm outline-none text-gray-800 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Rejection Alert Banner if any rejected items exist */}
        {rejectedCount > 0 && activeTab === 'ALL' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-bold text-sm">You have {rejectedCount} rejected result(s) requiring correction</h4>
              <p className="text-xs text-red-700 mt-0.5">
                Senior Lab Technicians have requested corrections on some of your submitted tests. Switch to the <strong>Rejected</strong> tab to review their feedback and resubmit.
              </p>
            </div>
            <Button
              variant="danger"
              size="xs"
              onClick={() => setActiveTab('REJECTED')}
            >
              View Rejected ({rejectedCount})
            </Button>
          </div>
        )}

        {/* Results Data Table */}
        <DataTable
          columns={columns}
          data={filteredResults}
          loading={loading}
          emptyState={
            <EmptyState
              title={
                activeTab === 'ALL'
                  ? 'No Results Recorded Yet'
                  : `No ${activeTab} Results Found`
              }
              description={
                activeTab === 'ALL'
                  ? 'You have not entered any test results yet. Scan a container barcode in Result Entry to get started.'
                  : `There are currently no results matching the ${activeTab.toLowerCase()} status.`
              }
              icon={<FileText size={24} className="text-gray-400" />}
              action={
                activeTab === 'ALL' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/results/entry')}
                  >
                    Go to Result Entry
                  </Button>
                ) : null
              }
            />
          }
        />
      </div>
    </Layout>
  );
};

export default MyResultsPage;
