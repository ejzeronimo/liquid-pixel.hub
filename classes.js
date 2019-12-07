const dictionary = require('./dictionary.js');
const {
    app,
    BrowserWindow,
    remote,
    ipcRenderer,
    ipcMain,
    webContents
} = require('electron');
var fs = require('fs');
var SerialPort = require('serialport');
const url = require('url');
const path = require('path');


///////////////////////////////////////////////////////////////////       BASE CLASSES
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
            if (this.Value != "") {
                var result = this.Value.substring(4, this.Value.length - 1).replace(/\s/g, '');
                return result.split(',');
            }
            else {
                return ["0", "0", "0"];
            }
        };
        this.fullColorHex = () => {
            var colorArray;
            var returnString = "#";
            if (this.Value != "") {
                var result = this.Value.substring(4, this.Value.length - 1).replace(/\s/g, '');
                colorArray = result.split(',');
            }
            else {
                colorArray = ["0", "0", "0"];
            }
            for (var i = 0; i < colorArray.length; i++) {
                var hex = Number(colorArray[i]).toString(16);
                if (hex.length < 2) {
                    hex = "0" + hex;
                }
                returnString += hex;
            }
            return returnString;
        };
    }
}

///////////////////////////////////////////////////////////////////       GLOBAL VARIABLES
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

global.objectList = {
    _AssetList,
    _GroupList,
    _PortList,
    _CommandList,
    _ModeList
};
global.colorCustom = {
    ColorsCustom
};
///////////////////////////////////////////////////////////////////       PROJECT CLASS
class Project {
    constructor() {
        //the two only unique vars of the project
        this.name = "";
        this.folderPath = "";

        //the filepath arrays (load in this order)
        this.commandArray = new Array();
        this.groupArray = new Array();
        this.assetArray = new Array();
    }

    importAllOpenObjects() {
        //commands first
        var commandArray = global.objectList._CommandList.data();
        commandArray.forEach(element => {
            element.Value.filePath = this.folderPath + "\\" + element.Value.name + ".json";
            if (!this.commandArray.some(e => e.Name === element.Value.name)) {
                this.commandArray.push({ Name: element.Value.name, Path: element.Value.filePath });
            }
        });

        //then groups 
        var groupArray = global.objectList._GroupList.data();
        groupArray.forEach(element => {
            element.Value.filePath = this.folderPath + "\\" + element.Value.name + ".json";
            if (!this.groupArray.some(e => e.Name === element.Value.name)) {
                this.groupArray.push({ Name: element.Key, Path: element.Value.filePath });
            }
        });

        //then assets
        var assetArray = global.objectList._AssetList.data();
        assetArray.forEach(element => {
            element.Value.filePath = this.folderPath + "\\" + element.Value.name + ".json";
            if (!this.assetArray.some(e => e.Name === element.Value.name)) {
                this.assetArray.push({ Name: element.Value.name, Path: element.Value.filePath });
            }
        });
    }

    saveAllProjectObjects(isSync = false) {
        //save each object to the folder
        this.commandArray.forEach(element => {

            var obj = global.objectList._CommandList.findKeyValuePair(element.Name)

            if (obj.filePath != undefined) {
                if (isSync) {
                    fs.writeFileSync(obj.filePath, JSON.stringify(obj, null, 1), (err) => {
                        if (err) throw err;
                    });
                }
                else {
                    fs.writeFile(obj.filePath, JSON.stringify(obj, null, 1), (err) => {
                        if (err) throw err;
                    });
                }
            }
        });

        this.groupArray.forEach(element => {

            var obj = global.objectList._GroupList.findKeyValuePair(element.Name)

            if (obj.filePath != undefined) {
                if (isSync) {
                    fs.writeFileSync(obj.filePath, JSON.stringify(obj, null, 1), (err) => {
                        if (err) throw err;
                    });
                }
                else {
                    fs.writeFile(obj.filePath, JSON.stringify(obj, null, 1), (err) => {
                        if (err) throw err;
                    });
                }
            }
        });

        this.assetArray.forEach(element => {

            var obj = global.objectList._AssetList.findKeyValuePair(element.Name)

            if (obj.filePath != undefined) {
                if (isSync) {
                    fs.writeFileSync(obj.filePath, JSON.stringify(obj, null, 1), (err) => {
                        if (err) throw err;
                    });
                }
                else {
                    fs.writeFile(obj.filePath, JSON.stringify(obj, null, 1), (err) => {
                        if (err) throw err;
                    });
                }
            }
        });

        //write to the project file
        if (isSync) {
            fs.writeFileSync(this.folderPath + '\\' + this.name + ".json", JSON.stringify(this, null, 1), (err) => {
                if (err) throw err;
            });
        }
        else {
            fs.writeFile(this.folderPath + '\\' + this.name + ".json", JSON.stringify(this, null, 1), (err) => {
                if (err) throw err;
            });
        }
    }

