import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapSpotDetailSheet } from './MapSpotDetailSheet'

const spot = {
  id: 's1',
  name: 'Time Out Market',
  category: 'food',
  description: 'Food hall iconique de Lisbonne',
  lat: 38.7,
  lng: -9.1,
  day_id: 'd1',
  time: null,
}

describe('MapSpotDetailSheet', () => {
  it('renders nothing when spot is null', () => {
    const { container } = render(
      <MapSpotDetailSheet spot={null} onClose={() => {}} accentColor="#000" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the spot name and category when spot is provided', () => {
    render(
      <MapSpotDetailSheet spot={spot as any} onClose={() => {}} accentColor="#000" />,
    )
    expect(screen.getByText('Time Out Market')).toBeInTheDocument()
    // /food/i matches both category div and description — use getAllByText
    expect(screen.getAllByText(/food/i).length).toBeGreaterThan(0)
  })

  it('renders the description when present', () => {
    render(
      <MapSpotDetailSheet spot={spot as any} onClose={() => {}} accentColor="#000" />,
    )
    expect(screen.getByText(/food hall iconique/i)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(
      <MapSpotDetailSheet spot={spot as any} onClose={onClose} accentColor="#000" />,
    )
    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
