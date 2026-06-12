const socket = io();

const pointSeq = ['0', '15', '30', '40', 'AD'];
function getNextPoint(current) {
    const idx = pointSeq.indexOf(current);
    if (idx < pointSeq.length - 1) return pointSeq[idx + 1];
    return current;
}
function getPrevPoint(current) {
    const idx = pointSeq.indexOf(current);
    if (idx > 0) return pointSeq[idx - 1];
    if (current !== '0' && !isNaN(parseInt(current))) {
        let v = parseInt(current);
        if (v > 0) return (v - 1).toString();
    }
    return current;
}

let currentState = null;

const els = {
    clubLogo: document.getElementById('clubLogo'),
    sponsorLogo: document.getElementById('sponsorLogo'),
    tournamentName: document.getElementById('tournamentName'),
    scoringSystem: document.getElementById('scoringSystem'),
    setFormat: document.getElementById('setFormat'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    qrMobile: document.getElementById('qrMobile'),
    mobileUrl: document.getElementById('mobileUrl'),

    p1Name: document.getElementById('p1Name'),
    p1Sets: document.getElementById('p1Sets'),
    p1Games: document.getElementById('p1Games'),
    p1Points: document.getElementById('p1Points'),
    p1ServeBtn: document.getElementById('p1ServeBtn'),
    
    p2Name: document.getElementById('p2Name'),
    p2Sets: document.getElementById('p2Sets'),
    p2Games: document.getElementById('p2Games'),
    p2Points: document.getElementById('p2Points'),
    p2ServeBtn: document.getElementById('p2ServeBtn'),
    
    isTieBreak: document.getElementById('isTieBreak'),
    isMatchTieBreak: document.getElementById('isMatchTieBreak'),
    desktopTimerDisplay: document.getElementById('desktopTimerDisplay')
};

function renderState(state) {
    if (!state) return;
    
    if (document.activeElement !== els.tournamentName) els.tournamentName.value = state.settings.tournamentName || '';
    els.scoringSystem.value = state.settings.scoringSystem || 'ad';
    els.setFormat.value = state.settings.setFormat || 'normal';

    if (document.activeElement !== els.p1Name) els.p1Name.value = state.match.player1.name;
    els.p1Sets.innerText = state.match.player1.sets;
    els.p1Games.innerText = state.match.player1.games;
    els.p1Points.innerText = state.match.player1.points;
    if (state.match.server === 1) {
        els.p1ServeBtn.classList.add('serve-active');
        els.p1ServeBtn.innerText = "🎾 Servis";
    } else {
        els.p1ServeBtn.classList.remove('serve-active');
        els.p1ServeBtn.innerText = "Servis Bende";
    }

    if (document.activeElement !== els.p2Name) els.p2Name.value = state.match.player2.name;
    els.p2Sets.innerText = state.match.player2.sets;
    els.p2Games.innerText = state.match.player2.games;
    els.p2Points.innerText = state.match.player2.points;
    if (state.match.server === 2) {
        els.p2ServeBtn.classList.add('serve-active');
        els.p2ServeBtn.innerText = "🎾 Servis";
    } else {
        els.p2ServeBtn.classList.remove('serve-active');
        els.p2ServeBtn.innerText = "Servis Bende";
    }

    els.isTieBreak.checked = state.match.isTieBreak;
    els.isMatchTieBreak.checked = state.match.isMatchTieBreak;
}

function updateServerState() {
    socket.emit('update-state', currentState);
}

socket.on('init-state', (data) => {
    currentState = data;
    renderState(currentState);
    if (data.qrMobile) els.qrMobile.src = data.qrMobile;
    if (data.mobileUrl) els.mobileUrl.innerText = data.mobileUrl;
});

socket.on('state-updated', (data) => {
    currentState = data;
    renderState(currentState);
});

socket.on('timer-updated', (timer) => {
    if (timer.active) {
        const mins = Math.floor(timer.remainingTime / 60);
        const secs = timer.remainingTime % 60;
        els.desktopTimerDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
        els.desktopTimerDisplay.innerText = '--';
    }
});

function compressImage(file, maxWidth = 600, maxHeight = 600) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height *= maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width *= maxHeight / height));
                        height = maxHeight;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png', 0.8));
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

els.saveSettingsBtn.addEventListener('click', async () => {
    currentState.settings.tournamentName = els.tournamentName.value;
    currentState.settings.scoringSystem = els.scoringSystem.value;
    currentState.settings.setFormat = els.setFormat.value;

    if (els.clubLogo.files.length > 0) {
        try { 
            currentState.settings.clubLogo = await compressImage(els.clubLogo.files[0]); 
            els.clubLogo.value = ""; // clear input so it doesn't recompress every save
        } catch (e) { console.error(e); }
    }
    if (els.sponsorLogo.files.length > 0) {
        try { 
            currentState.settings.sponsorLogo = await compressImage(els.sponsorLogo.files[0]); 
            els.sponsorLogo.value = ""; // clear input
        } catch (e) { console.error(e); }
    }

    updateServerState();
    els.saveSettingsBtn.innerText = "Kaydedildi!";
    setTimeout(() => { els.saveSettingsBtn.innerText = "Ayarları Kaydet ve Yayınla"; }, 2000);
});

els.p1Name.addEventListener('change', () => { currentState.match.player1.name = els.p1Name.value; updateServerState(); });
els.p2Name.addEventListener('change', () => { currentState.match.player2.name = els.p2Name.value; updateServerState(); });

