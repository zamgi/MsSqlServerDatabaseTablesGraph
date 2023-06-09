using System;
using System.Linq;
using System.Collections.Generic;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    /// <summary>
    /// 
    /// </summary>
    internal sealed class RefsNotFoundException : Exception
    {
        public RefsNotFoundException( ICollection< string > rootTableNames )
            => RootTableNames = rootTableNames?.Where( t => !string.IsNullOrWhiteSpace( t ) ).Select( t => t.Replace( "&apos;", "'" ).Replace( "&APOS;", "'" ) ).ToList();

        public ICollection< string > RootTableNames { get; }
    }

    /// <summary>
    /// 
    /// </summary>
    internal sealed class TableNotExistsException : Exception
    {
        public TableNotExistsException( string tableName ) => TableName = tableName?.Replace( "&apos;", "'" ).Replace( "&APOS;", "'" );
        public string TableName { get; }
    }
}