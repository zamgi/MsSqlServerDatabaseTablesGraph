using System;
using System.Collections.Generic;
using System.Data;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Caching;
using System.Web.Mvc;
using System.Web.UI;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    /// <summary>
    /// 
    /// </summary>
    internal static class Extensions
    {
        public static StringBuilder AppendFormatEx( this StringBuilder sb, string format, object arg0, string separator = ", " )
        {
            if ( sb.Length != 0 ) sb.Append( separator );
            return (sb.AppendFormat( format, arg0 ));
        }

        public static string GetStringEx( this DataRow row, string columnName, string devaultValue = "-" )
        {
            var v = row[ columnName ].ToString();
            return (v.IsNullOrEmpty() ? devaultValue : v);
        }

        public static object GetValueOrDBNull< T >( this T? t ) where T : struct => (t.HasValue ? t : DBNull.Value);
        public static object GetValueOrDBNull< T >( this T t ) where T : class => ((t != null) ? t : DBNull.Value);
        public static object GetValueOrDBNull( this string t ) => (t.IsNullOrEmpty() ? DBNull.Value : t);

        public static T TryGetValue< K, T >( this Dictionary< K, T > dict, K key ) => (dict.TryGetValue( key, out var t ) ? t : default);
        public static HashSet< T > ToHashSet< T >( this IEnumerable< T > seq ) => new HashSet< T >( seq );

        public static T Get< T >( this Cache cache, string key, Func< T > getFunc ) where T : class
        {
            var t = (T) cache[ key ];
            if ( t == null )
            {
                lock ( key )
                {
                    t = (T) cache[ key ];
                    if ( t == null )
                    {
                        t = getFunc();
                        cache[ key ] = t;
                    }
                }
            }
            return (t);
        }
        public static async Task< T > Get_Async< T >( this Cache cache, string key, Func< Task< T > > getFunc ) where T : class
        {
            var t = (T) cache[ key ];
            if ( t == null )
            {
                using ( await LockerAsync.By_Key( key ).CAX() )
                {
                    t = (T) cache[ key ];
                    if ( t == null )
                    {
                        t = await getFunc().CAX();
                        cache[ key ] = t;
                    }
                }
            }
            return (t);
        }
        public static T Get< T >( this Cache cache, string key ) where T : class => ((T) cache[ key ]);
        public static void Set< T >( this Cache cache, string key, T t ) where T : class => cache[ key ] = t;
        public static void UpdateIfExists< T >( this Cache cache, string key, T t ) where T : class
        {
            if ( cache[ key ] != null )
            {
                cache[ key ] = t;
            }
        }

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