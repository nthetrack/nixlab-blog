---
title: "Why Heavy Vehicles Don’t Use Hydraulic Brakes"
date: 2026-02-25
author: "Nik Palmer"
draft: false
tags: ["physics", "mechanical", "interactive", "AURTTA118", "AURTTA127"]
---

If you’re driving a two-tonne sedan, stopping is simple. You push a pedal, some oil moves through a tube, and your car slows down. But when you’re piloting a 40-tonne B-double through the Australian outback, "simple" becomes "deadly." 

At this scale, the laws of physics start to play dirty. To stop a behemoth, we have to abandon the elegant simplicity of hydraulics and embrace a system that is noisy, complex, and counter-intuitive. 

## 1. The Two Philosophies

The fundamental difference between your car and a prime mover is how they handle the "fluid" that does the work. Your car uses a **Closed Loop** (Hydraulic). A heavy vehicle uses an **Open System** (Pneumatic).

In a hydraulic system, the same oil moves back and forth forever. In an air system, we breathe in fresh air from the atmosphere, use it once to push the brakes, and then throw it away with a loud *hiss*.

<div class="widget-box">
  <h3><span style="font-size: 1.4rem">🔄</span> Hydraulic Loop vs. Pneumatic Vent</h3>
  <canvas id="compCanvas" class="widget-canvas" width="800" height="350"></canvas>
  <div class="widget-controls" style="justify-content: center;">
    <button id="btnCompApply" class="widget-btn">Push Brake Pedal</button>
    <button id="btnCompRelease" class="widget-btn" style="background:#5e6b7a;">Release Pedal</button>
  </div>
  <div class="widget-desc" id="compDesc"><b>Left (Hydraulic):</b> Fluid is trapped in a loop. It moves to the wheel and returns to the master cylinder. <b>Right (Air):</b> Compressed air is drawn from a tank, used once, and then exhausted to the atmosphere through a vent.</div>
</div>

## 2. The Problem with Vapour

Brakes are essentially machines that turn motion into heat. When you stop a truck, you are asking a few metal drums to absorb the same amount of energy as a small explosion.

In a car, hydraulic fluid is great because it doesn't compress. But in a heavy vehicle, that heat can get so intense that the oil literally boils. The moment that happens, your "incompressible" fluid turns into a squishy **vapour**. You push the pedal, the bubbles just shrink, and the truck keeps rolling. This is "brake fade," and on a steep grade, it is a death sentence.

Furthermore, a tiny leak in a hydraulic line will eventually drain the system. Air systems have an infinite supply of "fluid" all around them. Even with a leak, a compressor can keep pumping to maintain pressure.

<div class="widget-box">
  <h3><span style="font-size: 1.4rem">🔥</span> The Heat Failure</h3>
  <canvas id="heatCanvas" class="widget-canvas" width="800" height="350"></canvas>
  <div class="widget-controls">
    <div class="widget-slider-group">
      <label>Drum Temperature</label>
      <input type="range" id="tempSlider" min="20" max="800" step="5" value="20">
      <span id="tempVal">20°C</span>
    </div>
    <button id="btnLeak" class="widget-btn" style="background:#cc3333;">Sever Line</button>
    <button id="btnResetHeat" class="widget-btn" style="margin-left:auto; background:#5e6b7a;">Cool Down</button>
  </div>
  <div class="widget-desc" id="heatDesc">Watch the drum glow. If the fluid reaches its boiling point (approx. 180°C), it turns to vapour and the brakes fail. The air system remains 100% operational.</div>
</div>

## 3. The Inverse Logic: The Spring Brake

This is where heavy vehicle design gets brilliant. Since we can't trust a system that needs pressure to work, we built one that needs pressure to *not* work.

Inside the rear chambers of a truck is a massive, terrifyingly powerful steel spring. This spring is constantly trying to slam the brakes on. When the truck is parked, that spring is winning. 

To actually move the truck, you have to use high-pressure air to fight that spring and squeeze it back. You aren't using air to stop; you're using air to *release*. If a hose snaps or the compressor dies, the air vanishes, the spring wins, and the truck stops automatically. 

