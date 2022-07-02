# 特殊类型
void类型
void有两种场景
1. compilerOptions中的strictNullChecks为true，则void可以说是undefined
2. strictNullChecks: false, 则void 可以说是 undefined | null

实际上这个类型最大的意义是在[函数返回值上](https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABAZwKZQCowLariKACggEMAbMgIxIgGsAuRQgSkQF4A+RANzhgBMANIli4A-IzAhslVACdWAbwBQiRKQrU6LZQF9lBtJhx4ChFuy4ByXgKvNlQA)


## any
any类型和任何类型取&都会得到any。[type challenge: IsAny]()

```ts
type foo = keyof any  // foo = string | number | symbol
在条件类型中，any也比较特别。
type TestAny<T> = T extends number ? 1 : 2;
type bar = TestAny<any> // bar = 1 | 2
```

## never
如果条件类型左边是类型参数，并且传入的是 never，那么直接返回 never
这个类型通常会在分布式类型falseType或trueType中出现，在union类型中会自动过滤。

```ts
type TestNever<T> = T extends number ? 1 : 2;
type foo = TestNever<never> // foo = never
type foo2 = never extends number ? 1 : 2; // foo = 1
type foo3 = never extends never ? 1 : 2; // foo = 1
```

## Turple类型
tuple实际上也是数组类型，但它的长度是一个数值常量。

```ts
type foo = [1, 2]
type IsTurple<T> = T extends any[] ? number extends T['length'] ? false : true : false
```

## Boolean
boolean实际上就是true | false

<img :src="$withBase('/TypeScript/boolean.png')" alt="boolean = true | false">


逆变与协变
父类型的变量被赋值子类型，称之为协变。
子类型的变量被赋值为父类型，则称之为逆变（多见于函数）

```ts
declare let Foo: {
  name: string
}

declare let Foo2: {
  name: string
  age: number
}

Foo = Foo2  // 协变
Foo2 = Foo  // missing property “age”

declare let Bar: (arg: {
  label: string
}) => void

declare let Bar2: (arg: {
  label: string
  value: number
}) => void

Bar = Bar2  // missing property “value”
Bar2 = Bar  // 逆变
```


其中union转intersection就是通过这个原理playground

加减乘除
实际上类型运算中并没有语言中的操作符，那在ts中实现基本思想就是[递归加数组的长度`array1['length']`](https://www.typescriptlang.org/play?#code/C4TwDgpgBAQgrgSwDYBMCCAnDBDEAeAFSggA9gIA7FAZygrgFsAjCDAGigCVizKao4FANYUA9gHcKAbQC6UALxRZAPgVcpAciSUA5sAAWGuaXJVaRAPxcoALliJUmHPgIcpAOk+cOgkRIoyygBQQaCQUGgoKIQ8pvz0zKwcAKqxfLQJLBiqih6e8MjoWLiEyhye7gWOxfjJyjKa2hR6hjIhYdAAsgj01DEm6XSMWSlpZkOJ2WpVRc6lY-x5lQ6zJXXlnj0AZqxcclacjboGRrZ0EABurCGh4NBboqIKkdEAjGwATMG34Q+iH2pur08AAODivYJAA)

索引操作
索引通常会使用keyof关键词来操作对象中的key。
但在使用过程中可能会有一种情况。递归计算type类型没有展开整个对象。所以我们需要一个多余的[判断](https://www.typescriptlang.org/play?#code/C4TwDgpgBAZg9nKBeKBvAUFKBDAXGzLKAI3wyKIGN8BnYAJwEsA7Ac0KwF9DOAadbulCQoAEQgQwAJQjYAJnGYAbEFAA8AFQB8yAlnqyFy1QG0A1hFUsoFkHBhQNUAGRQ6TNgF18G85c9QEAAewBDMcjRQMpRw9HJq7iysvDjMIDoA-GIS0oaKKpp+IJ46PkWeAuhC4NDikjLy+SAATGoA8sQAVjpIHFAdnYEhYRGpqlnkFFP6ecZQJgDSllDWtvb9XS5uDEnefdPTA4v+Q6HhkXBdEJTA+wf3WXW5jcatR0vFWnf30-jv-t8oNwKPhmBAAG4QehVYTQeBwACMuieDSMBXhX1hsAQzWROVRTVaGKAA)

# utility高级type

## InstanceType
这个比较简单，通常就是用来获取构造器对应的类

```ts
class A {}


type Foo = InstanceType<typeof A> // 等价于 A
```

## UpperCase、LowerCase等
我们可以看到这些个类型在ts dts声明中有一个intrinsic关键字。
其实这个很简单，依赖编译器缓存的原字符串，在遇到Uppercase等高阶类型后，将字符串大写或小写化即可。

## ThisType
这个类型的源码非常简单
<img :src="$withBase('/TypeScript/ThisType.png')" alt="ThisType">


this在vue的使用非常广泛。vue-class-component由于使用了class组件的写法，ts天然支持比较好。那原本最初始的vue2实际上支持的不好，但我们来看看这个demo
<img :src="$withBase('/TypeScript/defineComponent.png')" alt="defineComponent">

源码地址：composition-api/component/componentOptions

# 源码初窥
https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API

文件地址：src/compiler/checker.ts

函数名：getTypeFromTypeAliasReference

```TS
const ts = require("./built/local/typescript");

// const filename = "./input.ts";
const filename = "./demos/use-uppercase.ts";
const program = ts.createProgram([filename], {
    allowJs: false
});
const sourceFile = program.getSourceFile(filename);
const typeChecker = program.getTypeChecker();

function visitNode(node) {
    if (node.kind === ts.SyntaxKind.TypeReference)  {
        const type = typeChecker.getTypeFromTypeNode(node);
    }

    node.forEachChild(child =>
        visitNode(child)
    );
}

visitNode(sourceFile);
```

1. never类型在union中的过滤

<img :src="$withBase('/TypeScript/never-in-union.png')" alt="never-in-union">


2. 分布式条件类型的运算

<img :src="$withBase('/TypeScript/distributive.png')" alt="distributive">

<img :src="$withBase('/TypeScript/distributive-2.png')" alt="distributive2">


## 文章分享
[赋予Vuex 4.x 更好的 TypeScript体验](https://juejin.cn/post/6999886459343732772)