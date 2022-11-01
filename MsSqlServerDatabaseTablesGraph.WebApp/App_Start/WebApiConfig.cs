using System.Web.Http;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    /// <summary>
    /// 
    /// </summary>
    public static class WebApiConfig
    {
        public static void Register( HttpConfiguration config ) => config.Routes.MapHttpRoute( name: "Graph", routeTemplate: "api/{controller}/{action}/" );
    }
}
