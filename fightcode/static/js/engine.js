var ANG_INCREMENT, Arena, BulletStatus, ElementStatus, Engine, MOVE_INCREMENT, PI2, RAD2DEG, Rectangle, RobotActions, RobotStatus, Vector2, WallStatus,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

MOVE_INCREMENT = 1;

ANG_INCREMENT = 1;

PI2 = Math.PI * 2;

RAD2DEG = 180 / Math.PI;

Vector2 = (function() {

  function Vector2(x, y) {
    this.x = x;
    this.y = y;
    if (this.x instanceof Vector2) {
      this.y = this.x.y;
      this.x = this.x.x;
    }
  }

  Vector2.prototype.rotate = function(angle, reference) {
    angle = (angle * Math.PI) / 180;
    this.x = reference.x + ((this.x - reference.x) * Math.cos(angle)) - ((this.y - reference.y) * Math.sin(angle));
    this.y = reference.y + ((this.y - reference.y) * Math.cos(angle)) - ((this.x - reference.x) * Math.sin(angle));
    return this;
  };

  Vector2.prototype.angleTo = function(other) {
    return Math.atan2(other.y - this.y, other.x - this.x);
  };

  Vector2.add = function(v1, v2) {
    return new Vector2(v1.x + v2.x, v1.y + v2.y);
  };

  Vector2.subtract = function(v1, v2) {
    return new Vector2(v1.x - v2.x, v1.y - v2.y);
  };

  Vector2.prototype.projectTo = function(axis) {
    var denominator, divisionResult, numerator;
    numerator = (this.x * axis.x) + (this.y * axis.y);
    denominator = (axis.x * axis.x) + (axis.y * axis.y);
    divisionResult = numerator / denominator;
    return new Vector2(divisionResult * axis.x, divisionResult * axis.y);
  };

  return Vector2;

})();

RobotActions = (function() {

  function RobotActions(currentStatus) {
    this.id = currentStatus.id;
    this.queue = [];
  }

  RobotActions.prototype.move = function(amount, direction) {
    var _i, _ref;
    for (_i = 1, _ref = amount / MOVE_INCREMENT; 1 <= _ref ? _i <= _ref : _i >= _ref; 1 <= _ref ? _i++ : _i--) {
      this.queue.push({
        action: "move",
        direction: direction
      });
    }
    return true;
  };

  RobotActions.prototype.ahead = function(amount) {
    return this.move(amount, 1);
  };

  RobotActions.prototype.back = function(amount) {
    return this.move(amount, -1);
  };

  RobotActions.prototype.rotateCannon = function(degrees) {
    var _i, _ref, _results;
    _results = [];
    for (_i = 1, _ref = degrees / ANG_INCREMENT; 1 <= _ref ? _i <= _ref : _i >= _ref; 1 <= _ref ? _i++ : _i--) {
      _results.push(this.queue.push({
        action: "rotateCannon",
        direction: degrees
      }));
    }
    return _results;
  };

  RobotActions.prototype.turn = function(degrees) {
    var _i, _ref, _results;
    _results = [];
    for (_i = 1, _ref = degrees / ANG_INCREMENT; 1 <= _ref ? _i <= _ref : _i >= _ref; 1 <= _ref ? _i++ : _i--) {
      _results.push(this.queue.push({
        action: "turn",
        direction: degrees
      }));
    }
    return _results;
  };

  RobotActions.prototype.fire = function(bullets) {
    return this.queue.push({
      action: "fire"
    });
  };

  return RobotActions;

})();

Arena = (function() {

  function Arena(width, height) {
    this.width = width;
    this.height = height;
    this.walls = [new WallStatus(this.width / 2, 0, this.width, 1), new WallStatus(this.width, this.height / 2, 1, this.height), new WallStatus(this.width / 2, this.height, this.width, 1), new WallStatus(0, this.height / 2, 1, this.height)];
  }

  return Arena;

})();

