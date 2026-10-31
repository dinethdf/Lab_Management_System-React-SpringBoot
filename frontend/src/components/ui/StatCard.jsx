import React from 'react';
import { ContentCard } from './ContentCard';

export const StatCard = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <ContentCard className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Icon size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </div>
        )}
      </div>
    </ContentCard>
  );
};
