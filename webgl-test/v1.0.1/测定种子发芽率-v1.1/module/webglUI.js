/*
*模块名称：webglUI层模块
*负责人：曾梓健
*创建时间：2018-1-15 16:38:56
*修改人：曾梓健
*修改时间：2018-2-5 09:09:39
*修改内容：1.将exp.UI的scale从15调整为18；2.增大UI提示文字的字体大小；
*版本：v1.0.1
*详细描述：公共的webglUI层模块，目前只有显示物体名称功能(仅在PC端鼠标hover事件触发)
		UI层模块，实际上是创建一个新的UI场景和UI正交相机，将显示的UI内容
		添加到UI场景中，渲染的画面不会随着实验相机视角的改变而变化。
		UI层模块目前集成在拖动clone体的drag模块中，UI名称只响应符合条件的obj
        物体obj显示UI文字提示要求：
        1.所有mesh有modelName属性,能够通过modelName找到最外层obj;
        2.obj的showName属性存在;
*使用方法：webglUI(exp); //需要在UI层图片资源加载完毕后调用
		obj.setAll({
            name : "obj1",
            showName : "物体1"
        }); 

*返回值：返回webglUI函数
		执行后，为exp添加可访问属性UI,cameraUI,sceneUI,可调用方法createUItext,createUI
*/
var webglUI = ( function(){

	var Exp;
	var sceneUI, // UI专用场景
		cameraUI, // UI专用相机
		UI; // UI最外层容器

	//浏览器窗口大小改变执行的事件
	function windowResize() {

		cameraUI.right = Exp.app.width();
		cameraUI.top = Exp.app.height();
		cameraUI.updateProjectionMatrix();

	}

	//在sceneUI中，添加用于显示UI内容的物体
	function createUI( imgArr ) {

        /**
         * 参数imgArr为webglUI层显示的图片数组，目前添加3张图片
         */
        
         //UI外层group元素
		Exp.UI = new THREE.Group();

		Exp.UI.scale.set( 18 , 18 , 18 );
        
        //将UI容器添加到专门渲染UI的sceneUI场景中
        sceneUI.add( Exp.UI );

        //UI默认不可见
        Exp.UI.visible = false; 

        //UI的文字内容
		var UItextMap = new THREE.SpriteMaterial( {

            map : null ,
            transparent : true ,
            depthTest : false

        } );
        var UItext = new THREE.Sprite( UItextMap );
        UItext.scale.set( 8 , 1.8 , 1 );
        UItext.position.set( -6.5 , 3.2 , 0) ;
        UItext.name = "UItext";

        //文字提示的内容默认不显示
        UItext.visible = false;
        Exp.UI.add( UItext );

        //加载“UI1.png”的精灵
        var sMat1 = new THREE.SpriteMaterial( {

            map : imgArr[ 0 ] ,
            transparent : true ,
            alphaTest : 0.1 ,
            depthTest : false

        } );
        var sprite1 = new THREE.Sprite( sMat1 );
        sprite1.scale.set( 10 , 3 , 1 );
        sprite1.position.set( -6.5 , 3.3 , 0 );
        Exp.UI.add( sprite1 );

       	//加载“UI2.png”的精灵
        var sMat2 = new THREE.SpriteMaterial( {

            map : imgArr[ 1 ] ,
            transparent : true ,
            alphaTest : 0.1 ,
            depthTest : false

        } );
        var sprite2 = new THREE.Sprite( sMat2 );
        sprite2.scale.set( 3.8 , 0.5 , 1 );
        sprite2.position.set( -9.2 , 1.5 , 0 );
        Exp.UI.add( sprite2 );

      	//加载“UI3.png”的精灵(斜线)
        var sMat3 = new THREE.SpriteMaterial( { 

            map : imgArr[ 2 ] ,
            transparent : true ,
            alphaTest : 0.1 ,
            depthTest : false ,
            rotation : - Math.PI / 4 // 贴图旋转45度

        } );
        var sprite3 = new THREE.Sprite( sMat3 );
        sprite3.scale.set( 3 , 0.1 , 1 );
        sprite3.position.set( -1 , 1 , 0 );
        Exp.UI.add( sprite3 );

        //加载“UI3.png”的精灵(水平线)
        var sMat4 = new THREE.SpriteMaterial( {

            map : imgArr[ 2 ] ,
            transparent : true ,
            alphaTest : 0.1 ,
            depthTest : false

        } );
        var sprite4 = new THREE.Sprite( sMat4 );
        sprite4.scale.set( 5 , 0.1 , 1 );
        sprite4.position.set( -4.6 , 1.6 , 0 );
        Exp.UI.add( sprite4 );

	}

	//修改UI的文字提示内容方法
	function createUItext( text ){

        /**
         * text参数为提示文字内容字符串，目前最多支持8个中文字符串的显示
         */
        
		var t = text ? text : "物体默认名称";

        //将canvas作为UItext精灵的map
		var canvas = document.createElement( "canvas" );
        canvas.width = 256;
        canvas.height = 64;
        var ctx = canvas.getContext( "2d" );
        ctx.fillStyle = "rgba( 255 , 255 , 255 , 0 )";
        ctx.fillRect( 0 , 0 , canvas.width , canvas.height );
        ctx.fillStyle = "#ffa64d";
        ctx.strokeStyle = "#ffa64d";
        ctx.textAlign = "center";

        //若名称字数不超过4个
        if( t.length <= 4 ) { 

        	ctx.font = "46px Georgia";

        } else if( t.length <= 6 ) { // 若名称字数为5或6个

        	ctx.font = "42px Georgia";

        } else if( t.length <= 7 ){ // 若名称字数为7个

            ctx.font = "36px Georgia";

        } else { // 若名称字数超过7个

        	ctx.font = "32px Georgia";

        }

        ctx.fillText( t, 130 , 44 );
        ctx.strokeText( t , 130 , 44 );

        var map = new THREE.Texture( canvas );
        map.needsUpdate = true;
        return map; 

	}

	return function( exp ) {

		Exp = exp;

        //创建一个新的场景
		sceneUI = new THREE.Scene();

		/**
        * 创建一个正交相机，构造函数为：
		*    THREE.OrthographicCamera( left, right, top, bottom, near, far )
		*/
    
		cameraUI = new THREE.OrthographicCamera( 0 , Exp.app.width() , Exp.app.height() , 0 , -10 , 10 );

        /*添加到exp中的属性*/

        //UI专用相机
        Exp.cameraUI = cameraUI; 

        //UI专用场景
        Exp.sceneUI = sceneUI;

        //UI提示框的外层group容器
        Exp.UI = UI; 

        //UI功能是否可用
        Exp.UIenabled = true; 

        /*添加到exp中的方法*/

        // 创建UI提示文字内容
        Exp.createUItext = createUItext; 
        
        // 创建UI层精灵
        Exp.createUI = createUI; 
		
        //UI层随容器大小自适应
		window.addEventListener( "resize" , windowResize );

	}

})();