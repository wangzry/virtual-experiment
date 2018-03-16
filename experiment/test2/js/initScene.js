function RainierWebGL(appId) {
  this.app = $(appId); //webgl场景的容器，封装成jQuery对象

  this.scene; //场景
  this.camera; //相机
  this.renderer; //渲染器
  this.controls; //相机控制器

  this.isRender = true;//实验场景与观察场景的切换
  this.areaWidth = this.app.width(); //webgl展示区域宽度
  this.areaHeight = this.app.height(); //webgl展示区域高度
  this.expScene = new THREE.Group(); //实验场景模型的Group
  this.manager = new THREE.LoadingManager(); //监听资源loading过程的对象
  this.objLoader = new THREE.OBJLoader(this.manager); //OBJ格式加载
  this.daeLoader = new THREE.ColladaLoader(this.manager); //dae格式加载
  this.imgLoader = new THREE.TextureLoader(this.manager); //image加载



  this.stateParams = {}; //每个实验中，需要用到的全局的参数

  this.model = {}; //自由视角下，交互模型的对象，每个属性都是模型的object（group类型或者object3D类型）
  this.modelArr = [];//实验中的模型集合
  this.moveModelArr = []; //自由视角下，检测交互模型的数组，每需要检测一个模型，将其object push到数组中
  this.triggerArea = {}; //自由视角下，交互区域的集合
  this.triggerAreaArr = []; //自由视角下，交互区域的数组
  
  this.staticViewModel = {}; //固定视角下，交互模型的对象，每个属性都是模型的object（group类型或者object3D类型）
  this.staticViewModelArr = []; //固定视角下，检测交互模型的数组，每需要检测一个模型，将其object push到数组中
  this.isStaticView = false; //判断当前是否是固定视角

  this.operatePlane = new THREE.Plane(); //自由视角，拖动模型时，与射线垂直的拖动平面
  this.raycaster = new THREE.Raycaster(); //射线对象
  this.mouse = new THREE.Vector2(); //鼠标二位坐标
  this.offset = new THREE.Vector3(); //拖动模型的偏移矢量
  this.intersection = new THREE.Vector3(); //鼠标射线打在模型上的矢量

  
  this.INTERSECTED; //用于存储被鼠标检测的模型
  this.SELECTED; //用于存储被鼠标选中的模型
  this.c_Selected; //用于存储被鼠标选中的clone体模型
  this.INTERACTIVE; // 用于存储被鼠标检测的交互区域
  
  this.everyMeshMat = {};//用于存储模型的当前材质
  // this.cloneColor = 0xff0000; //clone体颜色
  // this.cloneOpacity = 0.4; //拖动clone体时，clone体的透明度
  this.hasMove;
  this.flag = false;
  this.firstTime = 0;
  this.lastTime = 0;
  this.mouseDown = {}; //传入鼠标按下监听事件的第二个参数，该对象的handleEvent即为事件触发执行的函数
  this.mouseMove = {}; //传入鼠标移动监听事件的第二个参数，该对象的handleEvent即为事件触发执行的函数
  this.mouseUp = {}; //传入鼠标松开监听事件的第二个参数，该对象的handleEvent即为事件触发执行的函数
  this.envMap = null; //环境贴图
  this.glassMaterial; //玻璃材质
  this.structureScene = new THREE.Group(); //观察模型结构场景的scene
  this.animationScene = new THREE.Group(); //观察模型动画场景的scene
  this.isStructureScene = true; //判断当前是否是观察模型结构场景
}

