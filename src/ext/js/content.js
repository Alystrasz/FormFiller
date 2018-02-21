//Debug
FormFillerLog.info('Content script loaded');

//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('CONTENT_SCRIPT');

//*** ACTIONS MAP***//
ACTIONS_MAPPER.map('get_forms', _action_forms_get);
ACTIONS_MAPPER.map('import_template', _action_template_import);
ACTIONS_MAPPER.map('selection_mode', _selection_mode_start);

//From : BACKGROUND
MESSAGE_HANDLER.from('BACKGROUND', ACTIONS_MAPPER.process);

//From : POPUP
MESSAGE_HANDLER.from('POPUP', ACTIONS_MAPPER.process);

//TODO : structure
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

//TODO : structure
(function () {
    var file = document.createElement('input');
    file.type = 'file';
    file.addEventListener('change', function (e) {
        var current_data = e.target.files[0],
            reader = new FileReader();
        reader.onload = function () {

            //Init result
            var result = {};
            //Get content & ext
            var content = this.result,
                ext = current_data.name.split('.').pop();
            //Is this JSON or YAML formatted?
            switch (ext) {
                case 'json':
                    try {
                        result = JSON.parse(content);
                    } catch (e) {
                        FormFillerLog.error('Parse error');
                    }
                    break;
                case 'yaml':
                    try {
                        result = jsyaml.load(content);
                    } catch (e) {
                        FormFillerLog.error('Parse error');
                    }
                    break;
                default:
                    FormFillerLog.error('Parse error => ext not supported');
            }

            _form_fill(result);

        };
        reader.readAsText(current_data);
    });
    file.style.display = 'none';
    file.accept = '.json,.yaml';
    file.id = 'file-import-dialog';
    document.body.appendChild(file);
})();

/**
 * ACTION : import file
 * @private
 */
function _action_template_import() {
    //Click on file dialog
    document.getElementById('file-import-dialog').click();
}

/**
 * ACTION : selection mode
 * @private
 */
function _selection_mode_start() {

    //Get forms
    var forms = DOM_UTILS.forms(), formsArray = Array.prototype.slice.call(forms), fnFormsLen = forms.length,
        fnFormsFields = [];
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

        //Undo select mode
        DOM_UTILS.selection_mode_end(document.body);

        //Retrieve associated form fields
        var associatedFieldsModel = fnFormsFields[formsArray.indexOf(element)];

        //If found
        if (associatedFieldsModel) {
            console.dir(associatedFieldsModel);

            //Get model & user template
            var fieldsModel = DOM_UTILS.fields_model(element, associatedFieldsModel),
                fieldsTemplate = DOM_UTILS.fields_template(fieldsModel);

            console.log('Application model', fieldsModel);
            console.log('User model', fieldsTemplate);

            //Show popup
            var fOverlay = document.createElement('div'),
                fPopup = document.createElement('div');
            fOverlay.className = 'ff-popup-overlay';
            fPopup.className = 'ff-popup';
            fPopup.innerHTML = '<h3>Veuillez choisir les champs à exporter</h3>';
            for (var name in fieldsModel.fields) {
                //Display field as checkbox
                var
                    fExport = document.createElement('div'),
                    label = document.createElement('label'),
                    checkbox = document.createElement('input');

                checkbox.value = name;
                checkbox.type = 'checkbox';
                label.innerText = name;
                label.insertBefore(checkbox, label.firstChild);

                fExport.appendChild(label);

                //Add it to popup
                fPopup.appendChild(fExport);

            }
            //Space
            fPopup.innerHTML += '<br/><br/>';


            //Export button
            var exportButton = document.createElement('button');
            exportButton.innerHTML = 'Exporter';
            fPopup.appendChild(exportButton);

            exportButton.addEventListener('click', function () {
                //Filter with checked
                var filteredInputs = (fPopup.querySelectorAll('input[type="checkbox"]:checked'));
                //Replace user template data
                fieldsTemplate.data = {};
                for (var i = 0, ilen = filteredInputs.length; i < ilen; ++i)
                    fieldsTemplate.data[filteredInputs[i].value] = '';
                //TODO : tmp store form model
                STORAGE_UTILS.store(fieldsModel.uuid, JSON.stringify(fieldsModel));
                //Download it
                _launchDownload(fieldsModel.uuid, fieldsTemplate);
                //Remove popup
                document.body.removeChild(fOverlay);
            });

            //Append to body
            fOverlay.appendChild(fPopup);
            document.body.appendChild(fOverlay);


        } else {
            FormFillerLog.error('No associated fields found');
        }


    }, function (element) {
        //Check if element is in form
        for (var f = 0; f < fnFormsLen; ++f)
            if (formsArray[f].contains(element)) return formsArray[f];
        return formsArray[formsArray.indexOf(element)];
    });
}

/**
 * Undo selection mode
 * @private
 */
function _selection_mode_end() {
    //Disable selection mode
    DOM_UTILS.selection_mode_end(document.body);
}

//TODO : structure
function _form_fill(userTemplate) {
    //Get template
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



