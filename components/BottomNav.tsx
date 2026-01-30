
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

const NavItem: React.FC<{ to: string; icon: 'home' | 'calendar'; label: string }> = ({ to, icon, label }) => {
  const activeClass = "text-indigo-600";
  const inactiveClass = "text-slate-400";

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full pt-3 pb-2 transition-all ${isActive ? activeClass + ' scale-105' : inactiveClass}`
      }
    >
      <Icon name={icon as any} className="w-5 h-5 mb-1.5" />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </NavLink>
  );
};

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around max-w-lg mx-auto px-10">
        <NavItem to="/" icon="home" label="Home" />
        <NavItem to="/calendar" icon="calendar" label="Lịch" />
      </div>
    </nav>
  );
};
