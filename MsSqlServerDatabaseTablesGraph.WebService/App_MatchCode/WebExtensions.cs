using Microsoft.AspNetCore.Http;

namespace MsSqlServerDatabaseTablesGraph.WebService
{
    /// <summary>
    /// 
    /// </summary>
    internal static class WebExtensions
    {
        public static string GetCookieString( this HttpRequest request, string cookieName ) => request.Cookies[ cookieName ];
        public static int?   GetCookieInt32 ( this HttpRequest request, string cookieName ) => (int.TryParse( request.Cookies[ cookieName ], out var v ) ? v : null);
        public static bool?  GetCookieBoolean( this HttpRequest request, string cookieName ) => (bool.TryParse( request.Cookies[ cookieName ], out var v ) ? v : null);
    }
}