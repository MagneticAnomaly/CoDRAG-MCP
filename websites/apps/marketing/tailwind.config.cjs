const preset = require('../../tailwind.preset.cjs');

module.exports = {
  presets: [preset],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
        space: ['var(--font-space)', 'monospace'],
        'ibm-sans': ['var(--font-ibm-sans)', 'sans-serif'],
        'ibm-mono': ['var(--font-ibm-mono)', 'monospace'],
      },
    },
  },
};
