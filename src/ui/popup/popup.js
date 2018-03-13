//When popup is ready
document.addEventListener('DOMContentLoaded', function () {

    //Init message handler
    var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('POPUP');

    //Actions map
    ACTIONS_MAPPER.map('saved_models', _display_saved_models);

    //From : CONTENT_SCRIPT
    MESSAGE_HANDLER.from('CONTENT_SCRIPT', ACTIONS_MAPPER.process);

    //From : BACKGROUND
    MESSAGE_HANDLER.from('BACKGROUND', ACTIONS_MAPPER.process);

    //Send message to content script => exit selection mode
    MESSAGE_HANDLER.send('CONTENT_SCRIPT', ACTIONS_MAPPER.build('selection_mode_disable'), true);

    //Interactive selection
    document.getElementById('select_start').addEventListener('click', function () {
        //Send message to content script => entering selection mode
        MESSAGE_HANDLER.send('CONTENT_SCRIPT', ACTIONS_MAPPER.build('selection_mode_enable'), true);
    });

    //Import file
    document.getElementById('file_import').addEventListener('click', function () {
        MESSAGE_HANDLER.send('CONTENT_SCRIPT', ACTIONS_MAPPER.build('import_template'), true);
    });

    //Open settings view
    document.getElementById('open_options').addEventListener('click', function () {
        browser.runtime.openOptionsPage();
    });

    //Get saved models
    MESSAGE_HANDLER.send('BACKGROUND', ACTIONS_MAPPER.build('get_models'));

    /**
     * Called to display saved models into popup
     * @param savedModels
     * @private
     */
    function _display_saved_models(savedModels) {
        var savedModelsDisplay = document.getElementById('savedModels'),
            hasModels = false;
        for (var k in savedModels) {
            if (savedModels.hasOwnProperty(k)) {
                if (!hasModels) {
                    hasModels = true;
                    savedModelsDisplay.innerHTML = '';
                }
                var domain = document.createElement('div'),
                    name = document.createElement('div'),
                    count = document.createElement('div'),
                    models = document.createElement('div');
                domain.className = 'domain';
                name.className = 'name';
                count.className = 'count';
                models.className = 'fmodels';
                domain.innerText = k;

                var cnt = 0, forms = savedModels[k];
                for (var c in forms) {
                    if (forms.hasOwnProperty(c)) {
                        cnt++;
                        var
                            fModel = document.createElement('div'),
                            fTitle = document.createElement('div'),
                            cForm = forms[c],
                            cFormTitle = cForm.title,
                            cFormFields = cForm.model.fields,
                            fFields = document.createElement('ul');
                        fModel.className = 'fmodel';
                        fFields.className = 'fields';
                        fTitle.className = 'title';
                        fTitle.innerText = cFormTitle + ' ('+cForm.model.uuid+')';
                        for (var fName in cFormFields) {
                            var f = document.createElement('li');
                            f.innerText = fName;
                            fFields.appendChild(f);
                        }
                        fModel.appendChild(fTitle);
                        fModel.appendChild(fFields);

                        models.appendChild(fModel);
                    }
                }
                count.innerText = String(cnt);

                domain.appendChild(name);
                domain.appendChild(count);
                domain.appendChild(models);
                savedModelsDisplay.appendChild(domain);
            }
        }
    }


});
