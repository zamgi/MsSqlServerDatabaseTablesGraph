//Мат основа алгоритма уменьшения числа пересечений.
function RemoveOverlaps(boxes, maxDepth, bbox) {
	var d, box,
		n = boxes.length;
	for (var i = n - 1; i >= 0; i--) {
		box = boxes[i];
		//бэкап оригинальных координат
		box.x0 = box.x1;
		box.y0 = box.y1;
		//вписать прямоугольник в область
		if (box.x1 < bbox.x1) {
			d = box.x1 - bbox.x1;
			box.x1 -= d;
			box.x2 -= d;
		}
		if (box.y1 < bbox.y1) {
			d = box.y1 - bbox.y1;
			box.y1 -= d;
			box.y2 -= d;
		}
		if (box.x2 > bbox.x2) {
			d = box.x2 - bbox.x2;
			box.x1 -= d;
			box.x2 -= d;
		}
		if (box.y2 > bbox.y2) {
			d = box.y2 - bbox.y2;
			box.y1 -= d;
			box.y2 -= d;
		}
		box.x1 = Math.floor(box.x1);
		box.x2 = Math.floor(box.x2);
		box.y1 = Math.floor(box.y1);
		box.y2 = Math.floor(box.y2);
		box.xs = box.x1;
		box.ys = box.y1;
		iterate(box, i, {}, 1);
	}
	if (n < 80) {
		for (var i = n - 1; i >= 0; i--) {
			iterate(boxes[i], i, {}, 1);
		}
	}
	
	
	function iterate(box, k, visited, level) {
		if (level > maxDepth) return false;
		var b, test,
			ok = true;
		for (var i = 0, n = boxes.length; i < n; i++) {
			test = boxes[i];
			if (i == k) continue;
			if (intersects(box, test)) {
				var chance = false;
				//сдвиг вверх/вниз
				if (box.x1 % 2 == 0) {
					if (box.y1 <= box.ys)
						chance = chance || createBox(box, 0, test.y1 - box.y2, k, visited, level);
					if (box.y1 >= box.ys)
						chance = chance || createBox(box, 0, test.y2 - box.y1, k, visited, level);
				} else {
					if (box.y1 >= box.ys)
						chance = chance || createBox(box, 0, test.y2 - box.y1, k, visited, level);
					if (box.y1 <= box.ys)
						chance = chance || createBox(box, 0, test.y1 - box.y2, k, visited, level);
				}
				//сдвиг влево
				if (box.x1 <= box.xs)
					chance = chance || createBox(box, test.x1 - box.x2, 0, k, visited, level + 1);
				//сдвиг вправо
				if (box.x1 >= box.xs)
					chance = chance || createBox(box, test.x2 - box.x1, 0, k, visited, level + 1);
				ok = ok && chance;
			}
		}
		return ok;
	}
	
	function createBox(box, dx, dy, k, visited, level) {
		var b = {
			x1: box.x1 + dx,
			x2: box.x2 + dx,
			y1: box.y1 + dy,
			y2: box.y2 + dy,
			xs: box.xs,
			ys: box.ys
		};
		//выход за экран
		if (b.x1 < bbox.x1 || b.x2 > bbox.x2 || 
			b.y1 < bbox.y1 || b.y2 > bbox.y2) {
			return false;
		}
		//проверка повторного прохода
		var key = b.x1+"_"+b.y1;
		if (visited[key] && visited[key] <= level) {
			return false;
		}
		visited[key] = level;
		if (iterate(b, k, visited, level + 1)) {
			box.x1 = b.x1;
			box.x2 = b.x2;
			box.y1 = b.y1;
			box.y2 = b.y2;
			return true;
		}
		return false;
	}
	
	function intersects(r1, r2) {
		return r1.x1 < r2.x2 && r1.x2 > r2.x1 &&
			r1.y1 < r2.y2 && r1.y2 > r2.y1;
	}
	
}

function RemoveGraphOverlaps(graph, APP) {
	var Settings = APP.Settings,
		nodes = graph.nodes(),
		len = nodes.length;
	var measurer = $("<div></div>").css({
		position: 'absolute',
		left: -1000,
		top: -1000,
		display: 'none',
		font: Settings.FontSize + "pt " + Settings.FontFace
	}).appendTo('body');
	
	//расчет прямоугольников узлов
	var s0 = parseFloat(Settings.MINNodeSize) / 2,
		ds = parseFloat(Settings.MAXNodeSize) / 2 - s0,
		lineHeight = Settings.ROLineHeight ? Settings.ROLineHeight : Settings.ROLineHeight = measurer.html("lfy").outerHeight(),
		boxes = [];
	for (var i = 0; i < len; i++) {
		var n = nodes[i],
			size = s0 + Math.floor(n.Size * ds),
			textWidth = n.ROTextWidth ? n.ROTextWidth : n.ROTextWidth = measurer.html(n.name).outerWidth() / 2,
			w = Math.max(size, textWidth) + 2;
		boxes[i] = {
			x1: n.x - w,
			x2: n.x + w,
			y1: n.y,
			y2: n.y + size + lineHeight + 2,
			node: n
		};
	}
	measurer.remove();
	//вызов алгоритма минимизации пересечений
	var bgRect = graph.bgRectSelector.node().getBBox(),
		scale = graph.scale(),
		bbox = { x1: 0, y1 : 0, x2: bgRect.width * scale, y2: bgRect.height * scale },
		complexity = Math.min(20, Math.floor(100 / Math.sqrt(len + 1)));
	RemoveOverlaps(boxes, complexity, bbox);
	//сдвигаем узлы согласно рассчитанным координатам
	for (var i = 0; i < len; i++) {
		var box = boxes[i],
			n = box.node;
		n.x += box.x1 - box.x0;
		n.y += box.y1 - box.y0;
	}
	//перерисовка графа
	graph.drawNodes(graph.getNodeElems());
	graph.drawLinks(graph.getLinkElems());
	graph.saveNodeCoordinates();
}
