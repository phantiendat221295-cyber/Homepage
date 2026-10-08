import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-6 h-6', size = 24 }) => {
  // Special custom handling for Google Drive logo
  if (name.toLowerCase() === 'googledrive' || name.toLowerCase() === 'drive') {
    return (
      <svg className={className} viewBox="0 0 87.3 78" width={size} height={size}>
        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
        <path d="m59.8 53h27.5c0-1.55-.4-3.1-1.2-4.5l-25.4-44c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8z" fill="#ffba00"/>
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l-13.75-23.8h-39.6l-13.75 23.8c.8.45 1.65.8 2.55 1.05 1.35.35 2.75.4 4.15.25z" fill="#2684fc"/>
      </svg>
    );
  }

  // Look up icon in lucide-react
  const IconComponent = (LucideIcons as Record<string, any>)[name] ||
    (LucideIcons as Record<string, any>)[name.charAt(0).toUpperCase() + name.slice(1)] ||
    LucideIcons.Sparkles;

  return <IconComponent className={className} size={size} />;
};
