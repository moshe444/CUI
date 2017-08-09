//seed code for create a plugin
//replace all of the "example" with the plugin name. (the plugin name should be same as the js file name);

// (function($) {
//     var exampleConfig = {
//         name: 'example',
//         defaultOpt: {},
//         init: function(context) {
//             var opt = context.opt;
//             var $this = context.$element;
//             var $target = context.$target = $(opt.target);
//
//         },
//         exports: {
//             show: function() {
//
//             },
//             hide: function() {
//
//             }
//         },
//         setOptionsBefore: null,
//         setOptionsAfter: null,
//         initBefore: null,
//         initAfter: function(context) {
//             var $this = context.$element;
//             var $target = context.$target;
//             var opt = context.opt;
//             var exports = context.exports;
//
//         },
//         destroyBefore: function(context) {
//             var $this = context.$element;
//         }
//     };
//     $.CUI.plugin(exampleConfig);
//     $(document).on('dom.load.example', function() {
//         $('[data-example]').each(function(index, item) {
//             var $this = $(item);
//             var data = $this.data();
//             $this.example(data);
//             $this.removeAttr('data-example');
//             $this.attr('data-example-load', '');
//             $this.attr('role', 'example');
//         });
//     });
// })(jQuery);
//Extend touch event
(function ($) {
    var _getDist = function (eventInfo) {
        var x = (eventInfo.touches[0].pageX - eventInfo.touches[1].pageX);
        var y = (eventInfo.touches[0].pageY - eventInfo.touches[1].pageY);
        return Math.sqrt(x * x + y * y);
    };
    var _getInfo = function (eventInfo) {
        var tmpEventInfo = Array.prototype.slice.call(eventInfo.touches);
        return {
            touches: tmpEventInfo.map(function (e) {
                return {
                    pageX: e.pageX,
                    pageY: e.pageY
                };
            })
        };
    };
    var eventSetting = {
        setup: function () {
            var $this = $(this);
            $this.off('gesturestart').on('gesturestart', function (e) {
                e.preventDefault();
            });
            $this.off('touchstart.cui.gesture').on('touchstart.cui.gesture', function () {
                var $ele = $(this);
                $ele.data('_touchStart', null);
                $ele.data('_touchEnd', null);
                return true;
            });
            $this.off('touchmove.cui.gesture').on('touchmove.cui.gesture', $.throttle(function (e) {
                var $ele = $(this);
                var event = _getInfo(e.originalEvent);
                if (!$ele.data('_touchStart')) {
                    $ele.data('_touchStart', event);
                } else {
                    if ($ele.data('_touchStart').touches.length == 1 && event.touches.length == 2) {
                        $ele.data('_touchStart', event);
                    }
                }
                if ($ele.data('_touchStart').touches.length == 2 && event.touches.length == 1) {
                    return true;
                } else {
                    $ele.data('_touchEnd', event);
                }
                $ele.trigger('moving', [$ele.data('_touchStart'), event]);
                return true;
            }, 100));

            $this.off('touchend.cui.gesture').on('touchend.cui.gesture', function () {
                var $ele = $(this);
                var start = $ele.data('_touchStart');
                var end = $ele.data('_touchEnd');

                if (start && end) {
                    if (start.touches.length == 2) {
                        var startDistance = _getDist(start);
                        var endDistance = _getDist(end);
                        if (startDistance > endDistance) {
                            $ele.trigger('pinchin', [start, end]);
                        } else if (startDistance < endDistance) {
                            $ele.trigger('pinchout', [start, end]);
                        }
                    } else if (start.touches.length == 1) {
                        var xDistance = start.touches[0].pageX - end.touches[0].pageX;
                        var yDistance = start.touches[0].pageY - end.touches[0].pageY;
                        if (Math.abs(xDistance) > Math.abs(yDistance) * 2) {
                            if (xDistance !== 0) {
                                if (xDistance > 0) {
                                    $ele.trigger('swipeleft', [start, end]);
                                } else {
                                    $ele.trigger('swiperight', [start, end]);
                                }
                            }
                        } else if (Math.abs(xDistance) * 2 < Math.abs(yDistance)) {
                            if (yDistance !== 0) {
                                if (yDistance > 0) {
                                    $ele.trigger('swipedown', [start, end]);
                                } else {
                                    $ele.trigger('swipeup', [start, end]);
                                }
                            }
                        }
                    }
                }
                return true;
            });
        },
        teardown: function () {
            var $this = $(this);
            $this.off('touchstart.cui.gesture');
            $this.off('touchmove.cui.gesture');
            $this.off('touchend.cui.gesture');

        }
    };
    $.event.special.swipeleft =
        $.event.special.swiperight =
            $.event.special.swipeup =
                $.event.special.swipedown =
                    $.event.special.moving =
                        $.event.special.pinchin =
                            $.event.special.pinchout = eventSetting;
})(jQuery);

//Extend transistion event
(function ($) {
    var eventSetting = {
        setup: function () {
            var $this = $(this);
            $this.off('webkitTransitionEnd.cui otransitionend.cui oTransitionEnd.cui msTransitionEnd.cui transitionend.cui')
            .on('webkitTransitionEnd.cui otransitionend.cui oTransitionEnd.cui msTransitionEnd.cui transitionend.cui', function () {
                $this.trigger('transitionend', []);
            });
        },
        teardown: function () {
            var $this = $(this);
            $this.off('webkitTransitionEnd.cui otransitionend.cui oTransitionEnd.cui msTransitionEnd.cui transitionend.cui');
        }
    }
    $.event.special.transitionend = eventSetting;
}(jQuery));

//draggable
(function ($) {
    var eventSetting = {
        setting: function () {
            var $this = $(this);
            var onDragStart = function () {
                if ($.isMobile()) {
                    $this.on('touchend.cui.draggable', onDragEnd);
                    $this.one('touchmove.cui.draggable', onDragMove);
                } else {
                    $this.on('mouseup.cui.draggable', onDragEnd);
                    $this.one('mousemove.cui.draggable', onDragMove);
                }
                $this.trigger('drag');
            };
            var onDragMove = function () {
                $this.one('touchmove.cui.draggable', function () {
                    $this.trigger('dragging');
                });
            }
            var onDragEnd = function () {
                $this.trigger('dragged');
            };
            if ($.isMobile()) {
                $this.on('touchstart.cui.draggable', onDragStart);
                $this.on('touchcancel.cui.draggable', onDragEnd);
            } else {
                $this.on('mousedown.cui.draggable', onDragStart);
                $this.on('dragstart.cui.draggable selectstart.cui.draggable', function () {
                    return false
                });
            }
        },
        teardown: function () {
            var $this = $(this);
            if ($.isMobile()) {
                $this.off('touchstart.cui.draggable');
                $this.off('touchcancel.cui.draggable');
            } else {
                this.$this.off('mousedown.cui.draggable');
                this.$this.off('dragstart.cui.draggable selectstart.cui.draggable', function () {
                    return false
                });
            }
            $this.off('touchstart.cui.draggable mousedown.cui.draggable');
            $this.off('touchcancel.cui.draggable mousedown.cui.draggable');

            $this.off('touchmove.cui.draggable mousemove.cui.draggable');
            $this.off('touchend.cui.draggable mouseup.cui.draggable');
        }
    };
    $.event.special.swipeleft =
        $.event.special.swiperight = eventSetting;
}(jQuery));
(function($) {
    var tmpdiv = null;
    $.extend({
        htmlencode: function(s) {
            var div = document.createElement('div');
            div.appendChild(document.createTextNode(s));
            return div.innerHTML;
        },
        htmldecode: function(s) {
            var div = document.createElement('div');
            div.innerHTML = s;
            return div.innerText || div.textContent;
        },
        getTextWidth: function(text, fontsize) {
            var $body = $('body');
            fontsize = fontsize || $body.css('fontSize').replace(/[a-z]/g, '') * 1;
            if (!tmpdiv) {
                tmpdiv = $('<div></div>').css({
                    position: 'absolute',
                    visibility: 'hidden',
                    height: 'auto',
                    width: 'auto',
                    whiteSpace: 'nowrap'
                });
                $body.append(tmpdiv);
            }
            tmpdiv.css('fontSize', fontsize);
            tmpdiv.text(text);
            return tmpdiv.width();
        },
        isMobile: function() {
            return !!/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        throttle: function(func, wait, options) {
            var context, args, result, wait = wait || 200;
            var timeout = null;
            var previous = 0;
            if (!options) options = {};
            var later = function() {
                previous = options.leading === false ? 0 : +new Date();
                timeout = null;
                result = func.apply(context, args);
                if (!timeout) context = args = null;
            };
            return function() {
                var now = +new Date();
                if (!previous && options.leading === false) previous = now;
                var remaining = wait - (now - previous);
                context = this;
                args = arguments;
                if (remaining <= 0 || remaining > wait) {
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = null;
                    }
                    previous = now;
                    result = func.apply(context, args);
                    if (!timeout) context = args = null;
                } else if (!timeout && options.trailing !== false) {
                    timeout = setTimeout(later, remaining);
                }
                return result;
            };
        },
        debounce: function(func, wait, immediate) {
            var timeout, args, context, timestamp, result, wait = wait || 200;
            var later = function() {
                var last = +new Date() - timestamp;

                if (last < wait && last >= 0) {
                    timeout = setTimeout(later, wait - last);
                } else {
                    timeout = null;
                    if (!immediate) {
                        result = func.apply(context, args);
                        if (!timeout) context = args = null;
                    }
                }
            };
            return function() {
                context = this;
                args = arguments;
                timestamp = +new Date();
                var callNow = immediate && !timeout;
                if (!timeout) timeout = setTimeout(later, wait);
                if (callNow) {
                    result = func.apply(context, args);
                    context = args = null;
                }
                return result;
            };
        },
        isNotEmpty: function(str) {
            return !(str === '' || str === null || str === 'undefined');
        },
        isEmail: function(str) {
            var reg = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
            return reg.test(str);
        },
        isFloat: function(str) {
            var reg = /^([-]){0,1}([0-9]){1,}([.]){0,1}([0-9]){0,}$/;
            return reg.test(str);
        },
        isInt: function(str) {
            var reg = /^-?\d+$/;
            return reg.test(str);
        },
        isPhone: function(str) {
            var reg = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4}$/im;
            return reg.test(str);
        },
        isZipCode: function(str) {
            var reg = /^([0-9]){5}$/;
            return reg.test(str);
        },
        isPrice: function(str) {
            var reg = /^(([$])?((([0-9]{1,3},)+([0-9]{3},)*[0-9]{3})|[0-9]+)(\.[0-9]+)?)$/;
            return reg.test(str);
        }
    });

})(jQuery);

window.context = {};
//initial event
(function ($) {
    $(document).ready(function ($) {
        var _isMobile = function () {
            if ($.isMobile()) {
                $('#body').addClass('mobile');
            } else {
                $('#body').addClass('desktop');
            }
        };
        var _eventKeyDownListener = function () {
            $(window).on('keydown', function (e) {
                var $focus = $(':focus');
                var tagName = $focus.length > 0 ? $focus.tagName : '';
                if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
                    $(document).trigger('dom.keydown', [e]);
                }
            });
        };
        var originalScrollTop = 0;
        var isScrollDown;
        var _scrollTrigger = function (e) {
            //in mobile device the scroll will cause by focus in input
            var causeByKeyboard = $('input, select, textarea').is(':focus');
            var currentScrollTop = $(document).scrollTop();
            if (currentScrollTop > originalScrollTop) {
                isScrollDown = true;
            } else if (currentScrollTop < originalScrollTop) {
                isScrollDown = false;
            }
            originalScrollTop = currentScrollTop;
            $(document).trigger('dom.scroll', [e, isScrollDown, originalScrollTop, causeByKeyboard]);
        };
        var _eventScrollListener = function () {
            $(window).on('scroll', $.throttle(function (e) {
                _scrollTrigger(e);
            }, 100));
        };

        var _oringalWindowWidth = $(window).width();
        var _resizeTrigger = function (e) {
            var isWidthChange = _oringalWindowWidth != $(window).width();
            var causeByKeyboard = $('input, select, textarea').is(':focus');
            $(document).trigger('dom.resize', [e, causeByKeyboard, isWidthChange]);
        };
        var _eventResizeListener = function () {
            $(window).on('resize', $.throttle(function (e) {
                _resizeTrigger(e);
            }, 200));
        };
        //dom load
        _isMobile();
        _eventKeyDownListener();
        _eventScrollListener();
        _eventResizeListener();
        $(document).trigger('dom.load');
    });
})(jQuery);

(function($) {
    $.CUI = {
        plugin: function(pluginContext) {
            var name = pluginContext.name;
            if ($.fn[name]) {
                window.console.log('the plugin is exists: ' + name);
                return null;
            }

            $.fn[name] = function(options) {
                var $this = $(this);
                var cache = $this.data(name);
                if (cache && typeof (cache) !== 'string') {
                    if (options) {
                        cache.setOptions && cache.setOptions(options);
                    }
                    return cache;
                }

                //initial context of plugin
                var context = $.extend({
                    $element: $this,
                    name: '',
                    defaultOpt: null,
                    initBefore: null,
                    init: null,
                    exports: {},
                    setOptionsBefore: null,
                    setOptionsAfter: null,
                    destroyBefore: null,
                    initAfter: null,
                    isThirdPart: false,
                }, pluginContext);

                context.options = options;
                context.$element = $this;

                var obj = $.proxy($.CUI.create, this)(context);

                $this.data(name, obj);

                return obj;
            };
        },
        create: function(context) {
            var that = this;
            //initial export options of plugin
            context.opt = $.extend(true, {}, context.defaultOpt, context.options);
            //handle the initial step
            $.proxy($.CUI.handleInit, that)(context);

            return context.exports;
        },
        handleOptions: function(context) {
            var that = this;
            return function(options) {
                //before set options
                context.setOptionsBefore && $.proxy(context.setOptionsBefore, that)(context, options);

                context.opt = $.extend(context.opt, options);

                //after set options
                context.setOptionsAfter && $.proxy(context.setOptionsAfter, that)(context, options);
            };
        },
        handleInit: function(context) {
            var that = this;
            var opt = context.opt;
            var exports = context.exports;
            //before plugin initial event
            $.CUI.addEvent('cui.init.before.' + context.name, context);
            opt.initbefore && $.CUI.addEvent(opt.initbefore, context);

            //before plugin initial custom event
            context.initBefore && $.CUI.addEvent(context.initBefore, context);

            context.init && $.proxy(context.init, that)(context);

            //is third part plugin
            if (context.isThirdPart && context.exports.original) {
                context.exports.original = $.isFunction(context.exports.original) ? $.proxy(context.exports.original, context)() : context.exports.original;
            } else {
                //add exports for the plugin
                $.proxy($.CUI.handleExports, that)(context);
                //initial get options of plugin
                context.exports.getOptions = function() {
                    return opt;
                };

                //initial set options of plugin
                context.exports.setOptions = $.proxy($.CUI.handleOptions, that)(context);

                //destroy export for the plugin
                context.exports.destroy = $.proxy($.CUI.handleDestroy, that)(context);
            }
            console.log(context.name);
            //after plugin initial custom event
            context.initAfter && $.proxy(context.initAfter, that)(context);
            opt.initafter && $.CUI.addEvent(opt.initafter, context);

            //after plugin initial event
            $.CUI.addEvent('cui.init.after.' + context.name, context);
        },
        handleDestroy: function(context) {
            var that = this;
            return function() {
                //before plugin destroy event
                $.CUI.addEvent('cui.before.destroy.' + context.name, context);
                //before plugin destroy custom event
                $.proxy(context.destroyBefore, that)(context);
                context.$element.data(context.name, null);
            };
        },
        handleExports: function(context) {
            if (context.exports) {
                var obj = {};
                $.each(context.exports, function(key, value) {
                    if ($.isFunction(value)) {
                        //export method for the plugin
                        obj[key] = $.proxy(value, context);
                    }
                });
                obj.name = context.name;
                context.exports = obj;
            }
        },
        addEvent: function(name, context) {
            var params = [context.$element, context.exports];
            var array = Array.prototype.slice.call(arguments);
            params.concat(array.slice(2, array.length));
            if ($.isFunction(name)) {
                name.apply(this, params);
            } else {
                $(document).trigger(name, params);
            }
        },
        loadJs: function() {

        }
    };
})(jQuery);

// For use moment.js convenience
Date.prototype.format = function(mask) {
    return moment(this).format(mask);
};

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
};