Rectangle = (function() {

  function Rectangle(x, y, width, height, angle) {
    if (x == null) {
      x = 0;
    }
    if (y == null) {
      y = 0;
    }
    if (width == null) {
      width = 1;
    }
    if (height == null) {
      height = 1;
    }
    this.angle = angle != null ? angle : 0;
    this.position = new Vector2(x, y);
    this.dimension = {
      width: width,
      height: height
    };
  }

  Rectangle.prototype.top = function() {
    return this.position.y - (this.dimension.height / 2);
  };

  Rectangle.prototype.left = function() {
    return this.position.x - (this.dimension.width / 2);
  };

  Rectangle.prototype.right = function() {
    return this.position.x + (this.dimension.width / 2);
  };

  Rectangle.prototype.bottom = function() {
    return this.position.y + (this.dimension.height / 2);
  };

  Rectangle.prototype.upperRightCorner = function() {
    return new Vector2(this.right(), this.top()).rotate(this.angle, this.position);
  };

  Rectangle.prototype.upperLeftCorner = function() {
    return new Vector2(this.left(), this.top()).rotate(this.angle, this.position);
  };

  Rectangle.prototype.lowerLeftCorner = function() {
    return new Vector2(this.left(), this.bottom()).rotate(this.angle, this.position);
  };

  Rectangle.prototype.lowerRightCorner = function() {
    return new Vector2(this.right(), this.bottom()).rotate(this.angle, this.position);
  };

  Rectangle.prototype.intersects = function(other) {
    var axis, axisList, _i, _len;
    axisList = [Vector2.subtract(this.upperRightCorner(), this.upperLeftCorner()), Vector2.subtract(this.upperRightCorner(), this.lowerRightCorner()), Vector2.subtract(other.upperRightCorner(), other.upperLeftCorner()), Vector2.subtract(other.upperRightCorner(), other.lowerRightCorner())];
    for (_i = 0, _len = axisList.length; _i < _len; _i++) {
      axis = axisList[_i];
      if (!this.isAxisCollision(other, axis)) {
        return false;
      }
    }
    return true;
  };

  Rectangle.prototype.isAxisCollision = function(other, axis) {
    var maxMine, maxOther, minMine, minOther, myProjections, otherProjections;
    myProjections = [this.generateScalar(this.upperLeftCorner(), axis), this.generateScalar(this.upperRightCorner(), axis), this.generateScalar(this.lowerLeftCorner(), axis), this.generateScalar(this.lowerRightCorner(), axis)];
    otherProjections = [this.generateScalar(other.upperLeftCorner(), axis), this.generateScalar(other.upperRightCorner(), axis), this.generateScalar(other.lowerLeftCorner(), axis), this.generateScalar(other.lowerRightCorner(), axis)];
    minMine = Math.min.apply(Math, myProjections);
    maxMine = Math.max.apply(Math, myProjections);
    minOther = Math.min.apply(Math, otherProjections);
    maxOther = Math.max.apply(Math, otherProjections);
    if (minMine <= maxOther && maxMine >= maxOther) {
      return true;
    } else if (minOther <= maxMine && maxOther >= maxMine) {
      return true;
    }
    return false;
  };

  Rectangle.prototype.generateScalar = function(corner, axis) {
    var projected;
    projected = corner.projectTo(axis);
    return (axis.x * projected.x) + (axis.y * projected.y);
  };

  return Rectangle;

})();

ElementStatus = (function() {

  ElementStatus.id = 1;

  function ElementStatus() {
    this.id = 'element' + (RobotStatus.id++);
    this.rectangle = new Rectangle();
  }

  ElementStatus.prototype.isAlive = function() {
    return true;
  };

  return ElementStatus;

})();

WallStatus = (function(_super) {

  __extends(WallStatus, _super);

  function WallStatus(x, y, width, height) {
    WallStatus.__super__.constructor.call(this);
    this.rectangle.position.x = x;
    this.rectangle.position.y = y;
    this.rectangle.dimension.width = width;
    this.rectangle.dimension.height = height;
  }

  return WallStatus;

})(ElementStatus);

BulletStatus = (function(_super) {

  __extends(BulletStatus, _super);

  function BulletStatus(robotStatus) {
    var xInc, yInc;
    this.robotStatus = robotStatus;
    BulletStatus.__super__.constructor.call(this);
    this.rectangle.angle = (this.robotStatus.rectangle.angle + this.robotStatus.cannonAngle) % 360;
    this.angleRad = (this.rectangle.angle * Math.PI) / 180;
    xInc = Math.cos(this.angleRad) * (this.robotStatus.rectangle.dimension.width / 2);
    yInc = Math.sin(this.angleRad) * (this.robotStatus.rectangle.dimension.height / 2);
    this.rectangle.position.x = this.robotStatus.rectangle.position.x + xInc;
    this.rectangle.position.y = this.robotStatus.rectangle.position.y + yInc;
    this.speed = 2;
    this.strength = 1;
    this.running = true;
  }

  BulletStatus.prototype.isIdle = function() {
    return false;
  };

  BulletStatus.prototype.isAlive = function() {
    return this.running;
  };

  BulletStatus.prototype.runItem = function() {
    this.previousPosition = new Vector2(this.rectangle.position);
    this.rectangle.position.x += Math.cos(this.angleRad) * this.speed;
    this.rectangle.position.y += Math.sin(this.angleRad) * this.speed;
    return null;
  };

  BulletStatus.prototype.destroy = function() {
    return this.running = false;
  };

  BulletStatus.prototype.rollbackAfterCollision = function() {
    if (this.previousPosition) {
      return this.rectangle.position = this.previousPosition;
    }
  };

  BulletStatus.prototype.updateQueue = function() {};

  return BulletStatus;

})(ElementStatus);

