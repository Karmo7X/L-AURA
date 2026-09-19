export const NOISE = /* glsl */ `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      v += amp * noise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      amp *= 0.5;
    }
    return v;
  }
`;

/* ------------------------------------------------------------------ */
/* Liquid body                                                         */
/* ------------------------------------------------------------------ */
export const liquidVertex = /* glsl */ `
  uniform float uBottom;
  uniform float uTop;
  uniform float uGlassBottom;
  uniform float uGlassTop;
  uniform float uRB;
  uniform float uRT;
  uniform vec2 uSlosh;
  varying float vH;
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    float y = mix(uBottom, uTop, position.y);
    float t = clamp((y - uGlassBottom) / (uGlassTop - uGlassBottom), 0.0, 1.0);
    float r = mix(uRB, uRT, t) - 0.014;
    vec3 p = vec3(position.x * r, y, position.z * r);
    p.y += position.y * (p.x * uSlosh.x + p.z * uSlosh.y);
    vH = position.y;
    vObj = p;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vPosW = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * vec3(position.x, 0.0, position.z));
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const liquidFragment = /* glsl */ `
  uniform float uTime;
  uniform float uMilk;
  uniform float uDark;
  uniform float uCrema;
  uniform float uHeight;
  uniform vec3 uCoffee;
  uniform vec3 uCoffeeLight;
  uniform vec3 uCremaBand;
  uniform vec3 uMilkColor;
  uniform vec3 uFoam;
  varying float vH;
  varying vec3 vObj;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  ${NOISE}
  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vPosW);
    float n = noise(vec2(vObj.x * 2.4 + vObj.z * 1.3 + uTime * 0.25, vObj.y * 3.2 - uTime * 0.18));

    vec3 deep = mix(uCoffee, uCoffee * 0.5, uDark);
    vec3 light = mix(uCoffeeLight, uCoffeeLight * 0.55, uDark);
    vec3 coffee = mix(deep, light, smoothstep(0.05, 1.0, vH) * 0.75);

    // Latte: milky base, marbled espresso band, foam cap.
    vec3 latte = mix(uMilkColor * 1.08, uMilkColor * 0.62, smoothstep(0.3, 0.8, vH + (n - 0.5) * 0.35));
    latte = mix(latte, uFoam, smoothstep(0.84, 0.95, vH));

    // Swirl blend: every pixel switches at a noise-driven threshold.
    float threshold = n * 0.8 + 0.1;
    float m = smoothstep(threshold - 0.12, threshold + 0.12, uMilk * 1.3 - 0.15);
    vec3 col = mix(coffee, latte, m);

    // Foam / crema band: the bubbly collar you see through the glass.
    float yAbs = vH * uHeight;
    float bubbles = noise(vec2(vObj.x * 30.0 + vObj.z * 14.0, vObj.y * 44.0));
    vec3 band = mix(uCremaBand, uCremaBand * 1.2, bubbles);
    band = mix(band, uFoam, m);
    col = mix(col, band, smoothstep(uHeight - 0.18, uHeight - 0.03, yAbs) * max(uCrema, m) * 0.9);

    vec3 L = normalize(vec3(-0.45, 0.7, 0.55));
    col *= 0.62 + 0.38 * max(dot(N, L), 0.0);
    float rim = pow(1.0 - max(dot(N, V), 0.0), 2.0);
    col *= 1.0 - rim * 0.5;
    // Back light glowing through the thin edge of the coffee.
    col += light * 0.6 * pow(max(dot(N, normalize(vec3(0.7, 0.15, -0.7))), 0.0), 2.0) * (1.0 - m);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ------------------------------------------------------------------ */
