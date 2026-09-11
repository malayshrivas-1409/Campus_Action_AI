// Design Tokens - Single source of truth for the Campus AI design system
// Dark, editorial aesthetic: near-black background, off-white text, single lime accent

export const tokens = {
  // Background colors
  bg: {
    base: '#0a0a0a',      // Near-black page background
    surface: '#141414',    // Card/panel backgrounds
    elevated: '#1c1c1c',   // Hovered elements, modals
    overlay: 'rgba(0, 0, 0, 0.8)',
  },

  // Text colors
  text: {
    primary: '#f5f3ee',    // Off-white/cream, primary text
    secondary: '#a8a8a3',  // Secondary labels
    muted: '#6b6b66',      // Tertiary, hints
  },

  // Brand accent - single loud lime/chartreuse
  brand: {
    accent: '#d4ff3f',     // Primary accent (lime)
    accentDim: '#b8d926',  // Hover/pressed state
  },

  // Semantic colors (use sparingly)
  semantic: {
    success: '#10b981',    // Green
    warning: '#f59e0b',    // Amber
    error: '#ef4444',      // Red
    info: '#3b82f6',       // Blue
  },

  // Borders
  border: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    accent: 'rgba(212, 255, 63, 0.3)',
  },

  // Typography
  fonts: {
    display: 'system-ui, -apple-system, sans-serif', // Bold, condensed for headings
    body: 'Inter, system-ui, sans-serif',             // Body copy
    mono: '"JetBrains Mono", monospace',              // Code/technical
  },

  // Spacing scale
  space: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
  },

  // Border radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // Shadow/depth
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.4)',
    lg: '0 12px 32px rgba(0, 0, 0, 0.5)',
  },
} as const;

// Tailwind config - maps tokens to utility classes
export const tailwindExtension = {
  extend: {
    colors: {
      bg: tokens.bg,
      text: tokens.text,
      brand: tokens.brand,
      semantic: tokens.semantic,
      border: tokens.border,
    },
    fontFamily: {
      display: tokens.fonts.display,
      body: tokens.fonts.body,
      mono: tokens.fonts.mono,
    },
    spacing: tokens.space,
    borderRadius: tokens.radius,
    boxShadow: tokens.shadow,
    keyframes: {
      shimmer: {
        '0%': { backgroundPosition: '-1000px 0' },
        '100%': { backgroundPosition: '1000px 0' },
      },
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
    },
    animation: {
      shimmer: 'shimmer 2s infinite',
      fadeIn: 'fadeIn 0.3s ease-out',
    },
  },
};
