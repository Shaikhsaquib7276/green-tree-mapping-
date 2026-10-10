import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { GreenMapProvider, submitSurvey, supabase, VERIFIED_INVENTORY, useGreenMapData } from "./lib/greenmapData";

const _trees = [
  {
    id: "TREE-001",
    common: "Rain Tree",
    scientific: "Samanea saman",
    family: "Fabaceae",
    zone: "Central Lawn",
    condition: "Healthy",
    date: "2026-08-18",
    lat: 19.2818,
    lng: 73.0484,
    remark:
      "Broad canopy with healthy foliage. Sample record for interface testing.",
    image:
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "TREE-002",
    common: "Gulmohar",
    scientific: "Delonix regia",
    family: "Fabaceae",
    zone: "East Walkway",
    condition: "Fair",
    date: "2026-08-20",
    lat: 19.2829,
    lng: 73.0507,
    remark: "Some dry branches observed. Follow-up care recommended.",
    image:
      "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "TREE-003",
    common: "Indian Almond",
    scientific: "Terminalia catappa",
    family: "Combretaceae",
    zone: "Library Garden",
    condition: "Needs Attention",
    date: "2026-08-22",
    lat: 19.2807,
    lng: 73.0472,
    remark: "Soil around base appears compacted. Monitor after rainfall.",
    image:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "TREE-004",
    common: "Neem",
    scientific: "Azadirachta indica",
    family: "Meliaceae",
    zone: "North Boundary",
    condition: "Healthy",
    date: "2026-08-24",
    lat: 19.2836,
    lng: 73.0479,
    remark: "Dense foliage and strong trunk. Sample record.",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "TREE-005",
    common: "Coconut Palm",
    scientific: "Cocos nucifera",
    family: "Arecaceae",
    zone: "Community Garden",
    condition: "Damaged",
    date: "2026-08-25",
    lat: 19.2802,
    lng: 73.0501,
    remark: "Leaf damage noted; needs a repeat observation.",
    image:
      "https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=900&q=80",
  },
];
const _spaces = [
  {
    name: "Central Learning Lawn",
    type: "Lawn",
    location: "Central Lawn",
    area: "1,240 m²",
    condition: "Good",
    description:
      "Open lawn used for informal learning, community gatherings and shade from surrounding trees.",
  },
  {
    name: "Library Garden",
    type: "Garden",
    location: "Library Garden",
    area: "380 m²",
    condition: "Needs care",
    description:
      "A quiet planted edge beside the library with native and ornamental species.",
  },
  {
    name: "Community Food Patch",
    type: "Community garden",
    location: "South Courtyard",
    area: "210 m²",
    condition: "Developing",
    description:
      "A small shared plot being documented for future community stewardship.",
  },
];
const navItems = [
  ["Home", "#/"],
  ["Tree Map", "#/map"],
  ["Tree Catalogue", "#/trees"],
  ["Green Spaces", "#/green-spaces"],
  ["Statistics", "#/statistics"],
  ["Survey", "#/survey"],
  ["Gallery", "#/gallery"],
  ["About", "#/about"],
  ["Admin", "#/admin"],
];

