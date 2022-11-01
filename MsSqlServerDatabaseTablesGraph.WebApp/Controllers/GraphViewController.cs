using System.Web.Http;
using System.Web.Mvc;

using MsSqlServerDatabaseTablesGraph.WebApp.Models;

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
        public ActionResult V1( [FromUri] DALGetRefsInputParams inputParams )
        {
            inputParams.TryLoadFromCookies( System.Web.HttpContext.Current.Request );
            DALGetTablesInputParams.ThrowIfWrong( inputParams );

            return View( inputParams );
        }

        [HttpPost, HttpGet, NoCache, NoOutputCache]
        public ActionResult V2( [FromUri] DALGetRefsInputParams inputParams )
        {
            inputParams.TryLoadFromCookies( System.Web.HttpContext.Current.Request );
            DALGetTablesInputParams.ThrowIfWrong( inputParams );

            return View( inputParams );
        }

        [HttpGet, NoCache, NoOutputCache]
        public ActionResult HTTP404() => View();
    }
}
