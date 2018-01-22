var DOM_UTILS = (function () {


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

    return {
        xpath: _xpath
    }

}());