import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import {
  DataTable,
  Badge,
  PageHeader,
  ErrorAlert,
  EmptyState,
  Button,
  Modal,
  StepWizard,
  FormInput,
  FormSelect,
  FormTextarea,
  ConfirmDialog,
  useToast,
} from '../../components/ui';
import { Plus, RefreshCw, FlaskConical, Trash2, Layers, Sliders, CheckCircle2, Copy, TestTubes } from 'lucide-react';
import catalogService from '../../services/catalogService';

/**
 * Diagnostic Test Catalog Management Page.
 *
 * Provides a 4-step wizard for configuring new tests:
 * - Step 1: Test Identity (Name, Code, Category, Description)
 * - Step 2: Sample & Tube Setup (Repeatable sample groups)
 * - Step 3: Parameters & Ranges (Grouped by sample tube with NUMBER/TEXT/CHOICE types)
 * - Step 4: Review & Submit
 */
const SAMPLE_TYPE_OPTIONS = [
  { value: 'BLOOD_VENOUS', label: 'Venous Blood' },
  { value: 'BLOOD_CAPILLARY', label: 'Capillary Blood' },
  { value: 'URINE_SPOT', label: 'Spot Urine' },
  { value: 'URINE_24HR', label: '24-Hour Urine' },
  { value: 'SWAB', label: 'Swab' },
  { value: 'STOOL', label: 'Stool' },
  { value: 'SPUTUM', label: 'Sputum' },
  { value: 'CSF', label: 'Cerebrospinal Fluid (CSF)' },
  { value: 'OTHER', label: 'Other Specimen' },
];

/**
 * Helper to get cap badge color styling based on the tube's letter code (P, R, G, C, U, S).
 * Used across the test catalog wizard to visually represent physical specimen containers.
 */
const getCapBadgeStyle = (letter) => {
  switch ((letter || '').toUpperCase()) {
    case 'P':
      return {
        bg: 'bg-purple-100 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
        accentBorder: 'border-l-purple-500',
        name: 'Purple Cap (EDTA)',
      };
    case 'R':
      return {
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        accentBorder: 'border-l-rose-500',
        name: 'Red Cap (Plain / Serum)',
      };
    case 'G':
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        dot: 'bg-slate-500',
        accentBorder: 'border-l-slate-400',
        name: 'Grey Cap (Fluoride)',
      };
    case 'C':
      return {
        bg: 'bg-sky-100 text-sky-800 border-sky-200',
        dot: 'bg-sky-500',
        accentBorder: 'border-l-sky-500',
        name: 'Blue Cap (Citrate)',
      };
    case 'U':
      return {
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        accentBorder: 'border-l-amber-500',
        name: 'Yellow Cap (Urine Cup)',
      };
    case 'S':
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        accentBorder: 'border-l-emerald-500',
        name: 'Green Cap (Swab)',
      };
    default:
      return {
        bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-500',
        accentBorder: 'border-l-indigo-500',
        name: 'Container',
      };
  }
};

const INITIAL_TEST_STATE = {
  name: '',
  code: '',
  category: 'Haematology',
  description: '',
  sampleGroups: [
    { key: 'g1', sampleType: 'BLOOD_VENOUS', containerTypeId: '', numContainers: 1, dayOffset: 0 },
  ],
  parameters: [],
};

