var OrbitToTrello = OrbitToTrello || {};

OrbitToTrello.OrbitView = function () {

    this.LAYOUT_DEFAULT = 0;
    this.LAYOUT_SPLIT = 1;
    this.layoutMode = this.LAYOUT_DEFAULT;

    this.event = new EventTarget();
    this.data = null;

    this.$root = null;

    this.parsingData = false;


    this.selectors = {
        /* selectors mapping, modify here when Orbit's markup changes */
        toolbarButton: '.tooltipTop:first',
        toolBarHolder: '.taskHeader ',
        emailSubject: '.hP',
        emailBody: '.adO:first',
        viewport: '.aeJ:first',
        viewportSplit: '.aNW:first', //reading panel
        expandedEmails: '.h7',
        hiddenEmails: '.kv',
        emailInThreads: '.kv,.h7',
        timestamp: '.gH .gK .g3:first'
    };

};

OrbitToTrello.OrbitView.prototype.detectToolbar = function () {
    var $toolBar = null;
    var $toolBarHolder = null;
    $(this.selectors.toolBarHolder, this.$root).each(function () {
        if (this.clientWidth > 0) {
            $toolBarHolder = $(this);
            //log(this);
        }
    });

    if ($toolBarHolder) {
        log('Gtt::Detected toolBarHolder at: ');
        log($toolBarHolder);
        var $button = $toolBarHolder.find(this.selectors.toolbarButton);
        $toolBar = $button.parent();
    }

    this.$toolBar = $toolBar;
    this.$toolBarHolder = $toolBarHolder;
};

OrbitToTrello.OrbitView.prototype.detectSplitLayoutMode = function () {

    var self = this;

    var $activeGroup = $('.BltHke[role="main"]');

    if ($activeGroup.find('.apv').length > 0) {
        log('Gtt::Detected SplitLayout');

        this.layoutMode = this.LAYOUT_SPLIT;
        this.$root = $activeGroup;
        this.detectToolbar();

        //bind events
        var counter = 0;
        $('.BltHke .apv:not([gtt_event])').each(function () {
            counter++;
            $(this).attr('gtt_event', 1).click(function () {
                WaitCounter.start('emailclick', 500, 5, function () {
                    if (self.detectEmailOpenningMode()) {
                        //this.event.fire('onEmailChanged');
                        WaitCounter.stop('emailclick');
                    }
                });
            });
        });
        log('Binded email list click events: ' + counter + ' items');

        return true;
    }

    return false;
};

OrbitToTrello.OrbitView.prototype.detectEmailOpenningMode = function () {

    var self = this;
    this.$expandedEmails = this.$root.find(this.selectors.expandedEmails);

    var result = this.$toolBar && this.$toolBarHolder && this.$toolBar.length > 0 && this.$expandedEmails.length > 0 && this.$toolBarHolder !== null;
    if (result) {
        log('Gtt::Detected an email is openning');
        log(this.$expandedEmails);

        //bind events
        var counter = 0;
        this.$root.find('.kv:not([gtt_event]), .h7:not([gtt_event]), .kQ:not([gtt_event]), .kx:not([gtt_event])').each(function () {
            counter++;
            $(this).attr('gtt_event', 1).click(function () {
                WaitCounter.start('emailclick', 500, 5, function () {
                    if (self.detectEmailOpenningMode()) {
                        //this.event.fire('onEmailChanged');
                        WaitCounter.stop('emailclick');
                    }
                });
            });
        });
        log('Binded email threads click events: ' + counter + ' items');

        this.event.fire('onDetected');
    } else {
        this.event.fire('onDetected');
    }

    return result;

};

OrbitToTrello.OrbitView.prototype.detect = function () {
    //this.detectRoot();

    if (!this.detectSplitLayoutMode()) {
        this.$root = $('body');
        this.detectToolbar();
        this.detectEmailOpenningMode();
    }

};

