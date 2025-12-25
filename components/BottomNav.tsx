
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { getTodayDateString } from '../utils/dateUtils';

const NavItem: React.FC<{ to: string; icon: 'home' | 'calendar' | 'search' | 'collections' | 'chart'; label: string }> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full pt-2 pb-1 transition-all duration-300 ${isActive
          ? 'text-purple-600'
          : 'text-gray-500 hover:text-purple-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon name={icon} className={`w-6 h-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
          <span className="text-xs font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
};

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();

  const handleAddOutfit = () => {
    const todayId = getTodayDateString();
    navigate(`/add-outfit/${todayId}`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-xl border-t border-white/20 shadow-2xl">
      <div className="flex justify-around max-w-lg mx-auto py-2">
        <NavItem to="/" icon="home" label="Trang chủ" />
        <NavItem to="/model-coordination" icon="person" label="Thử đồ" />
        <NavItem to="/collections" icon="collections" label="Bộ sưu tập" />
        <NavItem to="/insights" icon="chart" label="Thống kê" />
        <NavItem to="/calendar" icon="calendar" label="Lịch" />
      </div>
    </nav>
  );
};
