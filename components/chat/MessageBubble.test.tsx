import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from './MessageBubble'

describe('MessageBubble', () => {
  const base = {
    body: 'Salut tout le monde !',
    authorName: 'Paul',
    timestamp: '2026-05-24T14:30:00Z',
    isMine: false,
  }

  it('affiche le body du message', () => {
    render(<MessageBubble {...base} />)
    expect(screen.getByText('Salut tout le monde !')).toBeDefined()
  })

  it("affiche le nom de l'auteur pour les messages des autres", () => {
    render(<MessageBubble {...base} />)
    expect(screen.getByText('Paul')).toBeDefined()
  })

  it("n'affiche pas le nom de l'auteur pour ses propres messages", () => {
    render(<MessageBubble {...base} isMine />)
    expect(screen.queryByText('Paul')).toBeNull()
  })

  it('aligne à droite pour isMine', () => {
    const { container } = render(<MessageBubble {...base} isMine />)
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain('justify-end')
  })
})
