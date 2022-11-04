namespace ogdf;

/// <summary>
/// 
/// </summary>
internal sealed class VertexLink
{
    public int VertexIndex1;
    public int VertexIndex2;

    public VertexLink( int vertexIndex1, int vertexIndex2 )
    {
        VertexIndex1 = vertexIndex1;
        VertexIndex2 = vertexIndex2;
    }
}
