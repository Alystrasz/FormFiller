//*****************************************************//
// BACKGROUND SCRIPT SHOULD BE USED FOR 'HEAVY' TASKS  //
//*****************************************************//


//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('BACKGROUND');

//From : POPUP
MESSAGE_HANDLER.from('POPUP', function (message) {

});

//From : CONTENT_SCRIPT
MESSAGE_HANDLER.from('CONTENT_SCRIPT', function (obj) {

});
