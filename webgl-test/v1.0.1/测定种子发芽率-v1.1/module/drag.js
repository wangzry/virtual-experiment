/*
*模块名称：拖拽clone体至固定交互区域的拖拽模块
*负责人：曾梓健
*创建时间：2018-1-15 17:15:58
*修改人：曾梓健
*修改时间：2018-2-5 14:19:13
*修改内容：1.mousemove和touchmove事件中，选中物体进行拖拽，只要鼠标射线检测到的交互区域中，
*		交互区域的triggerName存在并且与交互物体的triggerName相同时，获取该交互区域赋值给currentArea，
*		否则currentArea为空；只有currentArea存在时，才能触发物体交互，这样可以避免多交互区域重叠导致的相关bug；
*		2.在touch的三个事件中，添加了对触屏手指数量的判断，同时全局变量mobileDragSelected，用于避免操作相机时
*		误操作物体的情况，在OrbitControls_defined.js脚本中，touchStart事件中有对该变量的判断；
*		3.由于触屏的四指收缩操作，可以触发相机调整至默认视角，因此在组装模块中为exp添加了initCameraView方法，方便在
*		touchmove事件中，符合操作条件的情况下进行调用。
*版本：v1.0.1
*详细描述：公共的拖拽物体clone体至固定交互区域中，触发交互操作的拖拽模块，使用于PC端和移动端。
*		目前的drag模块中，除了包含拖拽物体clone体实现交互的基本逻辑外，还在鼠标mousemove事件中，
*		集成了webglUI功能模块的触发，同时在移动端的touch相关事件中，添加了当前屏幕中手指数量的判断，
*		用于处理触屏交互中的异常操作。
*使用方法：var drag = new Drag( exp ); //实例化一个drag类，该drag对象需要绑定exp，目前集成到exp.drag中
*		obj1.setAll({
*			name:"obj1", //设置物体的name和mesh的modelName
*			showName:"物体1",//UI层展示的物体名称
*			trigName:"moveObj1"//拖拽物体的triggerName，有triggerName才能拖拽！
*		});
*		exp.expScene.add(obj1);//手动将obj添加到expScene中
*		drag.add( obj1 );//将obj1添加为可拖拽的物体
*
* 		var a_moveObj1 = drag.createArea({
* 			name:"a_moveObj1"  //交互区域的名称，可以通过drag.TA.a_moveObj1找到该交互区域
* 		});
* 		//交互区域通过createArea方法默认添加到expScene中
* 		a_moveObj1.setAll({
* 			pos:[],
* 			sca:[],
* 			trigName:"moveObj1", //交互区域的triggerName跟物体的triggerName相同，才能出发对应的MM和MU事件
* 			MM:function(obj){},
* 			MU:function(obj){}
* 		});
*返回值：返回Drag类
*		该类可放访问属性enabled,MM,MMarr,TA,TAarr
*		可调用方法add,createArea,addListener,removeListener
*/
var Drag = ( function(){

	var self, // _Drag构造函数的this指针
		Exp; // 实验对象
	var raycaster = new THREE.Raycaster(), // 相机发射到鼠标的射线
		mouse = new THREE.Vector2(), // 鼠标或者手指在屏幕上的坐标
		offset = new THREE.Vector3(), // 物体移动的偏移量
		intersection = new THREE.Vector3(), // 鼠标射线与拖拽平面的交点
		operatePlane = new THREE.Plane(), // 拖拽的平面
		INTERSECTED, // hover的物体
		SELECTED, // 选中的物体
		c_Selected, // 选中物体的clone体
		currentArea, // 当前交互区域
		cloneColor = 0xff0000, // clone体的颜色
		cloneOpacity = 0.4, // clont体的透明度
		fourFingerStart, // 四指操作上一次的位置计算结果参数
		fourFingerEnd; // 四指操作当前位置计算结果参数

	//鼠标按下事件
	function onMouseDown( e ){

		//只支持鼠标左键
		if( e.button !== 0 ) return; 

		//判断当前拖拽模块是否支持操作
		if( !self.enabled ) return; 

		//从相机位置向视角平面鼠标位置发射射线
		raycaster.setFromCamera( mouse , Exp.camera ); 

		//检测场景中所有物体
		var MMinteract = raycaster.intersectObjects( Exp.scene.children , true ); 

		if( MMinteract.length > 0 ) {

			//mesh默认为第一个检测到的物体
			var mesh = MMinteract[ 0 ].object;

			//遍历射线检测到的物体数组，若当前物体不是交互区域，则mesh赋值为当前物体，跳出for循环
			for( var i in MMinteract ){

				if( !MMinteract[ i ].object.isTriggerArea ){ 

					mesh = MMinteract[i].object; 

					break;

				}

			}

			//modelName存在，并能够从场景中找到对应物体
			if( mesh.modelName && Exp.scene.getObjectByName( mesh.modelName ) ) {

				var modelName = mesh.modelName;

				//从场景中获取到name = modelName的物体
				var obj = Exp.scene.getObjectByName( mesh.modelName );

				//判断物体可以响应拖拽并且有triggerName
				if( obj.enableDrag && obj.triggerName ) { 

					//禁止相机控制器的操作
					Exp.controls.enabled = false; 

					//给SELECTED赋值为选中的物体
					SELECTED = obj;

					//执行物体被选取一瞬间的方法，在clone之前执行该方法，间接让clone体得到变化
					if( SELECTED.MD ) {

						SELECTED.MD( SELECTED );

					}

					//物体在点击时，不位于交互区域中
					SELECTED.inArea = false; 

					//赋值clone体
					c_Selected = SELECTED.clone();

					//清空clone体的name属性
					c_Selected.name = null; 

					//将clone体添加到场景中
					Exp.expScene.add( c_Selected );

					//原物体隐藏
					SELECTED.visible = false;

					//用于保存原模型所有材质的对象
					var everyMeshMat = {};

					//使用instanceof来判断子集的构造函数，而不用isMesh属性，是为了向低版本兼容
					SELECTED.traverse( function( child ) {

						if( child instanceof THREE.Mesh ) { 

							//通过uuid保存每个mesh的材质
							everyMeshMat[ child.uuid ] = child.material.clone(); 

						}

					});

					//设置clone体mesh的材质
					c_Selected.traverse( function( child ) {

						if( child instanceof THREE.Mesh ) {

							child.modelName = modelName; 
							child.material.transparent = true; 
							child.material.opacity = cloneOpacity;

							//clone体在拖动时的颜色
							child.material.color.set( cloneColor );

							//clone体始终渲染在相机最前面
							child.material.depthTest = false;

						}

					});

					SELECTED.traverse( function( child ) { 

						if( child instanceof THREE.Mesh ) {

							for( var key in everyMeshMat ) {

								if( child.uuid === key ) {

									//恢复原物体的每个mesh的材质
									child.material = everyMeshMat[ key ];

								} 

							}

						}

					})

					//将物体选取时的位置、角度、大小状态保存到last相关属性中
					SELECTED.lastPos = SELECTED.position.clone();
					SELECTED.lastRot = SELECTED.rotation.clone();
					SELECTED.lastSca = SELECTED.scale.clone();

					//偏移量为射线与拖拽平面的交点 减去 物体位置 的向量
					if( raycaster.ray.intersectPlane( operatePlane , intersection ) ) {

						offset.copy( intersection ).sub( c_Selected.position );

					}

					Exp.app.css( "cursor" , "pointer" );

				}

			}

		}

	}

	//鼠标移动事件
	function onMouseMove( e ) {

		if( e.button !== 0 ) return;

		var rect = Exp.app[ 0 ].getBoundingClientRect();

		//将鼠标坐标转换为场景平面中的位置
		mouse.x = ( ( e.clientX - rect.left ) / rect.width ) * 2 - 1;
		mouse.y = - ( ( e.clientY - rect.top ) / rect.height ) * 2 + 1;
		raycaster.setFromCamera( mouse , Exp.camera );

		//判断鼠标移动时，是否选取了物体
		if( SELECTED ) {

			//若webglUI功能可用，则在选取物体以后移动鼠标时，UI层隐藏
			if( Exp.UIenabled ) {

				Exp.UI.visible = false;
				Exp.UI.getObjectByName( "UItext" ).visible = false;

			}

			//选取物体以后，判断交互区域
			var TAinteract = raycaster.intersectObjects( self.TAarr , true );

			if( TAinteract.length > 0 ) {

				//获取选取物体的triggerName
				var trigName = SELECTED.triggerName;

				for( var i in TAinteract ){

					//判断射线检测到的交互区域数组里，是否有跟选中物体的triggerName相同的交互区域
					if( TAinteract[ i ].object.triggerName && TAinteract[ i ].object.triggerName === trigName ){

						//若有，则给当前交互区域赋值
						currentArea = TAinteract[ i ].object;

						//并跳出for循环
						break;

					} else {

						//否则将当前交互区域赋值为null
						currentArea = null; 

					}

				}

				//若currentArea存在
				if( currentArea ){ 

					//选中物体在交互区域中
					SELECTED.inArea = true; 

					//选中物体显示
					SELECTED.visible = true;

					//clone体隐藏
					c_Selected.visible = false;

					//执行交互区域的MM方法，选中物体SELECTED作为参数
					currentArea.MM( SELECTED );

				} else { // 若currentArea不存在

					currentArea = null;

					//选中物体不在交互区域中
					SELECTED.inArea = false;

					//选中物体隐藏 
					SELECTED.visible = false;

					//clone体显示
					c_Selected.visible = true;

					//选中物体回到选中mousedown时的状态
					SELECTED.position = SELECTED.lastPos.clone(); 
					SELECTED.rotation = SELECTED.lastRot.clone();
					SELECTED.scale = SELECTED.lastSca.clone();

					//若选中物体的MM方法存在，则执行
					if( SELECTED.MM ) {

						SELECTED.MM( SELECTED );

					}

				}

			} else { // 若没有检测到交互区域，执行的代码同currentArea不存在的情况

				currentArea = null;
				SELECTED.inArea = false;
				SELECTED.visible = false;
				c_Selected.visible = true;
				SELECTED.position = SELECTED.lastPos.clone();
				SELECTED.rotation = SELECTED.lastRot.clone();
				SELECTED.scale = SELECTED.lastSca.clone();

				if( SELECTED.MM ) {

					SELECTED.MM( SELECTED );

				}

			}

			//clone体根据当前的偏移量移动位置
			if(raycaster.ray.intersectPlane(operatePlane, intersection)) {

				c_Selected.position.copy(intersection.sub(offset));

			}

			return;

		}

		var hoverInteract = raycaster.intersectObjects( Exp.scene.children , true );

		if(hoverInteract.length > 0) {

			var mesh = hoverInteract[ 0 ].object;

			for( var i in hoverInteract ){

				//判断鼠标hover的物体中第一个不为交互区域的物体
				if( !hoverInteract[ i ].object.isTriggerArea ){ 

					mesh = hoverInteract[ i ].object;

					break;

				}

			}

			if( mesh.modelName && Exp.scene.getObjectByName( mesh.modelName ) ){

				//获取场景中name = modelName的物体
				var obj = Exp.expScene.getObjectByName( mesh.modelName );

				//判断obj是否响应拖拽并且有triggerName
				if( obj.enableDrag && obj.triggerName ) {

					INTERSECTED = obj;

					//确定obj的拖拽平面
					operatePlane.setFromNormalAndCoplanarPoint( 
						Exp.camera.getWorldDirection( operatePlane.normal ),
						INTERSECTED.position 
					);

					Exp.app.css( "cursor" , "pointer" );

				}else{

					Exp.app.css( "cursor" , "auto" );

				}

				//有modelName的物体，都能弹出提示框
				if( Exp.UIenabled ) { //webglUI可用

					//当前hover物体有showName属性
					if( obj.showName ) {

						var left = e.clientX - rect.left;
						var bottom =  rect.bottom - e.clientY;

						//获取鼠标在当前屏幕中的位置，修改文字弹框的位置
						Exp.UI.position.set( left , bottom , 0 );

						//根据当前obj物体的showName实时更新文字内容
						Exp.UI.getObjectByName( "UItext" ).material.map = Exp.createUItext( obj.showName );
						Exp.UI.getObjectByName( "UItext" ).material.map.needsUpdate = true;
						Exp.UI.getObjectByName( "UItext" ).visible = true;
						Exp.UI.visible = true;

					} else { // 当前hover物体没有showName属性，则隐藏UI内容

						Exp.UI.visible = false;
						Exp.UI.getObjectByName( "UItext" ).visible = false;

					}

				}

			} else {

				INTERSECTED = null;

				Exp.app.css( "cursor" , "auto" );

				if( Exp.UIenabled ) {

					Exp.UI.visible = false;
					Exp.UI.getObjectByName( "UItext" ).visible = false;

				}

			}

		} else {

			INTERSECTED = null;

			Exp.app.css( "cursor","auto" );

			if( Exp.UIenabled ) {

				Exp.UI.visible = false;
				Exp.UI.getObjectByName( "UItext" ).visible = false;

			}

		}

	}

	//鼠标松开事件执行方法
	function onMouseUp( e ) {

		//判断是不是鼠标左键抬起
		if( e.button !== 0 ) return;

		//鼠标松开时存在选中的物体
		if( SELECTED ) {

			//相机控制器恢复操作
			Exp.controls.enabled = true;

			//原物体显示
			SELECTED.visible = true;

			//若选中物体MU方法存在，则执行
			if( SELECTED.MU ) {

				SELECTED.MU( SELECTED );

			}

			//若选中物体在交互区域中释放
			if( SELECTED.inArea ) { 

				//当前交互区域triggerName清空
				currentArea.triggerName = null;

				//选中物体triggerName清空
				SELECTED.triggerName = null;

				//执行交互区域的MM方法，选中物体Selected作为参数
				currentArea.MU( SELECTED );

			} else { // 若选中物体没在正确的交互区域释放

				//恢复选中物体回到选中之前的状态
				SELECTED.position.copy( SELECTED.lastPos );
				SELECTED.rotation.copy( SELECTED.lastRot );
				SELECTED.scale.copy( SELECTED.lastSca );

			}

			c_Selected.traverse(function(child){
				if(child.isPoints){
					c_Selected.remove(child);
				}
			})

			//将clone体从场景中删除
			Exp.expScene.remove( c_Selected ); 

			c_Selected = null;
			SELECTED = null;
			currentArea = null;

		}

		Exp.app.css( "cursor" , "auto" );

	}

	//鼠标滚轮事件，执行鼠标移动的方法，解决UI弹框在鼠标滚动滚动时，提示框不在对应物体上的bug专用
	function onWheel( e ){

		onMouseMove( e );

	}

	//当鼠标移出renderer的容器时执行的方法
	function onMouseOut( e ) {

		//触发鼠标up事件
		onMouseUp( e );

		//若UI层可用，则隐藏
		if( Exp.UIenabled ){ 

			Exp.UI.visible = false;
			Exp.UI.getObjectByName( "UItext" ).visible = false;
			
		}

	} 

	//手指触屏事件，原理同mouse事件
	function onTouchStart( e ) {

		//阻止移动端浏览器默认事件
		e.preventDefault();

		if( !self.enabled ) return;
		
		var rect = Exp.app[ 0 ].getBoundingClientRect();

		//判断当前屏幕上手指的数量是否为1
		if( e.touches.length === 1 ) {

			e = e.changedTouches[ 0 ];

			mouse.x = ( ( e.clientX - rect.left ) / rect.width ) * 2 - 1;
			mouse.y = - ( ( e.clientY - rect.top ) / rect.height ) * 2 + 1;
			raycaster.setFromCamera( mouse , Exp.camera );

			var MMinteract = raycaster.intersectObjects( Exp.scene.children , true );

			if( MMinteract.length > 0 ) {

				var mesh = MMinteract[ 0 ].object;

				for( var i in MMinteract ){

					if( !MMinteract[ i ].object.isTriggerArea ){

						mesh = MMinteract[i].object;

						break;

					}

				}

				if( mesh.modelName && Exp.scene.getObjectByName( mesh.modelName ) ) {

					var modelName = mesh.modelName;

					var obj = Exp.scene.getObjectByName( modelName );

					if( obj.enableDrag && obj.triggerName ) {

						//触屏拖拽选中物体设置为true
						mobileDragSelected = true; 

						Exp.controls.enabled = false;

						SELECTED = obj;

						if( SELECTED.MD ) {
							SELECTED.MD( SELECTED );
						}
						
						SELECTED.inArea = false;
						c_Selected = SELECTED.clone();
						c_Selected.name = null;
						Exp.expScene.add( c_Selected );
						SELECTED.visible = false;

						var everyMeshMat = {};

						SELECTED.traverse( function( child ) {

							if( child instanceof THREE.Mesh ) {

								everyMeshMat[ child.uuid ] = child.material.clone();

							}

						});

						c_Selected.traverse( function( child ) {

							if( child instanceof THREE.Mesh ) {

								child.modelName = modelName;
								child.material.color.set( cloneColor );
								child.material.transparent = true;
								child.material.opacity = cloneOpacity;
								child.material.depthTest = false;

							}

						});

						SELECTED.traverse( function( child ) {

							if( child instanceof THREE.Mesh ) {

								for( var key in everyMeshMat ) {

									if( child.uuid === key ) {

										child.material = everyMeshMat[ key ];

									} 

								}

							}

						})

						SELECTED.lastPos = SELECTED.position.clone();
						SELECTED.lastRota = SELECTED.rotation.clone();
						SELECTED.lastSca = SELECTED.scale.clone();

						operatePlane.setFromNormalAndCoplanarPoint(
							Exp.camera.getWorldDirection( operatePlane.normal ),
							SELECTED.position 
						);

						if( raycaster.ray.intersectPlane( operatePlane , intersection ) ){

							offset.copy( intersection ).sub( c_Selected.position );

						}

					}

				}

			}

		} else { // 若触屏时手指数量不为1

			//如果有选中物体，并且手指数量大于1
			if( SELECTED && e.touches.length > 1 ) { 

				//触屏拖拽选中物体设置为false
				mobileDragSelected = false; 

				//相机控制器可操作
				Exp.controls.enabled = true;

				//选中物体显示
				SELECTED.visible = true;

				//执行选中物体的MU方法
				if( SELECTED.MU ){

					SELECTED.MU( SELECTED );
					
				}

				//选中物体回到选中之前的状态
				SELECTED.position.copy( SELECTED.lastPos );
				SELECTED.rotation.copy( SELECTED.lastRot );
				SELECTED.scale.copy( SELECTED.lastSca );

				//移除clone体
				Exp.expScene.remove( c_Selected );
				c_Selected = null;
				SELECTED = null;
				currentArea = null;

			}

			//若手指数量大于等于4
			if( e.touches.length > 3 ) { 

				var xArr = [], yArr = [];

				//获取前四个手指的位置坐标
				for( var i = 0 ; i < 4 ; i++ ) {

					xArr.push( e.touches[ i ].pageX );
					yArr.push( e.touches[ i ].pageY );

				}

				//x坐标排序
				xArr.sort();

				//y坐标排序
				yArr.sort();

				var dx = ( ( xArr[ 0 ] + xArr[ 1 ] ) - ( xArr[ 2 ] + xArr[ 3 ] ) ) / 2; 
				var dy = ( ( yArr[ 0 ] + yArr[ 1 ] ) - ( yArr[ 2 ] + yArr[ 3 ] ) ) / 2;

				//四指操作手指间距
				fourFingerStart = Math.sqrt( dx * dx + dy * dy );

			}

		}

	}

	//手指触屏移动
	function onTouchMove( e ) {

		//阻止移动端浏览器默认事件
		e.preventDefault();

		var rect = Exp.app[ 0 ].getBoundingClientRect();

		//判断当前屏幕上手指的数量是否为1
		if( e.touches.length === 1 ) { 

			e = e.changedTouches[ 0 ];
			mouse.x = ( ( e.clientX - rect.left ) / rect.width ) * 2 - 1;
			mouse.y = - ( ( e.clientY - rect.top ) / rect.height ) * 2 + 1;
			raycaster.setFromCamera( mouse , Exp.camera );

			if( SELECTED ) {

				var TAinteract = raycaster.intersectObjects( self.TAarr , true );

				if( TAinteract.length > 0 ) {

					var trigName = SELECTED.triggerName;

					for( var i in TAinteract ){

						if( TAinteract[ i ].object.triggerName && TAinteract[ i ].object.triggerName === trigName ){

							currentArea = TAinteract[ i ].object;

							break;

						} else {

							currentArea = null;

						}

					}

					if( currentArea ){

						SELECTED.inArea = true;
						SELECTED.visible = true;
						c_Selected.visible = false;
						currentArea.MM( SELECTED );

					} else {

						currentArea = null;
						SELECTED.inArea = false;
						SELECTED.visible = false;
						c_Selected.visible = true;
						SELECTED.position = SELECTED.lastPos.clone();
						SELECTED.rotation = SELECTED.lastRot.clone();
						SELECTED.scale = SELECTED.lastSca.clone();

						if( SELECTED.MM ) {
							SELECTED.MM( SELECTED );
						}

					}

				} else {

					currentArea = null;
					SELECTED.inArea = false;
					SELECTED.visible = false;
					c_Selected.visible = true;
					SELECTED.position = SELECTED.lastPos.clone();
					SELECTED.rotation = SELECTED.lastRot.clone();
					SELECTED.scale = SELECTED.lastSca.clone();

					if( SELECTED.MM ) {
						SELECTED.MM( SELECTED );
					}

				}
				
				if( raycaster.ray.intersectPlane( operatePlane , intersection ) ) {

					c_Selected.position.copy( intersection.sub( offset ) );

				} 

				return;

			}

		} else {

			if( SELECTED && e.touches.length > 1 ) {

				//触屏拖拽选中物体设置为false
				mobileDragSelected = false; 

				Exp.controls.enabled = true;
				SELECTED.visible = true;
				SELECTED.MU( SELECTED );
				SELECTED.position = SELECTED.lastPos.clone();
				SELECTED.rotation = SELECTED.lastRot.clone();
				SELECTED.scale = SELECTED.lastSca.clone();
				Exp.expScene.remove( c_Selected );
				c_Selected = null;
				SELECTED = null;
				currentArea = null;

			}

			if( e.touches.length > 3 ) {

				var xArr = [], yArr = [];

				for( var i = 0 ; i < 4 ; i++ ) {

					xArr.push( e.touches[ i ].pageX );
					yArr.push( e.touches[ i ].pageY );

				}

				xArr.sort();
				yArr.sort(); 

				var dx = ( ( xArr[ 0 ] + xArr[ 1 ] ) - ( xArr[ 2 ] + xArr[ 3 ] ) ) / 2;
				var dy = ( ( yArr[ 0 ] + yArr[ 1 ] ) - ( yArr[ 2 ] + yArr[ 3 ] ) ) / 2;

				fourFingerEnd = Math.sqrt( dx * dx + dy * dy );

				var distance = fourFingerStart - fourFingerEnd;

				//灵敏度
				if( distance > 35 ) { 

					Exp.initCameraView();

				}

				fourFingerStart = fourFingerEnd;

			}

		}

	}

	//手指离开屏幕事件
	function onTouchEnd( e ) {

		e.preventDefault();

		//判断当前是否有选中的物体并且屏幕上手指数量为0
		if( SELECTED && e.touches.length === 0 ) {

			//触屏拖拽选中物体设置为false
			mobileDragSelected = false; 

			Exp.controls.enabled = true;
			SELECTED.visible = true;

			if( SELECTED.MU ) {
				SELECTED.MU( SELECTED );
			}

			//物体在交互区域中
			if( SELECTED.inArea ) { 

				currentArea.triggerName = null;
				SELECTED.triggerName = null;
				currentArea.MU( SELECTED );

			} else { // 物体不在交互区域中

				SELECTED.position.copy( SELECTED.lastPos );
				SELECTED.rotation.copy( SELECTED.lastRot );
				SELECTED.scale.copy( SELECTED.lastSca );

			}

			Exp.expScene.remove( c_Selected );
			c_Selected = null;
			SELECTED = null;
			currentArea = null;

		}

	}

	//设置物体的属性
	function setAttr( obj ) {

		//add到拖拽数组中的物体默认可响应拖拽
		obj.enableDrag = true; 

		//默认不在交互区域
		obj.inArea = false;

		obj.lastPos = obj.lastPos ? obj.lastPos : obj.position.clone();
		obj.lastRot = obj.lastRot ? obj.lastRot : obj.rotation.clone();
		obj.lastSca = obj.lastSca ? obj.lastSca : obj.scale.clone();

		if( !obj.MD ){

			obj.MD = function(){};

		}

		if( !obj.MM ){

			obj.MM = function(){};

		}

		if( !obj.MU ){

			obj.MU = function(){};

		}

		//若添加到拖拽数组中的物体没有name属性，则用uuid代替
		obj.name = obj.name ? obj.name : obj.uuid;

		obj.traverse( function( child ) {

			if( child instanceof THREE.Mesh ) {

				child.modelName = obj.name;

			}

		})

		//将该物体添加到可拖拽的对象中
		self.MM[ name ] = obj;

		//将该物体添加到可拖拽的检测数组中
		self.MMarr.push( obj ); 

	}


	function _Drag( exp ) {

		Exp = exp;
		self = this;

		//拖拽模块默认可使用
		this.enabled = true; 

		//存放拖拽物体的对象
		this.MM = {};

		//存放拖拽数组的对象
		this.MMarr = [];

		//存放交互区域的对象
		this.TA = {};

		//存放交互区域的数组
		this.TAarr = [];

		//初始化默认开始监听
		this.addListener();

	}

	_Drag.prototype = {

		constructor : _Drag ,

		//用于添加监听交互的物体
		add : function( o ) {

			/**
			 * o可以传入物体组成的数组，也可以传入单个物体
			 */
			
			if( typeof( o ) !== 'object' ) {

				console.error( "监听内容格式错误！" );

			} else {

				//判断传入参数是不是数组类型
				if( Array.isArray( o ) ) {

					//更新outline高亮数组
					postProcessing.outlinePass.selectedObjects = o;

					o.forEach( function( item ) {

						setAttr( item );

					} );

				} else {

					setAttr( o );

					postProcessing.outlinePass.selectedObjects = [ o ];

				}

			}

		},

		//用于清空监听
		removeAllObj : function() {

			self.MM = {};
			self.MMarr = [];

			postProcessing.outlinePass.selectedObjects = [];

		},

		//用于移除制定对象，可将清空事件移入
		removeObj : function( o ) {


		},

		//创建固定的交互区域
		createArea : function( p ) { 

			/*
			*p可传入对象，对象的属性有：name,parent
			*必填项：name
			*/
		
			var parent;
			var area = new THREE.Mesh(

				new THREE.BoxGeometry( 1 , 1 , 1 ) ,
				new THREE.MeshPhongMaterial( {
					visible : false // 交互区域材质默认不可见
					// transparent: true,
					// opacity: 0.4,
					// color: Math.random() * 0xffffff,
					// depthWrite: false
				} )

			);

			//交互区域特有属性isTriggerArea，默认为true，在click和drag的事件检测中用于判断
			area.isTriggerArea = true; 
			
			//若不传入交互区域的父级对象，则默认视为expScene
			parent = p.parent ? p.parent : Exp.expScene; 

			//存放到交互区域对象中
			self.TA[ p.name ] = area;

			//存放到交互区域数组中
			self.TAarr.push( area );

			//交互区域默认添加到expScene中
			parent.add( area );

			return area;

		},

		//添加拖拽事件相关监听
		addListener : function(){

			Exp.renderer.domElement.addEventListener( "mousedown" , onMouseDown , false );
			Exp.renderer.domElement.addEventListener( "mousemove" , onMouseMove , false );
			Exp.renderer.domElement.addEventListener( "mouseup" , onMouseUp , false );
			Exp.renderer.domElement.addEventListener( "touchstart" , onTouchStart , false );
			Exp.renderer.domElement.addEventListener( "touchmove" , onTouchMove , false );
			Exp.renderer.domElement.addEventListener( "touchend" , onTouchEnd , false );
			Exp.renderer.domElement.addEventListener( "mouseout" , onMouseOut , false );
			Exp.renderer.domElement.addEventListener( "wheel" , onWheel , false );

		},

		//取消拖拽事件相关监听
		removeListener:function(){

			Exp.renderer.domElement.removeEventListener( "mousedown" , onMouseDown , false );
			Exp.renderer.domElement.removeEventListener( "mousemove" , onMouseMove , false );
			Exp.renderer.domElement.removeEventListener( "mouseup" , onMouseUp , false );
			Exp.renderer.domElement.removeEventListener( "touchstart" , onTouchStart , false );
			Exp.renderer.domElement.removeEventListener( "touchmove" , onTouchMove , false );
			Exp.renderer.domElement.removeEventListener( "touchend" , onTouchEnd , false );
			Exp.renderer.domElement.removeEventListener( "mouseout" , onMouseOut , false );
			Exp.renderer.domElement.removeEventListener( "wheel" , onWheel , false );

		},

	}

	//返回拖拽类
	return _Drag;

})();


