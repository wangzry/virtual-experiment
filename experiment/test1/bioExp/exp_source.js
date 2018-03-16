(function () {
//重置功能

$(".reset").click(function() {
  // resetExpScene();
  location.reload();
});
//初始化场景
var exp = new RainierWebGL("#app");

exp.init();
exp.setBasicScene(1);

exp.camera.position.set(0, 65, 100);
exp.camera.lookAt(new THREE.Vector3(0, 0, 0));
exp.controls.target = new THREE.Vector3(0, 0, 0);


loadExpModel();
createTriggerArea();
animate();

/**
 * 定义全局变量
 */


/**
 * 加载模型
 */
function loadExpModel() {
  //玻璃材质
  var matGlass = exp.glassMaterial.clone();
  matGlass.opacity = 0.5;
  matGlass.side = THREE.FrontSide;

  //烧杯
  exp.objLoader.load(rootUrl + "/model/breaker/Breaker.obj", function(obj) {
    obj.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = matGlass.clone();
        // if (child.name == "BeakerBody200ml") {
        //   child.material = matGlass.clone();
        // } else {
        //   child.material.transparent = true;
        //   child.material.opacity = 0.1;
        //   child.position.y = 0.01; //不设置看不到烧杯底部
        // }
      }
      obj.position.set(30,0,0);
      obj.scale.set(1.5,1.3,1.5);
      obj.name = "breaker";
      exp.expScene.add(obj);
    });
  //   exp.setMoveModel(
  //     obj, [30, 0, 0], [0, 0, 0], [1.5, 1.3, 1.5],
  //     "breaker", {}
  //   )
  });

  //培养皿和黑豆
  exp.objLoader.load(rootUrl + "/model/dish/Dish.obj", function(obj) {
    obj.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        child.material = matGlass.clone();
      }
    });
    obj.scale.set(1.5, 1.5, 1.5);
    obj.position.set(-30, 0, 0);
    exp.expScene.add(obj);
  });

  //培养皿和纱布
  var matGauze = exp.textureMaterial(
    "dish/gauze", {
      D: "Gauze_Diffuse.png",
      N: "Gauze_Normal.png",
      S: "Gauze_Specular.png",
    }
  )
  exp.objLoader.load(rootUrl + "/model/dish/dish_and_gauze.obj", function(obj) {
    obj.traverse(function(child) {
      if (child instanceof THREE.Mesh) {
        if (child.name == "CultureDish") {
          // child.visible = false;
          child.material = matGlass.clone();
        } else if (child.name == "Gauze") {
          child.visible = false;
          child.material = matGauze.clone();
          // child.material.envMap = exp.envMap;
        }
      }
    })
    obj.name = "dish";
    obj.scale.set(1.5, 1.5, 1.5);
    obj.position.set(0, 0, 0);
    exp.expScene.add(obj);
    exp.model.dish = obj;
  })

  //纱布
  exp.objLoader.load(rootUrl + "/model/dish/Gauze.obj", function(obj) {
    obj.traverse(function(child) {
      child.material = matGauze.clone()
    })
    exp.setMoveModel(
      obj, [-20, 0, 20], [0, 0, 0], [1.6, 1.6, 1.6],
      "gauze", {
        triggerName: ["dishArea"]
      }
    )
    exp.moveModelArr.push(obj)
  })

  // //卫生纸
  // var matBumf = exp.textureMaterial(
  //   "Bumf", {
  //     D: "Bumf_1_D.png",
  //     N: "Bumf_1_N.png",
  //     S: "Bumf_1_S.png"
  //   }
  // );
  // exp.objLoader.load(rootUrl + "/model/Bumf/Bumf_01.obj", function(obj) {
  //   obj.traverse(function(child) {
  //     if (child instanceof THREE.Mesh) {
  //       child.material = matBumf;
  //     }
  //   });
  //   obj.position.set(15, 0, 20);
  //   obj.scale.set(1, 1, 1);
  //   exp.expScene.add(obj)
  // });

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
          child.material.opacity = 0.1;
        } else {
          child.material = matSpoon.clone();
        }
      }
    });
    exp.setMoveModel(
      spoon, [20, 0.6, 20], [0, 0, -Math.PI / 40], [1, 1, 1],
      "spoon", {
        // triggerName: ["scoopBeans","scoopWater"]
      }
    );
    // exp.setMoveModel(
    //   spoon, [32, 7.5, 20], [0, 0, Math.PI/3.5], [1, 1, 1],
    //   "spoon", {  }
    // );
    exp.moveModelArr.push(spoon);
  });

  //种子
  var bean = [],
    beanGroup = new THREE.Group(),
    matBean1 = exp.textureMaterial("bean", {
      D: "Part0_BaseColor.png"
    }),
    matBean2 = exp.textureMaterial("bean", {
      D: "Root_BaseColor.png"
    }),
    matBean3 = exp.textureMaterial("bean", {
      D: "Part1_BaseColor.png"
    }),
    matBean4 = exp.textureMaterial("bean", {
      D: "Part2_BaseColor.png",
      N: "Part2_BaseColor_N.png"
    });
  exp.daeLoader.load(rootUrl + "/model/bean/bean.dae", function(collada) {
    for (var i = 0; i < 50; i++) {
      bean[i] = collada.scene.clone();
      bean[i].name = "bean" + i;
      bean[i].shape = [];
      bean[i].traverse(function(child) {
        if (child instanceof THREE.Object3D) {
          // console.log(child.name);
          switch (child.name) {
            case "Bean01":
              // child.visible = false;
              bean[i].shape.push(child);
              child.children[0].material = matBean1.clone();
              break;
            case "part20":
              child.children[0].material = matBean1.clone();
              break;
            case "Bean02":
            case "Bean03":
            case "Bean04":
              bean[i].shape.push(child);
              child.visible = false;
              child.children[0].material = matBean2.clone();
              break;
            case "part21":
            case "part31":
            case "part41":
              child.children[0].material = matBean3.clone();
              break;
            case "part32":
            case "part42":
              child.children[0].material = matBean4.clone();
              break;
            default:
          }
        }
      })

      var radius = Math.random() * 5 + 0.5;
      var angle = Math.random() * Math.PI * 2;
      bean[i].position.set(radius * Math.cos(angle) - 30, 0.5, radius * Math.sin(angle));
      bean[i].rotation.set(0, angle, 0);
      // bean[i].scale.set(0.01,0.01,0.01);
      beanGroup.add(bean[i]);
    }
    exp.model.bean = bean;
    exp.expScene.add(beanGroup);
    // console.log(beanGroup);
  })


  //.....
}


