var PARSING = (function () {

    function _parse(ext, data) {
        //Init result
        var result = null;
        //Is this JSON or YAML formatted?
        switch (ext) {
            case 'json':
                try {
                    result = JSON.parse(data);
                } catch (e) {
                    //No error display
                }
                break;
            case 'yaml':
                try {
                    result = jsyaml.load(data);
                } catch (e) {
                    //No error display
                }
        }
        return result;
    }

    return {
        parse: _parse
    }
}());