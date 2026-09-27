import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyOrders } from '../api/shop';
import { getErrorMessage } from '../api/client';
import type { Order } from '../types';
import { Spinner } from '../components/Spinner';
import { formatCurrency, formatDate, statusLabel } from '../utils/format';

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetchMyOrders()
      .then((data) => active && setOrders(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Spinner label="Loading your orders…" />;

  return (
    <div className="container section">
      <h1>My orders</h1>
      {error && <p className="alert alert--error">{error}</p>}
      {orders.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">🧾</span>
          <h3>No orders yet</h3>
          <p>Once you place an order, it will appear here.</p>
          <Link to="/shop" className="btn btn--primary">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => {
            const isOpen = openId === order.id;
            return (
              <div key={order.id} className="card order-card">
                <button
                  type="button"
                  className="order-card__head"
                  onClick={() => setOpenId(isOpen ? null : order.id)}
                  aria-expanded={isOpen}
                >
                  <div>
                    <strong>Order #{order.id}</strong>
                    <span className="muted">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-card__head-right">
                    <span className={`status status--${order.status}`}>
                      {statusLabel(order.status)}
                    </span>
                    <strong>{formatCurrency(order.total)}</strong>
                    <span className="order-card__chevron">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="order-card__body">
                    <ul className="order-card__items">
                      {order.items.map((item) => (
                        <li key={item.id}>
                          <span>
                            {item.productName} × {item.quantity}
                          </span>
                          <span>
                            {formatCurrency(
                              Number(item.unitPrice) * item.quantity,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <dl className="order-card__totals">
                      <div>
                        <dt>Subtotal</dt>
                        <dd>{formatCurrency(order.subtotal)}</dd>
                      </div>
                      <div>
                        <dt>Delivery</dt>
                        <dd>
                          {Number(order.shippingFee) === 0
                            ? 'Free'
                            : formatCurrency(order.shippingFee)}
                        </dd>
                      </div>
                      <div className="cart-summary__total">
                        <dt>Total</dt>
                        <dd>{formatCurrency(order.total)}</dd>
                      </div>
                    </dl>
                    <div className="order-card__ship">
                      <h4>Delivered to</h4>
                      <p>
                        {order.shippingName}
                        <br />
                        {order.shippingAddress}
                        <br />
                        {order.shippingPhone}
                      </p>
                      {order.note && (
                        <p className="muted">Note: {order.note}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
