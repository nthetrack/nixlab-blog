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

  function mountInteractives() {
    var figure = document.getElementById("tof-roundtrip-basics");
    if (figure) {
      mountRoundTripTimer(figure);
    }
    var gridFigure = document.getElementById("scan-azimuth-elevation-grid");
    if (gridFigure) {
      mountBeamGridBuilder(gridFigure);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountInteractives);
  } else {
    mountInteractives();
  }
})();
