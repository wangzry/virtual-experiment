/***
 * 粒子引擎
 * 作者：Badmaster
 * 创建时间：2018-2-6 13:47:17
 * 修改人：Badmaster
 * 修改时间：2018-2-26 08:46:07
 * 修改描述：修复总是渲染在最上层的问题
 * 版本：0.1
 * 描述：定制粒子效果
 * 		 通过使用shadermaterial以及buffergeometry进行粒子渲染，一个粒子系统只有一种材质，所有粒子（顶点）都使用这一套材质
 * 使用方法：详见fire-demo  主要就是实例化+传参
 * 返回值：undefined
 ***/

/////////////
// SHADERS //
/////////////

// attribute: data that may be different for each particle (such as size and color);
//      can only be used in vertex shader
// varying: used to communicate data from vertex shader to fragment shader
// uniform: data that is the same for each particle (such as texture)

particleVertexShader = 
[
"attribute vec3  customColor;",
"attribute float customOpacity;",
"attribute float customSize;",
"attribute float customAngle;",
"attribute float customVisible;",  // float used as boolean (0 = false, 1 = true)
"varying vec4  vColor;",
"varying float vAngle;",
"void main()",
"{",
	"if ( customVisible > 0.5 )", 				// true
		"vColor = vec4( customColor, customOpacity );", //     set color associated to vertex; use later in fragment shader.
	"else",							// false
		"vColor = vec4(0.0, 0.0, 0.0, 0.0);", 		//     make particle invisible.
		
	"vAngle = customAngle;",

	"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
	"gl_PointSize = customSize * ( 300.0 / length( mvPosition.xyz ) );",     // scale particles as objects in 3D space
	"gl_Position = projectionMatrix * mvPosition;",
"}"
].join("\n");

particleFragmentShader =
[
"uniform sampler2D texture;",
"varying vec4 vColor;", 	
"varying float vAngle;",   
"void main()", 
"{",
	"gl_FragColor = vColor;",
	
	"float c = cos(vAngle);",
	"float s = sin(vAngle);",
	"vec2 rotatedUV = vec2(c * (gl_PointCoord.x - 0.5) + s * (gl_PointCoord.y - 0.5) + 0.5,", 
	                      "c * (gl_PointCoord.y - 0.5) - s * (gl_PointCoord.x - 0.5) + 0.5);",  // rotate UV coordinates to rotate texture
    	"vec4 rotatedTexture = texture2D( texture,  rotatedUV );",
	"gl_FragColor = gl_FragColor * rotatedTexture;",    // sets an otherwise white particle texture to desired color
"}"
].join("\n");

/////////////////
// TWEEN CLASS //
/////////////////

function Tween(timeArray, valueArray)
{
	this.times  = timeArray || [];
	this.values = valueArray || [];
}

Tween.prototype.lerp = function(t)
{
	var i = 0;
	var n = this.times.length;
	while (i < n && t > this.times[i])  
		i++;
	if (i == 0) return this.values[0];
	if (i == n)	return this.values[n-1];
	var p = (t - this.times[i-1]) / (this.times[i] - this.times[i-1]);
	if (this.values[0] instanceof THREE.Vector3)
		return this.values[i-1].clone().lerp( this.values[i], p );
	else // its a float
		return this.values[i-1] + p * (this.values[i] - this.values[i-1]);
}

////////////////////
// PARTICLE CLASS //
////////////////////

function Particle()
{
	this.position     = new THREE.Vector3();//位置
	this.velocity     = new THREE.Vector3(); // units per second 偏移速度
	this.acceleration = new THREE.Vector3();//加速度

	this.angle             = 0;//角度
	this.angleVelocity     = 0; // degrees per second偏移速度
	this.angleAcceleration = 0; // degrees per second, per second角度加速度
	
	this.size = 16.0;//默认尺寸

	this.color   = new THREE.Color();//颜色
	this.opacity = 1.0;//透明度
			
	this.age   = 0;//存在时间
	this.alive = 0; // use float instead of boolean for shader purposes	使用浮点数代替布尔值进行着色
}

//粒子更新方法
Particle.prototype.update = function(dt)
{
	this.position.add( this.velocity.clone().multiplyScalar(dt) );//原位置+偏移速度*时间
	this.velocity.add( this.acceleration.clone().multiplyScalar(dt) );//原速度+加速度*时间
	
	// convert from degrees to radians: 0.01745329251 = Math.PI/180
	// 转化为弧度制，0.01745329251就是一度
	this.angle         += this.angleVelocity     * 0.01745329251 * dt;//重新计算角度
	this.angleVelocity += this.angleAcceleration * 0.01745329251 * dt;//重新计算加速度

	this.age += dt;//重新计算存在时间
	
	// if the tween for a given attribute is nonempty,
	//  then use it to update the attribute's value
	//  如果tween不为空，则使用tween进行更新

	if ( this.sizeTween.times.length > 0 )
		this.size = this.sizeTween.lerp( this.age );
				
	if ( this.colorTween.times.length > 0 )
	{
		var colorHSL = this.colorTween.lerp( this.age );
		this.color = new THREE.Color().setHSL( colorHSL.x, colorHSL.y, colorHSL.z );
	}
	
	if ( this.opacityTween.times.length > 0 )
		this.opacity = this.opacityTween.lerp( this.age );
}

