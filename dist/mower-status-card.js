/*! mower-status-card 1.2.0 | MIT License */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i5 = decorators.length - 1, decorator; i5 >= 0; i5--)
    if (decorator = decorators[i5])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = /* @__PURE__ */ Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t4, e5, o6) {
    if (this._$cssResult$ = true, o6 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t4, this.t = e5;
  }
  get styleSheet() {
    let t4 = this.o;
    const s4 = this.t;
    if (e && void 0 === t4) {
      const e5 = void 0 !== s4 && 1 === s4.length;
      e5 && (t4 = o.get(s4)), void 0 === t4 && ((this.o = t4 = new CSSStyleSheet()).replaceSync(this.cssText), e5 && o.set(s4, t4));
    }
    return t4;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t4) => new n("string" == typeof t4 ? t4 : t4 + "", void 0, s);
var i = (t4, ...e5) => {
  const o6 = 1 === t4.length ? t4[0] : e5.reduce((e6, s4, o7) => e6 + ((t5) => {
    if (true === t5._$cssResult$) return t5.cssText;
    if ("number" == typeof t5) return t5;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t5 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s4) + t4[o7 + 1], t4[0]);
  return new n(o6, t4, s);
};
var S = (s4, o6) => {
  if (e) s4.adoptedStyleSheets = o6.map((t4) => t4 instanceof CSSStyleSheet ? t4 : t4.styleSheet);
  else for (const e5 of o6) {
    const o7 = document.createElement("style"), n5 = t.litNonce;
    void 0 !== n5 && o7.setAttribute("nonce", n5), o7.textContent = e5.cssText, s4.appendChild(o7);
  }
};
var c = e ? (t4) => t4 : (t4) => t4 instanceof CSSStyleSheet ? ((t5) => {
  let e5 = "";
  for (const s4 of t5.cssRules) e5 += s4.cssText;
  return r(e5);
})(t4) : t4;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t4, s4) => t4;
var u = { toAttribute(t4, s4) {
  switch (s4) {
    case Boolean:
      t4 = t4 ? l : null;
      break;
    case Object:
    case Array:
      t4 = null == t4 ? t4 : JSON.stringify(t4);
  }
  return t4;
}, fromAttribute(t4, s4) {
  let i5 = t4;
  switch (s4) {
    case Boolean:
      i5 = null !== t4;
      break;
    case Number:
      i5 = null === t4 ? null : Number(t4);
      break;
    case Object:
    case Array:
      try {
        i5 = JSON.parse(t4);
      } catch (t5) {
        i5 = null;
      }
  }
  return i5;
} };
var f = (t4, s4) => !i2(t4, s4);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ?? (Symbol.metadata = /* @__PURE__ */ Symbol("metadata")), a.litPropertyMetadata ?? (a.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
var y = class extends HTMLElement {
  static addInitializer(t4) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t4);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t4, s4 = b) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t4) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t4, s4), !s4.noAccessor) {
      const i5 = /* @__PURE__ */ Symbol(), h3 = this.getPropertyDescriptor(t4, i5, s4);
      void 0 !== h3 && e2(this.prototype, t4, h3);
    }
  }
  static getPropertyDescriptor(t4, s4, i5) {
    const { get: e5, set: r6 } = h(this.prototype, t4) ?? { get() {
      return this[s4];
    }, set(t5) {
      this[s4] = t5;
    } };
    return { get: e5, set(s5) {
      const h3 = e5?.call(this);
      r6?.call(this, s5), this.requestUpdate(t4, h3, i5);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t4) {
    return this.elementProperties.get(t4) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t4 = n2(this);
    t4.finalize(), void 0 !== t4.l && (this.l = [...t4.l]), this.elementProperties = new Map(t4.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t5 = this.properties, s4 = [...r2(t5), ...o2(t5)];
      for (const i5 of s4) this.createProperty(i5, t5[i5]);
    }
    const t4 = this[Symbol.metadata];
    if (null !== t4) {
      const s4 = litPropertyMetadata.get(t4);
      if (void 0 !== s4) for (const [t5, i5] of s4) this.elementProperties.set(t5, i5);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t5, s4] of this.elementProperties) {
      const i5 = this._$Eu(t5, s4);
      void 0 !== i5 && this._$Eh.set(i5, t5);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s4) {
    const i5 = [];
    if (Array.isArray(s4)) {
      const e5 = new Set(s4.flat(1 / 0).reverse());
      for (const s5 of e5) i5.unshift(c(s5));
    } else void 0 !== s4 && i5.push(c(s4));
    return i5;
  }
  static _$Eu(t4, s4) {
    const i5 = s4.attribute;
    return false === i5 ? void 0 : "string" == typeof i5 ? i5 : "string" == typeof t4 ? t4.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t4) => this.enableUpdating = t4), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t4) => t4(this));
  }
  addController(t4) {
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t4), void 0 !== this.renderRoot && this.isConnected && t4.hostConnected?.();
  }
  removeController(t4) {
    this._$EO?.delete(t4);
  }
  _$E_() {
    const t4 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i5 of s4.keys()) this.hasOwnProperty(i5) && (t4.set(i5, this[i5]), delete this[i5]);
    t4.size > 0 && (this._$Ep = t4);
  }
  createRenderRoot() {
    const t4 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t4, this.constructor.elementStyles), t4;
  }
  connectedCallback() {
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), this._$EO?.forEach((t4) => t4.hostConnected?.());
  }
  enableUpdating(t4) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t4) => t4.hostDisconnected?.());
  }
  attributeChangedCallback(t4, s4, i5) {
    this._$AK(t4, i5);
  }
  _$ET(t4, s4) {
    const i5 = this.constructor.elementProperties.get(t4), e5 = this.constructor._$Eu(t4, i5);
    if (void 0 !== e5 && true === i5.reflect) {
      const h3 = (void 0 !== i5.converter?.toAttribute ? i5.converter : u).toAttribute(s4, i5.type);
      this._$Em = t4, null == h3 ? this.removeAttribute(e5) : this.setAttribute(e5, h3), this._$Em = null;
    }
  }
  _$AK(t4, s4) {
    const i5 = this.constructor, e5 = i5._$Eh.get(t4);
    if (void 0 !== e5 && this._$Em !== e5) {
      const t5 = i5.getPropertyOptions(e5), h3 = "function" == typeof t5.converter ? { fromAttribute: t5.converter } : void 0 !== t5.converter?.fromAttribute ? t5.converter : u;
      this._$Em = e5;
      const r6 = h3.fromAttribute(s4, t5.type);
      this[e5] = r6 ?? this._$Ej?.get(e5) ?? r6, this._$Em = null;
    }
  }
  requestUpdate(t4, s4, i5, e5 = false, h3) {
    if (void 0 !== t4) {
      const r6 = this.constructor;
      if (false === e5 && (h3 = this[t4]), i5 ?? (i5 = r6.getPropertyOptions(t4)), !((i5.hasChanged ?? f)(h3, s4) || i5.useDefault && i5.reflect && h3 === this._$Ej?.get(t4) && !this.hasAttribute(r6._$Eu(t4, i5)))) return;
      this.C(t4, s4, i5);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t4, s4, { useDefault: i5, reflect: e5, wrapped: h3 }, r6) {
    i5 && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t4) && (this._$Ej.set(t4, r6 ?? s4 ?? this[t4]), true !== h3 || void 0 !== r6) || (this._$AL.has(t4) || (this.hasUpdated || i5 || (s4 = void 0), this._$AL.set(t4, s4)), true === e5 && this._$Em !== t4 && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t4));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t5) {
      Promise.reject(t5);
    }
    const t4 = this.scheduleUpdate();
    return null != t4 && await t4, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [t6, s5] of this._$Ep) this[t6] = s5;
        this._$Ep = void 0;
      }
      const t5 = this.constructor.elementProperties;
      if (t5.size > 0) for (const [s5, i5] of t5) {
        const { wrapped: t6 } = i5, e5 = this[s5];
        true !== t6 || this._$AL.has(s5) || void 0 === e5 || this.C(s5, void 0, i5, e5);
      }
    }
    let t4 = false;
    const s4 = this._$AL;
    try {
      t4 = this.shouldUpdate(s4), t4 ? (this.willUpdate(s4), this._$EO?.forEach((t5) => t5.hostUpdate?.()), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t4 = false, this._$EM(), s5;
    }
    t4 && this._$AE(s4);
  }
  willUpdate(t4) {
  }
  _$AE(t4) {
    this._$EO?.forEach((t5) => t5.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t4)), this.updated(t4);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t4) {
    return true;
  }
  update(t4) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t5) => this._$ET(t5, this[t5]))), this._$EM();
  }
  updated(t4) {
  }
  firstUpdated(t4) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ?? (a.reactiveElementVersions = [])).push("2.1.2");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = (t4) => t4;
