# 第一章

一、函数式编程的定义
In computer science, functional programming is a programming paradigm where programs are constructed by applying and composing functions. It is a declarative programming paradigm in which function definitions are trees of expressions that map values to other values, rather than a sequence of imperative statements which update the running state of the program. 摘抄自wiki

函数式编程核心就在于以声明式的函数，通过组合应用函数的方式构建出程序。
我们先看一个小例子，看看它相比于命令式编程有什么区别。
code ~/playground/functional_programming

命令式编程：
代码描述用来达成期望结果的特定步骤控制流
这种呈现出来的代码结构，往往是if、esle，for，while等语句块组成。

声明式语句：
程序抽象了控制流过程举个例子SQL语句，代码具体描述的是数据流
这种呈现出来的代码结构往往是组合的函数。
二、一些理论基础
2.1 函数是一等公民
一等公民指函数在js里既可以被赋值给变量，又可以做函数参数，也可以做函数的返回值。
2.2 纯函数
相同的输入结果，永远会得到相同的结果，并且没有任何可观察的副作用。
[图片]
就如同图中的函数曲线一样，y = f(x)，基于这个特性我们可以发现纯函数有这些好处。

1. 可缓存性, 因为纯函数的原因我们可以直接从缓存中拿取x对应的y值
const squre = memoize((x) => x**2)
2. 可移植性/自文档化
// 不纯的
var signUp = function(attrs) {
  var user = saveUser(attrs);
  welcomeUser(user);
};

var saveUser = function(attrs) {
    var user = Db.save(attrs);
    ...
};

var welcomeUser = function(user) {
    Email(user, ...);
    ...
};

// 纯的，延迟执行，依赖注入
var signUp = function(Db, Email, attrs) {
  return function() {
    var user = saveUser(Db, attrs);
    welcomeUser(Email, user);
  };
};

var saveUser = function(Db, attrs) {
    ...
};

var welcomeUser = function(Email, user) {
    ...
};

3. 可测试性
非纯函数写写单元测试上需要构造上下文，但是写纯函数的单测方面，我们构造接口即可。

4. 合理性
先介绍一个概念引用透明性（referential transparency）：如果一段代码可以替换成它执行所得的结果，而且是在不改变整个程序行为的前提下替换的，那么我们就说这段代码是引用透明的。

var Immutable = require('immutable');

var decrementHP = function(player) {
  return player.set("hp", player.hp-1);
};

var isSameTeam = function(player1, player2) {
  return player1.team === player2.team;
};

var punch = function(player, target) {
  if(isSameTeam(player, target)) {
    return target;
  } else {
    return decrementHP(target);
  }
};

var jobe = Immutable.Map({name:"Jobe", hp:20, team: "red"});
var michael = Immutable.Map({name:"Michael", hp:20, team: "green"});

// punch函数仅依赖入参
punch(jobe, michael);
//=> Immutable.Map({name:"Michael", hp:19, team: "green"})



5. 并行代码
最后一点，也是决定性的一点：我们可以并行运行任意纯函数。因为纯函数根本不需要访问共享的内存，而且根据其定义，纯函数也不会因副作用而进入竞争态（race condition）。
并行代码在服务端 js 环境以及使用了 web worker 的浏览器那里是非常容易实现的，因为它们使用了线程（thread）。不过出于对非纯函数复杂度的考虑，当前主流观点还是避免使用这种并行。

定义里提到的副作用：
- 更改文件系统（比方说使用storage）
- 往数据库插入记录
- 发送一个 http 请求
- 可变数据
- 打印/log
- 获取用户输入
- DOM 查询
- 访问系统状态
总结一下绝大多数都是io操作。

