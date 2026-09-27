import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Spinner } from '../components/Spinner';
import { formatCurrency, calculateShippingFee, FREE_DELIVERY_THRESHOLD } from '../utils/format';

export function Cart() {
  const { user } = useAuth();
  const { cart, loading, busyItemId, setQuantity, removeItem, clear } = useCart();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container section">
        <div className="empty-state">
          <span aria-hidden="true">🔐</span>
          <h3>Sign in to view your cart</h3>
          <p>Your cart is saved to your account across devices.</p>
          <Link to="/login" className="btn btn--primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (loading && cart.items.length === 0) {
    return <Spinner label="Loading your cart…" />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="container section">
        <div className="empty-state">
          <span aria-hidden="true">🛒</span>
          <h3>Your cart is empty</h3>
          <p>Add some fresh goodies to get started.</p>
          <Link to="/shop" className="btn btn--primary">
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  const deliveryFee = calculateShippingFee(cart.subtotal);
  const total = cart.subtotal + deliveryFee;

  return (
    <div className="container section">
      <div className="section__head">
        <h1>Your cart</h1>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => void clear()}
        >
          Clear cart
        </button>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map((item) => (
            <div key={item.id} className="cart-item">
              <Link
                to={`/products/${item.product.slug}`}
                className="cart-item__media"
              >
                {item.product.imageUrl ? (
                  <img src={item.product.imageUrl} alt={item.product.name} />
                ) : (
                  <span aria-hidden="true">🛒</span>
                )}
              </Link>
              <div className="cart-item__info">
                <Link to={`/products/${item.product.slug}`}>
                  {item.product.name}
                </Link>
                <span className="muted">
                  {formatCurrency(item.product.price)} / {item.product.unit}
                </span>
              </div>
              <div className="stepper">
                <button
                  type="button"
                  disabled={busyItemId === item.id || item.quantity <= 1}
                  onClick={() => void setQuantity(item.id, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  disabled={
                    busyItemId === item.id ||
                    item.quantity >= item.product.stock
                  }
                  onClick={() => void setQuantity(item.id, item.quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <strong className="cart-item__total">
                {formatCurrency(item.lineTotal)}
              </strong>
              <button
                type="button"
                className="cart-item__remove"
                onClick={() => void removeItem(item.id)}
                aria-label={`Remove ${item.product.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h3>Order summary</h3>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatCurrency(cart.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>
                {deliveryFee === 0 ? (
                  <span className="text-success">Free</span>
                ) : (
                  formatCurrency(deliveryFee)
                )}
              </dd>
            </div>
            {deliveryFee > 0 && (
              <p className="cart-summary__hint">
                Add {formatCurrency(FREE_DELIVERY_THRESHOLD - cart.subtotal)}{' '}
                more for free delivery.
              </p>
            )}
            <div className="cart-summary__total">
              <dt>Total</dt>
              <dd>{formatCurrency(total)}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn btn--primary btn--lg btn--block"
            onClick={() => navigate('/checkout')}
          >
            Proceed to checkout
          </button>
          <Link to="/shop" className="link link--center">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
