using System;
using System.Linq;
using System.Collections.Generic;

namespace MsSqlServerDatabaseTablesGraph
{
    /// <summary>
    /// 
    /// </summary>
    internal sealed class RefsNotFoundException : Exception
    {
        public RefsNotFoundException( ICollection< string > rootTableNames )
            => RootTableNames = rootTableNames?.Where( _ => !string.IsNullOrWhiteSpace( _ ) ).Select( _ => _.Replace( "&apos;", "'" ).Replace( "&APOS;", "'" ) ).ToList();

        public ICollection< string > RootTableNames { get; }
    }

    /// <summary>
    /// 
    /// </summary>
    internal sealed class TableNotExistsException : Exception
    {
        public TableNotExistsException( string tableName ) => TableName = (tableName != null) ? tableName.Replace( "&apos;", "'" ).Replace( "&APOS;", "'" ) : null;
        public string TableName { get; }
    }
}