import api from './api';
import { API_URLS } from '../constants';

/**
 * reportService — Client methods for interacting with diagnostic PDF report endpoints.
 */
export const reportService = {
  /**
   * Downloads the official PDF report by TestResult ID.
   * Fetches the binary blob and creates a temporary object URL for browser download.
   */
  downloadReportPdfByResultId: async (resultId, filename = 'diagnostic-report.pdf') => {
    const response = await api.get(`${API_URLS.REPORTS_BY_RESULT}/${resultId}/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    return url;
  },

  /**
   * Opens the official PDF report directly in a new browser tab for viewing and printing.
   */
  openReportPdfInNewTab: async (resultId) => {
    const response = await api.get(`${API_URLS.REPORTS_BY_RESULT}/${resultId}/pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    return url;
  },

  /**
   * FR-7.4: Counter barcode lookup. Resolves reports matching Lab Slip,
   * Patient Slip, or Specimen Container Code.
   */
  lookupReportsByBarcode: async (barcode) => {
    const response = await api.get(`${API_URLS.REPORTS_BY_BARCODE}/${encodeURIComponent(barcode)}`);
    return response.data;
  },

  /**
   * Fetches recent approved reports for quick counter lookup.
   */
  getRecentReports: async () => {
    const response = await api.get(API_URLS.REPORTS_RECENT);
    return response.data;
  },
};

export default reportService;
