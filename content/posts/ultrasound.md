---
title: "Ultrasound: Seeing with Sound"
author: "Nik Palmer"
date: "2026-02-25"
tags: ["ultrasound","physics","medical-imaging","signal-processing","acoustics","interactive"]
draft: false
---

Before anything else — fire the pulse below. Drag the depth slider. Watch the echo come back.

<figure class="us-interactive" id="fig-ascan">
<div class="us-shell">
<div class="us-wrap">
<div class="us-canvas-wrap">
<canvas class="us-canvas" id="us-ascan-cv" style="height:220px"></canvas>
</div>
<div class="us-controls">
<div class="us-slider-row">
<label class="us-label" for="us-ascan-depth">Depth</label>
<output class="us-value" id="us-ascan-depth-val">6.0 cm</output>
<input class="us-slider" type="range" id="us-ascan-depth" min="1" max="15" step="0.1" value="6">
</div>
<div class="us-btn-row">
<button class="us-btn" id="us-ascan-fire">&#9654; Fire Pulse</button>
<button class="us-btn us-btn--ghost" id="us-ascan-auto">Auto</button>
</div>
<div class="us-readout">
<div id="us-ascan-r1" style="font-family:monospace"></div>
<div id="us-ascan-r2" style="font-family:monospace;color:#00c6ff;font-weight:600"></div>
</div>
</div>
</div>
</div>
<figcaption><strong>A-Scan Echo Timer</strong> — one pulse out, one echo back, one distance reading. The bottom trace is an A-scan: amplitude vs depth.</figcaption>
</figure>

That is the entire idea. Everything else in ultrasound imaging is an elaboration on that one question: *how long did the pulse take to come back?*

---

## I. The Smallest Question

Most explanations of ultrasound start with transducer arrays, beamforming, and scan geometries. I want to start smaller.

Fire a pulse of sound into soft tissue. It hits a boundary between two materials and some of it bounces back. If the round-trip travel time is **t**, and the speed of sound in tissue is **v**, then the depth of that boundary is:

```
d = (v × t) / 2
```

That divide-by-two is the first thing people get wrong. The pulse goes *out* and comes *back* — we measure round-trip time, but we want one-way distance.

In soft tissue, v ≈ **1,540 m/s** (or 1.54 mm per microsecond). Ultrasound machines assume this number for every depth calculation, which is a useful approximation but also a known source of measurement error when you scan through fat, bone, or air pockets — but more on that later.

So for a boundary at 6 cm:

```
t = (2 × 60 mm) / 1.54 mm·µs⁻¹ ≈ 77.9 µs
```

Less than a tenth of a millisecond. The pulse fires, travels out, bounces off a boundary, travels back, and arrives at the transducer — all before you'd have time to blink 10,000 times.

---

## II. One Pulse Is Not an Image

A single A-scan gives you one line of depth information. It tells you *how deep* a reflector is along a single beam path, but nothing about what's to the left or right of it.

**A-scan (Amplitude mode)** — the raw echo signal plotted against time/depth. Each spike on the trace is a reflector. The height of the spike encodes how strong the reflection was.

**B-scan (Brightness mode)** — take many A-scans at adjacent positions, convert each amplitude value to a pixel brightness, and stack the columns side by side. The result is a 2D cross-sectional image.

<figure class="us-interactive" id="fig-bscan">
<div class="us-shell">
<div class="us-wrap">
<div class="us-canvas-wrap">
<canvas class="us-canvas" id="us-bscan-cv" style="height:300px"></canvas>
</div>
<div class="us-controls">
<div class="us-slider-row">
<label class="us-label" for="us-bscan-pos">Scan position</label>
<output class="us-value" id="us-bscan-pos-val">0%</output>
<input class="us-slider" type="range" id="us-bscan-pos" min="0" max="100" step="0.5" value="0">
</div>
<div class="us-btn-row">
<button class="us-btn" id="us-bscan-play">&#9654; Auto-sweep</button>
<button class="us-btn us-btn--ghost" id="us-bscan-reset">Reset</button>
</div>
<div class="us-readout">
<div id="us-bscan-r1">Move the slider or hit Auto-sweep to scan the beam across the phantom.</div>
</div>
</div>
</div>
</div>
<figcaption><strong>B-Scan Builder</strong> — sweep the beam across the phantom. Each A-scan column paints one vertical strip of the image. The circular dark region is an anechoic cyst (fluid-filled — no internal echoes). Note the brighter region directly below it: <em>posterior acoustic enhancement</em>.</figcaption>
</figure>

That is a B-scan being built from scratch. Every column of that image is the A-scan you saw in the first demo, converted to brightness. The dark oval isn't empty — it's fluid. Fluid is anechoic: sound passes straight through it without scattering back. The brightness below it is a tell-tale sign: tissue behind a fluid pocket receives *more* energy than tissue behind a solid structure, because nothing was absorbed on the way through.

These artefacts — shadowing, enhancement, reverberation — are not noise. They carry real information about tissue properties once you know how to read them.

### Transducer Arrays

A single-element transducer would need to physically sweep across the patient to produce a B-scan. Modern transducers contain 128 to 512 piezoelectric elements in a row, and they steer or focus the beam electronically by firing each element with a small, precisely controlled time delay.

This is **phased array** beamforming. By applying progressive delays across the elements, the individual wave fronts interfere constructively in a chosen direction — Huygens' principle made practical.

<figure class="us-interactive" id="fig-beam">
<div class="us-shell">
<div class="us-wrap">
<div class="us-canvas-wrap">
<canvas class="us-canvas" id="us-beam-cv" style="height:280px"></canvas>
</div>
<div class="us-controls">
<div class="us-slider-row">
<label class="us-label" for="us-beam-angle">Steer angle</label>
<output class="us-value" id="us-beam-angle-val">0°</output>
<input class="us-slider" type="range" id="us-beam-angle" min="-30" max="30" step="1" value="0">
</div>
<div class="us-slider-row">
<label class="us-label" for="us-beam-nelems">Elements</label>
<output class="us-value" id="us-beam-nelems-val">8</output>
<input class="us-slider" type="range" id="us-beam-nelems" min="4" max="16" step="2" value="8">
</div>
</div>
</div>
</div>
<figcaption><strong>Phased Array Beam Steering</strong> — each element fires with a delay that shifts the constructive interference zone. Increase the element count to see the side-lobes collapse and the main beam sharpen.</figcaption>
</figure>

