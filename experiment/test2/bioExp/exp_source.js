(function () {
//重置功能
$(".reset").click(function() {
  // exp.controls.reset();
  location.reload();
});
//初始化场景
var exp = new RainierWebGL("#app");

exp.init();
exp.setBasicScene(1);
exp.camera.position.set(0, 65, 110);

loadExpModel();
createTriggerArea();
render();

/**
 * 加载模型
 */
function loadExpModel() {
  //绿豆种子
  var bean;
  var matBean = exp.textureMaterial(
    "bean", {
      D: "BeanWholedefault_Diffuse.png",
      S: "BeanWholedefault_Glossiness.png",
      N: "BeanWholedefault_Normal.png"
    }
  );
  exp.objLoader.load(rootUrl + "/model/bean/Bean01.obj", function(obj) {
    //原始模型
    // obj.scale.set(0.01, 0.01, 0.01);
    // obj.rotation.set(0, 0, 0);
    // obj.position.set(10, 0, 30);
    // exp.expScene.add(obj);
    //BeanGroup,设置绿豆在培养皿中的随机位置
    exp.model.beanInDishGroup = new THREE.Group();
    exp.model.beanGroup = [];
    for (var j = 0; j < 5; j++) {
      exp.model.beanGroup[j] = new THREE.Group();
      for (var i = 0; i < 8; i++) {
        bean = obj.clone();
        bean.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            child.material = matBean.clone();
          }
        });
        bean.name = "bean" + j + i;
        var radius = Math.random() * 4.5;
        var angle = Math.random() * Math.PI * 2;
        bean.position.set(radius * Math.cos(angle) - 10, 0.1, 30 + radius * Math.sin(angle));
        bean.rotation.set(0, angle, 0);
        bean.scale.set(0.01, 0.01, 0.01);
        exp.model.beanGroup[j].add(bean);
      }
      exp.model.beanGroup[j].name = "beanGroup" + j;
      exp.model.beanInDishGroup.add(exp.model.beanGroup[j]);
    }

    exp.model.beanInDishGroup.name = "beanInDish";
    exp.expScene.add(exp.model.beanInDishGroup);
    // console.log(exp.model.beanInDishGroup);
  });

  //萌发的绿豆
  var beanSprouted;
  exp.objLoader.load(rootUrl + "/model/bean/Bean03.obj", function(obj) {
    exp.model.beanSprouted = [];
    for (var j = 0; j < 4; j++) {
      exp.model.beanSprouted[j] = new THREE.Group();
      for (var i = 0; i < 8; i++) {
        beanSprouted = obj.clone();
        beanSprouted.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            child.material = matBean.clone();
          }
        });
        beanSprouted.name = "beanSprouted" + i;
        beanSprouted.scale.set(0.01, 0.01, 0.01);
        // beanSprouted.position.set(0,0,0);
        // beanSprouted.rotation.set(0,0,0);
        exp.model.beanSprouted[j].add(beanSprouted)
      }
      exp.model.beanSprouted[j].name = "beanSprouted"+j;
      // exp.expScene.add(exp.model.beanSprouted);
    }
  });

  //培养皿
  exp.objLoader.load(rootUrl + "/model/PetriDish/PetriDish.obj", function(obj) {
    obj.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = exp.glassMaterial.clone();
      }
    });
    obj.scale.set(1, 1, 1);
    obj.position.set(-10, 0, 30);
    exp.expScene.add(obj);
  });

  //烧杯
  exp.objLoader.load(rootUrl + "/model/breaker/Breaker.obj", function(obj) {
    obj.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = exp.glassMaterial.clone();
        // if (child.name == "BeakerBody200ml") {
        //   child.material = exp.glassMaterial.clone();
        //   child.material.opacity = 0.5;
        // } else {
        //   child.material.transparent = true;
        //   child.material.opacity = 0.1;
        //   child.position.y = 0.01;
        // }
      }
    });
    exp.setMoveModel(
      obj, [-30, 0, 30], [0, 0, 0], [1.2, 1.1, 1.2],
      "breaker", {}
    )
  });

  //可拖拽的的卫生纸
  var bumf = [];
  var matBumf = exp.textureMaterial(
    "Bumf", {
      D: "Bumf_D.png",
      N: "Bumf_N.png",
      S: "Bumf_S.png"
    }
  );
  exp.objLoader.load(rootUrl + "/model/Bumf/Bumf_02.obj", function(obj) {
    for (var i = 0; i < 4; i++) {
      bumf[i] = obj.clone();
      bumf[i].traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          child.material = matBumf.clone();
        }
      });
      exp.setMoveModel(
        bumf[i], [10, -1, 30], [0, 0, 0], [1, 0.7, 0.7],
        "bumf" + i, {
          // triggerName: [placeBumf] //交互状态的交互操作名称
        }
      )
      exp.moveModelArr.push(bumf[i]);//推入可移动模型数组
    }
  });

    //桌子上的不可移动的卫生纸
  exp.objLoader.load(rootUrl + "/model/Bumf/Bumf_01.obj", function(obj) {
    obj.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = matBumf;
      }
    });
    var obj1 = obj.clone();
    var obj2 = obj.clone();
    obj1.position.set(10, 0, 30);
    obj1.scale.set(1, 0.7, 0.7);
    obj2.position.set(30, 0, 30);
    obj2.scale.set(1, 0.7, 0.7);
    exp.expScene.add(obj1);
    exp.expScene.add(obj2)
  });

  //勺子
  var spoon;
  var matSpoon = exp.textureMaterial(
    "spoon", {
      S: "Spoon_Specular.png"
    }
  );
  matSpoon.envMap = exp.envMap; //贴上环境贴图反射金属光泽
  matSpoon.color.set(0xc9c9c9);
  exp.objLoader.load(rootUrl + "/model/spoon/Spoon.obj", function(obj) {
    spoon = obj.clone();
    spoon.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        if (child.name == "WaterMesh") {
          child.visible = false;
          child.material.transparent = true;
          child.material.opacity = 0.2;
        } else {
          child.material = matSpoon.clone();
        }
      }
    });
    exp.setMoveModel(
      spoon, [35, 0.6, 30], [0, 0, - Math.PI/40], [1, 1, 1],
      "spoon", {
        // triggerName: [scoopWater]
      }
    );
    exp.moveModelArr.push(spoon);
    spoon.times = 0; //之后判断取种子次数要用
    spoon.triggerNameArr = [];//交互区域触发名缓冲区
  });

  //带盖玻璃瓶
  var cup = [],
      lid = [];
  var matCup = exp.textureMaterial(
    "cup", {
      D: "LidAndLable_Albedo.png",
      N: "LidAndLable_Normal.png"
    }
  );
  var matWater = new THREE.MeshPhongMaterial({
    transparent: true,
    opacity: 0.3,
    color: 0x1E90FF,
  });
  var matCupBody = exp.glassMaterial.clone();
  // matCupBody.side = THREE.FrontSide;//渲染前面
  exp.daeLoader.load(rootUrl + "/model/cup/cup.dae", function(collada) {
    //循环加载
    for (var i = 0; i < 4; i++) {
      cup[i] = collada.scene.clone();
      //  cup[i].name = "cup" + i;
      cup[i].traverse(function(child) {
        if (child instanceof THREE.Mesh) {
          //console.log(child);//此处一定要用Mesh检测
          if (child.parent.name == "Cup") {
            child.material = matCupBody.clone();
          } else if (child.parent.name == "Lid") {
            lid[i] = child;
            child.material = matCup.clone();
          } else if (child.parent.name == "Lable" + (i + 1)) {
            child.material = matCup.clone();
          } else {
            child.visible = false;
            child.material = matWater.clone()
          }
        }
      })
      //定义瓶子的属性特征，用于判断种子萌发条件
      cup[i].character = {
        waterTimes: 0,
        inside: null,
        //...
      }
    };
    exp.model.cup0 = exp.setMoveModel(
      cup[0], [-30, 4, 10], [Math.PI * 0.6, 0, -Math.PI * 0.5], [0.7, 0.7, 0.7],
      "cup0", {
        //  triggerName: []
      }
    );
    exp.model.lid0 = exp.setMoveModel(
      lid[0], [-19, 4, 10], [0, Math.PI * 0.5, 0], [0.7, 0.7, 0.7],
      "lid0", {
        triggerName: ["openCup0"]
      }
    );
    exp.model.cup1 = exp.setMoveModel(
      cup[1], [10, 4, 10], [Math.PI * 0.6, 0, -Math.PI * 0.5], [0.7, 0.7, 0.7],
      "cup1", {
        //  triggerName: []
      }
    );
    exp.model.lid1 = exp.setMoveModel(
      lid[1], [21, 4, 10], [0, Math.PI * 0.5, 0], [0.7, 0.7, 0.7],
      "lid1", {
        triggerName: ["openCup1"]
      }
    );
    exp.model.cup2 = exp.setMoveModel(
      cup[2], [-30, 4, -10], [Math.PI * 0.6, 0, -Math.PI * 0.5], [0.7, 0.7, 0.7],
      "cup2", {
        //  triggerName: []
      }
    );
    exp.model.lid2 = exp.setMoveModel(
      lid[2], [-19, 4, -10], [0, Math.PI * 0.5, 0], [0.7, 0.7, 0.7],
      "lid2", {
        triggerName: ["openCup2"]
      }
    );
    exp.model.cup3 = exp.setMoveModel(
      cup[3], [10, 4, -10], [Math.PI * 0.6, 0, -Math.PI * 0.5], [0.7, 0.7, 0.7],
      "cup3", {
        //  triggerName: []
      }
    );
    exp.model.lid3 = exp.setMoveModel(
      lid[3], [21, 4, -10], [0, Math.PI * 0.5, 0], [0.7, 0.7, 0.7],
      "lid3", {
        triggerName: ["openCup3"]
      }
    );
    //将瓶盖推入可移动模型数组
    for (var i = 0; i < 4; i++) {
      exp.moveModelArr.push(exp.model["lid" + i]);
    }
    // collada.scene.scale.set(0.7, 0.7, 0.7); //统一大小
    // collada.scene.position.set(0, 0, 0); //初始位置
    // collada.scene.rotation.set(0, 0, 0);//不可在此设置翻转
    // exp.expScene.add(collada.scene);
  })

  //橱柜
  var showcase;
  var matShowcase = exp.textureMaterial(
    "showcase", {
      D: "showcase_Showcasebody_Diffuse.png",
      S: "showcase_Showcasebody_Specular.png",
      N: "showcase_Showcasebody_Normal.png"
    }
  );
  exp.objLoader.load(rootUrl + "/model/showcase/showcase.obj", function(obj) {
    showcase = obj.clone();
    showcase.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        if (child.name == "ShowCase") {
          child.material = matShowcase;
        } else { //玻璃门
          child.material = exp.glassMaterial.clone();
          // child.position.set(-30, 0, 0)
          // child.rotation.set(0, -Math.PI * 0.75, 0);
        }
      }
    });
    exp.setMoveModel(
      showcase, [-65, 0, -13], [0,0,0], [0.5, 0.5, 0.5],
      "showcase", { }
    )
    // showcase.position.set(-65, 0, -13); //初始原点位置(-9, 0, 7)
    // showcase.scale.set(0.5, 0.5, 0.5);
    // showcase.rotation.set(0, Math.PI*0.5, 0);
    // exp.expScene.add(showcase);
    // console.log(obj);
  })

  //冰箱
  var freezer;
  var matFreezer = exp.textureMaterial(
    "freezer", {
      D: "Freezer_02_FreeZer_01_Diffuse.png",
      S: "Freezer_02_FreeZer_01_Specular.png",
      N: "Freezer_02_FreeZer_01_Normal.png"
    }
  );
  exp.daeLoader.load(rootUrl + "/model/freezer/Freezer.dae", function(collada) {
    freezer = collada.scene.clone();
    freezer.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = matFreezer;
        child.material.side = THREE.DoubleSide;
      }
      //开门
      // if (child.name == "FreeZer_02") {
      //   child.children[0].rotation.set(0, 0, Math.PI * 0.75) //转动轴有变化
      // }
    });
    exp.setMoveModel(
      freezer, [55, 0.8, -20], [0, -Math.PI * 0.5, 0], [0.5, 0.5, 0.5],
      "freezer",{}
    )
    // collada.scene.position.set(55, 0.8, -20);
    // collada.scene.scale.set(0.5, 0.5, 0.5);
    // collada.scene.rotation.set(0, -Math.PI * 0.5, 0);
    // exp.expScene.add(collada.scene);
    // console.log(collada.scene);
  })

