using System;
using System.Collections.Generic;
using System.Data;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Caching;
using System.Web.Mvc;
using System.Web.SessionState;
using System.Web.UI;

using Newtonsoft.Json.Converters;

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
        public static bool?  GetCookieBoolean( this HttpRequest request, string cookieName ) => (bool.TryParse( request.Cookies[ cookieName ]?.Value, out var v ) ? v : null);

        public static bool IsNullOrEmpty( this string s ) => string.IsNullOrEmpty( s );
        public static bool IsNullOrWhiteSpace( this string s ) => string.IsNullOrWhiteSpace( s );
        public static string Join( this ICollection< string > strings, string left, string right, string separator ) => (left + string.Join( separator, strings ) + right);
        public static string Join( this ICollection< string > strings, char left, char right, string separator ) => (left + string.Join( separator, strings ) + right);
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

    /// <summary>
    /// 
    /// </summary>
    public sealed class dd_MM_yyyy_DateTimeConverter : IsoDateTimeConverter
    {
        private static dd_MM_yyyy_DateTimeConverter _Inst;
        public static dd_MM_yyyy_DateTimeConverter Inst
        {
            get
            {
                if ( _Inst == null )
                {
                    lock ( typeof(dd_MM_yyyy_DateTimeConverter) )
                    {
                        if ( _Inst == null )
                        {
                            _Inst = new dd_MM_yyyy_DateTimeConverter();
                        }
                    }
                }
                return (_Inst); 
            }
        }

        public dd_MM_yyyy_DateTimeConverter() => DateTimeFormat = "dd.MM.yyyy";
    }

    /// <summary>
    /// 
    /// </summary>
    internal struct SessionEX
    {
        internal const string DATABASE_USERID_SESSION_KEY = "DatabaseUserId";
        internal const string DATETIME_MARKER_SESSION_KEY = "DateTimeMarker";

        private HttpSessionStateBase _Session;
        public SessionEX( HttpSessionStateBase session ) => _Session = session;
        public int  DatabaseUserId
        {
            get => int.Parse( Convert.ToString( _Session[ DATABASE_USERID_SESSION_KEY ] ) );
            set => _Session[ DATABASE_USERID_SESSION_KEY ] = value;
        }
        public bool HasDatabaseUserId
        {
            get 
            {
                var uid = Convert.ToString( _Session[ DATABASE_USERID_SESSION_KEY ] );
                return (int.TryParse( uid, out var id ) && (0 <= id));
            }
        }
        public DateTime DateTimeMarker
        {
            get => Convert.ToDateTime( _Session[ DATETIME_MARKER_SESSION_KEY ] );
            set => _Session[ DATETIME_MARKER_SESSION_KEY ] = value;
        }
    }
    /// <summary>
    /// 
    /// </summary>
    internal static class HttpContextSessionExtensions
    {
        private const string MISSING_DATABASE_USERID = "Отсутствует идентификатор пользователя базы данных. Возможно на сервере завершен сеанс. (MISSING_DATABASE_USERID).";

        public static SessionEX SessionEX( this HttpContextBase httpContext ) => new SessionEX( httpContext.Session );
        public static SessionEX AsSessionEX( this HttpSessionStateBase session ) => new SessionEX( session );

        public static bool HasDatabaseUserId( this HttpSessionState session )
        {
            //if ( session != null )
            //{
                var uid = Convert.ToString( session[ MsSqlServerDatabaseTablesGraph.WebApp.SessionEX.DATABASE_USERID_SESSION_KEY ] );
                return (int.TryParse( uid, out var id ) && (0 <= id));
            //}
            //return (false);
        }
        /*public static bool TryGetDatabaseUserId( this HttpSessionStateBase session, out int databaseUserId )
        {
            if ( session == null )
            {
                databaseUserId = default(int);
                return (false);
            }

            var uid = Convert.ToString( session[ MsSqlServerDatabaseTablesGraph.WebApp.SessionEX.DATABASE_USERID_SESSION_KEY ] );
            return (int.TryParse( uid, out databaseUserId ) && (0 <= databaseUserId));
        }*/
        public static int  GetDatabaseUserIdThrowIfMissing( this HttpSessionStateBase session )
        {
            if ( session == null )
            {
                throw (new InvalidOperationException( MISSING_DATABASE_USERID ));
            }

            var uid = Convert.ToString( session[ MsSqlServerDatabaseTablesGraph.WebApp.SessionEX.DATABASE_USERID_SESSION_KEY ] );
            if ( !int.TryParse( uid, out var databaseUserId ) || (databaseUserId <= 0) )
            {
                throw (new InvalidOperationException( MISSING_DATABASE_USERID ));                
            }
            return (databaseUserId);
        }
        public static void SetDatabaseUserId( this HttpContextBase httpContext, int userId )
        {
            var sex = httpContext.SessionEX();
            sex.DatabaseUserId = userId;
        }
        public static void SetDateTimeMarkerNow( this HttpSessionStateBase session ) => session[ MsSqlServerDatabaseTablesGraph.WebApp.SessionEX.DATETIME_MARKER_SESSION_KEY ] = DateTime.Now;

        public static ConfiguredTaskAwaitable CAX( this Task t ) => t.ConfigureAwait( false );
        public static ConfiguredTaskAwaitable< T > CAX<T>( this Task< T > t ) => t.ConfigureAwait( false );
    }
}