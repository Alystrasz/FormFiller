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

    //Create frame overlay
    var selectionIframe = document.createElement('iframe');
    selectionIframe.className = 'ff-overlay';
    document.body.appendChild(selectionIframe);
    //Get doc & body
    var
        fDoc = selectionIframe.contentWindow.document,
        fHead = fDoc.head,
        fBody = fDoc.body,
        fStyle = fDoc.createElement('style');
    //Set style
    // noinspection JSAnnotator
    fStyle.innerHTML = `
    html,body{
        margin:0;
        padding:0;
        width: 100%;
        height: 100%;
        background: transparent !important;
    }
    
    body{
        overflow: hidden;
    }
    
    svg {
        position: fixed;
        top: 0;
        left: 0;
        cursor: crosshair !important;
        width: 100%;
        height: 100%;
    }
    
    svg > path:first-child {
        fill: rgba(0,0,0,0.5);
        fill-rule: evenodd;
    }
    
    svg > path + path {
        stroke: #F00;
        stroke-width: 0.5px;
        fill: rgba(255,63,63,0.20);
    }
    
    `;
    fHead.appendChild(fStyle);

    //Init svg namespace
    var svgnps = 'http://www.w3.org/2000/svg',
        //Set selection overlay (SVG)
        selectionOverlay = fDoc.createElementNS(svgnps, 'svg'),
        //Set paths
        p1 = fDoc.createElementNS(svgnps, 'path'),
        p2 = fDoc.createElementNS(svgnps, 'path');

    //Append paths
    selectionOverlay.appendChild(p1);
    selectionOverlay.appendChild(p2);

    //Append svg container
    fBody.appendChild(selectionOverlay);


    /**
     * Get associated poly path of given coords
     * @param x
     * @param y
     * @param w
     * @param h
     * @returns {string}
     * @private
     */
    function _poly(x, y, w, h) {
        var ws = w.toFixed(1);
        return 'M' + x.toFixed(1) + ' ' + y.toFixed(1) +
            'h' + ws +
            'v' + h.toFixed(1) +
            'h-' + ws +
            'z';
    }

    //Get window dimensions
    var ow = selectionIframe.contentWindow.innerWidth;
    var oh = selectionIframe.contentWindow.innerHeight;

    //Init background overlay path
    var baseBackgroundOverlayPath = _poly(0, 0, ow, oh);
    p1.setAttribute('d', baseBackgroundOverlayPath);

    /**
     * Highlight given element
     * @param element
     * @private
     */
    function _highlight(element) {
        //Init background overlay poly path
        var bgOverlayPoly = [
            'M0 0',
            'h', ow,
            'v', oh,
            'h-', ow,
            'z'
        ];
        //Get element position
        var pos = element.getBoundingClientRect(),
            //Get poly of pos
            poly = _poly(pos.left, pos.top, pos.width, pos.height);
        //Append poly path to overlay
        bgOverlayPoly.push(poly);
        //Set background overlay path
        p1.setAttribute('d', bgOverlayPoly.join(''));
        //Set highlight path
        p2.setAttribute('d', poly);
    }


    //Handler
    var prev = null;
    function _handleMouse(e){
        var hovered = (DOM_UTILS.elementFromPointDepth(e.clientX, e.clientY, 2));
        if (hovered) {
            if (hovered !== prev) {
                console.log(hovered);
                prev = hovered;
                _highlight(hovered);
            }
        } else {
            prev = null;
            p1.setAttribute('d', baseBackgroundOverlayPath);
            p2.setAttribute('d', '');
        }
    }

    //Set events
    fDoc.addEventListener('mousemove', _handleMouse);
    window.addEventListener('scroll', _handleMouse);

    //Set cursor
    document.body.style.cursor = 'crosshair !important';

}

/**
 * Undo selection mode
 * @private
 */
function _selection_mode_end() {

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
