# 从VNode到DOM

导读： 开发者在开发过程中，实际上并没有操作DOM，而是使用模版语法构造了render函数。整个从VNode到DOM的过程非常值得仔细推敲。

### render函数

先引入两个时机点：
1. 在引入Vue时，调用了`renderMixin`方法。它在Vue构造函数的原型链上，混入了一些方法，最主要的两个是`$nextTick`函数和下方的`_render`函数。

```js
  Vue.prototype._render = function () {

    const { render, _parentVnode } = vm.$options

    vnode = render.call(vm._renderProxy, vm.$createElement)
  }
```

2. 在new一个Vue实例过程中，还调用了`initRender`方法。这个函数，往当前的vue实例里加了一些变量。
```js
  // 内部调用
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // 开发者调用
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
```
两者的区别就是最后的参数，这个影响到了`normalizationType`变量。

如果开发者自己写出一些render函数，例如：
```js
{
  render (h) {
    return h('div', {
      attrs: {
        id: 'title'
      }
    }, ['textNode'])
  }
}
```

::: tip
在这里我们可以先下个结论，`h`实际上就是`vm.$createElement`，因为在执行`_render`函数时，给`render`函数注入的第一个入参就是`vm.$createElement`。
:::

### $createElement 和 VNode

$createElement函数最终会返回一个VNode对象，这个对象是DOM的一个简版，先不表。

在生成整个vnode的过程中，`$createElement`、`createElement`、`_createElement`这几个函数先后调用。 PS: 篇幅关系，在_createElement函数中间删除了很多源码。`_createElement的源码可以在/src/core/vdom/create-element.js文件中看到。`

```js

vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)

export function createElement (
  context: Component,
  tag: any,
  data: any,
  children: any,
  normalizationType: any,
  alwaysNormalize: boolean
): VNode | Array<VNode> {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children
    children = data
    data = undefined
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE
  }
  return _createElement(context, tag, data, children, normalizationType)
}

export function _createElement (
  context: Component,
  tag?: string | Class<Component> | Function | Object,
  data?: VNodeData,
  children?: any,
  normalizationType?: number
): VNode | Array<VNode> {
  if (isDef(data) && isDef((data: any).__ob__)) {
    process.env.NODE_ENV !== 'production' && warn(
      `Avoid using observed data object as vnode data: ${JSON.stringify(data)}\n` +
      'Always create fresh vnode data objects in each render!',
      context
    )
    return createEmptyVNode()
  }

  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) applyNS(vnode, ns)
    if (isDef(data)) registerDeepBindings(data)
    return vnode
  } else {
    return createEmptyVNode()
  }
}
```

1. $createElement函数的封装是为了动态的获取vm。
2. createElement函数是为了让参数更灵活。开发者可以在第二个参数写子节点数组。
3. _createElement函数真正意义上的创建了vNode。

### children规范化

我们知道在一个组件中必不可少的就是子节点。首先根据`normalizationType`的不同，调用了不同方法，**规范化children**。

```js
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children)
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children)
  }
```

`normalizeChildren`被调用有两种场景：
1. 当开发者使用了手写当render函数。
2. 编译slot、v-for的时候会产生嵌套数组的情况。

该函数通过for循环，获得单个节点`c`变量，然后按照节点`c`的类型去处理。
1. 数组类型,递归调用normalizeArrayChildren函数
2. 基础类型，通过`createTextVNode`方法转换成VNode类型。
3. 另外都是vnode的情况，然后v-for生成的vnode会在增加个key的属性
最后返回vnode数组。下面是伪代码，事实上，vue还考虑到合并textNode这类的情况。

```js
      if (Array.isArray(c)) {
        // 
      } else if (isPrimitive(c)) {
        // 
      } else {
        } else {
          // default key for nested array children (likely generated by v-for)
          if (isTrue(children._isVList) &&
            isDef(c.tag) &&
            isUndef(c.key) &&
            isDef(nestedIndex)) {
            c.key = "__vlist" + nestedIndex + "_" + i + "__";
          }
          res.push(c);
        }
      }
    }
```

