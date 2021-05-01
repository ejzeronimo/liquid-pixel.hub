const electron = require('electron');
const {
    app,
    BrowserWindow,
    Menu,
    MenuItem,
    ipcMain,
    webContents,
    globalShortcut,
    Tray,
    nativeImage,
    shell
} = electron;
const remote = require('@electron/remote/main').initialize()
const url = require('url');
const path = require('path');
const isDev = require('electron-is-dev');
const {
    autoUpdater
} = require("electron-updater");
const fs = require('fs');

// only here to initiate globals
let hubWindow;
let trayIcon;
const menu = new Menu();

// the image globals
let imageTray = nativeImage.createFromPath('./SvgIcons/TrayIcon.png');
let imageIcon = nativeImage.createFromPath('./SvgIcons/AppIcon.png');

//just the startup script, nothing besides that should go in here.
app.on('ready', openHub);

function openHub() {
    //make the tray icon
    trayIcon = new Tray(imageTray.resize({
        width: 16,
        height: 16
    }));
    trayIcon.setContextMenu(contextMenu);
    trayIcon.addListener("click", function () {
        hubWindow.show();
    })

    hubWindow = new BrowserWindow({
        width: 778,
        minWidth: 778,
        icon: imageIcon.resize({
            width: 32,
            height: 32
        }),
        show: false,
        movable: true,
        frame: false,
        closable: true,
        backgroundColor: '#FFF',
        worldSafeExecuteJavaScript: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true,
            experimentalFeatures: true
        }
    });
    hubWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'hubWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    hubWindow.on('close', function (event) {
        app.quit();
        //event.preventDefault();
        //hubWindow.hide();
    });
    hubWindow.on("ready-to-show", function () {
        hubWindow.setMenu(menu)
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

        var updaterSystem = setInterval(() => {
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
            clearInterval(updaterSystem);
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
    } else {
        //shortcuts only in dev mode
        globalShortcut.register('f2', function () {
            hubWindow.toggleDevTools();
        });
    }
}

//menu for the tray
var contextMenu = Menu.buildFromTemplate([{
        icon: imageIcon.resize({
            width: 16,
            height: 16
        }),
        label: 'LiquidPixel Hub ' + app.getVersion(),
        enabled: false
    },
    {
        type: 'separator'
    },
    {
        label: 'Check for Updates...',
        click: function () {
            autoUpdater.checkForUpdates();
        }
    },
    {
        label: 'Email the Programmer',
        click: function () {
            shell.openExternal("mailto:ejzeronik@gmail.com?subject=LPC_HELPDESK&body=");
        }
    },
    {
        label: 'Getting started',
        click: function () {
            shell.openExternal("https://www.youtube.com/watch?v=X7A7kmjybwA")
        }
    },
    {
        type: 'separator'
    },
    {
        label: 'Restart',
        click: function () {
            hubWindow.destroy();
            app.relaunch();
        }
    },
    {
        label: 'Quit LpcHub',
        click: function () {
            //app.isQuiting = true;
            hubWindow.destroy();
            app.quit();
        }
    },
]);