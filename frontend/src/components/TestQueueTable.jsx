import React from 'react';
import { Eye, Edit2 } from 'lucide-react';
import './TestQueueTable.css';

const TestQueueTable = () => {
  // Mock data matching the image perfectly
  const tests = [
    { id: 'ML-87392', patient: 'Amelia Evans', type: 'CBC', date: 'Oct 26, 11:32 AM', status: 'completed' },
    { id: 'ML-87393', patient: 'Amelia Evans', type: 'Blood Test - CBC', date: 'Oct 26, 11:32 AM', status: 'pending' },
    { id: 'ML-87394', patient: 'Amelia Evans', type: 'CBC', date: 'Oct 26, 11:32 AM', status: 'in-progress' },
    { id: 'ML-87395', patient: 'Amelia Evans', type: 'Blood Test - CBC', date: 'Oct 26, 11:32 AM', status: 'urgent' },
  ];

  return (
    <div className="card table-card">
      <div className="table-header flex-between">
        <h2>Patient Test Queue</h2>
        <div className="table-actions">
          <input type="text" placeholder="Search" className="search-input" />
          <button className="filter-btn">Filters</button>
        </div>
      </div>
      <table className="queue-table">
        <thead>
          <tr>
            <th>Test ID</th>
            <th>Patient Name</th>
            <th>Test Type</th>
            <th>Date/Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((t, i) => (
            <tr key={i}>
              <td className="font-medium">{t.id}</td>
              <td className="patient-cell">
                <img src={`https://i.pravatar.cc/150?u=${i}`} alt={t.patient} className="table-avatar"/>
                <div className="patient-info">
                  <span className="font-medium">{t.patient}</span>
                  <span className="sub-text">Procdered</span>
                </div>
              </td>
              <td>
                <div className="test-info">
                  <span className="font-medium">{t.type}</span>
                  <span className="sub-text">Lab Tech: Dr. Lee</span>
                </div>
              </td>
              <td>{t.date}</td>
              <td>
                <span className={`badge ${t.status}`}>
                  {t.status.replace('-', ' ').toUpperCase()}
                </span>
              </td>
              <td className="actions-cell">
                <button className="action-icon"><Eye size={16} /></button>
                <button className="action-icon"><Edit2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TestQueueTable;
