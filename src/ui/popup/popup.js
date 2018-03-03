//When popup is ready
document.addEventListener('DOMContentLoaded', function () {

    //Init message handler
    var MESSAGE_HANDLER = BROWSER_UTILS.MESSAGE.register('POPUP');

    //Actions map
    ACTIONS_MAPPER.map('saved_models', _saved_models);

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
        console.log('hello');
        browser.runtime.openOptionsPage();
    });

    //Get saved models
    MESSAGE_HANDLER.send('CONTENT_SCRIPT', ACTIONS_MAPPER.build('models_get'), true);

    function _saved_models(savedModels) {
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
                    count = document.createElement('div');
                domain.className = 'domain';
                name.className = 'name';
                count.className = 'count';
                domain.innerText = k;

                var cnt = 0;
                for (var c in savedModels[k])
                    if (savedModels[k].hasOwnProperty(c)) cnt++;
                count.innerText = String(cnt);

                domain.appendChild(name);
                domain.appendChild(count);
                savedModelsDisplay.appendChild(domain);
            }
        }
    }

    function openOptionsPage() {
        browser.runtime.openOptionsPage();
    }
});
