/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	var nx

	if (typeof Proxy === 'undefined') {
	  nx = { supported: false }
	} else {
	  nx = {
	    component: __webpack_require__(1),
	    middlewares: __webpack_require__(12),
	    components: __webpack_require__(48),
	    utils: __webpack_require__(55),
	    supported: true
	  }

	  __webpack_require__(56)
	  __webpack_require__(67)
	}

	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = nx
	}
	if (typeof window !== 'undefined') {
	  window.nx = nx
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	__webpack_require__(2)
	module.exports = __webpack_require__(4)


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	__webpack_require__(3)


/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict'

	const secret = {
	  registered: Symbol('registered')
	}

	if (!document.registerElement) {
	  const registry = new Map()

	  const observer = new MutationObserver(onMutations)
	  observer.observe(document, {childList: true, subtree: true})

	  function onMutations (mutations) {
	    for (let mutation of mutations) {
	      Array.prototype.forEach.call(mutation.addedNodes, onNodeAdded)
	      Array.prototype.forEach.call(mutation.removedNodes, onNodeRemoved)
	    }
	    mutations = observer.takeRecords()
	    if (mutations.length) {
	      onMutations(mutations)
	    }
	  }

	  function onNodeAdded (node) {
	    if (!(node instanceof Element)) return

	    let config = registry.get(node.getAttribute('is'))
	    if (!config || config.extends !== node.tagName.toLowerCase()) {
	      config = registry.get(node.tagName.toLowerCase())
	    }
	    if (config && !node[secret.registered]) {
	      Object.assign(node, config.prototype)
	      node[secret.registered] = true
	    }
	    if (node[secret.registered] && node.attachedCallback) {
	      node.attachedCallback()
	    }
	    Array.prototype.forEach.call(node.childNodes, onNodeAdded)
	  }

	  function onNodeRemoved (node) {
	    if (node[secret.registered] && node.detachedCallback) {
	      node.detachedCallback()
	    }
	    Array.prototype.forEach.call(node.childNodes, onNodeRemoved)
	  }

	  document.registerElement = function registerElement (name, config) {
	    name = name.toLowerCase()
	    if (config.extends) {
	      config.extends = config.extends.toLowerCase()
	    }
	    registry.set(name, config)

	    if (config.extends) {
	      Array.prototype.forEach.call(document.querySelectorAll(`[is=${name}]`), onNodeAdded)
	    } else {
	      Array.prototype.forEach.call(document.getElementsByTagName(name), onNodeAdded)
	    }
	  }

	  const originalCreateElement = document.createElement
	  document.createElement = function createElement (name, is) {
	    const element = originalCreateElement.call(document, name)
	    if (is) {
	      element.setAttribute('is', is)
	    }
	    return element
	  }
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	module.exports = __webpack_require__(5)


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const validateConfig = __webpack_require__(6)
	const validateMiddlewares = __webpack_require__(7)
	const getContext = __webpack_require__(8)
	const onNodeAdded = __webpack_require__(9)
	const onNodeRemoved = __webpack_require__(11)

	const secret = {
	  config: Symbol('component config')
	}
	const observerConfig = {
	  childList: true,
	  subtree: true
	}
	let context
	let prevParent
	const addedNodes = new Set()

	module.exports = function component (rawConfig) {
	  return {use, useOnContent, register, [secret.config]: validateConfig(rawConfig)}
	}

	function use (middleware) {
	  if (typeof middleware !== 'function') {
	    throw new TypeError('first argument must be a function')
	  }
	  if (middleware.$type && middleware.$type !== 'component') {
	    throw new Error(`${middleware.$name} can't be used as a component middleware`)
	  }
	  const config = this[secret.config]
	  config.middlewares = config.middlewares || []
	  config.middlewares.push(middleware)
	  return this
	}

	function useOnContent (middleware) {
	  if (typeof middleware !== 'function') {
	    throw new TypeError('first argument must be a function')
	  }
	  if (middleware.$type && middleware.$type !== 'content') {
	    throw new Error(`${middleware.$name} can't be used as a content middleware`)
	  }
	  const config = this[secret.config]
	  if (config.isolate === true) {
	    console.log('warning: content middlewares have no effect inside isolated components')
	  }
	  config.contentMiddlewares = config.contentMiddlewares || []
	  config.contentMiddlewares.push(middleware)
	  return this
	}

	function register (name) {
	  if (typeof name !== 'string') {
	    throw new TypeError('first argument must be a string')
	  }
	  const config = this[secret.config]
	  const parentProto = config.element ? config.elementProto : HTMLElement.prototype
	  const proto = Object.create(parentProto)
	  config.shouldValidate = validateMiddlewares(config.contentMiddlewares, config.middlewares)
	  proto[secret.config] = config
	  proto.attachedCallback = attachedCallback
	  if (config.root) {
	    proto.detachedCallback = detachedCallback
	  }
	  return document.registerElement(name, {prototype: proto, extends: config.element})
	}

	function attachedCallback () {
	  const config = this[secret.config]
	  if (!this.$registered) {
	    if (typeof config.state === 'object') {
	      this.$state = config.state
	    } else if (config.state === true) {
	      this.$state = {}
	    } else if (config.state === 'inherit') {
	      this.$state = {}
	      this.$inheritState = true
	    }

	    this.$isolate = config.isolate
	    this.$contentMiddlewares = config.contentMiddlewares
	    this.$middlewares = config.middlewares
	    this.$shouldValidate = config.shouldValidate
	    this.$registered = true

	    if (config.root) {
	      this.$root = this
	      const contentObserver = new MutationObserver(onMutations)
	      contentObserver.observe(this, observerConfig)
	    }

	    if (addedNodes.size === 0) {
	      Promise.resolve().then(processAddedNodes)
	    }
	    addedNodes.add(this)
	  }
	}

	function detachedCallback () {
	  onNodeRemoved(this)
	}

	function onMutations (mutations, contentObserver) {
	  let mutationIndex = mutations.length
	  while (mutationIndex--) {
	    const mutation = mutations[mutationIndex]

	    let nodes = mutation.removedNodes
	    let nodeIndex = nodes.length
	    while (nodeIndex--) {
	      onNodeRemoved(nodes[nodeIndex])
	    }

	    nodes = mutation.addedNodes
	    nodeIndex = nodes.length
	    while (nodeIndex--) {
	      addedNodes.add(nodes[nodeIndex])
	    }
	  }
	  processAddedNodes()

	  mutations = contentObserver.takeRecords()
	  if (mutations.length) {
	    onMutations(mutations, contentObserver)
	  }
	}

	function processAddedNodes () {
	  addedNodes.forEach(processAddedNode)
	  addedNodes.clear()
	  context = prevParent = undefined
	}

	function processAddedNode (node) {
	  const parentNode = node.parentNode || node.host
	  if (prevParent !== parentNode) {
	    prevParent = parentNode
	    context = getContext(parentNode)
	  }
	  onNodeAdded(node, context)
	  if (node.shadowRoot) {
	    const shadowObserver = new MutationObserver(onMutations)
	    shadowObserver.observe(node.shadowRoot, observerConfig)
	  }
	}


/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function validateConfig (rawConfig) {
	  if (rawConfig === undefined) {
	    rawConfig = {}
	  }
	  if (typeof rawConfig !== 'object') {
	    throw new TypeError('invalid component config, must be an object or undefined')
	  }

	  const resultConfig = {}

	  if (typeof rawConfig.state === 'boolean' || rawConfig.state === 'inherit') {
	    resultConfig.state = rawConfig.state
	  } else if (typeof rawConfig.state === 'object') {
	    resultConfig.state = rawConfig.state
	  } else if (rawConfig.state === undefined) {
	    resultConfig.state = true
	  } else {
	    throw new Error('invalid state config: ' + rawConfig.state)
	  }

	  if (typeof rawConfig.isolate === 'boolean' || rawConfig.isolate === 'middlewares') {
	    resultConfig.isolate = rawConfig.isolate
	  } else if (rawConfig.isolate === undefined) {
	    resultConfig.isolate = false
	  } else {
	    throw new Error(`invalid isolate config: ${rawConfig.isolate}, must be a boolean, undefined or 'middlewares'`)
	  }

	  if (typeof rawConfig.root === 'boolean') {
	    resultConfig.root = rawConfig.root
	  } else if (rawConfig.root === undefined) {
	    resultConfig.root = false
	  } else {
	    throw new Error('invalid root config: ' + rawConfig.root)
	  }

	  if (resultConfig.root && (resultConfig.isolate === true || !resultConfig.state)) {
	    throw new Error('root components must have a state and must not be isolated')
	  }

	  if (typeof rawConfig.element === 'string') {
	    try {
	      resultConfig.elementProto = Object.getPrototypeOf(document.createElement(rawConfig.element))
	      resultConfig.element = rawConfig.element
	    } catch (err) {
	      throw new Error(`invalid element config: ${rawConfig.element}, must be the name of a native element`)
	    }
	  } else if (rawConfig.element !== undefined) {
	    throw new Error(`invalid element config: ${rawConfig.element}, must be the name of a native element`)
	  }
	  return resultConfig
	}


/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict'

	const names = new Set()
	const missing = new Set()
	const duplicates = new Set()

	module.exports = function validateMiddlewares (contentMiddlewares, middlewares, strict) {
	  names.clear()
	  missing.clear()
	  duplicates.clear()

	  if (contentMiddlewares) {
	    contentMiddlewares.forEach(validateMiddleware)
	  }
	  if (middlewares) {
	    middlewares.forEach(validateMiddleware)
	  }
	  if (missing.size) {
	    if (!strict) return true
	    throw new Error(`missing middlewares: ${Array.from(missing).join()}`)
	  }
	  if (duplicates.size) {
	    if (!strict) return true
	    throw new Error(`duplicate middlewares: ${Array.from(duplicates).join()}`)
	  }
	}

	function validateMiddleware (middleware) {
	  const name = middleware.$name
	  const require = middleware.$require
	  if (name) {
	    if (names.has(name)) {
	      duplicates.add(name)
	    }
	    names.add(name)
	  }
	  if (require) {
	    for (let dependency of require) {
	      if (!names.has(dependency)) {
	        missing.add(dependency)
	      }
	    }
	  }
	}


/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function getContext (node) {
	  const context = {contentMiddlewares: []}

	  while (node) {
	    if (!context.state && node.$state) {
	      context.state = node.$state
	    }
	    if (!context.state && node.$contextState) {
	      context.state = node.$contextState
	    }
	    if (!context.isolate) {
	      context.isolate = node.$isolate
	      if (node.$contentMiddlewares) {
	        context.contentMiddlewares = node.$contentMiddlewares.concat(context.contentMiddlewares)
	      }
	    }
	    if (node === node.$root) {
	      context.root = context.root || node
	      return context
	    }
	    if (node.host) {
	      context.root = context.root || node
	      node = node.host
	    } else {
	      node = node.parentNode
	    }
	  }
	  return context
	}


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const validateMiddlewares = __webpack_require__(7)
	const runMiddlewares = __webpack_require__(10)

	module.exports = function onNodeAdded (node, context) {
	  const parent = node.parentNode
	  const validParent = (parent && parent.$lifecycleStage === 'attached')
	  if (validParent && node === node.$root) {
	    throw new Error(`Nested root component: ${node.tagName}`)
	  }
	  if ((validParent || node === node.$root) && context.isolate !== true) {
	    setupNodeAndChildren(node, context.state, context.contentMiddlewares, context.root)
	  }
	}

	function setupNodeAndChildren (node, state, contentMiddlewares, root) {
	  const type = node.nodeType
	  if (!shouldProcess(node, type)) return
	  node.$lifecycleStage = 'attached'

	  node.$contextState = node.$contextState || state || node.$state
	  node.$state = node.$state || node.$contextState
	  if (node.$inheritState) {
	    Object.setPrototypeOf(node.$state, node.$contextState)
	  }

	  node.$root = node.$root || root

	  if (node.$isolate === 'middlewares') {
	    contentMiddlewares = node.$contentMiddlewares || []
	  } else if (node.$contentMiddlewares) {
	    contentMiddlewares = contentMiddlewares.concat(node.$contentMiddlewares)
	  }
	  if (node.$shouldValidate) {
	    validateMiddlewares(contentMiddlewares, node.$middlewares, true)
	  }
	  node.$cleanup = $cleanup

	  runMiddlewares(node, contentMiddlewares, node.$middlewares)

	  if (type === 1 && node.$isolate !== true) {
	    let child = node.firstChild
	    while (child) {
	      setupNodeAndChildren(child, node.$state, contentMiddlewares, node.$root)
	      child = child.nextSibling
	    }

	    child = node.shadowRoot ? node.shadowRoot.firstChild : undefined
	    while (child) {
	      setupNodeAndChildren(child, node.$state, contentMiddlewares, node.shadowRoot)
	      child = child.nextSibling
	    }
	  }
	}

	function shouldProcess (node, type) {
	  if (node.$lifecycleStage) {
	    return false
	  }
	  if (type === 1) {
	    return ((!node.hasAttribute('is') && node.tagName.indexOf('-') === -1) || node.$registered)
	  }
	  if (type === 3) {
	    return node.nodeValue.trim()
	  }
	}

	function $cleanup (fn, ...args) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('first argument must be a function')
	  }
	  this.$cleaners = this.$cleaners || []
	  this.$cleaners.push({fn, args})
	}


