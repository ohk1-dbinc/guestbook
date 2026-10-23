'use client'

import { useEffect, useState } from 'react'

// "나중에"를 누르면 이 기간 동안 다시 묻지 않음
const DISMISS_KEY = 'install-prompt-dismissed-at'
const DISMISS_DAYS = 7

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0)
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

function rememberDismiss() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    // 저장이 막혀 있으면 이번 방문에서만 닫음
  }
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

// 처음 들어오면 "앱으로 설치할까요?" 창을 띄움
// - 크롬·엣지·안드로이드: "예"를 누르면 브라우저 설치 창을 바로 엶
// - 아이폰 Safari: 웹이 설치를 시작할 수 없어 "공유 → 홈 화면에 추가" 안내
export default function InstallPrompt() {
  const [mode, setMode] = useState(null) // null | 'native' | 'ios'
  const [deferred, setDeferred] = useState(null)

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return

    function onBeforeInstall(event) {
      // 브라우저 기본 안내 대신 우리 창을 띄움
      event.preventDefault()
      setDeferred(event)
      setMode('native')
    }
    function onInstalled() {
      setMode(null)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    if (isIos()) setMode('ios')
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!mode) return null

  function close() {
    rememberDismiss()
    setMode(null)
  }

  async function install() {
    if (!deferred) return
    deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    if (outcome !== 'accepted') rememberDismiss()
    setMode(null)
  }

  return (
    <div className="install-backdrop" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <div className="install-dialog">
        <img src="/icon-192.png" alt="" width="64" height="64" />
        <h2 id="install-title">방명록을 앱으로 설치할까요?</h2>
        {mode === 'native' ? (
          <>
            <p>홈 화면에서 바로 열고, 새 메시지 알림도 받을 수 있어요.</p>
            <div className="install-actions">
              <button type="button" className="install-later" onClick={close}>
                나중에
              </button>
              <button type="button" className="install-yes" onClick={install}>
                예, 설치할게요
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              Safari 아래쪽의 <strong>공유</strong> 버튼(□↑)을 누르고 <strong>홈 화면에 추가</strong>를 고르세요.
            </p>
            <div className="install-actions">
              <button type="button" className="install-yes" onClick={close}>
                확인
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