// Polyfill Number.isNaN(value)
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
if (!Number.isNaN) {
    Number.isNaN = function(value) {
        return typeof value === 'number' && value !== value;
    };
}
/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.6.0
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */
!function(a){"use strict";"function"==typeof define&&define.amd?define(["jquery"],a):"undefined"!=typeof exports?module.exports=a(require("jquery")):a(jQuery)}(function(a){"use strict";var b=window.Slick||{};b=function(){function c(c,d){var f,e=this;e.defaults={accessibility:!0,adaptiveHeight:!1,appendArrows:a(c),appendDots:a(c),arrows:!0,asNavFor:null,prevArrow:'<button type="button" data-role="none" class="slick-prev" aria-label="Previous" tabindex="0" role="button">Previous</button>',nextArrow:'<button type="button" data-role="none" class="slick-next" aria-label="Next" tabindex="0" role="button">Next</button>',autoplay:!1,autoplaySpeed:3e3,centerMode:!1,centerPadding:"50px",cssEase:"ease",customPaging:function(b,c){return a('<button type="button" data-role="none" role="button" tabindex="0" />').text(c+1)},dots:!1,dotsClass:"slick-dots",draggable:!0,easing:"linear",edgeFriction:.35,fade:!1,focusOnSelect:!1,infinite:!0,initialSlide:0,lazyLoad:"ondemand",mobileFirst:!1,pauseOnHover:!0,pauseOnFocus:!0,pauseOnDotsHover:!1,respondTo:"window",responsive:null,rows:1,rtl:!1,slide:"",slidesPerRow:1,slidesToShow:1,slidesToScroll:1,speed:500,swipe:!0,swipeToSlide:!1,touchMove:!0,touchThreshold:5,useCSS:!0,useTransform:!0,variableWidth:!1,vertical:!1,verticalSwiping:!1,waitForAnimate:!0,zIndex:1e3},e.initials={animating:!1,dragging:!1,autoPlayTimer:null,currentDirection:0,currentLeft:null,currentSlide:0,direction:1,$dots:null,listWidth:null,listHeight:null,loadIndex:0,$nextArrow:null,$prevArrow:null,slideCount:null,slideWidth:null,$slideTrack:null,$slides:null,sliding:!1,slideOffset:0,swipeLeft:null,$list:null,touchObject:{},transformsEnabled:!1,unslicked:!1},a.extend(e,e.initials),e.activeBreakpoint=null,e.animType=null,e.animProp=null,e.breakpoints=[],e.breakpointSettings=[],e.cssTransitions=!1,e.focussed=!1,e.interrupted=!1,e.hidden="hidden",e.paused=!0,e.positionProp=null,e.respondTo=null,e.rowCount=1,e.shouldClick=!0,e.$slider=a(c),e.$slidesCache=null,e.transformType=null,e.transitionType=null,e.visibilityChange="visibilitychange",e.windowWidth=0,e.windowTimer=null,f=a(c).data("slick")||{},e.options=a.extend({},e.defaults,d,f),e.currentSlide=e.options.initialSlide,e.originalSettings=e.options,"undefined"!=typeof document.mozHidden?(e.hidden="mozHidden",e.visibilityChange="mozvisibilitychange"):"undefined"!=typeof document.webkitHidden&&(e.hidden="webkitHidden",e.visibilityChange="webkitvisibilitychange"),e.autoPlay=a.proxy(e.autoPlay,e),e.autoPlayClear=a.proxy(e.autoPlayClear,e),e.autoPlayIterator=a.proxy(e.autoPlayIterator,e),e.changeSlide=a.proxy(e.changeSlide,e),e.clickHandler=a.proxy(e.clickHandler,e),e.selectHandler=a.proxy(e.selectHandler,e),e.setPosition=a.proxy(e.setPosition,e),e.swipeHandler=a.proxy(e.swipeHandler,e),e.dragHandler=a.proxy(e.dragHandler,e),e.keyHandler=a.proxy(e.keyHandler,e),e.instanceUid=b++,e.htmlExpr=/^(?:\s*(<[\w\W]+>)[^>]*)$/,e.registerBreakpoints(),e.init(!0)}var b=0;return c}(),b.prototype.activateADA=function(){var a=this;a.$slideTrack.find(".slick-active").attr({"aria-hidden":"false"}).find("a, input, button, select").attr({tabindex:"0"})},b.prototype.addSlide=b.prototype.slickAdd=function(b,c,d){var e=this;if("boolean"==typeof c)d=c,c=null;else if(0>c||c>=e.slideCount)return!1;e.unload(),"number"==typeof c?0===c&&0===e.$slides.length?a(b).appendTo(e.$slideTrack):d?a(b).insertBefore(e.$slides.eq(c)):a(b).insertAfter(e.$slides.eq(c)):d===!0?a(b).prependTo(e.$slideTrack):a(b).appendTo(e.$slideTrack),e.$slides=e.$slideTrack.children(this.options.slide),e.$slideTrack.children(this.options.slide).detach(),e.$slideTrack.append(e.$slides),e.$slides.each(function(b,c){a(c).attr("data-slick-index",b)}),e.$slidesCache=e.$slides,e.reinit()},b.prototype.animateHeight=function(){var a=this;if(1===a.options.slidesToShow&&a.options.adaptiveHeight===!0&&a.options.vertical===!1){var b=a.$slides.eq(a.currentSlide).outerHeight(!0);a.$list.animate({height:b},a.options.speed)}},b.prototype.animateSlide=function(b,c){var d={},e=this;e.animateHeight(),e.options.rtl===!0&&e.options.vertical===!1&&(b=-b),e.transformsEnabled===!1?e.options.vertical===!1?e.$slideTrack.animate({left:b},e.options.speed,e.options.easing,c):e.$slideTrack.animate({top:b},e.options.speed,e.options.easing,c):e.cssTransitions===!1?(e.options.rtl===!0&&(e.currentLeft=-e.currentLeft),a({animStart:e.currentLeft}).animate({animStart:b},{duration:e.options.speed,easing:e.options.easing,step:function(a){a=Math.ceil(a),e.options.vertical===!1?(d[e.animType]="translate("+a+"px, 0px)",e.$slideTrack.css(d)):(d[e.animType]="translate(0px,"+a+"px)",e.$slideTrack.css(d))},complete:function(){c&&c.call()}})):(e.applyTransition(),b=Math.ceil(b),e.options.vertical===!1?d[e.animType]="translate3d("+b+"px, 0px, 0px)":d[e.animType]="translate3d(0px,"+b+"px, 0px)",e.$slideTrack.css(d),c&&setTimeout(function(){e.disableTransition(),c.call()},e.options.speed))},b.prototype.getNavTarget=function(){var b=this,c=b.options.asNavFor;return c&&null!==c&&(c=a(c).not(b.$slider)),c},b.prototype.asNavFor=function(b){var c=this,d=c.getNavTarget();null!==d&&"object"==typeof d&&d.each(function(){var c=a(this).slick("getSlick");c.unslicked||c.slideHandler(b,!0)})},b.prototype.applyTransition=function(a){var b=this,c={};b.options.fade===!1?c[b.transitionType]=b.transformType+" "+b.options.speed+"ms "+b.options.cssEase:c[b.transitionType]="opacity "+b.options.speed+"ms "+b.options.cssEase,b.options.fade===!1?b.$slideTrack.css(c):b.$slides.eq(a).css(c)},b.prototype.autoPlay=function(){var a=this;a.autoPlayClear(),a.slideCount>a.options.slidesToShow&&(a.autoPlayTimer=setInterval(a.autoPlayIterator,a.options.autoplaySpeed))},b.prototype.autoPlayClear=function(){var a=this;a.autoPlayTimer&&clearInterval(a.autoPlayTimer)},b.prototype.autoPlayIterator=function(){var a=this,b=a.currentSlide+a.options.slidesToScroll;a.paused||a.interrupted||a.focussed||(a.options.infinite===!1&&(1===a.direction&&a.currentSlide+1===a.slideCount-1?a.direction=0:0===a.direction&&(b=a.currentSlide-a.options.slidesToScroll,a.currentSlide-1===0&&(a.direction=1))),a.slideHandler(b))},b.prototype.buildArrows=function(){var b=this;b.options.arrows===!0&&(b.$prevArrow=a(b.options.prevArrow).addClass("slick-arrow"),b.$nextArrow=a(b.options.nextArrow).addClass("slick-arrow"),b.slideCount>b.options.slidesToShow?(b.$prevArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"),b.$nextArrow.removeClass("slick-hidden").removeAttr("aria-hidden tabindex"),b.htmlExpr.test(b.options.prevArrow)&&b.$prevArrow.prependTo(b.options.appendArrows),b.htmlExpr.test(b.options.nextArrow)&&b.$nextArrow.appendTo(b.options.appendArrows),b.options.infinite!==!0&&b.$prevArrow.addClass("slick-disabled").attr("aria-disabled","true")):b.$prevArrow.add(b.$nextArrow).addClass("slick-hidden").attr({"aria-disabled":"true",tabindex:"-1"}))},b.prototype.buildDots=function(){var c,d,b=this;if(b.options.dots===!0&&b.slideCount>b.options.slidesToShow){for(b.$slider.addClass("slick-dotted"),d=a("<ul />").addClass(b.options.dotsClass),c=0;c<=b.getDotCount();c+=1)d.append(a("<li />").append(b.options.customPaging.call(this,b,c)));b.$dots=d.appendTo(b.options.appendDots),b.$dots.find("li").first().addClass("slick-active").attr("aria-hidden","false")}},b.prototype.buildOut=function(){var b=this;b.$slides=b.$slider.children(b.options.slide+":not(.slick-cloned)").addClass("slick-slide"),b.slideCount=b.$slides.length,b.$slides.each(function(b,c){a(c).attr("data-slick-index",b).data("originalStyling",a(c).attr("style")||"")}),b.$slider.addClass("slick-slider"),b.$slideTrack=0===b.slideCount?a('<div class="slick-track"/>').appendTo(b.$slider):b.$slides.wrapAll('<div class="slick-track"/>').parent(),b.$list=b.$slideTrack.wrap('<div aria-live="polite" class="slick-list"/>').parent(),b.$slideTrack.css("opacity",0),(b.options.centerMode===!0||b.options.swipeToSlide===!0)&&(b.options.slidesToScroll=1),a("img[data-lazy]",b.$slider).not("[src]").addClass("slick-loading"),b.setupInfinite(),b.buildArrows(),b.buildDots(),b.updateDots(),b.setSlideClasses("number"==typeof b.currentSlide?b.currentSlide:0),b.options.draggable===!0&&b.$list.addClass("draggable")},b.prototype.buildRows=function(){var b,c,d,e,f,g,h,a=this;if(e=document.createDocumentFragment(),g=a.$slider.children(),a.options.rows>1){for(h=a.options.slidesPerRow*a.options.rows,f=Math.ceil(g.length/h),b=0;f>b;b++){var i=document.createElement("div");for(c=0;c<a.options.rows;c++){var j=document.createElement("div");for(d=0;d<a.options.slidesPerRow;d++){var k=b*h+(c*a.options.slidesPerRow+d);g.get(k)&&j.appendChild(g.get(k))}i.appendChild(j)}e.appendChild(i)}a.$slider.empty().append(e),a.$slider.children().children().children().css({width:100/a.options.slidesPerRow+"%",display:"inline-block"})}},b.prototype.checkResponsive=function(b,c){var e,f,g,d=this,h=!1,i=d.$slider.width(),j=window.innerWidth||a(window).width();if("window"===d.respondTo?g=j:"slider"===d.respondTo?g=i:"min"===d.respondTo&&(g=Math.min(j,i)),d.options.responsive&&d.options.responsive.length&&null!==d.options.responsive){f=null;for(e in d.breakpoints)d.breakpoints.hasOwnProperty(e)&&(d.originalSettings.mobileFirst===!1?g<d.breakpoints[e]&&(f=d.breakpoints[e]):g>d.breakpoints[e]&&(f=d.breakpoints[e]));null!==f?null!==d.activeBreakpoint?(f!==d.activeBreakpoint||c)&&(d.activeBreakpoint=f,"unslick"===d.breakpointSettings[f]?d.unslick(f):(d.options=a.extend({},d.originalSettings,d.breakpointSettings[f]),b===!0&&(d.currentSlide=d.options.initialSlide),d.refresh(b)),h=f):(d.activeBreakpoint=f,"unslick"===d.breakpointSettings[f]?d.unslick(f):(d.options=a.extend({},d.originalSettings,d.breakpointSettings[f]),b===!0&&(d.currentSlide=d.options.initialSlide),d.refresh(b)),h=f):null!==d.activeBreakpoint&&(d.activeBreakpoint=null,d.options=d.originalSettings,b===!0&&(d.currentSlide=d.options.initialSlide),d.refresh(b),h=f),b||h===!1||d.$slider.trigger("breakpoint",[d,h])}},b.prototype.changeSlide=function(b,c){var f,g,h,d=this,e=a(b.currentTarget);switch(e.is("a")&&b.preventDefault(),e.is("li")||(e=e.closest("li")),h=d.slideCount%d.options.slidesToScroll!==0,f=h?0:(d.slideCount-d.currentSlide)%d.options.slidesToScroll,b.data.message){case"previous":g=0===f?d.options.slidesToScroll:d.options.slidesToShow-f,d.slideCount>d.options.slidesToShow&&d.slideHandler(d.currentSlide-g,!1,c);break;case"next":g=0===f?d.options.slidesToScroll:f,d.slideCount>d.options.slidesToShow&&d.slideHandler(d.currentSlide+g,!1,c);break;case"index":var i=0===b.data.index?0:b.data.index||e.index()*d.options.slidesToScroll;d.slideHandler(d.checkNavigable(i),!1,c),e.children().trigger("focus");break;default:return}},b.prototype.checkNavigable=function(a){var c,d,b=this;if(c=b.getNavigableIndexes(),d=0,a>c[c.length-1])a=c[c.length-1];else for(var e in c){if(a<c[e]){a=d;break}d=c[e]}return a},b.prototype.cleanUpEvents=function(){var b=this;b.options.dots&&null!==b.$dots&&a("li",b.$dots).off("click.slick",b.changeSlide).off("mouseenter.slick",a.proxy(b.interrupt,b,!0)).off("mouseleave.slick",a.proxy(b.interrupt,b,!1)),b.$slider.off("focus.slick blur.slick"),b.options.arrows===!0&&b.slideCount>b.options.slidesToShow&&(b.$prevArrow&&b.$prevArrow.off("click.slick",b.changeSlide),b.$nextArrow&&b.$nextArrow.off("click.slick",b.changeSlide)),b.$list.off("touchstart.slick mousedown.slick",b.swipeHandler),b.$list.off("touchmove.slick mousemove.slick",b.swipeHandler),b.$list.off("touchend.slick mouseup.slick",b.swipeHandler),b.$list.off("touchcancel.slick mouseleave.slick",b.swipeHandler),b.$list.off("click.slick",b.clickHandler),a(document).off(b.visibilityChange,b.visibility),b.cleanUpSlideEvents(),b.options.accessibility===!0&&b.$list.off("keydown.slick",b.keyHandler),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().off("click.slick",b.selectHandler),a(window).off("orientationchange.slick.slick-"+b.instanceUid,b.orientationChange),a(window).off("resize.slick.slick-"+b.instanceUid,b.resize),a("[draggable!=true]",b.$slideTrack).off("dragstart",b.preventDefault),a(window).off("load.slick.slick-"+b.instanceUid,b.setPosition),a(document).off("ready.slick.slick-"+b.instanceUid,b.setPosition)},b.prototype.cleanUpSlideEvents=function(){var b=this;b.$list.off("mouseenter.slick",a.proxy(b.interrupt,b,!0)),b.$list.off("mouseleave.slick",a.proxy(b.interrupt,b,!1))},b.prototype.cleanUpRows=function(){var b,a=this;a.options.rows>1&&(b=a.$slides.children().children(),b.removeAttr("style"),a.$slider.empty().append(b))},b.prototype.clickHandler=function(a){var b=this;b.shouldClick===!1&&(a.stopImmediatePropagation(),a.stopPropagation(),a.preventDefault())},b.prototype.destroy=function(b){var c=this;c.autoPlayClear(),c.touchObject={},c.cleanUpEvents(),a(".slick-cloned",c.$slider).detach(),c.$dots&&c.$dots.remove(),c.$prevArrow&&c.$prevArrow.length&&(c.$prevArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display",""),c.htmlExpr.test(c.options.prevArrow)&&c.$prevArrow.remove()),c.$nextArrow&&c.$nextArrow.length&&(c.$nextArrow.removeClass("slick-disabled slick-arrow slick-hidden").removeAttr("aria-hidden aria-disabled tabindex").css("display",""),c.htmlExpr.test(c.options.nextArrow)&&c.$nextArrow.remove()),c.$slides&&(c.$slides.removeClass("slick-slide slick-active slick-center slick-visible slick-current").removeAttr("aria-hidden").removeAttr("data-slick-index").each(function(){a(this).attr("style",a(this).data("originalStyling"))}),c.$slideTrack.children(this.options.slide).detach(),c.$slideTrack.detach(),c.$list.detach(),c.$slider.append(c.$slides)),c.cleanUpRows(),c.$slider.removeClass("slick-slider"),c.$slider.removeClass("slick-initialized"),c.$slider.removeClass("slick-dotted"),c.unslicked=!0,b||c.$slider.trigger("destroy",[c])},b.prototype.disableTransition=function(a){var b=this,c={};c[b.transitionType]="",b.options.fade===!1?b.$slideTrack.css(c):b.$slides.eq(a).css(c)},b.prototype.fadeSlide=function(a,b){var c=this;c.cssTransitions===!1?(c.$slides.eq(a).css({zIndex:c.options.zIndex}),c.$slides.eq(a).animate({opacity:1},c.options.speed,c.options.easing,b)):(c.applyTransition(a),c.$slides.eq(a).css({opacity:1,zIndex:c.options.zIndex}),b&&setTimeout(function(){c.disableTransition(a),b.call()},c.options.speed))},b.prototype.fadeSlideOut=function(a){var b=this;b.cssTransitions===!1?b.$slides.eq(a).animate({opacity:0,zIndex:b.options.zIndex-2},b.options.speed,b.options.easing):(b.applyTransition(a),b.$slides.eq(a).css({opacity:0,zIndex:b.options.zIndex-2}))},b.prototype.filterSlides=b.prototype.slickFilter=function(a){var b=this;null!==a&&(b.$slidesCache=b.$slides,b.unload(),b.$slideTrack.children(this.options.slide).detach(),b.$slidesCache.filter(a).appendTo(b.$slideTrack),b.reinit())},b.prototype.focusHandler=function(){var b=this;b.$slider.off("focus.slick blur.slick").on("focus.slick blur.slick","*:not(.slick-arrow)",function(c){c.stopImmediatePropagation();var d=a(this);setTimeout(function(){b.options.pauseOnFocus&&(b.focussed=d.is(":focus"),b.autoPlay())},0)})},b.prototype.getCurrent=b.prototype.slickCurrentSlide=function(){var a=this;return a.currentSlide},b.prototype.getDotCount=function(){var a=this,b=0,c=0,d=0;if(a.options.infinite===!0)for(;b<a.slideCount;)++d,b=c+a.options.slidesToScroll,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;else if(a.options.centerMode===!0)d=a.slideCount;else if(a.options.asNavFor)for(;b<a.slideCount;)++d,b=c+a.options.slidesToScroll,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;else d=1+Math.ceil((a.slideCount-a.options.slidesToShow)/a.options.slidesToScroll);return d-1},b.prototype.getLeft=function(a){var c,d,f,b=this,e=0;return b.slideOffset=0,d=b.$slides.first().outerHeight(!0),b.options.infinite===!0?(b.slideCount>b.options.slidesToShow&&(b.slideOffset=b.slideWidth*b.options.slidesToShow*-1,e=d*b.options.slidesToShow*-1),b.slideCount%b.options.slidesToScroll!==0&&a+b.options.slidesToScroll>b.slideCount&&b.slideCount>b.options.slidesToShow&&(a>b.slideCount?(b.slideOffset=(b.options.slidesToShow-(a-b.slideCount))*b.slideWidth*-1,e=(b.options.slidesToShow-(a-b.slideCount))*d*-1):(b.slideOffset=b.slideCount%b.options.slidesToScroll*b.slideWidth*-1,e=b.slideCount%b.options.slidesToScroll*d*-1))):a+b.options.slidesToShow>b.slideCount&&(b.slideOffset=(a+b.options.slidesToShow-b.slideCount)*b.slideWidth,e=(a+b.options.slidesToShow-b.slideCount)*d),b.slideCount<=b.options.slidesToShow&&(b.slideOffset=0,e=0),b.options.centerMode===!0&&b.options.infinite===!0?b.slideOffset+=b.slideWidth*Math.floor(b.options.slidesToShow/2)-b.slideWidth:b.options.centerMode===!0&&(b.slideOffset=0,b.slideOffset+=b.slideWidth*Math.floor(b.options.slidesToShow/2)),c=b.options.vertical===!1?a*b.slideWidth*-1+b.slideOffset:a*d*-1+e,b.options.variableWidth===!0&&(f=b.slideCount<=b.options.slidesToShow||b.options.infinite===!1?b.$slideTrack.children(".slick-slide").eq(a):b.$slideTrack.children(".slick-slide").eq(a+b.options.slidesToShow),c=b.options.rtl===!0?f[0]?-1*(b.$slideTrack.width()-f[0].offsetLeft-f.width()):0:f[0]?-1*f[0].offsetLeft:0,b.options.centerMode===!0&&(f=b.slideCount<=b.options.slidesToShow||b.options.infinite===!1?b.$slideTrack.children(".slick-slide").eq(a):b.$slideTrack.children(".slick-slide").eq(a+b.options.slidesToShow+1),c=b.options.rtl===!0?f[0]?-1*(b.$slideTrack.width()-f[0].offsetLeft-f.width()):0:f[0]?-1*f[0].offsetLeft:0,c+=(b.$list.width()-f.outerWidth())/2)),c},b.prototype.getOption=b.prototype.slickGetOption=function(a){var b=this;return b.options[a]},b.prototype.getNavigableIndexes=function(){var e,a=this,b=0,c=0,d=[];for(a.options.infinite===!1?e=a.slideCount:(b=-1*a.options.slidesToScroll,c=-1*a.options.slidesToScroll,e=2*a.slideCount);e>b;)d.push(b),b=c+a.options.slidesToScroll,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;return d},b.prototype.getSlick=function(){return this},b.prototype.getSlideCount=function(){var c,d,e,b=this;return e=b.options.centerMode===!0?b.slideWidth*Math.floor(b.options.slidesToShow/2):0,b.options.swipeToSlide===!0?(b.$slideTrack.find(".slick-slide").each(function(c,f){return f.offsetLeft-e+a(f).outerWidth()/2>-1*b.swipeLeft?(d=f,!1):void 0}),c=Math.abs(a(d).attr("data-slick-index")-b.currentSlide)||1):b.options.slidesToScroll},b.prototype.goTo=b.prototype.slickGoTo=function(a,b){var c=this;c.changeSlide({data:{message:"index",index:parseInt(a)}},b)},b.prototype.init=function(b){var c=this;a(c.$slider).hasClass("slick-initialized")||(a(c.$slider).addClass("slick-initialized"),c.buildRows(),c.buildOut(),c.setProps(),c.startLoad(),c.loadSlider(),c.initializeEvents(),c.updateArrows(),c.updateDots(),c.checkResponsive(!0),c.focusHandler()),b&&c.$slider.trigger("init",[c]),c.options.accessibility===!0&&c.initADA(),c.options.autoplay&&(c.paused=!1,c.autoPlay())},b.prototype.initADA=function(){var b=this;b.$slides.add(b.$slideTrack.find(".slick-cloned")).attr({"aria-hidden":"true",tabindex:"-1"}).find("a, input, button, select").attr({tabindex:"-1"}),b.$slideTrack.attr("role","listbox"),b.$slides.not(b.$slideTrack.find(".slick-cloned")).each(function(c){a(this).attr({role:"option","aria-describedby":"slick-slide"+b.instanceUid+c})}),null!==b.$dots&&b.$dots.attr("role","tablist").find("li").each(function(c){a(this).attr({role:"presentation","aria-selected":"false","aria-controls":"navigation"+b.instanceUid+c,id:"slick-slide"+b.instanceUid+c})}).first().attr("aria-selected","true").end().find("button").attr("role","button").end().closest("div").attr("role","toolbar"),b.activateADA()},b.prototype.initArrowEvents=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.off("click.slick").on("click.slick",{message:"previous"},a.changeSlide),a.$nextArrow.off("click.slick").on("click.slick",{message:"next"},a.changeSlide))},b.prototype.initDotEvents=function(){var b=this;b.options.dots===!0&&b.slideCount>b.options.slidesToShow&&a("li",b.$dots).on("click.slick",{message:"index"},b.changeSlide),b.options.dots===!0&&b.options.pauseOnDotsHover===!0&&a("li",b.$dots).on("mouseenter.slick",a.proxy(b.interrupt,b,!0)).on("mouseleave.slick",a.proxy(b.interrupt,b,!1))},b.prototype.initSlideEvents=function(){var b=this;b.options.pauseOnHover&&(b.$list.on("mouseenter.slick",a.proxy(b.interrupt,b,!0)),b.$list.on("mouseleave.slick",a.proxy(b.interrupt,b,!1)))},b.prototype.initializeEvents=function(){var b=this;b.initArrowEvents(),b.initDotEvents(),b.initSlideEvents(),b.$list.on("touchstart.slick mousedown.slick",{action:"start"},b.swipeHandler),b.$list.on("touchmove.slick mousemove.slick",{action:"move"},b.swipeHandler),b.$list.on("touchend.slick mouseup.slick",{action:"end"},b.swipeHandler),b.$list.on("touchcancel.slick mouseleave.slick",{action:"end"},b.swipeHandler),b.$list.on("click.slick",b.clickHandler),a(document).on(b.visibilityChange,a.proxy(b.visibility,b)),b.options.accessibility===!0&&b.$list.on("keydown.slick",b.keyHandler),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().on("click.slick",b.selectHandler),a(window).on("orientationchange.slick.slick-"+b.instanceUid,a.proxy(b.orientationChange,b)),a(window).on("resize.slick.slick-"+b.instanceUid,a.proxy(b.resize,b)),a("[draggable!=true]",b.$slideTrack).on("dragstart",b.preventDefault),a(window).on("load.slick.slick-"+b.instanceUid,b.setPosition),a(document).on("ready.slick.slick-"+b.instanceUid,b.setPosition)},b.prototype.initUI=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.show(),a.$nextArrow.show()),a.options.dots===!0&&a.slideCount>a.options.slidesToShow&&a.$dots.show()},b.prototype.keyHandler=function(a){var b=this;a.target.tagName.match("TEXTAREA|INPUT|SELECT")||(37===a.keyCode&&b.options.accessibility===!0?b.changeSlide({data:{message:b.options.rtl===!0?"next":"previous"}}):39===a.keyCode&&b.options.accessibility===!0&&b.changeSlide({data:{message:b.options.rtl===!0?"previous":"next"}}))},b.prototype.lazyLoad=function(){function g(c){a("img[data-lazy]",c).each(function(){var c=a(this),d=a(this).attr("data-lazy"),e=document.createElement("img");e.onload=function(){c.animate({opacity:0},100,function(){c.attr("src",d).animate({opacity:1},200,function(){c.removeAttr("data-lazy").removeClass("slick-loading")}),b.$slider.trigger("lazyLoaded",[b,c,d])})},e.onerror=function(){c.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"),b.$slider.trigger("lazyLoadError",[b,c,d])},e.src=d})}var c,d,e,f,b=this;b.options.centerMode===!0?b.options.infinite===!0?(e=b.currentSlide+(b.options.slidesToShow/2+1),f=e+b.options.slidesToShow+2):(e=Math.max(0,b.currentSlide-(b.options.slidesToShow/2+1)),f=2+(b.options.slidesToShow/2+1)+b.currentSlide):(e=b.options.infinite?b.options.slidesToShow+b.currentSlide:b.currentSlide,f=Math.ceil(e+b.options.slidesToShow),b.options.fade===!0&&(e>0&&e--,f<=b.slideCount&&f++)),c=b.$slider.find(".slick-slide").slice(e,f),g(c),b.slideCount<=b.options.slidesToShow?(d=b.$slider.find(".slick-slide"),g(d)):b.currentSlide>=b.slideCount-b.options.slidesToShow?(d=b.$slider.find(".slick-cloned").slice(0,b.options.slidesToShow),g(d)):0===b.currentSlide&&(d=b.$slider.find(".slick-cloned").slice(-1*b.options.slidesToShow),g(d))},b.prototype.loadSlider=function(){var a=this;a.setPosition(),a.$slideTrack.css({opacity:1}),a.$slider.removeClass("slick-loading"),a.initUI(),"progressive"===a.options.lazyLoad&&a.progressiveLazyLoad()},b.prototype.next=b.prototype.slickNext=function(){var a=this;a.changeSlide({data:{message:"next"}})},b.prototype.orientationChange=function(){var a=this;a.checkResponsive(),a.setPosition()},b.prototype.pause=b.prototype.slickPause=function(){var a=this;a.autoPlayClear(),a.paused=!0},b.prototype.play=b.prototype.slickPlay=function(){var a=this;a.autoPlay(),a.options.autoplay=!0,a.paused=!1,a.focussed=!1,a.interrupted=!1},b.prototype.postSlide=function(a){var b=this;b.unslicked||(b.$slider.trigger("afterChange",[b,a]),b.animating=!1,b.setPosition(),b.swipeLeft=null,b.options.autoplay&&b.autoPlay(),b.options.accessibility===!0&&b.initADA())},b.prototype.prev=b.prototype.slickPrev=function(){var a=this;a.changeSlide({data:{message:"previous"}})},b.prototype.preventDefault=function(a){a.preventDefault()},b.prototype.progressiveLazyLoad=function(b){b=b||1;var e,f,g,c=this,d=a("img[data-lazy]",c.$slider);d.length?(e=d.first(),f=e.attr("data-lazy"),g=document.createElement("img"),g.onload=function(){e.attr("src",f).removeAttr("data-lazy").removeClass("slick-loading"),c.options.adaptiveHeight===!0&&c.setPosition(),c.$slider.trigger("lazyLoaded",[c,e,f]),c.progressiveLazyLoad()},g.onerror=function(){3>b?setTimeout(function(){c.progressiveLazyLoad(b+1)},500):(e.removeAttr("data-lazy").removeClass("slick-loading").addClass("slick-lazyload-error"),c.$slider.trigger("lazyLoadError",[c,e,f]),c.progressiveLazyLoad())},g.src=f):c.$slider.trigger("allImagesLoaded",[c])},b.prototype.refresh=function(b){var d,e,c=this;e=c.slideCount-c.options.slidesToShow,!c.options.infinite&&c.currentSlide>e&&(c.currentSlide=e),c.slideCount<=c.options.slidesToShow&&(c.currentSlide=0),d=c.currentSlide,c.destroy(!0),a.extend(c,c.initials,{currentSlide:d}),c.init(),b||c.changeSlide({data:{message:"index",index:d}},!1)},b.prototype.registerBreakpoints=function(){var c,d,e,b=this,f=b.options.responsive||null;if("array"===a.type(f)&&f.length){b.respondTo=b.options.respondTo||"window";for(c in f)if(e=b.breakpoints.length-1,d=f[c].breakpoint,f.hasOwnProperty(c)){for(;e>=0;)b.breakpoints[e]&&b.breakpoints[e]===d&&b.breakpoints.splice(e,1),e--;b.breakpoints.push(d),b.breakpointSettings[d]=f[c].settings}b.breakpoints.sort(function(a,c){return b.options.mobileFirst?a-c:c-a})}},b.prototype.reinit=function(){var b=this;b.$slides=b.$slideTrack.children(b.options.slide).addClass("slick-slide"),b.slideCount=b.$slides.length,b.currentSlide>=b.slideCount&&0!==b.currentSlide&&(b.currentSlide=b.currentSlide-b.options.slidesToScroll),b.slideCount<=b.options.slidesToShow&&(b.currentSlide=0),b.registerBreakpoints(),b.setProps(),b.setupInfinite(),b.buildArrows(),b.updateArrows(),b.initArrowEvents(),b.buildDots(),b.updateDots(),b.initDotEvents(),b.cleanUpSlideEvents(),b.initSlideEvents(),b.checkResponsive(!1,!0),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().on("click.slick",b.selectHandler),b.setSlideClasses("number"==typeof b.currentSlide?b.currentSlide:0),b.setPosition(),b.focusHandler(),b.paused=!b.options.autoplay,b.autoPlay(),b.$slider.trigger("reInit",[b])},b.prototype.resize=function(){var b=this;a(window).width()!==b.windowWidth&&(clearTimeout(b.windowDelay),b.windowDelay=window.setTimeout(function(){b.windowWidth=a(window).width(),b.checkResponsive(),b.unslicked||b.setPosition()},50))},b.prototype.removeSlide=b.prototype.slickRemove=function(a,b,c){var d=this;return"boolean"==typeof a?(b=a,a=b===!0?0:d.slideCount-1):a=b===!0?--a:a,d.slideCount<1||0>a||a>d.slideCount-1?!1:(d.unload(),c===!0?d.$slideTrack.children().remove():d.$slideTrack.children(this.options.slide).eq(a).remove(),d.$slides=d.$slideTrack.children(this.options.slide),d.$slideTrack.children(this.options.slide).detach(),d.$slideTrack.append(d.$slides),d.$slidesCache=d.$slides,void d.reinit())},b.prototype.setCSS=function(a){var d,e,b=this,c={};b.options.rtl===!0&&(a=-a),d="left"==b.positionProp?Math.ceil(a)+"px":"0px",e="top"==b.positionProp?Math.ceil(a)+"px":"0px",c[b.positionProp]=a,b.transformsEnabled===!1?b.$slideTrack.css(c):(c={},b.cssTransitions===!1?(c[b.animType]="translate("+d+", "+e+")",b.$slideTrack.css(c)):(c[b.animType]="translate3d("+d+", "+e+", 0px)",b.$slideTrack.css(c)))},b.prototype.setDimensions=function(){var a=this;a.options.vertical===!1?a.options.centerMode===!0&&a.$list.css({padding:"0px "+a.options.centerPadding}):(a.$list.height(a.$slides.first().outerHeight(!0)*a.options.slidesToShow),a.options.centerMode===!0&&a.$list.css({padding:a.options.centerPadding+" 0px"})),a.listWidth=a.$list.width(),a.listHeight=a.$list.height(),a.options.vertical===!1&&a.options.variableWidth===!1?(a.slideWidth=Math.ceil(a.listWidth/a.options.slidesToShow),a.$slideTrack.width(Math.ceil(a.slideWidth*a.$slideTrack.children(".slick-slide").length))):a.options.variableWidth===!0?a.$slideTrack.width(5e3*a.slideCount):(a.slideWidth=Math.ceil(a.listWidth),a.$slideTrack.height(Math.ceil(a.$slides.first().outerHeight(!0)*a.$slideTrack.children(".slick-slide").length)));var b=a.$slides.first().outerWidth(!0)-a.$slides.first().width();a.options.variableWidth===!1&&a.$slideTrack.children(".slick-slide").width(a.slideWidth-b)},b.prototype.setFade=function(){var c,b=this;b.$slides.each(function(d,e){c=b.slideWidth*d*-1,b.options.rtl===!0?a(e).css({position:"relative",right:c,top:0,zIndex:b.options.zIndex-2,opacity:0}):a(e).css({position:"relative",left:c,top:0,zIndex:b.options.zIndex-2,opacity:0})}),b.$slides.eq(b.currentSlide).css({zIndex:b.options.zIndex-1,opacity:1})},b.prototype.setHeight=function(){var a=this;if(1===a.options.slidesToShow&&a.options.adaptiveHeight===!0&&a.options.vertical===!1){var b=a.$slides.eq(a.currentSlide).outerHeight(!0);a.$list.css("height",b)}},b.prototype.setOption=b.prototype.slickSetOption=function(){var c,d,e,f,h,b=this,g=!1;if("object"===a.type(arguments[0])?(e=arguments[0],g=arguments[1],h="multiple"):"string"===a.type(arguments[0])&&(e=arguments[0],f=arguments[1],g=arguments[2],"responsive"===arguments[0]&&"array"===a.type(arguments[1])?h="responsive":"undefined"!=typeof arguments[1]&&(h="single")),"single"===h)b.options[e]=f;else if("multiple"===h)a.each(e,function(a,c){b.options[a]=c});else if("responsive"===h)for(d in f)if("array"!==a.type(b.options.responsive))b.options.responsive=[f[d]];else{for(c=b.options.responsive.length-1;c>=0;)b.options.responsive[c].breakpoint===f[d].breakpoint&&b.options.responsive.splice(c,1),c--;b.options.responsive.push(f[d])}g&&(b.unload(),b.reinit())},b.prototype.setPosition=function(){var a=this;a.setDimensions(),a.setHeight(),a.options.fade===!1?a.setCSS(a.getLeft(a.currentSlide)):a.setFade(),a.$slider.trigger("setPosition",[a])},b.prototype.setProps=function(){var a=this,b=document.body.style;a.positionProp=a.options.vertical===!0?"top":"left","top"===a.positionProp?a.$slider.addClass("slick-vertical"):a.$slider.removeClass("slick-vertical"),(void 0!==b.WebkitTransition||void 0!==b.MozTransition||void 0!==b.msTransition)&&a.options.useCSS===!0&&(a.cssTransitions=!0),a.options.fade&&("number"==typeof a.options.zIndex?a.options.zIndex<3&&(a.options.zIndex=3):a.options.zIndex=a.defaults.zIndex),void 0!==b.OTransform&&(a.animType="OTransform",a.transformType="-o-transform",a.transitionType="OTransition",void 0===b.perspectiveProperty&&void 0===b.webkitPerspective&&(a.animType=!1)),void 0!==b.MozTransform&&(a.animType="MozTransform",a.transformType="-moz-transform",a.transitionType="MozTransition",void 0===b.perspectiveProperty&&void 0===b.MozPerspective&&(a.animType=!1)),void 0!==b.webkitTransform&&(a.animType="webkitTransform",a.transformType="-webkit-transform",a.transitionType="webkitTransition",void 0===b.perspectiveProperty&&void 0===b.webkitPerspective&&(a.animType=!1)),void 0!==b.msTransform&&(a.animType="msTransform",a.transformType="-ms-transform",a.transitionType="msTransition",void 0===b.msTransform&&(a.animType=!1)),void 0!==b.transform&&a.animType!==!1&&(a.animType="transform",a.transformType="transform",a.transitionType="transition"),a.transformsEnabled=a.options.useTransform&&null!==a.animType&&a.animType!==!1},b.prototype.setSlideClasses=function(a){var c,d,e,f,b=this;d=b.$slider.find(".slick-slide").removeClass("slick-active slick-center slick-current").attr("aria-hidden","true"),b.$slides.eq(a).addClass("slick-current"),b.options.centerMode===!0?(c=Math.floor(b.options.slidesToShow/2),b.options.infinite===!0&&(a>=c&&a<=b.slideCount-1-c?b.$slides.slice(a-c,a+c+1).addClass("slick-active").attr("aria-hidden","false"):(e=b.options.slidesToShow+a,
d.slice(e-c+1,e+c+2).addClass("slick-active").attr("aria-hidden","false")),0===a?d.eq(d.length-1-b.options.slidesToShow).addClass("slick-center"):a===b.slideCount-1&&d.eq(b.options.slidesToShow).addClass("slick-center")),b.$slides.eq(a).addClass("slick-center")):a>=0&&a<=b.slideCount-b.options.slidesToShow?b.$slides.slice(a,a+b.options.slidesToShow).addClass("slick-active").attr("aria-hidden","false"):d.length<=b.options.slidesToShow?d.addClass("slick-active").attr("aria-hidden","false"):(f=b.slideCount%b.options.slidesToShow,e=b.options.infinite===!0?b.options.slidesToShow+a:a,b.options.slidesToShow==b.options.slidesToScroll&&b.slideCount-a<b.options.slidesToShow?d.slice(e-(b.options.slidesToShow-f),e+f).addClass("slick-active").attr("aria-hidden","false"):d.slice(e,e+b.options.slidesToShow).addClass("slick-active").attr("aria-hidden","false")),"ondemand"===b.options.lazyLoad&&b.lazyLoad()},b.prototype.setupInfinite=function(){var c,d,e,b=this;if(b.options.fade===!0&&(b.options.centerMode=!1),b.options.infinite===!0&&b.options.fade===!1&&(d=null,b.slideCount>b.options.slidesToShow)){for(e=b.options.centerMode===!0?b.options.slidesToShow+1:b.options.slidesToShow,c=b.slideCount;c>b.slideCount-e;c-=1)d=c-1,a(b.$slides[d]).clone(!0).attr("id","").attr("data-slick-index",d-b.slideCount).prependTo(b.$slideTrack).addClass("slick-cloned");for(c=0;e>c;c+=1)d=c,a(b.$slides[d]).clone(!0).attr("id","").attr("data-slick-index",d+b.slideCount).appendTo(b.$slideTrack).addClass("slick-cloned");b.$slideTrack.find(".slick-cloned").find("[id]").each(function(){a(this).attr("id","")})}},b.prototype.interrupt=function(a){var b=this;a||b.autoPlay(),b.interrupted=a},b.prototype.selectHandler=function(b){var c=this,d=a(b.target).is(".slick-slide")?a(b.target):a(b.target).parents(".slick-slide"),e=parseInt(d.attr("data-slick-index"));return e||(e=0),c.slideCount<=c.options.slidesToShow?(c.setSlideClasses(e),void c.asNavFor(e)):void c.slideHandler(e)},b.prototype.slideHandler=function(a,b,c){var d,e,f,g,j,h=null,i=this;return b=b||!1,i.animating===!0&&i.options.waitForAnimate===!0||i.options.fade===!0&&i.currentSlide===a||i.slideCount<=i.options.slidesToShow?void 0:(b===!1&&i.asNavFor(a),d=a,h=i.getLeft(d),g=i.getLeft(i.currentSlide),i.currentLeft=null===i.swipeLeft?g:i.swipeLeft,i.options.infinite===!1&&i.options.centerMode===!1&&(0>a||a>i.getDotCount()*i.options.slidesToScroll)?void(i.options.fade===!1&&(d=i.currentSlide,c!==!0?i.animateSlide(g,function(){i.postSlide(d)}):i.postSlide(d))):i.options.infinite===!1&&i.options.centerMode===!0&&(0>a||a>i.slideCount-i.options.slidesToScroll)?void(i.options.fade===!1&&(d=i.currentSlide,c!==!0?i.animateSlide(g,function(){i.postSlide(d)}):i.postSlide(d))):(i.options.autoplay&&clearInterval(i.autoPlayTimer),e=0>d?i.slideCount%i.options.slidesToScroll!==0?i.slideCount-i.slideCount%i.options.slidesToScroll:i.slideCount+d:d>=i.slideCount?i.slideCount%i.options.slidesToScroll!==0?0:d-i.slideCount:d,i.animating=!0,i.$slider.trigger("beforeChange",[i,i.currentSlide,e]),f=i.currentSlide,i.currentSlide=e,i.setSlideClasses(i.currentSlide),i.options.asNavFor&&(j=i.getNavTarget(),j=j.slick("getSlick"),j.slideCount<=j.options.slidesToShow&&j.setSlideClasses(i.currentSlide)),i.updateDots(),i.updateArrows(),i.options.fade===!0?(c!==!0?(i.fadeSlideOut(f),i.fadeSlide(e,function(){i.postSlide(e)})):i.postSlide(e),void i.animateHeight()):void(c!==!0?i.animateSlide(h,function(){i.postSlide(e)}):i.postSlide(e))))},b.prototype.startLoad=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.hide(),a.$nextArrow.hide()),a.options.dots===!0&&a.slideCount>a.options.slidesToShow&&a.$dots.hide(),a.$slider.addClass("slick-loading")},b.prototype.swipeDirection=function(){var a,b,c,d,e=this;return a=e.touchObject.startX-e.touchObject.curX,b=e.touchObject.startY-e.touchObject.curY,c=Math.atan2(b,a),d=Math.round(180*c/Math.PI),0>d&&(d=360-Math.abs(d)),45>=d&&d>=0?e.options.rtl===!1?"left":"right":360>=d&&d>=315?e.options.rtl===!1?"left":"right":d>=135&&225>=d?e.options.rtl===!1?"right":"left":e.options.verticalSwiping===!0?d>=35&&135>=d?"down":"up":"vertical"},b.prototype.swipeEnd=function(a){var c,d,b=this;if(b.dragging=!1,b.interrupted=!1,b.shouldClick=b.touchObject.swipeLength>10?!1:!0,void 0===b.touchObject.curX)return!1;if(b.touchObject.edgeHit===!0&&b.$slider.trigger("edge",[b,b.swipeDirection()]),b.touchObject.swipeLength>=b.touchObject.minSwipe){switch(d=b.swipeDirection()){case"left":case"down":c=b.options.swipeToSlide?b.checkNavigable(b.currentSlide+b.getSlideCount()):b.currentSlide+b.getSlideCount(),b.currentDirection=0;break;case"right":case"up":c=b.options.swipeToSlide?b.checkNavigable(b.currentSlide-b.getSlideCount()):b.currentSlide-b.getSlideCount(),b.currentDirection=1}"vertical"!=d&&(b.slideHandler(c),b.touchObject={},b.$slider.trigger("swipe",[b,d]))}else b.touchObject.startX!==b.touchObject.curX&&(b.slideHandler(b.currentSlide),b.touchObject={})},b.prototype.swipeHandler=function(a){var b=this;if(!(b.options.swipe===!1||"ontouchend"in document&&b.options.swipe===!1||b.options.draggable===!1&&-1!==a.type.indexOf("mouse")))switch(b.touchObject.fingerCount=a.originalEvent&&void 0!==a.originalEvent.touches?a.originalEvent.touches.length:1,b.touchObject.minSwipe=b.listWidth/b.options.touchThreshold,b.options.verticalSwiping===!0&&(b.touchObject.minSwipe=b.listHeight/b.options.touchThreshold),a.data.action){case"start":b.swipeStart(a);break;case"move":b.swipeMove(a);break;case"end":b.swipeEnd(a)}},b.prototype.swipeMove=function(a){var d,e,f,g,h,b=this;return h=void 0!==a.originalEvent?a.originalEvent.touches:null,!b.dragging||h&&1!==h.length?!1:(d=b.getLeft(b.currentSlide),b.touchObject.curX=void 0!==h?h[0].pageX:a.clientX,b.touchObject.curY=void 0!==h?h[0].pageY:a.clientY,b.touchObject.swipeLength=Math.round(Math.sqrt(Math.pow(b.touchObject.curX-b.touchObject.startX,2))),b.options.verticalSwiping===!0&&(b.touchObject.swipeLength=Math.round(Math.sqrt(Math.pow(b.touchObject.curY-b.touchObject.startY,2)))),e=b.swipeDirection(),"vertical"!==e?(void 0!==a.originalEvent&&b.touchObject.swipeLength>4&&a.preventDefault(),g=(b.options.rtl===!1?1:-1)*(b.touchObject.curX>b.touchObject.startX?1:-1),b.options.verticalSwiping===!0&&(g=b.touchObject.curY>b.touchObject.startY?1:-1),f=b.touchObject.swipeLength,b.touchObject.edgeHit=!1,b.options.infinite===!1&&(0===b.currentSlide&&"right"===e||b.currentSlide>=b.getDotCount()&&"left"===e)&&(f=b.touchObject.swipeLength*b.options.edgeFriction,b.touchObject.edgeHit=!0),b.options.vertical===!1?b.swipeLeft=d+f*g:b.swipeLeft=d+f*(b.$list.height()/b.listWidth)*g,b.options.verticalSwiping===!0&&(b.swipeLeft=d+f*g),b.options.fade===!0||b.options.touchMove===!1?!1:b.animating===!0?(b.swipeLeft=null,!1):void b.setCSS(b.swipeLeft)):void 0)},b.prototype.swipeStart=function(a){var c,b=this;return b.interrupted=!0,1!==b.touchObject.fingerCount||b.slideCount<=b.options.slidesToShow?(b.touchObject={},!1):(void 0!==a.originalEvent&&void 0!==a.originalEvent.touches&&(c=a.originalEvent.touches[0]),b.touchObject.startX=b.touchObject.curX=void 0!==c?c.pageX:a.clientX,b.touchObject.startY=b.touchObject.curY=void 0!==c?c.pageY:a.clientY,void(b.dragging=!0))},b.prototype.unfilterSlides=b.prototype.slickUnfilter=function(){var a=this;null!==a.$slidesCache&&(a.unload(),a.$slideTrack.children(this.options.slide).detach(),a.$slidesCache.appendTo(a.$slideTrack),a.reinit())},b.prototype.unload=function(){var b=this;a(".slick-cloned",b.$slider).remove(),b.$dots&&b.$dots.remove(),b.$prevArrow&&b.htmlExpr.test(b.options.prevArrow)&&b.$prevArrow.remove(),b.$nextArrow&&b.htmlExpr.test(b.options.nextArrow)&&b.$nextArrow.remove(),b.$slides.removeClass("slick-slide slick-active slick-visible slick-current").attr("aria-hidden","true").css("width","")},b.prototype.unslick=function(a){var b=this;b.$slider.trigger("unslick",[b,a]),b.destroy()},b.prototype.updateArrows=function(){var b,a=this;b=Math.floor(a.options.slidesToShow/2),a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&!a.options.infinite&&(a.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false"),a.$nextArrow.removeClass("slick-disabled").attr("aria-disabled","false"),0===a.currentSlide?(a.$prevArrow.addClass("slick-disabled").attr("aria-disabled","true"),a.$nextArrow.removeClass("slick-disabled").attr("aria-disabled","false")):a.currentSlide>=a.slideCount-a.options.slidesToShow&&a.options.centerMode===!1?(a.$nextArrow.addClass("slick-disabled").attr("aria-disabled","true"),a.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false")):a.currentSlide>=a.slideCount-1&&a.options.centerMode===!0&&(a.$nextArrow.addClass("slick-disabled").attr("aria-disabled","true"),a.$prevArrow.removeClass("slick-disabled").attr("aria-disabled","false")))},b.prototype.updateDots=function(){var a=this;null!==a.$dots&&(a.$dots.find("li").removeClass("slick-active").attr("aria-hidden","true"),a.$dots.find("li").eq(Math.floor(a.currentSlide/a.options.slidesToScroll)).addClass("slick-active").attr("aria-hidden","false"))},b.prototype.visibility=function(){var a=this;a.options.autoplay&&(document[a.hidden]?a.interrupted=!0:a.interrupted=!1)},a.fn.slick=function(){var f,g,a=this,c=arguments[0],d=Array.prototype.slice.call(arguments,1),e=a.length;for(f=0;e>f;f++)if("object"==typeof c||"undefined"==typeof c?a[f].slick=new b(a[f],c):g=a[f].slick[c].apply(a[f].slick,d),"undefined"!=typeof g)return g;return a}});
(function($) {
    $.fn.carousel = function(option) {
        var $this = $(this);
        var defaultOpt = {
            lazingload: true,
            _drag: null,
            _coordinates: null,
            index: 0,
            width: 375
        };
        var opt = $.extend({}, defaultOpt, option);
        var $scroller = $this.find('.carousel-list');
        var $ul = $this.find('ul');
        var $li = $ul.children('li');
        var prevLink = $('<a href="javascript:void(0)" class="prev"><i class="icon-angle-left"></i></a>');
        var nextLink = $('<a href="javascript:void(0)" class="next"><i class="icon-angle-right"></i></a>');
        var column;
        var wWidth;
        var offsetLeft;
        var orginalScrollLeft;
        var currentScrolLeft;
        var scrollEnd;
        var duration = 200;
        var subduration;
        var _lazingLoadImage = function() {
            var currentItem = $ul.children('li:lt(' + (column + 2) + ')');
            currentItem.find('img').each(function(index, img) {
                if ($(img).is('[data-src]')) {
                    $(img).attr('src', $(img).attr('data-src'));
                    $(img).removeAttr('data-src');
                }
            });
        };
        var _prev = function() {
            currentScrolLeft = 0;
            $scroller.stop().animate({
                scrollLeft: currentScrolLeft + 'px'
            }, duration, function() {
                var $last = $this.find('li:last');
                $ul.prepend($last);
                currentScrolLeft += opt.width;
                $scroller.scrollLeft(currentScrolLeft);
                $scroller.stop().animate({
                    scrollLeft: '-=' + offsetLeft + 'px'
                }, subduration);
                if (opt.lazingload) {
                    _lazingLoadImage();
                }
            });
        };
        var _next = function() {
            currentScrolLeft = scrollEnd;
            $scroller.stop().animate({
                scrollLeft: currentScrolLeft + 'px'
            }, duration, function() {
                var $last = $this.find('li:first');
                $ul.append($last);
                currentScrolLeft -= opt.width;
                $scroller.scrollLeft(currentScrolLeft);
                $scroller.stop().animate({
                    scrollLeft: '+=' + offsetLeft + 'px'
                }, subduration);
                if (opt.lazingload) {
                    _lazingLoadImage();
                }
            });
        };
        var _revert = function() {
            $scroller.stop().animate({
                scrollLeft: orginalScrollLeft + 'px'
            }, duration);
        };
        var _autoScroll = function() {
            currentScrolLeft = $scroller.scrollLeft();
            var offset = orginalScrollLeft - currentScrolLeft;
            if (Math.abs(offset) > 5) {
                if (offset > 0) {
                    _prev();
                } else {
                    _next();
                }
            } else {
                _revert();
            }
        };
        var _getColumnCount = function() {
            return Math.floor(wWidth / opt.width) || 1;
        };
        var _reposition = function() {
            opt.index = 1;
            orginalScrollLeft = opt.width - offsetLeft;
            $scroller.stop().animate({
                scrollLeft: orginalScrollLeft + 'px'
            }, 500);
        };
        var _setWidth = function() {
            $ul.css('width', (column + 2) * opt.width + 'px');
        };

        var _refresh = function() {
            column = _getColumnCount();
            wWidth = $this.width();
            scrollEnd = (column + 2) * 320 - wWidth;
            offsetLeft = (wWidth - opt.width * column) / 2;
            subduration = duration * offsetLeft / opt.width;
            _setWidth();
            _reposition();
        };

        var obj = {
            prev: _prev,
            next: _next,
            refresh: _refresh
        };
        var _inital = function() {
            $li.each(function(index, item) {
                var $item = $(item);
                if (index === 0) {
                    $item.attr('carousel-index', $li.length);
                } else {
                    $item.attr('carousel-index', index);
                }
            });
            prevLink.click(function() {
                obj.prev();
                return false;
            });
            nextLink.click(function() {
                obj.next();
                return false;
            });
            $this.append(prevLink);
            $this.append(nextLink);
            $(document).on('dom.resize', function() {
                _refresh();
            });
            _refresh();
            _lazingLoadImage();
            $scroller.on('scroll', $.debounce(function() {
                _autoScroll();
            }, 100));
            $this.removeClass('loading');
            $this.data('data-carousel', obj);
        };
        setTimeout(function() {
            _inital();
        });
    };
    $(document).on('dom.load', function() {
        $('[data-carousel]').each(function(index, item) {
            var $item = $(item);
            $item.carousel($item);
            $item.removeAttr('data-carousel');
        });
    });
})(jQuery);

