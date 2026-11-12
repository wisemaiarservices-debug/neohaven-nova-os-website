import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, BatteryCharging,
  Bell, CheckCircle2, ChevronDown, CircleHelp, Cloud, CloudSun, Cpu, Droplets,
  ExternalLink, Factory, Gauge, Leaf, LayoutDashboard, Menu, Network, RefreshCw,
  Server, Settings2, ShieldCheck, Sprout, Sun, ThermometerSun, Waves, Wind, Zap
} from "lucide-react";

type ModuleKey = "overview" | "neoagro" | "neogrid" | "neocell" | "data" | "scenarios";
type RegisteredApi = { id: string; name: string; baseUrl: string; owner: string; status?: string; detail?: string };
const DEFAULT_NOVA_API_URL = import.meta.env.VITE_NOVA_API_URL || "https://nova-core-api.neohaven.workers.dev";

function normalizeApiBaseUrl(value: string): string {
  const url = new URL(value.trim());
  const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && localHost)) {
    throw new Error("Use HTTPS for remote API endpoints; HTTP is allowed only for localhost.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("API base URL must not contain credentials, query parameters or fragments.");
  }
  return url.toString().replace(/\/+$/, "");
}
const PRODUCT_URLS: Partial<Record<ModuleKey, string>> = {
  neoagro: "https://neoagro-six.vercel.app",
  neocell: "https://neocell-ebon.vercel.app",
  neogrid: "https://neogrid-sigma.vercel.app",
};
const PRODUCT_PREVIEW_URLS: Partial<Record<ModuleKey, string>> = {
  neoagro: "https://neoagro-git-fix-neoagro-provenance-56a89b-neo-haven-urban-labs.vercel.app",
  neocell: "https://neocell-git-fix-neocell-api-health-52be8d-neo-haven-urban-labs.vercel.app",
  neogrid: "https://neogrid-git-fix-neogrid-provenance-43da6f-neo-haven-urban-labs.vercel.app",
};

const NAV: { key: ModuleKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "NOVA Core", icon: LayoutDashboard },
  { key: "neoagro", label: "NeoAgro", icon: Sprout },
  { key: "neogrid", label: "NeoGrid", icon: Zap },
  { key: "neocell", label: "NeoCell", icon: Network },
  { key: "data", label: "Data & provenance", icon: ShieldCheck },
  { key: "scenarios", label: "Scenario lab", icon: BarChart3 },
];

const DEMO = {
  temperature: "—", soilMoisture: "—", solar: "—", battery: "—", water: "—",
  gateway: "—", humidity: "—", rainfall: "—", wind: "—",
};

function Metric({ label, value, unit, note, icon: Icon, tone = "blue" }: {
  label: string; value: string; unit?: string; note: string; icon: typeof Activity; tone?: string;
}) {
  return <article className="nova-metric">
    <div className="nova-metric-top"><span>{label}</span><span className={`nova-icon tone-${tone}`}><Icon size={17}/></span></div>
    <div className="nova-metric-value">{value}<small>{unit}</small></div>
    <div className="nova-metric-note">{note}</div>
  </article>;
}

