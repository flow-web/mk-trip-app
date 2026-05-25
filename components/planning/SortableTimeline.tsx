'use client'

import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import { TimelineEvent } from './TimelineEvent'
import type { AccentTokens } from '@/lib/design/tokens'

interface Activity {
  id: string
  time: string | null
  title: string
  subtitle: string | null
  completed_at: string | null
}

interface DayTarget {
  id: string
  day_number: number
  date: string | null
}

interface Props {
  activities: Activity[]
  accent: AccentTokens
  onToggleActivity: (id: string, currentlyDone: boolean) => void
  currentActivityId?: string | null
  onReorder: (orderedIds: string[]) => void
  onMoveToDay: (activityId: string, dayId: string) => void
  days: DayTarget[]
  activeDayId: string
}

function SortableItem({
  activity,
  accent,
  isLast,
  currentActivityId,
  onToggle,
}: {
  activity: Activity
  accent: AccentTokens
  isLast: boolean
  currentActivityId?: string | null
  onToggle: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start">
      <button
        type="button"
        className="mt-3 mr-1 p-1 text-ink-mute/40 hover:text-ink-mute touch-none cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1">
        <TimelineEvent
          time={activity.time?.slice(0, 5) ?? '—'}
          title={activity.title}
          subtitle={activity.subtitle ?? undefined}
          done={!!activity.completed_at}
          active={activity.id === currentActivityId}
          accent={accent}
          isLast={isLast}
          onToggle={onToggle}
        />
      </div>
    </div>
  )
}

function DayDropZone({
  day,
  isOver,
  accent,
}: {
  day: DayTarget
  isOver: boolean
  accent: AccentTokens
}) {
  const { setNodeRef } = useDroppable({ id: `day-drop-${day.id}` })
  const DAYS_FR = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
  const date = day.date ? new Date(day.date) : null
  const dayLabel = date ? DAYS_FR[date.getDay()] : '?'
  const dateLabel = date ? date.getDate().toString().padStart(2, '0') : '?'

  return (
    <div
      ref={setNodeRef}
      className="flex-1 flex flex-col items-center py-2 rounded-sm border transition-all"
      style={{
        background: isOver ? accent.base : 'transparent',
        borderColor: isOver ? accent.base : '#1C1A1714',
        color: isOver ? '#fff' : '#1C1A17',
        transform: isOver ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <span className="mk-mono text-[9px] opacity-70">{dayLabel}</span>
      <span className="font-display font-bold text-base mt-0.5">{dateLabel}</span>
    </div>
  )
}

export function SortableTimeline({
  activities,
  accent,
  onToggleActivity,
  currentActivityId,
  onReorder,
  onMoveToDay,
  days,
  activeDayId,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overDayId, setOverDayId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const activeActivity = activeId
    ? activities.find((a) => a.id === activeId)
    : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined
    if (overId?.startsWith('day-drop-')) {
      setOverDayId(overId.replace('day-drop-', ''))
    } else {
      setOverDayId(null)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    setOverDayId(null)

    if (!over) return

    const overId = over.id as string
    if (overId.startsWith('day-drop-')) {
      const targetDayId = overId.replace('day-drop-', '')
      if (targetDayId !== activeDayId) {
        onMoveToDay(active.id as string, targetDayId)
      }
      return
    }

    if (active.id !== over.id) {
      const oldIndex = activities.findIndex((a) => a.id === active.id)
      const newIndex = activities.findIndex((a) => a.id === over.id)
      const reordered = arrayMove(activities, oldIndex, newIndex)
      onReorder(reordered.map((a) => a.id))
    }
  }

  const otherDays = days.filter((d) => d.id !== activeDayId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {activeId && otherDays.length > 0 && (
        <div className="px-5 mb-3 flex gap-1.5">
          {otherDays.map((d) => (
            <DayDropZone
              key={d.id}
              day={d}
              isOver={overDayId === d.id}
              accent={accent}
            />
          ))}
        </div>
      )}

      <div className="px-5 pb-24">
        <SortableContext
          items={activities.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {activities.map((a, i) => (
            <SortableItem
              key={a.id}
              activity={a}
              accent={accent}
              isLast={i === activities.length - 1}
              currentActivityId={currentActivityId}
              onToggle={() => onToggleActivity(a.id, !!a.completed_at)}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay>
        {activeActivity && (
          <div className="bg-paper dark:bg-paper-dark rounded-md shadow-lg px-4 py-2 opacity-90">
            <div className="font-display font-bold text-base">{activeActivity.title}</div>
            {activeActivity.subtitle && (
              <div className="text-xs text-ink-soft mt-0.5">{activeActivity.subtitle}</div>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
