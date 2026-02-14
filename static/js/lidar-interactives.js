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

  function mountPolarCartesian(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") {
      return;
    }
    shell.dataset.mounted = "true";
    shell.innerHTML = "";

    var root = createEl("div", "lidar-grid");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap");
    var canvas = createEl("canvas", "lidar-grid__canvas");
    canvasWrap.appendChild(canvas);
    var controls = createEl("div", "lidar-grid__controls");
    var readout = createEl("div", "lidar-grid__readout");
    readout.setAttribute("aria-live", "polite");

    function mk(name, min, max, step, value, label) {
      var row = createEl("div", "lidar-grid__row");
      var top = createEl("div", "lidar-grid__label-row");
      var lbl = createEl("label", "lidar-grid__label", name);
      var out = createEl("output", "lidar-grid__value", "");
      var input = createEl("input", "lidar-grid__slider");
      input.type = "range";
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(value);
      input.setAttribute("aria-label", label);
      top.append(lbl, out);
      row.append(top, input);
      return { row: row, out: out, input: input };
    }

    var rangeCtl = mk("Range (m)", 1, 120, 1, 35, "Range");
    var azCtl = mk("Azimuth (deg)", -180, 180, 1, 25, "Azimuth angle");
    var elCtl = mk("Elevation (deg)", -30, 30, 1, 8, "Elevation angle");
    var resetBtn = createEl("button", "lidar-grid__button lidar-grid__button--ghost", "Reset");
    resetBtn.type = "button";
    var btnRow = createEl("div", "lidar-grid__buttons");
    btnRow.append(resetBtn);

    controls.append(rangeCtl.row, azCtl.row, elCtl.row, btnRow, readout);
    root.append(canvasWrap, controls);
    shell.appendChild(root);

    var ctx = canvas.getContext("2d");
    var state = { r: 35, az: 25, el: 8 };

    function toXYZ(r, azDeg, elDeg) {
      var az = (azDeg * Math.PI) / 180;
      var el = (elDeg * Math.PI) / 180;
      return {
        x: r * Math.cos(el) * Math.cos(az),
        y: r * Math.cos(el) * Math.sin(az),
        z: r * Math.sin(el)
      };
    }

    function draw() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0b1218";
      ctx.fillRect(0, 0, w, h);
      var cx = w * 0.5;
      var cy = h * 0.58;
      var scale = Math.min(w, h) / 90;

      // Axes
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ff4d4d";
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 70, cy); ctx.stroke();
      ctx.strokeStyle = "#3ad16f";
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 60); ctx.stroke();
      ctx.strokeStyle = "#4da3ff";
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 52, cy + 38); ctx.stroke();

      var p = toXYZ(state.r, state.az, state.el);
      // simple oblique projection
      var px = cx + (p.x - p.y * 0.35) * scale;
      var py = cy - (p.z + p.y * 0.3) * scale;

      ctx.strokeStyle = "rgba(0,198,255,0.9)";
      ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = "#7fe6ff";
      ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(212,212,212,0.8)";
      ctx.font = "12px Segoe UI, sans-serif";
      ctx.fillText("X", cx + 74, cy + 4);
      ctx.fillText("Y", cx - 6, cy - 66);
      ctx.fillText("Z", cx - 62, cy + 44);
    }

    function update() {
      rangeCtl.out.value = formatNumber(state.r, 0) + " m";
      azCtl.out.value = formatNumber(state.az, 0) + " deg";
      elCtl.out.value = formatNumber(state.el, 0) + " deg";
      var p = toXYZ(state.r, state.az, state.el);
      readout.innerHTML =
        "<div><strong>x:</strong> " + formatNumber(p.x, 2) + " m</div>" +
        "<div><strong>y:</strong> " + formatNumber(p.y, 2) + " m</div>" +
        "<div><strong>z:</strong> " + formatNumber(p.z, 2) + " m</div>";
      draw();
    }

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(320, canvasWrap.clientWidth);
      var h = 240;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
    }

    rangeCtl.input.addEventListener("input", function () { state.r = Number(rangeCtl.input.value); update(); });
    azCtl.input.addEventListener("input", function () { state.az = Number(azCtl.input.value); update(); });
    elCtl.input.addEventListener("input", function () { state.el = Number(elCtl.input.value); update(); });
    resetBtn.addEventListener("click", function () {
      state = { r: 35, az: 25, el: 8 };
      rangeCtl.input.value = "35"; azCtl.input.value = "25"; elCtl.input.value = "8";
      update();
    });
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvasWrap);
    }
    resize();
    update();
  }

  function mountExtrinsicTransform(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") {
      return;
    }
    shell.dataset.mounted = "true";
    shell.innerHTML = "";

    var root = createEl("div", "lidar-grid");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap");
    var canvas = createEl("canvas", "lidar-grid__canvas");
    canvasWrap.appendChild(canvas);
    var controls = createEl("div", "lidar-grid__controls");
    var readout = createEl("div", "lidar-grid__readout");
    readout.setAttribute("aria-live", "polite");

    function mk(label, min, max, step, value, aria) {
      var row = createEl("div", "lidar-grid__row");
      var top = createEl("div", "lidar-grid__label-row");
      var l = createEl("label", "lidar-grid__label", label);
      var o = createEl("output", "lidar-grid__value", "");
      var s = createEl("input", "lidar-grid__slider");
      s.type = "range"; s.min = String(min); s.max = String(max); s.step = String(step); s.value = String(value);
      s.setAttribute("aria-label", aria);
      top.append(l, o); row.append(top, s);
      return { row: row, out: o, input: s };
    }

    var yawCtl = mk("Yaw (deg)", -180, 180, 1, 15, "Yaw");
    var txCtl = mk("Tx (m)", -5, 5, 0.1, 1.0, "X translation");
    var tyCtl = mk("Ty (m)", -5, 5, 0.1, -0.5, "Y translation");
    var btnRow = createEl("div", "lidar-grid__buttons");
    var reset = createEl("button", "lidar-grid__button lidar-grid__button--ghost", "Reset");
    reset.type = "button";
    btnRow.append(reset);
    controls.append(yawCtl.row, txCtl.row, tyCtl.row, btnRow, readout);
    root.append(canvasWrap, controls);
    shell.appendChild(root);

    var ctx = canvas.getContext("2d");
    var state = { yaw: 15, tx: 1, ty: -0.5 };
    var base = [];
    for (var i = 0; i < 120; i += 1) {
      var a = (i / 120) * Math.PI * 2;
      base.push({ x: Math.cos(a) * 2.2 + (i % 7) * 0.02, y: Math.sin(a) * 1.2 });
    }

    function transformPoint(p) {
      var yaw = (state.yaw * Math.PI) / 180;
      var c = Math.cos(yaw);
      var s = Math.sin(yaw);
      return {
        x: p.x * c - p.y * s + state.tx,
        y: p.x * s + p.y * c + state.ty
      };
    }

    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0b1218"; ctx.fillRect(0, 0, w, h);
      var cx = w * 0.5, cy = h * 0.52, scale = 28;
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
      for (var i = 0; i < base.length; i += 1) {
        var p0 = base[i];
        var p1 = transformPoint(p0);
        ctx.fillStyle = "rgba(255,170,64,0.8)";
        ctx.fillRect(cx + p0.x * scale, cy - p0.y * scale, 2, 2);
        ctx.fillStyle = "rgba(0,198,255,0.9)";
        ctx.fillRect(cx + p1.x * scale, cy - p1.y * scale, 2, 2);
      }
      ctx.fillStyle = "rgba(212,212,212,0.85)";
      ctx.font = "12px Segoe UI, sans-serif";
      ctx.fillText("Orange: sensor frame points", 12, 18);
      ctx.fillText("Cyan: transformed vehicle-frame points", 12, 34);
    }

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(320, canvasWrap.clientWidth), h = 240;
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
    }

    function update() {
      yawCtl.out.value = formatNumber(state.yaw, 0) + " deg";
      txCtl.out.value = formatNumber(state.tx, 1) + " m";
      tyCtl.out.value = formatNumber(state.ty, 1) + " m";
      readout.innerHTML =
        "<div><strong>Transform:</strong> Rz(" + formatNumber(state.yaw, 0) + " deg), t=[" +
        formatNumber(state.tx, 1) + ", " + formatNumber(state.ty, 1) + ", 0]</div>";
      draw();
    }

    yawCtl.input.addEventListener("input", function () { state.yaw = Number(yawCtl.input.value); update(); });
    txCtl.input.addEventListener("input", function () { state.tx = Number(txCtl.input.value); update(); });
    tyCtl.input.addEventListener("input", function () { state.ty = Number(tyCtl.input.value); update(); });
    reset.addEventListener("click", function () {
      state = { yaw: 15, tx: 1, ty: -0.5 };
      yawCtl.input.value = "15"; txCtl.input.value = "1.0"; tyCtl.input.value = "-0.5";
      update();
    });
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvasWrap);
    }
    resize();
    update();
  }

  function mountOcclusionDemo(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") {
      return;
    }
    shell.dataset.mounted = "true";
    shell.innerHTML = "";
    var root = createEl("div", "lidar-grid");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap");
    var canvas = createEl("canvas", "lidar-grid__canvas");
    canvasWrap.appendChild(canvas);
    var controls = createEl("div", "lidar-grid__controls");
    var readout = createEl("div", "lidar-grid__readout");
    var sxCtl = createEl("input", "lidar-grid__slider");
    sxCtl.type = "range"; sxCtl.min = "10"; sxCtl.max = "90"; sxCtl.step = "1"; sxCtl.value = "20";
    sxCtl.setAttribute("aria-label", "Sensor lateral position");
    var top = createEl("div", "lidar-grid__label-row");
    var lbl = createEl("label", "lidar-grid__label", "Sensor lateral position");
    var out = createEl("output", "lidar-grid__value", "");
    top.append(lbl, out);
    var row = createEl("div", "lidar-grid__row");
    row.append(top, sxCtl);
    controls.append(row, readout);
    root.append(canvasWrap, controls);
    shell.appendChild(root);

    var ctx = canvas.getContext("2d");
    var sensorXNorm = 0.2;

    function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }

    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      rect(0, 0, w, h, "#0b1218");
      var sx = w * sensorXNorm, sy = h * 0.8;
      var truck = { x: w * 0.56, y: h * 0.46, w: w * 0.16, h: h * 0.2 };
      var ped = { x: w * 0.77, y: h * 0.5, w: w * 0.03, h: h * 0.1 };
      rect(truck.x, truck.y, truck.w, truck.h, "rgba(255,170,64,0.88)");
      rect(ped.x, ped.y, ped.w, ped.h, "rgba(181,110,255,0.88)");
      var total = 90, pedHits = 0, blocked = 0;
      for (var i = 0; i < total; i += 1) {
        var a = -0.95 + (i / (total - 1)) * 1.05;
        var ex = sx + Math.cos(a) * w * 0.9;
        var ey = sy - Math.sin(a) * h * 0.9;
        var tTruck = (truck.x - sx) / (ex - sx);
        var yTruck = sy + (ey - sy) * tTruck;
        var hitTruck = tTruck > 0 && tTruck < 1 && yTruck >= truck.y && yTruck <= truck.y + truck.h;
        var tPed = (ped.x - sx) / (ex - sx);
        var yPed = sy + (ey - sy) * tPed;
        var hitPed = tPed > 0 && tPed < 1 && yPed >= ped.y && yPed <= ped.y + ped.h;
        if (hitPed && hitTruck && tTruck < tPed) {
          blocked += 1;
          hitPed = false;
        }
        if (hitPed) {
          pedHits += 1;
          ctx.strokeStyle = "rgba(181,110,255,0.95)";
        } else if (hitTruck) {
          ctx.strokeStyle = "rgba(255,170,64,0.8)";
        } else {
          ctx.strokeStyle = "rgba(255,255,255,0.15)";
        }
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      }
      ctx.fillStyle = "#00c6ff";
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
      out.value = formatNumber(sensorXNorm * 100, 0) + "%";
      readout.innerHTML =
        "<div><strong>Pedestrian rays:</strong> " + pedHits + " visible</div>" +
        "<div><strong>Blocked rays:</strong> " + blocked + " blocked by truck</div>";
    }

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(320, canvasWrap.clientWidth), h = 240;
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
    }
    sxCtl.addEventListener("input", function () {
      sensorXNorm = Number(sxCtl.value) / 100;
      draw();
    });
    if (window.ResizeObserver) {
      new ResizeObserver(resize).observe(canvasWrap);
    }
    resize();
  }

  function mountIntensityContrast(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") return;
    shell.dataset.mounted = "true";
    shell.innerHTML = "";
    var root = createEl("div", "lidar-grid");
    var controls = createEl("div", "lidar-grid__controls");
    var readout = createEl("div", "lidar-grid__readout");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap");
    var canvas = createEl("canvas", "lidar-grid__canvas");
    canvasWrap.appendChild(canvas);
    root.append(canvasWrap, controls);
    shell.appendChild(root);

    var matRow = createEl("div", "lidar-grid__row");
    var matLabelRow = createEl("div", "lidar-grid__label-row");
    var matLabel = createEl("label", "lidar-grid__label", "Material");
    var matSelect = createEl("select", "lidar-grid__button");
    ["Matte black", "Painted metal", "Retroreflective"].forEach(function (m) {
      var opt = document.createElement("option");
      opt.value = m; opt.textContent = m; matSelect.appendChild(opt);
    });
    matLabelRow.append(matLabel, createEl("span", "", ""));
    matRow.append(matLabelRow, matSelect);

    var angRow = createEl("div", "lidar-grid__row");
    var angLabelRow = createEl("div", "lidar-grid__label-row");
    var angLabel = createEl("label", "lidar-grid__label", "Incident angle");
    var angOut = createEl("output", "lidar-grid__value", "");
    var ang = createEl("input", "lidar-grid__slider");
    ang.type = "range"; ang.min = "0"; ang.max = "80"; ang.step = "1"; ang.value = "25";
    angLabelRow.append(angLabel, angOut); angRow.append(angLabelRow, ang);
    controls.append(matRow, angRow, readout);

    var ctx = canvas.getContext("2d");
    var state = { mat: "Matte black", angle: 25 };
    var response = { "Matte black": 0.25, "Painted metal": 0.62, "Retroreflective": 0.95 };

    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#0b1218"; ctx.fillRect(0, 0, w, h);
      var bins = 18;
      var base = response[state.mat] * Math.max(0.08, Math.cos((state.angle * Math.PI) / 180));
      for (var i = 0; i < bins; i += 1) {
        var noise = (Math.sin(i * 1.5 + state.angle * 0.2) + 1) * 0.06;
        var val = clamp(base + noise - i * 0.003, 0.02, 1);
        var bw = (w - 40) / bins;
        var bh = val * (h - 60);
        ctx.fillStyle = "rgba(0,198,255,0.85)";
        ctx.fillRect(20 + i * bw, h - 30 - bh, bw - 2, bh);
      }
      ctx.fillStyle = "rgba(212,212,212,0.85)";
      ctx.font = "12px Segoe UI, sans-serif";
      ctx.fillText("Synthetic return-intensity distribution", 20, 18);
    }

    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(320, canvasWrap.clientWidth), h = 220;
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio);
      canvas.style.width = w + "px"; canvas.style.height = h + "px"; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
    }
    function update() {
      angOut.value = formatNumber(state.angle, 0) + " deg";
      var conf = response[state.mat] * Math.max(0.08, Math.cos((state.angle * Math.PI) / 180));
      readout.innerHTML = "<div><strong>Normalized return strength:</strong> " + formatNumber(conf, 2) + "</div>";
      draw();
    }
    matSelect.addEventListener("change", function () { state.mat = matSelect.value; update(); });
    ang.addEventListener("input", function () { state.angle = Number(ang.value); update(); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvasWrap);
    resize(); update();
  }

  function mountMotionDistortion(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") return;
    shell.dataset.mounted = "true"; shell.innerHTML = "";
    var root = createEl("div", "lidar-grid");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap");
    var canvas = createEl("canvas", "lidar-grid__canvas"); canvasWrap.appendChild(canvas);
    var controls = createEl("div", "lidar-grid__controls"); var readout = createEl("div", "lidar-grid__readout");
    function mk(label, min, max, step, value) {
      var row = createEl("div", "lidar-grid__row"), top = createEl("div", "lidar-grid__label-row");
      var l = createEl("label", "lidar-grid__label", label), o = createEl("output", "lidar-grid__value", "");
      var s = createEl("input", "lidar-grid__slider"); s.type = "range"; s.min = String(min); s.max = String(max); s.step = String(step); s.value = String(value);
      top.append(l, o); row.append(top, s); return { row: row, out: o, input: s };
    }
    var vCtl = mk("Vehicle speed (m/s)", 0, 35, 1, 14);
    var yCtl = mk("Yaw rate (deg/s)", -20, 20, 1, 6);
    var dCtl = mk("Scan duration (ms)", 40, 160, 5, 100);
    controls.append(vCtl.row, yCtl.row, dCtl.row, readout); root.append(canvasWrap, controls); shell.appendChild(root);
    var ctx = canvas.getContext("2d");
    var st = { v: 14, yaw: 6, dur: 100 };
    var pts = []; for (var i = 0; i < 180; i += 1) pts.push({ x: (i % 30) - 15, y: Math.floor(i / 30) - 3 });
    function distort(p, t) {
      var dx = st.v * t;
      var ang = ((st.yaw * Math.PI) / 180) * t;
      var c = Math.cos(ang), s = Math.sin(ang);
      return { x: p.x * c - p.y * s + dx, y: p.x * s + p.y * c };
    }
    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight, cx = w * 0.5, cy = h * 0.56, sc = 10;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#0b1218"; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i += 1) {
        var p = pts[i], t = i / (pts.length - 1) * (st.dur / 1000), q = distort(p, t);
        ctx.fillStyle = "rgba(255,170,64,0.72)"; ctx.fillRect(cx + p.x * sc, cy - p.y * sc, 2, 2);
        ctx.fillStyle = "rgba(0,198,255,0.9)"; ctx.fillRect(cx + q.x * sc, cy - q.y * sc, 2, 2);
      }
      ctx.fillStyle = "rgba(212,212,212,0.86)"; ctx.font = "12px Segoe UI, sans-serif";
      ctx.fillText("Orange: ideal static capture | Cyan: rolling-sweep distorted", 12, 18);
    }
    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(320, canvasWrap.clientWidth), h = 230;
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio); canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
    }
    function upd() {
      vCtl.out.value = formatNumber(st.v, 0) + " m/s"; yCtl.out.value = formatNumber(st.yaw, 0) + " deg/s"; dCtl.out.value = formatNumber(st.dur, 0) + " ms";
      readout.innerHTML = "<div><strong>Approx distortion severity:</strong> " + formatNumber(Math.abs(st.v) * st.dur / 1000 + Math.abs(st.yaw) * 0.03, 2) + "</div>";
      draw();
    }
    vCtl.input.addEventListener("input", function () { st.v = Number(vCtl.input.value); upd(); });
    yCtl.input.addEventListener("input", function () { st.yaw = Number(yCtl.input.value); upd(); });
    dCtl.input.addEventListener("input", function () { st.dur = Number(dCtl.input.value); upd(); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvasWrap);
    resize(); upd();
  }

  function mountGroundRemoval(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") return;
    shell.dataset.mounted = "true"; shell.innerHTML = "";
    var root = createEl("div", "lidar-grid");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap");
    var canvas = createEl("canvas", "lidar-grid__canvas"); canvasWrap.appendChild(canvas);
    var controls = createEl("div", "lidar-grid__controls"); var readout = createEl("div", "lidar-grid__readout");
    var row = createEl("div", "lidar-grid__row"), top = createEl("div", "lidar-grid__label-row");
    var lbl = createEl("label", "lidar-grid__label", "Ground threshold (m)"), out = createEl("output", "lidar-grid__value", "");
    var s = createEl("input", "lidar-grid__slider"); s.type = "range"; s.min = "-0.4"; s.max = "0.8"; s.step = "0.02"; s.value = "0.2";
    top.append(lbl, out); row.append(top, s); controls.append(row, readout); root.append(canvasWrap, controls); shell.appendChild(root);
    var ctx = canvas.getContext("2d"), threshold = 0.2;
    var points = [];
    for (var i = 0; i < 500; i += 1) {
      var x = (i % 50) - 25, y = Math.floor(i / 50) - 5;
      var z = Math.random() * 0.08 - 0.04 + (Math.abs(x) < 4 && y > -1 ? 0.6 : 0);
      var isGround = z < 0.15;
      points.push({ x: x, y: y, z: z, ground: isGround });
    }
    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight, cx = w * 0.5, cy = h * 0.56, sc = 7;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#0b1218"; ctx.fillRect(0, 0, w, h);
      var tp = 0, fp = 0, fn = 0;
      for (var i = 0; i < points.length; i += 1) {
        var p = points[i], predGround = p.z < threshold;
        if (!predGround && !p.ground) tp += 1;
        if (!predGround && p.ground) fp += 1;
        if (predGround && !p.ground) fn += 1;
        ctx.fillStyle = predGround ? "rgba(180,180,180,0.6)" : "rgba(0,198,255,0.9)";
        ctx.fillRect(cx + p.x * sc, cy - p.y * sc - p.z * 22, 2, 2);
      }
      var prec = tp / Math.max(1, tp + fp), rec = tp / Math.max(1, tp + fn);
      readout.innerHTML = "<div><strong>Precision:</strong> " + formatNumber(prec * 100, 1) + "%</div><div><strong>Recall:</strong> " + formatNumber(rec * 100, 1) + "%</div>";
      out.value = formatNumber(threshold, 2) + " m";
    }
    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(320, canvasWrap.clientWidth), h = 220;
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio); canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
    }
    s.addEventListener("input", function () { threshold = Number(s.value); draw(); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvasWrap);
    resize();
  }

  function mountBEVPillarizer(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") return;
    shell.dataset.mounted = "true"; shell.innerHTML = "";
    var root = createEl("div", "lidar-grid");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap"), canvas = createEl("canvas", "lidar-grid__canvas");
    canvasWrap.appendChild(canvas);
    var controls = createEl("div", "lidar-grid__controls"), readout = createEl("div", "lidar-grid__readout");
    function mk(label, min, max, step, val) {
      var row = createEl("div", "lidar-grid__row"), top = createEl("div", "lidar-grid__label-row");
      var l = createEl("label", "lidar-grid__label", label), o = createEl("output", "lidar-grid__value", "");
      var s = createEl("input", "lidar-grid__slider"); s.type = "range"; s.min = String(min); s.max = String(max); s.step = String(step); s.value = String(val);
      top.append(l, o); row.append(top, s); return { row: row, out: o, input: s };
    }
    var cell = mk("Cell size (m)", 0.2, 1.5, 0.1, 0.5);
    var maxPts = mk("Max points per pillar", 8, 64, 1, 24);
    controls.append(cell.row, maxPts.row, readout); root.append(canvasWrap, controls); shell.appendChild(root);
    var ctx = canvas.getContext("2d");
    var points = []; for (var i = 0; i < 800; i += 1) points.push({ x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 24 });
    var state = { cell: 0.5, max: 24 };
    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#0b1218"; ctx.fillRect(0, 0, w, h);
      var roiX = 40, roiY = 24, cols = Math.floor(roiX / state.cell), rows = Math.floor(roiY / state.cell);
      var cellW = (w - 20) / cols, cellH = (h - 20) / rows;
      var grid = {};
      for (var i = 0; i < points.length; i += 1) {
        var p = points[i], cx = Math.floor((p.x + roiX / 2) / state.cell), cy = Math.floor((p.y + roiY / 2) / state.cell);
        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
        var key = cx + ":" + cy; grid[key] = (grid[key] || 0) + 1;
      }
      var occ = 0;
      Object.keys(grid).forEach(function (k) {
        occ += 1;
        var parts = k.split(":"), cx = Number(parts[0]), cy = Number(parts[1]), count = Math.min(grid[k], state.max);
        var alpha = clamp(count / state.max, 0.08, 1);
        ctx.fillStyle = "rgba(0,198,255," + alpha + ")";
        ctx.fillRect(10 + cx * cellW, 10 + (rows - 1 - cy) * cellH, cellW - 1, cellH - 1);
      });
      cell.out.value = formatNumber(state.cell, 1) + " m"; maxPts.out.value = formatNumber(state.max, 0);
      readout.innerHTML = "<div><strong>Occupied pillars:</strong> " + formatNumber(occ, 0) + "</div><div><strong>Feature tensor:</strong> [" + rows + ", " + cols + ", " + state.max + "]</div>";
    }
    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(320, canvasWrap.clientWidth), h = 220;
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio); canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
    }
    cell.input.addEventListener("input", function () { state.cell = Number(cell.input.value); draw(); });
    maxPts.input.addEventListener("input", function () { state.max = Number(maxPts.input.value); draw(); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvasWrap);
    resize();
  }

  function mountScanMatching(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") return;
    shell.dataset.mounted = "true"; shell.innerHTML = "";
    var root = createEl("div", "lidar-grid");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap"), canvas = createEl("canvas", "lidar-grid__canvas");
    canvasWrap.appendChild(canvas);
    var controls = createEl("div", "lidar-grid__controls"), readout = createEl("div", "lidar-grid__readout");
    var btnRow = createEl("div", "lidar-grid__buttons");
    var stepBtn = createEl("button", "lidar-grid__button", "Iterate");
    var resetBtn = createEl("button", "lidar-grid__button lidar-grid__button--ghost", "Reset");
    stepBtn.type = "button"; resetBtn.type = "button"; btnRow.append(stepBtn, resetBtn); controls.append(btnRow, readout); root.append(canvasWrap, controls); shell.appendChild(root);
    var ctx = canvas.getContext("2d");
    var target = []; for (var i = 0; i < 90; i += 1) target.push({ x: Math.cos(i / 20) * 4 + (i % 9) * 0.12, y: Math.sin(i / 14) * 2.6 });
    var pose = { x: 2.8, y: -1.6, yaw: 0.38 };
    function applyPose(p) { var c = Math.cos(pose.yaw), s = Math.sin(pose.yaw); return { x: p.x * c - p.y * s + pose.x, y: p.x * s + p.y * c + pose.y }; }
    function error() {
      var sum = 0;
      for (var i = 0; i < target.length; i += 1) {
        var a = applyPose(target[i]), b = target[i];
        var dx = a.x - b.x, dy = a.y - b.y; sum += dx * dx + dy * dy;
      }
      return Math.sqrt(sum / target.length);
    }
    function iterate() { pose.x *= 0.72; pose.y *= 0.72; pose.yaw *= 0.72; draw(); }
    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight, cx = w * 0.5, cy = h * 0.56, sc = 18;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#0b1218"; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < target.length; i += 1) {
        var t = target[i], s = applyPose(t);
        ctx.fillStyle = "rgba(255,170,64,0.84)"; ctx.fillRect(cx + t.x * sc, cy - t.y * sc, 2, 2);
        ctx.fillStyle = "rgba(0,198,255,0.9)"; ctx.fillRect(cx + s.x * sc, cy - s.y * sc, 2, 2);
      }
      readout.innerHTML = "<div><strong>RMS alignment error:</strong> " + formatNumber(error(), 3) + "</div><div><strong>Pose estimate:</strong> [" + formatNumber(pose.x, 2) + ", " + formatNumber(pose.y, 2) + ", " + formatNumber((pose.yaw * 180) / Math.PI, 1) + " deg]</div>";
    }
    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(320, canvasWrap.clientWidth), h = 220;
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio); canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
    }
    stepBtn.addEventListener("click", iterate);
    resetBtn.addEventListener("click", function () { pose = { x: 2.8, y: -1.6, yaw: 0.38 }; draw(); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvasWrap);
    resize();
  }

  function mountFusionDashboard(figure) {
    var shell = figure.querySelector(".interactive-shell");
    if (!shell || shell.dataset.mounted === "true") return;
    shell.dataset.mounted = "true"; shell.innerHTML = "";
    var root = createEl("div", "lidar-grid");
    var canvasWrap = createEl("div", "lidar-grid__canvas-wrap"), canvas = createEl("canvas", "lidar-grid__canvas");
    canvasWrap.appendChild(canvas);
    var controls = createEl("div", "lidar-grid__controls"), readout = createEl("div", "lidar-grid__readout");
    function mk(label, min, max, value) {
      var row = createEl("div", "lidar-grid__row"), top = createEl("div", "lidar-grid__label-row");
      var l = createEl("label", "lidar-grid__label", label), o = createEl("output", "lidar-grid__value", "");
      var s = createEl("input", "lidar-grid__slider"); s.type = "range"; s.min = String(min); s.max = String(max); s.step = "1"; s.value = String(value);
      top.append(l, o); row.append(top, s); return { row: row, out: o, input: s };
    }
    var weather = mk("Weather severity", 0, 100, 30);
    var lighting = mk("Lighting difficulty", 0, 100, 20);
    var lidarRel = mk("LiDAR reliability bias", 0, 100, 70);
    controls.append(weather.row, lighting.row, lidarRel.row, readout); root.append(canvasWrap, controls); shell.appendChild(root);
    var ctx = canvas.getContext("2d");
    function scores() {
      var w = Number(weather.input.value) / 100, l = Number(lighting.input.value) / 100, lr = Number(lidarRel.input.value) / 100;
      var lidar = clamp(0.9 - w * 0.35 + lr * 0.25, 0.05, 1);
      var camera = clamp(0.9 - l * 0.55 - w * 0.15, 0.05, 1);
      var radar = clamp(0.75 - l * 0.12 + w * 0.22, 0.05, 1);
      var fused = clamp(lidar * 0.42 + camera * 0.33 + radar * 0.25, 0, 1);
      return { lidar: lidar, camera: camera, radar: radar, fused: fused };
    }
    function bar(x, y, w, h, v, color, label) {
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = color; ctx.fillRect(x, y, w * v, h);
      ctx.fillStyle = "#d4d4d4"; ctx.font = "12px Segoe UI, sans-serif"; ctx.fillText(label + " " + formatNumber(v * 100, 0) + "%", x, y - 6);
    }
    function draw() {
      var s = scores(), w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#0b1218"; ctx.fillRect(0, 0, w, h);
      bar(20, 34, w - 40, 14, s.lidar, "rgba(0,198,255,0.9)", "LiDAR");
      bar(20, 72, w - 40, 14, s.camera, "rgba(255,170,64,0.9)", "Camera");
      bar(20, 110, w - 40, 14, s.radar, "rgba(144,220,120,0.9)", "Radar");
      bar(20, 162, w - 40, 18, s.fused, "rgba(181,110,255,0.9)", "Fused confidence");
      weather.out.value = weather.input.value + "%";
      lighting.out.value = lighting.input.value + "%";
      lidarRel.out.value = lidarRel.input.value + "%";
      readout.innerHTML = "<div><strong>Decision confidence:</strong> " + formatNumber(s.fused * 100, 1) + "%</div>";
    }
    function resize() {
      var ratio = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(320, canvasWrap.clientWidth), h = 220;
      canvas.width = Math.floor(w * ratio); canvas.height = Math.floor(h * ratio); canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw();
    }
    [weather, lighting, lidarRel].forEach(function (c) { c.input.addEventListener("input", draw); });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvasWrap);
    resize();
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
    var polarFigure = document.getElementById("polar-to-cartesian-converter");
    if (polarFigure) mountPolarCartesian(polarFigure);
    var extFigure = document.getElementById("extrinsic-transform-playground");
    if (extFigure) mountExtrinsicTransform(extFigure);
    var occFigure = document.getElementById("occlusion-ray-demo");
    if (occFigure) mountOcclusionDemo(occFigure);
    var intFigure = document.getElementById("intensity-material-contrast");
    if (intFigure) mountIntensityContrast(intFigure);
    var motFigure = document.getElementById("motion-distortion-sweep");
    if (motFigure) mountMotionDistortion(motFigure);
    var grdFigure = document.getElementById("ground-removal-threshold");
    if (grdFigure) mountGroundRemoval(grdFigure);
    var bevFigure = document.getElementById("bev-pillarizer");
    if (bevFigure) mountBEVPillarizer(bevFigure);
    var icpFigure = document.getElementById("scan-matching-icp-intuition");
    if (icpFigure) mountScanMatching(icpFigure);
    var fusFigure = document.getElementById("fusion-uncertainty-dashboard");
    if (fusFigure) mountFusionDashboard(fusFigure);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountInteractives);
  } else {
    mountInteractives();
  }
})();
