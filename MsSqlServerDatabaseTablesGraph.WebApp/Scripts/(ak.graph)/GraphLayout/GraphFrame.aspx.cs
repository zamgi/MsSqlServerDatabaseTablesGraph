using System;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace Searchlight.GraphLayout
{
	/// <summary>
	/// Summary description for WebForm1.
	/// </summary>
	public class GraphFrame : Page
	{
		protected Literal ltController;
		private void Page_Load(object sender, EventArgs e)
		{
			EnableViewState = false;
			ltController.Text = "<script type=\"text/javascript\" src=\"../" +
				Request["controller"] + "/scripts/graph.js\"></script>";
		}

		#region [.Web Form Designer generated code.]
		override protected void OnInit(EventArgs e)
		{
			InitializeComponent();
			base.OnInit(e);
		}

		/// <summary>
		/// Required method for Designer support - do not modify
		/// the contents of this method with the code editor.
		/// </summary>
		private void InitializeComponent()
		{
			this.Load += new System.EventHandler(this.Page_Load);
		}
		#endregion
	}
}