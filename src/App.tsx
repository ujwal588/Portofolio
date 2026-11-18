import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { ArrowRight, ArrowUp, ArrowUpRight, Download, Eye } from "lucide-react";
import { GearSystemBackground, MechanicalPageTransition, type GearSystemHandle, type MechanicalPageTransitionHandle } from "./components/GearSystem";
import profile from "./content/profile.json";
import skills from "./content/skills.json";
import registry from "./content/project-registry.json";
import blogSamples from "./content/blog-samples.json";
import type { RegistryProject } from "./content/types";

type Project = RegistryProject & { technical_note?: string };
type DestinationPath = "/systems" | "/blog";
type NavigationEvent = MouseEvent<HTMLAnchorElement | HTMLButtonElement>;
type NavigationHandler = (target: DestinationPath, event: NavigationEvent) => void;
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

function Header({ page, onNavigate, transitioning = false }: { page: string; onNavigate: NavigationHandler; transitioning?: boolean }) {
  const isSystems = page === "/systems" || page === "/explore";
  const isBlog = page === "/blog";
  const navLink = (target: DestinationPath, label: string) => <a href={target} className={`mechanical-nav-link${transitioning ? " is-transitioning" : ""}`} aria-disabled={transitioning} tabIndex={transitioning ? -1 : undefined} onClick={(event) => onNavigate(target, event)}>{label}</a>;
  return <header className="topbar content-panel" data-motion-panel><a className="brand" href="/"><span className="brand-mark">UB</span><span>UJWAL BOOSALA<small>SOFTWARE · MACHINE LEARNING</small></span></a><nav>{isSystems ? <><a href="/">Home</a>{navLink("/blog", "Blog")}</> : isBlog ? <><a href="/">Home</a>{navLink("/systems", "Systems")}</> : <><a href="#projects">Projects</a>{navLink("/systems", "Systems")}{navLink("/blog", "Blog")}</>}</nav></header>;
}

function ProjectCard({ project, index, detailed = false }: { project: Project; index: number; detailed?: boolean }) {
  return <article className={`project-card content-tile card-${index % 3}`} data-motion-panel>
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
  return <section className="skills-section content-panel" id="skills" data-motion-panel><div className="section-head"><div><p className="eyebrow">TOOLS I USE</p><h2>Skills</h2></div></div><div className="skill-groups">{(skills as Array<{ group: string; items: string[] }>).map((group) => <div className="skill-group content-tile" key={group.group} data-motion-panel><h3>{group.group}</h3><div className="skill-icons">{group.items.map((item) => <IconTile name={item} key={item} large />)}</div></div>)}</div></section>;
}

function ScrollProgressGauge() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [returning, setReturning] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const returnTimer = useRef<number | null>(null);

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
    if (returnTimer.current !== null) window.clearTimeout(returnTimer.current);
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

  const scrollToTop = () => {
    if (returnTimer.current !== null) window.clearTimeout(returnTimer.current);
    setReturning(true);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    returnTimer.current = window.setTimeout(() => setReturning(false), 1100);
  };

  const remaining = Math.round((1 - scrollProgress) * 100);
  return <aside className={`fuel-control${returning ? " is-returning" : ""}`} aria-label="Page scroll progress">
    <svg className="fuel-wire" viewBox="0 0 72 108" preserveAspectRatio="none" aria-hidden="true">
      <path className="fuel-wire-shadow" d="M48 0v24c0 22 12 21 12 42c0 8-12 12-25 12" />
      <path className="fuel-wire-line" d="M48 0v24c0 22 12 21 12 42c0 8-12 12-25 12" />
      <circle className="fuel-wire-joint" cx="48" cy="2" r="3" />
    </svg>
    <span className="fuel-caption" aria-hidden="true">SCROLL</span>
    <div
      className={`fuel-track${remaining === 100 ? " is-full" : ""}`}
      ref={trackRef}
      role="scrollbar"
      aria-label="Page scroll position"
      aria-controls="root"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(scrollProgress * 100)}
      aria-valuetext={`${remaining}% of the page remains`}
      tabIndex={0}
      onKeyDown={onTrackKeyDown}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); scrollToTrackPosition(event.clientY); }}
      onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) scrollToTrackPosition(event.clientY); }}
    >
      <span className="fuel-scale fuel-scale-full" aria-hidden="true">TOP</span>
      <span className="fuel-scale fuel-scale-half" aria-hidden="true">MID</span>
      <span className="fuel-scale fuel-scale-empty" aria-hidden="true">END</span>
      <span className="fuel-window" aria-hidden="true">
        <span className="fuel-liquid" style={{ height: `${remaining}%` }}>
          <span className="fuel-wave" />
          <span className="fuel-bubble fuel-bubble-one" />
          <span className="fuel-bubble fuel-bubble-two" />
        </span>
        <span className="fuel-glint" />
      </span>
      <span className="fuel-value" aria-hidden="true">{remaining}%</span>
    </div>
    <button type="button" className="fuel-refill" onClick={scrollToTop} disabled={scrollProgress < 0.005} aria-label="Scroll to top" title="Return to top">
      <ArrowUp size={17} strokeWidth={2.2} />
    </button>
    <span className="fuel-refill-label" aria-hidden="true">TOP</span>
  </aside>;
}

