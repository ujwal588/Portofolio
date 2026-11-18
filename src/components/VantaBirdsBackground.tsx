import { useEffect, useRef } from "react";

type VantaBirdsEffect = { destroy: () => void };

/** Persistent decorative Vanta canvas. The CSS page color remains visible beneath it. */
export default function VantaBirdsBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let effect: VantaBirdsEffect | undefined;
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
          color1: 0x9b5f6e,
          color2: 0x6f638e,
          birdSize: 1.15,
          wingSpan: 26,
          speedLimit: 3,
          separation: 28,
          alignment: 22,
          cohesion: 24,
          quantity: 5,
        });
      } catch (error) {
        // Leave the stylesheet's gentle page-color fallback in place if WebGL is unavailable.
        console.warn("Vanta Birds could not initialize; using the static background instead.", error);
      }
    };
    void initialize();

    return () => {
      cancelled = true;
      effect?.destroy();
    };
  }, []);

  return <div ref={hostRef} className="vanta-background" aria-hidden="true" />;
}
