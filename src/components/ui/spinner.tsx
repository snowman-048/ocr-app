import { ComponentProps, FC } from 'react'

import { Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'

type TSize = 'small' | 'medium' | 'large'

const SIZES_MAP: Record<TSize, number> = {
  small: 24,
  medium: 48,
  large: 96,
}

type TProps = ComponentProps<'svg'> & {
  size?: TSize
}

const Spinner: FC<TProps> = ({ className, size = 'medium', ...props }) => {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      color="var(--color-accent)"
      size={SIZES_MAP[size]}
      className={cn('animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
