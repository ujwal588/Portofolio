import { useEffect, useRef, useState, type CSSProperties } from "react";

type VantaBirdsEffect = {
  destroy: () => void;
  onMouseMove?: (x: number, y: number) => void;
};

/** Persistent decorative Vanta canvas. The CSS page color remains visible beneath it. */
export default function VantaBirdsBackground({ backgroundImage }: { backgroundImage: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [flockLift, setFlockLift] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let effect: VantaBirdsEffect | undefined;
    let flockTimer = 0;
    const steerWithPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const rect = host.getBoundingClientRect();
      effect?.onMouseMove?.(
        Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
        Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      );
    };
    const sendFlockToTop = () => {
      window.clearTimeout(flockTimer);
      setFlockLift(true);
      flockTimer = window.setTimeout(() => setFlockLift(false), 2300);
    };
    const initialize = async () => {
      try {
        // Keep Three.js and Vanta out of the initial bundle; load the visual only after mount.
        const [{ default: birds }, THREE] = await Promise.all([
          import("vanta/dist/vanta.birds.min"),
          import("three"),
        ]);
        if (cancelled || !hostRef.current) return;
        effect = birds({
          el: hostRef.current,
          THREE,
          mouseControls: false,
          touchControls: false,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1,
          scaleMobile: 0.8,
          backgroundAlpha: 0,
          colorMode: "lerp",
          color1: 0xf07862,
          color2: 0xf2c66d,
          birdSize: 0.72,
          wingSpan: 18,
          speedLimit: 3.5,
          separation: 62,
          alignment: 22,
          cohesion: 8,
          quantity: 5,
        });
        window.addEventListener("pointermove", steerWithPointer, { passive: true });
        window.addEventListener("portfolio:flock-to-top", sendFlockToTop);
      } catch (error) {
        // Leave the stylesheet's gentle page-color fallback in place if WebGL is unavailable.
        console.warn("Vanta Birds could not initialize; using the static background instead.", error);
      }
    };
    void initialize();

    return () => {
      cancelled = true;
      window.removeEventListener("pointermove", steerWithPointer);
      window.removeEventListener("portfolio:flock-to-top", sendFlockToTop);
      window.clearTimeout(flockTimer);
      effect?.destroy();
    };
  }, []);

  const birds = Array.from({ length: 22 }, (_, index) => {
    const flightStyle = {
      left: `${4 + ((index * 37) % 93)}%`,
      top: `${72 + ((index * 13) % 30)}vh`,
      animationDelay: `${(index % 6) * 35}ms`,
      animationDuration: `${1650 + (index % 5) * 120}ms`,
      "--flight-x": `${((index % 7) - 3) * 4.5}vw`,
      "--bird-scale": 0.65 + (index % 5) * 0.16,
      "--bird-tilt": `${((index % 5) - 2) * 9}deg`,
    } as CSSProperties;
    return <span className="flock-bird" style={flightStyle} key={index}><svg viewBox="0 0 32 20" aria-hidden="true"><path d="M1 11c5-1 8-8 12-8 4 0 7 8 18 10-7 1-12-2-16-4-4 3-8 4-14 2z" /></svg></span>;
  });

  return <div className="vanta-scene" aria-hidden="true">
    <div ref={hostRef} className={`vanta-background${flockLift ? " flocking" : ""}`} style={{ backgroundImage: `linear-gradient(180deg,rgba(247,243,248,.04),rgba(247,243,248,.08)),url("${backgroundImage}")` }} />
    {flockLift && <div className="flock-sweep">{birds}</div>}
  </div>;
}
