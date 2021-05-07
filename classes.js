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
//var SerialPort = require('serialport');
var notification = require('./notification.js');
const url = require('url');
const path = require('path');
const {
    callbackify
} = require('util');


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
            } else {
                return ["0", "0", "0"];
            }
        };
        this.fullColorHex = () => {
            var colorArray;
            var returnString = "#";
            if (this.Value != "") {
                var result = this.Value.substring(4, this.Value.length - 1).replace(/\s/g, '');
                colorArray = result.split(',');
            } else {
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

var _SocketList = [];

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
    new Mode("Rainbow Waterfall", 4),
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
    new Mode("Sound Sync", 24),
    new Mode("Portal", 25),
    new Mode("Tree", 26)
);

global.ip = "";

global.objectList = {
    _AssetList,
    _GroupList,
    _PortList,
    _SocketList,
    _CommandList,
    _ModeList,
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
        this.ip = "";

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
                this.commandArray.push({
                    Name: element.Value.name,
                    Path: element.Value.filePath
                });
            }
        });

        //then groups 
        var groupArray = global.objectList._GroupList.data();
        groupArray.forEach(element => {
            element.Value.filePath = this.folderPath + "\\" + element.Value.name + ".json";
            if (!this.groupArray.some(e => e.Name === element.Value.name)) {
                this.groupArray.push({
                    Name: element.Key,
                    Path: element.Value.filePath
                });
            }
        });

        //then assets
        var assetArray = global.objectList._AssetList.data();
        assetArray.forEach(element => {
            element.Value.filePath = this.folderPath + "\\" + element.Value.name + ".json";
            if (!this.assetArray.some(e => e.Name === element.Value.name)) {
                this.assetArray.push({
                    Name: element.Value.name,
                    Path: element.Value.filePath
                });
            }
        });

        notification.send("NOTICE, ALL OBJECTS IMPORTED", this.name);
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
                } else {
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
                } else {
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
                } else {
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
        } else {
            fs.writeFile(this.folderPath + '\\' + this.name + ".json", JSON.stringify(this, null, 1), (err) => {
                if (err) throw err;
            });
        }
        notification.send("NOTICE, PROJECT SAVED", this.name);
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
            } else {
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
            } else {
                //say there was an error or the asset was opened
            }
        });

        //then assets
        this.assetArray.forEach(element => {
            openedObject = JSON.parse(fs.readFileSync(element.Path));
            var openedAsset = Object.assign(new Asset, openedObject);
            openedAsset.protocol = Object.assign(new classes.protocol, openedAsset.protocol);
            //chuck the asset into the asset list and lode it on the screen
            if (global.objectList._AssetList.findKeyValuePair(openedAsset.name) == 0) {
                global.objectList._AssetList.addKeyValuePair(openedAsset.name, openedAsset);
                openedAsset.createPaneForAsset();
            } else {
                //say there was an error or the asset was opened
            }
        });

        //set the title to the projectname
        document.title = "Liquid Pixel Hub - " + this.name + " Loaded";

        global.ip = this.ip;

        notification.send("NOTICE, PROJECT OPENED", this.name);
    }
}
///////////////////////////////////////////////////////////////////       PROTOCOL CLASS
class Protocol {
    constructor() {
        this.type = 2;
        this.isConnected = false;

        //SERIAL
        this.comport = "COM#";
        this.baudrate = 9600;

        //BLUETOOTH
        this.id = null;

        //WIFI
        this.ip = null;
    }


    openConnection(callback) {
        for (let i = 0; i < global.objectList._SocketList.length; i++) {
            if (global.objectList._SocketList[i].ip == this.ip) {
                this.isConnected = true;
                break;
            } else if (i == global.objectList._SocketList.length - 1) {
                this.isConnected = false;
                break;
            }
        }
        if (global.objectList._SocketList.length == 0) {
            this.isConnected = false;
        }
        callback(this.isConnected);
    }

    closeConnection() {

    }

    transmitString(str) {
        for (let i = 0; i < global.objectList._SocketList.length; i++) {
            if (global.objectList._SocketList[i].ip == this.ip) {
                global.objectList._SocketList[i].socket.write(Buffer.from(str));
            }
        }
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
        this.targetArray = new Array();
        this.commandArray = new Array();

        //this.assetArray = new Array();
        //this.groupArray = new Array();

        //outdated
        //this.cubePosition = 0;
        //used in command
        // this.type = 0;
        // this.color = new Color("Null", 'rgb(0,0,0)');
        // this.mode = new Mode("Off", 0);
        // this.delay = 0;
        // this.debug = 0;
        // this.sound = 0;
        //actual command message
        //this.command = "";
    }