/**
 * 创建交互区域
 */
function createTriggerArea() {
  var dishArea = exp.setTriggerArea(
     [0, 3, 0], [0, 0, 0], [12, 6, 12],"dishArea", "dishArea"
  )
  // {
  //     triggerName: ["dishArea", "dishArea", "dishArea"]
  //   }
  dishArea.MM_inArea = function(obj) {
    obj.traverse(function(child) {
      switch (child.name) {
        case "gauze":
          child.visible = false;
          exp.model.dish.children[1].visible = true;
          break;
        case "spoon":
          child.position.set(7, 8, 0);
          child.rotation.set(0, 0, Math.PI / 10);
          break;
        default:
      }
    })
  }
  dishArea.MM_outArea = function(obj) {
    obj.traverse(function(child) {
      switch (child.name) {
        case "gauze":
          exp.model.dish.children[1].visible = false;
          break;
        default:
      }
    })
  }
  dishArea.MU_inArea = function(obj) {
    obj.traverse(function(child) {
      switch (child.name) {
        case "gauze":
          obj.visible = false;
          exp.model.spoon.triggerName = ["scoopBeans"]
          tool.tip("用勺子取黑豆种子")
          break;
        case "spoon":
          animation.pour(obj);
          break;
        default:
      }
    })
  }

  var scoopBeansArea = exp.setTriggerArea(
    [-30, 2, 0], [0, 0, 0], [12, 4, 12], "scoopBeansArea", "scoopBeans"
  )
  scoopBeansArea.MM_inArea = function(obj) {
    obj.position.set(-18, 8, 0);
    obj.rotation.set(0, 0, Math.PI / 6);
  }
  scoopBeansArea.MU_inArea = function(obj) {
    animation.scoopBeans(obj);
  }

  var scoopWaterArea = exp.setTriggerArea(
    [30, 6, 0], [0, 0, 0], [10, 12, 10],"scoopWaterArea", "scoopWater"
  )
  scoopWaterArea.MM_inArea = function(obj) {
    if (day < 1) {
      obj.position.set(36, 18, 0);
      obj.rotation.set(0, 0, Math.PI * 0.4);
    } else {
      obj.position.set(32, 7.5, 0);
      obj.rotation.set(0, 0, Math.PI / 3.5);
    }
  }
  scoopWaterArea.MU_inArea = function(obj) {
    if (day < 1) {
      animation.scoopWater(obj);
    } else {
      obj.triggerName = [];
      tool.tip("进入下一天");
      $("#nextDay").show();
    }
  }


}


/**
 * 交互动画
 */