//collapse
(function ($) {
    var collapseConfig = {
        name: 'collapse',
        defaultOpt: {
            showtext: null,
            hidetext: null,
            once: false,
            isexpand: false,
            showbefore: null,
            showafter: null,
            hidebefore: null,
            hideafter: null
        },
        init: function (context) {
            var opt = context.opt;
            var $this = context.$element;
            var $target = context.$target = $(opt.target);

            //record the traget's height
            var height = 0;
            if ($target.offset() && $target.offset().top < $this.offset().top) {
                height = $target.height();
            }

            var _showtext = function () {
                if (opt.showtext) {
                    if ($this.find('span').length > 0) {
                        $this.find('span').text(opt.showtext);
                    } else {
                        $this.text(opt.showtext);
                    }
                }
                if (opt.once) {
                    $this.hide();
                }
            };
            var _hidetext = function () {
                if (opt.hidetext) {
                    if ($this.find('span').length > 0) {
                        $this.find('span').text(opt.hidetext);
                    } else {
                        $this.text(opt.hidetext);
                    }
                }
            };
            if (opt.isexpand) {
                context._show = function () {
                    $this.addClass('shown');
                    $target.addClass('collapse-expand');
                    _showtext();
                };
                context._hide = function () {
                    $this.removeClass('shown');
                    $target.removeClass('collapse-expand');
                    if (height && height > 0) {
                        $(document).scrollTop($(document).scrollTop() - $target.prop('scrollHeight') + height);
                    }
                    _hidetext();
                };
            } else {
                context._show = function () {
                    $this.addClass('shown');
                    $target.show();
                    _showtext();
                };
                context._hide = function () {
                    $this.removeClass('shown');
                    $target.hide();
                    if (height && height > 0) {
                        $(document).scrollTop($(document).scrollTop() - height);
                    }
                    _hidetext();
                };
            }
        },
        exports: {
            show: function () {
                var opt = this.opt;
                if (opt.showbefore) {
                    $.CUI.addEvent(opt.showbefore, this);
                }
                this._show();
                if (opt.showafter) {
                    $.CUI.addEvent(opt.showafter, this);
                }
            },
            hide: function () {
                var opt = this.opt;
                if (opt.hidebefore) {
                    $.CUI.addEvent(opt.hidebefore, this);
                }
                this._hide();
                if (opt.hideafter) {
                    $.CUI.addEvent(opt.hideafter, this);
                }
            },
            toggle: function () {
                if (this.$element.hasClass('shown')) {
                    this._hide();
                } else {
                    this._show();
                }
            }
        },
        setOptionsBefore: null,
        setOptionsAfter: null,
        initBefore: null,
        initAfter: function (context) {
            var $this = context.$element;
            var $target = context.$target;
            var opt = context.opt;
            var exports = context.exports;
            var _resetForExpand = function () {
                if (!$this.hasClass('shown')) {
                    if ($target.prop('scrollHeight') > $target.prop('offsetHeight')) {
                        $this.css('visibility', 'visible');
                    } else {
                        $this.css('visibility', 'hidden');
                    }
                }
            };
            if (opt.isexpand) {
                $(document).on('dom.resize.collapse', _resetForExpand);
                _resetForExpand();
            }
            if (!opt.isexpand) {
                if ($target.is(':hidden')) {
                    exports.hide();
                } else {
                    exports.show();
                }
            }
            $this.on('click.collapse', exports.toggle);
        },
        destroyBefore: function (context) {
            var $this = context.$element;
            $this.off('click.collapse');
        }
    };
    $.CUI.plugin(collapseConfig);
    $(document).on('dom.load.collapse', function () {
        $('[data-collapse]').each(function (index, item) {
            var $this = $(item);
            var data = $this.data();
            $this.collapse(data);
            $this.removeAttr('data-collapse');
            $this.attr('data-collapse-load', '');
            $this.attr('role', 'Collapse');
        });
    });
})(jQuery);

