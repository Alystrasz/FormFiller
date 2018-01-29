//When popup is ready
document.addEventListener('DOMContentLoaded', function () {

    //Init message handler
    var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('POPUP');

    //From : CONTENT_SCRIPT
    MESSAGE_HANDLER.from('CONTENT_SCRIPT', function (message) {

    });

    //From : BACKGROUND
    MESSAGE_HANDLER.from('BACKGROUND', function (message) {

    });

    //Attach action to found form button
    document.getElementById('find_forms').addEventListener('click', function () {
        //Send message to content script (tab context)
        MESSAGE_HANDLER.send('CONTENT_SCRIPT', 'get_forms', true);
    }, false);


});

