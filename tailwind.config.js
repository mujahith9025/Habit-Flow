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
        // Material 3 / Calm Momentum Tokens from Stitch
        primary: '#006398',
        'on-primary': '#ffffff',
        'primary-container': '#64b5f6',
        'on-primary-container': '#00456c',
        'primary-fixed': '#cde5ff',
        'primary-fixed-dim': '#94ccff',
        'on-primary-fixed': '#001d32',
        'on-primary-fixed-variant': '#004b74',
        'inverse-primary': '#94ccff',

        secondary: '#286b33',
        'on-secondary': '#ffffff',
        'secondary-container': '#abf4ac',
        'on-secondary-container': '#2e7238',
        'secondary-fixed': '#abf4ac',
        'secondary-fixed-dim': '#90d792',
        'on-secondary-fixed': '#002107',
        'on-secondary-fixed-variant': '#07521d',

        tertiary: '#a03e40',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#ff8e8d',
        'on-tertiary-container': '#7a2226',
        'tertiary-fixed': '#ffdad8',
        'tertiary-fixed-dim': '#ffb3b1',
        'on-tertiary-fixed': '#410007',
        'on-tertiary-fixed-variant': '#80272b',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        background: '#f7f9fc',
        'on-background': '#191c1e',

        surface: '#f7f9fc',
        'on-surface': '#191c1e',
        'on-surface-variant': '#404850',
        'surface-variant': '#e0e3e6',
        'surface-tint': '#006398',
        'surface-dim': '#d8dadd',
        'surface-bright': '#f7f9fc',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f7',
        'surface-container': '#eceef1',
        'surface-container-high': '#e6e8eb',
        'surface-container-highest': '#e0e3e6',

        'inverse-surface': '#2d3133',
        'inverse-on-surface': '#eff1f4',

        outline: '#707881',
        'outline-variant': '#c0c7d1',
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
