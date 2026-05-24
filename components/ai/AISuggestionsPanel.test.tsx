import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AISuggestionsPanel } from './AISuggestionsPanel'

const mockSuggestion = (id: string, name: string) => ({
  id, name, category: 'food', description: 'desc', address: 'addr',
  lat: 1, lng: 1, mapbox_verified: true,
})

function mockFetchOK(suggestions: any[]) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ suggestions }), { status: 200 }) as any,
  )
}

function mockFetchError(status: number) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('err', { status }) as any,
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('AISuggestionsPanel', () => {
  it('shows loading state initially then renders suggestions', async () => {
    mockFetchOK([mockSuggestion('s1', 'A'), mockSuggestion('s2', 'B')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="Lisbonne" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    expect(screen.getByText(/r[ée]fl[ée]chit/i)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('A')).toBeInTheDocument())
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('shows an error state when fetch fails', async () => {
    mockFetchError(500)
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    await waitFor(() => expect(screen.getByText(/erreur/i)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /r[ée]essayer/i })).toBeInTheDocument()
  })

  it('disables the add button when no item is selected', async () => {
    mockFetchOK([mockSuggestion('s1', 'A')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    const addBtn = screen.getByRole('button', { name: /ajouter/i })
    expect(addBtn).toBeDisabled()
  })

  it('enables the add button and shows the count when items are selected', async () => {
    mockFetchOK([mockSuggestion('s1', 'A'), mockSuggestion('s2', 'B')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    await userEvent.click(screen.getByRole('checkbox', { name: /A/ }))
    const addBtn = screen.getByRole('button', { name: /ajouter 1/i })
    expect(addBtn).toBeEnabled()
  })

  it('calls onAccept with the selected suggestions when add is clicked', async () => {
    const onAccept = vi.fn()
    mockFetchOK([mockSuggestion('s1', 'A'), mockSuggestion('s2', 'B')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={onAccept}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    await userEvent.click(screen.getByRole('checkbox', { name: /A/ }))
    await userEvent.click(screen.getByRole('button', { name: /ajouter 1/i }))
    expect(onAccept).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 's1', name: 'A' })],
    )
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    mockFetchOK([mockSuggestion('s1', 'A')])
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={onClose} onAccept={() => {}}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('re-fetches with the prompt hint when the refresh button is clicked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ suggestions: [mockSuggestion('s1', 'A')] }), { status: 200 }) as any,
    )
    render(
      <AISuggestionsPanel
        tripId="t1" destination="X" tripType="city_break"
        excludeSpotIds={[]} dayId={null}
        onClose={() => {}} onAccept={() => {}}
      />,
    )
    await waitFor(() => screen.getByText('A'))
    await userEvent.type(screen.getByPlaceholderText(/guide-moi/i), 'plus food rue')
    await userEvent.click(screen.getByRole('button', { name: /r[ée]g[ée]n[ée]rer/i }))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2))
    const secondCallBody = JSON.parse((fetchSpy.mock.calls[1]?.[1] as RequestInit).body as string)
    expect(secondCallBody.promptHint).toBe('plus food rue')
  })
})
