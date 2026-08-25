
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: 'home' | 'calendar' | 'plus' | 'back' | 'chevron-left' | 'chevron-right' | 'logout' | 'search' | 'chart-bar' | 'mail' | 'lock' | 'trash';
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const defaultProps = {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8", // Nét vẽ thanh mảnh, sắc sảo hơn
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...props
  } as const;

  switch (name) {
    case 'home':
      return (
        <svg {...defaultProps}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...defaultProps}>
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
      );
    case 'plus':
       return (
        <svg {...defaultProps}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'back':
      return (
        <svg {...defaultProps}>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      );
    case 'chevron-left':
        return (
            <svg {...defaultProps}>
                <polyline points="15 18 9 12 15 6" />
            </svg>
        );
    case 'chevron-right':
        return (
            <svg {...defaultProps}>
                <polyline points="9 18 15 12 9 6" />
            </svg>
        );
    case 'logout':
        return (
            <svg {...defaultProps}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
        );
    case 'mail':
        return (
            <svg {...defaultProps}>
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
        );
    case 'lock':
        return (
            <svg {...defaultProps}>
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
        );
    case 'trash':
        return (
            <svg {...defaultProps}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
        );
    case 'search':
        return (
            <svg {...defaultProps}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
        );
    case 'chart-bar':
        return (
            <svg {...defaultProps}>
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
                <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
        );
    default:
      return null;
  }
};
