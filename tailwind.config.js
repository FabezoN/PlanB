/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'planb-red': '#8E1212',
        'planb-coral': '#FF8B60',
        'planb-dark': '#100906',
        'planb-yellow': '#F8ECAB',
        'planb-cream': '#FDFAEA',
        border: '#E8E0D0',
        input: '#E8E0D0',
        background: '#FDFAEA',
        foreground: '#100906',
        primary: {
          DEFAULT: '#8E1212',
          foreground: '#FDFAEA',
        },
        secondary: {
          DEFAULT: '#FF8B60',
          foreground: '#100906',
        },
        destructive: {
          DEFAULT: '#B91C1C',
          foreground: '#FDFAEA',
        },
        muted: {
          DEFAULT: '#F3EDD8',
          foreground: '#6B5C4D',
        },
        accent: {
          DEFAULT: '#F8ECAB',
          foreground: '#100906',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#100906',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}

