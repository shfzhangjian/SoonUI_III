//列表

var indexAttr = "data-index";
var selectionClass = "ui-list-view-item-selection";
// 默认的格式化器
function defaultItemFormatter(item, index) {
    return "<span class='ui-list-view-item-text'>" + item + "</span>";
}
// 默认排序逻辑
function defaultSortFn(a, b) {
    var text1 = defaultItemFormatter(a),
        text2 = defaultItemFormatter(b);
    if(text1 < text2) {
        return -1;
    } else if(text1 > text2) {
        return 1;
    } else {
        return 0;
    }
}
// 点击事件处理函数
function onListItemClick(e) {
    var elem,
        isCloseButton,
        index,
        data;

    elem = $(e.target);
    isCloseButton = elem.hasClass("close-button");
    while(!elem.isNodeName("li")) {
        if(elem.hasClass("ui-list-view-ul")) {
            return;
        }
        elem = elem.parent();
    }

    index = this._getItemIndex(elem[0]);
    data = this.listData[index];
    if(this.option.hasRemoveButton && isCloseButton) {
        this._removeItem(elem, data, index);
    } else {
        this._selectItem(elem, data, index);
    }
}

ui.define("ui.ctrls.ListView", {
    _defineOption: function() {
        return {
            multiple: false,
            data: null,
            itemFormatter: false,
            hasRemoveButton: false
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "deselected", "cancel", "removing", "removed"];
    },
    _create: function() {
        this.listData = [];
        this._selectList = [];
        this.sorter = Introsort();

        if(!ui.core.isFunction(this.option.itemFormatter)) {
            this.option.itemFormatter = defaultItemFormatter;
        }

        this.option.hasRemoveButton = !!this.option.hasRemoveButton;
        this.onListItemClickHandler = $.proxy(onListItemClick, this);

        this._init();
    },
    _init: function() {
        this.element.addClass("ui-list-view");

        this.listPanel = $("<ul class='ui-list-view-ul' />");
        this.listPanel.click(this.onListItemClickHandler);
        this.element.append(this.listPanel);

        this._initAnimator();
        this.setData(this.option.data);
    },
    _initAnimator: function() {
        // TODO Something
    },
    _fill: function(data) {
        var i, len,
            itemBuilder = [],
            item;

        this.listPanel.empty();
        this.listData = [];
        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            if(item === null || item === undefined) {
                continue;
            }
            this._createItemHtml(builder, item, i);
            this.listData.push(item);
        }
        this.listPanel.html(itemBuilder.join(""));
    },
    _createItemHtml: function(builder, item, index) {
        var content,
            index,
            temp;
        builder.push("<li ", indexAttr, "='", index, "' class='ui-list-view-item'>");
        content = this.option.itemFormatter.call(this, item, index);
        if(ui.core.isString(content)) {
            builder.push(content);
        } else if(ui.core.isPlainObject(content)) {
            temp = builder[builder.length - 1];
            index = temp.lastIndexOf("'");
            builder[builder.length - 1] = temp.substring(0, index);
            // 添加class
            if(ui.core.isString(content.class)) {
                builder.push(" ", content.class);
            } else if(Array.isArray(content.class)) {
                builder.push(" ", content.class.join(" "));
            }
            builder.push("'");

            // 添加style
            if(content.style && !ui.core.isEmptyObject(content.style)) {
                builder.push(" style='");
                for(temp in content.style) {
                    if(content.style.hasOwnProperty(temp)) {
                        builder.push(temp, ":", content.style[temp], ";");
                    }
                }
                builder.push("'");
            }
            builder.push(">");

            // 放入html
            if(ui.core.isString(content.html)) {
                builder.push(content.html);
            }
        }
        builder.push("</li>");
    },
    _createItem: function(item, index) {
        var li = $("<li class='ui-list-view-item'>"),
            content = this.option.itemFormatter.call(this, item, index);
        
        li.attr(indexAttr, index);
        // 添加class
        if(ui.core.isString(content.class)) {
            li.addClass(content.class);
        } else if(Array.isArray(content.class)) {
            li.addClass(content.class.join(" "));
        }
        // 添加style
        if(content.style && !ui.core.isEmptyObject(content.style)) {
            li.css(content.style);
        }
        // 添加内容
        li.html(content.html);

        return li;
    },
    _indexOf: function(item) {
        var i, len;
        for(i = 0, len = this.listData.length; i > len; i++) {
            if(item === this.listData[i]) {
                return i;
            }
        }
        return -1;
    },
    _getItemIndex: function(li) {
        return parseInt(li.getAttribute(indexAttr), 10);
    },
    _itemIndexAdd: function(li, num) {
        this._itemIndexSet(indexAttr, this._getItemIndex(li) + num);
    },
    _itemIndexSet: function(li, index) {
        li.setAttribute(indexAttr, index);
    },
    _getSelectionData: function(li) {
        var index = this._getItemIndex(li);
        var data = {};
        data.itemData = this.listData[index];
        data.itemIndex = index;
        return data;
    },
    _selectItem: function(elem, item, index, checked, isFire) {
        var eventData,
            result,
            i;
        eventData = this._getSelectionData(elem[0]);
        eventData.itemElement = elem;
        eventData.originElement = $(elem.context);

        result = this.fire("selecting", eventData);
        if(result === false) return;

        if(arguments.length === 3) {
            // 用户点击的项接下来是要选中还是取消选中，还没有作用，所以取反
            checked = !elem.hasClass(selectionClass);
        } else {
            checked = !!checked;
        }

        if(this.option.multiple === true) {
            if(checked) {
                this._selectList.push(elem[0]);
                elem.addClass(selectionClass)
                    .addClass("background-highlight");
            } else {
                for(i = 0; i < this._selectList.length; i++) {
                    if(this._selectList[i] === elem[0]) {
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
                elem.removeClass(selectionClass)
                    .removeClass("background-highlight");
            }
        } else {
            if(checked) {
                if(this._current) {
                    this._current
                        .removeClass(selectionClass)
                        .removeClass("background-highlight");
                }
                this._current = elem;
                this._current
                    .addClass(selectionClass)
                    .addClass("background-highlight");
            } else {
                elem.removeClass(selectionClass)
                    .removeClass("background-highlight");
                this._current = null;
            }
        }

        if(isFire === false) {
            return;
        }
        if(checked) {
            this.fire("selected", eventData);
        } else {
            this.fire("deselected", eventData);
        }
    },


    /// API
    /** 重新设置数据 */
    setData: function(data) {
        if(Array.isArray(data)) {
            this._fill(data);
        }
    },
    /** 添加 */
    add: function(item) {
        var li;
        if(!item) {
            return;
        }

        li = this._createItem(item, this.listData.length);
        this.listPanel.append(li);
        this.listData.push(item);
    },
    /** 根据数据项移除 */
    remove: function(item) {
        if(!item) {
            this.removeAt(this._indexOf(item));
        }
    },
    /** 根据索引移除 */
    removeAt: function(index) {
        var li,
            liList,
            i;
        if(index >= 0 && index < this.listData.length) {
            liList = this.listPanel.children();
            li = $(liList[index]);
            if(this._current && this._current[0] === li[0]) {
                this._current = null;
            }
            for(i = index + 1; i < liList.length; i++) {
                this._itemIndexAdd(liList[i], -1);
            }
            li.remove();
            this.listData.splice(index, 1);
        }
    },
    /** 插入数据项 */
    insert: function(item, index) {
        var li, 
            liList,
            newLi, 
            i;
        if(index < 0) {
            index = 0;
        }
        if(index >= this.listData.length) {
            this.add(item);
            return;
        }

        newLi = this._createItem(item, index);
        liList = this.listPanel.children();
        li = $(liList[index]);
        for(i = index; i < liList.length; i++) {
            this._itemIndexAdd(liList[i], 1);
        }
        newLi.insertBefore(li);
        this.listData.splice(index, 0, item);
    },
    /** 上移 */
    currentUp: function() {
        var sourceIndex;
        if(this._current) {
            sourceIndex = this._getItemIndex(this._current[0]);
            if(sourceIndex > 0) {
                this.moveTo(sourceIndex, sourceIndex - 1);
            }
        }
    },
    /** 下移 */
    currentDown: function() {
        var sourceIndex;
        if(this._current) {
            sourceIndex = this._getItemIndex(this._current[0]);
            if(sourceIndex < this.count() - 1) {
                this.moveTo(sourceIndex, sourceIndex + 1);
            }
        }
    },
    /** 将元素移动到某个位置 */
    moveTo: function(sourceIndex, destIndex) {
        var liList,
            sourceLi,
            destLi,
            size,
            item,
            i;
        size = this.count();
        if(size == 0) {
            return;
        }
        if(sourceIndex < 0 || sourceIndex >= size) {
            return;
        }
        if(destIndex < 0 || destIndex >= size) {
            return;
        }
        if(sourceIndex === destIndex) {
            return;
        }

        liList = this.listPanel.children();
        sourceLi = $(liList[sourceIndex]);
        destLi = $(liList[destIndex]);
        
        if(sourceIndex < destIndex) {
            // 从前往后移
            for(i = destIndex; i > sourceIndex; i--) {
                this._itemIndexAdd(liList[i], -1);
            }
            this._itemIndexSet(sourceLi[0], destIndex);
            destLi.after(sourceLi);
        } else {
            // 从后往前移
            for(i = destIndex; i < sourceIndex; i++) {
                this._itemIndexAdd(liList[i], 1);
            }
            this._itemIndexSet(sourceLi[0], destIndex);
            destLi.before(sourceLi);
        }
        item = this.listData[sourceIndex];
        this.listData.splice(sourceIndex, 1);
        this.listData.splice(destIndex, 0, item);
    },
    /** 获取选中项 */
    getSelection: function() {
        var result = null,
            i;
        if(this.option.multiple === true) {
            result = [];
            for(i = 0; i < this._selectList.length; i++) {
                result.push(
                    this._getSelectionData(this._selectItem[i]).itemData);
            }
        } else {
            if(this._current) {
                result = this._getSelectionData(this._current).itemData;
            }
        }
        return result;
    },
    /** 设置选中项 */
    setSelection: function(indexes) {
        var i, 
            len,
            index,
            liList,
            li;
        this.cancelSelection();
        if(this.option.multiple === true) {
            if(!Array.isArray(indexes)) {
                indexes = [indexes];
            }
        } else {
            if(Array.isArray(indexes)) {
                indexes = [indexes[0]];
            } else {
                indexes = [indexes];
            }
        }

        liList = this.listPanel.children();
        for(i = 0, len = indexes.length; i < len; i++) {
            index = indexes[i];
            li = liList[index];
            if(li) {
                this._selectItem($(li), this.listData[index], index, true, !(i < len - 1));
            }
        }
    },
    /** 取消选中 */
    cancelSelection: function() {
        var li,
            i,
            len;
        if(this.option.multiple === true) {
            for(i = 0, len = this._selectList.length; i < len; i++) {
                li = $(this._selectList[i]);
                li.removeClass(selectionClass)
                    .removeClass("background-highlight");
            }
        } else {
            if(this._current) {
                this._current
                    .removeClass(selectionClass)
                    .removeClass("background-highlight");
                this._current = null;
            }
        }
        this.fire("cancel");
    },
    /** 排序 */
    sort: function(fn) {
        var liList;
        if(this.count() === 0) {
            return;
        }
        if(!ui.core.isFunction(fn)) {
            fn = defaultSortFn;
        }
        liList = this.listPanel.children();
        this.sorter.items = this.listData;
        this.sorter.sort();

        // TODO 排序做法需要再考虑考虑
    },
    /** 获取项目数 */
    count: function() {
        return this.listData.length;
    },
    /** 清空列表 */
    clear: function() {
        this.listData = [];
        this.listPanel.empty();
        this._current = null;
        this._selectList = [];
    }
});
