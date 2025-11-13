'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full',
        'shadow-xs transition-all outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring',

        'border border-gray-300 dark:border-gray-600',
        'data-[state=checked]:border-primary',

        'data-[state=unchecked]:bg-white dark:data-[state=unchecked]:bg-gray-800',

        'disabled:cursor-not-allowed disabled:opacity-50',

        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-4 rounded-full ring-0 transition-transform',
          'bg-white dark:bg-gray-200',
          'border border-gray-300 dark:border-gray-600',
          'data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
          'data-[state=checked]:bg-white dark:data-[state=checked]:bg-primary-foreground',
          'shadow-sm'
        )}
      />
    </SwitchPrimitive.Root>
  )
}
export { Switch }
