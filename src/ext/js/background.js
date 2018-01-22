//BACKGROUND SCRIPT SHOULD BE USED FOR 'HEAVY' TASKS


//Listen from content script
BROWSER_UTILS.MESSAGE.listen('CONTENT_SCRIPT', function(content, sender){
    //Debug
    FFLOG.log('*Message* Received from content script >', content);
    //NOTE : can get tab id origin on sender.tab.id
});

//Listen from popup
BROWSER_UTILS.MESSAGE.listen('POPUP', function(content){
    //Debug
    FFLOG.log('*Message* Received from popup  >', content);
    //Send back
    //NOTE : if no tab id is specified, message is received by extension scripts
    BROWSER_UTILS.MESSAGE.send('BACKGROUND_SCRIPT', 'PONG');
});


