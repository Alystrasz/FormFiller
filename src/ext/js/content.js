//Init vars
var CONTENT_VARS = {
    importDialog: IO.fileDialog(),
    shadowRoot: null
};

//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('CONTENT_SCRIPT');

//*** ACTIONS MAP***//
ACTIONS_MAPPER.map('import_template', _action_template_import);
ACTIONS_MAPPER.map('selection_mode_enable', _selection_mode_enable);
ACTIONS_MAPPER.map('selection_mode_disable', _selection_mode_disable);

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
function _selection_mode_enable() {

    //Get forms
    var forms = DOM_UTILS.forms(true), formsLen = forms.length;

    //Check found forms
    if (formsLen === 0) {
        alert("Aucun formulaire n'a été détecté sur la page !");
        return false;
    }

    //Creating shadow root
    //NOTE : each loaded resource must be declared in manifest
    CONTENT_VARS.shadowRoot = DOM_UTILS.shadow([
        IO.url('src/ext/css/frame.css'),
        IO.url('src/ext/css/layouts.css'),
        IO.url('src/ext/css/buttons.css')
    ]);

    //Replace document scope
    var document = CONTENT_VARS.shadowRoot.document;

    //Init context menu items
    var contextMenuItems = [],
        contextMenuFormsItems = {};
    //Cancel
    contextMenuItems.push({
        Annuler: _selection_mode_disable
    });
    //Forms
    for (var f = 0; f < formsLen; ++f) {
        //Closure mutation
        (function () {
            //Display forms in popup
            var form = forms[f].form;
            contextMenuFormsItems['Formulaire ' + (f + 1)] = function () {
                DOM_UTILS.scroll_to(form.getBoundingClientRect(), 250);
            }
        }());
    }
    contextMenuItems.push(contextMenuFormsItems);

    //Enable selection mode
    DOM_UTILS.selection_mode(document, function (element) {
        //DEBUG
        //FormFillerLog.log('Hovered', element);
    }, function (element) {

        //NOTE : element is type of form
        FormFillerLog.log('Selected', element);

        //Retrieve associated form fields
        var associatedFieldsModel;
        for (var f = 0; f < formsLen && !associatedFieldsModel; ++f) {
            //Current form
            var cForm = forms[f];
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

            //Instance fields selection popup
            var fieldsPopupSelection = DOM_UTILS.fields_popup(document, fieldsModel, fieldsTemplate);

            //Open fields selection
            fieldsPopupSelection.open(function (fieldsModel, fieldsTemplate) {
                //DEBUG
                FormFillerLog.log('Serving template', fieldsTemplate);
                //Storing form model into storage (TODO : Structure)
                STORAGE_UTILS.store(fieldsModel.uuid, JSON.stringify(fieldsModel));
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

        } else {
            alert('Erreur interne : récupération des champs impossible');
        }

    }, function (element) {
        //Check if element is in form or if it's the form itself
        for (var f = 0; f < formsLen; ++f) {
            var cForm = forms[f];
            if ((cForm.form === element)
                || cForm.form.contains(element)) return cForm.form;
        }
        return null;
    }, contextMenuItems);
}

/**
 * Undo selection mode
 * @private
 */
function _selection_mode_disable() {
    //Disable selection mode
    if (CONTENT_VARS.shadowRoot) {
        //Undo selection mode
        DOM_UTILS.selection_mode_end(CONTENT_VARS.shadowRoot.document);
        //Remove shadow
        CONTENT_VARS.shadowRoot.destroy();
        CONTENT_VARS.shadowRoot = null;
        //Un-mark forms
        DOM_UTILS.forms(false);
    }
}

/**
 * Fill form with given template (if found !)
 * @param userTemplate
 * @private
 */
function _form_fill(userTemplate) {
    //Get template
    if (userTemplate) {
        //Check associated form
        var associatedFormModel;
        //DEBUG
        FormFillerLog.log('Trying to load form UUID => ' + userTemplate.associatedForm);
        //Check associated form of template & storage association
        if (userTemplate.associatedForm && (associatedFormModel = STORAGE_UTILS.get(userTemplate.associatedForm))) {
            //Form model as object
            associatedFormModel = JSON.parse(associatedFormModel);
            //Get fields to fill & user fields
            var associatedFormFields = associatedFormModel.fields,
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
            alert("Le formulaire n'existe plus !");
        }
    }
}
