//общая функция ошибки запроса
window.onerror = function (msg, url, line) {
    if (typeof (msg) != "string") msg = JSON.stringify(msg);
    _notification.messageError(msg, "Error: graphCreator.js::window.onerror");
};

function graphCreator(data, size) {
    //разбор ответа сервера
    //Поля ClusterNode:
    //int id;
    //string[] CatList;
    //Guid[] DocList;
    //string Name;

    //Поля ClusterLink:
    //int FromNodeID;
    //int ToNodeID;
    //string[] KeyWords;
    function parseSomeNet(data) {
        APP.SomeNet = {
            Nodes: data.Graph.Nodes,
            Links: data.Graph.Links,
            State: {
                Settings: data.Settings,
                PrevState: null,
                NextState: null
            },
            ThemeTypes: data.ThemeTypes
        };
        rebuildGraph();
    }

    function getLinkWidth(d) {
        var sw = 0.13, i = d.sourceFields.length - 1;
        switch (i) {
            case 1: sw += 0.09; break;
            case 2: sw += 0.15; break;
            case 3: sw += 0.19; break;
            case 4: sw += 0.23; break;
            default: sw += (i * 0.03); break;
        }
        return (sw + "em");
    }

    //перестроить граф с новыми параметрами построения
    //подготовить данные в формате, требуемом движком визуализации графа
    function rebuildGraph() {
        var graph = {
            Nodes: APP.SomeNet.Nodes,
            Links: APP.SomeNet.Links,
            Settings: APP.SomeNet.State.Settings
        };
        //сформировать поля source и target
        var idMapper = {}, //typeof Dictionnary<int, int>
            minNodeFreq = 0, //---Number.POSITIVE_INFINITY,
            maxNodeFreq = 0; //---Number.NEGATIVE_INFINITY;
        for (var i = 0, n = graph.Nodes.length; i < n; i++) {
            var node = graph.Nodes[i];            
            idMapper[node.id] = i;
            /*---
            var val = node.DocList.length;
            if (minNodeFreq > val) minNodeFreq = val;
            if (maxNodeFreq < val) maxNodeFreq = val;*/
        }
        //var SelectedIDs = APP.SomeNet.State.SelectedIDs;
        //вычисление аттрибутов узлов графа
        var freqDelta = (maxNodeFreq == minNodeFreq) ? 1 : maxNodeFreq - minNodeFreq,
            maxNameLength = 30; //, maxNameTerms  = 10;
        for (var i = 0, n = graph.Nodes.length; i < n; i++) {
            var node = graph.Nodes[i];
            node.icon = config.appRootPath + "Images/table.gif";
            node.Size = 10; //---(node.DocList.length - minNodeFreq) / freqDelta;
            var title = node.name;//---node.CatList.join(', ');
            var name = node.name;//---node.Name;
            node.Name = name;
            /*---
            if (!name) {
                var cat = node.CatList;
                if (cat.length > maxNameTerms) cat = cat.slice(0).splice(0, maxNameTerms);
                name = cat.join(', ');
            }*/
            node.name = name;
            if (node.name.length > maxNameLength) node.name = node.name.substr(0, maxNameLength) + "...";
            //node.highlight = SelectedIDs != null && SelectedIDs[node.id] ? '#f00' : null;
            node.title = title;
            node._id = node.id;            
        }
        var maxLinkWidth = 1;
        for (var i = 0, n = graph.Links.length; i < n; i++) {
            var l = graph.Links[i];
            /*---
            l.source = idMapper[l.FromNodeID];
            l.target = idMapper[l.ToNodeID];
            if (l.KeyWords.length > maxLinkWidth) maxLinkWidth = l.KeyWords.length;
            l.title = l.KeyWords.join(', ');
            l.Color = graph.Settings.LinkColor;
            l.Size = l.KeyWords.length;
            */
            l.FromNodeID = l.source;
            l.ToNodeID   = l.target;
            l.source = idMapper[l.source];
            l.target = idMapper[l.target];
            if (l.sourceFields.length > maxLinkWidth) maxLinkWidth = l.sourceFields.length;
            l.title = "'" + l.sourceFields + "' - '" + l.targetFields + "'";
            l.Color = "silver";//---graph.Settings.LinkColor;
            l.Size = l.sourceFields.length;
            l.Width = l.width = getLinkWidth(l);            
        }
        for (var i = 0, n = graph.Links.length; i < n; i++) {
            var l = graph.Links[i];
            l.Size = l.Size / maxLinkWidth;
        }

        graph.Settings.CanGoBack    = (APP.SomeNet.State.PrevState != null);
        graph.Settings.CanGoForward = (APP.SomeNet.State.NextState != null);

        //проверка есть ли уже расчитанная раскладка графа для текущего состояния
        var performLayout = true;
        if (APP.SomeNet.State.coordinateCache) {
            var cache = APP.SomeNet.State.coordinateCache;
            performLayout = false;
            for (var i = 0; i < graph.Nodes.length; i++) {
                var n = graph.Nodes[i],
                    c = cache[n._id];
                //проверка на смену настроек построения графа
                if (!c) {
                    performLayout = true;
                    break;
                }
                n.X = c.X;
                n.Y = c.Y;
            }
            if (!performLayout) {
                graphLayout.loadData(graph);
            }
        }
        if (performLayout) {
            //рассчитать координаты узлов и отобразить граф
            graphLayout.performLayout(graph,
                APP.SomeNet.State.Settings.ProcessingCoordsMode,
                function (graph) {
                    //записать раскладку координат узлов для текущего состояния
                    var cache = {};
                    for (var i = 0; i < graph.Nodes.length; i++) {
                        var n = graph.Nodes[i];
                        cache[n._id] = { X: n.X, Y: n.Y };
                    }
                    APP.SomeNet.State.coordinateCache = cache;
                    graphLayout.loadData(graph);
                });
        }
    }

    var controls = {
        //Контекстное меню узла
        nodeMenu: [
            { name: "Показать документы"   , callback: function () { /*TODO*/ } },
            { name: "Переименовать кластер", callback: function () { /*TODO*/ } },
        ]
    };
    graphLayout.init(controls);

    (function (data, size) {
        var o = {
            Graph: {},
            Settings: {
                MINNodeSize: 1,
                MAXNodeSize: 2,
                MAXLinkWidth: 1
            },
            ThemeTypes: {}
        };
        o.Graph.Nodes = data.nodes;
        o.Graph.Links = data.links;
        var hasRootTableNames = !!DAL.RootTableNames();
        for (var i = 0, len = o.Graph.Nodes.length; i < len; i++) {
            var n = o.Graph.Nodes[i];
            n.X = n.x = n.x / size.w;
            n.Y = n.y = n.y / size.h;
            n.selected &= hasRootTableNames;
        }

        parseSomeNet(o);
    })(data, size);
};