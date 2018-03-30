/***
 *	观察模块
 *	创建人：Badmaster
 *	创建时间：2018-1-23 09:37:06
 *	修改人：Badmaster
 *	修改时间：2018-3-5 10:38:38
 *	修改描述：修复bug，在dae模型下无法正确显示隐藏网格的问题
 *	修改人：曾梓健
 *	修改时间：2018-2-27 14:01:14
 *	修改描述：向观察场景中添加单个物体时，添加isObject3D的判断
 *	版本：v0.1
 *	描述：通过简单的方法去调用并实现基本的观察模块的操作，支持自定义方法的实现
 *	使用方法：exp.observe.init(....)
 *				相关参数：必选参数：exp(场景exp),model(需要观察的模型，支持多个，多个以数组形式添加)
 *							可选参数：img(如果是只有观察模块的请忽略),btns(这是一个对象数组格式类似于[{},{},...])
 *										btns:{
 *												title:'培养皿', //一级导航名称,如果有btns则必须
 *												list:['纱布','培养皿','标签'], //二级导航名称
 *												meshname:['Gauze','CultureDish','CultureDishLable'],//与二级导航名称对应的mesh名字
 *												description : '培养皿？这货不是纯血的吧', //一级导航描述
 *												descriptions:['纱布，嗯，很粗糙','培养皿，透明的','标签？什么鬼'] //二级导航描述，位置需要一一对应
 *											 }
 *										description(整体描述)
 *										isOnlyUse(是否为单独使用的observe模块,是需要传入true)
 *  返回：无
 ***/

