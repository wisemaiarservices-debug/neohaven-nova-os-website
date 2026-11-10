import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, AlertTriangle, ArrowUpRight, Boxes, CheckCircle2, CircleHelp,
  Cloud, Database, ExternalLink, FlaskConical, Layers3,
  Download, Link2, Plus, RefreshCw, Rocket, Server, ShieldCheck
} from "lucide-react";

type Tab = "overview" | "apis" | "data" | "models" | "deployments";
type ApiRecord = { id: string; name: string; baseUrl: string; owner: string; status: "untested" | "online" | "offline"; detail: string };
type SourceRecord = { id: string; name: string; provider: string; classification: string; refresh: string };
type DatasetRecord = { id: string; name: string; source: string; classification: string; description: string };
type ExperimentRecord = { id: string; name: string; module: string; method: string; dataset: string; status: "specification only"; createdAt: string };

const STORAGE_KEY = "neohaven.nova.workbench.v1";
const DEPLOYMENTS = [
  { name: "NOVA OS", url: "https://neohaven-nova-os-website-git-feat-n-4294c9-neo-haven-urban-labs.vercel.app/os", status: "LAST PREVIEW", kind: "Earlier successful preview · latest source not deployed", repo: "neohaven-nova-os-website", sha: "8e09817", actionLabel: "Open last preview" },
  { name: "NOVA Core API", url: "https://github.com/wisemaiarservices-debug/nova-core/pull/5", status: "SCAFFOLD ONLY", kind: "Manual deploy after merge · secrets required", repo: "nova-core", sha: "PR #5", actionLabel: "Review API PR" },
  { name: "NeoAgro", url: "https://neoagro-six.vercel.app", status: "READY", kind: "Production", repo: "neoagro-platform", sha: "d86a367", actionLabel: "Open NeoAgro" },
  { name: "NeoCell", url: "https://neocell-ebon.vercel.app", status: "READY", kind: "Production", repo: "neocell-platform", sha: "92803df", actionLabel: "Open NeoCell" },
  { name: "NeoGrid", url: "https://neogrid-sigma.vercel.app", status: "READY", kind: "Production", repo: "neogrid-platform", sha: "e829e71", actionLabel: "Open NeoGrid" },
];

const NAV: { id: Tab; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Workbench overview", icon: Boxes },
  { id: "apis", label: "API registry", icon: Server },
  { id: "data", label: "Data & datasets", icon: Database },
  { id: "models", label: "Model lab", icon: FlaskConical },
  { id: "deployments", label: "Deployments", icon: Rocket },
];

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* Ignore unavailable or invalid local browser storage. */ }
  return { apis: [], sources: [], datasets: [], experiments: [] };
}

