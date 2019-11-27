const {
    app,
    BrowserWindow,
    remote,
    ipcRenderer,
    ipcMain,
    webContents
} = require('electron');
const url = require('url');
const path = require('path');
var fs = require('fs');
var SerialPort = require('serialport');
const classes = require('./classes.js');

///////////////////////////////////////////////////////////////////       TITLEBAR
function maximizeWindow()
{
    if(remote.getCurrentWindow().isMaximized())
    {
        remote.getCurrentWindow().unmaximize();
        document.getElementById("maxbutton").textContent = '\u0031';
    }
    else
    {
        remote.getCurrentWindow().maximize();
        document.getElementById("maxbutton").textContent = '\u0032';
    }
}
function minimizeWindow()
{
    remote.getCurrentWindow().minimize();
}
function closeWindow()
{
    remote.getCurrentWindow().close();
}
///////////////////////////////////////////////////////////////////       ON WINDOW LOAD FUNCTION
function onWindowLoad()
{
    /*var split = Split(["#middlecontent","#sidebarright"],
    {
        minSize: [418, 160],
        expandToMin: true,
        gutterAlign: 'center',
        snapOffset: 10
     }); */


    //grab the changelog and open it in the chnagelog html
    fs.readFile('./changelog.txt', (err, data) => 
    { 
        if (err) throw err; 
        document.getElementById("ChangelogText").innerText = data.toString();
    }) 
    

    //set all main content to be off except opening panel
    document.getElementById("HomeContentPanel").style.display = "block";
    document.getElementById("StageContentPanel").style.display = "none";
    document.getElementById("AssetContentPanel").style.display = "none";
    document.getElementById("GroupContentPanel").style.display = "none";
    document.getElementById("CommandContentPanel").style.display = "none";
    document.getElementById("ModeContentPanel").style.display = "none";

    //put to console for dev issues
    console.log("DONE");
}
///////////////////////////////////////////////////////////////////       ON REFRESH FUNCTIONS
function regeneratePanels()
{

    //do groups first because assets are nested in groups
    remote.getGlobal('objectList')._GroupList.data().forEach(function(element) 
    {
        //for each asset make a new pane
        if(document.getElementById(element.Key + "GroupPanel") == null)
        {
            classes.group.prototype.createPaneForGroup.call(element.Value);
        }
    });
    //then do assets so that they can be nested.
    remote.getGlobal('objectList')._AssetList.data().forEach(function(element) 
    {
        //for each asset make a new pane
        if(document.getElementById(element.Key + "AssetPanel") == null)
        {
            classes.asset.prototype.createPaneForAsset.call(element.Value);
        }
    });
}
///////////////////////////////////////////////////////////////////       ON SECTION CLICK FUNCTIONS
function onHomeTabOpen()
{
    var x = document.getElementById("HomeContentPanel");
    if (x.style.display === "none") 
    {
        x.style.display = "block";
        //set all other content to false
        document.getElementById("StageContentPanel").style.display = "none";
        document.getElementById("AssetContentPanel").style.display = "none";
        document.getElementById("GroupContentPanel").style.display = "none";
        document.getElementById("CommandContentPanel").style.display = "none";
        document.getElementById("ModeContentPanel").style.display = "none";
        //set all other radio buttons to be unchecked
        document.getElementById("StageTabCheckbox").checked = false;
        document.getElementById("AssetTabCheckbox").checked = false;
        document.getElementById("GroupTabCheckbox").checked = false;
        document.getElementById("QueueTabCheckbox").checked = false;
        document.getElementById("ModeTabCheckbox").checked = false;
    } 
}
function onStageTabOpen()
{
    var x = document.getElementById("StageContentPanel");
    if (x.style.display === "none") 
    {
        x.style.display = "block";
        //set all other content to false
        document.getElementById("HomeContentPanel").style.display = "none";
        document.getElementById("AssetContentPanel").style.display = "none";
        document.getElementById("GroupContentPanel").style.display = "none";
        document.getElementById("CommandContentPanel").style.display = "none";
        document.getElementById("ModeContentPanel").style.display = "none";
        //set all other radio buttons to be unchecked
        document.getElementById("HomeTabCheckbox").checked = false;
        document.getElementById("AssetTabCheckbox").checked = false;
        document.getElementById("GroupTabCheckbox").checked = false;
        document.getElementById("QueueTabCheckbox").checked = false;
        document.getElementById("ModeTabCheckbox").checked = false;
    }
}
function onAssetTabOpen()
{
    var x = document.getElementById("AssetContentPanel");
    if (x.style.display === "none") 
    {
        x.style.display = "block";
        //set all other content to false
        document.getElementById("StageContentPanel").style.display = "none";
        document.getElementById("HomeContentPanel").style.display = "none";
        document.getElementById("GroupContentPanel").style.display = "none";
        document.getElementById("CommandContentPanel").style.display = "none";
        document.getElementById("ModeContentPanel").style.display = "none";
        //set all other radio buttons to be unchecked
        document.getElementById("StageTabCheckbox").checked = false;
        document.getElementById("HomeTabCheckbox").checked = false;
        document.getElementById("GroupTabCheckbox").checked = false;
        document.getElementById("QueueTabCheckbox").checked = false;
        document.getElementById("ModeTabCheckbox").checked = false;
    }
}
function onGroupTabOpen()
{
    var x = document.getElementById("GroupContentPanel");
    if (x.style.display === "none") 
    {
        x.style.display = "block";
        //set all other content to false
        document.getElementById("StageContentPanel").style.display = "none";
        document.getElementById("AssetContentPanel").style.display = "none";
        document.getElementById("HomeContentPanel").style.display = "none";
        document.getElementById("CommandContentPanel").style.display = "none";
        document.getElementById("ModeContentPanel").style.display = "none";
        //set all other radio buttons to be unchecked
        document.getElementById("StageTabCheckbox").checked = false;
        document.getElementById("AssetTabCheckbox").checked = false;
        document.getElementById("HomeTabCheckbox").checked = false;
        document.getElementById("QueueTabCheckbox").checked = false;
        document.getElementById("ModeTabCheckbox").checked = false;
    }
}
function onQueueTabOpen()
{
    var x = document.getElementById("CommandContentPanel");
    if (x.style.display === "none") 
    {
        x.style.display = "block";
        //set all other content to false
        document.getElementById("StageContentPanel").style.display = "none";
        document.getElementById("AssetContentPanel").style.display = "none";
        document.getElementById("GroupContentPanel").style.display = "none";
        document.getElementById("HomeContentPanel").style.display = "none";
        document.getElementById("ModeContentPanel").style.display = "none";
        //set all other radio buttons to be unchecked
        document.getElementById("StageTabCheckbox").checked = false;
        document.getElementById("AssetTabCheckbox").checked = false;
        document.getElementById("GroupTabCheckbox").checked = false;
        document.getElementById("HomeTabCheckbox").checked = false;
        document.getElementById("ModeTabCheckbox").checked = false;
    }
}
function onModeTabOpen()
{
    var x = document.getElementById("ModeContentPanel");
    if (x.style.display === "none") 
    {
        x.style.display = "block";
        //set all other content to false
        document.getElementById("StageContentPanel").style.display = "none";
        document.getElementById("AssetContentPanel").style.display = "none";
        document.getElementById("GroupContentPanel").style.display = "none";
        document.getElementById("CommandContentPanel").style.display = "none";
        document.getElementById("HomeContentPanel").style.display = "none";
        //set all other radio buttons to be unchecked
        document.getElementById("StageTabCheckbox").checked = false;
        document.getElementById("AssetTabCheckbox").checked = false;
        document.getElementById("GroupTabCheckbox").checked = false;
        document.getElementById("QueueTabCheckbox").checked = false;
        document.getElementById("HomeTabCheckbox").checked = false;
    }
}
///////////////////////////////////////////////////////////////////       ON ASSET BUTTON OR GROUP BUTTON CLICK
function newAssetPrompt(type)
{   
    if(type == 0) //CREATE NEW ASSET
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
        function (fileName) 
        {
            //make an empty asset
            createdAsset = new classes.asset();
            createdAsset.name = path.parse(fileName).base.replace(".json", "");
            createdAsset.filePath = path.dirname(fileName)
 
            if (fileName === undefined) return;
            fs.writeFile(fileName, JSON.stringify(createdAsset, null, 1), (err) => 
            {
                if (err) throw err;
            });
            
            //chuck the asset into the asset list and lode it on the screen
            if(remote.getGlobal('objectList')._AssetList.findKeyValuePair(createdAsset.name) == 0)
            {
                remote.getGlobal('objectList')._AssetList.addKeyValuePair(createdAsset.name,createdAsset);
                createdAsset.createPaneForAsset();
            }
            else
            {
                //say there was an error with the name
            }
        });
    }
    else if(type==1)//OPEN ASSET
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
        function (fileNames) 
        {
            if (fileNames === undefined) return;
            for (i = 0; i < fileNames.length; i++) 
            {
                openedObject = JSON.parse(fs.readFileSync(fileNames[i]));
                openedAsset = Object.assign(new classes.asset, openedObject);
                //chuck the asset into the asset list and lode it on the screen
                if(remote.getGlobal('objectList')._AssetList.findKeyValuePair(openedAsset.name) == 0)
                {
                    remote.getGlobal('objectList')._AssetList.addKeyValuePair(openedAsset.name,openedAsset);
                    openedAsset.createPaneForAsset();
                }
                else
                {
                    //say there was an error or the asset was opened
                }
            }
        });
    }
}
function newGroupPrompt(type)
{
    if(type == 0) //CREATE NEW GROUP
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
        function (fileName) 
        {
            //make an empty group
            createdGroup = new classes.group();
            createdGroup.name = path.parse(fileName).base.replace(".json", "");
            createdGroup.filePath = path.dirname(fileName)
 
            if (fileName === undefined) return;
            fs.writeFile(fileName, JSON.stringify(createdGroup, null, 1), (err) => 
            {
                if (err) throw err;
            });
            
            //chuck the asset into the asset list and lode it on the screen
            if(remote.getGlobal('objectList')._GroupList.findKeyValuePair(createdGroup.name) == 0)
            {
                remote.getGlobal('objectList')._GroupList.addKeyValuePair(createdGroup.name,createdGroup);
                createdGroup.createPaneForGroup();
            }
            else
            {
                //say there was an error with the name
            }
        });
    }
    else if(type==1)//OPEN ASSET
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
        function (fileNames) 
        {
            if (fileNames === undefined) return;
            for (i = 0; i < fileNames.length; i++) 
            {
                openedObject = JSON.parse(fs.readFileSync(fileNames[i]));
                openedGroup = Object.assign(new classes.group, openedObject);
                //chuck the asset into the asset list and lode it on the screen
                if(remote.getGlobal('objectList')._GroupList.findKeyValuePair(openedGroup.name) == 0)
                {
                    remote.getGlobal('objectList')._GroupList.addKeyValuePair(openedGroup.name,openedGroup);
                    openedGroup.createPaneForGroup();
                }
                else
                {
                    //say there was an error or the asset was opened
                }
            }
        });
    }
}