var observe = (function (){

	var self , Exp , observeHtml = '' ; //非单独调用的基本参数

	var oldTime; //声明时间变量，通过时间来判断具体内容点击事件是否执行，延迟300ms

	var observePath = rootUrl + "/image/observe/"; //observe路径

	var obBtns; //observe下的按钮

	var imgBtn; //图片按钮

	var ob_description; //描述

	var changeBtn , openChangeBtn ; //左下选择列表

	var app , width , height ; //单独使用时需要的参数

	var singleBtn;//底部按钮

	/**
	 * 非单独调用的情况下使用的初始化场景方法
	 * @param  {[string]} img   [图片名.xxx]
	 * @param  {[Arry/Object3D]} model [单独的模型或者模型组]
	 * @param  {[Arry]} btns  [按钮组]
	 * @return 无
	 */
	function initObScene( img , model , btns ){

		self.scene = new THREE.Scene();//创建一个新的场景

		self.camera = new THREE.PerspectiveCamera( 50 , Exp.areaWidth / Exp.areaHeight , 0.1 , 350 );//创建一个新的相机

		self.controls = new THREE.OrbitControls( self.camera , Exp.renderer.domElement ); //一个全新的控制器

		if( img )self.controls.enabled = false; //如果有传入图片，禁用观察模块相机控制器

		self.controls.enablePan = false; //默认禁用平移

		Exp.renderer.setClearColor( self.color ); //场景有默认的背景颜色

		self.camera.initPosition = new THREE.Vector3( 0 , 10 , 50 ); //保存在相机下的初始化位置
		self.camera.target = new THREE.Vector3( 10 , 3 , 0 ); //初始化相机观察点以及控制器target
		initCameraView(); //初始化相机视角、lookAt以及相机控制器

		var ambient =  new THREE.AmbientLight( 0xffffff , 1 ); //场景的环境光
		self.scene.add( ambient );

		self.light = new THREE.DirectionalLight( 0xffffff , 1 ); //场景有一个默认的平行光
		self.scene.add( self.light );

		//通过传入模型为数组还是单一对象进行操作
		if( model.constructor === Array ){

			//如果为多个模型，观察场景默认不显示任何模型
			for( var i = 0 ; i < model.length ; i++ ){

				model[i].visible = false;
				if( i == 0 )model[i].visible = true;
				self.scene.add( model[i] );

			}

		}else{

			// 目前模型仅支持这四种参数格式
			if( model.isObj || model.isDae || model.isMesh || model.isObject3D ){

				self.scene.add( model );

			}else{

				throw new Error('请检查模型是否正确！或者检查是否存在用于判断的参数！');

			}	

		}

		if( img )initStyle( img ); //如果有图片，初始化左上角图片按钮

		initBtns( btns ); //初始化按钮

		observeEvents();

		if( self.isCustom )self.customFn(); //如果使用自定义方法，将使用自定的方法，否则初始化按钮默认事件

		self.isInit = true; //observe观察模块初始化完毕

	}

	/**
	 * 初始化相机视角
	 * @return null
	 */
	function initCameraView(){

		self.camera.position.copy( self.camera.initPosition );
		self.camera.lookAt( self.camera.target );
		self.controls.target.copy( self.camera.target );

	}

	/**
	 * 初始化左上角观察模块入口
	 * @param  {[string]} img [图片名.xxx]
	 * @return 无
	 */
	function initStyle( img ){

		observeHtml =   '<div id="obShow-model" class="show-model">'+
							'<img width="100%" height="100%" src="'+ observePath + img +'" />'+
						'</div>'

		Exp.app.append( observeHtml );

	}

	/**
	 * 初始化观察模块按钮组
	 * @param  {[Arry]} btns [一个数组对象]
	 * @return 无
	 */
	function initBtns( btns ){

		observeHtml = '';

		var className = 'ob_title';
		var titleSelected = 'titleSelected';

		var description;

		if( !btns )return; //如果没有参数，不执行按钮创建

		for( var key in btns ){ //为每一个传入的参数创建按钮

			var btn = btns[ key ];

			if( btn.meshname === undefined )btn.meshname = []; //获取当前按钮list列表的meshname数组，没有的话默认空数组
			if( btn.modelname === undefined )btn.modelname = ''; //title用到的模型的名字
			if( btn.list === undefined )btn.list = []; //获取list列表数组
			if( btn.description === undefined )btn.description = ''; //title大标题的描述

			var title = '';

			var list = '' ;

			for( var i = 0 ; i < btn.list.length ; i++ ){

				var dess = '';

				if( btn.descriptions )dess = btn.descriptions[i] ? btn.descriptions[i] : ''; //判断详细描述是否存在

				list += '<ol meshname="'+ btn.meshname[i] +'" descriptions="'+ dess +'" >'+ btn.list[i] +'</ol>';

			}

			if( key == 0 ){

				title = '<dt class="'+ className + ' ' + titleSelected +'" id="ob_title'+ key +'" modelname="'+ btn.modelname +'" description="'+ btn.description +'" ><h2>'+ btn.title +'</h2></dt>' ;
				list = '<dd class="ob_list" id="ob_list'+ key +'"><ul style="height:'+ ( 51 * btn.list.length ) +'px">'+ list +'</ul></dd>';

			}else{

				title = '<dt class="'+ className +'" id="ob_title'+ key +'" modelname="'+ btn.modelname +'" description="'+ btn.description +'" ><h2>'+ btn.title +'</h2></dt>' ;
				list = '<dd class="ob_list" id="ob_list'+ key +'"><ul>'+ list +'</ul></dd>';

			}

			observeHtml += ( title + list );

		}

		description = self.description; //判断参数是否传入模型描述

		observeHtml = '<div id="observeBtns" class="observeList">'+
							'<div class="ob_exitBtn" id="ob_exitBtn"><span></span><span></span></div>'+
							'<div class="ob_closeOpen" id="ob_closeOpen"><span class="c_close"></span><span class="c_close"></span></div>'+
							'<dl class="ob_dl">'+
								observeHtml + 
							'</dl>'+
						'</div>';

		var noUse = description === undefined ? true : false ; //如果未传入，自定义参数noUse为true，描述框默认为隐藏的

		observeHtml += '<div class="ob_description" id="ob_description" noUse="'+  noUse +'" ><p>'+ description +'</p></div>';

		Exp.app.append( observeHtml );

	}

	/**
	 * 观察模块按钮默认事件
	 * @return 无
	 */
	function observeEvents(){

		imgBtn = document.getElementById( 'obShow-model' ); //左上角图片按钮
		obBtns = document.getElementById( 'observeBtns' ); //观察模块左侧列表
		ob_description = document.getElementById( 'ob_description' ); //观察模块描述框
		changeBtn = document.getElementById( 'changeBtn' ); //非观察模块左下角选择按钮组
		openChangeBtn = document.getElementById( 'openChangeBtn' ); //移动端左下角按钮

		var ob_exitBtn = document.getElementById( 'ob_exitBtn' ); //退出观察模块按钮
		var ob_closeOpen = document.getElementById( 'ob_closeOpen' ); //观察模块左侧列表收缩、弹出按钮
		var c_closeArr = document.getElementsByClassName( 'c_close' ); //观察模块关闭样式 <
		var c_openArr = document.getElementsByClassName( 'c_open' ); //观察模块打开样式 >
		var ob_titleArr = document.getElementsByClassName( 'ob_title' ); //导航
		var ob_listArr = document.getElementsByClassName( 'ob_list' ); //列表
		var allOl = obBtns.getElementsByTagName( 'ol' ); //列表项
		
		var layerTip; //layerTip

		//判断该模块是否为单独调用
		if( !self.isOnlyUse ){

			//不是单独调用，则存在img，添加左上角图片按钮事件
			imgBtn.ontouchstart = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();
				
			}

			imgBtn.onclick = function ( ev ){

				var e = ev || window.event;
				e.stopPropagation();

				layerTip = document.getElementsByClassName( 'webgl-tip-css' )[0]; //获取layerTip
				singleBtn = document.getElementsByClassName( 'singleBtn' )[0];//获取底部按钮

				if( Exp.setting.needHighContrast )postProcessing.ssaoPass.enabled = false; //判断是否使用了高对比度模式，使用了将禁用该模式

				Exp.isRender = false; //不再渲染exp场景

				self.isRender = true; //观察模块渲染启动

				imgBtn.style.display = 'none'; //图片按钮隐藏

				if( ob_description && ob_description.attributes[ "noUse" ].nodeValue !== 'true' )ob_description.style.display = 'block'; //当描述框存在，且使用的时候显示描述框

				if( changeBtn )changeBtn.style.display = 'none'; //非观察模块的左侧列表隐藏
 
				if( openChangeBtn )openChangeBtn.style.display = 'none'; //移动端按钮隐藏

				Exp.userPos = Exp.camera.position.clone(); //将现有的用户相机数据存储到exp下
				Exp.userTarget = Exp.controls.target.clone(); //将现有的相机控制器数据存储到exp

				Exp.camera.position.set( 0 , 10000 , 0 ); //将非观察模块的相机推远，让其不影响后续的观察
				Exp.controls.target.set( 0 , 10000 , 0 ); //将非观察模块的相机控制器target推远，让其不影响后续的观察

				Exp.controls.enabled = false; //exp的相机控制器禁用
				self.controls.enabled = true; //启用观察模块的相机控制器
				self.isUse = true; //使用观察模块

				obBtns.style.display = 'block'; //显示观察模块的左侧按钮组

				if( singleBtn )singleBtn.style.display = 'none';//隐藏底部按钮

				if( !layerTip )return; //如果没有layerTip直接退出
				layerTip.style.oldDis = layerTip.style.display;
				layerTip.style.display = 'none';

			}

			ob_exitBtn.ontouchstart = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

			}

			//观察模块退出按钮点击事件
			ob_exitBtn.onclick = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

				layerTip = document.getElementsByClassName( 'webgl-tip-css' )[0]; //获取layerTip
				singleBtn = document.getElementsByClassName( 'singleBtn' )[0];//获取底部按钮

				if( Exp.setting.needHighContrast )postProcessing.ssaoPass.enabled = ( localStorage.getItem( 'Rainier_useHighContrast' ) === 'true' );//如果启用了高对比度模式，从缓存中获取属性值

				Exp.isRender = true; //exp场景进行渲染

				self.isRender = false; //观察模块禁止渲染

				imgBtn.style.display = 'block'; //观察模块入口图片按钮显示

				Exp.controls.enabled = true; //exp场景的相机控制器使用

				Exp.camera.position.copy( Exp.userPos ); //重置上一次进入位置
				Exp.controls.target.copy( Exp.userTarget ); 

				self.controls.enabled = false; //观察模块的相机控制器禁用
				self.isUse = false; //不再使用观察模块

				obBtns.style.display = 'none'; //观察模块左侧列表栏隐藏

				if( changeBtn )changeBtn.style.display = 'block'; //非观察模块左侧列表显示

				if( openChangeBtn )openChangeBtn.style.display = 'block'; //如果为移动端显示左下按钮

				if( ob_description )ob_description.style.display = 'none'; //观察模块上部描述框隐藏

				if( singleBtn )singleBtn.style.display = 'block';//显示底部按钮

				if( !layerTip )return; //如果没有就退出
				layerTip.style.display = layerTip.style.oldDis;

			}

		}else{//直接渲染观察模块，没有主场景

			if( obBtns )obBtns.style.display = 'block';//左侧列表显示
			if( ob_description && ob_description.attributes[ "noUse" ].nodeValue !== 'true' )ob_description.style.display = 'block';
			ob_exitBtn.style.display = 'none'; //隐藏退出按钮
			postProcessing.ssaoPass.enabled = false; //直接禁用高对比度模式，不过不写入缓存

			self.isUse = true; //使用观察模块

		}

		obBtns.isOpen = true;//初始化左侧列表打开状态
		ob_closeOpen.ontouchstart = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

		}

		//左侧列表收缩展开按钮点击事件
		ob_closeOpen.onclick = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

			if( obBtns.isOpen ){

				obBtns.style.left = '-200px';

				c_closeArr[0].className = 'c_open';//获取到按钮上的span，并修改className
				c_closeArr[0].className = 'c_open';

				obBtns.isOpen = false;

			}else{

				obBtns.style.left = '0';

				c_openArr[0].className = 'c_close';
				c_openArr[0].className = 'c_close';

				obBtns.isOpen = true;

			}

		}

		oldTime = new Date();//生成一个用于判断的时间，子列表需要一定事件进行动画缓冲，否则会引起抖动
		for( var key in ob_titleArr ){//循环生成顶级列表按钮的点击事件

			ob_titleArr[ key ].ontouchstart = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

			}

			//循环生成列表按钮点击事件
			ob_titleArr[ key ].onclick = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

				if( new Date() - oldTime <= 300 )return; //少于300ms无法点击
				oldTime = new Date();

				var _this = this;

				var description = this.attributes[ "description" ].nodeValue;//获取自定义属性的值

				if( ob_description && description ){//描述框与描述都存在，将描述框显示，并修改内容；否则隐藏

					ob_description.style.display = 'block';
					ob_description.innerHTML = '<p>'+ description +'</p>';

				}else{

					ob_description.style.display = 'none';

				}

				_this.className = 'ob_title titleSelected'; //被点击的按钮修改className

				//循环将title按钮className重置,同时将按钮对应的位置保存
				for( var i = 0 ; i < ob_titleArr.length ; i++ ){

					if( ob_titleArr[ i ] !== _this ){

						ob_titleArr[ i ].className = 'ob_title';

					}else{

						_this.indexOf = i;

					}

				}

				//将所有子按钮className重置
				for( var i = 0 ; i < allOl.length ; i++ ){

					allOl[ i ].className = '';

				}

				//判断模型是否存在，同时判断当前传入的模型类型
				if( self.model ){

					//为数组，获取对应下标的模型
					if( self.model.constructor === Array ){

						var thisModel = self.model[ _this.indexOf ];//获取对应模型

						thisModel.visible = true;//将隐藏的模型显示

						thisModel.traverse( function( child ){//循环遍历这个模型，如果有保存的材质，将这些Mesh或者SkinnedMesh的材质重置

							if( child.isMesh || child.isSkinnedMesh ){

								if( child.oldMat )child.material = child.oldMat.clone();
								child.visible = true;

							}

						});

						//将其他的模型隐藏
						for( var i = 0 ; i < self.model.length ; i++ ){

							if( self.model[ i ] !== thisModel ){

								self.model[ i ].visible = false;

							}

						}

					}else{//如果只有一个模型，重置材质并显示所有模型

						if( self.titleFn !== undefined ){

							self.titleFn();
							return;

						}

						var thisModel = self.model;

						thisModel.visible = true;

						thisModel.traverse(function(child){

							if(child.isMesh || child.isSkinnedMesh){

								if( child.oldMat )child.material = child.oldMat.clone();
								child.visible = true;

							}

						});

					}

				}

				var dd = document.getElementById( 'ob_list'+_this.indexOf ); //获取当前点击的列表
				var ul = dd.getElementsByTagName( 'ul' )[0]; //获取列表下ul
				var olArr = ul.getElementsByTagName( 'ol' ); //获取所有子集
				ul.style.height = ( 51 * olArr.length ) + 'px'; //根据子集长度为ul进行高度赋值

				//将其余的列表子集隐藏
				for( var j = 0 ; j < ob_listArr.length ; j++ ){

					if( ob_listArr[ j ] !== dd ){

						var otherUl = ob_listArr[ j ].getElementsByTagName( 'ul' )[0];
						otherUl.style.height = '0';

					}

				}

			}

		}

		//循环生成列表子按钮的点击事件
		for( var key in allOl ){

			allOl[ key ].ontouchstart = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();
				
			}

			allOl[ key ].onclick = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

				var _this = this;

				var name = this.attributes[ "meshname" ].nodeValue;//获取按钮对应的meshName

				if( name === 'undefined' )return;//如果没有name，直接退出

				var arr = name.split( "," );//将meshName转化为数组
				var childrenArr = [];//子对象数组
				var len = arr.length;//获取meshName数组的长度

				var descriptions = this.attributes[ "descriptions" ].nodeValue;//获取描述

				//描述框存在，且有描述，显示描述
				if( ob_description && descriptions ){

					ob_description.style.display = 'block';
					ob_description.innerHTML = '<p>'+ descriptions +'</p>';

				}else{

					ob_description.style.display = 'none';

				}

				_this.className = 'olSelected';//为选中的ol添加class

				//将剩余的className移除
				for( var i = 0 ; i < allOl.length ; i++ ){

					if( allOl[ i ] !== _this ){

						allOl[ i ].className = '';

					}

				}

				if( self.listFn !== undefined ){

					self.listFn(name);
					return;

				}

				if( self.model ){

					if( self.model.constructor !== Array ){

						self.model.traverse( function (child){

							if( child.isMesh || child.isSkinnedMesh ){

								if( !child.oldMat )child.oldMat = child.material.clone();

								child.material.transparent = true;

								childrenArr.push(child);

							}

						});

						for( var i = 0 ; i < childrenArr.length ; i++ ){

							if( len === 1 ){

								if( self.model.isDae ){

									if( childrenArr[i].parent.name !== name ){

										childrenArr[i].material.wireframe = true;
										childrenArr[i].material.opacity= 0.15;

									}else{

										childrenArr[i].material = childrenArr[i].oldMat.clone();
										
									}

								}else{

									if( childrenArr[i].name !== name ){

										childrenArr[i].material.wireframe = true;
										childrenArr[i].material.opacity= 0.15;

									}else{

										childrenArr[i].material = childrenArr[i].oldMat.clone();
										
									}

								}

							}else if( len === 2 ){

								if( self.model.isDae ){

									if( childrenArr[i].parent.name !== arr[0]  && childrenArr[i].parent.name !== arr[1] ){

										childrenArr[i].material.wireframe = true;
										childrenArr[i].material.opacity= 0.15;

									}else{

										childrenArr[i].material = childrenArr[i].oldMat.clone();
										
									}

								}else{

									if( childrenArr[i].name !== arr[0] && childrenArr[i].name !== arr[1] ){

										childrenArr[i].material.wireframe = true;
										childrenArr[i].material.opacity= 0.15;

									}else{

										childrenArr[i].material = childrenArr[i].oldMat.clone();
										
									}

								}

							}else{

								throw new Error('三个及以上的参数还是自己改模块吧!');

							}

						}

						if(  self.model.isMesh ){

							self.model.visible = false;

						}

					}else{

						for( var i = 0 ; i < self.model.length ; i++ ){

							var thisModel = self.model[ i ];

							thisModel.traverse( function ( child ){

								if( child.isMesh || child.isSkinnedMesh ){

									if( !child.oldMat )child.oldMat = child.material.clone();

									child.material.transparent = true;

									childrenArr.push(child);

								}

							});

							for( var i = 0 ; i < childrenArr.length ; i++ ){

								if( len === 1 ){

									if( childrenArr[i].name !== name ){

										childrenArr[i].material.wireframe = true;
										childrenArr[i].material.opacity= 0.15;

									}else{

										childrenArr[i].material = childrenArr[i].oldMat.clone();
										
									}

								}else if( len === 2 ){

									if( childrenArr[i].name !== arr[0] && childrenArr[i].name !== arr[1] ){

										childrenArr[i].material.wireframe = true;
										childrenArr[i].material.opacity= 0.15;

									}else{

										childrenArr[i].material = childrenArr[i].oldMat.clone();
										
									}

								}else{

									throw new Error('三个及以上的参数还是自己改模块吧!');

								}

							}

							if(  thisModel.isMesh ){

								self.model.visible = false;

							}

						}

					}

				}

			}

		}

	}

	/**
	 * 重置方法
	 * @return 无
	 */
	function reset(){

		if( !self.isOnlyUse ){//不是单独使用
 
			Exp.isRender = true; //渲染exp主场景

			Exp.postProcessing.outlinePass.enabled = true; //启用outline

			if( Exp.obRender !== null ){ //不为空，将渲染通道开关关闭
		
	    		Exp.obRender.enabled = false;
		
	    	}

	    	if( ob_description )ob_description.style.display = 'none'; //描述框隐藏

	    	if( imgBtn )imgBtn.style.display = 'block'; //入口图片按钮显示

	    	if( obBtns )obBtns.style.display = 'none'; //观察模块左侧列表隐藏

		}	

		self.reset();

	}

	return {

		init : function ( params ){
 
			self = this;

			if( self.isInit ){ //是否初始化，如果已初始化，调用reset方法

				reset();

				return;

			}

			Exp = params.exp; //传入exp

			self.isRender = !Exp.isRender; //当前场景是否渲染与exp场景相反

			self.model = params.model; //传入的模型

			self.description = params.description; //最外层描述

			if( params.isCustom !== undefined )self.isCustom = params.isCustom; //是否启用自定义方法

			if( params.customFn !== undefined )self.customFn = params.customFn; //自定义方法

			params.color !== undefined ? self.color = params.color : Exp.renderer.getClearColor() ; //获取背景色

			params.img !== undefined ? self.isOnlyUse = false : self.isOnlyUse = true; //是否单独使用
 
			initObScene( params.img , params.model , params.btns ); //初始化观察模块

		},

		onResize : function (){

			self.camera.aspect = ( Exp.areaWidth / Exp.areaHeight );
			self.camera.updateProjectionMatrix();

		},

		color : '' ,

		customFn : function(){} ,

		reset : function(){} ,

		scene : '' ,

		camera : '' ,

		controls : '' ,

		isInit : false ,

		isCustom : false ,

		isUse : false ,

		isOnlyUse : null

	}

})();