<div class="widget-box">
  <h3><span style="font-size: 1.4rem">🏗️</span> Mechanical Fail-Safe</h3>
  <canvas id="springCanvas" class="widget-canvas" width="800" height="400"></canvas>
  <div class="widget-controls">
    <div class="widget-slider-group" style="width: 100%;">
      <label>System Air Pressure</label>
      <input type="range" id="psiSlider" min="0" max="120" step="1" value="0" style="flex: 1;">
      <span id="psiVal" style="min-width: 60px; font-weight:bold;">0 PSI</span>
    </div>
  </div>
  <div class="widget-desc" id="springDesc">At 0 PSI, the <b>Parking Spring</b> is expanded, locking the brake shoes against the drum. Only at high pressure (approx. 60+ PSI) does the air overcome the spring to let the wheels turn.</div>
</div>

<div class="widget-box" id="three-container">
  <h3><span style="font-size: 1.4rem">📦</span> 3D Assembly Breakdown</h3>
  <div id="brake-loading" style="position: absolute; background: rgba(255,255,255,0.8); width: 100%; height: 500px; display: flex; align-items: center; justify-content: center; z-index: 5; font-family: Inter; font-weight: bold; color: #00c6ff;">
    Loading 3D Model...
  </div>
  <div id="brake3d" style="width: 100%; height: 500px; background: #ffffff; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1);"></div>
  <div class="widget-controls">
    <button id="btnExplode" class="widget-btn">Explode Assembly</button>
    <button id="btnReset3d" class="widget-btn" style="background:#5e6b7a; margin-left:auto;">Reset Camera</button>
  </div>
  <div class="widget-desc" id="threeDesc">
    <b>Mechanical Deep-Dive:</b> This 3D model represents the combined Service and Parking brake assembly. 
    The <b>Rear Section</b> contains that dangerous high-tension spring we discussed, while the <b>Front Section</b> handles your normal foot-pedal braking. 
    Click <b>Explode Assembly</b> to see how the diaphragm and push-rod are sandwiched between the cast steel housings.
    <br><br>
    <b>The Components:</b>
    <ul>
      <li><b>Outer Housing:</b> Two steel shells clamped together to form a pressure vessel.</li>
      <li><b>Rubber Diaphragm:</b> The flexible seal that air pressure pushes against.</li>
      <li><b>Pressure Plate:</b> The metal disc that transfers air force to the push-rod.</li>
      <li><b>Parking Spring:</b> The heavy-duty coil that applies the brakes when air pressure is lost.</li>
    </ul>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

<script>
(function(){
  const container = document.getElementById('brake3d');
  const loaderEl = document.getElementById('brake-loading');
  if(!container) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(5, 4, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Studio Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const light1 = new THREE.DirectionalLight(0xffffff, 0.6);
  light1.position.set(10, 20, 10);
  scene.add(light1);
  const light2 = new THREE.DirectionalLight(0xffffff, 0.3);
  light2.position.set(-10, -10, -10);
  scene.add(light2);

  let model, isExploded = false;
  const loader = new THREE.GLTFLoader();
  
  loader.load('/air_brake_test.glb', (gltf) => {
    model = gltf.scene;
    
    // Auto-center and scale
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    
    // Scale to fit nicely
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5 / maxDim;
    model.scale.set(scale, scale, scale);
    
    scene.add(model);
    if(loaderEl) loaderEl.style.display = 'none';
    
    // Prepare for explosion
    let meshCount = 0;
    model.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        // Calculate a direction vector from the center of the model to the center of this mesh
        const meshBox = new THREE.Box3().setFromObject(child);
        const meshCenter = meshBox.getCenter(new THREE.Vector3());
        
        // Direction from global center
        const dir = meshCenter.clone().sub(center).normalize();
        
        // Fallback: if they are all centered, explode along the Z axis (common for chambers)
        if(dir.length() < 0.1) {
           dir.set(0, 0, meshCount % 2 === 0 ? 1 : -1);
        }
        
        child.userData.explodeDir = dir;
        child.userData.originalPos = child.position.clone();
        child.userData.index = meshCount;
      }
    });
  }, (xhr) => {
    if(loaderEl) loaderEl.innerText = 'Loading: ' + Math.round(xhr.loaded / xhr.total * 100) + '%';
  });

  document.getElementById('btnExplode').onclick = () => {
    isExploded = !isExploded;
    document.getElementById('btnExplode').innerText = isExploded ? "Reassemble" : "Explode Assembly";
    
    if(!model) return;
    model.traverse((child) => {
      if (child.isMesh) {
        // Use the mesh index to multiply the distance so they don't all land in the same spot
        const distance = isExploded ? (1.0 + child.userData.index * 0.4) : 0;
        const targetX = child.userData.originalPos.x + (child.userData.explodeDir.x * distance);
        const targetY = child.userData.originalPos.y + (child.userData.explodeDir.y * distance);
        const targetZ = child.userData.originalPos.z + (child.userData.explodeDir.z * distance);
        
        if(window.TWEEN) {
          new TWEEN.Tween(child.position)
            .to({ x: targetX, y: targetY, z: targetZ }, 1000)
            .easing(TWEEN.Easing.Exponential.Out)
            .start();
        } else {
          child.position.set(targetX, targetY, targetZ);
        }
      }
    });
  };

  document.getElementById('btnReset3d').onclick = () => {
    camera.position.set(5, 4, 8);
    controls.target.set(0, 0, 0);
    isExploded = false;
    document.getElementById('btnExplode').innerText = "Explode Assembly";
    if(model) model.traverse(c => { if(c.isMesh) c.position.copy(c.userData.originalPos); });
  };

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if(window.TWEEN) TWEEN.update();
    if(model && !isExploded) {
       model.rotation.y += 0.003;
    }
    renderer.render(scene, camera);
  }
  
  const tweenScript = document.createElement('script');
  tweenScript.src = "https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.umd.js";
  tweenScript.onload = animate;
  document.head.appendChild(tweenScript);

  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
})();
</script>