function uid() { return globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`; }

export default function EngineeringConsole() {
  const [tab, setTab] = useState<Tab>("overview");
  const [store, setStore] = useState<{ apis: ApiRecord[]; sources: SourceRecord[]; datasets: DatasetRecord[]; experiments: ExperimentRecord[] }>(() => readStore());
  const [apiName, setApiName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiOwner, setApiOwner] = useState("NOVA Core");
  const [sourceName, setSourceName] = useState("");
  const [sourceProvider, setSourceProvider] = useState("");
  const [sourceClass, setSourceClass] = useState("provider-derived");
  const [datasetName, setDatasetName] = useState("");
  const [datasetSource, setDatasetSource] = useState("");
  const [datasetClass, setDatasetClass] = useState("provider-derived");
  const [datasetDescription, setDatasetDescription] = useState("");
  const [experimentName, setExperimentName] = useState("");
  const [experimentModule, setExperimentModule] = useState("NOVA Core");
  const [experimentMethod, setExperimentMethod] = useState("Baseline evaluation");
  const [experimentDataset, setExperimentDataset] = useState("");
  const [csvPreview, setCsvPreview] = useState<null | { name: string; bytes: number; rows: number; headers: string[]; sha256: string | null }>(null);
  const [csvError, setCsvError] = useState("");
  const [busyApi, setBusyApi] = useState<string | null>(null);
  const [notice, setNotice] = useState("Workbench metadata is stored in this browser only. No credentials are stored here.");

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }
    catch { setNotice("Browser storage is unavailable. Changes may not persist after refresh."); }
  }, [store]);

  const totalItems = store.apis.length + store.sources.length + store.datasets.length + store.experiments.length;
  const connectedApis = store.apis.filter(a => a.status === "online").length;

  function addApi(e: FormEvent) {
    e.preventDefault();
    if (!apiName.trim() || !apiUrl.trim()) return;
    let parsed: URL;
    try { parsed = new URL(apiUrl.trim()); } catch { setNotice("Enter a valid absolute API URL."); return; }
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") { setNotice("Use HTTPS for remote API endpoints. HTTP is accepted only for localhost development."); return; }
    setStore(s => ({ ...s, apis: [...s.apis, { id: uid(), name: apiName.trim(), baseUrl: parsed.toString().replace(/\/$/, ""), owner: apiOwner, status: "untested", detail: "Not tested yet" }] }));
    setApiName(""); setApiUrl(""); setNotice("API endpoint registered locally. Run a health check to verify reachability.");
  }

  function exportWorkspace() {
    const payload = {
      schema_version: 1,
      exported_at: new Date().toISOString(),
      storage_scope: "browser-local",
      warning: "Configuration metadata only. No credentials or raw CSV contents are included.",
      ...store,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `nova-engineering-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setNotice("Workspace metadata exported. The file contains no credentials or raw CSV contents.");
  }

  async function testApi(api: ApiRecord) {
    setBusyApi(api.id);
    try {
      const response = await fetch(`${api.baseUrl}/health`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.json();
      setStore(s => ({ ...s, apis: s.apis.map(a => a.id === api.id ? { ...a, status: "online", detail: `Health endpoint responded · ${new Date().toLocaleString()}` } : a) }));
      setNotice(`${api.name}: health endpoint responded. This verifies reachability only, not API correctness or data validity.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      setStore(s => ({ ...s, apis: s.apis.map(a => a.id === api.id ? { ...a, status: "offline", detail: message } : a) }));
      setNotice(`${api.name}: connection test failed — ${message}`);
    } finally { setBusyApi(null); }
  }

  function addSource(e: FormEvent) {
    e.preventDefault();
    if (!sourceName.trim() || !sourceProvider.trim()) return;
    setStore(s => ({ ...s, sources: [...s.sources, { id: uid(), name: sourceName.trim(), provider: sourceProvider.trim(), classification: sourceClass, refresh: "Manual / not scheduled" }] }));
    setSourceName(""); setSourceProvider(""); setNotice("Data source registered as metadata only. No external ingestion has been configured.");
  }

  function addDataset(e: FormEvent) {
    e.preventDefault();
    if (!datasetName.trim() || !datasetSource.trim()) return;
    setStore(s => ({ ...s, datasets: [...s.datasets, { id: uid(), name: datasetName.trim(), source: datasetSource.trim(), classification: datasetClass, description: datasetDescription.trim() || "No description supplied" }] }));
    setDatasetName(""); setDatasetSource(""); setDatasetDescription(""); setNotice("Dataset entry created in the local catalog. No file has been uploaded or validated.");
  }

  async function inspectCsv(file?: File) {
    setCsvError("");
    setCsvPreview(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setCsvError("Choose a .csv file."); return; }
    if (file.size > 20 * 1024 * 1024) { setCsvError("CSV inspection is limited to 20 MB in this V1 browser tool."); return; }
    try {
      const raw = await file.text();
      const rows = parseCsvRows(raw);
      if (rows.length < 2) throw new Error("The CSV needs a header row and at least one data row.");
      const headers = rows[0].map(value => value.trim());
      if (headers.some(value => !value)) throw new Error("Every column must have a non-empty header.");
      if (new Set(headers).size !== headers.length) throw new Error("Duplicate column headers detected. Rename them before cataloguing.");
      const widthIssues = rows.slice(1).filter(row => row.some(value => value.trim()) && row.length !== headers.length).length;
      if (widthIssues) throw new Error(`${widthIssues} data row(s) have a different number of columns than the header.`);
      let sha256: string | null = null;
      if (globalThis.crypto?.subtle) {
        const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
        sha256 = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
      }
      setCsvPreview({ name: file.name, bytes: file.size, rows: rows.length - 1, headers, sha256 });
      setNotice("CSV inspected in this browser only. The file was not uploaded or stored.");
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "Unable to inspect this CSV.");
    }
  }

  function registerInspectedCsv() {
    if (!csvPreview) return;
    const fingerprint = csvPreview.sha256 ? `SHA-256 ${csvPreview.sha256}` : "SHA-256 unavailable in this browser";
    setStore(s => ({ ...s, datasets: [...s.datasets, {
      id: uid(),
      name: csvPreview.name,
      source: "Local browser CSV inspection",
      classification: "user-supplied-file",
      description: `${csvPreview.rows} rows · ${csvPreview.headers.length} columns · ${fingerprint}`
    }] }));
    setNotice("CSV metadata added to the local catalog. Raw file contents were not uploaded or retained.");
    setCsvPreview(null);
  }

  function addExperiment(e: FormEvent) {
    e.preventDefault();
    if (!experimentName.trim()) return;
    setStore(s => ({ ...s, experiments: [...s.experiments, { id: uid(), name: experimentName.trim(), module: experimentModule, method: experimentMethod, dataset: experimentDataset || "Not selected", status: "specification only", createdAt: new Date().toLocaleString() }] }));
    setExperimentName(""); setNotice("Experiment specification saved locally. No model was trained or executed.");
  }

  return <div className="nova-shell workbench-shell">
    <aside className="nova-sidebar">
      <a className="nova-brand" href="/"><span className="nova-brand-mark">N</span><span><b>NeoHaven</b><small>URBAN LABS INC.</small></span></a>
      <div className="nova-workspace"><span className="workspace-dot"/><span><b>NOVA Engineering</b><small>PRIVATE WORKBENCH</small></span></div>
      <div className="nova-nav-label">ENGINEERING</div>
      <nav>{NAV.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={tab === id ? "active" : ""}><Icon size={17}/><span>{label}</span></button>)}</nav>
      <div className="nova-sidebar-bottom"><a className="workbench-os-link" href="/os"><Activity size={16}/> Open NOVA OS <ArrowUpRight size={14}/></a><div className="nova-user"><div className="nova-avatar">NH</div><span><b>NeoHaven Operator</b><small>Engineering access</small></span><ShieldCheck size={16}/></div></div>
    </aside>
    <main className="nova-main">
      <header className="nova-topbar"><div className="nova-breadcrumb">NeoHaven <span>/</span> <b>Engineering Console</b></div><div className="nova-top-actions"><span className="nova-env"><i/> INTERNAL WORKSPACE</span><button className="nova-button" onClick={exportWorkspace}><Download size={13}/> Export config</button><a className="nova-button" href="/os">Open NOVA OS <ArrowUpRight size={13}/></a></div></header>
      <div className="nova-content">
        <div className="nova-page-heading"><div><div className="nova-eyebrow">NOVA PLATFORM <span>•</span> BUILD / CONNECT / VERIFY</div><h1>{NAV.find(n => n.id === tab)?.label}</h1><p>Configure integrations, register evidence, prepare experiments and inspect deployments.</p></div><span className="nova-status status-muted">Control plane · V1</span></div>
        <div className="nova-notice"><div className="notice-icon"><AlertTriangle size={16}/></div><div><b>Safe engineering mode</b><span>API URLs and catalog metadata are saved in this browser only. Never enter API keys, passwords, tokens or private credentials here. Training and deployment actions remain disabled until secure backend runners are connected.</span></div><span className="notice-tag">NO SECRETS</span></div>
        {tab === "overview" && <div className="workbench-stack">
          <div className="nova-metrics-grid"><Metric label="Registered APIs" value={String(store.apis.length)} note={`${connectedApis} passed health check`} icon={Server}/><Metric label="Data sources" value={String(store.sources.length)} note="Metadata records" icon={Cloud} tone="teal"/><Metric label="Dataset records" value={String(store.datasets.length)} note="Not yet ingested or validated" icon={Database} tone="amber"/><Metric label="Experiment specs" value={String(store.experiments.length)} note="No training runs executed" icon={FlaskConical} tone="purple"/></div>
          <div className="nova-grid-two"><Panel title="Engineering workflow" subtitle="The controlled path from data to operations"><div className="workbench-flow">{[{icon:Link2,title:"Connect APIs",desc:"Register base URLs and verify health endpoints."},{icon:Database,title:"Register data",desc:"Track source, units, provenance and dataset versions."},{icon:FlaskConical,title:"Prepare models",desc:"Define method, dataset, validation and acceptance criteria."},{icon:Rocket,title:"Deploy safely",desc:"Run CI, review artifacts and promote only after approval."}].map(({icon:Icon,title,desc},i)=><div className="workbench-flow-row" key={title}><span className="flow-step">{i+1}</span><Icon size={18}/><div><b>{title}</b><small>{desc}</small></div><Status kind={i<2?"muted":"warn"}>{i<2?"Available":"Runner required"}</Status></div>)}</div></Panel><Panel title="System guardrails" subtitle="What this workbench will and will not do"><div className="provenance-list"><div><span>Secrets management</span><b>Server-side only</b></div><div><span>Training execution</span><b>Not connected</b></div><div><span>Deployment promotion</span><b>Human approval</b></div><div><span>Data provenance</span><b>Required</b></div><div><span>Critical operations</span><b>Human-controlled</b></div></div></Panel></div>
          <Panel title="Recent workspace activity" subtitle="Local browser registry summary"><div className="workbench-empty"><Layers3 size={25}/><b>{totalItems ? `${totalItems} local records registered` : "Workbench ready for configuration"}</b><span>{totalItems ? "Use the sections on the left to inspect and update your local registries." : "Start by registering the NOVA Core API, then add verified data sources and datasets."}</span><button className="nova-button primary" onClick={() => setTab("apis")}>Configure API registry</button></div></Panel>
        </div>}
        {tab === "apis" && <div className="workbench-stack"><Panel title="Register API endpoint" subtitle="Store a non-secret base URL and test its /health endpoint"><form className="workbench-form" onSubmit={addApi}><div><label className="nova-field-label">Display name</label><input className="nova-input" value={apiName} onChange={e=>setApiName(e.target.value)} placeholder="NOVA Core API" required/></div><div><label className="nova-field-label">Base URL</label><input className="nova-input" type="url" value={apiUrl} onChange={e=>setApiUrl(e.target.value)} placeholder="https://api.example.org" required/></div><div><label className="nova-field-label">Owning module</label><select className="nova-input" value={apiOwner} onChange={e=>setApiOwner(e.target.value)}><option>NOVA Core</option><option>NeoAgro</option><option>NeoCell</option><option>NeoGrid</option><option>External provider</option></select></div><button className="nova-button primary" type="submit"><Plus size={14}/> Register endpoint</button></form></Panel><Panel title="API registry" subtitle="Endpoint reachability is not a full integration test">{store.apis.length ? store.apis.map(api=><div className="workbench-record" key={api.id}><div className="record-icon"><Server size={17}/></div><div className="record-main"><b>{api.name}</b><small>{api.baseUrl} · {api.owner}</small><small>{api.detail}</small></div><Status kind={api.status==="online"?"good":api.status==="offline"?"warn":"muted"}>{api.status}</Status><button className="nova-button" disabled={busyApi===api.id} onClick={()=>testApi(api)}><RefreshCw size={13}/>{busyApi===api.id?"Testing":"Test /health"}</button></div>) : <Empty>No API endpoints registered yet.</Empty>}</Panel></div>}
        {tab === "data" && <div className="workbench-stack"><Panel title="Register data source" subtitle="Record where data comes from and how it should be classified"><form className="workbench-form" onSubmit={addSource}><div><label className="nova-field-label">Source name</label><input className="nova-input" value={sourceName} onChange={e=>setSourceName(e.target.value)} placeholder="NASA POWER Daily" required/></div><div><label className="nova-field-label">Provider / origin</label><input className="nova-input" value={sourceProvider} onChange={e=>setSourceProvider(e.target.value)} placeholder="NASA POWER" required/></div><div><label className="nova-field-label">Classification</label><select className="nova-input" value={sourceClass} onChange={e=>setSourceClass(e.target.value)}><option value="provider-derived">Provider-derived / gridded</option><option value="direct-observation">Direct field observation</option><option value="synthetic-demo">Synthetic / demo</option><option value="derived-calculation">Derived calculation</option></select></div><button className="nova-button primary" type="submit"><Plus size={14}/> Add source</button></form></Panel><Panel title="Register dataset metadata" subtitle="Catalog only: no file upload or ingestion is performed"><form className="workbench-form" onSubmit={addDataset}><div><label className="nova-field-label">Dataset name</label><input className="nova-input" value={datasetName} onChange={e=>setDatasetName(e.target.value)} placeholder="Site weather daily v1" required/></div><div><label className="nova-field-label">Source / URI reference</label><input className="nova-input" value={datasetSource} onChange={e=>setDatasetSource(e.target.value)} placeholder="NASA POWER · point · lat/lon" required/></div><div><label className="nova-field-label">Classification</label><select className="nova-input" value={datasetClass} onChange={e=>setDatasetClass(e.target.value)}><option value="provider-derived">Provider-derived</option><option value="direct-observation">Direct observation</option><option value="synthetic-demo">Synthetic / demo</option><option value="derived-calculation">Derived calculation</option></select></div><div><label className="nova-field-label">Description / units / period</label><input className="nova-input" value={datasetDescription} onChange={e=>setDatasetDescription(e.target.value)} placeholder="Daily T2M °C · YYYY-MM-DD to YYYY-MM-DD"/></div><button className="nova-button primary" type="submit"><Plus size={14}/> Add dataset record</button></form></Panel><Panel title="Local CSV inspector" subtitle="Inspect a dataset in this browser before registering its metadata"><div className="workbench-csv-upload"><label className="nova-field-label">Choose CSV file · maximum 20 MB</label><input className="nova-input" type="file" accept=".csv,text/csv" onChange={e=>inspectCsv(e.target.files?.[0])}/><small className="field-hint">The file is read locally in your browser. It is not uploaded, saved to the server or retained in the catalog.</small></div>{csvError && <div className="nova-error">{csvError}</div>}{csvPreview && <div className="csv-preview"><div className="provenance-list"><div><span>File</span><b>{csvPreview.name}</b></div><div><span>Rows</span><b>{csvPreview.rows.toLocaleString()}</b></div><div><span>Columns</span><b>{csvPreview.headers.length}</b></div><div><span>Size</span><b>{(csvPreview.bytes/1024).toFixed(1)} KB</b></div><div><span>Fingerprint</span><b>{csvPreview.sha256 ? csvPreview.sha256.slice(0,20)+"…" : "Unavailable"}</b></div></div><div className="csv-headers">{csvPreview.headers.map(header=><span key={header}>{header}</span>)}</div><button className="nova-button primary" onClick={registerInspectedCsv}>Register dataset metadata</button></div>}</Panel><Panel title="Data catalog" subtitle="Browser-local metadata · not a durable shared database">{store.sources.map(source=><div className="workbench-record" key={source.id}><div className="record-icon"><Cloud size={17}/></div><div className="record-main"><b>{source.name}</b><small>{source.provider} · {source.classification}</small></div><Status kind="muted">{source.refresh}</Status></div>)}{store.datasets.map(dataset=><div className="workbench-record" key={dataset.id}><div className="record-icon"><Database size={17}/></div><div className="record-main"><b>{dataset.name}</b><small>{dataset.source} · {dataset.classification}</small><small>{dataset.description}</small></div><Status kind="warn">Metadata only</Status></div>)}{!store.sources.length&&!store.datasets.length&&<Empty>No sources or datasets registered.</Empty>}</Panel></div>}
        {tab === "models" && <div className="workbench-stack"><Panel title="Create model experiment specification" subtitle="Record an experiment plan without claiming training has run"><form className="workbench-form" onSubmit={addExperiment}><div><label className="nova-field-label">Experiment name</label><input className="nova-input" value={experimentName} onChange={e=>setExperimentName(e.target.value)} placeholder="NeoAgro irrigation baseline v0" required/></div><div><label className="nova-field-label">Module</label><select className="nova-input" value={experimentModule} onChange={e=>setExperimentModule(e.target.value)}><option>NOVA Core</option><option>NeoAgro</option><option>NeoCell</option><option>NeoGrid</option></select></div><div><label className="nova-field-label">Method / model family</label><input className="nova-input" value={experimentMethod} onChange={e=>setExperimentMethod(e.target.value)} placeholder="FAO-56 ET₀ / deterministic baseline"/></div><div><label className="nova-field-label">Dataset</label><select className="nova-input" value={experimentDataset} onChange={e=>setExperimentDataset(e.target.value)}><option value="">Not selected</option>{store.datasets.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}</select></div><button className="nova-button primary" type="submit"><Plus size={14}/> Save experiment specification</button></form></Panel><Panel title="Experiment registry" subtitle="No training execution until a secure runner and validation pipeline exist">{store.experiments.length ? store.experiments.map(ex=><div className="workbench-record" key={ex.id}><div className="record-icon"><FlaskConical size={17}/></div><div className="record-main"><b>{ex.name}</b><small>{ex.module} · {ex.method} · Dataset: {ex.dataset}</small><small>Created {ex.createdAt}</small></div><Status kind="warn">{ex.status}</Status></div>) : <Empty>No experiment specifications yet.</Empty>}</Panel><Panel title="Training gate" subtitle="Required before any real training run"><div className="workbench-flow">{["Versioned dataset with provenance and schema","Train / validation / test split and leakage checks","Baseline metric and acceptance threshold","Reproducible environment and pinned dependencies","Model card, limitations and human review"].map((item,i)=><div className="checklist-row" key={item}><CircleHelp size={15}/>{item}<Status kind="muted">Required</Status></div>)}</div><div className="scenario-note"><AlertTriangle size={16}/> Training runner is not connected. The console will not label an experiment as trained until a real job returns logs, artifacts and evaluation metrics.</div></Panel></div>}
        {tab === "deployments" && <div className="workbench-stack"><Panel title="Platform deployment status" subtitle="Verified production product domains, NOVA OS preview and NOVA Core API scaffold">{DEPLOYMENTS.map(dep=><div className="workbench-record" key={dep.name}><div className="record-icon"><Rocket size={17}/></div><div className="record-main"><b>{dep.name}</b><small>{dep.kind} · {dep.repo} · commit {dep.sha}</small><small>{dep.url.replace("https://","")}</small></div><Status kind={dep.status === "READY" ? "good" : "warn"}>{dep.status}</Status><a className="nova-button" href={dep.url} target="_blank" rel="noreferrer">{dep.actionLabel} <ExternalLink size={13}/></a></div>)}</Panel><Panel title="Release policy" subtitle="Deployment control remains gated"><div className="provenance-list"><div><span>Build verification</span><b>GitHub Actions / CI</b></div><div><span>Preview review</span><b>Required</b></div><div><span>Production promotion</span><b>Explicit approval</b></div><div><span>Rollback plan</span><b>Required before release</b></div><div><span>Billing guardrail</span><b>Free-tier / cost review first</b></div></div></Panel></div>}
        <div className="workbench-toast" role="status"><CheckCircle2 size={14}/>{notice}</div>
        <footer className="nova-footer"><span>© 2026 NeoHaven Urban Labs Inc. · Engineering Console V1</span><span>Configuration workspace <i/> No autonomous production changes</span></footer>
      </div>
    </main>
  </div>;
}

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      row.push(field);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; field = "";
      if (char === "\r" && input[i + 1] === "\n") i += 1;
    } else field += char;
  }
  if (quoted) throw new Error("The CSV contains an unclosed quoted field.");
  if (field.length || row.length) { row.push(field); if (row.some(value => value.trim())) rows.push(row); }
  return rows;
}

function Metric({ label, value, note, icon: Icon, tone = "blue" }: { label: string; value: string; note: string; icon: typeof Activity; tone?: string }) {
  return <article className="nova-metric"><div className="nova-metric-top"><span>{label}</span><span className={`nova-icon tone-${tone}`}><Icon size={17}/></span></div><div className="nova-metric-value">{value}</div><div className="nova-metric-note">{note}</div></article>;
}
function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="nova-panel"><div className="nova-panel-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div></div>{children}</section>;
}
function Status({ children, kind = "good" }: { children: React.ReactNode; kind?: "good" | "warn" | "muted" }) {
  return <span className={`nova-status status-${kind}`}><i/>{children}</span>;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="workbench-empty"><Database size={22}/><span>{children}</span></div>;
}
