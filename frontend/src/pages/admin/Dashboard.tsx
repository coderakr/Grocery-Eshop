import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDashboardStats } from '../../api/shop';
import { getErrorMessage } from '../../api/client';
import type { DashboardStats } from '../../api/shop';
import { Spinner } from '../../components/Spinner';
import { formatCurrency, formatDate, statusLabel } from '../../utils/format';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchDashboardStats()
      .then((data) => active && setStats(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner label="Crunching the numbers…" />;
  if (error || !stats)
    return <p className="alert alert--error">{error ?? 'No data'}</p>;

  const cards = [
    { label: 'Total revenue', value: formatCurrency(stats.revenue), icon: '💰' },
    { label: 'Last 7 days', value: formatCurrency(stats.weeklyRevenue), icon: '📈' },
    { label: 'Orders', value: String(stats.orders), icon: '🧾' },
    { label: 'Pending', value: String(stats.pendingOrders), icon: '⏳' },
    { label: 'Products', value: String(stats.products), icon: '🥕' },
    { label: 'Customers', value: String(stats.users), icon: '👥' },
  ];

  return (
    <div>
      <div className="admin-page-head">
        <h1>Dashboard</h1>
        <p className="muted">Overview of your store performance.</p>
      </div>

      <div className="stat-grid">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <span className="stat-card__icon" aria-hidden="true">
              {card.icon}
            </span>
            <span className="stat-card__label">{card.label}</span>
            <strong className="stat-card__value">{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-columns">
        <section className="card">
          <div className="card__head">
            <h3>Recent orders</h3>
            <Link to="/admin/orders" className="link">
              View all →
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="muted">No orders yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>#{order.id}</strong>
                      <br />
                      <small className="muted">
                        {formatDate(order.createdAt)}
                      </small>
                    </td>
                    <td>{order.user?.name ?? '—'}</td>
                    <td>
                      <span className={`status status--${order.status}`}>
                        {statusLabel(order.status)}
                      </span>
                    </td>
                    <td>{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card">
          <div className="card__head">
            <h3>Low stock</h3>
            <Link to="/admin/products" className="link">
              Manage →
            </Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="muted">All products are well stocked.</p>
          ) : (
            <ul className="low-stock">
              {stats.lowStock.map((product) => (
                <li key={product.id}>
                  <span>{product.name}</span>
                  <span className="badge badge--warn">
                    {product.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
