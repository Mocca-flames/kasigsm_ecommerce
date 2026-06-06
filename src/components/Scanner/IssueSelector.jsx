export default function IssueSelector({ issues, value, onChange, loading }) {
  if (loading) {
    return (
      <div className="issue-grid" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="issue-chip" style={{ opacity: 0.4, pointerEvents: 'none' }}>
            • • • •
          </div>
        ))}
      </div>
    );
  }

  if (!Array.isArray(issues) || issues.length === 0) {
    return (
      <p className="empty-state" style={{ marginTop: 12 }}>
        No issues available right now. Use manual entry above.
      </p>
    );
  }

  return (
    <div className="issue-grid" role="radiogroup" aria-label="Choose an issue">
      {issues.map((issue) => {
        const slug = issue.slug || issue.value || issue.name;
        const label = issue.label || issue.name || issue.title || slug;
        const isSelected = value === slug;
        return (
          <button
            key={slug}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`issue-chip${isSelected ? ' selected' : ''}`}
            onClick={() => onChange(slug)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
