//Debug
FormFillerLog.info('Content script loaded');

//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('CONTENT_SCRIPT');

//From : BACKGROUND
MESSAGE_HANDLER.from('BACKGROUND', function (message) {

});

/**
 * Get forms (TMP : will be moved to an action class)
 * @private
 */
function _get_forms() {
    //Get forms
    var forms = DOM_UTILS.forms(), fmsInputs = [];
    for (var i = 0, flen = forms.length; i < flen; ++i) {
        //Get form fields
        var fFields = DOM_UTILS.fields(forms[i]);
        //Check eligibility
        if (fFields.length > 0) {
            //TODO : snippet, re-implement in a safe way
            var formMetas = {
                uuid: COMPUTING.uuid(),
                xpath: DOM_UTILS.xpath(forms[i])
            };
            //DEBUG : print associated form model
            console.log(DOM_UTILS.fields_model(formMetas, fFields));
            //Apply form class mark
            forms[i].classList.add('formfiller_mark');
            //Add fields
            fmsInputs.push(fFields);
        }
    }
    //Display in tab console
    FormFillerLog.log('Found forms >', fmsInputs);
}

//From : POPUP
MESSAGE_HANDLER.from('POPUP', function (message) {

    //Action: get_forms
    if (message === 'get_forms') {
        _get_forms();
    }
});
