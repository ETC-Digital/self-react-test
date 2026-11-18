import { useEffect, useRef, useState } from 'react'
import './App.css'

const ITEMS = [
  { id: 'A-1001', name: '山田商事', status: '受付済み', updated: '2026-11-18 09:20' },
  { id: 'A-1002', name: '佐藤工業', status: '確認待ち', updated: '2026-11-18 10:05' },
  { id: 'A-1003', name: '鈴木物流', status: '発送準備中', updated: '2026-11-18 11:40' },
]

const PAGES = {
  home: {
    id: 'home',
    step: 'ステップ 1',
    title: '一覧へ進む',
    lead: 'ボタンを押して一覧ページを開きます。一覧または詳細でブラウザの戻るボタンを押すと、そのページに応じた注意が表示され、現在のページに留まります。',
    protected: false,
  },
  list: {
    id: 'list',
    step: 'ステップ 2 · 一覧',
    title: '案件一覧',
    lead: '案件を選ぶと詳細ページへ移動します。このページで戻ると、一覧に関する注意が表示されます。',
    protected: true,
    warningTitle: '一覧から戻ると問題が起きる可能性があります',
    warning: '一覧ページから戻ると、表示中の案件が正しく読み込まれない可能性があります。このページに留まります。',
  },
  detail: {
    id: 'detail',
    step: 'ステップ 3 · 詳細',
    title: '案件詳細',
    lead: '選択した案件の内容です。このページで戻ると、詳細に関する注意が表示されます。',
    protected: true,
    warningTitle: '詳細から戻ると問題が起きる可能性があります',
    warning: '詳細ページから戻ると、選択した案件の状態が正しく表示されない可能性があります。このページに留まります。',
  },
}

function appPath() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const path = window.location.pathname
  const relative = base && path.startsWith(base) ? path.slice(base.length) : path
  const hash = window.location.hash.replace(/^#\/?/, '')
  return (hash || relative).replace(/^\/+|\/+$/g, '')
}

function readLocation() {
  const [id, itemId] = appPath().split('/')
  if (id === 'detail') {
    const item = ITEMS.find((entry) => entry.id === itemId)
    if (item) return { pageId: 'detail', itemId: item.id }
  }
  if (id === 'list') return { pageId: 'list', itemId: null }
  return { pageId: 'home', itemId: null }
}

function urlFor(pageId, itemId) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  if (pageId === 'list') return `${base}/list`
  if (pageId === 'detail') return `${base}/detail/${itemId}`
  return `${base}/`
}

let guardSerial = 0

function pushGuard(pageId, itemId) {
  const url = urlFor(pageId, itemId)
  const state = { page: pageId, itemId, guard: true, n: ++guardSerial }
  const marked = `${url}${url.includes('?') ? '&' : '?'}stay=${state.n}`
  window.history.pushState(state, '', marked)
  window.history.replaceState(state, '', url)
}

function holdPage(pageId, itemId) {
  pushGuard(pageId, itemId)
  pushGuard(pageId, itemId)
}