(function($) {
    var dataTableConfig = {
        $element: null,
        name: 'datatable',
        defaultOpt: {
            columns: [],
            data: null,
            maxcount: -1,
            nodatatemplate: null,
            hideText: 'See More'
        },
        initBefore: null,
        init: function(context) {
            var opt = context.opt;
            var $this = context.$element;
            var $thead = $('<thead></thead>');
            var $colgroup = $('<colgroup></colgroup>');
            var $tbody = $('<tbody></tbody>');
            var $tfoot = $('<tfoot></tfoot>');
            var $table;
            var _getRawValue = function(value, column) {
                switch (column.type) {
                    case 'date':
                        return +new Date(value) || 0;
                    case 'number':
                        if (value.replace) {
                            value = value.replace(/[^0-9.]/g, '');
                        }
                        return value * 1 || 0;
                    default:
                        return value;
                }
            };
            var _getDisplayText = function(value, column) {
                switch (column.type) {
                    case 'number':
                        if ($.isNumeric(value)) {
                            return column.format ? value.toFixed(column.format * 1) : value;
                        } else {
                            return '';
                        }
                    case 'string':
                        return $.htmlencode(value);
                    case 'date':
                        var time = new Date(value);
                        return time.valueOf() ? time.format(column.format || 'M/D/Y') : '';
                    default:
                        return value;
                }
            };
            var _getRenderHtml = function(template, data) {
                return Mustache.render(template, data);
            };
            var _sort = function(column, isDesc) {
                if (opt.data && opt.data.length) {
                    if (isDesc) {
                        opt.data = opt.data.sort(function(a, b) {
                            return _getRawValue(a[column.key], column) > _getRawValue(b[column.key], column) ? 1 : -1;
                        });
                    } else {
                        opt.data = opt.data.sort(function(a, b) {
                            return _getRawValue(a[column.key], column) < _getRawValue(b[column.key], column) ? 1 : -1;
                        });
                    }
                }
                _initalTbody();
                if (!$tfoot.find('td').is(':hidden')) {
                    _initalTfoot();
                }

            };
            var _initalThead = function() {
                $thead.empty();
                $colgroup.empty();
                if (opt.columns && opt.columns.length) {
                    var $tr = $('<tr></tr>');
                    for (var j = 0; j < opt.columns.length; j++) {
                        var column = opt.columns[j];
                        var display = column.display !== undefined ? column.display : column.key;

                        var $td = $('<th></th>');
                        if (column.sortable) {
                            var $link = $('<a href="javascript:void(0)" class="datatable-sort">' + display + '</a>');
                            $link.data('column', column);
                            $link.on('click', function() {
                                var $this = $(this);
                                var isDesc = $this.hasClass('desc');
                                _sort($this.data('column'), isDesc);
                                $thead.find('.active').removeClass('active');
                                $this.toggleClass('desc').addClass('active');

                            });
                            $td.append($link);
                        } else {
                            $td.html(display);
                        }
                        if (column.width) {
                            $colgroup.append('<col width="' + column.width + '"/>');
                        } else {
                            $colgroup.append('<col/>');
                        }
                        $tr.append($td);
                    }
                    $thead.append($tr);
                }
                return [$colgroup, $thead];
            };
            var _initalTbody = function() {
                $tbody.empty();
                if (opt.data && opt.data.length) {
                    for (var i = 0; i < opt.data.length; i++) {
                        var rowData = opt.data[i];
                        var $tr = $('<tr></tr>');
                        for (var j = 0; j < opt.columns.length; j++) {
                            var column = opt.columns[j];
                            var value = rowData[column.key];
                            if (!column.template) {
                                value = _getDisplayText(value, column);
                            } else {
                                value = _getRenderHtml(column.template, rowData);
                            }
                            $tr.append('<td>' + value + '</td>');
                        }
                        $tbody.append($tr);
                    }
                } else {
                    if (opt.nodatatemplate) {
                        var tmpRow = $('<tr class="no-result"><td colspan="' + opt.columns.length + '">' + opt.nodatatemplate + '</td></tr>');
                        $tbody.append(tmpRow);
                    }
                }
                return $tbody;
            };
            var _initalTfoot = function() {
                $tfoot.empty();
                if (opt.maxcount > 0 && opt.data.length > opt.maxcount) {
                    var $tr = $('<tr></tr>');
                    var $link = $('<td colspan="' + opt.columns.length + '"><a href="javascript:;" class="btn blue" >' + opt.hideText + '</a></td>');
                    $tbody.find('tr').eq(opt.maxcount - 1).nextAll().hide();
                    $link.click(function() {
                        $tbody.find('tr').eq(opt.maxcount - 1).nextAll().show();
                        $(this).hide();
                    });
                    $tr.append($link);
                    $tfoot.append($tr);
                }
                return $tfoot;
            };
            var _initTable = context._initTable = function() {
                //todo send context to the follow method, otherwise the context.opt will not update
                if (opt.data && opt.data.length) {
                    $table = $('<table class="datatable"></table>');
                    $table.append(_initalThead());
                    $table.append(_initalTbody());
                    $this.empty().append($table);
                    $table.append(_initalTfoot());
                }
            };
            _initTable();
        },
        exports: {},
        setOptionsBefore: null,
        setOptionsAfter: function(context) {
            context._initTable();
        },
        destroyBefore: function(context) {
            var $this = context.$element;
            $this.remove();
        },
        initAfter: null
    };
    $.CUI.plugin(dataTableConfig);
    $(document).on('dom.load.datatable', function() {
        $('[data-datatable]').each(function() {
            var $this = $(this);
            var data = $this.data();
            $this.datatable(data);
            $this.removeAttr('data-datatable');
            $this.attr('data-datatable-load', '');
            $this.attr('role', 'Datatable');
        });
    });
})(jQuery);

