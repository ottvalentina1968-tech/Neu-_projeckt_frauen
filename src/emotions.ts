export type EmotionId =
  | 'joy'
  | 'calm'
  | 'tenderness'
  | 'sadness'
  | 'anxiety'
  | 'anger'
  | 'fatigue'
  | 'inspiration'
  | 'loneliness'
  | 'gratitude'

export interface Emotion {
  id: EmotionId
  label: string
  hint: string
  color: string
  soft: string
}

export interface Entry {
  id: string
  emotionId: EmotionId
  intensity: number
  note: string
  createdAt: string
}

export type EntriesLoadResult =
  | { status: 'ok'; entries: Entry[] }
  | { status: 'corrupt'; entries: Entry[] }

export const EMOTIONS: Emotion[] = [
  {
    id: 'joy',
    label: 'Радость',
    hint: 'свет внутри',
    color: '#E07A4A',
    soft: '#F6D5C4',
  },
  {
    id: 'calm',
    label: 'Спокойствие',
    hint: 'ровное дыхание',
    color: '#4F7A6A',
    soft: '#D5E5DE',
  },
  {
    id: 'tenderness',
    label: 'Нежность',
    hint: 'мягкость к себе',
    color: '#C47A8A',
    soft: '#F0D8DE',
  },
  {
    id: 'sadness',
    label: 'Грусть',
    hint: 'тихая вода',
    color: '#6A7F95',
    soft: '#D8E0E8',
  },
  {
    id: 'anxiety',
    label: 'Тревога',
    hint: 'шум в груди',
    color: '#C4924A',
    soft: '#F0E2C8',
  },
  {
    id: 'anger',
    label: 'Злость',
    hint: 'жар и границы',
    color: '#A84B4B',
    soft: '#EED0D0',
  },
  {
    id: 'fatigue',
    label: 'Усталость',
    hint: 'нужен отдых',
    color: '#7A7168',
    soft: '#E4DFD8',
  },
  {
    id: 'inspiration',
    label: 'Вдохновение',
    hint: 'крылья идей',
    color: '#D45F6A',
    soft: '#F5D0D4',
  },
  {
    id: 'loneliness',
    label: 'Одиночество',
    hint: 'пустое пространство',
    color: '#5A7A82',
    soft: '#D4E2E5',
  },
  {
    id: 'gratitude',
    label: 'Благодарность',
    hint: 'тёплое «спасибо»',
    color: '#6B8F4E',
    soft: '#DCE8D0',
  },
]

const EMOTION_IDS = new Set<string>(EMOTIONS.map((e) => e.id))

export const ENTRIES_STORAGE_KEY = 'nuanca-entries'

export function getEmotion(id: EmotionId): Emotion {
  return EMOTIONS.find((e) => e.id === id) ?? EMOTIONS[0]
}

function isEntry(value: unknown): value is Entry {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Entry>
  return (
    typeof item.id === 'string' &&
    typeof item.emotionId === 'string' &&
    EMOTION_IDS.has(item.emotionId) &&
    typeof item.intensity === 'number' &&
    item.intensity >= 1 &&
    item.intensity <= 10 &&
    typeof item.note === 'string' &&
    typeof item.createdAt === 'string' &&
    !Number.isNaN(Date.parse(item.createdAt))
  )
}

export function loadEntries(): EntriesLoadResult {
  try {
    const raw = localStorage.getItem(ENTRIES_STORAGE_KEY)
    if (!raw) return { status: 'ok', entries: [] }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return { status: 'corrupt', entries: [] }

    const entries = parsed.filter(isEntry)
    // Полностью битый массив (не пустой, но без валидных записей) — не перезаписываем.
    if (parsed.length > 0 && entries.length === 0) {
      return { status: 'corrupt', entries: [] }
    }

    return { status: 'ok', entries }
  } catch {
    return { status: 'corrupt', entries: [] }
  }
}

export function saveEntries(entries: Entry[]): void {
  localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries))
}

export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function isSameDay(a: string, b: string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}
