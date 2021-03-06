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

const allTasks = new Set()
const seperator = '----------------------'
var cardData;
const trello = {
    apiKey: '12cf243effef7347ef8c4f82f0fcc97b'
}


const observer = new window.MutationObserver(mutations => {
    const tasks = document.querySelectorAll('.taskEntry')

    // filter out tasks we've already rendered
    const tasksToRender = Array.from(tasks).filter(task => !allTasks.has(task))

    // add all the tasks to the Set
    tasks.forEach(task => allTasks.add(task))

    tasksToRender.forEach(doStuff)
})
const doStuff = function (task) {
    const addCardButton = document.createElement('span')
    addCardButton.innerHTML = "\n\
<span id=\"gttButton\" class=\"T-I J-J5-Ji ar7 nf T-I-ax7 L3 label\" data-tooltip=\"Add this card to Trello\">\n\
    <div aria-haspopup=\"true\" role=\"button\" class=\"J-J5-Ji W6eDmd L3 J-J5-Ji Bq L3\" tabindex=\"0\" style=\"display: inline-block;\">\n\
        <!-- <img class=\"f tk3N6e-I-J3\" src=\"" + chrome_browser.extension.getURL('images/icon-13.jpg') + "\">\n -->\
        <span class=\"button-text\">Add card</span>\n\
    </div>\n\
</span>";

    const popup = document.createElement('span')
    popup.style.display = 'none'
    popup.innerHTML = '\
<div id="gttPopup" class="J-M jQjAxd open"> \
    <div class="inner"> \
        <div class="hdr clearfix"> \
            <div class="userinfo"> \
            </div> \
            <span class="item">|</span> \
            <a class="item orbit-trello-close-button" href="javascript:void(0)">[x] Close</a>   \
        </div> \
        <div class="content menuInnerContainer"> \
            <dl> \
                <dt>Board.:</dt> \
                    <dd><select class="orbit-trello-boards"></select></dd> \
                <dt>List:</dt> \
                    <dd class="clearfix listrow">\
                        <ul class="orbit-trello-lists"></ul>\
                    </dd> \
                <dt>Title:</dt> \
                    <dd><input type="text" class="orbit-trello-title" style="width: 100%" /></dd> \
                <dt>Description:</dt> \
                    <dd><textarea class="orbit-trello-description" style="height: 180px; width: 100%"></textarea></dd> \
                <dt>Task ID:</dt> \
                    <dd><input type="text" class="orbit-trello-task-id" style="width: 100%" /></dd> \
                <dd>\
                    <input type="checkbox" checked="checked" class="orbit-trello-chkBackLink" id="chkBackLink"/>\
                    <label for="chkBackLink">Link back to Orbit</label>\
                    <input type="checkbox" class="orbit-trello-chkSelfAssign" id="chkSelfAssign" style="margin-left:30px"> \
                    <label for="chkSelfAssign">Assign me to this card</label> \
                </dd> \
                <dd><input type="button" disabled="true" class="orbit-trello-addCardButton" id="addTrelloCard" value="Add to Trello card"></input></dd> \
           </dl> \
       </div> \
   </div> \
</div>';

    task.querySelector('.taskHeader div div').appendChild(addCardButton)
    document.body.appendChild(popup)

    popup.querySelector('.orbit-trello-addCardButton').addEventListener('click', event => {
        cardData = validateData(popup)
        submit(cardData, popup);
    })

    const closeButton = popup.querySelector('.orbit-trello-close-button')
    closeButton.addEventListener('click', function (event) {
        popup.style.display = 'none'
    })

    const boardSelect = popup.querySelector('.orbit-trello-boards')
    const listsList = popup.querySelector('.orbit-trello-lists')
    boardSelect.addEventListener('change', function (event) {
        const boardId = event.target.value
        updateList(listsList, boardId, popup)
    })

    addCardButton.addEventListener('click', function (event) {
        cardData = null
        if (popup.style.display === 'block') {
            popup.style.display = 'none'
            return
        }

        popup.style.display = 'block'

        const taskId = task.querySelector('[name="taskId"]').value

        const taskIdInput = popup.querySelector('.orbit-trello-task-id')
        taskIdInput.value = taskId

        const title = task.querySelector('.taskContent').children[0].innerHTML
        const titleInput = popup.querySelector('.orbit-trello-title')
        titleInput.value = title

        const body = task.querySelector('.taskContent').children[1].innerText
        if (body.indexOf(seperator) === 0) {
            var description = body.split(seperator)[1]
            description = description.split("\n").map(x => x.trim()).join("\n").trim()
        } else {
            var description = body
        }

        const descriptionInput = popup.querySelector('.orbit-trello-description')
        descriptionInput.textContent = description

        boardSelect.innerHTML = '';

        trello.boards.forEach(board => {
            const option = document.createElement('option')
            option.value = board.id
            option.textContent = board.name
            option.selected = board.id === localStorage.getItem('boardId')

            boardSelect.appendChild(option)
        })


        if (localStorage.getItem('useBacklink') !== 'false') {
            popup.querySelector('.orbit-trello-chkBackLink').checked = true
        } else {
            popup.querySelector('.orbit-trello-chkBackLink').checked = false
        }

        if (localStorage.getItem('selfAssign') === 'true') {
            popup.querySelector('.orbit-trello-chkSelfAssign').checked = true
        } else {
            popup.querySelector('.orbit-trello-chkSelfAssign').checked = false
        }

        updateList(listsList, boardSelect.value, popup)
    }, true)
}
/**
 * Handle request from background.js
 * @param  request      Request object, contain parameters
 * @param  sender       
 * @param  sendResponse Callback function
 */