/* Liquid surface (crema, latte art, ripples)                          */
/* ------------------------------------------------------------------ */
export const surfaceVertex = /* glsl */ `
  uniform float uTop;
  uniform float uR;
  uniform vec2 uSlosh;
  uniform float uRipple;
  uniform float uTime;
  uniform vec2 uPour;
  varying vec2 vP;
  void main() {
    vP = position.xz;
    vec3 p = vec3(position.x * uR, uTop, position.z * uR);
    p.y += p.x * uSlosh.x + p.z * uSlosh.y;
    float d = length(vP - uPour);
    p.y += sin(d * 28.0 - uTime * 13.0) * exp(-d * 2.2) * uRipple * 0.012;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const surfaceFragment = /* glsl */ `
  uniform float uTime;
  uniform float uCrema;
  uniform float uMilk;
  uniform float uRipple;
  uniform float uDark;
  uniform float uArtAngle;
  uniform vec2 uPour;
  uniform vec3 uCoffee;
  uniform vec3 uCremaA;
  uniform vec3 uCremaB;
  uniform vec3 uLatte;
  uniform vec3 uLatteRim;
  uniform vec3 uFoam;
  varying vec2 vP;
  ${NOISE}

  float dot2(vec2 v) { return dot(v, v); }
  float sdHeart(vec2 p) {
    p.x = abs(p.x);
    if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
    return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
  }

  void main() {
    vec2 p = vP;
    float r = length(p);

    // Crema — slow swirl with tiger mottling and a darker meniscus.
    float a = r * 2.4 - uTime * 0.07;
    mat2 swirl = mat2(cos(a), -sin(a), sin(a), cos(a));
    vec2 q = swirl * p;
    float n = fbm(q * 2.6 + 4.0);
    float fine = fbm(p * 11.0 + uTime * 0.03);
    vec3 crema = mix(uCremaA, uCremaB, smoothstep(0.25, 0.78, n));
    crema = mix(crema, uCremaA * 0.7, smoothstep(0.55, 0.8, fine) * 0.5);
    crema = mix(crema, uCremaA * 0.5, smoothstep(0.7, 1.0, r));
    crema = mix(crema, crema * 0.68, uDark * 0.6);
    vec3 col = mix(uCoffee, crema, uCrema);

    // Latte art heart, kept facing the viewer as the cup turns.
    vec2 ap = mat2(cos(uArtAngle), -sin(uArtAngle), sin(uArtAngle), cos(uArtAngle)) * p;
    vec2 hp = vec2(ap.x, -ap.y) * 1.75 + vec2(0.0, 0.52);
    float heart = sdHeart(hp);
    float art = 1.0 - smoothstep(-0.018, 0.018, heart);
    art *= 0.9 + 0.1 * (sin(heart * 70.0) * 0.5 + 0.5);
    vec3 latte = mix(uLatte, uLatteRim, smoothstep(0.6, 1.0, r));
    latte = mix(latte, uFoam, art);

    float sw = fbm(q * 3.0 - uTime * 0.06);
    float m = smoothstep(sw - 0.15, sw + 0.15, uMilk * 1.35 - 0.2);
    col = mix(col, latte, m);

    // Pour ripples.
    float d = length(p - uPour);
    float wave = sin(d * 28.0 - uTime * 13.0) * exp(-d * 2.2) * uRipple;
    col *= 1.0 + wave * 0.18;
    col += vec3(max(wave, 0.0)) * 0.04;

    // Glossy window reflection.
    vec2 gp = (p - vec2(-0.36, -0.42)) * vec2(1.0, 2.4);
    col += vec3(1.0, 0.9, 0.8) * smoothstep(0.34, 0.0, length(gp)) * mix(0.2, 0.06, m);

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ------------------------------------------------------------------ */
/* Pour stream                                                         */
/* ------------------------------------------------------------------ */
export const streamVertex = /* glsl */ `
  uniform float uTop;
  uniform float uBottom;
  uniform float uWidth;
  uniform float uTime;
  uniform vec2 uXZ;
  varying vec3 vNormalV;
  varying vec2 vFlow;
  void main() {
    float y = mix(uBottom, uTop, position.y);
    float fall = clamp((uTop - y) / 3.0, 0.0, 1.0);
    float w = uWidth * mix(1.3, 0.78, fall);
    float wob = sin(y * 5.0 + uTime * 16.0) * 0.008 + sin(y * 11.0 - uTime * 23.0) * 0.004;
    vec3 p = vec3(position.x * w + uXZ.x + wob, y, position.z * w + uXZ.y);
    vFlow = vec2(uv.x, y);
    vNormalV = normalize(normalMatrix * vec3(position.x, 0.0, position.z));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const streamFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHighlight;
  uniform float uTime;
  varying vec3 vNormalV;
  varying vec2 vFlow;
  ${NOISE}
  void main() {
    vec3 N = normalize(vNormalV);
    float facing = abs(N.z);
    float streak = noise(vec2(vFlow.x * 22.0, vFlow.y * 2.5 + uTime * 10.0));
    vec3 col = uColor * (0.65 + 0.55 * facing);
    col += uHighlight * smoothstep(0.35, 0.6, N.x) * (1.0 - smoothstep(0.6, 0.9, N.x)) * 0.75;
    col += uHighlight * (streak - 0.5) * 0.18;
    gl_FragColor = vec4(col, smoothstep(0.0, 0.4, facing));
    #include <colorspace_fragment>
  }
`;

/* ------------------------------------------------------------------ */
/* Steam                                                               */
/* ------------------------------------------------------------------ */
export const steamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const steamFragment = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec3 uColor;
  varying vec2 vUv;
  ${NOISE}
  void main() {
    float t = uTime * 0.22 + uSeed;
    float sway = (noise(vec2(vUv.y * 2.2 - t * 1.4, uSeed)) - 0.5) * 0.6 * vUv.y;
    float x = vUv.x - 0.5 - sway;
    float n = fbm(vec2(x * 3.4 + uSeed, vUv.y * 2.4 - t * 1.7));
    float column = exp(-x * x * 16.0);
    float wisps = smoothstep(0.38, 0.82, n) * column;
    float fade = smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.4, 1.0, vUv.y));
    gl_FragColor = vec4(uColor, wisps * fade * uOpacity * 0.6);
    #include <colorspace_fragment>
  }
`;
