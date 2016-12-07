var OrbitToTrello = OrbitToTrello || {};

OrbitToTrello.PopupView = function() {

    this.event = new EventTarget();
    this.isInitialized = false;

    this.data = null;

    this.MIN_WIDTH = 450;

    // process
    this.waitingHiddenThread = false;
    this.waitingHiddenThreadProcId = null;

};



OrbitToTrello.PopupView.prototype.init = function() {
    log('GTT::view::initializing...');

    //check if already init
    if (this.detectPopup()) 
        return true;

    // inject a button & a popup

    var strAddCardButtonHtml = "\n\
<span id=\"gttButton\" class=\"T-I J-J5-Ji ar7 nf T-I-ax7 L3\" data-tooltip=\"Add this card to Trello\">\n\
    <div aria-haspopup=\"true\" role=\"button\" class=\"J-J5-Ji W6eDmd L3 J-J5-Ji Bq L3\" tabindex=\"0\" style=\"display: inline-block;\">\n\
        <img class=\"f tk3N6e-I-J3\" src=\"" + chrome.extension.getURL('images/icon-13.jpg') + "\">\n\
        <span class=\"button-text\">Add card</span>\n\
    </div>\n\
</span>";

    var strPopupHtml = '\
<div id="gttPopup" class="J-M jQjAxd open" style="display:none"> \
    <div id="gttPopupSlider"></div> \
    <div class="inner"> \
	<div class="hdr clearfix"> \
		<div class="userinfo"> \
		</div> \
        <span class="item">|</span> \
        <a class="item" href="https://trello.com/b/CGU9BYgd/Orbit-to-trello-development" target="_blank"><img src="' + chrome.extension.getURL('images/new_icon.gif') + '" /> Features/Bugs</a> \
   		<a class="item" href="javascript:void(0)" id="close-button">[x] Close</a> 	\
	</div> \
	<div class="popupMsg">Loading...</div> \
        <div class="content menuInnerContainer" style="display:none"> \
            <dl> \
                <dt style="display:none">Orgs. filter:</dt> \
                <dd style="display:none"> \
                   <select id="gttOrg"> \
                      <option value="all">All</option> \
                      <option value="-1">My Boards</option> \
                   </select> \
                </dd> \
                <dt>Board.:</dt> \
                <dd><select id="gttBoard"></select></dd> \
                <dt>List:</dt> \
                <dd class="clearfix listrow">\
                    <span id="gttListMsg">Pickup a board above</span>\
                    <ul id="gttList"></ul>\
                </dd> \
                <dt>Title:</dt> \
                <dd><input type="text" id="gttTitle" /></dd> \
                <dt>Description:</dt> \
                <dd><textarea id="gttDesc" style="height:180px;width:300px"></textarea></dd> \
                <dt>Task ID:</dt> \
                <dd><input type="text" id="gttTaskID" /></dd> \
                <dd>\
                    <input type="checkbox" checked="checked" id="chkBackLink"/>\
                    <label for="chkBackLink">Link back to Orbit</label>\
                    <input type="checkbox" checked="checked" id="chkSelfAssign" style="margin-left:30px"> \
                    <label for="chkSelfAssign">Assign me to this card</label> \
                </dd> \
                <dd><input type="button" disabled="true" id="addTrelloCard" value="Add to Trello card"></input></dd> \
           </dl> \
       </div> \
   </div> \
</div>';

    this.$toolBar.append(strAddCardButtonHtml + strPopupHtml);
    this.$addCardButton = jQuery('#gttButton', this.$toolBar);
    this.$popup = jQuery('#gttPopup', this.$toolBar);

    this.$popupMessage = jQuery('.popupMsg', this.$popup);
    this.$popupContent = jQuery('.content', this.$popup);
    this.$popupChkOrbit = jQuery('#chkBackLink', this.$popup);
    this.$popupChkSelfAssign = jQuery('#chkSelfAssign', this.$popup);

    //resize popup window
    var parentWidth = this.$toolBarHolder[0].clientWidth;

    //log('resizing...');
    var left = this.$addCardButton.position().left; //related to its parent
    var minLeft = parentWidth - this.MIN_WIDTH + 1; // 
    if (left > minLeft)
        left = minLeft;

//    log(this.$toolBarHolder[0]);
    //log('parentWidth: '+parentWidth);
    //log('minLeft: '+minLeft);
    //log('defaultLeft: '+this.$addCardButton.position().left);
    //log('final left: '+left);

    //this.$popup.css('left', left + 'px');
    this.onResize();

    this.bindEvents();

    this.isInitialized = true;
};

