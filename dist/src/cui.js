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
            $(document).on('dom.load', context._load);
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
            height: 250,
            width: 375,
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
//replace all of the "slicker" with the plugin name. (the plugin name should be same as the js file name);

(function($) {
    var slickerConfig = {
        name: 'slicker',
        defaultOpt: {
            arrows: true,
            centerMode: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            autoscroll: 0,
            width: 375,
            padding: 50
        },
        init: function(context) {
            var opt = context.opt;
            var $this = context._slick = context.$element.children('ul');
            if (opt.autoscroll) {
                opt.autoplay = true;
                opt.autoplaySpeed = opt.autoscroll;
            }
            opt.responsive = [
                {
                    breakpoint: opt.width * 3 + opt.padding * 2,
                    settings: {
                        arrows: true,
                        centerMode: false,
                        slidesToShow: 3,
                        slidesToScroll: 1,
                    }
                },
                {
                    breakpoint: opt.width * 3 - opt.padding * 2,
                    settings: {
                        arrows: true,
                        centerMode: true,
                        slidesToShow: 2,
                        slidesToScroll: 1,
                    }
                },
                {
                    breakpoint: opt.width * 2 + opt.padding * 2,
                    settings: {
                        arrows: true,
                        centerMode: false,
                        slidesToShow: 2,
                        slidesToScroll: 1,
                    }
                },
                {
                    breakpoint: opt.width * 2 - opt.padding * 2,
                    settings: {
                        arrows: false,
                        centerMode: true,
                        slidesToShow: 1,
                        slidesToScroll: 1,
                    }
                }, {
                    breakpoint: opt.width + opt.padding * 2,
                    settings: {
                        arrows: false,
                        centerMode: false,
                        slidesToShow: 1,
                        slidesToScroll: 1,
                    }
                }
            ];
            opt.centerPadding = opt.padding + 'px';
            delete opt.padding;
            delete opt.width;
            delete opt.autoscroll;
            $this.slick(opt);
        },
        exports: {
            next: function() {
                this._slick.slick('slickNext');
            },
            prev: function() {
                this._slick.slick('slickPrev');
            },
            go: function(index, noAnimate) {
                this._slick.slick('slickGoTo', index, noAnimate);
            },
        }
    };
    $.CUI.plugin(slickerConfig);
    $(document).on('dom.load.slicker', function() {
        $('[data-slicker]').each(function(index, item) {
            var $this = $(item);
            var data = $this.data();
            $this.slicker(data);
            $this.removeAttr('data-slicker');
            $this.attr('data-slicker-load', '');
            $this.attr('role', 'slicker');
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