var animation = {
  scoopBeans: function(spoon) {
    var tweenScoop1 = new TWEEN.Tween({
        x: -18,
        y: 8
      })
      .to({
        x: [-18.5, -20, -23],
        y: [7, 6, 5]
      }, 300)
      .easing(TWEEN.Easing.Linear.None)
      .interpolation(TWEEN.Interpolation.CatmullRom)
      .onStart(function() {
        exp.moveModelArr.forEach(function(item, index, array) {
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
        var tweenScoop2 = new TWEEN.Tween({ //取种子
            x: -23,
            y: 5,
            rz: Math.PI / 5
          })
          .to({
            x: [-26, -28],
            y: [6, 7, ],
            rz: Math.PI / 10
          }, 300)
          .easing(TWEEN.Easing.Linear.None)
          .interpolation(TWEEN.Interpolation.CatmullRom)
          .onStart(function() {
            for (var i = 0; i < 25; i++) {
              spoon.add(exp.model.bean[i]);
              exp.model.bean[i].traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                  child.modelName = spoon.name;
                }
              });
              var x = -Math.random() * 4 - 4.5;
              var y = Math.random() * 1.8 - 1;
              exp.model.bean[i].position.set(x, 0, y);
              exp.model.bean[i].scale.set(0.008, 0.008, 0.008)

            }
          })
          .onUpdate(function() {
            spoon.position.x = this.x;
            spoon.position.y = this.y;
            spoon.rotation.z = this.rz;
          })
          .onComplete(function() {
            exp.moveModelArr.push(spoon);
            spoon.triggerName = ["dishArea"];
            tool.tip("添加至放有纱布的培养皿中")
          })
          .start()
      })
      .start()

  },
  scoopWater: function(spoon) {
    var tweenScoopWater1 = new TWEEN.Tween({
        px: 36,
        py: 18,
        rz: Math.PI * 0.4
      })
      .to({
        px: [35, 34.5, 34],
        py: [15, 10, 14],
        rz: Math.PI * 0.15
      }, 300)
      .interpolation(TWEEN.Interpolation.Bezier)
      .easing(TWEEN.Easing.Linear.None)
      .onStart(function() {
        exp.moveModelArr.forEach(function(item, index, array) {
          if (item == spoon) {
            array.splice(index, 1)
          }
        })
      })
      .onUpdate(function() {
        spoon.position.x = this.px;
        spoon.position.y = this.py;
        spoon.rotation.z = this.rz;
        //取水
        if (this.py < 13) {
          spoon.children[1].visible = true;
        }
      })
      .onComplete(function() {
        exp.moveModelArr.push(spoon);
        spoon.triggerName = ["dishArea"];
        tool.tip("添加至放有纱布的培养皿中")
      })
      .start()
  },
  pour: function(spoon) {
    var tweenPour1 = new TWEEN.Tween(spoon.rotation)
      .to({
        x: Math.PI / 2,
        y: Math.PI / 10
      }, 300)
      .easing(TWEEN.Easing.Linear.None)
      .onStart(function() {
        exp.moveModelArr.forEach(function(item, index, array) {
          if (item == spoon) {
            array.splice(index, 1)
          }
        })
      })
      .onComplete(function() {
        if (spoon.children.length > 2) {
          // //八卦排列
          //  var px = [0], pz = [0], ry = [0];
          //  for (var r = 2; r < 8; r+=2) {
          //    for (var t = 0; t < Math.PI*2; t+=Math.PI/4) {
          //      px.push(r*Math.cos(t));
          //      pz.push(r*Math.sin(t));
          //      ry.push(t);
          //    }
          //  }
          // 正方形打野
          var px = [],
            pz = [];
          for (var x = 0; x <= 8; x += 2) {
            for (var z = 0; z <= 8; z += 2) {
              px.push(x - 4);
              pz.push(z - 4);
            }
          }
          var group = new THREE.Group();
          for (var i = 0; i < 25; i++) {
            group.add(exp.model.bean[i]);
            exp.expScene.add(group);
            // exp.expScene.add(exp.model.bean[i]);
            exp.model.bean[i].position.set(px[i], 0.4, pz[i]);
            // exp.model.bean[i].rotation.set(0,Math.PI-ry[i],0);
            // exp.model.bean[i].shape[0].visible = false;
            // exp.model.bean[i].shape[2].visible = true;
            // console.log(exp.model.bean[i]);
          }
          group.rotation.y = Math.PI / 4;
          exp.moveModelArr.push(spoon);
          spoon.triggerName = ["scoopWater"]
          tool.tip("用勺子取烧杯中的水");
        } else {
          spoon.children[1].visible = false;
          matDishWater = exp.model.dish.children[1].material.clone();
          exp.model.dish.children[1].material.envMap = exp.envMap;
          exp.model.dish.children[1].material._needsUpdate = true;
          exp.moveModelArr.push(spoon);
          spoon.triggerName = ["scoopWater"];
          day++;
          tool.tip("把勺子放回烧杯，进入下一天观察");
        }
      })
      .start()
  },
  moveCamera: function() {
    var moveCamera = new TWEEN.Tween(exp.camera.position)
      .to({
        x: 0,
        y: 25,
        z: 15
      }, 1000)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onStart(function() {
        $("#startOb").hide();
      })
      .onUpdate(function() {

      })
      .onComplete(function() {
        $("#stopOb").show();
        exp.isStaticView = true;
        exp.controls.maxDistance = 30;
        exp.controls.minDistance = 30;
      })
      .start()
  },
  resetCamera: function() {
    var resetCamera = new TWEEN.Tween(exp.camera.position)
      .to({
        x: 0,
        y: 65,
        z: 100
      }, 1000)
      .easing(TWEEN.Easing.Cubic.InOut)
      .onStart(function() {
        $("#stopOb").hide();
        exp.isStaticView = false;
        exp.controls.maxDistance = 250;
        exp.controls.minDistance = 10;
      })
      .onUpdate(function() {

      })
      .onComplete(function() {
        if (day < 6) {
          tool.tip("请浇水保持培养皿湿润");
          exp.model.spoon.triggerName.push("dishArea");
          exp.model.spoon.children[1].visible = true;
        } else {
          tool.tip("实验结束");
          exp.modelArr = [];
          exp.moveModelArr = [];
        }
      })
      .start()
  },
  dayByDay: function() {
    layer.close(layer.index);
    tool.wholeScreenTip(date[day], 2000, function() {
      tool.tip("观察" + date[day] + "种子发芽率");
      // $("#startOb").show();
      animation.moveCamera();
    }, function() {
      $("#nextDay").hide();
      beanSprout();
    })
  },

}

