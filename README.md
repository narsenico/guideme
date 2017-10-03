# guideme

[![GitHub version](https://badge.fury.io/gh/narsenico%2Fguideme.svg)](https://badge.fury.io/gh/narsenico%2Fguideme) [![npm version](https://badge.fury.io/js/guideme.svg)](https://badge.fury.io/js/guideme) [![ISC License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE.md) [![live demo](https://img.shields.io/badge/demo-codepen-yellow.svg)](https://codepen.io/narsenico/pen/EvbXKB)

## Usage
1. Include `guideme-bundle.min.js`
    ```html
    <script type="text/javascript" src="guideme-bundle.min.js"></script>
    ```
    or `guideme-alone.min.js` for standalone version without [popper.js](https://github.com/FezVrasta/popper.js)
    ```html
    <script type="text/javascript" src="guideme-alone.min.js"></script>
    ```
2. Include `guideme.css`
    ```html
    <link rel="stylesheet" type="text/css" href="guideme.css">
    ```
3. Define steps directly in your html code
     ```html
     <button 
        data-guideme="Click this button to send data" 
        data-guideme-step="1">
        send
    </button>
     ```
4. Call this JavaScript function
    ```js
    GuideMe().from('body').start();
    ```
## Dependencies
[popper.js](https://github.com/FezVrasta/popper.js)

## Reference

#### GuideMe (*Function*)
##### Usage
```js
// GuideMe(options)
GuideMe({ title: 'Take a tour', destroyOnDone: true })
    .from('body')
    .addStep('Finish!')
    .start();
```
##### Return
GuideMeController

#### Options (*Object*)
##### Properties
`attachTo`: (*String|Object*) Where to attach the dialog element. Can be HTMLElement, css selector, jQuery object or null (body). Default **null**.

`classes`: (*String*) List of space separated classes. Additional css classes for dialog and overlay element. Default: **null**.

`title`: (*String*) Text to be displayed on header. Default: **null**.

`destroyOnDone`: (*Boolean*) If true, automatically calls the *destroy()* function at the end of the guide. Default **false**.

`allowKeyboardNavigation`: (*Boolean*) Allow steps navigation through keboard. Default **true**.
- left arrow|back: go to previous step
- right arrow|enter: go to next step
- esc: terminate guide

`showOverlay`: (*Boolean*) Show overlay layer. Default **true**.

`showStepCounter`: (*Boolean*) Show step counter on header. Default **false**.

`overlayClickAction`: (*String*) [Action](#actions) performed when clicking on overlay layer. Default '**done**'.

`buttons`: (*Array*) An array of Object representing buttons showed on guide dialog. Every button object must have two properties: text and [action](#actions).
Default:
```js
[{ "text": "done", "action": "done" },
 { "text": "prev", "action": "prev" },
 { "text": "next", "action": "next" }]
```

#### Actions
- prev: go to previous step  
- next: go to next step
- done: exit guide

#### GuideMeController (*Object*)
##### Properties
`stepCount`: (*Number*) Number of steps. Read-only.  
`stepIndex`: (*Number*) Current step index. Read-only.

##### Methods
`from(selector)`: Search for elements with [data-guideme] attribute, based on passed argument and make a list of [Step](#Step) with them. Each Step will have *content* property filled with the value of [data-guideme] attribute (if empty will be used *title* attribute), and *order* with [data-guideme-order]. Return: *GuideMeController*.
Selector can be:
- HTMLElement
- Array of HTMLElement
- css selector
- jQuery object

`addStep(step)`: Add a step. Return: *GuideMeController*.
Step can be:
- a [Step](#Step) object
- a function that return a [Step](#Step) object
- a string representing the content of a [Step](#Step) without target

`start(initialStep)`: Start the guide from *initialStep* or first step if not specified. Return: *GuideMeController*.

`end()`: End the guide. Return: *GuideMeController*.

`destroy()`: Clean GuideMe internal references and remove dialog and overlay elements from DOM. Return: *GuideMeController*.

`onStep(callback)`: Call the *callback* function at every step. Return: *GuideMeController*.

`onDone(callback)`: Call the *callback* function at the end of the guide. Return: *GuideMeController*.

`stapAt(index)`: Return the Step object at the specified *index*. Return: *[Step](#Step)*.

#### Step (*Object*)
##### Properties
target: (*HTMLElement*)

content: (*String|Function*)

order: (*Number*)

## Theming
See [guideme-theme.css](src/guideme-theme.css) for an example.