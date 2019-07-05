/*
    animation javascript 动画引擎
 */

//初始化动画播放器
var requestAnimationFrame,
    cancelAnimationFrame,
    prefix = ["ms", "moz", "webkit", "o"],
    animationEaseStyle,
    bezierStyleMapper,
    i;
    
requestAnimationFrame = window.requestAnimationFrame;
cancelAnimationFrame = window.cancelAnimationFrame;
if(!requestAnimationFrame) {
    for (i = 0; i < prefix.length && !requestAnimationFrame; i++) {
        requestAnimationFrame = window[prefix[i] + "RequestAnimationFrame"];
        cancelAnimationFrame = window[prefix[i] + "CancelAnimationFrame"] || window[prefix[i] + "CancelRequestAnimationFrame"];
    }
}
if (!requestAnimationFrame) {
    requestAnimationFrame = function (callback, fps) {
        fps = fps || 60;
        setTimeout(callback, 1000 / fps);
    };
}
if (!cancelAnimationFrame) {
    cancelAnimationFrame = function (handle) {
        clearTimeout(handle);
    };
}

function noop() { }

bezierStyleMapper = {
    "ease": getBezierFn(.25, .1, .25, 1),
    "linear": getBezierFn(0, 0, 1, 1),
    "ease-in": getBezierFn(.42, 0, 1, 1),
    "ease-out": getBezierFn(0, 0, .58, 1),
    "ease-in-out": getBezierFn(.42, 0, .58, 1)
};

// https://blog.csdn.net/backspace110/article/details/72747886
// bezier缓动函数
function getBezierFn() {
    var points, 
        numbers, 
        i, j, len, n;

    len = arguments.length;
    if(len % 2) {
        throw new TypeError("arguments length error");
    }

    //起点
    points = [{ x: 0,  y: 0 }];
    for(i = 0; i < len; i += 2) {
        points.push({
            x: parseFloat(arguments[i]),
            y: parseFloat(arguments[i + 1])
        });
    }
    //终点
    points.push({ x: 1, y: 1 });

    numbers = [];
    n = points.length - 1;
    for (i = 1; i <= n; i++) {  
        numbers[i] = 1;  
        for (j = i - 1; j >= 1; j--) {
            numbers[j] += numbers[j - 1];  
        }
        numbers[0] = 1;  
    }

    return function(t) {
        var i, p, num, value;
        if(t < 0) {
            t = 0;
        }
        if(t > 1) {
            t = 1;
        }
        value = {
            x: 0,
            y: 0
        };
        for(i = 0; i <= n; i++) {
            p = points[i];
            num = numbers[i];
            value.x += num * p.x * Math.pow(1 - t, n - i) * Math.pow(t, i);
            value.y += num * p.y * Math.pow(1 - t, n - i) * Math.pow(t, i);
        }
        return value.y;
    };
}

