import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowRight, ArrowUpRight, Download, Eye } from "lucide-react";
import VantaBirdsBackground from "./components/VantaBirdsBackground";
import { BACKGROUNDS } from "./components/BackgroundPicker";
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

function Header({ page, onNavigate }: { page: string; onNavigate: (path: string) => void }) {
  const isTechnicalDive = page === "/systems" || page === "/explore";
  const isBlog = page === "/blog";
  const go = (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onNavigate(path);
  };
  return <header className="topbar content-panel" data-motion-panel><a className="brand" href="/" onClick={go("/")}><span className="brand-mark">UB</span><span>UJWAL BOOSALA<small>SOFTWARE · MACHINE LEARNING</small></span></a><nav>{isTechnicalDive ? <><a href="/" onClick={go("/")}>Home</a><a href="/blog" onClick={go("/blog")}>Blog</a></> : isBlog ? <><a href="/" onClick={go("/")}>Home</a><a href="/systems" onClick={go("/systems")}>Technical Dive</a></> : <><a href="#projects">Projects</a><a href="/systems" onClick={go("/systems")}>Technical Dive</a><a href="/blog" onClick={go("/blog")}>Blog</a></>}</nav></header>;
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
  return <div className="profile-links" id="contact" aria-label="Contact links">
    <a className="contact-icon" href={profile.githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub"><img src="https://cdn.simpleicons.org/github/65566a" alt="" /></a>
    {profile.linkedinUrl && <a className="contact-icon" href={profile.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn" title="LinkedIn"><img src="https://cdn.simpleicons.org/linkedin/65566a" alt="" /></a>}
    {profile.email && <a className="contact-icon" href={`mailto:${profile.email}`} aria-label="Email" title="Email"><img src="https://cdn.simpleicons.org/gmail/65566a" alt="" /></a>}
  </div>;
}

function SkillsSection() {
  return <section className="skills-section content-panel" id="skills" data-motion-panel><div className="section-head"><div><p className="eyebrow">TOOLS I USE</p><h2>Skills</h2></div></div><div className="skill-groups">{(skills as Array<{ group: string; items: string[] }>).map((group) => <div className="skill-group content-tile" key={group.group} data-motion-panel><h3>{group.group}</h3><div className="skill-icons">{group.items.map((item) => <IconTile name={item} key={item} large />)}</div></div>)}</div></section>;
}

function LanternReturnButton() {
  const [ringing, setRinging] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  const sendFlockHome = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setRinging(true);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    timer.current = window.setTimeout(() => setRinging(false), 950);
  };

  const lanternSilhouette = "M382 290 L374 495 Q355 510 339 526 Q326 542 318 570 L227 630 Q202 642 195 665 L154 707 Q139 729 142 750 Q144 774 172 790 Q193 804 226 809 L206 840 Q184 858 175 890 Q158 927 159 964 L160 1215 Q160 1250 181 1270 L207 1279 L207 1342 Q207 1376 239 1384 L299 1384 L299 1420 Q300 1450 330 1450 L485 1450 Q513 1445 516 1417 L518 1384 L594 1384 Q623 1378 624 1345 L622 1020 Q623 982 610 953 L602 886 Q597 853 575 837 L559 810 Q589 801 612 785 Q644 761 645 735 Q646 711 625 691 L539 631 Q524 603 517 576 Q504 548 477 535 Q460 519 443 508 Q430 490 430 460 L430 290 Z";
  return <button type="button" className={`lantern-return${ringing ? " is-ringing" : ""}`} onClick={sendFlockHome} aria-label="Return to top">
    <svg className="lantern-return-art" viewBox="0 0 941 1672" aria-hidden="true" focusable="false">
      <defs>
        <mask id="lantern-branch-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="941" height="1672"><rect width="941" height="1672" fill="white" /><path d={lanternSilhouette} fill="black" /></mask>
        <mask id="lantern-only-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="941" height="1672"><rect width="941" height="1672" fill="black" /><path d={lanternSilhouette} fill="white" /></mask>
      </defs>
      <image className="lantern-branch-art" href="/lantern-return-cutout.png" width="941" height="1672" mask="url(#lantern-branch-mask)" />
      <image className="lantern-movable" href="/lantern-return-cutout.png" width="941" height="1672" mask="url(#lantern-only-mask)" />
    </svg>
    <span className="lantern-return-halo" aria-hidden="true" />
  </button>;
}

function SystemsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <div className="site systems-page"><Header page="/systems" onNavigate={onNavigate} /><main className="explore-page content-panel" data-motion-panel><p className="eyebrow">PROJECTS / TECHNICAL DIVE</p><h1>Technical <em>dive.</em></h1><div className="technical-list">{technical.map((project, i) => <ProjectCard key={project.repository} project={project} index={i} detailed />)}</div></main><footer className="footer"><span>Ujwal Boosala</span><a href="/" onClick={(event) => { event.preventDefault(); onNavigate("/"); }}>Back to portfolio ↑</a></footer></div>;
}

export default function App() {
  const [page, setPage] = useState(initialPath);
  const [backgroundId] = useState(() => {
    try {
      const stored = localStorage.getItem("portfolio-background");
      return BACKGROUNDS.some((item) => item.id === stored) ? stored as string : BACKGROUNDS[0].id;
    } catch { return BACKGROUNDS[0].id; }
  });
  const activeBackground = BACKGROUNDS.find((item) => item.id === backgroundId) || BACKGROUNDS[0];

  const setRouteWithTransition = (nextPath: string, updateHistory: boolean) => {
    const normalizedPath = nextPath.replace(/\/$/, "") || "/";
    if (normalizedPath === page) return;
    const commitRoute = () => {
      if (updateHistory) window.history.pushState({}, "", normalizedPath);
      setPage(normalizedPath);
    };
    const transitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => { finished: Promise<void> };
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !transitionDocument.startViewTransition) {
      commitRoute();
      return;
    }
    try {
      void transitionDocument.startViewTransition(commitRoute).finished.catch(() => undefined);
    } catch {
      commitRoute();
    }
  };

  useEffect(() => {
    const onPopState = () => setRouteWithTransition(initialPath(), false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [page]);

  const navigate = (path: string) => setRouteWithTransition(path, true);
  const header = <Header page={page} onNavigate={navigate} />;

  if (page === "/systems" || page === "/explore") {
    return <><VantaBirdsBackground backgroundImage={activeBackground.src} /><SystemsPage onNavigate={navigate} /><LanternReturnButton /></>;
  }
  if (page === "/blog") {
    return <><VantaBirdsBackground backgroundImage={activeBackground.src} /><div className="site">{header}<main className="explore-page blog-page content-panel" data-motion-panel><p className="eyebrow">WRITING / SAMPLE LAYOUT</p><h1>Blog <em>previews.</em></h1><div className="blog-list">{(blogSamples as Array<{ title: string; category: string; excerpt: string }>).map((post, index) => <article className={`blog-card content-tile card-${index % 3}`} key={post.title} data-motion-panel><div className="card-meta"><span>{post.category}</span><span>LAYOUT SAMPLE · NOT PUBLISHED</span></div><h2>{post.title}</h2><p>{post.excerpt}</p><span className="blog-preview-label">SAMPLE POST PREVIEW</span></article>)}</div></main><footer className="footer"><span>Ujwal Boosala</span><a href="/" onClick={(event) => { event.preventDefault(); navigate("/"); }}>Back to portfolio ↑</a></footer></div><LanternReturnButton /></>;
  }

  return <><VantaBirdsBackground backgroundImage={activeBackground.src} /><div className="site">{header}<main id="top">
    <section className="hero content-panel" data-motion-panel>
      <div className="hero-content"><p className="eyebrow">SOFTWARE · APPLIED MACHINE LEARNING</p><h1>Ujwal Boosala.</h1><p className="hero-copy"><span>Applied machine learning and software development.</span><span>Projects span transformers, generative models, and anomaly detection.</span><span>Hands-on with Python, PyTorch, model evaluation, and web interfaces.</span><span>Focused on turning experiments into clear, useful tools.</span></p><div className="hero-actions"><a className="primary-link" href="#projects">View projects <ArrowRight size={16} /></a><div className="resume-actions"><a className="secondary-link" href={profile.resumePath} target="_blank" rel="noreferrer"><Eye size={17} /> View résumé</a><a className="download-button" href={profile.resumePath} download aria-label="Download résumé" title="Download résumé"><Download size={18} /></a></div></div><ContactLinks /></div>
    </section>

    <SkillsSection />

    <section className="projects-section content-panel" id="projects" data-motion-panel><div className="section-head"><div><p className="eyebrow">SELECTED WORK</p><h2>Projects</h2></div><a className="text-link systems-project-button" href="/systems" onClick={(event) => { event.preventDefault(); navigate("/systems"); }}>Technical Dive <ArrowUpRight size={15} /></a></div><div className="project-grid">{featured.map((project, i) => <ProjectCard key={project.repository} project={project} index={i} />)}</div></section>

    <section className="highlights content-panel" data-motion-panel><p className="eyebrow">HIGHLIGHTS</p><div className="highlight-list">{profile.achievements.map((item) => <span className="content-tile" key={item.title} data-motion-panel>{item.detail} <b>{item.title}</b></span>)}{profile.training.map((item) => <span className="content-tile" key={item.name} data-motion-panel>{item.name} · {item.provider}</span>)}</div></section>

    <section className="education content-panel" data-motion-panel><p className="eyebrow">EDUCATION</p>{profile.education.map((item) => <p key={item.institution}><b>{item.qualification}</b><span>{item.institution} · {item.dates}</span></p>)}</section>
  </main><footer className="footer"><span>Ujwal Boosala</span><a href="#top">Back to top ↑</a></footer></div><LanternReturnButton /></>;
}
