﻿;(function($) {
    "use strict";

    var panelStartTop = 64,
        panelMargin = 20,
        levelColors = ["#E64E89", "#FFC828", "#B306DC", "#14E2DD"],
        districts = ["江岸区","江汉区","硚口区","汉阳区","武昌区","青山区","洪山区","东西湖区","汉南区","蔡甸区","江夏区","黄陂区","新洲区"],
        alarmTypes = ["倒地", "移动", "撞击", "歪斜", "离线"];

    ui.ctrls.DialogBox.prototype._defineEvents = function() {
        return ["showing", "shown", "hiding", "hidden", "resize", "moved"];
    };
    ui.ctrls.DialogBox.prototype._initDraggable = function() {
        var option, that;
        
        that = this;
        option = {
            target: this.box,
            parent: $(document.body),
            hasIframe: this.hasIframe(),
            onEndDrag: function() {
                that.fire("moved");
            }
        };
        this.titlePanel
            .addClass("draggable-handle")
            .draggable(option);
    };

    function toRGB(rgb, alpha) {
        var arr = [rgb.red, rgb.green, rgb.blue];
        var text = "rgb"
        if(alpha >= 0 && alpha <= 1) {
            arr.push(alpha);
            text += "a";
        }

        return text + "(" + arr.join(",") + ")";
    }

    // 大屏布局系统
    function Layout(option) {
        if(this instanceof Layout) {
            this.initialize(option);
        } else {
            return new Layout(option);
        }
    }
    Layout.prototype = {
        constuctor: Layout,
        initialize: function(option) {
            this.leftGroup = new ui.KeyArray();
            this.rightGroup = new ui.KeyArray();

            this.container = option.container;
            this.isShown = false;

            function getShowStyle(setStartFn) {
                return function() {
                    var option,
                        that;

                    that = this;

                    option = this.animator[0];
                    setStartFn.call(this, option);
                    option.onChange = function (left) {
                        that.box.css("left", left + "px");
                    };
                    this.openMask();
                    this.animator.onEnd = function () {
                        that.onShown();
                    };

                    this.box.css({
                        "top": this.positionTop + "px",
                        "left": option.begin + "px",
                        "display": "block"
                    });
                };
            }

            ui.ctrls.DialogBox.setShowStyle("showFromLeft", getShowStyle(function(option) {
                option.begin = -this.offsetWidth;
                option.end = this.positionLeft;
            }));
            ui.ctrls.DialogBox.setShowStyle("showFromRight", getShowStyle(function(option) {
                var clientWidth = this.parent.width();
                option.begin = clientWidth;
                option.end = this.positionLeft;
            }));

            this.createRestore = function(panel) {
                var restoreAnimator = ui.animator({
                    target: panel.box,
                    ease: ui.AnimationStyle.easeFromTo,
                    onChange: function(val) {
                        this.target.css("top", val + "px");
                    }
                }).add({
                    target: panel.box,
                    ease: ui.AnimationStyle.easeFromTo,
                    onChange: function(val) {
                        this.target.css("left", val + "px");
                    }
                });
                restoreAnimator.duration = 240;

                panel.restore = function() {
                    var option;

                    option = restoreAnimator[0];
                    option.begin = parseFloat(option.target.css("top"));
                    option.end = this.positionTop;
                    option = restoreAnimator[1];
                    option.begin = parseFloat(option.target.css("left"));
                    option.end = this.positionLeft;

                    restoreAnimator.start();
                };
            };
        },
        _addPanel(name, group, option) {
            var panel,
                content;
            
            content = option.content;
            delete option.content;
            option.titleHeight = 30;
            option.boxCtrls = false;
            if(ui.core.isString(option.title)) {
                option.title = {
                    text: option.title,
                    hasHr: false
                };
            }
            option.show = "showFrom" + group;
            option.hide = group.toLowerCase();
            option.done = option.hide;
            option.maskable = false;
            option.suitable = false;
            option.resizeable = false;

            panel = new ui.ctrls.DialogBox(option, content);
            if(this.container) {
                panel.parent = this.container;
                panel.parent.append(panel.box);
            }
            panel.positionLeft = panel.positionTop = 0;

            panel.color = option.color || "#56C0F2";
            panel.colorRGB = ui.color.parseHex(panel.color);
            panel.titlePanel.find(".title-text").attr("style", "color:" + panel.color + " !important");
            panel.contentPanel.css("border-color", toRGB(panel.colorRGB, .6));

            this.createRestore(panel);
            panel.moved(function(e) {
                var top = this.positionTop,
                    left = this.positionLeft,
                    currentTop = parseFloat(this.box.css("top")) || null,
                    currentLeft = parseFloat(this.box.css("left")) || null;

                if(Math.abs(currentTop - top) < this.offsetHeight
                        && Math.abs(currentLeft - left) < this.offsetWidth / 2) {
                    this.contentPanel.removeClass("panel-content-cover");
                    this.restore();
                } else {
                    if(!this.contentPanel.hasClass("panel-content-cover")) {
                        this.contentPanel.addClass("panel-content-cover");
                    }
                }
            });

            if(group === "Left") {
                this.leftGroup.set(name, panel);
            } else if(group === "Right") {
                this.rightGroup.set(name, panel);
            }

            return panel;
        },
        _doArrangeLeft: function(width, height, group) {
            var maxWidth = 0,
                currentHeight = panelStartTop,
                currentLeft = panelMargin,
                i, len, panel;
            for(i = 0, len = group.length; i < len;) {
                panel = group[i];
                if(maxWidth < panel.offsetWidth) {
                    maxWidth = panel.offsetWidth;
                }
                currentHeight += panelMargin;
                if(currentHeight + panel.offsetHeight > height) {
                    if(panel.offsetHeight + panelStartTop > height) {
                        panel.positionTop = panelStartTop;
                        panel.positionLeft = currentLeft;
                        maxWidth = panel.offsetWidth;
                        i++;
                    }
                    currentHeight = panelStartTop;
                    currentLeft = currentLeft + maxWidth + panelMargin;
                    maxWidth = 0;
                } else {
                    panel.positionTop = currentHeight;
                    panel.positionLeft = currentLeft;
                    currentHeight += panel.offsetHeight;
                    i++;
                }
            }
        },
        _doArrangeRight: function(width, height, group) {
            var maxWidth = 0,
                currentHeight = panelStartTop,
                currentRight = width - panelMargin,
                i, len, panel,
                column;
            
            column = [];
            for(i = 0, len = group.length; i < len;) {
                panel = group[i];
                if(maxWidth < panel.offsetWidth) {
                    maxWidth = panel.offsetWidth;
                }
                currentHeight += panelMargin;
                if(currentHeight + panel.offsetHeight > height) {
                    if(panel.offsetHeight + panelStartTop > height) {
                        panel.positionTop = panelStartTop;
                        panel.positionLeft = currentLeft;
                        maxWidth = panel.offsetWidth;
                        i++;
                    } else {
                        column.forEach(function(item) {
                            item.positionLeft = currentRight - maxWidth;
                        });
                    }
                    currentHeight = panelStartTop;
                    currentRight = currentRight - maxWidth - panelMargin;
                    maxWidth = 0;
                    column.length = 0;
                } else {
                    panel.positionTop = currentHeight;
                    currentHeight += panel.offsetHeight;
                    column.push(panel);
                    i++;
                }
            }

            column.forEach(function(item) {
                item.positionLeft = currentRight - maxWidth;
            });
        },

        // API
        addLeftPanel: function(name, option) {
            return this._addPanel(name, "Left", option);
        },
        getLeftPanel: function(name) {
            return this.leftGroup.get(name);
        },
        addRightPanel: function(name, option) {
            return this._addPanel(name, "Right", option);
        },
        getRightPanel: function(name) {
            return this.rightGroup.get(name);
        },
        show: function() {
            var i, len,
                panel;
            for(i = 0, len = this.leftGroup.length; i < len; i++) {
                panel = this.leftGroup[i];
                if(i === 0) {
                    panel.show();
                } else {
                    setTimeout((function(p) {
                        return function() {
                            p.show();
                        };
                    })(panel), 100 * i);
                }
            }

            for(i = 0, len = this.rightGroup.length; i < len; i++) {
                panel = this.rightGroup[i];
                if(i === 0) {
                    panel.show();
                } else {
                    setTimeout((function(p) {
                        return function() {
                            p.show();
                        };
                    })(panel), 100 * i);
                }
            }

            this.isShown = true;
        },
        hide: function() {
            this.isShown = false;
        },
        arrange: function(width, height, restore) {
            if(this.leftGroup.length > 0) {
                this._doArrangeLeft(width, height, this.leftGroup);
            }
            if(this.rightGroup.length > 0) {
                this._doArrangeRight(width, height, this.rightGroup);
            }

            if(restore) {
                this.restore();
            }
        },
        restore: function() {
            var i, len,
                panel;
            if(this.leftGroup.length > 0) {
                for(i = 0, len = this.leftGroup.length; i < len; i++) {
                    panel = this.leftGroup[i];
                    panel.restore();
                }
            }
            if(this.rightGroup.length > 0) {
                for(i = 0, len = this.rightGroup.length; i < len; i++) {
                    panel = this.rightGroup[i];
                    panel.restore();
                }
            }
        }
    };

    function defaultMessageTemplate(item, index) {
        var html = [],
            alarmClass = "alarm-message-level" + item.level;
        html.push("<li class='ui-message-list-item ", alarmClass, "'>");
        html.push("<b class='ui-message-list-item-border'></b>");
        html.push("<span class='ui-message-list-item-text'>", item.message, "</span>");
        html.push("</li>");
        return html.join("");
    }
    ui.ctrls.define("ui.ctrls.MessageList", {
        _defineOption: function() {
            return {
                // 最多保留多少条消息
                maxLength: 20,
                // 视图数据
                viewData: null,
                // 内容生成模板
                messageTemplate: defaultMessageTemplate
            };
        },
        _defineEvents: function() {
            return ["added", "truncated"];
        },
        _create: function() {
            this.animator = ui.animator({
                ease: ui.AnimationStyle.easeTo,
                onChange: function (val, elem) {
                    elem.css("transform", "translateY(" + val + "px)");
                }
            });
            this.animator.duration = 500;
            this.animator.messageBuffer = [];
            this.animator.onEnd = (function() {
                var buffer = this.animator.messageBuffer;
                if(buffer.length > 0) {
                    this.animator.messageBuffer = [];
                    this._addMessage(buffer);
                } else {
                    this._truncate();
                }
            }).bind(this);
        },
        _render: function() {
            this.messageContainer = $("<div class='ui-message-container' />");
            this.element.addClass("ui-message-list");
            this.element.append(this.messageContainer);

            // 设置动画元素
            this.animator[0].target = this.messageContainer;

            if(this.option.viewData) {
                this.messageContainer.append(
                    this._createMessageGroup(this.option.viewData));
            }
        },
        _createMessageGroup: function(messages) {
            var i, len,
                group, item,
                msg;
            group = $("<ul class='ui-message-group' />");
            for(i = 0, len = messages.length; i < len; i++) {
                msg = messages[i];
                item = this.option.messageTemplate.call(this, msg, "ui-message-item", group);
                group.append(item);
            }
            return group;
        },
        _addMessage: function(messages) {
            var group,
                currentTop, 
                option;

            if(messages.length === 0) {
                return;
            }

            if(this.animator.isStarted) {
                this.animator.messageBuffer.unshift(messages);
                return;
            }

            if(!this.option.viewData) {
                this.option.viewData = messages;
            } else {
                this.option.viewData = messages.concat(this.option.viewData);
            }

            option = this.animator[0];
            currentTop = option.current || 0;
            group = this._createMessageGroup(messages);
            option.target.prepend(group);
            currentTop += -group.height();
            
            option.begin = currentTop;
            option.end = 0;

            option.target.css("transform", "translateY(" + currentTop + "px)");

            this.animator.start();
            this.fire("added");
        },
        _truncate: function() {
            var count = this.option.viewData.length,
                maxLength = this.option.maxLength,
                groups, group, size, list,
                i, len, 
                eventData = {};
            if(count <= maxLength) {
                return;
            }
            eventData.removeItems = this.option.viewData.splice(maxLength, count - maxLength);
            eventData.removeLenght = eventData.removeItems.length;

            groups = this.messageContainer.children();
            size = 0;
            for(i = 0, len = groups.length; i < len; i++) {
                group = $(groups[i]);
                if(size > maxLength) {
                    group.remove();
                } else {
                    list = group.children();
                    if(list.length === 0) {
                        group.remove();
                    } else {
                        size += list.length;
                        if(size > maxLength) {
                            $(Array.prototype.slice.call(list, list.length - (size - maxLength))).remove();
                        }
                    }
                }
            }

            this.fire("truncated", eventData);
        },
        // API
        add: function(message) {
            if(!message) {
                return;
            }
            if(!Array.isArray(message)) {
                message = [message];
            }
            this._addMessage(message);
        },
        clear: function() {
            this.messageContainer.empty();
            this.option.viewData.length = 0;
        }
    });

    // main方法
    ui.page.init({
        master: function() {
            this.loaded(function() {
                this.body.css({
                    "visibility": "visible",
                    "opacity": 0
                });
                ui.animator.fadeIn(this.body, 500);
            });
        },
        // 创建需要初始化布局的页面元素
        created: function() {
            this.mapChart = initScreenCenter();

            this.panels = new Layout({
                container: $("#body")
            });
            // 左边
            initAlarmTypePanel(this.panels);
            initBarrierInstallPanel(this.panels);
            
            // 右边
            initRealtimeAlarmPanel(this.panels);
            initBarrierAlarmPanel(this.panels);
            initAlarmInWeekPanel(this.panels);

            ui.page.resize(function() {
                var width = ui.page.contentBodyWidth, 
                    height = ui.page.contentBodyHeight;

                ui.page.mapChart.setSize(width, height);
                ui.page.panels.arrange(width, height, true);
            });
        },
        // 数据加载
        load: function() {
            $(".screen-subtitle").text(
                ui.date.format(new Date(), "yyyy-MM-dd, EEEE"));

            this.panels.arrange(
                ui.page.contentBodyWidth,
                ui.page.contentBodyHeight);
            setTimeout(function() {
                ui.page.panels.show();
            }, 300);
        }
    });

    function initScreenCenter() {
        var mapChart, i,
            option,
            series = [];

        option = {
            geo: {
                map: 'wuhanMap',
                center: [114.33272, 30.68543],
                zoom: 1.2,
                label: {
                    emphasis: {
                        show: false
                    }
                },
                roam: true,
                itemStyle: {
                    normal: {
                        areaColor: '#224D7D',
                        borderColor: '#83D1F5'
                    },
                    emphasis: {
                        areaColor: '#3372A3'
                    }
                }
            },
            series: null
        };

        for(i = 1; i <= 4; i++) {
            series.push({
                name: "报警",
                type: "effectScatter",
                coordinateSystem: "geo",
                data: [],
                symbolSize: 20,
                showEffectOn: "render",
                rippleEffect: {
                    brushType: "stroke"
                },
                hoverAnimation: true,
                label: {
                    normal: {
                        formatter: "{b}",
                        position: "right",
                        show: true
                    }
                },
                itemStyle: {
                    normal: {
                        color: levelColors[i - 1],
                        shadowBlur: 10,
                        shadowColor: "#333"
                    }
                },
                zlevel: 100
            });
        }
        option.series = series;

        mapChart = {
            mapData: wuhanJson,
            alarmLocations: [],
            container: $("#wuhanMap"),
            setSize: function(width, height) {
                var containerWidth = width * .5,
                    containerHeight = height - 64 * 2;
                this.container.css({
                    width: containerWidth + "px",
                    height: containerHeight + "px"
                });

                if(this.chart) {
                    this.chart.resize();
                }
            },
            addAlarms: function(alarms) {
                var size = 0,
                    count, unit, remain;
                if(alarms.length === 0) {
                    return;
                }
                series.forEach(function(s) {
                    size += s.data.length;
                });
                if(size + alarms.length > 20) {
                    count = size + alarms.length - 20;
                    unit = Math.floor(count / series.length);
                    remain = count % series.length;
                    series.forEach(function(s) {
                        if(unit + remain > s.data.length) {
                            remain = unit + remain - s.data.length;
                            s.data.length = 0;
                        } else {
                            s.data.splice(0, unit + remain);
                        }
                    });
                }

                alarms.forEach(function(a) {
                    series[a.level - 1].data.push(convertData(a));
                });
                this.chart.setOption(option);
            }
        };

        for(i = 10; i > 0; i--) {
            mapChart.mapData.features.forEach(function(item) {
                var arr = item.geometry.coordinates[0][0], j;
                for(j = 10; j > 0; j--) {
                    mapChart.alarmLocations.push(arr[ui.random.getNum(0, arr.length)]);
                }
            });
        }

        function convertData(alarm) {
            var geoCoord = mapChart.alarmLocations[ui.random.getNum(0, mapChart.alarmLocations.length)];
            return {
                name: "设备" + alarm.event,
                level: alarm.level,
                value: geoCoord
            };
        }

        mapChart.setSize(
            ui.page.contentBodyWidth, 
            ui.page.contentBodyHeight);

        mapChart.chart = echarts.init(mapChart.container[0]);
        echarts.registerMap("wuhanMap", mapChart.mapData);
        mapChart.chart.setOption(option);

        return mapChart;
    }
    
    function initAlarmTypePanel(panels) {
        var content = $("<div class='panel-content' />"),
            panel,
            alarms = ["设备位移","设备倒地","设备警告","设备低电","设备掉线"],
            alarmValues = [];

        alarms.forEach(function(item, index) {
            alarmValues.push({
                name: item,
                value: ui.random.getNum(1, 80)
            });
        });

        panel = panels.addLeftPanel("AlarmPanel", {
            content: content,
            title: "异常类型分析",
            width: 360,
            height: 320
        });
        content.css({
            "width": panel.contentWidth - 2 + "px",
            "height": panel.contentHeight - 2 + "px"
        });
        panel.chartView = echarts.init(content.get(0));
        panel.showing(function(e) {
            this.chartView.setOption({
                color: ["#F98DBF", "#00C9FF", "#F4C209", "#F04C41", "#70F0A5"],
                title: {
                    show: false
                },
                tooltip: {
                    show: false,
                    trigger: "item",
                    formatter: "{a} <br/>{b}: {c} ({d}%)"
                },
                legend: {
                    orient: "vertical",
                    x: "left",
                    y: "top",
                    textStyle: {
                        color: "#56C0F2"
                    },
                    data: alarms
                },
                series: [
                    {
                        type: "pie",
                        radius: ["50%", "70%"],
                        avoidLabelOverlap: false,
                        center: ["60%", "50%"],
                        label: {
                            normal: {
                                show: false,
                                position: "center",
                                formatter: "{b}\n{c}\n({d}%)"
                            },
                            emphasis: {
                                show: true,
                                textStyle: {
                                    fontSize: "18",
                                    fontWeight: "bold"
                                }
                            }
                        },
                        labelLine: {
                            normal: {
                                show: false
                            }
                        },
                        data: alarmValues
                    }
                ]
            });
        });
    }

    function initBarrierInstallPanel(panels) {
        var content = $("<div class='panel-content' />"),
            panel,
            districtValues = [];

        districts.forEach(function(item, index) {
            districtValues.push(ui.random.getNum(5, 270));
        });

        panel = panels.addLeftPanel("BarrierInstallSituation", {
            content: content,
            title: "各区安装栅栏情况",
            width: 360,
            height: 290
        });
        content.css({
            "width": panel.contentWidth - 2 + "px",
            "height": panel.contentHeight - 2 + "px"
        });
        panel.chartView = echarts.init(content.get(0));
        panel.showing(function(e) {
            this.chartView.setOption({
                title: {
                    show: false
                },
                tooltip: {},
                legend: {
                    show: false
                },
                grid: {
                    left: "65",
                    right: "15",
                    top: "10",
                    bottom: "10"
                },
                xAxis: {
                    axisLine: {
                        show: false,
                        lineStyle: {
                            color: "#17C6C0"
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    splitLine: {
                        show: false
                    }
                },
                yAxis: {
                    axisLine: {
                        show: false,
                        lineStyle: {
                            color: "#17C6C0"
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    data: districts
                },
                series: [{
                    type: 'bar',
                    itemStyle: {
                        color: "#5DD7D3"
                    },
                    label: {
                        show: true,
                        position: "right"
                    },
                    data: districtValues
                }]
            });
        });
    }

    function initRealtimeAlarmPanel(panels) {
        var content = $("<div class='panel-content' />"),
            panel;

        panel = panels.addRightPanel("AlarmPanel2", {
            content: content,
            title: "异常预警",
            width: 320,
            height: 212
        });
        content.css({
            "width": panel.contentWidth - 2 + "px",
            "height": panel.contentHeight - 2 + "px"
        });

        function getAlarms() {
            var i, len = ui.random.getNum(0, 5),
                alarms = [],
                alarm;
            for(i = 0; i < len; i++) {
                alarm = {
                    level: ui.random.getNum(1, 5),
                    address: districts[ui.random.getNum(0, districts.length)],
                    event: alarmTypes[ui.random.getNum(0, alarmTypes.length)]
                };
                alarm.message = "在" + alarm.address + "发生'设施" + alarm.event + "'警情事件";
                alarms.push(alarm);
            }
            return alarms;
        }

        panel.showing(function(e) {
            if(!this.messageList) {
                this.messageList = new ui.ctrls.MessageList({
                    viewData: null
                }, content);
            }
        });
        panel.shown(function(e) {
            var that = this;
            function add() {
                var alarms = getAlarms();
                that.messageList.add(alarms);
                ui.page.mapChart.addAlarms(alarms);
                setTimeout(add, ui.random.getNum(1000, 5000))
            }
            setTimeout(function() {
                add();
            }, ui.random.getNum(1000, 5000));
        });
    }

    function initBarrierAlarmPanel(panels) {
        var content = $("<div class='panel-content' />"),
            colors = ["#FA3769","#FFC828","#61A2E5","#44BEC3","#0ABF1C","#F2CB57","#4BD9FF","#A4D8B2","#FE5A3E","#6E9AEF","#BEB9FA","#FFABAF","#8CBAD1"],
            districtValues = [],
            panel;

        districts.forEach(function(item, index) {
            districtValues.push({
                name: item,
                value: ui.random.getNum(2, 46),
                itemStyle: {
                    color: colors[index]
                }
            });
        });

        panel = panels.addRightPanel("BarrierAlarm", {
            content: content,
            title: "各区栅栏异常排名",
            width: 320,
            height: 220
        });
        content.css({
            "width": panel.contentWidth - 2 + "px",
            "height": panel.contentHeight - 2 + "px"
        });

        panel.chartView = echarts.init(content.get(0));
        panel.showing(function(e) {
            this.chartView.setOption({
                title: {
                    show: false
                },
                tooltip: {},
                legend: {
                    show: false
                },
                grid: {
                    top: "15",
                    right: "15"
                },
                xAxis: {
                    axisLine: {
                        lineStyle: {
                            color: "#56C0F2"
                        }
                    },
                    splitLine: {
                        show: false
                    },
                    axisLabel: {
                        rotate: 60
                    },
                    data: districts
                },
                yAxis: {
                    axisLine: {
                        lineStyle: {
                            color: "#56C0F2"
                        }
                    },
                    splitLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    }
                },
                series: [{
                    type: 'bar',
                    barWidth: 10,
                    itemStyle: {
                        color: "#5DD7D3",
                        barBorderRadius: [5, 5, 0, 0]
                    },
                    label: {
                        show: true,
                        position: "top"
                    },
                    data: districtValues
                }]
            });
        });
    }

    function initAlarmInWeekPanel(panels) {
        var content = $("<div class='panel-content' />"),
            week = ["一","二","三","四","五","六","日"],
            alarms = ["设备位移","设备倒地","设备警告","设备低电","设备掉线"],
            weekValues = [],
            panel;

        alarms.forEach(function(alarm) {
            var serie = {
                name: alarm,
                type: 'line',
                smooth: true,
                data: []
            };
            weekValues.push(serie);
            week.forEach(function() {
                serie.data.push(ui.random.getNum(25, 150));
            });
        });

        panel = panels.addRightPanel("AlarmInWeek", {
            content: content,
            title: "一周异常分析",
            width: 320,
            height: 170
        });

        content.css({
            "width": panel.contentWidth - 2 + "px",
            "height": panel.contentHeight - 2 + "px"
        });

        panel.chartView = echarts.init(content.get(0));
        panel.showing(function(e) {
            this.chartView.setOption({
                color: ["#F98DBF", "#00C9FF", "#F4C209", "#F04C41", "#70F0A5"],
                title: {
                    show: false
                },
                tooltip: {},
                legend: {
                    show: false
                },
                grid: {
                    top: "15",
                    right: "15",
                    bottom: "30"
                },
                xAxis: {
                    type: 'category',
                    axisLine: {
                        lineStyle: {
                            color: "#56C0F2"
                        }
                    },
                    splitLine: {
                        show: false
                    },
                    data: week
                },
                yAxis: {
                    type: 'value',
                    axisLine: {
                        lineStyle: {
                            color: "#56C0F2"
                        }
                    },
                    splitLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    }
                },
                series: weekValues
            });
        });
    }

})(jQuery);