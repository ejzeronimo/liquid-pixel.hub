const electron = require('electron');
const {
    app,
    BrowserWindow,
    Menu,
    ipcMain,
    webContents,
    globalShortcut
} = electron;
const url = require('url');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require("electron-updater");
const fs = require('fs');

// only here to initiate globals

let hubWindow;

//just the startup script, nothing besides that should go in here.
app.on('ready', openHub);

function openHub() {
    hubWindow = new BrowserWindow({
        width: 778,
        minWidth: 778,
        icon: './SvgIcons/icon.ico',
        show: false,
        movable: true,
        frame: false,
        closable: true,
        backgroundColor: '#FFF',
        webPreferences: {
            nodeIntegration: true
        }
    });
    hubWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'hubWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    hubWindow.on('close', function () {
        app.quit();
        //hubWindow = null
    });
    hubWindow.on("ready-to-show", function () {
        //openLoginWindow();
        hubWindow.show();
    });

    //The part of the app that checks if in devlopment or not
    if (!isDev) {
        //check to see if settings exist
        var filePath = './settings.json';
        if (!fs.existsSync(filePath)) {
            //make that file
            var settings = {};
            fs.writeFile(filePath, JSON.stringify(settings, null, 1), (err) => {
                if (err) throw err;
            });
        }
        //running production
        autoUpdater.autoDownload = false;

        setInterval(() => {
            autoUpdater.checkForUpdates();
        }, 60000);

        //changes the status text in the update button
        autoUpdater.on("checking-for-update", () => {
            hubWindow.webContents.send('update_status_changed', "searching for updates");
        });

        autoUpdater.on("update-not-available", () => {
            hubWindow.webContents.send('update_status_changed', "no updates found");
        });

        autoUpdater.on("update-available", () => {
            hubWindow.webContents.send('update_status_changed', "update found, click to download");
        });

        autoUpdater.on('download-progress', (progressObj) => {
            hubWindow.webContents.send('update_status_changed', "update found, downloading " + progressObj.percent.toFixed(1) + "%");
        });

        //changes text and changes function of button
        autoUpdater.on("update-downloaded", () => {
            hubWindow.webContents.send('update_status_changed', "update downloaded, click to install");
        });

        //response that does install update
        ipcMain.on('quit-and-install', (event, arg) => {
            event.reply('quit-and-install-reply', "installing update now ...")
            autoUpdater.quitAndInstall();
        });

        //response that does install update
        ipcMain.on('download-update', (event, arg) => {
            autoUpdater.downloadUpdate(); //downloads the update
        });

        globalShortcut.register('f2', function () {
            hubWindow.toggleDevTools();
        });
    }
    else {
        //shortcuts only in dev mode
        globalShortcut.register('f1', function () {
            hubWindow.reload();

        });

        globalShortcut.register('f2', function () {
            hubWindow.toggleDevTools();
        });
    }
}