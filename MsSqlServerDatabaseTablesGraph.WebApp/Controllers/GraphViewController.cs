using System.Web.Http;
using System.Web.Mvc;

using MsSqlServerDatabaseTablesGraph.WebApp.Models;

using _HttpContext_ = System.Web.HttpContext;
using HttpPost = System.Web.Http.HttpPostAttribute;
using HttpGet  = System.Web.Http.HttpGetAttribute;

namespace MsSqlServerDatabaseTablesGraph.WebApp.Controllers
{
    /// <summary>
    /// 
    /// </summary>
    public class GraphViewController : Controller
    {
        public ActionResult Index() => View( "V1", new DALGetRefsInputParams() );

        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public ActionResult V1( [FromUri] DALGetRefsInputParams ip )
        {
            _HttpContext_.Current.Request.LoadFromCookies_2( ip );
            DALGetTablesInputParams.ThrowIfWrong( ip );

            return View( ip );
        }

        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public ActionResult V2( [FromUri] DALGetRefsInputParams ip )
        {
            _HttpContext_.Current.Request.LoadFromCookies_2( ip );
            DALGetTablesInputParams.ThrowIfWrong( ip );

            return View( ip );
        }

        [HttpGet, NoCache, NoOutputCache]
        public ActionResult HTTP404() => View();
    }
}
