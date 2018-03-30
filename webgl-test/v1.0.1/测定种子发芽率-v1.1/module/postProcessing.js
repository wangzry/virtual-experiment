/***
 * 后期渲染模块
 * 作者：Badmaster
 * 创建时间：2018-1-16 08:58:51
 * 修改人：
 * 修改时间：
 * 修改描述：
 * 版本：0.1
 * 描述：定制后期渲染处理
 * 		 这一部分的核心就在于怎么通过混合渲染管道将所有渲染效果进行整合，渲染管道的顺序十分重要，不同的顺序会得到迥异的渲染效果
 * 		 同时  使用renderToScreen的渲染管道只能有一个
 * 使用方法：*******不要在主入口内实例化！在正常情况下这个模块无需手动添加到主入口内******
 * 返回值：fn init() //在组装模块内直接使用  需要参数 renderer , scene , camera , width , height 
 * 			  onResize() //该方法在render内调用，使用postProcessing.isUse 来判断是否使用  需要参数  scene camera width height
 * 			  
 * 		   obj  Composer
 *				renderPass
 *				outlinePass
 *				ssaoPass
 *				bloomPass
 *				effectFXAA 
 *				effectVignette 
 *				effectBloom 
 *				effectFilm 
 *				effectBleach 
 ***/

