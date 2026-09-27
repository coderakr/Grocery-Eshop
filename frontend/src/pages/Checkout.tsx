import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api/shop';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  calculateShippingFee,
  formatCurrency,
  FREE_DELIVERY_THRESHOLD,
} from '../utils/format';

export function Checkout() {
  const { user } = useAuth();
  const { cart, refresh } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shippingName: user?.name ?? '',
    shippingPhone: user?.phone ?? '',
    shippingAddress: user?.address ?? '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      shippingName: current.shippingName || user?.name || '',
      shippingPhone: current.shippingPhone || user?.phone || '',
      shippingAddress: current.shippingAddress || user?.address || '',
    }));
  }, [user]);

  const shippingFee = calculateShippingFee(cart.subtotal);
  const total = cart.subtotal + shippingFee;

  if (cart.items.length === 0) {
    return (
      <div className="container section">
        <div className="empty-state">
          <span aria-hidden="true">🧺</span>
          <h3>Nothing to check out</h3>
          <p>Your cart is empty.</p>
          <Link to="/shop" className="btn btn--primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        shippingName: form.shippingName,
        shippingPhone: form.shippingPhone,
        shippingAddress: form.shippingAddress,
        note: form.note || null,
      });
      await refresh();
      toast.success(`Order #${order.id} placed successfully!`);
      navigate('/orders');
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container section">
      <h1>Checkout</h1>
      <div className="checkout-layout">
        <form className="card checkout-form" onSubmit={handleSubmit}>
          <h3>Delivery details</h3>
          {error && <p className="alert alert--error">{error}</p>}
          <label className="field">
            <span>Full name</span>
            <input
              required
              value={form.shippingName}
              onChange={(event) =>
                setForm({ ...form, shippingName: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Phone</span>
            <input
              required
              value={form.shippingPhone}
              onChange={(event) =>
                setForm({ ...form, shippingPhone: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Delivery address</span>
            <textarea
              required
              rows={3}
              value={form.shippingAddress}
              onChange={(event) =>
                setForm({ ...form, shippingAddress: event.target.value })
              }
            />
          </label>
          <label className="field">
            <span>Order note (optional)</span>
            <textarea
              rows={2}
              value={form.note}
              onChange={(event) =>
                setForm({ ...form, note: event.target.value })
              }
            />
          </label>
          <button
            type="submit"
            className="btn btn--primary btn--lg btn--block"
            disabled={submitting}
          >
            {submitting ? 'Placing order…' : `Place order · ${formatCurrency(total)}`}
          </button>
        </form>

        <aside className="card checkout-summary">
          <h3>Your order</h3>
          <ul className="checkout-summary__items">
            {cart.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <strong>{formatCurrency(item.lineTotal)}</strong>
              </li>
            ))}
          </ul>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(cart.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>
                {shippingFee === 0 ? (
                  <span className="text-success">Free</span>
                ) : (
                  formatCurrency(shippingFee)
                )}
              </dd>
            </div>
            {shippingFee > 0 && (
              <p className="cart-summary__hint">
                Free delivery over {formatCurrency(FREE_DELIVERY_THRESHOLD)}.
              </p>
            )}
            <div className="cart-summary__total">
              <dt>Total</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
