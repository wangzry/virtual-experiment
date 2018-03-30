/***
 *  判断设备模块
 *  作者：Badmaster
 *  创建时间：2018-1-16 16:25:22
 *  修改人：
 *  修改时间：
 *  修改描述：
 *  版本：v0.1
 *  描述：为window添加一个布尔类型参数 isPc
 *  使用方法：直接在组装模块内使用checkJS调用即可
 *  返回值：布尔类型  isPc
 ***/

var isPc = ( function (){

	var userAgentInfo = navigator.userAgent;  
    var Agents = new Array("Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod");    
    var flag = true;

    for ( var v = 0 ; v < Agents.length ; v++ ) { 

        if ( userAgentInfo.indexOf( Agents[v] ) > 0 ) { 

        	flag = false; 
        	break; 

        }    
        
    }    

    return flag; 

})();