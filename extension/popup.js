// 배포된 방명록 주소 (manifest.json의 host_permissions와 같아야 함)
const BASE_URL = 'https://guestbook-r189.vercel.app'
const EMOJIS = ['🎉', '🙏', '💐', '👋', '❤️', '🥂']

const $ = (id) => document.getElementById(id)
const form = $('form')
const nameInput = $('name')
const toInput = $('to')
const messageInput = $('message')
const submitButton = $('submit')
const saveError = $('save-error')
const list = $('list')
let selectedEmoji = ''
let saving = false

$('open-site').href = BASE_URL

// 서버 오류 응답 {"error": "..."}에서 문장을 꺼냄
async function readError(response) {
  try {
    const body = await response.json()
    if (body && body.error) return body.error
  } catch {
    // JSON이 아니면 기본 문장
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

function updateSubmit() {
  submitButton.disabled = saving || !nameInput.value.trim() || !messageInput.value.trim()
  submitButton.textContent = saving ? '남기는 중…' : '메시지 남기기'
  $('counter').textContent = `${messageInput.value.length} / 500`
}

function showStatus(text, isError = false) {
  list.replaceChildren()
  const p = document.createElement('p')
  p.className = isError ? 'error' : 'status'
  p.textContent = text
  list.append(p)
}

// 사용자 글은 textContent로만 넣음 (HTML로 해석하지 않음)
function renderEntry(entry) {
  const card = document.createElement('article')
  card.className = 'card entry'

  const emoji = document.createElement('div')
  emoji.className = 'entry-emoji'
  emoji.textContent = entry.emoji || '💌'

  const body = document.createElement('div')
  body.className = 'entry-body'

  const meta = document.createElement('p')
  meta.className = 'entry-meta'
  const from = document.createElement('strong')
  from.textContent = entry.name
  meta.append(from)
  if (entry.to) {
    const to = document.createElement('strong')
    to.textContent = entry.to
    meta.append(' → ', to)
  }

  const message = document.createElement('p')
  message.className = 'entry-message'
  message.textContent = entry.message

  const time = document.createElement('time')
  time.dateTime = entry.created_at
  time.textContent = formatTime(entry.created_at)

  body.append(meta, message, time)
  card.append(emoji, body)
  return card
}

function renderList(entries) {
  if (entries.length === 0) {
    showStatus('아직 남긴 메시지가 없어요. 첫 메시지를 남겨 주세요.')
    return
  }
  list.replaceChildren(...entries.map(renderEntry))
}

async function loadEntries() {
  try {
    const response = await fetch(`${BASE_URL}/api/entries`)
    if (!response.ok) throw new Error(await readError(response))
    renderList((await response.json()).entries)
  } catch (error) {
    showStatus(error.message || '목록을 불러오지 못했습니다.', true)
  }
}

// 이모지 버튼 (다시 누르면 선택 해제)
for (const emoji of EMOJIS) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'emoji'
  button.textContent = emoji
  button.setAttribute('aria-pressed', 'false')
  button.addEventListener('click', () => {
    selectedEmoji = selectedEmoji === emoji ? '' : emoji
    for (const b of $('emojis').children) {
      const on = b.textContent === selectedEmoji
      b.classList.toggle('selected', on)
      b.setAttribute('aria-pressed', String(on))
    }
  })
  $('emojis').append(button)
}

for (const input of [nameInput, toInput, messageInput]) {
  input.addEventListener('input', updateSubmit)
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  if (submitButton.disabled) return
  saving = true
  saveError.hidden = true
  updateSubmit()
  try {
    const payload = { name: nameInput.value.trim(), message: messageInput.value.trim() }
    if (toInput.value.trim()) payload.to = toInput.value.trim()
    if (selectedEmoji) payload.emoji = selectedEmoji
    const response = await fetch(`${BASE_URL}/api/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(await readError(response))
    form.reset()
    selectedEmoji = ''
    for (const b of $('emojis').children) {
      b.classList.remove('selected')
      b.setAttribute('aria-pressed', 'false')
    }
    await loadEntries()
  } catch (error) {
    saveError.textContent = error.message || '저장하지 못했습니다. 다시 시도해 주세요.'
    saveError.hidden = false
  } finally {
    saving = false
    updateSubmit()
  }
})

updateSubmit()
loadEntries()