OrbitToTrello.PopupView.prototype.detectPopup = function() {

    //detect duplicate toolBar
    var $button = $('#gttButton');
    var $popup = $('#gttPopup');
    if ($button.length>0) {
        log('GTT::Found Button at:');log($button);
        if ($button[0].clientWidth <= 0) {
            log('GTT::Button is in an inactive region. Moving...');
            //relocate
            $button.appendTo(this.$toolBar);
            $popup.appendTo(this.$toolBar);

        }
            // update when visible
        if ($popup[0].clientWidth > 0) {
            //log($popup[0]);
            //log($popup[0].clientWidth);
            this.event.fire('onRequestUpdateOrbitData');
        }
        return true;
    }
    else
        return false;

    //return $('#gttPopup').length>0;
};

OrbitToTrello.PopupView.prototype.loadSettings = function() {

};

OrbitToTrello.PopupView.prototype.onResize = function() {
    var textWidth = this.$popup.width() - 111;
    jQuery('input[type=text],textarea', this.$popup).css('width', textWidth + 'px');
};

OrbitToTrello.PopupView.prototype.bindEvents = function() {
    // bind events
    var self = this;

    /** Popup's behavior **/

    //slider
    var $slider = jQuery("#gttPopupSlider", this.$popup);
    var constraintRight = jQuery(window).width() - this.MIN_WIDTH;

    $slider.draggable({axis: "x", containment: [0, 0, constraintRight, 0],
        stop: function(event, ui) {
            var distance = ui.position.left - ui.originalPosition.left;
            self.$popup.css('width', self.$popup.width()-distance+'px');
            $slider.css('left', '0');
            //self.$popup.css('left', (self.$popup.position().left + distance) + 'px');
            //$slider.css('left', ui.originalPosition.left + 'px');
            self.onResize();
        }
    });

    jQuery('#close-button', this.$popup).click(function() {
        self.$popup.toggle();
    });

    /** Add Card Panel's behavior **/

    this.$addCardButton.click(function() {
        self.$popup.toggle();
        if (self.$popup.css('display') === 'block')
            self.event.fire('onPopupVisible');
        else {
            self.stopWaitingHiddenThread();
        }
    });

    jQuery('#gttOrg', this.$popup).change(function() {
        //log(boardId);
        self.updateBoards();
    });

    var $board = jQuery('#gttBoard', this.$popup);
    $board.change(function() {
        var boardId = $board.val();

        if (boardId === '_') {
            $board.val("");
        }

        var $list = jQuery('#gttList', self.$popup);
        var $listMsg = jQuery('#gttListMsg', self.$popup);

        $list.html('').hide();
        if (boardId === "_" || boardId === "") {
            $listMsg.text('Pickup a board above').show();
        }
        else {
            $listMsg.text('Loading...').show();
        }

        self.event.fire('onBoardChanged', {boardId: boardId});

        self.validateData();

    });

    jQuery('#addTrelloCard', this.$popup).click(function() {
        if (self.validateData()) {
            //jQuery('#addTrelloCard', this.$popup).attr('disabled', 'disabled');
            self.$popupContent.hide();
            self.showMessage('Submiting new card...');
            self.event.fire('onSubmit');
        }
    });


    //this.bindEventHiddenEmails();

};

