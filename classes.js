const dictionary = require('./dictionary.js');
const electron = require('electron');
const {
    app,
    BrowserWindow,
    Menu,
    remote,
    ipcRenderer,
    ipcMain
} = electron;
var fs = require('fs');
//var SerialPort = require('serialport');
const url = require('url');
const path = require('path');

class Mode {
    constructor(Name, Value) {
        this.Name = Name;
        this.Value = Value;
    }
}

class Color {
    constructor(Name, Value) {
        this.Name = Name;
        this.Value = Value;
        this.returnColor = () => {
            var result = this.Value.substring(4, this.Value.length - 1);
            return new Array(this.Name, result.split(','));
        }
    }
}



var _ModeList = new Array(
    new Mode("Off", 0),
    new Mode("Solid", 1),
    new Mode("Random Cloudy", 2),
    new Mode("Flash", 3),
    new Mode("Sweep", 4),
    new Mode("Twinkle", 5),
    new Mode("Random Twinkle", 6),
    new Mode("Random Flash", 7),
    new Mode("Theater Chase", 8),
    new Mode("Chroma", 9),
    new Mode("Fade In", 10),
    new Mode("Fade Out", 11),
    new Mode("Sudden Flash", 12),
    new Mode("Random Breath", 13),
    new Mode("Breath", 14),
    new Mode("Falling Stars", 15),
    new Mode("Xmas Chase", 16),
    new Mode("Pong", 17),
    new Mode("Waterfall", 18),
    new Mode("Lightning", 19),
    new Mode("Waves", 20),
    new Mode("Levels", 21),
    new Mode("Rain", 22),
    new Mode("Pause", 23),
    new Mode("Sound Sync", 24)
);


class Command {
    constructor(color  = new Color("Null", 'rgb(0,0,0)'), mode = _ModeList[0], delay = 0, random = 0, sound = 0) {
        
        this.position = 0;
        this.cubePosition = 0;
        this.type = "0"
        this.name = "";
        this.modes = _ModeList;
        this.color = color;
        this.mode = mode;
        this.delay = delay;
        this.random = random;
        this.sound = sound;
        this.command = "";

        this.generateCommand = () => {
            this.command = 'T' + this.type + 'C' + this.cubePosition + 'R' + this.color.returnColor[0] + 'G' + this.color.returnColor[1] + 'B' + this.color.returnColor[2] + 'M' + this.mode.Value + 'D' + this.delay + 'X' + this.random + '~';
        }

        this.modeName = () => {
            return this.mode.Value;
        }
    }
}

class Group {
    constructor() {
        this.name = "";
        this.filePath = "";
        this.state = "STBY"; //STBY BIND DISS RUN
        this.assetArray = new Array(); //keys instead of objects
        this.commandArray = new Array();
    }

    //call these via classes.group.prototype.createPaneForGroup.call(instance);

    createPaneForGroup() {
        //this creates the asset pane in the asset tab
        var groupPanelForGroupTab = document.createElement('div');
        groupPanelForGroupTab.className = "viewableGroup groupPanelContent"; //gives it the proper styling
        groupPanelForGroupTab.id = this.name + "GroupPanel"; //name of this specific asset
        groupPanelForGroupTab.innerHTML =
            `
            <!--This will house various bits of information for this group-->
            <div class="viewableGroupTitlePane">
                <div class="viewableGroupTitlePaneStatus">` + this.state + `</div>
                <div class="viewableGroupTitlePaneName">` + this.name + `</div>
                <button type="button" class="viewableGroupTitlePaneDisband"> DISBAND </button>
            </div>
            <!--This will hold all of the assets in this group-->
            <div class="viewableGroupAssetPaneWrapper">
                <div class="viewableGroupAssetPane">
                </div>
            </div>
            <!--This is a basic command panel in the asset panel so that test commands can be sent-->
            <div class="viewableGroupCommandConstruction">
                <p>To be added - a slim command construction panel for one off commands.</p>
            </div>`; //this is the gerneral inner html for the asset panel
        document.getElementById('groupPanelGroupHolder').appendChild(groupPanelForGroupTab);

        var groupPanelForRightSidebar = document.createElement('div');
        groupPanelForRightSidebar.className = "rightPanelGroupButton"; //gives it the proper styling
        groupPanelForRightSidebar.id = this.name + "GroupButton"; //name of this specific group
        groupPanelForRightSidebar.onclick = function () {
            onGroupTabOpen();
            var elmnt = document.getElementById(groupPanelForGroupTab.id);
            elmnt.scrollIntoView();
        };
        groupPanelForRightSidebar.innerHTML =
            `
                <div class="rightPanelGroupButtonThumbnail">` + this.state + `</div>
                <div class="rightPanelGroupButtonText">` + this.name + `</div>
            `;
        document.getElementById('RightPanelGroupHolder').appendChild(groupPanelForRightSidebar);

        //at this point run all updat code so that the Group is fully up to date
    }
}

class Asset {
    constructor() {
        this.type = ""; //this is the type of the box being run
        this.name = ""; //the name
        this.filePath = ""; //filepath that is used
        this.comport = "COM#"; //the comport number used
        this.baudRate = 9600; //the baudrate of the comprt
        this.state = "STBY"; //STBY RUN STOP SYNC
        //command array that hold all commands
        this.commandArray = new Array();
    }

    //call these via classes.asset.prototype.createPaneForAsset.call(instance);

    updateColors() {
        //add colors to array
    }

