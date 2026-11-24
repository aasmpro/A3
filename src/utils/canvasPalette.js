// Browser-only readers for shared theme values; call after client initialization.
export function themeNumber(name) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  const number = parseFloat(value);
  // CSS may serialize 1100ms as 1.1s; browser timers always require milliseconds.
  return name.startsWith("duration-") && value.endsWith("s") && !value.endsWith("ms")
    ? number * 1000
    : number;
}

export function canvasPalette(theme) {
  const styles = getComputedStyle(document.documentElement);
  const token = (name) => styles.getPropertyValue(`--${name}`).trim();
  const number = (name) => parseFloat(token(`canvas-${name}`));
  const light = theme === "light";
  const peak = token(light ? "black" : "white");
  // CSS optimization may serialize six-digit palette tokens as shorthand hex.
  const hex = peak.slice(1);
  const expanded = hex.length === 3 ? [...hex].map((channel) => channel.repeat(2)).join("") : hex;
  const channels = [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16)).join(",");
  return {
    background: token(light ? "white" : "black"),
    body: token(light ? "gray-47" : "gray-04"),
    dim: token(light ? "gray-32" : "gray-20"),
    mid: token(light ? "gray-20" : "gray-32"),
    bright: token(light ? "gray-04" : "gray-47"),
    peak,
    font: getComputedStyle(document.body).fontFamily,
    glow: `rgba(${channels},${number("glow-opacity")})`,
    glowHunter: number("glow-hunter"),
    glowHunterCaptured: number("glow-hunter-captured"),
    glowTriangle: number("glow-triangle"),
    glowTriangleCapture: number("glow-triangle-capture"),
    glowSignal: number("glow-signal"),
    strokeTriangle: number("stroke-triangle"),
    strokeConnection: number("stroke-connection"),
    strokeSignal: number("stroke-signal"),
    strokeShot: number("stroke-shot"),
    strokeBlast: number("stroke-blast"),
    strokeDrop: number("stroke-drop"),
    opacityRainHead: number("opacity-rain-head"),
    opacityRainTail: number("opacity-rain-tail"),
    opacityAmbient: number("opacity-ambient"),
    opacityMatrix: number("opacity-matrix"),
    opacityCaptureLow: number("opacity-capture-low"),
    opacityCaptureMid: number("opacity-capture-mid"),
    opacityCaptureHigh: number("opacity-capture-high"),
    opacityConnection: number("opacity-connection"),
    opacitySignal: number("opacity-signal"),
    captureDecay: number("capture-decay"),
    fontRayHeadWeight: number("font-ray-weight"),
    cell: number("cell"),
    fontSmall: number("font-small"),
    fontBody: number("font-body"),
    fontAmbient: number("font-ambient"),
    fontRay: number("font-ray"),
    rainMinSpeed: number("rain-min-speed"),
    rainSpeedRange: number("rain-speed-range"),
    signalSpeed: number("signal-speed"),
    signalTail: number("signal-tail"),
    ambientSpeed: number("ambient-speed"),
    ambientFrequency: number("ambient-frequency"),
    rayFrequency: number("ray-frequency"),
    matrixSpeed: number("matrix-speed"),
    rainFlipDuration: number("rain-flip-duration"),
    rainEpochDuration: number("rain-epoch-duration"),
    hunterSpeed: number("hunter-speed"),
    hunterAcceleration: number("hunter-acceleration"),
    captureDuration: number("capture-duration"),
    captureFrequency: number("capture-frequency"),
    turnMin: number("hunter-turn-min"),
    turnRange: number("hunter-turn-range"),
    floatFrequency: number("float-frequency"),
    floatDistance: number("float-distance"),
    tiltFrequency: number("tilt-frequency"),
    tiltDistance: number("tilt-distance"),
    pulseFrequency: number("pulse-frequency"),
    pulseDistance: number("pulse-distance"),
  };
}
