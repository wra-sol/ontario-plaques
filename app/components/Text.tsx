import type { ReactNode, CSSProperties } from 'react';

interface TextProps {
  children: ReactNode;
  size?: 'small' | 'base' | 'large';
  color?: 'dark' | 'mid' | 'green' | 'inherit';
  weight?: number;
  italic?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Text({ 
  children, 
  size = 'base', 
  color,
  weight,
  italic,
  className = '',
  style = {}
}: TextProps) {
  const computedStyle: CSSProperties = { ...style };
  
  if (size === 'small') {
    computedStyle.fontSize = '0.8rem';
  } else if (size === 'large') {
    computedStyle.fontSize = '1.1rem';
  }
  
  if (color && color !== 'inherit') {
    computedStyle.color = `var(--${color})`;
  }
  
  if (weight) {
    computedStyle.fontWeight = weight;
  }
  
  if (italic) {
    computedStyle.fontStyle = 'italic';
  }
  
  const classes = size === 'small' ? `small ${className}`.trim() : className;
  
  return (
    <p className={classes} style={computedStyle}>
      {children}
    </p>
  );
}

