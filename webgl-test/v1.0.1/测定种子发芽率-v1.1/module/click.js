/*
*模块名称：物体点击交互模块
*负责人：曾梓健
*创建时间：2018-1-11 09:30:51
*修改人：曾梓健
*修改时间：2018-1-15 16:14:12
*修改内容：1.原先使用监听click，但由于移动端touchstart中，阻止浏览器默认事件，
		导致移动端click不能触发，因此替换了监听事件：在PC端监听mousedown，
		只有左键才有效；在移动端监听touchstart事件，只有单指操作才有效。
*修改人：曾梓健
*修改时间：2018-2-2 14:37:49
*修改内容：1.之前的mousedown和touchstart方法中，执行物体的clickFn方法传入的参数有错，现在已经在点击时
   		获取当前选取物体在相机射线检测到的数组中的index，在clickFn方法中传入跟index相关的对象；
   		2.由于39版本的chrome不支持在addEventListener中的第三个参数添加{passive: true}禁用手势的默认事件，
   		因此将第三个事件设置为false，在鼠标的touch相关事件中，调用e.preventDefault方法禁止默认事件。
*版本：v1.0.1
*详细描述：公共的物体点击事件模块，适用于PC端和移动端；
*		目前的click模块中，除了包含点击物体触发对应交互事件以外，
*		还集成了悬浮交互点的点击事件触发和PC端鼠标移动到交互点上交互点样式的变化
*使用方法：var click = new Click(exp);
		click.add(mesh1)  或者  click.add([mesh1, mesh2, ...]);
		mesh1.clickFn = function(e) {
			... //this指向mesh自身，e参数为当前交互状态的对象
		}
		mesh1.enableClick = false;//设置mesh1不响应点击事件
*返回值：返回Click类
		该类可放访问属性arr,可调用方法add,addListener,removeListener
*/
var Click = ( function (){

	var raycaster = new THREE.Raycaster(); // 射线
	var mouse = new THREE.Vector2(); // 鼠标在场景平面坐标
	var Exp; // 实验对象
	var self; // _Click类的this指针
	var hoverPoint; // 鼠标hover的交互点

	//获取当前物体最外层的父级以及世界坐标系的缩放值
	function getParent( p , s ){

        var x = s.x;

        var y = s.y;

        if( p.parent.name === "expScene" ){

            x *= 1;

            y *= 1;

            return { x : x , y : y };

        } else {

            x = x / p.parent.scale.x;

            y = y / p.parent.scale.y;

            return getParent( p.parent , { x : x, y : y } );

        }

    }

	//鼠标左键点击方法
	function onMouseDown( e ){

		//左右鼠标左键才能触发
		if( e.button != 0 ) return;

		//js原生方法，获取当前DOM元素在页面中的状态，left返回距离左侧距离，top返回距离上侧距离，width返回容器宽度，height返回容器高度
		var rect = Exp.app[ 0 ].getBoundingClientRect();

		//将鼠标坐标转换为场景平面中的位置
		mouse.x = ( ( e.clientX - rect.left ) / rect.width ) * 2 - 1;
		mouse.y = - ( ( e.clientY - rect.top ) / rect.height ) * 2 + 1;

		//从相机位置向鼠标发射射线
		raycaster.setFromCamera( mouse , Exp.camera );

		//射线检测的物体，传入scene.children即检测场景中所有物体
		var clickInteract = raycaster.intersectObjects( Exp.scene.children , true );

		if( clickInteract.length > 0 ){

			//当前选中的mesh
			var mesh = clickInteract[ 0 ].object;

			//记录交互物体在射线数组中的索引
			var index = 0; 

			//先判断鼠标射线的所有交互物体中，选择第一个不是交互区域的物体
			for( var i in clickInteract ){ 

				if( !clickInteract[ i ].object.isTriggerArea ){ 

					mesh = clickInteract[ i ].object;

					index = i;

					break;

				}

			}

			//如果检测的物体中有交互点，则优先响应交互点，覆盖掉之前的mesh
			for( var j in clickInteract ){ 

				if( clickInteract[ j ].object.isSprite ){ 

					mesh = clickInteract[ j ].object;

					index = j;

					break;

				}

			}

			//判断modelName是否存在，以及场景中是否有name == modelName的物体
			if( mesh.modelName && Exp.scene.getObjectByName( mesh.modelName ) ){ 

				//获取mesh的modelName属性
				var modelName = mesh.modelName;

				var obj = Exp.scene.getObjectByName( modelName );

				//物体点击事件触发的方法存在
				if( obj.clickFn ){ 

					//物体能够响应点击
					if( obj.enableClick ){

						//将第一个物体点击的属性作为参数传入物体事件中
						obj.clickFn( clickInteract[ index ] ); 

						//物体单击次数自增
						obj.clickTimes++; 

					}

				}

			}

			//如果点击的物体是精灵交互点
			if( mesh.isSprite && mesh.name === "triggerPoint" ){

				var point = mesh;

				//判断交互点的是否能够相应点击以及是否有点击方法
				if( point.clickFn && point.enableClick ){ 

					//执行交互点的方法
					point.clickFn( clickInteract[ index ] );

					//交互点点击次数自增
					point.clickTimes++;

				}

			}

		}

	}

	//鼠标移动方法
	function onMouseMove( e ){

		var rect = Exp.app[ 0 ].getBoundingClientRect();

		//将鼠标坐标转换为场景平面中的位置
		mouse.x = ( ( e.clientX - rect.left ) / rect.width ) * 2 - 1;
		mouse.y = - ( ( e.clientY - rect.top ) / rect.height ) * 2 + 1;
		raycaster.setFromCamera( mouse, Exp.camera );

		//若场景中存在交互点
		if( Exp.pointArr ){ 

			//相机射线检测所有的交互点数组
			var pointInteract = raycaster.intersectObjects( Exp.pointArr , true );

			if( pointInteract.length > 0 ){

				var point = pointInteract[ 0 ].object;

					//判断hoverPoint是否为空
					if( !hoverPoint ){ 

						//判断当前的交互点是否响应点击事件
						if( point.enableClick ){ 

							//hoverPoint赋值为当前交互点
							hoverPoint = point;

							//获取当前交互点在世界坐标系距离相机的距离
							var cameraDistance = Exp.camera.position.clone().sub( hoverPoint.getWorldPosition() ).length();

							//获取原始的缩放系数
				            hoverPoint.originScale =  hoverPoint.defaultRatio * cameraDistance;

				            var parentScale = { x : 1 , y : 1 };

				            //获取交互点在世界坐标系的缩放系数
				            parentScale = getParent( hoverPoint , parentScale );

				            //hover状态下，交互点相比于原缩放时的放大比
							var ratio = 1.3;

							//修改交互点的scale
							hoverPoint.scale.set( ratio * hoverPoint.originScale * parentScale.x , ratio * hoverPoint.originScale * parentScale.y, 1 ); 

						}

					} else { // 若hoverPoint不为空，即2个交互点渲染的距离很近，鼠标从一个点移动到另一个点上

						//判断当前的交互点是否响应点击事件
						if( point.enableClick ){

							//原hoverPoint的倍数，从放大状态变回原始缩放状态
							var cameraDistance = Exp.camera.position.clone().sub( hoverPoint.getWorldPosition() ).length();

				            hoverPoint.originScale =  hoverPoint.defaultRatio * cameraDistance;

				            var parentScale = { x: 1 , y : 1 };

				            parentScale = getParent( hoverPoint , parentScale );

							var ratio = 1;

							hoverPoint.scale.set( ratio * hoverPoint.originScale * parentScale.x , ratio * hoverPoint.originScale * parentScale.y , 1 ); 
							
							//当前的交互点覆盖hoverPoint
							hoverPoint = point;

							//当前的交互点放大，原理同上
							cameraDistance = Exp.camera.position.clone().sub( hoverPoint.getWorldPosition() ).length();

				            hoverPoint.originScale =  hoverPoint.defaultRatio * cameraDistance;

				            parentScale = { x : 1 , y : 1 };

				            parentScale = getParent( hoverPoint , parentScale );

							ratio = 1.3;

							hoverPoint.scale.set( ratio * hoverPoint.originScale * parentScale.x , ratio * hoverPoint.originScale * parentScale.y , 1 ); 

						} else { // 若从一个交互点移动到另一个交互点，但另一个点不响应点击

							//将hoverPoint的交互点的缩放恢复为原始的状态
							var cameraDistance = Exp.camera.position.clone().sub( hoverPoint.getWorldPosition() ).length();

				            hoverPoint.originScale =  hoverPoint.defaultRatio * cameraDistance;

				            var parentScale = { x : 1 , y : 1 };

				            parentScale = getParent( hoverPoint , parentScale );

							var ratio = 1;

							hoverPoint.scale.set( ratio * hoverPoint.originScale * parentScale.x , ratio * hoverPoint.originScale * parentScale.y , 1 ); 

							//清空hoverPoint
							hoverPoint = null; 

						}

					}

			} else {

				if( hoverPoint ){

					var cameraDistance = Exp.camera.position.clone().sub( hoverPoint.getWorldPosition() ).length();
		            hoverPoint.originScale =  hoverPoint.defaultRatio * cameraDistance;
		            var parentScale = { x : 1, y : 1 };
		            parentScale = getParent( hoverPoint , parentScale );
					var ratio = 1;
					hoverPoint.scale.set( ratio * hoverPoint.originScale * parentScale.x , ratio * hoverPoint.originScale * parentScale.y , 1 ); 
					hoverPoint = null;

				}

			}

		}

	}

	//移动端点击事件，通过touchStart触发，触发原理与mousedown类似
	function onTouchStart( e ){

		//阻止默认事件
		e.preventDefault();

		var rect = Exp.app[ 0 ].getBoundingClientRect();

		//判断当前触屏的手指数量总数是否为1
		if( e.touches.length == 1 ) { 

			e = e.changedTouches[ 0 ];
			mouse.x = ( ( e.clientX - rect.left ) / rect.width ) * 2 - 1;
			mouse.y = - ( ( e.clientY - rect.top ) / rect.height ) * 2 + 1;
			raycaster.setFromCamera( mouse , Exp.camera );

			//射线检测的物体，传入scene.children即检测场景中所有物体
			var clickInteract = raycaster.intersectObjects( Exp.scene.children , true );

			if( clickInteract.length > 0 ){

				//当前选中的mesh
				var mesh = clickInteract[ 0 ].object;

				//记录交互物体在射线数组中的索引
				var index = 0; 

				for( var i in clickInteract ){ 

					//先判断鼠标射线的所有交互物体中，选择第一个不是交互区域的物体
					if( !clickInteract[ i ].object.isTriggerArea ){ 

						mesh = clickInteract[ i ].object;

						index = i;

						break;

					}

				}

				for( var j in clickInteract ){ 

					//如果检测的物体中有交互点，则优先响应交互点，覆盖掉之前的mesh
					if( clickInteract[ j ].object.isSprite ){ 

						mesh = clickInteract[ j ].object;

						index = j;

						break;

					}

				}

				//判断modelName是否存在，以及场景中是否有name == modelName的物体
				if( mesh.modelName && Exp.scene.getObjectByName( mesh.modelName ) ){ 
				
					//获取mesh的modelName属性
					var modelName = mesh.modelName;

					var obj = Exp.scene.getObjectByName( modelName );

					if( obj.clickFn ){

						if( obj.enableClick ){

							obj.clickFn( clickInteract[ index ] );

							//物体单击次数自增
							obj.clickTimes++;

						}

					}

				}

				if( mesh instanceof THREE.Sprite && mesh.name === "triggerPoint" ){

					var point = mesh;

					if( point.clickFn && point.enableClick ){

						point.clickFn( clickInteract[ index ] );

						point.clickTimes++;

					}

				}

			}

		}

	}

	//暴露出去的类
	function _Click( exp ){

		Exp = exp;

		self = this;

		//清空hoverPoint
		hoverPoint = null;

		//可操作部件检测数组
		this.arr = []; 

		//实例化Click类的对象后，默认开始监听
		this.addListener();
	}

	//暴露出原型的属性或方法
	_Click.prototype = {

		constructor : _Click ,

		//用于添加监听交互的物体
		add : function( o ) {		

			var self = this;

			//判断当前的物体是否是对象
			if( typeof( o ) !== 'object' ){ 

				console.error( "监听内容格式错误！" );

			} else {

				//如果传入的参数为物体数组
				if( Array.isArray( o ) ){

					//遍历数组中每一个物体，并添加部分触发点击事件的属性
					o.forEach( function( item ){ 

						//默认添加的物体，响应点击事件
						item.enableClick = true;

						//默认点击次数为0
						item.clickTimes = 0;

						//判断当前物体是否有name属性，若没有，则将其uuid赋值给name
						item.name = item.name ? item.name : item.uuid;

						//设置子集mesh中的modelName属性 = name
						item.traverse( function( child ){ 

							if( child instanceof THREE.Mesh ){

								child.modelName = item.name;
							}

						})

						//将物体添加到可点击的物体数组中
						self.arr.push( item ); 

					})

				} else { // 如果传入的参数直接为一个Object3D的物体

					o.enableClick = true;

					o.clickTimes = 0;

					o.name = o.name ? o.name : o.uuid;

					o.traverse( function( child ){

						if( child instanceof THREE.Mesh ){

							child.modelName = o.name;

						}

					})

					self.arr.push( o );
				}

			}

		},

		//监听鼠标事件
		addListener : function(){

			Exp.renderer.domElement.addEventListener( "mousedown" , onMouseDown , false );
			Exp.renderer.domElement.addEventListener( "mousemove" , onMouseMove , false );
			Exp.renderer.domElement.addEventListener( "touchstart" , onTouchStart , false );

		},
		
		//移除鼠标监听事件
		removeListener : function(){

			Exp.renderer.domElement.removeEventListener( "mousedown" , onMouseDown , false );
			Exp.renderer.domElement.removeEventListener( "mousemove" , onMouseMove , false );
			Exp.renderer.domElement.removeEventListener( "touchstart" , onTouchStart , false );

		}

	};

	return _Click;
	
})();
