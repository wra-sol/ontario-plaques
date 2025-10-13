import { Link, NavLink } from 'react-router-dom';

export default function Nav() {
  return (
    <div className="header">
      <div className="container header-inner">
        <Link className="brand" to="/">ONTARIO <strong>PLAQUES</strong></Link>
        <nav className="nav">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/plaques">Plaques</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </div>
    </div>
  );
}

