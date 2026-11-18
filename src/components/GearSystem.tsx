import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode, type RefObject } from "react";

type GearNode = { teeth: number; parent: number | null; preferredAngle: number };
type GearPose = GearNode & { x: number; y: number; phase: number; ratio: number };

// Child centers sit at the sum of pitch radii; tooth phases place one tooth in
// the mating gear's gap. The graph is a tree so every mesh has one clear drive.
const nodes: GearNode[] = [
  { teeth: 24, parent: null, preferredAngle: 0 },
  { teeth: 16, parent: 0, preferredAngle: 0 },
  { teeth: 12, parent: 1, preferredAngle: -Math.PI / 2 },
  { teeth: 18, parent: 0, preferredAngle: Math.PI / 2 },
  { teeth: 10, parent: 3, preferredAngle: Math.PI },
  { teeth: 8, parent: 4, preferredAngle: Math.PI },
  { teeth: 12, parent: 0, preferredAngle: Math.PI },
  { teeth: 10, parent: 6, preferredAngle: -Math.PI / 2 },
];

const poses: GearPose[] = [];
nodes.forEach((node) => {
  if (node.parent === null) {
    poses.push({ ...node, x: 0, y: 0, phase: 0, ratio: 1 });
    return;
  }
  const parent = poses[node.parent];
  const toothStep = Math.PI * 2 / parent.teeth;
  const angle = parent.phase + Math.round((node.preferredAngle - parent.phase) / toothStep) * toothStep;
  const distance = (parent.teeth + node.teeth) * 3;
  poses.push({ ...node, x: parent.x + Math.cos(angle) * distance, y: parent.y + Math.sin(angle) * distance,
    phase: angle + Math.PI - Math.PI / node.teeth, ratio: -parent.ratio * parent.teeth / node.teeth });
});

const clusters = [
  { x: 110, y: 74, scale: 0.58 }, { x: 590, y: 88, scale: 0.55 },
  { x: 1110, y: 70, scale: 0.6 }, { x: 230, y: 625, scale: 0.55 },
  { x: 690, y: 610, scale: 0.58 }, { x: 1210, y: 632, scale: 0.57 },
  { x: 720, y: 390, scale: 0.54 },
];
const idleSpeed = 0.24;
const totalDuration = 1.2;
const stopDuration = 0.16;
const accelerationDuration = 0.19;
const revealStart = 0.35;
const revealEnd = 0.9;
const reverseSpeed = 5.2;

function displacement(time: number, direction: number) {
  const t = Math.max(0, Math.min(time, totalDuration));
  if (t <= stopDuration) return direction * idleSpeed * (t - t * t / (2 * stopDuration));
  const initialDrift = idleSpeed * stopDuration / 2;
  const reverseTime = t - stopDuration;
  const rampTime = Math.min(reverseTime, accelerationDuration);
  const u = rampTime / accelerationDuration;
  const rampDistance = reverseSpeed * accelerationDuration * (u ** 3 - 0.5 * u ** 4);
  const fastDistance = reverseSpeed * Math.max(0, reverseTime - accelerationDuration);
  const settleTime = Math.max(0, t - revealEnd);
  const settleDuration = totalDuration - revealEnd;
  const settleCorrection = t > revealEnd ? (reverseSpeed - idleSpeed) * settleTime ** 3 / (3 * settleDuration ** 2) : 0;
  return direction * initialDrift - direction * (rampDistance + fastDistance - settleCorrection);
}

