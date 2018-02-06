//*****************************************************//
// BACKGROUND SCRIPT SHOULD BE USED FOR 'HEAVY' TASKS  //
//*****************************************************//


//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('BACKGROUND');

//From : CONTENT_SCRIPT
MESSAGE_HANDLER.from('CONTENT_SCRIPT', function (message) {
    FormFillerLog.log('Received from content script : ' + message);
    MESSAGE_HANDLER.send('CONTENT_SCRIPT', 'test_action_bg', true);
});

//From : POPUP
MESSAGE_HANDLER.from('POPUP', function (message) {

});

MESSAGE_HANDLER.from('RECEIVE_OBJECT', function (obj) {
    FormFillerLog.info('File received from user.');
    console.log(obj);
    let result;

    //Is this JSON or YAML formatted?
    switch(obj.ext) {
        case 'json':
            result = JSON.parse(obj.content);
            break;
        case 'yaml':
            result = jsyaml.load(obj.content);
            break;
        default:
            FormFillerLog.error('File extension ' + obj.ext + ' not supported.');
            return;
    }

    FormFillerLog.log('File sucessfully loaded.');
});
