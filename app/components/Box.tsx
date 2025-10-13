import type { ReactNode, CSSProperties } from 'react';

interface BoxProps {
  children: ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside' | 'header' | 'footer';
  border?: boolean;
  borderColor?: 'dark' | 'green';
  borderLeft?: boolean;
  borderLeftWidth?: number;
  bg?: 'light' | 'white';
  p?: number;
  mb?: number;
  mt?: number;
  className?: string;
  style?: CSSProperties;
}

export function Box({ 
  children, 
  as: Component = 'div',
  border,
  borderColor = 'dark',
  borderLeft,
  borderLeftWidth = 6,
  bg,
  p,
  mb,
  mt,
  className = '',
  style = {}
}: BoxProps) {
  const computedStyle: CSSProperties = { ...style };
  
  if (border) {
    computedStyle.border = `3px solid var(--${borderColor})`;
  }
  
  if (borderLeft) {
    computedStyle.borderLeft = `${borderLeftWidth}px solid var(--green)`;
    if (!border) {
      computedStyle.border = '3px solid var(--dark)';
    }
  }
  
  if (bg) {
    computedStyle.backgroundColor = `var(--${bg})`;
  }
  
  if (p !== undefined) {
    computedStyle.padding = p;
  }
  
  if (mb !== undefined) {
    computedStyle.marginBottom = mb;
  }
  
  if (mt !== undefined) {
    computedStyle.marginTop = mt;
  }
  
  return (
    <Component className={className} style={computedStyle}>
      {children}
    </Component>
  );
}

