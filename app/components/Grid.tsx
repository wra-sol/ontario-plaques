import type { ReactNode, CSSProperties } from 'react';

interface GridProps {
  children: ReactNode;
  columns?: number | string;
  gap?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function Grid({ 
  children, 
  columns = 'repeat(auto-fill, minmax(260px, 1fr))', 
  gap = 16,
  className = '',
  style = {}
}: GridProps) {
  const computedStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    ...style
  };
  
  return (
    <div className={className} style={computedStyle}>
      {children}
    </div>
  );
}

