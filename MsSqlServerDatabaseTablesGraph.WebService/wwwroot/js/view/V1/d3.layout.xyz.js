d3.layout.xyz = function() {
    var graph = {},
        event = d3.dispatch(
            'nodeClick',  //клик по узлу графа
            'linkClick',  //клик по ребру графа
            'dragEnd',    //узел графа перетащили в новое место
            'selectionChanged', //изменился набор выделенных узлов
            'dataBound' //в граф загружены новые данные.
        ),
        nodes = [], //массив данных для нодов графа
        links = [], //массив данных для ребер графа
        svgDefs, //секция определений маркеров
        bgRect, //фоновый прямоугольник, отвечает за обработку перетаскивания и выделения рамкой
        selRect, //рамка выделения
        scalePane, //панель масштабирования/перетаскивания
        canvas, //панель, содержащая элементы графа
        nodesBlock, linksBlock, //группы для отрисовки узлов и связей графа
        nodeElems, //список svg элементов для нодов
        linkElems, //Список svg элементов для связей
        selection = [], //выделенные объекты данных
        drag = null, //менеджер перетаскивания нодов
        zoom = null, //менеджер перетаскивания/масштабирования графа
        zoomEnabled = false, //флаг включения перетаскивания
        skipZoomTimer = false,
        iconWidth = 16,  //размеры иконки узла дерева
        iconHeight = 16,
        iconSrc = null,
        version = 0,
        tx = 0, ty = 0, //смещение координат графа
        cScale = 1, //текущий внутренний масштаб графа
        tScale = 1, //тикущий общий масштаб графа
        graphScale = 1, //изменение масштаба графа применительно к координатам узлов
        simpleSelection = true, //использовать упрощеннный режим выделения узлов
        simpleZoom = false, //не использовать зум и перетаскивание по умолчанию, только через миникарту
        isIE = /*@cc_on!@*/false,
        SCALE_LEFT_BORDER = 0.5,
        SCALE_RIGHT_BORDER = 50,
        _useNodeMouseOverContrast = false;
    
        isIE = (isIE || !!$.detectIE());

    //задать/считать список вершин графа
    //принимает на вход массив объектов с полями:
    //x, y - координаты
    //name - подпись вершины, по умолчанию ""
    //title - подсказка, выводимая при наведении на вершину, по умолчанию = name
    //scale - изменяет масштаб иконки, по умолчанию 1
    //style - дополнительный css класс для раскраски вершины, по умолчанию undefined
    //icon - урл иконки узла, по умолчанию используется глобальная иконка, заданная через setIcon()
    //iconWidth, iconHeight - ширина и высота иконки узла, по умолчанию глобальные значения, заданные через iconSize()
    graph.nodes = function(x) {
        if (!arguments.length) return nodes;
        nodes = x;
        return graph;
    };
    
    graph.created = false;
    
    //возврат списка SVG элементов узлов графа
    graph.getNodeElems = function() {
        return nodeElems;
    };
    
    //возврат списка SVG элементов ребер графа
    graph.getLinkElems = function() { return linkElems; };
    
    //задать/считать список ребер графа
    //поля элементов:
    //source - индекс узла в массиве nodes, из которого выходит ребро, обязательное поле
    //target - индекс узла в массиве nodes, в котором заканчивается ребро, обязательное поле
    //type - тип ребра, по умолчанию 0
    //        d3.layout.xyz.LINK_TYPE_NONE = 0; //ребро графа без стрелочек
    //        d3.layout.xyz.LINK_TYPE_DIRECTED = 1; //направленное ребро графа с одной стрелочкой в target
    //        d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL = 2; //двунаправленное ребро графа с двумя стрелочками
    //title - подсказка, выводимая при наведении на вершину, по умолчанию ""
    //style - дополнительный css класс для раскраски ребра, по умолчанию undefined
    //width - толщина ребра, по умолчанию 1
    //color - цвет ребра
    graph.links = function(x) {
        if (!arguments.length) return links;
        links = x;
        return graph;
    };
    
    //задает базовые размеры иконки в узлах дерева.
    //при отображении базовый размер иконки умножается на параметр scale из данных узла
    graph.iconSize = function(w, h) {
        if (!arguments.length) return [iconWidth, iconHeight];
        iconWidth = w;
        iconHeight = h;
        return graph;
    };
    
    //Задает урл картинки узла графа
    graph.setIcon = function (url) {
        iconSrc = url;
        return graph;
    };

    /*function putToView() { $('#useNodeMouseOverContrast').attr('checked', _useNodeMouseOverContrast); };*/
    graph.loadFromLocalStorage = function () {
        var o = localStorageEx.gvm.load();
        if (o) {
            _useNodeMouseOverContrast = !!o.UseNodeMouseOverContrast;
        }
        //putToView();
        $('#useNodeMouseOverContrast').attr('checked', _useNodeMouseOverContrast);
    };
    graph.saveToLocalStorage = function () {
        var o = localStorageEx.gvm.load();
        if (o) {
            o.UseNodeMouseOverContrast = !!_useNodeMouseOverContrast;
        } else {
            o = { UseNodeMouseOverContrast: !!_useNodeMouseOverContrast };
        }
        localStorageEx.gvm.save(o);
    };
    graph.useNodeMouseOverContrast = function (value) {
        if (!arguments.length) return (_useNodeMouseOverContrast);
        value = !!value;
        if (_useNodeMouseOverContrast != value) {
            _useNodeMouseOverContrast = value;

            graph.saveToLocalStorage();
        }
    };

    //создать граф
    //selector - идентификатор элемента, в котором будет создан граф, по умолчанию body
    //width - ширина области графа, по умолчанию 100%
    //height - высота области графа, по умолчанию 100%
    graph.create = function(selector, width, height) {
        if (graph.created) return;
        graph.created = true;
        graph.loadFromLocalStorage();

        selector = (selector || "body");
        width = (width || "100%");
        height = (height || "100%");
        var svg = d3.select(selector)
            .append("svg:svg")
            .style("background-color", "#EEE")
            .attr("width", width)
            .attr("height", height);
        svgDefs = svg.append("svg:defs");
        //фон
        bgRect = svg.append("rect")
            .classed("xyz_background", true)
            .attr("width", width)
            .attr("height", height)
            .on("mousedown.graph", onBgMouseDown);
        if (!simpleSelection) {
            bgRect.on("click.graph", function (d) {
                if (!d3.event.shiftKey && !d3.event.ctrlKey) {
                    clearSelection();
                    event.selectionChanged({type: "selectionChanged"});
                }
            });
        }
        scalePane = svg.append("g");
        canvas = scalePane.append("g");
        linksBlock = canvas.append("g");
        nodesBlock = canvas.append("g");
        //рамка выделения
        selRect = svg.append("rect")
            .classed("xyz_selection_box", true)
            .attr("width", 0)
            .attr("height", 0)
            .style("display", "none");
        if (!simpleZoom) setZoom(true);
        graph.svgSelector = svg;
        graph.bgRectSelector = bgRect;
        graph.canvasSelector = canvas;
        return graph;
    };
    
    function getBBox() {
        var box = bgRect.node().getBBox();
        return {
            w: (box.width  - 70) * graphScale,
            h: (box.height - 10 /*70*/) * graphScale,
            x: 0,//35,
            y: 0,//10
        };
    }
    
    function all_nodes_mouseover() {
        if (_useNodeMouseOverContrast) {
            nodeElems.selectAll("text").attr("style", "fill: silver;");
            linkElems.attr("class", function (d) {
                var c = d3.select(this).attr("class");
                return ((c.indexOf(" all-link-mouseover") == -1) ? (c + " all-link-mouseover") : c);
            });
        }
    };
    function all_nodes_mouseout() {
        if (_useNodeMouseOverContrast) {
            nodeElems.selectAll("text").attr("style", null);
            linkElems.attr("class", function (d) {
                return (d3.select(this).attr("class").replaceAll(" all-link-mouseover", ""));
            });
        }
    };
    function node_mouseover($nodes) {
        $nodes.classed("xyz_mouseover", true);
        $nodes.selectAll("image:not(.xyz_marker)").transition().attr("x", "-10px").attr("y", "-10px").attr("width", "20px").attr("height", "20px");
        $nodes.selectAll("text").transition().attr("style", "font-size: 12px;" + (_useNodeMouseOverContrast ? "" : "fill: firebrick;"));
    };
    function node_mouseout($nodes) {
        $nodes.classed("xyz_mouseover", false);
        $nodes.selectAll("image:not(.xyz_marker)").transition()
            .attr("x", function (d) { return (d._ix); })
            .attr("y", function (d) { return (d._iy); })
            .attr("width", function (d) { return (d._iw); })
            .attr("height", function (d) { return (d._ih); });
        $nodes.selectAll("text").transition().attr("style", null );
    };
    function link_mouseover($links) {
        markers_hover($links, true);
        $links.transition().attr("class", function (d) {
            var c = d3.select(this).attr("class");
            return ((c.indexOf(" link-hover") == -1) ? (c + " link-hover") : c);
        }); //"link-hover");
    };
    function link_mouseout($links) {
        markers_hover($links, false);
        $links.transition().attr("class", function (d) {
            return (d3.select(this).attr("class").replaceAll(" link-hover", ""));
        }); //"link");
        //$links.classed("link-hover", false);
    };
    function markers_hover($links, hover) {
        function getColor(d) {
            return (hover ? "violet" : (d.color || null));
        };

        if (!isIE) {
            $links.attr("marker-start", function (d) {
                return d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL ?
                    markerFor(getColor(d), false) : null;
            }).attr("marker-end", function (d) {
                return d.type == d3.layout.xyz.LINK_TYPE_DIRECTED ||
                       d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL ?
                       markerFor(getColor(d), true) : null;
            })
        } else {
            //для IE маркеры рисуются в ручную, т.к. он падла глючит
            $links.each(function (d) {
                var $this = d3.select(this.parentNode),
                    marker = $this.select('g.xyz_marker_start');
                if (d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL) {
                    if (marker.node() == null) drawMarker($this, getColor(d), 'xyz_marker_start');
                } else {
                    marker.remove();
                }
                marker = $this.select('g.xyz_marker_end');
                if (d.type == d3.layout.xyz.LINK_TYPE_DIRECTED ||
                    d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL) {
                    if (marker.node() == null) drawMarker($this, getColor(d), 'xyz_marker_end');
                } else {
                    marker.remove();
                }
                $this.select('g.xyz_marker_start path,g.xyz_marker_end path').attr('fill', getColor(d));
            });
        }
    };
    function linkSelfArc(d) {
        var scale = (cScale < 1 ? cScale : (Math.min(3.6, Math.max(1, cScale * 0.7)))),
            linkOffset = d.linkOffset * 5;
        var rx = (20 + linkOffset) * scale,
            ry = (20 + linkOffset) * scale,
            dx = 2 * rx,
            rx2 = rx / 2 + 4 * scale /*half icon size*/,
            ry2 = ry / 2 + 4 * scale /*half icon size*/,
            cx = d.target.x - rx2,
            cy = d.target.y - ry2;
        var path = "M" + (cx - rx).toString() + "," + cy.toString() +
                   "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + dx.toString() + ",0" +
                   "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + -dx.toString() + ",0";
        return (path);
    };
    function linkSelfMarker(x, y) {
        var scale = (cScale < 1 ? cScale : (Math.min(3.6, Math.max(1, cScale * 0.7))));
        x -= 21 * scale;
        y -= 34 * scale;
        return ('translate(' + x + "," + y + ') rotate(-180)');
    };

    //инициализирует визуальные элементы графа по его данным
    graph.bind = function () {
        version++;
        //связывание данных для узлов
        var nc = nodes.length,
            lc = links.length,
            box = getBBox(),
            o;
        for (i = 0; i < nc; ++i) {
            (o = nodes[i]).index = i;
            if (typeof o.name == 'undefined') o.name = "";
            if (typeof o.title == 'undefined') o.title = o.name;
            if (typeof o.scale == 'undefined') o.scale = 1;
            o.weight = 0;
            o.version = version;
            o.x = o.X * box.w + box.x;
            o.y = o.Y * box.h + box.y;
        }
        var linkNum = {};
        for (i = 0; i < lc; ++i) {
            o = links[i];
            o.version = version;
            //замена индексов нодов на ссылки на ноды
            if (typeof o.source == "number") o.source = nodes[o.source];
            if (typeof o.target == "number") o.target = nodes[o.target];
            if (typeof o.type == 'undefined') o.type = 1;
            if (typeof o.title == 'undefined') o.title = "";
            if (typeof o.width == 'undefined') o.width = 1;
            //self-refs-link
            o.isSelfRefs = (o.source == o.target);
            //linkOffset - отклонение дуги ребра, обеспечивает возможность отрисовки нескольких ребер между двумя узлами.
            var invert = o.source.index > o.target.index;
            var nid = invert ? o.target.index + "_" + o.source.index : o.source.index + "_" + o.target.index;
            var n = linkNum[nid];
            n = (n ? n : 0) + 1;
            linkNum[nid] = n;
            var n2 = Math.floor(n/2);
            o.linkOffset = (n % 2 == 0) ^ invert ? n2 : -n2;
            ++o.source.weight;
            ++o.target.weight;
        }
        //для узлов с четным числом ссылок сделать чтобы дуги шли симметрично
        for (i = 0; i < lc; ++i) {
            o = links[i];
            var invert = o.source.index > o.target.index;
            var nid = invert ? o.target.index + "_" + o.source.index : o.source.index + "_" + o.target.index;
            var n = linkNum[nid];
            if (n % 2 == 0) {
                o.linkOffset -= invert ? -0.5 : 0.5;
            }
        }        
        linkNum = null;
    
        //обработчик перетаскивания узлов
        if (!drag) drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", onDrag)
            .on("dragend", function(d) { event.dragEnd({type: "dragEnd"}); });
        
        //вызывается при перетаскивании узла графа
        function onDrag(d) {
            d.x = d3.event.x;
            d.y = d3.event.y;
            var box = getBBox();
            d.X = (d.x - box.x) / box.w;
            d.Y = (d.y - box.y) / box.h;
            graph.drawNodes(d3.select(this));
            //:todo: сделать чтобы не все перерисовывались
            graph.drawLinks(linkElems);
        };
        
        // == создание ребер ==
        var d = linksBlock.selectAll("g.xyz_link").data(links);
        //группа, в которой находятся элементы ребра графа
        var enter = d.enter()
            .append("svg:g")
            .attr("class", "xyz_link")
            .on("mouseover.graph", function (d) {
                d3.select(this).classed("hover", true);
            })
            .on("mouseout.graph", function (d) {
                d3.select(this).classed("hover", false);
            });
        //линия ребра
        enter.append("svg:path")
            .attr("class", "xyz_link_path")
            .attr("id", function (d) { return ("l-" + d.id); });
        var path = d.select('path.xyz_link_path')
            .attr("stroke-width", function (d) {
                return (d.width);
            })
            .attr("stroke", function (d) {
                return (d.color || null);
            })
            .on("click.graph", function (d) {
                event.linkClick({type: "linkClick"});
            })
            .on("mouseover", function (d) {
                all_nodes_mouseover();
                link_mouseover(d3.select(this));
                var $nodes = d3.selectAll("#n-" + d.source.id + ",#n-" + d.target.id);
                node_mouseover($nodes);
            })
            .on("mouseout", function (d) {
                all_nodes_mouseout();
                link_mouseout(d3.select(this));
                var $nodes = d3.selectAll("#n-" + d.source.id + ",#n-" + d.target.id);
                node_mouseout($nodes);
            });
        markers_hover(path, false);
        /*
        if (!isIE) {
            path.attr("marker-start", function(d) {
                return d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL ?
                    markerFor(d.color, false) : null;
            }).attr("marker-end", function(d) {
                return d.type == d3.layout.xyz.LINK_TYPE_DIRECTED ||
                       d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL ?
                       markerFor(d.color, true) : null;
            })
        } else {
            //для IE маркеры рисуются в ручную, т.к. он падла глючит
            d.each(function(d, i) {
                var $this = d3.select(this),
                    marker = $this.select('g.xyz_marker_start');
                if (d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL) {
                    if (marker.node() == null) drawMarker($this, d.color, 'xyz_marker_start');
                } else {
                    marker.remove();
                }
                marker = $this.select('g.xyz_marker_end');
                if (d.type == d3.layout.xyz.LINK_TYPE_DIRECTED ||
                    d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL) {
                    if (marker.node() == null) drawMarker($this, d.color, 'xyz_marker_end');
                } else {
                    marker.remove();
                }
                $this.select('g.xyz_marker_start path,g.xyz_marker_end path').attr('fill', (d.color || null) );
            });
        }
        */
        //всплывающая подсказка ребра
        enter.append("title");
        d.select('title').text(function (d) { return d.title; });
            
        d.exit().remove();
        linkElems = d;
            
        // == создание узлов ==
        var mouseover_node_ids = [],
            mouseover_link_ids = [];
        d = nodesBlock.selectAll("g.xyz_node").data(nodes);
        //группа, в которой находятся элементы узла
        var enter = d.enter()
            .append("svg:g")
            .attr("class", "xyz_node")
            .on("click.graph", onNodeClick)
            .call(drag)
            .on("mouseover", function (d) {
                all_nodes_mouseover();
                node_mouseover( d3.select(this) );
                mouseover_node_ids = [];
                mouseover_link_ids = [];
                for (var i = 0, len = links.length; i < len; i++) {
                    var link = links[ i ];
                    if ( link.source.id == d.id ) {
                        mouseover_link_ids.push( "#l-" + link.id );
                        mouseover_node_ids.push( "#n-" + link.target.id );
                    } else 
                    if ( link.target.id == d.id ) {
                        mouseover_link_ids.push( "#l-" + link.id );
                        mouseover_node_ids.push( "#n-" + link.source.id );
                    }
                }
                if (mouseover_link_ids.length) link_mouseover( d3.selectAll(mouseover_link_ids.join(",")) );
                if (mouseover_node_ids.length) node_mouseover( d3.selectAll(mouseover_node_ids.join(",")) );
            })
            .on("mouseout", function (d) {
                all_nodes_mouseout();
                node_mouseout( d3.select(this) ); 
                if (mouseover_link_ids.length) link_mouseout( d3.selectAll(mouseover_link_ids.join(",")) );
                if (mouseover_node_ids.length) node_mouseout( d3.selectAll(mouseover_node_ids.join(",")) );
            });
            //.on("mouseover.graph", onMouseOver)
            //.on("mouseout.graph", onMouseOut)
        d.attr("id", function (d) { return ("n-" + d.id); }); //---function (d) { return d.id ? d.id : "n" + d.index; });
        //иконка узла
        enter.append("svg:image").attr("class", "xyz_icon");
        d.select("image.xyz_icon")
            .attr("transform", function (d) { 
                return d.scale == 1 ? null : "scale(" + d.scale + ")"; 
            })
            .attr("xlink:href", function(d) { return (d.icon || iconSrc); })
            .attr("x", function (d) { d._ix = -(d.iconWidth || iconWidth) / 2 + "px"; return (d._ix); })
            .attr("y", function (d) { d._iy = -(d.iconHeight || iconHeight) / 2 + "px"; return (d._iy); })
            .attr("width", function (d) { d._iw = (d.iconWidth || iconWidth) + "px"; return (d._iw); })
            .attr("height", function (d) { d._ih = (d.iconHeight || iconHeight) + "px"; return (d._ih); });
        //подпись узла
        enter.append("svg:text")
            .attr("class", "xyz_label")
            .attr("text-anchor", "middle")
            .attr("dy", "1em");
        d.select("text.xyz_label")
            .attr("y", function(d) { return ((d.iconHeight || iconHeight) / 2 * d.scale) + "px"; })
            .text(function (d) { return (" " + d.name + " "); }); //хак с пробелами для хрома, у которого появляются артефакты при перетаскивании
        //всплывающая подсказка у узла
        enter.append("title");
        d.select('title').text(function (d) { return d.title; });
        //кружочек выделения.
        enter.append("svg:circle")
            .attr("class", "xyz_node_selection");
        d.select(".xyz_node_selection")
            .attr("r", function(d) { return (d.iconWidth || iconWidth) / 2 * d.scale + 3; }) 
            //.call(graph.nodeCostructor);
        d.exit().remove();
        nodeElems = d;
        graph.drawLinks(linkElems);
        graph.drawNodes(nodeElems);
        //перерасчет выделения
        selection = [];
        for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (n.selected) selection.push(n);
        }
        if (!skipZoomTimer) {
            setTimeout(function () {
                //проверка чтобы граф не уезжал за пределы зоны перетаскивания
                var pt = checkTranslateBBox([tx, ty]);
                if (pt[0] != tx || pt[1] != ty) {
                    graph.translate(pt[0], pt[1]);
                }
            }, 1);
        }
        event.dataBound({type: "dataBound"});
    };
    
    //сохраняет нормализованное значение для текущих координат всех узлов графа.
    graph.saveNodeCoordinates = function() {
        var box = getBBox(), d;
        for (var i = 0, n = nodes.length; i < n; i++) {
            d = nodes[i];
            d.X = (d.x - box.x) / box.w;
            d.Y = (d.y - box.y) / box.h;
        }
    }
    
    //позиционирует вершины графа
    //nodes - список вершин для позиционирования (серектор)
    graph.drawNodes = function(nodes) {
        nodes.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; })
            .classed("selected", function(d) { return d.selected; });
        return graph;
    };    

    //позиционирует ребра графа
    //links - список ребер для позиционирования (серектор)
    graph.drawLinks = function(links) {
        //радиус иконки
        var iconRadius = iconWidth / 2;
        links.each(function(d) {
            var dx = d.target.x - d.source.x;
            var dy = d.target.y - d.source.y;
            var r = 0.0001;
            if (dx != 0 || dy != 0) {
                r = Math.sqrt(dx * dx + dy * dy);
            }
            //дополнительный отступ между иконкой и стрелочками
            var padding = 5;
            var size0 = d.source.iconWidth ? d.source.iconWidth * 0.7071 : iconRadius * d.source.scale; //sqrt(2)/2 = 0.7071
            var size1 = d.target.iconWidth ? d.target.iconWidth * 0.7071 : iconRadius * d.target.scale;
            var margin0 = (size0 + padding) / r;
            var margin1 = (size1 + padding) / r;
            var x0 = d.source.x + dx * margin0,
                y0 = d.source.y + dy * margin0,
                x1 = d.target.x - dx * margin1,
                y1 = d.target.y - dy * margin1;
            if (isNaN(x0) || isNaN(x1) || isNaN(y1)) {
                x0 = 0;
            }
            var path = this.firstChild;
            if (d.linkOffset != 0) {
                if (d.isSelfRefs) {
                    path.setAttribute('d', linkSelfArc(d));
                } else {
                    var OFFSET = 4; //макс расстояние между соседними ребрами в пикс
                    var c = OFFSET * d.linkOffset / r;
                    //сдвигаем ребро вбок на несколько пикселов
                    var ax = -dy * c,
                        ay = dx * c,
                        px0 = x0 + ax,
                        py0 = y0 + ay,
                        qx = ((x1 + x0) / 2 + ax * 5),
                        qy = ((y1 + y0) / 2 + ay * 5),
                        px1 = x1 + ax,
                        py1 = y1 + ay;
                    path.setAttribute('d', "M" + px0 + "," + py0 + "Q" + qx + "," + qy + " " + px1 + "," + py1);
                }
                //для IE нужно размещать маркеры вручную
                if (isIE) {
                    var $this = d3.select(this);
                    if (d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL) {
                        $this.select('g.xyz_marker_start')
                            .attr('transform', 'translate('+ px0 + "," + py0 +') rotate('+ 
                                Math.atan2(py0 - qy, px0 - qx)*180/Math.PI + ')');
                    }
                    if (d.type == d3.layout.xyz.LINK_TYPE_DIRECTED ||
                        d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL) {
                        var transform = d.isSelfRefs ? linkSelfMarker(px1, py1)
                                                     : ('translate('+ px1 + "," + py1 +') rotate('+ 
                                                            Math.atan2(py1 - qy, px1 - qx)*180/Math.PI + ')');
                        $this.select('g.xyz_marker_end').attr('transform', transform);
                    }
                }
            } else {
                if (d.isSelfRefs) {
                    path.setAttribute('d', linkSelfArc(d));
                } else {
                    path.setAttribute('d', "M" + x0 + "," + y0 + "L" + x1 + "," + y1);
                }
                //для IE нужно размещать маркеры вручную
                if (isIE) {
                    var $this = d3.select(this);
                    if (d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL) {
                        $this.select('g.xyz_marker_start')
                            .attr('transform', 'translate('+ x0 + "," + y0 +') rotate('+ 
                                Math.atan2(y0 - y1, x0 - x1)*180/Math.PI + ')');
                    }
                    if (d.type == d3.layout.xyz.LINK_TYPE_DIRECTED ||
                        d.type == d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL) {
                        var transform = d.isSelfRefs ? linkSelfMarker(x1, y1)
                                                     : ('translate(' + x1 + "," + y1 + ') rotate(' +
                                                               Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI + ')');
                        $this.select('g.xyz_marker_end').attr('transform', transform);
                    }
                }
            }
        });
        return graph;
    };
    
    //создает маркер с определенным цветом.
    function drawMarker(parent, color, className) {
        var g = parent.append("svg:g").attr("class", className);
        g.append("svg:path").attr("d", "M-8,-4L0,0L-8,4z").attr("fill", color).attr('stroke', 'none');
        return g;
    }
    
    var markers = {};
    //создает маркер с определенным цветом.
    function markerFor(color, forward) {
        var id = (forward ? 'f' : 'b') + (color+"").replace(/[^a-z0-9A-Z]/g, '-');
        if (!markers[id]) {
            var marker = svgDefs.append("svg:marker")
                .attr("id", id)
                .attr("viewBox", "0 -5 10 10")
                .attr("markerWidth", 8)
                .attr("markerHeight", 8)
                .attr("orient", "auto")
                .attr("fill", color)
                .attr("markerUnits", "userSpaceOnUse");
            if (forward) {
                marker.attr("refX", "6").append("svg:path").attr("d", "M0,-5L10,0L0,5z");
            } else {
                marker.attr("refX", "4").append("svg:path").attr("d", "M10,-5L0,0L10,5z");
            }
            markers[id] = true;
        }
        return ("url(#" + id + ")");
    }
    
    //возвращает объекты данных для выделенных объектов
    graph.getSelection = function() {
        //копия массива выделения
        return selection.slice(0);
    }
    
    //выделить все узлы на графе
    graph.selectAll = function() {
        setSelection(nodeElems);
    }
    
    //снять выделение со всех узлов
    graph.clearSelection = function() {
        clearSelection();
    }
    
    //выделить узел с указанным индексом
    graph.setNodeSelection = function(id, isSelected) {
        var node = nodeElems.filter(function (d) { return d.id == id; });
        if (isSelected) {
            setSelection(node);
        } else {
            clearSelection(node);
        }
    }
    
    //сброс масштаба в графе.
    graph.resetZoom = function() {
        if (zoom == null) return;
        zoom.scale(1);
        cScale = tScale = graphScale = 1;
        tx = ty = 0;
        zoom.translate([tx, ty]);
        scalePane.attr("transform", "translate(" + tx + "," + ty + ") scale(1)");
        graph.bind();
    }
    
    //обработка нажатия мыши на фоне для определения режима: выделение рамкой или перетаскивание.
    function onBgMouseDown() {
        //return;

        if (simpleZoom || d3.event.shiftKey || d3.event.ctrlKey) {
            setZoom(false);
            //---setSelectionBox(this);
            setMove(this);
        }

        /*if (simpleZoom) {
            setZoom(false);
            if (d3.event.shiftKey || d3.event.ctrlKey) {
                setSelectionBox(this);
            } else {
                setMove(this);
            }
        }*/
    }
    
    function setMove(target) {
        var p0 = d3.mouse(canvas.node());
        var w = d3.select(window)
            .on("mousemove.graph", move)
            .on("mouseup.graph", moveEnd, true);

        window.focus();
        d3.event.stopPropagation();
        d3.event.preventDefault();

        function move() {
            var p1 = d3.mouse(target.parentNode),
                dx = p1[0] - p0[0],
                dy = p1[1] - p0[1];
            graph.translate(dx, dy);
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }
        function moveEnd() {
            w.on("mousemove.graph", null).on("mouseup.graph", null);
            if (!simpleZoom) setZoom(true);
        }
    }
    
    //вызывается по клику на узле графа
    function onNodeClick(d) {
        /*---
        var node = d3.select(this);
        if (simpleSelection || d3.event.shiftKey || d3.event.ctrlKey) {
            if (d.selected) {
                clearSelection(node);
            } else {
                setSelection(node);
            }
        } else {
            clearSelection();
            setSelection(node);
        }
        */

        event.nodeClick({ type: "nodeClick" });
        event.selectionChanged({ type: "selectionChanged" });

        /*if (d3.event.shiftKey || d3.event.ctrlKey) {            
            if (d.marker) {
                d3.select(this).select("image.xyz_marker").remove();
            } else {
                d3.select(this)
                    .append("svg:image")
                    .classed("xyz_marker", true)
                    .attr("xlink:href", config.appRootPath + "css/view/V1/graphLayout/plus.gif")
                    .attr("x", d.iconWidth / 2 + 2)
                    .attr("y", -d.iconHeight / 2 - 3)
                    .attr("width", "9")
                    .attr("height", "9");
            }
            d.marker = !d.marker;
        } else {
            event.nodeClick({ type: "nodeClick" });
            event.selectionChanged({ type: "selectionChanged" });
        }*/
    }
    
    //событие масштабирования/перетаскивания графа
    function transformEvent() {
        var nearest;
        if (this == scalePane.node()) {
            var pt = d3.mouse(this),
                x0 = pt[0],
                y0 = pt[1],
                minW = Number.MAX_VALUE,
                minH = Number.MAX_VALUE;
            d3.selectAll(".xyz_mouseover").each(function (d) {
                var w = Math.abs(x0 - d.x),
                    h = Math.abs(y0 - d.y);
                if (w <= minW && h <= minH) {
                    minW = w;
                    minH = h;
                    nearest = { x0: d.x, y0: d.y, node: d };
                }
            });
        }

        //var ds = 1;
        if (d3.event.scale != cScale) {
            //ds = d3.event.scale / cScale;
            cScale = d3.event.scale;
            if (d3.event.sourceEvent.shiftKey) {
                tScale = cScale / graphScale;
            } else {
                graphScale = cScale / tScale;
                graph.bind();
                //tScale = 1;
            }
        }
        
        if (nearest) {
            tx -= nearest.node.x - nearest.x0;
            ty -= nearest.node.y - nearest.y0;

            zoom.translate([tx, ty]);
            skipZoomTimer = true;
        } else {
            skipZoomTimer = false;
            var pt = checkTranslateBBox(d3.event.translate);
            tx = pt[0];
            ty = pt[1];            
        }
        scalePane.attr("transform", "translate(" + tx + "," + ty + ") scale(" + tScale + ")");
    }
    
    function checkTranslateBBox(point) {
        var cbox  = canvas.node().getBBox(),
            bbox  = bgRect.node().getBBox(),
            pad_x = 0,
            pad_y = 15,
            x1 = bbox.width  - cbox.width  - cbox.x - pad_x,
            y1 = bbox.height - cbox.height - cbox.y - pad_y,
            x2 = -cbox.x + pad_x,
            y2 = -cbox.y + pad_y;
        if (cScale < 1) {
            x1 *= cScale;
            y1 *= cScale;
            x2 *= cScale;
            y2 *= cScale;
        }
        return [Math.max(x1, Math.min(x2, point[0])),
                Math.max(y1, Math.min(y2, point[1]))];
    }
    
    //скролл графа
    graph.translate = function(x, y) {
        tx = x;
        ty = y;
        if (zoom == null) {
            zoom = d3.behavior.zoom().scaleExtent([SCALE_LEFT_BORDER, SCALE_RIGHT_BORDER]).on("zoom", transformEvent);
        }
        zoom.translate([x, y]);
        scalePane.attr("transform", "translate(" + tx + "," + ty + ") scale(" + tScale + ")");
    }
    
    //изменение масштаба графа
    graph.scale = function(scale) {
        if (!arguments.length) return cScale;
        if (scale == 0) return;
        scale = parseFloat(scale)
        var ds = scale / cScale - 1;
        cScale = scale;
        tScale = 1;
        graphScale = cScale / tScale;
        zoom.scale(graphScale);
        //сместить граф, чтобы центр экрана при новом масштабе остался на месте.
        var bbox = bgRect.node().getBBox(),
            w = bbox.width / 2, 
            h = bbox.height / 2,
            dx = (w - tx) * ds,
            dy = (h - ty) * ds;
        graph.translate(tx - dx, ty - dy);
        graph.bind();
    }
    
    //в режиме простого масштабирования масштабирование происходит только через миникарту
    graph.simpleZoom = function(value) {
        //cast to bool
        value = !!value;
        simpleZoom = value;
        setZoom(!value);
    }
    
    //Включает-выключает масштабирование и перетаскивание графа
    function setZoom(enable) {
        if (enable && zoomEnabled) return;
        if (enable) {
            if (zoom == null) {
                zoom = d3.behavior.zoom().scaleExtent([SCALE_LEFT_BORDER, SCALE_RIGHT_BORDER]).on("zoom", transformEvent);
            }            
            bgRect.call(zoom);
            //*
            scalePane.call(zoom);
            //*/
        } else {
            if (zoom != null) {
                bgRect.on("mousedown.zoom", null)
                    .on("mousewheel.zoom", null)
                    .on("mousemove.zoom", null)
                    .on("DOMMouseScroll.zoom", null)
                    .on("dblclick.zoom", null)
                    .on("touchstart.zoom", null)
                    .on("touchmove.zoom", null)
                    .on("touchend.zoom", null);
                //*
                scalePane.on("mousedown.zoom", null)
                    .on("mousewheel.zoom", null)
                    .on("mousemove.zoom", null)
                    .on("DOMMouseScroll.zoom", null)
                    .on("dblclick.zoom", null)
                    .on("touchstart.zoom", null)
                    .on("touchmove.zoom", null)
                    .on("touchend.zoom", null);
                //*/
                d3.select(window).on("mousemove.zoom", null).on("mouseup.zoom", null);
                if (d3.event && d3.event.stopImmediatePropagation) d3.event.stopImmediatePropagation();
            }
        }
        zoomEnabled = enable;
    }
    
    //отрисовка рамки выделения
    function setSelectionBox(target) {
        var p0 = d3.mouse(target.parentNode),
            pc = d3.mouse(canvas.node());
        var w = d3.select(window)
            .on("mousemove.graph", selMove)
            .on("mouseup.graph", selEnd, true);
        
        window.focus();
        d3.event.stopPropagation();
        d3.event.preventDefault();
        
        function selMove() {
            var p = d3.mouse(target.parentNode),
                dx = p[0] - p0[0],
                dy = p[1] - p0[1];
            selRect.attr("x", Math.min(p0[0], p[0]))
                   .attr("y", Math.min(p0[1], p[1]))
                   .attr("width", Math.abs(dx)).attr("height", Math.abs(dy))
                   .style("display", "inline");
            d3.event.stopPropagation();
            d3.event.preventDefault();
        }        
        function selEnd() {
            w.on("mousemove.graph", null).on("mouseup.graph", null);
            selRect.style("display", "none");
            if (!simpleZoom) setZoom(true);
            var p = d3.mouse(canvas.node()),
                x0 = Math.min(pc[0], p[0]),
                y0 = Math.min(pc[1], p[1]),
                x1 = Math.max(pc[0], p[0]),
                y1 = Math.max(pc[1], p[1]);
            var toSelect = nodeElems.filter(function(d) { 
                return d.x >= x0 && d.y >= y0 && d.x <= x1 && d.y <= y1;
            });
            //не изменять выделение, если рамкой не выделено ни одного узла
            if (simpleSelection && toSelect.node() == null) {
                return;
            }
            clearSelection();
            setSelection(toSelect);
            event.selectionChanged({type: "selectionChanged"});
        }
    }
    
    //устанавливает выделение на узлы
    function setSelection(nodes) {
        nodes.each(function(d) {
            if (!d.selected) {
                selection.push(d);
                d.selected = true;
            }
        });
        graph.drawNodes(nodes);
    }
    
    //снимает выделение с узлов
    function clearSelection(nodes) {
        if (!nodes) {
            //полная очистка выделения
            var n = selection.length;
            for (var i = 0; i < n; i++) {
                selection[i].selected = false;
            }
            selection = [];
            graph.drawNodes(nodeElems);
            return;
        }
        nodes.each(function(d) {
            if (d.selected) {
                var n = selection.length;
                for (var i = 0; i < n; i++) {
                    if (selection[i] == d) {
                        selection.splice(i, 1);
                        break;
                    }
                }
                d.selected = false;
            }
        });
        graph.drawNodes(nodes);
    }
    
    return d3.rebind(graph, event, "on");
}
d3.layout.xyz.LINK_TYPE_NONE = 0; //ребро графа без стрелочек
d3.layout.xyz.LINK_TYPE_DIRECTED = 1; //направленное ребро графа с одной стрелочкой в target
d3.layout.xyz.LINK_TYPE_BIDIRECTIONAL = 2; //двунаправленное ребро графа с двумя стрелочками
