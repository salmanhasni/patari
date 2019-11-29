
const {
  app, BrowserWindow, globalShortcut, ipcMain, Menu, Tray, Notification
} = require("electron"); // Module to control application life.
const path = require("path");
const https = require("https");
const fs = require("fs");
const Player = require("./player.js");
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let appIcon = null;

let playlist = [];
const player = new Player();
// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.requestSingleInstanceLock();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", () => {
  // Create the browser window.
  const preload = path.resolve(path.join(__dirname, "preload.js"));
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    title: "Patari",
    autoHideMenuBar: true,
    preload,
    icon: path.join(__dirname, "assets/patari-logo.png"),
    "web-preferences": { "node-integration": false }
  });


  // and load the index.html of the app.
  mainWindow.loadURL("http://patari.pk");
  player.setWindow(mainWindow);
  // Open the DevTools.
  // mainWindow.openDevTools();

  ipcMain.on("playlist_update", (event, args) => {
    playlist = args;
    updateTrayMenu();
  });


  globalShortcut.register("MediaPlayPause", () => {
    // player.playPause();
    mainWindow.webContents.send("mediabuttons", "playPauseTrack");
  });

  globalShortcut.register("MediaPreviousTrack", () => {
    player.previousTrack();
  });

  globalShortcut.register("MediaNextTrack", () => {
    player.nextTrack();
  });

  mainWindow.on("close", (event) => {
    // should run in background, so prevent window close and hide it
    event.preventDefault();
    mainWindow.hide();
    // app.quit();
  });

  // tray icon
  // console.log(path.join(__dirname, 'assets/patari-logo.png'));
  appIcon = new Tray(path.join(__dirname, "assets/tray.png"));
  appIcon.setToolTip("Patari");
  updateTrayMenu();
  // console.log(appIcon);
});

app.on("before-quit", () => {
  quit();
});

app.on("will-quit", () => {
  // Unregister a shortcut.
  // globalShortcut.unregister('ctrl+x');

  // Unregister all shortcuts.
  // quit(true);
});


function generateContextMenu() {
  let currentlyPlaying = false;

  for (var i in playlist) {
    if (playlist[i].isPlaying) currentlyPlaying = playlist[i];
  }


  const menu = [];

  if (currentlyPlaying) {
    menu.push({ label: `Playing: ${currentlyPlaying.title}`, enabled: false });

    // pull the thumbnail first
    const file = fs.createWriteStream(`${__dirname}/temp.jpg`);
    https.get(currentlyPlaying.thumbnail, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          // notify
          mainWindow.webContents.send("notify", {
            Title: currentlyPlaying.songtitle,
            body: currentlyPlaying.albumtitle,
            icon: `file:///${__dirname}/temp.jpg`
          });
        });
      });
    });
  }

  menu.push({
    label: "Play/Pause",
    click() {
      player.playPause();
    }
  });

  menu.push({
    label: "Open Patari",
    click() {
    // open app window
      mainWindow.show();
    }
  });

  menu.push({
    label: "Quit",
    click() {
    // open app window
      quit();
    }
  });

  menu.push({ type: "separator" });

  for (var i in playlist) {
    // closure because when clicked, i would be last of array
    (function (i) {
      const c = { type: "checkbox", label: playlist[i].title, checked: playlist[i].isPlaying };
      c.click = function () {
        mainWindow.webContents.send("playlist_play", playlist[i].id);
      };
      menu.push(c);
    }(i));
  }
  return Menu.buildFromTemplate(menu);
}

function updateTrayMenu() {
  const contextMenu = generateContextMenu();
  appIcon.setContextMenu(contextMenu);
}

let quitCalled = false;
function quit(dontcallquit) {
  if (quitCalled) return;

  quitCalled = true;
  if (mainWindow) {
    mainWindow.removeAllListeners("close");
    mainWindow.close();
  }

  globalShortcut.unregisterAll();
  if (!dontcallquit) app.quit();
}
