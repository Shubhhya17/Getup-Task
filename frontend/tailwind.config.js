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
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Status semantic colors */
        'status-open':     'hsl(var(--status-open))',
        'status-progress': 'hsl(var(--status-progress))',
        'status-resolved': 'hsl(var(--status-resolved))',
        'status-closed':   'hsl(var(--status-closed))',
        /* Priority semantic colors */
        'priority-low':      'hsl(var(--priority-low))',
        'priority-medium':   'hsl(var(--priority-medium))',
        'priority-high':     'hsl(var(--priority-high))',
        'priority-critical': 'hsl(var(--priority-critical))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'var(--radius-sm)',
        xl: 'var(--radius-lg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.8125rem', { lineHeight: '1.25rem' }],
        base:  ['0.875rem', { lineHeight: '1.5rem' }],
        lg:    ['1rem',     { lineHeight: '1.5rem' }],
        xl:    ['1.125rem', { lineHeight: '1.5rem' }],
        '2xl': ['1.25rem',  { lineHeight: '1.5rem' }],
        '3xl': ['1.5rem',   { lineHeight: '1.75rem' }],
      },
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '18': '4.5rem',
        '22': '5.5rem',
        '68': '17rem',
        '72': '18rem',
      },
      keyframes: {
        /* The ONE orchestrated animation: dashboard KPI reveal */
        'kpi-count-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        /* State-change animations */
        'comment-in': {
          from: { opacity: '0', transform: 'translateX(-6px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'accept-flash': {
          '0%':   { background: 'hsl(var(--ai-surface))' },
          '40%':  { background: 'hsl(var(--primary) / 0.12)' },
          '100%': { background: 'hsl(var(--ai-surface))' },
        },
        'critical-tick': {
          '0%, 100%': { 'border-left-color': 'hsl(var(--priority-critical))' },
          '50%':      { 'border-left-color': 'hsl(var(--priority-critical) / 0.35)' },
        },
        shimmer: {
          from: { backgroundPosition: '-300px 0' },
          to:   { backgroundPosition: 'calc(300px + 100%) 0' },
        },
        /* Accordion (kept for shadcn compatibility) */
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        /* Subtle slide for filter panels */
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'kpi-count-in': 'kpi-count-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'comment-in':   'comment-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'accept-flash': 'accept-flash 400ms ease both',
        'critical-tick': 'critical-tick 2.5s ease infinite',
        shimmer:         'shimmer 1.6s ease infinite',
        'slide-down':    'slide-down 150ms ease both',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
      boxShadow: {
        /* No hover-lift; shadows communicate state, not hover */
        'card':    '0 1px 3px hsl(220 14% 3% / 0.4)',
        'overlay': '0 8px 24px hsl(220 14% 3% / 0.6)',
        'focus':   '0 0 0 2px hsl(var(--primary) / 0.4)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
