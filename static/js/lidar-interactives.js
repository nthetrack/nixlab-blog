(function () {
  "use strict";

  var SPEED_OF_LIGHT = 299792458; // m/s
  var DEFAULT_DELAY_NS = 66.7;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function nsToOneWayMeters(delayNs) {
    return (SPEED_OF_LIGHT * delayNs * 1e-9) / 2;
  }

  function metersToRoundTripNs(distanceMeters) {
    return ((2 * distanceMeters) / SPEED_OF_LIGHT) * 1e9;
  }

  function formatNumber(value, digits) {
    return Number(value).toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) {
      el.className = className;
    }
    if (typeof text === "string") {
      el.textContent = text;
    }
    return el;
  }

  function mountRoundTripTimer(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") {
      return;
    }
    shell.dataset.mounted = "true";

    shell.innerHTML = "";

    var root = createEl("div", "lidar-rt");
    var canvasWrap = createEl("div", "lidar-rt__canvas-wrap");
    var canvas = createEl("canvas", "lidar-rt__canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvasWrap.appendChild(canvas);

    var controls = createEl("div", "lidar-rt__controls");
    var labelRow = createEl("div", "lidar-rt__label-row");
    var sliderLabel = createEl("label", "lidar-rt__label", "Round-trip delay (ns)");
    sliderLabel.htmlFor = "lidar-rt-delay";
    var sliderValue = createEl("output", "lidar-rt__value", "");
    sliderValue.id = "lidar-rt-delay-value";
    sliderValue.setAttribute("aria-live", "polite");
    labelRow.append(sliderLabel, sliderValue);

    var slider = createEl("input", "lidar-rt__slider");
    slider.type = "range";
    slider.id = "lidar-rt-delay";
    slider.min = "5";
    slider.max = "2000";
    slider.step = "0.1";
    slider.value = String(DEFAULT_DELAY_NS);
    slider.setAttribute("aria-label", "Round-trip delay in nanoseconds");

    var btnRow = createEl("div", "lidar-rt__buttons");
    var pulseBtn = createEl("button", "lidar-rt__button", "Pulse once");
    pulseBtn.type = "button";
    var resetBtn = createEl("button", "lidar-rt__button lidar-rt__button--ghost", "Reset");
    resetBtn.type = "button";

    var preset10 = createEl("button", "lidar-rt__chip", "10 m");
    var preset50 = createEl("button", "lidar-rt__chip", "50 m");
    var preset100 = createEl("button", "lidar-rt__chip", "100 m");
    preset10.type = "button";
    preset50.type = "button";
    preset100.type = "button";

    btnRow.append(pulseBtn, resetBtn, preset10, preset50, preset100);

    var readout = createEl("div", "lidar-rt__readout");
    readout.setAttribute("aria-live", "polite");

    controls.append(labelRow, slider, btnRow, readout);
    root.append(canvasWrap, controls);
    shell.appendChild(root);

    var ctx = canvas.getContext("2d");
    var state = {
      delayNs: DEFAULT_DELAY_NS,
      beamProgress: 0,
      beamAnimating: false,
      beamDurationMs: 1500,
      pulseStartedAt: 0,
      reduceMotion: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    };

    function updateReadout() {
      var delay = state.delayNs;
      var oneWayMeters = nsToOneWayMeters(delay);
      var roundTripMeters = oneWayMeters * 2;
      var noHalfMeters = SPEED_OF_LIGHT * delay * 1e-9;
      sliderValue.value = formatNumber(delay, 1) + " ns";
      readout.innerHTML =
        "<div><strong>One-way distance:</strong> " + formatNumber(oneWayMeters, 2) + " m</div>" +
        "<div><strong>Round-trip path:</strong> " + formatNumber(roundTripMeters, 2) + " m</div>" +
        "<div><strong>If you forget /2:</strong> " + formatNumber(noHalfMeters, 2) + " m (2x too large)</div>";
    }

    function setDelayNs(newDelayNs) {
      state.delayNs = clamp(Number(newDelayNs) || DEFAULT_DELAY_NS, 5, 2000);
      slider.value = String(state.delayNs);
      updateReadout();
      draw();
    }

    function setPresetDistance(distanceMeters) {
      setDelayNs(metersToRoundTripNs(distanceMeters));
    }

    function resizeCanvas() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(320, canvasWrap.clientWidth);
      var height = 220;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    function linePoint(ax, ay, bx, by, t) {
      return {
        x: ax + (bx - ax) * t,
        y: ay + (by - ay) * t
      };
    }

    function draw() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      var leftX = w * 0.14;
      var rightX = w * 0.86;
      var y = h * 0.54;

      var sensorRadius = 14;
      var wallWidth = 16;
      var wallTop = y - 52;
      var wallBottom = y + 52;

      ctx.fillStyle = "#0b1218";
      ctx.fillRect(0, 0, w, h);

      // Guide line
      ctx.strokeStyle = "rgba(212, 212, 212, 0.22)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
      ctx.stroke();

      // Sensor
      ctx.fillStyle = "#00c6ff";
      ctx.beginPath();
      ctx.arc(leftX, y, sensorRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#081118";
      ctx.beginPath();
      ctx.arc(leftX, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Target
      ctx.fillStyle = "#283847";
      ctx.fillRect(rightX - wallWidth / 2, wallTop, wallWidth, wallBottom - wallTop);
      ctx.fillStyle = "#9cb0bf";
      ctx.fillRect(rightX - 2, wallTop, 4, wallBottom - wallTop);

      // Beam animation (visual time not to scale).
      if (state.beamAnimating) {
        var p = state.beamProgress;
        var beamX;
        if (p <= 0.5) {
          beamX = linePoint(leftX, y, rightX, y, p * 2).x;
        } else {
          beamX = linePoint(rightX, y, leftX, y, (p - 0.5) * 2).x;
        }

        ctx.strokeStyle = "rgba(0, 198, 255, 0.95)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (p <= 0.5) {
          ctx.moveTo(leftX, y);
          ctx.lineTo(beamX, y);
        } else {
          ctx.moveTo(rightX, y);
          ctx.lineTo(beamX, y);
        }
        ctx.stroke();

        ctx.fillStyle = "#7fe6ff";
        ctx.beginPath();
        ctx.arc(beamX, y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#d4d4d4";
      ctx.font = "12px Segoe UI, sans-serif";
      ctx.fillText("Sensor", leftX - 19, y + 34);
      ctx.fillText("Target", rightX - 16, y + 34);
      ctx.fillStyle = "rgba(212, 212, 212, 0.7)";
      ctx.fillText("Visualization timing is illustrative (not nanosecond scale).", 12, h - 12);
    }

    function pulseOnce() {
      state.beamAnimating = true;
      state.beamProgress = 0;
      state.pulseStartedAt = performance.now();
      state.beamDurationMs = clamp(800 + state.delayNs * 0.8, 900, 2600);
      requestAnimationFrame(tick);
    }

    function tick(now) {
      if (!state.beamAnimating) {
        return;
      }
      var elapsed = now - state.pulseStartedAt;
      state.beamProgress = clamp(elapsed / state.beamDurationMs, 0, 1);
      draw();
      if (state.beamProgress >= 1) {
        state.beamAnimating = false;
        state.beamProgress = 0;
        draw();
        return;
      }
      requestAnimationFrame(tick);
    }

    slider.addEventListener("input", function () {
      setDelayNs(slider.value);
    });

    pulseBtn.addEventListener("click", function () {
      pulseOnce();
    });

    resetBtn.addEventListener("click", function () {
      setDelayNs(DEFAULT_DELAY_NS);
      state.beamAnimating = false;
      state.beamProgress = 0;
      draw();
    });

    preset10.addEventListener("click", function () {
      setPresetDistance(10);
      pulseOnce();
    });

    preset50.addEventListener("click", function () {
      setPresetDistance(50);
      pulseOnce();
    });

    preset100.addEventListener("click", function () {
      setPresetDistance(100);
      pulseOnce();
    });

    if (window.ResizeObserver) {
      var observer = new ResizeObserver(resizeCanvas);
      observer.observe(canvasWrap);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }

    setDelayNs(DEFAULT_DELAY_NS);
    resizeCanvas();
    if (!state.reduceMotion) {
      pulseOnce();
    }
  }

  function mountBeamGridBuilder(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") {
      return;
    }
    shell.dataset.mounted = "true";

    shell.innerHTML = "";

    var root = createEl("div", "lidar-grid");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap");
    var canvas = createEl("canvas", "lidar-grid__canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvasWrap.appendChild(canvas);

    var controls = createEl("div", "lidar-grid__controls");
    var controlsHeader = createEl("div", "lidar-grid__controls-title", "Sampling Controls");

    var channelsLabel = createEl("label", "lidar-grid__label", "Channels (vertical beams)");
    var channelsValue = createEl("output", "lidar-grid__value", "");
    var channels = createEl("input", "lidar-grid__slider");
    channels.type = "range";
    channels.min = "8";
    channels.max = "128";
    channels.step = "1";
    channels.value = "32";
    channels.setAttribute("aria-label", "Channel count");

    var azLabel = createEl("label", "lidar-grid__label", "Azimuth step (degrees)");
    var azValue = createEl("output", "lidar-grid__value", "");
    var azimuth = createEl("input", "lidar-grid__slider");
    azimuth.type = "range";
    azimuth.min = "0.05";
    azimuth.max = "1.00";
    azimuth.step = "0.05";
    azimuth.value = "0.20";
    azimuth.setAttribute("aria-label", "Azimuth step size in degrees");

    var hzLabel = createEl("label", "lidar-grid__label", "Scan rate (Hz)");
    var hzValue = createEl("output", "lidar-grid__value", "");
    var scanRate = createEl("input", "lidar-grid__slider");
    scanRate.type = "range";
    scanRate.min = "5";
    scanRate.max = "20";
    scanRate.step = "1";
    scanRate.value = "10";
    scanRate.setAttribute("aria-label", "Scan rate in hertz");

    var btnRow = createEl("div", "lidar-grid__buttons");
    var resetBtn = createEl("button", "lidar-grid__button lidar-grid__button--ghost", "Reset");
    resetBtn.type = "button";
    var denseBtn = createEl("button", "lidar-grid__button", "Dense preset");
    denseBtn.type = "button";
    var sparseBtn = createEl("button", "lidar-grid__button", "Sparse preset");
    sparseBtn.type = "button";
    btnRow.append(resetBtn, denseBtn, sparseBtn);

    var readout = createEl("div", "lidar-grid__readout");
    readout.setAttribute("aria-live", "polite");

    function controlRow(labelEl, valueEl, inputEl) {
      var row = createEl("div", "lidar-grid__row");
      var top = createEl("div", "lidar-grid__label-row");
      top.append(labelEl, valueEl);
      row.append(top, inputEl);
      return row;
    }

    controls.append(
      controlsHeader,
      controlRow(channelsLabel, channelsValue, channels),
      controlRow(azLabel, azValue, azimuth),
      controlRow(hzLabel, hzValue, scanRate),
      btnRow,
      readout
    );

    root.append(canvasWrap, controls);
    shell.appendChild(root);

    var ctx = canvas.getContext("2d");
    var state = {
      channels: 32,
      azimuthStepDeg: 0.2,
      scanRateHz: 10
    };

    function totalAzimuthBins(stepDeg) {
      return Math.max(1, Math.round(360 / stepDeg));
    }

    function pointsPerFrame() {
      return state.channels * totalAzimuthBins(state.azimuthStepDeg);
    }

    function pointsPerSecond() {
      return pointsPerFrame() * state.scanRateHz;
    }

    function draw() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0b1218";
      ctx.fillRect(0, 0, w, h);

      var centerX = w * 0.34;
      var centerY = h * 0.52;
      var radius = Math.min(w * 0.28, h * 0.38);

      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      var rings = 4;
      for (var r = 1; r < rings; r += 1) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius * r) / rings, 0, Math.PI * 2);
        ctx.stroke();
      }

      var displayedChannels = clamp(state.channels, 2, 32);
      var stepRad = (state.azimuthStepDeg * Math.PI) / 180;
      var azimuthBins = totalAzimuthBins(state.azimuthStepDeg);
      var displayBins = clamp(Math.round(azimuthBins / 18), 8, 96);

      for (var c = 0; c < displayedChannels; c += 1) {
        var yOffset = ((c / (displayedChannels - 1 || 1)) - 0.5) * (radius * 0.55);
        for (var b = 0; b < displayBins; b += 1) {
          var a = b * stepRad * (azimuthBins / displayBins);
          var px = centerX + Math.cos(a) * (radius + yOffset * 0.1);
          var py = centerY + Math.sin(a) * (radius + yOffset * 0.1) + yOffset;
          ctx.fillStyle = "rgba(0,198,255,0.82)";
          ctx.fillRect(px, py, 1.8, 1.8);
        }
      }

      var barLeft = w * 0.67;
      var barTop = h * 0.24;
      var barW = w * 0.22;
      var barH = 16;

      var pps = pointsPerSecond();
      var ppsNorm = clamp(pps / 1200000, 0, 1);

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(barLeft, barTop, barW, barH);
      ctx.fillStyle = "rgba(0,198,255,0.95)";
      ctx.fillRect(barLeft, barTop, barW * ppsNorm, barH);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.strokeRect(barLeft, barTop, barW, barH);

      ctx.fillStyle = "#d4d4d4";
      ctx.font = "12px Segoe UI, sans-serif";
      ctx.fillText("Relative point throughput", barLeft, barTop - 8);
      ctx.fillStyle = "rgba(212, 212, 212, 0.75)";
      ctx.fillText("Polar sample map (illustrative)", centerX - 58, h - 14);
    }

    function resizeCanvas() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(320, canvasWrap.clientWidth);
      var height = 260;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    function updateReadout() {
      channelsValue.value = String(state.channels);
      azValue.value = formatNumber(state.azimuthStepDeg, 2) + " deg";
      hzValue.value = String(state.scanRateHz) + " Hz";

      var azBins = totalAzimuthBins(state.azimuthStepDeg);
      var frame = pointsPerFrame();
      var second = pointsPerSecond();
      var spacingAt50m = (50 * state.azimuthStepDeg * Math.PI) / 180;

      readout.innerHTML =
        "<div><strong>Azimuth bins per revolution:</strong> " + formatNumber(azBins, 0) + "</div>" +
        "<div><strong>Points per revolution:</strong> " + formatNumber(frame, 0) + "</div>" +
        "<div><strong>Points per second:</strong> " + formatNumber(second, 0) + "</div>" +
        "<div><strong>Lateral spacing at 50 m:</strong> ~" + formatNumber(spacingAt50m, 2) + " m between rays</div>";
      draw();
    }

    function setState(next) {
      state.channels = clamp(Number(next.channels), 8, 128);
      state.azimuthStepDeg = clamp(Number(next.azimuthStepDeg), 0.05, 1);
      state.scanRateHz = clamp(Number(next.scanRateHz), 5, 20);
      channels.value = String(state.channels);
      azimuth.value = String(state.azimuthStepDeg);
      scanRate.value = String(state.scanRateHz);
      updateReadout();
    }

    channels.addEventListener("input", function () {
      setState({
        channels: channels.value,
        azimuthStepDeg: state.azimuthStepDeg,
        scanRateHz: state.scanRateHz
      });
    });

    azimuth.addEventListener("input", function () {
      setState({
        channels: state.channels,
        azimuthStepDeg: azimuth.value,
        scanRateHz: state.scanRateHz
      });
    });

    scanRate.addEventListener("input", function () {
      setState({
        channels: state.channels,
        azimuthStepDeg: state.azimuthStepDeg,
        scanRateHz: scanRate.value
      });
    });

    resetBtn.addEventListener("click", function () {
      setState({ channels: 32, azimuthStepDeg: 0.2, scanRateHz: 10 });
    });

    denseBtn.addEventListener("click", function () {
      setState({ channels: 64, azimuthStepDeg: 0.1, scanRateHz: 15 });
    });

    sparseBtn.addEventListener("click", function () {
      setState({ channels: 16, azimuthStepDeg: 0.8, scanRateHz: 8 });
    });

    if (window.ResizeObserver) {
      var observer = new ResizeObserver(resizeCanvas);
      observer.observe(canvasWrap);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }

    setState({ channels: 32, azimuthStepDeg: 0.2, scanRateHz: 10 });
    resizeCanvas();
  }

  function mountCoverageResolution(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") {
      return;
    }
    shell.dataset.mounted = "true";
    shell.innerHTML = "";

    var root = createEl("div", "lidar-cov");
    var canvasWrap = createEl("div", "lidar-cov__canvas-wrap");
    var canvas = createEl("canvas", "lidar-cov__canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvasWrap.appendChild(canvas);

    var controls = createEl("div", "lidar-cov__controls");
    var readout = createEl("div", "lidar-cov__readout");
    readout.setAttribute("aria-live", "polite");

    function makeControl(label, min, max, step, value, aria) {
      var row = createEl("div", "lidar-cov__row");
      var top = createEl("div", "lidar-cov__label-row");
      var lbl = createEl("label", "lidar-cov__label", label);
      var out = createEl("output", "lidar-cov__value", "");
      var input = createEl("input", "lidar-cov__slider");
      input.type = "range";
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(value);
      input.setAttribute("aria-label", aria);
      top.append(lbl, out);
      row.append(top, input);
      return { row: row, input: input, out: out };
    }

    var fovCtl = makeControl("Horizontal FOV (deg)", 20, 140, 1, 90, "Horizontal field of view in degrees");
    var stepCtl = makeControl("Angular step (deg)", 0.05, 1.5, 0.05, 0.35, "Angular step in degrees");
    var distCtl = makeControl("Object distance (m)", 10, 160, 1, 80, "Object distance in meters");
    var widthCtl = makeControl("Object width (m)", 0.1, 6, 0.1, 1.2, "Object width in meters");

    var btnRow = createEl("div", "lidar-cov__buttons");
    var resetBtn = createEl("button", "lidar-cov__button lidar-cov__button--ghost", "Reset");
    resetBtn.type = "button";
    var coarseBtn = createEl("button", "lidar-cov__button", "Coarse example");
    coarseBtn.type = "button";
    var fineBtn = createEl("button", "lidar-cov__button", "Fine example");
    fineBtn.type = "button";
    btnRow.append(resetBtn, coarseBtn, fineBtn);

    controls.append(fovCtl.row, stepCtl.row, distCtl.row, widthCtl.row, btnRow, readout);
    root.append(canvasWrap, controls);
    shell.appendChild(root);

    var ctx = canvas.getContext("2d");
    var state = {
      fovDeg: 90,
      stepDeg: 0.35,
      distanceM: 80,
      widthM: 1.2
    };

    function visibleWidthAtDistance(distanceM, fovDeg) {
      return 2 * distanceM * Math.tan((fovDeg * Math.PI) / 360);
    }

    function raySpacingAtDistance(distanceM, stepDeg) {
      return 2 * distanceM * Math.tan((stepDeg * Math.PI) / 360);
    }

    function drawScene(x, y, w, h, sparseMode) {
      ctx.fillStyle = "#0b1218";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.strokeRect(x, y, w, h);

      var sx = x + w * 0.14;
      var sy = y + h * 0.52;
      var tx = x + w * 0.85;

      // Sensor
      ctx.fillStyle = "#00c6ff";
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fill();

      // Object width mapped to panel scale.
      var span = visibleWidthAtDistance(state.distanceM, state.fovDeg);
      var pxPerMeter = (w * 0.68) / Math.max(span, 0.001);
      var objPx = Math.max(2, state.widthM * pxPerMeter);
      var objH = 36;
      var objLeft = tx - objPx / 2;
      var objTop = sy - objH / 2;
      ctx.fillStyle = "rgba(255,170,64,0.88)";
      ctx.fillRect(objLeft, objTop, objPx, objH);

      // Rays
      var rawBins = Math.floor(state.fovDeg / state.stepDeg) + 1;
      var drawBins = sparseMode ? Math.min(rawBins, 140) : Math.min(rawBins * 2, 260);
      var start = -state.fovDeg / 2;
      var step = state.fovDeg / Math.max(drawBins - 1, 1);
      var hits = 0;

      for (var i = 0; i < drawBins; i += 1) {
        var a = (start + i * step) * (Math.PI / 180);
        var ex = sx + Math.cos(a) * (w * 0.75);
        var ey = sy + Math.sin(a) * (h * 0.45);

        // Intersect with target plane at tx
        var t = (tx - sx) / Math.max(ex - sx, 1e-6);
        if (t > 0 && t <= 1.6) {
          var iy = sy + (ey - sy) * t;
          var hit = iy >= objTop && iy <= objTop + objH;
          if (hit) {
            hits += 1;
            ctx.strokeStyle = "rgba(0,198,255,0.9)";
            ctx.lineWidth = 1.4;
          } else {
            ctx.strokeStyle = "rgba(255,255,255,0.16)";
            ctx.lineWidth = 1;
          }
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(tx, iy);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "#d4d4d4";
      ctx.font = "11px Segoe UI, sans-serif";
      ctx.fillText(sparseMode ? "Coarse sampling view" : "Finer sampling view", x + 10, y + 16);

      var label = hits > 0 ? hits + " ray hit(s)" : "no hits";
      ctx.fillStyle = hits > 0 ? "#79e8ff" : "#ff9a9a";
      ctx.fillText(label, x + 10, y + h - 10);
      return hits;
    }

    function draw() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0a1016";
      ctx.fillRect(0, 0, w, h);

      var gap = 10;
      var paneW = (w - gap * 3) / 2;
      var paneH = h - 20;
      var leftHits = drawScene(gap, 10, paneW, paneH, true);
      var rightHits = drawScene(gap * 2 + paneW, 10, paneW, paneH, false);

      return { leftHits: leftHits, rightHits: rightHits };
    }

    function resizeCanvas() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var width = Math.max(320, canvasWrap.clientWidth);
      var height = 240;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      update();
    }

    function updateControls() {
      fovCtl.out.value = formatNumber(state.fovDeg, 0) + " deg";
      stepCtl.out.value = formatNumber(state.stepDeg, 2) + " deg";
      distCtl.out.value = formatNumber(state.distanceM, 0) + " m";
      widthCtl.out.value = formatNumber(state.widthM, 1) + " m";
      fovCtl.input.value = String(state.fovDeg);
      stepCtl.input.value = String(state.stepDeg);
      distCtl.input.value = String(state.distanceM);
      widthCtl.input.value = String(state.widthM);
    }

    function setState(next) {
      state.fovDeg = clamp(Number(next.fovDeg), 20, 140);
      state.stepDeg = clamp(Number(next.stepDeg), 0.05, 1.5);
      state.distanceM = clamp(Number(next.distanceM), 10, 160);
      state.widthM = clamp(Number(next.widthM), 0.1, 6);
      updateControls();
      update();
    }

    function update() {
      var hits = draw();
      var spacing = raySpacingAtDistance(state.distanceM, state.stepDeg);
      var bins = Math.floor(state.fovDeg / state.stepDeg) + 1;
      var likelyMiss = spacing > state.widthM;
      readout.innerHTML =
        "<div><strong>Horizontal bins:</strong> " + formatNumber(bins, 0) + "</div>" +
        "<div><strong>Ray spacing at " + formatNumber(state.distanceM, 0) + " m:</strong> ~" + formatNumber(spacing, 2) + " m</div>" +
        "<div><strong>Object width:</strong> " + formatNumber(state.widthM, 2) + " m</div>" +
        "<div><strong>Hit test:</strong> " +
        (likelyMiss && hits.leftHits === 0 ? "<span class=\"lidar-cov__warn\">Likely to drop between rays at coarse sampling.</span>" : "Object sampled by at least one ray.") +
        "</div>";
    }

    fovCtl.input.addEventListener("input", function () {
      setState({ fovDeg: fovCtl.input.value, stepDeg: state.stepDeg, distanceM: state.distanceM, widthM: state.widthM });
    });
    stepCtl.input.addEventListener("input", function () {
      setState({ fovDeg: state.fovDeg, stepDeg: stepCtl.input.value, distanceM: state.distanceM, widthM: state.widthM });
    });
    distCtl.input.addEventListener("input", function () {
      setState({ fovDeg: state.fovDeg, stepDeg: state.stepDeg, distanceM: distCtl.input.value, widthM: state.widthM });
    });
    widthCtl.input.addEventListener("input", function () {
      setState({ fovDeg: state.fovDeg, stepDeg: state.stepDeg, distanceM: state.distanceM, widthM: widthCtl.input.value });
    });

    resetBtn.addEventListener("click", function () {
      setState({ fovDeg: 90, stepDeg: 0.35, distanceM: 80, widthM: 1.2 });
    });
    coarseBtn.addEventListener("click", function () {
      setState({ fovDeg: 120, stepDeg: 1.0, distanceM: 100, widthM: 0.8 });
    });
    fineBtn.addEventListener("click", function () {
      setState({ fovDeg: 90, stepDeg: 0.1, distanceM: 100, widthM: 0.8 });
    });

    if (window.ResizeObserver) {
      var observer = new ResizeObserver(resizeCanvas);
      observer.observe(canvasWrap);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }

    setState({ fovDeg: 90, stepDeg: 0.35, distanceM: 80, widthM: 1.2 });
    resizeCanvas();
  }

  function mountInteractives() {
    var figure = document.getElementById("tof-roundtrip-basics");
    if (figure) {
      mountRoundTripTimer(figure);
    }
    var gridFigure = document.getElementById("scan-azimuth-elevation-grid");
    if (gridFigure) {
      mountBeamGridBuilder(gridFigure);
    }
    var covFigure = document.getElementById("fov-coverage-tradeoff");
    if (covFigure) {
      mountCoverageResolution(covFigure);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountInteractives);
  } else {
    mountInteractives();
  }
})();
