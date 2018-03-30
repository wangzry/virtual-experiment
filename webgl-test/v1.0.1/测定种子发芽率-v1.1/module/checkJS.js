/***
 *  异步加载模块
 *  作者：Badmaster
 *  创建时间：2018-1-16 16:19:27
 *  修改人：
 *  修改时间：
 *  修改描述：
 *  版本：v0.1
 *  描述：为window添加异步加载方法 checkJS
 *  使用方法：checkJS.load(url,(callback))
 *  返回值：checkJS.load();
 ***/

var checkJS = ( function (){

	var javascripts = 0;
	var loadedJs = 0;

	return  {
		load : function( url , callback){

			var self = this;

			javascripts++;

			$ .getScript( url )
			.done(function( script , textStatus ) {
				// console.log( jsLoaded );
			})
			.fail(function( jqxhr , settings , exception ) {
				// console.log( "Triggered ajaxError handler." );
				console.error( settings );
				console.error( exception );
			})
			.complete(function(){
				//执行完毕之后执行的内容，无论加载成功与否
			})
			.success(function(){
				loadedJs++;

				if( javascripts === loadedJs )self.jsLoaded = true;

				if( callback ) callback();
			});

		},

		jsLoaded : false,
		
		loadAll : false
	}
})();