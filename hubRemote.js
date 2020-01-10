const classes = require('./classes.js');
const {
    app,
    BrowserWindow,
    remote,
    ipcRenderer,
    globalShortcut,
    ipcMain,
    webContents
} = require('electron');
const url = require('url');
const path = require('path');
const fs = require('fs');
const SerialPort = require('serialport');
const isDev = require('electron-is-dev');
var notification = require('./notification.js');

//global settings and project yolo
let settings;

///////////////////////////////////////////////////////////////////       TITLEBAR
function maximizeWindow() {
    if (remote.getCurrentWindow().isMaximized()) {
        remote.getCurrentWindow().unmaximize();
        //document.getElementById("maxbutton").textContent = '\u0031';
    }
    else {
        remote.getCurrentWindow().maximize();
        //document.getElementById("maxbutton").textContent = '\u0032';
    }
}
function minimizeWindow() {
    remote.getCurrentWindow().minimize();
}
function closeWindow() {
    //run on window close here
    onWindowClose();

    //change to allow for the tray to minimize
    remote.getCurrentWindow().close();
}
///////////////////////////////////////////////////////////////////       AUTOUPDATE BUTTON CODE
ipcRenderer.on('update_status_changed', (event, arg) => {
    document.getElementById("updateEntireAppButton").innerText = arg;
});

ipcRenderer.on('quit-and-install-reply', (event, arg) => {
    document.getElementById("updateEntireAppButton").innerText = arg;
});

