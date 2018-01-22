//Debug
FFLOG.info('Content script loaded');

//Listen for messages
//origin : background script
BROWSER_UTILS.MESSAGE.listen('BACKGROUND_SCRIPT', function (content) {
    FFLOG.log('*Message test* Received from background script >', content);
});

//Listen for messages
//origin : popup
BROWSER_UTILS.MESSAGE.listen('POPUP', function (content) {
    FFLOG.log('*Message* Received from popup script > ', content);

    //Test : action get_forms
    //TODO : snippet, implement this in a better way
    if (content === 'get_forms') {
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
        FFLOG.log('Found forms >', fmsInputs);
    }
});

//Test message to background (no tab specified)
//BROWSER_UTILS.MESSAGE.send('CONTENT_SCRIPT', 'test message');
