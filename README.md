```markdown
# Ultimate Pong — Manual and Optional Automatic Online Play

This repository is a modular, pure HTML/CSS/JS (ES modules) Ultimate Pong game.

Manual peer-to-peer (no server required)
- Open the game in two browsers/devices.
- Settings (O) -> Online -> Host: Create Offer. Copy the Offer SDP string and send it to the other player (chat, DM).
- Settings (O) -> Online -> Join: Paste the Offer from the Host and Create Answer. Copy the Answer back to the Host.
- Host pastes the Answer into the prompt shown after creating the Offer and finalizes. Data channel opens and input sync works.
- The helper UI in Settings makes this copy/paste workflow easy (copy buttons and status shown).

Optional signaling server (automatic)
- If you have or want an automated signaling server, you can run one and paste its ws URL into Settings -> Online -> Connect to Signaling Server.
- The client supports ws signaling (server must forward messages between clients in a room).
- The optional Node signaling server was previously provided but removed from the top-level to avoid npm prompts; request it if you want the server package (I can restore it separately).

TURN server / NAT traversal instructions
- For robust connectivity across NATs and strict networks, add a TURN server to the ICE servers config.
- You can obtain TURN credentials from a provider (coturn, Xirsys, Twilio, etc). Example ICE config:
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:YOUR_TURN_HOST:3478',
      username: 'TURN_USERNAME',
      credential: 'TURN_CREDENTIAL'
    }
  ]
- To use a TURN server, open src/OnlineMultiplayer.js and replace or extend the `this.config.iceServers` array with the TURN server entry above.
- TURN servers are required when both peers are behind symmetric NATs or certain corporate networks.

No React, no forced Node/npm
- The game frontend is pure ES modules and runs from a static server (Live Server, python -m http.server, etc.).
- You do NOT need Node or npm to run manual peer-to-peer play. The optional Node signaling server is available separately if you want automated matchmaking (it is not required).

Troubleshooting
- If the data channel never opens: check browser console, ensure you copied the full SDP, consider adding a TURN server to iceServers.
- Use the Debug overlay (Settings -> Debug) to see in-game event logs.