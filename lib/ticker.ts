// A single requestAnimationFrame loop shared by Lenis and the WebGL canvas.
// Lenis must update the scroll position *before* the 3D cup reads DOM rects,
// otherwise the cup lags one frame behind the page while scrolling.

type Tick = (timeMs: number) => void;

const subscribers: { fn: Tick; priority: number }[] = [];
let frame = 0;

function loop(time: number) {
  for (const sub of subscribers) sub.fn(time);
  frame = requestAnimationFrame(loop);
}

/** Lower priority runs first. Returns an unsubscribe function. */
export function addTick(fn: Tick, priority = 0) {
  subscribers.push({ fn, priority });
  subscribers.sort((a, b) => a.priority - b.priority);
  if (!frame) frame = requestAnimationFrame(loop);

  return () => {
    const index = subscribers.findIndex((s) => s.fn === fn);
    if (index >= 0) subscribers.splice(index, 1);
    if (!subscribers.length && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}
