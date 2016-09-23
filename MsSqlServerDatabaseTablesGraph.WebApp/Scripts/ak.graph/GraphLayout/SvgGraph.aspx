<%@ Page Language="c#" CodeBehind="SvgGraph.aspx.cs" AutoEventWireup="false"
         Inherits="Searchlight.GraphLayout.SvgGraph" %>
<!doctype html>
<html>
<head>
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>Граф</title>
	<link href="css/style0.css" rel="stylesheet" type="text/css" />
	<link href="css/form.css" rel="stylesheet" type="text/css" />
	<link href="css/graph.css" rel="stylesheet" type="text/css" />
	<link href="../scripts/jQuery/jquery.splitter.css" rel="stylesheet" type="text/css"/>
	<link href="../scripts/jQuery/contextMenu/jquery.contextMenu.css" rel="stylesheet" type="text/css"/>
	<link href="../scripts/jQuery/ui/theme-1/jquery-ui.css" rel="stylesheet" type="text/css"/>
	<link href="../scripts/jQuery/colorpicker/colorpicker.css" rel="stylesheet" type="text/css"/>
	<!--[if lt IE 9]>
	<script type="text/javascript">
		browserIncompatible = true;
	</script>
	<![endif]-->
	<script type="text/javascript"><!--
		if (typeof browseIncompatible == "undefined" && 
			(!document.implementation || !document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1"))) {
			browserIncompatible = true;
		}
		if (typeof browserIncompatible != "undefined") {
			window.onerror = function () { return false; }
		}
		var VmlDataName = "<%= _vmlDataName %>";
		var GraphLayoutName = "<%= _graphLayoutName %>";
	//-->
	</script>
	<script type="text/javascript" src="../scripts/jQuery/jQuery.js"></script>
	<script type="text/javascript" src="../scripts/d3js/d3.v2.js"></script>
	<script type="text/javascript" src="../scripts/d3js/d3.layout.ak.js"></script>
	<script type="text/javascript" src="../scripts/jQuery/jquery.splitter-0.6.js"></script>
	<script type="text/javascript" src="../scripts/jQuery/ui/jquery-ui.min.js"></script>
	<script type="text/javascript" src="../scripts/jQuery/contextMenu/jquery.ui.position.js"></script>
	<script type="text/javascript" src="../scripts/jQuery/contextMenu/jquery.contextMenu.js"></script>
	<script type="text/javascript" src="../scripts/jQuery/jquery.validate.min.js"></script>
	<script type="text/javascript" src="../scripts/jQuery/jquery.validate.ru.js"></script>
	<script type="text/javascript" src="../scripts/fontlist.js"></script>
	<script type="text/javascript" src="../scripts/jQuery/colorpicker/colorpicker.js"></script>
    <script type="text/javascript" src="../scripts/jQuery/jquery.showModalDialog.js"></script>
    <link rel="stylesheet" type="text/css" href="../Reports/ReportsNTParamDlg.css" />
</head>
<body>
    <div id="content" class="full-height">
		<div id="mainFrame" class="full-height">
			<div id="leftMenu">
				<div id="menuContent">
					<div id="menuButtons" class="menuToolbar">
					</div>
					<div id="menuTitle">
						<input type="checkbox" id="acbAll" />
						<span class="titleText"></span>
					</div>
					<div id="menuRows"></div>
					<div id="clearfooter"></div>
				</div>
				<div id="menuFooter" class="menuToolbar">
				</div>
			</div>
			<div id="graph">
				<div class="navButtons">
					<img id="BtNavBack" alt="" title="Отменить действие" class="SemiTransparent" 
						src="../SocNet/Images/HistoryBackGrey.gif" />
					<img id="BtNavForward" alt="" title="Повторить действие" class="SemiTransparent" 
						src="../SocNet/Images/HistoryNextGrey.gif" />
					<img id="BtHome" alt="" title="Сброс масштаба" class="SemiTransparent" 
						src="Images/home.png" />
				</div>
			</div>
		</div>
    </div>
	<div class="dialogHolder">
	<%
		Response.WriteFile("dialogs/ViewParams.html");
	%>
	</div>
	<asp:Literal ID="ltInitData" runat="server"></asp:Literal>
	<script type="text/javascript" src="scripts/SvgGraph.js"></script>
	<script type="text/javascript"><!--
		if (typeof browserIncompatible != "undefined") {
			document.getElementById("content").innerHTML =
				'<div style="margin: 10px auto; width: 600px">'+
				"<h2>Ваш браузер не поддерживает отображение векторной графики.</h2>" +
				"Попробуйте следующее:<ul>" +
				"<li>Обновите ваш браузер до последней версии." +
				"<li>Если вы используете Internet Explorer 9, убедитесь, что отключен режим совместимости." +
				"</ul></div>";
		}
	//-->
	</script>
</body>
</html>
