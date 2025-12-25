
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

const NavItem: React.FC<{ to: string; icon: 'home' | 'calendar' | 'search' | 'collections' | 'mix' | 'chart-bar'; label: string }> = ({ to, icon, label }) => {
  const activeClass = "text-blue-600";
  const inactiveClass = "text-gray-500";

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors ${isActive ? activeClass : inactiveClass}`
      }
    >
      <Icon name={icon} className="w-6 h-6 mb-1" />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );
};

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-t-md">
      <div className="flex justify-around max-w-lg mx-auto">
        <NavItem to="/" icon="home" label="Trang chủ" />
        <NavItem to="/collections" icon="collections" label="Bộ sưu tập" />
        <NavItem to="/mix" icon="sparkles" label="Mix Đồ" />
        <NavItem to="/stats" icon="chart-bar" label="Thống kê" />
        <NavItem to="/calendar" icon="calendar" label="Lịch" />
      </div>
    </nav>
  );
};
