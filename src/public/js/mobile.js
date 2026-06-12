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
    tNameDisplay: document.getElementById('tournamentNameDisplay'),
    rulesBadge: document.getElementById('rulesBadge'),
    
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
    
    timerBar: document.getElementById('timerBar'),
    mobileTimerDisplay: document.getElementById('mobileTimerDisplay')
};

function renderState(state) {
    if (!state) return;
    
    els.tNameDisplay.innerText = state.settings.tournamentName || '';
    const scoringText = state.settings.scoringSystem === 'ad' ? 'Avantajlı' : 'Altın Puan';
    const setText = state.settings.setFormat === 'normal' ? 'Normal Set' : 'Maç TB';
    els.rulesBadge.innerText = `${scoringText} | ${setText}`;

    els.p1Name.innerText = state.match.player1.name;
    els.p1Sets.innerText = state.match.player1.sets;
    els.p1Games.innerText = state.match.player1.games;
    els.p1Points.innerText = state.match.player1.points;
    if (state.match.server === 1) {
        els.p1ServeBtn.classList.add('active');
        els.p1ServeBtn.innerText = "🎾 Servis";
        document.getElementById('p1Card').style.borderColor = 'var(--accent-green)';
        document.getElementById('p2Card').style.borderColor = 'transparent';
    } else {
        els.p1ServeBtn.classList.remove('active');
        els.p1ServeBtn.innerText = "Servis";
    }

    els.p2Name.innerText = state.match.player2.name;
    els.p2Sets.innerText = state.match.player2.sets;
    els.p2Games.innerText = state.match.player2.games;
    els.p2Points.innerText = state.match.player2.points;
    if (state.match.server === 2) {
        els.p2ServeBtn.classList.add('active');
        els.p2ServeBtn.innerText = "🎾 Servis";
        document.getElementById('p2Card').style.borderColor = 'var(--accent-green)';
        document.getElementById('p1Card').style.borderColor = 'transparent';
    } else {
        els.p2ServeBtn.classList.remove('active');
        els.p2ServeBtn.innerText = "Servis";
    }
}

function updateServerState() {
    socket.emit('update-state', currentState);
}

socket.on('init-state', (data) => {
    currentState = data;
    renderState(currentState);
});

socket.on('state-updated', (data) => {
    currentState = data;
    renderState(currentState);
});

socket.on('timer-updated', (timer) => {
    if (timer.active) {
        els.timerBar.style.display = 'flex';
        const mins = Math.floor(timer.remainingTime / 60);
        const secs = timer.remainingTime % 60;
        els.mobileTimerDisplay.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
        els.timerBar.style.display = 'none';
    }
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

// Animations
document.getElementById('resetSetsBtn').addEventListener('click', () => {
    currentState.match.player1.games = 0;
    currentState.match.player2.games = 0;
    updateServerState();
});
document.getElementById('animSetPointBtn').addEventListener('click', () => socket.emit('trigger-animation', 'SET PUANI'));
document.getElementById('animMatchPointBtn').addEventListener('click', () => socket.emit('trigger-animation', 'MAÇ PUANI'));

// Timers
document.getElementById('timerServeBtn').addEventListener('click', () => socket.emit('timer-command', { command: 'start', value: 25 }));
document.getElementById('timerRest60Btn').addEventListener('click', () => socket.emit('timer-command', { command: 'start', value: 60 }));
document.getElementById('timerRest120Btn').addEventListener('click', () => socket.emit('timer-command', { command: 'start', value: 120 }));
document.getElementById('timerResetBtn').addEventListener('click', () => socket.emit('timer-command', { command: 'reset' }));
document.getElementById('stopTimerBtn').addEventListener('click', () => socket.emit('timer-command', { command: 'stop' }));
