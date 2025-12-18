import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Integrate with existing CSS variables
      colors: {
        primary: 'var(--color-bg-primary)',
        secondary: 'var(--color-bg-secondary)', 
        surface: 'var(--color-surface)',
        accent: 'var(--color-accent)',
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
        },
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
        success: 'var(--color-success)',
      },
      fontFamily: {
        sans: 'var(--font-family)',
      },
      spacing: {
        // Preserve existing spacing scale
        '1': 'var(--space-1)',
        '2': 'var(--space-2)', 
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '7': 'var(--space-7)',
        '8': 'var(--space-8)',
      },
      fontSize: {
        'xs': 'var(--font-size-xs)',
        'sm': 'var(--font-size-sm)', 
        'md': 'var(--font-size-md)',
        'lg': 'var(--font-size-lg)',
        'xl': 'var(--font-size-xl)',
      },
      backdropBlur: {
        'glass': 'var(--glass-blur)',
      },
      backgroundColor: {
        'glass': 'var(--glass-bg)',
      },
      borderColor: {
        'glass': 'var(--glass-border)',
      },
    },
  },
  plugins: [],
} satisfies Config