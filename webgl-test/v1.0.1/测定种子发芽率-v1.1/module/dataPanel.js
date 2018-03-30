/*
*模块名称：数据记录面板模块
*负责人：曾梓健
*创建时间：2018-3-1 14:24:06
*修改人：曾梓健
*修改时间：2018-3-5 17:25:44
*修改内容：1.为数据面板左侧纵向标题添加文字提示框，提醒用户该标题有点击功能;
*		2.添加addTip(tip)和clearTip()2个方法
*修改人：曾梓健
*修改时间：2018-3-7 14:54:10
*修改内容：1.添加获取某位置数据的getData()方法
*修改人：曾梓健
*修改时间：2018-3-8 13:20:08
*修改内容：1.添加addLine()方法，可以动态为表格添加新行，传入参数为字符串或字符串组成的数组
*版本：v1.0.1
*详细描述：
*使用方法：
*返回值：DataPanel类
*/
var DataPanel = ( function(){

	var $panel;
	var $table;
	var self;

	//初始化记录数据面板
	function init( params ){

		var $dom = params.dom;
		var hor, 
			ver, 
			horNum, 
			verNum;
		var pos;

		hor = params.title.hor ? params.title.hor : "";
		ver = params.title.ver ? params.title.ver : "";
		pos = params.pos ? params.pos : "lt";

		$dom.append( '<div id="dataPanel"><table id="dataTable"></table></div>' );

		$panel = $( "#dataPanel" );
		$table = $( "#dataTable" );
		$panel.css( {
			position : "absolute" ,
			backgroundColor : "rgba(0, 0, 0, 0.3)"
		} );

		switch( pos ) {
			case "lt" :
				$panel.css( {
					left : 0 ,
					top : 0 ,
					borderBottomRightRadius : "4px"
				} );
				break;

			case "rt" :
				$panel.css( {
					right : 0 ,
					top : 0 ,
					borderBottomLeftRadius : "4px"
				} );
				break;

			case "lb" :
				$panel.css( {
					left : 0 ,
					bottom : 0 ,
					borderTopRightRadius : "4px"
				} );
				break;

			case "rb" :
				$panel.css( {
					right : 0 ,
					bottom : 0 ,
					borderTopLeftRadius : "4px"
				} );
				break;

		}

		var horHtml = '';
		var verHtml = '';
		
		if( hor ) {

			horHtml += '<tr><th></th>';

			if( Array.isArray( hor ) ) {

				horNum = hor.length;

				for( var i in hor ) {

					horHtml += '<th class="hor"><span class="title">' + hor[ i ] + '</span></th>';

				}

			} else {

				horNum = 1;

				horHtml += '<th class="hor"><span class="title">' + hor + '</span></th>';

			}

			horHtml += '</tr>';

		}

		if( ver ) {

			if( Array.isArray( ver ) ){

				verNum = ver.length;

				for( var i in ver ){

					verHtml += '<tr><th class="ver"><span class="title">' + ver[ i ] + '</span></th>';

					for( var j = 1 ; j <= horNum ; j++ ){

						var verIndex = Number( i ) + 1;

						verHtml += '<td pos="' + verIndex + '-' + j + '"></td>';

					}

					verHtml += "</tr>";

				}

			} else {

				verNum = 1;

				verHtml += '<tr><th class="ver"><span class="title">' + ver + '</span></th>';

				for( var j = 1 ; j <= horNum ; j++ ){

					verHtml += '<td pos="' + '1-' + j + '"></td>';

				}

				verHtml += "</tr>";

			}


		}

		$table.append( horHtml + verHtml );

		return self;

	}

	//向表格中添加数据
	function addData( pos , html ) {

		$table.find( "td[pos=" + pos + "]" ).html( html );

		return self;

	}

	//获取表格中某位置的数据内容
	function getData( pos ){

		var ctx = $table.find( "td[pos=" + pos + "]" ).html();

		return ctx;

	}

	//清空指定位置的数据
	function clearData( pos ) {

		$table.find( "td[pos=" + pos + "]" ).html("");

		return self;

	}

	//清空所有表格数据
	function clearAll() {

		$table.find( "td" ).html("");

		return self;

	}

	function addTip( ctx ) {

		var tipHtml = '<div class="tip"><span class="arrow"></span><span class="tipContent">' + ctx + '</span></div>';

		var top = $panel.height();
		var left = 0;

		$panel.append( tipHtml );

		$panel.find( ".tip" ).css({
			position : "absolute" ,
			top : top + 10 ,
			left : left + 10 
		}).find( ".arrow" ).css({
			position : "absolute" ,
			display : "inline-block" ,
			left : 10 ,
			top : -10 ,
			boxSizing : "border-box" ,
			borderBottom : "10px solid rgba(0, 0, 0, 0.6)" ,
			borderLeft : "10px solid rgba(0, 0, 0, 0)" ,
			borderRight : "10px solid rgba(0, 0, 0, 0)" ,
		});
		$panel.find( ".tipContent" ).css({
			width : 214 ,
			display : "inline-block" ,
			backgroundColor : "rgba(0, 0, 0, 0.6)" ,
			color : "#fff" ,
			padding : "10px" ,
			borderRadius : "4px" ,
			boxSizing : "border-box" ,
			textAlign : "center"
		});

		return self;

	}

	function clearTip() {

		$panel.find(".tip").remove();

		return self;

	}

	//为表格新增一行
	function addLine( p ){

		var newHtml = '';
		var horLength = $table.find( ".hor" ).length;
		var verLength = $table.find( ".ver" ).length;

		if( Array.isArray( p ) ) {

			for( var i in p ){

				newHtml += '<tr><th class="ver"><span class="title">' + p[ i ] + '</span></th>';

				for( var j = 1 ; j <= horLength ; j++ ){

					var verIndex = verLength + Number( i ) + 1;

					newHtml += '<td pos="' + verIndex + '-' + j + '"></td>';

				}

				newHtml += "</tr>";

			}

		} else {

			newHtml += '<tr><th class="ver"><span class="title">' + p + '</span></th>';

			var verIndex = verLength + 1;

			for( var j = 1 ; j <= horLength ; j++ ){

				newHtml += '<td pos="' + verIndex + '-' + j + '"></td>';

			}

			newHtml += "</tr>";

		}

		$table.append( newHtml );

	}

	function _DataPanel(){

		self = this;

		this.init = init;
		this.addData = addData;
		this.getData = getData;
		this.clearData = clearData;
		this.clearAll = clearAll;
		this.addTip = addTip;
		this.clearTip = clearTip;
		this.addLine = addLine;

	}

	return _DataPanel;

} )();