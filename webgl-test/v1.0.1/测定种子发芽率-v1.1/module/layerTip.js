/*
*模块名称：layer弹框模块
*负责人：曾梓健
*创建时间：2018-1-15 16:22:20
*修改人：曾梓健
*修改时间：2018-2-5 16:47:08
*修改内容：1.优化代码格式
*版本：v1.0.1
*详细描述：公共的layer文字弹框提示，目前提供3中类型的提示；
        tip:不会自动消失的顶部提示；
        autoTip:根据传入的时间参数，在XXs后自动消失的顶部提示；
        wholeScreenTip:全屏提示，需要文字内容和时间必填
*使用方法：layerTip(exp); //在组装函数创建基本场景时，或者所有资源加载完毕时均可以调用
        exp.tip("111");
        exp.autoTip("222", 1000);
        exp.wholeScreenTip("333", 2000, {
            end: function() {
                console.log("弹框销毁后执行代码");
            },
            success:function(){
                console.log("弹框弹出时执行代码");
            }   
        });
*返回值：返回layerTip函数
        执行后为exp添加tip,autoTip,wholeScreenTip方法
*/
var layerTip = ( function(){

    var Exp;
    var pcOffsetTop = 50, // PC端，提示框距离容器顶部的距离
        mOffsetTop= 0; // 移动端，提示框距离容器顶部的距离

    //判断运行设备是否为PC
    var isPc = ( function() { 

        var userAgentInfo = navigator.userAgent;  

        var Agents = new Array( "Android" , "iPhone" , "SymbianOS" , "Windows Phone" , "iPad" , "iPod" );    

        var flag = true;    

        for ( var v = 0 ; v < Agents.length ; v++ ) { 

            if ( userAgentInfo.indexOf( Agents[ v ] ) > 0 ) { 

                flag = false; 

                break; 

            }   

        }    

        return flag; 

    })();

    //静态方法
    function tip( content ) {

        /*
        *  参数：文字提示内容（必填）
        */
       
        //获取layer弹框的index
        var tipIndex = layer.msg( content , { 

            time : 0 ,
            skin : "webgl-tip-css" ,
            zIndex : 0 ,
            shade : 0

        } );

        var $tip = $( "#layui-layer" + tipIndex );
        var tipWidth = $tip.width();
        var domWidth = Exp.app.width();
        var offsetTop = isPc ? pcOffsetTop : mOffsetTop;
        offsetTop += Exp.app.offset().top;

        $tip.css( {
            left : ( domWidth - tipWidth ) / 2 ,
            top : offsetTop
        } );

        // 该resize方法每执行一次tip()都会重新监听该浏览器窗口大小的改变
        // 但如果将resize方法提出，则无法修改动态元素layer框的样式
        $( window ).resize( function(){

            var $tip = $( "#layui-layer" + tipIndex );
            var tipWidth = $tip.width();
            var domWidth = Exp.app.width();
            var offsetTop = isPc ? pcOffsetTop : mOffsetTop;
            offsetTop += Exp.app.offset().top;

            $tip.css( {
                left : ( domWidth - tipWidth ) / 2 ,
                top : offsetTop
            } );

        });

    }

    //会在duration毫秒后自动消失的layer提示
    function autoTip( content , duration ) {

        /*
        * 参数：文字提示内容（必填）
        *     弹框自动消失的时间（必填）
        */
       
        var tipIndex = layer.msg( content , {

            time : duration ,
            skin : "webgl-tip-css" ,
            zIndex : 0 ,
            shade : 0

        });

        var $tip = $( "#layui-layer" + tipIndex );
        var tipWidth = $tip.width();
        var domWidth = Exp.app.width();
        var offsetTop = isPc ? pcOffsetTop : mOffsetTop;
        offsetTop += Exp.app.offset().top;

        $tip.css( {
            left : ( domWidth - tipWidth ) / 2 ,
            top : offsetTop
        } );

        // 该resize方法每执行一次tip()都会重新监听该浏览器窗口大小的改变
        // 但如果将resize方法提出，则无法修改动态元素layer框的样式
        $ (window ).resize( function() {

            var $tip = $( "#layui-layer" + tipIndex );
            var tipWidth = $tip.width();
            var domWidth = Exp.app.width();
            var offsetTop = isPc ? pcOffsetTop : mOffsetTop;
            offsetTop += Exp.app.offset().top;

            $tip.css( {
                left : ( domWidth - tipWidth ) / 2 ,
                top : offsetTop
            } );

        } );

    }

    //全屏的提示，例如培养跟第二天提示，可传入success后或者layer框销毁后执行的函数
    function wholeScreenTip( content , duration , fn ) {

        /*
        * 参数：
        *   文字提示内容（必填）
        *   弹框自动消失的时间（必填）
        *   弹框事件对象{end: fn, success: fn}（可选）
        */
       
        var endFn = fn && fn.end ? fn.end : function(){};
        var sucFn = fn && fn.success ? fn.success : function(){};

        layer.open( {
            closeBtn : 0 , // 取消关闭按钮
            time : duration , // 自动消失的时间
            title : false , // 取消标题
            type: 1 , // 层类型为页面层
            content : content , // 弹出文字内容
            skin : 'webgl-wholeScreenTip-css' , // 自定义皮肤
            resize : false , // 不能调节大小
            shade : [ 1 , '#000' ] , // 遮罩颜色
            anim : 5 ,  // 弹出动画为渐变
            zIndex : 9999 , // 弹框层级
            end : fn.end , // 弹框销毁时回调
            success : fn.success // 弹框弹出时回调
        } );

    }

    return function( exp ) {

        Exp = exp;

        //为exp对象添加对应的方法，便于调用
        Exp.tip = tip;
        Exp.autoTip = autoTip;
        Exp.wholeScreenTip = wholeScreenTip;

    }

})();