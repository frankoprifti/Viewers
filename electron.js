const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow;
let server;
const PORT = 1998;

function startServer(baseDir) {
  const server = http.createServer((req, res) => {
    let filePath = path.join(baseDir, req.url === '/' ? 'index.html' : req.url);

    if (filePath.includes('?')) {
      filePath = filePath.substr(0, filePath.indexOf('?'));
    }

    fs.access(filePath, fs.constants.F_OK, err => {
      if (err) {
        const indexPath = path.join(baseDir, 'index.html');
        fs.readFile(indexPath, (err, data) => {
          if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        });
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading file');
          return;
        }
        res.writeHead(200);
        res.end(data);
      });
    });
  });

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });

  return server;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false,
    },
  });

  console.log('Current directory:', __dirname);
  const isDev = process.env.NODE_ENV === 'development';

  let startUrl;
  if (isDev) {
    startUrl = 'http://localhost:3000';
  } else {
    let baseDir = null;
    const possibleBaseDirs = [
      path.join(__dirname, 'platform', 'app', 'dist'),
      path.join(__dirname, 'dist'),
      path.join(app.getAppPath(), 'platform', 'app', 'dist'),
    ];

    for (const testDir of possibleBaseDirs) {
      if (fs.existsSync(path.join(testDir, 'index.html'))) {
        baseDir = testDir;
        break;
      }
    }

    if (!baseDir) {
      console.error('Could not find base directory with index.html');
      startUrl = 'about:blank';
    } else {
      console.log('Found base directory:', baseDir);

      // Start server
      if (!server) {
        server = startServer(baseDir);
      }

      startUrl = `http://localhost:${PORT}`;
    }
  }

  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (server) {
    server.close();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
