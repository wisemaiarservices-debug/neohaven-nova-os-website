import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Play,
  Sprout,
  Zap,
  Cpu,
  Brain,
  Eye,
  BarChart3,
  TrendingUp,
  Lightbulb,
  GitBranch,
  Sliders,
  Gauge,
  Mail,
  ExternalLink,
  ShieldCheck,
  Network,
  Activity,
  Droplets,
  Check,
  X,
  Linkedin,
  Sun,
  Wind,
  Waves,
  Recycle,
  CloudRain,
  Leaf,
  LineChart,
  Building2,
  Users,
  ShieldAlert,
  Cpu as CpuIcon,
} from "lucide-react";

const NAV = [
  { label: "Home", href: "#home" },
  { label: "NOVA OS", href: "#nova-os" },
  { label: "Products", href: "#products" },
  { label: "How It Works", href: "#how" },
  { label: "Use Case", href: "#use-case" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Investors", href: "#investors" },
  { label: "Videos", href: "#videos" },
  { label: "Contact", href: "#contact" },
];

export default function App() {
  return (
    <div id="home" className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <NovaOS />
      <SolutionMap />
      <Products />
      <HowItWorks />
      <UseCase />
      <WhyItMatters />
      <MarketDrivers />
      <Roadmap />
      <Investors />
      <Videos />
      <Contact />
      <Footer />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors ${
        scrolled ? "border-border bg-background/85 backdrop-blur-xl" : "border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="#home" className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">NeoHaven</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              AI Urban Labs
            </div>
          </div>
        </a>
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden lg:block">
          <a
            href="#contact"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3.5 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Request Pilot <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden text-muted-foreground"
          aria-label="Menu"
        >
          <div className="flex flex-col gap-1">
            <span className="block h-px w-5 bg-current" />
            <span className="block h-px w-5 bg-current" />
            <span className="block h-px w-5 bg-current" />
          </div>
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background/95 px-6 py-4 lg:hidden">
          <div className="grid grid-cols-2 gap-3">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`${className} grid place-items-center rounded-md bg-gradient-to-br from-primary to-accent font-mono text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] ring-1 ring-border`}
    >
      N
    </div>
  );
}

function Hero() {
  return (
    <section
      className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="absolute inset-0 grid-bg opacity-60" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Pilot-ready · NeoHaven AI Urban Labs
        </div>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              NOVA OS / v1.0
            </div>
            <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              NOVA <span className="text-gradient">OS</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-foreground/85 sm:text-xl">
              Decision Intelligence for Sustainable Infrastructure Operations.
            </p>
            <p className="mt-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              NOVA OS turns fragmented agriculture, renewable energy, water, sensor, and
              infrastructure data into operator-approved decisions for sustainable infrastructure
              sites. It connects NeoAgro, NeoGrid, NeoCell, NOVA Core AI, Digital Twin, Knowledge
              Graph, and Impact Reports into one command center.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#videos"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
              >
                <Play className="h-4 w-4" /> Watch Product Demo
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
              >
                Contact for Pilots / Investment <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-6">
              {[
                { k: "Modules", v: "4" },
                { k: "Decision steps", v: "7" },
                { k: "Status", v: "Pilot-ready" },
              ].map((s) => (
                <div key={s.k}>
                  <div className="font-mono text-2xl text-foreground">{s.v}</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    {s.k}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <VideoFrame id="Y-5wq1HtH1A" label="NOVA OS — Command Center" />
          </div>
        </div>
        <div className="mt-14 grid gap-3 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Pilot-ready product stack",
            "Strategic pilot deployments",
            "Operator-approved decision support",
            "No autonomous physical control",
          ].map((c) => (
            <div
              key={c}
              className="flex items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2.5 text-[12px] text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {c}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoFrame({ id, label }: { id: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-2 shadow-[var(--shadow-panel)]">
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive/70" />
          <span className="h-2 w-2 rounded-full bg-chart-4/70" />
          <span className="h-2 w-2 rounded-full bg-accent/70" />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
      </div>
      <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${id}`}
          title={label}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  copy,
}: {
  kicker: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="mb-12 max-w-3xl">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{kicker}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {copy && <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{copy}</p>}
    </div>
  );
}

function NovaOS() {
  return (
    <section id="nova-os" className="border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          kicker="01 / Platform"
          title="What is NOVA OS?"
          copy="NOVA OS is an AI decision intelligence platform for sustainable infrastructure operations. It helps operators observe, analyze, forecast, recommend, simulate, optimize, and measure impact across agrivoltaic, renewable energy, and field infrastructure environments."
        />
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            {[
              {
                icon: Network,
                title: "Connected Operations",
                body: "Unifies agriculture, energy, water, sensors, and infrastructure context.",
              },
              {
                icon: Brain,
                title: "Decision Intelligence",
                body: "Forecasts risks, recommends actions, simulates outcomes, and supports operator approval.",
              },
              {
                icon: Activity,
                title: "Measurable Impact",
                body: "Tracks water, carbon, resilience, yield-risk, and infrastructure readiness outcomes.",
              },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="flex gap-4 rounded-lg border border-border bg-surface/60 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background/60 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-foreground">{c.title}</div>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{c.body}</p>
                  </div>
                </div>
              );
            })}
            <p className="rounded-md border border-border bg-surface p-4 text-foreground">
              <ShieldCheck className="mr-2 inline h-4 w-4 text-accent" />
              The system is designed around operator-approved recommendations. NOVA OS does not
              perform autonomous physical control.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-panel)]">
            <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>nova-os.system</span>
              <span className="text-accent">● operational</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {[
                "NeoAgro",
                "NeoGrid",
                "NeoCell",
                "NOVA Core AI",
                "Digital Twin",
                "Knowledge Graph",
                "Impact Reports",
                "Operator Console",
              ].map((m) => (
                <div
                  key={m}
                  className="flex items-center justify-between rounded border border-border bg-background/40 px-3 py-2"
                >
                  <span className="font-mono text-foreground">{m}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const PRODUCTS = [
  {
    icon: Sprout,
    code: "M01",
    name: "NeoAgro",
    sub: "NOVA Agriculture",
    body:
      "Agrivoltaic intelligence for crop health, water efficiency, energy coordination, recommendations, and impact reporting.",
    features: ["Crop health & water efficiency", "Energy coordination", "Operator recommendations & impact reports"],
  },
  {
    icon: Zap,
    code: "M02",
    name: "NeoGrid",
    sub: "NOVA Energy",
    body:
      "Energy intelligence for solar production, battery systems, grid coordination, carbon impact, and operator-approved optimization.",
    features: ["Solar production & battery systems", "Grid coordination & carbon impact", "Operator-approved optimization"],
  },
  {
    icon: Cpu,
    code: "M03",
    name: "NeoCell",
    sub: "NOVA Infrastructure",
    body:
      "AI-ready infrastructure readiness for gateways, sensors, power, water, communications, edge compute, and deployment planning.",
    features: ["Gateways, sensors, power & water", "Communications & edge compute", "Deployment planning"],
  },
  {
    icon: Brain,
    code: "M04",
    name: "NOVA Core AI",
    sub: "Decision engine",
    body:
      "Forecasting, recommendations, scenario simulation, explainability, and operator-approved decision support.",
    features: ["Forecasting & recommendations", "Scenario simulation & explainability", "Operator-approved decision support"],
  },
];

function Products() {
  return (
    <section id="products" className="border-t border-border bg-surface/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          kicker="02 / Product Modules"
          title="One platform. Four operating modules."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {PRODUCTS.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.code}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface p-7 transition-colors hover:border-primary/40"
              >
                <div className="absolute right-5 top-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {p.code}
                </div>
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-background/60 text-primary transition-colors group-hover:border-primary/50 group-hover:text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{p.name}</h3>
                <div className="mt-0.5 text-[12px] font-medium uppercase tracking-[0.14em] text-primary">
                  {p.sub}
                </div>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{p.body}</p>
                <ul className="mt-4 space-y-2 border-t border-border pt-4">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-foreground/90">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Eye, label: "Observe" },
  { icon: BarChart3, label: "Analyze" },
  { icon: TrendingUp, label: "Forecast" },
  { icon: Lightbulb, label: "Recommend" },
  { icon: GitBranch, label: "Simulate" },
  { icon: Sliders, label: "Optimize" },
  { icon: Gauge, label: "Measure Impact" },
];

function HowItWorks() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <section id="how" className="border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          kicker="03 / Workflow"
          title="How NOVA OS Works"
          copy="NOVA OS connects operational data to digital twin context, knowledge graph relationships, AI recommendations, operator approval, and measurable impact reports."
        />
        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-panel)] sm:p-8">
          <div className="grid gap-3 sm:grid-cols-7">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === active;
              return (
                <div key={s.label} className="relative">
                  <div
                    className={`rounded-lg border p-4 text-center transition-all duration-500 ${
                      isActive
                        ? "border-primary/60 bg-primary/10 shadow-[var(--shadow-glow)] -translate-y-1"
                        : "border-border bg-background/40 hover:border-primary/40"
                    }`}
                  >
                    <div
                      className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                        isActive ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      Step {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-foreground">{s.label}</div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="absolute right-[-9px] top-1/2 hidden -translate-y-1/2 text-border sm:block">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-8 border-t border-border pt-6">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Architecture flow
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              {[
                "Data Sources",
                "Digital Twin",
                "Knowledge Graph",
                "NOVA Core AI",
                "Operator Approval",
                "Impact Reports",
              ].map((n, i, arr) => (
                <span key={n} className="flex items-center gap-2">
                  <span className="rounded border border-border bg-background/60 px-2.5 py-1 font-mono text-foreground">
                    {n}
                  </span>
                  {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const KPIS: { label: string; value: string }[] = [
  { label: "Water savings", value: "3.2 m³" },
  { label: "Carbon reduction", value: "21.8 kg CO₂e" },
  { label: "Resilience gain", value: "+12%" },
  { label: "Yield-risk reduction", value: "−11%" },
  { label: "Infrastructure readiness", value: "tracked" },
];

// ──────────────────────────────────────────────────────────────────
// Interactive: Solution Map (replaces static "Key Features" diagram)
// ──────────────────────────────────────────────────────────────────

type Branch = {
  id: string;
  label: string;
  icon: typeof Sun;
  tone: "primary" | "accent" | "agro" | "grid";
  children: { label: string; icon: typeof Sun }[];
};

const BRANCHES: Branch[] = [
  {
    id: "core",
    label: "NOVA Core",
    icon: Brain,
    tone: "primary",
    children: [
      { label: "Modular Design", icon: GitBranch },
      { label: "AI Monitoring", icon: Activity },
      { label: "AI Prediction", icon: TrendingUp },
      { label: "AI Optimization", icon: Sliders },
    ],
  },
  {
    id: "agro",
    label: "Enhanced Agriculture",
    icon: Sprout,
    tone: "agro",
    children: [
      { label: "Climate Analytics", icon: CloudRain },
      { label: "Soil Monitoring", icon: Leaf },
      { label: "Smart Irrigation", icon: Droplets },
      { label: "Yield Forecasting", icon: LineChart },
      { label: "Agrivoltaic Integration", icon: Sun },
    ],
  },
  {
    id: "grid",
    label: "Microgrid",
    icon: Zap,
    tone: "grid",
    children: [
      { label: "Solar Power", icon: Sun },
      { label: "Hydro Power", icon: Waves },
      { label: "Wind Power", icon: Wind },
      { label: "Biomass Power", icon: Recycle },
    ],
  },
];

function SolutionMap() {
  const [active, setActive] = useState<string>("core");
  const current = BRANCHES.find((b) => b.id === active)!;

  return (
    <section className="border-t border-border bg-surface/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          kicker="01.5 / Solution Map"
          title="NOVA OS — interactive solution stack"
          copy="Hover or tap a branch to expand its capabilities. Each branch maps to a real product domain inside the NOVA OS platform."
        />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-3">
            {BRANCHES.map((b) => {
              const Icon = b.icon;
              const isActive = active === b.id;
              return (
                <button
                  key={b.id}
                  onMouseEnter={() => setActive(b.id)}
                  onFocus={() => setActive(b.id)}
                  onClick={() => setActive(b.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    isActive
                      ? "border-primary/60 bg-primary/10 shadow-[var(--shadow-glow)] -translate-y-0.5"
                      : "border-border bg-surface hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-md border border-border ${
                        isActive ? "bg-primary/15 text-accent" : "bg-background/60 text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{b.label}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {b.children.length} capabilities
                      </div>
                    </div>
                    <ArrowRight
                      className={`ml-auto h-4 w-4 transition-transform ${
                        isActive ? "translate-x-0.5 text-accent" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="lg:col-span-8">
            <div className="relative rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-panel)] sm:p-8">
              <div className="mb-6 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>branch / {current.id}</span>
                <span className="text-accent">● live</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {current.children.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.label}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3.5 animate-fade-in"
                      style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-[13px] font-medium text-foreground">{c.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────
// Interactive: Market Drivers (animated growing bars on scroll)
// ──────────────────────────────────────────────────────────────────

const DRIVERS = [
  { label: "Renewable Energy Growth", value: 92, icon: Sun },
  { label: "Energy Communities", value: 78, icon: Users },
  { label: "Grid Decentralization", value: 84, icon: Network },
  { label: "AI Maturity", value: 88, icon: CpuIcon },
  { label: "Sustainability Regulations", value: 95, icon: ShieldAlert },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setSeen(true),
      { threshold: 0.25 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

function MarketDrivers() {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          kicker="05.5 / Market Drivers"
          title="Why now: five forces driving sustainable infrastructure"
          copy="NOVA OS rides converging tailwinds in renewables, grid decentralization, AI maturity, and tightening sustainability mandates."
        />
        <div
          ref={ref}
          className="grid gap-4 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-panel)] sm:p-8"
        >
          {DRIVERS.map((d, i) => {
            const Icon = d.icon;
            return (
              <div key={d.label} className="grid items-center gap-3 sm:grid-cols-12">
                <div className="flex items-center gap-3 sm:col-span-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/60 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-[14px] font-medium text-foreground">{d.label}</div>
                </div>
                <div className="sm:col-span-7">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-background/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] ease-out"
                      style={{
                        width: seen ? `${d.value}%` : "0%",
                        transitionDuration: "1200ms",
                        transitionDelay: `${i * 120}ms`,
                      }}
                    />
                  </div>
                </div>
                <div className="font-mono text-[12px] text-accent sm:col-span-1 sm:text-right">
                  {d.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function UseCase() {
  return (
    <section id="use-case" className="border-t border-border bg-surface/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader kicker="04 / Pilot Use Case" title="Agrivoltaic Heatwave and Water-Stress Management" />
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="space-y-5 text-[15px] leading-relaxed text-muted-foreground lg:col-span-3">
            <p>
              NOVA OS is being prepared for agrivoltaic and renewable infrastructure pilot
              scenarios where operators need to coordinate crop stress, irrigation, solar
              production, battery conditions, sensors, gateways, and infrastructure readiness.
            </p>
            <p>
              The platform helps teams review recommended actions, simulate outcomes, and measure
              water, carbon, resilience, and yield-risk impact.
            </p>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-panel)]">
              <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span>Scenario targets</span>
                <span className="text-accent">● example</span>
              </div>
              <ul className="divide-y divide-border">
                {KPIS.map((k) => (
                  <li key={k.label} className="flex items-center justify-between py-3 text-sm">
                    <span className="text-foreground">{k.label}</span>
                    <span className="font-mono text-xs text-accent">{k.value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                Scenario target values shown for illustration of pilot KPIs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhyItMatters() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          kicker="05 / Why It Matters"
          title="Sustainable Infrastructure Needs Decisions, Not Dashboards"
          copy="Agriculture, renewable energy, water, and infrastructure are no longer separate operational challenges. NOVA OS creates one decision intelligence layer to help operators coordinate complex systems safely, transparently, and measurably."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface/60 p-7">
            <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <X className="h-3.5 w-3.5 text-destructive" /> Old way
            </div>
            <ul className="space-y-3 text-[14px] text-muted-foreground">
              {[
                "Fragmented dashboards",
                "Manual interpretation",
                "Disconnected energy/agriculture workflows",
                "Limited impact visibility",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/80" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-7">
            <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              <Check className="h-3.5 w-3.5 text-accent" /> NOVA OS way
            </div>
            <ul className="space-y-3 text-[14px] text-foreground">
              {[
                "Unified command center",
                "Digital twin context",
                "AI-supported recommendations",
                "Operator-approved action",
                "Measurable impact reports",
              ].map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const ROADMAP = [
  {
    when: "Now",
    body: "Pilot-ready NOVA OS product stack with command center, product modules, videos, and ecosystem validation.",
  },
  {
    when: "0–3 months",
    body: "Hosted demo, public website, product hardening, investor materials, pilot onboarding package.",
  },
  {
    when: "3–6 months",
    body: "Pilot partner validation across agrivoltaic, renewable energy, or sustainable infrastructure use cases.",
  },
  {
    when: "6–9 months",
    body: "Data integration, digital twin refinement, recommendation workflow validation, deployment readiness.",
  },
  {
    when: "9–12 months",
    body: "Paid pilots, site-based licensing, early revenue, strategic partnerships, stronger fundraising position.",
  },
  {
    when: "12–24 months",
    body: "Production readiness, multi-site deployment, partner integrations, API planning, and international expansion.",
  },
];

function Roadmap() {
  return (
    <section id="roadmap" className="border-t border-border bg-surface/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader kicker="06 / Roadmap" title="From pilot-ready to multi-site deployment." />
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border sm:left-1/2" aria-hidden />
          <div className="space-y-6">
            {ROADMAP.map((r, i) => (
              <div
                key={r.when}
                className={`relative grid gap-4 sm:grid-cols-2 sm:gap-12 ${
                  i % 2 === 1 ? "sm:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className="pl-10 sm:pl-0 sm:pr-8 sm:text-right">
                  <div className="absolute left-1.5 top-2 h-3 w-3 rounded-full border-2 border-primary bg-background sm:left-1/2 sm:-translate-x-1/2" />
                  <div className="inline-block rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
                    {r.when}
                  </div>
                </div>
                <div className="pl-10 sm:pl-8">
                  <p className="text-[14px] leading-relaxed text-muted-foreground">{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-10 max-w-3xl text-[15px] leading-relaxed text-foreground">
          NOVA OS is moving from pilot-ready product stack to validated infrastructure intelligence platform.
        </p>
      </div>
    </section>
  );
}

const SEEKING = [
  "Pilot partners",
  "Agrivoltaic site collaborators",
  "Renewable infrastructure partners",
  "Climate-tech mentors",
  "Smart infrastructure teams",
  "Early-stage investors",
  "Strategic deployment partners",
];

function Investors() {
  return (
    <section id="investors" className="border-t border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          kicker="07 / Investors & Partners"
          title="Available for Selected Strategic Pilot Deployments"
          copy="NOVA OS is currently available for selected strategic pilot deployments, investor-backed implementations, and partnership evaluations."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-7">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              NeoHaven is seeking
            </div>
            <ul className="mt-4 space-y-2.5">
              {SEEKING.map((s) => (
                <li key={s} className="flex items-start gap-2 text-[14px] text-foreground">
                  <span className="mt-2 h-1 w-1 rounded-full bg-accent" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-7">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              Funding target
            </div>
            <div className="mt-3 text-4xl font-semibold tracking-tight">
              €150k<span className="text-muted-foreground">–</span>€300k
            </div>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Pilot / pre-seed support for investor-backed implementations and strategic deployment
              partnerships.
            </p>
            <a
              href="#contact"
              className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Open investor conversation <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div className="rounded-xl border border-border bg-surface p-7">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Use of funds
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              Hosted product deployment, product hardening, pilot integration, data ingestion,
              engineering support, legal/IP, business development, and deployment readiness.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const VIDEOS = [
  { id: "Y-5wq1HtH1A", title: "NOVA OS", sub: "Sustainable Infrastructure Command Center" },
  { id: "JzN98DGCqCQ", title: "NeoAgro", sub: "Agrivoltaic Intelligence" },
  { id: "yTPQ_n34s60", title: "NeoGrid", sub: "Renewable Energy Intelligence" },
  { id: "PM1TXWIvx48", title: "NeoCell", sub: "Infrastructure Readiness" },
];

function Videos() {
  return (
    <section id="videos" className="border-t border-border bg-surface/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader kicker="08 / Product Videos" title="Watch NOVA OS and the module stack." />
        <div className="grid gap-6 md:grid-cols-2">
          {VIDEOS.map((v) => (
            <div key={v.id}>
              <VideoFrame id={v.id} label={`${v.title} — ${v.sub}`} />
              <div className="mt-3 flex items-baseline justify-between px-1">
                <div>
                  <div className="text-base font-semibold text-foreground">{v.title}</div>
                  <div className="text-[12px] text-muted-foreground">{v.sub}</div>
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-primary hover:text-accent"
                >
                  YouTube <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="border-t border-border py-24">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeader
          kicker="09 / Contact"
          title="Contact NeoHaven AI Urban Labs"
          copy="For pilot, partnership, or investor discussions, contact Wael Abessi, Founder of NeoHaven AI Urban Labs."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <a
            href="mailto:wisemaiarservices@gmail.com"
            className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary/40"
          >
            <Mail className="h-5 w-5 text-primary" />
            <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Email
            </div>
            <div className="mt-1 break-all text-sm text-foreground group-hover:text-accent">
              wisemaiarservices@gmail.com
            </div>
          </a>
          <a
            href="https://www.linkedin.com/in/wael-abessi/?locale=en-US"
            target="_blank"
            rel="noreferrer"
            className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-primary/40"
          >
            <Linkedin className="h-5 w-5 text-primary" />
            <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              LinkedIn
            </div>
            <div className="mt-1 text-sm text-foreground group-hover:text-accent">
              Wael Abessi — Founder
            </div>
          </a>
          <a
            href="mailto:wisemaiarservices@gmail.com"
            className="group rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-6 transition-colors hover:border-primary/60"
          >
            <Droplets className="h-5 w-5 text-accent" />
            <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
              Primary contact
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground group-hover:text-accent">
              Email NeoHaven <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <LogoMark className="h-7 w-7 text-xs" />
            <div className="text-sm font-semibold tracking-tight">NeoHaven AI Urban Labs</div>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2026 NeoHaven AI Urban Labs. All rights reserved.
          </div>
          <div className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            Operator-approved decision intelligence. No autonomous physical control.
          </div>
        </div>
        <a
          href="#home"
          className="text-[12px] font-mono uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
