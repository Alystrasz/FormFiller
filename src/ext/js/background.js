//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('BACKGROUND');

//*** ACTIONS MAP***//
ACTIONS_MAPPER.map('get_models', _get_models);
ACTIONS_MAPPER.map('get_model', _get_model);
ACTIONS_MAPPER.map('save_model', _save_model);

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
    this.sendResponse(ACTIONS_MAPPER.build('saved_models', [STORAGE_UTILS.all()]));
}

/**
 * ACTION : save model
 * @param domain
 * @param pageTitle
 * @param uuid
 * @param model
 * @private
 */
function _save_model(domain, pageTitle, uuid, model) {
    STORAGE_UTILS.model_save(domain, pageTitle, uuid, model);
}
