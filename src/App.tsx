import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  EMOTIONS,
  type EmotionId,
  type Entry,
  formatDay,
  formatTime,
  getEmotion,
  isSameDay,
  loadEntries,
  saveEntries,
} from './emotions'
import { exportEntriesPdf } from './exportPdf'
import {
  applyTheme,
  currentTimeHm,
  loadSettings,
  saveSettings,
  todayKey,
  type AppSettings,
  type Theme,
} from './settings'

type View = 'home' | 'checkin' | 'journal' | 'settings'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function weekDays(): Date[] {
  const days: Date[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setHours(12, 0, 0, 0)
    d.setDate(now.getDate() - i)
    days.push(d)
  }
  return days
}

function buildInsight(entries: Entry[]): string {
  if (entries.length === 0) {
    return 'Пока здесь тишина. Первая запись станет началом твоего эмоционального ландшафта.'
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = entries.filter((e) => new Date(e.createdAt).getTime() >= weekAgo)

  if (recent.length === 0) {
    return 'На этой неделе записей ещё нет — хороший момент вернуться к себе.'
  }

  const counts = new Map<EmotionId, number>()
  let intensitySum = 0
  for (const entry of recent) {
    counts.set(entry.emotionId, (counts.get(entry.emotionId) ?? 0) + 1)
    intensitySum += entry.intensity
  }

  let topId = recent[0].emotionId
  let topCount = 0
  for (const [id, count] of counts) {
    if (count > topCount) {
      topId = id
      topCount = count
    }
  }

  const emotion = getEmotion(topId)
  const avg = Math.round(intensitySum / recent.length)

  return `За последние дни чаще всего звучала «${emotion.label.toLowerCase()}» (${emotion.hint}). Средняя интенсивность — ${avg} из 10. Ты уже слушаешь себя — это важно.`
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16.5 3.5A8.5 8.5 0 1 0 20.5 14.2 7 7 0 0 1 16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function App() {
  const [view, setView] = useState<View>('home')
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries())
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [selected, setSelected] = useState<EmotionId | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    applyTheme(settings.theme)
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    saveEntries(entries)
  }, [entries])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!settings.reminderEnabled) return

    const tick = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      if (currentTimeHm() !== settings.reminderTime) return
      if (settings.lastReminderDate === todayKey()) return

      new Notification('Nuança', {
        body: 'Мягкий момент для себя: какой у тебя оттенок сейчас?',
        tag: 'nuanca-daily',
      })

      setSettings((prev) => ({ ...prev, lastReminderDate: todayKey() }))
    }

    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [settings.reminderEnabled, settings.reminderTime, settings.lastReminderDate])

  const todayCount = useMemo(
    () => entries.filter((e) => isSameDay(e.createdAt, new Date().toISOString())).length,
    [entries],
  )

  const insight = useMemo(() => buildInsight(entries), [entries])

  const heroEmotion = selected ? getEmotion(selected) : null
  const heroWash = heroEmotion
    ? `linear-gradient(120deg, ${heroEmotion.color}ee 0%, #4F7A6Abb 55%, #E07A4Aaa 100%)`
    : undefined

  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const entry of entries) {
      const key = new Date(entry.createdAt).toDateString()
      const list = map.get(key) ?? []
      list.push(entry)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [entries])

  const landscape = useMemo(() => {
    return weekDays().map((day) => {
      const dayEntries = entries.filter((e) => isSameDay(e.createdAt, day.toISOString()))
      if (dayEntries.length === 0) {
        return {
          label: day.toLocaleDateString('ru-RU', { weekday: 'short' }),
          height: 12,
          color: settings.theme === 'dark' ? '#3a342f' : '#e4ddd4',
          has: false,
        }
      }
      const last = dayEntries[0]
      const emotion = getEmotion(last.emotionId)
      const avg =
        dayEntries.reduce((sum, e) => sum + e.intensity, 0) / dayEntries.length
      return {
        label: day.toLocaleDateString('ru-RU', { weekday: 'short' }),
        height: 18 + avg * 10,
        color: emotion.color,
        has: true,
      }
    })
  }, [entries, settings.theme])

  function resetForm() {
    setSelected(null)
    setIntensity(5)
    setNote('')
  }

  function saveEntry() {
    if (!selected) return
    const entry: Entry = {
      id: crypto.randomUUID(),
      emotionId: selected,
      intensity,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    }
    setEntries((prev) => [entry, ...prev])
    resetForm()
    setToast('Сохранено. Твоя эмоция теперь часть ландшафта.')
    setView('journal')
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function setTheme(theme: Theme) {
    setSettings((prev) => ({ ...prev, theme }))
  }

  function toggleTheme() {
    setTheme(settings.theme === 'light' ? 'dark' : 'light')
  }

  async function enableReminder(enabled: boolean) {
    if (!enabled) {
      setSettings((prev) => ({ ...prev, reminderEnabled: false }))
      setToast('Напоминания выключены.')
      return
    }

    if (!('Notification' in window)) {
      setToast('Этот браузер не поддерживает уведомления.')
      return
    }

    let permission = Notification.permission
    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission !== 'granted') {
      setToast('Разреши уведомления в настройках браузера.')
      setSettings((prev) => ({ ...prev, reminderEnabled: false }))
      return
    }

    setSettings((prev) => ({ ...prev, reminderEnabled: true }))
    setToast(`Напомню в ${settings.reminderTime} — если вкладка открыта.`)
  }

  function handleExportPdf() {
    try {
      exportEntriesPdf(entries, insight)
      setToast('Открыто окно печати — сохрани как PDF.')
    } catch {
      setToast('Разреши всплывающие окна для экспорта.')
    }
  }

  return (
    <div className="app">
      <header className="nav">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-name">Nuança</span>
        </div>
        <div className="nav-right">
          <nav className="nav-tabs" aria-label="Разделы">
            <button
              className="nav-tab"
              aria-selected={view === 'home'}
              onClick={() => setView('home')}
            >
              Сегодня
            </button>
            <button
              className="nav-tab"
              aria-selected={view === 'checkin'}
              onClick={() => setView('checkin')}
            >
              Запись
            </button>
            <button
              className="nav-tab"
              aria-selected={view === 'journal'}
              onClick={() => setView('journal')}
            >
              Журнал
            </button>
            <button
              className="nav-tab"
              aria-selected={view === 'settings'}
              onClick={() => setView('settings')}
            >
              Ещё
            </button>
          </nav>
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={settings.theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
            title={settings.theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
          >
            {settings.theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </header>

      {view === 'home' && (
        <section className="hero" aria-label="Главный экран">
          <div className="hero-wash" style={heroWash ? { background: heroWash } : undefined} />
          <div className="hero-pattern" aria-hidden />
          <div className="hero-orb" aria-hidden />
          <div className="hero-content">
            <p className="hero-kicker">{greeting()}</p>
            <h1 className="hero-title">
              Nuança
              <br />
              <em>твой оттенок дня</em>
            </h1>
            <p className="hero-text">
              Мягкий дневник эмоций: отметь, что чувствуешь, и собери личный
              ландшафт настроения — без оценок, только внимание к себе.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => setView('checkin')}>
                Отметить эмоцию
              </button>
              <button className="btn btn-ghost" onClick={() => setView('journal')}>
                {todayCount > 0
                  ? `Сегодня: ${todayCount}`
                  : 'Открыть журнал'}
              </button>
            </div>
          </div>
        </section>
      )}

      {view === 'checkin' && (
        <section className="panel">
          <div className="panel-head">
            <h2>Какой сейчас оттенок?</h2>
            <p>
              Выбери эмоцию, силу ощущения и, если хочешь, добавь пару слов —
              как будто смешиваешь краску для сегодняшнего дня.
            </p>
          </div>

          <div className="checkin">
            <div className="emotion-grid" role="group" aria-label="Эмоции">
              {EMOTIONS.map((emotion) => (
                <button
                  key={emotion.id}
                  type="button"
                  className="emotion-chip"
                  style={
                    {
                      '--chip': emotion.color,
                      '--chip-soft': emotion.soft,
                    } as CSSProperties
                  }
                  aria-pressed={selected === emotion.id}
                  onClick={() => setSelected(emotion.id)}
                >
                  <span className="emotion-swatch" aria-hidden />
                  <span className="emotion-label">{emotion.label}</span>
                  <span className="emotion-hint">{emotion.hint}</span>
                </button>
              ))}
            </div>

            <div className="intensity">
              <div className="intensity-top">
                <span>Интенсивность</span>
                <span>{intensity}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                aria-label="Интенсивность эмоции"
              />
            </div>

            <div className="note-field">
              <label htmlFor="note">Что происходит вокруг или внутри?</label>
              <textarea
                id="note"
                placeholder="Необязательно… Например: разговор с подругой, тишина дома, усталость после дня."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={400}
              />
            </div>

            <div className="checkin-actions">
              <button
                className="btn btn-solid"
                disabled={!selected}
                onClick={saveEntry}
              >
                Сохранить оттенок
              </button>
              <button className="btn btn-soft" onClick={resetForm}>
                Сбросить
              </button>
              {toast && <span className="toast">{toast}</span>}
            </div>
          </div>
        </section>
      )}

      {view === 'journal' && (
        <section className="panel">
          <div className="panel-head">
            <h2>Журнал оттенков</h2>
            <p>Семь дней настроения и все записи — твоя личная палитра чувств.</p>
          </div>

          <div className="panel-actions">
            <button
              className="btn btn-solid"
              onClick={handleExportPdf}
              disabled={entries.length === 0}
            >
              Экспорт в PDF
            </button>
            <button className="btn btn-soft" onClick={() => setView('checkin')}>
              Новая запись
            </button>
          </div>

          <div className="landscape">
            <h3>Ландшафт недели</h3>
            <p>Высота столбика — средняя интенсивность, цвет — последняя эмоция дня.</p>
            <div className="bars" aria-hidden>
              {landscape.map((day) => (
                <div className="bar-col" key={day.label}>
                  <div
                    className={`bar${day.has ? ' has' : ''}`}
                    style={{ height: day.height, background: day.color }}
                  />
                  <span className="bar-label">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="empty">
              <strong>Пока пусто</strong>
              Сделай первую запись — и здесь появится история твоих оттенков.
              <div style={{ marginTop: '1.1rem' }}>
                <button className="btn btn-solid" onClick={() => setView('checkin')}>
                  Отметить эмоцию
                </button>
              </div>
            </div>
          ) : (
            <div className="timeline">
              {grouped.map(([dayKey, dayEntries]) => (
                <div className="day-group" key={dayKey}>
                  <p className="day-label">{formatDay(dayEntries[0].createdAt)}</p>
                  {dayEntries.map((entry, index) => {
                    const emotion = getEmotion(entry.emotionId)
                    return (
                      <article
                        className="entry"
                        key={entry.id}
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div
                          className="entry-dot"
                          style={{
                            background: `radial-gradient(circle at 35% 30%, ${emotion.soft}, ${emotion.color})`,
                          }}
                          aria-hidden
                        />
                        <div>
                          <p className="entry-title">{emotion.label}</p>
                          <p className="entry-meta">
                            {formatTime(entry.createdAt)} · сила {entry.intensity}/10 ·{' '}
                            {emotion.hint}
                          </p>
                          {entry.note && <p className="entry-note">{entry.note}</p>}
                        </div>
                        <button
                          className="entry-delete"
                          onClick={() => removeEntry(entry.id)}
                          aria-label="Удалить запись"
                        >
                          Удалить
                        </button>
                      </article>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          <aside className="insight">
            <h3>Мягкий взгляд</h3>
            <p>{insight}</p>
          </aside>

          {toast && (
            <p className="toast" style={{ marginTop: '1rem' }}>
              {toast}
            </p>
          )}
        </section>
      )}

      {view === 'settings' && (
        <section className="panel">
          <div className="panel-head">
            <h2>Ещё немного заботы</h2>
            <p>Тема, напоминания и экспорт — чтобы дневник жил в твоём ритме.</p>
          </div>

          <div className="settings-grid">
            <div className="settings-card">
              <h3>Тема</h3>
              <p>Светлая — как утро. Тёмная — как тихий вечер.</p>
              <div className="theme-switch" role="group" aria-label="Тема оформления">
                <button
                  type="button"
                  aria-pressed={settings.theme === 'light'}
                  onClick={() => setTheme('light')}
                >
                  Светлая
                </button>
                <button
                  type="button"
                  aria-pressed={settings.theme === 'dark'}
                  onClick={() => setTheme('dark')}
                >
                  Тёмная
                </button>
              </div>
            </div>

            <div className="settings-card">
              <h3>Напоминание</h3>
              <p>Мягкий сигнал вернуться к себе — работает, пока открыта вкладка.</p>
              <div className="settings-row">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={settings.reminderEnabled}
                    onChange={(e) => void enableReminder(e.target.checked)}
                  />
                  Ежедневное напоминание
                </label>
                <div className="settings-field">
                  <input
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        reminderTime: e.target.value || '20:00',
                      }))
                    }
                    aria-label="Время напоминания"
                  />
                </div>
              </div>
              <p className="settings-hint">
                Разреши уведомления браузера. Если вкладка закрыта — напоминание
                не придёт.
              </p>
            </div>

            <div className="settings-card">
              <h3>Экспорт</h3>
              <p>Сохрани журнал как PDF — для себя или чтобы распечатать.</p>
              <button
                className="btn btn-solid"
                onClick={handleExportPdf}
                disabled={entries.length === 0}
              >
                Экспорт в PDF
              </button>
            </div>
          </div>

          {toast && (
            <p className="toast" style={{ marginTop: '1rem' }}>
              {toast}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
