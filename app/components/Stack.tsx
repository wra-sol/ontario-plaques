import type { ReactNode, CSSProperties } from 'react';

interface StackProps {
  children: ReactNode;
  direction?: 'row' | 'column';
  gap?: number | string;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  wrap?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Stack({ 
  children, 
  direction = 'column', 
  gap = 8, 
  align,
  justify,
  wrap,
  className = '',
  style = {}
}: StackProps) {
  const computedStyle: CSSProperties = {
    display: 'flex',
    flexDirection: direction,
    gap: typeof gap === 'number' ? `${gap}px` : gap,
    ...style
  };
  
  if (align) {
    computedStyle.alignItems = align;
  }
  
  if (justify) {
    computedStyle.justifyContent = justify;
  }
  
  if (wrap) {
    computedStyle.flexWrap = 'wrap';
  }
  
  return (
    <div className={className} style={computedStyle}>
      {children}
    </div>
  );
}

