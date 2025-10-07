// Updated SignalingHelperUI with QR support
import { showQRCode } from './QRCodeHelper.js';

export function createHostFlow(container, onlineClient) {
  container.innerHTML = `
    <div style="margin-bottom:8px;font-weight:600">Host (create offer)</div>
    <div id="host-status" style="margin-bottom:8px;color:#ffd">Waiting...</div>
    <textarea id="host-offer" style="width:100%;height:140px" readonly></textarea>
    <div style="margin-top:8px">
      <button id="host-copy">Copy Offer</button>
      <button id="host-show-qr" style="margin-left:8px">Show QR</button>
      <button id="host-paste-answer" style="margin-left:8px">Paste Answer & Finalize</button>
    </div>
    <div id="host-qr-area" style="margin-top:10px"></div>
  `;
  const status = container.querySelector('#host-status');
  const offerTA = container.querySelector('#host-offer');
  const copyBtn = container.querySelector('#host-copy');
  const pasteBtn = container.querySelector('#host-paste-answer');
  const qrBtn = container.querySelector('#host-show-qr');
  const qrArea = container.querySelector('#host-qr-area');

  (async () => {
    try {
      status.textContent = 'Creating offer and gathering ICE...';
      const offerSdp = await onlineClient.createManualOffer();
      offerTA.value = offerSdp;
      status.textContent = 'Offer ready. Send this to the remote player.';
    } catch (e) {
      status.style.color = '#ff8b8b';
      status.textContent = 'Failed to create offer: ' + (e && e.message ? e.message : e);
    }
  })();

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(offerTA.value);
      status.textContent = 'Offer copied to clipboard.';
    } catch {
      status.textContent = 'Copy failed. Select and copy manually.';
    }
  };

  qrBtn.onclick = () => {
    if (!offerTA.value) return alert('No offer to create QR.');
    showQRCode(qrArea, offerTA.value, { size: 300, label: 'Offer SDP' });
  };

  pasteBtn.onclick = async () => {
    const answer = prompt('Paste the answer SDP from the joiner here:');
    if (!answer) return alert('Answer is required to finish connection.');
    status.textContent = 'Applying answer...';
    try {
      await onlineClient.acceptManualAnswer(answer);
      status.textContent = 'Answer applied. Waiting for data channel...';
    } catch (e) {
      console.error(e);
      status.style.color = '#ff8b8b';
      status.textContent = 'Failed to accept answer. See console.';
    }
  };
}

export function createJoinFlow(container, onlineClient) {
  container.innerHTML = `
    <div style="margin-bottom:8px;font-weight:600">Join (paste offer)</div>
    <div id="join-status" style="margin-bottom:8px;color:#ffd">Waiting for offer...</div>
    <textarea id="join-offer" style="width:100%;height:140px" placeholder="Paste host offer SDP here"></textarea>
    <div style="margin-top:8px">
      <button id="join-create-answer">Create Answer</button>
      <button id="join-show-qr" style="margin-left:8px">Show QR</button>
      <button id="join-copy-answer" style="margin-left:8px">Copy Answer</button>
    </div>
    <textarea id="join-answer" style="width:100%;height:120px;margin-top:8px" readonly></textarea>
    <div id="join-qr-area" style="margin-top:10px"></div>
  `;
  const status = container.querySelector('#join-status');
  const offerTA = container.querySelector('#join-offer');
  const answerTA = container.querySelector('#join-answer');
  const createBtn = container.querySelector('#join-create-answer');
  const copyBtn = container.querySelector('#join-copy-answer');
  const qrBtn = container.querySelector('#join-show-qr');
  const qrArea = container.querySelector('#join-qr-area');

  createBtn.onclick = async () => {
    const remote = offerTA.value.trim();
    if (!remote) return alert('Paste the offer SDP from the host first.');
    status.textContent = 'Creating answer (gathering ICE)...';
    try {
      const answerSdp = await onlineClient.acceptManualOffer(remote);
      answerTA.value = answerSdp;
      status.textContent = 'Answer created. Copy and send it to the host.';
    } catch (e) {
      status.style.color = '#ff8b8b';
      status.textContent = 'Failed to create answer: ' + (e && e.message ? e.message : e);
    }
  };

  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(answerTA.value);
      status.textContent = 'Answer copied to clipboard.';
    } catch {
      status.textContent = 'Copy failed. Select and copy manually.';
    }
  };

  qrBtn.onclick = () => {
    if (!answerTA.value && !offerTA.value) return alert('Create the answer first or paste an offer.');
    // show QR for answer if available, else for offer (joiner may want to show answer QR)
    const text = answerTA.value || offerTA.value;
    showQRCode(qrArea, text, { size: 300, label: 'Answer SDP' });
  };
}