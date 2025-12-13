/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DHL Corporate Identity Colors
        dhl: {
          red: '#D40511',           // Primary - DHL Red
          yellow: '#FFCC00',        // Secondary - DHL Yellow
          black: '#000000',         // Text
          'dark-gray': '#333333',   // Dark text
          'medium-gray': '#666666', // Medium text
          'light-gray': '#CCCCCC',  // Borders, disabled
          white: '#FFFFFF',         // Background
          // Accent colors for digital interfaces
          green: '#00A651',         // Success
          orange: '#FF6600',        // Warning
          blue: '#0066CC',          // Info
        }
      },
      fontFamily: {
        // DHL uses Delivery font, fallback to Helvetica Neue
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // DHL Typography scale
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '28px',
        '4xl': '36px',
        '5xl': '48px',
      },
      spacing: {
        // DHL 8px grid system
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        // DHL prefers sharp or subtle corners
        'none': '0px',
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
        'full': '9999px',
      },
      boxShadow: {
        // Subtle shadows
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        // DHL standard transitions
        'DEFAULT': '150ms',
      },
      transitionTimingFunction: {
        'DEFAULT': 'ease-in-out',
      },
    },
  },
  plugins: [],
}
