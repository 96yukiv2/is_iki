<script setup lang="ts">
import { motion } from 'motion-v'

type IkiJudgment = {
  isIki: boolean
  comment: string
  reason: string
}

const input = ref('')
const result = ref<IkiJudgment | null>(null)
const pending = ref(false)
const errorMessage = ref('')

async function judge() {
  if (!input.value.trim() || pending.value) return

  pending.value = true
  result.value = null
  errorMessage.value = ''

  try {
    result.value = await $fetch<IkiJudgment>('/api/judge', {
      method: 'POST',
      body: {
        input: input.value.trim(),
      },
    })
  }
  catch {
    errorMessage.value = 'うまく見定められませんでした。'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <UApp>
    <div class="min-h-dvh bg-[#F5F0E6] text-[#24251F]">
      <main class="mx-auto w-full max-w-2xl px-5 sm:px-8">
        <header class="flex items-center justify-between">
          <span class="text-sm font-medium tracking-wider text-[#655847]">
            is粋
          </span>

          <UIcon
            name="i-lucide-flower-2"
            class="size-5 text-[#A4493B]"
          />
        </header>

        <section class="py-12 text-center sm:py-20">
          <h1 class="font-serif text-[clamp(1.15rem,5vw,1.5rem)] leading-relaxed sm:text-3xl">
            <span class="block sm:inline">さりげなきこそ、</span>
            <span class="block sm:inline">あはれなれ。</span>
          </h1>

          <p class="mt-4 text-xs leading-relaxed text-[#77756E] sm:text-sm">
            <span class="block sm:inline">人知れぬ心づくしにこそ、</span>
            <span class="block sm:inline">趣は宿る。</span>
          </p>
        </section>

        <section class="rounded-2xl border border-[#E5DED2] bg-[#FFFEFA] p-4 sm:p-5">
          <label
            for="iki-input"
            class="mb-4 block text-xs text-[#8A8177]"
          >
            ひと"粋"つきましょう。
          </label>

          <UTextarea
            id="iki-input"
            v-model="input"
            placeholder="いとをかしきこと、記し給へ。"
            :rows="3"
            :maxlength="500"
            autoresize
            class="w-full"
            :ui="{
              base: 'w-full bg-transparent text-base text-[#24251F] placeholder:text-sm',
            }"
          />

          <div class="mt-4 flex justify-center sm:justify-end">
            <UButton
              label="いざ、見定めむ"
              icon="i-lucide-arrow-up-right"
              trailing
              size="sm"
              :disabled="!input.trim() || pending"
              class="min-h-11 justify-center px-5 text-white"
              :loading="pending"
              @click="judge"
            />
          </div>
        </section>

        <section
          v-if="result"
          class="mt-6 text-center"
        >
          <motion.div
            :initial="{
              opacity: 0,
              y: -14,
              scale: 1.15,
            }"
            :animate="{
              opacity: 1,
              y: [-14, 3, 0],
              scale: [1.15, 0.94, 1],
            }"
            :transition="{
              duration: 0.35,
              ease: 'easeOut',
            }"
            class="flex justify-center"
          >
            <svg
              viewBox="0 0 120 120"
              class="mx-auto mb-4 size-28"
              role="img"
              :aria-label="result.isIki ? '粋の判定印' : '否の判定印'"
            >
              <template v-if="result.isIki">
                <circle
                  cx="60"
                  cy="60"
                  r="51"
                  fill="none"
                  stroke="#A4493B"
                  stroke-width="2.5"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#A4493B"
                  stroke-width="0.8"
                />
                <text
                  x="60"
                  y="79"
                  text-anchor="middle"
                  font-family="serif"
                  font-size="58"
                  fill="#A4493B"
                >粋</text>
              </template>

              <template v-else>
                <circle
                  cx="60"
                  cy="60"
                  r="51"
                  fill="none"
                  stroke="#77756E"
                  stroke-width="1.5"
                  stroke-dasharray="3 4"
                />
                <text
                  x="60"
                  y="76"
                  text-anchor="middle"
                  font-family="serif"
                  font-size="45"
                  fill="#77756E"
                >否</text>
              </template>
            </svg>
          </motion.div>

          <h2 class="font-serif text-2xl text-[#A4493B]">
            {{ result.isIki ? '粋です。' : '粋ではありません。' }}
          </h2>

          <p class="mt-3 text-sm text-[#24251F]">
            {{ result.comment }}
          </p>

          <p class="mt-2 text-xs leading-relaxed text-[#77756E]">
            {{ result.reason }}
          </p>
        </section>

        <p
          v-if="errorMessage"
          role="alert"
          class="mt-6 text-center text-sm text-[#A4493B]"
        >
          {{ errorMessage }}
        </p>
      </main>
    </div>
  </UApp>
</template>
