import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, as: Component = 'div', className = '', style = {} }: CardProps) {
  return (
    <Component className={`card ${className}`.trim()} style={style}>
      {children}
    </Component>
  );
}