2.3 技巧：curry，compose
curry(柯里化 mostly-adequate-guide-chinese）
这是一种技巧，通过保存参数，创建一个新的函数。这有什么好处呢？
1. 这种调用方式叫做partial application。可以减少很多的boilerplate code（样板文件代码）
var replace = curry(function(what, replacement, str) {
  return str.replace(what, replacement);
});

// replaceCowsWithCats :: str -> str
var replaceCowsWithCats = replace('cows', 'cats');
var replaceCatsWithCows = replace('cats', 'cows');


var replaceCowsWithCats2 = function (str) {
    return str.replace('cows', 'cats');
}
var replaceCstsWithCows2 = function (str) {
    return str.replace('cats', 'cows');
}
2. curry函数符合纯函数的定义。一个输出对应一个新函数。
3. 在并发的场景有奇效

code ~/playground/functional_programming

compose

f(g(x)) => _.compose(f,g)
一个小技巧，书写顺序是从右往左。

技巧
1. pointfree：通过compose组合函数，我们甚至都不需要定义函数的参数。这就带来了一些好处，比如说
  1. 不需要声明额外的入参名称。
  2. 石蕊实验，验证函数是否是符合函数式风格（并非绝对）
  举个例子:
// 函数式
var isLastInStock = _.compose(
  _.prop('in_stock'),
  _.last
)

// 命令式
function isLastInStock2 (cars) {
    return cars[cars.length - 1].in_stock
}
2. debug:
var trace = curry(function(tag, x){
  console.log(tag, x);
  return x;
});


范畴学
[图片]
范畴：对象的集合、态射的集合、态射的组合、identity 这个独特的态射
2.4 Hindley-milner
//  strLength :: String -> Number
var strLength = function(s){
  return s.length;
}

//  join :: String -> ([String] -> String)
var join = curry(function(what, xs){
  return xs.join(what);
});

//  match :: Regex -> (String -> [String])
var match = curry(function(reg, s){
  return s.match(reg);
});

//  replace :: Regex -> (String -> (String -> String))
var replace = curry(function(reg, sub, s){
  return s.replace(reg, sub);
});
1. 缩小可能性范围（parametricity）
// head :: [a] -> a
2.自由定理
// head :: [a] -> a
compose(f, head) == compose(head, map(f));

// filter :: (a -> Bool) -> [a] -> [a]
compose(map(f), filter(compose(p, f))) == compose(filter(p), map(f));
3.类型约束
// sort :: Ord a => [a] -> [a]
三、functor（函子）
通过上面的例子大家已经初步了解函数式编程的样子。数据在我们定义好的管道中流动。
但我们只是将数据变换成想要的形状。但我们丢失了程序中最关键的if分支、循环。也就是如何控制流，更别说异常处理、异步操作了。
最基础的容器Identity
我们先引出最基本的Identity容器。
Identity的of方法有两个优点
1. 避免了使用new关键字，这种调用方式更像是函数式
2. 创造了一个默认上下文
function Identity(x) {
    this.__value = x;
}

Identity.of = function (x) {
    return new Identity(x)
}

在之前的一些例子里我们经常会使用到map函数，当然函子也会有对应的方法。
Identity.prototype.map = function (f) {
    return Identity.of(f(this.__value))
}

Maybe容器"return语句"
function Maybe(x) {
    this.__value = x
}

// 注意该of函数
Maybe.of = function (x) {
    return new Maybe(x)
}

Maybe.prototype.isNothing = function (x) {
    return this.__value === null
}

Mapbe.prototype.map = function (f) {
    return this.isNothing() ? Maybe.of(null) : Maybe.of(f(this.__value))
}

函数式编程中的if分支语句，either、left、right
Left = function(x) {
  this.__value = x;
}

Left.of = function(x) {
  return new Left(x);
}

Left.prototype.map = function(f) { return this; }
Left.prototype.ap = function(other) { return this; }
Left.prototype.join = function() { return this; }
Left.prototype.chain = function() { return this; }
Left.prototype.inspect = function() {
  return 'Left('+inspect(this.__value)+')';
}


Right = function(x) {
  this.__value = x;
}

// TODO: remove in favor of Either.of
Right.of = function(x) {
  return new Right(x);
}

Right.prototype.map = function(f) {
  return Right.of(f(this.__value));
}

Right.prototype.join = function() {
  return this.__value;
}

Right.prototype.chain = function(f) {
  return f(this.__value);
}

Right.prototype.ap = function(other) {
  return this.chain(function(f) {
    return other.map(f);
  });
}

Right.prototype.join = function() {
  return this.__value;
}

Right.prototype.chain = function(f) {
  return f(this.__value);
}

Right.prototype.inspect = function() {
  return 'Right('+inspect(this.__value)+')';
}

var either = curry(function(f, g, e) {
  switch(e.constructor) {
    case Left: return f(e.__value);
    case Right: return g(e.__value);
  }
});

函数式编程中的异步操作IO functor

如果涉及到了IO，那函子不是不纯了吗？
function fetchSomething(x) {
 // doSomething
 return localStorage[x]
}

IO函子与其他functor最大的不同是它的value是一个函数。
pointed functor: 实现of方法的functor。

IO.of = function(x) {
  return new IO(function() {
    return x;
  });
}

IO.prototype.map = function(f) {
  return new IO(_.compose(f, this.unsafePerformIO));
}

IO.prototype.join = function() {
  return this.unsafePerformIO();
}

IO.prototype.chain = function(f) {
  return this.map(f).join();
}

IO.prototype.ap = function(a) {
  return this.chain(function(f) {
    return a.map(f);
  });
}

IO.prototype.inspect = function() {
  return 'IO('+inspect(this.unsafePerformIO)+')';
}

new IO(function fetch(){}).unsafePerformIO()
总结一些理论
[图片]
f = _.map(f)

function map(f, Functor) {
    return Functor.map(f(Functor.__value))
}

Monad（英文意思是单子，但在函数式编程里更像是洋葱）

这里的洋葱不是koa里的洋葱模型，经过一系列的函数调用后，真实的value可能会被洋葱包住好几层。你得通过使用map方法一层层的去除。
举个例子：cases/nested.js

monad实际上也是一种functor，但它实现了join接口。
monad 是可以变扁（flatten）的 pointed functor。

Maybe.prototype.join = function() {
    return this.isNothing() ? Maybe.of(null) : this._value
}


// 这里我们可以实现一个join函数
function join (m) {
    return m.join()
}

chain函数
//  chain :: Monad m => (a -> m b) -> m a -> m b
var chain = curry(function(f, m){
  return m.map(f).join(); // 或者 compose(join, map(f))(m)
});
通过chain，我们很快联想到它带来的好处
1. 不包含多余的join调用
2. 链式调用
querySelector("input.username").map(function(uname) {
  return querySelector("input.email").map(function(email) {
    return "Welcome " + uname.value + " prepare for spam at " + email.value;
  });
});
// IO("Welcome Olivia prepare for spam at olivia@tremorcontrol.net")


Applicative Functor（函数式编程中的函数部分调用）

Container.prototype.ap = function(other_container) {
  return other_container.map(this.__value);
}

identity.of(1).ap(function (a, b) => a + b).ap(2)

ap这个函数将一个funtor的函数值应用到另一个functor的值上。如果一个容器实现了ap这个函数，则称之为applivative Functor
看下代码code/part2_exercises/exercises/applicative/applicative_exercises.js 38行开始

还有一些工具函数，例如liftA4
const liftA4 = function (f, a, b, c, d) {
    return a.ap(f).ap(b).ap(c).ap.(d)
}


参考文档&推荐阅读：
函数式编程指北
Structure and Interpretation of Computer Programs
本人博客
