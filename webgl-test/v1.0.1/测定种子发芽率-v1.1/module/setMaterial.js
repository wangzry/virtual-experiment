/***
 *  设置模型材质模块
 *  作者：Badmaster
 *  创建时间：2018-1-17 13:27:36
 *  修改人：
 *  修改时间：
 *  修改描述：
 *  版本：v0.1
 *  描述：设置模型材质
 *  使用方法：将该方法在initScene中调用，使用方法直接调用exp.setMaterial即可
 *  返回值：THREE.MeshStandardMaterial
 ***/

var setMaterial = function( arguments ){

	var material;

	var roughness = arguments.roughness !== undefined ? arguments.roughness : 1 ;
	var metalness = arguments.metalness !== undefined ? arguments.metalness : 1 ;
	var color = arguments.color !== undefined ? arguments.color : 0xc6c6c6 ;
	var side = arguments.side !== undefined ? arguments.side : THREE.DoubleSide ;
	var transparent = arguments.transparent !== undefined ? arguments.transparent : false ;
	var opacity = arguments.opa !== undefined ? arguments.opa : 1 ;
	var alphaTest = arguments.alphaTest !== undefined ? arguments.alphaTest : 0 ;
	var emissive = arguments.emissive !== undefined ? arguments.emissive : 0x000000 ;

	var map_D = arguments.D !== undefined ? arguments.D : null ;
	var map_R = arguments.R !== undefined ? arguments.R : null ;
	var map_N = arguments.N !== undefined ? arguments.N : null ;
	var map_Metal = arguments.M !== undefined ? arguments.M : null ;
	var map_ENV = arguments.envMap !== undefined ? arguments.envMap : null ;
	var map_emissive = arguments.emissiveMap !== undefined ? arguments.emissiveMap : null ;

	material = new THREE.MeshStandardMaterial({

		roughness : roughness ,
      	metalness : metalness  ,
      	color : color ,
      	side : side ,
      	transparent : transparent ,
      	opacity : opacity ,
      	alphaTest : alphaTest ,
      	emissive : emissive ,
      	emissiveMap : map_emissive ,
		map : map_D ,
		roughnessMap : map_R ,
		normalMap : map_N ,
		metalnessMap : map_Metal ,
		envMap : map_ENV 

	});

	return material;
}