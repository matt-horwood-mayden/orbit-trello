/*
 Flows:
    + 1st loading (onDocumentReady)
        - loadUserSettings()
        - initPopup() // html, data binding & event binding
        - initTrelloData()
        - extractData()
 
    + 2nd loading (onButtonToggle)
        - initTrelloData()
        - extractData()
 */

/**
 * Turn on/off debug mode with logging
 */
var logEnabled = false;

/**
 * Variable for debugging purpose only
 */
var globalInit = false;


/**
 * Global log. A wrapper for console.log, depend on logEnabled flag
 * @param  {any} data data to write log
 */
function log(data) {
    if (logEnabled)
        console.log(data);
};


/**
 * Handle request from background.js
 * @param  request      Request object, contain parameters
 * @param  sender       
 * @param  sendResponse Callback function
 */
function requestHandler(request, sender, sendResponse) {
    switch (request.message) {
        case "initialize":
            log('GTT::GlobalInit: '+globalInit.toString());
            globalInit = true;
            // enough delay for Orbit finishes rendering
            log('GTT::tabs.onUpdated - complete');
            setTimeout(function() {
                jQuery(document).ready(function() {                    
                    log('GTT::document.ready');
                    getOrbitObject();
                    app.initialize();
                });
            }, 1000);
            
            /**/
            break;
    }
}

// Register Handler
chrome.extension.onMessage.addListener(requestHandler);

var OrbitToTrello = OrbitToTrello || {}; // Namespace initialization
var app = new OrbitToTrello.App();

/**
 * Inject code: for accessing Orbit's GLOBALS object
 * reference: http://stackoverflow.com/questions/9602022/chrome-extension-retrieving-Orbits-original-message
 */

function getOrbitObject() {

    document.addEventListener('GTT_connectExtension', function(e) {
        app.data.userEmail = e.detail[10];
    });

    var actualCode = ['setTimeout(function() {', 
        'document.dispatchEvent(new CustomEvent("GTT_connectExtension", { ',
        '    detail: GLOBALS',
        '}));}, 0);'].join('\n');

    var script = document.createElement('script');
    script.textContent = actualCode;
    (document.head||document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);


}

/*
 *  UNIT TESTING GOES HERE. AFFECT TO EVERY PAGES
 */