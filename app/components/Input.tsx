import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
}

export function Input({ label, labelClassName = '', className = '', ...props }: InputProps) {
  const input = <input className={`input ${className}`.trim()} {...props} />;
  
  if (label) {
    return (
      <div>
        <label htmlFor={props.id} className={labelClassName} style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
          {label}
        </label>
        {input}
      </div>
    );
  }
  
  return input;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelClassName?: string;
}

export function Select({ label, labelClassName = '', className = '', children, ...props }: SelectProps) {
  const select = (
    <select className={`input ${className}`.trim()} {...props}>
      {children}
    </select>
  );
  
  if (label) {
    return (
      <div>
        <label htmlFor={props.id} className={labelClassName} style={{ display: 'block', marginBottom: '4px' }}>
          {label}
        </label>
        {select}
      </div>
    );
  }
  
  return select;
}

