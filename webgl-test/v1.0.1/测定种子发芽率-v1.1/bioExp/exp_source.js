(function() {
	var judgeLoaded = setInterval( function (){

		if( allJsLoaded ){

			clearInterval(judgeLoaded);

            var exp;

            var waterColor = new THREE.Color(0x7f7f7f);

			// 重置
			$(document).on("click", ".reset", function() {
                exp.setting.reset();
				exp.setExpScene();
			});

			exp = new RainierWebGL( {
				appId : "#app",
                sceneId : 1
			} );

			exp.setting.init( {
				app : exp.app ,
				renderer : exp.renderer ,
                light : exp.light 
			} );

			exp.loader.isUse = true;		

			exp.loader.load([
				[ 'Breaker' , 'Breaker.obj'],
				[ 'Bean' , 'Bean.dae'],
                ['Dish','Dish.obj','dish_and_gauze.obj','Gauze.obj'],
                ['Spoon','Spoon.obj']
			]);

			exp.loader.imgPath = 'model';
			exp.loader.imgLoader([
                ['Bean','Part0_BaseColor.png','Root_BaseColor.png','Part1_BaseColor.png','Part2_BaseColor.png','Part2_BaseColor_N.png'],
                ['Dish','Gauze_D.jpg','Gauze_N.jpg'],
                ['Spoon','Spoon_D.png','Spoon_R.png']
			]);

            exp.app.append('<div class="singleBtn" id="nextDayBtn">进入下一天</div>');
            var nextDayBtn = document.getElementById('nextDayBtn');
			
			exp.assemblyModel = function (){
                //勺子
				exp.allMaterials.Spoon = exp.setMaterial({
                    D:exp.allImages.Spoon.Spoon_D,
                    R:exp.allImages.Spoon.Spoon_R,
                    envMap:exp.envMap
				});

                //纱布
                exp.allMaterials.Gauze = exp.setMaterial({
                    metalness:0,
                    D:exp.allImages.Dish.Gauze_D,
                    N:exp.allImages.Dish.Gauze_N,
                    color:0xa7a7a7
                });

                //种子
                exp.allMaterials.Bean1 = exp.setMaterial({
                    metalness:0,
                    D:exp.allImages.Bean.Part0_BaseColor
                });

                exp.allMaterials.Bean2 = exp.setMaterial({
                    metalness:0,
                    D:exp.allImages.Bean.Root_BaseColor
                });

                exp.allMaterials.Bean3 = exp.setMaterial({
                    metalness:0,
                    D:exp.allImages.Bean.Part1_BaseColor
                });

                exp.allMaterials.Bean4 = exp.setMaterial({
                    metalness:0,
                    D:exp.allImages.Bean.Part2_BaseColor,
                    N:exp.allImages.Bean.Part2_BaseColor_N
                });
			}

			exp.sourceLoaded = function (){

                nextDayBtn.style.display = 'none';

                var p;

                //种子发芽核心算法
                var day = 0,
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

                  var  beanIndex = [];
                  for (var i = 0; i < 25; i++) {
                    beanIndex.push(i)
                  }
                  beanIndex.sort(function() {
                    return Math.random() * 2 - 1
                  });

                //勺子
                var spoon = exp.allModels.Spoon.Spoon.clone();
                spoon.traverse(function(child){
                    if(child.isMesh){
                        if(child.name === 'range' || child.name === "WaterMesh"){
                            child.material = exp.allMaterials.water.clone();
                            child.material.visible = false;
                        }else{
                            child.material = exp.allMaterials.Spoon.clone();
                            child.castShadow = true;
                        }
                    }
                });
                spoon.setAll({
                    pos:[20, 0.6, 20], 
                    rot:[0, 0, -Math.PI / 40], 
                    name:'spoon',
                    trigName:'scoopBeans',
                    showName:'勺子'
                });
                var spoonWater = spoon.getObjectByName('WaterMesh');

                //纱布
                var gauze = exp.allModels.Dish.Gauze.clone();
                gauze.traverse(function(child){
                    if(child.isMesh){
                        child.material = exp.allMaterials.Gauze.clone();
                        child.castShadow = true;
                    }
                });
                gauze.setAll({
                    pos:[-20, 0, 20],
                    sca:1.6,
                    name:'gauze',
                    trigName:'moveGauze',
                    showName:'纱布',
                    MM:function(obj){
                        innerGauze.visible = false;
                    }
                });

                //烧杯
                var breaker = exp.allModels.Breaker.Breaker.clone();
                breaker.setAll({
                    pos:[30,0,0],
                    sca:[1.5,1.3,1.5],
                    name:'breaker',
                    showName:'烧杯'
                });
                breaker.traverse(function(child){
                    if(child.isMesh){
                        if(child.name === 'BeakerWater200ml'){
                            child.material = exp.allMaterials.water.clone();
                            child.setAll({
                                name:'BeakerWater200ml',
                                showName:'清水'
                            });
                        }
                        if(child.name === 'BeakerBody200ml'){
                            child.material = exp.allMaterials.glassMaterial.clone();
                        }
                        child.castShadow = true;
                    }
                });

                //带纱布的培养皿
                var dishGauze = exp.allModels.Dish.dish_and_gauze.clone();
                dishGauze.setAll({
                    sca:1.5,
                    name:'dishGauze',
                    showName:'培养皿'
                });
                dishGauze.traverse(function(child){
                    if(child.isMesh){
                        if(child.name === 'CultureDish'){
                            child.material = exp.allMaterials.glassMaterial.clone();
                        }
                        if(child.name === 'Gauze'){
                            child.material = exp.allMaterials.Gauze.clone();
                            child.setAll({
                                name:'Gauze',
                                showName:'纱布'
                            });
                            child.castShadow = true;
                            child.receiveShadow = true;
                            child.visible = false;
                        }
                    }
                });
                var innerGauze = dishGauze.getObjectByName('Gauze');

                //培养皿
                var dish = exp.allModels.Dish.Dish.clone();
                dish.traverse(function(child){
                    if(child.isMesh){
                        child.material = exp.allMaterials.glassMaterial.clone();
                    }
                });
                dish.setAll({
                    pos:[-30,0,0],
                    sca:1.5,
                    name:'dish',
                    showName:'培养皿'
                });

                var bean = [];
                var beanGroup = new THREE.Group();
                for (var i = 0; i < 50; i++) {
                    bean[i] = exp.allModels.Bean.Bean.clone();
                    bean[i].shape = [];
                    bean[i].traverse(function(child) {
                      if (child.isObject3D) {
                        switch (child.name) {
                          case "Bean01":
                            bean[i].shape.push(child);
                            child.children[0].material = exp.allMaterials.Bean1.clone();
                            break;
                          case "part20":
                            child.children[0].material = exp.allMaterials.Bean1.clone();
                            break;
                          case "Bean02":
                          case "Bean03":
                          case "Bean04":
                            bean[i].shape.push(child);
                            child.visible = false;
                            child.children[0].material = exp.allMaterials.Bean2.clone();
                            break;
                          case "part21":
                          case "part31":
                          case "part41":
                            child.children[0].material = exp.allMaterials.Bean3.clone();
                            break;
                          case "part32":
                          case "part42":
                            child.children[0].material = exp.allMaterials.Bean4.clone();
                            break;
                        }
                        child.castShadow = true;
                      }
                    })

                    var radius = Math.random() * 5 + 0.5;
                    var angle = Math.random() * Math.PI * 2;
                    bean[i].setAll({
                        pos:[radius * Math.cos(angle) - 30, 0.5, radius * Math.sin(angle)],
                        rot:[0, angle, 0],
                        name:'bean'+1,
                        showName:'黑豆'
                    });
                    beanGroup.add(bean[i]);
                    beanGroup.name = 'allBeans';
                  }
                  

                //为场景添加模型
                exp.expScene.add(spoon);
                exp.expScene.add(gauze);
                exp.expScene.add(breaker);
                exp.expScene.add(dishGauze);
                exp.expScene.add(dish);
                exp.expScene.add(beanGroup);

                exp.tip('请将纱布放置于空的培养皿中');

                exp.drag.add(gauze);

                //培养皿交互区域
                var gauzeDishArea = exp.drag.createArea({name:'gauzeDishArea'});
                gauzeDishArea.setAll({
                    pos:[0,10,0],
                    sca:[12, 20, 12],
                    name:'gauzeDishArea',
                    trigName:'moveGauze',
                    MM:function(obj){
                        if(obj.name === 'gauze'){
                            obj.visible = false;
                            innerGauze.visible = true;
                        }
                        if(obj.name === 'spoon'){
                            obj.position.set(7, 8, 0);
                            obj.rotation.set(0, 0, Math.PI / 10);
                        }
                    },
                    MU:function(obj){
                        if(obj.name === 'gauze'){
                            exp.tip('请用勺子取黑豆种子');
                            exp.drag.add(spoon);
                            obj.visible = false;
                            innerGauze.visible = true;
                        }
                        if(obj.name === 'spoon'){
                            pour(obj);
                        }
                    }
                });

                //烧杯交互区域
                var scoopWaterArea = exp.drag.createArea({name:'scoopWaterArea'});
                scoopWaterArea.setAll({
                    pos:[30, 15, 0],
                    sca:[12,30,12],
                    name:'scoopWaterArea',
                    trigName:'scoopWater',
                    MM:function(obj){
                        obj.position.set(36, 18, 0);
                        obj.rotation.set(0, 0, Math.PI * 0.4);
                    },
                    MU:function(obj){
                        scoopWater(obj);
                    }
                })

                //获取黑豆
                var scoopBeansArea = exp.drag.createArea({name:'scoopBeansArea'});
                scoopBeansArea.setAll({
                    pos:[-30, 10, 0], 
                    sca:[12, 20, 12],
                    name:'scoopBeansArea',
                    trigName:'scoopBeans',
                    MM:function(obj){
                        obj.position.set(-18, 8, 0);
                        obj.rotation.set(0, 0, Math.PI / 6);
                    },
                    MU:function(obj){
                        scoopBeans(obj);
                    }
                });


                function scoopBeans(spoon) {
                    exp.removeOutline();
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
                              spoon.add(bean[i]);
                              spoon.setAll({
                                name:spoon.name
                              });
                              var x = -Math.random() * 4 - 4.5;
                              var y = Math.random() * 1.8 - 1;
                              bean[i].setAll({
                                pos:[x, 0, y],
                                sca:0.008
                              });

                            }
                          })
                          .onUpdate(function() {
                            spoon.position.x = this.x;
                            spoon.position.y = this.y;
                            spoon.rotation.z = this.rz;
                          })
                          .onComplete(function() {
                            spoon.triggerName = "dishArea";
                            gauzeDishArea.triggerName = 'dishArea';
                            exp.drag.add(spoon);
                            exp.tip("请添加到放有纱布的培养皿中");
                          })
                          .start()
                      })
                      .start()

                  }

                  //勺子放置方法
                  function pour(spoon) {
                    exp.removeOutline();
                    var tweenPour1 = new TWEEN.Tween(spoon.rotation)
                      .to({
                        x: Math.PI / 2,
                        y: Math.PI / 10
                      }, 300)
                      .easing(TWEEN.Easing.Linear.None)
                      .onComplete(function() {
                        if (spoon.children.length > 3) {
                          //八卦排列
                           // var px = [0], pz = [0], ry = [0];
                           // for (var r = 2; r < 8; r+=2) {
                           //   for (var t = 0; t < Math.PI*2; t+=Math.PI/4) {
                           //     px.push(r*Math.cos(t));
                           //     pz.push(r*Math.sin(t));
                           //     ry.push(t);
                           //   }
                           // }
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
                            group.add(bean[i]);
                            bean[i].position.set(px[i], 0.4, pz[i]);
                            bean[i].setAll({
                                name:'bean',
                                showName:'黑豆'
                            });
                          }
                          exp.expScene.add(group);
                          group.rotation.y = Math.PI / 4;
                          exp.drag.add(spoon);
                          spoon.triggerName = "scoopWater";
                          exp.tip("用勺子取烧杯中的水");
                        } else {
                          spoonWater.material.visible = false;
                          if(!innerGauze.initColor)innerGauze.initColor = innerGauze.material.color.clone();
                          innerGauze.material.color = waterColor.clone();
                          spoon.setAll({
                            pos:[32, 7.5, 0],
                            rot:[0,0,Math.PI / 3.5]
                          });
                          day++;
                          exp.tip("请点击按钮进入下一天");
                          nextDayBtn.style.display = 'block';
                        }
                      })
                      .start()
                  }

                  //加水
                  function scoopWater(spoon) {
                    exp.removeOutline();
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
                      .onUpdate(function() {
                        spoon.position.x = this.px;
                        spoon.position.y = this.py;
                        spoon.rotation.z = this.rz;
                        //取水
                        if (this.py < 13) {
                          spoonWater.material.visible = true;
                        }
                      })
                      .onComplete(function() {
                        spoon.triggerName = "dishArea";
                        exp.tip("请添加到放有纱布的培养皿中");
                        exp.drag.add(spoon);
                        gauzeDishArea.triggerName = 'dishArea';
                      })
                      .start()
                  }

                  //发芽
                    function beanSprout() {
                      innerGauze.material.color = innerGauze.initColor.clone();
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
                        var oneBean = bean[beanIndex.shift()];
                        // console.log(bean);
                        oneBean.shape[0].visible = false;
                        oneBean.shape[3].visible = true;
                        beanArr1.push(oneBean);
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

                    nextDayBtn.onclick = function(){
                        exp.wholeScreenTip(
                            date[day],1800, {
                            end:function(){
                                if(!p){
                                    p = exp.addPoint({
                                        pos:[0,2,8]
                                    });
                                    p.clickFn = function(){
                                        exp.moveCameraFocus({
                                            target : [ 0 , -3 , 0],
                                            pos : [ 0 , 22 , 15 ],
                                            time : 800
                                        });
                                    }
                                }
                                if (day < 6) {
                                  exp.tip("观察" + date[day] + "种子发芽率,请保持培养皿湿润");
                                  spoon.triggerName = "dishArea";
                                  exp.drag.add(spoon);
                                  gauzeDishArea.triggerName = 'dishArea';
                                  spoonWater.material.visible = true;
                                } else {
                                  exp.tip("实验结束");
                                  
                                }
                            },
                            success: function() {
                                nextDayBtn.style.display = 'none';
                                beanSprout();
                            }
                        });
                    }

			} 

			exp.loopFn = function(){

            }

		}
	}, 1000/60);
	
})();