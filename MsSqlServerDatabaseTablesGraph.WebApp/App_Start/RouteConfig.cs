using System.Web.Mvc;
using System.Web.Routing;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    /// <summary>
    /// 
    /// </summary>
    public static class RouteConfig
    {
        public static void RegisterRoutes( RouteCollection routes )
        {
            routes.IgnoreRoute( "{resource}.axd/{*pathInfo}" );

            routes.MapRoute(
                name: "GraphView",
                url: "{controller}/{action}",
                defaults: new { controller = "GraphView", action = "Index" }
            );
        }
    }
}