/***/ },
/* 10 */
/***/ function(module, exports) {

	'use strict'

	let node
	let index, middlewares, middlewaresLength
	let contentIndex, contentMiddlewares, contentMiddlewaresLength

	module.exports = function runMiddlewares (currNode, currContentMiddlewares, currMiddlewares) {
	  node = currNode
	  middlewares = currMiddlewares
	  contentMiddlewares = currContentMiddlewares
	  middlewaresLength = currMiddlewares ? currMiddlewares.length : 0
	  contentMiddlewaresLength = currContentMiddlewares ? currContentMiddlewares.length : 0
	  index = contentIndex = 0
	  next()
	  node = middlewares = contentMiddlewares = undefined
	}

	function next () {
	  if (contentIndex < contentMiddlewaresLength) {
	    contentMiddlewares[contentIndex++].call(node, node, node.$state, next)
	    next()
	  } else if (index < middlewaresLength) {
	    middlewares[index++].call(node, node, node.$state, next)
	    next()
	  }
	}


/***/ },
/* 11 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function onNodeRemoved (node) {
	  const parent = node.parentNode
	  if (!parent || parent.$lifecycleStage === 'detached') {
	    cleanupNodeAndChildren(node)
	  }
	}

	function cleanupNodeAndChildren (node) {
	  if (node.$lifecycleStage !== 'attached') return
	  node.$lifecycleStage = 'detached'

	  if (node.$cleaners) {
	    node.$cleaners.forEach(runCleaner, node)
	    node.$cleaners = undefined
	  }

	  let child = node.firstChild
	  while (child) {
	    cleanupNodeAndChildren(child)
	    child = child.nextSibling
	  }

	  child = node.shadowRoot ? node.shadowRoot.firstChild : undefined
	  while (child) {
	    cleanupNodeAndChildren(child, node.$state, contentMiddlewares)
	    child = child.nextSibling
	  }
	}

	function runCleaner (cleaner) {
	  cleaner.fn.apply(this, cleaner.args)
	}


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	module.exports = {
	  attributes: __webpack_require__(13),
	  props: __webpack_require__(20),
	  events: __webpack_require__(21),
	  interpolate: __webpack_require__(22),
	  render: __webpack_require__(23),
	  flow: __webpack_require__(24),
	  bindable: __webpack_require__(26),
	  bind: __webpack_require__(27),
	  style: __webpack_require__(28),
	  animate: __webpack_require__(29),
	  route: __webpack_require__(30),
	  params: __webpack_require__(31),
	  ref: __webpack_require__(33),
	  observe: __webpack_require__(37),
	  meta: __webpack_require__(47)
	}


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const compiler = __webpack_require__(14)

	let currElem
	let currAttributes = new Map()
	const attributeCache = new Map()

	function attributes (elem, state, next) {
	  if (elem.nodeType !== 1) return

	  elem.$attribute = $attribute
	  initAttributes(elem)
	  next()
	  processAttributes(elem)
	}
	attributes.$name = 'attributes'
	attributes.$require = ['observe']
	module.exports = attributes

	function $attribute (name, config) {
	  const attr = currAttributes.get(name)
	  if (!attr) return
	  
	  if (currElem !== this) {
	    throw new Error(`${name} attribute handler for ${this.tagName} is defined too late.`)
	  }
	  if (typeof config === 'function') {
	    config = { handler: config }
	  }
	  if (!config.handler) {
	    throw new Error(`${name} attribute must have a handler`)
	  }
	  processCustomAttribute.call(this, attr, name, config)
	  currAttributes.delete(name)
	}

	function initAttributes (elem) {
	  currElem = elem
	  const cloneId = elem.getAttribute('clone-id')
	  if (cloneId) {
	    const attributes = attributeCache.get(cloneId)
	    if (attributes) {
	      currAttributes = new Map(attributes)
	    } else {
	      extractAttributes(elem)
	      attributeCache.set(cloneId, new Map(currAttributes))
	    }
	  }
	  extractAttributes(elem)
	}

	function extractAttributes (elem) {
	  const attributes = elem.attributes
	  let i = attributes.length
	  while (i--) {
	    const attribute = attributes[i]
	    let type = attribute.name[0]
	    let name = attribute.name
	    if (type === '$' || type === '@') {
	      name = name.slice(1)
	    } else {
	      type = ''
	    }
	    currAttributes.set(name, {value: attribute.value, type})
	  }
	}

	function processAttributes (elem) {
	  currAttributes.forEach(processAttribute, elem)
	  currAttributes.clear()
	  currElem = undefined
	}

	function processAttribute (attr, name) {
	  if (attr.type === '$') {
	    const expression = compiler.compileExpression(attr.value || name)
	    processExpression.call(this, expression, name, defaultHandler)
	  } else if (attr.type === '@') {
	    const expression = compiler.compileExpression(attr.value || name)
	    this.$observe(processExpression, expression, name, defaultHandler)
	  }
	}

	function processCustomAttribute (attr, name, config) {
	  if (config.type && config.type.indexOf(attr.type) === -1) {
	    throw new Error(`${name} attribute is not allowed to be ${attr.type || 'normal'} type`)
	  }
	  if (config.init) {
	    config.init.call(this)
	  }

	  if (attr.type === '@') {
	    const expression = compiler.compileExpression(attr.value || name)
	    this.$observe(processExpression, expression, name, config.handler)
	  } else if (attr.type === '$') {
	    const expression = compiler.compileExpression(attr.value || name)
	    processExpression.call(this, expression, name, config.handler)
	  } else {
	    config.handler.call(this, attr.value, name)
	  }
	}

	function processExpression (expression, name, handler) {
	  const value = expression(this.$contextState)
	  handler.call(this, value, name)
	}

	function defaultHandler (value, name) {
	  if (value) {
	    this.setAttribute(name, value)
	  } else {
	    this.removeAttribute(name)
	  }
	}


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const context = __webpack_require__(15)
	const modifiers = __webpack_require__(16)
	const compiler = __webpack_require__(17)

	module.exports = {
	  compileExpression: compiler.compileExpression,
	  compileCode: compiler.compileCode,
	  expose: context.expose,
	  hide: context.hide,
	  hideAll: context.hideAll,
	  filter: modifiers.filter,
	  limiter: modifiers.limiter
	}


/***/ },
/* 15 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict'

	const globals = new Set()
	const proxies = new WeakMap()
	const handlers = {has}

	let globalObj
	if (typeof window !== 'undefined') globalObj = window // eslint-disable-line
	else if (typeof global !== 'undefined') globalObj = global // eslint-disable-line
	else if (typeof self !== 'undefined') globalObj = self // eslint-disable-line
	globalObj.$nxCompileToSandbox = toSandbox
	globalObj.$nxCompileCreateBackup = createBackup

	module.exports = {
	  expose,
	  hide,
	  hideAll
	}

	function expose (...globalNames) {
	  for (let globalName of globalNames) {
	    globals.add(globalName)
	  }
	  return this
	}

	function hide (...globalNames) {
	  for (let globalName of globalNames) {
	    globals.delete(globalName)
	  }
	  return this
	}

	function hideAll () {
	  globals.clear()
	  return this
	}

	function has (target, key) {
	  return globals.has(key) ? Reflect.has(target, key) : true
	}

	function toSandbox (obj) {
	  if (typeof obj !== 'object') {
	    throw new TypeError('first argument must be an object')
	  }
	  let sandbox = proxies.get(obj)
	  if (!sandbox) {
	    sandbox = new Proxy(obj, handlers)
	    proxies.set(obj, sandbox)
	  }
	  return sandbox
	}

	function createBackup (context, tempVars) {
	  if (typeof tempVars === 'object') {
	    const backup = {}
	    for (let key of Object.keys(tempVars)) {
	      backup[key] = context[key]
	    }
	    return backup
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 16 */
/***/ function(module, exports) {

	'use strict'

	const filters = new Map()
	const limiters = new Map()

	module.exports = {
	  filters,
	  limiters,
	  filter,
	  limiter
	}

	function filter (name, handler) {
	  if (typeof name !== 'string') {
	    throw new TypeError('First argument must be a string.')
	  }
	  if (typeof handler !== 'function') {
	    throw new TypeError('Second argument must be a function.')
	  }
	  if (filters.has(name)) {
	    throw new Error(`A filter named ${name} is already registered.`)
	  }
	  filters.set(name, handler)
	  return this
	}

	function limiter (name, handler) {
	  if (typeof name !== 'string') {
	    throw new TypeError('First argument must be a string.')
	  }
	  if (typeof handler !== 'function') {
	    throw new TypeError('Second argument must be a function.')
	  }
	  if (limiters.has(name)) {
	    throw new Error(`A limiter named ${name} is already registered.`)
	  }
	  limiters.set(name, handler)
	  return this
	}


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const parser = __webpack_require__(18)

	const expressionCache = new Map()
	const codeCache = new Map()

	module.exports = {
	  compileExpression,
	  compileCode
	}

	function compileExpression (src) {
	  if (typeof src !== 'string') {
	    throw new TypeError('First argument must be a string.')
	  }
	  let expression = expressionCache.get(src)
	  if (!expression) {
	    expression = parser.parseExpression(src)
	    expressionCache.set(src, expression)
	  }

	  if (typeof expression === 'function') {
	    return expression
	  }

	  return function evaluateExpression (context) {
	    let value = expression.exec(context)
	    for (let filter of expression.filters) {
	      const args = filter.argExpressions.map(evaluateArgExpression, context)
	      value = filter.effect(value, ...args)
	    }
	    return value
	  }
	}

	function compileCode (src) {
	  if (typeof src !== 'string') {
	    throw new TypeError('First argument must be a string.')
	  }
	  let code = codeCache.get(src)
	  if (!code) {
	    code = parser.parseCode(src)
	    codeCache.set(src, code)
	  }

	  if (typeof code === 'function') {
	    return code
	  }

	  const context = {}
	  return function evaluateCode (state, tempVars) {
	    let i = 0
	    function next () {
	      Object.assign(context, tempVars)
	      if (i < code.limiters.length) {
	        const limiter = code.limiters[i++]
	        const args = limiter.argExpressions.map(evaluateArgExpression, state)
	        limiter.effect(next, context, ...args)
	      } else {
	        code.exec(state, tempVars)
	      }
	    }
	    next()
	  }
	}

	function evaluateArgExpression (argExpression) {
	  return argExpression(this)
	}


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const modifiers = __webpack_require__(16)
	const rawCompiler = __webpack_require__(19)

	const filterRegex = /(?:[^\|]|\|\|)+/g
	const limiterRegex = /(?:[^&]|&&)+/g
	const argsRegex = /\S+/g

	module.exports = {
	  parseExpression,
	  parseCode
	}

	function parseExpression (src) {
	  const tokens = src.match(filterRegex)
	  if (tokens.length === 1) {
	    return rawCompiler.compileExpression(tokens[0])
	  }

	  const expression = {
	    exec: rawCompiler.compileExpression(tokens[0]),
	    filters: []
	  }
	  for (let i = 1; i < tokens.length; i++) {
	    let filterTokens = tokens[i].match(argsRegex) || []
	    const filterName = filterTokens.shift()
	    const effect = modifiers.filters.get(filterName)
	    if (!effect) {
	      throw new Error(`There is no filter named: ${filterName}.`)
	    }
	    expression.filters.push({effect, argExpressions: filterTokens.map(compileArgExpression)})
	  }
	  return expression
	}

	function parseCode (src) {
	  const tokens = src.match(limiterRegex)
	  if (tokens.length === 1) {
	    return rawCompiler.compileCode(tokens[0])
	  }

	  const code = {
	    exec: rawCompiler.compileCode(tokens[0]),
	    limiters: []
	  }
	  for (let i = 1; i < tokens.length; i++) {
	    const limiterTokens = tokens[i].match(argsRegex) || []
	    const limiterName = limiterTokens.shift()
	    const effect = modifiers.limiters.get(limiterName)
	    if (!effect) {
	      throw new Error(`There is no limiter named: ${limiterName}.`)
	    }
	    code.limiters.push({effect, argExpressions: limiterTokens.map(compileArgExpression)})
	  }
	  return code
	}

	function compileArgExpression (argExpression) {
	  return rawCompiler.compileExpression(argExpression)
	}


/***/ },
/* 19 */
/***/ function(module, exports) {

	'use strict'

	module.exports = {
	  compileCode,
	  compileExpression
	}

	function compileExpression (src) {
	  return new Function('context', // eslint-disable-line
	    `const sandbox = $nxCompileToSandbox(context)
	    try { with (sandbox) { return ${src} } } catch (err) {
	      if (!(err instanceof TypeError)) throw err
	    }`)
	}

	function compileCode (src) {
	  return new Function('context', 'tempVars', // eslint-disable-line
	    `const backup = $nxCompileCreateBackup(context, tempVars)
	    Object.assign(context, tempVars)
	    const sandbox = $nxCompileToSandbox(context)
	    try {
	      with (sandbox) { ${src} }
	    } finally {
	      Object.assign(context, backup)
	    }`)
	}


/***/ },
/* 20 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function propsFactory(...propNames) {
	  function props (elem) {
	    for (let propName of propNames) {
	      elem.$attribute(propName, propHandler)
	    }
	  }
	  props.$name = 'props'
	  props.$require = ['attributes']
	  props.$type = 'component'
	  return props
	}

	function propHandler (value, name) {
	  this.$state[name] = value
	}


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const compiler = __webpack_require__(14)

	const secret = {
	  handlers: Symbol('event handlers')
	}
	const handlerCache = new Map()

	function events (elem) {
	  if (elem.nodeType !== 1) return

	  const handlers = getEventHandlers(elem)
	  if (handlers) {
	    handlers.forEach(addEventHandlers, elem)
	    elem[secret.handlers] = handlers
	  }
	}
	events.$name = 'events'
	module.exports = events

	function getEventHandlers (elem) {
	  const cloneId = elem.getAttribute('clone-id')
	  if (cloneId) {
	    let handlers = handlerCache.get(cloneId)
	    if (handlers === undefined) {
	      handlers = createEventHandlers(elem)
	      handlerCache.set(cloneId, handlers)
	    }
	    return handlers
	  }
	  return createEventHandlers(elem)
	}

	function createEventHandlers (elem) {
	  let handlers = false
	  const attributes = elem.attributes
	  let i = attributes.length
	  while (i--) {
	    const attribute = attributes[i]
	    if (attribute.name[0] === '#') {
	      handlers = handlers || new Map()
	      const handler = compiler.compileCode(attribute.value)
	      const names = attribute.name.slice(1).split(',')
	      for (let name of names) {
	        let typeHandlers = handlers.get(name)
	        if (!typeHandlers) {
	          typeHandlers = new Set()
	          handlers.set(name, typeHandlers)
	        }
	        typeHandlers.add(handler)
	      }
	    }
	  }
	  return handlers
	}

	function addEventHandlers (handlers, type) {
	  this.addEventListener(type, listener, true)
	}

	function listener (ev) {
	  const handlers = this[secret.handlers].get(ev.type)
	  for (let handler of handlers) {
	    handler(this.$contextState, { $event: ev })
	  }
	}


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const compiler = __webpack_require__(14)

	const tokenCache = new Map()

	function interpolate (node) {
	  if (node.nodeType !== 3) return
	  createTokens(node).forEach(processToken, node)
	}
	interpolate.$name = 'interpolate'
	interpolate.$require = ['observe']
	interpolate.$type = 'content'
	module.exports = interpolate

	function createTokens (node) {
	  const nodeValue = node.nodeValue
	  let tokens = tokenCache.get(nodeValue)
	  if (!tokens) {
	    tokens = parseValue(node.nodeValue)
	    tokenCache.set(nodeValue, tokens)
	    return tokens
	  }
	  return tokens.map(cloneToken)
	}

	function cloneToken (token) {
	  if (typeof token === 'object') {
	    return {
	      observed: token.observed,
	      expression: token.expression,
	      toString: token.toString
	    }
	  }
	  return token
	}

	function processToken (token, index, tokens) {
	  if (typeof token === 'object') {
	    const expression = compiler.compileExpression(token.expression)
	    if (token.observed) {
	      this.$observe(interpolateToken, expression, token, tokens)
	    } else {
	      interpolateToken.call(this, expression, token, tokens)
	    }
	  }
	}

	function interpolateToken (expression, token, tokens) {
	  let value = expression(this.$state)
	  value = (value !== undefined) ? value : ''
	  if (token.value !== value) {
	    token.value = value
	    this.nodeValue = (1 < tokens.length) ? tokens.join('') : value
	  }
	}

	function parseValue (string) {
	  const tokens = []
	  const length = string.length
	  let expression = false
	  let anchor = 0
	  let depth = 0
	  let token

	  for (let i = 0; i < length; i++) {
	    const char = string[i]

	    if (expression) {
	      if (char === '{') {
	        depth++
	      } else if (char === '}') {
	        depth--
	      }

	      if (depth === 0) {
	        token.expression = string.slice(anchor, i)
	        token.toString = tokenToString
	        tokens.push(token)
	        anchor = i + 1
	        expression = false
	      }
	    } else {
	      if (i === length - 1) {
	        tokens.push(string.slice(anchor, i + 1))
	      } else if ((char === '$' || char === '@') && string.charAt(i + 1) === '{') {
	        if (i !== anchor) {
	          tokens.push(string.slice(anchor, i))
	        }
	        token = {observed: (char === '@')}
	        anchor = i + 2
	        depth = 0
	        expression = true
	      }
	    }
	  }
	  return tokens
	}

	function tokenToString () {
	  return String(this.value)
	}


/***/ },
/* 23 */
/***/ function(module, exports) {

	'use strict'

	let cloneId = 0
	let selectorScope
	const hostRegex = /:host/g
	const functionalHostRegex = /:host\((.*?)\)/g

	module.exports = function renderFactory (config) {
	  config = validateAndCloneConfig(config)
	  config.template = cacheTemplate(config.template)

	  function render (elem) {
	    // fall back to non shadow mode (scoped style) for now, add polyfill later
	    if (config.shadow && elem.attachShadow) {
	      const shadowRoot = elem.attachShadow({mode: 'open'})
	      if (config.template) {
	        shadowRoot.appendChild(template)
	      }
	      if (config.style) {
	        const style = document.createElement('style')
	        style.appendChild(document.createTextNode(config.style))
	        shadowRoot.appendChild(style)
	      }
	    } else {
	      if (config.template) {
	        const template = document.importNode(config.template, true)
	        addContext(elem)
	        composeContentWithTemplate(elem, template)
	      }
	      if (config.style) {
	        addScopedStyle(elem, config.style)
	        config.style = undefined
	      }
	    }
	  }
	  render.$name = 'render'
	  render.$type = 'component'
	  return render
	}

	function addContext (elem) {
	  let child = elem.firstChild
	  while (child) {
	    child.$contextState = elem.$contextState
	    child = child.nextSibling
	  }
	}

	function composeContentWithTemplate (elem, template) {
	  let defaultSlot
	  const slots = template.querySelectorAll('slot')

	  for (let i = slots.length; i--;) {
	    const slot = slots[i]
	    if (slot.getAttribute('name')) {
	      const slotFillers = elem.querySelectorAll(`[slot=${slot.getAttribute('name')}]`)
	      if (slotFillers.length) {
	        slot.innerHTML = ''
	        for (let i = slotFillers.length; i--;) {
	          slot.appendChild(slotFillers[i])
	        }
	      }
	    } else {
	      defaultSlot = slot
	    }
	  }

	  if (defaultSlot && elem.firstChild) {
	    defaultSlot.innerHTML = ''
	    while (elem.firstChild) {
	      defaultSlot.appendChild(elem.firstChild)
	    }
	  }
	  elem.innerHTML = ''
	  elem.appendChild(template)
	}

	function addScopedStyle (elem, styleString) {
	  setSelectorScope(elem)
	  styleString = styleString
	    .replace(functionalHostRegex, `${selectorScope}$1`)
	    .replace(hostRegex, selectorScope)

	  const style = document.createElement('style')
	  style.appendChild(document.createTextNode(styleString))
	  document.head.insertBefore(style, document.head.firstChild)

	  scopeSheet(style.sheet)
	}

	function setSelectorScope (elem) {
	  const is = elem.getAttribute('is')
	  selectorScope = (is ? `${elem.tagName}[is="${is}"]` : elem.tagName).toLowerCase()
	}

	function scopeSheet (sheet) {
	  const rules = sheet.cssRules
	  for (let i = rules.length; i--;) {
	    const rule = rules[i]
	    if (rule.type === 1) {
	      const selectorText = rule.selectorText.split(',').map(scopeSelector).join(', ')
	      const styleText = rule.style.cssText
	      sheet.deleteRule(i)
	      sheet.insertRule(`${selectorText} { ${styleText} }`, i)
	    } else if (rule.type === 4) { // media rules
	      scopeSheet(rule)
	    }
	  }
	}

	function scopeSelector (selector) {
	  if (selector.indexOf(selectorScope) !== -1) {
	    return selector
	  }
	  return `${selectorScope} ${selector}`
	}

	function cacheTemplate (templateHTML) {
	  if (templateHTML) {
	    const template = document.createElement('template')
	    template.innerHTML = templateHTML
	    return template.content
	  }
	}

	function validateAndCloneConfig (rawConfig) {
	  const resultConfig = {}

	  if (typeof rawConfig !== 'object') {
	    throw new TypeError('config must be an object')
	  }

	  if (typeof rawConfig.template === 'string') {
	    resultConfig.template = rawConfig.template
	  } else if (rawConfig.template !== undefined) {
	    throw new TypeError('template config must be a string or undefined')
	  }

	  if (typeof rawConfig.style === 'string') {
	    resultConfig.style = rawConfig.style
	  } else if (rawConfig.style !== undefined) {
	    throw new TypeError('style config must be a string or undefined')
	  }

	  if (typeof rawConfig.shadow === 'boolean') {
	    resultConfig.shadow = rawConfig.shadow
	  } else if (rawConfig.shadow !== undefined) {
	    throw new TypeError('shadow config must be a boolean or undefined')
	  }

	  return resultConfig
	}


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const dom = __webpack_require__(25)

	const secret = {
	  inited: Symbol('flow initialized'),
	  showing: Symbol('flow showing'),
	  prevArray: Symbol('flow prevArray'),
	  trackBy: Symbol('track by')
	}

	function flow (elem) {
	  if (elem.nodeType !== 1) return

	  elem.$attribute('if', {
	    init: initFlow,
	    handler: ifAttribute
	  })
	  elem.$attribute('track-by', {
	    handler: trackByAttribute,
	    type: ['', '$']
	  })
	  elem.$attribute('repeat', {
	    init: initFlow,
	    handler: repeatAttribute
	  })
	}
	flow.$name = 'flow'
	flow.$require = ['attributes']
	module.exports = flow

	function initFlow () {
	  if (this[secret.inited]) {
	    throw new Error('The if and repeat attributes can not be used on the same element')
	  }
	  dom.normalizeContent(this)
	  dom.extractContent(this)
	  this[secret.inited] = true
	}

	function ifAttribute (show) {
	  if (show && !this[secret.showing]) {
	    dom.insertContent(this)
	    this[secret.showing] = true
	  } else if (!show && this[secret.showing]) {
	    dom.clearContent(this)
	    this[secret.showing] = false
	  }
	}

	function trackByAttribute (trackBy) {
	  this[secret.trackBy] = trackBy
	}

	function repeatAttribute (array) {
	  const repeatValue = this.getAttribute('repeat-value') || '$value'
	  const repeatIndex = this.getAttribute('repeat-index') || '$index'

	  let trackBy = this[secret.trackBy] || isSame
	  let trackByProp
	  if (typeof trackBy === 'string') {
	    trackByProp = trackBy
	    trackBy = isSame
	  }

	  array = array || []
	  const prevArray = this[secret.prevArray] = this[secret.prevArray] || []

	  let i = -1
	  iteration: for (let item of array) {
	    let prevItem = prevArray[++i]

	    if (prevItem === item) {
	      continue
	    }
	    if (trackBy(item, prevItem, trackByProp)) {
	      dom.mutateContext(this, i, {[repeatValue]: item})
	      prevArray[i] = item
	      continue
	    }
	    for (let j = i + 1; j < prevArray.length; j++) {
	      prevItem = prevArray[j]
	      if (trackBy(item, prevItem, trackByProp)) {
	        dom.moveContent(this, j, i, {[repeatIndex]: i})
	        prevArray.splice(i, 0, prevItem)
	        prevArray.splice(j, 1)
	        continue iteration
	      }
	    }
	    dom.insertContent(this, i, {[repeatIndex]: i, [repeatValue]: item})
	    prevArray.splice(i, 0, item)
	  }

	  if ((++i) === 0) {
	    prevArray.length = 0
	    dom.clearContent(this)
	  } else {
	    while (i < prevArray.length) {
	      dom.removeContent(this)
	      prevArray.pop()
	    }
	  }
	}

	function isSame (item1, item2, prop) {
	  return (item1 === item2 ||
	    (prop && typeof item1 === 'object' && typeof item2 === 'object' &&
	    item1 && item2 && item1[prop] === item2[prop]))
	}


/***/ },
/* 25 */
/***/ function(module, exports) {

	'use strict'

	const secret = {
	  template: Symbol('content template'),
	  firstNodes: Symbol('first nodes')
	}
	let cloneId = 0

	module.exports = {
	  extractContent,
	  normalizeContent,
	  insertContent,
	  moveContent,
	  removeContent,
	  clearContent,
	  mutateContext,
	  findAncestor,
	  findAncestorProp
	}

	function extractContent (elem) {
	  const template = document.createDocumentFragment()
	  let node = elem.firstChild
	  while (node) {
	    template.appendChild(node)
	    node = elem.firstChild
	  }
	  elem[secret.template] = template
	  elem[secret.firstNodes] = []
	  return template
	}

	function normalizeContent (node) {
	  if (node.nodeType === 1) {
	    node.setAttribute('clone-id', `content-${cloneId++}`)
	    const childNodes = node.childNodes
	    let i = childNodes.length
	    while (i--) {
	      normalizeContent(childNodes[i])
	    }
	  } else if (node.nodeType === 3) {
	    if (!node.nodeValue.trim()) node.remove()
	  } else {
	    node.remove()
	  }
	}

	function insertContent (elem, index, contextState) {
	  if (index !== undefined && typeof index !== 'number') {
	    throw new TypeError('Second argument must be a number or undefined.')
	  }
	  if (contextState !== undefined && typeof contextState !== 'object') {
	    throw new TypeError('Third argument must be an object or undefined.')
	  }
	  if (!elem[secret.template]) {
	    throw new Error('you must extract a template with $extractContent before inserting')
	  }
	  const content = elem[secret.template].cloneNode(true)
	  const firstNodes = elem[secret.firstNodes]
	  const firstNode = content.firstChild
	  const beforeNode = firstNodes[index]

	  if (contextState) {
	    contextState = Object.assign(Object.create(elem.$state), contextState)
	    let node = firstNode
	    while (node) {
	      node.$contextState = contextState
	      node = node.nextSibling
	    }
	  }

	  elem.insertBefore(content, beforeNode)
	  if (beforeNode) firstNodes.splice(index, 0, firstNode)
	  else firstNodes.push(firstNode)
	}

	function removeContent (elem, index) {
	  if (index !== undefined && typeof index !== 'number') {
	    throw new TypeError('Second argument must be a number or undefined.')
	  }
	  const firstNodes = elem[secret.firstNodes]
	  index = firstNodes[index] ? index : (firstNodes.length - 1)
	  const firstNode = firstNodes[index]
	  const nextNode = firstNodes[index + 1]


	  let node = firstNode
	  let next
	  while (node && node !== nextNode) {
	    next = node.nextSibling
	    node.remove()
	    node = next
	  }

	  if (nextNode) firstNodes.splice(index, 1)
	  else firstNodes.pop()
	}

	function clearContent (elem) {
	  elem.innerHTML = ''
	  elem[secret.firstNodes] = []
	}

	function moveContent (elem, fromIndex, toIndex, extraContext) {
	  if (typeof fromIndex !== 'number' || typeof toIndex !== 'number') {
	    throw new Error('first and second argument must be numbers')
	  }
	  if (extraContext !== undefined && typeof extraContext !== 'object') {
	    throw new Error('third argument must be an object or undefined')
	  }
	  const firstNodes = elem[secret.firstNodes]
	  const fromNode = firstNodes[fromIndex]
	  const untilNode = firstNodes[fromIndex + 1]
	  const toNode = firstNodes[toIndex]

	  let node = fromNode
	  let next
	  while (node && node !== untilNode) {
	    next = node.nextSibling
	    elem.insertBefore(node, toNode)
	    node = next
	  }
	  firstNodes.splice(fromIndex, 1)
	  firstNodes.splice(toIndex, 0, fromNode)

	  if (extraContext && fromNode && fromNode.$contextState) {
	    Object.assign(fromNode.$contextState, extraContext)
	  }
	}

	function mutateContext (elem, index, extraContext) {
	  if (index !== undefined && typeof index !== 'number') {
	    throw new TypeError('first argument must be a number or undefined')
	  }
	  if (typeof extraContext !== 'object') {
	    throw new TypeError('second argument must be an object')
	  }
	  const startNode = elem[secret.firstNodes][index]
	  if (startNode && startNode.$contextState) {
	    Object.assign(startNode.$contextState, extraContext)
	  }
	}

	function findAncestorProp (node, prop) {
	  node = findAncestor(node, node => node[prop] !== undefined)
	  return node ? node[prop] : undefined
	}

	function findAncestor (node, condition) {
	  if (!node instanceof Node) {
	    throw new TypeError('first argument must be a node')
	  }
	  if (typeof condition !== 'function') {
	    throw new TypeError('second argument must be a function')
	  }

	  node = node.parentNode
	  while (node && !condition(node)) {
	    node = node.parentNode
	  }
	  return node
	}


/***/ },
/* 26 */
/***/ function(module, exports) {

	'use strict'

	const secret = {
	  bound: Symbol('bound element'),
	  params: Symbol('bind params'),
	  bindEvents: Symbol('bind events'),
	  signal: Symbol('observing signal'),
	  preventSubmit: Symbol('prevent submit')
	}
	const paramsRegex = /\S+/g
	const defaultParams = {mode: 'two-way', on: 'change', type: 'string'}

	function onInput (ev) {
	  const elem = ev.target
	  const params = elem[secret.params]
	  if (ev.type === 'submit') {
	    syncStateWithForm(elem)
	  } else if (elem[secret.bound] && params.on.indexOf(ev.type) !== -1) {
	    syncStateWithElement(elem)
	  }
	}

	function bindable (elem, state, next) {
	  if (elem.nodeType !== 1) return

	  elem.$bindable = $bindable
	  next()
	  elem.$attribute('bind', bindAttribute)
	}
	bindable.$name = 'bindable'
	bindable.$require = ['observe', 'attributes']
	module.exports = bindable

	function $bindable (params) {
	  this[secret.params] = Object.assign({}, defaultParams, params)
	}

	function bindAttribute (newParams) {
	  const params = this[secret.params]

	  if (params) {
	    if (newParams && typeof newParams === 'string') {
	      const tokens = newParams.match(paramsRegex)
	      params.mode = tokens[0] || params.mode,
	      params.on = tokens[1] ? tokens[1].split(',') : params.on,
	      params.type = tokens[2] || params.type
	    } else if (newParams && typeof newParams === 'object') {
	      Object.assign(params, newParams)
	    }
	    if (!Array.isArray(params.on)) {
	      params.on = [params.on]
	    }
	    bindElement(this)
	    this[secret.bound] = true
	  }
	}

	function bindElement (elem) {
	  const params = elem[secret.params]
	  if (params.mode === 'two-way' && !elem[secret.signal]) {
	    Promise.resolve().then(() => elem[secret.signal] = elem.$observe(syncElementWithState, elem))
	  } else if (params.mode === 'one-time') {
	    Promise.resolve().then(() => syncElementWithState(elem))
	    if (elem[secret.signal]) {
	      elem[secret.signal].unobserve()
	      elem[secret.signal] = undefined
	    }
	  } else if (params.mode === 'one-way' && elem[secret.signal]) {
	    elem[secret.signal].unobserve()
	    elem[secret.signal] = undefined
	  }
	  registerListeners(elem, params)
	}

	function registerListeners (elem, params) {
	  const root = elem.$root
	  let bindEvents = root[secret.bindEvents]
	  if (!bindEvents) {
	    bindEvents = root[secret.bindEvents] = new Set()
	  }
	  if (!root[secret.preventSubmit]) {
	    root.addEventListener('submit', preventDefault, true)
	    root[secret.preventSubmit] = true
	  }
	  for (let eventName of params.on) {
	    if (!bindEvents.has(eventName)) {
	      root.addEventListener(eventName, onInput, true)
	      bindEvents.add(eventName)
	    }
	  }
	}

	function preventDefault (ev) {
	  ev.preventDefault()
	}

	function syncElementWithState (elem) {
	  const params = elem[secret.params]
	  const value = getValue(elem.$state, elem.name)
	  if (elem.type === 'radio' || elem.type === 'checkbox') {
	    elem.checked = (value === toType(elem.value, params.type))
	  } else if (elem.value !== toType(value)) {
	    elem.value = toType(value)
	  }
	}

	function syncStateWithElement (elem) {
	  const params = elem[secret.params]
	  if (elem.type === 'radio' || elem.type === 'checkbox') {
	    const value = elem.checked ? toType(elem.value, params.type) : undefined
	    setValue(elem.$state, elem.name, value)
	  } else {
	    setValue(elem.$state, elem.name, toType(elem.value, params.type))
	  }
	}

	function syncStateWithForm (form) {
	  Array.prototype.forEach.call(form.elements, syncStateWithFormControl)
	}

	function syncStateWithFormControl (elem) {
	  if (elem[secret.bound]) {
	    const params = elem[secret.params]
	    if (params.on.indexOf('submit') !== -1) {
	      syncStateWithElement(elem)
	    }
	  }
	}

	function toType (value, type) {
	  if (value === '') return undefined
	  if (value === undefined) return ''
	  if (type === 'string') return String(value)
	  else if (type === 'number') return Number(value)
	  else if (type === 'boolean') return Boolean(value)
	  else if (type === 'date') return new Date(value)
	  return value
	}

	function getValue (state, name) {
	  const tokens = name.split('.')
	  let value = state
	  for (let token of tokens) {
	    value = value[token]
	  }
	  return value
	}

	function setValue (state, name, value) {
	  const tokens = name.split('.')
	  const propName = tokens.pop()
	  let parent = state
	  for (let token of tokens) {
	    parent = parent[token]
	  }
	  parent[propName] = value
	}


/***/ },
/* 27 */
/***/ function(module, exports) {

	'use strict'

	function bind (elem) {
	  if (!elem.nodeType === 1) return

	  if (isInput(elem)) {
	    elem.$bindable({
	      mode: 'two-way',
	      on: elem.form ? 'submit' : 'change',
	      type: getType(elem)
	    })
	  }
	}
	bind.$name = 'bind'
	bind.$require = ['bindable']
	module.exports = bind

	function isInput (elem) {
	  const tagName = elem.tagName
	  return (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA')
	}

	function getType (elem) {
	  if (elem.tagName === 'INPUT') {
	    if (elem.type === 'checkbox') {
	      return 'boolean'
	    }
	    if (elem.type === 'number' || elem.type === 'range' || elem.type === 'week') {
	      return 'number'
	    }
	    if (elem.type === 'date' || elem.type === 'datetime') {
	      return 'date'
	    }
	    if (elem.type === 'datetime-local' || elem.type === 'month') {
	      return 'date'
	    }
	  }
	  return 'string'
	}


/***/ },
/* 28 */
/***/ function(module, exports) {

	'use strict'

	function style (elem) {
	  if (elem.nodeType !== 1) return

	  elem.$attribute('class', classAttribute)
	  elem.$attribute('style', styleAttribute)
	}
	style.$name = 'style'
	style.$require = ['attributes']
	module.exports = style

	function classAttribute (classes) {
	  if (typeof classes === 'object') {
	    for (var item in classes) {
	      if (classes[item]) {
	        this.classList.add(item)
	      } else if (this.className) {
	        this.classList.remove(item)
	      }
	    }
	  } else if (this.className !== classes) {
	    this.className = classes
	  }
	}

	function styleAttribute (styles) {
	  if (typeof styles === 'object') {
	    Object.assign(this.style, styles)
	  } else if (this.style.cssText !== styles) {
	    this.style.cssText = styles
	  }
	}


/***/ },
/* 29 */
/***/ function(module, exports) {

	'use strict'

	const secret = {
	  entering: Symbol('during entering animation'),
	  leaving: Symbol('during leaving animation'),
	  position: Symbol('animated element position'),
	  parent: Symbol('parent node of leaving node'),
	  listening: Symbol('listening for animationend')
	}
	const watchedNodes = new Map()
	let checkQueued = false

	function onAnimationEnd (ev) {
	  const elem = ev.target
	  if (elem[secret.leaving]) {
	    elem.remove()
	  }
	  if (elem[secret.entering]) {
	    elem.style.animation = ''
	    elem[secret.entering] = false
	  }
	}

	function animate (elem) {
	  if (elem.nodeType !== 1) return

	  elem.$attribute('enter-animation', enterAttribute)
	  elem.$attribute('leave-animation', leaveAttribute)
	  elem.$attribute('move-animation', moveAttribute)

	  queueCheck()
	  elem.$cleanup(queueCheck)
	}
	animate.$name = 'animate'
	animate.$require = ['attributes']
	module.exports = animate

	function enterAttribute (animation) {
	  if (this[secret.entering] !== false) {
	    this[secret.entering] = true
	    if (typeof animation === 'object' && animation) {
	      animation = animationObjectToString(animation)
	    } else if (typeof animation === 'string') {
	      animation = animation
	    }
	    this.style.animation = animation
	    setAnimationDefaults(this)
	    registerListener(this)
	  }
	}

	function leaveAttribute (animation) {
	  if (!this[secret.parent]) {
	    this[secret.parent] = this.parentNode
	    this.$cleanup(onLeave, animation)
	  }
	  getPosition(this)
	  registerListener(this)
	}

	function getPosition (node) {
	  let position = watchedNodes.get(node)
	  if (!position) {
	    position = {}
	    watchedNodes.set(node, position)
	    node.$cleanup(unwatch)
	  }
	  return position
	}

	function registerListener (elem) {
	  const root = elem.$root
	  if (!root[secret.listening]) {
	    root.addEventListener('animationend', onAnimationEnd, true)
	    root[secret.listening] = true
	  }
	}

	function onLeave (animation) {
	  this[secret.leaving] = true
	  if (typeof animation === 'object' && animation) {
	    animation = animationObjectToString(animation)
	  } else if (typeof animation === 'string') {
	    animation = animation
	  }
	  this.style.animation = animation
	  setAnimationDefaults(this)

	  this[secret.parent].appendChild(this)
	  if (shouldAbsolutePosition(this)) {
	    toAbsolutePosition(this)
	  }
	}

	function moveAttribute (transition) {
	  const position = getPosition(this)
	  position.move = true

	  if (typeof transition === 'object' && transition) {
	    transition = 'transform ' + transitionObjectToString(transition)
	  } else if (typeof transition === 'string') {
	    transition = 'transform ' + transition
	  } else {
	    transition = 'transform'
	  }
	  this.style.transition = transition
	  setTransitionDefaults(this)
	}

	function unwatch () {
	  watchedNodes.delete(this)
	}

	function queueCheck () {
	  if (!checkQueued) {
	    checkQueued = true
	    requestAnimationFrame(checkWatchedNodes)
	    requestAnimationFrame(moveWatchedNodes)
	  }
	}

	function checkWatchedNodes () {
	  watchedNodes.forEach(checkWatchedNode)
	  checkQueued = false
	}

	function checkWatchedNode (position, node) {
	  const prevTop = position.top
	  const prevLeft = position.left

	  position.top = node.offsetTop
	  position.left = node.offsetLeft
	  position.height = node.offsetHeight
	  position.width = node.offsetWidth + 1

	  position.xDiff = (prevLeft - position.left) || 0
	  position.yDiff = (prevTop - position.top) || 0
	}

	function moveWatchedNodes () {
	  watchedNodes.forEach(moveWatchedNode)
	}

	function moveWatchedNode (position, node) {
	  if (position.move) {
	    const style = node.style
	    const transition = style.transition
	    style.transition = ''
	    style.transform = `translate(${position.xDiff}px, ${position.yDiff}px)`
	    requestAnimationFrame(() => {
	      style.transition = transition
	      style.transform = ''
	    })
	  }
	}

	function animationObjectToString (animation) {
	  return [
	    animation.name,
	    timeToString(animation.duration),
	    animation.timingFunction,
	    timeToString(animation.delay),
	    animation.iterationCount,
	    animation.direction,
	    animation.fillMode,
	    boolToPlayState(animation.playState)
	  ].join(' ')
	}

	function transitionObjectToString (transition) {
	  return [
	    timeToString(transition.duration),
	    timeToString(transition.delay),
	    transition.timingFunction
	  ].join(' ')
	}

	function setAnimationDefaults (elem) {
	  const style = elem.style
	  const duration = style.animationDuration
	  const fillMode = style.animationFillMode
	  if (duration === 'initial' || duration === '' || duration === '0s') {
	    style.animationDuration = '1s'
	  }
	  if (fillMode === 'initial' || fillMode === '' || fillMode === 'none') {
	    style.animationFillMode = 'both'
	  }
	}

	function setTransitionDefaults (elem) {
	  const style = elem.style
	  const duration = style.transitionDuration
	  if (duration === 'initial' || duration === '' || duration === '0s') {
	    style.transitionDuration = '1s'
	  }
	}

	function shouldAbsolutePosition (elem) {
	  elem = elem.parentNode
	  while (elem && elem !== elem.$root) {
	    if (elem[secret.leaving]) return false
	    elem = elem.parentNode
	  }
	  return true
	}

	function toAbsolutePosition (elem) {
	  const style = elem.style
	  const position = watchedNodes.get(elem)
	  style.top = style.top || `${position.top}px`
	  style.left = style.left || `${position.left}px`
	  style.width = `${position.width}px`
	  style.height = `${position.height}px`
	  style.margin = '0'
	  style.boxSizing = 'border-box'
	  style.position = 'absolute'
	}

	function timeToString (time) {
	  return (typeof time === 'number') ? time + 'ms' : time
	}

	function boolToPlayState (bool) {
	  return (bool === false || bool === 'paused') ? 'paused' : 'running'
	}


/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const dom = __webpack_require__(25)

	const symbols = {
	  config: Symbol('router config')
	}
	const rootRouters = new Set()

	window.addEventListener('popstate', routeFromRoot)

	function routeFromRoot () {
	  rootRouters.forEach(routeRouterAndChildren)
	}

	function route (router) {
	  setupRouter(router)
	  extractViews(router)
	  routeRouterAndChildren(router)
	}
	route.$name = 'router'
	route.$type = 'component'
	module.exports = route

	function setupRouter (router) {
	  router[symbols.config] = {
	    children: new Set(),
	    templates: new Map()
	  }

	  const parentRouter = dom.findAncestor(router, isRouter)
	  if (parentRouter) {
	    router.$routerLevel = parentRouter.$routerLevel + 1
	    const siblingRouters = parentRouter[symbols.config].children
	    siblingRouters.add(router)
	    router.$cleanup(cleanupRouter, siblingRouters)
	  } else {
	    router.$routerLevel = 0
	    rootRouters.add(router)
	    router.$cleanup(cleanupRouter, rootRouters)
	  }
	}

	function isRouter (node) {
	  return node[symbols.config] !== undefined
	}

	function cleanupRouter (siblingRouters) {
	  siblingRouters.delete(this)
	}

	function extractViews (router) {
	  const config = router[symbols.config]
	  let child = router.firstChild
	  while (child) {
	    if (child.nodeType === 1) {
	      const route = child.getAttribute('route')
	      if (route) {
	        config.templates.set(route, child)
	      } else {
	        throw new Error('router children must have a non empty route attribute')
	      }
	      if (child.hasAttribute('default-route')) {
	        config.defaultView = route
	      }
	    }
	    child.remove()
	    child = router.firstChild
	  }
	}

	function routeRouterAndChildren (router) {
	  const route = history.state.route
	  const config = router[symbols.config]
	  const templates = config.templates
	  const defaultView = config.defaultView
	  const currentView = config.currentView
	  let nextView = route[router.$routerLevel]
	  let useDefault = false

	  if (!templates.has(nextView) && templates.has(defaultView)) {
	    nextView = defaultView
	    useDefault = true
	  }

	  let defaultPrevented = false
	  if (currentView !== nextView) {
	    const routeEvent = dispatchRouteEvent(router, currentView, nextView)
	    defaultPrevented = routeEvent.defaultPrevented
	    if (!defaultPrevented) {
	      routeRouter(router, nextView)
	      if (useDefault) {
	        route[router.$routerLevel] = defaultView
	        const state = Object.assign({}, history.state, { route })
	        history.replaceState(state, '')
	      }
	    }
	  } else if (!defaultPrevented) {
	    config.children.forEach(routeRouterAndChildren)
	  }
	}

	function dispatchRouteEvent (router, fromView, toView) {
	  const eventConfig = {
	    bubbles: true,
	    cancelable: true,
	    detail: { from: fromView, to: toView, level: router.$routerLevel }
	  }
	  const routeEvent = new CustomEvent('route', eventConfig)
	  router.dispatchEvent(routeEvent)
	  return routeEvent
	}

	function routeRouter (router, nextView) {
	  const config = router[symbols.config]
	  config.currentView = nextView
	  router.innerHTML = ''
	  const template = config.templates.get(nextView)
	  if (template) {
	    router.appendChild(document.importNode(template, true))
	  }
	}


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const util = __webpack_require__(32)

	const symbols = {
	  config: Symbol('params sync config')
	}
	const watchedParams = new Map()
	let urlParams = {}

	window.addEventListener('popstate', () => syncStatesWithParams(false))

	module.exports = function paramsFactory (paramsConfig) {
	  paramsConfig = paramsConfig || {}

	  function params (elem, state, next) {
	    const config = elem[symbols.config] = {
	      tagName: elem.getAttribute('is') || elem.tagName,
	      params: paramsConfig,
	      elem
	    }
	    watchedParams.set(config, state)
	    elem.$cleanup(unwatch, config)

	    syncStateWithParams(state, config)
	    syncUrlWithParams()
	    next()
	    config.signal = elem.$observe(syncParamsWithState, state, config)
	  }
	  params.$name = 'params'
	  params.$require = ['observe']
	  params.$type = 'component'
	  return params
	}

	function unwatch (config) {
	  watchedParams.delete(config)
	}

	function syncStatesWithParams (historyChanged) {
	  const paramsEvent = new CustomEvent('params', {
	    bubbles: true,
	    cancelable: true,
	    detail: {params: (history.state || {}).params || {}, history: historyChanged}
	  })
	  document.dispatchEvent(paramsEvent)

	  if (!paramsEvent.defaultPrevented) {
	    urlParams = {}
	    watchedParams.forEach(syncStateWithParams)
	    const url = location.pathname + util.toQuery(urlParams)
	    util.updateState(history.state, '', url, historyChanged)
	  }
	}

	function syncUrlWithParams () {
	  const url = location.pathname + util.toQuery(urlParams)
	  history.replaceState(history.state, '', url)
	}

	function syncStateWithParams (state, config) {
	  if (!document.documentElement.contains(config.elem)) {
	    return
	  }
	  const params = history.state.params
	  const paramsConfig = config.params

	  for (let paramName in paramsConfig) {
	    let param = params[paramName]
	    const paramConfig = paramsConfig[paramName]

	    if (param === undefined && paramConfig.durable) {
	      param = localStorage.getItem(paramName)
	    }
	    if (param === undefined && paramConfig.required) {
	      throw new Error(`${paramName} is a required parameter in ${config.tagName}`)
	    }
	    if (param === undefined) {
	      param = paramConfig.default
	    }
	    param = convertParam(param, paramConfig.type)
	    state[paramName] = param
	    if (paramConfig.url) {
	      urlParams[paramName] = param
	    }
	  }
	  if (config.signal) {
	    config.signal.unqueue()
	  }
	}

	function syncParamsWithState (state, config) {
	  const params = history.state.params
	  const paramsConfig = config.params
	  let historyChanged = false
	  let paramsChanged = false

	  for (let paramName in paramsConfig) {
	    const paramConfig = paramsConfig[paramName]
	    let param = state[paramName]
	    let isDefault = false
	    if (param === undefined) {
	      param = paramConfig.default
	      isDefault = true
	    }

	    if (params[paramName] !== param) {
	      if (paramConfig.readOnly && isDefault) {
	        throw new Error(`${paramName} is readOnly, but it was set from ${params[paramName]} to ${param} in ${config.tagName}`)
	      }
	      params[paramName] = param
	      paramsChanged = true
	      historyChanged = historyChanged || paramConfig.history
	    }
	    if (paramConfig.durable) {
	      localStorage.setItem(paramName, param)
	    }
	  }
	  if (paramsChanged) {
	    syncStatesWithParams(historyChanged)
	  }
	}

	function convertParam (param, type) {
	  if (param === undefined) {
	    return param
	  }
	  if (type === 'number') {
	    return Number(param)
	  }
	  if (type === 'boolean') {
	    return Boolean(param)
	  }
	  if (type === 'date') {
	    return new Date(param)
	  }
	  return param
	}


/***/ },
/* 32 */
/***/ function(module, exports) {

	'use strict'

	let shouldThrottle
	throttle()

	function toQuery (params) {
	  const query = []
	  for (let key in params) {
	    const param = params[key]
	    if (param !== undefined) {
	      query.push(`${key}=${param}`)
	    }
	  }
	  return query.length ? ('?' + query.join('&')) : ''
	}

	function toParams (query) {
	  if (query[0] === '?') {
	    query = query.slice(1)
	  }
	  query = decodeURI(query).split('&')

	  const params = {}
	  for (let keyValue of query) {
	    keyValue = keyValue.split('=')
	    if (keyValue.length === 2) {
	      params[keyValue[0]] = keyValue[1]
	    }
	  }
	  return params
	}

	function toPath (route) {
	  return '/' + normalizeRoute(route).join('/')
	}

	function toRoute (path) {
	  return normalizeRoute(path.split('/'))
	}

	function toAbsolute (route, level) {
	  if (route[0] === '.' || route[0] === '..') {
	    if (route[0] === '.') {
	      route.shift()
	    }
	    let depth = 0
	    while (route[0] === '..') {
	      route.shift()
	      depth++
	    }
	    return history.state.route.slice(0, level - depth).concat(route)
	  }
	  return route
	}

	function normalizeRoute (route) {
	  const result = []
	  let parentOver, selfOver = false

	  for (let token of route) {
	    if (token === '..') {
	      if (parentOver) {
	        result.pop()
	      } else {
	        result.push(token)
	      }
	    } else if (token === '.' && !selfOver) {
	      result.push(token)
	    } else if (token !== '') {
	      result.push(token)
	    }
	    selfOver = true
	  }
	  return result
	}

	function updateState (state, title, url, updateHistory) {
	  if (updateHistory && !shouldThrottle) {
	    history.pushState(state, title, url)
	    throttle()
	  } else {
	    history.replaceState(state, title, url)
	  }
	}

	function throttle () {
	  if (!shouldThrottle) {
	    shouldThrottle = true
	    requestAnimationFrame(unthrottle)
	  }
	}

	function unthrottle () {
	  shouldThrottle = false
	}

	module.exports = {
	  toQuery,
	  toParams,
	  toPath,
	  toRoute,
	  toAbsolute,
	  updateState
	}


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	module.exports = __webpack_require__(34)


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const dom = __webpack_require__(25)
	const util = __webpack_require__(32)
	const symbols = __webpack_require__(35)
	const activity = __webpack_require__(36)

	const popstateConfig = {bubbles: true, cancelable: true}

	// init history
	updateHistory({
	  route: util.toRoute(location.pathname),
	  params: util.toParams(location.search),
	  options: {history: false}
	})

	function ref (elem) {
	  if (elem.nodeType !== 1) return

	  elem.$route = $route
	  if (elem.tagName === 'A') {
	    elem.$attribute('iref-params', {
	      init: initAnchor,
	      handler: irefParamsAttribute
	    })
	    elem.$attribute('iref-options', {
	      init: initAnchor,
	      handler: irefOptionsAttribute
	    })
	    elem.$attribute('iref', {
	      init: initAnchor,
	      handler: irefAttribute,
	      type: ['']
	    })
	  }
	}
	ref.$name = 'ref'
	ref.$require = ['attributes']
	module.exports = ref

	function initAnchor () {
	  if (!this[symbols.config]) {
	    const parentLevel = dom.findAncestorProp(this, '$routerLevel')
	    this[symbols.config] = {
	      level: (parentLevel === undefined) ? 0 : parentLevel + 1
	    }
	    activity.register(this)
	    this.$cleanup(activity.unregister, this)
	  }
	}

	function irefAttribute (path) {
	  const config = this[symbols.config]
	  config.route = util.toAbsolute(util.toRoute(path), config.level)

	  const route = history.state.route
	  for (let i = 0; i <= config.level; i++) {
	    activity.updateRouteMatch(this, route[i], i)
	  }
	  this.href = util.toPath(config.route) + (this.search || '')
	  this.addEventListener('click', onAnchorClick, true)
	}

	function irefParamsAttribute (params) {
	  this[symbols.config].params = params
	  activity.updateParamsMatch(this)
	  this.href = (this.pathname || '') + util.toQuery(params)
	  this.addEventListener('click', onAnchorClick, true)
	}

	function irefOptionsAttribute (options) {
	  this[symbols.config].options = options
	}

	function onAnchorClick (ev) {
	  updateHistory(this[symbols.config])
	  ev.preventDefault()
	}

	function $route (config) {
	  if (config.to) {
	    const parentLevel = dom.findAncestorProp(this, '$routerLevel')
	    const level = (parentLevel === undefined) ? 0 : parentLevel + 1
	    config.route = util.toAbsolute(util.toRoute(config.to), level)
	  }
	  updateHistory(config)
	}

	function updateHistory (config) {
	  const route = config.route || history.state.route
	  let params = config.params || {}
	  const options = config.options || {}

	  if (options.inherit) {
	    params = Object.assign(history.state.params, params)
	  }
	  const url = util.toPath(route)
	  util.updateState({route, params}, '', url, (options.history !== false))
	  document.dispatchEvent(new Event('popstate', popstateConfig))
	  window.scroll(0, 0)
	}


/***/ },
/* 35 */
/***/ function(module, exports) {

	'use strict'

	module.exports = {
	  config: Symbol('ref config')
	}


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const symbols = __webpack_require__(35)
	const anchors = new Set()

	window.addEventListener('route', onRoute)
	window.addEventListener('params', onParams)

	function onRoute (ev) {
	  if (!ev.defaultPrevented) {
	    for (let anchor of anchors) {
	      updateRouteMatch(anchor, ev.detail.to, ev.detail.level)
	    }
	  }
	}

	function onParams () {
	  anchors.forEach(updateParamsMatch)
	}

	function register (anchor) {
	  const config = anchor[symbols.config]
	  config.routeMismatches = new Set()
	  config.paramsMatch = true
	  anchors.add(anchor)
	}

	function unregister (anchor) {
	  anchors.delete(anchor)
	}

	function updateRouteMatch (anchor, view, level) {
	  const config = anchor[symbols.config]
	  const route = config.route

	  if (route) {
	    if (route[level] === view) {
	      config.routeMismatches.delete(level)
	    } else if (route[level]) {
	      config.routeMismatches.add(level)
	    }
	  }
	  updateActivity(anchor)
	}

	function updateParamsMatch (anchor) {
	  const config = anchor[symbols.config]
	  const anchorParams = config.params

	  if (anchorParams) {
	    const params = history.state.params
	    for (let key in anchorParams) {
	      if (anchorParams[key] !== params[key]) {
	        config.paramsMatch = false
	        return updateActivity(anchor)
	      }
	    }
	  }
	  config.paramsMatch = true
	  updateActivity(anchor)
	}

	function updateActivity (anchor) {
	  const config = anchor[symbols.config]
	  if (config.routeMismatches.size || !config.paramsMatch) {
	    anchor.classList.remove('active')
	    config.isActive = false
	  } else {
	    anchor.classList.add('active')
	    config.isActive = true
	  }
	}

	module.exports = {
	  register,
	  unregister,
	  updateRouteMatch,
	  updateParamsMatch
	}


/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const observer = __webpack_require__(38)

	function observe (node, state) {
	  node.$contextState = observer.observable(node.$contextState)
	  node.$state = observer.observable(node.$state)

	  node.$observe = $observe
	}
	observe.$name = 'observe'
	module.exports = observe

	function $observe (fn, ...args) {
	  args.unshift(fn, this)
	  const signal = observer.observe.apply(null, args)
	  this.$cleanup(unobserve, signal)
	  return signal
	}

	function unobserve (signal) {
	  signal.unobserve()
	}


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	module.exports = __webpack_require__(39)


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const nextTick = __webpack_require__(40)
	const builtIns = __webpack_require__(41)
	const wellKnowSymbols = __webpack_require__(46)

	const proxies = new WeakMap()
	const observers = new WeakMap()
	const queuedObservers = new Set()
	const enumerate = Symbol('enumerate')
	let queued = false
	let currentObserver
	const handlers = {get, ownKeys, set, deleteProperty}

	module.exports = {
	  observe,
	  observable,
	  isObservable
	}

	function observe (fn, context, ...args) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('First argument must be a function')
	  }
	  args = args.length ? args : undefined
	  const observer = {fn, context, args, observedKeys: [], exec, unobserve, unqueue}
	  runObserver(observer)
	  return observer
	}

	function exec () {
	  runObserver(this)
	}

	function unobserve () {
	  if (this.fn) {
	    this.observedKeys.forEach(unobserveKey, this)
	    this.fn = this.context = this.args = this.observedKeys = undefined
	    queuedObservers.delete(this)
	  }
	}

	function unqueue () {
	  queuedObservers.delete(this)
	}

	function observable (obj) {
	  obj = obj || {}
	  if (typeof obj !== 'object') {
	    throw new TypeError('first argument must be an object or undefined')
	  }
	  return proxies.get(obj) || toObservable(obj)
	}

	function toObservable (obj) {
	  let observable
	  const builtIn = builtIns.get(obj.constructor)
	  if (typeof builtIn === 'function') {
	    observable = builtIn(obj, registerObserver, queueObservers)
	  } else if (!builtIn) {
	    observable = new Proxy(obj, handlers)
	  } else {
	    observable = obj
	  }
	  proxies.set(obj, observable)
	  proxies.set(observable, observable)
	  observers.set(obj, new Map())
	  return observable
	}

	function isObservable (obj) {
	  if (typeof obj !== 'object') {
	    throw new TypeError('first argument must be an object')
	  }
	  return (proxies.get(obj) === obj)
	}

	function get (target, key, receiver) {
	  if (key === '$raw') return target
	  const result = Reflect.get(target, key, receiver)
	  if (typeof key === 'symbol' && wellKnowSymbols.has(key)) {
	    return result
	  }
	  const isObject = (typeof result === 'object' && result)
	  const observable = isObject && proxies.get(result)
	  if (currentObserver) {
	    registerObserver(target, key)
	    if (isObject) {
	      return observable || toObservable(result)
	    }
	  }
	  return observable || result
	}

	function registerObserver (target, key) {
	  if (currentObserver) {
	    const observersForTarget = observers.get(target)
	    let observersForKey = observersForTarget.get(key)
	    if (!observersForKey) {
	      observersForKey = new Set()
	      observersForTarget.set(key, observersForKey)
	    }
	    if (!observersForKey.has(currentObserver)) {
	      observersForKey.add(currentObserver)
	      currentObserver.observedKeys.push(observersForKey)
	    }
	  }
	}

	function ownKeys (target) {
	  registerObserver(target, enumerate)
	  return Reflect.ownKeys(target)
	}

	function set (target, key, value, receiver) {
	  if (key === 'length' || value !== Reflect.get(target, key, receiver)) {
	    queueObservers(target, key)
	    queueObservers(target, enumerate)
	  }
	  if (typeof value === 'object' && value) {
	    value = value.$raw || value
	  }
	  return Reflect.set(target, key, value, receiver)
	}

	function deleteProperty (target, key) {
	  if (Reflect.has(target, key)) {
	    queueObservers(target, key)
	    queueObservers(target, enumerate)
	  }
	  return Reflect.deleteProperty(target, key)
	}

	function queueObservers (target, key) {
	  const observersForKey = observers.get(target).get(key)
	  if (observersForKey && observersForKey.constructor === Set) {
	    observersForKey.forEach(queueObserver)
	  } else if (observersForKey) {
	    queueObserver(observersForKey)
	  }
	}

	function queueObserver (observer) {
	  if (!queued) {
	    nextTick(runObservers)
	    queued = true
	  }
	  queuedObservers.add(observer)
	}

	function runObservers () {
	  queuedObservers.forEach(runObserver)
	  queuedObservers.clear()
	  queued = false
	}

	function runObserver (observer) {
	  try {
	    currentObserver = observer
	    observer.fn.apply(observer.context, observer.args)
	  } finally {
	    currentObserver = undefined
	  }
	}

	function unobserveKey (observersForKey) {
	  observersForKey.delete(this)
	}