function Sparkline({ values, color = "#67d6c1" }: { values: number[]; color?: string }) {
  const points = values.map((v, i) => `${(i / (values.length - 1)) * 100},${38 - v * 0.32}`).join(" ");
  return <svg viewBox="0 0 100 42" preserveAspectRatio="none" className="nova-spark"><polyline points={points} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="nova-panel"><div className="nova-panel-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}

function Status({ children, kind = "good" }: { children: ReactNode; kind?: "good" | "warn" | "muted" }) {
  return <span className={`nova-status status-${kind}`}><i/>{children}</span>;
}

export default function Dashboard() {
  const [active, setActive] = useState<ModuleKey>("overview");
  const [mobileNav, setMobileNav] = useState(false);
  const [apiUrl, setApiUrl] = useState(DEFAULT_NOVA_API_URL);
  const [apiRegistry, setApiRegistry] = useState<RegisteredApi[]>([]);
  const [moduleApiStatus, setModuleApiStatus] = useState<Record<string, "checking" | "online" | "offline">>({});
  const [apiState, setApiState] = useState<"unconfigured" | "checking" | "online" | "offline">("unconfigured");
  const [apiMessage, setApiMessage] = useState("Check NOVA Core connectivity or request a provider dataset for a caller-supplied location.");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [weather, setWeather] = useState<any>(null);
  const [weatherState, setWeatherState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [weatherError, setWeatherError] = useState("");
  const [days, setDays] = useState("7");
  const [scenario, setScenario] = useState("water");
  const [scenarioValue, setScenarioValue] = useState(20);

  const isLive = apiState === "online";
  // API reachability is kept separate from site observations and provider datasets.
  const dataLabel = "No verified site observations connected";

  useEffect(() => {
    const defaultCore: RegisteredApi = { id: "nova-core", name: "NOVA Core API", baseUrl: DEFAULT_NOVA_API_URL, owner: "NOVA Core" };
    let saved: RegisteredApi[] = [defaultCore];
    try {
      const raw = localStorage.getItem("neohaven.nova.workbench.v1");
      const parsed = raw ? JSON.parse(raw) : null;
      saved = Array.isArray(parsed?.apis) ? parsed.apis.filter((item: any) => item && typeof item.baseUrl === "string" && typeof item.owner === "string") : [defaultCore];
      if (!saved.some(item => item.owner === "NOVA Core")) saved.unshift(defaultCore);
    } catch {
      saved = [defaultCore];
    }
    setApiRegistry(saved);
    const novaCore = saved.find(item => item.owner === "NOVA Core");
    if (novaCore?.baseUrl) setApiUrl(novaCore.baseUrl);

    if (!saved.length) return;
    let cancelled = false;
    setModuleApiStatus(Object.fromEntries(saved.map(item => [item.owner, "checking" as const])));
    Promise.all(saved.map(async item => {
      try {
        const response = await fetch(normalizeApiBaseUrl(item.baseUrl) + "/health", { headers: { Accept: "application/json" }, cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        await response.json();
        return [item.owner, "online"] as const;
      } catch {
        return [item.owner, "offline"] as const;
      }
    })).then(results => {
      if (!cancelled) setModuleApiStatus(Object.fromEntries(results));
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!apiUrl.trim()) {
      setApiState("unconfigured");
      setApiMessage("Enter your deployed API base URL first.");
      return;
    }
    let endpoint: string;
    try {
      endpoint = normalizeApiBaseUrl(apiUrl) + "/health";
    } catch (error) {
      setApiState("offline");
      setApiMessage(error instanceof Error ? error.message : "Invalid NOVA API base URL.");
      return;
    }
    let cancelled = false;
    setApiState("checking");
    fetch(endpoint, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`API returned HTTP ${r.status}`);
        return r.json();
      })
      .then(() => { if (!cancelled) { setApiState("online"); setApiMessage("NOVA API health endpoint responded successfully."); } })
      .catch((e) => { if (!cancelled) { setApiState("offline"); setApiMessage(e.message || "Unable to reach NOVA API."); } });
    return () => { cancelled = true; };
  }, [apiUrl]);

  const chartValues = useMemo(() => [], []);
  async function checkApi() {
    if (!apiUrl.trim()) { setApiState("unconfigured"); setApiMessage("Enter your deployed API base URL first."); return; }
    setApiState("checking");
    try {
      const r = await fetch(`${normalizeApiBaseUrl(apiUrl)}/health`, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await r.json(); setApiState("online"); setApiMessage("API health check passed.");
    } catch (e: any) { setApiState("offline"); setApiMessage(e.message || "API health check failed."); }
  }
  async function loadWeather() {
    if (!apiUrl.trim()) { setWeatherError("Add the deployed NOVA API URL before requesting NASA POWER data."); return; }
    const lat = Number(latitude), lon = Number(longitude);
    if (!latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setWeatherError("Enter valid latitude (−90 to 90) and longitude (−180 to 180)."); return;
    }
    setWeatherState("loading"); setWeatherError("");
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - Number(days) + 1);
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "");
    const url = `${normalizeApiBaseUrl(apiUrl)}/api/v1/data/weather/nasa-power/daily?latitude=${lat}&longitude=${lon}&start_date=${fmt(start)}&end_date=${fmt(end)}`;
    try {
      const r = await fetch(url, { cache: "no-store" }); const payload = await r.json();
      if (!r.ok) throw new Error(payload.detail || `HTTP ${r.status}`);
      setWeather(payload); setWeatherState("loaded");
    } catch (e: any) { setWeatherState("error"); setWeatherError(e.message || "NASA POWER request failed."); }
  }

  return <div className="nova-shell">
    <aside className={`nova-sidebar ${mobileNav ? "nav-open" : ""}`}>
      <a className="nova-brand" href="/"><span className="nova-brand-mark">N</span><span><b>NeoHaven</b><small>URBAN LABS INC.</small></span></a>
      <div className="nova-workspace"><span className="workspace-dot"/><span><b>NOVA Operations</b><small>NO SITE SELECTED</small></span><ChevronDown size={14}/></div>
      <div className="nova-nav-label">PLATFORM</div>
      <nav>{NAV.map(({ key, label, icon: Icon }) => {
        const productUrl = PRODUCT_URLS[key];
        return productUrl ? <div className={`nova-nav-product ${active === key ? "active" : ""}`} key={key}>
          <a href={productUrl} target="_blank" rel="noreferrer" title={`Open standalone ${label} product`}><Icon size={17}/><span>{label}</span><ExternalLink size={12}/></a>
          <button className="nova-nav-use" onClick={() => { setActive(key); setMobileNav(false); }}>Use in NOVA OS</button>
        </div> : <button key={key} onClick={() => { setActive(key); setMobileNav(false); }} className={active === key ? "active" : ""}><Icon size={17}/><span>{label}</span>{key === "overview" && <i className="nav-live"/>}</button>;
      })}</nav>
      <div className="nova-sidebar-bottom"><div className="nova-help"><CircleHelp size={17}/><span><b>Need a hand?</b><small>Read the platform guide</small></span><ExternalLink size={13}/></div><div className="nova-user"><div className="nova-avatar">NH</div><span><b>NeoHaven Operator</b><small>Read-only demo access</small></span><Settings2 size={16}/></div></div>
    </aside>
    <main className="nova-main">
      <header className="nova-topbar"><button className="nova-mobile-menu" onClick={() => setMobileNav(!mobileNav)}><Menu/></button><div className="nova-breadcrumb">Workspace <span>/</span> <b>{NAV.find(n => n.key === active)?.label}</b></div><div className="nova-top-actions"><a className="nova-button" href="/console">Engineering console <ExternalLink size={12}/></a><span className="nova-env"><i/> PREVIEW ENVIRONMENT</span><button className="nova-bell" aria-label="Notifications"><Bell size={17}/><i/></button><div className="nova-avatar small">NH</div></div></header>
      <div className="nova-content">
        <div className="nova-page-heading"><div><div className="nova-eyebrow">NOVA OS <span>•</span> INTELLIGENCE CONSOLE</div><h1>{NAV.find(n => n.key === active)?.label}</h1><p>{active === "overview" ? "A unified operational view across agriculture, energy and connected infrastructure." : pageDescription(active)}</p></div><div className="nova-heading-actions">{PRODUCT_URLS[active] && <><Status kind={moduleApiStatus[active === "neoagro" ? "NeoAgro" : active === "neogrid" ? "NeoGrid" : "NeoCell"] === "online" ? "good" : moduleApiStatus[active === "neoagro" ? "NeoAgro" : active === "neogrid" ? "NeoGrid" : "NeoCell"] === "offline" ? "warn" : "muted"}>{moduleApiStatus[active === "neoagro" ? "NeoAgro" : active === "neogrid" ? "NeoGrid" : "NeoCell"] === "online" ? "Module API reachable" : moduleApiStatus[active === "neoagro" ? "NeoAgro" : active === "neogrid" ? "NeoGrid" : "NeoCell"] === "offline" ? "Module API offline" : "No module API registered"}</Status><a className="nova-button" href={PRODUCT_URLS[active]} target="_blank" rel="noreferrer">Open production product <ExternalLink size={12}/></a><a className="nova-button" href={PRODUCT_PREVIEW_URLS[active] || PRODUCT_URLS[active]} target="_blank" rel="noreferrer">Open updated preview <ExternalLink size={12}/></a></>}<Status kind={apiState === "online" ? "good" : apiState === "offline" ? "warn" : "muted"}>{apiState === "online" ? "API connected" : apiState === "offline" ? "API offline" : "No site data"}</Status><button className="nova-button" onClick={checkApi}><RefreshCw size={14}/> Check connection</button></div></div>

        <div className="nova-notice"><div className="notice-icon"><ShieldCheck size={16}/></div><div><b>Evidence-gated operations</b><span>No pilot site is registered. Operational values remain unavailable until a site, source and timestamped observations are verified. Provider datasets are labelled separately from field measurements.</span></div><span className="notice-tag">HUMAN REVIEW REQUIRED</span></div>

        {active === "overview" && <Overview values={DEMO} chartValues={chartValues} dataLabel={dataLabel} apiUrl={apiUrl} setApiUrl={setApiUrl} apiMessage={apiMessage} apiState={apiState} onCheck={checkApi} apiRegistry={apiRegistry} moduleApiStatus={moduleApiStatus}/>}
        {active === "neoagro" && <NeoAgro values={DEMO} latitude={latitude} longitude={longitude} setLatitude={setLatitude} setLongitude={setLongitude} days={days} setDays={setDays} onLoad={loadWeather} weather={weather} weatherState={weatherState} weatherError={weatherError}/>}
        {active === "neogrid" && <NeoGrid values={DEMO}/>}
        {active === "neocell" && <NeoCell values={DEMO}/>}
        {active === "data" && <DataPanel apiUrl={apiUrl} setApiUrl={setApiUrl} apiState={apiState} apiMessage={apiMessage} onCheck={checkApi} dataLabel={dataLabel}/>}
        {active === "scenarios" && <Scenarios scenario={scenario} setScenario={setScenario} value={scenarioValue} setValue={setScenarioValue}/>}
        <footer className="nova-footer"><span>© 2026 NeoHaven Urban Labs Inc. · NOVA OS V1</span><span><a href="/console">Engineering Console</a> · Decision support only <i/> Human approval required</span></footer>
      </div>
    </main>
  </div>;
}

function pageDescription(key: ModuleKey) {
  return ({ neoagro: "Climate, soil and irrigation intelligence for agricultural operations.", neogrid: "Renewable generation, storage and site energy monitoring.", neocell: "Connected assets, gateway health and infrastructure observability.", data: "Trace every value to its source, method, timestamp and verification state.", scenarios: "Explore transparent what-if assumptions without inventing predicted outcomes." } as Record<string, string>)[key] || "";
}

function Overview({ values: v, chartValues, dataLabel, apiUrl, setApiUrl, apiMessage, apiState, onCheck, apiRegistry, moduleApiStatus }: any) {
  return <>
    <div className="nova-metrics-grid">
      <Metric label="Ambient temperature" value={String(v.temperature)} unit="°C" note="No verified site data" icon={ThermometerSun}/>
      <Metric label="Soil moisture" value={String(v.soilMoisture)} unit="%" note="No crop or sensor data available" icon={Droplets} tone="teal"/>
      <Metric label="Solar generation" value={String(v.solar)} unit="kW" note="No verified meter data" icon={Sun} tone="amber"/>
      <Metric label="Battery state of charge" value={String(v.battery)} unit="%" note="No verified battery data" icon={BatteryCharging} tone="purple"/>
    </div>
    <div className="nova-grid-two">
      <Panel title="Site signals" subtitle="Verified site observations · chronological series" action={<span className="nova-select-label">LIVE DATA WINDOW</span>}>
        <div className="nova-empty"><Activity size={24}/><b>No verified site time series</b><span>Connect an approved site and ingest timestamped, unit-normalized observations to unlock trend analysis. No synthetic chart is substituted.</span></div>
        <div className="nova-chart-foot"><span>Evidence-gated visualization</span><span>Awaiting observations</span></div>
      </Panel>
      <Panel title="Resource balance" subtitle="Verified site measurements only">
        <div className="resource-row"><div className="resource-icon teal"><Droplets size={17}/></div><div className="resource-info"><b>Water use</b><small>Awaiting verified water meter</small></div><strong>— <small>m³/day</small></strong></div>
        <div className="resource-row"><div className="resource-icon amber"><Sun size={17}/></div><div className="resource-info"><b>Solar output</b><small>Awaiting verified inverter telemetry</small></div><strong>— <small>kW</small></strong></div>
        <div className="resource-row"><div className="resource-icon purple"><BatteryCharging size={17}/></div><div className="resource-info"><b>Battery charge</b><small>State of charge</small></div><strong>— <small>%</small></strong></div>
        <div className="resource-row"><div className="resource-icon blue"><Network size={17}/></div><div className="resource-info"><b>Gateway health</b><small>No registered gateway telemetry</small></div><strong>— <small>%</small></strong></div>
        <div className="nova-empty compact"><span>Battery trend withheld until verified BMS observations are available.</span></div>
      </Panel>
    </div>
    <Panel title="Registered module connections" subtitle="API registry shared with the Engineering Console · health checks only">
      {apiRegistry.length ? apiRegistry.map((api: RegisteredApi) => <div className="resource-row" key={api.id}><div className="resource-icon blue"><Network size={16}/></div><div className="resource-info"><b>{api.name}</b><small>{api.owner} · {api.baseUrl}</small></div><Status kind={moduleApiStatus[api.owner] === "online" ? "good" : moduleApiStatus[api.owner] === "offline" ? "warn" : "muted"}>{moduleApiStatus[api.owner] === "online" ? "API reachable" : moduleApiStatus[api.owner] === "offline" ? "Unreachable" : "Checking"}</Status></div>) : <div className="nova-empty"><Server size={22}/><b>No module APIs registered</b><span>Register NOVA Core, NeoAgro, NeoCell or NeoGrid endpoints in the Engineering Console. Only non-secret base URLs belong in this registry.</span><a className="nova-button" href="/console">Open Engineering Console <ExternalLink size={12}/></a></div>}
      <div className="nova-chart-foot"><span>API reachability does not verify telemetry, calibration or data quality.</span><a href="/console">Manage connections</a></div>
    </Panel>
    <div className="nova-grid-two lower-grid">
      <Panel title="Operational flags" subtitle="Rule-based screening · not validated diagnosis">
        <div className="flag-row"><span className="flag-icon warn"><AlertTriangle size={16}/></span><div><b>Soil moisture assessment unavailable</b><small>No verified soil sensor observation, crop profile or calibration record is connected.</small></div><Status kind="muted">Not assessed</Status></div>
        <div className="flag-row"><span className="flag-icon good"><CheckCircle2 size={16}/></span><div><b>Battery status not assessed</b><small>No verified BMS measurement is available for validation.</small></div><Status kind="muted">No data</Status></div>
        <div className="flag-row"><span className="flag-icon muted"><CircleHelp size={16}/></span><div><b>Impact accounting unavailable</b><small>No verified baseline/intervention data for savings, yield or carbon claims.</small></div><Status kind="muted">Not assessed</Status></div>
      </Panel>
      <Panel title="Connect NOVA Core API" subtitle="Link this console to the deployed FastAPI service">
        <label className="nova-field-label">API base URL</label><input className="nova-input" value={apiUrl} onChange={e=>setApiUrl(e.target.value)} placeholder="https://your-nova-api.example.com"/>
        <div className="api-state-line"><span className={`api-dot ${apiState}`}/><span>{apiMessage}</span></div>
        <button className="nova-button primary full" onClick={onCheck}><Activity size={15}/> Test API connection</button>
        <small className="field-hint">Set VITE_NOVA_API_URL in Vercel project environment variables for a persistent configuration.</small>
      </Panel>
    </div>
  </>;
}

function NeoAgro({ values: v, latitude, longitude, setLatitude, setLongitude, days, setDays, onLoad, weather, weatherState, weatherError }: any) {
  const records = Array.isArray(weather?.records) ? weather.records : [];
  const units = weather?.units && typeof weather.units === "object" ? weather.units : {};
  const parameterNames = Object.keys(units);
  const missingValues = records.reduce((total: number, record: any) => (
    total + Object.values(record?.values || {}).filter((value: any) => value === null || value === undefined).length
  ), 0);
  const observedValues = records.reduce((total: number, record: any) => (
    total + Object.keys(record?.values || {}).length
  ), 0);
  return <>
    <div className="nova-metrics-grid">
      <Metric label="Soil moisture" value="—" unit="%" note="No verified field sensor observation" icon={Droplets} tone="teal"/>
      <Metric label="Air temperature" value="—" unit="°C" note="No verified site observation" icon={ThermometerSun}/>
      <Metric label="Relative humidity" value="—" unit="%" note="No verified site observation" icon={Waves} tone="blue"/>
      <Metric label="Rainfall" value="—" unit="mm" note="No verified site observation" icon={Cloud} tone="purple"/>
    </div>
    <div className="nova-grid-two">
      <Panel title="Climate data connector" subtitle="NASA POWER daily point data · public provider API">
        <div className="nova-form-grid"><div><label className="nova-field-label">Latitude</label><input className="nova-input" value={latitude} onChange={e=>setLatitude(e.target.value)} placeholder="e.g. 36.8"/></div><div><label className="nova-field-label">Longitude</label><input className="nova-input" value={longitude} onChange={e=>setLongitude(e.target.value)} placeholder="e.g. 10.2"/></div></div>
        <div className="nova-form-bottom"><div><label className="nova-field-label">History window</label><select className="nova-input" value={days} onChange={e=>setDays(e.target.value)}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="365">365 days</option></select></div><button className="nova-button primary" onClick={onLoad} disabled={weatherState === "loading"}><CloudSun size={15}/>{weatherState === "loading" ? "Loading…" : "Load NASA POWER data"}</button></div>
        {weatherError && <div className="nova-error">{weatherError}</div>}
        {weatherState === "loaded" && <div className="nova-success"><CheckCircle2 size={15}/> Provider response received. Verify units and source metadata before operational use.</div>}
        <div className="field-hint">Requires the NOVA API to be deployed and reachable. NASA POWER values are gridded/model-derived estimates, not on-site station readings.</div>
      </Panel>
      <Panel title="Agriculture assessment" subtitle="No crop-specific recommendation without verified field context">
        <div className="nova-empty"><Sprout size={24}/><b>Assessment not available</b><span>Register the site boundary, crop and variety, soil profile, irrigation method and calibrated sensor observations before calculating water status or irrigation demand.</span></div>
        <div className="flag-row"><span className="flag-icon muted"><CircleHelp size={16}/></span><div><b>Reference evapotranspiration not assessed</b><small>Requires complete meteorological inputs and a tested FAO-56 calculation with quality checks.</small></div><Status kind="muted">Not assessed</Status></div>
      </Panel>
    </div>
    <Panel title="NASA POWER data provenance" subtitle="Provider identity, request scope, units and completeness">
      {weatherState === "loaded" ? <>
        <div className="provenance-list">
          <div><span>Provider</span><b>{weather.data_source || "Not reported"}</b></div>
          <div><span>Attribution</span><b>{weather.attribution || "Not reported"}</b></div>
          <div><span>Data interpretation</span><b>{weather.data_interpretation || "Not reported"}</b></div>
          <div><span>Requested coordinates</span><b>{weather.requested_location ? `${weather.requested_location.latitude}, ${weather.requested_location.longitude}` : "Not reported"}</b></div>
          <div><span>Requested period</span><b>{weather.requested_period ? `${weather.requested_period.start_date} → ${weather.requested_period.end_date}` : "Not reported"}</b></div>
          <div><span>Time standard</span><b>{weather.source_metadata?.time_standard || "Not reported"}</b></div>
          <div><span>Daily records</span><b>{records.length}</b></div>
          <div><span>Missing parameter values</span><b>{missingValues} / {observedValues}</b></div>
          <div><span>Parameters and units</span><b>{parameterNames.length ? parameterNames.map(name => `${name}: ${units[name] || "unit not supplied"}`).join(" · ") : "Not supplied"}</b></div>
        </div>
        <div className="nova-success"><ShieldCheck size={15}/> Provider data only. NASA POWER is gridded/model- and satellite-derived, not local ground-station telemetry. Missing values are retained as null; no interpolation is applied.</div>
        <details className="nova-raw-details"><summary>Inspect raw API response</summary><pre className="nova-json">{JSON.stringify(weather, null, 2).slice(0, 16000)}</pre></details>
      </> : <div className="nova-empty"><CloudSun size={26}/><b>No provider response loaded</b><span>Enter the target site's coordinates and load the daily dataset. No pilot-site location is assumed.</span></div>}
    </Panel>
  </>;
}
function CloudRainIcon(props: any) { return <Cloud {...props}/>; }

function NeoGrid({ values: v }: any) {
  return <>
    <div className="nova-metrics-grid"><Metric label="Solar generation" value={String(v.solar)} unit="kW" note="No verified inverter telemetry" icon={Sun} tone="amber"/><Metric label="Battery state of charge" value={String(v.battery)} unit="%" note="No verified BMS measurement" icon={BatteryCharging} tone="purple"/><Metric label="Grid import/export" value="—" note="No meter feed connected" icon={Zap}/><Metric label="Carbon intensity" value="—" note="No verified grid factor or meter data" icon={Factory} tone="teal"/></div>
    <div className="nova-grid-two"><Panel title="Energy system overview" subtitle="Conceptual flow · not live telemetry"><div className="energy-flow"><div className="energy-node"><Sun/><b>PV array</b><strong>—</strong><small>No verified telemetry</small></div><div className="energy-arrow">→</div><div className="energy-node"><Zap/><b>Power bus</b><strong>—</strong><small>Not connected</small></div><div className="energy-arrow">→</div><div className="energy-node"><BatteryCharging/><b>Battery</b><strong>—</strong><small>No verified telemetry</small></div></div><div className="nova-chart-foot">Conceptual system topology only. No power balance or dispatch optimization is calculated.</div></Panel><Panel title="Grid readiness" subtitle="Data required for validated energy analytics"><div className="checklist-row"><CheckCircle2/> PV inverter telemetry <Status kind="warn">Missing</Status></div><div className="checklist-row"><CheckCircle2/> Battery BMS feed <Status kind="warn">Missing</Status></div><div className="checklist-row"><CheckCircle2/> Revenue-grade meter <Status kind="warn">Missing</Status></div><div className="checklist-row"><CheckCircle2/> Tariff and grid factor <Status kind="warn">Missing</Status></div></Panel></div>
  </>;
}

function NeoCell({ values: v }: any) {
  return <>
    <div className="nova-metrics-grid"><Metric label="Gateway health" value={String(v.gateway)} unit="%" note="No registered gateway observations" icon={Network} tone="teal"/><Metric label="Connected devices" value="—" note="No registry connected" icon={Cpu}/><Metric label="Telemetry freshness" value="—" note="No timestamps received" icon={Activity} tone="purple"/><Metric label="Open incidents" value="—" note="No incident system connected" icon={AlertTriangle} tone="amber"/></div>
    <div className="nova-grid-two"><Panel title="Infrastructure topology" subtitle="Target architecture · logical view"><div className="topology"><div className="topology-node root"><Network/><b>NOVA Core</b><small>Decision layer</small></div><div className="topology-branches"><div className="topology-node"><Sprout/><b>NeoAgro</b><small>Field / soil / weather</small></div><div className="topology-node"><Zap/><b>NeoGrid</b><small>PV / storage / meters</small></div><div className="topology-node"><Cpu/><b>NeoCell</b><small>Gateways / sensors</small></div></div></div></Panel><Panel title="Device trust checklist" subtitle="Before accepting telemetry"><div className="checklist-row"><ShieldCheck/> Device identity and ownership <Status kind="muted">Not configured</Status></div><div className="checklist-row"><ShieldCheck/> Signed / authenticated payloads <Status kind="muted">Not configured</Status></div><div className="checklist-row"><ShieldCheck/> Time synchronization <Status kind="muted">Not verified</Status></div><div className="checklist-row"><ShieldCheck/> Calibration records <Status kind="muted">Not supplied</Status></div></Panel></div>
  </>;
}

function DataPanel({ apiUrl, setApiUrl, apiState, apiMessage, onCheck, dataLabel }: any) {
  return <div className="nova-grid-two"><Panel title="API connection" subtitle="FastAPI service endpoint"><label className="nova-field-label">API base URL</label><input className="nova-input" value={apiUrl} onChange={e=>setApiUrl(e.target.value)} placeholder="https://your-nova-api.example.com"/><div className="api-state-line"><span className={`api-dot ${apiState}`}/>{apiMessage}</div><button className="nova-button primary full" onClick={onCheck}><RefreshCw size={14}/> Run health check</button></Panel><Panel title="Current provenance state" subtitle="What the console is currently showing"><div className="provenance-card"><div className="provenance-icon"><ShieldCheck/></div><div><b>{dataLabel}</b><p>No site observation is currently available in this workspace. API health and external provider data are not equivalent to field telemetry.</p></div></div><div className="provenance-list"><div><span>Data verification</span><Status kind="muted">No site data</Status></div><div><span>Method class</span><b>No assessment executed</b></div><div><span>Model training</span><b>None claimed</b></div><div><span>Impact estimates</span><b>Withheld pending baseline</b></div><div><span>Decision authority</span><b>Human operator</b></div></div></Panel><Panel title="Source classification" subtitle="Data classes supported in NOVA"><div className="source-row"><span className="source-dot live"/> Provider API / gridded model-derived data</div><div className="source-row"><span className="source-dot"/> Direct sensor / field observation</div><div className="source-row"><span className="source-dot demo"/> Synthetic or illustrative data (excluded from operational decisions)</div><div className="source-row"><span className="source-dot rule"/> Deterministic rule output</div></Panel><Panel title="Measurement requirements" subtitle="Minimum evidence for impact claims"><ul className="nova-bullets"><li>Defined site boundary and reporting period</li><li>Metered baseline and intervention period</li><li>Units, calibration and data completeness</li><li>Weather normalization where appropriate</li><li>Transparent calculation and uncertainty</li></ul></Panel></div>;
}

function Scenarios({ scenario, setScenario, value, setValue }: any) {
  const title = scenario === "water" ? "Water-demand sensitivity" : scenario === "solar" ? "Solar capacity sensitivity" : "Battery capacity sensitivity";
  const unit = scenario === "water" ? "%" : scenario === "solar" ? "kW" : "kWh";
  return <div className="nova-grid-two"><Panel title="Scenario controls" subtitle="Change assumptions to explore a what-if range"><label className="nova-field-label">Scenario type</label><select className="nova-input" value={scenario} onChange={e=>setScenario(e.target.value)}><option value="water">Water demand adjustment</option><option value="solar">Solar capacity adjustment</option><option value="battery">Battery capacity adjustment</option></select><div className="scenario-value"><span>Assumed adjustment</span><b>{value}{unit}</b></div><input className="nova-range" type="range" min="0" max="100" step="5" value={value} onChange={e=>setValue(Number(e.target.value))}/><div className="agro-scale"><span>0{unit}</span><span>100{unit}</span></div><div className="scenario-note"><AlertTriangle size={16}/> This is an assumption control only. No forecast, optimization, cost saving or engineering outcome is calculated.</div></Panel><Panel title="Scenario interpretation" subtitle={title}><div className="scenario-placeholder"><BarChart3 size={28}/><b>Awaiting verified baseline</b><span>Connect site measurements, define constraints and approve a calculation method before generating quantitative scenario outputs.</span></div><div className="provenance-list"><div><span>Input</span><b>User-defined assumption</b></div><div><span>Baseline</span><b>Not supplied</b></div><div><span>Calculation</span><b>Not executed</b></div><div><span>Recommendation</span><b>Human review required</b></div></div></Panel></div>;
}
