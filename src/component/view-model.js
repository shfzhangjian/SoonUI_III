// ViewModel 模型

var arrayObserverPrototype = [],
    overrideMethods = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"],
    hasProto = '__proto__' in {},
    updatePrototype,
    binderQueue,
    binderId = 0;

// 劫持修改数组的API方法
overrideMethods.forEach(function(methodName) {
    var originalMethod = arrayObserverPrototype[methodName];

    arrayObserverPrototype[methodName] = function() {
        var result,
            insertedItems,
            args = arrayObserverPrototype.slice.call(arguments, 0),
            notice;

        result = originalMethod.apply(this, args);

        switch(methodName) {
            case "push":
            case "unshift":
                insertedItems = args;
                break;
            case "splice":
                insertedItems = args.slice(2);
                break;
        }

        notice = this.__notice__;
        if(insertedItems) {
            notice.arrayNotify(insertedItems);
        }
        notice.dependency.notify();
        return result;
    };
});

if(hasProto) {
    updatePrototype = function(target, prototype, keys) {
        target.__proto__ = prototype;
    };
} else {
    updatePrototype = function(target, prototype, keys) {
        var i, len, key;
        for(i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            target[key] = prototype[key];
        }
    };
}

// 数据绑定执行队列
binderQueue = {
    queue: [],
    queueElementMap: {},
    // 是否正在执行队列中
    isRunning: false,
    // 是否已经注册了nextTick Task
    isWaiting: false,
    // 当前执行的队列索引
    runIndex: 0,

    enqueue: function(binder) {
        var id = binder.id,
            index;
        if(this.queueElementMap[id]) {
            return;
        }

        this.queueElementMap[id] = true;
        if(this.isRunning) {
            // 从后往前插入队列
            index = this.queue.length - 1;
            while(index > this.runIndex && this.queue[index].id > binder.id) {
                index--;
            }
            this.queue.splice(index + 1, 0, binder);
        } else {
            this.queue.push(binder);
        }

        if(!this.isWaiting) {
            this.isWaiting = true;
            ui.setTask((function () {
                this.run();
            }).bind(this));
        }
    },
    run: function() {
        var i,
            binder;
        this.isRunning = true;

        // 排序，让视图更新按照声明的顺序执行
        this.queue.sort(function(a, b) {
            return a.id - b.id;
        });

        // 这里的queue.length可能发生变化，不能缓存
        for(i = 0; i < this.queue.length; i++) {
            this.runIndex = i;
            binder = this.queue[i];
            this.queueElementMap[binder.id] = null;
            binder.execute();
        }

        // 重置队列
        this.reset();
    },
    reset: function() {
        this.runIndex = 0;
        this.queue.length = 0;
        this.queueElementMap = {};
        this.isRunning = this.isWaiting = false;
    }
};

function noop() {}

function defineNotifyProperty(obj, propertyName, val, shallow, path) {
    var descriptor,
        getter,
        setter,
        notice,
        childNotice;

    descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
    if (descriptor && descriptor.configurable === false) {
        return;
    }

    getter = descriptor.get;
    setter = descriptor.set;

    // 如果深度引用，则将子属性也转换为通知对象
    if(!shallow  && (ui.core.isObject(val) || Array.isArray(val))) {
        childNotice = new NotifyObject(val);
    }

    notice = obj.__notice__;
    Object.defineProperty(obj, propertyName, {
        enumerable: true,
        configurable: true,
        get: function () {
            return getter ? getter.call(obj) : val;
        },
        set: function(newVal) {
            var oldVal = getter ? getter.call(obj) : val,
                newChildNotice;
            if(oldVal === newVal || (newVal !== newVal && val !== val)) {
                return;
            }

            if(setter) {
                setter.call(obj, newVal);
            } else {
                val = newVal;
            }

            if(!shallow  && (ui.core.isObject(newVal) || Array.isArray(newVal))) {
                newChildNotice = new NotifyObject(newVal);
                newChildNotice.dependency.depMap = childNotice.dependency.depMap;
                // 更新通知对象
                childNotice = newChildNotice;
            }
            notice.dependency.notify(propertyName);
        }
    });
}

function createNotifyObject(obj) {
    var isObject,
        isArray,
        notice;

    isObject = ui.core.isObject(obj);
    isArray = Array.isArray(obj);

    if(!isObject && !isArray) {
        return obj;
    }
    if(isObject && ui.core.isEmptyObject(obj)) {
        return obj;
    }

    if(obj.hasOwnProperty("__notice__") && obj.__notice__ instanceof NotifyObject) {
        notice = obj.__notice__;
        // TODO notice.count++;
    } else if((isArray || isObject) && Object.isExtensible(obj)) {
        notice = new NotifyObject(obj);
    }
    // 添加一个手动刷新方法
    obj.refresh = refresh;

    return obj;
}

function refresh() {
    notifyAll(this);
}

function notifyAll(viewModel) {
    var keys = Object.keys(viewModel),
        i, len,
        propertyName,
        value,
        notice,
        notifyProperties = [];

    for(i = 0, len = keys.length; i < len; i++) {
        propertyName = keys[i];
        value = viewModel[propertyName];
        if((ui.core.isObject(value) || Array.isArray(value)) && 
                value.__notice__ instanceof NotifyObject) {
            notifyAll(value);
        } else {
            notifyProperties.push(propertyName);
        }
    }

    notice = viewModel.__notice__;
    notice.dependency.notify.apply(notice.dependency, notifyProperties);
}