Increase the element count and the beam gets narrower and more directional — better lateral resolution. Reduce it and the beam broadens, and unwanted *side-lobes* appear. Managing this trade-off is a significant part of transducer design.

---

## III. Image Characteristics

Understanding why parts of a B-scan look the way they do requires a little physics.

### Acoustic Impedance

When a sound wave reaches a boundary between two materials, some energy is reflected and some is transmitted. The proportion depends on the **acoustic impedance** (Z) of each material:

```
Z = ρ × v     (density × speed of sound, in MRayl)
```

The intensity reflection coefficient is:

```
R = ((Z₂ − Z₁) / (Z₂ + Z₁))²
```

If Z₁ ≈ Z₂, almost nothing reflects. If they differ dramatically, most energy bounces back.

<figure class="us-interactive" id="fig-impedance">
<div class="us-shell">
<div class="us-wrap">
<div class="us-canvas-wrap">
<canvas class="us-canvas" id="us-imp-cv" style="height:240px"></canvas>
</div>
<div class="us-controls">
<div class="us-chip-row" id="us-imp-chips" style="margin-bottom:0.5rem">
<button class="us-chip us-chip--active" data-z1="1.63" data-z2="1.38" data-label="Tissue / Fat">Tissue / Fat</button>
<button class="us-chip" data-z1="1.63" data-z2="1.71" data-label="Tissue / Muscle">Tissue / Muscle</button>
<button class="us-chip" data-z1="1.63" data-z2="7.80" data-label="Tissue / Bone">Tissue / Bone</button>
<button class="us-chip" data-z1="1.63" data-z2="0.00043" data-label="Tissue / Air">Tissue / Air</button>
</div>
<div class="us-readout" id="us-imp-readout"></div>
</div>
</div>
</div>
<figcaption><strong>Acoustic Impedance</strong> — compare common tissue interfaces. The wider the impedance gap, the brighter the reflection. Tissue/air is essentially a perfect mirror for sound.</figcaption>
</figure>

The tissue/air interface (R ≈ 99.95%) is why we use **coupling gel** — it eliminates the thin air gap between the transducer face and skin, which would otherwise reflect nearly all the energy before it even entered the body.

### Attenuation

Sound also loses energy as it travels through tissue, even without hitting a boundary. This happens through absorption and scattering, and it scales with both depth and frequency:

```
attenuation ≈ 0.5 dB / cm / MHz   (soft tissue)
```

At 5 MHz, scanning to a depth of 10 cm costs about **50 dB** of round-trip loss. That is a factor of 100,000 in power. Deeper structures appear progressively dimmer.

<figure class="us-interactive" id="fig-atten">
<div class="us-shell">
<div class="us-wrap">
<div class="us-canvas-wrap">
<canvas class="us-canvas" id="us-atten-cv" style="height:260px"></canvas>
</div>
<div class="us-controls">
<div class="us-slider-row">
<label class="us-label" for="us-atten-freq">Frequency</label>
<output class="us-value" id="us-atten-freq-val">5 MHz</output>
<input class="us-slider" type="range" id="us-atten-freq" min="2" max="15" step="0.5" value="5">
</div>
<div class="us-btn-row">
<button class="us-btn us-btn--ghost" id="us-atten-tgc">TGC: Off</button>
</div>
<div class="us-readout" id="us-atten-readout"></div>
</div>
</div>
</div>
<figcaption><strong>Attenuation Explorer</strong> — raise the frequency and watch deep structures fade. Toggle <em>Time Gain Compensation (TGC)</em> to see how machines compensate electronically.</figcaption>
</figure>

This is the fundamental trade-off in ultrasound frequency selection: **higher frequency → better resolution, worse penetration**. A 15 MHz probe resolves tiny superficial structures beautifully but can't see past 2–3 cm. A 2.5 MHz probe penetrates 20+ cm but blurs fine detail.

---

## IV. Bad Days for Ultrasound

Ultrasound is not good at everything. Knowing where it fails is as important as knowing where it excels.

