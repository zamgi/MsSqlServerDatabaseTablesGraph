using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;

namespace ogdf
{
    /// <summary>
    /// non thread-safe
    /// </summary>
    public static class GraphLayout
    {
        private static void StowageCoords2ZeroOneRange( IList< (double x, double y) > coords )
        {
            double min_x = double.MaxValue, min_y = double.MaxValue;
            double max_x = 0.0, max_y = 0.0;

            foreach ( var pt in coords )
            {
                if ( pt.x < min_x ) min_x = pt.x;
                if ( pt.y < min_y ) min_y = pt.y;

                if ( max_x < pt.x ) max_x = pt.x;
                if ( max_y < pt.y ) max_y = pt.y;
            }

            for ( int i = 0, len = coords.Count; i < len; i++ )
            {
                var pt     = coords[ i ];
                var new_pt = ((pt.x - min_x) / (max_x - min_x), (pt.y - min_y) / (max_y - min_y));
                coords[ i ] = new_pt;
            }
        }

        /// <summary>
        /// Быстрый расчет координат узлов с учетом их 
        /// </summary>
        /// <param name="nodeSizes">Список узлов с указанием их размеров</param>
        /// <param name="links">Список связей</param>
        /// <param name="processingCoordsMode">Вид раскладки</param>
        /// <returns>Список координат узлов</returns>
        public static IReadOnlyDictionary< int, (double x, double y) > CalcSizedGraphLayout( 
            IList< (int nodeIndex1, int nodeIndex2) > links, int nodeCount, ProcessingCoordsMode processingCoordsMode )
        {
            nodeCount = Math.Max( nodeCount, links.Max( t => Math.Max( t.nodeIndex1, t.nodeIndex2 ) ) + 1 );

            var handle = Native.OGDFCore_AllocMapNodes( nodeCount );
            try
            {
                foreach ( var (nodeIndex1, nodeIndex2) in links )
                {
                    Native.OGDFCore_AddNodesPair( handle, nodeIndex1, nodeIndex2 );
                }
                Native.OGDFCore_ProcessingCoords( handle, processingCoordsMode );

                var coords = new List< (double x, double y) >( nodeCount );
                for ( var i = 0; i < nodeCount; i++ )
                {
                    if ( Native.OGDFCore_GetNodeCoords( handle, i, out var x, out var y ) )
                    {                    
                        coords.Add( (x, y) );
                    }
                }
                StowageCoords2ZeroOneRange( coords );

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
    }
}
