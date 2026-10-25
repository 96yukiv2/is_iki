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
const showEasterEgg = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const selectedImage = ref<File | null>(null)
const imagePreviewUrl = ref<string | null>(null)
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 4 * 1024 * 1024

const imageError = ref('')

function selectImage() {
  imageInput.value?.click()
}

function onImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  // 選択をキャンセルした場合は既存画像を維持
  if (!file) return

  if (!allowedImageTypes.includes(file.type)) {
    imageError.value = 'JPEG・PNG・WebP形式の画像を選択してください。'
    target.value = ''
    return
  }

  if (file.size > maxImageSize) {
    imageError.value = '画像は4MB以下にしてください。'
    target.value = ''
    return
  }

  selectedImage.value = file
  imageError.value = ''
}

function removeImage() {
  selectedImage.value = null
  imageError.value = ''

  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

watch(selectedImage, (file) => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }

  imagePreviewUrl.value = file ? URL.createObjectURL(file) : null
})

function createJudgeFormData(): FormData {
  const formData = new FormData()

  formData.append('input', input.value.trim())

  if (selectedImage.value) {
    formData.append('image', selectedImage.value)
  }

  return formData
}

const easterEggInputs = new Set(['粋', 'いき', 'iki'])

function isEasterEgg(input: string): boolean {
  return easterEggInputs.has(input.trim().toLowerCase())
}

function closeEasterEgg() {
  showEasterEgg.value = false
  input.value = ''
  result.value = null
}

const easterEggLines = [
  'Ha~ 意気地なしで恥ずかしがり屋な',
  'あなたをもう待ってられないの!!',
  '「キスをあげるよ」',
  '今さら「好き」なんて言葉より',
  'キキメあるでしょ?',
  'あなたにだけは そっと教えてあげる',
  '胸の奥 小さいつぼみの ぬくもり',
]

const activeLine = ref(0)

let easterEggTimer: ReturnType<typeof setTimeout> | undefined

function advanceEasterEgg() {
  if (!showEasterEgg.value) return

  if (activeLine.value < easterEggLines.length - 1) {
    activeLine.value++
    easterEggTimer = setTimeout(advanceEasterEgg, 1500)
  }
  else {
    easterEggTimer = setTimeout(closeEasterEgg, 1800)
  }
}

watch(showEasterEgg, (visible) => {
  clearTimeout(easterEggTimer)

  if (visible) {
    activeLine.value = 0
    easterEggTimer = setTimeout(advanceEasterEgg, 1500)
  }
})

onUnmounted(() => {
  clearTimeout(easterEggTimer)

  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
})

async function judge() {
  if ((!input.value.trim() && !selectedImage.value) || pending.value) return

  if (isEasterEgg(input.value)) {
    result.value = null
    showEasterEgg.value = true
    return
  }

  pending.value = true
  result.value = null
  errorMessage.value = ''

  try {
    result.value = await $fetch<IkiJudgment>('/api/judge', {
      method: 'POST',
      body: createJudgeFormData(),
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
    <div
      v-if="showEasterEgg"
      class="relative flex min-h-dvh items-center justify-center bg-[#302D2A]"
    >
      <UButton
        icon="i-lucide-x"
        label="閉じる"
        aria-label="特別画面を閉じる"
        color="neutral"
        variant="ghost"
        class="absolute top-4 right-4 text-[#EAE0C9] hover:bg-white/10"
        @click="closeEasterEgg"
      />
      <div
        class="relative h-80 w-full max-w-xl overflow-hidden px-6"
        style="mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);"
      >
        <motion.div
          class="absolute top-1/2 right-0 left-0 px-6"
          :animate="{ y: -(activeLine * 80 + 40) }"
          :transition="{
            duration: 0.65,
            ease: 'easeInOut',
          }"
        >
          <p
            v-for="(line, index) in easterEggLines"
            :key="index"
            class="flex h-20 items-center justify-center text-center font-serif text-xl transition-[opacity,transform,color] duration-500 sm:text-2xl"
            :class="index === activeLine
              ? 'scale-105 text-[#F5F0E6] opacity-100'
              : 'scale-95 text-[#B5AAA0] opacity-25'"
          >
            {{ line }}
          </p>
        </motion.div>
      </div>
    </div>
    <div
      v-else
      class="min-h-dvh bg-[#F5F0E6] text-[#24251F]"
    >
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

          <input
            ref="imageInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="onImageChange"
          >

          <div
            v-if="selectedImage && imagePreviewUrl"
            class="mt-3 rounded-lg bg-[#F8F5EF] p-2"
          >
            <div class="flex items-center gap-3">
              <img
                :src="imagePreviewUrl"
                alt="選択した画像のプレビュー"
                class="size-24 shrink-0 rounded-b-md object-cover"
              >

              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-medium text-[#24251F]">
                  {{ selectedImage.name }}
                </p>

                <p class="mt-1 text-xs text-[#8A8177]">
                  {{ (selectedImage.size / 1024 / 1024).toFixed(2) }} MB
                  ・
                  {{ selectedImage.type.replace('image/', '').toUpperCase() }}
                </p>

                <div class="mt-2 flex justify-end">
                  <UButton
                    label="削除"
                    icon="i-lucide-trash-2"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    class="text-[#655847] hover:bg-[#E5DED2] hover:text-[#24251F]"
                    @click="removeImage"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3">
            <UButton
              :label="selectedImage ? '画像を変更' : '画像を添える'"
              icon="i-lucide-image-plus"
              color="neutral"
              variant="ghost"
              size="sm"
              class="text-[#655847] hover:bg-[#F5F0E6] hover:text-[#24251F]"
              @click="selectImage"
            />

            <p
              v-if="imageError"
              role="alert"
              class="mt-2 text-xs text-[#A4493B]"
            >
              {{ imageError }}
            </p>
          </div>

          <div class="mt-4 flex justify-center sm:justify-end">
            <UButton
              label="いざ、見定めむ"
              icon="i-lucide-arrow-up-right"
              trailing
              size="sm"
              :disabled="(!input.trim() && !selectedImage) || pending"
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
