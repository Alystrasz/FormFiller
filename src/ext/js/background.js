//*****************************************************//
// BACKGROUND SCRIPT SHOULD BE USED FOR 'HEAVY' TASKS  //
//*****************************************************//


//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('BACKGROUND');

//From : CONTENT_SCRIPT
MESSAGE_HANDLER.from('CONTENT_SCRIPT', function (message) {
    FormFillerLog.log('Received from content script : ' + message);
});

//From : POPUP
MESSAGE_HANDLER.from('POPUP', function (obj) {

    FormFillerLog.info('File received from user.');
    console.log(obj);
    var result,
    status = true,
    message = 'File parsed successfully!';

    //Is this JSON or YAML formatted?
    switch(obj.ext) {
        case 'json':
            try {
                result = JSON.parse(obj.content);
            } catch (e) {
                status = false;
                message = e.toString();
            }
            break;
        case 'yaml':
            try {
                result = jsyaml.load(obj.content);
            } catch (e) {
                status = false;
                message = e.toString();
            }
            break;
        default:
            message = 'File extension ' + obj.ext + ' not supported.';
            status = false;
    }



    MESSAGE_HANDLER.send('POPUP', {
        status: status,
        content: result,
        message: message
    });

    return true;
});
