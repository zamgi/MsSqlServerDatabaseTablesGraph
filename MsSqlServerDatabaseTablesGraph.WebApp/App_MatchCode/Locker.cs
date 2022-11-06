using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

using M = System.Runtime.CompilerServices.MethodImplAttribute;
using O = System.Runtime.CompilerServices.MethodImplOptions;

namespace MsSqlServerDatabaseTablesGraph.WebApp
{
    /// <summary>
    /// 
    /// </summary>
    internal sealed class LockerAsync : IDisposable
    {
        /// <summary>
        /// 
        /// </summary>
        private sealed class Tuple : IDisposable
        {
            private int _RefCount;
            private AsyncCriticalSection _CS;

            [M(O.AggressiveInlining)] public Tuple( string key )
            {
                _RefCount = 1;
                Key = key;
                _CS = AsyncCriticalSection.Create();
            }
            public void Dispose() => _CS.Dispose();

            [M(O.AggressiveInlining)] public Task EnterAsync() => _CS.EnterAsync();
            [M(O.AggressiveInlining)] public void Exit() => _CS.Exit();

            public string Key { [M(O.AggressiveInlining)] get; }

            [M(O.AggressiveInlining)] public int IncrementRefCount() => ++_RefCount;
            [M(O.AggressiveInlining)] public int DecrementRefCount() => --_RefCount;
        }

        private static Dictionary< string, Tuple > _Dict;
        static LockerAsync() => _Dict = new Dictionary< string, Tuple >();

        [M(O.AggressiveInlining)] private static async Task< IDisposable > CreateLockerAsync( string key )
        {
            var o = new LockerAsync( key );
            await o._Tuple.EnterAsync().CAX();
            return (o);
        }

        private Tuple _Tuple;
        [M(O.AggressiveInlining)] private LockerAsync( string key )
        {
            lock ( _Dict )
            {
                if ( _Dict.TryGetValue( key, out _Tuple ) )
                {
                    _Tuple.IncrementRefCount();
                }
                else
                {
                    _Tuple = new Tuple( key );
                    _Dict.Add( key, _Tuple );
                }
            }
        }
        public void Dispose()
        {
            if ( _Tuple != null )
            {
                _Tuple.Exit();

                lock ( _Dict )
                {
                    if ( _Tuple.DecrementRefCount() <= 0 )
                    {
                        _Dict.Remove( _Tuple.Key );
                        _Tuple.Dispose();
                    }
                }
                _Tuple = null;
            }
        }

        public static Task< IDisposable > By_Key( string key ) => CreateLockerAsync( key );
    }
}