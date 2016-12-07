/** OrbitToTrello Application
 */

var OrbitToTrello = OrbitToTrello || {}; // Namespace initialization

OrbitToTrello.App = function() {
    this.popupView = new OrbitToTrello.PopupView();
    this.OrbitView = new OrbitToTrello.OrbitView();
    this.data = new OrbitToTrello.Model();
    
    this.bindEvents();
};

OrbitToTrello.App.prototype.bindEvents = function() {
   var self = this;
    
    /*** Data's events binding ***/
    
    this.data.event.addListener('onBeforeAuthorize', function() {
        self.popupView.showMessage('Authorizing...');    
    });
    
    this.data.event.addListener('onAuthenticateFailed', function() {
        self.popupView.showMessage('Trello authorization failed');    
    });
    
    this.data.event.addListener('onAuthorized', function() {
        log('OrbitToTrello.onAuthorized()');
        log("Status: " + Trello.authorized().toString());
    });
    
    this.data.event.addListener('onBeforeLoadTrello', function() {
        self.popupView.showMessage('Loading Trello data...');
    });
    
    this.data.event.addListener('onTrelloDataReady', function() {
        self.popupView.hideMessage();
        self.popupView.$popupContent.show();

        self.popupView.bindData(self.data);
    });
    
    this.data.event.addListener('onLoadTrelloListSuccess', function() {
        self.popupView.updateLists();
        self.popupView.validateData();
    });
    
    this.data.event.addListener('onSubmitComplete', function(target, params) {
        self.data.newCard.url = params.data.url;
        self.popupView.displaySubmitCompleteForm();
    });

    /*** PopupView's events binding ***/


    this.popupView.event.addListener('onPopupVisible', function() {
        var data = self.data;
        if (!data.isInitialized) {
            self.popupView.showMessage('Initializing...');
            self.popupView.$popupContent.hide();
            data.init();
        }
        else {
            self.popupView.reset();
        }
        data.Orbit = self.OrbitView.parseData();
        self.popupView.bindOrbitData(data.Orbit);
        //else log('GTT::Initializer closing:Data is already initialized');

    });

    this.popupView.event.addListener('onBoardChanged', function(target, params) {
        var boardId = params.boardId;
        if (boardId !== "_" && boardId !== "" && boardId!==null)
            self.data.loadTrelloLists(boardId);
    });
    
    this.popupView.event.addListener('onSubmit', function() {
        self.data.submit();
    });

    this.popupView.event.addListener('onRequestUpdateOrbitData', function() {
        self.data.Orbit = self.OrbitView.parseData();
        self.popupView.bindOrbitData(self.data.Orbit);
    });


  
    this.OrbitView.event.addListener('onDetected', function(){
        self.popupView.$toolBar = self.OrbitView.$toolBar;
        self.popupView.$toolBarHolder = self.OrbitView.$toolBarHolder;
        self.popupView.init();

    });

};

OrbitToTrello.App.prototype.initialize = function() {
    this.data.isInitialized = false;
    this.OrbitView.detect();
};
