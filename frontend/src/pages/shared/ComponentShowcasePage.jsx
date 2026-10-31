import React, { useState } from 'react';
import Layout from '../../components/Layout';
import {
  Button,
  Badge,
  FormInput,
  FormSelect,
  FormTextarea,
  LoadingSpinner,
  ErrorAlert,
  SuccessAlert,
  EmptyState,
  Modal,
  ConfirmDialog,
  PageHeader,
  StepWizard,
  SampleStatusBadge,
  ResultValueCell,
  PatientInfoCard,
  AutoCompleteSearch,
  TestCheckboxList,
  BarcodeInput,
  DataTable,
  QuickActionCard,
  useToast,
} from '../../components/ui';
import {
  Palette,
  CheckCircle,
  FlaskConical,
  Sparkles,
  RefreshCw,
  Plus,
  Send,
  Eye,
  Trash2,
  FileText,
  Users,
} from 'lucide-react';

/**
 * ComponentShowcasePage — Interactive playground to test and review all common UI components.
 *
 * Demonstrates:
 * 1. Buttons & Badges (Design Tokens)
 * 2. Form Inputs (Text, Password with Eye toggle, Select, Textarea)
 * 3. Feedback & Alerts (Loading, Error with Retry, Success countdown, Empty State)
 * 4. Lab-Specific Display (SampleStatusBadge, ResultValueCell, PatientInfoCard)
 * 5. Advanced Lab Inputs (AutoCompleteSearch, TestCheckboxList, BarcodeInput)
 * 6. Overlays & Navigation (Modal, ConfirmDialog, StepWizard, PageHeader, DataTable)
 */