**Air.** As the impedance table above shows, sound barely enters an air-filled space. This makes the lungs largely inaccessible under normal conditions (though lung ultrasound for detecting pneumothorax or consolidation is a growing clinical skill — you're looking at *artefacts* caused by the air-tissue interface, not the air itself). Bowel gas creates large acoustic shadows that obscure structures behind it. In cardiac imaging, the ribs and aerated lung limit scanning to specific intercostal windows.

**Bone.** Cortical bone has high impedance and absorbs sound strongly. It blocks everything behind it. The skull makes transcranial ultrasound possible only through specific acoustic windows — the temporal bone above the ear is the thinnest and preferred entry point.

**Patient variability.** Body habitus matters enormously. A thick anterior abdominal wall means more attenuation before the beam even reaches target organs. Scar tissue changes local impedance. Adipose tissue has a slightly different speed of sound (~1,450 m/s vs 1,540 m/s for soft tissue), which introduces depth measurement errors and defocusing.

**Operator dependence.** Unlike CT or MRI, the image you get depends heavily on who is holding the probe. Angle of incidence, probe pressure, choice of frequency, and scan plane all affect image quality. Ultrasound competency is trained over months for good reason.

---

## V. Where It Shines

Despite its limitations, ultrasound occupies a unique position in several fields.

### Medicine

Ultrasound is often the *first* imaging tool used in emergency and critical care — not because it's the most accurate, but because it is fast, portable, safe (no ionising radiation), and repeatable at the bedside.

It is essential in obstetrics: fetal growth, amniotic fluid volume, placental position, anomaly screening. It is the standard for guiding needle placement in procedures. It characterises masses (solid or fluid?), evaluates cardiac function in real-time, and in emergency medicine the focused abdominal scan (FAST exam) can diagnose life-threatening haemorrhage in minutes.

Beyond basic imaging: **Doppler** uses the frequency shift of echoes from moving red blood cells to measure blood flow velocity and direction. **Elastography** measures tissue stiffness by tracking how tissue deforms under pressure — useful for liver fibrosis staging. **Contrast-enhanced ultrasound (CEUS)** uses microbubble agents to evaluate perfusion.

### Non-Destructive Testing

Ultrasound has been used industrially since the 1940s. The same time-of-flight principle detects cracks, delaminations, and inclusions in welds, composites, and castings — without cutting them open. Phased array ultrasonic testing (PAUT) creates real-time cross-sectional images of materials using the exact same technology as medical B-scan. Pipelines, aircraft fuselages, nuclear reactor vessels — all routinely inspected this way.

### Sonar

Active sonar uses sound pulses in water for range-finding and mapping: identical physics, different frequency range (kilohertz rather than megahertz), much larger scales. Bats, dolphins, and other animals use biological echolocation with remarkable precision. A bat can resolve an insect at several metres with a sweep of ultrasonic clicks. The fidelity of biological ultrasound systems remains a benchmark that engineering has not fully matched.

---

## Summary

1. **The fundamental measurement** is time of flight: `d = (v × t) / 2`. Simple geometry.
2. **A single echo** tells you one depth. A B-scan is thousands of A-scans assembled into an image.
3. **Phased arrays** steer and focus the beam electronically — no moving parts.
4. **Image brightness** encodes the impedance mismatch at boundaries and their depth.
5. **Attenuation** reduces penetration at high frequencies; TGC compensates.
6. **Air and bone** are hard limits. Patient and operator factors dominate real-world image quality.
7. The same physics serves medicine, engineering, and sonar.

What looks like a grainy black-and-white image in a clinical suite is a 30-frames-per-second reconstruction of the body's interior from echoes that each take less than 0.1 milliseconds. It is a timing instrument, a materials characterisation tool, and a window into living anatomy — all running in real time.

---

## Further Reading

- Wells, P.N.T. (2006). *Ultrasound imaging*. Physics in Medicine and Biology, 51(13): R83–R98.
- Szabo, T.L. (2014). *Diagnostic Ultrasound Imaging: Inside Out* (2nd ed.). Academic Press.
- Edler, I. & Hertz, C.H. (1954). *The use of ultrasonic reflectoscope for the continuous recording of the movements of heart walls.* — the paper that started cardiac ultrasound.
- IEEE Ultrasonics, Ferroelectrics, and Frequency Control (UFFC) journal — for the engineering depth.

---

<style>
.us-interactive figcaption {
  font-size: 0.85rem;
  color: rgba(255,255,255,0.45);
  margin-top: 0.5rem;
  line-height: 1.55;
}
.us-interactive figcaption strong {
  color: rgba(255,255,255,0.7);
}
</style>

<script>
(function () {
  "use strict";

  var V = 1.54;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  function makeRng(seed) {
    var s = (seed | 0) || 1;
    return function () {
      s = Math.imul(1664525, s) + 1013904223 | 0;
      return (s >>> 0) / 0xFFFFFFFF;
    };
  }

  /* ════════════════════════════════════════════════════════════
     1. A-SCAN ECHO TIMER
  ════════════════════════════════════════════════════════════ */
  (function () {
    var cv   = document.getElementById("us-ascan-cv");
    if (!cv) return;
    var sl   = document.getElementById("us-ascan-depth");
    var slV  = document.getElementById("us-ascan-depth-val");
    var btnF = document.getElementById("us-ascan-fire");
    var btnA = document.getElementById("us-ascan-auto");
    var r1   = document.getElementById("us-ascan-r1");
    var r2   = document.getElementById("us-ascan-r2");

    var depth = 6.0, phase = "idle", prog = 0;
    var autoMode = false, lastTs = null;
    var echo = new Float32Array(400), hasFired = false, holdTimer = 0;

    function tripMs() { return (2 * depth * 10 / V) * 0.018; }

    function resize() {
      var w = cv.offsetWidth || 600;
      cv.width  = w * DPR;
      cv.height = Math.round(w * 0.40 * DPR);
    }

    function fire() {
      if (phase === "out" || phase === "back") return;
      phase = "out"; prog = 0; echo.fill(0); hasFired = true; lastTs = null;
    }

    function tick(ts) {
      requestAnimationFrame(tick);
      if (!lastTs) lastTs = ts;
      var dt = Math.min(ts - lastTs, 32); lastTs = ts;

      if (autoMode && phase === "idle") fire();

      if (phase === "out" || phase === "back") {
        prog += dt / tripMs();
        if (prog >= 1) {
          prog = 1;
          if (phase === "out") { phase = "back"; prog = 0; }
          else {
            var ei = Math.round((depth / 15) * 370);
            for (var k = -14; k <= 14; k++) {
              var idx = ei + k;
              if (idx >= 0 && idx < 400) echo[idx] = Math.exp(-k * k / 22) * 0.82;
            }
            phase = "hold"; holdTimer = 0;
          }
        }
      }

      if (phase === "hold") {
        holdTimer += dt;
        if (holdTimer > (autoMode ? 600 : 9999999)) { phase = "idle"; echo.fill(0); hasFired = false; }
      }

      draw();
    }

    function draw() {
      var W = cv.width, H = cv.height, ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      var d = DPR;
      var XW = 22 * d, MX = XW + 2 * d, MW = W * 0.60 - MX;
      var MY = H * 0.04, MH = H * 0.63;
      var AY = H * 0.74, AH = H * 0.20;
      var midY = MY + MH * 0.5;

      ctx.fillStyle = "#060e14"; ctx.fillRect(0, 0, W, H);

      var tg = ctx.createLinearGradient(MX, 0, MX + MW, 0);
      tg.addColorStop(0, "#091724"); tg.addColorStop(1, "#0c1e2e");
      ctx.fillStyle = tg; ctx.fillRect(MX, MY, MW, MH);

      ctx.save(); ctx.globalAlpha = 0.06;
      var rng = makeRng(77);
      for (var i = 0; i < 90; i++) {
        ctx.fillStyle = "#fff";
        ctx.fillRect(MX + rng() * MW, MY + rng() * MH, d, d);
      }
      ctx.restore();

      var bx = MX + (depth / 15) * MW;
      ctx.save(); ctx.setLineDash([3 * d, 4 * d]);
      ctx.strokeStyle = "rgba(0,198,255,0.4)"; ctx.lineWidth = d;
      ctx.beginPath(); ctx.moveTo(bx, MY); ctx.lineTo(bx, MY + MH); ctx.stroke();
      ctx.restore(); ctx.setLineDash([]);
      ctx.fillStyle = "rgba(0,198,255,0.65)";
      ctx.font = (9 * d) + "px monospace"; ctx.textAlign = "left";
      ctx.fillText(depth.toFixed(1) + " cm", bx + 3 * d, MY + 12 * d);

      ctx.fillStyle = "#142130"; ctx.fillRect(0, MY, XW, MH);
      var fg = ctx.createLinearGradient(XW - 4 * d, 0, XW, 0);
      fg.addColorStop(0, "rgba(0,198,255,0)"); fg.addColorStop(1, "rgba(0,198,255,0.75)");
      ctx.fillStyle = fg; ctx.fillRect(XW - 4 * d, MY + MH * 0.1, 4 * d, MH * 0.8);
      ctx.save();
      ctx.translate(XW * 0.5, MY + MH * 0.5); ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.font = (7 * d) + "px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("XDCR", 0, 0);
      ctx.restore();

      if (phase === "out" || phase === "back") {
        var p = clamp(prog, 0, 1);
        var cx2 = phase === "out" ? lerp(MX + 6 * d, bx - 20 * d, p) : lerp(bx - 20 * d, MX + 6 * d, p);
        var PW = 26 * d, NS = 52;
        ctx.beginPath();
        for (var s = 0; s < NS; s++) {
          var t = (s / (NS - 1)) * 2 - 1;
          var env = Math.exp(-t * t * 3.5);
          var wav = Math.sin(t * Math.PI * 4.5);
          var sx = cx2 + t * PW, sy = midY + env * wav * (phase === "out" ? 11 : 9) * d;
          s === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = phase === "out" ? "rgba(255,245,170,0.92)" : "rgba(0,255,168,0.9)";
        ctx.lineWidth = 1.6 * d; ctx.lineJoin = "round"; ctx.stroke();
        ctx.save(); ctx.globalAlpha = 0.10; ctx.shadowBlur = 10 * d;
        ctx.shadowColor = phase === "out" ? "#ffe060" : "#00ffa0";
        ctx.stroke(); ctx.restore();
      }

      ctx.fillStyle = "#030b10"; ctx.fillRect(MX, AY, MW, AH);
      ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = d;
      ctx.strokeRect(MX, AY, MW, AH);
      ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.font = (8 * d) + "px monospace";
      ctx.fillText("A-scan", MX + 3 * d, AY - 3 * d);

      var baseY = AY + AH * 0.5;
      ctx.strokeStyle = "rgba(0,198,255,0.14)"; ctx.lineWidth = d;
      ctx.beginPath(); ctx.moveTo(MX, baseY); ctx.lineTo(MX + MW, baseY); ctx.stroke();

      if (hasFired) {
        ctx.beginPath(); ctx.strokeStyle = "#00e8aa"; ctx.lineWidth = 1.4 * d;
        for (var j = 0; j < 400; j++) {
          var ax = MX + (j / 400) * MW;
          var amp = j < 18 ? (j < 9 ? j / 9 : (18 - j) / 9) * 0.25 : echo[j];
          var ay = baseY - amp * AH * 0.44;
          j === 0 ? ctx.moveTo(ax, ay) : ctx.lineTo(ax, ay);
        }
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = (7 * d) + "px monospace"; ctx.textAlign = "center";
      for (var cm = 0; cm <= 15; cm += 5)
        ctx.fillText(cm + "cm", MX + (cm / 15) * MW, AY + AH + 9 * d);

      var us = (2 * depth * 10 / V).toFixed(1);
      r1.textContent = "v = 1540 m/s   |   d = (v \u00d7 t) / 2";
      r2.textContent = "Echo at t = " + us + " \u00b5s  \u2192  depth = " + depth.toFixed(1) + " cm";
      slV.textContent = depth.toFixed(1) + " cm";
    }

    sl.addEventListener("input", function () {
      depth = parseFloat(sl.value); echo.fill(0); hasFired = false; phase = "idle";
    });
    btnF.addEventListener("click", fire);
    btnA.addEventListener("click", function () {
      autoMode = !autoMode;
      btnA.classList.toggle("us-btn--active", autoMode);
      btnA.textContent = autoMode ? "\u25a0 Stop" : "Auto";
      if (autoMode && phase === "idle") fire();
    });

    new ResizeObserver(function () { resize(); }).observe(cv);
    resize(); requestAnimationFrame(tick);
  }());

  /* ════════════════════════════════════════════════════════════
     2. B-SCAN BUILDER
  ════════════════════════════════════════════════════════════ */
  (function () {
    var cv = document.getElementById("us-bscan-cv");
    if (!cv) return;
    var sl   = document.getElementById("us-bscan-pos");
    var slV  = document.getElementById("us-bscan-pos-val");
    var btnP = document.getElementById("us-bscan-play");
    var btnR = document.getElementById("us-bscan-reset");
    var r1   = document.getElementById("us-bscan-r1");

    var PW = 200, PH = 200;

    var phantom = (function () {
      var p = new Float32Array(PW * PH);
      var rng = makeRng(1337);
      for (var i = 0; i < PW * PH; i++) p[i] = rng() < 0.018 ? rng() * 0.28 : 0;

      var aw = Math.round(PH * 0.07);
      for (var x = 0; x < PW; x++) {
        p[x * PH + aw] = 0.95; p[x * PH + aw + 1] = 0.55; p[x * PH + aw + 2] = 0.22;
      }

      var ccx = Math.round(PW * 0.50), ccy = Math.round(PH * 0.50), cr = Math.round(PH * 0.18);
      for (var cx = 0; cx < PW; cx++) {
        for (var cy = 0; cy < PH; cy++) {
          var dd = Math.sqrt((cx - ccx) * (cx - ccx) + (cy - ccy) * (cy - ccy));
          if (dd < cr) p[cx * PH + cy] = 0;
          if (dd >= cr && dd < cr + 2.5) p[cx * PH + cy] = 0.88;
        }
      }

      for (var ex = ccx - cr - 4; ex <= ccx + cr + 4; ex++) {
        for (var ey = ccy + cr + 1; ey < ccy + cr + Math.round(PH * 0.09); ey++) {
          if (ex >= 0 && ex < PW && ey >= 0 && ey < PH && p[ex * PH + ey] < 0.3)
            p[ex * PH + ey] = Math.min(p[ex * PH + ey] * 2.2 + 0.04, 0.45);
        }
      }

      var sx = Math.round(PW * 0.26), sy = Math.round(PH * 0.64);
      for (var r2 = 0; r2 <= 2; r2++) {
        for (var dx2 = -r2; dx2 <= r2; dx2++) for (var dy2 = -r2; dy2 <= r2; dy2++) {
          var xi = sx + dx2, yi = sy + dy2;
          if (xi >= 0 && xi < PW && yi >= 0 && yi < PH) p[xi * PH + yi] = 0.92;
        }
      }
      for (var xi = sx - 3; xi <= sx + 3; xi++)
        for (var yi = sy + 3; yi < PH; yi++)
          if (xi >= 0 && xi < PW) p[xi * PH + yi] *= 0.08;

      var pw2 = Math.round(PH * 0.87);
      for (var x2 = 0; x2 < PW; x2++) {
        p[x2 * PH + pw2] = 0.92; p[x2 * PH + pw2 + 1] = 0.52; p[x2 * PH + pw2 + 2] = 0.18;
      }
      return p;
    }());

    var scanPos = 0, revealed = 0, autoPlay = false, lastTs = null;
    var fullImg = null;

    function buildFullImg(ctx, W, H) {
      var img = ctx.createImageData(W, H), data = img.data;
      for (var bx = 0; bx < W; bx++) {
        var px = Math.round((bx / (W - 1)) * (PW - 1));
        for (var by = 0; by < H; by++) {
          var py = Math.round((by / (H - 1)) * (PH - 1));
          var amp = phantom[px * PH + py] * Math.exp(-0.022 * py);
          var br = Math.min(255, amp * 340);
          var idx = (by * W + bx) * 4;
          data[idx] = data[idx + 1] = data[idx + 2] = br; data[idx + 3] = 255;
        }
      }
      return img;
    }

    function resize() {
      var w = cv.offsetWidth || 600;
      cv.width = w * DPR; cv.height = Math.round(w * 0.46 * DPR);
      fullImg = null;
    }

    function tick(ts) {
      requestAnimationFrame(tick);
      if (!lastTs) lastTs = ts;
      var dt = Math.min(ts - lastTs, 32); lastTs = ts;
      if (autoPlay) {
        revealed += dt * 0.00055;
        if (revealed >= 1) {
          revealed = 1; autoPlay = false;
          btnP.textContent = "\u25b6 Auto-sweep"; btnP.classList.remove("us-btn--active");
        }
        scanPos = revealed;
        sl.value = (scanPos * 100).toFixed(1);
        slV.textContent = Math.round(scanPos * 100) + "%";
      } else {
        if (scanPos > revealed) revealed = scanPos;
      }
      draw();
    }

    function draw() {
      var W = cv.width, H = cv.height, ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      var d = DPR;
      var BW = Math.round(W * 0.56), BH = Math.round(H * 0.88);

      ctx.fillStyle = "#060e14"; ctx.fillRect(0, 0, W, H);

      if (!fullImg) fullImg = buildFullImg(ctx, BW, BH);

      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, Math.round(revealed * BW), BH);
      ctx.clip();
      ctx.putImageData(fullImg, 0, 0);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = d;
      ctx.strokeRect(0, 0, BW, BH);

      var scanLX = Math.round(scanPos * BW);
      ctx.save(); ctx.strokeStyle = "rgba(0,220,255,0.75)"; ctx.lineWidth = 1.5 * d;
      ctx.setLineDash([3 * d, 3 * d]);
      ctx.beginPath(); ctx.moveTo(scanLX, 0); ctx.lineTo(scanLX, BH);
      ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
      ctx.fillStyle = "#00c6ff"; ctx.beginPath();
      ctx.arc(scanLX, 0, 4 * d, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.font = (8 * d) + "px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText("B-scan", BW * 0.5, BH + 4 * d);

      ctx.fillStyle = "rgba(255,255,255,0.16)"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
      for (var cm = 0; cm <= 10; cm += 2) {
        var ty = (cm / 10) * BH;
        ctx.fillText(cm + "cm", -2 * d, ty);
        ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = d;
        ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(BW, ty); ctx.stroke();
      }

      var AX = BW + 8 * d, AW = W - AX - 4 * d;
      ctx.fillStyle = "#030c12"; ctx.fillRect(AX, 0, AW, BH);
      ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = d;
      ctx.strokeRect(AX, 0, AW, BH);

      var baseX = AX + AW * 0.2;
      ctx.strokeStyle = "rgba(0,198,255,0.15)"; ctx.lineWidth = d;
      ctx.beginPath(); ctx.moveTo(baseX, 0); ctx.lineTo(baseX, BH); ctx.stroke();

      var px2 = Math.round(scanPos * (PW - 1));
      ctx.beginPath(); ctx.strokeStyle = "#00e8aa"; ctx.lineWidth = 1.4 * d;
      for (var j = 0; j < PH; j++) {
        var ay = (j / (PH - 1)) * BH;
        var amp2 = phantom[px2 * PH + j] * Math.exp(-0.022 * j);
        var ax2 = baseX + amp2 * AW * 0.72;
        j === 0 ? ctx.moveTo(ax2, ay) : ctx.lineTo(ax2, ay);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.font = (8 * d) + "px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText("A-scan", AX + AW * 0.5, BH + 4 * d);

      r1.textContent = "Column " + Math.round(scanPos * 100) + "% — each column is one A-scan.";
    }

    sl.addEventListener("input", function () {
      scanPos = parseFloat(sl.value) / 100;
      if (scanPos > revealed) revealed = scanPos;
      slV.textContent = Math.round(scanPos * 100) + "%";
    });
    btnP.addEventListener("click", function () {
      if (revealed >= 1) { revealed = 0; scanPos = 0; sl.value = 0; slV.textContent = "0%"; }
      autoPlay = !autoPlay;
      btnP.classList.toggle("us-btn--active", autoPlay);
      btnP.textContent = autoPlay ? "\u25a0 Pause" : "\u25b6 Auto-sweep";
    });
    btnR.addEventListener("click", function () {
      revealed = 0; scanPos = 0; autoPlay = false;
      sl.value = 0; slV.textContent = "0%";
      btnP.textContent = "\u25b6 Auto-sweep"; btnP.classList.remove("us-btn--active");
    });

    new ResizeObserver(function () { resize(); }).observe(cv);
    resize(); requestAnimationFrame(tick);
  }());

  /* ════════════════════════════════════════════════════════════
     3. PHASED ARRAY BEAM STEERING
  ════════════════════════════════════════════════════════════ */
  (function () {
    var cv = document.getElementById("us-beam-cv");
    if (!cv) return;
    var slA  = document.getElementById("us-beam-angle");
    var slAV = document.getElementById("us-beam-angle-val");
    var slN  = document.getElementById("us-beam-nelems");
    var slNV = document.getElementById("us-beam-nelems-val");

    var angle = 0, nElems = 8, dirty = true;
    var beamCache = null;

    function resize() {
      var w = cv.offsetWidth || 600;
      cv.width = w * DPR; cv.height = Math.round(w * 0.52 * DPR);
      dirty = true;
    }

    function buildBeam(W, H) {
      var d = DPR;
      var EH = Math.round(H * 0.13);
      var FH = H - EH;
      var theta = angle * Math.PI / 180;
      var lambda = 18 * d, spacing = lambda * 0.5;
      var k = (2 * Math.PI) / lambda;
      var totalSpan = (nElems - 1) * spacing;
      var elemXs = [];
      for (var i = 0; i < nElems; i++) elemXs.push(W * 0.5 - totalSpan * 0.5 + i * spacing);

      var offC = document.createElement("canvas");
      offC.width = W; offC.height = FH;
      var octx = offC.getContext("2d");
      var img = octx.createImageData(W, FH), data = img.data;

      for (var py = 0; py < FH; py++) {
        var depthFade = Math.exp(-py / FH * 0.9);
        for (var px = 0; px < W; px++) {
          var sc = 0, ss = 0;
          for (var e = 0; e < nElems; e++) {
            var dist = Math.sqrt((px - elemXs[e]) * (px - elemXs[e]) + py * py);
            var steer = k * (elemXs[e] - W * 0.5) * Math.sin(theta);
            var phi = k * dist - steer;
            sc += Math.cos(phi); ss += Math.sin(phi);
          }
          var intensity = (sc * sc + ss * ss) / (nElems * nElems) * depthFade;
          var bright = Math.min(1, intensity * 1.3);
          var idx = (py * W + px) * 4;
          data[idx]     = Math.round(bright * bright * 20);
          data[idx + 1] = Math.round(bright * 198);
          data[idx + 2] = Math.round(bright * 255);
          data[idx + 3] = 255;
        }
      }
      octx.putImageData(img, 0, 0);
      beamCache = { canvas: offC, EH: EH, elemXs: elemXs, lambda: lambda, spacing: spacing };
      dirty = false;
    }

    function draw() {
      var W = cv.width, H = cv.height, ctx = cv.getContext("2d");
      var d = DPR;
      if (dirty) buildBeam(W, H);
      ctx.fillStyle = "#060e14"; ctx.fillRect(0, 0, W, H);

      var EH = beamCache.EH;
      ctx.drawImage(beamCache.canvas, 0, EH);

      var theta = angle * Math.PI / 180;
      var elemXs = beamCache.elemXs, spacing = beamCache.spacing;
      for (var i = 0; i < nElems; i++) {
        var ex = elemXs[i];
        var delay = (i - (nElems - 1) * 0.5) * Math.sin(theta);
        var norm = clamp((delay + nElems * 0.4) / (nElems * 0.8), 0, 1);
        var gr = Math.round(lerp(0, 40, norm)), gg = Math.round(lerp(120, 210, norm));
        ctx.fillStyle = "rgb(" + gr + "," + gg + ",255)";
        ctx.fillRect(ex - spacing * 0.35, EH * 0.25, spacing * 0.7, EH * 0.55);
        ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = d;
        ctx.strokeRect(ex - spacing * 0.35, EH * 0.25, spacing * 0.7, EH * 0.55);
      }

      var aLen = H * 0.22;
      ctx.save(); ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#00c6ff"; ctx.lineWidth = 2 * d;
      ctx.setLineDash([4 * d, 4 * d]);
      ctx.beginPath();
      ctx.moveTo(W * 0.5, EH);
      ctx.lineTo(W * 0.5 + aLen * Math.sin(theta), EH + aLen * Math.cos(theta));
      ctx.stroke(); ctx.restore(); ctx.setLineDash([]);

      ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.font = (8 * d) + "px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(nElems + " elements  |  " + angle + "\u00b0 steering", W * 0.5, 2 * d);

      slAV.textContent = angle + "\u00b0";
      slNV.textContent = nElems;
    }

    slA.addEventListener("input", function () { angle = parseInt(slA.value); dirty = true; });
    slN.addEventListener("input", function () { nElems = parseInt(slN.value); dirty = true; });

    new ResizeObserver(function () { resize(); }).observe(cv);
    resize();
    (function loop() { requestAnimationFrame(loop); draw(); }());
  }());

  /* ════════════════════════════════════════════════════════════
     4. ACOUSTIC IMPEDANCE
  ════════════════════════════════════════════════════════════ */
  (function () {
    var cv = document.getElementById("us-imp-cv");
    if (!cv) return;
    var chips   = document.getElementById("us-imp-chips");
    var readout = document.getElementById("us-imp-readout");

    var Z1 = 1.63, Z2 = 1.38, waveT = 0;

    chips && chips.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-z1]"); if (!btn) return;
      Array.from(chips.querySelectorAll(".us-chip")).forEach(function (c) { c.classList.remove("us-chip--active"); });
      btn.classList.add("us-chip--active");
      Z1 = parseFloat(btn.dataset.z1); Z2 = parseFloat(btn.dataset.z2);
    });

    function resize() {
      var w = cv.offsetWidth || 600;
      cv.width = w * DPR; cv.height = Math.round(w * 0.38 * DPR);
    }

    function tick() {
      requestAnimationFrame(tick); waveT += 0.03; draw();
    }

    function draw() {
      var W = cv.width, H = cv.height, ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      var d = DPR;
      var BX = W * 0.47, midY = H * 0.5, wH = H * 0.13, lam = 44 * d, NS = 60;
      var R = Math.pow((Z2 - Z1) / (Z2 + Z1), 2);
      var T = 1 - R, Rp = (Z2 - Z1) / (Z2 + Z1);

      ctx.fillStyle = "#091a28"; ctx.fillRect(0, 0, BX, H);
      var bright = T * 0.22;
      ctx.fillStyle = "rgb(" + Math.round(9 + bright * 80) + "," + Math.round(26 + bright * 50) + "," + Math.round(40 + bright * 55) + ")";
      ctx.fillRect(BX, 0, W - BX, H);
      ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1.5 * d;
      ctx.beginPath(); ctx.moveTo(BX, 0); ctx.lineTo(BX, H); ctx.stroke();

      function mLabel(txt, sub, x, y) {
        ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = (10 * d) + "px sans-serif"; ctx.textAlign = "center";
        ctx.fillText(txt, x, y);
        ctx.fillStyle = "rgba(0,198,255,0.7)"; ctx.font = (9 * d) + "px monospace";
        ctx.fillText(sub, x, y + 13 * d);
      }
      var l1 = chips ? (chips.querySelector(".us-chip--active") || {}).dataset || {} : {};
      var parts = (l1.label || "Tissue / Fat").split(" / ");
      mLabel(parts[0], "Z\u2081 = " + Z1.toFixed(3) + " MRayl", BX * 0.5, H * 0.13);
      mLabel(parts[1] || "", "Z\u2082 = " + (Z2 < 0.01 ? Z2.toExponential(2) : Z2.toFixed(3)) + " MRayl", BX + (W - BX) * 0.5, H * 0.13);

      function drawWave(x0, x1, amp, color, phOff) {
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5 * d;
        for (var i = 0; i <= NS; i++) {
          var wx = x0 + (i / NS) * (x1 - x0);
          var t2 = (i / NS) * (x1 - x0) / lam;
          var wy = midY + amp * Math.sin(t2 * Math.PI * 2 - waveT + phOff);
          i === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
        }
        ctx.stroke();
      }

      drawWave(0, BX, wH, "rgba(255,245,180,0.85)", 0);
      drawWave(0, BX, Math.sqrt(R) * wH, "rgba(0,255,168,0.8)", Math.PI * (Rp < 0 ? 1 : 0) + waveT * 2);
      drawWave(BX, W, Math.sqrt(T) * wH, "rgba(100,180,255,0.7)", 0);

      ctx.font = (9 * d) + "px monospace"; ctx.textAlign = "left";
      ctx.fillStyle = "rgba(0,255,168,0.8)";
      ctx.fillText("R = " + (R * 100).toFixed(1) + "% reflected", 6 * d, H * 0.82);
      ctx.fillStyle = "rgba(100,180,255,0.8)";
      ctx.fillText("T = " + (T * 100).toFixed(1) + "% transmitted", 6 * d, H * 0.82 + 13 * d);

      readout.innerHTML = "Z\u2081 = " + Z1.toFixed(4) + " MRayl &nbsp;|&nbsp; Z\u2082 = " +
        (Z2 < 0.001 ? Z2.toExponential(3) : Z2.toFixed(4)) +
        " MRayl &nbsp;|&nbsp; <strong style='color:#00c6ff'>R = " + (R * 100).toFixed(2) + "%</strong>";
    }

    new ResizeObserver(function () { resize(); }).observe(cv);
    resize(); requestAnimationFrame(tick);
  }());

  /* ════════════════════════════════════════════════════════════
     5. ATTENUATION EXPLORER
  ════════════════════════════════════════════════════════════ */
  (function () {
    var cv = document.getElementById("us-atten-cv");
    if (!cv) return;
    var slF     = document.getElementById("us-atten-freq");
    var slFV    = document.getElementById("us-atten-freq-val");
    var btnT    = document.getElementById("us-atten-tgc");
    var readout = document.getElementById("us-atten-readout");

    var freq = 5, tgcOn = false;
    var ALPHA = 0.5, DEPTH_CM = 12;

    var refs = (function () {
      var rng = makeRng(42), arr = [];
      for (var i = 0; i < 22; i++) arr.push({ d: 0.03 + rng() * 0.94, s: 0.3 + rng() * 0.65 });
      arr.push({ d: 0.08, s: 0.95 }, { d: 0.90, s: 0.95 }, { d: 0.52, s: 0.60 });
      return arr;
    }());

    function resize() {
      var w = cv.offsetWidth || 600;
      cv.width = w * DPR; cv.height = Math.round(w * 0.44 * DPR);
    }

    function draw() {
      var W = cv.width, H = cv.height, ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      var d = DPR;
      var SW = Math.round(W * 0.55), SX = Math.round(W * 0.09);
      var AX = SX + SW + 16 * d, AW = W - AX - 4 * d;

      ctx.fillStyle = "#060e14"; ctx.fillRect(0, 0, W, H);

      for (var col = 0; col < SW; col++) {
        for (var row = 0; row < H; row++) {
          var df = row / H, dc = df * DEPTH_CM;
          var aDb = ALPHA * dc * freq * 2, tgcG = tgcOn ? aDb : 0;
          var rng2 = makeRng((col * 7 + row * 13) | 0);
          var spk = rng2() < 0.025 ? 0.25 + rng2() * 0.4 : 0;
          var amp = spk * Math.pow(10, (-aDb + tgcG) / 20);
          for (var ri = 0; ri < refs.length; ri++) {
            var dd2 = Math.abs(df - refs[ri].d);
            if (dd2 < 0.008) amp += refs[ri].s * Math.exp(-dd2 * dd2 / 0.000009) * Math.pow(10, (-aDb + tgcG) / 20);
          }
          var br = Math.min(255, amp * 320);
          ctx.fillStyle = "rgb(" + br + "," + br + "," + br + ")";
          ctx.fillRect(SX + col, row, 1, 1);
        }
      }
      ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = d; ctx.strokeRect(SX, 0, SW, H);

      ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.font = (8 * d) + "px monospace"; ctx.textAlign = "right";
      for (var cm = 0; cm <= DEPTH_CM; cm += 3) {
        var ty = (cm / DEPTH_CM) * H;
        ctx.fillText(cm + "cm", SX - 2 * d, ty + 3 * d);
        ctx.strokeStyle = "rgba(255,255,255,0.05)"; ctx.lineWidth = d;
        ctx.beginPath(); ctx.moveTo(SX, ty); ctx.lineTo(SX + SW, ty); ctx.stroke();
      }

      ctx.fillStyle = "#030c12"; ctx.fillRect(AX, 0, AW, H);
      ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = d; ctx.strokeRect(AX, 0, AW, H);
      var baseX = AX + AW * 0.2;
      ctx.strokeStyle = "rgba(0,198,255,0.15)"; ctx.lineWidth = d;
      ctx.beginPath(); ctx.moveTo(baseX, 0); ctx.lineTo(baseX, H); ctx.stroke();

      ctx.beginPath(); ctx.strokeStyle = "#00e8aa"; ctx.lineWidth = 1.4 * d;
      for (var row2 = 0; row2 <= H; row2++) {
        var df2 = row2 / H, dc2 = df2 * DEPTH_CM;
        var aDb2 = ALPHA * dc2 * freq * 2, tgcG2 = tgcOn ? aDb2 : 0;
        var amp2 = 0;
        for (var ri2 = 0; ri2 < refs.length; ri2++) {
          var dd3 = Math.abs(df2 - refs[ri2].d);
          if (dd3 < 0.012) amp2 = Math.max(amp2, refs[ri2].s * Math.exp(-dd3 * dd3 / 0.000016) * Math.pow(10, (-aDb2 + tgcG2) / 20));
        }
        var ax2 = baseX + amp2 * AW * 0.72;
        row2 === 0 ? ctx.moveTo(ax2, row2) : ctx.lineTo(ax2, row2);
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.font = (8 * d) + "px monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "bottom";
      ctx.fillText("A-scan", AX + AW * 0.5, H - 2 * d);

      if (!tgcOn) {
        ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = "#ff9a4a"; ctx.lineWidth = d;
        ctx.setLineDash([3 * d, 3 * d]);
        ctx.beginPath(); ctx.moveTo(SX + SW + 5 * d, H * 0.07); ctx.lineTo(SX + SW + 5 * d, H * 0.9);
        ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
        ctx.fillStyle = "rgba(255,154,74,0.65)"; ctx.font = (8 * d) + "px monospace"; ctx.textAlign = "left";
        ctx.fillText("-" + (ALPHA * DEPTH_CM * freq * 2).toFixed(0) + " dB", SX + SW + 7 * d, H * 0.5);
      }

      slFV.textContent = freq + " MHz";
      btnT.textContent = "TGC: " + (tgcOn ? "On" : "Off");
      btnT.classList.toggle("us-btn--active", tgcOn);
      readout.innerHTML = "\u03b1 = 0.5 dB/cm/MHz &nbsp;|&nbsp; at " + freq + " MHz over " + DEPTH_CM +
        " cm round-trip: <strong style='color:#ff9a4a'>" + (ALPHA * DEPTH_CM * freq * 2).toFixed(1) +
        " dB loss</strong>" + (tgcOn ? " <span style='color:#00c6ff'>(TGC compensated)</span>" : "");
    }

    slF.addEventListener("input", function () { freq = parseFloat(slF.value); });
    btnT.addEventListener("click", function () { tgcOn = !tgcOn; });

    new ResizeObserver(function () { resize(); }).observe(cv);
    resize();
    (function loop() { requestAnimationFrame(loop); draw(); }());
  }());

}());
</script>
