import React, { useState } from 'react';
import { LayoutDashboard, Users, FlaskConical, Droplet, FileText, Settings, ChevronDown, ChevronRight, Menu, Palette, CheckCircle2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const role = localStorage.getItem('role')?.toUpperCase();
  const [collapsed, setCollapsed] = useState(false);

  // Admin menu: Full system management
  const adminMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Staff Management', icon: Users, path: '/admin/users' },
    { name: 'Test Catalog', icon: FlaskConical, path: '/tests' },
    { name: 'Reception Desk', icon: Users, path: '/reception' },
    { name: 'Sample Collection', icon: Droplet, path: '/collection' },
    { name: 'Verification Queue', icon: CheckCircle2, path: '/verification-queue' },
    { name: 'UI Components', icon: Palette, path: '/components' },
  ];

  // Senior Lab Technician: Supervisor workbench
  const seniorTechMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Reception Desk', icon: Users, path: '/reception' },
    { name: 'Sample Collection', icon: Droplet, path: '/collection' },
    { name: 'Result Entry', icon: FileText, path: '/results/entry' },
    { name: 'Verification Queue', icon: CheckCircle2, path: '/verification-queue' },
    { name: 'UI Components', icon: Palette, path: '/components' },
  ];

  // Lab Technician: Testing workbench
  const techMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Reception Desk', icon: Users, path: '/reception' },
    { name: 'Sample Collection', icon: Droplet, path: '/collection' },
    { name: 'Result Entry', icon: FileText, path: '/results/entry' },
    { name: 'UI Components', icon: Palette, path: '/components' },
  ];

  // Receptionist: Patient lookup, registration, and test allocation ONLY
  const receptionistMenu = [
    { name: 'Reception Desk', icon: Users, path: '/reception' },
  ];

  let currentMenu = techMenu;
  if (role === 'ADMIN') {
    currentMenu = adminMenu;
  } else if (role === 'SENIOR_LAB_TECHNICIAN') {
    currentMenu = seniorTechMenu;
  } else if (role === 'RECEPTIONIST') {
    currentMenu = receptionistMenu;
  } else {
    currentMenu = techMenu;
  }

  return (
    <div className={`bg-white h-screen border-r border-gray-200 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} flex flex-col`}>
      {/* Logo Area */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <FlaskConical size={24} />
            <span>LabLMS</span>
          </div>
        )}
        {collapsed && <FlaskConical size={24} className="mx-auto text-blue-600" />}
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-gray-600">
          <Menu size={20} />
        </button>
      </div>

      {/* User Info (Visible if not collapsed) */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            {role?.[0] || 'U'}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Welcome</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {!collapsed && <p className="px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">MAIN</p>}
        <nav className="space-y-1 px-3">
          {currentMenu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.name : ''}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
