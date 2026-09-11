/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Backgrounds (light theme)
        bg: {
          base: '#FAFAF8',      // main page background, warm off-white
          surface: '#FFFFFF',   // cards, panels
          subtle: '#F2F1EC',    // secondary sections, hover backgrounds
        },
        // Text
        ink: {
          900: '#171717',       // primary text
          600: '#525252',       // secondary text
          400: '#8A8A85',       // muted/placeholder text
        },
        // Brand — primary accent (buttons, active states, links)
        brand: {
          50:  '#EEF4FF',
          100: '#DCE9FF',
          300: '#93B7FF',
          500: '#4C7EFF',       // primary brand blue
          600: '#3B63E0',
          700: '#2E4FBF',
        },
        // Secondary accent — warm coral, for highlights/badges/gradients only
        accent: {
          100: '#FFE8E0',
          400: '#FF8A65',
          500: '#FF6F47',
        },
        // Semantic
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        border: {
          DEFAULT: '#E7E5E0',
          strong: '#D4D2CB',
        },
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,23,23,0.04), 0 8px 24px rgba(23,23,23,0.06)',
        'card-hover': '0 4px 12px rgba(23,23,23,0.08), 0 16px 40px rgba(76,126,255,0.12)',
        glow: '0 0 0 1px rgba(76,126,255,0.15), 0 0 24px rgba(76,126,255,0.25)',
        nav: '0 8px 32px rgba(23,23,23,0.08)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(76,126,255,0.14), transparent), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(255,111,71,0.10), transparent)',
        'brand-gradient': 'linear-gradient(135deg, #4C7EFF 0%, #6C5CE7 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(76,126,255,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(76,126,255,0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
        floatUp: 'floatUp 0.5s ease-out both',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