### 构建vnode

```js
  var vnode, ns;
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
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) { applyNS(vnode, ns); }
    if (isDef(data)) { registerDeepBindings(data); }
    return vnode
  } else {
    return createEmptyVNode()
  }
```

1. tag变量是string。
  * 内置的节点，创建普通VNode
  * 或是已经注册的componentName，则通过`createComponent`创建一个component Vnode
  * 其他则是创建一个未知标签的VNode
2. 其他情况下，就通过`createComponent`创建一个component Vnode（那当tag类型是一些null，或undefined值，是否会有做处理呢？ 答：这个在处理子节点前，就已经返回empty VNode了。）

### 渲染到DOM(_update)

再次回到先前的`Vue.prototype._render`函数。执行完render函数后获取到了vnode，在随后得校验vnode的格式。例如不能是数组等，这里不再赘述，最后_render函数就返回了vnode。

此时下一步就执行vm._update(vm._render(), hydrating);后面那个参数不用管，它是SSR时才用到的，此时就是`undefined`。该函数的定义在`src/core/instance/lifecycle.js`中。

```js
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    const prevEl = vm.$el
    const prevVnode = vm._vnode
    const restoreActiveInstance = setActiveInstance(vm)
    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    restoreActiveInstance()
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  }
```

_update函数仅有30行代码，核心就是执行__patch__函数。**触发__patch__函数有两个时机，一是初次渲染的时候，二是当数据更新通知`renderWatcher更新时`。**这两者的不同点就是是否存在`preVnode`。值得一提的是`__patch__`函数在不同的运行环境，也是不同的。

* web端 （定义在src/platforms/web/runtime/index.js）
* weex端 （定义在src/platforms/weex/runtime/index.js）

`patch`函数是通过`createPatchFunction`函数返回的，`createPatchFunction`函数总共有700多行代码，是我目前为止看到过的最长的函数了🐶。

```js
// src/platforms/web/runtime/patch.js

export const patch: Function = createPatchFunction({ nodeOps, modules })
```

nodeOps参数是一些函数，关于操作dom的。而modules则是一些模块的钩子函数的实现。
`createPatchFunction`函数定义在`src/core/vdom/patch.js`，函数内部声明了了很多方法，而这些函数的实现则是来自函数的参数中的一些DOM操作方法。这样区别化是因为在不同平台patch的思想是高度相似的，但是平台间的操作方法则不同。

在回到patch函数本身，它有四个入参分别是：
1. oldVnode, 先前的vnode或是真实的DOM节点（第一次渲染时）
2. vnode, render函数生成的vnode
2. hydrating, SSR相关的参数
3. removeOnly, 提供给`transition-group`组件

```js
// patch函数片段
      const isRealElement = isDef(oldVnode.nodeType)
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, null, null, removeOnly)
      } else {
        if (isRealElement) {
          // mounting to a real element
          // check if this is server-rendered content and if we can perform
          // a successful hydration.
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR)
            hydrating = true
          }
          if (isTrue(hydrating)) {
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true)
              return oldVnode
            } else if (process.env.NODE_ENV !== 'production') {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              )
            }
          }
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          oldVnode = emptyNodeAt(oldVnode)
        }

        // replacing existing element
        const oldElm = oldVnode.elm
        const parentElm = nodeOps.parentNode(oldElm)

        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)
        )
```

在初次渲染时，会走入到这个分支。在判断不是服务器渲染后，就将原先的真实DOM（参数名叫vnode）替换成一个空vnode。
然后神奇的事来了，我们都知道绑定的某个元素例如`<div id="#app"></div>`最后会被整个组件元素所取代。在这里就能说明了，获取了旧元素和其祖先元素后，下一步就是将旧元素移除，把新元素加入到父元素中。

接下来的createElm()就尤其重要了。在此次调用中，传入了4个参数。

