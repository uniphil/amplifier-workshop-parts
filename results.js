!function() {
  /**
 * Rust-inspired Result<T, E> and Option<T> (called Maybe) wrappers for Javascript.
 *
 * @author mystor
 * @author uniphil
 */
  /**
 * @throws Error when the match is not exhaustive
 * @throws Error when there are weird keys
 * @throws Error when `option` is the wrong type for this match
 * @param {EnumOption} option The instance to match against
 * @param {Object} paths The optionName: callback mapping
 * @returns {any} The result of calling the matching callback
 */
  function h(e, r) {
    if (!(e instanceof this.OptionClass)) {
      throw "production" !== process.env.NODE_ENV && process && console.error(`Not a member from { ${Object.keys(r).join(", ")} }:`, e), 
      new Error(`match called on a non-member option: '${String(e)}'. ` + `Expected a member from Union{ ${Object.keys(r).join(", ")} }`);
    }
    for (var n of Object.keys(r)) {
      if (!e.options.hasOwnProperty(n) && "_" !== n) {
        throw new Error(`unrecognized match option: '${n}'`);
      }
    }
    if ("function" == typeof r._) {
      // match is de-facto exhaustive w/ `_`
      return "function" == typeof r[e.name] ? r[e.name](e.payload) : r._(e.payload);
    }
    // ensure match is exhaustive
    for (var o in e.options) {
      if ("function" != typeof r[o]) {
        throw void 0 === r[o] ? new Error(`Non-exhaustive match is missing '${o}'`) : new Error(`match expected a function for '${o}', but found a '${typeof r[o]}'`);
      }
    }
    return r[e.name](e.payload);
  }
  // Useful in general, but specifically motivated by and inspired by immutablejs
  // https://github.com/facebook/immutable-js/blob/master/src/is.js
  function n(e, r) {
    if (e === r || e != e && r != r) {
      // true for NaNs
      return !0;
    }
    if (!e || !r) {
      return !1;
    }
    // There is probably a cleaner way to do this check
    // Blame TDD :)
    if (e && "function" == typeof e.constructor && e.constructor.unionFactory === c) {
      return !(!r || "function" != typeof r.constructor || r.constructor.unionFactory !== c) && (e.constructor === r.constructor && (e.name === r.name && n(e.payload, r.payload)));
    }
    // I hate this block. Blame immutablejs :)
    if ("function" == typeof e.valueOf && "function" == typeof r.valueOf) {
      if ((e = e.valueOf()) === (r = r.valueOf()) || e != e && r != r) {
        return !0;
      }
      if (!e || !r) {
        return !1;
      }
    }
    return "function" == typeof e.equals && "function" == typeof r.equals && e.equals(r);
  }
  function u(e) {
    return n(this, e);
  }
  function m() {
    return 42; // TODO: this is valid, but inefficient. Actually implement this :)
  }
  function p() {
    return `[${this.name}(${this.payload}) ` + `from Union{ ${Object.keys(this.options).join(", ")} }]`;
  }
  function c(e, r = {}, n = {}, o = function(r, n, o) {
    return function(e) {
      return new o(r, n, e);
    };
  }) {
    if ("object" != typeof e) {
      throw new Error("Param `options` must be an object with keys for each member of the union");
    }
    if (e.hasOwnProperty("toString")) {
      throw new Error("Cannot use reserved name `toString` as part of a Union");
    }
    if (e.hasOwnProperty("match")) {
      throw new Error("Cannot use reserved name `match` as part of a Union");
    }
    if (e.hasOwnProperty("options")) {
      throw new UnionError("Cannot use reserved name `options` as part of a Union");
    }
    if (e.hasOwnProperty("OptionClass")) {
      throw new Error("Cannot use reserved name `UnionClass` as part of a Union");
    }
    for (var t of Object.keys(n)) {
      if (e.hasOwnProperty(t)) {
        throw new Error(`Cannot add static method '${t}' to Union which ` + `has the same name as a member (members: ${e.join(", ")}).`);
      }
    }
    function a(e, r, n) {
      this.options = e, this.name = r, this.payload = n;
    }
    a.prototype.toString = p, a.prototype.equals = u, a.prototype.hashCode = m, 
    Object.keys(r).forEach(e => a.prototype[e] = r[e]), 
    // put a ref on the union option class back to Union so we can trace things
    // back to see if they are from Union
    a.unionFactory = c;
    const i = {
      options: e,
      OptionClass: a,
      toString: () => `[Union { ${Object.keys(e).join(", ")} }]`,
      match: h,
      ...n
    };
    for (var s of Object.keys(e)) {
      i[s] = o(e, s, a);
    }
    return i;
  }
  // deep-check equality between two union option instances, compatible with immutablejs
  c.is = n;
  const o = c({
    Some: null,
    None: null
  }, {
    isSome() {
      return "Some" === this.name;
    },
    isNone() {
      return "None" === this.name;
    },
    /**
   * @throws Error(msg)
   */
    expect(e) {
      if ("Some" === this.name) {
        return this.payload;
      }
      throw new Error(e);
    },
    /**
   * @throws Error if it is None
   */
    unwrap() {
      if ("Some" === this.name) {
        return this.payload;
      }
      throw new Error("Tried to .unwrap() Maybe.None as Some");
    },
    unwrapOr(e) {
      return "Some" === this.name ? this.payload : e;
    },
    unwrapOrElse(e) {
      return "Some" === this.name ? this.payload : e();
    },
    okOr(e) {
      return "Some" === this.name ? t.Ok(this.payload) : t.Err(e);
    },
    okOrElse(e) {
      return "Some" === this.name ? t.Ok(this.payload) : t.Err(e());
    },
    promiseOr(e) {
      return "Some" === this.name ? Promise.resolve(this.payload) : Promise.reject(e);
    },
    promiseOrElse(e) {
      return "Some" === this.name ? Promise.resolve(this.payload) : Promise.reject(e());
    },
    and(e) {
      return "Some" === this.name ? o.Some(e) : this;
    },
    andThen(e) {
      return "Some" === this.name ? o.Some(e(this.payload)) : this;
    },
    or(e) {
      return "Some" === this.name ? this : o.Some(e);
    },
    orElse(e) {
      return "Some" === this.name ? this : o.Some(e());
    },
    filter(r) {
      return this.andThen(e => r(e) ? this : o.None());
    }
  }, {
    all: e => e.reduce((e, n) => e.andThen(r => o.Some(n).andThen(e => r.concat([ e ]))), o.Some([])),
    undefined: e => void 0 === e ? o.None() : o.Some(e),
    null: e => null === e ? o.None() : o.Some(e),
    nan: e => e != e ? o.None() : o.Some(e)
  }, (r, e, n) => "Some" === e ? e => e instanceof n ? e : new n(r, "Some", e) : () => new n(r, "None")), t = c({
    Ok: null,
    Err: null
  }, {
    isOk() {
      return "Ok" === this.name;
    },
    isErr() {
      return "Err" === this.name;
    },
    ok() {
      return "Ok" === this.name ? o.Some(this.payload) : o.None();
    },
    err() {
      return "Ok" === this.name ? o.None() : o.Some(this.payload);
    },
    promise() {
      return "Ok" === this.name ? Promise.resolve(this.payload) : Promise.reject(this.payload);
    },
    promiseErr() {
      return "Ok" === this.name ? Promise.reject(this.payload) : Promise.resolve(this.payload);
    },
    and(e) {
      return "Ok" === this.name ? t.Ok(e) : this;
    },
    andThen(e) {
      return "Ok" === this.name ? t.Ok(e(this.payload)) : this;
    },
    or(e) {
      return "Ok" === this.name ? this : t.Ok(e);
    },
    orElse(e) {
      return "Ok" === this.name ? this : t.Ok(e(this.payload));
    },
    unwrapOr(e) {
      return "Ok" === this.name ? this.payload : e;
    },
    unwrapOrElse(e) {
      return "Ok" === this.name ? this.payload : e(this.payload);
    },
    /**
   * @throws Error(err)
   */
    expect(e) {
      if ("Ok" === this.name) {
        return this.payload;
      }
      throw new Error(e);
    },
    /**
   * @throws the value from Err(value)
   */
    unwrap() {
      if ("Ok" === this.name) {
        return this.payload;
      }
      throw this.payload;
    },
    /**
   * @throws the value from Ok(value)
   */
    unwrapErr() {
      if ("Ok" !== this.name) {
        return this.payload;
      }
      {
        let e = "";
        throw this.payload && "function" == typeof this.payload.toString && (e = ": " + this.payload.toString()), 
        new Error("Tried to .unwrap() Result.Ok as Err" + e);
      }
    }
  }, {
    all: e => e.reduce((e, n) => e.andThen(r => t.Ok(n).andThen(e => r.concat([ e ]))), t.Ok([])),
    try(e) {
      try {
        return t.Ok(e());
      } catch (e) {
        return t.Err(e);
      }
    }
  }, (r, e, n) => "Ok" === e ? e => e instanceof n ? e : new n(r, "Ok", e) : e => new n(r, "Err", e));
  window.results = {
    Union: c,
    Maybe: o,
    Some: o.Some,
    None: o.None,
    Result: t,
    Ok: t.Ok,
    Err: t.Err
  };
}("undefined" == typeof results && (results = {}));
