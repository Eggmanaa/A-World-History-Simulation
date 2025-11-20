var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-vdXt6z/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// _worker.js
var __defProp2 = Object.defineProperty;
var __typeError = /* @__PURE__ */ __name((msg) => {
  throw TypeError(msg);
}, "__typeError");
var __defNormalProp = /* @__PURE__ */ __name((obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value, "__defNormalProp");
var __publicField = /* @__PURE__ */ __name((obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value), "__publicField");
var __accessCheck = /* @__PURE__ */ __name((obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg), "__accessCheck");
var __privateGet = /* @__PURE__ */ __name((obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj)), "__privateGet");
var __privateAdd = /* @__PURE__ */ __name((obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value), "__privateAdd");
var __privateSet = /* @__PURE__ */ __name((obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value), "__privateSet");
var __privateMethod = /* @__PURE__ */ __name((obj, member, method) => (__accessCheck(obj, member, "access private method"), method), "__privateMethod");
var __privateWrapper = /* @__PURE__ */ __name((obj, member, setter, getter) => ({
  set _(value) {
    __privateSet(obj, member, value, setter);
  },
  get _() {
    return __privateGet(obj, member, getter);
  }
}), "__privateWrapper");
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");
var GET_MATCH_RESULT = Symbol();
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ?? (encoded = /[%+]/.test(url));
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ?? (results[name] = value);
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var _validatedData;
var _matchResult;
var _HonoRequest_instances;
var getDecodedParam_fn;
var getAllDecodedParams_fn;
var getParamValue_fn;
var _cachedBody;
var _a;
var HonoRequest = (_a = class {
  static {
    __name(this, "_a");
  }
  constructor(request, path = "/", matchResult = [[]]) {
    __privateAdd(this, _HonoRequest_instances);
    __publicField(this, "raw");
    __privateAdd(this, _validatedData);
    __privateAdd(this, _matchResult);
    __publicField(this, "routeIndex", 0);
    __publicField(this, "path");
    __publicField(this, "bodyCache", {});
    __privateAdd(this, _cachedBody, (key) => {
      const { bodyCache, raw: raw2 } = this;
      const cachedBody = bodyCache[key];
      if (cachedBody) {
        return cachedBody;
      }
      const anyCachedKey = Object.keys(bodyCache)[0];
      if (anyCachedKey) {
        return bodyCache[anyCachedKey].then((body) => {
          if (anyCachedKey === "json") {
            body = JSON.stringify(body);
          }
          return new Response(body)[key]();
        });
      }
      return bodyCache[key] = raw2[key]();
    });
    this.raw = request;
    this.path = path;
    __privateSet(this, _matchResult, matchResult);
    __privateSet(this, _validatedData, {});
  }
  param(key) {
    return key ? __privateMethod(this, _HonoRequest_instances, getDecodedParam_fn).call(this, key) : __privateMethod(this, _HonoRequest_instances, getAllDecodedParams_fn).call(this);
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    var _a10;
    return (_a10 = this.bodyCache).parsedBody ?? (_a10.parsedBody = await parseBody(this, options));
  }
  json() {
    return __privateGet(this, _cachedBody).call(this, "text").then((text) => JSON.parse(text));
  }
  text() {
    return __privateGet(this, _cachedBody).call(this, "text");
  }
  arrayBuffer() {
    return __privateGet(this, _cachedBody).call(this, "arrayBuffer");
  }
  blob() {
    return __privateGet(this, _cachedBody).call(this, "blob");
  }
  formData() {
    return __privateGet(this, _cachedBody).call(this, "formData");
  }
  addValidatedData(target, data) {
    __privateGet(this, _validatedData)[target] = data;
  }
  valid(target) {
    return __privateGet(this, _validatedData)[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return __privateGet(this, _matchResult);
  }
  get matchedRoutes() {
    return __privateGet(this, _matchResult)[0].map(([[, route]]) => route);
  }
  get routePath() {
    return __privateGet(this, _matchResult)[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, _validatedData = /* @__PURE__ */ new WeakMap(), _matchResult = /* @__PURE__ */ new WeakMap(), _HonoRequest_instances = /* @__PURE__ */ new WeakSet(), getDecodedParam_fn = /* @__PURE__ */ __name(function(key) {
  const paramKey = __privateGet(this, _matchResult)[0][this.routeIndex][1][key];
  const param = __privateMethod(this, _HonoRequest_instances, getParamValue_fn).call(this, paramKey);
  return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
}, "getDecodedParam_fn"), getAllDecodedParams_fn = /* @__PURE__ */ __name(function() {
  const decoded = {};
  const keys = Object.keys(__privateGet(this, _matchResult)[0][this.routeIndex][1]);
  for (const key of keys) {
    const value = __privateMethod(this, _HonoRequest_instances, getParamValue_fn).call(this, __privateGet(this, _matchResult)[0][this.routeIndex][1][key]);
    if (value !== void 0) {
      decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
    }
  }
  return decoded;
}, "getAllDecodedParams_fn"), getParamValue_fn = /* @__PURE__ */ __name(function(paramKey) {
  return __privateGet(this, _matchResult)[1] ? __privateGet(this, _matchResult)[1][paramKey] : paramKey;
}, "getParamValue_fn"), _cachedBody = /* @__PURE__ */ new WeakMap(), _a);
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var _rawRequest;
var _req;
var _var;
var _status;
var _executionCtx;
var _res;
var _layout;
var _renderer;
var _notFoundHandler;
var _preparedHeaders;
var _matchResult2;
var _path;
var _Context_instances;
var newResponse_fn;
var _a2;
var Context = (_a2 = class {
  static {
    __name(this, "_a2");
  }
  constructor(req, options) {
    __privateAdd(this, _Context_instances);
    __privateAdd(this, _rawRequest);
    __privateAdd(this, _req);
    __publicField(this, "env", {});
    __privateAdd(this, _var);
    __publicField(this, "finalized", false);
    __publicField(this, "error");
    __privateAdd(this, _status);
    __privateAdd(this, _executionCtx);
    __privateAdd(this, _res);
    __privateAdd(this, _layout);
    __privateAdd(this, _renderer);
    __privateAdd(this, _notFoundHandler);
    __privateAdd(this, _preparedHeaders);
    __privateAdd(this, _matchResult2);
    __privateAdd(this, _path);
    __publicField(this, "render", (...args) => {
      __privateGet(this, _renderer) ?? __privateSet(this, _renderer, (content) => this.html(content));
      return __privateGet(this, _renderer).call(this, ...args);
    });
    __publicField(this, "setLayout", (layout) => __privateSet(this, _layout, layout));
    __publicField(this, "getLayout", () => __privateGet(this, _layout));
    __publicField(this, "setRenderer", (renderer) => {
      __privateSet(this, _renderer, renderer);
    });
    __publicField(this, "header", (name, value, options2) => {
      if (this.finalized) {
        __privateSet(this, _res, new Response(__privateGet(this, _res).body, __privateGet(this, _res)));
      }
      const headers = __privateGet(this, _res) ? __privateGet(this, _res).headers : __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, new Headers());
      if (value === void 0) {
        headers.delete(name);
      } else if (options2?.append) {
        headers.append(name, value);
      } else {
        headers.set(name, value);
      }
    });
    __publicField(this, "status", (status) => {
      __privateSet(this, _status, status);
    });
    __publicField(this, "set", (key, value) => {
      __privateGet(this, _var) ?? __privateSet(this, _var, /* @__PURE__ */ new Map());
      __privateGet(this, _var).set(key, value);
    });
    __publicField(this, "get", (key) => {
      return __privateGet(this, _var) ? __privateGet(this, _var).get(key) : void 0;
    });
    __publicField(this, "newResponse", (...args) => __privateMethod(this, _Context_instances, newResponse_fn).call(this, ...args));
    __publicField(this, "body", (data, arg, headers) => __privateMethod(this, _Context_instances, newResponse_fn).call(this, data, arg, headers));
    __publicField(this, "text", (text, arg, headers) => {
      return !__privateGet(this, _preparedHeaders) && !__privateGet(this, _status) && !arg && !headers && !this.finalized ? new Response(text) : __privateMethod(this, _Context_instances, newResponse_fn).call(this, text, arg, setDefaultContentType(TEXT_PLAIN, headers));
    });
    __publicField(this, "json", (object, arg, headers) => {
      return __privateMethod(this, _Context_instances, newResponse_fn).call(this, JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
    });
    __publicField(this, "html", (html, arg, headers) => {
      const res = /* @__PURE__ */ __name((html2) => __privateMethod(this, _Context_instances, newResponse_fn).call(this, html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
      return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
    });
    __publicField(this, "redirect", (location, status) => {
      const locationString = String(location);
      this.header(
        "Location",
        !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
      );
      return this.newResponse(null, status ?? 302);
    });
    __publicField(this, "notFound", () => {
      __privateGet(this, _notFoundHandler) ?? __privateSet(this, _notFoundHandler, () => new Response());
      return __privateGet(this, _notFoundHandler).call(this, this);
    });
    __privateSet(this, _rawRequest, req);
    if (options) {
      __privateSet(this, _executionCtx, options.executionCtx);
      this.env = options.env;
      __privateSet(this, _notFoundHandler, options.notFoundHandler);
      __privateSet(this, _path, options.path);
      __privateSet(this, _matchResult2, options.matchResult);
    }
  }
  get req() {
    __privateGet(this, _req) ?? __privateSet(this, _req, new HonoRequest(__privateGet(this, _rawRequest), __privateGet(this, _path), __privateGet(this, _matchResult2)));
    return __privateGet(this, _req);
  }
  get event() {
    if (__privateGet(this, _executionCtx) && "respondWith" in __privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (__privateGet(this, _executionCtx)) {
      return __privateGet(this, _executionCtx);
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return __privateGet(this, _res) || __privateSet(this, _res, new Response(null, {
      headers: __privateGet(this, _preparedHeaders) ?? __privateSet(this, _preparedHeaders, new Headers())
    }));
  }
  set res(_res2) {
    if (__privateGet(this, _res) && _res2) {
      _res2 = new Response(_res2.body, _res2);
      for (const [k, v] of __privateGet(this, _res).headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = __privateGet(this, _res).headers.getSetCookie();
          _res2.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res2.headers.append("set-cookie", cookie);
          }
        } else {
          _res2.headers.set(k, v);
        }
      }
    }
    __privateSet(this, _res, _res2);
    this.finalized = true;
  }
  get var() {
    if (!__privateGet(this, _var)) {
      return {};
    }
    return Object.fromEntries(__privateGet(this, _var));
  }
}, _rawRequest = /* @__PURE__ */ new WeakMap(), _req = /* @__PURE__ */ new WeakMap(), _var = /* @__PURE__ */ new WeakMap(), _status = /* @__PURE__ */ new WeakMap(), _executionCtx = /* @__PURE__ */ new WeakMap(), _res = /* @__PURE__ */ new WeakMap(), _layout = /* @__PURE__ */ new WeakMap(), _renderer = /* @__PURE__ */ new WeakMap(), _notFoundHandler = /* @__PURE__ */ new WeakMap(), _preparedHeaders = /* @__PURE__ */ new WeakMap(), _matchResult2 = /* @__PURE__ */ new WeakMap(), _path = /* @__PURE__ */ new WeakMap(), _Context_instances = /* @__PURE__ */ new WeakSet(), newResponse_fn = /* @__PURE__ */ __name(function(data, arg, headers) {
  const responseHeaders = __privateGet(this, _res) ? new Headers(__privateGet(this, _res).headers) : __privateGet(this, _preparedHeaders) ?? new Headers();
  if (typeof arg === "object" && "headers" in arg) {
    const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
    for (const [key, value] of argHeaders) {
      if (key.toLowerCase() === "set-cookie") {
        responseHeaders.append(key, value);
      } else {
        responseHeaders.set(key, value);
      }
    }
  }
  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === "string") {
        responseHeaders.set(k, v);
      } else {
        responseHeaders.delete(k);
        for (const v2 of v) {
          responseHeaders.append(k, v2);
        }
      }
    }
  }
  const status = typeof arg === "number" ? arg : arg?.status ?? __privateGet(this, _status);
  return new Response(data, { status, headers: responseHeaders });
}, "newResponse_fn"), _a2);
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var _path2;
var _Hono_instances;
var clone_fn;
var _notFoundHandler2;
var addRoute_fn;
var handleError_fn;
var dispatch_fn;
var _a3;
var Hono = (_a3 = class {
  static {
    __name(this, "_a3");
  }
  constructor(options = {}) {
    __privateAdd(this, _Hono_instances);
    __publicField(this, "get");
    __publicField(this, "post");
    __publicField(this, "put");
    __publicField(this, "delete");
    __publicField(this, "options");
    __publicField(this, "patch");
    __publicField(this, "all");
    __publicField(this, "on");
    __publicField(this, "use");
    __publicField(this, "router");
    __publicField(this, "getPath");
    __publicField(this, "_basePath", "/");
    __privateAdd(this, _path2, "/");
    __publicField(this, "routes", []);
    __privateAdd(this, _notFoundHandler2, notFoundHandler);
    __publicField(this, "errorHandler", errorHandler);
    __publicField(this, "onError", (handler) => {
      this.errorHandler = handler;
      return this;
    });
    __publicField(this, "notFound", (handler) => {
      __privateSet(this, _notFoundHandler2, handler);
      return this;
    });
    __publicField(this, "fetch", (request, ...rest) => {
      return __privateMethod(this, _Hono_instances, dispatch_fn).call(this, request, rest[1], rest[0], request.method);
    });
    __publicField(this, "request", (input, requestInit, Env, executionCtx) => {
      if (input instanceof Request) {
        return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
      }
      input = input.toString();
      return this.fetch(
        new Request(
          /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
          requestInit
        ),
        Env,
        executionCtx
      );
    });
    __publicField(this, "fire", () => {
      addEventListener("fetch", (event) => {
        event.respondWith(__privateMethod(this, _Hono_instances, dispatch_fn).call(this, event.request, event, void 0, event.request.method));
      });
    });
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          __privateSet(this, _path2, args1);
        } else {
          __privateMethod(this, _Hono_instances, addRoute_fn).call(this, method, __privateGet(this, _path2), args1);
        }
        args.forEach((handler) => {
          __privateMethod(this, _Hono_instances, addRoute_fn).call(this, method, __privateGet(this, _path2), handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        __privateSet(this, _path2, p);
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            __privateMethod(this, _Hono_instances, addRoute_fn).call(this, m.toUpperCase(), __privateGet(this, _path2), handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        __privateSet(this, _path2, arg1);
      } else {
        __privateSet(this, _path2, "*");
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        __privateMethod(this, _Hono_instances, addRoute_fn).call(this, METHOD_NAME_ALL, __privateGet(this, _path2), handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      var _a10;
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      __privateMethod(_a10 = subApp, _Hono_instances, addRoute_fn).call(_a10, r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = __privateMethod(this, _Hono_instances, clone_fn).call(this);
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest || (replaceRequest = (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })());
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    __privateMethod(this, _Hono_instances, addRoute_fn).call(this, METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
}, _path2 = /* @__PURE__ */ new WeakMap(), _Hono_instances = /* @__PURE__ */ new WeakSet(), clone_fn = /* @__PURE__ */ __name(function() {
  const clone = new Hono({
    router: this.router,
    getPath: this.getPath
  });
  clone.errorHandler = this.errorHandler;
  __privateSet(clone, _notFoundHandler2, __privateGet(this, _notFoundHandler2));
  clone.routes = this.routes;
  return clone;
}, "clone_fn"), _notFoundHandler2 = /* @__PURE__ */ new WeakMap(), addRoute_fn = /* @__PURE__ */ __name(function(method, path, handler) {
  method = method.toUpperCase();
  path = mergePath(this._basePath, path);
  const r = { basePath: this._basePath, path, method, handler };
  this.router.add(method, path, [handler, r]);
  this.routes.push(r);
}, "addRoute_fn"), handleError_fn = /* @__PURE__ */ __name(function(err, c) {
  if (err instanceof Error) {
    return this.errorHandler(err, c);
  }
  throw err;
}, "handleError_fn"), dispatch_fn = /* @__PURE__ */ __name(function(request, executionCtx, env, method) {
  if (method === "HEAD") {
    return (async () => new Response(null, await __privateMethod(this, _Hono_instances, dispatch_fn).call(this, request, executionCtx, env, "GET")))();
  }
  const path = this.getPath(request, { env });
  const matchResult = this.router.match(method, path);
  const c = new Context(request, {
    path,
    matchResult,
    env,
    executionCtx,
    notFoundHandler: __privateGet(this, _notFoundHandler2)
  });
  if (matchResult[0].length === 1) {
    let res;
    try {
      res = matchResult[0][0][0][0](c, async () => {
        c.res = await __privateGet(this, _notFoundHandler2).call(this, c);
      });
    } catch (err) {
      return __privateMethod(this, _Hono_instances, handleError_fn).call(this, err, c);
    }
    return res instanceof Promise ? res.then(
      (resolved) => resolved || (c.finalized ? c.res : __privateGet(this, _notFoundHandler2).call(this, c))
    ).catch((err) => __privateMethod(this, _Hono_instances, handleError_fn).call(this, err, c)) : res ?? __privateGet(this, _notFoundHandler2).call(this, c);
  }
  const composed = compose(matchResult[0], this.errorHandler, __privateGet(this, _notFoundHandler2));
  return (async () => {
    try {
      const context = await composed(c);
      if (!context.finalized) {
        throw new Error(
          "Context is not finalized. Did you forget to return a Response object or `await next()`?"
        );
      }
      return context.res;
    } catch (err) {
      return __privateMethod(this, _Hono_instances, handleError_fn).call(this, err, c);
    }
  })();
}, "dispatch_fn"), _a3);
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var _index;
var _varIndex;
var _children;
var _a4;
var Node = (_a4 = class {
  static {
    __name(this, "_a4");
  }
  constructor() {
    __privateAdd(this, _index);
    __privateAdd(this, _varIndex);
    __privateAdd(this, _children, /* @__PURE__ */ Object.create(null));
  }
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (__privateGet(this, _index) !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      __privateSet(this, _index, index);
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = __privateGet(this, _children)[regexpStr];
      if (!node) {
        if (Object.keys(__privateGet(this, _children)).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = __privateGet(this, _children)[regexpStr] = new Node();
        if (name !== "") {
          __privateSet(node, _varIndex, context.varIndex++);
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, __privateGet(node, _varIndex)]);
      }
    } else {
      node = __privateGet(this, _children)[token];
      if (!node) {
        if (Object.keys(__privateGet(this, _children)).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = __privateGet(this, _children)[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(__privateGet(this, _children)).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = __privateGet(this, _children)[k];
      return (typeof __privateGet(c, _varIndex) === "number" ? `(${k})@${__privateGet(c, _varIndex)}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof __privateGet(this, _index) === "number") {
      strList.unshift(`#${__privateGet(this, _index)}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, _index = /* @__PURE__ */ new WeakMap(), _varIndex = /* @__PURE__ */ new WeakMap(), _children = /* @__PURE__ */ new WeakMap(), _a4);
var _context;
var _root;
var _a5;
var Trie = (_a5 = class {
  static {
    __name(this, "_a5");
  }
  constructor() {
    __privateAdd(this, _context, { varIndex: 0 });
    __privateAdd(this, _root, new Node());
  }
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    __privateGet(this, _root).insert(tokens, index, paramAssoc, __privateGet(this, _context), pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = __privateGet(this, _root).buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, _context = /* @__PURE__ */ new WeakMap(), _root = /* @__PURE__ */ new WeakMap(), _a5);
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ?? (wildcardRegExpCache[path] = new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  ));
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var _middleware;
var _routes;
var _RegExpRouter_instances;
var buildMatcher_fn;
var _a6;
var RegExpRouter = (_a6 = class {
  static {
    __name(this, "_a6");
  }
  constructor() {
    __privateAdd(this, _RegExpRouter_instances);
    __publicField(this, "name", "RegExpRouter");
    __privateAdd(this, _middleware);
    __privateAdd(this, _routes);
    __publicField(this, "match", match);
    __privateSet(this, _middleware, { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) });
    __privateSet(this, _routes, { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) });
  }
  add(method, path, handler) {
    var _a10;
    const middleware = __privateGet(this, _middleware);
    const routes = __privateGet(this, _routes);
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          var _a11;
          (_a11 = middleware[m])[path] || (_a11[path] = findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
        });
      } else {
        (_a10 = middleware[method])[path] || (_a10[path] = findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || []);
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        var _a11;
        if (method === METHOD_NAME_ALL || method === m) {
          (_a11 = routes[m])[path2] || (_a11[path2] = [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ]);
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(__privateGet(this, _routes)).concat(Object.keys(__privateGet(this, _middleware))).forEach((method) => {
      matchers[method] || (matchers[method] = __privateMethod(this, _RegExpRouter_instances, buildMatcher_fn).call(this, method));
    });
    __privateSet(this, _middleware, __privateSet(this, _routes, void 0));
    clearWildcardRegExpCache();
    return matchers;
  }
}, _middleware = /* @__PURE__ */ new WeakMap(), _routes = /* @__PURE__ */ new WeakMap(), _RegExpRouter_instances = /* @__PURE__ */ new WeakSet(), buildMatcher_fn = /* @__PURE__ */ __name(function(method) {
  const routes = [];
  let hasOwnRoute = method === METHOD_NAME_ALL;
  [__privateGet(this, _middleware), __privateGet(this, _routes)].forEach((r) => {
    const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
    if (ownRoute.length !== 0) {
      hasOwnRoute || (hasOwnRoute = true);
      routes.push(...ownRoute);
    } else if (method !== METHOD_NAME_ALL) {
      routes.push(
        ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
      );
    }
  });
  if (!hasOwnRoute) {
    return null;
  } else {
    return buildMatcherFromPreprocessedRoutes(routes);
  }
}, "buildMatcher_fn"), _a6);
var _routers;
var _routes2;
var _a7;
var SmartRouter = (_a7 = class {
  static {
    __name(this, "_a7");
  }
  constructor(init) {
    __publicField(this, "name", "SmartRouter");
    __privateAdd(this, _routers, []);
    __privateAdd(this, _routes2, []);
    __privateSet(this, _routers, init.routers);
  }
  add(method, path, handler) {
    if (!__privateGet(this, _routes2)) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    __privateGet(this, _routes2).push([method, path, handler]);
  }
  match(method, path) {
    if (!__privateGet(this, _routes2)) {
      throw new Error("Fatal error");
    }
    const routers = __privateGet(this, _routers);
    const routes = __privateGet(this, _routes2);
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      __privateSet(this, _routers, [router]);
      __privateSet(this, _routes2, void 0);
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (__privateGet(this, _routes2) || __privateGet(this, _routers).length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return __privateGet(this, _routers)[0];
  }
}, _routers = /* @__PURE__ */ new WeakMap(), _routes2 = /* @__PURE__ */ new WeakMap(), _a7);
var emptyParams = /* @__PURE__ */ Object.create(null);
var _methods;
var _children2;
var _patterns;
var _order;
var _params;
var _Node_instances;
var getHandlerSets_fn;
var _a8;
var Node2 = (_a8 = class {
  static {
    __name(this, "_a8");
  }
  constructor(method, handler, children) {
    __privateAdd(this, _Node_instances);
    __privateAdd(this, _methods);
    __privateAdd(this, _children2);
    __privateAdd(this, _patterns);
    __privateAdd(this, _order, 0);
    __privateAdd(this, _params, emptyParams);
    __privateSet(this, _children2, children || /* @__PURE__ */ Object.create(null));
    __privateSet(this, _methods, []);
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      __privateSet(this, _methods, [m]);
    }
    __privateSet(this, _patterns, []);
  }
  insert(method, path, handler) {
    __privateSet(this, _order, ++__privateWrapper(this, _order)._);
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in __privateGet(curNode, _children2)) {
        curNode = __privateGet(curNode, _children2)[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      __privateGet(curNode, _children2)[key] = new Node2();
      if (pattern) {
        __privateGet(curNode, _patterns).push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = __privateGet(curNode, _children2)[key];
    }
    __privateGet(curNode, _methods).push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: __privateGet(this, _order)
      }
    });
    return curNode;
  }
  search(method, path) {
    const handlerSets = [];
    __privateSet(this, _params, emptyParams);
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = __privateGet(node, _children2)[part];
        if (nextNode) {
          __privateSet(nextNode, _params, __privateGet(node, _params));
          if (isLast) {
            if (__privateGet(nextNode, _children2)["*"]) {
              handlerSets.push(
                ...__privateMethod(this, _Node_instances, getHandlerSets_fn).call(this, __privateGet(nextNode, _children2)["*"], method, __privateGet(node, _params))
              );
            }
            handlerSets.push(...__privateMethod(this, _Node_instances, getHandlerSets_fn).call(this, nextNode, method, __privateGet(node, _params)));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = __privateGet(node, _patterns).length; k < len3; k++) {
          const pattern = __privateGet(node, _patterns)[k];
          const params = __privateGet(node, _params) === emptyParams ? {} : { ...__privateGet(node, _params) };
          if (pattern === "*") {
            const astNode = __privateGet(node, _children2)["*"];
            if (astNode) {
              handlerSets.push(...__privateMethod(this, _Node_instances, getHandlerSets_fn).call(this, astNode, method, __privateGet(node, _params)));
              __privateSet(astNode, _params, params);
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = __privateGet(node, _children2)[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...__privateMethod(this, _Node_instances, getHandlerSets_fn).call(this, child, method, __privateGet(node, _params), params));
              if (Object.keys(__privateGet(child, _children2)).length) {
                __privateSet(child, _params, params);
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] || (curNodesQueue[componentCount] = []);
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...__privateMethod(this, _Node_instances, getHandlerSets_fn).call(this, child, method, params, __privateGet(node, _params)));
              if (__privateGet(child, _children2)["*"]) {
                handlerSets.push(
                  ...__privateMethod(this, _Node_instances, getHandlerSets_fn).call(this, __privateGet(child, _children2)["*"], method, params, __privateGet(node, _params))
                );
              }
            } else {
              __privateSet(child, _params, params);
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, _methods = /* @__PURE__ */ new WeakMap(), _children2 = /* @__PURE__ */ new WeakMap(), _patterns = /* @__PURE__ */ new WeakMap(), _order = /* @__PURE__ */ new WeakMap(), _params = /* @__PURE__ */ new WeakMap(), _Node_instances = /* @__PURE__ */ new WeakSet(), getHandlerSets_fn = /* @__PURE__ */ __name(function(node, method, nodeParams, params) {
  const handlerSets = [];
  for (let i = 0, len = __privateGet(node, _methods).length; i < len; i++) {
    const m = __privateGet(node, _methods)[i];
    const handlerSet = m[method] || m[METHOD_NAME_ALL];
    const processedSet = {};
    if (handlerSet !== void 0) {
      handlerSet.params = /* @__PURE__ */ Object.create(null);
      handlerSets.push(handlerSet);
      if (nodeParams !== emptyParams || params && params !== emptyParams) {
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          const processed = processedSet[handlerSet.score];
          handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
          processedSet[handlerSet.score] = true;
        }
      }
    }
  }
  return handlerSets;
}, "getHandlerSets_fn"), _a8);
var _node;
var _a9;
var TrieRouter = (_a9 = class {
  static {
    __name(this, "_a9");
  }
  constructor() {
    __publicField(this, "name", "TrieRouter");
    __privateAdd(this, _node);
    __privateSet(this, _node, new Node2());
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        __privateGet(this, _node).insert(method, results[i], handler);
      }
      return;
    }
    __privateGet(this, _node).insert(method, path, handler);
  }
  match(method, path) {
    return __privateGet(this, _node).search(method, path);
  }
}, _node = /* @__PURE__ */ new WeakMap(), _a9);
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono2");
  }
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hashedPassword) {
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}
__name(verifyPassword, "verifyPassword");
async function generateToken(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify({
    ...payload,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1e3
    // 7 days
  }));
  const encoder = new TextEncoder();
  const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}
__name(generateToken, "generateToken");
async function verifyToken(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Invalid token format");
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const encoder = new TextEncoder();
    const data = encoder.encode(`${encodedHeader}.${encodedPayload}`);
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signature = Uint8Array.from(atob(encodedSignature), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", cryptoKey, signature, data);
    if (!valid) throw new Error("Invalid signature");
    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp && Date.now() > payload.exp) {
      throw new Error("Token expired");
    }
    return payload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}
__name(verifyToken, "verifyToken");
function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
__name(generateInviteCode, "generateInviteCode");
var JWT_SECRET = "your-secret-key-change-in-production";
async function authMiddleware(c, next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  const token = authHeader.substring(7);
  try {
    const payload = await verifyToken(token, JWT_SECRET);
    c.set("user", payload);
    await next();
  } catch (error) {
    return c.json({ message: "Invalid token" }, 401);
  }
}
__name(authMiddleware, "authMiddleware");
async function teacherAuthMiddleware(c, next) {
  await authMiddleware(c, async () => {
    const user = c.get("user");
    if (user.role !== "teacher") {
      return c.json({ message: "Forbidden: Teacher access required" }, 403);
    }
    await next();
  });
}
__name(teacherAuthMiddleware, "teacherAuthMiddleware");
async function studentAuthMiddleware(c, next) {
  await authMiddleware(c, async () => {
    const user = c.get("user");
    if (user.role !== "student") {
      return c.json({ message: "Forbidden: Student access required" }, 403);
    }
    await next();
  });
}
__name(studentAuthMiddleware, "studentAuthMiddleware");
var authRouter = new Hono2();
authRouter.post("/teacher/register", async (c) => {
  try {
    const { name, email, password } = await c.req.json();
    if (!name || !email || !password) {
      return c.json({ message: "All fields are required" }, 400);
    }
    if (password.length < 8) {
      return c.json({ message: "Password must be at least 8 characters" }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM teachers WHERE email = ?"
    ).bind(email).first();
    if (existing) {
      return c.json({ message: "Email already registered" }, 400);
    }
    const hashedPassword = await hashPassword(password);
    const result = await c.env.DB.prepare(
      "INSERT INTO teachers (name, email, password_hash) VALUES (?, ?, ?)"
    ).bind(name, email, hashedPassword).run();
    const token = await generateToken({
      id: result.meta.last_row_id,
      email,
      role: "teacher"
    }, JWT_SECRET);
    return c.json({
      message: "Registration successful",
      token,
      user: { id: result.meta.last_row_id, name, email, role: "teacher" }
    }, 201);
  } catch (error) {
    console.error("Teacher registration error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
authRouter.post("/teacher/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ message: "Email and password are required" }, 400);
    }
    const teacher = await c.env.DB.prepare(
      "SELECT id, name, email, password_hash FROM teachers WHERE email = ?"
    ).bind(email).first();
    if (!teacher) {
      return c.json({ message: "Invalid credentials" }, 401);
    }
    const valid = await verifyPassword(password, teacher.password_hash);
    if (!valid) {
      return c.json({ message: "Invalid credentials" }, 401);
    }
    const token = await generateToken({
      id: teacher.id,
      email: teacher.email,
      role: "teacher"
    }, JWT_SECRET);
    return c.json({
      message: "Login successful",
      token,
      user: { id: teacher.id, name: teacher.name, email: teacher.email, role: "teacher" }
    });
  } catch (error) {
    console.error("Teacher login error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
authRouter.post("/student/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ message: "Username and password are required" }, 400);
    }
    const student = await c.env.DB.prepare(
      "SELECT id, name, username, password_hash, period_id FROM students WHERE username = ?"
    ).bind(username).first();
    if (!student) {
      return c.json({ message: "Invalid credentials" }, 401);
    }
    const valid = await verifyPassword(password, student.password_hash);
    if (!valid) {
      return c.json({ message: "Invalid credentials" }, 401);
    }
    const token = await generateToken({
      id: student.id,
      username: student.username,
      role: "student",
      periodId: student.period_id
    }, JWT_SECRET);
    return c.json({
      message: "Login successful",
      token,
      user: {
        id: student.id,
        name: student.name,
        username: student.username,
        role: "student",
        periodId: student.period_id
      }
    });
  } catch (error) {
    console.error("Student login error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
authRouter.post("/student/join", async (c) => {
  try {
    const { username, name, password, inviteCode } = await c.req.json();
    if (!username || !name || !password || !inviteCode) {
      return c.json({ message: "All fields are required" }, 400);
    }
    if (password.length < 6) {
      return c.json({ message: "Password must be at least 6 characters" }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM students WHERE username = ?"
    ).bind(username).first();
    if (existing) {
      return c.json({ message: "Username already taken" }, 400);
    }
    const invite = await c.env.DB.prepare(`
      SELECT id, teacher_id, period_id, uses_remaining 
      FROM invite_codes 
      WHERE code = ? AND uses_remaining > 0
    `).bind(inviteCode.toUpperCase()).first();
    if (!invite) {
      return c.json({ message: "Invalid or expired invite code" }, 400);
    }
    const hashedPassword = await hashPassword(password);
    const result = await c.env.DB.prepare(`
      INSERT INTO students (name, username, password_hash, teacher_id, period_id) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(name, username, hashedPassword, invite.teacher_id, invite.period_id).run();
    await c.env.DB.prepare(
      "UPDATE invite_codes SET uses_remaining = uses_remaining - 1 WHERE id = ?"
    ).bind(invite.id).run();
    const token = await generateToken({
      id: result.meta.last_row_id,
      username,
      role: "student",
      periodId: invite.period_id
    }, JWT_SECRET);
    return c.json({
      message: "Successfully joined!",
      token,
      user: {
        id: result.meta.last_row_id,
        name,
        username,
        role: "student",
        periodId: invite.period_id
      }
    }, 201);
  } catch (error) {
    console.error("Student join error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
var teacherRouter = new Hono2();
teacherRouter.use("/*", teacherAuthMiddleware);
teacherRouter.get("/dashboard", async (c) => {
  try {
    const user = c.get("user");
    const teacher = await c.env.DB.prepare(
      "SELECT id, name, email FROM teachers WHERE id = ?"
    ).bind(user.id).first();
    const periods = await c.env.DB.prepare(`
      SELECT id, name, start_year, end_year, current_year, created_at 
      FROM periods 
      WHERE teacher_id = ? 
      ORDER BY created_at DESC
    `).bind(user.id).all();
    const studentCounts = await c.env.DB.prepare(`
      SELECT period_id, COUNT(*) as count 
      FROM students 
      WHERE teacher_id = ? 
      GROUP BY period_id
    `).bind(user.id).all();
    return c.json({
      teacher,
      periods: periods.results,
      studentCounts: studentCounts.results
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
teacherRouter.post("/periods", async (c) => {
  try {
    const user = c.get("user");
    const { name, startYear, endYear } = await c.req.json();
    if (!name || !startYear || !endYear) {
      return c.json({ message: "All fields are required" }, 400);
    }
    if (startYear >= endYear) {
      return c.json({ message: "Start year must be before end year" }, 400);
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO periods (teacher_id, name, start_year, end_year, current_year) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(user.id, name, startYear, endYear, startYear).run();
    return c.json({
      message: "Period created successfully",
      period: {
        id: result.meta.last_row_id,
        name,
        startYear,
        endYear,
        currentYear: startYear
      }
    }, 201);
  } catch (error) {
    console.error("Create period error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
teacherRouter.post("/invite-codes", async (c) => {
  try {
    const user = c.get("user");
    const { periodId, maxUses = 30 } = await c.req.json();
    if (!periodId) {
      return c.json({ message: "Period ID is required" }, 400);
    }
    const period = await c.env.DB.prepare(
      "SELECT id FROM periods WHERE id = ? AND teacher_id = ?"
    ).bind(periodId, user.id).first();
    if (!period) {
      return c.json({ message: "Period not found" }, 404);
    }
    let code = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await c.env.DB.prepare(
        "SELECT id FROM invite_codes WHERE code = ?"
      ).bind(code).first();
      if (!existing) break;
      code = generateInviteCode();
      attempts++;
    }
    const result = await c.env.DB.prepare(`
      INSERT INTO invite_codes (code, teacher_id, period_id, max_uses, uses_remaining) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(code, user.id, periodId, maxUses, maxUses).run();
    return c.json({
      message: "Invite code created successfully",
      inviteCode: {
        id: result.meta.last_row_id,
        code,
        periodId,
        maxUses,
        usesRemaining: maxUses
      }
    }, 201);
  } catch (error) {
    console.error("Create invite code error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
teacherRouter.get("/periods/:periodId/students", async (c) => {
  try {
    const user = c.get("user");
    const periodId = c.req.param("periodId");
    const period = await c.env.DB.prepare(
      "SELECT id FROM periods WHERE id = ? AND teacher_id = ?"
    ).bind(periodId, user.id).first();
    if (!period) {
      return c.json({ message: "Period not found" }, 404);
    }
    const students = await c.env.DB.prepare(`
      SELECT id, name, username, created_at 
      FROM students 
      WHERE period_id = ? 
      ORDER BY name
    `).bind(periodId).all();
    return c.json({ students: students.results });
  } catch (error) {
    console.error("Get students error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
teacherRouter.patch("/periods/:periodId/timeline", async (c) => {
  try {
    const user = c.get("user");
    const periodId = c.req.param("periodId");
    const { currentYear } = await c.req.json();
    if (currentYear === void 0) {
      return c.json({ message: "Current year is required" }, 400);
    }
    const period = await c.env.DB.prepare(
      "SELECT start_year, end_year FROM periods WHERE id = ? AND teacher_id = ?"
    ).bind(periodId, user.id).first();
    if (!period) {
      return c.json({ message: "Period not found" }, 404);
    }
    if (currentYear < period.start_year || currentYear > period.end_year) {
      return c.json({ message: "Year must be within period range" }, 400);
    }
    await c.env.DB.prepare(
      "UPDATE periods SET current_year = ? WHERE id = ?"
    ).bind(currentYear, periodId).run();
    return c.json({ message: "Timeline updated successfully", currentYear });
  } catch (error) {
    console.error("Update timeline error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
var studentRouter = new Hono2();
studentRouter.use("/*", studentAuthMiddleware);
studentRouter.get("/dashboard", async (c) => {
  try {
    const user = c.get("user");
    const student = await c.env.DB.prepare(`
      SELECT s.id, s.name, s.username, s.period_id, p.name as period_name, 
             p.start_year, p.end_year, p.current_year
      FROM students s
      JOIN periods p ON s.period_id = p.id
      WHERE s.id = ?
    `).bind(user.id).first();
    if (!student) {
      return c.json({ message: "Student not found" }, 404);
    }
    const gameSession = await c.env.DB.prepare(`
      SELECT id, civilization_id, progress_data, last_played
      FROM game_sessions
      WHERE student_id = ?
    `).bind(user.id).first();
    return c.json({
      student,
      gameSession: gameSession || null
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
studentRouter.get("/civilizations", async (c) => {
  return c.json({
    civilizations: [
      { id: "egypt", name: "Ancient Egypt" },
      { id: "greece", name: "Ancient Greece" },
      { id: "rome", name: "Roman Empire" },
      { id: "china", name: "Ancient China" },
      { id: "germania", name: "Germania" },
      { id: "phoenicia", name: "Phoenicia" },
      { id: "india", name: "Ancient India" },
      { id: "mesopotamia", name: "Mesopotamia" },
      { id: "persia", name: "Persian Empire" },
      { id: "sparta", name: "Sparta" },
      { id: "anatolia", name: "Anatolia" },
      { id: "crete", name: "Minoan Crete" },
      { id: "gaul", name: "Gaul" },
      { id: "carthage", name: "Carthage" },
      { id: "macedon", name: "Macedonia" },
      { id: "assyria", name: "Assyrian Empire" }
    ]
  });
});
studentRouter.post("/game-session", async (c) => {
  try {
    const user = c.get("user");
    const { civilizationId, progressData } = await c.req.json();
    if (!civilizationId) {
      return c.json({ message: "Civilization ID is required" }, 400);
    }
    const existing = await c.env.DB.prepare(
      "SELECT id FROM game_sessions WHERE student_id = ?"
    ).bind(user.id).first();
    if (existing) {
      await c.env.DB.prepare(`
        UPDATE game_sessions 
        SET civilization_id = ?, progress_data = ?, last_played = datetime('now')
        WHERE student_id = ?
      `).bind(civilizationId, JSON.stringify(progressData || {}), user.id).run();
      return c.json({ message: "Game session updated" });
    } else {
      const result = await c.env.DB.prepare(`
        INSERT INTO game_sessions (student_id, civilization_id, progress_data) 
        VALUES (?, ?, ?)
      `).bind(user.id, civilizationId, JSON.stringify(progressData || {})).run();
      return c.json({
        message: "Game session created",
        sessionId: result.meta.last_row_id
      }, 201);
    }
  } catch (error) {
    console.error("Game session error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
studentRouter.put("/game-session/progress", async (c) => {
  try {
    const user = c.get("user");
    const { progressData } = await c.req.json();
    await c.env.DB.prepare(`
      UPDATE game_sessions 
      SET progress_data = ?, last_played = datetime('now')
      WHERE student_id = ?
    `).bind(JSON.stringify(progressData), user.id).run();
    return c.json({ message: "Progress saved successfully" });
  } catch (error) {
    console.error("Save progress error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
});
var api = new Hono2();
api.use("/*", cors({
  origin: "*",
  credentials: true
}));
api.get("/health", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});
api.route("/auth", authRouter);
api.route("/teacher", teacherRouter);
api.route("/student", studentRouter);
var app = new Hono2();
app.use("*", cors({
  origin: "*",
  credentials: true
}));
app.route("/api", api);
app.get("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});
var index_default = app;

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-vdXt6z/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-vdXt6z/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=bundledWorker-0.9055226369574334.mjs.map
