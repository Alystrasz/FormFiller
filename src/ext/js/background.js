//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('BACKGROUND');

//*** ACTIONS MAP***//
ACTIONS_MAPPER.map('get_models', _get_models);
ACTIONS_MAPPER.map('get_model', _get_model);
ACTIONS_MAPPER.map('save_model', _save_model);
ACTIONS_MAPPER.map('form_open_scroll', _form_open_scroll);
ACTIONS_MAPPER.map('import_settings', _send_settings);
ACTIONS_MAPPER.map('download_form', _launch_download);

//From : POPUP
MESSAGE_HANDLER.from('POPUP', ACTIONS_MAPPER.process);

//From : OPTIONS PAGE
MESSAGE_HANDLER.from('OPTIONS', function(data) {
    switch (data.op) {
        case 'get_user_settings':
            MESSAGE_HANDLER.send('OPTIONS', _get_user_settings(), false);
            break;

        case 'save_user_settings':
            console.log(data);
            STORAGE_UTILS.config_set('export_all_fields', data.settings['export_all_fields']);
            STORAGE_UTILS.config_set('export_hidden_fields', data.settings['export_hidden_fields']);
            break;

        default:
            break;

    }
})

//From : CONTENT_SCRIPT
MESSAGE_HANDLER.from('CONTENT_SCRIPT', ACTIONS_MAPPER.process);

//From : IO_UTILS
MESSAGE_HANDLER.from('IO_UTILS', ACTIONS_MAPPER.process);

function _launch_download(data, type, filename){
    var blob = new Blob([JSON.stringify(data, null, 2)], {type: type});
    var downloading = browser.downloads.download({
        url: URL.createObjectURL(blob),
        filename: filename
    });
}

function _send_settings(fieldsModel, fieldsTemplate) {
    this.sendResponse(ACTIONS_MAPPER.build('import_settings',
        [_get_user_settings()]));
}
/**
 * ACTION : get model with given args
 * @param pageDomain
 * @param associatedUUID
 * @param userTemplate
 * @private
 */
function _get_model(pageDomain, associatedUUID, userTemplate) {
    var associatedFormModel = STORAGE_UTILS.model_load(pageDomain, associatedUUID);
    this.sendResponse(ACTIONS_MAPPER.build('model_load', [associatedFormModel, userTemplate]));
}

/**
 * ACTION : get all models
 * @private
 */
function _get_models() {
    this.sendResponse(ACTIONS_MAPPER.build('saved_models', [STORAGE_UTILS.models()]));
}

/**
 * ACTION : save model
 * @param domain
 * @param modelTitle
 * @param uuid
 * @param model
 * @private
 */
function _save_model(domain, modelTitle, uuid, model) {
    STORAGE_UTILS.model_save(domain, modelTitle, uuid, model);
}

/**
 * ACTION : returns user settings
 * @private
 */
function _get_user_settings() {
    return {
        export_all_fields: STORAGE_UTILS.config_get('export_all_fields'),
        export_hidden_fields: STORAGE_UTILS.config_get('export_hidden_fields'),
        language: STORAGE_UTILS.config_get('language')
    };
}

/**
 * ACTION : open associated form URL & scroll to it
 * @private
 */
function _form_open_scroll(handledForm) {
    browser.tabs.create({
        active: true,
        url: handledForm.model.origin
    }).then(function (tab) {

        //Get tab id
        var tabId = tab.id;

        //Injecting form XPath (caring about formatting)
        browser.tabs.executeScript(tabId, {
            code: "window.ffHFXPath='" + handledForm.model.xpath.replace(/'/g, "\\'") + "'",
            runAt: "document_start"
        });

        //Injecting dom utils script
        browser.tabs.executeScript(tabId, {
            file: "/src/utils/dom/utils.js",
            runAt: "document_end"
        }).then(function () {
            //Injecting shared script to interact with current form
            browser.tabs.executeScript(tabId, {
                file: '/src/ext/js/shared/form_focus.js',
                runAt: "document_end"
            });
        });
    });
}

/*
*/
