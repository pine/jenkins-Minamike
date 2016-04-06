/*!
 scrollsmartly.js v0.1.0
 Copyright (c) 2013 - 2014 Shinnosuke Watanabe | MIT License

 scrollsmoothly.js
 Copyright (c) 2008 KAZUMiX | MIT License
 http://d.hatena.ne.jp/KAZUMiX/20080418/scrollsmoothly
*/

(function(window, document, location, history, undefined) {
  'use strict';
  
  var smartly = {};
  
  var currentHrefWOHash = location.href.split('#')[0];

  // Internal variables
  var stillLoading = true,
      callback,
      delayedFunctionsQueue = [],
      transit = [],
      mutated = null,
      reachedCurrentTarget = true;

  smartly.set = function() {
    switch (arguments.length){
      case 1:
      if (typeof arguments[0] === 'object') {
        for(var key in arguments[0]){
          if(smartly.hasOwnProperty(key)){
            smartly[key] = arguments[0][key];
          }
        }
      }
      break;

      case 2:
      if (smartly.hasOwnProperty(arguments[0])) {
        smartly[arguments[0]] = arguments[1];
      }
      break;
    }

    dequeue();
    return smartly;
  };

  // Delay processing
  smartly.delay = function() {
    var func, time = 0, args = [];

    switch (arguments.length) {
      case 0:
      break;

      case 1:
      if (typeof arguments[0] === 'function') {
        func = arguments[0];
      } else {
        time = arguments[0];
      }
      break;

      case 2:
      func = arguments[0];
      time = arguments[1];
      break;

      default:
      func = arguments[0];
      time = arguments[1];
      for (var i=2; i < arguments.length; i++) {
        args[i-2] = arguments[i];
      }
    }

    var waitObj = {};
    for (var key in smartly) {
      if (typeof smartly[key] === 'function' && key !== 'delay') {
        waitObj[key] = setDelay(smartly[key], time);
      } else {
        waitObj[key] = smartly[key];
      }
    }

    function setDelay(origFunc, delay) {
      return function() {
        var origArgs = arguments;

        var delayedFunction = function() {
          setTimeout(function() {
            if (typeof func === 'function') {
              func.apply(this, args);
            }
            origFunc.apply(smartly, origArgs);
          }, delay);
        };

        if (smartly.scrollingTo !== null) {
          delayedFunctionsQueue[delayedFunctionsQueue.length] = delayedFunction;

        } else {
          delayedFunction();
        }

        if (time !== -1) {
          return smartly;
        }
        return smartly.delay(-1);
      };
    }

    return waitObj;
  };

  function dequeue() {
    if (delayedFunctionsQueue.length > 0) {
      console.log(delayedFunctionsQueue);
      var currentQueue = delayedFunctionsQueue.shift();
        currentQueue();
    }
  }

  // Preference
  smartly.easing = 6;
  smartly.scrollingTo = null;
  smartly.scrolledTo = null;
  smartly.hashScrollSynced = true;
  smartly.scrollHashSynced = true;

  smartly.currentLeft = 0;
  smartly.currentTop = 0;

  smartly.position = 'left top';
  smartly.marginLeft = 0;
  smartly.marginTop = 0;
  smartly.velocity = [0, 0];

  var targetX = 0, targetY = 0, targetElm, targetHash = '';
  var currentX = 0, currentY = 0;
  var prevX = null, prevY = null;
  var rootElm = document.documentElement || document.body;
  smartly.homeElement = rootElm;
  var windowWidth = 0, windowHeight = 0;

  // if ハッシュが '#' 一文字のみである場合、それを取り除く
  if (location.hash === ''&& location.href.indexOf('#') !== -1 &&
  history.replaceState !== undefined) {
    history.replaceState('', document.title, location.pathname);
  }

  var addEvent, removeEvent;
  if (window.addEventListener !== undefined) {
    addEvent = function(elm, eventType, func) {
      elm.addEventListener(eventType, func, false);
    };

    removeEvent = function(elm, eventType, func) {
      elm.removeEventListener(eventType, func, false);
    };
  // IE and old Opera
  } else {
    addEvent = function(elm, eventType, func) {
      elm.attachEvent('on' + eventType, func);
    };

    removeEvent = function(elm, eventType, func) {
      elm.detachEvent('on' + eventType, func);
    };
  }

  var historyMoved = true;

  var onBackOrForward = function(e) {
    // 履歴の前後ではなく、
    // 本ライブラリのスクロールにより hashchange イベントが起きた場合
    if (! historyMoved || ! smartly.hashScrollSynced) {
      return;
    }

    scrollTo(currentX, currentY);
    smartly.scroll(location.hash.substring(1));
  };

  var scrollTimerID = null;
  
  // requestAnimationFrame polyfill
  // www.paulirish.com/2011/requestanimationframe-for-smart-animating/
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  var requestAnimationFrame, cancelAnimationFrame;
  for (var x=0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
                           window[vendors[x]+'CancelRequestAnimationFrame'];
  }
  
  vendors = null;

  if (!requestAnimationFrame || !cancelAnimationFrame) {
    requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = setTimeout(function() {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
    cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }


  var scrollCompleteHandler = function() {
    getCurrentXY();
    /*
    if (scrollTimerID !== null) {
      clearTimeout(scrollTimerID);
    }
    scrollTimerID = setTimeout(function(){
      getCurrentXY();
    }, 150);
    */
  };

  var resizeTimerID = null;

  var resizeCompleteHandler = function() {
    if (resizeTimerID !== null) {
      clearTimeout(scrollTimerID);
    }

    resizeTimerID = setTimeout(function() {
      reportMutated();
    }, 50);
  };

  // polyfill for MutationObserver
  MutationObserver = window.MutationObserver ||
                     window.WebKitMutationObserver ||
                     window.MozMutationObserver ||
                     false;

  var observer;

  function reportMutated() {
    mutated = true;
  }

  if (MutationObserver) {
    observer = new MutationObserver( function(mutations) {
      reportMutated();
    });
  } else {
    // 変更通知を受け取れないので、以後、常にDOM変更が行われていることを前提に処理する
    mutated = true;
  }

  var startScroll;

  // on + event type のかたちの名を持つイベントリスナーを、当該イベントに登録する関数
  var setCustomHTMLEvent;
  var smartlyStartEvent, smartlyEndEvent;

  // initial setting
  var basicSettings = function(e) {
    if (e) {
      startScroll = function(clickEvent) {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        if (this.scrollSmartlyTarget !== undefined) {
          smartly.scroll(this.scrollSmartlyTarget);
        } else {
          smartly.scroll(this.hash.substring(1));
        }
      };

      setCustomHTMLEvent = function(eventType) {
        var htmlEvent = document.createEvent('HTMLEvents');
        htmlEvent.initEvent(eventType, false, false);
        window['on' + eventType] = null;

        addEvent(window, eventType, function(e) {
          var callback = this['on' + eventType];
          if(typeof callback === 'function'){
            callback(e);
          }
        });

        return htmlEvent;
      };
      
    // old IE
    } else {
      startScroll = function() {
        var self = event.srcElement || event.target;
        event.returnValue = false;
        event.cancelBubble = true;
        smartly.scroll(self.hash.substring(1));
      };

      setCustomHTMLEvent = function(eventType) {
        var htmlEvent = document.createEvent('HTMLEvents');
        htmlEvent.initEvent(eventType, false, false);
        window['on' + eventType] = null;

        addEvent(window, eventType, function() {
          var e = event;
          var callback = this['on' + eventType];
          if (typeof callback === 'function') {
            callback(e);
          }
        });

        return htmlEvent;
      };
    }

    smartlyStartEvent = setCustomHTMLEvent('smartlystart');
    smartlyEndEvent = setCustomHTMLEvent('smartlyend');

    // https://developer.mozilla.org/docs/DOM/EventTarget.addEventListener
    // #Multiple_identical_event_listeners
    addEvent(window, 'hashchange', onBackOrForward);
    addEvent(window, 'scroll', scrollCompleteHandler);
    addEvent(window, 'resize', resizeCompleteHandler);

    // noop
    basicSettings = function(){};
  };

  addEvent(document, 'DOMContentLoaded', function(e) {
    basicSettings(e);
  });

  addEvent(window, 'load', function(e) {
    basicSettings(e);

    getCurrentXY();
    getWindowSize();

    // 外部からページ内リンク付きで呼び出された場合
    if (smartly.hashScrollSynced &&
        (location.hash !== '' || smartly.homeElement !== rootElm)) {
      // IE の場合、少し待ってからスクロール
      if (window.attachEvent !== undefined &&
          window.opera === undefined){
        setTimeout(function() {
          scrollTo(0, 0);
          smartly.scroll(location.hash.substring(1) || smartly.homeElement);
        }, 30);
      } else {
        scrollTo(0, 0);
        smartly.scroll(location.hash.substring(1) || smartly.homeElement);
      }
    }

    addEvent(document.body, 'click', holdDefaultHashChange);

    stillLoading = false;
  });

  function holdDefaultHashChange(clickEvent) {
    if (!smartly.hashScrollSynced) { return; }

    var evt = clickEvent || event; //tmp
    var elm = evt.target || evt.srcElement;
    if (elm.href !== undefined && elm.href.indexOf('#') !== -1) {
      resetHashChangeEvent(false);
    }
  }

  var isArray;
  if (Array.isArray !== undefined) {
    isArray = Array.isArray;
  } else {
    var _isArraySub = Object.prototype.toString.call;
    isArray = function(obj) {
      return _isArraySub(obj) === '[object Array]';
    };
  }

  smartly.scroll = function() {

    var targets = [''];
    var callback = null;

    switch (arguments.length) {
      case 0:
      break;

      case 1:
      if (typeof arguments[0] === 'object') {
        if (arguments[0].nodeType === 1) {
          // 引数が一つのELEMENT Nodeであった場合
          targets[0] = arguments[0];

        } else if (arguments[0].via !== undefined) {
          if (isArray(arguments[0].via)) {
            // viaプロパティが配列であった場合
            targets = arguments[0].via;
          } else {
            targets = [arguments[0].via];
          }

          if (arguments[0].to !== undefined) {
            targets.push(arguments[0].to);
          }

        } else {
          targets[0] = arguments[0].to;
        }

        if (arguments[0].callback !== undefined) {
          callback = arguments[0].callback;
        }

      } else if (typeof arguments[0] !== 'function') {
        targets[0] = arguments[0];

      } else {
        callback = arguments[0];
      }
      break;

      case 2:
      if (typeof arguments[1] === 'function') {
        targets[0] = arguments[0];
        callback = arguments[1];
      } else {
        targets[0] = arguments[0];
        targets[1] = arguments[1];
      }
      break;

      default:
      var lastKey = arguments.length - 1;

      for (var i=0; i < lastKey; i++) {
        targets[i] = arguments[i];
      }

      if (typeof arguments[lastKey] === 'function') {
        callback = arguments[lastKey];

      } else {
        targets[lastKey] = arguments[lastKey];
      }

      break;
    }

    var currentTarget = targets.shift();

    // get coordinate of target element

    // if ELEMENT Node
    if (currentTarget.nodeType === 1) {
      targetElm = currentTarget;
      targetHash = currentTarget.id;

    } else if(typeof currentTarget === 'string') {
      if (currentTarget !== '') {
        targetElm = document.getElementById(currentTarget);
      } else if (smartly.homeElement) {
        targetElm = smartly.homeElement;
      } else {
        targetElm = rootElm;
      }

      targetHash = currentTarget;
    }

    if (targetElm === null) {
      return smartly;
    }

    if (targets.length > 0) {
      transit = targets;
    }

    setTargetXY();

    // スクロール中にターゲット要素が移動した際、追跡するかどうか
    if (observer !== undefined) {
      observer.observe( document.body, {
        attributes: true,
        subtree: true,
        characterData: false
      });
    }

    // スクロール中ではない場合、またはスクロール中であっても、次の目標にまだ到達していない場合
    if(smartly.scrollingTo === null || !reachedCurrentTarget){
      // スクロールの開始処理

      smartly.scrollingTo = targetElm;

      // 'callback' 引数をコールバック関数に設定する
      callback = callback || null;

      cancelAnimationFrame(scrollProcessID);

      // fire 'smartlystart' event
      window.dispatchEvent(smartlyStartEvent);

    } else {
      smartly.scrollingTo = targetElm;
    }

    removeEvent(window, 'scroll', scrollCompleteHandler);
    resetHashChangeEvent(true);

    reachedCurrentTarget = false;
    processScroll();

    return smartly;
  };

  var scrollProcessID;

  var round = Math.round;
  var abs = Math.abs;
  
  function processScroll() {

    if (mutated === true) {
      // スクロール中にターゲット要素に対するDOMの変更があった場合、
      // 再度ターゲット要素の座標を取得する
      setTargetXY();

      if(observer !== undefined){
        mutated = false;
      }
    }

    getCurrentXY();

    if (smartly.easing < 1) {
      smartly.easing = 1;
    }

    var vx = (targetX - currentX) / smartly.easing;
    var vy = (targetY - currentY) / smartly.easing;

    smartly.velocity = [vx, vy];

    // 目標座標付近に到達した場合
    if ((abs(vx) < 0.05 && abs(vy) < 0.05) ||
        (prevX === currentX && prevY === currentY) ||
        reachedCurrentTarget) {

      if (observer !== undefined) {
        // DOMの変更通知の受取を止める
        observer.disconnect();
      }

      addEvent(window, 'scroll', scrollCompleteHandler);

      // scroll.stop が呼ばれていた場合
      if (reachedCurrentTarget) { return; }

      scrollTo(targetX, targetY);
      smartly.scrolledTo = targetElm;
      // 直近の目標に到達したことを表す
      reachedCurrentTarget = true;
      smartly.velocity = [0, 0];

      if (transit.length > 0) {
        // 経由する要素がまだ残っている場合
        smartly.scroll(transit.shift());

      } else {
        // finish scroll
        // because there is no element to pass through
        setLocationHash();
        smartly.scrollingTo = prevX = prevY = null;

        if (typeof callback === 'function') {
          callback();
        }

        dequeue();
        // fire 'smartlyend' event
        window.dispatchEvent(smartlyEndEvent);
      }

      return;
    }

    // reputation

    prevX = currentX;
    prevY = currentY;
    
    scrollTo(
      currentX + (vx >= 0? Math.ceil(vx): Math.round(vx)),
      currentY + (vy >= 0? Math.ceil(vy): Math.floor(vy))
    );

    scrollProcessID = requestAnimationFrame(processScroll);
  }

  function setLocationHash() {
    if (! smartly.scrollHashSynced ||
    targetHash === location.hash.substring(1) || delayedFunctionsQueue.length > 0) {
      return;
    }

    if (targetHash !== '') {
      resetHashChangeEvent(false);

      if (history.pushState !== undefined) {
        history.pushState('', document.title, location.pathname + '#' + targetHash);
      } else if(focusKeywordChanged() ||
                smartly.marginLeft !== 0 ||
                smartly.marginTop !== 0) {

          // ハッシュを変更する際に、そのハッシュをid属性に持つ要素へ移動するのを防ぐ必要がある。
          // つまり、location.hash = StringX 呼び出す際に、id属性が StringX である要素が
          // ドキュメント中に存在しないようにする必要がある。

          targetElm.id = '';
          location.hash = '#' + targetHash;
          targetElm.id = targetHash;

      } else {
        location.hash = '#' + targetHash;
      }

    } else {
      if (location.hash !== '' && history.pushState !== undefined) {
        resetHashChangeEvent(false);
        history.pushState('', document.title, location.pathname);
      }
    }
  }

  var hashChangeTimerID;

  function resetHashChangeEvent(scrollBeginning){
    if (!smartly.scrollHashSynced) { return; }

    if (scrollBeginning) {
      clearTimeout(hashChangeTimerID);

    } else {
      // 検知対象の HashChangeEvent では「ない」ことを表す
      historyMoved = false;

      // HashChangeEvent が発生し終わった頃に、
      // これから起こる HashChangeEvent が検知対象となるよう再設定する
      hashChangeTimerID = setTimeout(function() {
        historyMoved = true;
      }, 30);
    }
  }

  function getCurrentXY() {
    smartly.currentLeft =
               currentX = document.documentElement.scrollLeft || document.body.scrollLeft;
    smartly.currentTop =
              currentY = document.documentElement.scrollTop || document.body.scrollTop;
    
    return;
  }

  var getScrollMaxXY;

  if (window.scrollMaxX !== undefined) {
    getScrollMaxXY = function() {
      return {x: window.scrollMaxX, y: window.scrollMaxY};
    };
  } else {
    getScrollMaxXY = function() {
      var documentSize = getDocumentSize();
      getWindowSize();
      return {
        x: documentSize.width - windowWidth,
        y: documentSize.height - windowHeight
      };
    };

    var getDocumentSize = function() {
      return{
        width: Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth
        ),
        height: Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight)
      };
    };
  }

  var getWindowSize;

  if (rootElm.clientWidth !== undefined) {
    getWindowSize = function() {
      windowWidth = rootElm.clientWidth;
      windowHeight = rootElm.clientHeight;
    };

  } else if(window.innerWidth) {
    var box = document.createElement('div');
    var boxStyle = box.style;
    boxStyle.position = 'absolute';
    boxStyle.left = boxStyle.top = '0';
    boxStyle.width = boxStyle.height = '100%';
    boxStyle.margin = boxStyle.padding = '0';
    boxStyle.border = 'none';
    boxStyle.visibility = 'hidden';

    getWindowSize = function() {
      document.body.appendChild(box);
      windowWidth = box.offsetWidth;
      windowHeight = box.offsetHeight;
      document.body.removeChild(box);
    };
  }

  function setTargetXY() {
    // スクロール先座標をセットする
    var x = 0;
    var y = 0;
    var elm = targetElm;

    while(elm){
      if (elm.offsetLeft !== undefined) {
        x += elm.offsetLeft;
        y += elm.offsetTop;

      } else {
        var rect = elm.getBoundingClientRect();
        x += rect.left;
        y += rect.top;
      }

      elm = elm.offsetParent;
    }

    var maxScroll = getScrollMaxXY();
    var focus = getParsedFocus();

    targetX = Math.min(x + focus.x, maxScroll.x);
    if (targetX < 0) {
      targetX = 0;
    }

    targetY = Math.min(y + focus.y, maxScroll.y);
    if (targetY < 0) {
      targetY = 0;
    }
  }

  function focusKeywordChanged(){
    return (smartly.position && smartly.position !== 'left top');
  }

  function getParsedFocus(){
    var keywordX = 0;
    var keywordY = 0;

    if (focusKeywordChanged()) {
      var words = String(smartly.position).split(' ');
      if (words.length === 1) {
        words[1] = words[0];
      }

      var elmWidth, elmHeight;
      if (targetElm.offsetWidth !== undefined) {
        elmWidth = targetElm.offsetWidth;
        elmHeight = targetElm.offsetHeight;

      } else {
        var targetRect = targetElm.getBoundingClientRect();
        elmWidth = targetRect.width;
        elmHeight = targetRect.height;
      }

      var fraction;

      fraction = fractionalize(words[0]);
      keywordX = parseInt((windowWidth - elmWidth) * fraction, 10);

      fraction = fractionalize(words[1]);
      keywordY = parseInt((windowHeight - elmHeight) * fraction, 10);
    }

    return {
      x: - (keywordX + smartly.marginLeft),
      y: - (keywordY + smartly.marginTop)
    };
  }

  function fractionalize(keyword) {
    if (keyword === 'left' || keyword === 'top') {
      return 0;

    } else if (keyword === 'center') {
      return 0.5;

    } else if (keyword === 'right' || keyword === 'bottom') {
      return 1;

    } else if (keyword.charAt(keyword.length-1) === '%') {
      return parseFloat(keyword) * 0.01;
    }

    return 0;
  }

  smartly.stop = function() {
    // 目標に到達「したこと」にし、スクロール処理を終了させる
    reachedCurrentTarget = true;
    transit= [];
    smartly.scrollingTo = null;

    dequeue();
    return smartly;
  };

  smartly.finish = function() {
    delayedFunctionsQueue= [];
    smartly.stop();

    return smartly;
  };

  function each(obj, func) {
    if (!obj) { return; }
    var items;
    if (obj.length === undefined) {
      items = [obj];
    } else {
      items = obj;
    }

    for (var i=0; i < items.length; i++) {
      func.call(smartly, items[i], i);
    }
  }

  smartly.on = function(elm, target) {
    each(elm, function(val) {
      if (target !== undefined) {
        val.scrollSmartlyTarget = target;
      } else {
        val.scrollSmartlyTarget = '';
      }

      addEvent(val, 'click', startScroll);
      val.style.cursor = 'pointer';
    });

    dequeue();
    return smartly;
  };

  smartly.off = function(elm) {
    each(elm, function(val) {
      delete val.scrollSmartlyTarget;
      removeEvent(val, 'click', startScroll);
      val.style.cursor = '';
    });

    dequeue();
    return smartly;
  };

  smartly.replaceAnchor = function(elm, calledFromMethod) {
    /*
    **イベントリスナーを登録するリンク**:
    ・href属性が '#' で始まるページ内リンクであり、尚かつ、それが指し示すアンカーがページ内に存在するもの
      -> id='anchor' である要素へのスクロール
    ・href属性が '#' 一文字のみのリンク -> ドキュメントの最上端へのスクロール

    **イベントリスナーを登録しないリンク**:
    ・href属性に '#' が含まれないリンク
    ・href属性に '#' を含むが、当該リンクのあるページ内のものではない、別ページのアンカーへのリンク
    ・href属性を持たないa要素
    */

    var hrefStr = elm.href + '';
    var splitterIndex = hrefStr.lastIndexOf('#');

    // '#' 以降を除いた文字列が、現在表示しているサイトのURLと一致しているかの判定。
    // '#' が無ければ String.substring(0, -1) つまり '' となり、偽である。
    if (hrefStr.substring(0, splitterIndex) === currentHrefWOHash) {
      // In HTML4?
      if (elm.hash !== undefined) {
        elm.hash = hrefStr.substring(splitterIndex + 1);
      }
      delete elm.scrollSmartlyTarget;
      addEvent(elm, 'click', startScroll);
    }

    if (calledFromMethod !== true) {
      dequeue();
      return smartly;
    }
  };

  smartly.all = function() {
    if (stillLoading) {
      addEvent(window, 'load', function() {
        stillLoading = false;
        smartly.all();
      });

      dequeue();
      return smartly;
    }
    // bind events to in-page links
    var linkElms = document.links;
    for (var i=0; i<linkElms.length; i++) {
      smartly.replaceAnchor(linkElms[i], true);
    }

    dequeue();
    return smartly;
  };

  // expose
  window.smartly = smartly;
  
  // some AMD build optimizers like r.js check for condition patterns like the following:
  if (typeof define === 'function' &&
      typeof define.amd === 'object' &&
      define.amd) {

    // define as an anonymous module so, through path mapping, it can be
    // referenced as the "underscore" module
    define('scrollsmartly', [], function() {
      return smartly;
    });
  }
  // check for `exports` after `define` in case a build optimizer adds an `exports` object
  else if (typeof module !== 'undefined' && module.exports) {
    (module.exports = smartly).smartly = smartly;
  }
}(window, document, location, history));