function NotifyObject(value) {
    this.value = value;
    this.dependency = new Dependency();
    Object.defineProperty(value, "__notice__", {
        value: this,
        enumerable: false,
        writable: true,
        configurable: true
    });
    if(Array.isArray(value)) {
        updatePrototype(value, arrayObserverPrototype, overrideMethods);
        this.arrayNotify(value);
    } else {
        this.objectNotify(value);
    }
}
NotifyObject.prototype = {
    constructor: NotifyObject,
    arrayNotify: function(array) {
        var i, len;
        for(i = 0, len = array.length; i < len; i++) {
            createNotifyObject(array[i]);
        }
    },
    objectNotify: function(obj) {
        var keys = Object.keys(obj),
            i, len;

        for(i = 0, len = keys.length; i < len; i++) {
            defineNotifyProperty(obj, keys[i], obj[keys[i]]);
        }
    }
};

// 依赖属性
function Dependency() {
    this.depMap = {};
}
Dependency.prototype = {
    constructor: Dependency,
    // 添加依赖处理
    add: function(binder) {
        var propertyName;
        if(binder instanceof Binder) {
            propertyName = binder.propertyName;
            if(!this.depMap.hasOwnProperty(binder.propertyName)) {
                this.depMap[propertyName] = [];
            }
            this.depMap[propertyName].push(binder);
        }
    },
    // 移除依赖处理
    remove: function(binder) {
        var propertyName,
            binderList,
            i, len;
        if(binder instanceof Binder) {
            propertyName = binder.propertyName;
            binderList = this.depMap[propertyName];

            if(Array.isArray(binderList)) {
                for(i = binderList.length - 1; i >= 0; i--) {
                    if(binderList[i] === binder) {
                        binderList.splice(i, 1);
                        break;
                    }
                }
            }
        }
    },
    depend: function() {
    },
    // 变化通知
    notify: function() {
        var keys,
            propertyName,
            delegate,
            errors,
            i, len;
        
        if(arguments.length === 0) {
            keys = Object.keys(this.depMap);
        } else {
            keys = [];
            for(i = 0, len = arguments.length; i < len; i++) {
                propertyName = arguments[i];
                if(ui.core.isString(propertyName) && 
                    propertyName.length > 0 && 
                    this.depMap.hasOwnProperty(propertyName)) {
                        
                    keys.push(propertyName);
                }
            }
        }

        errors = [];
        for(i = 0, len = keys.length; i < len; i++) {
            delegate = this.depMap[keys[i]];
            delegate.forEach(function(binder) {
                try {
                    binder.update();
                } catch(e) {
                    errors.push(e);
                }
            });
        }
        if(errors.length > 0) {
            throw errors.toString();
        }
    }
};

function Binder(option) {
    var propertyName = null; 

    this.id = ++binderId;
    this.viewModel = null;
    this.isActive = true;

    if(option) {
        this.sync = !!option.sync;
        this.lazy = !!option.lazy;
    } else {
        this.sync = this.lazy = false;
    }
    this.value = this.lazy ? null : this.get();

    Object.defineProperty(this, "propertyName", {
        configurable: false,
        enumerable: true,
        get: function() {
            if(!propertyName) {
                return "_";
            }
            return propertyName;
        },
        set: function(val) {
            propertyName = val;
        }
    });
}
Binder.prototype = {
    constructor: Binder,
    update: function() {
        if(!this.isActive) {
            return;
        }

        if(this.sync) {
            this.execute();
        } else {
            binderQueue.enqueue(this);
        }
    },
    execute: function() {
        var oldValue,
            value;

        oldValue = this.value;
        value = this.get();

        if(value !== oldValue) {
            this.value = value;
            try {
                this.action(value, oldValue);
            } catch(e) {
                ui.handleError(e);
            }
        }
    },
    get: function() {
        var value = null;

        if(this.viewModel && this.viewModel.hasOwnProperty(this.propertyName)) {
            value = this.viewModel[this.propertyName];
        }

        return value;
    }
};

function createBinder(viewModel, propertyName, bindData, handler, option) {
    var binder;
    if(!viewModel || !viewModel.__notice__) {
        throw new TypeError("the arguments 'viewModel' is invalid.");
    }
    if(!viewModel.hasOwnProperty(propertyName)) {
        throw new TypeError("the property '" + propertyName + "' not belong to the viewModel.");
    }
    if(ui.core.isFunction(bindData)) {
        handler = bindData;
        bindData = null;
    }
    if(!ui.core.isFunction(handler)) {
        return null;
    }

    binder = new Binder(option);
    binder.propertyName = propertyName;
    binder.viewModel = viewModel;
    binder.action = function(value, oldValue) {
        handler.call(viewModel, value, oldValue, bindData);
    };

    return binder;
}

ui.ViewModel = createNotifyObject;
ui.ViewModel.bindOnce = function(viewModel, propertyName, bindData, fn) {
    createBinder(viewModel, propertyName, bindData, fn);
};
ui.ViewModel.bindOneWay = function(viewModel, propertyName, bindData, fn, isSync) {
    var binder,
        option,
        notice,
        value;

    option = {
        sync: !!isSync
    };
    binder = createBinder(viewModel, propertyName, bindData, fn, option);
    if(binder) {
        notice = viewModel.__notice__;
        notice.dependency.add(binder);
        value = viewModel[propertyName];
        if(Array.isArray(value)) {
            notice = value.__notice__;
            if(notice) {
                notice.dependency.add(binder);
            }
        }
    }
};
ui.ViewModel.bindTwoWay = function(option) {
    // TODO: 双向绑定实际上只有在做表单的时候才有优势
};
