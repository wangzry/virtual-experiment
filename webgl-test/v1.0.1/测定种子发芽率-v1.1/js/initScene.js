/**
 *  组装模块
 *  
 *  创建人：润尼尔(Rainier)
 *  创建时间：2018-1-17 14:40:23
 *  
 *  修改人：
 *  修改时间：
 *  修改描述：
 *  
 *  版本：v1.1
 *  
 *  描述：交由曾梓健描写
 *  
 *  使用方法：无
 *  
 *  返回值：无
 */

THREE = null;

var mobileDragSelected = false; //触屏拖拽操作是否有选中物体，默认为false

$.ajaxSetup({ 
	cache: true 
}); 

if( $( ".loading-div" ).length !== 0 ){ //删除原有loading

	$( ".loading-div" ).remove();

}

var webglPath = rootUrl + "/module/";//公共路径
// var webglPath = "../../module/";//公共路径

var allJsLoaded = false;//异步js是否全部加载完毕

var RainierWebGL;//声明rainierWebgl

$.getScript( webglPath + "loading.js" , function() {//加载loading模块，加载完毕执行loading

	loading.initLoading();

});

$.getScript( webglPath + "checkJS.js" , function() {//加载checkJS模块，加载完毕执行以下方法
	
	checkJS.load( webglPath + "three88.js" );
	checkJS.load( webglPath + "judgePc.js" );

	var timer1 = setInterval( function() {

		if( checkJS.jsLoaded ) {

			clearInterval( timer1 );

			checkJS.jsLoaded = false;

			checkJS.load( webglPath + "ColladaLoader.js" );
			checkJS.load( webglPath + "OBJLoader.js" );
			checkJS.load( webglPath + "OrbitControls_defined.js" );

			var timer2 = setInterval( function() {

				if( checkJS.jsLoaded ) {

					clearInterval( timer2 );

					checkJS.jsLoaded = false;

					checkJS.load( webglPath + "Constants.js" );
					checkJS.load( webglPath + "setMaterial.js" );
					checkJS.load( webglPath + "loaders.js" );
					checkJS.load( webglPath + "click.js" );
					checkJS.load( webglPath + "drag.js" );
					checkJS.load( webglPath + "layerTip.js" );
					checkJS.load( webglPath + "postProcessing.js" );
					checkJS.load( webglPath + "rainier_shaders.js" );
					checkJS.load( webglPath + "setAll.js" );
					checkJS.load( webglPath + "triggerPoint.js" );
					checkJS.load( webglPath + "webglUI.js" );
					checkJS.load( webglPath + "camera.js" );
					checkJS.load( webglPath + "setting.js" );
					checkJS.load( webglPath + "changeBtn.js" );
					// checkJS.load( webglPath + "distortionEffect.js" );
					checkJS.load( webglPath + "observe.js" );

					checkJS.loadAll = true;

				}
			}, 1000/60 );
		}
	}, 1000/60 );


	var judgeJsLoaded = setInterval( function (){

		if( checkJS.jsLoaded && checkJS.loadAll ){

			clearInterval( judgeJsLoaded );

			var self;

			/**
			 * 禁用鼠标右键
			 * @return null
			 */
			function disableRight(){

				document.oncontextmenu = function( e ){ return false; } 
				document.onselectstart = function( e ){ return false; } 

			}

			/**
			 * 清空outline方法
			 * @return null
			 */
			function removeOutline(){

				self.postProcessing.outlinePass.selectedObjects = [];

			}

			/**
			 * 初始化render方法
			 * @return null
			 */
			function initRenderer( bgColor ) {

				var clearColor = bgColor !== undefined ? bgColor : 0x162129 ;

				self.renderer = new THREE.WebGLRenderer({

					antialias : true

				});

				if( localStorage.getItem( 'Rainier_useShaderPass' ) === "true" || localStorage.getItem( 'Rainier_useShaderPass' ) === null ){

					self.renderer.autoClear = false;

				}else{

					self.renderer.autoClear = true;

				}

				ANISOTROPY = self.renderer.capabilities.getMaxAnisotropy();

				self.renderer.shadowMap.enabled = true;
				self.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
				self.renderer.setPixelRatio( window.devicePixelRatio );
				self.renderer.setSize( self.areaWidth , self.areaHeight );
				self.app.append( self.renderer.domElement );
				self.renderer.setClearColor( clearColor );

			}

			/**
			 * 初始化场景方法
			 * @return null
			 */
			function initScene(){

				self.scene = new THREE.Scene();
				self.scene.add( self.expScene );

			}

			/**
			 * 初始化相机
			 * @return null
			 */
			function initCamera(){

				self.camera = new THREE.PerspectiveCamera( 45 , self.areaWidth / self.areaHeight , 0.1 , 500 );
				self.camera.position.set( 0 , 10 , 0 );

			}

			/**
			 * 初始化相机控制器
			 * @return null
			 */
			function initControls(){

				self.controls = new THREE.OrbitControls( self.camera , self.renderer.domElement );

			}

			/**
			 * 屏幕大小改变时画面自适应
			 * @return null
			 */
			function OnWindowResize() {

				self.areaWidth = self.app.width();
				self.areaHeight = self.app.height();

				self.camera.aspect = self.areaWidth / self.areaHeight;
				self.camera.updateProjectionMatrix();
				self.renderer.setSize( self.areaWidth , self.areaHeight );

				//窗口改变，改变渲染通道的渲染场景大小
				if( self.postProcessing.isInit && self.postProcessing.isUse ){

					self.postProcessing.onResize( self.scene , self.camera , self.areaWidth , self.areaHeight );

				}

				if( self.observe.isInit ){

					self.observe.onResize();

				}	

			}

			/**
			 * 渲染器渲染相机拍摄到的场景
			 * @return null
			 */
			function render() {

				TWEEN.update();

				self.controls.update();

				if( self.isRender ){

					if( self.postProcessing.isInit && self.postProcessing.isUse ){

			        	if( self.UIRender === null &&  self.sceneUI && self.cameraUI ){

			        		self.UIRender = new THREE.RenderPass( self.sceneUI , self.cameraUI );
			        		self.UIRender.clear = false; //不清空上一次渲染
			        		self.postProcessing.Composer.insertPass( self.UIRender , 1 );

			        	}

			        	if( self.obRender !== null ){

			        		self.obRender.enabled = false;

			        	}

		        		self.postProcessing.outlinePass.enabled = true;

			        	self.postProcessing.Composer.render();

			        }else{

			        	self.renderer.clear();
			        	self.renderer.render( self.scene , self.camera );
			        	self.renderer.autoClear = false;

				        if( self.sceneUI && self.cameraUI ) {

				        	self.renderer.render( self.sceneUI , self.cameraUI );

				        }
			        }

				}else{

					if( self.observe ){

						if( self.observe.isInit ){

							if( self.postProcessing.isInit && self.postProcessing.isUse ){

								if( self.obRender === null ){

									self.obRender = new THREE.RenderPass( self.observe.scene , self.observe.camera );
									self.postProcessing.Composer.insertPass( self.obRender , 2 );

								}else{

									self.obRender.enabled = true;

								}

								self.postProcessing.outlinePass.enabled = false;

								self.postProcessing.Composer.render();

							}else{

								self.renderer.clear();
				        		self.renderer.render( self.observe.scene , self.observe.camera );

							}

						}

					}

				}

			}

			/**
			 * 重置相机
			 * @return null
			 */
			function resetCamera(){

				self.controls.reset();
				self.controls.enabled = true;
				initCameraView();
				// render();

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

			function createHUD( light ){

				var lightShadowMapViewer = new THREE.ShadowMapViewer( light );
				lightShadowMapViewer.position.x = 10;
				lightShadowMapViewer.position.y = self.areaHeight - ( self.areaHeight / 4 ) - 10;
				lightShadowMapViewer.size.width = self.areaWidth / 4;
				lightShadowMapViewer.size.height = self.areaHeight / 4;
				lightShadowMapViewer.update();

			}

			function initUI(){

				self.loader.imgPath = 'image';
				self.loader.imgLoader( [
					[ 'UI' , 'UI1.png' , 'UI2.png' , 'UI3.png' , 'triggerPoint.png' ]
				] );

				self.createUI([

					self.allImages.UI.UI1,
					self.allImages.UI.UI2,
					self.allImages.UI.UI3

				]);
			}

			function initBasicScene( sceneId ){

				var SceneId = sceneId !== undefined ? sceneId : 1 ;

				switch( SceneId ) {
					case 0:
						self.camera.initPosition = new THREE.Vector3( 0 , 10 , 100 );
						self.camera.target = new THREE.Vector3( 0 , 0 , 0 );
						initCameraView();

						break;

					case 1:
						var ambient =  new THREE.AmbientLight( 0xffffff , 0.58 );
						self.scene.add( ambient );

						self.light = new THREE.SpotLight( 0xffffff , 0.8 , 0 , 1.0 );
						self.light.position.set( 0 , 180 , 130 );

						//打开阴影效果
						self.light.castShadow = ( localStorage.getItem( 'Rainier_useShadow' ) === 'true' );
						self.light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 45 , 1 , 1 , 300 ) );
						self.light.shadow.bias = 0.0001;
						self.light.shadow.radius = 2;
           
						self.light.shadow.mapSize.width = self.areaWidth;
						self.light.shadow.mapSize.height = self.areaHeight;

						self.scene.add( self.light );
						createHUD( self.light );
						
						self.camera.initPosition = new THREE.Vector3( 0 , 76 , 134 );
						self.camera.target = new THREE.Vector3( 0 , 10 , 0 );
						initCameraView();

						self.loader.load([
							[ 'Desk' , 'Desk_Diffuse.png' , 'Desk_Normal.png' , 'Desk_Specular.png' ]
						]);

						self.loader.imgPath = 'image';
						self.loader.imgLoader([
							[ 'bg' , 'blackboard.jpg' ]
						]);

						self.scene.background = self.allImages.bg.blackboard;

						var loader = new THREE.OBJLoader();
						loader.load( rootUrl + '/model/Desk/Desk.obj' , function( obj ){

							var mat_Desk = self.setMaterial({

								metalness : 0 ,
								color : 0xe7e7e7 ,
								D : self.allImages.Desk.D , 
								N : self.allImages.Desk.N ,
								R : self.allImages.Desk.S , 
								side : THREE.DoubleSide

							});

							obj.traverse( function( child ){

								if( child.isMesh ) {

									child.material = mat_Desk;
									child.receiveShadow = true;

								}

							});

							obj.setAll({
								pos : [ 0 , -53.6 , 0 ] ,
								rot : [ 0 , Math.PI / 2.0 , 0 ] ,
								sca : [ 1.5 , 1.4 , 1.2 ]
							});
							self.scene.add( obj );

						});

						/*实验桌场景控制平移范围*/
						self.controls.addEventListener( "change" , function (){

							if( self.isRender ){

								var point = self.camera.position.clone();
								var line = new THREE.Line3( point , self.scene.position );
								var length = line.distance();

								if( length <= 350 && self.camera.position.y >= 0.2 && self.camera.position.y <= 300 ){

									self.camera.lastPosition = self.camera.position.clone();
									self.controls.lastTarget = self.controls.target.clone();

								} else {

									self.camera.position.copy( self.camera.lastPosition );
									self.controls.target.copy( self.controls.lastTarget );

								}

							}

						});

						break;
				}
			}

			/**
			 * 初始化基础贴图
			 * @return null
			 */
			function initBasicMaterial(){

				self.loader.imgPath = 'image';
				self.loader.imgLoader([
					[ 'envMap' , 'envMap.jpg' ]
				]);

				self.envMap = self.allImages.envMap.envMap; //环境贴图
				self.envMap.mapping = THREE.EquirectangularReflectionMapping;
				self.envMap.magFilter = THREE.LinearFilter;
				self.envMap.minFilter = THREE.LinearMipMapLinearFilter;

				self.allMaterials.glassMaterial = new THREE.MeshBasicMaterial({//玻璃材质

					color : 0xdddddd ,
					transparent : true ,
					opacity : 0.25 ,
					envMap : self.envMap ,
					refractionRatio : 0.95 ,
					depthWrite : false , //深度不写入
					reflectivity : 0.75 //设置环境贴图的渲染程度

				});

				self.allMaterials.water = new THREE.MeshBasicMaterial({//玻璃材质

					color : 0xe1eff4 ,
					transparent : true ,
					opacity : 0.15 ,
					envMap : self.envMap ,
					refractionRatio : 0.95 ,
					depthWrite : false , //深度不写入
					reflectivity : 0.25 //设置环境贴图的渲染程度

				});
			}

			/**
			 * 重置事件
			 */
			function setExpScene(){

				TweenMax.killAll();
				TWEEN.removeAll();
				layer.closeAll();

				self.scene.remove( self.expScene );
				self.expScene = new THREE.Group();
				self.expScene.name = "expScene";
				self.scene.add( self.expScene );

				self.pointArr = [];

				self.drag = new Drag( self );
				self.click = new Click( self );

				resetCamera();
				self.sourceLoaded();
			}

			/**
			 * 所有模型加载完以后，执行加载实验场景参数的函数，并删除loading
			 * @return null
			 */
			function executionFn(){

				setTimeout( function (){

					$( "#loadingCon" ).remove();

				}, 2500 );

				if( self.assemblyModel !== null )self.assemblyModel();

				self.sourceLoaded();

			}

			/**
			 * 初始化方法
			 * @return null
			 */
			function init( arguments ){

				disableRight();

				initRenderer( arguments.bgColor );

				initScene();

				initCamera();

				initControls();

				layerTip( self ); //初始化弹框

				webglUI( self ); //初始化UI层

				triggerPoint( self ); //初始化悬浮触发点，注意：需要在controls定义后调用

				self.postProcessing.init( self.renderer , self.scene , self.camera , self.areaWidth , self.areaHeight ); //初始化渲染管道

				initBasicScene( arguments.sceneId );

				initUI(); //初始化弹出框

				initBasicMaterial(); //初始化基础材质

				resetCamera();

				self.drag = new Drag( self ); //将拖拽功能进行组装

				self.click = new Click( self ); //将点击功能进行组装

				window.addEventListener( "resize" , OnWindowResize );

				( function loop(){

					requestAnimationFrame( loop );
					self.loopFn();
					render();

				} )();

			}

			RainierWebGL = function( arguments ){

				self = this;

				this.camera; //相机

				this.scene; //场景

				this.expScene = new THREE.Group(); //用于重置的场景

				this.mixer = new THREE.AnimationMixer();

				this.clock = new THREE.Clock();

				this.expScene.name = "expScene" ; //重置场景名字

				this.renderer; //渲染器

				this.controls; //相机控制器

				this.app = $( arguments.appId ); //装webgl场景的容器

				this.areaWidth = this.app.width(); //webgl展示区域宽度

				this.areaHeight = this.app.height(); //webgl展示区域高度

				this.isRender = true; //当前webgl场景是否渲染

				this.loader = loaders; //加载模块添加到exp下，面向对象

				this.postProcessing = postProcessing; //渲染通道添加到exp下，面向对象

				// this.distortionEffect = distortionEffect; //水下效果

				this.selectedObjects = []; //用于存放使用outline的对象

				this.setting = setting; //设置模块添加到exp下，面向对象

				this.setMaterial = setMaterial; //添加到exp下，面向对象

				this.allModels = this.loader.models; //存放所有模型

				this.allImages = this.loader.images; //存放所有图片

				this.allMaterials = {}; //用于存放材质

				this.cameraUI; //UI层相机

				this.sceneUI; //UI层场景

				this.sourceLoaded = null; //加载完毕之后执行的方法(逻辑代码)

				this.assemblyModel = null; //加载完成以后执行的方法(模型贴图)

				this.UIRender = null; //UI层渲染管道

				this.obRender = null; //观察模块渲染管道

				this.setExpScene = setExpScene; //重置方法

				this.light; //用于产生阴影的光源

				this.envMap; //反光贴图

				this.drag; //将拖拽功能进行组装

				this.click; //将点击功能进行组装

				this.observe = observe; //观察模块

				this.removeOutline = removeOutline; //移除outline方法

				this.initCameraView = initCameraView;//重置相机视角为默认视角

				this.loopFn = function(){}; //在loop内循环调用的函数

				this.sourceLoaded = function(){}; //模型加载完毕之后执行的方法

				/**
				 * 相机移动方法
				 * @param  包括 camera.position  controls.target  TWEEN.time  TWEEN.onStart  TWEEN.onComplete
				 * @return null
				 */
				this.moveCameraFocus = function ( params ){

					cameraAnim.moveCameraFocus( this , params );

				}

				/**
				 * 相机归位方法
				 * @param  包括 camera.position  controls.target  TWEEN.time  TWEEN.onStart  TWEEN.onComplete
				 * @return null
				 */
				this.resetCamera = function ( params ){

					cameraAnim.resetCamera( this , params );

				}

				init( arguments );

				/**
				 * 定时器，判断模型贴图是否加载完毕
				 * @return null
				 */
				var isSourceLoaded = setInterval( function (){

					if( ( self.loader.total + self.loader.daeTotal ) === 0 ){

						clearInterval( isSourceLoaded );

						loading.unload();
						executionFn();

					}

					if( self.loader.isLoaded ){

						clearInterval( isSourceLoaded );

						executionFn();

					}

				}, 1000/60 );

			}

			allJsLoaded = true;

		}

	}, 1000/60 );

});