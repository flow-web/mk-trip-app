import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AISuggestionCard } from './AISuggestionCard'

const suggestion = {
  id: 'sug-1',
  name: 'Time Out Market',
  category: 'food' as const,
  description: 'Food hall iconique de Lisbonne',
  address: 'Av. 24 de Julho, Lisboa',
  lat: 38.7,
  lng: -9.1,
  mapbox_verified: true,
}

describe('AISuggestionCard', () => {
  it('renders the name, category, and description', () => {
    render(
      <AISuggestionCard suggestion={suggestion} selected={false} onToggle={() => {}} />,
    )
    expect(screen.getByText('Time Out Market')).toBeInTheDocument()
    expect(screen.getByText('FOOD')).toBeInTheDocument()
    expect(screen.getByText(/iconique/i)).toBeInTheDocument()
  })

  it('shows the verified badge when mapbox_verified is true', () => {
    render(
      <AISuggestionCard suggestion={suggestion} selected={false} onToggle={() => {}} />,
    )
    expect(screen.getByLabelText(/v[ée]rifi[ée]/i)).toBeInTheDocument()
  })

  it('shows an unverified badge when mapbox_verified is false', () => {
    render(
      <AISuggestionCard
        suggestion={{ ...suggestion, mapbox_verified: false }}
        selected={false}
        onToggle={() => {}}
      />,
    )
    expect(screen.getByLabelText(/approx/i)).toBeInTheDocument()
  })

  it('reflects the selected state via aria-checked', () => {
    const { rerender } = render(
      <AISuggestionCard suggestion={suggestion} selected={false} onToggle={() => {}} />,
    )
    const card = screen.getByRole('checkbox')
    expect(card).toHaveAttribute('aria-checked', 'false')
    rerender(
      <AISuggestionCard suggestion={suggestion} selected={true} onToggle={() => {}} />,
    )
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onToggle with the suggestion id when clicked', async () => {
    const onToggle = vi.fn()
    render(
      <AISuggestionCard suggestion={suggestion} selected={false} onToggle={onToggle} />,
    )
    await userEvent.click(screen.getByRole('checkbox'))
    expect(onToggle).toHaveBeenCalledWith('sug-1')
  })
})