/***/ },
/* 40 */
/***/ function(module, exports) {

	'use strict'

	let promise = Promise.resolve()
	let mutateWithTask
	let currTask

	module.exports = function nextTick (task) {
	  currTask = task
	  if (mutateWithTask) {
	    mutateWithTask()
	  } else {
	    promise = promise.then(task)
	  }
	}

	if (typeof MutationObserver !== 'undefined') {
	  let counter = 0
	  const observer = new MutationObserver(onTask)
	  const textNode = document.createTextNode(String(counter))
	  observer.observe(textNode, {characterData: true})

	  mutateWithTask = function mutateWithTask () {
	    counter = (counter + 1) % 2
	    textNode.textContent = counter
	  }
	}

	function onTask () {
	  if (currTask) {
	    currTask()
	  }
	}


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const MapShim = __webpack_require__(42)
	const SetShim = __webpack_require__(43)
	const WeakMapShim = __webpack_require__(44)
	const WeakSetShim = __webpack_require__(45)

	module.exports = new Map([
	  [Map, MapShim],
	  [Set, SetShim],
	  [WeakMap, WeakMapShim],
	  [WeakSet, WeakSetShim],
	  [Date, true],
	  [RegExp, true]
	])


/***/ },
/* 42 */
/***/ function(module, exports) {

	'use strict'

	const native = Map.prototype
	const masterKey = Symbol('Map master key')

	const getters = ['has', 'get']
	const iterators = ['forEach', 'keys', 'values', 'entries', Symbol.iterator]
	const all = ['set', 'delete', 'clear'].concat(getters, iterators)

	module.exports = function shim (target, registerObserver, queueObservers) {
	  target.$raw = {}

	  for (let method of all) {
	    target.$raw[method] = function () {
	      native[method].apply(target, arguments)
	    }
	  }

	  for (let getter of getters) {
	    target[getter] = function (key) {
	      registerObserver(this, key)
	      return native[getter].apply(this, arguments)
	    }
	  }

	  for (let iterator of iterators) {
	    target[iterator] = function () {
	      registerObserver(this, masterKey)
	      return native[iterator].apply(this, arguments)
	    }
	  }

	  target.set = function (key, value) {
	    if (this.get(key) !== value) {
	      queueObservers(this, key)
	      queueObservers(this, masterKey)
	    }
	    return native.set.apply(this, arguments)
	  }

	  target.delete = function (key) {
	    if (this.has(key)) {
	      queueObservers(this, key)
	      queueObservers(this, masterKey)
	    }
	    return native.delete.apply(this, arguments)
	  }

	  target.clear = function () {
	    if (this.size) {
	      queueObservers(this, masterKey)
	    }
	    return native.clear.apply(this, arguments)
	  }

	  return target
	}


/***/ },
/* 43 */
/***/ function(module, exports) {

	'use strict'

	const native = Set.prototype
	const masterValue = Symbol('Set master value')

	const getters = ['has']
	const iterators = ['forEach', 'keys', 'values', 'entries', Symbol.iterator]
	const all = ['add', 'delete', 'clear'].concat(getters, iterators)

	module.exports = function shim (target, registerObserver, queueObservers) {
	  target.$raw = {}

	  for (let method of all) {
	    target.$raw[method] = function () {
	      native[method].apply(target, arguments)
	    }
	  }

	  for (let getter of getters) {
	    target[getter] = function (value) {
	      registerObserver(this, value)
	      return native[getter].apply(this, arguments)
	    }
	  }

	  for (let iterator of iterators) {
	    target[iterator] = function () {
	      registerObserver(this, masterValue)
	      return native[iterator].apply(this, arguments)
	    }
	  }

	  target.add = function (value) {
	    if (!this.has(value)) {
	      queueObservers(this, value)
	      queueObservers(this, masterValue)
	    }
	    return native.add.apply(this, arguments)
	  }

	  target.delete = function (value) {
	    if (this.has(value)) {
	      queueObservers(this, value)
	      queueObservers(this, masterValue)
	    }
	    return native.delete.apply(this, arguments)
	  }

	  target.clear = function () {
	    if (this.size) {
	      queueObservers(this, masterValue)
	    }
	    return native.clear.apply(this, arguments)
	  }

	  return target
	}


/***/ },
/* 44 */
/***/ function(module, exports) {

	'use strict'

	const native = WeakMap.prototype

	const getters = ['has', 'get']
	const all = ['set', 'delete'].concat(getters)

	module.exports = function shim (target, registerObserver, queueObservers) {
	  target.$raw = {}

	  for (let method of all) {
	    target.$raw[method] = function () {
	      native[method].apply(target, arguments)
	    }
	  }

	  for (let getter of getters) {
	    target[getter] = function (key) {
	      registerObserver(this, key)
	      return native[getter].apply(this, arguments)
	    }
	  }

	  target.set = function (key, value) {
	    if (this.get(key) !== value) {
	      queueObservers(this, key)
	    }
	    return native.set.apply(this, arguments)
	  }

	  target.delete = function (key) {
	    if (this.has(key)) {
	      queueObservers(this, key)
	    }
	    return native.delete.apply(this, arguments)
	  }

	  return target
	}


/***/ },
/* 45 */
/***/ function(module, exports) {

	'use strict'

	const native = WeakSet.prototype

	const getters = ['has']
	const all = ['add', 'delete'].concat(getters)

	module.exports = function shim (target, registerObserver, queueObservers) {
	  target.$raw = {}

	  for (let method of all) {
	    target.$raw[method] = function () {
	      native[method].apply(target, arguments)
	    }
	  }

	  for (let getter of getters) {
	    target[getter] = function (value) {
	      registerObserver(this, value)
	      return native[getter].apply(this, arguments)
	    }
	  }

	  target.add = function (value) {
	    if (!this.has(value)) {
	      queueObservers(this, value)
	    }
	    return native.add.apply(this, arguments)
	  }

	  target.delete = function (value) {
	    if (this.has(value)) {
	      queueObservers(this, value)
	    }
	    return native.delete.apply(this, arguments)
	  }

	  return target
	}


/***/ },
/* 46 */
/***/ function(module, exports) {

	'use strict'

	const wellKnowSymbols = new Set()

	for (let key of Object.getOwnPropertyNames(Symbol)) {
	  const value = Symbol[key]
	  if (typeof value === 'symbol') {
	    wellKnowSymbols.add(value)
	  }
	}

	module.exports = wellKnowSymbols


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const dom = __webpack_require__(25)
	const secret = {
	  config: Symbol('meta config')
	}

	module.exports = function metaFactory (config) {
	  function meta (elem) {
	    const parentConfig = dom.findAncestorProp(elem, secret.config)
	    config = elem[secret.config] = Object.assign({}, parentConfig, config)

	    if (config.title) {
	      document.title = config.title
	    }
	    if (config.description) {
	      setMetaTag('description', config.description)
	    }
	    if (config.author) {
	      setMetaTag('author', config.author)
	    }
	    if (config.keywords) {
	      setMetaTag('keywords', config.keywords)
	    }
	    if (config.robots) {
	      setMetaTag('robots', config.robots)
	    }
	    if (config.analytics) {
	      if (typeof ga !== 'function') {
	        throw new Error('There is no global ga (Google analytics) function.')
	      }
	      ga('set', 'page', config.analytics)
	      ga('send', 'pageview')
	    }
	  }
	  meta.$name = 'meta'
	  meta.$type = 'component'
	  return meta
	}

	function setMetaTag (name, content) {
	  let tag = document.querySelector(`meta[name="${name}"]`)
	  if (!tag) {
	    tag = document.createElement('meta')
	    tag.setAttribute('name', name)
	    document.head.appendChild(tag)
	  }
	  tag.setAttribute('content', content)
	}


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	module.exports = {
	  app: __webpack_require__(49),
	  page: __webpack_require__(50),
	  rendered: __webpack_require__(51),
	  router: __webpack_require__(52),
	  display: __webpack_require__(53),
	  control: __webpack_require__(54)
	}


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const page = __webpack_require__(50)
	const middlewares = __webpack_require__(12)

	module.exports = function app (config) {
	  config = Object.assign({root: true, isolate: 'middlewares'}, config)

	  return page(config)
	    .useOnContent(middlewares.observe)
	    .useOnContent(middlewares.interpolate)
	    .useOnContent(middlewares.attributes)
	    .useOnContent(middlewares.style)
	    .useOnContent(middlewares.animate)
	    .useOnContent(middlewares.ref)
	    .useOnContent(middlewares.flow)
	    .useOnContent(middlewares.bindable)
	    .useOnContent(middlewares.bind)
	    .useOnContent(middlewares.events)
	}


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const rendered = __webpack_require__(51)
	const middlewares = __webpack_require__(12)

	module.exports = function page (config) {
	  config = config || {}

	  return rendered(config)
	    .use(middlewares.meta(config))
	    .use(middlewares.params(config.params || {}))
	}


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const component = __webpack_require__(1)
	const middlewares = __webpack_require__(12)

	module.exports = function rendered (config) {
	  config = config || {}

	  return component(config)
	    .use(middlewares.render(config))
	}


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const component = __webpack_require__(1)
	const middlewares = __webpack_require__(12)

	module.exports = function router (config) {
	  config = Object.assign({state: false}, config)

	  return component(config)
	    .use(middlewares.route)
	}


/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const rendered = __webpack_require__(51)
	const middlewares = __webpack_require__(12)

	module.exports = function display (config) {
	  config = config || {}

	  return rendered(config)
	    .use(middlewares.props.apply(null, config.props || []))
	}


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const display = __webpack_require__(53)
	const middlewares = __webpack_require__(12)

	module.exports = function control (config) {
	  config = config || {}

	  return display(config)
	    .use(middlewares.params(config.params || {}))
	}


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	module.exports = {
	  compiler: __webpack_require__(14),
	  observer: __webpack_require__(38),
	  dom: __webpack_require__(25),
	  router: __webpack_require__(32)
	}


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const compiler = __webpack_require__(14)
	const filters = __webpack_require__(57)

	for (let name in filters) {
	  compiler.filter(name, filters[name])
	}


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	module.exports = {
	  capitalize: __webpack_require__(58),
	  uppercase: __webpack_require__(59),
	  lowercase: __webpack_require__(60),
	  unit: __webpack_require__(61),
	  json: __webpack_require__(62),
	  slice: __webpack_require__(63),
	  date: __webpack_require__(64),
	  time: __webpack_require__(65),
	  datetime: __webpack_require__(66)
	}


/***/ },
/* 58 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function capitalize (value) {
	  if (value === undefined) {
	    return value
	  }
	  value = String(value)
	  return value.charAt(0).toUpperCase() + value.slice(1)
	}


/***/ },
/* 59 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function uppercase (value) {
	  if (value === undefined) {
	    return value
	  }
	  return String(value).toUpperCase()
	}


/***/ },
/* 60 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function lowercase (value) {
	  if (value === undefined) {
	    return value
	  }
	  return String(value).toLowerCase()
	}


/***/ },
/* 61 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function unit (value, unitName, postfix) {
	  unitName = unitName || 'item'
	  postfix = postfix || 's'
	  if (isNaN(value)) {
	    return value + ' ' + unitName
	  }
	  let result = value + ' ' + unitName
	  if (value !== 1) result += postfix
	  return result
	}


/***/ },
/* 62 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function json (value, indent) {
	  if (value === undefined) {
	    return value
	  }
	  return JSON.stringify(value, null, indent)
	}


/***/ },
/* 63 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function slice (value, begin, end) {
	  if (value === undefined) {
	    return value
	  }
	  return value.slice(begin, end)
	}


/***/ },
/* 64 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function date (value) {
	  if (value instanceof Date) {
	    return value.toLocaleDateString()
	  }
	  return value
	}


/***/ },
/* 65 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function time (value) {
	  if (value instanceof Date) {
	    return value.toLocaleTimeString()
	  }
	  return value
	}


/***/ },
/* 66 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function datetime (value) {
	  if (value instanceof Date) {
	    return value.toLocaleString()
	  }
	  return value
	}


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const compiler = __webpack_require__(14)
	const limiters = __webpack_require__(68)

	for (let name in limiters) {
	  compiler.limiter(name, limiters[name])
	}


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	module.exports = {
	  if: __webpack_require__(69),
	  delay: __webpack_require__(70),
	  debounce: __webpack_require__(71),
	  throttle: __webpack_require__(72),
	  key: __webpack_require__(73)
	}


/***/ },
/* 69 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function ifLimiter (next, context, condition) {
	  if (condition) {
	    next()
	  }
	}


/***/ },
/* 70 */
/***/ function(module, exports) {

	'use strict'

	module.exports = function delay (next, context, time) {
	  if (time === undefined || isNaN(time)) {
	    time = 200
	  }
	  setTimeout(next, time)
	}


/***/ },
/* 71 */
/***/ function(module, exports) {

	'use strict'

	const timer = Symbol('debounce timer')

	module.exports = function debounce (next, context, delay) {
	  if (delay === undefined || isNaN(delay)) {
	    delay = 200
	  }
	  clearTimeout(context[timer])
	  context[timer] = setTimeout(next, delay)
	}


/***/ },
/* 72 */
/***/ function(module, exports) {

	'use strict'

	const lastExecution = Symbol('throttle last execution')

	module.exports = function throttle (next, context, threshold) {
	  if (threshold === undefined || isNaN(threshold)) {
	    threshold = 200
	  }

	  const last = context[lastExecution]
	  const now = Date.now()
	  if (!last || (last + threshold) < now) {
	    context[lastExecution] = now
	    next()
	  }
	}


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	'use strict'

	const stringToCode = __webpack_require__(74)

	module.exports = function keyLimiter (next, context, ...keys) {
	  if (!(context.$event instanceof KeyboardEvent)) {
	    return next()
	  }

	  const keyCodes = keys.map(stringToCode)
	  const keyCode = context.$event.keyCode || context.$event.which
	  if (keyCodes.indexOf(keyCode) !== -1) {
	    next()
	  }
	}


/***/ },
/* 74 */
/***/ function(module, exports) {

	// Source: http://jsfiddle.net/vWx8V/
	// http://stackoverflow.com/questions/5603195/full-list-of-javascript-keycodes

	/**
	 * Conenience method returns corresponding value for given keyName or keyCode.
	 *
	 * @param {Mixed} keyCode {Number} or keyName {String}
	 * @return {Mixed}
	 * @api public
	 */

	exports = module.exports = function(searchInput) {
	  // Keyboard Events
	  if (searchInput && 'object' === typeof searchInput) {
	    var hasKeyCode = searchInput.which || searchInput.keyCode || searchInput.charCode
	    if (hasKeyCode) searchInput = hasKeyCode
	  }

	  // Numbers
	  if ('number' === typeof searchInput) return names[searchInput]

	  // Everything else (cast to string)
	  var search = String(searchInput)

	  // check codes
	  var foundNamedKey = codes[search.toLowerCase()]
	  if (foundNamedKey) return foundNamedKey

	  // check aliases
	  var foundNamedKey = aliases[search.toLowerCase()]
	  if (foundNamedKey) return foundNamedKey

	  // weird character?
	  if (search.length === 1) return search.charCodeAt(0)

	  return undefined
	}

	/**
	 * Get by name
	 *
	 *   exports.code['enter'] // => 13
	 */

	var codes = exports.code = exports.codes = {
	  'backspace': 8,
	  'tab': 9,
	  'enter': 13,
	  'shift': 16,
	  'ctrl': 17,
	  'alt': 18,
	  'pause/break': 19,
	  'caps lock': 20,
	  'esc': 27,
	  'space': 32,
	  'page up': 33,
	  'page down': 34,
	  'end': 35,
	  'home': 36,
	  'left': 37,
	  'up': 38,
	  'right': 39,
	  'down': 40,
	  'insert': 45,
	  'delete': 46,
	  'command': 91,
	  'left command': 91,
	  'right command': 93,
	  'numpad *': 106,
	  'numpad +': 107,
	  'numpad -': 109,
	  'numpad .': 110,
	  'numpad /': 111,
	  'num lock': 144,
	  'scroll lock': 145,
	  'my computer': 182,
	  'my calculator': 183,
	  ';': 186,
	  '=': 187,
	  ',': 188,
	  '-': 189,
	  '.': 190,
	  '/': 191,
	  '`': 192,
	  '[': 219,
	  '\\': 220,
	  ']': 221,
	  "'": 222
	}

	// Helper aliases

	var aliases = exports.aliases = {
	  'windows': 91,
	  '⇧': 16,
	  '⌥': 18,
	  '⌃': 17,
	  '⌘': 91,
	  'ctl': 17,
	  'control': 17,
	  'option': 18,
	  'pause': 19,
	  'break': 19,
	  'caps': 20,
	  'return': 13,
	  'escape': 27,
	  'spc': 32,
	  'pgup': 33,
	  'pgdn': 34,
	  'ins': 45,
	  'del': 46,
	  'cmd': 91
	}


	/*!
	 * Programatically add the following
	 */

	// lower case chars
	for (i = 97; i < 123; i++) codes[String.fromCharCode(i)] = i - 32

	// numbers
	for (var i = 48; i < 58; i++) codes[i - 48] = i

	// function keys
	for (i = 1; i < 13; i++) codes['f'+i] = i + 111

	// numpad keys
	for (i = 0; i < 10; i++) codes['numpad '+i] = i + 96

	/**
	 * Get by code
	 *
	 *   exports.name[13] // => 'Enter'
	 */

	var names = exports.names = exports.title = {} // title for backward compat

	// Create reverse mapping
	for (i in codes) names[codes[i]] = i

	// Add aliases
	for (var alias in aliases) {
	  codes[alias] = aliases[alias]
	}


/***/ }
/******/ ]);