RobotStatus = (function(_super) {

  __extends(RobotStatus, _super);

  function RobotStatus(robot, arena) {
    this.robot = robot;
    this.arena = arena;
    RobotStatus.__super__.constructor.call(this);
    this.life = 100;
    this.cannonAngle = 0;
    this.rectangle.dimension = {
      width: 27,
      height: 24
    };
    this.baseScanWaitTime = 50;
    this.scanWaitTime = 0;
    this.queue = [];
  }

  RobotStatus.prototype.isAlive = function() {
    return this.life > 0;
  };

  RobotStatus.prototype.isIdle = function() {
    return this.queue.length === 0;
  };

  RobotStatus.prototype.takeHit = function(buletStatus) {
    this.life -= buletStatus.strength;
    return buletStatus.destroy();
  };

  RobotStatus.prototype.rollbackAfterCollision = function() {
    if (this.previousPosition) {
      this.rectangle.position = this.previousPosition;
    }
    if (this.previousAngle) {
      return this.rectangle.angle = this.previousAngle;
    }
  };

  RobotStatus.prototype.cannonTotalAngle = function() {
    return (this.rectangle.angle + this.cannonAngle) % 360;
  };

  RobotStatus.prototype.canScan = function() {
    return this.scanWaitTime === 0;
  };

  RobotStatus.prototype.tickScan = function() {
    if (this.scanWaitTime > 0) {
      return this.scanWaitTime -= 1;
    }
  };

  RobotStatus.prototype.preventScan = function() {
    return this.scanWaitTime = this.baseScanWaitTime;
  };

  RobotStatus.prototype.runItem = function() {
    var direction, item, rad;
    item = this.queue.shift();
    if (!item) {
      return;
    }
    direction = 1;
    if (item.direction && item.direction < 0) {
      direction = -1;
    }
    this.previousPosition = null;
    this.previousAngle = null;
    this.previousCannonAngle = null;
    switch (item.action) {
      case 'move':
        rad = (this.rectangle.angle * Math.PI) / 180;
        this.previousPosition = new Vector2(this.rectangle.position);
        this.rectangle.position.x += Math.cos(rad) * MOVE_INCREMENT * direction;
        this.rectangle.position.y += Math.sin(rad) * MOVE_INCREMENT * direction;
        break;
      case 'rotateCannon':
        this.previousCannonAngle = this.cannonAngl;
        this.cannonAngle += ANG_INCREMENT * direction;
        this.cannonAngle = this.cannonAngle % 360;
        break;
      case 'turn':
        this.previousAngle = this.angle;
        this.rectangle.angle += ANG_INCREMENT * direction;
        this.rectangle.angle = this.rectangle.angle % 360;
        break;
      case 'fire':
        return new BulletStatus(this);
    }
    return null;
  };

  RobotStatus.prototype.updateQueue = function(actions) {
    return this.queue = actions.queue.concat(this.queue);
  };

  return RobotStatus;

})(ElementStatus);

