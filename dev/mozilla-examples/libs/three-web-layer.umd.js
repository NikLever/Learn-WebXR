(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('three')) :
    typeof define === 'function' && define.amd ? define(['three'], factory) :
    (global.WebLayer3D = factory(global.THREE));
}(this, (function (THREE) { 'use strict';

    /**
     * A collection of shims that provide minimal functionality of the ES6 collections.
     *
     * These implementations are not meant to be used outside of the ResizeObserver
     * modules as they cover only a limited range of use cases.
     */
    /* eslint-disable require-jsdoc, valid-jsdoc */
    var MapShim = (function () {
        if (typeof Map !== 'undefined') {
            return Map;
        }
        /**
         * Returns index in provided array that matches the specified key.
         *
         * @param {Array<Array>} arr
         * @param {*} key
         * @returns {number}
         */
        function getIndex(arr, key) {
            var result = -1;
            arr.some(function (entry, index) {
                if (entry[0] === key) {
                    result = index;
                    return true;
                }
                return false;
            });
            return result;
        }
        return /** @class */ (function () {
            function class_1() {
                this.__entries__ = [];
            }
            Object.defineProperty(class_1.prototype, "size", {
                /**
                 * @returns {boolean}
                 */
                get: function () {
                    return this.__entries__.length;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @param {*} key
             * @returns {*}
             */
            class_1.prototype.get = function (key) {
                var index = getIndex(this.__entries__, key);
                var entry = this.__entries__[index];
                return entry && entry[1];
            };
            /**
             * @param {*} key
             * @param {*} value
             * @returns {void}
             */
            class_1.prototype.set = function (key, value) {
                var index = getIndex(this.__entries__, key);
                if (~index) {
                    this.__entries__[index][1] = value;
                }
                else {
                    this.__entries__.push([key, value]);
                }
            };
            /**
             * @param {*} key
             * @returns {void}
             */
            class_1.prototype.delete = function (key) {
                var entries = this.__entries__;
                var index = getIndex(entries, key);
                if (~index) {
                    entries.splice(index, 1);
                }
            };
            /**
             * @param {*} key
             * @returns {void}
             */
            class_1.prototype.has = function (key) {
                return !!~getIndex(this.__entries__, key);
            };
            /**
             * @returns {void}
             */
            class_1.prototype.clear = function () {
                this.__entries__.splice(0);
            };
            /**
             * @param {Function} callback
             * @param {*} [ctx=null]
             * @returns {void}
             */
            class_1.prototype.forEach = function (callback, ctx) {
                if (ctx === void 0) { ctx = null; }
                for (var _i = 0, _a = this.__entries__; _i < _a.length; _i++) {
                    var entry = _a[_i];
                    callback.call(ctx, entry[1], entry[0]);
                }
            };
            return class_1;
        }());
    })();

    /**
     * Detects whether window and document objects are available in current environment.
     */
    var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;

    // Returns global object of a current environment.
    var global$1 = (function () {
        if (typeof global !== 'undefined' && global.Math === Math) {
            return global;
        }
        if (typeof self !== 'undefined' && self.Math === Math) {
            return self;
        }
        if (typeof window !== 'undefined' && window.Math === Math) {
            return window;
        }
        // eslint-disable-next-line no-new-func
        return Function('return this')();
    })();

    /**
     * A shim for the requestAnimationFrame which falls back to the setTimeout if
     * first one is not supported.
     *
     * @returns {number} Requests' identifier.
     */
    var requestAnimationFrame$1 = (function () {
        if (typeof requestAnimationFrame === 'function') {
            // It's required to use a bounded function because IE sometimes throws
            // an "Invalid calling object" error if rAF is invoked without the global
            // object on the left hand side.
            return requestAnimationFrame.bind(global$1);
        }
        return function (callback) { return setTimeout(function () { return callback(Date.now()); }, 1000 / 60); };
    })();

    // Defines minimum timeout before adding a trailing call.
    var trailingTimeout = 2;
    /**
     * Creates a wrapper function which ensures that provided callback will be
     * invoked only once during the specified delay period.
     *
     * @param {Function} callback - Function to be invoked after the delay period.
     * @param {number} delay - Delay after which to invoke callback.
     * @returns {Function}
     */
    function throttle (callback, delay) {
        var leadingCall = false, trailingCall = false, lastCallTime = 0;
        /**
         * Invokes the original callback function and schedules new invocation if
         * the "proxy" was called during current request.
         *
         * @returns {void}
         */
        function resolvePending() {
            if (leadingCall) {
                leadingCall = false;
                callback();
            }
            if (trailingCall) {
                proxy();
            }
        }
        /**
         * Callback invoked after the specified delay. It will further postpone
         * invocation of the original function delegating it to the
         * requestAnimationFrame.
         *
         * @returns {void}
         */
        function timeoutCallback() {
            requestAnimationFrame$1(resolvePending);
        }
        /**
         * Schedules invocation of the original function.
         *
         * @returns {void}
         */
        function proxy() {
            var timeStamp = Date.now();
            if (leadingCall) {
                // Reject immediately following calls.
                if (timeStamp - lastCallTime < trailingTimeout) {
                    return;
                }
                // Schedule new call to be in invoked when the pending one is resolved.
                // This is important for "transitions" which never actually start
                // immediately so there is a chance that we might miss one if change
                // happens amids the pending invocation.
                trailingCall = true;
            }
            else {
                leadingCall = true;
                trailingCall = false;
                setTimeout(timeoutCallback, delay);
            }
            lastCallTime = timeStamp;
        }
        return proxy;
    }

    // Minimum delay before invoking the update of observers.
    var REFRESH_DELAY = 20;
    // A list of substrings of CSS properties used to find transition events that
    // might affect dimensions of observed elements.
    var transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];
    // Check if MutationObserver is available.
    var mutationObserverSupported = typeof MutationObserver !== 'undefined';
    /**
     * Singleton controller class which handles updates of ResizeObserver instances.
     */
    var ResizeObserverController = /** @class */ (function () {
        /**
         * Creates a new instance of ResizeObserverController.
         *
         * @private
         */
        function ResizeObserverController() {
            /**
             * Indicates whether DOM listeners have been added.
             *
             * @private {boolean}
             */
            this.connected_ = false;
            /**
             * Tells that controller has subscribed for Mutation Events.
             *
             * @private {boolean}
             */
            this.mutationEventsAdded_ = false;
            /**
             * Keeps reference to the instance of MutationObserver.
             *
             * @private {MutationObserver}
             */
            this.mutationsObserver_ = null;
            /**
             * A list of connected observers.
             *
             * @private {Array<ResizeObserverSPI>}
             */
            this.observers_ = [];
            this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
            this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
        }
        /**
         * Adds observer to observers list.
         *
         * @param {ResizeObserverSPI} observer - Observer to be added.
         * @returns {void}
         */
        ResizeObserverController.prototype.addObserver = function (observer) {
            if (!~this.observers_.indexOf(observer)) {
                this.observers_.push(observer);
            }
            // Add listeners if they haven't been added yet.
            if (!this.connected_) {
                this.connect_();
            }
        };
        /**
         * Removes observer from observers list.
         *
         * @param {ResizeObserverSPI} observer - Observer to be removed.
         * @returns {void}
         */
        ResizeObserverController.prototype.removeObserver = function (observer) {
            var observers = this.observers_;
            var index = observers.indexOf(observer);
            // Remove observer if it's present in registry.
            if (~index) {
                observers.splice(index, 1);
            }
            // Remove listeners if controller has no connected observers.
            if (!observers.length && this.connected_) {
                this.disconnect_();
            }
        };
        /**
         * Invokes the update of observers. It will continue running updates insofar
         * it detects changes.
         *
         * @returns {void}
         */
        ResizeObserverController.prototype.refresh = function () {
            var changesDetected = this.updateObservers_();
            // Continue running updates if changes have been detected as there might
            // be future ones caused by CSS transitions.
            if (changesDetected) {
                this.refresh();
            }
        };
        /**
         * Updates every observer from observers list and notifies them of queued
         * entries.
         *
         * @private
         * @returns {boolean} Returns "true" if any observer has detected changes in
         *      dimensions of it's elements.
         */
        ResizeObserverController.prototype.updateObservers_ = function () {
            // Collect observers that have active observations.
            var activeObservers = this.observers_.filter(function (observer) {
                return observer.gatherActive(), observer.hasActive();
            });
            // Deliver notifications in a separate cycle in order to avoid any
            // collisions between observers, e.g. when multiple instances of
            // ResizeObserver are tracking the same element and the callback of one
            // of them changes content dimensions of the observed target. Sometimes
            // this may result in notifications being blocked for the rest of observers.
            activeObservers.forEach(function (observer) { return observer.broadcastActive(); });
            return activeObservers.length > 0;
        };
        /**
         * Initializes DOM listeners.
         *
         * @private
         * @returns {void}
         */
        ResizeObserverController.prototype.connect_ = function () {
            // Do nothing if running in a non-browser environment or if listeners
            // have been already added.
            if (!isBrowser || this.connected_) {
                return;
            }
            // Subscription to the "Transitionend" event is used as a workaround for
            // delayed transitions. This way it's possible to capture at least the
            // final state of an element.
            document.addEventListener('transitionend', this.onTransitionEnd_);
            window.addEventListener('resize', this.refresh);
            if (mutationObserverSupported) {
                this.mutationsObserver_ = new MutationObserver(this.refresh);
                this.mutationsObserver_.observe(document, {
                    attributes: true,
                    childList: true,
                    characterData: true,
                    subtree: true
                });
            }
            else {
                document.addEventListener('DOMSubtreeModified', this.refresh);
                this.mutationEventsAdded_ = true;
            }
            this.connected_ = true;
        };
        /**
         * Removes DOM listeners.
         *
         * @private
         * @returns {void}
         */
        ResizeObserverController.prototype.disconnect_ = function () {
            // Do nothing if running in a non-browser environment or if listeners
            // have been already removed.
            if (!isBrowser || !this.connected_) {
                return;
            }
            document.removeEventListener('transitionend', this.onTransitionEnd_);
            window.removeEventListener('resize', this.refresh);
            if (this.mutationsObserver_) {
                this.mutationsObserver_.disconnect();
            }
            if (this.mutationEventsAdded_) {
                document.removeEventListener('DOMSubtreeModified', this.refresh);
            }
            this.mutationsObserver_ = null;
            this.mutationEventsAdded_ = false;
            this.connected_ = false;
        };
        /**
         * "Transitionend" event handler.
         *
         * @private
         * @param {TransitionEvent} event
         * @returns {void}
         */
        ResizeObserverController.prototype.onTransitionEnd_ = function (_a) {
            var _b = _a.propertyName, propertyName = _b === void 0 ? '' : _b;
            // Detect whether transition may affect dimensions of an element.
            var isReflowProperty = transitionKeys.some(function (key) {
                return !!~propertyName.indexOf(key);
            });
            if (isReflowProperty) {
                this.refresh();
            }
        };
        /**
         * Returns instance of the ResizeObserverController.
         *
         * @returns {ResizeObserverController}
         */
        ResizeObserverController.getInstance = function () {
            if (!this.instance_) {
                this.instance_ = new ResizeObserverController();
            }
            return this.instance_;
        };
        /**
         * Holds reference to the controller's instance.
         *
         * @private {ResizeObserverController}
         */
        ResizeObserverController.instance_ = null;
        return ResizeObserverController;
    }());

    /**
     * Defines non-writable/enumerable properties of the provided target object.
     *
     * @param {Object} target - Object for which to define properties.
     * @param {Object} props - Properties to be defined.
     * @returns {Object} Target object.
     */
    var defineConfigurable = (function (target, props) {
        for (var _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
            var key = _a[_i];
            Object.defineProperty(target, key, {
                value: props[key],
                enumerable: false,
                writable: false,
                configurable: true
            });
        }
        return target;
    });

    /**
     * Returns the global object associated with provided element.
     *
     * @param {Object} target
     * @returns {Object}
     */
    var getWindowOf = (function (target) {
        // Assume that the element is an instance of Node, which means that it
        // has the "ownerDocument" property from which we can retrieve a
        // corresponding global object.
        var ownerGlobal = target && target.ownerDocument && target.ownerDocument.defaultView;
        // Return the local global object if it's not possible extract one from
        // provided element.
        return ownerGlobal || global$1;
    });

    // Placeholder of an empty content rectangle.
    var emptyRect = createRectInit(0, 0, 0, 0);
    /**
     * Converts provided string to a number.
     *
     * @param {number|string} value
     * @returns {number}
     */
    function toFloat(value) {
        return parseFloat(value) || 0;
    }
    /**
     * Extracts borders size from provided styles.
     *
     * @param {CSSStyleDeclaration} styles
     * @param {...string} positions - Borders positions (top, right, ...)
     * @returns {number}
     */
    function getBordersSize(styles) {
        var positions = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            positions[_i - 1] = arguments[_i];
        }
        return positions.reduce(function (size, position) {
            var value = styles['border-' + position + '-width'];
            return size + toFloat(value);
        }, 0);
    }
    /**
     * Extracts paddings sizes from provided styles.
     *
     * @param {CSSStyleDeclaration} styles
     * @returns {Object} Paddings box.
     */
    function getPaddings(styles) {
        var positions = ['top', 'right', 'bottom', 'left'];
        var paddings = {};
        for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
            var position = positions_1[_i];
            var value = styles['padding-' + position];
            paddings[position] = toFloat(value);
        }
        return paddings;
    }
    /**
     * Calculates content rectangle of provided SVG element.
     *
     * @param {SVGGraphicsElement} target - Element content rectangle of which needs
     *      to be calculated.
     * @returns {DOMRectInit}
     */
    function getSVGContentRect(target) {
        var bbox = target.getBBox();
        return createRectInit(0, 0, bbox.width, bbox.height);
    }
    /**
     * Calculates content rectangle of provided HTMLElement.
     *
     * @param {HTMLElement} target - Element for which to calculate the content rectangle.
     * @returns {DOMRectInit}
     */
    function getHTMLElementContentRect(target) {
        // Client width & height properties can't be
        // used exclusively as they provide rounded values.
        var clientWidth = target.clientWidth, clientHeight = target.clientHeight;
        // By this condition we can catch all non-replaced inline, hidden and
        // detached elements. Though elements with width & height properties less
        // than 0.5 will be discarded as well.
        //
        // Without it we would need to implement separate methods for each of
        // those cases and it's not possible to perform a precise and performance
        // effective test for hidden elements. E.g. even jQuery's ':visible' filter
        // gives wrong results for elements with width & height less than 0.5.
        if (!clientWidth && !clientHeight) {
            return emptyRect;
        }
        var styles = getWindowOf(target).getComputedStyle(target);
        var paddings = getPaddings(styles);
        var horizPad = paddings.left + paddings.right;
        var vertPad = paddings.top + paddings.bottom;
        // Computed styles of width & height are being used because they are the
        // only dimensions available to JS that contain non-rounded values. It could
        // be possible to utilize the getBoundingClientRect if only it's data wasn't
        // affected by CSS transformations let alone paddings, borders and scroll bars.
        var width = toFloat(styles.width), height = toFloat(styles.height);
        // Width & height include paddings and borders when the 'border-box' box
        // model is applied (except for IE).
        if (styles.boxSizing === 'border-box') {
            // Following conditions are required to handle Internet Explorer which
            // doesn't include paddings and borders to computed CSS dimensions.
            //
            // We can say that if CSS dimensions + paddings are equal to the "client"
            // properties then it's either IE, and thus we don't need to subtract
            // anything, or an element merely doesn't have paddings/borders styles.
            if (Math.round(width + horizPad) !== clientWidth) {
                width -= getBordersSize(styles, 'left', 'right') + horizPad;
            }
            if (Math.round(height + vertPad) !== clientHeight) {
                height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
            }
        }
        // Following steps can't be applied to the document's root element as its
        // client[Width/Height] properties represent viewport area of the window.
        // Besides, it's as well not necessary as the <html> itself neither has
        // rendered scroll bars nor it can be clipped.
        if (!isDocumentElement(target)) {
            // In some browsers (only in Firefox, actually) CSS width & height
            // include scroll bars size which can be removed at this step as scroll
            // bars are the only difference between rounded dimensions + paddings
            // and "client" properties, though that is not always true in Chrome.
            var vertScrollbar = Math.round(width + horizPad) - clientWidth;
            var horizScrollbar = Math.round(height + vertPad) - clientHeight;
            // Chrome has a rather weird rounding of "client" properties.
            // E.g. for an element with content width of 314.2px it sometimes gives
            // the client width of 315px and for the width of 314.7px it may give
            // 314px. And it doesn't happen all the time. So just ignore this delta
            // as a non-relevant.
            if (Math.abs(vertScrollbar) !== 1) {
                width -= vertScrollbar;
            }
            if (Math.abs(horizScrollbar) !== 1) {
                height -= horizScrollbar;
            }
        }
        return createRectInit(paddings.left, paddings.top, width, height);
    }
    /**
     * Checks whether provided element is an instance of the SVGGraphicsElement.
     *
     * @param {Element} target - Element to be checked.
     * @returns {boolean}
     */
    var isSVGGraphicsElement = (function () {
        // Some browsers, namely IE and Edge, don't have the SVGGraphicsElement
        // interface.
        if (typeof SVGGraphicsElement !== 'undefined') {
            return function (target) { return target instanceof getWindowOf(target).SVGGraphicsElement; };
        }
        // If it's so, then check that element is at least an instance of the
        // SVGElement and that it has the "getBBox" method.
        // eslint-disable-next-line no-extra-parens
        return function (target) { return (target instanceof getWindowOf(target).SVGElement &&
            typeof target.getBBox === 'function'); };
    })();
    /**
     * Checks whether provided element is a document element (<html>).
     *
     * @param {Element} target - Element to be checked.
     * @returns {boolean}
     */
    function isDocumentElement(target) {
        return target === getWindowOf(target).document.documentElement;
    }
    /**
     * Calculates an appropriate content rectangle for provided html or svg element.
     *
     * @param {Element} target - Element content rectangle of which needs to be calculated.
     * @returns {DOMRectInit}
     */
    function getContentRect(target) {
        if (!isBrowser) {
            return emptyRect;
        }
        if (isSVGGraphicsElement(target)) {
            return getSVGContentRect(target);
        }
        return getHTMLElementContentRect(target);
    }
    /**
     * Creates rectangle with an interface of the DOMRectReadOnly.
     * Spec: https://drafts.fxtf.org/geometry/#domrectreadonly
     *
     * @param {DOMRectInit} rectInit - Object with rectangle's x/y coordinates and dimensions.
     * @returns {DOMRectReadOnly}
     */
    function createReadOnlyRect(_a) {
        var x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        // If DOMRectReadOnly is available use it as a prototype for the rectangle.
        var Constr = typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
        var rect = Object.create(Constr.prototype);
        // Rectangle's properties are not writable and non-enumerable.
        defineConfigurable(rect, {
            x: x, y: y, width: width, height: height,
            top: y,
            right: x + width,
            bottom: height + y,
            left: x
        });
        return rect;
    }
    /**
     * Creates DOMRectInit object based on the provided dimensions and the x/y coordinates.
     * Spec: https://drafts.fxtf.org/geometry/#dictdef-domrectinit
     *
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {number} width - Rectangle's width.
     * @param {number} height - Rectangle's height.
     * @returns {DOMRectInit}
     */
    function createRectInit(x, y, width, height) {
        return { x: x, y: y, width: width, height: height };
    }

    /**
     * Class that is responsible for computations of the content rectangle of
     * provided DOM element and for keeping track of it's changes.
     */
    var ResizeObservation = /** @class */ (function () {
        /**
         * Creates an instance of ResizeObservation.
         *
         * @param {Element} target - Element to be observed.
         */
        function ResizeObservation(target) {
            /**
             * Broadcasted width of content rectangle.
             *
             * @type {number}
             */
            this.broadcastWidth = 0;
            /**
             * Broadcasted height of content rectangle.
             *
             * @type {number}
             */
            this.broadcastHeight = 0;
            /**
             * Reference to the last observed content rectangle.
             *
             * @private {DOMRectInit}
             */
            this.contentRect_ = createRectInit(0, 0, 0, 0);
            this.target = target;
        }
        /**
         * Updates content rectangle and tells whether it's width or height properties
         * have changed since the last broadcast.
         *
         * @returns {boolean}
         */
        ResizeObservation.prototype.isActive = function () {
            var rect = getContentRect(this.target);
            this.contentRect_ = rect;
            return (rect.width !== this.broadcastWidth ||
                rect.height !== this.broadcastHeight);
        };
        /**
         * Updates 'broadcastWidth' and 'broadcastHeight' properties with a data
         * from the corresponding properties of the last observed content rectangle.
         *
         * @returns {DOMRectInit} Last observed content rectangle.
         */
        ResizeObservation.prototype.broadcastRect = function () {
            var rect = this.contentRect_;
            this.broadcastWidth = rect.width;
            this.broadcastHeight = rect.height;
            return rect;
        };
        return ResizeObservation;
    }());

    var ResizeObserverEntry = /** @class */ (function () {
        /**
         * Creates an instance of ResizeObserverEntry.
         *
         * @param {Element} target - Element that is being observed.
         * @param {DOMRectInit} rectInit - Data of the element's content rectangle.
         */
        function ResizeObserverEntry(target, rectInit) {
            var contentRect = createReadOnlyRect(rectInit);
            // According to the specification following properties are not writable
            // and are also not enumerable in the native implementation.
            //
            // Property accessors are not being used as they'd require to define a
            // private WeakMap storage which may cause memory leaks in browsers that
            // don't support this type of collections.
            defineConfigurable(this, { target: target, contentRect: contentRect });
        }
        return ResizeObserverEntry;
    }());

    var ResizeObserverSPI = /** @class */ (function () {
        /**
         * Creates a new instance of ResizeObserver.
         *
         * @param {ResizeObserverCallback} callback - Callback function that is invoked
         *      when one of the observed elements changes it's content dimensions.
         * @param {ResizeObserverController} controller - Controller instance which
         *      is responsible for the updates of observer.
         * @param {ResizeObserver} callbackCtx - Reference to the public
         *      ResizeObserver instance which will be passed to callback function.
         */
        function ResizeObserverSPI(callback, controller, callbackCtx) {
            /**
             * Collection of resize observations that have detected changes in dimensions
             * of elements.
             *
             * @private {Array<ResizeObservation>}
             */
            this.activeObservations_ = [];
            /**
             * Registry of the ResizeObservation instances.
             *
             * @private {Map<Element, ResizeObservation>}
             */
            this.observations_ = new MapShim();
            if (typeof callback !== 'function') {
                throw new TypeError('The callback provided as parameter 1 is not a function.');
            }
            this.callback_ = callback;
            this.controller_ = controller;
            this.callbackCtx_ = callbackCtx;
        }
        /**
         * Starts observing provided element.
         *
         * @param {Element} target - Element to be observed.
         * @returns {void}
         */
        ResizeObserverSPI.prototype.observe = function (target) {
            if (!arguments.length) {
                throw new TypeError('1 argument required, but only 0 present.');
            }
            // Do nothing if current environment doesn't have the Element interface.
            if (typeof Element === 'undefined' || !(Element instanceof Object)) {
                return;
            }
            if (!(target instanceof getWindowOf(target).Element)) {
                throw new TypeError('parameter 1 is not of type "Element".');
            }
            var observations = this.observations_;
            // Do nothing if element is already being observed.
            if (observations.has(target)) {
                return;
            }
            observations.set(target, new ResizeObservation(target));
            this.controller_.addObserver(this);
            // Force the update of observations.
            this.controller_.refresh();
        };
        /**
         * Stops observing provided element.
         *
         * @param {Element} target - Element to stop observing.
         * @returns {void}
         */
        ResizeObserverSPI.prototype.unobserve = function (target) {
            if (!arguments.length) {
                throw new TypeError('1 argument required, but only 0 present.');
            }
            // Do nothing if current environment doesn't have the Element interface.
            if (typeof Element === 'undefined' || !(Element instanceof Object)) {
                return;
            }
            if (!(target instanceof getWindowOf(target).Element)) {
                throw new TypeError('parameter 1 is not of type "Element".');
            }
            var observations = this.observations_;
            // Do nothing if element is not being observed.
            if (!observations.has(target)) {
                return;
            }
            observations.delete(target);
            if (!observations.size) {
                this.controller_.removeObserver(this);
            }
        };
        /**
         * Stops observing all elements.
         *
         * @returns {void}
         */
        ResizeObserverSPI.prototype.disconnect = function () {
            this.clearActive();
            this.observations_.clear();
            this.controller_.removeObserver(this);
        };
        /**
         * Collects observation instances the associated element of which has changed
         * it's content rectangle.
         *
         * @returns {void}
         */
        ResizeObserverSPI.prototype.gatherActive = function () {
            var _this = this;
            this.clearActive();
            this.observations_.forEach(function (observation) {
                if (observation.isActive()) {
                    _this.activeObservations_.push(observation);
                }
            });
        };
        /**
         * Invokes initial callback function with a list of ResizeObserverEntry
         * instances collected from active resize observations.
         *
         * @returns {void}
         */
        ResizeObserverSPI.prototype.broadcastActive = function () {
            // Do nothing if observer doesn't have active observations.
            if (!this.hasActive()) {
                return;
            }
            var ctx = this.callbackCtx_;
            // Create ResizeObserverEntry instance for every active observation.
            var entries = this.activeObservations_.map(function (observation) {
                return new ResizeObserverEntry(observation.target, observation.broadcastRect());
            });
            this.callback_.call(ctx, entries, ctx);
            this.clearActive();
        };
        /**
         * Clears the collection of active observations.
         *
         * @returns {void}
         */
        ResizeObserverSPI.prototype.clearActive = function () {
            this.activeObservations_.splice(0);
        };
        /**
         * Tells whether observer has active observations.
         *
         * @returns {boolean}
         */
        ResizeObserverSPI.prototype.hasActive = function () {
            return this.activeObservations_.length > 0;
        };
        return ResizeObserverSPI;
    }());

    // Registry of internal observers. If WeakMap is not available use current shim
    // for the Map collection as it has all required methods and because WeakMap
    // can't be fully polyfilled anyway.
    var observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new MapShim();
    /**
     * ResizeObserver API. Encapsulates the ResizeObserver SPI implementation
     * exposing only those methods and properties that are defined in the spec.
     */
    var ResizeObserver = /** @class */ (function () {
        /**
         * Creates a new instance of ResizeObserver.
         *
         * @param {ResizeObserverCallback} callback - Callback that is invoked when
         *      dimensions of the observed elements change.
         */
        function ResizeObserver(callback) {
            if (!(this instanceof ResizeObserver)) {
                throw new TypeError('Cannot call a class as a function.');
            }
            if (!arguments.length) {
                throw new TypeError('1 argument required, but only 0 present.');
            }
            var controller = ResizeObserverController.getInstance();
            var observer = new ResizeObserverSPI(callback, controller, this);
            observers.set(this, observer);
        }
        return ResizeObserver;
    }());
    // Expose public methods of ResizeObserver.
    [
        'observe',
        'unobserve',
        'disconnect'
    ].forEach(function (method) {
        ResizeObserver.prototype[method] = function () {
            var _a;
            return (_a = observers.get(this))[method].apply(_a, arguments);
        };
    });

    var index = (function () {
        // Export existing implementation if available.
        if (typeof global$1.ResizeObserver !== 'undefined') {
            return global$1.ResizeObserver;
        }
        return ResizeObserver;
    })();

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var Color_1 = createCommonjsModule(function (module, exports) {

    // http://dev.w3.org/csswg/css-color/

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var HEX3 = /^#([a-f0-9]{3})$/i;
    var hex3 = function hex3(value) {
        var match = value.match(HEX3);
        if (match) {
            return [parseInt(match[1][0] + match[1][0], 16), parseInt(match[1][1] + match[1][1], 16), parseInt(match[1][2] + match[1][2], 16), null];
        }
        return false;
    };

    var HEX6 = /^#([a-f0-9]{6})$/i;
    var hex6 = function hex6(value) {
        var match = value.match(HEX6);
        if (match) {
            return [parseInt(match[1].substring(0, 2), 16), parseInt(match[1].substring(2, 4), 16), parseInt(match[1].substring(4, 6), 16), null];
        }
        return false;
    };

    var RGB = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/;
    var rgb = function rgb(value) {
        var match = value.match(RGB);
        if (match) {
            return [Number(match[1]), Number(match[2]), Number(match[3]), null];
        }
        return false;
    };

    var RGBA = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d?\.?\d+)\s*\)$/;
    var rgba = function rgba(value) {
        var match = value.match(RGBA);
        if (match && match.length > 4) {
            return [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4])];
        }
        return false;
    };

    var fromArray = function fromArray(array) {
        return [Math.min(array[0], 255), Math.min(array[1], 255), Math.min(array[2], 255), array.length > 3 ? array[3] : null];
    };

    var namedColor = function namedColor(name) {
        var color = NAMED_COLORS[name.toLowerCase()];
        return color ? color : false;
    };

    var Color = function () {
        function Color(value) {
            _classCallCheck(this, Color);

            var _ref = Array.isArray(value) ? fromArray(value) : hex3(value) || rgb(value) || rgba(value) || namedColor(value) || hex6(value) || [0, 0, 0, null],
                _ref2 = _slicedToArray(_ref, 4),
                r = _ref2[0],
                g = _ref2[1],
                b = _ref2[2],
                a = _ref2[3];

            this.r = r;
            this.g = g;
            this.b = b;
            this.a = a;
        }

        _createClass(Color, [{
            key: 'isTransparent',
            value: function isTransparent() {
                return this.a === 0;
            }
        }, {
            key: 'toString',
            value: function toString() {
                return this.a !== null && this.a !== 1 ? 'rgba(' + this.r + ',' + this.g + ',' + this.b + ',' + this.a + ')' : 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
            }
        }]);

        return Color;
    }();

    exports.default = Color;


    var NAMED_COLORS = {
        transparent: [0, 0, 0, 0],
        aliceblue: [240, 248, 255, null],
        antiquewhite: [250, 235, 215, null],
        aqua: [0, 255, 255, null],
        aquamarine: [127, 255, 212, null],
        azure: [240, 255, 255, null],
        beige: [245, 245, 220, null],
        bisque: [255, 228, 196, null],
        black: [0, 0, 0, null],
        blanchedalmond: [255, 235, 205, null],
        blue: [0, 0, 255, null],
        blueviolet: [138, 43, 226, null],
        brown: [165, 42, 42, null],
        burlywood: [222, 184, 135, null],
        cadetblue: [95, 158, 160, null],
        chartreuse: [127, 255, 0, null],
        chocolate: [210, 105, 30, null],
        coral: [255, 127, 80, null],
        cornflowerblue: [100, 149, 237, null],
        cornsilk: [255, 248, 220, null],
        crimson: [220, 20, 60, null],
        cyan: [0, 255, 255, null],
        darkblue: [0, 0, 139, null],
        darkcyan: [0, 139, 139, null],
        darkgoldenrod: [184, 134, 11, null],
        darkgray: [169, 169, 169, null],
        darkgreen: [0, 100, 0, null],
        darkgrey: [169, 169, 169, null],
        darkkhaki: [189, 183, 107, null],
        darkmagenta: [139, 0, 139, null],
        darkolivegreen: [85, 107, 47, null],
        darkorange: [255, 140, 0, null],
        darkorchid: [153, 50, 204, null],
        darkred: [139, 0, 0, null],
        darksalmon: [233, 150, 122, null],
        darkseagreen: [143, 188, 143, null],
        darkslateblue: [72, 61, 139, null],
        darkslategray: [47, 79, 79, null],
        darkslategrey: [47, 79, 79, null],
        darkturquoise: [0, 206, 209, null],
        darkviolet: [148, 0, 211, null],
        deeppink: [255, 20, 147, null],
        deepskyblue: [0, 191, 255, null],
        dimgray: [105, 105, 105, null],
        dimgrey: [105, 105, 105, null],
        dodgerblue: [30, 144, 255, null],
        firebrick: [178, 34, 34, null],
        floralwhite: [255, 250, 240, null],
        forestgreen: [34, 139, 34, null],
        fuchsia: [255, 0, 255, null],
        gainsboro: [220, 220, 220, null],
        ghostwhite: [248, 248, 255, null],
        gold: [255, 215, 0, null],
        goldenrod: [218, 165, 32, null],
        gray: [128, 128, 128, null],
        green: [0, 128, 0, null],
        greenyellow: [173, 255, 47, null],
        grey: [128, 128, 128, null],
        honeydew: [240, 255, 240, null],
        hotpink: [255, 105, 180, null],
        indianred: [205, 92, 92, null],
        indigo: [75, 0, 130, null],
        ivory: [255, 255, 240, null],
        khaki: [240, 230, 140, null],
        lavender: [230, 230, 250, null],
        lavenderblush: [255, 240, 245, null],
        lawngreen: [124, 252, 0, null],
        lemonchiffon: [255, 250, 205, null],
        lightblue: [173, 216, 230, null],
        lightcoral: [240, 128, 128, null],
        lightcyan: [224, 255, 255, null],
        lightgoldenrodyellow: [250, 250, 210, null],
        lightgray: [211, 211, 211, null],
        lightgreen: [144, 238, 144, null],
        lightgrey: [211, 211, 211, null],
        lightpink: [255, 182, 193, null],
        lightsalmon: [255, 160, 122, null],
        lightseagreen: [32, 178, 170, null],
        lightskyblue: [135, 206, 250, null],
        lightslategray: [119, 136, 153, null],
        lightslategrey: [119, 136, 153, null],
        lightsteelblue: [176, 196, 222, null],
        lightyellow: [255, 255, 224, null],
        lime: [0, 255, 0, null],
        limegreen: [50, 205, 50, null],
        linen: [250, 240, 230, null],
        magenta: [255, 0, 255, null],
        maroon: [128, 0, 0, null],
        mediumaquamarine: [102, 205, 170, null],
        mediumblue: [0, 0, 205, null],
        mediumorchid: [186, 85, 211, null],
        mediumpurple: [147, 112, 219, null],
        mediumseagreen: [60, 179, 113, null],
        mediumslateblue: [123, 104, 238, null],
        mediumspringgreen: [0, 250, 154, null],
        mediumturquoise: [72, 209, 204, null],
        mediumvioletred: [199, 21, 133, null],
        midnightblue: [25, 25, 112, null],
        mintcream: [245, 255, 250, null],
        mistyrose: [255, 228, 225, null],
        moccasin: [255, 228, 181, null],
        navajowhite: [255, 222, 173, null],
        navy: [0, 0, 128, null],
        oldlace: [253, 245, 230, null],
        olive: [128, 128, 0, null],
        olivedrab: [107, 142, 35, null],
        orange: [255, 165, 0, null],
        orangered: [255, 69, 0, null],
        orchid: [218, 112, 214, null],
        palegoldenrod: [238, 232, 170, null],
        palegreen: [152, 251, 152, null],
        paleturquoise: [175, 238, 238, null],
        palevioletred: [219, 112, 147, null],
        papayawhip: [255, 239, 213, null],
        peachpuff: [255, 218, 185, null],
        peru: [205, 133, 63, null],
        pink: [255, 192, 203, null],
        plum: [221, 160, 221, null],
        powderblue: [176, 224, 230, null],
        purple: [128, 0, 128, null],
        rebeccapurple: [102, 51, 153, null],
        red: [255, 0, 0, null],
        rosybrown: [188, 143, 143, null],
        royalblue: [65, 105, 225, null],
        saddlebrown: [139, 69, 19, null],
        salmon: [250, 128, 114, null],
        sandybrown: [244, 164, 96, null],
        seagreen: [46, 139, 87, null],
        seashell: [255, 245, 238, null],
        sienna: [160, 82, 45, null],
        silver: [192, 192, 192, null],
        skyblue: [135, 206, 235, null],
        slateblue: [106, 90, 205, null],
        slategray: [112, 128, 144, null],
        slategrey: [112, 128, 144, null],
        snow: [255, 250, 250, null],
        springgreen: [0, 255, 127, null],
        steelblue: [70, 130, 180, null],
        tan: [210, 180, 140, null],
        teal: [0, 128, 128, null],
        thistle: [216, 191, 216, null],
        tomato: [255, 99, 71, null],
        turquoise: [64, 224, 208, null],
        violet: [238, 130, 238, null],
        wheat: [245, 222, 179, null],
        white: [255, 255, 255, null],
        whitesmoke: [245, 245, 245, null],
        yellow: [255, 255, 0, null],
        yellowgreen: [154, 205, 50, null]
    };

    var TRANSPARENT = exports.TRANSPARENT = new Color([0, 0, 0, 0]);
    });

    unwrapExports(Color_1);
    var Color_2 = Color_1.TRANSPARENT;

    var Util = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var contains = exports.contains = function contains(bit, value) {
        return (bit & value) !== 0;
    };

    var distance = exports.distance = function distance(a, b) {
        return Math.sqrt(a * a + b * b);
    };

    var copyCSSStyles = exports.copyCSSStyles = function copyCSSStyles(style, target) {
        // Edge does not provide value for cssText
        for (var i = style.length - 1; i >= 0; i--) {
            var property = style.item(i);
            // Safari shows pseudoelements if content is set
            if (property !== 'content') {
                target.style.setProperty(property, style.getPropertyValue(property));
            }
        }
        return target;
    };

    var SMALL_IMAGE = exports.SMALL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    });

    unwrapExports(Util);
    var Util_1 = Util.contains;
    var Util_2 = Util.distance;
    var Util_3 = Util.copyCSSStyles;
    var Util_4 = Util.SMALL_IMAGE;

    var Length_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var LENGTH_TYPE = exports.LENGTH_TYPE = {
        PX: 0,
        PERCENTAGE: 1
    };

    var Length = function () {
        function Length(value) {
            _classCallCheck(this, Length);

            this.type = value.substr(value.length - 1) === '%' ? LENGTH_TYPE.PERCENTAGE : LENGTH_TYPE.PX;
            var parsedValue = parseFloat(value);
            this.value = isNaN(parsedValue) ? 0 : parsedValue;
        }

        _createClass(Length, [{
            key: 'isPercentage',
            value: function isPercentage() {
                return this.type === LENGTH_TYPE.PERCENTAGE;
            }
        }, {
            key: 'getAbsoluteValue',
            value: function getAbsoluteValue(parentLength) {
                return this.isPercentage() ? parentLength * (this.value / 100) : this.value;
            }
        }], [{
            key: 'create',
            value: function create(v) {
                return new Length(v);
            }
        }]);

        return Length;
    }();

    exports.default = Length;


    var getRootFontSize = function getRootFontSize(container) {
        var parent = container.parent;
        return parent ? getRootFontSize(parent) : parseFloat(container.style.font.fontSize);
    };

    var calculateLengthFromValueWithUnit = exports.calculateLengthFromValueWithUnit = function calculateLengthFromValueWithUnit(container, value, unit) {
        switch (unit) {
            case 'px':
            case '%':
                return new Length(value + unit);
            case 'em':
            case 'rem':
                var length = new Length(value);
                length.value *= unit === 'em' ? parseFloat(container.style.font.fontSize) : getRootFontSize(container);
                return length;
            default:
                // TODO: handle correctly if unknown unit is used
                return new Length('0');
        }
    };
    });

    unwrapExports(Length_1);
    var Length_2 = Length_1.LENGTH_TYPE;
    var Length_3 = Length_1.calculateLengthFromValueWithUnit;

    var Size_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Size = function Size(width, height) {
        _classCallCheck(this, Size);

        this.width = width;
        this.height = height;
    };

    exports.default = Size;
    });

    unwrapExports(Size_1);

    var Path = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var PATH = exports.PATH = {
        VECTOR: 0,
        BEZIER_CURVE: 1,
        CIRCLE: 2
    };
    });

    unwrapExports(Path);
    var Path_1 = Path.PATH;

    var Vector_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });



    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Vector = function Vector(x, y) {
        _classCallCheck(this, Vector);

        this.type = Path.PATH.VECTOR;
        this.x = x;
        this.y = y;
    };

    exports.default = Vector;
    });

    unwrapExports(Vector_1);

    var BezierCurve_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();





    var _Vector2 = _interopRequireDefault(Vector_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var lerp = function lerp(a, b, t) {
        return new _Vector2.default(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    };

    var BezierCurve = function () {
        function BezierCurve(start, startControl, endControl, end) {
            _classCallCheck(this, BezierCurve);

            this.type = Path.PATH.BEZIER_CURVE;
            this.start = start;
            this.startControl = startControl;
            this.endControl = endControl;
            this.end = end;
        }

        _createClass(BezierCurve, [{
            key: 'subdivide',
            value: function subdivide(t, firstHalf) {
                var ab = lerp(this.start, this.startControl, t);
                var bc = lerp(this.startControl, this.endControl, t);
                var cd = lerp(this.endControl, this.end, t);
                var abbc = lerp(ab, bc, t);
                var bccd = lerp(bc, cd, t);
                var dest = lerp(abbc, bccd, t);
                return firstHalf ? new BezierCurve(this.start, ab, abbc, dest) : new BezierCurve(dest, bccd, cd, this.end);
            }
        }, {
            key: 'reverse',
            value: function reverse() {
                return new BezierCurve(this.end, this.endControl, this.startControl, this.start);
            }
        }]);

        return BezierCurve;
    }();

    exports.default = BezierCurve;
    });

    unwrapExports(BezierCurve_1);

    var Bounds_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseBoundCurves = exports.calculatePaddingBoxPath = exports.calculateBorderBoxPath = exports.parsePathForBorder = exports.parseDocumentSize = exports.calculateContentBox = exports.calculatePaddingBox = exports.parseBounds = exports.Bounds = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



    var _Vector2 = _interopRequireDefault(Vector_1);



    var _BezierCurve2 = _interopRequireDefault(BezierCurve_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var TOP = 0;
    var RIGHT = 1;
    var BOTTOM = 2;
    var LEFT = 3;

    var H = 0;
    var V = 1;

    var Bounds = exports.Bounds = function () {
        function Bounds(x, y, w, h) {
            _classCallCheck(this, Bounds);

            this.left = x;
            this.top = y;
            this.width = w;
            this.height = h;
        }

        _createClass(Bounds, null, [{
            key: 'fromClientRect',
            value: function fromClientRect(clientRect, scrollX, scrollY) {
                return new Bounds(clientRect.left + scrollX, clientRect.top + scrollY, clientRect.width, clientRect.height);
            }
        }]);

        return Bounds;
    }();

    var parseBounds = exports.parseBounds = function parseBounds(node, scrollX, scrollY) {
        return Bounds.fromClientRect(node.getBoundingClientRect(), scrollX, scrollY);
    };

    var calculatePaddingBox = exports.calculatePaddingBox = function calculatePaddingBox(bounds, borders) {
        return new Bounds(bounds.left + borders[LEFT].borderWidth, bounds.top + borders[TOP].borderWidth, bounds.width - (borders[RIGHT].borderWidth + borders[LEFT].borderWidth), bounds.height - (borders[TOP].borderWidth + borders[BOTTOM].borderWidth));
    };

    var calculateContentBox = exports.calculateContentBox = function calculateContentBox(bounds, padding, borders) {
        // TODO support percentage paddings
        var paddingTop = padding[TOP].value;
        var paddingRight = padding[RIGHT].value;
        var paddingBottom = padding[BOTTOM].value;
        var paddingLeft = padding[LEFT].value;

        return new Bounds(bounds.left + paddingLeft + borders[LEFT].borderWidth, bounds.top + paddingTop + borders[TOP].borderWidth, bounds.width - (borders[RIGHT].borderWidth + borders[LEFT].borderWidth + paddingLeft + paddingRight), bounds.height - (borders[TOP].borderWidth + borders[BOTTOM].borderWidth + paddingTop + paddingBottom));
    };

    var parseDocumentSize = exports.parseDocumentSize = function parseDocumentSize(document) {
        var body = document.body;
        var documentElement = document.documentElement;

        if (!body || !documentElement) {
            throw new Error('');
        }
        var width = Math.max(Math.max(body.scrollWidth, documentElement.scrollWidth), Math.max(body.offsetWidth, documentElement.offsetWidth), Math.max(body.clientWidth, documentElement.clientWidth));

        var height = Math.max(Math.max(body.scrollHeight, documentElement.scrollHeight), Math.max(body.offsetHeight, documentElement.offsetHeight), Math.max(body.clientHeight, documentElement.clientHeight));

        return new Bounds(0, 0, width, height);
    };

    var parsePathForBorder = exports.parsePathForBorder = function parsePathForBorder(curves, borderSide) {
        switch (borderSide) {
            case TOP:
                return createPathFromCurves(curves.topLeftOuter, curves.topLeftInner, curves.topRightOuter, curves.topRightInner);
            case RIGHT:
                return createPathFromCurves(curves.topRightOuter, curves.topRightInner, curves.bottomRightOuter, curves.bottomRightInner);
            case BOTTOM:
                return createPathFromCurves(curves.bottomRightOuter, curves.bottomRightInner, curves.bottomLeftOuter, curves.bottomLeftInner);
            case LEFT:
            default:
                return createPathFromCurves(curves.bottomLeftOuter, curves.bottomLeftInner, curves.topLeftOuter, curves.topLeftInner);
        }
    };

    var createPathFromCurves = function createPathFromCurves(outer1, inner1, outer2, inner2) {
        var path = [];
        if (outer1 instanceof _BezierCurve2.default) {
            path.push(outer1.subdivide(0.5, false));
        } else {
            path.push(outer1);
        }

        if (outer2 instanceof _BezierCurve2.default) {
            path.push(outer2.subdivide(0.5, true));
        } else {
            path.push(outer2);
        }

        if (inner2 instanceof _BezierCurve2.default) {
            path.push(inner2.subdivide(0.5, true).reverse());
        } else {
            path.push(inner2);
        }

        if (inner1 instanceof _BezierCurve2.default) {
            path.push(inner1.subdivide(0.5, false).reverse());
        } else {
            path.push(inner1);
        }

        return path;
    };

    var calculateBorderBoxPath = exports.calculateBorderBoxPath = function calculateBorderBoxPath(curves) {
        return [curves.topLeftOuter, curves.topRightOuter, curves.bottomRightOuter, curves.bottomLeftOuter];
    };

    var calculatePaddingBoxPath = exports.calculatePaddingBoxPath = function calculatePaddingBoxPath(curves) {
        return [curves.topLeftInner, curves.topRightInner, curves.bottomRightInner, curves.bottomLeftInner];
    };

    var parseBoundCurves = exports.parseBoundCurves = function parseBoundCurves(bounds, borders, borderRadius) {
        var tlh = borderRadius[CORNER.TOP_LEFT][H].getAbsoluteValue(bounds.width);
        var tlv = borderRadius[CORNER.TOP_LEFT][V].getAbsoluteValue(bounds.height);
        var trh = borderRadius[CORNER.TOP_RIGHT][H].getAbsoluteValue(bounds.width);
        var trv = borderRadius[CORNER.TOP_RIGHT][V].getAbsoluteValue(bounds.height);
        var brh = borderRadius[CORNER.BOTTOM_RIGHT][H].getAbsoluteValue(bounds.width);
        var brv = borderRadius[CORNER.BOTTOM_RIGHT][V].getAbsoluteValue(bounds.height);
        var blh = borderRadius[CORNER.BOTTOM_LEFT][H].getAbsoluteValue(bounds.width);
        var blv = borderRadius[CORNER.BOTTOM_LEFT][V].getAbsoluteValue(bounds.height);

        var factors = [];
        factors.push((tlh + trh) / bounds.width);
        factors.push((blh + brh) / bounds.width);
        factors.push((tlv + blv) / bounds.height);
        factors.push((trv + brv) / bounds.height);
        var maxFactor = Math.max.apply(Math, factors);

        if (maxFactor > 1) {
            tlh /= maxFactor;
            tlv /= maxFactor;
            trh /= maxFactor;
            trv /= maxFactor;
            brh /= maxFactor;
            brv /= maxFactor;
            blh /= maxFactor;
            blv /= maxFactor;
        }

        var topWidth = bounds.width - trh;
        var rightHeight = bounds.height - brv;
        var bottomWidth = bounds.width - brh;
        var leftHeight = bounds.height - blv;

        return {
            topLeftOuter: tlh > 0 || tlv > 0 ? getCurvePoints(bounds.left, bounds.top, tlh, tlv, CORNER.TOP_LEFT) : new _Vector2.default(bounds.left, bounds.top),
            topLeftInner: tlh > 0 || tlv > 0 ? getCurvePoints(bounds.left + borders[LEFT].borderWidth, bounds.top + borders[TOP].borderWidth, Math.max(0, tlh - borders[LEFT].borderWidth), Math.max(0, tlv - borders[TOP].borderWidth), CORNER.TOP_LEFT) : new _Vector2.default(bounds.left + borders[LEFT].borderWidth, bounds.top + borders[TOP].borderWidth),
            topRightOuter: trh > 0 || trv > 0 ? getCurvePoints(bounds.left + topWidth, bounds.top, trh, trv, CORNER.TOP_RIGHT) : new _Vector2.default(bounds.left + bounds.width, bounds.top),
            topRightInner: trh > 0 || trv > 0 ? getCurvePoints(bounds.left + Math.min(topWidth, bounds.width + borders[LEFT].borderWidth), bounds.top + borders[TOP].borderWidth, topWidth > bounds.width + borders[LEFT].borderWidth ? 0 : trh - borders[LEFT].borderWidth, trv - borders[TOP].borderWidth, CORNER.TOP_RIGHT) : new _Vector2.default(bounds.left + bounds.width - borders[RIGHT].borderWidth, bounds.top + borders[TOP].borderWidth),
            bottomRightOuter: brh > 0 || brv > 0 ? getCurvePoints(bounds.left + bottomWidth, bounds.top + rightHeight, brh, brv, CORNER.BOTTOM_RIGHT) : new _Vector2.default(bounds.left + bounds.width, bounds.top + bounds.height),
            bottomRightInner: brh > 0 || brv > 0 ? getCurvePoints(bounds.left + Math.min(bottomWidth, bounds.width - borders[LEFT].borderWidth), bounds.top + Math.min(rightHeight, bounds.height + borders[TOP].borderWidth), Math.max(0, brh - borders[RIGHT].borderWidth), brv - borders[BOTTOM].borderWidth, CORNER.BOTTOM_RIGHT) : new _Vector2.default(bounds.left + bounds.width - borders[RIGHT].borderWidth, bounds.top + bounds.height - borders[BOTTOM].borderWidth),
            bottomLeftOuter: blh > 0 || blv > 0 ? getCurvePoints(bounds.left, bounds.top + leftHeight, blh, blv, CORNER.BOTTOM_LEFT) : new _Vector2.default(bounds.left, bounds.top + bounds.height),
            bottomLeftInner: blh > 0 || blv > 0 ? getCurvePoints(bounds.left + borders[LEFT].borderWidth, bounds.top + leftHeight, Math.max(0, blh - borders[LEFT].borderWidth), blv - borders[BOTTOM].borderWidth, CORNER.BOTTOM_LEFT) : new _Vector2.default(bounds.left + borders[LEFT].borderWidth, bounds.top + bounds.height - borders[BOTTOM].borderWidth)
        };
    };

    var CORNER = {
        TOP_LEFT: 0,
        TOP_RIGHT: 1,
        BOTTOM_RIGHT: 2,
        BOTTOM_LEFT: 3
    };

    var getCurvePoints = function getCurvePoints(x, y, r1, r2, position) {
        var kappa = 4 * ((Math.sqrt(2) - 1) / 3);
        var ox = r1 * kappa; // control point offset horizontal
        var oy = r2 * kappa; // control point offset vertical
        var xm = x + r1; // x-middle
        var ym = y + r2; // y-middle

        switch (position) {
            case CORNER.TOP_LEFT:
                return new _BezierCurve2.default(new _Vector2.default(x, ym), new _Vector2.default(x, ym - oy), new _Vector2.default(xm - ox, y), new _Vector2.default(xm, y));
            case CORNER.TOP_RIGHT:
                return new _BezierCurve2.default(new _Vector2.default(x, y), new _Vector2.default(x + ox, y), new _Vector2.default(xm, ym - oy), new _Vector2.default(xm, ym));
            case CORNER.BOTTOM_RIGHT:
                return new _BezierCurve2.default(new _Vector2.default(xm, y), new _Vector2.default(xm, y + oy), new _Vector2.default(x + ox, ym), new _Vector2.default(x, ym));
            case CORNER.BOTTOM_LEFT:
            default:
                return new _BezierCurve2.default(new _Vector2.default(xm, ym), new _Vector2.default(xm - ox, ym), new _Vector2.default(x, y + oy), new _Vector2.default(x, y));
        }
    };
    });

    unwrapExports(Bounds_1);
    var Bounds_2 = Bounds_1.parseBoundCurves;
    var Bounds_3 = Bounds_1.calculatePaddingBoxPath;
    var Bounds_4 = Bounds_1.calculateBorderBoxPath;
    var Bounds_5 = Bounds_1.parsePathForBorder;
    var Bounds_6 = Bounds_1.parseDocumentSize;
    var Bounds_7 = Bounds_1.calculateContentBox;
    var Bounds_8 = Bounds_1.calculatePaddingBox;
    var Bounds_9 = Bounds_1.parseBounds;
    var Bounds_10 = Bounds_1.Bounds;

    var padding = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parsePadding = exports.PADDING_SIDES = undefined;



    var _Length2 = _interopRequireDefault(Length_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var PADDING_SIDES = exports.PADDING_SIDES = {
        TOP: 0,
        RIGHT: 1,
        BOTTOM: 2,
        LEFT: 3
    };

    var SIDES = ['top', 'right', 'bottom', 'left'];

    var parsePadding = exports.parsePadding = function parsePadding(style) {
        return SIDES.map(function (side) {
            return new _Length2.default(style.getPropertyValue('padding-' + side));
        });
    };
    });

    unwrapExports(padding);
    var padding_1 = padding.parsePadding;
    var padding_2 = padding.PADDING_SIDES;

    var background = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseBackgroundImage = exports.parseBackground = exports.calculateBackgroundRepeatPath = exports.calculateBackgroundPosition = exports.calculateBackgroungPositioningArea = exports.calculateBackgroungPaintingArea = exports.calculateGradientBackgroundSize = exports.calculateBackgroundSize = exports.BACKGROUND_ORIGIN = exports.BACKGROUND_CLIP = exports.BACKGROUND_SIZE = exports.BACKGROUND_REPEAT = undefined;



    var _Color2 = _interopRequireDefault(Color_1);



    var _Length2 = _interopRequireDefault(Length_1);



    var _Size2 = _interopRequireDefault(Size_1);



    var _Vector2 = _interopRequireDefault(Vector_1);





    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var BACKGROUND_REPEAT = exports.BACKGROUND_REPEAT = {
        REPEAT: 0,
        NO_REPEAT: 1,
        REPEAT_X: 2,
        REPEAT_Y: 3
    };

    var BACKGROUND_SIZE = exports.BACKGROUND_SIZE = {
        AUTO: 0,
        CONTAIN: 1,
        COVER: 2,
        LENGTH: 3
    };

    var BACKGROUND_CLIP = exports.BACKGROUND_CLIP = {
        BORDER_BOX: 0,
        PADDING_BOX: 1,
        CONTENT_BOX: 2
    };

    var BACKGROUND_ORIGIN = exports.BACKGROUND_ORIGIN = BACKGROUND_CLIP;

    var AUTO = 'auto';

    var BackgroundSize = function BackgroundSize(size) {
        _classCallCheck(this, BackgroundSize);

        switch (size) {
            case 'contain':
                this.size = BACKGROUND_SIZE.CONTAIN;
                break;
            case 'cover':
                this.size = BACKGROUND_SIZE.COVER;
                break;
            case 'auto':
                this.size = BACKGROUND_SIZE.AUTO;
                break;
            default:
                this.value = new _Length2.default(size);
        }
    };

    var calculateBackgroundSize = exports.calculateBackgroundSize = function calculateBackgroundSize(backgroundImage, image, bounds) {
        var width = 0;
        var height = 0;
        var size = backgroundImage.size;
        if (size[0].size === BACKGROUND_SIZE.CONTAIN || size[0].size === BACKGROUND_SIZE.COVER) {
            var targetRatio = bounds.width / bounds.height;
            var currentRatio = image.width / image.height;
            return targetRatio < currentRatio !== (size[0].size === BACKGROUND_SIZE.COVER) ? new _Size2.default(bounds.width, bounds.width / currentRatio) : new _Size2.default(bounds.height * currentRatio, bounds.height);
        }

        if (size[0].value) {
            width = size[0].value.getAbsoluteValue(bounds.width);
        }

        if (size[0].size === BACKGROUND_SIZE.AUTO && size[1].size === BACKGROUND_SIZE.AUTO) {
            height = image.height;
        } else if (size[1].size === BACKGROUND_SIZE.AUTO) {
            height = width / image.width * image.height;
        } else if (size[1].value) {
            height = size[1].value.getAbsoluteValue(bounds.height);
        }

        if (size[0].size === BACKGROUND_SIZE.AUTO) {
            width = height / image.height * image.width;
        }

        return new _Size2.default(width, height);
    };

    var calculateGradientBackgroundSize = exports.calculateGradientBackgroundSize = function calculateGradientBackgroundSize(backgroundImage, bounds) {
        var size = backgroundImage.size;
        var width = size[0].value ? size[0].value.getAbsoluteValue(bounds.width) : bounds.width;
        var height = size[1].value ? size[1].value.getAbsoluteValue(bounds.height) : size[0].value ? width : bounds.height;

        return new _Size2.default(width, height);
    };

    var AUTO_SIZE = new BackgroundSize(AUTO);

    var calculateBackgroungPaintingArea = exports.calculateBackgroungPaintingArea = function calculateBackgroungPaintingArea(curves, clip) {
        switch (clip) {
            case BACKGROUND_CLIP.BORDER_BOX:
                return (0, Bounds_1.calculateBorderBoxPath)(curves);
            case BACKGROUND_CLIP.PADDING_BOX:
            default:
                return (0, Bounds_1.calculatePaddingBoxPath)(curves);
        }
    };

    var calculateBackgroungPositioningArea = exports.calculateBackgroungPositioningArea = function calculateBackgroungPositioningArea(backgroundOrigin, bounds, padding$$1, border) {
        var paddingBox = (0, Bounds_1.calculatePaddingBox)(bounds, border);

        switch (backgroundOrigin) {
            case BACKGROUND_ORIGIN.BORDER_BOX:
                return bounds;
            case BACKGROUND_ORIGIN.CONTENT_BOX:
                var paddingLeft = padding$$1[padding.PADDING_SIDES.LEFT].getAbsoluteValue(bounds.width);
                var paddingRight = padding$$1[padding.PADDING_SIDES.RIGHT].getAbsoluteValue(bounds.width);
                var paddingTop = padding$$1[padding.PADDING_SIDES.TOP].getAbsoluteValue(bounds.width);
                var paddingBottom = padding$$1[padding.PADDING_SIDES.BOTTOM].getAbsoluteValue(bounds.width);
                return new Bounds_1.Bounds(paddingBox.left + paddingLeft, paddingBox.top + paddingTop, paddingBox.width - paddingLeft - paddingRight, paddingBox.height - paddingTop - paddingBottom);
            case BACKGROUND_ORIGIN.PADDING_BOX:
            default:
                return paddingBox;
        }
    };

    var calculateBackgroundPosition = exports.calculateBackgroundPosition = function calculateBackgroundPosition(position, size, bounds) {
        return new _Vector2.default(position[0].getAbsoluteValue(bounds.width - size.width), position[1].getAbsoluteValue(bounds.height - size.height));
    };

    var calculateBackgroundRepeatPath = exports.calculateBackgroundRepeatPath = function calculateBackgroundRepeatPath(background, position, size, backgroundPositioningArea, bounds) {
        var repeat = background.repeat;
        switch (repeat) {
            case BACKGROUND_REPEAT.REPEAT_X:
                return [new _Vector2.default(Math.round(bounds.left), Math.round(backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(bounds.left + bounds.width), Math.round(backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(bounds.left + bounds.width), Math.round(size.height + backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(bounds.left), Math.round(size.height + backgroundPositioningArea.top + position.y))];
            case BACKGROUND_REPEAT.REPEAT_Y:
                return [new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x), Math.round(bounds.top)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x + size.width), Math.round(bounds.top)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x + size.width), Math.round(bounds.height + bounds.top)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x), Math.round(bounds.height + bounds.top))];
            case BACKGROUND_REPEAT.NO_REPEAT:
                return [new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x), Math.round(backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x + size.width), Math.round(backgroundPositioningArea.top + position.y)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x + size.width), Math.round(backgroundPositioningArea.top + position.y + size.height)), new _Vector2.default(Math.round(backgroundPositioningArea.left + position.x), Math.round(backgroundPositioningArea.top + position.y + size.height))];
            default:
                return [new _Vector2.default(Math.round(bounds.left), Math.round(bounds.top)), new _Vector2.default(Math.round(bounds.left + bounds.width), Math.round(bounds.top)), new _Vector2.default(Math.round(bounds.left + bounds.width), Math.round(bounds.height + bounds.top)), new _Vector2.default(Math.round(bounds.left), Math.round(bounds.height + bounds.top))];
        }
    };

    var parseBackground = exports.parseBackground = function parseBackground(style, resourceLoader) {
        return {
            backgroundColor: new _Color2.default(style.backgroundColor),
            backgroundImage: parseBackgroundImages(style, resourceLoader),
            backgroundClip: parseBackgroundClip(style.backgroundClip),
            backgroundOrigin: parseBackgroundOrigin(style.backgroundOrigin)
        };
    };

    var parseBackgroundClip = function parseBackgroundClip(backgroundClip) {
        switch (backgroundClip) {
            case 'padding-box':
                return BACKGROUND_CLIP.PADDING_BOX;
            case 'content-box':
                return BACKGROUND_CLIP.CONTENT_BOX;
        }
        return BACKGROUND_CLIP.BORDER_BOX;
    };

    var parseBackgroundOrigin = function parseBackgroundOrigin(backgroundOrigin) {
        switch (backgroundOrigin) {
            case 'padding-box':
                return BACKGROUND_ORIGIN.PADDING_BOX;
            case 'content-box':
                return BACKGROUND_ORIGIN.CONTENT_BOX;
        }
        return BACKGROUND_ORIGIN.BORDER_BOX;
    };

    var parseBackgroundRepeat = function parseBackgroundRepeat(backgroundRepeat) {
        switch (backgroundRepeat.trim()) {
            case 'no-repeat':
                return BACKGROUND_REPEAT.NO_REPEAT;
            case 'repeat-x':
            case 'repeat no-repeat':
                return BACKGROUND_REPEAT.REPEAT_X;
            case 'repeat-y':
            case 'no-repeat repeat':
                return BACKGROUND_REPEAT.REPEAT_Y;
            case 'repeat':
                return BACKGROUND_REPEAT.REPEAT;
        }

        return BACKGROUND_REPEAT.REPEAT;
    };

    var parseBackgroundImages = function parseBackgroundImages(style, resourceLoader) {
        var sources = parseBackgroundImage(style.backgroundImage).map(function (backgroundImage) {
            if (backgroundImage.method === 'url') {
                var key = resourceLoader.loadImage(backgroundImage.args[0]);
                backgroundImage.args = key ? [key] : [];
            }
            return backgroundImage;
        });
        var positions = style.backgroundPosition.split(',');
        var repeats = style.backgroundRepeat.split(',');
        var sizes = style.backgroundSize.split(',');

        return sources.map(function (source, index) {
            var size = (sizes[index] || AUTO).trim().split(' ').map(parseBackgroundSize);
            var position = (positions[index] || AUTO).trim().split(' ').map(parseBackgoundPosition);

            return {
                source: source,
                repeat: parseBackgroundRepeat(typeof repeats[index] === 'string' ? repeats[index] : repeats[0]),
                size: size.length < 2 ? [size[0], AUTO_SIZE] : [size[0], size[1]],
                position: position.length < 2 ? [position[0], position[0]] : [position[0], position[1]]
            };
        });
    };

    var parseBackgroundSize = function parseBackgroundSize(size) {
        return size === 'auto' ? AUTO_SIZE : new BackgroundSize(size);
    };

    var parseBackgoundPosition = function parseBackgoundPosition(position) {
        switch (position) {
            case 'bottom':
            case 'right':
                return new _Length2.default('100%');
            case 'left':
            case 'top':
                return new _Length2.default('0%');
            case 'auto':
                return new _Length2.default('0');
        }
        return new _Length2.default(position);
    };

    var parseBackgroundImage = exports.parseBackgroundImage = function parseBackgroundImage(image) {
        var whitespace = /^\s$/;
        var results = [];

        var args = [];
        var method = '';
        var quote = null;
        var definition = '';
        var mode = 0;
        var numParen = 0;

        var appendResult = function appendResult() {
            var prefix = '';
            if (method) {
                if (definition.substr(0, 1) === '"') {
                    definition = definition.substr(1, definition.length - 2);
                }

                if (definition) {
                    args.push(definition.trim());
                }

                var prefix_i = method.indexOf('-', 1) + 1;
                if (method.substr(0, 1) === '-' && prefix_i > 0) {
                    prefix = method.substr(0, prefix_i).toLowerCase();
                    method = method.substr(prefix_i);
                }
                method = method.toLowerCase();
                if (method !== 'none') {
                    results.push({
                        prefix: prefix,
                        method: method,
                        args: args
                    });
                }
            }
            args = [];
            method = definition = '';
        };

        image.split('').forEach(function (c) {
            if (mode === 0 && whitespace.test(c)) {
                return;
            }
            switch (c) {
                case '"':
                    if (!quote) {
                        quote = c;
                    } else if (quote === c) {
                        quote = null;
                    }
                    break;
                case '(':
                    if (quote) {
                        break;
                    } else if (mode === 0) {
                        mode = 1;
                        return;
                    } else {
                        numParen++;
                    }
                    break;
                case ')':
                    if (quote) {
                        break;
                    } else if (mode === 1) {
                        if (numParen === 0) {
                            mode = 0;
                            appendResult();
                            return;
                        } else {
                            numParen--;
                        }
                    }
                    break;

                case ',':
                    if (quote) {
                        break;
                    } else if (mode === 0) {
                        appendResult();
                        return;
                    } else if (mode === 1) {
                        if (numParen === 0 && !method.match(/^url$/i)) {
                            args.push(definition.trim());
                            definition = '';
                            return;
                        }
                    }
                    break;
            }

            if (mode === 0) {
                method += c;
            } else {
                definition += c;
            }
        });

        appendResult();
        return results;
    };
    });

    unwrapExports(background);
    var background_1 = background.parseBackgroundImage;
    var background_2 = background.parseBackground;
    var background_3 = background.calculateBackgroundRepeatPath;
    var background_4 = background.calculateBackgroundPosition;
    var background_5 = background.calculateBackgroungPositioningArea;
    var background_6 = background.calculateBackgroungPaintingArea;
    var background_7 = background.calculateGradientBackgroundSize;
    var background_8 = background.calculateBackgroundSize;
    var background_9 = background.BACKGROUND_ORIGIN;
    var background_10 = background.BACKGROUND_CLIP;
    var background_11 = background.BACKGROUND_SIZE;
    var background_12 = background.BACKGROUND_REPEAT;

    var border = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseBorder = exports.BORDER_SIDES = exports.BORDER_STYLE = undefined;



    var _Color2 = _interopRequireDefault(Color_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var BORDER_STYLE = exports.BORDER_STYLE = {
        NONE: 0,
        SOLID: 1
    };

    var BORDER_SIDES = exports.BORDER_SIDES = {
        TOP: 0,
        RIGHT: 1,
        BOTTOM: 2,
        LEFT: 3
    };

    var SIDES = Object.keys(BORDER_SIDES).map(function (s) {
        return s.toLowerCase();
    });

    var parseBorderStyle = function parseBorderStyle(style) {
        switch (style) {
            case 'none':
                return BORDER_STYLE.NONE;
        }
        return BORDER_STYLE.SOLID;
    };

    var parseBorder = exports.parseBorder = function parseBorder(style) {
        return SIDES.map(function (side) {
            var borderColor = new _Color2.default(style.getPropertyValue('border-' + side + '-color'));
            var borderStyle = parseBorderStyle(style.getPropertyValue('border-' + side + '-style'));
            var borderWidth = parseFloat(style.getPropertyValue('border-' + side + '-width'));
            return {
                borderColor: borderColor,
                borderStyle: borderStyle,
                borderWidth: isNaN(borderWidth) ? 0 : borderWidth
            };
        });
    };
    });

    unwrapExports(border);
    var border_1 = border.parseBorder;
    var border_2 = border.BORDER_SIDES;
    var border_3 = border.BORDER_STYLE;

    var borderRadius = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseBorderRadius = undefined;

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();



    var _Length2 = _interopRequireDefault(Length_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var SIDES = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

    var parseBorderRadius = exports.parseBorderRadius = function parseBorderRadius(style) {
        return SIDES.map(function (side) {
            var value = style.getPropertyValue('border-' + side + '-radius');

            var _value$split$map = value.split(' ').map(_Length2.default.create),
                _value$split$map2 = _slicedToArray(_value$split$map, 2),
                horizontal = _value$split$map2[0],
                vertical = _value$split$map2[1];

            return typeof vertical === 'undefined' ? [horizontal, horizontal] : [horizontal, vertical];
        });
    };
    });

    unwrapExports(borderRadius);
    var borderRadius_1 = borderRadius.parseBorderRadius;

    var display = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var DISPLAY = exports.DISPLAY = {
        NONE: 1 << 0,
        BLOCK: 1 << 1,
        INLINE: 1 << 2,
        RUN_IN: 1 << 3,
        FLOW: 1 << 4,
        FLOW_ROOT: 1 << 5,
        TABLE: 1 << 6,
        FLEX: 1 << 7,
        GRID: 1 << 8,
        RUBY: 1 << 9,
        SUBGRID: 1 << 10,
        LIST_ITEM: 1 << 11,
        TABLE_ROW_GROUP: 1 << 12,
        TABLE_HEADER_GROUP: 1 << 13,
        TABLE_FOOTER_GROUP: 1 << 14,
        TABLE_ROW: 1 << 15,
        TABLE_CELL: 1 << 16,
        TABLE_COLUMN_GROUP: 1 << 17,
        TABLE_COLUMN: 1 << 18,
        TABLE_CAPTION: 1 << 19,
        RUBY_BASE: 1 << 20,
        RUBY_TEXT: 1 << 21,
        RUBY_BASE_CONTAINER: 1 << 22,
        RUBY_TEXT_CONTAINER: 1 << 23,
        CONTENTS: 1 << 24,
        INLINE_BLOCK: 1 << 25,
        INLINE_LIST_ITEM: 1 << 26,
        INLINE_TABLE: 1 << 27,
        INLINE_FLEX: 1 << 28,
        INLINE_GRID: 1 << 29
    };

    var parseDisplayValue = function parseDisplayValue(display) {
        switch (display) {
            case 'block':
                return DISPLAY.BLOCK;
            case 'inline':
                return DISPLAY.INLINE;
            case 'run-in':
                return DISPLAY.RUN_IN;
            case 'flow':
                return DISPLAY.FLOW;
            case 'flow-root':
                return DISPLAY.FLOW_ROOT;
            case 'table':
                return DISPLAY.TABLE;
            case 'flex':
                return DISPLAY.FLEX;
            case 'grid':
                return DISPLAY.GRID;
            case 'ruby':
                return DISPLAY.RUBY;
            case 'subgrid':
                return DISPLAY.SUBGRID;
            case 'list-item':
                return DISPLAY.LIST_ITEM;
            case 'table-row-group':
                return DISPLAY.TABLE_ROW_GROUP;
            case 'table-header-group':
                return DISPLAY.TABLE_HEADER_GROUP;
            case 'table-footer-group':
                return DISPLAY.TABLE_FOOTER_GROUP;
            case 'table-row':
                return DISPLAY.TABLE_ROW;
            case 'table-cell':
                return DISPLAY.TABLE_CELL;
            case 'table-column-group':
                return DISPLAY.TABLE_COLUMN_GROUP;
            case 'table-column':
                return DISPLAY.TABLE_COLUMN;
            case 'table-caption':
                return DISPLAY.TABLE_CAPTION;
            case 'ruby-base':
                return DISPLAY.RUBY_BASE;
            case 'ruby-text':
                return DISPLAY.RUBY_TEXT;
            case 'ruby-base-container':
                return DISPLAY.RUBY_BASE_CONTAINER;
            case 'ruby-text-container':
                return DISPLAY.RUBY_TEXT_CONTAINER;
            case 'contents':
                return DISPLAY.CONTENTS;
            case 'inline-block':
                return DISPLAY.INLINE_BLOCK;
            case 'inline-list-item':
                return DISPLAY.INLINE_LIST_ITEM;
            case 'inline-table':
                return DISPLAY.INLINE_TABLE;
            case 'inline-flex':
                return DISPLAY.INLINE_FLEX;
            case 'inline-grid':
                return DISPLAY.INLINE_GRID;
        }

        return DISPLAY.NONE;
    };

    var setDisplayBit = function setDisplayBit(bit, display) {
        return bit | parseDisplayValue(display);
    };

    var parseDisplay = exports.parseDisplay = function parseDisplay(display) {
        return display.split(' ').reduce(setDisplayBit, 0);
    };
    });

    unwrapExports(display);
    var display_1 = display.DISPLAY;
    var display_2 = display.parseDisplay;

    var float_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var FLOAT = exports.FLOAT = {
        NONE: 0,
        LEFT: 1,
        RIGHT: 2,
        INLINE_START: 3,
        INLINE_END: 4
    };

    var parseCSSFloat = exports.parseCSSFloat = function parseCSSFloat(float) {
        switch (float) {
            case 'left':
                return FLOAT.LEFT;
            case 'right':
                return FLOAT.RIGHT;
            case 'inline-start':
                return FLOAT.INLINE_START;
            case 'inline-end':
                return FLOAT.INLINE_END;
        }
        return FLOAT.NONE;
    };
    });

    unwrapExports(float_1);
    var float_2 = float_1.FLOAT;
    var float_3 = float_1.parseCSSFloat;

    var font = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });


    var parseFontWeight = function parseFontWeight(weight) {
        switch (weight) {
            case 'normal':
                return 400;
            case 'bold':
                return 700;
        }

        var value = parseInt(weight, 10);
        return isNaN(value) ? 400 : value;
    };

    var parseFont = exports.parseFont = function parseFont(style) {
        var fontFamily = style.fontFamily;
        var fontSize = style.fontSize;
        var fontStyle = style.fontStyle;
        var fontVariant = style.fontVariant;
        var fontWeight = parseFontWeight(style.fontWeight);

        return {
            fontFamily: fontFamily,
            fontSize: fontSize,
            fontStyle: fontStyle,
            fontVariant: fontVariant,
            fontWeight: fontWeight
        };
    };
    });

    unwrapExports(font);
    var font_1 = font.parseFont;

    var letterSpacing = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var parseLetterSpacing = exports.parseLetterSpacing = function parseLetterSpacing(letterSpacing) {
        if (letterSpacing === 'normal') {
            return 0;
        }
        var value = parseFloat(letterSpacing);
        return isNaN(value) ? 0 : value;
    };
    });

    unwrapExports(letterSpacing);
    var letterSpacing_1 = letterSpacing.parseLetterSpacing;

    var lineBreak = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var LINE_BREAK = exports.LINE_BREAK = {
        NORMAL: 'normal',
        STRICT: 'strict'
    };

    var parseLineBreak = exports.parseLineBreak = function parseLineBreak(wordBreak) {
        switch (wordBreak) {
            case 'strict':
                return LINE_BREAK.STRICT;
            case 'normal':
            default:
                return LINE_BREAK.NORMAL;
        }
    };
    });

    unwrapExports(lineBreak);
    var lineBreak_1 = lineBreak.LINE_BREAK;
    var lineBreak_2 = lineBreak.parseLineBreak;

    var listStyle = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseListStyle = exports.parseListStyleType = exports.LIST_STYLE_TYPE = exports.LIST_STYLE_POSITION = undefined;



    var LIST_STYLE_POSITION = exports.LIST_STYLE_POSITION = {
        INSIDE: 0,
        OUTSIDE: 1
    };

    var LIST_STYLE_TYPE = exports.LIST_STYLE_TYPE = {
        NONE: -1,
        DISC: 0,
        CIRCLE: 1,
        SQUARE: 2,
        DECIMAL: 3,
        CJK_DECIMAL: 4,
        DECIMAL_LEADING_ZERO: 5,
        LOWER_ROMAN: 6,
        UPPER_ROMAN: 7,
        LOWER_GREEK: 8,
        LOWER_ALPHA: 9,
        UPPER_ALPHA: 10,
        ARABIC_INDIC: 11,
        ARMENIAN: 12,
        BENGALI: 13,
        CAMBODIAN: 14,
        CJK_EARTHLY_BRANCH: 15,
        CJK_HEAVENLY_STEM: 16,
        CJK_IDEOGRAPHIC: 17,
        DEVANAGARI: 18,
        ETHIOPIC_NUMERIC: 19,
        GEORGIAN: 20,
        GUJARATI: 21,
        GURMUKHI: 22,
        HEBREW: 22,
        HIRAGANA: 23,
        HIRAGANA_IROHA: 24,
        JAPANESE_FORMAL: 25,
        JAPANESE_INFORMAL: 26,
        KANNADA: 27,
        KATAKANA: 28,
        KATAKANA_IROHA: 29,
        KHMER: 30,
        KOREAN_HANGUL_FORMAL: 31,
        KOREAN_HANJA_FORMAL: 32,
        KOREAN_HANJA_INFORMAL: 33,
        LAO: 34,
        LOWER_ARMENIAN: 35,
        MALAYALAM: 36,
        MONGOLIAN: 37,
        MYANMAR: 38,
        ORIYA: 39,
        PERSIAN: 40,
        SIMP_CHINESE_FORMAL: 41,
        SIMP_CHINESE_INFORMAL: 42,
        TAMIL: 43,
        TELUGU: 44,
        THAI: 45,
        TIBETAN: 46,
        TRAD_CHINESE_FORMAL: 47,
        TRAD_CHINESE_INFORMAL: 48,
        UPPER_ARMENIAN: 49,
        DISCLOSURE_OPEN: 50,
        DISCLOSURE_CLOSED: 51
    };

    var parseListStyleType = exports.parseListStyleType = function parseListStyleType(type) {
        switch (type) {
            case 'disc':
                return LIST_STYLE_TYPE.DISC;
            case 'circle':
                return LIST_STYLE_TYPE.CIRCLE;
            case 'square':
                return LIST_STYLE_TYPE.SQUARE;
            case 'decimal':
                return LIST_STYLE_TYPE.DECIMAL;
            case 'cjk-decimal':
                return LIST_STYLE_TYPE.CJK_DECIMAL;
            case 'decimal-leading-zero':
                return LIST_STYLE_TYPE.DECIMAL_LEADING_ZERO;
            case 'lower-roman':
                return LIST_STYLE_TYPE.LOWER_ROMAN;
            case 'upper-roman':
                return LIST_STYLE_TYPE.UPPER_ROMAN;
            case 'lower-greek':
                return LIST_STYLE_TYPE.LOWER_GREEK;
            case 'lower-alpha':
                return LIST_STYLE_TYPE.LOWER_ALPHA;
            case 'upper-alpha':
                return LIST_STYLE_TYPE.UPPER_ALPHA;
            case 'arabic-indic':
                return LIST_STYLE_TYPE.ARABIC_INDIC;
            case 'armenian':
                return LIST_STYLE_TYPE.ARMENIAN;
            case 'bengali':
                return LIST_STYLE_TYPE.BENGALI;
            case 'cambodian':
                return LIST_STYLE_TYPE.CAMBODIAN;
            case 'cjk-earthly-branch':
                return LIST_STYLE_TYPE.CJK_EARTHLY_BRANCH;
            case 'cjk-heavenly-stem':
                return LIST_STYLE_TYPE.CJK_HEAVENLY_STEM;
            case 'cjk-ideographic':
                return LIST_STYLE_TYPE.CJK_IDEOGRAPHIC;
            case 'devanagari':
                return LIST_STYLE_TYPE.DEVANAGARI;
            case 'ethiopic-numeric':
                return LIST_STYLE_TYPE.ETHIOPIC_NUMERIC;
            case 'georgian':
                return LIST_STYLE_TYPE.GEORGIAN;
            case 'gujarati':
                return LIST_STYLE_TYPE.GUJARATI;
            case 'gurmukhi':
                return LIST_STYLE_TYPE.GURMUKHI;
            case 'hebrew':
                return LIST_STYLE_TYPE.HEBREW;
            case 'hiragana':
                return LIST_STYLE_TYPE.HIRAGANA;
            case 'hiragana-iroha':
                return LIST_STYLE_TYPE.HIRAGANA_IROHA;
            case 'japanese-formal':
                return LIST_STYLE_TYPE.JAPANESE_FORMAL;
            case 'japanese-informal':
                return LIST_STYLE_TYPE.JAPANESE_INFORMAL;
            case 'kannada':
                return LIST_STYLE_TYPE.KANNADA;
            case 'katakana':
                return LIST_STYLE_TYPE.KATAKANA;
            case 'katakana-iroha':
                return LIST_STYLE_TYPE.KATAKANA_IROHA;
            case 'khmer':
                return LIST_STYLE_TYPE.KHMER;
            case 'korean-hangul-formal':
                return LIST_STYLE_TYPE.KOREAN_HANGUL_FORMAL;
            case 'korean-hanja-formal':
                return LIST_STYLE_TYPE.KOREAN_HANJA_FORMAL;
            case 'korean-hanja-informal':
                return LIST_STYLE_TYPE.KOREAN_HANJA_INFORMAL;
            case 'lao':
                return LIST_STYLE_TYPE.LAO;
            case 'lower-armenian':
                return LIST_STYLE_TYPE.LOWER_ARMENIAN;
            case 'malayalam':
                return LIST_STYLE_TYPE.MALAYALAM;
            case 'mongolian':
                return LIST_STYLE_TYPE.MONGOLIAN;
            case 'myanmar':
                return LIST_STYLE_TYPE.MYANMAR;
            case 'oriya':
                return LIST_STYLE_TYPE.ORIYA;
            case 'persian':
                return LIST_STYLE_TYPE.PERSIAN;
            case 'simp-chinese-formal':
                return LIST_STYLE_TYPE.SIMP_CHINESE_FORMAL;
            case 'simp-chinese-informal':
                return LIST_STYLE_TYPE.SIMP_CHINESE_INFORMAL;
            case 'tamil':
                return LIST_STYLE_TYPE.TAMIL;
            case 'telugu':
                return LIST_STYLE_TYPE.TELUGU;
            case 'thai':
                return LIST_STYLE_TYPE.THAI;
            case 'tibetan':
                return LIST_STYLE_TYPE.TIBETAN;
            case 'trad-chinese-formal':
                return LIST_STYLE_TYPE.TRAD_CHINESE_FORMAL;
            case 'trad-chinese-informal':
                return LIST_STYLE_TYPE.TRAD_CHINESE_INFORMAL;
            case 'upper-armenian':
                return LIST_STYLE_TYPE.UPPER_ARMENIAN;
            case 'disclosure-open':
                return LIST_STYLE_TYPE.DISCLOSURE_OPEN;
            case 'disclosure-closed':
                return LIST_STYLE_TYPE.DISCLOSURE_CLOSED;
            case 'none':
            default:
                return LIST_STYLE_TYPE.NONE;
        }
    };

    var parseListStyle = exports.parseListStyle = function parseListStyle(style) {
        var listStyleImage = (0, background.parseBackgroundImage)(style.getPropertyValue('list-style-image'));
        return {
            listStyleType: parseListStyleType(style.getPropertyValue('list-style-type')),
            listStyleImage: listStyleImage.length ? listStyleImage[0] : null,
            listStylePosition: parseListStylePosition(style.getPropertyValue('list-style-position'))
        };
    };

    var parseListStylePosition = function parseListStylePosition(position) {
        switch (position) {
            case 'inside':
                return LIST_STYLE_POSITION.INSIDE;
            case 'outside':
            default:
                return LIST_STYLE_POSITION.OUTSIDE;
        }
    };
    });

    unwrapExports(listStyle);
    var listStyle_1 = listStyle.parseListStyle;
    var listStyle_2 = listStyle.parseListStyleType;
    var listStyle_3 = listStyle.LIST_STYLE_TYPE;
    var listStyle_4 = listStyle.LIST_STYLE_POSITION;

    var margin = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseMargin = undefined;



    var _Length2 = _interopRequireDefault(Length_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var SIDES = ['top', 'right', 'bottom', 'left'];

    var parseMargin = exports.parseMargin = function parseMargin(style) {
        return SIDES.map(function (side) {
            return new _Length2.default(style.getPropertyValue('margin-' + side));
        });
    };
    });

    unwrapExports(margin);
    var margin_1 = margin.parseMargin;

    var overflow = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var OVERFLOW = exports.OVERFLOW = {
        VISIBLE: 0,
        HIDDEN: 1,
        SCROLL: 2,
        AUTO: 3
    };

    var parseOverflow = exports.parseOverflow = function parseOverflow(overflow) {
        switch (overflow) {
            case 'hidden':
                return OVERFLOW.HIDDEN;
            case 'scroll':
                return OVERFLOW.SCROLL;
            case 'auto':
                return OVERFLOW.AUTO;
            case 'visible':
            default:
                return OVERFLOW.VISIBLE;
        }
    };
    });

    unwrapExports(overflow);
    var overflow_1 = overflow.OVERFLOW;
    var overflow_2 = overflow.parseOverflow;

    var overflowWrap = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var OVERFLOW_WRAP = exports.OVERFLOW_WRAP = {
        NORMAL: 0,
        BREAK_WORD: 1
    };

    var parseOverflowWrap = exports.parseOverflowWrap = function parseOverflowWrap(overflow) {
        switch (overflow) {
            case 'break-word':
                return OVERFLOW_WRAP.BREAK_WORD;
            case 'normal':
            default:
                return OVERFLOW_WRAP.NORMAL;
        }
    };
    });

    unwrapExports(overflowWrap);
    var overflowWrap_1 = overflowWrap.OVERFLOW_WRAP;
    var overflowWrap_2 = overflowWrap.parseOverflowWrap;

    var position = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var POSITION = exports.POSITION = {
        STATIC: 0,
        RELATIVE: 1,
        ABSOLUTE: 2,
        FIXED: 3,
        STICKY: 4
    };

    var parsePosition = exports.parsePosition = function parsePosition(position) {
        switch (position) {
            case 'relative':
                return POSITION.RELATIVE;
            case 'absolute':
                return POSITION.ABSOLUTE;
            case 'fixed':
                return POSITION.FIXED;
            case 'sticky':
                return POSITION.STICKY;
        }

        return POSITION.STATIC;
    };
    });

    unwrapExports(position);
    var position_1 = position.POSITION;
    var position_2 = position.parsePosition;

    var textDecoration = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseTextDecoration = exports.TEXT_DECORATION_LINE = exports.TEXT_DECORATION = exports.TEXT_DECORATION_STYLE = undefined;



    var _Color2 = _interopRequireDefault(Color_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var TEXT_DECORATION_STYLE = exports.TEXT_DECORATION_STYLE = {
        SOLID: 0,
        DOUBLE: 1,
        DOTTED: 2,
        DASHED: 3,
        WAVY: 4
    };

    var TEXT_DECORATION = exports.TEXT_DECORATION = {
        NONE: null
    };

    var TEXT_DECORATION_LINE = exports.TEXT_DECORATION_LINE = {
        UNDERLINE: 1,
        OVERLINE: 2,
        LINE_THROUGH: 3,
        BLINK: 4
    };

    var parseLine = function parseLine(line) {
        switch (line) {
            case 'underline':
                return TEXT_DECORATION_LINE.UNDERLINE;
            case 'overline':
                return TEXT_DECORATION_LINE.OVERLINE;
            case 'line-through':
                return TEXT_DECORATION_LINE.LINE_THROUGH;
        }
        return TEXT_DECORATION_LINE.BLINK;
    };

    var parseTextDecorationLine = function parseTextDecorationLine(line) {
        if (line === 'none') {
            return null;
        }

        return line.split(' ').map(parseLine);
    };

    var parseTextDecorationStyle = function parseTextDecorationStyle(style) {
        switch (style) {
            case 'double':
                return TEXT_DECORATION_STYLE.DOUBLE;
            case 'dotted':
                return TEXT_DECORATION_STYLE.DOTTED;
            case 'dashed':
                return TEXT_DECORATION_STYLE.DASHED;
            case 'wavy':
                return TEXT_DECORATION_STYLE.WAVY;
        }
        return TEXT_DECORATION_STYLE.SOLID;
    };

    var parseTextDecoration = exports.parseTextDecoration = function parseTextDecoration(style) {
        var textDecorationLine = parseTextDecorationLine(style.textDecorationLine ? style.textDecorationLine : style.textDecoration);
        if (textDecorationLine === null) {
            return TEXT_DECORATION.NONE;
        }

        var textDecorationColor = style.textDecorationColor ? new _Color2.default(style.textDecorationColor) : null;
        var textDecorationStyle = parseTextDecorationStyle(style.textDecorationStyle);

        return {
            textDecorationLine: textDecorationLine,
            textDecorationColor: textDecorationColor,
            textDecorationStyle: textDecorationStyle
        };
    };
    });

    unwrapExports(textDecoration);
    var textDecoration_1 = textDecoration.parseTextDecoration;
    var textDecoration_2 = textDecoration.TEXT_DECORATION_LINE;
    var textDecoration_3 = textDecoration.TEXT_DECORATION;
    var textDecoration_4 = textDecoration.TEXT_DECORATION_STYLE;

    var textShadow = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseTextShadow = undefined;



    var _Color2 = _interopRequireDefault(Color_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var NUMBER = /^([+-]|\d|\.)$/i;

    var parseTextShadow = exports.parseTextShadow = function parseTextShadow(textShadow) {
        if (textShadow === 'none' || typeof textShadow !== 'string') {
            return null;
        }

        var currentValue = '';
        var isLength = false;
        var values = [];
        var shadows = [];
        var numParens = 0;
        var color = null;

        var appendValue = function appendValue() {
            if (currentValue.length) {
                if (isLength) {
                    values.push(parseFloat(currentValue));
                } else {
                    color = new _Color2.default(currentValue);
                }
            }
            isLength = false;
            currentValue = '';
        };

        var appendShadow = function appendShadow() {
            if (values.length && color !== null) {
                shadows.push({
                    color: color,
                    offsetX: values[0] || 0,
                    offsetY: values[1] || 0,
                    blur: values[2] || 0
                });
            }
            values.splice(0, values.length);
            color = null;
        };

        for (var i = 0; i < textShadow.length; i++) {
            var c = textShadow[i];
            switch (c) {
                case '(':
                    currentValue += c;
                    numParens++;
                    break;
                case ')':
                    currentValue += c;
                    numParens--;
                    break;
                case ',':
                    if (numParens === 0) {
                        appendValue();
                        appendShadow();
                    } else {
                        currentValue += c;
                    }
                    break;
                case ' ':
                    if (numParens === 0) {
                        appendValue();
                    } else {
                        currentValue += c;
                    }
                    break;
                default:
                    if (currentValue.length === 0 && NUMBER.test(c)) {
                        isLength = true;
                    }
                    currentValue += c;
            }
        }

        appendValue();
        appendShadow();

        if (shadows.length === 0) {
            return null;
        }

        return shadows;
    };
    });

    unwrapExports(textShadow);
    var textShadow_1 = textShadow.parseTextShadow;

    var textTransform = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var TEXT_TRANSFORM = exports.TEXT_TRANSFORM = {
        NONE: 0,
        LOWERCASE: 1,
        UPPERCASE: 2,
        CAPITALIZE: 3
    };

    var parseTextTransform = exports.parseTextTransform = function parseTextTransform(textTransform) {
        switch (textTransform) {
            case 'uppercase':
                return TEXT_TRANSFORM.UPPERCASE;
            case 'lowercase':
                return TEXT_TRANSFORM.LOWERCASE;
            case 'capitalize':
                return TEXT_TRANSFORM.CAPITALIZE;
        }

        return TEXT_TRANSFORM.NONE;
    };
    });

    unwrapExports(textTransform);
    var textTransform_1 = textTransform.TEXT_TRANSFORM;
    var textTransform_2 = textTransform.parseTextTransform;

    var transform = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseTransform = undefined;



    var _Length2 = _interopRequireDefault(Length_1);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var toFloat = function toFloat(s) {
        return parseFloat(s.trim());
    };

    var MATRIX = /(matrix|matrix3d)\((.+)\)/;

    var parseTransform = exports.parseTransform = function parseTransform(style) {
        var transform = parseTransformMatrix(style.transform || style.webkitTransform || style.mozTransform ||
        // $FlowFixMe
        style.msTransform ||
        // $FlowFixMe
        style.oTransform);
        if (transform === null) {
            return null;
        }

        return {
            transform: transform,
            transformOrigin: parseTransformOrigin(style.transformOrigin || style.webkitTransformOrigin || style.mozTransformOrigin ||
            // $FlowFixMe
            style.msTransformOrigin ||
            // $FlowFixMe
            style.oTransformOrigin)
        };
    };

    // $FlowFixMe
    var parseTransformOrigin = function parseTransformOrigin(origin) {
        if (typeof origin !== 'string') {
            var v = new _Length2.default('0');
            return [v, v];
        }
        var values = origin.split(' ').map(_Length2.default.create);
        return [values[0], values[1]];
    };

    // $FlowFixMe
    var parseTransformMatrix = function parseTransformMatrix(transform) {
        if (transform === 'none' || typeof transform !== 'string') {
            return null;
        }

        var match = transform.match(MATRIX);
        if (match) {
            if (match[1] === 'matrix') {
                var matrix = match[2].split(',').map(toFloat);
                return [matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]];
            } else {
                var matrix3d = match[2].split(',').map(toFloat);
                return [matrix3d[0], matrix3d[1], matrix3d[4], matrix3d[5], matrix3d[12], matrix3d[13]];
            }
        }
        return null;
    };
    });

    unwrapExports(transform);
    var transform_1 = transform.parseTransform;

    var visibility = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var VISIBILITY = exports.VISIBILITY = {
        VISIBLE: 0,
        HIDDEN: 1,
        COLLAPSE: 2
    };

    var parseVisibility = exports.parseVisibility = function parseVisibility(visibility) {
        switch (visibility) {
            case 'hidden':
                return VISIBILITY.HIDDEN;
            case 'collapse':
                return VISIBILITY.COLLAPSE;
            case 'visible':
            default:
                return VISIBILITY.VISIBLE;
        }
    };
    });

    unwrapExports(visibility);
    var visibility_1 = visibility.VISIBILITY;
    var visibility_2 = visibility.parseVisibility;

    var wordBreak = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var WORD_BREAK = exports.WORD_BREAK = {
        NORMAL: 'normal',
        BREAK_ALL: 'break-all',
        KEEP_ALL: 'keep-all'
    };

    var parseWordBreak = exports.parseWordBreak = function parseWordBreak(wordBreak) {
        switch (wordBreak) {
            case 'break-all':
                return WORD_BREAK.BREAK_ALL;
            case 'keep-all':
                return WORD_BREAK.KEEP_ALL;
            case 'normal':
            default:
                return WORD_BREAK.NORMAL;
        }
    };
    });

    unwrapExports(wordBreak);
    var wordBreak_1 = wordBreak.WORD_BREAK;
    var wordBreak_2 = wordBreak.parseWordBreak;

    var zIndex = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var parseZIndex = exports.parseZIndex = function parseZIndex(zIndex) {
        var auto = zIndex === 'auto';
        return {
            auto: auto,
            order: auto ? 0 : parseInt(zIndex, 10)
        };
    };
    });

    unwrapExports(zIndex);
    var zIndex_1 = zIndex.parseZIndex;

    var ForeignObjectRenderer_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var ForeignObjectRenderer = function () {
        function ForeignObjectRenderer(element) {
            _classCallCheck(this, ForeignObjectRenderer);

            this.element = element;
        }

        _createClass(ForeignObjectRenderer, [{
            key: 'render',
            value: function render(options) {
                var _this = this;

                this.options = options;
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
                this.canvas.width = Math.floor(options.width) * options.scale;
                this.canvas.height = Math.floor(options.height) * options.scale;
                this.canvas.style.width = options.width + 'px';
                this.canvas.style.height = options.height + 'px';

                options.logger.log('ForeignObject renderer initialized (' + options.width + 'x' + options.height + ' at ' + options.x + ',' + options.y + ') with scale ' + options.scale);
                var svg = createForeignObjectSVG(Math.max(options.windowWidth, options.width) * options.scale, Math.max(options.windowHeight, options.height) * options.scale, options.scrollX * options.scale, options.scrollY * options.scale, this.element);

                return loadSerializedSVG(svg).then(function (img) {
                    if (options.backgroundColor) {
                        _this.ctx.fillStyle = options.backgroundColor.toString();
                        _this.ctx.fillRect(0, 0, options.width * options.scale, options.height * options.scale);
                    }

                    _this.ctx.drawImage(img, -options.x * options.scale, -options.y * options.scale);
                    return _this.canvas;
                });
            }
        }]);

        return ForeignObjectRenderer;
    }();

    exports.default = ForeignObjectRenderer;
    var createForeignObjectSVG = exports.createForeignObjectSVG = function createForeignObjectSVG(width, height, x, y, node) {
        var xmlns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(xmlns, 'svg');
        var foreignObject = document.createElementNS(xmlns, 'foreignObject');
        svg.setAttributeNS(null, 'width', width);
        svg.setAttributeNS(null, 'height', height);

        foreignObject.setAttributeNS(null, 'width', '100%');
        foreignObject.setAttributeNS(null, 'height', '100%');
        foreignObject.setAttributeNS(null, 'x', x);
        foreignObject.setAttributeNS(null, 'y', y);
        foreignObject.setAttributeNS(null, 'externalResourcesRequired', 'true');
        svg.appendChild(foreignObject);

        foreignObject.appendChild(node);

        return svg;
    };

    var loadSerializedSVG = exports.loadSerializedSVG = function loadSerializedSVG(svg) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () {
                return resolve(img);
            };
            img.onerror = reject;

            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
        });
    };
    });

    unwrapExports(ForeignObjectRenderer_1);
    var ForeignObjectRenderer_2 = ForeignObjectRenderer_1.createForeignObjectSVG;
    var ForeignObjectRenderer_3 = ForeignObjectRenderer_1.loadSerializedSVG;

    var Feature = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });



    var testRangeBounds = function testRangeBounds(document) {
        var TEST_HEIGHT = 123;

        if (document.createRange) {
            var range = document.createRange();
            if (range.getBoundingClientRect) {
                var testElement = document.createElement('boundtest');
                testElement.style.height = TEST_HEIGHT + 'px';
                testElement.style.display = 'block';
                document.body.appendChild(testElement);

                range.selectNode(testElement);
                var rangeBounds = range.getBoundingClientRect();
                var rangeHeight = Math.round(rangeBounds.height);
                document.body.removeChild(testElement);
                if (rangeHeight === TEST_HEIGHT) {
                    return true;
                }
            }
        }

        return false;
    };

    // iOS 10.3 taints canvas with base64 images unless crossOrigin = 'anonymous'
    var testBase64 = function testBase64(document, src) {
        var img = new Image();
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        return new Promise(function (resolve) {
            // Single pixel base64 image renders fine on iOS 10.3???
            img.src = src;

            var onload = function onload() {
                try {
                    ctx.drawImage(img, 0, 0);
                    canvas.toDataURL();
                } catch (e) {
                    return resolve(false);
                }

                return resolve(true);
            };

            img.onload = onload;
            img.onerror = function () {
                return resolve(false);
            };

            if (img.complete === true) {
                setTimeout(function () {
                    onload();
                }, 500);
            }
        });
    };

    var testCORS = function testCORS() {
        return typeof new Image().crossOrigin !== 'undefined';
    };

    var testResponseType = function testResponseType() {
        return typeof new XMLHttpRequest().responseType === 'string';
    };

    var testSVG = function testSVG(document) {
        var img = new Image();
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        img.src = 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'></svg>';

        try {
            ctx.drawImage(img, 0, 0);
            canvas.toDataURL();
        } catch (e) {
            return false;
        }
        return true;
    };

    var isGreenPixel = function isGreenPixel(data) {
        return data[0] === 0 && data[1] === 255 && data[2] === 0 && data[3] === 255;
    };

    var testForeignObject = function testForeignObject(document) {
        var canvas = document.createElement('canvas');
        var size = 100;
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgb(0, 255, 0)';
        ctx.fillRect(0, 0, size, size);

        var img = new Image();
        var greenImageSrc = canvas.toDataURL();
        img.src = greenImageSrc;
        var svg = (0, ForeignObjectRenderer_1.createForeignObjectSVG)(size, size, 0, 0, img);
        ctx.fillStyle = 'red';
        ctx.fillRect(0, 0, size, size);

        return (0, ForeignObjectRenderer_1.loadSerializedSVG)(svg).then(function (img) {
            ctx.drawImage(img, 0, 0);
            var data = ctx.getImageData(0, 0, size, size).data;
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, size, size);

            var node = document.createElement('div');
            node.style.backgroundImage = 'url(' + greenImageSrc + ')';
            node.style.height = size + 'px';
            // Firefox 55 does not render inline <img /> tags
            return isGreenPixel(data) ? (0, ForeignObjectRenderer_1.loadSerializedSVG)((0, ForeignObjectRenderer_1.createForeignObjectSVG)(size, size, 0, 0, node)) : Promise.reject(false);
        }).then(function (img) {
            ctx.drawImage(img, 0, 0);
            // Edge does not render background-images
            return isGreenPixel(ctx.getImageData(0, 0, size, size).data);
        }).catch(function (e) {
            return false;
        });
    };

    var FEATURES = {
        // $FlowFixMe - get/set properties not yet supported
        get SUPPORT_RANGE_BOUNDS() {

            var value = testRangeBounds(document);
            Object.defineProperty(FEATURES, 'SUPPORT_RANGE_BOUNDS', { value: value });
            return value;
        },
        // $FlowFixMe - get/set properties not yet supported
        get SUPPORT_SVG_DRAWING() {

            var value = testSVG(document);
            Object.defineProperty(FEATURES, 'SUPPORT_SVG_DRAWING', { value: value });
            return value;
        },
        // $FlowFixMe - get/set properties not yet supported
        get SUPPORT_BASE64_DRAWING() {

            return function (src) {
                var _value = testBase64(document, src);
                Object.defineProperty(FEATURES, 'SUPPORT_BASE64_DRAWING', { value: function value() {
                        return _value;
                    } });
                return _value;
            };
        },
        // $FlowFixMe - get/set properties not yet supported
        get SUPPORT_FOREIGNOBJECT_DRAWING() {

            var value = typeof Array.from === 'function' && typeof window.fetch === 'function' ? testForeignObject(document) : Promise.resolve(false);
            Object.defineProperty(FEATURES, 'SUPPORT_FOREIGNOBJECT_DRAWING', { value: value });
            return value;
        },
        // $FlowFixMe - get/set properties not yet supported
        get SUPPORT_CORS_IMAGES() {

            var value = testCORS();
            Object.defineProperty(FEATURES, 'SUPPORT_CORS_IMAGES', { value: value });
            return value;
        },
        // $FlowFixMe - get/set properties not yet supported
        get SUPPORT_RESPONSE_TYPE() {

            var value = testResponseType();
            Object.defineProperty(FEATURES, 'SUPPORT_RESPONSE_TYPE', { value: value });
            return value;
        },
        // $FlowFixMe - get/set properties not yet supported
        get SUPPORT_CORS_XHR() {

            var value = 'withCredentials' in new XMLHttpRequest();
            Object.defineProperty(FEATURES, 'SUPPORT_CORS_XHR', { value: value });
            return value;
        }
    };

    exports.default = FEATURES;
    });

    unwrapExports(Feature);

    var Util$2 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var toCodePoints = exports.toCodePoints = function toCodePoints(str) {
        var codePoints = [];
        var i = 0;
        var length = str.length;
        while (i < length) {
            var value = str.charCodeAt(i++);
            if (value >= 0xd800 && value <= 0xdbff && i < length) {
                var extra = str.charCodeAt(i++);
                if ((extra & 0xfc00) === 0xdc00) {
                    codePoints.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000);
                } else {
                    codePoints.push(value);
                    i--;
                }
            } else {
                codePoints.push(value);
            }
        }
        return codePoints;
    };

    var fromCodePoint = exports.fromCodePoint = function fromCodePoint() {
        if (String.fromCodePoint) {
            return String.fromCodePoint.apply(String, arguments);
        }

        var length = arguments.length;
        if (!length) {
            return '';
        }

        var codeUnits = [];

        var index = -1;
        var result = '';
        while (++index < length) {
            var codePoint = arguments.length <= index ? undefined : arguments[index];
            if (codePoint <= 0xffff) {
                codeUnits.push(codePoint);
            } else {
                codePoint -= 0x10000;
                codeUnits.push((codePoint >> 10) + 0xd800, codePoint % 0x400 + 0xdc00);
            }
            if (index + 1 === length || codeUnits.length > 0x4000) {
                result += String.fromCharCode.apply(String, codeUnits);
                codeUnits.length = 0;
            }
        }
        return result;
    };

    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    // Use a lookup table to find the index.
    var lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
    for (var i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
    }

    var decode = exports.decode = function decode(base64) {
        var bufferLength = base64.length * 0.75,
            len = base64.length,
            i = void 0,
            p = 0,
            encoded1 = void 0,
            encoded2 = void 0,
            encoded3 = void 0,
            encoded4 = void 0;

        if (base64[base64.length - 1] === '=') {
            bufferLength--;
            if (base64[base64.length - 2] === '=') {
                bufferLength--;
            }
        }

        var buffer = typeof ArrayBuffer !== 'undefined' && typeof Uint8Array !== 'undefined' && typeof Uint8Array.prototype.slice !== 'undefined' ? new ArrayBuffer(bufferLength) : new Array(bufferLength);
        var bytes = Array.isArray(buffer) ? buffer : new Uint8Array(buffer);

        for (i = 0; i < len; i += 4) {
            encoded1 = lookup[base64.charCodeAt(i)];
            encoded2 = lookup[base64.charCodeAt(i + 1)];
            encoded3 = lookup[base64.charCodeAt(i + 2)];
            encoded4 = lookup[base64.charCodeAt(i + 3)];

            bytes[p++] = encoded1 << 2 | encoded2 >> 4;
            bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
            bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
        }

        return buffer;
    };

    var polyUint16Array = exports.polyUint16Array = function polyUint16Array(buffer) {
        var length = buffer.length;
        var bytes = [];
        for (var _i = 0; _i < length; _i += 2) {
            bytes.push(buffer[_i + 1] << 8 | buffer[_i]);
        }
        return bytes;
    };

    var polyUint32Array = exports.polyUint32Array = function polyUint32Array(buffer) {
        var length = buffer.length;
        var bytes = [];
        for (var _i2 = 0; _i2 < length; _i2 += 4) {
            bytes.push(buffer[_i2 + 3] << 24 | buffer[_i2 + 2] << 16 | buffer[_i2 + 1] << 8 | buffer[_i2]);
        }
        return bytes;
    };
    });

    unwrapExports(Util$2);
    var Util_1$1 = Util$2.toCodePoints;
    var Util_2$1 = Util$2.fromCodePoint;
    var Util_3$1 = Util$2.decode;
    var Util_4$1 = Util$2.polyUint16Array;
    var Util_5 = Util$2.polyUint32Array;

    var Trie_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.Trie = exports.createTrieFromBase64 = exports.UTRIE2_INDEX_2_MASK = exports.UTRIE2_INDEX_2_BLOCK_LENGTH = exports.UTRIE2_OMITTED_BMP_INDEX_1_LENGTH = exports.UTRIE2_INDEX_1_OFFSET = exports.UTRIE2_UTF8_2B_INDEX_2_LENGTH = exports.UTRIE2_UTF8_2B_INDEX_2_OFFSET = exports.UTRIE2_INDEX_2_BMP_LENGTH = exports.UTRIE2_LSCP_INDEX_2_LENGTH = exports.UTRIE2_DATA_MASK = exports.UTRIE2_DATA_BLOCK_LENGTH = exports.UTRIE2_LSCP_INDEX_2_OFFSET = exports.UTRIE2_SHIFT_1_2 = exports.UTRIE2_INDEX_SHIFT = exports.UTRIE2_SHIFT_1 = exports.UTRIE2_SHIFT_2 = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    /** Shift size for getting the index-2 table offset. */
    var UTRIE2_SHIFT_2 = exports.UTRIE2_SHIFT_2 = 5;

    /** Shift size for getting the index-1 table offset. */
    var UTRIE2_SHIFT_1 = exports.UTRIE2_SHIFT_1 = 6 + 5;

    /**
     * Shift size for shifting left the index array values.
     * Increases possible data size with 16-bit index values at the cost
     * of compactability.
     * This requires data blocks to be aligned by UTRIE2_DATA_GRANULARITY.
     */
    var UTRIE2_INDEX_SHIFT = exports.UTRIE2_INDEX_SHIFT = 2;

    /**
     * Difference between the two shift sizes,
     * for getting an index-1 offset from an index-2 offset. 6=11-5
     */
    var UTRIE2_SHIFT_1_2 = exports.UTRIE2_SHIFT_1_2 = UTRIE2_SHIFT_1 - UTRIE2_SHIFT_2;

    /**
     * The part of the index-2 table for U+D800..U+DBFF stores values for
     * lead surrogate code _units_ not code _points_.
     * Values for lead surrogate code _points_ are indexed with this portion of the table.
     * Length=32=0x20=0x400>>UTRIE2_SHIFT_2. (There are 1024=0x400 lead surrogates.)
     */
    var UTRIE2_LSCP_INDEX_2_OFFSET = exports.UTRIE2_LSCP_INDEX_2_OFFSET = 0x10000 >> UTRIE2_SHIFT_2;

    /** Number of entries in a data block. 32=0x20 */
    var UTRIE2_DATA_BLOCK_LENGTH = exports.UTRIE2_DATA_BLOCK_LENGTH = 1 << UTRIE2_SHIFT_2;
    /** Mask for getting the lower bits for the in-data-block offset. */
    var UTRIE2_DATA_MASK = exports.UTRIE2_DATA_MASK = UTRIE2_DATA_BLOCK_LENGTH - 1;

    var UTRIE2_LSCP_INDEX_2_LENGTH = exports.UTRIE2_LSCP_INDEX_2_LENGTH = 0x400 >> UTRIE2_SHIFT_2;
    /** Count the lengths of both BMP pieces. 2080=0x820 */
    var UTRIE2_INDEX_2_BMP_LENGTH = exports.UTRIE2_INDEX_2_BMP_LENGTH = UTRIE2_LSCP_INDEX_2_OFFSET + UTRIE2_LSCP_INDEX_2_LENGTH;
    /**
     * The 2-byte UTF-8 version of the index-2 table follows at offset 2080=0x820.
     * Length 32=0x20 for lead bytes C0..DF, regardless of UTRIE2_SHIFT_2.
     */
    var UTRIE2_UTF8_2B_INDEX_2_OFFSET = exports.UTRIE2_UTF8_2B_INDEX_2_OFFSET = UTRIE2_INDEX_2_BMP_LENGTH;
    var UTRIE2_UTF8_2B_INDEX_2_LENGTH = exports.UTRIE2_UTF8_2B_INDEX_2_LENGTH = 0x800 >> 6; /* U+0800 is the first code point after 2-byte UTF-8 */
    /**
     * The index-1 table, only used for supplementary code points, at offset 2112=0x840.
     * Variable length, for code points up to highStart, where the last single-value range starts.
     * Maximum length 512=0x200=0x100000>>UTRIE2_SHIFT_1.
     * (For 0x100000 supplementary code points U+10000..U+10ffff.)
     *
     * The part of the index-2 table for supplementary code points starts
     * after this index-1 table.
     *
     * Both the index-1 table and the following part of the index-2 table
     * are omitted completely if there is only BMP data.
     */
    var UTRIE2_INDEX_1_OFFSET = exports.UTRIE2_INDEX_1_OFFSET = UTRIE2_UTF8_2B_INDEX_2_OFFSET + UTRIE2_UTF8_2B_INDEX_2_LENGTH;

    /**
     * Number of index-1 entries for the BMP. 32=0x20
     * This part of the index-1 table is omitted from the serialized form.
     */
    var UTRIE2_OMITTED_BMP_INDEX_1_LENGTH = exports.UTRIE2_OMITTED_BMP_INDEX_1_LENGTH = 0x10000 >> UTRIE2_SHIFT_1;

    /** Number of entries in an index-2 block. 64=0x40 */
    var UTRIE2_INDEX_2_BLOCK_LENGTH = exports.UTRIE2_INDEX_2_BLOCK_LENGTH = 1 << UTRIE2_SHIFT_1_2;
    /** Mask for getting the lower bits for the in-index-2-block offset. */
    var UTRIE2_INDEX_2_MASK = exports.UTRIE2_INDEX_2_MASK = UTRIE2_INDEX_2_BLOCK_LENGTH - 1;

    var createTrieFromBase64 = exports.createTrieFromBase64 = function createTrieFromBase64(base64) {
        var buffer = (0, Util$2.decode)(base64);
        var view32 = Array.isArray(buffer) ? (0, Util$2.polyUint32Array)(buffer) : new Uint32Array(buffer);
        var view16 = Array.isArray(buffer) ? (0, Util$2.polyUint16Array)(buffer) : new Uint16Array(buffer);
        var headerLength = 24;

        var index = view16.slice(headerLength / 2, view32[4] / 2);
        var data = view32[5] === 2 ? view16.slice((headerLength + view32[4]) / 2) : view32.slice(Math.ceil((headerLength + view32[4]) / 4));

        return new Trie(view32[0], view32[1], view32[2], view32[3], index, data);
    };

    var Trie = exports.Trie = function () {
        function Trie(initialValue, errorValue, highStart, highValueIndex, index, data) {
            _classCallCheck(this, Trie);

            this.initialValue = initialValue;
            this.errorValue = errorValue;
            this.highStart = highStart;
            this.highValueIndex = highValueIndex;
            this.index = index;
            this.data = data;
        }

        /**
         * Get the value for a code point as stored in the Trie.
         *
         * @param codePoint the code point
         * @return the value
         */


        _createClass(Trie, [{
            key: 'get',
            value: function get(codePoint) {
                var ix = void 0;
                if (codePoint >= 0) {
                    if (codePoint < 0x0d800 || codePoint > 0x0dbff && codePoint <= 0x0ffff) {
                        // Ordinary BMP code point, excluding leading surrogates.
                        // BMP uses a single level lookup.  BMP index starts at offset 0 in the Trie2 index.
                        // 16 bit data is stored in the index array itself.
                        ix = this.index[codePoint >> UTRIE2_SHIFT_2];
                        ix = (ix << UTRIE2_INDEX_SHIFT) + (codePoint & UTRIE2_DATA_MASK);
                        return this.data[ix];
                    }

                    if (codePoint <= 0xffff) {
                        // Lead Surrogate Code Point.  A Separate index section is stored for
                        // lead surrogate code units and code points.
                        //   The main index has the code unit data.
                        //   For this function, we need the code point data.
                        // Note: this expression could be refactored for slightly improved efficiency, but
                        //       surrogate code points will be so rare in practice that it's not worth it.
                        ix = this.index[UTRIE2_LSCP_INDEX_2_OFFSET + (codePoint - 0xd800 >> UTRIE2_SHIFT_2)];
                        ix = (ix << UTRIE2_INDEX_SHIFT) + (codePoint & UTRIE2_DATA_MASK);
                        return this.data[ix];
                    }

                    if (codePoint < this.highStart) {
                        // Supplemental code point, use two-level lookup.
                        ix = UTRIE2_INDEX_1_OFFSET - UTRIE2_OMITTED_BMP_INDEX_1_LENGTH + (codePoint >> UTRIE2_SHIFT_1);
                        ix = this.index[ix];
                        ix += codePoint >> UTRIE2_SHIFT_2 & UTRIE2_INDEX_2_MASK;
                        ix = this.index[ix];
                        ix = (ix << UTRIE2_INDEX_SHIFT) + (codePoint & UTRIE2_DATA_MASK);
                        return this.data[ix];
                    }
                    if (codePoint <= 0x10ffff) {
                        return this.data[this.highValueIndex];
                    }
                }

                // Fall through.  The code point is outside of the legal range of 0..0x10ffff.
                return this.errorValue;
            }
        }]);

        return Trie;
    }();
    });

    unwrapExports(Trie_1);
    var Trie_2 = Trie_1.Trie;
    var Trie_3 = Trie_1.createTrieFromBase64;
    var Trie_4 = Trie_1.UTRIE2_INDEX_2_MASK;
    var Trie_5 = Trie_1.UTRIE2_INDEX_2_BLOCK_LENGTH;
    var Trie_6 = Trie_1.UTRIE2_OMITTED_BMP_INDEX_1_LENGTH;
    var Trie_7 = Trie_1.UTRIE2_INDEX_1_OFFSET;
    var Trie_8 = Trie_1.UTRIE2_UTF8_2B_INDEX_2_LENGTH;
    var Trie_9 = Trie_1.UTRIE2_UTF8_2B_INDEX_2_OFFSET;
    var Trie_10 = Trie_1.UTRIE2_INDEX_2_BMP_LENGTH;
    var Trie_11 = Trie_1.UTRIE2_LSCP_INDEX_2_LENGTH;
    var Trie_12 = Trie_1.UTRIE2_DATA_MASK;
    var Trie_13 = Trie_1.UTRIE2_DATA_BLOCK_LENGTH;
    var Trie_14 = Trie_1.UTRIE2_LSCP_INDEX_2_OFFSET;
    var Trie_15 = Trie_1.UTRIE2_SHIFT_1_2;
    var Trie_16 = Trie_1.UTRIE2_INDEX_SHIFT;
    var Trie_17 = Trie_1.UTRIE2_SHIFT_1;
    var Trie_18 = Trie_1.UTRIE2_SHIFT_2;

    var linebreakTrie = 'KwAAAAAAAAAACA4AIDoAAPAfAAACAAAAAAAIABAAGABAAEgAUABYAF4AZgBeAGYAYABoAHAAeABeAGYAfACEAIAAiACQAJgAoACoAK0AtQC9AMUAXgBmAF4AZgBeAGYAzQDVAF4AZgDRANkA3gDmAOwA9AD8AAQBDAEUARoBIgGAAIgAJwEvATcBPwFFAU0BTAFUAVwBZAFsAXMBewGDATAAiwGTAZsBogGkAawBtAG8AcIBygHSAdoB4AHoAfAB+AH+AQYCDgIWAv4BHgImAi4CNgI+AkUCTQJTAlsCYwJrAnECeQKBAk0CiQKRApkCoQKoArACuALAAsQCzAIwANQC3ALkAjAA7AL0AvwCAQMJAxADGAMwACADJgMuAzYDPgOAAEYDSgNSA1IDUgNaA1oDYANiA2IDgACAAGoDgAByA3YDfgOAAIQDgACKA5IDmgOAAIAAogOqA4AAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAK8DtwOAAIAAvwPHA88D1wPfAyAD5wPsA/QD/AOAAIAABAQMBBIEgAAWBB4EJgQuBDMEIAM7BEEEXgBJBCADUQRZBGEEaQQwADAAcQQ+AXkEgQSJBJEEgACYBIAAoASoBK8EtwQwAL8ExQSAAIAAgACAAIAAgACgAM0EXgBeAF4AXgBeAF4AXgBeANUEXgDZBOEEXgDpBPEE+QQBBQkFEQUZBSEFKQUxBTUFPQVFBUwFVAVcBV4AYwVeAGsFcwV7BYMFiwWSBV4AmgWgBacFXgBeAF4AXgBeAKsFXgCyBbEFugW7BcIFwgXIBcIFwgXQBdQF3AXkBesF8wX7BQMGCwYTBhsGIwYrBjMGOwZeAD8GRwZNBl4AVAZbBl4AXgBeAF4AXgBeAF4AXgBeAF4AXgBeAGMGXgBqBnEGXgBeAF4AXgBeAF4AXgBeAF4AXgB5BoAG4wSGBo4GkwaAAIADHgR5AF4AXgBeAJsGgABGA4AAowarBrMGswagALsGwwbLBjAA0wbaBtoG3QbaBtoG2gbaBtoG2gblBusG8wb7BgMHCwcTBxsHCwcjBysHMAc1BzUHOgdCB9oGSgdSB1oHYAfaBloHaAfaBlIH2gbaBtoG2gbaBtoG2gbaBjUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHbQdeAF4ANQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQd1B30HNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1B4MH2gaKB68EgACAAIAAgACAAIAAgACAAI8HlwdeAJ8HpweAAIAArwe3B14AXgC/B8UHygcwANAH2AfgB4AA6AfwBz4B+AcACFwBCAgPCBcIogEYAR8IJwiAAC8INwg/CCADRwhPCFcIXwhnCEoDGgSAAIAAgABvCHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIfQh3CHgIeQh6CHsIfAh9CHcIeAh5CHoIewh8CH0Idwh4CHkIegh7CHwIhAiLCI4IMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwAJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlggwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAANQc1BzUHNQc1BzUHNQc1BzUHNQc1B54INQc1B6II2gaqCLIIugiAAIAAvgjGCIAAgACAAIAAgACAAIAAgACAAIAAywiHAYAA0wiAANkI3QjlCO0I9Aj8CIAAgACAAAIJCgkSCRoJIgknCTYHLwk3CZYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiWCJYIlgiAAIAAAAFAAXgBeAGAAcABeAHwAQACQAKAArQC9AJ4AXgBeAE0A3gBRAN4A7AD8AMwBGgEAAKcBNwEFAUwBXAF4QkhCmEKnArcCgAHHAsABz4LAAcABwAHAAd+C6ABoAG+C/4LAAcABwAHAAc+DF4MAAcAB54M3gweDV4Nng3eDaABoAGgAaABoAGgAaABoAGgAaABoAGgAaABoAGgAaABoAGgAaABoAEeDqABVg6WDqABoQ6gAaABoAHXDvcONw/3DvcO9w73DvcO9w73DvcO9w73DvcO9w73DvcO9w73DvcO9w73DvcO9w73DvcO9w73DvcO9w73DvcO9w73DncPAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcAB7cPPwlGCU4JMACAAIAAgABWCV4JYQmAAGkJcAl4CXwJgAkwADAAMAAwAIgJgACLCZMJgACZCZ8JowmrCYAAswkwAF4AXgB8AIAAuwkABMMJyQmAAM4JgADVCTAAMAAwADAAgACAAIAAgACAAIAAgACAAIAAqwYWBNkIMAAwADAAMADdCeAJ6AnuCR4E9gkwAP4JBQoNCjAAMACAABUK0wiAAB0KJAosCjQKgAAwADwKQwqAAEsKvQmdCVMKWwowADAAgACAALcEMACAAGMKgABrCjAAMAAwADAAMAAwADAAMAAwADAAMAAeBDAAMAAwADAAMAAwADAAMAAwADAAMAAwAIkEPQFzCnoKiQSCCooKkAqJBJgKoAqkCokEGAGsCrQKvArBCjAAMADJCtEKFQHZCuEK/gHpCvEKMAAwADAAMACAAIwE+QowAIAAPwEBCzAAMAAwADAAMACAAAkLEQswAIAAPwEZCyELgAAOCCkLMAAxCzkLMAAwADAAMAAwADAAXgBeAEELMAAwADAAMAAwADAAMAAwAEkLTQtVC4AAXAtkC4AAiQkwADAAMAAwADAAMAAwADAAbAtxC3kLgAuFC4sLMAAwAJMLlwufCzAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAApwswADAAMACAAIAAgACvC4AAgACAAIAAgACAALcLMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAvwuAAMcLgACAAIAAgACAAIAAyguAAIAAgACAAIAA0QswADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAANkLgACAAIAA4AswADAAMAAwADAAMAAwADAAMAAwADAAMAAwAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACJCR4E6AswADAAhwHwC4AA+AsADAgMEAwwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMACAAIAAGAwdDCUMMAAwAC0MNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQw1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHPQwwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADUHNQc1BzUHNQc1BzUHNQc2BzAAMAA5DDUHNQc1BzUHNQc1BzUHNQc1BzUHNQdFDDAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAgACAAIAATQxSDFoMMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwAF4AXgBeAF4AXgBeAF4AYgxeAGoMXgBxDHkMfwxeAIUMXgBeAI0MMAAwADAAMAAwAF4AXgCVDJ0MMAAwADAAMABeAF4ApQxeAKsMswy7DF4Awgy9DMoMXgBeAF4AXgBeAF4AXgBeAF4AXgDRDNkMeQBqCeAM3Ax8AOYM7Az0DPgMXgBeAF4AXgBeAF4AXgBeAF4AXgBeAF4AXgBeAF4AXgCgAAANoAAHDQ4NFg0wADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAeDSYNMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwAIAAgACAAIAAgACAAC4NMABeAF4ANg0wADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwAD4NRg1ODVYNXg1mDTAAbQ0wADAAMAAwADAAMAAwADAA2gbaBtoG2gbaBtoG2gbaBnUNeg3CBYANwgWFDdoGjA3aBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gaUDZwNpA2oDdoG2gawDbcNvw3HDdoG2gbPDdYN3A3fDeYN2gbsDfMN2gbaBvoN/g3aBgYODg7aBl4AXgBeABYOXgBeACUG2gYeDl4AJA5eACwO2w3aBtoGMQ45DtoG2gbaBtoGQQ7aBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gZJDjUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1B1EO2gY1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQdZDjUHNQc1BzUHNQc1B2EONQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHaA41BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1B3AO2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gY1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1BzUHNQc1B2EO2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gZJDtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBtoG2gbaBkkOeA6gAKAAoAAwADAAMAAwAKAAoACgAKAAoACgAKAAgA4wADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAD//wQABAAEAAQABAAEAAQABAAEAA0AAwABAAEAAgAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAKABMAFwAeABsAGgAeABcAFgASAB4AGwAYAA8AGAAcAEsASwBLAEsASwBLAEsASwBLAEsAGAAYAB4AHgAeABMAHgBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAFgAbABIAHgAeAB4AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQABYADQARAB4ABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsABAAEAAQABAAEAAUABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAkAFgAaABsAGwAbAB4AHQAdAB4ATwAXAB4ADQAeAB4AGgAbAE8ATwAOAFAAHQAdAB0ATwBPABcATwBPAE8AFgBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAB4AHgAeAB4AUABQAFAAUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAB4AHgAeAFAATwBAAE8ATwBPAEAATwBQAFAATwBQAB4AHgAeAB4AHgAeAB0AHQAdAB0AHgAdAB4ADgBQAFAAUABQAFAAHgAeAB4AHgAeAB4AHgBQAB4AUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAJAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAkACQAJAAkACQAJAAkABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAeAB4AHgAeAFAAHgAeAB4AKwArAFAAUABQAFAAGABQACsAKwArACsAHgAeAFAAHgBQAFAAUAArAFAAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAAEAAQABAAEAAQABAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAUAAeAB4AHgAeAB4AHgArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwAYAA0AKwArAB4AHgAbACsABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQADQAEAB4ABAAEAB4ABAAEABMABAArACsAKwArACsAKwArACsAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAKwArACsAKwArAFYAVgBWAB4AHgArACsAKwArACsAKwArACsAKwArACsAHgAeAB4AHgAeAB4AHgAeAB4AGgAaABoAGAAYAB4AHgAEAAQABAAEAAQABAAEAAQABAAEAAQAEwAEACsAEwATAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABABLAEsASwBLAEsASwBLAEsASwBLABoAGQAZAB4AUABQAAQAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQABMAUAAEAAQABAAEAAQABAAEAB4AHgAEAAQABAAEAAQABABQAFAABAAEAB4ABAAEAAQABABQAFAASwBLAEsASwBLAEsASwBLAEsASwBQAFAAUAAeAB4AUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwAeAFAABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQAUABQAB4AHgAYABMAUAArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAFAABAAEAAQABAAEAFAABAAEAAQAUAAEAAQABAAEAAQAKwArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAArACsAHgArAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAeAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABABQAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAFAABAAEAAQABAAEAAQABABQAFAAUABQAFAAUABQAFAAUABQAAQABAANAA0ASwBLAEsASwBLAEsASwBLAEsASwAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQAKwBQAFAAUABQAFAAUABQAFAAKwArAFAAUAArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUAArAFAAKwArACsAUABQAFAAUAArACsABABQAAQABAAEAAQABAAEAAQAKwArAAQABAArACsABAAEAAQAUAArACsAKwArACsAKwArACsABAArACsAKwArAFAAUAArAFAAUABQAAQABAArACsASwBLAEsASwBLAEsASwBLAEsASwBQAFAAGgAaAFAAUABQAFAAUABMAB4AGwBQAB4AKwArACsABAAEAAQAKwBQAFAAUABQAFAAUAArACsAKwArAFAAUAArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUAArAFAAUAArAFAAUAArAFAAUAArACsABAArAAQABAAEAAQABAArACsAKwArAAQABAArACsABAAEAAQAKwArACsABAArACsAKwArACsAKwArAFAAUABQAFAAKwBQACsAKwArACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwAEAAQAUABQAFAABAArACsAKwArACsAKwArACsAKwArACsABAAEAAQAKwBQAFAAUABQAFAAUABQAFAAUAArAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUAArAFAAUAArAFAAUABQAFAAUAArACsABABQAAQABAAEAAQABAAEAAQABAArAAQABAAEACsABAAEAAQAKwArAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAAQABAArACsASwBLAEsASwBLAEsASwBLAEsASwAeABsAKwArACsAKwArACsAKwBQAAQABAAEAAQABAAEACsABAAEAAQAKwBQAFAAUABQAFAAUABQAFAAKwArAFAAUAArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQAKwArAAQABAArACsABAAEAAQAKwArACsAKwArACsAKwArAAQABAArACsAKwArAFAAUAArAFAAUABQAAQABAArACsASwBLAEsASwBLAEsASwBLAEsASwAeAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwAEAFAAKwBQAFAAUABQAFAAUAArACsAKwBQAFAAUAArAFAAUABQAFAAKwArACsAUABQACsAUAArAFAAUAArACsAKwBQAFAAKwArACsAUABQAFAAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwAEAAQABAAEAAQAKwArACsABAAEAAQAKwAEAAQABAAEACsAKwBQACsAKwArACsAKwArAAQAKwArACsAKwArACsAKwArACsAKwBLAEsASwBLAEsASwBLAEsASwBLAFAAUABQAB4AHgAeAB4AHgAeABsAHgArACsAKwArACsABAAEAAQABAArAFAAUABQAFAAUABQAFAAUAArAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArAFAABAAEAAQABAAEAAQABAArAAQABAAEACsABAAEAAQABAArACsAKwArACsAKwArAAQABAArAFAAUABQACsAKwArACsAKwBQAFAABAAEACsAKwBLAEsASwBLAEsASwBLAEsASwBLACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAB4AUAAEAAQABAArAFAAUABQAFAAUABQAFAAUAArAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQACsAKwAEAFAABAAEAAQABAAEAAQABAArAAQABAAEACsABAAEAAQABAArACsAKwArACsAKwArAAQABAArACsAKwArACsAKwArAFAAKwBQAFAABAAEACsAKwBLAEsASwBLAEsASwBLAEsASwBLACsAUABQACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAFAABAAEAAQABAAEAAQABAArAAQABAAEACsABAAEAAQABABQAB4AKwArACsAKwBQAFAAUAAEAFAAUABQAFAAUABQAFAAUABQAFAABAAEACsAKwBLAEsASwBLAEsASwBLAEsASwBLAFAAUABQAFAAUABQAFAAUABQABoAUABQAFAAUABQAFAAKwArAAQABAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQACsAUAArACsAUABQAFAAUABQAFAAUAArACsAKwAEACsAKwArACsABAAEAAQABAAEAAQAKwAEACsABAAEAAQABAAEAAQABAAEACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArAAQABAAeACsAKwArACsAKwArACsAKwArACsAKwArAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXAAqAFwAXAAqACoAKgAqACoAKgAqACsAKwArACsAGwBcAFwAXABcAFwAXABcACoAKgAqACoAKgAqACoAKgAeAEsASwBLAEsASwBLAEsASwBLAEsADQANACsAKwArACsAKwBcAFwAKwBcACsAKwBcAFwAKwBcACsAKwBcACsAKwArACsAKwArAFwAXABcAFwAKwBcAFwAXABcAFwAXABcACsAXABcAFwAKwBcACsAXAArACsAXABcACsAXABcAFwAXAAqAFwAXAAqACoAKgAqACoAKgArACoAKgBcACsAKwBcAFwAXABcAFwAKwBcACsAKgAqACoAKgAqACoAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArAFwAXABcAFwAUAAOAA4ADgAOAB4ADgAOAAkADgAOAA0ACQATABMAEwATABMACQAeABMAHgAeAB4ABAAEAB4AHgAeAB4AHgAeAEsASwBLAEsASwBLAEsASwBLAEsAUABQAFAAUABQAFAAUABQAFAAUAANAAQAHgAEAB4ABAAWABEAFgARAAQABABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAANAAQABAAEAAQABAANAAQABABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEACsABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsADQANAB4AHgAeAB4AHgAeAAQAHgAeAB4AHgAeAB4AKwAeAB4ADgAOAA0ADgAeAB4AHgAeAB4ACQAJACsAKwArACsAKwBcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqAFwASwBLAEsASwBLAEsASwBLAEsASwANAA0AHgAeAB4AHgBcAFwAXABcAFwAXAAqACoAKgAqAFwAXABcAFwAKgAqACoAXAAqACoAKgBcAFwAKgAqACoAKgAqACoAKgBcAFwAXAAqACoAKgAqAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAKgAqACoAKgAqACoAKgAqACoAKgAqACoAXAAqAEsASwBLAEsASwBLAEsASwBLAEsAKgAqACoAKgAqACoAUABQAFAAUABQAFAAKwBQACsAKwArACsAKwBQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAFAAUABQAFAAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQACsAKwBQAFAAUABQAFAAUABQACsAUAArAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUAArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUAArACsAUABQAFAAUABQAFAAUAArAFAAKwBQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwAEAAQABAAeAA0AHgAeAB4AHgAeAB4AHgBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAB4AHgAeAB4AHgAeAB4AHgAeACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAFAAUABQAFAAUABQACsAKwANAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAB4AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAA0AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQABYAEQArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAADQANAA0AUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAABAAEAAQAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAA0ADQArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQACsABAAEACsAKwArACsAKwArACsAKwArACsAKwArAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXAAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoADQANABUAXAANAB4ADQAbAFwAKgArACsASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArAB4AHgATABMADQANAA4AHgATABMAHgAEAAQABAAJACsASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAUABQAFAAUABQAAQABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABABQACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArACsABAAEAAQABAAEAAQABAAEAAQABAAEAAQAKwArACsAKwAeACsAKwArABMAEwBLAEsASwBLAEsASwBLAEsASwBLAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcACsAKwBcAFwAXABcAFwAKwArACsAKwArACsAKwArACsAKwArAFwAXABcAFwAXABcAFwAXABcAFwAXABcACsAKwArACsAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAKwArACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwBcACsAKwArACoAKgBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEACsAKwAeAB4AXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAKgAqACoAKgAqACoAKgAqACoAKgArACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgArACsABABLAEsASwBLAEsASwBLAEsASwBLACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAKgAqACoAKgAqACoAKgBcACoAKgAqACoAKgAqACsAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArAAQABAAEAAQABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQAUABQAFAAUABQAFAAUAArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsADQANAB4ADQANAA0ADQAeAB4AHgAeAB4AHgAeAB4AHgAeAAQABAAEAAQABAAEAAQABAAEAB4AHgAeAB4AHgAeAB4AHgAeACsAKwArAAQABAAEAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAUABQAEsASwBLAEsASwBLAEsASwBLAEsAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArACsAKwArACsAKwArACsAHgAeAB4AHgBQAFAAUABQAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArACsAKwANAA0ADQANAA0ASwBLAEsASwBLAEsASwBLAEsASwArACsAKwBQAFAAUABLAEsASwBLAEsASwBLAEsASwBLAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAANAA0AUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAB4AHgAeAB4AHgAeAB4AHgArACsAKwArACsAKwArACsABAAEAAQAHgAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAFAAUABQAFAABABQAFAAUABQAAQABAAEAFAAUAAEAAQABAArACsAKwArACsAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAKwAEAAQABAAEAAQAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAUABQAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAUAArAFAAKwBQACsAUAArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACsAHgAeAB4AHgAeAB4AHgAeAFAAHgAeAB4AUABQAFAAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAFAAUABQAFAAKwArAB4AHgAeAB4AHgAeACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAUABQAFAAKwAeAB4AHgAeAB4AHgAeAA4AHgArAA0ADQANAA0ADQANAA0ACQANAA0ADQAIAAQACwAEAAQADQAJAA0ADQAMAB0AHQAeABcAFwAWABcAFwAXABYAFwAdAB0AHgAeABQAFAAUAA0AAQABAAQABAAEAAQABAAJABoAGgAaABoAGgAaABoAGgAeABcAFwAdABUAFQAeAB4AHgAeAB4AHgAYABYAEQAVABUAFQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgANAB4ADQANAA0ADQAeAA0ADQANAAcAHgAeAB4AHgArAAQABAAEAAQABAAEAAQABAAEAAQAUABQACsAKwBPAFAAUABQAFAAUAAeAB4AHgAWABEATwBQAE8ATwBPAE8AUABQAFAAUABQAB4AHgAeABYAEQArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAGwAbABsAGwAbABsAGwAaABsAGwAbABsAGwAbABsAGwAbABsAGwAbABsAGwAaABsAGwAbABsAGgAbABsAGgAbABsAGwAbABsAGwAbABsAGwAbABsAGwAbABsAGwAbABsABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAB4AHgBQABoAHgAdAB4AUAAeABoAHgAeAB4AHgAeAB4AHgAeAB4ATwAeAFAAGwAeAB4AUABQAFAAUABQAB4AHgAeAB0AHQAeAFAAHgBQAB4AUAAeAFAATwBQAFAAHgAeAB4AHgAeAB4AHgBQAFAAUABQAFAAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAB4AUABQAFAAUABPAE8AUABQAFAAUABQAE8AUABQAE8AUABPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBQAFAAUABQAE8ATwBPAE8ATwBPAE8ATwBPAE8AUABQAFAAUABQAFAAUABQAFAAHgAeAFAAUABQAFAATwAeAB4AKwArACsAKwAdAB0AHQAdAB0AHQAdAB0AHQAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB4AHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHQAeAB0AHQAeAB4AHgAdAB0AHgAeAB0AHgAeAB4AHQAeAB0AGwAbAB4AHQAeAB4AHgAeAB0AHgAeAB0AHQAdAB0AHgAeAB0AHgAdAB4AHQAdAB0AHQAdAB0AHgAdAB4AHgAeAB4AHgAdAB0AHQAdAB4AHgAeAB4AHQAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHQAeAB4AHgAdAB4AHgAeAB4AHgAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHQAdAB4AHgAdAB0AHQAdAB4AHgAdAB0AHgAeAB0AHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB0AHgAeAB0AHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB0AHgAeAB4AHQAeAB4AHgAeAB4AHgAeAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeABQAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAWABEAFgARAB4AHgAeAB4AHgAeAB0AHgAeAB4AHgAeAB4AHgAlACUAHgAeAB4AHgAeAB4AHgAeAB4AFgARAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACUAJQAlACUAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBQAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB4AHgAeAB4AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHgAeAB0AHQAdAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB0AHgAdAB0AHQAdAB0AHQAdAB4AHgAeAB4AHgAeAB4AHgAdAB0AHgAeAB0AHQAeAB4AHgAeAB0AHQAeAB4AHgAeAB0AHQAdAB4AHgAdAB4AHgAdAB0AHQAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHQAdAB0AHQAeAB4AHgAeAB4AHgAeAB4AHgAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAeAB0AHQAeAB4AHQAeAB4AHgAeAB0AHQAeAB4AHgAeACUAJQAdAB0AJQAeACUAJQAlACAAJQAlAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AJQAlACUAHgAeAB4AHgAdAB4AHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHQAdAB4AHQAdAB0AHgAdACUAHQAdAB4AHQAdAB4AHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAlAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB0AHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAlACUAJQAlACUAJQAlACUAHQAdAB0AHQAlAB4AJQAlACUAHQAlACUAHQAdAB0AJQAlAB0AHQAlAB0AHQAlACUAJQAeAB0AHgAeAB4AHgAdAB0AJQAdAB0AHQAdAB0AHQAlACUAJQAlACUAHQAlACUAIAAlAB0AHQAlACUAJQAlACUAJQAlACUAHgAeAB4AJQAlACAAIAAgACAAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB4AHgAeABcAFwAXABcAFwAXAB4AEwATACUAHgAeAB4AFgARABYAEQAWABEAFgARABYAEQAWABEAFgARAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAWABEAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AFgARABYAEQAWABEAFgARABYAEQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeABYAEQAWABEAFgARABYAEQAWABEAFgARABYAEQAWABEAFgARABYAEQAWABEAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AFgARABYAEQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeABYAEQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHQAdAB0AHQAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwAeAB4AHgAeAB4AHgAeAB4AHgArACsAKwArACsAKwArACsAKwArACsAKwArAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAEAAQABAAeAB4AKwArACsAKwArABMADQANAA0AUAATAA0AUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAUAANACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAEAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXAA0ADQANAA0ADQANAA0ADQAeAA0AFgANAB4AHgAXABcAHgAeABcAFwAWABEAFgARABYAEQAWABEADQANAA0ADQATAFAADQANAB4ADQANAB4AHgAeAB4AHgAMAAwADQANAA0AHgANAA0AFgANAA0ADQANAA0ADQANACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACsAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAKwArACsAKwArACsAKwArACsAKwArACsAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAlACUAJQAlACUAJQAlACUAJQAlACUAJQArACsAKwArAA0AEQARACUAJQBHAFcAVwAWABEAFgARABYAEQAWABEAFgARACUAJQAWABEAFgARABYAEQAWABEAFQAWABEAEQAlAFcAVwBXAFcAVwBXAFcAVwBXAAQABAAEAAQABAAEACUAVwBXAFcAVwA2ACUAJQBXAFcAVwBHAEcAJQAlACUAKwBRAFcAUQBXAFEAVwBRAFcAUQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFEAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBRAFcAUQBXAFEAVwBXAFcAVwBXAFcAUQBXAFcAVwBXAFcAVwBRAFEAKwArAAQABAAVABUARwBHAFcAFQBRAFcAUQBXAFEAVwBRAFcAUQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFEAVwBRAFcAUQBXAFcAVwBXAFcAVwBRAFcAVwBXAFcAVwBXAFEAUQBXAFcAVwBXABUAUQBHAEcAVwArACsAKwArACsAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAKwArAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwArACUAJQBXAFcAVwBXACUAJQAlACUAJQAlACUAJQAlACUAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAKwArACsAKwArACUAJQAlACUAKwArACsAKwArACsAKwArACsAKwArACsAUQBRAFEAUQBRAFEAUQBRAFEAUQBRAFEAUQBRAFEAUQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACsAVwBXAFcAVwBXAFcAVwBXAFcAVwAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlAE8ATwBPAE8ATwBPAE8ATwAlAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACUAJQAlACUAJQAlACUAJQAlACUAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAEcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAKwArACsAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAADQATAA0AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABLAEsASwBLAEsASwBLAEsASwBLAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAFAABAAEAAQABAAeAAQABAAEAAQABAAEAAQABAAEAAQAHgBQAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AUABQAAQABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAeAA0ADQANAA0ADQArACsAKwArACsAKwArACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAFAAUABQAFAAUABQAFAAUABQAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAB4AHgAeAB4AHgAeAFAAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArAB4AHgAeAB4AHgAeAB4AHgArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAAQAUABQAFAABABQAFAAUABQAAQAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAeAB4AHgAeACsAKwArACsAUABQAFAAUABQAFAAHgAeABoAHgArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAADgAOABMAEwArACsAKwArACsAKwArACsABAAEAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwANAA0ASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArACsAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABABQAFAAUABQAFAAUAAeAB4AHgBQAA4AUAArACsAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAA0ADQBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAKwArACsAKwArACsAKwArACsAKwArAB4AWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYACsAKwArAAQAHgAeAB4AHgAeAB4ADQANAA0AHgAeAB4AHgArAFAASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArAB4AHgBcAFwAXABcAFwAKgBcAFwAXABcAFwAXABcAFwAXABcAEsASwBLAEsASwBLAEsASwBLAEsAXABcAFwAXABcACsAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwArAFAAUABQAAQAUABQAFAAUABQAFAAUABQAAQABAArACsASwBLAEsASwBLAEsASwBLAEsASwArACsAHgANAA0ADQBcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAKgAqACoAXAAqACoAKgBcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXAAqAFwAKgAqACoAXABcACoAKgBcAFwAXABcAFwAKgAqAFwAKgBcACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFwAXABcACoAKgBQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAA0ADQBQAFAAUAAEAAQAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUAArACsAUABQAFAAUABQAFAAKwArAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQADQAEAAQAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAVABVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBUAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVACsAKwArACsAKwArACsAKwArACsAKwArAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAKwArACsAKwBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAKwArACsAKwAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACUAJQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAJQAlACUAJQAlACUAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAKwArACsAKwArAFYABABWAFYAVgBWAFYAVgBWAFYAVgBWAB4AVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgArAFYAVgBWAFYAVgArAFYAKwBWAFYAKwBWAFYAKwBWAFYAVgBWAFYAVgBWAFYAVgBWAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAEQAWAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUAAaAB4AKwArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAGAARABEAGAAYABMAEwAWABEAFAArACsAKwArACsAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACUAJQAlACUAJQAWABEAFgARABYAEQAWABEAFgARABYAEQAlACUAFgARACUAJQAlACUAJQAlACUAEQAlABEAKwAVABUAEwATACUAFgARABYAEQAWABEAJQAlACUAJQAlACUAJQAlACsAJQAbABoAJQArACsAKwArAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAAcAKwATACUAJQAbABoAJQAlABYAEQAlACUAEQAlABEAJQBXAFcAVwBXAFcAVwBXAFcAVwBXABUAFQAlACUAJQATACUAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXABYAJQARACUAJQAlAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwAWACUAEQAlABYAEQARABYAEQARABUAVwBRAFEAUQBRAFEAUQBRAFEAUQBRAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAEcARwArACsAVwBXAFcAVwBXAFcAKwArAFcAVwBXAFcAVwBXACsAKwBXAFcAVwBXAFcAVwArACsAVwBXAFcAKwArACsAGgAbACUAJQAlABsAGwArAB4AHgAeAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAKwAEAAQABAAQAB0AKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsADQANAA0AKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArAB4AHgAeAB4AHgAeAB4AHgAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAFAAHgAeAB4AKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAKwArAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAAQAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsADQBQAFAAUABQACsAKwArACsAUABQAFAAUABQAFAAUABQAA0AUABQAFAAUABQACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUAArACsAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQACsAKwArAFAAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAA0AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAB4AHgBQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsADQBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArAB4AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwBQAFAAUABQAFAABAAEAAQAKwAEAAQAKwArACsAKwArAAQABAAEAAQAUABQAFAAUAArAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsABAAEAAQAKwArACsAKwAEAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsADQANAA0ADQANAA0ADQANAB4AKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAB4AUABQAFAAUABQAFAAUABQAB4AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEACsAKwArACsAUABQAFAAUABQAA0ADQANAA0ADQANABQAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwANAA0ADQANAA0ADQANAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAHgAeAB4AHgArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwBQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAA0ADQAeAB4AHgAeAB4AKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAEAAQABAAEAAQABAAeAB4AHgANAA0ADQANACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwBLAEsASwBLAEsASwBLAEsASwBLACsAKwArACsAKwArAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsASwBLAEsASwBLAEsASwBLAEsASwANAA0ADQANACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAeAA4AUAArACsAKwArACsAKwArACsAKwAEAFAAUABQAFAADQANAB4ADQAeAAQABAAEAB4AKwArAEsASwBLAEsASwBLAEsASwBLAEsAUAAOAFAADQANAA0AKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAANAA0AHgANAA0AHgAEACsAUABQAFAAUABQAFAAUAArAFAAKwBQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAA0AKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsABAAEAAQABAArAFAAUABQAFAAUABQAFAAUAArACsAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAArACsABAAEACsAKwAEAAQABAArACsAUAArACsAKwArACsAKwAEACsAKwArACsAKwBQAFAAUABQAFAABAAEACsAKwAEAAQABAAEAAQABAAEACsAKwArAAQABAAEAAQABAArACsAKwArACsAKwArACsAKwArACsABAAEAAQABAAEAAQABABQAFAAUABQAA0ADQANAA0AHgBLAEsASwBLAEsASwBLAEsASwBLACsADQArAB4AKwArAAQABAAEAAQAUABQAB4AUAArACsAKwArACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEACsAKwAEAAQABAAEAAQABAAEAAQABAAOAA0ADQATABMAHgAeAB4ADQANAA0ADQANAA0ADQANAA0ADQANAA0ADQANAA0AUABQAFAAUAAEAAQAKwArAAQADQANAB4AUAArACsAKwArACsAKwArACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArACsAKwAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXAArACsAKwAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAXABcAA0ADQANACoASwBLAEsASwBLAEsASwBLAEsASwBQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwBQAFAABAAEAAQABAAEAAQABAAEAAQABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAFAABAAEAAQABAAOAB4ADQANAA0ADQAOAB4ABAArACsAKwArACsAKwArACsAUAAEAAQABAAEAAQABAAEAAQABAAEAAQAUABQAFAAUAArACsAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAA0ADQANACsADgAOAA4ADQANACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEACsABAAEAAQABAAEAAQABAAEAFAADQANAA0ADQANACsAKwArACsAKwArACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwAOABMAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQACsAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAArACsAKwAEACsABAAEACsABAAEAAQABAAEAAQABABQAAQAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsADQANAA0ADQANACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAASABIAEgAQwBDAEMAUABQAFAAUABDAFAAUABQAEgAQwBIAEMAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAASABDAEMAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABIAEMAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwANAA0AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAAQABAAEAAQABAANACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAA0ADQANAB4AHgAeAB4AHgAeAFAAUABQAFAADQAeACsAKwArACsAKwArACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwArAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsABAAEAAQABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAEcARwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwArACsAKwArACsAKwArACsAKwArACsAKwArAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQACsAKwAeAAQABAANAAQABAAEAAQAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACsAKwArACsAKwArACsAKwArACsAHgAeAB4AHgAeAB4AHgArACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAAEAAQABAAEAB4AHgAeAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAHgAeAAQABAAEAAQABAAEAAQAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAEAAQABAAEAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAB4AHgAEAAQABAAeACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArAFAAUAArACsAUAArACsAUABQACsAKwBQAFAAUABQACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwBQACsAUABQAFAAUABQAFAAUAArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAKwAeAB4AUABQAFAAUABQACsAUAArACsAKwBQAFAAUABQAFAAUABQACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHgAeAB4AHgAeAB4AHgAeAB4AKwArAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAB4AHgAeAB4ABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAB4AHgAeAB4AHgAeAB4AHgAEAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAAeAB4ADQANAA0ADQAeACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAAQABAAEAAQABAArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsABAAEAAQABAAEAAQABAArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArACsABAAEAAQABAAEAAQABAArAAQABAArAAQABAAEAAQABAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAEAAQAKwArACsAKwArACsAKwArACsAHgAeAB4AHgAEAAQABAAEAAQABAAEACsAKwArACsAKwBLAEsASwBLAEsASwBLAEsASwBLACsAKwArACsAFgAWAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUAArAFAAKwArAFAAKwBQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUAArAFAAKwBQACsAKwArACsAKwArAFAAKwArACsAKwBQACsAUAArAFAAKwBQAFAAUAArAFAAUAArAFAAKwArAFAAKwBQACsAUAArAFAAKwBQACsAUABQACsAUAArACsAUABQAFAAUAArAFAAUABQAFAAUABQAFAAKwBQAFAAUABQACsAUABQAFAAUAArAFAAKwBQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwBQAFAAUAArAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAB4AHgArACsAKwArACsAKwArACsAKwArACsAKwArACsATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwAlACUAJQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAeACUAHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHgAeACUAJQAlACUAHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACkAKQApACkAKQApACkAKQApACkAKQApACkAKQApACkAKQApACkAKQApACkAKQApACkAKQAlACUAJQAlACUAIAAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlAB4AHgAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAHgAeACUAJQAlACUAJQAeACUAJQAlACUAJQAgACAAIAAlACUAIAAlACUAIAAgACAAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAIQAhACEAIQAhACUAJQAgACAAJQAlACAAIAAgACAAIAAgACAAIAAgACAAIAAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAIAAgACAAIAAlACUAJQAlACAAJQAgACAAIAAgACAAIAAgACAAIAAlACUAJQAgACUAJQAlACUAIAAgACAAJQAgACAAIAAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAeACUAHgAlAB4AJQAlACUAJQAlACAAJQAlACUAJQAeACUAHgAeACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAHgAeAB4AHgAeAB4AHgAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlAB4AHgAeAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAIAAgACUAJQAlACUAIAAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAIAAlACUAJQAlACAAIAAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAeAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlAB4AHgAeAB4AHgAeACUAJQAlACUAJQAlACUAIAAgACAAJQAlACUAIAAgACAAIAAgAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AFwAXABcAFQAVABUAHgAeAB4AHgAlACUAJQAgACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAIAAgACAAJQAlACUAJQAlACUAJQAlACUAIAAlACUAJQAlACUAJQAlACUAJQAlACUAIAAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAlACUAJQAlACUAJQAlACUAJQAlACUAJQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAlACUAJQAlAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAlACUAJQAlAB4AHgAeAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAlACUAHgAeAB4AHgAeAB4AHgAeACUAJQAlACUAJQAlACUAJQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACUAJQAlACUAJQAlACUAJQAlACUAJQAlACAAIAAgACAAIAAlACAAIAAlACUAJQAlACUAJQAgACUAJQAlACUAJQAlACUAJQAlACAAIAAgACAAIAAgACAAIAAgACAAJQAlACUAIAAgACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACsAKwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAJQAlACUAJQAlACUAJQAlACUAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAJQAlACUAJQAlACUAJQAlACUAJQAlAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQArAAQAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsA';

    var LineBreak = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.LineBreaker = exports.inlineBreakOpportunities = exports.lineBreakAtIndex = exports.codePointsToCharacterClasses = exports.UnicodeTrie = exports.BREAK_ALLOWED = exports.BREAK_NOT_ALLOWED = exports.BREAK_MANDATORY = exports.classes = exports.LETTER_NUMBER_MODIFIER = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();





    var _linebreakTrie2 = _interopRequireDefault(linebreakTrie);



    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var LETTER_NUMBER_MODIFIER = exports.LETTER_NUMBER_MODIFIER = 50;

    // Non-tailorable Line Breaking Classes
    var BK = 1; //  Cause a line break (after)
    var CR = 2; //  Cause a line break (after), except between CR and LF
    var LF = 3; //  Cause a line break (after)
    var CM = 4; //  Prohibit a line break between the character and the preceding character
    var NL = 5; //  Cause a line break (after)
    var SG = 6; //  Do not occur in well-formed text
    var WJ = 7; //  Prohibit line breaks before and after
    var ZW = 8; //  Provide a break opportunity
    var GL = 9; //  Prohibit line breaks before and after
    var SP = 10; // Enable indirect line breaks
    var ZWJ = 11; // Prohibit line breaks within joiner sequences
    // Break Opportunities
    var B2 = 12; //  Provide a line break opportunity before and after the character
    var BA = 13; //  Generally provide a line break opportunity after the character
    var BB = 14; //  Generally provide a line break opportunity before the character
    var HY = 15; //  Provide a line break opportunity after the character, except in numeric context
    var CB = 16; //   Provide a line break opportunity contingent on additional information
    // Characters Prohibiting Certain Breaks
    var CL = 17; //  Prohibit line breaks before
    var CP = 18; //  Prohibit line breaks before
    var EX = 19; //  Prohibit line breaks before
    var IN = 20; //  Allow only indirect line breaks between pairs
    var NS = 21; //  Allow only indirect line breaks before
    var OP = 22; //  Prohibit line breaks after
    var QU = 23; //  Act like they are both opening and closing
    // Numeric Context
    var IS = 24; //  Prevent breaks after any and before numeric
    var NU = 25; //  Form numeric expressions for line breaking purposes
    var PO = 26; //  Do not break following a numeric expression
    var PR = 27; //  Do not break in front of a numeric expression
    var SY = 28; //  Prevent a break before; and allow a break after
    // Other Characters
    var AI = 29; //  Act like AL when the resolvedEAW is N; otherwise; act as ID
    var AL = 30; //  Are alphabetic characters or symbols that are used with alphabetic characters
    var CJ = 31; //  Treat as NS or ID for strict or normal breaking.
    var EB = 32; //  Do not break from following Emoji Modifier
    var EM = 33; //  Do not break from preceding Emoji Base
    var H2 = 34; //  Form Korean syllable blocks
    var H3 = 35; //  Form Korean syllable blocks
    var HL = 36; //  Do not break around a following hyphen; otherwise act as Alphabetic
    var ID = 37; //  Break before or after; except in some numeric context
    var JL = 38; //  Form Korean syllable blocks
    var JV = 39; //  Form Korean syllable blocks
    var JT = 40; //  Form Korean syllable blocks
    var RI = 41; //  Keep pairs together. For pairs; break before and after other classes
    var SA = 42; //  Provide a line break opportunity contingent on additional, language-specific context analysis
    var XX = 43; //  Have as yet unknown line breaking behavior or unassigned code positions

    var classes = exports.classes = {
        BK: BK,
        CR: CR,
        LF: LF,
        CM: CM,
        NL: NL,
        SG: SG,
        WJ: WJ,
        ZW: ZW,
        GL: GL,
        SP: SP,
        ZWJ: ZWJ,
        B2: B2,
        BA: BA,
        BB: BB,
        HY: HY,
        CB: CB,
        CL: CL,
        CP: CP,
        EX: EX,
        IN: IN,
        NS: NS,
        OP: OP,
        QU: QU,
        IS: IS,
        NU: NU,
        PO: PO,
        PR: PR,
        SY: SY,
        AI: AI,
        AL: AL,
        CJ: CJ,
        EB: EB,
        EM: EM,
        H2: H2,
        H3: H3,
        HL: HL,
        ID: ID,
        JL: JL,
        JV: JV,
        JT: JT,
        RI: RI,
        SA: SA,
        XX: XX
    };

    var BREAK_MANDATORY = exports.BREAK_MANDATORY = '!';
    var BREAK_NOT_ALLOWED = exports.BREAK_NOT_ALLOWED = '×';
    var BREAK_ALLOWED = exports.BREAK_ALLOWED = '÷';
    var UnicodeTrie = exports.UnicodeTrie = (0, Trie_1.createTrieFromBase64)(_linebreakTrie2.default);

    var ALPHABETICS = [AL, HL];
    var HARD_LINE_BREAKS = [BK, CR, LF, NL];
    var SPACE = [SP, ZW];
    var PREFIX_POSTFIX = [PR, PO];
    var LINE_BREAKS = HARD_LINE_BREAKS.concat(SPACE);
    var KOREAN_SYLLABLE_BLOCK = [JL, JV, JT, H2, H3];
    var HYPHEN = [HY, BA];

    var codePointsToCharacterClasses = exports.codePointsToCharacterClasses = function codePointsToCharacterClasses(codePoints) {
        var lineBreak = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'strict';

        var types = [];
        var indicies = [];
        var categories = [];
        codePoints.forEach(function (codePoint, index) {
            var classType = UnicodeTrie.get(codePoint);
            if (classType > LETTER_NUMBER_MODIFIER) {
                categories.push(true);
                classType -= LETTER_NUMBER_MODIFIER;
            } else {
                categories.push(false);
            }

            if (['normal', 'auto', 'loose'].indexOf(lineBreak) !== -1) {
                // U+2010, – U+2013, 〜 U+301C, ゠ U+30A0
                if ([0x2010, 0x2013, 0x301c, 0x30a0].indexOf(codePoint) !== -1) {
                    indicies.push(index);
                    return types.push(CB);
                }
            }

            if (classType === CM || classType === ZWJ) {
                // LB10 Treat any remaining combining mark or ZWJ as AL.
                if (index === 0) {
                    indicies.push(index);
                    return types.push(AL);
                }

                // LB9 Do not break a combining character sequence; treat it as if it has the line breaking class of
                // the base character in all of the following rules. Treat ZWJ as if it were CM.
                var prev = types[index - 1];
                if (LINE_BREAKS.indexOf(prev) === -1) {
                    indicies.push(indicies[index - 1]);
                    return types.push(prev);
                }
                indicies.push(index);
                return types.push(AL);
            }

            indicies.push(index);

            if (classType === CJ) {
                return types.push(lineBreak === 'strict' ? NS : ID);
            }

            if (classType === SA) {
                return types.push(AL);
            }

            if (classType === AI) {
                return types.push(AL);
            }

            // For supplementary characters, a useful default is to treat characters in the range 10000..1FFFD as AL
            // and characters in the ranges 20000..2FFFD and 30000..3FFFD as ID, until the implementation can be revised
            // to take into account the actual line breaking properties for these characters.
            if (classType === XX) {
                if (codePoint >= 0x20000 && codePoint <= 0x2fffd || codePoint >= 0x30000 && codePoint <= 0x3fffd) {
                    return types.push(ID);
                } else {
                    return types.push(AL);
                }
            }

            types.push(classType);
        });

        return [indicies, types, categories];
    };

    var isAdjacentWithSpaceIgnored = function isAdjacentWithSpaceIgnored(a, b, currentIndex, classTypes) {
        var current = classTypes[currentIndex];
        if (Array.isArray(a) ? a.indexOf(current) !== -1 : a === current) {
            var i = currentIndex;
            while (i <= classTypes.length) {
                i++;
                var next = classTypes[i];

                if (next === b) {
                    return true;
                }

                if (next !== SP) {
                    break;
                }
            }
        }

        if (current === SP) {
            var _i = currentIndex;

            while (_i > 0) {
                _i--;
                var prev = classTypes[_i];

                if (Array.isArray(a) ? a.indexOf(prev) !== -1 : a === prev) {
                    var n = currentIndex;
                    while (n <= classTypes.length) {
                        n++;
                        var _next = classTypes[n];

                        if (_next === b) {
                            return true;
                        }

                        if (_next !== SP) {
                            break;
                        }
                    }
                }

                if (prev !== SP) {
                    break;
                }
            }
        }
        return false;
    };

    var previousNonSpaceClassType = function previousNonSpaceClassType(currentIndex, classTypes) {
        var i = currentIndex;
        while (i >= 0) {
            var type = classTypes[i];
            if (type === SP) {
                i--;
            } else {
                return type;
            }
        }
        return 0;
    };

    var _lineBreakAtIndex = function _lineBreakAtIndex(codePoints, classTypes, indicies, index, forbiddenBreaks) {
        if (indicies[index] === 0) {
            return BREAK_NOT_ALLOWED;
        }

        var currentIndex = index - 1;
        if (Array.isArray(forbiddenBreaks) && forbiddenBreaks[currentIndex] === true) {
            return BREAK_NOT_ALLOWED;
        }

        var beforeIndex = currentIndex - 1;
        var afterIndex = currentIndex + 1;
        var current = classTypes[currentIndex];

        // LB4 Always break after hard line breaks.
        // LB5 Treat CR followed by LF, as well as CR, LF, and NL as hard line breaks.
        var before = beforeIndex >= 0 ? classTypes[beforeIndex] : 0;
        var next = classTypes[afterIndex];

        if (current === CR && next === LF) {
            return BREAK_NOT_ALLOWED;
        }

        if (HARD_LINE_BREAKS.indexOf(current) !== -1) {
            return BREAK_MANDATORY;
        }

        // LB6 Do not break before hard line breaks.
        if (HARD_LINE_BREAKS.indexOf(next) !== -1) {
            return BREAK_NOT_ALLOWED;
        }

        // LB7 Do not break before spaces or zero width space.
        if (SPACE.indexOf(next) !== -1) {
            return BREAK_NOT_ALLOWED;
        }

        // LB8 Break before any character following a zero-width space, even if one or more spaces intervene.
        if (previousNonSpaceClassType(currentIndex, classTypes) === ZW) {
            return BREAK_ALLOWED;
        }

        // LB8a Do not break between a zero width joiner and an ideograph, emoji base or emoji modifier.
        if (UnicodeTrie.get(codePoints[currentIndex]) === ZWJ && (next === ID || next === EB || next === EM)) {
            return BREAK_NOT_ALLOWED;
        }

        // LB11 Do not break before or after Word joiner and related characters.
        if (current === WJ || next === WJ) {
            return BREAK_NOT_ALLOWED;
        }

        // LB12 Do not break after NBSP and related characters.
        if (current === GL) {
            return BREAK_NOT_ALLOWED;
        }

        // LB12a Do not break before NBSP and related characters, except after spaces and hyphens.
        if ([SP, BA, HY].indexOf(current) === -1 && next === GL) {
            return BREAK_NOT_ALLOWED;
        }

        // LB13 Do not break before ‘]’ or ‘!’ or ‘;’ or ‘/’, even after spaces.
        if ([CL, CP, EX, IS, SY].indexOf(next) !== -1) {
            return BREAK_NOT_ALLOWED;
        }

        // LB14 Do not break after ‘[’, even after spaces.
        if (previousNonSpaceClassType(currentIndex, classTypes) === OP) {
            return BREAK_NOT_ALLOWED;
        }

        // LB15 Do not break within ‘”[’, even with intervening spaces.
        if (isAdjacentWithSpaceIgnored(QU, OP, currentIndex, classTypes)) {
            return BREAK_NOT_ALLOWED;
        }

        // LB16 Do not break between closing punctuation and a nonstarter (lb=NS), even with intervening spaces.
        if (isAdjacentWithSpaceIgnored([CL, CP], NS, currentIndex, classTypes)) {
            return BREAK_NOT_ALLOWED;
        }

        // LB17 Do not break within ‘——’, even with intervening spaces.
        if (isAdjacentWithSpaceIgnored(B2, B2, currentIndex, classTypes)) {
            return BREAK_NOT_ALLOWED;
        }

        // LB18 Break after spaces.
        if (current === SP) {
            return BREAK_ALLOWED;
        }

        // LB19 Do not break before or after quotation marks, such as ‘ ” ’.
        if (current === QU || next === QU) {
            return BREAK_NOT_ALLOWED;
        }

        // LB20 Break before and after unresolved CB.
        if (next === CB || current === CB) {
            return BREAK_ALLOWED;
        }

        // LB21 Do not break before hyphen-minus, other hyphens, fixed-width spaces, small kana, and other non-starters, or after acute accents.
        if ([BA, HY, NS].indexOf(next) !== -1 || current === BB) {
            return BREAK_NOT_ALLOWED;
        }

        // LB21a Don't break after Hebrew + Hyphen.
        if (before === HL && HYPHEN.indexOf(current) !== -1) {
            return BREAK_NOT_ALLOWED;
        }

        // LB21b Don’t break between Solidus and Hebrew letters.
        if (current === SY && next === HL) {
            return BREAK_NOT_ALLOWED;
        }

        // LB22 Do not break between two ellipses, or between letters, numbers or exclamations and ellipsis.
        if (next === IN && ALPHABETICS.concat(IN, EX, NU, ID, EB, EM).indexOf(current) !== -1) {
            return BREAK_NOT_ALLOWED;
        }

        // LB23 Do not break between digits and letters.
        if (ALPHABETICS.indexOf(next) !== -1 && current === NU || ALPHABETICS.indexOf(current) !== -1 && next === NU) {
            return BREAK_NOT_ALLOWED;
        }

        // LB23a Do not break between numeric prefixes and ideographs, or between ideographs and numeric postfixes.
        if (current === PR && [ID, EB, EM].indexOf(next) !== -1 || [ID, EB, EM].indexOf(current) !== -1 && next === PO) {
            return BREAK_NOT_ALLOWED;
        }

        // LB24 Do not break between numeric prefix/postfix and letters, or between letters and prefix/postfix.
        if (ALPHABETICS.indexOf(current) !== -1 && PREFIX_POSTFIX.indexOf(next) !== -1 || PREFIX_POSTFIX.indexOf(current) !== -1 && ALPHABETICS.indexOf(next) !== -1) {
            return BREAK_NOT_ALLOWED;
        }

        // LB25 Do not break between the following pairs of classes relevant to numbers:
        if (
        // (PR | PO) × ( OP | HY )? NU
        [PR, PO].indexOf(current) !== -1 && (next === NU || [OP, HY].indexOf(next) !== -1 && classTypes[afterIndex + 1] === NU) ||
        // ( OP | HY ) × NU
        [OP, HY].indexOf(current) !== -1 && next === NU ||
        // NU ×	(NU | SY | IS)
        current === NU && [NU, SY, IS].indexOf(next) !== -1) {
            return BREAK_NOT_ALLOWED;
        }

        // NU (NU | SY | IS)* × (NU | SY | IS | CL | CP)
        if ([NU, SY, IS, CL, CP].indexOf(next) !== -1) {
            var prevIndex = currentIndex;
            while (prevIndex >= 0) {
                var type = classTypes[prevIndex];
                if (type === NU) {
                    return BREAK_NOT_ALLOWED;
                } else if ([SY, IS].indexOf(type) !== -1) {
                    prevIndex--;
                } else {
                    break;
                }
            }
        }

        // NU (NU | SY | IS)* (CL | CP)? × (PO | PR))
        if ([PR, PO].indexOf(next) !== -1) {
            var _prevIndex = [CL, CP].indexOf(current) !== -1 ? beforeIndex : currentIndex;
            while (_prevIndex >= 0) {
                var _type = classTypes[_prevIndex];
                if (_type === NU) {
                    return BREAK_NOT_ALLOWED;
                } else if ([SY, IS].indexOf(_type) !== -1) {
                    _prevIndex--;
                } else {
                    break;
                }
            }
        }

        // LB26 Do not break a Korean syllable.
        if (JL === current && [JL, JV, H2, H3].indexOf(next) !== -1 || [JV, H2].indexOf(current) !== -1 && [JV, JT].indexOf(next) !== -1 || [JT, H3].indexOf(current) !== -1 && next === JT) {
            return BREAK_NOT_ALLOWED;
        }

        // LB27 Treat a Korean Syllable Block the same as ID.
        if (KOREAN_SYLLABLE_BLOCK.indexOf(current) !== -1 && [IN, PO].indexOf(next) !== -1 || KOREAN_SYLLABLE_BLOCK.indexOf(next) !== -1 && current === PR) {
            return BREAK_NOT_ALLOWED;
        }

        // LB28 Do not break between alphabetics (“at”).
        if (ALPHABETICS.indexOf(current) !== -1 && ALPHABETICS.indexOf(next) !== -1) {
            return BREAK_NOT_ALLOWED;
        }

        // LB29 Do not break between numeric punctuation and alphabetics (“e.g.”).
        if (current === IS && ALPHABETICS.indexOf(next) !== -1) {
            return BREAK_NOT_ALLOWED;
        }

        // LB30 Do not break between letters, numbers, or ordinary symbols and opening or closing parentheses.
        if (ALPHABETICS.concat(NU).indexOf(current) !== -1 && next === OP || ALPHABETICS.concat(NU).indexOf(next) !== -1 && current === CP) {
            return BREAK_NOT_ALLOWED;
        }

        // LB30a Break between two regional indicator symbols if and only if there are an even number of regional
        // indicators preceding the position of the break.
        if (current === RI && next === RI) {
            var i = indicies[currentIndex];
            var count = 1;
            while (i > 0) {
                i--;
                if (classTypes[i] === RI) {
                    count++;
                } else {
                    break;
                }
            }
            if (count % 2 !== 0) {
                return BREAK_NOT_ALLOWED;
            }
        }

        // LB30b Do not break between an emoji base and an emoji modifier.
        if (current === EB && next === EM) {
            return BREAK_NOT_ALLOWED;
        }

        return BREAK_ALLOWED;
    };

    var lineBreakAtIndex = exports.lineBreakAtIndex = function lineBreakAtIndex(codePoints, index) {
        // LB2 Never break at the start of text.
        if (index === 0) {
            return BREAK_NOT_ALLOWED;
        }

        // LB3 Always break at the end of text.
        if (index >= codePoints.length) {
            return BREAK_MANDATORY;
        }

        var _codePointsToCharacte = codePointsToCharacterClasses(codePoints),
            _codePointsToCharacte2 = _slicedToArray(_codePointsToCharacte, 2),
            indicies = _codePointsToCharacte2[0],
            classTypes = _codePointsToCharacte2[1];

        return _lineBreakAtIndex(codePoints, classTypes, indicies, index);
    };

    var cssFormattedClasses = function cssFormattedClasses(codePoints, options) {
        if (!options) {
            options = { lineBreak: 'normal', wordBreak: 'normal' };
        }

        var _codePointsToCharacte3 = codePointsToCharacterClasses(codePoints, options.lineBreak),
            _codePointsToCharacte4 = _slicedToArray(_codePointsToCharacte3, 3),
            indicies = _codePointsToCharacte4[0],
            classTypes = _codePointsToCharacte4[1],
            isLetterNumber = _codePointsToCharacte4[2];

        if (options.wordBreak === 'break-all' || options.wordBreak === 'break-word') {
            classTypes = classTypes.map(function (type) {
                return [NU, AL, SA].indexOf(type) !== -1 ? ID : type;
            });
        }

        var forbiddenBreakpoints = options.wordBreak === 'keep-all' ? isLetterNumber.map(function (isLetterNumber, i) {
            return isLetterNumber && codePoints[i] >= 0x4e00 && codePoints[i] <= 0x9fff;
        }) : null;

        return [indicies, classTypes, forbiddenBreakpoints];
    };

    var inlineBreakOpportunities = exports.inlineBreakOpportunities = function inlineBreakOpportunities(str, options) {
        var codePoints = (0, Util$2.toCodePoints)(str);
        var output = BREAK_NOT_ALLOWED;

        var _cssFormattedClasses = cssFormattedClasses(codePoints, options),
            _cssFormattedClasses2 = _slicedToArray(_cssFormattedClasses, 3),
            indicies = _cssFormattedClasses2[0],
            classTypes = _cssFormattedClasses2[1],
            forbiddenBreakpoints = _cssFormattedClasses2[2];

        codePoints.forEach(function (codePoint, i) {
            output += (0, Util$2.fromCodePoint)(codePoint) + (i >= codePoints.length - 1 ? BREAK_MANDATORY : _lineBreakAtIndex(codePoints, classTypes, indicies, i + 1, forbiddenBreakpoints));
        });

        return output;
    };

    var Break = function () {
        function Break(codePoints, lineBreak, start, end) {
            _classCallCheck(this, Break);

            this._codePoints = codePoints;
            this.required = lineBreak === BREAK_MANDATORY;
            this.start = start;
            this.end = end;
        }

        _createClass(Break, [{
            key: 'slice',
            value: function slice() {
                return Util$2.fromCodePoint.apply(undefined, _toConsumableArray(this._codePoints.slice(this.start, this.end)));
            }
        }]);

        return Break;
    }();

    var LineBreaker = exports.LineBreaker = function LineBreaker(str, options) {
        var codePoints = (0, Util$2.toCodePoints)(str);

        var _cssFormattedClasses3 = cssFormattedClasses(codePoints, options),
            _cssFormattedClasses4 = _slicedToArray(_cssFormattedClasses3, 3),
            indicies = _cssFormattedClasses4[0],
            classTypes = _cssFormattedClasses4[1],
            forbiddenBreakpoints = _cssFormattedClasses4[2];

        var length = codePoints.length;
        var lastEnd = 0;
        var nextIndex = 0;

        return {
            next: function next() {
                if (nextIndex >= length) {
                    return { done: true };
                }
                var lineBreak = BREAK_NOT_ALLOWED;
                while (nextIndex < length && (lineBreak = _lineBreakAtIndex(codePoints, classTypes, indicies, ++nextIndex, forbiddenBreakpoints)) === BREAK_NOT_ALLOWED) {}

                if (lineBreak !== BREAK_NOT_ALLOWED || nextIndex === length) {
                    var value = new Break(codePoints, lineBreak, lastEnd, nextIndex);
                    lastEnd = nextIndex;
                    return { value: value, done: false };
                }

                return { done: true };
            }
        };
    };
    });

    unwrapExports(LineBreak);
    var LineBreak_1 = LineBreak.LineBreaker;
    var LineBreak_2 = LineBreak.inlineBreakOpportunities;
    var LineBreak_3 = LineBreak.lineBreakAtIndex;
    var LineBreak_4 = LineBreak.codePointsToCharacterClasses;
    var LineBreak_5 = LineBreak.UnicodeTrie;
    var LineBreak_6 = LineBreak.BREAK_ALLOWED;
    var LineBreak_7 = LineBreak.BREAK_NOT_ALLOWED;
    var LineBreak_8 = LineBreak.BREAK_MANDATORY;
    var LineBreak_9 = LineBreak.classes;
    var LineBreak_10 = LineBreak.LETTER_NUMBER_MODIFIER;

    var dist = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });



    Object.defineProperty(exports, 'toCodePoints', {
      enumerable: true,
      get: function get() {
        return Util$2.toCodePoints;
      }
    });
    Object.defineProperty(exports, 'fromCodePoint', {
      enumerable: true,
      get: function get() {
        return Util$2.fromCodePoint;
      }
    });



    Object.defineProperty(exports, 'LineBreaker', {
      enumerable: true,
      get: function get() {
        return LineBreak.LineBreaker;
      }
    });
    });

    unwrapExports(dist);

    var Unicode = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.breakWords = exports.fromCodePoint = exports.toCodePoints = undefined;



    Object.defineProperty(exports, 'toCodePoints', {
        enumerable: true,
        get: function get() {
            return dist.toCodePoints;
        }
    });
    Object.defineProperty(exports, 'fromCodePoint', {
        enumerable: true,
        get: function get() {
            return dist.fromCodePoint;
        }
    });



    var breakWords = exports.breakWords = function breakWords(str, parent) {
        var breaker = (0, dist.LineBreaker)(str, {
            lineBreak: parent.style.lineBreak,
            wordBreak: parent.style.overflowWrap === overflowWrap.OVERFLOW_WRAP.BREAK_WORD ? 'break-word' : parent.style.wordBreak
        });

        var words = [];
        var bk = void 0;

        while (!(bk = breaker.next()).done) {
            words.push(bk.value.slice());
        }

        return words;
    };
    });

    unwrapExports(Unicode);
    var Unicode_1 = Unicode.breakWords;
    var Unicode_2 = Unicode.fromCodePoint;
    var Unicode_3 = Unicode.toCodePoints;

    var TextBounds_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.parseTextBounds = exports.TextBounds = undefined;







    var _Feature2 = _interopRequireDefault(Feature);



    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var TextBounds = exports.TextBounds = function TextBounds(text, bounds) {
        _classCallCheck(this, TextBounds);

        this.text = text;
        this.bounds = bounds;
    };

    var parseTextBounds = exports.parseTextBounds = function parseTextBounds(value, parent, node) {
        var letterRendering = parent.style.letterSpacing !== 0;
        var textList = letterRendering ? (0, Unicode.toCodePoints)(value).map(function (i) {
            return (0, Unicode.fromCodePoint)(i);
        }) : (0, Unicode.breakWords)(value, parent);
        var length = textList.length;
        var defaultView = node.parentNode ? node.parentNode.ownerDocument.defaultView : null;
        var scrollX = defaultView ? defaultView.pageXOffset : 0;
        var scrollY = defaultView ? defaultView.pageYOffset : 0;
        var textBounds = [];
        var offset = 0;
        for (var i = 0; i < length; i++) {
            var text = textList[i];
            if (parent.style.textDecoration !== textDecoration.TEXT_DECORATION.NONE || text.trim().length > 0) {
                if (_Feature2.default.SUPPORT_RANGE_BOUNDS) {
                    textBounds.push(new TextBounds(text, getRangeBounds(node, offset, text.length, scrollX, scrollY)));
                } else {
                    var replacementNode = node.splitText(text.length);
                    textBounds.push(new TextBounds(text, getWrapperBounds(node, scrollX, scrollY)));
                    node = replacementNode;
                }
            } else if (!_Feature2.default.SUPPORT_RANGE_BOUNDS) {
                node = node.splitText(text.length);
            }
            offset += text.length;
        }
        return textBounds;
    };

    var getWrapperBounds = function getWrapperBounds(node, scrollX, scrollY) {
        var wrapper = node.ownerDocument.createElement('html2canvaswrapper');
        wrapper.appendChild(node.cloneNode(true));
        var parentNode = node.parentNode;
        if (parentNode) {
            parentNode.replaceChild(wrapper, node);
            var bounds = (0, Bounds_1.parseBounds)(wrapper, scrollX, scrollY);
            if (wrapper.firstChild) {
                parentNode.replaceChild(wrapper.firstChild, wrapper);
            }
            return bounds;
        }
        return new Bounds_1.Bounds(0, 0, 0, 0);
    };

    var getRangeBounds = function getRangeBounds(node, offset, length, scrollX, scrollY) {
        var range = node.ownerDocument.createRange();
        range.setStart(node, offset);
        range.setEnd(node, offset + length);
        return Bounds_1.Bounds.fromClientRect(range.getBoundingClientRect(), scrollX, scrollY);
    };
    });

    unwrapExports(TextBounds_1);
    var TextBounds_2 = TextBounds_1.parseTextBounds;
    var TextBounds_3 = TextBounds_1.TextBounds;

    var TextContainer_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();





    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var TextContainer = function () {
        function TextContainer(text, parent, bounds) {
            _classCallCheck(this, TextContainer);

            this.text = text;
            this.parent = parent;
            this.bounds = bounds;
        }

        _createClass(TextContainer, null, [{
            key: 'fromTextNode',
            value: function fromTextNode(node, parent) {
                var text = transform(node.data, parent.style.textTransform);
                return new TextContainer(text, parent, (0, TextBounds_1.parseTextBounds)(text, parent, node));
            }
        }]);

        return TextContainer;
    }();

    exports.default = TextContainer;


    var CAPITALIZE = /(^|\s|:|-|\(|\))([a-z])/g;

    var transform = function transform(text, _transform) {
        switch (_transform) {
            case textTransform.TEXT_TRANSFORM.LOWERCASE:
                return text.toLowerCase();
            case textTransform.TEXT_TRANSFORM.CAPITALIZE:
                return text.replace(CAPITALIZE, capitalize);
            case textTransform.TEXT_TRANSFORM.UPPERCASE:
                return text.toUpperCase();
            default:
                return text;
        }
    };

    function capitalize(m, p1, p2) {
        if (m.length > 0) {
            return p1 + p2.toUpperCase();
        }

        return m;
    }
    });

    unwrapExports(TextContainer_1);

    var Circle_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });



    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Circle = function Circle(x, y, radius) {
        _classCallCheck(this, Circle);

        this.type = Path.PATH.CIRCLE;
        this.x = x;
        this.y = y;
        this.radius = radius;
    };

    exports.default = Circle;
    });

    unwrapExports(Circle_1);

    var Input = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.reformatInputBounds = exports.inlineSelectElement = exports.inlineTextAreaElement = exports.inlineInputElement = exports.getInputBorderRadius = exports.INPUT_BACKGROUND = exports.INPUT_BORDERS = exports.INPUT_COLOR = undefined;



    var _TextContainer2 = _interopRequireDefault(TextContainer_1);







    var _Circle2 = _interopRequireDefault(Circle_1);



    var _Vector2 = _interopRequireDefault(Vector_1);



    var _Color2 = _interopRequireDefault(Color_1);



    var _Length2 = _interopRequireDefault(Length_1);







    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var INPUT_COLOR = exports.INPUT_COLOR = new _Color2.default([42, 42, 42]);
    var INPUT_BORDER_COLOR = new _Color2.default([165, 165, 165]);
    var INPUT_BACKGROUND_COLOR = new _Color2.default([222, 222, 222]);
    var INPUT_BORDER = {
        borderWidth: 1,
        borderColor: INPUT_BORDER_COLOR,
        borderStyle: border.BORDER_STYLE.SOLID
    };
    var INPUT_BORDERS = exports.INPUT_BORDERS = [INPUT_BORDER, INPUT_BORDER, INPUT_BORDER, INPUT_BORDER];
    var INPUT_BACKGROUND = exports.INPUT_BACKGROUND = {
        backgroundColor: INPUT_BACKGROUND_COLOR,
        backgroundImage: [],
        backgroundClip: background.BACKGROUND_CLIP.PADDING_BOX,
        backgroundOrigin: background.BACKGROUND_ORIGIN.PADDING_BOX
    };

    var RADIO_BORDER_RADIUS = new _Length2.default('50%');
    var RADIO_BORDER_RADIUS_TUPLE = [RADIO_BORDER_RADIUS, RADIO_BORDER_RADIUS];
    var INPUT_RADIO_BORDER_RADIUS = [RADIO_BORDER_RADIUS_TUPLE, RADIO_BORDER_RADIUS_TUPLE, RADIO_BORDER_RADIUS_TUPLE, RADIO_BORDER_RADIUS_TUPLE];

    var CHECKBOX_BORDER_RADIUS = new _Length2.default('3px');
    var CHECKBOX_BORDER_RADIUS_TUPLE = [CHECKBOX_BORDER_RADIUS, CHECKBOX_BORDER_RADIUS];
    var INPUT_CHECKBOX_BORDER_RADIUS = [CHECKBOX_BORDER_RADIUS_TUPLE, CHECKBOX_BORDER_RADIUS_TUPLE, CHECKBOX_BORDER_RADIUS_TUPLE, CHECKBOX_BORDER_RADIUS_TUPLE];

    var getInputBorderRadius = exports.getInputBorderRadius = function getInputBorderRadius(node) {
        return node.type === 'radio' ? INPUT_RADIO_BORDER_RADIUS : INPUT_CHECKBOX_BORDER_RADIUS;
    };

    var inlineInputElement = exports.inlineInputElement = function inlineInputElement(node, container) {
        if (node.type === 'radio' || node.type === 'checkbox') {
            if (node.checked) {
                var size = Math.min(container.bounds.width, container.bounds.height);
                container.childNodes.push(node.type === 'checkbox' ? [new _Vector2.default(container.bounds.left + size * 0.39363, container.bounds.top + size * 0.79), new _Vector2.default(container.bounds.left + size * 0.16, container.bounds.top + size * 0.5549), new _Vector2.default(container.bounds.left + size * 0.27347, container.bounds.top + size * 0.44071), new _Vector2.default(container.bounds.left + size * 0.39694, container.bounds.top + size * 0.5649), new _Vector2.default(container.bounds.left + size * 0.72983, container.bounds.top + size * 0.23), new _Vector2.default(container.bounds.left + size * 0.84, container.bounds.top + size * 0.34085), new _Vector2.default(container.bounds.left + size * 0.39363, container.bounds.top + size * 0.79)] : new _Circle2.default(container.bounds.left + size / 4, container.bounds.top + size / 4, size / 4));
            }
        } else {
            inlineFormElement(getInputValue(node), node, container, false);
        }
    };

    var inlineTextAreaElement = exports.inlineTextAreaElement = function inlineTextAreaElement(node, container) {
        inlineFormElement(node.value, node, container, true);
    };

    var inlineSelectElement = exports.inlineSelectElement = function inlineSelectElement(node, container) {
        var option = node.options[node.selectedIndex || 0];
        inlineFormElement(option ? option.text || '' : '', node, container, false);
    };

    var reformatInputBounds = exports.reformatInputBounds = function reformatInputBounds(bounds) {
        if (bounds.width > bounds.height) {
            bounds.left += (bounds.width - bounds.height) / 2;
            bounds.width = bounds.height;
        } else if (bounds.width < bounds.height) {
            bounds.top += (bounds.height - bounds.width) / 2;
            bounds.height = bounds.width;
        }
        return bounds;
    };

    var inlineFormElement = function inlineFormElement(value, node, container, allowLinebreak) {
        var body = node.ownerDocument.body;
        if (value.length > 0 && body) {
            var wrapper = node.ownerDocument.createElement('html2canvaswrapper');
            (0, Util.copyCSSStyles)(node.ownerDocument.defaultView.getComputedStyle(node, null), wrapper);
            wrapper.style.position = 'absolute';
            wrapper.style.left = container.bounds.left + 'px';
            wrapper.style.top = container.bounds.top + 'px';
            if (!allowLinebreak) {
                wrapper.style.whiteSpace = 'nowrap';
            }
            var text = node.ownerDocument.createTextNode(value);
            wrapper.appendChild(text);
            body.appendChild(wrapper);
            container.childNodes.push(_TextContainer2.default.fromTextNode(text, container));
            body.removeChild(wrapper);
        }
    };

    var getInputValue = function getInputValue(node) {
        var value = node.type === 'password' ? new Array(node.value.length + 1).join('\u2022') : node.value;

        return value.length === 0 ? node.placeholder || '' : value;
    };
    });

    unwrapExports(Input);
    var Input_1 = Input.reformatInputBounds;
    var Input_2 = Input.inlineSelectElement;
    var Input_3 = Input.inlineTextAreaElement;
    var Input_4 = Input.inlineInputElement;
    var Input_5 = Input.getInputBorderRadius;
    var Input_6 = Input.INPUT_BACKGROUND;
    var Input_7 = Input.INPUT_BORDERS;
    var Input_8 = Input.INPUT_COLOR;

    var ListItem = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.createCounterText = exports.inlineListItemElement = exports.getListOwner = undefined;





    var _NodeContainer2 = _interopRequireDefault(NodeContainer_1);



    var _TextContainer2 = _interopRequireDefault(TextContainer_1);





    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    // Margin between the enumeration and the list item content
    var MARGIN_RIGHT = 7;

    var ancestorTypes = ['OL', 'UL', 'MENU'];

    var getListOwner = exports.getListOwner = function getListOwner(container) {
        var parent = container.parent;
        if (!parent) {
            return null;
        }

        do {
            var isAncestor = ancestorTypes.indexOf(parent.tagName) !== -1;
            if (isAncestor) {
                return parent;
            }
            parent = parent.parent;
        } while (parent);

        return container.parent;
    };

    var inlineListItemElement = exports.inlineListItemElement = function inlineListItemElement(node, container, resourceLoader) {
        var listStyle$$1 = container.style.listStyle;

        if (!listStyle$$1) {
            return;
        }

        var style = node.ownerDocument.defaultView.getComputedStyle(node, null);
        var wrapper = node.ownerDocument.createElement('html2canvaswrapper');
        (0, Util.copyCSSStyles)(style, wrapper);

        wrapper.style.position = 'absolute';
        wrapper.style.bottom = 'auto';
        wrapper.style.display = 'block';
        wrapper.style.letterSpacing = 'normal';

        switch (listStyle$$1.listStylePosition) {
            case listStyle.LIST_STYLE_POSITION.OUTSIDE:
                wrapper.style.left = 'auto';
                wrapper.style.right = node.ownerDocument.defaultView.innerWidth - container.bounds.left - container.style.margin[1].getAbsoluteValue(container.bounds.width) + MARGIN_RIGHT + 'px';
                wrapper.style.textAlign = 'right';
                break;
            case listStyle.LIST_STYLE_POSITION.INSIDE:
                wrapper.style.left = container.bounds.left - container.style.margin[3].getAbsoluteValue(container.bounds.width) + 'px';
                wrapper.style.right = 'auto';
                wrapper.style.textAlign = 'left';
                break;
        }

        var text = void 0;
        var MARGIN_TOP = container.style.margin[0].getAbsoluteValue(container.bounds.width);
        var styleImage = listStyle$$1.listStyleImage;
        if (styleImage) {
            if (styleImage.method === 'url') {
                var image = node.ownerDocument.createElement('img');
                image.src = styleImage.args[0];
                wrapper.style.top = container.bounds.top - MARGIN_TOP + 'px';
                wrapper.style.width = 'auto';
                wrapper.style.height = 'auto';
                wrapper.appendChild(image);
            } else {
                var size = parseFloat(container.style.font.fontSize) * 0.5;
                wrapper.style.top = container.bounds.top - MARGIN_TOP + container.bounds.height - 1.5 * size + 'px';
                wrapper.style.width = size + 'px';
                wrapper.style.height = size + 'px';
                wrapper.style.backgroundImage = style.listStyleImage;
            }
        } else if (typeof container.listIndex === 'number') {
            text = node.ownerDocument.createTextNode(createCounterText(container.listIndex, listStyle$$1.listStyleType, true));
            wrapper.appendChild(text);
            wrapper.style.top = container.bounds.top - MARGIN_TOP + 'px';
        }

        // $FlowFixMe
        var body = node.ownerDocument.body;
        body.appendChild(wrapper);

        if (text) {
            container.childNodes.push(_TextContainer2.default.fromTextNode(text, container));
            body.removeChild(wrapper);
        } else {
            // $FlowFixMe
            container.childNodes.push(new _NodeContainer2.default(wrapper, container, resourceLoader, 0));
        }
    };

    var ROMAN_UPPER = {
        integers: [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
        values: ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
    };

    var ARMENIAN = {
        integers: [9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        values: ['Ք', 'Փ', 'Ւ', 'Ց', 'Ր', 'Տ', 'Վ', 'Ս', 'Ռ', 'Ջ', 'Պ', 'Չ', 'Ո', 'Շ', 'Ն', 'Յ', 'Մ', 'Ճ', 'Ղ', 'Ձ', 'Հ', 'Կ', 'Ծ', 'Խ', 'Լ', 'Ի', 'Ժ', 'Թ', 'Ը', 'Է', 'Զ', 'Ե', 'Դ', 'Գ', 'Բ', 'Ա']
    };

    var HEBREW = {
        integers: [10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20, 19, 18, 17, 16, 15, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        values: ['י׳', 'ט׳', 'ח׳', 'ז׳', 'ו׳', 'ה׳', 'ד׳', 'ג׳', 'ב׳', 'א׳', 'ת', 'ש', 'ר', 'ק', 'צ', 'פ', 'ע', 'ס', 'נ', 'מ', 'ל', 'כ', 'יט', 'יח', 'יז', 'טז', 'טו', 'י', 'ט', 'ח', 'ז', 'ו', 'ה', 'ד', 'ג', 'ב', 'א']
    };

    var GEORGIAN = {
        integers: [10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        values: ['ჵ', 'ჰ', 'ჯ', 'ჴ', 'ხ', 'ჭ', 'წ', 'ძ', 'ც', 'ჩ', 'შ', 'ყ', 'ღ', 'ქ', 'ფ', 'ჳ', 'ტ', 'ს', 'რ', 'ჟ', 'პ', 'ო', 'ჲ', 'ნ', 'მ', 'ლ', 'კ', 'ი', 'თ', 'ჱ', 'ზ', 'ვ', 'ე', 'დ', 'გ', 'ბ', 'ა']
    };

    var createAdditiveCounter = function createAdditiveCounter(value, min, max, symbols, fallback, suffix) {
        if (value < min || value > max) {
            return createCounterText(value, fallback, suffix.length > 0);
        }

        return symbols.integers.reduce(function (string, integer, index) {
            while (value >= integer) {
                value -= integer;
                string += symbols.values[index];
            }
            return string;
        }, '') + suffix;
    };

    var createCounterStyleWithSymbolResolver = function createCounterStyleWithSymbolResolver(value, codePointRangeLength, isNumeric, resolver) {
        var string = '';

        do {
            if (!isNumeric) {
                value--;
            }
            string = resolver(value) + string;
            value /= codePointRangeLength;
        } while (value * codePointRangeLength >= codePointRangeLength);

        return string;
    };

    var createCounterStyleFromRange = function createCounterStyleFromRange(value, codePointRangeStart, codePointRangeEnd, isNumeric, suffix) {
        var codePointRangeLength = codePointRangeEnd - codePointRangeStart + 1;

        return (value < 0 ? '-' : '') + (createCounterStyleWithSymbolResolver(Math.abs(value), codePointRangeLength, isNumeric, function (codePoint) {
            return (0, Unicode.fromCodePoint)(Math.floor(codePoint % codePointRangeLength) + codePointRangeStart);
        }) + suffix);
    };

    var createCounterStyleFromSymbols = function createCounterStyleFromSymbols(value, symbols) {
        var suffix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '. ';

        var codePointRangeLength = symbols.length;
        return createCounterStyleWithSymbolResolver(Math.abs(value), codePointRangeLength, false, function (codePoint) {
            return symbols[Math.floor(codePoint % codePointRangeLength)];
        }) + suffix;
    };

    var CJK_ZEROS = 1 << 0;
    var CJK_TEN_COEFFICIENTS = 1 << 1;
    var CJK_TEN_HIGH_COEFFICIENTS = 1 << 2;
    var CJK_HUNDRED_COEFFICIENTS = 1 << 3;

    var createCJKCounter = function createCJKCounter(value, numbers, multipliers, negativeSign, suffix, flags) {
        if (value < -9999 || value > 9999) {
            return createCounterText(value, listStyle.LIST_STYLE_TYPE.CJK_DECIMAL, suffix.length > 0);
        }
        var tmp = Math.abs(value);
        var string = suffix;

        if (tmp === 0) {
            return numbers[0] + string;
        }

        for (var digit = 0; tmp > 0 && digit <= 4; digit++) {
            var coefficient = tmp % 10;

            if (coefficient === 0 && (0, Util.contains)(flags, CJK_ZEROS) && string !== '') {
                string = numbers[coefficient] + string;
            } else if (coefficient > 1 || coefficient === 1 && digit === 0 || coefficient === 1 && digit === 1 && (0, Util.contains)(flags, CJK_TEN_COEFFICIENTS) || coefficient === 1 && digit === 1 && (0, Util.contains)(flags, CJK_TEN_HIGH_COEFFICIENTS) && value > 100 || coefficient === 1 && digit > 1 && (0, Util.contains)(flags, CJK_HUNDRED_COEFFICIENTS)) {
                string = numbers[coefficient] + (digit > 0 ? multipliers[digit - 1] : '') + string;
            } else if (coefficient === 1 && digit > 0) {
                string = multipliers[digit - 1] + string;
            }
            tmp = Math.floor(tmp / 10);
        }

        return (value < 0 ? negativeSign : '') + string;
    };

    var CHINESE_INFORMAL_MULTIPLIERS = '十百千萬';
    var CHINESE_FORMAL_MULTIPLIERS = '拾佰仟萬';
    var JAPANESE_NEGATIVE = 'マイナス';
    var KOREAN_NEGATIVE = '마이너스';

    var createCounterText = exports.createCounterText = function createCounterText(value, type, appendSuffix) {
        var defaultSuffix = appendSuffix ? '. ' : '';
        var cjkSuffix = appendSuffix ? '、' : '';
        var koreanSuffix = appendSuffix ? ', ' : '';
        switch (type) {
            case listStyle.LIST_STYLE_TYPE.DISC:
                return '•';
            case listStyle.LIST_STYLE_TYPE.CIRCLE:
                return '◦';
            case listStyle.LIST_STYLE_TYPE.SQUARE:
                return '◾';
            case listStyle.LIST_STYLE_TYPE.DECIMAL_LEADING_ZERO:
                var string = createCounterStyleFromRange(value, 48, 57, true, defaultSuffix);
                return string.length < 4 ? '0' + string : string;
            case listStyle.LIST_STYLE_TYPE.CJK_DECIMAL:
                return createCounterStyleFromSymbols(value, '〇一二三四五六七八九', cjkSuffix);
            case listStyle.LIST_STYLE_TYPE.LOWER_ROMAN:
                return createAdditiveCounter(value, 1, 3999, ROMAN_UPPER, listStyle.LIST_STYLE_TYPE.DECIMAL, defaultSuffix).toLowerCase();
            case listStyle.LIST_STYLE_TYPE.UPPER_ROMAN:
                return createAdditiveCounter(value, 1, 3999, ROMAN_UPPER, listStyle.LIST_STYLE_TYPE.DECIMAL, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.LOWER_GREEK:
                return createCounterStyleFromRange(value, 945, 969, false, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.LOWER_ALPHA:
                return createCounterStyleFromRange(value, 97, 122, false, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.UPPER_ALPHA:
                return createCounterStyleFromRange(value, 65, 90, false, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.ARABIC_INDIC:
                return createCounterStyleFromRange(value, 1632, 1641, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.ARMENIAN:
            case listStyle.LIST_STYLE_TYPE.UPPER_ARMENIAN:
                return createAdditiveCounter(value, 1, 9999, ARMENIAN, listStyle.LIST_STYLE_TYPE.DECIMAL, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.LOWER_ARMENIAN:
                return createAdditiveCounter(value, 1, 9999, ARMENIAN, listStyle.LIST_STYLE_TYPE.DECIMAL, defaultSuffix).toLowerCase();
            case listStyle.LIST_STYLE_TYPE.BENGALI:
                return createCounterStyleFromRange(value, 2534, 2543, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.CAMBODIAN:
            case listStyle.LIST_STYLE_TYPE.KHMER:
                return createCounterStyleFromRange(value, 6112, 6121, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.CJK_EARTHLY_BRANCH:
                return createCounterStyleFromSymbols(value, '子丑寅卯辰巳午未申酉戌亥', cjkSuffix);
            case listStyle.LIST_STYLE_TYPE.CJK_HEAVENLY_STEM:
                return createCounterStyleFromSymbols(value, '甲乙丙丁戊己庚辛壬癸', cjkSuffix);
            case listStyle.LIST_STYLE_TYPE.CJK_IDEOGRAPHIC:
            case listStyle.LIST_STYLE_TYPE.TRAD_CHINESE_INFORMAL:
                return createCJKCounter(value, '零一二三四五六七八九', CHINESE_INFORMAL_MULTIPLIERS, '負', cjkSuffix, CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
            case listStyle.LIST_STYLE_TYPE.TRAD_CHINESE_FORMAL:
                return createCJKCounter(value, '零壹貳參肆伍陸柒捌玖', CHINESE_FORMAL_MULTIPLIERS, '負', cjkSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
            case listStyle.LIST_STYLE_TYPE.SIMP_CHINESE_INFORMAL:
                return createCJKCounter(value, '零一二三四五六七八九', CHINESE_INFORMAL_MULTIPLIERS, '负', cjkSuffix, CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
            case listStyle.LIST_STYLE_TYPE.SIMP_CHINESE_FORMAL:
                return createCJKCounter(value, '零壹贰叁肆伍陆柒捌玖', CHINESE_FORMAL_MULTIPLIERS, '负', cjkSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
            case listStyle.LIST_STYLE_TYPE.JAPANESE_INFORMAL:
                return createCJKCounter(value, '〇一二三四五六七八九', '十百千万', JAPANESE_NEGATIVE, cjkSuffix, 0);
            case listStyle.LIST_STYLE_TYPE.JAPANESE_FORMAL:
                return createCJKCounter(value, '零壱弐参四伍六七八九', '拾百千万', JAPANESE_NEGATIVE, cjkSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS);
            case listStyle.LIST_STYLE_TYPE.KOREAN_HANGUL_FORMAL:
                return createCJKCounter(value, '영일이삼사오육칠팔구', '십백천만', KOREAN_NEGATIVE, koreanSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS);
            case listStyle.LIST_STYLE_TYPE.KOREAN_HANJA_INFORMAL:
                return createCJKCounter(value, '零一二三四五六七八九', '十百千萬', KOREAN_NEGATIVE, koreanSuffix, 0);
            case listStyle.LIST_STYLE_TYPE.KOREAN_HANJA_FORMAL:
                return createCJKCounter(value, '零壹貳參四五六七八九', '拾百千', KOREAN_NEGATIVE, koreanSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS);
            case listStyle.LIST_STYLE_TYPE.DEVANAGARI:
                return createCounterStyleFromRange(value, 0x966, 0x96f, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.GEORGIAN:
                return createAdditiveCounter(value, 1, 19999, GEORGIAN, listStyle.LIST_STYLE_TYPE.DECIMAL, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.GUJARATI:
                return createCounterStyleFromRange(value, 0xae6, 0xaef, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.GURMUKHI:
                return createCounterStyleFromRange(value, 0xa66, 0xa6f, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.HEBREW:
                return createAdditiveCounter(value, 1, 10999, HEBREW, listStyle.LIST_STYLE_TYPE.DECIMAL, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.HIRAGANA:
                return createCounterStyleFromSymbols(value, 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわゐゑをん');
            case listStyle.LIST_STYLE_TYPE.HIRAGANA_IROHA:
                return createCounterStyleFromSymbols(value, 'いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす');
            case listStyle.LIST_STYLE_TYPE.KANNADA:
                return createCounterStyleFromRange(value, 0xce6, 0xcef, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.KATAKANA:
                return createCounterStyleFromSymbols(value, 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヰヱヲン', cjkSuffix);
            case listStyle.LIST_STYLE_TYPE.KATAKANA_IROHA:
                return createCounterStyleFromSymbols(value, 'イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス', cjkSuffix);
            case listStyle.LIST_STYLE_TYPE.LAO:
                return createCounterStyleFromRange(value, 0xed0, 0xed9, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.MONGOLIAN:
                return createCounterStyleFromRange(value, 0x1810, 0x1819, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.MYANMAR:
                return createCounterStyleFromRange(value, 0x1040, 0x1049, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.ORIYA:
                return createCounterStyleFromRange(value, 0xb66, 0xb6f, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.PERSIAN:
                return createCounterStyleFromRange(value, 0x6f0, 0x6f9, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.TAMIL:
                return createCounterStyleFromRange(value, 0xbe6, 0xbef, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.TELUGU:
                return createCounterStyleFromRange(value, 0xc66, 0xc6f, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.THAI:
                return createCounterStyleFromRange(value, 0xe50, 0xe59, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.TIBETAN:
                return createCounterStyleFromRange(value, 0xf20, 0xf29, true, defaultSuffix);
            case listStyle.LIST_STYLE_TYPE.DECIMAL:
            default:
                return createCounterStyleFromRange(value, 48, 57, true, defaultSuffix);
        }
    };
    });

    unwrapExports(ListItem);
    var ListItem_1 = ListItem.createCounterText;
    var ListItem_2 = ListItem.inlineListItemElement;
    var ListItem_3 = ListItem.getListOwner;

    var NodeContainer_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



    var _Color2 = _interopRequireDefault(Color_1);



















































    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var INPUT_TAGS = ['INPUT', 'TEXTAREA', 'SELECT'];

    var NodeContainer = function () {
        function NodeContainer(node, parent, resourceLoader, index) {
            var _this = this;

            _classCallCheck(this, NodeContainer);

            this.parent = parent;
            this.tagName = node.tagName;
            this.index = index;
            this.childNodes = [];
            this.listItems = [];
            if (typeof node.start === 'number') {
                this.listStart = node.start;
            }
            var defaultView = node.ownerDocument.defaultView;
            var scrollX = defaultView.pageXOffset;
            var scrollY = defaultView.pageYOffset;
            var style = defaultView.getComputedStyle(node, null);
            var display$$1 = (0, display.parseDisplay)(style.display);

            var IS_INPUT = node.type === 'radio' || node.type === 'checkbox';

            var position$$1 = (0, position.parsePosition)(style.position);

            this.style = {
                background: IS_INPUT ? Input.INPUT_BACKGROUND : (0, background.parseBackground)(style, resourceLoader),
                border: IS_INPUT ? Input.INPUT_BORDERS : (0, border.parseBorder)(style),
                borderRadius: (node instanceof defaultView.HTMLInputElement || node instanceof HTMLInputElement) && IS_INPUT ? (0, Input.getInputBorderRadius)(node) : (0, borderRadius.parseBorderRadius)(style),
                color: IS_INPUT ? Input.INPUT_COLOR : new _Color2.default(style.color),
                display: display$$1,
                float: (0, float_1.parseCSSFloat)(style.float),
                font: (0, font.parseFont)(style),
                letterSpacing: (0, letterSpacing.parseLetterSpacing)(style.letterSpacing),
                listStyle: display$$1 === display.DISPLAY.LIST_ITEM ? (0, listStyle.parseListStyle)(style) : null,
                lineBreak: (0, lineBreak.parseLineBreak)(style.lineBreak),
                margin: (0, margin.parseMargin)(style),
                opacity: parseFloat(style.opacity),
                overflow: INPUT_TAGS.indexOf(node.tagName) === -1 ? (0, overflow.parseOverflow)(style.overflow) : overflow.OVERFLOW.HIDDEN,
                overflowWrap: (0, overflowWrap.parseOverflowWrap)(style.overflowWrap ? style.overflowWrap : style.wordWrap),
                padding: (0, padding.parsePadding)(style),
                position: position$$1,
                textDecoration: (0, textDecoration.parseTextDecoration)(style),
                textShadow: (0, textShadow.parseTextShadow)(style.textShadow),
                textTransform: (0, textTransform.parseTextTransform)(style.textTransform),
                transform: (0, transform.parseTransform)(style),
                visibility: (0, visibility.parseVisibility)(style.visibility),
                wordBreak: (0, wordBreak.parseWordBreak)(style.wordBreak),
                zIndex: (0, zIndex.parseZIndex)(position$$1 !== position.POSITION.STATIC ? style.zIndex : 'auto')
            };

            if (this.isTransformed()) {
                // getBoundingClientRect provides values post-transform, we want them without the transformation
                node.style.transform = 'matrix(1,0,0,1,0,0)';
            }

            if (display$$1 === display.DISPLAY.LIST_ITEM) {
                var listOwner = (0, ListItem.getListOwner)(this);
                if (listOwner) {
                    var listIndex = listOwner.listItems.length;
                    listOwner.listItems.push(this);
                    this.listIndex = node.hasAttribute('value') && typeof node.value === 'number' ? node.value : listIndex === 0 ? typeof listOwner.listStart === 'number' ? listOwner.listStart : 1 : listOwner.listItems[listIndex - 1].listIndex + 1;
                }
            }

            // TODO move bound retrieval for all nodes to a later stage?
            if (node.tagName === 'IMG') {
                node.addEventListener('load', function () {
                    _this.bounds = (0, Bounds_1.parseBounds)(node, scrollX, scrollY);
                    _this.curvedBounds = (0, Bounds_1.parseBoundCurves)(_this.bounds, _this.style.border, _this.style.borderRadius);
                });
            }
            this.image = getImage(node, resourceLoader);
            this.bounds = IS_INPUT ? (0, Input.reformatInputBounds)((0, Bounds_1.parseBounds)(node, scrollX, scrollY)) : (0, Bounds_1.parseBounds)(node, scrollX, scrollY);
            this.curvedBounds = (0, Bounds_1.parseBoundCurves)(this.bounds, this.style.border, this.style.borderRadius);
        }

        _createClass(NodeContainer, [{
            key: 'getClipPaths',
            value: function getClipPaths() {
                var parentClips = this.parent ? this.parent.getClipPaths() : [];
                var isClipped = this.style.overflow !== overflow.OVERFLOW.VISIBLE;

                return isClipped ? parentClips.concat([(0, Bounds_1.calculatePaddingBoxPath)(this.curvedBounds)]) : parentClips;
            }
        }, {
            key: 'isInFlow',
            value: function isInFlow() {
                return this.isRootElement() && !this.isFloating() && !this.isAbsolutelyPositioned();
            }
        }, {
            key: 'isVisible',
            value: function isVisible() {
                return !(0, Util.contains)(this.style.display, display.DISPLAY.NONE) && this.style.opacity > 0 && this.style.visibility === visibility.VISIBILITY.VISIBLE;
            }
        }, {
            key: 'isAbsolutelyPositioned',
            value: function isAbsolutelyPositioned() {
                return this.style.position !== position.POSITION.STATIC && this.style.position !== position.POSITION.RELATIVE;
            }
        }, {
            key: 'isPositioned',
            value: function isPositioned() {
                return this.style.position !== position.POSITION.STATIC;
            }
        }, {
            key: 'isFloating',
            value: function isFloating() {
                return this.style.float !== float_1.FLOAT.NONE;
            }
        }, {
            key: 'isRootElement',
            value: function isRootElement() {
                return this.parent === null;
            }
        }, {
            key: 'isTransformed',
            value: function isTransformed() {
                return this.style.transform !== null;
            }
        }, {
            key: 'isPositionedWithZIndex',
            value: function isPositionedWithZIndex() {
                return this.isPositioned() && !this.style.zIndex.auto;
            }
        }, {
            key: 'isInlineLevel',
            value: function isInlineLevel() {
                return (0, Util.contains)(this.style.display, display.DISPLAY.INLINE) || (0, Util.contains)(this.style.display, display.DISPLAY.INLINE_BLOCK) || (0, Util.contains)(this.style.display, display.DISPLAY.INLINE_FLEX) || (0, Util.contains)(this.style.display, display.DISPLAY.INLINE_GRID) || (0, Util.contains)(this.style.display, display.DISPLAY.INLINE_LIST_ITEM) || (0, Util.contains)(this.style.display, display.DISPLAY.INLINE_TABLE);
            }
        }, {
            key: 'isInlineBlockOrInlineTable',
            value: function isInlineBlockOrInlineTable() {
                return (0, Util.contains)(this.style.display, display.DISPLAY.INLINE_BLOCK) || (0, Util.contains)(this.style.display, display.DISPLAY.INLINE_TABLE);
            }
        }]);

        return NodeContainer;
    }();

    exports.default = NodeContainer;


    var getImage = function getImage(node, resourceLoader) {
        if (node instanceof node.ownerDocument.defaultView.SVGSVGElement || node instanceof SVGSVGElement) {
            var s = new XMLSerializer();
            return resourceLoader.loadImage('data:image/svg+xml,' + encodeURIComponent(s.serializeToString(node)));
        }
        switch (node.tagName) {
            case 'IMG':
                // $FlowFixMe
                var img = node;
                return resourceLoader.loadImage(img.currentSrc || img.src);
            case 'CANVAS':
                // $FlowFixMe
                var canvas = node;
                return resourceLoader.loadCanvas(canvas);
            case 'IFRAME':
                var iframeKey = node.getAttribute('data-html2canvas-internal-iframe-key');
                if (iframeKey) {
                    return iframeKey;
                }
                break;
        }

        return null;
    };
    });

    unwrapExports(NodeContainer_1);

    var StackingContext_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



    var _NodeContainer2 = _interopRequireDefault(NodeContainer_1);



    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var StackingContext = function () {
        function StackingContext(container, parent, treatAsRealStackingContext) {
            _classCallCheck(this, StackingContext);

            this.container = container;
            this.parent = parent;
            this.contexts = [];
            this.children = [];
            this.treatAsRealStackingContext = treatAsRealStackingContext;
        }

        _createClass(StackingContext, [{
            key: 'getOpacity',
            value: function getOpacity() {
                return this.parent ? this.container.style.opacity * this.parent.getOpacity() : this.container.style.opacity;
            }
        }, {
            key: 'getRealParentStackingContext',
            value: function getRealParentStackingContext() {
                return !this.parent || this.treatAsRealStackingContext ? this : this.parent.getRealParentStackingContext();
            }
        }]);

        return StackingContext;
    }();

    exports.default = StackingContext;
    });

    unwrapExports(StackingContext_1);

    var NodeParser_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.NodeParser = undefined;



    var _StackingContext2 = _interopRequireDefault(StackingContext_1);



    var _NodeContainer2 = _interopRequireDefault(NodeContainer_1);



    var _TextContainer2 = _interopRequireDefault(TextContainer_1);







    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var NodeParser = exports.NodeParser = function NodeParser(node, resourceLoader, logger) {

        var index = 0;

        var container = new _NodeContainer2.default(node, null, resourceLoader, index++);
        var stack = new _StackingContext2.default(container, null, true);

        parseNodeTree(node, container, stack, resourceLoader, index);

        return stack;
    };

    var IGNORED_NODE_NAMES = ['SCRIPT', 'HEAD', 'TITLE', 'OBJECT', 'BR', 'OPTION'];

    var parseNodeTree = function parseNodeTree(node, parent, stack, resourceLoader, index) {

        for (var childNode = node.firstChild, nextNode; childNode; childNode = nextNode) {
            nextNode = childNode.nextSibling;
            var defaultView = childNode.ownerDocument.defaultView;
            if (childNode instanceof defaultView.Text || childNode instanceof Text || defaultView.parent && childNode instanceof defaultView.parent.Text) {
                if (childNode.data.trim().length > 0) {
                    parent.childNodes.push(_TextContainer2.default.fromTextNode(childNode, parent));
                }
            } else if (childNode instanceof defaultView.HTMLElement || childNode instanceof HTMLElement || defaultView.parent && childNode instanceof defaultView.parent.HTMLElement) {
                if (IGNORED_NODE_NAMES.indexOf(childNode.nodeName) === -1) {
                    var container = new _NodeContainer2.default(childNode, parent, resourceLoader, index++);
                    if (container.isVisible()) {
                        if (childNode.tagName === 'INPUT') {
                            // $FlowFixMe
                            (0, Input.inlineInputElement)(childNode, container);
                        } else if (childNode.tagName === 'TEXTAREA') {
                            // $FlowFixMe
                            (0, Input.inlineTextAreaElement)(childNode, container);
                        } else if (childNode.tagName === 'SELECT') {
                            // $FlowFixMe
                            (0, Input.inlineSelectElement)(childNode, container);
                        } else if (container.style.listStyle && container.style.listStyle.listStyleType !== listStyle.LIST_STYLE_TYPE.NONE) {
                            (0, ListItem.inlineListItemElement)(childNode, container, resourceLoader);
                        }

                        var SHOULD_TRAVERSE_CHILDREN = childNode.tagName !== 'TEXTAREA';
                        var treatAsRealStackingContext = createsRealStackingContext(container, childNode);
                        if (treatAsRealStackingContext || createsStackingContext(container)) {
                            // for treatAsRealStackingContext:false, any positioned descendants and descendants
                            // which actually create a new stacking context should be considered part of the parent stacking context
                            var parentStack = treatAsRealStackingContext || container.isPositioned() ? stack.getRealParentStackingContext() : stack;
                            var childStack = new _StackingContext2.default(container, parentStack, treatAsRealStackingContext);
                            parentStack.contexts.push(childStack);
                            if (SHOULD_TRAVERSE_CHILDREN) {
                                parseNodeTree(childNode, container, childStack, resourceLoader, index);
                            }
                        } else {
                            stack.children.push(container);
                            if (SHOULD_TRAVERSE_CHILDREN) {
                                parseNodeTree(childNode, container, stack, resourceLoader, index);
                            }
                        }
                    }
                }
            } else if (childNode instanceof defaultView.SVGSVGElement || childNode instanceof SVGSVGElement || defaultView.parent && childNode instanceof defaultView.parent.SVGSVGElement) {
                var _container = new _NodeContainer2.default(childNode, parent, resourceLoader, index++);
                var _treatAsRealStackingContext = createsRealStackingContext(_container, childNode);
                if (_treatAsRealStackingContext || createsStackingContext(_container)) {
                    // for treatAsRealStackingContext:false, any positioned descendants and descendants
                    // which actually create a new stacking context should be considered part of the parent stacking context
                    var _parentStack = _treatAsRealStackingContext || _container.isPositioned() ? stack.getRealParentStackingContext() : stack;
                    var _childStack = new _StackingContext2.default(_container, _parentStack, _treatAsRealStackingContext);
                    _parentStack.contexts.push(_childStack);
                } else {
                    stack.children.push(_container);
                }
            }
        }
    };

    var createsRealStackingContext = function createsRealStackingContext(container, node) {
        return container.isRootElement() || container.isPositionedWithZIndex() || container.style.opacity < 1 || container.isTransformed() || isBodyWithTransparentRoot(container, node);
    };

    var createsStackingContext = function createsStackingContext(container) {
        return container.isPositioned() || container.isFloating();
    };

    var isBodyWithTransparentRoot = function isBodyWithTransparentRoot(container, node) {
        return node.nodeName === 'BODY' && container.parent instanceof _NodeContainer2.default && container.parent.style.background.backgroundColor.isTransparent();
    };
    });

    unwrapExports(NodeParser_1);
    var NodeParser_2 = NodeParser_1.NodeParser;

    var Logger_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Logger = function () {
        function Logger(enabled, id, start) {
            _classCallCheck(this, Logger);

            this.enabled = typeof window !== 'undefined' && enabled;
            this.start = start ? start : Date.now();
            this.id = id;
        }

        _createClass(Logger, [{
            key: 'child',
            value: function child(id) {
                return new Logger(this.enabled, id, this.start);
            }

            // eslint-disable-next-line flowtype/no-weak-types

        }, {
            key: 'log',
            value: function log() {
                if (this.enabled && window.console && window.console.log) {
                    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                        args[_key] = arguments[_key];
                    }

                    Function.prototype.bind.call(window.console.log, window.console).apply(window.console, [Date.now() - this.start + 'ms', this.id ? 'html2canvas (' + this.id + '):' : 'html2canvas:'].concat([].slice.call(args, 0)));
                }
            }

            // eslint-disable-next-line flowtype/no-weak-types

        }, {
            key: 'error',
            value: function error() {
                if (this.enabled && window.console && window.console.error) {
                    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                        args[_key2] = arguments[_key2];
                    }

                    Function.prototype.bind.call(window.console.error, window.console).apply(window.console, [Date.now() - this.start + 'ms', this.id ? 'html2canvas (' + this.id + '):' : 'html2canvas:'].concat([].slice.call(args, 0)));
                }
            }
        }]);

        return Logger;
    }();

    exports.default = Logger;
    });

    var Logger = unwrapExports(Logger_1);

    var CanvasRenderer_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();





    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var addColorStops = function addColorStops(gradient, canvasGradient) {
        var maxStop = Math.max.apply(null, gradient.colorStops.map(function (colorStop) {
            return colorStop.stop;
        }));
        var f = 1 / Math.max(1, maxStop);
        gradient.colorStops.forEach(function (colorStop) {
            canvasGradient.addColorStop(f * colorStop.stop, colorStop.color.toString());
        });
    };

    var CanvasRenderer = function () {
        function CanvasRenderer(canvas) {
            _classCallCheck(this, CanvasRenderer);

            this.canvas = canvas ? canvas : document.createElement('canvas');
        }

        _createClass(CanvasRenderer, [{
            key: 'render',
            value: function render(options) {
                this.ctx = this.canvas.getContext('2d');
                this.options = options;
                this.canvas.width = Math.floor(options.width * options.scale);
                this.canvas.height = Math.floor(options.height * options.scale);
                this.canvas.style.width = options.width + 'px';
                this.canvas.style.height = options.height + 'px';

                this.ctx.scale(this.options.scale, this.options.scale);
                this.ctx.translate(-options.x, -options.y);
                this.ctx.textBaseline = 'bottom';
                options.logger.log('Canvas renderer initialized (' + options.width + 'x' + options.height + ' at ' + options.x + ',' + options.y + ') with scale ' + this.options.scale);
            }
        }, {
            key: 'clip',
            value: function clip(clipPaths, callback) {
                var _this = this;

                if (clipPaths.length) {
                    this.ctx.save();
                    clipPaths.forEach(function (path) {
                        _this.path(path);
                        _this.ctx.clip();
                    });
                }

                callback();

                if (clipPaths.length) {
                    this.ctx.restore();
                }
            }
        }, {
            key: 'drawImage',
            value: function drawImage(image, source, destination) {
                this.ctx.drawImage(image, source.left, source.top, source.width, source.height, destination.left, destination.top, destination.width, destination.height);
            }
        }, {
            key: 'drawShape',
            value: function drawShape(path, color) {
                this.path(path);
                this.ctx.fillStyle = color.toString();
                this.ctx.fill();
            }
        }, {
            key: 'fill',
            value: function fill(color) {
                this.ctx.fillStyle = color.toString();
                this.ctx.fill();
            }
        }, {
            key: 'getTarget',
            value: function getTarget() {
                this.canvas.getContext('2d').setTransform(1, 0, 0, 1, 0, 0);
                return Promise.resolve(this.canvas);
            }
        }, {
            key: 'path',
            value: function path(_path) {
                var _this2 = this;

                this.ctx.beginPath();
                if (Array.isArray(_path)) {
                    _path.forEach(function (point, index) {
                        var start = point.type === Path.PATH.VECTOR ? point : point.start;
                        if (index === 0) {
                            _this2.ctx.moveTo(start.x, start.y);
                        } else {
                            _this2.ctx.lineTo(start.x, start.y);
                        }

                        if (point.type === Path.PATH.BEZIER_CURVE) {
                            _this2.ctx.bezierCurveTo(point.startControl.x, point.startControl.y, point.endControl.x, point.endControl.y, point.end.x, point.end.y);
                        }
                    });
                } else {
                    this.ctx.arc(_path.x + _path.radius, _path.y + _path.radius, _path.radius, 0, Math.PI * 2, true);
                }

                this.ctx.closePath();
            }
        }, {
            key: 'rectangle',
            value: function rectangle(x, y, width, height, color) {
                this.ctx.fillStyle = color.toString();
                this.ctx.fillRect(x, y, width, height);
            }
        }, {
            key: 'renderLinearGradient',
            value: function renderLinearGradient(bounds, gradient) {
                var linearGradient = this.ctx.createLinearGradient(bounds.left + gradient.direction.x1, bounds.top + gradient.direction.y1, bounds.left + gradient.direction.x0, bounds.top + gradient.direction.y0);

                addColorStops(gradient, linearGradient);
                this.ctx.fillStyle = linearGradient;
                this.ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
            }
        }, {
            key: 'renderRadialGradient',
            value: function renderRadialGradient(bounds, gradient) {
                var _this3 = this;

                var x = bounds.left + gradient.center.x;
                var y = bounds.top + gradient.center.y;

                var radialGradient = this.ctx.createRadialGradient(x, y, 0, x, y, gradient.radius.x);
                if (!radialGradient) {
                    return;
                }

                addColorStops(gradient, radialGradient);
                this.ctx.fillStyle = radialGradient;

                if (gradient.radius.x !== gradient.radius.y) {
                    // transforms for elliptical radial gradient
                    var midX = bounds.left + 0.5 * bounds.width;
                    var midY = bounds.top + 0.5 * bounds.height;
                    var f = gradient.radius.y / gradient.radius.x;
                    var invF = 1 / f;

                    this.transform(midX, midY, [1, 0, 0, f, 0, 0], function () {
                        return _this3.ctx.fillRect(bounds.left, invF * (bounds.top - midY) + midY, bounds.width, bounds.height * invF);
                    });
                } else {
                    this.ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
                }
            }
        }, {
            key: 'renderRepeat',
            value: function renderRepeat(path, image, imageSize, offsetX, offsetY) {
                this.path(path);
                this.ctx.fillStyle = this.ctx.createPattern(this.resizeImage(image, imageSize), 'repeat');
                this.ctx.translate(offsetX, offsetY);
                this.ctx.fill();
                this.ctx.translate(-offsetX, -offsetY);
            }
        }, {
            key: 'renderTextNode',
            value: function renderTextNode(textBounds, color, font, textDecoration$$1, textShadows) {
                var _this4 = this;

                this.ctx.font = [font.fontStyle, font.fontVariant, font.fontWeight, font.fontSize, font.fontFamily].join(' ');

                textBounds.forEach(function (text) {
                    _this4.ctx.fillStyle = color.toString();
                    if (textShadows && text.text.trim().length) {
                        textShadows.slice(0).reverse().forEach(function (textShadow) {
                            _this4.ctx.shadowColor = textShadow.color.toString();
                            _this4.ctx.shadowOffsetX = textShadow.offsetX * _this4.options.scale;
                            _this4.ctx.shadowOffsetY = textShadow.offsetY * _this4.options.scale;
                            _this4.ctx.shadowBlur = textShadow.blur;

                            _this4.ctx.fillText(text.text, text.bounds.left, text.bounds.top + text.bounds.height);
                        });
                    } else {
                        _this4.ctx.fillText(text.text, text.bounds.left, text.bounds.top + text.bounds.height);
                    }

                    if (textDecoration$$1 !== null) {
                        var textDecorationColor = textDecoration$$1.textDecorationColor || color;
                        textDecoration$$1.textDecorationLine.forEach(function (textDecorationLine) {
                            switch (textDecorationLine) {
                                case textDecoration.TEXT_DECORATION_LINE.UNDERLINE:
                                    // Draws a line at the baseline of the font
                                    // TODO As some browsers display the line as more than 1px if the font-size is big,
                                    // need to take that into account both in position and size
                                    var _options$fontMetrics$ = _this4.options.fontMetrics.getMetrics(font),
                                        baseline = _options$fontMetrics$.baseline;

                                    _this4.rectangle(text.bounds.left, Math.round(text.bounds.top + baseline), text.bounds.width, 1, textDecorationColor);
                                    break;
                                case textDecoration.TEXT_DECORATION_LINE.OVERLINE:
                                    _this4.rectangle(text.bounds.left, Math.round(text.bounds.top), text.bounds.width, 1, textDecorationColor);
                                    break;
                                case textDecoration.TEXT_DECORATION_LINE.LINE_THROUGH:
                                    // TODO try and find exact position for line-through
                                    var _options$fontMetrics$2 = _this4.options.fontMetrics.getMetrics(font),
                                        middle = _options$fontMetrics$2.middle;

                                    _this4.rectangle(text.bounds.left, Math.ceil(text.bounds.top + middle), text.bounds.width, 1, textDecorationColor);
                                    break;
                            }
                        });
                    }
                });
            }
        }, {
            key: 'resizeImage',
            value: function resizeImage(image, size) {
                if (image.width === size.width && image.height === size.height) {
                    return image;
                }

                var canvas = this.canvas.ownerDocument.createElement('canvas');
                canvas.width = size.width;
                canvas.height = size.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, size.width, size.height);
                return canvas;
            }
        }, {
            key: 'setOpacity',
            value: function setOpacity(opacity) {
                this.ctx.globalAlpha = opacity;
            }
        }, {
            key: 'transform',
            value: function transform(offsetX, offsetY, matrix, callback) {
                this.ctx.save();
                this.ctx.translate(offsetX, offsetY);
                this.ctx.transform(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
                this.ctx.translate(-offsetX, -offsetY);

                callback();

                this.ctx.restore();
            }
        }]);

        return CanvasRenderer;
    }();

    exports.default = CanvasRenderer;
    });

    var CanvasRenderer = unwrapExports(CanvasRenderer_1);

    var Font = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.FontMetrics = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var SAMPLE_TEXT = 'Hidden Text';

    var FontMetrics = exports.FontMetrics = function () {
        function FontMetrics(document) {
            _classCallCheck(this, FontMetrics);

            this._data = {};
            this._document = document;
        }

        _createClass(FontMetrics, [{
            key: '_parseMetrics',
            value: function _parseMetrics(font) {
                var container = this._document.createElement('div');
                var img = this._document.createElement('img');
                var span = this._document.createElement('span');

                var body = this._document.body;
                if (!body) {
                    throw new Error('');
                }

                container.style.visibility = 'hidden';
                container.style.fontFamily = font.fontFamily;
                container.style.fontSize = font.fontSize;
                container.style.margin = '0';
                container.style.padding = '0';

                body.appendChild(container);

                img.src = Util.SMALL_IMAGE;
                img.width = 1;
                img.height = 1;

                img.style.margin = '0';
                img.style.padding = '0';
                img.style.verticalAlign = 'baseline';

                span.style.fontFamily = font.fontFamily;
                span.style.fontSize = font.fontSize;
                span.style.margin = '0';
                span.style.padding = '0';

                span.appendChild(this._document.createTextNode(SAMPLE_TEXT));
                container.appendChild(span);
                container.appendChild(img);
                var baseline = img.offsetTop - span.offsetTop + 2;

                container.removeChild(span);
                container.appendChild(this._document.createTextNode(SAMPLE_TEXT));

                container.style.lineHeight = 'normal';
                img.style.verticalAlign = 'super';

                var middle = img.offsetTop - container.offsetTop + 2;

                body.removeChild(container);

                return { baseline: baseline, middle: middle };
            }
        }, {
            key: 'getMetrics',
            value: function getMetrics(font) {
                var key = font.fontFamily + ' ' + font.fontSize;
                if (this._data[key] === undefined) {
                    this._data[key] = this._parseMetrics(font);
                }

                return this._data[key];
            }
        }]);

        return FontMetrics;
    }();
    });

    unwrapExports(Font);
    var Font_1 = Font.FontMetrics;

    var Angle = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    var ANGLE = /([+-]?\d*\.?\d+)(deg|grad|rad|turn)/i;

    var parseAngle = exports.parseAngle = function parseAngle(angle) {
        var match = angle.match(ANGLE);

        if (match) {
            var value = parseFloat(match[1]);
            switch (match[2].toLowerCase()) {
                case 'deg':
                    return Math.PI * value / 180;
                case 'grad':
                    return Math.PI / 200 * value;
                case 'rad':
                    return value;
                case 'turn':
                    return Math.PI * 2 * value;
            }
        }

        return null;
    };
    });

    unwrapExports(Angle);
    var Angle_1 = Angle.parseAngle;

    var Gradient = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.transformWebkitRadialGradientArgs = exports.parseGradient = exports.RadialGradient = exports.LinearGradient = exports.RADIAL_GRADIENT_SHAPE = exports.GRADIENT_TYPE = undefined;

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();



    var _NodeContainer2 = _interopRequireDefault(NodeContainer_1);





    var _Color2 = _interopRequireDefault(Color_1);



    var _Length2 = _interopRequireDefault(Length_1);



    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var SIDE_OR_CORNER = /^(to )?(left|top|right|bottom)( (left|top|right|bottom))?$/i;
    var PERCENTAGE_ANGLES = /^([+-]?\d*\.?\d+)% ([+-]?\d*\.?\d+)%$/i;
    var ENDS_WITH_LENGTH = /(px)|%|( 0)$/i;
    var FROM_TO_COLORSTOP = /^(from|to|color-stop)\((?:([\d.]+)(%)?,\s*)?(.+?)\)$/i;
    var RADIAL_SHAPE_DEFINITION = /^\s*(circle|ellipse)?\s*((?:([\d.]+)(px|r?em|%)\s*(?:([\d.]+)(px|r?em|%))?)|closest-side|closest-corner|farthest-side|farthest-corner)?\s*(?:at\s*(?:(left|center|right)|([\d.]+)(px|r?em|%))\s+(?:(top|center|bottom)|([\d.]+)(px|r?em|%)))?(?:\s|$)/i;

    var GRADIENT_TYPE = exports.GRADIENT_TYPE = {
        LINEAR_GRADIENT: 0,
        RADIAL_GRADIENT: 1
    };

    var RADIAL_GRADIENT_SHAPE = exports.RADIAL_GRADIENT_SHAPE = {
        CIRCLE: 0,
        ELLIPSE: 1
    };

    var LENGTH_FOR_POSITION = {
        left: new _Length2.default('0%'),
        top: new _Length2.default('0%'),
        center: new _Length2.default('50%'),
        right: new _Length2.default('100%'),
        bottom: new _Length2.default('100%')
    };

    var LinearGradient = exports.LinearGradient = function LinearGradient(colorStops, direction) {
        _classCallCheck(this, LinearGradient);

        this.type = GRADIENT_TYPE.LINEAR_GRADIENT;
        this.colorStops = colorStops;
        this.direction = direction;
    };

    var RadialGradient = exports.RadialGradient = function RadialGradient(colorStops, shape, center, radius) {
        _classCallCheck(this, RadialGradient);

        this.type = GRADIENT_TYPE.RADIAL_GRADIENT;
        this.colorStops = colorStops;
        this.shape = shape;
        this.center = center;
        this.radius = radius;
    };

    var parseGradient = exports.parseGradient = function parseGradient(container, _ref, bounds) {
        var args = _ref.args,
            method = _ref.method,
            prefix = _ref.prefix;

        if (method === 'linear-gradient') {
            return parseLinearGradient(args, bounds, !!prefix);
        } else if (method === 'gradient' && args[0] === 'linear') {
            // TODO handle correct angle
            return parseLinearGradient(['to bottom'].concat(transformObsoleteColorStops(args.slice(3))), bounds, !!prefix);
        } else if (method === 'radial-gradient') {
            return parseRadialGradient(container, prefix === '-webkit-' ? transformWebkitRadialGradientArgs(args) : args, bounds);
        } else if (method === 'gradient' && args[0] === 'radial') {
            return parseRadialGradient(container, transformObsoleteColorStops(transformWebkitRadialGradientArgs(args.slice(1))), bounds);
        }
    };

    var parseColorStops = function parseColorStops(args, firstColorStopIndex, lineLength) {
        var colorStops = [];

        for (var i = firstColorStopIndex; i < args.length; i++) {
            var value = args[i];
            var HAS_LENGTH = ENDS_WITH_LENGTH.test(value);
            var lastSpaceIndex = value.lastIndexOf(' ');
            var _color = new _Color2.default(HAS_LENGTH ? value.substring(0, lastSpaceIndex) : value);
            var _stop = HAS_LENGTH ? new _Length2.default(value.substring(lastSpaceIndex + 1)) : i === firstColorStopIndex ? new _Length2.default('0%') : i === args.length - 1 ? new _Length2.default('100%') : null;
            colorStops.push({ color: _color, stop: _stop });
        }

        var absoluteValuedColorStops = colorStops.map(function (_ref2) {
            var color = _ref2.color,
                stop = _ref2.stop;

            var absoluteStop = lineLength === 0 ? 0 : stop ? stop.getAbsoluteValue(lineLength) / lineLength : null;

            return {
                color: color,
                // $FlowFixMe
                stop: absoluteStop
            };
        });

        var previousColorStop = absoluteValuedColorStops[0].stop;
        for (var _i = 0; _i < absoluteValuedColorStops.length; _i++) {
            if (previousColorStop !== null) {
                var _stop2 = absoluteValuedColorStops[_i].stop;
                if (_stop2 === null) {
                    var n = _i;
                    while (absoluteValuedColorStops[n].stop === null) {
                        n++;
                    }
                    var steps = n - _i + 1;
                    var nextColorStep = absoluteValuedColorStops[n].stop;
                    var stepSize = (nextColorStep - previousColorStop) / steps;
                    for (; _i < n; _i++) {
                        previousColorStop = absoluteValuedColorStops[_i].stop = previousColorStop + stepSize;
                    }
                } else {
                    previousColorStop = _stop2;
                }
            }
        }

        return absoluteValuedColorStops;
    };

    var parseLinearGradient = function parseLinearGradient(args, bounds, hasPrefix) {
        var angle = (0, Angle.parseAngle)(args[0]);
        var HAS_SIDE_OR_CORNER = SIDE_OR_CORNER.test(args[0]);
        var HAS_DIRECTION = HAS_SIDE_OR_CORNER || angle !== null || PERCENTAGE_ANGLES.test(args[0]);
        var direction = HAS_DIRECTION ? angle !== null ? calculateGradientDirection(
        // if there is a prefix, the 0° angle points due East (instead of North per W3C)
        hasPrefix ? angle - Math.PI * 0.5 : angle, bounds) : HAS_SIDE_OR_CORNER ? parseSideOrCorner(args[0], bounds) : parsePercentageAngle(args[0], bounds) : calculateGradientDirection(Math.PI, bounds);
        var firstColorStopIndex = HAS_DIRECTION ? 1 : 0;

        // TODO: Fix some inaccuracy with color stops with px values
        var lineLength = Math.min((0, Util.distance)(Math.abs(direction.x0) + Math.abs(direction.x1), Math.abs(direction.y0) + Math.abs(direction.y1)), bounds.width * 2, bounds.height * 2);

        return new LinearGradient(parseColorStops(args, firstColorStopIndex, lineLength), direction);
    };

    var parseRadialGradient = function parseRadialGradient(container, args, bounds) {
        var m = args[0].match(RADIAL_SHAPE_DEFINITION);
        var shape = m && (m[1] === 'circle' || // explicit shape specification
        m[3] !== undefined && m[5] === undefined) // only one radius coordinate
        ? RADIAL_GRADIENT_SHAPE.CIRCLE : RADIAL_GRADIENT_SHAPE.ELLIPSE;
        var radius = {};
        var center = {};

        if (m) {
            // Radius
            if (m[3] !== undefined) {
                radius.x = (0, Length_1.calculateLengthFromValueWithUnit)(container, m[3], m[4]).getAbsoluteValue(bounds.width);
            }

            if (m[5] !== undefined) {
                radius.y = (0, Length_1.calculateLengthFromValueWithUnit)(container, m[5], m[6]).getAbsoluteValue(bounds.height);
            }

            // Position
            if (m[7]) {
                center.x = LENGTH_FOR_POSITION[m[7].toLowerCase()];
            } else if (m[8] !== undefined) {
                center.x = (0, Length_1.calculateLengthFromValueWithUnit)(container, m[8], m[9]);
            }

            if (m[10]) {
                center.y = LENGTH_FOR_POSITION[m[10].toLowerCase()];
            } else if (m[11] !== undefined) {
                center.y = (0, Length_1.calculateLengthFromValueWithUnit)(container, m[11], m[12]);
            }
        }

        var gradientCenter = {
            x: center.x === undefined ? bounds.width / 2 : center.x.getAbsoluteValue(bounds.width),
            y: center.y === undefined ? bounds.height / 2 : center.y.getAbsoluteValue(bounds.height)
        };
        var gradientRadius = calculateRadius(m && m[2] || 'farthest-corner', shape, gradientCenter, radius, bounds);

        return new RadialGradient(parseColorStops(args, m ? 1 : 0, Math.min(gradientRadius.x, gradientRadius.y)), shape, gradientCenter, gradientRadius);
    };

    var calculateGradientDirection = function calculateGradientDirection(radian, bounds) {
        var width = bounds.width;
        var height = bounds.height;
        var HALF_WIDTH = width * 0.5;
        var HALF_HEIGHT = height * 0.5;
        var lineLength = Math.abs(width * Math.sin(radian)) + Math.abs(height * Math.cos(radian));
        var HALF_LINE_LENGTH = lineLength / 2;

        var x0 = HALF_WIDTH + Math.sin(radian) * HALF_LINE_LENGTH;
        var y0 = HALF_HEIGHT - Math.cos(radian) * HALF_LINE_LENGTH;
        var x1 = width - x0;
        var y1 = height - y0;

        return { x0: x0, x1: x1, y0: y0, y1: y1 };
    };

    var parseTopRight = function parseTopRight(bounds) {
        return Math.acos(bounds.width / 2 / ((0, Util.distance)(bounds.width, bounds.height) / 2));
    };

    var parseSideOrCorner = function parseSideOrCorner(side, bounds) {
        switch (side) {
            case 'bottom':
            case 'to top':
                return calculateGradientDirection(0, bounds);
            case 'left':
            case 'to right':
                return calculateGradientDirection(Math.PI / 2, bounds);
            case 'right':
            case 'to left':
                return calculateGradientDirection(3 * Math.PI / 2, bounds);
            case 'top right':
            case 'right top':
            case 'to bottom left':
            case 'to left bottom':
                return calculateGradientDirection(Math.PI + parseTopRight(bounds), bounds);
            case 'top left':
            case 'left top':
            case 'to bottom right':
            case 'to right bottom':
                return calculateGradientDirection(Math.PI - parseTopRight(bounds), bounds);
            case 'bottom left':
            case 'left bottom':
            case 'to top right':
            case 'to right top':
                return calculateGradientDirection(parseTopRight(bounds), bounds);
            case 'bottom right':
            case 'right bottom':
            case 'to top left':
            case 'to left top':
                return calculateGradientDirection(2 * Math.PI - parseTopRight(bounds), bounds);
            case 'top':
            case 'to bottom':
            default:
                return calculateGradientDirection(Math.PI, bounds);
        }
    };

    var parsePercentageAngle = function parsePercentageAngle(angle, bounds) {
        var _angle$split$map = angle.split(' ').map(parseFloat),
            _angle$split$map2 = _slicedToArray(_angle$split$map, 2),
            left = _angle$split$map2[0],
            top = _angle$split$map2[1];

        var ratio = left / 100 * bounds.width / (top / 100 * bounds.height);

        return calculateGradientDirection(Math.atan(isNaN(ratio) ? 1 : ratio) + Math.PI / 2, bounds);
    };

    var findCorner = function findCorner(bounds, x, y, closest) {
        var corners = [{ x: 0, y: 0 }, { x: 0, y: bounds.height }, { x: bounds.width, y: 0 }, { x: bounds.width, y: bounds.height }];

        // $FlowFixMe
        return corners.reduce(function (stat, corner) {
            var d = (0, Util.distance)(x - corner.x, y - corner.y);
            if (closest ? d < stat.optimumDistance : d > stat.optimumDistance) {
                return {
                    optimumCorner: corner,
                    optimumDistance: d
                };
            }

            return stat;
        }, {
            optimumDistance: closest ? Infinity : -Infinity,
            optimumCorner: null
        }).optimumCorner;
    };

    var calculateRadius = function calculateRadius(extent, shape, center, radius, bounds) {
        var x = center.x;
        var y = center.y;
        var rx = 0;
        var ry = 0;

        switch (extent) {
            case 'closest-side':
                // The ending shape is sized so that that it exactly meets the side of the gradient box closest to the gradient’s center.
                // If the shape is an ellipse, it exactly meets the closest side in each dimension.
                if (shape === RADIAL_GRADIENT_SHAPE.CIRCLE) {
                    rx = ry = Math.min(Math.abs(x), Math.abs(x - bounds.width), Math.abs(y), Math.abs(y - bounds.height));
                } else if (shape === RADIAL_GRADIENT_SHAPE.ELLIPSE) {
                    rx = Math.min(Math.abs(x), Math.abs(x - bounds.width));
                    ry = Math.min(Math.abs(y), Math.abs(y - bounds.height));
                }
                break;

            case 'closest-corner':
                // The ending shape is sized so that that it passes through the corner of the gradient box closest to the gradient’s center.
                // If the shape is an ellipse, the ending shape is given the same aspect-ratio it would have if closest-side were specified.
                if (shape === RADIAL_GRADIENT_SHAPE.CIRCLE) {
                    rx = ry = Math.min((0, Util.distance)(x, y), (0, Util.distance)(x, y - bounds.height), (0, Util.distance)(x - bounds.width, y), (0, Util.distance)(x - bounds.width, y - bounds.height));
                } else if (shape === RADIAL_GRADIENT_SHAPE.ELLIPSE) {
                    // Compute the ratio ry/rx (which is to be the same as for "closest-side")
                    var c = Math.min(Math.abs(y), Math.abs(y - bounds.height)) / Math.min(Math.abs(x), Math.abs(x - bounds.width));
                    var corner = findCorner(bounds, x, y, true);
                    rx = (0, Util.distance)(corner.x - x, (corner.y - y) / c);
                    ry = c * rx;
                }
                break;

            case 'farthest-side':
                // Same as closest-side, except the ending shape is sized based on the farthest side(s)
                if (shape === RADIAL_GRADIENT_SHAPE.CIRCLE) {
                    rx = ry = Math.max(Math.abs(x), Math.abs(x - bounds.width), Math.abs(y), Math.abs(y - bounds.height));
                } else if (shape === RADIAL_GRADIENT_SHAPE.ELLIPSE) {
                    rx = Math.max(Math.abs(x), Math.abs(x - bounds.width));
                    ry = Math.max(Math.abs(y), Math.abs(y - bounds.height));
                }
                break;

            case 'farthest-corner':
                // Same as closest-corner, except the ending shape is sized based on the farthest corner.
                // If the shape is an ellipse, the ending shape is given the same aspect ratio it would have if farthest-side were specified.
                if (shape === RADIAL_GRADIENT_SHAPE.CIRCLE) {
                    rx = ry = Math.max((0, Util.distance)(x, y), (0, Util.distance)(x, y - bounds.height), (0, Util.distance)(x - bounds.width, y), (0, Util.distance)(x - bounds.width, y - bounds.height));
                } else if (shape === RADIAL_GRADIENT_SHAPE.ELLIPSE) {
                    // Compute the ratio ry/rx (which is to be the same as for "farthest-side")
                    var _c = Math.max(Math.abs(y), Math.abs(y - bounds.height)) / Math.max(Math.abs(x), Math.abs(x - bounds.width));
                    var _corner = findCorner(bounds, x, y, false);
                    rx = (0, Util.distance)(_corner.x - x, (_corner.y - y) / _c);
                    ry = _c * rx;
                }
                break;

            default:
                // pixel or percentage values
                rx = radius.x || 0;
                ry = radius.y !== undefined ? radius.y : rx;
                break;
        }

        return {
            x: rx,
            y: ry
        };
    };

    var transformWebkitRadialGradientArgs = exports.transformWebkitRadialGradientArgs = function transformWebkitRadialGradientArgs(args) {
        var shape = '';
        var radius = '';
        var extent = '';
        var position = '';
        var idx = 0;

        var POSITION = /^(left|center|right|\d+(?:px|r?em|%)?)(?:\s+(top|center|bottom|\d+(?:px|r?em|%)?))?$/i;
        var SHAPE_AND_EXTENT = /^(circle|ellipse)?\s*(closest-side|closest-corner|farthest-side|farthest-corner|contain|cover)?$/i;
        var RADIUS = /^\d+(px|r?em|%)?(?:\s+\d+(px|r?em|%)?)?$/i;

        var matchStartPosition = args[idx].match(POSITION);
        if (matchStartPosition) {
            idx++;
        }

        var matchShapeExtent = args[idx].match(SHAPE_AND_EXTENT);
        if (matchShapeExtent) {
            shape = matchShapeExtent[1] || '';
            extent = matchShapeExtent[2] || '';
            if (extent === 'contain') {
                extent = 'closest-side';
            } else if (extent === 'cover') {
                extent = 'farthest-corner';
            }
            idx++;
        }

        var matchStartRadius = args[idx].match(RADIUS);
        if (matchStartRadius) {
            idx++;
        }

        var matchEndPosition = args[idx].match(POSITION);
        if (matchEndPosition) {
            idx++;
        }

        var matchEndRadius = args[idx].match(RADIUS);
        if (matchEndRadius) {
            idx++;
        }

        var matchPosition = matchEndPosition || matchStartPosition;
        if (matchPosition && matchPosition[1]) {
            position = matchPosition[1] + (/^\d+$/.test(matchPosition[1]) ? 'px' : '');
            if (matchPosition[2]) {
                position += ' ' + matchPosition[2] + (/^\d+$/.test(matchPosition[2]) ? 'px' : '');
            }
        }

        var matchRadius = matchEndRadius || matchStartRadius;
        if (matchRadius) {
            radius = matchRadius[0];
            if (!matchRadius[1]) {
                radius += 'px';
            }
        }

        if (position && !shape && !radius && !extent) {
            radius = position;
            position = '';
        }

        if (position) {
            position = 'at ' + position;
        }

        return [[shape, extent, radius, position].filter(function (s) {
            return !!s;
        }).join(' ')].concat(args.slice(idx));
    };

    var transformObsoleteColorStops = function transformObsoleteColorStops(args) {
        return args.map(function (color) {
            return color.match(FROM_TO_COLORSTOP);
        })
        // $FlowFixMe
        .map(function (v, index) {
            if (!v) {
                return args[index];
            }

            switch (v[1]) {
                case 'from':
                    return v[4] + ' 0%';
                case 'to':
                    return v[4] + ' 100%';
                case 'color-stop':
                    if (v[3] === '%') {
                        return v[4] + ' ' + v[2];
                    }
                    return v[4] + ' ' + parseFloat(v[2]) * 100 + '%';
            }
        });
    };
    });

    unwrapExports(Gradient);
    var Gradient_1 = Gradient.transformWebkitRadialGradientArgs;
    var Gradient_2 = Gradient.parseGradient;
    var Gradient_3 = Gradient.RadialGradient;
    var Gradient_4 = Gradient.LinearGradient;
    var Gradient_5 = Gradient.RADIAL_GRADIENT_SHAPE;
    var Gradient_6 = Gradient.GRADIENT_TYPE;

    var Renderer_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();









    var _TextContainer2 = _interopRequireDefault(TextContainer_1);





    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Renderer = function () {
        function Renderer(target, options) {
            _classCallCheck(this, Renderer);

            this.target = target;
            this.options = options;
            target.render(options);
        }

        _createClass(Renderer, [{
            key: 'renderNode',
            value: function renderNode(container) {
                if (container.isVisible()) {
                    this.renderNodeBackgroundAndBorders(container);
                    this.renderNodeContent(container);
                }
            }
        }, {
            key: 'renderNodeContent',
            value: function renderNodeContent(container) {
                var _this = this;

                var callback = function callback() {
                    if (container.childNodes.length) {
                        container.childNodes.forEach(function (child) {
                            if (child instanceof _TextContainer2.default) {
                                var style = child.parent.style;
                                _this.target.renderTextNode(child.bounds, style.color, style.font, style.textDecoration, style.textShadow);
                            } else {
                                _this.target.drawShape(child, container.style.color);
                            }
                        });
                    }

                    if (container.image) {
                        var _image = _this.options.imageStore.get(container.image);
                        if (_image) {
                            var contentBox = (0, Bounds_1.calculateContentBox)(container.bounds, container.style.padding, container.style.border);
                            var _width = typeof _image.width === 'number' && _image.width > 0 ? _image.width : contentBox.width;
                            var _height = typeof _image.height === 'number' && _image.height > 0 ? _image.height : contentBox.height;
                            if (_width > 0 && _height > 0) {
                                _this.target.clip([(0, Bounds_1.calculatePaddingBoxPath)(container.curvedBounds)], function () {
                                    _this.target.drawImage(_image, new Bounds_1.Bounds(0, 0, _width, _height), contentBox);
                                });
                            }
                        }
                    }
                };
                var paths = container.getClipPaths();
                if (paths.length) {
                    this.target.clip(paths, callback);
                } else {
                    callback();
                }
            }
        }, {
            key: 'renderNodeBackgroundAndBorders',
            value: function renderNodeBackgroundAndBorders(container) {
                var _this2 = this;

                var HAS_BACKGROUND = !container.style.background.backgroundColor.isTransparent() || container.style.background.backgroundImage.length;

                var hasRenderableBorders = container.style.border.some(function (border$$1) {
                    return border$$1.borderStyle !== border.BORDER_STYLE.NONE && !border$$1.borderColor.isTransparent();
                });

                var callback = function callback() {
                    var backgroundPaintingArea = (0, background.calculateBackgroungPaintingArea)(container.curvedBounds, container.style.background.backgroundClip);

                    if (HAS_BACKGROUND) {
                        _this2.target.clip([backgroundPaintingArea], function () {
                            if (!container.style.background.backgroundColor.isTransparent()) {
                                _this2.target.fill(container.style.background.backgroundColor);
                            }

                            _this2.renderBackgroundImage(container);
                        });
                    }

                    container.style.border.forEach(function (border$$1, side) {
                        if (border$$1.borderStyle !== border.BORDER_STYLE.NONE && !border$$1.borderColor.isTransparent()) {
                            _this2.renderBorder(border$$1, side, container.curvedBounds);
                        }
                    });
                };

                if (HAS_BACKGROUND || hasRenderableBorders) {
                    var paths = container.parent ? container.parent.getClipPaths() : [];
                    if (paths.length) {
                        this.target.clip(paths, callback);
                    } else {
                        callback();
                    }
                }
            }
        }, {
            key: 'renderBackgroundImage',
            value: function renderBackgroundImage(container) {
                var _this3 = this;

                container.style.background.backgroundImage.slice(0).reverse().forEach(function (backgroundImage) {
                    if (backgroundImage.source.method === 'url' && backgroundImage.source.args.length) {
                        _this3.renderBackgroundRepeat(container, backgroundImage);
                    } else if (/gradient/i.test(backgroundImage.source.method)) {
                        _this3.renderBackgroundGradient(container, backgroundImage);
                    }
                });
            }
        }, {
            key: 'renderBackgroundRepeat',
            value: function renderBackgroundRepeat(container, background$$1) {
                var image = this.options.imageStore.get(background$$1.source.args[0]);
                if (image) {
                    var backgroundPositioningArea = (0, background.calculateBackgroungPositioningArea)(container.style.background.backgroundOrigin, container.bounds, container.style.padding, container.style.border);
                    var backgroundImageSize = (0, background.calculateBackgroundSize)(background$$1, image, backgroundPositioningArea);
                    var position = (0, background.calculateBackgroundPosition)(background$$1.position, backgroundImageSize, backgroundPositioningArea);
                    var _path = (0, background.calculateBackgroundRepeatPath)(background$$1, position, backgroundImageSize, backgroundPositioningArea, container.bounds);

                    var _offsetX = Math.round(backgroundPositioningArea.left + position.x);
                    var _offsetY = Math.round(backgroundPositioningArea.top + position.y);
                    this.target.renderRepeat(_path, image, backgroundImageSize, _offsetX, _offsetY);
                }
            }
        }, {
            key: 'renderBackgroundGradient',
            value: function renderBackgroundGradient(container, background$$1) {
                var backgroundPositioningArea = (0, background.calculateBackgroungPositioningArea)(container.style.background.backgroundOrigin, container.bounds, container.style.padding, container.style.border);
                var backgroundImageSize = (0, background.calculateGradientBackgroundSize)(background$$1, backgroundPositioningArea);
                var position = (0, background.calculateBackgroundPosition)(background$$1.position, backgroundImageSize, backgroundPositioningArea);
                var gradientBounds = new Bounds_1.Bounds(Math.round(backgroundPositioningArea.left + position.x), Math.round(backgroundPositioningArea.top + position.y), backgroundImageSize.width, backgroundImageSize.height);

                var gradient = (0, Gradient.parseGradient)(container, background$$1.source, gradientBounds);
                if (gradient) {
                    switch (gradient.type) {
                        case Gradient.GRADIENT_TYPE.LINEAR_GRADIENT:
                            // $FlowFixMe
                            this.target.renderLinearGradient(gradientBounds, gradient);
                            break;
                        case Gradient.GRADIENT_TYPE.RADIAL_GRADIENT:
                            // $FlowFixMe
                            this.target.renderRadialGradient(gradientBounds, gradient);
                            break;
                    }
                }
            }
        }, {
            key: 'renderBorder',
            value: function renderBorder(border$$1, side, curvePoints) {
                this.target.drawShape((0, Bounds_1.parsePathForBorder)(curvePoints, side), border$$1.borderColor);
            }
        }, {
            key: 'renderStack',
            value: function renderStack(stack) {
                var _this4 = this;

                if (stack.container.isVisible()) {
                    var _opacity = stack.getOpacity();
                    if (_opacity !== this._opacity) {
                        this.target.setOpacity(stack.getOpacity());
                        this._opacity = _opacity;
                    }

                    var _transform = stack.container.style.transform;
                    if (_transform !== null) {
                        this.target.transform(stack.container.bounds.left + _transform.transformOrigin[0].value, stack.container.bounds.top + _transform.transformOrigin[1].value, _transform.transform, function () {
                            return _this4.renderStackContent(stack);
                        });
                    } else {
                        this.renderStackContent(stack);
                    }
                }
            }
        }, {
            key: 'renderStackContent',
            value: function renderStackContent(stack) {
                var _splitStackingContext = splitStackingContexts(stack),
                    _splitStackingContext2 = _slicedToArray(_splitStackingContext, 5),
                    negativeZIndex = _splitStackingContext2[0],
                    zeroOrAutoZIndexOrTransformedOrOpacity = _splitStackingContext2[1],
                    positiveZIndex = _splitStackingContext2[2],
                    nonPositionedFloats = _splitStackingContext2[3],
                    nonPositionedInlineLevel = _splitStackingContext2[4];

                var _splitDescendants = splitDescendants(stack),
                    _splitDescendants2 = _slicedToArray(_splitDescendants, 2),
                    inlineLevel = _splitDescendants2[0],
                    nonInlineLevel = _splitDescendants2[1];

                // https://www.w3.org/TR/css-position-3/#painting-order
                // 1. the background and borders of the element forming the stacking context.


                this.renderNodeBackgroundAndBorders(stack.container);
                // 2. the child stacking contexts with negative stack levels (most negative first).
                negativeZIndex.sort(sortByZIndex).forEach(this.renderStack, this);
                // 3. For all its in-flow, non-positioned, block-level descendants in tree order:
                this.renderNodeContent(stack.container);
                nonInlineLevel.forEach(this.renderNode, this);
                // 4. All non-positioned floating descendants, in tree order. For each one of these,
                // treat the element as if it created a new stacking context, but any positioned descendants and descendants
                // which actually create a new stacking context should be considered part of the parent stacking context,
                // not this new one.
                nonPositionedFloats.forEach(this.renderStack, this);
                // 5. the in-flow, inline-level, non-positioned descendants, including inline tables and inline blocks.
                nonPositionedInlineLevel.forEach(this.renderStack, this);
                inlineLevel.forEach(this.renderNode, this);
                // 6. All positioned, opacity or transform descendants, in tree order that fall into the following categories:
                //  All positioned descendants with 'z-index: auto' or 'z-index: 0', in tree order.
                //  For those with 'z-index: auto', treat the element as if it created a new stacking context,
                //  but any positioned descendants and descendants which actually create a new stacking context should be
                //  considered part of the parent stacking context, not this new one. For those with 'z-index: 0',
                //  treat the stacking context generated atomically.
                //
                //  All opacity descendants with opacity less than 1
                //
                //  All transform descendants with transform other than none
                zeroOrAutoZIndexOrTransformedOrOpacity.forEach(this.renderStack, this);
                // 7. Stacking contexts formed by positioned descendants with z-indices greater than or equal to 1 in z-index
                // order (smallest first) then tree order.
                positiveZIndex.sort(sortByZIndex).forEach(this.renderStack, this);
            }
        }, {
            key: 'render',
            value: function render(stack) {

                if (this.options.backgroundColor) {
                    this.target.rectangle(this.options.x, this.options.y, this.options.width, this.options.height, this.options.backgroundColor);
                }
                this.renderStack(stack);
                var target = this.target.getTarget();
                return target;
            }
        }]);

        return Renderer;
    }();

    exports.default = Renderer;


    var splitDescendants = function splitDescendants(stack) {
        var inlineLevel = [];
        var nonInlineLevel = [];

        var length = stack.children.length;
        for (var i = 0; i < length; i++) {
            var child = stack.children[i];
            if (child.isInlineLevel()) {
                inlineLevel.push(child);
            } else {
                nonInlineLevel.push(child);
            }
        }
        return [inlineLevel, nonInlineLevel];
    };

    var splitStackingContexts = function splitStackingContexts(stack) {
        var negativeZIndex = [];
        var zeroOrAutoZIndexOrTransformedOrOpacity = [];
        var positiveZIndex = [];
        var nonPositionedFloats = [];
        var nonPositionedInlineLevel = [];
        var length = stack.contexts.length;
        for (var i = 0; i < length; i++) {
            var child = stack.contexts[i];
            if (child.container.isPositioned() || child.container.style.opacity < 1 || child.container.isTransformed()) {
                if (child.container.style.zIndex.order < 0) {
                    negativeZIndex.push(child);
                } else if (child.container.style.zIndex.order > 0) {
                    positiveZIndex.push(child);
                } else {
                    zeroOrAutoZIndexOrTransformedOrOpacity.push(child);
                }
            } else {
                if (child.container.isFloating()) {
                    nonPositionedFloats.push(child);
                } else {
                    nonPositionedInlineLevel.push(child);
                }
            }
        }
        return [negativeZIndex, zeroOrAutoZIndexOrTransformedOrOpacity, positiveZIndex, nonPositionedFloats, nonPositionedInlineLevel];
    };

    var sortByZIndex = function sortByZIndex(a, b) {
        if (a.container.style.zIndex.order > b.container.style.zIndex.order) {
            return 1;
        } else if (a.container.style.zIndex.order < b.container.style.zIndex.order) {
            return -1;
        }

        return a.container.index > b.container.index ? 1 : -1;
    };
    });

    var Renderer = unwrapExports(Renderer_1);

    var _Proxy = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.Proxy = undefined;



    var _Feature2 = _interopRequireDefault(Feature);

    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    var Proxy = exports.Proxy = function Proxy(src, options) {
        if (!options.proxy) {
            return Promise.reject(null);
        }
        var proxy = options.proxy;

        return new Promise(function (resolve, reject) {
            var responseType = _Feature2.default.SUPPORT_CORS_XHR && _Feature2.default.SUPPORT_RESPONSE_TYPE ? 'blob' : 'text';
            var xhr = _Feature2.default.SUPPORT_CORS_XHR ? new XMLHttpRequest() : new XDomainRequest();
            xhr.onload = function () {
                if (xhr instanceof XMLHttpRequest) {
                    if (xhr.status === 200) {
                        if (responseType === 'text') {
                            resolve(xhr.response);
                        } else {
                            var reader = new FileReader();
                            // $FlowFixMe
                            reader.addEventListener('load', function () {
                                return resolve(reader.result);
                            }, false);
                            // $FlowFixMe
                            reader.addEventListener('error', function (e) {
                                return reject(e);
                            }, false);
                            reader.readAsDataURL(xhr.response);
                        }
                    } else {
                        reject('');
                    }
                } else {
                    resolve(xhr.responseText);
                }
            };

            xhr.onerror = reject;
            xhr.open('GET', proxy + '?url=' + encodeURIComponent(src) + '&responseType=' + responseType);

            if (responseType !== 'text' && xhr instanceof XMLHttpRequest) {
                xhr.responseType = responseType;
            }

            if (options.imageTimeout) {
                var timeout = options.imageTimeout;
                xhr.timeout = timeout;
                xhr.ontimeout = function () {
                    return reject('');
                };
            }

            xhr.send();
        });
    };
    });

    unwrapExports(_Proxy);
    var _Proxy_1 = _Proxy.Proxy;

    var ResourceLoader_1 = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.ResourceStore = undefined;

    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();



    var _Feature2 = _interopRequireDefault(Feature);



    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var ResourceLoader = function () {
        function ResourceLoader(options, logger, window) {
            _classCallCheck(this, ResourceLoader);

            this.options = options;
            this._window = window;
            this.origin = this.getOrigin(window.location.href);
            this.cache = {};
            this.logger = logger;
            this._index = 0;
        }

        _createClass(ResourceLoader, [{
            key: 'loadImage',
            value: function loadImage(src) {
                var _this = this;

                if (this.hasResourceInCache(src)) {
                    return src;
                }
                if (isBlobImage(src)) {
                    this.cache[src] = _loadImage(src, this.options.imageTimeout || 0);
                    return src;
                }

                if (!isSVG(src) || _Feature2.default.SUPPORT_SVG_DRAWING) {
                    if (this.options.allowTaint === true || isInlineImage(src) || this.isSameOrigin(src)) {
                        return this.addImage(src, src, false);
                    } else if (!this.isSameOrigin(src)) {
                        if (typeof this.options.proxy === 'string') {
                            this.cache[src] = (0, _Proxy.Proxy)(src, this.options).then(function (src) {
                                return _loadImage(src, _this.options.imageTimeout || 0);
                            });
                            return src;
                        } else if (this.options.useCORS === true && _Feature2.default.SUPPORT_CORS_IMAGES) {
                            return this.addImage(src, src, true);
                        }
                    }
                }
            }
        }, {
            key: 'inlineImage',
            value: function inlineImage(src) {
                var _this2 = this;

                if (isInlineImage(src)) {
                    return _loadImage(src, this.options.imageTimeout || 0);
                }
                if (this.hasResourceInCache(src)) {
                    return this.cache[src];
                }
                if (!this.isSameOrigin(src) && typeof this.options.proxy === 'string') {
                    return this.cache[src] = (0, _Proxy.Proxy)(src, this.options).then(function (src) {
                        return _loadImage(src, _this2.options.imageTimeout || 0);
                    });
                }

                return this.xhrImage(src);
            }
        }, {
            key: 'xhrImage',
            value: function xhrImage(src) {
                var _this3 = this;

                this.cache[src] = new Promise(function (resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.status !== 200) {
                                reject('Failed to fetch image ' + src.substring(0, 256) + ' with status code ' + xhr.status);
                            } else {
                                var reader = new FileReader();
                                reader.addEventListener('load', function () {
                                    // $FlowFixMe
                                    var result = reader.result;
                                    resolve(result);
                                }, false);
                                reader.addEventListener('error', function (e) {
                                    return reject(e);
                                }, false);
                                reader.readAsDataURL(xhr.response);
                            }
                        }
                    };
                    xhr.responseType = 'blob';
                    if (_this3.options.imageTimeout) {
                        var timeout = _this3.options.imageTimeout;
                        xhr.timeout = timeout;
                        xhr.ontimeout = function () {
                            return reject('');
                        };
                    }
                    xhr.open('GET', src, true);
                    xhr.send();
                }).then(function (src) {
                    return _loadImage(src, _this3.options.imageTimeout || 0);
                });

                return this.cache[src];
            }
        }, {
            key: 'loadCanvas',
            value: function loadCanvas(node) {
                var key = String(this._index++);
                this.cache[key] = Promise.resolve(node);
                return key;
            }
        }, {
            key: 'hasResourceInCache',
            value: function hasResourceInCache(key) {
                return typeof this.cache[key] !== 'undefined';
            }
        }, {
            key: 'addImage',
            value: function addImage(key, src, useCORS) {
                var _this4 = this;

                var imageLoadHandler = function imageLoadHandler(supportsDataImages) {
                    return new Promise(function (resolve, reject) {
                        var img = new Image();
                        img.onload = function () {
                            return resolve(img);
                        };
                        //ios safari 10.3 taints canvas with data urls unless crossOrigin is set to anonymous
                        if (!supportsDataImages || useCORS) {
                            img.crossOrigin = 'anonymous';
                        }

                        img.onerror = reject;
                        img.src = src;
                        if (img.complete === true) {
                            // Inline XML images may fail to parse, throwing an Error later on
                            setTimeout(function () {
                                resolve(img);
                            }, 500);
                        }
                        if (_this4.options.imageTimeout) {
                            var timeout = _this4.options.imageTimeout;
                            setTimeout(function () {
                                return reject('');
                            }, timeout);
                        }
                    });
                };

                this.cache[key] = isInlineBase64Image(src) && !isSVG(src) ? // $FlowFixMe
                _Feature2.default.SUPPORT_BASE64_DRAWING(src).then(imageLoadHandler) : imageLoadHandler(true);
                return key;
            }
        }, {
            key: 'isSameOrigin',
            value: function isSameOrigin(url) {
                return this.getOrigin(url) === this.origin;
            }
        }, {
            key: 'getOrigin',
            value: function getOrigin(url) {
                var link = this._link || (this._link = this._window.document.createElement('a'));
                link.href = url;
                link.href = link.href; // IE9, LOL! - http://jsfiddle.net/niklasvh/2e48b/
                return link.protocol + link.hostname + link.port;
            }
        }, {
            key: 'ready',
            value: function ready() {
                var _this5 = this;

                var keys = Object.keys(this.cache);
                var values = keys.map(function (str) {
                    return _this5.cache[str].catch(function (e) {
                        return null;
                    });
                });
                return Promise.all(values).then(function (images) {
                    return new ResourceStore(keys, images);
                });
            }
        }]);

        return ResourceLoader;
    }();

    exports.default = ResourceLoader;

    var ResourceStore = exports.ResourceStore = function () {
        function ResourceStore(keys, resources) {
            _classCallCheck(this, ResourceStore);

            this._keys = keys;
            this._resources = resources;
        }

        _createClass(ResourceStore, [{
            key: 'get',
            value: function get(key) {
                var index = this._keys.indexOf(key);
                return index === -1 ? null : this._resources[index];
            }
        }]);

        return ResourceStore;
    }();

    var INLINE_SVG = /^data:image\/svg\+xml/i;
    var INLINE_BASE64 = /^data:image\/.*;base64,/i;
    var INLINE_IMG = /^data:image\/.*/i;

    var isInlineImage = function isInlineImage(src) {
        return INLINE_IMG.test(src);
    };
    var isInlineBase64Image = function isInlineBase64Image(src) {
        return INLINE_BASE64.test(src);
    };
    var isBlobImage = function isBlobImage(src) {
        return src.substr(0, 4) === 'blob';
    };

    var isSVG = function isSVG(src) {
        return src.substr(-3).toLowerCase() === 'svg' || INLINE_SVG.test(src);
    };

    var _loadImage = function _loadImage(src, timeout) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () {
                return resolve(img);
            };
            img.onerror = reject;
            img.src = src;
            if (img.complete === true) {
                // Inline XML images may fail to parse, throwing an Error later on
                setTimeout(function () {
                    resolve(img);
                }, 500);
            }
            if (timeout) {
                setTimeout(function () {
                    return reject('');
                }, timeout);
            }
        });
    };
    });

    var ResourceLoader = unwrapExports(ResourceLoader_1);
    var ResourceLoader_2 = ResourceLoader_1.ResourceStore;

    function id(element) {
        return element.id ? `#${element.id}` : '';
    }
    function classes(element) {
        let classSelector = '';
        const classList = element.classList;
        for (const c of classList) {
            classSelector += '.' + c;
        }
        return classSelector;
    }
    function nthChild(element) {
        let childNumber = 0;
        const childNodes = element.parentNode.childNodes;
        for (const node of childNodes) {
            if (node.nodeType === Node.ELEMENT_NODE)
                ++childNumber;
            if (node === element)
                return `:nth-child('${childNumber}')`;
        }
    }
    function attributes(element) {
        let attributes = '';
        for (const attr of element.attributes) {
            attributes += `[${attr.name}="${attr.value}"]`;
        }
        return attributes;
    }
    function path(el, rootNode = document.documentElement) {
        const selector = el.tagName.toLowerCase() + id(el) + classes(el) + attributes(el) + nthChild(el);
        const hasParent = el.parentNode && el.parentNode !== rootNode && el.parentNode.tagName;
        return hasParent ? path(el.parentNode, rootNode) + ' > ' + selector : selector;
    }
    function hash(el) {
        const cssPath = path(el);
        const type = el.type;
        const checked = el.checked;
        const value = el.value;
        const textContent = el.textContent;
    }
    function traverseDOM(node, each, bind, level = 0) {
        level++;
        for (let child = node.firstChild; child; child = child.nextSibling) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                const el = child;
                if (each.call(bind, el, level)) {
                    traverseDOM(el, each, bind, level);
                }
            }
        }
    }
    function addCSSRule(sheet, selector, rules, index) {
        if ('insertRule' in sheet) {
            sheet.insertRule(selector + '{' + rules + '}', index);
        }
        else if ('addRule' in sheet) {
            sheet.addRule(selector, rules, index);
        }
    }
    function getBounds(element, bounds = { left: 0, top: 0, width: 0, height: 0 }) {
        const doc = element.ownerDocument;
        const defaultView = element.ownerDocument.defaultView;
        const docEl = doc.documentElement;
        const body = doc.body;
        if (element === docEl) {
            return getDocumentBounds(doc, bounds);
        }
        let el = element;
        let computedStyle;
        let offsetParent = el.offsetParent;
        let prevComputedStyle = defaultView.getComputedStyle(el, null);
        let top = el.offsetTop;
        let left = el.offsetLeft;
        while ((el = el.parentNode) && el !== body && el !== docEl) {
            if (prevComputedStyle.position === 'fixed') {
                break;
            }
            computedStyle = defaultView.getComputedStyle(el, null);
            top -= el.scrollTop;
            left -= el.scrollLeft;
            if (el === offsetParent) {
                top += el.offsetTop;
                left += el.offsetLeft;
                top += parseFloat(computedStyle.borderTopWidth) || 0;
                left += parseFloat(computedStyle.borderLeftWidth) || 0;
                offsetParent = el.offsetParent;
            }
            prevComputedStyle = computedStyle;
        }
        // if (prevComputedStyle.position === 'relative' || prevComputedStyle.position === 'static') {
        //   getDocumentBounds(doc, bounds)
        //   top += bounds.top
        //   left += bounds.left
        // }
        if (prevComputedStyle.position === 'fixed') {
            top += Math.max(docEl.scrollTop, body.scrollTop);
            left += Math.max(docEl.scrollLeft, body.scrollLeft);
        }
        // let el = element
        // let left = el.offsetLeft
        // let top = el.offsetTop
        // let offsetParent = el.offsetParent
        // while (el && el.nodeType !== Node.DOCUMENT_NODE) {
        //   left -= el.scrollLeft
        //   top -= el.scrollTop
        //   if (el === offsetParent) {
        //     const style = window.getComputedStyle(el)
        //     left += el.offsetLeft + parseFloat(style.borderLeftWidth!) || 0
        //     top += el.offsetTop + parseFloat(style.borderTopWidth!) || 0
        //     offsetParent = el.offsetParent
        //   }
        //   el = el.offsetParent as any
        // }
        bounds.left = left;
        bounds.top = top;
        bounds.width = element.offsetWidth;
        bounds.height = element.offsetHeight;
        return bounds;
    }
    /*
     * On some mobile browsers, the value reported by window.innerHeight
     * is not the true viewport height. This method returns
     * the actual viewport.
     */
    function getViewportBounds(bounds) {
        if (!viewportTester.parentNode)
            document.documentElement.append(viewportTester);
        bounds.left = pageXOffset;
        bounds.top = pageYOffset;
        bounds.width = viewportTester.offsetWidth;
        bounds.height = viewportTester.offsetHeight;
        return bounds;
    }
    const viewportTester = document.createElement('div');
    viewportTester.id = 'VIEWPORT';
    viewportTester.style.position = 'fixed';
    viewportTester.style.width = '100vw';
    viewportTester.style.height = '100vh';
    viewportTester.style.visibility = 'hidden';
    viewportTester.style.pointerEvents = 'none';
    function getDocumentBounds(document, bounds) {
        const documentElement = document.documentElement;
        const body = document.body;
        const documentElementStyle = getComputedStyle(documentElement);
        const bodyStyle = getComputedStyle(body);
        bounds.top =
            body.offsetTop + parseFloat(documentElementStyle.marginTop) ||
                0 + parseFloat(bodyStyle.marginTop) ||
                0;
        bounds.left =
            body.offsetLeft + parseFloat(documentElementStyle.marginLeft) ||
                0 + parseFloat(bodyStyle.marginLeft) ||
                0;
        bounds.width = Math.max(Math.max(body.scrollWidth, documentElement.scrollWidth), Math.max(body.offsetWidth, documentElement.offsetWidth), Math.max(body.clientWidth, documentElement.clientWidth));
        bounds.height = Math.max(Math.max(body.scrollHeight, documentElement.scrollHeight), Math.max(body.offsetHeight, documentElement.offsetHeight), Math.max(body.clientHeight, documentElement.clientHeight));
        return bounds;
    }

    var domUtils = /*#__PURE__*/Object.freeze({
        path: path,
        hash: hash,
        traverseDOM: traverseDOM,
        addCSSRule: addCSSRule,
        getBounds: getBounds,
        getViewportBounds: getViewportBounds,
        getDocumentBounds: getDocumentBounds
    });

    const scratchVector = new THREE.Vector3();
    const scratchVector2 = new THREE.Vector3();
    const microtask = Promise.resolve();
    const scratchBounds = { top: 0, left: 0, width: 0, height: 0 };
    /**
     * Transform a DOM tree into 3D layers.
     *
     * When an instance is created, a `layer` data-attribute is set on the
     * the passed DOM element to match this instance's Object3D id.
     * If the passed DOM element has an `id` attribute, this instance's Object3D name
     * will be set to match the element id.
     *
     * Child WebLayer3D instances can be specified with an empty `layer` data-attribute,
     * which will be set when the child WebLayer3D instance is created automatically.
     * The data-attribute can be specified added in HTML or dynamically:
     *  - `<div data-layer></div>`
     *  - `element.dataset.layer = ''`
     *
     * Additionally, the pixel ratio can be adjusted on each layer, individually:
     *  - `<div data-layer data-layer-pixel-ratio="0.5"></div>`
     *  - `element.dataset.layerPixelRatio = '0.5'`
     *
     * Finally, each layer can prerender multipe states specified as CSS classes delimited by spaces:
     *  - `<div data-layer data-layer-states="near far"></div>`
     *  - `element.dataset.layerStates = 'near far'`
     *
     * Each WebLayer3D will render each of its states with the corresponding CSS class applied to the element.
     * The texture state can be changed by alternating between the specified classes,
     * without requiring the DOM to be re-rendered. Setting a state on a parent layer does
     * not affect the state of a child layer.
     *
     * Every layer has an implicit `hover` state which can be mixed with any other declared state,
     * by using the appropriate CSS selector: `.near.hover` or `.far.hover`. Besides than the
     * `hover` state. The hover state is controlled by interaction rays, which can be provided
     * with the `interactionRays` property.
     *
     * Default dimensions: 1px = 0.001 world dimensions = 1mm (assuming meters)
     *     e.g., 500px width means 0.5meters
     */
    class WebLayer3D extends THREE.Object3D {
        constructor(element, options = {}, parentLayer = null, _level = 0) {
            super();
            this.options = options;
            this.parentLayer = parentLayer;
            this._level = _level;
            this.content = new THREE.Object3D();
            this.mesh = new THREE.Mesh(WebLayer3D.GEOMETRY, new THREE.MeshBasicMaterial({
                transparent: true,
                alphaTest: 0.001,
                opacity: 0
            }));
            this.depthMaterial = new THREE.MeshDepthMaterial({
                depthPacking: THREE.RGBADepthPacking,
                alphaTest: 0.01
            });
            this.childLayers = [];
            this.target = new THREE.Object3D();
            this.contentTarget = new THREE.Object3D();
            this.contentTargetOpacity = 0;
            this.cursor = new THREE.Object3D();
            this.needsRasterize = true;
            /**
             * Specifies whether or not this layer's layout
             * should match the layout stored in the `target` object
             *
             * When set to `always`, the target layout should always be applied.
             * When set to `never`, the target layout should never be applied.
             * When set to `auto`, the target layout should only be applied
             * when the `parentLayer` is the same as the `parent` object.
             *
             * It is the responsibiltiy of the update callback
             * to follow these rules.
             *
             * Defaults to `auto`
             */
            this.shouldUseTargetLayout = 'auto';
            /**
             * Specifies whether or not the update callback should update
             * the `content` layout to match the layout stored in
             * the `contentTarget` object
             *
             * It is the responsibiltiy of the update callback
             * to follow these rules.
             *
             * Defaults to `true`
             */
            this.shouldUseContentTargetLayout = true;
            this._lastTargetPosition = new THREE.Vector3();
            this._lastContentTargetScale = new THREE.Vector3(0.1, 0.1, 0.1);
            this._hover = 0;
            this._hoverDepth = 0;
            this._states = {};
            this._pixelRatio = 1;
            this._state = '';
            this._needsRemoval = false;
            // the following properties are meant to be accessed on the root layer
            this._rasterizationQueue = [];
            this._meshMap = new WeakMap();
            this._interactionRays = [];
            this._raycaster = new THREE.Raycaster();
            this._hitIntersections = this._raycaster.intersectObjects([]); // for type inference
            this._normalizedBounds = { left: 0, top: 0, width: 0, height: 0 };
            WebLayer3D.layersByElement.set(element, this);
            this.element = element;
            this.element.setAttribute(WebLayer3D.LAYER_ATTRIBUTE, this.id.toString());
            this.rootLayer = this.parentLayer ? this.parentLayer.rootLayer : this;
            this.name = element.id;
            if (!document.contains(element) && this.rootLayer === this) {
                ensureElementIsInDocument(element, options);
            }
            if (!WebLayer3D._didInstallStyleSheet) {
                const style = document.createElement('style');
                document.head.append(style);
                addCSSRule(style.sheet, `[${WebLayer3D.DISABLE_TRANSFORMS_ATTRIBUTE}] *`, 'transform: none !important;', 0);
                WebLayer3D._didInstallStyleSheet = true;
            }
            this.add(this.content);
            this.add(this.cursor);
            this.cursor.visible = false;
            this.mesh.visible = false;
            this.mesh['customDepthMaterial'] = this.depthMaterial;
            this.rootLayer._meshMap.set(this.mesh, this);
            if (this.rootLayer === this) {
                this._triggerRefresh = (e) => {
                    const layer = this.getLayerForElement(e.target);
                    if (layer) {
                        layer.needsRasterize = true;
                    }
                };
                element.addEventListener('input', this._triggerRefresh, { capture: true });
                element.addEventListener('change', this._triggerRefresh, { capture: true });
                element.addEventListener('focus', this._triggerRefresh, { capture: true });
                element.addEventListener('blur', this._triggerRefresh, { capture: true });
                element.addEventListener('transitionend', this._triggerRefresh, { capture: true });
                let target;
                const setLayerNeedsRasterize = (layer) => {
                    if (target.contains(layer.element))
                        layer.needsRasterize = true;
                };
                this._processMutations = (records) => {
                    for (const record of records) {
                        if (record.type === 'attributes' &&
                            record.target.getAttribute(record.attributeName) === record.oldValue)
                            continue;
                        if (record.type === 'characterData' &&
                            record.target.data === record.oldValue)
                            continue;
                        target =
                            record.target.nodeType === Node.ELEMENT_NODE
                                ? record.target
                                : record.target.parentElement;
                        if (!target)
                            continue;
                        const layer = this.getLayerForElement(target);
                        if (!layer)
                            continue;
                        if (record.type === 'attributes' && record.attributeName === 'class') {
                            const oldClasses = record.oldValue ? record.oldValue.split(/\s+/) : [];
                            const currentClasses = record.target.className.split(/\s+/);
                            const addedClasses = arraySubtract(currentClasses, oldClasses);
                            const removedClasses = arraySubtract(oldClasses, currentClasses);
                            let needsRasterize = false;
                            for (const c of removedClasses) {
                                if (c === 'hover' || layer._states[c]) {
                                    continue;
                                }
                                needsRasterize = true;
                            }
                            for (const c of addedClasses) {
                                if (c === 'hover' || layer._states[c]) {
                                    continue;
                                }
                                needsRasterize = true;
                            }
                            if (!needsRasterize)
                                continue;
                        }
                        layer.needsRasterize = true;
                        layer.traverseLayers(setLayerNeedsRasterize);
                    }
                };
                this._mutationObserver = new MutationObserver(this._processMutations);
                this._mutationObserver.observe(element, {
                    characterData: true,
                    characterDataOldValue: true,
                    attributes: true,
                    attributeOldValue: true,
                    childList: true,
                    subtree: true
                });
                // stuff for rendering with html2canvas ¯\_(ツ)_/¯
                this._logger = new Logger(false);
                this._fontMetrics = new Font_1(document);
                this._resourceLoader = new ResourceLoader({
                    imageTimeout: 15000,
                    allowTaint: options.allowTaint || false
                }, this._logger, window);
            }
            // technically this should only be needed in the root layer,
            // however the polyfill seems to miss resizes that happen in child
            // elements unless observing each layer
            this._resizeObserver = new index(records => {
                for (const record of records) {
                    const layer = this.getLayerForElement(record.target);
                    layer.needsRasterize = true;
                }
            });
            this._resizeObserver.observe(element);
            this._refreshState();
            WebLayer3D._scheduleRefresh(this);
            if (this.options.onLayerCreate)
                this.options.onLayerCreate(this);
        }
        static computeNaturalDistance(projection, renderer) {
            let projectionMatrix = projection;
            if (projection.isCamera) {
                projectionMatrix = projection.projectionMatrix;
            }
            const pixelRatio = renderer.getPixelRatio();
            const widthPixels = renderer.domElement.width / pixelRatio;
            const width = WebLayer3D.PIXEL_SIZE * widthPixels;
            const horizontalFOV = getFovs(projectionMatrix).horizontal;
            const naturalDistance = width / 2 / Math.tan(horizontalFOV / 2);
            return naturalDistance;
        }
        static shouldUseTargetLayout(layer) {
            const should = layer.shouldUseTargetLayout;
            if (should === 'always')
                return true;
            if (should === 'never')
                return false;
            if (should === 'auto' && layer.parent === layer.parentLayer)
                return true;
            return false;
        }
        static updateLayout(layer, lerp) {
            if (WebLayer3D.shouldUseTargetLayout(layer)) {
                layer.position.lerp(layer.target.position, lerp);
                layer.scale.lerp(layer.target.scale, lerp);
                layer.quaternion.slerp(layer.target.quaternion, lerp);
            }
            if (layer.shouldUseContentTargetLayout) {
                layer.content.position.lerp(layer.contentTarget.position, lerp);
                layer.content.scale.lerp(layer.contentTarget.scale, lerp);
                layer.content.quaternion.slerp(layer.contentTarget.quaternion, lerp);
            }
        }
        static updateVisibility(layer, lerp) {
            const material = layer.mesh.material;
            if ('opacity' in material) {
                const targetOpacity = layer.contentTargetOpacity;
                material.opacity = Math.min(THREE.Math.lerp(material.opacity, targetOpacity, lerp), 1);
                material.needsUpdate = true;
            }
        }
        static _updateInteractions(rootLayer) {
            rootLayer.updateWorldMatrix(true, true);
            rootLayer.traverseLayers(WebLayer3D._clearHover);
            WebLayer3D._hoverLayers.clear();
            for (const ray of rootLayer._interactionRays) {
                rootLayer._hitIntersections.length = 0;
                if (ray instanceof THREE.Ray)
                    rootLayer._raycaster.ray.copy(ray);
                else
                    rootLayer._raycaster.ray.set(ray.getWorldPosition(scratchVector), ray.getWorldDirection(scratchVector2));
                rootLayer._raycaster.intersectObject(rootLayer, true, rootLayer._hitIntersections);
                for (const intersection of rootLayer._hitIntersections) {
                    let layer = rootLayer._meshMap.get(intersection.object);
                    if (layer && layer.contentTargetOpacity !== 0) {
                        layer.cursor.position.copy(intersection.point);
                        layer.worldToLocal(layer.cursor.position);
                        layer.cursor.visible = true;
                        while (layer instanceof WebLayer3D) {
                            WebLayer3D._hoverLayers.add(layer);
                            layer = layer.parent;
                        }
                        break;
                    }
                }
            }
            rootLayer.traverseLayers(WebLayer3D._setHover);
            traverseDOM(rootLayer.element, WebLayer3D._setHoverClass);
        }
        static async _scheduleRefresh(rootLayer) {
            await microtask; // wait for render to complete
            rootLayer.refresh();
        }
        static async _scheduleRasterizations(rootLayer) {
            await microtask; // wait for render to complete
            const queue = rootLayer._rasterizationQueue;
            if (queue.length === 0)
                return;
            if (window.requestIdleCallback) {
                window.requestIdleCallback(idleDeadline => {
                    if (!queue.length)
                        return;
                    if (WebLayer3D.DEBUG_PERFORMANCE)
                        performance.mark('rasterize queue start');
                    while (queue.length && idleDeadline.timeRemaining() > 0) {
                        if (WebLayer3D.DEBUG_PERFORMANCE)
                            performance.mark('rasterize start');
                        queue.shift()._rasterize();
                        if (WebLayer3D.DEBUG_PERFORMANCE)
                            performance.mark('rasterize end');
                        if (WebLayer3D.DEBUG_PERFORMANCE)
                            performance.measure('rasterize', 'rasterize start', 'rasterize end');
                    }
                    if (WebLayer3D.DEBUG_PERFORMANCE)
                        performance.mark('rasterize queue end');
                    if (WebLayer3D.DEBUG_PERFORMANCE)
                        performance.measure('rasterize queue', 'rasterize queue start', 'rasterize queue end');
                });
            }
            else {
                const startTime = performance.now();
                if (WebLayer3D.DEBUG_PERFORMANCE)
                    performance.mark('rasterize queue start');
                while (queue.length && performance.now() - startTime < 5) {
                    if (WebLayer3D.DEBUG_PERFORMANCE)
                        performance.mark('rasterize start');
                    queue.shift()._rasterize();
                    if (WebLayer3D.DEBUG_PERFORMANCE)
                        performance.mark('rasterize end');
                    if (WebLayer3D.DEBUG_PERFORMANCE)
                        performance.measure('rasterize', 'rasterize start', 'rasterize end');
                }
                if (WebLayer3D.DEBUG_PERFORMANCE)
                    performance.mark('rasterize queue end');
                if (WebLayer3D.DEBUG_PERFORMANCE)
                    performance.measure('rasterize queue', 'rasterize queue start', 'rasterize queue end');
            }
        }
        /**
         * Get the texture state.
         * Note: if a state is not available, the `default` state will be rendered.
         */
        get state() {
            return this._state;
        }
        get texture() {
            const state = this._states[this.state] || this._states[''];
            return (state[this.hover] || state[0]).texture;
        }
        get bounds() {
            const state = this._states[this.state] || this._states[''];
            return (state[this.hover] || state[0]).bounds;
        }
        get normalizedBounds() {
            const viewportBounds = getViewportBounds(this._normalizedBounds);
            const viewportWidth = viewportBounds.width;
            const viewportHeight = viewportBounds.height;
            const bounds = this.bounds;
            const normalizedBounds = this._normalizedBounds;
            normalizedBounds.left = bounds.left / viewportWidth;
            normalizedBounds.top = bounds.top / viewportHeight;
            normalizedBounds.width = bounds.width / viewportWidth;
            normalizedBounds.height = bounds.height / viewportHeight;
            return normalizedBounds;
        }
        /**
         * A list of Rays to be used for interaction.
         * Can only be set on a root WebLayer3D instance.
         * @param rays
         */
        set interactionRays(rays) {
            this._checkRoot();
            this._interactionRays = rays;
        }
        get interactionRays() {
            return this._interactionRays;
        }
        /**
         * Get the hover state
         */
        get hover() {
            return this._hover;
        }
        /**
         * Get the layer level
         */
        get level() {
            return this._level;
        }
        /** If true, this layer needs to be removed from the scene */
        get needsRemoval() {
            return this._needsRemoval;
        }
        /**
         * Update the pose and opacity of this layer (does not rerender the DOM).
         * This should be called each frame, and can only be called on a root WebLayer3D instance.
         *
         * @param lerp lerp value
         * @param updateCallback update callback called for each layer. Default is WebLayer3D.UDPATE_DEFAULT
         */
        update(lerp = 1, updateCallback = WebLayer3D.UPDATE_DEFAULT) {
            if (WebLayer3D.DEBUG_PERFORMANCE)
                performance.mark('update start');
            lerp = Math.min(lerp, 1);
            this._checkRoot();
            WebLayer3D._updateInteractions(this);
            this.traverseLayers(updateCallback, lerp);
            WebLayer3D._scheduleRefresh(this);
            WebLayer3D._scheduleRasterizations(this);
            if (WebLayer3D.DEBUG_PERFORMANCE)
                performance.mark('update end');
            if (WebLayer3D.DEBUG_PERFORMANCE)
                performance.measure('update', 'update start', 'update end');
        }
        traverseLayers(each, ...params) {
            each(this, ...params);
            this.traverseChildLayers(each, ...params);
        }
        traverseChildLayers(each, ...params) {
            for (const child of this.childLayers) {
                child.traverseLayers(each, ...params);
            }
            return params;
        }
        getLayerForQuery(selector) {
            const element = this.element.querySelector(selector);
            if (element) {
                return this.getLayerForElement(element);
            }
            return undefined;
        }
        getLayerForElement(element) {
            const closestLayerElement = element.closest(`[${WebLayer3D.LAYER_ATTRIBUTE}]`);
            return WebLayer3D.layersByElement.get(closestLayerElement);
        }
        hitTest(ray) {
            const raycaster = this.rootLayer._raycaster;
            const intersections = this.rootLayer._hitIntersections;
            const meshMap = this.rootLayer._meshMap;
            raycaster.ray.copy(ray);
            intersections.length = 0;
            raycaster.intersectObject(this, true, intersections);
            for (const intersection of intersections) {
                const layer = meshMap.get(intersection.object);
                if (!layer)
                    continue;
                const layerBoundingRect = layer.bounds;
                if (!layerBoundingRect.width || !layerBoundingRect.height)
                    continue;
                let target = layer.element;
                const clientX = intersection.uv.x * layerBoundingRect.width;
                const clientY = (1 - intersection.uv.y) * layerBoundingRect.height;
                traverseDOM(layer.element, el => {
                    if (!target.contains(el))
                        return false;
                    const elementBoundingRect = getBounds(el, scratchBounds);
                    const offsetLeft = elementBoundingRect.left - layerBoundingRect.left;
                    const offsetTop = elementBoundingRect.top - layerBoundingRect.top;
                    const { width, height } = elementBoundingRect;
                    const offsetRight = offsetLeft + width;
                    const offsetBottom = offsetTop + height;
                    if (clientX > offsetLeft &&
                        clientX < offsetRight &&
                        clientY > offsetTop &&
                        clientY < offsetBottom) {
                        target = el;
                        return true;
                    }
                    return false; // stop traversal down this path
                });
                return { layer, intersection, target };
            }
            return undefined;
        }
        refresh(forceRasterize = false) {
            this._refreshState();
            this._refreshBounds();
            if (this.needsRasterize || forceRasterize) {
                this.needsRasterize = false;
                this._refreshChildLayers();
                if (this.rootLayer._rasterizationQueue.indexOf(this) === -1) {
                    this.rootLayer._rasterizationQueue.push(this);
                }
            }
            for (const child of this.childLayers) {
                child.refresh(forceRasterize);
            }
            this._refreshTargetLayout();
            this._refreshMesh();
            const childMaterial = this.mesh.material;
            const isHidden = childMaterial.opacity < 0.005;
            if (isHidden)
                this.mesh.visible = false;
            else
                this.mesh.visible = true;
            if (this.needsRemoval && isHidden) {
                if (this.parent)
                    this.parent.remove(this);
                this.dispose();
            }
        }
        dispose() {
            if (this._mutationObserver)
                this._mutationObserver.disconnect();
            if (this._resizeObserver)
                this._resizeObserver.disconnect();
            for (const child of this.childLayers)
                child.dispose();
        }
        _refreshState() {
            const element = this.element;
            const options = this.options;
            const window = element.ownerDocument.defaultView;
            const pixelRatioDefault = options.pixelRatio && options.pixelRatio > 0
                ? options.pixelRatio
                : window.devicePixelRatio || 1;
            const pixelRatioAttribute = parseFloat(element.getAttribute(WebLayer3D.PIXEL_RATIO_ATTRIBUTE) || '1');
            const pixelRatio = isFinite(pixelRatioAttribute) && pixelRatioAttribute > 0
                ? pixelRatioAttribute * pixelRatioDefault
                : pixelRatioDefault;
            this._pixelRatio = Math.max(pixelRatio, 10e-6);
            this._hoverDepth = parseInt(element.getAttribute(WebLayer3D.HOVER_DEPTH_ATTRIBUTE) || '0');
            const states = (element.getAttribute(WebLayer3D.STATES_ATTRIBUTE) || '')
                .trim()
                .split(/\s+/)
                .filter(Boolean);
            states.push('');
            // set the current state from classlist
            const classes = element.classList;
            let state = '';
            for (const c of classes) {
                if (states.indexOf(c) > -1) {
                    state = c;
                    break;
                }
            }
            this._state = state;
            // cleanup unused textures
            for (const stateKey in this._states) {
                if (states.indexOf(stateKey) === -1) {
                    const hoverStates = this._states[stateKey];
                    for (const hoverState of hoverStates) {
                        hoverState.texture.dispose();
                    }
                    delete this._states[stateKey];
                }
            }
            for (const stateKey of states) {
                if (this._states[stateKey] === undefined) {
                    const hoverStates = (this._states[stateKey] = []);
                    for (let i = 0; i <= this._hoverDepth; i++) {
                        hoverStates[i] = hoverStates[i] || {
                            texture: null,
                            bounds: { left: 0, top: 0, width: 0, height: 0 }
                        };
                    }
                }
            }
        }
        _checkRoot() {
            if (this.rootLayer !== this)
                throw new Error('Only call `update` on a root WebLayer3D instance');
        }
        _refreshBounds() {
            getBounds(this.element, this.bounds);
        }
        _refreshTargetLayout() {
            this.target.position.copy(this._lastTargetPosition);
            this.target.scale.set(1, 1, 1);
            this.target.quaternion.set(0, 0, 0, 1);
            this.contentTarget.position.set(0, 0, 0);
            this.contentTarget.scale.copy(this._lastContentTargetScale);
            this.contentTarget.quaternion.set(0, 0, 0, 1);
            if (this.needsRemoval) {
                this.contentTargetOpacity = 0;
                return;
            }
            const boundingRect = this.bounds;
            if (boundingRect.width === 0 || boundingRect.height === 0) {
                this.contentTargetOpacity = 0;
                return;
            }
            this.contentTargetOpacity = 1;
            const pixelSize = WebLayer3D.PIXEL_SIZE;
            const parentBoundingRect = this.parent instanceof WebLayer3D
                ? this.parent.bounds
                : getViewportBounds(scratchBounds);
            const left = boundingRect.left - parentBoundingRect.left;
            const top = boundingRect.top - parentBoundingRect.top;
            const parentOriginX = pixelSize * (-parentBoundingRect.width / 2);
            const parentOriginY = pixelSize * (parentBoundingRect.height / 2);
            const layerSeparation = this.options.layerSeparation || WebLayer3D.DEFAULT_LAYER_SEPARATION;
            const myLeft = pixelSize * (left + boundingRect.width / 2);
            const myTop = pixelSize * (top + boundingRect.height / 2);
            this.target.position.set(parentOriginX + myLeft, parentOriginY - myTop, layerSeparation * this.level);
            this.contentTarget.scale.set(Math.max(pixelSize * boundingRect.width, 10e-6), Math.max(pixelSize * boundingRect.height, 10e-6), 1);
            this._lastTargetPosition.copy(this.target.position);
            this._lastContentTargetScale.copy(this.contentTarget.scale);
        }
        _refreshMesh() {
            const mesh = this.mesh;
            const texture = this.texture;
            if (!texture)
                return;
            const material = mesh.material;
            material.map = texture;
            material.needsUpdate = true;
            this.depthMaterial['map'] = texture;
            this.depthMaterial.needsUpdate = true;
            if (!mesh.parent) {
                this.content.add(mesh);
                this._refreshTargetLayout();
                this.content.position.copy(this.contentTarget.position);
                this.content.scale.copy(this.contentTarget.scale);
            }
            mesh.renderOrder = this.level;
        }
        _showChildLayers(show) {
            for (const child of this.childLayers) {
                const childEl = child.element;
                if (childEl && childEl.style) {
                    childEl.style.opacity = show ? '1' : '0';
                }
            }
        }
        _disableTransforms(disabled) {
            if (disabled) {
                document.documentElement.setAttribute(WebLayer3D.DISABLE_TRANSFORMS_ATTRIBUTE, '');
            }
            else {
                document.documentElement.removeAttribute(WebLayer3D.DISABLE_TRANSFORMS_ATTRIBUTE);
            }
        }
        _setHoverClasses(hover) {
            let el = this.element;
            let skip = hover - 1;
            while (el) {
                if (hover === 0) {
                    if (el.classList.contains('hover'))
                        el.classList.remove('hover');
                }
                else if (skip === 0) {
                    if (!el.classList.contains('hover'))
                        el.classList.add('hover');
                }
                else {
                    skip--;
                    el = this.parent && this.parent instanceof WebLayer3D ? this.parent.element : null;
                    continue;
                }
                el = el.parentElement;
            }
        }
        _markForRemoval() {
            this._needsRemoval = true;
            for (const child of this.childLayers) {
                child._markForRemoval();
            }
        }
        _refreshChildLayers() {
            const element = this.element;
            const childLayers = this.childLayers;
            const oldChildLayers = childLayers.slice();
            childLayers.length = 0;
            traverseDOM(element, this._tryConvertToWebLayer3D, this, this.level);
            for (const child of oldChildLayers) {
                if (childLayers.indexOf(child) === -1) {
                    child._markForRemoval();
                    childLayers.push(child);
                }
            }
        }
        _tryConvertToWebLayer3D(el, level) {
            const id = el.getAttribute(WebLayer3D.LAYER_ATTRIBUTE);
            if (id !== null || el.nodeName === 'VIDEO') {
                let child = this.getObjectById(parseInt(id + '', 10));
                if (!child) {
                    child = new WebLayer3D(el, this.options, this, level);
                    this.add(child);
                }
                this.childLayers.push(child);
                return false; // stop traversing this subtree
            }
            return true;
        }
        async _rasterize() {
            const element = this.element;
            const states = this._states;
            const renderFunctions = [];
            this.rootLayer._processMutations(this.rootLayer._mutationObserver.takeRecords());
            if (this.options.onBeforeRasterize) {
                this.options.onBeforeRasterize.call(null, this);
            }
            const onAfterRasterize = this.options.onAfterRasterize;
            if (element.nodeName === 'VIDEO') {
                const state = states[''][0];
                getBounds(element, state.bounds);
                state.texture = state.texture || new THREE.VideoTexture(element);
                if (onAfterRasterize)
                    onAfterRasterize(this);
                this.rootLayer._mutationObserver.takeRecords();
                return;
            }
            this._disableTransforms(true);
            this._showChildLayers(false);
            const classValue = element.className;
            for (const stateKey in states) {
                const hoverStates = states[stateKey];
                let hoverDepth = this._hoverDepth;
                for (let hover = 0; hover <= hoverDepth; hover++) {
                    const state = hoverStates[hover];
                    const texture = state.texture || new THREE.Texture(document.createElement('canvas'));
                    if (stateKey)
                        element.classList.add(stateKey);
                    this._setHoverClasses(hover);
                    const bounds = getBounds(element);
                    const stack = NodeParser_2(element, this.rootLayer._resourceLoader, this.rootLayer._logger);
                    if (stateKey)
                        element.classList.remove(stateKey);
                    this._setHoverClasses(0);
                    if (!bounds.width || !bounds.height)
                        continue;
                    state.bounds = bounds;
                    renderFunctions.push(() => {
                        const canvas = texture.image;
                        const context = canvas.getContext('2d');
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        const renderer = new Renderer(new CanvasRenderer(canvas), {
                            backgroundColor: null,
                            fontMetrics: this.rootLayer._fontMetrics,
                            imageStore,
                            logger: this.rootLayer._logger,
                            scale: this._pixelRatio,
                            x: bounds.left,
                            y: bounds.top,
                            width: bounds.width,
                            height: bounds.height,
                            allowTaint: this.options.allowTaint || false
                        });
                        renderer.render(stack);
                        if (!canvas.width || !canvas.height) {
                            canvas.width = 1;
                            canvas.height = 1;
                        }
                        texture.image = canvas;
                        texture.minFilter = THREE.LinearFilter;
                        texture.needsUpdate = true;
                        state.texture = texture;
                    });
                }
            }
            element.className = classValue;
            this._showChildLayers(true);
            this._disableTransforms(false);
            if (onAfterRasterize)
                onAfterRasterize(this);
            this.rootLayer._mutationObserver.takeRecords();
            const imageStore = await this.rootLayer._resourceLoader.ready();
            for (const render of renderFunctions)
                render();
        }
    }
    WebLayer3D.domUtils = domUtils;
    WebLayer3D.DEBUG_PERFORMANCE = false;
    WebLayer3D.LAYER_ATTRIBUTE = 'data-layer';
    WebLayer3D.LAYER_CONTAINER_ATTRIBUTE = 'data-layer-container';
    WebLayer3D.PIXEL_RATIO_ATTRIBUTE = 'data-layer-pixel-ratio';
    WebLayer3D.STATES_ATTRIBUTE = 'data-layer-states';
    WebLayer3D.HOVER_DEPTH_ATTRIBUTE = 'data-layer-hover-depth';
    WebLayer3D.DISABLE_TRANSFORMS_ATTRIBUTE = 'data-layer-disable-transforms';
    WebLayer3D.DEFAULT_LAYER_SEPARATION = 0.005;
    WebLayer3D.PIXEL_SIZE = 0.001;
    WebLayer3D.GEOMETRY = new THREE.PlaneGeometry(1, 1, 2, 2);
    WebLayer3D.layersByElement = new WeakMap();
    WebLayer3D.UPDATE_DEFAULT = function (layer, lerp = 1) {
        WebLayer3D.updateLayout(layer, lerp);
        WebLayer3D.updateVisibility(layer, lerp);
    };
    WebLayer3D._hoverLayers = new Set();
    WebLayer3D._clearHover = function (layer) {
        layer._hover = 0;
        layer.cursor.visible = false;
    };
    WebLayer3D._setHover = function (layer) {
        layer._hover = WebLayer3D._hoverLayers.has(layer)
            ? 1
            : layer.parent instanceof WebLayer3D && layer.parent._hover > 0
                ? layer.parent._hover + 1
                : layer._hover;
    };
    WebLayer3D._setHoverClass = function (element) {
        const hoverLayers = WebLayer3D._hoverLayers;
        let hover = false;
        for (const layer of hoverLayers) {
            if (element.contains(layer.element)) {
                hover = true;
                break;
            }
        }
        if (hover && !element.classList.contains('hover'))
            element.classList.add('hover');
        if (!hover && element.classList.contains('hover'))
            element.classList.remove('hover');
        return true;
    };
    WebLayer3D._didInstallStyleSheet = false;
    function ensureElementIsInDocument(element, options) {
        const document = element.ownerDocument;
        if (document.contains(element)) {
            return element;
        }
        const container = document.createElement('div');
        container.setAttribute(WebLayer3D.LAYER_CONTAINER_ATTRIBUTE, '');
        container.style.position = 'fixed';
        container.style.width = options && 'windowWidth' in options ? options.windowWidth + 'px' : '550px';
        container.style.height =
            options && 'windowHeight' in options ? options.windowHeight + 'px' : '150px';
        // top -100000px allows html2canvas to render input boxes more accurately
        // on mobile safari than left -10000px
        // my guess is this has something to do with safari trying to move the viewport
        // when a text field is focussed
        container.style.top = '-100000px';
        container.appendChild(element);
        document.documentElement.appendChild(container);
        return element;
    }
    function arraySubtract(a, b) {
        const result = [];
        for (const item of a) {
            if (!b.includes(item))
                result.push(item);
        }
        return result;
    }
    class CameraFOVs {
        constructor() {
            this.top = 0;
            this.left = 0;
            this.bottom = 0;
            this.right = 0;
            this.horizontal = 0;
            this.vertical = 0;
        }
    }
    const _fovs = new CameraFOVs();
    const _getFovsMatrix = new THREE.Matrix4();
    const _getFovsVector = new THREE.Vector3();
    const FORWARD = new THREE.Vector3(0, 0, -1);
    function getFovs(projectionMatrix) {
        const out = _fovs;
        const invProjection = _getFovsMatrix.getInverse(projectionMatrix, true);
        const vec = _getFovsVector;
        out.left = vec
            .set(-1, 0, -1)
            .applyMatrix4(invProjection)
            .angleTo(FORWARD);
        out.right = vec
            .set(1, 0, -1)
            .applyMatrix4(invProjection)
            .angleTo(FORWARD);
        out.top = vec
            .set(0, 1, -1)
            .applyMatrix4(invProjection)
            .angleTo(FORWARD);
        out.bottom = vec
            .set(0, -1, -1)
            .applyMatrix4(invProjection)
            .angleTo(FORWARD);
        out.horizontal = out.right + out.left;
        out.vertical = out.top + out.bottom;
        return out;
    }

    return WebLayer3D;

})));
//# sourceMappingURL=three-web-layer.umd.js.map
