/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--color-bg)',
        'surface-secondary': 'var(--color-bg-secondary)',
        border: 'var(--color-border)',
        foreground: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        accent: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8'
        },
        success: '#059669',
        danger: '#dc2626',
        warning: '#d97706'
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif'
        ]
      },
      boxShadow: {
        card: '0 4px 14px rgba(0, 0, 0, 0.08)'
      }
    }
  },
  plugins: []
};
