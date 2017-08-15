# guideme

### Usage
1. include guideme.js and guideme.css
    ```html
    <link rel="stylesheet" type="text/css" href="guideme.css">
    <script type="text/javascript" src="guideme.js"></script>
    ```
2. define steps directly in your html code
     ```html
     <button 
        data-guideme="Click this button to send data" 
        data-guideme-step="1">
        send
    </button>
     ```
3. 
    ```js
    GuideMe(options)
        .from('body')
        .start();
    ```

### Advanced usage

### Reference

Options: Object
- attachTo: null,
- classes: null,
- title: null,
- destroyOnDone: false,
- allowKeyboardNavigation: true,
- showOverlay: true,
- overlayClickAction: 'done',
- buttons: [
    { "text": "done", "action": "done" },
    { "text": "prev", "action": "prev" },
    { "text": "next", "action": "next" }]

Step: Object
- el: HTMLElement
- content: String|Function
- order: Number