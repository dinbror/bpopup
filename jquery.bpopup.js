/**
 * @name bPopup
 * @type jQuery
 * @author Bjoern Klinggaard - @bklinggaard https://github.com/dinbror/bpopup/
 * @demo http://dinbror.dk/bpopup
 * @version 0.11.1
 * @requires jQuery 1.4.3
 */
(function($) {
    
	'use strict';	
    /**
     * bPopup is a learning and exploring jQuery project. It’s a lightweight cross browser jQuery popup plugin. 
     * It’s not creating your popup but doing all the logic as opening, closing, centering on resize & scroll, 
     * creating a modal overlay etc. It can open any container you create with all kinds of content. 
     * bPopup has been tested in IE67-9, FF2-7, Opera 9-10, Safari 4-5 and Chrome 4-15.
     * 
     * @param options {mixed} (object || function) options
     * @param callback {function} Event fires after the popup has loaded.
     * Usage: $(‘element_to_pop_up’).bPopup({ //options }, function(){ //callback });
     * @return {object} 
     */
    $.fn.bPopup = function(options, callback) {
        
    	if ($.isFunction(options)) {
            callback 		= options;
            options 		= null;
        }

		// OPTIONS
        var o 				= $.extend({}, $.fn.bPopup.defaults, options);
		
		// HIDE SCROLLBAR?  
        if (!o.scrollBar) {
            $('html').css('overflow', 'hidden');
        }
        
		// VARIABLES	
        var $popup 			= this,
            d 				= $(document),
            w 				= window,
            $w				= $(w),
            wH				= windowHeight(),
            wW				= windowWidth(),
            prefix			= '__b-popup',
            // Used for a temporary fix for ios6 timer bug when using zoom/scroll 
            isIOS6X			= (/OS 6(_\d)+/i).test(navigator.userAgent),
            buffer			= 200,
            popups			= 0,
            id,
            inside,
            fixedVPos,
            fixedHPos,
            fixedPosStyle,
            vPos,
            hPos,
            height,
            width,
            debounce,
            autoCloseTO;

		////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // PUBLIC FUNCTION - call it: $(element).bPopup().close();
		////////////////////////////////////////////////////////////////////////////////////////////////////////////
        $popup.close = function() {
            close();
        };
		
        $popup.reposition = function(animateSpeed) {
            reposition(animateSpeed);
        };

        return $popup.each(function() {
            if ($(this).data('bPopup')) return; //POPUP already exists?
            init();
        });

        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // HELPER FUNCTIONS - PRIVATE
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////
        function init() {
            triggerCall(o.onOpen);
			popups          = ($w.data('bPopup') || 0) + 1, 
            id              = prefix + popups + '__',fixedVPos = o.position[1] !== 'auto', 
            fixedHPos       = o.position[0] !== 'auto', 
            fixedPosStyle   = o.positionStyle === 'fixed', 
            height          = $popup.outerHeight(true), 
            width           = $popup.outerWidth(true);
            
            o.loadUrl ? createContent() : open();
        };
		
		function createContent() {
            o.contentContainer = $(o.contentContainer || $popup);
            switch (o.content) {
                
                case ('iframe'):
					var iframe = $('<iframe class="b-iframe" ' + o.iframeAttr +'></iframe>');
					iframe.appendTo(o.contentContainer);
					height = $popup.outerHeight(true);
					width = $popup.outerWidth(true);
					open();
					iframe.attr('src', o.loadUrl); // setting iframe src after open due IE9 bug
					triggerCall(o.loadCallback);
                    break;
                    
				case ('image'):
					open();
					$('<img />')
						.load(function() {
						    triggerCall(o.loadCallback);
							recenter($(this));
					    }).attr('src', o.loadUrl).hide().appendTo(o.contentContainer);
					break;
                    
                default:
					open();
					$('<div class="b-ajax-wrapper"></div>')
                    	.load(o.loadUrl, o.loadData, function(response, status, xhr) {
						    triggerCall(o.loadCallback, status);
							recenter($(this));
						}).hide().appendTo(o.contentContainer);
                    break;
                    
            }
            $popup.addClass('loader');
        };

		function open(){
			// MODAL OVERLAY
            if (o.modal) {
                $('<div class="b-modal '+id+'"></div>')
                    .css({
                        backgroundColor: o.modalColor, 
                        position: 'fixed', 
                        top: 0, 
                        right: 0, 
                        bottom:0, 
                        left: 0, 
                        opacity: 0, 
                        zIndex: o.zIndex + popups
                    })
                    .appendTo(o.appendTo)
                    .fadeTo(o.speed, o.opacity);
            }
			
			// POPUP
			calcPosition();
            $popup
				.data('bPopup', o).data('id',id)
				.css({ 
                        left: o.transition == 'slideIn' || o.transition == 'slideBack' 
                            ? (o.transition == 'slideBack' ? d.scrollLeft() + wW : (hPos + width) *-1) 
                            : getLeftPos(!(!o.follow[0] && fixedHPos || fixedPosStyle)),
                        position: o.positionStyle || 'absolute',
                        top: o.transition == 'slideDown' || o.transition == 'slideUp' 
                            ? (o.transition == 'slideUp' ? d.scrollTop() + wH : vPos + height * -1) 
                            : getTopPos(!(!o.follow[1] && fixedVPos || fixedPosStyle)),
                        zIndex: o.zIndex + popups + 1 
				}).each(function() {
            		if(o.appending) {
                		$(this).appendTo(o.appendTo);
            		}
        		});
			doTransition(true);	
		};
		
        function close() {
            if (o.modal) {
                $('.b-modal.'+$popup.data('id'))
	                .fadeTo(o.speed, 0, function() {
	                    $(this).remove();
	                });
            }
			// Clean up
			unbindEvents();	
			clearTimeout(autoCloseTO);
			// Close trasition
            doTransition();
            
			return false; // Prevent default
        };
		
		function reposition(animateSpeed){
            wH = windowHeight();
  		    wW = windowWidth();
			inside = insideWindow();
           	if(inside.x || inside.y){
				clearTimeout(debounce);
				debounce = setTimeout(function(){
					calcPosition();
					animateSpeed = animateSpeed || o.followSpeed;
					var css = {};
					if(inside.x) {
						css.left = o.follow[0] ? getLeftPos(true) : 'auto';
                    }
					if(inside.y) {
						css.top = o.follow[1] ? getTopPos(true) : 'auto';
                    }
					$popup
                       	.dequeue()
                       	.each(function() {
                           	if(fixedPosStyle) {
                            	$(this).css({ 'left': hPos, 'top': vPos });
                           	} 
                            else {
                               	$(this).animate(css, animateSpeed, o.followEasing);
                           	}
                       	});
				}, 50);					
           	}
		};
		
		//Eksperimental
		function recenter(content){
			var _width = content.width(), _height = content.height(), css = {};
			o.contentContainer.css({height:_height,width:_width});

			if (_height >= $popup.height()){
				css.height = $popup.height();
			}
			if(_width >= $popup.width()){
				css.width = $popup.width();
			}
			height = $popup.outerHeight(true),
            width = $popup.outerWidth(true);
				
			calcPosition();
			o.contentContainer.css({height:'auto',width:'auto'});		
			
			css.left = getLeftPos(!(!o.follow[0] && fixedHPos || fixedPosStyle)),
			css.top = getTopPos(!(!o.follow[1] && fixedVPos || fixedPosStyle));

			$popup
				.animate(css, 250, function() { 
                    content.show();
                    inside = insideWindow();
                });
		};
		
        function bindEvents() {
            $w.data('bPopup', popups);
            // legacy, still supporting the close class bClose
			$popup.delegate('.bClose, .' + o.closeClass, 'click.'+id, close);
            
            if (o.modalClose) {
                $('.b-modal.'+id).css('cursor', 'pointer').bind('click', close);
            }
			
			// Temporary disabling scroll/resize events on devices with IOS6+
			// due to a bug where events are dropped after pinch to zoom
            if (!isIOS6X && (o.follow[0] || o.follow[1])) {
               $w.bind('scroll.'+id, function() {
                	if(inside.x || inside.y) {
						var css = {};
						if(inside.x) {
							css.left =  o.follow[0] ? getLeftPos(!fixedPosStyle) : 'auto';
                        }
						if(inside.y) {
							css.top = o.follow[1] ? getTopPos(!fixedPosStyle) : 'auto';
                        }
                    	$popup
                        	.dequeue()
                            .animate(css, o.followSpeed, o.followEasing);
					 }  
            	}).bind('resize.'+id, function() {
		            reposition();
                });
            }
            if (o.escClose) {
                d.bind('keydown.'+id, function(e) {
                    if (e.which == 27) {  //escape
                        close();
                    }
                });
            }
        };
		
        function unbindEvents() {
            if (!o.scrollBar) {
                $('html').css('overflow', 'auto');
            }
            $('.b-modal.'+id).unbind('click');
            d.unbind('keydown.'+id);
            $w.unbind('.'+id).data('bPopup', ($w.data('bPopup')-1 > 0) ? $w.data('bPopup')-1 : null);
            $popup.undelegate('.bClose, .' + o.closeClass, 'click.'+id, close).data('bPopup', null);
        };
		
		function doTransition(open) {
			switch (open ? o.transition : o.transitionClose || o.transition) {
                
			   case "slideIn":
				   	animate({
				   		left: open 
                            ? getLeftPos(!(!o.follow[0] && fixedHPos || fixedPosStyle)) 
                            : d.scrollLeft() - (width || $popup.outerWidth(true)) - buffer
				   	});
			      	break;
                    
			   case "slideBack":
				   	animate({
				   		left: open 
                            ? getLeftPos(!(!o.follow[0] && fixedHPos || fixedPosStyle)) 
                            : d.scrollLeft() + wW + buffer
				   	});
			      	break;
                    
			   case "slideDown":
				   	animate({
				   		top: open 
                            ? getTopPos(!(!o.follow[1] && fixedVPos || fixedPosStyle)) 
                            : d.scrollTop() - (height || $popup.outerHeight(true)) - buffer
				   	});
			      	break;
                    
		   		case "slideUp":
					animate({
						top: open 
                            ? getTopPos(!(!o.follow[1] && fixedVPos || fixedPosStyle)) 
                            : d.scrollTop() + wH + buffer
					});
		      	  	break;
                    
			   default:
			   	  	//Hardtyping 1 and 0 to ensure opacity 1 and not 0.9999998
				  	$popup.stop().fadeTo(o.speed, open ? 1 : 0, function(){ onCompleteCallback(open); });
                    
			}
			
			function animate(css){
			  	$popup
					.css({display: 'block',opacity: 1})
					.animate(css, o.speed, o.easing, function(){ onCompleteCallback(open); });
			};
		};
		
		function onCompleteCallback(open){
			if(open){
				bindEvents();
                $popup.removeClass('loader');
	            triggerCall(callback);
				if(o.autoClose){
					autoCloseTO = setTimeout(close, o.autoClose);
				}
			} else {
				$popup.hide();
				triggerCall(o.onClose);
				if (o.loadUrl) {
                    o.contentContainer.empty();
					$popup.css({
                        height: 'auto', 
                        width: 'auto'
                    });
                }		
			}
		};
		
		function getLeftPos(includeScroll){
			return includeScroll ? hPos + d.scrollLeft() : hPos;
		};
		
		function getTopPos(includeScroll){
			return includeScroll ? vPos + d.scrollTop() : vPos;
		};
		
		function triggerCall(func, arg) {
			$.isFunction(func) && func.call($popup, arg);
		};
		
       	function calcPosition(){
			vPos 		= fixedVPos 
                            ? (typeof o.position[1] == 'function' ? triggerCall(o.position[1]) : o.position[1]) 
                            : Math.max(0, ((wH- $popup.outerHeight(true)) / 2) - o.amsl),
			hPos 		= fixedHPos 
                            ? (typeof o.position[0] == 'function' ? triggerCall(o.position[0]) : o.position[0]) 
                            : (wW - $popup.outerWidth(true)) / 2,
			inside      = insideWindow();
		};
		
        function insideWindow(){
            return {  
				x: wW > $popup.outerWidth(true),
				y: wH > $popup.outerHeight(true)	
			};
        };
		
		function windowHeight(){
			return $w.height();
		};
		
		function windowWidth(){
			return $w.width();
		};
        
    };

	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// DEFAULT VALUES
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
    $.fn.bPopup.defaults = {
        /**
         * @var {int} Above Mean Sea Level. Vertical distance from the middle of the window, + = above, – = under.
         */
        amsl:               50,
        /**
         * @var {boolean} Should the popup append to an element or just open where it is?
         */
        appending:          true,
        /**
         * @var {string} Element to append popup (and modal overlay) to. For asp.net sites append to ‘form’.
         */
        appendTo:           'body',
        /**
         * @var {mixed} {boolean || int} Auto close the popup after x amount of ms, autoClose: 1000 = auto closes 
         * after 1 sec
         */
        autoClose:          false,
        /**
         * @var {string} Class to bind the close event to
         */
        closeClass:         'b-close',
        /**
         * @var {string} Content of bpopup. Types: [‘ajax’, ‘iframe’, ‘image’]. If loadUrl isn’t defined it’ll not 
         * use content type.
         */
        content: 			'ajax',
        /**
         * @var {mixed} (boolean || string) Element which content should be added to. If undefined/null it will add 
         * it to $(this). Usage contentContainer:’.element’ or contentContainer:’#element’.
         */
        contentContainer:   false,
        /**
         * @var {string} The easing of the popup when it opens. ‘swing’ and ‘linear’ are built-in in jQuery. 
         * If you want more you can use the jQuery Easing plugin.
         */
		easing: 			'swing',
        /**
         * @var {boolean} Should popup close when press on escape?
         */
        escClose:           true,
        /**
         * @var {array} Should the popup follow the screen vertical and/or horizontal on scroll/resize? 
         * [horizontal, vertical, fixed on screen (see positionStyle instead)]
         */
        follow: 			[true, true],
        /**
         * @var {string} The follow easing of the popup. ‘swing’ and ‘linear’ are built-in in jQuery. 
         * If you want more you can use the jQuery Easing plugin.
         */
		followEasing:       'swing',
        /**
         * @var {int} Animation speed for the popup on scroll/resize.
         */
        followSpeed: 		500,
        /**
         * @var {string} Gives you the possibility to customize the built-in iframe support. Default removes 
         * the scrollbar and border. 
         */
		iframeAttr: 		'scrolling="no" frameborder="0"',
        /**
         * @var {function} allback for loadUrl, triggers when the loadUrl is loaded: 
         * $(‘element_to_pop_up’).bPopup({ loadUrl: ‘test.html’, loadCallback: function(){ //doMagic }});
         */
		loadCallback:       false,
        /**
         * @var {mixed} (object || string) LoadData is representing the data attribute in the jQuery.load() method. 
         * It gives you the opportunity to submit GET or POST values through the ajax request. 
         */
		loadData:           false,
        /**
         * @var {string} External page or selection to load in popup. See loadCallback for callback.
         */
        loadUrl: 			false,
        /**
         * @var {boolean} Should there be a modal overlay behind the popup?
         */
        modal:              true,
        /**
         * @var {boolean} Should the popup close on click on overlay?
         */
        modalClose: 		true,
        /**
         * @var {string} What color should the overlay be? 
         */
        modalColor: 		'#000',
        /**
         * @var {function} Event fires after the popup closes.
         * Usage: $(‘element_to_pop_up’).bPopup({ onClose: function(){ //doMagic }});
         */
        onClose: 			false,
        /**
         * @var {function} Event fires before the popup opens.
         * Usage: $(‘element_to_pop_up’).bPopup({ onOpen: function(){ //doMagic }})
         */
        onOpen: 			false,
        /**
         * @var {float} Transparency, from 0.1 to 1.0 (filled).
         */
        opacity: 			0.7,
        /**
         * @var {array} Defines the position where the popup should pop up. ‘auto’ = center, [horizontal, vertical].
         * Where x - ('auto' || int || function) and y - ('auto' || int || function).
         */
        position:           ['auto', 'auto'],
        /**
         * @var {string} The popup’s position. ‘absolute’ or ‘fixed’.
         */
        positionStyle:      'absolute',
        /**
         * @var {boolean} Should scrollbar be visible?
         */
        scrollBar:          true,
        /**
         * @var {int} Animation speed on open/close.
         */
	    speed:              250,
        /**
         * @var {string} The transition of the popup when it opens. Types: [‘fadeIn’, ‘slideDown’, ‘slideUp’, ‘slideIn’, 
         * ‘slideBack’].
         */
		transition:         'fadeIn',
        /**
         * @var {mixed} (boolean || string) The transition of the popup when it closes. Default (false) will use same 
         * as defined in transition above. Types: [‘fadeIn’, ‘slideDown’, ‘slideUp’, ‘slideIn’, ‘slideBack’].
         */
		transitionClose:	false,
        /**
         * @var {int} Popup z-index, modal overlay = popup z-index – 1.
         */
        zIndex: 			9997
    };
    
})(jQuery);
