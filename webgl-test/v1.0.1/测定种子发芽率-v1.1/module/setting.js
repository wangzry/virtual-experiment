/***
 *  设置模块
 *  作者：Badmaster
 *  创建时间：2018-1-16 10:24:06
 *  修改人：Badmaster
 *  修改时间：2018-3-1 10:52:13
 *  修改描述：添加新的接口：custFn对象，可以添加obFn以及appFn两种方法，obFn为右上角按钮点击触发，appFn为点击app场景时触发
 *  修改人：Badmaster
 *  修改时间：2018-3-5 10:55:09
 *  修改描述：新增重置方法setting.reset，在接口内新增可调用事件resetFn
 *  版本：v0.1.1
 *  描述：初始化设置模块
 *  使用方法：直接 setting.init( { ... } )
 *  		  其中必要参数为 app(就是app)  light(使用的可产生阴影的光源)
 *  		  可选参数为 needAbsorve : 是否需要右上角观察按钮（true 需要 ， false 不需要  默认为true）,
 *  		  			 needShadow : 设置中是否需要阴影效果（true 需要 ， false 不需要  默认为true）,
 *  		      		 needHighContrast : 设置中是否需要高对比度效果（true 需要 ， false 不需要  默认为true  不过模型自身带有动画的场景需要设置为false）
 *  返回值：init()
 ***/

