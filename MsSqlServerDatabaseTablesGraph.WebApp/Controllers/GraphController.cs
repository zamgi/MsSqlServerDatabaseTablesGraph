//#define USE_CACHE

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;

using ogdf;
using MsSqlServerDatabaseTablesGraph.WebApp.Models;

using HttpGet  = System.Web.Http.HttpGetAttribute;
using HttpPost = System.Web.Http.HttpPostAttribute;

namespace MsSqlServerDatabaseTablesGraph.WebApp.Controllers
{
    /// <summary>
    /// 
    /// </summary>
    public class GraphController : ApiController
    {
#if USE_CACHE
        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public Task< DatabaseCollection > GetDatabases( [FromUri] DALInputParams ip )
        {
            try
            {
                DALInputParams.ThrowIfWrong( ip );
                return (HttpContext.Current.Cache.Get_Async( ip.ConnectionString + "-databases", 
                        async () =>
                        {
                            var databases = await DAL.GetDatabases_Async( ip ).CAX();
                            return (new DatabaseCollection( databases ));
                        }));
            }
            catch ( Exception ex )
            {
                return (Task.FromResult( new DatabaseCollection( ex ) ));
            }
        }
#else
        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public async Task< DatabaseCollection > GetDatabases( [FromUri] DALInputParams ip )
        {
            try
            {
                DALInputParams.ThrowIfWrong( ip );
#if USE_CACHE
                return (HttpContext.Current.Cache.Get_Async( ip.ConnectionString + "-databases", 
                        async () =>
                        {
                            var databases = await DAL.GetDatabases_Async( ip );
                            return (new DatabaseCollection( databases ));
                        }));
#else
                var databases = await DAL.GetDatabases( ip );
                return (new DatabaseCollection( databases ));
#endif
            }
            catch ( Exception ex )
            {
                return (new DatabaseCollection( ex ));
            }
        }
#endif

#if USE_CACHE
        private static Task< TableCollection > GetTablesInternal( DALGetTablesInputParams ip )
            => HttpContext.Current.Cache.Get_Async( ip.ConnectionString + "-tables", 
                        async () =>
                        {
                            var tables = await DAL.GetTables_Async( ip ).CAX();
                            return new TableCollection( tables );
                        });
#else
        private static async Task< TableCollection > GetTablesInternal( DALGetTablesInputParams ip )
        {
            var tables = await DAL.GetTables( ip ).CAX();
            return (new TableCollection( tables ));
        }
#endif

#if USE_CACHE
        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public Task< TableCollection > GetTables( [FromUri] DALGetTablesInputParams ip )
        {
            try
            {
                ip.TryLoadFromCookies( HttpContext.Current.Request );
                DALGetTablesInputParams.ThrowIfWrong( ip );

                return (GetTablesInternal_Async( ip ));
            }
            catch ( Exception ex )
            {
                return (Task.FromResult( new TableCollection( ex ) ));
            }
        }
#else
        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public Task< TableCollection > GetTables( [FromUri] DALGetTablesInputParams ip )
        {
            try
            {
                HttpContext.Current.Request.LoadFromCookies_1( ip );
                DALGetTablesInputParams.ThrowIfWrong( ip );

                return (GetTablesInternal( ip ));
            }
            catch ( Exception ex )
            {
                return (Task.FromResult( new TableCollection( ex ) ));
            }
        }
#endif


        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public async Task< Graph > GetRefs( [FromUri] DALGetRefsInputParams ip )
        {
            try
            {
                HttpContext.Current.Request.LoadFromCookies_2( ip );
                DALGetTablesInputParams.ThrowIfWrong( ip );

                #region [.check exists root-tables.]
                if ( ip.RootTableNamesSet.Any() )
                {
                    var tableCollection = await GetTablesInternal( ip );
                    foreach ( var rootTableName in ip.RootTableNamesSet )
                    {
                        if ( !tableCollection.Contains( rootTableName ) )
                        {
                            throw (new TableNotExistsException( rootTableName ));
                        }
                    }
                }
                #endregion

                #region [.get refs.]
#if USE_CACHE
                var refs = await HttpContext.Current.Cache.Get_Async( ip.ConnectionString + '-' + ip.RootTableNames, () => DAL.GetRefs( ip ) );
#else
                var refs = await DAL.GetRefs( ip );
#endif
                if ( !refs.Any() )
                {
                    //if ( ip.RootTableNamesSet.Any() ) throw (new RefsNotFoundException( ip.RootTableNamesSet ));

                    foreach ( var rootTableName in ip.RootTableNamesSet )
                    {
                        refs.Add( RefItem.CreateForSingleTable( rootTableName ) );
                    }
                }
                #endregion

                #region [.build graph.]
                var nodes = new Dictionary< string, Node >();
                var links = new HashSet< Link >( new Link.EqualityComparer() );

                #region [.create-graph-nodes-&-links.]
                var node_id = 0;
                var link_id = 0;
                if ( ip.RootTableNamesSet.Any() )
                {
                    foreach ( var rootTableName in ip.RootTableNamesSet )
                    {
                        //var linksTotal = refs.Count( it => it.Level <= 2 && it.TableName == rootTableName );
                        var centerNode = new Node( node_id, rootTableName, true );
                        nodes.Add( centerNode.Name, centerNode );
                        node_id++;
                    }
                }
                else
                {
                    var rootTableName = refs.FirstOrDefault().ForeignTableName;
                    if ( rootTableName.IsNullOrWhiteSpace() )
                    {
                        throw (new RefsNotFoundException( ip.RootTableNamesSet ));
                    }
                    //var linksTotal = refs.Count( it => it.Level <= 2 && it.TableName == rootTableName );
                    var centerNode = new Node( node_id, rootTableName, true );
                    nodes.Add( centerNode.Name, centerNode );
                    node_id++;
                }                

                var tables = (from it in refs 
                                select it.TableName
                                ).Concat
                                (from it in refs
                                select it.ForeignTableName
                                );
                foreach ( var table in tables )
                {
                    if ( !nodes.ContainsKey( table ) )
                    {                        
                        var node = new Node( node_id, table );
                        nodes.Add( node.Name, node );
                        node_id++;
                    }
                }
                var grouped_refs = from it in refs
                                    where (!it.FKName.IsNullOrEmpty())
                                    group it by it.FKName into g                                    
                                   select g;
                foreach ( var g in grouped_refs )
                {
                    var it = g.First();

                    var node_1 = nodes[ it.ForeignTableName ];
                    var node_2 = nodes[ it.TableName ];

                    link_id++;
                    var link = new Link( link_id ) 
                    { 
                        SourceNode   = node_1.Id, 
                        TargetNode   = node_2.Id,
                        SourceFields = (from x in g select x.ForeignColumn).ToList(),
                        TargetFields = (from x in g select x.Column).ToList(),
                    };
                    links.Add( link );
                    /*var success = links.Add( link );
                    if ( !success ) Debugger.Break();*/
                }
                #endregion

                var graph = new Graph( nodes.Values, links );

                CalcGraphCoords( graph, ip.GraphWidth, ip.GraphHeight );
                return (graph);
                #endregion
            }
            catch ( TableNotExistsException ex )
            {
                return (Graph.CreateError( $"Table with name '{ex.TableName}' not exists" ));
            }
            catch ( RefsNotFoundException ex )
            {
                var error = ex.RootTableNames.Any()
                            ? ($"Reference from table '{string.Join( "','", ex.RootTableNames )}' not found")
                            : "Any tables not found";
                return (Graph.CreateError( error ));
            }
            catch ( Exception ex )
            {
                return (Graph.CreateError( ex ));
            }
        }