//base on bs datetimepicker
(function($) {
    var pickerContext = {
        $element: null,
        name: 'picker',
        defaultOpt: {
            picker: null
        },
        initBefore: null,
        init: function(context) {
            var $this = context.$element;
            var type = context.opt.picker;
            var opt = {
                todayBtn: true,
                autoclose: true,
                todayHighlight: true,
                viewSelect: 4,
            };
            switch (type) {
                case 'date':
                    $.extend(opt, {
                        format: 'yyyy-mm-dd',
                        startView: 2,
                        minView: 2,
                        maxView: 4
                    });
                    break;
                case 'time':
                    $.extend(opt, {
                        showMeridian: true,
                        format: 'hh:ii',
                        startView: 1,
                        minView: 0,
                        maxView: 1,
                        keyboardNavigation: false
                    });
                    break;
                default:
                    $.extend(opt, {
                        format: 'yyyy-mm-dd hh:ii',
                    });
                    break;
            }
            $this.datetimepicker(opt);
        },
        exports: {
            original: function() {
                return this.$element.data('datetimepicker');
            }
        },
        isThirdPart: true,
        setOptionsBefore: null,
        setOptionsAfter: null,
        destroyBefore: null,
        initAfter: null,
    };
    $.CUI.plugin(pickerContext);
    $(document).on('focus', '[data-picker]', function() {
        var $this = $(this);
        var opt = $this.data();
        $this.picker(opt);
        $this.removeAttr('data-picker');
        $this.attr('data-picker-load', '');
        $this.attr('role', 'Datepicker');
    });
})(jQuery);

//dialog plugin
(function($) {
    var dialogConfig = {
        name: 'dialog',
        defaultOpt: {
            autoclose: true,
            cache: false,
            theme: 'default',
            id: null,
            trigger: null,
            showbefore: null,
            showafter: null,
            hidebefore: null,
            hideafter: null,
            html: null
        },
        initBefore: null,
        init: function(context) {
            var opt = context.opt;
            opt.id = 'dialog' + new Date();
            var $this = context.$element;
            var $dialog = $('<div class="dialog dialog-' + opt.theme + '" tabIndex="-1"></div>');
            var $dialogCloseButton = $('<a class="dialog-title-close" dialog-close href="javascript:void(0);"><i class="icon-remove"></i></a>');
            var $dialogPanel = $('<div class="dialog-panel"></div>');
            var $dialogBody = $('<div class="dialog-body"></div>');
            var $dialogOverLay = $('<div class="dialog-overlay"></div>');
            var _reposition = context._reposition = function() {
                var height = $dialog.height() - $dialogPanel.outerHeight();
                if (height > 0) {
                    $dialogPanel.css({
                        marginTop: height / 2 + 'px'
                    });
                } else {
                    $dialogPanel.css({
                        marginTop: 5
                    });
                }
            };
            context._show = function() {
                if (opt.showbefore) {
                    if ($.isFunction(opt.showbefore)) {
                        opt.showbefore();
                    } else {
                        $(document).trigger(opt.showbefore, [opt.trigger]);
                    }
                }
                if (!opt.cache || !$dialogBody.html()) {
                    $dialogBody.html($this.html());
                    _addCloseButton();
                }
                $(document).trigger('dom.load');
                $('html').addClass('model-dialog');
                $dialog.show();
                setTimeout(function() {
                    $dialog.addClass('dialog-active');
                    _reposition();
                    if (opt.showafter) {
                        $.CUI.addEvent(opt.showafter, context);
                    }
                }, 50);
            };
            var _hide = context._hide = function() {
                if ($dialog.hasClass('dialog-active')) {
                    if (opt.hidebefore) {
                        if ($.isFunction(opt.hidebefore)) {
                            opt.hidebefore();
                        } else {
                            $(document).trigger(opt.hidebefore, [opt.trigger]);
                        }
                    }
                    $dialog.removeClass('dialog-active');
                    $dialogPanel.css({marginTop: '0'});
                    setTimeout(function() {
                        $dialog.hide();
                        $('html').removeClass('model-dialog');
                        if (opt.hideafter) {
                            if ($.isFunction(opt.hideafter)) {
                                opt.hideafter();
                            } else {
                                $(document).trigger(opt.hideafter, [opt.trigger]);
                            }
                        }
                    }, 500);
                }
            };
            var _addCloseButton = function() {
                if ($dialogBody && $dialogBody.find('.dialog-title') && $dialogBody.find('.dialog-title').length) {
                    $dialogBody.find('.dialog-title').append($dialogCloseButton);
                }
                $dialogBody.on('click', '[dialog-close]', function() {
                    _hide();
                });
            };

            var _init = function() {
                $dialogPanel.append($dialogBody);
                $dialog.append($dialogPanel);
                $dialog.prepend($dialogOverLay);
                $('html').append($dialog);
                if (opt.theme == 'dropdown') {
                    $dialogBody.on('click', 'a', function() {
                        setTimeout(function() {
                            _hide();
                        }, 10);
                    });
                }
                if (opt.autoclose) {
                    $dialogOverLay.click(_hide);
                }
            };
            _init();
        },
        exports: {
            show: function() {
                var opt = this.opt;
                $(document).trigger('dialog.hidden.except', [opt.id]);
                this._show();
            },
            hide: function() {
                this._hide();
            }

        },
        setOptionsBefore: null,
        setOptionsAfter: null,
        destroyBefore: null,
        initAfter: function(context) {
            var opt = context.opt;
            $(document).on('dialog.hidden.except', function(e, id) {
                if (id != opt.id) {
                    context._hide();
                }
            });
            $(document).on('dom.resize', function() {
                context._reposition();
            });
        },
        isThirdPart: false,
    };
    $.CUI.plugin(dialogConfig);
    $(document).on('dom.load.dialog', function() {
        $('[data-dialog]').each(function() {
            var $this = $(this);
            $this.click(function() {
                var $this = $(this);
                var data = $this.data();
                data.trigger = $this;
                var $target = $(data.target);
                $target.dialog(data).show();
                return false;
            });
            $this.removeAttr('data-dialog');
            $this.attr('data-dialog-load', '');
            $this.attr('role', 'Dialog');
        });
    });
})(jQuery);

//validate for form submit
(function ($) {
    var formConfig = {
        name: 'form',
        defaultOpt: null,
        initBefore: null,
        init: null,
        exports: {
            isValid: function () {
                var $this = this.$element;
                var foucsElement = null;
                var isPassed = true;
                $this.find('[data-validate-load]').each(function (index, item) {
                    var isValide = $(item).data('validate').isValid();
                    if (!isValide) {
                        isPassed = false;
                        if (!foucsElement) {
                            foucsElement = $(item);
                        }
                        return false;
                    }
                });
                if (foucsElement) {
                    foucsElement.focus();
                }
                return isPassed;
            },
            getValue: function () {
                var $this = this.$element;
                var obj = {};
                $this.find(':text').each(function (index, item) {
                    var name = $(item).attr('name');
                    if (name) {
                        obj[name] = $(item).val();
                    }
                });
                $this.find(':password').each(function (index, item) {
                    var name = $(item).attr('name');
                    if (name) {
                        obj[name] = $(item).val();
                    }
                });
                $this.find(':hidden').each(function (index, item) {
                    var name = $(item).attr('name');
                    if (name) {
                        obj[name] = $(item).val();
                    }
                });
                $this.find('textarea').each(function (index, item) {
                    var name = $(item).attr('name');
                    if (name) {
                        obj[name] = $(item).val();
                    }
                });
                $this.find('select').each(function (index, item) {
                    var name = $(item).attr('name');
                    if (name) {
                        obj[name] = $(item).val();
                    }
                });
                $this.find('.checkbox').each(function (index, item) {
                    var name;
                    var checkbox;
                    var checkboxList;
                    if ($(item).data('type') == 'single') {
                        checkbox = $(item).find(':checkbox').eq(0);
                        if (checkbox.length) {

                            name = checkbox.attr('name');
                            if (checkbox.is(':checked')) {
                                obj[name] = checkbox.attr('value') ? checkbox.attr('value') : true;
                            } else {
                                obj[name] = checkbox.attr('value') ? '' : false;
                            }
                        }
                    } else {
                        checkboxList = $(item).find(':checkbox:checked');
                        name = checkboxList.attr('name');
                        if (name) {
                            obj[name] = $.map(checkboxList, function (item) {
                                return $(item).val();
                            });
                        }
                    }
                });
                $this.find('.radio').each(function (index, item) {
                    var radioItem = $(item).find(':radio:checked');
                    var name = radioItem.attr('name');
                    if (name) {
                        obj[name] = $(radioItem).val();
                    }
                });
                return obj;
            }
        },
        setOptionsBefore: null,
        setOptionsAfter: null,
        destroyBefore: null,
        initAfter: null,
        isThirdPart: false,
    };
    $.CUI.plugin(formConfig);
    $(document).on('dom.load', function () {
        $('[data-form]').each(function (index, item) {
            var $this = $(item);
            $this.form();
            $this.removeAttr('data-form');
            $this.attr('data-form-load', '');
            $this.attr('role', 'Form');
        });
    });
})(jQuery);

(function($) {
    var gridtableConfig = {
        name: 'gridtable',
        defaultOpt: {
            key: 'thead th',
        },
        initBefore: function() {

        },
        init: function(context) {
            var opt = context.opt;
            var $this = context.$element;
            var $key = $this.find(opt.key);
            var $list = $this.find('tbody tr');
            var inital = function() {
                var classname = 'table-' + +new Date();
                var colIndex = 0;
                var fontsize = $key.css('fontSize').replace(/[a-z]/g, '');
                var keymaxwidth = 0;
                var columns = $key.map(function(index, item) {
                    return {
                        text: $(item).text() || '',
                        colspan: $(item).attr('colspan') * 1 || 1
                    };
                });
                for (var i = 0; i < columns.length; i++) {
                    var column = columns[i];
                    colIndex = colIndex + 1;
                    $list.each(function() {
                        $(this).find('td').eq(i).attr('data-th', column.text);
                    })
                    if (column.colspan > 1) {
                        colIndex = colIndex + column.colspan - 1;
                    }
                    var keywidth = $.getTextWidth(column.text, fontsize);
                    if (keywidth > keymaxwidth) {
                        keymaxwidth = keywidth;
                    }
                }
                $list.addClass('close');
                return classname;
            };
            $list.each(function(index, item) {
                $(item).click(function() {
                    if (!$(this).hasClass('open')) {
                        $list.filter('.open').removeClass('open').addClass('close');
                        $(this).addClass('open').removeClass('close');
                    }
                });
            });

            $this.addClass(inital());
            $this.attr('role', 'grid table');
        },
        exports: {},
        setOptionsBefore: null,
        setOptionsAfter: null,
        destroyBefore: null,
        initAfter: null,
        isThirdPart: false,
    };
    $.CUI.plugin(gridtableConfig);
    $(document).on('dom.load', function() {
        $('[data-gridtable]').each(function(index, item) {
            var data = $(item).data();
            $(item).gridtable(data);
            $(item).removeAttr('data-gridtable');
            $(item).attr('data-gridtable-load', '');
            $(item).attr('role', 'Gridtable');
        });
    });
})(jQuery);

(function () {
    $.fn.gridview = function (option) {
        var defaultOpt = {
            items: [{
                src: 'dist/src/img/ex_1.jpg',
                height: 640,
                width: 400
            }, {
                src: 'dist/src/img/ex_2.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_3.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_4.jpg',
                height: 640,
                width: 400
            }, {
                src: 'dist/src/img/ex_5.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_6.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_7.jpg',
                height: 640,
                width: 400
            }, {
                src: 'dist/src/img/ex_8.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_9.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_1.jpg',
                height: 640,
                width: 400
            }, {
                src: 'dist/src/img/ex_2.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_3.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_4.jpg',
                height: 640,
                width: 400
            }, {
                src: 'dist/src/img/ex_5.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_6.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_7.jpg',
                height: 640,
                width: 400
            }, {
                src: 'dist/src/img/ex_8.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_9.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_1.jpg',
                height: 640,
                width: 400
            }, {
                src: 'dist/src/img/ex_2.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_3.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_4.jpg',
                height: 640,
                width: 400
            }, {
                src: 'dist/src/img/ex_5.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_6.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_7.jpg',
                height: 640,
                width: 400
            }, {
                src: 'dist/src/img/ex_8.jpg',
                height: 250,
                width: 400
            }, {
                src: 'dist/src/img/ex_9.jpg',
                height: 250,
                width: 400
            }],
            target: null,
            container: null,
            template: '<img >',
            breakpoint: [414, 640, 992, 1200],
            colCount: -1
        };
        var opt = $.extend({}, defaultOpt, option);
        var $this = opt.target ? $(opt.target) : $(this);
        var $container = opt.container ? $(opt.container) : $(window);
        var _getpositionInfo = function () {
            return {
                scrollTop: $container.scrollTop(),
                scrollBottom: $container.scrollTop() + Math.min($container.outerHeight(), window.innerHeight),
                offsetTop: $this.offset().top,
                offsetBottom: $this.offset().top + $this.height()
            };
        };
        var positionInfo = _getpositionInfo();
        var _getColumnByBreakPoint = function (newBreakPoint) {
            opt.breakpoint = newBreakPoint || opt.breakpoint;
            var containerWidth = $this.width();
            if (opt.breakpoint && opt.breakpoint.length) {
                return opt.breakpoint.reduce(function (pre, next, index) {
                    if (containerWidth > next) {
                        return pre + 1;
                    } else {
                        return pre;
                    }
                }, 1);
            }
            return 1;
        };
        var _getSmallestColumn = function (array) {
            return array.reduce(function (pre, next) {
                if (pre) {
                    return pre.data('ratio') <= next.data('ratio') ? pre : next;
                } else {
                    return next;
                }
            }, null);
        };
        var _createColumns = function (count) {
            var columns = [];
            var columnswidth = (100 / count) + '%';
            while (count > 0) {
                var $ul = $('<ul class="gridview-ul"></ul>').css({
                    width: columnswidth
                });
                $ul.data('ratio', 0);
                columns.push($ul);
                count--;
            }
            return columns;
        };
        var _createItemInColumns = function (item) {
            var $tmp = $('<li class="gridview-li">' + opt.template + '</li>');
            var ratio = item.height / item.width;
            $tmp.data({
                ratio: ratio,
                src: item.src
            });
            $tmp.css({
                paddingTop: (ratio * 100) + '%',
            });
            return $tmp;
        };
        var _loadImage = function () {
            $this.find('li').each(function (index, item) {
                var $item = $(item);
                var offsetTop = $item.offset().top;
                var offsetBottom = offsetTop + $item.outerHeight();
                if (offsetTop < positionInfo.scrollBottom && offsetBottom > positionInfo.scrollTop) {
                    var src = $item.data('src');
                    var $img = $item.find('img');
                    $item.addClass('gridview-loading');
                    $img.on('load', function () {
                        $item.removeClass('gridview-loading');
                        $item.addClass('gridview-loaded');
                    });
                    $img.on('error', function () {
                        $item.removeClass('gridview-loading');
                        $item.addClass('gridview-error');
                    });
                    $img.attr('src', src);
                }
            });
        };
        var _moveByScroll = function (isScrollDown) {
            var verticalBottom = $this.hasClass('verticalBottom');
            var heightList = $this.find('> ul').map(function (index, item) {
                return $(item).outerHeight();
            });
            var needMove = false;
            var minHeight = $this.height() - Math.min.apply(this, heightList);
            if (isScrollDown) {
                minHeight = !verticalBottom ? minHeight : 0;
                if (positionInfo.scrollTop > (positionInfo.offsetTop + minHeight) && positionInfo.scrollBottom < positionInfo.offsetBottom) {
                    needMove = true;
                }
            } else {
                minHeight = verticalBottom ? minHeight : 0;
                if (positionInfo.scrollTop > positionInfo.offsetTop && positionInfo.scrollBottom < (positionInfo.offsetBottom - minHeight)) {
                    needMove = true;
                }
            }
            if (needMove) {
                if (isScrollDown) {
                    $this.removeClass('scrollUP');
                    var containerHeight = $this.height();
                    $this.find('.gridview-ul').each(function (index, item) {
                        var $item = $(item);
                        var offsetY = containerHeight - $item.height();
                        $item.css('transform', ('translateY(' + offsetY + 'px)'));
                    });
                    $this.addClass('verticalBottom');
                } else {
                    $this.addClass('scrollUP');
                    $this.find('.gridview-ul').each(function (index, item) {
                        var $item = $(item);
                        $item.css('transform', ('translateY(' + 0 + ')'));
                    });
                    $this.removeClass('verticalBottom');
                }
            }

        };

        var _render = function () {
            var ulList = _createColumns(opt.colCount);
            $.each(opt.items, function (index, item) {
                var $li = _createItemInColumns(item);
                var $ul = _getSmallestColumn(ulList);
                $ul.append($li);
                var newRatio = $ul.data('ratio') + $li.data('ratio');
                $ul.data('ratio', newRatio);
            });
            $this.addClass('gridview');
            $this.empty();
            $.each(ulList, function (index, ul) {
                $this.append(ul);
            });
            _loadImage();
            $(document).trigger('dom.load');
        };
        var _reload = function (force) {
            if (force) {
                opt.colCount = -1;
            }
            if (opt.items && opt.items.length) {
                var newColCount = _getColumnByBreakPoint();
                if (opt.colCount !== newColCount) {
                    opt.colCount = newColCount;
                    _render();
                }
            }
        };
        _reload(true);
        var obj = {
            reload: _reload
        };
        $container.on('scroll', $.throttle(function () {
            var currentPositionInfo = _getpositionInfo();
            var isDown = positionInfo.scrollTop < currentPositionInfo.scrollTop;
            positionInfo = currentPositionInfo;
            _moveByScroll(isDown);
            _loadImage();
        }));
        $(document).on('dom.resize', function () {
            positionInfo = _getpositionInfo();
            _reload();
        });
        $this.data('gridview', obj);
    };
    $(document).on('dom.load', function () {
        $('[data-gridview]').each(function (index, item) {
            var $item = $(item);
            $item.removeAttr('data-gridview');
            $item.gridview($item.data());
            $item.attr('data-gridview-load');
            $item.attr('role', 'gridview');
        });
    });
})(jQuery);

