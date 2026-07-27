export type Theme = 'light' | 'dark'

export interface AppSettings {
  theme: Theme
  reminderEnabled: boolean
  reminderTime: string
  lastReminderDate: string
}

export const SETTINGS_STORAGE_KEY = 'nuanca-settings'
export const REMINDER_CLAIM_KEY = 'nuanca-reminder-claim'

const DEFAULTS: AppSettings = {
  theme: 'light',
  reminderEnabled: false,
  reminderTime: '20:00',
  lastReminderDate: '',
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      reminderEnabled: Boolean(parsed.reminderEnabled),
      reminderTime:
        typeof parsed.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(parsed.reminderTime)
          ? parsed.reminderTime
          : DEFAULTS.reminderTime,
      lastReminderDate:
        typeof parsed.lastReminderDate === 'string' ? parsed.lastReminderDate : '',
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function currentTimeHm(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Атомарно (насколько позволяет localStorage) занять слот напоминания на сегодня. */
export function tryClaimReminderToday(): boolean {
  const today = todayKey()
  try {
    if (localStorage.getItem(REMINDER_CLAIM_KEY) === today) return false
    const fresh = loadSettings()
    if (fresh.lastReminderDate === today) {
      localStorage.setItem(REMINDER_CLAIM_KEY, today)
      return false
    }
    localStorage.setItem(REMINDER_CLAIM_KEY, today)
    saveSettings({ ...fresh, lastReminderDate: today })
    return true
  } catch {
    return false
  }
}
