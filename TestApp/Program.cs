using System;
using System.Linq;
using System.Threading.Tasks;

using MsSqlServerDatabaseTablesGraph.WebApp.Controllers;
using MsSqlServerDatabaseTablesGraph.WebApp.Models;

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
                await Run();
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
        private static async Task Run()
        {
            var inputParams = new DALGetRefsInputParams()
            {
                ServerName     = "(local)",
                DatabaseName   = "OrdInv",
                UserName       = "sa",
                Password       = "12qwQW12",
                RootTableNames = "LQA.Reports"
            };
            //var tables = DAL.GetTables( inputParams );
            var refs = await DAL.GetRefs_Async( inputParams ).ConfigureAwait( false );
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
    }
}
