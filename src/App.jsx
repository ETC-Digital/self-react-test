import { useEffect, useRef, useState } from 'react'
import './App.css'

const PAGES = {
  home: {
    title: '最初のページ',
    protected: false,
  },
  next: {
    title: '次のページ',
    protected: true,
    warningTitle: '戻ると問題が起きる可能性があります',
    warning: '前の画面に戻ると、システムエラーが発生する可能性があります。現在の画面に留まってください。',
  },
}

function appPath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const path = window.location.pathname
  const relative = base && path.startsWith(base) ? path.slice(base.length) : path
  return relative.replace(/^\/+|\/+$/g, '')
}

function readPage() {
  return appPath() === 'next' ? 'next' : 'home'
}

function urlFor(pageId) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return pageId === 'next' ? `${base}/next` : `${base}/`
}

let guardSerial = 0

function pushGuard(pageId) {
  const url = urlFor(pageId)
  const state = { page: pageId, guard: true, n: ++guardSerial }
  window.history.pushState(state, '', `${url}?stay=${state.n}`)
  window.history.replaceState(state, '', url)
}

function holdPage(pageId) {
  pushGuard(pageId)
  pushGuard(pageId)
}

function App() {
  const [pageId, setPageId] = useState(readPage)
  const [open, setOpen] = useState(false)
  const pageRef = useRef(pageId)
  const restoringRef = useRef(false)
  const page = PAGES[pageId]

  pageRef.current = pageId

  useEffect(() => {
    const current = readPage()
    window.history.replaceState({ page: current }, '', urlFor(current))
    if (PAGES[current].protected) holdPage(current)
    setPageId(current)

    const onPopState = () => {
      if (restoringRef.current) {
        restoringRef.current = false
        return
      }

      const leaving = pageRef.current
      if (PAGES[leaving].protected) {
        const marker = window.history.state?.n
        setOpen(true)
        restoringRef.current = true
        window.history.go(1)
        window.setTimeout(() => {
          if (pageRef.current !== leaving) {
            restoringRef.current = false
            return
          }
          if (window.history.state?.n === marker) {
            restoringRef.current = true
            window.history.go(1)
          }
        }, 0)
        window.setTimeout(() => {
          if (pageRef.current === leaving && window.history.state?.n === marker) holdPage(leaving)
          restoringRef.current = false
        }, 60)
        return
      }

      const nextPage = window.history.state?.page
      setPageId(nextPage === 'next' ? 'next' : 'home')
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const openNext = () => {
    window.history.pushState({ page: 'next' }, '', urlFor('next'))
    holdPage('next')
    setPageId('next')
    setOpen(false)
  }

  return (
    <main className="page">
      <h1>{page.title}</h1>
      {pageId === 'home' && (
        <button type="button" onClick={openNext}>
          次のページへ
        </button>
      )}

      {open && (
        <div className="dialog-backdrop">
          <div className="dialog" role="dialog" aria-modal="true">
            <p>{PAGES.next.warning}</p>
            <button type="button" onClick={() => setOpen(false)} style={{backgroundColor:"black",color:"white",marginLeft:"300px"}}>
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
