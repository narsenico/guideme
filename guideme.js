import Popper from 'popper.js';

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
        var e = document.documentElement,
            g = document.getElementsByTagName('body')[0],
            w = window.innerWidth || e.clientWidth || g.clientWidth,
            h = window.innerHeight || e.clientHeight || g.clientHeight;
        return { "width": w, "height": h };
    }

    function createPopper(element, stepTarget) {
        return new Popper(stepTarget, element, {
            "placement": "bottom-start",
            "onCreate": function(dataObject) {
                // se è posizionato in centro nascondo la freccia
                element.classList.toggle('center',
                    stepTarget.guidemeCenter === true);
                // scroll automatico perché il target sia sempre visibile
                //  non uso element perché il suo posizionamento può essere ritardato da Popper
                //  e in ogni caso potrebbe non essere visibile il target
                stepTarget.scrollIntoView && stepTarget.scrollIntoView(false);
            }
        });
    }

    function nvl(text, def) {
        return !text || text.length === 0 ? def : text;
    }

    function resolveFunctionOrValue(valOrFn) {
        if (typeof valOrFn == 'function' || false) {
            return valOrFn.apply(null, Array.prototype.slice.call(arguments, 1));
        } else {
            return valOrFn;
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
        };
    }

    function stringToStep(value) {
        return {
            "content": nvl(value, '')
        };
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
                    "bottom": size.height / 2 + modHeight,
                    "height": 1,
                    "left": size.width / 2 + modWidth,
                    "right": size.width / 2 + modWidth,
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
        destroyOnDone: false,
        allowKeyboardNavigation: true,
        showOverlay: true,
        overlayClickAction: 'done',
        buttons: [
            { "text": "done", "action": "done" },
            { "text": "prev", "action": "prev" },
            { "text": "next", "action": "next" }
        ]
    };

    var elDialogHtml = '<div x-arrow></div><div class="guideme-title"></div><div class="guideme-body"></div><div class="guideme-footer"></div>';

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

        options.attachTo.classList.add('guideme');

        // creo il div per mascherare la pagina
        if (options.showOverlay) {
            elOverloay = document.createElement('div');
            elOverloay.innerHTML = '&nbsp;';
            elOverloay.className = 'guideme-overlay ' + nvl(options.classes, '');
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
            elDialog.className += ' ' + nvl(options.classes, '');
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
            switch (event.keyCode || event.which) {
                // case 13: // enter
                //     event.preventDefault();
                case 39: // arraow right
                    performAction('NEXT');
                    break;
                    // case 8: // back
                    //     event.preventDefault();
                case 37: // arrow left
                    performAction('PREV');
                    break;
                case 27: // esc
                    performAction('DONE');
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
            elDialog.classList.toggle('start', index === 0);
            elDialog.classList.toggle('end', index === stepList.length - 1);
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

        function setupEvents() {
            // gestisco gli eventi per la navigazione
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
            if (options.destroyOnDone) {
                destroy();
            }
        }

        function destroy() {
            if (elOverloay) {
                options.attachTo.removeChild(elOverloay);
            }
            options.attachTo.removeChild(elDialog);
            options.attachTo.classList.remove('guideme', 'guideme-show');
            stepList = elBody = elTarget = elOverloay = elStepList =
                elDialog = elDialogTitle = elDialogBody = elDialogFooter =
                null;
        }

        return {
            /**
             * Aggiunge uno step di seguito a quelli creati in automatico 
             * (tag con attributo [data-guideme]).
             * Lo step può essere uno Step, una funziona che ritorna uno Step, 
             * o una stringa che diverrà il contenuto di uno Step senza elememnto.
             *
             * @param      {string|Object|Function}  step    lo step
             * @return     {Object}  this
             */
            addStep: function(step) {
                if (typeof step == 'string') {
                    stepList.push(stringToStep(step));
                } else {
                    stepList.push(resolveFunctionOrValue(step));
                }
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
                destroy();
                return this;
            }
        };
    }

    window.GuideMe = GuideMe;
})(window, window.jQuery);