import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Portfolio from './Portfolio'
import { INDEX_BASE } from './mediaIndexClient'

// --- fixtures matching the pagination contract in tools/media-index/README.md

const item = (sku, serviceType, date, city, extra = {}) => ({
  sku,
  serviceType,
  mediaType: 'photo',
  date,
  city,
  facts: `${sku} facts`,
  portfolioUrl: null,
  storageKey: `CleanfixMedia/${sku}/${sku}-PHOTO-${date}.jpg`,
  mediaUrl: `https://media.example/${sku}-${date}.jpg`,
  ...extra,
})

const routes = {
  'latest.json': {
    version: 'v1',
    generatedAt: '2026-08-31T00:00:00Z',
    pageSize: 2,
    feeds: {
      all: { firstPage: 'v1/all/first.json', count: 3 },
      byServiceType: {
        Electrical: { firstPage: 'v1/electrical/first.json', count: 2 },
        Plumbing: { firstPage: 'v1/plumbing/first.json', count: 1 },
      },
      byCity: {
        'Ann Arbor': { firstPage: 'v1/city/ann-arbor/first.json', count: 2 },
        Ypsilanti: { firstPage: 'v1/city/ypsilanti/first.json', count: 1 },
      },
    },
  },
  'v1/all/first.json': {
    items: [
      item('OUTLET-REPLACE', 'Electrical', '2026-08-25', 'Ann Arbor'),
      item('SWITCH-REPLACE', 'Electrical', '2026-08-20', 'Ypsilanti'),
    ],
    nextCursor: 'v1/all/after-x.json',
    hasMore: true,
  },
  'v1/all/after-x.json': {
    items: [item('TOILET-TANK-REPAIR', 'Plumbing', '2026-08-10', 'Ann Arbor', { mediaType: 'video' })],
    nextCursor: null,
    hasMore: false,
  },
  'v1/electrical/first.json': {
    items: [
      item('OUTLET-REPLACE', 'Electrical', '2026-08-25', 'Ann Arbor'),
      item('SWITCH-REPLACE', 'Electrical', '2026-08-20', 'Ypsilanti'),
    ],
    nextCursor: null,
    hasMore: false,
  },
  'v1/city/ann-arbor/first.json': {
    items: [
      item('OUTLET-REPLACE', 'Electrical', '2026-08-25', 'Ann Arbor'),
      item('TOILET-TANK-REPAIR', 'Plumbing', '2026-08-10', 'Ann Arbor', { mediaType: 'video' }),
    ],
    nextCursor: null,
    hasMore: false,
  },
}

// --- IntersectionObserver mock with manual triggering

let observers
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
    this.elements = new Set()
    observers.push(this)
  }
  observe(el) { this.elements.add(el) }
  unobserve(el) { this.elements.delete(el) }
  disconnect() { this.elements.clear() }
}

const intersect = predicate => {
  observers.forEach(observer => {
    observer.elements.forEach(el => {
      if (predicate(el)) observer.callback([{ isIntersecting: true, target: el }], observer)
    })
  })
}

beforeEach(() => {
  observers = []
  window.IntersectionObserver = MockIntersectionObserver
  window.scrollTo = jest.fn()
  global.fetch = jest.fn(url => {
    const path = String(url).replace(`${INDEX_BASE}/`, '')
    const body = routes[path]
    return Promise.resolve(
      body
        ? { ok: true, json: () => Promise.resolve(body) }
        : { ok: false, status: 404 }
    )
  })
})

const renderPage = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter><Portfolio /></MemoryRouter>
    </QueryClientProvider>
  )
}

const tile = name => screen.getByRole('button', { name })

test('renders first page of the all feed with chips from the manifest', async () => {
  renderPage()
  await waitFor(() => expect(tile('Electrical job in Ann Arbor, 2026-08-25')).toBeInTheDocument())
  expect(tile('Electrical job in Ypsilanti, 2026-08-20')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Electrical' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Plumbing' })).toBeInTheDocument()
  // page 2 not fetched yet — sentinel has not intersected
  expect(screen.queryByRole('button', { name: /2026-08-10/ })).not.toBeInTheDocument()
})

