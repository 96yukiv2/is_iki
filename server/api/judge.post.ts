import { GoogleGenAI } from '@google/genai'

const systemInstruction = `
あなたは「粋」を見極める鑑定士です。

このアプリにおける「粋」とは、
日常の何気ないことに、ほんのひと手間や気遣いを添えて、
少し豊かにすることです。

次の4つの観点から総合的に判定してください。
1. ひと手間：日常を少し豊かにする、意味のある小さな工夫があるか
2. さりげなさ：過剰な演出になっていないか
3. 美意識：彩り、盛り付け、所作、振る舞いなどに美しさや趣があるか
4. 心配り：自分や他人の好み・状況を尊重し、押し付けない気遣いがあるか

判定ルール：
- 4つすべてを満たす必要はありません。
- 単に何かを追加したことや、手間をかけたことだけを理由に「粋」としないでください。
- 好みに合うこと、美味しいこと、便利なこと、珍しいことだけでは「粋」としないでください。
- 工夫によって生まれる美しさ、趣、心地よさ、さりげない配慮などを評価してください。
- 相手の好みや選択肢を不必要に狭める行為は、心配りとして評価しないでください。
- 高価であることや豪華さだけを理由に「粋」としないでください。
- 入力されていない背景や意図を勝手に補わないでください。
- 判断材料が不足している場合は、好意的な背景を想像して「粋」としないでください。
- 「粋」か「粋じゃない」かを判定してください。
- 講評は短く、自然で、少し気の利いた日本語にしてください。
- 粋じゃない場合も、改善案は提案しないでください。
- commentは短い一言、reasonは判定理由を1〜2文で返してください。
`

type IkiJudgment = {
  isIki: boolean
  comment: string
  reason: string
}

function isIkiJudgement(value: unknown): value is IkiJudgment {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const result = value as Record<string, unknown>

  return (
    typeof result.isIki === 'boolean'
    && typeof result.comment === 'string'
    && typeof result.reason === 'string'
  )
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const input = body?.input

  if (
    typeof input !== 'string'
    || !input.trim()
    || input.length > 500
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Input must be non-empty string within 500 characters',
    })
  }

  const config = useRuntimeConfig(event)

  if (!config.geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Gemini API key is not configured',
    })
  }

  const ai = new GoogleGenAI({
    apiKey: config.geminiApiKey,
  })

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: input.trim(),
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema: {
        type: 'object',
        properties: {
          isIki: { type: 'boolean' },
          comment: { type: 'string' },
          reason: { type: 'string' },
        },
        required: ['isIki', 'comment', 'reason'],
        additionalProperties: false,
      },
    },
  })

  if (!response.text) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Empty response from Gemini',
    })
  }

  let result: unknown

  try {
    result = JSON.parse(response.text)
  }
  catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Invalid JSON from Gemini',
    })
  }

  if (!isIkiJudgement(result)) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Invalid judgment from Gemini',
    })
  }

  return result
})
