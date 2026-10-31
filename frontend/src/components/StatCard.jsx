import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import './StatCard.css';

const StatCard = ({ title, value, percentage, icon, data, color }) => {
  const isPositive = percentage.startsWith('+');
  
  return (
    <div className="card stat-card">
      <div className="stat-header flex-between">
        <h3 className="stat-title">{title}</h3>
        <div className="stat-icon" style={{ color: color, backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
      <div className="stat-body flex-between">
        <h2 className="stat-value">{value}</h2>
        <span className={`stat-percentage ${isPositive ? 'positive' : 'negative'}`} style={{ color: isPositive ? 'var(--status-completed-text)' : 'var(--status-urgent-text)' }}>
          {percentage}
        </span>
      </div>
      <div className="stat-chart">
        <ResponsiveContainer width="100%" height={50}>
          <LineChart data={data}>
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatCard;