    createPaneForAsset() {
        //this creates the asset pane in the asset tab
        var assetPanelForAssetTab = document.createElement('div');
        assetPanelForAssetTab.className = "viewableAsset assetPanelContent"; //gives it the proper styling
        assetPanelForAssetTab.id = this.name + "AssetPanel"; //name of this specific asset
        assetPanelForAssetTab.innerHTML =
            `
            <!--This will hold all of the colors the asset has in its queue-->
                <div class="viewableAssetColorTable">
                    <p>No Commands Yet!</p>
                </div>
            <!--This is the basic data for the asset-->
                <div class="viewableAssetDataTable">
                    <input class="viewableAssetInput" type="text" name="assetName" value="` + this.name + `"> 
                    <input class="viewableAssetInput" type="text" name="comport" value="` + this.comport + `">
                    <input class="viewableAssetInput" type="text" name="baudrate" value="` + this.baudRate + `">
                    <input class="viewableAssetInput" type="text" name="filePath" value="` + this.filePath + `">
                    <select class="viewableAssetInput selectAssetInput">
                        <option value="0">Alone</option>
                        <option value="1">Master</option>
                        <option value="2">Slave</option>
                        <option value="3">Beacon</option>
                    </select>
                </div>
            <!--This will house various bits of information for this asset and possible more-->
                <div class="viewableAssetCommandGraph">
                    <p>This Asset has had no actions taken yet, please use it!  Time XX:XX:XX</p>
                </div>
            <!--This is a basic command panel in the asset panel so that test commands can be sent-->
                <div class="viewableAssetCommandConstruction">
                    <p>To be added - a slim command construction panel for one off commands.</p>
                </div>
            `; //this is the gerneral inner html for the asset panel
        document.getElementById('assetPanelAssetHolder').appendChild(assetPanelForAssetTab);

        var assetPanelForRightSidebar = document.createElement('div');
        assetPanelForRightSidebar.className = "rightPanelAssetButton"; //gives it the proper styling
        assetPanelForRightSidebar.id = this.name + "AssetButton"; //name of this specific asset
        assetPanelForRightSidebar.onclick = function () {
            onAssetTabOpen();
            var elmnt = document.getElementById(assetPanelForAssetTab.id);
            console.log(elmnt);
            elmnt.scrollIntoView();
        };
        assetPanelForRightSidebar.innerHTML =
            `
                <div class="rightPanelAssetButtonThumbnail">` + this.state + `</div>
                <div class="rightPanelAssetButtonText">` + this.name + `</div>
            `;
        document.getElementById('RightPanelAssetHolder').appendChild(assetPanelForRightSidebar);

        //make a microasset on the home panel
        var assetPanelForHomePanel = document.createElement('div');
        assetPanelForHomePanel.className = "HomePanelAssetSummary"; //gives it the proper styling
        assetPanelForHomePanel.id = this.name + "homePanelAssetPanel"; //name of this specific asset
        assetPanelForHomePanel.onclick = function () {
            onAssetTabOpen();
            var elmnt = document.getElementById(assetPanelForAssetTab.id);
            elmnt.scrollIntoView();
        };
        assetPanelForHomePanel.innerHTML =
            `
            <div class="HomePanelAssetSummaryName">` + this.name + `</div>
            <div class="HomePanelAssetSummaryColor">NULL</div>
            <div class="HomePanelAssetSummaryState">` + this.state + `</div>
            <div class="HomePanelAssetSummaryPortStatus">Not Connected</div>
        `;
        document.getElementById('HomeAssetSummary').appendChild(assetPanelForHomePanel);

        //make the nanoasset for each group in the group tab
        var assetPanelForGroupPanel = document.createElement('label');
        assetPanelForGroupPanel.id = this.name + "groupPanelAssetPanel";
        assetPanelForGroupPanel.innerHTML =
            `
            <input type="checkbox" id="` + this.name + "groupPanelAssetCheckbox" + `" class="viewableGroupAssetButtonCheck">
            <span class="viewableGroupAssetButton">
                <span class="viewableGroupAssetButtonThumbnail">` + this.state + `</span>
                <span class="viewableGroupAssetButtonText">` + this.name + `</span>
            </span>
        `;

        var elements = document.getElementsByClassName("viewableGroupAssetPane");
        for (var i = 0; i < elements.length; i++) {
            elements[i].appendChild(assetPanelForGroupPanel.cloneNode(true));
        }

        //at this point run all updat code so that the asset is fully up to date
    }
}

var _GroupList = new dictionary.Dictionary;

var _AssetList = new dictionary.Dictionary;

var _PortList = new dictionary.Dictionary;

var _CommandList = new dictionary.Dictionary;

var ColorsCustom = new Array(
    new Color("Dark Blue", 'rgb(8,44,102)'),
    new Color("Red", 'rgb(217,30,24)'),
    new Color("Purple", 'rgb(142,63,102)'),
    new Color("Yellow", 'rgb(255,239,73)'),
    new Color("Green", 'rgb(36,198,91)'),
    new Color("Mint Green", 'rgb(51,202,157)'),
    new Color("Pink", 'rgb(155,40,123)'),
    new Color("Orange", 'rgb(255,84,0)'),
    new Color("Light Blue", 'rgb(126,189,195)'),
    new Color("Army Green", 'rgb(42,197,98)'),
    new Color("Turquoise", 'rgb(3,247,235)')
);

global.modeList = {
    _ModeList
};
global.objectList = {
    _AssetList,
    _GroupList,
    _PortList,
    _CommandList
};
global.colorCustom = {
    ColorsCustom
};
module.exports = {
    mode: Mode,
    asset: Asset,
    color: Color,
    group: Group
};