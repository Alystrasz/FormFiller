//Init vars
var CONTENT_VARS = {
    importDialog: IO.fileDialog(),
    pageTitle: document.title,
    pageDomain: window.location.hostname || 'localhost',
    shadowRoot: null
};

var fieldsModel, fieldsTemplate, doc;

//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('CONTENT_SCRIPT');

//*** ACTIONS MAP***//
ACTIONS_MAPPER.map('import_template', _action_template_import);
ACTIONS_MAPPER.map('selection_mode_enable', _selection_mode_enable);
ACTIONS_MAPPER.map('selection_mode_disable', _selection_mode_disable);
ACTIONS_MAPPER.map('model_load', _form_fill_load);

//From : BACKGROUND
MESSAGE_HANDLER.from('BACKGROUND', ACTIONS_MAPPER.process);

//From : POPUP
MESSAGE_HANDLER.from('POPUP', ACTIONS_MAPPER.process);

/**
 * ACTION : import file
 * @private
 */
function _action_template_import() {
    //Get import dialog
    var importDialog = CONTENT_VARS.importDialog;
    if (importDialog) {
        //Open it
        importDialog.open(function (name, ext, data) {
            //Parse given file data with associated extension
            _form_fill(PARSING.parse(ext, data));
        });
    }
}

/**
 * ACTION : selection mode
 * @private
 */
function _selection_mode_enable(fieldsMode) {

    //Check in selection
    if (CONTENT_VARS.shadowRoot) return false;

    //Get formsFields
    var formsFields = DOM_UTILS.formsFields(true, fieldsMode), formsFieldsLen = formsFields.length;

    //Check found formsFields
    if (formsFieldsLen === 0) {
        alert(browser.i18n.getMessage('noFormsFound'));
        return false;
    }

    //Creating shadow root
    //NOTE : each loaded resource must be declared in manifest
    CONTENT_VARS.shadowRoot = DOM_UTILS.shadow([
        IO.url('src/ext/css/frame.css'),
        IO.url('src/ext/css/layouts.css'),
        IO.url('src/ext/css/buttons.css')
    ], null, function (document) {

        //NOTE : document is replaced in that scope

        //Init context menu items
        var contextMenuItems = [],
            contextMenuFormsItems = {},
            cancelAction = {},
            cancelBtn = browser.i18n.getMessage('cancelBtn');

        //Cancel
        cancelAction[cancelBtn] = function () {
            _selection_mode_disable(fieldsMode);
        };
        contextMenuItems.push(cancelAction);

        var formText = fieldsMode ? 'Champs' : browser.i18n.getMessage('form');
        //Forms
        for (var f = 0; f < formsFieldsLen; ++f) {
            //Closure mutation
            (function () {
                //Get subject form/field
                var subjectFormField = !fieldsMode ? formsFields[f].form : formsFields[f].fields[0];
                //Display formsFields in popup
                contextMenuFormsItems[formText + ' ' + (f + 1)] = function () {
                    DOM_UTILS.scroll_to(subjectFormField.getBoundingClientRect(), 250);
                }
            }());
        }
        contextMenuItems.push(contextMenuFormsItems);

        //Enable selection mode
        DOM_UTILS.selection_mode(document, function (element) {
            //DEBUG
            //FormFillerLog.log('Hovered', element);
        }, function (element) {

            doc = document;

            //NOTE : element is type of form
            FormFillerLog.log('Selected', element);

            //Retrieve associated form fields
            var associatedFieldsModel;
            for (var f = 0; f < formsFieldsLen && !associatedFieldsModel; ++f) {
                //Current form
                var cForm = formsFields[f];
                //Check form & get it's fields
                if (cForm.form === element) associatedFieldsModel = cForm.fields;
            }

            //If found
            if (associatedFieldsModel) {

                //Get model & user template
                var fieldsModel = DOM_UTILS.fields_model(element, associatedFieldsModel),
                    fieldsTemplate = DOM_UTILS.fields_template(fieldsModel);

                //DEBUG
                console.log('Application model', fieldsModel);
                console.log('User model', fieldsTemplate);

                /**
                 * Modal params callback (get from storage <=> background)
                 * @param settings
                 */
                function internalModalParamsClbk(settings) {

                    //Prevent further calls to params clbk (in that scope)
                    ACTIONS_MAPPER.map('import_settings', null);

                    //Instance fields selection popup
                    var fieldsPopupSelection = DOM_UTILS.fields_popup(document, fieldsModel, fieldsTemplate, settings['export_all_fields'] || false);

                    //Open fields selection
                    fieldsPopupSelection.open(function (fieldsModel, fieldsTemplate) {
                        //DEBUG
                        FormFillerLog.log('Serving template', fieldsTemplate);
                        //Custom title ?
                        var fTitle = prompt(browser.i18n.getMessage('formSelectionPopupChooseTitle'), CONTENT_VARS.pageTitle) || CONTENT_VARS.pageTitle;
                        //Storing form model into storage
                        MESSAGE_HANDLER.send('BACKGROUND', ACTIONS_MAPPER.build('save_model', [CONTENT_VARS.pageDomain, fTitle, fieldsModel.uuid, fieldsModel]));
                        //Download it
                        IO.download(window.location.hostname + '-' + fieldsModel.uuid, fieldsTemplate, IO.FTYPES.JSON);
                        //Remove fields popup
                        fieldsPopupSelection.destroy();
                        //End selection mode
                        _selection_mode_disable();
                    }, function () {
                        //Remove fields popup
                        fieldsPopupSelection.destroy();
                    });

                }

                //Map modal params response
                ACTIONS_MAPPER.map('import_settings', internalModalParamsClbk);

                //Send query to get modal params
                MESSAGE_HANDLER.send('BACKGROUND', ACTIONS_MAPPER.build('import_settings'));


            } else {
                //End selection mode
                _selection_mode_disable();
                //Error display
                alert('Erreur interne : récupération des champs impossible');
            }

        }, function (element) {
            //Check if element is in form or if it's the form itself
            for (var f = 0; f < formsFieldsLen; ++f) {
                var cForm = formsFields[f];
                if (cForm.fields.length > 0 && cForm.fields[0][0].element === element)
                    return cForm.fields[0][0].element;
                else if ((cForm.form && (cForm.form === element))
                    || (cForm.form && cForm.form.contains(element))) return cForm.form;
            }
            return null;
        }, contextMenuItems, fieldsMode, function (markedElements) {

            //Virtual conversion
            var virtualFieldsModel = [];

            for (var i = 0; i < formsFields.length; ++i) {
                var cField = formsFields[i].fields[0][0];
                if (markedElements.indexOf(cField.element) !== -1) virtualFieldsModel.push(cField)
            }

            //Get model & user template
            var fieldsModel = DOM_UTILS.fields_model(null, virtualFieldsModel),
                fieldsTemplate = DOM_UTILS.fields_template(fieldsModel);

            //Custom title ?
            var fTitle = prompt(browser.i18n.getMessage('formSelectionPopupChooseTitle'), CONTENT_VARS.pageTitle) || CONTENT_VARS.pageTitle;

            //Storing form model into storage
            MESSAGE_HANDLER.send('BACKGROUND', ACTIONS_MAPPER.build('save_model', [CONTENT_VARS.pageDomain, fTitle, fieldsModel.uuid, fieldsModel]));
            //Download it
            IO.download(window.location.hostname + '-' + fieldsModel.uuid, fieldsTemplate, IO.FTYPES.JSON);
            //End selection mode
            _selection_mode_disable(true);

        });

    });
}

