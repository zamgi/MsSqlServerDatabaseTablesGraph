using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.UI;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    /// <summary>
    /// 
    /// </summary>
    internal static class Extensions
    {
        public static string GetCookieString( this HttpRequest request, string cookieName ) => request.Cookies[ cookieName ]?.Value;
        public static int?   GetCookieInt32 ( this HttpRequest request, string cookieName ) => (int.TryParse( request.Cookies[ cookieName ]?.Value, out var v ) ? v : null);
        //public static bool?  GetCookieBoolean( this HttpRequest request, string cookieName ) => (bool.TryParse( request.Cookies[ cookieName ]?.Value, out var v ) ? v : null);

        public static bool IsNullOrEmpty( this string s ) => string.IsNullOrEmpty( s );
        public static bool IsNullOrWhiteSpace( this string s ) => string.IsNullOrWhiteSpace( s );
        //public static string Join( this ICollection< string > strings, string left, string right, string separator ) => (left + string.Join( separator, strings ) + right);
        public static string Join( this ICollection< string > strings, char left, char right, string separator ) => (left + string.Join( separator, strings ) + right);

        public static ConfiguredTaskAwaitable CAX( this Task t ) => t.ConfigureAwait( false );
        public static ConfiguredTaskAwaitable< T > CAX< T >( this Task< T > t ) => t.ConfigureAwait( false );
    }

    /// <summary>
    /// 
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public sealed class NoCacheAttribute : ActionFilterAttribute
    {
        public override void OnResultExecuting( ResultExecutingContext filterContext )
        {
            var cache = filterContext.HttpContext.Response.Cache;
            cache.SetExpires( DateTime.UtcNow.AddDays( -1 ) );
            cache.SetValidUntilExpires( false );
            cache.SetRevalidation( HttpCacheRevalidation.AllCaches );
            cache.SetCacheability( HttpCacheability.NoCache );
            cache.SetNoStore();

            base.OnResultExecuting( filterContext );
        }
    }

    /// <summary>
    /// 
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited=true, AllowMultiple=false)]
    public sealed class NoOutputCacheAttribute : OutputCacheAttribute
    {
        public NoOutputCacheAttribute()
        {
            Duration = 0;
            Location = OutputCacheLocation.None;
            NoStore  = true;
        }
    }
}