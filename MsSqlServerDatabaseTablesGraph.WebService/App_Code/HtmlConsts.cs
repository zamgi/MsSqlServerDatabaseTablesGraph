using System;

namespace Microsoft.AspNetCore.Mvc
{
    /// <summary>
    /// 
    /// </summary>
    public static class HtmlConsts
    {
        private static string _JavascriptResourceVersion;
        public  static string JavascriptResourceVersion
        {
            get
            {
                if ( _JavascriptResourceVersion == null )
                {
                    lock ( typeof(HtmlConsts) )
                    {
                        if ( _JavascriptResourceVersion == null )
                        {
                            //var v = ConfigurationManager.AppSettings[ "JavascriptResourceVersion" ];
                            //_JavascriptResourceVersion = !string.IsNullOrWhiteSpace( v ) ? v : DateTime.Now.Ticks.ToString();
                            _JavascriptResourceVersion = DateTime.Now.Ticks.ToString();
                        }
                    }
                }
                return (_JavascriptResourceVersion);
            }
        }
    }
}