<%@ Page Language="c#" CodeBehind="GraphFrame.aspx.cs" AutoEventWireup="false"
         Inherits="Searchlight.GraphLayout.GraphFrame" EnableSessionState="ReadOnly" %>
<!doctype html>
<html>
<head>
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <title>Граф</title>
	<link href="css/style.css" rel="stylesheet" type="text/css" />
	<link href="css/form.css" rel="stylesheet" type="text/css" />
	<link href="css/graph.css" rel="stylesheet" type="text/css" />
	<link href="css/minimap.css" rel="stylesheet" type="text/css" />
	<link href="../scripts/jQuery/jquery.splitter.css" rel="stylesheet" type="text/css"/>
	<link href="../scripts/jQuery/contextMenu/jquery.contextMenu.css" rel="stylesheet" type="text/css"/>
	<link href="../scripts/jQuery/ui/theme-1/jquery-ui.css" rel="stylesheet" type="text/css"/>
	<link href="../scripts/jQuery/colorpicker/colorpicker.css" rel="stylesheet" type="text/css"/>
    <link rel="stylesheet" type="text/css" href="../Reports/ReportsNTParamDlg.css" />
	<!--[if lt IE 9]>
	<script type="text/javascript">
		browserIncompatible = true;
	</script>
	<![endif]-->
	<script type="text/javascript"><!--
		if (typeof browserIncompatible == "undefined" &&
			(!document.implementation || !document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1"))) {
			browserIncompatible = true;
		}
		var GraphId = '<%= Request["id"] %>';
		if (typeof browserIncompatible != "undefined") {
			window.location.href = '../VmlNet/Redirect.aspx?controller=<%=Request["controller"]%>&id=' + GraphId;
			window.onerror = function () { return false; }
		}
	//-->
	</script>
	<script type="text/javascript" src="../scripts/jQuery/jQuery.js"></script>
	<script type="text/javascript" src="../scripts/d3js/d3.v3.min.js"></script>
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
	<script type="text/javascript" src="scripts/json2.js"></script>
    <script type="text/javascript" src="../Reports/Reports.js"></script>
	<script type="text/javascript" src="scripts/minimap.js"></script>
	<script type="text/javascript" src="scripts/overlapRemoval.js"></script>
</head>
<body>
	<div id="messageScreen" class="full-height" style="display:none">
		<div class="messageBlock ui-corner-all center-screen">
			<div class="messageHeader">
				Аналитический курьер
			</div>
			<div id="messageText">
				Работа с системой завершена
			</div>
			<div class="messageLink">
				<a href="../MainWebForm.aspx">Вернуться</a>
			</div>
		</div>
	</div>
	<div id="loader" class="center-screen loader-icon">
		<img src="../images/busy.gif" alt="Загрзузка..." />
		<div id="loaderTimeout" style="display:none">
			Загрузка идет слишком долго.<br />
			Попробуйте вернуться и <br /> 
			скорректировать параметры вызова.<br />
			<a id="locaderCancel" href="javascript: void(0);">Назад</a>
		</div>
	</div>
    <div id="content" class="full-height" style="visibility:hidden">
		<div id="mainFrame" class="full-height">
			<div id="leftMenu">
				<div class="menuHeader">
					<div class="menuToolbarWrap">
						<div class="menuToolbar">
							<div class="menuToolbarArea">
								<div id="menuButtons" class="menuInner">
								</div>
							</div>
						</div>
					</div>
					<div id="menuTitle">
						<input type="checkbox" id="acbAll" />
						<span class="titleText"></span>
					</div>
				</div>
				<div id="menuContent">
					<div id="menuRows"></div>
				</div>
 				<div id="menuFooter" class="menuToolbarWrap bottom" style="display:none">
					<div class="menuToolbar">
						<div class="menuToolbarArea">
							<div class="menuInner">
							</div>
						</div>
					</div>
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
				<div id="scaleBox">
					<select class="ui-widget ui-widget-content ui-corner-all">
						<option value="0">100%</option>
						<option value="1">100%</option>
						<option value="1.5">150%</option>
						<option value="2">200%</option>
						<option value="3">300%</option>
						<option value="5">500%</option>
						<option value="10">1000%</option>
					</select>
				</div>
			</div>
		</div>
    </div>
	<div id="dialogs" class="dialogHolder"></div>
	<script type="text/javascript" src="scripts/GraphLayout.js"></script>
	<asp:Literal ID="ltController" runat="server"></asp:Literal>
	<script type="text/javascript"><!--
		if (typeof browserIncompatible != "undefined") {
			document.getElementById("content").innerHTML =
				'<div style="margin: 10px auto; width: 600px">' +
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
