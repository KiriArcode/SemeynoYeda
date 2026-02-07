import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      colors: {
        // Backgrounds — 5 levels of depth
        void: { DEFAULT: '#0B0E14' },
        panel: { DEFAULT: '#111620' },
        dimension: { DEFAULT: '#141821' },
        card: { DEFAULT: '#161C2A' },
        rift: { DEFAULT: '#1C2230' },
        elevated: { DEFAULT: '#1E2538' },
        nebula: { DEFAULT: '#252D3B' },
        hover: { DEFAULT: '#1A2235' },

        // Portal — primary accent
        portal: { DEFAULT: '#39FF14', dim: '#00E676' },
        'portal-glow': 'rgba(57,255,20,0.12)',
        'portal-soft': 'rgba(57,255,20,0.05)',

        // Accent colors
        'accent-pink': { DEFAULT: '#FF6B9D' },
        'accent-cyan': { DEFAULT: '#00E5FF' },
        'accent-orange': { DEFAULT: '#FF9100' },
        'accent-yellow': { DEFAULT: '#FFE500' },
        'accent-purple': { DEFAULT: '#B388FF' },

        // Food — content colors
        ramen: { DEFAULT: '#FFB347' },
        miso: { DEFAULT: '#E8985A' },
        matcha: { DEFAULT: '#8DB580' },
        sakura: { DEFAULT: '#FFB7C5' },
        frost: { DEFAULT: '#8DB5E0' },
        plasma: { DEFAULT: '#B197FC' },

        // Text hierarchy
        text: {
          primary: '#E8ECF4',
          light: '#F0EDE8',
          secondary: '#8892A6',
          mid: '#9BA3B2',
          muted: '#525D72',
          dim: '#5A6270',
          ghost: '#3A4150',
          inverse: '#0B0E14',
        },

        // Family member colors (NEW: kolya=cyan, kristina=pink, both=portal)
        kolya: { DEFAULT: '#00E5FF' },
        kristina: { DEFAULT: '#FF6B9D' },
        // 'both' uses portal green — no separate token needed
      },
      fontFamily: {
        heading: ["'Exo 2'", "'Chakra Petch'", 'sans-serif'],
        body: ["'DM Sans'", "'Noto Sans JP'", 'sans-serif'],
        mono: ["'Share Tech Mono'", "'JetBrains Mono'", 'monospace'],
        jp: ["'Noto Sans JP'", 'sans-serif'],
      },
      borderRadius: {
        tag: '4px',
        sm: '6px',
        md: '8px',
        button: '10px',
        card: '12px',
        lg: '14px',
        xl: '16px',
        modal: '20px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 4px 16px rgba(0,0,0,0.2)',
        glow: '0 0 24px rgba(57,255,20,0.12)',
        elevate: '0 8px 32px rgba(0,0,0,0.3)',
        nav: '0 -2px 16px rgba(0,0,0,0.3)',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
      },
    },
  },
} satisfies Config;
