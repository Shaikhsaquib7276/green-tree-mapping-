import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './App.css'

const SURVEY = {
  projectKey: 'theem-campus-2026',
  date: '20 September 2026',
  totalTrees: 38,
  zones: [
    { name: 'Main Ground', count: 10, color: '#5b9d6b' },
    { name: 'Volleyball Ground', count: 21, color: '#c5a45e' },
    { name: 'Parking', count: 7, color: '#6995c5' },
    { name: 'Flower Garden', count: 0, color: '#b889a7' },
  ],
  conditions: [
    { name: 'Healthy', count: 25, color: '#4d9a6b' },
    { name: 'Needs attention', count: 10, color: '#d6a14d' },
    { name: 'Uncertain', count: 3, color: '#9ba8a1' },
  ],
  species: [
    ['Gulmohar', 9], ['Other / not identified', 7], ['Black Jamun', 4],
    ['Sitaphal', 3], ['Khajur', 3], ['Neem', 2], ['Bore (Ber)', 2],
    ['Jamun', 2], ['White Jamun', 2], ['Badam', 2], ['Ashoka', 1], ['Amrud (Guava)', 1],
  ],
}

const NAV = [
  ['home', 'Overview'], ['map', 'Explore map'], ['trees', 'Tree catalogue'],
  ['statistics', 'Insights'], ['spaces', 'Green spaces'], ['gallery', 'Gallery'],
]
const API = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const CAMPUS = { lat: 19.8333, lng: 72.7083, name: 'Theem College of Engineering', address: 'Village Betegaon, Boisar Chilhar Road, Boisar (East), Palghar, Maharashtra 401501' }

let csrfTokenCache = null

async function getCsrfToken(force = false) {
  if (csrfTokenCache && !force) return csrfTokenCache
  const response = await fetch(`${API}/auth/csrf`, { credentials: 'include' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.token) throw new Error('Could not start a secure session. Refresh the page and try again.')
  csrfTokenCache = data.token
  return csrfTokenCache
}

async function request(path, options = {}, retryCsrf = true) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers['X-CSRF-Token'] = await getCsrfToken()
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  })
  const body = await response.json().catch(() => ({}))
  if (body?.csrfToken) csrfTokenCache = body.csrfToken
  if (!response.ok && body?.error?.code === 'CSRF_INVALID' && retryCsrf) {
    csrfTokenCache = null
    await getCsrfToken(true)
    return request(path, options, false)
  }
  if (!response.ok) throw new Error(body?.error?.message || body?.message || `Request failed (${response.status})`)
  return body
}

function Icon({ name, size = 18 }) {
  const paths = {
    leaf: <><path d="M20 4c-8 0-14 4-14 11a5 5 0 0 0 5 5C18 20 20 12 20 4Z"/><path d="M4 21c2-5 5-8 11-11"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    moon: <><path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    tree: <><path d="M12 22v-7"/><path d="m8 15 4-5 4 5"/><path d="m5 11 7-8 7 8a3 3 0 0 1-2.2 5H7.2A3 3 0 0 1 5 11Z"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    chart: <><path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 5-7"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    sprout: <><path d="M12 21v-9"/><path d="M12 12C12 5 6 4 3 5c0 5 3 8 9 7Z"/><path d="M12 16c0-6 4-9 9-9 0 5-2 8-9 9Z"/></>,
    menuBook: <><path d="M3 5.5A3.5 3.5 0 0 1 6.5 2H20v18H6.5A3.5 3.5 0 0 0 3 23Z"/><path d="M3 5.5V23"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.leaf}</svg>
}

function LeafletMap({ trees = [], greenSpaces = [], editable = false, selectedLocation = null, selectedLocationLabel = '', focusLocation = null, onPick }) {
  const elementRef = useRef(null)
  const [mapError, setMapError] = useState(false)
  const [placeQuery, setPlaceQuery] = useState(selectedLocationLabel || '')
  const [placeResults, setPlaceResults] = useState([])
  const [placeSearchBusy, setPlaceSearchBusy] = useState(false)
  const [placeSearchError, setPlaceSearchError] = useState('')
  const geocodeRequestRef = useRef(0)
  const mapRef = useRef(null)
  const markersRef = useRef(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick

  useEffect(() => {
    if (selectedLocationLabel) setPlaceQuery(selectedLocationLabel)
  }, [selectedLocationLabel])

  async function searchPlaces(event) {
    event?.preventDefault()
    const query = placeQuery.trim()
    if (query.length < 3) { setPlaceSearchError('Enter at least 3 characters to search.'); setPlaceResults([]); return }
    setPlaceSearchBusy(true); setPlaceSearchError(''); setPlaceResults([])
    try {
      const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '5', countrycodes: 'in', addressdetails: '1', 'accept-language': 'en' })
      const response = await fetch('https://nominatim.openstreetmap.org/search?' + params.toString(), { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error('Place search service is temporarily unavailable.')
      const results = await response.json()
      setPlaceResults(Array.isArray(results) ? results.filter(item => Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)) && item.display_name) : [])
      if (!Array.isArray(results) || results.length === 0) setPlaceSearchError('No places found. Try a nearby landmark or full address.')
    } catch (error) {
      setPlaceSearchError(error.message || 'Could not search places. You can still select a point on the map.')
    } finally { setPlaceSearchBusy(false) }
  }

  function choosePlace(place) {
    const point = { lat: Number(place.lat), lng: Number(place.lon), label: place.display_name }
    geocodeRequestRef.current += 1
    setPlaceQuery(place.display_name); setPlaceResults([]); setPlaceSearchError('')
    onPickRef.current?.(point)
    mapRef.current?.flyTo([point.lat, point.lng], 17, { duration: 0.45 })
  }

  useEffect(() => {
    if (!elementRef.current || mapRef.current) return
    const map = L.map(elementRef.current, { zoomControl: true, scrollWheelZoom: false, preferCanvas: true }).setView([CAMPUS.lat, CAMPUS.lng], 15)
    mapRef.current = map
    markersRef.current = L.layerGroup().addTo(map)
    setMapError(false)

    let activeTileLayer = null
    let fallbackUsed = false
    let tileLoaded = false
    let retryTimer = null
    const fallbackToOsm = () => {
      if (fallbackUsed) {
        if (!tileLoaded) setMapError(true)
        return
      }
      fallbackUsed = true
      if (activeTileLayer) map.removeLayer(activeTileLayer)
      activeTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
        crossOrigin: true,
      })
      activeTileLayer.on('tileload', () => { tileLoaded = true; setMapError(false) })
      activeTileLayer.on('tileerror', () => { if (!tileLoaded) setMapError(true) })
      activeTileLayer.addTo(map)
    }
    activeTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      crossOrigin: true,
    })
    activeTileLayer.on('tileload', () => { tileLoaded = true; setMapError(false) })
    activeTileLayer.on('tileerror', fallbackToOsm)
    activeTileLayer.addTo(map)
    retryTimer = window.setTimeout(() => { if (!tileLoaded) fallbackToOsm() }, 5000)

    const resize = () => map.invalidateSize({ pan: false })
    window.addEventListener('resize', resize)
    let observer
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(resize)
      if (elementRef.current) observer.observe(elementRef.current)
    }
    const timer = window.setTimeout(resize, 250)
    return () => {
      window.clearTimeout(timer)
      window.clearTimeout(retryTimer)
      window.removeEventListener('resize', resize)
      observer?.disconnect()
      map.remove()
      mapRef.current = null
      markersRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const handlePick = event => {
      const point = { lat: Number(event.latlng.lat.toFixed(6)), lng: Number(event.latlng.lng.toFixed(6)) }
      const requestId = ++geocodeRequestRef.current
      onPickRef.current?.(point)
      map.setView([point.lat, point.lng], Math.max(map.getZoom(), 17))
      fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=' + point.lat + '&lon=' + point.lng + '&zoom=18&addressdetails=1&accept-language=en', { headers: { Accept: 'application/json' } })
        .then(response => { if (!response.ok) throw new Error('Reverse geocoding unavailable'); return response.json() })
        .then(result => {
          if (requestId === geocodeRequestRef.current && result?.display_name) onPickRef.current?.({ ...point, label: result.display_name })
        })
        .catch(() => { /* Exact coordinates have already been selected; the address can remain blank. */ })
    }
    if (editable) {
      map.on('click', handlePick)
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.off('click', handlePick)
      map.getContainer().style.cursor = ''
    }
    return () => map.off('click', handlePick)
  }, [editable])

  useEffect(() => {
    const map = mapRef.current
    const layer = markersRef.current
    if (!map || !layer) return
    layer.clearLayers()
    const points = []
    for (const tree of trees) {
      if (tree.verificationStatus !== 'verified' || tree.locationVerified !== true) continue
      const coords = tree?.location?.coordinates
      if (!Array.isArray(coords) || coords.length !== 2 || !coords.every(Number.isFinite)) continue
      const [lng, lat] = coords
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) continue
      const color = tree.condition === 'healthy' ? '#3b8c5a' : tree.condition === 'needs_attention' ? '#d6a14d' : '#8b9891'
      const marker = L.circleMarker([lat, lng], { radius: 8, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 })
      const content = document.createElement('div')
      const title = document.createElement('strong')
      title.textContent = tree.commonName || 'Recorded tree'
      const meta = document.createElement('p')
      meta.textContent = `${tree.treeId || 'Tree record'} · ${tree.zone?.name || 'Zone not assigned'}`
      content.append(title, meta)
      marker.bindPopup(content).addTo(layer)
      points.push([lat, lng])
    }
    for (const space of greenSpaces) {
      if (space.locationVerified !== true) continue
      const coords = space?.location?.coordinates
      if (!Array.isArray(coords) || coords.length !== 2 || !coords.every(Number.isFinite)) continue
      const [lng, lat] = coords
      if (lng < -180 || lng > 180 || lat < -90 || lat > 90) continue
      const marker = L.circleMarker([lat, lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#6b7fba', fillOpacity: 1 })
      const content = document.createElement('div')
      const title = document.createElement('strong')
      title.textContent = space.name || 'Campus green space'
      const meta = document.createElement('p')
      meta.textContent = space.zone?.name || 'Campus green space'
      content.append(title, meta)
      marker.bindPopup(content).addTo(layer)
      points.push([lat, lng])
    }
    const recordedPointCount = points.length
    if (!editable) {
      const campusContent = document.createElement('div')
      const campusTitle = document.createElement('strong')
      campusTitle.textContent = CAMPUS.name
      const campusAddress = document.createElement('p')
      campusAddress.textContent = CAMPUS.address
      const campusNote = document.createElement('p')
      campusNote.textContent = 'CEP survey site. This marker identifies the campus, not each tree’s exact position.'
      campusContent.append(campusTitle, campusAddress, campusNote)
      L.marker([CAMPUS.lat, CAMPUS.lng]).bindPopup(campusContent).addTo(layer)
      points.push([CAMPUS.lat, CAMPUS.lng])
    }
    if (selectedLocation && Number.isFinite(selectedLocation.lat) && Number.isFinite(selectedLocation.lng)) {
      const selectedContent = document.createElement('div')
      const selectedTitle = document.createElement('strong')
      selectedTitle.textContent = selectedLocationLabel || 'Selected place'
      const selectedCoordinates = document.createElement('p')
      selectedCoordinates.textContent = selectedLocation.lat.toFixed(6) + ', ' + selectedLocation.lng.toFixed(6)
      selectedContent.append(selectedTitle, selectedCoordinates)
      L.marker([selectedLocation.lat, selectedLocation.lng]).bindPopup(selectedContent).addTo(layer)
      map.setView([selectedLocation.lat, selectedLocation.lng], 17)
    } else if (recordedPointCount > 0) {
      map.fitBounds(L.latLngBounds(points).pad(0.16), { maxZoom: 16 })
    } else {
      map.setView([CAMPUS.lat, CAMPUS.lng], 15)
    }
  }, [trees, greenSpaces, selectedLocation, selectedLocationLabel])

  useEffect(() => {
    const map = mapRef.current
    if (!map || editable || !focusLocation) return
    const { lat, lng } = focusLocation
    if (Number.isFinite(lat) && Number.isFinite(lng)) map.setView([lat, lng], 17)
  }, [focusLocation, editable])

  return <div className="leaflet-frame">
    <div ref={elementRef} className="leaflet-map" aria-label={editable ? 'Search a place or click to choose coordinates' : 'Map of recorded trees'} />
    {editable && <form className="place-search-panel" onSubmit={searchPlaces}>
      <div className="place-search-row"><Icon name="search" size={17}/><input aria-label="Search for a place or address" value={placeQuery} onChange={event => { setPlaceQuery(event.target.value); setPlaceSearchError(''); setPlaceResults([]) }} placeholder="Search campus, landmark or address…"/><button type="submit" disabled={placeSearchBusy}>{placeSearchBusy ? 'Searching…' : 'Search'}</button></div>
      {placeSearchError && <p className="place-search-error" role="status">{placeSearchError}</p>}
      {placeResults.length > 0 && <div className="place-search-results" role="listbox" aria-label="Place search results">{placeResults.map((place,index) => <button className="place-search-result" type="button" key={place.place_id || `${place.lat}-${place.lon}-${index}`} onClick={() => choosePlace(place)}><span className="place-result-icon"><Icon name="pin" size={16}/></span><span><b>{place.name || place.display_name.split(',')[0]}</b><small>{place.display_name}</small></span></button>)}</div>}
      <p className="place-search-help">Choose a result to fill the place and coordinates, or click the exact location on the map.</p>
    </form>}
    {mapError && <div className="map-load-error" role="status"><b>Map tiles could not load.</b><span>Check your internet connection and retry.</span><button type="button" onClick={() => window.location.reload()}>Retry map</button></div>}
    {editable && <div className="map-instruction"><Icon name="pin" size={15}/> Click the exact tree location to set coordinates</div>}
  </div>
}

