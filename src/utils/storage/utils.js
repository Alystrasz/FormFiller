var STORAGE_UTILS = (function () {

    var
        STORAGE_NAMESPACE = COMPUTING.md5('FF-STORAGE'),
        STORAGE_TEST_KEY = '2971344b-1076-4f31-8818-d67fbf22213f';

    /**
     * Checks if the localStorage API is supported by the browser
     * @returns {boolean} whether the API is supported or not
     * @private
     **/
    function _supported() {
        var storageAvailable = typeof(Storage) !== "undefined";
        if (storageAvailable) {
            try {
                localStorage.setItem(STORAGE_TEST_KEY, '1');
                localStorage.removeItem(STORAGE_TEST_KEY);
            } catch (e) {
                storageAvailable = false;
            }
        }
        return storageAvailable;
    }

    /**
     * Get namespace structure
     * @returns {string | null | {}}
     * @private
     */
    function _namespace_get() {
        return localStorage.getItem(STORAGE_NAMESPACE) || '{}';
    }

    /**
     * Update namespace structure
     * @param structure
     * @private
     */
    function _namespace_update(structure) {
        return localStorage.setItem(STORAGE_NAMESPACE, JSON.stringify(structure));
    }

    /**
     * Stores json object into user browser
     * @param key key name of the storage
     * @param data data to save
     * @returns {boolean} Store result
     * @private
     */
    function _set(key, data) {
        var structure = JSON.parse(_namespace_get());
        structure[key] = data;
        try {
            _namespace_update(structure);
        } catch (e) {
            return false;
        }
        return true;
    }

    /**
     * Gets json object from user browser
     * @param key
     * @returns {*}
     * @private
     */
    function _get(key) {
        return JSON.parse(_namespace_get())[key];
    }

    /**
     * Remove given key storage
     * @param key
     * @returns {boolean}
     * @private
     */
    function _remove(key) {
        var structure = _namespace_get();
        if (structure) {
            delete structure[key];
            _namespace_update(structure);
            return true;
        }
        return false;
    }

    /**
     * Save given model
     * @param domain
     * @param uuid
     * @param model
     * @private
     */
    function _model_save(domain, uuid, model) {
        //Get given domain structure
        var domainStruct = _get(domain);
        //Create or retrieve
        if (!domainStruct) {
            domainStruct = {};
        }
        //Add
        domainStruct[uuid] = model;
        //Save
        return _set(domain, domainStruct);
    }

    /**
     * Get given model
     * @param domain
     * @param uuid
     * @returns {*}
     * @private
     */
    function _model_load(domain, uuid) {
        //Get given domain structure
        var domainStruct = _get(domain);
        //Create or retrieve
        if (domainStruct) {
            return domainStruct[uuid];
        } else return null;
    }


    var exports = {
        model_save: function (domain, uuid, model) {
            return _model_save(domain, uuid, model)
        },
        model_load: function (domain, uuid) {
            return _model_load(domain, uuid);
        },
        all: function () {
            return JSON.parse(_namespace_get());
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
