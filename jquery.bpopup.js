/*===================================================================================================================
 * @name: bPopup
 * @type: jQuery
 * @author: (c) Bjoern Klinggaard - @bklinggaard
 * @demo: http://dinbror.dk/bpopup
 * @version: 0.9.3
 * @requires jQuery 1.4.3
 * todo: refactor
 *==================================================================================================================*/
;(function($) {
    $.fn.bPopup = function(options, callback) {
        
    if ($.isFunction(options)) {
            callback 		= options;
            options 		= null;
        }

		// OPTIONS
        var o 				= $.extend({}, $.fn.bPopup.defaults, options);
        
		// HIDE SCROLLBAR?  
        if (!o.scrollBar)
            $('html').css('overflow', 'hidden');
        
		// VARIABLES	
        var $popup 			= this
        	, d 			= $(document)
        	, w 			= $(window)
			, s				= screen        	
        	, prefix		= '__b-popup'
			, isIOS6X		= (/OS 6(_\d)+/i).test(navigator.userAgent) // Used for a temporary fix for ios6 timer bug when using zoom/scroll 
        	, buffer		= 20
			, popups		= 0
			, closing
        	, id
        	, inside
        	, fixedVPos
        	, fixedHPos
        	, fixedPosStyle
        	, vPos
        	, hPos
			, height
			, width
			, debounce
			;

		////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // PUBLIC FUNCTION - call it: $(element).bPopup().close();
		////////////////////////////////////////////////////////////////////////////////////////////////////////////
        $popup.close = function() {
            o = this.data('bPopup');
			id = prefix + w.data('bPopup') + '__';
            close();
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
			popups = (w.data('bPopup') || 0) + 1, id = prefix + popups + '__',fixedVPos = o.position[1] !== 'auto', fixedHPos = o.position[0] !== 'auto', fixedPosStyle = o.positionStyle === 'fixed', height = $popup.outerHeight(true), width = $popup.outerWidth(true);
            o.loadUrl ? createContent() : open();
        }
		function createContent() {
            o.contentContainer = $(o.contentContainer || $popup);
            switch (o.content) {
                case ('iframe'):
					var iframe = $('<iframe class="b-iframe" scrolling="no" frameborder="0"></iframe>');
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
                    	.load(o.loadUrl, o.loadData, function(){
						    triggerCall(o.loadCallback);
							recenter($(this));
						}).hide().appendTo(o.contentContainer);
                    break;
            }
        }

		function open(){
			// MODAL OVERLAY
            if (o.modal) {
                $('<div class="b-modal '+id+'"></div>')
                .css({backgroundColor: o.modalColor, position: 'fixed', top: 0, right:0, bottom:0, left: 0, opacity: 0, zIndex: o.zIndex + popups})
                .appendTo(o.appendTo)
                .fadeTo(o.speed, o.opacity);
            }
			
			// POPUP			
			$popup.each(function() {
        		if(o.appending) {
            		$(this).appendTo(o.appendTo);
        		}
    		});
			calPosition();
            $popup
				.data('bPopup', o).data('id',id)
				.css({
					'left': o.transition === 'slideIn' ? (hPos + width) *-1 : getLeft(!(!o.follow[0] && fixedHPos || fixedPosStyle)),
					'position': o.positionStyle || 'absolute',
					'top': o.transition === 'slideDown' || o.transition === 'slideUp' ? ( o.transition === 'slideUp' ? (s.height + d.scrollTop()) : (vPos + width) *-1 ) : getTop(!(!o.follow[1] && fixedVPos || fixedPosStyle)),
					'z-index': o.zIndex + popups + 1
				});
			doTransition(true);	
			if(o.autoClose){setTimeout(function(){close();}, o.autoClose);}
		}
        function close() {
            if (o.modal) {
                $('.b-modal.'+$popup.data('id'))
	                .fadeTo(o.speed, 0, function() {
	                    $(this).remove();
	                });
            }
			// Clean up
			unbindEvents();	
			// Close trasition
            doTransition();
            
			return false; // Prevent default
        }
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
			height = $popup.outerHeight(true)
			, width = $popup.outerWidth(true);
				
			calPosition();
			o.contentContainer.css({height:'auto',width:'auto'});		
			
			css.left = getLeft(!(!o.follow[0] && fixedHPos || fixedPosStyle)),
			css.top = getTop(!(!o.follow[1] && fixedVPos || fixedPosStyle));
			
			$popup
				.animate(
					css
					, 250
					, function() { 
						content.show();
						inside = insideWindow();
					}
				);
		}
        function bindEvents() {
            w.data('bPopup', popups);
			$popup.on('click.'+id, '.bClose, .' + o.closeClass, close); // legacy, still supporting the close class bClose
            
            if (o.modalClose) {
                $('.b-modal.'+id).css('cursor', 'pointer').on('click', close);
            }
			
			// Temporary disabling scroll/resize events on devices with IOS6+
			// due to a bug where events are dropped after pinch to zoom
            if (!isIOS6X && (o.follow[0] || o.follow[1])) {
                w.on('scroll.'+id, function() {
                	if(inside){
                    	$popup
                        	.dequeue()
                            .animate({ 'left': o.follow[0] ? getLeft(!fixedPosStyle) : 'auto', 'top': o.follow[1] ? getTop(!fixedPosStyle) : 'auto' }, o.followSpeed, o.followEasing);
					 }  
            	}).on('resize.'+id, function() {
                   	inside = insideWindow();
                   	if(inside){
						clearTimeout(debounce);
						debounce = setTimeout(function(){
							calPosition();
							$popup
	                           	.dequeue()
	                           	.each(function() {
	                               	if(fixedPosStyle) {
	                                	$(this).css({ 'left': hPos, 'top': vPos });
	                               	}
	                               	else {
	                                   	$(this).animate({ 'left': o.follow[0] ? getLeft(true) : 'auto', 'top': o.follow[1] ? getTop(true) : 'auto' }, o.followSpeed, o.followEasing);
	                               	}
	                           	});
						}, 50);					
                   	}
                });
            }
            if (o.escClose) {
                d.on('keydown.'+id, function(e) {
                    if (e.which == 27) {  //escape
                        close();
                    }
                });
            }
        }
        function unbindEvents() {
            if (!o.scrollBar) {
                $('html').css('overflow', 'auto');
            }
            $('.b-modal.'+id).off('click');
            d.off('keydown.'+id);
            w.off('.'+id).data('bPopup', (w.data('bPopup')-1 > 0) ? w.data('bPopup')-1 : null);
            $popup.off('click.'+id, '.bClose, .' + o.closeClass, close).data('bPopup', null);

        }
		function doTransition(open) {
			switch ( open ? o.transition : (o.transitionClose ? o.transitionClose : o.transition) ) {
			   case "slideIn":
			   	  $popup
					.css({display: 'block',opacity: 1})
					.animate({
						left: open ? getLeft(!(!o.follow[0] && fixedHPos || fixedPosStyle)) : d.scrollLeft() - (width || $popup.outerWidth(true)) - 200
					},o.speed, o.easing, function(){onCompleteCallback(open);});
			      break;
			   case "slideDown":
				  $popup
					.css({display: 'block',opacity: 1})
					.animate({
						top: open ? getTop(!(!o.follow[1] && fixedVPos || fixedPosStyle)) : d.scrollTop() - (height || $popup.outerHeight(true)) - 200
					},o.speed, o.easing, function(){onCompleteCallback(open);});
			      break;
			   case "slideUp":
				  $popup
					.css({display: 'block',opacity: 1})
					.animate({
						top: open ? getTop(!(!o.follow[1] && fixedVPos || fixedPosStyle)) : s.height + d.scrollTop() + 200
					},o.speed, o.easing, function(){onCompleteCallback(open);});
			      break;			      
			   default:
			   	  //Typing 1 and 0 to ensure opacity 1 and not 0.9999998
				  $popup.stop().fadeTo(o.speed, open ? 1 : 0, function(){onCompleteCallback(open);});
			}
		}
		function onCompleteCallback(open){
			if(open){
				bindEvents();
	            triggerCall(callback);
			} else {
				$popup.hide();
				triggerCall(o.onClose);
				if (o.loadUrl) {
                    o.contentContainer.empty();
					$popup.css({height: 'auto', width: 'auto'});
                }		
			}
		}
		function getLeft(includeScroll){
			return includeScroll ? hPos + d.scrollLeft() : hPos;
		}
		function getTop(includeScroll){
			return includeScroll ? vPos + d.scrollTop() : vPos;
		}
		function triggerCall(func) {
			$.isFunction(func) && func.call($popup);
		}
       	function calPosition(){
			vPos 		= fixedVPos ? o.position[1] : getYCoord()
			, hPos 		= fixedHPos ? o.position[0] : getXCoord()
			, inside 	= insideWindow();
		}
		function getYCoord(){
            var y = (((windowHeight()- $popup.outerHeight(true)) / 2) - o.amsl);
			return (y < buffer ? buffer : y);
		}
		function getXCoord(){
 			return ((windowWidth() - $popup.outerWidth(true)) / 2);
		}
        function insideWindow(){	
            return windowHeight() > $popup.outerHeight(true)+buffer && windowWidth() > $popup.outerWidth(true)+buffer;
        }
		function windowHeight(){
			return window.innerHeight || w.height();
		}
		function windowWidth(){
			return window.innerWidth || w.width();
		}
    };

	////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// DEFAULT VALUES
	////////////////////////////////////////////////////////////////////////////////////////////////////////////
    $.fn.bPopup.defaults = {
          amsl: 			50
        , appending: 		true
        , appendTo: 		'body'
        , closeClass: 		'b-close'
        , content: 			'ajax' // ajax, iframe or image
        , contentContainer: false
		, easing: 			'swing'
        , escClose: 		true
        , follow: 			[true, true] // x, y
		, followEasing: 	'swing'
        , followSpeed: 		500
		, loadCallback: 	false
		, loadData: 		false
        , loadUrl: 			false
        , modal: 			true
        , modalClose: 		true
        , modalColor: 		'#000'
        , onClose: 			false
        , onOpen: 			false
        , opacity: 			0.7
        , position: 		['auto', 'auto'] // x, y,
        , positionStyle: 	'absolute'// absolute or fixed
        , scrollBar: 		true
		, speed: 			250 // open & close speed
		, transition:		'fadeIn' //transitions: fadeIn, slideDown, slideIn
        , zIndex: 			9997 // popup gets z-index 9999, modal overlay 9998
        , autoClose:        false // 3000 milliseconds to auto close overlay
        , transitionClose:  false //provide transition to be used on close
    };
})(jQuery);
