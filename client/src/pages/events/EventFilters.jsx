import { useState } from 'react'
import { CATEGORIES, STATUSES } from '../../utils/categories.js'

// DISC-02, DISC-03, DISC-05: search text, category and status for Browse Events.
// The text is applied on Search (or Enter); the dropdowns apply as soon as they change.
export default function EventFilters({ filters, onChange }) {
  const [text, setText] = useState(filters.q)

  function handleSubmit(event) {
    event.preventDefault()
    onChange({ ...filters, q: text.trim() })
  }

  function handleClear() {
    setText('')
    onChange({ q: '', category: '', status: '' })
  }

  const hasFilters = filters.q || filters.category || filters.status

  return (
    <form className="filters" role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        aria-label="Search events"
        placeholder="Search title, description or venue"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="button">Search</button>
      <select aria-label="Category" value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })}>
        <option value="">All categories</option>
        {CATEGORIES.map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
      <select aria-label="Status" value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value })}>
        <option value="">Any status</option>
        {STATUSES.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
      {hasFilters && (
        <button type="button" className="link-button" onClick={handleClear}>Clear</button>
      )}
    </form>
  )
}