function EmptyState({ icon = 'tree', title, text, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={24}/></span><h3>{title}</h3><p>{text}</p>{action}</div>
}

function App() {
  const initialRoute = () => (window.location.hash.replace(/^#\/?/, '') || 'home').split('/')[0]
  const [page, setPage] = useState(initialRoute)
  const [mobileNav, setMobileNav] = useState(false)
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('greenmap-theme') === 'dark' ? 'dark' : 'light' } catch { return 'light' } })
  const [summary, setSummary] = useState(null)
  const [trees, setTrees] = useState([])
  const [treeTotal, setTreeTotal] = useState(0)
  const [zones, setZones] = useState(SURVEY.zones.map(z => ({ ...z, slug: z.name.toLowerCase().replaceAll(' ', '-') })))
  const [spaces, setSpaces] = useState([])
  const [gallery, setGallery] = useState([])
  const [apiReady, setApiReady] = useState(false)
  const [apiMessage, setApiMessage] = useState('')
  const [activeTree, setActiveTree] = useState(null)
  const [mapFocus, setMapFocus] = useState(null)
  const [sessionUser, setSessionUser] = useState(null)
  const [filter, setFilter] = useState({ q: '', zone: '', condition: '' })
  const [cataloguePage, setCataloguePage] = useState(1)
  const [galleryFilter, setGalleryFilter] = useState('all')
  const [surveyDone, setSurveyDone] = useState(false)
  const [surveyError, setSurveyError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginBusy, setLoginBusy] = useState(false)
  const [adminTab, setAdminTab] = useState('trees')
  const [adminMessage, setAdminMessage] = useState('')
  const [adminError, setAdminError] = useState('')
  const [editingTree, setEditingTree] = useState(null)
  const [locationPicker, setLocationPicker] = useState(false)
  const [treeForm, setTreeForm] = useState({ treeId: '', commonName: '', scientificName: '', zone: '', condition: 'healthy', notes: '', latitude: '', longitude: '', locationLabel: '', locationVerified: false, photoAltText: '' })
  const [surveyForm, setSurveyForm] = useState({ ageGroup: '', zone: '', awareness: '', greenSpaceImportance: '', treeCareAwareness: '', participationInterest: '', suggestions: '' })

  const go = useCallback((next, replace = false) => {
    setPage(next)
    setMobileNav(false)
    if (replace) window.history.replaceState({}, '', `#/${next}`)
    else window.history.pushState({}, '', `#/${next}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const loadAll = useCallback(async () => {
    try {
      const [overview, treeList, zoneList, spaceList, galleryList, me] = await Promise.allSettled([
        request('/statistics/overview'), request('/trees?limit=100'), request('/zones'), request('/green-spaces'), request('/gallery'), request('/auth/me'),
      ])
      if (overview.status === 'fulfilled') setSummary(overview.value.summary || null)
      if (treeList.status === 'fulfilled') { setTrees(treeList.value.items || []); setTreeTotal(treeList.value.total || 0) }
      if (zoneList.status === 'fulfilled') setZones(zoneList.value.items || [])
      if (spaceList.status === 'fulfilled') setSpaces(spaceList.value.items || [])
      if (galleryList.status === 'fulfilled') setGallery(galleryList.value.items || [])
      if (me.status === 'fulfilled') setSessionUser(me.value.user || null)
      const healthy = overview.status === 'fulfilled' && treeList.status === 'fulfilled' && zoneList.status === 'fulfilled'
      setApiReady(healthy)
      setApiMessage(healthy ? '' : 'The API is not connected. Start the Express server and check server/.env for MongoDB Atlas settings.')
    } catch {
      setApiReady(false)
      setApiMessage('The API is not connected. Start the Express server and check server/.env for MongoDB Atlas settings.')
    }
  }, [])

  useEffect(() => {
    loadAll()
    const onPopState = () => { setPage((window.location.hash.replace(/^#\/?/, '') || 'home').split('/')[0]); setMobileNav(false) }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [loadAll])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('greenmap-theme', theme) } catch { /* storage may be unavailable */ }
  }, [theme])

  const individualMapped = useMemo(() => trees.filter(t => t.verificationStatus === 'verified' && t.locationVerified === true && Array.isArray(t.location?.coordinates) && t.location.coordinates.length === 2 && t.location.coordinates.every(Number.isFinite)).length, [trees])
  const aggregate = summary || (apiReady ? null : SURVEY)
  const surveyTotal = aggregate?.totalTrees ?? (apiReady ? 0 : SURVEY.totalTrees)
  const surveyDate = aggregate?.surveyDate
    ? new Date(aggregate.surveyDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : (apiReady ? 'Not set' : SURVEY.date)
  const surveyZones = Array.isArray(aggregate?.zoneCounts)
    ? aggregate.zoneCounts.map(zone => ({
        ...zone,
        color: SURVEY.zones.find(item => item.name === zone.name)?.color || '#5b9d6b',
      }))
    : (aggregate ? SURVEY.zones : [])
  const surveyConditions = aggregate?.conditionCounts && !Array.isArray(aggregate.conditionCounts)
    ? [
        { name: 'Healthy', count: aggregate.conditionCounts.healthy ?? 0, color: '#4d9a6b' },
        { name: 'Needs attention', count: aggregate.conditionCounts.needsAttention ?? 0, color: '#d6a14d' },
        { name: 'Uncertain', count: aggregate.conditionCounts.uncertain ?? 0, color: '#9ba8a1' },
      ]
    : (aggregate ? SURVEY.conditions : [{ name: 'Healthy', count: 0, color: '#4d9a6b' }, { name: 'Needs attention', count: 0, color: '#d6a14d' }, { name: 'Uncertain', count: 0, color: '#9ba8a1' }])
  const surveySpecies = Array.isArray(aggregate?.speciesCounts)
    ? aggregate.speciesCounts.map(item => ({ name: item.name, count: item.count }))
    : (aggregate ? SURVEY.species.map(([name, count]) => ({ name, count })) : [])

  const storedTreeCount = aggregate?.counts?.storedTreeCount ?? treeTotal
  const verifiedTreeCount = aggregate?.counts?.verifiedTreeCount ?? trees.filter(t => t.verificationStatus === 'verified').length
  const title = ({ home: 'A living record of campus nature', map: 'Explore the green cover', trees: 'Tree catalogue', detail: activeTree?.commonName || 'Tree details', statistics: 'The story in the numbers', spaces: 'Campus green spaces', gallery: 'Field notes in pictures', survey: 'Your voice, greener campus', about: 'A small step toward a greener campus', admin: 'Admin workspace' })[page] || 'GreenMap'

  const openTree = tree => { setActiveTree(tree); go('detail') }
  const resetTreeForm = () => { setEditingTree(null); setTreeForm({ treeId: '', commonName: '', scientificName: '', zone: zones[0]?._id || '', condition: 'healthy', notes: '', latitude: '', longitude: '', locationLabel: '', locationVerified: false, photoAltText: '' }); setLocationPicker(false) }
  const editTree = tree => {
    const coords = tree.location?.coordinates
    setEditingTree(tree)
    setTreeForm({ treeId: tree.treeId || '', commonName: tree.commonName || '', scientificName: tree.scientificName || '', zone: tree.zone?._id || tree.zone || '', condition: tree.condition || 'healthy', notes: tree.notes || '', latitude: coords ? String(coords[1]) : '', longitude: coords ? String(coords[0]) : '', locationLabel: tree.locationLabel || '', locationVerified: Boolean(tree.locationVerified), photoAltText: tree.photos?.[0]?.altText || tree.commonName || '' })
    setLocationPicker(false)
    setAdminMessage('')
    setAdminError('')
  }

  async function submitLogin(event) {
    event.preventDefault(); setLoginBusy(true); setLoginError('')
    const form = new FormData(event.currentTarget)
    try {
      await request('/auth/login', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) })
      await loadAll(); go('admin')
    } catch (error) { setLoginError(error.message || 'Unable to sign in. Check your details and try again.') }
    finally { setLoginBusy(false) }
  }

  async function logout() {
    try { await request('/auth/logout', { method: 'POST', body: JSON.stringify({}) }) } catch { /* session may already be expired */ }
    setSessionUser(null); go('admin')
  }

  async function saveTree(event) {
    event.preventDefault(); setAdminMessage(''); setAdminError('')
    const data = { ...treeForm }
    const hasLat = String(data.latitude).trim() !== ''
    const hasLng = String(data.longitude).trim() !== ''
    if (hasLat !== hasLng) { setAdminError('Enter both latitude and longitude, or leave both blank.'); return }
    if (hasLat && (!Number.isFinite(Number(data.latitude)) || !Number.isFinite(Number(data.longitude)) || Math.abs(Number(data.latitude)) > 90 || Math.abs(Number(data.longitude)) > 180)) { setAdminError('Enter valid latitude and longitude values.'); return }
    try {
      const payload = { treeId: data.treeId, commonName: data.commonName, scientificName: data.scientificName, zone: data.zone || null, condition: data.condition, notes: data.notes, locationLabel: hasLat ? data.locationLabel : '', clearLocation: !hasLat, ...(hasLat ? { latitude: Number(data.latitude), longitude: Number(data.longitude), locationVerified: Boolean(hasLat) } : {}) }
      const result = editingTree
        ? await request(`/trees/${editingTree._id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : await request('/trees', { method: 'POST', body: JSON.stringify(payload) })
      let saved = result.tree
      const file = event.currentTarget.querySelector('input[type="file"]')?.files?.[0]
      if (file && saved?._id) {
        const formData = new FormData(); formData.append('image', file); formData.append('altText', data.photoAltText || data.commonName)
        const imageResult = await request(`/trees/${saved._id}/photos`, { method: 'POST', body: formData })
        saved = imageResult.tree || saved
      }
      setAdminMessage(editingTree ? 'Tree record updated.' : 'Tree record created as pending verification.')
      resetTreeForm()
      await loadAll()
      setActiveTree(saved || null)
    } catch (error) { setAdminError(error.message) }
  }

  async function verifyTree(tree, status) {
    setAdminMessage(''); setAdminError('')
    try { await request(`/trees/${tree._id}/verification`, { method: 'PATCH', body: JSON.stringify({ verificationStatus: status }) }); setAdminMessage(`Record marked ${status}.`); await loadAll() }
    catch (error) { setAdminError(error.message) }
  }
  async function deleteTree(tree) {
    if (!window.confirm(`Delete tree record ${tree.treeId}?`)) return
    try { await request(`/trees/${tree._id}`, { method: 'DELETE' }); setAdminMessage('Tree record deleted.'); if (editingTree?._id === tree._id) resetTreeForm(); await loadAll() }
    catch (error) { setAdminError(error.message) }
  }

  async function submitSurvey(event) {
    event.preventDefault(); setSurveyError('')
    try { await request('/survey/responses', { method: 'POST', body: JSON.stringify(surveyForm) }); setSurveyDone(true) }
    catch (error) { setSurveyError(error.message || 'The response could not be saved. Please try again.') }
  }

  const filteredTrees = useMemo(() => trees.filter(tree => {
    const q = filter.q.toLowerCase().trim()
    const text = [tree.treeId, tree.commonName, tree.scientificName, tree.zone?.name].filter(Boolean).join(' ').toLowerCase()
    const zoneSlug = tree.zone?.slug || ''
    return (!q || text.includes(q)) && (!filter.zone || zoneSlug === filter.zone || tree.zone?.name === filter.zone) && (!filter.condition || tree.condition === filter.condition)
  }), [trees, filter])

  const pageSize = 9
  const cataloguePages = Math.max(1, Math.ceil(filteredTrees.length / pageSize))
  const safeCataloguePage = Math.min(cataloguePage, cataloguePages)
  const pagedTrees = filteredTrees.slice((safeCataloguePage - 1) * pageSize, safeCataloguePage * pageSize)
  const filteredGallery = useMemo(() => galleryFilter === 'all' ? gallery : gallery.filter(image => image.category === galleryFilter), [gallery, galleryFilter])

  const bar = (items, maxValue) => <div className="bar-list">{items.map(item => <div className="bar-row" key={item.name}><div className="bar-label"><span>{item.name}</span><strong>{item.count}</strong></div><div className="bar-track"><span style={{ width: `${maxValue ? (item.count / maxValue) * 100 : 0}%`, background: item.color || 'var(--green-600)' }} /></div></div>)}</div>

  const header = <header className="site-header"><button className="brand" onClick={() => go('home')} aria-label="GreenMap home"><span className="brand-mark"><Icon name="leaf" size={24}/></span><span className="brand-copy"><b>green<span>map</span></b><small>FIELD NOTES / 2026</small></span></button><nav className={`nav-links ${mobileNav ? 'is-open' : ''}`} aria-label="Main navigation">{NAV.map(([key, label]) => <button key={key} className={page === key ? 'active' : ''} onClick={() => go(key)}>{label}</button>)}</nav><div className="header-actions"><button className="theme-toggle" onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}><Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16}/><span>{theme === 'dark' ? 'Light' : 'Dark'}</span></button><button className="admin-link" onClick={() => go('admin')}><Icon name="shield" size={16}/><span>{sessionUser ? 'Admin area' : 'Admin login'}</span></button><button className="mobile-toggle" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation"><Icon name={mobileNav ? 'close' : 'menu'} size={22}/></button></div></header>

  return <div className="app-shell">
    {header}
    <main>
      {apiMessage && <div className="api-notice"><span className="api-dot"/><span>{apiMessage}</span><button onClick={loadAll}>Retry connection</button></div>}
      {page === 'home' && <section className="page-home">
        <div className="hero"><div className="hero-content"><div className="eyebrow"><span className="eyebrow-dot"/> THEEM COLLEGE OF ENGINEERING · BETEGAON</div><h1>Protect the record.<br/><em>Grow the impact.</em></h1><p className="hero-lede">Every tree has a place in the story. GreenMap brings campus nature into focus through field records, thoughtful mapping and measurable action.</p><div className="hero-actions"><button className="button button-primary" onClick={() => go('map')}>Explore the map <Icon name="arrow" size={17}/></button><button className="button button-secondary" onClick={() => go('trees')}>Browse tree records</button></div><div className="hero-footnote"><span className="hero-footnote-icon"><Icon name="shield" size={16}/></span><span>Field summary recorded <b>{surveyDate}</b><br/>Individual records are shown only when entered.</span></div></div><div className="hero-art"><div className="sun-disc"/><div className="hero-label label-one"><Icon name="sprout" size={16}/> a living campus</div><svg className="hero-landscape" viewBox="0 0 590 530" role="img" aria-label="Illustration of a green campus landscape"><defs><linearGradient id="hill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9dbc75"/><stop offset="1" stopColor="#2b6a47"/></linearGradient><linearGradient id="canopy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#477f55"/><stop offset="1" stopColor="#1e4d36"/></linearGradient></defs><path d="M0 360Q120 220 245 330T590 295V530H0Z" fill="#b5ca90"/><path d="M0 420Q130 300 300 370T590 340V530H0Z" fill="url(#hill)"/><path d="M285 530Q260 420 350 360Q410 320 460 340Q390 405 390 530Z" fill="#e6d8b5" opacity=".9"/><g fill="url(#canopy)"><circle cx="140" cy="190" r="82"/><circle cx="205" cy="225" r="70"/><circle cx="85" cy="250" r="64"/><circle cx="410" cy="160" r="89"/><circle cx="486" cy="223" r="70"/><circle cx="350" cy="240" r="75"/></g><g fill="#c3d9a0" opacity=".45"><circle cx="117" cy="168" r="26"/><circle cx="177" cy="212" r="23"/><circle cx="399" cy="130" r="30"/><circle cx="460" cy="198" r="27"/></g><g stroke="#705d40" strokeWidth="11" strokeLinecap="round" fill="none"><path d="M140 220V390"/><path d="M410 195V370"/><path d="M486 250V385"/><path d="M205 250V386"/></g><g fill="#315e3e"><path d="M80 392h12v-35H80z"/><path d="M135 395h13v-42h-13z"/><path d="M403 369h14v-48h-14z"/></g><g fill="#f2e9d4"><rect x="235" y="335" width="76" height="58" rx="3"/><path d="M224 338 273 303l51 35Z"/><rect x="264" y="359" width="16" height="34" fill="#9dba8a"/><rect x="242" y="347" width="14" height="12" fill="#8cae9a"/></g><g fill="#f0d27e"><circle cx="67" cy="338" r="5"/><circle cx="99" cy="308" r="4"/><circle cx="515" cy="315" r="5"/><circle cx="470" cy="352" r="4"/></g></svg><div className="hero-label label-two"><span className="pulse"/>{individualMapped} mapped records</div></div></div>
        <div className="stats-strip"><div className="stats-intro"><span className="section-kicker">THE SURVEY / 01</span><p>One field visit.<br/><b>A baseline to build on.</b></p></div><div className="big-stat"><strong>{surveyTotal}</strong><span>Trees recorded<br/>in survey summary</span></div><div className="big-stat"><strong>{storedTreeCount}</strong><span>Individual records<br/>stored in database</span></div><div className="big-stat"><strong>{individualMapped}</strong><span>Individual records<br/>with map coordinates</span></div><div className="stats-source">The survey total is an aggregate count, not {surveyTotal} individual mapped records.</div></div>
        <section className="section-block"><div className="section-heading"><div><span className="section-kicker">DISCOVER THE CAMPUS</span><h2>See the green differently.</h2></div><p>Explore the places, records and observations that make up the campus green-cover inventory.</p></div><div className="feature-grid"><button className="feature-card feature-map" onClick={() => go('map')}><span className="feature-icon"><Icon name="pin" size={23}/></span><span className="feature-number">01 / MAP</span><h3>See what’s recorded.</h3><p>Explore only the tree locations that have been individually entered and mapped.</p><span className="feature-link">Open interactive map <Icon name="arrow" size={16}/></span><div className="mini-map-art"><span/><span/><span/><span/><span/></div></button><button className="feature-card feature-catalogue" onClick={() => go('trees')}><span className="feature-icon"><Icon name="tree" size={23}/></span><span className="feature-number">02 / INVENTORY</span><h3>A record for every tree.</h3><p>Search by common name, tree ID, zone or condition as the verified inventory grows.</p><span className="feature-link">Browse catalogue <Icon name="arrow" size={16}/></span><div className="leaf-pattern">✳</div></button><button className="feature-card feature-insight" onClick={() => go('statistics')}><span className="feature-icon"><Icon name="chart" size={23}/></span><span className="feature-number">03 / INSIGHTS</span><h3>Turn observations into action.</h3><p>Understand tree condition and zone-level distribution from documented survey totals.</p><span className="feature-link">View insights <Icon name="arrow" size={16}/></span><div className="insight-bars"><i/><i/><i/><i/><i/></div></button></div></section>
        <section className="section-block zones-block"><div className="section-heading"><div><span className="section-kicker">FIELD NOTES / ZONES</span><h2>Four places. One shared canopy.</h2></div><button className="text-button" onClick={() => go('statistics')}>See zone breakdown <Icon name="arrow" size={16}/></button></div><div className="zone-overview">{surveyZones.map((zone, i) => <button className="zone-card" key={zone.name} onClick={() => { setFilter({ q: '', zone: zone.name.toLowerCase().replaceAll(' ', '-'), condition: '' }); go('trees') }}><span className="zone-index">0{i + 1}</span><span className="zone-swatch" style={{ background: zone.color }}/><span className="zone-name">{zone.name}</span><strong>{zone.count.toString().padStart(2, '0')}</strong><small>survey count</small><span className="zone-bar"><i style={{ width: `${(surveyTotal ? zone.count / surveyTotal * 100 : 0)}%`, background: zone.color }}/></span></button>)}</div></section>
        <section className="closing-cta"><div><span className="section-kicker">SMALL OBSERVATIONS. LASTING VALUE.</span><h2>Be part of the next field note.</h2><p>Share your awareness and ideas for caring for campus green spaces.</p></div><button className="button button-light" onClick={() => go('survey')}>Share your perspective <Icon name="arrow" size={17}/></button><span className="cta-sprout"><Icon name="sprout" size={116}/></span></section>
      </section>}

      {page === 'map' && <section className="content-page"><div className="page-heading"><div><span className="section-kicker">FIELD ATLAS / 01</span><h1>{title}</h1><p>The campus marker shows the CEP survey site. Individual tree pins appear only after an exact tree location is recorded and verified.</p></div><span className="status-pill"><span className="status-dot"/> {individualMapped} mapped records</span></div><div className="map-layout"><div className="map-card"><LeafletMap trees={trees} greenSpaces={spaces} focusLocation={mapFocus}/><div className="map-legend"><span><i style={{background:'#3b8c5a'}}/>Healthy</span><span><i style={{background:'#d6a14d'}}/>Needs attention</span><span><i style={{background:'#8b9891'}}/>Uncertain</span><span><i style={{background:'#6b7fba'}}/>Green space</span></div></div><aside className="map-sidebar"><span className="section-kicker">MAP GUIDE</span><h2>What am I seeing?</h2><p>The map shows the Theem College survey site and any individually recorded trees with verified GPS coordinates. The 38 reconstructed CEP rows do not include per-tree GPS, so they are listed in the catalogue until locations are checked on campus.</p><div className="map-fact"><strong>{treeTotal}</strong><span>tree inventory entries in the catalogue</span></div><div className="map-fact"><strong>{individualMapped}</strong><span>individual trees with verified coordinates</span></div><div className="map-fact"><strong>{surveyTotal}</strong><span>aggregate CEP survey total</span></div><div className="data-honesty"><Icon name="shield" size={18}/><div><b>Location integrity</b><p>No zone centroids or estimated coordinates are used to represent trees.</p></div></div><button className="button button-primary button-full" onClick={() => go('trees')}>Open tree catalogue <Icon name="arrow" size={16}/></button></aside></div></section>}

      {page === 'trees' && <section className="content-page"><div className="page-heading"><div><span className="section-kicker">INDIVIDUAL RECORDS / 02</span><h1>{title}</h1><p>Search the published inventory. The catalogue grows as tree-level field records are entered and verified.</p></div><div className="record-counter"><strong>{filteredTrees.length}</strong><span>records shown</span></div></div><div className="filter-bar"><label className="search-field"><Icon name="search" size={18}/><input value={filter.q} onChange={e => {setFilter({ ...filter, q: e.target.value });setCataloguePage(1)}} placeholder="Search tree name, ID or species…"/></label><select aria-label="Filter by zone" value={filter.zone} onChange={e => {setFilter({ ...filter, zone: e.target.value });setCataloguePage(1)}}><option value="">All zones</option>{zones.map(z => <option value={z.slug || z.name} key={z._id || z.slug}>{z.name}</option>)}</select><select aria-label="Filter by condition" value={filter.condition} onChange={e => {setFilter({ ...filter, condition: e.target.value });setCataloguePage(1)}}><option value="">All conditions</option><option value="healthy">Healthy</option><option value="needs_attention">Needs attention</option><option value="uncertain">Uncertain</option></select><button className="button button-outline" onClick={() => {setFilter({ q: '', zone: '', condition: '' });setCataloguePage(1)}}>Reset</button></div>{filteredTrees.length ? <><div className="tree-grid">{pagedTrees.map(tree => <button className="tree-card" key={tree._id} onClick={() => openTree(tree)}><div className="tree-card-image">{tree.photos?.[0]?.url ? <img src={tree.photos[0].url} alt={tree.commonName}/> : <div className="tree-placeholder"><Icon name="tree" size={36}/></div>}<span className={`condition-tag ${tree.condition}`}>{(tree.condition || 'uncertain').replace('_', ' ')}</span></div><div className="tree-card-body"><span className="tree-id">{tree.treeId || 'TREE RECORD'}</span>{tree.verificationStatus !== 'verified' && <span className="record-status pending">CEP entry · pending verification</span>}<h3>{tree.commonName}</h3><p className="latin-name">{tree.scientificName || 'Scientific name not verified'}</p><div className="tree-card-meta"><span><Icon name="pin" size={14}/>{tree.zone?.name || 'Zone not assigned'}</span><Icon name="arrow" size={17}/></div></div></button>)}</div>{cataloguePages > 1 && <nav className="pagination" aria-label="Catalogue pages"><button disabled={cataloguePage===1} onClick={()=>setCataloguePage(n=>Math.max(1,n-1))}>Previous</button><span>Page {cataloguePage} of {cataloguePages}</span><button disabled={cataloguePage===cataloguePages} onClick={()=>setCataloguePage(n=>Math.min(cataloguePages,n+1))}>Next</button></nav>}</> : <EmptyState title={apiReady ? 'No individual tree records yet' : 'Tree records unavailable'} text={apiReady ? 'The aggregate survey records 38 trees, but individual records must be entered from the actual survey sheet before they appear here.' : 'Connect the Express API and MongoDB Atlas to load individual tree records.'} icon="tree" action={<button className="button button-outline" onClick={loadAll}>Refresh records</button>}/>}</section>}

      {page === 'detail' && <section className="content-page"><button className="back-link" onClick={() => go('trees')}>← Back to catalogue</button>{activeTree ? <div className="detail-layout"><div className="detail-image">{activeTree.photos?.[0]?.url ? <img src={activeTree.photos[0].url} alt={activeTree.commonName}/> : <div className="tree-placeholder"><Icon name="tree" size={52}/></div>}</div><div className="detail-content"><span className="section-kicker">{activeTree.treeId || 'INDIVIDUAL RECORD'}</span><h1>{activeTree.commonName}</h1><p className="latin-name">{activeTree.scientificName || 'Scientific name not verified'}</p><span className={`condition-tag ${activeTree.condition}`}>{(activeTree.condition || 'uncertain').replace('_', ' ')}</span><dl className="detail-facts"><div><dt>Campus zone</dt><dd>{activeTree.zone?.name || 'Not assigned'}</dd></div><div><dt>Record status</dt><dd>{activeTree.verificationStatus || 'pending'}</dd></div><div><dt>Data source</dt><dd>{activeTree.source || 'Admin entry'}</dd></div><div><dt>Place / address</dt><dd>{activeTree.locationLabel || 'Not recorded'}</dd></div><div><dt>GPS coordinates</dt><dd>{activeTree.location?.coordinates ? `${activeTree.location.coordinates[1]}, ${activeTree.location.coordinates[0]}` : 'Not recorded'}</dd></div><div><dt>Scientific name</dt><dd>{activeTree.scientificNameVerified ? 'Verified' : 'Not verified'}</dd></div></dl><p>{activeTree.notes || 'No additional field notes have been added.'}</p>{activeTree.locationVerified && activeTree.location?.coordinates && <button className="button button-primary" onClick={() => { const coords=activeTree.location.coordinates; setMapFocus({lat:coords[1],lng:coords[0]}); go('map') }}>View on map <Icon name="arrow" size={16}/></button>}</div></div> : <EmptyState title="No tree selected" text="Choose an individual record from the catalogue." action={<button className="button button-primary" onClick={() => go('trees')}>Open catalogue</button>}/>}</section>}

      {page === 'statistics' && <section className="content-page"><div className="page-heading"><div><span className="section-kicker">SURVEY REPORT / 03</span><h1>{title}</h1><p>Aggregate results from the field survey, separated from live individual database records.</p></div><div className="report-date"><span>FIELD VISIT</span><strong>{surveyDate}</strong><small>Theem College of Engineering</small></div></div><div className="insights-hero"><div><span className="section-kicker">SURVEY-REPORTED TREES</span><strong>{surveyTotal}</strong><p>Reported in the aggregate inventory summary</p></div><div className="insights-secondary"><div><strong>{storedTreeCount}</strong><span>Individual records stored</span></div><div><strong>{verifiedTreeCount}</strong><span>Verified individual records</span></div><div><strong>{individualMapped}</strong><span>Records with coordinates</span></div></div><p className="data-note"><Icon name="shield" size={17}/> These metrics describe different things: the survey total does not imply that all {surveyTotal} trees have been individually entered, verified or mapped.</p></div><div className="charts-grid"><div className="chart-card"><div className="chart-heading"><div><span className="section-kicker">01 / LOCATION</span><h2>Where trees were counted</h2></div><span className="chart-total">{surveyTotal} total</span></div>{bar(surveyZones, Math.max(1, ...surveyZones.map(item => item.count)))}</div><div className="chart-card"><div className="chart-heading"><div><span className="section-kicker">02 / CONDITION</span><h2>Observed tree condition</h2></div><span className="chart-total">{surveyTotal} total</span></div>{bar(surveyConditions, Math.max(1, ...surveyConditions.map(item => item.count)))}</div><div className="chart-card species-card"><div className="chart-heading"><div><span className="section-kicker">03 / SPECIES</span><h2>Recorded common names & categories</h2></div><span className="chart-total">{surveySpecies.length} categories</span></div>{bar(surveySpecies, Math.max(1, ...surveySpecies.map(item => item.count)))}<p className="chart-footnote">Common names reflect field notes. Scientific names have not been independently verified in the source inventory.</p></div></div></section>}

      {page === 'spaces' && <section className="content-page"><div className="page-heading"><div><span className="section-kicker">CAMPUS ATLAS / 04</span><h1>{title}</h1><p>Explore the named green spaces maintained as part of the campus inventory.</p></div></div>{spaces.length ? <div className="space-grid">{spaces.map(space => <article className="space-card" key={space._id}><div className="space-image">{space.photos?.[0]?.url ? <img src={space.photos[0].url} alt={space.name}/> : <Icon name="sprout" size={42}/>}</div><div className="space-card-body"><span className="section-kicker">{space.zone?.name || 'CAMPUS GREEN'}</span><h2>{space.name}</h2><p>{space.description || 'No description added yet.'}</p><button className="text-button" onClick={() => { const coords=space.location?.coordinates; setMapFocus(space.locationVerified && coords?.length===2 ? {lat:coords[1],lng:coords[0]} : null); go('map') }}>Explore map <Icon name="arrow" size={16}/></button></div></article>)}</div> : <EmptyState icon="sprout" title="Green spaces will grow here" text="No published green-space records are available yet. An admin can create the first record with verified details and real location data."/>}</section>}

      {page === 'gallery' && <section className="content-page"><div className="page-heading"><div><span className="section-kicker">FIELD JOURNAL / 05</span><h1>{title}</h1><p>Photographs uploaded from real field documentation, not sample imagery.</p></div></div><div className="gallery-filters" role="group" aria-label="Filter gallery images">{[['all','All photographs'],['field-visit','Field visits'],['tree','Trees'],['green-space','Green spaces'],['community','Community']].map(([value,label])=><button key={value} className={galleryFilter===value?'selected':''} onClick={()=>setGalleryFilter(value)}>{label}</button>)}</div>{filteredGallery.length ? <div className="gallery-grid">{filteredGallery.map(image => <figure className="gallery-item" key={image._id}><img src={image.imageUrl} alt={image.altText || image.title || 'Campus field documentation'}/><figcaption><span>{(image.category || 'field-visit').replace('-', ' ')}</span><strong>{image.title}</strong>{image.description && <p>{image.description}</p>}</figcaption></figure>)}</div> : <EmptyState icon="image" title={gallery.length ? 'No photographs in this category' : 'The field journal is waiting'} text={gallery.length ? 'Choose another category to see more uploaded field photographs.' : 'Images will appear after an authorized admin uploads real campus photographs to Cloudinary.'}/>}</section>}

      {page === 'survey' && <section className="content-page survey-page"><div className="survey-intro"><span className="section-kicker">COMMUNITY FIELD NOTES / 06</span><h1>{title}</h1><p>Small observations help shape more thoughtful care for campus green spaces. Responses are reviewed by the GreenMap administrator.</p><div className="survey-stamp"><Icon name="sprout" size={20}/><span>THEEM CAMPUS<br/><b>GREEN COVER INITIATIVE</b></span></div></div><div className="survey-form-wrap">{surveyDone ? <div className="success-panel"><span className="success-icon"><Icon name="check" size={28}/></span><h2>Thank you for contributing.</h2><p>Your response has been saved by the GreenMap server.</p><button className="button button-primary" onClick={() => {setSurveyDone(false); setSurveyForm({ ageGroup: '', zone: '', awareness: '', greenSpaceImportance: '', treeCareAwareness: '', participationInterest: '', suggestions: '' })}}>Submit another response</button></div> : <form className="survey-form" onSubmit={submitSurvey}><div className="form-heading"><span className="section-kicker">YOUR RESPONSE</span><span className="optional-label">No account required</span></div><label>Age group<select required value={surveyForm.ageGroup} onChange={e => setSurveyForm({...surveyForm, ageGroup:e.target.value})}><option value="">Select age group</option><option>Under 18</option><option>18–22</option><option>23–30</option><option>Above 30</option><option>Prefer not to say</option></select></label><label>Which campus zone do you know best?<select required value={surveyForm.zone} onChange={e => setSurveyForm({...surveyForm, zone:e.target.value})}><option value="">Choose a zone</option>{surveyZones.map(z => <option key={z.name} value={z.name}>{z.name}</option>)}</select></label><fieldset><legend>How aware are you of the campus trees?</legend><div className="choice-row">{['Very aware','Somewhat','Not much'].map(v => <label key={v} className={surveyForm.awareness === v ? 'choice selected' : 'choice'}><input type="radio" required name="awareness" value={v} checked={surveyForm.awareness === v} onChange={e => setSurveyForm({...surveyForm, awareness:e.target.value})}/><span>{v}</span></label>)}</div></fieldset><fieldset><legend>How important is green space on campus?</legend><div className="choice-row">{['Very important','Important','Not sure'].map(v => <label key={v} className={surveyForm.greenSpaceImportance === v ? 'choice selected' : 'choice'}><input type="radio" required name="greenSpaceImportance" value={v} checked={surveyForm.greenSpaceImportance === v} onChange={e => setSurveyForm({...surveyForm, greenSpaceImportance:e.target.value})}/><span>{v}</span></label>)}</div></fieldset><label>How aware are you of tree-care needs on campus?<select value={surveyForm.treeCareAwareness} onChange={e => setSurveyForm({...surveyForm, treeCareAwareness:e.target.value})}><option value="">Choose one (optional)</option><option>Very aware</option><option>Somewhat aware</option><option>Not aware</option></select></label><label>Would you participate in a tree-care activity?<select required value={surveyForm.participationInterest} onChange={e => setSurveyForm({...surveyForm, participationInterest:e.target.value})}><option value="">Choose one</option><option>Yes</option><option>Maybe</option><option>No</option></select></label><label>Suggestions <span className="optional-label">Optional</span><textarea rows="4" maxLength="1200" value={surveyForm.suggestions} onChange={e => setSurveyForm({...surveyForm, suggestions:e.target.value})} placeholder="What could make our campus greener?"/></label>{surveyError && <p className="form-error" role="alert">{surveyError}</p>}<button className="button button-primary button-full" type="submit">Submit survey <Icon name="arrow" size={16}/></button><p className="form-privacy">Responses are stored privately and visible only to an authorized administrator.</p></form>}</div></section>}

      {page === 'about' && <section className="content-page about-page"><div className="about-heading"><span className="section-kicker">ABOUT THE PROJECT</span><h1>{title}</h1><p>GreenMap is a digital field notebook for campus trees and green-cover documentation at Theem College of Engineering, Betegaon, Chilhar Road.</p></div><div className="about-grid"><article><span>01</span><Icon name="tree" size={24}/><h2>Record honestly</h2><p>The survey summary records {surveyTotal} trees. Tree-level details appear only when real individual records are entered into the database.</p></article><article><span>02</span><Icon name="pin" size={24}/><h2>Map what is known</h2><p>Map markers require actual saved coordinates. Unknown locations remain unknown rather than being estimated from a zone name.</p></article><article><span>03</span><Icon name="shield" size={24}/><h2>Keep data accountable</h2><p>Only authorized administrators can create, verify, edit or remove official tree records. Public survey feedback is private.</p></article></div><div className="survey-caveat"><b>Field inventory note</b><p>Survey date: {surveyDate}. Condition totals: {surveyConditions.map(item => `${item.count} ${item.name.toLowerCase()}`).join(', ')}. Common names were recorded from field notes; scientific names require independent verification.</p></div></section>}

      {page === 'admin' && <section className="content-page admin-page"><div className="page-heading admin-page-heading"><div><span className="section-kicker">GREENMAP / SECURE AREA</span><h1>{sessionUser ? 'Admin workspace' : 'Authorized access only'}</h1><p>{sessionUser ? 'Manage individually recorded trees, campus spaces and field documentation.' : 'Sign in to manage verified tree records, campus zones and field documentation.'}</p></div>{sessionUser && <button className="button button-outline" onClick={logout}>Sign out</button>}</div>{!sessionUser ? <form className="login-card" onSubmit={submitLogin}><div className="login-lock"><Icon name="lock" size={25}/></div><span className="section-kicker">PROTECTED ADMIN SESSION</span><h2>Welcome back.</h2><p>Use the administrator account provisioned on the server. Public registration is disabled.</p><label>Admin username<input name="username" autoComplete="username" required placeholder="Username"/></label><label>Password<input name="password" type="password" autoComplete="current-password" minLength="6" required placeholder="Password"/></label>{loginError && <p className="form-error" role="alert">{loginError}</p>}<button className="button button-primary button-full" disabled={loginBusy}>{loginBusy ? 'Signing in…' : 'Sign in securely'} <Icon name="arrow" size={16}/></button><p className="form-privacy">Only a provisioned active administrator can sign in.</p></form> : <><div className="admin-tabs">{[['trees','Tree records'],['import','Import CEP data'],['spaces','Green spaces'],['gallery','Gallery'],['responses','Survey responses'],['zones','Campus zones'],['summary','Survey summary'],['logs','Audit log'],['reset','Reset content']].map(([v,label]) => <button key={v} className={adminTab === v ? 'selected' : ''} onClick={() => {setAdminTab(v); setAdminMessage('');setAdminError('')}}>{label}</button>)}</div>{adminTab === 'trees' && <div className="admin-workgrid"><form className="admin-form" onSubmit={saveTree}><div className="form-heading"><div><span className="section-kicker">{editingTree ? 'EDIT RECORD' : 'NEW INDIVIDUAL RECORD'}</span><h2>{editingTree ? 'Update tree details' : 'Add a tree'}</h2></div>{editingTree && <button type="button" className="text-button" onClick={resetTreeForm}>Cancel edit</button>}</div><div className="form-two"><label>Tree ID<input value={treeForm.treeId} required onChange={e=>setTreeForm({...treeForm,treeId:e.target.value})} placeholder="e.g. TG-001"/></label><label>Common name<input value={treeForm.commonName} required onChange={e=>setTreeForm({...treeForm,commonName:e.target.value})} placeholder="Recorded name"/></label></div><label>Scientific name <span className="optional-label">If verified</span><input value={treeForm.scientificName} onChange={e=>setTreeForm({...treeForm,scientificName:e.target.value})} placeholder="Leave blank if unknown"/></label><div className="form-two"><label>Zone<select value={treeForm.zone} onChange={e=>setTreeForm({...treeForm,zone:e.target.value})}><option value="">Not assigned</option>{zones.map(z=><option key={z._id||z.slug} value={z._id||z.slug}>{z.name}</option>)}</select></label><label>Observed condition<select value={treeForm.condition} onChange={e=>setTreeForm({...treeForm,condition:e.target.value})}><option value="healthy">Healthy</option><option value="needs_attention">Needs attention</option><option value="uncertain">Uncertain</option></select></label></div><label>Selected place / address<input maxLength="300" value={treeForm.locationLabel} onChange={e=>setTreeForm({...treeForm,locationLabel:e.target.value})} placeholder="Choose a place on the map or enter an address"/></label><div className="form-two"><label>Latitude<input inputMode="decimal" value={treeForm.latitude} onChange={e=>setTreeForm({...treeForm,latitude:e.target.value})} placeholder="Auto-filled from map"/></label><label>Longitude<input inputMode="decimal" value={treeForm.longitude} onChange={e=>setTreeForm({...treeForm,longitude:e.target.value})} placeholder="Auto-filled from map"/></label></div><p className="admin-help">Selecting a point on the map saves its coordinates. Only mark a point after confirming it matches the real tree location.</p><button type="button" className="button button-outline button-full" onClick={()=>setLocationPicker(!locationPicker)}><Icon name="pin" size={16}/>{locationPicker ? 'Hide location picker' : 'Choose location on map'}</button>{locationPicker && <LeafletMap trees={[]} editable selectedLocation={treeForm.latitude && treeForm.longitude ? {lat:Number(treeForm.latitude),lng:Number(treeForm.longitude)} : null} selectedLocationLabel={treeForm.locationLabel} onPick={point=>setTreeForm(current=>({...current,latitude:String(point.lat),longitude:String(point.lng),locationLabel:Object.prototype.hasOwnProperty.call(point,'label') ? (point.label || '') : '',locationVerified:Boolean(point.lat && point.lng)}))}/>}<label>Field notes<textarea rows="3" value={treeForm.notes} onChange={e=>setTreeForm({...treeForm,notes:e.target.value})} placeholder="Observations, source, maintenance needs…"/></label><label>Photo description (alt text)<input value={treeForm.photoAltText} onChange={e=>setTreeForm({...treeForm,photoAltText:e.target.value})} maxLength="180" placeholder="Describe the tree photo for accessibility"/></label><label>Tree photograph <span className="optional-label">JPG, PNG or WEBP · up to 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp"/></label>{adminError && <p className="form-error" role="alert">{adminError}</p>}{adminMessage && <p className="form-success" role="status">{adminMessage}</p>}<button className="button button-primary button-full" type="submit"><Icon name="plus" size={16}/>{editingTree ? 'Save changes' : 'Create pending record'}</button></form><div className="admin-records"><div className="section-heading"><div><span className="section-kicker">INVENTORY ADMIN</span><h2>Individual tree records</h2></div><span className="chart-total">{trees.length}</span></div>{trees.length ? <div className="record-list">{trees.map(tree=><article className="record-row" key={tree._id}><span className="record-tree-icon"><Icon name="tree" size={19}/></span><div className="record-main"><b>{tree.commonName}</b><small>{tree.treeId} · {tree.zone?.name || 'No zone'}</small><span className={`record-status ${tree.verificationStatus}`}>{tree.verificationStatus || 'pending'}</span></div><div className="record-actions"><button title="Edit record" onClick={()=>editTree(tree)}>Edit</button>{tree.verificationStatus !== 'verified' && <button title="Verify and publish" onClick={()=>verifyTree(tree,'verified')}>Verify</button>}<button title="Delete record" className="danger-action" onClick={()=>deleteTree(tree)}>Delete</button></div></article>)}</div> : <EmptyState title="No individual records yet" text="Add a tree from the actual field survey. The aggregate count of 38 is not auto-expanded into invented records."/>}</div></div>}{adminTab === 'import' && <CepImportPanel refresh={loadAll} report={setAdminMessage} error={setAdminError} adminMessage={adminMessage} adminError={adminError}/>}{adminTab === 'spaces' && <AdminSpaces spaces={spaces} zones={zones} refresh={loadAll} report={setAdminMessage} error={setAdminError} adminMessage={adminMessage} adminError={adminError}/ >}{adminTab === 'zones' && <AdminZones zones={zones} refresh={loadAll} report={setAdminMessage} error={setAdminError} adminMessage={adminMessage} adminError={adminError}/ >}{adminTab === 'logs' && <AuditLogPanel/>}{adminTab === 'gallery' && <AdminGallery gallery={gallery} refresh={loadAll} report={setAdminMessage} error={setAdminError} adminMessage={adminMessage} adminError={adminError}/ >}{adminTab === 'responses' && <SurveyResponses/>}{adminTab === 'summary' && <SurveySummaryForm summary={summary} refresh={loadAll} report={setAdminMessage} error={setAdminError} adminMessage={adminMessage} adminError={adminError}/ >}{adminTab === 'reset' && <ContentResetPanel report={setAdminMessage} error={setAdminError} adminMessage={adminMessage} adminError={adminError} onReset={async()=>{await loadAll();setSummary(null);setTrees([]);setTreeTotal(0);setZones([]);setSpaces([]);setGallery([]);setAdminTab('trees');setTreeForm({treeId:'',commonName:'',scientificName:'',zone:'',condition:'healthy',notes:'',latitude:'',longitude:'',locationLabel:'',locationVerified:false,photoAltText:''});setEditingTree(null)}}/>}</>}</section>}
    </main>
    <footer className="site-footer"><button className="footer-brand" onClick={()=>go('home')}><span className="brand-mark"><Icon name="leaf" size={21}/></span><b>green<span>map</span></b></button><p>Protect the record. Grow the impact.</p><div className="footer-links"><button onClick={()=>go('about')}>About</button><button onClick={()=>go('survey')}>Survey</button><button onClick={()=>go('admin')}>Admin access</button></div><small>THEEM COLLEGE OF ENGINEERING · BETEGAON · 2026</small></footer>
  </div>
}




function CepImportPanel({ refresh, report, error, adminMessage, adminError }) {
  const [busy, setBusy] = useState(false)
  async function importInventory() {
    if (!window.confirm('Import the 38 reconstructed CEP rows? Existing tree records will be preserved and will not be overwritten.')) return
    setBusy(true); report(''); error('')
    try {
      const result = await request('/admin/import-cep-trees', { method: 'POST', body: JSON.stringify({}) })
      report(`CEP import complete. Added ${result.createdTrees} tree records; preserved ${result.existingTreesPreserved} existing records. Added ${result.createdZones} zones. ${result.createdSurveySummary ? 'Survey summary created.' : 'Existing survey summary preserved.'}`)
      await refresh()
    } catch (err) { error(err.message || 'CEP inventory import failed.') }
    finally { setBusy(false) }
  }
  return <div className="admin-workgrid cep-import-grid">
    <div className="admin-records">
      <span className="section-kicker">CEP FIELD INVENTORY / 20 SEPTEMBER 2026</span>
      <h2>Import the 38 report rows</h2>
      <p>The report provides 38 reconstructed rows using IDs T-001 through T-038, common names and survey zones. This imports the available report data into MongoDB Atlas in one action.</p>
      <div className="summary-rule"><b>Main Ground</b><span>10 rows</span></div>
      <div className="summary-rule"><b>Volleyball Ground</b><span>21 rows</span></div>
      <div className="summary-rule"><b>Parking</b><span>7 rows</span></div>
      <div className="summary-rule"><b>Flower Garden</b><span>0 rows</span></div>
      <p className="admin-help">Import is safe to repeat: it only inserts missing rows, creates missing zones, and creates the survey summary only if one does not already exist.</p>
      {adminError&&<p className="form-error" role="alert">{adminError}</p>}{adminMessage&&<p className="form-success" role="status">{adminMessage}</p>}
      <button className="button button-primary" disabled={busy} onClick={importInventory}><Icon name="database" size={16}/>{busy?'Importing CEP data…':'Import 38 CEP tree rows'}</button>
    </div>
    <aside className="admin-records import-integrity">
      <span className="section-kicker">DATA QUALITY / IMPORTANT</span><h2>What will and will not be imported</h2>
      <p><b>Included:</b> report IDs, common names, campus survey zones, survey date and aggregate counts.</p>
      <p><b>Pending verification:</b> each reconstructed row will stay in the public catalogue with a pending status so the admin can correct and verify it.</p>
      <p><b>Not invented:</b> the report does not link individual conditions, exact GPS coordinates or the ten available photographs to specific tree IDs. These fields remain unverified or empty.</p>
      <p>The public map shows a campus marker for Theem College of Engineering, Village Betegaon, Boisar Chilhar Road. Individual tree pins will appear after the admin records and verifies each actual tree’s GPS location.</p>
    </aside>
  </div>
}

function parseCountLines(source, label) {
  const rows = source.split('\n').map(line => line.trim()).filter(Boolean).map((line, index) => {
    const parts = line.split('|')
    if (parts.length < 2) throw new Error(`${label}, line ${index + 1}: use Name | Count.`)
    const name = parts.slice(0, -1).join('|').trim()
    const countText = parts.at(-1).trim()
    const count = Number(countText)
    if (!name || !Number.isInteger(count) || count < 0 || count > 100000) {
      throw new Error(`${label}, line ${index + 1}: enter a name and a whole count from 0 to 100000.`)
    }
    return { name, count }
  })
  const names = rows.map(row => row.name.toLowerCase())
  if (new Set(names).size !== names.length) throw new Error(`${label} contains duplicate names.`)
  return rows
}

function SurveySummaryForm({ summary, refresh, report, error, adminMessage, adminError }) {
  const toLines = items => (items || []).map(item => `${item.name} | ${item.count}`).join('\n')
  const formFromSummary = item => ({
    surveyDate: item?.surveyDate ? new Date(item.surveyDate).toISOString().slice(0, 10) : '',
    totalTrees: String(item?.totalTrees ?? 0),
    zoneCounts: toLines(item?.zoneCounts),
    healthy: String(item?.conditionCounts?.healthy ?? 0),
    needsAttention: String(item?.conditionCounts?.needsAttention ?? 0),
    uncertain: String(item?.conditionCounts?.uncertain ?? 0),
    speciesCounts: toLines(item?.speciesCounts),
    verificationStatus: item?.verificationStatus || 'provisional',
    sourceNotes: item?.sourceNotes || '',
  })
  const [form, setForm] = useState(() => formFromSummary(summary))
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(formFromSummary(summary)) }, [summary])
  function change(key, value) { setForm(current => ({ ...current, [key]: value })) }
  async function submit(event) {
    event.preventDefault(); report(''); error(''); setSaving(true)
    try {
      if (!form.surveyDate) throw new Error('Choose the field survey date.')
      const totalTrees = Number(form.totalTrees)
      const conditions = { healthy: Number(form.healthy), needsAttention: Number(form.needsAttention), uncertain: Number(form.uncertain) }
      if (!Number.isInteger(totalTrees) || totalTrees < 0 || totalTrees > 100000) throw new Error('Total trees must be a whole number from 0 to 100000.')
      if (Object.values(conditions).some(value => !Number.isInteger(value) || value < 0 || value > 100000)) throw new Error('Condition counts must be whole numbers from 0 to 100000.')
      const zoneCounts = parseCountLines(form.zoneCounts, 'Zone counts')
      const speciesCounts = parseCountLines(form.speciesCounts, 'Species counts')
      if (Object.values(conditions).reduce((sum, value) => sum + value, 0) !== totalTrees) throw new Error('Healthy + Needs attention + Uncertain must equal the total trees.')
      if (zoneCounts.reduce((sum, item) => sum + item.count, 0) !== totalTrees) throw new Error('The sum of zone counts must equal the total trees.')
      if (speciesCounts.reduce((sum, item) => sum + item.count, 0) !== totalTrees) throw new Error('The sum of species/category counts must equal the total trees.')
      const result = await request('/admin/survey-summary', { method: 'PUT', body: JSON.stringify({ surveyDate: form.surveyDate, totalTrees, zoneCounts, conditionCounts: conditions, speciesCounts, verificationStatus: form.verificationStatus, sourceNotes: form.sourceNotes }) })
      report(`Survey summary saved: ${result.summary.totalTrees} survey-reported trees.`)
      await refresh()
    } catch (err) { error(err.message || 'Could not save the survey summary.') }
    finally { setSaving(false) }
  }
  return <div className="admin-workgrid summary-admin-grid">
    <form className="admin-form" onSubmit={submit}>
      <span className="section-kicker">AGGREGATE FIELD SURVEY</span><h2>{summary ? 'Edit survey summary' : 'Add survey summary'}</h2>
      <p className="admin-help">These are survey totals, not individual tree records. Add real observations only; map markers are created separately in Tree records.</p>
      <div className="form-two"><label>Survey date<input type="date" required value={form.surveyDate} onChange={e=>change('surveyDate',e.target.value)}/></label><label>Total trees in survey<input type="number" min="0" max="100000" required value={form.totalTrees} onChange={e=>change('totalTrees',e.target.value)}/></label></div>
      <label>Zone counts <span className="optional-label">One per line: Name | Count</span><textarea rows="5" value={form.zoneCounts} onChange={e=>change('zoneCounts',e.target.value)} placeholder={'Main Ground | 10\nVolleyball Ground | 21\nParking | 7\nFlower Garden | 0'}/></label>
      <div className="form-three"><label>Healthy<input type="number" min="0" value={form.healthy} onChange={e=>change('healthy',e.target.value)}/></label><label>Needs attention<input type="number" min="0" value={form.needsAttention} onChange={e=>change('needsAttention',e.target.value)}/></label><label>Uncertain<input type="number" min="0" value={form.uncertain} onChange={e=>change('uncertain',e.target.value)}/></label></div>
      <label>Species / category counts <span className="optional-label">One per line: Name | Count</span><textarea rows="7" value={form.speciesCounts} onChange={e=>change('speciesCounts',e.target.value)} placeholder={'Neem | 2\nGulmohar | 9\nOther / not identified | 7'}/></label>
      <div className="form-two"><label>Summary status<select value={form.verificationStatus} onChange={e=>change('verificationStatus',e.target.value)}><option value="provisional">Provisional</option><option value="verified">Verified</option></select></label><label>Source note<input maxLength="2000" value={form.sourceNotes} onChange={e=>change('sourceNotes',e.target.value)} placeholder="Field report / survey source"/></label></div>
      {adminError&&<p className="form-error" role="alert">{adminError}</p>}{adminMessage&&<p className="form-success" role="status">{adminMessage}</p>}
      <button className="button button-primary button-full" disabled={saving}>{saving?'Saving summary…':'Save survey summary'}</button>
    </form>
    <aside className="admin-records"><span className="section-kicker">DATA INTEGRITY</span><h2>Keep the numbers consistent</h2><p>The total in the summary appears in Insights. Individual tree records are managed in a separate tab and must be entered one by one.</p><div className="summary-rule"><b>Condition total</b><span>{Number(form.healthy||0)+Number(form.needsAttention||0)+Number(form.uncertain||0)} / {Number(form.totalTrees||0)}</span></div><div className="summary-rule"><b>Zone count total</b><span>{form.zoneCounts.split('\n').map(line=>line.trim()).filter(Boolean).reduce((sum,line)=>sum+Number((line.split('|').at(-1)||'').trim()),0)} / {Number(form.totalTrees||0)}</span></div><div className="summary-rule"><b>Species count total</b><span>{form.speciesCounts.split('\n').map(line=>line.trim()).filter(Boolean).reduce((sum,line)=>sum+Number((line.split('|').at(-1)||'').trim()),0)} / {Number(form.totalTrees||0)}</span></div></aside>
  </div>
}

function ContentResetPanel({ report, error, adminMessage, adminError, onReset }) {
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  async function reset() {
    if (confirmation !== 'CLEAR GREENMAP CONTENT') { error('Type CLEAR GREENMAP CONTENT exactly to confirm.'); return }
    if (!window.confirm('This permanently deletes tree records, campus zones, green spaces, gallery images, survey responses, and the aggregate survey summary. Continue?')) return
    setBusy(true); report(''); error('')
    try {
      const result = await request('/admin/reset-content', { method: 'POST', body: JSON.stringify({ confirmation }) })
      const counts = result.deleted || {}
      report(`Content cleared. Trees: ${counts.trees||0}; green spaces: ${counts.greenSpaces||0}; images: ${counts.galleryImages||0}; zones: ${counts.campusZones||0}; responses: ${counts.surveyResponses||0}; summaries: ${counts.surveySummaries||0}. Admin account, sessions and audit history were preserved.`)
      setConfirmation('')
      await onReset()
    } catch (err) { error(err.message || 'Content reset failed.') }
    finally { setBusy(false) }
  }
  return <div className="reset-panel admin-records">
    <span className="section-kicker">DESTRUCTIVE ACTION / ADMIN ONLY</span><h2>Clear GreenMap content</h2>
    <p>This removes individual trees, photos linked to those records, campus green spaces, gallery images, campus zones, public survey responses and the aggregate survey summary. It does <b>not</b> delete your administrator account, login sessions or audit history.</p>
    <p>Make sure you have a backup first. Content can only be added again through the admin forms after the reset.</p>
    <label>Type <code>CLEAR GREENMAP CONTENT</code> to confirm<input value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="off" placeholder="Type confirmation phrase"/></label>
    {adminError&&<p className="form-error" role="alert">{adminError}</p>}{adminMessage&&<p className="form-success" role="status">{adminMessage}</p>}
    <button className="button button-danger" disabled={busy||confirmation!=='CLEAR GREENMAP CONTENT'} onClick={reset}>{busy?'Clearing content…':'Clear all content data'}</button>
  </div>
}


function AdminZones({zones,refresh,report,error,adminMessage,adminError}) {
  const [form,setForm]=useState({name:'',description:'',sortOrder:String(zones.length+1)})
  async function submit(e){e.preventDefault();report('');error('');try{await request('/zones',{method:'POST',body:JSON.stringify({...form,sortOrder:Number(form.sortOrder)||0})});setForm({name:'',description:'',sortOrder:String(zones.length+2)});report('Campus zone created.');await refresh()}catch(err){error(err.message)}}
  async function remove(zone){if(!window.confirm('Delete campus zone "'+zone.name+'"? Zones with linked trees or green spaces cannot be deleted.'))return;try{await request('/zones/'+zone._id,{method:'DELETE'});report('Zone deleted.');await refresh()}catch(err){error(err.message)}}
  return <div className="admin-workgrid"><form className="admin-form" onSubmit={submit}><span className="section-kicker">CAMPUS ZONE MANAGEMENT</span><h2>Add a campus zone</h2><label>Name<input required minLength="2" maxLength="100" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>Display order<input type="number" min="0" max="10000" value={form.sortOrder} onChange={e=>setForm({...form,sortOrder:e.target.value})}/></label><label>Description<textarea rows="4" maxLength="1000" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>{adminError&&<p className="form-error">{adminError}</p>}{adminMessage&&<p className="form-success">{adminMessage}</p>}<button className="button button-primary button-full">Create zone</button></form><div className="admin-records"><h2>Campus zones ({zones.length})</h2>{zones.map(zone=><article className="record-row" key={zone._id||zone.slug}><div className="record-main"><b>{zone.name}</b><small>{zone.slug}</small></div>{zone._id&&<button className="danger-action" onClick={()=>remove(zone)}>Delete</button>}</article>)}</div></div>
}
function AuditLogPanel(){
 const [items,setItems]=useState([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true)
 const load=useCallback(async()=>{setLoading(true);try{const result=await request('/admin/audit-logs?limit=100');setItems(result.items||[]);setError('')}catch(e){setError(e.message)}finally{setLoading(false)}},[])
 useEffect(()=>{load()},[load])
 return <div className="admin-records"><div className="section-heading"><div><span className="section-kicker">ACCOUNTABILITY / HISTORY</span><h2>Administrative activity</h2></div><button className="button button-outline" onClick={load}>Refresh</button></div>{error&&<p className="form-error">{error}</p>}{loading?<p>Loading audit log…</p>:items.length?items.map(item=><article className="record-row" key={item._id}><span className="record-tree-icon"><Icon name="shield" size={18}/></span><div className="record-main"><b>{item.action} · {item.entityType}</b><small>{item.actor?.displayName||item.actor?.username||'Admin'} · {item.entityId||'—'}</small></div><small>{new Date(item.createdAt).toLocaleString()}</small></article>):<EmptyState title="No activity recorded yet" text="Admin changes and authentication events will appear here."/>}</div>
}

function AdminSpaces({ spaces, zones, refresh, report, error, adminMessage, adminError }) {
  const emptyForm = { name: '', description: '', zone: '', latitude: '', longitude: '', locationLabel: '', locationVerified: false, photoAltText: '' }
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [editing, setEditing] = useState(null)
  const [locationPicker, setLocationPicker] = useState(false)
  function reset(){setForm({...emptyForm});setFile(null);setEditing(null);setLocationPicker(false)}
  function edit(space){
    const coords=space.location?.coordinates
    setEditing(space)
    setForm({name:space.name||'',description:space.description||'',zone:space.zone?._id||'',latitude:coords?String(coords[1]):'',longitude:coords?String(coords[0]):'',locationLabel:space.locationLabel||'',locationVerified:Boolean(space.locationVerified),photoAltText:space.photos?.[0]?.altText||space.name||''})
    setFile(null);setLocationPicker(false);report('');error('')
  }
  async function submit(e){
    e.preventDefault();report('');error('')
    const hasLat=String(form.latitude).trim()!=='',hasLng=String(form.longitude).trim()!==''
    if(hasLat!==hasLng){error('Enter both latitude and longitude, or leave both blank.');return}
    if(hasLat&&(!Number.isFinite(Number(form.latitude))||!Number.isFinite(Number(form.longitude))||Math.abs(Number(form.latitude))>90||Math.abs(Number(form.longitude))>180)){error('Enter valid latitude and longitude values.');return}
    try{
      const payload={name:form.name,description:form.description,zone:form.zone||null,status:'published',latitude:hasLat?Number(form.latitude):null,longitude:hasLng?Number(form.longitude):null,locationLabel:hasLat?form.locationLabel:'',locationVerified:Boolean(hasLat)}
      const result=editing
        ? await request('/green-spaces/'+editing._id,{method:'PATCH',body:JSON.stringify(payload)})
        : await request('/green-spaces',{method:'POST',body:JSON.stringify(payload)})
      const item=result.item
      if(file&&item?._id){const data=new FormData();data.append('image',file);data.append('altText',form.photoAltText||form.name);await request('/green-spaces/'+item._id+'/photos',{method:'POST',body:data})}
      report(editing?'Green space updated.':'Green space created.')
      reset();await refresh()
    }catch(err){error(err.message)}
  }
  async function remove(space){
    if(!window.confirm('Delete '+space.name+'?'))return
    try{await request('/green-spaces/'+space._id,{method:'DELETE'});report('Green space deleted.');if(editing?._id===space._id)reset();await refresh()}
    catch(err){error(err.message)}
  }
  return <div className="admin-workgrid">
    <form className="admin-form" onSubmit={submit}>
      <span className="section-kicker">GREEN SPACE MANAGEMENT</span><h2>{editing?'Edit green space':'Add a green space'}</h2>
      <label>Name<input required maxLength="140" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label>Zone<select value={form.zone} onChange={e=>setForm({...form,zone:e.target.value})}><option value="">No zone</option>{zones.map(z=><option key={z._id||z.slug} value={z._id||z.slug}>{z.name}</option>)}</select></label>
      <label>Description<textarea rows="4" maxLength="2000" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <label>Selected place / address<input maxLength="300" value={form.locationLabel} onChange={e=>setForm({...form,locationLabel:e.target.value})} placeholder="Choose a place on the map or enter an address"/></label><div className="form-two"><label>Latitude<input inputMode="decimal" value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})} placeholder="Auto-filled from map"/></label><label>Longitude<input inputMode="decimal" value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})} placeholder="Auto-filled from map"/></label></div>
      <p className="admin-help">Choose the actual green-space location on the map before saving coordinates.</p>
      <button type="button" className="button button-outline button-full" onClick={()=>setLocationPicker(!locationPicker)}><Icon name="pin" size={16}/>{locationPicker?'Hide location picker':'Choose location on map'}</button>
      {locationPicker&&<LeafletMap trees={[]} editable selectedLocation={form.latitude&&form.longitude?{lat:Number(form.latitude),lng:Number(form.longitude)}:null} selectedLocationLabel={form.locationLabel} onPick={point=>setForm(current=>({...current,latitude:String(point.lat),longitude:String(point.lng),locationLabel:Object.prototype.hasOwnProperty.call(point,'label') ? (point.label || '') : '',locationVerified:Boolean(point.lat&&point.lng)}))}/>}
      <label>Photo description (alt text)<input maxLength="180" value={form.photoAltText} onChange={e=>setForm({...form,photoAltText:e.target.value})} placeholder="Describe the photograph"/></label>
      <label>Photograph <span className="optional-label">Optional · JPG, PNG or WEBP, up to 5 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
      {adminError&&<p className="form-error" role="alert">{adminError}</p>}{adminMessage&&<p className="form-success" role="status">{adminMessage}</p>}
      <button className="button button-primary button-full">{editing?'Save changes':'Create green space'}</button>{editing&&<button type="button" className="button button-outline button-full" onClick={reset}>Cancel edit</button>}
    </form>
    <div className="admin-records"><h2>Green spaces ({spaces.length})</h2>{spaces.map(space=><article className="record-row" key={space._id}>{space.photos?.[0]?.url&&<img className="record-thumb" src={space.photos[0].url} alt={space.name}/>}<div className="record-main"><b>{space.name}</b><small>{space.zone?.name||'No zone assigned'}</small><small>{space.locationLabel||'Address not recorded'}</small><small>{space.locationVerified?'Location verified':'Location not verified'}</small></div><div className="record-actions"><button onClick={()=>edit(space)}>Edit</button><button className="danger-action" onClick={()=>remove(space)}>Delete</button></div></article>)}{!spaces.length&&<EmptyState icon="sprout" title="No green spaces yet" text="Add the first documented campus space."/>}</div>
  </div>
}

