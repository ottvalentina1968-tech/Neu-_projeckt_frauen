import { type Entry, formatDay, formatTime, getEmotion } from './emotions'

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function exportEntriesPdf(entries: Entry[], insight: string): void {
  const generatedAt = new Date().toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const groups = new Map<string, Entry[]>()
  for (const entry of entries) {
    const key = new Date(entry.createdAt).toDateString()
    const list = groups.get(key) ?? []
    list.push(entry)
    groups.set(key, list)
  }

  const body =
    entries.length === 0
      ? '<p class="empty">Пока нет записей.</p>'
      : [...groups.entries()]
          .map(([_, dayEntries]) => {
            const dayTitle = formatDay(dayEntries[0].createdAt)
            const items = dayEntries
              .map((entry) => {
                const emotion = getEmotion(entry.emotionId)
                const note = entry.note
                  ? `<p class="note">${escapeHtml(entry.note)}</p>`
                  : ''
                return `
                  <article class="entry">
                    <div class="swatch" style="background:${emotion.color}"></div>
                    <div>
                      <h3>${escapeHtml(emotion.label)}</h3>
                      <p class="meta">${formatTime(entry.createdAt)} · сила ${entry.intensity}/10 · ${escapeHtml(emotion.hint)}</p>
                      ${note}
                    </div>
                  </article>
                `
              })
              .join('')
            return `<section><h2>${escapeHtml(dayTitle)}</h2>${items}</section>`
          })
          .join('')

  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Nuança — журнал эмоций</title>
  <style>
    @page { margin: 18mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #2c2420;
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.45;
      background: #fff;
    }
    .wrap { max-width: 720px; margin: 0 auto; }
    header {
      border-bottom: 1px solid #d8cfc4;
      padding-bottom: 16px;
      margin-bottom: 22px;
    }
    .brand {
      font-size: 28px;
      letter-spacing: 0.02em;
      margin: 0;
    }
    .sub {
      margin: 6px 0 0;
      color: #6b625a;
      font-family: system-ui, sans-serif;
      font-size: 13px;
    }
    h2 {
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8a8078;
      margin: 22px 0 10px;
      font-family: system-ui, sans-serif;
      font-weight: 600;
    }
    .entry {
      display: grid;
      grid-template-columns: 14px 1fr;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #eee6dc;
      break-inside: avoid;
    }
    .swatch {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      margin-top: 4px;
    }
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      font-family: system-ui, sans-serif;
    }
    .meta {
      margin: 3px 0 0;
      color: #7a7168;
      font-size: 12px;
      font-family: system-ui, sans-serif;
    }
    .note {
      margin: 6px 0 0;
      font-size: 14px;
    }
    .insight {
      margin-top: 28px;
      padding: 14px 16px;
      background: #f7f1ea;
      border-radius: 10px;
      break-inside: avoid;
    }
    .insight h2 {
      margin-top: 0;
      color: #8b4557;
    }
    .insight p {
      margin: 0;
      font-size: 14px;
    }
    .empty {
      color: #7a7168;
      font-family: system-ui, sans-serif;
    }
    @media print {
      .hint { display: none !important; }
    }
    .hint {
      margin-top: 18px;
      font-family: system-ui, sans-serif;
      font-size: 12px;
      color: #8a8078;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <p class="brand">Nuança</p>
      <p class="sub">Журнал эмоциональных оттенков · ${escapeHtml(generatedAt)}</p>
    </header>
    ${body}
    <aside class="insight">
      <h2>Мягкий взгляд</h2>
      <p>${escapeHtml(insight)}</p>
    </aside>
    <p class="hint">Чтобы сохранить файл: в диалоге печати выбери «Сохранить как PDF».</p>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 250);
    };
  </script>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=820,height=900')
  if (!printWindow) {
    throw new Error('popup-blocked')
  }
  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
}
