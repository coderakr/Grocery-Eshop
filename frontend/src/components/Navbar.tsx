import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const STORE_NAME = import.meta.env.STORE_NAME ?? 'GreenCart';

export function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out');
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand__mark" aria-hidden="true">
            🥬
          </span>
          <span className="brand__name">{STORE_NAME}</span>
        </Link>

        <form className="navbar__search" onSubmit={handleSearch} role="search">
          <input
            type="search"
            placeholder="Search fresh produce, dairy, snacks…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search products"
          />
          <button type="submit" className="btn btn--primary">
            Search
          </button>
        </form>

        <button
          type="button"
          className="navbar__toggle"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>

        <nav className={`navbar__nav ${menuOpen ? 'is-open' : ''}`}>
          <NavLink to="/shop" onClick={() => setMenuOpen(false)}>
            Shop
          </NavLink>
          {user && (
            <NavLink to="/orders" onClick={() => setMenuOpen(false)}>
              Orders
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className="navbar__admin"
              onClick={() => setMenuOpen(false)}
            >
              Admin
            </NavLink>
          )}

          <Link
            to="/cart"
            className="navbar__cart"
            onClick={() => setMenuOpen(false)}
          >
            🛒 Cart
            {cart.itemCount > 0 && (
              <span className="navbar__cart-count">{cart.itemCount}</span>
            )}
          </Link>

          {user ? (
            <div className="navbar__user">
              <span className="navbar__user-name">Hi, {user.name.split(' ')[0]}</span>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => void handleLogout()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="navbar__auth">
              <Link to="/login" className="btn btn--ghost" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
              <Link to="/register" className="btn btn--primary" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
