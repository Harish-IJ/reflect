import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '#/lib/api'
import { keys } from '#/lib/hooks'
import { Modal, fieldClass, labelClass, primaryBtn } from './Modal'

export function AddGoalModal({
  quarterId,
  onClose,
}: {
  quarterId: number
  onClose: () => void
}) {
  const [title, setTitle] = useState('')
  const qc = useQueryClient()
  const create = useMutation({
    mutationFn: () => api.createGoal(quarterId, { title }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.goals(quarterId) })
      await qc.invalidateQueries({ queryKey: keys.scores(quarterId) })
      onClose()
    },
  })

  return (
    <Modal title="New goal" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (title.trim()) create.mutate()
        }}
      >
        <label htmlFor="goal-title" className={labelClass}>
          What are you working toward?
        </label>
        <input
          id="goal-title"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Get fit"
          className={fieldClass}
        />
        {create.isError && (
          <p className="mt-2 text-sm text-hardened">Couldn’t save that. Try again.</p>
        )}
        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={!title.trim() || create.isPending} className={primaryBtn}>
            {create.isPending ? 'Saving…' : 'Add goal'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
