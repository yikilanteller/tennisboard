let electronApp, BrowserWindow, ipcMain;
let isElectron = false;
try {
  const electron = require('electron');
  electronApp = electron.app;
  BrowserWindow = electron.BrowserWindow;
  ipcMain = electron.ipcMain;
  isElectron = true;
} catch (e) {
  console.log("Electron yüklenemedi. Sadece web sunucusu modunda başlatılıyor...");
}

const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
const { getLocalIp } = require('./src/server/utils');
const { setupSockets } = require('./src/server/socketManager');

// Express & Socket.io Setup
const expressApp = express();
const server = http.createServer(expressApp);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from src/public
expressApp.use(express.static(path.join(__dirname, 'src/public')));

const PORT = 3000;
let mainWindow = null;
let projectionWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Skor Tabela - Kontrol Paneli',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the desktop panel from the local server
  mainWindow.loadURL(`http://localhost:${PORT}/desktop.html`);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function createProjectionWindow() {
  if (projectionWindow) return; // Prevent multiple windows

  projectionWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Projeksiyon Ekranı',
    frame: false,
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  projectionWindow.loadURL(`http://localhost:${PORT}/projection.html`);

  projectionWindow.on('closed', function () {
    projectionWindow = null;
  });
}

if (isElectron) {
  // IPC handler to open projection
  ipcMain.on('open-projection', () => {
    createProjectionWindow();
  });

  electronApp.on('ready', () => {
    // Start server then open window
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      setupSockets(io);
      createWindow();
    });
  });

  electronApp.on('window-all-closed', function () {
    if (process.platform !== 'darwin') electronApp.quit();
  });

  electronApp.on('activate', function () {
    if (mainWindow === null) createWindow();
  });
} else {
  // Run standalone web server
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================================`);
    console.log(`Sunucu Başlatıldı!`);
    console.log(`Lütfen tarayıcınızdan şu adrese gidin:`);
    console.log(`http://localhost:${PORT}/desktop.html`);
    console.log(`========================================================\n`);
    setupSockets(io);
  });
}
