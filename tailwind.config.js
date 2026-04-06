/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        /* Tighter scale — everything ~1–2pt smaller than Tailwind defaults */
        'xxs':  ['0.625rem',  { lineHeight: '0.875rem' }],  /* 8.75px */
        'xs':   ['0.6875rem', { lineHeight: '1rem'     }],  /* 9.625px */
        'sm':   ['0.75rem',   { lineHeight: '1.125rem' }],  /* 10.5px  */
        'base': ['0.8125rem', { lineHeight: '1.25rem'  }],  /* 11.375px */
        'md':   ['0.875rem',  { lineHeight: '1.375rem' }],  /* 12.25px  */
        'lg':   ['1rem',      { lineHeight: '1.5rem'   }],  /* 14px     */
        'xl':   ['1.125rem',  { lineHeight: '1.625rem' }],  /* 15.75px  */
        '2xl':  ['1.25rem',   { lineHeight: '1.75rem'  }],  /* 17.5px   */
        '3xl':  ['1.5rem',    { lineHeight: '2rem'     }],  /* 21px     */
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      minHeight: {
        '11': '44px',
        '14': '56px',
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
