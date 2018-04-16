var exportAllInputsBox = document.getElementById('exportAllInputsBox');
var exportHiddenInputsBox = document.getElementById('exportHiddenInputsBox');


document.addEventListener('DOMContentLoaded', function () {
    console.log('dom loaded')
    //Init message handler
    var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('OPTIONS');
    MESSAGE_HANDLER.send('BACKGROUND', {op: 'get_user_settings'}, false);

    //Init user settings
    MESSAGE_HANDLER.from('BACKGROUND', function (op) {
        // 'Export all fields' option
        exportAllInputsBox.checked = (op['export_all_fields']) ? true : false;

        // 'Export hidden inputs' option
        exportHiddenInputsBox.checked = (op['export_hidden_fields']) ? true : false;
    });


    exportAllInputsBox.addEventListener('change', function () {
        _save_user_settings()
    });

    exportHiddenInputsBox.addEventListener('change', function () {
        _save_user_settings()
    });


    function _save_user_settings() {
        var options = {
            export_all_fields: exportAllInputsBox.checked,
            export_hidden_fields: exportHiddenInputsBox.checked
        };
        MESSAGE_HANDLER.send('BACKGROUND', {op: 'save_user_settings', settings: options}, false);
    }

});
