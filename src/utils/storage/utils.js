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
     * @param key key name of the storage
     * @param strData data to save
     * @returns {boolean} Store result
     * @private
     */
    function _set(key, strData) {
        try {
            localStorage.setItem(key, strData);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * Gets json object from user browser
     * @param {String} key name of the storage
     * @returns {String} string storage corresponding to key
     * @private
     **/
    function _get(key) {
        return localStorage.getItem(key);
    }

    /**
     * Remove given key storage
     * @param key
     * @private
     */
    function _remove(key) {
        return localStorage.removeItem(key);
    }

    var exports = {
        store: function (key, json) {
            return _set(key, json);
        },
        get: function (key) {
            return _get(key);
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
