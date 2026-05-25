'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { TicketExtract } from '@/lib/ai/ticketExtractSchema'

const TYPE_LABELS: Record<string, string> = {
  flight: 'Vol',
  train: 'Train',
  hotel: 'Hôtel',
  car_rental: 'Location voiture',
  other: 'Autre',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept: (ticket: TicketExtract) => void
}

export function ImportTicketDialog({ open, onOpenChange, onAccept }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [result, setResult] = useState<TicketExtract | null>(null)

  async function handleFile(file: File) {
    setLoading(true)
    setError(false)
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/tickets/extract', { method: 'POST', body: form })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  function handleAccept() {
    if (result) {
      onAccept(result)
      setResult(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">IMPORTER UN BILLET</div>
        <h2 className="mk-display text-3xl mt-2">Photo ou PDF</h2>

        {!result && !loading && (
          <label className="mt-6 flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-hairline dark:border-hairline-dark rounded-md cursor-pointer hover:border-ink/30 transition">
            <FileText className="w-8 h-8 text-ink-mute" />
            <span className="text-sm text-ink-mute">
              Billet d'avion, train, confirmation hôtel...
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
                e.target.value = ''
              }}
            />
          </label>
        )}

        {loading && (
          <div className="mt-6 py-8 text-center">
            <div className="text-sm text-ink-mute mk-mono animate-pulse">
              Extraction des infos...
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 py-6 text-center text-sm text-red-600">
            Impossible de lire ce document. Essaie une autre photo.
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-3">
            <div className="bg-paper-deep dark:bg-paper-dark-deep rounded-md p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-ink-mute mk-mono">TYPE</span>
                <span className="text-sm font-medium">{TYPE_LABELS[result.type] ?? result.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-mute mk-mono">TRAJET</span>
                <span className="text-sm font-medium">{result.departure} → {result.arrival}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-ink-mute mk-mono">DATE</span>
                <span className="text-sm font-medium">
                  {result.date}{result.time ? ` à ${result.time}` : ''}
                </span>
              </div>
              {result.end_date && (
                <div className="flex justify-between">
                  <span className="text-xs text-ink-mute mk-mono">CHECKOUT</span>
                  <span className="text-sm font-medium">{result.end_date}</span>
                </div>
              )}
              {result.carrier && (
                <div className="flex justify-between">
                  <span className="text-xs text-ink-mute mk-mono">COMPAGNIE</span>
                  <span className="text-sm font-medium">{result.carrier}</span>
                </div>
              )}
              {result.reference && (
                <div className="flex justify-between">
                  <span className="text-xs text-ink-mute mk-mono">RÉSA</span>
                  <span className="text-sm font-medium mk-mono">{result.reference}</span>
                </div>
              )}
            </div>
            <Button type="button" onClick={handleAccept} className="w-full">
              Ajouter au planning
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