///////////////////////////
// PARTICLE ENGINE CLASS //
///////////////////////////

var Type = Object.freeze({ "CUBE" : 1 , "SPHERE" : 2 });//创建一个被冻结的对象

function ParticleEngine()
{
	/////////////////////////
	// PARTICLE PROPERTIES //
	/////////////////////////
	
	this.positionStyle = Type.CUBE;		
	this.positionBase   = new THREE.Vector3();
	// cube shape data
	this.positionSpread = new THREE.Vector3();
	// sphere shape data
	this.positionRadius = 0; // distance from base at which particles start从粒子开始的距离
	
	this.velocityStyle = Type.CUBE;	
	// cube movement data
	this.velocityBase       = new THREE.Vector3();
	this.velocitySpread     = new THREE.Vector3(); 
	// sphere movement data
	//   direction vector calculated using initial position
	this.speedBase   = 0;//初始速度
	this.speedSpread = 0;//速度增量
	
	this.accelerationBase   = new THREE.Vector3();//基础加速度
	this.accelerationSpread = new THREE.Vector3();//加速度增量
	
	//角度默认值以及改变量
	this.angleBase               = 0;
	this.angleSpread             = 0;
	this.angleVelocityBase       = 0;
	this.angleVelocitySpread     = 0;
	this.angleAccelerationBase   = 0;
	this.angleAccelerationSpread = 0;
	
	this.sizeBase   = 0.0;//默认size
	this.sizeSpread = 0.0;//size增量
	this.sizeTween  = new Tween();//size动画
			
	// store colors in HSL format in a THREE.Vector3 object
	// http://en.wikipedia.org/wiki/HSL_and_HSV
	this.colorBase   = new THREE.Vector3(0.0, 1.0, 0.5); //颜色基础值
	this.colorSpread = new THREE.Vector3(0.0, 0.0, 0.0);//颜色增量
	this.colorTween  = new Tween();//颜色动画
	
	this.opacityBase   = 1.0;//透明度基础值
	this.opacitySpread = 0.0;//透明度增量
	this.opacityTween  = new Tween();//透明度动画

	this.blendStyle = THREE.NormalBlending; // false;

	this.particleArray = [];//存放粒子的数组
	this.particlesPerSecond = 100;//每秒100个粒子
	this.particleDeathAge = 1.0;//执行多少次循环之后消失
	
	////////////////////////
	// EMITTER PROPERTIES //
	////////////////////////
	
	this.emitterAge      = 0.0;//发射器持续时间
	this.emitterAlive    = true;//发射器是否使用
	this.emitterDeathAge = Infinity; // time (seconds) at which to stop creating particles.停止创建粒子的时间
	
	// How many particles could be active at any time?
	// 有多少粒子可以在任何时候活动？
	this.particleCount = this.particlesPerSecond * Math.min( this.particleDeathAge, this.emitterDeathAge );

	//////////////
	// THREE.JS //
	//////////////

	this.particleGeometry = new THREE.BufferGeometry();
	this.particleTexture  = null;//创建一个基础贴图
	//创建一个默认材质
	this.particleMaterial = new THREE.ShaderMaterial(
	{
		uniforms: 
		{
			texture:   { type: "t", value: this.particleTexture }
		},
		vertexShader:   particleVertexShader,
		fragmentShader: particleFragmentShader,
		transparent: true, // alphaTest: 0.5,  // if having transparency issues, try including: alphaTest: 0.5, 
		blending: THREE.NormalBlending, depthTest: true,
		
	});
	this.particleMesh = new THREE.Mesh();//创建一个默认mesh
}
	
