using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

using MsSqlServerDatabaseTablesGraph.WebService;
using MsSqlServerDatabaseTablesGraph.WebService.Models;

using ogdf;

namespace TestApp
{
    /// <summary>
    /// 
    /// </summary>
    internal static class Program
    {
        private static async Task Main( string[] args )
        {
            try
            {
                var ip = new DALGetRefsInputParams()
                {
                    ServerName     = "(local)",
                    DatabaseName   = "OrdInv",   //"xz",
                    UserName       = "sa",       //"xz",
                    Password       = "12qwQW12", //"xz",
                    //RootTableNames = "xz.xz"

                    GraphWidth  = 1280,
                    GraphHeight = 1024,
                };

                //---await Run( ip ).CAX();
                var graph = await BuildGraph( ip, CoordsLayoutMode.SpringEmbedderFR ).CAX();

                Console.WriteLine( graph );
            }
            catch ( Exception ex )
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine( ex );
                Console.ResetColor();
            }
            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.WriteLine( "\r\n\r\n[...finita...]" );
        }

        private static async Task Run( DALGetRefsInputParams ip )
        {
            //var tables = DAL.GetTables( ip );
            var refs = await DAL.GetRefs( ip ).CAX();
            var grouped_refs = (from it in refs
                                group it by it.FKName into g
                                select g
                               ).ToList();
            foreach ( var g in grouped_refs )
            {
                Console.WriteLine( g.Key );
                foreach ( var it in g )
                {
                    Console.WriteLine( $"\t{it.TableName}.{it.Column} - {it.ForeignTableName}.{it.ForeignColumn}" );
                }
                Console.WriteLine();
            }
        }

        private static async Task< Graph > BuildGraph( DALGetRefsInputParams ip, CoordsLayoutMode layoutMode )
        {
            try
            {
                DALGetTablesInputParams.ThrowIfWrong( ip );

                #region [.check exists root-tables.]
                if ( ip.RootTableNamesSet.Any() )
                {
                    var tables_ = await DAL.GetTables( ip ).CAX();
                    var tableCollection = new TableCollection( tables_ );

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
                var refs = await DAL.GetRefs( ip ).CAX();
                if ( !refs.Any() )
                {
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
                             )
                             .Concat
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
                }
                #endregion

                var graph = new Graph( nodes.Values, links );

                CalcGraphCoords( graph, Math.Max( 1, ip.GraphWidth ), Math.Max( 1, ip.GraphHeight ), layoutMode );
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
        private static void CalcGraphCoords( Graph graph, int width, int height, CoordsLayoutMode layoutMode )
        {
            var links  = graph.Links.Select( x => (x.SourceNode, x.TargetNode) ).ToList();
            var points = GraphLayout.CalcSizedGraphLayout( links, graph.Nodes.Count, layoutMode, (width, height) );

            foreach ( var node in graph.Nodes )
            {
                (node.X, node.Y) = points[ node.Id ];
            }
        }

        //---------------------------------------------------------------------//
        private static ConfiguredTaskAwaitable CAX( this Task t ) => t.ConfigureAwait( false );
        private static ConfiguredTaskAwaitable< T > CAX< T >( this Task< T > t ) => t.ConfigureAwait( false );
        public static bool IsNullOrEmpty( this string s ) => string.IsNullOrEmpty( s );
        public static bool IsNullOrWhiteSpace( this string s ) => string.IsNullOrWhiteSpace( s );
    }
}
