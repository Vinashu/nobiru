const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const say = require('say');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: true,
    }
  });

  mainWindow.loadFile('public/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle the text-to-speech request from the renderer process
ipcMain.on('speak', (event, text) => {
  if (process.platform !== 'darwin') {
    say.speak(text, 'Kyoko');
  } else {
    say.speak(text, 'Microsoft Haruka Desktop');
    // say.speak(text, 'Haruka');
  }
});
