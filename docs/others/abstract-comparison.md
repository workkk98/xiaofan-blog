# EcmaScript - 相等操作符

[规范链接](https://262.ecma-international.org/5.1/#sec-11.9.1)

### 相等操作符

相等表达式的结果： `EqualityExpression == RelationalExpression` 最终计算成以下结果。

1. 将`EqualityExpression`表达式的结果赋值给`lref`
2. 将`GetValue(lref)`赋值给`lref`(`GetValue`的算法可以具体再查阅规范)
3. 将`RelationalExpression`表达式的结果赋值给`rref`
4. 将`GetValue(rref)`赋值给`rref`
5. 返回执行"抽象相等"算法的结果即`rval `==` lval`

值得一提的是，不知道为什么规范里`rval`和`lval`相对于对应表达式，互相换了个位置。

### 抽象相等比较算法

接上小节第五个步骤，也就是核心。

比较`x == y`, 其中`x`和`y`是值，则返回`true`或`false`。比较过程具体如下。

1. x和y类型相等（插一句这里的类型就是6种, null, undefined, string, number, boolean, object，不要和typeof关键字得到几种类型搞混)

   a. 如果`Type(x)`是`Undefined`, 返回`true`

   b. 如果`Type(x)`是`Null`, 返回`true`

   c. 如果`Type(x)`是`Number`, 

   ​	i. 如果`x`是`NaN`, 返回`false`

   ​    ii. 如果`y`是`NaN`, 返回`false`

      iii. 如果`x`是和`y`相同的值，则返回`true`

      iv. 如果`x`是`+0`且`y`是`-0`, 则返回`true`

      v. 如果`x`是`-0`且`y`是`+0`, 则返回`true`

      vi. 返回`false`

2. 如果`x`是`null`且`y`是`undefined`, 返回`true`

3. 如果`x`是`undefined`且`y`是`null`, 返回`true`

4. 如果`Type(x)`是`Number`且`Type(y)`是`String`，则返回比较`x == ToNumber(y)`的结果

5. 如果`Type(x)`是`String`且`Type(y)`是`Number`，则返回比较`ToNumber(x) == y`的结果
6. 如果`Type(x)`是`Boolean`, 则返回比较`ToNumber(x) == y`的结果
7. 如果`Type(y)`是`Boolean`, 则返回比较`x == ToNumber(y)`的结果
8. 如果`Type(x)`是`String`或是`Number`且`Type(y)`是对象，返回比较`x == ToPrimitive(y)`的结果
9. 如果`Type(x)`是`Object`且`Type(y)`是`String`或`Number`，返回比较`ToPrimitive(x) == y`的结果
10. 返回`false`



### 总结

从上面的算法来看，我们不难发现整个过程就是在转换+递归。

如果是类型相同，我们可以直接按照具体值进行比较。

但如果类型不同，则依照顺序依次转换每个值，再最终进行比较。

最后吐槽下，面试题考这个真的是八股文。谁会去记忆这种东西呢？



我又对照了红宝书第三版的相等操作符的算法。红宝书对规范总结的很好啊，所以这本书被广泛推崇不是没有原因的。

