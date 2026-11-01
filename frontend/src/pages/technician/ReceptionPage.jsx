import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import catalogService from '../../services/catalogService';
import api from '../../services/api';
import {
  PageHeader,
  Button,
  FormInput,
  FormSelect,
  LoadingSpinner,
  Modal,
  Badge,
  EmptyState,
  useToast,
} from '../../components/ui';
import {
  Search,
  UserPlus,
  Phone,
  ArrowRight,
  ShieldAlert,
  Stethoscope,
  Users,
  CheckCircle2,
  X,
  Check,
  Plus,
  Clock,
  FileText,
  Droplet,
  History,
  MapPin,
  Calendar,
  User,
  Barcode,
  Printer,
  RefreshCw,
} from 'lucide-react';

/**
 * ReceptionPage — Split-Panel Patient Reception Desk
 *
 * Layout:
 *   LEFT PANEL  (35%) — Mobile-number search + patient result cards + Register New Patient button.
 *                        Clicking a patient card loads them into the right panel without navigating away.
 *   RIGHT PANEL (65%) — Selected patient's full profile, diagnostic order history,
 *                        and "+ Allocate New Tests" modal. Empty state shown until a patient is selected.
 *
 * Workflow:
 * 1. Staff types mobile number → auto-searches after 4 digits.
 * 2. Matching patients appear in left panel cards → staff clicks "Select".
 * 3. Right panel shows patient profile + past orders. Staff can allocate new tests.
 * 4. After order placed → dual slip preview pops up for printing.
 */
