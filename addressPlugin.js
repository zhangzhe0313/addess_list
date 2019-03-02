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
      showColumn: options.showColumn || 3,
      showAll: options.showAll || 0, // 0: 所有类型；1：国内；2： 国外；
      defaultValue: options.defaultValue || null,
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
  }

  AddressPlugin.prototype = {
    constructor: AddressPlugin,
    
    init: function () {
      this.drawDom();
      this.handleEvent();
    },

    drawDom: function () {
      var _that = this,
          container = '',
          titleHtml = '';

      if (_that.opts.titlePos == 'left') {
        titleHtml = '<div class="ap-title-wrap" style="text-align: left; padding-left: .4rem;">';
      } else if (_that.opts.titlePos == 'center') {
        titleHtml = '<div class="ap-title-wrap" style="text-align: ' + this.opts.titlePos + '">';
      }

      // 容器
      container += '<div id="addressModule" class="ap-container">'+
                      '<div id="addressList" class="ap-addrlist">' +
                        '<div class="ap-title">' +
                          titleHtml +
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

      // 初始化title对象
      _that.initTitleAndListObj();

      // 初始化地址区
      if (!_that.opts.defaultValue) {
        _that.refreshCurrentView(_that.opts.datas, 'province', _that.apProvinceTitleObj);
        _that.apProvinceTitleObj.text('请选择');
        _that.apCityTitleObj.addClass('ap-none');
        _that.apZoonTitleObj.addClass('ap-none');
        _that.apPCZListObj.scrollTop(0);
      } else {
        var addrArr = _that.opts.defaultValue.split('-');
        _that.resetChoosedInfo(addrArr);
      }

      $('#addressList').removeClass('ap-pop-out').addClass('ap-pop-in');
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
        provinceObj.text(this.finalProvince.name);
        provinceObj.attr('data-province', this.finalProvince.code);
      }
      if (_isCity) {
        cityObj.text(this.finalCity.name);
        cityObj.attr('data-city', this.finalCity.code);
      }
      if (_isZoon) {
        zoonObj.text(this.finalZoon.name);
        zoonObj.attr('data-zoon', this.finalZoon.code);
      }
    },

    setFinalPCZInfo: function (arr) {
      if (!arr || arr.length == 0) {
        return;
      }
      for (var i = 0; i < this.opts.datas.length; i++) {
        if (this.opts.datas[i].name == arr[0]) {
          this.finalProvince = this.opts.datas[i];
          this.provinceObj = this.finalProvince;
          break;
        }
      }

      if (arr.length == 2) {
        this.finalCityList = this.finalProvince.children;
        this.cityList = this.finalCityList;
        for (var c = 0; c < this.finalCityList.length; c ++) {
          if (this.finalCityList[c].name == arr[1]) {
            this.finalCity = this.finalCityList[c];
            this.cityObj = this.finalCity;
            break;
          }
        }
      }

      if (arr.length == 3) {
        // 取到市
        this.finalCityList = this.finalProvince.children;
        this.cityList = this.finalCityList;
        for (var cz = 0; cz < this.finalCityList.length; cz ++) {
          if (this.finalCityList[cz].name == arr[1]) {
            this.finalCity = this.finalCityList[cz];
            this.cityObj = this.finalCity;
            break;
          }
        }

        this.finalZoonList = this.finalCity.children;
        this.zoonList = this.finalZoonList;
        for (var z = 0; z < this.finalZoonList.length; z ++) {
          if (this.finalZoonList[z].name == arr[2]) {
            this.finalZoon = this.finalZoonList[z];
            this.zoonObj = this.finalZoon;
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

        this.handleProvinceTitleClick();
        this.handleCityTitleClick();
        
        this.setCurrentItem(this.finalZoonList, 'zoon', this.apZoonTitleObj, this.finalZoon.code);
      } else {
        this.apZoonTitleObj.addClass('ap-none');

        // 判断是否存在市
        if (!$.isEmptyObject(this.finalCity)) {
          this.apCityTitleObj.removeClass('ap-none');
          this.apProvinceTitleObj.removeClass('ap-none');

          this.changeTitleInfo('city', this.apProvinceTitleObj, this.apCityTitleObj, this.apZoonTitleObj);

          this.handleProvinceTitleClick();

          this.setCurrentItem(this.finalCityList, 'city', this.apCityTitleObj, this.finalCity.code);
        } else {
          this.apCityTitleObj.addClass('ap-none');

          // 判断是否存在省
          if (!$.isEmptyObject(this.finalProvince)) {
            this.apProvinceTitleObj.removeClass('ap-none');

            this.changeTitleInfo('province', this.apProvinceTitleObj, this.apCityTitleObj, this.apZoonTitleObj);

            this.setCurrentItem(this.opts.datas, 'province', this.apProvinceTitleObj, this.finalProvince.code);
          }
        }
      }
    },

    closeModule: function () {
      // 动画
      $('#addressList').addClass('ap-pop-out').removeClass('ap-pop-in');
      setTimeout(function () {
          $('#addressModule').css('display', 'none');
        }, ANIMATION_OUT);

      $('#addressModule').remove();
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
            if (list[p].code == id) {
              this.provinceObj = list[p];
              return;
            }
            break;
          case 'city': 
            if (list[p].code == id) {
              this.cityObj = list[p];
              return;
            }
            break;
          case 'zoon':
            if (list[p].code == id) {
              this.zoonObj = list[p];
              return;
            }
            break;
        }
      }
    },

    composeHtml: function(id, name, kind, orderLetter, showOrder) {
      if (!id || !name || !kind) {
        return '';
      }

      if (kind == 'province') {
        return '<div class="ap-pcz-item ap-province" data-pczid=' + id + '>' +
                 '<div class="ap-pcz-iteminner">' + name + '</div>' +
                 '<div class="ap-chooseimg ap-unvisible"></div>' +
               '</div>';
      } else {
        if (kind == 'city') {
          if (showOrder) {
            if (orderLetter) {
              name = '<div style="width: .266666rem; display: inline-block;">' + orderLetter + '</div>' + '<span style="padding-left: .32rem;">' + name +'</span>';
            } else {
              name = '<div style="padding-left: .586666rem">' + name +'</div>';
            } 
          }
        }
        return '<div class="ap-pcz-item" data-pczid=' + id + '>' +
                 '<div class="ap-pcz-iteminner">' + name + '</div>' +
                 '<div class="ap-chooseimg ap-unvisible"></div>' +
               '</div>';
      }
    },

    // 绘制城市列表
    rePaintDom: function (list, kind, showOrder) {
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
            if (this.opts.showAll == 1) { // 国内
              if (/^[0-9]/.test(list[p].code)) {
                htmlContent += this.composeHtml(list[p].code, list[p].name, 'province');
              }
            } else if (this.opts.showAll == 2){
              if (/^[A-Z]/.test(list[p].code)) {
                htmlContent += this.composeHtml(list[p].code, list[p].name, 'province');
              }
            } else {
              htmlContent += this.composeHtml(list[p].code, list[p].name, 'province');
            }
          }
          container.append(htmlContent);
          // 对省列表项进行事件绑定
          this.handlerProvinceItem();
          return;
        case 'city':
          for (var c = 0; c < list.length; c ++){
            htmlContent += this.composeHtml(list[c].code, list[c].name, 'city', list[c].orderLetter, showOrder);
          }
          container.append(htmlContent);
          // 对市列表项进行事件绑定
          this.handlerCityItem();
          return;
        case 'zoon':
          for (var z = 0; z < list.length; z ++){
            htmlContent += this.composeHtml(list[z].code, list[z].name, 'zoon');
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
      var _title = targetObj.text();
      titleObj.text(_title.replace(/[A-Z]/g,''));
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
      this.rePaintDom(list, kind, this.provinceObj && this.provinceObj.showOrder);
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
      var _pname = this.finalProvince && this.finalProvince.name,
          _pid = this.finalProvince && this.finalProvince.code,
          _cname = this.finalCity && this.finalCity.name,
          _cid = this.finalCity && this.finalCity.code,
          _zname = this.finalZoon && this.finalZoon.name,
          _zid = this.finalZoon && this.finalZoon.code,
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
          _that.apProvinceTitleObj.attr('data-province',  _that.provinceObj.code);
          // 获取对应的省下的市
          _that.cityList = _that.provinceObj.children;
          if (_that.cityList.length == 0 || _that.opts.showColumn == 1) {
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
          _that.rePaintDom(_that.cityList, 'city', _that.provinceObj.showOrder);
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
      _that.handleProvinceTitleClick();
    },

    handleProvinceTitleClick: function () {
      var _that = this;
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
        _that.apCityTitleObj.attr('data-city',  _that.cityObj.code);
        // 获取对应的区县列表
        _that.zoonList = _that.cityObj.children;
        if (_that.zoonList.length == 0 || _that.opts.showColumn == 2) {
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
      _that.handleCityTitleClick();
    },

    handleCityTitleClick: function () {
      var _that = this;
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
        _that.apZoonTitleObj.attr('data-zoon',  _that.zoonObj.code);
        
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

      var totlePages = Math.floor(listSize / MAX_SHOW_ITEMNUM),
          totleExtra = listSize % MAX_SHOW_ITEMNUM,
          curExtra  = _itemIndex % MAX_SHOW_ITEMNUM,
          curPage = Math.floor(_itemIndex / MAX_SHOW_ITEMNUM);
      if (totlePages > 0) {
        if (totleExtra == 0) {
          // 说明刚好一页
          return;
        } else {
          if (curExtra <= totleExtra) {
            this.apPCZListObj.scrollTop( curPage * MAX_SHOW_ITEMNUM * ITEM_HEIGHT + (curExtra - 1) * ITEM_HEIGHT);
          } else if (curExtra > totleExtra) {
            this.apPCZListObj.scrollTop( curPage * MAX_SHOW_ITEMNUM * ITEM_HEIGHT + totleExtra * ITEM_HEIGHT);
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
    return new AddressPlugin($(this), options);
  };

})(jQuery, window, document);
