// Mock service for Admin Dashboard stats
export const dashboardService = {
  getStats: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalPatients: 315,
          patientsTrend: '+15%',
          totalStaff: 214,
          staffTrend: '+5%',
          totalTests: 742,
          testsTrend: '+8%',
          revenue: '$124.5k',
          revenueTrend: '+32%'
        });
      }, 500);
    });
  }
};
export default dashboardService;
