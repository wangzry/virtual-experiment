/***
 * loading模块
 * 作者：Badmaster
 * 创建时间：2018-1-15 17:26:27
 * 修改人：
 * 修改时间：
 * 修改描述：
 * 版本：0.1
 * 描述：响应式，支持移动端，实现对于模型加载进度的实时监控，同时在没有模型加载的情况下可以正常使用
 * 使用方法：*******不要在主入口内实例化！在正常情况下这个模块无需手动添加到主入口内******
 * 返回值：initLoading(),loadStart(),unload()
 ***/
 
 var loading = ( function (){

 	var loaded = false;  //内部使用的参数，正确的禁止定时器的循环

  	return {

  		/**
  		 * 初始化loading界面，动态在body中添加
  		 * @return undefined
  		 */
  		initLoading : function(){

  			$("body").append(
				'<div class="container" id="loadingCon">'+
		        '<div id="loading"></div>'+
		        '<div class="internal-ring3">'+
		          '<div class="internal-ring3-p1-c">'+
		            '<div class="p1-an">'+
		              '<div class="internal-ring3-p1-r"></div>'+
		            '</div>'+
		          '</div>'+
		          '<div class="internal-ring3-p2-c">'+
		            '<div class="p2-an">'+
		              '<div class="internal-ring3-p2-r"></div>'+
		            '</div>'+
		          '</div>'+
		        '</div>'+
		        // '<div class="internal-ring4"></div>' +
		        '<div class="internal-ring2">'+
		          '<div class="internal-ring2-c">'+
		            '<div class="internal-ring2-r"></div>'+
		          '</div>'+
		        '</div>'+
		        '<div class="outer-ring"></div> '+
		        '<div class="outer-ring2"></div>'+
		        '<div class="jindu">加载进度：0%</div>'+
		        '</div>'
			);

  		},

  		/**
  		 * loading开始的方法，该方法已经在loaders内部调用，一般情况下不需要手动调用
  		 * @param  {[String]} num [进度数值]
  		 * @return undefined
  		 */
  		loadStart : function ( num ){

			var loading = document.getElementById( 'loading' );
			var jindu = document.getElementsByClassName( 'jindu' )[0];
			var container = document.getElementsByClassName( 'container' )[0];
			var jdNum;
			
			jdNum = num;
			
			if( jdNum === 0 ){

				loading.style.opacity = 1;
				loading.style.width = '0%';

			}
				
			if( jdNum === 100 ){

				if( loaded )return;

				if( loaders.isLoaded )loaded = true;

				if( jindu )jindu.innerHTML = '正在进行最后的渲染！';

				if( loading ){

					loading.style.width = 100+'%';
					loading.style.background = '#fff';
					loading.style.opacity = 0;

				}

			}else{

				loading.style.width = jdNum + '%';
				jindu.innerHTML = '加载进度：' + jdNum + '%';

			} 
		},

		/**
		 * 如果没有加载模型所调用的方法，该方法在initScene中已调用，正常情况下无需手动调用
		 * @return undefined
		 */
  		unload : function(){

  			 loaders.isLoaded = true;

			this.loadStart( 100 );

		}
  	}
  })();