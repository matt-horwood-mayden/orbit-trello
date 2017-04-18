/**
 * find out what the browser is
 **/
var chrome_browser;
navigator.browserInfo= (function(){
    var ua= navigator.userAgent, tem,
    M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return M.join(' ');
})();
if(navigator.browserInfo.indexOf('Firefox') != -1){
    chrome_browser = browser;
}else{
    chrome_browser = chrome;
}
/**
 * Detect Orbit's URL everytimes a tab is reloaded or openned
 */
chrome_browser.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
        checkForValidUrl(tab);
    }
});

/**
 * Manage local storage between extension & content script
 */
chrome_browser.extension.onMessage.addListener(function(request, sender, sendResponse) {
    // local storage request
    if (request.storage) {
        if (typeof request.value !== 'undefined') {
            localStorage[request.storage] = request.value;
            console.log(localStorage);
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
        chrome_browser.pageAction.show(tab.id);
        
        //console.log(tab.url);
        
        // Call content-script initialize function
        chrome_browser.tabs.sendMessage(
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
