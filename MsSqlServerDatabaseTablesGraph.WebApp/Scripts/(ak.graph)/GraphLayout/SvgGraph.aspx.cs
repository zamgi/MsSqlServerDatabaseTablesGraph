using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Web.Script.Serialization;
using System.Web.UI;
using System.Web.UI.WebControls;

using OGDF;

namespace Searchlight.GraphLayout
{
    /// <summary>
    /// Summary description for WebForm1.
    /// </summary>
    public class SvgGraph : Page
    {
        protected Literal ltInitData;

        protected string _vmlDataName;
        protected VmlData _vmlData;
        protected string _graphLayoutName;

        int MAX_NODE_NAME_LENGTH = 40;

        GraphModel graphModel;
        ClientGraphData graph;

        private void Page_Load( object sender, EventArgs e )
        {
            EnableViewState = false;

            _graphLayoutName = Request[ "GraphLayoutName" ];
            if ( _graphLayoutName != null )
            {
                graphModel = Session[ _graphLayoutName ] as GraphModel;
            }

            if ( graphModel == null )
            {
                LoadFromVML();
            }

            if ( graphModel == null )
            {
                Response.Write( "<script>alert('Структура данных не определена'); window.close()</script>" );
                return;
            }
            graph = graphModel.ClientData;

            CalcCoordinates();

            var sbOut = new StringBuilder();
            sbOut.AppendFormat( @"<script type=""text/javascript"">var initData = {0};</script>",
                new JavaScriptSerializer().Serialize( graph ) );
            foreach ( var script in graphModel.HtmlIncludes )
                sbOut.Append( script );
            ltInitData.Text = sbOut.ToString();
        }

        //Расчет координат для узлов карты
        public void CalcCoordinates()
        {
            //:todo: убрать индексацию по i
            ProcessingCoordsMode eMode = (ProcessingCoordsMode) graph.Settings.ProcessingCoordsMode;
            var gl = new OGDF.GraphLayout();
            for ( var i = 0; i < graph.Nodes.Length; i++ )
                gl.AddVertex( i.ToString() );
            foreach ( var l in graph.Links )
                gl.AddVertexLink( l.source.ToString(), l.target.ToString() );

            //выполнить расчет
            gl.ProcessingCoords( eMode );

            //запомнить результат
            for ( var i = 0; i < graph.Nodes.Length; i++ )
            {
                PointF pt = gl.GetVertexCoords( i.ToString() );
                var n = graph.Nodes[ i ];
                n.X = pt.X;
                n.Y = pt.Y;
            }
            gl.ClearAll();
        }


        /// <summary>
        /// Загружает данные GraphData на основе данных из VmlData
        /// </summary>
        private void LoadFromVML()
        {
            //загрузка из VML
            try
            {
                _vmlDataName = (Request[ "VmlDataName" ] == null) ? "" : Request[ "VmlDataName" ];
                _vmlData = (VmlData) Session[ _vmlDataName ];
                if ( _vmlData == null )
                    return;

                graphModel = new GraphModel();
                graph = graphModel.ClientData;

                //Установка визуальных параметров
                ConfigItem c = _vmlData.GetConfigItem();
                graph.Settings.MAXLinkWidth = c.GetIntParam( "MAXLinkWidth" );
                graph.Settings.LinkColor = c.GetStrParam( "LinkColor" );
                graph.Settings.AltLinkColor = c.GetStrParam( "AltLinkColor" );
                graph.Settings.MINNodeSize = c.GetIntParam( "MINNodeSize" );
                graph.Settings.MAXNodeSize = c.GetIntParam( "MAXNodeSize" );
                graph.Settings.FontFace = c.GetStrParam( "FontFace" );
                graph.Settings.FontColor = c.GetStrParam( "FontColor" );
                graph.Settings.FontSize = c.GetIntParam( "FontSize" );
                graph.Settings.NodeStrokeColor = c.GetStrParam( "NodeStrokeColor" );
                graph.Settings.ProcessingCoordsMode = c.GetIntParam( "ProcessingCoordsMode" );
                graph.Settings.useBackGrnd = c.GetBoolParam( "useBackGrnd" );
                graph.Settings.BackColor = c.GetStrParam( "BackColor" );
                graph.Settings.BackGround = c.GetStrParam( "BackGround" );

                //добавить script
                foreach ( ScriptItem scriptItem in _vmlData.GetScriptItems() )
                    graphModel.HtmlIncludes.Add( scriptItem.sText );

                CreateButtons();
                RenderNodes();

                _graphLayoutName = GraphModel.GetNextName();
                Session[ _graphLayoutName ] = graphModel;
            }
            catch ( Exception ex )
            {
                Response.Write( ex.ToString() );
            }
        }

