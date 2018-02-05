//Debug
FormFillerLog.info('Content script loaded');

//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('CONTENT_SCRIPT');

//From : BACKGROUND
MESSAGE_HANDLER.from('BACKGROUND', function (message) {

});

//*** ACTIONS MAP***//
ACTIONS_MAPPER.map('get_forms', _action_forms_get);

//From : POPUP
//Handle actions with mapper
MESSAGE_HANDLER.from('POPUP', ACTIONS_MAPPER.process);


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
            console.log(DOM_UTILS.fields_template(fModel));

            console.log('');
            console.log('');

            //Apply form class mark
            forms[i].classList.add('formfiller_mark');
            //Add fields
            fmsInputs.push(fFields);
        }
    }
    //Display in tab console
    FormFillerLog.log('Found forms >', fmsInputs);
}
