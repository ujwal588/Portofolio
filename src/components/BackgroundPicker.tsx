import { useEffect, useState, type CSSProperties, type KeyboardEvent, type WheelEvent, type MouseEvent as ReactMouseEvent } from "react";
import { Check, ChevronDown, ChevronUp, Palette, X } from "lucide-react";

export type PortfolioBackground = { id: string; name: string; mood: string; src: string };
export const BACKGROUNDS: PortfolioBackground[] = [
  { id: "scene-01", name: "Crimson Blossom", mood: "A dramatic red moonlit scene", src: "/backgrounds/scene-01.jpg" },
  { id: "scene-02", name: "Azure Cloud Lake", mood: "Water, mountain, and mist", src: "/backgrounds/scene-02.jpg" },
  { id: "scene-03", name: "Pavilion in the Mist", mood: "A quiet monochrome wash", src: "/backgrounds/scene-03.jpg" },
  { id: "scene-04", name: "Bamboo River", mood: "Sunlit bamboo and still water", src: "/backgrounds/scene-04.jpg" },
];

type Props = { open: boolean; selectedId: string; onClose: () => void; onApply: (id: string) => void };
const offsets = [-1, 0, 1];

export default function BackgroundPicker({ open, selectedId, onClose, onApply }: Props) {
  const selectedIndex = Math.max(0, BACKGROUNDS.findIndex((item) => item.id === selectedId));
  const [draftIndex, setDraftIndex] = useState(selectedIndex);
  const active = BACKGROUNDS[draftIndex];

  useEffect(() => { if (open) setDraftIndex(selectedIndex); }, [open, selectedIndex]);
  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    const handleKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowUp") { event.preventDefault(); setDraftIndex((value) => (value + BACKGROUNDS.length - 1) % BACKGROUNDS.length); }
      if (event.key === "ArrowDown") { event.preventDefault(); setDraftIndex((value) => (value + 1) % BACKGROUNDS.length); }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener("keydown", handleKey); };
  }, [open, onClose]);

  if (!open) return null;
  const step = (direction: number) => setDraftIndex((value) => (value + direction + BACKGROUNDS.length) % BACKGROUNDS.length);
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (Math.abs(event.deltaY) > 3) step(event.deltaY > 0 ? 1 : -1);
  };
  const handleKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") event.preventDefault();
  };
  const closeOnBackdrop = (event: ReactMouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); };

  return <div className="background-picker-overlay" onMouseDown={closeOnBackdrop}>
    <section className="background-picker" role="dialog" aria-modal="true" aria-labelledby="background-picker-title">
      <div className="background-picker-heading">
        <span className="background-picker-icon"><Palette size={17} /></span>
        <div><p className="eyebrow">A CHANGE OF SCENERY</p><h2 id="background-picker-title">Choose a background</h2></div>
        <button className="background-picker-close" type="button" onClick={onClose} aria-label="Close background selector"><X size={18} /></button>
      </div>
      <div className="background-picker-preview" style={{ backgroundImage: `linear-gradient(90deg,rgba(30,28,32,.56),rgba(30,28,32,.05)),url("${active.src}")` }}>
        <span>PREVIEW · {String(draftIndex + 1).padStart(2, "0")} / {String(BACKGROUNDS.length).padStart(2, "0")}</span><strong>{active.name}</strong><small>{active.mood}</small>
      </div>
      <p className="background-picker-hint">Scroll the wheel or use ↑ / ↓ to rotate through scenes.</p>
      <div className="background-wheel-shell">
        <button className="background-wheel-arrow" type="button" onClick={() => step(-1)} aria-label="Previous background"><ChevronUp size={17} /></button>
        <div className="background-wheel-list" role="listbox" aria-label="Background choices" tabIndex={0} onWheel={handleWheel} onKeyDown={handleKeys}>
          {offsets.map((offset) => {
            const index = (draftIndex + offset + BACKGROUNDS.length) % BACKGROUNDS.length;
            const item = BACKGROUNDS[index];
            const isActive = offset === 0;
            return <button key={`${item.id}-${offset}`} type="button" role="option" aria-selected={isActive} className={`background-wheel-option${isActive ? " is-active" : ""}`} style={{ opacity: 1 - Math.abs(offset) * .13, transform: `scale(${1 - Math.abs(offset) * .025})` } as CSSProperties} onClick={() => setDraftIndex(index)}>
              <img src={item.src} alt="" /><span className="background-wheel-number">{String(index + 1).padStart(2, "0")}</span><span className="background-wheel-name">{item.name}<small>{item.mood}</small></span>{isActive && <Check className="background-wheel-check" size={17} />}
            </button>;
          })}
        </div>
        <button className="background-wheel-arrow" type="button" onClick={() => step(1)} aria-label="Next background"><ChevronDown size={17} /></button>
      </div>
      <div className="background-picker-actions"><button type="button" className="background-picker-cancel" onClick={onClose}>Cancel</button><button type="button" className="background-picker-apply" onClick={() => onApply(active.id)}><Check size={16} /> Use background</button></div>
    </section>
  </div>;
}