function quitAndUpdate() {
    var isDownloadReady = 0;

    //is when update is downloaded
    if ("update downloaded, click to install" == document.getElementById("updateEntireAppButton").innerText) {
        isDownloadReady = 1;
    }

    //is when there is an update
    if ("update found, click to download" == document.getElementById("updateEntireAppButton").innerText) {
        isDownloadReady = 2;
    }

    //called when update button is clicked
    if (isDownloadReady == 1) {
        ipcRenderer.send('quit-and-install', true);
    }

    if (isDownloadReady == 2) {
        ipcRenderer.send('download-update', true);
        isDownloadReady == 0;
    }
}
///////////////////////////////////////////////////////////////////       ON WINDOW LOAD FUNCTION
function onWindowLoad() {
    //add the version to the app title
    document.getElementById("titleTopbar").innerText = "LpcHub " + remote.app.getVersion();

    //grab the changelog and open it in the chnagelog html
    fs.readFile('./changelog.txt', (err, data) => {
        if (err) throw err;
        document.getElementById("ChangelogText").innerText = data.toString();
    })

    //update the settings
    var filePath = './settings.json';
    settings = JSON.parse(fs.readFileSync(filePath));

    //check to see if targetProject is set and it still exists
    if (settings.targetProject != undefined && fs.existsSync(settings.targetProject)) {
        //open the project and assign it
        openedObject = JSON.parse(fs.readFileSync(settings.targetProject));
        openedProject = Object.assign(new classes.project, openedObject);
        //add each and every asset it has
        openedProject.openAllProjectObjects();
        //set the text of the home panel as a nice little touch
        document.getElementById("GeneralTopBarHomeText").innerText = openedProject.name + " Loaded";
    }

    //set the keybinds here
    generateShortcuts();

    //set all main content to be off except opening panel
    document.getElementById("HomeContentPanel").style.display = "block";
    document.getElementById("StageContentPanel").style.display = "none";
    document.getElementById("AssetContentPanel").style.display = "none";
    document.getElementById("GroupContentPanel").style.display = "none";
    document.getElementById("CommandContentPanel").style.display = "none";
    document.getElementById("ModeContentPanel").style.display = "none";

    //put to console for dev issues
    console.log("Done")
}
///////////////////////////////////////////////////////////////////       ON WINDOW END FUNCTION
function onWindowClose() {
    //save all changes to every object
    var assets = global.objectList._AssetList.data();
    for (var i = global.objectList._AssetList.length() - 1; 0 <= i; i--) {
        assets[i].Value.saveAsset();
    }
    //then do groups first because assets are nested in groups
    var groups = global.objectList._GroupList.data();
    for (var i = global.objectList._GroupList.length() - 1; 0 <= i; i--) {
        groups[i].Value.saveGroup();
    }
    //tdo commands because they nest both
    var commands = global.objectList._CommandList.data();
    for (var i = global.objectList._CommandList.length() - 1; 0 <= i; i--) {
        commands[i].Value.saveCommand();
    }

    //remove all keybinds

    //save all project assets to the projects
    if (settings.targetProject != undefined && fs.existsSync(settings.targetProject)) {
        //open the project and assign it
        openedObject = JSON.parse(fs.readFileSync(settings.targetProject));
        openedProject = Object.assign(new classes.project, openedObject);
        //save each project then close app
        openedProject.importAllOpenObjects();
        openedProject.saveAllProjectObjects(true);
    }
}
///////////////////////////////////////////////////////////////////       ON REFRESH FUNCTIONS
function regeneratePanels() {
    //tdo commands because they nest both
    global.objectList._CommandList.data().forEach(function (element) {
        //for each asset make a new pane
        if (document.getElementById(element.Key + "CommandPanel") == null) {
            //classes.command.prototype.createPaneForCommand.call(element.Value);
            element.Value.createPaneForCommand();
        }
    });
    //then do groups first because assets are nested in groups
    global.objectList._GroupList.data().forEach(function (element) {
        //for each asset make a new pane
        if (document.getElementById(element.Key + "GroupPanel") == null) {
            //classes.group.prototype.createPaneForGroup.call(element.Value);
            element.Value.createPaneForGroup();
        }
    });
    //then do assets so that they can be nested.
    global.objectList._AssetList.data().forEach(function (element) {
        //for each asset make a new pane
        if (document.getElementById(element.Key + "AssetPanel") == null) {
            //classes.asset.prototype.createPaneForAsset.call(element.Value);
            element.Value.createPaneForAsset();
        }
    });
}
///////////////////////////////////////////////////////////////////       GLOBAL SAVE FUNCTION
function globalSave() {
    //save all changes to every object
    var assets = global.objectList._AssetList.data();
    for (var i = global.objectList._AssetList.length() - 1; 0 <= i; i--) {
        assets[i].Value.saveAsset();
    }
    //then do groups first because assets are nested in groups
    var groups = global.objectList._GroupList.data();
    for (var i = global.objectList._GroupList.length() - 1; 0 <= i; i--) {
        groups[i].Value.saveGroup();
    }
    //tdo commands because they nest both
    var commands = global.objectList._CommandList.data();
    for (var i = global.objectList._CommandList.length() - 1; 0 <= i; i--) {
        commands[i].Value.saveCommand();
    }
    //save all project assets to the projects
    if (settings.targetProject != undefined && fs.existsSync(settings.targetProject)) {
        //open the project and assign it
        openedObject = JSON.parse(fs.readFileSync(settings.targetProject));
        openedProject = Object.assign(new classes.project, openedObject);
        //save each project then close app
        openedProject.importAllOpenObjects();
        openedProject.saveAllProjectObjects(true);
    }
}
///////////////////////////////////////////////////////////////////       REMOVE ALL OBJECTS
function purgeAllObjects() {
    var assets = global.objectList._AssetList.data();
    for (var i = global.objectList._AssetList.length() - 1; 0 <= i; i--) {
        assets[i].Value.closePaneForAsset();
    }
    //then do groups first because assets are nested in groups
    var groups = global.objectList._GroupList.data();
    for (var i = global.objectList._GroupList.length() - 1; 0 <= i; i--) {
        groups[i].Value.closePaneForGroup();
    }
    //tdo commands because they nest both
    var commands = global.objectList._CommandList.data();
    for (var i = global.objectList._CommandList.length() - 1; 0 <= i; i--) {
        commands[i].Value.closePaneForCommand();
    }

    //set the title to the projectname
    document.title = "Liquid Pixel Hub - No Projects Opened";
}
///////////////////////////////////////////////////////////////////       CREATE THE SHORTCUTS
function generateShortcuts() {
    var pos = 0;
    var foo = [
        'HomeContentPanel',
        'StageContentPanel',
        'AssetContentPanel',
        'GroupContentPanel',
        'CommandContentPanel',
        'ModeContentPanel'
    ];
    var template =
        [
            //The two shortcuts to sycle tabs
            {
                label: '',
                accelerator: 'Ctrl+S',
                click: () => {
                    globalSave();
                }
            },
            {
                label: '',
                accelerator: 'Shift+Up',
                click: () => {
                    //check current pos
                    for (var i = 0; i < document.getElementsByClassName("middlecontentpanel").length; i++) {
                        if (document.getElementsByClassName("middlecontentpanel")[i].style.display == "block") {
                            pos = foo.indexOf(document.getElementsByClassName("middlecontentpanel")[i].id)
                        }
                    }
                    pos = ((pos - 1) + 6) % 6;
                    onTabChanged(foo[pos]);
                }
            },
            {
                label: '',
                accelerator: 'Shift+Down',
                click: () => {
                    //check current pos
                    for (var i = 0; i < document.getElementsByClassName("middlecontentpanel").length; i++) {
                        if (document.getElementsByClassName("middlecontentpanel")[i].style.display == "block") {
                            pos = foo.indexOf(document.getElementsByClassName("middlecontentpanel")[i].id)
                        }
                    }
                    pos = (pos + 1) % 6;
                    onTabChanged(foo[pos])
                }
            },
            //opens and closes the searchbar
            {
                label: '',
                accelerator: 'Shift+Space',
                click: () => {
                    toggleSearchBar();
                }
            },
            //force reload the window
            {
                label: '',
                accelerator: 'Ctrl+Shift+R',
                click: () => {
                    globalSave();
                    remote.getCurrentWindow().reload();
                }
            },
            //toggle the kiosk mode of the current window
            {
                label: '',
                accelerator: 'F11',
                click: () => {
                    if (!remote.getCurrentWindow().isFullScreen()) {
                        remote.getCurrentWindow().setFullScreen(true);
                    }
                    else {
                        remote.getCurrentWindow().setFullScreen(false);
                    }
                }
            },
            //open and create an asset
            {
                label: '',
                accelerator: 'Shift+A',
                click: () => {
                    newAssetPrompt(1);
                }
            },
            {
                label: '',
                accelerator: 'Shift+Alt+A',
                click: () => {
                    newAssetPrompt(0);
                }
            },
            //open and create a group
            {
                label: '',
                accelerator: 'Shift+G',
                click: () => {
                    newGroupPrompt(1);
                }
            },
            {
                label: '',
                accelerator: 'Shift+Alt+G',
                click: () => {
                    newGroupPrompt(0);
                }
            },
            //open and create a command
            {
                label: '',
                accelerator: 'Shift+C',
                click: () => {
                    newCommandPrompt(1);
                }
            },
            {
                label: '',
                accelerator: 'Shift+Alt+C',
                click: () => {
                    newCommandPrompt(0);
                }
            }
        ];
    remote.getCurrentWindow().setMenu(remote.Menu.buildFromTemplate(template));
}
///////////////////////////////////////////////////////////////////       ON SECTION CLICK FUNCTIONS
function onTabChanged(panelName) {
    panels = document.getElementsByClassName("middlecontentpanel");
    for (var i = 0; i < panels.length; i++) {
        if (panels[i].id != panelName) {
            panels[i].style.display = "none";
            foo = panels[i].id.substring(0, panels[i].id.length - 12) + "TabCheckbox";
            document.getElementById(foo).checked = false;
        }
        else {
            panels[i].style.display = "block";
            foo = panels[i].id.substring(0, panels[i].id.length - 12) + "TabCheckbox";
            document.getElementById(foo).checked = true;
        }
    }
}
///////////////////////////////////////////////////////////////////       PROJECT FUNCTIONS GLOBAL SCALE
function setProject() {
    //will open a project.json and that will load all assets
    remote.dialog.showMessageBox(remote.getCurrentWindow(), {
        type: "question",
        buttons: ['Set Project', 'Unset Project'],
        title: "Set Default Project",
        message: "Do you wish to set a project or unset the current project?",
        detail: "Note: if you choose to set the project you must set the project or there will be an error produced. If you choose to unset the project will not open on the next launch.",
        defaultId: 0
    }, function (response) {
        if (response == 0) {
            //proceed to set
            remote.dialog.showOpenDialog({
                title: "Set Project",
                filters: [{
                    name: 'Json Files',
                    extensions: ['json']
                },
                {
                    name: 'All Files',
                    extensions: ['*']
                }
                ]
            },
                function (fileName) {
                    if (fileName != undefined) {
                        //set project and refresh
                        openedObject = JSON.parse(fs.readFileSync(fileName[0]));
                        openedProject = Object.assign(new classes.project, openedObject);

                        //purge the app items now
                        purgeAllObjects();
                        //then open the project apps
                        openedProject.openAllProjectObjects();
                        document.getElementById("GeneralTopBarHomeText").innerText = openedProject.name + " Loaded";

                        setProjectInSettings(openedProject);
                    }
                });
        }
        else {
            //remove from settings
            var targetProject = "";

            var data = { targetProject: targetProject };

            //the global filepath for setting
            var filePath = remote.app.getAppPath() + '\\' + "settings.json";

            if (filePath === undefined) return;
            fs.writeFile(filePath, JSON.stringify(data, null, 1), (err) => {
                if (err) throw err;
            });

            //change app
            purgeAllObjects();
            document.getElementById("GeneralTopBarHomeText").innerText = "No Projects Opened";
        }
    });
}
function createProject() {
    //will create a project.json and a repo and add it to auto open
    //create an empty asset with the same name as the chosen filename
    remote.dialog.showSaveDialog({
        title: "Create Project",
        filters: [{
            name: 'Json Files',
            extensions: ['json']
        },
        {
            name: 'All Files',
            extensions: ['*']
        }
        ]
    },
        function (fileName) {

            folderPath = path.parse(fileName).dir + "\\" + path.parse(fileName).name;
            filePath = folderPath + "\\" + path.parse(fileName).base;

            //console.log(folderPath)
            try {
                if (!fs.existsSync(folderPath)) {
                    fs.mkdirSync(folderPath, { recursive: false })
                }
            } catch (err) {
                console.error(err)
            }

            //make an empty project
            project = new classes.project();
            project.name = path.parse(fileName).name;
            project.folderPath = folderPath;
            project.importAllOpenObjects();
            project.saveAllProjectObjects();
            document.getElementById("GeneralTopBarHomeText").innerText = project.name + " Loaded";

            if (filePath === undefined) return;
            fs.writeFile(filePath, JSON.stringify(project, null, 1), (err) => {
                if (err) throw err;
            });

            //set project and refresh
            setProjectInSettings(project);
        });
}
function setProjectInSettings(p) {
    //put path of p into settings
    var targetProject = p.folderPath + '\\' + p.name + ".json";

    var data = { targetProject: targetProject };

    //the global filepath for setting
    var filePath = "./settings.json";

    if (filePath === undefined) return;
    fs.writeFile(filePath, JSON.stringify(data, null, 1), (err) => {
        if (err) throw err;
    });
}
///////////////////////////////////////////////////////////////////       OPENING OR GENERATION OF NEW ASSETS, GROUPS, AND COMMANDS
function newAssetPrompt(type) {
    if (type == 0) //CREATE NEW ASSET
    {
        //create an empty asset with the same name as the chosen filename
        remote.dialog.showSaveDialog({
            title: "Save Asset",
            filters: [{
                name: 'Json Files',
                extensions: ['json']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }
            ]
        },
            function (fileName) {
                //make an empty asset
                createdAsset = new classes.asset();
                createdAsset.name = path.parse(fileName).base.replace(".json", "");
                createdAsset.filePath = path.dirname(fileName) + '\\' + createdAsset.name + ".json";

                if (fileName === undefined) return;
                fs.writeFile(fileName, JSON.stringify(createdAsset, null, 1), (err) => {
                    if (err) throw err;
                });

                //chuck the asset into the asset list and lode it on the screen
                if (global.objectList._AssetList.findKeyValuePair(createdAsset.name) == 0) {
                    global.objectList._AssetList.addKeyValuePair(createdAsset.name, createdAsset);
                    createdAsset.createPaneForAsset();
                }
                else {
                    //say there was an error with the name
                }
            });
    }
    else if (type == 1)//OPEN ASSET
    {
        remote.dialog.showOpenDialog({
            title: "Open Assets",
            properties: ['multiSelections'],
            filters: [{
                name: 'Json Files',
                extensions: ['json']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }
            ]
        },
            function (fileNames) {
                if (fileNames === undefined) return;
                for (i = 0; i < fileNames.length; i++) {
                    openedObject = JSON.parse(fs.readFileSync(fileNames[i]));
                    openedAsset = Object.assign(new classes.asset, openedObject);
                    //chuck the asset into the asset list and lode it on the screen
                    if (global.objectList._AssetList.findKeyValuePair(openedAsset.name) == 0) {
                        global.objectList._AssetList.addKeyValuePair(openedAsset.name, openedAsset);
                        openedAsset.createPaneForAsset();
                    }
                    else {
                        //say there was an error or the asset was opened
                    }
                }
            });
    }
}
function newGroupPrompt(type) {
    if (type == 0) //CREATE NEW GROUP
    {
        //create an empty asset with the same name as the chosen filename
        remote.dialog.showSaveDialog({
            title: "Save Group",
            filters: [{
                name: 'Json Files',
                extensions: ['json']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }
            ]
        },
            function (fileName) {
                //make an empty group
                createdGroup = new classes.group();
                createdGroup.name = path.parse(fileName).base.replace(".json", "");
                createdGroup.filePath = path.dirname(fileName) + '\\' + createdGroup.name + ".json";

                if (fileName === undefined) return;
                fs.writeFile(fileName, JSON.stringify(createdGroup, null, 1), (err) => {
                    if (err) throw err;
                });

                //chuck the asset into the asset list and lode it on the screen
                if (global.objectList._GroupList.findKeyValuePair(createdGroup.name) == 0) {
                    global.objectList._GroupList.addKeyValuePair(createdGroup.name, createdGroup);
                    createdGroup.createPaneForGroup();
                }
                else {
                    //say there was an error with the name
                }
            });
    }
    else if (type == 1)//OPEN GROUP
    {
        remote.dialog.showOpenDialog({
            title: "Open Assets",
            properties: ['multiSelections'],
            filters: [{
                name: 'Json Files',
                extensions: ['json']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }
            ]
        },
            function (fileNames) {
                if (fileNames === undefined) return;
                for (i = 0; i < fileNames.length; i++) {
                    openedObject = JSON.parse(fs.readFileSync(fileNames[i]));
                    openedGroup = Object.assign(new classes.group, openedObject);
                    //chuck the asset into the asset list and lode it on the screen
                    if (global.objectList._GroupList.findKeyValuePair(openedGroup.name) == 0) {
                        global.objectList._GroupList.addKeyValuePair(openedGroup.name, openedGroup);
                        openedGroup.createPaneForGroup();
                    }
                    else {
                        //say there was an error or the asset was opened
                    }
                }
            });
    }
}
function newCommandPrompt(type) {
    if (type == 0) //CREATE NEW COMMAND
    {
        //create an empty asset with the same name as the chosen filename
        remote.dialog.showSaveDialog({
            title: "Save Command",
            filters: [{
                name: 'Json Files',
                extensions: ['json']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }
            ]
        },
            function (fileName) {
                //make an empty group
                createdCommand = new classes.command();
                createdCommand.name = path.parse(fileName).base.replace(".json", "");
                createdCommand.filePath = path.dirname(fileName) + '\\' + createdCommand.name + ".json";
                createdCommand.position = global.objectList._CommandList.length();

                if (fileName === undefined) return;
                fs.writeFile(fileName, JSON.stringify(createdCommand, null, 1), (err) => {
                    if (err) throw err;
                });

                //chuck the asset into the asset list and lode it on the screen
                if (global.objectList._CommandList.findKeyValuePair(createdCommand.name) == 0) {
                    global.objectList._CommandList.addKeyValuePair(createdCommand.name, createdCommand);
                    createdCommand.createPaneForCommand();
                }
                else {
                    //say there was an error with the name
                }
            });
    }
    else if (type == 1)//OPEN COMMAND
    {
        remote.dialog.showOpenDialog({
            title: "Open Commands",
            properties: ['multiSelections'],
            filters: [{
                name: 'Json Files',
                extensions: ['json']
            },
            {
                name: 'All Files',
                extensions: ['*']
            }
            ]
        },
            function (fileNames) {
                if (fileNames === undefined) return;
                for (i = 0; i < fileNames.length; i++) {
                    openedObject = JSON.parse(fs.readFileSync(fileNames[i]));
                    openedCommand = Object.assign(new classes.command, openedObject);
                    openedCommand.color = Object.assign(new classes.color, openedCommand.color);

                    //chuck the asset into the asset list and lode it on the screen
                    if (global.objectList._CommandList.findKeyValuePair(openedCommand.name) == 0) {
                        openedCommand.position = global.objectList._CommandList.length();
                        global.objectList._CommandList.addKeyValuePair(openedCommand.name, openedCommand);
                        openedCommand.createPaneForCommand();
                    }
                    else {
                        //say there was an error or the asset was opened
                    }
                }
            });
    }
}
///////////////////////////////////////////////////////////////////       COMMAND PLAYLIST FUNCTIONS
var commandPlaylist = [];
var commandPlaylistFinished = [];
var playlistInterupted = false;
var currentTimeout;
var currentInterval;

