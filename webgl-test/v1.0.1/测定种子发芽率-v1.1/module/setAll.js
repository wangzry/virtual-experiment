/***
 *  自定义设置对象属性
 *  作者：Badmaster
 *  创建时间：2018-1-15 10:18:04
 *  修改人：Badmaster
 *  修改时间：2018-1-25 17:45:40
 *  修改描述：新增设置物体阴影
 *  版本：v0.1.1
 *  描述：为THREE.Object3D原型链添加setAll方法，可设置位置，旋转角度，缩放，名字，modelName以及triggerName
 *  使用方法：obj.setAll({
 *  				pos:[x,y,z],
 *  				rot:0,
 *  				sca:"1",
 *  				name:'this is name',
 *  				mName:'this is modelName',
 *  				trigName:'this is triggerName'
 *  		  });
 *  返回值：无
 ***/
 
 THREE.Object3D.prototype.setAll = function( arguments ){

	var lastPos = this.position.clone();//获取上一次设置位置
	var lastRot = this.rotation.clone();//获取上一次设置旋转角度
 	var lastSca = this.scale.clone();//获取上一次设置缩放

	var self = this;
	var pos = arguments.pos;
	var rot = arguments.rot;
	var sca = arguments.sca;
	var name = arguments.name;
	var mName = arguments.mName;
	var trigName = arguments.trigName;
	var showName = arguments.showName;
	var castShadow = arguments.cast;
	var receiveShadow = arguments.receive;
	var MM = arguments.MM;
	var MU = arguments.MU;
	var MD = arguments.MD;

	//设置物体位置
	if( pos !== undefined ){
		if( pos instanceof THREE.Vector3 ){

			self.position.copy( pos );

		}
		if( pos.constructor === Array ){

			var len = pos.length;

			if( len === 1 ){

				self.position.set( pos[0] , pos[0] , pos[0] );

			}else{

				for( var i = 0 ; i < 3 ; i++ ){

					if( typeof pos[i] !== 'number' ){

						var posNum = parseFloat( pos[i] );

						if(isNaN( posNum )){

							switch( i ){
								case 0:
									pos[0] = lastPos.x;
									break;
								case 1:
									pos[1] = lastPos.y;
									break;
								case 2:
									pos[2] = lastPos.z;
									break;
							}

						}else{

							pos[i] = posNum;

						}
					}
				}
				
				self.position.set( pos[0] , pos[1] , pos[2] );

			}
		}

		if( pos.constructor === Number ){

			self.position.set( pos , pos , pos );

		}

		if( pos.constructor === String ){

			var posNum = parseFloat( pos );

			if( isNaN( posNum ) ){

				self.position.set( lastPos.x , lastPos.y , lastPos.z );

			}else{

				self.position.set( posNum , posNum , posNum );

			}

		}

	}else{

		self.position.copy( lastPos );

	}

	//设置物体旋转角度
	if( rot !== undefined ){
		if( rot instanceof THREE.Euler ){

			self.rotation.copy( rot );

		}

		if( rot.constructor === Array ){

			for( var i = 0 ; i < 3 ; i++ ){

				if( typeof rot[i] !== 'number' ){

					var rotNum = parseFloat( rot[i] );

					if( isNaN(rotNum) ){

						switch( i ){
							case 0:
								rot[0] = lastRot.x;
								break;
							case 1:
								rot[1] = lastRot.y;
								break;
							case 2:
								rot[2] = lastRot.z;
								break;
						}

					}else{

						rot[i] = rotNum;

					}
				}
			}

			self.rotation.set( rot[0] , rot[1] , rot[2] );

		}

		if( rot.constructor === Number ){

			self.rotation.set( rot , rot , rot );

		}

		if( rot.constructor === String ){

			var rotNum = parseFloat( rot );

			if( isNaN( rotNum ) ){

				self.rotation.set( lastRot.x , lastRot.y , lastRot.z );

			}else{

				self.rotation.set( rotNum , rotNum , rotNum );

			}
		}

	}else{

		self.rotation.copy( lastRot );

	}

	//设置物体缩放
	if( sca !== undefined ){

		if( sca instanceof THREE.Vector3 ){

			self.scale.copy( sca );

		}

		if( sca.constructor === Array ){

			for( var i = 0 ; i < 3 ; i++ ){

				if( typeof sca[i] !== 'number' ){

					var scNum = parseFloat( sca[i] );

					if( isNaN( scNum ) ){

						switch( i ){
							case 0:
								sca[0] = lastSca.x;
								break;
							case 1:
								sca[1] = lastSca.y;
								break;
							case 2:
								sca[2] = lastSca.z;
								break;
						}

					}else{

						sca[i] = scNum;

					}
				}
			}

			self.scale.set( sca[0] , sca[1] , sca[2] );

		}

		if( sca.constructor === Number ){

			self.scale.set( sca , sca , sca );

		}else if( sca.constructor === String ){

			var scNum = parseFloat( sca );

			if( isNaN( scNum ) ){

				self.scale.set( lastSca.x , lastSca.y , lastSca.z );

			}else{

				self.scale.set( scNum , scNum , scNum );

			}

		}

	}else{

		self.scale.copy( lastSca );

	}

	if( !this.oldPos )this.oldPos = this.position.clone();//记录初始设置位置
	if( !this.oldRot )this.oldRot = this.rotation.clone();//记录初始设置旋转角度
	if( !this.oldSca )this.oldSca = this.scale.clone();//记录初始设置缩放

	//设置名字
	if( name !== undefined ){

		self.name = name;
		self.traverse( function ( child ){

			if( child.isMesh ){

				child.modelName = name;

			}

		});
		
	}

	//设置modelName
	if( mName !== undefined ){

		self.traverse(function ( child ){

			if( child.isMesh ){

				child.modelName = mName;

			}
		});
	}

	//设置物体trigName
	if( trigName !== undefined ){

		self.triggerName = trigName;

	}

	//设置物体名字
	if( showName !== undefined ){

		self.showName = showName;

	}

	//设置物体阴影
	if( castShadow !== undefined ){

		if( self.isObj || self.isDae ){

			self.traverse( function ( child ){

				if( child.isMesh ){

					child.castShadow = castShadow;

				}

			});

		}

		if( self.isMesh ){

			child.castShadow = castShadow;
			
		}

	}

	//设置物体是否接收阴影
	if( receiveShadow !== undefined ){

		if( self.isObj || self.isDae ){

			self.traverse( function ( child ){

				if( child.isMesh ){

					child.receiveShadow = receiveShadow;

				}

			});

		}

		if( self.isMesh ){

			child.receiveShadow = receiveShadow;
			
		}

	}

	if( MM !== undefined ){

		self.MM = MM;

	}

	if( MU !== undefined ){

		self.MU = MU;

	}

	if( MD !== undefined ){

		self.MD = MD;

	}
 }