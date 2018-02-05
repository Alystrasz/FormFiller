var ACTIONS_MAPPER = (function () {

    //Mapped actions object
    var mappedActions = {};

    function _getActionFunction(actionName) {
        return mappedActions[actionName];
    }

    function _map(actionName, actionFunction) {
        if (!_getActionFunction(actionName)) {
            mappedActions[actionName] = actionFunction;
            return true;
        } else return false;
    }

    function _process(actionName){
        var acFunc = _getActionFunction(actionName);
        if(acFunc){
            return acFunc.call(null);
        }
        return false;
    }


    return {
        map: _map,
        process: _process
    }

}());