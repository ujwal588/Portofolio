import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { ArrowRight, ArrowUp, ArrowUpRight, Download, Eye } from "lucide-react";
import profile from "./content/profile.json";
import skills from "./content/skills.json";
import registry from "./content/project-registry.json";
import blogSamples from "./content/blog-samples.json";
import type { RegistryProject } from "./content/types";

type Project = RegistryProject & { technical_note?: string };
const projects = (registry.projects as Project[]).filter((project) => project.visible);
const featured = projects.filter((project) => project.featured).sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99)).slice(0, 5);
const technical = projects.filter((project) => project.technical_exploration).sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
const initialPath = () => window.location.pathname.replace(/\/$/, "") || "/";

const skillIcons: Record<string, { slug: string; color: string; fallback: string }> = {
  "C++": { slug: "cplusplus", color: "00599C", fallback: "C+" },
  Java: { slug: "openjdk", color: "437291", fallback: "J" },
  Python: { slug: "python", color: "3776AB", fallback: "Py" },
  NumPy: { slug: "numpy", color: "4DABCF", fallback: "N" },
  Pandas: { slug: "pandas", color: "150458", fallback: "Pd" },
  Matplotlib: { slug: "matplotlib", color: "11557C", fallback: "M" },
  "scikit-learn": { slug: "scikitlearn", color: "F7931E", fallback: "Sk" },
  OpenCV: { slug: "opencv", color: "5C3EE8", fallback: "CV" },
  PyTorch: { slug: "pytorch", color: "EE4C2C", fallback: "Pt" },
  Flask: { slug: "flask", color: "333333", fallback: "F" },
  MySQL: { slug: "mysql", color: "4479A1", fallback: "My" },
  PostgreSQL: { slug: "postgresql", color: "4169E1", fallback: "Pg" },
  Git: { slug: "git", color: "F05032", fallback: "Git" },
  GitHub: { slug: "github", color: "181717", fallback: "GH" },
  Jupyter: { slug: "jupyter", color: "F37626", fallback: "J" },
  Kaggle: { slug: "kaggle", color: "20BEFF", fallback: "K" },
  Jira: { slug: "jira", color: "0052CC", fallback: "J" },
  Transformers: { slug: "huggingface", color: "FFD21E", fallback: "Tr" },
  DCGAN: { slug: "pytorch", color: "EE4C2C", fallback: "G" },
  Autoencoder: { slug: "keras", color: "D00000", fallback: "AE" },
  "Anomaly detection": { slug: "scikitlearn", color: "F7931E", fallback: "AD" },
};

function IconTile({ name, large = false }: { name: string; large?: boolean }) {
  const icon = skillIcons[name] || { slug: "code", color: "64705c", fallback: name.slice(0, 2) };
  return <span className={`skill-icon${large ? " skill-icon-large" : ""}`} tabIndex={0} aria-label={name} title={name}><img src={`https://cdn.simpleicons.org/${icon.slug}/${icon.color}`} alt="" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add("fallback-visible"); }} /><span className="icon-fallback">{icon.fallback}</span><span className="skill-tooltip">{name}</span></span>;
}

function Header({ page, onSystemsClick, transitioning = false }: { page: string; onSystemsClick: (event: MouseEvent<HTMLButtonElement>) => void; transitioning?: boolean }) {
  const isSystems = page === "/systems" || page === "/explore";
  const isBlog = page === "/blog";
  return <header className="topbar"><a className="brand" href="/"><span className="brand-mark">UB</span><span>UJWAL BOOSALA<small>SOFTWARE · MACHINE LEARNING</small></span></a><nav>{isSystems ? <><a href="/">Home</a><a href="/blog">Blog</a></> : isBlog ? <><a href="/">Home</a><button type="button" className="systems-nav-button" onClick={onSystemsClick} disabled={transitioning}>Systems</button></> : <><a href="#projects">Projects</a><button type="button" className={`systems-nav-button${transitioning ? " is-transitioning" : ""}`} onClick={onSystemsClick} disabled={transitioning}>Systems</button><a href="/blog">Blog</a></>}</nav></header>;
}