var s2 = t2.trustedTypes;
var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t4) => t4 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t4) => null === t4 || "object" != typeof t4 && "function" != typeof t4;
var u2 = Array.isArray;
var d2 = (t4) => u2(t4) || "function" == typeof t4?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t4) => (i5, ...s4) => ({ _$litType$: t4, strings: i5, values: s4 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = /* @__PURE__ */ Symbol.for("lit-noChange");
var A = /* @__PURE__ */ Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t4, i5) {
  if (!u2(t4) || !t4.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i5) : i5;
}
var N = (t4, i5) => {
  const s4 = t4.length - 1, e5 = [];
  let n5, l3 = 2 === i5 ? "<svg>" : 3 === i5 ? "<math>" : "", c4 = v;
  for (let i6 = 0; i6 < s4; i6++) {
    const s5 = t4[i6];
    let a3, u3, d3 = -1, f3 = 0;
    for (; f3 < s5.length && (c4.lastIndex = f3, u3 = c4.exec(s5), null !== u3); ) f3 = c4.lastIndex, c4 === v ? "!--" === u3[1] ? c4 = _ : void 0 !== u3[1] ? c4 = m : void 0 !== u3[2] ? (y2.test(u3[2]) && (n5 = RegExp("</" + u3[2], "g")), c4 = p2) : void 0 !== u3[3] && (c4 = p2) : c4 === p2 ? ">" === u3[0] ? (c4 = n5 ?? v, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? p2 : '"' === u3[3] ? $ : g) : c4 === $ || c4 === g ? c4 = p2 : c4 === _ || c4 === m ? c4 = v : (c4 = p2, n5 = void 0);
    const x2 = c4 === p2 && t4[i6 + 1].startsWith("/>") ? " " : "";
    l3 += c4 === v ? s5 + r3 : d3 >= 0 ? (e5.push(a3), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i6 : x2);
  }
  return [V(t4, l3 + (t4[s4] || "<?>") + (2 === i5 ? "</svg>" : 3 === i5 ? "</math>" : "")), e5];
};
var S2 = class _S {
  constructor({ strings: t4, _$litType$: i5 }, e5) {
    let r6;
    this.parts = [];
    let l3 = 0, a3 = 0;
    const u3 = t4.length - 1, d3 = this.parts, [f3, v2] = N(t4, i5);
    if (this.el = _S.createElement(f3, e5), P.currentNode = this.el.content, 2 === i5 || 3 === i5) {
      const t5 = this.el.content.firstChild;
      t5.replaceWith(...t5.childNodes);
    }
    for (; null !== (r6 = P.nextNode()) && d3.length < u3; ) {
      if (1 === r6.nodeType) {
        if (r6.hasAttributes()) for (const t5 of r6.getAttributeNames()) if (t5.endsWith(h2)) {
          const i6 = v2[a3++], s4 = r6.getAttribute(t5).split(o3), e6 = /([.?@])?(.*)/.exec(i6);
          d3.push({ type: 1, index: l3, name: e6[2], strings: s4, ctor: "." === e6[1] ? I : "?" === e6[1] ? L : "@" === e6[1] ? z : H }), r6.removeAttribute(t5);
        } else t5.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r6.removeAttribute(t5));
        if (y2.test(r6.tagName)) {
          const t5 = r6.textContent.split(o3), i6 = t5.length - 1;
          if (i6 > 0) {
            r6.textContent = s2 ? s2.emptyScript : "";
            for (let s4 = 0; s4 < i6; s4++) r6.append(t5[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
            r6.append(t5[i6], c3());
          }
        }
      } else if (8 === r6.nodeType) if (r6.data === n3) d3.push({ type: 2, index: l3 });
      else {
        let t5 = -1;
        for (; -1 !== (t5 = r6.data.indexOf(o3, t5 + 1)); ) d3.push({ type: 7, index: l3 }), t5 += o3.length - 1;
      }
      l3++;
    }
  }
  static createElement(t4, i5) {
    const s4 = l2.createElement("template");
    return s4.innerHTML = t4, s4;
  }
};
function M(t4, i5, s4 = t4, e5) {
  if (i5 === E) return i5;
  let h3 = void 0 !== e5 ? s4._$Co?.[e5] : s4._$Cl;
  const o6 = a2(i5) ? void 0 : i5._$litDirective$;
  return h3?.constructor !== o6 && (h3?._$AO?.(false), void 0 === o6 ? h3 = void 0 : (h3 = new o6(t4), h3._$AT(t4, s4, e5)), void 0 !== e5 ? (s4._$Co ?? (s4._$Co = []))[e5] = h3 : s4._$Cl = h3), void 0 !== h3 && (i5 = M(t4, h3._$AS(t4, i5.values), h3, e5)), i5;
}
var R = class {
  constructor(t4, i5) {
    this._$AV = [], this._$AN = void 0, this._$AD = t4, this._$AM = i5;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t4) {
    const { el: { content: i5 }, parts: s4 } = this._$AD, e5 = (t4?.creationScope ?? l2).importNode(i5, true);
    P.currentNode = e5;
    let h3 = P.nextNode(), o6 = 0, n5 = 0, r6 = s4[0];
    for (; void 0 !== r6; ) {
      if (o6 === r6.index) {
        let i6;
        2 === r6.type ? i6 = new k(h3, h3.nextSibling, this, t4) : 1 === r6.type ? i6 = new r6.ctor(h3, r6.name, r6.strings, this, t4) : 6 === r6.type && (i6 = new Z(h3, this, t4)), this._$AV.push(i6), r6 = s4[++n5];
      }
      o6 !== r6?.index && (h3 = P.nextNode(), o6++);
    }
    return P.currentNode = l2, e5;
  }
  p(t4) {
    let i5 = 0;
    for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t4, s4, i5), i5 += s4.strings.length - 2) : s4._$AI(t4[i5])), i5++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t4, i5, s4, e5) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t4, this._$AB = i5, this._$AM = s4, this.options = e5, this._$Cv = e5?.isConnected ?? true;
  }
  get parentNode() {
    let t4 = this._$AA.parentNode;
    const i5 = this._$AM;
    return void 0 !== i5 && 11 === t4?.nodeType && (t4 = i5.parentNode), t4;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t4, i5 = this) {
    t4 = M(this, t4, i5), a2(t4) ? t4 === A || null == t4 || "" === t4 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t4 !== this._$AH && t4 !== E && this._(t4) : void 0 !== t4._$litType$ ? this.$(t4) : void 0 !== t4.nodeType ? this.T(t4) : d2(t4) ? this.k(t4) : this._(t4);
  }
  O(t4) {
    return this._$AA.parentNode.insertBefore(t4, this._$AB);
  }
  T(t4) {
    this._$AH !== t4 && (this._$AR(), this._$AH = this.O(t4));
  }
  _(t4) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t4 : this.T(l2.createTextNode(t4)), this._$AH = t4;
  }
  $(t4) {
    const { values: i5, _$litType$: s4 } = t4, e5 = "number" == typeof s4 ? this._$AC(t4) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e5) this._$AH.p(i5);
    else {
      const t5 = new R(e5, this), s5 = t5.u(this.options);
      t5.p(i5), this.T(s5), this._$AH = t5;
    }
  }
  _$AC(t4) {
    let i5 = C.get(t4.strings);
    return void 0 === i5 && C.set(t4.strings, i5 = new S2(t4)), i5;
  }
  k(t4) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i5 = this._$AH;
    let s4, e5 = 0;
    for (const h3 of t4) e5 === i5.length ? i5.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i5[e5], s4._$AI(h3), e5++;
    e5 < i5.length && (this._$AR(s4 && s4._$AB.nextSibling, e5), i5.length = e5);
  }
  _$AR(t4 = this._$AA.nextSibling, s4) {
    for (this._$AP?.(false, true, s4); t4 !== this._$AB; ) {
      const s5 = i3(t4).nextSibling;
      i3(t4).remove(), t4 = s5;
    }
  }
  setConnected(t4) {
    void 0 === this._$AM && (this._$Cv = t4, this._$AP?.(t4));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t4, i5, s4, e5, h3) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t4, this.name = i5, this._$AM = e5, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
  }
  _$AI(t4, i5 = this, s4, e5) {
    const h3 = this.strings;
    let o6 = false;
    if (void 0 === h3) t4 = M(this, t4, i5, 0), o6 = !a2(t4) || t4 !== this._$AH && t4 !== E, o6 && (this._$AH = t4);
    else {
      const e6 = t4;
      let n5, r6;
      for (t4 = h3[0], n5 = 0; n5 < h3.length - 1; n5++) r6 = M(this, e6[s4 + n5], i5, n5), r6 === E && (r6 = this._$AH[n5]), o6 || (o6 = !a2(r6) || r6 !== this._$AH[n5]), r6 === A ? t4 = A : t4 !== A && (t4 += (r6 ?? "") + h3[n5 + 1]), this._$AH[n5] = r6;
    }
    o6 && !e5 && this.j(t4);
  }
  j(t4) {
    t4 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t4 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t4) {
    this.element[this.name] = t4 === A ? void 0 : t4;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t4) {
    this.element.toggleAttribute(this.name, !!t4 && t4 !== A);
  }
};
var z = class extends H {
  constructor(t4, i5, s4, e5, h3) {
    super(t4, i5, s4, e5, h3), this.type = 5;
  }
  _$AI(t4, i5 = this) {
    if ((t4 = M(this, t4, i5, 0) ?? A) === E) return;
    const s4 = this._$AH, e5 = t4 === A && s4 !== A || t4.capture !== s4.capture || t4.once !== s4.once || t4.passive !== s4.passive, h3 = t4 !== A && (s4 === A || e5);
    e5 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t4), this._$AH = t4;
  }
  handleEvent(t4) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t4) : this._$AH.handleEvent(t4);
  }
};
var Z = class {
  constructor(t4, i5, s4) {
    this.element = t4, this.type = 6, this._$AN = void 0, this._$AM = i5, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t4) {
    M(this, t4);
  }
};
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ?? (t2.litHtmlVersions = [])).push("3.3.3");
var D = (t4, i5, s4) => {
  const e5 = s4?.renderBefore ?? i5;
  let h3 = e5._$litPart$;
  if (void 0 === h3) {
    const t5 = s4?.renderBefore ?? null;
    e5._$litPart$ = h3 = new k(i5.insertBefore(c3(), t5), t5, void 0, s4 ?? {});
  }
  return h3._$AI(t4), h3;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var _a;
    const t4 = super.createRenderRoot();
    return (_a = this.renderOptions).renderBefore ?? (_a.renderBefore = t4.firstChild), t4;
  }
  update(t4) {
    const r6 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t4), this._$Do = D(r6, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ?? (s3.litElementVersions = [])).push("4.2.2");

// node_modules/@lit/reactive-element/decorators/custom-element.js
var t3 = (t4) => (e5, o6) => {
  void 0 !== o6 ? o6.addInitializer(() => {
    customElements.define(t4, e5);
  }) : customElements.define(t4, e5);
};

// node_modules/@lit/reactive-element/decorators/property.js
var o5 = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
var r4 = (t4 = o5, e5, r6) => {
  const { kind: n5, metadata: i5 } = r6;
  let s4 = globalThis.litPropertyMetadata.get(i5);
  if (void 0 === s4 && globalThis.litPropertyMetadata.set(i5, s4 = /* @__PURE__ */ new Map()), "setter" === n5 && ((t4 = Object.create(t4)).wrapped = true), s4.set(r6.name, t4), "accessor" === n5) {
    const { name: o6 } = r6;
    return { set(r7) {
      const n6 = e5.get.call(this);
      e5.set.call(this, r7), this.requestUpdate(o6, n6, t4, true, r7);
    }, init(e6) {
      return void 0 !== e6 && this.C(o6, void 0, t4, e6), e6;
    } };
  }
  if ("setter" === n5) {
    const { name: o6 } = r6;
    return function(r7) {
      const n6 = this[o6];
      e5.call(this, r7), this.requestUpdate(o6, n6, t4, true, r7);
    };
  }
  throw Error("Unsupported decorator location: " + n5);
};
function n4(t4) {
  return (e5, o6) => "object" == typeof o6 ? r4(t4, e5, o6) : ((t5, e6, o7) => {
    const r6 = e6.hasOwnProperty(o7);
    return e6.constructor.createProperty(o7, t5), r6 ? Object.getOwnPropertyDescriptor(e6, o7) : void 0;
  })(t4, e5, o6);
}

// node_modules/@lit/reactive-element/decorators/state.js
function r5(r6) {
  return n4({ ...r6, state: true, attribute: false });
}

// src/const.ts
var CARD_VERSION = "1.2.0";
var ERROR_FRESH_MS = 24 * 36e5;
var HISTORY_DAYS = 10;
var TICK_MS = 6e4;
var FEATURE_START_MOWING = 1;
var FEATURE_PAUSE = 2;
var FEATURE_DOCK = 4;
var FEATURE_STOP = 8;
var MAMMOTION_ASSETS = "/hacsfiles/ha-mammotion-assets/dist/assets";

// src/height.ts
var HEIGHT_MODES = ["auto", "fixed", "max"];
var pixels = (value) => value == null || typeof value === "number" && Number.isFinite(value) && value > 0;
function validHeight(config) {
  return (config.height_mode == null || HEIGHT_MODES.includes(config.height_mode)) && pixels(config.height) && pixels(config.max_height);
}
function heightMode(config) {
  return config.height_mode ?? (config.height ? "fixed" : config.max_height ? "max" : "auto");
}
var ROW_HEIGHT = 56;
var ROW_GAP = 8;
function heightStyle(config, layout, minimum = 0) {
  const rows = config.grid_options ? config.grid_options.rows : config.layout_options?.grid_rows;
  if (layout === "grid" && typeof rows === "number") {
    return "height: 100%";
  }
  const mode = heightMode(config);
  if (mode === "fixed" && config.height) {
    return `height: ${Math.max(config.height, minimum)}px`;
  }
  return mode === "max" && config.max_height ? `max-height: ${Math.max(config.max_height, minimum)}px` : "";
}
function gridMinRows(minimum) {
  return Math.max(1, Math.ceil((minimum + ROW_GAP) / (ROW_HEIGHT + ROW_GAP)));
}
function heightCardSize(config, content, minimum = 0) {
  const mode = heightMode(config);
  if (mode === "fixed" && config.height) {
    return Math.max(1, Math.round(Math.max(config.height, minimum) / 50));
  }
  return mode === "max" && config.max_height ? Math.max(1, Math.min(content, Math.round(Math.max(config.max_height, minimum) / 50))) : content;
}
function heightSchema(config, text) {
  const mode = heightMode(config);
  const field = (name) => ({
    name,
    selector: { number: { min: 100, max: 2e3, step: 10, unit_of_measurement: "px", mode: "box" } }
  });
  return [
    {
      name: "height_mode",
      selector: {
        select: { mode: "dropdown", options: HEIGHT_MODES.map((value) => ({ value, label: text(`editor.height_mode_${value}`) })) }
      }
    },
    ...mode === "fixed" ? [field("height")] : mode === "max" ? [field("max_height")] : []
  ];
}
function heightData(config) {
  return { ...config, height_mode: heightMode(config) };
}
function tidyHeight(config) {
  const tidied = { ...config };
  for (const key of ["height", "max_height"]) {
    if (!tidied[key]) {
      delete tidied[key];
    }
  }
  if (!tidied.height_mode || heightMode({ ...tidied, height_mode: void 0 }) === tidied.height_mode) {
    delete tidied.height_mode;
  }
  return tidied;
}