function AdminGallery({ gallery, refresh, report, error, adminMessage, adminError }) {
  const [form,setForm]=useState({title:'',description:'',category:'field-visit',altText:''})
  const [file,setFile]=useState(null)
  async function submit(e){e.preventDefault();report('');error('');if(!file){error('Choose an image first.');return}try{const data=new FormData();Object.entries(form).forEach(([k,v])=>data.append(k,v));data.append('image',file);await request('/gallery',{method:'POST',body:data});setForm({title:'',description:'',category:'field-visit',altText:''});setFile(null);report('Gallery image uploaded.');await refresh()}catch(err){error(err.message)}}
  async function remove(item){if(!window.confirm('Remove this gallery image?'))return;try{await request(`/gallery/${item._id}`,{method:'DELETE'});report('Image removed.');await refresh()}catch(err){error(err.message)}}
  return <div className="admin-workgrid"><form className="admin-form" onSubmit={submit}><span className="section-kicker">CLOUDINARY GALLERY</span><h2>Upload a field photograph</h2><label>Title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="field-visit">Field visit</option><option value="tree">Tree</option><option value="green-space">Green space</option><option value="community">Community</option></select></label><label>Alt text<input value={form.altText} onChange={e=>setForm({...form,altText:e.target.value})}/></label><label>Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>Image file<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e=>setFile(e.target.files?.[0]||null)}/></label>{adminError&&<p className="form-error">{adminError}</p>}{adminMessage&&<p className="form-success">{adminMessage}</p>}<button className="button button-primary button-full">Upload image</button></form><div className="admin-records"><h2>Gallery images ({gallery.length})</h2>{gallery.map(item=><div className="record-row" key={item._id}><img className="record-thumb" src={item.imageUrl} alt={item.altText||''}/><div className="record-main"><b>{item.title}</b><small>{item.category}</small></div><button className="danger-action" onClick={()=>remove(item)}>Delete</button></div>)}{!gallery.length&&<EmptyState icon="image" title="Gallery is empty" text="Upload genuine campus photographs to get started."/>}</div></div>
}

