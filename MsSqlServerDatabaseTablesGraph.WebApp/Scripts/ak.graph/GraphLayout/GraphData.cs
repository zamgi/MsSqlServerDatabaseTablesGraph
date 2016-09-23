using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Threading;

namespace MsSqlServerDatabaseTablesGraph.SvgGraphLayout
{
    /// <summary>
    /// Серверная модель страниы с графом
    /// </summary>
    public class GraphModel
    {
        /// <summary>
        /// Клиентские данные графа, необходимые для его отображения.
        /// </summary>
        public readonly ClientGraphData ClientData = new ClientGraphData();
        /// <summary>
        /// Дополнительные включения HTML для кастомизации графа (не рекомендуется)
        /// </summary>
        public readonly List< string > HtmlIncludes = new List< string >();

        private static int _idCounter = 0;

        /// <summary>
        /// Создает новое уникальное имя графа в пределах сессии
        /// </summary>
        /// <returns></returns>
        public static string GetNextName()
        {
            var id = Interlocked.Increment( ref _idCounter );
            return "GraphModel_" + id;
        }
    }

    /// <summary>
    /// Данные графа.
    /// Эти данные сериализуются в Json и используются для отрисовки графа.
    /// </summary>
    public class ClientGraphData
    {
        private GraphNode[] _nodes;
        /// <summary>
        /// Узлы графа
        /// </summary>
        public GraphNode[] Nodes
        {
            get { return _nodes; }
            set { _nodes = value; _nodesDictCache = null; }
        }
        /// <summary>
        /// Ребра графа
        /// </summary>
        public GraphLink[] Links;
        /// <summary>
        /// Настройки графа
        /// </summary>
        public readonly GraphSettings Settings = new GraphSettings();
        /// <summary>
        /// Кнопки графа
        /// </summary>
        public readonly List<GraphButton> Buttons = new List<GraphButton>();

        private WeakReference _nodesDictCache = null;
        /// <summary>
        /// Получение узла графа по его идентификатору с использование кэша узлов
        /// </summary>
        public GraphNode GetNodeById( int id )
        {
            if ( _nodes == null || _nodes.Length == 0 )
                return null;
            Dictionary<int, GraphNode> dict = null;
            if ( _nodesDictCache != null )
                dict = _nodesDictCache.Target as Dictionary<int, GraphNode>;
            if ( dict == null )
            {
                dict = _nodes.ToDictionary( n => n.id );
                _nodesDictCache = new WeakReference( dict );
            }
            GraphNode node;
            if ( !dict.TryGetValue( id, out node ) )
                return null;
            return node;
        }
    }

    /// <summary>
    /// Данные узла графа
    /// </summary>
    public class GraphNode
    {
        /// <summary>
        /// Идентификатор/порядковый номер узла
        /// </summary>
        public int id;
        /// <summary>
        /// Уникальный идентификатор узла
        /// </summary>
        public string eid;
        /*/// <summary>
        /// Старый идентификатор узла :todo: убрать
        /// </summary>
        public int nid;*/
        /// <summary>
        /// Нормализованный размер узла 0..1
        /// </summary>
        public float Size;
        /// <summary>
        /// Имя узла
        /// </summary>
        public string name;
        /// <summary>
        /// Скрипт, выполняемый по клику на узел
        /// </summary>
        public string onclick;
        /// <summary>
        /// скрипт, выполняемый по даблклику на узел
        /// </summary>
        public string ondblclick;
        /// <summary>
        /// Выделен ли узел
        /// </summary>
        public bool selected;
        /// <summary>
        /// Тип узла
        /// </summary>
        public int nType;
        /// <summary>
        /// Полное описание узла
        /// </summary>
        public string title;
        /// <summary>
        /// Описание узла для колонки чекбоксов
        /// </summary>
        public string text;
        /// <summary>
        /// УРЛ картинки узла
        /// </summary>
        public string icon;
        /// <summary>
        /// Нормализованная координата узла 0..1
        /// </summary>
        public float X;
        /// <summary>
        /// Нормализованная координата узла 0..1
        /// </summary>
        public float Y;
        /// <summary>
        /// Цвет фоновой подсветки узла, null если нет
        /// </summary>
        public string highlight;
        /// <summary>
        /// Отобразить на узле маркер "+"
        /// </summary>
        public bool marker;
    }

    /// <summary>
    /// Варианты типов стрелочек на ребре
    /// </summary>
    public enum GraphLinkArrowType
    {
        /// <summary>
        /// Без стрелочек
        /// </summary>
        None = 0,
        /// <summary>
        /// Стрелочка только на target
        /// </summary>
        Forward = 1,
        /// <summary>
        /// стрелочки с обеих концов ребра
        /// </summary>
        Both = 2
    }

