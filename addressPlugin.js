;(function ($, window, document) {

  // 动画时间
  ANIMATION_OUT = 300;

  // 一页展示的最大数
  MAX_SHOW_ITEMNUM = 10;

  // 每一项的高度
  ITEM_HEIGHT = 30;
  
  function AddressPlugin (el, options) {
    this.el = el;
    this.opts = {
      datas: options.datas || [],
      title: options.title || '请选择',
      titlePos: options.titlePos || 'center',
      callback: options.callback || undefined
    }

    // 数据源是否为空
    this.legth = this.opts.datas.length;
    // 省列表, 省对象缓存
    this.provinceList = [];
    this.provinceObj = {};
    // 市列表, 市对象缓存
    this.cityList = [];
    this.cityObj = {};
    // 区/县列表缓存
    this.zoonList = [];
    this.zoonObj = {};


    if (this.legth == 0) {
      return;
    }

    this.init();

    // 对外暴露
    this.openModule = function () {
      $('#addressModule').css('display', 'block');
      $('#addressList').removeClass('ap-pop-out');
      $('#addressList').addClass('ap-pop-in');
    }
  }

  AddressPlugin.prototype = {
    constructor: AddressPlugin,
    
    init: function () {
      this.drawDom();
      this.handleEvent();
    },

    drawDom: function () {
      var _that = this,
          container = '';

      // 容器
      container += '<div id="addressModule" class="ap-container">'+
                      '<div id="addressList" class="ap-addrlist">' +
                        '<div class="ap-title">' +
                          '<div class="ap-title-wrap">' + 
                            '<div class="ap-title-content">' + _that.opts.title + '</div>' +
                            '<div id="apCLose" class="ap-close"></div>' +
                          '</div>' +
                        '</div>' +
                        '<div class="ap-choose-area">' +
                          '<div id="apChooseProvince" class="ap-choose-pcz ap-box-shaw" data-province="000000">请选择</div>' +
                          '<div id="apChooseCity" class="ap-choose-pcz ap-none" data-city="000000">请选择</div>' +
                          '<div id="apChooseZoon" class="ap-choose-pcz ap-none" data-zoon="000000">请选择</div>' +
                        '</div>' + 
                        '<div id="apPCZList" class="ap-pcz-list"></div>' +
                      '</div>' +
                    '</div>';
      
      _that.el.html(container);

      _that.rePaintDom(_that.opts.datas, 'province', $('#apPCZList'));
      _that.changeActivePos($('#apChooseProvince'));
    },

    closeModule: function () {
      // 动画
      $('#addressList').addClass('ap-pop-out').removeClass('ap-pop-in');
      setTimeout(function () {
          $('#addressModule').css('display', 'none');
        }, ANIMATION_OUT);
      // 还原原始状态

    },

    // 列表项状态还原
    rollBackStatus: function () {
      // 去掉所有节点的激活状态
      $('.ap-pcz-iteminner').removeClass('apitem-active');
      $('.ap-chooseimg').addClass('ap-unvisible');

      // 所有title的状态
      $('.ap-choose-pcz').removeClass('ap-box-shaw');
    },

    // 根据id,kinduoqu对应的对象
    setPCZObject: function (kind, id, list) {
      if (!kind || !id || !list || list.length == 0) {
        return;
      }
      for (var p = 0; p < list.length; p ++ ) {
        switch(kind) {
          case 'province': 
            if (list[p].provinceId == id) {
              this.provinceObj = list[p];
              return;
            }
            break;
          case 'city': 
            if (list[p].cityId == id) {
              this.cityObj = list[p];
              return;
            }
            break;
          case 'zoon':
            if (list[p].zoonId == id) {
              this.zoonObj = list[p];
              return;
            }
            break;
        }
      }
    },

    // 绘制城市列表
    rePaintDom: function (list, kind, container) {
      if (!list || list.length == 0 || !kind || !container) {
        return;
      }

      // 清除所选节点下的所有元素
      container.empty();
      // 还原title状态
      this.setTitleStatusOrigin();

      var htmlContent = '';

      switch(kind) {
        case 'province':
          for (var p = 0; p < list.length; p ++){
            htmlContent += '<div class="ap-pcz-item ap-province" data-pczid=' + list[p].provinceId + '>' +
                            '<div class="ap-pcz-iteminner">' + list[p].provinceName + '</div>' +
                            '<div class="ap-chooseimg ap-unvisible"></div>' +
                          '</div>';
          }
          container.append(htmlContent);
          // 对省列表项进行事件绑定
          this.handlerProvinceItem();
          return;
        case 'city':
          for (var c = 0; c < list.length; c ++){
            htmlContent += '<div class="ap-pcz-item" data-pczid=' + list[c].cityId + '>' +
                            '<div class="ap-pcz-iteminner">' + list[c].cityName + '</div>' +
                            '<div class="ap-chooseimg ap-unvisible"></div>' +
                          '</div>';
          }
          container.append(htmlContent);
          // 对市列表项进行事件绑定
          this.handlerCityItem();
          return;
        case 'zoon':
          for (var z = 0; z < list.length; z ++){
            htmlContent += '<div class="ap-pcz-item" data-pczid=' + list[z].zoonId + '>' +
                            '<div class="ap-pcz-iteminner">' + list[z].zoonName + '</div>' +
                            '<div class="ap-chooseimg ap-unvisible"></div>' +
                          '</div>';
          }
          container.append(htmlContent);
          // 对区县列表项进行事件绑定
          this.handlerZoonItem();
          return;
        default:
          return;
      }
    },

    // 处理省市县列表中通用事件
    handlePCZItemCommEvent: function (targetObj, titleObj, kind, list) {
      // 去掉所有节点的激活状态
      this.rollBackStatus();

      // 修改当前节点状态
      targetObj.addClass('apitem-active').removeClass('ap-box-shaw');
      targetObj.next().removeClass('ap-unvisible');

      // 若存在市，则显示出市列表选择
      // 获取省对象
      this.setPCZObject(kind, targetObj.parent().attr('data-pczid'), list);

      // 修改title
      titleObj.text(targetObj.text());
    },

    // 改变title激活状态
    changeActivePos: function (obj) {
      // 去掉所有的激活态
      this.setTitleStatusOrigin();
      // 激活当前栏
      obj.addClass('ap-box-shaw').addClass('apitem-active');
    },

    // 顶部title状态还原
    setTitleStatusOrigin: function () {
      $('.ap-choose-pcz').removeClass('ap-box-shaw').removeClass('apitem-active');
    },

    // 刷新列表
    refreshCurrentView: function (list, kind, curObj) {
      if (!list || list.length ==0 || !kind) {
        return;
      }
      // 重绘当前列表
      this.rePaintDom(list, kind, $('#apPCZList'));
      // 改变激活状态
      this.changeActivePos(curObj);
    },

    // 省市县--title,请选择显示或者隐藏
    showOrHideTitle: function (kindObj, isShow) {
      if (!kindObj) {
        return;
      }
      if (isShow) {
        kindObj.removeClass('ap-none');
      } else {
        kindObj.addClass('ap-none');
      }
    },

    // 返回选择结果
    returnChooseAddress: function () {
      var _pname = this.provinceObj && this.provinceObj.provinceName,
          _cname = this.cityObj && this.cityObj.cityName,
          _zname = this.zoonObj && this.zoonObj.zoonName,
          composeName = '';
      
      if (_pname) {
        composeName += _pname;
      }
      if (_cname) {
        composeName += ('-' + _cname);
      }
      if (_zname) {
        composeName += ('-' + _zname);
      }
      return composeName;
    },

    // 省列表项事件处理
    handlerProvinceItem: function () {
      var _that = this,
          _apChooseProvince = $('#apChooseProvince'),
          _apChooseCity = $('#apChooseCity'),
          _apChooseZoon = $('#apChooseZoon');
      $('.ap-pcz-iteminner').on('click', function (event) {
        _that.handlePCZItemCommEvent($(this), _apChooseProvince, 'province', _that.opts.datas);
        // 设置title区域对应的id
        _apChooseProvince.attr('data-province',  _that.provinceObj.provinceId);
        // 获取对应的省下的市
        _that.cityList = _that.provinceObj.city;
        if (_that.cityList.length == 0) {
          // 清空市，县区缓存
          _that.cityObj = {};
          _that.zoonObj = {};

          _apChooseProvince.addClass('apitem-active').addClass('ap-box-shaw');
          _that.opts.callback && _that.opts.callback(_that.returnChooseAddress());
          _that.closeModule();
        } else {
          // 重绘市列表
          _that.rePaintDom(_that.cityList, 'city', $('#apPCZList'));
          _apChooseCity.removeClass('ap-none').addClass('ap-box-shaw');
          // 隐藏县
          _that.showOrHideTitle(_apChooseZoon, false);
          // 重置市title
          _apChooseCity.text('请选择');
          _apChooseCity.attr('data-city', '000000');
          _apChooseZoon.text('请选择');
          _apChooseZoon.attr('data-zoon', '000000');
        }
      });

      // title点击显示当前省下的所有市
      _apChooseProvince.on('click', function () {
        var dataProvince = _apChooseProvince.attr('data-province');
        if (!dataProvince || _apChooseProvince.hasClass('apitem-active')) {
          return;
        }
        
        _that.refreshCurrentView(_that.opts.datas, 'province', _apChooseProvince);
        _that.chooseApItem(_apChooseProvince.attr('data-province'));
      });
    },

    // 市列表项事件处理
    handlerCityItem: function () {
      var _that = this,
          _apChooseCity = $('#apChooseCity'),
          _apChooseZoon = $('#apChooseZoon');
      $('.ap-pcz-iteminner').on('click', function (event) {
        _that.handlePCZItemCommEvent($(this), _apChooseCity, 'city', _that.cityList);
        // 设置title区域对应的id
        _apChooseCity.attr('data-city',  _that.cityObj.cityId);
        // 获取对应的区县列表
        _that.zoonList = _that.cityObj.zoon;
        if (_that.zoonList.length == 0) {
          // 清空县区缓存
          _that.zoonObj = {};

          _apChooseCity.addClass('apitem-active').addClass('ap-box-shaw');
          _that.opts.callback && _that.opts.callback(_that.returnChooseAddress());
          _that.closeModule();
        } else {
          // 重绘区县列表
          _that.rePaintDom(_that.zoonList, 'zoon', $('#apPCZList'));
          _apChooseZoon.removeClass('ap-none').addClass('ap-box-shaw');
          // 重置市title
          _apChooseZoon.text('请选择');
          _apChooseZoon.attr('data-zoon', '000000');
        }
      });

      // title点击显示当前省下的所有市
      var apChooseCity = $('#apChooseCity');
      apChooseCity.on('click', function () {
        var dataCity = apChooseCity.attr('data-city');
        if (!dataCity && _that.cityList.length == 0) {
          return;
        }

        _that.refreshCurrentView(_that.cityList, 'city', apChooseCity);
        _that.chooseApItem(apChooseCity.attr('data-city'));
      });
    },

    // 处理县区列表项事件
    handlerZoonItem: function () {
      var _that = this,
          _apChooseZoon = $('#apChooseZoon');
      $('.ap-pcz-iteminner').on('click', function (event) {
        _that.handlePCZItemCommEvent($(this), _apChooseZoon, 'zoon', _that.zoonList);
        _apChooseZoon.addClass('apitem-active').addClass('ap-box-shaw');
        // 设置title区域对应的id
        _apChooseZoon.attr('data-zoon',  _that.zoonObj.zoonId);
        _that.opts.callback && _that.opts.callback(_that.returnChooseAddress());
        _that.closeModule();
      });

      // title点击显示当前省下的所有市
      var apChooseZoon = $('#apChooseZoon');
      apChooseZoon.on('click', function () {
        // 重绘区县列表项
        _that.refreshCurrentView(_that.zoonList, 'zoon', apChooseZoon);
        // 当区县不是初始状态-请选择时，点击区县，下方列表需勾选相应项，并在可视区显示
        _that.chooseApItem(apChooseZoon.attr('data-zoon'));
      });
    },

    // 根据title的内容，下方列表需勾选相应项，并在可视区显示
    chooseApItem: function (id) {
      if (!id || id == '000000') {
        return;
      }
      var _targetContaier = $('[data-pczid='+ id +']'),
          _itemIndex = _targetContaier.index();
          _targetContaier.children().eq(0).addClass('apitem-active');
          _targetContaier.children().eq(1).removeClass('ap-unvisible');


      if (_itemIndex > 9) {
        $('#apPCZList').scrollTop((_itemIndex - MAX_SHOW_ITEMNUM + 1) * ITEM_HEIGHT);
      }
    },

    handleEvent: function () {
      var _that = this;

      // 确定
      $('#apCLose').on('click', function () {
        _that.closeModule();
      })
    }
  }

  $.fn.addressPlugin = function (options) {
    return new AddressPlugin($(this), options)
  }

})(jQuery, window, document)