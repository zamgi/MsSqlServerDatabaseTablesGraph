using System;
using System.Collections.Generic;
using System.Linq;

namespace ogdf;

/// <summary>
/// non thread-safe
/// </summary>
public sealed class GraphLayout
{
	private Dictionary< string, int >    _VertexNameDictionary;
	private HashSet< VertexLink >        _VertexIndexPairHashSet;
	private List< (double x, double y) > _CoordsList;
	private bool                         _CoordsIsProcessing;

    public GraphLayout()
    {
        _VertexNameDictionary   = new Dictionary< string, int >();
        _VertexIndexPairHashSet = new HashSet< VertexLink >();
        _CoordsList             = new List< (double x, double y) >();
    }

    public int AddVertex( string vertexName )
    {
        if ( _VertexNameDictionary.ContainsKey( vertexName ) ) throw (new InvalidOperationException( "Vertex already exists" ));

        _VertexNameDictionary.Add( vertexName, _VertexNameDictionary.Count );
        _CoordsIsProcessing = false;
        return (_VertexNameDictionary.Count);
    }
    public int AddVertexLink( string vertexName1, string vertexName2 )
    {
        if ( !_VertexNameDictionary.TryGetValue( vertexName1, out var vertexIndex1 ) ) throw (new ArgumentOutOfRangeException( "vertexName1" ));
        if ( !_VertexNameDictionary.TryGetValue( vertexName2, out var vertexIndex2 ) ) throw (new ArgumentOutOfRangeException( "vertexName2" ));

        var vl = new VertexLink( vertexIndex1, vertexIndex2 );
        if ( !_VertexIndexPairHashSet.Add( vl ) ) throw (new InvalidOperationException( "VertexLink already exists" ));
        
        _CoordsIsProcessing = false;
        return (_VertexIndexPairHashSet.Count);
    }

    public void ClearAll()
    {
        _VertexNameDictionary.Clear();
        _VertexIndexPairHashSet.Clear();
        _CoordsList.Clear();
        _CoordsIsProcessing = false;
    }

    public void ProcessingCoords( ProcessingCoordsMode processingCoordsMode )
    {
        if ( _VertexNameDictionary.Count == 1 )
        {
            _CoordsList.Clear();
            _CoordsList.Add( (0.5, 0.5) );
            _CoordsIsProcessing = true;
            return;
        }

        var handle = Native.OGDFCore_AllocMapNodes( _VertexNameDictionary.Count );
        try
        {
            foreach ( var vl in _VertexIndexPairHashSet )
            {
                Native.OGDFCore_AddNodesPair( handle, vl.VertexIndex1, vl.VertexIndex2 );
            }

            Native.OGDFCore_ProcessingCoords( handle, processingCoordsMode );

            _CoordsList.Clear();
            for ( int i = 0, count = _VertexNameDictionary.Count; i < count; i++ )
            {
                if ( Native.OGDFCore_GetNodeCoords( handle, i, out var x, out var y ) )
                {
                    _CoordsList.Add( (x, y) );
                }
            }
            StowageCoords2ZeroOneRange( _CoordsList );
            _CoordsIsProcessing = true;
        }
        finally
        {
            Native.OGDFCore_FreeMapNodes( handle );
        }
    }

    public (double x, double y) GetVertexCoords( string vertexName )
    {
        if ( !_CoordsIsProcessing ) throw (new InvalidOperationException( "Coords must be Processing" ));
        if ( !_VertexNameDictionary.TryGetValue( vertexName, out var idx ) )
        {
            throw (new ArgumentOutOfRangeException( "vertexName" ));
        }
        return (_CoordsList[ idx ]);
    }
    public IReadOnlyList< (double x, double y) > GetVertexCoords()
    {
        if ( !_CoordsIsProcessing ) throw (new InvalidOperationException( "Coords must be Processing" ));
        return (_CoordsList.ToArray());
    }

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
    /// Быстрый расчет координат узлов с учетом их размеров
    /// </summary>
    /// <param name="links">Список связей</param>
    /// <param name="processingCoordsMode">Вид раскладки</param>
    /// <param name="nodeSizes">Список узлов с указанием их размеров</param>
    /// <returns>Список координат узлов</returns>
    public static IReadOnlyDictionary< int, (int nodeIndex, double x, double y) > CalcSizedGraphLayout( IList< (int nodeIndex1, int nodeIndex2) > links, ProcessingCoordsMode processingCoordsMode
        , IList< (double width, double height) > nodeSizes = null )
    {
        var nodes = new HashSet< int >( links.Count >> 1 );
        foreach ( var (nodeIndex1, nodeIndex2) in links )
        {
            nodes.Add( nodeIndex1 ); nodes.Add( nodeIndex2 );
        }
        var count  = nodes.Count;
        var handle = Native.OGDFCore_AllocMapNodes( count );
        try
        {
            if ( nodeSizes != null )
            {
                for ( var i = 0; i < count; i++ )
                {
                    var sz = nodeSizes[ i ];
                    Native.OGDFCore_SetNodeSize( handle, i, sz.width, sz.height );
                }
            }

            foreach ( var (nodeIndex1, nodeIndex2) in links )
            {
                Native.OGDFCore_AddNodesPair( handle, nodeIndex1, nodeIndex2 );
            }

            Native.OGDFCore_ProcessingCoords( handle, processingCoordsMode );

            var coords   = new List< (double x, double y) >( nodes.Count );
            var nodeIdxs = new List< int >( nodes.Count );
            foreach ( var nodeIndex in nodes )
            {
                if ( Native.OGDFCore_GetNodeCoords( handle, nodeIndex, out var x, out var y ) )
                {                    
                    coords.Add( (x, y) );
                    nodeIdxs.Add( nodeIndex );
                }
            }
            StowageCoords2ZeroOneRange( coords );

            var dict = new Dictionary< int, (int nodeIndex, double x, double y) >( nodeIdxs.Count );
            for ( var i = 0; i < nodeIdxs.Count; i++ )
            {
                var nodeIndex = nodeIdxs[ i ];
                var (x, y)    = coords  [ i ];
                dict[ nodeIndex ] = (nodeIndex, x, y);
            }            
            return (dict);
        }
        finally
        {
            Native.OGDFCore_FreeMapNodes( handle );
        }
    }
}
