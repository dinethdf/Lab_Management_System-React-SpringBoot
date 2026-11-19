import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URLS } from '../../constants';
import {
  FileText,
  Lock,
  ShieldCheck,
  Download,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle2,
  Phone,
  Building2,
  RefreshCw,
  LogOut,
  HelpCircle,
  AlertTriangle,
  Printer,
  User,
  Award
} from 'lucide-react';

/**
 * PatientReportPage — Public, patient-facing diagnostic report self-service portal.
 *
 * Designed to be:
 * 1. Visual & Interactive: Displays full diagnostic laboratory results directly in the browser.
 * 2. Multi-channel: Provides both in-browser interactive report viewing and official PDF viewing/downloading.
 * 3. Mobile & Desktop Responsive: Optimized for 360px mobile screens through 4K displays.
 * 4. Privacy-first: Authenticates patient identity via last 4 digits of registered phone number.
 */
export default function PatientReportPage() {
  const { shareToken } = useParams();

  // Screen states: 'LOADING' | 'PREVIEW' | 'VERIFIED' | 'ERROR'
  const [screenState, setScreenState] = useState('LOADING');
  const [errorMessage, setErrorMessage] = useState('');

  // Report preview metadata (loaded before PIN verification)
  const [reportInfo, setReportInfo] = useState({
    reportNumber: '',
    testName: '',
    testCode: '',
    reportDate: '',
    hospitalName: 'City Diagnostic Laboratory',
    maskedMobile: '****'
  });

  // 4-box PIN state (array of 4 single character strings)
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const pinInputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Verification & Session state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [sessionData, setSessionData] = useState(null); // Full report details

  // 30-minute session countdown timer (in seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(30 * 60);
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Fetch public preview metadata on initial page load (or restore active session)
  useEffect(() => {
    async function initPage() {
      if (!shareToken) {
        setScreenState('ERROR');
        setErrorMessage('Invalid report link. Please check the URL you received.');
        return;
      }

      // Check if patient already verified within the last 30 minutes in this browser tab
      const cachedSessionRaw = sessionStorage.getItem(`patient_report_session_${shareToken}`);
      if (cachedSessionRaw) {
        try {
          const cached = JSON.parse(cachedSessionRaw);
          if (cached && cached.sessionToken) {
            // Restore active session
            setSessionData(cached);
            setScreenState('VERIFIED');
            return;
          }
        } catch (e) {
          sessionStorage.removeItem(`patient_report_session_${shareToken}`);
        }
      }

      // Otherwise fetch public preview metadata
      try {
        setScreenState('LOADING');
        const response = await axios.get(`${API_URLS.BASE}/public/report/${shareToken}`);
        setReportInfo(response.data);
        setScreenState('PREVIEW');
      } catch (err) {
        setScreenState('ERROR');
        const serverMsg = err.response?.data?.message || 'Report link not found or has expired. Please contact the laboratory.';
        setErrorMessage(serverMsg);
      }
    }

    initPage();
  }, [shareToken]);

  // 2. Countdown timer for active 30-minute session
  useEffect(() => {
    if (screenState !== 'VERIFIED' || !sessionData) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Session expired: transition back to preview
          sessionStorage.removeItem(`patient_report_session_${shareToken}`);
          setSessionData(null);
          setScreenState('PREVIEW');
          setVerifyError('Your 30-minute viewing session has expired. Please re-enter your PIN.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screenState, sessionData, shareToken]);

  // Handle individual digit change in the 4-box PIN input
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    const newDigits = [...pinDigits];

    if (cleaned.length > 0) {
      newDigits[index] = cleaned[cleaned.length - 1]; // take latest typed digit
      setPinDigits(newDigits);
      setVerifyError('');

      // Auto-advance to next input box if available
      if (index < 3) {
        pinInputRefs[index + 1].current?.focus();
      }
    } else {
      // User cleared the box
      newDigits[index] = '';
      setPinDigits(newDigits);
    }
  };

  // Handle keyboard events like Backspace for smooth cursor movement
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs[index - 1].current?.focus();
    } else if (e.key === 'Enter') {
      const fullPin = pinDigits.join('');
      if (fullPin.length === 4) {
        submitPinVerification();
      }
    }
  };

  // Handle paste event (e.g., patient pastes "4567" into any box)
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (pasteData.length >= 4) {
      const digits = pasteData.slice(0, 4).split('');
      setPinDigits(digits);
      pinInputRefs[3].current?.focus();
      setVerifyError('');
    }
  };

  // 3. Submit PIN verification to backend
  const submitPinVerification = async () => {
    const fullPin = pinDigits.join('');
    if (fullPin.length !== 4) {
      setVerifyError('Please enter all 4 digits of your mobile PIN.');
      return;
    }

    try {
      setIsVerifying(true);
      setVerifyError('');

      const response = await axios.post(`${API_URLS.BASE}/public/report/${shareToken}/verify`, {
        pin: fullPin
      });

      // Verification successful! Cache session and show verified results
      const data = response.data;
      sessionStorage.setItem(`patient_report_session_${shareToken}`, JSON.stringify(data));
      setSessionData(data);
      setSecondsRemaining((data.expiresInMinutes || 30) * 60);
      setScreenState('VERIFIED');
    } catch (err) {
      const msg = err.response?.data?.message || 'Incorrect PIN. Please check the last 4 digits of your mobile number.';
      setVerifyError(msg);
      setPinDigits(['', '', '', '']);
      pinInputRefs[0].current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // 4. View report in browser (new tab)
  const handleOpenReportPdf = () => {
    if (!sessionData?.sessionToken) return;
    const streamUrl = `${API_URLS.BASE}/public/report/${shareToken}/pdf?sessionToken=${sessionData.sessionToken}`;
    window.open(streamUrl, '_blank', 'noopener,noreferrer');
  };

  // 5. Download report PDF directly to patient's device
  const handleDownloadPdf = async () => {
    if (!sessionData?.sessionToken) return;

    try {
      setIsDownloading(true);
      const response = await axios.get(`${API_URLS.BASE}/public/report/${shareToken}/pdf`, {
        headers: {
          'X-Session-Token': sessionData.sessionToken
        },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${sessionData.reportNumber || 'Diagnostic-Report'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert('Could not download PDF report. Please try clicking "Open Report" instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Format seconds into MM:SS
  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Exit/Lock session manually
  const handleLockSession = () => {
    sessionStorage.removeItem(`patient_report_session_${shareToken}`);
    setSessionData(null);
    setPinDigits(['', '', '', '']);
    setScreenState('PREVIEW');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Top Hospital Branding Header */}
      <header className="max-w-4xl w-full mx-auto text-center pt-2 pb-4">
        <div className="inline-flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-2.5">
          <Building2 className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          {reportInfo.hospitalName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Official Patient Diagnostic Report Portal
        </p>
      </header>

      {/* Main Content Area */}
      <main className={`w-full mx-auto my-auto transition-all duration-300 ${screenState === 'VERIFIED' ? 'max-w-4xl' : 'max-w-md'}`}>
        
        {/* ======================================================== */}
        {/* STATE A: LOADING SKELETON                                */}
        {/* ======================================================== */}
        {screenState === 'LOADING' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center animate-pulse">
            <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-slate-700">Connecting to secure medical portal...</h2>
            <p className="text-sm text-slate-400 mt-1">Retrieving verified diagnostic test record</p>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE B: ERROR / EXPIRED LINK                            */}
        {/* ======================================================== */}
        {screenState === 'ERROR' && (
          <div className="bg-white rounded-2xl shadow-xl border border-rose-100 p-6 sm:p-8 text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-rose-200">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Unable to Open Report</h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {errorMessage}
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-200/60 mb-6">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                Need Assistance?
              </h3>
              <p className="text-xs text-slate-500 leading-normal">
                If your test was completed recently, please check the link sent to your mobile phone or visit the laboratory reception counter with your Patient Slip barcode.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE C: STEP 1 — IDENTITY PIN VERIFICATION              */}
        {/* ======================================================== */}
        {screenState === 'PREVIEW' && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            
            {/* Report Ready Header Badge */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Report Verified & Ready
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                {reportInfo.testName || 'Diagnostic Report'}
              </h2>
              <p className="text-xs text-blue-100 mt-1">
                Report No: <span className="font-mono font-medium text-white">{reportInfo.reportNumber}</span> • {reportInfo.reportDate}
              </p>
            </div>

            <div className="p-6 sm:p-8">
              {/* Privacy Explanation */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 mb-3">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">
                  Verify Identity to Access
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  For your medical privacy, enter the last 4 digits of the mobile number registered with your test order.
                </p>

                {/* Masked Mobile Hint Pill */}
                <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 mt-3">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Registered Mobile: <strong className="font-mono text-slate-900 tracking-wider">{reportInfo.maskedMobile}</strong></span>
                </div>
              </div>

              {/* 4-Box PIN Input Keypad */}
              <div className="mb-6">
                <label className="block text-center text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                  Enter 4-Digit Mobile PIN
                </label>
                <div className="flex justify-center gap-3 sm:gap-4" onPaste={handlePaste}>
                  {pinDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={pinInputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      autoFocus={index === 0}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold font-mono rounded-xl border-2 transition-all outline-none ${
                        digit
                          ? 'border-blue-600 bg-blue-50/30 text-blue-900 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                      }`}
                    />
                  ))}
                </div>

                {/* Error Message if PIN is incorrect */}
                {verifyError && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}
              </div>

              {/* Verify & View Report Action Button */}
              <button
                onClick={submitPinVerification}
                disabled={isVerifying || pinDigits.some(d => !d)}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & View Report</span>
                  </>
                )}
              </button>

              {/* Security Footnote */}
              <p className="text-[11px] text-slate-400 text-center mt-5 leading-normal">
                🔒 Protected by 256-bit SSL encryption. This link is private to the registered patient.
              </p>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STATE D: STEP 2 — FULL IN-BROWSER CLINICAL REPORT VIEW    */}
        {/* ======================================================== */}
        {screenState === 'VERIFIED' && sessionData && (
          <div className="flex flex-col gap-5">
            
            {/* Top Patient Control Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Patient Access
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Welcome, <strong className="text-slate-800">{sessionData.patientName}</strong>
                </span>
              </div>

              {/* Action Buttons: View PDF, Download PDF, Session Lock */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleOpenReportPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                  title="Open official signed PDF report in a new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View PDF</span>
                </button>

                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  title="Download signed PDF file to your phone or computer"
                >
                  {isDownloading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={handleLockSession}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
                  title="Lock session and exit"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit</span>
                </button>
              </div>
            </div>

            {/* The Official Diagnostic Report Document Container */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
              
              {/* Document Header Banner */}
              <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-6 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                        {sessionData.hospitalName || 'City Diagnostic Laboratory'}
                      </h2>
                      <p className="text-xs text-slate-300">
                        Department of Clinical Pathology & Diagnostics
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase">
                      <Award className="w-3 h-3" />
                      Certified Diagnostic Report
                    </span>
                    <p className="text-xs text-slate-300 font-mono mt-1">
                      Report No: <strong className="text-white">{sessionData.reportNumber}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Released: {sessionData.reportDate}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient & Test Demographics Grid */}
              <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  
                  {/* Patient Info Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-blue-500" />
                      Patient Demographics
                    </h3>
                    <p className="text-sm font-bold text-slate-800">{sessionData.patientName}</p>
                    <div className="mt-1 space-y-0.5 text-slate-600">
                      <p>Patient ID: <strong className="font-mono text-slate-700">{sessionData.patientId}</strong></p>
                      <p>Age / Gender: <strong className="text-slate-700">{sessionData.patientAge} • {sessionData.patientGender}</strong></p>
                    </div>
                  </div>

                  {/* Test & Specimen Info Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                    <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-indigo-500" />
                      Investigation Ordered
                    </h3>
                    <p className="text-sm font-bold text-slate-800">{sessionData.testName}</p>
                    <div className="mt-1 space-y-0.5 text-slate-600">
                      <p>Test Code: <strong className="font-mono text-slate-700">{sessionData.testCode}</strong> ({sessionData.testCategory || 'General'})</p>
                      <p>Sample Code: <strong className="font-mono text-slate-700">{sessionData.testSampleCode}</strong></p>
                    </div>
                  </div>

                  {/* Lab Order Tracking Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs sm:col-span-2 lg:col-span-1">
                    <h3 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      Clinical Release
                    </h3>
                    <p className="text-slate-700">
                      Lab Slip Barcode: <strong className="font-mono text-slate-900">{sessionData.labSlipBarcode || '-'}</strong>
                    </p>
                    <div className="mt-1 space-y-0.5 text-slate-600">
                      <p>Verified By: <strong className="text-slate-800">{sessionData.verifiedBy || 'Senior Lab Officer'}</strong></p>
                      <p>Status: <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">APPROVED & RELEASED</span></p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Clinical Investigation Results Table */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <span>Clinical Parameters & Findings</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({sessionData.results?.length || 0} items evaluated)
                    </span>
                  </h3>
                </div>

                {/* The Diagnostic Results Table */}
                <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Parameter / Test Item</th>
                        <th className="py-3 px-4">Patient Result</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Biological Ref Range</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessionData.results && sessionData.results.length > 0 ? (
                        sessionData.results.map((param, pIdx) => {
                          const isCrit = param.isCritical || param.flag === 'CRITICAL';
                          const isAbn = param.isAbnormal || param.flag === 'ABNORMAL';

                          return (
                            <tr
                              key={pIdx}
                              className={`transition-colors ${
                                isCrit
                                  ? 'bg-rose-50/70 hover:bg-rose-50'
                                  : isAbn
                                  ? 'bg-amber-50/50 hover:bg-amber-50'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              {/* Parameter Name */}
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-800 text-sm block">
                                  {param.parameterName}
                                </span>
                                {param.unit && (
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    Unit: {param.unit}
                                  </span>
                                )}
                                <div className="sm:hidden text-[11px] text-slate-500 mt-0.5">
                                  Ref: {param.referenceRange} {param.unit}
                                </div>
                              </td>

                              {/* Patient Value */}
                              <td className="py-3 px-4">
                                <span className={`text-base font-extrabold font-mono ${
                                  isCrit ? 'text-rose-700' : isAbn ? 'text-amber-700' : 'text-slate-900'
                                }`}>
                                  {param.value}
                                </span>
                                {param.unit && (
                                  <span className="text-xs font-medium text-slate-500 ml-1">
                                    {param.unit}
                                  </span>
                                )}
                              </td>

                              {/* Reference Range (Desktop / Tablet) */}
                              <td className="py-3 px-4 hidden sm:table-cell text-slate-600 font-medium">
                                {param.referenceRange !== '-' ? (
                                  <span>{param.referenceRange} {param.unit}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Clinical interpretation</span>
                                )}
                              </td>

                              {/* Status Flag Badge */}
                              <td className="py-3 px-4 text-center">
                                {isCrit ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    Critical
                                  </span>
                                ) : isAbn ? (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    Out of Range
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Normal
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            No individual parameters recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Clinical Notes / Pathologist Remarks (if present) */}
                {sessionData.clinicalNotes && (
                  <div className="mt-5 p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs">
                    <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[11px] mb-1">
                      Clinical Remarks & Pathologist Notes:
                    </h4>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {sessionData.clinicalNotes}
                    </p>
                  </div>
                )}

                {/* Digital Verification & Advisory Sign-Off */}
                <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">
                        Electronically Verified by {sessionData.verifiedBy || 'Senior Lab Officer'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Certified Laboratory Information Management System (LMS)
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleOpenReportPdf}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors border border-slate-300/80"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View / Print PDF</span>
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isDownloading}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Medical Correlation Disclaimer */}
                <p className="text-[11px] text-slate-400 mt-4 leading-normal bg-slate-50 p-3 rounded-lg border border-slate-100 text-center sm:text-left">
                  ⚠️ <strong>Notice:</strong> Laboratory test results must be interpreted by a qualified medical practitioner in conjunction with your clinical history, symptoms, and examination findings.
                </p>

              </div>

            </div>

            {/* Session Expiration Status Pill */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span className="flex items-center gap-1 text-amber-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Session active for {formatTimeRemaining(secondsRemaining)}
              </span>
              <button
                onClick={handleLockSession}
                className="text-slate-500 hover:text-slate-800 underline transition-colors"
              >
                Close Session
              </button>
            </div>

          </div>
        )}

      </main>

      {/* Portal Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center text-xs text-slate-400 py-3">
        <p>© {new Date().getFullYear()} {reportInfo.hospitalName}. All rights reserved.</p>
        <p className="mt-0.5 text-[11px] text-slate-400">Diagnostic reports are legal certified laboratory documents.</p>
      </footer>

    </div>
  );
}
