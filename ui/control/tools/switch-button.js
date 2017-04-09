/* 开关按钮 */
ui.define("ui.ctrls.SwitchButton", {
    _getOption: function() {
        return {
            readonly: false,
            style: null
        };
    },
    _getEvents: function() {
        return ["changed"];
    },
    _create: function() {
        this.switchBox = $("<label class='switch-button' />");
        this.inner = $("<div class='switch-inner theme-border-color' />");
        this.thumb = $("<div class='switch-thumb' />");
        
        if(this.option.style === "lollipop") {
            this.switchBox.addClass("switch-lollipop");
            this._open = this._lollipopOpen;
            this._close = this._lollipopClose;
        } else if(this.option.style === "marshmallow") {
            this.switchBox.addClass("switch-marshmallow");
            this._open = this._lollipopOpen;
            this._close = this._lollipopClose;
        }

        this._createAnimator();
        
        this.element.wrap(this.switchBox);
        this.switchBox = this.element.parent();
        this.switchBox
            .append(this.inner)
            .append(this.thumb);
            
        this.width = this.switchBox.width();
        this.height = this.switchBox.height();
        
        var that = this;
        this.element.change(function(e) {
            that.onChange();
        });
        
        this.readonly(this.option.readonly);
        this.thumbColor = this.thumb.css("background-color");
        if(this.checked()) {
            this._open();
        }
    },
    _createAnimator: function() {
        this.animator = ui.animator({
            target: this.thumb,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("background-color", 
                    ui.theme.overlay(this.beginColor, this.endColor, val / 100));
            }
        }).addTarget({
            target: this.thumb,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val, elem) {
                elem.css("left", val + "px");
            }
        });
        this.animator.duration = 200;
    },
    onChange: function() {
        var checked = this.element.prop("checked");
        if(this.readonly()) {
            this.element.prop("checked", !checked);
            return;
        }
        if(checked) {
            this._open();
        } else {
            this._close();
        }
        this.fire("changed");
    },
    _open: function() {
        this.animator.stop();
        this.switchBox.addClass("switch-open");
        this.inner
            .addClass("border-highlight")
            .addClass("background-highlight");
        var option = this.animator[0];
        option.beginColor = this.thumbColor;
        option.endColor = "#FFFFFF";
        option.begin = 0;
        option.end = 100;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"), 10);
        option.end = this.width - this.thumb.width() - 3;
        this.animator.start();
    },
    _close: function() {
        this.animator.stop();
        this.switchBox.removeClass("switch-open");
        this.inner
            .removeClass("border-highlight")
            .removeClass("background-highlight");
        var option = this.animator[0];
        option.beginColor = "#FFFFFF";
        option.endColor = this.thumbColor;
        option.begin = 0;
        option.end = 100;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"), 10);
        option.end = 3;
        
        this.animator.start();     
    },
    _lollipopOpen: function() {
        this.animator.stop();
        this.switchBox.addClass("switch-open");
        this.inner.addClass("background-highlight");
        this.thumb
            .addClass("border-highlight")
            .addClass("background-highlight");
        var option = this.animator[0];
        option.begin = 0;
        option.end = 0;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"), 10);
        option.end = this.width - this.thumb.outerWidth();
        this.animator.start();
    },
    _lollipopClose: function() {
        this.animator.stop();
        this.switchBox.removeClass("switch-open");
        this.inner.removeClass("background-highlight");
        this.thumb
            .removeClass("border-highlight")
            .removeClass("background-highlight");
        var option = this.animator[0];
        option.begin = 0;
        option.end = 0;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"), 10);
        option.end = 0;
        
        this.animator.start();
    },
    isOpen: function() {
        return this.switchBox.hasClass("switch-open");  
    },
    readonly: function() {
        if(arguments.length == 0) {
            return this.option.readonly;
        } else {
            this.option.readonly = !!arguments[0];
            if(this.option.readonly) {
                this.element.attr("readonly", "readonly");
            } else {
                this.element.removeAttr("readonly");
            }
        }
    },
    val: function() {
        if(arguments.length == 0) {
            return this.element.val();
        } else {
            this.element.val(arguments[0]);
        }
    },
    checked: function() {
        var checked;
        if(arguments.length == 0) {
            return this.element.prop("checked");
        } else {
            arguments[0] = !!arguments[0];
            checked = this.element.prop("checked");
            if(arguments[0] !== checked) {
                this.element.prop("checked", arguments[0]);
                this.onChange();
            } else {
                //修正checkbox和当前样式不一致的状态，可能是手动给checkbox赋值或者是reset导致
                if(checked && !this.isOpen()) {
                    this._open();
                } else if(!checked && this.isOpen()) {
                    this._close();
                }
            }
        }
    }
});
$.fn.switchButton = function(option) {
    if (!this || this.length == 0) {
        return null;
    }
    if(this.nodeName() !== "INPUT" && this.prop("type") !== "checkbox") {
        throw new Error("switch button must be checkbox");
    }
    return ui.ctrls.SwitchButton(option, this);
};