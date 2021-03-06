// Generated by CoffeeScript 1.8.0
(function() {
  var Benchmark, findById, manips, toggle, traverse;

  traverse = function(finalLevel, node, fn, level) {
    var child, _i, _len, _ref, _results;
    level = level || 0;
    fn(node, level);
    if (finalLevel === level) {
      return;
    }
    _ref = node.children;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      child = _ref[_i];
      _results.push(traverse(finalLevel, child, fn, level + 1));
    }
    return _results;
  };

  findById = function(root, nodeId) {
    var node;
    node = null;
    traverse(Number.MAX_VALUE, root, function(n) {
      if (n.id === parseInt(nodeId)) {
        return node = n;
      }
    });
    return node;
  };

  toggle = function(elem, name) {
    var check, oldValue;
    oldValue = elem.attr(name);
    check = elem.data('toggle-check-' + name);
    if (check === void 0) {
      check = true;
    }
    elem.attr(name, elem.data('toggle-' + name));
    elem.data('toggle-' + name, oldValue);
    elem.data('toggle-check-' + name, !check);
    return check;
  };

  manips = {
    fullname: function(node) {
      return node.method.owner.packageName + '.' + node.method.owner.name + '.' + node.method.name + node.method.descriptor;
    },
    duration: function(node) {
      return (node.elapsedTime / 1000000).toFixed(3);
    }
  };

  Benchmark = (function() {
    function Benchmark(templates, $menus, $summary) {
      this.templates = templates;
      this.$menus = $menus;
      this.$summary = $summary;
    }

    Benchmark.prototype.drawTraceTrees = function(root) {
      var h, mm, paper, width;
      this.$menus.html('');
      $("#canvas").html('');
      paper = Raphael("canvas", '100%', 600);
      width = $("#canvas").width();
      h = 25;
      mm = {
        min: Number.MAX_VALUE,
        max: Number.MIN_VALUE
      };
      traverse(Number.MAX_VALUE, root, function(node) {
        if (node.startTime < mm.min) {
          mm.min = node.startTime;
        }
        if (node.startTime + node.elapsedTime > mm.max) {
          return mm.max = node.startTime + node.elapsedTime;
        }
      });
      mm.aspects = 1 / (mm.max - mm.min);
      traverse(Number.MAX_VALUE, root, function(node, level) {
        node.r = {};
        node.r.left = (node.startTime - mm.min) * mm.aspects * width;
        node.r.right = (node.startTime + node.elapsedTime - mm.min) * mm.aspects * width;
        return node.r.top = h * level;
      });
      return traverse(Number.MAX_VALUE, root, (function(_this) {
        return function(node) {
          var left, makeRect;
          makeRect = function(left, top, width, height) {
            var rect;
            rect = paper.rect(left, top, width, height).attr('fill', '#99cc00').attr('stroke', '#000').attr('title', manips.fullname(node)).data('toggle-stroke', '#ff0');
            rect.dblclick(function() {
              window.history.pushState(root, null, '#' + node.id);
              return _this.draw(node);
            });
            rect.click(function() {
              if (toggle(rect, 'stroke')) {
                return _this.$menus.append(_this.templates.menus({
                  id: node.id,
                  "package": node.method.owner.packageName,
                  className: node.method.owner.name,
                  method: node.method.name,
                  parameter: node.method.descriptor,
                  duration: manips.duration(node)
                }));
              } else {
                return _this.$menus.find('#info-' + node.id).remove();
              }
            });
            return rect;
          };
          left = node.r.left;
          if (node.r.right - left > 2) {
            return makeRect(left, node.r.top, node.r.right - left, h);
          }
        };
      })(this));
    };

    Benchmark.prototype.start = function(profId) {
      return $.get(ROOT_URL + "/rest/prof/" + profId + "/root").done((function(_this) {
        return function(root) {
          _this.root = root;
          _this.draw(root.children[0]);
          return $(window).on('popstate', function() {
            return _this.draw(root.children[0]);
          });
        };
      })(this));
    };

    Benchmark.prototype.draw = function(root) {
      var nodeId;
      if (window.location.hash === null || window.location.hash === '') {
        this.drawTraceTrees(root);
        return this.drawSummary(root);
      } else {
        nodeId = window.location.hash.replace('#', '');
        return $.get(ROOT_URL + "/rest/prof/node/" + nodeId).done((function(_this) {
          return function(node) {
            _this.drawTraceTrees(node);
            return _this.drawSummary(node);
          };
        })(this));
      }
    };

    Benchmark.prototype.drawSummary = function(root) {
      var colors, h, mm, paper, parent, width;
      this.$summary.html('');
      parent = findById(this.root.children[0], root.parentId);
      this.$summary.append(this.templates.summary({
        func: manips.fullname(root),
        duration: manips.duration(root),
        parentId: parent === null ? "#" : root.parentId,
        parentName: parent === null ? "" : manips.fullname(parent)
      }));
      $("#summary-canvas").html('');
      paper = Raphael("summary-canvas", '100%', 100);
      width = $("#summary-canvas").width();
      h = 25;
      colors = ['green', 'lime'];
      mm = {
        min: Number.MAX_VALUE,
        max: Number.MIN_VALUE
      };
      traverse(1, root, function(node) {
        if (node.startTime < mm.min) {
          mm.min = node.startTime;
        }
        if (node.startTime + node.elapsedTime > mm.max) {
          return mm.max = node.startTime + node.elapsedTime;
        }
      });
      mm.aspects = 1 / (mm.max - mm.min);
      traverse(1, root, function(node, level) {
        node.r = {};
        node.r.left = (node.startTime - mm.min) * mm.aspects * width;
        node.r.right = (node.startTime + node.elapsedTime - mm.min) * mm.aspects * width;
        node.r.top = 0;
        return node.r.color = colors[level];
      });
      return traverse(1, root, (function(_this) {
        return function(node) {
          var makeRect;
          makeRect = function(left, top, width, height, color) {
            var rect;
            rect = paper.rect(left, top, width, height);
            rect.attr('fill', color);
            rect.attr('stroke', '#000');
            rect.attr('title', node.method.owner.packageName + '.' + node.method.owner.name + '.' + node.method.name + node.method.descriptor);
            rect.data('toggle-stroke', '#ff0');
            rect.dblclick(function() {
              window.history.pushState(root, null, '#' + node.id);
              return _this.draw(node);
            });
            rect.click(function() {
              if (toggle(rect, 'stroke')) {
                return _this.$menus.append(_this.templates.menus({
                  id: node.id,
                  "package": node.method.owner.packageName,
                  className: node.method.owner.name,
                  method: node.method.name,
                  parameter: node.method.descriptor,
                  duration: (node.elapsedTime / 1000000000).toFixed(3)
                }));
              } else {
                return _this.$menus.find('#info-' + node.id).remove();
              }
            });
            return rect;
          };
          return makeRect(node.r.left, node.r.top, node.r.right - node.r.left, h, node.r.color);
        };
      })(this));
    };

    return Benchmark;

  })();

  jandy.Benchmark = Benchmark;

}).call(this);

//# sourceMappingURL=benchmark.js.map
