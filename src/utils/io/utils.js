var IO = (function () {

    var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('IO_UTILS');

    var IO_VARS = {
        dialogInstances: 0
    };


    /**
     * Trigger a 'download' with given parameters
     * From Chrome 65.0.3325.181, download is blocked by popup add blockers,
     * so use _trigger_download_via_browser_API instead.
     * @param filename
     * @param data
     * @param optType
     * @private
     * @deprecated
     */
    function _trigger_download(filename, data, optType) {
        // Setting up the link & type
        var link = document.createElement('a'),
            type = optType || IO.FTYPES.JSON;
        link.setAttribute('target', '_blank');
        if (Blob !== undefined) {
            var blob = new Blob([JSON.stringify(data, null, 2)], {type: type});
            link.setAttribute('href', URL.createObjectURL(blob));
        } else {
            link.setAttribute('href', 'storage:' + type + ',' + encodeURIComponent(data));
        }
        var ext = '';
        if (type === IO.FTYPES.JSON) {
            ext = '.json';
        } else if (type === IO.FTYPES.YAML) {
            ext = '.yaml';
        }
        link.setAttribute('download', filename + ext);
        console.log(link);
        // Adding the link
        document.body.appendChild(link);
        link.click();
        // Removing the link
        document.body.removeChild(link);
    }

    /**
     * Launches download of a data model.
     * @param {String} filename
     * @param {Object} data
     * @param {String} optType
     * @private
     **/
    function _trigger_download_via_browser_API(filename, data, optType) {
        console.log(filename);
        // Setting up the link & type
        var type = optType || IO.FTYPES.JSON;
        if (Blob !== undefined) {
            var ext = '';
            if (type === IO.FTYPES.JSON) {
                ext = '.json';
            } else if (type === IO.FTYPES.YAML) {
                ext = '.yaml';
            }
            MESSAGE_HANDLER.send('BACKGROUND', ACTIONS_MAPPER.build('download_form', [data, type, filename + ext]));

        } else {
            console.err('Blob not defined');
            return;
        }
    }


    /**
     * Instance file dialog
     * @returns {{open: open, destroy: destroy}}
     * @private
     */
    function _fdiag_instance() {
        //Add file input (hidden) dialog in page
        var file = document.createElement('input'),
            fileId = 'file-import-dialog-' + (IO_VARS.dialogInstances++),
            onFileLoaded = function () {
            };
        file.type = 'file';
        file.addEventListener('change', function (e) {
            //Get first selected file
            var current_data = e.target.files[0];
            if (current_data) {
                //Init reader
                var reader = new FileReader();
                //Access data with (this.result) in callback
                reader.onload = function () {
                    var fName = current_data.name;
                    onFileLoaded(fName, fName.split('.').pop(), this.result);
                };
                reader.readAsText(current_data);
            }
            file.value = '';
        });
        file.style.display = 'none';
        file.accept = '.json,.yaml';
        file.id = fileId;
        document.body.appendChild(file);
        //Associated functions
        return {
            open: function (onFileLoadedOverride) {
                var diag = document.getElementById(fileId);
                if (diag) {
                    onFileLoaded = onFileLoadedOverride;
                    diag.click();
                }
            },
            destroy: function () {
                document.removeChild(file);
                IO_VARS.dialogInstances = Math.max(IO_VARS.dialogInstances--, 0);
            }
        }
    }

    function _url(file) {
        return browser.extension.getURL(file);
    }

    return {
        download: _trigger_download_via_browser_API,
        fileDialog: _fdiag_instance,
        url: _url,
        FTYPES: {
            JSON: 'application/json',
            YAML: 'application/x-yaml'
        }
    }


}());