function jumpForwardInPlaylist() {

    clearTimeout(currentTimeout);
    currentTimeout = 0;
    //playlistInterupted = true;
}
function jumpBackwardInPlaylist() {
    //jump forward
    clearTimeout(currentTimeout);
    currentTimeout = 0;

    //then start a new cycle
    playlistInterupted = true;
}

function sleep(milliseconds) {
    currentPercent = 0;
    //return new Promise(resolve => setTimeout(resolve, milliseconds));
    return new Promise(function (resolve, reject) {
        currentTimeout = setTimeout(resolve, milliseconds);
        //run different code to check the time
        currentInterval = setInterval(function () {
            //set the progress bar
            currentPercent = currentPercent + ((10 / milliseconds) * 100);
            document.getElementById("leftSidebarCommandViewerControllerInsideProgress").style.width = currentPercent + "%";
            if (currentTimeout == 0) {
                resolve();
            }
        }, 10);
    });
}

async function startCommandPlaylistAsync() {
    //after running chnage all of the states of each command
    for (var i = 0; i < global.objectList._CommandList.data().length; i++) {
        global.objectList._CommandList.data()[i].Value.callEvent('command-previous');
    };
    //take every single element and push it into an array
    commandPlaylist = [...global.objectList._CommandList.data()];
    commandPlaylistFinished = [];
    //then for the length of the array count through

    while (commandPlaylist.length > 0) {
        //clean up the async code
        clearTimeout(currentTimeout);
        currentTimeout = 0;
        clearInterval(currentInterval);
        currentInterval = 0;
        //make a sleep and set it to global namespace
        var sleeper = sleep(commandPlaylist[0].Value.startDelay);
        await sleeper;
        //then jump backward
        if (playlistInterupted) {
            playlistInterupted = false;
            for (var i = 0; i < global.objectList._CommandList.data().length; i++) {
                global.objectList._CommandList.data()[i].Value.callEvent('command-previous');
            };
            if (commandPlaylistFinished.length > 1) {
                //then move the past to the current
                commandPlaylist.unshift(commandPlaylistFinished[0]);
                commandPlaylist.unshift(commandPlaylistFinished[1]);
                commandPlaylistFinished.shift();
                commandPlaylistFinished.shift();
            }
            else {
            }
        }
        //then send the command
        commandPlaylist[0].Value.sendCommand();
        //then set the state
        commandPlaylist[0].Value.callEvent('command-sent');
        //then remove this item from the command array and continue
        commandPlaylistFinished.unshift(commandPlaylist[0]);
        commandPlaylist.shift();
    }
    //clean up the async code
    clearTimeout(currentTimeout);
    currentTimeout = 0;
    clearInterval(currentInterval);
    currentInterval = 0;
}