//.....
}


/**
 * 创建交互区域
 */
 function createTriggerArea() {
   var openCup0Area = exp.setTriggerArea(
     [-12, 4, 10], [0, 0, 0], [14, 8, 10], "openCup0Area", "openCup0"
   )
   openCup0Area.MM_inArea = function(obj) {
     obj.traverse(function(child) {
       switch (child.name) {
         case "lid0":
           obj.position.set(-12, 1.5, 10);
           obj.rotation.set(Math.PI * 0.5, 0, 0);
           break;
         case "bumf0":
         case "bumf1":
         case "bumf2":
         case "bumf3":
           obj.position.set(-15, 3, 10);
           break;
         case "spoon":
           obj.position.set(-8, 7, 10);
           obj.rotation.set(0, 0, Math.PI / 10);
           break;
       }
     })
   };

   openCup0Area.MU_inArea = function(obj, index) {
     obj.traverse(function(child) {
       switch (child.name) {
         case "lid0":
           obj.triggerName = [];
           for (var i = 0; i < 4; i++) {
             exp.model['bumf' + i].triggerName.push("openCup0") //打开瓶盖触发可加卫生纸状态
           }
           break;
         case "bumf0":
         case "bumf1":
         case "bumf2":
         case "bumf3":
           animation.placeBumf(obj, exp.model.cup0); //添加卫生纸
           for (var i = 0; i < 4; i++) {
             exp.model['bumf' + i].triggerName.splice(index, 1); //添加完卫生纸之后就不可再次添加
           }
           exp.model.spoon.triggerNameArr.push("openCup0"); //加入卫生纸后触发可加种子状态
           break;
         case "spoon":
           animation.pour(obj, index, exp.model.cup0);
           break;
       }
     })
   }

   var openCup1Area = exp.setTriggerArea(
     [28, 4, 10], [0, 0, 0], [14, 8, 10] , "openCup1Area", "openCup1"
   )
   openCup1Area.MM_inArea = function(obj) {
     obj.traverse(function(child) {
       switch (child.name) {
         case "lid1":
           obj.position.set(28, 1.5, 10);
           obj.rotation.set(Math.PI * 0.5, 0, 0);
           break;
         case "bumf0":
         case "bumf1":
         case "bumf2":
         case "bumf3":
           obj.position.set(25, 3, 10);
           break;
         case "spoon":
           obj.position.set(32, 7, 10);
           obj.rotation.set(0, 0, Math.PI / 10);
           break;

       }
     })
   }
   openCup1Area.MU_inArea = function(obj, index) {
     obj.traverse(function(child) {
       switch (child.name) {
         case "lid1":
           obj.triggerName = [];
           for (var i = 0; i < 4; i++) {
             exp.model['bumf' + i].triggerName.push("openCup1")
           }
           break;
         case "bumf0":
         case "bumf1":
         case "bumf2":
         case "bumf3":
           animation.placeBumf(obj, exp.model.cup1);
           for (var i = 0; i < 4; i++) {
             exp.model['bumf' + i].triggerName.splice(index,1)
           }
           exp.model.spoon.triggerNameArr.push("openCup1")
           break;
         case "spoon":
           animation.pour(obj, index, exp.model.cup1);
           break;
       }
     })
   }

   var openCup2Area = exp.setTriggerArea(
     [-12, 4, -10], [0, 0, 0], [14, 8, 10],  "openCup2Area", "openCup2"
   )
   openCup2Area.MM_inArea = function(obj) {
     obj.traverse(function(child) {
       switch (child.name) {
         case "lid2":
           obj.position.set(-12, 1.5, -10);
           obj.rotation.set(Math.PI * 0.5, 0, 0);
           break;
         case "bumf0":
         case "bumf1":
         case "bumf2":
         case "bumf3":
           obj.position.set(-15, 3, -10);
           break;
         case "spoon":
           obj.position.set(-8, 7, -10);
           obj.rotation.set(0, 0, Math.PI / 10);
           break;

       }
     })
   }
   openCup2Area.MU_inArea = function(obj, index) {
     obj.traverse(function(child) {
       switch (child.name) {
         case "lid2":
           obj.triggerName = [];
           for (var i = 0; i < 4; i++) {
             exp.model['bumf' + i].triggerName.push("openCup2")
           }
           break;
         case "bumf0":
         case "bumf1":
         case "bumf2":
         case "bumf3":
           animation.placeBumf(obj, exp.model.cup2);
           for (var i = 0; i < 4; i++) {
             exp.model['bumf' + i].triggerName.splice(index,1)
           }
           exp.model.spoon.triggerNameArr.push("openCup2")
           break;
         case "spoon":
           animation.pour(obj, index, exp.model.cup2);
           break;
       }
     })
   }

   var openCup3Area = exp.setTriggerArea(
     [28, 4, -10], [0, 0, 0], [14, 8, 10],  "openCup3Area", "openCup3"
   )
   openCup3Area.MM_inArea = function(obj) {
     obj.traverse(function(child) {
       switch (child.name) {
         case "lid3":
           obj.position.set(28, 1.5, -10);
           obj.rotation.set(Math.PI * 0.5, 0, 0);
           break;
         case "bumf0":
         case "bumf1":
         case "bumf2":
         case "bumf3":
           obj.position.set(25, 3, -10);
           break;
         case "spoon":
           obj.position.set(32, 7, -10);
           obj.rotation.set(0, 0, Math.PI / 10);
           break;

       }
     })
   }
   openCup3Area.MU_inArea = function(obj, index) {
     obj.traverse(function(child) {
       switch (child.name) {
         case "lid3":
           obj.triggerName = [];
           for (var i = 0; i < 4; i++) {
             exp.model['bumf' + i].triggerName.push("openCup3")
           }
           break;
         case "bumf0":
         case "bumf1":
         case "bumf2":
         case "bumf3":
           animation.placeBumf(obj, exp.model.cup3);
           for (var i = 0; i < 4; i++) {
             exp.model['bumf' + i].triggerName.splice(index,1)
           }
           exp.model.spoon.triggerNameArr.push("openCup3");
           break;
         case "spoon":
           animation.pour(obj, index, exp.model.cup3);
           break;
       }
     })
   }

   var scoopBeansArea = exp.setTriggerArea(
     [-10, 0, 30], [0, 0, 0], [20, 10, 20], "scoopBeansArea", "scoopBeans"
   );
   scoopBeansArea.MM_inArea = function(obj) {
     obj.position.set(1, 7, 30);
     obj.rotation.set(0, 0, Math.PI / 6);
   };
   scoopBeansArea.MU_inArea = function(obj) {
     // console.log(obj.times);
     animation.scoopBeans(obj);
   };

   var scoopWaterArea = exp.setTriggerArea(
     [-30, 5, 30], [0, 0, 0], [10, 10, 10], "scoopWaterArea", "scoopWater"
   )
   scoopWaterArea.MM_inArea = function(obj) {
     obj.position.set(-25, 15, 30);
     obj.rotation.set(0, 0, Math.PI * 0.4);
   }
   scoopWaterArea.MU_inArea = function(obj) {
       animation.scoopWater(obj);
   }


   var resetSpoonArea = exp.setTriggerArea(
     [30, 0.5, 30], [0, 0, 0], [10, 1, 10], "resetSpoonArea", "resetSpoon"
   )
   resetSpoonArea.MM_inArea = function(obj) {
     obj.position.set(35, 0.6, 30);
     obj.rotation.set(0, 0, - Math.PI/40);
   }
   resetSpoonArea.MU_inArea = function(obj) {
     if (obj.triggerNameArr.length > 0) {
       tool.tip("加水，随时可闭合瓶盖");
       obj.triggerName = ['scoopWater'];
     } else {
       tool.tip("可闭合瓶盖");
       obj.triggerName = [  ]
     }
     for (var i = 0; i < 4; i++) {
       exp.model["lid" + i].triggerName = ["resetCup" + i]
     }
     //按钮现身
     $("#startExp").show()
   }

   var showcaseArea = exp.setTriggerArea(
     [-55, 12, -20], [0, 0, 0], [15, 25, 10], "showcaseArea", "showcaseArea"
   )
   showcaseArea.MM_inArea = function(obj) {
     switch (obj.name) {
       case "cup0":
         obj.position.set(-61, 5, -26);
         obj.rotation.set(Math.PI * 0.5, 0, 0);
         break;
       case "cup1":
         obj.position.set(-51, 5, -26);
         obj.rotation.set(Math.PI * 0.5, 0, 0);
         break;
       case "cup2":
         obj.position.set(-61, 18, -26);
         obj.rotation.set(Math.PI * 0.5, 0, 0);
         break;
       case "cup3":
         obj.position.set(-51, 18, -26);
         obj.rotation.set(Math.PI * 0.5, 0, 0);
         break;
     }
   }
   showcaseArea.MU_inArea = function(obj) {
     switch (obj.name) {
       case "cup0":
         obj.triggerName = ["resetCup0"];
         obj.character.inside = "showcase"
         break;
       case "cup1":
         obj.triggerName = ["resetCup1"];
         obj.character.inside = "showcase"
         break;
       case "cup2":
         obj.triggerName = ["resetCup2"];
         obj.character.inside = "showcase"
         break;
       case "cup3":
         obj.triggerName = ["resetCup3"];
         obj.character.inside = "showcase"
         break;
     }
   }

   var freezerArea = exp.setTriggerArea(
     [55, 12, -20], [0, 0, 0], [15, 25, 10], "freezerArea", "freezerArea"
   )
   freezerArea.MM_inArea = function(obj) {
     switch (obj.name) {
       case "cup0":
         obj.position.set(51, 6, -26);
         obj.rotation.set(Math.PI * 0.5, 0, 0);
         break;
       case "cup1":
         obj.position.set(60, 6, -26);
         obj.rotation.set(Math.PI * 0.5, 0, 0);
         break;
       case "cup2":
         obj.position.set(51, 18, -26);
         obj.rotation.set(Math.PI * 0.5, 0, 0);
         break;
       case "cup3":
         obj.position.set(60, 18, -26);
         obj.rotation.set(Math.PI * 0.5, 0, 0);
         break;
     }
   }
   freezerArea.MU_inArea = function(obj) {
     switch (obj.name) {
       case "cup0":
         obj.triggerName = ["resetCup0"];
         obj.character.inside = "freezer";
         break;
       case "cup1":
         obj.triggerName = ["resetCup1"];
         obj.character.inside = "freezer";
         break;
       case "cup2":
         obj.triggerName = ["resetCup2"];
         obj.character.inside = "freezer";
         break;
       case "cup3":
         obj.triggerName = ["resetCup3"];
         obj.character.inside = "freezer";
         break;
     }
   }

   var resetCup0Area = exp.setTriggerArea(
     [-28, 4, 10], [0, 0, 0], [20, 8, 8], "resetCup0Area", "resetCup0"
   )
   resetCup0Area.MM_inArea = function(obj) {
     if (obj.name == "cup0") {
       obj.position.set(-30, 4, 10);
       obj.rotation.set(Math.PI * 0.6, 0, -Math.PI * 0.5);
     } else if (obj.name == "lid0") {
       obj.position.set(-19, 4, 10);
       obj.rotation.set(0, Math.PI * 0.5, 0);
     }
   }
   resetCup0Area.MU_inArea = function(obj) {
     if (obj.name == "cup0") {
       if (fzIsOpen) {
         obj.triggerName.push("freezerArea");
       }
       if (scIsOpen) {
         obj.triggerName.push("showcaseArea");
       }
       obj.character.inside = null;

     } else if (obj.name == "lid0") {
       obj.triggerName = [];
       animation.combineCup(obj, exp.model.cup0);
     }
   }

   var resetCup1Area = exp.setTriggerArea(
     [12, 4, 10], [0, 0, 0], [20, 8, 8], "resetCup1Area", "resetCup1"
   )
   resetCup1Area.MM_inArea = function(obj) {
     if (obj.name == "cup1") {
       obj.position.set(10, 4, 10);
       obj.rotation.set(Math.PI * 0.6, 0, -Math.PI * 0.5);
     } else if (obj.name == "lid1") {
       obj.position.set(21, 4, 10);
       obj.rotation.set(0, Math.PI * 0.5, 0);
     }
   }
   resetCup1Area.MU_inArea = function(obj) {
     if (obj.name == "cup1") {
       if (fzIsOpen) {
         obj.triggerName.push("freezerArea");
       }
       if (scIsOpen) {
         obj.triggerName.push("showcaseArea");
       }
       obj.character.inside = null;
     } else if (obj.name == "lid1") {
       obj.triggerName = [];
       animation.combineCup(obj, exp.model.cup1);
     }
   }

   var resetCup2Area = exp.setTriggerArea(
     [-28, 4, -10], [0, 0, 0], [20, 8, 8], "resetCup2Area", "resetCup2"
   )
   resetCup2Area.MM_inArea = function(obj) {
     if (obj.name == "cup2") {
       obj.position.set(-30, 4, -10);
       obj.rotation.set(Math.PI * 0.6, 0, -Math.PI * 0.5);
     } else if (obj.name == "lid2") {
       obj.position.set(-19, 4, -10);
       obj.rotation.set(0, Math.PI * 0.5, 0);
     }
   }
   resetCup2Area.MU_inArea = function(obj) {
     if (obj.name == "cup2") {
       if (fzIsOpen) {
         obj.triggerName.push("freezerArea");
       }
       if (scIsOpen) {
         obj.triggerName.push("showcaseArea");
       }
       obj.character.inside = null;
     } else if (obj.name == "lid2") {
       obj.triggerName = [];
       animation.combineCup(obj, exp.model.cup2);
     }
   }

   var resetCup3Area = exp.setTriggerArea(
     [12, 4, -10], [0, 0, 0], [20, 8, 8], "resetCup3Area", "resetCup3"
   )
   resetCup3Area.MM_inArea = function(obj) {
     if (obj.name == "cup3") {
       obj.position.set(10, 4, -10);
       obj.rotation.set(Math.PI * 0.6, 0, -Math.PI * 0.5);
     } else if (obj.name == "lid3") {
       obj.position.set(21, 4, -10);
       obj.rotation.set(0, Math.PI * 0.5, 0);
     }
   }
   resetCup3Area.MU_inArea = function(obj) {
     if (obj.name == "cup3") {
       if (fzIsOpen) {
         obj.triggerName.push("freezerArea");
       }
       if (scIsOpen) {
         obj.triggerName.push("showcaseArea");
       }
       obj.character.inside = null;
     } else if (obj.name == "lid3") {
       obj.triggerName = [];
       animation.combineCup(obj, exp.model.cup3);
     }
   }
 }


