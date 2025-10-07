// Updated SettingsMenu.js (ARIA + QR + TURN UI) - replace existing SettingsMenu with this file
import { createHostFlow, createJoinFlow } from './SignalingHelperUI.js';

export default class SettingsMenu {
  constructor(game) {
    this.game = game;
    this.node = null;
    this.visible = false;
    this.build();
  }

  build() {
    if (!this.node) {
      this.node = document.createElement('div');
      Object.assign(this.node.style, {
        position: 'fixed', top: '60px', right: '40px', background: '#232526ee',
        padding: '18px', borderRadius: '10px', zIndex: 999, color: '#fff',
        fontFamily: 'Segoe UI, Arial', display: 'none', width: '360px'
      });
      document.body.appendChild(this.node);
    }

    const debugLabel = (this.game.debug && this.game.debug.visible) ? 'Hide Debug' : 'Show Debug';

    this.node.innerHTML = `
      <div style="font-weight:bold;margin-bottom:8px">Settings</div>
      <div style="margin-bottom:8px">Difficulty: <button id="diff-btn" aria-label="Change difficulty">${this.game.difficulty.getCurrent().name}</button></div>
      <div style="margin-bottom:8px">Theme: <button id="theme-btn" aria-label="Change theme">${this.game.theme.getCurrent().name}</button></div>
      <div style="margin-bottom:8px">Sound: <button id="mute-btn" aria-label="Toggle sound">${this.game.audio.muted ? "Off" : "On"}</button></div>
      <div style="margin-bottom:8px">Multiplayer (local): <button id="multi-btn" aria-label="Toggle local multiplayer">${this.game.multiplayer ? "On" : "Off"}</button></div>
      <hr style="border:0;margin:8px 0;border-top:1px solid #333">
      <div style="font-weight:bold;margin-bottom:6px">Online (peer-to-peer)</div>
      <div style="margin-bottom:8px;display:flex;gap:8px">
        <button id="host-btn" aria-label="Host manual online game">Host (Create Offer)</button>
        <button id="join-btn" aria-label="Join manual online game">Join (Paste Offer)</button>
      </div>
      <div style="margin-bottom:8px">
        <input id="server-url" aria-label="Signaling server URL" placeholder="Optional signaling ws://host:port" style="width:100%;padding:6px;border-radius:6px;border:1px solid #333;background:#111;color:#fff" />
        <div style="margin-top:6px"><button id="server-btn" aria-label="Connect signaling server">Connect to Signaling Server</button></div>
      </div>
      <div style="margin-bottom:8px">Debug: <button id="debug-btn" aria-label="Toggle debug overlay">${debugLabel}</button></div>
      <div style="margin-bottom:8px">TURN (optional): <input id="turn-url" aria-label="TURN server URL" placeholder="turn:host:3478" style="width:100%;padding:6px;margin-top:6px;border-radius:6px;border:1px solid #333;background:#111;color:#fff" /></div>
      <div style="margin-bottom:8px">Load Local Audio: <button id="local-audio-btn" aria-label="Load local audio">Try Load</button></div>
      <div style="text-align:right"><button id="close-btn" aria-label="Close settings">Close</button></div>
      <div id="online-area" style="margin-top:12px"></div>
    `;

    this.node.querySelector('#diff-btn').onclick = () => { this.game.difficulty.next(); this.game.saveSettings(); this.build(); };
    this.node.querySelector('#theme-btn').onclick = () => { this.game.theme.nextTheme(); this.game.saveSettings(); this.build(); };
    this.node.querySelector('#mute-btn').onclick = () => { this.game.audio.toggleMute(); this.game.saveSettings(); this.build(); };
    this.node.querySelector('#multi-btn').onclick = () => { this.game.toggleMultiplayer(); this.game.saveSettings(); this.build(); };
    this.node.querySelector('#debug-btn').onclick = () => { if (this.game.debug) { this.game.debug.toggle(); this.build(); } };
    this.node.querySelector('#local-audio-btn').onclick = async () => {
      try {
        const ok = this.game.audio.loadLocalAssets('/assets/audio/');
        if (ok) { alert('Tried loading local audio. Ensure files exist in /assets/audio'); this.build(); }
      } catch (e) { alert('Error loading local audio. Check console.'); }
    };

    // Host
    this.node.querySelector('#host-btn').onclick = async () => {
      const onlineArea = this.node.querySelector('#online-area');
      onlineArea.innerHTML = '';
      if (!this.game.online) {
        const Online = (await import('./OnlineMultiplayer.js')).default;
        this.game.online = new Online(this.game, null);
        this.game.online.onRemoteInput = (input) => {
          if (this.game.players[1]) {
            if (typeof input.y === 'number') this.game.players[1].y = input.y;
            if (input.up !== undefined) this.game.players[1].moveUp = !!input.up;
            if (input.down !== undefined) this.game.players[1].moveDown = !!input.down;
          }
        };
      }
      createHostFlow(onlineArea, this.game.online);
    };

    // Join
    this.node.querySelector('#join-btn').onclick = async () => {
      const onlineArea = this.node.querySelector('#online-area');
      onlineArea.innerHTML = '';
      if (!this.game.online) {
        const Online = (await import('./OnlineMultiplayer.js')).default;
        this.game.online = new Online(this.game, null);
        this.game.online.onRemoteInput = (input) => {
          if (this.game.players[0]) {
            if (typeof input.y === 'number') this.game.players[0].y = input.y;
            if (input.up !== undefined) this.game.players[0].moveUp = !!input.up;
            if (input.down !== undefined) this.game.players[0].moveDown = !!input.down;
          }
        };
      }
      createJoinFlow(onlineArea, this.game.online);
    };

    // Signaling server connect
    this.node.querySelector('#server-btn').onclick = async () => {
      const url = this.node.querySelector('#server-url').value.trim();
      if (!url) return alert('Paste signaling server URL first (ws://host:port).');
      const Online = (await import('./OnlineMultiplayer.js')).default;
      if (this.game.online) {
        try { this.game.online.stop(); } catch {}
      }
      this.game.online = new Online(this.game, url);
      this.game.online.onRemoteInput = (input) => {
        if (this.game.players[1] && typeof input.y === 'number') this.game.players[1].y = input.y;
      };
      alert('Signaling client created. Use game.online.start(roomId) to join a room.');
    };

    // TURN apply handler
    const turnInput = this.node.querySelector('#turn-url');
    turnInput.onchange = () => {
      const val = turnInput.value.trim();
      if (!val) return alert('Enter a TURN url like: turn:host:3478 (credentials must be added in code).');
      if (this.game.online && this.game.online.config) {
        this.game.online.config.iceServers.push({ urls: val });
        alert('TURN URL added to current Online client config (if present).');
      } else {
        alert('TURN will be applied when a new Online client is created.');
      }
    };

    this.node.querySelector('#close-btn').onclick = () => this.hide();
  }

  show() { this.build(); this.node.style.display = 'block'; this.visible = true; }
  hide() { this.node.style.display = 'none'; this.visible = false; }
  toggle() { this.visible ? this.hide() : this.show(); }
}