var postProcessing  = (function(){
	var self;

	/**
	 * 定制通用混合渲染管道，所有需要渲染的场景或管道都将放入这里
	 * @param {[renderer]} renderer [渲染renderer]
	 * @return Composer 混合用染管道
	 */
	function Composer( renderer ){

		var Composer = new THREE.EffectComposer( renderer );//混合用渲染管道，定制后期渲染核心就是怎么通过这个混合渲染管道将所有渲染效果进行整合
		return Composer;

	}

	/**
	 * 默认渲染管道，基于基础场景与相机生成的画面
	 * @param  {[THREE.Scene]} scene  [场景]
	 * @param  {[THREE.Camera]} camera [相机]
	 * @return renderPass 默认渲染管道
	 */
	function renderPass( scene , camera ){

		var renderPass = new THREE.RenderPass( scene, camera );//定制原始画面渲染管道，一切的渲染都是基于最开始的画面进行处理的
		return renderPass;

	}

	/**
	 * 描边方法
	 * @param  {[THREE.Scene]} scene  [场景]
	 * @param  {[THREE.Camera]} camera [相机]
	 * @param  {[string]} width  [需要渲染的场景宽度]
	 * @param  {[string]} height [需要渲染的场景高度]
	 * @return outlinePass 描边通道
	 */
	function outlinePass( scene , camera , width , height ){

		var outlinePass = new THREE.OutlinePass( new THREE.Vector2( width , height ) , scene , camera );
		outlinePass.edgeStrength = 2;//描边宽度
		outlinePass.edgeGlow = 0;//描边扩散半透明区域范围
		outlinePass.edgeThickness = 1.5;//虚化程度
		outlinePass.pulsePeriod = 5;//闪烁延迟
		outlinePass.visibleEdgeColor.set('#ffff00');//未遮挡部位颜色
		outlinePass.hiddenEdgeColor.set('#ffff00');//遮挡部分颜色，建议遮挡部分与未遮挡部分颜色一致
		return outlinePass;

	}

	/**
	 * 高对比度模式
	 * @param  {[THREE.Scene]} scene  [场景]
	 * @param  {[THREE.Camera]} camera [相机]
	 * @param  {[string]} width  [渲染场景的宽度]
	 * @param  {[string]} height [渲染场景的高度]
	 * @return ssaoPass 高对比度渲染通道
	 */
	function ssaoPass( scene , camera , width , height ){

		var ssaoPass = new THREE.SSAOPass( scene , camera );
		ssaoPass.setSize( width * 2 , height * 2);
		ssaoPass.onlyAO = false;//只显示AO
		ssaoPass.radius = 3;//阴影范围
		ssaoPass.aoClamp = 1;//AO阴影强度  0-1  1最强
		ssaoPass.lumInfluence = 0.5;//曝光强度 0-1  0最弱
		ssaoPass.uniforms.cameraFar.value = 300;
		ssaoPass.uniforms.cameraNear.value = 30;
		ssaoPass.enabled = ( localStorage.getItem( 'Rainier_useHighContrast' ) === 'true' );
		return ssaoPass;

	}

	/**
	 * 高光效果
	 * @param  {[string]} width  [渲染场景的宽度]
	 * @param  {[string]} height [渲染场景的高度]
	 * @return bloomPass 高光效果通道
	 */
	function bloomPass( width , height ){

		var bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( width , height ));//, 1.5, 0.4, 0.85 );//1.0, 9, 0.5, 512);
		bloomPass.enabled = ( localStorage.getItem('Rainier_useReflective') === 'true' );

		if(localStorage.getItem( 'Rainier_useHighContrast') === 'true' ){

			bloomPass.strength = 1;//高光强度

		}else{

			bloomPass.strength = 0.3;//高光强度

		}

		bloomPass.threshold = 0.9; //阈值，这个值越低可产生高光物体的颜色越不接近白色，越大(大于等于1失效)产生高光的物体需要的颜色值越接近白色
		bloomPass.radius = 0.4; //高光半径
		return bloomPass;

	}

	/**
	 * FXAA抗锯齿
	 * @param  {[string]} width  [渲染场景的宽度]
	 * @param  {[string]} height [渲染场景的高度]
	 * @return effectFXAA FXAA抗锯齿通道
	 */
	function effectFXAA( width , height ){

		var effectFXAA = new THREE.ShaderPass( THREE.FXAAShader );
		effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width , 1 / height );//获取当前显示区域，并进行抗锯齿处理
		effectFXAA.enabled = ( localStorage.getItem( 'Rainier_useFXAA' ) === 'true' );
		return effectFXAA;

	}

	/**
	 * 聚焦效果
	 * @param  {[string]} userOffset [用户通过滑块设置的参数，用于调控聚焦范围]
	 * @return effectVignette 聚焦通道
	 */
	function effectVignette( userOffset ){

		var shaderVignette = THREE.VignetteShader;
		var effectVignette = new THREE.ShaderPass( shaderVignette );
		effectVignette.uniforms[ "offset" ].value = userOffset;//聚焦范围值
		effectVignette.uniforms[ "darkness" ].value = 1.6;//同等聚焦范围下，四周的黑化程度
		effectVignette.enabled = ( localStorage.getItem( 'Rainier_useFocusing' ) === 'true' );
		return effectVignette;

	}

	/**
	 * 提高对比度
	 * @return effectBleach 对比度通道
	 */
	function effectBleach(){

		var shaderBleach = THREE.BleachBypassShader;
		var effectBleach = new THREE.ShaderPass( shaderBleach );
		effectBleach.uniforms[ "opacity" ].value = 0.95;//对比强度，值越低效果越差
		effectBleach.renderToScreen = true; //将这个效果渲染至场景
		return effectBleach;

	}

	function effectBloom(){

		var effectBloom = new THREE.BloomPass( 0.3 );
		return effectBloom;

	}

	/**
	 * 电影效果渲染
	 * @return effectFilm 电影渲染通道
	 */
	function effectFilm(){

		var effectFilm = new THREE.FilmPass( 0.08, 0, 2048, false );//( 增加场景亮度 , 电影横条宽度 , 从上至下的横条数量 , 是否开启黑白效果 )
		return effectFilm;

	}

	/**
	 * 初始化location参数
	 * @return undefined
	 */
	function initlocation(){
		
		if( localStorage.getItem( 'Rainier_useShaderPass' ) === null ){
			localStorage.setItem( 'Rainier_useShaderPass' , 'true' );
		}else{
			setting.useShaderPass = localStorage.getItem( 'Rainier_useShaderPass' );
			self.isUse = ( localStorage.getItem( 'Rainier_useShaderPass' ) === 'true' );
		}

		if( localStorage.getItem( 'Rainier_useHighContrast' ) === null ){
			localStorage.setItem( 'Rainier_useHighContrast' , 'false' );
		}else{
			setting.useHighContrast = localStorage.getItem( 'Rainier_useHighContrast' );
		}

		if( localStorage.getItem( 'Rainier_useReflective' ) === null ){
			localStorage.setItem( 'Rainier_useReflective' , 'false' );
		}else{
			setting.useReflective = localStorage.getItem( 'Rainier_useReflective' );
		}

		if( localStorage.getItem( 'Rainier_useFXAA' ) === null ){
			localStorage.setItem( 'Rainier_useFXAA' , 'false' );
		}else{
			setting.useFXAA = localStorage.getItem( 'Rainier_useFXAA' );
		}

		if( localStorage.getItem( 'Rainier_useShadow' ) === null ){
			localStorage.setItem( 'Rainier_useShadow' , 'false' );
		}else{
			setting.useShadow = localStorage.getItem( 'Rainier_useShadow' );
		}

		if( localStorage.getItem( 'Rainier_useFocusing' ) === null ){
			localStorage.setItem( 'Rainier_useFocusing' , 'false' );
		}else{
			setting.useFocusing = localStorage.getItem( 'Rainier_useFocusing' );
		}

		if( localStorage.getItem( 'Rainier_userOffset' ) === null ){
			localStorage.setItem( 'Rainier_userOffset' , '0.95' );
		}else{
			setting.userOffset = localStorage.getItem( 'Rainier_userOffset' );
		}

	}

	return {
		init : function( renderer , scene , camera , width , height ){

			self = this;

			initlocation();

			this.Composer = Composer( renderer );
			this.renderPass = renderPass( scene , camera );
			this.outlinePass = outlinePass( scene , camera , width , height );
			this.ssaoPass = ssaoPass( scene , camera , width , height );
			this.bloomPass = bloomPass( width , height );
			this.effectFXAA = effectFXAA( width , height );
			this.effectVignette = effectVignette( localStorage.getItem( 'Rainier_userOffset' ) );
			this.effectBloom = effectBloom();
			this.effectFilm = effectFilm();
			this.effectBleach = effectBleach();

			this.Composer.addPass( this.renderPass );
			this.Composer.addPass( this.outlinePass );
			this.Composer.addPass( this.ssaoPass );
			this.Composer.addPass( this.bloomPass );
			this.Composer.addPass( this.effectFXAA );	
			this.Composer.addPass( this.effectVignette );
			this.Composer.addPass( this.effectBloom );
			this.Composer.addPass( this.effectFilm );
			this.Composer.addPass( this.effectBleach );

			this.isInit = true;
		},

		onResize : function( scene , camera , width , height ){

			this.effectFXAA.uniforms[ 'resolution' ].value.set( 1 / width , 1 / height );
			this.ssaoPass.setSize( width * 2 , height * 2 );
			this.bloomPass = new THREE.UnrealBloomPass( new THREE.Vector2( width , height ))
			this.Composer.setSize( width , height );
			this.Composer.reset();

		},

		isUse : true ,

		isInit : false ,

		Composer : '' ,

		renderPass : '' ,

		outlinePass : '' ,

		ssaoPass : '' ,

		bloomPass : '' ,

		effectFXAA : '' ,

		effectVignette : '' ,

		effectBloom : '' ,

		effectFilm : '' ,

		effectBleach : '' 

	}	
})();