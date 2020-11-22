# 组件化

> 先带着这样的一个认识，我们在注册子组件的时候，就已经拿到了它的options对象了。

接着来分析组件化。`$createElement`API不仅支持原生的DOM节点，也可以渲染组件，那么在组件这块又有什么不同呢？我们回到`_createElement`函数里。

```js
    if (typeof tag === 'string') {
      var Ctor;
      ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
      if (config.isReservedTag(tag)) {
        // platform built-in elements
        if (isDef(data) && isDef(data.nativeOn)) {
          warn(
            ("The .native modifier for v-on is only valid on components but it was used on <" + tag + ">."),
            context
          );
        }
        vnode = new VNode(
          config.parsePlatformTagName(tag), data, children,
          undefined, undefined, context
        );
      } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
        // component
        vnode = createComponent(Ctor, data, context, children, tag);
      } else {
        // unknown or unlisted namespaced elements
        // check at runtime because it may get assigned a namespace when its
        // parent normalizes children
        vnode = new VNode(
          tag, data, children,
          undefined, undefined, context
        );
      }
    } else {
      // direct component options / constructor
      vnode = createComponent(tag, data, context, children);
    }
```

调用`createComponent`的情况有两种： 1.tag是string，且注册到vue组件上去了。2. tag是一个options或**构造函数**。该函数定义在
src/core/vdom/create-component.js文件中。

执行该函数时，Ctor参数已是对象或是构造函数（之前的tag）。
1. 如果是对象，会统一扩展成构造函数。

```js
    var baseCtor = context.$options._base;

    // plain options object: turn it into a constructor
    if (isObject(Ctor)) {
      Ctor = baseCtor.extend(Ctor);
    }

    // if at this stage it's not a constructor or an async component factory,
    // reject.
    if (typeof Ctor !== 'function') {
      {
        warn(("Invalid Component definition: " + (String(Ctor))), context);
      }
      return
    }
```

extend函数它创造了一个子类函数，这个子类，通过原型式继承父类的prototype，创造了一个原型，并将本身的prototype指向这个对象，并修改其consrtuctor的这个值。并将以及混入了一些静态属性，例如cid，options等属性。

```js
  var Sub = function VueComponent (options) {
    this._init(options);
  };
  Sub.prototype = Object.create(Super.prototype);
  Sub.prototype.constructor = Sub;
  Sub.cid = cid++;
  Sub.options = mergeOptions(
    Super.options,
    extendOptions
  );
  Sub['super'] = Super;
```

在转化props和computed属性时，还在子类的prototype上做了代理。
```js
  if (Sub.options.props) {
    initProps$1(Sub);
  }
  if (Sub.options.computed) {
    initComputed$1(Sub);
  }
```
> 官方注释：这避免了每个实例创造的时候都需要调用Object.defineProperty()。这也说明了props和computed就是只读的。另外在同一个父组件下的子组件，它们的prototype是指向同一个原型的。

在这样的场景下：子类options是相同的，这时候就可以对子类的options进行写入，缓存一个数组，通过父构造的id来缓存子类，而没必要重复定义。
```js
  var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
  if (cachedCtors[SuperId]) {
    return cachedCtors[SuperId]
  }
  //...

  cachedCtors[SuperId] = Sub;
  return Sub;
```

构造完子类构造函数后，接下来就是对该组件进行一些功能上的处理。

例如
* v-model。
* 根据props属性key，提取对应$attrs对象中的值。
* 函数组件
* 抽象组件

### 安装组件钩子函数

注意这个data参数，在patch阶段，这是一个很重要的变量。
```js
  function installComponentHooks (data) {
    var hooks = data.hook || (data.hook = {});
    for (var i = 0; i < hooksToMerge.length; i++) {
      var key = hooksToMerge[i];
      var existing = hooks[key];
      var toMerge = componentVNodeHooks[key];
      if (existing !== toMerge && !(existing && existing._merged)) {
        hooks[key] = existing ? mergeHook$1(toMerge, existing) : toMerge;
      }
    }
  }
```

> 整个 installComponentHooks 的过程就是把 componentVNodeHooks 的钩子函数合并到 data.hook 中，在 VNode 执行 patch 的过程中执行相关的钩子函数，具体的执行我们稍后在介绍 patch 过程中会详细介绍。这里要注意的是合并策略，在合并过程中，如果某个时机的钩子已经存在 data.hook 中，那么通过执行 mergeHook 函数做合并，这个逻辑很简单，就是在最终执行的时候，依次执行这两个钩子函数即可。

### 实例化vnode

最后vnode实例化
```js
  const name = Ctor.options.name || tag
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  )
  return vnode
```
不同于普通DOM节点，组件节点是没有children属性的。

> 等整个render函数执行完成后，我们会获得一颗vnode树。在后面就是将VNode更新到DOM树上。

### 创建子组件节点

