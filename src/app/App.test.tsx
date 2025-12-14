import { it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

afterEach(cleanup);

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
  const btn = await screen.findByRole('button', { name: 'Open navigation' })
  await userEvent.click(btn)
  expect(await screen.findByRole('button', { name: 'Hide menu' })).toBeTruthy()
})

it('shows nearby places after using address', async () => {
  render(<App />)
  
  // Open report panel
  const fab = await screen.findByRole('button', { name: 'Add new observation report' })
  await userEvent.click(fab)
  
  // Fill address
  await userEvent.type(screen.getByLabelText('Street address'), '123 Main St')
  await userEvent.type(screen.getByLabelText('City'), 'Springfield')
  await userEvent.type(screen.getByLabelText('State'), 'IL')
  await userEvent.type(screen.getByLabelText('ZIP'), '62701')
  
  // Click Use Address
  const useAddrBtn = screen.getByRole('button', { name: 'Approximate from address' })
  await userEvent.click(useAddrBtn)
  
  // Check for nearby places
  expect(await screen.findByText(/Nearby places/)).toBeTruthy()
})
