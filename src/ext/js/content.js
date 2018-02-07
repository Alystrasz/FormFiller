//Debug
FormFillerLog.info('Content script loaded');

//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('CONTENT_SCRIPT');

//*** ACTIONS MAP***//
ACTIONS_MAPPER.map('get_forms', _action_forms_get);

MESSAGE_HANDLER.send('BACKGROUND','test')

//From : BACKGROUND
MESSAGE_HANDLER.from('BACKGROUND', ACTIONS_MAPPER.process);

//From : POPUP
MESSAGE_HANDLER.from('POPUP', ACTIONS_MAPPER.process);


//TODO: tmp for demo ( oui c'est fait à l'arrache ;) )
function _compare(obj1, obj2, changed) {
    for (var k in obj2) {
        if (typeof obj2[k] === 'object') {
            _compare(obj1[k], obj2[k], changed);
        } else {
            if (obj1[k] !== obj2[k]) {
                changed.push({name: k, old: obj1[k], newest: obj2[k]});
                obj1[k] = obj2[k];
            }
        }
    }
}

function _observe(obj, clbk) {
    var baseVars = JSON.parse(JSON.stringify(obj));
    setInterval(function () {
        var changed = [];
        _compare(baseVars, obj, changed);
        if (changed.length > 0) {
            clbk(changed);
        }

    }, 1E3 / 60);
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
            //TODO : FOR DEMO ONLY
            (function () {
                var associatedForm = fModel;
                _observe(userModel, function (t) {
                    //Changed field
                    var changedField = t[0],
                        modelField = associatedForm.fields[changedField.name],
                        domField = DOM_UTILS.fromXPath(modelField.xpath);
                    console.log(domField, changedField);
                    domField.value = changedField.newest;
                });
            }());
            console.dir(userModel);


            //Apply form class mark
            forms[i].classList.add('formfiller_mark');

            //Prototyping export function
            (() => {
                let uuid = fModel.uuid;
                let model = userModel;
                forms[i].onclick = () => {
                    _launchDownload(uuid, model);
                };
            })();

            //Add fields
            fmsInputs.push(fFields);
        }
    }
    //Display in tab console
    FormFillerLog.log('Found forms >', fmsInputs);
}

function _launchDownload(formname, obj){
    // Setting up the link
    var link = document.createElement("a");
    link.setAttribute("target","_blank");
    if(Blob !== undefined) {
        var blob = new Blob([JSON.stringify(obj, null, 2)], {type: "application/json"});
        // type: "application/x-yaml"
        link.setAttribute("href", URL.createObjectURL(blob));
    } else {
        link.setAttribute("href", "data:text/plain," + encodeURIComponent(text));
    }
    link.setAttribute("download", formname + '.json');
    // Adding the link
    document.body.appendChild(link);
    link.click();
    // Removing the link
    document.body.removeChild(link);
}