function SystemsPage({ onNavigate, transitioning = false }: { onNavigate: NavigationHandler; transitioning?: boolean }) {
  return <div className="site systems-page"><Header page="/systems" onNavigate={onNavigate} transitioning={transitioning} /><main className="explore-page content-panel" data-motion-panel><p className="eyebrow">PROJECTS / SYSTEMS</p><h1>Systems <em>work.</em></h1><div className="technical-list">{technical.map((project, i) => <ProjectCard key={project.repository} project={project} index={i} detailed />)}</div></main><footer className="footer"><span>Ujwal Boosala</span><a href="/">Back to portfolio ↑</a></footer></div>;
}

function BlogPage({ onNavigate, transitioning = false }: { onNavigate: NavigationHandler; transitioning?: boolean }) {
  return <div className="site"><Header page="/blog" onNavigate={onNavigate} transitioning={transitioning} /><main className="explore-page blog-page content-panel" data-motion-panel><p className="eyebrow">WRITING / SAMPLE LAYOUT</p><h1>Blog <em>previews.</em></h1><div className="blog-list">{(blogSamples as Array<{ title: string; category: string; excerpt: string }>).map((post, index) => <article className={`blog-card content-tile card-${index % 3}`} key={post.title} data-motion-panel><div className="card-meta"><span>{post.category}</span><span>LAYOUT SAMPLE · NOT PUBLISHED</span></div><h2>{post.title}</h2><p>{post.excerpt}</p><span className="blog-preview-label">SAMPLE POST PREVIEW</span></article>)}</div></main><footer className="footer"><span>Ujwal Boosala</span><a href="/">Back to portfolio ↑</a></footer></div>;
}

function HomePage({ onNavigate, transitioning = false }: { onNavigate: NavigationHandler; transitioning?: boolean }) {
  return <div className="site"><Header page="/" onNavigate={onNavigate} transitioning={transitioning} /><main id="top">
    <section className="hero content-panel" data-motion-panel>
      <div className="hero-content"><p className="eyebrow">SOFTWARE · APPLIED MACHINE LEARNING</p><h1>Ujwal Boosala.</h1><p className="hero-copy"><span>Applied machine learning and software development.</span><span>Projects span transformers, generative models, and anomaly detection.</span><span>Hands-on with Python, PyTorch, model evaluation, and web interfaces.</span><span>Focused on turning experiments into clear, useful tools.</span></p><div className="hero-actions"><a className="primary-link" href="#projects">View projects <ArrowRight size={16} /></a><div className="resume-actions"><a className="secondary-link" href={profile.resumePath} target="_blank" rel="noreferrer"><Eye size={17} /> View résumé</a><a className="download-button" href={profile.resumePath} download aria-label="Download résumé" title="Download résumé"><Download size={18} /></a></div></div><ContactLinks /></div>
    </section>
    <SkillsSection />
    <section className="projects-section content-panel" id="projects" data-motion-panel><div className="section-head"><div><p className="eyebrow">SELECTED WORK</p><h2>Projects</h2></div><button type="button" className={`text-link systems-project-button${transitioning ? " is-transitioning" : ""}`} onClick={(event) => onNavigate("/systems", event)} disabled={transitioning}>Systems <ArrowUpRight size={15} /></button></div><div className="project-grid">{featured.map((project, i) => <ProjectCard key={project.repository} project={project} index={i} />)}</div></section>
    <section className="highlights content-panel" data-motion-panel><p className="eyebrow">HIGHLIGHTS</p><div className="highlight-list">{profile.achievements.map((item) => <span className="content-tile" key={item.title} data-motion-panel>{item.detail} <b>{item.title}</b></span>)}{profile.training.map((item) => <span className="content-tile" key={item.name} data-motion-panel>{item.name} · {item.provider}</span>)}</div></section>
    <section className="education content-panel" data-motion-panel><p className="eyebrow">EDUCATION</p>{profile.education.map((item) => <p key={item.institution}><b>{item.qualification}</b><span>{item.institution} · {item.dates}</span></p>)}</section>
  </main><footer className="footer"><span>Ujwal Boosala</span><a href="#top">Back to top ↑</a></footer></div>;
}

export default function App() {
  const [page, setPage] = useState(initialPath);
  const [transitioning, setTransitioning] = useState(false);
  const gearRef = useRef<GearSystemHandle>(null);
  const transitionRef = useRef<MechanicalPageTransitionHandle>(null);
  useEffect(() => {
    const update = () => {
      transitionRef.current?.cancel();
      setTransitioning(false);
      setPage(initialPath());
    };
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const beginNavigation: NavigationHandler = (target, event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || transitioning) return;
    event.preventDefault();
    if (target === page) return;
    transitionRef.current?.start(target, target === "/systems" ? "Systems" : "Blog", event.currentTarget.getBoundingClientRect());
    setTransitioning(true);
  };
  const completeNavigation = (target: DestinationPath) => {
    window.history.pushState({}, "", target);
    setPage(target);
    setTransitioning(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const renderPage = (path: DestinationPath) => path === "/systems"
    ? <SystemsPage onNavigate={beginNavigation} transitioning={transitioning} />
    : <BlogPage onNavigate={beginNavigation} transitioning={transitioning} />;
  return <>
    <GearSystemBackground ref={gearRef} />
    {page === "/systems" || page === "/explore" ? renderPage("/systems") : page === "/blog" ? renderPage("/blog") : <HomePage onNavigate={beginNavigation} transitioning={transitioning} />}
    <MechanicalPageTransition ref={transitionRef} gears={gearRef} renderPage={renderPage} onComplete={completeNavigation} />
    <ScrollProgressGauge />
  </>;
}
