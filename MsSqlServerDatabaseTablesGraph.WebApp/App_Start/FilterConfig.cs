using System.Web.Mvc;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    /// <summary>
    /// 
    /// </summary>
    public static class FilterConfig
    {
        public static void RegisterGlobalFilters( GlobalFilterCollection filters ) => filters.Add( new HandleErrorAttribute() );
    }
}