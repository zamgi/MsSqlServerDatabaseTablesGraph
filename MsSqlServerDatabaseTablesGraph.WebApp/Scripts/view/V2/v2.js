var gvm = {};

function graphCreator(data, size) {
    var DISTANCE_DEFAULT = 300,
        GRAVITY_DEFAULT  = 0.01,
        CHARGE_DEFAULT   = -170;
    var _ = {
        isIE: (/*@cc_on!@*/false || !!$.detectIE()),

        DISTANCE: DISTANCE_DEFAULT,
        GRAVITY : GRAVITY_DEFAULT,
        CHARGE  : CHARGE_DEFAULT,

        Data: data,

        d3Nodes: null,
        d3Links: null,
        
        Svg: null,
        G: null,
        SvgRect: null,
        EventD3: null,
        DragFuncOrigin: null,
        DrawFunc: null,
        Force: null,
        ForceDrag: null,
        UseD3ForceRendering: true,
        UseNodeMouseOverContrast: false,
    };
    var self = {
        UseD3ForceRendering: function (value) {
            if (!arguments.length) return (_.UseD3ForceRendering);
            _.UseD3ForceRendering = !!value;

            this.SaveToLocalStorage();
        },
        UseNodeMouseOverContrast: function (value) {
            if (!arguments.length) return (_.UseNodeMouseOverContrast);
            _.UseNodeMouseOverContrast = !!value;

            this.SaveToLocalStorage();
        },

        DistanceGraph: function (value) {
            if (!arguments.length) return (_.DISTANCE);
            if (value != null && value != undefined && _.DISTANCE != value) {
                _.DISTANCE = value;
                _.Force.distance(_.DISTANCE).start();

                this.SaveToLocalStorage();
            }
        },
        GravityGraph: function (value) {
            if (!arguments.length) return (_.GRAVITY);
            if (value != null && value != undefined && _.GRAVITY != value) {
                _.GRAVITY = value;
                _.Force.gravity(_.GRAVITY).start();

                this.SaveToLocalStorage();
            }
        },
        ChargeGraph: function (value) {
            if (!arguments.length) return (_.CHARGE);
            if (value != null && value != undefined && _.CHARGE != value) {
                _.CHARGE = value;
                _.Force.charge(_.CHARGE).start();

                this.SaveToLocalStorage();
            }
        },

        DistanceGraphReset: function () {            
            _.Force.distance(DISTANCE_DEFAULT).start();

            if (_.DISTANCE != DISTANCE_DEFAULT) {
                _.DISTANCE = DISTANCE_DEFAULT;
                this.SaveToLocalStorage();
            }
            return (DISTANCE_DEFAULT);
        },
        GravityGraphReset: function () {            
            _.Force.gravity(GRAVITY_DEFAULT).start();

            if (_.GRAVITY != GRAVITY_DEFAULT) {
                _.GRAVITY = GRAVITY_DEFAULT;
                this.SaveToLocalStorage();
            }
            return (GRAVITY_DEFAULT);
        },
        ChargeGraphReset: function () {            
            _.Force.charge(CHARGE_DEFAULT).start();

            if (_.CHARGE != CHARGE_DEFAULT) {
                _.CHARGE = CHARGE_DEFAULT;
                this.SaveToLocalStorage();
            }
            return (CHARGE_DEFAULT);
        },

        LoadFromLocalStorage: function () {
            var o = localStorageEx.gvm.load();
            if (o) {
                _.UseD3ForceRendering      = !!o.UseD3ForceRendering;
                _.UseNodeMouseOverContrast = !!o.UseNodeMouseOverContrast;
                _.DISTANCE = $.isNumeric(o.DISTANCE) ? o.DISTANCE : DISTANCE_DEFAULT;
                _.GRAVITY  = $.isNumeric(o.GRAVITY ) ? o.GRAVITY  : GRAVITY_DEFAULT;
                _.CHARGE   = $.isNumeric(o.CHARGE  ) ? o.CHARGE   : CHARGE_DEFAULT;
            }
            this.PutToView();
        },
        SaveToLocalStorage: function () {
            var o = localStorageEx.gvm.load();
            if (o) {
                o.UseD3ForceRendering      = !!_.UseD3ForceRendering;
                o.UseNodeMouseOverContrast = !!_.UseNodeMouseOverContrast;
                o.DISTANCE = _.DISTANCE;
                o.GRAVITY  = _.GRAVITY;
                o.CHARGE   = _.CHARGE;
            } else {
                o = {
                    UseD3ForceRendering     : !!_.UseD3ForceRendering,
                    UseNodeMouseOverContrast: !!_.UseNodeMouseOverContrast,
                    DISTANCE : _.DISTANCE,
                    GRAVITY  : _.GRAVITY,
                    CHARGE   : _.CHARGE
                };
            }
            localStorageEx.gvm.save(o);

            this.PutToView();
        },
        PutToView: function () {
            $('#aliveGraph').attr('checked', _.UseD3ForceRendering);
            $('#useNodeMouseOverContrast').attr('checked', _.UseNodeMouseOverContrast);

            $('#distanceGraph').val(_.DISTANCE);
            $('#gravityGraph').val(_.GRAVITY);
            $('#chargeGraph').val(_.CHARGE);
        }
    };

    function node_dblclick(d) {
        DAL.RootTableNames((typeof (d) == "object") ? d.name : d);
        //graphCreator();

        window.location = DAL.ToUrlV2(getGraphViewPortSize());
        if (d3 && d3.event) { d3.event.cancelBubble = true; }
    };
    function node_click(d) {
        console.log('node_click-event: ' + d);
    };
    function all_nodes_mouseover() {
        if (_.UseNodeMouseOverContrast) {
            _.d3Nodes.selectAll("text:not(.node-text-center):not(.node-text-center-shadow)").attr("style", "fill: silver;");
            _.d3Nodes.selectAll("text.node-text-center").attr("style", "fill: silver;");
            _.d3Nodes.selectAll("circle.node-circle-center").attr("class", "node-circle-center-mouseover");
            /*_.d3Links.attr("class", function (d) {
                var c = d3.select(this).attr("class");
                return ((c.indexOf(" all-link-mouseover") == -1) ? (c + " all-link-mouseover") : c);
            });*/
        }
    };
    function all_nodes_mouseout() {
        if (_.UseNodeMouseOverContrast) {
            _.d3Nodes.selectAll("text:not(.node-text-center):not(.node-text-center-shadow)").attr("style", "fill: black;");
            _.d3Nodes.selectAll("text.node-text-center").attr("style", null);
            _.d3Nodes.selectAll("circle.node-circle-center-mouseover").attr("class", "node-circle-center");
            /*_.d3Links.attr("class", function (d) {
                return (d3.select(this).attr("class").replaceAll(" all-link-mouseover", ""));
            });*/
        }
    };
    function node_mouseover($nodes) {
        $nodes.selectAll("image").transition().attr("x", "-10px").attr("y", "-10px").attr("width", "20px").attr("height", "20px");
        $nodes.selectAll("text").transition().attr("style", function (d) {
            var style = "";
            if (_.UseNodeMouseOverContrast) {
                if (d.selected && d3.select(this).classed("node-text-center")) {
                    style = "fill: black;";
                }
            } else {
                if (!d.selected || d3.select(this).classed("node-text-center")) {
                    style = "fill: firebrick;";
                }
            }
            return ((d.selected ? "font-size: 14px;" : "font-size: 12px;") + style);
        });
        $nodes.selectAll("circle.node-circle-center-mouseover").attr("class", "node-circle-center");
    };
    function node_mouseout($nodes) {
        $nodes.selectAll("image").transition().attr("x", "-8px").attr("y", "-8px").attr("width", "16px").attr("height", "16px");
        $nodes.selectAll("text").transition().attr("style", function (d) {
            return ((d.selected ? "" : "font-size: 10px;") + ((_.UseNodeMouseOverContrast || d.selected) ? "" : "fill: black;"));
        });
    };
    function link_mouseover($links) {
        $links.attr("marker-end", getArrowHover)
            .transition()
            .attr("class", "link-hover");
    };
    function link_mouseout($links) {
        $links.attr("marker-end", getArrow)
            .transition()
            .attr("class", "link");
    };

    //-----------------------------------------------------//

    d3.select("#svg_graph_div *").remove();

    _.Svg = d3.select("#svg_graph_div").append("svg:svg").attr("width", size.w).attr("height", size.h);

    // Per-type markers, as they don't inherit styles.
    _.Svg.append("svg:defs").selectAll("marker")
        .data(["arrow", "arrow2Self", "arrow-hover", "arrow2Self-hover"])
        .enter().append("svg:marker").attr("id", String)
        .attr("viewBox", "0 -5 10 15")
        .attr("refX", 12).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-4L17,0L0,4")
        .attr("class", "arrow");
    _.Svg.selectAll("#arrow2Self, #arrow2Self-hover").attr("refX", 10);
    _.Svg.selectAll("#arrow-hover path, #arrow2Self-hover path").attr("class", "arrow-hover");
    
    _.G = _.Svg.append("g")
                .attr("transform", "translate(" + (-size.w / 4) + ", " + (-size.h / 4) + ")")
                .call(d3.behavior.zoom().scaleExtent([0.1, 10]).on("zoom", zoom_pan_transform))
            .append("g");
    _.SvgRect = _.G.append("rect")
        .style("fill", "white")
        .style("stroke", "gray").style("stroke-width", "1").style("stroke-dasharray", "1, 2")
        .attr("width", size.w).attr("height", size.h);

    var isMousedown = false, svgX, svgY, svgElem = _.Svg[0][0];
    $("#svg_graph_div svg")
        .mousedown(function (e) {
            var se = ($.detectFireFox() ? e.originalEvent.target : e.srcElement);
            if (isMousedown = (se == svgElem)) {
                svgX = e.screenX;
                svgY = e.screenY;
            }
        })
        .mousemove(function (e) {
            if (isMousedown) {
                var tr = d3.transform(_.G.attr("transform"));
                _.G.attr("transform", "translate(" + (tr.translate[0] + (e.screenX - svgX)) + "," +
                                                     (tr.translate[1] + (e.screenY - svgY)) + ") " +
                                      "scale(" + tr.scale[0] + "," + tr.scale[1] + ")");
                svgX = e.screenX;
                svgY = e.screenY;
            }
        })
        .mouseup(function () {
            isMousedown = false;
        });
    //-----------------------------------------------------//

    self.LoadFromLocalStorage();
    (function initForce(size) {
        _.Force = d3.layout.force()//---.on("tick", draw)
                    .gravity(_.GRAVITY)
                    .distance(_.DISTANCE)
                    .charge(_.CHARGE)
                    .size([size.w, size.h]);

        if (_.UseD3ForceRendering) {
            function force_dragstart(d) {
                d3.select(this).classed("fixed", d.fixed = true);
            };

            _.ForceDrag = _.Force.drag().on("dragstart", force_dragstart);
        } else {
            function getBBox() {
                var box = _.SvgRect.node().getBBox();
                return {
                    w: (box.width  - 70),// * graphScale,
                    h: (box.height - 70),// * graphScale,
                    x: 35, y: 10
                };
            };
            //вызывается при перетаскивании узла графа
            function onDragEvent(d) {
                d.x = d3.event.x;
                d.y = d3.event.y;
                var box = getBBox();
                d.X = (d.x - box.x) / box.w;
                d.Y = (d.y - box.y) / box.h;

                _.DrawFunc();
                //---graph.drawNodes(d3.select(this));
                //:todo: сделать чтобы не все перерисовывались
                //---graph.drawLinks(linkElems);
            };

            _.EventD3 = d3.dispatch(
                        "nodeClick",  //клик по узлу графа
                        "linkClick",  //клик по ребру графа
                        "dragEnd",    //узел графа перетащили в новое место
                        "selectionChanged", //изменился набор выделенных узлов
                        "dataBound" //в граф загружены новые данные.
                    );
            _.DragFuncOrigin = d3.behavior.drag()
                    .origin(Object)
                    .on("drag", onDragEvent)
                    .on("dragend", function (d) { _.EventD3.dragEnd({ type: "dragEnd" }); });
        }
    })(size);

    function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return ("M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y);
    };
    function linkSelfArc(d) {
        var linkOffset = d.linkOffset * 5;
        var rx = 30 + linkOffset,
            ry = 30 + linkOffset,
            dx = 2 * rx,
            rx2 = rx / 2 + 6 /*half icon size*/,
            ry2 = ry / 2 + 6 /*half icon size*/,
            cx = d.target.x - rx2,
            cy = d.target.y - ry2;
        var path = "M" + (cx - rx).toString() + "," + cy.toString() +
                   "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + dx.toString() + ",0" +
                   "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + -dx.toString() + ",0";
        return (path);
    };
    function linkPathLine(d) {
        //радиус иконки
        var iconWidth = 16,
            iconRadius = iconWidth / 2;
        var dx = d.target.x - d.source.x;
        var dy = d.target.y - d.source.y;
        var r = 0.0001;
        if (dx != 0 || dy != 0) {
            r = Math.sqrt(dx * dx + dy * dy);
        }
        //дополнительный отступ между иконкой и стрелочками
        var padding = 5;
        var size0 = d.source.iconWidth ? d.source.iconWidth * 0.7071 : iconRadius * (d.source.scale || 1); //sqrt(2)/2 = 0.7071
        var size1 = d.target.iconWidth ? d.target.iconWidth * 0.7071 : iconRadius * (d.target.scale || 1);
        var margin0 = (size0 + padding) / r;
        var margin1 = (size1 + padding) / r;
        var x0 = d.source.x + dx * margin0,
            y0 = d.source.y + dy * margin0,
            x1 = d.target.x - dx * margin1,
            y1 = d.target.y - dy * margin1;
        if (isNaN(x0) || isNaN(x1) || isNaN(y1)) {
            x0 = 0;
        }

        if (d.linkOffset != 0) {
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
            return ("M" + px0 + "," + py0 + "Q" + qx + "," + qy + " " + px1 + "," + py1);
        }
        return ("M" + x0 + "," + y0 + "L" + x1 + "," + y1);
    };
    function linkPath(d) {
        if (d.isSelfRefs) {
            return (linkSelfArc(d));
        }
        return (linkPathLine(d));
    };
    function strokeWidth(d) {
        var sw = 0.13, i = d.sourceFields.length - 1;
        if (d.source != d.target) {
            switch (i) {
                case 1: sw += 0.09; break;
                case 2: sw += 0.15; break;
                case 3: sw += 0.19; break;
                case 4: sw += 0.23; break;
                default: sw += (i * 0.03); break;
            }
        }
        return ("stroke-width: " + sw + "em");
    };
    function getArrow(d) {
        if (!_.isIE) {
            return (d.isSelfRefs ? "url(#arrow2Self)" : "url(#arrow)");
        } return (null);        
    };
    function getArrowHover(d) {
        if (!_.isIE) {
            return (d.isSelfRefs ? "url(#arrow2Self-hover)" : "url(#arrow-hover)");
        } return (null);        
    };

    function update(scale) {
        if (typeof (scale) == "undefined") {
            scale = 1.0;
        }

        /*_.d3Nodes.selectAll("image")
            .transition()
            .attr("width" , parseInt(16 / scale) + "px")
            .attr("height", parseInt(16 / scale) + "px");

        _.d3Nodes.selectAll("text")
            .transition()
            .attr("style", "font-size: " + parseInt(10 / scale) + "px");

        _.d3Links.transition()
            .attr("stroke-width", (0.01 / scale) + "em" );
        //*/

        _.Force.nodes(_.Data.nodes)
               .links(_.Data.links)
               .distance(_.DISTANCE / scale)
               .charge(_.CHARGE / scale)
               .start();
    };
    function draw() {
        _.d3Links.attr("d", linkPath);
        //_.d3Links.attr("x1", function (d) { return d.source.x /*+ (d.value * 2)*/; })
        //         .attr("y1", function (d) { return d.source.y /*+ (d.value * 2)*/; })
        //         .attr("x2", function (d) { return d.target.x /*+ (d.value * 2)*/; })
        //         .attr("y2", function (d) { return d.target.y /*+ (d.value * 2)*/; });

        _.d3Nodes.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
    };
    function zoom_pan_transform() {
        _.G/*.transition().duration(500)*/
           .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");

        //*/update(d3.event.scale);//*/

        /*
        var scale = (d3.event.scale > 1.0) ? 1.0 : d3.event.scale;
        update( scale );//(scale >= 1.0) ? 1.0 : (scale * 2));
        //*/

        /*
        //_.SvgRect.attr("transform", "scale(" + 1 / d3.event.scale + ")");
        var w = document.body.clientWidth;
        var h = window.outerHeight;
        _.SvgRect.attr("transform", "translate(" + d3.event.translate + ")")
                 .attr("width" , ((d3.event.scale >= 1.0) ? w : (w / d3.event.scale)))
                 .attr("height", ((d3.event.scale >= 1.0) ? h : (h / d3.event.scale)));
        //*/
    };

    $(window).resize(function () {
        var size = getGraphViewPortSize();

        d3.select("#svg_graph_div svg").attr("width", size.w).attr("height", size.h);
        _.G.attr("width", size.w).attr("height", size.h);
        _.SvgRect.attr("width", size.w).attr("height", size.h);

        if (_.UseD3ForceRendering) {
            _.Force.size([size.w, size.h]);
            if (_.Data) {
                update();
            }
        }
    });

    _.DrawFunc = draw;
    
    (function load_graph_json(data) {
        var linkNum = {}, o,
            links = _.Data.links,
            lc = links.length;
        for (var i = 0; i < lc; ++i) {
            o = links[i];
            //self-refs-link
            o.isSelfRefs = (o.source == o.target);
            //linkOffset - отклонение дуги ребра, обеспечивает возможность отрисовки нескольких ребер между двумя узлами.
            var invert = o.source/*.index*/ > o.target/*.index*/;
            var nid = invert ? o.target/*.index*/ + "_" + o.source/*.index*/ : o.source/*.index*/ + "_" + o.target/*.index*/;
            var n = linkNum[nid];
            n = (n ? n : 0) + 1;
            linkNum[nid] = n;
            var n2 = Math.floor(n / 2);
            o.linkOffset = (n % 2 == 0) ^ invert ? n2 : -n2;
        }
        //для узлов с четным числом ссылок сделать чтобы дуги шли симметрично
        for (i = 0; i < lc; ++i) {
            o = links[i];
            var invert = o.source/*.index*/ > o.target/*.index*/;
            var nid = invert ? o.target/*.index*/ + "_" + o.source/*.index*/ : o.source/*.index*/ + "_" + o.target/*.index*/;
            var n = linkNum[nid];
            if (n % 2 == 0) {
                o.linkOffset -= invert ? -0.5 : 0.5;
            }
        }
        linkNum = null; links = null;
        //-----------------------------------------------------------------------//

        _.d3Links = _.G.selectAll("path.link")//---.selectAll("line.link")
            .data(_.Data.links)
            .enter().append("svg:path")//---.append("svg:line")
            .attr("class", "link")
            .attr("style", strokeWidth)
            .attr("id", function (d) { return ("l-" + d.id); })
            /*.attr("x1", function (d) { return d.source.x; })
            .attr("y1", function (d) { return d.source.y; })
            .attr("x2", function (d) { return d.target.x; })
            .attr("y2", function (d) { return d.target.y; })*/
            .on("click", function (d) {
                $('#selectedLink_source').html("'" + d.source.name.replace(".", "<wbr/>.") + "'");
                $('#selectedLink_target').html("'" + d.target.name.replace(".", "<wbr/>.") + "'");
                $('#selectedLink_sourceFields').html(d.sourceFields.join("<br/>"));
                $('#selectedLink_targetFields').html(d.targetFields.join("<br/>"));
                $('#selectedLinkCaption').show();
                commonArea.animate.opacity($('#selectedLink').show());
            });
        _.d3Links.append("title").text(function (d) {
            return ("'" + d.sourceFields + "' - '" + d.targetFields + "'");
        });
        /*
        var linktext = _.G.append("svg:g").selectAll("g.linklabelholder").data( _.Data.links );
        linktext.enter().append("g").attr("class", "linklabelholder")
            .append("text")
            .attr("class", "linklabel")
            .style("font-size", "13px")
            .attr("x", "50")
            .attr("y", "150")
            //.attr("x", function (d) { return d.source.x; })
            //.attr("y", function (d) { return d.source.y; })
            .attr("text-anchor", "start")
            .style("fill","#000")
            .append("textPath")
            .attr("xlink:href", function(d,i) { return ("#l-" + d.id); })
            .text(function(d) { return (d.source + ' - ' + d.target); });
        */
        _.d3Links.on("mouseover", function (d) {
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
                 })
                 .attr("marker-end", getArrow);

        _.d3Nodes = _.G.selectAll("g.node")
                .data(_.Data.nodes)
                .enter().append("svg:g")
                .attr("class", "node")
                /*.attr("class", function (d) { d.fixed = true; return ("fixed node"); })*/
                .attr("id", function (d) { return ("n-" + d.id); })
                .call( (_.UseD3ForceRendering ? _.ForceDrag : _.DragFuncOrigin) )
                .on("click", node_click)
                .on("dblclick", node_dblclick)
                .on("mousedown", function () { d3.event.stopPropagation(); });

        _.d3Nodes.append("svg:image")
            .attr("class", "circle")
            .attr("xlink:href", config.tableImageUrl)
            .attr("x", "-8px").attr("y", "-8px")
            .attr("width", "16px").attr("height", "16px");

        var hasRootTableNames = !!DAL.RootTableNames();
        if (hasRootTableNames) {
            _.d3Nodes.filter(function (d) {
                return (d.selected);
            }).each(function (d) {
                d3.select(this).append("svg:text").attr("class", "node-text-center-shadow")
                   .attr("dx", 12.5).attr("dy", ".37em").text( d.name );
            });
        }
        _.d3Nodes.append("svg:text")
            .attr("class", function (d) {
                return ((d.selected && hasRootTableNames) ? "node-text-center" : "node-text");
            })
            .attr("dx", 12).attr("dy", ".35em")
            .text(function (d) { return (d.name); });
        _.d3Nodes.selectAll("text.node-text-center").each(function (d) {
            d3.select(this.parentNode).append("circle").attr("r", 11).attr("class", "node-circle-center");
        });
        _.d3Nodes.append("title").text(function (d) { return (d.name); });
        var mouseover_node_ids = [],
            mouseover_link_ids = [];
        _.d3Nodes
           .on("mouseover", function (d) {
               all_nodes_mouseover();
               node_mouseover(d3.select(this));
               mouseover_node_ids = [];
               mouseover_link_ids = [];
               for (var i = 0, len = _.Data.links.length; i < len; i++) {
                   var link = _.Data.links[i];
                   if (link.source.id == d.id) {
                       mouseover_link_ids.push("#l-" + link.id);
                       mouseover_node_ids.push("#n-" + link.target.id);
                   } else if (link.target.id == d.id) {
                       mouseover_link_ids.push("#l-" + link.id);
                       mouseover_node_ids.push("#n-" + link.source.id);
                   }
               }
               link_mouseover(d3.selectAll(mouseover_link_ids.join(",")));
               node_mouseover(d3.selectAll(mouseover_node_ids.join(",")));
           })
           .on("mouseout", function (d) {
               all_nodes_mouseout();
               node_mouseout(d3.select(this));
               link_mouseout(d3.selectAll(mouseover_link_ids.join(",")));
               node_mouseout(d3.selectAll(mouseover_node_ids.join(",")));
           });

        if (_.UseD3ForceRendering) {
            _.Force.on("tick", draw);
            update();
        } else {
            setTimeout(function () { draw(); }, 1);

            update();
            _.Force.stop();
        }
    })(data);

    gvm = self;
};
