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

// only here to initiate globals
const classes = require('./classes.js');

let hubWindow;
let loginWindow;

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
        nodeIntegration: true,
        //The lines below solved the issue
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
    });
    hubWindow.on("ready-to-show", function () {
        //openLoginWindow();
        hubWindow.show();
        //The part of the app that checks if in devlopment or not
        if (!isDev) {

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
    });
}

function openLoginWindow() {
    loginWindow = new BrowserWindow({
        icon: './SvgIcons/icon.ico',
        width: 332,
        height: 332,
        backgroundColor: '#FFF',
        show: false,
        resizable: false,
        parent: hubWindow,
        modal: true,
        movable: true,
        frame: false,
        nodeIntegration: true
    });
    loginWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'loginWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    loginWindow.setMenu(null);
    loginWindow.on('closed', function () {
        var temp = BrowserWindow.getAllWindows();
        var counter = 0;
        temp.forEach(function (value) {
            if (!value.isVisible()) {
                counter++;
            }
        });
        if (counter > 0) {
            app.quit();
        }
    });
    loginWindow.on('ready-to-show', loginWindow.show);
    //loginWindow.toggleDevTools();
}
//the menu at the top of said window
if (process.platform == 'darwin') {
    hubMenuTemplate.unshift({});
}

const hubMenuTemplate = [{
    label: 'Menu',
    submenu: [{
        label: 'Dev',
        accelerator: process.platform == 'darwin' ? 'Command+D' : 'Ctrl+D',
        click() {
            hubWindow.toggleDevTools();
        }
    },
    {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
            app.quit();
        }
    }
    ]
},
{
    label: 'File',
    submenu: [{
        label: 'New Asset',
        click() {
            openAsset();
        }
    }]
},
{
    label: 'Window',
    submenu: [{
        label: 'Asset Settings',
        click() { }
    }]
}
]