import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: ['./app/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: { primary: { 50: '#f3fbf5', 100: '#eaf7ee', 600: '#16a34a', 700: '#15803d', 800: '#166534' } },
    },
  },
}