    openAllProjectObjects() {
        //open commands and create them
        this.commandArray.forEach(element => {
            openedObject = JSON.parse(fs.readFileSync(element.Path));
            var openedCommand = Object.assign(new Command, openedObject);
            //chuck the asset into the asset list and lode it on the screen
            if (global.objectList._CommandList.findKeyValuePair(openedCommand.name) == 0) {
                global.objectList._CommandList.addKeyValuePair(openedCommand.name, openedCommand);
                openedCommand.createPaneForCommand();
            }
            else {
                //say there was an error or the asset was opened
            }
        });

        //then groups 
        this.groupArray.forEach(element => {
            openedObject = JSON.parse(fs.readFileSync(element.Path));
            var openedGroup = Object.assign(new Group, openedObject);
            //chuck the asset into the asset list and lode it on the screen
            if (global.objectList._GroupList.findKeyValuePair(openedGroup.name) == 0) {
                global.objectList._GroupList.addKeyValuePair(openedGroup.name, openedGroup);
                openedGroup.createPaneForGroup();
            }
            else {
                //say there was an error or the asset was opened
            }
        });

        //then assets
        this.assetArray.forEach(element => {
            openedObject = JSON.parse(fs.readFileSync(element.Path));
            var openedAsset = Object.assign(new Asset, openedObject);
            //chuck the asset into the asset list and lode it on the screen
            if (global.objectList._AssetList.findKeyValuePair(openedAsset.name) == 0) {
                global.objectList._AssetList.addKeyValuePair(openedAsset.name, openedAsset);
                openedAsset.createPaneForAsset();
            }
            else {
                //say there was an error or the asset was opened
            }
        });
    }
}
///////////////////////////////////////////////////////////////////       COMMAND CLASS
class Command {
    constructor() {
        //for the command module not the command message
        this.name = "";
        this.startDelay = 0;
        this.repeatTimes = 0;
        this.position = 0;
        this.filePath = "";
        this.assetArray = new Array();
        this.groupArray = new Array();

        //outdated
        this.cubePosition = 0;
        //used in command
        this.type = 0;
        this.color = new Color("Null", 'rgb(0,0,0)');
        this.mode = new Mode("Off", 0);
        this.delay = 0;
        this.debug = 0;
        this.sound = 0;
        //actual command message
        this.command = "";
    }

    //All COMMAND METHODS
    sendCommand() {
        //update the command itself
        this.updateCommand();
        //for each asset
        if (this.assetArray.length > 0) {
            for (var i = 0; i < this.assetArray.length; i++) {
                global.objectList._AssetList.findKeyValuePair(this.assetArray[i]).sendCommand(this.command);
            }
        }
        //for each group
        if (this.groupArray.length > 0) {
            for (var i = 0; i < this.groupArray.length; i++) {
                global.objectList._GroupList.findKeyValuePair(this.groupArray[i]).sendCommand(this.command);
            }
        }
    }