// src/localize/languages/en.json
var en_default = {
  common: {
    name: "Mower status",
    description: "A robotic lawn mower's state, battery, the task under way, its problems and its buttons",
    invalid_configuration: "Invalid configuration. Choose a lawn mower.",
    invalid_height: "Invalid height. height and max_height must be positive numbers of pixels, and height_mode auto, fixed or max.",
    no_entity: "Entity {entity} not found",
    unavailable: "Unavailable",
    charging: "charging",
    battery: "battery",
    done: "done",
    time_left: "About {time} left",
    battery_value: "Battery {battery}",
    battery_elapsed: "Battery {battery}, {elapsed} elapsed",
    elapsed: "{elapsed} elapsed",
    progress_elapsed: "{progress} done, {elapsed} elapsed",
    progress_done: "{progress} done",
    last_mowed: "Last mowed {when}",
    last_mowed_long_ago: "Last mowed over {days} days ago",
    mileage: "{value} in total"
  },
  when: {
    today: "today",
    yesterday: "yesterday",
    time: "at {clock}",
    format: "{day} {time}"
  },
  duration: {
    minutes: "{minutes} min",
    hours: "{hours} h {minutes} min"
  },
  action: {
    pause: "Pause",
    continue: "Continue task",
    continue_mowing: "Continue mowing",
    start: "Start a new task",
    start_mowing: "Start mowing",
    cancel: "Cancel task",
    cancel_confirm: "Cancel the unfinished task?",
    stop: "Stop",
    stop_confirm: "Stop the mower?",
    dock: "Dock"
  },
  notice: {
    error: "Error",
    error_text: "{when}. {text}",
    error_generic: "The mower reports an error.",
    dismiss: "Dismiss",
    positioning: "Weak positioning",
    positioning_generic: "Positioning is weak.",
    positioning_rtk: "RTK positioning is in {state} mode, not Fix.",
    positioning_vision: "The visual positioning signal is weak.",
    positioning_satellites: "{count} satellites in view.",
    blade: "Blades {used} / {limit} h",
    blade_text: "The blades have been in use for {used} hours, and the limit for changing them is {limit} hours.",
    rain: "Rain",
    rain_text: "The rain sensor detects rain.",
    update: "Update",
    update_text: "Firmware {latest} is available. {installed} is installed now."
  },
  editor: {
    entity: "Lawn mower",
    name: "Name",
    name_helper: "Replaces the device's name",
    picture: "Picture",
    show_image: "Show a picture",
    show_image_helper: "A picture of the mower, when one is given or found. Without one the card shows a gauge.",
    image: "Picture of your own",
    image_helper: "An address, such as /local/mower.png. Replaces the picture found.",
    image_variant: "Mammotion picture",
    image_variant_helper: "From ha-mammotion-assets, when it is installed",
    variant_default: "Standard",
    variant_white: "White model",
    show_cancel: "Show the cancel or stop button",
    show_cancel_helper: "The mower's own cancel button, or Home Assistant's stop when it has none",
    blade_warning_hours: "Blade limit",
    blade_warning_hours_helper: "In hours, when the mower reports none of its own",
    entities: "Entities",
    entities_helper: "The card tries to find these on the mower's device automatically. Pick another entity or empty the field if the choice is wrong.",
    height_mode: "Height",
    height_mode_helper: "A height set in the layout tab of a sections view is used instead.",
    height_mode_auto: "Fits the content",
    height_mode_fixed: "Fixed",
    height_mode_max: "Grows up to a limit",
    height: "Fixed height",
    height_helper: "The card is always this tall, and the notices scroll inside it.",
    max_height: "Maximum height",
    max_height_helper: "The card grows with its content up to this height, and then the notices scroll."
  },
  slot: {
    battery: "Battery",
    charging: "Charging",
    progress: "Task progress",
    time_left: "Time left",
    elapsed: "Time elapsed",
    error: "Last error",
    error_time: "Error time",
    rain: "Rain",
    positioning: "RTK positioning",
    vision: "Visual positioning",
    satellites: "Satellites",
    blade_time: "Blade time",
    blade_limit: "Blade limit",
    update: "Firmware",
    mileage: "Total distance",
    continue: "Continue task button",
    cancel: "Cancel task button",
    picture: "Picture"
  },
  state: {
    idle: "Idle",
    returning: "Returning",
    error: "Error"
  }
};

// src/localize/languages/fi.json
var fi_default = {
  common: {
    name: "Ruohonleikkurin tila",
    description: "Robottiruohonleikkurin tila, akku, k\xE4ynniss\xE4 oleva teht\xE4v\xE4, ongelmat ja painikkeet",
    invalid_configuration: "Virheellinen konfiguraatio. Valitse ruohonleikkuri.",
    invalid_height: "Virheellinen korkeus. Korkeuksien (height ja max_height) on oltava positiivisia lukuja pikselein\xE4, ja korkeustilan (height_mode) auto, fixed tai max.",
    no_entity: "Entiteetti\xE4 {entity} ei l\xF6ydy",
    unavailable: "Ei saatavilla",
    charging: "lataa",
    battery: "akku",
    done: "tehty",
    time_left: "Noin {time} j\xE4ljell\xE4",
    battery_value: "Akku {battery}",
    battery_elapsed: "Akku {battery}, {elapsed} kulunut",
    elapsed: "{elapsed} kulunut",
    progress_elapsed: "{progress} tehty, {elapsed} kulunut",
    progress_done: "{progress} tehty",
    last_mowed: "Leikkasi viimeksi {when}",
    last_mowed_long_ago: "Leikkasi viimeksi yli {days} p\xE4iv\xE4\xE4 sitten",
    mileage: "{value} yhteens\xE4"
  },
  when: {
    today: "t\xE4n\xE4\xE4n",
    yesterday: "eilen",
    time: "klo {clock}",
    format: "{day} {time}"
  },
  duration: {
    minutes: "{minutes} min",
    hours: "{hours} h {minutes} min"
  },
  action: {
    pause: "Tauko",
    continue: "Jatka teht\xE4v\xE4\xE4",
    continue_mowing: "Jatka leikkuuta",
    start: "Aloita uusi teht\xE4v\xE4",
    start_mowing: "Aloita leikkuu",
    cancel: "Peru teht\xE4v\xE4",
    cancel_confirm: "Perutaanko keskener\xE4inen teht\xE4v\xE4?",
    stop: "Pys\xE4yt\xE4",
    stop_confirm: "Pys\xE4ytet\xE4\xE4nk\xF6 ruohonleikkuri?",
    dock: "Telakkaan"
  },
  notice: {
    error: "Virhe",
    error_text: "{when}. {text}",
    error_generic: "Ruohonleikkuri ilmoittaa virheest\xE4.",
    dismiss: "Kuittaa",
    positioning: "Paikannus heikko",
    positioning_generic: "Paikannus on heikko.",
    positioning_rtk: "RTK-paikannus on {state}-tilassa eik\xE4 Fix-tilassa.",
    positioning_vision: "Kamerapaikannuksen signaali on heikko.",
    positioning_satellites: "Satelliitteja n\xE4kyy {count}.",
    blade: "Ter\xE4t {used} / {limit} h",
    blade_text: "Ter\xE4t ovat olleet k\xE4yt\xF6ss\xE4 {used} tuntia, ja vaihtoraja on {limit} tuntia.",
    rain: "Sataa",
    rain_text: "Sadeanturi havaitsee sadetta.",
    update: "P\xE4ivitys",
    update_text: "Laiteohjelmisto {latest} on saatavilla. Nyt k\xE4yt\xF6ss\xE4 on {installed}."
  },
  editor: {
    entity: "Ruohonleikkuri",
    name: "Nimi",
    name_helper: "Korvaa laitteen nimen",
    picture: "Kuva",
    show_image: "N\xE4yt\xE4 kuva",
    show_image_helper: "Kuva ruohonleikkurista, kun sellainen on annettu tai l\xF6ytyy. Ilman kuvaa kortti n\xE4ytt\xE4\xE4 mittarin.",
    image: "Oma kuva",
    image_helper: "Osoite, kuten /local/ruohonleikkuri.png. Korvaa l\xF6ydetyn kuvan.",
    image_variant: "Mammotionin kuva",
    image_variant_helper: "ha-mammotion-assets-paketista, kun se on asennettu",
    variant_default: "Tavallinen",
    variant_white: "Valkoinen malli",
    show_cancel: "N\xE4yt\xE4 peru- tai pys\xE4yt\xE4-painike",
    show_cancel_helper: "Ruohonleikkurin oma peru-painike, tai Home Assistantin pys\xE4ytys, jos sellaista ei ole",
    blade_warning_hours: "Terien vaihtoraja",
    blade_warning_hours_helper: "Tunteina, jos ruohonleikkuri ei kerro omaansa",
    entities: "Entiteetit",
    entities_helper: "Kortti yritt\xE4\xE4 l\xF6yt\xE4\xE4 n\xE4m\xE4 ruohonleikkurin laitteelta automaattisesti. Vaihda entiteetti toiseen tai tyhjenn\xE4 kentt\xE4, mik\xE4li valinta on v\xE4\xE4r\xE4.",
    height_mode: "Korkeus",
    height_mode_helper: "Osioihin jaetun n\xE4kym\xE4n asettelu-v\xE4lilehdell\xE4 asetettu korkeus ohittaa t\xE4m\xE4n.",
    height_mode_auto: "Sis\xE4ll\xF6n mukaan",
    height_mode_fixed: "Kiinte\xE4",
    height_mode_max: "Kasvaa rajaan asti",
    height: "Kiinte\xE4 korkeus",
    height_helper: "Kortti on aina n\xE4in korkea, ja ilmoitukset vieriv\xE4t sen sis\xE4ll\xE4.",
    max_height: "Enimm\xE4iskorkeus",
    max_height_helper: "Kortti kasvaa sis\xE4lt\xF6ns\xE4 mukana t\xE4h\xE4n korkeuteen asti, ja sen j\xE4lkeen ilmoitukset vieriv\xE4t."
  },
  slot: {
    battery: "Akku",
    charging: "Lataus",
    progress: "Teht\xE4v\xE4n edistyminen",
    time_left: "Aikaa j\xE4ljell\xE4",
    elapsed: "Kulunut aika",
    error: "Viimeisin virhe",
    error_time: "Virheen aika",
    rain: "Sade",
    positioning: "RTK-paikannus",
    vision: "Kamerapaikannus",
    satellites: "Satelliitit",
    blade_time: "Terien k\xE4ytt\xF6aika",
    blade_limit: "Terien vaihtoraja",
    update: "Laiteohjelmisto",
    mileage: "Kokonaismatka",
    continue: "Jatka teht\xE4v\xE4\xE4 -painike",
    cancel: "Peru teht\xE4v\xE4 -painike",
    picture: "Kuva"
  },
  state: {
    idle: "Valmiustilassa",
    returning: "Palaa telakkaan",
    error: "Virhe"
  }
};

// src/localize/localize.ts
var FILES = { "./languages/en.json": en_default, "./languages/fi.json": fi_default };
var LANGUAGES = Object.fromEntries(
  Object.entries(FILES).map(([path, table]) => [path.replace(/^.*\/|\.json$/g, "").toLowerCase(), table])
);
var LANGUAGE_CODES = Object.keys(LANGUAGES).sort();
function translate(language, key) {
  return translateOwn(language, key) ?? read(LANGUAGES.en, key) ?? key;
}
function translateOwn(language, key) {
  return read(LANGUAGES[(language ?? "en").split(/[-_]/)[0].toLowerCase()], key);
}
function read(table, key) {
  let value = table;
  for (const part of key.split(".")) {
    if (value === null || typeof value !== "object") {
      return void 0;
    }
    value = value[part];
  }
  return typeof value === "string" ? value : void 0;
}
function browserLanguage() {
  return document.documentElement.lang || navigator.language || "en";
}

