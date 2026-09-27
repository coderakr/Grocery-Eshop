import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCategories, fetchProducts } from '../api/catalog';
import { getErrorMessage } from '../api/client';
import type { Category, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Spinner } from '../components/Spinner';

export function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetchCategories(),
      fetchProducts({ featured: true, limit: 8 }),
    ])
      .then(([cats, products]) => {
        if (!active) return;
        setCategories(cats);
        setFeatured(products.items);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="pill">🚚 Free delivery over $50</span>
            <h1>Fresh groceries, delivered in a flash</h1>
            <p>
              Hand-picked produce, dairy, bakery and pantry staples from local
              farms and trusted brands — straight to your door.
            </p>
            <div className="hero__actions">
              <Link to="/shop" className="btn btn--primary btn--lg">
                Shop now
              </Link>
              <Link to="/shop?featured=true" className="btn btn--ghost btn--lg">
                Today&apos;s deals
              </Link>
            </div>
            <dl className="hero__stats">
              <div>
                <dt>Products</dt>
                <dd>500+</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>Express</dd>
              </div>
              <div>
                <dt>Farm fresh</dt>
                <dd>Daily</dd>
              </div>
            </dl>
          </div>
          <div className="hero__art" aria-hidden="true">
            <span>🥑</span>
            <span>🍓</span>
            <span>🥕</span>
            <span>🧀</span>
            <span>🍞</span>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2>Shop by category</h2>
          <Link to="/shop" className="link">
            Browse all →
          </Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/shop?category=${category.slug}`}
              className="category-card"
            >
              <span className="category-card__emoji" aria-hidden="true">
                {category.name === 'Fruits' && '🍎'}
                {category.name === 'Vegetables' && '🥦'}
                {category.name === 'Dairy & Eggs' && '🥛'}
                {category.name === 'Bakery' && '🍞'}
                {category.name === 'Beverages' && '🧃'}
                {category.name === 'Snacks' && '🍿'}
                {category.name === 'Meat & Seafood' && '🍗'}
                {category.name === 'Pantry' && '🫙'}
              </span>
              <span className="category-card__name">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section__head">
          <h2>Featured picks</h2>
          <Link to="/shop" className="link">
            View all products →
          </Link>
        </div>

        {loading ? (
          <Spinner label="Loading featured products…" />
        ) : error ? (
          <p className="alert alert--error">{error}</p>
        ) : (
          <div className="product-grid">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container section">
        <div className="value-grid">
          <div className="value-card">
            <span aria-hidden="true">🌱</span>
            <h3>Farm fresh</h3>
            <p>Sourced daily from local growers and trusted suppliers.</p>
          </div>
          <div className="value-card">
            <span aria-hidden="true">⏱️</span>
            <h3>Express delivery</h3>
            <p>Same-day delivery windows that fit around your schedule.</p>
          </div>
          <div className="value-card">
            <span aria-hidden="true">💳</span>
            <h3>Fair prices</h3>
            <p>Transparent pricing with weekly deals on everyday essentials.</p>
          </div>
          <div className="value-card">
            <span aria-hidden="true">🔒</span>
            <h3>Secure checkout</h3>
            <p>Your data stays protected from cart to doorstep.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