## 4. The Pneumatic Nervous System

Building a system like this requires more than just a pump. It requires a network of components that can manage moisture, pressure, and timing.

| Component | What it actually does |
| :--- | :--- |
| **Compressor** | The heart. It eats engine power to create 120 PSI of pressure. |
| **Air Dryer** | The kidneys. It removes water vapour before it can rust valves or freeze into ice plugs. |
| **Governor** | The brain. It tells the compressor when to start and stop pumping. |
| **Reservoirs** | The buffer. Huge steel tanks that ensure you have multiple "hits" of the pedal in reserve. |
| **Foot Valve** | The translator. It turns your foot's pressure into a precise pneumatic signal. |

## 5. The Relay Valve: A Pneumatic Transistor

In a 20-metre long truck, you can't just run a single air line from the pedal to the back wheels—the lag would be enormous. Instead, we use **Relay Valves**. 

Think of a relay valve as a pneumatic transistor. A tiny "signal" of air from your foot pedal tells the valve to open a massive "floodgate" of air from a local tank directly into the brake chambers. 

When you take your foot off the pedal, the valve has to do two things: it must shut off the tank and immediately vent the air from the chambers to the atmosphere. If that vent (the exhaust port) is blocked, the brakes stay on. This is where our tiny Australian villain, the Mud Wasp, causes chaos by building nests in the exhaust ports.

<div class="widget-box">
  <h3><span style="font-size: 1.4rem">🕹️</span> The Relay Valve Logic</h3>
  <canvas id="valveCanvas" class="widget-canvas" width="800" height="450"></canvas>
  <div class="widget-controls">
    <button id="btnApply" class="widget-btn">Pedal DOWN (Apply)</button>
    <button id="btnRelease" class="widget-btn" style="background:#5e6b7a;">Pedal UP (Release)</button>
    <button id="btnWasp" class="widget-btn" style="background:#cc7a00; margin-left:auto;">Wait for Mud Wasp...</button>
  </div>
  <div class="widget-desc" id="valveDesc">Watch the <b>Control Piston</b>. When the port is clear, air escapes the exhaust. If the Mud Wasp blocks the port, the chamber remains pressurized!</div>
</div>

The next time you hear that iconic *Pshhh-hiss* from a passing semi, you're hearing the sound of a pneumatic computer confirming that the physics are finally in your favour.

---

<script>
const COLORS = {
  accent: '#00c6ff',
  accentDark: '#0072ff',
  danger: '#ff4444',
  metal: '#4a4e5a',
  rust: '#8b5a2b',
  bg: '#0b1218'
};