Engine = (function() {

  function Engine() {
    var height, maxTurns, robot, robots, width;
    width = arguments[0], height = arguments[1], maxTurns = arguments[2], robots = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
    this.maxTurns = maxTurns;
    this.robots = robots;
    this.round = 0;
    this.arena = new Arena(width, height);
    this.robotsStatus = (function() {
      var _i, _len, _ref, _results;
      _ref = this.robots;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        robot = _ref[_i];
        _results.push(new RobotStatus(robot, this.arena));
      }
      return _results;
    }).call(this);
  }

  Engine.prototype.isDraw = function() {
    return this.round > this.maxTurns;
  };

  Engine.prototype.safeCall = function() {
    var method, obj, params;
    obj = arguments[0], method = arguments[1], params = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
    if (!obj[method]) {
      return;
    }
    return obj[method].apply(obj, params);
  };

  Engine.prototype.checkCollision = function(robotStatus) {
    var actions, eventName, status, wall, _i, _j, _len, _len1, _ref, _ref1;
    actions = new RobotActions(robotStatus);
    _ref = this.arena.walls;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      wall = _ref[_i];
      if (robotStatus.rectangle.intersects(wall.rectangle)) {
        robotStatus.rollbackAfterCollision();
        if (robotStatus instanceof BulletStatus) {
          this.roundLog.events.push({
            type: 'exploded',
            id: robotStatus.id
          });
        } else {
          this.safeCall(robotStatus.robot, 'onWallCollision', {
            robot: actions
          });
        }
      }
    }
    if (robotStatus instanceof BulletStatus) {
      return actions;
    }
    _ref1 = this.robotsStatus;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      status = _ref1[_j];
      if (status === robotStatus || !status.isAlive()) {
        continue;
      }
      if (robotStatus.rectangle.intersects(status.rectangle)) {
        eventName = 'onRobotCollision';
        if (status instanceof BulletStatus) {
          if (status.robotStatus === robotStatus) {
            continue;
          }
          eventName = 'onHitByBullet';
          robotStatus.takeHit(status);
          this.roundLog.events.push({
            type: 'exploded',
            id: status.id
          });
        } else {
          robotStatus.rollbackAfterCollision();
        }
        this.safeCall(robotStatus.robot, eventName, {
          robot: actions,
          bulletBearing: robotStatus.rectangle.angle - status.rectangle.angle
        });
      }
    }
    return actions;
  };

  Engine.prototype.checkSight = function(robotStatus) {
    var actions, status, virtualRect, _i, _len, _ref;
    actions = new RobotActions(robotStatus);
    virtualRect = new Rectangle(robotStatus.rectangle.position.x, robotStatus.rectangle.position.y, 1000, 2, robotStatus.cannonTotalAngle());
    robotStatus.tickScan();
    _ref = this.robotsStatus;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      status = _ref[_i];
      if (status === robotStatus || !status.isAlive()) {
        continue;
      }
      if (!(status instanceof RobotStatus)) {
        continue;
      }
      if (robotStatus.canScan() && virtualRect.intersects(status.rectangle)) {
        robotStatus.preventScan();
        this.safeCall(robotStatus.robot, 'onScannedRobot', {
          robot: actions
        });
        this.roundLog.events.push({
          type: 'onScannedRobot',
          id: robotStatus.id
        });
      }
    }
    return actions;
  };

  Engine.prototype.fight = function() {
    var actions, aliveRobots, fightLog, newStatus, status, _i, _j, _len, _len1, _ref, _ref1;
    aliveRobots = this.robotsStatus.length;
    fightLog = [];
    while (aliveRobots > 1 && !this.isDraw()) {
      this.round++;
      fightLog.push(this.roundLog = {
        round: this.round,
        objects: [],
        events: []
      });
      aliveRobots = 0;
      _ref = this.robotsStatus;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        status = _ref[_i];
        if (!status.isAlive()) {
          continue;
        }
        this.roundLog.objects.push({
          type: status instanceof RobotStatus ? 'tank' : 'bullet',
          id: status.id,
          position: {
            x: status.rectangle.position.x,
            y: status.rectangle.position.y
          },
          dimension: {
            width: status.rectangle.dimension.width,
            height: status.rectangle.dimension.height
          },
          health: status.health,
          angle: status.rectangle.angle,
          cannonAngle: status.cannonAngle
        });
        if (status.isIdle()) {
          actions = new RobotActions(status);
          this.safeCall(status.robot, 'onIdle', {
            robot: actions
          });
          status.updateQueue(actions);
        }
        newStatus = status.runItem();
        if (newStatus) {
          this.robotsStatus.push(newStatus);
        }
        actions = this.checkCollision(status);
        status.updateQueue(actions);
        if (status instanceof RobotStatus) {
          aliveRobots++;
        }
      }
      _ref1 = this.robotsStatus;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        status = _ref1[_j];
        if (!(status.isAlive() && status instanceof RobotStatus)) {
          continue;
        }
        actions = this.checkSight(status);
        status.updateQueue(actions);
      }
    }
    if (this.isDraw()) {
      if (this.isDraw()) {
        console.log("DRAW!");
      }
    }
    return fightLog;
  };

  return Engine;

})();