var setting = (function (){
	
	/**
	 * 初始化一些内部调用的参数
	 * 主要有渲染器（renderer），渲染场景的div，场景内光源以及设置列表下的一系列选项
	 */
	var renderer , app , light ;
	var self ;

	var usehighContrast = '<ol class="highContrast">'+
				    		'<span class="op_label">高对比度模式：</span>'+
				    		'<div class="options" content="highContrast">'+
				    			'<span class="open active">开启</span>'+
				    			'<span class="closeBtn">关闭</span>'+
				    		'</div>'+
				    	'</ol>';

	var unusehighContrast = '<ol class="highContrast">'+
					    		'<span class="op_label">高对比度模式：</span>'+
					    		'<div class="options" content="highContrast">'+
					    			'<span class="open">开启</span>'+
					    			'<span class="closeBtn  active">关闭</span>'+
					    		'</div>'+
					    	'</ol>';

    var useReflective = '<ol class="reflective">'+
				    		'<span class="op_label">高光效果：</span>'+
				    		'<div class="options" content="reflective">'+
				    			'<span class="open active">开启</span>'+
				    			'<span class="closeBtn">关闭</span>'+
				    		'</div>'+
				    	'</ol>';

	var unuseReflective = '<ol class="reflective">'+
				    		'<span class="op_label">高光效果：</span>'+
				    		'<div class="options" content="reflective">'+
				    			'<span class="open">开启</span>'+
				    			'<span class="closeBtn active">关闭</span>'+
				    		'</div>'+
				    	'</ol>';

	var useFXAA = '<ol class="FXAA">'+
			    		'<span class="op_label">抗锯齿：</span>'+
			    		'<div class="options" content="FXAA">'+
			    			'<span class="open active">开启</span>'+
			    			'<span class="closeBtn">关闭</span>'+
			    		'</div>'+
			    	'</ol>';

	var unuseFXAA = '<ol class="FXAA">'+
			    		'<span class="op_label">抗锯齿：</span>'+
			    		'<div class="options" content="FXAA">'+
			    			'<span class="open">开启</span>'+
			    			'<span class="closeBtn active">关闭</span>'+
			    		'</div>'+
			    	'</ol>';

	var useShadow = '<ol class="shadow">'+
			    		'<span class="op_label">阴影效果：</span>'+
			    		'<div class="options" content="shadow">'+
			    			'<span class="open active">开启</span>'+
			    			'<span class="closeBtn">关闭</span>'+
			    		'</div>'+
			    	'</ol>';

	var unuseShadow = '<ol class="shadow">'+
				    		'<span class="op_label">阴影效果：</span>'+
				    		'<div class="options" content="shadow">'+
				    			'<span class="open">开启</span>'+
				    			'<span class="closeBtn active">关闭</span>'+
				    		'</div>'+
				    	'</ol>';

	var useFocusing = '<ol class="focusing">'+
				    		'<span class="op_label">聚焦效果：</span>'+
				    		'<div class="options" content="focusing">'+
				    			'<span class="open active">开启</span>'+
				    			'<span class="closeBtn">关闭</span>'+
				    		'</div>'+
				    	'</ol>';

	var unuseFocusing = '<ol class="focusing">'+
				    		'<span class="op_label">聚焦效果：</span>'+
				    		'<div class="options" content="focusing">'+
				    			'<span class="open">开启</span>'+
				    			'<span class="closeBtn active">关闭</span>'+
				    		'</div>'+
				    	'</ol>';

	var useSpeedMode = '<ol class="speedMode">'+
				    		'<span class="op_label">极速模式：</span>'+
				    		'<div class="options" content="speedMode">'+
				    			'<span class="open active" id="speedOpen">开启</span>'+
				    			'<span class="closeBtn" id="speedClose">关闭</span>'+
				    		'</div>'+
				    	'</ol>';

	var unuseSpeedMode = '<ol class="speedMode">'+
				    		'<span class="op_label">极速模式：</span>'+
				    		'<div class="options" content="speedMode">'+
				    			'<span class="open" id="speedOpen">开启</span>'+
				    			'<span class="closeBtn active" id="speedClose">关闭</span>'+
				    		'</div>'+
				    	'</ol>';

	var topTitle = '<div class="topTip" id="topTip" style="top:-40px">'+
					    '<div class="t_text">极速模式提供更流畅的界面，是否开启或关闭极速模式？</div>'+
					    '<span class="t_no">'+
					    	'否'+
					    '</span>'+
					    '<span class="t_yes">'+
					    	'是'+
					    '</span>'+
					'</div>';

	var errorTip = '<div class="errorTip" id="errorTip" style="top:-40px">'+
					    '<div class="t_text">观察模块暂不支持该功能的修改！</div>'+
					'</div>';

	var absorveBtn = '<div class="observeBtn" id="observeBtn"></div>';

	/**
	 * 初始化设置UI
	 * @param  {[Dom]}  app     [需要添加的div或者其他对象]
	 * @param  {Boolean} isFrist [用于判断是不是第一次执行，是就初始化一次，不是将执行重设方法]
	 * @return undefined
	 */
	function initUI( app , isFrist ){

		var focuSlider = '<ol class="focusing focuSlider" id="focuSlider">'+
				    		'<input type=range min="0" max="1.2" step="0.01" value="'+localStorage.getItem('Rainier_userOffset')+'"/>'+
				    	'</ol>';

		var internalHTML = '';
		var flag;

		isFrist === undefined ? flag = true : flag = isFrist ;

		if( self.useShaderPass === 'true' ){

			//高对比度模式，带动画的实验都无法使用高对比度模式
			if( self.needHighContrast ){
				self.useHighContrast === 'true' ? internalHTML += usehighContrast : internalHTML += unusehighContrast;
			}else{

				postProcessing.ssaoPass.enabled = false;

			}

			//高光效果
			self.useReflective === 'true' ? internalHTML += useReflective : internalHTML += unuseReflective;

			//移动端不需要抗锯齿效果
			if( isPc ){
				self.useFXAA === 'true' ? internalHTML += useFXAA : internalHTML += unuseFXAA;
			}

			//某些实验不需要阴影选项
			if( self.needShadow ){
				self.useShadow === 'true' ? internalHTML += useShadow : internalHTML += unuseShadow;
			}

			//聚焦效果
			self.useFocusing === 'true' ? internalHTML += useFocusing : internalHTML += unuseFocusing;

			internalHTML += focuSlider;

			//极速模式
			internalHTML += unuseSpeedMode;

		}else{

			//某些实验不需要阴影选项
			if( self.needShadow ){
				self.useShadow === 'true' ? internalHTML += useShadow : internalHTML += unuseShadow;
			}

			//极速模式
			internalHTML += useSpeedMode;

		}

		if( flag ){

			internalHTML = '<div id="settingBtn" class="settingBtn"></div>'+
						'<div id="setting-div" class="setting-div">'+
							'<div class="s_nav">设置</div>'+
							'<ul id="setting_list">'+ 
								internalHTML +
							'</ul>'+
						    '<div id="exitBtn" class="exitBtn"></div>'+
						'</div>'+ topTitle + errorTip;
		
			if( self.needAbsorve )internalHTML += absorveBtn;

			if( !app )throw new Error('需要传入app才可以使用!');

			app.append( internalHTML );

		}else{

			var settingList = document.getElementById('setting_list');
			var settingDiv = document.getElementById('setting-div');

			if( !settingList )throw new Error('请检查参数！settingList 未找到');

			settingList.remove();

			settingDiv.innerHTML += '<ul id="setting_list">' + internalHTML + '</ul>';
		}

	}

	/**
	 * 初始化设置事件
	 * @param  {[THREE.Light]} light [场景内可以产生阴影的光源，默认获取exp.light]
	 * @return undefined
	 */
	function initEvent( light ){

		var isEvent = false;//用于判断事件是否有事件正在执行
		var settingBtn = document.getElementById('settingBtn');//设置按钮
		var exitBtn = document.getElementById('exitBtn');//设置退出按钮
		var settingDiv = document.getElementById('setting-div');//设置面板
		var options = document.getElementsByClassName('options');//设置选项
		var topTip = document.getElementById('topTip');//顶部提示
		var errorTip = document.getElementById('errorTip');//顶部错误提示,预留
		var speedOpen = document.getElementById('speedOpen');//极速模式开按钮
		var speedClose = document.getElementById('speedClose');//极速模式关按钮
		var focuSlider = document.getElementById('focuSlider');//聚焦效果滑动条
		var observeBtn = document.getElementById('observeBtn');//观察模式按钮
		var c_closeBtn = document.getElementById('c_closeBtn');//左侧按钮列表关闭按钮
		var changeBtn = document.getElementById('changeBtn');//左侧按钮列表面板
		var openChangeBtn = document.getElementById('openChangeBtn');//左侧按钮列表打开按钮
		var ob_closeOpen = document.getElementById('ob_closeOpen'); //观察模块侧边栏关闭按钮
		var singleBtn;//下方事件按钮
		var layerTip; //顶部layerUI
		var obBtns; //观察模块侧边栏
		var c_closeArr;//观察模块侧边栏关闭按钮
		var c_openArr;//观察模块侧边栏打开按钮
		var obShow; //观察模块外部方块
		var ob_description; //观察描述
		var mujing;//目镜标签
		var toolbarRb,toolbarLb;//显微镜观察模块左右按钮

		if( focuSlider ){
			//滑块实时触发
			focuSlider.children[0].oninput = function(){

				var value = focuSlider.children[0].value;
				postProcessing.effectVignette.uniforms[ "offset" ].value = value;
				localStorage.setItem( 'Rainier_userOffset' , value );
				self.userOffset = value;

			}

			//根据是否使用了聚焦效果修改样式
			if( localStorage.getItem('Rainier_useFocusing') === 'true' ){

				focuSlider.style.height = '40px';
				focuSlider.style.padding = '5px 0 5px 10px';
				focuSlider.style.borderBottom = '1px solid #333';

			}else{

				focuSlider.style.height = '0px';
				focuSlider.style.padding = '0px';
				focuSlider.style.borderBottom = '0px';

			}
		}
		
		var len = options.length;//获取所有选项的长度

		for( var i = 0 ; i < len ; i++ ){//循环遍历所有的选项，并为选项绑定事件

			options[i].onclick = function( ev ){

				var btSelf = this;
				var nameParent;
				var content = btSelf.getAttribute('content');//获取content自定义标签下的值

				var e = ev || window.event;
				e.path ? nameParent = e.path[0] : nameParent = e.target; //获取点击对象

				topTip.style.top = '-40px';

				switch( content ){

					//高对比度通道
					case 'highContrast':

						var className = nameParent.className; //获取点击对象的className
						var nameArr = className.split(' '); //生成点击对象的className数组
						var nameLen = nameArr.length; //获取数组长度

						if( nameArr[0] === 'open' && nameLen === 1 ){ //开启按钮，当长度为1的时候表示未启用

							postProcessing.ssaoPass.enabled = true; //使用高对比通道
							localStorage.setItem( 'Rainier_useHighContrast' , postProcessing.ssaoPass.enabled ); //重新设置localStorage下高对比通道的参数
							self.useHighContrast = 'true';

							postProcessing.effectBloom = new THREE.BloomPass( 0.4 ); //重置一下bloom通道，略微提高opacity的值
							nameParent.className += ' active'; //启用并修改样式
							btSelf.children[1].className = 'closeBtn'; //重置关闭按钮的className

							if( postProcessing.bloomPass.enabled ){
								postProcessing.bloomPass.strength = 1; //如果高光效果启用了，提高高光效果
							}

						}
						if( nameArr[0] === 'closeBtn' && nameLen === 1 ){ //关闭按钮，当长度为1的时候表示未启用

							postProcessing.ssaoPass.enabled = false; //关闭高渲染
							localStorage.setItem( 'Rainier_useHighContrast' , postProcessing.ssaoPass.enabled ); //重置数值
							self.useHighContrast = 'false';

							postProcessing.effectBloom = new THREE.BloomPass( 0.3 ); //重置bloompass，略微降低opacity
							nameParent.className += ' active'; //关闭并修改样式
							btSelf.children[0].className = 'open'; //修改开启按钮的className

							if( postProcessing.bloomPass.enabled ){
								postProcessing.bloomPass.strength = 0.3; //若高光效果开启，降低高光效果
							}

						}
						break;

					//高光效果	
					case 'reflective':

						var className = nameParent.className; //获取点击对象
						var nameArr = className.split(' '); //点击对象className数组
						var nameLen = nameArr.length; //数组长度

						if( nameArr[0] === 'open' && nameLen === 1 ){

							postProcessing.bloomPass.enabled = true; //使用高光效果
							localStorage.setItem( 'Rainier_useReflective' , postProcessing.bloomPass.enabled ); //重置缓存内高光效果数值
							self.useReflective = 'true';

							nameParent.className += ' active'; //修改开启按钮的className
							btSelf.children[1].className = 'closeBtn'; //修改关闭按钮的className

							if( postProcessing.ssaoPass.enabled ){ 
								postProcessing.bloomPass.strength = 1; //如果高对比度效果有使用，提高高光效果
							}else{
								postProcessing.bloomPass.strength = 0.3; //如果高对比度模式未使用降低高光效果
							}

						}

						if( nameArr[0] === 'closeBtn' && nameLen === 1 ){

							postProcessing.bloomPass.enabled = false; //关闭渲染
							localStorage.setItem( 'Rainier_useReflective' , postProcessing.bloomPass.enabled ); //重置缓存
							self.useReflective = 'false';

							nameParent.className += ' active';
							btSelf.children[0].className = 'open';

							if( postProcessing.ssaoPass.enabled ){
								postProcessing.bloomPass.strength = 1;
							}else{
								postProcessing.bloomPass.strength = 0.3;
							}

						}
						break;

					//FXAA抗锯齿
					case 'FXAA':

						var className = nameParent.className;
						var nameArr = className.split(' ');
						var nameLen = nameArr.length;

						if( nameArr[0] === 'open' && nameLen === 1 ){

							postProcessing.effectFXAA.enabled = true; //启用抗锯齿
							localStorage.setItem( 'Rainier_useFXAA' , postProcessing.effectFXAA.enabled );
							self.useFXAA = 'true';

							nameParent.className += ' active';
							btSelf.children[1].className = 'closeBtn';

						}

						if( nameArr[0] === 'closeBtn' && nameLen === 1 ){

							postProcessing.effectFXAA.enabled = false; //关闭抗锯齿
							localStorage.setItem( 'Rainier_useFXAA' , postProcessing.effectFXAA.enabled );
							self.useFXAA = 'false';

							nameParent.className += ' active';
							btSelf.children[0].className = 'open';

						}
						break;

					//阴影
					case 'shadow':

						var className = nameParent.className;
						var nameArr = className.split(' ');
						var nameLen = nameArr.length;

						if( nameArr[0] === 'open' && nameLen === 1 ){

							if( light ){

								light.castShadow = true; //通过修改光是否产生阴影对场景内的对象进行控制
								localStorage.setItem( 'Rainier_useShadow' , light.castShadow );
								self.useShadow = 'true';

							}

							nameParent.className += ' active';
							btSelf.children[1].className = 'closeBtn';

						}

						if( nameArr[0] === 'closeBtn' && nameArr[1] === undefined ){

							if( light ){

								light.castShadow = false;
								localStorage.setItem( 'Rainier_useShadow' , light.castShadow );
								self.useShadow = 'false';

							}

							nameParent.className += ' active';
							btSelf.children[0].className = 'open';

						}
						break;

					//极速模式
					case 'speedMode':

						var className = nameParent.className;
						var nameArr = className.split(' ');
						var nameLen = nameArr.length;

						if( nameArr[0] === 'open' && nameLen === 1 ){
							topTip.style.top = 0;
						}
						if( nameArr[0] === 'closeBtn' && nameLen === 1 ){
							topTip.style.top = 0;
						}
						break;

					//聚焦效果
					case 'focusing':

						var className = nameParent.className;
						var nameArr = className.split(' ');
						var nameLen = nameArr.length;

						if( nameArr[0] === 'open' && nameLen === 1 ){

							postProcessing.effectVignette.enabled = true;
							localStorage.setItem( 'Rainier_useFocusing' , postProcessing.effectVignette.enabled );
							self.useFocusing = 'true';

							//开启，显示下方控件
							focuSlider.style.height = '40px';
							focuSlider.style.padding = '5px 0 5px 10px';
							focuSlider.style.borderBottom = '1px solid #333';
							nameParent.className += ' active';
							btSelf.children[1].className = 'closeBtn';

						}
						if( nameArr[0] === 'closeBtn' && nameLen === 1 ){

							postProcessing.effectVignette.enabled = false;
							localStorage.setItem( 'Rainier_useFocusing' , postProcessing.effectVignette.enabled );
							self.useFocusing = 'false';

							//关闭，隐藏下方控件
							focuSlider.style.height = '0px';
							focuSlider.style.padding = '0';
							focuSlider.style.borderBottom = '0px';
							nameParent.className += ' active';
							btSelf.children[0].className = 'open';

						}
						break;						
				}
			}
		}

		//右上角观察按钮，如果存在，为按钮添加样式以及点击事件
		//右上角观察按钮效果为隐藏渲染界面的大多数按钮，提高可观察范围
		if( observeBtn ){

			observeBtn.isOpen = false;

			observeBtn.innerHTML = '';
			var imgSetting = new Image();
			imgSetting.src = rootUrl +'/image/setting/observe.png';
			imgSetting.width = '36';
			imgSetting.height = '36';
			imgSetting.style.outline = 'none';
			observeBtn.appendChild(imgSetting);

			observeBtn.onclick = function( ev ){

				obBtns = document.getElementById( 'observeBtns' ); //观察模块下，左侧按钮列表
				obShow = document.getElementById( 'obShow-model' ); //观察模块在主界面的图片按钮
				ob_description = document.getElementById( 'ob_description' ); //观察模块下的描述
				mujing = document.getElementById( 'enlargeFrame' ); //显微镜左上角目镜图标

				singleBtn = document.getElementsByClassName( 'singleBtn' )[0]; //正下方按钮
				layerTip = document.getElementsByClassName( 'webgl-tip-css' )[0]; //layerTip
				c_closeArr = document.getElementsByClassName( 'c_close' ); //观察模块下，左侧按钮列表的缩放按钮样式：关闭
				c_openArr = document.getElementsByClassName( 'c_open' ); //观察模块下，左侧按钮列表的缩放按钮样式：打开
				toolbarLb = document.getElementsByClassName( 'toolbar-box lb' )[0]; //显微镜观察模块的左侧按钮组
				toolbarRb = document.getElementsByClassName( 'toolbar-box rb' )[0]; //显微镜观察模块的右侧按钮组

				var e = ev || window.event;
				e.stopPropagation();

				if( !observeBtn.isOpen ){ //判断观察模式是否开启，默认为关闭状态

					observeBtn.isOpen = true; //修改为打开模式

					//主界面左侧按钮组，根据是否为PC设备判断隐藏样式
					if( isPc ){
						if( changeBtn )changeBtn.style.bottom = -changeBtn.offsetHeight + 'px';
					}else{
						if( changeBtn )changeBtn.style.height = "0";
					}

					//替换观察按钮的样式
					observeBtn.innerHTML = '';
					var imgSetting = new Image();
					imgSetting.src = rootUrl +'/image/setting/observeClose.png';
					imgSetting.width = '36';
					imgSetting.height = '36';
					observeBtn.appendChild(imgSetting);

					if( openChangeBtn )openChangeBtn.style.bottom = "-50px"; //修改主界面非PC设备，左侧按钮列表缩放按钮的样式
					if( singleBtn )singleBtn.style.bottom = '-40px'; //修改正下方按钮的样式
					if( layerTip && !observe.isUse ){

						layerTip.style.display = 'none'; //如果layerTip存在，且观察模块未使用，隐藏

					}else{

						if( layerTip )layerTip.style.oldDis = 'none'; //否则，先判断layerTip是否存在，存在继续进行

					}
					//观察模块左侧按钮列表
					if( obBtns ){

						obBtns.style.left = '-200px'; //隐藏
						obBtns.isOpen = false; //同时按钮列表的打开状态设为未打开(false)
						if( c_closeArr.length !== 0 ){ //同时改变按钮样式

							c_closeArr[0].className = 'c_open';
							c_closeArr[0].className = 'c_open';

						}

					}
					if( obShow )obShow.style.left = '-102px'; //观察模块入口图片按钮隐藏
					if( ob_description && observe.isUse ){ //如果描述框存在，且观察模块为使用状态，隐藏描述

						var top = ob_description.offsetHeight;
						ob_description.style.top = -top + 'px';

					}
					if( mujing )mujing.style.left = - mujing.offsetWidth + 'px'; //隐藏显微镜目镜按钮
					if( toolbarLb && toolbarRb ){ //如果显微镜观察模块下左右按钮都存在，隐藏按钮

						toolbarLb.style.left = - toolbarLb.offsetWidth + 'px';
						toolbarRb.style.right = - toolbarRb.offsetWidth + 'px';

					}
					settingBtn.style.right = "-36px";//设置按钮隐藏

				}else{

					observeBtn.isOpen = false; //改变观察按钮开启状态为未开启(false)

					//主界面左侧按钮列表，根据是否为PC设备进行隐藏
					if( isPc ){
						if( changeBtn )changeBtn.style.bottom = '10px';
					}else{
						if( changeBtn )changeBtn.style.height = "0";
					}

					//修改按钮列表的样式
					observeBtn.innerHTML = '';
					var imgSetting = new Image();
					imgSetting.src = rootUrl +'/image/setting/observe.png';
					imgSetting.width = '36';
					imgSetting.height = '36';
					observeBtn.appendChild(imgSetting);

					if( openChangeBtn )openChangeBtn.style.bottom = "-25px";
					if( singleBtn )singleBtn.style.bottom = '20px';
					if( layerTip && !observe.isUse ){

						layerTip.style.display = 'block';

					}else{

						if( layerTip )layerTip.style.oldDis = 'block';

					}
					if( obShow )obShow.style.left = '10px';
					if( ob_description && observe.isUse ){

						var top = ob_description.offsetHeight;
						ob_description.style.top = '0';

					}
					if( mujing )mujing.style.left = '10px';
					if( toolbarLb && toolbarRb ){

						toolbarLb.style.left = '5px';
						toolbarRb.style.right = '5px';

					}
					settingBtn.style.right = "10px";

				}

				if(self.custFn.obFn)self.custFn.obFn( observeBtn.isOpen );

			}

			observeBtn.ontouchstart = function( ev ){ //移动端事件禁用

				var e = ev || window.event;
				e.stopPropagation();

			}

		}

		//观察模块左侧列表缩放按钮
		if( ob_closeOpen ){

			obBtns = document.getElementById( 'observeBtns' ); //观察模块下，左侧按钮列表

			ob_closeOpen.onclick = function ( ev ) {

				if( obBtns.isOpen === undefined )obBtns.isOpen = true;

				c_closeArr = document.getElementsByClassName( 'c_close' ); //关闭样式
				c_openArr = document.getElementsByClassName( 'c_open' ); //开启样式
				
				var e = ev || window.event;
				e.stopPropagation();

				if (obBtns.isOpen) { //根据左侧列表的开关状态进行判断

					obBtns.style.left = '-200px'; //当前打开状态，隐藏左侧按钮列表

					c_closeArr[0].className = 'c_open'; //修改按钮样式
					c_closeArr[0].className = 'c_open'; //修改按钮样式

					obBtns.isOpen = false; //修改左侧按钮列表的状态为未开启(false)
					
				} else {

					obBtns.style.left = '0';

					c_openArr[0].className = 'c_close';
					c_openArr[0].className = 'c_close';

					obBtns.isOpen = true;

				}

			}

			ob_closeOpen.ontouchstart = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

			}

		}

		//非PC设备的左侧按钮列表
		if( openChangeBtn ){

			//为按钮添加样式
			openChangeBtn.innerHTML = '';
			var imgSetting = new Image();
			imgSetting.src = rootUrl +'/image/setting/arrowTop.png';
			imgSetting.width = '30';
			imgSetting.height = '30';
			imgSetting.style.position = 'relative';
			imgSetting.style.top = '0';
			imgSetting.style.left = '10px';
			openChangeBtn.appendChild(imgSetting);

			//绑定点击事件
			openChangeBtn.onclick = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

				if( isEvent )return;
				isEvent = !isEvent;

				openChangeBtn.style.bottom = "-50px";

				setTimeout( function (){

					changeBtn.style.height = "100%";
					isEvent = !isEvent;

				}, 300 );

			}

			openChangeBtn.ontouchstart = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

			}

		}

		//非PC设备主界面左侧按钮列表的收缩按钮
		if( c_closeBtn ){

			//为按钮添加样式
			c_closeBtn.innerHTML = '';
			var imgSetting = new Image();
			imgSetting.src = rootUrl +'/image/setting/arrowDown.png';
			imgSetting.width = '30';
			imgSetting.height = '30';
			imgSetting.style.position = 'relative';
			imgSetting.style.top = '-10px';
			imgSetting.style.left = '63px';
			c_closeBtn.appendChild(imgSetting);

			//绑定事件
			c_closeBtn.onclick = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

				if( isEvent )return;
				isEvent = !isEvent;

				changeBtn.style.height = 0;

				setTimeout( function (){

					openChangeBtn.style.bottom = "-25px";
					isEvent = !isEvent;

				}, 300 );

			}

			c_closeBtn.ontouchstart = function( ev ){

				var e = ev || window.event;
				e.stopPropagation();

			}

		}
		
		//设置div禁用默认事件
		settingDiv.onclick = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

		}

		settingDiv.ontouchstart = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

		}

		//为设置按钮添加样式
		settingBtn.innerHTML = '';
		var imgSetting = new Image();
		imgSetting.src = rootUrl +'/image/setting/setting.png';
		imgSetting.width = '36';
		imgSetting.height = '36';
		settingBtn.appendChild(imgSetting);

		settingBtn.onclick = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

			settingDiv.style.right = '0px';

		}

		settingBtn.ontouchstart = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

		}

		//设置的退出按钮
		exitBtn.innerHTML = '';
		var imgExit = new Image();
		imgExit.src = rootUrl +'/image/setting/exit.png';
		imgExit.width = '36';
		imgExit.height = '36';
		exitBtn.appendChild(imgExit);

		exitBtn.onclick = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

			settingDiv.style.right = '-350px';
			topTip.style.top = '-40px';

		}

		exitBtn.ontouchstart = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

		}

		//上方提示条禁用默认事件
		topTip.onclick = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

		}

		topTip.ontouchstart = function( ev ){

			var e = ev || window.event;
			e.stopPropagation();

		}

		var len = topTip.children.length;

		for( var i = 0 ; i < len ; i++ ){

			topTip.children[i].onclick = function(){

				if( isEvent )return;
				isEvent = !isEvent;

				if( this.className === 't_yes' ){ //是按钮点击事件

					self.useShaderPass = !( self.useShaderPass === 'true' ) + ''; //修改渲染通道是否启用
					postProcessing.isUse = ( self.useShaderPass === 'true' ); //同时修改postProcessing模块的使用状态

					localStorage.setItem( 'Rainier_useShaderPass' , self.useShaderPass ); //重置缓存数值
					topTip.style.top = '-40px'; //隐藏顶部提示条
					if( localStorage.getItem( 'Rainier_useShaderPass' ) === 'true' ){ //修改renderer的自动清除

						renderer.autoClear = false;
						
					}else{

						renderer.autoClear = true;
					
					}

					settingDiv.style.right = '-350px'; //隐藏右侧设置列表

					initUI( app , false ); //重置设置UI

					initEvent( light ); //重设UI事件

					isEvent = !isEvent;

				}

				if( this.className === 't_no' ){ //否按钮

					topTip.style.top = '-40px'; //隐藏顶部提示条
					isEvent = !isEvent;

				}

			}

			topTip.children[i].ontouchstart = function(ev){
				var e = ev || window.event;
				e.stopPropagation();
			}

		}

		//为app绑定mousedown事件，鼠标按下可隐藏部分可收缩的列表
		$( document ).on( "click" , ".app".onmousedown = function(){

			if( changeBtn && !isPc )changeBtn.style.height = 0;
			if( openChangeBtn && !observeBtn.isOpen )openChangeBtn.style.bottom = "-25px";

            topTip.style.top = '-40px';
            settingDiv.style.right = '-350px';

            if(self.custFn.appFn)self.custFn.appFn();

        });

		//为app绑定ontouchstart事件，触屏事件开始可隐藏部分可收缩的列表
        $( document ).on( "touchstart" , ".app".ontouchstart = function(){

        	obBtns = document.getElementById( 'observeBtns' );
        	c_closeArr = document.getElementsByClassName( 'c_close' );

			if( changeBtn && !isPc )changeBtn.style.height = 0;
			if( openChangeBtn && !observeBtn.isOpen )openChangeBtn.style.bottom = "-25px";
			if( obBtns ){

				obBtns.style.left = '-200px';
				obBtns.isOpen = false;
				if( c_closeArr.length !== 0 ){

					c_closeArr[0].className = 'c_open';
					c_closeArr[0].className = 'c_open';

				}

			}
            topTip.style.top = '-40px';
            settingDiv.style.right = '-350px';

            if(self.custFn.appFn)self.custFn.appFn();

        });
	}

	/**
	 * 重置方法
	 * @return undefined
	 */
	function reSet(){
		
		var observeBtn = document.getElementById('observeBtn');//观察模式按钮
		var changeBtn = document.getElementById('changeBtn');//左侧按钮列表面板
		var openChangeBtn = document.getElementById('openChangeBtn');//左侧按钮列表打开按钮
		var singleBtn = document.getElementsByClassName( 'singleBtn' )[0]; //正下方按钮
		var layerTip = document.getElementsByClassName( 'webgl-tip-css' )[0]; //layerTip
		var obShow = document.getElementById( 'obShow-model' ); //观察模块在主界面的图片按钮
		var ob_description = document.getElementById( 'ob_description' ); //观察模块下的描述
		var mujing = document.getElementById( 'enlargeFrame' ); //显微镜左上角目镜图标
		var settingBtn = document.getElementById('settingBtn');//设置按钮
		var toolbarLb = document.getElementsByClassName( 'toolbar-box lb' )[0]; //显微镜观察模块的左侧按钮组
		var toolbarRb = document.getElementsByClassName( 'toolbar-box rb' )[0]; //显微镜观察模块的右侧按钮组

		observeBtn.isOpen = false; //改变观察按钮开启状态为未开启(false)

		//主界面左侧按钮列表，根据是否为PC设备进行隐藏
		if( isPc ){
			if( changeBtn )changeBtn.style.bottom = '10px';
		}else{
			if( changeBtn )changeBtn.style.height = "0";
		}

		//修改按钮列表的样式
		observeBtn.innerHTML = '';
		var imgSetting = new Image();
		imgSetting.src = rootUrl +'/image/setting/observe.png';
		imgSetting.width = '36';
		imgSetting.height = '36';
		observeBtn.appendChild(imgSetting);

		if( openChangeBtn )openChangeBtn.style.bottom = "-25px";
		if( singleBtn )singleBtn.style.bottom = '20px';
		if( layerTip && !observe.isUse ){

			layerTip.style.display = 'block';

		}else{

			if( layerTip )layerTip.style.oldDis = 'block';

		}
		if( obShow )obShow.style.left = '10px';
		if( ob_description && observe.isUse ){

			var top = ob_description.offsetHeight;
			ob_description.style.top = '0';

		}
		if( mujing )mujing.style.left = '10px';
		if( toolbarLb && toolbarRb ){

			toolbarLb.style.left = '5px';
			toolbarRb.style.right = '5px';

		}
		settingBtn.style.right = "10px";

		if( self.custFn.resetFn )self.custFn.resetFn();

	}

	return {
		init : function( arguments ){ 
			self = this;

			if( arguments.needAbsorve !== undefined )this.needAbsorve = arguments.needAbsorve;
			if( arguments.needShadow !== undefined )this.needShadow = arguments.needShadow;
			if( arguments.needHighContrast !== undefined )this.needHighContrast = arguments.needHighContrast;
			if( arguments.app !== undefined )app = arguments.app;
			if( arguments.light !== undefined )light = arguments.light;
			if( arguments.renderer !== undefined )renderer = arguments.renderer;

			initUI( app );

			initEvent( light );
		},

		reset : reSet ,

		custFn : {} ,

		useShaderPass : 'true',

		useHighContrast : 'false',

		useReflective : 'false',

		useFXAA : 'false',

		useShadow : 'false',

		useFocusing : 'false',

		userOffset : '0.95',

		needAbsorve : true,

		needShadow : true,

		needHighContrast : true

	}
})();