// --- Widget 0: Philosophy Comparison ---
(function(){
  const cv = document.getElementById('compCanvas');
  const ctx = cv.getContext('2d');
  let progress = 0, state = 'idle';
  document.getElementById('btnCompApply').onclick = () => state = 'applying';
  document.getElementById('btnCompRelease').onclick = () => state = 'releasing';

  function draw(){
    if(!cv) return;
    ctx.clearRect(0,0,800,350);
    if(state === 'applying' && progress < 1) progress += 0.05;
    if(state === 'releasing' && progress > 0) progress -= 0.05;

    // --- Hydraulic side ---
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
    ctx.fillText("HYDRAULIC (Closed Loop)", 200, 30);
    // Reservoir/Pedal
    ctx.fillStyle = '#2b3138'; ctx.fillRect(50, 100, 60, 150);
    ctx.strokeStyle = '#888'; ctx.strokeRect(50, 100, 60, 150);
    // Line
    ctx.strokeStyle = '#333'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(110, 175); ctx.lineTo(300, 175); ctx.stroke();
    // Fluid moving
    ctx.fillStyle = `rgba(255,255,255,${0.3 + progress*0.4})`;
    ctx.fillRect(110, 170, 190, 10);
    ctx.fillStyle = '#aaa'; ctx.fillText("Fluid stays in pipes", 200, 200);

    // --- Air side ---
    ctx.fillStyle = '#fff'; ctx.fillText("AIR (Open System)", 600, 30);
    // Tank
    ctx.fillStyle = '#1a1e24'; ctx.fillRect(450, 100, 60, 150);
    ctx.strokeStyle = COLORS.accent; ctx.strokeRect(450, 100, 60, 150);
    // Line
    ctx.strokeStyle = '#333'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(510, 175); ctx.lineTo(700, 175); ctx.stroke();
    // Air flow
    if(state === 'applying'){
      ctx.fillStyle = COLORS.accent;
      for(let i=0; i<3; i++) {
        const pX = 510 + (Date.now()*0.2 + i*40)%190;
        ctx.beginPath(); ctx.arc(pX, 175, 4, 0, Math.PI*2); ctx.fill();
      }
    }
    // Exhaust flow
    if(state === 'releasing' && progress > 0.1){
      ctx.fillStyle = COLORS.accent;
      for(let i=0; i<5; i++) {
        const pY = 175 + (Date.now()*0.3 + i*20)%60;
        ctx.beginPath(); ctx.arc(700, pY, 3, 0, Math.PI*2); ctx.fill();
      }
      ctx.fillStyle = '#fff'; ctx.fillText("*HISSS*", 730, 200);
    }
    ctx.fillStyle = '#aaa'; ctx.fillText("Air is thrown away", 600, 260);
    requestAnimationFrame(draw);
  }
  draw();
})();