//动画效果
animationEaseStyle = {
    easeInQuad: function (pos) {
        return Math.pow(pos, 2);
    },
    easeOutQuad: function (pos) {
        return -(Math.pow((pos - 1), 2) - 1);
    },
    easeInOutQuad: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 2);
        return -0.5 * ((pos -= 2) * pos - 2);
    },
    easeInCubic: function (pos) {
        return Math.pow(pos, 3);
    },
    easeOutCubic: function (pos) {
        return (Math.pow((pos - 1), 3) + 1);
    },
    easeInOutCubic: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 3);
        return 0.5 * (Math.pow((pos - 2), 3) + 2);
    },
    easeInQuart: function (pos) {
        return Math.pow(pos, 4);
    },
    easeOutQuart: function (pos) {
        return -(Math.pow((pos - 1), 4) - 1);
    },
    easeInOutQuart: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 4);
        return -0.5 * ((pos -= 2) * Math.pow(pos, 3) - 2);
    },
    easeInQuint: function (pos) {
        return Math.pow(pos, 5);
    },
    easeOutQuint: function (pos) {
        return (Math.pow((pos - 1), 5) + 1);
    },
    easeInOutQuint: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 5);
        return 0.5 * (Math.pow((pos - 2), 5) + 2);
    },
    easeInSine: function (pos) {
        return -Math.cos(pos * (Math.PI / 2)) + 1;
    },
    easeOutSine: function (pos) {
        return Math.sin(pos * (Math.PI / 2));
    },
    easeInOutSine: function (pos) {
        return (-.5 * (Math.cos(Math.PI * pos) - 1));
    },
    easeInExpo: function (pos) {
        return (pos === 0) ? 0 : Math.pow(2, 10 * (pos - 1));
    },
    easeOutExpo: function (pos) {
        return (pos === 1) ? 1 : -Math.pow(2, -10 * pos) + 1;
    },
    easeInOutExpo: function (pos) {
        if (pos === 0) return 0;
        if (pos === 1) return 1;
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(2, 10 * (pos - 1));
        return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
    },
    easeInCirc: function (pos) {
        return -(Math.sqrt(1 - (pos * pos)) - 1);
    },
    easeOutCirc: function (pos) {
        return Math.sqrt(1 - Math.pow((pos - 1), 2));
    },
    easeInOutCirc: function (pos) {
        if ((pos /= 0.5) < 1) return -0.5 * (Math.sqrt(1 - pos * pos) - 1);
        return 0.5 * (Math.sqrt(1 - (pos -= 2) * pos) + 1);
    },
    easeOutBounce: function (pos) {
        if ((pos) < (1 / 2.75)) {
            return (7.5625 * pos * pos);
        } else if (pos < (2 / 2.75)) {
            return (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
        } else if (pos < (2.5 / 2.75)) {
            return (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
        } else {
            return (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
        }
    },
    easeInBack: function (pos) {
        var s = 1.70158;
        return (pos) * pos * ((s + 1) * pos - s);
    },
    easeOutBack: function (pos) {
        var s = 1.70158;
        return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
    },
    easeInOutBack: function (pos) {
        var s = 1.70158;
        if ((pos /= 0.5) < 1) return 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s));
        return 0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
    },
    elastic: function (pos) {
        return -1 * Math.pow(4, -8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1;
    },
    swingFromTo: function (pos) {
        var s = 1.70158;
        return ((pos /= 0.5) < 1) ? 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s)) :
            0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
    },
    swingFrom: function (pos) {
        var s = 1.70158;
        return pos * pos * ((s + 1) * pos - s);
    },
    swingTo: function (pos) {
        var s = 1.70158;
        return (pos -= 1) * pos * ((s + 1) * pos + s) + 1;
    },
    swing: function (pos) {
        return 0.5 - Math.cos(pos * Math.PI) / 2;
    },
    bounce: function (pos) {
        if (pos < (1 / 2.75)) {
            return (7.5625 * pos * pos);
        } else if (pos < (2 / 2.75)) {
            return (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
        } else if (pos < (2.5 / 2.75)) {
            return (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
        } else {
            return (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
        }
    },
    bouncePast: function (pos) {
        if (pos < (1 / 2.75)) {
            return (7.5625 * pos * pos);
        } else if (pos < (2 / 2.75)) {
            return 2 - (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
        } else if (pos < (2.5 / 2.75)) {
            return 2 - (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
        } else {
            return 2 - (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
        }
    },
    easeFromTo: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 4);
        return -0.5 * ((pos -= 2) * Math.pow(pos, 3) - 2);
    },
    easeFrom: function (pos) {
        return Math.pow(pos, 4);
    },
    easeTo: function (pos) {
        return Math.pow(pos, 0.25);
    },
    linear: function (pos) {
        return pos;
    },
    sinusoidal: function (pos) {
        return (-Math.cos(pos * Math.PI) / 2) + 0.5;
    },
    reverse: function (pos) {
        return 1 - pos;
    },
    mirror: function (pos, transition) {
        transition = transition || ui.AnimationStyle.sinusoidal;
        if (pos < 0.5)
            return transition(pos * 2);
        else
            return transition(1 - (pos - 0.5) * 2);
    },
    flicker: function (pos) {
        pos = pos + (Math.random() - 0.5) / 5;
        return ui.AnimationStyle.sinusoidal(pos < 0 ? 0 : pos > 1 ? 1 : pos);
    },
    wobble: function (pos) {
        return (-Math.cos(pos * Math.PI * (9 * pos)) / 2) + 0.5;
    },
    pulse: function (pos, pulses) {
        return (-Math.cos((pos * ((pulses || 5) - .5) * 2) * Math.PI) / 2) + .5;
    },
    blink: function (pos, blinks) {
        return Math.round(pos * (blinks || 5)) % 2;
    },
    spring: function (pos) {
        return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
    },
    none: function (pos) {
        return 0;
    },
    full: function (pos) {
        return 1;
    }
};

//动画执行器
function Animator () {
    //动画持续时间
    this.duration = 500;
    //动画的帧，一秒执行多少次
    this.fps = 60;
    //开始回调
    this.onBegin = false;
    //结束回调
    this.onEnd = false;
    //动画是否循环
    this.loop = false;
    //动画是否开始
    this.isStarted = false;
}
Animator.prototype = new ui.ArrayLike();
Animator.prototype.add = function (target, option) {
    if (arguments.length === 1) {
        option = target;
        target = option.target;
    }
    if (option) {
        option.target = target;
        this.push(option);
    }
    return this;
};
Animator.prototype.remove = function (option) {
    var index = -1,
        i;
    if (ui.core.type(option) !== "number") {
        for (i = this.length - 1; i >= 0; i--) {
            if (this[i] === option) {
                index = i;
                break;
            }
        }
    } else {
        index = option;
    }
    if (index < 0 || index >= this.length) {
        return;
    }
    this.splice(index, 1);
};
Animator.prototype.get = function(name) {
    var i, option;
    for(i = this.length - 1; i >= 0; i--) {
        option = this[i];
        if(option.name === name) {
            return option;
        }
    }
    return null;
};
Animator.prototype.doAnimation = function () {
    var fps,
        startTime,
        onEndFn,
        i, len,
        that;

    if (this.length === 0) {
        return;
    }

    fps = parseInt(this.fps, 10) || 60;
    len = this.length;
    onEndFn = this.onEnd;
    
    this.isStarted = true;
    that = this;
    //开始执行的时间
    startTime = new Date().getTime();
    
    (function() {
        var fn;
        fn = function() {
            var newTime,
                timestamp,
                option,
                duration,
                delta;
    
            //当前帧开始的时间
            newTime = new Date().getTime();
            //逝去时间
            timestamp = newTime - startTime;
    
            for (i = 0; i < len; i++) {
                option = that[i];
                duration = option.duration || that.duration;
                if (option.disabled || timestamp < option.delay) {
                    continue;
                }
                try {
                    if(duration + option.delay <= timestamp) {
                        delta = 1;
                        option.disabled = true;
                    } else {
                        delta = option.ease((timestamp - option.delay) / duration);
                    }
                    option.current = Math.ceil(option.begin + delta * option.change);
                    option.onChange(option.current, option.target, that);
                } catch(e) {
                    that.promise._reject(e);
                }
            }
            if (that.duration <= timestamp) {
                that.isStarted = false;
                that.stopHandle = null;
                onEndFn.call(that);
            } else {
                that.stopHandle = requestAnimationFrame(fn);
            }
        };
        that.stopHandle = requestAnimationFrame(fn, 1000 / fps);
    })();
};
Animator.prototype._prepare = function () {
    var i, len,
        option,
        durationValue,
        disabledCount = 0;
    for (i = 0, len = this.length; i < len; i++) {
        option = this[i];
        if (!option) {
            this.splice(i, 1);
            i--;
        }

        // 动画节点是否被禁用
        option.disabled = false;
        //开始位置
        option.begin = option.begin || 0;
        //结束位置
        option.end = option.end || 0;
        //变化量
        option.change = option.end - option.begin;
        //当前值
        option.current = option.begin;

        if (option.disabled || option.change === 0) {
            option.disabled = true;
            disabledCount++;
            continue;
        }
        //必须指定，基本上对top,left,width,height这个属性进行设置
        option.onChange = option.onChange || noop;
        //要使用的缓动公式
        option.ease = 
            (ui.core.isString(option.ease) ? bezierStyleMapper[option.ease] : option.ease) || animationEaseStyle.easeFromTo;
        //动画持续时间
        option.duration = option.duration || 0;
        //延迟时间
        option.delay = option.delay || 0;

        // 更新动画执行时间
        durationValue = option.duration + option.delay;
        if(durationValue > this.duration) {
            this.duration = durationValue;
        }
    }
    return this.length == disabledCount;
};
Animator.prototype.start = function (duration) {
    var _resolve, _reject,
        promise,
        flag, fn,
        that;

    this.onBegin = ui.core.isFunction(this.onBegin) ? this.onBegin : noop;
    this.onEnd = ui.core.isFunction(this.onEnd) ? this.onEnd : noop;
    
    promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _reject = reject;
    });
    promise._resolve = _resolve;
    promise._reject = _reject;
    this.promise = promise;

    if (!this.isStarted) {
        if(ui.core.isNumber(duration) && duration > 0) {
            this.duration = duration;
        }
        this.duration = parseInt(this.duration, 10) || 500;

        flag = this._prepare();
        this.onBegin.call(this);

        that = this;
        if (flag) {
            ui.setTask(function() {
                that.onEnd.call(that);
                _resolve.call(null, that);
            });
        } else {
            fn = this.onEnd;
            this.onEnd = function () {
                this.onEnd = fn;
                fn.call(this);
                _resolve.call(null, this);
            };
            this.doAnimation();
        }
    }
    return promise;
};
Animator.prototype.stop = function () {
    var promise;
    cancelAnimationFrame(this.stopHandle);
    this.isStarted = false;
    this.stopHandle = null;
    
    promise = this.promise;
    if(promise) {
        this.promise = null;
        promise.catch(noop);
        promise._reject.call(null, "stop");
    }
};
Animator.prototype.back = function() {
    var i, len,
        option,
        temp;
    for(i = 0, len = this.length; i < len; i++) {
        option = this[i];
        temp = option.begin;
        option.begin = option.current || option.end;
        option.end = temp;
    }
    return this.start();
};

/**
 * 创建一个动画对象
 * @param {动画目标} target 
 * @param {动画参数} option 
 */
ui.animator = function (option) {
    var list = new Animator();
    list.add.apply(list, arguments);
    return list;
};

/** 动画缓函数 */
ui.AnimationStyle = animationEaseStyle;
/** 创建一个基于bezier的缓动函数 */
ui.transitionTiming = function() {
    var args,
        name;

    args = [].slice.call(arguments);
    name = args[0];
    if(!ui.core.isString(name)) {
        name = args.join(",");
    }
    if(bezierStyleMapper.hasOwnProperty(name)) {
        return bezierStyleMapper[name];
    }

    bezierStyleMapper[name] = getBezierFn.apply(this, args);
    return bezierStyleMapper[name];
};

/** 获取当前浏览器支持的动画函数 */
ui.getRequestAnimationFrame = function() {
    return requestAnimationFrame;
};
/** 获取当前浏览器支持的动画函数 */
ui.getCancelAnimationFrame = function() {
    return cancelAnimationFrame;
};

/** 淡入动画 */
ui.animator.fadeIn = function(target, duration) {
    var display,
        opacity,
        animator;

    if(!target) {
        return;
    }

    if(!duration || duration <= 0) {
        duration = 240;
    }

    display = target.css("dispaly");
    if(display === "block") {
        return;
    }

    opacity = parseFloat(target.css("opacity")) * 100;
    if(isNaN(opacity)) {
        opacity = 0;
        target.css("opacity", opacity);
    }
    
    target.css("display", "block");
    if(opacity >= 100) {
        return;
    }

    animator = ui.animator({
        target: target,
        begin: opacity,
        end: 100,
        ease: animationEaseStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("opacity", val / 100);
        }
    });
    animator.duration = duration;
    return animator.start();
};
/** 淡出动画 */
ui.animator.fadeOut = function(target) {
    var display,
        opacity,
        animator;

    if(!target) {
        return;
    }

    if(!duration || duration <= 0) {
        duration = 240;
    }

    display = target.css("dispaly");
    if(display === "none") {
        return;
    }

    opacity = parseFloat(target.css("opacity")) * 100;
    if(isNaN(opacity)) {
        opacity = 100;
        target.css("opacity", opacity);
    }
    if(opacity <= 0) {
        target.css("display", "none");
        return;
    }

    animator = ui.animator({
        target: target,
        begin: opacity,
        end: 0,
        ease: animationEaseStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("opacity", val / 100);
        }
    });
    animator.onEnd = function() {
        target.css("display", "none");
    };
    animator.duration = duration;
    return animator.start();
};