//传入对应的值，执行的方法
ParticleEngine.prototype.setValues = function( parameters )
{
	if ( parameters === undefined ) return;
	
	// clear any previous tweens that might exist
	// 清楚以前可能存在的tween
	this.sizeTween    = new Tween();
	this.colorTween   = new Tween();
	this.opacityTween = new Tween();
	
	for ( var key in parameters ) 
		this[ key ] = parameters[ key ];
	
	// attach tweens to particles
	// 将tween附加到particles
	Particle.prototype.sizeTween    = this.sizeTween;
	Particle.prototype.colorTween   = this.colorTween;
	Particle.prototype.opacityTween = this.opacityTween;	
	
	// calculate/set derived particle engine values
	// 计算/设置派生的粒子引擎的值
	this.particleArray = [];
	this.emitterAge      = 0.0;
	this.emitterAlive    = true;
	//有多少粒子可以在任何时候活动？
	this.particleCount = this.particlesPerSecond * Math.min( this.particleDeathAge, this.emitterDeathAge );

	this.particleGeometry = new THREE.BufferGeometry();

	this.particleMaterial = new THREE.ShaderMaterial(
	{
		uniforms: 
		{
			texture:   { type: "t", value: this.particleTexture }
		},
		vertexShader:   particleVertexShader,
		fragmentShader: particleFragmentShader,
		transparent: true,  alphaTest: 0.5, // if having transparency issues, try including: alphaTest: 0.5, 
		blending: THREE.NormalBlending, depthTest: true
	});
	this.particleMesh = new THREE.Points();
}
	
// helper functions for randomization
// 随机方法区
ParticleEngine.prototype.randomValue = function(base, spread)
{
	return base + spread * (Math.random() - 0.5);
}
ParticleEngine.prototype.randomVector3 = function(base, spread)
{
	var rand3 = new THREE.Vector3( Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5 );
	return new THREE.Vector3().addVectors( base, new THREE.Vector3().multiplyVectors( spread, rand3 ) );
}

//创建新的粒子
ParticleEngine.prototype.createParticle = function()
{
	var particle = new Particle();

	//随机起始位置，两种模式
	if (this.positionStyle == Type.CUBE)
		particle.position = this.randomVector3( this.positionBase, this.positionSpread ); 
	if (this.positionStyle == Type.SPHERE)
	{
		var z = 2 * Math.random() - 1;
		var t = 6.2832 * Math.random();
		var r = Math.sqrt( 1 - z*z );
		var vec3 = new THREE.Vector3( r * Math.cos(t), r * Math.sin(t), z );
		particle.position = new THREE.Vector3().addVectors( this.positionBase, vec3.multiplyScalar( this.positionRadius ) );
	}
	
	//随机速率，两种模式	
	if ( this.velocityStyle == Type.CUBE )
	{
		particle.velocity     = this.randomVector3( this.velocityBase,     this.velocitySpread ); 
	}
	if ( this.velocityStyle == Type.SPHERE )
	{
		var direction = new THREE.Vector3().subVectors( particle.position, this.positionBase );
		var speed     = this.randomValue( this.speedBase, this.speedSpread );
		particle.velocity  = direction.normalize().multiplyScalar( speed );
	}
	
	//随机加速度
	particle.acceleration = this.randomVector3( this.accelerationBase, this.accelerationSpread ); 

	//速记起始角度、角度偏移速度、角度加速度
	particle.angle             = this.randomValue( this.angleBase,             this.angleSpread );
	particle.angleVelocity     = this.randomValue( this.angleVelocityBase,     this.angleVelocitySpread );
	particle.angleAcceleration = this.randomValue( this.angleAccelerationBase, this.angleAccelerationSpread );

	//随机起始大小
	particle.size = this.randomValue( this.sizeBase, this.sizeSpread );

	//随机颜色
	var color = this.randomVector3( this.colorBase, this.colorSpread );
	particle.color = new THREE.Color().setHSL( color.x, color.y, color.z );
	
	//随机透明度
	particle.opacity = this.randomValue( this.opacityBase, this.opacitySpread );

	particle.age   = 0;//存在时间
	particle.alive = 0; // 粒子初始化为非活动的
	
	return particle;
}

//粒子引擎执行方法
ParticleEngine.prototype.initialize = function()
{	
	var positions = [];
	var alives = [];
	var colors = [];
	var opacitys = [];
	var sizes = [];
	var angles = [];
	// link particle data with geometry/material data
	// 创建粒子至每秒存在的最大上限,将粒子数据与几何/材料数据联系起来。
	for (var i = 0; i < this.particleCount; i++)
	{
		// remove duplicate code somehow, here and in update function below.
		this.particleArray[i] = this.createParticle();
		positions.push( this.particleArray[i].position.x , this.particleArray[i].position.y , this.particleArray[i].position.z );
		alives[i] = this.particleArray[i].alive;
		colors.push( this.particleArray[i].color.r , this.particleArray[i].color.g , this.particleArray[i].color.b );
		opacitys[i] = this.particleArray[i].opacity;
		sizes[i]    = this.particleArray[i].size;
		angles[i]   = this.particleArray[i].angle;

	}

	this.particleGeometry.addAttribute( 'position' , new THREE.Float32BufferAttribute( positions , 3 ).setDynamic( true ) );
	this.particleGeometry.addAttribute( 'customColor' , new THREE.Float32BufferAttribute( colors , 3 ).setDynamic( true ) );
	this.particleGeometry.addAttribute( 'customOpacity' , new THREE.Float32BufferAttribute( opacitys , 1 ).setDynamic( true ) );
	this.particleGeometry.addAttribute( 'customSize' , new THREE.Float32BufferAttribute( sizes , 1 ).setDynamic( true ) );
	this.particleGeometry.addAttribute( 'customAngle' , new THREE.Float32BufferAttribute( angles , 1 ).setDynamic( true ) );
	this.particleGeometry.addAttribute( 'customVisible' , new THREE.Float32BufferAttribute( alives , 1 ).setDynamic( true ) );
	
	this.particleMaterial.blending = this.blendStyle;
	if ( this.blendStyle != THREE.NormalBlending) 
		this.particleMaterial.depthWrite = false;
	
	this.particleMesh = new THREE.Points( this.particleGeometry, this.particleMaterial );

	return this.particleMesh;

	// exp.scene.add( this.particleMesh );
}