function SurveyResponses() {
  const [items,setItems] = useState([])
  const [message,setMessage] = useState('')
  const [error,setError] = useState('')
  const [loading,setLoading] = useState(true)
  const load = useCallback(async()=>{setLoading(true);try{const data=await request('/admin/survey-responses');setItems(data.items||[]);setError('')}catch(err){setError(err.message)}finally{setLoading(false)}},[])
  useEffect(()=>{load()},[load])
  async function markReviewed(item){try{await request(`/admin/survey-responses/${item._id}`,{method:'PATCH',body:JSON.stringify({status:'reviewed'})});setMessage('Survey response marked as reviewed.');setError('');await load()}catch(err){setError(err.message)}}
  async function remove(item){if(!window.confirm('Delete this survey response?'))return;try{await request(`/admin/survey-responses/${item._id}`,{method:'DELETE'});setMessage('Response deleted.');await load()}catch(err){setError(err.message)}}
  return <div className="admin-records"><div className="section-heading"><div><span className="section-kicker">COMMUNITY FEEDBACK</span><h2>Survey responses</h2></div><button className="button button-outline" onClick={load}>Refresh</button></div>{error&&<p className="form-error">{error}</p>}{message&&<p className="form-success">{message}</p>}{loading?<p>Loading responses…</p>:items.length?items.map(item=><article className="response-card" key={item._id}><div className="response-top"><b>{item.zone||'Zone not specified'}</b><small>{new Date(item.createdAt).toLocaleDateString()} · {item.status||'new'}</small></div><p><b>Awareness:</b> {item.awareness||'—'} · <b>Importance:</b> {item.greenSpaceImportance||'—'}</p><p><b>Participation:</b> {item.participationInterest||'—'}</p>{item.suggestions&&<blockquote>{item.suggestions}</blockquote>}{item.status!=='reviewed'&&<button className="button button-outline" onClick={()=>markReviewed(item)}>Mark reviewed</button>} <button className="danger-action" onClick={()=>remove(item)}>Delete response</button></article>):<EmptyState title="No survey responses yet" text="Public submissions will appear here after they are successfully saved."/>}</div>
}
export default App
