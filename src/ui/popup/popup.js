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


    //Interactive selection
    document.getElementById('select_start').addEventListener('click', function () {
        //Send message to content script => entering selection mode
        MESSAGE_HANDLER.send('CONTENT_SCRIPT', {action: 'selection_mode'}, true);
    });

    //Attach action to found form button
    document.getElementById('find_forms').addEventListener('click', function () {
        //Send message to content script (tab context)
        MESSAGE_HANDLER.send('CONTENT_SCRIPT', {action: 'get_forms'}, true);
    }, false);

    //Import file
    document.getElementById('file_import').addEventListener('click', function () {
        MESSAGE_HANDLER.send('CONTENT_SCRIPT', {action: 'import_template'}, true);
    })


});
