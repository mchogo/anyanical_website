import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(20, 184, 166, 0.16)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideDown: {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to: { opacity: '0', transform: 'translateY(10px) scale(0.97)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease both',
        'fade-out': 'fadeOut 120ms ease both',
        'slide-up': 'slideUp 200ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-down': 'slideDown 150ms ease-in both',
      },
    },
  },
  plugins: [],
} satisfies Config;