OrbitToTrello.PopupView.prototype.bindData = function(data) {
    var self = this;

    this.data = data;

    //log(data.Orbit);

    this.$popupMessage.hide();
    this.$popupContent.show();

    //bind trello data
    var user = data.trello.user;
    var $userAvatar = '';
    if (user.avatarUrl) {
        $userAvatar = $('<img class="member-avatar">').attr('src', user.avatarUrl);
    }
    else {
        $userAvatar = $('<span class="member-avatar">').text(user.username.substr(0, 1).toUpperCase());
    }
    $('.userinfo', this.$popup).append($('<a class="item">').attr('href', user.url).attr('target', '_blank').append($userAvatar));
    $('.userinfo', this.$popup).append($('<a class="item">').attr('href', user.url).attr('target', '_blank').append(user.username));
    $('.userinfo', this.$popup).append($('<span class="item">|</span> <a class="item signOutButton" href="javascript:void(0)">Logout?</a>'));

    jQuery('.signOutButton', this.$popup).click(function() {
        self.showMessage('Sorry! I have not known yet :(. You may try the following: \
			<ol><li>Press Ctrl+Shift+Delete to open up "Clear browsing data" window</li> \
			<li>Choose "Clear data from hosted apps"</li> \
			<li>Proceed the "Clear browsing data" button</li> \
			</ol> \
			<a href="javascript:void(0)" class="hideMsg">Hide me</a>');
        jQuery('.hideMsg').click(function() {
            self.hideMessage();
        });

    });


    var orgs = data.trello.orgs;
    var $org = $('#gttOrg', this.$popup);
    $org.append($('<option value="all">All</option>'));
    for (var i = 0; i < orgs.length; i++) {
        var item = orgs[i];
        $org.append($('<option>').attr('value', item.id).append(item.displayName));
    }
    $org.val('all');
/*
    if (this.data.settings.orgId) {
        var settingId = this.data.settings.orgId;
        for (var i = 0; i < data.trello.orgs.length; i++) {
            var item = data.trello.orgs[i];
            if (item.id == settingId) {
                $org.val(settingId);
                break;
            }
        }
    }
*/
    this.updateBoards();

    if (data.settings.hasOwnProperty('useBacklink')) {
        jQuery('#chkBackLink', this.$popup).prop('checked', data.settings.useBacklink);
    }

    if (data.settings.hasOwnProperty('selfAssign')) {
        jQuery('#chkSelfAssign', this.$popup).prop('checked', data.settings.selfAssign);
    }

};

OrbitToTrello.PopupView.prototype.bindOrbitData = function(data) {
    //auto bind Orbit data
    jQuery('#gttTitle', this.$popup).val(data.subject);
    //log(data.body);
    jQuery('#gttDesc', this.$popup).val(data.body);
    jQuery('#gttTaskID', this.$popup).val(data.taskID);
    //jQuery('#gttDesc', this.$popup)[0].value = data.body;

    this.dataDirty = false;

};

OrbitToTrello.PopupView.prototype.showMessage = function(text) {
    this.$popupMessage.html(text).show();
};

OrbitToTrello.PopupView.prototype.hideMessage = function(text) {
    this.$popupMessage.hide();
};

OrbitToTrello.PopupView.prototype.updateBoards = function() {

    var $org = jQuery('#gttOrg', this.$popup);
    var orgId = $org.val();

    var orgs = this.data.trello.orgs;
    var filteredOrgs = [];

    if (orgId === 'all')
        filteredOrgs = orgs;
    else {
        for (var i = 0; i < orgs.length; i++) {
            if (orgs[i].id == orgId)
                filteredOrgs.push(orgs[i]);
        }
    }

    var boards = this.data.trello.boards;


    var $board = jQuery('#gttBoard', this.$popup);
    $board.append($('<option value="">Please select ... </option>'));
    for (var i = 0; i < filteredOrgs.length; i++) {
        var orgItem = filteredOrgs[i];
        // This is unnessessary because a "please select" option is already existed above
        // if (i > 0 && filteredOrgs.length > 1)
        //     $board.append($('<option value="_">-----</option>'));
        for (var j = 0; j < boards.length; j++) {
            if (boards[j].idOrganization == orgItem.id) {
                var item = boards[j];
                $board.append($('<option>').attr('value', item.id).append(orgItem.displayName + ' &raquo; ' + item.name));
            }
        }
    }

    var settings = this.data.settings;
    if (settings.orgId && settings.orgId == orgId && settings.boardId) {
        var settingId = this.data.settings.boardId;
        for (var i = 0; i < boards.length; i++) {
            var item = boards[i];
            if (item.id == settingId) {
                $board.val(settingId);
                break;
            }
        }
    }

    $board.change();
};

OrbitToTrello.PopupView.prototype.updateLists = function() {
    var self = this;
    var lists = this.data.trello.lists;
    var $gtt = $('#gttList', this.$popup);

    for (var i = 0; i < lists.length; i++) {
        var item = lists[i];
        $gtt.append($('<li>').attr('value', item.id).append(item.name));
    }
    $gtt.show();

    jQuery('#gttListMsg', this.$popup).hide();

    var listControl = new MenuControl('#gttList li');
    listControl.event.addListener('onMenuClick', function(e, params) {
        self.validateData();
    });

    var settings = this.data.settings;
    var orgId = jQuery('#gttOrg', this.$popup).val();
    var boardId = jQuery('#gttBoard', this.$popup).val();
    if (settings.orgId && settings.orgId == orgId && settings.boardId && settings.boardId == boardId &&
            settings.listId) {
        var settingId = settings.listId;
        for (var i = 0; i < lists.length; i++) {
            var item = lists[i];
            if (item.id == settingId) {
                jQuery('#gttList li[value="' + item.id + '"]').click();
                ;
                break;
            }
        }
    }
    else
        //select 1st list item
        jQuery('#gttList li:first').click();
};

