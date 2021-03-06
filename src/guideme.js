// import styles from './guideme.css'
// import themeStyles from './guideme-theme.css'
// import Popper from 'popper.js';

(function(global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
        (global.GuideMe = factory());
}(this, (function() {
    'use strict';

    var $ = window && window.jQuery;

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

    // ritorna null o un array di elementi
    function parseSelector(selector) {
        if (!selector) {
            return null;
        } else if (selector instanceof HTMLElement) {
            return [selector];
        } else if (selector instanceof NodeList) {
            return selector;
        } else if (typeof selector == 'string') {
            return document.querySelectorAll(selector);
        } else if ($ && selector.jquery) {
            return selector.get();
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

    function createPopper(elDialog, stepTarget, cb) {
        return new Popper(stepTarget, elDialog, {
            "placement": "bottom-start",
            "onCreate": function(dataObject) {
                // se è posizionato in centro nascondo la freccia
                elDialog.classList.toggle('guideme-center',
                    stepTarget.guidemeCenter === true);
                // scroll automatico perché il target sia sempre visibile
                //  non uso elDialog perché il suo posizionamento può essere ritardato da Popper
                //  e in ogni caso potrebbe non essere visibile il target
                if (stepTarget.scrollIntoView) {
                    // ritardo di un poco perché su chrome (e forse su altri) 
                    //  lo scroll al primo step non funziona
                    setTimeout(function() {
                        stepTarget.scrollIntoView(false);
                    }, 100);
                }
                cb && cb(elDialog, stepTarget, this);
            }
        });
    }

    function nvl(text, def) {
        return !text || text.length === 0 ? def : text;
    }

    function resolveFunctionOrValue(fnOrVal, _this) {
        if (typeof fnOrVal == 'function' || false) {
            return fnOrVal.apply(_this, Array.prototype.slice.call(arguments, 2));
        } else {
            return fnOrVal;
        }
    }

    // ritorna obj se del tipo previsto, oppure scatena un errore
    function ofTypeOrThrow(obj, type, error) {
        if (typeof obj == type || false) {
            return obj;
        } else {
            throw error || 'Invalid type: must be a ' + type;
        }
    }

    function stepComparer(stepA, stepB) {
        if (isNaN(stepB.order)) return -1;
        if (isNaN(stepA.order)) return 1;
        return (+stepA.order || 0) - (+stepB.order || 0);
    }

    function elementToStep(element) {
        return {
            "target": element,
            // se il valore dell'attributo data-guideme è vuoto uso title
            "content": nvl(element.getAttribute('data-guideme'),
                element.title),
            "order": +element.getAttribute('data-guideme-order')
        };
    }

    function stringToStep(value) {
        return {
            "content": nvl(value, '')
        };
    }

    function normalizeStep(step, index) {
        if (isNaN(step.order)) {
            step.order = index;
        }
        return step;
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

    function formatStepCounter(format, index, length) {
        if (format === true) {
            return (index + 1) + '/' + length;
        } else if (format) {
            return format.replace(/%1/, (index + 1)).replace(/%2/, length);
        } else {
            return '';
        }
    }

    var defaultOptions = {
        attachTo: null,
        classes: null,
        title: null,
        destroyOnDone: false,
        allowKeyboardNavigation: true,
        showOverlay: true,
        showStepCounter: false,
        overlayClickAction: 'done',
        buttons: [
            { "text": "done", "action": "done" },
            { "text": "prev", "action": "prev" },
            { "text": "next", "action": "next" }
        ]
    };

    var elDialogHtml = '<div x-arrow></div><div class="guideme-header"><span class="guideme-title"></span><span class="guideme-step-counter"></span></div><div class="guideme-body"></div><div class="guideme-footer"></div>';

    /**
     * Crea una guida.
     * GuideMe().from('body').start();
     *
     * @param      {Object}  options  opzioni
     * @return     {Object}  ritorna una istanza di guideme
     */
    function GuideMe(options) {
        var elBody = document.querySelector('body'),
            elOverloay, elDialog, elDialogTitle, elDialogStepCounter, elDialogBody, elDialogFooter,
            stepList = [],
            popper,
            curStepIndex,
            instance;

        var onStep, onDone;

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
        elDialogStepCounter = elDialog.querySelector('.guideme-step-counter');
        elDialogBody = elDialog.querySelector('.guideme-body');
        elDialogFooter = elDialog.querySelector('.guideme-footer');
        // se non ci sono pulsanti nascondo il footer
        if (options.buttons && options.buttons.length > 0) {
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
        } else {
            elDialog.className += ' guideme-no-footer';
        }
        options.attachTo.appendChild(elDialog);

        /// funzioni interne ///

        function onKeyDown(event) {
            event.preventDefault();
            // event.stopPropagation();
            switch (event.keyCode || event.which) {
                case 13: // enter
                case 39: // arraow right
                    performAction('NEXT');
                    break;
                case 8: // back
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
                    showStep((+curStepIndex || 0) + 1);
                    break;
                case 'PREV':
                    showStep((+curStepIndex || 0) - 1);
                    break;
                case 'DONE':
                    done();
                    break;
            }
        }

        function showStep(index) {
            if (index < 0) return;
            // pulisco il tag dello step precedente
            if (!isNaN(curStepIndex)) {
                cleanStepElement(+curStepIndex);
            }
            // se non ci sono più step da mostrare termino la guida
            if (index >= stepList.length) {
                done();
                return;
            }

            curStepIndex = index;

            var step = stepList[index];
            elDialogTitle.innerHTML = nvl(resolveFunctionOrValue(options.title, instance, index, step), '');
            if (options.showStepCounter) {
                elDialogStepCounter.innerHTML = formatStepCounter(resolveFunctionOrValue(options.showStepCounter, instance), index, stepList.length);
            }
            elDialogBody.innerHTML = nvl(resolveFunctionOrValue(step.content, instance, index, step), '');
            elDialog.classList.toggle('guideme-start', index === 0);
            elDialog.classList.toggle('guideme-end', index === stepList.length - 1);
            if (step.target) {
                step.target.classList.add('guideme-step-target');
                popper && popper.destroy();
                // posiziono il dialogo rispetto al tag di riferimento
                popper = createPopper(elDialog, step.target, onStep);
            } else {
                popper && popper.destroy();
                // posiziono al centro dello schermo
                popper = createPopper(elDialog, getPopperRererenceCenter(elDialog), onStep);
            }
        }

        function cleanStepElement(index) {
            if (stepList[index].target) {
                stepList[index].target.classList.remove('guideme-step-target');
            }
        }

        function setupEvents() {
            // gestisco gli eventi per la navigazione
            if (options.allowKeyboardNavigation) {
                window.addEventListener('keydown', onKeyDown);
            }
        }

        function cleanEvents() {
            if (options.allowKeyboardNavigation) {
                window.removeEventListener('keydown', onKeyDown);
            }
        }

        function createOnStep(cb) {
            return function(target, stepTarget, popper) {
                cb(stepList[curStepIndex], curStepIndex, target, stepTarget, popper);
            };
        }

        function createOnDone(cb) {
            return function() {
                // richiamo cb indicando se gli step sono finiti o se la sequenza è stata interrotta
                cb(curStepIndex === stepList.length - 1);
            }
        }

        function done() {
            cleanEvents();
            if (!isNaN(curStepIndex)) {
                cleanStepElement(+curStepIndex);
            }
            options.attachTo.classList.remove('guideme-show');
            popper && popper.destroy();
            onDone && onDone();
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
            stepList = elBody = elOverloay = elDialog =
                elDialogTitle = elDialogStepCounter =
                elDialogBody = elDialogFooter =
                null;
        }

        // creo l'istanza da ritornare con la funzione
        instance = {
            /**
             * Individua gli elementi con l'attributo [data-guideme] e li aggiunge come step.
             * Vengono considerati gli elementi stessi individuati da "from" che il loro contenuto.
             *
             * @param      {HTMLElement, NodeList, selector, jQuery}  selector  uno o più elementi a partire dai quali creare gli step
             * @return     {Object}  this
             */
            from: function(selector) {
                var els = parseSelector(selector),
                    elStepList;
                // console.log(selector, els); 
                if (els) {
                    for (var ii = 0; ii < els.length; ii++) {
                        // se l'elemento è [data-guideme] lo aggiungo
                        if (els[ii].hasAttribute('data-guideme')) {
                            stepList.push(normalizeStep(elementToStep(els[ii]), stepList.length));
                        }
                        // cerco al suo interno tutti gli elementi con [data-guideme]
                        elStepList = els[ii].querySelectorAll('[data-guideme]');
                        for (var jj = 0; jj < elStepList.length; jj++) {
                            stepList.push(normalizeStep(elementToStep(elStepList[jj]), stepList.length));
                        }
                    }
                }
                return this;
            },
            /**
             * Aggiunge uno step.
             * Lo step può essere uno Step, una funzione che ritorna uno Step, 
             * o una stringa che diverrà il contenuto di uno Step senza elememnto.
             *
             * @param      {string|Object|Function}  step    lo step
             * @return     {Object}  this
             */
            addStep: function(step) {
                if (typeof step == 'string') {
                    stepList.push(normalizeStep(stringToStep(step), stepList.length));
                } else {
                    stepList.push(normalizeStep(resolveFunctionOrValue(step, this), stepList.length));
                }
                return this;
            },
            start: function(initialStep) {
                stepList.sort(stepComparer);
                // console.log(stepList)
                setupEvents();
                showStep(+initialStep || 0)
                options.attachTo.classList.add('guideme', 'guideme-show');
                return this;
            },
            // exec: function(action) {
            //     performAction((action || '').toString().toUpperCase())
            //     return this;
            // },
            end: function() {
                done();
                return this;
            },
            destroy: function() {
                done();
                destroy();
                return this;
            },
            /**
             * Richiama la callback al cambio di step.
             * All'interno della callback this si riferisce a questa istanza.
             *
             * @param      {Function}  cb      callback(step, index, target, stepTarget, popper)
             * @return     {Object}    this
             */
            onStep: function(cb) {
                if (!cb) {
                    onStep = null;
                } else {
                    // creo una funzione che al suo interno richiama cb bindata a this
                    onStep = createOnStep(ofTypeOrThrow(cb, 'function', 'cb must be a function').bind(this));
                }
                return this;
            },
            /**
             * Richiama la callback al termine della sequenza, anche se interrotta.
             * All'interno della callback this si riferisce a questa istanza.
             *
             * @param      {Function}  cb      callback(finished: boolean)
             * @return     {Object}    this
             */
            onDone: function(cb) {
                if (!cb) {
                    onDone = null;
                } else {
                    // creo una funzione che al suo interno richiama cb bindata a this
                    onDone = createOnDone(ofTypeOrThrow(cb, 'function', 'cb must be a function').bind(this));
                }
                return this;
            },
            stepAt: function(index) {
                return stepList[+index];
            }
        };

        // proprietà in sola lettura
        Object.defineProperty(instance, 'stepCount', {
            "get": function() {
                return stepList.length;
            }
        });
        Object.defineProperty(instance, 'stepIndex', {
            "get": function() {
                return curStepIndex;
            }
        });

        return instance;
    }

    return GuideMe;
})));