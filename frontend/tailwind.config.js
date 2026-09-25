/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Semantic color access for Recharts / inline use */
        'status-open':      '#16A34A',
        'status-progress':  '#D97706',
        'status-resolved':  '#2563EB',
        'status-closed':    '#9CA3AF',
        'priority-low':     '#16A34A',
        'priority-medium':  '#D97706',
        'priority-high':    '#EA580C',
        'priority-critical':'#DC2626',
      },
      borderRadius: {
        sm:  'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg:  'var(--radius-lg)',
        xl:  '0.75rem',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem',  { lineHeight: '0.875rem' }],
        xs:    ['0.6875rem', { lineHeight: '1rem'     }],   /* 11px */
        sm:    ['0.8125rem', { lineHeight: '1.25rem'  }],   /* 13px */
        base:  ['0.875rem',  { lineHeight: '1.5rem'   }],   /* 14px */
        lg:    ['1rem',      { lineHeight: '1.5rem'   }],   /* 16px */
        xl:    ['1.0625rem', { lineHeight: '1.4rem'   }],   /* 17px */
        '2xl': ['1.25rem',   { lineHeight: '1.5rem'   }],
        '3xl': ['1.5rem',    { lineHeight: '1.6rem'   }],
      },
      spacing: {
        '18': '4.5rem',
        '50': '12.5rem',
        '55': '13.75rem',
        '72': '18rem',
      },
      boxShadow: {
        /* No decorative shadows. Overlay only. */
        'overlay': '0 4px 16px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.05)',
        'none':     'none',
      },
      keyframes: {
        'kpi-in': {
          from: { opacity: '0', transform: 'translateY(5px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'comment-in': {
          from: { opacity: '0', transform: 'translateX(-4px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'accept-pulse': {
          '0%':   { background: 'hsl(var(--ai-surface))' },
          '45%':  { background: 'rgba(37, 99, 235, 0.08)' },
          '100%': { background: 'hsl(var(--ai-surface))' },
        },
        'critical-tick': {
          '0%, 100%': { 'border-left-color': '#DC2626' },
          '50%':      { 'border-left-color': 'rgba(220, 38, 38, 0.3)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-3px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'kpi-in':        'kpi-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'comment-in':    'comment-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'accept-pulse':  'accept-pulse 350ms ease both',
        'critical-tick': 'critical-tick 3s ease infinite',
        'slide-down':    'slide-down 130ms ease both',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
