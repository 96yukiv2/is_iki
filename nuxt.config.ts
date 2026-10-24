// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    'motion-v/nuxt',
    '@nuxt/eslint',
  ],

  css: ['~/assets/css/main.css'],

  eslint: {
    config: {
      stylistic: true,
    }
  },

  runtimeConfig: {
    geminiApiKey: '',
  }
})