function ProjectCard({ project, index, detailed = false }: { project: Project; index: number; detailed?: boolean }) {
  return <article className={`project-card card-${index % 3}`}>
    <div className="card-meta"><span>{project.category}</span><span>{project.status}</span></div>
    <div className="project-title-row"><div><h3>{project.custom_title || project.repository}</h3><p>{project.custom_description}</p></div><a className="repo-icon" href={`https://github.com/${registry.owner}/${project.repository}`} target="_blank" rel="noreferrer" aria-label={`View ${project.custom_title || project.repository} source on GitHub`} title="View source on GitHub"><img src="https://cdn.simpleicons.org/github/202520" alt="" onError={(event) => { event.currentTarget.hidden = true; event.currentTarget.parentElement?.classList.add("fallback-visible"); }} /><span className="icon-fallback">GH</span></a></div>
    <div className="technology-icons">{(project.technologies || []).map((tag) => <IconTile name={tag} key={tag} />)}</div>
    {detailed && project.technical_note && <p className="technical-note">{project.technical_note}</p>}
  </article>;
}

function ContactLinks() {
  return <div className="profile-links" id="contact"><a href={profile.githubUrl} target="_blank" rel="noreferrer"><b className="service-icon">GH</b> GitHub <ArrowUpRight size={14} /></a>{profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"><b className="service-icon">in</b> LinkedIn <ArrowUpRight size={14} /></a>}{profile.email && <a href={`mailto:${profile.email}`}>Email <ArrowUpRight size={14} /></a>}</div>;
}

function SkillsSection() {
  return <section className="skills-section" id="skills"><div className="section-head"><div><p className="eyebrow">TOOLS I USE</p><h2>Skills</h2></div></div><div className="skill-groups">{(skills as Array<{ group: string; items: string[] }>).map((group) => <div className="skill-group" key={group.group}><h3>{group.group}</h3><div className="skill-icons">{group.items.map((item) => <IconTile name={item} key={item} large />)}</div></div>)}</div></section>;
}

function ScrollFuelGauge() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [refilling, setRefilling] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const refillTimer = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const root = document.documentElement;
        const maxScroll = Math.max(0, Math.max(root.scrollHeight, document.body.scrollHeight) - window.innerHeight);
        setScrollProgress(maxScroll === 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / maxScroll)));
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => () => {
    if (refillTimer.current !== null) window.clearTimeout(refillTimer.current);
  }, []);

  const scrollToTrackPosition = (clientY: number) => {
    const track = trackRef.current;
    if (!track) return;
    const bounds = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientY - bounds.top) / bounds.height));
    const root = document.documentElement;
    const maxScroll = Math.max(0, Math.max(root.scrollHeight, document.body.scrollHeight) - window.innerHeight);
    window.scrollTo({ top: maxScroll * ratio, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const onTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 0.2 : 0.06;
    let next: number | null = null;
    if (event.key === "ArrowUp" || event.key === "PageUp") next = scrollProgress - step;
    if (event.key === "ArrowDown" || event.key === "PageDown") next = scrollProgress + step;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = 1;
    if (next === null) return;
    event.preventDefault();
    const root = document.documentElement;
    const maxScroll = Math.max(0, Math.max(root.scrollHeight, document.body.scrollHeight) - window.innerHeight);
    window.scrollTo({ top: maxScroll * Math.min(1, Math.max(0, next)), behavior: "smooth" });
  };

  const refill = () => {
    if (refillTimer.current !== null) window.clearTimeout(refillTimer.current);
    setRefilling(true);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    refillTimer.current = window.setTimeout(() => setRefilling(false), 1100);
  };

  const fuel = Math.round((1 - scrollProgress) * 100);
  return <aside className={`fuel-control${refilling ? " is-refilling" : ""}`} aria-label="Page scroll fuel gauge">
    <svg className="fuel-wire" viewBox="0 0 72 280" preserveAspectRatio="none" aria-hidden="true">
      <path className="fuel-wire-shadow" d="M48 168v20c0 14 12 13 12 26v13H35v9" />
      <path className="fuel-wire-line" d="M48 168v20c0 14 12 13 12 26v13H35v9" />
      <circle className="fuel-wire-joint" cx="48" cy="168" r="3" />
    </svg>
    <span className="fuel-caption" aria-hidden="true">FUEL</span>
    <div
      className="fuel-track"
      ref={trackRef}
      role="scrollbar"
      aria-label="Page scroll position"
      aria-controls="root"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(scrollProgress * 100)}
      aria-valuetext={`${fuel}% fuel remaining`}
      tabIndex={0}
      onKeyDown={onTrackKeyDown}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); scrollToTrackPosition(event.clientY); }}
      onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) scrollToTrackPosition(event.clientY); }}
    >
      <span className="fuel-scale fuel-scale-full" aria-hidden="true">F</span>
      <span className="fuel-scale fuel-scale-half" aria-hidden="true">½</span>
      <span className="fuel-scale fuel-scale-empty" aria-hidden="true">E</span>
      <span className="fuel-window" aria-hidden="true">
        <span className="fuel-liquid" style={{ height: `${fuel}%` }}>
          <span className="fuel-wave" />
          <span className="fuel-bubble fuel-bubble-one" />
          <span className="fuel-bubble fuel-bubble-two" />
        </span>
        <span className="fuel-glint" />
      </span>
      <span className="fuel-value" aria-hidden="true">{fuel}%</span>
    </div>
    <button type="button" className="fuel-refill" onClick={refill} disabled={scrollProgress < 0.005} aria-label="Refill tank and scroll to the top" title="Refill and return to top">
      <ArrowUp size={17} strokeWidth={2.2} />
    </button>
    <span className="fuel-refill-label" aria-hidden="true">REFILL</span>
  </aside>;
}