    //All COMMAND METHODS
    setState(status = 0) {
        var colorArray = [
            '#e35656', //off
            '#24c65b', //running
            '#f9a12f' //next
        ];
        //get all of the changable objects 
        var displays = [
            document.getElementById(this.name + "CommandPanel").getElementsByClassName("viewableCommandNumber")[0],
            document.getElementById(this.name + "CommandButton").getElementsByClassName("rightPanelCommandButtonThumbnail")[0],
            document.getElementById(this.name + "CommandHighlightButton").getElementsByClassName("leftPanelCommandButtonThumbnail")[0],
            document.getElementById(this.name + "homePanelCommandPanel").getElementsByClassName("HomePanelCommandSummaryState")[0]
        ];
        //change the of all of the static ones
        for (var i = 0; i < displays.length; i++) {
            //change the color
            displays[i].style.backgroundColor = colorArray[status];
        }
        if (status == 1) {
            //then change the master displays
        }
    }

    callEvent(name) {
        // a custom event handler that will be called locally from within the assets themselves
        switch (name) {
            case 'command-previous':
                //set state
                this.setState(0);
                break;
            case 'command-sent':
                //set state
                this.setState(1);
                //then set the next in line to up next
                for (var i = 0; i < document.getElementsByClassName("viewableCommandNumber").length; i++) {
                    if (parseInt(document.getElementsByClassName("viewableCommandNumber")[i].innerHTML.substr(1, document.getElementsByClassName("viewableCommandNumber")[i].innerHTML.length), 10) == (this.position + 1)) {
                        //get the parent and call the set state
                        global.objectList._CommandList.findKeyValuePair(document.getElementsByClassName("viewableCommandNumber")[i].parentElement.id.replace("CommandPanel", "")).callEvent('command-next')
                    }
                    if (parseInt(document.getElementsByClassName("viewableCommandNumber")[i].innerHTML.substr(1, document.getElementsByClassName("viewableCommandNumber")[i].innerHTML.length), 10) == (this.position - 1)) {
                        global.objectList._CommandList.findKeyValuePair(document.getElementsByClassName("viewableCommandNumber")[i].parentElement.id.replace("CommandPanel", "")).callEvent('command-previous')
                    }
                }
                //then send a notification
                notification.send("COMMAND " + this.command + " SENT", this.name)
                break;
            case 'command-next':
                //set state
                this.setState(2);
                break;
            default:
                // do nothing if it defaults
        }
    }

    sendCommand() {
        //update the command itself
        this.updateCommand();
        //scroll it into view on the command highlight
        var elmnt = document.getElementById(this.name + "CommandHighlightButton");
        elmnt.scrollIntoView();
        if (this.targetArray.length > 0) {
            for (var i = 0; i < this.targetArray.length; i++) 
            {
                //figure out if its a group or asset.
                if(global.objectList._AssetList.findKeyValuePair(this.targetArray[i]) != 0)
                {
                    //what to do if an asset
                    //check to see if a command exists for this index
                    if(this.commandArray[i] != null){
                        global.objectList._AssetList.findKeyValuePair(this.targetArray[i]).sendCommand(this.commandArray[i]);
                    }
                    else{
                        notification.send(this.targetArray[i].toUpperCase() + " DOES NOT HAVE AN ASSOCIATED COMMAND", this.name)
                    }
                }
                else if(global.objectList._GroupList.findKeyValuePair(this.targetArray[i]) != 0)
                {
                    //what to do if a group
                    //check to see if a command exists for this index
                    if(this.commandArray[i] != null){
                        global.objectList._GroupList.findKeyValuePair(this.targetArray[i]).sendCommand(this.commandArray[i]);
                    }
                    else{
                        notification.send(this.targetArray[i].toUpperCase() + " DOES NOT HAVE AN ASSOCIATED COMMAND", this.name)
                    }
                }
                else
                {
                    notification.send(this.targetArray[i].toUpperCase() + " ASSET OR GROUP DOES NOT EXIST", this.name)
                }
                //global.objectList._AssetList.findKeyValuePair(this.assetArray[i]).sendCommand(this.command);
            }
        }
    }

