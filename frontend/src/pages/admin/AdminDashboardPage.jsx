import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { StatCard } from '../../components/ui/StatCard';
import { WelcomeBanner } from '../../components/WelcomeBanner';
import { Users, FlaskConical, Stethoscope, BriefcaseMedical } from 'lucide-react';
import dashboardService from '../../services/dashboardService';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardService.getStats().then(setStats);
  }, []);

  const bannerStats = [
    { label: 'New Patients', value: '12', icon: Users, colorClass: 'bg-blue-100 text-blue-600' },
    { label: 'Tests Today', value: '45', icon: FlaskConical, colorClass: 'bg-green-100 text-green-600' },
  ];

  return (
    <Layout title="Dashboard">
      <WelcomeBanner 
        title="Dr. Admin User" 
        subtitle="You have a busy schedule today with 45 tests pending processing."
        stats={bannerStats}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard 
          title="Total Patients" 
          value={stats?.totalPatients || '...'} 
          icon={Users} 
          trend={stats?.patientsTrend} 
          trendUp={true} 
        />
        <StatCard 
          title="Total Staff" 
          value={stats?.totalStaff || '...'} 
          icon={Stethoscope} 
          trend={stats?.staffTrend} 
          trendUp={true} 
        />
        <StatCard 
          title="Laboratory Tests" 
          value={stats?.totalTests || '...'} 
          icon={FlaskConical} 
          trend={stats?.testsTrend} 
          trendUp={true} 
        />
        <StatCard 
          title="Hospital Revenue" 
          value={stats?.revenue || '...'} 
          icon={BriefcaseMedical} 
          trend={stats?.revenueTrend} 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center h-80">
          <p className="text-gray-400">Area Chart Placeholder (Test Volume)</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-center h-80">
          <p className="text-gray-400">Donut Chart Placeholder</p>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboardPage;