//favorite
(function ($) {
    $.fn.header = function (options) {
        var defaultOpt = {
            button: '.header-form-btn',
            menu: '.header-menu-list'
        };
        var opt = $.extend(defaultOpt, options);
        var $this = $(this);
        var $button = $this.find(opt.button);
        var $menu = $this.find(opt.menu);
        var $overlay = $('<div class="header-overlay"></div>');
        var _show = function () {
            $button.addClass('shown');
            $overlay.show();
            $menu.addClass('active');
            $('body,html').css('overflowY', 'hidden');
        };
        var _hide = function () {
            $('body,html').css('overflowY', 'auto');
            $button.removeClass('shown');
            $menu.removeClass('active');
            $overlay.hide();
        };
        $this.prepend($overlay);
        $button.on('click', function () {
            if ($menu.hasClass('active')) {
                _hide();
            } else {
                _show();
            }
        });
        $overlay.on('click', _hide);
        $this.data('header', {
            show: _show,
            hide: _hide
        });
        $(document).on('dom.resize', function () {
            if ($menu.hasClass('active')) {
                _hide();
            }
        });
    };
    $(document).on('dom.load', function () {
        $('[data-header]').each(function () {
            $(this).header({
                button: $(this).attr('data-button'),
                menu: $(this).attr('data-menu')
            });
            $(this).removeAttr('data-header');
        });
    });


})(jQuery);

(function ($) {
    var inputformatConfig = {
        name: 'inputformat',
        defaultOpt: {
            type: 'phone',
        },
        initBefore: null,
        init: function (context) {
            var $this = context.$element;
            var opt = context.opt;
            var timer = null;
            var _get = function () {
                var value = $this.val();
                switch (opt.type) {
                    case 'phone':
                        return value.replace(/[^0-9]/g, '');
                    case 'price':
                        return value.replace(/[^0-9.]/g, '');
                    default:
                        return value;
                }
            };
            var _set = function () {
                var value = _get();
                var formatString = '';
                switch (opt.type) {
                    case 'phone':
                        if (value.length >= 4) {
                            formatString += value.slice(0, 3) + '-';
                            if (value.length >= 7) {
                                formatString += value.slice(3, 6) + '-';
                                formatString += value.slice(6, Math.min(value.length, 11));
                            } else {
                                formatString += value.slice(3, value.length);
                            }
                        } else {
                            formatString += value;
                        }
                        break;
                    case 'price':
                        var arrPrice = value.toString().split('.');
                        formatString = arrPrice[0];
                        var pricePattern = /(\d+)(\d{3})/;
                        while (pricePattern.test(formatString))
                            formatString = formatString.replace(pricePattern, '$1,$2');
                        if (arrPrice.length >= 2) {
                            formatString += ('.' + arrPrice[1]);
                            value = arrPrice[0] + '.' + arrPrice[1];
                        }
                        break;
                    default:
                        formatString = value;
                        break;
                }
                $this.val(formatString);
                $this.prop('rawValue', value);
                return formatString;
            };

            _set();
            $this.on('input', function (e, a, b) {
                var $this = $(this);
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(function () {
                    if ($this.prop('rawValue') !== _get()) {
                        var value = _set();
                        $this.trigger('formatinput', [value]);
                    }
                }, 10);
            });
        },
        exports: {},
        setOptionsBefore: null,
        setOptionsAfter: null,
        destroyBefore: null,
        initAfter: null,
        isThirdPart: false,
    };
    $.CUI.plugin(inputformatConfig);
    $(document).on('dom.load.inputformat', function () {
        $('[data-inputformat]').each(function (index, item) {
            var $this = $(item);
            $this.inputformat($this.data());
            $this.removeAttr('data-inputformat');
            $this.removeAttr('data-inputformat-load', '');
        });

    });
})(jQuery);

(function($) {
    $.fn.facebooklink = function() {
        var $this = $(this);
        var namespace = {
            go: function() {
                var keyword = $this.data('keyword');
                var url = encodeURIComponent(location.href);
                if (keyword)
                    url = url + '&t=' + encodeURIComponent(keyword);
                window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, 'facebook-share-dialog', 'sharer', 'toolbar=0,status=0,width=626,height=436');
            }
        };
        $this.click(namespace.go);
        $this.data('facebooklink', namespace);
        $this.attr('role', 'Facebooklink');
        return namespace;
    };
    $.fn.googlepluslink = function() {
        var $this = $(this);
        var namespace = {
            go: function() {
                window.open('https://plus.google.com/share?url=' + encodeURIComponent(location.href), 'googlesharer', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');
            }
        };
        $this.data('googlepluslink', namespace);
        $this.attr('role', 'Googlepluslink');
        return namespace;
    };
    $.fn.twitterlink = function() {
        var $this = $(this);
        var namespace = {
            go: function() {
                window.open('http://twitter.com/share?text=Check out this house I found on @MovotoRealEstate&url=' + encodeURIComponent(location.href));
            }
        };
        $this.click(namespace.go);
        $this.data('twitterlink', namespace);
        $this.attr('role', 'Twitterlink');
        return namespace;
    };
    $.fn.phonecall = function() {
        var $this = $(this);
        var number = $this.data('phonecall');
        var namespace = {
            go: function() {
                window.location.href = 'tel:1' + number;
            }
        };
        $this.click(namespace.go);
        $this.data('phonecall', namespace);
        $this.attr('role', 'Phonecall');
        return namespace;
    };
    $.fn.mailto = function() {
        var $this = $(this);
        var mail = $this.data('mailto');
        var params = $this.data('params');
        var namespace = {
            go: function() {
                var link = 'mailto:' + mail;
                if (params) {
                    link = link + '?' + params;
                }
                window.location.href = link;
            }
        };
        $this.click(namespace.go);
        $this.data('mailto', namespace);
        $this.attr('role', 'Mailto');
        return namespace;
    };
    $.fn.msgto = function() {
        var $this = $(this);
        var text = $this.data('msgto');
        var smsChar = (browser && browser.versions && browser.versions.ios) ? '&' : '?';
        var namespace = {
            go: function() {
                window.location.href = 'sms:' + smsChar + 'body=' + text;
            }
        };
        $this.click(namespace.go);
        $this.data('msgto', namespace);
        $this.attr('role', 'Msgto');
        return namespace;
    };
    $(document).on('click', '[data-link]', function() {
        var $this = $(this);
        var type = $this.attr('data-link');
        var target = $this.attr('data-target');
        switch (type) {
            case 'facebook':
                $this.facebooklink().go();
                break;
            case 'googleplus':
                $this.googlepluslink().go();
                break;
            case 'twitter':
                $this.twitterlink().go();
                break;
            case 'phonecall':
                $this.phonecall().go();
                break;
            case 'mailto':
                $this.mailto().go();
                break;
            case 'msgto':
                $this.msgto().go();
                break;
            case 'focuson':
                var timer = setTimeout(function() {
                    $(target).focus();
                }, 100);
                $this.on('click', function() {
                    if (timer) {
                        clearTimeout(timer);
                    }
                    timer = setTimeout(function() {
                        $(target).focus();
                    }, 100);
                });
                break;
            case 'utm':
                $this.utmlink().go();
                return false;
            default:
                $.sendRequest($this.attr('href'), {
                    type: 'redirect'
                });
                break;
        }
        $this.removeAttr('data-link');
    });
})(jQuery);
//lazy load image

(function ($) {
    var loadimageConfig = {
        name: 'loadimage',
        defaultOpt: {
            buffer: 0,
            container: null
        },
        init: function (context) {
            var opt = context.opt;
            var $this = context.$element;
            var $container = context.$container = opt.container ? $(opt.container) : $(window);
            var height = $container.height();
            var top = $this.scrollTop() - height * opt.buffer;
            var bottom = top + height * (1 + opt.buffer);
            context._load = function () {
                var height = $container.outerHeight();
                var top = $container.scrollTop() - height * opt.buffer;
                var bottom = top + height * (1 + opt.buffer);
                $this.find('[data-img]').each(function (index, item) {
                    var $img = $(item);
                    var base = $img.offset().top;
                    if (base < bottom && (base + $img.height()) > top) {
                        var imgsrc = $img.data('img');
                        if ($img.is('img')) {
                            $img.one('load', function () {
                                $img.addClass('data-img-load-success');
                                $(document).trigger('img.load.success', [$img]);
                            });
                            $img.one('error', function () {
                                $img.attr('src', 'data:image/gif;base64,R0lGODlhAQABAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAABAAEAAAICVAEAOw==');
                                $img.addClass('data-img-load-error');
                                $(document).trigger('img.load.error', [$img]);
                            });
                            imgsrc && $img.attr('src', imgsrc);
                            $img.removeAttr('data-img');
                            $img.attr('data-img-load', '');
                            $img.addClass('img-loading');
                        }
                    }
                });
            };
            $container.on('scroll', $.debounce(context._load, 100));
            $container.on('dom.scroll', context._load);
            $(document).on('dom.load', $.throttle(context._load), 200);
        },
        exports: {
            load: function () {
                this._load();
            }
        },
        setOptionsBefore: null,
        setOptionsAfter: null,
        initBefore: null,
        initAfter: function (context) {
            var $this = context.$element;
            var $container = context.$container;
            var opt = context.opt;
            var exports = context.exports;
        },
        destroyBefore: function (context) {
            var $this = context.$element;
        }
    };
    $.CUI.plugin(loadimageConfig);
    $(document).on('dom.load.loadimage', function () {
        $('[data-loadimage]').each(function (index, item) {
            var $this = $(item);
            var data = $this.data();
            $this.loadimage(data).load();
            $this.removeAttr('data-loadimage');
            $this.attr('data-loadimage-load', '');
            $this.attr('role', 'loadimage');
        });
    });
})(jQuery);
//show loading (lock page & unlock page)
(function($) {
    // isShow flag for loading
    var isShow = false;
    $.extend({
        showLoading: function() {
            if (!isShow) {
                $('.loading-bg').stop().fadeIn(100);
                $('.loading-img').stop().show();
                isShow = true;
            }
        },
        hideLoading: function() {
            if (isShow) {
                $('.loading-bg').stop().fadeOut(100);
                $('.loading-img').stop().hide();
                isShow = false;
            }
        },
        showScreenLoading: function() {
            var $screenLoading = $('.screenLoading');
            if ($screenLoading.length === 0) {
                $('body').append($('<div class="screenLoading"></div>'));
            }
            $screenLoading.stop().fadeIn(500);
        },
        hideScreenLoading: function() {
            $('.screenLoading').stop().fadeOut(500);
        }
    });


    //var loading = $('mask div').loading();
    //loading.show();
    //loading.hide();
    // make sure the mask div do not have after styles

    $.fn.extend({
        'loading': function() {
            var $this = $(this);
            $this.css('position', 'relative');
            var cname = $this.attr('class');

            return {
                show: function() {
                    $this.attr('class', cname + ' loading');
                },
                hide: function() {
                    $this.attr('class', cname);
                }
            };
        }
    });

    $.extend({
        'loading': {
            showspinner: function(item) {
                $(item).addClass('loading spinner').css('position', 'relative');
            },
            show: function(item) {
                $(item).addClass('loading').css('position', 'relative');
            },
            hide: function(item) {
                $(item).removeClass('loading spinner');
            }
        }
    });

})(jQuery);
(function($) {
    $.fn.measurement = function(option) {
        var defaultOption = {
            data: [
                {marker: '<div class="pin">A</div>', value: 100,}, {
                    marker: '<div class="pin">B</div>',
                    value: 500,
                },
                {marker: '<div class="pin">C</div>', value: 450,}
            ],
            min: null,
            max: null,
            onclick: null
        };
        var opt = $.extend({}, defaultOption, option);
        var $this = $(this);
        var _render = function() {
            var $container = $('<div class="measurement"><div class="measurement-line"></div></div></div>');
            $.each(opt.data, function(index, item) {
                if (opt.min > item.value) {
                    opt.min = item.value;
                }
                if (opt.max < item.value) {
                    opt.max = item.value;
                }
            });
            var total = opt.max - opt.min;
            $.each(opt.data, function(index, item) {
                var position = (item.value - opt.min ) / total * 100;
                var $item = $('<div class="measurement-item">' + item.marker + '</div>');
                $item.css({left: position + '%'});
                $container.append($item);
            });
            var $min = $('<div class="measurement-min">' + opt.min + '</div>');
            $container.append($min);
            var $max = $('<div class="measurement-max">' + opt.max + '</div>');
            $container.append($max);
            return $container;
        };
        $this.append(_render());
    };
    $(document).on('dom.load.measurement', function() {
        $('[data-measurement]').each(function(index, item) {
            $(item).measurement($(item).data());
            $(item).removeAttr('data-measurement');
        });
    });
})(jQuery);
//menu
(function($) {
    $.fn.menu = function(option) {
        var defaultOption = {
            type: 'appear'
        };
        var opt = $.extend(
            defaultOption, option
        );
        var $this = $(this);
        var $list = $this.find('ul');
        var $link = $this.find('>a');
        var show = function() {
            $(document).trigger('mouseup.menu');
            $link.addClass('active');
            $list.addClass('active');
            $list.show();
            $(document).off('mouseup.menu').one('mouseup.menu', function() {
                hide();
            });
        };
        var hide = function() {
            $link.removeClass('active');
            $list.removeClass('active');
            $list.hide();
        };
        var expand = function() {
            $(document).trigger('mouseup.menu');
            $link.addClass('active');
            $list.addClass('active');
            $list.css({
                height: $list.prop('scrollHeight')
            });
            $(document).off('mouseup.menu').one('mouseup.menu', function() {
                close();
            });
        };
        var close = function() {
            $link.removeClass('active');
            $list.removeClass('active');
            $list.css({
                height: 0
            });
        };


        var menu = {
            toggle: function() {
                if ($list.is(':hidden') || $list.prop('offsetHeight') === 0) {
                    if (opt.type == 'expand') {
                        expand();
                    } else {
                        show();
                    }
                } else {
                    if (opt.type == 'expand') {
                        close();
                    } else {
                        hide();
                    }
                }
            }
        };

        $link.mouseup(function() {
            return false;
        });
        $list.mouseup(function() {
            return false;
        });

        //todo posision
        if (opt.type == 'expand') {
            close();
        } else {
            hide();
        }
        $link.click(menu.toggle);
        $this.data('menu', menu);
        $this.attr('role', 'Menu');
        return menu;
    };
    $(document).on('dom.load', function() {
        $('[data-menu]').each(function(index, item) {
            $(item).menu({
                type: $(item).attr('data-menu')
            });
            $(item).removeAttr('data-menu');
        });
    });
})(jQuery);

//pin
(function ($) {
    $.fn.pin = function (option) {
        var defaultOpt = {
            top: 50,
            bottom: 0,
            target: ''
        };
        var opt = $.extend({}, defaultOpt, option);

        var $this = $(this);
        var $target = $(opt.target);
        $this.css('position', 'relative');
        $target.addClass('pin');

        var offsetTop = 0;
        var offsetBottom = 0;
        var reposition = function () {
            offsetTop = $this.offset().top - opt.top;
            offsetBottom = offsetTop + $this.height() - $target.height() - opt.bottom;
        };
        var pin = function () {
            $target.css({
                position: 'fixed',
                'top': opt.top,
                bottom: 'auto'
            });
        };
        var unpin = function (isTop) {
            if (isTop) {
                $target.css({
                    position: 'absolute',
                    top: 0,
                    bottom: 'auto'
                });
            } else {
                $target.css({
                    position: 'absolute',
                    top: 'auto',
                    bottom: 0
                });
            }
        };
        var setpin = function (scrollTop, isReposition) {
            if (isReposition) {
                reposition();
            }
            if (scrollTop < offsetTop) {
                unpin(true);
            } else {
                if (scrollTop > offsetBottom) {
                    unpin(false);
                } else {
                    pin();
                }
            }
        };
        $this.data('pin', {
            pin: pin,
            unpin: unpin,
            setpin: setpin
        });
        $target.attr('role', 'PinPanel');
        return $this.data('pin');
    };


    function initial(isReposition) {
        var scrollTop = $(window).scrollTop();

        $('[data-pin]').each(function () {
            if ($(this).data('pin') && $(this).data('pin').setpin) {
                $(this).data('pin').setpin(scrollTop, isReposition);
            } else {
                $(this).pin({
                    top: $(this).attr('data-top'),
                    bottom: $(this).attr('data-bottom'),
                    target: $(this).attr('data-target')
                }).setpin(scrollTop, true);
            }
        });
    }

    $(window).on('scroll', function () {
        initial(false);
    });
    $(window).on('dom.resize', function () {
        initial(true);
    });

})(jQuery);

//seed code for create a plugin
//replace all of the "ranger" with the plugin name. (the plugin name should be same as the js file name);

