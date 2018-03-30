/***
 *  相机控制器模块
 *  作者：Badmaster
 *  创建时间：2018-1-16 16:21:30
 *  修改人：
 *  修改时间：
 *  修改描述：
 *  版本：v0.1
 *  描述：为window添加相机控制器方法 cameraAnim
 *  使用方法：移动相机方法  exp.moveCameraFocus( exp , params ) //params包括 .position .target .time .onStart .onComplete
 *            重置相机方法  exp.resetCamera( exp , params );
 *  返回值：exp.moveCameraFocus();
 *          exp.resetCamera();
 ***/

var cameraAnim = ( function (){

  return {

    moveCameraFocus : function( exp , params ){

      exp.camera.lastState = {

        targetX : exp.controls.target.x ,
        targetY : exp.controls.target.y ,
        targetZ : exp.controls.target.z ,
        posX : exp.camera.position.x ,
        posY : exp.camera.position.y ,
        posZ : exp.camera.position.z

      };

      exp.camera.changeState = {

        targetX : exp.controls.target.x ,
        targetY : exp.controls.target.y ,
        targetZ : exp.controls.target.z ,
        posX : exp.camera.position.x ,
        posY : exp.camera.position.y ,
        posZ : exp.camera.position.z

      };

      var moveCamera = new TWEEN.Tween( exp.camera.changeState )
        .to({

          targetX : params.target[0] ,
          targetY : params.target[1] ,
          targetZ : params.target[2] ,
          posX : params.pos[0] ,
          posY : params.pos[1] ,
          posZ : params.pos[2]

        }, params.time )
        .easing( TWEEN.Easing.Cubic.Out )
        .onStart( function (){

          if( params.onStart ){

            params.onStart();

          }

        })
        .onUpdate( function (){

          exp.camera.position.set( this.posX , this.posY , this.posZ );
          exp.controls.target.set( this.targetX , this.targetY , this.targetZ );

        })
        .onComplete( function(){
          if( params.onComplete ){

            params.onComplete();

          }
        })
        .start();
    },

    resetCamera : function( exp , params ){

      exp.camera.changeState = {

        targetX : exp.controls.target.x ,
        targetY : exp.controls.target.y ,
        targetZ : exp.controls.target.z ,
        posX : exp.camera.position.x ,
        posY : exp.camera.position.y ,
        posZ : exp.camera.position.z

      };

      var tx = params.target ? params.target[0] : exp.camera.lastState.targetX ;
      var ty = params.target ? params.target[1] : exp.camera.lastState.targetY ;
      var tz = params.target ? params.target[2] : exp.camera.lastState.targetZ ;
      var posX = params.pos ? params.pos[0] : exp.camera.lastState.posX ;
      var posY = params.pos ? params.pos[1] : exp.camera.lastState.posY ;
      var posZ = params.pos ? params.pos[2] : exp.camera.lastState.posZ ;
      var resetCamera = new TWEEN.Tween( exp.camera.changeState )
        .to({

          targetX : tx ,
          targetY : ty ,
          targetZ : tz ,
          posX : posX ,
          posY : posY ,
          posZ : posZ

        }, params.time )
        .easing( TWEEN.Easing.Cubic.Out )
        .onStart( function (){

          if( params.onStart ) {

            params.onStart();

          }

        })
        .onUpdate( function (){

          exp.camera.position.set( this.posX , this.posY , this.posZ );
          exp.controls.target.set( this.targetX , this.targetY , this.targetZ );

        })
        .onComplete( function (){

          if( params.onComplete ){

            params.onComplete();

          }
          
        })
        .start();
    }
  };
})();