function SystemsPage({ onSystemsClick, transitioning = false }: { onSystemsClick: (event: MouseEvent<HTMLButtonElement>) => void; transitioning?: boolean }) {
  return <div className="site systems-page"><Header page="/systems" onSystemsClick={onSystemsClick} transitioning={transitioning} /><main className="explore-page"><p className="eyebrow">PROJECTS / SYSTEMS</p><h1>Systems <em>work.</em></h1><div className="technical-list">{technical.map((project, i) => <ProjectCard key={project.repository} project={project} index={i} detailed />)}</div></main><footer className="footer"><span>Ujwal Boosala</span><a href="/">Back to portfolio ↑</a></footer></div>;
}

type ButtonRect = { left: number; top: number; width: number; height: number };

function SystemsPortal({ buttonRect, onComplete }: { buttonRect: ButtonRect; onComplete: () => void }) {
  const revealRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const reveal = revealRef.current;
    const core = coreRef.current;
    const clone = cloneRef.current;
    if (!reveal || !core || !clone) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timers: number[] = [];
    const delay = (ms: number) => new Promise<void>((resolve) => { timers.push(window.setTimeout(resolve, ms)); });
    let cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const run = async () => {
      if (reducedMotion) {
        reveal.style.clipPath = "circle(150vmax at 50% 50%)";
        await delay(0);
        if (!cancelled) onComplete();
        return;
      }

      // Stage 1: lift the measured button copy from its exact on-screen position.
      clone.animate(
        [{ transform: "translateY(0) scale(1)", boxShadow: "0 0 0 transparent" }, { transform: "translateY(-6px) scale(1.15)", boxShadow: "0 14px 30px #17201855" }],
        { duration: 200, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" },
      );

      await delay(100);
      if (cancelled) return;
      // Stage 2: open the compact aperture with a spring-like overshoot.
      reveal.animate(
        [{ clipPath: "circle(0px at 50% 50%)" }, { clipPath: "circle(70px at 50% 50%)" }],
        { duration: 250, easing: "cubic-bezier(.2,.8,.25,1)", fill: "forwards" },
      );
      core.animate(
        [
          { transform: "translate(-50%,-50%) scale(0)", opacity: 0 },
          { transform: "translate(-50%,-50%) scale(1.12)", opacity: 1, offset: 0.72 },
          { transform: "translate(-50%,-50%) scale(.97)", opacity: 1, offset: 0.9 },
          { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        ],
        { duration: 250, easing: "cubic-bezier(.2,.8,.25,1)", fill: "forwards" },
      );

      await delay(200);
      if (cancelled) return;
      // Stage 3: arc the copied button toward the portal center, then fade it.
      const dx = window.innerWidth / 2 - buttonRect.left - buttonRect.width / 2;
      const dy = window.innerHeight / 2 - buttonRect.top - buttonRect.height / 2;
      clone.animate(
        [
          { transform: "translate(0,-6px) scale(1.15)", opacity: 1, offset: 0 },
          { transform: `translate(${dx * 0.62 - 12}px,${dy * 0.56 - 20}px) rotate(6deg) scale(.68)`, opacity: 0.95, offset: 0.62 },
          { transform: `translate(${dx}px,${dy}px) rotate(12deg) scale(.1)`, opacity: 0 },
        ],
        { duration: 300, easing: "cubic-bezier(.45,0,.7,.4)", fill: "forwards" },
      );

      await delay(250);
      if (cancelled) return;
      // Stage 4: reveal the already-mounted Systems page without scaling its content.
      const expansion = reveal.animate(
        [{ clipPath: "circle(70px at 50% 50%)" }, { clipPath: "circle(150vmax at 50% 50%)" }],
        { duration: 500, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" },
      );
      try { await expansion.finished; } catch { return; }
      if (!cancelled) onComplete();
    };

    void run();
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      document.body.style.overflow = originalOverflow;
      reveal.getAnimations().forEach((animation) => animation.cancel());
      core.getAnimations().forEach((animation) => animation.cancel());
      clone.getAnimations().forEach((animation) => animation.cancel());
    };
  }, [buttonRect, onComplete]);

  return <div className="systems-transition-layer" aria-hidden="true">
    <div className="systems-reveal" ref={revealRef}><SystemsPage onSystemsClick={() => undefined} /></div>
    <div className="portal-core" ref={coreRef} />
    <button className="systems-button-clone" ref={cloneRef} tabIndex={-1} style={{ left: buttonRect.left, top: buttonRect.top, width: buttonRect.width, height: buttonRect.height }}>Systems</button>
  </div>;
}

