d3.layout.minimap = function () {
    var map = {},
		graph,
		parentRect,
		parentCanvas,
		svg,
		showButton,
		mapArea,
		bgRect,
		canvas,
		rect,
		ax, ay, //коэффициенты масштабирования графа на миникарте
		scaleBox, scaleOpt, //комбобокс со значением масштаба
		scaleCmb, stdScales, scaleOptVisible,
		//размеры миникарты
		mapWidth = 250,
		mapHeight = 200;

    map.create = function (graphObj, scaleBoxSelector) {
        graph = graphObj;
        parentRect = graph.bgRectSelector.node();
        parentCanvas = graph.canvasSelector.node();
        scaleBox = d3.select(scaleBoxSelector || "#scaleBox");
        scaleCmb = scaleBox.select("select").node();
        scaleOpt = scaleBox.select("option").node();
        scaleOptVisible = true;
        scaleBox.on("change.minimap", function () {
            if (scaleCmb) {
                graph.scale(scaleCmb.options[scaleCmb.selectedIndex].value);
            }
        });
        stdScales = {};
        for (var i = 0; i < scaleCmb.options.length; i++) {
            var opt = scaleCmb.options[i];
            if (opt == scaleOpt) continue;
            stdScales[opt.text] = opt;
        }
        svg = graph.svgSelector.append("g");
        showButton = svg.append("g")
			.classed("xyz_minimap_button", true)
			.attr("transform", "translate(" + (mapWidth - 23) + ", " + (mapHeight - 23) + ")")
			.on("mousedown", showMinimap);
        showButton.append("svg:rect")
			.attr("rx", "5").attr("ry", "5")
			.attr("width", "20").attr("height", "20");
        showButton.append("svg:image")
			.attr("width", "20").attr("height", "18")
			.attr("x", "2").attr("y", "1")
			.attr("xlink:href", config.appRootPath + "css/view/V1/graphLayout/minimap.png");
        mapArea = svg.append("g")
			.classed("xyz_minimap", true)
			.style("display", "none");
        bgRect = mapArea.append("rect")
			.classed("xyz_minimap_background", true)
			.attr("width", mapWidth)
			.attr("height", mapHeight);
        canvas = mapArea.append("g");
        rect = mapArea.append("rect").classed("xyz_minimap_rect", true);
        d3.select(window).on('resize.minimap', updatePosition);
        updatePosition();
        graph.on('dataBound.minimap', drawGraph);
        drawGraph();
    }

    function linkSelfArc(d, bx, by, X_OFFSET, Y_OFFSET) {
        var rx = 5,
            ry = 5,
            dx = 2 * rx,
            rx2 = rx / 2 + 1,
            ry2 = ry / 2 + 1,
            cx = X_OFFSET + d.target.x * bx - rx2,
            cy = Y_OFFSET + d.target.y * by - ry2;
        var path = "M" + (cx - rx).toString() + "," + cy.toString() +
                   "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + dx.toString() + ",0" +
                   "a" + rx.toString() + "," + ry.toString() + " 0 1,0 " + -dx.toString() + ",0";
        return (path);
    };
    function drawGraph() {
        var parentBox = parentRect.getBBox(),
			graphBox = parentCanvas.getBBox();
        ax = Math.min(1, parentBox.width / graphBox.width);
        ay = Math.min(1, parentBox.height / graphBox.height);
        if (scaleOpt) {
            var text = Math.floor(100 * graph.scale()) + '%';
            if (stdScales[text]) {
                stdScales[text].selected = true;
                if (scaleOptVisible) {
                    $(scaleOpt).detach();
                    scaleOptVisible = false;
                }
            } else {
                scaleOpt.text = text;
                scaleOpt.selected = true;
                if (!scaleOptVisible) {
                    $(scaleCmb).prepend(scaleOpt);
                    scaleOptVisible = true;
                }
            }
        }
        if (ax == 1 || ay == 1) {
            svg.style("display", "none");
            //сдвинуть комбобокс масштаба в угол
            scaleBox.style("right", "2px");
            return;
        }
        svg.style("display", null);
        scaleBox.style("right", "25px");
        updatePosition();

        var nodes = graph.nodes(),
			links = graph.links();
        if (!nodes || !nodes.length) return;

        const X_OFFSET =  4;
        const Y_OFFSET = 10;
        const Y_SCALE_CUT = 0.0025;
        //связи
        if (!links) links = [];
        var d = canvas.selectAll("path").data(links);
        d.enter()
			.append("svg:path")
			.attr("class", "xyz_minimap_link");
        var bx = mapWidth / graphBox.width,
            by = mapHeight / graphBox.height - Y_SCALE_CUT;
        d.attr("d", function (d) {
            if (d.source == d.target) {
                return (linkSelfArc(d, bx, by, X_OFFSET, Y_OFFSET));
            }
            return ("M" + (X_OFFSET + d.source.x * bx) + "," + (Y_OFFSET + d.source.y * by) +
                    "L" + (X_OFFSET + d.target.x * bx) + "," + (Y_OFFSET + d.target.y * by));
        });
        d.exit().remove();

        //узлы
        var d = canvas.selectAll("circle").data(nodes);
        d.enter()
			.append("svg:circle")
			.attr("class", "xyz_minimap_node")
			.attr("r", 1.5);
        d.attr("cx", function (d) { return X_OFFSET + d.x * bx; })
            .attr("cy", function (d) { return Y_OFFSET + d.y * by; });
        d.exit()
			.remove();
    }

    function updatePosition() {
        var parentBox = parentRect.getBBox();
        svg.attr("transform", "translate(" + (parentBox.width - mapWidth) + "," + (parentBox.height - mapHeight) + ")");
    }

    function showMinimap() {
        /*always redraw possible new node positions*/
        drawGraph();

        d3.select(window)
			.on("mouseup.minimap", hideMinimap)
			.on("mousemove.minimap", updateScroll);
        mapArea.style("display", null);
        graph.svgSelector.style("pointer-events", "none");
        scaleBox.style("display", "none");
        rect.attr('width', null).attr('height', null).attr('x', null).attr('y', null);
        updatePosition();
    }

    function hideMinimap() {
        d3.select(window)
			.on("mouseup.minimap", null)
			.on("mousemove.minimap", null);
        mapArea.style("display", 'none');
        graph.svgSelector.style("pointer-events", null);
        scaleBox.style("display", null);
        updatePosition();
    }

    function updateScroll() {
        var canvasBox = bgRect.node().getBBox(),
			graphBox = parentCanvas.getBBox(),
			mouse = d3.mouse(mapArea.node()),
			//половинная ширина и высота прямоугольника на миникарте
			w = ax * canvasBox.width / 2,
			h = ay * canvasBox.height / 2,
			//ограничение на координаты мыши внутри области миникарты
			x = Math.max(w, Math.min(canvasBox.width - w, mouse[0])) - w,
			y = Math.max(h, Math.min(canvasBox.height - h, mouse[1])) - h,
			gx = x / canvasBox.width * graphBox.width + graphBox.x,
			gy = y / canvasBox.height * graphBox.height + graphBox.y;
        rect.attr('width', w * 2).attr('height', h * 2).attr('x', x).attr('y', y);
        graph.translate(-gx, -gy);
        if (d3.event.stopPropagation) d3.event.stopPropagation();
        if (d3.event.preventDefault) d3.event.preventDefault();
    }

    return (map);
};