//Debug
FormFillerLog.info('Content script loaded');

//Init message handler
var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('CONTENT_SCRIPT');

//From : BACKGROUND
MESSAGE_HANDLER.from('BACKGROUND', function (message) {

});

//From : POPUP
MESSAGE_HANDLER.from('POPUP', function (message) {
    
    //Test : action get_forms
    //TODO : snippet, implement this in a better way
    if (message === 'get_forms') {
        //Get forms
        var forms = document.querySelectorAll('form'),
            fmsInputs = [];
        for (var i = 0, flen = forms.length; i < flen; ++i) {
            var inputs = forms[i].querySelectorAll('input'),
                finputs = [];
            for (var j = 0, ilen = inputs.length; j < ilen; ++j) {
                var input = inputs[j],
                    istruct = {
                        element: input,
                        type: input.type,
                        xpath: DOM_UTILS.xpath(input),
                        id: input.id,
                        class: input.className
                    };
                finputs.push(istruct);
            }
            fmsInputs.push(finputs);
            //Apply form class mark
            forms[i].classList.add('formfiller_mark');
        }
        //Display in tab console
        FormFillerLog.log('Found forms >', fmsInputs);
    }
});