function easeInOut(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function gearPath(teeth: number) {
  const pitch = teeth * 3;
  const root = pitch - 4;
  const tip = pitch + 4;
  const step = Math.PI * 2 / teeth;
  const profile: Array<[number, number]> = [[-0.5, root], [-0.3, root], [-0.19, tip], [0.19, tip], [0.3, root], [0.5, root]];
  const points = Array.from({ length: teeth }, (_, i) => profile.map(([offset, radius]) => {
    const angle = (i + offset) * step;
    return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`;
  })).flat();
  return `M${points[0]} L${points.slice(1).join(" L")} Z`;
}

export type GearTransitionFrame = { angle: number; reveal: number; elapsed: number };
export type GearSystemHandle = {
  beginTransition: () => number;
  cancelTransition: () => void;
  finishTransition: (startTime: number, now: number) => void;
  frameAt: (startTime: number, now: number) => GearTransitionFrame;
};

export const GearSystemBackground = forwardRef<GearSystemHandle>(function GearSystemBackground(_props, forwardedRef) {
  const svgRef = useRef<SVGSVGElement>(null);
  const engine = useRef({ angle: 0, direction: 1, last: 0, activeStart: 0, activeAngle: 0, activeDirection: 1 });

  useImperativeHandle(forwardedRef, () => ({
    beginTransition() {
      const state = engine.current;
      const now = performance.now();
      state.activeStart = now;
      state.activeAngle = state.angle;
      state.activeDirection = state.direction;
      state.direction *= -1;
      state.last = now;
      return now;
    },
    cancelTransition() {
      const state = engine.current;
      state.activeStart = 0;
      state.last = performance.now();
    },
    finishTransition(startTime, now) {
      const state = engine.current;
      const elapsed = Math.max(0, (now - startTime) / 1000);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      state.angle = state.activeAngle + (reduced ? 0 : displacement(elapsed, state.activeDirection));
      state.activeStart = 0;
      state.last = now;
    },
    frameAt(startTime, now) {
      const state = engine.current;
      const elapsed = Math.max(0, (now - startTime) / 1000);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const angle = state.activeAngle + (reduced ? 0 : displacement(elapsed, state.activeDirection));
      const phaseTravel = Math.abs(displacement(revealEnd, state.activeDirection) - displacement(revealStart, state.activeDirection));
      const travel = Math.abs(displacement(Math.min(elapsed, revealEnd), state.activeDirection) - displacement(revealStart, state.activeDirection));
      const reveal = elapsed < revealStart ? 0 : elapsed >= revealEnd ? 1 : easeInOut(travel / phaseTravel);
      return { angle, reveal, elapsed };
    },
  }), []);

  useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      const state = engine.current;
      if (!state.last) state.last = now;
      const elapsed = (now - state.activeStart) / 1000;
      if (state.activeStart && elapsed <= totalDuration) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        state.angle = state.activeAngle + (reduced ? 0 : displacement(elapsed, state.activeDirection));
      } else {
        if (state.activeStart) state.activeStart = 0;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!reduced) state.angle += idleSpeed * state.direction * Math.min((now - state.last) / 1000, 0.05);
      }
      state.last = now;
      svgRef.current?.querySelectorAll<SVGGElement>("[data-gear-index]").forEach((rotor) => {
        const pose = poses[Number(rotor.dataset.gearIndex)];
        rotor.setAttribute("transform", `rotate(${(pose.phase + pose.ratio * state.angle) * 180 / Math.PI})`);
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <svg ref={svgRef} className="ambient-gears" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {clusters.map((cluster, clusterIndex) => <g key={clusterIndex} transform={`translate(${cluster.x} ${cluster.y}) scale(${cluster.scale})`}>
      {poses.map((gear, gearIndex) => <g key={gearIndex} transform={`translate(${gear.x} ${gear.y})`}>
        <g data-gear-index={gearIndex} className={`ambient-gear-rotor${gearIndex % 2 ? " gear-tone-lilac" : " gear-tone-peach"}`}>
          <path className="ambient-gear-body" d={gearPath(gear.teeth)} />
          <g className="ambient-gear-spokes">{[0, 90, 180, 270].map((rotation) => <line key={rotation} x1="0" y1={-gear.teeth * 0.6} x2="0" y2={-gear.teeth * 1.74} transform={`rotate(${rotation})`} />)}</g>
          <circle className="ambient-gear-hub" r={gear.teeth * 0.72} /><circle className="ambient-gear-hole" r={gear.teeth * 0.27} />
        </g>
      </g>)}
    </g>)}
  </svg>;
});

export type MechanicalPageTransitionHandle = {
  start: (target: "/systems" | "/blog", label: string, source: DOMRect) => void;
  cancel: () => void;
};

export const MechanicalPageTransition = forwardRef<MechanicalPageTransitionHandle, {
  gears: RefObject<GearSystemHandle | null>;
  renderPage: (path: "/systems" | "/blog") => ReactNode;
  onComplete: (path: "/systems" | "/blog") => void;
}>(function MechanicalPageTransition({ gears, renderPage, onComplete }, forwardedRef) {
  const layerRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<{ target: "/systems" | "/blog"; label: string; source: DOMRect; started: number } | null>(null);
  const [active, setActive] = useState<typeof activeRef.current>(null);

  useImperativeHandle(forwardedRef, () => ({
    start(target, label, source) {
      if (activeRef.current) return;
      const started = gears.current?.beginTransition() ?? performance.now();
      activeRef.current = { target, label, source, started };
      setActive(activeRef.current);
    },
    cancel() {
      if (!activeRef.current) return;
      activeRef.current = null;
      gears.current?.cancelTransition();
      setActive(null);
    },
  }), [gears]);

  useEffect(() => {
    if (!active) return;
    const savedOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let frame = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (now: number) => {
      const animation = activeRef.current;
      if (!animation) return;
      const motion = gears.current?.frameAt(animation.started, now);
      if (!motion) return;
      const radius = 44 + (Math.hypot(window.innerWidth, window.innerHeight) * 0.62 - 44) * motion.reveal;
      if (revealRef.current) {
        revealRef.current.style.clipPath = reduced ? "none" : `circle(${radius}px at 50% 50%)`;
        revealRef.current.style.opacity = reduced ? String(Math.min(1, motion.elapsed / 0.24)) : "1";
      }
      if (ringRef.current) ringRef.current.style.transform = `translate(-50%,-50%) rotate(${motion.angle * 180 / Math.PI}deg)`;
      if (sourceRef.current) {
        const source = animation.source;
        if (motion.elapsed <= 0.2) {
          const p = Math.min(motion.elapsed / 0.2, 1);
          sourceRef.current.style.transform = `translateY(${-6 * p}px) scale(${1 + 0.15 * p})`;
          sourceRef.current.style.opacity = "1";
        } else if (motion.elapsed < 0.35) {
          const p = (motion.elapsed - 0.2) / 0.15;
          const x = (window.innerWidth / 2) - (source.left + source.width / 2);
          const y = (window.innerHeight / 2) - (source.top + source.height / 2);
          sourceRef.current.style.transform = `translate(${x * p}px,${-6 + y * p}px) rotate(${12 * p}deg) scale(${1.15 - 1.05 * p})`;
          sourceRef.current.style.opacity = String(1 - p);
        } else {
          sourceRef.current.style.opacity = "0";
        }
      }
      const duration = reduced ? 0.3 : totalDuration;
      if (motion.elapsed >= duration) {
        const target = animation.target;
        gears.current?.finishTransition(animation.started, now);
        activeRef.current = null;
        setActive(null);
        document.body.style.overflow = savedOverflow;
        onComplete(target);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = savedOverflow;
    };
  }, [active, gears, onComplete]);

  return <div ref={layerRef} className={`mechanical-transition-layer${active ? " is-active" : ""}`} aria-hidden="true" inert>
    {active && <>
      <div ref={revealRef} className="mechanical-page-reveal">{renderPage(active.target)}</div>
      <div ref={sourceRef} className="mechanical-source" style={{ left: active.source.left, top: active.source.top, width: active.source.width, height: active.source.height }}>{active.label}</div>
      <svg ref={ringRef} className="mechanical-iris-gear" viewBox="-90 -90 180 180" aria-hidden="true"><path d={gearPath(24)} /><circle r="59" /></svg>
    </>}
  </div>;
});
