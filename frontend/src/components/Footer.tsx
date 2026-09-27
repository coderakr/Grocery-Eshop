import { Link } from 'react-router-dom';

const STORE_NAME = import.meta.env.VITE_STORE_NAME ?? 'GreenCart';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <span className="brand__name">{STORE_NAME}</span>
          <p className="footer__tagline">
            Fresh groceries delivered to your doorstep within hours.
          </p>
        </div>
        <div className="footer__links">
          <Link to="/shop">Shop</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/login">Account</Link>
        </div>
        <p className="footer__copy">
          © {new Date().getFullYear()} {STORE_NAME}. Built with the MERN-style
          stack, TypeScript, Drizzle &amp; Neon.
        </p>
      </div>
    </footer>
  );
}
