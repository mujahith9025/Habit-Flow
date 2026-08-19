/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    screens: {
      xs: '390px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Material 3 / Calm Momentum Tokens dynamic with CSS variables
        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
        'primary-container': 'var(--color-primary-container)',
        'on-primary-container': 'var(--color-on-primary-container)',
        'primary-fixed': 'var(--color-primary-fixed)',
        'primary-fixed-dim': 'var(--color-primary-fixed-dim)',
        'on-primary-fixed': 'var(--color-on-primary-fixed)',
        'on-primary-fixed-variant': 'var(--color-on-primary-fixed-variant)',
        'inverse-primary': 'var(--color-inverse-primary)',

        secondary: 'var(--color-secondary)',
        'on-secondary': 'var(--color-on-secondary)',
        'secondary-container': 'var(--color-secondary-container)',
        'on-secondary-container': 'var(--color-on-secondary-container)',
        'secondary-fixed': 'var(--color-secondary-fixed)',
        'secondary-fixed-dim': 'var(--color-secondary-fixed-dim)',
        'on-secondary-fixed': 'var(--color-on-secondary-fixed)',
        'on-secondary-fixed-variant': 'var(--color-on-secondary-fixed-variant)',

        tertiary: 'var(--color-tertiary)',
        'on-tertiary': 'var(--color-on-tertiary)',
        'tertiary-container': 'var(--color-tertiary-container)',
        'on-tertiary-container': 'var(--color-on-tertiary-container)',
        'tertiary-fixed': 'var(--color-tertiary-fixed)',
        'tertiary-fixed-dim': 'var(--color-tertiary-fixed-dim)',
        'on-tertiary-fixed': 'var(--color-on-tertiary-fixed)',
        'on-tertiary-fixed-variant': 'var(--color-on-tertiary-fixed-variant)',

        error: 'var(--color-error)',
        'on-error': 'var(--color-on-error)',
        'error-container': 'var(--color-error-container)',
        'on-error-container': 'var(--color-on-error-container)',

        background: 'var(--color-background)',
        'on-background': 'var(--color-on-background)',

        surface: 'var(--color-surface)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'surface-variant': 'var(--color-surface-variant)',
        'surface-tint': 'var(--color-surface-tint)',
        'surface-dim': 'var(--color-surface-dim)',
        'surface-bright': 'var(--color-surface-bright)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',

        'inverse-surface': 'var(--color-inverse-surface)',
        'inverse-on-surface': 'var(--color-inverse-on-surface)',

        outline: 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
      },
      spacing: {
        base: '8px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        'container-padding': '20px',
        'card-gutter': '12px',
      },
      fontFamily: {
        'app-title': ['"Plus Jakarta Sans"', 'sans-serif'],
        'section-header': ['"Plus Jakarta Sans"', 'sans-serif'],
        'habit-name': ['Manrope', 'sans-serif'],
        'body-text': ['Manrope', 'sans-serif'],
        'stat-label': ['Manrope', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
      },
      fontSize: {
        'app-title': ['26px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'section-header': ['18px', { lineHeight: '24px', fontWeight: '500' }],
        'habit-name': ['16px', { lineHeight: '22px', fontWeight: '500' }],
        'body-text': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'stat-label': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '700' }],
      },
      borderRadius: {
        sm: '0.25rem', // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.75rem', // 12px
        lg: '1rem', // 16px
        xl: '1.5rem', // 24px
        full: '9999px',
      },
      boxShadow: {
        soft: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0px 8px 30px rgba(0, 0, 0, 0.08)',
        'glow-primary': '0px 4px 20px rgba(0, 99, 152, 0.15)',
        'glow-secondary': '0px 2px 8px rgba(40, 107, 51, 0.3)',
      },
    },
  },
  plugins: [],
};
