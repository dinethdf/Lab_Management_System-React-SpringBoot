import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../../components/Layout';
import {
  PageHeader,
  BarcodeInput,
  Button,
  Badge,
  ConfirmDialog,
  PatientInfoCard,
  FormTextarea,
  useToast,
} from '../../components/ui';
import { FlaskConical, Save, Send, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import resultService from '../../services/resultService';

/**
 * ResultEntryPage — Lab technician result recording workbench.
 * Supports barcode scanning, draft saving, live abnormality highlighting,
 * and submission for Senior Lab Technician verification.
 */
const ResultEntryPage = () => {
  const location = useLocation();
  const { showSuccess, showError, showWarning } = useToast();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Parameter values: { [parameterId]: { numericValue, textValue, choiceValue } }
  const [paramValues, setParamValues] = useState({});
  const [notes, setNotes] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Barcode scan handler
  const handleScan = async (scannedCode) => {
    if (!scannedCode || !scannedCode.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await resultService.getResultFormByCode(scannedCode.trim());
      setFormData(data);
      setNotes(data.notes || '');

      // Initialize parameter values
      const initialValues = {};
      if (data.parameters) {
        data.parameters.forEach((p) => {
          initialValues[p.parameterId] = {
            numericValue: p.currentNumericValue !== null && p.currentNumericValue !== undefined ? String(p.currentNumericValue) : '',
            textValue: p.currentTextValue || '',
            choiceValue: p.currentChoiceValue || '',
          };
        });
      }
      setParamValues(initialValues);
      showSuccess(`Loaded test form for ${data.testName} (${data.patientName})`);
    } catch (err) {
      console.error('Scan error:', err);
      showError(err.response?.data?.message || 'No lab test found for this barcode. Please verify the code.', 'Lookup Error');
      setFormData(null);
    } finally {
      setLoading(false);
    }
  };

  // Automatically trigger scan if redirected from Quick Scan with a prefill code
  useEffect(() => {
    if (location.state?.prefillCode) {
      handleScan(location.state.prefillCode);
    }
  }, [location.state]);

  const handleValueChange = (parameterId, field, value) => {
    setParamValues((prev) => ({
      ...prev,
      [parameterId]: {
        ...(prev[parameterId] || {}),
        [field]: value,
      },
    }));
  };

  const isFormLocked = formData && (formData.status === 'SUBMITTED' || formData.status === 'APPROVED');

  // Evaluate abnormal status in live UI
  const evaluateAbnormality = (param, valObj) => {
    if (!valObj) return { isAbnormal: false, isCritical: false };

    if (param.resultType === 'NUMBER') {
      const num = parseFloat(valObj.numericValue);
      if (isNaN(num)) return { isAbnormal: false, isCritical: false };

      let isAbnormal = false;
      let isCritical = false;

      if (param.refLower !== null && num < param.refLower) isAbnormal = true;
      if (param.refUpper !== null && num > param.refUpper) isAbnormal = true;

      if (param.criticalLow !== null && num < param.criticalLow) isCritical = true;
      if (param.criticalHigh !== null && num > param.criticalHigh) isCritical = true;

      return { isAbnormal, isCritical };
    }

    if (param.resultType === 'CHOICE') {
      const selected = param.options?.find((o) => o.label === valObj.choiceValue);
      return { isAbnormal: Boolean(selected?.isAbnormal), isCritical: false };
    }

    return { isAbnormal: false, isCritical: false };
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!formData) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const valuesPayload = Object.keys(paramValues).map((paramId) => {
        const item = paramValues[paramId] || {};
        return {
          parameterId: Number(paramId),
          numericValue: item.numericValue !== '' && item.numericValue !== null ? Number(item.numericValue) : null,
          textValue: item.textValue || null,
          choiceValue: item.choiceValue || null,
        };
      });

      const payload = {
        orderTestId: formData.orderTestId,
        notes: notes || null,
        values: valuesPayload,
      };

      const saved = await resultService.saveDraft(payload);
      showSuccess('Draft results saved successfully.');
      setFormData((prev) => ({
        ...prev,
        resultId: saved.id,
        status: 'DRAFT',
      }));
    } catch (err) {
      console.error('Save draft error:', err);
      showError(err.response?.data?.message || 'Failed to save draft result.', 'Save Error');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit for Verification
  const handleFinalSubmit = async () => {
    if (!formData) return;
    setShowSubmitModal(false);
    setSubmitting(true);

    try {
      // 1. Ensure latest values are saved as draft first
      const valuesPayload = Object.keys(paramValues).map((paramId) => {
        const item = paramValues[paramId] || {};
        return {
          parameterId: Number(paramId),
          numericValue: item.numericValue !== '' && item.numericValue !== null ? Number(item.numericValue) : null,
          textValue: item.textValue || null,
          choiceValue: item.choiceValue || null,
        };
      });

      const draftPayload = {
        orderTestId: formData.orderTestId,
        notes: notes || null,
        values: valuesPayload,
      };

      const saved = await resultService.saveDraft(draftPayload);

      // 2. Submit saved result for verification
      await resultService.submitForVerification(saved.id);
      showSuccess('Results successfully submitted for Senior Lab Technician verification!', 'Submitted');
      setFormData((prev) => ({
        ...prev,
        resultId: saved.id,
        status: 'SUBMITTED',
      }));
    } catch (err) {
      console.error('Submit error:', err);
      showError(err.response?.data?.message || 'Failed to submit results.', 'Submission Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(null);
    setParamValues({});
    setNotes('');
    setError(null);
    setSuccess(null);
  };

  return (
    <Layout title="Result Entry">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Diagnostic Result Entry"
          subtitle="Scan specimen container barcode to record, review, and submit test results."
          actions={
            formData && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                leftIcon={<RotateCcw size={15} />}
              >
                Scan Next Container
              </Button>
            )
          }
        />

        {/* Barcode Scanner Intake */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-800">1. Scan Specimen Container or Test Sample Code</h2>
          <BarcodeInput
            placeholder="Scan barcode or enter code (e.g. TSC-00001-01 or container TSC-00001-01-P1)..."
            onScan={handleScan}
            disabled={loading}
          />
        </div>

        {/* Result Form Container */}
        {formData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Patient & Test Demographics Card */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <PatientInfoCard
                id={`P-${String(formData.patientId).padStart(4, '0')}`}
                name={formData.patientName}
                age={formData.patientAgeYears}
                gender={formData.patientSex}
                contactNumber={formData.patientContact}
              />

              <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold text-gray-800">Test Context</span>
                  <Badge
                    variant={
                      formData.status === 'APPROVED'
                        ? 'green'
                        : formData.status === 'SUBMITTED'
                        ? 'blue'
                        : formData.status === 'REJECTED'
                        ? 'red'
                        : 'amber'
                    }
                  >
                    {formData.status}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1.5 text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-800">Test:</span> {formData.testName}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Sample Code:</span>{' '}
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                      {formData.testSampleCode}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Category:</span> {formData.testCategory}
                  </div>
                </div>

                {formData.status === 'REJECTED' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 flex flex-col gap-1">
                    <span className="font-bold flex items-center gap-1">
                      <AlertTriangle size={14} /> Rejection Reason from Senior Tech:
                    </span>
                    <p className="text-red-700">{formData.rejectionReason}</p>
                  </div>
                )}

                {formData.status === 'SUBMITTED' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
                    <p className="font-medium">
                      This result has been submitted and is currently awaiting Senior Lab Technician verification. Inputs are locked.
                    </p>
                  </div>
                )}

                {formData.status === 'APPROVED' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    <p className="font-medium flex items-center gap-1">
                      <CheckCircle2 size={14} /> Result has been approved and released. No modifications allowed.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Parameters Input Workbench */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <FlaskConical size={16} className="text-blue-600" />
                    Enter Test Parameters ({formData.parameters?.length || 0})
                  </h3>
                  <span className="text-xs text-gray-400">
                    Calculations and abnormality checks evaluated automatically
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {formData.parameters?.map((param) => {
                    const currentVal = paramValues[param.parameterId] || {};
                    const { isAbnormal, isCritical } = evaluateAbnormality(param, currentVal);

                    return (
                      <div
                        key={param.parameterId}
                        className={`p-3.5 rounded-xl border transition-colors flex flex-col gap-2 ${
                          isCritical
                            ? 'bg-red-50/70 border-red-300'
                            : isAbnormal
                            ? 'bg-amber-50/60 border-amber-300'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 flex items-center gap-2">
                            {param.parameterName}
                            {param.unit && <span className="font-normal text-gray-500">({param.unit})</span>}
                          </span>

                          <div className="flex items-center gap-2">
                            {isCritical && <Badge variant="red">CRITICAL</Badge>}
                            {isAbnormal && !isCritical && <Badge variant="amber">ABNORMAL</Badge>}
                            <span className="text-[11px] text-gray-400 font-mono">
                              Type: {param.resultType}
                            </span>
                          </div>
                        </div>

                        {/* NUMBER INPUT */}
                        {param.resultType === 'NUMBER' && (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                step="any"
                                placeholder={`Enter value in ${param.unit || 'units'}`}
                                value={currentVal.numericValue || ''}
                                onChange={(e) =>
                                  handleValueChange(param.parameterId, 'numericValue', e.target.value)
                                }
                                disabled={isFormLocked}
                                className="w-full sm:w-64 px-3 py-1.5 text-xs text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                              />
                              {param.unit && (
                                <span className="text-xs font-semibold text-gray-600">{param.unit}</span>
                              )}
                            </div>

                            {/* Reference Range Indicator */}
                            {(param.refLower !== null || param.refUpper !== null) && (
                              <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                <span className="text-emerald-700 font-medium">
                                  Ref Range: {param.refLower ?? '-'} — {param.refUpper ?? '-'}{' '}
                                  {param.unit || ''}
                                </span>
                                {(param.criticalLow !== null || param.criticalHigh !== null) && (
                                  <span className="text-red-600 font-medium">
                                    [Critical: &lt;{param.criticalLow ?? '-'} or &gt;{param.criticalHigh ?? '-'}]
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* CHOICE INPUT */}
                        {param.resultType === 'CHOICE' && (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {param.options?.map((opt, oIdx) => {
                              const isSelected = currentVal.choiceValue === opt.label;
                              return (
                                <button
                                  key={oIdx}
                                  type="button"
                                  disabled={isFormLocked}
                                  onClick={() => handleValueChange(param.parameterId, 'choiceValue', opt.label)}
                                  className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                                    isSelected
                                      ? opt.isAbnormal
                                        ? 'bg-red-600 text-white border-red-600'
                                        : 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  {opt.label}
                                  {opt.isAbnormal && !isSelected && (
                                    <span className="ml-1 text-[10px] text-red-500 font-bold">*</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* TEXT INPUT */}
                        {param.resultType === 'TEXT' && (
                          <textarea
                            rows={2}
                            placeholder="Enter laboratory observations or comments..."
                            value={currentVal.textValue || ''}
                            onChange={(e) => handleValueChange(param.parameterId, 'textValue', e.target.value)}
                            disabled={isFormLocked}
                            className="w-full px-3 py-1.5 text-xs text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Overall Notes */}
                <div className="pt-2 border-t border-gray-100">
                  <FormTextarea
                    label="Technician Clinical Notes / Comments"
                    placeholder="Optional remarks for the Senior Lab Technician..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={isFormLocked}
                    rows={2}
                  />
                </div>

                {/* Actions */}
                {!isFormLocked && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSaveDraft}
                      loading={submitting}
                      leftIcon={<Save size={15} />}
                    >
                      Save Draft
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowSubmitModal(true)}
                      loading={submitting}
                      leftIcon={<Send size={15} />}
                    >
                      Submit for Verification
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Submit Dialog */}
        <ConfirmDialog
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onConfirm={handleFinalSubmit}
          title="Submit Results for Senior Verification?"
          message="Once submitted, the results will be locked for editing and forwarded to a Senior Lab Technician for clinical verification. Are you sure you want to proceed?"
          confirmText="Yes, Submit Results"
          variant="primary"
        />
      </div>
    </Layout>
  );
};

export default ResultEntryPage;