    updateCommand() {
        //uptade the arrays
        var tempCommands = document.getElementById(this.name + "CommandPanel").querySelector('textarea[name="commands"]').value;
        if (tempCommands.length != 0) {
            //purge spaces
            //tempCommands = tempCommands.replace(/\s+/g, '');
            //string.split(",")
            this.commandArray = tempCommands.split(" ");
        }

        var tempTargets = document.getElementById(this.name + "CommandPanel").querySelector('textarea[name="targets"]').value;
        if (tempTargets.length != 0) {
            //purge spaces
            //tempCommands = tempCommands.replace(/\s+/g, '');
            //string.split(",")
            this.targetArray = tempTargets.split(" ");
        }

        //update the module specific variables
        if (!isNaN(document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_delay"]').value)) {
            this.startDelay = document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_delay"]').value;
        }
        if (!isNaN(document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_repeat"]').value)) {
            this.repeatTimes = document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_repeat"]').value;
        }

    }

    commandSetup() {

        if (this.commandArray.length != 0) {
            document.getElementById(this.name + "CommandPanel").querySelector('textarea[name="commands"]').value = this.commandArray.join(" ");
        }

        if (this.targetArray.length != 0) {
            document.getElementById(this.name + "CommandPanel").querySelector('textarea[name="targets"]').value = this.targetArray.join(" ");
        }

        if (this.startDelay != 0) {
            document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_delay"]').value = this.startDelay;
        }
        if (this.repeatTimes != 0) {
            document.getElementById(this.name + "CommandPanel").querySelector('input[name="command_repeat"]').value = this.repeatTimes;
        }
    }

    generateCommand() {
        //I0T0{43,218,82}M25D0~
        this.command = 'I' + this.cubePosition + 'T' + this.type + '{' + this.color.returnColor()[0] + ',' + this.color.returnColor()[1] + ',' + this.color.returnColor()[2] + '}M' + this.mode.Value + 'D' + this.delay + '~';
        //this.command = 'T' + this.type + 'C' + this.cubePosition + 'R' + this.color.returnColor()[0] + 'G' + this.color.returnColor()[1] + 'B' + this.color.returnColor()[2] + 'M' + this.mode.Value + 'D' + this.delay + 'X' + this.debug + 'S' + this.sound + '~';
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
        document.getElementById(this.name + "homePanelCommandPanel").remove();

        //then removes this asset from the global list
        global.objectList._CommandList.removeKeyValuePair(this.name);
    }

    generateSearchResult(containerId) {
        var fooName = this.name + "CommandPanel"
        var commandPanelForSearch = document.createElement('div');
        commandPanelForSearch.className = "stageSearchPaneResult"; //gives it the proper styling
        commandPanelForSearch.id = this.name + "CommandSearchButton"; //name of this specific asset
        commandPanelForSearch.onclick = function () {
            onTabChanged('CommandContentPanel');
            var elmnt = document.getElementById(fooName);
            elmnt.scrollIntoView();
        };
        commandPanelForSearch.innerHTML =
            `
                <div class="stageSearchPaneResultState" style="background-color: #e35656;">#` + (this.position).toLocaleString('en-US', {
                minimumIntegerDigits: 3,
                useGrouping: false
            }) + `</div>
                <div class="stageSearchPaneResultSpacer"></div>
                <div class="stageSearchPaneResultCommandType" style="background-color: #0075ac; color: rgb(200,200,200);">` + "COMMAND" + `</div>
                <div class="stageSearchPaneResultCommand">` + this.name + `</div>
                <div class="stageSearchPaneResultCommandObjects">` + (this.assetArray.length + this.groupArray.length) + ` Objects</div>
            `;
        document.getElementById(containerId).appendChild(commandPanelForSearch);
    }

    createPaneForCommand() {
        //this creates the group pane in the group tab
        var commandPanelForCommandTab = document.createElement('div');
        commandPanelForCommandTab.className = "viewableCommand hoverPanelContent"; //gives it the proper styling
        commandPanelForCommandTab.id = this.name + "CommandPanel"; //name of this specific asset
        commandPanelForCommandTab.innerHTML =
            `
            <!--The autonumber in the order of commands-->
            <div class="viewableCommandNumber">#` + (this.position).toLocaleString('en-US', {
                minimumIntegerDigits: 3,
                useGrouping: false
            }) + `</div>
            <!--The command name-->
            <input class="viewableCommandInput" type="text" name="commandName" value="` + this.name + `" readonly="readonly">
            <!--The command messagepane-->
            <textarea  class="viewableCommandInputPane" type="text" name="commands" placeholder="put command strings here"></textarea> 
            <!--A list of all assets and groups here-->
            <textarea  class="viewableCommandInputPane" type="text" name="targets" placeholder="put assets/groups here"></textarea> 
            <div class="viewableCommandControlPane">
                <!--The settings for a command to be ran with-->
                <div class="viewableCommandControlPaneControls">
                    <input class="viewableCommandControlPaneControlsNumber" type="text" name="command_delay" value="Activation delay" onchange="global.objectList._CommandList.findKeyValuePair('` + this.name + `').updateCommand()">
                    <input class="viewableCommandControlPaneControlsNumber" type="text" name="command_repeat" value="Number of repeats" onchange="global.objectList._CommandList.findKeyValuePair('` + this.name + `').updateCommand()">
                </div>
                <!--A list of all assets and groups-->
            </div>
            <button type="button" class="viewableCommandControlPaneSend" onclick="global.objectList._CommandList.findKeyValuePair('` + this.name + `').sendCommand()">
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
            <div class="rightPanelCommandButtonThumbnail">#` + (this.position).toLocaleString('en-US', {
                minimumIntegerDigits: 3,
                useGrouping: false
            }) + `</div>
            <div class="rightPanelCommandButtonText">` + this.name + `</div>
            `;
        document.getElementById('RightPanelCommandHolder').appendChild(commandPanelForRightSidebar);

        //make a microcommand in the command highlighter leftSidebarCommandViewerCollapsible
        var commandPanelForCommandHighlighter = document.createElement('div');
        commandPanelForCommandHighlighter.className = "leftPanelCommandButton"; //gives it the proper styling
        commandPanelForCommandHighlighter.id = this.name + "CommandHighlightButton"; //name of this specific group
        commandPanelForCommandHighlighter.onclick = function () {
            onTabChanged('CommandContentPanel');
            var elmnt = document.getElementById(commandPanelForCommandTab.id);
            elmnt.scrollIntoView();
        };
        commandPanelForCommandHighlighter.innerHTML =
            `
            <div class="leftPanelCommandButtonThumbnail">#` + (this.position).toLocaleString('en-US', {
                minimumIntegerDigits: 3,
                useGrouping: false
            }) + `</div>
            <div class="leftPanelCommandButtonText">` + this.name + `</div>
            `;
        document.getElementById('leftSidebarCommandViewerCollapsible').appendChild(commandPanelForCommandHighlighter);

        //make a microcommand on the home panel
        var commandPanelForHomePanel = document.createElement('div');
        commandPanelForHomePanel.className = "HomePanelCommandSummary"; //gives it the proper styling
        commandPanelForHomePanel.id = this.name + "homePanelCommandPanel"; //name of this specific asset
        commandPanelForHomePanel.onclick = function () {
            onTabChanged('CommandContentPanel');
            var elmnt = document.getElementById(commandPanelForCommandTab.id);
            elmnt.scrollIntoView();
        };
        commandPanelForHomePanel.innerHTML =
            `
            <div class="HomePanelCommandSummaryState">#` + (this.position).toLocaleString('en-US', {
                minimumIntegerDigits: 3,
                useGrouping: false
            }) + `</div>
            <div class="HomePanelCommandSummaryColor">NULL</div>
            <div class="HomePanelCommandSummaryName">` + this.name + `</div>
         `;
        document.getElementById('HomeCommandSummary').appendChild(commandPanelForHomePanel);
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
        this.isDisbanded = false;
        this.state = 0; //STBY BIND DISS RUN
        this.stateChanged = (newState) => this.state != newState;
        this.assetArray = new Array(); //keys instead of objects
    }

    //All GROUPS METHODS
    setState(status = 0) {
        var stateArray = [
            'STBY',
            'BIND',
            'DISB',
            'RUN',
            'PAUS',
            'STOP'
        ];
        var stateArrayColor = [
            '#f9a12f',
            '#24c65b',
            '#e35656',
            '#0075ac',
            '#F75C03',
            '#e35656'
        ];
        //get all of the changable objects 
        var displays = [
            document.getElementById(this.name + "GroupPanel").getElementsByClassName("viewableGroupTitlePaneStatus")[0],
            document.getElementById(this.name + "GroupButton").getElementsByClassName("rightPanelGroupButtonThumbnail")[0],
            document.getElementById(this.name + "homePanelGroupPanel").getElementsByClassName("HomePanelGroupSummaryState")[0],
        ];
        if (this.stateChanged(status)) {
            //set the global status
            this.state = status;
            //change the of all of the static ones
            for (var i = 0; i < displays.length; i++) {
                //change the text 
                displays[i].innerHTML = stateArray[status];
                //change the color
                displays[i].style.backgroundColor = stateArrayColor[status];
            }
        }
    }

    callEvent(name) {
        // a custom event handler that will be called locally from within the assets themselves
        switch (name) {
            case 'group-standby':
                //set state
                this.setState(0);
                //then send a notification
                notification.send("NOTICE, THIS GROUP HAS BEEN REINSTATED AND IS ON STANDBY", this.name);
                break;
            case 'group-activated':
                //set state
                this.setState(1);
                //then send a notification
                notification.send("NOTICE, ASSETS SUCCESFULLY BINDED", this.name);
                break;
            case 'group-disbanded':
                //set state
                this.setState(2);
                //then send a notification
                notification.send("NOTICE, THIS GROUP IS DISBANDED", this.name);
                break;
            case 'command-sent':
                //set state
                this.setState(3);
                break;
            case 'command-pause':
                //set state
                this.setState(4);
                break;
            case 'command-stop':
                //set state
                this.setState(5);
                break;
            default:
                // do nothing if it defaults
        }
    }

    sendCommand(commandString) {
        this.updateGroup();
        for (var i = 0; i < this.assetArray.length; i++) {
            global.objectList._AssetList.findKeyValuePair(this.assetArray[i]).sendCommand(commandString);
        }
        if (commandString.includes("M0")) {
            this.callEvent('command-stop');
        } else if (commandString.includes("M23")) {
            this.callEvent('command-pause');
        } else {
            this.callEvent('command-sent');
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
        var localCommand = 'I0T0{' + colorClamped.returnColor()[0] + ',' + colorClamped.returnColor()[1] + ',' + colorClamped.returnColor()[2] + '}M' + modeClamped.Value + 'D' + delayClamped + '~';
        //var localCommand = 'T0C0R' + colorClamped.returnColor()[0] + 'G' + colorClamped.returnColor()[1] + 'B' + colorClamped.returnColor()[2] + 'M' + modeClamped.Value + 'D' + delayClamped + 'X' + checkClamped + 'S0~\n';
        //change the html of the command input
        document.getElementById(this.name + "GroupPanel").querySelector('input[name="generated_string"]').value = localCommand;
        //send it
        this.sendCommand(localCommand);
    }

    saveGroup() {
        this.updateGroup();

        fs.writeFileSync(this.filePath, JSON.stringify(this, null, 1), (err) => {
            if (err) throw err;
        });
    }

    groupSetup() {
        for (var i = 0; i < this.assetArray.length; i++) {
            if (!document.getElementById(this.name + "GroupPanel").querySelector('*[id="' + this.assetArray[i] + "groupPanelAssetCheckbox" + '"]').checked) {
                document.getElementById(this.name + "GroupPanel").querySelector('*[id="' + this.assetArray[i] + "groupPanelAssetCheckbox" + '"]').checked = true;
            }
        }
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

        //update the amount of element shown on the home screen number
        document.getElementById(this.name + "homePanelGroupPanel").getElementsByClassName("HomePanelGroupSummaryAssets")[0].innerHTML = this.assetArray.length + " Assets";
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

    generateSearchResult(containerId) {
        var fooName = this.name + "GroupPanel"
        var groupPanelForSearch = document.createElement('div');
        groupPanelForSearch.className = "stageSearchPaneResult"; //gives it the proper styling
        groupPanelForSearch.id = this.name + "GroupSearchButton"; //name of this specific asset
        groupPanelForSearch.onclick = function () {
            onTabChanged('GroupContentPanel');
            var elmnt = document.getElementById(fooName);
            elmnt.scrollIntoView();
        };
        groupPanelForSearch.innerHTML =
            `
                <div class="stageSearchPaneResultState">` + "STBY" + `</div>
                <div class="stageSearchPaneResultSpacer"></div>
                <div class="stageSearchPaneResultType" style="background-color: #00c3dd; color: rgb(66, 70, 77);">` + "GROUP" + `</div>
                <div class="stageSearchPaneResultGroup">` + this.name + `</div>
                <div class="stageSearchPaneResultGroupAssets">` + this.assetArray.length + ` Assets</div>
            `;
        document.getElementById(containerId).appendChild(groupPanelForSearch);
    }

    createPaneForGroup() {
        //this creates the group pane in the group tab
        var groupPanelForGroupTab = document.createElement('div');
        groupPanelForGroupTab.className = "viewableGroup hoverPanelContent"; //gives it the proper styling
        groupPanelForGroupTab.id = this.name + "GroupPanel"; //name of this specific asset
        groupPanelForGroupTab.innerHTML =
            `
            <!--This will house various bits of information for this group-->
            <div class="viewableGroupTitlePane">
                <div class="viewableGroupTitlePaneStatus">` + "STBY" + `</div>
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
                <div class="rightPanelGroupButtonThumbnail">` + "STBY" + `</div>
                <div class="rightPanelGroupButtonText">` + this.name + `</div>
            `;
        document.getElementById('RightPanelGroupHolder').appendChild(groupPanelForRightSidebar);

        //make a microasset on the home panel
        var groupPanelForHomePanel = document.createElement('div');
        groupPanelForHomePanel.className = "HomePanelGroupSummary"; //gives it the proper styling
        groupPanelForHomePanel.id = this.name + "homePanelGroupPanel"; //name of this specific asset
        groupPanelForHomePanel.onclick = function () {
            onTabChanged('GroupContentPanel');
            var elmnt = document.getElementById(groupPanelForGroupTab.id);
            elmnt.scrollIntoView();
        };
        groupPanelForHomePanel.innerHTML =
            `
            <div class="HomePanelGroupSummaryName">` + this.name + `</div>
            <div class="HomePanelGroupSummaryAssets">` + this.assetArray.length + ` Assets</div>
            <div class="HomePanelGroupSummaryState">` + "STBY" + `</div>
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

        //update the content of the group
        var test = this.name;
        setTimeout(function () {
            global.objectList._GroupList.findKeyValuePair(test).groupSetup();
            global.objectList._GroupList.findKeyValuePair(test).updateGroup();
        }, 200);

        this.setState(0);
        //at this point run all update code so that the Group is fully up to date
        if (this.assetArray.length == 0) {
            this.setState(0);
        } else if (this.isDisbanded) {
            this.callEvent('group-disbanded');
        } else {
            this.callEvent('group-activated');
        }
        //this.updateGroup();
    }
}
///////////////////////////////////////////////////////////////////       ASSET CLASS
class Asset {
    constructor() {
        this.type = ""; //this is the type of the box being run
        this.name = ""; //the name
        this.filePath = ""; //filepath that is used
        this.state = 0; //the current state of the asset 
        this.stateChanged = (newState) => this.state != newState;
        this.protocol = new Protocol();
    }

    //All ASSET METHODS
    setState(status = 0) {
        var stateArray = [
            'STBY',
            'CON',
            'DISS',
            'RUN',
            'PAUS',
            'STOP',
            'SYNC'
        ];
        var stateArrayColor = [
            '#f9a12f',
            '#24c65b',
            '#e35656',
            '#0075ac',
            '#F75C03',
            '#e35656',
            '#966fd6'
        ];
        //get all of the changable objects 
        var displays = [
            document.getElementById(this.name + "AssetPanel").getElementsByClassName("viewableAssetTopBarState")[0],
            document.getElementById(this.name + "AssetButton").getElementsByClassName("rightPanelAssetButtonThumbnail")[0],
            document.getElementById(this.name + "homePanelAssetPanel").getElementsByClassName("HomePanelAssetSummaryState")[0],
        ];
        if (this.stateChanged(status)) {
            //set the global status
            this.state = status;
            //change the of all of the static ones
            for (var i = 0; i < displays.length; i++) {
                //change the text 
                displays[i].innerHTML = stateArray[status];
                //change the color
                displays[i].style.backgroundColor = stateArrayColor[status];
            }
            //change the states of the dynamic ones
            try {
                for (var i = 0; i < document.querySelectorAll('*[id="' + this.name + "groupPanelAssetPanel" + '"]').length; i++) {
                    for (var j = 0; j < document.querySelectorAll('*[id="' + this.name + "groupPanelAssetPanel" + '"]')[i].getElementsByClassName("viewableGroupAssetButtonThumbnail").length; j++) {
                        var blah = document.querySelectorAll('*[id="' + this.name + "groupPanelAssetPanel" + '"]')[i].getElementsByClassName("viewableGroupAssetButtonThumbnail")[j];
                        //change the text 
                        blah.innerHTML = stateArray[status];
                        //change the color
                        blah.style.backgroundColor = stateArrayColor[status];
                    }
                }
            } catch {}
        }
    }

    callEvent(name) {
        // a custom event handler that will be called locally from within the assets themselves
        switch (name) {
            case 'connection-undefined':
                //set state
                this.setState(0);
                //then send a notification
                notification.send("ERROR, THIS ASSET DOES NOT HAVE A DEFINED CONNECTION", this.name);
                break;
            case 'connection-active':
                //set state
                this.setState(1);
                //then set the summary
                document.getElementById(this.name + "homePanelAssetPanel").getElementsByClassName("HomePanelAssetSummaryPortStatus")[0].innerHTML = "Connected";
                //then send a notification
                notification.send("CONNECTED", this.name);
                break;
            case 'connection-disconnected':
                //set state
                this.setState(2);
                //then send a notification
                notification.send("ERROR, THIS ASSET IS NOT CONNECTED", this.name);
                break;
            case 'command-sent':
                //set state
                this.setState(3);
                break;
            case 'command-pause':
                //set state
                this.setState(4);
                break;
            case 'command-stop':
                //set state
                this.setState(5);
                break;
            case 'command-sync':
                //set state
                this.setState(6);
                //then send a notification
                notification.send("NOTICE, BEGINNING SOUND SYNC PROTOCOL", this.name);
                break;
            default:
                // do nothing if it defaults
        }
    }

    checkConnection() {
        var temp = this.name
        this.protocol.openConnection(function (worked) {
            if (worked) {
                global.objectList._AssetList.findKeyValuePair(temp).callEvent("connection-active")
            } else {
                global.objectList._AssetList.findKeyValuePair(temp).callEvent("connection-disconnected")
            }
        })
    }

    sendCommand(commandString) {
        if (this.protocol.isConnected) {
            this.protocol.transmitString(commandString);
            //custom event here 24
            if (commandString.includes("M24")) {
                this.callEvent('command-sync');
            } else if (commandString.includes("M0")) {
                this.callEvent('command-stop');
            } else if (commandString.includes("M23")) {
                this.callEvent('command-pause');
            } else {
                this.callEvent('command-sent');
            }
        } else {
            this.callEvent('connection-disconnected');
        }
    }

    generateAndSendLocalCommand() {
        var delayClamped = 0;
        var checkClamped = 0;
        var colorClamped = new Color("Custom", document.getElementById(this.name + "AssetPanel").querySelector('label[name="colorPicker"]').style.backgroundColor);
        var modeClamped = global.objectList._ModeList[document.getElementById(this.name + "AssetPanel").querySelector('select[name="modeDropdown"]').value];
        //clamp the dlay value
        if (document.getElementById(this.name + "AssetPanel").querySelector('input[name="delay"]').value != "" && !isNaN(document.getElementById(this.name + "AssetPanel").querySelector('input[name="delay"]').value)) {
            delayClamped = document.getElementById(this.name + "AssetPanel").querySelector('input[name="delay"]').value;
        }
        //generate a local command
        var localCommand = 'I0T0{' + colorClamped.returnColor()[0] + ',' + colorClamped.returnColor()[1] + ',' + colorClamped.returnColor()[2] + '}M' + modeClamped.Value + 'D' + delayClamped + '~';
        //var localCommand = 'T0C0R' + colorClamped.returnColor()[0] + 'G' + colorClamped.returnColor()[1] + 'B' + colorClamped.returnColor()[2] + 'M' + modeClamped.Value + 'D' + delayClamped + 'XS0~\n';
        //send it
        this.sendCommand(localCommand);
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
        //will update everything about the asset data
        //this.type = document.getElementById(this.name + "AssetPanel").querySelector('select[name="assetType"]').value;
        //this.comport = document.getElementById(this.name + "AssetPanel").querySelector('input[name="comport"]').value;
        //this.baudRate = document.getElementById(this.name + "AssetPanel").querySelector('input[name="baudrate"]').value;
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

    generateSearchResult(containerId) {
        var fooName = this.name + "AssetPanel"
        var assetPanelForSearch = document.createElement('div');
        assetPanelForSearch.className = "stageSearchPaneResult"; //gives it the proper styling
        assetPanelForSearch.id = this.name + "AssetSearchButton"; //name of this specific asset
        assetPanelForSearch.onclick = function () {
            onTabChanged('AssetContentPanel');
            var elmnt = document.getElementById(fooName);
            elmnt.scrollIntoView();
        };
        assetPanelForSearch.innerHTML =
            `
                <div class="stageSearchPaneResultState">` + "STBY" + `</div>
                <div class="stageSearchPaneResultSpacer"></div>
                <div class="stageSearchPaneResultType" style="background-color: #00eccc; color: rgb(66, 70, 77);">` + "ASSET" + `</div>
                <div class="stageSearchPaneResultAsset">` + this.name + `</div>
                <div class="stageSearchPaneResultAssetConnection">` + "Not Connected" + `</div>
            `;
        document.getElementById(containerId).appendChild(assetPanelForSearch);
    }

    createPaneForAsset() {
        //this creates the asset pane in the asset tab
        var assetPanelForAssetTab = document.createElement('div');
        assetPanelForAssetTab.className = "viewableAsset hoverPanelContent"; //gives it the proper styling
        assetPanelForAssetTab.id = this.name + "AssetPanel"; //name of this specific asset
        assetPanelForAssetTab.innerHTML =
            `
            <!--This will be the top bar of the asset for name, communication and basic status-->
            <div class="viewableAssetTopBar">
                ` + this.name + `
                <button class="viewableAssetTopBarConnect" onclick="global.objectList._AssetList.findKeyValuePair('` + this.name + `').checkConnection()">CONNECT</button>
                <div class="viewableAssetTopBarState">STBY</div>
            </div>
            <!--This will house various bits of information for this asset and possible more-->
            <div class="viewableAssetCommandGraph">          
                <div class="viewableAssetCommandGraphLog">
                </div>         
            </div>
            <!--This is a basic command panel in the asset panel so that test commands can be sent-->
            <div class="viewableAssetCommandConstruction">
                <!--Select the specific type of command-->
                <select class="viewableAssetCommandConstructionTypeSelect" name="typeDropdown">
                    <option value="0">Single Color RGB</option>
                    <option value="1">Dual Color RGB</option>
                </select>
                <!--The color pane that allows multiple colors>-->
                <div class="viewableAssetCommandConstructionColorPane">
                    <!--The colors for the command-->
                    <label class="viewableAssetCommandConstructionColor" name="colorPicker">
                        <input type="color" style="display: none;" onchange="this.parentElement.style.backgroundColor = this.value;  this.parentElement.style.color = this.value;" />
                        No Color
                    </label>
                </div>
                <!--The mode dropdown-->
                <select class="viewableAssetCommandConstructionModeSelect" name="modeDropdown">
                    <option value="0">Select Mode</option>
                </select>
                <!--The delay of the command-->
                <input class="viewableAssetCommandConstructionDelay" type="text" name="delay" placeholder="Set Delay (ms)">
                <!--The generated string-->
                <input class="viewableAssetCommandConstructionGeneratedString" type="text" name="generated_string" value="Generated String" readonly="readonly">
                <!--The send button-->
                <button type="button" class="viewableAssetCommandConstructionSend" onclick="global.objectList._AssetList.findKeyValuePair('` + this.name + `').generateAndSendLocalCommand()">
                    <svg id="viewableSlimCommandPlayIcon">
                    <use xlink:href="SvgIcons/play.svg#play_smallest"></use>
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
                <div class="rightPanelAssetButtonThumbnail">` + "STBY" + `</div>
                <div class="rightPanelAssetButtonText">` + this.name + `</div>
            `;
        document.getElementById('RightPanelAssetHolder').appendChild(assetPanelForRightSidebar);

        //make a microasset on the home panel
        var assetPanelForHomePanel = document.createElement('div');
        assetPanelForHomePanel.className = "HomePanelAssetSummary"; //gives it the proper styling
        assetPanelForHomePanel.id = this.name + "homePanelAssetPanel"; //name of this specific asset
        assetPanelForHomePanel.onclick = function () {
            onTabChanged('AssetContentPanel');
            var elmnt = document.getElementById(assetPanelForAssetTab.id);
            elmnt.scrollIntoView();
        };
        assetPanelForHomePanel.innerHTML =
            `
            <div class="HomePanelAssetSummaryName">` + this.name + `</div>
            <div class="HomePanelAssetSummaryColor">NULL</div>
            <div class="HomePanelAssetSummaryState">` + "STBY" + `</div>
            <div class="HomePanelAssetSummaryPortStatus">Not Connected</div>
        `;
        document.getElementById('HomeAssetSummary').appendChild(assetPanelForHomePanel);

        //make the nanoasset for each group in the group tab
        //global.objectList._GroupList.findKeyValuePair(this.parentElement.parentElement.parentElement.parentElement.id.replace('GroupPanel','')).updateGroup()
        var assetPanelForGroupPanel = document.createElement('label');
        assetPanelForGroupPanel.id = this.name + "groupPanelAssetPanel";
        assetPanelForGroupPanel.innerHTML =
            `
            <input type="checkbox" id="` + this.name + "groupPanelAssetCheckbox" + `" class="viewableGroupAssetButtonCheck" onchange="global.objectList._GroupList.findKeyValuePair(this.parentElement.parentElement.parentElement.parentElement.id.replace('GroupPanel','')).updateGroup()">
            <span class="viewableGroupAssetButton">
                <span class="viewableGroupAssetButtonThumbnail">` + "STBY" + `</span>
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
        //set the base state
        this.setState(0);

        //at this point run all update code so that the asset is fully up to date
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
    project: Project,
    protocol: Protocol
};