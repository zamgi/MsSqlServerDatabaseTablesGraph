using System.Web.Optimization;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    public static class BundleConfig
    {
        public static void RegisterBundles( BundleCollection bundles )
        {
#if !(DEBUG)
            bundles.IgnoreList.Clear();
#endif
            bundles.Add( new ScriptBundle( "~/bundles/jquery"   ).Include( $"~/Scripts/jquery/jquery-3.6.4.min.js" ) );
            bundles.Add( new ScriptBundle( "~/bundles/jqueryui" ).Include( $"~/Scripts/jquery-ui/jquery-ui.min.js" ) );

            bundles.Add( new StyleBundle( "~/Content/css" ).Include( "~/Content/site.css" ) );
            bundles.Add( new StyleBundle( "~/Content/jquery-ui/css" ).Include( $"~/Content/jquery-ui/themes-smoothness/jquery-ui.min.css",
                                                                                "~/Content/jquery-ui/themes-smoothness/theme.css" ) );

            BundleTable.EnableOptimizations = false;
        }
    }
}