因为节点是个树的形式，这里生成DOM的顺序是按照先序遍历的。（这也很好理解，没有父节点，子节点怎么跟随父节点）

```js
    vnode.elm = vnode.ns
      ? nodeOps.createElementNS(vnode.ns, tag)
      : nodeOps.createElement(tag, vnode);
    setScope(vnode);

    /* istanbul ignore if */
    {
      createChildren(vnode, children, insertedVnodeQueue);
      if (isDef(data)) {
        invokeCreateHooks(vnode, insertedVnodeQueue);
      }
      insert(parentElm, vnode.elm, refElm);
    }
```

然后在createChildren()这个函数里，就开始创建子节点真实DOM，递归调用createElm函数。不同的是，组件VNode，不同于普通vnode节点（它的children比较特殊）。他直接进入了createComponent()这个分支中。

```js
// createElm函数
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return
  }

  function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
  var i = vnode.data;
  if (isDef(i)) {
    var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode, false /* hydrating */);
    }
    // after calling the init hook, if the vnode is a child component
    // it should've created a child instance and mounted it. the child
    // component also has set the placeholder vnode's elm.
    // in that case we can just return the element and be done.
    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue);
      insert(parentElm, vnode.elm, refElm);
      if (isTrue(isReactivated)) {
        reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
      }
      return true
    }
  }
}
```

可以看到`i = i.hook`和`i = i.init`这两条语句，这就是在之前创建组件VNode时，安装的hooks。此时i变量就是init函数。

```js
  var componentVNodeHooks = {
    init: function init (vnode, hydrating) {
      
      if (
        vnode.componentInstance &&
        !vnode.componentInstance._isDestroyed &&
        vnode.data.keepAlive
      ) {
        // kept-alive components, treat as a patch
        var mountedNode = vnode; // work around flow
        componentVNodeHooks.prepatch(mountedNode, mountedNode);
      } else {
        var child = vnode.componentInstance = createComponentInstanceForVnode(
          vnode,
          activeInstance
        );
        child.$mount(hydrating ? vnode.elm : undefined, hydrating);
      }
    }
  }
```

我们先直接跳过keep-alive的逻辑，当执行到createComponentInstanceForVnode这个函数。之前在构建Vnode的同时，构造了Vue的构造函数Ctor但还没执行，此时就开始执行这个Ctor。此时我们就获得了一个VM实例。最后在执行这个实例的$mount函数。

后面就是又执行了子组件的mount的过程，基本上流程和之前根实例一样，但也有些许区别。因为此时$mount的第一个参数el是undefined。首先在根实例中它渲染的是一个组件VNode，随后VNode开始创建自己的一个生命周期，通过render函数又创建了一个树结构的子树，这个时候还没合并哦！所以我们再来看看，这个合并的过程。

```
  root根实例               组件的根节点
      / \                     / \
     /   \                   /   \
    /     \                 /     \
  普通节点 组件节点          普通节点 普通节点
```

```js

// _upadte函数

  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    var prevEl = vm.$el;
    var prevVnode = vm._vnode;
    var restoreActiveInstance = setActiveInstance(vm);
    vm._vnode = vnode;
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */);
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    restoreActiveInstance();
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };

```

可以打个断点，此时的VNode就是组件的render函数渲染出的VNode树，而这个VNode和组件VNode是有关联的，组件VNode是VNode的父节点。
最后一步就是将子树合并到父组件的树中。看到这个函数

```js
  function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i = vnode.data;
    if (isDef(i)) {
      var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */);
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue);
        insert(parentElm, vnode.elm, refElm);
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
        }
        return true
      }
    }
  }

  function initComponent (vnode, insertedVnodeQueue) {
  if (isDef(vnode.data.pendingInsert)) {
    insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
    vnode.data.pendingInsert = null;
  }
  vnode.elm = vnode.componentInstance.$el;
  if (isPatchable(vnode)) {
    invokeCreateHooks(vnode, insertedVnodeQueue);
    setScope(vnode);
  } else {
    // empty component root.
    // skip all element-related modules except for ref (#3455)
    registerRef(vnode);
    // make sure to invoke the insert hook
    insertedVnodeQueue.push(vnode);
  }
}
```

当子组件构建完成后，通过initComponent函数，将组件vm实例中的真实DOM节点赋值给VNode。并在后面的语句中，插入到父组件中的父节点中。到这里整个创建子组件的过程就完成了。

### 总结

1. 我们可以看到，Vue对待组件VNode和普通VNode"一视同仁"。都是通过$createElement这个函数去创建VNode节点。当然区别就在于组件VNode会处理它的构造函数，一些语法糖等。但关键的是它们都是VNode。
2. 创建组件真实DOM的时候，因为这个VNode相当于一颗子树，并且有对应的VM实例。所以他会单独有自己的一个声明周期，有对应的VNode树。在最后构建完成后，会把整个子树合并到父组件中。