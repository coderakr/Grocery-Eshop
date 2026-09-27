interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pages, onChange }: PaginationProps) {
  if (pages <= 1) return null;

  const numbers = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (value) =>
      value === 1 ||
      value === pages ||
      Math.abs(value - page) <= 1,
  );

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        className="btn btn--ghost"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Prev
      </button>
      {numbers.map((value, index) => {
        const previous = numbers[index - 1];
        const gap = previous !== undefined && value - previous > 1;
        return (
          <span key={value} className="pagination__item">
            {gap && <span className="pagination__gap">…</span>}
            <button
              type="button"
              className={`pagination__page ${value === page ? 'is-active' : ''}`}
              onClick={() => onChange(value)}
            >
              {value}
            </button>
          </span>
        );
      })}
      <button
        type="button"
        className="btn btn--ghost"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