OrbitToTrello.OrbitView.prototype.parseData = function () {
    compose = (f, g) => x => f(g(x));
    filter = f => x => x.filter(f);
    map = f => x => x.map(f);
    join = glue => str => str.join(glue);
    split = x => str => str.split(x);

    trace = x => {
        //console.log(x);
        return x;
    };
    _ = f => compose(trace, f);

    querySelect = x => document.querySelectorAll(x);
    asArray = x => Array.prototype.slice.call(x);
    find = compose(asArray, querySelect);
    eq = x => y => x === y;

    trim = str => str.trim();

    seperator = '----------------------';
    first = x => x[0];
    taskId = x => x.id.split('_')[1];
    taskBody = x => x.children[1];
    extractTitle = task => task.children[0].innerHTML;
    extractDetails = task => task.children[1].innerHTML.split('<br>');
    newLineJoin = compose(join('\n'), map(trim));
    notEmptyString = x => x !== '';
    validListItem = x => ['-', '*', 'Requirements:'].indexOf(x) === -1;
    points = (function (x) {
        var c = x.children[0].children[0].children;
        var b = 0;
        for (var i = 0; i < c.length; i++) {
            if (c[i].innerHTML === 'Scrum Points') {
                b = c[i].nextElementSibling.innerHTML;
            }
        }
        return b;
    });
    storify = task => {
        let partition = compose(split(seperator), _(newLineJoin));
        let asDetails = map(compose(filter(notEmptyString), split('\n')));
        let parts = compose(asDetails, partition)(task);
        let storyPieces = map(compose(map(trim), split(':')));

        return {
            story: storyPieces(parts[1] || []),
            requirements: filter(validListItem)(parts[2] || [])
        };
    };

    category = id => trim(find(`#taskEntry_${id} table tbody tr td`)[1].innerHTML);
    taskTitle = compose(extractTitle, taskBody);
    taskContent = compose(extractDetails, taskBody);
    isStory = compose(eq(seperator), compose(first, taskContent));

    rand = num => Math.floor(Math.random() * num);
    random = xs => () => prop(Math.floor(Math.random() * xs.length))(xs);
    oneOf = xs => random(xs)();
    header = x => '<strong class="card-info text-center inline-block colour-option-2">' + x + '</strong>';
    subHeader = x => '<strong class="card-info text-right colour-option-2">' + x + '</strong>';
    pointsdiv = x => '<strong class="card-info text-left colour-option-2">Points: ' + x + '</strong>';
    detailItem = x => `${x[0]}: ${x[1]}\n`;
    addHash = id => '# ' + id;
    wrapHtml = html => x => `${x}`;
    asList = wrapHtml('');
    asString = join('');

    buildStory = task => ({
            id: taskId(task),
            title: taskTitle(task),
            details: compose(storify, taskContent)(task),
            points: points(task),
            hours: 0,
            category: compose(category, taskId)(task)
        });
    stories = compose(filter(isStory), find);
    response = compose(JSON.stringify, map(buildStory));
    app = compose(response, stories);
    openTasksSelector = '.taskBody';
    orbitdata = app(openTasksSelector);


    log('Gtt::parsing data...');
    if (this.parsingData)
        return;

    this.parsingData = true;
    var startTime = new Date().getTime();
    var data = {};

    storyHtml = x => [
            data.subject = x.title,
            data.body = compose(asList, compose(asString, map(detailItem)))(x.details.story),
            data.taskID = x.id
        ]
    compose(map(storyHtml), JSON.parse)(orbitdata);


    // timestamp
    var $time = false;
    var timeValue = ($time) ? $time.attr('title') : '';
    timeValue = timeValue ? timeValue.replace('at', '') : '';
//    log(timeValue);
    if (timeValue !== '') {
        timeValue = Date.parse(timeValue);
//        log(timeValue);
        if (timeValue)
            timeValue = timeValue.toString('MMM d, yyyy');
    }

    data.time = timeValue;
    //log(data);

    var t = new Date().getTime();
    //log(data);
    //log('Elapsed: '+(t-startTime)/1000);
    this.parsingData = false;

    return data;
};