import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MapDayDock } from './MapDayDock'

const days = [
  { id: 'd1', day_number: 1 },
  { id: 'd2', day_number: 2 },
  { id: 'd3', day_number: 3 },
]

describe('MapDayDock', () => {
  it('renders one "Tous" pill + one pill per day', () => {
    render(<MapDayDock days={days} selectedDayId="all" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /tous/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'J1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'J2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'J3' })).toBeInTheDocument()
  })

  it('marks the selected pill with aria-pressed', () => {
    render(<MapDayDock days={days} selectedDayId="d2" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: 'J2' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /tous/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelect with the day id when a pill is clicked', async () => {
    const onSelect = vi.fn()
    render(<MapDayDock days={days} selectedDayId="all" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'J2' }))
    expect(onSelect).toHaveBeenCalledWith('d2')
  })

  it('calls onSelect with "all" when "Tous" is clicked', async () => {
    const onSelect = vi.fn()
    render(<MapDayDock days={days} selectedDayId="d1" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: /tous/i }))
    expect(onSelect).toHaveBeenCalledWith('all')
  })
})
