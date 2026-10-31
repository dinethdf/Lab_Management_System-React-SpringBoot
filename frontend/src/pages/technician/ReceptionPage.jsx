import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import {
  PageHeader,
  Button,
  FormInput,
  FormSelect,
  LoadingSpinner,
  Modal,
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
} from 'lucide-react';

/**
 * ReceptionPage — Clean, focused Patient Search with a dedicated "+ Register New Patient" modal.
 *
 * Workflow:
 * 1. Main View: Fast, mobile-first search.
 *    - Auto-searches after 4 characters are entered.
 *    - Displays all matching records for families sharing the same phone number.
 *    - Each card has a "Select & View History" button that opens `/patients/:id`.
 * 2. Dedicated "+ Register New Patient" button in the header and on the page:
 *    - Opens a clean registration modal.
 *    - Age/DOB auto-calculator + minor (<18) guardian requirement.
 *    - Referring doctor with "Self / Walk-in" toggle.
 *    - Navigates directly to the new patient's history page upon save.
 */
const ReceptionPage = () => {
  const navigate = useNavigate();

  // ----------------------------------------------------
  // SEARCH STATE
  // ----------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ----------------------------------------------------
  // REGISTRATION MODAL STATE
  // ----------------------------------------------------
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

  // Existing patients detected for the entered mobile number in registration form
  const [existingPatientsForNumber, setExistingPatientsForNumber] = useState([]);
  const [checkingNumberLoading, setCheckingNumberLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  // ----------------------------------------------------
  // LIVE AUTO-SEARCH (Debounced after 4+ characters)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // CHECK EXISTING PATIENTS FOR ENTERED REGISTRATION NUMBER
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // AGE & DOB SYNCHRONIZATION
  // ----------------------------------------------------
  const handleAgeChange = (value) => {
    const ageNum = parseInt(value, 10);
    if (!isNaN(ageNum) && ageNum >= 0) {
      const currentYear = new Date().getFullYear();
      const calculatedBirthYear = currentYear - ageNum;
      const estimatedDob = `${calculatedBirthYear}-01-01`;
      setNewPatient((prev) => ({
        ...prev,
        ageYears: value,
        dateOfBirth: estimatedDob,
      }));
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
      setNewPatient((prev) => ({
        ...prev,
        dateOfBirth: value,
        ageYears: age >= 0 ? String(age) : '',
      }));
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

  const openRegisterModalWithSearch = () => {
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

  // ----------------------------------------------------
  // REGISTER NEW PATIENT
  // ----------------------------------------------------
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
      // Navigate immediately to the new patient's history & ordering page
      navigate(`/patients/${createdPatient.id}`);
    } catch (err) {
      console.error('Failed to register patient:', err);
      showError(err.response?.data?.message || 'Failed to register patient.', 'Registration Error');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Layout title="Reception Desk">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-12">
        {/* Header with "+ Register New Patient" Action */}
        <PageHeader
          title="Reception Desk — Patient Lookup"
          subtitle="Search existing patients by mobile number to review diagnostic history and issue new test orders."
          actions={
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus size={16} />}
              onClick={openRegisterModalWithSearch}
            >
              Register New Patient
            </Button>
          }
        />

        {/* Clean, Full-Width Patient Search Card */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Search size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Patient Mobile Lookup</h2>
              <p className="text-xs text-gray-500">
                Enter 4 or more digits to search. If multiple family members share a number, all will be listed below.
              </p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Phone size={18} className="absolute left-4 top-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type patient mobile number (e.g. 0771234567)..."
              className="w-full rounded-xl border border-gray-200 pl-11 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-xs"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 p-0.5"
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Helper hint when fewer than 4 digits */}
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 4 && (
            <p className="text-xs text-gray-500 -mt-2">
              Type at least <strong>{4 - searchQuery.trim().length}</strong> more digit(s) to start auto-searching...
            </p>
          )}

          {/* Loading Indicator */}
          {searchLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
              <LoadingSpinner size="md" />
              <span>Searching patient records...</span>
            </div>
          )}

          {/* Matching Patients Results Grid */}
          {!searchLoading && hasSearched && searchResults.length > 0 && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center justify-between text-xs text-gray-700 font-semibold px-1">
                <span>Matching Patients for "{searchQuery}":</span>
                <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                  {searchResults.length} record{searchResults.length === 1 ? '' : 's'} found
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map((patient) => {
                  const calculatedAge = patient.dateOfBirth
                    ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
                    : null;
                  const minor = Boolean(patient.guardianName);

                  return (
                    <div
                      key={patient.id}
                      className="border border-gray-200 hover:border-blue-500 hover:shadow-xs rounded-xl p-5 transition-all bg-white flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">{patient.fullName}</h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 flex-wrap">
                              <span className="font-medium text-gray-800">{patient.gender}</span>
                              {calculatedAge !== null && <span>• {calculatedAge} yrs</span>}
                              <span>• {patient.contactNumber}</span>
                              {minor && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  <ShieldAlert size={11} />
                                  MINOR
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 flex-shrink-0">
                            P-{String(patient.id).padStart(4, '0')}
                          </span>
                        </div>

                        {patient.referringDoctor && (
                          <p className="text-xs text-gray-500 mt-2">
                            Doctor: <span className="font-semibold text-gray-700">{patient.referringDoctor}</span>
                          </p>
                        )}

                        {patient.guardianName && (
                          <p className="text-xs text-amber-700 mt-0.5">
                            Guardian: <span className="font-semibold">{patient.guardianName}</span>
                          </p>
                        )}
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        rightIcon={<ArrowRight size={15} />}
                        onClick={() => navigate(`/patients/${patient.id}`)}
                      >
                        Select & View History
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State when no records found */}
          {!searchLoading && hasSearched && searchResults.length === 0 && (
            <div className="p-8 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col gap-3 text-center items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">No Patient Found</p>
                <p className="text-xs text-gray-500 mt-0.5 max-w-sm">
                  No registered patient records match mobile number "{searchQuery}". You can register them as a new patient.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus size={16} />}
                onClick={openRegisterModalWithSearch}
              >
                Register Patient with This Mobile Number
              </Button>
            </div>
          )}

          {/* Initial Guidance Card when search is untouched */}
          {!hasSearched && (
            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block text-blue-900 mb-0.5">Walk-in Patient Lookup</span>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Enter the patient's mobile number above. Matches will auto-populate as you type. If this is a new patient, click <strong>"Register New Patient"</strong> to add their details and immediately proceed to their diagnostic history and test ordering.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* DEDICATED MODAL: REGISTER NEW PATIENT                    */}
        {/* ======================================================== */}
        <Modal
          isOpen={registerModalOpen}
          onClose={() => {
            setRegisterModalOpen(false);
            setExistingPatientsForNumber([]);
          }}
          title="Register New Patient"
          size="lg"
        >
          <form onSubmit={handleRegisterPatient} className="flex flex-col gap-4 py-2">
            {/* Full Name & Contact Number */}
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

                {/* Loading indicator while checking number */}
                {checkingNumberLoading && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1.5">
                    <LoadingSpinner size="sm" inline />
                    <span>Checking existing records...</span>
                  </div>
                )}

                {/* Display existing patients found for this mobile number (non-blocking) */}
                {!checkingNumberLoading && existingPatientsForNumber.length > 0 && (
                  <div className="mt-2 p-2.5 bg-blue-50/80 border border-blue-200 rounded-lg flex flex-col gap-1 text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900">
                      <Users size={14} className="text-blue-700 flex-shrink-0" />
                      <span>{existingPatientsForNumber.length} patient(s) already share this number:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-0.5 max-h-24 overflow-y-auto">
                      {existingPatientsForNumber.map((p) => (
                        <span
                          key={p.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-800 text-[11px] font-medium"
                        >
                          <strong>{p.fullName}</strong> ({p.gender?.charAt(0)}, P-{String(p.id).padStart(4, '0')})
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-blue-600 mt-0.5 font-medium">
                      ✓ You can proceed to register this new family member under this same number.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Age, DOB, and Gender */}
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

            {/* Minor Detection Notice & Guardian Name Field */}
            {isMinor && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <ShieldAlert size={16} className="text-amber-600 flex-shrink-0" />
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

            {/* Referring Doctor with Self / Walk-in Quick Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">Referring Doctor / Consultant</label>
                <button
                  type="button"
                  onClick={handleToggleSelfDoctor}
                  className={`
                    text-[11px] font-semibold px-2 py-0.5 rounded border transition-colors
                    ${newPatient.referringDoctor === 'Self / Walk-in'
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {newPatient.referringDoctor === 'Self / Walk-in' ? '✓ Self / Walk-in Set' : '+ Set as Self / Walk-in'}
                </button>
              </div>
              <div className="relative">
                <Stethoscope size={15} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={newPatient.referringDoctor}
                  onChange={(e) => setNewPatient({ ...newPatient, referringDoctor: e.target.value })}
                  placeholder="e.g. Dr. Silva, Consultant, or Self / Walk-in"
                  className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Residential Address */}
            <FormInput
              label="Residential Address (Optional)"
              placeholder="e.g. 45 Galle Road, Colombo"
              value={newPatient.address}
              onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRegisterModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={registering}
                rightIcon={<ArrowRight size={16} />}
              >
                Register & Open History
              </Button>
            </div>
          </form>
        </Modal>

      </div>
    </Layout>
  );
};

export default ReceptionPage;
