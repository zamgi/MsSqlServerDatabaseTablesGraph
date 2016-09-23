using System;
using System.Data;
using System.Web.Mvc.Html;

namespace System.Web.Mvc
{
    /// <summary>
    /// 
    /// </summary>
    public static class HtmlHelpers
    {
        public static MvcHtmlString GetTitle( this WebViewPage page )
        {
            var title = default(string);
            if ( page.ViewBag.Title != null )
            {
                title = page.ViewBag.Title + ", ";
            }
            title += MsSqlServerDatabaseTablesGraph.WebApp.Properties.Resource.LOGO_HEADER;
            return (new MvcHtmlString( title ));
        }
    }
}