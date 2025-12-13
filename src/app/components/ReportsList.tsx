import { useMemo, useState } from 'react'
import type { Report } from '../../domain/types'

interface Props {
  reports: Report[]
}

export default function ReportsList({ reports }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'category'|'observation'|'date'|'status'>('date')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const rows = useMemo(() => {
    const now = Date.now()
    return reports.map(r => {
      const lastMs = new Date(r.timestamp).getTime()
      const ageDays = (now - lastMs) / 86400000
      const status = ageDays < 7 ? 'Under Review' : ageDays > 30 ? 'Resolved' : 'Pending Action'
      return { id: r.id, category: r.category, observation: r.observationType, date: lastMs, status, description: r.description || '' }
    })
  }, [reports])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r => (
      r.category.toLowerCase().includes(q) ||
      r.observation.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    ))
  }, [rows, search])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'category') cmp = a.category.localeCompare(b.category)
      else if (sortKey === 'observation') cmp = a.observation.localeCompare(b.observation)
      else if (sortKey === 'date') cmp = a.date - b.date
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('asc') }
  }

  return (
    <div className="reports-panel" role="dialog" aria-modal="true" aria-labelledby="reports-title">
      <div className="reports-header">
        <h2 id="reports-title">Reports</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by category, observation, or description"
          aria-label="Search reports"
        />
      </div>
      <div className="reports-table" role="table" aria-label="Reports">
        <div className="reports-row reports-head" role="row">
          <button className="reports-cell" role="columnheader" onClick={() => toggleSort('category')} aria-label="Sort by category">Category</button>
          <button className="reports-cell" role="columnheader" onClick={() => toggleSort('observation')} aria-label="Sort by observation">Observation</button>
          <button className="reports-cell" role="columnheader" onClick={() => toggleSort('date')} aria-label="Sort by date">Date</button>
          <button className="reports-cell" role="columnheader" onClick={() => toggleSort('status')} aria-label="Sort by status">Status</button>
        </div>
        {sorted.map((r) => (
          <div key={r.id} className={`reports-row`} role="row">
            <div className="reports-cell" role="cell">{r.category}</div>
            <div className="reports-cell" role="cell">{r.observation}</div>
            <div className="reports-cell" role="cell">{new Date(r.date).toLocaleString()}</div>
            <div className="reports-cell" role="cell">
              <span className="reports-status">{r.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
