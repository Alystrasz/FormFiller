//When popup is ready
document.addEventListener('DOMContentLoaded', function () {

    //Init message handler
    var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('POPUP');

    //From : CONTENT_SCRIPT
    MESSAGE_HANDLER.from('CONTENT_SCRIPT', ACTIONS_MAPPER.process);

    //From : BACKGROUND
    MESSAGE_HANDLER.from('BACKGROUND', ACTIONS_MAPPER.process);

    //Send message to content script => exit selection mode
    MESSAGE_HANDLER.send('CONTENT_SCRIPT', ACTIONS_MAPPER.build('selection_mode_disable'), true);


    //Interactive selection
    document.getElementById('select_start').addEventListener('click', function () {
        //Send message to content script => entering selection mode
        MESSAGE_HANDLER.send('CONTENT_SCRIPT', ACTIONS_MAPPER.build('selection_mode_enable'), true);
    });

    //Import file
    document.getElementById('file_import').addEventListener('click', function () {
        MESSAGE_HANDLER.send('CONTENT_SCRIPT', ACTIONS_MAPPER.build('import_template'), true);
    });


});
