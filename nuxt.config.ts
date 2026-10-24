// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    'motion-v/nuxt',
    '@nuxt/eslint',
  ],
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    geminiApiKey: '',
  },
  compatibilityDate: '2025-07-15',

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