/**
 * 种子发芽核心算法
 */
var matDishWater,
  day = 0,
  date = [
    "第一天",
    "第二天",
    "第三天",
    "第四天",
    "第五天",
    "第六天",
    "第七天"
  ],
  num = [
    0,
    Math.round(Math.random() * 4 + 1),
    Math.round(Math.random() * 3 + 5),
    Math.round(Math.random() * 4 + 10),
    Math.round(Math.random() * 5 + 16),
    Math.round(Math.random() * 2 + 23),
    0
  ],
  beanArr1 = [],
  beanArr2 = [],
  beanArr3 = [],
  beanArr4 = [];

console.log(num);
/* 块级注释
 * 从25个种子中随机取出x个种子
 实现方法，将0-24个数随机排序，然后从前往后依次取x个数，
 作为种子的index，模拟随机取种子
 */
var beanIndex = [];
for (var i = 0; i < 25; i++) {
  beanIndex.push(i)
}
beanIndex.sort(function() {
  return Math.random() * 2 - 1
});
console.log(beanIndex);

//发芽
function beanSprout() {
  exp.model.dish.children[1].material = matDishWater;
  switch (day) {
    case 1:
      sprout1()
      break;
    case 2:
      sprout2();
      sprout1();
      break;
    case 3:
    case 4:
    case 5:
      sprout3();
      sprout2();
      sprout1();
      break;
    case 6:
      sprout3();
      sprout2();
      break;
    default:
  }
}
//状态变化一
function sprout1() {
  beanArr1 = [];
  for (var i = 0; i < num[day] - num[day - 1]; i++) {
    var bean = exp.model.bean[beanIndex.shift()];
    // console.log(bean);
    bean.shape[0].visible = false;
    bean.shape[3].visible = true;
    beanArr1.push(bean);
  }
  //  console.log(beanArr1);
}
//状态变化二
function sprout2() {
  beanArr2 = [];
  beanArr1.forEach(function(item, index, array) {
    item.shape[3].visible = false;
    item.shape[1].visible = true;
    beanArr2.push(item);
  })
}
//状态变化三
function sprout3() {
  beanArr3 = [];
  beanArr2.forEach(function(item, index, array) {
    item.shape[1].visible = false;
    item.shape[2].visible = true;
    beanArr3.push(item);
  })
}
/**
 * 按钮及提示操作
 */

exp.onLoad = function() {
  tool.tip("将纱布放至空的培养皿中");
};

$("body").append('<button id="startOb" class="center-btn">一键观察</button>');
$("body").append('<button id="stopOb" class="center-btn">结束观察</button>');
$("body").append('<button id="nextDay" class="center-btn">下一天</button>');
$("#startOb").hide();
$("#stopOb").hide();
$("#nextDay").hide();

$(document).on("click", "#startOb", animation.moveCamera);
$(document).on("click", "#stopOb", animation.resetCamera);
$(document).on("click", "#nextDay", animation.dayByDay);

function resetExpScene() {
  // exp.controls.reset();
  //...

}


/**
 * 渲染
 */

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  exp.controls.update();
  exp.render();
}
})();
