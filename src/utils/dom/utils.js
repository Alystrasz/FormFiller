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
            return '[id="' + element.id + '"]';
        if (element === document.body)
            return element.tagName.toLowerCase();
        var ix = 0,
            siblings = element.parentNode.childNodes;
        for (var i = 0; i < siblings.length; i++) {
            var sibling = siblings[i];
            if (sibling === element)
                return _xpath(element.parentNode) + '>' + element.tagName.toLowerCase() + (ix > 0 ? ':nth-child(' + (ix + 1) + ')' : '');
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                ix++;
        }
    }

    /**
     * Deduce input name
     * @param input
     * @param inputIndex (Used if no criteria has been found to deduce the name)
     * @param names Already registered names
     * @returns {string}
     * @private
     */
    function _input_name_deduce(input, inputIndex, names) {
        //Init result
        var inputName = '';
        //Place holder ?
        if (inputName = _attr(input, 'placeholder')) {
        } else {
            //Aria label ?
            if (inputName = _attr(input, 'aria-label')) {
            } else {

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
                var inputLabel,
                    inputID = _attr(input, 'id'),
                    inputParent = input.parentElement;
                //Seek for label, starting from input parent
                if (inputParent) {
                    inputLabel = labelSeek(inputParent, inputID);
                }

                //Label not found ? **Last criteria**
                if (!inputLabel) {
                    //Name or ID ?
                    inputName = _attr(input, 'name') || inputID
                        || 'input[' + inputIndex + ']';
                } else {
                    //Label text content
                    inputName = inputLabel.firstChild.textContent;
                }
            }
        }
        //Trim name
        inputName = inputName.trim();
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
        //Return final name
        return inputName;
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
            inputNames = [];
        //Filter visible inputs
        inputs = inputs.filter(function (element) {
            return _dom_visible(element);
        });
        //For each
        for (var j = 0, ilen = inputs.length; j < ilen; ++j) {
            //Current input
            var input = inputs[j],
                //Final input structure
                iStruct = {
                    element: input,
                    type: input.type,
                    name: _input_name_deduce(input, j, inputNames),
                    xpath: DOM_UTILS.xpath(input)
                };
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
                associatedForm : fieldsModel.uuid,
                data:{}
            }, modelFields = fieldsModel.fields;
        //Copy fields names
        for(var k in modelFields){
            formFillTemplate.data[k] = '';
        }
        //Return template
        return formFillTemplate;
    }


    /**
     * Get forms of given parent node or default
     * @param parentNodeOpt
     * @returns {NodeListOf<ElementTagNameMap["form"]>}
     * @private
     */
    function _forms(parentNodeOpt) {
        return (parentNodeOpt || document).querySelectorAll('form');
    }

    return {
        xpath: _xpath,
        fields: _fields,
        fields_model: _fields_model,
        fields_template:_fields_template,
        forms: _forms
    }

}());