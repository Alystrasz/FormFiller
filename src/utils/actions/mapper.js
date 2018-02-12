var ACTIONS_MAPPER = (function () {

    //Mapped actions object
    var mappedActions = {};

    function _getActionFunction(messageStruct) {
        return mappedActions[messageStruct.action];
    }

    function _map(actionName, actionFunction) {
        if (!_getActionFunction(actionName)) {
            mappedActions[actionName] = actionFunction;
            return true;
        } else return false;
    }

    function _process(messageStruct){
        var acFunc = _getActionFunction(messageStruct);
        if(acFunc){
            return acFunc.apply(null, arguments);
        }
        return false;
    }


    return {
        map: _map,
        process: _process
    }

}());