function App() {
  const initial = readLocation()
  const [pageId, setPageId] = useState(initial.pageId)
  const [itemId, setItemId] = useState(initial.itemId)
  const [dialog, setDialog] = useState(null)
  const locationRef = useRef({ pageId, itemId })
  const restoringRef = useRef(false)
  const stayButtonRef = useRef(null)
  const page = PAGES[pageId]
  const item = ITEMS.find((entry) => entry.id === itemId) ?? null

  locationRef.current = { pageId, itemId }

  useEffect(() => {
    const current = readLocation()
    window.history.replaceState(
      { page: current.pageId, itemId: current.itemId },
      '',
      urlFor(current.pageId, current.itemId),
    )
    if (PAGES[current.pageId].protected) holdPage(current.pageId, current.itemId)
    setPageId(current.pageId)
    setItemId(current.itemId)

    const onPopState = () => {
      if (restoringRef.current) {
        restoringRef.current = false
        return
      }

      const leaving = locationRef.current
      const leavingPage = PAGES[leaving.pageId]
      if (leavingPage?.protected) {
        const snapshot = { pageId: leaving.pageId, itemId: leaving.itemId }
        const marker = window.history.state?.n
        setDialog(leavingPage)
        restoringRef.current = true
        window.history.go(1)
        window.setTimeout(() => {
          if (locationRef.current.pageId !== snapshot.pageId) {
            restoringRef.current = false
            return
          }
          if (window.history.state?.n === marker) {
            restoringRef.current = true
            window.history.go(1)
          }
        }, 0)
        window.setTimeout(() => {
          if (locationRef.current.pageId !== snapshot.pageId) {
            restoringRef.current = false
            return
          }
          if (window.history.state?.n === marker) holdPage(snapshot.pageId, snapshot.itemId)
          restoringRef.current = false
        }, 60)
        return
      }

      const nextPage = window.history.state?.page
      const nextItem = window.history.state?.itemId ?? null
      if (PAGES[nextPage]) {
        setPageId(nextPage)
        setItemId(nextItem)
        return
      }
      const fallback = readLocation()
      setPageId(fallback.pageId)
      setItemId(fallback.itemId)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!dialog) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    stayButtonRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDialog(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [dialog])

  const openPage = (nextPageId, nextItemId = null) => {
    window.history.pushState(
      { page: nextPageId, itemId: nextItemId },
      '',
      urlFor(nextPageId, nextItemId),
    )
    if (PAGES[nextPageId].protected) holdPage(nextPageId, nextItemId)
    setPageId(nextPageId)
    setItemId(nextItemId)
    setDialog(null)
  }

  return (
    <div className="page">
      <header className="topbar">
        <span className="brand">{page.step}</span>
        <span className="layout-tag layout-tag--pc">パソコン表示</span>
        <span className="layout-tag layout-tag--mobile">スマホ表示</span>
      </header>

      <main className="content">
        <section className="intro">
          <p className="eyebrow">{page.protected ? '戻る操作を保護しています' : 'このページは通常どおり戻れます'}</p>
          <h1>{page.title}</h1>
          <p className="lead">{page.lead}</p>

          {pageId === 'list' && (
            <ul className="item-list">
              {ITEMS.map((entry) => (
                <li key={entry.id}>
                  <button type="button" onClick={() => openPage('detail', entry.id)}>
                    <span>
                      <strong>{entry.name}</strong>
                      <span className="item-meta">受付番号 {entry.id}</span>
                    </span>
                    <span className="item-status">{entry.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {pageId === 'detail' && item && (
            <dl className="detail-list">
              <div>
                <dt>受付番号</dt>
                <dd>{item.id}</dd>
              </div>
              <div>
                <dt>取引先</dt>
                <dd>{item.name}</dd>
              </div>
              <div>
                <dt>状態</dt>
                <dd>{item.status}</dd>
              </div>
              <div>
                <dt>更新日時</dt>
                <dd>{item.updated}</dd>
              </div>
            </dl>
          )}

          {pageId === 'home' && (
            <div className="actions">
              <button type="button" className="next" onClick={() => openPage('list')}>
                一覧を見る
              </button>
            </div>
          )}
        </section>

        <aside className="status-card">
          <h2>このページで戻るとき</h2>
          {page.protected ? (
            <p>{page.warning}</p>
          ) : (
            <p>最初のページでは戻る操作を止めません。一覧を開いてから、ブラウザの戻るボタンを試してください。</p>
          )}
        </aside>
      </main>

      {dialog && (
        <div className="guard" role="presentation">
          <div
            className="guard__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="guard-title"
            aria-describedby="guard-desc"
          >
            <p className="guard__mark" aria-hidden="true">!</p>
            <h2 id="guard-title">{dialog.warningTitle}</h2>
            <p id="guard-desc">{dialog.warning}</p>
            <button
              ref={stayButtonRef}
              type="button"
              className="guard__stay"
              onClick={() => setDialog(null)}
            >
              このページに留まる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