    /// <summary>
    /// Данные связи в графе
    /// </summary>
    public class GraphLink
    {
        /// <summary>
        /// Идентификатор/порядковый номер ребра
        /// </summary>
        public int id;
        /// <summary>
        /// Уникальный идентификатор ссылки
        /// </summary>
        public string eid;
        /// <summary>
        /// Идентификатор (индекс) начального узла связи
        /// </summary>
        public int source;
        /// <summary>
        /// Идентификатор (индекс) конечного узла связи
        /// </summary>
        public int target;
        /// <summary>
        /// Тип связи
        /// </summary>
        public string LinkType;
        /// <summary>
        /// Скрипт по клику на связи
        /// </summary>
        public string onclick;
        /// <summary>
        /// Скрипт по даблклику
        /// </summary>
        public string ondblclick;
        /// <summary>
        /// Описание связи
        /// </summary>
        public string title;
        /// <summary>
        /// Тип связи
        /// </summary>
        public GraphLinkArrowType type;
        /// <summary>
        /// Цвет связи, null для умолчательного цвета
        /// </summary>
        public string Color;
        /// <summary>
        /// Нормализованная толщина связи 0..1
        /// </summary>
        public float Size;
        /// <summary>
        /// Абсолютная толщина связи, если задана, то перекрывает нормализованное значение
        /// </summary>
        public float? Width;
    }

    /// <summary>
    /// Дополнительные настройки графа
    /// </summary>
    public class GraphSettings
    {
        //настройки ребер
        /// <summary>
        /// Макс толщина ребер
        /// </summary>
        public float MAXLinkWidth;
        /// <summary>
        /// Умолчательный цвет ребра
        /// </summary>
        public string LinkColor;
        /// <summary>
        /// Умолчательный альт цвет ребра
        /// </summary>
        public string AltLinkColor;

        //настройки узлов
        /// <summary>
        /// Минимальный размер иконки узла
        /// </summary>
        public float MINNodeSize;
        /// <summary>
        /// Макс размер иконки узла
        /// </summary>
        public float MAXNodeSize;
        /// <summary>
        /// Щрифт надписи на узле
        /// </summary>
        public string FontFace;
        /// <summary>
        /// Цвет надписи узла
        /// </summary>
        public string FontColor;
        /// <summary>
        /// Размер надписи узла
        /// </summary>
        public int FontSize;
        /// <summary>
        /// Цвет кружочка выделения узла
        /// </summary>
        public string NodeStrokeColor;
        /// <summary>
        /// Алгоритм раскладки узлов
        /// </summary>
        public int ProcessingCoordsMode;

        //настройки фона
        /// <summary>
        /// Использовать фоновое изображение в графе
        /// </summary>
        public bool useBackGrnd;
        /// <summary>
        /// Цвет фона графа
        /// </summary>
        public string BackColor;
        /// <summary>
        /// Урл фоновой картинки
        /// </summary>
        public string BackGround;
        /// <summary>
        /// Заголовок графа
        /// </summary>
        public string СontentTitle;
    }

    public enum GraphButtonPositionType
    {
        /// <summary>
        /// Кнопки в верхнем тулбаре
        /// </summary>
        Top = 0,
        /// <summary>
        /// Кнопки в нижнем тулбаре
        /// </summary>
        Bottom = 1,
        /// <summary>
        /// Пользовательские кнопки (размещает самостоятельно)
        /// </summary>
        Custom = 3,
        /// <summary>
        /// Кнопки в контекстном меню узла
        /// </summary>
        NodeContextMenu = 10,
        /// <summary>
        /// Кнопки в контекстном меню связи
        /// </summary>
        LinkContextMenu = 11,
        /// <summary>
        /// Кнопки в контекстном меню фона графа
        /// </summary>
        BackgroundContextMenu = 12,
        /// <summary>
        /// Кнопка истории назад
        /// </summary>
        HistoryBack = 14,
        /// <summary>
        /// Кнопка истории вперед
        /// </summary>
        HistoryForward = 15
    }

    /// <summary>
    /// Информация о функциональных кнопках на графе.
    /// </summary>
    public class GraphButton
    {
        /// <summary>
        /// Тип размещения кнопки
        /// </summary>
        public GraphButtonPositionType type;
        /// <summary>
        /// Текст кнопки
        /// </summary>
        public string title;
        /// <summary>
        /// Иконка кнопки
        /// </summary>
        public string icon;
        /// <summary>
        /// Скрипт по клику на кнопку
        /// </summary>
        public string onclick;
    }
}