//Debug
FormFillerLog.info('Content script loaded');

//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('CONTENT_SCRIPT');

//*** ACTIONS MAP***//
ACTIONS_MAPPER.map('get_forms', _action_forms_get);
ACTIONS_MAPPER.map('fill_form', _action_form_fill);
ACTIONS_MAPPER.map('selection_mode', _selection_mode_start);

//From : BACKGROUND
MESSAGE_HANDLER.from('BACKGROUND', ACTIONS_MAPPER.process);

//From : POPUP
MESSAGE_HANDLER.from('POPUP', ACTIONS_MAPPER.process);


/**
 * ACTION : selection mode
 * @private
 */
function _selection_mode_start() {

    //Get forms
    var forms = DOM_UTILS.forms(), fnFormsLen = forms.length, fnFormsFields = [];
    for (var i = 0; i < fnFormsLen; ++i) {

        //Get form fields
        var fFields = DOM_UTILS.fields(forms[i]);
        //Check eligibility
        if (fFields.length > 0) {
            //Apply form class mark
            forms[i].classList.add('formfiller_mark');
            //Add fields to fields array
            fnFormsFields.push(fFields);
        }
    }


    //Enable selection mode
    DOM_UTILS.selection_mode(document.body, function (element) {
        FormFillerLog.log('Hovered', element);
    }, function (element) {
        FormFillerLog.log('Selected', element);
    }, function (element) {
        //Check if element is in form fields
        var inForms = false;
        for (var f = 0; f < fnFormsLen && !inForms; ++f) {
            var fields = fnFormsFields[f];
            for (var fi = 0, filen = fields.length; fi < filen && !inForms; ++fi) {
                if (fields[fi].element === element) inForms = true;
            }
        }
        //Filter result
        return inForms;
    })
}

/**
 * Undo selection mode
 * @private
 */
function _selection_mode_end() {
    //Disable selection mode
    DOM_UTILS.selection_mode_end(document.body);
}


function _action_form_fill(message) {
    //Debug
    console.log(arguments);
    //Get template
    var userTemplate = message.userTemplate;
    if (userTemplate) {
        //Check associated form
        var associatedFormModel;
        console.log(userTemplate.associatedForm);
        if (userTemplate.associatedForm && (associatedFormModel = STORAGE_UTILS.get(userTemplate.associatedForm))) {
            //Form model as object
            associatedFormModel = JSON.parse(associatedFormModel);
            //Get fields to fill & user fields
            var associatedFormFields = associatedFormModel.fields,
                userFields = userTemplate.data;
            for (var fieldName in associatedFormFields) {
                //Get current field & user associated data
                var currentField = associatedFormFields[fieldName],
                    userFieldData = userFields[fieldName];
                //DEBUG
                FormFillerLog.log('Filling [' + fieldName + '] with data => ' + userFieldData);
                //Fill field with user data
                DOM_UTILS.field_value_set(DOM_UTILS.fromXPath(currentField.xpath), currentField.type, userFieldData);
            }

        } else {
            FormFillerLog.error('Form does not exists !');
        }
    }
}

/**
 * ACTION: Get forms
 * @private
 */
function _action_forms_get() {
    //Get forms
    var forms = DOM_UTILS.forms(), fmsInputs = [];
    for (var i = 0, flen = forms.length; i < flen; ++i) {
        //Get form fields
        var fFields = DOM_UTILS.fields(forms[i]);
        //Check eligibility
        if (fFields.length > 0) {
            //DEBUG : print associated form model
            var fModel = DOM_UTILS.fields_model(forms[i], fFields);
            console.log('----------------------------------------');
            console.log(' FORM APPLICATION MODEL');
            console.log('----------------------------------------');
            console.log(JSON.stringify(fModel, null, 2));

            console.log('----------------------------------------');
            console.log(' FORM USER MODEL');
            console.log('----------------------------------------');
            var userModel = DOM_UTILS.fields_template(fModel);
            console.dir(userModel);


            //Apply form class mark
            forms[i].classList.add('formfiller_mark');

            //Adding all inputs selection listener
            (function () {
                var fields = fFields;
                forms[i].addEventListener('click', function () {
                    _select_all_inputs(fields);
                }, false);
            })();

            //Prototyping export function
            (function () {
                var uuid = fModel.uuid;
                var form = forms[i];
                var fields = DOM_UTILS.fields(form, true);
                var tModel = DOM_UTILS.fields_model(form, fields);

                var btn = document.createElement('button');
                btn.className = 'formfiller_download_btn';
                btn.innerText = "Download form template";
                btn.setAttribute('type', 'button');
                btn.onclick = function (e) {
                    e.stopPropagation();
                    //Refreshing storage
                    fields = DOM_UTILS.fields(form, true);
                    //Downloading all inputs if none is selected
                    if (fields.length === 0)
                        fields = DOM_UTILS.fields(form);
                    tModel = DOM_UTILS.fields_model(form, fields);
                    uuid = tModel.uuid;
                    //TODO : tmp store form model
                    STORAGE_UTILS.store(uuid, JSON.stringify(tModel));
                    //Launching new model download
                    var selectionsModel = DOM_UTILS.fields_template(tModel);
                    _launchDownload(uuid, selectionsModel);
                };

                form.appendChild(btn);
            })();

            //Adding selection listeners
            (function () {
                var fields = fFields;

                for (var i = 0, len = fields.length; i < len; i++) {
                    (function () {
                        var field = fields[i].element;
                        field.addEventListener('click', function (e) {
                            _select_input(field);
                            e.stopPropagation();
                        }, false);
                    })();
                }
            })();


            //Add fields
            fmsInputs.push(fFields);
        }
    }
    //Display in tab console
    FormFillerLog.log('Found forms >', fmsInputs);
}

function _launchDownload(formname, obj) {
    // Setting up the link
    var link = document.createElement("a");
    link.setAttribute("target", "_blank");
    if (Blob !== undefined) {
        var blob = new Blob([JSON.stringify(obj, null, 2)], {type: "application/json"});
        // type: "application/x-yaml"
        link.setAttribute("href", URL.createObjectURL(blob));
    } else {
        link.setAttribute("href", "storage:text/plain," + encodeURIComponent(text));
    }
    link.setAttribute("download", formname + '.json');
    // Adding the link
    document.body.appendChild(link);
    link.click();
    // Removing the link
    document.body.removeChild(link);
}

function _select_input(node) {
    var selected = node.getAttribute('selected');
    if (selected === null)
        node.setAttribute('selected', '');
    else
        node.removeAttribute('selected');
}

function _select_all_inputs(fFields) {
    for (var i = 0, len = fFields.length; i < len; i++) {
        var elem = fFields[i].element;
        _select_input(elem);
    }
}
