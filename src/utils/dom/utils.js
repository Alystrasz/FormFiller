var DOM_UTILS = (function () {

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
     * Return fields of a given node
     * @param node
     * @returns {Array}
     * @private
     */
    function _fields(node) {
        //Get inputs & selects
        var inputs = node.querySelectorAll("input:not([type=submit]):not([type=button])" +
            ":not([type=file]):not([type=hidden]):not([type=image]):not([type=reset]):not([type=search])" +
            ",select, textarea"),
            finputs = [];
        //For each
        for (var j = 0, ilen = inputs.length; j < ilen; ++j) {
            //Current input
            var input = inputs[j];

            //Trying to deduce name of field
            var fieldName = '',
                fPlaceHolder = '';

            //Label ?
            var parent = input.parentElement,
                sibling = input.previousElementSibling;
            //Get parent ?
            if (parent && parent.tagName === 'LABEL') {
                fieldName = parent.firstChild.textContent;
            } else if (sibling && sibling.tagName === 'LABEL') {
                //Get sibling
                fieldName = sibling.firstChild.textContent;
            }

            //Placeholder ?
            if (!fieldName) {
                if (fPlaceHolder = input.getAttribute('placeholder')) {
                    fieldName = fPlaceHolder;
                }
            }

            fieldName = fieldName.trim();

            //Final input structure
            var istruct = {
                element: input,
                type: input.type,
                name: fieldName,
                xpath: DOM_UTILS.xpath(input)
            };


            //Add to results
            finputs.push(istruct);
        }
        return finputs;
    }

    /**
     * Get fields model from given fields & metas
     * @param parentMetas
     * @param fields
     * @private
     */
    function _fields_model(parentMetas, fields) {
        //Fields count
        var fCnt = fields.length,
            fModel = {
                fields: {}
            };
        //Copy parentMetas into final model
        for (var k in parentMetas)
            if (parentMetas.hasOwnProperty(k))
                fModel[k] = parentMetas[k];
        //For each
        for (var i = 0; i < fCnt; ++i) {
            //Current
            var cField = fields[i];
            //Model conversion
            fModel.fields[cField.name] = {
                type: cField.type,
                xpath: cField.xpath
            }
        }
        return (JSON.stringify(fModel, null, 2));
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
        forms: _forms
    }

}());