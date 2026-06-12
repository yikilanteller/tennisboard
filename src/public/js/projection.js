const socket = io();

const els = {
    clubLogo: document.getElementById('clubLogo'),
    sponsorLogo: document.getElementById('sponsorLogo'),
    tName: document.getElementById('tName'),
    
    p1Name: document.getElementById('p1Name'),
    p1Sets: document.getElementById('p1Sets'),
    p1Games: document.getElementById('p1Games'),
    p1Points: document.getElementById('p1Points'),
    p1Serve: document.getElementById('p1Serve'),
    
    p2Name: document.getElementById('p2Name'),
    p2Sets: document.getElementById('p2Sets'),
    p2Games: document.getElementById('p2Games'),
    p2Points: document.getElementById('p2Points'),
    p2Serve: document.getElementById('p2Serve'),
    
    timerOverlay: document.getElementById('timerOverlay'),
    timerLabel: document.getElementById('timerLabel'),
    timerValue: document.getElementById('timerValue')
};

// Helper for animation
function updateWithAnim(el, newValue) {
    if (el.innerText !== newValue.toString()) {
        el.innerText = newValue;
        el.classList.add('val-changed');
        setTimeout(() => {
            el.classList.remove('val-changed');
        }, 200);
    }
}

function renderState(state) {
    if (!state) return;

    // Settings
    els.tName.innerText = state.settings.tournamentName;
    
    if (state.settings.clubLogo) {
        els.clubLogo.src = state.settings.clubLogo;
        els.clubLogo.style.display = 'block';
    } else {
        els.clubLogo.style.display = 'none';
    }

    if (state.settings.sponsorLogo) {
        els.sponsorLogo.src = state.settings.sponsorLogo;
        els.sponsorLogo.style.display = 'block';
    } else {
        els.sponsorLogo.style.display = 'none';
    }

    // Player 1
    els.p1Name.innerText = state.match.player1.name;
    updateWithAnim(els.p1Sets, state.match.player1.sets);
    updateWithAnim(els.p1Games, state.match.player1.games);
    updateWithAnim(els.p1Points, state.match.player1.points);
    
    if (state.match.server === 1) {
        els.p1Serve.classList.add('active');
        els.p2Serve.classList.remove('active');
    } else {
        els.p1Serve.classList.remove('active');
        els.p2Serve.classList.add('active');
    }

    // Player 2
    els.p2Name.innerText = state.match.player2.name;
    updateWithAnim(els.p2Sets, state.match.player2.sets);
    updateWithAnim(els.p2Games, state.match.player2.games);
    updateWithAnim(els.p2Points, state.match.player2.points);
}

socket.on('init-state', (data) => {
    renderState(data);
});

socket.on('state-updated', (data) => {
    renderState(data);
});

socket.on('timer-updated', (timer) => {
    if (timer.active) {
        els.timerOverlay.classList.add('show');
        
        let label = 'SÜRE';
        if (timer.type === 'serve') label = 'SERVİS SÜRESİ';
        else if (timer.type === 'rest') label = 'MOLA';
        els.timerLabel.innerText = label;

        const mins = Math.floor(timer.remainingTime / 60);
        const secs = timer.remainingTime % 60;
        
        if (mins > 0) {
            els.timerValue.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
            els.timerValue.innerText = secs.toString();
        }
        
        // Add color warning if less than 5 secs
        if (timer.remainingTime <= 5) {
            document.querySelector('.timer-box').style.backgroundColor = 'var(--accent-red)';
            document.querySelector('.timer-box').style.color = 'white';
        } else {
            document.querySelector('.timer-box').style.backgroundColor = 'var(--accent-yellow)';
            document.querySelector('.timer-box').style.color = 'var(--bg-dark)';
        }

    } else {
        els.timerOverlay.classList.remove('show');
    }
});

let animTimeout;
socket.on('show-animation', (text) => {
    const overlay = document.getElementById('animationOverlay');
    const animText = document.getElementById('animationText');
    
    animText.innerText = text;
    overlay.classList.add('show');
    
    clearTimeout(animTimeout);
    animTimeout = setTimeout(() => {
        overlay.classList.remove('show');
    }, 5000); // 5 seconds duration
});

// Double click to toggle fullscreen
document.addEventListener('dblclick', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
});
