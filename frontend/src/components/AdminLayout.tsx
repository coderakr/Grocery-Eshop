import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/products', label: 'Products', icon: '🥕', end: false },
  { to: '/admin/categories', label: 'Categories', icon: '🗂️', end: false },
  { to: '/admin/orders', label: 'Orders', icon: '🧾', end: false },
];

export function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span aria-hidden="true">🥬</span> Admin Panel
        </div>
        <nav className="admin-sidebar__nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'is-active' : ''}`
              }
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/" className="admin-nav-link">
            <span aria-hidden="true">🏬</span>
            View Store
          </NavLink>
        </nav>
        <div className="admin-sidebar__user">
          <span>{user?.name}</span>
          <small>{user?.email}</small>
        </div>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
