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
    let idleNudgeTimer = 0;
    let lastPointerMove = 0;
    let steeringUntil = 0;
    let flockFrame = 0;
    const steerWithPointer = (event: PointerEvent) => {
      if ((event.pointerType !== "mouse" && event.pointerType !== "pen") || performance.now() < steeringUntil) return;
      const rect = host.getBoundingClientRect();
      lastPointerMove = performance.now();
      effect?.onMouseMove?.(
        Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
        Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
      );
    };
    const nudgeWhileIdle = () => {
      if (performance.now() - lastPointerMove > 1200) {
        effect?.onMouseMove?.(0.12 + Math.random() * 0.76, 0.12 + Math.random() * 0.76);
      }
      idleNudgeTimer = window.setTimeout(nudgeWhileIdle, 1400 + Math.random() * 1800);
    };
    const sendFlockToTop = () => {
      if (flockFrame) window.cancelAnimationFrame(flockFrame);
      const started = performance.now();
      const duration = 1050;
      steeringUntil = started + duration + 200;
      const animateFlock = (now: number) => {
        const progress = Math.min(1, (now - started) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        // Sweep the virtual repeller from below the flock to the top edge so the birds surge upward.
        const x = 0.5 + Math.sin(progress * Math.PI * 3) * 0.08;
        const y = 0.96 - eased * 0.9;
        effect?.onMouseMove?.(x, y);
        if (progress < 1) {
          flockFrame = window.requestAnimationFrame(animateFlock);
        } else {
          flockFrame = 0;
          lastPointerMove = performance.now();
          effect?.onMouseMove?.(0.14 + Math.random() * 0.72, 0.14 + Math.random() * 0.72);
        }
      };
      flockFrame = window.requestAnimationFrame(animateFlock);
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
          birdSize: 1.15,
          wingSpan: 26,
          speedLimit: 3,
          separation: 48,
          alignment: 16,
          cohesion: 10,
          quantity: 5,
        });
        window.addEventListener("pointermove", steerWithPointer, { passive: true });
        window.addEventListener("portfolio:flock-to-top", sendFlockToTop);
        idleNudgeTimer = window.setTimeout(nudgeWhileIdle, 1200);
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
      window.clearTimeout(idleNudgeTimer);
      if (flockFrame) window.cancelAnimationFrame(flockFrame);
      effect?.destroy();
    };
  }, []);

  return <div ref={hostRef} className="vanta-background" style={{ backgroundImage: `linear-gradient(180deg,rgba(247,243,248,.04),rgba(247,243,248,.08)),url("${backgroundImage}")` }} aria-hidden="true" />;
}
