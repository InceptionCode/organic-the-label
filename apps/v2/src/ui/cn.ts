import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-xl', 'display-l', 'display-m',
            'h1', 'h2', 'h3', 'h4', 'h5',
            'body-l', 'body-m', 'body-s', 'caption', 'label',
          ],
        },
      ],
      'text-color': [{ text: ['primary', 'secondary', 'muted', 'disabled', 'accent', 'accent-secondary'] }],
      'bg-color': [{ bg: ['canvas', 'surface-1', 'surface-2', 'surface-3', 'overlay-surface', 'accent', 'accent-soft', 'accent-secondary-soft'] }],
      'border-color': [{ border: ['subtle', 'default', 'strong'] }],
      shadow: [{ shadow: ['sm-premium', 'md-premium', 'lg-premium', 'glow', 'float'] }],
    },
  },
})

/** Compose class names; later Tailwind utilities win over earlier conflicting ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
