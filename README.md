## bPopup - If you can't get it up - use bPopup

### DEMO: ###
http://dinbror.dk/bpopup

### API: ###
http://dinbror.dk/blog/bpopup

### DESCRIPTION: ###
bPopup is a lightweight jQuery modal popup plugin (only 1.34KB gzipped). It doesn't create or style your popup but provides you with all the logic like centering, modal overlay, events and more. It gives you a lot of opportunities to customize so it will fit your needs.

## CHANGELOG
### v 0.11.0 (01-24-2015) ###
* Bugfix: Using fallback width as default to fix the width issue when scrollbar visible. Fixed [#7](https://github.com/dinbror/bpopup/issues/7) and fixed [#21](https://github.com/dinbror/bpopup/issues/21).
* Bugfix: "insideWindow" function updated so it now checks if height OR width is inside window instead of only width AND height. Fixed [#17](https://github.com/dinbror/bpopup/issues/17).

### v 0.10.0 (07-22-2014) ###
* Bugfix: `autoClose` will not trigger if you close the popup before it times out.
* Added: `reposition(animateSpeed)`, a public function that recalculates the center position of the popup. You can pass an optional animate speed attribute. If not defined it will use the `followSpeed` value ([#8](https://github.com/dinbror/bpopup/pull/8)). 
Usage: 
```javascript 
var bPopup = $(‘element_to_pop_up’).bPopup();
bPopup.reposition(100); 
```
* Added: Error handling when loading content with ajax. The first argument in the `loadCallback` is the status of the ajax request, success or error ([#32](https://github.com/dinbror/bpopup/pull/32)).
* Added: bower.json ([#25](https://github.com/dinbror/bpopup/issues/25)).

### v 0.9.4 (08-19-2013) ###
* Added: New transitions, `slideUp` and `slideBack`.
* Added: `transitionClose`, gives you the possibility to use a different transition on close.
* Added: `autoClose`, thanks to [Leonidaz](https://github.com/Leonidaz) for the suggestion.
* Added: `iframeAttr`, so you now can control what attributes the iframe should have (and enable the scrollbar as many of you wants).
* Removed: The minimum 20px gap at the top. It's 0 now.

### v 0.9.3 (03-24-2013) ###
* Transition fix: Unbinding events earlier on close to prevent scroll/resize events triggered when closing the popup and using the "slideIn" or "slideDown" transition.
* Transition fix: The public close function didn't close the popup when using the "slideIn" or "slideDown" transition.
* Transition fix: Exit transition for "slideIn" and "slideDown" will now always slide graceful no matter how much you have scrolled.
* Transition fix: Fixed odd behavior when using "slideIn" or "slideDown" with ajax calls.

### v 0.9.2 (03-23-2013) ###
* Percentage fix: Resize center fix when using percentage for width/height.
* Percentage fix: Recenter fix when using percentage for width/height in ajax(loadUrl) calls.
* Improvement: Adding 'debounce' to resize event.

### v 0.9.1 (03-10-2013) ###
* Legacy fallback: In version 0.9.0 I changed the default close class from bClose to b-close. To avoid issues when you update to latest version I'm also binding a close event on the old default close class, bModal.
* Bugfix: When moving an iframe through the DOM, IE9 will excecute the code in the iframe as many times as moves you make. Each time (but the last one) will return udefined on Object, String, Array etc.
* Bugfix: When appending is false no overlay was created.
