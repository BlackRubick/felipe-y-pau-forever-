
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  header,
  footer,
  padding = 'md',
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className || ''}`}>
      {header && <div className="border-b border-gray-200 p-6">{header}</div>}
      <div className={paddingClasses[padding]}>{children}</div>
      {footer && <div className="border-t border-gray-200 p-6">{footer}</div>}
    </div>
  );
};