    updateCommand() {
        //updates the html first
        var optionBox = document.getElementById(this.name + "CommandPanel").querySelector('select[name="modeDropdown"]');
        if (document.getElementById(this.name + "CommandPanel").querySelector('select[name="modeDropdown"]').length == 1) {
            global.objectList._ModeList.forEach(function (option) {
                optionBox.innerHTML += "<option value=\"" + option.Value + "\">" + option.Name + "</option>";
            });
        }
        //update message specific items
        this.color = new Color("Custom", document.getElementById(this.name + "CommandPanel").querySelector('label[name="colorPicker"]').style.backgroundColor);

        var temp = document.getElementById(this.name + "CommandPanel").querySelector('select[name="modeDropdown"]').value;
        if (temp == "") {
            this.mode = global.objectList._ModeList[0];
        }
        else {
            this.mode = global.objectList._ModeList[temp];
        }

        if (!isNaN(document.getElementById(this.name + "CommandPanel").querySelector('input[name="delay"]').value)) {
            this.delay = document.getElementById(this.name + "CommandPanel").querySelector('input[name="delay"]').value;
        }
        if (document.getElementById(this.name + "CommandPanel").querySelector('input[name="debug"]').checked) {
            this.debug = 1;
        }
        //update the module specific variables
        if (!isNaN(document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_delay"]').value)) {
            this.startDelay = document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_delay"]').value;
        }
        if (!isNaN(document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_repeat"]').value)) {
            this.repeatTimes = document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_repeat"]').value;
        }

        this.generateCommand();
        //will update the assets activated
        var assetsTemp = document.getElementById(this.name + "CommandPanel").querySelector('div[name="objectHolder"]').querySelectorAll('label[id*="Asset"]');
        for (var i = 0; i < assetsTemp.length; i++) {
            if (assetsTemp[i].querySelector("input").checked) {
                var alias = assetsTemp[i].querySelector("input").id.replace('commandPanelAssetCheckbox', '');
                this.assetArray.push(alias);
            }
        }
        this.assetArray = Array.from(new Set(this.assetArray));
        //will update the groups activated
        var groupsTemp = document.getElementById(this.name + "CommandPanel").querySelector('div[name="objectHolder"]').querySelectorAll('label[id*="Group"]');
        for (var i = 0; i < groupsTemp.length; i++) {
            if (groupsTemp[i].querySelector("input").checked) {
                var alias = groupsTemp[i].querySelector("input").id.replace('commandPanelGroupCheckbox', '');
                this.groupArray.push(alias);
            }
        }
        this.groupArray = Array.from(new Set(this.groupArray));
    }

    commandSetup() {
        //updates the html purely in this function
        var optionBox = document.getElementById(this.name + "CommandPanel").querySelector('select[name="modeDropdown"]');
        if (document.getElementById(this.name + "CommandPanel").querySelector('select[name="modeDropdown"]').length == 1) {
            global.objectList._ModeList.forEach(function (option) {
                optionBox.innerHTML += "<option value=\"" + option.Value + "\">" + option.Name + "</option>";
            });
        }
        document.getElementById(this.name + "CommandPanel").querySelector('select[name="modeDropdown"]').selectedIndex = this.mode.Value + 1;
        var temp = Object.assign(new Color, this.color);
        this.color = temp;
        document.getElementById(this.name + "CommandPanel").querySelector('input[name="colorData"]').value = this.color.fullColorHex();
        document.getElementById(this.name + "CommandPanel").querySelector('input[name="colorData"]').onchange();
        if (this.delay != 0) {
            document.getElementById(this.name + "CommandPanel").querySelector('input[name="delay"]').value = this.delay;
        }
        if (this.debug == 1) {
            document.getElementById(this.name + "CommandPanel").querySelector('input[name="debug"]').checked = true;
        }
        //this.generateCommand();
        if (this.startDelay != 0) {
            document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_delay"]').value = this.startDelay;
        }
        if (this.repeatTimes != 0) {
            document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_repeat"]').value = this.repeatTimes;
        }
        //will update the assets activated
        var assetsTemp = document.getElementById(this.name + "CommandPanel").querySelector('div[name="objectHolder"]').querySelectorAll('label[id*="Asset"]');
        for (var i = 0; i < assetsTemp.length; i++) {
            for (var j = 0; j < this.assetArray.length; j++) {
                if (assetsTemp[i].querySelector("input").id == this.assetArray[j] + 'commandPanelAssetCheckbox') {
                    if(!assetsTemp[i].querySelector("input").checked)
                    {
                        assetsTemp[i].click()
                    }
                }
            }
        }
        this.assetArray = Array.from(new Set(this.assetArray));
        //will update the groups activated
        var groupsTemp = document.getElementById(this.name + "CommandPanel").querySelector('div[name="objectHolder"]').querySelectorAll('label[id*="Group"]');
        for (var i = 0; i < groupsTemp.length; i++) {
            for (var j = 0; j < this.groupArray.length; j++) {
                if (groupsTemp[i].querySelector("input").id == this.groupArray[j] + 'commandPanelGroupCheckbox') {
                    if(!groupsTemp[i].querySelector("input").checked)
                    {
                        groupsTemp[i].click()
                    }
                }
            }
        }
        this.groupArray = Array.from(new Set(this.groupArray));
    }

    generateCommand() {
        this.command = 'T' + this.type + 'C' + this.cubePosition + 'R' + this.color.returnColor()[0] + 'G' + this.color.returnColor()[1] + 'B' + this.color.returnColor()[2] + 'M' + this.mode.Value + 'D' + this.delay + 'X' + this.debug + 'S' + this.sound + '~';
        document.getElementById(this.name + "CommandPanel").querySelector('input[name="generated_string"]').value = this.command;
    }

    saveCommand() {
        this.updateCommand();

        fs.writeFileSync(this.filePath, JSON.stringify(this, null, 1), (err) => {
            if (err) throw err;
        });
    }

    closePaneForCommand() {
        //removes all HTML
        document.getElementById(this.name + "CommandPanel").remove();
        document.getElementById(this.name + "CommandButton").remove();

        //then removes this asset from the global list
        global.objectList._CommandList.removeKeyValuePair(this.name);
    }

    createPaneForCommand() {
        //this creates the group pane in the group tab
        var commandPanelForCommandTab = document.createElement('div');
        commandPanelForCommandTab.className = "viewableCommand commandPanelContent"; //gives it the proper styling
        commandPanelForCommandTab.id = this.name + "CommandPanel"; //name of this specific asset
        commandPanelForCommandTab.innerHTML =
            `
            <!--The autonumber in the order of commands-->
            <div class="viewableCommandNumber">#` + (this.position).toLocaleString('en-US', { minimumIntegerDigits: 3, useGrouping: false }) + `</div>
            <!--The command name-->
            <input class="viewableCommandInput" type="text" name="commandName" value="` + this.name + `" readonly="readonly">
            <!--The command generation pane-->
            <div class="viewableCommandMessageGeneration">
                <!--The color for the command-->
                <label class="viewableCommandMessageGenerationColor" name="colorPicker">
                    <input type="color" style="display: none;" name="colorData" onchange="this.parentElement.style.backgroundColor = this.value;  this.parentElement.style.color = this.value;" onchange="global.objectList._CommandList.findKeyValuePair('` + this.name + `').updateCommand()"/>
                    No Color
                </label>
                <!--The string update button-->
                <button type="button" class="viewableCommandMessageGenerationInputGenerateButton" onclick="global.objectList._CommandList.findKeyValuePair('` + this.name + `').updateCommand(); global.objectList._CommandList.findKeyValuePair('` + this.name + `').generateCommand();">
                    <svg id="viewableCommandMessageGenerationIcon">
                        <use xlink:href="SvgIcons/Generate.svg#generate"></use>
                    </svg>
                </button>
                <!--The mode dropdown-->
                <select class="viewableCommandMessageGenerationMode" name="modeDropdown" onchange="global.objectList._CommandList.findKeyValuePair('` + this.name + `').updateCommand()">
                    <option value="">Select Mode</option>
                </select>
                <!--The generated string-->
                <input class="viewableCommandMessageGenerationInput" type="text" name="generated_string" value="Generated String" readonly="readonly">
                <!--The delay of the command-->
                <input class="viewableCommandMessageGenerationInput" type="text" name="delay" value="Set Delay (ms)" onchange="global.objectList._CommandList.findKeyValuePair('` + this.name + `').updateCommand()">
                <!--The debug of the command-->
                <label class="viewableCommandMessageGenerationInputCheck">
                    Debug
                    <input class="viewableCommandMessageGenerationInputCheckbox" name="debug" type="checkbox" onclick="this.parentElement.childNodes[0].nodeValue  = 'Debug ' + this.checked;" onchange="global.objectList._CommandList.findKeyValuePair('` + this.name + `').updateCommand()">
                </label>
            </div>
            <div class="viewableCommandControlPane">
                <!--The settings for a command to be ran with-->
                <div class="viewableCommandControlPaneControls" style="overflow:hidden; margin-right: 5px; width: calc(50% - 5px);">
                    <input class="viewableCommandControlPaneControlsNumber" type="text" name="command_delay" value="Activation delay" onchange="global.objectList._CommandList.findKeyValuePair('` + this.name + `').updateCommand()">
                    <input class="viewableCommandControlPaneControlsNumber" type="text" name="command_repeat" value="Number of repeats" onchange="global.objectList._CommandList.findKeyValuePair('` + this.name + `').updateCommand()">
                </div>
                <!--A list of all assets and groups-->
                <div name="objectHolder" class="viewableCommandControlPaneControls viewableCommandObjectHolderPanel">
                    <!--Objects go here-->
                </div>
            </div>
            <button type="button" class="viewableCommandControlPaneSend" onclick="global.objectList._CommandList.findKeyValuePair('` + this.name + `').generateCommand(); global.objectList._CommandList.findKeyValuePair('` + this.name + `').sendCommand()">
                <svg id="viewableCommandControlPaneSendIcon">
                    <use xlink:href="SvgIcons/play.svg#play"></use>
                </svg>
            </button>`; //this is the gerneral inner html for the command panel
        document.getElementById('CommandContentPanel').appendChild(commandPanelForCommandTab);

        //makes the sidebar for the commands
        var commandPanelForRightSidebar = document.createElement('div');
        commandPanelForRightSidebar.className = "rightPanelCommandButton"; //gives it the proper styling
        commandPanelForRightSidebar.id = this.name + "CommandButton"; //name of this specific group
        commandPanelForRightSidebar.onclick = function () {
            onTabChanged('CommandContentPanel');
            var elmnt = document.getElementById(commandPanelForCommandTab.id);
            elmnt.scrollIntoView();
        };
        commandPanelForRightSidebar.innerHTML =
            `
            <div class="rightPanelCommandButtonThumbnail">#` + (this.position).toLocaleString('en-US', { minimumIntegerDigits: 3, useGrouping: false }) + `</div>
            <div class="rightPanelCommandButtonText">` + this.name + `</div>
            `;
        document.getElementById('RightPanelCommandHolder').appendChild(commandPanelForRightSidebar);
        //update content
        var test = this.name;
        setTimeout(function () {
            global.objectList._CommandList.findKeyValuePair(test).commandSetup();
        }, 200);

    }
}
///////////////////////////////////////////////////////////////////       GROUP CLASS
class Group {
    constructor() {
        this.name = "";
        this.filePath = "";
        this.state = "STBY"; //STBY BIND DISS RUN
        this.assetArray = new Array(); //keys instead of objects
    }

    //All GROUPS METHODS
    sendCommand(commandString) {
        this.updateGroup();
        for (var i = 0; i < this.assetArray.length; i++) {
            global.objectList._AssetList.findKeyValuePair(this.assetArray[i]).sendCommand(commandString);
        }
    }

    generateAndSendLocalCommand() {
        var delayClamped = 0;
        var checkClamped = 0;
        var colorClamped = new Color("Custom", document.getElementById(this.name + "GroupPanel").querySelector('label[name="colorPicker"]').style.backgroundColor);
        var modeClamped = global.objectList._ModeList[document.getElementById(this.name + "GroupPanel").querySelector('select[name="modeDropdown"]').value];
        //clamp the dlay value
        if (!isNaN(document.getElementById(this.name + "GroupPanel").querySelector('input[name="delay"]').value)) {
            delayClamped = document.getElementById(this.name + "GroupPanel").querySelector('input[name="delay"]').value;
        }
        //clamp the debug value
        if (document.getElementById(this.name + "GroupPanel").querySelector('input[name="debug"]').checked) {
            checkClamped = 1;
        }
        //generate a local command
        var localCommand = 'T0C0R' + colorClamped.returnColor()[0] + 'G' + colorClamped.returnColor()[1] + 'B' + colorClamped.returnColor()[2] + 'M' + modeClamped.Value + 'D' + delayClamped + 'X' + checkClamped + 'S0~\n';
        //change the html of the command input
        document.getElementById(this.name + "GroupPanel").querySelector('input[name="generated_string"]').value = localCommand;
        //send it
        this.updateGroup();
        for (var i = 0; i < this.assetArray.length; i++) {
            global.objectList._AssetList.findKeyValuePair(this.assetArray[i]).sendCommand(localCommand);
        }
    }


    saveGroup() {
        this.updateGroup();

        fs.writeFileSync(this.filePath, JSON.stringify(this, null, 1), (err) => {
            if (err) throw err;
        });
    }

    updateGroup() {
        var optionBox = document.getElementById(this.name + "GroupPanel").querySelector('select[name="modeDropdown"]');
        if (document.getElementById(this.name + "GroupPanel").querySelector('select[name="modeDropdown"]').length == 1) {
            global.objectList._ModeList.forEach(function (option) {
                optionBox.innerHTML += "<option value=\"" + option.Value + "\">" + option.Name + "</option>";
            });
        }
        //will update everything about the group data 
        this.assetArray = [];
        var test = document.getElementById(this.name + "GroupPanel").querySelector('div[name="selectedAssets"]').childNodes;
        for (var i = 1; i < test.length; i++) {
            if (test[i].querySelector("input").checked) {
                var alias = test[i].querySelector("input").id.replace('groupPanelAssetCheckbox', '');
                //global.objectList._AssetList.findKeyValuePair(alias).name
                this.assetArray.push(alias);
            }
        }
    }

    closePaneForGroup() {
        //removes all HTML
        document.getElementById(this.name + "GroupPanel").remove();
        document.getElementById(this.name + "GroupButton").remove();
        document.getElementById(this.name + "homePanelGroupPanel").remove();
        if (document.getElementById(this.name + "commandPanelGroupPanel") != null) {
            document.getElementById(this.name + "commandPanelGroupPanel").remove();
        }

        //then removes this asset from the global list
        global.objectList._GroupList.removeKeyValuePair(this.name);
    }

    createPaneForGroup() {
        //this creates the group pane in the group tab
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
                <div class="viewableGroupAssetPane" name="selectedAssets">
                </div>
            </div>
            <!--This is a basic command panel in the asset panel so that test commands can be sent-->
            <div class="viewableGroupCommandConstruction">
                <!--The color for the command-->
                <label name="colorPicker" class="viewableGroupCommandConstructionColor">
                    <input type="color" style="display: none;"
                        onchange="this.parentElement.style.backgroundColor = this.value;  this.parentElement.style.color = this.value;" />
                    No Color
                </label>
                <!--The mode dropdown-->
                <select class="viewableGroupCommandConstructionModeSelect" name="modeDropdown">
                    <option value="0">Select Mode</option>
                </select>
                <!--The debug boolean of the command-->
                <label class="viewableGroupCommandConstructionDebug">
                    Debug
                    <input name="debug" class="viewableGroupCommandConstructionDebugCheckbox" type="checkbox" onclick="this.parentElement.childNodes[0].nodeValue = 'Debug ' + this.checked;">
                </label>
                <!--The delay of the command-->
                <input class="viewableGroupCommandConstructionDelay" type="text" name="delay" value="Set Delay (ms)">
                <!--The generated string-->
                <input class="viewableGroupCommandConstructionGeneratedString" type="text" name="generated_string" value="Generated String" readonly="readonly">
                <!--The send button-->
                <button type="button" class="viewableGroupCommandConstructionSend" onclick="global.objectList._GroupList.findKeyValuePair('` + this.name + `').generateAndSendLocalCommand()">
                    <svg id="viewableSlimCommandPlayIcon">
                        <use xlink:href="SvgIcons/play.svg#play_small"></use>
                    </svg>
                </button>
            </div>`; //this is the gerneral inner html for the group panel
        document.getElementById('groupPanelGroupHolder').appendChild(groupPanelForGroupTab);

        //makes the sidebar for the groups
        var groupPanelForRightSidebar = document.createElement('div');
        groupPanelForRightSidebar.className = "rightPanelGroupButton"; //gives it the proper styling
        groupPanelForRightSidebar.id = this.name + "GroupButton"; //name of this specific group
        groupPanelForRightSidebar.onclick = function () {
            onTabChanged('GroupContentPanel');
            var elmnt = document.getElementById(groupPanelForGroupTab.id);
            elmnt.scrollIntoView();
        };
        groupPanelForRightSidebar.innerHTML =
            `
                <div class="rightPanelGroupButtonThumbnail">` + this.state + `</div>
                <div class="rightPanelGroupButtonText">` + this.name + `</div>
            `;
        document.getElementById('RightPanelGroupHolder').appendChild(groupPanelForRightSidebar);

        //make a microasset on the home panel
        var groupPanelForHomePanel = document.createElement('div');
        groupPanelForHomePanel.className = "HomePanelGroupSummary"; //gives it the proper styling
        groupPanelForHomePanel.id = this.name + "homePanelGroupPanel"; //name of this specific asset
        groupPanelForHomePanel.onclick = function () {
            onGroupTabOpen();
            var elmnt = document.getElementById(groupPanelForGroupTab.id);
            elmnt.scrollIntoView();
        };
        groupPanelForHomePanel.innerHTML =
            `
            <div class="HomePanelGroupSummaryName">` + this.name + `</div>
            <div class="HomePanelGroupSummaryAssets">` + this.assetArray.length + ` Assets</div>
            <div class="HomePanelGroupSummaryState">` + this.state + `</div>
         `;
        document.getElementById('HomeGroupSummary').appendChild(groupPanelForHomePanel);

        //generate the panels in the command panes
        var groupPanelForCommandPanel = document.createElement('label');
        groupPanelForCommandPanel.id = this.name + "commandPanelGroupPanel";
        groupPanelForCommandPanel.title = this.name;
        groupPanelForCommandPanel.innerHTML =
            `
                    <input type="checkbox" id="` + this.name + "commandPanelGroupCheckbox" + `" class="viewableCommandObjectButtonCheck">
                    <span class="viewableCommandObjectButton">
                        <span class="viewableCommandObjectButtonThumbnail" style="background-color: #00c3dd; color: rgb(66, 70, 77);">G</span>
                        <span class="viewableCommandObjectButtonText">` + this.name + `</span>
                    </span>
                `;

        var elements = document.getElementsByClassName("viewableCommandObjectHolderPanel");
        for (var i = 0; i < elements.length; i++) {
            elements[i].appendChild(groupPanelForCommandPanel.cloneNode(true));
        }

        //at this point run all updat code so that the Group is fully up to date
        this.updateGroup();
    }
}
///////////////////////////////////////////////////////////////////       ASSET CLASS
class Asset {
    constructor() {
        this.type = ""; //this is the type of the box being run
        this.name = ""; //the name
        this.filePath = ""; //filepath that is used
        this.comport = "COM#"; //the comport number used
        this.baudRate = 9600; //the baudrate of the comprt
        this.state = "STBY"; //STBY RUN STOP SYNC
        this.SerialPort; //the serialport
        //command array that hold all colors()
        this.colorArray = new Array();


    }

    //All ASSET METHODS
    openSerialPort() {
        this.SerialPort = new SerialPort(this.comport, { baudRate: parseInt(this.baudRate, 10) });
    }

    sendCommand(commandString) {
        if (this.SerialPort.isOpen) {
            this.SerialPort.write(commandString);
        }
    }

    generateAndSendLocalCommand() {
        var delayClamped = 0;
        var checkClamped = 0;
        var colorClamped = new Color("Custom", document.getElementById(this.name + "AssetPanel").querySelector('label[name="colorPicker"]').style.backgroundColor);
        var modeClamped = global.objectList._ModeList[document.getElementById(this.name + "AssetPanel").querySelector('select[name="modeDropdown"]').value];
        //clamp the dlay value
        if (!isNaN(document.getElementById(this.name + "AssetPanel").querySelector('input[name="delay"]').value)) {
            delayClamped = document.getElementById(this.name + "AssetPanel").querySelector('input[name="delay"]').value;
        }
        //clamp the debug value
        if (document.getElementById(this.name + "AssetPanel").querySelector('input[name="debug"]').checked) {
            checkClamped = 1;
        }
        //generate a local command
        var localCommand = 'T0C0R' + colorClamped.returnColor()[0] + 'G' + colorClamped.returnColor()[1] + 'B' + colorClamped.returnColor()[2] + 'M' + modeClamped.Value + 'D' + delayClamped + 'X' + checkClamped + 'S0~\n';
        //send it
        if (this.SerialPort.isOpen) {
            this.SerialPort.write(localCommand);
        }
        //change the html of the command input
        document.getElementById(this.name + "AssetPanel").querySelector('input[name="generated_string"]').value = localCommand;
        this.updateAsset();
    }

    saveAsset() {
        this.updateAsset();

        fs.writeFileSync(this.filePath, JSON.stringify(this, null, 1), (err) => {
            if (err) throw err;
        });
    }

    updateAsset() {
        // update the asset html
        var optionBox = document.getElementById(this.name + "AssetPanel").querySelector('select[name="modeDropdown"]');
        if (document.getElementById(this.name + "AssetPanel").querySelector('select[name="modeDropdown"]').length == 1) {
            global.objectList._ModeList.forEach(function (option) {
                optionBox.innerHTML += "<option value=\"" + option.Value + "\">" + option.Name + "</option>";

            });
        }
        for (var i = 0; i < this.colorArray.length; i++) {

        }
        //will update everything about the asset data
        this.type = document.getElementById(this.name + "AssetPanel").querySelector('select[name="assetType"]').value;
        this.comport = document.getElementById(this.name + "AssetPanel").querySelector('input[name="comport"]').value;
        this.baudRate = document.getElementById(this.name + "AssetPanel").querySelector('input[name="baudrate"]').value;
    }

    closePaneForAsset() {
        //removes all HTML
        document.getElementById(this.name + "AssetPanel").remove();
        document.getElementById(this.name + "AssetButton").remove();
        document.getElementById(this.name + "homePanelAssetPanel").remove();
        if (document.getElementById(this.name + "groupPanelAssetPanel") != null) {
            document.getElementById(this.name + "groupPanelAssetPanel").remove();
        }
        if (document.getElementById(this.name + "commandPanelAssetPanel") != null) {
            document.getElementById(this.name + "commandPanelAssetPanel").remove();
        }
        //then removes this asset from the global list
        global.objectList._AssetList.removeKeyValuePair(this.name);
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
                <input class="viewableAssetInput" type="text" name="assetName" value="` + this.name + `" readonly="readonly" onchange="global.objectList._AssetList.findKeyValuePair('` + this.name + `').updateAsset()"> 
                <input class="viewableAssetInput" type="text" name="comport" value="` + this.comport + `" onchange="global.objectList._AssetList.findKeyValuePair('` + this.name + `').updateAsset()">
                <input class="viewableAssetInput" type="text" name="baudrate" value="` + this.baudRate + `">
                <input class="viewableAssetInput" type="text" name="filePath" value="` + this.filePath + `" readonly="readonly" onchange="global.objectList._AssetList.findKeyValuePair('` + this.name + `').updateAsset()">
                <select class="viewableAssetInput selectAssetInput" name="assetType" onchange="global.objectList._AssetList.findKeyValuePair('`+ this.name + `').updateAsset()">
                    <option value="0">Alone</option>
                    <option value="1">Master</option>
                    <option value="2">Slave</option>
                    <option value="3">Beacon</option>
                </select>
            </div>
            <!--This will house various bits of information for this asset and possible more-->
            <div class="viewableAssetCommandGraph">
                <div class="viewableAssetCommandGraphState">` + this.state + `</div>
                <div class="viewableAssetCommandGraphLog">
                    <p>Console Log:</p>
                </div>
            <button class="viewableAssetCommandGraphPortConnect" onclick="global.objectList._AssetList.findKeyValuePair('` + this.name + `').openSerialPort()">CONNECT</button>
            </div>
            <!--This is a basic command panel in the asset panel so that test commands can be sent-->
            <div class="viewableAssetCommandConstruction">
                <!--The color for the command-->
                <label class="viewableAssetCommandConstructionColor" name="colorPicker">
                    <input type="color"  style="display: none;" onchange="this.parentElement.style.backgroundColor = this.value;  this.parentElement.style.color = this.value;" />
                    No Color
                </label>
                <!--The mode dropdown-->
                <select class="viewableAssetCommandConstructionModeSelect" name="modeDropdown">
                    <option value="0">Select Mode</option>
                </select>
                <!--The debug boolean of the command-->
                <label class="viewableAssetCommandConstructionDebug">
                    Debug
                    <input class="viewableAssetCommandConstructionDebugCheckbox" name="debug" type="checkbox" onclick="this.parentElement.childNodes[0].nodeValue = 'Debug ' + this.checked;">
                </label>
                <!--The delay of the command-->
                <input class="viewableAssetCommandConstructionDelay" type="text" name="delay" value="Set Delay (ms)">
                <!--The generated string-->
                <input class="viewableAssetCommandConstructionGeneratedString" type="text" name="generated_string" value="Generated String" readonly="readonly">
                <!--The send button-->
                <button type="button" class="viewableAssetCommandConstructionSend" onclick="global.objectList._AssetList.findKeyValuePair('` + this.name + `').generateAndSendLocalCommand()">
                    <svg id="viewableSlimCommandPlayIcon">
                        <use xlink:href="SvgIcons/play.svg#play_small"></use>
                    </svg>
                </button>
            </div>
            `; //this is the gerneral inner html for the asset panel
        //makes the sidebar for the asset
        document.getElementById('assetPanelAssetHolder').appendChild(assetPanelForAssetTab);

        var assetPanelForRightSidebar = document.createElement('div');
        assetPanelForRightSidebar.className = "rightPanelAssetButton"; //gives it the proper styling
        assetPanelForRightSidebar.id = this.name + "AssetButton"; //name of this specific asset
        assetPanelForRightSidebar.onclick = function () {
            onTabChanged('AssetContentPanel');
            var elmnt = document.getElementById(assetPanelForAssetTab.id);
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

        //generate the panels in the command panes
        var assetPanelForCommandPanel = document.createElement('label');
        assetPanelForCommandPanel.id = this.name + "commandPanelAssetPanel";
        assetPanelForCommandPanel.title = this.name;
        assetPanelForCommandPanel.innerHTML =
            `
            <input type="checkbox" id="` + this.name + "commandPanelAssetCheckbox" + `" class="viewableCommandObjectButtonCheck">
            <span class="viewableCommandObjectButton">
                <span class="viewableCommandObjectButtonThumbnail" style="background-color: #00eccc; color: rgb(66, 70, 77);">A</span>
                <span class="viewableCommandObjectButtonText">` + this.name + `</span>
            </span>
        `;
        var elements = document.getElementsByClassName("viewableCommandObjectHolderPanel");
        for (var i = 0; i < elements.length; i++) {
            elements[i].appendChild(assetPanelForCommandPanel.cloneNode(true));
        }
        //at this point run all updat code so that the asset is fully up to date
        this.updateAsset();
    }
}
///////////////////////////////////////////////////////////////////       MODULE EXPORTS
module.exports = {
    mode: Mode,
    asset: Asset,
    command: Command,
    color: Color,
    group: Group,
    project: Project
};