(function($) {
    var rangerConfig = {
        name: 'ranger',
        defaultOpt: {
            max: 100,
            min: 0,
            step: 0,
            onChange: null,
            onUpdate: null,
            decimals: 0,
            connect: null,
            orientation: 'horizontal',
            start: null,
            range: null,
            afterupdate: null,
            afterchange: null,
        },
        init: function(context) {
            var opt = context.opt;
            var $this = context.$element;
            var $input = $this.find('input');
            var $target = context.$target = (opt.target ? $(opt.target) : null);
            if (!opt.connect) {
                opt.connect = [true];
                $input.each(function(index) {
                    opt.connect.push((index % 2 === 1));
                });
            }
            if (!opt.start) {
                opt.start = [];
                $input.each(function() {
                    opt.start.push($(this).val());
                });
            }
            var $ele = $('<div></div>');
            ($target || $this).append($ele);
            noUiSlider.create($ele[0], {
                start: opt.start,
                step: opt.step,
                connect: opt.connect,
                orientation: opt.orientation,
                range: opt.range || {
                    'min': opt.min,
                    'max': opt.max
                },
                format: {
                    'to': function(value) {
                        return value !== undefined && value.toFixed(opt.decimals);
                    }, 'from': function(value) {
                        return value;
                    }
                }
            });
            context.range = $ele[0].noUiSlider;
            context._get = function() {
                return this.range.get();
            };
            context._set = function(values) {
                this.range.set(values);
                var result = this.range.get();
                if ($.isNumeric(result)) {
                    result = [result];
                }
                $input.each(function(index) {
                    $(this).val(result[index]).trigger('input');
                });
                return result;
            };
            $input.on('change', function() {
                var values = [];
                $input.each(function() {
                    values.push($(this).val());
                })
                context._set(values);
            });

            if (opt.onUpdate) {
                context.range.on('update', function(e, t) {
                    if (opt.afterupdate) {
                        $.CUI.addEvent(opt.afterupdate, this, e, t);
                    }
                });
            }
            context.range.on('change', function(e, t) {
                $input.each(function(index) {
                    $(this).val(e[index]).trigger('input');
                });
                if (opt.afterchange) {
                    $.CUI.addEvent(opt.afterchange, this, e, t);
                }
            });
        },
        exports: {
            get: this._get,
            set: this._set,
            range: this.range
        },
    };
    $.CUI.plugin(rangerConfig);
    $(document).on('dom.load.ranger', function() {
        $('[data-ranger]').each(function(index, item) {
            var $this = $(item);
            var data = $this.data();
            $this.ranger(data);
            $this.removeAttr('data-ranger');
            $this.attr('data-ranger-load', '');
            $this.attr('role', 'ranger');
        });
    });
})(jQuery);
(function($) {
    $.scrollTo = function($target, $scroll, offsettop, time) {
        if (offsettop && offsettop.indexOf('#') >= 0) {
            offsettop = $(offsettop).height() + $('#header').height();
        } else {
            offsettop = (offsettop !== undefined) ? offsettop : $('#header').height();
        }
        $scroll = $('body, html');
        $scroll.animate({
            scrollTop: $target.offset().top - offsettop - 10
        }, time >= 0 ? time : 200);
    };
    $.fn.scrollTo = function(option) {
        var $this = $(this);
        var defaultOption = {
            target: $this,
            onscroll: null
        };
        var opt = $.extend({}, defaultOption, option);

        if ($this.is('select')) {
            $this.change(function() {
                var $item = $('option:selected', $this);
                if (opt.onscroll) {
                    if ($.isFunction(opt.onscroll)) {
                        opt.onscroll($this);
                    } else {
                        $(document).trigger(opt.onscroll, [$this]);
                    }
                }

                $.scrollTo($($item.data('target')), opt.onscroll, opt.offsettop);
            });
        } else {
            $this.click(function() {
                if (opt.onscroll) {
                    if ($.isFunction(opt.onscroll)) {
                        opt.onscroll($this);
                    } else {
                        $(document).trigger(opt.onscroll, [$this]);
                    }
                }
                $.scrollTo(opt.target, opt.onscroll, opt.offsettop);
            });
        }
        $this.attr('role', 'ScrollTo');
    };

    $(document).on('dom.load.scrollTo', function() {
        if ($('[data-scrollspy]').length > 0) {
            $(document).on('dom.scroll.scrollSpy', function(e, t, isDown, initTop) {
                $('[data-scrollspy]').each(function() {
                    var offset = $($(this).attr('data-offsettop'));
                    var target = $($(this).data('target'));
                    var top = offset ? (initTop + offset.height()) : initTop;
                    top += 50;
                    var targetTop = target.offset().top;
                    var targetBottom = target.offset().top + target.height();
                    if (targetTop <= top && targetBottom > top) {
                        $(document).trigger($(this).data('onscroll'), [$(this)]);
                        return false;
                    }
                });

            });
        }

        $('[data-scrollTo]').each(function() {
            $(this).scrollTo({
                target: $($(this).data('target')),
                scroll: $(this).data('scroll'),
                offsettop: $(this).data('offsettop'),
                onscroll: $(this).data('onscroll'),
                scrollSpy: $(this).data('scrollspy')
            });
            $(this).removeAttr('data-scrollTo');
        });
    });
})(jQuery);

(function($) {
    $.fn.shifter = function(options) {
        var defaultOpt = {
            duration: 300,
            height: 300,
            width: 425,
            clickable: true,
            lazingload: true,
            autoscroll: 0,
            onchange: null,
            onbefore: null,
            onafter: null,
            index: 1,
        };
        var $this = $(this);
        var obj;
        var sign_isAuto = false;
        var lastScrollLeft = 0;
        var opt = $.extend({}, defaultOpt, options);
        var timer = null;
        var $list;
        var $wrap;
        var $items;
        var innerW = 0;
        var maxOffsetX = 0;
        var prevLink = $('<a href="javascript:;" class="prev"><i class="icon-angle-left"></i></a>');
        var nextLink = $('<a href="javascript:;" class="next"><i class="icon-angle-right"></i></a>');
        var ratio = opt.height / opt.width;

        var _getImageSize = function() {
            var maxHeight = $(window).height() - 100;
            var screenheight = opt.height > maxHeight ? maxHeight : opt.height;
            var screenwidth = $this.width() || $(window).width();
            var tmpWidth = screenwidth > opt.width ? opt.width : screenwidth - 2;
            var tmpHeight = tmpWidth * ratio;
            tmpHeight = screenheight > tmpHeight ? tmpHeight : screenheight;
            return {
                width: tmpWidth,
                height: tmpHeight
            };
        };
        var _resize = function() {
            innerW = 0;
            var perIndex = opt.index;
            var sizeInfo = _getImageSize();
            $this.css('height', sizeInfo.height);
            $wrap.css('height', sizeInfo.height + 21);
            $items.each(function(i, item) {
                $(item).css({
                    width: sizeInfo.width,
                    height: sizeInfo.height
                });
                $(item).children().css({
                    width: sizeInfo.width,
                    height: sizeInfo.height,
                });
                innerW += $(item).outerWidth();
            });
            $list.width(innerW);
            _shift(perIndex, true);
        };
        var _markActive = function() {
            var list = [];
            var maxwidth = $wrap.outerWidth();
            $items.each(function(index, item) {
                var $item = $(item);
                $item.removeClass('active');
                var left = $item.position().left;
                var right = left + $item.outerWidth();
                if (left >= 0 && left <= maxwidth || right >= 0 && right <= maxwidth) {
                    if (opt.lazingload) {
                        $item.find('img').each(function(index, img) {
                            if ($(img).data('src')) {
                                $(img).attr('src', $(img).data('src'));
                                $(img).data('src', null);
                            }
                        });
                    }
                    list.push({
                        isFull: left >= 0 && right <= maxwidth,
                        element: $item
                    });
                }
            });
            if (list.length > 2) {
                for (var i = 0; i < list.length; i++) {
                    if (list[i].isFull) {
                        list[i].element.addClass('active');
                    }
                }
            } else if (list.length == 1) {
                list[0].element.addClass('active');
            } else if (list.length == 2) {
                var width1 = list[0].element.outerWidth() + list[0].element.position().left;
                var width2 = maxwidth - width1;
                if (width1 > width2) {
                    list[0].element.addClass('active');
                } else {
                    list[1].element.addClass('active');
                }
            }
            if (opt.onchange && lastScrollLeft !== $wrap.scrollLeft()) {
                var isNext = lastScrollLeft < $wrap.scrollLeft();
                if ($.isFunction(opt.onchange)) {
                    opt.onchange($list.find('.active'), sign_isAuto, isNext);
                } else {
                    $(document).trigger(opt.onchange, [$list.find('.active'), sign_isAuto, isNext]);
                }
                lastScrollLeft = $wrap.scrollLeft();
                sign_isAuto = false;
            }
            opt.index = $list.find('.active').attr('shift-index');
        };
        var _scroll = function() {
            _markActive();
            maxOffsetX = $wrap.prop('scrollWidth') - $wrap.width();
            if ($wrap.scrollLeft() <= 0) {
                prevLink.addClass('disable');
                nextLink.removeClass('disable');
            } else if (($wrap.scrollLeft() - maxOffsetX) <= 3 && ($wrap.scrollLeft() - maxOffsetX) >= -3) {
                prevLink.removeClass('disable');
                nextLink.addClass('disable');
            } else {
                prevLink.removeClass('disable');
                nextLink.removeClass('disable');
            }
        };
        var _shift = function(index, disableAnimation) {
            var left;
            var ismove = false;
            var timer = disableAnimation ? 0 : opt.duration;
            if ($.isInt(index)) {
                var item = $items.eq(index - 1);
                var offset = ($wrap.outerWidth() - item.outerWidth()) / 2;
                left = $wrap.scrollLeft() + $(item).position().left - offset;
                $wrap.stop().animate({
                    'scrollLeft': left
                }, timer);
                return index;
            } else {
                var begin = $wrap.scrollLeft();
                var end = $wrap.outerWidth();
                var width;
                if (index) {
                    $items.each(function(j, item) {
                        left = $(item).position().left;
                        width = $(item).outerWidth();
                        if (left > 0 && left < end && (left + width) > end) {
                            ismove = true;
                            $wrap.stop().animate({
                                'scrollLeft': begin + $(item).position().left
                            }, timer);
                            return false;
                        }
                    });
                    return ismove;
                } else {
                    $items.each(function(j, item) {
                        left = $(item).position().left;
                        width = $(item).outerWidth();
                        if (left <= 0 && (left + width) > 0) {
                            $wrap.stop().animate({
                                'scrollLeft': begin - end + ($(item).width() + $(item).position().left)
                            }, timer);
                            return true;
                        }
                    });
                    return ismove;
                }
            }
        };
        var _prev = function() {
            return _shift(false);
        };
        var _next = function() {
            return _shift(true);
        };
        var _go = function(index) {
            return _shift(index);
        };
        var _option = function(option) {
            opt = $.extend(opt, option);
            return opt;
        };
        var _init = function() {
            obj = {
                prev: function() {
                    return _prev();
                },
                next: function() {
                    return _next();
                },
                go: function(index) {
                    return _go(index);
                },
                option: _option
            };
            if (opt.onbefore) {
                if ($.isFunction(opt.onbefore)) {
                    opt.onbefore($this);
                } else {
                    $(document).trigger(opt.onbefore, [$this]);
                }
            }
            $list = $this.find('ul');
            $list.wrap('<div class="wrap"></div>');
            $wrap = $this.find('.wrap');
            $items = $list.find('li');
            $items.each(function(index, item) {
                $(item).attr('shift-index', index + 1);
                if (opt.clickable) {
                    var i = index + 2;
                    $(item).click(function() {
                        obj.go(i);
                    });
                }
                if (opt.lazingload) {
                    var img = $(item).find('img[src]');
                    img.data('src', img.attr('src'));
                    img.attr('src', 'data:image/gif;base64,R0lGODlhAQABAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAABAAEAAAICVAEAOw==');
                    $(item).addClass('img-loading');
                    img.on('load', function() {
                        if (img.data('src') == null) {
                            $(item).removeClass('img-loading');
                        } else {
                            $(item).addClass('img-loading');
                        }
                    });
                }
            });
            if (opt.autoscroll && $.isNumeric(opt.autoscroll)) {
                setInterval(function() {
                    obj.next();
                    sign_isAuto = true;
                }, opt.autoscroll);
            }
            var sizeInfo = _getImageSize();
            $this.css('height', sizeInfo.height);
            $wrap.css('height', sizeInfo.height + 21);
            prevLink.click(function() {
                obj.prev();
                return false;
            });
            nextLink.click(function() {
                obj.next();
                return false;
            });
            $this.append(prevLink);
            $this.append(nextLink);
            if ($.isMobile()) {
                $list.on('swipeleft', obj.next);
                $list.on('swiperight', obj.prev);
            }
            $(document).on('dom.resize.shifter', function() {
                _resize();
                _scroll();
            });
            $wrap.on('scroll', function() {
                if (timer) {
                    clearTimeout(timer);
                }
                timer = setTimeout(_scroll, 500);
            });
            $(document).on('dom.keydown', function(ctx, e) {
                if (e.keyCode == '37') {
                    obj.prev();
                }
                if (e.keyCode == '39') {
                    obj.next();
                }
            });
            _resize();
            _scroll();
            $this.data('shifter', obj);
            $this.attr('role', 'Shifter');
            if (opt.onafter) {
                if ($.isFunction(opt.onafter)) {
                    opt.onchange($this);
                } else {
                    $(document).trigger(opt.onafter, [$this]);
                }
            }
            return obj;
        };
        return _init();
    };

    $(document).on('dom.load.shifter', function() {
        $('[data-shifter]').each(function() {
            var $this = $(this);
            $this.shifter($this.data());
            $this.removeAttr('data-shifter');
        });
    });
})(jQuery);

//seed code for create a plugin
//replace all of the "slickslider" with the plugin name. (the plugin name should be same as the js file name);

(function ($) {
    $.fn.slickslider = function (options) {
        var defaultOpt = {
            centerMode: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            responsive: [
                {
                    breakpoint: 992,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 1,
                    }
                },
                {
                    breakpoint: 768,
                    settings: {
                        arrows: false,
                        centerMode: true,
                        slidesToShow: 2,
                        slidesToScroll: 1,
                    }
                },
                {
                    breakpoint: 375,
                    settings: {
                        arrows: false,
                        centerMode: true,
                        slidesToShow: 1,
                        slidesToScroll: 1,
                    }
                }
            ]
        };
        var opt = $.extend({}, defaultOpt, options)
        $(this).slick(opt);
    }
    $(document).on('dom.load.slickslider', function () {
        $('[data-slickslider]').each(function (index, item) {
            var $this = $(item);
            var data = $this.data();
            $this.slickslider(data);
            $this.removeAttr('data-slickslider');
            $this.attr('data-slickslider-load', '');
            $this.attr('role', 'slickslider');
        });
    });
})(jQuery);
//slider
(function($) {
    $.fn.slide = function(options) {
        var defaultOpt = {
            loop: true,
            index: 0,
            onchange: null,
            lazingload: true,
            autoscroll: 0,
            height: 300,
        };
        var $this = $(this);
        var opt = $.extend({}, defaultOpt, options);
        var $list;
        var obj;
        var $items;
        var length;
        var sign_isAuto = false;
        var prevLink = $('<a href="javascript:void(0)" class="prev"><i class="icon-angle-left"></i></a>');
        var nextLink = $('<a href="javascript:void(0)" class="next"><i class="icon-angle-right"></i></a>');
        var _option = function(option) {
            opt = $.extend(opt, option);
            return opt;
        };
        var _slide = function(index, animated) {
            var currentItem = $list.find('li.active');
            if (!currentItem.length) {
                currentItem = $list.find('li:first-child');
            }
            var nextItem = $this.find('li[index=\'' + index + '\']');
            if (index === opt.index) {
                return;
            }
            var isReverse = index < opt.index ? ((opt.index + 1 - index) == length) : ((index + 1 - opt.index) !== length);
            //reverse
            if (isReverse) {
                $list.prepend(nextItem);
                $list.prepend(currentItem);
                $list.css({
                    'marginLeft': '0'
                });
                if (animated == false) {
                    $list.css('marginLeft', '-' + $items.width() + 'px');
                } else {
                    $list.stop().animate({
                        'marginLeft': '-' + $items.width() + 'px'
                    });
                }
            } else {
                $list.prepend(currentItem);
                $list.prepend(nextItem);
                $list.css({
                    'marginLeft': '-' + $items.width() + 'px',
                });
                if (animated == false) {
                    $list.css('marginLeft', 0);
                } else {
                    $list.stop().animate({
                        'marginLeft': 0
                    });
                }
            }
            if (opt.lazingload) {
                currentItem.find('img').each(function(index, img) {
                    if ($(img).data('src')) {
                        $(img).attr('src', $(img).data('src'));
                        $(img).data('src', null);
                    }
                });

                nextItem.find('img').each(function(index, img) {
                    if ($(img).data('src')) {
                        $(img).attr('src', $(img).data('src'));
                        $(img).data('src', null);
                    }
                });
            }

            opt.index = index;
            currentItem.removeClass('active');
            nextItem.addClass('active');
            if (opt.onchange) {
                if ($.isFunction(opt.onchange)) {
                    opt.onchange(index, sign_isAuto);
                } else {
                    $(document).trigger(opt.onchange, [index, sign_isAuto]);
                }
            }
        };
        var _init = function() {
            if (opt.onbefore) {
                if ($.isFunction(opt.onbefore)) {
                    opt.onbefore($this);
                } else {
                    $(document).trigger(opt.onbefore, [$this]);
                }
            }
            $this.css('height', opt.height);
            $list = $this.children('ul');
            $items = $list.find('li');
            length = $items.length;
            $items.each(function(index, item) {
                $(item).attr('index', index);
                if (index >= 2 && opt.lazingload) {
                    var img = $(item).find('img[src]');
                    img.data('src', img.attr('src'));
                    img.attr('src', 'data:image/gif;base64,R0lGODlhAQABAJEAAAAAAP///////wAAACH5BAEAAAIALAAAAAABAAEAAAICVAEAOw==');
                    $(item).addClass('img-loading');
                    setTimeout(function() {
                        img.one('load', function() {
                            $(item).removeClass('img-loading');
                        });
                    }, 100);
                }
            });
            obj = {
                optyion: _option,
                go: function(index, animated) {
                    _slide(index, animated);
                },
                next: function() {
                    if (opt.index >= length - 1) {
                        if (opt.loop) {
                            _slide(0);
                        }
                    } else {
                        _slide(opt.index + 1);
                    }
                },
                prev: function() {
                    if (opt.index == 0) {
                        if (opt.loop) {
                            _slide(length - 1);
                        }
                    } else {
                        _slide(opt.index - 1);
                    }
                }
            };
            if (opt.autoscroll && $.isNumeric(opt.autoscroll)) {
                setInterval(function() {
                    obj.next();
                    sign_isAuto = true;
                }, opt.autoscroll);
            }
            if ($.isMobile()) {
                $list.on('swipeleft', obj.next);
                $list.on('swiperight', obj.prev);
            }
            prevLink.click(function() {
                obj.prev();
                return false;
            });
            nextLink.click(function() {
                obj.next();
                return false;
            });
            $this.append(prevLink);
            $this.append(nextLink);
            $this.data('slider', obj);
            $this.attr('role', 'Slider');
            $(document).on('dom.keydown', function(ctx, e) {
                if (e.keyCode == '37') {
                    obj.prev();
                }
                if (e.keyCode == '39') {
                    obj.next();
                }
            });
            if (opt.onafter) {
                if ($.isFunction(opt.onafter)) {
                    opt.onafter($this);
                } else {
                    $(document).trigger(opt.onafter, [$this]);
                }
            }
            return obj;
        };
        return _init();
    };

    $(document).on('dom.load.slider', function() {
        $('[data-slider]').each(function() {
            var $this = $(this);
            $this.slide($this.data());
            $this.removeAttr('data-slider');
        });
    });
})(jQuery);

