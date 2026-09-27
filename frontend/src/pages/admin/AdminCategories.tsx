import { useCallback, useEffect, useState } from 'react';
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from '../../api/catalog';
import { getErrorMessage } from '../../api/client';
import type { Category } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/Spinner';
import { formatDate } from '../../utils/format';

export function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await fetchCategories());
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createCategory({
        name,
        description: description || null,
      });
      toast.success('Category created');
      setName('');
      setDescription('');
      void load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (category: Category) => {
    if (!editName.trim() || editName === category.name) {
      setEditingId(null);
      return;
    }
    try {
      await updateCategory(category.id, { name: editName });
      toast.success('Category updated');
      setEditingId(null);
      void load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (category: Category) => {
    if (
      !window.confirm(
        `Delete “${category.name}”? Products will become uncategorized.`,
      )
    ) {
      return;
    }
    try {
      await deleteCategory(category.id);
      toast.success('Category deleted');
      void load();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div>
      <div className="admin-page-head">
        <h1>Categories</h1>
        <p className="muted">Organize products into aisles.</p>
      </div>

      <div className="admin-columns">
        <section className="card">
          <h3>All categories</h3>
          {loading ? (
            <Spinner label="Loading…" />
          ) : (
            <ul className="category-admin-list">
              {categories.map((category) => (
                <li key={category.id}>
                  {editingId === category.id ? (
                    <input
                      className="category-admin-list__input"
                      value={editName}
                      autoFocus
                      onChange={(event) => setEditName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') void handleRename(category);
                        if (event.key === 'Escape') setEditingId(null);
                      }}
                    />
                  ) : (
                    <div>
                      <strong>{category.name}</strong>
                      <small className="muted">
                        /{category.slug} · added {formatDate(category.createdAt)}
                      </small>
                    </div>
                  )}
                  <div className="category-admin-list__actions">
                    {editingId === category.id ? (
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => void handleRename(category)}
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          setEditingId(category.id);
                          setEditName(category.name);
                        }}
                      >
                        Rename
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => void handleDelete(category)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {categories.length === 0 && (
                <li className="muted">No categories yet.</li>
              )}
            </ul>
          )}
        </section>

        <section className="card">
          <h3>Add category</h3>
          <form onSubmit={handleCreate}>
            <label className="field">
              <span>Name</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Frozen Foods"
              />
            </label>
            <label className="field">
              <span>Description (optional)</span>
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={saving}
            >
              {saving ? 'Creating…' : 'Create category'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
