using System;
using System.Collections.Generic;
using System.Linq;

namespace ogdf
{
    /// <summary>
    ///
    /// </summary>
    public static class GraphLayout
    {
        public static IReadOnlyDictionary< int, (double x, double y) > CalcSizedGraphLayout( 
            IList< (int nodeIndex1, int nodeIndex2) > links, int nodeCount, 
            CoordsLayoutMode coordsLayoutMode, in (int width, int height) layoutFieldSize )
        {
            nodeCount = Math.Max( nodeCount, links.GetMaxNodeIndex() + 1 );

            var handle = Native.OGDFCore_AllocMapNodes( nodeCount );
            try
            {
                foreach ( var (nodeIndex1, nodeIndex2) in links )
                {
                    Native.OGDFCore_AddNodesPair( handle, nodeIndex1, nodeIndex2 );
                }
                Native.OGDFCore_ProcessingCoords( handle, coordsLayoutMode );

                var coords = new (double x, double y)[ nodeCount ];
                for ( var i = 0; i < nodeCount; i++ )
                {
                    if ( Native.OGDFCore_GetNodeCoords( handle, i, out var x, out var y ) )
                    {                    
                        coords[ i ] = (x, y);
                    }
                }
                StowageCoords2ZeroOneRange( coords, layoutFieldSize );

                var dict = new Dictionary< int, (double x, double y) >( nodeCount );
                for ( var i = 0; i < nodeCount; i++ )
                {
                    dict[ i ] = coords[ i ];
                }
                return (dict);
            }
            finally
            {
                Native.OGDFCore_FreeMapNodes( handle );
            }
        }        

        private static void StowageCoords2ZeroOneRange( (double x, double y)[] coords, in (int width, int height) layoutFieldSize, 
            double xy_NaN = 0.5, double xy_NaN_offset = 0.01 )
        {
            double min_x = double.MaxValue, min_y = double.MaxValue;
            double max_x = 0.0, max_y = 0.0;

            for ( int i = 0, len = coords.Length; i < len; i++ )
            {
                ref readonly var pt = ref coords[ i ];
                if ( pt.x < min_x ) min_x = pt.x;
                if ( pt.y < min_y ) min_y = pt.y;

                if ( max_x < pt.x ) max_x = pt.x;
                if ( max_y < pt.y ) max_y = pt.y;
            }

            var x_NaN = xy_NaN;
            var y_NaN = xy_NaN;

            double get_x( double x )
            {
                var x_d = (max_x - min_x);

                double x_n;
                if ( x_d == 0 )
                {
                    x_n = x_NaN;
                    x_NaN += xy_NaN_offset;
                }
                else
                {
                    x_n = (x - min_x) / x_d;
                }
                return (x_n);
            }
            double get_y( double y )
            {
                var y_d = (max_y - min_y);

                double y_n;
                if ( y_d == 0 )
                {
                    y_n = y_NaN;
                    y_NaN += xy_NaN_offset;
                }
                else
                {
                    y_n = (y - min_y) / y_d;
                }
                return (y_n);
            }

            for ( int i = 0, len = coords.Length; i < len; i++ )
            {
                ref /*readonly*/ var pt = ref coords[ i ];

                var x_n = get_x( pt.x ) * layoutFieldSize.width;
                var y_n = get_y( pt.y ) * layoutFieldSize.height;

                pt = (x_n, y_n);
                //coords[ i ] = (x_n * layoutFieldSize.width, y_n * layoutFieldSize.height);
            }
        }

        private static int GetMaxNodeIndex( this IList< (int nodeIndex1, int nodeIndex2) > links )
            => (links != null) && (0 < links.Count) ? links.Max( t => Math.Max( t.nodeIndex1, t.nodeIndex2 ) ) : 0;
    }
}
