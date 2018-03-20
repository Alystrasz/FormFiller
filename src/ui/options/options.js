var exportAllInputsBox = document.getElementById('exportAllInputsBox');
var exportHiddenInputsBox = document.getElementById('exportHiddenInputsBox');
var langSelector = document.getElementById('langSelector');


document.addEventListener('DOMContentLoaded', function() {
    console.log('dom loaded')

    // 'Export all fields' option
    var allFields = STORAGE_UTILS.config_get('export_all_fields');
    exportAllInputsBox.checked = (allFields) ? true : false;

    // 'Export hidden inputs' option
    var hiddenFields = STORAGE_UTILS.config_get('export_hidden_fields');
    exportHiddenInputsBox.checked = (hiddenFields) ? true : false;

    // Language selection
    var language = STORAGE_UTILS.config_get('language');
    if(language)
        langSelector.selectedIndex = language;
    else
        langSelector.selectedIndex = 0;

});


exportAllInputsBox.addEventListener('change', function() {
    STORAGE_UTILS.config_set('export_all_fields', exportAllInputsBox.checked);
});

exportHiddenInputsBox.addEventListener('change', function() {
    STORAGE_UTILS.config_set('export_hidden_fields', exportHiddenInputsBox.checked);
});

langSelector.addEventListener('change', function() {
    STORAGE_UTILS.config_set('language', langSelector.selectedIndex);
});
