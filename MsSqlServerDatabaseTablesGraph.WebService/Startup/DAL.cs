using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

using Microsoft.Data.SqlClient;

using MsSqlServerDatabaseTablesGraph.WebService.Models;

namespace MsSqlServerDatabaseTablesGraph.WebService
{
    /// <summary>
    /// 
    /// </summary>
    internal static class DAL
    {
        #region [.const's.]
        private const int    CONNECT_TIMEOUT_3   = 3;
        private const int    COMMAND_TIMEOUT_5   = 5;
        private const int    COMMAND_TIMEOUT_15  = 15;
        private const int    COMMAND_TIMEOUT_60  = 60;
        private const int    COMMAND_TIMEOUT_300 = 300;

        private const string SQL_GET_DATABASES = @"
SELECT name DatabaseName FROM master.dbo.sysdatabases WHERE (name NOT IN ('master', 'tempdb', 'model', 'msdb')) ORDER BY name;";

        private const string SQL_GET_TABLES = @"
SELECT DISTINCT (s.name + '.' + t.name) TableName
FROM sys.foreign_keys fk
INNER JOIN sys.tables  t ON t.object_id IN (fk.parent_object_id, fk.referenced_object_id)
INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
ORDER BY TableName;";
        /*
SELECT TableName = (s.name + '.' + t.name)
FROM sys.tables t INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
ORDER BY TableName;
         */

        private const string SQL_GET_REFS_BY_FOREIGN_TABLENAME = @"
DECLARE @AllTables BIT = {0};
/*DECLARE @ForeignTableName VARCHAR(255) = {0}; --'Patient.Patients'; --'Cases.Sessions'; --'Cases.Cases';*/
---------------------------------------------------------------------------------------------------

BEGIN TRY DROP TABLE #Refs; END TRY BEGIN CATCH END CATCH;
CREATE TABLE #Refs(FKName VARCHAR(255), TableName VARCHAR(255), [Column] VARCHAR(255), ForeignTableName VARCHAR(255), ForeignColumn VARCHAR(255));
--CREATE NONCLUSTERED INDEX #IDX_1_Refs ON #Refs(ForeignTableName ASC, ForeignColumn ASC);
DECLARE @TBALE TABLE(ID INT IDENTITY, [Level] INT, [IsSelfRefs] INT, FKName VARCHAR(255), TableName VARCHAR(255), [Column] VARCHAR(255), ForeignTableName VARCHAR(255), ForeignColumn VARCHAR(255));

INSERT INTO #Refs
SELECT (FKName + '-' + TableName + '-' + ForeignTableName) FKName
     , TableName, [Column], ForeignTableName, ForeignColumn
FROM
(
    SELECT fk.name FKName
         , (tp_s.name + '.' + tp.name) TableName
         , cp.name                     [Column] --, tp_s.name [Schema], tp.name [Name]
	       , (tr_s.name + '.' + tr.name) ForeignTableName
	       , cr.name                     ForeignColumn --, tr_s.name ForeignSchema, tr.name ForeignName 		    
    FROM sys.foreign_keys fk
    INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
      INNER JOIN sys.schemas tp_s ON tp.schema_id = tp_s.schema_id
    INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
      INNER JOIN sys.schemas tr_s ON tr.schema_id = tr_s.schema_id
    INNER JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    INNER JOIN sys.columns cp ON fkc.parent_column_id = cp.column_id AND fkc.parent_object_id = cp.object_id
    INNER JOIN sys.columns cr ON fkc.referenced_column_id = cr.column_id AND fkc.referenced_object_id = cr.object_id
) X;

;WITH
recurrent([Level], [IsSelfRefs], FKName, TableName, [Column], ForeignTableName, ForeignColumn) AS
(
	  SELECT 1 [Level]
	      , (CASE WHEN (ForeignTableName = TableName) THEN 1 ELSE 0 END) [IsSelfRefs]
	      , refs.*
	  FROM #Refs refs
	  WHERE (@AllTables = 1)
	     OR (ForeignTableName IN ({1}))	     
  UNION ALL
    SELECT (recurrent.[Level] + 1) [Level]
         , 0 [IsSelfRefs]
         , refs.*
    FROM #Refs refs
    INNER JOIN recurrent ON refs.ForeignTableName  = recurrent.TableName 
                        and refs.ForeignTableName != recurrent.ForeignTableName
                        and refs.ForeignTableName != refs.TableName
  UNION ALL
    SELECT (recurrent.[Level] + 1) [Level]
         , 1 [IsSelfRefs]
         , refs.*
    FROM #Refs refs
    INNER JOIN recurrent ON refs.ForeignTableName  = recurrent.TableName 
                        and refs.ForeignTableName != recurrent.ForeignTableName
                        and refs.ForeignTableName  = refs.TableName
                        and refs.ForeignColumn    != refs.[Column]
)
INSERT INTO @TBALE(
      [Level]
    , [IsSelfRefs]
    , FKName
    , TableName
    , [Column]
    , ForeignTableName
    , ForeignColumn)
SELECT DISTINCT 
      [Level]
    , [IsSelfRefs]
    , FKName
    , TableName
    , [Column]
    , ForeignTableName
    , ForeignColumn
FROM recurrent
ORDER BY [Level] /*DESC*/, [IsSelfRefs], FKName, TableName;

SELECT MIN(ID) ID
    ,  MIN([Level]) [Level]
    , [IsSelfRefs]
    , FKName
    , TableName
    , [Column]
    , ForeignTableName
    , ForeignColumn
FROM @TBALE 
GROUP BY 
      [IsSelfRefs]
    , FKName
    , TableName
    , [Column]
    , ForeignTableName
    , ForeignColumn
ORDER BY ID, [IsSelfRefs], FKName, TableName;";
        #endregion

