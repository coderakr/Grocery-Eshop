import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatCurrency, discountPercent } from '../utils/format';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const discount = discountPercent(product.price, product.compareAtPrice);
  const outOfStock = product.stock <= 0;

  return (
    <article className="product-card">
      <Link className="product-card__media" to={`/products/${product.slug}`}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-card__placeholder" aria-hidden="true">
            🛒
          </span>
        )}
        {discount !== null && (
          <span className="badge badge--sale">-{discount}%</span>
        )}
        {outOfStock && <span className="badge badge--out">Out of stock</span>}
      </Link>
      <div className="product-card__body">
        {product.category && (
          <span className="product-card__category">{product.category.name}</span>
        )}
        <Link className="product-card__title" to={`/products/${product.slug}`}>
          {product.name}
        </Link>
        <span className="product-card__unit">{product.unit}</span>
        <div className="product-card__footer">
          <div className="product-card__prices">
            <strong>{formatCurrency(product.price)}</strong>
            {product.compareAtPrice && (
              <s>{formatCurrency(product.compareAtPrice)}</s>
            )}
          </div>
          <button
            type="button"
            className="btn btn--primary btn--icon"
            disabled={outOfStock}
            onClick={() => void addItem(product.id)}
            aria-label={`Add ${product.name} to cart`}
          >
            {outOfStock ? '—' : '+'}
          </button>
        </div>
      </div>
    </article>
  );
}
