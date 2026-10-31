import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import {
  DataTable,
  Badge,
  PageHeader,
  EmptyState,
  Button,
  Modal,
  ConfirmDialog,
  FormTextarea,
  PatientInfoCard,
  useToast,
} from '../../components/ui';
import { CheckCircle2, XCircle, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';
import resultService from '../../services/resultService';

/**
 * VerificationQueuePage — Senior Lab Technician verification queue.
 * Allows reviewing submitted test results, inspecting server-calculated abnormal
 * and critical flags, and approving or rejecting with a required explanation reason.
 * Enforces Decision D3: Senior Lab Techs cannot self-verify results they entered.
 */
const VerificationQueuePage = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [reviewFormDetail, setReviewFormDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reject dialog
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const currentUsername = localStorage.getItem('username');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await resultService.getPendingVerification();
      setQueue(data || []);
    } catch (err) {
      console.error('Failed to load verification queue:', err);
      showError(err.response?.data?.message || 'Failed to load pending results.', 'Queue Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const openReviewModal = async (row) => {
    setSelectedResult(row);
    setReviewModalOpen(true);
    setDetailLoading(true);

    try {
      const detail = await resultService.getResultFormByCode(row.testSampleCode);
      setReviewFormDetail(detail);
    } catch (err) {
      console.error('Failed to load result detail:', err);
      showError('Failed to fetch detailed parameters for this result.', 'Detail Error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedResult) return;
    setActionLoading(true);
    try {
      await resultService.approveResult(selectedResult.id);
      showSuccess(`Result for ${selectedResult.testName} (${selectedResult.testSampleCode}) approved and released!`, 'Approved');
      setReviewModalOpen(false);
      fetchQueue();
    } catch (err) {
      console.error('Approve error:', err);
      showError(err.response?.data?.message || 'Failed to approve result.', 'Approval Error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      showError('A rejection reason is required.', 'Validation Error');
      return;
    }
    setActionLoading(true);
    try {
      await resultService.rejectResult(selectedResult.id, rejectionReason.trim());
      showWarning(`Result rejected and returned to technician for corrections.`, 'Result Rejected');
      setRejectModalOpen(false);
      setReviewModalOpen(false);
      setRejectionReason('');
      fetchQueue();
    } catch (err) {
      console.error('Reject error:', err);
      showError(err.response?.data?.message || 'Failed to reject result.', 'Rejection Error');
    } finally {
      setActionLoading(false);
    }
  };

  // Self-verification check (D3)
  const isSelfEntered = selectedResult && currentUsername && (
    selectedResult.enteredByUsername?.toLowerCase() === currentUsername.toLowerCase()
  );

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
      header: 'Test Name',
      accessor: 'testName',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{row.testName}</span>
          <span className="text-[11px] text-gray-400">{row.testCategory}</span>
        </div>
      ),
    },
    {
      header: 'Patient',
      accessor: 'patientName',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-800">{row.patientName}</span>
          <span className="text-[11px] text-gray-400">
            {row.patientAgeYears}y • {row.patientSex}
          </span>
        </div>
      ),
    },
    {
      header: 'Submitted By',
      accessor: 'enteredByUsername',
      cell: (row) => <span className="text-xs text-gray-600">{row.enteredByUsername}</span>,
    },
    {
      header: 'Submitted At',
      accessor: 'submittedAt',
      cell: (row) => (
        <span className="text-xs text-gray-500">
          {row.submittedAt ? new Date(row.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
        </span>
      ),
    },
    {
      header: 'Flags',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.criticalCount > 0 && (
            <Badge variant="red">{row.criticalCount} Critical</Badge>
          )}
          {row.abnormalCount > 0 && (
            <Badge variant="amber">{row.abnormalCount} Abnormal</Badge>
          )}
          {row.criticalCount === 0 && row.abnormalCount === 0 && (
            <Badge variant="green">Normal</Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      cell: (row) => (
        <Button variant="primary" size="xs" onClick={() => openReviewModal(row)}>
          Review & Verify
        </Button>
      ),
    },
  ];

  return (
    <Layout title="Verification Queue">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Diagnostic Verification Queue"
          subtitle="Senior Lab Technician verification workbench for submitted test results."
          tabs={[{ label: 'Pending Verification', value: 'pending', count: queue.length }]}
          activeTab="pending"
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchQueue}
              disabled={loading}
              leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
            >
              Refresh Queue
            </Button>
          }
        />

        <DataTable
          columns={columns}
          data={queue}
          loading={loading}
          emptyState={
            <EmptyState
              title="Verification Queue Empty"
              description="There are currently no submitted test results pending senior verification."
              icon={<CheckCircle2 size={24} className="text-green-500" />}
            />
          }
        />

        {/* ========================================================================= */}
        {/* REVIEW & VERIFY RESULT MODAL */}
        {/* ========================================================================= */}
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={`Verify Results: ${selectedResult?.testName || ''} (${selectedResult?.testSampleCode || ''})`}
          size="xl"
        >
          {detailLoading || !reviewFormDetail ? (
            <p className="text-xs text-gray-500 py-8 text-center">Loading result details...</p>
          ) : (
            <div className="flex flex-col gap-5 text-xs">
              {/* Decision D3 Self-Verification Block Warning */}
              {isSelfEntered && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-2.5">
                  <ShieldAlert size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Self-Verification Block (Decision D3)</h5>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      You entered this result yourself. System clinical safety rules prohibit approving or rejecting results you entered personally. Another Senior Lab Technician must verify this entry.
                    </p>
                  </div>
                </div>
              )}

              {/* Patient and Test Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PatientInfoCard
                  id={`P-${String(reviewFormDetail.patientId).padStart(4, '0')}`}
                  name={reviewFormDetail.patientName}
                  age={reviewFormDetail.patientAgeYears}
                  gender={reviewFormDetail.patientSex}
                  contactNumber={reviewFormDetail.patientContact}
                />

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold text-gray-800">Submission Details</span>
                    <Badge variant="blue">SUBMITTED</Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-gray-600">
                    <div><span className="font-semibold text-gray-700">Technician:</span> {selectedResult?.enteredByUsername}</div>
                    <div>
                      <span className="font-semibold text-gray-700">Submitted At:</span>{' '}
                      {selectedResult?.submittedAt ? new Date(selectedResult.submittedAt).toLocaleString() : '-'}
                    </div>
                    {reviewFormDetail.notes && (
                      <div className="mt-1 p-2 bg-white rounded border border-gray-200">
                        <span className="font-semibold text-gray-700">Tech Remarks:</span> {reviewFormDetail.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Parameters Breakdown */}
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-gray-800 text-sm">Entered Parameters & Reference Ranges</h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 text-[11px]">
                      <tr>
                        <th className="p-2.5">Parameter</th>
                        <th className="p-2.5">Result Type</th>
                        <th className="p-2.5">Recorded Value</th>
                        <th className="p-2.5">Reference Range</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reviewFormDetail.parameters?.map((p) => {
                        const valDisplay =
                          p.resultType === 'NUMBER'
                            ? p.currentNumericValue !== null && p.currentNumericValue !== undefined
                              ? `${p.currentNumericValue} ${p.unit || ''}`
                              : '-'
                            : p.resultType === 'CHOICE'
                            ? p.currentChoiceValue || '-'
                            : p.currentTextValue || '-';

                        return (
                          <tr
                            key={p.parameterId}
                            className={
                              p.isCritical
                                ? 'bg-red-50/70'
                                : p.isAbnormal
                                ? 'bg-amber-50/60'
                                : 'bg-white'
                            }
                          >
                            <td className="p-2.5 font-semibold text-gray-900">{p.parameterName}</td>
                            <td className="p-2.5 text-gray-500 font-mono text-[11px]">{p.resultType}</td>
                            <td className="p-2.5 font-bold text-gray-800 text-sm">{valDisplay}</td>
                            <td className="p-2.5 text-gray-600">
                              {p.resultType === 'NUMBER' ? (
                                p.refLower !== null || p.refUpper !== null ? (
                                  <span>
                                    {p.refLower ?? '-'} to {p.refUpper ?? '-'} {p.unit || ''}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">No range</span>
                                )
                              ) : p.resultType === 'CHOICE' ? (
                                <span className="text-gray-400">Options list</span>
                              ) : (
                                <span className="text-gray-400">Descriptive</span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {p.isCritical && <Badge variant="red">CRITICAL</Badge>}
                              {p.isAbnormal && !p.isCritical && <Badge variant="amber">ABNORMAL</Badge>}
                              {!p.isAbnormal && !p.isCritical && <Badge variant="green">NORMAL</Badge>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setReviewModalOpen(false)}
                >
                  Close
                </Button>

                <div className="flex items-center gap-3">
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isSelfEntered || actionLoading}
                    onClick={() => setRejectModalOpen(true)}
                    leftIcon={<XCircle size={15} />}
                  >
                    Reject with Reason
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSelfEntered || actionLoading}
                    loading={actionLoading}
                    onClick={handleApprove}
                    leftIcon={<CheckCircle2 size={15} />}
                  >
                    Approve & Release Result
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================================= */}
        {/* REJECT MODAL (WITH MANDATORY REASON) */}
        {/* ========================================================================= */}
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Reject Test Result"
          size="md"
        >
          <div className="flex flex-col gap-4 text-xs">
            <p className="text-gray-600">
              Please enter the clinical or technical reason for rejection. This reason will be returned to the Lab Technician so they can correct and resubmit.
            </p>

            <FormTextarea
              label="Rejection Reason"
              placeholder="e.g. Hemolysis detected; Hemoglobin value inconsistent with RBC count, please verify."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              rows={3}
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!rejectionReason.trim() || actionLoading}
                loading={actionLoading}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default VerificationQueuePage;
