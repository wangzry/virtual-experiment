/*
*模块名称：悬浮触发点模块
*负责人：曾梓健
*创建时间：2018-1-16 08:58:36
*修改人：曾梓健
*修改时间：2018-2-2 15:58:37
*修改内容：1.在addPoint方法中，传入的对象属性中可以添加color属性，传入自定义的交互点颜色
*版本：v1.0.1
*详细描述：公共的触发点模块，能够在场景中添加可以点击的交互点。
*       由于交互点是点击事件触发，因此事件交互部分集成到click模块中。
*       目前交互点不随相机距离远近而改变看到的大小功能，是通过判断交互点距离相机的位置实时更新的，
*       可以考虑是否能用shader在渲染时保持交互点大小自适应改变
*使用方法：直接执行triggerPoint(exp)，即可为exp添加相关属性和方法；
*       目前在组装模块中调用，在setExpScene方法中清空pointArr数组;
*       var tp1 = exp.addPoint({
*           pos:[0, 10, 0], //交互点位置
*           parent: xwj, //交互点父级
*           color: 0x00ff00 //自定义的交互点颜色
*       });
*       tp1.clickFn =function(e){ //点击tp1后执行的方法
*           ...
*       }
*       tp1.enableClick = false;//tp1不响应点击事件
*返回值：返回方法triggerPoint，调用时需要传入参数exp
*       为exp对象添加了属性pointArr，方法addPoint
*/
var triggerPoint = ( function (){

    var Exp;
    var color = 0xf88410; // 交互点默认的颜色
    var defaultRatio = isPc ? 0.025 : 0.04; // 根据当前设备是否是PC来调整交互点默认大小

    //向场景中添加交互点的方法
    function addPoint( p ){

        /**
         * params: 
         * pos : [ x , y , z ]  //交互点的位置
         * parent : someObj  //交互点的父级，默认为exp.expScene
         * color : 0x000000  //交互点颜色，默认为橘色
         */
        
        var pColor;

        if( p.color === undefined || p.color === null ){

            pColor = color;

        } else {

            pColor = p.color;

        }

        //定义交互点的材质
        var mat = new THREE.SpriteMaterial({ 

            map : Exp.allImages.UI.triggerPoint ,
            transparent : true ,
            alphaTest : 0.1 ,
            color : pColor ,
            depthTest : false

        });

        //实例化一个精灵
        var point = new THREE.Sprite( mat ); 

        var parent = p.parent ? p.parent : Exp.expScene;

        var pos = p.pos ? p.pos : [ 0 , 0 , 0 ];

        //将交互点添加到父级的子集数组中
        parent.add( point ); 

        point.position.set( p.pos[ 0 ] , p.pos[ 1 ] , p.pos[ 2 ] );

        //更新exp.expScene中所有物体在世界坐标系中的状态
        Exp.expScene.updateMatrixWorld(); 

        //默认大小
        point.defaultRatio = defaultRatio;

        //获取交互点到相机位置的距离
        var cameraDistance = Exp.camera.position.clone().sub( point.getWorldPosition() ).length();

        var parentScale = { x : 1 , y : 1 }; 

        //交互点在场景中的原始大小
        point.originScale =  defaultRatio * cameraDistance;

        //获取交互点在最外层父级中的缩放
        parentScale = getParent( point , parentScale );

        //修改交互点大小
        point.scale.set( point.originScale * parentScale.x , point.originScale * parentScale.y , 1 );

        //交互点的name属性默认为triggerPoint，在click模块中用到
        point.name = "triggerPoint";

        //默认响应点击事件
        point.enableClick = true;

        //默认点击次数为0
        point.clickTimes = 0;

        //添加到交互点数组中
        Exp.pointArr.push( point );

        return point;

    }

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

            return getParent( p.parent , { x : x , y : y } );

        }

    }

    //所有交互点在相机视角改变时调整各自的大小
    function pointsAdapt(){

        Exp.pointArr.forEach( function ( item ){

            var cameraDistance = Exp.camera.position.clone().sub( item.getWorldPosition() ).length();

            var parentScale = { x : 1 , y : 1 };

            item.originScale =  defaultRatio * cameraDistance;

            parentScale = getParent( item , parentScale );

            item.scale.set( item.originScale * parentScale.x , item.originScale * parentScale.y , 1 );

        })

    }

    //返回一个方法
    return function( exp ){

        Exp = exp;

        //为exp对象添加pointArr属性，并赋值为空数组
        Exp.pointArr = []; 
        
        //为exp对象添加addPoint方法，用于在场景中添加交互点
        Exp.addPoint = addPoint;

        Exp.controls.removeEventListener( "change" , pointsAdapt );
        Exp.controls.addEventListener( "change" , pointsAdapt );

    }

})();