const ReceptionPage = () => {
  const navigate = useNavigate();

  // Role check: Receptionist cannot see clinical result values or collect samples
  const userRole = localStorage.getItem('role')?.toUpperCase();
  const isReceptionist = userRole === 'RECEPTIONIST';

  // ============================================================
  // LEFT PANEL STATE — Patient Search
  // ============================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ============================================================
  // RIGHT PANEL STATE — Selected Patient
  // ============================================================
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ============================================================
  // REGISTER NEW PATIENT MODAL STATE
  // ============================================================
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    ageYears: '',
    dateOfBirth: '',
    gender: 'MALE',
    contactNumber: '',
    referringDoctor: '',
    guardianName: '',
    address: '',
  });
  const [isMinor, setIsMinor] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [existingPatientsForNumber, setExistingPatientsForNumber] = useState([]);
  const [checkingNumberLoading, setCheckingNumberLoading] = useState(false);

  // ============================================================
  // ALLOCATE TESTS MODAL STATE
  // ============================================================
  const [availableTests, setAvailableTests] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [selectedTestIds, setSelectedTestIds] = useState([]);
  const [testSearch, setTestSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // ============================================================
  // SLIP PREVIEW STATE
  // ============================================================
  const [createdOrder, setCreatedOrder] = useState(null);
  const [viewingPastOrder, setViewingPastOrder] = useState(null);

  const { showSuccess, showError } = useToast();

  // ============================================================
  // LOAD TEST CATALOG ON MOUNT
  // ============================================================
  useEffect(() => {
    loadCatalogTests();
  }, []);

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

  // ============================================================
  // LEFT PANEL — AUTO-SEARCH (debounced, triggers after 4 chars)
  // ============================================================
  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (trimmed.length >= 4) {
      const timer = setTimeout(() => {
        executeSearch(trimmed);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setHasSearched(false);
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const executeSearch = async (query) => {
    setSearchLoading(true);
    try {
      const res = await api.get(`/patients/search?contact=${encodeURIComponent(query)}`);
      setSearchResults(res.data || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Error searching patients:', err);
      showError('Failed to search patient records. Please try again.', 'Search Failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // ============================================================
  // RIGHT PANEL — SELECT A PATIENT (loads profile + orders)
  // ============================================================
  const handleSelectPatient = async (patient) => {
    setSelectedPatient(patient);
    setOrders([]);
    setCreatedOrder(null);
    setViewingPastOrder(null);
    setOrdersLoading(true);
    try {
      const res = await api.get(`/orders/patient/${patient.id}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to load patient orders:', err);
      showError('Could not load this patient\'s order history.', 'Load Error');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Refresh orders for the currently selected patient
  const refreshOrders = async () => {
    if (!selectedPatient) return;
    setOrdersLoading(true);
    try {
      const res = await api.get(`/orders/patient/${selectedPatient.id}`);
      setOrders(res.data || []);
    } catch (err) {
      console.error('Failed to refresh orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  // ============================================================
  // REGISTER NEW PATIENT — check if mobile number already exists
  // ============================================================
  useEffect(() => {
    const trimmedContact = newPatient.contactNumber.trim();
    if (trimmedContact.length >= 4) {
      const timer = setTimeout(async () => {
        setCheckingNumberLoading(true);
        try {
          const res = await api.get(`/patients/search?contact=${encodeURIComponent(trimmedContact)}`);
          setExistingPatientsForNumber(res.data || []);
        } catch (err) {
          console.error('Error checking existing patients for number:', err);
        } finally {
          setCheckingNumberLoading(false);
        }
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setExistingPatientsForNumber([]);
      setCheckingNumberLoading(false);
    }
  }, [newPatient.contactNumber]);

  // Age ↔ DOB synchronization
  const handleAgeChange = (value) => {
    const ageNum = parseInt(value, 10);
    if (!isNaN(ageNum) && ageNum >= 0) {
      const estimatedDob = `${new Date().getFullYear() - ageNum}-01-01`;
      setNewPatient((prev) => ({ ...prev, ageYears: value, dateOfBirth: estimatedDob }));
      setIsMinor(ageNum < 18);
    } else {
      setNewPatient((prev) => ({ ...prev, ageYears: value }));
      if (!value) setIsMinor(false);
    }
  };

  const handleDobChange = (value) => {
    if (value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setNewPatient((prev) => ({ ...prev, dateOfBirth: value, ageYears: age >= 0 ? String(age) : '' }));
      setIsMinor(age < 18);
    } else {
      setNewPatient((prev) => ({ ...prev, dateOfBirth: '', ageYears: '' }));
      setIsMinor(false);
    }
  };

  const handleToggleSelfDoctor = () => {
    setNewPatient((prev) => ({
      ...prev,
      referringDoctor: prev.referringDoctor === 'Self / Walk-in' ? '' : 'Self / Walk-in',
    }));
  };

  // Open register modal, pre-fill mobile number from search box
  const openRegisterModal = () => {
    setNewPatient({
      fullName: '',
      ageYears: '',
      dateOfBirth: '',
      gender: 'MALE',
      contactNumber: searchQuery.trim(),
      referringDoctor: '',
      guardianName: '',
      address: '',
    });
    setIsMinor(false);
    setExistingPatientsForNumber([]);
    setRegisterModalOpen(true);
  };

  // Submit new patient registration
  const handleRegisterPatient = async (e) => {
    e.preventDefault();

    if (!newPatient.fullName.trim()) {
      showError('Patient full name is required.', 'Validation Error');
      return;
    }
    if (!newPatient.contactNumber.trim()) {
      showError('Contact mobile number is required.', 'Validation Error');
      return;
    }
    if (!newPatient.dateOfBirth) {
      showError('Date of birth or age is required.', 'Validation Error');
      return;
    }
    if (isMinor && (!newPatient.guardianName || !newPatient.guardianName.trim())) {
      showError('Guardian name is mandatory for minor patients (< 18 years).', 'Validation Error');
      return;
    }

    setRegistering(true);
    try {
      const payload = {
        fullName: newPatient.fullName.trim(),
        dateOfBirth: newPatient.dateOfBirth,
        gender: newPatient.gender ? newPatient.gender.toUpperCase() : 'MALE',
        contactNumber: newPatient.contactNumber.trim(),
        referringDoctor: newPatient.referringDoctor?.trim() || 'Self / Walk-in',
        guardianName: isMinor ? newPatient.guardianName?.trim() : null,
        address: newPatient.address?.trim() || null,
      };

      const res = await api.post('/patients', payload);
      const createdPatient = res.data;

      showSuccess(`Patient ${createdPatient.fullName} registered successfully!`);
      setRegisterModalOpen(false);

      // Auto-select the newly registered patient in the right panel
      handleSelectPatient(createdPatient);

      // Also update search to reflect new patient
      setSearchQuery(createdPatient.contactNumber);
    } catch (err) {
      console.error('Failed to register patient:', err);
      showError(err.response?.data?.message || 'Failed to register patient.', 'Registration Error');
    } finally {
      setRegistering(false);
    }
  };

  // ============================================================
  // ALLOCATE TESTS MODAL
  // ============================================================
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

  const handleOpenAllocationModal = () => {
    setTestSearch('');
    setSelectedCategory('ALL');
    setSelectedTestIds([]);
    setAllocationModalOpen(true);
  };

  const handlePlaceOrder = async () => {
    if (selectedTestIds.length === 0) {
      showError('Please select at least one laboratory test to place an order.', 'No Tests Selected');
      return;
    }

    setSubmittingOrder(true);
    try {
      const payload = {
        patientId: Number(selectedPatient.id),
        testIds: selectedTestIds,
      };

      const res = await api.post('/orders', payload);
      const newOrder = res.data;

      setAllocationModalOpen(false);
      setSelectedTestIds([]);
      setTestSearch('');

      // Open slip preview automatically
      setCreatedOrder(newOrder);
      showSuccess(`Laboratory order created! Slip: ${newOrder.labSlipBarcode}`, 'Order Placed');

      // Refresh the order history in the right panel
      await refreshOrders();
    } catch (err) {
      console.error('Failed to place order:', err);
      showError(err.response?.data?.message || 'Failed to place laboratory order.', 'Order Failed');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const computeAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  const renderOrderStatusBadge = (status) => {
    const s = status?.toUpperCase() || 'PENDING';
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

  const handlePrintSlips = () => {
    window.print();
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <Layout title="Reception Desk">
      {/* Print stylesheet — isolates the slip area when Ctrl+P is pressed */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-slip-area, #printable-slip-area * { visibility: visible; }
          #printable-slip-area {
            position: absolute; left: 0; top: 0;
            width: 100%; background: white !important; padding: 20px;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col gap-4 pb-10">
        {/* Page Header */}
        <PageHeader
          title="Reception Desk"
          subtitle="Search a patient by mobile number on the left, then view history and order tests on the right."
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus size={16} />}
              onClick={openRegisterModal}
            >
              Register New Patient
            </Button>
          }
        />

        {/* ============================================================ */}
        {/* MAIN SPLIT-PANEL GRID                                         */}
        {/* Left (35%) = patient search panel                             */}
        {/* Right (65%) = patient profile + order history                 */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ================================================ */}
          {/* LEFT PANEL — Patient Search & Selection           */}
          {/* ================================================ */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-5 flex flex-col gap-4 sticky top-4">

              {/* Section heading */}
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Search size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Patient Lookup</h2>
                  <p className="text-[11px] text-gray-400">Search by mobile number</p>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type mobile number (e.g. 0771234567)"
                  className="w-full rounded-lg border border-gray-200 pl-10 pr-9 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Hint to type more digits */}
              {searchQuery.trim().length > 0 && searchQuery.trim().length < 4 && (
                <p className="text-[11px] text-gray-400 -mt-2">
                  Type <strong>{4 - searchQuery.trim().length}</strong> more digit(s) to auto-search...
                </p>
              )}

              {/* Loading state */}
              {searchLoading && (
                <div className="py-6 flex justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              )}

              {/* Patient result cards */}
              {!searchLoading && hasSearched && searchResults.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-gray-500 font-medium">
                    {searchResults.length} record{searchResults.length === 1 ? '' : 's'} found
                  </p>
                  {searchResults.map((patient) => {
                    const age = computeAge(patient.dateOfBirth);
                    const isSelected = selectedPatient?.id === patient.id;
                    return (
                      <div
                        key={patient.id}
                        className={`border rounded-xl p-3.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                            : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-gray-900 text-sm leading-tight">
                              {patient.fullName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 flex-wrap">
                              <span>{patient.gender}</span>
                              {age !== null && <span>• {age} yrs</span>}
                              <span>• {patient.contactNumber}</span>
                              {patient.guardianName && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-800">
                                  <ShieldAlert size={9} />
                                  MINOR
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 flex-shrink-0">
                            P-{String(patient.id).padStart(4, '0')}
                          </span>
                        </div>
                        <div className="mt-2.5">
                          <Button
                            variant={isSelected ? 'primary' : 'secondary'}
                            size="xs"
                            className="w-full"
                            rightIcon={<ArrowRight size={12} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPatient(patient);
                            }}
                          >
                            {isSelected ? 'Selected ✓' : 'Select Patient'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No patient found */}
              {!searchLoading && hasSearched && searchResults.length === 0 && (
                <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col gap-2 text-center items-center">
                  <Users size={20} className="text-gray-400" />
                  <p className="text-xs font-bold text-gray-700">No Patient Found</p>
                  <p className="text-[11px] text-gray-500">
                    No records for "{searchQuery}". Register as a new patient?
                  </p>
                  <Button
                    variant="primary"
                    size="xs"
                    leftIcon={<UserPlus size={13} />}
                    onClick={openRegisterModal}
                  >
                    Register Patient
                  </Button>
                </div>
              )}

              {/* Initial prompt */}
              {!hasSearched && (
                <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg text-[11px] text-blue-800 flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>
                    Enter the patient's mobile number above.
                    Matches auto-populate as you type.
                    If new, click <strong>"Register New Patient"</strong> above.
                  </span>
                </div>
              )}

              {/* Register button at bottom of left panel */}
              <div className="pt-2 border-t border-gray-100">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={<UserPlus size={15} />}
                  onClick={openRegisterModal}
                >
                  Register New Patient
                </Button>
              </div>
            </div>
          </div>

          {/* ================================================ */}
          {/* RIGHT PANEL — Patient Profile & Order History     */}
          {/* ================================================ */}
          <div className="lg:col-span-8 flex flex-col gap-4">

            {/* Empty state — no patient selected yet */}
            {!selectedPatient && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-12 flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users size={28} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-700 text-base">No Patient Selected</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Search and select a patient on the left to view their diagnostic history and allocate new tests.
                  </p>
                </div>
              </div>
            )}

            {/* Patient Profile + Orders — shown when a patient is selected */}
            {selectedPatient && (
              <>
                {/* Patient Profile Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 no-print">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                    {/* Left: Avatar + Name */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 font-semibold text-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                        {selectedPatient.fullName ? selectedPatient.fullName.charAt(0).toUpperCase() : <User size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-lg font-bold text-gray-900">{selectedPatient.fullName}</h1>
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                            P-{String(selectedPatient.id).padStart(4, '0')}
                          </span>
                          <Badge variant={selectedPatient.gender?.toUpperCase() === 'FEMALE' ? 'purple' : 'blue'}>
                            {selectedPatient.gender || 'Unknown'}
                          </Badge>
                          {selectedPatient.guardianName && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              <ShieldAlert size={12} className="text-amber-600" />
                              MINOR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                          {computeAge(selectedPatient.dateOfBirth) !== null && (
                            <span>Age: <strong className="text-gray-700">{computeAge(selectedPatient.dateOfBirth)} yrs</strong></span>
                          )}
                          {selectedPatient.dateOfBirth && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Calendar size={11} className="text-gray-400" />
                                DOB: {selectedPatient.dateOfBirth}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Allocate Tests button */}
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus size={15} />}
                      onClick={handleOpenAllocationModal}
                    >
                      Allocate New Tests
                    </Button>
                  </div>

                  {/* Demographics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5 mt-3.5 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
                      <Phone size={13} className="text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 block">Contact</span>
                        <span className="font-medium text-gray-800">{selectedPatient.contactNumber || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
                      <Stethoscope size={13} className="text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 block">Doctor</span>
                        <span className="font-medium text-gray-800 truncate">{selectedPatient.referringDoctor || 'Self / Walk-in'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
                      <MapPin size={13} className="text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 block">Address</span>
                        <span className="font-medium text-gray-800 truncate">{selectedPatient.address || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/70 border border-gray-100">
                      <History size={13} className="text-blue-600 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 block">Total Orders</span>
                        <span className="font-medium text-gray-900">{orders.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role restriction notice for Receptionist */}
                  {isReceptionist && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                      <ShieldAlert size={13} className="text-amber-600 flex-shrink-0" />
                      <span>Receptionist View — Clinical result values are restricted and not shown here.</span>
                    </div>
                  )}
                </div>

                {/* Diagnostic Order History */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 flex flex-col gap-4 no-print">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <History size={16} />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Diagnostic Order History</h2>
                        <p className="text-[11px] text-gray-400">All lab orders placed for this patient</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={refreshOrders}
                        disabled={ordersLoading}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Refresh orders"
                      >
                        <RefreshCw size={15} className={ordersLoading ? 'animate-spin' : ''} />
                      </button>
                      <Button
                        variant="primary"
                        size="xs"
                        leftIcon={<Plus size={13} />}
                        onClick={handleOpenAllocationModal}
                      >
                        Allocate Tests
                      </Button>
                    </div>
                  </div>

                  {/* Orders table or empty state */}
                  {ordersLoading ? (
                    <div className="py-10 flex justify-center">
                      <LoadingSpinner message="Loading order history..." />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-10 flex flex-col items-center text-center gap-3">
                      <FileText size={28} className="text-gray-300" />
                      <p className="text-sm font-bold text-gray-500">No Diagnostic Orders Yet</p>
                      <p className="text-xs text-gray-400 max-w-xs">
                        This patient has no recorded lab orders. Click "Allocate Tests" to place the first order.
                      </p>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus size={14} />}
                        onClick={handleOpenAllocationModal}
                      >
                        Allocate First Test
                      </Button>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Lab Slip Barcode</th>
                            <th className="py-2.5 px-3">Tests</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-800">
                          {orders.map((ord) => {
                            const formattedDate = ord.createdAt
                              ? new Date(ord.createdAt).toLocaleDateString([], {
                                  year: 'numeric', month: 'short', day: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })
                              : 'N/A';
                            const statusUpper = ord.status?.toUpperCase() || 'PENDING';

                            return (
                              <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span className="flex items-center gap-1 text-gray-600">
                                    <Clock size={12} className="text-gray-400" />
                                    {formattedDate}
                                  </span>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span className="inline-flex items-center gap-1 font-mono font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                    <Barcode size={11} className="text-gray-500" />
                                    {ord.labSlipBarcode}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {ord.orderTests?.map((ot, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-700"
                                      >
                                        {ot.testName} ({ot.testCode})
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-3 px-3 whitespace-nowrap">
                                  {renderOrderStatusBadge(ord.status)}
                                </td>
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      variant="secondary"
                                      size="xs"
                                      leftIcon={<Printer size={11} />}
                                      onClick={() => setViewingPastOrder(ord)}
                                    >
                                      View Slip
                                    </Button>
                                    {/* Collect Samples button — hidden for Receptionist */}
                                    {!isReceptionist && (statusUpper === 'PENDING' || statusUpper === 'IN_PROGRESS') && (
                                      <Button
                                        variant="primary"
                                        size="xs"
                                        leftIcon={<Droplet size={11} />}
                                        onClick={() => navigate(`/collection?slip=${ord.labSlipBarcode}`)}
                                      >
                                        Collect
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: REGISTER NEW PATIENT                                   */}
      {/* ============================================================ */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => { setRegisterModalOpen(false); setExistingPatientsForNumber([]); }}
        title="Register New Patient"
        size="lg"
      >
        <form onSubmit={handleRegisterPatient} className="flex flex-col gap-4 py-2">
          {/* Full Name + Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <FormInput
              label="Patient Full Name"
              placeholder="e.g. Kamal Perera"
              value={newPatient.fullName}
              onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
              required
              autoFocus
            />
            <div className="flex flex-col">
              <FormInput
                label="Mobile / Contact Number"
                type="tel"
                placeholder="e.g. 0771234567"
                value={newPatient.contactNumber}
                onChange={(e) => setNewPatient({ ...newPatient, contactNumber: e.target.value })}
                required
              />
              {checkingNumberLoading && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1.5">
                  <LoadingSpinner size="sm" inline />
                  <span>Checking existing records...</span>
                </div>
              )}
              {!checkingNumberLoading && existingPatientsForNumber.length > 0 && (
                <div className="mt-2 p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg flex flex-col gap-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Users size={13} className="text-blue-700 flex-shrink-0" />
                    <span>{existingPatientsForNumber.length} patient(s) already share this number:</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {existingPatientsForNumber.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-800 text-[11px] font-medium">
                        <strong>{p.fullName}</strong> ({p.gender?.charAt(0)}, P-{String(p.id).padStart(4, '0')})
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">✓ You can still register a new family member under this number.</span>
                </div>
              )}
            </div>
          </div>

          {/* Age, DOB, Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormInput
              label="Age (Years)"
              type="number"
              placeholder="e.g. 28"
              min="0"
              max="125"
              value={newPatient.ageYears}
              onChange={(e) => handleAgeChange(e.target.value)}
            />
            <FormInput
              label="Date of Birth"
              type="date"
              value={newPatient.dateOfBirth}
              onChange={(e) => handleDobChange(e.target.value)}
              required
            />
            <FormSelect
              label="Sex / Gender"
              value={newPatient.gender}
              onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ]}
              required
            />
          </div>

          {/* Minor Warning + Guardian Name */}
          {isMinor && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                <ShieldAlert size={15} className="text-amber-600 flex-shrink-0" />
                <span>Minor Patient (&lt; 18 yrs) — Guardian name is mandatory by lab policy.</span>
              </div>
              <FormInput
                label="Legal Guardian Name"
                placeholder="e.g. Parent or Guardian Name"
                value={newPatient.guardianName}
                onChange={(e) => setNewPatient({ ...newPatient, guardianName: e.target.value })}
                required={isMinor}
              />
            </div>
          )}

          {/* Referring Doctor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">Referring Doctor / Consultant</label>
              <button
                type="button"
                onClick={handleToggleSelfDoctor}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors ${
                  newPatient.referringDoctor === 'Self / Walk-in'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {newPatient.referringDoctor === 'Self / Walk-in' ? '✓ Self / Walk-in Set' : '+ Set as Self / Walk-in'}
              </button>
            </div>
            <div className="relative">
              <Stethoscope size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={newPatient.referringDoctor}
                onChange={(e) => setNewPatient({ ...newPatient, referringDoctor: e.target.value })}
                placeholder="e.g. Dr. Silva, Consultant, or Self / Walk-in"
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Address */}
          <FormInput
            label="Residential Address (Optional)"
            placeholder="e.g. 45 Galle Road, Colombo"
            value={newPatient.address}
            onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <Button type="button" variant="secondary" onClick={() => setRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={registering}
              rightIcon={<ArrowRight size={16} />}
            >
              Register & Select Patient
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: ALLOCATE DIAGNOSTIC TESTS                              */}
      {/* ============================================================ */}
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
              <Button variant="secondary" size="sm" onClick={() => setAllocationModalOpen(false)}>
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
          {/* Context: who are we ordering for */}
          {selectedPatient && (
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-center justify-between">
              <span>
                Ordering for: <strong>{selectedPatient.fullName}</strong> (P-{String(selectedPatient.id).padStart(4, '0')})
              </span>
              <span className="text-gray-500">
                Doctor: <strong>{selectedPatient.referringDoctor || 'Self / Walk-in'}</strong>
              </span>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-2.5 text-gray-400" />
            <input
              type="text"
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              placeholder="Search tests by name or code (e.g. FBC, Fasting Blood Sugar)..."
              className="w-full rounded-xl border border-gray-200 pl-10 pr-10 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {testSearch && (
              <button
                type="button"
                onClick={() => setTestSearch('')}
                className="absolute right-3.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Test cards grid */}
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
                onClick={() => { setTestSearch(''); setSelectedCategory('ALL'); }}
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
                    className={`border rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between gap-2 select-none ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-gray-50/50'
                    }`}
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
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white text-transparent'
                        }`}
                      >
                        <Check size={10} strokeWidth={3} />
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

          {/* Selected tests summary tray */}
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
              <div className="flex flex-wrap gap-1.5">
                {selectedTestObjects.map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[11px] font-medium text-blue-800"
                  >
                    <span>{t.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleToggleTest(t.id); }}
                      className="text-blue-500 hover:text-red-600"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ============================================================ */}
      {/* MODAL: PRINTABLE DUAL SLIP PREVIEW                            */}
      {/* ============================================================ */}
      {(createdOrder || viewingPastOrder) && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 flex flex-col gap-6 my-8">

            {/* Slip Modal Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 no-print">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-600" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
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
                    leftIcon={<Droplet size={14} />}
                    onClick={() => {
                      const code = (createdOrder || viewingPastOrder).labSlipBarcode;
                      navigate(`/collection?slip=${code}`);
                    }}
                  >
                    Collect Samples
                  </Button>
                )}
                <Button variant="outline" size="sm" leftIcon={<Printer size={14} />} onClick={handlePrintSlips}>
                  Print Slips
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setCreatedOrder(null); setViewingPastOrder(null); }}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* Printable dual slip area */}
            <div id="printable-slip-area" className="flex flex-col gap-6 bg-white p-2">

              {/* Slip 1: Patient Receipt Copy */}
              <div className="border-2 border-gray-900 rounded-lg p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between border-b-2 border-gray-900 pb-2">
                  <div>
                    <h1 className="text-base font-bold uppercase text-gray-900 tracking-wider">
                      Hospital Diagnostic Laboratory
                    </h1>
                    <p className="text-[11px] font-medium text-gray-600">Patient Test Order Receipt / Collection Slip</p>
                  </div>
                  <div className="text-right text-[11px] text-gray-700">
                    <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border border-gray-300 text-xs">
                  <div>
                    <p className="text-gray-500 text-[10px]">Patient Name</p>
                    <p className="font-bold text-gray-900 text-sm">{selectedPatient.fullName}</p>
                    <p className="text-gray-600 mt-1">
                      <strong>ID:</strong> P-{String(selectedPatient.id).padStart(4, '0')} • {selectedPatient.gender} • {computeAge(selectedPatient.dateOfBirth) ? `${computeAge(selectedPatient.dateOfBirth)} yrs` : ''}
                    </p>
                    <p className="text-gray-600"><strong>Mobile:</strong> {selectedPatient.contactNumber}</p>
                    <p className="text-gray-600"><strong>Doctor:</strong> {selectedPatient.referringDoctor || 'Self / Walk-in'}</p>
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
                          <td className="py-1 px-2 font-mono font-semibold text-blue-700">{ot.testSampleCode || 'TSC-PENDING'}</td>
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

              {/* Tear line */}
              <div className="relative py-1 flex items-center justify-center">
                <div className="border-t-2 border-dashed border-gray-400 w-full" />
                <span className="absolute bg-white px-3 text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                  ✂ Tear along dashed line for Laboratory Routing Copy
                </span>
              </div>

              {/* Slip 2: Laboratory Internal Routing Copy */}
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
                  <span><strong>Patient:</strong> {selectedPatient.fullName} (P-{String(selectedPatient.id).padStart(4, '0')})</span>
                  <span><strong>Gender/Age:</strong> {selectedPatient.gender} / {computeAge(selectedPatient.dateOfBirth) ? `${computeAge(selectedPatient.dateOfBirth)} yrs` : '-'}</span>
                  <span><strong>Doctor:</strong> {selectedPatient.referringDoctor || 'Self / Walk-in'}</span>
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
    </Layout>
  );
};

export default ReceptionPage;
