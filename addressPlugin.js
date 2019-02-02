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
      callback: options.callback || undefined
    };

    // 数据源是否为空
    if (this.opts.datas.length == 0) {
      return;
    }

    // 省列表, 省对象缓存
    provinceObj = {};
    // 市列表, 市对象缓存
    cityList = [];
    cityObj = {};
    // 区/县列表缓存
    zoonList = [];
    zoonObj = {};

    // 最终省市县结果
    finalProvince = {};
    finalCity = {};
    finalZoon = {};
    finalCityList = [];
    finalZoonList = [];

    apProvinceTitleObj = null;
    apCityTitleObj = null;
    apZoonTitleObj = null;
    apPCZListObj = null;

    this.init();

    this.openModule = function (addr) {
      console.log(addr);

      $('#addressModule').css('display', 'block');
      $('#addressList').removeClass('ap-pop-out').addClass('ap-pop-in');

      if (!addr) {
        this.refreshCurrentView(this.opts.datas, 'province', this.apProvinceTitleObj);
        this.apProvinceTitleObj.text('请选择');
        this.apCityTitleObj.addClass('ap-none');
        this.apZoonTitleObj.addClass('ap-none');
        this.apPCZListObj.scrollTop(0);
      } else {
        if (addr != this.returnChooseAddress().name) {
          var addrArr = addr.split('-');
          this.resetChoosedInfo(addrArr);
        }
      }
    };
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

      _that.initTitleAndListObj();

      _that.refreshCurrentView(_that.opts.datas, 'province', _that.apProvinceTitleObj);

      // _that.rePaintDom(_that.opts.datas, 'province');
      // _that.changeActivePos(_that.apProvinceTitleObj);
    },

    initTitleAndListObj: function () {
      this.apProvinceTitleObj = $('#apChooseProvince');
      this.apCityTitleObj = $('#apChooseCity');
      this.apZoonTitleObj = $('#apChooseZoon');
      this.apPCZListObj = $('#apPCZList');
    },

    changeTitleInfo: function (kind, provinceObj, cityObj, zoonObj) {
      if (!kind) {
        return;
      }
      var _isProvince = false,
          _isCity = false,
          _isZoon = false;

      switch(kind) {
        case 'province':
          _isProvince = true;
          break;
        case 'city': 
          _isCity = true;
          _isProvince = true;
          break;
        case 'zoon':
          _isZoon = true;
          _isCity = true;
          _isProvince = true;
          break;
      }

      if (_isProvince) {
        provinceObj.text(this.finalProvince.provinceName);
        provinceObj.attr('data-province', this.finalProvince.provinceId);
      }
      if (_isCity) {
        cityObj.text(this.finalCity.cityName);
        cityObj.attr('data-city', this.finalCity.cityId);
      }
      if (_isZoon) {
        zoonObj.text(this.finalZoon.zoonName);
        zoonObj.attr('data-zoon', this.finalZoon.zoonId);
      }
    },

    setFinalPCZInfo: function (arr) {
      if (!arr || arr.length == 0) {
        return;
      }
      for (var i = 0; i < this.opts.datas.length; i++) {
        if (this.opts.datas[i].provinceName == arr[0]) {
          this.finalProvince = this.opts.datas[i];
          break;
        }
      }
      if (arr.length == 2) {
        this.finalCityList = this.finalProvince.city;
        this.cityList = this.finalCityList;
        for (var c = 0; c < this.finalCityList.length; c ++) {
          if (this.finalCityList[c].cityName == arr[1]) {
            this.finalCity = this.finalCityList[c];
            break;
          }
        }
      }
      if (arr.length == 3) {
        this.finalZoonList = this.finalCity.zoon;
        this.zoonList = this.finalZoonList;
        for (var z = 0; z < this.finalZoonList.length; z ++) {
          if (this.finalZoonList[z].zoonName == arr[2]) {
            this.finalZoon = this.finalZoonList[z];
            break;
          }
        }
      }
    },

    // 还原title信息
    resetChoosedInfo: function (arr) {
      this.setFinalPCZInfo(arr);

      // 判断是否存在区县
      if (!$.isEmptyObject(this.finalZoon)) {
        this.apProvinceTitleObj.removeClass('ap-none');
        this.apCityTitleObj.removeClass('ap-none');
        this.apZoonTitleObj.removeClass('ap-none');

        this.changeTitleInfo('zoon', this.apProvinceTitleObj, this.apCityTitleObj, this.apZoonTitleObj);
        
        this.rePaintDom(this.finalZoonList, 'zoon');
        this.setCurrentItem(this.finalZoonList, 'zoon', this.apZoonTitleObj, this.finalZoon.zoonId);
      } else {
        this.apZoonTitleObj.addClass('ap-none');

        // 判断是否存在市
        if (!$.isEmptyObject(this.finalCity)) {
          this.apCityTitleObj.removeClass('ap-none');
          this.apProvinceTitleObj.removeClass('ap-none');

          this.changeTitleInfo('city', this.apProvinceTitleObj, this.apCityTitleObj, this.apZoonTitleObj);

          this.rePaintDom(this.finalCityList, 'city');

          this.setCurrentItem(this.finalCityList, 'city', this.apCityTitleObj, this.finalCity.cityId);
        } else {
          this.apCityTitleObj.addClass('ap-none');

          // 判断是否存在省
          if (!$.isEmptyObject(this.finalProvince)) {
            this.apProvinceTitleObj.removeClass('ap-none');

            this.changeTitleInfo('province', this.apProvinceTitleObj, this.apCityTitleObj, this.apZoonTitleObj);

            this.rePaintDom(this.opts.datas, 'province');
            this.setCurrentItem(this.opts.datas, 'province', this.apProvinceTitleObj, this.finalProvince.provinceId);
          }
        }
      }
    },

    rebackPCZObj: function () {
      this.provinceObj = this.finalProvince;
      this.cityObj = this.finalCity;
      this.zoonObj = this.finalZoon;
      this.cityList = this.finalCityList;
      this.zoonList = this.finalZoonList;
    },

    closeModule: function () {
      // 动画
      $('#addressList').addClass('ap-pop-out').removeClass('ap-pop-in');
      setTimeout(function () {
          $('#addressModule').css('display', 'none');
        }, ANIMATION_OUT);

      this.rebackPCZObj();
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

    composeHtml: function(id, name, kind) {
      if (!id || !name || !kind) {
        return '';
      }

      if (kind == 'province') {
        return '<div class="ap-pcz-item ap-province" data-pczid=' + id + '>' +
                 '<div class="ap-pcz-iteminner">' + name + '</div>' +
                 '<div class="ap-chooseimg ap-unvisible"></div>' +
               '</div>';
      } else {
        return '<div class="ap-pcz-item" data-pczid=' + id + '>' +
                 '<div class="ap-pcz-iteminner">' + name + '</div>' +
                 '<div class="ap-chooseimg ap-unvisible"></div>' +
               '</div>';
      }
    },

    // 绘制城市列表
    rePaintDom: function (list, kind) {
      if (!list || list.length == 0 || !kind) {
        return;
      }
      
      var htmlContent = '',
          container = this.apPCZListObj;

      // 清除所选节点下的所有元素
      container.empty();
      // 还原title状态
      this.setTitleStatusOrigin();

      switch(kind) {
        case 'province':
          for (var p = 0; p < list.length; p ++){
            htmlContent += this.composeHtml(list[p].provinceId, list[p].provinceName, 'province');
          }
          container.append(htmlContent);
          // 对省列表项进行事件绑定
          this.handlerProvinceItem();
          return;
        case 'city':
          for (var c = 0; c < list.length; c ++){
            htmlContent += this.composeHtml(list[c].cityId, list[c].cityName, 'city');
          }
          container.append(htmlContent);
          // 对市列表项进行事件绑定
          this.handlerCityItem();
          return;
        case 'zoon':
          for (var z = 0; z < list.length; z ++){
            htmlContent += this.composeHtml(list[z].zoonId, list[z].zoonName, 'zoon');
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
      this.rePaintDom(list, kind);
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
      var _pname = this.finalProvince && this.finalProvince.provinceName,
          _pid = this.finalProvince && this.finalProvince.provinceId,
          _cname = this.finalCity && this.finalCity.cityName,
          _cid = this.finalCity && this.finalCity.cityId,
          _zname = this.finalZoon && this.finalZoon.zoonName,
          _zid = this.finalZoon && this.finalZoon.zoonId,
          composeName = '',
          composeId = '';
      
      if (_pname) {
        composeName += _pname;
        composeId += _pid;
      }
      if (_cname) {
        composeName += ('-' + _cname);
        composeId += ('-' + _cid);
      }
      if (_zname) {
        composeName += ('-' + _zname);
        composeId += ('-' + _zid);
      }
      return {
        name: composeName,
        id: composeId
      };
    },

    // 设置当前项
    setCurrentItem: function (list, kind, titleObj, id) {
      if (!list || list.length == 0 || !kind || titleObj.length == 0 || !id) {
         return;
      }
      this.refreshCurrentView(list, kind, titleObj);
      this.chooseApItem(id, list.length);
    },

    setPCZData: function (province, city, zoon, cityList, zoonList) {
      // 保存省市县
      this.finalProvince = province || {};
      this.finalCity = city || {};
      this.finalZoon = zoon || {};
      this.finalCityList = cityList || [];
      this.finalZoonList = zoonList || [];
    },

    // 省列表项事件处理
    handlerProvinceItem: function () {
      var _that = this;
      $('.ap-pcz-iteminner').on('click', function (event) {
          _that.handlePCZItemCommEvent($(this), _that.apProvinceTitleObj, 'province', _that.opts.datas);

          // 设置title区域对应的id
          _that.apProvinceTitleObj.attr('data-province',  _that.provinceObj.provinceId);
          // 获取对应的省下的市
          _that.cityList = _that.provinceObj.city;
          if (_that.cityList.length == 0) {
            // 清空市，县区缓存
            _that.cityObj = {};
            _that.zoonObj = {};

          // 保存省市县
          _that.setPCZData(_that.provinceObj, {}, {}, [], []);

          _that.apProvinceTitleObj.addClass('apitem-active').addClass('ap-box-shaw');
          _that.opts.callback && _that.opts.callback(_that.returnChooseAddress());
          _that.closeModule();
        } else {
          // 重绘市列表
          _that.rePaintDom(_that.cityList, 'city');
          _that.apCityTitleObj.removeClass('ap-none').addClass('ap-box-shaw');
          // 隐藏县
          _that.showOrHideTitle(_that.apZoonTitleObj, false);
          // 重置市title
          _that.apCityTitleObj.text('请选择');
          _that.apCityTitleObj.attr('data-city', '000000');
          _that.apZoonTitleObj.text('请选择');
          _that.apZoonTitleObj.attr('data-zoon', '000000');
        }
      });

      // title点击显示当前省下的所有市
      _that.apProvinceTitleObj.on('click', function () {
        if (_that.apProvinceTitleObj.hasClass('apitem-active')) {
          return;
        }

        _that.setCurrentItem(_that.opts.datas, 'province', _that.apProvinceTitleObj, _that.apProvinceTitleObj.attr('data-province'));
      });
    },

    // 市列表项事件处理
    handlerCityItem: function () {
      var _that = this;
      $('.ap-pcz-iteminner').on('click', function (event) {
        _that.handlePCZItemCommEvent($(this), _that.apCityTitleObj, 'city', _that.cityList);

        // 设置title区域对应的id
        _that.apCityTitleObj.attr('data-city',  _that.cityObj.cityId);
        // 获取对应的区县列表
        _that.zoonList = _that.cityObj.zoon;
        if (_that.zoonList.length == 0) {
          // 保存省市县
          _that.setPCZData(_that.provinceObj, _that.cityObj, {}, _that.cityList, []);

          // 清空县区缓存
          _that.zoonObj = {};
          _that.apCityTitleObj.addClass('apitem-active').addClass('ap-box-shaw');
          _that.opts.callback && _that.opts.callback(_that.returnChooseAddress());
          _that.closeModule();
        } else {
          // 重绘区县列表
          _that.rePaintDom(_that.zoonList, 'zoon');
          _that.apZoonTitleObj.removeClass('ap-none').addClass('ap-box-shaw');
          // 重置市title
          _that.apZoonTitleObj.text('请选择');
          _that.apZoonTitleObj.attr('data-zoon', '000000');
        }
      });

      // title点击显示当前省下的所有市
      _that.apCityTitleObj.on('click', function () {
        if (_that.apCityTitleObj.hasClass('apitem-active')) {
          return;
        }

        _that.setCurrentItem(_that.cityList, 'city', _that.apCityTitleObj, _that.apCityTitleObj.attr('data-city'));
      });
    },

    // 处理县区列表项事件
    handlerZoonItem: function () {
      var _that = this;
      $('.ap-pcz-iteminner').on('click', function (event) {
        _that.handlePCZItemCommEvent($(this), _that.apZoonTitleObj, 'zoon', _that.zoonList);
        _that.apZoonTitleObj.addClass('apitem-active').addClass('ap-box-shaw');
        // 设置title区域对应的id
        _that.apZoonTitleObj.attr('data-zoon',  _that.zoonObj.zoonId);
        
        // 保存省市县
        _that.setPCZData(_that.provinceObj, _that.cityObj, _that.zoonObj, _that.cityList, _that.zoonList);

        _that.opts.callback && _that.opts.callback(_that.returnChooseAddress());
        _that.closeModule();
      });

      // title点击显示当前省下的所有市
      _that.apZoonTitleObj.on('click', function () {
        if (_that.apZoonTitleObj.hasClass('apitem-active')) {
          return;
        }
        // 重绘区县列表项
        // 当区县不是初始状态-请选择时，点击区县，下方列表需勾选相应项，并在可视区显示
        _that.setCurrentItem(_that.zoonList, 'zoon', _that.apZoonTitleObj, _that.apZoonTitleObj.attr('data-zoon'));
      });
    },

    // 根据title的内容，下方列表需勾选相应项，并在可视区显示
    chooseApItem: function (id, listSize) {
      if (!id || id == '000000') {
        return;
      }
      var _targetContaier = $('[data-pczid='+ id +']'),
          _itemIndex = _targetContaier.index() + 1;
          _targetContaier.children().eq(0).addClass('apitem-active');
          _targetContaier.children().eq(1).removeClass('ap-unvisible');

      // 当列表项数目大于页面允许显示的数目时，允许滚动
      if  (listSize > MAX_SHOW_ITEMNUM) {
        if (_itemIndex < MAX_SHOW_ITEMNUM) {
          if (_itemIndex <= listSize - MAX_SHOW_ITEMNUM) {
            this.apPCZListObj.scrollTop( (_itemIndex-1) * ITEM_HEIGHT);
          } else {
            this.apPCZListObj.scrollTop((listSize - MAX_SHOW_ITEMNUM) * ITEM_HEIGHT);
          }
        } else {
          if (listSize - _itemIndex > MAX_SHOW_ITEMNUM -1) {
            // 当出现列表数大于2*MAX_SHOW_ITEMNUM时
            this.apPCZListObj.scrollTop(MAX_SHOW_ITEMNUM * parseInt(listSize / MAX_SHOW_ITEMNUM) * ITEM_HEIGHT);
          } else {
            // MAX_SHOW_ITEMNUM <当出现列表数 < 2*MAX_SHOW_ITEMNUM时
            this.apPCZListObj.scrollTop( MAX_SHOW_ITEMNUM * ITEM_HEIGHT);
          }
        }
      }
    },

    handleEvent: function () {
      var _that = this;

      // 关闭
      $('#apCLose').on('click', function () {
        _that.closeModule();
      });
    }
  };

  $.fn.addressPlugin = function (options) {
    return new AddressPlugin($(this), options)
  };

})(jQuery, window, document);
