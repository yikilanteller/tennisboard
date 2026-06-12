const state = {
  settings: {
    language: 'tr',
    clubLogo: '', // URL or base64
    sponsorLogo: '',
    tournamentName: '#KortFinalleri',
    wifiSSID: 'Tennis_WIFI',
    wifiPassword: 'password123',
    scoringSystem: 'ad', // 'ad' (Deuce-Ad) or 'no-ad'
    setFormat: 'normal', // 'normal' (standard 3 sets) or 'match-tie-break'
  },
  match: {
    player1: { name: 'Oyuncu 1', points: '0', games: 0, sets: 0 },
    player2: { name: 'Oyuncu 2', points: '0', games: 0, sets: 0 },
    server: 1, // 1 or 2
    isTieBreak: false,
    isMatchTieBreak: false, // In the 3rd set
  },
  timer: {
    type: null, // 'serve', 'rest', null
    remainingTime: 0, // seconds
    active: false
  }
};

const pointSequence = ['0', '15', '30', '40', 'AD'];

// Helpers to update state logic
function resetGame() {
  state.match.player1.points = '0';
  state.match.player2.points = '0';
}

function resetMatch() {
  resetGame();
  state.match.player1.games = 0;
  state.match.player2.games = 0;
  state.match.player1.sets = 0;
  state.match.player2.sets = 0;
  state.match.isTieBreak = false;
  state.match.isMatchTieBreak = false;
  state.match.server = 1;
}

module.exports = { state, pointSequence, resetGame, resetMatch };
