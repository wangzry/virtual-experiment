/***
 *	模型、贴图加载模块，有监听机制
 *	创建人：Badmaster
 *	创建时间：2018-1-15 14:31:34
 *	修改人：
 *	修改时间：
 *	修改描述：
 *	版本：v0.1
 *	描述：实现obj，dae，json，img的加载
 *	使用方法：loaders.load(......);
 *  返回：json
 ***/
 
var loaders = ( function (){

	var self;

	var _rootUrl = rootUrl;

	var manager = new THREE.LoadingManager();
	var OBJLoader = new THREE.OBJLoader( manager );//用于加载obj模型
	var DAELoader = new THREE.ColladaLoader();//用于加载dae模型
	var IMGLoader = new THREE.TextureLoader( manager );//用于加载图片
	var JSONLoader = new THREE.JSONLoader( manager );//用于加载json格式的模型

	manager.onProgress = function ( item, loaded, total ) { //manager监听模型和贴图资源加载情况

		self.jdNum = Math.floor( (( loaded + self.daeLoaded ) / ( total + self.daeTotal )) * 100 );
		
		if( loaded == total ) {

			self.isSourceLoaded = true;//当所有obj模型和图片加载完以后，exp.isSourceLoaded参数为true

		}
	}

	function checkDae( name ) {//手动添加dae模型检测机制

		if( self.isUse )self.daeTotal++;

	}

	function setReady( name ) {//手动完成dae模型加载判断

		if( self.isUse )self.daeLoaded++;

	}

	/**
	 * loadStart方法
	 * @return undefined
	 */
	function loadStart(){

		var loaderTimer = setInterval( function(){

			if( self.isSourceLoaded ){//监听three器调用结束

				if( self.daeTotal === 0 ){//如果没有dae

					clearInterval( loaderTimer );

					if( self.isUse ){

						self.jdNum = 100;
						self.isLoaded = true;

					}

				}else{//有dae模型，判断dae加载完毕

					if( self.daeTotal === self.daeLoaded ){

						clearInterval( loaderTimer );

						if( self.isUse ){

							self.jdNum = 100;
							self.isLoaded = true;

						}

					}

				}

			}

		}, 1000/60 );

	}

	/**
	 * loading模块在这里调用
	 * @return undefined
	 */
	function loadingStart(){

		var autoTimer = setInterval( function (){

			loading.loadStart( self.jdNum );

			if( self.isLoaded )clearInterval( autoTimer );

		},1000/60);

	}

	/**
	 * obj加载方法,内部调用
	 * @param  {[String]} name    [文件夹名字]
	 * @param  {[String]} url     [需要加载的obj模型所在路径]
	 * @param  {[String]} objName [模型名称]
	 * @return undefined
	 */
	function objLoader( name , url , objName ) { 
			//obj格式加载
			var model;

			if( self.isUse )self.total++;

			OBJLoader.load( url , function( obj ){

				model = obj;
				model.isObj = true;
				if( !self.models[ name ] )self.models[ name ] = {};
				self.models[ name ][ objName ] = model;

				if( self.isUse )self.loaded++;

			});
		}

		/**
		 * dae模型加载方法，内部调用
		 * 内部调用dae手动监听机制
		 * @param  {[String]} name    [文件夹名字]
		 * @param  {[String]} url     [需要加载的dae模型所在路径]
		 * @param  {[String]} objName [模型名称]
		 * @return undefined
		 */
		function daeLoader( name , url , objName ) { 
			//dae格式加载,手动监听
			var model;

			checkDae( name );

			DAELoader.options.convertUpAxis = true;
			DAELoader.load( url , function( collada ){

				model = collada.scene;
				model.isDae = true;
				if( !self.models[ name ] )self.models[ name ] = {};
				self.models[ name ][ objName ] = model;

				setReady( name );
			});
		}

		/**
		 * img图片加载方法，内部调用
		 * @param  {[String]} name   [文件夹名字]
		 * @param  {[String]} suffix [模型名称/名称后缀]
		 * @param  {[String]} url    [需要加载的img图片所在路径]
		 * @return undefined
		 */
		function imgLoader( name , suffix , url ) { 
			//image加载
			var image;

			if( self.isUse )self.total++;

			image = IMGLoader.load( url );
			image.anisotropy = ANISOTROPY;
			if( !self.images[ name ] )self.images[ name ] = {};
			var objJson = self.images[ name ];
			objJson[ suffix ] = image;

			if( self.isUse )self.loaded++;

		}

		/**
		 * json格式加载方法，内部调用
		 * @param  {[String]} name    [文件夹名字]
		 * @param  {[String]} url     [需要加载的json模型所在路径]
		 * @param  {[String]} objName [模型名称]
		 * @return undefined
		 */
		function jsonLoader( name , url , objName ) { 
			//json加载
			var model;

			if( self.isUse )self.total++;

			JSONLoader.load( url ,function( geometry , materials ){

				var material = materials[ 0 ];
				if( material.morphTargets ){
					material.morphTargets = true;
				}
				model = new THREE.Mesh( geometry , materials );
				model.matrixAutoUpdate = false;
				model.updateMatrix();
				if( !self.models[ name ] )self.models[ name ] = {};
				self.models[ name ][ objName ] = model;

				if( self.isUse )self.loaded++;

			});
		}

	return {
		/**
		 * load方法，外部可调用
		 * @param  {[Arry]} arguments [数组，使用数组包含数组，传入对应的文件夹名称以及文件]
		 * @return undefined
		 */
		load : function( arguments ){

			self = this;

			self.isSourceLoaded = false; //调用该方法将参数重置

			for( var arr of arguments){

				if(arr.length === 1)throw new Error('请检查参数！文件夹名称之后至少有一个模型或图片作为参数传入!');

				var url = _rootUrl + '/model/' + arr[0];

				for(var i = 1 ; i < arr.length ; i++){
					
					var path = url +'/'+ arr[ i ];
					var TYPE = arr[ i ].split('.');
					
					if( TYPE[1] === 'obj' ){
						self.models[arr[0]] = {};
						objLoader( arr[0] , path , TYPE[0] );
					}
					if( TYPE[1] === 'dae' ){
						self.models[arr[0]] = {};
						daeLoader( arr[0] , path , TYPE[0] );
					}
					if( TYPE[1] === 'jpg' || TYPE[1] === 'png' ){
						var suffix = arr[ i ].split('_')[1][0];
						imgLoader( arr[0] , suffix , path );
					}
					if( TYPE[1] === 'js' || TYPE[1] === 'json' ){
						self.models[arr[0]] = {};
						jsonLoader( arr[0] , path , TYPE[0] ); 
					}
				}
				
			}

			if( self.isUse )console.log( '共有：' + ( this.total + this.daeTotal ) + '个文件' );//返回文件个数

			loadStart();//内部启用loader监听

			if( self.isUse )loadingStart();//如果手动使用了，则启动loading监听

		},

		/**
		 * 外部可调用了img加载方法，仅支持图片的加载
		 * @param  {[Arry]} arguments [数组，使用数组包含数组，传入对应的文件夹名称以及文件]
		 * @return undefined
		 */
		imgLoader : function( arguments ){

			self = this;

			for( var arr of arguments){

				if(arr.length === 1)throw new Error('请检查参数！文件夹名称之后至少有一个模型或图片作为参数传入!');

				if( this.imgPath === null )throw new Error('请检查参数！imgPath不能为空!');

				var url = _rootUrl + '/' + this.imgPath + '/' + arr[0];

				for(var i = 1 ; i < arr.length ; i++){
					
					var path = url +'/'+ arr[i];
					var name = arr[i].split('.');

					imgLoader( arr[0] , name[0] , path );

				}
				
			}

		},

		jdNum : 0 , //外部可查询的进度

		imgPath : null , //存放图片路径

		models : {} , //存放所有使用该方法加载的模型

		images : {} , //存放所有使用该方法加载的图片

		total : 0 , //three.js内部监测到的所有非dae模型与图片的数量

		loaded : 0 , //three.js内部监测到的已加载的非dae模型与图片的数量

		daeTotal : 0 , //手动监测的dae模型数量

		daeLoaded : 0 , //手动监测的已加载dae模型数量

		isUse : false , //需要手动写为true的方法

		isSourceLoaded : false , //用于判断three.js内部监听器是否已监测完毕

		isLoaded : false //是否加载完成，只有isUse为true的时候才有可能更改状态
	}
})();