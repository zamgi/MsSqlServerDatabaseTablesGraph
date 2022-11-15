//сплиттер нижнего фрейма
var detailsSplitter = null;
//граф соц связей, отображается в основной области.
var graph = d3.layout.xyz();
//Данные для построения страницы
var APP = {};


jQuery(function ($) {
    graph
        .setIcon("/images/PersonInfo.png")
        .create("#graph");
    if (d3.layout.minimap) {
        d3.layout.minimap().create(graph);
        graph.simpleZoom(true);
    }
    $('#BtHome').click(function() {
        graph.resetZoom();
    });
    var resizeTimeoutID = null;
    $(window).bind("resize.splitter", function () {
        if (resizeTimeoutID) clearTimeout(resizeTimeoutID);
        resizeTimeoutID = setTimeout(function() {
            if (graph && graph.nodes().length > 0) {
                graph.bind();
            }
            resizeTimeoutID = null;
        }, 200);
    });
});

var graphLayout = (function() {
    var self = {},
        loadCancelCallback = null;
    //перезагружает данные графа с сервера
    self.loadData = function(json) {
        if (typeof json === "string" || json.error || !json.Settings) {
            //todo отладочный вывод ошибок
            console.log(typeof json === "string" ? json : json.error);
            return;
        }
        APP.Settings = json.Settings;
        APP.Nodes = json.Nodes;
        APP.Links = json.Links;
        self.bindData();
        //алгоритм минимизации пересечений узлов графа
        if (typeof RemoveGraphOverlaps !== "undefined") {
            RemoveGraphOverlaps(graph, APP);
        }
    };
    self.bindData = function() {
        //---self.hidePreloader();
        //---createLeftMenu();
        createGraph();
        graph.resetZoom();
        APP.Loaded = true;
        setTimeout(function() {
            $('body').trigger('dataLoad');
        }, 1);
    };

    //полная перезагрузка графа
    self.reload = function () {
        $('body').trigger('graphReload');
    };

    /*---
    self.showError = function(message) {
        $('#messageScreen').show();
        $('#content,#loader').hide();
        $('#messageText').text("Ошибка: " + message);
    }
    */
    
    //Создает список авторов в левой части страницы
    //используемые колонки в Nodes: 
    //id, name, PlatformId, DocCount, LinkCount, Rank
    /*---
    function createLeftMenu() {
        $('#menuTitle .titleText').text(APP.Settings.СontentTitle);
        
        //шаблон строки чекбоксов
        var rowTemplate = '<tr class="ThemeRow"><td><input type="checkbox" class="ThemeCheckbox" /></td><td><label><span class="Theme"></span></label></td></tr>';
        var $table = $('<table cellspacing="0" width="100%"></table>').appendTo($('#menuRows').empty());
        //формирование строчек чекбоксов
        for (var i = 0, n = APP.Nodes.length; i < n; i++) {
            var author = APP.Nodes[i];
            var row = $(rowTemplate);
            row.attr("title", author.title).toggleClass('highlight', author.highlight ? true : false);
            $("span.Theme", row).html(author.text);
            $("input.ThemeCheckbox", row).attr("id", "acb" + author.id).data('graph.id', author);
            $("label", row).attr("for", "acb" + author.id);
            $("input", row).click(onRowClick);
            $table.append(row);
        }

        //обработка смены выделения в чекбоксах, передача выделения в граф.
        function onRowClick() {
            var $this = $(this),
                b = $this.prop("checked") ? true : false;
            $this.closest('.ThemeRow').toggleClass("selected", b);
            var id = $this.data('graph.id').id;
            if (graph) graph.setNodeSelection(id, b);
            updateCbAll();
        }

        //чекбокс "выделить все"
        $('#acbAll').click(function () {
            if (graph) {
                if (this.checked) {
                    graph.selectAll();
                } else {
                    graph.clearSelection();
                }
            }
            setCheckboxState($('input.ThemeCheckbox'), this.checked);
        });
    };
    */

    //выделяет строчку в таблице авторов и чекает чекбокс в ней
    function setCheckboxState($checkbox, checked) {
        $checkbox.prop('checked', checked)
            .closest('.ThemeRow').toggleClass('selected', checked ? true : false);
    };

    //чекбокс "выделить все" включается только когда все выделено
    function updateCbAll() {
        $('body').trigger('graphSelectionChanged');
        $('#acbAll').prop('checked', $("input.ThemeCheckbox").length === $("input.ThemeCheckbox:checked").length);
    };

    //создает граф в основной части страницы
    function createGraph() {
        if (APP.StyleBlock) {
            APP.StyleBlock.remove();
        }
        /*---
        APP.StyleBlock = $('<style type="text/css">\n'+
            ".xyz_label { font: " + APP.Settings.FontSize + "pt " + APP.Settings.FontFace + "; fill: " + APP.Settings.FontColor + " }\n"+
            ".xyz_node_selection { stroke: " + APP.Settings.NodeStrokeColor + " }\n"+
            ".xyz_background { fill: " + APP.Settings.BackColor + " }\n"+
        "</style>").appendTo("head");
        */
        
        //рачсет динамических параметров графа
        var s0 = parseFloat(APP.Settings.MINNodeSize),
            ds = parseFloat(APP.Settings.MAXNodeSize) - s0,
            mlw = parseFloat(APP.Settings.MAXLinkWidth) - 1;
        for (var i = 0, nc = APP.Nodes.length; i < nc; i++) {
            var node = APP.Nodes[i];
            node.iconHeight = node.iconWidth = s0 + Math.floor(node.Size * ds);
        }
        for (var i = 0, lc = APP.Links.length; i < lc; i++) {
            var link = APP.Links[i];
            link.color = (link.Color || APP.Settings.LinkColor);
            if (link.Width) {
                link.width = link.Width;
            } else {
                link.width = 1 + link.Size * mlw;
            }
        }
        
        //var usedNodeFields = ["X", "Y", "name", "title", "icon", "iconWidth", "iconHeight"];
        //var usedLinkFields = ["source", "target", "type", "title", "width", "color"];
        
        //инициализация графа
        graph
            .nodes(APP.Nodes)
            .links(APP.Links)
            .bind();
        /*---graph.clearSelection();*/
        
        //удалить старые маркеры
        graph.getNodeElems()
            .selectAll('.xyz_highlight, .xyz_marker')
            .remove();
        //назначить на узлы события и добавить маркеры
        graph.getNodeElems()
            .on("click.init", function(d) { $('body').trigger('graphNodeClick', d); })
            .on("dblclick.init", function(d) { $('body').trigger('graphNodeDblclick', d); })
            .each(function(d) {
                if (d.highlight) {
                    d3.select(this)
                        .insert("svg:circle", ":first-child")
                        .classed('xyz_highlight', true)
                        .attr("r", d.iconWidth / 2 + 3)
                        .attr("fill", d.highlight);
                }
                if (d.marker) {
                    d3.select(this)
                        .append("svg:image")
                        .classed("xyz_marker", true)
                        .attr("xlink:href", config.appRootPath + "css/view/V1/graphLayout/plus.gif")
                        .attr("x", d.iconWidth / 2 + 2)
                        .attr("y", - d.iconHeight / 2 - 3)
                        .attr("width", "9")
                        .attr("height", "9");
                }
            });
        
        //назначение событий на связи
        graph.getLinkElems()
            .on("click.init", function(d) { $('body').trigger('graphLinkClick', d); })
            .on("dblclick.init", function(d) { $('body').trigger('graphLinkDblclick', d); });
        
        //смена выделения в чекбоксах при смене выделения в графе.
        function UpdateCBSelection() {
            for (var nodes = graph.nodes(), i = 0, nc = nodes.length; i < nc; i++) {
                var d = nodes[i],
                    cb = $('#acb'+d.id);
                var checked = cb.prop('checked');
                if (checked != d.selected) {
                    setCheckboxState(cb, d.selected);
                }
            }
            updateCbAll();
        }
        graph.on('selectionChanged.init', UpdateCBSelection);
        UpdateCBSelection();
    };
    
    self.init = function(options) {
        $('#locaderCancel').click(function() { 
            if (loadCancelCallback) loadCancelCallback.apply();
            self.hidePreloader();
        });
        if (typeof (RemoveGraphOverlaps) !== "undefined") {
            if (!options.bodyMenu) options.bodyMenu = [];
            options.bodyMenu.push(
                {name: "Разложить граф", callback: function() { RemoveGraphOverlaps(graph, APP); }}
            );
        }
        /*---
        $('#menuButtons, #menuFooter .menuInner').empty();
        if (options.topButtons) addButtons(options.topButtons, $('#menuButtons'));
        if (options.bottomButtons) addButtons(options.bottomButtons, $('#menuFooter .menuInner'));
        if (options.linkMenu) createContextMenu('.xyz_link', options.linkMenu);
        if (options.bodyMenu) createContextMenu('#graph', options.bodyMenu);
        if (options.nodeMenu) createContextMenu('.ThemeRow, g.xyz_node', options.nodeMenu, function(data) {
            if (!data.selected) {
                $('#acb'+data.id).prop('checked', true);
                if (graph) graph.setNodeSelection(data.id, true);
                updateCbAll();
            }
        });
        */
    };
    
    //рассчитывает координаты вершин графа
    self.performLayout = function (graphData, type, callback) {
        callback.apply(null, [graphData]);
        return;


        if (graphData.Nodes.length == 0) {
            callback.apply(null, [graphData]);
            return;
        }
        if (graphData.Links.length == 0) {
            var dx = 1 / (graphData.Nodes.length + 1);
            for (var i = 0; i < graphData.Nodes.length; i++) {
                graphData.Nodes[i].X = (i+1)*dx;
                graphData.Nodes[i].Y = 0.5;
            }
            callback.apply(null, [graphData]);
            return;
        }
        var lq = [];
        for (var i = 0, n = graphData.Links.length; i < n; i++) {
            var l = graphData.Links[i];
            var x1 = (typeof l.source == "number") ? l.source : l.source.index;
            var x2 = (typeof l.target == "number") ? l.target : l.target.index;
            lq.push(x1+"t"+x2);
        }
        var query = {
            nodes: graphData.Nodes.length,
            type: type,
            l: lq
        };
        $.post('Layout.ashx', query).done(function(data) {
            if (typeof data != "object" || data.length != graphData.Nodes.length) {
                alert('Не удалось рассчитать координаты графа');
                return;
            }
            for (var i = 0, n = data.length; i < n; i++) {
                var p = graphData.Nodes[i],
                    d = data[i];
                p.X = d.X;
                p.Y = d.Y;
            }
            callback.apply(null, [graphData]);
        }).error(ajaxError);
    }
    
    /*---
    //добавляет кнопку в верхнюю или нижнюю панель
    function addButtons(buttons, $place) {
        if (!buttons.length) buttons = [buttons];
        var buttonTemplte = '<button type="button" class="CommandButton"><img class="CommandButton"></button>';
        for (var i = 0; i < buttons.length; i++) {
            var bt = buttons[i];
            var $b = $(buttonTemplte)
                .data('bt', bt)
                .attr('title', bt.title)
                .click(function() {
                    var data = $(this).data('bt');
                    data.click.apply(this, data);
                })
                .appendTo($place);
            $b.find('img').attr('src', bt.icon);
        }
        $('#menuButtons').toggle($('#menuButtons').children().length > 0);
        $('#menuFooter').toggle($('#menuFooter .menuInner').children().length > 0);
        $('#menuContent').toggleClass('bottom', $('#menuFooter .menuInner').children().length > 0);
    };*/
    
    //создает контекстное меню по селектору
    //items [{name:"foo", callback: bar}]
    function createContextMenu(selector, items, openCallback) {
        $.contextMenu('destroy', selector);
        $.contextMenu({
            selector: selector,
            zIndex: 1000,
            build: function ($this) {
                var data = $this.is('g') ?
                    $this.prop('__data__') :
                    $("input.ThemeCheckbox", $this).data('graph.id');
                APP.ContextMenuData = data;
                if (openCallback) openCallback.apply($this, [data]);
                return {
                    items: items.length ? items : items.apply($this, [data])
                };
            }
        });
    };
    
    return (self);
})();

//общая функция ошибки запроса
function ajaxError(data) {
    if (data.status === 0) return; //отмена запроса к серверу
    var msg;
    try {
        msg = data.responseText || JSON.stringify(data);
    } catch (e) {
        msg = data;
    }
    _notification.messageError($(msg).text(), "Error GraphLayout.js::ajaxError");

    if (console && console.log) {
        console.log(data.responseText ? data.responseText : JSON.stringify(data));
    }
}

//общая функция ошибки запроса
window.onerror = function(msg, url, line) {
    if (typeof (msg) !== "string") msg = JSON.stringify(msg);
    _notification.messageError(msg, "Error: GraphLayout.js::window.onerror");
};