OrbitToTrello.PopupView.prototype.stopWaitingHiddenThread = function() {
    if (this.waitingHiddenThreadProcId !== null) {
        this.waitingHiddenThread = false;
        this.waitingHiddenThreadRetries = 0;
        clearInterval(this.waitingHiddenThreadProcId);
    }
};

OrbitToTrello.PopupView.prototype.bindEventHiddenEmails = function() {
    var self = this;
    // update Orbit thread on click
    jQuery('#gttTitle', this.$popup).change(function() {
        self.dataDirty = true;
    });
    jQuery('#gttDesc', this.$popup).change(function() {
        self.dataDirty = true;
    });

    log('debug hidden threads');
    this.$expandedEmails.parent().find('> .kx,> .kv,> .kQ,> .h7').click(function() {
        if (self.$popup.css('display') === 'none')
            return;

        log('Hidden email thread clicked');
        log(this.classList);
        if (self.dataDirty)
            return;

        if (this.classList.contains('kx') || this.classList.contains('kQ'))
            return;
        else
            self.parseData();

        self.waitingHiddenThreadRetries = 10;
        self.waitingHiddenThreadElement = this;

        if (!self.waitingHiddenThread) {
            //loading, give it a change 
            self.waitingHiddenThread = true;
            self.waitingHiddenThreadProcId = setInterval(function() {
                log('waitingHiddenThread. round ' + self.waitingHiddenThreadRetries);
                var elm = self.waitingHiddenThreadElement;
                if (elm.classList.contains('h7') || elm.classList.contains('kv')) {
                    self.stopWaitingHiddenThread();
                    self.parseData();
                }
                if (self.waitingHiddenThreadRetries > 0)
                    self.waitingHiddenThreadRetries--;
                else
                    self.stopWaitingHiddenThread();
            }, 1000);
        }
    });
    //jQuery(this.selectors.hiddenEmails).click(function() {
    //log(this.classList);
    //    if (!self.dataDirty)
    //        self.parseData();
    //});    
};

OrbitToTrello.PopupView.prototype.validateData = function() {

    var newCard = {};
    var orgId = jQuery('#gttOrg', this.$popup).val();
    var boardId = jQuery('#gttBoard', this.$popup).val();
    var listId = jQuery('#gttList li.active', this.$popup).attr('value');
    var title = jQuery('#gttTitle', this.$popup).val();
    var taskID = jQuery('#gttTaskID', this.$popup).val();
    var description = jQuery('#gttDesc', this.$popup).val();
    var useBacklink = jQuery('#chkBackLink', this.$popup).is(':checked');
    var selfAssign = jQuery('#chkSelfAssign', this.$popup).is(':checked');
    var timeStamp = jQuery('.gH .gK .g3:first', this.$visibleMail).attr('title');

    var validateStatus = (boardId && listId && title);
    log('validateData: ' + boardId + ' - ' + listId);

    if (validateStatus) {
        newCard = {
            orgId: orgId,
            boardId: boardId,
            listId: listId,
            title: title,
            taskID : taskID,
            description: description,
            useBacklink: useBacklink,
            selfAssign: selfAssign,
            timeStamp: timeStamp
        };
        this.data.newCard = newCard;
    }
    jQuery('#addTrelloCard', this.$popup).attr('disabled', !validateStatus);

    return validateStatus;
};

OrbitToTrello.PopupView.prototype.reset = function() {
    this.$popupMessage.hide();
    this.$popupContent.show();
};

OrbitToTrello.PopupView.prototype.displaySubmitCompleteForm = function() {
    var data = this.data.newCard;
    log(this.data);

    // NB: this is a terrible hack. The existing showMessage displays HTML by directly substituting text strings.
    // This is very dangerous (very succeptible to XSS attacks) and generally bad practice.  It should be either 
    // switched to a templating system, or changed to use jQuery. For now, I've used this to fix
    // vulnerabilities without having to completely rewrite the substitution part of this code.
    // TODO(vijayp): clean this up in the future
    var jQueryToRawHtml = function(jQueryObject) {
        return jQueryObject.prop('outerHTML');
    }
    this.showMessage('A Trello card has been added <br /> <br />' + 
        jQueryToRawHtml($('<a>').attr('href', data.url).attr('target', '_blank').append(data.title)));
    this.$popupContent.hide();
};