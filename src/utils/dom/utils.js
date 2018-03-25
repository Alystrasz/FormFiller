var DOM_UTILS = (function () {

    var DOM_VARS = {
        scrollInstance: null
    };

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
     * @param names Already registered names
     * @param inputWNameIndex Index of inputs without name
     * @returns {{name: string, inputWNameIndex: *}}
     * @private
     */
    function _input_name_deduce(input, names, inputWNameIndex) {
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
                        if (inputID && (inputLabel = labelSeek(inputParent, inputID))) {
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
            inputName += '[' + (names.filter(function (e) {
                return e === inputName;
            }).length + 1) + ']';
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
     * Deduce field values (ex : select)
     * @param fieldStruct
     * @returns {*}
     * @private
     */
    function _field_values(fieldStruct) {
        //Get type
        var fType = fieldStruct.type.split('-')[0].trim();
        //[select] list style
        if (fType === 'select') {
            //Get options
            return (Array.prototype.slice.call(fieldStruct.element.querySelectorAll('option')).map(function (element) {
                //Get inner text
                return element.innerText.replace(/[\n,\r]/g, '').trim();
            }));
        } else if (fType === 'radio') {
            return false;
        }
        return fieldStruct.values;
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
                inputNameStruct = _input_name_deduce(input, inputNames, inputWNameIndex),
                //Input struct
                iStruct = {
                    element: input,
                    type: input.type,
                    name: inputNameStruct.name,
                    values: '',
                    xpath: DOM_UTILS.xpath(input)
                };
            //Set inputs without name index
            inputWNameIndex = inputNameStruct.inputWNameIndex;
            //Deduce input values
            iStruct.values = _field_values(iStruct);
            //Add final structure to result
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
            var field = fields[i];
            //Model<>conversion
            fModel.fields[field.name] = {
                type: field.type,
                values: field.values,
                xpath: field.xpath
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
                formFillTemplate.data[k] = modelFields[k].values;
        }
        //Return template
        return formFillTemplate;
    }

    /**
     * Dispatch given event on element
     * @param element
     * @param eventName
     * @private
     */
    function _event_dispatch(element, eventName) {
        if ("createEvent" in document) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent(eventName, false, true);
            element.dispatchEvent(evt);
        }
        else element.fireEvent("on" + eventName);
    }

    /**
     * Set value of given field
     * @param element
     * @param type
     * @param value
     * @private
     */
    function _field_value_set(element, type, value) {
        //Get value namespace & type
        var fieldValueNamespace = 'value',
            fieldType = type.split('-')[0].trim();
        //Check types
        if (fieldType !== 'select') {
            if (fieldType === 'checkbox' || fieldType === 'radio') {
                fieldValueNamespace = 'checked';
            }
            //Set value
            element[fieldValueNamespace] = value;
        } else {
            //Get all options
            if (value instanceof Array) {
                var options = element.querySelectorAll('option'),
                    optionsLeft = value.length;
                //For each option
                for (var o = 0, olen = options.length; o < olen; ++o) {
                    var cOptions = options[o];
                    //If found in value
                    if (value.indexOf(cOptions.innerText.replace(/[\n,\r]/g, '').trim()) > -1) {
                        //Set selected
                        cOptions.selected = true;
                        //Loop optimization
                        if (--optionsLeft === 0) break;
                    }
                }
            }
        }
        //Dispatch change event
        _event_dispatch(element, 'change');
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
     * Abort current scroll animation
     * @private
     */
    function _dom_scroll_abort() {
        //Get scroll instance
        var scrollInstance = DOM_VARS.scrollInstance;
        //Check if scroll animation is still running
        if (scrollInstance !== null) {
            //Clear frame callback
            cancelAnimationFrame(scrollInstance);
            //Cancel frame
            DOM_VARS.scrollInstance = null;
            //Detach 'mousewheel' event
            window.removeEventListener('mousewheel', _dom_scroll_abort, true);
            //Detach 'touchmove' event
            window.removeEventListener('touchmove', _dom_scroll_abort, true);
        }
    }


    /**
     * Scroll dom to given bounds
     * @param bounds
     * @param duration
     * @param onEnd
     * @private
     */
    function _dom_scroll_to(bounds, duration, onEnd) {
        /**
         * Scroll ease in out quad calculation
         * @param t
         * @param b
         * @param c
         * @param d
         * @returns {*}
         * @private
         */
        function easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b
        }

        /**
         * Get curent scroll position
         * @returns {{top: number, left: number}}
         * @private
         */
        function _scroll_position() {
            return {
                top: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
                left: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft
            };
        }

        //Abort scroll if any
        _dom_scroll_abort();

        //Get vars
        var
            //Get scroll position
            scrollPosition = _scroll_position(),
            // Calculate how far to scroll
            stopY = Math.max(0, ((bounds.top + scrollPosition.top) - (window.innerHeight) / 2) + bounds.height),
            stopX = Math.max(0, ((bounds.left + scrollPosition.left) - (window.innerWidth + bounds.width) / 2)),
            // Cache starting position
            startY = scrollPosition.top,
            startX = scrollPosition.left,
            distanceX = stopX - startX,
            distanceY = stopY - startY,
            timeStart,
            timeElapsed,
            nextX, nextY;

        //Catch user mouse wheel to abort scroll
        window.addEventListener('mousewheel', _dom_scroll_abort, true);
        window.addEventListener('touchmove', _dom_scroll_abort, true);

        function loop(timeCurrent) {
            // Store time scroll started, if not started already
            if (!timeStart) {
                timeStart = timeCurrent
            }
            // Determine time spent scrolling so far
            timeElapsed = timeCurrent - timeStart;
            // Calculate next scroll position
            nextY = easeInOutQuad(timeElapsed, startY, distanceY, duration);
            nextX = easeInOutQuad(timeElapsed, startX, distanceX, duration);
            //Scroll to it
            window.scrollTo(nextX, nextY);
            // Keep scrolling or done
            if (timeElapsed < duration) {
                DOM_VARS.scrollInstance = requestAnimationFrame(loop);
            }
            else {
                //Abort scroll frame
                _dom_scroll_abort();
                // Account for rAF time rounding inaccuracies
                window.scrollTo(startX + distanceX, startY + distanceY);
                //Triggering onEnd clbk
                if (onEnd) onEnd();
                // Reset time for next jump
                timeStart = null;
            }
        }

        // Start the loop
        if (distanceX !== 0 || distanceY !== 0) DOM_VARS.scrollInstance = requestAnimationFrame(loop);
    }

    /**
     * Enter selection mode
     * @param targetDocument
     * @param onHover
     * @param onSelected
     * @param filterFunc
     * @param contextMenuItems
     * @returns {boolean}
     * @private
     */
    function _selection_mode_enable(targetDocument, onHover, onSelected, filterFunc, contextMenuItems) {

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

        //FF/IE FIX => Timeout hack to prevent content from being cleared when <iframe> is inserted
        setTimeout(function () {


            //Get doc & body
            var
                fDoc = selectionFrame.contentWindow.document,
                fHead = fDoc.head,
                fBody = fDoc.body,
                selectionStyle = fDoc.createElement('link'),
                contextMenuStyle = fDoc.createElement('link');
            selectionStyle.rel = 'stylesheet';
            selectionStyle.href = IO.url('src/ext/css/selection.css');
            contextMenuStyle.rel = 'stylesheet';
            contextMenuStyle.href = IO.url('src/ext/css/context-menu.css');
            fHead.appendChild(selectionStyle);
            fHead.appendChild(contextMenuStyle);

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

            /** HANDLE SELECTION **/

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

            //Handle clicks
            function _handleClick(e) {
                //Left click
                if (e.button === 0) {
                    //Undo context item
                    if (contextMenuItemsLen > 0) _contextMenu(false);
                    //Select event
                    if (lastHovered) {
                        onSelected(lastHovered);
                    }
                }
            }


            /** CONTEXT MENU **/

                //Check context menu items
            var contextMenuItemsLen = !contextMenuItems ? 0 : contextMenuItems.length;

            if (contextMenuItemsLen > 0) {

                //Create context menu
                var contextMenu = fDoc.createElement('div');
                contextMenu.className = 'ff-context';

                //Fill context items
                for (var i = 0; i < contextMenuItemsLen; ++i) {
                    //Category
                    var cItem = contextMenuItems[i],
                        contextItems = fDoc.createElement('ul');
                    contextItems.className = 'ff-items';
                    //For each category items
                    for (var name in cItem) {
                        if (cItem.hasOwnProperty(name)) {
                            //Get item & create it
                            var itemClick = cItem[name],
                                contextItem = fDoc.createElement('li');
                            contextItem.innerText = name;
                            contextItem.addEventListener('click', itemClick);
                            //Add it to category
                            contextItems.appendChild(contextItem);
                        }
                    }
                    //Add it to context menu
                    contextMenu.appendChild(contextItems);
                }

                //Add context menu
                fBody.appendChild(contextMenu);

                //Context menu trigger
                function _contextMenu(visible, coords) {
                    if (visible && coords) {
                        contextMenu.style.left = coords.left + 'px';
                        contextMenu.style.top = coords.top + 'px';
                    }
                    contextMenu.style.display = visible ? 'block' : 'none';
                }


                fDoc.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    _contextMenu(true, {
                        left: e.clientX,
                        top: e.clientY
                    });
                }, false);

            }

            /** EVENTS **/
            fDoc.addEventListener('mousemove', _handleMove);
            fDoc.addEventListener('click', _handleClick);
            window.addEventListener('scroll', _handleMove);
            window.ffSelectionModeHandler = _handleMove;

        }, 1);

        return true;

    }

    /**
     * Disable selection mode
     * @param targetDocument
     * @returns {boolean}
     * @private
     */
    function _selection_mode_disable(targetDocument) {
        //Get frame
        var selectionFrame = targetDocument.getElementById('ff-selection-mode-frame');
        if (selectionFrame) {
            //Delete events
            window.removeEventListener('scroll', window.ffSelectionModeHandler);
            delete window.ffSelectionModeHandler;
            //Delete it
            targetDocument.body.removeChild(selectionFrame);
            //OK
            return true;
        }
        return false;
    }

    /**
     * Get shadowed frame (style & scope isolation)
     * @param stylesheets
     * @param scripts
     * @param injected
     * @returns {*}
     * @private
     */
    function _shadow(stylesheets, scripts, injected) {

        //Check exists
        if (document.getElementById('ff-shadow-frame')) return false;

        //Create frame shadow
        var shadowFrame = document.createElement('iframe');
        shadowFrame.id = 'ff-shadow-frame';

        //Avoid flickering
        shadowFrame.style.display = 'none';
        document.body.appendChild(shadowFrame);

        //FF/IE FIX => Timeout hack to prevent content from being cleared when <iframe> is inserted
        setTimeout(function () {

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

            //Injected callback
            injected(shadowDoc);

        }, 1);

        return {
            document: shadowFrame.contentWindow.document,
            destroy: function () {
                if (document.body.contains(shadowFrame)) document.body.removeChild(shadowFrame);
            }
        };

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
        fPopup.innerHTML = '<h4 style="margin-top: 0">Veuillez choisir les champs à exporter</h4>';

        //Get user preference
        //TODO


        //For each field
        for (var name in fieldsModel.fields) {
            //Display field as checkbox
            var
                fExport = targetDocument.createElement('div'),
                label = targetDocument.createElement('label'),
                checkbox = targetDocument.createElement('input');

            checkbox.value = name;
            checkbox.type = 'checkbox';
            checkbox.setAttribute('checked', 'true');

            label.innerText = name;
            label.insertBefore(checkbox, label.firstChild);

            fExport.appendChild(label);

            //Add it to popup
            fPopup.appendChild(fExport);

        }

        //Buttons
        var buttons = targetDocument.createElement('div'),
            exportButton = targetDocument.createElement('div'),
            cancelButton = targetDocument.createElement('div'),
            exportClbk = function () {
            },
            cancelClbk = function () {
            };
        buttons.className = 'buttons';
        exportButton.innerHTML = 'Exporter';
        cancelButton.innerHTML = 'Annuler';
        exportButton.className = 'button';
        cancelButton.className = 'button';
        buttons.appendChild(exportButton);
        buttons.appendChild(cancelButton);
        fPopup.appendChild(buttons);
        //Export click
        exportButton.addEventListener('click', function () {
            //Filter with checked
            var filteredInputs = (fPopup.querySelectorAll('input[type="checkbox"]:checked'));
            //Replace user template data
            fieldsTemplate.data = {};
            for (var i = 0, ilen = filteredInputs.length; i < ilen; ++i) {
                var fieldName = filteredInputs[i].value;
                fieldsTemplate.data[fieldName] = fieldsModel.fields[fieldName].values;
            }
            //Callback (encapsulated, can change)
            exportClbk(fieldsModel, fieldsTemplate);
        });

        //Cancel
        cancelButton.addEventListener('click', function () {
            //Calback (encapsulated, can change)
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
        fields_popup: _fields_popup,
        scroll_to: _dom_scroll_to
    }

}());
