import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  PageHeader,
  BarcodeInput,
  Button,
  Badge,
  Modal,
  LoadingSpinner,
  SampleStatusBadge,
  useToast,
} from '../../components/ui';
import {
  Droplet,
  FlaskConical,
  Search,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Tag,
  RefreshCw,
  Lock,
  Layers,
  Check,
} from 'lucide-react';
import collectionService from '../../services/collectionService';

/**
 * SampleCollectionPage — Phlebotomy workstation for specimen collection and sticker set allocation.
 *
 * Workflow:
 * 1. Technician scans patient Lab Slip barcode (e.g. LS-2026-00001) or selects from the pending queue.
 * 2. For each test (e.g. FBC), technician enters the 4-digit sticker set code (e.g. 0001) from their physical sticker sheet.
 * 3. System automatically matches and generates all container codes (e.g. FBC-0001-P1, FBC-0001-P2, FBC-0001-U1).
 * 4. Technician scans each tube code or clicks "Collect Sample" to mark it COLLECTED.
 * 5. Future-day scheduled tubes (Day 1+) remain locked against early collection until their due date.
 */
const SampleCollectionPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError, showWarning } = useToast();

  // Search and Order State
  const [searchSlipBarcode, setSearchSlipBarcode] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Queue of recent pending orders awaiting collection
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Set Code Allocation States: { [orderTestId]: setCodeInput }
  const [setInputs, setSetInputs] = useState({});
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Barcode Scanning for individual collection
  const [scanTubeCode, setScanTubeCode] = useState('');
  const [scanningLoading, setScanningLoading] = useState(false);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTargetContainer, setRejectTargetContainer] = useState(null);
  const [rejectReasonCategory, setRejectReasonCategory] = useState('Gross Hemolysis');
  const [rejectCustomNotes, setRejectCustomNotes] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Bulk Receiving State
  const [receivingContainerId, setReceivingContainerId] = useState(null);
  const [bulkReceiving, setBulkReceiving] = useState(false);

  // --------------------------------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------------------------------
  useEffect(() => {
    loadPendingQueue();

    // Check if routed with a pre-filled labSlipBarcode query param
    const params = new URLSearchParams(location.search);
    const slipParam = params.get('slip') || params.get('barcode');
    if (slipParam) {
      setSearchSlipBarcode(slipParam);
      handleSearchOrder(slipParam);
    }
  }, [location.search]);

  // Load pending orders awaiting collection
  const loadPendingQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await collectionService.getPendingOrders();
      setPendingQueue(data || []);
    } catch (err) {
      console.error('Failed to load pending queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  // --------------------------------------------------------------------------
  // LOOKUP ORDER BY LAB SLIP BARCODE
  // --------------------------------------------------------------------------
  const handleSearchOrder = async (barcode) => {
    const term = (barcode || searchSlipBarcode).trim();
    if (!term) {
      showError('Please scan or enter a Lab Slip barcode.', 'Search Required');
      return;
    }

    setLoading(true);
    try {
      const data = await collectionService.getCollectionOrder(term);
      setOrderData(data);
      setSearchSlipBarcode(term);
      showSuccess(`Order ${data.labSlipBarcode} loaded for patient ${data.patientName}.`, 'Order Loaded');
    } catch (err) {
      console.error('Failed to find collection order:', err);
      setOrderData(null);
      showError(
        err.response?.data?.message || 'No active order found for barcode: ' + term,
        'Order Not Found'
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshOrderContainers = async () => {
    if (!orderData?.labSlipBarcode) return;
    try {
      const refreshed = await collectionService.getCollectionOrder(orderData.labSlipBarcode);
      setOrderData(refreshed);
      loadPendingQueue();
    } catch (err) {
      console.error('Failed to refresh order:', err);
    }
  };

  // --------------------------------------------------------------------------
  // ALLOCATE SET CODE: ENTER 0001 -> AUTO-MATCHES ALL CONTAINER LABELS
  // --------------------------------------------------------------------------
  const handleAllocateSet = async (orderTestId, testCode) => {
    const rawCode = (setInputs[orderTestId] || '').trim();
    if (!rawCode) {
      showError('Please enter the 4-digit sticker set number (e.g. 0001).', 'Input Required');
      return;
    }

    setAssigningLoading(true);
    try {
      const updatedOrder = await collectionService.allocateSet(orderTestId, rawCode);
      setOrderData(updatedOrder);
      showSuccess(
        `Sticker set ${rawCode} allocated to ${testCode}! Container barcodes matched automatically.`,
        'Stickers Matched'
      );
      setSetInputs((prev) => ({ ...prev, [orderTestId]: '' }));
    } catch (err) {
      console.error('Error allocating sticker set:', err);
      showError(err.response?.data?.message || 'Failed to allocate sticker set.', 'Allocation Error');
    } finally {
      setAssigningLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // COLLECT SPECIMEN TUBE VIA BARCODE SCAN OR CLICK
  // --------------------------------------------------------------------------
  const handleCollectTube = async (tubeCode, containerId) => {
    const code = (tubeCode || scanTubeCode || '').trim().toUpperCase();

    // If scanning in the top scanner and it's a lab slip, route to search
    if (!containerId && code.startsWith('LS-')) {
      handleSearchOrder(code);
      return;
    }

    if (!code && !containerId) {
      showError('Please enter or scan a tube label code (e.g. FBC-0001-P1).', 'Scan Required');
      return;
    }

    setScanningLoading(true);
    try {
      const result = await collectionService.collectTube(code, containerId);
      showSuccess(`Specimen collected: ${result.containerCode || 'Container'}`, 'Sample Collected');
      setScanTubeCode('');
      await refreshOrderContainers();
    } catch (err) {
      console.error('Error collecting specimen tube:', err);
      const msg = err.response?.data?.message || err.message || 'Collection failed.';
      showError(msg, 'Collection Blocked');
    } finally {
      setScanningLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // BENCH RECEIPT ACTIONS
  // --------------------------------------------------------------------------
  const handleReceiveContainer = async (containerId) => {
    setReceivingContainerId(containerId);
    try {
      await collectionService.receiveContainer(containerId);
      showSuccess('Container marked as Received at Lab Bench.', 'Specimen Received');
      await refreshOrderContainers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to receive container.', 'Receive Failed');
    } finally {
      setReceivingContainerId(null);
    }
  };

  const handleReceiveAllCollected = async () => {
    if (!orderData?.orderId) return;
    setBulkReceiving(true);
    try {
      await collectionService.receiveAllCollected(orderData.orderId);
      showSuccess('All collected specimens received at testing bench.', 'Batch Received');
      await refreshOrderContainers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to receive batch.', 'Batch Receive Failed');
    } finally {
      setBulkReceiving(false);
    }
  };

  // --------------------------------------------------------------------------
  // REJECTION
  // --------------------------------------------------------------------------
  const openRejectModal = (container) => {
    setRejectTargetContainer(container);
    setRejectReasonCategory('Gross Hemolysis');
    setRejectCustomNotes('');
    setRejectModalOpen(true);
  };

  const handleConfirmRejection = async () => {
    if (!rejectTargetContainer) return;

    const fullReason = rejectCustomNotes.trim()
      ? `${rejectReasonCategory}: ${rejectCustomNotes.trim()}`
      : rejectReasonCategory;

    setSubmittingReject(true);
    try {
      await collectionService.rejectContainer(rejectTargetContainer.id, fullReason);
      showWarning(`Specimen container ${rejectTargetContainer.containerCode || ''} rejected.`, 'Rejected');
      setRejectModalOpen(false);
      await refreshOrderContainers();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to reject specimen.', 'Reject Failed');
    } finally {
      setSubmittingReject(false);
    }
  };

  // --------------------------------------------------------------------------
  // DERIVED DATA: GROUP CONTAINERS BY ORDERED TEST
  // --------------------------------------------------------------------------
  const allContainers = [
    ...(orderData?.todayContainers || []),
    ...(orderData?.futureContainers || []),
  ];

  // Group containers by orderTestId
  const testsInOrder = React.useMemo(() => {
    if (!allContainers.length) return [];
    const map = new Map();

    allContainers.forEach((c) => {
      if (!map.has(c.orderTestId)) {
        map.set(c.orderTestId, {
          orderTestId: c.orderTestId,
          testId: c.testId,
          testCode: c.testCode || 'TEST',
          testName: c.testName || 'Laboratory Test',
          testCategory: c.testCategory || 'General',
          testSampleCode: c.testSampleCode || 'TSC-00000-00',
          containers: [],
          isBound: false,
          stickerSetFormattedNumber: null,
        });
      }
      const group = map.get(c.orderTestId);
      group.containers.push(c);
      if (c.containerCode) {
        group.isBound = true;
        group.stickerSetFormattedNumber = c.stickerSetFormattedNumber;
      }
    });
    return Array.from(map.values());
  }, [allContainers]);

  const collectedCount = allContainers.filter(
    (c) => c.status === 'COLLECTED' || c.status === 'RECEIVED_AT_LAB'
  ).length;

  return (
    <Layout title="Sample Collection Station">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16">
        
        {/* ======================================================== */}
        {/* 1. TOP HEADER & QUEUE REFRESH                            */}
        {/* ======================================================== */}
        <PageHeader
          title="Sample Collection & Specimen Workstation"
          subtitle="Allocate sticker set numbers (e.g. 0001) to auto-match container labels, scan tube codes, and collect specimens."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw size={14} />}
                onClick={loadPendingQueue}
                loading={loadingQueue}
              >
                Refresh Queue
              </Button>
            </div>
          }
        />

        {/* ======================================================== */}
        {/* 2. LAB SLIP SCAN / SEARCH WORKBENCH                      */}
        {/* ======================================================== */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col gap-3">
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
            Scan or Enter Patient Lab Slip Barcode
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <BarcodeInput
                placeholder="Scan or type Lab Slip Barcode (e.g. LS-2026-00001)..."
                value={searchSlipBarcode}
                onChange={(val) => setSearchSlipBarcode(val)}
                onScan={handleSearchOrder}
                className="w-full text-base font-mono"
              />
            </div>
            <Button
              variant="primary"
              leftIcon={<Search size={16} />}
              onClick={() => handleSearchOrder(searchSlipBarcode)}
              loading={loading}
              className="sm:w-auto w-full"
            >
              Look Up Slip
            </Button>
          </div>
          <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <Tag size={13} className="text-gray-400" />
            Barcode scanner compatible: Scan the barcode printed on the patient's requisition slip.
          </p>
        </div>

        {/* ======================================================== */}
        {/* 3. PATIENT & ORDER DETAILS BANNER                        */}
        {/* ======================================================== */}
        {orderData && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  <User size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-900">{orderData.patientName}</h2>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      P-{String(orderData.patientId).padStart(4, '0')}
                    </span>
                    <Badge variant={orderData.orderStatus === 'IN_PROGRESS' ? 'blue' : 'amber'}>
                      {orderData.orderStatus}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                    <span><strong>Sex:</strong> {orderData.patientGender}</span>
                    <span>•</span>
                    <span><strong>Age:</strong> {orderData.patientAgeYears} yrs</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Phone size={12} /> {orderData.patientContact}</span>
                    <span>•</span>
                    <span><strong>Doctor:</strong> {orderData.referringDoctor || 'Self / Walk-in'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-blue-50/70 border border-blue-200 px-3 py-1.5 rounded-lg text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 block">
                    Lab Slip Barcode
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-950">
                    {orderData.labSlipBarcode}
                  </span>
                </div>
                <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 block">
                    Collection Status
                  </span>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs font-bold text-gray-800">
                      {collectedCount} / {allContainers.length} Collected
                    </span>
                    {orderData.rejectedCount > 0 && (
                      <span className="bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {orderData.rejectedCount} Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tube Barcode Scanner Bar */}
            <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-blue-900 w-full sm:w-auto">
                <Droplet size={18} className="text-blue-600 flex-shrink-0" />
                <span className="font-medium">
                  Scan Tube Barcode to Collect (e.g. FBC-0001-P1):
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-80">
                <input
                  type="text"
                  placeholder="e.g. FBC-0001-P1"
                  value={scanTubeCode}
                  onChange={(e) => setScanTubeCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCollectTube(scanTubeCode, null);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-mono uppercase bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Check size={14} />}
                  onClick={() => handleCollectTube(scanTubeCode, null)}
                  loading={scanningLoading}
                >
                  Collect
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. ORDERED TESTS WORKBENCH (SET ALLOCATION & CONTAINERS) */}
        {/* ======================================================== */}
        {orderData && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FlaskConical size={18} className="text-blue-600" />
                  Prescribed Diagnostic Tests & Specimen Allocation
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter your physical sticker set number (e.g. 0001) for each test. All tube codes will automatically match.
                </p>
              </div>

              {collectedCount > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReceiveAllCollected}
                  loading={bulkReceiving}
                  className="text-xs"
                >
                  Receive All Collected at Lab
                </Button>
              )}
            </div>

            {testsInOrder.map((testGroup) => (
              <div
                key={testGroup.orderTestId}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col gap-4"
              >
                {/* Test Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                      {testGroup.testCode}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {testGroup.testName}
                    </h4>
                    <span className="text-xs text-gray-500 capitalize">
                      ({testGroup.testCategory?.toLowerCase()})
                    </span>
                    <span className="text-xs text-blue-700 font-mono">
                      TSC: {testGroup.testSampleCode}
                    </span>
                  </div>

                  {/* Allocated Status Badge or Set Entry Box */}
                  <div>
                    {testGroup.isBound ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs font-semibold">
                          <CheckCircle2 size={14} className="text-green-600" />
                          Sticker Set #{testGroup.stickerSetFormattedNumber || '0001'} Allocated
                        </span>
                      </div>
                    ) : (
                      /* Set Number Entry Box */
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                          Sticker Set #:
                        </span>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 0001"
                          value={setInputs[testGroup.orderTestId] || ''}
                          onChange={(e) =>
                            setSetInputs({
                              ...setInputs,
                              [testGroup.orderTestId]: e.target.value.trim(),
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAllocateSet(testGroup.orderTestId, testGroup.testCode);
                          }}
                          className="w-24 px-2.5 py-1 text-xs font-mono font-bold text-center bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Layers size={13} />}
                          onClick={() => handleAllocateSet(testGroup.orderTestId, testGroup.testCode)}
                          loading={assigningLoading}
                        >
                          Allocate & Match
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Container Tube Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {testGroup.containers.map((container) => {
                    const isCollected = container.status === 'COLLECTED';
                    const isReceived = container.status === 'RECEIVED_AT_LAB';
                    const isRejected = container.status === 'REJECTED';
                    const isPending = container.status === 'PENDING_COLLECTION';
                    const isFutureDay = container.dayOffset > 0 && !container.isDueToday;

                    return (
                      <div
                        key={container.id}
                        className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                          isRejected
                            ? 'bg-red-50/40 border-red-300 ring-1 ring-red-200 shadow-xs'
                            : isFutureDay
                            ? 'bg-amber-50/30 border-amber-200'
                            : isCollected
                            ? 'bg-green-50/20 border-green-200'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Tube Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">
                              {container.containerLabelLetter || 'T'}
                            </span>
                            <div>
                              <span className="font-semibold text-gray-900 text-xs block leading-tight">
                                {container.containerTypeName || 'Tube'}
                              </span>
                              <span className="text-[11px] text-gray-500">
                                {container.sampleTypeName || 'Specimen'}
                              </span>
                            </div>
                          </div>

                          <SampleStatusBadge status={container.status} size="sm" />
                        </div>

                        {/* Rejected Notice Alert */}
                        {isRejected && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-800 flex flex-col gap-1">
                            <div className="flex items-center gap-1 font-semibold text-red-900">
                              <AlertTriangle size={13} className="text-red-600 flex-shrink-0" />
                              Sample Rejected: {container.rejectionReason || 'Quality Defect'}
                            </div>
                            <p className="text-[11px] text-red-700 leading-tight">
                              Re-collect replacement specimen using same barcode ({container.containerCode}) or manually write barcode on tube.
                            </p>
                          </div>
                        )}

                        {/* Middle: Code & Schedule Info */}
                        <div className="flex flex-col gap-1 text-xs pt-2 border-t border-gray-100">
                          {container.containerCode ? (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 text-[10px] uppercase font-semibold">Barcode:</span>
                              <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                {container.containerCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-700 italic">
                              Awaiting set allocation (enter set # above)
                            </span>
                          )}

                          {/* Day Offset / Due Date Notice */}
                          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                            <span>Schedule:</span>
                            {container.dayOffset === 0 ? (
                              <span className="text-green-700 font-semibold">Day 0 (Collect Today)</span>
                            ) : (
                              <span className={`font-semibold flex items-center gap-1 ${isFutureDay ? 'text-amber-800' : 'text-blue-700'}`}>
                                {isFutureDay && <Lock size={11} />}
                                Day {container.dayOffset} {isFutureDay ? `(Due ${container.dueDate || 'later'})` : '(Due Today!)'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                          {isPending && container.containerCode && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full text-xs"
                              disabled={isFutureDay}
                              leftIcon={isFutureDay ? <Lock size={12} /> : <Droplet size={12} />}
                              onClick={() => handleCollectTube(container.containerCode, container.id)}
                            >
                              {isFutureDay ? 'Locked (Future Day)' : 'Collect Sample'}
                            </Button>
                          )}

                          {isRejected && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full text-xs bg-red-600 hover:bg-red-700 text-white font-semibold"
                              leftIcon={<Droplet size={12} />}
                              onClick={() => handleCollectTube(container.containerCode, container.id)}
                            >
                              Re-collect Sample ({container.containerCode})
                            </Button>
                          )}

                          {isCollected && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-700 border-red-200 hover:bg-red-50 text-[11px]"
                                onClick={() => openRejectModal(container)}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                className="bg-purple-700 hover:bg-purple-800 text-white text-[11px]"
                                loading={receivingContainerId === container.id}
                                onClick={() => handleReceiveContainer(container.id)}
                              >
                                Mark Received
                              </Button>
                            </>
                          )}

                          {isReceived && (
                            <span className="text-[11px] text-purple-700 font-semibold">
                              ✓ Received at Bench
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. PHLEBOTOMY WORKLIST (PENDING PATIENTS QUEUE)          */}
        {/* ======================================================== */}
        {!orderData && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Recent Orders Awaiting Specimen Collection ({pendingQueue.length})
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Click on any patient in the waiting room to load their order and allocate sticker codes.
                </p>
              </div>
            </div>

            {loadingQueue ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner text="Loading pending queue..." />
              </div>
            ) : pendingQueue.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs">
                No patients currently awaiting specimen collection.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2.5">Lab Slip</th>
                      <th className="px-4 py-2.5">Patient Name</th>
                      <th className="px-4 py-2.5">Contact</th>
                      <th className="px-4 py-2.5">Status & Tubes</th>
                      <th className="px-4 py-2.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingQueue.map((item) => {
                      const hasRejected = item.rejectedCount && item.rejectedCount > 0;
                      return (
                        <tr
                          key={item.orderId}
                          className={`transition-colors ${
                            hasRejected ? 'bg-red-50/25 hover:bg-red-50/50' : 'hover:bg-blue-50/40'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-blue-700">
                            {item.labSlipBarcode}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.patientName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.patientContact}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                {item.totalContainers} Tubes
                              </span>
                              {hasRejected ? (
                                <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded font-bold text-[11px] flex items-center gap-1">
                                  <AlertTriangle size={11} className="text-red-600" />
                                  {item.rejectedCount} Rejected (Needs Re-draw)
                                </span>
                              ) : item.pendingCount > 0 ? (
                                <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium text-[11px]">
                                  {item.pendingCount} Pending
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded font-medium text-[11px]">
                                  Complete
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant={hasRejected ? 'primary' : 'secondary'}
                              size="xs"
                              className={hasRejected ? 'bg-red-600 hover:bg-red-700 text-white font-semibold' : ''}
                              onClick={() => handleSearchOrder(item.labSlipBarcode)}
                            >
                              {hasRejected ? 'Re-collect Sample' : 'Load Order'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODAL: REJECT SPECIMEN CONTAINER                         */}
        {/* ======================================================== */}
        {rejectModalOpen && (
          <Modal
            isOpen={rejectModalOpen}
            onClose={() => setRejectModalOpen(false)}
            title="Reject Specimen Container"
            size="md"
            footer={
              <div className="flex justify-end gap-2 w-full">
                <Button variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  loading={submittingReject}
                  onClick={handleConfirmRejection}
                >
                  Confirm Rejection
                </Button>
              </div>
            }
          >
            <div className="flex flex-col gap-3 text-xs">
              <p className="text-gray-600">
                Rejecting specimen barcode <strong className="font-mono">{rejectTargetContainer?.containerCode}</strong>.
                Rejected tubes are permanently flagged and cannot be analyzed.
              </p>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Reason Category:</label>
                <select
                  value={rejectReasonCategory}
                  onChange={(e) => setRejectReasonCategory(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Gross Hemolysis">Gross Hemolysis</option>
                  <option value="Severe Lipemia">Severe Lipemia</option>
                  <option value="Clotted Blood Specimen">Clotted Blood Specimen</option>
                  <option value="Insufficient Volume (QNS)">Insufficient Volume (QNS)</option>
                  <option value="Incorrect Specimen Tube Type">Incorrect Specimen Tube Type</option>
                  <option value="Leaking / Cracked Container">Leaking / Cracked Container</option>
                  <option value="Other Quality Defect">Other Quality Defect</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-gray-700">Additional Notes:</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes regarding sample defect..."
                  value={rejectCustomNotes}
                  onChange={(e) => setRejectCustomNotes(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </Modal>
        )}

      </div>
    </Layout>
  );
};

export default SampleCollectionPage;
