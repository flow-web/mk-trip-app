import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapSpotSheet } from './MapSpotSheet'

const spots = [
  { id: 's1', name: 'Castelo', category: 'culture', lat: 38.71, lng: -9.13 },
  { id: 's2', name: 'Time Out', category: 'food', lat: 38.71, lng: -9.14 },
]

describe('MapSpotSheet', () => {
  it('displays the spot count and label', () => {
    render(
      <MapSpotSheet
        spots={spots as any}
        label="Tous les spots"
        onSpotClick={() => {}}
      />,
    )
    // label appears in both Drawer.Title (sr-only) and the visible Eyebrow
    expect(screen.getAllByText(/tous les spots/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/2 spots/i)).toBeInTheDocument()
  })

  it('renders one row per spot', () => {
    render(
      <MapSpotSheet
        spots={spots as any}
        label="Tous"
        onSpotClick={() => {}}
      />,
    )
    expect(screen.getByText('Castelo')).toBeInTheDocument()
    expect(screen.getByText('Time Out')).toBeInTheDocument()
  })

  it('calls onSpotClick with the spot id when a row is clicked', async () => {
    const onSpotClick = vi.fn()
    render(
      <MapSpotSheet
        spots={spots as any}
        label="Tous"
        onSpotClick={onSpotClick}
      />,
    )
    await userEvent.click(screen.getByText('Castelo'))
    expect(onSpotClick).toHaveBeenCalledWith('s1')
  })

  it('renders empty state when spots is empty', () => {
    render(
      <MapSpotSheet spots={[]} label="Jour 2" onSpotClick={() => {}} />,
    )
    expect(screen.getByText(/aucun spot/i)).toBeInTheDocument()
  })
})
