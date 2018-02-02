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

    //Test function to import files
    document.getElementById('file').addEventListener('change', () => {
        import_json();
    });
});


function import_json() {
    var input = document.getElementById('file');
    var current_data = input.files.item(0);
    var content = undefined;

    var file = input.files[0];
    let reader = new FileReader();

    reader.onload = function () {
        content = (this.result);
        _handle_data(JSON.parse(content));
    };
    reader.readAsText(current_data);
}

function _handle_data(obj) {
    console.log(obj);
}
