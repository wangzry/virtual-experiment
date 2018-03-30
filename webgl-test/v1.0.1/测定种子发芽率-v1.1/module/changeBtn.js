/***
 * 左侧按钮创建模块
 * 作者：Badmaster
 * 创建时间：2018-1-16 16:03:03
 * 修改人：
 * 修改时间：
 * 修改描述：
 * 版本：0.1
 * 描述：响应式，支持移动端
 * 使用方法：只需要在组装模块内使用chackJS进行调用
 * 返回值：init()  需要参数 app  inner(只需要<span>部分)
 ***/
var changeBtn = ( function (){
	return {
		init : function( app , inner ){
			if( isPc ){

				app.append(
					'<div class="changeBtn" id="changeBtn">' +
						inner +
					'</div>'
				);

			}else{

				app.append(

					'<div class="openChangeBtn" id="openChangeBtn"></div>' +
					'<div class="changeBtn-mobel" id="changeBtn">' +
						'<div class="btnlist">' +
							inner +
						'</div>' +
						'<div class="c_closeBtn" id="c_closeBtn"></div>' +
					'</div>'

				);
				
			}
		}
	}
})();