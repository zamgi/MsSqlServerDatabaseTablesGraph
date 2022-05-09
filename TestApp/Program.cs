using System;
using System.Linq;

using MsSqlServerDatabaseTablesGraph.WebApp.Controllers;
using MsSqlServerDatabaseTablesGraph.WebApp.Models;

namespace TestApp
{
    /// <summary>
    /// 
    /// </summary>
    internal static class Program
    {
        private static void Main( string[] args )
        {
            var inputParams = new DALGetRefsInputParams()
            {
                ServerName     = "(local)",
                DatabaseName   = "AMCHealth",
                UserName       = "sa",
                Password       = "sa",
                RootTableNames = "Patient.Patients"
            };
            //var tables = DAL.GetTables( inputParams );
            var refs = DAL.GetRefs( inputParams );
            var grouped_refs = (from it in refs
                                group it by it.FKName into g
                                select g
                               ).ToArray();
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
