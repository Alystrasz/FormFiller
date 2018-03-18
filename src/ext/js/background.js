//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('BACKGROUND');

//*** ACTIONS MAP***//
ACTIONS_MAPPER.map('get_models', _get_models);
ACTIONS_MAPPER.map('get_model', _get_model);
ACTIONS_MAPPER.map('save_model', _save_model);
ACTIONS_MAPPER.map('form_open_scroll', _form_open_scroll);

//From : POPUP
MESSAGE_HANDLER.from('POPUP', ACTIONS_MAPPER.process);

//From : CONTENT_SCRIPT
MESSAGE_HANDLER.from('CONTENT_SCRIPT', ACTIONS_MAPPER.process);

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