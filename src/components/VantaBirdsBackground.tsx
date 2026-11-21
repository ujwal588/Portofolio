import { useEffect, useRef } from "react";

type VantaBirdsEffect = {
  destroy: () => void;
  onMouseMove?: (x: number, y: number) => void;
};

/** Persistent decorative Vanta canvas. The CSS page color remains visible beneath it. */
export default function VantaBirdsBackground({ backgroundImage }: { backgroundImage: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let effect: VantaBirdsEffect | undefined;
    const steerWithPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const rect = host.getBoundingClientRect();
      effect?.onMouseMove?.(
        Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
        Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      );
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
          color1: 0xd76f7f,
          color2: 0xf0a3ad,
          birdSize: 0.5,
          wingSpan: 14,
          speedLimit: 3.5,
          separation: 62,
          alignment: 22,
          cohesion: 8,
          quantity: 5,
        });
        window.addEventListener("pointermove", steerWithPointer, { passive: true });
      } catch (error) {
        // Leave the stylesheet's gentle page-color fallback in place if WebGL is unavailable.
        console.warn("Vanta Birds could not initialize; using the static background instead.", error);
      }
    };
    void initialize();

    return () => {
      cancelled = true;
      window.removeEventListener("pointermove", steerWithPointer);
      effect?.destroy();
    };
  }, []);

  return <div ref={hostRef} className="vanta-background" style={{ backgroundImage: `linear-gradient(180deg,rgba(247,243,248,.04),rgba(247,243,248,.08)),url("${backgroundImage}")` }} aria-hidden="true" />;
}