function Icon({ name, size = 20 }) {
  const paths = {
    leaf: "M19 3C9 3 4 8 4 16c0 2 1 4 1 4s4-1 6-3c2-2 3-5 3-8M4 20c4-5 8-8 13-10",
    map: "M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15",
    tree: "M12 22V10M7 22h10M5 10l4-4 1 3 2-6 2 6 4 1-3 3z",
    arrow: "M5 12h14M13 6l6 6-6 6",
    search: "m21 21-4.3-4.3M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4z",
    menu: "M4 6h16M4 12h16M4 18h16",
    close: "M6 6l12 12M18 6 6 18",
    chart: "M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-7",
    camera: "M4 7h4l1.5-2h5L16 7h4v12H4zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.leaf} />
    </svg>
  );
}
function App() {
  const [route, setRoute] = useState(window.location.hash.slice(1) || "/");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTree, setSelectedTree] = useState(null);
  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash.slice(1) || "/");
      setMobileOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const page = route.startsWith("/trees/") ? (
    <TreeDetail id={route.split("/")[2]} />
  ) : route === "/" ? (
    <Home />
  ) : route === "/map" ? (
    <MapPage selectedTree={selectedTree} setSelectedTree={setSelectedTree} />
  ) : route === "/trees" ? (
    <Catalogue setSelectedTree={setSelectedTree} />
  ) : route === "/green-spaces" ? (
    <GreenSpaces />
  ) : route === "/statistics" ? (
    <Statistics />
  ) : route === "/survey" ? (
    <Survey />
  ) : route === "/admin" ? (
    <Admin />
  ) : route === "/gallery" ? (
    <Gallery />
  ) : (
    <About />
  );
  return (
    <GreenMapProvider>
      <div className="app-shell">
        <Header mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main>{page}</main>
        <Footer />
      </div>
    </GreenMapProvider>
  );
}
function Header({ mobileOpen, setMobileOpen }) {
  return (
    <header className="site-header">
      <a className="brand" href="#/">
        <span className="brand-mark">
          <Icon name="leaf" size={23} />
        </span>
        <span>
          <strong>GREENMAP</strong>
          <small>Tree mapping & green cover</small>
        </span>
      </a>
      <button
        className="icon-btn mobile-toggle"
        aria-label="Open navigation"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Icon name={mobileOpen ? "close" : "menu"} />
      </button>
      <nav className={mobileOpen ? "main-nav is-open" : "main-nav"}>
        {navItems.map(([label, href]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
        <a className="nav-cta" href="#/map">
          <Icon name="map" size={16} /> Explore map
        </a>
      </nav>
    </header>
  );
}
function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <a className="brand" href="#/">
            <span className="brand-mark">
              <Icon name="leaf" size={23} />
            </span>
            <span>
              <strong>GREENMAP</strong>
              <small>Digital tree mapping system</small>
            </span>
          </a>
          <p>
            A Community Engagement Project for documenting trees, green spaces
            and environmental awareness.
          </p>
          <div className="college-lockup">
            <span className="college-seal">T</span>
            <span>
              Theem College of Arts,
              <br />
              <b>Commerce & Science</b>
            </span>
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          {navItems.slice(0, 4).map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </div>
        <div>
          <h4>Project</h4>
          <a href="#/about">Methodology</a>
          <a href="#/survey">Community survey</a>
          <a href="#/gallery">Field gallery</a>
          <a href="#/statistics">Data insights</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © 2026 GreenMap · Academic and community engagement purposes
        </span>
        <span className="demo-note">
          All records shown are DEMO / SAMPLE DATA
        </span>
      </div>
    </footer>
  );
}
function PageIntro({ eyebrow, title, children }) {
  return (
    <section className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </section>
  );
}
function DemoNotice({ loading = false, demoMode = true }) {
  return (
    <div className="demo-notice">
      <span className="notice-dot" />
      <div>
        <b>{loading ? "Loading project data" : demoMode ? "Demo workspace" : "Live Supabase data"}</b>
        <span>
          {loading
            ? "Fetching the latest records from Supabase."
            : demoMode
              ? "You’re viewing sample records for interface testing. Replace these with verified field-survey data before presenting findings."
              : "This view is connected to the project database. Confirm that records are verified before presenting findings."}
        </span>
      </div>
      <a href="#/about">
        Data guidance <Icon name="arrow" size={15} />
      </a>
    </div>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow light">
            Community Engagement Project · Tree Mapping & Green Cover
          </span>
          <h1>
            Mapping nature.
            <br />
            <em>Understanding</em> our green cover.
          </h1>
          <p>
            GreenMap turns field observations into a living digital record of
            the trees and green spaces around us.
          </p>
          <div className="hero-actions">
            <a className="button button-light" href="#/map">
              Explore tree map <Icon name="arrow" size={17} />
            </a>
            <a className="text-link light-link" href="#/trees">
              View catalogue <Icon name="arrow" size={16} />
            </a>
          </div>
          <div className="hero-trust">
            <span className="college-seal large">T</span>
            <span>
              Academic project by
              <br />
              <b>Theem College of Arts, Commerce & Science</b>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="map-grid" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-tree">
            <div className="canopy canopy-back" />
            <div className="canopy canopy-front" />
            <div className="trunk" />
          </div>
          <div className="map-pin pin-a">
            <Icon name="tree" size={16} />
          </div>
          <div className="map-pin pin-b">
            <Icon name="leaf" size={16} />
          </div>
          <div className="map-pin pin-c">
            <Icon name="tree" size={16} />
          </div>
          <div className="visual-label">
            <span>LIVE VIEW</span>
            <b>
              Green cover mapped
              <br />
              one tree at a time
            </b>
          </div>
        </div>
      </section>
      <section className="section intro-band">
        <div className="section-heading">
          <span className="eyebrow">Why GreenMap</span>
          <h2>
            A clearer picture of the
            <br />
            <em>places we share.</em>
          </h2>
        </div>
        <div className="intro-copy">
          <p>
            GreenMap helps students and communities convert field observations
            into an organized, searchable record. Every tree can carry
            identification, location, condition and observation data, ready to
            be visualized and understood.
          </p>
          <a className="text-link" href="#/about">
            Learn about the project <Icon name="arrow" size={16} />
          </a>
        </div>
      </section>
      <section className="section how-section">
        <div className="section-heading centered">
          <span className="eyebrow">The field-to-map loop</span>
          <h2>
            Simple observations.
            <br />
            <em>Useful knowledge.</em>
          </h2>
        </div>
        <div className="steps">
          {[
            [
              "01",
              "Survey",
              "Walk the area and observe trees, green spaces and their context.",
              "tree",
            ],
            [
              "02",
              "Record",
              "Capture species, condition, location and notes in a consistent format.",
              "camera",
            ],
            [
              "03",
              "Map",
              "Place each verified record on a shared interactive map.",
              "map",
            ],
            [
              "04",
              "Analyse",
              "Look for patterns that support awareness and future care.",
              "chart",
            ],
          ].map(([n, t, d, i]) => (
            <div className="step" key={n}>
              <span className="step-no">{n}</span>
              <div className="step-icon">
                <Icon name={i} size={21} />
              </div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="feature-band">
        <div>
          <span className="eyebrow light">Explore the workspace</span>
          <h2>
            One place for the whole
            <br />
            <em>green cover story.</em>
          </h2>
        </div>
        <div className="feature-list">
          {[
            [
              "Interactive tree map",
              "See documented trees in their location context.",
              "map",
              "#/map",
            ],
            [
              "Tree catalogue",
              "Search, filter and open each documented record.",
              "tree",
              "#/trees",
            ],
            [
              "Green-cover insights",
              "Understand patterns without inventing findings.",
              "chart",
              "#/statistics",
            ],
            [
              "Community voice",
              "Collect awareness responses with care.",
              "leaf",
              "#/survey",
            ],
          ].map(([t, d, i, h]) => (
            <a href={h} className="feature-item" key={t}>
              <span className="feature-icon">
                <Icon name={i} size={19} />
              </span>
              <span>
                <b>{t}</b>
                <small>{d}</small>
              </span>
              <Icon name="arrow" size={17} />
            </a>
          ))}
        </div>
      </section>
      <section className="section cta-section">
        <div className="cta-mark">
          <Icon name="leaf" size={30} />
        </div>
        <span className="eyebrow">Ready to explore?</span>
        <h2>
          Start with one tree.
          <br />
          <em>See the bigger picture.</em>
        </h2>
        <a className="button button-dark" href="#/map">
          Open interactive map <Icon name="arrow" size={17} />
        </a>
      </section>
    </>
  );
}
function MapCanvas({ trees: mapTrees, spaces: mapSpaces, setSelectedTree, search, showTrees, showSpaces, mapRefCallback }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const layersRef = useRef({ trees: null, spaces: null });
  useEffect(() => {
    if (!mapRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([19.282, 73.049], 16);
    leafletRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    layersRef.current.trees = L.layerGroup().addTo(map);
    layersRef.current.spaces = L.layerGroup().addTo(map);
    mapRefCallback.current = map;
    return () => { map.remove(); leafletRef.current = null; };
  }, []);
  useEffect(() => {
    const map = leafletRef.current;
    if (!map || !layersRef.current.trees || !layersRef.current.spaces) return;
    const treeLayer = layersRef.current.trees;
    const spaceLayer = layersRef.current.spaces;
    treeLayer.clearLayers();
    spaceLayer.clearLayers();
    const query = search.trim().toLowerCase();
    const validTrees = mapTrees.filter((tree) =>
      Number.isFinite(Number(tree.lat)) && Number.isFinite(Number(tree.lng)) &&
      tree.lat !== null && tree.lng !== null &&
      `${tree.id} ${tree.common} ${tree.zone} ${tree.condition}`.toLowerCase().includes(query)
    );
    if (showTrees) validTrees.forEach((tree) => {
      const marker = L.marker([Number(tree.lat), Number(tree.lng)]).addTo(treeLayer);
      marker.bindTooltip(`${tree.id} · ${tree.common}`);
      marker.on("click", () => setSelectedTree(tree));
    });
    if (showSpaces) mapSpaces.filter((space) =>
      Number.isFinite(Number(space.lat)) && Number.isFinite(Number(space.lng)) &&
      space.lat !== null && space.lng !== null &&
      `${space.name} ${space.location}`.toLowerCase().includes(query)
    ).forEach((space) => L.circle([Number(space.lat), Number(space.lng)], {
      color: "#5d956d", fillColor: "#b9d8ad", fillOpacity: .25, radius: 35, weight: 1,
    }).bindTooltip(space.name).addTo(spaceLayer));
  }, [mapTrees, mapSpaces, setSelectedTree, search, showTrees, showSpaces]);
  return <div className="map-canvas" ref={mapRef} />;
}
function MapPage({ selectedTree, setSelectedTree }) {
  const { trees: mapTrees, spaces: mapSpaces, loading, demoMode, error } = useGreenMapData();
  const [search, setSearch] = useState("");
  const [showTrees, setShowTrees] = useState(true);
  const [showSpaces, setShowSpaces] = useState(true);
  const mapRefCallback = useRef(null);
  const mappedCount = mapTrees.filter(t => t.lat !== null && t.lng !== null && Number.isFinite(Number(t.lat)) && Number.isFinite(Number(t.lng))).length;
  return (
    <div className="page-shell map-page">
      <PageIntro eyebrow="Explore verified locations" title="Interactive tree map">
        <span>Only stored records with valid GPS coordinates appear as map markers. The aggregate field inventory does not contain verified individual coordinates.</span>
      </PageIntro>
      <DemoNotice loading={loading} demoMode={demoMode} />
      {error && <p className="form-error">Database error: {error}. Live records may not be available.</p>}
      <div className="map-toolbar">
        <div className="search-field"><Icon name="search" size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tree ID, species or zone" /></div>
        <button className={`filter-chip ${showTrees ? "active" : ""}`} onClick={() => setShowTrees(v => !v)}><span className="legend-dot tree-dot" /> Trees <b>{mapTrees.length}</b></button>
        <button className={`filter-chip ${showSpaces ? "active" : ""}`} onClick={() => setShowSpaces(v => !v)}><span className="legend-dot space-dot" /> Green spaces <b>{mapSpaces.length}</b></button>
        <button className="filter-chip" onClick={() => { setSearch(""); setSelectedTree(null); if (mapRefCallback.current) mapRefCallback.current.setView([19.282,73.049],16); }}>Reset view</button>
      </div>
      <div className="map-layout">
        <div className="map-frame">
          <MapCanvas trees={mapTrees} spaces={mapSpaces} setSelectedTree={setSelectedTree} search={search} showTrees={showTrees} showSpaces={showSpaces} mapRefCallback={mapRefCallback} />
          <div className="map-legend"><b>Map legend</b><span><i className="legend-dot tree-dot" /> Stored tree with GPS</span><span><i className="legend-dot space-dot" /> Stored green space with GPS</span><small>{mappedCount} of {mapTrees.length} tree records have usable coordinates</small></div>
        </div>
        <aside className="map-aside">
          {selectedTree ? <TreePreview tree={selectedTree} /> : <>
            <div className="aside-kicker"><span className="eyebrow">Stored records</span><span className="live-pill"><i /> {demoMode ? "Not connected" : "Database"}</span></div>
            <h2>Verified places,<br/><em>not guessed pins.</em></h2>
            <p>The field survey confirms 38 trees in total, but it does not provide 38 verified GPS points. Add verified coordinates through an authorized admin account.</p>
            <div className="map-count"><strong>{mappedCount}</strong><span>tree records<br/>with coordinates</span></div>
            <div className="aside-list">{mapTrees.filter(t => t.lat !== null && t.lng !== null).slice(0,5).map(tree => <button key={tree.id} onClick={() => { setSelectedTree(tree); if(mapRefCallback.current) mapRefCallback.current.setView([Number(tree.lat),Number(tree.lng)],18); }}><span className="list-marker"><Icon name="tree" size={15}/></span><span><b>{tree.common}</b><small>{tree.zone} · {tree.condition}</small></span><Icon name="arrow" size={15}/></button>)}</div>
            {!mappedCount && <p>No tree records with verified coordinates are stored yet.</p>}
          </>}
        </aside>
      </div>
    </div>
  );
}
function PickerMap({ value, onPick }) {
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onPickRef = useRef(onPick)
  const initialValue = useRef(value)
  useEffect(() => { onPickRef.current = onPick }, [onPick])
  useEffect(() => {
    if (!mapRef.current) return
    const map = L.map(mapRef.current, { zoomControl: false }).setView(initialValue.current ? [initialValue.current.lat, initialValue.current.lng] : [19.282, 73.049], 17)
    L.control.zoom({ position: "bottomright" }).addTo(map)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(map)
    const place = (lat, lng) => {
      if (markerRef.current) markerRef.current.remove()
      markerRef.current = L.marker([lat, lng]).addTo(map)
      onPickRef.current({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) })
    }
    if (initialValue.current) place(initialValue.current.lat, initialValue.current.lng)
    map.on("click", (event) => place(event.latlng.lat, event.latlng.lng))
    return () => map.remove()
  }, [])
  return <div className="picker-map" ref={mapRef} />
}
function Admin() {
  const { trees: adminTrees, createTree, updateTree, deleteTree, demoMode, error } = useGreenMapData();
  const [session, setSession] = useState(null);
  const [roleChecked, setRoleChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [editing, setEditing] = useState(null);
  const [formError, setFormError] = useState("");
  const initialForm = { id: "", common: "", scientific: "", family: "", zone: "", condition: "Uncertain", date: new Date().toISOString().slice(0, 10), lat: "", lng: "", remark: "", image: "" };
  const [form, setForm] = useState(initialForm);
  useEffect(() => {
    if (!supabase) { setRoleChecked(true); return undefined; }
    let active = true;
    const resolve = async (nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) { setIsAdmin(false); setRoleChecked(true); return; }
      const role = nextSession.user?.app_metadata?.role;
      setIsAdmin(role === "admin");
      setRoleChecked(true);
    };
    supabase.auth.getSession().then(({data}) => resolve(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event,nextSession) => resolve(nextSession));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);
  const setField = (key, value) => setForm(current => ({...current,[key]:value}));
  const startEdit = tree => { setEditing(tree.id); setForm({...tree, lat: tree.lat ?? "", lng: tree.lng ?? ""}); };
  const resetForm = () => { setEditing(null); setForm({...initialForm,date:new Date().toISOString().slice(0,10)}); };
  const saveTree = async event => {
    event.preventDefault(); setFormError("");
    if (!isAdmin) { setFormError("Administrator role required."); return; }
    if (!form.id || !form.common || !form.zone) { setFormError("Tree ID, common name and zone are required."); return; }
    const latEmpty = form.lat === "" || form.lat === null;
    const lngEmpty = form.lng === "" || form.lng === null;
    if (latEmpty !== lngEmpty) { setFormError("Enter both latitude and longitude, or leave both blank until verified."); return; }
    const lat = latEmpty ? null : Number(form.lat), lng = lngEmpty ? null : Number(form.lng);
    if (!latEmpty && (!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat>90||lng < -180||lng>180)) { setFormError("Latitude must be -90 to 90 and longitude -180 to 180."); return; }
    try { const next={...form,lat,lng}; if(editing) await updateTree(next); else await createTree(next); resetForm(); }
    catch(e) { setFormError(e.message || "Could not save record."); }
  };
  const removeTree = async tree => { if(!isAdmin) return; if(!window.confirm(`Delete ${tree.id}? This cannot be undone.`)) return; try { await deleteTree(tree.id); } catch(e) { setFormError(e.message || "Could not delete record."); } };
  const login = async event => { event.preventDefault(); setAuthError(""); if(!supabase){setAuthError("Supabase is not configured. Sign-in and write actions are disabled.");return;} const {error}=await supabase.auth.signInWithPassword(authForm); if(error)setAuthError(error.message); };
  const logout = async () => { if(supabase) await supabase.auth.signOut(); setSession(null); setIsAdmin(false); resetForm(); };
  if (!supabase) return <div className="page-shell admin-page"><PageIntro eyebrow="Read-only until configured" title="Admin sign in"><span>Tree management is disabled because Supabase is not configured. Configure the public project URL/key and run the secured SQL schema before enabling database operations.</span></PageIntro><div className="empty-state"><h3>No local-only CRUD</h3><p>This prevents changes from appearing to save when they would disappear on refresh.</p></div></div>;
  if (!roleChecked) return <div className="page-shell admin-page"><PageIntro eyebrow="Checking access" title="Admin sign in"><span>Verifying your session and role…</span></PageIntro></div>;
  if (!session) return <div className="page-shell admin-page"><PageIntro eyebrow="Protected data management" title="Admin sign in"><span>Sign in with a Supabase account whose trusted app metadata contains role = admin. A regular authenticated account is not enough.</span></PageIntro><form className="admin-login" onSubmit={login}><span className="eyebrow">Administrator access only</span><input type="email" required placeholder="Email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})}/><input type="password" required placeholder="Password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})}/>{authError&&<p className="form-error">{authError}</p>}<button className="button button-dark">Sign in <Icon name="arrow" size={16}/></button></form></div>;
  if (!isAdmin) return <div className="page-shell admin-page"><PageIntro eyebrow="Access denied" title="Administrator role required"><span>This account is signed in but does not have the trusted admin role. Contact the project owner; do not change app_metadata from browser code.</span></PageIntro><button className="button button-dark" onClick={logout}>Sign out</button></div>;
  return <div className="page-shell admin-page"><PageIntro eyebrow="Authorized data management" title="Tree records"><span>Signed in as administrator. Coordinates may remain blank until field-verified. Database permissions are enforced by Supabase row-level security.</span></PageIntro><button className="clear-button" onClick={logout}>Sign out</button>{error&&<p className="form-error">Database error: {error}</p>}<div className="admin-layout"><form className="admin-form" onSubmit={saveTree}><div className="form-heading"><span className="eyebrow">{editing?"Edit record":"Add a tree"}</span><button type="button" className="clear-button" onClick={resetForm}>Clear</button></div><label>Tree ID<input value={form.id} disabled={Boolean(editing)} onChange={e=>setField("id",e.target.value.toUpperCase())} placeholder="TREE-039"/></label><div className="form-row"><label>Common name<input required value={form.common} onChange={e=>setField("common",e.target.value)}/></label><label>Scientific name<input value={form.scientific} onChange={e=>setField("scientific",e.target.value)}/></label></div><div className="form-row"><label>Family<input value={form.family} onChange={e=>setField("family",e.target.value)}/></label><label>Zone<input required value={form.zone} onChange={e=>setField("zone",e.target.value)}/></label></div><div className="form-row"><label>Condition<select value={form.condition} onChange={e=>setField("condition",e.target.value)}><option>Healthy</option><option>Fair</option><option>Needs Attention</option><option>Damaged</option><option>Dead</option><option>Uncertain</option></select></label><label>Date surveyed<input type="date" value={form.date||""} onChange={e=>setField("date",e.target.value)}/></label></div><div className="form-row"><label>Latitude (optional)<input type="number" step="any" value={form.lat} onChange={e=>setField("lat",e.target.value)}/></label><label>Longitude (optional)<input type="number" step="any" value={form.lng} onChange={e=>setField("lng",e.target.value)}/></label></div><p className="picker-help">Leave coordinates blank until the individual tree location has been verified.</p><label>Remarks<textarea rows="3" value={form.remark} onChange={e=>setField("remark",e.target.value)}/></label><label>Photo URL<input value={form.image} onChange={e=>setField("image",e.target.value)} placeholder="Optional approved field-photo URL"/></label>{formError&&<p className="form-error">{formError}</p>}<button className="button button-dark" type="submit">{editing?"Update tree":"Create tree"} <Icon name="arrow" size={16}/></button></form><section className="admin-records"><div className="results-bar"><span><b>{adminTrees.length}</b> stored records</span><span>Admin CRUD</span></div>{adminTrees.map(tree=><article className="admin-record" key={tree.id}><div><span className="eyebrow">{tree.id}</span><h3>{tree.common}</h3><small>{tree.zone} · {tree.condition} · {tree.lat==null?"No GPS":`${tree.lat}, ${tree.lng}`}</small></div><div className="admin-actions"><button className="clear-button" onClick={()=>startEdit(tree)}>Edit</button><button className="clear-button danger" onClick={()=>removeTree(tree)}>Delete</button></div></article>)}</section></div></div>;
}
function TreePreview({ tree }) {
  return (
    <div className="tree-preview">
      <a className="back-mini" href="#/map">
        ← All markers
      </a>
      <div
        className="preview-image"
        style={{ backgroundImage: `url(${tree.image})` }}
      >
        <span>DEMO RECORD</span>
      </div>
      <span className="eyebrow">{tree.id}</span>
      <h2>{tree.common}</h2>
      <p className="scientific">{tree.scientific}</p>
      <div className="condition-row">
        <span
          className={`condition ${tree.condition.toLowerCase().replaceAll(" ", "-")}`}
        >
          {tree.condition}
        </span>
        <span>{tree.zone}</span>
      </div>
      <a className="button button-dark full" href={`#/trees/${tree.id}`}>
        View full record <Icon name="arrow" size={16} />
      </a>
    </div>
  );
}
function Catalogue({ setSelectedTree }) {
  const { trees: catalogueTrees, loading, demoMode } = useGreenMapData();
  const [query, setQuery] = useState("");
  const [condition, setCondition] = useState("All conditions");
  const filtered = useMemo(
    () =>
      catalogueTrees.filter(
        (t) =>
          `${t.id} ${t.common} ${t.scientific} ${t.zone}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (condition === "All conditions" || t.condition === condition),
      ),
    [catalogueTrees, query, condition],
  );
  return (
    <div className="page-shell">
      <PageIntro eyebrow="Documented records" title="Tree catalogue">
        <span>
          Browse documented trees and characteristics captured during sample
          field walks.
        </span>
      </PageIntro>
      <DemoNotice loading={loading} demoMode={demoMode} />
      <div className="catalogue-controls">
        <div className="search-field large">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by tree name, species or Tree ID..."
          />
        </div>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
        >
          <option>All conditions</option>
          <option>Healthy</option>
          <option>Fair</option>
          <option>Needs Attention</option>
          <option>Damaged</option>
        </select>
        <button
          className="clear-button"
          onClick={() => {
            setQuery("");
            setCondition("All conditions");
          }}
        >
          Clear filters
        </button>
      </div>
      <div className="results-bar">
        <span>
          <b>{filtered.length}</b> trees found
        </span>
        <span>
          Sorted by <b>Tree ID</b> ↕
        </span>
      </div>
      <div className="tree-grid">
        {filtered.map((tree) => (
          <article
            className="tree-card"
            key={tree.id}
            onClick={() => {
              setSelectedTree(tree);
              window.location.hash = `/trees/${tree.id}`;
            }}
          >
            <div
              className="card-image"
              style={{ backgroundImage: `url(${tree.image})` }}
            >
              <span className="demo-tag">DEMO</span>
              <span
                className={`condition ${tree.condition.toLowerCase().replaceAll(" ", "-")}`}
              >
                {tree.condition}
              </span>
            </div>
            <div className="card-body">
              <span className="eyebrow">{tree.id}</span>
              <h3>{tree.common}</h3>
              <p className="scientific">{tree.scientific}</p>
              <div className="card-meta">
                <span>
                  <Icon name="map" size={14} /> {tree.zone}
                </span>
                <span>{tree.date}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <Icon name="tree" size={30} />
          <h3>No sample records found</h3>
          <p>Try a different search or clear the filters.</p>
        </div>
      )}
    </div>
  );
}
function TreeDetail({ id }) {
  const { trees: detailTrees, loading, demoMode } = useGreenMapData();
  const tree = detailTrees.find((item) => item.id === id);
  if (!tree)
    return (
      <div className="page-shell">
        <div className="empty-state">
          <Icon name="tree" size={30} />
          <h2>Record not found</h2>
          <p>This tree ID does not exist in the current demo dataset.</p>
          <a className="button button-dark" href="#/trees">
            Back to catalogue
          </a>
        </div>
      </div>
    );
  return (
    <div className="page-shell detail-page">
      <DemoNotice loading={loading} demoMode={demoMode} />
      <a className="back-link" href="#/trees">
        ← Back to catalogue
      </a>
      <div className="detail-header">
        <div>
          <span className="eyebrow">{tree.id} · DEMO RECORD</span>
          <h1>{tree.common}</h1>
          <p className="scientific large-scientific">{tree.scientific}</p>
        </div>
        <span
          className={`condition ${tree.condition.toLowerCase().replaceAll(" ", "-")}`}
        >
          {tree.condition}
        </span>
      </div>
      <div className="detail-grid">
        <div
          className="detail-photo"
          style={{ backgroundImage: `url(${tree.image})` }}
        >
          <span>Sample image · replace with field photograph</span>
        </div>
        <div className="facts-panel">
          <span className="eyebrow">Record details</span>
          <div className="facts-grid">
            {[
              ["Tree ID", tree.id],
              ["Family", tree.family],
              ["Location / zone", tree.zone],
              ["Latitude", `${tree.lat}° N · demo`],
              ["Longitude", `${tree.lng}° E · demo`],
              ["Date surveyed", tree.date],
              ["Survey team", "CEP field group · sample"],
              ["Source", "Demo record"],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <b>{value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
      <section className="observation">
        <span className="eyebrow">Field observation</span>
        <h2>A note from the sample walk</h2>
        <p>{tree.remark}</p>
      </section>
      <div className="detail-map">
        <div className="mini-map-grid" />
        <span className="mini-map-pin">
          <Icon name="tree" size={17} />
        </span>
        <div>
          <span className="eyebrow">Location preview</span>
          <b>{tree.zone}</b>
          <small>Demo coordinate · verify before field use</small>
        </div>
      </div>
    </div>
  );
}
function GreenSpaces() {
  const { spaces: greenSpaces, loading, demoMode } = useGreenMapData();
  return (
    <div className="page-shell">
      <PageIntro eyebrow="Beyond individual trees" title="Green spaces">
        <span>
          Document gardens, lawns and other vegetation zones as living parts of
          the community landscape.
        </span>
      </PageIntro>
      <DemoNotice loading={loading} demoMode={demoMode} />
      <div className="space-grid">
        {greenSpaces.map((space, i) => (
          <article className="space-card" key={space.name}>
            <div className={`space-visual space-${i}`}>
              <span className="space-number">0{i + 1}</span>
              <Icon name={i === 0 ? "leaf" : "tree"} size={38} />
            </div>
            <div className="space-body">
              <div className="space-top">
                <span className="eyebrow">{space.type}</span>
                <span className="condition fair">{space.condition}</span>
              </div>
              <h3>{space.name}</h3>
              <p>{space.description}</p>
              <div className="space-meta">
                <span>
                  <Icon name="map" size={14} /> {space.location}
                </span>
                <b>{space.area}</b>
              </div>
              <a className="text-link" href="#/map">
                View on map <Icon name="arrow" size={15} />
              </a>
            </div>
          </article>
        ))}
      </div>
      <section className="callout-row">
        <div>
          <span className="eyebrow">Add the next layer</span>
          <h2>
            Green cover is more
            <br />
            <em>than a tree count.</em>
          </h2>
        </div>
        <p>
          Use green-space records to add context around individual trees and
          make the map useful for planning, learning and community care.
        </p>
      </section>
    </div>
  );
}
function Statistics() {
  const { trees, spaces, loading, demoMode, error, inventorySummary } = useGreenMapData();
  const inventory = inventorySummary || VERIFIED_INVENTORY;
  const totalStored = trees.length;
  const mapped = trees.filter(t => t.lat !== null && t.lng !== null && Number.isFinite(Number(t.lat)) && Number.isFinite(Number(t.lng))).length;
  const actualConditionCounts = trees.reduce((acc, t) => { const key=t.condition || "Uncertain"; acc[key]=(acc[key]||0)+1; return acc; }, {});
  const showVerifiedAggregate = Boolean(inventory?.verified);
  const speciesRows = showVerifiedAggregate ? inventory.speciesCounts : Object.entries(trees.reduce((acc,t)=>{ const key=t.common || "Unidentified"; acc[key]=(acc[key]||0)+1; return acc; },{})).map(([name,count])=>({name,count}));
  const zoneRows = showVerifiedAggregate ? inventory.zoneCounts : Object.entries(trees.reduce((acc,t)=>{const key=t.zone||"Zone not recorded";acc[key]=(acc[key]||0)+1;return acc;},{})).map(([name,count])=>({name,count}));
  const conditionRows = showVerifiedAggregate ? inventory.conditionCounts : Object.entries(actualConditionCounts).map(([name,count])=>({name,count}));
  const maxSpecies = Math.max(1,...speciesRows.map(x=>x.count));
  const maxZone = Math.max(1,...zoneRows.map(x=>x.count));
  const maxCondition = Math.max(1,...conditionRows.map(x=>x.count));
  return <div className="page-shell statistics-page">
    <PageIntro eyebrow="Field data, transparently reported" title="Green-cover insights"><span>Verified survey aggregates are kept separate from the live database register. Statistics never assign aggregate counts to invented individual trees.</span></PageIntro>
    <DemoNotice loading={loading} demoMode={demoMode}/>
    {error && <p className="form-error">Database error: {error}</p>}
    <div className="stats-grid">
      <div className="stat-card accent"><span className="eyebrow">Verified field survey</span><strong>{showVerifiedAggregate ? inventory.totalTrees : "—"}</strong><small>trees counted on {inventory.surveyDate || "survey date not recorded"}</small></div>
      <div className="stat-card"><span className="eyebrow">Database register</span><strong>{totalStored}</strong><small>individual tree records stored</small></div>
      <div className="stat-card"><span className="eyebrow">Mapped records</span><strong>{mapped}</strong><small>stored trees with valid GPS coordinates</small></div>
      <div className="stat-card"><span className="eyebrow">Green spaces</span><strong>{spaces.length}</strong><small>stored green-space records</small></div>
    </div>
    <div className="chart-grid">
      <section className="chart-card"><div className="chart-heading"><Icon name="chart" size={21}/><span className="eyebrow">{showVerifiedAggregate ? "Verified survey aggregate" : "Database register"}</span></div><h2>Species / category counts</h2><div className="bar-chart">{speciesRows.map(row=><div className="bar-row" key={row.name}><span>{row.name}</span><div><i style={{width:`${row.count/maxSpecies*100}%`}}/></div><b>{row.count}</b></div>)}</div></section>
      <section className="chart-card"><div className="chart-heading"><Icon name="map" size={21}/><span className="eyebrow">{showVerifiedAggregate ? "Verified survey aggregate" : "Database register"}</span></div><h2>Distribution by zone</h2><div className="bar-chart">{zoneRows.map(row=><div className="bar-row" key={row.name}><span>{row.name}</span><div><i style={{width:`${row.count/maxZone*100}%`}}/></div><b>{row.count}</b></div>)}</div></section>
    </div>
    <section className="chart-card" style={{marginTop:15}}><div className="chart-heading"><Icon name="leaf" size={21}/><span className="eyebrow">{showVerifiedAggregate ? "Verified survey aggregate" : "Database register"}</span></div><h2>Observed tree condition</h2><div className="condition-list">{conditionRows.map(row=><div key={row.name}><span>{row.name}</span><b>{row.count}</b><small>{(showVerifiedAggregate ? inventory.totalTrees : totalStored) ? `${(row.count/(showVerifiedAggregate ? inventory.totalTrees : totalStored)*100).toFixed(1)}%` : "—"}</small></div>)}</div></section>
    <div className="insight-strip"><div><span className="eyebrow">Data quality note</span><h2>{showVerifiedAggregate ? "38 survey counts verified; individual GPS records remain separate." : "Waiting for verified survey summary."}</h2><p>{showVerifiedAggregate ? "Species, zone and condition totals describe the survey summary, not the current number of database rows or map markers." : "Run the supplied Supabase schema to store the verified aggregate summary."}</p></div><a className="button button-dark" href="#/map">Explore stored map records <Icon name="arrow" size={16}/></a></div>
  </div>;
}
function Survey() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { refresh, demoMode, surveyCount } = useGreenMapData();
  return (
    <div className="page-shell survey-page">
      <PageIntro
        eyebrow="Listen to the community"
        title="Community & environmental survey"
      >
        <span>
          A questionnaire for understanding awareness, care and participation
          around local green spaces.
        </span>
      </PageIntro>
      <div className="survey-layout">
        <section className="survey-context">
          <span className="eyebrow">Before you begin</span>
          <h2>Good data starts with a thoughtful question.</h2>
          <p>
            This form is ready for actual community responses. No response data
            is included in this demo workspace, and names are optional.
          </p>
          <div className="survey-points">
            <span>
              <i>01</i>
              <b>Optional identity</b>
              <small>Share only what you are comfortable sharing.</small>
            </span>
            <span>
              <i>02</i>
              <b>One perspective</b>
              <small>
                Responses represent the participant, not a population.
              </small>
            </span>
            <span>
              <i>03</i>
              <b>Useful context</b>
              <small>Zone and age group help compare future responses.</small>
            </span>
          </div>
        </section>
        <form
          className="survey-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitError("");
            const values = new FormData(e.currentTarget);
            try {
              await submitSurvey({
                age_group: values.get("age_group") || null,
                zone: values.get("zone") || null,
                awareness: values.get("awareness") || null,
                green_space_importance: Number(values.get("green_space_importance")) || null,
                tree_care_awareness: values.get("tree_care_awareness") || null,
                participation_interest: values.get("participation_interest") || null,
                suggestions: values.get("suggestions") || null,
              });
              refresh();
              setSubmitted(true);
            } catch {
              setSubmitError("We could not save this response. Please check the database connection and try again.");
            }
          }}
        >
          {submitted ? (
            <div className="success-state">
              <div className="success-icon">✓</div>
              <span className="eyebrow">{demoMode ? "Response saved locally" : "Response saved to Supabase"}</span>
              <h2>Thank you for participating.</h2>
              <p>
                {demoMode ? "This prototype is running without Supabase credentials, so the response was not sent to a server." : "The response has been added to the project database."}
              </p>
              <button
                className="button button-dark"
                type="button"
                onClick={() => setSubmitted(false)}
              >
                Submit another response
              </button>
            </div>
          ) : (
            <>
              <div className="form-heading">
                <span className="eyebrow">Participant response</span>
                <span className="optional">
                  All fields optional where noted
                </span>
              </div>
              <label>
                Name <span>(optional)</span>
                <input name="participant_name" placeholder="Your name" />
              </label>
              <div className="form-row">
                <label>
                  Age group
                  <select name="age_group" defaultValue="">
                    <option value="" disabled>
                      Select age group
                    </option>
                    <option>Under 18</option>
                    <option>18–25</option>
                    <option>26–40</option>
                    <option>41+</option>
                  </select>
                </label>
                <label>
                  Area / zone
                  <select name="zone" defaultValue="">
                    <option value="" disabled>
                      Select a zone
                    </option>
                    <option>Central Lawn</option>
                    <option>Library Garden</option>
                    <option>Community Garden</option>
                  </select>
                </label>
              </div>
              <label>
                How aware are you of the trees around your area?
                <select name="awareness" defaultValue="">
                  <option value="" disabled>
                    Choose one
                  </option>
                  <option>Very aware</option>
                  <option>Somewhat aware</option>
                  <option>Not very aware</option>
                </select>
              </label>
              <label>
                How important are green spaces to your community?
                <div className="rating-row">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label key={n}>
                      <input type="radio" name="green_space_importance" value={n} required={n === 1} />
                      {n}
                    </label>
                  ))}
                </div>
              </label>
              <label>
                What could help people care for trees better?
                <textarea name="suggestions" placeholder="Share a suggestion..." rows="3" />
              </label>
              {submitError && <p className="form-error">{submitError}</p>}
              <button className="button button-dark" type="submit">
                Submit response <Icon name="arrow" size={16} />
              </button>
            </>
          )}
        </form>
      </div>
      <div className="empty-response">
        <span className="eyebrow">Survey results</span>
        <h2>{surveyCount ? `${surveyCount} survey response${surveyCount === 1 ? "" : "s"} recorded.` : "No survey responses have been recorded yet."}</h2>
        <p>
          When real responses are connected, this space can show transparent
          summaries without fabricating findings.
        </p>
      </div>
    </div>
  );
}
function Gallery() {
  const { gallery: galleryImages, loading, demoMode } = useGreenMapData();
  const _images = [
    [
      "Trees in context",
      "Trees",
      "Central Lawn",
      "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=900&q=80",
    ],
    [
      "A shared garden edge",
      "Green Spaces",
      "Library Garden",
      "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80",
    ],
    [
      "A field note in progress",
      "Survey Activities",
      "Campus Environment",
      "https://images.unsplash.com/photo-1599685315640-98c1b6f8f3a4?auto=format&fit=crop&w=900&q=80",
    ],
    [
      "Light through the canopy",
      "Campus Environment",
      "East Walkway",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80",
    ],
    [
      "A place to pause",
      "Community Awareness",
      "Central Lawn",
      "https://images.unsplash.com/photo-1473445361085-b9a07f55608b?auto=format&fit=crop&w=900&q=80",
    ],
    [
      "Green cover, recorded",
      "Trees",
      "North Boundary",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
    ],
  ];
  return (
    <div className="page-shell">
      <PageIntro eyebrow="Visual field notes" title="Field survey gallery">
        <span>
          Placeholder visuals for the prototype. Replace each image with
          verified field photographs, captions and dates.
        </span>
      </PageIntro>
      <DemoNotice loading={loading} demoMode={demoMode} />
      <div className="gallery-filter">
        <button className="active">All images</button>
        <button>Trees</button>
        <button>Green spaces</button>
        <button>Survey activities</button>
        <button>Community awareness</button>
      </div>
      <div className="gallery-grid">
        {galleryImages.map(([title, category, location, image]) => (
          <article className="gallery-card" key={title}>
            <div
              className="gallery-image"
              style={{ backgroundImage: `url(${image})` }}
            >
              <span>DEMO IMAGE</span>
            </div>
            <div>
              <span className="eyebrow">{category}</span>
              <h3>{title}</h3>
              <p>{location} · Replace with date</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
function About() {
  const stages = [
    "Field survey",
    "Tree identification",
    "Data recording",
    "GPS / location",
    "Photo documentation",
    "Database entry",
    "Interactive mapping",
    "Statistics & analysis",
  ];
  return (
    <div className="page-shell about-page">
      <PageIntro eyebrow="The project behind the map" title="About GreenMap">
        <span>
          Tree Mapping & Green Cover Documentation · Community Engagement
          Project
        </span>
      </PageIntro>
      <div className="about-lead">
        <div>
          <span className="eyebrow">Purpose</span>
          <h2>A digital record for places that deserve to be seen.</h2>
        </div>
        <p>
          GreenMap is designed to make collected information easier to
          visualize, search and analyse. It creates a bridge between a field
          notebook and a shared understanding of local green cover.
        </p>
      </div>
      <div className="objective-grid">
        <section>
          <span className="eyebrow">Objectives</span>
          <h2>
            Build a foundation
            <br />
            <em>for future care.</em>
          </h2>
        </section>
        <ul>
          <li>Identify and document trees</li>
          <li>Record species and condition</li>
          <li>Map green spaces and locations</li>
          <li>Create an organized catalogue</li>
          <li>Support environmental awareness</li>
          <li>Encourage community participation</li>
        </ul>
      </div>
      <section className="methodology">
        <div className="section-heading">
          <span className="eyebrow">Methodology</span>
          <h2>
            From field observation
            <br />
            <em>to shared insight.</em>
          </h2>
        </div>
        <div className="method-grid">
          {stages.map((stage, i) => (
            <div key={stage} className="method-step">
              <span>{String(i + 1).padStart(2, "0")}</span>
              <b>{stage}</b>
              {i < stages.length - 1 && <i>→</i>}
            </div>
          ))}
        </div>
      </section>
      <div className="about-columns">
        <div>
          <span className="eyebrow">Scope</span>
          <p>
            The MVP supports tree records, green-space documentation, community
            survey design, gallery notes and transparent demo statistics. It is
            structured to accept actual verified records later.
          </p>
        </div>
        <div>
          <span className="eyebrow">Future scope</span>
          <p>
            GPS-based field collection, QR codes, repeat health monitoring,
            image-assisted identification, exports and role-based access can be
            added as the project matures.
          </p>
        </div>
      </div>
      <div className="academic-note">
        <span className="college-seal large">T</span>
        <div>
          <span className="eyebrow">Academic context</span>
          <h2>Built for a Community Engagement Project.</h2>
          <p>Theem College of Arts, Commerce & Science</p>
        </div>
      </div>
    </div>
  );
}
export default App;