        /// <summary>
        /// Загружает поле GraphData.Buttons из VmlData
        /// </summary>
        private void CreateButtons()
        {
            //кнопки тулбаров
            foreach ( var buttonItem in _vmlData.GetButtonItems() )
            {
                if ( buttonItem.nType < 2 )
                {
                    graph.Buttons.Add( new GraphButton()
                    {
                        type = (GraphButtonPositionType) buttonItem.nType,
                        title = buttonItem.sToolTip,
                        icon = buttonItem.sImageUrl,
                        onclick = buttonItem.sOnClick
                    } );
                }
                else if ( buttonItem.nType == 2 )
                {
                    graph.Settings.СontentTitle = buttonItem.sName;
                }
            }

            //кнопки вперед и назад
            HistoryItem historyItem = _vmlData.GetHistoryBackItem();
            if ( historyItem != null )
            {
                string onClick = (historyItem.bMarked) ? historyItem.sOnClick : "";
                graph.Buttons.Add( new GraphButton()
                {
                    type = GraphButtonPositionType.HistoryBack,
                    icon = historyItem.sImageUrl,
                    title = historyItem.sName,
                    onclick = onClick
                } );
            }
            historyItem = _vmlData.GetHistoryNextItem();
            if ( historyItem != null )
            {
                string onClick = (historyItem.bMarked) ? historyItem.sOnClick : "";
                graph.Buttons.Add( new GraphButton()
                {
                    type = GraphButtonPositionType.HistoryForward,
                    icon = historyItem.sImageUrl,
                    title = historyItem.sName,
                    onclick = onClick
                } );
            }
            //контекстные меню
            var menus = new Dictionary<GraphButtonPositionType, VmlNet.MenuItem[]> {
				{ GraphButtonPositionType.NodeContextMenu,       _vmlData.GetNodeMenuItems() },
				{ GraphButtonPositionType.LinkContextMenu,       _vmlData.GetLinkMenuItems() },
				{ GraphButtonPositionType.BackgroundContextMenu, _vmlData.GetBodyMenuItems() },
			};
            foreach ( var pair in menus )
            {
                if ( pair.Value == null || pair.Value.Length == 0 )
                    continue;
                foreach ( var menuItem in pair.Value )
                {
                    graph.Buttons.Add( new GraphButton()
                    {
                        type    = pair.Key,
                        title   = menuItem.sName,
                        icon    = "",
                        onclick = menuItem.sOnClick
                    } );
                }
            }

        }