/**
 * 交互动画
 */
var animation = {
  placeBumf: function(bumf, cup) { //bumf(-15, 3, 10)
    var tweenPlaceBumf = new TWEEN.Tween(bumf.position)
      .to({
        x: "-10",
        y: "-3"
      }, 500)
      .easing(TWEEN.Easing.Linear.None)
      .onStart(function () {
        //从可移动模型中删除卫生纸，不可再拖拽
        exp.moveModelArr.forEach(function (item, index, array) {
          if (item == bumf) {
            array.splice(index, 1)
          }
        })
      })
      .onUpdate(function() {

      })
      .onComplete(function() {
        cup.add(bumf);
        bumf.traverse(function(child) {
          if (child instanceof THREE.Mesh) {
            bumf.modelName = cup.name;
          }
        });
        bumf.rotation.set(0, -Math.PI * 0.6, Math.PI * 0.5);
        bumf.scale.set(1.3, 1, 1);
        bumf.position.set(0, 0, 0);
        bumf.children[0].position.set(5, -6, 0);
        //判断卫生纸是否完全添加，然后进行下一步操作取种子
        exp.model.spoon.times++;
        if (exp.model.spoon.times == 4) {
          exp.model.spoon.times = 0;
          exp.model.spoon.triggerName = ["scoopBeans"];
          tool.tip("用勺子取种子然后添加至任意瓶中");
        }
      })
      .start()
  },
  scoopBeans: function(spoon) {
    var tweenScoop1 = new TWEEN.Tween({
        x: 1,
        y: 7
      })
      .to({
        x: [0, -1, -2],
        y: [6, 5, 4.6]
      }, 300)
      .easing(TWEEN.Easing.Linear.None)
      .interpolation(TWEEN.Interpolation.CatmullRom)
      .onStart(function () {
        exp.moveModelArr.forEach(function (item, index, array) {
          if (item == spoon) {
            array.splice(index, 1)
          }
        })
      })
      .onUpdate(function() {
        spoon.position.x = this.x;
        spoon.position.y = this.y;
      })
      .onComplete(function() {
        var tweenScoop2 = new TWEEN.Tween({//取种子
            x: -2,
            y: 4.6,
            rz: Math.PI / 6
          })
          .to({
            x: [-3, -4, -5],
            y: [5, 6, 7],
            rz: Math.PI / 10
          }, 300)
          .easing(TWEEN.Easing.Linear.None)
          .interpolation(TWEEN.Interpolation.CatmullRom)
          .onStart(function() {
            spoon.add(exp.model.beanGroup[spoon.times]);
            exp.model.beanGroup[spoon.times].traverse(function(child) {
              if (child instanceof THREE.Mesh) {
                child.modelName = spoon.name;
              }
            })
            for (var i = 0; i < 8; i++) {
              var radius = Math.random() * 1.6;
              var angle = Math.random() * Math.PI * 2;
              exp.model.beanGroup[spoon.times].children[i].position.set(radius * Math.cos(angle) - 7, 0, radius * Math.sin(angle));
            }
          })
          .onUpdate(function() {
            spoon.position.x = this.x;
            spoon.position.y = this.y;
            spoon.rotation.z = this.rz;
          })
          .onComplete(function() {
            // console.log(exp.model.spoon.triggerNameArr);
            exp.moveModelArr.push(spoon);
            spoon.triggerName = spoon.triggerNameArr;
            // tool.tip("将种子添加至任意瓶中")
          })
          .start()
      })
      .start()
  },
  scoopWater: function(spoon) { //(-25,15,30);(0, 0, Math.PI*0.4);
    var tweenScoopWater1 = new TWEEN.Tween({
        py: 15,
        rz: Math.PI * 0.4
      })
      .to({
        py: [13, 10, 12],
        rz: Math.PI * 0.15
      }, 500)
      .interpolation(TWEEN.Interpolation.Bezier)
      .easing(TWEEN.Easing.Linear.None)
      .onStart(function () {
        exp.moveModelArr.forEach(function (item, index, array) {
          if (item == spoon) {
            array.splice(index, 1)
          }
        })
      })
      .onUpdate(function() {
        spoon.position.y = this.py;
        spoon.rotation.z = this.rz;
        //取水
        if (this.py < 12) {
          spoon.children[1].visible = true;
        }
      })
      .onComplete(function() {
        exp.model.breaker.children[0].scale.y -= 0.02
        exp.moveModelArr.push(spoon);
        spoon.triggerName = spoon.triggerNameArr;
        tool.tip("将水添加至任意瓶中")
      })
      .start()
  },
  pour: function(spoon, index, cup) { //(-8, 7, 10);(0, 0, Math.PI/10);
    var tweenPour1 = new TWEEN.Tween({
        px: spoon.position.x,
        py: spoon.position.y,
        rz: Math.PI / 10
      })
      .to({
        px: "-10",
        py: "-2",
        rz: 0
      }, 500)
      .easing(TWEEN.Easing.Linear.None)
      .onStart(function () {
        exp.moveModelArr.forEach(function (item, index, array) {
          if (item == spoon) {
            array.splice(index, 1)
          }
        })
      })
      .onUpdate(function() {
        spoon.position.x = this.px;
        spoon.position.y = this.py;
        spoon.rotation.z = this.rz;
      })
      .onComplete(function() {
        var tweenPour2 = new TWEEN.Tween({
            rx: 0
          })
          .to({
            rx: Math.PI * 0.6
          }, 500)
          .easing(TWEEN.Easing.Linear.None)
          .onUpdate(function() {
            spoon.rotation.x = this.rx;
          })
          .onComplete(function() {
            spoon.traverse(function(child) {
              if (child.name == "beanGroup" + spoon.times) {
                // console.log(exp.model.beanGroup[spoon.times]);
                cup.add(exp.model.beanGroup[spoon.times]);
                exp.model.beanGroup[spoon.times].traverse(function(child) {
                  if (child instanceof THREE.Mesh) {
                    child.modelName = cup.name;
                  }
                })
                exp.model.beanGroup[spoon.times].rotation.set(0, -Math.PI * 0.6, Math.PI * 0.5)
                for (var i = 0; i < 8; i++) {
                  var x = Math.random() * 6 + 4;
                  var z = Math.random() * 4 - 2;
                  exp.model.beanGroup[spoon.times].children[i].position.set(x, -5, z);
                }
              } else if (child.name == "WaterMesh" && child.visible == true) {
                child.visible = false;
                cup.traverse(function (child) {
                  if (cup.character.waterTimes == 0) {
                    if (child.name == "CupWaterMesh2") {
                      child.children[0].visible = true
                    }
                  } else if (cup.character.waterTimes == 1) {
                    if (child.name == "CupWaterMesh1") {
                      child.children[0].visible = true
                    }
                  }
                });
              }
            })
            //勺子退出瓶体
            var tweenPour3 = new TWEEN.Tween({
                px: spoon.position.x,
                py: spoon.position.y,
                rx: Math.PI * 0.6,
                rz: 0
              })
              .to({
                px: "+10",
                py: "+2",
                rx: 0,
                rz: Math.PI / 10
              }, 500)
              .easing(TWEEN.Easing.Linear.None)
              .onUpdate(function() {
                spoon.position.x = this.px;
                spoon.position.y = this.py;
                spoon.rotation.x = this.rx;
                spoon.rotation.z = this.rz;
              })
              .onComplete(function () {
                exp.moveModelArr.push(spoon);
                spoon.times++; //勺子的使用次数
                if (spoon.times < 4) {
                  // tool.tip("继续添加种子")
                  spoon.triggerName = ["scoopBeans"];
                  spoon.triggerNameArr.splice(index,1);
                } else if (spoon.times == 4) {
                  tool.tip("种子添加完毕，请将勺子放回原处")
                  // spoon.times = 0;
                  spoon.triggerName = ["resetSpoon"]
                  spoon.triggerNameArr = ["openCup0","openCup1", "openCup2", "openCup3"];
                } else {
                  cup.character.waterTimes++;
                  //判断该瓶子是否加满两次水,已加满则不能再次加水
                  if (cup.character.waterTimes > 1) {
                    spoon.triggerNameArr.splice(index,1);
                  }
                  //判断所有瓶子是否加满，已加满则不能继续取水
                  if (spoon.triggerNameArr.length > 0) {
                    tool.tip("继续添加水")
                    spoon.triggerName = ["scoopWater","resetSpoon"]
                  } else {
                    tool.tip("水添加完毕，请将勺子放回原处")
                    spoon.triggerName = ["resetSpoon"]
                  }
                }
              })
              .delay(100)
              .start()
          })
          .start()
      })
      .start()
  },
  combineCup: function(lid, cup) {
    cup.children[0].children[1].add(lid);
    lid.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.modelName = cup.name;
      }
    })
    lid.position.set(0, 0, 0);
    lid.rotation.set(0, 0, 0);
    lid.scale.set(1, 1, 1)
    exp.moveModelArr.push(cup);
    //可移动模型数组里推出瓶盖
    exp.moveModelArr.forEach(function (item, index,array) {
      if (item == lid) {
        array.splice(index, 1);
      }
    })
    //瓶子加盖之后不允许加水了
    // console.log(exp.model.spoon.triggerNameArr);
    exp.model.spoon.triggerNameArr.forEach(function (item, index, array) {
      // console.log("openCup"+ cup.name[3]);
      if (item == "openCup"+cup.name[3]) {
        // console.log(item);
        array.splice(index, 1);
      }
    })
    //判断冰箱和柜子的门是否打开从而确定是否可放入
    if (fzIsOpen) {
      cup.triggerName.push("freezerArea");
    }
    if (scIsOpen) {
      cup.triggerName.push("showcaseArea");
    }
    tool.tip("该瓶子操作完成，可放入橱柜或冰箱")
  },
  openFreezer: function (obj) {
    // console.log("开冰箱");
    var openFreezer = new TWEEN.Tween({rz:0 })
				.to({rz: Math.PI*0.75}, 500)
				.onStart(function () {
					fzIsOpen = true;
          // tool.autoTip("冰箱已打开")
				})
				.onUpdate(function () {
					obj.rotation.z = this.rz;
				})
        .onComplete(function () {
          for (var i = 0; i < 4; i++) {
            if (exp.model["cup"+i].character.inside == "freezer") {
              exp.moveModelArr.push(exp.model["cup"+i]);
              exp.model["cup"+i].triggerName.push("resetCup"+i)
            } else {
              exp.model["cup"+i].triggerName.push("freezerArea")
            }
          }
        })
				.easing(TWEEN.Easing.Linear.None)
				.start();
  },
  closeFreezer: function (obj) {
    // console.log("关冰箱");
    var closeFreezer = new TWEEN.Tween({rz: Math.PI*0.75})
				.to({rz: 0}, 500)
				.onStart(function () {
					fzIsOpen = false;
          for (var i = 0; i < 4; i++) {
            if (exp.model["cup"+i].character.inside == "freezer") {
              exp.moveModelArr.forEach(function (item, index,array) {
                if (item == exp.model["cup"+i]) {
                  array.splice(index, 1);
                }
              })
            } else {
              if (scIsOpen) {
                exp.model["cup"+i].triggerName = ["showcaseArea"];
              } else {
                exp.model["cup"+i].triggerName = [];
              }
            }
          }
				})
				.onUpdate(function () {
					obj.rotation.z = this.rz;
				})
				.onComplete(function () {
          // tool.autoTip("冰箱已关闭");
				})
				.easing(TWEEN.Easing.Linear.None)
				.start();
  },
  openShowcase: function (obj) {
    // console.log("开柜子");
    var openShowCaseDoor = new TWEEN.Tween({ry:0 })
				.to({ry: - Math.PI*0.75}, 500)
				.onStart(function () {
					scIsOpen = true;
          // tool.autoTip("柜子已打开")
				})
				.onUpdate(function () {
					obj.rotation.y = this.ry;
				})
        .onComplete(function () {
          for (var i = 0; i < 4; i++) {
            if (exp.model["cup"+i].character.inside == "showcase") {
              exp.moveModelArr.push(exp.model["cup"+i]);
              exp.model["cup"+i].triggerName.push("resetCup"+i)
            } else {
              exp.model["cup"+i].triggerName.push("showcaseArea")
            }
          }
        })
				.easing(TWEEN.Easing.Linear.None)
				.start();
  },
  closeShowcase: function (obj) {
    // console.log("关柜子");
    var closeShowCaseDoor = new TWEEN.Tween({ry: - Math.PI*0.75})
				.to({ry: 0}, 500)
				.onStart(function () {
					scIsOpen = false;
          for (var i = 0; i < 4; i++) {
            if (exp.model["cup"+i].character.inside == "showcase") {
              exp.moveModelArr.forEach(function (item, index,array) {
                if (item == exp.model["cup"+i]) {
                  array.splice(index, 1);
                }
              })
            } else {
              if (fzIsOpen) {
                exp.model["cup"+i].triggerName = ["freezerArea"];
              } else {
                exp.model["cup"+i].triggerName = [];
              }
            }
          }
				})
				.onUpdate(function () {
					obj.rotation.y = this.ry;
				})
        .onComplete(function () {
          // tool.autoTip("柜子已关闭")
        })
				.easing(TWEEN.Easing.Linear.None)
				.start();
  },
  beanSprouted: function (cup, index) {
    // console.log(cup.name + "里的种子要发芽了");
    cup.traverse(function (child) {
      if (child.name == "CupWaterMesh2") {
        child.children[0].visible = false;
      }
    })
    cup.remove(cup.children[2]);//移除绿豆种子，偷懒没写遍历
    var beanReplace = exp.model.beanSprouted;
    cup.add(beanReplace[index]);
    beanReplace[index].traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.modelName = cup.name;
      }
    })
    beanReplace[index].rotation.set(0, -Math.PI * 0.6, Math.PI * 0.5)
    for (var i = 0; i < 8; i++) {
      var x = Math.random() * 7 + 4;
      var z = Math.random() * 4 - 2;
      var angle = Math.random() * Math.PI * 2;
      beanReplace[index].children[i].position.set(x, -5.2, z);
      beanReplace[index].children[i].rotation.set(0, angle, 0);
    }
  },


}
/**
 *
 */

