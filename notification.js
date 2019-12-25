var messages = 0; //the global count of messages

//this is the function to send the notification
async function send(msg, sender) {
    //increments it
    messages++;
    var oof = messages;
    //create a new element
    var notification = document.createElement('div');
    notification.className = "singleNotification"; //gives it the proper styling
    notification.id = sender + oof + "Notification"; //name of this notification
    notification.innerHTML =
        `
        <div class="singleNotificationText">
            ` + sender.toUpperCase() + ": " + msg + `
        </div>
        <button class="singleNotificationCloseButton" title="Close" onclick="document.getElementById('` + sender + oof + "Notification" + `').parentNode.removeChild(document.getElementById('` + sender + oof + "Notification" + `'))">
            <svg class="singleNotificationClose">
                <use xlink:href="SvgIcons/disabled.svg#Capa_1"></use>
            </svg>
        </button>
    `;
    document.getElementById('notificationCenter').appendChild(notification);
    //fade it out
    killNotification(sender + oof + "Notification");
}

async function killNotification(title)
{
    setTimeout(function () {
        document.getElementById(title).style.animation = 'fadeOut .5s';
        setTimeout(function () {
            document.getElementById(title).parentNode.removeChild(document.getElementById(title));
        }, 500);
        
    }, 5000);
}

module.exports = { send };