document.getElementById('clearClubLogoBtn').addEventListener('click', () => {
    els.clubLogo.value = "";
    currentState.settings.clubLogo = "";
    updateServerState();
});

document.getElementById('clearSponsorLogoBtn').addEventListener('click', () => {
    els.sponsorLogo.value = "";
    currentState.settings.sponsorLogo = "";
    updateServerState();
});

function addPoint(playerNum) {
    let pWinner = playerNum === 1 ? currentState.match.player1 : currentState.match.player2;
    let pLoser = playerNum === 1 ? currentState.match.player2 : currentState.match.player1;

    if(currentState.match.isTieBreak || currentState.match.isMatchTieBreak) {
        pWinner.points = (parseInt(pWinner.points || 0) + 1).toString();
    } else {
        const isAd = currentState.settings.scoringSystem === 'ad';
        
        if (pWinner.points === '40' && pLoser.points === '40' && isAd) {
            pWinner.points = 'AD';
        } else if (pWinner.points === '40' && pLoser.points === 'AD') {
            pLoser.points = '40'; // Deuce
        } else if (pWinner.points === '40' || pWinner.points === 'AD') {
            // Win Game
            pWinner.points = '0';
            pLoser.points = '0';
            pWinner.games++;
            // Toggle server
            currentState.match.server = currentState.match.server === 1 ? 2 : 1;
        } else {
            pWinner.points = getNextPoint(pWinner.points);
        }
    }
    updateServerState(); 
}

// Player 1
document.getElementById('p1SetPlus').addEventListener('click', () => { currentState.match.player1.sets++; updateServerState(); });
document.getElementById('p1SetMinus').addEventListener('click', () => { if(currentState.match.player1.sets > 0) currentState.match.player1.sets--; updateServerState(); });
document.getElementById('p1GamePlus').addEventListener('click', () => { currentState.match.player1.games++; updateServerState(); });
document.getElementById('p1GameMinus').addEventListener('click', () => { if(currentState.match.player1.games > 0) currentState.match.player1.games--; updateServerState(); });
document.getElementById('p1PointPlus').addEventListener('click', () => { addPoint(1); });
document.getElementById('p1PointMinus').addEventListener('click', () => { currentState.match.player1.points = getPrevPoint(currentState.match.player1.points); updateServerState(); });
els.p1ServeBtn.addEventListener('click', () => { currentState.match.server = 1; updateServerState(); });

// Player 2
document.getElementById('p2SetPlus').addEventListener('click', () => { currentState.match.player2.sets++; updateServerState(); });
document.getElementById('p2SetMinus').addEventListener('click', () => { if(currentState.match.player2.sets > 0) currentState.match.player2.sets--; updateServerState(); });
document.getElementById('p2GamePlus').addEventListener('click', () => { currentState.match.player2.games++; updateServerState(); });
document.getElementById('p2GameMinus').addEventListener('click', () => { if(currentState.match.player2.games > 0) currentState.match.player2.games--; updateServerState(); });
document.getElementById('p2PointPlus').addEventListener('click', () => { addPoint(2); });
document.getElementById('p2PointMinus').addEventListener('click', () => { currentState.match.player2.points = getPrevPoint(currentState.match.player2.points); updateServerState(); });
els.p2ServeBtn.addEventListener('click', () => { currentState.match.server = 2; updateServerState(); });

document.getElementById('resetGameBtn').addEventListener('click', () => {
    currentState.match.player1.points = '0';
    currentState.match.player2.points = '0';
    updateServerState();
});

document.getElementById('resetSetsBtn').addEventListener('click', () => {
    currentState.match.player1.games = 0;
    currentState.match.player2.games = 0;
    updateServerState();
});

document.getElementById('resetMatchBtn').addEventListener('click', () => {
    if(confirm('Maçı sıfırlamak istediğinize emin misiniz?')) {
        currentState.match.player1.points = '0';
        currentState.match.player2.points = '0';
        currentState.match.player1.games = 0;
        currentState.match.player2.games = 0;
        currentState.match.player1.sets = 0;
        currentState.match.player2.sets = 0;
        currentState.match.server = 1;
        currentState.match.isTieBreak = false;
        currentState.match.isMatchTieBreak = false;
        updateServerState();
    }
});

els.isTieBreak.addEventListener('change', (e) => {
    currentState.match.isTieBreak = e.target.checked;
    currentState.match.player1.points = '0';
    currentState.match.player2.points = '0';
    updateServerState();
});
els.isMatchTieBreak.addEventListener('change', (e) => {
    currentState.match.isMatchTieBreak = e.target.checked;
    currentState.match.player1.points = '0';
    currentState.match.player2.points = '0';
    updateServerState();
});

// Animations
document.getElementById('animSetPointBtn').addEventListener('click', () => {
    socket.emit('trigger-animation', 'SET PUANI');
});
document.getElementById('animMatchPointBtn').addEventListener('click', () => {
    socket.emit('trigger-animation', 'MAÇ PUANI');
});

// Timers
document.getElementById('timerServeBtn').addEventListener('click', () => socket.emit('timer-command', { command: 'start', value: 25 }));
document.getElementById('timerRest60Btn').addEventListener('click', () => socket.emit('timer-command', { command: 'start', value: 60 }));
document.getElementById('timerRest120Btn').addEventListener('click', () => socket.emit('timer-command', { command: 'start', value: 120 }));
document.getElementById('timerStopBtn').addEventListener('click', () => socket.emit('timer-command', { command: 'stop' }));
document.getElementById('timerResetBtn').addEventListener('click', () => socket.emit('timer-command', { command: 'reset' }));
