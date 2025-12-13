import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

vi.mock('react-leaflet', () => ({
  MapContainer: (p: any) => <div>{p.children}</div>,
  TileLayer: () => <div />, Circle: () => <div />, Marker: () => <div />,
  useMapEvents: () => {}, useMap: () => ({ setView: () => {} })
}))

vi.mock('../services/GeocodingService', () => ({
  geocodeAddress: async () => ({ location: { latitude: 1, longitude: 2 } }),
  suggestAddresses: async () => []
}))

vi.mock('../services/OverpassService', () => ({
  queryNearbyPOIs: async () => ([{ id: 1, type: 'node', lat: 1, lon: 2, tags: { name: 'ATM', amenity: 'atm' } }])
}))

it('opens side nav via hamburger', async () => {
  render(<App />)
  const btn = screen.getByLabelText('Open navigation')
  await userEvent.click(btn)
  expect(screen.getByRole('navigation', { name: 'Primary' })).toBeTruthy()
})

it('shows nearby places after using address', async () => {
  render(<App />)
  const useAddress = await screen.findByRole('button', { name: 'Approximate from address' })
  await userEvent.click(useAddress)
  expect(await screen.findByText(/Nearby places/)).toBeTruthy()
  expect(await screen.findByText('ATM')).toBeTruthy()
})
