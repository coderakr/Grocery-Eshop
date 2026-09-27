import { useCallback, useEffect, useState } from 'react';
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  updateProduct,
} from '../../api/catalog';
import type { ProductInput } from '../../api/catalog';
import { getErrorMessage } from '../../api/client';
import type { Category, Product } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/Spinner';
import { formatCurrency } from '../../utils/format';

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  unit: 'each',
  stock: '0',
  imageUrl: '',
  isActive: true,
  isFeatured: false,
  categoryId: '',
};

interface FormState {
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  unit: string;
  stock: string;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string;
}

function toFormState(product: Product | null): FormState {
  if (!product) return { ...EMPTY_FORM };
  return {
    name: product.name,
    description: product.description ?? '',
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? '',
    unit: product.unit,
    stock: String(product.stock),
    imageUrl: product.imageUrl ?? '',
    isActive: product.isActive,
    isFeatured: product.isFeatured,
    categoryId: product.categoryId ? String(product.categoryId) : '',
  };
}

export function AdminProducts() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, cats] = await Promise.all([
        fetchProducts({ all: true, search: search || undefined, limit: 60 }),
        fetchCategories(),
      ]);
      setProducts(data.items);
      setCategories(cats);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteProduct(product.id);
      toast.success('Product deleted');
      void load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1>Products</h1>
          <p className="muted">{products.length} product(s)</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          + New product
        </button>
      </div>

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading ? (
        <Spinner label="Loading products…" />
      ) : (
        <div className="card table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="table__actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="table-product">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="" />
                      ) : (
                        <span aria-hidden="true">🛒</span>
                      )}
                      <div>
                        <strong>{product.name}</strong>
                        <small className="muted">{product.unit}</small>
                      </div>
                    </div>
                  </td>
                  <td>{product.category?.name ?? '—'}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span
                      className={`status ${
                        product.isActive ? 'status--delivered' : 'status--cancelled'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Hidden'}
                    </span>
                    {product.isFeatured && (
                      <span className="badge badge--sale">Featured</span>
                    )}
                  </td>
                  <td className="table__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => openEdit(product)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => void handleDelete(product)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted table__empty">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isFormOpen && (
        <ProductFormModal
          product={editing}
          categories={categories}
          onClose={() => setIsFormOpen(false)}
          onSaved={() => {
            setIsFormOpen(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

interface ProductFormModalProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => toFormState(product));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload: ProductInput = {
      name: form.name,
      description: form.description || null,
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      unit: form.unit || 'each',
      stock: Number(form.stock) || 0,
      imageUrl: form.imageUrl || null,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
    };
    try {
      if (product) {
        await updateProduct(product.id, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }
      onSaved();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal__head">
          <h2>{product ? 'Edit product' : 'New product'}</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          <label className="field">
            <span>Name</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Price ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(event) =>
                  setForm({ ...form, price: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Compare at ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.compareAtPrice}
                onChange={(event) =>
                  setForm({ ...form, compareAtPrice: event.target.value })
                }
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Unit</span>
              <input
                value={form.unit}
                onChange={(event) =>
                  setForm({ ...form, unit: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Stock</span>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(event) =>
                  setForm({ ...form, stock: event.target.value })
                }
              />
            </label>
          </div>

          <label className="field">
            <span>Category</span>
            <select
              value={form.categoryId}
              onChange={(event) =>
                setForm({ ...form, categoryId: event.target.value })
              }
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Image URL</span>
            <input
              value={form.imageUrl}
              onChange={(event) =>
                setForm({ ...form, imageUrl: event.target.value })
              }
              placeholder="https://…"
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>

          <div className="field-row field-row--checks">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm({ ...form, isActive: event.target.checked })
                }
              />
              <span>Active (visible in store)</span>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setForm({ ...form, isFeatured: event.target.checked })
                }
              />
              <span>Featured</span>
            </label>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
