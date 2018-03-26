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

    //Get info message
    document.getElementById('open_info').addEventListener('click', function() {
        alert('Developed by Jules Spicht & Rémy Raes, both master\'s students at '
            + 'the University of Lille 1.\nUnder the supervision of Samuel Hym.');
    });


    //Get saved models
    MESSAGE_HANDLER.send('BACKGROUND', ACTIONS_MAPPER.build('get_models'));

    /**
     * Called to display saved models into popup
     * @param savedModels
     * @private
     */
    function _display_saved_models(savedModels) {
        //Get saved models container
        var savedModelsDisplay = document.getElementById('savedModels'),
            hasModels = false;
        //For each saved models
        for (var k in savedModels) {
            //Check property key
            if (savedModels.hasOwnProperty(k)) {
                //Hash models trigger
                if (!hasModels) {
                    hasModels = true;
                    savedModelsDisplay.innerHTML = '';
                }
                //Preparing dom elements
                var domain = document.createElement('div'),
                    name = document.createElement('div'),
                    count = document.createElement('div'),
                    models = document.createElement('div');
                //Set domain & name & count
                domain.className = 'domain';
                name.className = 'name';
                count.className = 'count';
                models.className = 'fmodels';
                name.innerText = k;
                //For each forms in domain
                var cnt = 0, forms = savedModels[k];
                for (var c in forms) {
                    //Property check
                    if (forms.hasOwnProperty(c)) {
                        //Forms count
                        cnt++;
                        //Display forms
                        var
                            fModel = document.createElement('div'),
                            fTitle = document.createElement('div'),
                            cForm = forms[c];
                        fModel.className = 'fmodel';
                        fTitle.className = 'title';
                        fTitle.innerText = cForm.title;
                        //Mutation closure
                        (function (handledForm) {
                            //On form title click
                            fTitle.addEventListener('click', function () {
                                MESSAGE_HANDLER.send('BACKGROUND', ACTIONS_MAPPER.build('form_open_scroll', [handledForm]));
                            });
                        }(cForm));
                        fModel.appendChild(fTitle);
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
