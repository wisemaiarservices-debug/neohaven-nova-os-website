import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { readObservationMeasurementQuality, submitObservationVerification, type EvidenceReadResult } from "../lib/novaMeasurementEvidenceClient";
import {
  Activity, ArrowLeft, CheckCircle2, Database, ExternalLink, FlaskConical,
  Gauge, Layers3, Plus, RefreshCw, Server, ShieldAlert, ShieldCheck, Trash2, Wifi, XCircle
} from "lucide-react";

const DEFAULT_CORE_API = "https://nova-core-api.neohaven.workers.dev";
const REGISTRY_KEY = "neohaven.nova.workbench.v1";

type ApiEntry = {
  id: string;
  name: string;
  owner: string;
  baseUrl: string;
};

type HealthState = "idle" | "checking" | "online" | "offline";
type Dataset = {
  dataset_id: string;
  provider: string;
  title: string;
  version: string;
  status: string;
  evidence_class: string;
  domains: string[];
  implementation_note?: string;
  limitations?: string[];
};

function readRegistry(): ApiEntry[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed?.apis)) return parsed.apis.filter((item: any) =>
      item && typeof item.id === "string" && typeof item.baseUrl === "string"
    );
  } catch {
    // Corrupt local settings are ignored; no credentials are stored here.
  }
  return [{ id: "nova-core", name: "NOVA Core API", owner: "NOVA Core", baseUrl: DEFAULT_CORE_API }];
}

function normalizeBaseUrl(value: string): string {
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

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-panel)]">
    <div className="mb-4 border-b border-border pb-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p>}
    </div>
    {children}
  </section>;
}

