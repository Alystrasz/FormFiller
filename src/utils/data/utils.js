var STORAGE_UTILS = (function () {

    var STORAGE_TEST_KEY = '2971344b-1076-4f31-8818-d67fbf22213f';

    /**
     * Checks if the localStorage API is supported by the browser
     * @returns {boolean} whether the API is supported or not
     * @private
     **/
    function _supported() {
        var storageAvailable = typeof(Storage) !== "undefined";
        if (storageAvailable) {
            try {
                _set(STORAGE_TEST_KEY, '1');
                _remove(STORAGE_TEST_KEY);
            } catch (e) {
                storageAvailable = false;
            }
        }
        return storageAvailable;
    }

    /**
     * Stores json object into user browser
     * @param {String} key name of the data
     * @param {String} strData string to store
     * @returns {boolean} whether the storage succeeded or not
     * @private
     **/
    function _set(key, strData) {
        localStorage.setItem(key, strData);
    }

    /**
     * Gets json object from user browser
     * @param {String} key name of the data
     * @returns {String} string data corresponding to key
     * @private
     **/
    function _get(key) {
        return localStorage.getItem(key);
    }

    /**
     * Remove given key data
     * @param key
     * @private
     */
    function _remove(key) {
        return localStorage.removeItem(key);
    }

    /**
     * Converts a json object to a yaml one
     * @param {JSON} json object to convert
     * @returns {YAML} converted object
     * @private
     **/
    function _json_to_yaml(json) {

    }

    /**
     * Converts a yaml object to a json one
     * @param {YAML} yaml object to convert
     * @returns {JSON} converted object
     * @private
     **/
    function _yaml_to_json(yaml) {
        return jsyaml.load(yaml);
    }

    var exports = {
        store: function (key, json) {
            return _set(key, json);
        },
        get: function (key) {
            return _get(key);
        },
        yaml_to_json: function(yaml) {
            return _yaml_to_json(yaml);
        }
    };

    //Check support
    if (!_supported()) {
        for (var k in exports) {
            exports[k] = function () {
                return false
            };
        }
    }

    return exports;


})(browser);
