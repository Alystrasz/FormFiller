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
     * @param clbk
     * @private
     */
    function _tab_active(clbk) {
        //Get active window
        _window_active(function (activeWindow) {
            //Get selected tab
            namespace.tabs.getSelected(activeWindow, function (tab) {
                clbk(tab.id);
            });
        })
    }

    /**
     * Active window getter
     * @param clbk
     * @private
     */
    function _window_active(clbk) {
        //Get current active contexts [WINDOW]
        namespace.windows.getCurrent(function (w) {
            clbk(w.id);
        });
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
            _tab_active(function (activeTab) {
                //Given destination is a tab context (current tab)
                namespace.tabs.sendMessage(activeTab, messageContent);
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


}(window.msBrowser ||
    window.browser ||
    window.chrome));