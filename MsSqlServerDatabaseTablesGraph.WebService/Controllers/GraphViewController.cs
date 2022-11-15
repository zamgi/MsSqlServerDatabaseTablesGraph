using Microsoft.AspNetCore.Mvc;

using MsSqlServerDatabaseTablesGraph.WebService.Models;

namespace MsSqlServerDatabaseTablesGraph.WebService.Controllers
{
    /// <summary>
    /// 
    /// </summary>
    [Route("[controller]")]
    public class GraphViewController : Controller
    {
        public const string CONTROLLER_NAME = "GraphView";

        [HttpPost, HttpGet/*, NoCache, NoOutputCache*/, Route("")]
        public ActionResult Index() => View( "V1", new DALGetRefsInputParams() );

        [HttpPost, HttpGet/*, NoCache, NoOutputCache*/, Route("V1")]
        public ActionResult V1( [FromQuery] DALGetRefsInputParams ip )
        {
            Request.LoadFromCookies( ip );
            DALGetTablesInputParams.ThrowIfWrong( ip );

            return View( ip );
        }

        [HttpPost, HttpGet/*, NoCache, NoOutputCache*/, Route("V2")]
        public ActionResult V2( [FromQuery] DALGetRefsInputParams ip )
        {
            Request.LoadFromCookies( ip );
            DALGetTablesInputParams.ThrowIfWrong( ip );

            return View( ip );
        }

        [HttpGet/*, NoCache, NoOutputCache*/, Route("HTTP404")] public ActionResult HTTP404() => View();
    }
}