function requestHandler(request, sender, sendResponse) {
    switch (request.message) {
        case "initialize":
            //console.log('first run');
            trello.user = trello.orgs = trello.boards = null;

            Trello.setKey(trello.apiKey);
            if(!localStorage.getItem('trello_token')){
                Trello.authorize({
                  type: 'popup',
                  name: 'Orbit Trello Plugin',
                  scope: {
                    read: 'true',
                    write: 'true' },
                  expiration: 'never'
                });
                localStorage.setItem('isAuth', 1);
            }else{
                Trello.authorize({
                    interactive: false,
                    success: function () {
                        Trello.get('members/me', {}, function (data) {
                            data.avatarUrl = data.avatarSource === 'upload' ? 'https://trello-avatars.s3.amazonaws.com/' + data.avatarHash + '/30.png' : null;
                            trello.user = data;

                            if (!data || !data.hasOwnProperty('id'))
                                return false;

                            // get user orgs
                            trello.orgs = [{id: -1, displayName: 'My Boards'}];
                            if (data.hasOwnProperty('idOrganizations') && data.idOrganizations.length > 0) {
                                Trello.get('members/me/organizations', {fields: "displayName"}, function (data) {
                                    for (var i = 0; i < data.length; i++) {
                                        trello.orgs.push(data[i]);
                                    }
                                });

                            }

                            // get boards list, including orgs
                            if (data.hasOwnProperty('idBoards') && data.idBoards.length > 0) {
                                trello.boards = null;
                                Trello.get('members/me/boards', {fields: "closed,name,idOrganization"}, function (data) {
                                    var validData = Array();
                                    for (var i = 0; i < data.length; i++) {
                                        if (data[i].idOrganization === null)
                                            data[i].idOrganization = -1;

                                        if (data[i].closed != true) {
                                            validData.push(data[i]);
                                        }
                                    }
                                    trello.boards = validData;
                                });
                            }

                        });
                    },
                })
                observer.observe(document.body, {childList: true, subtree: true})
            }
            /**/
            break;
    }
}

// Register Handler
chrome_browser.extension.onMessage.addListener(requestHandler);



submit = function (newCard, popup) {
    var self = this;
    if (newCard === null) {
        return false;
    }
    var data = newCard;

    if (data.useBacklink) {
        //var email = this.userEmail.replace('@', '\\@');
        var txtDirect = "[" + data.taskID + "](" + document.location.origin + "/tasks/" + data.taskID + " \"Direct link to task\")";

        var subject = encodeURIComponent(data.title);

        data.description += "\n\n---\nImported from Orbit: " + txtDirect;

    }

    localStorage.setItem('boardId', data.boardId)
    localStorage.setItem('listId', data.listId)
    localStorage.setItem('useBacklink', data.useBacklink)
    localStorage.setItem('selfAssign', data.selfAssign)

    var idMembers = null;
    if (data.selfAssign) {
        idMembers = trello.user.id;
    }
    //
    //submit data
    Trello.post('cards', {name: data.title, desc: data.description, idList: data.listId, idMembers: idMembers}, function (data) {
        popup.style.display = 'none';
    });

};

validateData = function (popup) {

    var newCard = {};
    var orgId = 'all';
    var boardId = popup.querySelector('.orbit-trello-boards').value;
    var listId = popup.querySelector('.orbit-trello-lists li.active').dataset.id;
    var title = popup.querySelector('.orbit-trello-title').value;
    var taskID = popup.querySelector('.orbit-trello-task-id').value;
    var description = popup.querySelector('.orbit-trello-description').value;
    var useBacklink = popup.querySelector('.orbit-trello-chkBackLink').checked;
    var selfAssign = popup.querySelector('.orbit-trello-chkSelfAssign').checked;
    var timeStamp = jQuery('.gH .gK .g3:first', this.$visibleMail).attr('title');

    var validateStatus = (boardId && listId && title);

    if (validateStatus) {
        newCard = {
            orgId: orgId,
            boardId: boardId,
            listId: listId,
            title: title,
            taskID: taskID,
            description: description,
            useBacklink: useBacklink,
            selfAssign: selfAssign,
            timeStamp: timeStamp
        };
        //this.data.newCard = newCard;
    }
    popup.querySelector('.orbit-trello-addCardButton').disabled = !validateStatus;

    return newCard;
};

const updateList = function (listsList, boardId, popup) {
    
    popup.querySelector('div .userinfo').innerHTML = '';
    //bind trello data
    var user = trello.user;
    var $userAvatar = '';
    if (user.avatarUrl) {
        $userAvatar = $('<img class="member-avatar">').attr('src', user.avatarUrl);
    }
    else {
        $userAvatar = $('<span class="member-avatar">').text(user.username.substr(0, 1).toUpperCase());
    }
    $('.userinfo', popup).append($('<a class="item">').attr('href', user.url).attr('target', '_blank').append($userAvatar));
    $('.userinfo', popup).append($('<a class="item">').attr('href', user.url).attr('target', '_blank').append(user.username));
    $('.userinfo', popup).append($('<span class="item">|</span> <a class="item signOutButton" href="javascript:void(0)">Logout?</a>'));

    Trello.get('boards/' + boardId, {lists: "open", list_fields: "name"}, function (data) {
        listsList.innerHTML = ''

        data.lists.forEach(list => {
            const li = document.createElement('li')
            li.dataset.id = list.id
            li.textContent = list.name

            li.addEventListener('click', function (event) {
                listsList.querySelectorAll('.active').forEach(li => li.classList.remove('active'))
                event.target.classList.add('active')
                cardData = validateData(popup);
            })

            listsList.appendChild(li)

            if (list.id === localStorage.getItem('listId')) {
                li.className = 'active'
                cardData = validateData(popup);
            }
        })
    })
}