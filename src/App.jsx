import { useEffect, useRef, useState } from 'react'
import './App.css'

const GUARD_STATE = { backGuard: true }

function App() {
  const [open, setOpen] = useState(false)
  const stayButtonRef = useRef(null)

  useEffect(() => {
    if (!window.history.state?.backGuard) {
      window.history.pushState(GUARD_STATE, '')
    }

    const onPopState = () => {
      window.history.pushState(GUARD_STATE, '')
      setOpen(true)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    stayButtonRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="page">
      <header className="topbar">
        <span className="brand">当前页面</span>
        <span className="layout-tag layout-tag--pc">电脑布局</span>
        <span className="layout-tag layout-tag--mobile">手机布局</span>
      </header>

      <main className="content">
        <section className="intro">
          <p className="eyebrow">返回保护已开启</p>
          <h1>停留在这一页</h1>
          <p className="lead">
            点击浏览器的返回按钮，或在手机上从屏幕边缘向右滑返回。页面会弹出提示，并继续留在这里。
          </p>
        </section>

        <aside className="status-card">
          <h2>怎么试</h2>
          <ol>
            <li>先打开本页面，不要刷新。</li>
            <li>点击浏览器左上角的返回按钮。</li>
            <li>看到提示后点「留在当前页」，地址不会离开。</li>
          </ol>
        </aside>
      </main>

      {open && (
        <div className="guard" role="presentation">
          <div
            className="guard__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guard-title"
            aria-describedby="guard-desc"
          >
            <p className="guard__mark" aria-hidden="true">!</p>
            <h2 id="guard-title">返回可能会出错</h2>
            <p id="guard-desc">
              现在返回上一页可能会导致当前操作出错，已为你停留在当前页面。
            </p>
            <button
              ref={stayButtonRef}
              type="button"
              className="guard__stay"
              onClick={() => setOpen(false)}
            >
              留在当前页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