// --- Widget 1: Heat ---
(function(){
  const cv = document.getElementById('heatCanvas');
  const ctx = cv.getContext('2d');
  let isLeaking = false, fluidLevel = 1.0;
  document.getElementById('btnLeak').onclick = () => isLeaking = true;
  document.getElementById('btnResetHeat').onclick = () => { isLeaking = false; fluidLevel = 1.0; document.getElementById('tempSlider').value = 20; };
  function draw(){
    if(!cv) return;
    const temp = parseInt(document.getElementById('tempSlider').value);
    document.getElementById('tempVal').innerText = temp + "°C";
    ctx.clearRect(0,0,800,350);
    const bx = 550, by = 175, br = 110;
    const heatFactor = Math.max(0, (temp - 50) / 750);
    ctx.save();
    if(heatFactor > 0.1){ ctx.shadowBlur = 20 * heatFactor; ctx.shadowColor = `rgba(255, ${100 - heatFactor*100}, 0, ${heatFactor})`; }
    const grad = ctx.createRadialGradient(bx, by, br*0.8, bx, by, br);
    const r = 40 + heatFactor * 215, g = 45 - heatFactor * 45, b = 55 - heatFactor * 55;
    grad.addColorStop(0, `rgb(${r*0.7},${g*0.7},${b*0.7})`); grad.addColorStop(1, `rgb(${r},${g},${b})`);
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#1a1e24'; ctx.fillRect(50, 50, 120, 80); ctx.strokeStyle = COLORS.accent; ctx.lineWidth = 3; ctx.strokeRect(50, 50, 120, 80);
    ctx.fillStyle = `rgba(0, 198, 255, ${0.2 + Math.sin(Date.now()*0.005)*0.1})`; ctx.fillRect(55, 55, 110, 70);
    ctx.fillStyle = '#1a1e24'; ctx.fillRect(50, 200, 120, 80);
    if(isLeaking && fluidLevel > 0) fluidLevel -= 0.005;
    const boilF = Math.max(0, (temp - 180) / 400);
    ctx.fillStyle = isLeaking ? '#333' : `rgba(255, 255, 255, ${0.3 + (1-boilF)*0.4})`; ctx.fillRect(55, 205 + (1-fluidLevel)*70, 110, fluidLevel*70);
    if(boilF > 0 && !isLeaking){ for(let i=0; i<boilF*20; i++){ ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(55 + Math.random()*110, 205 + Math.random()*70, 1+boilF*3, 0, Math.PI*2); ctx.fill(); } }
    ctx.font = 'bold 12px Inter'; ctx.fillStyle = COLORS.accent; ctx.textAlign = 'left';
    ctx.fillText("AIR TANK", 50, 45); ctx.fillText("AIR: OPERATIONAL", 190, 95);
    ctx.fillStyle = (isLeaking || boilF > 0.1) ? COLORS.danger : '#fff';
    ctx.fillText("HYDRAULIC RESERVOIR", 50, 195);
    ctx.fillText("HYDRAULIC: " + (isLeaking ? "TOTAL LOSS" : (boilF > 0.1 ? "VAPOUR LOCK" : "OPERATIONAL")), 190, 245);
    requestAnimationFrame(draw);
  }
  draw();
})();

