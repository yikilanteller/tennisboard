const { state, resetGame, resetMatch } = require('./state');
const { getLocalIp } = require('./utils');
const QRCode = require('qrcode');

async function getQRs() {
  const localIp = getLocalIp();
  const mobileUrl = `http://${localIp}:3000/mobile.html`;
  
  try {
    const qrMobile = await QRCode.toDataURL(mobileUrl);
    return { qrMobile, mobileUrl };
  } catch(e) {
    return { qrMobile: '', mobileUrl };
  }
}

function setupSockets(io) {
  let timerInterval = null;

  io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);

    const qrs = await getQRs();

    socket.emit('init-state', {
      ...state,
      localIp: getLocalIp(),
      ...qrs
    });

    socket.on('update-state', async (newState) => {
      if (newState.match) state.match = { ...state.match, ...newState.match };
      if (newState.settings) {
        state.settings = { ...state.settings, ...newState.settings };
      }

      io.emit('state-updated', state);
    });

    socket.on('trigger-animation', (text) => {
      io.emit('show-animation', text);
    });

    socket.on('timer-command', ({ command, value }) => {
      // command: 'start', 'stop', 'reset'
      // value: time in seconds (e.g., 25, 90, 120)
      
      if (command === 'start') {
        if (timerInterval) clearInterval(timerInterval);
        state.timer.active = true;
        state.timer.remainingTime = value;
        state.timer.type = value === 25 ? 'serve' : 'rest';
        
        io.emit('timer-updated', state.timer);

        timerInterval = setInterval(() => {
          if (state.timer.remainingTime > 0) {
            state.timer.remainingTime--;
            io.emit('timer-updated', state.timer);
          } else {
            clearInterval(timerInterval);
            state.timer.active = false;
            io.emit('timer-updated', state.timer);
          }
        }, 1000);
      } else if (command === 'stop') {
        if (timerInterval) clearInterval(timerInterval);
        state.timer.active = false;
        io.emit('timer-updated', state.timer);
      } else if (command === 'reset') {
        if (timerInterval) clearInterval(timerInterval);
        state.timer.active = false;
        state.timer.remainingTime = 0;
        state.timer.type = null;
        io.emit('timer-updated', state.timer);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}

module.exports = { setupSockets };