const TestCatalogPage = () => {
  const [tests, setTests] = useState([]);
  const [containerTypes, setContainerTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showSuccess, showError, showInfo } = useToast();

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [testForm, setTestForm] = useState(INITIAL_TEST_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState(null);

  // Detail Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTestDetail, setSelectedTestDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Deactivate dialog state
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [testToToggle, setTestToToggle] = useState(null);

  const fetchCatalogData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [testsData, containersData] = await Promise.all([
        catalogService.getAllTests(),
        catalogService.getAllContainerTypes(),
      ]);
      setTests(testsData || []);
      setContainerTypes(containersData || []);
    } catch (err) {
      console.error('Failed to load test catalog:', err);
      const errMsg =
        err.response?.data?.message ||
        'Failed to connect to the backend server. Please verify Spring Boot is running on port 8080.';
      setError(errMsg);
      showError(errMsg, 'Catalog Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    await fetchCatalogData();
    showInfo('Diagnostic test catalog refreshed.', 'Catalog Updated');
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const openCreateWizard = () => {
    const defaultContainerId = containerTypes.length > 0 ? String(containerTypes[0].id) : '';
    setTestForm({
      ...INITIAL_TEST_STATE,
      sampleGroups: [
        { key: 'g1', sampleType: 'BLOOD_VENOUS', containerTypeId: defaultContainerId, numContainers: 1, dayOffset: 0 },
      ],
      parameters: [
        {
          id: 'p1',
          name: '',
          resultType: 'NUMBER',
          unit: '',
          decimalPlaces: '',
          sampleGroupKey: 'g1',
          sortOrder: 1,
          maleMinRange: '',
          maleMaxRange: '',
          maleCriticalLow: '',
          maleCriticalHigh: '',
          femaleMinRange: '',
          femaleMaxRange: '',
          femaleCriticalLow: '',
          femaleCriticalHigh: '',
          possibleOptions: '',
          abnormalOptions: '',
        },
      ],
    });
    setWizardStep(1);
    setWizardError(null);
    setShowWizard(true);
  };

  // --- Step 2: Sample Group Handlers ---
  const handleAddSampleGroup = () => {
    const nextKey = `g${testForm.sampleGroups.length + 1}`;
    const defaultContainerId = containerTypes.length > 0 ? String(containerTypes[0].id) : '';
    setTestForm({
      ...testForm,
      sampleGroups: [
        ...testForm.sampleGroups,
        { key: nextKey, sampleType: 'BLOOD_VENOUS', containerTypeId: defaultContainerId, numContainers: 1, dayOffset: 0 },
      ],
    });
  };

  const handleRemoveSampleGroup = (indexToRemove) => {
    if (testForm.sampleGroups.length <= 1) return;
    const removedGroup = testForm.sampleGroups[indexToRemove];
    const updatedGroups = testForm.sampleGroups.filter((_, idx) => idx !== indexToRemove);
    // Re-link parameters that were in removed group to the first remaining group
    const fallbackKey = updatedGroups[0].key;
    const updatedParams = testForm.parameters.map((p) =>
      p.sampleGroupKey === removedGroup.key ? { ...p, sampleGroupKey: fallbackKey } : p
    );
    setTestForm({
      ...testForm,
      sampleGroups: updatedGroups,
      parameters: updatedParams,
    });
  };

  const handleUpdateSampleGroup = (index, field, value) => {
    const updated = [...testForm.sampleGroups];
    updated[index] = { ...updated[index], [field]: value };
    setTestForm({ ...testForm, sampleGroups: updated });
  };

  // --- Step 3: Parameter Handlers ---
  const handleAddParameter = (groupKey) => {
    const newId = `p${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const targetGroupKey = groupKey || testForm.sampleGroups[0]?.key || 'g1';
    const newParam = {
      id: newId,
      name: '',
      resultType: 'NUMBER',
      unit: '',
      decimalPlaces: '',
      sampleGroupKey: targetGroupKey,
      sortOrder: testForm.parameters.length + 1,
      maleMinRange: '',
      maleMaxRange: '',
      maleCriticalLow: '',
      maleCriticalHigh: '',
      femaleMinRange: '',
      femaleMaxRange: '',
      femaleCriticalLow: '',
      femaleCriticalHigh: '',
      possibleOptions: '',
      abnormalOptions: '',
    };
    setTestForm({ ...testForm, parameters: [...testForm.parameters, newParam] });
  };

  const handleRemoveParameter = (paramId) => {
    setTestForm({
      ...testForm,
      parameters: testForm.parameters.filter((p) => p.id !== paramId),
    });
  };

  const handleUpdateParameter = (paramId, field, value) => {
    setTestForm({
      ...testForm,
      parameters: testForm.parameters.map((p) => (p.id === paramId ? { ...p, [field]: value } : p)),
    });
  };

  // Quick helper to duplicate male limits into female limits
  const handleCopyMaleToFemale = (paramId) => {
    setTestForm((prev) => ({
      ...prev,
      parameters: prev.parameters.map((p) => {
        if (p.id !== paramId) return p;
        return {
          ...p,
          femaleMinRange: p.maleMinRange,
          femaleMaxRange: p.maleMaxRange,
          femaleCriticalLow: p.maleCriticalLow,
          femaleCriticalHigh: p.maleCriticalHigh,
        };
      }),
    }));
  };

  // --- Wizard Validation & Submit ---
  const validateCurrentStep = () => {
    setWizardError(null);
    if (wizardStep === 1) {
      if (!testForm.name.trim()) {
        const msg = 'Test Name is required.';
        setWizardError(msg);
        showError(msg, 'Validation Required');
        return false;
      }
      if (!testForm.code.trim()) {
        const msg = 'Test Code is required (e.g. CBC, UFR).';
        setWizardError(msg);
        showError(msg, 'Validation Required');
        return false;
      }
      if (!testForm.category.trim()) {
        const msg = 'Test Category is required.';
        setWizardError(msg);
        showError(msg, 'Validation Required');
        return false;
      }
    }
    if (wizardStep === 2) {
      if (testForm.sampleGroups.length === 0) {
        const msg = 'At least one specimen container group is required.';
        setWizardError(msg);
        showError(msg, 'Validation Required');
        return false;
      }
      for (const sg of testForm.sampleGroups) {
        if (!sg.containerTypeId) {
          const msg = 'Please select a container type for all sample groups.';
          setWizardError(msg);
          showError(msg, 'Validation Required');
          return false;
        }
      }
    }
    if (wizardStep === 3) {
      if (testForm.parameters.length === 0) {
        const msg = 'At least one test parameter is required.';
        setWizardError(msg);
        showError(msg, 'Validation Required');
        return false;
      }
      for (const p of testForm.parameters) {
        if (!p.name.trim()) {
          const msg = 'Every parameter must have a name.';
          setWizardError(msg);
          showError(msg, 'Validation Required');
          return false;
        }
        if (p.resultType === 'CHOICE') {
          if (!p.possibleOptions || !p.possibleOptions.trim()) {
            const msg = `Parameter "${p.name}" is CHOICE type but has no possible options defined.`;
            setWizardError(msg);
            showError(msg, 'Validation Required');
            return false;
          }
        }
        if (p.resultType === 'NUMBER') {
          const mMin = p.maleMinRange !== '' && p.maleMinRange !== null ? Number(p.maleMinRange) : null;
          const mMax = p.maleMaxRange !== '' && p.maleMaxRange !== null ? Number(p.maleMaxRange) : null;
          if (mMin !== null && mMax !== null && mMin > mMax) {
            const msg = `Parameter "${p.name}": Male minimum limit cannot exceed maximum limit.`;
            setWizardError(msg);
            showError(msg, 'Validation Required');
            return false;
          }
          const fMin = p.femaleMinRange !== '' && p.femaleMinRange !== null ? Number(p.femaleMinRange) : null;
          const fMax = p.femaleMaxRange !== '' && p.femaleMaxRange !== null ? Number(p.femaleMaxRange) : null;
          if (fMin !== null && fMax !== null && fMin > fMax) {
            const msg = `Parameter "${p.name}": Female minimum limit cannot exceed maximum limit.`;
            setWizardError(msg);
            showError(msg, 'Validation Required');
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setWizardStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevStep = () => {
    setWizardError(null);
    setWizardStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitTest = async () => {
    setSubmitting(true);
    setWizardError(null);

    try {
      // Build backend payload matching CreateTestRequest
      const payload = {
        name: testForm.name.trim(),
        code: testForm.code.trim().toUpperCase(),
        category: testForm.category.trim(),
        description: testForm.description.trim() || null,
        sampleGroups: testForm.sampleGroups.map((sg) => ({
          key: sg.key,
          sampleType: sg.sampleType,
          containerTypeId: Number(sg.containerTypeId),
          numContainers: Number(sg.numContainers) || 1,
          dayOffset: Number(sg.dayOffset) || 0,
        })),
        parameters: testForm.parameters.map((p, idx) => ({
          name: p.name.trim(),
          resultType: p.resultType,
          unit: p.resultType === 'NUMBER' ? p.unit?.trim() || null : null,
          decimalPlaces:
            p.resultType === 'NUMBER' && p.decimalPlaces !== '' && p.decimalPlaces !== null
              ? Number(p.decimalPlaces)
              : null,
          sampleGroupKey: p.sampleGroupKey,
          sortOrder: p.sortOrder || idx + 1,
          maleMinRange:
            p.resultType === 'NUMBER' && p.maleMinRange !== '' && p.maleMinRange !== null
              ? Number(p.maleMinRange)
              : null,
          maleMaxRange:
            p.resultType === 'NUMBER' && p.maleMaxRange !== '' && p.maleMaxRange !== null
              ? Number(p.maleMaxRange)
              : null,
          maleCriticalLow:
            p.resultType === 'NUMBER' && p.maleCriticalLow !== '' && p.maleCriticalLow !== null
              ? Number(p.maleCriticalLow)
              : null,
          maleCriticalHigh:
            p.resultType === 'NUMBER' && p.maleCriticalHigh !== '' && p.maleCriticalHigh !== null
              ? Number(p.maleCriticalHigh)
              : null,
          femaleMinRange:
            p.resultType === 'NUMBER' && p.femaleMinRange !== '' && p.femaleMinRange !== null
              ? Number(p.femaleMinRange)
              : null,
          femaleMaxRange:
            p.resultType === 'NUMBER' && p.femaleMaxRange !== '' && p.femaleMaxRange !== null
              ? Number(p.femaleMaxRange)
              : null,
          femaleCriticalLow:
            p.resultType === 'NUMBER' && p.femaleCriticalLow !== '' && p.femaleCriticalLow !== null
              ? Number(p.femaleCriticalLow)
              : null,
          femaleCriticalHigh:
            p.resultType === 'NUMBER' && p.femaleCriticalHigh !== '' && p.femaleCriticalHigh !== null
              ? Number(p.femaleCriticalHigh)
              : null,
          possibleOptions: p.resultType === 'CHOICE' ? p.possibleOptions?.trim() || null : null,
          abnormalOptions: p.resultType === 'CHOICE' ? p.abnormalOptions?.trim() || null : null,
        })),
      };

      await catalogService.createTest(payload);
      setShowWizard(false);
      showSuccess(`Diagnostic test "${testForm.name}" (${testForm.code}) created successfully in catalog.`, 'Test Created');
      fetchCatalogData();
    } catch (err) {
      console.error('Failed to create test:', err);
      const errMsg = err.response?.data?.message || 'Failed to create test catalog entry.';
      setWizardError(errMsg);
      showError(errMsg, 'Creation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // --- View Details ---
  const handleViewDetails = async (testRow) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const data = await catalogService.getTestById(testRow.id);
      setSelectedTestDetail(data);
    } catch (err) {
      console.error('Failed to load test detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // --- Toggle Active Status ---
  const handleToggleActive = (testRow) => {
    setTestToToggle(testRow);
    setToggleConfirmOpen(true);
  };

  const confirmToggleActive = async () => {
    if (!testToToggle) return;
    try {
      const newStatus = !testToToggle.isActive;
      await catalogService.toggleTestActive(testToToggle.id, newStatus);
      showSuccess(`Test "${testToToggle.name}" has been ${newStatus ? 'activated' : 'deactivated'} successfully.`, 'Status Updated');
      fetchCatalogData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update test status.';
      showError(errMsg, 'Update Failed');
    } finally {
      setToggleConfirmOpen(false);
      setTestToToggle(null);
    }
  };

  const columns = [
    {
      header: 'Code',
      accessor: 'code',
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
          {row.code}
        </span>
      ),
    },
    {
      header: 'Test Name',
      accessor: 'name',
      cell: (row) => <span className="font-semibold text-gray-900">{row.name}</span>,
    },
    {
      header: 'Category',
      accessor: 'category',
      cell: (row) => <Badge variant="blue">{row.category}</Badge>,
    },
    {
      header: 'Parameters',
      accessor: 'parameterCount',
      cell: (row) => <span className="text-gray-600">{row.parameterCount || 0} items</span>,
    },
    {
      header: 'Status',
      accessor: 'isActive',
      cell: (row) => (
        <Badge variant={row.isActive ? 'green' : 'gray'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="xs" onClick={() => handleViewDetails(row)}>
            Details
          </Button>
          <Button
            variant={row.isActive ? 'secondary' : 'primary'}
            size="xs"
            onClick={() => handleToggleActive(row)}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout title="Test Catalog">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Diagnostic Test Catalog"
          subtitle="Configure lab tests, parameters, sample groups, and reference ranges."
          tabs={[{ label: 'All Tests', value: 'all', count: tests.length }]}
          activeTab="all"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleManualRefresh}
                disabled={loading}
                leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={openCreateWizard}
              >
                Add New Test
              </Button>
            </div>
          }
        />

        {error && (
          <ErrorAlert
            title="Catalog Error"
            message={error}
            onRetry={fetchCatalogData}
            onDismiss={() => setError(null)}
          />
        )}

        <DataTable
          columns={columns}
          data={tests}
          loading={loading}
          emptyState={
            <EmptyState
              title="No Tests In Catalog Yet"
              description="The catalog is currently empty. Add your first lab test to begin ordering."
              icon={<FlaskConical size={24} />}
              actionLabel="+ Add First Test"
              onAction={openCreateWizard}
            />
          }
        />

        {/* ========================================================================= */}
        {/* ADD TEST 4-STEP WIZARD MODAL */}
        {/* ========================================================================= */}
        <Modal
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          title="Add New Diagnostic Test"
          size="xl"
        >
          <div className="flex flex-col gap-6">
            <StepWizard
              steps={[
                { title: 'Identity', description: 'Code & name' },
                { title: 'Sample Setup', description: 'Tubes & days' },
                { title: 'Parameters', description: 'Ranges & options' },
                { title: 'Review', description: 'Submit catalog' },
              ]}
              currentStep={wizardStep - 1}
              completedSteps={Array.from({ length: wizardStep - 1 }, (_, i) => i)}
              onStepClick={(idx) => setWizardStep(idx + 1)}
            />

            {wizardError && (
              <ErrorAlert
                title="Validation Error"
                message={wizardError}
                onDismiss={() => setWizardError(null)}
              />
            )}

            {/* STEP 1: TEST IDENTITY */}
            {wizardStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput
                    label="Test Name"
                    placeholder="e.g. Full Blood Count / CBC"
                    value={testForm.name}
                    onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                    required
                    autoFocus
                  />
                  <FormInput
                    label="Test Code (Unique)"
                    placeholder="e.g. CBC, UFR, FBS"
                    value={testForm.code}
                    onChange={(e) => setTestForm({ ...testForm, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormSelect
                    label="Category"
                    value={testForm.category}
                    onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                    options={[
                      { value: 'Haematology', label: 'Haematology' },
                      { value: 'Biochemistry', label: 'Biochemistry' },
                      { value: 'Urinalysis', label: 'Urinalysis' },
                      { value: 'Microbiology', label: 'Microbiology' },
                      { value: 'Immunology', label: 'Immunology' },
                      { value: 'Endocrinology', label: 'Endocrinology' },
                    ]}
                    required
                  />
                </div>

                <FormTextarea
                  label="Description / Clinical Notes"
                  placeholder="Optional clinical explanation or prep instructions..."
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  rows={3}
                />
              </div>
            )}

            {/* STEP 2: SAMPLE GROUPS SETUP */}
            {wizardStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Specimen & Container Setup</h3>
                    <p className="text-xs text-gray-500">
                      Configure the physical containers needed. Multi-day or multi-specimen tests can have multiple groups.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="xs"
                    leftIcon={<Plus size={14} />}
                    onClick={handleAddSampleGroup}
                  >
                    Add Sample Group
                  </Button>
                </div>

                <div className="flex flex-col gap-3">
                  {testForm.sampleGroups.map((group, idx) => (
                    <div
                      key={group.key}
                      className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          Group {group.key.toUpperCase()}
                        </span>
                        {testForm.sampleGroups.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSampleGroup(idx)}
                            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <FormSelect
                          label="Specimen Type"
                          value={group.sampleType}
                          onChange={(e) => handleUpdateSampleGroup(idx, 'sampleType', e.target.value)}
                          options={SAMPLE_TYPE_OPTIONS}
                          required
                        />

                        <FormSelect
                          label="Container / Tube"
                          value={group.containerTypeId}
                          onChange={(e) => handleUpdateSampleGroup(idx, 'containerTypeId', e.target.value)}
                          options={containerTypes.map((c) => ({
                            value: String(c.id),
                            label: `${c.name} (${c.labelLetter || c.code})`,
                          }))}
                          required
                        />

                        <FormInput
                          label="Number of Tubes"
                          type="number"
                          min="1"
                          value={group.numContainers}
                          onChange={(e) => handleUpdateSampleGroup(idx, 'numContainers', e.target.value)}
                          required
                        />

                        <FormInput
                          label="Day Offset (0 = Same Day)"
                          type="number"
                          min="0"
                          value={group.dayOffset}
                          onChange={(e) => handleUpdateSampleGroup(idx, 'dayOffset', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: PARAMETERS & RANGES (Option 1: Grouped Specimen Containers — All-in-One View) */}
            {wizardStep === 3 && (
              <div className="flex flex-col gap-6">
                {/* Step 3 Header & Summary Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <TestTubes size={16} className="text-blue-600" />
                      Test Parameters by Specimen Tube
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Assign clinical parameters and reference ranges directly to each specimen container configured in Step 2. Technicians enter results separately per container.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2.5 py-1 bg-white font-semibold text-gray-700 rounded-lg border border-gray-200">
                      {testForm.sampleGroups.length} {testForm.sampleGroups.length === 1 ? 'Specimen Tube' : 'Specimen Tubes'}
                    </span>
                    <span className="text-xs px-2.5 py-1 bg-blue-600 font-semibold text-white rounded-lg shadow-xs">
                      {testForm.parameters.length} {testForm.parameters.length === 1 ? 'Parameter' : 'Parameters'} Configured
                    </span>
                  </div>
                </div>

                {/* Specimen Container Groups List */}
                <div className="flex flex-col gap-5">
                  {testForm.sampleGroups.map((group, groupIdx) => {
                    const container = containerTypes.find((c) => String(c.id) === String(group.containerTypeId));
                    const specimenOption = SAMPLE_TYPE_OPTIONS.find((s) => s.value === group.sampleType);
                    const specimenLabel = specimenOption?.label || group.sampleType;
                    const capStyle = getCapBadgeStyle(container?.labelLetter);
                    const groupParams = testForm.parameters.filter((p) => p.sampleGroupKey === group.key);

                    return (
                      <div
                        key={group.key}
                        className={`p-4 rounded-xl border border-gray-200 bg-gray-50/40 flex flex-col gap-4 border-l-4 ${capStyle.accentBorder}`}
                      >
                        {/* Tube Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* Visual Cap Badge */}
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${capStyle.bg}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${capStyle.dot}`} />
                              Tube {container?.labelLetter || '?'}: {container?.name || 'Container'}
                            </span>

                            {/* Specimen Group & Type */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-gray-800">
                                Group {group.key.toUpperCase()}:
                              </span>
                              <span className="text-xs font-semibold text-gray-700">
                                {specimenLabel}
                              </span>
                            </div>

                            {/* Info Badges */}
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                                {group.numContainers} {group.numContainers === 1 ? 'Tube' : 'Tubes'}
                              </span>
                              <span className="bg-white px-2 py-0.5 rounded border border-gray-200">
                                {group.dayOffset === 0 ? 'Day 0 (Same Day)' : `Day ${group.dayOffset} (+${group.dayOffset}d)`}
                              </span>
                              <span className="bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded border border-purple-100">
                                {groupParams.length} {groupParams.length === 1 ? 'Param' : 'Params'}
                              </span>
                            </div>
                          </div>

                          {/* Local Add Parameter Button */}
                          <Button
                            type="button"
                            variant="secondary"
                            size="xs"
                            leftIcon={<Plus size={14} />}
                            onClick={() => handleAddParameter(group.key)}
                          >
                            + Add Parameter to {container?.name ? container.name : `Group ${group.key.toUpperCase()}`}
                          </Button>
                        </div>

                        {/* If no parameters configured for this tube */}
                        {groupParams.length === 0 ? (
                          <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 bg-white/70">
                            <FlaskConical size={22} className="text-gray-400" />
                            <p className="text-xs text-gray-600 font-medium">
                              No parameters assigned to this specimen tube yet.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleAddParameter(group.key)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Plus size={13} /> Add first parameter for this tube
                            </button>
                          </div>
                        ) : (
                          /* Parameters List for this Tube */
                          <div className="flex flex-col gap-3.5">
                            {groupParams.map((param, paramIdx) => (
                              <div
                                key={param.id}
                                className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs flex flex-col gap-3.5"
                              >
                                {/* Parameter Card Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                      #{paramIdx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-gray-800">
                                      {param.name ? param.name : <span className="italic text-gray-400">Untitled Parameter</span>}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {/* Assigned Tube dropdown (allows reassigning parameter to another tube easily) */}
                                    {testForm.sampleGroups.length > 1 && (
                                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <span className="text-[11px] font-medium text-gray-500">Assigned Tube:</span>
                                        <select
                                          value={param.sampleGroupKey}
                                          onChange={(e) => handleUpdateParameter(param.id, 'sampleGroupKey', e.target.value)}
                                          className="text-xs py-1 px-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                        >
                                          {testForm.sampleGroups.map((sg) => {
                                            const c = containerTypes.find((item) => String(item.id) === String(sg.containerTypeId));
                                            const s = SAMPLE_TYPE_OPTIONS.find((item) => item.value === sg.sampleType);
                                            return (
                                              <option key={sg.key} value={sg.key}>
                                                Group {sg.key.toUpperCase()}: {c?.name || 'Tube'} ({s?.label || sg.sampleType})
                                              </option>
                                            );
                                          })}
                                        </select>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveParameter(param.id)}
                                      className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-medium transition-colors"
                                    >
                                      <Trash2 size={13} /> Remove
                                    </button>
                                  </div>
                                </div>

                                {/* Parameter Inputs */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <FormInput
                                    label="Parameter Name"
                                    placeholder="e.g. Hemoglobin, Colour, Protein"
                                    value={param.name}
                                    onChange={(e) => handleUpdateParameter(param.id, 'name', e.target.value)}
                                    required
                                  />

                                  <FormSelect
                                    label="Result Type"
                                    value={param.resultType}
                                    onChange={(e) => handleUpdateParameter(param.id, 'resultType', e.target.value)}
                                    options={[
                                      { value: 'NUMBER', label: 'NUMBER (Numeric + Reference Ranges)' },
                                      { value: 'TEXT', label: 'TEXT (Free Text / Observations)' },
                                      { value: 'CHOICE', label: 'CHOICE (Discrete Options List)' },
                                    ]}
                                    required
                                  />

                                  {param.resultType === 'NUMBER' && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <FormInput
                                        label="Unit"
                                        placeholder="g/dL, %"
                                        value={param.unit}
                                        onChange={(e) => handleUpdateParameter(param.id, 'unit', e.target.value)}
                                      />
                                      <FormInput
                                        label="Decimals"
                                        type="number"
                                        min="0"
                                        max="4"
                                        placeholder="e.g. 1"
                                        value={param.decimalPlaces}
                                        onChange={(e) => handleUpdateParameter(param.id, 'decimalPlaces', e.target.value)}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* If CHOICE: Discrete Options */}
                                {param.resultType === 'CHOICE' && (
                                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-amber-900">
                                        Discrete Options Configuration
                                      </span>
                                      <span className="text-[11px] text-amber-700">Separate values with commas</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <FormInput
                                        label="Possible Options (Dropdown choices)"
                                        placeholder="e.g. Negative, Trace, 1+, 2+, 3+"
                                        value={param.possibleOptions}
                                        onChange={(e) => handleUpdateParameter(param.id, 'possibleOptions', e.target.value)}
                                        required
                                      />
                                      <FormInput
                                        label="Abnormal Options (Auto-flagged abnormal)"
                                        placeholder="e.g. Trace, 1+, 2+, 3+"
                                        value={param.abnormalOptions}
                                        onChange={(e) => handleUpdateParameter(param.id, 'abnormalOptions', e.target.value)}
                                      />
                                    </div>
                                    <p className="text-[11px] text-gray-500">
                                      Technicians select from these choices during result entry. Any choice matching the abnormal list will automatically trigger an abnormal flag.
                                    </p>
                                  </div>
                                )}

                                {/* If NUMBER: Dual-column Male & Female Reference Ranges */}
                                {param.resultType === 'NUMBER' && (
                                  <div className="p-3.5 bg-blue-50/30 rounded-lg border border-blue-100 flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-xs font-bold text-blue-900">
                                          Reference Ranges & Critical Limits
                                        </span>
                                        <p className="text-[11px] text-gray-500">
                                          Define normal bounds and panic thresholds for Male and Female patients.
                                        </p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="xs"
                                        leftIcon={<Copy size={13} />}
                                        onClick={() => handleCopyMaleToFemale(param.id)}
                                        title="Copy Male limits to Female"
                                      >
                                        Copy Male to Female
                                      </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                      {/* Male Limits Column */}
                                      <div className="p-3 bg-white rounded-lg border border-blue-200 flex flex-col gap-2.5">
                                        <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                                          Male Limits
                                        </span>
                                        <div className="grid grid-cols-2 gap-2">
                                          <FormInput
                                            label="Min Range"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 13.5"
                                            value={param.maleMinRange}
                                            onChange={(e) => handleUpdateParameter(param.id, 'maleMinRange', e.target.value)}
                                          />
                                          <FormInput
                                            label="Max Range"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 17.5"
                                            value={param.maleMaxRange}
                                            onChange={(e) => handleUpdateParameter(param.id, 'maleMaxRange', e.target.value)}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                                          <FormInput
                                            label="Critical Low (<)"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 7.0"
                                            value={param.maleCriticalLow}
                                            onChange={(e) => handleUpdateParameter(param.id, 'maleCriticalLow', e.target.value)}
                                          />
                                          <FormInput
                                            label="Critical High (>)"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 20.0"
                                            value={param.maleCriticalHigh}
                                            onChange={(e) => handleUpdateParameter(param.id, 'maleCriticalHigh', e.target.value)}
                                          />
                                        </div>
                                      </div>

                                      {/* Female Limits Column */}
                                      <div className="p-3 bg-white rounded-lg border border-pink-200 flex flex-col gap-2.5">
                                        <span className="text-xs font-bold text-pink-700 flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full bg-pink-500" />
                                          Female Limits
                                        </span>
                                        <div className="grid grid-cols-2 gap-2">
                                          <FormInput
                                            label="Min Range"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 12.0"
                                            value={param.femaleMinRange}
                                            onChange={(e) => handleUpdateParameter(param.id, 'femaleMinRange', e.target.value)}
                                          />
                                          <FormInput
                                            label="Max Range"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 15.5"
                                            value={param.femaleMaxRange}
                                            onChange={(e) => handleUpdateParameter(param.id, 'femaleMaxRange', e.target.value)}
                                          />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                                          <FormInput
                                            label="Critical Low (<)"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 7.0"
                                            value={param.femaleCriticalLow}
                                            onChange={(e) => handleUpdateParameter(param.id, 'femaleCriticalLow', e.target.value)}
                                          />
                                          <FormInput
                                            label="Critical High (>)"
                                            type="number"
                                            step="any"
                                            placeholder="e.g. 20.0"
                                            value={param.femaleCriticalHigh}
                                            onChange={(e) => handleUpdateParameter(param.id, 'femaleCriticalHigh', e.target.value)}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* If TEXT: Info message */}
                                {param.resultType === 'TEXT' && (
                                  <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-[11px] text-gray-500 italic">
                                    Descriptive free-text observation. Technicians will enter qualitative observations or remarks.
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & SUBMIT */}
            {wizardStep === 4 && (
              <div className="flex flex-col gap-4 text-sm">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2">
                  <h4 className="font-bold text-gray-800 text-sm">Test Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-gray-700">
                    <div><span className="font-semibold text-gray-500">Name:</span> {testForm.name}</div>
                    <div><span className="font-semibold text-gray-500">Code:</span> {testForm.code}</div>
                    <div><span className="font-semibold text-gray-500">Category:</span> {testForm.category}</div>
                  </div>
                  {testForm.description && (
                    <div className="text-xs text-gray-600 pt-1 border-t border-gray-200">
                      <span className="font-semibold text-gray-500">Description:</span> {testForm.description}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2">
                  <h4 className="font-bold text-gray-800 text-sm">
                    Sample Containers ({testForm.sampleGroups.length})
                  </h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1">
                    {testForm.sampleGroups.map((sg) => {
                      const c = containerTypes.find((item) => String(item.id) === String(sg.containerTypeId));
                      return (
                        <li key={sg.key}>
                          Group {sg.key.toUpperCase()}: <span className="font-medium text-gray-900">{sg.sampleType}</span> — {sg.numContainers}x {c?.name || 'Container'} (Letter {c?.labelLetter || '?'}), Day {sg.dayOffset}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-2">
                  <h4 className="font-bold text-gray-800 text-sm">
                    Parameters ({testForm.parameters.length})
                  </h4>
                  <ul className="list-disc pl-5 text-gray-700 space-y-1.5">
                    {testForm.parameters.map((p) => {
                      const sg = testForm.sampleGroups.find((g) => g.key === p.sampleGroupKey);
                      const c = containerTypes.find((item) => String(item.id) === String(sg?.containerTypeId));
                      return (
                        <li key={p.id}>
                          <span className="font-semibold text-gray-900">{p.name}</span>
                          <span className="text-xs ml-2 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100">
                            {c?.name || 'Container'} (Group {p.sampleGroupKey?.toUpperCase() || '?'})
                          </span>
                          <span className="text-gray-500 text-xs ml-1.5">— Type: {p.resultType}{p.unit ? ` (${p.unit})` : ''}</span>
                          {p.resultType === 'CHOICE' && (
                            <span className="text-gray-600 block text-xs mt-0.5">
                              Options: {p.possibleOptions || 'None'}{p.abnormalOptions ? ` | Abnormal: ${p.abnormalOptions}` : ''}
                            </span>
                          )}
                          {p.resultType === 'NUMBER' && (
                            <span className="text-gray-600 block text-xs mt-0.5">
                              Male: {p.maleMinRange || '-'} to {p.maleMaxRange || '-'}
                              {p.maleCriticalLow || p.maleCriticalHigh ? ` (Crit: <${p.maleCriticalLow || '-'}, >${p.maleCriticalHigh || '-'})` : ''}
                              {' | '}Female: {p.femaleMinRange || '-'} to {p.femaleMaxRange || '-'}
                              {p.femaleCriticalLow || p.femaleCriticalHigh ? ` (Crit: <${p.femaleCriticalLow || '-'}, >${p.femaleCriticalHigh || '-'})` : ''}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={wizardStep === 1 ? () => setShowWizard(false) : handlePrevStep}
              >
                {wizardStep === 1 ? 'Cancel' : 'Back'}
              </Button>

              <div className="flex items-center gap-2">
                {wizardStep < 4 ? (
                  <Button variant="primary" size="sm" onClick={handleNextStep}>
                    Next Step
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={submitting}
                    onClick={handleSubmitTest}
                    leftIcon={<CheckCircle2 size={16} />}
                  >
                    Save & Create Test Catalog Entry
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>

        {/* ========================================================================= */}
        {/* VIEW TEST DETAIL MODAL */}
        {/* ========================================================================= */}
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={selectedTestDetail?.name || 'Test Details'}
          size="xl"
          footer={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDetailModalOpen(false)}
            >
              Close
            </Button>
          }
        >
          {detailLoading || !selectedTestDetail ? (
            <p className="text-sm text-gray-500 py-8 text-center">Loading test details...</p>
          ) : (
            <div className="flex flex-col gap-6 text-sm">
              {/* Basic Info Summary Card */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Test Code</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedTestDetail.code}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Category</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedTestDetail.category}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
                    <div className="mt-0.5">
                      <Badge variant={selectedTestDetail.isActive ? 'green' : 'gray'}>
                        {selectedTestDetail.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Parameters</span>
                    <span className="text-sm font-semibold text-gray-900">{selectedTestDetail.parameters?.length || 0} configured</span>
                  </div>
                </div>

                {selectedTestDetail.description && (
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-700">
                    <span className="font-semibold text-gray-500">Description / Clinical Notes: </span>
                    {selectedTestDetail.description}
                  </div>
                )}
              </div>

              {/* Specimen Containers */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Specimen Containers</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100/75 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2.5">Specimen Type</th>
                        <th className="px-4 py-2.5">Container</th>
                        <th className="px-4 py-2.5">Tube Letter</th>
                        <th className="px-4 py-2.5">Containers Count</th>
                        <th className="px-4 py-2.5">Day Offset</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {selectedTestDetail.sampleGroups?.map((sg) => (
                        <tr key={sg.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-medium text-gray-900">{sg.sampleType}</td>
                          <td className="px-4 py-3 text-gray-700">{sg.containerTypeName}</td>
                          <td className="px-4 py-3 font-mono font-bold text-blue-600">{sg.labelLetter}</td>
                          <td className="px-4 py-3 text-gray-700">{sg.numContainers}</td>
                          <td className="px-4 py-3 text-gray-700">Day {sg.dayOffset}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Parameters & Reference Ranges */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">Test Parameters & Reference Ranges</h4>
                <div className="flex flex-col gap-2.5">
                  {selectedTestDetail.parameters?.map((p) => (
                    <div key={p.id} className="p-3.5 rounded-xl border border-gray-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between font-semibold text-gray-900">
                        <span className="text-sm">
                          {p.name} {p.unit ? <span className="font-normal text-gray-500">({p.unit})</span> : ''}
                        </span>
                        <Badge variant="blue">{p.resultType}</Badge>
                      </div>

                      {p.resultType === 'CHOICE' && (
                        <div className="mt-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          <span className="font-semibold text-gray-700">Options: </span>
                          <span>{p.possibleOptions || 'None configured'}</span>
                          {p.abnormalOptions && (
                            <span className="text-red-600 font-semibold ml-3">
                              (Flagged Abnormal: {p.abnormalOptions})
                            </span>
                          )}
                        </div>
                      )}

                      {p.resultType === 'NUMBER' && (
                        <div className="mt-2 pl-3 border-l-2 border-blue-500 flex flex-col sm:flex-row gap-2 sm:gap-8 text-xs text-gray-700">
                          <div>
                            <span className="font-semibold text-blue-700">Male: </span>
                            {p.maleMinRange ?? '-'} to {p.maleMaxRange ?? '-'}
                            {(p.maleCriticalLow !== null || p.maleCriticalHigh !== null) && (
                              <span className="text-red-600 font-medium ml-1.5">
                                (Critical: &lt;{p.maleCriticalLow ?? '-'}, &gt;{p.maleCriticalHigh ?? '-'})
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-pink-700">Female: </span>
                            {p.femaleMinRange ?? '-'} to {p.femaleMaxRange ?? '-'}
                            {(p.femaleCriticalLow !== null || p.femaleCriticalHigh !== null) && (
                              <span className="text-red-600 font-medium ml-1.5">
                                (Critical: &lt;{p.femaleCriticalLow ?? '-'}, &gt;{p.femaleCriticalHigh ?? '-'})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {p.resultType === 'TEXT' && (
                        <p className="text-gray-500 mt-2 text-xs italic">
                          Free-text observation
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* ========================================================================= */}
        {/* CONFIRM DEACTIVATE / ACTIVATE DIALOG */}
        {/* ========================================================================= */}
        <ConfirmDialog
          isOpen={toggleConfirmOpen}
          onClose={() => setToggleConfirmOpen(false)}
          onConfirm={confirmToggleActive}
          title={testToToggle?.isActive ? 'Deactivate Test Catalog Entry' : 'Activate Test Catalog Entry'}
          message={`Are you sure you want to ${testToToggle?.isActive ? 'deactivate' : 'activate'} "${testToToggle?.name}"? ${
            testToToggle?.isActive
              ? 'Deactivating will hide this test from new patient order selection, but preserves existing historical orders and patient results.'
              : 'Activating will make this test available for order selection immediately.'
          }`}
          confirmText={testToToggle?.isActive ? 'Deactivate' : 'Activate'}
          variant={testToToggle?.isActive ? 'danger' : 'primary'}
        />
      </div>
    </Layout>
  );
};

export default TestCatalogPage;
