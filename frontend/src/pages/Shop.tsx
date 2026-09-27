import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchCategories, fetchProducts } from '../api/catalog';
import { getErrorMessage } from '../api/client';
import type { Category, Paginated, Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { Spinner } from '../components/Spinner';
import { Pagination } from '../components/Pagination';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<Paginated<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const featured = searchParams.get('featured') === 'true';
  const sort = (searchParams.get('sort') as SortOption | null) ?? 'newest';
  const page = Number(searchParams.get('page') ?? '1') || 1;

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchProducts({
      search: search || undefined,
      category: category || undefined,
      featured: featured || undefined,
      sort,
      page,
      limit: 12,
    })
      .then((data) => active && setResult(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, category, featured, sort, page]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const activeCategoryName = useMemo(
    () => categories.find((item) => item.slug === category)?.name,
    [categories, category],
  );

  return (
    <div className="container shop-page">
      <div className="shop-header">
        <div>
          <h1>{activeCategoryName ?? (search ? `Results for “${search}”` : 'All products')}</h1>
          <p className="muted">
            {result ? `${result.total} product(s) available` : 'Loading…'}
          </p>
        </div>
        <div className="shop-controls">
          <label className="field field--inline">
            <span>Sort</span>
            <select
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name-asc">Name A–Z</option>
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) =>
                updateParam('featured', event.target.checked ? 'true' : null)
              }
            />
            <span>Featured only</span>
          </label>
        </div>
      </div>

      <div className="shop-layout">
        <aside className="shop-filters">
          <h3>Categories</h3>
          <button
            type="button"
            className={`filter-link ${!category ? 'is-active' : ''}`}
            onClick={() => updateParam('category', null)}
          >
            All categories
          </button>
          {categories.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`filter-link ${category === item.slug ? 'is-active' : ''}`}
              onClick={() => updateParam('category', item.slug)}
            >
              {item.name}
            </button>
          ))}
        </aside>

        <div>
          {loading ? (
            <Spinner label="Loading products…" />
          ) : error ? (
            <p className="alert alert--error">{error}</p>
          ) : result && result.items.length > 0 ? (
            <>
              <div className="product-grid">
                {result.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                page={result.page}
                pages={result.pages}
                onChange={(nextPage) => updateParam('page', String(nextPage))}
              />
            </>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">🔍</span>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
