export const defaultHTML = `<div class="scene">
  <div class="rings">
    <div class="ring ring-1"></div>
    <div class="ring ring-2"></div>
    <div class="ring ring-3"></div>
    <div class="ring ring-4"></div>
  </div>
  <div class="core">
    <div class="core-inner"></div>
  </div>
  <div class="label">
    <h1>NEXUS</h1>
    <p>Online Code Editor</p>
  </div>
</div>`;

export const defaultCSS = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0b0014;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
  overflow: hidden;
  color: white;
}

.scene {
  position: relative;
  width: 340px;
  height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  transition: transform 0.08s ease-out;
}

.rings {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
}

.ring-1 {
  width: 340px;
  height: 340px;
  border-top-color: #a855f7;
  border-right-color: rgba(168, 85, 247, 0.2);
  animation: spin 6s linear infinite;
}

.ring-2 {
  width: 260px;
  height: 260px;
  border-top-color: #22d3ee;
  border-left-color: rgba(34, 211, 238, 0.2);
  animation: spin 4.2s linear infinite reverse;
}

.ring-3 {
  width: 180px;
  height: 180px;
  border-top-color: #f472b6;
  border-bottom-color: rgba(244, 114, 182, 0.25);
  animation: spin 2.8s linear infinite;
}

.ring-4 {
  width: 110px;
  height: 110px;
  border: 1.5px dashed rgba(163, 163, 255, 0.4);
  animation: spin 8s linear infinite;
}

.core {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, #c084fc, #7e22ce);
  box-shadow: 
    0 0 30px #c084fc,
    0 0 60px #a855f7,
    0 0 120px rgba(168, 85, 247, 0.4);
  animation: pulse 2.2s ease-in-out infinite;
  position: relative;
  z-index: 10;
}

.core-inner {
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.75), transparent);
}

.label {
  position: absolute;
  bottom: -80px;
  text-align: center;
  letter-spacing: 8px;
}

h1 {
  font-size: 2rem;
  font-weight: 200;
  color: rgba(255,255,255,0.95);
  text-transform: uppercase;
}

p {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.3);
  margin-top: 8px;
  letter-spacing: 4px;
}

/* Animaciones */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.18); }
}`;

export const defaultJS = `const scene = document.querySelector('.scene');

document.addEventListener('mousemove', (e) => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (e.clientX - cx) / cx;
  const dy = (e.clientY - cy) / cy;

  scene.style.transform =
    \`perspective(800px) rotateY(\${dx * 22}deg) rotateX(\${-dy * 22}deg)\`;
});

document.addEventListener('mouseleave', () => {
  scene.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
});

// Estrellas de fondo
for (let i = 0; i < 80; i++) {
  const star = document.createElement('div');
  const size = Math.random() * 3 + 0.8;
  star.style.cssText = \`
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    width: \${size}px;
    height: \${size}px;
    top: \${Math.random() * 100}vh;
    left: \${Math.random() * 100}vw;
    background: white;
    opacity: \${Math.random() * 0.7 + 0.3};
    animation: twinkle \${Math.random() * 5 + 3}s ease-in-out infinite;
    animation-delay: \${Math.random() * 5}s;
    box-shadow: 0 0 \${size * 2}px rgba(255,255,255,0.6);
  \`;
  document.body.appendChild(star);
}

// Animación twinkle
const style = document.createElement('style');
style.textContent = \`
  @keyframes twinkle {
    0%, 100% { opacity: 0.9; transform: scale(1); }
    50% { opacity: 0.2; transform: scale(0.6); }
  }
\`;
document.head.appendChild(style);`;