        public static async Task< ISet< string > > GetDatabases( DALInputParams ip )
        {
            DALInputParams.ThrowIfWrong( ip );

            ip.ConnectTimeout = CONNECT_TIMEOUT_3;

            using ( var con = new SqlConnection( ip.ConnectionString ) )
            using ( var cmd = con.CreateCommand() )
            {
                cmd.CommandType    = CommandType.Text;
                cmd.CommandTimeout = COMMAND_TIMEOUT_5;
                cmd.CommandText    = SQL_GET_DATABASES;

                await con.OpenAsync().CAX();

                var databases = new SortedSet< string >( StringComparer.Ordinal );
                using ( var rd = await cmd.ExecuteReaderAsync().CAX() )
                {
                    for ( var idx = rd.GetOrdinal( "DatabaseName" ); rd.Read(); )
                    {
                        databases.Add( rd.GetString( idx ) );
                    }
                }
                return (databases);
            }        
        }

        public static async Task< ISet< Table > > GetTables( DALGetTablesInputParams ip )
        {            
            DALGetTablesInputParams.ThrowIfWrong( ip );

            using ( var con = new SqlConnection( ip.ConnectionString ) )
            using ( var cmd = con.CreateCommand() )
            {
                cmd.CommandType    = CommandType.Text;
                cmd.CommandTimeout = COMMAND_TIMEOUT_15;
                cmd.CommandText    = SQL_GET_TABLES;

                await con.OpenAsync().CAX();

                var tables = new SortedSet< Table >( Table.Comparer.Inst );
                using ( var rd = await cmd.ExecuteReaderAsync().CAX() )
                {
                    for ( var idx = rd.GetOrdinal( "TableName" ); rd.Read(); )
                    {
                        tables.Add( new Table( rd.GetString( idx ) ) );
                    }
                }
                return (tables);
            }
        }

        public static async Task< ICollection< RefItem > > GetRefs( DALGetRefsInputParams ip )
        {
            DALGetTablesInputParams.ThrowIfWrong( ip );

            using ( var con = new SqlConnection( ip.ConnectionString ) )
            using ( var cmd = con.CreateCommand() )
            {
                cmd.CommandType    = CommandType.Text;
                cmd.CommandTimeout = ip.RootTableNamesSet.Any() ? COMMAND_TIMEOUT_60 : COMMAND_TIMEOUT_300;
                cmd.CommandText    = string.Format( SQL_GET_REFS_BY_FOREIGN_TABLENAME
                    , ip.RootTableNamesSet.Any() ? 0 : 1
                    , '\'' + string.Join("','", ip.RootTableNamesSet.Select( table => table.Replace( "'", "''" ) )) + '\'' );

                await con.OpenAsync().CAX();

                var refs = new LinkedList< RefItem >();
                using ( var rd = await cmd.ExecuteReaderAsync().CAX() )
                {
                    for ( int idx_1 = rd.GetOrdinal( "Level" ),
                              idx_2 = rd.GetOrdinal( "IsSelfRefs" ),
                              idx_3 = rd.GetOrdinal( "FKName" ),
                              idx_4 = rd.GetOrdinal( "TableName" ),
                              idx_5 = rd.GetOrdinal( "Column" ),
                              idx_6 = rd.GetOrdinal( "ForeignTableName" ),
                              idx_7 = rd.GetOrdinal( "ForeignColumn" ); 
                          rd.Read(); )
                    {
                        var refItem = new RefItem()
                        {
                            Level            = rd.GetInt32( idx_1 ), 
                            IsSelfRefs       = (rd.GetInt32( idx_2 ) != 0), 
                            FKName           = rd.GetString( idx_3 ),
                            TableName        = rd.GetString( idx_4 ),
                            Column           = rd.GetString( idx_5 ),
                            ForeignTableName = rd.GetString( idx_6 ),
                            ForeignColumn    = rd.GetString( idx_7 ),
                        };
                        refs.AddLast( refItem );
                    }
                }
                return (refs);
            }
        }

        //private static ConfiguredTaskAwaitable CAX( this Task t ) => t.ConfigureAwait( false );
        //private static ConfiguredTaskAwaitable< T > CAX< T >( this Task< T > t ) => t.ConfigureAwait( false );
    }
}