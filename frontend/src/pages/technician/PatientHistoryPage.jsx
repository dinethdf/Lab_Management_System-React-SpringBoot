import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import catalogService from '../../services/catalogService';
import api from '../../services/api';
import {
  Button,
  Badge,
  StatCard,
  EmptyState,
  LoadingSpinner,
  Modal,
  useToast,
} from '../../components/ui';
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Plus,
  Printer,
  Search,
  Stethoscope,
  Trash2,
  User,
  History,
  ShieldAlert,
  Droplet,
  MapPin,
  Phone,
  X,
  Barcode,
} from 'lucide-react';

/**
 * PatientHistoryPage — Patient profile and diagnostic order history with popup test allocation.
 *
 * Implements refined clinical workflow:
 * 1. Clean, uncluttered page layout: Patient profile at the top with quick demographics, followed by history & stats.
 * 2. Dedicated "+ Allocate New Tests" Popup Modal: Opens a clean dialog to search, select tests, and place orders.
 * 3. Printable Dual Slip Modal: Automatically pops up after placing an order or when clicking "View Slip".
 */
const PatientHistoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Role boundaries: Receptionist can register & order tests, but clinical results are restricted
  const userRole = localStorage.getItem('role')?.toUpperCase();
  const isReceptionist = userRole === 'RECEPTIONIST';

  // ----------------------------------------------------
  // DATA STATE
  // ----------------------------------------------------
  const [patient, setPatient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Catalog tests for allocation popup
  const [availableTests, setAvailableTests] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [testSearch, setTestSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Popup Modal states
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [viewingPastOrder, setViewingPastOrder] = useState(null);

  // ----------------------------------------------------
  // INITIAL DATA FETCHING
  // ----------------------------------------------------
  useEffect(() => {
    loadPatientData();
    loadCatalogTests();
  }, [id]);

  // Load patient profile and historical orders
  const loadPatientData = async () => {
    setLoading(true);
    try {
      const patientRes = await api.get(`/patients/${id}`);
      setPatient(patientRes.data);

      const ordersRes = await api.get(`/orders/patient/${id}`);
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error('Failed to load patient data:', err);
      showError(err.response?.data?.message || 'Failed to load patient profile.', 'Patient Profile');
    } finally {
      setLoading(false);
    }
  };

  // Load diagnostic test catalog
  const loadCatalogTests = async () => {
    setCatalogLoading(true);
    try {
      const data = await catalogService.getAllTests();
      setAvailableTests(data || []);
    } catch (err) {
      console.error('Failed to load test catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  // ----------------------------------------------------
  // CATALOG FILTERING & SELECTION (Inside Allocation Popup)
  // ----------------------------------------------------
  const categories = useMemo(() => {
    const categorySet = new Set();
    availableTests.forEach((t) => {
      if (t.category) categorySet.add(t.category);
    });
    return ['ALL', ...Array.from(categorySet)];
  }, [availableTests]);

  const filteredTests = useMemo(() => {
    return availableTests.filter((t) => {
      const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
      const query = testSearch.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (t.name && t.name.toLowerCase().includes(query)) ||
        (t.code && t.code.toLowerCase().includes(query)) ||
        (t.category && t.category.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [availableTests, selectedCategory, testSearch]);

  const handleToggleTest = (testId) => {
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds((prev) => prev.filter((item) => item !== testId));
    } else {
      setSelectedTestIds((prev) => [...prev, testId]);
    }
  };

  const selectedTestObjects = useMemo(() => {
    return availableTests.filter((t) => selectedTestIds.includes(t.id));
  }, [availableTests, selectedTestIds]);

  // Open allocation modal and reset search
  const handleOpenAllocationModal = () => {
    setTestSearch('');
    setSelectedCategory('ALL');
    setAllocationModalOpen(true);
  };

  // ----------------------------------------------------
  // ORDER SUBMISSION
  // ----------------------------------------------------
  const handlePlaceOrder = async () => {
    if (selectedTestIds.length === 0) {
      showError('Please select at least one laboratory test to place an order.', 'No Tests Selected');
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        patientId: Number(id),
        testIds: selectedTestIds,
      };

      const res = await api.post('/orders', payload);
      const newOrder = res.data;

      // Close allocation modal and reset selection
      setAllocationModalOpen(false);
      setSelectedTestIds([]);
      setTestSearch('');

      // Open printable dual slip preview
      setCreatedOrder(newOrder);
      showSuccess(`Laboratory order created! Slip: ${newOrder.labSlipBarcode}`, 'Order Placed');

      // Refresh past orders list
      const ordersRes = await api.get(`/orders/patient/${id}`);
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error('Failed to place order:', err);
      showError(err.response?.data?.message || 'Failed to place laboratory order.', 'Order Failed');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Browser print for dual slips
  const handlePrintSlips = () => {
    window.print();
  };

  // Compute patient age
  const computedAge = patient?.dateOfBirth
    ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
    : undefined;

  // Order summary metrics
  const pendingCount = orders.filter(
    (ord) => ord.status === 'PENDING' || ord.status === 'IN_PROGRESS'
  ).length;
  const completedCount = orders.filter(
    (ord) => ord.status === 'COMPLETED' || ord.status === 'REPORTED'
  ).length;

  // Status badge helper
  const renderOrderStatusBadge = (status) => {
    const statusUpper = status?.toUpperCase() || 'PENDING';
    switch (statusUpper) {
      case 'COMPLETED':
      case 'REPORTED':
        return <Badge variant="green">{statusUpper}</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="blue">IN PROGRESS</Badge>;
      case 'COLLECTED':
        return <Badge variant="indigo">COLLECTED</Badge>;
      default:
        return <Badge variant="amber">{statusUpper}</Badge>;
    }
  };

  // ----------------------------------------------------
  // RENDER: LOADING STATE
  // ----------------------------------------------------
  if (loading) {
    return (
      <Layout title="Patient Diagnostic Record">
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 font-medium">Loading patient record and diagnostic history...</p>
        </div>
      </Layout>
    );
  }

  // ----------------------------------------------------
  // RENDER: NOT FOUND STATE
  // ----------------------------------------------------
  if (!patient) {
    return (
      <Layout title="Patient Not Found">
        <div className="max-w-xl mx-auto py-16 text-center flex flex-col items-center gap-4">
          <p className="text-gray-600 font-medium">Patient record not found.</p>
          <Button variant="primary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/reception')}>
            Back to Reception Desk
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Patient Record — ${patient.fullName}`}>
      {/* Print stylesheet to isolate dual slips when printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-slip-area, #printable-slip-area * {
            visibility: visible;
          }
          #printable-slip-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-16">
        
        {/* Top Navigation Bar: Breadcrumb + Back Button */}
        <div className="flex items-center justify-between no-print">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={15} />}
            onClick={() => navigate('/reception')}
          >
            Back to Reception Desk
          </Button>

          {isReceptionist && (
            <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
              <ShieldAlert size={14} className="text-amber-600 flex-shrink-0" />
              <span>Receptionist View • Clinical test result values are restricted</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* PATIENT PROFILE CARD (Clean, Soft Typography & Layout)   */}
        {/* ======================================================== */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col gap-5 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Left: Patient Avatar & Primary Identity */}
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-full bg-blue-50 text-blue-600 font-semibold text-lg flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-xs">
                {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : <User size={22} />}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                    {patient.fullName}
                  </h1>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                    P-{String(patient.id).padStart(4, '0')}
                  </span>
                  <Badge variant={patient.gender?.toUpperCase() === 'FEMALE' ? 'purple' : 'blue'}>
                    {patient.gender || 'Unknown'}
                  </Badge>
                  {patient.guardianName && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      <ShieldAlert size={12} className="text-amber-600" />
                      MINOR (Guardian: {patient.guardianName})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-xs text-gray-500 mt-1 flex-wrap">
                  {computedAge !== undefined && (
                    <span>Age: <strong className="font-medium text-gray-700">{computedAge} yrs</strong></span>
                  )}
                  {patient.dateOfBirth && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        DOB: {patient.dateOfBirth}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Prominent "+ Allocate New Tests" Popup Trigger */}
            <div className="self-start sm:self-auto">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus size={16} />}
                onClick={handleOpenAllocationModal}
              >
                Allocate New Tests
              </Button>
            </div>
          </div>

          {/* Demographics Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
              <Phone size={15} className="text-blue-600 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Contact Number</span>
                <span className="font-medium text-gray-800 truncate">{patient.contactNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
              <Stethoscope size={15} className="text-blue-600 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Referring Doctor</span>
                <span className="font-medium text-gray-800 truncate">{patient.referringDoctor || 'Self / Walk-in'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
              <MapPin size={15} className="text-blue-600 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Residential Address</span>
                <span className="font-medium text-gray-800 truncate">{patient.address || 'Not specified'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50/70 border border-gray-100">
              <History size={15} className="text-blue-600 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Visit History</span>
                <span className="font-medium text-gray-900">{orders.length} past order{orders.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SUMMARY STAT CARDS                                       */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
          <StatCard
            title="Total Lab Orders"
            value={orders.length}
            icon={FileText}
          />
          <StatCard
            title="Pending Collection"
            value={pendingCount}
            icon={Droplet}
          />
          <StatCard
            title="Completed & Reported"
            value={completedCount}
            icon={CheckCircle2}
          />
        </div>

        {/* ======================================================== */}
        {/* DIAGNOSTIC ORDER HISTORY TABLE                           */}
        {/* ======================================================== */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col gap-5 no-print">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <History size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Diagnostic Order History</h2>
                <p className="text-xs text-gray-500">
                  Chronological record of all lab test requests and printed collection slips
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={14} />}
              onClick={handleOpenAllocationModal}
            >
              + Allocate Tests
            </Button>
          </div>

          {orders.length === 0 ? (
            <EmptyState
              title="No Diagnostic Orders On Record"
              description="This patient has not been prescribed any lab tests yet. Click the button below to open the test allocation popup and place an order."
              icon={<FileText size={24} />}
              actionLabel="+ Allocate First Test"
              onAction={handleOpenAllocationModal}
            />
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order Date & Time</th>
                    <th className="py-3 px-4">Lab Slip Barcode</th>
                    <th className="py-3 px-4">Prescribed Diagnostic Tests</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {orders.map((ord) => {
                    const formattedDate = ord.createdAt
                      ? new Date(ord.createdAt).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A';

                    const statusUpper = ord.status?.toUpperCase() || 'PENDING';

                    return (
                      <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Date Column */}
                        <td className="py-3.5 px-4 font-medium text-gray-600 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-gray-400" />
                            {formattedDate}
                          </span>
                        </td>

                        {/* Barcode Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 font-mono font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            <Barcode size={13} className="text-gray-500" />
                            {ord.labSlipBarcode}
                          </span>
                        </td>

                        {/* Tests Column */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {ord.orderTests?.map((ot, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[11px] font-medium text-gray-700"
                              >
                                {ot.testName} ({ot.testCode})
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderOrderStatusBadge(ord.status)}
                        </td>

                        {/* Action Buttons Column */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              leftIcon={<Printer size={13} />}
                              onClick={() => setViewingPastOrder(ord)}
                            >
                              View Slip
                            </Button>

                            {!isReceptionist && (statusUpper === 'PENDING' || statusUpper === 'IN_PROGRESS') && (
                              <Button
                                variant="primary"
                                size="sm"
                                leftIcon={<Droplet size={13} />}
                                onClick={() => navigate(`/collection?slip=${ord.labSlipBarcode}`)}
                              >
                                Collect Samples
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* POPUP MODAL: ALLOCATE DIAGNOSTIC TESTS                   */}
        {/* ======================================================== */}
        <Modal
          isOpen={allocationModalOpen}
          onClose={() => setAllocationModalOpen(false)}
          title="Allocate Diagnostic Tests"
          size="xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-gray-500 font-medium">
                {selectedTestIds.length === 0 ? (
                  'Select tests to place an order'
                ) : (
                  <span className="text-blue-700 font-semibold">
                    {selectedTestIds.length} test{selectedTestIds.length === 1 ? '' : 's'} selected
                  </span>
                )}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setAllocationModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={selectedTestIds.length === 0}
                  loading={submittingOrder}
                  leftIcon={<Check size={15} />}
                  onClick={handlePlaceOrder}
                >
                  Confirm & Place Order ({selectedTestIds.length})
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            
            {/* Modal Subtitle / Context */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-center justify-between">
              <span>
                Prescribing tests for: <strong>{patient.fullName}</strong> (P-{String(patient.id).padStart(4, '0')})
              </span>
              <span className="text-gray-500">
                Doctor: <strong>{patient.referringDoctor || 'Self / Walk-in'}</strong>
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                placeholder="Search diagnostic tests by name or code (e.g. FBC, Fasting Blood Sugar)..."
                className="w-full rounded-xl border border-gray-200 pl-10 pr-10 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-xs"
                autoFocus
              />
              {testSearch && (
                <button
                  type="button"
                  onClick={() => setTestSearch('')}
                  className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Horizontal Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                    ${selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Test Cards Grid */}
            {catalogLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
                <LoadingSpinner size="md" />
                <span>Loading available tests...</span>
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                <p>No tests match your filter "{testSearch}".</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setTestSearch('');
                    setSelectedCategory('ALL');
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                {filteredTests.map((test) => {
                  const isSelected = selectedTestIds.includes(test.id);

                  return (
                    <div
                      key={test.id}
                      onClick={() => handleToggleTest(test.id)}
                      className={`
                        border rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between gap-2 select-none
                        ${isSelected
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50/50'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                            {test.code}
                          </span>
                          <h4 className="font-semibold text-gray-900 text-xs mt-1 leading-snug line-clamp-2">
                            {test.name}
                          </h4>
                        </div>
                        <div
                          className={`
                            w-4.5 h-4.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                            ${isSelected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 bg-white text-transparent'
                            }
                          `}
                        >
                          <Check size={11} strokeWidth={3} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1.5 border-t border-gray-100">
                        <span className="capitalize font-medium text-gray-600">
                          {test.category?.toLowerCase() || 'Diagnostic'}
                        </span>
                        {test.parameterCount !== undefined && (
                          <span className="text-gray-400">
                            {test.parameterCount} param{test.parameterCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Tests Summary Tray */}
            {selectedTestObjects.length > 0 && (
              <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">
                    Selected for this order ({selectedTestObjects.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedTestIds([])}
                    className="text-[11px] text-red-600 hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {selectedTestObjects.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-medium text-blue-800"
                    >
                      <span>{t.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTest(t.id);
                        }}
                        className="text-blue-500 hover:text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </Modal>

        {/* ======================================================== */}
        {/* MODAL: PRINTABLE DUAL SLIP PREVIEW & REPRINT            */}
        {/* ======================================================== */}
        {(createdOrder || viewingPastOrder) && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 flex flex-col gap-6 my-8">
              
              {/* Modal Top Bar (hidden on print) */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 no-print">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={22} className="text-green-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-base">
                      {createdOrder ? 'Order Placed — Lab Slips Generated' : 'Diagnostic Lab Slip View'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Lab Slip Barcode: <strong className="font-mono text-gray-900">{(createdOrder || viewingPastOrder).labSlipBarcode}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isReceptionist && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      leftIcon={<Droplet size={15} />}
                      onClick={() => {
                        const code = (createdOrder || viewingPastOrder).labSlipBarcode;
                        navigate(`/collection?slip=${code}`);
                      }}
                    >
                      Collect Samples
                    </Button>
                  )}
                  <Button variant="outline" size="sm" leftIcon={<Printer size={15} />} onClick={handlePrintSlips}>
                    Print Slips
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setCreatedOrder(null);
                      setViewingPastOrder(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* PRINTABLE DUAL SLIP TEMPLATE */}
              <div id="printable-slip-area" className="flex flex-col gap-6 bg-white p-2">
                
                {/* -------------------------------------------------- */}
                {/* SLIP 1: PATIENT RECEIPT COPY                       */}
                {/* -------------------------------------------------- */}
                <div className="border-2 border-gray-900 rounded-lg p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between border-b-2 border-gray-900 pb-2">
                    <div>
                      <h1 className="text-base font-bold uppercase text-gray-900 tracking-wider">
                        Hospital Diagnostic Laboratory
                      </h1>
                      <p className="text-[11px] font-medium text-gray-600">
                        Patient Test Order Receipt / Collection Slip
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-gray-700">
                      <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-300 text-xs">
                    <div>
                      <p className="text-gray-500 text-[10px]">Patient Name</p>
                      <p className="font-bold text-gray-900 text-sm">{patient.fullName}</p>
                      <p className="text-gray-600 mt-1">
                        <strong>ID:</strong> P-{String(patient.id).padStart(4, '0')} • {patient.gender} • {computedAge ? `${computedAge} yrs` : ''}
                      </p>
                      <p className="text-gray-600"><strong>Mobile:</strong> {patient.contactNumber}</p>
                      <p className="text-gray-600"><strong>Doctor:</strong> {patient.referringDoctor || 'Self / Walk-in'}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-2 bg-white border border-gray-400 rounded text-center">
                      <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Official Lab Slip Barcode</span>
                      <div className="my-1 py-1 px-3 bg-gray-900 text-white font-mono text-xs tracking-widest font-black rounded">
                        |||| ||||| |||| || ||||||
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-900 tracking-wider">
                        {(createdOrder || viewingPastOrder).labSlipBarcode}
                      </span>
                    </div>
                  </div>

                  {/* Prescribed Tests Table */}
                  <div>
                    <h4 className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-1">Prescribed Tests</h4>
                    <table className="w-full text-xs border border-gray-300">
                      <thead className="bg-gray-100 border-b border-gray-300 text-[11px]">
                        <tr>
                          <th className="py-1 px-2 text-left">#</th>
                          <th className="py-1 px-2 text-left">Code</th>
                          <th className="py-1 px-2 text-left">Test Name</th>
                          <th className="py-1 px-2 text-left">Test Sample Code</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(createdOrder || viewingPastOrder).orderTests?.map((ot, idx) => (
                          <tr key={idx}>
                            <td className="py-1 px-2 font-mono text-gray-500">{idx + 1}</td>
                            <td className="py-1 px-2 font-mono font-bold text-gray-900">{ot.testCode}</td>
                            <td className="py-1 px-2 text-gray-800">{ot.testName}</td>
                            <td className="py-1 px-2 font-mono font-semibold text-blue-700">
                              {ot.testSampleCode || 'TSC-PENDING'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-gray-200 pt-1.5 text-[10px] text-gray-500 flex justify-between">
                    <span>* Please present this slip at Sample Collection. Keep receipt to collect verified reports.</span>
                    <span className="font-semibold text-gray-700">Patient Receipt Copy</span>
                  </div>
                </div>

                {/* Perforation Line */}
                <div className="relative py-1 flex items-center justify-center">
                  <div className="border-t-2 border-dashed border-gray-400 w-full" />
                  <span className="absolute bg-white px-3 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                    ✂ Tear along dashed line for Laboratory Routing Copy
                  </span>
                </div>

                {/* -------------------------------------------------- */}
                {/* SLIP 2: LABORATORY INTERNAL ROUTING COPY           */}
                {/* -------------------------------------------------- */}
                <div className="border-2 border-gray-900 rounded-lg p-5 flex flex-col gap-3 bg-gray-50/40">
                  <div className="flex items-start justify-between border-b-2 border-gray-900 pb-2">
                    <div>
                      <h2 className="text-sm font-bold uppercase text-gray-900 tracking-wider">
                        Laboratory Internal Routing Slip
                      </h2>
                      <p className="text-[10px] font-medium text-gray-600">Phlebotomy & Specimen Collection</p>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-gray-900 text-white rounded">
                      {(createdOrder || viewingPastOrder).labSlipBarcode}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-800 bg-white p-2.5 rounded border border-gray-300">
                    <span><strong>Patient:</strong> {patient.fullName} (P-{String(patient.id).padStart(4, '0')})</span>
                    <span><strong>Gender/Age:</strong> {patient.gender} / {computedAge ? `${computedAge} yrs` : '-'}</span>
                    <span><strong>Doctor:</strong> {patient.referringDoctor || 'Self / Walk-in'}</span>
                  </div>

                  <table className="w-full text-xs border border-gray-300 bg-white">
                    <thead className="bg-gray-100 border-b border-gray-300 text-[11px]">
                      <tr>
                        <th className="py-1 px-2 text-left">Sample Code</th>
                        <th className="py-1 px-2 text-left">Test</th>
                        <th className="py-1 px-2 text-left">Specimen Collection Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(createdOrder || viewingPastOrder).orderTests?.map((ot, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-2 font-mono font-semibold text-gray-900">{ot.testSampleCode || 'TSC-PENDING'}</td>
                          <td className="py-1.5 px-2">{ot.testName} ({ot.testCode})</td>
                          <td className="py-1.5 px-2 text-gray-600">[ &nbsp; ] Collected &nbsp; [ &nbsp; ] Rejected</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-300 text-[11px] text-gray-700">
                    <div>
                      <p className="font-semibold">Phlebotomist / Collector:</p>
                      <p className="mt-3 border-b border-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Collection Time:</p>
                      <p className="mt-3 border-b border-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold">Condition:</p>
                      <p className="mt-3 text-[10px] text-gray-500">[ ] Normal &nbsp; [ ] Hemolyzed</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default PatientHistoryPage;