RainierWebGL.prototype = {
  constructor: RainierWebGL,

  //在exp_source.js中需要调用的方法，初始化3D场景
  init: function() {
    var scope = this;

    //初始化渲染器this.initRenderer();
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,//透明度
      antialias: true,//抗锯齿
      //...
    });
    this.renderer.setSize(this.areaWidth, this.areaHeight);//尺寸大小
    // this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.setClearColor(0x000000, 1);//背景颜色
    this.renderer.setPixelRatio( window.devicePixelRatio );//设备像素比
    this.app.append(this.renderer.domElement);

    //初始化场景this.initScene();
    this.scene = new THREE.Scene();
    this.scene.add(this.expScene);//添加实验模型

    //初始化相机this.initCamera();
    this.camera = new THREE.PerspectiveCamera(45, this.areaWidth / this.areaHeight, 1, 5000);
    this.camera.position.set(0, 50, 100);

    //初始化相机控制器this.initControls();
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    //remove when using animation loop
    // this.controls.addEventListener("change", function() {
    //   scope.render();
    // });

    //初始化灯光this.initLight();
    var ambient = new THREE.AmbientLight(0xffffff, 0.58);
    this.scene.add(ambient);
    var spot = new THREE.SpotLight(0xffffff, 0.8);
    spot.position.set(-40, 130, 100);
    this.scene.add(spot);

    //定义Load全部加载完成后的回调
    this.manager.onLoad = function() {
        console.log("Loading complete!");
        $('body').addClass('loaded');
        if (scope.onLoad !== undefined) {
          scope.onLoad();//定义场景加载完成后的回调
        }
    };
    this.manager.onProgress = function (item, loaded, total) {
        var percentComplete = Math.round(loaded/total*100, 2);
        // console.log(percentComplete + "%");
        $("#loading span").html(percentComplete + "%");
    };

    //鼠标监听事件，传入参数
    this.mouseDown.handleEvent = function(event) {
      if (event.button !== 0) return; //限制鼠标左键进行操作
      event.preventDefault(); //阻止与事件关联的默认操作
      // scope.hasMove = false;
      // scope.firstTime = new Date().getTime();
      // console.log(scope.firstTime);
      // console.log("按下事件");
      scope.MouseDown(event, scope); //为鼠标执行函数添加参数
    };
    this.mouseMove.handleEvent = function(event) {
      if (event.button !== 0) return;
      event.preventDefault();
      // scope.hasMove = true;
      // console.log("移动事件");
      scope.MouseMove(event, scope);
    };
    this.mouseUp.handleEvent = function(event) {
      if (event.button !== 0) return;
      event.preventDefault();
      // scope.lastTime = new Date().getTime();
      // console.log(scope.lastTime);
      // if (scope.hasMove) {
        // if (scope.lastTime - scope.firstTime > 200) {
          // console.log("抬起事件");
          scope.MouseUp(event, scope);
        // } else {
          // console.log("点击事件");
          // scope.Click(event, scope);
        // }
      // } else {
      //   console.log("点击事件");
      //   scope.Click(event, scope);
      // }
      // scope.hasMove = false;
    };
    //绑定监听器
    this.renderer.domElement.addEventListener("mousedown", scope.mouseDown, false);
    this.renderer.domElement.addEventListener("mousemove", scope.mouseMove, false);
    this.renderer.domElement.addEventListener("mouseup", scope.mouseUp, false);
    //页面自适应
    window.addEventListener("resize", function() {
      scope.onWindowResize();
    });
  },
  //设置基础场景
  //针对不同实验定义不同的基础场景,包括灯光、背景、基础模型场景、相机初始位置、环境光等）
  setBasicScene: function(params) {
    var scope = this;
    // parameters = parameters || {};
    var value = params !== undefined ? params : 0;
    switch (value) {
      case 0:
        this.scene.background = new THREE.Color(0x515151);
        this.camera.position.set(0, 0, 0);
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        this.controls.target.set(0, 0, 0);
        //继续添加
        break;
      case 1:
        //设置环境光贴图
        this.envMap = this.imgLoader.load(rootUrl + "/image/envMap.jpg"); //加载环境光贴图
        this.envMap.mapping = THREE.EquirectangularReflectionMapping; //反射属性,圆柱形全景反射
        // this.envMap.magFilter = THREE.LinearFilter;//已默认
        // this.envMap.minFilter = THREE.LinearMipMapLinearFilter;//已默认
        //设置玻璃材质
        this.glassMaterial = new THREE.MeshPhongMaterial({
          // color: 0xFAEBD7,
          transparent: true,
          opacity: 0.3,
          envMap: this.envMap,//环境贴图创建虚假反光效果
          reflectivity: 0.6,//环境贴图的反光程度
          depthWrite: false, //深度写入
          side: THREE.FrontSide,
        });
        //加载实验桌以及背景黑板
        this.scene.background = this.imgLoader.load(rootUrl + '/image/blackboard.jpg');
        this.objLoader.load(rootUrl + '/model/Desk/Desk.obj', function(obj) {
          var matDesk = scope.textureMaterial(
            "Desk", {
              D: "Desk_DeskBody_Diffuse.png",
              S: "Desk_DeskBody_Glossiness.png",
              N: "Desk_DeskBody_Normal.png"
            }
          );
          obj.traverse(function(child) {
            if (child instanceof THREE.Mesh) {
              child.material = matDesk;
              child.material.side = THREE.DoubleSide;
            }
          });
          obj.scale.set(1.5, 1.4, 1.2);
          obj.position.set(0, -53.6, 0);//.................
          obj.rotation.y = Math.PI / 2;
          scope.scene.add(obj);
        });
        //设置相机的位置
        this.camera.position.set(0, 0, 0);
        // this.camera.lookAt(target);//this.camera.target是不对的
        this.camera.lookAt(new THREE.Vector3(0, 10, 0));
        //设置控制器
        this.controls.target.set(0, 10, 0);
        this.controls.rotateSpeed = 0.3;//旋转速度
        this.controls.maxDistance = 250;//最大
        this.controls.minDistance = 10;//最小
        // this.controls.enablePan = false;//封锁控制器中的鼠标左键
        this.controls.maxPolarAngle = Math.PI / 2;//设置最大翻转角度

        /*实验桌场景控制平移范围*/
        this.controls.addEventListener("change", function() {
          var line = new THREE.Line3(scope.camera.position, scope.scene.position);
          if(line.distance() <= 350 && scope.camera.position.y >= 0 && scope.camera.position.y <= 300) {
            scope.camera.position1 = scope.camera.position.clone();
            scope.controls.target1 = scope.controls.target.clone();
          } else {
            scope.camera.position.copy(scope.camera.position1);
            scope.controls.target.copy(scope.controls.target1);
          }
        });
        //添加灯光
        //...
          break;
        case 2:
          //待添加
          //...
          break;
    }
  },

  // resetCamera: function(sceneId) {
  //   switch (sceneId) {
  //     case 1:
  //       this.controls.reset();
  //       this.controls.enabled = true;
  //       this.camera.position.set(0, 76, 134);
  //       this.camera.lookAt(new THREE.Vector3(0, 10, 0));
        // this.controls.target.set(0, 10, 0);
  //       break;
  //     case 2:
  //       this.controls.reset();
  //       this.controls.enabled = true;
  //       this.camera.position.set(0, 76, 134);
  //       this.camera.lookAt(new THREE.Vector3(0, 10, 0));
        // this.controls.target.set(0, 10, 0);
  //
  //       break;
  //   }
  //   this.render();
  // },
  //屏幕大小改变时画面自适应
  onWindowResize: function() { //屏幕大小改变时画面自适应
    this.areaWidth = this.app.width();
    this.areaHeight = this.app.height();
    this.camera.aspect = this.areaWidth / this.areaHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.areaWidth, this.areaHeight);
  },
  //渲染器渲染相机拍摄到的场景
  render: function() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();//此处不是特别需要
  },
  //闭包保存this,即实例化对象 new RainierWebGL("#app")
  saveThis: function() {
    var that = this;
    return function() {
      return that;
    }
  },


  //自定义的设置带贴图的材质，返回一个material
  textureMaterial: function(filePath, textureName) {
    var textureMaterial;
    var path = '/model/' + filePath + '/';
    var map_D = textureName.D ? this.imgLoader.load(rootUrl + path + textureName.D) : null;
    var map_S = textureName.S ? this.imgLoader.load(rootUrl + path + textureName.S) : null;
    var map_N = textureName.N ? this.imgLoader.load(rootUrl + path + textureName.N) : null;
    textureMaterial = new THREE.MeshPhongMaterial({
      map: map_D,
      specularMap: map_S,
      normalMap: map_N,
    });
    return textureMaterial;
  },
  //设置可移动模型
  setMoveModel: function(moveModel, posArr, rotArr, scaArr, modelName, triggerState) { //设置交互模型属性（位置、角度、缩放、交互区域name、每个mesh的modelName等），返回一个模型
    var model = moveModel;
    model.triggerName = triggerState.triggerName ? triggerState.triggerName : [];
    model.isStaticView = triggerState.isStaticView ? triggerState.isStaticView : false;
    model.name = modelName;
    model.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.modelName = modelName;
      }
    });
    model.position.set(posArr[0], posArr[1], posArr[2]);
    model.rotation.set(rotArr[0], rotArr[1], rotArr[2]);
    model.scale.set(scaArr[0], scaArr[1], scaArr[2]);
    model.lastPosition = model.position.clone();
    model.lastRotation = model.rotation.clone();
    model.lastScale = model.scale.clone();

    this.model[modelName] = model;
    this.modelArr.push(model);//需要操作的模型，设为全局属性
    // this.moveModelArr.push(model);//可移动模型单独添加
    // console.log(model);
    // console.log(this.modelArr);
    // console.log(this.moveModelArr);
    this.expScene.add(model);
    return model;
  },
  //设置交互区域
  setTriggerArea: function(posArr, rotArr, scaArr, areaName, triggerName) {
    var area = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3,
        visible: false
      })
    );
    area.name = areaName;
    area.triggerName = triggerName ? triggerName : "";
    area.position.set(posArr[0], posArr[1], posArr[2]);
    area.rotation.set(rotArr[0], rotArr[1], rotArr[2]);
    area.scale.set(scaArr[0], scaArr[1], scaArr[2]);
    area.MD_inArea = function() {};
    area.MD_outArea = function() {};
    area.MM_inArea = function() {};
    area.MM_outArea = function() {};
    area.MU_inArea = function() {};
    area.MU_outArea = function() {};
    this.triggerArea[areaName] = area; //此处通过变量来访问对象属性
    this.triggerAreaArr.push(area);
    // console.log(area);
    // console.log(this.triggerArea);
    // console.log(this.triggerAreaArr);
    this.expScene.add(area);
    return area;
  },
  // setExpScene: function() { //重置功能，重置很多属性并执行一部分方法
  //   TweenMax.killAll();
  //   TWEEN.removeAll();
  //   layer.closeAll();
  //   this.scene.remove(this.expScene);
  //   this.expScene = new THREE.Group();
  //   this.scene.add(this.expScene);
  //   this.stateParams = {};
  //   this.moveModel = {};
  //   this.triggerArea = {};
  //   this.staticViewModel = {};
  //   this.moveModelArr = [];
  //   this.triggerAreaArr = [];
  //   this.staticViewModelArr = [];
  //   this.isStaticView = false;
  //   this.operatePlane = new THREE.Plane();
  //   this.raycaster = new THREE.Raycaster();
  //   this.mouse = new THREE.Vector2();
  //   this.offset = new THREE.Vector3();
  //   this.intersection = new THREE.Vector3();
  //   this.INTERSECTED;
  //   this.SELECTED;
  //   this.c_Selected;
  //   this.c_Intersected;
  //   this.LoadExpModel();
  //   this.resetCamera(this.sceneId);
  // },
  MouseDown: function(event, self) {
    self.mouse.x = (event.layerX / self.areaWidth) * 2 - 1;
    self.mouse.y = -(event.layerY / self.areaHeight) * 2 + 1;
    self.raycaster.setFromCamera(self.mouse, self.camera);
    if (!self.isStaticView) {
      var operateIntersects = self.raycaster.intersectObjects(self.moveModelArr, true);
      if (operateIntersects.length > 0) {
        self.controls.enabled = false;
        var modelName = operateIntersects[0].object.modelName;
        self.SELECTED = self.expScene.getObjectByName(modelName);
				// console.log(self.SELECTED);
        //记录初始状态
        self.SELECTED.lastPosition = self.SELECTED.position.clone();
        self.SELECTED.lastRotation = self.SELECTED.rotation.clone();
        self.SELECTED.lastScale = self.SELECTED.scale.clone();
        //记录当前模型材质以便之后重置
        self.everyMeshMat = {};
        self.SELECTED.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            self.everyMeshMat[child.uuid] = child.material.clone();
          }
        });
        //设置可拖动的克隆体
        self.c_Selected = self.SELECTED.clone();
        self.c_Selected.name = null;
        //改变被选中物体的颜色效果
        self.c_Selected.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            child.material.transparent = true;
            child.material.opacity = 0.4;
            child.material.color.set(0xff0000);
            child.material.depthFunc = THREE.AlwaysDepth; //index，始终渲染在最前面，避免穿透和碰撞
          }
        });
        self.SELECTED.visible = false;
        self.expScene.add(self.c_Selected);
        //重置原模型的材质
        self.SELECTED.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            for (var key in self.everyMeshMat) {
              if (child.uuid == key) {
                child.material = self.everyMeshMat[key];
              }
            }
          }
        })
        //Intersect this Ray with a Plane, returning the intersection point or null if there is no intersection
        if (self.raycaster.ray.intersectPlane(self.operatePlane, self.intersection)) {
          self.offset.copy(self.intersection).sub(self.c_Selected.position);
        }
        // self.app.css("cursor","move");
      }
    } else {//固定视角，暂时不用
      // var staticViewIntersects = self.raycaster.intersectObjects(self.staticViewModelArr, true);
      // if (staticViewIntersects.length > 0) {
      //   var modelName = staticViewIntersects[0].object.modelName;
      //   self.SELECTED = self.expScene.getObjectByName(modelName);
      //   self.staticViewModel[self.SELECTED.name].MD_staticViewMove(self.SELECTED);
      //   // self.app.css("cursor","move");
      // }
    } 
  },
  MouseMove: function(event, self) { //目前自由视角和固定视角，拖动模型进行交互的鼠标移动时执行的方法
    self.mouse.x = (event.layerX / self.areaWidth) * 2 - 1;
    self.mouse.y = -(event.layerY / self.areaHeight) * 2 + 1;
    self.raycaster.setFromCamera(self.mouse, self.camera);
    if (!self.isStaticView) {
      if (self.SELECTED) {
        self.controls.enabled = false;
        var triggerIntersects = self.raycaster.intersectObjects(self.triggerAreaArr, true);
        if (triggerIntersects.length > 0) {//进交互区域
          var someResult = self.SELECTED.triggerName.some(function (item, index) {
              if (item == triggerIntersects[0].object.triggerName) {
                self.SELECTED.triggerNameIndex = index;
                return true;
              }
            })
          if (someResult) {//进可交互区域
            if (self.INTERACTIVE != triggerIntersects[0].object) {
              if (self.INTERACTIVE) {//从可交互区域进可交互区域
                self.INTERACTIVE.MM_outArea(self.SELECTED);
              }//
              self.SELECTED.visible = true;
              self.c_Selected.visible = false;
              self.INTERACTIVE = triggerIntersects[0].object;
              self.INTERACTIVE.MM_inArea(self.SELECTED,  self.SELECTED.triggerNameIndex);
            }  
          } else {//进入不可交互区域
            if (self.INTERACTIVE) {//从可交互区域进不可交互区域
              self.INTERACTIVE.MM_outArea(self.SELECTED);
              self.INTERACTIVE = null;
            }//
            self.SELECTED.visible = false;
            self.c_Selected.visible = true;
          }
        } else {//出交互区域
          if (self.INTERACTIVE) {
            self.INTERACTIVE.MM_outArea(self.SELECTED);
            self.INTERACTIVE = null;
          }
          self.SELECTED.visible = false;
          self.c_Selected.visible = true;
        }
        //计算拖拽偏移量
        if (self.raycaster.ray.intersectPlane(self.operatePlane, self.intersection)) {
          self.c_Selected.position.copy(self.intersection.sub(self.offset));
        }
        // self.app.css("cursor", "move");
      } else {
        //无拖拽物体，检测鼠标移动过程中遇到的可绑定对象
        var operateIntersects = self.raycaster.intersectObjects(self.modelArr, true);
        if (operateIntersects.length > 0) {
          //绑定悬浮对象，不可直接用operateIntersects[0].object
          var modelName = operateIntersects[0].object.modelName;
          if (self.INTERSECTED != self.model[modelName]) {
            if (self.INTERSECTED) {
              //...
            }
            self.INTERSECTED = self.model[modelName];
            //...
          }
          //不懂什么情况，但是和拖拽有关
          self.operatePlane.setFromNormalAndCoplanarPoint(self.camera.getWorldDirection(self.operatePlane.normal), self.INTERSECTED.position);
          self.app.css("cursor", "pointer");
        } else {
          if (self.INTERSECTED) {
            //...
            self.INTERSECTED = null;
          }
          self.app.css("cursor", "auto");
        }
      }
    } else {//固定视角，暂时不用
      // if (self.SELECTED) {
      //   self.staticViewModel[self.SELECTED.name].MM_staticViewMove(self.SELECTED);
      // } else {
      //   var staticViewIntersects = self.raycaster.intersectObjects(self.staticViewModelArr, true);
      //   if (staticViewIntersects.length > 0) {
      //     if (self.INTERSECTED != staticViewIntersects[0].object) {
      //       self.INTERSECTED = staticViewIntersects[0].object;
      //     }
      //     self.app.css("cursor", "pointer");
      //   } else {
      //     self.INTERSECTED = null;
      //     self.app.css("cursor", "auto");
      //   }
      // }
    }
  },
  MouseUp: function(event, self) { //目前自由视角和固定视角，拖动模型进行交互的鼠标松开时执行的方法
    if (!self.isStaticView) { //自由视角
      self.controls.enabled = true;
      if (self.SELECTED) {
        self.SELECTED.visible = true;
        //判断鼠标松开之后被拖拽的物体是否落在交互区域
        if (self.INTERACTIVE) { //可交互区域
          self.INTERACTIVE.MU_inArea(self.SELECTED, self.SELECTED.triggerNameIndex);
          self.INTERACTIVE = null;
        } else { //回归之前的位置
          self.SELECTED.position.copy(self.SELECTED.lastPosition);
          self.SELECTED.rotation.copy(self.SELECTED.lastRotation);
          self.SELECTED.scale.copy(self.SELECTED.lastScale);
          // self.INTERACTIVE.MU_outArea(self.SELECTED);
        }
        //删除拖拽克隆体，并清除选择状态
        self.expScene.remove(self.c_Selected);
        self.c_Selected = null;
        self.SELECTED = null;
      }
    } else { //固定视角,暂时不用
      // if (self.SELECTED) {
      //   self.staticViewModel[self.SELECTED.name].MU_staticViewMove(self.SELECTED);
      //   self.SELECTED = null;
      // }
    }
    self.app.css("cursor", "auto");
  },
  //尝试使用点击事件，但是Chrome有Bug放弃了
  // Click: function (event, self) {
  //   if (self.SELECTED) {
  //     self.SELECTED.visible = true;
  //     self.expScene.remove(self.c_Selected);
  //     self.c_Selected = null;
  //     self.SELECTED = null;
  //   }
  //   var clickIntersects = self.raycaster.intersectObjects(self.modelArr, true);
	// 		if (clickIntersects.length > 0) {
  //       self.onDocumentClick(clickIntersects[0].object);
	// 		}
  // },

}

//全局工具方法
var tool = {
  tip: function(content) { //不会自动消失的layer提示
    layer.msg(content, {
      time: 0,
      offset: '10%',
      zIndex: 0,
      skin: 'webgl-tip-css'
    });
  },
  autoTip: function(content, duration) { //会在duration毫秒后自动消失的layer提示
    layer.msg(content, {
      time: duration,
      offset: '10%',
      zIndex: 0,
      skin: 'webgl-tip-css'
    });
  },
  wholeScreenTip: function(content, duration, endFunc, successFunc) { //全屏的提示，例如培养跟第二天提示，可传入success后或者layer框销毁后执行的函数
    layer.open({
      closeBtn: 0, //取消关闭按钮
      time: duration, //自动消失的时间
      title: false, //取消标题
      type: 1, //层类型为页面层
      content: content, //弹出文字内容
      skin: 'webgl-wholeScreenTip-css', //自定义皮肤
      resize: false, //不能调节大小
      shade: [1, '#000'], //遮罩颜色
      anim: 5, //弹出动画为渐变
      isOutAnim: false,//弹框销毁动画取消
      zIndex: 0, //弹框层级
      end: endFunc, //弹框销毁时回调
      success: successFunc //弹框弹出时回调
    });
  },
}
