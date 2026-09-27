import React from 'react';

interface ScrollAreaWithGradientsProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  gradientColorClass?: string;
  gradientHeightClass?: string;
}

export default function ScrollAreaWithGradients({
  children,
  className = '',
  containerClassName = 'flex-1 min-h-0 w-full',
}: ScrollAreaWithGradientsProps) {
  return (
    <div className={`relative flex flex-col ${containerClassName}`}>
      {/* Scrollable Container without gradient indicators */}
      <div className={`flex-1 overflow-y-auto min-h-0 ${className}`}>
        {children}
      </div>
    </div>
  );
}

