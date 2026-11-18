declare module "vanta/dist/vanta.birds.min" {
  type BirdsOptions = {
    el: HTMLElement;
    THREE: typeof import("three");
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    backgroundAlpha?: number;
    colorMode?: string;
    color1?: number;
    color2?: number;
    birdSize?: number;
    wingSpan?: number;
    speedLimit?: number;
    separation?: number;
    alignment?: number;
    cohesion?: number;
    quantity?: number;
  };
  const birds: (options: BirdsOptions) => { destroy: () => void };
  export default birds;
}
