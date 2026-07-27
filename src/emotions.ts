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

export function getEmotion(id: EmotionId): Emotion {
  return EMOTIONS.find((e) => e.id === id) ?? EMOTIONS[0]
}

const STORAGE_KEY = 'nuanca-entries'

export function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Entry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveEntries(entries: Entry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
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
