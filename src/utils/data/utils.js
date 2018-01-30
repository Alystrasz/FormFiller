var STORAGE_UTILS = (function () {

    /**
      * Checks if the localStorage API is supported by the browser
      * @returns {boolean} whether the API is supported or not
      * @private
      **/
    function _localStorage_is_supported() {
        return (typeof(Storage) !== "undefined");
    }

    /**
      * Stores json object into user browser
      * @param {String} key name of the data
      * @param {JSON} json object to store
      * @returns {boolean} whether the storage succeeded or not
      * @private
      **/
    function _store_json(key, json) {
        if(!_localStorage_is_supported)
            return;
        localStorage.setItem(key, JSON.stringify(json));
    }

    /**
      * Gets json object from user browser
      * @param {String} key name of the data
      * @returns {JSON} object corresponding to key
      * @private
      **/
    function _get_json(key) {
        if(!_localStorage_is_supported)
            return;
        return localStorage.getItem(key);
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

    }

    return {
        store_json: function(key, json){
            _store_json(key, json);
        },

        get_json: function(key){
            return _get_json(key);
        }
    }


})(browser);