///////////////////////////////////////////////////////////////////       COMMAND VIEWER FUNCTIONS
function hideOrShow() {
    //if showing close
    if (document.getElementById("leftSidebarCommandViewerCollapsible").style.display != "none") {
        //close the object
        document.getElementById("leftSidebarCommandViewerCollapsible").parentElement.getElementsByClassName("leftSidebarCommandViewerCollapseButton")[0].innerText = "Open";
        document.getElementById("leftSidebarCommandViewerCollapsible").parentElement.style.height = "70px";
        window.setTimeout(function () {
            document.getElementById("leftSidebarCommandViewerCollapsible").style.display = "none";
        }, 350);
    }
    else {
        //open the object
        document.getElementById("leftSidebarCommandViewerCollapsible").parentElement.getElementsByClassName("leftSidebarCommandViewerCollapseButton")[0].innerText = "Close";
        document.getElementById("leftSidebarCommandViewerCollapsible").style.display = "block";
        document.getElementById("leftSidebarCommandViewerCollapsible").parentElement.style.height = "33%";
    }
}
///////////////////////////////////////////////////////////////////       GLOBAL SEARCHBAR FUNCTIONS
function toggleSearchBar() {
    if (document.getElementById("globalBlackout").style.display == "none") {
        //open
        document.getElementById("globalBlackout").style.display = "block";
    }
    else {
        //vice versa
        document.getElementById("globalBlackout").style.display = "none";
    }
}
///////////////////////////////////////////////////////////////////       STAGE VIEW FUNCTIONS
function searchOnChange(searchTerm, containerId, caseSensitive = false)
{
    //clear the conatiner id before we put new items into it
    var container = document.getElementById(containerId);
    container.innerHTML = "";
    //then adhere to the case
    if(!caseSensitive)
    {
        searchTerm = searchTerm.toLowerCase();
    }
    //make a giant array containing every object
    var fullArray = global.objectList._AssetList.data().concat(global.objectList._GroupList.data().concat(global.objectList._CommandList.data()));
    //sort the array alphabetically
    fullArray.sort(function(a,b)
    {
        return a.Key.localeCompare(b.Key);
    });
    //search for the searchTerm supplied and display results in the container id
    for(var i = 0; i < fullArray.length; i++)
    {
        
        var tempKey = fullArray[i].Key;
        if(!caseSensitive)
        {
            tempKey = tempKey.toLowerCase();
        }        
        //check toi see if the string is equal to the key
        if(tempKey.includes(searchTerm))
        {
            //adds a suctom search reult
            fullArray[i].Value.generateSearchResult(containerId);
        }
    }
}