import { describe, it, expect, vi, beforeEach } from 'vitest'
import { queryNearbyPOIs } from './OverpassService'

beforeEach(() => {
  vi.resetAllMocks()
})

it('maps results from Overpass', async () => {
  const mock = { ok: true, json: async () => ({ elements: [{ id: 1, type: 'node', lat: 10, lon: 20, tags: { name: 'Bank' } }] }) }
  vi.spyOn(global, 'fetch' as any).mockResolvedValue(mock as any)
  const res = await queryNearbyPOIs({ latitude: 10, longitude: 20 }, 500)
  expect(res.length).toBe(1)
  expect(res[0].tags.name).toBe('Bank')
})
