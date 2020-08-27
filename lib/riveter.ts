/**
 * node-riveter - Mix-in, inheritance and constructor extend behavior for your JavaScript enjoyment.
 * © 2012 - Copyright appendTo, LLC
 * © 2019 - Copyright Zach Lintz, LLC
 * Author(s): Jim Cowart, Nicholas Cloud, Doug Neiner, Zach Lintz
 * Version: v0.2.1
 * Url: https://github.com/Foo-Foo-MQ/node-riveter
 * License(s): MIT, GPL
 */
import * as _ from 'lodash'
import { deepExtend } from './utils'

const slice = Array.prototype.slice

class Riveter {
  constructor(...args: any[]) {
    args.forEach(Riveter.rivet); // target es5 required for constructor to be allowed to be called without the "new" keyword
  }

  public static rivet(fn: any) {
    if (!Object.prototype.hasOwnProperty.call(fn, 'extend')) {
      fn.extend = function (props: any, ctorProps: any, options: any) {
        return Riveter.extend(fn, props, ctorProps, options)
      }
    }
    if (!Object.prototype.hasOwnProperty.call(fn, 'compose')) {
      fn.compose = function () {
        return Riveter.compose.apply(
            this,
            [fn].concat(slice.call(arguments, 0)) as any
        )
      }
    }
    if (!Object.prototype.hasOwnProperty.call(fn, 'inherits')) {
      fn.inherits = function (parent: any, ctorProps: any, options: any) {
        return Riveter.inherits(this, parent, ctorProps, options)
      }
    }
    if (!Object.prototype.hasOwnProperty.call(fn, 'mixin')) {
      fn.mixin = function () {
        return Riveter.mixin.apply(this, [fn].concat(slice.call(arguments, 0)) as any)
      }
    }
    if (!Object.prototype.hasOwnProperty.call(fn, 'punch')) {
      fn.punch = function () {
        return Riveter.punch.apply(this, [fn].concat(slice.call(arguments, 0)) as any)
      }
    }
  }

  public static inherits(child: any, parent: any, ctorProps: any, options: any) {
    options = options || {}
    let childProto
    const TmpCtor = function () { }
    let Child = function (this: any) {
      (parent as any).apply(this, arguments);
    }
    if (typeof child === 'object') {
      if (Object.prototype.hasOwnProperty.call(child, 'constructor')) {
        Child = child.constructor
      }
      childProto = child
    } else {
      Child = child
      childProto = child.prototype
    }
    Riveter.rivet(Child)
    if (options.deep) {
      deepExtend(Child, parent, ctorProps)
    } else {
      _.defaults(Child, parent, ctorProps)
    }
    TmpCtor.prototype = parent.prototype
    Child.prototype = new (TmpCtor as any)()
    if (options.deep) {
      deepExtend(Child.prototype, childProto, {
        constructor: Child
      })
    } else {
      _.extend(Child.prototype, childProto, {
        constructor: Child
      })
    }
    (Child as any).__super = parent;
    // Next line is all about Backbone compatibility
    (Child as any).__super__ = parent.prototype
    return Child
  }

  public static extend(ctor: any, props: any, ctorProps: any, options: any) {
    return Riveter.inherits(props, ctor, ctorProps, options)
  }

  public static compose() {
    const args = slice.call(arguments, 0)
    const ctor = args.shift()
    Riveter.rivet(ctor)
    const mixin = _.reduce(
        args,
        function (memo, val) {
          if (Object.prototype.hasOwnProperty.call(val, '_preInit')) {
            memo.preInit.push(val._preInit as never)
          }
          if (Object.prototype.hasOwnProperty.call(val, '_postInit')) {
            memo.postInit.push(val._postInit as never)
          }
          val = val.mixin || val
          memo.items.push(val as never)
          return memo
        },
        {
          items: [],
          preInit: [],
          postInit: []
        }
    )
    const res = ctor.extend({
      constructor: function () {
        const self = this
        const args = slice.call(arguments, 0)
        _.each(mixin.preInit, function (initializer: any) {
          initializer.apply(self, args)
        })
        ctor.prototype.constructor.apply(this, args)
        _.each(mixin.postInit, function (initializer: any) {
          initializer.apply(self, args)
        })
      }
    })
    Riveter.rivet(res)
    _.defaults(res.prototype, _.extend.apply(null, ([{}] as any).concat(mixin.items)))
    return res
  }

  public static mixin() {
    const args = slice.call(arguments, 0)
    const ctor = args.shift()
    Riveter.rivet(ctor)
    _.defaults(ctor.prototype, _.extend.apply(null, ([{}] as any).concat(args)))
    return ctor
  }

  public static punch() {
    const args = slice.call(arguments, 0)
    const ctor = args.shift()
    Riveter.rivet(ctor)
    _.extend(ctor.prototype, _.extend.apply(null, ([{}] as any).concat(args)))
    return ctor
  }
}

export = Riveter;