// --- Widget 2: Spring Brake ---
(function(){
  const cv = document.getElementById('springCanvas');
  const ctx = cv.getContext('2d');
  function draw(){
    if(!cv) return;
    const psi = parseInt(document.getElementById('psiSlider').value);
    document.getElementById('psiVal').innerText = psi + " PSI";
    ctx.clearRect(0,0,800,400);
    const cx = 400, cy = 200, rel = (psi/120)*120;
    const grd = ctx.createLinearGradient(cx-200, cy-120, cx-200, cy+120);
    grd.addColorStop(0, '#2b3138'); grd.addColorStop(0.5, '#4a4e5a'); grd.addColorStop(1, '#1a1e24');
    ctx.fillStyle = grd; ctx.beginPath(); ctx.roundRect(cx-180, cy-120, 360, 240, 15); ctx.fill();
    ctx.strokeStyle = '#666'; ctx.lineWidth = 2; ctx.stroke();
    const dx = cx - 160 + rel;
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(dx, cy, 20, 115, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#999'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath();
    const sStart = cx + 160, sEnd = dx + 10, coils = 12;
    for(let i=0; i<=coils; i++){
      const x = sStart - (i/coils)*(sStart - sEnd), y = cy + (i%2===0 ? -80 : 80);
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.fillStyle = '#ddd'; ctx.fillRect(dx - 250, cy-10, 250, 20);
    const drumX = 100, drumR = 100;
    ctx.strokeStyle = '#333'; ctx.lineWidth = 15; ctx.beginPath(); ctx.arc(drumX, cy, drumR, 0, Math.PI*2); ctx.stroke();
    const shoeOffset = psi < 65 ? 0 : (psi - 65) / 5;
    ctx.strokeStyle = psi < 65 ? COLORS.danger : COLORS.accent; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(drumX, cy, drumR - 15 - shoeOffset, -Math.PI/2.5, Math.PI/2.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(drumX, cy, drumR - 15 - shoeOffset, Math.PI - Math.PI/2.5, Math.PI + Math.PI/2.5); ctx.stroke();
    ctx.fillStyle = `rgba(0, 198, 255, ${psi/180})`; ctx.fillRect(cx-180, cy-120, rel + 20, 240);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
    ctx.fillText("HEAVY COILED SPRING", cx+60, cy+100); ctx.fillText("AIR INLET", cx-120, cy+100);
    ctx.fillText("BRAKE DRUM", drumX, cy+125);
    requestAnimationFrame(draw);
  }
  draw();
})();

// --- Widget 3: Relay Valve Logic (FIXED COHESIVE) ---
(function(){
  const cv = document.getElementById('valveCanvas');
  const ctx = cv.getContext('2d');
  let air = 0, isBlocked = false, state = 'idle', pistonPos = 0;
  document.getElementById('btnApply').onclick = () => state = 'down';
  document.getElementById('btnRelease').onclick = () => state = 'up';
  document.getElementById('btnWasp').onclick = () => { isBlocked = !isBlocked; document.getElementById('btnWasp').innerText = isBlocked ? "Clear Exhaust" : "Wait for Mud Wasp..."; };

  function draw(){
    if(!cv) return;
    ctx.clearRect(0,0,800,450);
    if(state === 'down'){ if(pistonPos < 1) pistonPos += 0.1; if(air < 1) air += 0.05; }
    else { if(pistonPos > 0) pistonPos -= 0.1; if(!isBlocked && air > 0) air -= 0.03; }
    
    const vx = 300, vy = 220;
    // 1. Labels
    ctx.fillStyle = '#aaa'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
    ctx.fillText("SIGNAL (From Pedal)", vx, vy-145);
    ctx.fillText("SUPPLY (From Tank)", vx-155, vy+15);
    ctx.fillText("DELIVERY (To Brakes)", vx+200, vy-15);
    ctx.fillText("EXHAUST VENT", vx, vy+180);

    // 2. Physical Housing & Ports (No floating blocks)
    ctx.fillStyle = '#1a1e24'; ctx.beginPath(); ctx.roundRect(vx-80, vy-100, 160, 200, 15); ctx.fill();
    ctx.strokeStyle = '#444'; ctx.lineWidth = 2; ctx.stroke();
    // Internal Cutout
    ctx.fillStyle = '#0b1218'; ctx.fillRect(vx-50, vy-80, 100, 160);
    
    // Physical Port Pipes
    ctx.fillStyle = '#1a1e24';
    ctx.fillRect(vx-15, vy-130, 30, 30); // Signal
    ctx.fillRect(vx-120, vy-10, 40, 40); // Supply
    ctx.fillRect(vx+80, vy-40, 100, 40); // Delivery
    ctx.fillRect(vx-20, vy+100, 40, 40); // Exhaust

    // 3. The Piston
    const pY = pistonPos * 30;
    ctx.fillStyle = '#888'; 
    ctx.fillRect(vx-65, vy-70 + pY, 130, 15); // Piston head
    ctx.fillRect(vx-10, vy-55 + pY, 20, 60);  // Stem
    
    // 4. Air Flow
    ctx.globalAlpha = 0.7;
    if(state === 'down'){
      ctx.fillStyle = COLORS.accent; ctx.fillRect(vx-10, vy-130, 20, 60 + pY);
    }
    if(pY > 15){
      ctx.fillStyle = COLORS.accent;
      ctx.fillRect(vx-120, vy-5, 200, 30); // Main supply flow
      ctx.fillRect(vx+80, vy-5, 320, 30); // To chamber
    }
    ctx.globalAlpha = 1.0;

    // 5. Chamber & Wasp
    ctx.fillStyle = '#1a1e24'; ctx.fillRect(550, vy-80, 180, 120);
    ctx.fillStyle = `rgba(0, 198, 255, ${air})`; ctx.fillRect(550, vy-80, 180, 120);
    ctx.strokeStyle = '#444'; ctx.strokeRect(550, vy-80, 180, 120);
    
    if(state === 'up' && air > 0 && !isBlocked){
      ctx.fillStyle = COLORS.accent;
      for(let i=0; i<4; i++){ const fY = (Date.now()*0.2 + i*20)%60; ctx.beginPath(); ctx.arc(vx, vy+100+fY, 4, 0, Math.PI*2); ctx.fill(); }
    }
    if(isBlocked){
      ctx.fillStyle = COLORS.rust; ctx.beginPath(); ctx.arc(vx, vy+150, 40, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter'; ctx.fillText("MUD WASP NEST", vx, vy+165);
    }

    const msg = isBlocked && state === 'up' && air > 0.1 ? `<b style="color:${COLORS.danger}">FAULT: Exhaust Blocked!</b>` : (state === 'down' ? "Status: APPLYING" : "Status: RELEASING");
    document.getElementById('valveDesc').innerHTML = msg;
    requestAnimationFrame(draw);
  }
  draw();
})();
</script>
