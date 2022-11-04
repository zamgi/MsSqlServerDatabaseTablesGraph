//#define USE_CACHE

using System;
using System.Collections.Generic;
using System.Linq;
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
        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public DatabaseCollection GetDatabases( [FromUri] DALInputParams inputParams )
        {
            try
            {
                DALInputParams.ThrowIfWrong( inputParams );
#if USE_CACHE
                return (HttpContext.Current.Cache.Get( inputParams.ConnectionString + "-databases"
                        , () => new DatabaseCollection( DAL.GetDatabases( inputParams ) ) ));
#else
                return (new DatabaseCollection( DAL.GetDatabases( inputParams ) ));
#endif
            }
            catch ( Exception ex )
            {
                return (new DatabaseCollection( ex ));
            }
        }

        private TableCollection GetTablesInternal( DALGetTablesInputParams inputParams )
        {
#if USE_CACHE
            return (HttpContext.Current.Cache.Get( inputParams.ConnectionString + "-tables"
                        , () => new TableCollection( DAL.GetTables( inputParams ) ) ));
#else
            return (new TableCollection( DAL.GetTables( inputParams ) ));
#endif

        }

        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public TableCollection GetTables( [FromUri] DALGetTablesInputParams inputParams )
        {
            try
            {
                inputParams.TryLoadFromCookies( HttpContext.Current.Request );
                DALGetTablesInputParams.ThrowIfWrong( inputParams );

                return (GetTablesInternal( inputParams ));
            }
            catch ( Exception ex )
            {
                return (new TableCollection( ex ));
            }
        }

        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public Graph GetRefs( [FromUri] DALGetRefsInputParams inputParams )
        {
            try
            {
                inputParams.TryLoadFromCookies( HttpContext.Current.Request );
                DALGetTablesInputParams.ThrowIfWrong( inputParams );

                #region [.check exists root-tables.]
                if ( inputParams.RootTableNamesSet.Any() )
                {
                    var tableCollection = GetTablesInternal( inputParams );
                    foreach ( var rootTableName in inputParams.RootTableNamesSet )
                    {
                        if ( !tableCollection.Contains( rootTableName ) )
                        {
                            throw (new TableNotExistsException( rootTableName ));
                        }
                    }
                }
                #endregion
#if USE_CACHE
                var refs = HttpContext.Current.Cache.Get( 
                    inputParams.ConnectionString + '-' + inputParams.RootTableNames
                    , () => DAL.GetRefs( inputParams ) );
#else
                var refs = DAL.GetRefs( inputParams );
#endif
                if ( !refs.Any() )
                {
                    if ( inputParams.RootTableNamesSet.Any() )
                    {
                        throw (new RefsNotFoundException( inputParams.RootTableNamesSet ));
                    }

                    foreach ( var rootTableName in inputParams.RootTableNamesSet )
                    {
                        refs.Add( RefItem.CreateForSingleTable( rootTableName ) );
                    }
                }


                var nodes = new Dictionary< string, Node >();
                var links = new HashSet< Link >( new Link.EqualityComparer() );

                #region [.create-graph-nodes-&-links.]
                var node_id = 0;
                var link_id = 0;
                if ( inputParams.RootTableNamesSet.Any() )
                {
                    foreach ( var rootTableName in inputParams.RootTableNamesSet )
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
                        throw (new RefsNotFoundException( inputParams.RootTableNamesSet ));
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
                        SourceFields = from _it in g select _it.ForeignColumn,
                        TargetFields = from _it in g select _it.Column,
                    };
                    links.Add( link );
                    /*var success = links.Add( link );
                    if ( !success )
                        System.Diagnostics.Debugger.Break();*/
                }
                #endregion

                var graph = new Graph( nodes.Values, links );

                CalcGraphCoords( graph, inputParams.GraphWidth, inputParams.GraphHeight );
                return (graph);
            }
            catch ( TableNotExistsException ex )
            {
                return (Graph.CreateError( $"Table with name '{ex.TableName}' not exists" ));
            }
            catch ( RefsNotFoundException ex )
            {
                var error = ex.RootTableNames.Any()
                            ? ($"Reference from table {ex.RootTableNames.Join( '\'', '\'', "','" )} not found")
                            : "Any tables not found";
                return (Graph.CreateError( error ));
            }
            catch ( Exception ex )
            {
                return (Graph.CreateError( ex ));
            }
        }

        private static void CalcGraphCoords( Graph graph, int width, int height )
        {
            var links = graph.Links.Select( x => (x.SourceNode, x.TargetNode) ).ToList( /*graph.Links.Count*/ );
            var points = GraphLayout.CalcSizedGraphLayout( links, ProcessingCoordsMode.pcmFMMMLayout );

            //const double X_SHIFT = 25; const double X_CUT = 100;
            //const double Y_SHIFT = 25; const double Y_CUT = 100;
            foreach ( var node in graph.Nodes )
            {
                var pt = points[ node.Id ];
                node.X = pt.x * width;  //node.X = X_SHIFT + pt.x * (width  - X_CUT);
                node.Y = pt.y * height; //node.Y = Y_SHIFT + pt.y * (height - Y_CUT);
            }

            #region comm. prev.
            //---------------------------------------------------------------------//      
            /*
            var ogdf = new GraphLayout();

            foreach ( var node in graph.Nodes )
            {
                ogdf.AddVertex( node.Id.ToString() );
            }
            foreach ( var link in graph.Links )
            {
                ogdf.AddVertexLink( link.SourceNode.ToString(), link.TargetNode.ToString() );
            }

            ogdf.ProcessingCoords( ProcessingCoordsMode.pcmFMMMLayout );

            foreach ( var node in graph.Nodes )
            {
                var pt = ogdf.GetVertexCoords( node.Id.ToString() );
                node.X = pt.x * width;
                node.Y = pt.y * height;
            }
            //*/
            //---------------------------------------------------------------------//
            #endregion
        }
    }

    /// <summary>
    /// 
    /// </summary>
    internal static class GraphApiControllerExtensions
    {
        public static void TryLoadFromCookies( this DALGetTablesInputParams inputParams, HttpRequest request )
        {
            if ( inputParams.UserName.IsNullOrWhiteSpace() )
            {
                inputParams.UserName = request.GetCookieString( "UserName" );
            }
            if ( inputParams.Password.IsNullOrWhiteSpace() )
            {
                inputParams.Password = request.GetCookieString( "Password" );
            }
        }
        public static void TryLoadFromCookies( this DALGetRefsInputParams inputParams, HttpRequest request )
        {
            ((DALGetTablesInputParams) inputParams).TryLoadFromCookies( request );

            if ( inputParams.GraphHeight == 0 )
            {
                inputParams.GraphHeight = request.GetCookieInt32( "GraphHeight" ).GetValueOrDefault( 1024 );
            }
            if ( inputParams.GraphWidth == 0 )
            {
                inputParams.GraphWidth = request.GetCookieInt32( "GraphWidth" ).GetValueOrDefault( 1280 );
            }
        }
    }
}