/**
 * Undo selection mode
 * @private
 */
function _selection_mode_disable(fieldsMode) {
    //Disable selection mode
    if (CONTENT_VARS.shadowRoot) {
        //Undo selection mode
        DOM_UTILS.selection_mode_end(CONTENT_VARS.shadowRoot.document);
        //Remove shadow
        CONTENT_VARS.shadowRoot.destroy();
        CONTENT_VARS.shadowRoot = null;
    }
    //Un-mark formsFields
    DOM_UTILS.formsFields(false, fieldsMode);
}

/**
 * Fill form with given template (if found !)
 * @param userTemplate
 * @private
 */
function _form_fill(userTemplate) {
    //Get template
    if (userTemplate) {
        //DEBUG
        FormFillerLog.log('Trying to load form UUID => ' + userTemplate.associatedForm);
        //Check associated form of template & storage association
        if (userTemplate.associatedForm) {
            //Request associated form model (with domain and associatedForm, aka UUID)
            MESSAGE_HANDLER.send('BACKGROUND', ACTIONS_MAPPER.build('get_model', [CONTENT_VARS.pageDomain, userTemplate.associatedForm, userTemplate]));
        } else {
            alert("Erreur lors de la lecture du fichier !");
        }
    }
}

/**
 * ACTION : _form_fill_load
 * @param associatedFormModel
 * @param userTemplate
 * @private
 */
function _form_fill_load(associatedFormModel, userTemplate) {
    //Check associated form model
    if (associatedFormModel) {
        //Get fields to fill & user fields
        var associatedFormFields = associatedFormModel.model.fields,
            userFields = userTemplate.data;
        for (var fieldName in associatedFormFields) {
            //Check property
            if (associatedFormFields.hasOwnProperty(fieldName)) {
                //Get current field & user associated data
                var currentField = associatedFormFields[fieldName],
                    userFieldData = userFields[fieldName];
                //If not undefined
                if (userFieldData !== undefined) {
                    //DEBUG
                    FormFillerLog.log('Filling [' + fieldName + '] with data => ' + userFieldData);
                    //Fill field with user data
                    DOM_UTILS.field_value_set(DOM_UTILS.fromXPath(currentField.xpath), currentField.type, userFieldData);
                }
            }
        }
    } else {
        alert(browser.i18n.getMessage('noAssociatedForm'));
    }
}