        /// <summary>
        /// Загружает поля GraphData.Nodes и Links из VmlData
        /// </summary>
        private void RenderNodes()
        {
            //Определим максимальное и минимальное значение частоты узла
            int MinNodeFreq = _vmlData.GetMinNodeFreq();
            int MaxNodeFreq = _vmlData.GetMaxNodeFreq();
            int freqDelta = (MaxNodeFreq == MinNodeFreq) ? 1 : MaxNodeFreq - MinNodeFreq;
            var nodeItems = _vmlData.GetNodeItems();
            var nodes = new GraphNode[ nodeItems.Length ];
            var dictNodeIndexes = new Dictionary<int, int>();
            for ( int i = 0; i < nodeItems.Length; i++ )
            {
                var nodeItem = nodeItems[ i ];
                dictNodeIndexes[ nodeItem.nID ] = i;

                var nodeName = nodeItem.sName;
                nodeName = (nodeName.Length <= MAX_NODE_NAME_LENGTH) ? nodeName : (nodeName.Substring( 0, MAX_NODE_NAME_LENGTH ) + "...");
                nodes[ i ] = new GraphNode()
                {
                    id = nodeItem.nID, //+,
                    eid = nodeItem.sID, //+
                    Size = (nodeItem.nFreq - MinNodeFreq) / (float) freqDelta,
                    name = nodeName, //+
                    onclick = nodeItem.sOnClick, //+
                    ondblclick = nodeItem.sOnDblClick, //+
                    selected = nodeItem.bSelected, //+
                    nType = nodeItem.nType, //+
                    title = nodeItem.sToolTip, //+
                    icon = nodeItem.sImageUrl, //+
                    X = (float) nodeItem.X, //+
                    Y = (float) nodeItem.Y, //+
                    text = nodeItem.sText, //+
                    highlight = nodeItem.nType <= 0 ? null : GetNodeFillColor( nodeItem.nType ), //+
                    marker = nodeItem.bMarked, //+
                };
            }

            //Расчитать толщину связей
            double minLinkWeight = _vmlData.GetMinLinkWeight();
            double maxLinkWeight = _vmlData.GetMaxLinkWeight();
            double deltaLinkWeight = maxLinkWeight - minLinkWeight;

            //В цикле нарисовать все связи
            VmlLinkItem[] linkItems = _vmlData.GetLinkItems();
            var g = linkItems.GroupBy( l => l.nNodeFrom ^ l.nNodeTo );
            var links = new GraphLink[ linkItems.Length ];
            for ( int i = 0; i < linkItems.Length; i++ )
            {
                VmlLinkItem linkItem = linkItems[ i ];
                int src, dst;
                if ( !dictNodeIndexes.TryGetValue( linkItem.nNodeFrom, out src ) || !dictNodeIndexes.TryGetValue( linkItem.nNodeTo, out dst ) )
                    throw new Exception( "В списке отсутствует объект(NodeFrom) указанный в данных связи: " + linkItem.nNodeFrom );
                links[ i ] = new GraphLink()
                {
                    eid = linkItem.sID, //+
                    source = src, //+
                    target = dst, //+
                    LinkType = linkItem.LinkType,
                    onclick = linkItem.sOnClick, //+
                    ondblclick = linkItem.sOnDblClick, //+
                    title = Server.HtmlEncode( linkItem.sToolTip ), //+
                    type = ArrowTypeCode( linkItem.ArrowType ), //+
                    Color = !string.IsNullOrEmpty( linkItem.LinkColor ) ? linkItem.LinkColor : null, //+
                    Size = (float) ((linkItem.fWeight - minLinkWeight) / deltaLinkWeight), //+
                    Width = linkItem.SizeAbsolute > 0 ? (int?) linkItem.SizeAbsolute : null, //+
                };
            }
            var g2 = links.GroupBy( l => l.source ^ l.target );
            graph.Nodes = nodes;
            graph.Links = links;
        }

        private string GetNodeFillColor( int type )
        {
            switch ( type )
            {
                case 1:
                return "#ff0000";
                case 2:
                return "#0000ff";
                case 3:
                return "#008000";
                case 4:
                return "#8000ff";
                case 5:
                return "#8080ff";
                case 6:
                return "#004000";
                case 7:
                return "#ff8080";
                case 8:
                return "#00ffff";
                case 9:
                return "#80ff00";
                case 10:
                return "#804040";
                case 11:
                return "#808000";
                case 12:
                return "#ff8000";
                case 13:
                return "#008080";
                case 14:
                return "#ffff00";
                default:
                return null;
            }
        }
        private GraphLinkArrowType ArrowTypeCode( VmlLinkItem.eArrowType arrowType )
        {
            switch ( arrowType )
            {
                case VmlLinkItem.eArrowType.End:
                return GraphLinkArrowType.Forward;
                case VmlLinkItem.eArrowType.Start:
                throw new Exception( "Unsupported arrow type" );
                case VmlLinkItem.eArrowType.StartAndEnd:
                return GraphLinkArrowType.Both;
                default:
                return GraphLinkArrowType.None;
            }
        }

        #region [.Web Form Designer generated code.]
        override protected void OnInit( EventArgs e )
        {
            InitializeComponent();
            base.OnInit( e );
        }

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.Load += new System.EventHandler( this.Page_Load );
        }
        #endregion
    }
}