export default function EngineeringConsole() {
  const [apis, setApis] = useState<ApiEntry[]>(() => readRegistry());
  const [health, setHealth] = useState<Record<string, HealthState>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [catalogue, setCatalogue] = useState<Dataset[]>([]);
  const [catalogueState, setCatalogueState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [catalogueError, setCatalogueError] = useState("");
  const [activeTab, setActiveTab] = useState<"apis" | "data" | "training" | "deployments" | "evidence">(() => new URLSearchParams(window.location.search).get("tab") === "evidence" ? "evidence" : "apis");

  useEffect(() => {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify({ apis }));
  }, [apis]);

  const core = useMemo(
    () => apis.find((api) => api.owner.toLowerCase() === "nova core") ?? apis[0],
    [apis],
  );

  async function checkHealth(api: ApiEntry) {
    setHealth((current) => ({ ...current, [api.id]: "checking" }));
    setMessages((current) => ({ ...current, [api.id]: "Checking /health…" }));
    try {
      const response = await fetch(normalizeBaseUrl(api.baseUrl) + "/health", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      setHealth((current) => ({ ...current, [api.id]: "online" }));
      setMessages((current) => ({
        ...current,
        [api.id]: `${payload.service || "API"} responded successfully.`,
      }));
    } catch (error) {
      setHealth((current) => ({ ...current, [api.id]: "offline" }));
      setMessages((current) => ({
        ...current,
        [api.id]: error instanceof Error ? error.message : "Health check failed.",
      }));
    }
  }

  function addApi(event: FormEvent) {
    event.preventDefault();
    try {
      const normalized = normalizeBaseUrl(baseUrl);
      const entry: ApiEntry = {
        id: crypto.randomUUID(),
        name: name.trim(),
        owner: owner.trim(),
        baseUrl: normalized,
      };
      if (!entry.name || !entry.owner) throw new Error("Name and module owner are required.");
      if (apis.some((api) => api.baseUrl === normalized)) throw new Error("That API URL is already registered.");
      setApis((current) => [...current, entry]);
      setName("");
      setOwner("");
      setBaseUrl("");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Invalid API registration.");
    }
  }

  async function loadCatalogue() {
    if (!core) {
      setCatalogueError("Register a NOVA Core API endpoint first.");
      setCatalogueState("error");
      return;
    }
    setCatalogueState("loading");
    setCatalogueError("");
    try {
      const response = await fetch(normalizeBaseUrl(core.baseUrl) + "/api/v1/data/catalogue", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `HTTP ${response.status}`);
      setCatalogue(Array.isArray(payload.records) ? payload.records : []);
      setCatalogueState("loaded");
    } catch (error) {
      setCatalogueError(error instanceof Error ? error.message : "Dataset catalogue request failed.");
      setCatalogueState("error");
    }
  }

  const tabs = [
    ["apis", "API registry", Server],
    ["data", "Data catalogue", Database],
    ["evidence", "Measurement evidence", ShieldCheck],
    ["training", "Experiments & training", FlaskConical],
    ["deployments", "Deployments", Layers3],
  ] as const;

  return <div className="nova-console min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <a href="/" aria-label="Back to NeoHaven homepage" className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/></a>
          <div><div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">NOVA OS · INTERNAL</div><h1 className="text-lg font-semibold">Engineering Console</h1></div>
        </div>
        <a href="/os" className="text-xs text-primary hover:underline">Open Operator Workspace ↗</a>
      </div>
    </header>

    <main className="mx-auto max-w-7xl space-y-5 px-5 py-6">
      <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert size={16}/> Engineering workbench · safe mode</div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          API checks and public dataset catalogue retrieval are live. Evidence reads use a separate Cloudflare Access-protected tenant gateway. API registry entries are stored locally in this browser only. No credentials, customer records or sensor secrets are stored here. Training, persistence and production deployment controls remain disabled until their backend gates are approved.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Engineering console sections">
        {tabs.map(([key, label, Icon]) => <button key={key} onClick={() => setActiveTab(key)} className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${activeTab === key ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}><Icon size={14}/>{label}</button>)}
      </nav>

      {activeTab === "apis" && <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Registered API endpoints" subtitle="Non-secret base URLs and module ownership. Health checks confirm HTTP reachability only.">
          <div className="space-y-3">
            {apis.map((api) => <article key={api.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><div className="text-sm font-semibold">{api.name}</div><div className="mt-1 text-[11px] text-muted-foreground">{api.owner} · {api.baseUrl}</div></div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-[10px] ${health[api.id] === "online" ? "bg-emerald-500/10 text-emerald-500" : health[api.id] === "offline" ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"}`}>{health[api.id] || "not checked"}</span>
                  <button onClick={() => checkHealth(api)} disabled={health[api.id] === "checking"} className="rounded-md border border-border p-2 hover:border-primary/40" title="Test API health"><RefreshCw size={13}/></button>
                  <button onClick={() => setApis((current) => current.filter((item) => item.id !== api.id))} className="rounded-md border border-border p-2 text-muted-foreground hover:text-red-400" title="Remove local registry entry"><Trash2 size={13}/></button>
                </div>
              </div>
              {messages[api.id] && <p className="mt-2 text-[11px] text-muted-foreground">{messages[api.id]}</p>}
            </article>)}
            {!apis.length && <p className="rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground">No API endpoints registered in this browser.</p>}
          </div>
        </Panel>
        <Panel title="Add an API endpoint" subtitle="This updates only this browser's local registry; it does not register a trusted source in NOVA Core.">
          <form onSubmit={addApi} className="space-y-3">
            <label className="block text-xs">Display name<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="NeoAgro API"/></label>
            <label className="block text-xs">Module / owner<input required value={owner} onChange={(e) => setOwner(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="NeoAgro"/></label>
            <label className="block text-xs">HTTPS API base URL<input required type="url" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" placeholder="https://api.example.com"/></label>
            <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"><Plus size={14}/> Add local endpoint</button>
          </form>
          <p className="mt-4 text-[11px] leading-5 text-muted-foreground">Never enter API keys, passwords or service tokens in this form. Secrets belong in server-side environment variables and approved secret stores.</p>
        </Panel>
      </div>}

      {activeTab === "data" && <Panel title="NOVA Core research dataset catalogue" subtitle="Live read-only metadata from the shared Core. Catalogue presence does not mean the dataset is downloaded, persisted or validated for a customer site.">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">{catalogue.length} dataset records loaded</div>
          <button onClick={loadCatalogue} disabled={catalogueState === "loading"} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"><RefreshCw size={13}/>{catalogueState === "loading" ? "Loading…" : "Fetch live catalogue"}</button>
        </div>
        {catalogueError && <p className="mb-3 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-xs text-red-400">{catalogueError}</p>}
        {catalogueState !== "loaded" && !catalogueError && <p className="rounded-md border border-dashed border-border p-5 text-center text-xs text-muted-foreground">Fetch the catalogue from the registered NOVA Core API to inspect source status, evidence class, version and limitations.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {catalogue.map((dataset) => <article key={dataset.dataset_id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2"><div><div className="text-sm font-semibold">{dataset.title}</div><div className="mt-1 text-[11px] text-muted-foreground">{dataset.provider} · {dataset.version}</div></div><span className="rounded-full bg-muted px-2 py-1 text-[10px]">{dataset.status}</span></div>
            <div className="mt-3 flex flex-wrap gap-1">{dataset.domains?.map((domain) => <span key={domain} className="rounded bg-primary/10 px-2 py-1 text-[10px] text-primary">{domain}</span>)}<span className="rounded bg-muted px-2 py-1 text-[10px]">{dataset.evidence_class}</span></div>
            <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{dataset.implementation_note}</p>
            {dataset.limitations?.length ? <details className="mt-2 text-[11px]"><summary className="cursor-pointer text-primary">Limitations ({dataset.limitations.length})</summary><ul className="mt-2 list-disc space-y-1 pl-4 text-muted-foreground">{dataset.limitations.map((item, i) => <li key={i}>{item}</li>)}</ul></details> : null}
          </article>)}
        </div>
      </Panel>}

      {activeTab === "evidence" && <MeasurementEvidencePanel />}

      {activeTab === "training" && <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Experiment registry" subtitle="Reproducibility foundation under code review">
          <div className="flex items-center gap-2 text-sm font-semibold"><FlaskConical size={17} className="text-primary"/> Research pipeline · draft</div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">NOVA Core has offline experiment manifests, chronological split validation, dataset snapshot fingerprints, raster lineage and baseline evaluation contracts in review. This is not a training job runner.</p>
          <a className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline" href="https://github.com/wisemaiarservices-debug/nova-core/pull/29" target="_blank" rel="noreferrer">Review experiment pipeline PR #29 <ExternalLink size={12}/></a>
        </Panel>
        <Panel title="Model training status" subtitle="No unverified AI training claims">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-border py-2"><span>Training workers</span><b>Not implemented</b></div>
            <div className="flex justify-between border-b border-border py-2"><span>Experiment persistence</span><b>Not configured</b></div>
            <div className="flex justify-between border-b border-border py-2"><span>Independent field validation</span><b>Not available</b></div>
            <div className="flex justify-between border-b border-border py-2"><span>Cross-client generalization</span><b>Not evaluated</b></div>
            <div className="flex justify-between py-2"><span>Model promotion</span><b>Human approval required</b></div>
          </div>
        </Panel>
        <Panel title="Scientific evaluation gates" subtitle="Required before model promotion">
          <ul className="list-disc space-y-2 pl-5 text-xs leading-5 text-muted-foreground">
            <li>Versioned source datasets and immutable snapshots.</li>
            <li>Chronological and geographic/client holdouts with no leakage.</li>
            <li>Comparison against explicit baselines and task-appropriate metrics.</li>
            <li>Calibration, subgroup performance, uncertainty and drift review.</li>
            <li>Independent evidence and documented human approval.</li>
          </ul>
        </Panel>
        <Panel title="Model applicability" subtitle="Scope checks must precede inference">
          <p className="text-xs leading-5 text-muted-foreground">The new applicability gate checks crop, climate, land area, equipment, required features, units and evidence class. Unknown or out-of-scope profiles abstain. Even independently validated models remain human-review-only.</p>
          <a className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline" href="https://github.com/wisemaiarservices-debug/nova-core/pull/33" target="_blank" rel="noreferrer">Review model applicability PR #33 <ExternalLink size={12}/></a>
        </Panel>
      </div>}

      {activeTab === "deployments" && <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Vercel project status" subtitle="Current production and preview links">
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3"><span>NOVA OS public site</span><a className="text-primary hover:underline" href="https://nova-os-pied.vercel.app/" target="_blank" rel="noreferrer">Production site ↗</a></div>
            <div className="flex items-center justify-between gap-3"><span>NOVA Command Center</span><a className="text-primary hover:underline" href="https://nova-command-center-1rwl6l34i-neo-haven-urban-labs.vercel.app/nova-core" target="_blank" rel="noreferrer">Latest preview ↗</a></div>
            <div className="flex items-center justify-between gap-3"><span>NOVA Core API</span><a className="text-primary hover:underline" href={DEFAULT_CORE_API + "/health"} target="_blank" rel="noreferrer">Health endpoint ↗</a></div>
          </div>
        </Panel>
        <Panel title="Deployment safety" subtitle="No production action is triggered from this browser">
          <div className="flex items-start gap-2 rounded-md border border-primary/25 bg-primary/5 p-3 text-xs leading-5"><ShieldAlert size={16} className="mt-0.5 shrink-0 text-primary"/>Production promotion requires reviewed PRs, successful CI, environment checks and explicit approval. Preview builds are used for verification first.</div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">No Vercel token or deployment secret is requested or stored in this client-side console. Deployments are managed through the connected Git/Vercel workflow.</p>
        </Panel>
      </div>}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[10px] text-muted-foreground">
        <span>NeoHaven Urban Labs Inc. · NOVA OS Engineering</span>
        <span>Browser-local API registry · no secrets stored</span>
      </footer>
    </main>
  </div>;
}


function evidenceString(data: Record<string, unknown>, key: string): string {
  return typeof data[key] === "string" ? data[key] as string : "—";
}
function evidenceMessage(result: EvidenceReadResult | null): string {
  if (!result) return "No request made yet.";
  if (result.ok) return "Validated Core assessment · request " + result.requestId;
  const messages: Record<string, string> = {
    not_configured: "VITE_NOVA_TENANT_GATEWAY_URL is not configured.",
    invalid_request: "Enter valid tenant and observation identifiers.",
    unauthorized: "Cloudflare Access or the exact tenant grant denied this browser session.",
    not_found: "The observation is not available in this tenant scope.",
    unavailable: "The tenant gateway or NOVA Core is unavailable.",
    invalid_response: "The response failed size, request-correlation or assessment-schema validation.",
    cancelled: "The request was cancelled.",
  };
  return messages[result.reason];
}

function MeasurementEvidencePanel() {
  const [tenantId, setTenantId] = useState("");
  const [observationId, setObservationId] = useState("");
  const [qualityResult, setQualityResult] = useState<EvidenceReadResult | null>(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [assessmentConfirmation, setAssessmentConfirmation] = useState(false);
  const qualityController = useRef<AbortController | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"verify" | "reject" | "revoke">("verify");
  const [reviewEvidenceRef, setReviewEvidenceRef] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewResult, setReviewResult] = useState<EvidenceReadResult | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewConfirmation, setReviewConfirmation] = useState(false);
  const reviewController = useRef<AbortController | null>(null);

  useEffect(() => () => {
    const request = qualityController.current;
    const review = reviewController.current;
    qualityController.current = null;
    reviewController.current = null;
    request?.abort();
    review?.abort();
  }, []);

  async function loadQuality() {
    qualityController.current?.abort();
    const controller = new AbortController();
    qualityController.current = controller;
    setQualityLoading(true);
    setAssessmentConfirmation(false);
    setQualityResult(null);
    const result = await readObservationMeasurementQuality(
      tenantId.trim(), observationId.trim(), controller.signal);
    if (!controller.signal.aborted) setQualityResult(result);
    if (qualityController.current === controller) {
      qualityController.current = null;
      setQualityLoading(false);
    }
  }

  async function submitReview() {
    reviewController.current?.abort();
    const controller = new AbortController();
    reviewController.current = controller;
    setReviewLoading(true);
    setReviewConfirmation(false);
    setReviewResult(null);
    const result = await submitObservationVerification(
      tenantId.trim(), observationId.trim(), reviewDecision,
      reviewEvidenceRef.trim(), reviewReason.trim(), controller.signal);
    if (!controller.signal.aborted) {
      setReviewResult(result);
      if (result.ok) setQualityResult(null);
    }
    if (reviewController.current === controller) {
      reviewController.current = null;
      setReviewLoading(false);
    }
  }

  function resetRequestsForIdentifierChange() {
    qualityController.current?.abort();
    reviewController.current?.abort();
    qualityController.current = null;
    reviewController.current = null;
    setQualityLoading(false);
    setReviewLoading(false);
    setAssessmentConfirmation(false);
    setReviewConfirmation(false);
    setQualityResult(null);
    setReviewResult(null);
  }

  const quality = qualityResult?.ok ? qualityResult.data : null;
  const status = evidenceString(quality ?? {}, "status");
  const passed = status === "passed";
  const failed = status === "failed";

  return <div className="space-y-5">
    <Panel title="Exact tenant-scoped assessment" subtitle="Enter the exact tenant and observation IDs issued by NOVA Core. No records are guessed or populated with demo data.">
      <div className="grid gap-3 sm:grid-cols-2">
        {([
          ["Tenant ID", tenantId, setTenantId],
          ["Observation ID", observationId, setObservationId],
        ] as const).map(([label, value, setter]) => <label key={label} className="grid gap-1.5 text-[11px] text-muted-foreground">
          {label}
          <input value={value} onChange={event => { resetRequestsForIdentifierChange(); setter(event.target.value); }} autoComplete="off" spellCheck={false}
            className="min-w-0 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
            placeholder={label.toLowerCase().replaceAll(" ", "-")} />
        </label>)}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] leading-5 text-muted-foreground">
          Requires an active Cloudflare Access browser session, configured tenant gateway and an authorized tenant read grant. This action submits a POST assessment request; it does not change the original observation.
        </p>
        <button type="button" disabled={qualityLoading || !tenantId.trim() || !observationId.trim()}
          onClick={() => setAssessmentConfirmation(true)} className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">
          <ShieldCheck size={13}/> Review assessment request
        </button>
      </div>
      {assessmentConfirmation && <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4" role="group" aria-label="Confirm append-only assessment creation">
        <div className="flex items-start gap-2 text-xs font-semibold text-amber-200"><ShieldAlert size={15} className="mt-0.5 shrink-0"/> Confirm append-only Core record creation</div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">You are about to submit an assessment request for tenant <strong className="break-all text-foreground">{tenantId.trim()}</strong> and observation <strong className="break-all text-foreground">{observationId.trim()}</strong>. NOVA Core may create a new immutable assessment record. The source observation will not be modified. Repeated requests may return the existing idempotent result.</p>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => setAssessmentConfirmation(false)} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
          <button type="button" disabled={qualityLoading} onClick={() => void loadQuality()} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"><ShieldCheck size={13}/> Confirm and create assessment</button>
        </div>
      </div>}
      <p className="mt-2 text-xs text-muted-foreground" role="status" aria-live="polite">{evidenceMessage(qualityResult)}</p>
    </Panel>

    {quality && <Panel title="NOVA Core measurement-quality result" subtitle="Deterministic comparison against an independently approved customer policy">
      <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/60 p-3 text-xs">
        <span className="text-muted-foreground">Assessment status</span>
        <b className={passed ? "text-emerald-400" : failed ? "text-red-400" : "text-amber-300"}>{status}</b>
      </div>
      <p className="mt-3 rounded-md border border-border bg-background/40 p-3 text-xs leading-5 text-muted-foreground">
        Reason: {evidenceString(quality, "reason_code")}
      </p>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="text-muted-foreground">Assessment record</dt><dd className="mt-1 break-all">{evidenceString(quality, "id")}</dd></div>
        <div><dt className="text-muted-foreground">Method version</dt><dd className="mt-1">{evidenceString(quality, "method_version")}</dd></div>
        <div><dt className="text-muted-foreground">Observation</dt><dd className="mt-1 break-all">{evidenceString(quality, "observation_id")}</dd></div>
        <div><dt className="text-muted-foreground">Verified source mapping</dt><dd className="mt-1 break-all">{evidenceString(quality, "mapping_id")}</dd></div>
        <div><dt className="text-muted-foreground">Verified calibration</dt><dd className="mt-1 break-all">{evidenceString(quality, "calibration_id")}</dd></div>
        <div><dt className="text-muted-foreground">Approved quality policy</dt><dd className="mt-1 break-all">{evidenceString(quality, "policy_id")}</dd></div>
      </dl>
    </Panel>}

    <Panel title="Observation verification" subtitle="Human reviewer decisions are recorded in NOVA Core as append-only evidence events. The authenticated reviewer identity is resolved server-side.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-[11px] text-muted-foreground">Review decision
          <select value={reviewDecision} disabled={reviewLoading} onChange={event => { setReviewDecision(event.target.value as "verify" | "reject" | "revoke"); setReviewConfirmation(false); setReviewResult(null); }} className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground">
            <option value="verify">Verify observation</option>
            <option value="reject">Reject observation</option>
            <option value="revoke">Revoke prior verification</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-[11px] text-muted-foreground">Evidence reference
          <input value={reviewEvidenceRef} disabled={reviewLoading} onChange={event => { setReviewEvidenceRef(event.target.value); setReviewConfirmation(false); setReviewResult(null); }} autoComplete="off" spellCheck={false} className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground" placeholder="evidence-record-or-review-reference" />
        </label>
      </div>
      {reviewDecision !== "verify" && <label className="mt-3 grid gap-1.5 text-[11px] text-muted-foreground">Reason (required for reject or revoke)
        <textarea value={reviewReason} disabled={reviewLoading} onChange={event => { setReviewReason(event.target.value); setReviewConfirmation(false); setReviewResult(null); }} rows={3} className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground" placeholder="Document why this decision is appropriate." />
      </label>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] leading-5 text-muted-foreground">Requires an active measurement-reviewer assignment for the observation's site. Core rejects self-review and invalid state transitions. Rejection or revocation requires a reason.</p>
        <button type="button" disabled={reviewLoading || !tenantId.trim() || !observationId.trim() || !reviewEvidenceRef.trim() || (reviewDecision !== "verify" && !reviewReason.trim())} onClick={() => setReviewConfirmation(true)} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">Review decision</button>
      </div>
      {reviewConfirmation && <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4" role="group" aria-label="Confirm observation verification decision">
        <div className="text-xs font-semibold text-amber-200">Confirm Core observation state change</div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">You are about to {reviewDecision} observation <strong className="break-all text-foreground">{observationId.trim()}</strong> in tenant <strong className="break-all text-foreground">{tenantId.trim()}</strong>. This writes an append-only review event and may change the observation verification state. It does not alter the original measurement value.</p>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={() => setReviewConfirmation(false)} className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">Cancel</button>
          <button type="button" disabled={reviewLoading} onClick={() => void submitReview()} className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">Confirm and submit decision</button>
        </div>
      </div>}
      <p className="mt-2 text-xs text-muted-foreground" role="status" aria-live="polite">{reviewResult?.ok ? "Core recorded " + evidenceString(reviewResult.data, "event_type") + " · request " + reviewResult.requestId : reviewResult ? evidenceMessage(reviewResult) : "No observation review submitted."}</p>
    </Panel>

    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-5 text-amber-200/80">
      Passed means the observation value is within the explicit bounds of the independently approved policy after exact verified mapping and calibration checks. Failed means outside those bounds; it does not by itself mean unsafe or noncompliant. Not assessed means required evidence is missing, ambiguous, unverified or expired. The result does not prove scientific truth, laboratory accreditation or metrological traceability.
    </div>
  </div>;
}
