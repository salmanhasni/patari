const observe = require("observe");

class Player {
  constructor() {
    const currentTrack = { name: "" };
    this.track = observe(currentTrack);
    this.listenForSongName();
  }

  listenForSongName() {
    const blacklist = ["LOADING"];
    setInterval(() => {
      const currentName = this.track.get("name").subject;
      this.getSongNamePromise().then((songName) => {
        if (currentName !== songName && !blacklist.includes(songName.toUpperCase())) {
          this.track.set("name", songName.trim());
        }
      });
    }, 1000);
  }

  setWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  getSongNamePromise() {
    return this.mainWindow.webContents.executeJavaScript("$(\".songName\").text()", true);
  }

  setTrackName() {
    setTimeout(() => {
      this.getSongNamePromise().then((songName) => {
        this.track.set("name", songName.trim());
      });
    }, 10);
  }

  playPause() {
    this.mainWindow.webContents.executeJavaScript("$(\".playerPlay\").click()");
    this.setTrackName();
  }

  nextTrack() {
    this.mainWindow.webContents.executeJavaScript("$(\".forward\").click()");
    this.setTrackName();
  }

  previousTrack() {
    this.mainWindow.webContents.executeJavaScript("$(\".playerMove\").click()");
    this.setTrackName();
  }
}


module.exports = Player;
