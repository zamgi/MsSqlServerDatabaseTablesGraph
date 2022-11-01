using System.Web.Optimization;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    public class BundleConfig
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

            bundles.Add( new ScriptBundle( "~/bundles/jqueryval" ).Include( "~/Scripts/jquery-val/jquery.unobtrusive*",
                                                                            "~/Scripts/jquery-val/jquery.validate*" ) );

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add( new ScriptBundle( "~/bundles/modernizr" ).Include( "~/Scripts/modernizr/modernizr-*" ) );

            bundles.Add( new StyleBundle( "~/Content/css" ).Include( "~/Content/site.css" ) );

            bundles.Add( new StyleBundle( "~/Content/jquery-ui/css" ).Include(
                        $"~/Content/jquery-ui/1.11.4/themes/smoothness/jquery-ui{suffix}.css",
                        "~/Content/jquery-ui/1.11.4/themes/smoothness/theme.css"
                        ) );

            BundleTable.EnableOptimizations = false;
        }
    }
}