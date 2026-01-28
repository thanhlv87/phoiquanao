
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

const NavItem: React.FC<{ to: string; icon: 'home' | 'calendar'; label: string }> = ({ to, icon, label }) => {
  const activeClass = "text-sage-600";
  const inactiveClass = "text-gray-400 hover:text-gray-500";

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group flex flex-col items-center justify-center w-full pt-3 pb-2 transition-all duration-300 ${isActive ? activeClass : inactiveClass}`
      }
    >
      {({ isActive }) => (
          <>
            <div className={`mb-1.5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                <Icon name={icon as any} className="w-6 h-6" strokeWidth={isActive ? 2 : 1.5} />
            </div>
            {isActive && <div className="w-1 h-1 rounded-full bg-sage-600 mb-0.5"></div>}
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{label}</span>
          </>
      )}
    </NavLink>
  );
};

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-full px-12 py-2 flex items-center gap-12 min-w-[240px] justify-between">
            <NavItem to="/" icon="home" label="Home" />
            <NavItem to="/calendar" icon="calendar" label="Lịch" />
        </div>
    </nav>
  );
};