//粒子更新方法
ParticleEngine.prototype.update = function(dt)
{

	// check if particle emitter is still running
	// 判断粒子发射器是否还在使用
	if ( !this.emitterAlive ) return;

	var recycleIndices = [];

	var alives = [];
	var colors = [];
	var opacitys = [];
	var sizes = [];
	var angles = [];
	var positions = [];
	
	// update particle data
	for (var i = 0; i < this.particleCount; i++)
	{
		if ( this.particleArray[i].alive )
		{
			this.particleArray[i].update(dt);

			// check if particle should expire
			// could also use: death by size<0 or alpha<0.
			if ( this.particleArray[i].age > this.particleDeathAge ) 
			{
				this.particleArray[i].alive = 0.0;
				recycleIndices.push(i);
			}
			// update particle properties in shader
			positions.push( this.particleArray[i].position.x , this.particleArray[i].position.y , this.particleArray[i].position.z );
			alives[i] = this.particleArray[i].alive;
			colors.push( this.particleArray[i].color.r , this.particleArray[i].color.g , this.particleArray[i].color.b );
			opacitys[i] = this.particleArray[i].opacity;
			sizes[i]    = this.particleArray[i].size;
			angles[i]   = this.particleArray[i].angle;
		}		
	}
	this.particleGeometry.addAttribute( 'customColor' , new THREE.Float32BufferAttribute( colors , 3 ).setDynamic( true ) );
	this.particleGeometry.addAttribute( 'customOpacity' , new THREE.Float32BufferAttribute( opacitys , 1 ).setDynamic( true ) );
	this.particleGeometry.addAttribute( 'customSize' , new THREE.Float32BufferAttribute( sizes , 1 ).setDynamic( true ) );
	this.particleGeometry.addAttribute( 'customAngle' , new THREE.Float32BufferAttribute( angles , 1 ).setDynamic( true ) );
	this.particleGeometry.addAttribute( 'customVisible' , new THREE.Float32BufferAttribute( alives , 1 ).setDynamic( true ) );

	// if no particles have died yet, then there are still particles to activate
	// 如果没有粒子死亡，那么仍然有粒子被激活。
	if ( this.emitterAge < this.particleDeathAge )
	{
		// determine indices of particles to activate
		// 确定粒子活化指数
		var startIndex = Math.round( this.particlesPerSecond * (this.emitterAge +  0) );
		var   endIndex = Math.round( this.particlesPerSecond * (this.emitterAge + dt) );
		if  ( endIndex > this.particleCount ) 
			  endIndex = this.particleCount; 
			  
		for (var i = startIndex; i < endIndex; i++)
			this.particleArray[i].alive = 1.0;		
	}

	// if any particles have died while the emitter is still running, we imediately recycle them
	for (var j = 0; j < recycleIndices.length; j++)
	{
		var i = recycleIndices[j];
		this.particleArray[i] = this.createParticle();
		this.particleArray[i].alive = 1.0; // activate right away

		positions[ i * 3 ] = this.particleArray[i].position.x;
		positions[ i * 3 + 1 ] = this.particleArray[i].position.y;
		positions[ i * 3 + 2 ] = this.particleArray[i].position.z;

	}
	this.particleGeometry.addAttribute( 'position' , new THREE.Float32BufferAttribute( positions , 3 ).setDynamic( true ) );

	// stop emitter?
	this.emitterAge += dt;
	if ( this.emitterAge > this.emitterDeathAge )  this.emitterAlive = false;
}

/**
 * 移除方法，暂时保留意见
 * @return undefined
 */
ParticleEngine.prototype.destroy = function()
{
    // exp.scene.remove( this.particleMesh );
}