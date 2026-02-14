---
title: "LiDAR to Driving Decisions: An Interactive Guide"
title_candidates:
  - "LiDAR to Driving Decisions: An Interactive Guide"
  - "From Laser Pulses to Planning: How LiDAR Powers Autonomous Vehicles"
  - "Seeing in 3D: LiDAR Fundamentals for Autonomous Systems"
author: "Nik Palmer"
date: "2026-02-14"
tags: ["lidar","autonomous-vehicles","robotics","perception","slam","sensor-fusion","point-clouds"]
draft: false
---

## DELIVERABLE A - FULL BLOG POST (HTML-friendly Markdown)

# lidar-autonomy.md

## 1. Executive summary
LiDAR is easiest to understand when you can manipulate it, not just read about it. This page starts with short, focused interactives that let you change timing, scan patterns, and coordinate frames before introducing system-level autonomy concepts. We begin from first principles: light travel time, round-trip distance, and why the distance equation divides by two. Then we build up to scan geometry, point cloud structure, calibration, motion distortion, and common failure modes like occlusion and low reflectivity surfaces. After that, we bridge into autonomy workflows: clustering, BEV representations, object detection framing, localization, and planning handoff. The interactives are intentionally small and composable so each one teaches one idea and reuses the same visual language. All technical claims are tied to primary sources: manufacturer docs (Velodyne, Ouster), benchmark/system papers (KITTI, LOAM, PointPillars), and laser safety guidance. If your browser or LMS blocks advanced rendering, each interactive has a fallback static explanation. By the end, you should be able to explain where LiDAR is strong, where it fails, and exactly how its outputs become decisions in an autonomous stack.

### Learning objectives and estimated time

| Section | Objective | Est. time (min) |
|---|---|---:|
| Executive summary | Understand scope and interaction-first flow | 5 |
| A pulse of light and a stopwatch | Compute ToF distance and interpret timing constraints | 12 |
| Turning distances into a scan | Relate FOV, channels, scan rate, and points/sec | 14 |
| From angles to XYZ | Convert spherical measurements to Cartesian frames | 16 |
| Point clouds: what you gain and what you lose | Read sparsity, occlusion, intensity, and missing returns | 14 |
| Errors and calibration | Diagnose noise, bias, motion distortion, and calibration drift | 14 |
| From points to objects | Understand segmentation, BEV structure, and detector framing | 14 |
| From objects to driving | Place LiDAR outputs in localization/tracking/planning pipeline | 12 |
| References and wrap-up | Validate claims and continue deeper study | 9 |

