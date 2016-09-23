using System;
using System.Collections;
using System.Drawing;
using System.IO.Compression;
using System.Web;
using OGDF;

namespace Searchlight.GraphLayout
{
    /// <summary>
    /// Summary description for Layout
    /// </summary>
    public class Layout : IHttpHandler
    {
        public static object locker = new object();

        public void ProcessRequest( HttpContext context )
        {
            try
            {
                if ( context.Request[ "v" ] == "2" )
                {
                    DoSizedLayout( context );
                    return;
                }
                var mode = (ProcessingCoordsMode) int.Parse( context.Request[ "type" ] );
                var nodes = int.Parse( context.Request[ "nodes" ] );
                var list = new ArrayList();

                var gl = new OGDF.GraphLayout();
                for ( var i = 0; i < nodes; i++ )
                    gl.AddVertex( i.ToString() );
                var links = context.Request.Form.GetValues( "l[]" );
                if ( links != null )
                {
                    foreach ( var s in links )
                    {
                        var ar = s.Split( 't' );
                        gl.AddVertexLink( ar[ 0 ], ar[ 1 ] );
                    }
                }
                //выполнить расчет
                gl.ProcessingCoords( mode );

                //запомнить результат
                for ( var i = 0; i < nodes; i++ )
                {
                    var pt = gl.GetVertexCoords( i.ToString() );
                    list.Add( new
                    {
                        X = pt.X,
                        Y = pt.Y
                    } );
                }
                gl.ClearAll();

                GzipResponseContent( context );
                context.Response.ContentType = "application/json";
                var bytes = System.Text.Encoding.UTF8.GetBytes( SerializeJson( list ) );
                //---context.Response.AppendHeader("Content-Length", bytes.Length.ToString());
                context.Response.OutputStream.Write( bytes, 0, bytes.Length );
                //context.Response.Flush();
            }
            catch ( Exception ex )
            {
                //log4net.LogManager.GetLogger( System.Reflection.MethodBase.GetCurrentMethod().DeclaringType ).Error( "Layout general error", ex );
                throw ex;
            }
        }

        private void DoSizedLayout( HttpContext context )
        {
            var fontName = context.Request[ "fontName" ];
            var fontSize = int.Parse( context.Request[ "fontSize" ] );
            var mode = (ProcessingCoordsMode) int.Parse( context.Request[ "type" ] );
            var texts = context.Request.Form.GetValues( "n[]" );
            var sizes = context.Request.Form.GetValues( "s[]" );
            var reqLinks = context.Request.Form.GetValues( "l[]" );
            if ( texts == null || sizes == null || reqLinks == null )
                return;
            var font = new Font( fontName, fontSize );
            var nodeSizes = new SizeF[ texts.Length ];
            for ( int i = 0; i < texts.Length; i++ )
            {
                var textSize = TextRenderer.MeasureText( texts[ i ], font );
                var iconSize = float.Parse( sizes[ i ] );
                nodeSizes[ i ] = new SizeF( Math.Max( textSize.Width * 0.8f, iconSize ), iconSize + textSize.Height );
            }
            var links = new Tuple<int, int>[ reqLinks.Length ];
            for ( int i = 0; i < links.Length; i++ )
            {
                var ar = reqLinks[ i ].Split( 't' );
                links[ i ] = new Tuple<int, int>( int.Parse( ar[ 0 ] ), int.Parse( ar[ 1 ] ) );
            }
            var nodes = OGDF.GraphLayout.CalcSizedGraphLayout( nodeSizes, links, mode );
            var list = new ArrayList();
            foreach ( var pt in nodes )
            {
                list.Add( new
                {
                    X = pt.X,
                    Y = pt.Y
                } );
            }
            GzipResponseContent( context );
            context.Response.ContentType = "application/json";
            var bytes = System.Text.Encoding.UTF8.GetBytes( SerializeJson( list ) );
            //---context.Response.AppendHeader("Content-Length", bytes.Length.ToString());
            context.Response.OutputStream.Write( bytes, 0, bytes.Length );
            //context.Response.Flush();
        }

        public bool IsReusable { get { return true; } }

        /// <summary>
        /// Сжимает ответ сервера gzip'ом, если браузер это поддерживает
        /// </summary>
        public static void GzipResponseContent( HttpContext context )
        {
            var encodingsAccepted = context.Request.Headers[ "Accept-Encoding" ];
            if ( string.IsNullOrEmpty( encodingsAccepted ) )
                return;

            encodingsAccepted = encodingsAccepted.ToLowerInvariant();
            var response = context.Response;

            if ( encodingsAccepted.Contains( "deflate" ) )
            {
                response.AppendHeader( "Content-encoding", "deflate" );
                response.Filter = new DeflateStream( response.Filter, CompressionMode.Compress );
            }
            else if ( encodingsAccepted.Contains( "gzip" ) )
            {
                response.AppendHeader( "Content-encoding", "gzip" );
                response.Filter = new GZipStream( response.Filter, CompressionMode.Compress );
            }
        }

        public static string SerializeJson( object data )
        {
            return JSON.Serialize( data );
        }
    }
}