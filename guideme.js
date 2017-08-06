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

    function setElementPosition(element, stepTarget) {
        var stepRect = stepTarget.getBoundingClientRect();
        var isTop = stepRect.top <= stepRect.bottom;
        var isLeft = stepRect.left <= stepRect.right;
        var margin = 10;

        //element.attributes['title'].value = stepRect.top

        if (isTop) {
        	element.classList.add('top');
            element.style.top = (stepRect.bottom + margin) + 'px';
            element.style.bottom = '';
        } else {
        	element.classList.add('bottom');
            element.style.bottom = (stepRect.top + margin) + 'px';
            element.style.top = '';
        }
        if (isLeft) {
        	element.classList.add('left');
            element.style.left = (stepRect.left + margin) + 'px';
            element.style.right = '';
        } else {
        	element.classList.add('right');
            element.style.right = (stepRect.right - margin) + 'px';
            element.style.left = '';
        }
    }

    function nvl(text, def) {
    	return !text || text.length === 0 ? def : text;
    }

    var defaultOptions = {
        attachTo: null,
        classes: null,
        showOverlay: true,
        buttons: [
        	{ "text": "prev", "action": "prev" },
        	{ "text": "next", "action": "next" }
        ]
    };

    var elDialogHtml = '<div class="guideme-title"></div><div class="guideme-body"></div><div class="guideme-footer"></div>';

    /**
     * Crea una guida creando uno step per tutti gli elementi con attributo data-guideme.
     *
     * @param      {String|jQuery|HTMLElement}  target   Opzionale, l'elemento dal quale partire a cercare i tag 
     * 													 con attributo data-guideme
     * @param      {Object}  options  Opzionale
     * @return     {Object}  ritorna una istanza di guideme
     */
    function guideme(target, options) {
        var elBody = document.querySelector('body'),
            elTarget = parseElemnt(target, elBody),
            elOverloay, elStepList,
            elDialog, elDialogTitle, elDialogBody, elDialogFooter;

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
        	elButton.onclick = function() {
				performAction((btn.action || '').toString().toUpperCase());
        	};
        	return elButton;
        }).forEach(function(element) {
        	elDialogFooter.appendChild(element);
        });
        options.attachTo.appendChild(elDialog);

        // cerco tutti gli elementi con l'attributo data-guideme
        // TODO: ordinarli per [data-guideme-step]
        elStepList = elTarget.querySelectorAll('[data-guideme]');

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
        	// TODO: invece di accedere direttamente a elStepList
        	// 	usare un wrapper in modo che si possano aggiungere step liberamente
        	// 	senza passare da un HTMLElement

        	if (index < 0) return;
            // pulisco il tag dello step precedente
            if (!isNaN(showStep.previous)) {
                cleanStepElement(+showStep.previous);
            }
            // se non ci sono più step da mostrare termino la guida
            if (index >= elStepList.length) {
                done();
                return;
            }

            var elStep = elStepList[index];
            // se il valore dell'attributo data-guideme è vuoto uso title
            var content = nvl(elStep.attributes['data-guideme'].value, 
            	elStep.title);
            elStep.classList.add('guideme-step-target');
            // posiziono il dialogo rispetto al tag di riferimento
            setElementPosition(elDialog, elStep);
            elDialogBody.innerHTML = content;

            showStep.previous = index;
        }

        function cleanStepElement(index) {
            elStepList[index].classList.remove('guideme-step-target');
        }

        // gestisco gli eventi per la navigazione
        function setupEvents() {
            window.addEventListener('keyup', onKeyUp);
        }

        function cleanEvents() {
            window.removeEventListener('keyup', onKeyUp);
        }

        function done() {
            cleanEvents();
            options.attachTo.classList.remove('guideme');
        }

        return {
            start: function(initialStep) {
                setupEvents();
                showStep(+initialStep || 0)
                options.attachTo.classList.add('guideme');
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
                elStepList = elBody = elTarget = elOverloay = elStepList =
                    elDialog = elDialogTitle = elDialogBody = elDialogFooter =
                    null;
                return this;
            }
        };
    }

    window.guideme = guideme;
})(window, jQuery);