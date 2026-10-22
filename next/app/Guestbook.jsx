'use client'

import { useEffect, useState } from 'react'

const EMOJIS = ['🎉', '🙏', '💐', '👋', '❤️', '🥂']
const NAME_MAX = 40
const MESSAGE_MAX = 500
const EMPTY_FORM = { name: '', to: '', emoji: '', message: '' }

// 서버 오류 응답 {"error": "..."}에서 문장을 꺼냄
async function readError(response) {
  try {
    const body = await response.json()
    if (body?.error) return body.error
  } catch {
    // JSON이 아니면 아래 기본 문장을 씀
  }
  return `서버 오류가 났습니다. (${response.status})`
}

function formatTime(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Guestbook() {
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [listError, setListError] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let ignore = false
    fetch('/api/entries')
      .then(async (response) => {
        if (!response.ok) throw new Error(await readError(response))
        return response.json()
      })
      .then((body) => {
        if (!ignore) setEntries(body.entries)
      })
      .catch((error) => {
        if (!ignore) setListError(error.message || '목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [])

  const canSubmit = form.name.trim() !== '' && form.message.trim() !== '' && !saving

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    setSaveError('')
    try {
      const payload = { name: form.name.trim(), message: form.message.trim() }
      if (form.to.trim()) payload.to = form.to.trim()
      if (form.emoji) payload.emoji = form.emoji
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(await readError(response))
      const body = await response.json()
      setEntries((prev) => [body.entry, ...prev])
      setForm(EMPTY_FORM)
    } catch (error) {
      setSaveError(error.message || '저장하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <h1>송별·축하 방명록</h1>
        <p>고마운 마음, 축하하는 마음을 한마디씩 남겨 주세요.</p>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <div className="row">
          <label>
            <span>보내는 사람</span>
            <input
              value={form.name}
              maxLength={NAME_MAX}
              placeholder="이름"
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </label>
          <label>
            <span>
              받는 사람 <span className="optional">(선택)</span>
            </span>
            <input
              value={form.to}
              maxLength={NAME_MAX}
              placeholder="누구에게"
              onChange={(e) => update('to', e.target.value)}
            />
          </label>
        </div>

        <fieldset className="emojis">
          <legend>
            이모지 <span className="optional">(선택)</span>
          </legend>
          {EMOJIS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              className={form.emoji === emoji ? 'emoji selected' : 'emoji'}
              aria-pressed={form.emoji === emoji}
              onClick={() => update('emoji', form.emoji === emoji ? '' : emoji)}
            >
              {emoji}
            </button>
          ))}
        </fieldset>

        <label>
          <span>메시지</span>
          <textarea
            value={form.message}
            maxLength={MESSAGE_MAX}
            rows={4}
            placeholder="그동안 고마웠어요!"
            onChange={(e) => update('message', e.target.value)}
            required
          />
          <span className="counter">
            {form.message.length} / {MESSAGE_MAX}
          </span>
        </label>

        {saveError && (
          <p className="error" role="alert">
            {saveError}
          </p>
        )}

        <button type="submit" className="submit" disabled={!canSubmit}>
          {saving ? '남기는 중…' : '메시지 남기기'}
        </button>
      </form>

      <section className="list" aria-live="polite">
        {loading && <p className="status">불러오는 중…</p>}
        {listError && (
          <p className="error" role="alert">
            {listError}
          </p>
        )}
        {!loading && !listError && entries.length === 0 && (
          <p className="status">아직 남긴 메시지가 없어요. 첫 메시지를 남겨 주세요.</p>
        )}
        {entries.map((entry) => (
          <article className="card entry" key={entry.id}>
            <div className="entry-emoji" aria-hidden="true">
              {entry.emoji || '💌'}
            </div>
            <div className="entry-body">
              <p className="entry-meta">
                <strong>{entry.name}</strong>
                {entry.to && (
                  <>
                    {' → '}
                    <strong>{entry.to}</strong>
                  </>
                )}
              </p>
              <p className="entry-message">{entry.message}</p>
              <time dateTime={entry.created_at}>{formatTime(entry.created_at)}</time>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

