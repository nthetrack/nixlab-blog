---
title: "LiDAR, One Light Pulse at a Time"
author: "Nik Palmer"
date: "2026-02-14"
tags: ["lidar","autonomous-vehicles","robotics","perception","slam","sensor-fusion","point-clouds"]
draft: false
---

If you can, start with the demo below before reading anything else. Drag it around, bump the delay slider, and watch how quickly the distance estimate moves.

<figure class="interactive" id="tof-roundtrip-basics">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Round-Trip Timer</strong> - one light pulse out, one pulse back, one distance estimate.
  </figcaption>
</figure>

Most LiDAR explanations start at the system diagram level and immediately throw acronyms at you. I think that makes this feel harder than it needs to be.

At its core, LiDAR starts with a very small question:

How long did that pulse of light take to come back?

If the round-trip time is `t`, then distance is:

`d = (c * t) / 2`

That divide-by-two is the first thing people miss. The pulse traveled out and back, but we want one-way distance.

Once that clicks, a lot of the mystery disappears.

## One pulse is not a scene

A single distance reading is just a dot on an invisible line. Useful systems need thousands of those dots, every second, at different angles.

That is where scan geometry comes in: azimuth, elevation, channel layout, field of view, and scan rate.

<figure class="interactive" id="scan-azimuth-elevation-grid">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Beam Grid Builder</strong> - change channels and angular spacing to see how point count explodes (or collapses).
  </figcaption>
</figure>

If you have ever wondered what "points per second" really means, this is it: geometry multiplied by time.

Coarse angular spacing gives you broad coverage but misses detail. Tight spacing gives richer shape information but costs bandwidth and compute.

<figure class="interactive" id="fov-coverage-tradeoff">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Coverage vs Resolution</strong> - when a distant object gets small enough, it just drops between rays.
  </figcaption>
</figure>

## Turning angles into 3D points

Sensors usually report range plus direction, but robotics software wants coordinates in a shared frame.

So each measurement gets converted from spherical-like coordinates into Cartesian `(x, y, z)`, then transformed from sensor frame to vehicle frame, and sometimes again into a map/world frame.

<figure class="interactive" id="polar-to-cartesian-converter">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Polar to Cartesian Lab</strong> - move one measurement through azimuth/elevation and watch signs and axes flip.
  </figcaption>
</figure>

<figure class="interactive" id="extrinsic-transform-playground">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Extrinsic Transform Playground</strong> - small calibration errors create very visible misalignment.
  </figcaption>
</figure>

This is why calibration matters so much. People often treat it like a one-time setup chore. In practice, it is part of perception quality.

## Why point clouds feel "incomplete"

Point clouds are honest, but they are not complete.

They are sparse.
They are view-dependent.
They are full of occlusion.

A missing point does not always mean missing object. Sometimes a closer surface simply blocked the ray.

<figure class="interactive" id="occlusion-ray-demo">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Occlusion Explorer</strong> - move the sensor and watch hidden regions appear/disappear.
  </figcaption>
</figure>

Reflectivity adds another wrinkle. Bright return intensity is not "this object is important" and low intensity is not "there is nothing there." Surface properties and incidence angle matter.

<figure class="interactive" id="intensity-material-contrast">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Reflectivity Contrast</strong> - same shape, different material, very different return behavior.
  </figcaption>
</figure>

Some sensors can report multiple returns conceptually (for example first/strongest-return behavior), which helps in cluttered scenes but does not remove ambiguity.

## Bad days for LiDAR

Real roads are not lab conditions. Rain, fog, spray, dark surfaces, highly reflective materials, and crosstalk all change what comes back.

Then there is motion distortion: a scan is collected over time, not captured instantaneously. If the vehicle moves while a sweep is in progress, static structures can appear warped unless you compensate with motion estimates.

<figure class="interactive" id="motion-distortion-sweep">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Rolling Sweep Distortion</strong> - same scene, different ego-motion, different cloud shape.
  </figcaption>
</figure>

The practical takeaway is simple: treat every point as a measurement with uncertainty, not as ground truth.

## From dots to objects

Once you have a cloud, the autonomy stack still needs to answer human questions:

Where is the drivable space?
What are those objects?
Which ones are moving?
What matters now?

A common flow is:
1. remove or model ground,
2. cluster or segment remaining points,
3. convert to a structured representation like BEV,
4. detect and track objects.

<figure class="interactive" id="ground-removal-threshold">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Ground Removal Tuner</strong> - useful, but easy to overtune and erase low obstacles.
  </figcaption>
</figure>

<figure class="interactive" id="bev-pillarizer">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>BEV Pillarizer</strong> - turning irregular points into grid/pillar features that detectors can consume efficiently.
  </figcaption>
</figure>

This is the bridge to methods like PointPillars: not magic, just a practical way to impose structure on messy 3D data.

## And then: driving decisions

LiDAR does not drive the car by itself. It feeds a chain.

Perception -> tracking -> prediction -> planning.

Localization/mapping runs alongside this chain, constantly estimating where the vehicle is and how the world is changing around it.

<figure class="interactive" id="scan-matching-icp-intuition">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Scan Matching Intuition</strong> - why alignment quality depends heavily on initialization and scene structure.
  </figcaption>
</figure>

Sensor fusion is where LiDAR earns its place. Cameras give rich semantics. Radar handles velocity and hard weather better. LiDAR adds precise geometry.

Together they fail less often than any one of them alone.

<figure class="interactive" id="fusion-uncertainty-dashboard">
  <div class="interactive-shell">
    <!-- Placeholder: the runtime will mount here -->
  </div>
  <figcaption>
    <strong>Fusion Confidence Mixer</strong> - changing conditions shift which sensor should be trusted most.
  </figcaption>
</figure>

## Final thought

What looks like "a spinning laser" from outside is really a timing instrument, a geometry engine, and an uncertainty management problem all at once.

If you hold onto that mental model, most LiDAR design choices start to feel less like black magic and more like tradeoffs you can reason about.

## Further reading

- Velodyne HDL-32E User Manual: https://www.mapix.com/wp-content/uploads/2018/07/63-9113_Rev-H_HDL-32E-User-Manual.pdf
- Velodyne VLP-16 Manual: https://www.amtechs.co.jp/product/VLP-16/manual/VLP-16_Manual.pdf
- Ouster Sensor Docs (coordinate frames / XYZ): https://static.ouster.dev/sensor-docs/
- KITTI paper (Geiger et al., CVPR 2012): https://www.cvlibs.net/publications/Geiger2012CVPR.pdf
- LOAM (Zhang and Singh, RSS 2014): https://www.roboticsproceedings.org/rss10/p07.pdf
- PointPillars (Lang et al., CVPR 2019): https://openaccess.thecvf.com/content_CVPR_2019/papers/Lang_PointPillars_Fast_Encoders_for_Object_Detection_From_Point_Clouds_CVPR_2019_paper.pdf
- FDA laser classification overview (high-level): https://www.fda.gov/radiation-emitting-products/home-business-and-entertainment-products/laser-products-and-instruments
