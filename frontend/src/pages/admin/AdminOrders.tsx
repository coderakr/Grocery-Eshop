import { useCallback, useEffect, useState } from 'react';
import { fetchAllOrders, updateOrderStatus } from '../../api/shop';
import { getErrorMessage } from '../../api/client';
import type { Order, OrderStatus } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/Spinner';
import { formatCurrency, formatDate, statusLabel } from '../../utils/format';

const STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | ''>('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await fetchAllOrders(filter || undefined));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    setUpdatingId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, status);
      setOrders((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(`Order #${order.id} marked ${status}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Orders</h1>
          <p className="muted">{orders.length} order(s)</p>
        </div>
        <label className="field field--inline">
          <span>Filter</span>
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as OrderStatus | '')
            }
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <Spinner label="Loading orders…" />
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden="true">🧾</span>
          <h3>No orders found</h3>
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => {
            const isOpen = openId === order.id;
            return (
              <div key={order.id} className="card order-card">
                <div className="order-card__head order-card__head--admin">
                  <button
                    type="button"
                    className="order-card__toggle"
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
                  <label className="field field--inline order-card__status">
                    <span>Status</span>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(event) =>
                        void handleStatusChange(
                          order,
                          event.target.value as OrderStatus,
                        )
                      }
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {isOpen && (
                  <div className="order-card__body">
                    <div className="order-card__customer">
                      <h4>Customer</h4>
                      <p>
                        {order.user?.name ?? order.shippingName} ·{' '}
                        {order.user?.email}
                      </p>
                      <p>
                        {order.shippingName}
                        <br />
                        {order.shippingAddress}
                        <br />
                        {order.shippingPhone}
                      </p>
                      {order.note && <p className="muted">Note: {order.note}</p>}
                    </div>
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
