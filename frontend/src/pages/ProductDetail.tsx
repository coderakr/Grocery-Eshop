import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchProduct } from '../api/catalog';
import { getErrorMessage } from '../api/client';
import type { Product } from '../types';
import { Spinner } from '../components/Spinner';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { formatCurrency, discountPercent } from '../utils/format';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setQuantity(1);
    fetchProduct(slug)
      .then(({ product: item, related: relatedItems }) => {
        if (!active) return;
        setProduct(item);
        setRelated(relatedItems);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <Spinner label="Loading product…" />;
  if (error)
    return (
      <div className="container section">
        <p className="alert alert--error">{error}</p>
        <Link to="/shop" className="btn btn--primary">
          Back to shop
        </Link>
      </div>
    );
  if (!product) return null;

  const discount = discountPercent(product.price, product.compareAtPrice);
  const outOfStock = product.stock <= 0;

  return (
    <div className="container section">
      <nav className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/shop?category=${product.category.slug}`}>
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail">
        <div className="product-detail__media">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <span aria-hidden="true">🛒</span>
          )}
        </div>

        <div className="product-detail__info">
          {product.category && (
            <Link
              to={`/shop?category=${product.category.slug}`}
              className="pill pill--soft"
            >
              {product.category.name}
            </Link>
          )}
          <h1>{product.name}</h1>
          <div className="product-detail__price">
            <strong>{formatCurrency(product.price)}</strong>
            {product.compareAtPrice && (
              <s>{formatCurrency(product.compareAtPrice)}</s>
            )}
            {discount !== null && (
              <span className="badge badge--sale">Save {discount}%</span>
            )}
            <span className="muted">/ {product.unit}</span>
          </div>
          <p className="product-detail__desc">{product.description}</p>

          <ul className="product-detail__meta">
            <li>
              <span>Availability</span>
              <strong className={outOfStock ? 'text-danger' : 'text-success'}>
                {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
              </strong>
            </li>
            <li>
              <span>Unit</span>
              <strong>{product.unit}</strong>
            </li>
            <li>
              <span>SKU</span>
              <strong>GC-{String(product.id).padStart(4, '0')}</strong>
            </li>
          </ul>

          <div className="product-detail__actions">
            <div className="stepper">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((value) => Math.min(product.stock || 99, value + 1))
                }
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              type="button"
              className="btn btn--primary btn--lg"
              disabled={outOfStock}
              onClick={() => void addItem(product.id, quantity)}
            >
              {outOfStock ? 'Out of stock' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="section">
          <h2>You may also like</h2>
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
