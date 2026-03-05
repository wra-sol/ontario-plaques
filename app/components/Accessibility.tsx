import { useState, useEffect } from 'react';
import { Button } from './Button';

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-100%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        padding: 'var(--space-3) var(--space-5)',
        background: 'var(--accent)',
        color: 'var(--white)',
        textDecoration: 'none',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        transition: 'top var(--transition-fast)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = 'var(--space-4)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-100%';
      }}
    >
      Skip to main content
    </a>
  );
}

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll to top"
      style={{
        position: 'fixed',
        bottom: 'var(--space-5)',
        right: 'var(--space-5)',
        width: '48px',
        height: '48px',
        background: 'var(--accent)',
        color: 'var(--white)',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-lg)',
        transition: 'transform var(--transition-fast), background-color var(--transition-fast)',
        zIndex: 100,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.background = 'var(--accent-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.background = 'var(--accent)';
      }}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
