import type { Config } from 'tailwindcss';

export default {
  theme: {
    extend: {
      colors: {
        void: { DEFAULT: '#0B0E14' },
        dimension: { DEFAULT: '#141821' },
        rift: { DEFAULT: '#1C2230' },
        nebula: { DEFAULT: '#252D3B' },
        portal: { DEFAULT: '#39FF14', dim: '#2BD911' },
        ramen: { DEFAULT: '#FFB347' },
        miso: { DEFAULT: '#E8985A' },
        matcha: { DEFAULT: '#8DB580' },
        sakura: { DEFAULT: '#FFB7C5' },
        frost: { DEFAULT: '#8DB5E0' },
        plasma: { DEFAULT: '#B197FC' },
        text: {
          light: '#F0EDE8',
          mid: '#9BA3B2',
          dim: '#5A6270',
          ghost: '#3A4150',
        },
        family: {
          kolya: '#39FF14',
          kristina: '#FFB347',
          both: '#B197FC',
        },
      },
      fontFamily: {
        heading: ['Chakra Petch', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        button: '10px',
        card: '16px',
        modal: '20px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.3)',
        glow: '0 4px 16px rgba(57,255,20,0.15)',
        elevate: '0 8px 32px rgba(0,0,0,0.5)',
        nav: '0 -4px 20px rgba(0,0,0,0.4)',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '8': '48px',
      },
    },
  },
} satisfies Config;
