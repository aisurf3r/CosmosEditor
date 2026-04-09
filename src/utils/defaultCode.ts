export const defaultHTML = `<div class="scene">
  <div class="rings">
    <div class="ring ring-1"></div>
    <div class="ring ring-2"></div>
    <div class="ring ring-3"></div>
  </div>
  <div class="core">
    <div class="core-inner"></div>
  </div>
  <div class="label">
    <h1>COSMOS</h1>
    <p>move your cursor</p>
  </div>
</div>`;

export const defaultCSS = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #050510;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  overflow: hidden;
}

.scene {
  position: relative;
  width: 320px;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
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
  border: 1.5px solid transparent;
}

.ring-1 {
  width: 320px;
  height: 320px;
  border-top-color: #00d4aa;
  border-right-color: rgba(0, 212, 170, 0.15);
  animation: spin 5s linear infinite;
}

.ring-2 {
  width: 230px;
  height: 230px;
  border-top-color: #ff6b6b;
  border-left-color: rgba(255, 107, 107, 0.15);
  animation: spin 3.5s linear infinite reverse;
}

.ring-3 {
  width: 150px;
  height: 150px;
  border-top-color: #ffd93d;
  border-bottom-color: rgba(255, 217, 61, 0.15);
  animation: spin 2.5s linear infinite;
}

.core {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #40ffe0, #00a882);
  box-shadow:
    0 0 20px rgba(0, 212, 170, 0.8),
    0 0 50px rgba(0, 212, 170, 0.3),
    0 0 100px rgba(0, 212, 170, 0.1);
  animation: pulse 2.5s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

.core-inner {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.6), transparent);
}

.label {
  position: absolute;
  bottom: -70px;
  text-align: center;
  letter-spacing: 6px;
}

h1 {
  font-size: 1.6rem;
  font-weight: 200;
  color: rgba(255, 255, 255, 0.9);
  text-transform: uppercase;
}

p {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 3px;
  margin-top: 6px;
  text-transform: uppercase;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}`;

export const defaultJS = `const scene = document.querySelector('.scene');

document.addEventListener('mousemove', (e) => {
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const dx = (e.clientX - cx) / cx;
  const dy = (e.clientY - cy) / cy;
  scene.style.transform =
    'perspective(600px) rotateY(' + (dx * 18) + 'deg) rotateX(' + (-dy * 18) + 'deg)';
});

document.addEventListener('mouseleave', () => {
  scene.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg)';
});

for (let i = 0; i < 60; i++) {
  const star = document.createElement('div');
  const size = Math.random() * 2.5 + 0.5;
  star.style.cssText =
    'position:fixed;border-radius:50%;pointer-events:none;' +
    'width:' + size + 'px;height:' + size + 'px;' +
    'top:' + (Math.random() * 100) + 'vh;' +
    'left:' + (Math.random() * 100) + 'vw;' +
    'background:rgba(255,255,255,' + (Math.random() * 0.6 + 0.1) + ');' +
    'animation:twinkle ' + (Math.random() * 4 + 2) + 's ease-in-out infinite;' +
    'animation-delay:' + (Math.random() * 4) + 's;';
  document.body.appendChild(star);
}

const style = document.createElement('style');
style.textContent =
  '@keyframes twinkle{0%,100%{opacity:1;transform:scale(1)}' +
  '50%{opacity:0.2;transform:scale(0.5)}}';
document.head.appendChild(style);`;
