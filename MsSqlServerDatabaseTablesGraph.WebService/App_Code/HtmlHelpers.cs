using System;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Razor;

using MsSqlServerDatabaseTablesGraph.WebService.Properties;

namespace Microsoft.AspNetCore.Mvc
{
    /// <summary>
    /// 
    /// </summary>
    public static class HtmlHelpers
    {
        public static string GetTitle( this RazorPage page )
        {
            var title = default(string);
            if ( page.ViewBag.Title != null )
            {
                title = page.ViewBag.Title + ", ";
            }
            title += Resource.LOGO_HEADER;
            return (title);
        }
        public static bool IsNullOrEmpty( this string s ) => string.IsNullOrEmpty( s );
        public static bool IsNullOrWhiteSpace( this string s ) => string.IsNullOrWhiteSpace( s );
        public static bool ContainsEx( this string s, string s2 ) => (s != null) && (s.IndexOf( s2, StringComparison.InvariantCultureIgnoreCase ) != -1);
        public static bool ContainsEx( this in PathString s, string s2 ) => ((string) s).ContainsEx( s2 );
    }
}