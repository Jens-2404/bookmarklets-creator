import type { Bookmarklet } from '../types/Bookmarklet'
import './BookmarkletList.css'

type BookmarkletListProps = {
  items: Bookmarklet[]
  onDelete: (id: string) => void
  onSelect: (bookmarklet: Bookmarklet) => void
}

export function BookmarkletList({
  items,
  onDelete,
  onSelect,
}: BookmarkletListProps) {
  if (items.length === 0) {
    return <p className="bookmarklet-empty">No bookmarklets saved yet.</p>
  }

  return (
    <div className="bookmarklet-list">
      {items.map((item) => (
        <article key={item.id} className="bookmarklet-card">
          <div>
            <h3>{item.name}</h3>
            {item.description ? <p>{item.description}</p> : null}
          </div>
          <div className="bookmarklet-actions">
            <div className="bookmarklet-tags">
              {item.tags.map((tag) => (
                <span key={`${item.id}-${tag}`}>{tag}</span>
              ))}
            </div>
            <div className="bookmarklet-buttons">
              <button
                type="button"
                className="bookmarklet-edit"
                onClick={() => onSelect(item)}
              >
                Edit
              </button>
              <button
                type="button"
                className="bookmarklet-delete"
                onClick={() => onDelete(item.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