test('sentinel intersection loads the next page until hasMore is false', async () => {
  renderPage()
  await waitFor(() => expect(tile('Electrical job in Ann Arbor, 2026-08-25')).toBeInTheDocument())

  intersect(el => el.className.includes('scroll-sentinel'))
  await waitFor(() =>
    expect(tile('Plumbing job in Ann Arbor, 2026-08-10 (video)')).toBeInTheDocument()
  )

  // chain is exhausted: another intersection must not fetch again
  const calls = global.fetch.mock.calls.length
  intersect(el => el.className.includes('scroll-sentinel'))
  expect(global.fetch.mock.calls.length).toBe(calls)
})

test('serviceType chip switches to that feed', async () => {
  renderPage()
  await waitFor(() => expect(tile('Electrical job in Ann Arbor, 2026-08-25')).toBeInTheDocument())

  await userEvent.click(screen.getByRole('button', { name: 'Electrical' }))
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(
      `${INDEX_BASE}/v1/electrical/first.json`,
      expect.anything()
    )
  )
  expect(await screen.findByRole('button', { name: 'Electrical job in Ann Arbor, 2026-08-25' })).toBeInTheDocument()
})

test('city dropdown switches to that city feed', async () => {
  renderPage()
  await waitFor(() => expect(tile('Electrical job in Ann Arbor, 2026-08-25')).toBeInTheDocument())

  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter by city' }), 'Ann Arbor')
  await waitFor(() =>
    expect(global.fetch).toHaveBeenCalledWith(
      `${INDEX_BASE}/v1/city/ann-arbor/first.json`,
      expect.anything()
    )
  )
  expect(await screen.findByRole('button', { name: 'Plumbing job in Ann Arbor, 2026-08-10 (video)' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Ypsilanti/ })).not.toBeInTheDocument()
})

test('text search filters loaded items and pulls remaining pages eagerly', async () => {
  renderPage()
  await waitFor(() => expect(tile('Electrical job in Ann Arbor, 2026-08-25')).toBeInTheDocument())

  // 'toilet' only matches the item on the not-yet-loaded second page
  await userEvent.type(screen.getByRole('searchbox', { name: 'Search jobs' }), 'toilet')
  expect(await screen.findByRole('button', { name: 'Plumbing job in Ann Arbor, 2026-08-10 (video)' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Electrical job/ })).not.toBeInTheDocument()

  await userEvent.clear(screen.getByRole('searchbox', { name: 'Search jobs' }))
  expect(await screen.findByRole('button', { name: 'Electrical job in Ann Arbor, 2026-08-25' })).toBeInTheDocument()
})

test('manifest without byCity (published pre-city) renders with no dropdown', async () => {
  const { byCity, ...legacyFeeds } = routes['latest.json'].feeds
  const legacyRoutes = { ...routes, 'latest.json': { ...routes['latest.json'], feeds: legacyFeeds } }
  global.fetch = jest.fn(url => {
    const body = legacyRoutes[String(url).replace(`${INDEX_BASE}/`, '')]
    return Promise.resolve(
      body ? { ok: true, json: () => Promise.resolve(body) } : { ok: false, status: 404 }
    )
  })

  renderPage()
  await waitFor(() => expect(tile('Electrical job in Ann Arbor, 2026-08-25')).toBeInTheDocument())
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  expect(screen.getByRole('searchbox', { name: 'Search jobs' })).toBeInTheDocument()
})

test('tile media loads only once the tile is in view', async () => {
  renderPage()
  const first = await waitFor(() => tile('Electrical job in Ann Arbor, 2026-08-25'))
  expect(first.querySelector('img')).toBeNull() // placeholder until in view

  intersect(el => el.className.includes('tile'))
  await waitFor(() => expect(first.querySelector('img')).not.toBeNull())
  expect(first.querySelector('img').src).toContain('OUTLET-REPLACE-2026-08-25.jpg')
})

test('shows an error message when the index is unreachable', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 }))
  renderPage()
  await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
})
