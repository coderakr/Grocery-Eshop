import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="container section">
      <div className="empty-state">
        <span aria-hidden="true">🥔</span>
        <h1>404</h1>
        <h3>This aisle is empty</h3>
        <p>We couldn&apos;t find the page you were looking for.</p>
        <Link to="/" className="btn btn--primary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
