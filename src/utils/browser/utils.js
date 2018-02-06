/**
 * Browser utils wrapper
 * @type {{TABS, MESSAGE, BADGE}}
 */
var BROWSER_UTILS = (function (namespace) {

    /**
     * Utils vars
     */
    var BU = {
        //Contexts vars
        CONTEXTS: {
            activeTab: null,
            activeWindow: null
        },
        //Message handlers vars
        MESSAGES: {
            registeredMessageHandlers: []
        }
    };


    /**
     * Active tab getter
     * @private
     */
    function _tab_active() {
        //Get current tab
        return namespace.tabs.query({
            active: true,
            currentWindow: true
        });
    }

    /**
     * Active window getter
     * @returns {*|{minArgs, maxArgs}}
     * @private
     */
    function _window_active() {
        //Get current window
        return namespace.windows.getCurrent();
    }

    /**
     * Listen for a message
     * @param from
     * @param clbk
     * @param receiver
     * @private
     */
    function _message_listen(from, clbk, receiver) {
        namespace.runtime.onMessage.addListener(function (request, sender) {
            if (request.from === from && request.receiver === receiver) {
                clbk(request.content, sender);
            }
            return true;
        });
    }

    /**
     * Send a message
     * @param origin
     * @param destination
     * @param content
     * @param tabContext
     * @private
     */
    function _message_send(origin, destination, content, tabContext) {
        //Build up message content
        var messageContent = {
            from: origin,
            receiver: destination,
            content: content
        };

        //Send message
        if (!tabContext) namespace.runtime.sendMessage(messageContent);
        else {
            //Get active tab
            _tab_active().then(function (tabs) {
                //Given destination is a tab context (current tab)
                if (tabs[0]) namespace.tabs.sendMessage(tabs[0].id, messageContent);
            });
        }
    }


    /**
     * Register a message handler (to send & receive)
     * @param origin
     * @returns {{send, listen}}
     * @private
     */
    function _message_register(origin) {

        //Build handler
        var mHandler = {
            send: function (to, content, tabContext) {
                _message_send(origin, to, content, tabContext);
                return this;
            },
            from: function (from, onMessage) {
                _message_listen(from, onMessage, origin);
                return this;
            }
        };

        //Register it
        BU.MESSAGES.registeredMessageHandlers.push({
            origin: origin,
            handler: mHandler
        });

        //Return handler
        return mHandler;

    }

    /**
     * Set badge text
     * @param text
     * @private
     */
    function _badge_text(text) {
        namespace.browserAction.setBadgeText({text: text});
    }

    /**
     * Exports
     */
    return {
        TABS: {
            active: _tab_active
        },
        MESSAGE: {
            register: _message_register
        },
        BADGE: {
            text: _badge_text
        }
    }


}(browser));