### Table of contents
- [1. Executive summary](#1-executive-summary)
- [2. A pulse of light and a stopwatch (ToF)](#2-a-pulse-of-light-and-a-stopwatch-tof)
- [3. Turning distances into a scan (sampling + scanning geometry)](#3-turning-distances-into-a-scan-sampling--scanning-geometry)
- [4. From angles to XYZ (coordinate frames + transforms)](#4-from-angles-to-xyz-coordinate-frames--transforms)
- [5. Point clouds: what you gain and what you lose (density, occlusion, intensity)](#5-point-clouds-what-you-gain-and-what-you-lose-density-occlusion-intensity)
- [6. Errors and calibration (noise, bias, motion distortion)](#6-errors-and-calibration-noise-bias-motion-distortion)
- [7. From points to objects (clustering, BEV, detection overview)](#7-from-points-to-objects-clustering-bev-detection-overview)
- [8. From objects to driving (localization + planning pipeline)](#8-from-objects-to-driving-localization--planning-pipeline)
- [9. References](#9-references)

## 2. A pulse of light and a stopwatch (ToF)
LiDAR sends a light pulse, then measures how long it takes to return. If a pulse takes `t` seconds round-trip, distance is `d = (c * t) / 2`, where `c` is the speed of light. The factor of 2 matters because the pulse traveled out and back.

<figure class="interactive" id="tof-roundtrip-basics">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Round-Trip Timer</strong> - connect measured delay to one-way distance.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Time-of-flight and round-trip timing.</p>
      <p><em>User inputs:</em> Slider for delay (ns), toggle for medium (vacuum/air conceptual), reset button.</p>
      <p><em>Outputs:</em> Animated pulse path + numeric distance in meters.</p>
      <p><em>Acceptance criteria:</em> Learner correctly explains why divide-by-two is required.</p>
      <p><em>Suggested tech:</em> JS/Canvas + why: simple 2D timing animation with low overhead.</p>
      <p><em>Fallback:</em> Static diagram of outbound/return path with worked example.</p>
    </details>
  </figcaption>
</figure>

<figure class="interactive" id="tof-precision-budget">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Timing Precision Budget</strong> - see how jitter changes distance error.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Relationship between timing uncertainty and range uncertainty.</p>
      <p><em>User inputs:</em> Jitter slider (ps/ns), target distance slider, pause/reset.</p>
      <p><em>Outputs:</em> Error bars and RMS range error numeric readout.</p>
      <p><em>Acceptance criteria:</em> Learner identifies that small timing error can produce noticeable range error.</p>
      <p><em>Suggested tech:</em> D3 + why: clear plotting of uncertainty distributions.</p>
      <p><em>Fallback:</em> Table mapping jitter values to expected distance error.</p>
    </details>
  </figcaption>
</figure>

Misconception callout: LiDAR is not a camera. It does not produce dense RGB imagery; it samples ranges over angles and returns sparse geometry.

Small code sketch:

```python
c = 299_792_458.0  # m/s
round_trip_time_s = 66.7e-9
distance_m = c * round_trip_time_s / 2
print(f"{distance_m:.2f} m")
```

## 3. Turning distances into a scan (sampling + scanning geometry)
A single distance is not a scene. A spinning or scanning LiDAR samples many angles over time, across vertical channels and full azimuth coverage.

<figure class="interactive" id="scan-azimuth-elevation-grid">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Beam Grid Builder</strong> - map channels and azimuth bins into sample count.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Channels, azimuth steps, and resulting point count.</p>
      <p><em>User inputs:</em> Channel count, scan rate (Hz), azimuth resolution sliders.</p>
      <p><em>Outputs:</em> Polar sampling grid + points/sec estimate.</p>
      <p><em>Acceptance criteria:</em> Learner can compute points/sec from geometry and rate settings.</p>
      <p><em>Suggested tech:</em> JS/Canvas + why: lightweight polar grid rendering.</p>
      <p><em>Fallback:</em> Static matrix diagram and formula sheet.</p>
    </details>
  </figcaption>
</figure>

<figure class="interactive" id="fov-coverage-tradeoff">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Coverage vs Resolution</strong> - trade angular resolution against scene detail.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> FOV and angular spacing tradeoffs.</p>
      <p><em>User inputs:</em> Horizontal/vertical FOV, angular step size, scene distance.</p>
      <p><em>Outputs:</em> Side-by-side sparse vs dense sampled silhouettes + point density number.</p>
      <p><em>Acceptance criteria:</em> Learner predicts when distant small objects disappear due to coarse sampling.</p>
      <p><em>Suggested tech:</em> WebGL + why: fast redraw of many points during slider changes.</p>
      <p><em>Fallback:</em> Three fixed comparison panels with explanatory captions.</p>
    </details>
  </figcaption>
</figure>

## 4. From angles to XYZ (coordinate frames + transforms)
Most sensors report range plus angles; autonomy stacks need XYZ in consistent frames. Using a right-hand-rule convention, we convert per-beam measurements to Cartesian points, then transform between sensor, vehicle, and world frames.

<figure class="interactive" id="polar-to-cartesian-converter">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Polar to Cartesian Lab</strong> - convert `(r, azimuth, elevation)` to `(x, y, z)`.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Spherical/polar-to-Cartesian conversion for LiDAR returns.</p>
      <p><em>User inputs:</em> Range slider, azimuth/elevation sliders, coordinate convention toggle.</p>
      <p><em>Outputs:</em> 3D point and numeric XYZ values with axis colors.</p>
      <p><em>Acceptance criteria:</em> Learner correctly predicts sign/direction changes when angle crosses quadrants.</p>
      <p><em>Suggested tech:</em> Three.js + why: orbit camera makes axes and sign intuitive.</p>
      <p><em>Fallback:</em> Static axis figure with solved examples.</p>
    </details>
  </figcaption>
</figure>

<figure class="interactive" id="extrinsic-transform-playground">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Extrinsic Transform Playground</strong> - move points from sensor frame to vehicle frame.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Rigid transforms (rotation + translation) and calibration.</p>
      <p><em>User inputs:</em> Yaw/pitch/roll sliders, xyz translation sliders, reset/pause.</p>
      <p><em>Outputs:</em> Before/after point clouds + transform matrix text block.</p>
      <p><em>Acceptance criteria:</em> Learner explains why bad extrinsics misalign multi-sensor data.</p>
      <p><em>Suggested tech:</em> Three.js + why: frame visualization with gizmo-like controls.</p>
      <p><em>Fallback:</em> Static side-by-side frame alignment illustration.</p>
    </details>
  </figcaption>
</figure>

Small code sketch:

```js
function sphericalToCartesian(r, az, el) {
  const x = r * Math.cos(el) * Math.cos(az);
  const y = r * Math.cos(el) * Math.sin(az);
  const z = r * Math.sin(el);
  return { x, y, z };
}
```

## 5. Point clouds: what you gain and what you lose (density, occlusion, intensity)
Point clouds encode geometry efficiently, but they are sparse, view-dependent, and incomplete. Returns may include intensity/reflectivity proxies, while some surfaces produce weak or missing returns.
Some sensors can also report multiple returns conceptually (for example, first and strongest return behavior), which helps in semi-transparent or partially occluding scenes but still does not eliminate ambiguity.

<figure class="interactive" id="occlusion-ray-demo">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Occlusion Explorer</strong> - inspect hidden regions behind foreground objects.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Line-of-sight occlusion and viewpoint dependence.</p>
      <p><em>User inputs:</em> Sensor position drag, object arrangement presets, toggle top/side view.</p>
      <p><em>Outputs:</em> Visible hit points vs occluded regions map.</p>
      <p><em>Acceptance criteria:</em> Learner identifies that “missing” points can mean blocked view, not absent object.</p>
      <p><em>Suggested tech:</em> JS/Canvas + why: 2D ray-casting is clear and fast.</p>
      <p><em>Fallback:</em> Static ray diagram with highlighted blind zones.</p>
    </details>
  </figcaption>
</figure>

<figure class="interactive" id="intensity-material-contrast">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Reflectivity Contrast</strong> - compare material-dependent intensity patterns.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Intensity/reflectivity variation across materials and angles.</p>
      <p><em>User inputs:</em> Material selector (matte black, painted metal, retroreflective), incident angle slider.</p>
      <p><em>Outputs:</em> Synthetic intensity histogram + colored point cloud preview.</p>
      <p><em>Acceptance criteria:</em> Learner avoids treating intensity as direct color/semantic class.</p>
      <p><em>Suggested tech:</em> D3 + why: histograms and distributions are central.</p>
      <p><em>Fallback:</em> Precomputed histogram images and interpretation notes.</p>
    </details>
  </figcaption>
</figure>

Misconception callout: “More points” does not always mean “better perception.” Coverage, calibration quality, and scene context often dominate.

## 6. Errors and calibration (noise, bias, motion distortion)
Real scans include random noise, systematic bias, and dynamic distortion when the platform moves during a sweep. Calibration keeps multiple sensors and frames consistent over time.
Adverse conditions such as rain/fog, low-reflectivity black surfaces, highly reflective materials, and cross-sensor interference/crosstalk can reduce useful returns or increase uncertainty, so robust systems track confidence rather than treating all points equally.

<figure class="interactive" id="noise-bias-separator">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Noise vs Bias Comparator</strong> - separate random spread from offset error.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Stochastic noise versus systematic bias in range measurements.</p>
      <p><em>User inputs:</em> Noise sigma slider, bias offset slider, sample count slider.</p>
      <p><em>Outputs:</em> Point distribution cloud + mean/variance stats.</p>
      <p><em>Acceptance criteria:</em> Learner distinguishes correction strategy for bias vs averaging strategy for noise.</p>
      <p><em>Suggested tech:</em> D3 + why: statistical visualization focus.</p>
      <p><em>Fallback:</em> Static overlays with annotated mean shift and spread.</p>
    </details>
  </figcaption>
</figure>

<figure class="interactive" id="motion-distortion-sweep">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Rolling Sweep Distortion</strong> - view skew from vehicle motion during scanning.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Motion distortion across a non-instantaneous scan sweep.</p>
      <p><em>User inputs:</em> Vehicle speed, yaw rate, scan duration sliders, pause/reset.</p>
      <p><em>Outputs:</em> Undistorted vs distorted scene comparison and pose timeline.</p>
      <p><em>Acceptance criteria:</em> Learner explains why per-point timestamp compensation is needed.</p>
      <p><em>Suggested tech:</em> Three.js + why: temporal 3D deformation is clearer in orbit view.</p>
      <p><em>Fallback:</em> Static before/after scan strips with timestamps.</p>
    </details>
  </figcaption>
</figure>

## 7. From points to objects (clustering, BEV, detection overview)
Autonomy stacks convert geometry to entities. Typical steps include ground filtering, clustering, feature encoding, and detector inference. PointPillars is a practical framing: bin points into vertical columns (pillars), learn features, and detect objects in BEV.

<figure class="interactive" id="ground-removal-threshold">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Ground Removal Tuner</strong> - tune ground segmentation and inspect false removals.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Ground plane estimation and threshold sensitivity.</p>
      <p><em>User inputs:</em> Height threshold, slope tolerance, robust-fit toggle.</p>
      <p><em>Outputs:</em> Colored cloud (ground/non-ground) + precision/recall estimates on synthetic labels.</p>
      <p><em>Acceptance criteria:</em> Learner balances under-segmentation and over-segmentation tradeoffs.</p>
      <p><em>Suggested tech:</em> WebGL + why: fast recoloring of many points.</p>
      <p><em>Fallback:</em> Static tuned examples with metric table.</p>
    </details>
  </figcaption>
</figure>

<figure class="interactive" id="bev-pillarizer">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: BEV Pillarizer</strong> - transform irregular points into BEV grid/pillars.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Structured representation (pillars) from unstructured point sets.</p>
      <p><em>User inputs:</em> Cell size slider, max points per pillar, region-of-interest bounds.</p>
      <p><em>Outputs:</em> BEV heatmap, occupied-cell count, and feature tensor shape summary.</p>
      <p><em>Acceptance criteria:</em> Learner explains why structured tensors simplify detector pipelines.</p>
      <p><em>Suggested tech:</em> JS/Canvas + why: grid rasterization without heavy dependencies.</p>
      <p><em>Fallback:</em> Static pipeline diagram from cloud to BEV tensor.</p>
    </details>
  </figcaption>
</figure>

Misconception callout: detector confidence is not certainty. Uncertainty propagates into tracking and planning.

## 8. From objects to driving (localization + planning pipeline)
LiDAR outputs feed localization, tracking, prediction, and planning. Scan matching and map alignment help estimate ego-motion; tracked objects and their future states constrain safe trajectories.
In system terms, the handoff is typically perception -> tracking -> prediction -> planning, with localization and mapping (SLAM-like behavior) continuously supporting frame-consistent state estimation. LOAM-style framing is useful here: estimate motion from sequential scans while updating a map representation.

<figure class="interactive" id="scan-matching-icp-intuition">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Scan Matching Intuition</strong> - align two consecutive scans with iterative pose updates.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> ICP-like correspondence and incremental transform refinement.</p>
      <p><em>User inputs:</em> Initial pose offset sliders, iteration step button, auto-run toggle.</p>
      <p><em>Outputs:</em> Alignment error curve and current transform estimate.</p>
      <p><em>Acceptance criteria:</em> Learner identifies local minima risk and dependency on initialization.</p>
      <p><em>Suggested tech:</em> Three.js + why: 3D overlap quality is easiest to inspect interactively.</p>
      <p><em>Fallback:</em> Static iteration snapshots with residual values.</p>
    </details>
  </figcaption>
</figure>

<figure class="interactive" id="fusion-uncertainty-dashboard">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Interactive: Fusion Confidence Mixer</strong> - combine LiDAR, camera, and radar confidence under weather/lighting shifts.
    <details>
      <summary>Activity spec</summary>
      <p><em>Concept:</em> Complementarity and uncertainty-aware fusion.</p>
      <p><em>User inputs:</em> Weather, lighting, and sensor reliability sliders.</p>
      <p><em>Outputs:</em> Fused object confidence bars and per-sensor uncertainty indicators.</p>
      <p><em>Acceptance criteria:</em> Learner justifies why multi-sensor fusion is preferred over single-modality reliance.</p>
      <p><em>Suggested tech:</em> D3 + why: uncertainty bars and scenario toggles are chart-centric.</p>
      <p><em>Fallback:</em> Static decision table across conditions (day/night/rain/fog).</p>
    </details>
  </figcaption>
</figure>

Eye-safety sidebar: many automotive LiDAR products are designed as Class 1 systems under relevant laser safety frameworks. Conceptually, safety depends on wavelength, emitted power profile, beam divergence, exposure duration, and classification limits. Treat this as high-level context, not design compliance advice.

### Suggested image prompts
1. “Isometric vector diagram of a rooftop LiDAR on a sedan, clean white + charcoal background, cyan accent (#00c6ff), labeled axes X-red Y-green Z-blue, thin leader lines, no motion blur.”
2. “Side-view schematic of ToF round-trip pulse path to a wall, dashed outbound and solid return beam, stopwatch icon, minimal palette navy/cyan/light gray, textbook annotation style.”
3. “Polar scan fan visualization with azimuth/elevation arcs, channel lines evenly spaced, dark canvas theme, crisp geometric labels, engineering infographic style.”
4. “Comparison panel: dense vs sparse point sampling on same street scene, identical camera viewpoint, points rendered as circular dots, subtle depth fade, no photoreal textures.”
5. “Coordinate frame transformation figure: sensor frame to vehicle frame to world frame, right-hand rule glyphs, matrix callout box, clean sans labels, consistent axis color convention.”
6. “Occlusion explainer with foreground truck hiding pedestrian points, top-down ray traces, visible hits highlighted cyan, occluded zone shaded gray hatch.”
7. “Reflectivity comparison chart scene: matte black object vs retroreflective sign under equal range, intensity legend bar, diagrammatic style with simple geometry.”
8. “Motion distortion strip: vehicle moving while scan sweeps, skewed building outline with timestamp ticks, before/after correction mini-panels.”
9. “Ground removal concept art in point cloud, pavement points in muted gray, obstacle points cyan/orange, threshold slider annotation.”
10. “BEV pillarization pipeline graphic, point cloud to grid cells to feature tensor blocks, flat vector style, arrows with numbered steps.”
11. “LiDAR-camera-radar fusion dashboard mockup, three uncertainty gauges feeding one fused object list, consistent icon family, high-contrast readable labels.”
12. “Autonomy pipeline overview: perception to tracking to prediction to planning, horizontal flowchart with small data artifact examples at each stage.”
13. “KITTI-like sensor rig diagram showing camera array and LiDAR placement, synchronized timestamp icon, minimal vehicle silhouette.”
14. “LOAM-inspired scan-to-map alignment concept, two colored scans with transform arrows, residual error callout, clean grid background.”
15. “Laser safety conceptual panel showing beam divergence cones and exposure duration timeline, neutral educational tone, no compliance claims.”

## 9. References
[1] Velodyne, *HDL-32E User’s Manual*, ToF operation, 905 nm Class 1 framing, scan geometry and data output details. https://www.mapix.com/wp-content/uploads/2018/07/63-9113_Rev-H_HDL-32E-User-Manual.pdf

[2] Velodyne, *VLP-16 User Manual*. https://www.amtechs.co.jp/product/VLP-16/manual/VLP-16_Manual.pdf

[3] Ouster, *Sensor Docs: Coordinate Frames and XYZ Calculation*. https://static.ouster.dev/sensor-docs/

[4] Ouster, *OS2 Datasheet* (resolution, range targets, environmental specs). https://ouster.com/products/hardware/os2-lidar-sensor

[5] A. Geiger, P. Lenz, R. Urtasun, “Are we ready for Autonomous Driving? The KITTI Vision Benchmark Suite,” CVPR 2012. https://www.cvlibs.net/publications/Geiger2012CVPR.pdf

[6] J. Zhang, S. Singh, “LOAM: Lidar Odometry and Mapping in Real-time,” RSS 2014. https://www.roboticsproceedings.org/rss10/p07.pdf

[7] A. H. Lang et al., “PointPillars: Fast Encoders for Object Detection from Point Clouds,” CVPR 2019. https://openaccess.thecvf.com/content_CVPR_2019/papers/Lang_PointPillars_Fast_Encoders_for_Object_Detection_From_Point_Clouds_CVPR_2019_paper.pdf

[8] U.S. FDA, *Laser Products and Instruments: Classification and Safety* (Class 1 conceptual guidance). https://www.fda.gov/radiation-emitting-products/home-business-and-entertainment-products/laser-products-and-instruments

[9] IEC/AS-NZS 60825.1 family overview pages (laser classification framework context). https://webstore.iec.ch/publication/3587

[10] ROS Wiki, *velodyne_driver* and Ouster ROS package docs (practical integration context). http://wiki.ros.org/velodyne_driver and https://github.com/ouster-lidar/ouster-ros

---

## DELIVERABLE B - ASSET CHECKLIST TABLE (images, 3D models, datasets, JS modules)

| Asset | Purpose | Format | Source/Generation method | Est. effort | Notes |
|---|---|---|---|---|---|
| Hero architecture illustration | Set visual context for article | SVG/PNG | Generate from prompt #1 | 2 h | Keep axis color standard |
| ToF diagrams set | Explain round-trip timing | SVG | Generate prompts #2, #15 + manual labels | 2 h | Reused in fallback mode |
| Scan geometry diagrams | Explain channels/FOV/resolution | SVG | Prompt #3 + manual annotation | 2 h | Must match interactive labels |
| Coordinate frame sheets | Support transforms section | SVG | Prompt #5 + technical review | 2 h | Right-hand rule check required |
| Occlusion/intensity figures | Show missing returns behavior | SVG/PNG | Prompts #6, #7 | 2 h | Include legend for accessibility |
| Motion distortion figure | Explain sweep skew | SVG | Prompt #8 | 1.5 h | Pair with LOAM reference |
| BEV pipeline graphic | Bridge to PointPillars framing | SVG | Prompt #10 | 1.5 h | Keep tensor terms high-level |
| Fusion pipeline graphic | Show modality complementarity | SVG | Prompt #11, #12 | 2 h | Add uncertainty legend |
| Icon set | UI controls and callouts | SVG sprite | Custom minimal icon pack | 1 h | Keyboard-focus friendly |
| CSS theme tokens | Consistent palette/spacing/typography | CSS | Hand-authored design tokens | 1 h | Include high-contrast variant |
| Synthetic point cloud: street_basic | Interactives baseline sample | JSON | Scripted generator (`data/street_basic.json`) | 2 h | <200 KB |
| Synthetic point cloud: occlusion_scene | Occlusion demo scenario | JSON | Scripted generator | 1.5 h | Include object IDs |
| Synthetic point cloud: motion_sweep | Distortion demo sequence | JSON | Scripted frames | 2 h | Include per-point timestamps |
| Interactive module: ToF basics | Mount `tof-roundtrip-basics` | JS ES module | Hand-coded | 2 h | Canvas renderer |
| Interactive module: precision budget | Mount `tof-precision-budget` | JS ES module | Hand-coded | 2 h | D3 dependency optional |
| Interactive module: scan geometry set | Mount section 3 interactives | JS ES module | Hand-coded | 3 h | Shared math helper |
| Interactive module: transforms set | Mount section 4 interactives | JS ES module | Hand-coded | 3 h | Three.js orbit controls |
| Interactive module: cloud behavior set | Mount section 5 interactives | JS ES module | Hand-coded | 3 h | Include fallback cards |
| Interactive module: calibration set | Mount section 6 interactives | JS ES module | Hand-coded | 3 h | Honor global pause state |
| Interactive module: perception set | Mount section 7 interactives | JS ES module | Hand-coded | 3 h | Reuse BEV raster helper |
| Interactive module: pipeline set | Mount section 8 interactives | JS ES module | Hand-coded | 3 h | Chart rendering + scenario presets |
| Test page: no-js fallback | Verify degraded mode | HTML | Manual test harness | 1 h | Screenshot for documentation |
| Test page: reduced-motion | Verify pause/reduced motion | HTML | Manual test harness | 1 h | WCAG motion checks |

---

## DELIVERABLE C - IMPLEMENTATION + EMBEDDING NOTES (static site + Moodle)

### Suggested file structure

```text
/
  index.html
  styles.css
  main.js
  /interactives
    tof-roundtrip-basics.js
    tof-precision-budget.js
    scan-azimuth-elevation-grid.js
    fov-coverage-tradeoff.js
    polar-to-cartesian-converter.js
    extrinsic-transform-playground.js
    occlusion-ray-demo.js
    intensity-material-contrast.js
    noise-bias-separator.js
    motion-distortion-sweep.js
    ground-removal-threshold.js
    bev-pillarizer.js
    scan-matching-icp-intuition.js
    fusion-uncertainty-dashboard.js
  /data
    street_basic.json
    occlusion_scene.json
    motion_sweep.json
```

### Minimal working code (no build step; ES modules)

`index.html`

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LiDAR Explainer</title>
  <link rel="stylesheet" href="./styles.css" />
</head>
<body>
  <header class="topbar">
    <h1>LiDAR Explainer</h1>
    <button id="pause-all" aria-pressed="false" aria-label="Pause animations">Pause animations</button>
  </header>

  <main id="article">
    <!-- Paste/render DELIVERABLE A content here or server-render Markdown to HTML -->
  </main>

  <noscript>
    <p>This page includes interactive demos. JavaScript is disabled, so static fallbacks are shown.</p>
  </noscript>

  <script type="module" src="./main.js"></script>
</body>
</html>
```

`styles.css`

```css
:root {
  --bg: #0f0f0f;
  --fg: #d4d4d4;
  --accent: #00c6ff;
  --x-axis: #ff4d4d;
  --y-axis: #3ad16f;
  --z-axis: #4da3ff;
}

body { background: var(--bg); color: var(--fg); margin: 0; font: 16px/1.55 "Segoe UI", sans-serif; }
.topbar { position: sticky; top: 0; display: flex; justify-content: space-between; padding: 0.75rem 1rem; background: #111; }
.interactive-shell { min-height: 280px; border: 1px solid #2a2a2a; border-radius: 8px; padding: 0.5rem; }
button:focus-visible, input:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}

body.high-contrast { --bg: #000; --fg: #fff; --accent: #66e0ff; }
```

`main.js`

```js
const registry = {
  "tof-roundtrip-basics": () => import("./interactives/tof-roundtrip-basics.js"),
  "tof-precision-budget": () => import("./interactives/tof-precision-budget.js"),
  "scan-azimuth-elevation-grid": () => import("./interactives/scan-azimuth-elevation-grid.js"),
  "fov-coverage-tradeoff": () => import("./interactives/fov-coverage-tradeoff.js"),
  "polar-to-cartesian-converter": () => import("./interactives/polar-to-cartesian-converter.js"),
  "extrinsic-transform-playground": () => import("./interactives/extrinsic-transform-playground.js"),
  "occlusion-ray-demo": () => import("./interactives/occlusion-ray-demo.js"),
  "intensity-material-contrast": () => import("./interactives/intensity-material-contrast.js"),
  "noise-bias-separator": () => import("./interactives/noise-bias-separator.js"),
  "motion-distortion-sweep": () => import("./interactives/motion-distortion-sweep.js"),
  "ground-removal-threshold": () => import("./interactives/ground-removal-threshold.js"),
  "bev-pillarizer": () => import("./interactives/bev-pillarizer.js"),
  "scan-matching-icp-intuition": () => import("./interactives/scan-matching-icp-intuition.js"),
  "fusion-uncertainty-dashboard": () => import("./interactives/fusion-uncertainty-dashboard.js")
};

const state = { paused: false };

document.getElementById("pause-all")?.addEventListener("click", (e) => {
  state.paused = !state.paused;
  e.currentTarget.setAttribute("aria-pressed", String(state.paused));
  window.dispatchEvent(new CustomEvent("lidar:pause-changed", { detail: state.paused }));
});

const observer = new IntersectionObserver(async (entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const id = entry.target.id;
    const loader = registry[id];
    if (!loader || entry.target.dataset.mounted) continue;
    const mod = await loader();
    mod.mount?.(entry.target.querySelector(".interactive-shell"), state);
    entry.target.dataset.mounted = "true";
  }
}, { rootMargin: "300px" });

document.querySelectorAll("figure.interactive").forEach((el) => observer.observe(el));
```

`interactives/tof-roundtrip-basics.js`

```js
export function mount(root, state) {
  const out = document.createElement("p");
  const input = document.createElement("input");
  const reset = document.createElement("button");
  input.type = "range";
  input.min = "10";
  input.max = "300";
  input.value = "67"; // ns
  input.setAttribute("aria-label", "Round-trip delay in nanoseconds");
  reset.textContent = "Reset";

  const render = () => {
    const t = Number(input.value) * 1e-9;
    const d = 299792458 * t / 2;
    out.textContent = `Delay: ${input.value} ns | Distance: ${d.toFixed(2)} m | Paused: ${state.paused}`;
  };

  reset.addEventListener("click", () => {
    input.value = "67";
    render();
  });
  input.addEventListener("input", render);
  window.addEventListener("lidar:pause-changed", render);

  root.append(input, reset, out);
  render();
}
```

Performance and reliability constraints:
- Keep total first-load JS under 2 MB excluding CDN libraries.
- Use lazy-loading per interactive via intersection observer.
- Target 60 fps on desktop for point rendering scenes; clamp point count on mobile.
- Provide graceful fallback cards for WebGL failure or JS disabled.
- Add per-interactive `Reset` button and global pause handling.

Accessibility requirements:
- All sliders/buttons keyboard operable with visible focus.
- ARIA labels on controls and status text for numeric outputs.
- Respect `prefers-reduced-motion` and global pause state.
- High-contrast token variant (`body.high-contrast`).

### Static-site embedding notes
1. Keep Markdown content and interactive runtime separate: content in article HTML/MD, behavior in `/interactives/*.js`.
2. Use deterministic IDs exactly matching placeholders for reliable mounting.
3. If using Hugo, place scripts under `static/` and mount in a partial; avoid bundling requirement.
4. Optional build step: Vite for dependency optimization only; keep plain ES module path as default.

### Moodle embedding notes
Approach 1: Page/Book + hosted static assets
- Host assets on your trusted domain and embed the page via iframe or direct link where policy permits.
- If inline JS is restricted, use iframe embedding to isolate runtime.
- Keep a static fallback version for restrictive filters.

Approach 2: H5P recreation for selected interactives
- Best H5P candidates: `tof-roundtrip-basics`, `tof-precision-budget`, `scan-azimuth-elevation-grid`, `fusion-uncertainty-dashboard` (slider + feedback heavy).
- Keep custom JS for 3D-heavy modules: `polar-to-cartesian-converter`, `motion-distortion-sweep`, `scan-matching-icp-intuition`.
- Use Content Bank so updates propagate through shortcuts where supported.

Moodle admin/teacher checklist:
- H5P enabled in Content Bank.
- Display H5P filter enabled for embedded rendering.
- Trusted content/iframe policy reviewed for external JS hosting.
- File-size budgets enforced (compress images, JSON, and JS modules).
- Mobile testing completed in target Moodle theme.

---

## DELIVERABLE D - WIREFRAMES (desktop + mobile)

### Desktop wireframe

```text
+--------------------------------------------------------------------------------+
| Header: Title | author/date/tags | [Pause animations]                         |
+-----------------------------+--------------------------------------------------+
| Sticky TOC (240px)          | Main content column (max 760px)                |
| - Executive summary         | [Section heading]                               |
| - ToF                       | Paragraphs (short, 2-4 lines)                  |
| - Scanning                  | [Interactive figure ~100% of text width]       |
| - XYZ transforms            | [Callout: misconception]                        |
| - Point clouds              | [Code snippet]                                  |
| - Errors/calibration        | [Interactive figure]                            |
| - Detection/BEV             | ...                                             |
| - Pipeline                  |                                                 |
| - References                |                                                 |
+-----------------------------+--------------------------------------------------+
| Footer: references, license, source links                                     |
+--------------------------------------------------------------------------------+
Annotations: interactive shells target 680-760px width; callouts use left border accent; axis colors fixed globally.
```

### Mobile wireframe

```text
+-----------------------------------------+
| Header (stacked)                        |
| Title                                   |
| [Pause animations] [TOC toggle]         |
+-----------------------------------------+
| Collapsible TOC (accordion)             |
+-----------------------------------------+
| Single-column content (92-94vw)         |
| Short paragraph blocks                  |
| Interactive shell (min-height ~220px)   |
| Controls in 1-2 rows, touch targets 44px|
| Reset button always visible             |
| Fallback card shown on WebGL fail       |
+-----------------------------------------+
| References and next reading links       |
+-----------------------------------------+
Annotations: reduce default point count on mobile; defer offscreen interactive modules; avoid continuous animation unless user starts it.
```