(function($) {
    $.fn.stick = function(option) {
        var defaultOpt = {
            offset: 50
        };
        var $this = $(this);
        var shouldwrap = $this.css('position') === 'static' || $this.css('position') === 'relative';
        var height = $this.outerHeight();
        if (shouldwrap) {
            var $warp = $('<div></div>').height(height);
            $this.wrap($warp);
        }
        var opt = $.extend(option, defaultOpt);
        var top = $this.offset().top;
        var _stick = function() {
            if ($(document).scrollTop() > (top - opt.offset)) {
                $this.addClass('stick');
                $this.css('top', opt.offset);
            } else {
                $this.removeClass('stick');
            }
        };

        $(window).on('scroll', _stick);
        _stick();
        $this.attr('role', 'Stick');
    };
    $(document).on('dom.load', function() {
        $('[data-stick]').each(function(index, item) {
            $(item).stick({
                offset: $(item).attr('data-offset') * 1 || 50
            });
            $(item).removeAttr('data-stick');
        });
    });
})(jQuery);

//form submit
(function($) {
    $.fn.submitForm = function(options) {
        var $this = $(this);
        var defaultOpt = {
            target: '',
            type: null,
            beforesend: null,
            onsuccess: null,
            onerror: null,
            datatype: null,
            lock: 1,
        };
        var opt = $.extend({}, defaultOpt, options);
        var obj = {
            send: function() {
                if ($this.is('[disabled]')) {
                    return false;
                }
                var params = {
                    type: opt.type,
                    dataType: opt.datatype,
                    lock: opt.lock
                };

                if (opt.target) {
                    var $target = $(opt.target);
                    if ($target.isValid()) {
                        params.data = $target.formValue();
                    } else {
                        return false;
                    }
                }

                params.beforeSend = function() {
                    if ($.isFunction(opt.beforesend)) {
                        opt.beforesend(opt);
                    } else {
                        $(document).trigger(opt.beforesend, [opt]);
                    }
                };
                params.success = function() {
                    if ($.isFunction(opt.onsuccess)) {
                        opt.onsuccess(opt);
                    } else {
                        $(document).trigger(opt.onsuccess, [$this, opt]);
                    }
                };
                params.error = function() {
                    if ($.isFunction(opt.onerror)) {
                        opt.onerror(opt);
                    } else {
                        $(document).trigger(opt.onerror, [$this, opt]);
                    }
                };
                $.ajax(params);
            },
            setOption: function(key, value) {
                opt[key] = value;
            },
            setOptions: function(options) {
                $.extend(opt, options);
            }
        };

        $this.click(obj.send);
        $this.data('submit', obj);
        $this.attr('role', 'SubmitForm');
        return obj;
    };
    $(document).on('dom.load.submit', function() {
        $('[data-submit]').each(function() {
            var $this = $(this);
            if ($this.attr('data-target')) {
                var $form = $($this.attr('data-target'));
                $form.on('keyup', function(e) {
                    if (e.keyCode === 13) {
                        //when focus on textarea will not auto submit
                        if ($('textarea:focus').length === 0) {
                            $this.click();
                        }
                    }
                });
            }
        });
    });

    $(document).on('dom.load', function() {
        $('[data-submit]').each(function(index, item) {
            var $item = item;
            $item.submitForm($item.data());
            $item.removeAttr('data-submit');
        });
    });
})(jQuery);

//tab
(function ($) {
    $.fn.tabs = function () {
        var $this = $(this);

        function toggle($item) {
            //hide all
            var item = $this.find('[data-tab]');
            item.removeClass('active');
            item.each(function (index, item) {
                var target = $(item).attr('data-target');
                $(target).hide();
            });
            //show click one
            var target = $item.attr('data-target');
            $item.addClass('active');
            $(target).show();
        }

        $this.find('[data-tab]').each(function (index, item) {
            var $item = $(item);
            if ($($item.attr('data-target')).length > 0) {

                if ($item.hasClass('active')) {
                    toggle($item);
                }
                $item.click(function () {
                    toggle($(this));
                });
            } else {
                $item.hide();
            }
        });
        $this.attr('role', 'Tabs');
    };

    $(document).on('dom.load.tabs', function () {
        $('[data-tabs]').each(function (index, item) {
            $(item).tabs();
            $(item).removeAttr('data-tabs');
        });
    });
})(jQuery);

(function($) {
    $.fn.textbox = function() {
        var $this = $(this);
        var $input = $this.find('input');
        var _switchLabel = function() {
            if ($input.val()) {
                $this.addClass('focus');
            } else {
                $this.removeClass('focus');
            }
        }
        if (!$input.size()) {
            $input = $this.find('textarea');
        }
        $input.on('focusin', function() {
            $this.addClass('focus');
        });
        $input.on('focusout', function() {
            if (!$input.val()) {
                $this.removeClass('focus');
            }
        });
        $input.on('change', _switchLabel);
        _switchLabel();
    };
    $(document).on('dom.load', function() {
        $('[data-textbox]').each(function(index, item) {
            $(item).textbox();
            $(item).removeAttr('data-textbox');
            $(item).attr('data-textbox-load', '');
        });
    });
})(jQuery);

//tip
(function($) {
    var animationDuration = 500;

    var tipConfig = {
        name: 'tip',
        defaultOpt: {
            traget: null,
            height: 50,
            width: 320,
            type: '',
            placement: 'top',
            trigger: 'click',
            html: true,
            once: false,
            showbefore: null,
            showafter: null,
            hidebefore: null,
            hideafter: null,
            _timer: null
        },
        init: function(context) {
            var opt = context.opt;
            var $this = context.$element;
            var $container = $('<div class="tooltip ' + opt.type + ' ' + opt.placement + '" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>');
            $this.parent().css({position: 'relative'});
            $this.after($container);
            $container.click(function(e) {
                e.stopPropagation();
            });
            context.$container = $container;
            $container.hide();
        },
        destroy: null,
        exports: {
            show: function() {
                var opt = this.opt;
                var $this = this.$element;
                var $container = this.$container;
                clearTimeout(opt._timer);
                if (opt.showbefore) {
                    $.CUI.addEvent(opt.showbefore, this);
                }
                $container.find('.tooltip-inner').html(opt.content);
                var cWidth = $container.outerWidth();
                var cHeight = $container.outerHeight();
                var tWidth = $this.outerWidth();
                var tHeight = $this.outerHeight();
                var offset = $this.offset();
                var position = $this.position();
                var pWidth = $this.parent().outerWidth(true);
                var x = 0;
                var y = 0;
                var css = {};
                $container.show();
                setTimeout(function() {
                    $container.addClass('in');
                }, 10);
                switch (opt.placement) {
                    case 'top':
                    case 'bottom':
                        $container.removeClass('{0}-left {0}-right'.format(opt.placement));
                        x = (Math.abs(tWidth - cWidth) / 2);
                        if (x > offset.left) {
                            css = {
                                left: position.left,
                                right: ''
                            };
                            $container.addClass('{0}-right'.format(opt.placement));
                        } else if ((offset.left + (tWidth + cWidth) / 2) > $(window).width()) {

                            css = {
                                left: '',
                                right: pWidth - tWidth - position.left
                            };
                            $container.addClass('{0}-left'.format(opt.placement));
                        } else {
                            x = x - position.left;
                            css = {
                                left: -1 * x
                            };
                            $container.addClass(opt.placement);
                        }
                        $container.css(css);
                        break;
                    case 'left':
                    case 'right':
                        $container.removeClass(opt.placement);
                        if (opt.placement === 'left') {
                            x = cWidth * -1 + position.left - 5;
                        } else {
                            x = tWidth + position.left + 5;
                        }
                        y = (Math.abs(tHeight - cHeight) / 2);
                        css = {
                            top: -1 * y,
                            left: x,
                            right: ''
                        };
                        $container.css(css);
                        $container.addClass(opt.placement);
                        break;
                }
                if (opt.showafter) {
                    $.CUI.addEvent(opt.showafter, this);
                }
            },
            hide: function() {
                var opt = this.opt;
                var that = this;
                var $container = this.$container;
                var exports = this.exports;
                if (opt.hidebefore) {
                    $.CUI.addEvent(opt.hidebefore, this);
                }
                $container.removeClass('in');
                opt._timer = setTimeout(function() {
                    $container.hide();
                    if (opt.hideafter) {
                        $.CUI.addEvent(opt.hideafter, that);
                    }
                    if (opt.once) {
                        exports.destroy();
                    }
                }, animationDuration + 1);
            }
        },
        setOptionsBefore: null,
        setOptionsAfter: function(context) {
            var opt = context.opt;
            var $container = context.$container;
            $container.find('.tooltip-inner').html(opt.content);
        },
        initBefore: null,
        initAfter: function(context) {
            var opt = context.opt;
            var $this = context.$element;
            var exports = context.exports;
            switch (opt.trigger) {
                case 'click' :
                    $this.on('click.' + exports.name, function() {
                        exports.show();
                        $(document).one('click', exports.hide);
                        return false;
                    });
                    break;
                case 'focus' :
                    $this.on('focusin.' + exports.name, exports.show);
                    $this.on('focusout.' + exports.name, exports.hide);
                    break;
            }
        },
        destroyBefore: function(context) {
            var exports = context.exports;
            var $this = $(this);
            $this.off('click.' + exports.name);
            $this.off('focusin.' + exports.name);
            $this.off('focusout.' + exports.name);
            context.$container.remove();
        },
    };
    $.CUI.plugin(tipConfig);
    $(document).on('dom.load.tip', function() {
        $('[data-tip]').each(function() {
            var options = $(this).data();
            $(this).tip(options);
            $(this).removeAttr('data-tip');
            $(this).attr('role', 'Tip');
        });
    });
})(jQuery);
(function ($) {
    //customer validate
    var customValidate = {
        max: function ($element) {
            var value = $element.val();
            var max = $element.attr('data-max');
            var a = $.isNumeric(value) ? value : Date.parse(value);
            var b = $.isNumeric(max) ? max : Date.parse(max);
            return (a - b) <= 0;
        },
        less: function ($element) {
            var value = $element.val();
            var less = $element.attr('data-less');
            var a = $.isNumeric(value) ? value : Date.parse(value);
            var b = $.isNumeric(less) ? less : Date.parse(less);
            return (a - b) < 0;
        },
        min: function ($element) {
            var value = $element.val();
            var min = $element.attr('data-min');
            var a = $.isNumeric(value) ? value : Date.parse(value);
            var b = $.isNumeric(min) ? min : Date.parse(min);
            return (a - b) >= 0;
        },
        greater: function ($element) {
            var value = $element.val();
            var greater = $element.attr('data-greater');
            var a = $.isNumeric(value) ? value : Date.parse(value);
            var b = $.isNumeric(greater) ? greater : Date.parse(greater);
            return (a - b) > 0;
        }
    };
    var _showValidate = function ($element, message) {
        $element.closest('.input').removeClass('has-success');
        $element.closest('.input').addClass('has-error');
        if (message) {
            $element.tip({
                once: true,
                type: 'error',
                content: message,
                placement: 'bottom',
                trigger: null
            }).show();
        }
    };
    var _passValidate = function ($element, isRequried) {
        $element.closest('.input').removeClass('has-error');
        if ($element.data('tip')) {
            $element.data('tip').hide();
        }
        if ($element.is('[id]')) {
            $('[for=' + $element.attr('id') + ']').removeClass('error-text');
        }
        if (isRequried) {
            $element.closest('.input').addClass('has-success');
        } else if ($element.val()) {
            $element.closest('.input').addClass('has-success');
        } else {
            $element.closest('.input').removeClass('has-success');
        }
    };
    var _validate = function ($element, type, errorText, addition) {
        var value = $.trim($element.val());
        var isRequired = type.indexOf('required') >= 0;
        var message = '';
        for (var i = 0; i < type.length; i++) {
            switch (type[i]) {
                case 'required':
                    if (!value && value === '') {
                        message = 'This is requried';
                        _showValidate($element, message);
                        return false;
                    }
                    break;
                case 'email':
                    if (value && !$.isEmail(value)) {
                        message = errorText || 'Please enter a valid email.';
                        _showValidate($element, message);
                        return false;
                    }
                    break;
                case 'phone':
                    if (value && !$.isPhone(value)) {
                        message = errorText || 'Please enter a valid Phone Number';
                        _showValidate($element, message);
                        return false;
                    }
                    break;
                case 'zipcode':
                    if (value && !$.isZipCode(value)) {
                        message = errorText || 'Please enter a valid zipcode';
                        _showValidate($element, message);
                        return false;
                    }
                    break;
                case 'price':
                    if (value && !$.isPrice(value)) {
                        message = errorText || 'Please enter a valid price';
                        _showValidate($element, message);
                        return false;
                    }
                    break;
                case 'int':
                    if (value && !$.isInt(value)) {
                        message = errorText || 'Only allowed integer number';
                        _showValidate($element, message);
                        return false;
                    }
                    break;
                case 'float':
                    if (value && !$.isFloat(value)) {
                        message = errorText || 'Only allowed floating number';
                        _showValidate($element, message);
                        return false;
                    }
                    break;
                default:
                    break;
            }
        }

        if (customValidate[addition] && !customValidate[addition]($element)) {
            _showValidate($element, message);
            return false;
        }

        _passValidate($element, isRequired);
        return true;
    };
    var validateConfig = {
        name: 'validate',
        defaultOpt: {
            errortext: 'Invalid value.',
            addition: null
        },
        initBefore: null,
        init: function (context) {
            var $this = context.$element;
            var opt = context.opt;
            opt.validate = opt.validate ? opt.validate.split(',') : [];
            $this.on('change.validate', function () {
                _validate($this, opt.validate, opt.errortext, opt.addition);
            });
        },
        exports: {
            isValid: function () {
                var $this = this.$element;
                var opt = this.opt;
                return _validate($this, opt.validate, opt.errortext, opt.addition);
            }
        },
        setOptionsBefore: function (e, context, options) {
            options.validate = options.validate ? options.validate.split(',') : [];
        },
        setOptionsAfter: function (context) {
            var $this = context.$element;
            var opt = context.opt;
            $this.off('change.validate').on('change.validate', function () {
                _validate($this, opt.validate, opt.errortext, opt.addition);
            });
        },
        destroyBefore: function (context) {
            var $this = context.$element;
            $this.off('change.validate');
        },
        initAfter: null,
        isThirdPart: false,
    };
    $.CUI.plugin(validateConfig);
    $(document).on('dom.load.validate', function () {
        $('[data-validate]').each(function (index, item) {
            var $item = $(item);
            $item.validate($item.data());
            $item.removeAttr('data-validate');
            $item.attr('data-validate-load', '');
        });
    });
})(jQuery);
(function($) {
    $.fn.webview = function() {
        var $this = $(this);
        var webviewInfo = {};
        var eventlist = null;
        var _getPonitInfo = null;
        var _init = function() {
            $this.css({overflow: 'hidden'});

            if ($.isMobile()) {
                eventlist = {
                    start: 'touchstart',
                    moveing: 'touchmove',
                    end: 'touchend'
                }
                _getPonitInfo = function(e) {
                    return {
                        x: e.originalEvent.touches[0].pageX,
                        y: e.originalEvent.touches[0].pageY
                    };
                };
            } else {
                eventlist = {
                    start: 'moursedown',
                    moveing: 'mousemove',
                    end: 'mourseup'
                }
                _getPonitInfo = function(e) {
                    return {
                        x: e.originalEvent.pageX,
                        y: e.originalEvent.pageY
                    };
                };
            }
        }

        var _getWebviewInfo = function() {
            webviewInfo['maxTop'] = $this.outerHeight() + $this.prop('scrollHeight');
            webviewInfo['maxLeft'] = $this.outerWidth() + $this.prop('scrollWidth');
            webviewInfo['scrollTop'] = $this.scrollTop();
            webviewInfo['scrollLeft'] = $this.scrollLeft();
        };
        var pointStart = null;

        var _move = function(point) {
            var offsetTop = pointStart.y - point.y;
            var offsetLeft = pointStart.x - point.x;
            var top = webviewInfo.scrollTop + offsetTop;
            var left = webviewInfo.scrollLeft + offsetLeft;
            $this.scrollTop(top);
            $this.scrollLeft(left);
        };
        _getWebviewInfo();
        $this.on(eventlist.start, function(e) {
            pointStart = _getPonitInfo(e);
        });
        $this.on(eventlist.moving, function(e) {
            _move(_getPonitInfo(e));
        });
        $this.on(eventlist.end, function() {
            _getWebviewInfo();
        });

        $this.on('mousewheel', function(e) {
            $this.scrollTop($this.scrollTop() + e.originalEvent.wheelDelta);
        });

        _init();

    };
    $(document).on('dom.load', function() {
        $('[data-webview]').each(function() {
            $(this).webview();
            $(this).removeAttr('data-webview');
        });
    });
})(jQuery);
(function($) {
    var imgzoomConfig = {
        name: 'imgzoom',
        defaultOpt: {
            step: 0,
            max: 200,
            min: 50,
            defaultzoom: 100,
            target: '',
            zoombefore: null,
            zoomafter: null
        },
        init: function(context) {
            var opt = context.opt;
            var $this = context.$element;
            var $target = null;
            if (opt.target) {
                $target = context.$target = $(opt.target);
            } else {
                $target = $this;
            }
            context._zoom = function(tmpStep) {
                var step = $.isNumeric(tmpStep) || opt.step;
                var currentzoom = $target.data('currentzoom');
                if (!currentzoom) {
                    currentzoom = Math.floor($target.find('img').width() / $target.outerWidth() * 10) * 10;
                }
                var scrollTop = $target.scrollTop();
                var scrollTopRate = scrollTop / $target.prop('scrollHeight');
                if (step > 0) {
                    currentzoom = Math.min(opt.max, (currentzoom + step));
                } else if (step < 0) {
                    currentzoom = Math.max(opt.min, (currentzoom + step));
                } else if (step == 0) {
                    currentzoom = opt.defaultzoom;
                }
                $target.data('currentzoom', currentzoom);
                $target.find('img').css({'width': currentzoom + '%'});
                if (scrollTop) {
                    scrollTop = scrollTopRate * $target.prop('scrollHeight');
                    $target.scrollTop(scrollTop);
                }
            };
        },
        exports: {
            getZoom: function() {
                var $target = this.$target;
                return Math.floor($target.find('img').width() / $target.outerWidth() * 10) * 10;
            },
            setZoom: function(step) {
                var opt = this.opt;
                if (opt.zoombefore) {
                    $.CUI.addEvent(opt.zoombefore, this);
                }
                this._zoom(step);
                if (opt.zoomafter) {
                    $.CUI.addEvent(opt.zoomafter, this);
                }
            }
        },
        setOptionsBefore: null,
        setOptionsAfter: null,
        initBefore: null,
        initAfter: function(context) {
            var $this = context.$element;
            var exports = context.exports;
            exports.setZoom(0);
            $this.on('click.imgzoom', function() {
                exports.setZoom();
            });
        },
        destroyBefore: function(context) {
            var $this = context.$element;
            $this.off('click.imgzoom');
        }
    };
    $.CUI.plugin(imgzoomConfig);
    $(document).on('dom.load.imgzoom', function() {
        $('[data-imgzoom]').each(function(index, item) {
            var $this = $(item);
            var data = $this.data();
            $this.imgzoom(data);
            $this.removeAttr('data-imgzoom');
            $this.attr('data-imgzoom-load', '');
            $this.attr('role', 'Imgzoom');
        });
    });
})(jQuery);
