;
(function(window, $) {
    "use strict";

    // @see https://developer.mozilla.org/it/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    if (!Object.assign) {
        Object.defineProperty(Object, 'assign', {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function(target, firstSource) {
                'use strict';
                if (target === undefined || target === null) {
                    throw new TypeError('Cannot convert first argument to object');
                }

                var to = Object(target);
                for (var i = 1; i < arguments.length; i++) {
                    var nextSource = arguments[i];
                    if (nextSource === undefined || nextSource === null) {
                        continue;
                    }
                    nextSource = Object(nextSource);

                    var keysArray = Object.keys(Object(nextSource));
                    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                        var nextKey = keysArray[nextIndex];
                        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                        if (desc !== undefined && desc.enumerable) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
                return to;
            }
        });
    }

    function parseElemnt(element, defaultElement, fallToDefault) {
        if (!element) {
            return defaultElement;
        } else if (element instanceof HTMLElement) {
            return element;
        } else if (element instanceof NodeList) {
            return element[0];
        } else if (typeof element == 'string') {
            return document.querySelector(element);
        } else if ($ && element.jquery) {
            return element.get(0);
        } else if (fallToDefault) {
            return defaultElement;
        } else {
            return null;
        }
    }

    function getBodySize() {
        var w = document.body.clientWidth,
            h = document.body.clientHeight;
        return { "width": w, "height": h };
    }

    function getWindowSize() {
        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            w = w.innerWidth || e.clientWidth || g.clientWidth,
            h = w.innerHeight || e.clientHeight || g.clientHeight;
        return { "width": w, "height": h };
    }

    function createPopper(element, stepTarget) {
        return new Popper(stepTarget, element, {
            "placement": "bottom-start",
            "onCreate": function(dataObject) {
                // se è posizionato in centro nascondo la freccia
                element.classList.toggle('center',
                    stepTarget.guidemeCenter === true);
                // TODO: scroll automatico perché il dialog sia sempre visibile
            }
        });
    }

    function nvl(text, def) {
        return !text || text.length === 0 ? def : text;
    }

    function resolveFunctionOrValue(value, index, step, instance) {
    	if (typeof value == 'function' || false) {
    		return value(index, step, instance);
    	} else {
    		return value;
    	}
    }

    function stepComparer(stepA, stepB) {
        if (!stepB.order) return -1;
        if (!stepA.order) return 1;
        return (+stepA.order || 0) - (+stepB.order || 0);
    }

    function elementToStep(element, index) {
        return {
            "el": element,
            // se il valore dell'attributo data-guideme è vuoto uso title
            "content": nvl(element.getAttribute('data-guideme'),
                element.title),
            // se non è specificato l'ordine uso l'indice
            "order": element.getAttribute('data-guideme-step') || index + 1
        }
    }

    // elemento di riferimento per posizionare Popper al centro dello schermo
    function getPopperRererenceCenter(element) {
        var modWidth = -element.clientWidth / 2,
            modHeight = -element.clientHeight / 2;
        return {
            "guidemeCenter": true,
            "clientWidth": 1,
            "clientHeight": 1,
            "getBoundingClientRect": function() {
                var size = getWindowSize();
                return {
                    "bottom": size.height / 2 + 1 + modHeight,
                    "height": 1,
                    "left": size.width / 2 + modWidth,
                    "right": size.width / 2 + 1 + modWidth,
                    "top": size.height / 2 + modHeight,
                    "width": 1
                };
            }
        }
    }

    var defaultOptions = {
        attachTo: null,
        classes: null,
        title: null,
        allowKeyboardNavigation: true,
        showOverlay: true,
        overlayClickAction: 'done',
        buttons: [
            { "text": "prev", "action": "prev" },
            { "text": "next", "action": "next" },
            { "text": "done", "action": "done" }
        ]
    };

    var elDialogHtml = '<div class="guideme-title"></div><div class="guideme-body"></div><div class="guideme-footer"></div>';

    /**
     * Crea una guida creando uno step per tutti gli elementi con attributo data-guideme.
     *
     * @param      {String|jQuery|HTMLElement}  target   Opzionale, l'elemento dal quale partire a cercare i tag 
     *                                                   con attributo data-guideme
     * @param      {Object}  options  Opzionale
     * @return     {Object}  ritorna una istanza di guideme
     */
    function GuideMe(target, options) {
        var elBody = document.querySelector('body'),
            elTarget = parseElemnt(target, elBody),
            elOverloay, elDialog, elDialogTitle, elDialogBody, elDialogFooter,
            stepList = [],
            popper;

        if (!elTarget) {
            // se è un oggetto presumo che si tratti delle opzioni
            if (typeof target == 'object') {
                elTarget = elBody;
                options = target;
            } else {
                throw 'GuideMe: target not found';
            }
        }

        options = Object.assign({}, defaultOptions, options);
        options.attachTo = parseElemnt(options.attachTo, elBody, true);

        // creo il div per mascherare la pagina
        if (options.showOverlay) {
            elOverloay = document.createElement('div');
            elOverloay.innerHTML = '&nbsp;';
            elOverloay.className = 'guideme-overlay';
            elOverloay.onclick = function() {
                performAction((options.overlayClickAction || '').toString().toUpperCase());
            }
            options.attachTo.appendChild(elOverloay);
        }

        // creo il dialog
        elDialog = document.createElement('div');
        elDialog.innerHTML = elDialogHtml;
        elDialog.className = 'guideme-dialog';
        if (options.classes) {
            elDialog.className += ' ' + options.classes;
        }
        elDialogTitle = elDialog.querySelector('.guideme-title');
        elDialogBody = elDialog.querySelector('.guideme-body');
        elDialogFooter = elDialog.querySelector('.guideme-footer');
        options.buttons.map(function(btn) {
            var elButton = document.createElement('button');
            elButton.className = 'guideme-button';
            elButton.innerHTML = btn.text;
            elButton.setAttribute('data-action', btn.action);
            elButton.onclick = function() {
                performAction((btn.action || '').toString().toUpperCase());
            };
            return elButton;
        }).forEach(function(element) {
            elDialogFooter.appendChild(element);
        });
        options.attachTo.appendChild(elDialog);

        // cerco tutti gli elementi con l'attributo data-guideme
        var elStepList = elTarget.querySelectorAll('[data-guideme]');
        for (var ii = 0; ii < elStepList.length; ii++) {
            stepList.push(elementToStep(elStepList[ii], ii));
        }

        function onKeyUp(event) {
            var code = event.keyCode || event.which;
            // console.log(code)
            switch (code) {
                case 39: // arraow right
                    performAction('NEXT')
                    break;
                case 37: // arrow left
                    performAction('PREV')
                    break;
                case 27: // esc
                    performAction('DONE')
                    break;
            }
        }

        function performAction(action) {
            switch (action) {
                case 'NEXT':
                    showStep((+showStep.previous || 0) + 1);
                    break;
                case 'PREV':
                    showStep((+showStep.previous || 0) - 1);
                    break;
                case 'DONE':
                    done();
                    break;
            }
        }

        function showStep(index) {
            if (index < 0) return;
            // pulisco il tag dello step precedente
            if (!isNaN(showStep.previous)) {
                cleanStepElement(+showStep.previous);
            }
            // se non ci sono più step da mostrare termino la guida
            if (index >= stepList.length) {
                done();
                return;
            }

            var step = stepList[index];
            elDialogTitle.innerHTML = nvl(resolveFunctionOrValue(options.title, index, step, this), '');
            elDialogBody.innerHTML = nvl(resolveFunctionOrValue(step.content, index, step, this), '');
            elDialog.classList.toggle('done', index === stepList.length - 1)
            if (step.el) {
                step.el.classList.add('guideme-step-target');
                popper && popper.destroy();
                // posiziono il dialogo rispetto al tag di riferimento
                popper = createPopper(elDialog, step.el);
            } else {
                popper && popper.destroy();
                // posiziono al centro dello schermo
                popper = createPopper(elDialog, getPopperRererenceCenter(elDialog));
            }
            showStep.previous = index;
        }

        function cleanStepElement(index) {
            if (stepList[index].el) {
                stepList[index].el.classList.remove('guideme-step-target');
            }
        }

        // gestisco gli eventi per la navigazione
        function setupEvents() {
            if (options.allowKeyboardNavigation) {
                window.addEventListener('keyup', onKeyUp);
            }
        }

        function cleanEvents() {
            if (options.allowKeyboardNavigation) {
                window.removeEventListener('keyup', onKeyUp);
            }
        }

        function done() {
            cleanEvents();
            if (!isNaN(showStep.previous)) {
                cleanStepElement(+showStep.previous);
            }
            options.attachTo.classList.remove('guideme-show');
            popper && popper.destroy();
        }

        return {
            addStep: function(step) {
                // TODO: accettare stringhe e oggetti "step"
                stepList.push(step);
                return this;
            },
            start: function(initialStep) {
                stepList.sort(stepComparer);
                setupEvents();
                showStep(+initialStep || 0)
                options.attachTo.classList.add('guideme', 'guideme-show');
                return this;
            },
            exec: function(action) {
                performAction((action || '').toString().toUpperCase())
                return this;
            },
            end: function() {
                done();
                return this;
            },
            destroy: function() {
                done();
                if (elOverloay) {
                    options.attachTo.removeChild(elOverloay);
                }
                options.attachTo.removeChild(elDialog);
                stepList = elBody = elTarget = elOverloay = elStepList =
                    elDialog = elDialogTitle = elDialogBody = elDialogFooter =
                    null;
                return this;
            }
        };
    }

    window.GuideMe = GuideMe;
})(window, window.jQuery);