const ComponentShowcasePage = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  // --- State for interactive demos ---

  // PageHeader tabs
  const [activeHeaderTab, setActiveHeaderTab] = useState('ALL');

  // Button loading test
  const [btnLoading, setBtnLoading] = useState(false);

  // Form input states
  const [inputText, setInputText] = useState('Kamal Perera');
  const [inputPassword, setInputPassword] = useState('SecretLab123');
  const [inputError, setInputError] = useState('Sample invalid mobile number');
  const [selectValue, setSelectValue] = useState('');
  const [textareaValue, setTextareaValue] = useState(
    'Hemolysis observed in specimen tube. Specimen must be recollected.'
  );

  // Alerts demonstration
  const [showErrorAlert, setShowErrorAlert] = useState(true);
  const [showSuccessAlert, setShowSuccessAlert] = useState(true);

  // Modal demo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSize, setModalSize] = useState('md');

  // ConfirmDialog demo
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmRequiresReason, setConfirmRequiresReason] = useState(true);
  const [confirmDialogResult, setConfirmDialogResult] = useState('');

  // StepWizard demo
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([0]);

  // BarcodeInput demo
  const [scannedCodeOutput, setScannedCodeOutput] = useState('');
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  // AutoCompleteSearch demo
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [autoCompleteLoading, setAutoCompleteLoading] = useState(false);
  const [mockSuggestions, setMockSuggestions] = useState([]);

  // TestCheckboxList demo
  const [selectedTests, setSelectedTests] = useState([1, 3]);
  const [testListDisabled, setTestListDisabled] = useState(false);

  // DataTable demo
  const [tableLoading, setTableLoading] = useState(false);
  const [tableEmpty, setTableEmpty] = useState(false);

  // Mock catalog data for TestCheckboxList
  const demoTestsCatalog = [
    { id: 1, code: 'CBC', name: 'Complete Blood Count', category: 'Haematology', price: 1200 },
    { id: 2, code: 'FBS', name: 'Fasting Blood Sugar', category: 'Biochemistry', price: 450 },
    { id: 3, code: 'LFT', name: 'Liver Function Test', category: 'Biochemistry', price: 2800 },
    { id: 4, code: 'LIPID', name: 'Lipid Profile', category: 'Biochemistry', price: 2200 },
    { id: 5, code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'Endocrinology', price: 1800 },
    { id: 6, code: 'URINE', name: 'Urine Full Report', category: 'Microbiology', price: 500 },
  ];

  // Mock search handler for AutoCompleteSearch
  const handlePatientSearch = (query) => {
    setAutoCompleteLoading(true);
    setTimeout(() => {
      const db = [
        { id: 101, primaryLabel: 'P-0045 · Kamal Perera', subLabel: 'Mobile: 077-1234567 | Age: 34' },
        { id: 102, primaryLabel: 'P-0089 · Kamala Wickramasinghe', subLabel: 'Mobile: 077-9876543 | Age: 52' },
        { id: 103, primaryLabel: 'P-0114 · Ayesha Fernando (Minor)', subLabel: 'Mobile: 071-4567890 | Age: 14' },
      ];
      const matched = db.filter(
        (p) =>
          p.primaryLabel.toLowerCase().includes(query.toLowerCase()) ||
          p.subLabel.includes(query)
      );
      setMockSuggestions(matched);
      setAutoCompleteLoading(false);
    }, 400);
  };

  // Mock scan handler
  const handleBarcodeScan = (code) => {
    setBarcodeLoading(true);
    setTimeout(() => {
      setScannedCodeOutput(code);
      setBarcodeLoading(false);
    }, 600);
  };

  // DataTable mock rows
  const demoTableColumns = [
    {
      header: 'Container Code',
      accessor: 'code',
      cell: (row) => <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">{row.code}</span>,
    },
    { header: 'Test Name', accessor: 'testName' },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <SampleStatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Last Finding',
      accessor: 'finding',
      cell: (row) => (
        <ResultValueCell
          value={row.value}
          unit={row.unit}
          lowerLimit={row.lower}
          upperLimit={row.upper}
          flag={row.flag}
        />
      ),
    },
  ];

  const demoTableRows = [
    { id: 1, code: 'TSC-00456-01-B1', testName: 'Complete Blood Count', status: 'VERIFIED', value: 14.5, unit: 'g/dL', lower: 12.0, upper: 16.0, flag: 'NORMAL' },
    { id: 2, code: 'TSC-00456-02-Y1', testName: 'Liver Function Test', status: 'RESULT_ENTERED', value: 78, unit: 'U/L', lower: 10, upper: 40, flag: 'HIGH' },
    { id: 3, code: 'TSC-00457-01-G1', testName: 'Fasting Blood Sugar', status: 'PENDING_COLLECTION', value: null, unit: 'mg/dL', lower: 70, upper: 100 },
    { id: 4, code: 'TSC-00458-01-R1', testName: 'Lipid Profile', status: 'REJECTED', value: 310, unit: 'mg/dL', lower: 120, upper: 200, flag: 'HIGH' },
  ];

  return (
    <Layout title="UI Components Showcase">
      <div className="flex flex-col gap-10 pb-16">
        {/* Section 1: PageHeader */}
        <section>
          <PageHeader
            title="UI Component Library Showcase"
            subtitle="Interactive live preview of all 17 hospital laboratory common components and design tokens."
            tabs={[
              { label: 'All Components', value: 'ALL', count: 20 },
              { label: 'Form Elements', value: 'FORMS', count: 5 },
              { label: 'Lab Coded', value: 'LAB', count: 6 },
              { label: 'Overlays & Tables', value: 'LAYOUT', count: 5 },
            ]}
            activeTab={activeHeaderTab}
            onTabChange={setActiveHeaderTab}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshCw size={15} />}
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Sparkles size={16} />}
                  onClick={() => alert('Component Library is fully operational and styled with Tailwind!')}
                >
                  Verify System
                </Button>
              </div>
            }
          />
        </section>

        {/* Section 2: Buttons & Badges */}
        <section className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <Palette className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">
              1. Buttons & Badges (Design Tokens)
            </h2>
          </div>

          {/* Button Variants */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Button Variants
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button
                variant="primary"
                loading={btnLoading}
                onClick={() => {
                  setBtnLoading(true);
                  setTimeout(() => setBtnLoading(false), 2000);
                }}
              >
                {btnLoading ? 'Processing...' : 'Click to Test Loading State'}
              </Button>
              <Button variant="primary" leftIcon={<Plus size={16} />}>
                With Icon
              </Button>
              <Button variant="secondary" disabled>
                Disabled Button
              </Button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Button Sizes
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <Button size="sm">Small (sm)</Button>
              <Button size="md">Medium (md - Default)</Button>
              <Button size="lg">Large (lg - Tablet CTA)</Button>
            </div>
          </div>

          {/* Badge Variants */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Badge Variants
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="gray">Gray Badge</Badge>
              <Badge variant="blue">Blue Badge</Badge>
              <Badge variant="green">Green (Active)</Badge>
              <Badge variant="red">Red (Critical)</Badge>
              <Badge variant="orange">Orange</Badge>
              <Badge variant="purple">Purple (Admin / Lab)</Badge>
              <Badge variant="amber">Amber (Warning)</Badge>
              <Badge variant="yellow">Yellow</Badge>
              <Badge variant="indigo">Indigo (Tech Role)</Badge>
            </div>
          </div>
        </section>

        {/* Section 3: Form Inputs */}
        <section className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <FileText className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">
              2. Form Inputs (FormInput, FormSelect, FormTextarea)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Standard Text */}
            <FormInput
              label="Standard Text Field"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. John Doe"
              hint="Helper text displayed below input field"
              required
            />

            {/* Password with Eye Toggle */}
            <FormInput
              label="Password (with Show/Hide Toggle)"
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              required
              hint="Click eye icon on right to preview plaintext"
            />

            {/* Error State */}
            <FormInput
              label="Validation Error State"
              value="077-INVALID"
              onChange={() => {}}
              error={inputError}
              required
            />

            {/* FormSelect */}
            <FormSelect
              label="Select Container Tube Type"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
              required
              options={[
                { value: 'EDTA', label: 'EDTA Tube (Purple Cap)' },
                { value: 'SERUM', label: 'Serum Separator Tube (Red/Gold)' },
                { value: 'SODIUM_CITRATE', label: 'Sodium Citrate (Light Blue)' },
                { value: 'FLUORIDE', label: 'Sodium Fluoride (Grey Cap)' },
              ]}
              hint="Always provides default placeholder"
            />

            {/* Disabled Input */}
            <FormInput
              label="Disabled / Read-Only Field"
              value="SYSTEM-LOCKED-001"
              disabled
              hint="Non-editable database generated identifier"
            />

            {/* Scanner OnEnter Trigger */}
            <FormInput
              label="Input with onEnter Callback"
              placeholder="Type & press Enter to test"
              onEnter={(e) => alert(`Pressed Enter with: ${e.target.value}`)}
              hint="Press Enter to trigger onEnter callback"
            />
          </div>

          {/* FormTextarea */}
          <div className="pt-2">
            <FormTextarea
              label="Clinical / Rejection Reason Textarea (with Counter)"
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              maxLength={250}
              rows={3}
              required
              hint="Enforces minimum character validation when paired with ConfirmDialog"
            />
          </div>
        </section>

        {/* Section 4: Lab-Specific Display Components */}
        <section className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <FlaskConical className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">
              3. Lab-Specific Display Components
            </h2>
          </div>

          {/* SampleStatusBadge */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              SampleStatusBadge (All 6 Container Lifecycle Stages)
            </span>
            <div className="flex items-center gap-3 flex-wrap">
              <SampleStatusBadge status="PENDING_COLLECTION" />
              <SampleStatusBadge status="COLLECTED" />
              <SampleStatusBadge status="RECEIVED_AT_LAB" />
              <SampleStatusBadge status="RESULT_ENTERED" />
              <SampleStatusBadge status="VERIFIED" />
              <SampleStatusBadge status="REJECTED" />
            </div>
            <p className="text-xs text-gray-400">
              * Note: The <strong>REJECTED</strong> status features an active pulsing red ring to draw immediate lab technician attention.
            </p>
          </div>

          {/* ResultValueCell */}
          <div className="flex flex-col gap-3 pt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ResultValueCell (Abnormality Flagging & Reference Ranges)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <span className="text-xs text-gray-500 block mb-1">Normal Value:</span>
                <ResultValueCell
                  value={14.2}
                  unit="g/dL"
                  lowerLimit={12.0}
                  upperLimit={16.0}
                  flag="NORMAL"
                />
              </div>

              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <span className="text-xs text-gray-500 block mb-1">High Abnormality (Red Highlight):</span>
                <ResultValueCell
                  value={6.8}
                  unit="x10^12/L"
                  lowerLimit={4.5}
                  upperLimit={5.5}
                  flag="HIGH"
                />
              </div>

              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <span className="text-xs text-gray-500 block mb-1">Low Abnormality (Red Highlight):</span>
                <ResultValueCell
                  value={3.2}
                  unit="x10^9/L"
                  lowerLimit={4.0}
                  upperLimit={11.0}
                  flag="LOW"
                />
              </div>

              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <span className="text-xs text-gray-500 block mb-1">Pending / Empty:</span>
                <ResultValueCell value={null} lowerLimit={70} upperLimit={100} />
              </div>
            </div>
          </div>

          {/* PatientInfoCard */}
          <div className="flex flex-col gap-3 pt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              PatientInfoCard (Adult vs Minor with Guardian)
            </span>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PatientInfoCard
                id="P-0045"
                name="Kamal Perera"
                dob="1990-03-12"
                age={34}
                gender="Male"
                contactNumber="077-123-4567"
              />

              <PatientInfoCard
                id="P-0092"
                name="Ayesha Fernando"
                dob="2012-07-03"
                age={14}
                gender="Female"
                contactNumber="071-456-7890"
                isMinor={true}
                guardianName="Ranaweera Fernando (Father)"
              />
            </div>
          </div>
        </section>

        {/* Section 5: Complex & Scanner Inputs */}
        <section className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <Send className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">
              4. Advanced Lab & Scanner Inputs
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AutoCompleteSearch */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                AutoCompleteSearch (Type 'kamal' or '077')
              </span>
              <AutoCompleteSearch
                label="Search Patient by Mobile or Name"
                placeholder="Type '077' or 'kamal'..."
                onSearch={handlePatientSearch}
                suggestions={mockSuggestions}
                loading={autoCompleteLoading}
                onSelect={(item) => setSelectedPatient(item)}
                onNotFound={() => alert('Clicked: Register New Patient')}
              />
              {selectedPatient && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                  <strong>Selected:</strong> {selectedPatient.primaryLabel}
                </div>
              )}
            </div>

            {/* BarcodeInput */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                BarcodeInput (Type code and press Enter)
              </span>
              <BarcodeInput
                label="Container Barcode Scanner"
                prefix="TSC-"
                onScan={handleBarcodeScan}
                loading={barcodeLoading}
                hint="Simulates hardware USB barcode scan terminating with Enter"
              />
              {scannedCodeOutput && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-900 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span>
                    Successfully scanned barcode: <strong>{scannedCodeOutput}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* TestCheckboxList */}
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                TestCheckboxList (Filterable Test Selector)
              </span>
              <button
                type="button"
                onClick={() => setTestListDisabled(!testListDisabled)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Toggle Disabled State ({testListDisabled ? 'Currently Disabled' : 'Currently Enabled'})
              </button>
            </div>
            <TestCheckboxList
              tests={demoTestsCatalog}
              selected={selectedTests}
              onChange={setSelectedTests}
              disabled={testListDisabled}
            />
          </div>
        </section>

        {/* Section 6: Feedback & Alerts */}
        <section className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <Sparkles className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">
              5. Feedback, Loading & Empty States
            </h2>
          </div>

          {/* Global Upper-Right Toast Notifications Demo */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Global Upper-Right Toast Notification System (Click to test floating alerts)
            </span>
            <div className="flex flex-wrap items-center gap-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
              <Button
                size="sm"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => showSuccess('Sample SC00042 collected and linked successfully!', 'Specimen Collected')}
              >
                Trigger Success Toast
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => showError('Invalid barcode format. Expected SC followed by 5 digits.', 'Validation Failed')}
              >
                Trigger Error Toast
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => showWarning('Specimen tube marked as Hemolyzed. Recollection recommended.', 'Sample Defect')}
              >
                Trigger Warning Toast
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => showInfo('New walk-in patient order received from Reception Desk.', 'New Patient')}
              >
                Trigger Info Toast
              </Button>
            </div>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {showErrorAlert ? (
              <ErrorAlert
                title="Sample Analysis Connection Timeout"
                message="Could not reach the database server. Please check your local connection."
                onRetry={() => alert('Retry button clicked!')}
                onDismiss={() => setShowErrorAlert(false)}
              />
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setShowErrorAlert(true)}>
                Re-show Error Alert
              </Button>
            )}

            {showSuccessAlert ? (
              <SuccessAlert
                title="Specimen Registered"
                message="Container TSC-00456-01-B1 marked as Collected."
                autoDismiss={6}
                onDismiss={() => setShowSuccessAlert(false)}
              />
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setShowSuccessAlert(true)}>
                Re-show Success Alert (6s Countdown)
              </Button>
            )}
          </div>

          {/* Loading Spinners */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              LoadingSpinner (Sizes & Layouts)
            </span>
            <div className="flex items-center gap-8 border border-gray-100 rounded-lg p-4 bg-gray-50/50">
              <LoadingSpinner size="sm" inline message="Inline sm spinner" />
              <LoadingSpinner size="md" inline message="Inline md spinner" />
              <LoadingSpinner size="lg" inline message="Inline lg spinner" />
            </div>
          </div>

          {/* EmptyState */}
          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              EmptyState
            </span>
            <EmptyState
              title="No Specimens Pending Verification"
              description="All submitted test results have been verified by a Senior Lab Technician."
              actionLabel="Return to Dashboard"
              onAction={() => alert('Navigating to dashboard')}
            />
          </div>
        </section>

        {/* Section: Dashboard Quick Action Tiles */}
        <section className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <Sparkles className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">
              Action Tiles & Navigation Cards (QuickActionCard)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickActionCard
              title="Patient Reception"
              description="Register new patients, look up records, and generate barcode slips."
              icon={Users}
              badge="Primary"
              color="blue"
              onClick={() => alert('Clicked Reception Card')}
            />
            <QuickActionCard
              title="Result Entry Workbench"
              description="Record qualitative and numeric results with live sex-matched reference range validation."
              icon={FlaskConical}
              badge="Workbench"
              color="teal"
              onClick={() => alert('Clicked Result Entry Card')}
            />
            <QuickActionCard
              title="Verification Queue"
              description="Review submitted results, check abnormal panic values, and release reports."
              icon={CheckCircle}
              badge="3 Pending"
              color="indigo"
              onClick={() => alert('Clicked Verification Card')}
            />
          </div>
        </section>

        {/* Section 7: Dialogs, StepWizard & Overlays */}
        <section className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2">
            <CheckCircle className="text-blue-600" size={20} />
            <h2 className="text-lg font-bold text-gray-800">
              6. Overlays, Dialogs & Step Navigation
            </h2>
          </div>

          {/* StepWizard */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                StepWizard (Interactive Multi-Step Form)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                >
                  Previous Step
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={currentStep === 2}
                  onClick={() => {
                    setCompletedSteps((prev) => Array.from(new Set([...prev, currentStep])));
                    setCurrentStep((prev) => Math.min(2, prev + 1));
                  }}
                >
                  Complete & Next
                </Button>
              </div>
            </div>

            <StepWizard
              steps={[
                { title: 'Basic Info', description: 'Test name & code' },
                { title: 'Parameters', description: 'Reference ranges' },
                { title: 'Collection Setup', description: 'Containers & tubes' },
              ]}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={(idx) => setCurrentStep(idx)}
            />
          </div>

          {/* Modal & ConfirmDialog Triggers */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Modal & ConfirmDialog Triggers
            </span>
            <div className="flex items-center gap-4 flex-wrap">
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Open Standard Modal ({modalSize})
              </Button>

              <Button
                variant="danger"
                onClick={() => {
                  setConfirmRequiresReason(true);
                  setIsConfirmOpen(true);
                }}
              >
                Open Destructive ConfirmDialog (Requires Reason)
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmRequiresReason(false);
                  setIsConfirmOpen(true);
                }}
              >
                Open Simple ConfirmDialog
              </Button>
            </div>

            {confirmDialogResult && (
              <p className="text-xs text-gray-600 mt-1">
                Last Dialog Result: <span className="font-semibold text-blue-600">{confirmDialogResult}</span>
              </p>
            )}
          </div>
        </section>

        {/* Section 8: DataTable Demo */}
        <section className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              7. DataTable Component
            </h2>

            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setTableLoading(!tableLoading)}
              >
                Toggle Skeleton Loading ({tableLoading ? 'ON' : 'OFF'})
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setTableEmpty(!tableEmpty)}
              >
                Toggle Empty State ({tableEmpty ? 'EMPTY' : 'HAS DATA'})
              </Button>
            </div>
          </div>

          <DataTable
            columns={demoTableColumns}
            data={tableEmpty ? [] : demoTableRows}
            loading={tableLoading}
            onView={(row) => alert(`Viewing: ${row.code}`)}
            onEdit={(row) => alert(`Editing: ${row.code}`)}
            onDelete={(row) => alert(`Delete clicked for: ${row.code}`)}
          />
        </section>

        {/* --- Interactive Overlays --- */}

        {/* Modal Instance */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Standard LabCare Modal Dialog"
          size={modalSize}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-gray-400">Modal Size: {modalSize}</span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                  Save Changes
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              This modal demonstrates safe form entry: clicking outside the modal will <strong>not</strong> accidentally dismiss it, preventing data loss.
            </p>

            <FormInput
              label="Sample Modal Field"
              placeholder="Type inside modal..."
              required
            />

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">Switch Modal Size:</span>
              {(['sm', 'md', 'lg', 'xl']).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setModalSize(s)}
                  className={`px-2.5 py-1 text-xs rounded border ${
                    modalSize === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </Modal>

        {/* ConfirmDialog Instance */}
        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={(reason) => {
            setIsConfirmOpen(false);
            setConfirmDialogResult(reason ? `Confirmed with reason: "${reason}"` : 'Confirmed without reason');
          }}
          title={confirmRequiresReason ? 'Reject Lab Test Specimen?' : 'Verify Selected Test?'}
          message={
            confirmRequiresReason
              ? 'This specimen will be flagged as REJECTED in the database. Lab technicians must recollect a new sample.'
              : 'Are you sure you want to approve and verify this result?'
          }
          variant={confirmRequiresReason ? 'danger' : 'primary'}
          confirmLabel={confirmRequiresReason ? 'Reject Specimen' : 'Verify Result'}
          requiresReason={confirmRequiresReason}
          reasonPlaceholder="Specify the rejection reason (e.g., tube hemolyzed, clotted, incorrect container)..."
          minReasonLength={10}
        />
      </div>
    </Layout>
  );
};

export default ComponentShowcasePage;
