import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
  className?: string;
  style?: React.CSSProperties;
  hoverable?: boolean;
}

export function Card({ 
  children, 
  as: Component = 'div', 
  className = '', 
  style = {},
  hoverable = false 
}: CardProps) {
  const combinedClassName = `card ${hoverable ? 'hoverable' : ''} ${className}`.trim();
  
  return (
    <Component className={combinedClassName} style={style}>
      {children}
    </Component>
  );
}
