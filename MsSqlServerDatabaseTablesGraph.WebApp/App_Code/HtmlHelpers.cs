using MsSqlServerDatabaseTablesGraph.WebApp.Properties;

namespace System.Web.Mvc
{
    /// <summary>
    /// 
    /// </summary>
    public static class HtmlHelpers
    {
        public static MvcHtmlString GetTitle( this WebViewPage page )
        {
            var title = default(string);
            if ( page.ViewBag.Title != null )
            {
                title = page.ViewBag.Title + ", ";
            }
            title += Resource.LOGO_HEADER;
            return (new MvcHtmlString( title ));
        }
        public static bool IsNullOrEmpty( this string s ) { return string.IsNullOrEmpty( s ); }
        public static bool IsNullOrWhiteSpace( this string s ) { return string.IsNullOrWhiteSpace( s ); }
        public static bool ContainsEx( this string s, string s2 ) { return (s != null) && (s.IndexOf( s2, StringComparison.InvariantCultureIgnoreCase ) != -1); }
        
    }
}