var DOM_UTILS = (function () {

    /**
     * Short version (useful for minify) of getAttribute
     * @param element
     * @param attrName
     * @returns {(string | null) | string}
     * @private
     */
    function _attr(element, attrName) {
        return element.getAttribute(attrName);
    }


    /**
     * Check if a dom element is visible by user
     * @param element
     * @returns {boolean}
     * @private
     */
    function _dom_visible(element) {
        var style = getComputedStyle(element);
        return ((style.getPropertyValue('display') !== 'none')
            && (style.getPropertyValue('visibility') !== 'hidden')
            && (element.offsetParent !== null));
    }

    /**
     * Get XPath of given element
     * @param element
     * @returns {string}
     * @private
     */
    function _xpath(element) {
        if (element.id !== '')
            return 'id("' + element.id + '")';
        if (element === document.body)
            return '//' + element.tagName;
        var ix = 0,
            siblings = element.parentNode.childNodes;
        for (var i = 0, slen = siblings.length; i < slen; i++) {
            var sibling = siblings[i];
            if (sibling === element)
                return _xpath(element.parentNode) + '/' + element.tagName + '[' + (ix + 1) + ']';
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                ix++;
        }
    }

    /**
     * Deduce input name
     * @param input
     * @param inputIndex (Used if no criteria has been found to deduce the name)
     * @param names Already registered names
     * @param inputWNameIndex Index of inputs without name
     * @returns {string}
     * @private
     */
    function _input_name_deduce(input, inputIndex, names, inputWNameIndex) {
        //Init result
        var inputName = '',
            //Input ID
            inputID = _attr(input, 'id');
        //Place holder ?
        if (!(inputName = _attr(input, 'placeholder'))) {
            //Aria label ?
            if (!(inputName = _attr(input, 'aria-label'))) {

                //Get input parent
                var inputParent = input.parentElement,
                    //Get siblings
                    inputParentPreviousSibling, inputPreviousSibling;

                //Check text node before parent or input
                if (!((inputPreviousSibling = input.previousSibling)
                        && (inputPreviousSibling.nodeType === 3)
                        && (inputName = inputPreviousSibling.textContent.trim()))) {
                    if (!(inputParent
                            && (inputParentPreviousSibling = inputParent.previousSibling)
                            && (inputParentPreviousSibling.nodeType === 3)
                            && (inputName = inputParentPreviousSibling.textContent.trim())) && inputParent) {

                        /**
                         * Seek for a <label> in given node children with optional label<for=optFor>
                         * @param node
                         * @param optFor
                         * @returns {*}
                         */
                        function childLabelSeek(node, optFor) {
                            //Init result
                            var result = null;
                            //Check node
                            if (node) {
                                //Get children list
                                var children = node.children;
                                //For each, while not found
                                for (var c = 0, chLen = children.length; (c < chLen && !result); ++c) {
                                    //Current child
                                    var cChild = children[c];
                                    //If <label>
                                    if (cChild.tagName === 'LABEL') {
                                        //Opt label<for=''> or ignore
                                        if ((cChild.getAttribute('for') === optFor)
                                            || !optFor)
                                            return cChild;
                                    } else {
                                        //Deep seek into current node children
                                        result = childLabelSeek(cChild, optFor);
                                    }
                                }
                            }
                            //Return node (found or not)
                            return result;
                        }

                        /**
                         * Seek for <label> in given node with optional label<for=forId>
                         * @param node
                         * @param forId
                         * @returns {*}
                         */
                        function labelSeek(node, forId) {
                            //Check if node is not going out of document
                            if (node !== document.body) {
                                //Seek for given label
                                var seekChild = childLabelSeek(node, forId);
                                //If not found
                                if (!seekChild) {
                                    //Seek in current node parent
                                    return labelSeek(node.parentElement, forId);
                                } else {
                                    //FOUND !
                                    return seekChild;
                                }
                            }
                            //Not found at all
                            return null;
                        }


                        //Init label search
                        var inputLabel;
                        //Seek for label, starting from input parent
                        if (inputLabel = labelSeek(inputParent, inputID)) {
                            //Label text content
                            inputName = inputLabel.firstChild.textContent;
                        } else {
                            //Check previous sibling element
                            var previousSiblingElem = input.previousElementSibling;
                            if (previousSiblingElem && previousSiblingElem.tagName === 'LABEL') {
                                inputName = previousSiblingElem.firstChild.textContent;
                            }
                        }
                    }

                }
            }
        }
        //**Last criteria** (default)
        if (!inputName) {
            //Name or ID ?
            inputName = _attr(input, 'name') || inputID
                || 'input[' + (inputWNameIndex++) + ']';
        }
        //Remove punctuation from input name
        var plInputName = inputName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ');
        //Extra-spaces & trim
        inputName = plInputName.replace(/\s{2,}/g, ' ').trim();
        //Check if name was already used
        var nameExists = names.indexOf(inputName);
        if (nameExists > -1) {
            //Get next occurrence count & fix name
            inputName += names.filter(function (e) {
                return e === inputName;
            }).length + 1;
        }
        //Push given name into registered names
        names.push(inputName);
        //Return final struct
        return {
            name: inputName,
            inputWNameIndex: inputWNameIndex
        };
    }

    /**
     * Return found fields of a given node
     * @param node
     * @returns {Array}
     * @private
     */
    function _fields(node) {
        //Get inputs & selects (as array)
        var inputs = Array.prototype.slice.call(node.querySelectorAll("input:not([type=submit]):not([type=button])" +
            ":not([type=file]):not([type=hidden]):not([type=image]):not([type=reset]):not([type=search])" +
            ",select, textarea")),
            finputs = [],
            //Save input names
            inputNames = [],
            //Inputs without name (index)
            inputWNameIndex = 0;
        //Filter visible inputs
        inputs = inputs.filter(function (element) {
            return _dom_visible(element);
        });
        //For each
        for (var j = 0, ilen = inputs.length; j < ilen; ++j) {
            //Current input
            var input = inputs[j],
                //Deduce input name
                inputNameStruct = _input_name_deduce(input, j, inputNames, inputWNameIndex),
                //Final input structure
                iStruct = {
                    element: input,
                    type: input.type,
                    name: inputNameStruct.name,
                    xpath: DOM_UTILS.xpath(input)
                };
            //Set inputs without name index
            inputWNameIndex = inputNameStruct.inputWNameIndex;
            //Add struct to result
            finputs.push(iStruct);
        }
        return finputs;
    }

    /**
     * Get fields model from given fields & metas
     * @param containerNode Node that contains given fields
     * @param fields Fields of model (of container)
     * @private
     */
    function _fields_model(containerNode, fields) {
        //Fields count
        var fCnt = fields.length,
            //Result
            fModel = {
                uuid: COMPUTING.uuid(),
                xpath: DOM_UTILS.xpath(containerNode),
                origin: location.origin + location.pathname,
                fields: {}
            };
        //For each field
        for (var i = 0; i < fCnt; ++i) {
            //Current
            var cField = fields[i];
            //Model<>conversion
            fModel.fields[cField.name] = {
                type: cField.type,
                xpath: cField.xpath
            }
        }
        //Return fields model
        return fModel;
    }

    /**
     * Get a 'fill' template of given fields model
     * @param fieldsModel
     * @returns {{associatedForm: *|uuidv4, data: {}}}
     * @private
     */
    function _fields_template(fieldsModel) {
        //Init template
        var formFillTemplate = {
            associatedForm: fieldsModel.uuid,
            data: {}
        }, modelFields = fieldsModel.fields;
        //Copy fields names
        for (var k in modelFields) {
            if (modelFields.hasOwnProperty(k))
                formFillTemplate.data[k] = '';
        }
        //Return template
        return formFillTemplate;
    }

    /**
     * Set value of given field
     * @param element
     * @param type
     * @param value
     * @private
     */
    function _field_value_set(element, type, value) {
        var vsetNamespace = 'value';
        if (type === 'checkbox' || type === 'radio') {
            vsetNamespace = 'checked';
        }
        if (type.split('-')[0].trim() !== 'select')
            element[vsetNamespace] = value;
        else {
            //TODO
            FormFillerLog.warn('Type : ' + type + ' not supported !');
        }
    }

    /**
     * Query node with given xpath
     * @param query
     * @returns {Node}
     * @private
     */
    function _xpathQuery(query) {
        var evaluateXPath = document.evaluate(query, document, null, XPathResult.ANY_TYPE, null);
        return evaluateXPath.iterateNext();
    }

    /**
     * Get forms & mark if wanted
     * @param mark
     * @param parentNodeOpt
     * @returns {Array}
     * @private
     */
    function _forms(mark, parentNodeOpt) {
        var forms = (parentNodeOpt || document).querySelectorAll('form'),
            fForms = [];
        for (var f = 0, flen = forms.length; f < flen; ++f) {
            //Get current form
            var cForm = forms[f],
                //Get form fields
                fFields = DOM_UTILS.fields(cForm);
            //Check eligibility
            if (fFields.length > 0) {
                //Apply form class mark
                if (mark) cForm.classList.add('ff-mark');
                else if (mark === false) cForm.classList.remove('ff-mark');
                //Add form to result
                fForms.push({
                    form: cForm,
                    fields: fFields
                });
            }
        }
        return fForms;
    }


    /**
     * Get element at given position and depth
     * @param x
     * @param y
     * @param depth
     * @returns {*}
     * @private
     */
    function _elementFromPointDepth(x, y, depth) {
        //Depth default
        depth = depth || 1;

        //Check params
        if (!x || !y) return null;

        //Init vars
        var elements = [], previousPointerEvents = [], current, i, d, currentDepth = 0;

        //For each element at this point
        while ((current = document.elementFromPoint(x, y)) && currentDepth < depth) {

            // Push element
            elements.push(current);
            //Push element pointer event
            previousPointerEvents.push({
                value: current.style.getPropertyValue('pointer-events'),
                priority: current.style.getPropertyPriority('pointer-events')
            });

            // Add "pointer-events: none", to get to the underlying element
            current.style.setProperty('pointer-events', 'none', 'important');

            //Depth keep going
            currentDepth++;
        }

        // Restore the previous pointer-events values
        for (i = previousPointerEvents.length; d = previousPointerEvents[--i];) {
            elements[i].style.setProperty('pointer-events', d.value ? d.value : '', d.priority);
        }

        //Return depth element
        var dElem = elements[depth - 1];
        if (dElem && dElem.tagName !== 'BODY' &&
            dElem.tagName !== 'HTML') return dElem;
        else return null;
    }

    /**
     * Enter selection mode
     * @param targetDocument
     * @param onHover
     * @param onSelected
     * @param onCancel
     * @param filterFunc
     * @private
     */
    function _selection_mode_enable(targetDocument, onHover, onSelected, onCancel, filterFunc) {

        //Check if frame already exists
        if (targetDocument.getElementById('ff-selection-mode-frame'))
            return false;

        //Get target container
        var targetContainer = targetDocument.body;

        //Default filter
        if (!filterFunc) {
            filterFunc = function () {
                return true;
            }
        }

        //Create frame overlay
        var selectionFrame = targetDocument.createElement('iframe');
        selectionFrame.id = 'ff-selection-mode-frame';
        selectionFrame.className = 'ff-overlay';
        targetContainer.appendChild(selectionFrame);

        //Get doc & body
        var
            fDoc = selectionFrame.contentWindow.document,
            fHead = fDoc.head,
            fBody = fDoc.body,
            fStyle = fDoc.createElement('link');
        fStyle.rel = 'stylesheet';
        fStyle.href = IO.url('src/ext/css/selection.css');
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
        var ow = selectionFrame.contentWindow.innerWidth;
        var oh = selectionFrame.contentWindow.innerHeight;

        //Init background overlay path
        var baseBackgroundOverlayPath = _poly(0, 0, ow, oh);
        //Fix flickering when appearing
        p1.style.fill = 'rgba(0,0,0,0)';
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

        /** HANDLERS **/

        var lastHovered = null;

        function _handleMove(e) {
            //depth=2, ignore overlay
            var hovered = (_elementFromPointDepth(e.clientX, e.clientY, 2));
            if (hovered && (hovered = filterFunc(hovered))) {
                if (hovered !== lastHovered) {
                    lastHovered = hovered;
                    _highlight(hovered);
                    onHover(hovered);
                }
            } else {
                lastHovered = null;
                p1.setAttribute('d', baseBackgroundOverlayPath);
                p2.setAttribute('d', '');
            }
        }

        function _handleClick() {
            if (lastHovered) {
                onSelected(lastHovered);
            }
        }

        function _handle_escape(e) {
            if (e.keyCode === 27) {
                console.log('cancel fucker')
                onCancel();
            }
        }


        //Set events
        fDoc.addEventListener('mousemove', _handleMove);
        window.addEventListener('scroll', _handleMove);
        fDoc.addEventListener('click', _handleClick);

        //Current framed document
        fDoc.onkeyup = _handle_escape;
        //Shadowed document
        targetDocument.onkeyup = _handle_escape;

        window.ffSelectionModeHandler = _handleMove;

    }

    /**
     * Disable selection mode
     * @param targetDocument
     * @private
     */
    function _selection_mode_disable(targetDocument) {
        //Get frame
        var selectionFrame = targetDocument.getElementById('ff-selection-mode-frame');
        if (selectionFrame) {
            //Delete events
            window.removeEventListener('scroll', window.ffSelectionModeHandler);
            document.documentElement.onkeyup = null;
            delete window.ffSelectionModeHandler;
            //Delete it
            targetDocument.body.removeChild(selectionFrame);
        }
    }

    /**
     * Get shadowed frame (style & scope isolation)
     * @returns {*}
     * @private
     */
    function _shadow(stylesheets, scripts) {

        //Check exists
        if (document.getElementById('ff-shadow-frame')) return null;

        //Create frame shadow
        var shadowFrame = document.createElement('iframe');
        shadowFrame.id = 'ff-shadow-frame';
        //Avoid flickering
        shadowFrame.style.display = 'none';
        document.body.appendChild(shadowFrame);

        //Get document & head
        var shadowDoc = shadowFrame.contentWindow.document,
            shadowHead = shadowDoc.head;

        //Stylesheets & scripts
        function _process_sheet(type, srcFile) {
            //Get associated relations
            var concreteSourceRef = (type === 'text/javascript' ? 'src' : 'href'),
                concreteTag = (type === 'text/javascript' ? 'script' : 'link');
            //Instance
            var sheetTag = shadowDoc.createElement(concreteTag);
            if (type === 'text/css') sheetTag.setAttribute('rel', 'stylesheet');
            sheetTag.setAttribute('type', type);
            sheetTag.setAttribute(concreteSourceRef, srcFile);
            //On load | error handler
            sheetTag.onload = _shadowExtResLoaded;
            sheetTag.onerror = _shadowExtResLoaded;
            //Add it
            shadowHead.appendChild(sheetTag);
        }

        //Total resources to load
        var totalRes = 0, resLoaded = 0;

        //_triggered when an external resource has been loaded
        function _shadowExtResLoaded() {
            resLoaded++;
            if (resLoaded >= totalRes) {
                requestAnimationFrame(function () {
                    //Undo flickering prevention
                    shadowFrame.style.display = '';
                    shadowFrame.className = 'ff-overlay';
                });
            }
        }

        //For each sheet
        var sheets = [], atIScripts, cSheetType = 'text/css';
        if (stylesheets) sheets = sheets.concat(stylesheets);
        atIScripts = sheets.length;
        if (scripts) sheets = sheets.concat(scripts);
        totalRes = sheets.length;
        if (totalRes > 0) {
            for (var s = 0; s < totalRes; ++s) {
                if (s >= atIScripts) cSheetType = 'text/javascript';
                _process_sheet(cSheetType, sheets[s]);
            }
        } else {
            _shadowExtResLoaded();
        }

        return {
            document: shadowDoc,
            destroy: function () {
                if (document.body.contains(shadowFrame)) document.body.removeChild(shadowFrame);
            }
        }
    }

    /**
     * Create fields selection popup from given model & template
     * @param targetDocument
     * @param fieldsModel
     * @param fieldsTemplate
     * @returns {*}
     * @private
     */
    function _fields_popup(targetDocument, fieldsModel, fieldsTemplate) {

        //Check exists
        if (targetDocument.getElementById('ff-fields-popup-container')) return null;

        //Show popup
        var fOverlay = targetDocument.createElement('div'),
            fPopup = targetDocument.createElement('div');
        fOverlay.className = 'ff-popup-overlay';
        fOverlay.id = 'ff-fields-popup-container';
        fPopup.className = 'ff-popup';
        fPopup.innerHTML = '<h3>Veuillez choisir les champs à exporter</h3>';
        for (var name in fieldsModel.fields) {
            //Display field as checkbox
            var
                fExport = targetDocument.createElement('div'),
                label = targetDocument.createElement('label'),
                checkbox = targetDocument.createElement('input');

            checkbox.value = name;
            checkbox.type = 'checkbox';
            label.innerText = name;
            label.insertBefore(checkbox, label.firstChild);

            fExport.appendChild(label);

            //Add it to popup
            fPopup.appendChild(fExport);

        }
        //Space
        fPopup.innerHTML += '<br/>';


        //Export button
        var exportButton = targetDocument.createElement('button'),
            cancelButton = targetDocument.createElement('button'),
            exportClbk = function () {
            },
            cancelClbk = function () {
            };
        exportButton.innerHTML = 'Exporter';
        cancelButton.innerHTML = 'Annuler';
        fPopup.appendChild(exportButton);
        fPopup.appendChild(cancelButton);

        //Export click
        exportButton.addEventListener('click', function () {
            //Filter with checked
            var filteredInputs = (fPopup.querySelectorAll('input[type="checkbox"]:checked'));
            //Replace user template data
            fieldsTemplate.data = {};
            for (var i = 0, ilen = filteredInputs.length; i < ilen; ++i)
                fieldsTemplate.data[filteredInputs[i].value] = '';
            //Callback
            exportClbk(fieldsModel, fieldsTemplate);
        });

        //Cancel
        cancelButton.addEventListener('click', function () {
            //Calback
            cancelClbk();
        });

        //Append popup to overlay
        fOverlay.appendChild(fPopup);

        //Get target container
        var targetContainer = targetDocument.body;

        //Append overlay in target container
        targetContainer.appendChild(fOverlay);

        //Associated functions
        return {
            open: function (onExport, onCancel) {
                exportClbk = onExport;
                cancelClbk = onCancel;
            },
            destroy: function () {
                //Remove popup
                if (targetContainer.contains(fOverlay)) {
                    //Remove overlay & other nodes
                    targetContainer.removeChild(fOverlay)
                }
            }
        }


    }

    return {
        xpath: _xpath,
        fromXPath: _xpathQuery,
        fields: _fields,
        fields_model: _fields_model,
        fields_template: _fields_template,
        field_value_set: _field_value_set,
        forms: _forms,
        selection_mode: _selection_mode_enable,
        selection_mode_end: _selection_mode_disable,
        shadow: _shadow,
        fields_popup: _fields_popup
    }

}());
