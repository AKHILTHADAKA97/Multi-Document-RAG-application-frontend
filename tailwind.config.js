/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          soft: '#FFF7ED',
          border: '#FED7AA',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sidebar: '#FFFFFF',
          container: '#F8FAFC',
          card: '#FFFFFF',
          border: '#E5E7EB',
          borderLight: '#F1F5F9',
        },
        text: {
          primary: '#111827',
          secondary: '#64748B',
          muted: '#94A3B8',
        },
        status: {
          success: '#16A34A',
          info: '#2563EB',
          warning: '#F59E0B',
          error: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 2px 6px -1px rgba(0, 0, 0, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'popover': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.text.primary'),
            '--tw-prose-headings': theme('colors.text.primary'),
            '--tw-prose-lead': theme('colors.text.secondary'),
            '--tw-prose-links': theme('colors.primary.DEFAULT'),
            '--tw-prose-bold': theme('colors.text.primary'),
            '--tw-prose-counters': theme('colors.text.muted'),
            '--tw-prose-bullets': theme('colors.text.muted'),
            '--tw-prose-hr': theme('colors.surface.border'),
            '--tw-prose-quotes': theme('colors.text.primary'),
            '--tw-prose-quote-borders': theme('colors.primary.DEFAULT'),
            '--tw-prose-captions': theme('colors.text.muted'),
            '--tw-prose-kbd': theme('colors.surface.DEFAULT'),
            '--tw-prose-kbd-shadows': '0 0 0 1px rgba(0,0,0,0.1)',
            '--tw-prose-code': theme('colors.primary.600'),
            '--tw-prose-pre-code': theme('colors.slate.100'),
            '--tw-prose-pre-bg': theme('colors.slate.900'),
            '--tw-prose-th-borders': theme('colors.surface.border'),
            '--tw-prose-td-borders': theme('colors.surface.border'),
            fontSize: {
              base: '0.9375rem',
              xl: '1rem',
            },
            lineHeight: {
              base: '1.7',
              xl: '1.7',
            },
            maxWidth: {
              DEFAULT: '48rem',
              xl: '52rem',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
