(function (Vue) {
    'use strict';

    Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

    /**
     * bind event
     * @param target window | HTMLElement
     * @param type event type
     * @param handler event handler
     * @param capture if capture phase
     */
    function on(target, type, handler, capture) {
        if (capture === void 0) { capture = false; }
        target.addEventListener(type, handler, capture);
    }
    /**
     * unbind event
     * @param target window | HTMLElement
     * @param type event type
     * @param handler event handler
     * @param capture if capture phase
     */
    function off(target, type, handler, capture) {
        if (capture === void 0) { capture = false; }
        target.removeEventListener(type, handler, capture);
    }
    /**
     * bind mouse or touch event according to current env
     * @param el  window | HTMLElement
     * @param onStart on start handler
     * @param onMove on move handler
     * @param onEnd on end handler
     * @param onCancel on cancel handler. useless in none-touch device.
     */
    function XTouch(el, onStart, onMove, onEnd, onCancel) {
        var isTouchDevice = 'ontouchstart' in window;
        if (isTouchDevice) {
            on(el, 'touchstart', onStart);
            on(window, 'touchmove', onMove);
            on(window, 'touchend', onEnd);
            on(el, 'touchcancel', onCancel);
        }
        else {
            var oldStart_1 = onStart, oldMove_1 = onMove, oldEnd_1 = onEnd;
            onStart = function (e) {
                // @ts-ignore
                e.identifier = 0;
                // @ts-ignore
                e.touches = e.changedTouches = [e];
                oldStart_1(e);
            };
            onMove = function (e) {
                // @ts-ignore
                e.identifier = 0;
                // @ts-ignore
                e.touches = e.changedTouches = [e];
                oldMove_1(e);
            };
            onEnd = function (e) {
                // @ts-ignore
                e.identifier = 0;
                // @ts-ignore
                e.touches = [];
                // @ts-ignore
                e.changedTouches = [e];
                oldEnd_1(e);
            };
            on(el, 'mousedown', onStart);
            on(window, 'mousemove', onMove);
            on(window, 'mouseup', onEnd);
        }
        return function unbind() {
            if (isTouchDevice) {
                off(el, 'touchstart', onStart);
                off(window, 'touchmove', onMove);
                off(window, 'touchend', onEnd);
                off(el, 'touchcancel', onCancel);
            }
            else {
                off(el, 'mousedown', onStart);
                off(window, 'mousemove', onMove);
                off(window, 'mouseup', onEnd);
            }
        };
    }

    /**
     * make a element draggable
     * @param el target html element
     * @param options options
     */
    function Draggable(el, options) {
        // matrix(1, 0, 0, 1, -60, -49)
        // matrix(3.5, 0, 0, 3.5, 0, 0)
        var unbind = XTouch(el, handleDown, handleMove, handleUp, handleUp);
        var oldParts = getTransform(el);
        var _a = options || {}, onMoving = _a.onMoving, onStart = _a.onStart, onEnd = _a.onEnd, maxX = _a.maxX, maxY = _a.maxY, minX = _a.minX, minY = _a.minY;
        var startX = 0, startY = 0;
        var beginX = 0, beginY = 0;
        var isTouchDown = false;
        function handleDown(e) {
            isTouchDown = true;
            beginX = startX = e.touches[0].pageX;
            beginY = startY = e.touches[0].pageY;
            onStart && onStart(e);
        }
        function handleMove(e) {
            if (isTouchDown) {
                var touch = e.touches[0];
                var parts = getTransform(el);
                var deltX = touch.pageX - startX;
                var deltY = touch.pageY - startY;
                var x = deltX + +parts[4];
                var y = deltY + +parts[5];
                startX = touch.pageX;
                startY = touch.pageY;
                // take transform: scale into consideration
                // TODO: does transformOrigin affect the result?
                if (parts[0] > 1) {
                    maxX *= +parts[0];
                    minX *= +parts[0];
                }
                if (parts[3] > 1) {
                    maxY *= +parts[3];
                    minY *= +parts[3];
                }
                if (x > maxX) {
                    x = maxX;
                }
                else if (x < minX) {
                    x = minX;
                }
                if (y > maxY) {
                    y = maxY;
                }
                else if (y < minY) {
                    y = minY;
                }
                if (onMoving && onMoving({
                    totalDeltX: touch.pageX - beginX,
                    totalDeltY: touch.pageY - beginY,
                    deltX: deltX,
                    deltY: deltY,
                    originalEvent: e
                }) === false) {
                    return;
                }
                parts[4] = x;
                parts[5] = y;
                el.style.transform = "matrix(" + parts.join(',') + ")";
            }
        }
        function handleUp(e) {
            isTouchDown = false;
            onEnd && onEnd(e);
        }
        function reset() {
            var parts = getTransform(el);
            parts[4] = oldParts[4];
            parts[5] = oldParts[5];
            el.style.transform = "matrix(" + parts.join(',') + ")";
        }
        return {
            reset: reset,
            destroy: unbind
        };
    }
    /**
     * get computed style of transform
     * @param el target html element
     */
    function getTransform(el) {
        var transform = window.getComputedStyle(el).transform;
        if (!transform || transform === 'none') {
            transform = 'matrix(1, 0, 0, 1, 0, 0)';
        }
        return transform.replace(/\(|\)|matrix|\s+/g, '').split(',');
    }

    //
    var script = {
      name: "video-control-bar",
      props: {
        video: {
          type: HTMLVideoElement,
          required: true
        }
      },
      data() {
        return {
          paused: true,
          currentTime: "00:00",
          totalTime: "00:00",
          progress: 0,
          dragged: false
        };
      },
      methods: {
        handleJumpProgress,
        handleDragProgress,
        handleDurationChange,
        handleTimeUpdate,
        handleClickPlayControl
      },
      mounted() {
        this.draggable = Draggable(this.$refs.progress, {
          onStart: () => {
            this.dragged = false;
          },
          onMoving: this.handleDragProgress
        });
        this.video.addEventListener("durationchange", this.handleDurationChange);
        this.video.addEventListener("timeupdate", this.handleTimeUpdate);
        this.video.addEventListener("play", e => (this.paused = false));
        this.video.addEventListener("pause", e => (this.paused = true));
      },
      destroyed() {
        this.draggable.destroy();
      }
    };

    function handleClickPlayControl(e) {
      if (this.paused) {
        this.video.play();
      } else {
        this.video.pause();
      }
    }

    function handleTimeUpdate(e) {
      this.currentTime = formatTime(e.target.currentTime);
      this.progress = e.target.currentTime / e.target.duration;
    }

    function handleDurationChange(e) {
      this.totalTime = formatTime(e.target.duration);
    }

    function handleDragProgress(e) {
      const { progress } = this.$refs;
      let w = this.progress + e.deltX / progress.offsetWidth;
      if (w > 1) {
        w = 1;
      } else if (w < 0) {
        w = 0;
      }
      this.progress = w;
      this.video.currentTime = this.progress * this.video.duration;
      this.dragged = true;
      return false;
    }

    function handleJumpProgress(e) {
      if (this.dragged) return;
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      this.progress = clickX / rect.width;
      this.video.currentTime = this.progress * this.video.duration;
    }

    function formatTime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.ceil(seconds % 60);
      return formatNumber(m) + ":" + formatNumber(s);
    }

    function formatNumber(num) {
      return num < 10 ? "0" + num : num;
    }

    function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
        if (typeof shadowMode !== 'boolean') {
            createInjectorSSR = createInjector;
            createInjector = shadowMode;
            shadowMode = false;
        }
        // Vue.extend constructor export interop.
        const options = typeof script === 'function' ? script.options : script;
        // render functions
        if (template && template.render) {
            options.render = template.render;
            options.staticRenderFns = template.staticRenderFns;
            options._compiled = true;
            // functional template
            if (isFunctionalTemplate) {
                options.functional = true;
            }
        }
        // scopedId
        if (scopeId) {
            options._scopeId = scopeId;
        }
        let hook;
        if (moduleIdentifier) {
            // server build
            hook = function (context) {
                // 2.3 injection
                context =
                    context || // cached call
                        (this.$vnode && this.$vnode.ssrContext) || // stateful
                        (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
                // 2.2 with runInNewContext: true
                if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                    context = __VUE_SSR_CONTEXT__;
                }
                // inject component styles
                if (style) {
                    style.call(this, createInjectorSSR(context));
                }
                // register component module identifier for async chunk inference
                if (context && context._registeredComponents) {
                    context._registeredComponents.add(moduleIdentifier);
                }
            };
            // used by ssr in case component is cached and beforeCreate
            // never gets called
            options._ssrRegister = hook;
        }
        else if (style) {
            hook = shadowMode
                ? function (context) {
                    style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
                }
                : function (context) {
                    style.call(this, createInjector(context));
                };
        }
        if (hook) {
            if (options.functional) {
                // register for functional component in vue file
                const originalRender = options.render;
                options.render = function renderWithStyleInjection(h, context) {
                    hook.call(context);
                    return originalRender(h, context);
                };
            }
            else {
                // inject component registration as beforeCreate hook
                const existing = options.beforeCreate;
                options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
            }
        }
        return script;
    }

    const isOldIE = typeof navigator !== 'undefined' &&
        /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
    function createInjector(context) {
        return (id, style) => addStyle(id, style);
    }
    let HEAD;
    const styles = {};
    function addStyle(id, css) {
        const group = isOldIE ? css.media || 'default' : id;
        const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
        if (!style.ids.has(id)) {
            style.ids.add(id);
            let code = css.source;
            if (css.map) {
                // https://developer.chrome.com/devtools/docs/javascript-debugging
                // this makes source maps inside style tags work properly in Chrome
                code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
                // http://stackoverflow.com/a/26603875
                code +=
                    '\n/*# sourceMappingURL=data:application/json;base64,' +
                        btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                        ' */';
            }
            if (!style.element) {
                style.element = document.createElement('style');
                style.element.type = 'text/css';
                if (css.media)
                    style.element.setAttribute('media', css.media);
                if (HEAD === undefined) {
                    HEAD = document.head || document.getElementsByTagName('head')[0];
                }
                HEAD.appendChild(style.element);
            }
            if ('styleSheet' in style.element) {
                style.styles.push(code);
                style.element.styleSheet.cssText = style.styles
                    .filter(Boolean)
                    .join('\n');
            }
            else {
                const index = style.ids.size - 1;
                const textNode = document.createTextNode(code);
                const nodes = style.element.childNodes;
                if (nodes[index])
                    style.element.removeChild(nodes[index]);
                if (nodes.length)
                    style.element.insertBefore(textNode, nodes[index]);
                else
                    style.element.appendChild(textNode);
            }
        }
    }

    /* script */
    const __vue_script__ = script;

    /* template */
    var __vue_render__ = function() {
      var _vm = this;
      var _h = _vm.$createElement;
      var _c = _vm._self._c || _h;
      return _c("div", { staticClass: "video-control-bar" }, [
        _c("div", {
          class: { "play-control": true, playing: _vm.paused, paused: !_vm.paused },
          on: { click: _vm.handleClickPlayControl }
        }),
        _vm._v(" "),
        _c("div", { ref: "current", staticClass: "current-time" }, [
          _vm._v(_vm._s(_vm.currentTime))
        ]),
        _vm._v(" "),
        _c(
          "div",
          {
            ref: "progress",
            staticClass: "progress",
            on: { click: _vm.handleJumpProgress }
          },
          [_c("i", { style: { width: _vm.progress * 100 + "%" } })]
        ),
        _vm._v(" "),
        _c("div", { staticClass: "duration-time" }, [_vm._v(_vm._s(_vm.totalTime))])
      ])
    };
    var __vue_staticRenderFns__ = [];
    __vue_render__._withStripped = true;

      /* style */
      const __vue_inject_styles__ = function (inject) {
        if (!inject) return
        inject("data-v-b2902f74_0", { source: ".video-control-bar,\n.video-control-bar * {\n  box-sizing: border-box;\n}\n.video-control-bar {\n  position: absolute;\n  display: flex;\n  height: 40px;\n  left: 20px;\n  right: 20px;\n  bottom: 20px;\n  background: rgba(0, 0, 0, 0.5);\n  border-radius: 2px;\n  color: #fff;\n  align-items: center;\n  text-align: center;\n  font-size: 14px;\n  line-height: 18px;\n}\n.video-control-bar .play-control {\n  width: 40px;\n  padding-top: 1px;\n}\n.video-control-bar .playing::after {\n  content: \"\";\n  display: inline-block;\n  border-top: 8px solid transparent;\n  border-left: 12px solid #fff;\n  border-bottom: 8px solid transparent;\n  vertical-align: top;\n}\n.video-control-bar .paused::after {\n  content: \"\";\n  display: inline-block;\n  width: 8px;\n  height: 15px;\n  border-left: 2px solid #fff;\n  border-right: 2px solid #fff;\n}\n.video-control-bar .progress {\n  position: relative;\n  flex: 1;\n  height: 100%;\n}\n.video-control-bar .progress::before,\n.video-control-bar .progress i {\n  content: \"\";\n  position: absolute;\n  width: 100%;\n  height: 2px;\n  left: 0;\n  top: 50%;\n  margin-top: -1px;\n  background: #818a95;\n  border-radius: 2px;\n}\n.video-control-bar .progress i {\n  background-color: #fff;\n  width: 0;\n  z-index: 2;\n}\n.video-control-bar .progress i::after {\n  content: \"\";\n  position: absolute;\n  top: -4px;\n  right: -10px;\n  width: 10px;\n  height: 10px;\n  border-radius: 100%;\n  background-color: #fff;\n}\n.video-control-bar .current-time {\n  width: 50px;\n  text-align: left;\n}\n.video-control-bar .duration-time {\n  width: 60px;\n}\n", map: {"version":3,"sources":["index.vue"],"names":[],"mappings":"AAAA;;EAEE,sBAAsB;AACxB;AACA;EACE,kBAAkB;EAClB,aAAa;EACb,YAAY;EACZ,UAAU;EACV,WAAW;EACX,YAAY;EACZ,8BAA8B;EAC9B,kBAAkB;EAClB,WAAW;EACX,mBAAmB;EACnB,kBAAkB;EAClB,eAAe;EACf,iBAAiB;AACnB;AACA;EACE,WAAW;EACX,gBAAgB;AAClB;AACA;EACE,WAAW;EACX,qBAAqB;EACrB,iCAAiC;EACjC,4BAA4B;EAC5B,oCAAoC;EACpC,mBAAmB;AACrB;AACA;EACE,WAAW;EACX,qBAAqB;EACrB,UAAU;EACV,YAAY;EACZ,2BAA2B;EAC3B,4BAA4B;AAC9B;AACA;EACE,kBAAkB;EAClB,OAAO;EACP,YAAY;AACd;AACA;;EAEE,WAAW;EACX,kBAAkB;EAClB,WAAW;EACX,WAAW;EACX,OAAO;EACP,QAAQ;EACR,gBAAgB;EAChB,mBAAmB;EACnB,kBAAkB;AACpB;AACA;EACE,sBAAsB;EACtB,QAAQ;EACR,UAAU;AACZ;AACA;EACE,WAAW;EACX,kBAAkB;EAClB,SAAS;EACT,YAAY;EACZ,WAAW;EACX,YAAY;EACZ,mBAAmB;EACnB,sBAAsB;AACxB;AACA;EACE,WAAW;EACX,gBAAgB;AAClB;AACA;EACE,WAAW;AACb","file":"index.vue","sourcesContent":[".video-control-bar,\n.video-control-bar * {\n  box-sizing: border-box;\n}\n.video-control-bar {\n  position: absolute;\n  display: flex;\n  height: 40px;\n  left: 20px;\n  right: 20px;\n  bottom: 20px;\n  background: rgba(0, 0, 0, 0.5);\n  border-radius: 2px;\n  color: #fff;\n  align-items: center;\n  text-align: center;\n  font-size: 14px;\n  line-height: 18px;\n}\n.video-control-bar .play-control {\n  width: 40px;\n  padding-top: 1px;\n}\n.video-control-bar .playing::after {\n  content: \"\";\n  display: inline-block;\n  border-top: 8px solid transparent;\n  border-left: 12px solid #fff;\n  border-bottom: 8px solid transparent;\n  vertical-align: top;\n}\n.video-control-bar .paused::after {\n  content: \"\";\n  display: inline-block;\n  width: 8px;\n  height: 15px;\n  border-left: 2px solid #fff;\n  border-right: 2px solid #fff;\n}\n.video-control-bar .progress {\n  position: relative;\n  flex: 1;\n  height: 100%;\n}\n.video-control-bar .progress::before,\n.video-control-bar .progress i {\n  content: \"\";\n  position: absolute;\n  width: 100%;\n  height: 2px;\n  left: 0;\n  top: 50%;\n  margin-top: -1px;\n  background: #818a95;\n  border-radius: 2px;\n}\n.video-control-bar .progress i {\n  background-color: #fff;\n  width: 0;\n  z-index: 2;\n}\n.video-control-bar .progress i::after {\n  content: \"\";\n  position: absolute;\n  top: -4px;\n  right: -10px;\n  width: 10px;\n  height: 10px;\n  border-radius: 100%;\n  background-color: #fff;\n}\n.video-control-bar .current-time {\n  width: 50px;\n  text-align: left;\n}\n.video-control-bar .duration-time {\n  width: 60px;\n}\n"]}, media: undefined });

      };
      /* scoped */
      const __vue_scope_id__ = undefined;
      /* module identifier */
      const __vue_module_identifier__ = undefined;
      /* functional template */
      const __vue_is_functional_template__ = false;
      /* style inject SSR */
      
      /* style inject shadow dom */
      

      
      const __vue_component__ = normalizeComponent(
        { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
        __vue_inject_styles__,
        __vue_script__,
        __vue_scope_id__,
        __vue_is_functional_template__,
        __vue_module_identifier__,
        false,
        createInjector,
        undefined,
        undefined
      );

    Vue.component('video-control-bar', __vue_component__);

}(Vue));