* vnode
* insertedVnodeQueue: 空数组
* 祖先元素
* 邻居节点

```js
    function createElm (
      vnode,
      insertedVnodeQueue,
      parentElm,
      refElm,
      nested,
      ownerArray,
      index
    ) {
      if (isDef(vnode.elm) && isDef(ownerArray)) {
        // This vnode was used in a previous render!
        // now it's used as a new node, overwriting its elm would cause
        // potential patch errors down the road when it's used as an insertion
        // reference node. Instead, we clone the node on-demand before creating
        // associated DOM element for it.
        vnode = ownerArray[index] = cloneVNode(vnode);
      }

      vnode.isRootInsert = !nested; // for transition enter check
      if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
        return
      }

      var data = vnode.data;
      var children = vnode.children;
      var tag = vnode.tag;
      if (isDef(tag)) {
        {
          if (data && data.pre) {
            creatingElmInVPre++;
          }
          if (isUnknownElement$$1(vnode, creatingElmInVPre)) {
            warn(
              'Unknown custom element: <' + tag + '> - did you ' +
              'register the component correctly? For recursive components, ' +
              'make sure to provide the "name" option.',
              vnode.context
            );
          }
        }

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

        if (data && data.pre) {
          creatingElmInVPre--;
        }
      } else if (isTrue(vnode.isComment)) {
        vnode.elm = nodeOps.createComment(vnode.text);
        insert(parentElm, vnode.elm, refElm);
      } else {
        vnode.elm = nodeOps.createTextNode(vnode.text);
        insert(parentElm, vnode.elm, refElm);
      }
    }
```
在这里我们先忽略createComponent这个方法。

1. 首先创建了该节点的元素，并附加到vnode上。
  通过`createElement`或`createElementNS`这两个方法。
2. `createChildren()`
  整个VNode模型就是多叉树，所以函数内部就是深度遍历创建子树。中间再次调用了createElem这个函数。
  然后comment节点和textNode节点比较特殊，是在两个else语句中。
3. `insert(parentElm, vnode.elm, refElm)`
  这三个参数分别是父节点，vnode创建的真实dom，以及邻居节点。这一步将真实的dom节点渲染到dom上了。

返回到`__patch`函数中, 创建完关于vnode相关的节点并插入到对应的位置后，就得将原先的节点移除。
```js
  // patch函数片段
    // destroy old node
    if (isDef(parentElm)) {
      removeVnodes([oldVnode], 0, 0);
    } else if (isDef(oldVnode.tag)) {
      invokeDestroyHook(oldVnode);
    }

  function removeVnodes (vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      const ch = vnodes[startIdx]
      if (isDef(ch)) {
        if (isDef(ch.tag)) {
          removeAndInvokeRemoveHook(ch)
          invokeDestroyHook(ch)
        } else { // Text node
          removeNode(ch.elm)
        }
      }
    }
  }

  function removeAndInvokeRemoveHook (vnode, rm) {
    if (isDef(rm) || isDef(vnode.data)) {
      let i
      const listeners = cbs.remove.length + 1
      if (isDef(rm)) {
        // we have a recursively passed down rm callback
        // increase the listeners count
        rm.listeners += listeners
      } else {
        // directly removing
        rm = createRmCb(vnode.elm, listeners)
      }
      // recursively invoke hooks on child component root node
      if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
        removeAndInvokeRemoveHook(i, rm)
      }
      for (i = 0; i < cbs.remove.length; ++i) {
        cbs.remove[i](vnode, rm)
      }
      if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        i(vnode, rm)
      } else {
        rm()
      }
    } else {
      removeNode(vnode.elm)
    }
  }
```
在本次这个案例中，rm参数不存在，所以直接走到了else分支中，移除了oldVNode对应的DOM元素。最后在执行每个元素的destroy的hook数组，如果vnode存在子节点则递归处理。
最后返回vnode对应的DOM节点，patch函数就基本执行完毕了。