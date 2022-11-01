using System.Web.Mvc;
using System.Web.Routing;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    /// <summary>
    /// 
    /// </summary>
    public sealed class RouteConfig
    {
        public static void RegisterRoutes( RouteCollection routes )
        {
            routes.IgnoreRoute( "{resource}.axd/{*pathInfo}" );

            /*routes.MapRoute(
                name: "GraphView",
                url: "{controller}/{action}/{ServerName}/{DatabaseName}/{RootTableNames}",
                defaults: new { 
                      controller     = "GraphView"
                    , action         = "Index"
                    , ServerName     = UrlParameter.Optional
                    , DatabaseName   = UrlParameter.Optional
                    , RootTableNames = UrlParameter.Optional
                }
            );*/

            routes.MapRoute(
                name: "GraphView",
                url: "{controller}/{action}",
                defaults: new { controller = "GraphView", action = "Index" }
            );
        }
    }
}