/**
 * Browser utils wrapper
 * @type {{TABS, MESSAGE}}
 */
var BROWSER_UTILS = (function (namespace) {

    /**
     * Get active tab
     * @param clbk
     * @private
     */
    function _tabs_active(clbk) {
        namespace.tabs.query({
            active: true,
            currentWindow: true
        }, function (tabs) {
            clbk(tabs[0]);
        });
    }

    /**
     * Listen for a message
     * @param from
     * @param clbk
     * @private
     */
    function _message_listen(from, clbk) {
        namespace.runtime.onMessage.addListener(function (request, sender) {
            if (request.from === from) {
                clbk(request.content, sender);
            }
        });
    }

    /**
     * Send a message
     * @param origin
     * @param content
     * @param tabId
     * @private
     */
    function _message_send(origin, content, tabId) {
        var messageContent = {
            from: origin,
            content: content
        };
        if(tabId === undefined) namespace.runtime.sendMessage(messageContent);
        else namespace.tabs.sendMessage(tabId, messageContent);
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
            active: _tabs_active
        },
        MESSAGE: {
            listen: _message_listen,
            send: _message_send
        },
        BADGE: {
            text: _badge_text
        }
    }


}(window.msBrowser ||
    window.browser ||
    window.chrome));