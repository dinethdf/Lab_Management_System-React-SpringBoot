import React from 'react';
import { ContentCard } from './ui/ContentCard';

export const WelcomeBanner = ({ title, subtitle, stats }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#E8F0FE] to-[#C5D8F8] rounded-xl shadow-sm mb-6 p-8">
      <div className="relative z-10 flex justify-between items-center">
        <div>
          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            Good Morning
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        
        {/* Mock quick stats in the banner */}
        {stats && (
          <div className="hidden md:flex gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur rounded-lg px-4 py-3 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.colorClass}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{stat.value}</h4>
                  <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Decorative background circle */}
      <div className="absolute -right-20 -top-40 w-96 h-96 bg-white/20 rounded-full blur-3xl"></div>
    </div>
  );
};
export default WelcomeBanner;
