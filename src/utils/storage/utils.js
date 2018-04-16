var STORAGE_UTILS = (function () {

    var
        STORAGE_NAMESPACE = COMPUTING.md5('FF-STORAGE'),
        STORAGE_MODELS_DOMAIN = COMPUTING.md5('FF-MODELS'),
        STORAGE_CONFIG_DOMAIN = COMPUTING.md5('FF-CONFIG'),
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
     * Save given model
     * @param domain
     * @param title
     * @param uuid
     * @param model
     * @private
     */
    function _model_save(domain, title, uuid, model) {
        //Get models structure
        var models = _get(STORAGE_MODELS_DOMAIN) || {};
        //Init or retrieve
        models[domain] = models[domain] || {};
        //Add
        models[domain][uuid] = {
            title: title,
            model: model
        };
        //Save
        return _set(STORAGE_MODELS_DOMAIN, models);
    }

    /**
     * Get given model
     * @param domain
     * @param uuid
     * @returns {*}
     * @private
     */
    function _model_load(domain, uuid) {
        //Get models structure
        var models = _get(STORAGE_MODELS_DOMAIN) || {},
            //Get given domain structure
            domainStruct = models[domain] || {};
        //Return it
        return domainStruct[uuid];
    }

    /**
     * Return all saved models
     * @returns {*|{}}
     * @private
     */
    function _models() {
        return _get(STORAGE_MODELS_DOMAIN) || {};
    }

    /**
     * Get given config key
     * @param key
     * @returns {*}
     * @private
     */
    function _config_get(key) {
        //Get config structure
        var configStruct = _get(STORAGE_CONFIG_DOMAIN) || {};
        //Return it
        return configStruct[key]
    }

    /**
     * Set given config key<>value
     * @param key
     * @param value
     * @returns {boolean}
     * @private
     */
    function _config_set(key, value) {
        //Get config structure
        var configStruct = _get(STORAGE_CONFIG_DOMAIN) || {};
        //Add key value
        configStruct[key] = value;
        //Save
        return _set(STORAGE_CONFIG_DOMAIN, configStruct);
    }

    /**
     * Remove given config key
     * @param key
     * @returns {boolean}
     * @private
     */
    function _config_remove(key) {
        //Get config structure
        var configStruct = _get(STORAGE_CONFIG_DOMAIN) || {};
        //Erase key
        delete configStruct[key];
        //Save
        return _set(STORAGE_CONFIG_DOMAIN, configStruct);
    }

    var exports = {
        model_save: function (domain, modelTitle, uuid, model) {
            return _model_save(domain, modelTitle, uuid, model)
        },
        model_load: function (domain, uuid) {
            return _model_load(domain, uuid);
        },
        models: function () {
            return _models();
        },
        format: function () {
            return _namespace_update({});
        },
        config_set: function (key, value) {
            return _config_set(key, value);
        },
        config_get: function (key) {
            return _config_get(key);
        },
        config_remove: function (key) {
            return _config_remove(key);
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
