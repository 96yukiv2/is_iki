import { GoogleGenAI, type Part } from '@google/genai'

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
  const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

  const maxImageSize = 4 * 1024 * 1024

  let input = ''
  let image: { data: Buffer, mimeType: string } | null = null

  if (getHeader(event, 'content-type')?.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)

    const inputParts = parts?.filter(part => part.name === 'input') ?? []
    const imageParts = parts?.filter(part => part.name === 'image') ?? []

    if (inputParts.length !== 1 || imageParts.length > 1) {
      throw createError({
        statusCode: 400,
        statusMessage: '不正な入力形式です。',
      })
    }

    input = inputParts[0]!.data.toString('utf8').trim()

    const file = imageParts[0]

    if (file) {
      if (!file.filename || !file.type || !allowedImageTypes.has(file.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: '対応していない画像形式です。',
        })
      }

      if (file.data.length > maxImageSize) {
        throw createError({
          statusCode: 413,
          statusMessage: '画像は4MB以下にしてください。',
        })
      }

      image = {
        data: file.data,
        mimeType: file.type,
      }
    }
    else if (getHeader(event, 'content-type')?.includes('applicaton/json')) {
      const body = await readBody(event)

      if (!body || typeof body.input !== 'string') {
        throw createError({
          statusCode: 400,
          statusMessage: '不正な入力形式です。',
        })
      }
    }
    else {
      throw createError({
        statusCode: 415,
        statusMessage: '対応していない送信形式です。',
      })
    }

    if (input.length > 500 || (!input && !image)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'テキストまたは画像を入力してください。',
      })
    }
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

  const contents: Part[] = [
    {
      text: input || 'この画像から確認できる範囲で、「粋」かどうか判定してください。',
    },
  ]

  if (image) {
    contents.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data.toString('base64'),
      },
    })
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents,
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
