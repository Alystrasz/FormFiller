//When popup is ready
document.addEventListener('DOMContentLoaded', function () {

    //Send message to background (TEST)
    BROWSER_UTILS.MESSAGE.send('POPUP', 'POPUP CLICKED');

    //Attach action to found form button
    document.getElementById('find_forms').addEventListener('click', function () {
        //Request for forms in current tab
        BROWSER_UTILS.TABS.active(function (tab) {
            //Active tab found ?
            if (tab) {
                //Send message to current active tab
                BROWSER_UTILS.MESSAGE.send('POPUP', 'get_forms', tab.id);
            }
        });
    }, false);

    /*
    //Receive message form background (TEST)
    BROWSER_UTILS.MESSAGE.listen('BACKGROUND_SCRIPT', function(content){
        //Debug
        alert('*Message* Received from background script : ' + content);
    });
    */


});

