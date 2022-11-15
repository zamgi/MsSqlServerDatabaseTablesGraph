using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Http;

namespace MsSqlServerDatabaseTablesGraph.WebService
{
    /// <summary>
    /// 
    /// </summary>
    internal static class Extensions
    {
        public static T TryGetValue< K, T >( this Dictionary< K, T > dict, K key ) => (dict.TryGetValue( key, out var t ) ? t : default);
        public static HashSet< T > ToHashSet< T >( this IEnumerable< T > seq ) => new HashSet< T >( seq );

        public static string GetCookieString( this HttpRequest request, string cookieName ) => request.Cookies[ cookieName ];
        public static int?   GetCookieInt32 ( this HttpRequest request, string cookieName ) => (int.TryParse( request.Cookies[ cookieName ], out var v ) ? v : null);
        public static bool?  GetCookieBoolean( this HttpRequest request, string cookieName ) => (bool.TryParse( request.Cookies[ cookieName ], out var v ) ? v : null);

        public static bool IsNullOrEmpty( this string s ) => string.IsNullOrEmpty( s );
        public static bool IsNullOrWhiteSpace( this string s ) => string.IsNullOrWhiteSpace( s );
        public static string Join( this ICollection< string > strings, string left, string right, string separator ) => (left + string.Join( separator, strings ) + right);
        public static string Join( this ICollection< string > strings, char left, char right, string separator ) => (left + string.Join( separator, strings ) + right);


        public static ConfiguredTaskAwaitable CAX( this Task t ) => t.ConfigureAwait( false );
        public static ConfiguredTaskAwaitable< T > CAX< T >( this Task< T > t ) => t.ConfigureAwait( false );
    }
}