// src/types.ts
var SLOTS = [
  "battery",
  "charging",
  "progress",
  "time_left",
  "elapsed",
  "error",
  "error_time",
  "rain",
  "positioning",
  "vision",
  "satellites",
  "blade_time",
  "blade_limit",
  "update",
  "mileage",
  "continue",
  "cancel",
  "picture"
];
var NONE = "none";

// src/slots.ts
var SLOT_DOMAINS = {
  battery: ["sensor"],
  charging: ["binary_sensor"],
  progress: ["sensor"],
  time_left: ["sensor"],
  elapsed: ["sensor"],
  error: ["sensor"],
  error_time: ["sensor"],
  rain: ["binary_sensor", "sensor"],
  positioning: ["sensor", "binary_sensor"],
  vision: ["sensor", "binary_sensor"],
  satellites: ["sensor"],
  blade_time: ["sensor"],
  blade_limit: ["sensor"],
  update: ["update"],
  mileage: ["sensor"],
  continue: ["button"],
  cancel: ["button"],
  picture: ["image"]
};
var GENERIC = {
  battery: (entity) => domain(entity.entity_id) === "sensor" && entity.attributes.device_class === "battery",
  charging: (entity) => domain(entity.entity_id) === "binary_sensor" && entity.attributes.device_class === "battery_charging",
  rain: (entity) => domain(entity.entity_id) === "binary_sensor" && entity.attributes.device_class === "moisture",
  update: (entity) => domain(entity.entity_id) === "update"
};
var STANDARD_STATES = /* @__PURE__ */ new Set(["mowing", "docked", "paused", "returning", "idle", "error", "unavailable", "unknown"]);
var PRESETS = {
  mammotion: {
    slots: {
      battery: "battery_percent",
      progress: "progress",
      time_left: "left_time",
      elapsed: "elapsed_time",
      error: "error_1_message",
      error_time: "error_1_time",
      rain: "rain_detected",
      positioning: "positioning_mode",
      vision: "visual_positioning_status",
      satellites: "gps_stars",
      blade_time: "blade_used_time",
      blade_limit: "blade_used_warn_time",
      update: "update",
      mileage: "maintenance_distance",
      continue: "continue_last_job",
      cancel: "cancel_task"
    }
  },
  sunseeker: {
    slots: {
      error: "sunseeker_error_text",
      rain: "sunseeker_rain_status",
      picture: "mower_robot_image"
    },
    states: {
      working: "mowing",
      mowing_border: "mowing",
      continue_mowing: "mowing",
      locating: "mowing",
      edge_confirming: "mowing",
      auto_mapping: "mowing",
      return: "returning",
      on_the_way_home: "returning",
      pause: "paused",
      return_pause: "paused",
      build_map_paused: "paused",
      charging: "docked",
      charging_full: "docked",
      standby: "idle",
      stop: "idle",
      sleep: "idle",
      remote_control: "idle",
      updating_firmware: "idle",
      enter_pin: "idle",
      unknown4: "idle",
      stuck: "error",
      offline: "unavailable"
    },
    // An older Sunseeker puts its error's text in place of its state.
    otherStates: "error",
    chargingStates: ["charging"],
    plainStates: ["standby"]
  }
};
function presetOf(hass, mower) {
  return PRESETS[platformOf(hass, mower) ?? ""];
}
function activityOf(preset, state) {
  return preset?.states?.[state] ?? (STANDARD_STATES.has(state) ? state : preset?.otherStates ?? state);
}
function domain(entityId) {
  return entityId.split(".")[0];
}
function platformOf(hass, mower) {
  return hass.entities?.[mower]?.platform;
}
function deviceEntities(hass, mower) {
  const deviceId = hass.entities?.[mower]?.device_id;
  if (!deviceId || !hass.entities) {
    return [];
  }
  return Object.values(hass.entities).filter((entry) => !!entry && entry.device_id === deviceId && entry.entity_id !== mower).sort((a3, b3) => Number(!!a3?.hidden) - Number(!!b3?.hidden) || a3.entity_id.localeCompare(b3.entity_id)).map((entry) => entry.entity_id);
}
function detectSlots(hass, mower) {
  const entities = deviceEntities(hass, mower);
  const preset = presetOf(hass, mower)?.slots ?? {};
  const found = {};
  for (const slot of SLOTS) {
    const key = preset[slot];
    const byKey = key ? entities.find((id) => SLOT_DOMAINS[slot].includes(domain(id)) && hass.entities?.[id]?.translation_key === key) : void 0;
    const generic = GENERIC[slot];
    const entity = byKey ?? (generic ? entities.find((id) => !!hass.states[id] && generic(hass.states[id])) : void 0);
    if (entity) {
      found[slot] = entity;
    }
  }
  return found;
}
function resolveSlots(hass, config) {
  const slots = { ...detectSlots(hass, config.entity) };
  for (const [slot, entity] of Object.entries(config.entities ?? {})) {
    if (!SLOTS.includes(slot)) {
      continue;
    }
    if (entity === NONE || !entity) {
      delete slots[slot];
    } else {
      slots[slot] = entity;
    }
  }
  return slots;
}
function slotChanges(found, chosen, previous = {}) {
  const changes = {};
  for (const slot of SLOTS) {
    const value = chosen[slot] || void 0;
    if (value === (found[slot] || void 0)) {
      if (!value && previous[slot] === NONE) {
        changes[slot] = NONE;
      }
      continue;
    }
    changes[slot] = value ?? NONE;
  }
  return changes;
}

