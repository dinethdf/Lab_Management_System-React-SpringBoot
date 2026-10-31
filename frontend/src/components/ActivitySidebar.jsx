import React from 'react';
import { MoreHorizontal, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import './ActivitySidebar.css';

const ActivitySidebar = () => {
  const chartData = [
    { name: 'Oct 20', value: 200, color: '#3b82f6' },
    { name: '22', value: 280, color: '#f97316' },
    { name: '23', value: 380, color: '#22c55e' },
    { name: '24', value: 260, color: '#eab308' },
    { name: '25', value: 320, color: '#a855f7' },
    { name: '26', value: 240, color: '#d946ef' },
  ];

  const upcoming = [
    { name: 'Amelia Evans', date: 'Oct 20-26' },
    { name: 'Amelia Evans', date: 'Oct 20-26' },
    { name: 'Amelia Evans', date: 'Oct 20-26' },
  ];

  return (
    <div className="card activity-sidebar">
      <div className="activity-header flex-between">
        <h3>Laboratory Activity</h3>
        <button className="action-icon"><MoreHorizontal size={16} /></button>
      </div>

      <div className="chart-section">
        <h4>Daily Tests Overview</h4>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={12}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="upcoming-section">
        <h4>Upcoming Samples</h4>
        <div className="upcoming-list">
          {upcoming.map((u, i) => (
            <div className="upcoming-item flex-between" key={i}>
              <div className="upcoming-info">
                <img src={`https://i.pravatar.cc/150?u=${i+10}`} alt="avatar" />
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="sub-text">{u.date}</p>
                </div>
              </div>
              <ChevronRight size={16} color="#9ca3af" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivitySidebar;
