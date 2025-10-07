// Simple on-screen vertical joystick for mobile touch controls.
// Instantiate with `new TouchJoystick(game, options)`
// options: { width: 100, height: 260, x: 12, y: canvasHeight - 280, playerIndex: 0 }
export default class TouchJoystick {
  constructor(game, options = {}) {
    this.game = game;
    this.canvas = game.canvas;
    this.playerIndex = options.playerIndex || 0;
    this.width = options.width || 100;
    this.height = options.height || 260;
    this.x = options.x || 12;
    this.y = options.y || (this.canvas.height - this.height - 12);
    this.container = document.createElement('div');
    this.container.id = 'touch-joystick';
    Object.assign(this.container.style, {
      position: 'fixed',
      left: `${this.x}px`,
      top: `${this.y}px`,
      width: `${this.width}px`,
      height: `${this.height}px`,
      borderRadius: '12px',
      background: 'rgba(30,30,30,0.25)',
      backdropFilter: 'blur(6px)',
      zIndex: 9998,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      touchAction: 'none',
      userSelect: 'none'
    });
    this.thumb = document.createElement('div');
    Object.assign(this.thumb.style, {
      width: `${Math.min(this.width, 60)}px`,
      height: `${Math.min(this.width, 60)}px`,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.12)',
      border: '2px solid rgba(255,255,255,0.18)',
      transform: 'translateY(0px)'
    });
    this.container.appendChild(this.thumb);
    document.body.appendChild(this.container);

    this.active = false;
    this.startY = null;
    this.offsetY = 0;

    this._bind();
    // Hide if not mobile-ish (we attempt to show only on touch devices)
    if (!('ontouchstart' in window)) this.hide();
  }

  _bind() {
    this.container.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      this.active = true;
      this.startY = t.clientY;
      this.offsetY = 0;
    }, { passive: false });

    this.container.addEventListener('touchmove', (e) => {
      if (!this.active) return;
      e.preventDefault();
      const t = e.touches[0];
      this.offsetY = t.clientY - this.startY;
      // clamp offset to visual range
      const max = (this.height / 2) - 20;
      const o = Math.max(-max, Math.min(max, this.offsetY));
      this.thumb.style.transform = `translateY(${o}px)`;
      // Map offset to canvas y position
      const rect = this.canvas.getBoundingClientRect();
      const scaleY = this.canvas.height / rect.height;
      // compute normalized -1..1 where negative is up
      const norm = -o / max;
      const paddle = this.game.players[this.playerIndex];
      if (paddle) {
        const centerY = this.canvas.height / 2 + norm * (this.canvas.height / 3);
        paddle.y = Math.max(0, Math.min(this.canvas.height - paddle.height, centerY - paddle.height / 2));
      }
    }, { passive: false });

    this.container.addEventListener('touchend', (e) => {
      this.active = false;
      this.startY = null;
      this.offsetY = 0;
      this.thumb.style.transform = 'translateY(0px)';
    }, { passive: false });
  }

  show() { this.container.style.display = 'flex'; }
  hide() { this.container.style.display = 'none'; }
  destroy() { try { this.container.remove(); } catch (e) {} }
}