import { useEffect, useMemo, useState } from 'react'
import type { Report, Location } from '../../domain/types'
import { reverseGeocode } from '../../services/GeocodingService'

type SiteKey = string

function roundCoord(n: number, p: number = 4) {
  const f = Math.pow(10, p)
  return Math.round(n * f) / f
}

function keyFor(loc: Location): SiteKey {
  return `${roundCoord(loc.latitude)},${roundCoord(loc.longitude)}`
}

function statusFor(items: Report[]): string {
  return items.some(r => r.status === 'Confirmed') ? 'Confirmed' : 'Under Review'
}

interface Props {
  reports: Report[]
}

export default function LocationList({ reports }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'name'|'address'|'count'|'last'|'status'>('count')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')
  const [addrCache, setAddrCache] = useState<Record<SiteKey, { name?: string; formatted?: string }>>({})

  const grouped = useMemo(() => {
    const map = new Map<SiteKey, { loc: Location; items: Report[] }>()
    reports.forEach(r => {
      const k = keyFor(r.location)
      const g = map.get(k)
      if (g) g.items.push(r); else map.set(k, { loc: r.location, items: [r] })
    })
    return Array.from(map.entries()).map(([k, v]) => {
      const count = v.items.length
      const last = v.items.reduce((m, r) => Math.max(m, new Date(r.timestamp).getTime()), 0)
      const status = statusFor(v.items)
      const cached = addrCache[k] || {}
      return { key: k, loc: v.loc, count, last, status, name: cached.name || '', address: cached.formatted || '' }
    })
  }, [reports, addrCache])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const keys = grouped.filter(g => !g.address || !g.name).map(g => g.key).slice(0, 10)
      const next: Record<SiteKey, { name?: string; formatted?: string }> = { ...addrCache }
      for (const k of keys) {
        const g = grouped.find(x => x.key === k)
        if (!g) continue
        const info = await reverseGeocode(g.loc)
        if (cancelled) return
        next[k] = { name: info?.name, formatted: info?.formatted }
      }
      if (!cancelled) setAddrCache(next)
    })()
    return () => { cancelled = true }
  }, [grouped])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return grouped.filter(g => {
      if (!q) return true
      return (g.name || '').toLowerCase().includes(q) || (g.address || '').toLowerCase().includes(q)
    })
  }, [grouped, search])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = (a.name || '').localeCompare(b.name || '')
      else if (sortKey === 'address') cmp = (a.address || '').localeCompare(b.address || '')
      else if (sortKey === 'count') cmp = a.count - b.count
      else if (sortKey === 'last') cmp = a.last - b.last
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('asc') }
  }

  return (
    <div className="locations-panel" role="dialog" aria-modal="true" aria-labelledby="locations-title">
      <div className="locations-header">
        <h2 id="locations-title">Reported Locations</h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or address"
          aria-label="Search locations"
        />
      </div>
      <div className="locations-table" role="table" aria-label="Locations">
        <div className="locations-row locations-head" role="row">
          <button className="locations-cell" role="columnheader" onClick={() => toggleSort('name')} aria-label="Sort by business name">Business</button>
          <button className="locations-cell" role="columnheader" onClick={() => toggleSort('address')} aria-label="Sort by address">Address</button>
          <button className="locations-cell" role="columnheader" onClick={() => toggleSort('count')} aria-label="Sort by reports">Reports</button>
          <button className="locations-cell" role="columnheader" onClick={() => toggleSort('last')} aria-label="Sort by recent">Most Recent</button>
          <button className="locations-cell" role="columnheader" onClick={() => toggleSort('status')} aria-label="Sort by status">Status</button>
        </div>
        {sorted.map((g) => (
          <details key={g.key} className={`locations-row`} role="row">
            <summary className={`locations-cell locations-summary ${g.count>=5?'priority-high':''}`} role="cell" aria-label="Expand location details">
              <div className="locations-summary-main">
                <div className="locations-name">{g.name || 'Unnamed location'}</div>
                <div className="locations-address">{g.address || 'Address unavailable'}</div>
              </div>
              <div className="locations-summary-stats">
                <div className="stat"><span className="stat-label">Business</span><span className="stat-value">{g.name || '—'}</span></div>
                <div className="stat"><span className="stat-label">Address</span><span className="stat-value">{g.address || '—'}</span></div>
                <div className="stat"><span className="stat-label">Reports</span><span className="stat-value">{g.count}</span></div>
                <div className="stat"><span className="stat-label">Most Recent</span><span className="stat-value">{new Date(g.last).toLocaleDateString()}</span></div>
                <div className="stat"><span className="stat-label">Status</span><span className="stat-value">{g.status}</span></div>
              </div>
            </summary>
            <div className="locations-details" role="cell">
              <ul>
                {reports.filter(r => keyFor(r.location) === g.key).slice(0, 10).map(r => (
                  <li key={r.id}>
                    <span>{r.category}</span>
                    <span> · {r.observationType}</span>
                    <span> · {new Date(r.timestamp).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
