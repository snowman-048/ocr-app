/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { useImageFilesPreviews } from '@/hooks/use-image-files-previews'

import { Item, ItemContent, ItemMedia, ItemTitle } from './ui/item'
import { Spinner } from './ui/spinner'

type TSortableItem<T> = {
  id: string
  data: T
  preview?: string
}

type TProps<T> = {
  items: TSortableItem<T>[]
  onSave: (items: TSortableItem<T>[]) => void
  onClose?: () => void
}

type TSortableItemProps<T> = {
  item: TSortableItem<T>
  index: number
  total: number
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
}

const SortableItem = <T extends File>({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: TSortableItemProps<T>) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform ? { ...transform, x: 0 } : null),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <Item variant="outline" size="sm" ref={setNodeRef} style={style}>
      <ItemMedia>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={18} className="text-muted-foreground" />
        </div>
      </ItemMedia>
      <ItemContent className="flex-row gap-4 items-center">
        {!!item.preview && (
          <img
            src={item.preview}
            alt={`Preview of ${item.data.name || 'uploaded file'}`}
            className="max-h-64"
          />
        )}
        <ItemTitle>{item.data.name}</ItemTitle>
      </ItemContent>
      <ItemMedia>
        <div className="flex flex-col gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={index === 0}
            aria-label={`Move ${item.data.name} up`}
            onClick={() => onMoveUp(index)}
          >
            <ArrowUp size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={index === total - 1}
            aria-label={`Move ${item.data.name} down`}
            onClick={() => onMoveDown(index)}
          >
            <ArrowDown size={14} />
          </Button>
        </div>
      </ItemMedia>
    </Item>
  )
}

const SortableImageFilesList = <T extends File>({ items, onSave, onClose }: TProps<T>) => {
  const t = useTranslations()

  const [sortedItems, setSortedItems] = useState(items)
  const [isInit, setIsInit] = useState(false)

  const initialFiles = useMemo(() => items.map((item) => item.data), [items])
  const { previews } = useImageFilesPreviews(initialFiles)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleMoveUp = (index: number) => {
    if (index <= 0) return
    setSortedItems((items) => arrayMove(items, index, index - 1))
  }

  const handleMoveDown = (index: number) => {
    if (index >= sortedItems.length - 1) return
    setSortedItems((items) => arrayMove(items, index, index + 1))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    setSortedItems((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const handleSave = () => {
    onSave(sortedItems)
    onClose?.()
  }

  useEffect(() => {
    if (isInit || previews?.filter(Boolean).length !== sortedItems.length) {
      return
    }

    setSortedItems((prev) => {
      return prev.map((item, index) => {
        return { ...item, preview: previews[index] }
      })
    })

    setIsInit(true)
  }, [previews])

  if (!isInit) {
    return <Spinner className="mx-auto" />
  }

  return (
    <div className="overflow-hidden max-h-full flex flex-col gap-4">
      <div className="overflow-hidden flex">
        <div className="overflow-y-auto overflow-x-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortedItems} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 overflow-x-hidden">
                {sortedItems.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    index={index}
                    total={sortedItems.length}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex-1">
          {t('image_upload.reorder.save_order')}
        </Button>
        <Button onClick={onClose} variant="outline" className="flex-1">
          {t('common.cancel')}
        </Button>
      </div>
    </div>
  )
}

export { SortableImageFilesList }
