const observe = require("observe");
const https = require("https");
const fs = require("fs");

const {
  Notification
} = require("electron")

class Player {
  constructor() {
    const currentTrack = { name: "" };
    this.track = observe(currentTrack);
    this.listenForSongName();
    this.trackOnChange();
  }

  listenForSongName() {
    const blacklist = ["LOADING"];
    setInterval(() => {
      const currentName = this.track.get("name").subject;
      this.getSongName_P().then((songName) => {
        if (currentName !== songName && !blacklist.includes(songName.toUpperCase())) {
          this.track.set("name", songName);
        }
      });
    }, 1000);
  }

  trackOnChange() {
    this.track.on("change", (change) => {
      if (change.property[0] === "name") {
        const songName = this.track.get("name").subject;
        const trackIcon = fs.createWriteStream(`${__dirname}/temp.jpg`);
        this.mainWindow.webContents.executeJavaScript("$(\".trackName\").map(function() { return $(this).text() }).toArray();", true).then((tracks)=>{
          if(tracks.length) {
            let i = 0;
            tracks.forEach((t)=> {
              if(this.cleanSongName(t).toLowerCase() == songName.toLowerCase()){
                this.mainWindow.webContents.executeJavaScript(`$(".trackName").css("color", "#151515;"); $($(".trackName")[${i}]).css("color", "#1abc9c");`);
              }
              i++;
            });
          }
        }).catch(e=> console.error(e));
        if (Notification.isSupported()) {
          this.mainWindow.webContents.executeJavaScript("$('img[ng-show=\"playerState.currentSongInstance\"]').attr(\"ng-src\");", true).then((link)=>{
            https.get(link, (response) => {
              response.pipe(trackIcon);
              trackIcon.on("finish", () => {
                trackIcon.close(() => {
                  const not = new Notification({
                    icon: `${__dirname}/temp.jpg`,
                    title: songName,
                    silent: true
                  });
                  not.show();
                });
              });
            });
          });
        }
      }
    });
  }

  setWindow(mainWindow) {
    this.mainWindow = mainWindow;
  }

  getSongName_P() {
    const self = this;
    return this.mainWindow.webContents.executeJavaScript("$(\".currentSong>.songName\").text()", true).then((songName) => self.cleanSongName(songName));
  }

  cleanSongName(songName) {
    return songName.trim().replace(/\s\s+/g, ' ');
  }

  playPause() {
    this.mainWindow.webContents.executeJavaScript("$(\".playerPlay\").click()");
  }

  nextTrack() {
    this.mainWindow.webContents.executeJavaScript("$(\".forward\").click()");
  }

  previousTrack() {
    this.mainWindow.webContents.executeJavaScript("$(\".playerMove\").click()");
  }
}


module.exports = Player;
