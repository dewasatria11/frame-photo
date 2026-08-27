export default defineNuxtConfig({
  compatibilityDate: '2026-08-01',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  components: [{ path: '~/components', pathPrefix: false }],
  css: ['~/assets/css/main.css'],
  typescript: { strict: true, typeCheck: false },
  runtimeConfig: {
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'LensFlow Watermark Pro',
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '',
    },
  },
  app: {
    head: {
      title: 'LensFlow Watermark Pro',
      htmlAttrs: { lang: 'id' },
      meta: [
        { name: 'description', content: 'Pemroses watermark foto event lokal dan otomatis.' },
        { name: 'theme-color', content: '#16a34a' },
        { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  nitro: {
    preset: process.env.VERCEL ? 'vercel' : undefined,
    routeRules: {
      '/**': {
        headers: {
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'strict-origin-when-cross-origin',
          'permissions-policy': 'camera=(), microphone=(), geolocation=()',
          'content-security-policy': "default-src 'self'; img-src 'self' blob: data: https://*.workers.dev; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https: http://localhost:8787; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
        },
      },
    },
  },
})
