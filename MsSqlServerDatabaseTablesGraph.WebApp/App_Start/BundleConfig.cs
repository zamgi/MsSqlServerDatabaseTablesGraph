using System.Web.Optimization;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    public static class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles( BundleCollection bundles )
        {
#if DEBUG
            const string suffix = "";
#else
            const string suffix = ".min";
            bundles.IgnoreList.Clear();
#endif

            bundles.Add( new ScriptBundle( "~/bundles/jquery"   ).Include( $"~/Scripts/jquery/1.8.2/jquery{suffix}.js" ) );
            bundles.Add( new ScriptBundle( "~/bundles/jqueryui" ).Include( $"~/Scripts/jquery-ui/1.11.4/jquery-ui{suffix}.js",
                                                                            "~/Scripts/jquery-ui/1.11.4/jquery.showModalDialog.js") );
            bundles.Add( new ScriptBundle( "~/bundles/jqueryui-dialogextend" ).Include( $"~/Scripts/jquery-ui/1.11.4/dialogextend/jquery.dialogextend{suffix}.js" ) );

            bundles.Add( new StyleBundle( "~/Content/css" ).Include( "~/Content/site.css" ) );
            bundles.Add( new StyleBundle( "~/Content/jquery-ui/css" ).Include( $"~/Content/jquery-ui/1.11.4/themes/smoothness/jquery-ui{suffix}.css",
                                                                                "~/Content/jquery-ui/1.11.4/themes/smoothness/theme.css" ) );

            BundleTable.EnableOptimizations = false;
        }
    }
}