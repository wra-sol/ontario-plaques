import { Link, NavLink } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import type { Theme } from '../lib/theme';

interface NavProps {
  theme: Theme;
}

export default function Nav({ theme }: NavProps) {
  return (
    <div className="header">
      <div className="container header-inner">
        <Link className="brand" to="/">ONTARIO <strong>PLAQUES</strong></Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <nav className="nav">
            <NavLink to="/" end prefetch="intent" className="hide-on-mobile">Home</NavLink>
            <NavLink to="/plaques" prefetch="intent" className="hide-on-mobile">Plaques</NavLink>
            <NavLink to="/about" prefetch="intent" className="hide-on-mobile">About</NavLink>
          </nav>
          <ThemeToggle theme={theme} />
        </div>
      </div>
    </div>
  );
}

