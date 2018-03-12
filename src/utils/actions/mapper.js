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

    function _process(messageStruct, from) {
        var acFunc = _getActionFunction(messageStruct);
        if (acFunc) {
            return acFunc.apply({
                sendResponse: function (object) {
                    if (MESSAGE_HANDLER) {
                        MESSAGE_HANDLER.send(from, object, (from === 'CONTENT_SCRIPT'));
                    }
                }
            }, messageStruct.arguments);
        }
        return false;
    }

    function _build(actionName, arguments) {
        return {action: actionName, arguments: arguments}
    }


    return {
        map: _map,
        build: _build,
        process: _process
    }

}());