export default function App() {
  const [page, setPage] = useState(initialPath);
  const [buttonRect, setButtonRect] = useState<ButtonRect | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => { const update = () => setPage(initialPath()); window.addEventListener("popstate", update); return () => window.removeEventListener("popstate", update); }, []);
  const beginSystemsTransition = (event: MouseEvent<HTMLButtonElement>) => {
    if (transitioning) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setButtonRect({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
    setTransitioning(true);
  };
  const completeSystemsTransition = () => {
    window.history.pushState({}, "", "/systems");
    setPage("/systems");
    setButtonRect(null);
    setTransitioning(false);
  };
  const header = <Header page={page} onSystemsClick={beginSystemsTransition} transitioning={transitioning} />;
  if (page === "/systems" || page === "/explore") return <><SystemsPage onSystemsClick={beginSystemsTransition} transitioning={transitioning} />{buttonRect && <SystemsPortal buttonRect={buttonRect} onComplete={completeSystemsTransition} />}<ScrollFuelGauge /></>;
  if (page === "/blog") return <><div className="site">{header}<main className="explore-page blog-page"><p className="eyebrow">WRITING / SAMPLE LAYOUT</p><h1>Blog <em>previews.</em></h1><div className="blog-list">{(blogSamples as Array<{ title: string; category: string; excerpt: string }>).map((post, index) => <article className={`blog-card card-${index % 3}`} key={post.title}><div className="card-meta"><span>{post.category}</span><span>LAYOUT SAMPLE · NOT PUBLISHED</span></div><h2>{post.title}</h2><p>{post.excerpt}</p><span className="blog-preview-label">SAMPLE POST PREVIEW</span></article>)}</div></main><footer className="footer"><span>Ujwal Boosala</span><a href="/">Back to portfolio ↑</a></footer></div>{buttonRect && <SystemsPortal buttonRect={buttonRect} onComplete={completeSystemsTransition} />}<ScrollFuelGauge /></>;

  return <><div className="site">{header}<main id="top">
    <section className="hero">
      <div className="hero-content"><p className="eyebrow">SOFTWARE · APPLIED MACHINE LEARNING</p><h1>Ujwal Boosala.</h1><p className="hero-copy">Applied ML and software projects.</p><div className="hero-actions"><a className="primary-link" href="#projects">View projects <ArrowRight size={16} /></a><div className="resume-actions"><a className="secondary-link" href={profile.resumePath} target="_blank" rel="noreferrer"><Eye size={17} /> View résumé</a><a className="download-button" href={profile.resumePath} download aria-label="Download résumé" title="Download résumé"><Download size={18} /></a></div></div><ContactLinks /></div>
    </section>

    <SkillsSection />

    <section className="projects-section" id="projects"><div className="section-head"><div><p className="eyebrow">SELECTED WORK</p><h2>Projects</h2></div><button type="button" className={`text-link systems-project-button${transitioning ? " is-transitioning" : ""}`} onClick={beginSystemsTransition} disabled={transitioning}>Systems <ArrowUpRight size={15} /></button></div><div className="project-grid">{featured.map((project, i) => <ProjectCard key={project.repository} project={project} index={i} />)}</div></section>

    <section className="highlights"><p className="eyebrow">HIGHLIGHTS</p><div className="highlight-list">{profile.achievements.map((item) => <span key={item.title}>{item.detail} <b>{item.title}</b></span>)}{profile.training.map((item) => <span key={item.name}>{item.name} · {item.provider}</span>)}</div></section>

    <section className="education"><p className="eyebrow">EDUCATION</p>{profile.education.map((item) => <p key={item.institution}><b>{item.qualification}</b><span>{item.institution} · {item.dates}</span></p>)}</section>
  </main><footer className="footer"><span>Ujwal Boosala</span><a href="#top">Back to top ↑</a></footer></div>{buttonRect && <SystemsPortal buttonRect={buttonRect} onComplete={completeSystemsTransition} />}<ScrollFuelGauge /></>;
}
