//Get form XPath
var formXPath = window.ffHFXPath;

//Check XPath
if (formXPath) {
    //Delete it
    delete window.ffHFXPath;
    //Resolving
    var formElement = DOM_UTILS.fromXPath(formXPath);

    if (formElement) {
        //Scroll to it
        DOM_UTILS.scroll_to(formElement.getBoundingClientRect(), 250, function () {

            //Next frame
            requestAnimationFrame(function () {

                //Save old border value
                var border = getComputedStyle(formElement).getPropertyValue('border'),
                    nBorder = '2px dashed red';
                //Flicker to notice user
                var flickerCount = 4,
                    flickerInterval = 120;

                function _flicker() {
                    formElement.style.border = nBorder;
                    setTimeout(function () {
                        formElement.style.border = border;
                        if (--flickerCount > 0) setTimeout(_flicker, flickerInterval);
                    }, flickerInterval);
                }

                //Trigger flickering
                _flicker();

            });

        });
    }
}