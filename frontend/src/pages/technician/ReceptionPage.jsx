import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import reportService from '../../services/reportService';
import {
  PageHeader,
  Button,
  FormInput,
  FormSelect,
  LoadingSpinner,
  Modal,
  Badge,
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
  User,
  Barcode,
  FileText,
  Download,
  ExternalLink,
  Copy,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';

/**
 * ReceptionPage — Modern Patient Reception Desk
 *
 * Workflow:
 * 1. Receptionist / Lab Tech looks up patient by mobile number (auto-searches after 4 digits).
 * 2. If matching records exist:
 *      Displays patient cards. Clicking "Open Patient Details" navigates to `/patients/:id`
 *      where full history, test allocation, and slips are managed.
 * 3. If patient not found:
 *      Staff can click "Register New Patient" to open registration modal.
 *      On submission, system creates patient and immediately navigates to `/patients/:id`.
 * 4. Report Pickup (FR-7.4):
 *      Counter lookup modal to retrieve and print finalized PDF reports by scanning any barcode.
 */
const ReceptionPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  // Role check: Receptionist role restriction notice if needed
  const userRole = localStorage.getItem('role')?.toUpperCase();
  const isReceptionist = userRole === 'RECEPTIONIST';

  // ============================================================
  // SEARCH STATE
  // ============================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
  // IN-PERSON REPORT RETRIEVAL MODAL STATE (FR-7.4)
  // ============================================================
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportBarcodeQuery, setReportBarcodeQuery] = useState('');
  const [retrievedReports, setRetrievedReports] = useState([]);
  const [reportLookupLoading, setReportLookupLoading] = useState(false);
  const [reportLookupSearched, setReportLookupSearched] = useState(false);

  // ============================================================
  // DEBOUNCED SEARCH (Triggers after 4 digits)
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

  // Navigates directly to the dedicated Patient Details page
  const handleSelectPatient = (patient) => {
    navigate(`/patients/${patient.id}`);
  };

  // ============================================================
  // REGISTER PATIENT — Family Number Detection & DOB/Age Sync
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

  // Synchronize Age -> Date of Birth
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

  // Synchronize Date of Birth -> Age
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

  // Submit new patient and immediately navigate to their patient page
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

      // Navigate directly to the newly registered patient's details page
      navigate(`/patients/${createdPatient.id}`);
    } catch (err) {
      console.error('Failed to register patient:', err);
      showError(err.response?.data?.message || 'Failed to register patient.', 'Registration Error');
    } finally {
      setRegistering(false);
    }
  };

  // ============================================================
  // IN-PERSON REPORT RETRIEVAL HANDLER (FR-7.4)
  // ============================================================
  const handleLookupReport = async (codeToQuery) => {
    const code = (codeToQuery || reportBarcodeQuery).trim();
    if (!code) {
      showError('Please enter or scan a barcode.', 'Validation Error');
      return;
    }
    setReportLookupLoading(true);
    setReportLookupSearched(true);
    try {
      const data = await reportService.lookupReportsByBarcode(code);
      setRetrievedReports(data || []);
      if (data && data.length > 0) {
        showSuccess(`Found ${data.length} official report(s) for ${code}.`);
      }
    } catch (err) {
      setRetrievedReports([]);
      showError(err.response?.data?.message || 'No verified diagnostic reports found for this code.', 'Not Found');
    } finally {
      setReportLookupLoading(false);
    }
  };

  const handleCopyPatientReportLink = (rep) => {
    const link = rep.shareLink || `${window.location.origin}/report/${rep.shareToken}`;
    navigator.clipboard.writeText(link);
    showSuccess('Patient web report link copied to clipboard! You can share this with the patient.', 'Link Copied');
  };

  const computeAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    return new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  };

  return (
    <Layout title="Reception Desk">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-16">
        {/* Page Header */}
        <PageHeader
          title="Reception Desk"
          subtitle="Search patients by mobile number to access patient records & allocate tests, or register a new walk-in patient."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileText size={15} />}
                onClick={() => {
                  setReportModalOpen(true);
                  setReportBarcodeQuery('');
                  setRetrievedReports([]);
                  setReportLookupSearched(false);
                }}
              >
                Report Pickup (Barcode)
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus size={16} />}
                onClick={openRegisterModal}
              >
                Register New Patient
              </Button>
            </div>
          }
        />

        {/* ======================================================== */}
        {/* PATIENT LOOKUP SEARCH CARD                               */}
        {/* ======================================================== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Search size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Patient Lookup</h2>
                <p className="text-xs text-gray-500">
                  Search registered patient records by mobile number to open details and prescribe tests.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<UserPlus size={14} />}
              onClick={openRegisterModal}
            >
              + Walk-in Registration
            </Button>
          </div>

          {/* Search Input Box */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter mobile number (e.g. 0771234567)..."
                className="w-full rounded-xl border border-gray-300 pl-11 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Hint when user typed 1-3 digits */}
            {searchQuery.trim().length > 0 && searchQuery.trim().length < 4 && (
              <p className="text-xs text-gray-400 pl-1">
                Type <strong>{4 - searchQuery.trim().length}</strong> more digit(s) to auto-search...
              </p>
            )}
          </div>

          {/* Loading State */}
          {searchLoading && (
            <div className="py-10 flex flex-col items-center justify-center gap-2">
              <LoadingSpinner size="md" />
              <p className="text-xs text-gray-500">Searching patient database...</p>
            </div>
          )}

          {/* ======================================================== */}
          {/* SEARCH RESULTS: Matching Patients Found                  */}
          {/* ======================================================== */}
          {!searchLoading && hasSearched && searchResults.length > 0 && (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 font-medium px-1">
                <span>{searchResults.length} patient record{searchResults.length === 1 ? '' : 's'} found</span>
                <span className="text-blue-600">Click a patient to open details & order history</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {searchResults.map((patient) => {
                  const age = computeAge(patient.dateOfBirth);
                  return (
                    <div
                      key={patient.id}
                      onClick={() => handleSelectPatient(patient)}
                      className="border border-gray-200 hover:border-blue-500 hover:shadow-md bg-white hover:bg-blue-50/20 rounded-xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                    >
                      {/* Left: Avatar + Details */}
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 font-semibold text-base flex items-center justify-center flex-shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : <User size={20} />}
                        </div>

                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                              {patient.fullName}
                            </span>
                            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                              P-{String(patient.id).padStart(4, '0')}
                            </span>
                            <Badge variant={patient.gender?.toUpperCase() === 'FEMALE' ? 'purple' : 'blue'}>
                              {patient.gender || 'Unknown'}
                            </Badge>
                            {patient.guardianName && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                <ShieldAlert size={11} className="text-amber-600" />
                                Minor (Guardian: {patient.guardianName})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                            {age !== null && <span>Age: <strong>{age} yrs</strong></span>}
                            <span>•</span>
                            <span className="flex items-center gap-1 font-mono text-gray-700">
                              <Phone size={12} className="text-gray-400" />
                              {patient.contactNumber}
                            </span>
                            {patient.referringDoctor && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Stethoscope size={12} className="text-gray-400" />
                                  {patient.referringDoctor}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Button */}
                      <div className="self-end sm:self-center flex-shrink-0">
                        <Button
                          variant="primary"
                          size="sm"
                          rightIcon={<ArrowRight size={14} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatient(patient);
                          }}
                        >
                          Open Patient Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SEARCH RESULTS: No Patient Found                         */}
          {/* ======================================================== */}
          {!searchLoading && hasSearched && searchResults.length === 0 && (
            <div className="p-8 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center">
                <Users size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">No Patient Found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md">
                  No registered patient records match mobile number <strong>"{searchQuery}"</strong>.
                  Would you like to register this walk-in patient now?
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus size={15} />}
                onClick={openRegisterModal}
              >
                Register Walk-in Patient
              </Button>
            </div>
          )}

          {/* ======================================================== */}
          {/* INITIAL STATE: Informational Workflow Guide              */}
          {/* ======================================================== */}
          {!hasSearched && (
            <div className="p-5 bg-blue-50/40 border border-blue-100 rounded-xl flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Sparkles size={16} className="text-blue-600" />
                <span>Reception Desk Quick Guide</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                <div className="p-3 bg-white border border-blue-100 rounded-lg flex flex-col gap-1">
                  <span className="font-bold text-blue-900">1. Look up Patient</span>
                  <p className="text-[11px] text-gray-500">
                    Type their mobile number above. Search fires automatically after 4 digits.
                  </p>
                </div>
                <div className="p-3 bg-white border border-blue-100 rounded-lg flex flex-col gap-1">
                  <span className="font-bold text-blue-900">2. Open Profile</span>
                  <p className="text-[11px] text-gray-500">
                    Click "Open Patient Details" to inspect order history & prescribe new diagnostic tests.
                  </p>
                </div>
                <div className="p-3 bg-white border border-blue-100 rounded-lg flex flex-col gap-1">
                  <span className="font-bold text-blue-900">3. Walk-in Registration</span>
                  <p className="text-[11px] text-gray-500">
                    If this is a new patient, click "+ Walk-in Registration" to create their record in seconds.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: REGISTER NEW PATIENT                                   */}
      {/* ============================================================ */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => {
          setRegisterModalOpen(false);
          setExistingPatientsForNumber([]);
        }}
        title="Register New Walk-in Patient"
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
              Register & Open Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================ */}
      {/* IN-PERSON REPORT RETRIEVAL MODAL (FR-7.4)                   */}
      {/* ============================================================ */}
      <Modal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        title="In-Person Diagnostic Report Counter Pickup (FR-7.4)"
        size="lg"
      >
        <div className="flex flex-col gap-4 text-xs">
          <p className="text-gray-600">
            Scan or enter the patient's <strong>Lab Slip Barcode (LS-...)</strong>, <strong>Patient Slip Barcode (PS-...)</strong>, or <strong>Container Sticker (SC...)</strong> to retrieve and print their finalized diagnostic reports.
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={reportBarcodeQuery}
                onChange={(e) => setReportBarcodeQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLookupReport();
                  }
                }}
                placeholder="Scan or enter barcode (e.g. LS-2026-00456)"
                className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              loading={reportLookupLoading}
              onClick={() => handleLookupReport()}
            >
              Lookup Reports
            </Button>
          </div>

          {reportLookupLoading && (
            <div className="py-6 flex justify-center">
              <LoadingSpinner size="sm" />
            </div>
          )}

          {!reportLookupLoading && reportLookupSearched && retrievedReports.length === 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
              No verified diagnostic reports found for <strong>{reportBarcodeQuery}</strong>.
            </div>
          )}

          {!reportLookupLoading && retrievedReports.length > 0 && (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {retrievedReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                        {rep.reportNumber}
                      </span>
                      <span className="font-semibold text-gray-900">{rep.testName}</span>
                      <span className="text-gray-400">({rep.testCode})</span>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-0.5">
                      Patient: <strong>{rep.patientName}</strong> • Verified: {rep.generatedAt ? new Date(rep.generatedAt).toLocaleString() : '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="xs"
                      leftIcon={<ExternalLink size={12} />}
                      onClick={() => reportService.openReportPdfInNewTab(rep.testResultId)}
                    >
                      View / Print
                    </Button>
                    <Button
                      variant="secondary"
                      size="xs"
                      leftIcon={<Copy size={12} />}
                      onClick={() => handleCopyPatientReportLink(rep)}
                      title="Copy Patient Web Link"
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      leftIcon={<Download size={12} />}
                      onClick={() => reportService.downloadReportPdfByResultId(rep.testResultId, `${rep.reportNumber}.pdf`)}
                    >
                      Download PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReportModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default ReceptionPage;
