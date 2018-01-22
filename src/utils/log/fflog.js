/**
 * Log wrapper
 */
var FFLOG = (function () {


    var ffDomain = console,
        fflogFuncs = {};

    for (var k in ffDomain) {
        if (ffDomain.hasOwnProperty(k)) {
            if (typeof ffDomain[k] === 'function') {
                (function () {
                    var overlapped = ffDomain[k];
                    fflogFuncs[k] = function () {
                        var argsArray = Array.prototype.slice.call(arguments);
                        argsArray.splice(0, 0, '[FormFiller]');
                        return overlapped.apply(this, argsArray);
                    };
                }())
            }
        }

    }

    return fflogFuncs;

}());