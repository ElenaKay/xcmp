
function simpleQs(arr, head, tail) {
  if (head >= tail)
    return;
  var m0 = head + ((tail-head)>>>1);
  var m = simpleQm(arr, head, tail, m0);
  simpleQs(arr, head, m-1);
  simpleQs(arr, m+1, tail);
}

function simpleQm(arr, head, tail, m) {
  var h = head, t = tail, v = arr[m];
  while (true) {
    while (h < m && arr[h] < v) h++;
    while (m < t && v < arr[t]) t--;

    if (h >= t) { break }

    var hV = arr[h];
    arr[h] = arr[t];
    arr[t] = hV;

    if (h === m) m = t;
    else if (t === m) m = h;
  }
  arr[m] = v;
  return m;
}

function assert(c,m) {
  if (!c) throw new Error(m);
}

function isIntExact(v) {
  return (typeof v) === (typeof 0) && (v|0) === v;
}

// '5', '5.', '5.0', and '5.00'
function isInt10Loose(str) {
  assert((typeof str) === (typeof ""));
  if (str > 0 || str <=0)
    return (str|0) == str;
  return false;
}

// '5' alone
function isInt10Exact(str) {
  assert((typeof str) === (typeof ""));
  if (str > 0 || str <= 0)
    return (str|0)+"" === str;
  return false;
}

var has = (function() {
  var H = {}.hasOwnProperty;
  return function(o,n) {
    return H.call(o,n);
  };
})();

function isArrLike(a) {
  if (!a) return false;
  var length = a.length;
  if (isIntExact(length)) {
    var n = "", l = 0;
    for (n in a) {
      if (!has(a,n))
        continue;
      if (!isInt10Exact(n) || n < 0 || n >= length)
        return false;
      l++;
    }
    return l === length;
  }
  return false;
}

function isNU(v) {
  return v === null || v === void 0;
}

function xcmpBase(left, right, _this) {
  var tl = typeof left;
  var tr = typeof right;
  if (tl !== tr) {
    _this.notEq('notEqTypes', left, right);
    return false;
  }
  switch (tl) {
  case typeof false:
  case typeof "":
  case typeof 0:
  case typeof void 0:
    if (left !== right) {
      _this.notEq('notEqValues', left, right);
      return false;
    }
    // @fallthrough
  default:
    if (left === right)
      return true;
    if (left === null || right === null) {
      _this.notEq('notEqValues', left, right);
      return false;
    }
    var commonBkStatus = _this.queryBkRelation(left, right);
    switch (commonBkStatus) {
    case 0: // have backrefs but no common
      _this.notEq('notEqStruct', left, right);
      return false;
    case 1:
      return true;
    case 2:
      var keyList = [];
      var firstUnique = _this.quickDiff(left, right, keyList);
      if (firstUnique !== null) {
        _this.notEq('notEqValues', left, right, firstUnique);
        return false;
      }
      _this.enterLR(left, right);
      keyList = _this.sort(keyList); // unnecessary (?)

      var len = keyList.length, l = 0;
      var eq = true;
      while (l < len) {
        var k = keyList[l];
        if (_this.keyTrack) _this.enterKey(k);
        var same = xcmpBase(left[k], right[k], _this);
        if (!same) {
          eq = false;
          if (_this.failFast)
            break;
        }
        if (_this.keyTrack) {
          var x = _this.exitKey();
          assert(x === k);
        }
        l++;
      }

      _this.exitLR(left, right);
      return eq;
    default: assert(false, 'unknown ['+commonBkStatus+']');
    }
  }
  assert(false);
}

var xcmpEqual =
(function() {
  function notEq(left, right, firstUnique) {
    return true;
  }

  function queryBkRelation(left, right) {
    var l = this.findLeftBk(left, 0);
    if (l === -1)
      return 2;
    var r = this.findRightBk(right, 0);
    if (r === -1)
      return 2;
    while (true) {
      if (l < r) {
        l = this.findLeftBk(left, l+1);
        if (l === -1) { return 0; }
      } else if (l > r) {
        r = this.findRightBk(right, r+1);
        if (r === -1) { return 0; }
      } else {
        return 1;
      }
    }
    assert(false);
  }

  function enterKey(name) {}

  function enterLR(left, right) {
    this.leftAncestors.push(left);
    this.rightAncestors.push(right);
  }

  function exitLR(left, right) {
    var l = this.leftAncestors.pop();
    assert(left === l);

    var r = this.rightAncestors.pop();
    assert(right === r);
  }

  function exitKey() {}

  function findRightBk(v, l) {
    return this.findBk(this.rightAncestors, v, l);
  }

  function findLeftBk(v, l) {
    return this.findBk(this.leftAncestors, v, l);
  }

  function findBk(arr, v, l) {
    var len = arr.length;
    while (l < len) {
      if (this.objEq(v, arr[l]))
        return l;
      l++;
    }
    return -1;
  }

  function sort(arr) {
    simpleQs(arr, 0, arr.length-1);
    return arr;
  }

  function objEq(a,b) { return a === b; }

  function quickDiff(left, right, keyList) {
    var name = "";
    for (name in left) {
      if (has(left, name)) {
        if (!has(right, name)) { return name; }
        keyList.push(name);
      }
    }
    for (name in right) {
      if (has(right, name) && !has(left, name))
        return name;
    }
    return null;
  }

  function xcmpEqual(left, right, _this) {
    if (!_this) _this = {};
    var need = {};

    _this.notEq || (_this.notEq = notEq);
    _this.objEq || (_this.objEq = objEq);
    _this.sort || (_this.sort = sort);
    _this.enterLR || (_this.enterLR = enterLR, need.anc = true);
    _this.enterKey || (_this.enterKey = enterKey);
    _this.exitLR || (_this.exitLR = exitLR, need.anc = true);
    _this.exitKey || (_this.exitKey = exitKey);
    _this.sort || (_this.sort = sort);
    _this.quickDiff ||
      (_this.quickDiff = quickDiff);
    _this.queryBkRelation ||
      (_this.queryBkRelation = queryBkRelation, need.findLR = true);
    (typeof(_this.failFast) === typeof true) || (_this.failFast = true);
    (typeof(_this.keyTrack) === typeof false) || (_this.keyTrack = false);

    if (need.findLR) {
      _this.findLeftBk || (_this.findLeftBk = findLeftBk);
      _this.findRightBk || (_this.findRightBk = findRightBk);
      _this.findBk || (_this.findBk = findBk);
      need.anc = true;
    }

    if (need.anc) {
      _this.leftAncestors || (_this.leftAncestors = []);
      _this.rightAncestors || (_this.rightAncestors = []);
    }

    return xcmpBase(left, right, _this);
  }
  return xcmpEqual;
}());

module.exports.deepEqual =
module.exports.xcmpEqual = xcmpEqual;
