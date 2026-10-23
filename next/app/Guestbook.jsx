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

// VAPID 공개 키(base64url) → applicationServerKey용 바이트
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

// 서비스 워커 등록과 알림 구독 상태 관리
// status: 'loading' | 'unsupported' | 'denied' | 'off' | 'on'
function usePush() {
  const [status, setStatus] = useState('loading')
  const [busy, setBusy] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => {
        setSubscription(existing)
        if (existing) setStatus('on')
        else setStatus(Notification.permission === 'denied' ? 'denied' : 'off')
      })
      .catch(() => setStatus('unsupported'))
  }, [])

  async function send(method, sub) {
    const response = await fetch('/api/push', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    })
    if (!response.ok) throw new Error(await readError(response))
  }

  async function enable() {
    setBusy(true)
    setError('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'off')
        return
      }
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      })
      await send('POST', sub)
      setSubscription(sub)
      setStatus('on')
    } catch (e) {
      setError(e.message || '알림을 켜지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    if (!subscription) return
    setBusy(true)
    setError('')
    try {
      await send('DELETE', subscription)
      await subscription.unsubscribe()
      setSubscription(null)
      setStatus('off')
    } catch (e) {
      setError(e.message || '알림을 끄지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return { status, busy, error, endpoint: subscription?.endpoint, enable, disable }
}

function PushToggle({ push }) {
  if (push.status === 'loading' || push.status === 'unsupported') return null
  return (
    <div className="push">
      {push.status === 'denied' ? (
        <p className="push-note">알림이 차단되어 있어요. 브라우저 주소창의 사이트 설정에서 알림을 허용해 주세요.</p>
      ) : (
        <button
          type="button"
          className={push.status === 'on' ? 'push-button on' : 'push-button'}
          onClick={push.status === 'on' ? push.disable : push.enable}
          disabled={push.busy}
        >
          {push.busy ? '처리 중…' : push.status === 'on' ? '🔕 알림 끄기' : '🔔 새 메시지 알림 받기'}
        </button>
      )}
      {push.error && (
        <p className="error" role="alert">
          {push.error}
        </p>
      )}
    </div>
  )
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
  const push = usePush()

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
      const headers = { 'Content-Type': 'application/json' }
      // 내 기기에는 내 메시지 알림을 보내지 않도록 구독 주소를 알려 줌
      if (push.endpoint) headers['X-Push-Endpoint'] = push.endpoint
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers,
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
        <PushToggle push={push} />
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

