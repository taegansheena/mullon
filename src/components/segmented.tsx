import { cn } from 'cn'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type Option<T> = { value: T; label: string; className?: string }

/**
 * A segmented control: one option is always selected. Built on shadcn's ToggleGroup.
 * keepFocus stops the buttons taking focus, so tapping them leaves the cursor where it was (used by the notes editor).
 */
export function Segmented<T extends string>({
  value,
  onSelect,
  options,
  label,
  keepFocus,
  className,
}: {
  value: T | undefined
  onSelect: (value: T) => void
  options: Option<T>[]
  label: string
  keepFocus?: boolean
  className?: string
}) {
  return (
    <ToggleGroup aria-label={label} value={value ? [value] : []} className={cn('gap-0 rounded-[10px] bg-muted p-[3px]', className)}>
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          onClick={() => onSelect(o.value)}
          onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
          onPointerDown={keepFocus ? (e) => e.preventDefault() : undefined}
          className={cn(
            'h-8 rounded-lg px-3.5 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm data-[pressed]:bg-background',
            o.className,
          )}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
