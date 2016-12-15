var DEBUG_MODE = false;

/**
 * Detect Orbit's URL everytimes a tab is reloaded or openned
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    log(changeInfo.status);
    if (changeInfo.status === "complete") {
        checkForValidUrl(tab);
    }
});

/**
 * Manage local storage between extension & content script
 */
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    // local storage request
    if (request.storage) {
        if (typeof request.value !== 'undefined') {
            localStorage[request.storage] = request.value;
            log(localStorage);
        }
        sendResponse({storage: localStorage[request.storage]});
    } else {
        sendResponse({});
    }
});

/**
 * Check if current URL is on Orbit
 * @param  https://developer.chrome.com/extensions/tabs#type-Tab tab Tab to check
 * @return bool     Return True if you're on Orbit
 */
function checkForValidUrl(tab) {
    if ((tab.url.indexOf('https://beta-crm.mayden.co.uk/tasks/')) == 0 || (tab.url.indexOf('https://crm.mayden.co.uk/tasks/') == 0)) {
        chrome.pageAction.show(tab.id);

        log(tab.url);

        // Call content-script initialize function
        chrome.tabs.sendMessage(
            //Selected tab id
            tab.id,
            //Params inside a object data
            {message: "initialize"},
            //Optional callback function
            function(response) {
                //console.log(response);
                //update panel status
                //app.tabs[tab.id].panel.visible = response.status;
                //updateIconStatus(tab.id) 
            }
        );
    }
}

/**
 * Call console.log if in DEBUG mode only
 */
function log(obj) {
    if (DEBUG_MODE)
        console.log(obj);
}