        private static void CalcGraphCoords( Graph graph, int width, int height, CoordsLayoutMode layoutMode = CoordsLayoutMode.SpringEmbedderFR )
        {
            const int X_CUT = 50;
            const int Y_CUT = 30;
            const double SCALE = 0.95;

            var links  = graph.Links.Select( x => (x.SourceNode, x.TargetNode) ).ToList();
            var points = GraphLayout.CalcSizedGraphLayout( links, graph.Nodes.Count, layoutMode, (width - X_CUT, height - Y_CUT) );
     
            foreach ( var node in graph.Nodes )
            {
                var (x, y) = points[ node.Id ];
                node.X = x * SCALE;
                node.Y = y * SCALE;
            }
        }
    }

    /// <summary>
    /// 
    /// </summary>
    internal static class GraphApiControllerExtensions
    {
        public static void LoadFromCookies_1( this HttpRequest request, DALGetTablesInputParams ip )
        {
            if ( ip.UserName.IsNullOrWhiteSpace() )
            {
                ip.UserName = request.GetCookieString( "UserName" );
            }
            if ( ip.Password.IsNullOrWhiteSpace() )
            {
                ip.Password = request.GetCookieString( "Password" );
            }
        }
        public static void LoadFromCookies_2( this HttpRequest request, DALGetRefsInputParams ip )
        {
            request.LoadFromCookies_1( ip );

            if ( ip.GraphHeight == 0 )
            {
                ip.GraphHeight = request.GetCookieInt32( "GraphHeight" ).GetValueOrDefault( 1024 );
            }
            if ( ip.GraphWidth == 0 )
            {
                ip.GraphWidth = request.GetCookieInt32( "GraphWidth" ).GetValueOrDefault( 1280 );
            }
        }
    }
}
