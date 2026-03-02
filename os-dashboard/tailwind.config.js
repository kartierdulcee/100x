/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        card: '#111113',
        muted: '#18181b',
        border: '#27272a',
        primary: '#f4f4f5',
      },
    },
  },
  plugins: [],
}