//开始提示，可做成按钮
exp.onLoad = function() {
  tool.tip("打开瓶盖，将卫生纸放入瓶中");
};

//按钮操作
if($("#startExp")) { //删除之前定义的按钮，便于重置时设置便签属性
  $("#startExp").remove();
}
$("body").append('<button id="startExp" class="center-btn">两天之后</button>'); //添加按钮并隐藏
$("#startExp").hide();

//开始萌发
$(document).on("click", "#startExp", function () {
  var cupArr = [
    exp.model.cup0,
    exp.model.cup1,
    exp.model.cup2,
    exp.model.cup3,
  ];
  if (!fzIsOpen && !scIsOpen) {//判断门是否关闭
    var everyResult = cupArr.every(function (item, index, array) {
      return (item.character.inside)
    });//遍历是否所有瓶子已放置储藏
    if (everyResult) {//两天之后
      layer.close(layer.index);
      tool.wholeScreenTip("两天之后", 2000, function () {
        tool.tip("将瓶子取出，放置于桌面，观察")
      }, function () {
        $("#startExp").hide();
        //判断是否符合种子萌发条件
        cupArr.forEach(function (item, index, array) {
          if (item.character.inside == "showcase" && item.character.waterTimes == 1) {
            animation.beanSprouted(item, index);
          }
        })
      })
    } else {
      console.log("有瓶子未放置");
      layer.alert('有瓶子未放置，请继续实验', {
        icon: 2,
        anim: 6,
        offset: '100px',
        btn: ['哦']
      });
    }
  } else {
    console.log("门没关好");
    layer.alert('门没关好，请继续实验', {
      icon: 2,
      anim: 6,
      offset: '100px',
      btn: ['哦']
    });
  }
})

//点击监听事件
exp.renderer.domElement.addEventListener("click", onClick, false);
var fzIsOpen = false, scIsOpen = false;
function onClick (event) {
  // console.log("点击事件");
  var Intersects = exp.raycaster.intersectObjects(exp.modelArr, true);
  if (Intersects.length > 0) {
    var obj = Intersects[0].object;
    //判断
    // console.log(obj);
    if (!TWEEN.getAll().length) {
      switch (obj.name) {
        case "ShowCaseDoor":
          if (!scIsOpen) {
            animation.openShowcase(obj);
          } else {
            animation.closeShowcase(obj);
          }
          break;
        default:

      }
      switch (obj.parent.name) {
        case "FreeZer_02":
          if (!fzIsOpen) {
            animation.openFreezer(obj);
          } else {
            animation.closeFreezer(obj);
          }
          break;
        default:
      }
    }
  }
}


/**
 * 渲染
 */

function render() {
  requestAnimationFrame(render);
  TWEEN.update();
  exp.controls.update();
  exp.render();
}
})();
