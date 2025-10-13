import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  to?: string;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Button({ 
  children, 
  variant = 'primary', 
  to, 
  href, 
  type = 'button',
  onClick,
  className = '',
  style = {}
}: ButtonProps) {
  const baseClass = variant === 'secondary' ? 'button secondary' : 'button';
  const classes = `${baseClass} ${className}`.trim();
  
  if (to) {
    return (
      <Link to={to} className={classes} style={{ textDecoration: 'none', ...style }}>
        {children}
      </Link>
    );
  }
  
  if (href) {
    return (
      <a href={href} className={classes} style={{ textDecoration: 'none', ...style }} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  
  return (
    <button type={type} onClick={onClick} className={classes} style={style}>
      {children}
    </button>
  );
}