// src/editor.ts
var DEFAULTS = {
  show_image: true,
  show_cancel: true,
  image_variant: "default"
};
function mainSchema(config, mammotion, text) {
  return [
    { name: "entity", required: true, selector: { entity: { domain: "lawn_mower" } } },
    { name: "name", selector: { text: {} } },
    {
      type: "expandable",
      name: "",
      flatten: true,
      title: text("editor.picture"),
      icon: "mdi:image-outline",
      schema: [
        { name: "show_image", selector: { boolean: {} } },
        { name: "image", selector: { text: {} } },
        ...mammotion ? [
          {
            name: "image_variant",
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "default", label: text("editor.variant_default") },
                  { value: "white", label: text("editor.variant_white") }
                ]
              }
            }
          }
        ] : []
      ]
    },
    { name: "show_cancel", selector: { boolean: {} } },
    { name: "blade_warning_hours", selector: { number: { min: 0, max: 5e3, step: 1, mode: "box", unit_of_measurement: "h" } } },
    ...heightSchema(config, text)
  ];
}
var SLOTS_SCHEMA = SLOTS.map((slot) => ({ name: slot, selector: { entity: { domain: SLOT_DOMAINS[slot] } } }));
var MowerStatusCardEditor = class extends i4 {
  constructor() {
    super(...arguments);
    this.config = { type: "custom:mower-status-card", entity: "" };
  }
  setConfig(config) {
    this.config = { ...config };
  }
  render() {
    if (!this.hass) {
      return A;
    }
    const data = heightData({ ...DEFAULTS, ...this.config });
    const mammotion = !!this.config.entity && platformOf(this.hass, this.config.entity) === "mammotion";
    return b2`
            <ha-form
                .hass=${this.hass}
                .data=${data}
                .schema=${mainSchema(this.config, mammotion, (key) => this.text(key))}
                .computeLabel=${(entry) => this.text(`editor.${entry.name}`)}
                .computeHelper=${(entry) => this.helper(entry.name)}
                @value-changed=${this.mainChanged}
            ></ha-form>
            ${this.config.entity ? this.slotsPanel() : A}
        `;
  }
  /** Each slot shows what is used: the found entity, the one chosen instead, or nothing when it was turned off. */
  slotsPanel() {
    const found = detectSlots(this.hass, this.config.entity);
    const chosen = { ...found };
    for (const [slot, entity] of Object.entries(this.config.entities ?? {})) {
      chosen[slot] = entity === NONE ? "" : entity;
    }
    return b2`
            <ha-expansion-panel outlined .header=${this.text("editor.entities")} .leftChevron=${true}>
                <ha-icon slot="leading-icon" icon="mdi:format-list-bulleted"></ha-icon>
                <p class="helper">${this.text("editor.entities_helper")}</p>
                <ha-form
                    .hass=${this.hass}
                    .data=${chosen}
                    .schema=${SLOTS_SCHEMA}
                    .computeLabel=${(entry) => this.text(`slot.${entry.name}`)}
                    @value-changed=${(event) => this.slotsChanged(found, event.detail.value)}
                ></ha-form>
            </ha-expansion-panel>
        `;
  }
  static get styles() {
    return i`
            ha-expansion-panel {
                display: block;
                margin-top: 24px;
            }

            .helper {
                margin: 8px 0 16px;
                font-size: 12px;
                line-height: 1.4;
                color: var(--secondary-text-color);
            }
        `;
  }
  mainChanged(event) {
    const config = tidyHeight(event.detail.value);
    if (config.entity !== this.config.entity) {
      delete config.entities;
      delete config.image_variant;
      delete config.image;
      delete config.name;
      delete config.blade_warning_hours;
    }
    for (const key of ["name", "image", "blade_warning_hours"]) {
      if (config[key] === "" || config[key] === void 0 || config[key] === null || config[key] === 0) {
        delete config[key];
      }
    }
    for (const [key, value] of Object.entries(DEFAULTS)) {
      if (config[key] === value || config[key] === void 0 || config[key] === null) {
        delete config[key];
      }
    }
    this.fire(config);
  }
  slotsChanged(found, chosen) {
    const config = { ...this.config };
    const changes = slotChanges(found, chosen, this.config.entities);
    if (Object.keys(changes).length) {
      config.entities = changes;
    } else {
      delete config.entities;
    }
    this.fire(config);
  }
  fire(config) {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
  text(key) {
    return translate(this.language(), key);
  }
  helper(name) {
    const key = `editor.${name}_helper`;
    const helper = translate(this.language(), key);
    return helper === key ? void 0 : helper;
  }
  language() {
    return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
  }
};
__decorateClass([
  n4({ attribute: false })
], MowerStatusCardEditor.prototype, "hass", 2);
__decorateClass([
  r5()
], MowerStatusCardEditor.prototype, "config", 2);
MowerStatusCardEditor = __decorateClass([
  t3("mower-status-card-editor")
], MowerStatusCardEditor);

// src/fade.ts
var fadeStyles = i`
    .fades {
        --fade-length: min(24px, 25%);
        scroll-padding-block: calc(var(--fade-top-offset, 0px) + var(--fade-length, 24px)) var(--fade-length, 24px);
    }

    .fade-top {
        mask-image: linear-gradient(
            to bottom,
            #000 var(--fade-top-offset, 0px),
            transparent var(--fade-top-offset, 0px),
            #000 calc(var(--fade-top-offset, 0px) + var(--fade-length, 24px))
        );
    }

    .fade-bottom {
        mask-image: linear-gradient(to top, transparent, #000 var(--fade-length, 24px));
    }

    .fade-top.fade-bottom {
        mask-image: linear-gradient(
            to bottom,
            #000 var(--fade-top-offset, 0px),
            transparent var(--fade-top-offset, 0px),
            #000 calc(var(--fade-top-offset, 0px) + var(--fade-length, 24px)),
            #000 calc(100% - var(--fade-length, 24px)),
            transparent
        );
    }
`;
function markFade(part) {
  const hidden = part.scrollHeight - part.clientHeight;
  part.classList.toggle("fade-top", hidden > 1 && part.scrollTop > 1);
  part.classList.toggle("fade-bottom", hidden > 1 && hidden - part.scrollTop > 1);
}
var onScroll = (event) => markFade(event.currentTarget);
var ScrollFade = class {
  constructor(host, parts) {
    this.host = host;
    this.parts = parts;
    /** Each followed part with the children whose size it watches. */
    this.followed = /* @__PURE__ */ new Map();
    this.resized = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver((entries) => {
      for (const { target } of entries) {
        const part = this.followed.has(target) ? target : target.parentElement;
        if (part && this.followed.has(part)) {
          markFade(part);
        }
      }
    });
    host.addController(this);
  }
  hostConnected() {
    if (this.host.hasUpdated) {
      this.follow();
    }
  }
  hostUpdated() {
    if (this.host.isConnected) {
      this.follow();
    }
  }
  hostDisconnected() {
    for (const part of [...this.followed.keys()]) {
      this.forget(part);
    }
  }
  follow() {
    const now = new Set(this.parts());
    for (const part of [...this.followed.keys()]) {
      if (!now.has(part)) {
        this.forget(part);
      }
    }
    for (const part of now) {
      if (!this.followed.has(part)) {
        part.addEventListener("scroll", onScroll, { passive: true });
        this.resized?.observe(part);
      }
      part.classList.add("fades");
      const before = this.followed.get(part) ?? [];
      const children = [...part.children];
      before.filter((child) => !children.includes(child)).forEach((child) => this.resized?.unobserve(child));
      children.filter((child) => !before.includes(child)).forEach((child) => this.resized?.observe(child));
      this.followed.set(part, children);
      markFade(part);
    }
  }
  forget(part) {
    this.followed.get(part)?.forEach((child) => this.resized?.unobserve(child));
    this.followed.delete(part);
    part.removeEventListener("scroll", onScroll);
    this.resized?.unobserve(part);
    part.classList.remove("fades", "fade-top", "fade-bottom");
  }
};

// src/mower.ts
var TASK_STATES = /* @__PURE__ */ new Set(["mowing", "paused", "returning", "error"]);
var EMPTY = /* @__PURE__ */ new Set(["", "unknown", "unavailable", "none", "null"]);
var NO_ERROR = /* @__PURE__ */ new Set([...EMPTY, "no_error", "ok", "normal"]);
function hasTask(state) {
  return TASK_STATES.has(state ?? "");
}
function mainAction(state, features) {
  if (state === "mowing") {
    return features & FEATURE_PAUSE || !(features & FEATURE_DOCK) ? "pause" : "dock";
  }
  return hasTask(state) ? "continue" : "start";
}
function numberOf(entity) {
  if (!entity || EMPTY.has(entity.state.toLowerCase())) {
    return null;
  }
  const value = Number(entity.state);
  return Number.isFinite(value) ? value : null;
}
function minutesOf(entity) {
  const value = numberOf(entity);
  if (value === null) {
    return null;
  }
  const unit = String(entity?.attributes.unit_of_measurement ?? "min");
  const factor = { s: 1 / 60, min: 1, h: 60, d: 1440 };
  return value * (factor[unit] ?? 1);
}
function errorText(raw, language) {
  const text = (raw ?? "").trim().replace(/^[a-z][\w-]{0,15}:\s+/, "");
  if (EMPTY.has(text.toLowerCase())) {
    return null;
  }
  return text.charAt(0).toLocaleUpperCase(language) + text.slice(1);
}
function errorTime(time) {
  const reported = time && !EMPTY.has(time.state.toLowerCase()) ? Date.parse(time.state) : NaN;
  return Number.isFinite(reported) ? reported : null;
}
function lastMowingEnd(rows) {
  let end = null;
  for (let index = 1; index < rows.length; index++) {
    if (rows[index - 1].s === "mowing" && rows[index].s !== "mowing") {
      end = (rows[index].lc ?? rows[index].lu) * 1e3;
    }
  }
  return end;
}
function lastMowingStart(rows) {
  let start = null;
  for (let index = 1; index < rows.length; index++) {
    if (rows[index - 1].s !== "mowing" && rows[index].s === "mowing") {
      start = (rows[index].lc ?? rows[index].lu) * 1e3;
    }
  }
  return start;
}
var MAMMOTION_MODELS = [
  ["Yuka-MN", "yuka_mn"],
  ["Yuka-MV", "yuka_mn_231"],
  ["Yuka-ML", "yuka_ml"],
  ["Yuka-VP", "yuka_vp"],
  ["Yuka-", "yuka"],
  ["Luba-VP", "luba_vp"],
  ["Luba-MN", "luba_mn"],
  ["Luba-LD", "luba_ld"],
  ["Luba-VA", "luba_442"],
  ["Luba-LA", "new_luba_la_432"],
  ["Luba-MB", "luba_mb"],
  ["Luba-HM", "new_pro"],
  // The Luba 2 has no picture there, and must not fall through to the Luba 1's.
  ["Luba-VS", null],
  ["Luba", "luba"]
];
function mammotionPictures(deviceName, variant) {
  const model = MAMMOTION_MODELS.find(([prefix]) => (deviceName ?? "").startsWith(prefix));
  if (!model?.[1]) {
    return [];
  }
  const stems = variant === "white" ? [`${model[1]}_white`, model[1]] : [model[1]];
  return stems.flatMap((stem) => [".webp", ".png"].map((extension) => `${MAMMOTION_ASSETS}/dc_bg_main_car_${stem}${extension}`));
}
function weakPositioning(entity, bad) {
  if (!entity) {
    return false;
  }
  return entity.entity_id.startsWith("binary_sensor.") ? entity.state === "on" : bad.includes(entity.state);
}
function notices({
  states,
  mowerState,
  now,
  language,
  bladeWarningHours,
  format,
  stateError,
  lastStart,
  dismissed
}) {
  const found = [];
  const reported = states.error;
  const error = reported && !NO_ERROR.has(reported.state.toLowerCase()) ? errorText(format(reported), language) : null;
  const errorAt = error ? errorTime(states.error_time) : null;
  const over = errorAt !== null && ((lastStart ?? -Infinity) > errorAt || (dismissed ?? -Infinity) >= errorAt);
  if (error && (mowerState === "error" || errorAt !== null && now - errorAt < ERROR_FRESH_MS && !over)) {
    found.push({ id: "error", level: "red", values: { text: error, time: errorAt === null ? "" : String(errorAt) } });
  } else if (mowerState === "error") {
    found.push({ id: "error", level: "red", values: { text: errorText(stateError, language) ?? "", time: "" } });
  }
  const outside = mowerState === "mowing" || mowerState === "returning" || !!states.charging && hasTask(mowerState) && states.charging.state !== "on";
  if (outside) {
    const rtkBad = weakPositioning(states.positioning, ["None", "Single", "Float"]);
    const visionBad = weakPositioning(states.vision, ["SIGNAL_NONE", "SIGNAL_BAD"]);
    if (rtkBad || visionBad) {
      const rtkMode = rtkBad && states.positioning?.entity_id.startsWith("sensor.") ? states.positioning.state : "";
      found.push({
        id: "positioning",
        level: "amber",
        values: {
          rtk: rtkMode,
          vision: visionBad ? "1" : "",
          generic: rtkBad && !rtkMode ? "1" : "",
          satellites: numberOf(states.satellites)?.toString() ?? ""
        }
      });
    }
  }
  const used = minutesOf(states.blade_time);
  const ownLimit = minutesOf(states.blade_limit);
  const limit = ownLimit && ownLimit > 0 ? ownLimit : bladeWarningHours && bladeWarningHours > 0 ? bladeWarningHours * 60 : null;
  if (used !== null && limit !== null && used >= limit) {
    found.push({ id: "blade", level: "amber", values: { used: String(Math.floor(used / 60)), limit: String(Math.round(limit / 60)) } });
  }
  if (states.rain?.state === "on" || states.rain?.state === "wet") {
    found.push({ id: "rain", level: "blue", values: {} });
  }
  if (states.update?.state === "on") {
    found.push({
      id: "update",
      level: "blue",
      values: {
        latest: String(states.update.attributes.latest_version ?? ""),
        installed: String(states.update.attributes.installed_version ?? "")
      }
    });
  }
  return found;
}

// src/mower-status-card.ts
console.info(
  `%c  MOWER-STATUS-CARD 
%c  ${CARD_VERSION}    `,
  "color: orange; font-weight: bold; background: black",
  "color: white; font-weight: bold; background: dimgray"
);
var registry = window;
registry.customCards = registry.customCards ?? [];
registry.customCards.push({
  type: "mower-status-card",
  name: translate(browserLanguage(), "common.name"),
  description: translate(browserLanguage(), "common.description"),
  documentationURL: "https://github.com/jesmak/mower-status-card",
  preview: true
});
var pictureChecks = /* @__PURE__ */ new Map();
function pictureExists(url) {
  if (!pictureChecks.has(url)) {
    const check = fetch(url, { method: "HEAD" }).then(
      (response) => response.ok,
      () => false
    );
    pictureChecks.set(url, check);
    void check.then((found) => {
      if (!found) {
        pictureChecks.delete(url);
      }
    });
  }
  return pictureChecks.get(url);
}
function storedDismissal(entityId) {
  try {
    const stored = Number(localStorage.getItem(`mower-status-card.dismissed.${entityId}`));
    return stored > 0 ? stored : null;
  } catch {
    return null;
  }
}
var MowerStatusCard = class extends i4 {
  constructor() {
    super();
    this.selected = null;
    this.picture = null;
    this.framedPictures = /* @__PURE__ */ new Set();
    /** The addresses of pictures that didn't load, without their tokens. */
    this.failedPictures = /* @__PURE__ */ new Set();
    this.lastStart = null;
    this.dismissals = /* @__PURE__ */ new Map();
    this.slots = {};
    /** What the mower is doing, in Home Assistant's lawn_mower states, whatever words its integration uses. */
    this.activity = "";
    this.notices = [];
    this.seenNotices = /* @__PURE__ */ new Set();
    /** A picture of the mower's own that is transparent at its corners, a cut-out, gets the same frame as a model picture. */
    this.pictureLoaded = (event) => {
      const img = event.target;
      if (isModelPicture(this.picture)) {
        return;
      }
      const address = pictureAddress(img.src);
      const framed = hasTransparentCorners(img);
      if (framed !== this.framedPictures.has(address)) {
        const pictures = new Set(this.framedPictures);
        if (framed) {
          pictures.add(address);
        } else {
          pictures.delete(address);
        }
        this.framedPictures = pictures;
      }
    };
    /** A picture that doesn't load, such as a mistyped address, gives the card its gauge back rather than a broken image. */
    this.pictureFailed = () => {
      if (this.picture) {
        this.failedPictures.add(pictureAddress(this.picture));
      }
      this.picture = null;
      this.pictureKey = void 0;
    };
    new ScrollFade(this, () => this.heightStyle() ? this.renderRoot.querySelectorAll(".notices") : []);
  }
  static getConfigElement() {
    return document.createElement("mower-status-card-editor");
  }
  /** Offers the first lawn mower there is when the card is added from the picker. */
  static getStubConfig(hass) {
    return { entity: Object.keys(hass?.states ?? {}).find((id) => domain(id) === "lawn_mower") ?? "" };
  }
  setConfig(config) {
    if (!config || typeof config.entity !== "string" || domain(config.entity) !== "lawn_mower") {
      throw new Error(translate(browserLanguage(), "common.invalid_configuration"));
    }
    if (!validHeight(config)) {
      throw new Error(translate(browserLanguage(), "common.invalid_height"));
    }
    this.config = { ...config };
  }
  getCardSize() {
    return heightCardSize(this.config ?? {}, 4, this.minimumHeight());
  }
  /**
   * In a sections view the card takes a whole section by default and is never narrower than half of one, nor lower
   * than its minimum.
   */
  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto", min_rows: gridMinRows(this.minimumHeight()) };
  }
  // The lowest the card goes when held to a height: its border and padding, the status, one line of notices, the
  // buttons, and in the picture layout the footer. Whether a picture is found is known only from the data, so unless
  // the configuration turns the picture off, the minimum is the picture layout's, the taller.
  minimumHeight() {
    const notices2 = 12 + 26;
    const buttons = 12 + 44;
    const footer = 12 + 16;
    const ring = 92;
    const picture = 96;
    return 2 + 28 + notices2 + buttons + (this.config?.show_image === false ? ring : picture + footer);
  }
  /** "Yesterday" and a day-old error age on their own, so the card redraws itself while it is on the page. */
  connectedCallback() {
    super.connectedCallback();
    this.requestUpdate();
    this.ticker = setInterval(() => this.requestUpdate(), TICK_MS);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.ticker);
  }
  heightStyle() {
    return heightStyle(this.config ?? {}, this.layout, this.minimumHeight());
  }
  shouldUpdate(changed) {
    const previous = changed.get("hass");
    if (!this.config || !changed.has("hass") || !previous || changed.size > 1) {
      return true;
    }
    if (previous.entities !== this.hass?.entities || previous.devices !== this.hass?.devices || previous.locale !== this.hass?.locale || previous.config !== this.hass?.config || previous.language !== this.hass?.language || previous.localize !== this.hass?.localize || previous.formatEntityState !== this.hass?.formatEntityState) {
      return true;
    }
    return [this.config.entity, ...Object.values(this.slots)].some((id) => previous.states[id] !== this.hass?.states[id]);
  }
  willUpdate() {
    if (!this.hass || !this.config) {
      return;
    }
    this.slots = resolveSlots(this.hass, this.config);
    const mower = this.hass.states[this.config.entity];
    this.preset = presetOf(this.hass, this.config.entity);
    this.activity = activityOf(this.preset, mower?.state ?? "");
    const found = notices({
      states: this.slotStates(),
      mowerState: this.activity,
      // An integration's own word for an error, or an older Sunseeker's error text in place of its state.
      stateError: mower && this.activity === "error" && mower.state !== "error" ? this.hass.formatEntityState(mower) : void 0,
      now: Date.now(),
      language: this.language(),
      bladeWarningHours: this.config.blade_warning_hours,
      format: (entity) => this.hass.formatEntityState(entity),
      lastStart: this.lastStart,
      // Another card of the same mower on the page may have dismissed a newer error since.
      dismissed: Math.max(storedDismissal(this.config.entity) ?? 0, this.dismissals.get(this.config.entity) ?? 0) || null
    });
    const seenAs = (notice) => notice.id === "error" ? `error|${notice.values.time || notice.values.text}` : notice.id;
    const ids = new Set(found.map((notice) => notice.id));
    const arrived = found.some((notice) => !this.seenNotices.has(seenAs(notice)));
    if (arrived || this.selected !== null && !ids.has(this.selected)) {
      this.selected = arrived ? found[0]?.id ?? null : null;
    }
    found.forEach((notice) => this.seenNotices.add(seenAs(notice)));
    this.notices = found;
    this.findPicture(mower);
    this.readHistory(mower);
  }
  render() {
    if (!this.hass || !this.config) {
      return A;
    }
    const mower = this.hass.states[this.config.entity];
    if (!mower) {
      return b2`<ha-card style=${this.heightStyle()}>
                <div class="message">${this.text("common.no_entity", { entity: this.config.entity })}</div>
            </ha-card>`;
    }
    const unavailable = this.activity === "unavailable";
    return b2`
            <ha-card class=${unavailable ? "unavailable" : ""} style=${this.heightStyle()} lang=${this.language()}>
                ${this.picture ? this.pictureLayout(mower) : this.gaugeLayout(mower)}
                <div class="notices">${this.chips()}</div>
                ${this.buttons(mower)} ${this.picture ? this.footer() : A}
            </ha-card>
        `;
  }
  /** Without a picture: a ring with the one number that matters now, the name and state beside it. */
  gaugeLayout(mower) {
    const task = hasTask(this.activity);
    const progress = task ? numberOf(this.slotState("progress")) : null;
    const battery = numberOf(this.slotState("battery"));
    const ring = progress !== null ? {
      value: progress,
      label: this.text("common.done"),
      color: this.activity === "mowing" ? "var(--success-color, #4caf50)" : "var(--primary-color)"
    } : battery !== null ? { value: battery, label: this.text("common.battery"), color: this.batteryColor(battery) } : null;
    return b2`
            <div class="gauge-top">
                <div class="ring" style="--value: ${ring?.value ?? 0}; --ring-color: ${ring?.color ?? "var(--primary-color)"}">
                    <div>
                        ${ring ? b2`<b>${this.percent(ring.value)}</b><span>${ring.label}</span>` : b2`<ha-icon icon="mdi:robot-mower"></ha-icon>`}
                    </div>
                </div>
                <div class="info">
                    <button class="name" @click=${() => this.moreInfo(this.config.entity)}>${this.name()}</button>
                    <div class="state ${this.activity}">${this.stateText(mower)}</div>
                    <div class="lines">${this.lines(progress !== null)}</div>
                </div>
            </div>
        `;
  }
  /** The lines under the state in the gauge layout. */
  lines(ringShowsProgress) {
    const lines = [];
    const line = (icon, content, muted = false) => b2`<div class=${muted ? "muted" : ""}><ha-icon icon=${icon}></ha-icon><span>${content}</span></div>`;
    const battery = this.slotState("battery") ? this.format("battery") : null;
    const elapsed = this.duration(minutesOf(this.slotState("elapsed")));
    if (this.activity === "mowing") {
      const left = this.duration(minutesOf(this.slotState("time_left")));
      if (left) {
        lines.push(line("mdi:timer-sand", this.text("common.time_left", { time: left })));
      }
      if (battery && ringShowsProgress) {
        lines.push(
          line(
            "mdi:battery-outline",
            elapsed ? this.text("common.battery_elapsed", { battery, elapsed }) : this.text("common.battery_value", { battery }),
            true
          )
        );
      } else if (elapsed) {
        lines.push(line("mdi:timer-outline", this.text("common.elapsed", { elapsed }), true));
      }
    } else if (hasTask(this.activity)) {
      if (battery && ringShowsProgress) {
        lines.push(line(this.batteryIcon(), this.text("common.battery_value", { battery })));
      }
    } else {
      const mowed = this.lastMowedText();
      if (mowed) {
        lines.push(line("mdi:history", mowed));
      }
    }
    if (this.slotState("mileage") && this.activity !== "mowing") {
      lines.push(line("mdi:map-marker-distance", this.text("common.mileage", { value: this.format("mileage") }), true));
    }
    return lines;
  }
  /** With a picture: the picture, and the state large beside it with the battery and the task under it. */
  pictureLayout(mower) {
    const task = hasTask(this.activity);
    const progress = task ? numberOf(this.slotState("progress")) : null;
    const left = this.activity === "mowing" ? this.duration(minutesOf(this.slotState("time_left"))) : null;
    const elapsed = this.duration(minutesOf(this.slotState("elapsed")));
    const below = progress !== null ? elapsed && this.activity === "mowing" ? this.text("common.progress_elapsed", { progress: this.percent(progress), elapsed }) : this.text("common.progress_done", { progress: this.percent(progress) }) : task ? null : this.lastMowedText();
    return b2`
            <div class="picture-top">
                <button class="picture ${this.pictureClass()}" @click=${() => this.moreInfo(this.config.entity)}>
                    <img src=${this.picture} alt=${this.name()} @load=${this.pictureLoaded} @error=${this.pictureFailed} />
                </button>
                <div class="info">
                    <div class="big-state ${this.activity}">${this.stateText(mower, false)}</div>
                    <div class="sub">
                        ${this.slotState("battery") ? b2`<span
                                      ><ha-icon
                                          class="battery ${this.batteryIcon().includes("charging") ? "charging" : ""}"
                                          icon=${this.batteryIcon()}
                                      ></ha-icon
                                      >${this.format("battery")}${this.chargingNote()}</span
                                  >` : A}
                        ${left ? b2`<span><ha-icon icon="mdi:timer-sand"></ha-icon>${this.text("common.time_left", { time: left })}</span>` : A}
                    </div>
                    ${progress !== null ? b2`<div class="bar ${this.activity}"><i style="width: ${Math.min(100, Math.max(0, progress))}%"></i></div>` : A}
                    ${below ? b2`<div class="below">${below}</div>` : A}
                </div>
            </div>
        `;
  }
  footer() {
    return b2`<div class="footer">
            <button class="footer-name" @click=${() => this.moreInfo(this.config.entity)}>${this.name()}</button>
            ${this.slotState("mileage") && this.activity !== "mowing" ? b2`<span>${this.text("common.mileage", { value: this.format("mileage") })}</span>` : A}
        </div>`;
  }
  /** What is wrong, as chips. The selected one's text opens under them; selecting it again closes it. */
  chips() {
    if (!this.notices.length) {
      return A;
    }
    const open = this.notices.find((notice) => notice.id === this.selected);
    return b2`
            <div class="chips">
                ${this.notices.map(
      (notice) => b2`
                        <button
                            class="chip ${notice.level} ${notice.id === this.selected ? "selected" : ""}"
                            aria-expanded=${notice.id === this.selected}
                            @click=${() => this.selected = notice.id === this.selected ? null : notice.id}
                        >
                            <ha-icon icon=${NOTICE_ICONS[notice.id]}></ha-icon>${this.chipLabel(notice)}
                        </button>
                    `
    )}
            </div>
            ${open ? b2`<div class="detail ${open.level}">
                          <span>${this.chipText(open)}</span>
                          ${this.dismissible(open) ? b2`<button class="dismiss" @click=${() => this.dismiss(open)}>${this.text("notice.dismiss")}</button>` : A}
                      </div>` : A}
        `;
  }
  /**
   * An error the mower is past but its sensor still reports, as Mammotion's low battery while it charges. One the
   * mower is still in stays. The dismissal is kept by the error's time.
   */
  dismissible(notice) {
    return notice.id === "error" && !!notice.values.time && this.activity !== "error";
  }
  dismiss(notice) {
    const entityId = this.config.entity;
    this.dismissals = new Map(this.dismissals).set(entityId, Number(notice.values.time));
    try {
      localStorage.setItem(`mower-status-card.dismissed.${entityId}`, notice.values.time);
    } catch {
    }
  }
  chipLabel(notice) {
    return this.text(`notice.${notice.id}`, notice.values);
  }
  chipText(notice) {
    const values = notice.values;
    switch (notice.id) {
      case "error": {
        if (!values.text) {
          return this.text("notice.error_generic");
        }
        if (!values.time) {
          return values.text;
        }
        const when = this.whenText(Number(values.time));
        return this.text("notice.error_text", {
          when: when.charAt(0).toLocaleUpperCase(this.language()) + when.slice(1),
          text: values.text
        });
      }
      case "positioning":
        return [
          values.generic ? this.text("notice.positioning_generic") : "",
          values.rtk ? this.text("notice.positioning_rtk", { state: values.rtk }) : "",
          values.vision ? this.text("notice.positioning_vision") : "",
          values.satellites ? this.text("notice.positioning_satellites", { count: values.satellites }) : ""
        ].filter(Boolean).join(" ");
      default:
        return this.text(`notice.${notice.id}_text`, values);
    }
  }
  /** The big button, then Cancel and Dock as icons. A button the mower can't use is left out, one it can't use now is greyed. */
  buttons(mower) {
    const unavailable = this.activity === "unavailable";
    const features = Number(mower.attributes.supported_features ?? 0);
    const main = mainAction(this.activity, features);
    const mainParts = {
      pause: { icon: "mdi:pause", enabled: !!(features & FEATURE_PAUSE) },
      dock: { icon: "mdi:home-import-outline", enabled: true },
      continue: { icon: "mdi:play-pause", enabled: !!this.slots.continue || !!(features & FEATURE_START_MOWING) },
      start: { icon: "mdi:play", enabled: !!(features & FEATURE_START_MOWING) }
    }[main];
    return b2`
            <div class="buttons">
                <button class="button main ${main}" ?disabled=${unavailable || !mainParts.enabled} @click=${() => this.main(main)}>
                    <ha-icon icon=${mainParts.icon}></ha-icon>${this.text(this.mainLabel(main))}
                </button>
                ${this.config.show_cancel === false ? A : this.slots.cancel ? this.stopButton(
      "cancel",
      unavailable,
      () => this.perform("button.press", this.slots.cancel, { text: this.text("action.cancel_confirm") })
    ) : features & FEATURE_STOP ? this.stopButton(
      "stop",
      unavailable,
      () => this.perform("lawn_mower.stop", this.config.entity, { text: this.text("action.stop_confirm") })
    ) : A}
                ${features & FEATURE_DOCK && main !== "dock" ? b2`<button
                              class="button icon"
                              title=${this.text("action.dock")}
                              aria-label=${this.text("action.dock")}
                              ?disabled=${unavailable || this.activity === "docked" || this.charging()}
                              @click=${() => this.perform("lawn_mower.dock", this.config.entity)}
                          >
                              <ha-icon icon="mdi:home-import-outline"></ha-icon>
                          </button>` : A}
            </div>
        `;
  }
  /**
   * Cancel, through the integration's own cancel button, or Home Assistant's stop for a mower that has no such button.
   * Either asks first, and only while a task is under way.
   */
  stopButton(kind, unavailable, press) {
    return b2`<button
            class="button icon"
            title=${this.text(`action.${kind}`)}
            aria-label=${this.text(`action.${kind}`)}
            ?disabled=${unavailable || !hasTask(this.activity)}
            @click=${press}
        >
            <ha-icon icon="mdi:stop"></ha-icon>
        </button>`;
  }
  /** A mower with a continue button of its own works in tasks, as Mammotion's do. Any other just mows. */
  mainLabel(action) {
    return action === "pause" || action === "dock" || this.slots.continue ? `action.${action}` : `action.${action}_mowing`;
  }
  main(action) {
    const mower = this.config.entity;
    if (action === "pause") {
      this.perform("lawn_mower.pause", mower);
    } else if (action === "dock") {
      this.perform("lawn_mower.dock", mower);
    } else if (action === "continue" && this.slots.continue) {
      this.perform("button.press", this.slots.continue);
    } else {
      this.perform("lawn_mower.start_mowing", mower);
    }
  }
  /** Through Home Assistant's own action handling, so a confirmation is its own dialog. */
  perform(service, entityId, confirmation) {
    const tapAction = { action: "perform-action", perform_action: service, target: { entity_id: entityId } };
    if (confirmation) {
      tapAction.confirmation = confirmation;
    }
    this.dispatchEvent(
      new CustomEvent("hass-action", {
        detail: { config: { entity: entityId, tap_action: tapAction }, action: "tap" },
        bubbles: true,
        composed: true
      })
    );
  }
  /**
   * The picture, the first of these that hasn't failed: the card's own, the integration's picture entity, the mower
   * entity's own, and Mammotion's model pictures when ha-mammotion-assets is there. An image entity's state says
   * nothing of its picture (Sunseeker's stays unknown whether there is one or not), so a picture is known to work only
   * once it loads.
   */
  findPicture(mower) {
    const config = this.config;
    const device = this.device();
    const platform = platformOf(this.hass, config.entity);
    const own = [
      config.image,
      this.slotState("picture")?.attributes.entity_picture,
      mower?.attributes.entity_picture
    ].filter((url) => !!url);
    const key = [config.show_image, ...own, config.image_variant, platform, device?.name].join("|");
    if (key === this.pictureKey) {
      return;
    }
    this.pictureKey = key;
    if (config.show_image === false) {
      this.picture = null;
      return;
    }
    const usable = (url) => !this.failedPictures.has(pictureAddress(url));
    const first = own.findIndex(usable);
    own.slice(0, first === -1 ? own.length : first).forEach((url) => this.retryPicture(url, key));
    if (first !== -1) {
      this.picture = own[first];
      return;
    }
    const models = (platform === "mammotion" ? mammotionPictures(device?.name, config.image_variant) : []).filter(usable);
    if (!isModelPicture(this.picture)) {
      this.picture = null;
    }
    void (async () => {
      for (const url of models) {
        if (await pictureExists(url)) {
          if (this.pictureKey === key && (this.picture === null || isModelPicture(this.picture))) {
            this.picture = url;
          }
          return;
        }
      }
      if (this.pictureKey === key && isModelPicture(this.picture)) {
        this.picture = null;
      }
    })();
  }
  /** Loads a failed picture again in the background, and searches again once it loads, as it goes ahead of what is shown. */
  retryPicture(url, key) {
    const probe = new Image();
    probe.onload = () => {
      if (this.pictureKey === key) {
        this.failedPictures.delete(pictureAddress(url));
        this.pictureKey = void 0;
        this.requestUpdate();
      }
    };
    probe.src = url;
  }
  pictureClass() {
    if (isModelPicture(this.picture)) {
      return "model";
    }
    return this.framedPictures.has(pictureAddress(this.picture)) ? "own framed" : "own";
  }
  /** Reads when the mower last started and stopped mowing, whenever its state changes. */
  readHistory(mower) {
    if (!mower || !this.hass) {
      return;
    }
    const entityId = this.config.entity;
    const key = `${entityId}|${mower.state}|${mower.last_changed}|${platformOf(this.hass, entityId) ?? ""}`;
    if (key === this.historyKey) {
      return;
    }
    if (!this.historyKey?.startsWith(`${entityId}|`)) {
      this.lastMowed = void 0;
      this.lastStart = null;
    }
    this.historyKey = key;
    const preset = this.preset;
    const activity = this.activity;
    this.hass.callWS({
      type: "history/history_during_period",
      start_time: new Date(Date.now() - HISTORY_DAYS * 864e5).toISOString(),
      entity_ids: [entityId],
      minimal_response: true,
      no_attributes: true,
      significant_changes_only: false
    }).then(
      (history) => {
        if (this.historyKey !== key) {
          return;
        }
        const rows = (history[entityId] ?? []).map((row) => ({ ...row, s: activityOf(preset, row.s) }));
        if (!rows.length) {
          this.lastMowed = void 0;
          this.lastStart = null;
          return;
        }
        if (rows[rows.length - 1].s !== activity) {
          rows.push({ s: activity, lu: Date.parse(mower.last_changed) / 1e3 });
        }
        const end = lastMowingEnd(rows);
        this.lastMowed = end === null ? { since: rows[0].lu * 1e3 } : { end };
        this.lastStart = lastMowingStart(rows);
      },
      () => {
        if (this.historyKey === key) {
          this.lastMowed = void 0;
          this.lastStart = null;
        }
      }
    );
  }
  /** When it last mowed, or how long the history goes back without a mowing in it, so a shorter history isn't overstated. */
  lastMowedText() {
    if (!this.lastMowed) {
      return null;
    }
    if ("end" in this.lastMowed) {
      return this.markup("common.last_mowed", { when: this.whenMarkup(this.lastMowed.end) });
    }
    const days = Math.floor((Date.now() - this.lastMowed.since) / 864e5);
    return days >= 2 ? this.text("common.last_mowed_long_ago", { days: String(days) }) : null;
  }
  /** A moment as its day ("tänään", "ke 14.10.") and its time ("klo 15.18"), in the viewer's language. */
  whenParts(time) {
    const timeZone = this.timeZone();
    const dayNumber = (value) => {
      const parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(
        value
      );
      const part = (type) => Number(parts.find((entry) => entry.type === type)?.value);
      return Date.UTC(part("year"), part("month") - 1, part("day")) / 864e5;
    };
    const format = this.hass?.locale?.time_format;
    const hour12 = format === "12" ? true : format === "24" ? false : format === "system" ? new Intl.DateTimeFormat(void 0, { hour: "numeric" }).resolvedOptions().hour12 : void 0;
    const clock = new Intl.DateTimeFormat(this.language(), { timeZone, hour: "numeric", minute: "2-digit", hour12 }).format(time);
    const daysAgo = dayNumber(Date.now()) - dayNumber(time);
    const day = daysAgo === 0 ? this.text("when.today") : daysAgo === 1 ? this.text("when.yesterday") : new Intl.DateTimeFormat(this.language(), { timeZone, weekday: "short", day: "numeric", month: "numeric" }).format(time);
    return { day, time: this.text("when.time", { clock }) };
  }
  whenText(time) {
    return this.text("when.format", this.whenParts(time));
  }
  /**
   * The day and the time each stay whole, and the two together move to a line of their own before they part:
   * "Leikkasi viimeksi" / "ke 14.10. klo 15.18", and only then "ke 14.10." / "klo 15.18".
   */
  whenMarkup(time) {
    const { day, time: clock } = this.whenParts(time);
    return b2`<span class="when"
            >${this.markup("when.format", { day: b2`<span class="whole">${day}</span>`, time: b2`<span class="whole">${clock}</span>` })}</span
        >`;
  }
  /** "46 %" in Finnish, "46%" in English: each language's own way, as Home Assistant writes the battery. */
  percent(value) {
    return new Intl.NumberFormat(this.language(), { style: "percent", maximumFractionDigits: 0 }).format(value / 100);
  }
  duration(minutes) {
    if (minutes === null || minutes <= 0) {
      return null;
    }
    const total = Math.round(minutes);
    return total < 60 ? this.text("duration.minutes", { minutes: String(total) }) : this.text("duration.hours", { hours: String(Math.floor(total / 60)), minutes: String(total % 60) });
  }
  /** The mower's state in words, with a note on charging unless left out. */
  stateText(mower, withCharging = true) {
    const text = mower.state === "unavailable" ? this.text("common.unavailable") : this.stateWord(mower);
    return withCharging ? `${text}${this.chargingNote()}` : text;
  }
  stateWord(mower) {
    const preset = this.preset;
    if (preset?.states?.[mower.state] && !preset.plainStates?.includes(mower.state)) {
      return this.hass.formatEntityState(mower);
    }
    return translateOwn(this.language(), `state.${this.activity}`) ?? (this.hass.localize(`component.lawn_mower.entity_component._.state.${this.activity}`) || this.hass.formatEntityState(mower));
  }
  /** A mowing or returning mower isn't charging, whatever a lagging charging sensor says. Without a sensor, the preset's states tell. */
  charging() {
    if (this.activity === "mowing" || this.activity === "returning") {
      return false;
    }
    return this.slotState("charging")?.state === "on" || this.chargingByState();
  }
  chargingByState() {
    return !!this.preset?.chargingStates?.includes(this.hass?.states[this.config.entity]?.state ?? "");
  }
  /** ", lataa" after a state or a battery, unless the state itself already says so, as Sunseeker's "Lataa" does. */
  chargingNote() {
    return this.charging() && !this.chargingByState() ? `, ${this.text("common.charging")}` : "";
  }
  batteryIcon() {
    const level = numberOf(this.slotState("battery"));
    if (level === null) {
      return "mdi:battery-unknown";
    }
    const step = Math.round(level / 10) * 10;
    if (this.charging()) {
      return step >= 100 ? "mdi:battery-charging-100" : `mdi:battery-charging-${Math.max(10, step)}`;
    }
    return step >= 100 ? "mdi:battery" : step < 10 ? "mdi:battery-outline" : `mdi:battery-${step}`;
  }
  batteryColor(level) {
    if (level < 15) {
      return "var(--error-color, #db4437)";
    }
    return level < 30 ? "var(--warning-color, #ffa600)" : "var(--primary-color)";
  }
  /** A slot's state with its unit, in the user's number format. */
  format(slot) {
    return this.hass.formatEntityState(this.slotState(slot));
  }
  name() {
    const device = this.device();
    return this.config?.name || device?.name_by_user || device?.name || String(this.hass?.states[this.config.entity]?.attributes.friendly_name ?? this.config.entity);
  }
  device() {
    const deviceId = this.hass?.entities?.[this.config.entity]?.device_id;
    return deviceId ? this.hass?.devices?.[deviceId] : void 0;
  }
  slotState(slot) {
    const id = this.slots[slot];
    return id ? this.hass?.states[id] : void 0;
  }
  slotStates() {
    return Object.fromEntries(
      Object.keys(this.slots).map((slot) => [slot, this.slotState(slot)]).filter(([, entity]) => !!entity)
    );
  }
  moreInfo(entityId) {
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
  timeZone() {
    return this.hass?.locale?.time_zone === "server" ? this.hass.config?.time_zone : void 0;
  }
  /** A text in the viewer's language, with `{name}` in it replaced, so a translation can put the value where it reads right. */
  text(key, values = {}) {
    return translate(this.language(), key).replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }
  /** Like text(), with markup in place of `{name}`. */
  markup(key, values) {
    const parts = translate(this.language(), key).split(/\{(\w+)\}/);
    return b2`${parts.map((part, index) => index % 2 ? values[part] ?? `{${part}}` : part)}`;
  }
  language() {
    return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
  }
  static get styles() {
    return [
      i`
                /* A column, so that with a height of its own the mower's status, the buttons and the footer stay put and the
               notices between them scroll. */
                ha-card {
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    container-type: inline-size;
                    padding: 14px;
                    font-variant-numeric: tabular-nums;
                }

                button {
                    font: inherit;
                    color: inherit;
                    background: none;
                    border: 0;
                    padding: 0;
                    cursor: pointer;
                    text-align: inherit;
                }

                ha-icon {
                    --mdc-icon-size: 16px;
                    flex: none;
                }

                .message {
                    padding: 8px 2px;
                    color: var(--secondary-text-color);
                }

                .info {
                    min-width: 0;
                }

                .name {
                    display: block;
                    font-size: 17px;
                    font-weight: 500;
                    line-height: 1.3;
                    overflow-wrap: anywhere;
                }

                .state {
                    color: var(--secondary-text-color);
                }

                .state.mowing,
                .big-state.mowing {
                    color: var(--success-color, #4caf50);
                }

                .state.error,
                .big-state.error {
                    color: var(--error-color, #db4437);
                }

                /* The gauge layout. */
                .gauge-top {
                    flex: none;
                    display: flex;
                    gap: 14px;
                    align-items: center;
                }

                .ring {
                    --size: 92px;
                    width: var(--size);
                    height: var(--size);
                    flex: none;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    background: conic-gradient(var(--ring-color) calc(var(--value) * 1%), var(--secondary-background-color) 0);
                }

                .ring > div {
                    width: calc(var(--size) - 16px);
                    height: calc(var(--size) - 16px);
                    border-radius: 50%;
                    background: var(--ha-card-background, var(--card-background-color));
                    display: grid;
                    place-content: center;
                    text-align: center;
                }

                .ring b {
                    display: block;
                    font-size: 20px;
                    font-weight: 500;
                }

                .ring span {
                    font-size: 11px;
                    color: var(--secondary-text-color);
                }

                .ring ha-icon {
                    --mdc-icon-size: 32px;
                    color: var(--secondary-text-color);
                }

                .lines {
                    margin-top: 6px;
                    font-size: 13px;
                }

                .lines div {
                    display: flex;
                    gap: 6px;
                    align-items: flex-start;
                }

                .when {
                    display: inline-block;
                }

                .whole {
                    white-space: nowrap;
                }

                .lines ha-icon,
                .muted {
                    color: var(--secondary-text-color);
                }

                /* The picture layout. */
                .picture-top {
                    flex: none;
                    display: grid;
                    grid-template-columns: 120px minmax(0, 1fr);
                    gap: 12px;
                    align-items: center;
                }

                .picture {
                    width: 120px;
                    height: 96px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Mammotion's model pictures have transparent margins of their own, so they fill a framed box. A cut-out of the
               mower's own gets the same box, with room around it. */
                .picture.model,
                .picture.framed {
                    border-radius: 10px;
                    overflow: hidden;
                    background: radial-gradient(circle at 50% 60%, var(--divider-color), var(--secondary-background-color));
                }

                .picture.model img {
                    width: 128px;
                    margin-top: 8px;
                }

                /* Any other picture is shown whole, with no frame, as it may well have a background of its own. The rounded
               corners are the picture's own, and it sits in the middle of its box. */
                .picture.own img {
                    max-width: 100%;
                    max-height: 100%;
                    border-radius: 10px;
                }

                .picture.framed img {
                    max-width: 100px;
                    max-height: 76px;
                    border-radius: 0;
                }

                .unavailable .picture img {
                    filter: grayscale(1) brightness(0.75);
                }

                /* A long state breaks where the language hyphenates it, never at any letter. */
                .big-state {
                    font-size: 22px;
                    font-weight: 500;
                    line-height: 1.2;
                    hyphens: auto;
                    overflow-wrap: break-word;
                }

                .sub {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px 12px;
                    margin-top: 4px;
                    font-size: 13px;
                }

                .sub span {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                /* An upright battery is drawn 4 px inside its 16 px icon, and with its charging bolt 1 px, so the drawn battery is
               pulled into line with the texts under it, about 5 px from its number. */
                .sub ha-icon.battery {
                    margin: 0 -3px 0 -4px;
                }

                .sub ha-icon.battery.charging {
                    margin: 0 0 0 -1px;
                }

                .bar {
                    height: 6px;
                    margin-top: 8px;
                    border-radius: 3px;
                    overflow: hidden;
                    background: var(--secondary-background-color);
                }

                .bar i {
                    display: block;
                    height: 100%;
                    border-radius: 3px;
                    background: var(--primary-color);
                }

                .bar.mowing i {
                    background: var(--success-color, #4caf50);
                }

                .below {
                    margin-top: 4px;
                    font-size: 12px;
                    color: var(--secondary-text-color);
                }

                /* The name takes the room the distance leaves, so a long one, such as a device's serial number, wraps rather than
               the distance. */
                .footer-name {
                    flex: 1 1 0;
                    min-width: 0;
                    overflow-wrap: anywhere;
                }

                .footer {
                    flex: none;
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                    font-size: 12px;
                    color: var(--secondary-text-color);
                }

                /*
                 * Notices. The padding, taken back by the margin, keeps a focused chip's or button's outline clear of the
                 * scrolling sides and bottom. None at the top, where it would lie over the picture or ring above and take its taps.
                 */
                .notices {
                    flex: 1 1 auto;
                    min-height: 0;
                    overflow-y: auto;
                    overscroll-behavior: contain;
                    scrollbar-width: thin;
                    margin: 0 -4px -4px;
                    padding: 0 4px 4px;
                }

                .chips {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 12px;
                }

                .chip {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    padding: 4px 10px;
                    border: 1px solid transparent;
                    border-radius: 999px;
                    font-size: 12px;
                    color: var(--notice);
                    background: color-mix(in srgb, var(--notice) 18%, transparent);
                }

                .chip.selected {
                    border-color: currentColor;
                }

                .chip.red,
                .detail.red {
                    --notice: var(--error-color, #db4437);
                }

                .chip.amber,
                .detail.amber {
                    --notice: var(--warning-color, #ffa600);
                }

                .chip.blue,
                .detail.blue {
                    --notice: var(--info-color, #039be5);
                }

                /* An integration's error can come in steps, one per line. */
                .detail {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: baseline;
                    gap: 6px 12px;
                    white-space: pre-line;
                    margin-top: 8px;
                    padding: 9px 11px;
                    border-radius: 8px;
                    font-size: 13px;
                    background: color-mix(in srgb, var(--notice) 15%, transparent);
                    overflow-wrap: anywhere;
                }

                /* Beside a text short enough to share its line, else on a line of its own, at the right either way. */
                .dismiss {
                    margin-left: auto;
                    padding: 2px 10px;
                    border: 1px solid currentColor;
                    border-radius: 999px;
                    font-size: 12px;
                    color: var(--notice);
                }

                /* Buttons. */
                .buttons {
                    flex: none;
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }

                .button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    min-height: 44px;
                    padding: 0 12px;
                    border-radius: 10px;
                    background: var(--secondary-background-color);
                }

                .button ha-icon {
                    --mdc-icon-size: 20px;
                }

                .button.main {
                    flex: 1;
                    min-width: 0;
                    background: var(--primary-color);
                    color: var(--text-primary-color, #fff);
                    font-weight: 500;
                }

                .button.main.pause {
                    background: var(--success-color, #4caf50);
                }

                .button.icon {
                    width: 46px;
                    padding: 0;
                }

                .button:disabled {
                    opacity: 0.35;
                    cursor: default;
                }

                /* A narrow card: smaller ring and picture, so the texts keep their room, and the main button on a row of its own. */
                @container (max-width: 300px) {
                    .buttons {
                        flex-wrap: wrap;
                    }

                    .button.main {
                        flex-basis: 100%;
                    }

                    .button.icon {
                        flex: 1;
                    }

                    .ring {
                        --size: 76px;
                    }

                    .ring b {
                        font-size: 17px;
                    }

                    .picture-top {
                        grid-template-columns: 72px minmax(0, 1fr);
                        gap: 10px;
                    }

                    .picture {
                        width: 72px;
                        height: 64px;
                    }

                    .picture.model img {
                        width: 80px;
                    }

                    .picture.framed img {
                        max-width: 60px;
                        max-height: 52px;
                    }

                    .big-state {
                        font-size: 17px;
                    }
                }

                /* A very narrow card, a half of a phone's section: the ring or the picture on top, the texts below it at full width. */
                @container (max-width: 220px) {
                    .gauge-top {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }

                    .picture-top {
                        grid-template-columns: minmax(0, 1fr);
                    }

                    /* Too narrow for the name and the distance side by side without breaking the name inside its words. */
                    .footer {
                        flex-direction: column;
                        gap: 2px;
                    }

                    .button.main ha-icon {
                        display: none;
                    }
                }
            `,
      fadeStyles
    ];
  }
};
__decorateClass([
  n4({ attribute: false })
], MowerStatusCard.prototype, "hass", 2);
__decorateClass([
  n4({ attribute: false })
], MowerStatusCard.prototype, "layout", 2);
__decorateClass([
  r5()
], MowerStatusCard.prototype, "config", 2);
__decorateClass([
  r5()
], MowerStatusCard.prototype, "selected", 2);
__decorateClass([
  r5()
], MowerStatusCard.prototype, "picture", 2);
__decorateClass([
  r5()
], MowerStatusCard.prototype, "framedPictures", 2);
__decorateClass([
  r5()
], MowerStatusCard.prototype, "lastMowed", 2);
__decorateClass([
  r5()
], MowerStatusCard.prototype, "lastStart", 2);
__decorateClass([
  r5()
], MowerStatusCard.prototype, "dismissals", 2);
MowerStatusCard = __decorateClass([
  t3("mower-status-card")
], MowerStatusCard);
var NOTICE_ICONS = {
  error: "mdi:alert-circle-outline",
  positioning: "mdi:crosshairs-question",
  blade: "mdi:saw-blade",
  rain: "mdi:weather-pouring",
  update: "mdi:update"
};
function pictureAddress(url) {
  try {
    const address = new URL(url, document.baseURI);
    return address.origin === location.origin ? address.pathname : `${address.origin}${address.pathname}`;
  } catch {
    return url.split(/[?#]/)[0];
  }
}
function isModelPicture(url) {
  return !!url?.startsWith(MAMMOTION_ASSETS);
}
function hasTransparentCorners(img) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 8;
    const context = canvas.getContext("2d");
    if (!context) {
      return false;
    }
    context.drawImage(img, 0, 0, 8, 8);
    const { data } = context.getImageData(0, 0, 8, 8);
    return [0, 7, 56, 63].every((pixel) => data[pixel * 4 + 3] < 128);
  } catch {
    return false;
  }
}
export {
  MowerStatusCard
};
