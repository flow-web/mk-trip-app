'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  onSubmit: (question: string, options: string[]) => void
}

export function CreatePollDialog({ onSubmit }: Props) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  function addOption() {
    if (options.length < 4) setOptions([...options, ''])
  }

  function removeOption(i: number) {
    if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i))
  }

  function updateOption(i: number, val: string) {
    setOptions(options.map((o, idx) => (idx === i ? val : o)))
  }

  function handleSubmit() {
    const validOptions = options.filter((o) => o.trim().length > 0)
    if (!question.trim() || validOptions.length < 2) return
    onSubmit(question.trim(), validOptions)
    setOpen(false)
    setQuestion('')
    setOptions(['', ''])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger data-tour="polls-create" className="fixed bottom-[88px] left-5 right-5 h-12 rounded-pill bg-ink text-white flex items-center justify-center gap-2 shadow-card font-semibold">
        <Plus className="w-4 h-4" strokeWidth={2} />
        Nouveau sondage
      </DialogTrigger>
      <DialogContent className="max-w-md p-6">
        <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark">NOUVEAU SONDAGE</div>
        <h2 className="mk-display text-3xl mt-2">La question ?</h2>
        <div className="mt-6 space-y-3">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="On mange où ce soir ?"
            maxLength={200}
          />
          <div className="mk-eyebrow text-ink-mute dark:text-ink-mute-dark mt-4">OPTIONS</div>
          {options.map((opt, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                maxLength={100}
                className="flex-1"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="w-10 h-10 flex items-center justify-center text-ink-mute hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 4 && (
            <button
              type="button"
              onClick={addOption}
              className="text-sm text-ink-mute hover:text-ink underline mk-mono"
            >
              + Ajouter une option
            </button>
          )}
        </div>
        <Button
          type="button"
          onClick={handleSubmit}
          className="w-full mt-6"
          disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
        >
          Créer le sondage
        </Button>
      </DialogContent>
    </Dialog>
  )
}
