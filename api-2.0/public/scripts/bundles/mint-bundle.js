(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":3,"ieee754":4}],4:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
(function (module, exports) {
  'use strict';

  // Utils
  function assert (val, msg) {
    if (!val) throw new Error(msg || 'Assertion failed');
  }

  // Could use `inherits` module, but don't want to move from single file
  // architecture yet.
  function inherits (ctor, superCtor) {
    ctor.super_ = superCtor;
    var TempCtor = function () {};
    TempCtor.prototype = superCtor.prototype;
    ctor.prototype = new TempCtor();
    ctor.prototype.constructor = ctor;
  }

  // BN

  function BN (number, base, endian) {
    if (BN.isBN(number)) {
      return number;
    }

    this.negative = 0;
    this.words = null;
    this.length = 0;

    // Reduction context
    this.red = null;

    if (number !== null) {
      if (base === 'le' || base === 'be') {
        endian = base;
        base = 10;
      }

      this._init(number || 0, base || 10, endian || 'be');
    }
  }
  if (typeof module === 'object') {
    module.exports = BN;
  } else {
    exports.BN = BN;
  }

  BN.BN = BN;
  BN.wordSize = 26;

  var Buffer;
  try {
    if (typeof window !== 'undefined' && typeof window.Buffer !== 'undefined') {
      Buffer = window.Buffer;
    } else {
      Buffer = require('buffer').Buffer;
    }
  } catch (e) {
  }

  BN.isBN = function isBN (num) {
    if (num instanceof BN) {
      return true;
    }

    return num !== null && typeof num === 'object' &&
      num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
  };

  BN.max = function max (left, right) {
    if (left.cmp(right) > 0) return left;
    return right;
  };

  BN.min = function min (left, right) {
    if (left.cmp(right) < 0) return left;
    return right;
  };

  BN.prototype._init = function init (number, base, endian) {
    if (typeof number === 'number') {
      return this._initNumber(number, base, endian);
    }

    if (typeof number === 'object') {
      return this._initArray(number, base, endian);
    }

    if (base === 'hex') {
      base = 16;
    }
    assert(base === (base | 0) && base >= 2 && base <= 36);

    number = number.toString().replace(/\s+/g, '');
    var start = 0;
    if (number[0] === '-') {
      start++;
      this.negative = 1;
    }

    if (start < number.length) {
      if (base === 16) {
        this._parseHex(number, start, endian);
      } else {
        this._parseBase(number, base, start);
        if (endian === 'le') {
          this._initArray(this.toArray(), base, endian);
        }
      }
    }
  };

  BN.prototype._initNumber = function _initNumber (number, base, endian) {
    if (number < 0) {
      this.negative = 1;
      number = -number;
    }
    if (number < 0x4000000) {
      this.words = [ number & 0x3ffffff ];
      this.length = 1;
    } else if (number < 0x10000000000000) {
      this.words = [
        number & 0x3ffffff,
        (number / 0x4000000) & 0x3ffffff
      ];
      this.length = 2;
    } else {
      assert(number < 0x20000000000000); // 2 ^ 53 (unsafe)
      this.words = [
        number & 0x3ffffff,
        (number / 0x4000000) & 0x3ffffff,
        1
      ];
      this.length = 3;
    }

    if (endian !== 'le') return;

    // Reverse the bytes
    this._initArray(this.toArray(), base, endian);
  };

  BN.prototype._initArray = function _initArray (number, base, endian) {
    // Perhaps a Uint8Array
    assert(typeof number.length === 'number');
    if (number.length <= 0) {
      this.words = [ 0 ];
      this.length = 1;
      return this;
    }

    this.length = Math.ceil(number.length / 3);
    this.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      this.words[i] = 0;
    }

    var j, w;
    var off = 0;
    if (endian === 'be') {
      for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
        w = number[i] | (number[i - 1] << 8) | (number[i - 2] << 16);
        this.words[j] |= (w << off) & 0x3ffffff;
        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
        off += 24;
        if (off >= 26) {
          off -= 26;
          j++;
        }
      }
    } else if (endian === 'le') {
      for (i = 0, j = 0; i < number.length; i += 3) {
        w = number[i] | (number[i + 1] << 8) | (number[i + 2] << 16);
        this.words[j] |= (w << off) & 0x3ffffff;
        this.words[j + 1] = (w >>> (26 - off)) & 0x3ffffff;
        off += 24;
        if (off >= 26) {
          off -= 26;
          j++;
        }
      }
    }
    return this.strip();
  };

  function parseHex4Bits (string, index) {
    var c = string.charCodeAt(index);
    // 'A' - 'F'
    if (c >= 65 && c <= 70) {
      return c - 55;
    // 'a' - 'f'
    } else if (c >= 97 && c <= 102) {
      return c - 87;
    // '0' - '9'
    } else {
      return (c - 48) & 0xf;
    }
  }

  function parseHexByte (string, lowerBound, index) {
    var r = parseHex4Bits(string, index);
    if (index - 1 >= lowerBound) {
      r |= parseHex4Bits(string, index - 1) << 4;
    }
    return r;
  }

  BN.prototype._parseHex = function _parseHex (number, start, endian) {
    // Create possibly bigger array to ensure that it fits the number
    this.length = Math.ceil((number.length - start) / 6);
    this.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      this.words[i] = 0;
    }

    // 24-bits chunks
    var off = 0;
    var j = 0;

    var w;
    if (endian === 'be') {
      for (i = number.length - 1; i >= start; i -= 2) {
        w = parseHexByte(number, start, i) << off;
        this.words[j] |= w & 0x3ffffff;
        if (off >= 18) {
          off -= 18;
          j += 1;
          this.words[j] |= w >>> 26;
        } else {
          off += 8;
        }
      }
    } else {
      var parseLength = number.length - start;
      for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
        w = parseHexByte(number, start, i) << off;
        this.words[j] |= w & 0x3ffffff;
        if (off >= 18) {
          off -= 18;
          j += 1;
          this.words[j] |= w >>> 26;
        } else {
          off += 8;
        }
      }
    }

    this.strip();
  };

  function parseBase (str, start, end, mul) {
    var r = 0;
    var len = Math.min(str.length, end);
    for (var i = start; i < len; i++) {
      var c = str.charCodeAt(i) - 48;

      r *= mul;

      // 'a'
      if (c >= 49) {
        r += c - 49 + 0xa;

      // 'A'
      } else if (c >= 17) {
        r += c - 17 + 0xa;

      // '0' - '9'
      } else {
        r += c;
      }
    }
    return r;
  }

  BN.prototype._parseBase = function _parseBase (number, base, start) {
    // Initialize as zero
    this.words = [ 0 ];
    this.length = 1;

    // Find length of limb in base
    for (var limbLen = 0, limbPow = 1; limbPow <= 0x3ffffff; limbPow *= base) {
      limbLen++;
    }
    limbLen--;
    limbPow = (limbPow / base) | 0;

    var total = number.length - start;
    var mod = total % limbLen;
    var end = Math.min(total, total - mod) + start;

    var word = 0;
    for (var i = start; i < end; i += limbLen) {
      word = parseBase(number, i, i + limbLen, base);

      this.imuln(limbPow);
      if (this.words[0] + word < 0x4000000) {
        this.words[0] += word;
      } else {
        this._iaddn(word);
      }
    }

    if (mod !== 0) {
      var pow = 1;
      word = parseBase(number, i, number.length, base);

      for (i = 0; i < mod; i++) {
        pow *= base;
      }

      this.imuln(pow);
      if (this.words[0] + word < 0x4000000) {
        this.words[0] += word;
      } else {
        this._iaddn(word);
      }
    }

    this.strip();
  };

  BN.prototype.copy = function copy (dest) {
    dest.words = new Array(this.length);
    for (var i = 0; i < this.length; i++) {
      dest.words[i] = this.words[i];
    }
    dest.length = this.length;
    dest.negative = this.negative;
    dest.red = this.red;
  };

  BN.prototype.clone = function clone () {
    var r = new BN(null);
    this.copy(r);
    return r;
  };

  BN.prototype._expand = function _expand (size) {
    while (this.length < size) {
      this.words[this.length++] = 0;
    }
    return this;
  };

  // Remove leading `0` from `this`
  BN.prototype.strip = function strip () {
    while (this.length > 1 && this.words[this.length - 1] === 0) {
      this.length--;
    }
    return this._normSign();
  };

  BN.prototype._normSign = function _normSign () {
    // -0 = 0
    if (this.length === 1 && this.words[0] === 0) {
      this.negative = 0;
    }
    return this;
  };

  BN.prototype.inspect = function inspect () {
    return (this.red ? '<BN-R: ' : '<BN: ') + this.toString(16) + '>';
  };

  /*

  var zeros = [];
  var groupSizes = [];
  var groupBases = [];

  var s = '';
  var i = -1;
  while (++i < BN.wordSize) {
    zeros[i] = s;
    s += '0';
  }
  groupSizes[0] = 0;
  groupSizes[1] = 0;
  groupBases[0] = 0;
  groupBases[1] = 0;
  var base = 2 - 1;
  while (++base < 36 + 1) {
    var groupSize = 0;
    var groupBase = 1;
    while (groupBase < (1 << BN.wordSize) / base) {
      groupBase *= base;
      groupSize += 1;
    }
    groupSizes[base] = groupSize;
    groupBases[base] = groupBase;
  }

  */

  var zeros = [
    '',
    '0',
    '00',
    '000',
    '0000',
    '00000',
    '000000',
    '0000000',
    '00000000',
    '000000000',
    '0000000000',
    '00000000000',
    '000000000000',
    '0000000000000',
    '00000000000000',
    '000000000000000',
    '0000000000000000',
    '00000000000000000',
    '000000000000000000',
    '0000000000000000000',
    '00000000000000000000',
    '000000000000000000000',
    '0000000000000000000000',
    '00000000000000000000000',
    '000000000000000000000000',
    '0000000000000000000000000'
  ];

  var groupSizes = [
    0, 0,
    25, 16, 12, 11, 10, 9, 8,
    8, 7, 7, 7, 7, 6, 6,
    6, 6, 6, 6, 6, 5, 5,
    5, 5, 5, 5, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5
  ];

  var groupBases = [
    0, 0,
    33554432, 43046721, 16777216, 48828125, 60466176, 40353607, 16777216,
    43046721, 10000000, 19487171, 35831808, 62748517, 7529536, 11390625,
    16777216, 24137569, 34012224, 47045881, 64000000, 4084101, 5153632,
    6436343, 7962624, 9765625, 11881376, 14348907, 17210368, 20511149,
    24300000, 28629151, 33554432, 39135393, 45435424, 52521875, 60466176
  ];

  BN.prototype.toString = function toString (base, padding) {
    base = base || 10;
    padding = padding | 0 || 1;

    var out;
    if (base === 16 || base === 'hex') {
      out = '';
      var off = 0;
      var carry = 0;
      for (var i = 0; i < this.length; i++) {
        var w = this.words[i];
        var word = (((w << off) | carry) & 0xffffff).toString(16);
        carry = (w >>> (24 - off)) & 0xffffff;
        if (carry !== 0 || i !== this.length - 1) {
          out = zeros[6 - word.length] + word + out;
        } else {
          out = word + out;
        }
        off += 2;
        if (off >= 26) {
          off -= 26;
          i--;
        }
      }
      if (carry !== 0) {
        out = carry.toString(16) + out;
      }
      while (out.length % padding !== 0) {
        out = '0' + out;
      }
      if (this.negative !== 0) {
        out = '-' + out;
      }
      return out;
    }

    if (base === (base | 0) && base >= 2 && base <= 36) {
      // var groupSize = Math.floor(BN.wordSize * Math.LN2 / Math.log(base));
      var groupSize = groupSizes[base];
      // var groupBase = Math.pow(base, groupSize);
      var groupBase = groupBases[base];
      out = '';
      var c = this.clone();
      c.negative = 0;
      while (!c.isZero()) {
        var r = c.modn(groupBase).toString(base);
        c = c.idivn(groupBase);

        if (!c.isZero()) {
          out = zeros[groupSize - r.length] + r + out;
        } else {
          out = r + out;
        }
      }
      if (this.isZero()) {
        out = '0' + out;
      }
      while (out.length % padding !== 0) {
        out = '0' + out;
      }
      if (this.negative !== 0) {
        out = '-' + out;
      }
      return out;
    }

    assert(false, 'Base should be between 2 and 36');
  };

  BN.prototype.toNumber = function toNumber () {
    var ret = this.words[0];
    if (this.length === 2) {
      ret += this.words[1] * 0x4000000;
    } else if (this.length === 3 && this.words[2] === 0x01) {
      // NOTE: at this stage it is known that the top bit is set
      ret += 0x10000000000000 + (this.words[1] * 0x4000000);
    } else if (this.length > 2) {
      assert(false, 'Number can only safely store up to 53 bits');
    }
    return (this.negative !== 0) ? -ret : ret;
  };

  BN.prototype.toJSON = function toJSON () {
    return this.toString(16);
  };

  BN.prototype.toBuffer = function toBuffer (endian, length) {
    assert(typeof Buffer !== 'undefined');
    return this.toArrayLike(Buffer, endian, length);
  };

  BN.prototype.toArray = function toArray (endian, length) {
    return this.toArrayLike(Array, endian, length);
  };

  BN.prototype.toArrayLike = function toArrayLike (ArrayType, endian, length) {
    var byteLength = this.byteLength();
    var reqLength = length || Math.max(1, byteLength);
    assert(byteLength <= reqLength, 'byte array longer than desired length');
    assert(reqLength > 0, 'Requested array length <= 0');

    this.strip();
    var littleEndian = endian === 'le';
    var res = new ArrayType(reqLength);

    var b, i;
    var q = this.clone();
    if (!littleEndian) {
      // Assume big-endian
      for (i = 0; i < reqLength - byteLength; i++) {
        res[i] = 0;
      }

      for (i = 0; !q.isZero(); i++) {
        b = q.andln(0xff);
        q.iushrn(8);

        res[reqLength - i - 1] = b;
      }
    } else {
      for (i = 0; !q.isZero(); i++) {
        b = q.andln(0xff);
        q.iushrn(8);

        res[i] = b;
      }

      for (; i < reqLength; i++) {
        res[i] = 0;
      }
    }

    return res;
  };

  if (Math.clz32) {
    BN.prototype._countBits = function _countBits (w) {
      return 32 - Math.clz32(w);
    };
  } else {
    BN.prototype._countBits = function _countBits (w) {
      var t = w;
      var r = 0;
      if (t >= 0x1000) {
        r += 13;
        t >>>= 13;
      }
      if (t >= 0x40) {
        r += 7;
        t >>>= 7;
      }
      if (t >= 0x8) {
        r += 4;
        t >>>= 4;
      }
      if (t >= 0x02) {
        r += 2;
        t >>>= 2;
      }
      return r + t;
    };
  }

  BN.prototype._zeroBits = function _zeroBits (w) {
    // Short-cut
    if (w === 0) return 26;

    var t = w;
    var r = 0;
    if ((t & 0x1fff) === 0) {
      r += 13;
      t >>>= 13;
    }
    if ((t & 0x7f) === 0) {
      r += 7;
      t >>>= 7;
    }
    if ((t & 0xf) === 0) {
      r += 4;
      t >>>= 4;
    }
    if ((t & 0x3) === 0) {
      r += 2;
      t >>>= 2;
    }
    if ((t & 0x1) === 0) {
      r++;
    }
    return r;
  };

  // Return number of used bits in a BN
  BN.prototype.bitLength = function bitLength () {
    var w = this.words[this.length - 1];
    var hi = this._countBits(w);
    return (this.length - 1) * 26 + hi;
  };

  function toBitArray (num) {
    var w = new Array(num.bitLength());

    for (var bit = 0; bit < w.length; bit++) {
      var off = (bit / 26) | 0;
      var wbit = bit % 26;

      w[bit] = (num.words[off] & (1 << wbit)) >>> wbit;
    }

    return w;
  }

  // Number of trailing zero bits
  BN.prototype.zeroBits = function zeroBits () {
    if (this.isZero()) return 0;

    var r = 0;
    for (var i = 0; i < this.length; i++) {
      var b = this._zeroBits(this.words[i]);
      r += b;
      if (b !== 26) break;
    }
    return r;
  };

  BN.prototype.byteLength = function byteLength () {
    return Math.ceil(this.bitLength() / 8);
  };

  BN.prototype.toTwos = function toTwos (width) {
    if (this.negative !== 0) {
      return this.abs().inotn(width).iaddn(1);
    }
    return this.clone();
  };

  BN.prototype.fromTwos = function fromTwos (width) {
    if (this.testn(width - 1)) {
      return this.notn(width).iaddn(1).ineg();
    }
    return this.clone();
  };

  BN.prototype.isNeg = function isNeg () {
    return this.negative !== 0;
  };

  // Return negative clone of `this`
  BN.prototype.neg = function neg () {
    return this.clone().ineg();
  };

  BN.prototype.ineg = function ineg () {
    if (!this.isZero()) {
      this.negative ^= 1;
    }

    return this;
  };

  // Or `num` with `this` in-place
  BN.prototype.iuor = function iuor (num) {
    while (this.length < num.length) {
      this.words[this.length++] = 0;
    }

    for (var i = 0; i < num.length; i++) {
      this.words[i] = this.words[i] | num.words[i];
    }

    return this.strip();
  };

  BN.prototype.ior = function ior (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuor(num);
  };

  // Or `num` with `this`
  BN.prototype.or = function or (num) {
    if (this.length > num.length) return this.clone().ior(num);
    return num.clone().ior(this);
  };

  BN.prototype.uor = function uor (num) {
    if (this.length > num.length) return this.clone().iuor(num);
    return num.clone().iuor(this);
  };

  // And `num` with `this` in-place
  BN.prototype.iuand = function iuand (num) {
    // b = min-length(num, this)
    var b;
    if (this.length > num.length) {
      b = num;
    } else {
      b = this;
    }

    for (var i = 0; i < b.length; i++) {
      this.words[i] = this.words[i] & num.words[i];
    }

    this.length = b.length;

    return this.strip();
  };

  BN.prototype.iand = function iand (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuand(num);
  };

  // And `num` with `this`
  BN.prototype.and = function and (num) {
    if (this.length > num.length) return this.clone().iand(num);
    return num.clone().iand(this);
  };

  BN.prototype.uand = function uand (num) {
    if (this.length > num.length) return this.clone().iuand(num);
    return num.clone().iuand(this);
  };

  // Xor `num` with `this` in-place
  BN.prototype.iuxor = function iuxor (num) {
    // a.length > b.length
    var a;
    var b;
    if (this.length > num.length) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    for (var i = 0; i < b.length; i++) {
      this.words[i] = a.words[i] ^ b.words[i];
    }

    if (this !== a) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    this.length = a.length;

    return this.strip();
  };

  BN.prototype.ixor = function ixor (num) {
    assert((this.negative | num.negative) === 0);
    return this.iuxor(num);
  };

  // Xor `num` with `this`
  BN.prototype.xor = function xor (num) {
    if (this.length > num.length) return this.clone().ixor(num);
    return num.clone().ixor(this);
  };

  BN.prototype.uxor = function uxor (num) {
    if (this.length > num.length) return this.clone().iuxor(num);
    return num.clone().iuxor(this);
  };

  // Not ``this`` with ``width`` bitwidth
  BN.prototype.inotn = function inotn (width) {
    assert(typeof width === 'number' && width >= 0);

    var bytesNeeded = Math.ceil(width / 26) | 0;
    var bitsLeft = width % 26;

    // Extend the buffer with leading zeroes
    this._expand(bytesNeeded);

    if (bitsLeft > 0) {
      bytesNeeded--;
    }

    // Handle complete words
    for (var i = 0; i < bytesNeeded; i++) {
      this.words[i] = ~this.words[i] & 0x3ffffff;
    }

    // Handle the residue
    if (bitsLeft > 0) {
      this.words[i] = ~this.words[i] & (0x3ffffff >> (26 - bitsLeft));
    }

    // And remove leading zeroes
    return this.strip();
  };

  BN.prototype.notn = function notn (width) {
    return this.clone().inotn(width);
  };

  // Set `bit` of `this`
  BN.prototype.setn = function setn (bit, val) {
    assert(typeof bit === 'number' && bit >= 0);

    var off = (bit / 26) | 0;
    var wbit = bit % 26;

    this._expand(off + 1);

    if (val) {
      this.words[off] = this.words[off] | (1 << wbit);
    } else {
      this.words[off] = this.words[off] & ~(1 << wbit);
    }

    return this.strip();
  };

  // Add `num` to `this` in-place
  BN.prototype.iadd = function iadd (num) {
    var r;

    // negative + positive
    if (this.negative !== 0 && num.negative === 0) {
      this.negative = 0;
      r = this.isub(num);
      this.negative ^= 1;
      return this._normSign();

    // positive + negative
    } else if (this.negative === 0 && num.negative !== 0) {
      num.negative = 0;
      r = this.isub(num);
      num.negative = 1;
      return r._normSign();
    }

    // a.length > b.length
    var a, b;
    if (this.length > num.length) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    var carry = 0;
    for (var i = 0; i < b.length; i++) {
      r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
      this.words[i] = r & 0x3ffffff;
      carry = r >>> 26;
    }
    for (; carry !== 0 && i < a.length; i++) {
      r = (a.words[i] | 0) + carry;
      this.words[i] = r & 0x3ffffff;
      carry = r >>> 26;
    }

    this.length = a.length;
    if (carry !== 0) {
      this.words[this.length] = carry;
      this.length++;
    // Copy the rest of the words
    } else if (a !== this) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    return this;
  };

  // Add `num` to `this`
  BN.prototype.add = function add (num) {
    var res;
    if (num.negative !== 0 && this.negative === 0) {
      num.negative = 0;
      res = this.sub(num);
      num.negative ^= 1;
      return res;
    } else if (num.negative === 0 && this.negative !== 0) {
      this.negative = 0;
      res = num.sub(this);
      this.negative = 1;
      return res;
    }

    if (this.length > num.length) return this.clone().iadd(num);

    return num.clone().iadd(this);
  };

  // Subtract `num` from `this` in-place
  BN.prototype.isub = function isub (num) {
    // this - (-num) = this + num
    if (num.negative !== 0) {
      num.negative = 0;
      var r = this.iadd(num);
      num.negative = 1;
      return r._normSign();

    // -this - num = -(this + num)
    } else if (this.negative !== 0) {
      this.negative = 0;
      this.iadd(num);
      this.negative = 1;
      return this._normSign();
    }

    // At this point both numbers are positive
    var cmp = this.cmp(num);

    // Optimization - zeroify
    if (cmp === 0) {
      this.negative = 0;
      this.length = 1;
      this.words[0] = 0;
      return this;
    }

    // a > b
    var a, b;
    if (cmp > 0) {
      a = this;
      b = num;
    } else {
      a = num;
      b = this;
    }

    var carry = 0;
    for (var i = 0; i < b.length; i++) {
      r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
      carry = r >> 26;
      this.words[i] = r & 0x3ffffff;
    }
    for (; carry !== 0 && i < a.length; i++) {
      r = (a.words[i] | 0) + carry;
      carry = r >> 26;
      this.words[i] = r & 0x3ffffff;
    }

    // Copy rest of the words
    if (carry === 0 && i < a.length && a !== this) {
      for (; i < a.length; i++) {
        this.words[i] = a.words[i];
      }
    }

    this.length = Math.max(this.length, i);

    if (a !== this) {
      this.negative = 1;
    }

    return this.strip();
  };

  // Subtract `num` from `this`
  BN.prototype.sub = function sub (num) {
    return this.clone().isub(num);
  };

  function smallMulTo (self, num, out) {
    out.negative = num.negative ^ self.negative;
    var len = (self.length + num.length) | 0;
    out.length = len;
    len = (len - 1) | 0;

    // Peel one iteration (compiler can't do it, because of code complexity)
    var a = self.words[0] | 0;
    var b = num.words[0] | 0;
    var r = a * b;

    var lo = r & 0x3ffffff;
    var carry = (r / 0x4000000) | 0;
    out.words[0] = lo;

    for (var k = 1; k < len; k++) {
      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
      // note that ncarry could be >= 0x3ffffff
      var ncarry = carry >>> 26;
      var rword = carry & 0x3ffffff;
      var maxJ = Math.min(k, num.length - 1);
      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
        var i = (k - j) | 0;
        a = self.words[i] | 0;
        b = num.words[j] | 0;
        r = a * b + rword;
        ncarry += (r / 0x4000000) | 0;
        rword = r & 0x3ffffff;
      }
      out.words[k] = rword | 0;
      carry = ncarry | 0;
    }
    if (carry !== 0) {
      out.words[k] = carry | 0;
    } else {
      out.length--;
    }

    return out.strip();
  }

  // TODO(indutny): it may be reasonable to omit it for users who don't need
  // to work with 256-bit numbers, otherwise it gives 20% improvement for 256-bit
  // multiplication (like elliptic secp256k1).
  var comb10MulTo = function comb10MulTo (self, num, out) {
    var a = self.words;
    var b = num.words;
    var o = out.words;
    var c = 0;
    var lo;
    var mid;
    var hi;
    var a0 = a[0] | 0;
    var al0 = a0 & 0x1fff;
    var ah0 = a0 >>> 13;
    var a1 = a[1] | 0;
    var al1 = a1 & 0x1fff;
    var ah1 = a1 >>> 13;
    var a2 = a[2] | 0;
    var al2 = a2 & 0x1fff;
    var ah2 = a2 >>> 13;
    var a3 = a[3] | 0;
    var al3 = a3 & 0x1fff;
    var ah3 = a3 >>> 13;
    var a4 = a[4] | 0;
    var al4 = a4 & 0x1fff;
    var ah4 = a4 >>> 13;
    var a5 = a[5] | 0;
    var al5 = a5 & 0x1fff;
    var ah5 = a5 >>> 13;
    var a6 = a[6] | 0;
    var al6 = a6 & 0x1fff;
    var ah6 = a6 >>> 13;
    var a7 = a[7] | 0;
    var al7 = a7 & 0x1fff;
    var ah7 = a7 >>> 13;
    var a8 = a[8] | 0;
    var al8 = a8 & 0x1fff;
    var ah8 = a8 >>> 13;
    var a9 = a[9] | 0;
    var al9 = a9 & 0x1fff;
    var ah9 = a9 >>> 13;
    var b0 = b[0] | 0;
    var bl0 = b0 & 0x1fff;
    var bh0 = b0 >>> 13;
    var b1 = b[1] | 0;
    var bl1 = b1 & 0x1fff;
    var bh1 = b1 >>> 13;
    var b2 = b[2] | 0;
    var bl2 = b2 & 0x1fff;
    var bh2 = b2 >>> 13;
    var b3 = b[3] | 0;
    var bl3 = b3 & 0x1fff;
    var bh3 = b3 >>> 13;
    var b4 = b[4] | 0;
    var bl4 = b4 & 0x1fff;
    var bh4 = b4 >>> 13;
    var b5 = b[5] | 0;
    var bl5 = b5 & 0x1fff;
    var bh5 = b5 >>> 13;
    var b6 = b[6] | 0;
    var bl6 = b6 & 0x1fff;
    var bh6 = b6 >>> 13;
    var b7 = b[7] | 0;
    var bl7 = b7 & 0x1fff;
    var bh7 = b7 >>> 13;
    var b8 = b[8] | 0;
    var bl8 = b8 & 0x1fff;
    var bh8 = b8 >>> 13;
    var b9 = b[9] | 0;
    var bl9 = b9 & 0x1fff;
    var bh9 = b9 >>> 13;

    out.negative = self.negative ^ num.negative;
    out.length = 19;
    /* k = 0 */
    lo = Math.imul(al0, bl0);
    mid = Math.imul(al0, bh0);
    mid = (mid + Math.imul(ah0, bl0)) | 0;
    hi = Math.imul(ah0, bh0);
    var w0 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w0 >>> 26)) | 0;
    w0 &= 0x3ffffff;
    /* k = 1 */
    lo = Math.imul(al1, bl0);
    mid = Math.imul(al1, bh0);
    mid = (mid + Math.imul(ah1, bl0)) | 0;
    hi = Math.imul(ah1, bh0);
    lo = (lo + Math.imul(al0, bl1)) | 0;
    mid = (mid + Math.imul(al0, bh1)) | 0;
    mid = (mid + Math.imul(ah0, bl1)) | 0;
    hi = (hi + Math.imul(ah0, bh1)) | 0;
    var w1 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w1 >>> 26)) | 0;
    w1 &= 0x3ffffff;
    /* k = 2 */
    lo = Math.imul(al2, bl0);
    mid = Math.imul(al2, bh0);
    mid = (mid + Math.imul(ah2, bl0)) | 0;
    hi = Math.imul(ah2, bh0);
    lo = (lo + Math.imul(al1, bl1)) | 0;
    mid = (mid + Math.imul(al1, bh1)) | 0;
    mid = (mid + Math.imul(ah1, bl1)) | 0;
    hi = (hi + Math.imul(ah1, bh1)) | 0;
    lo = (lo + Math.imul(al0, bl2)) | 0;
    mid = (mid + Math.imul(al0, bh2)) | 0;
    mid = (mid + Math.imul(ah0, bl2)) | 0;
    hi = (hi + Math.imul(ah0, bh2)) | 0;
    var w2 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w2 >>> 26)) | 0;
    w2 &= 0x3ffffff;
    /* k = 3 */
    lo = Math.imul(al3, bl0);
    mid = Math.imul(al3, bh0);
    mid = (mid + Math.imul(ah3, bl0)) | 0;
    hi = Math.imul(ah3, bh0);
    lo = (lo + Math.imul(al2, bl1)) | 0;
    mid = (mid + Math.imul(al2, bh1)) | 0;
    mid = (mid + Math.imul(ah2, bl1)) | 0;
    hi = (hi + Math.imul(ah2, bh1)) | 0;
    lo = (lo + Math.imul(al1, bl2)) | 0;
    mid = (mid + Math.imul(al1, bh2)) | 0;
    mid = (mid + Math.imul(ah1, bl2)) | 0;
    hi = (hi + Math.imul(ah1, bh2)) | 0;
    lo = (lo + Math.imul(al0, bl3)) | 0;
    mid = (mid + Math.imul(al0, bh3)) | 0;
    mid = (mid + Math.imul(ah0, bl3)) | 0;
    hi = (hi + Math.imul(ah0, bh3)) | 0;
    var w3 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w3 >>> 26)) | 0;
    w3 &= 0x3ffffff;
    /* k = 4 */
    lo = Math.imul(al4, bl0);
    mid = Math.imul(al4, bh0);
    mid = (mid + Math.imul(ah4, bl0)) | 0;
    hi = Math.imul(ah4, bh0);
    lo = (lo + Math.imul(al3, bl1)) | 0;
    mid = (mid + Math.imul(al3, bh1)) | 0;
    mid = (mid + Math.imul(ah3, bl1)) | 0;
    hi = (hi + Math.imul(ah3, bh1)) | 0;
    lo = (lo + Math.imul(al2, bl2)) | 0;
    mid = (mid + Math.imul(al2, bh2)) | 0;
    mid = (mid + Math.imul(ah2, bl2)) | 0;
    hi = (hi + Math.imul(ah2, bh2)) | 0;
    lo = (lo + Math.imul(al1, bl3)) | 0;
    mid = (mid + Math.imul(al1, bh3)) | 0;
    mid = (mid + Math.imul(ah1, bl3)) | 0;
    hi = (hi + Math.imul(ah1, bh3)) | 0;
    lo = (lo + Math.imul(al0, bl4)) | 0;
    mid = (mid + Math.imul(al0, bh4)) | 0;
    mid = (mid + Math.imul(ah0, bl4)) | 0;
    hi = (hi + Math.imul(ah0, bh4)) | 0;
    var w4 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w4 >>> 26)) | 0;
    w4 &= 0x3ffffff;
    /* k = 5 */
    lo = Math.imul(al5, bl0);
    mid = Math.imul(al5, bh0);
    mid = (mid + Math.imul(ah5, bl0)) | 0;
    hi = Math.imul(ah5, bh0);
    lo = (lo + Math.imul(al4, bl1)) | 0;
    mid = (mid + Math.imul(al4, bh1)) | 0;
    mid = (mid + Math.imul(ah4, bl1)) | 0;
    hi = (hi + Math.imul(ah4, bh1)) | 0;
    lo = (lo + Math.imul(al3, bl2)) | 0;
    mid = (mid + Math.imul(al3, bh2)) | 0;
    mid = (mid + Math.imul(ah3, bl2)) | 0;
    hi = (hi + Math.imul(ah3, bh2)) | 0;
    lo = (lo + Math.imul(al2, bl3)) | 0;
    mid = (mid + Math.imul(al2, bh3)) | 0;
    mid = (mid + Math.imul(ah2, bl3)) | 0;
    hi = (hi + Math.imul(ah2, bh3)) | 0;
    lo = (lo + Math.imul(al1, bl4)) | 0;
    mid = (mid + Math.imul(al1, bh4)) | 0;
    mid = (mid + Math.imul(ah1, bl4)) | 0;
    hi = (hi + Math.imul(ah1, bh4)) | 0;
    lo = (lo + Math.imul(al0, bl5)) | 0;
    mid = (mid + Math.imul(al0, bh5)) | 0;
    mid = (mid + Math.imul(ah0, bl5)) | 0;
    hi = (hi + Math.imul(ah0, bh5)) | 0;
    var w5 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w5 >>> 26)) | 0;
    w5 &= 0x3ffffff;
    /* k = 6 */
    lo = Math.imul(al6, bl0);
    mid = Math.imul(al6, bh0);
    mid = (mid + Math.imul(ah6, bl0)) | 0;
    hi = Math.imul(ah6, bh0);
    lo = (lo + Math.imul(al5, bl1)) | 0;
    mid = (mid + Math.imul(al5, bh1)) | 0;
    mid = (mid + Math.imul(ah5, bl1)) | 0;
    hi = (hi + Math.imul(ah5, bh1)) | 0;
    lo = (lo + Math.imul(al4, bl2)) | 0;
    mid = (mid + Math.imul(al4, bh2)) | 0;
    mid = (mid + Math.imul(ah4, bl2)) | 0;
    hi = (hi + Math.imul(ah4, bh2)) | 0;
    lo = (lo + Math.imul(al3, bl3)) | 0;
    mid = (mid + Math.imul(al3, bh3)) | 0;
    mid = (mid + Math.imul(ah3, bl3)) | 0;
    hi = (hi + Math.imul(ah3, bh3)) | 0;
    lo = (lo + Math.imul(al2, bl4)) | 0;
    mid = (mid + Math.imul(al2, bh4)) | 0;
    mid = (mid + Math.imul(ah2, bl4)) | 0;
    hi = (hi + Math.imul(ah2, bh4)) | 0;
    lo = (lo + Math.imul(al1, bl5)) | 0;
    mid = (mid + Math.imul(al1, bh5)) | 0;
    mid = (mid + Math.imul(ah1, bl5)) | 0;
    hi = (hi + Math.imul(ah1, bh5)) | 0;
    lo = (lo + Math.imul(al0, bl6)) | 0;
    mid = (mid + Math.imul(al0, bh6)) | 0;
    mid = (mid + Math.imul(ah0, bl6)) | 0;
    hi = (hi + Math.imul(ah0, bh6)) | 0;
    var w6 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w6 >>> 26)) | 0;
    w6 &= 0x3ffffff;
    /* k = 7 */
    lo = Math.imul(al7, bl0);
    mid = Math.imul(al7, bh0);
    mid = (mid + Math.imul(ah7, bl0)) | 0;
    hi = Math.imul(ah7, bh0);
    lo = (lo + Math.imul(al6, bl1)) | 0;
    mid = (mid + Math.imul(al6, bh1)) | 0;
    mid = (mid + Math.imul(ah6, bl1)) | 0;
    hi = (hi + Math.imul(ah6, bh1)) | 0;
    lo = (lo + Math.imul(al5, bl2)) | 0;
    mid = (mid + Math.imul(al5, bh2)) | 0;
    mid = (mid + Math.imul(ah5, bl2)) | 0;
    hi = (hi + Math.imul(ah5, bh2)) | 0;
    lo = (lo + Math.imul(al4, bl3)) | 0;
    mid = (mid + Math.imul(al4, bh3)) | 0;
    mid = (mid + Math.imul(ah4, bl3)) | 0;
    hi = (hi + Math.imul(ah4, bh3)) | 0;
    lo = (lo + Math.imul(al3, bl4)) | 0;
    mid = (mid + Math.imul(al3, bh4)) | 0;
    mid = (mid + Math.imul(ah3, bl4)) | 0;
    hi = (hi + Math.imul(ah3, bh4)) | 0;
    lo = (lo + Math.imul(al2, bl5)) | 0;
    mid = (mid + Math.imul(al2, bh5)) | 0;
    mid = (mid + Math.imul(ah2, bl5)) | 0;
    hi = (hi + Math.imul(ah2, bh5)) | 0;
    lo = (lo + Math.imul(al1, bl6)) | 0;
    mid = (mid + Math.imul(al1, bh6)) | 0;
    mid = (mid + Math.imul(ah1, bl6)) | 0;
    hi = (hi + Math.imul(ah1, bh6)) | 0;
    lo = (lo + Math.imul(al0, bl7)) | 0;
    mid = (mid + Math.imul(al0, bh7)) | 0;
    mid = (mid + Math.imul(ah0, bl7)) | 0;
    hi = (hi + Math.imul(ah0, bh7)) | 0;
    var w7 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w7 >>> 26)) | 0;
    w7 &= 0x3ffffff;
    /* k = 8 */
    lo = Math.imul(al8, bl0);
    mid = Math.imul(al8, bh0);
    mid = (mid + Math.imul(ah8, bl0)) | 0;
    hi = Math.imul(ah8, bh0);
    lo = (lo + Math.imul(al7, bl1)) | 0;
    mid = (mid + Math.imul(al7, bh1)) | 0;
    mid = (mid + Math.imul(ah7, bl1)) | 0;
    hi = (hi + Math.imul(ah7, bh1)) | 0;
    lo = (lo + Math.imul(al6, bl2)) | 0;
    mid = (mid + Math.imul(al6, bh2)) | 0;
    mid = (mid + Math.imul(ah6, bl2)) | 0;
    hi = (hi + Math.imul(ah6, bh2)) | 0;
    lo = (lo + Math.imul(al5, bl3)) | 0;
    mid = (mid + Math.imul(al5, bh3)) | 0;
    mid = (mid + Math.imul(ah5, bl3)) | 0;
    hi = (hi + Math.imul(ah5, bh3)) | 0;
    lo = (lo + Math.imul(al4, bl4)) | 0;
    mid = (mid + Math.imul(al4, bh4)) | 0;
    mid = (mid + Math.imul(ah4, bl4)) | 0;
    hi = (hi + Math.imul(ah4, bh4)) | 0;
    lo = (lo + Math.imul(al3, bl5)) | 0;
    mid = (mid + Math.imul(al3, bh5)) | 0;
    mid = (mid + Math.imul(ah3, bl5)) | 0;
    hi = (hi + Math.imul(ah3, bh5)) | 0;
    lo = (lo + Math.imul(al2, bl6)) | 0;
    mid = (mid + Math.imul(al2, bh6)) | 0;
    mid = (mid + Math.imul(ah2, bl6)) | 0;
    hi = (hi + Math.imul(ah2, bh6)) | 0;
    lo = (lo + Math.imul(al1, bl7)) | 0;
    mid = (mid + Math.imul(al1, bh7)) | 0;
    mid = (mid + Math.imul(ah1, bl7)) | 0;
    hi = (hi + Math.imul(ah1, bh7)) | 0;
    lo = (lo + Math.imul(al0, bl8)) | 0;
    mid = (mid + Math.imul(al0, bh8)) | 0;
    mid = (mid + Math.imul(ah0, bl8)) | 0;
    hi = (hi + Math.imul(ah0, bh8)) | 0;
    var w8 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w8 >>> 26)) | 0;
    w8 &= 0x3ffffff;
    /* k = 9 */
    lo = Math.imul(al9, bl0);
    mid = Math.imul(al9, bh0);
    mid = (mid + Math.imul(ah9, bl0)) | 0;
    hi = Math.imul(ah9, bh0);
    lo = (lo + Math.imul(al8, bl1)) | 0;
    mid = (mid + Math.imul(al8, bh1)) | 0;
    mid = (mid + Math.imul(ah8, bl1)) | 0;
    hi = (hi + Math.imul(ah8, bh1)) | 0;
    lo = (lo + Math.imul(al7, bl2)) | 0;
    mid = (mid + Math.imul(al7, bh2)) | 0;
    mid = (mid + Math.imul(ah7, bl2)) | 0;
    hi = (hi + Math.imul(ah7, bh2)) | 0;
    lo = (lo + Math.imul(al6, bl3)) | 0;
    mid = (mid + Math.imul(al6, bh3)) | 0;
    mid = (mid + Math.imul(ah6, bl3)) | 0;
    hi = (hi + Math.imul(ah6, bh3)) | 0;
    lo = (lo + Math.imul(al5, bl4)) | 0;
    mid = (mid + Math.imul(al5, bh4)) | 0;
    mid = (mid + Math.imul(ah5, bl4)) | 0;
    hi = (hi + Math.imul(ah5, bh4)) | 0;
    lo = (lo + Math.imul(al4, bl5)) | 0;
    mid = (mid + Math.imul(al4, bh5)) | 0;
    mid = (mid + Math.imul(ah4, bl5)) | 0;
    hi = (hi + Math.imul(ah4, bh5)) | 0;
    lo = (lo + Math.imul(al3, bl6)) | 0;
    mid = (mid + Math.imul(al3, bh6)) | 0;
    mid = (mid + Math.imul(ah3, bl6)) | 0;
    hi = (hi + Math.imul(ah3, bh6)) | 0;
    lo = (lo + Math.imul(al2, bl7)) | 0;
    mid = (mid + Math.imul(al2, bh7)) | 0;
    mid = (mid + Math.imul(ah2, bl7)) | 0;
    hi = (hi + Math.imul(ah2, bh7)) | 0;
    lo = (lo + Math.imul(al1, bl8)) | 0;
    mid = (mid + Math.imul(al1, bh8)) | 0;
    mid = (mid + Math.imul(ah1, bl8)) | 0;
    hi = (hi + Math.imul(ah1, bh8)) | 0;
    lo = (lo + Math.imul(al0, bl9)) | 0;
    mid = (mid + Math.imul(al0, bh9)) | 0;
    mid = (mid + Math.imul(ah0, bl9)) | 0;
    hi = (hi + Math.imul(ah0, bh9)) | 0;
    var w9 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w9 >>> 26)) | 0;
    w9 &= 0x3ffffff;
    /* k = 10 */
    lo = Math.imul(al9, bl1);
    mid = Math.imul(al9, bh1);
    mid = (mid + Math.imul(ah9, bl1)) | 0;
    hi = Math.imul(ah9, bh1);
    lo = (lo + Math.imul(al8, bl2)) | 0;
    mid = (mid + Math.imul(al8, bh2)) | 0;
    mid = (mid + Math.imul(ah8, bl2)) | 0;
    hi = (hi + Math.imul(ah8, bh2)) | 0;
    lo = (lo + Math.imul(al7, bl3)) | 0;
    mid = (mid + Math.imul(al7, bh3)) | 0;
    mid = (mid + Math.imul(ah7, bl3)) | 0;
    hi = (hi + Math.imul(ah7, bh3)) | 0;
    lo = (lo + Math.imul(al6, bl4)) | 0;
    mid = (mid + Math.imul(al6, bh4)) | 0;
    mid = (mid + Math.imul(ah6, bl4)) | 0;
    hi = (hi + Math.imul(ah6, bh4)) | 0;
    lo = (lo + Math.imul(al5, bl5)) | 0;
    mid = (mid + Math.imul(al5, bh5)) | 0;
    mid = (mid + Math.imul(ah5, bl5)) | 0;
    hi = (hi + Math.imul(ah5, bh5)) | 0;
    lo = (lo + Math.imul(al4, bl6)) | 0;
    mid = (mid + Math.imul(al4, bh6)) | 0;
    mid = (mid + Math.imul(ah4, bl6)) | 0;
    hi = (hi + Math.imul(ah4, bh6)) | 0;
    lo = (lo + Math.imul(al3, bl7)) | 0;
    mid = (mid + Math.imul(al3, bh7)) | 0;
    mid = (mid + Math.imul(ah3, bl7)) | 0;
    hi = (hi + Math.imul(ah3, bh7)) | 0;
    lo = (lo + Math.imul(al2, bl8)) | 0;
    mid = (mid + Math.imul(al2, bh8)) | 0;
    mid = (mid + Math.imul(ah2, bl8)) | 0;
    hi = (hi + Math.imul(ah2, bh8)) | 0;
    lo = (lo + Math.imul(al1, bl9)) | 0;
    mid = (mid + Math.imul(al1, bh9)) | 0;
    mid = (mid + Math.imul(ah1, bl9)) | 0;
    hi = (hi + Math.imul(ah1, bh9)) | 0;
    var w10 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w10 >>> 26)) | 0;
    w10 &= 0x3ffffff;
    /* k = 11 */
    lo = Math.imul(al9, bl2);
    mid = Math.imul(al9, bh2);
    mid = (mid + Math.imul(ah9, bl2)) | 0;
    hi = Math.imul(ah9, bh2);
    lo = (lo + Math.imul(al8, bl3)) | 0;
    mid = (mid + Math.imul(al8, bh3)) | 0;
    mid = (mid + Math.imul(ah8, bl3)) | 0;
    hi = (hi + Math.imul(ah8, bh3)) | 0;
    lo = (lo + Math.imul(al7, bl4)) | 0;
    mid = (mid + Math.imul(al7, bh4)) | 0;
    mid = (mid + Math.imul(ah7, bl4)) | 0;
    hi = (hi + Math.imul(ah7, bh4)) | 0;
    lo = (lo + Math.imul(al6, bl5)) | 0;
    mid = (mid + Math.imul(al6, bh5)) | 0;
    mid = (mid + Math.imul(ah6, bl5)) | 0;
    hi = (hi + Math.imul(ah6, bh5)) | 0;
    lo = (lo + Math.imul(al5, bl6)) | 0;
    mid = (mid + Math.imul(al5, bh6)) | 0;
    mid = (mid + Math.imul(ah5, bl6)) | 0;
    hi = (hi + Math.imul(ah5, bh6)) | 0;
    lo = (lo + Math.imul(al4, bl7)) | 0;
    mid = (mid + Math.imul(al4, bh7)) | 0;
    mid = (mid + Math.imul(ah4, bl7)) | 0;
    hi = (hi + Math.imul(ah4, bh7)) | 0;
    lo = (lo + Math.imul(al3, bl8)) | 0;
    mid = (mid + Math.imul(al3, bh8)) | 0;
    mid = (mid + Math.imul(ah3, bl8)) | 0;
    hi = (hi + Math.imul(ah3, bh8)) | 0;
    lo = (lo + Math.imul(al2, bl9)) | 0;
    mid = (mid + Math.imul(al2, bh9)) | 0;
    mid = (mid + Math.imul(ah2, bl9)) | 0;
    hi = (hi + Math.imul(ah2, bh9)) | 0;
    var w11 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w11 >>> 26)) | 0;
    w11 &= 0x3ffffff;
    /* k = 12 */
    lo = Math.imul(al9, bl3);
    mid = Math.imul(al9, bh3);
    mid = (mid + Math.imul(ah9, bl3)) | 0;
    hi = Math.imul(ah9, bh3);
    lo = (lo + Math.imul(al8, bl4)) | 0;
    mid = (mid + Math.imul(al8, bh4)) | 0;
    mid = (mid + Math.imul(ah8, bl4)) | 0;
    hi = (hi + Math.imul(ah8, bh4)) | 0;
    lo = (lo + Math.imul(al7, bl5)) | 0;
    mid = (mid + Math.imul(al7, bh5)) | 0;
    mid = (mid + Math.imul(ah7, bl5)) | 0;
    hi = (hi + Math.imul(ah7, bh5)) | 0;
    lo = (lo + Math.imul(al6, bl6)) | 0;
    mid = (mid + Math.imul(al6, bh6)) | 0;
    mid = (mid + Math.imul(ah6, bl6)) | 0;
    hi = (hi + Math.imul(ah6, bh6)) | 0;
    lo = (lo + Math.imul(al5, bl7)) | 0;
    mid = (mid + Math.imul(al5, bh7)) | 0;
    mid = (mid + Math.imul(ah5, bl7)) | 0;
    hi = (hi + Math.imul(ah5, bh7)) | 0;
    lo = (lo + Math.imul(al4, bl8)) | 0;
    mid = (mid + Math.imul(al4, bh8)) | 0;
    mid = (mid + Math.imul(ah4, bl8)) | 0;
    hi = (hi + Math.imul(ah4, bh8)) | 0;
    lo = (lo + Math.imul(al3, bl9)) | 0;
    mid = (mid + Math.imul(al3, bh9)) | 0;
    mid = (mid + Math.imul(ah3, bl9)) | 0;
    hi = (hi + Math.imul(ah3, bh9)) | 0;
    var w12 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w12 >>> 26)) | 0;
    w12 &= 0x3ffffff;
    /* k = 13 */
    lo = Math.imul(al9, bl4);
    mid = Math.imul(al9, bh4);
    mid = (mid + Math.imul(ah9, bl4)) | 0;
    hi = Math.imul(ah9, bh4);
    lo = (lo + Math.imul(al8, bl5)) | 0;
    mid = (mid + Math.imul(al8, bh5)) | 0;
    mid = (mid + Math.imul(ah8, bl5)) | 0;
    hi = (hi + Math.imul(ah8, bh5)) | 0;
    lo = (lo + Math.imul(al7, bl6)) | 0;
    mid = (mid + Math.imul(al7, bh6)) | 0;
    mid = (mid + Math.imul(ah7, bl6)) | 0;
    hi = (hi + Math.imul(ah7, bh6)) | 0;
    lo = (lo + Math.imul(al6, bl7)) | 0;
    mid = (mid + Math.imul(al6, bh7)) | 0;
    mid = (mid + Math.imul(ah6, bl7)) | 0;
    hi = (hi + Math.imul(ah6, bh7)) | 0;
    lo = (lo + Math.imul(al5, bl8)) | 0;
    mid = (mid + Math.imul(al5, bh8)) | 0;
    mid = (mid + Math.imul(ah5, bl8)) | 0;
    hi = (hi + Math.imul(ah5, bh8)) | 0;
    lo = (lo + Math.imul(al4, bl9)) | 0;
    mid = (mid + Math.imul(al4, bh9)) | 0;
    mid = (mid + Math.imul(ah4, bl9)) | 0;
    hi = (hi + Math.imul(ah4, bh9)) | 0;
    var w13 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w13 >>> 26)) | 0;
    w13 &= 0x3ffffff;
    /* k = 14 */
    lo = Math.imul(al9, bl5);
    mid = Math.imul(al9, bh5);
    mid = (mid + Math.imul(ah9, bl5)) | 0;
    hi = Math.imul(ah9, bh5);
    lo = (lo + Math.imul(al8, bl6)) | 0;
    mid = (mid + Math.imul(al8, bh6)) | 0;
    mid = (mid + Math.imul(ah8, bl6)) | 0;
    hi = (hi + Math.imul(ah8, bh6)) | 0;
    lo = (lo + Math.imul(al7, bl7)) | 0;
    mid = (mid + Math.imul(al7, bh7)) | 0;
    mid = (mid + Math.imul(ah7, bl7)) | 0;
    hi = (hi + Math.imul(ah7, bh7)) | 0;
    lo = (lo + Math.imul(al6, bl8)) | 0;
    mid = (mid + Math.imul(al6, bh8)) | 0;
    mid = (mid + Math.imul(ah6, bl8)) | 0;
    hi = (hi + Math.imul(ah6, bh8)) | 0;
    lo = (lo + Math.imul(al5, bl9)) | 0;
    mid = (mid + Math.imul(al5, bh9)) | 0;
    mid = (mid + Math.imul(ah5, bl9)) | 0;
    hi = (hi + Math.imul(ah5, bh9)) | 0;
    var w14 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w14 >>> 26)) | 0;
    w14 &= 0x3ffffff;
    /* k = 15 */
    lo = Math.imul(al9, bl6);
    mid = Math.imul(al9, bh6);
    mid = (mid + Math.imul(ah9, bl6)) | 0;
    hi = Math.imul(ah9, bh6);
    lo = (lo + Math.imul(al8, bl7)) | 0;
    mid = (mid + Math.imul(al8, bh7)) | 0;
    mid = (mid + Math.imul(ah8, bl7)) | 0;
    hi = (hi + Math.imul(ah8, bh7)) | 0;
    lo = (lo + Math.imul(al7, bl8)) | 0;
    mid = (mid + Math.imul(al7, bh8)) | 0;
    mid = (mid + Math.imul(ah7, bl8)) | 0;
    hi = (hi + Math.imul(ah7, bh8)) | 0;
    lo = (lo + Math.imul(al6, bl9)) | 0;
    mid = (mid + Math.imul(al6, bh9)) | 0;
    mid = (mid + Math.imul(ah6, bl9)) | 0;
    hi = (hi + Math.imul(ah6, bh9)) | 0;
    var w15 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w15 >>> 26)) | 0;
    w15 &= 0x3ffffff;
    /* k = 16 */
    lo = Math.imul(al9, bl7);
    mid = Math.imul(al9, bh7);
    mid = (mid + Math.imul(ah9, bl7)) | 0;
    hi = Math.imul(ah9, bh7);
    lo = (lo + Math.imul(al8, bl8)) | 0;
    mid = (mid + Math.imul(al8, bh8)) | 0;
    mid = (mid + Math.imul(ah8, bl8)) | 0;
    hi = (hi + Math.imul(ah8, bh8)) | 0;
    lo = (lo + Math.imul(al7, bl9)) | 0;
    mid = (mid + Math.imul(al7, bh9)) | 0;
    mid = (mid + Math.imul(ah7, bl9)) | 0;
    hi = (hi + Math.imul(ah7, bh9)) | 0;
    var w16 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w16 >>> 26)) | 0;
    w16 &= 0x3ffffff;
    /* k = 17 */
    lo = Math.imul(al9, bl8);
    mid = Math.imul(al9, bh8);
    mid = (mid + Math.imul(ah9, bl8)) | 0;
    hi = Math.imul(ah9, bh8);
    lo = (lo + Math.imul(al8, bl9)) | 0;
    mid = (mid + Math.imul(al8, bh9)) | 0;
    mid = (mid + Math.imul(ah8, bl9)) | 0;
    hi = (hi + Math.imul(ah8, bh9)) | 0;
    var w17 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w17 >>> 26)) | 0;
    w17 &= 0x3ffffff;
    /* k = 18 */
    lo = Math.imul(al9, bl9);
    mid = Math.imul(al9, bh9);
    mid = (mid + Math.imul(ah9, bl9)) | 0;
    hi = Math.imul(ah9, bh9);
    var w18 = (((c + lo) | 0) + ((mid & 0x1fff) << 13)) | 0;
    c = (((hi + (mid >>> 13)) | 0) + (w18 >>> 26)) | 0;
    w18 &= 0x3ffffff;
    o[0] = w0;
    o[1] = w1;
    o[2] = w2;
    o[3] = w3;
    o[4] = w4;
    o[5] = w5;
    o[6] = w6;
    o[7] = w7;
    o[8] = w8;
    o[9] = w9;
    o[10] = w10;
    o[11] = w11;
    o[12] = w12;
    o[13] = w13;
    o[14] = w14;
    o[15] = w15;
    o[16] = w16;
    o[17] = w17;
    o[18] = w18;
    if (c !== 0) {
      o[19] = c;
      out.length++;
    }
    return out;
  };

  // Polyfill comb
  if (!Math.imul) {
    comb10MulTo = smallMulTo;
  }

  function bigMulTo (self, num, out) {
    out.negative = num.negative ^ self.negative;
    out.length = self.length + num.length;

    var carry = 0;
    var hncarry = 0;
    for (var k = 0; k < out.length - 1; k++) {
      // Sum all words with the same `i + j = k` and accumulate `ncarry`,
      // note that ncarry could be >= 0x3ffffff
      var ncarry = hncarry;
      hncarry = 0;
      var rword = carry & 0x3ffffff;
      var maxJ = Math.min(k, num.length - 1);
      for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
        var i = k - j;
        var a = self.words[i] | 0;
        var b = num.words[j] | 0;
        var r = a * b;

        var lo = r & 0x3ffffff;
        ncarry = (ncarry + ((r / 0x4000000) | 0)) | 0;
        lo = (lo + rword) | 0;
        rword = lo & 0x3ffffff;
        ncarry = (ncarry + (lo >>> 26)) | 0;

        hncarry += ncarry >>> 26;
        ncarry &= 0x3ffffff;
      }
      out.words[k] = rword;
      carry = ncarry;
      ncarry = hncarry;
    }
    if (carry !== 0) {
      out.words[k] = carry;
    } else {
      out.length--;
    }

    return out.strip();
  }

  function jumboMulTo (self, num, out) {
    var fftm = new FFTM();
    return fftm.mulp(self, num, out);
  }

  BN.prototype.mulTo = function mulTo (num, out) {
    var res;
    var len = this.length + num.length;
    if (this.length === 10 && num.length === 10) {
      res = comb10MulTo(this, num, out);
    } else if (len < 63) {
      res = smallMulTo(this, num, out);
    } else if (len < 1024) {
      res = bigMulTo(this, num, out);
    } else {
      res = jumboMulTo(this, num, out);
    }

    return res;
  };

  // Cooley-Tukey algorithm for FFT
  // slightly revisited to rely on looping instead of recursion

  function FFTM (x, y) {
    this.x = x;
    this.y = y;
  }

  FFTM.prototype.makeRBT = function makeRBT (N) {
    var t = new Array(N);
    var l = BN.prototype._countBits(N) - 1;
    for (var i = 0; i < N; i++) {
      t[i] = this.revBin(i, l, N);
    }

    return t;
  };

  // Returns binary-reversed representation of `x`
  FFTM.prototype.revBin = function revBin (x, l, N) {
    if (x === 0 || x === N - 1) return x;

    var rb = 0;
    for (var i = 0; i < l; i++) {
      rb |= (x & 1) << (l - i - 1);
      x >>= 1;
    }

    return rb;
  };

  // Performs "tweedling" phase, therefore 'emulating'
  // behaviour of the recursive algorithm
  FFTM.prototype.permute = function permute (rbt, rws, iws, rtws, itws, N) {
    for (var i = 0; i < N; i++) {
      rtws[i] = rws[rbt[i]];
      itws[i] = iws[rbt[i]];
    }
  };

  FFTM.prototype.transform = function transform (rws, iws, rtws, itws, N, rbt) {
    this.permute(rbt, rws, iws, rtws, itws, N);

    for (var s = 1; s < N; s <<= 1) {
      var l = s << 1;

      var rtwdf = Math.cos(2 * Math.PI / l);
      var itwdf = Math.sin(2 * Math.PI / l);

      for (var p = 0; p < N; p += l) {
        var rtwdf_ = rtwdf;
        var itwdf_ = itwdf;

        for (var j = 0; j < s; j++) {
          var re = rtws[p + j];
          var ie = itws[p + j];

          var ro = rtws[p + j + s];
          var io = itws[p + j + s];

          var rx = rtwdf_ * ro - itwdf_ * io;

          io = rtwdf_ * io + itwdf_ * ro;
          ro = rx;

          rtws[p + j] = re + ro;
          itws[p + j] = ie + io;

          rtws[p + j + s] = re - ro;
          itws[p + j + s] = ie - io;

          /* jshint maxdepth : false */
          if (j !== l) {
            rx = rtwdf * rtwdf_ - itwdf * itwdf_;

            itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
            rtwdf_ = rx;
          }
        }
      }
    }
  };

  FFTM.prototype.guessLen13b = function guessLen13b (n, m) {
    var N = Math.max(m, n) | 1;
    var odd = N & 1;
    var i = 0;
    for (N = N / 2 | 0; N; N = N >>> 1) {
      i++;
    }

    return 1 << i + 1 + odd;
  };

  FFTM.prototype.conjugate = function conjugate (rws, iws, N) {
    if (N <= 1) return;

    for (var i = 0; i < N / 2; i++) {
      var t = rws[i];

      rws[i] = rws[N - i - 1];
      rws[N - i - 1] = t;

      t = iws[i];

      iws[i] = -iws[N - i - 1];
      iws[N - i - 1] = -t;
    }
  };

  FFTM.prototype.normalize13b = function normalize13b (ws, N) {
    var carry = 0;
    for (var i = 0; i < N / 2; i++) {
      var w = Math.round(ws[2 * i + 1] / N) * 0x2000 +
        Math.round(ws[2 * i] / N) +
        carry;

      ws[i] = w & 0x3ffffff;

      if (w < 0x4000000) {
        carry = 0;
      } else {
        carry = w / 0x4000000 | 0;
      }
    }

    return ws;
  };

  FFTM.prototype.convert13b = function convert13b (ws, len, rws, N) {
    var carry = 0;
    for (var i = 0; i < len; i++) {
      carry = carry + (ws[i] | 0);

      rws[2 * i] = carry & 0x1fff; carry = carry >>> 13;
      rws[2 * i + 1] = carry & 0x1fff; carry = carry >>> 13;
    }

    // Pad with zeroes
    for (i = 2 * len; i < N; ++i) {
      rws[i] = 0;
    }

    assert(carry === 0);
    assert((carry & ~0x1fff) === 0);
  };

  FFTM.prototype.stub = function stub (N) {
    var ph = new Array(N);
    for (var i = 0; i < N; i++) {
      ph[i] = 0;
    }

    return ph;
  };

  FFTM.prototype.mulp = function mulp (x, y, out) {
    var N = 2 * this.guessLen13b(x.length, y.length);

    var rbt = this.makeRBT(N);

    var _ = this.stub(N);

    var rws = new Array(N);
    var rwst = new Array(N);
    var iwst = new Array(N);

    var nrws = new Array(N);
    var nrwst = new Array(N);
    var niwst = new Array(N);

    var rmws = out.words;
    rmws.length = N;

    this.convert13b(x.words, x.length, rws, N);
    this.convert13b(y.words, y.length, nrws, N);

    this.transform(rws, _, rwst, iwst, N, rbt);
    this.transform(nrws, _, nrwst, niwst, N, rbt);

    for (var i = 0; i < N; i++) {
      var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
      iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
      rwst[i] = rx;
    }

    this.conjugate(rwst, iwst, N);
    this.transform(rwst, iwst, rmws, _, N, rbt);
    this.conjugate(rmws, _, N);
    this.normalize13b(rmws, N);

    out.negative = x.negative ^ y.negative;
    out.length = x.length + y.length;
    return out.strip();
  };

  // Multiply `this` by `num`
  BN.prototype.mul = function mul (num) {
    var out = new BN(null);
    out.words = new Array(this.length + num.length);
    return this.mulTo(num, out);
  };

  // Multiply employing FFT
  BN.prototype.mulf = function mulf (num) {
    var out = new BN(null);
    out.words = new Array(this.length + num.length);
    return jumboMulTo(this, num, out);
  };

  // In-place Multiplication
  BN.prototype.imul = function imul (num) {
    return this.clone().mulTo(num, this);
  };

  BN.prototype.imuln = function imuln (num) {
    assert(typeof num === 'number');
    assert(num < 0x4000000);

    // Carry
    var carry = 0;
    for (var i = 0; i < this.length; i++) {
      var w = (this.words[i] | 0) * num;
      var lo = (w & 0x3ffffff) + (carry & 0x3ffffff);
      carry >>= 26;
      carry += (w / 0x4000000) | 0;
      // NOTE: lo is 27bit maximum
      carry += lo >>> 26;
      this.words[i] = lo & 0x3ffffff;
    }

    if (carry !== 0) {
      this.words[i] = carry;
      this.length++;
    }

    return this;
  };

  BN.prototype.muln = function muln (num) {
    return this.clone().imuln(num);
  };

  // `this` * `this`
  BN.prototype.sqr = function sqr () {
    return this.mul(this);
  };

  // `this` * `this` in-place
  BN.prototype.isqr = function isqr () {
    return this.imul(this.clone());
  };

  // Math.pow(`this`, `num`)
  BN.prototype.pow = function pow (num) {
    var w = toBitArray(num);
    if (w.length === 0) return new BN(1);

    // Skip leading zeroes
    var res = this;
    for (var i = 0; i < w.length; i++, res = res.sqr()) {
      if (w[i] !== 0) break;
    }

    if (++i < w.length) {
      for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
        if (w[i] === 0) continue;

        res = res.mul(q);
      }
    }

    return res;
  };

  // Shift-left in-place
  BN.prototype.iushln = function iushln (bits) {
    assert(typeof bits === 'number' && bits >= 0);
    var r = bits % 26;
    var s = (bits - r) / 26;
    var carryMask = (0x3ffffff >>> (26 - r)) << (26 - r);
    var i;

    if (r !== 0) {
      var carry = 0;

      for (i = 0; i < this.length; i++) {
        var newCarry = this.words[i] & carryMask;
        var c = ((this.words[i] | 0) - newCarry) << r;
        this.words[i] = c | carry;
        carry = newCarry >>> (26 - r);
      }

      if (carry) {
        this.words[i] = carry;
        this.length++;
      }
    }

    if (s !== 0) {
      for (i = this.length - 1; i >= 0; i--) {
        this.words[i + s] = this.words[i];
      }

      for (i = 0; i < s; i++) {
        this.words[i] = 0;
      }

      this.length += s;
    }

    return this.strip();
  };

  BN.prototype.ishln = function ishln (bits) {
    // TODO(indutny): implement me
    assert(this.negative === 0);
    return this.iushln(bits);
  };

  // Shift-right in-place
  // NOTE: `hint` is a lowest bit before trailing zeroes
  // NOTE: if `extended` is present - it will be filled with destroyed bits
  BN.prototype.iushrn = function iushrn (bits, hint, extended) {
    assert(typeof bits === 'number' && bits >= 0);
    var h;
    if (hint) {
      h = (hint - (hint % 26)) / 26;
    } else {
      h = 0;
    }

    var r = bits % 26;
    var s = Math.min((bits - r) / 26, this.length);
    var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
    var maskedWords = extended;

    h -= s;
    h = Math.max(0, h);

    // Extended mode, copy masked part
    if (maskedWords) {
      for (var i = 0; i < s; i++) {
        maskedWords.words[i] = this.words[i];
      }
      maskedWords.length = s;
    }

    if (s === 0) {
      // No-op, we should not move anything at all
    } else if (this.length > s) {
      this.length -= s;
      for (i = 0; i < this.length; i++) {
        this.words[i] = this.words[i + s];
      }
    } else {
      this.words[0] = 0;
      this.length = 1;
    }

    var carry = 0;
    for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
      var word = this.words[i] | 0;
      this.words[i] = (carry << (26 - r)) | (word >>> r);
      carry = word & mask;
    }

    // Push carried bits as a mask
    if (maskedWords && carry !== 0) {
      maskedWords.words[maskedWords.length++] = carry;
    }

    if (this.length === 0) {
      this.words[0] = 0;
      this.length = 1;
    }

    return this.strip();
  };

  BN.prototype.ishrn = function ishrn (bits, hint, extended) {
    // TODO(indutny): implement me
    assert(this.negative === 0);
    return this.iushrn(bits, hint, extended);
  };

  // Shift-left
  BN.prototype.shln = function shln (bits) {
    return this.clone().ishln(bits);
  };

  BN.prototype.ushln = function ushln (bits) {
    return this.clone().iushln(bits);
  };

  // Shift-right
  BN.prototype.shrn = function shrn (bits) {
    return this.clone().ishrn(bits);
  };

  BN.prototype.ushrn = function ushrn (bits) {
    return this.clone().iushrn(bits);
  };

  // Test if n bit is set
  BN.prototype.testn = function testn (bit) {
    assert(typeof bit === 'number' && bit >= 0);
    var r = bit % 26;
    var s = (bit - r) / 26;
    var q = 1 << r;

    // Fast case: bit is much higher than all existing words
    if (this.length <= s) return false;

    // Check bit and return
    var w = this.words[s];

    return !!(w & q);
  };

  // Return only lowers bits of number (in-place)
  BN.prototype.imaskn = function imaskn (bits) {
    assert(typeof bits === 'number' && bits >= 0);
    var r = bits % 26;
    var s = (bits - r) / 26;

    assert(this.negative === 0, 'imaskn works only with positive numbers');

    if (this.length <= s) {
      return this;
    }

    if (r !== 0) {
      s++;
    }
    this.length = Math.min(s, this.length);

    if (r !== 0) {
      var mask = 0x3ffffff ^ ((0x3ffffff >>> r) << r);
      this.words[this.length - 1] &= mask;
    }

    return this.strip();
  };

  // Return only lowers bits of number
  BN.prototype.maskn = function maskn (bits) {
    return this.clone().imaskn(bits);
  };

  // Add plain number `num` to `this`
  BN.prototype.iaddn = function iaddn (num) {
    assert(typeof num === 'number');
    assert(num < 0x4000000);
    if (num < 0) return this.isubn(-num);

    // Possible sign change
    if (this.negative !== 0) {
      if (this.length === 1 && (this.words[0] | 0) < num) {
        this.words[0] = num - (this.words[0] | 0);
        this.negative = 0;
        return this;
      }

      this.negative = 0;
      this.isubn(num);
      this.negative = 1;
      return this;
    }

    // Add without checks
    return this._iaddn(num);
  };

  BN.prototype._iaddn = function _iaddn (num) {
    this.words[0] += num;

    // Carry
    for (var i = 0; i < this.length && this.words[i] >= 0x4000000; i++) {
      this.words[i] -= 0x4000000;
      if (i === this.length - 1) {
        this.words[i + 1] = 1;
      } else {
        this.words[i + 1]++;
      }
    }
    this.length = Math.max(this.length, i + 1);

    return this;
  };

  // Subtract plain number `num` from `this`
  BN.prototype.isubn = function isubn (num) {
    assert(typeof num === 'number');
    assert(num < 0x4000000);
    if (num < 0) return this.iaddn(-num);

    if (this.negative !== 0) {
      this.negative = 0;
      this.iaddn(num);
      this.negative = 1;
      return this;
    }

    this.words[0] -= num;

    if (this.length === 1 && this.words[0] < 0) {
      this.words[0] = -this.words[0];
      this.negative = 1;
    } else {
      // Carry
      for (var i = 0; i < this.length && this.words[i] < 0; i++) {
        this.words[i] += 0x4000000;
        this.words[i + 1] -= 1;
      }
    }

    return this.strip();
  };

  BN.prototype.addn = function addn (num) {
    return this.clone().iaddn(num);
  };

  BN.prototype.subn = function subn (num) {
    return this.clone().isubn(num);
  };

  BN.prototype.iabs = function iabs () {
    this.negative = 0;

    return this;
  };

  BN.prototype.abs = function abs () {
    return this.clone().iabs();
  };

  BN.prototype._ishlnsubmul = function _ishlnsubmul (num, mul, shift) {
    var len = num.length + shift;
    var i;

    this._expand(len);

    var w;
    var carry = 0;
    for (i = 0; i < num.length; i++) {
      w = (this.words[i + shift] | 0) + carry;
      var right = (num.words[i] | 0) * mul;
      w -= right & 0x3ffffff;
      carry = (w >> 26) - ((right / 0x4000000) | 0);
      this.words[i + shift] = w & 0x3ffffff;
    }
    for (; i < this.length - shift; i++) {
      w = (this.words[i + shift] | 0) + carry;
      carry = w >> 26;
      this.words[i + shift] = w & 0x3ffffff;
    }

    if (carry === 0) return this.strip();

    // Subtraction overflow
    assert(carry === -1);
    carry = 0;
    for (i = 0; i < this.length; i++) {
      w = -(this.words[i] | 0) + carry;
      carry = w >> 26;
      this.words[i] = w & 0x3ffffff;
    }
    this.negative = 1;

    return this.strip();
  };

  BN.prototype._wordDiv = function _wordDiv (num, mode) {
    var shift = this.length - num.length;

    var a = this.clone();
    var b = num;

    // Normalize
    var bhi = b.words[b.length - 1] | 0;
    var bhiBits = this._countBits(bhi);
    shift = 26 - bhiBits;
    if (shift !== 0) {
      b = b.ushln(shift);
      a.iushln(shift);
      bhi = b.words[b.length - 1] | 0;
    }

    // Initialize quotient
    var m = a.length - b.length;
    var q;

    if (mode !== 'mod') {
      q = new BN(null);
      q.length = m + 1;
      q.words = new Array(q.length);
      for (var i = 0; i < q.length; i++) {
        q.words[i] = 0;
      }
    }

    var diff = a.clone()._ishlnsubmul(b, 1, m);
    if (diff.negative === 0) {
      a = diff;
      if (q) {
        q.words[m] = 1;
      }
    }

    for (var j = m - 1; j >= 0; j--) {
      var qj = (a.words[b.length + j] | 0) * 0x4000000 +
        (a.words[b.length + j - 1] | 0);

      // NOTE: (qj / bhi) is (0x3ffffff * 0x4000000 + 0x3ffffff) / 0x2000000 max
      // (0x7ffffff)
      qj = Math.min((qj / bhi) | 0, 0x3ffffff);

      a._ishlnsubmul(b, qj, j);
      while (a.negative !== 0) {
        qj--;
        a.negative = 0;
        a._ishlnsubmul(b, 1, j);
        if (!a.isZero()) {
          a.negative ^= 1;
        }
      }
      if (q) {
        q.words[j] = qj;
      }
    }
    if (q) {
      q.strip();
    }
    a.strip();

    // Denormalize
    if (mode !== 'div' && shift !== 0) {
      a.iushrn(shift);
    }

    return {
      div: q || null,
      mod: a
    };
  };

  // NOTE: 1) `mode` can be set to `mod` to request mod only,
  //       to `div` to request div only, or be absent to
  //       request both div & mod
  //       2) `positive` is true if unsigned mod is requested
  BN.prototype.divmod = function divmod (num, mode, positive) {
    assert(!num.isZero());

    if (this.isZero()) {
      return {
        div: new BN(0),
        mod: new BN(0)
      };
    }

    var div, mod, res;
    if (this.negative !== 0 && num.negative === 0) {
      res = this.neg().divmod(num, mode);

      if (mode !== 'mod') {
        div = res.div.neg();
      }

      if (mode !== 'div') {
        mod = res.mod.neg();
        if (positive && mod.negative !== 0) {
          mod.iadd(num);
        }
      }

      return {
        div: div,
        mod: mod
      };
    }

    if (this.negative === 0 && num.negative !== 0) {
      res = this.divmod(num.neg(), mode);

      if (mode !== 'mod') {
        div = res.div.neg();
      }

      return {
        div: div,
        mod: res.mod
      };
    }

    if ((this.negative & num.negative) !== 0) {
      res = this.neg().divmod(num.neg(), mode);

      if (mode !== 'div') {
        mod = res.mod.neg();
        if (positive && mod.negative !== 0) {
          mod.isub(num);
        }
      }

      return {
        div: res.div,
        mod: mod
      };
    }

    // Both numbers are positive at this point

    // Strip both numbers to approximate shift value
    if (num.length > this.length || this.cmp(num) < 0) {
      return {
        div: new BN(0),
        mod: this
      };
    }

    // Very short reduction
    if (num.length === 1) {
      if (mode === 'div') {
        return {
          div: this.divn(num.words[0]),
          mod: null
        };
      }

      if (mode === 'mod') {
        return {
          div: null,
          mod: new BN(this.modn(num.words[0]))
        };
      }

      return {
        div: this.divn(num.words[0]),
        mod: new BN(this.modn(num.words[0]))
      };
    }

    return this._wordDiv(num, mode);
  };

  // Find `this` / `num`
  BN.prototype.div = function div (num) {
    return this.divmod(num, 'div', false).div;
  };

  // Find `this` % `num`
  BN.prototype.mod = function mod (num) {
    return this.divmod(num, 'mod', false).mod;
  };

  BN.prototype.umod = function umod (num) {
    return this.divmod(num, 'mod', true).mod;
  };

  // Find Round(`this` / `num`)
  BN.prototype.divRound = function divRound (num) {
    var dm = this.divmod(num);

    // Fast case - exact division
    if (dm.mod.isZero()) return dm.div;

    var mod = dm.div.negative !== 0 ? dm.mod.isub(num) : dm.mod;

    var half = num.ushrn(1);
    var r2 = num.andln(1);
    var cmp = mod.cmp(half);

    // Round down
    if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;

    // Round up
    return dm.div.negative !== 0 ? dm.div.isubn(1) : dm.div.iaddn(1);
  };

  BN.prototype.modn = function modn (num) {
    assert(num <= 0x3ffffff);
    var p = (1 << 26) % num;

    var acc = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      acc = (p * acc + (this.words[i] | 0)) % num;
    }

    return acc;
  };

  // In-place division by number
  BN.prototype.idivn = function idivn (num) {
    assert(num <= 0x3ffffff);

    var carry = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      var w = (this.words[i] | 0) + carry * 0x4000000;
      this.words[i] = (w / num) | 0;
      carry = w % num;
    }

    return this.strip();
  };

  BN.prototype.divn = function divn (num) {
    return this.clone().idivn(num);
  };

  BN.prototype.egcd = function egcd (p) {
    assert(p.negative === 0);
    assert(!p.isZero());

    var x = this;
    var y = p.clone();

    if (x.negative !== 0) {
      x = x.umod(p);
    } else {
      x = x.clone();
    }

    // A * x + B * y = x
    var A = new BN(1);
    var B = new BN(0);

    // C * x + D * y = y
    var C = new BN(0);
    var D = new BN(1);

    var g = 0;

    while (x.isEven() && y.isEven()) {
      x.iushrn(1);
      y.iushrn(1);
      ++g;
    }

    var yp = y.clone();
    var xp = x.clone();

    while (!x.isZero()) {
      for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
      if (i > 0) {
        x.iushrn(i);
        while (i-- > 0) {
          if (A.isOdd() || B.isOdd()) {
            A.iadd(yp);
            B.isub(xp);
          }

          A.iushrn(1);
          B.iushrn(1);
        }
      }

      for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
      if (j > 0) {
        y.iushrn(j);
        while (j-- > 0) {
          if (C.isOdd() || D.isOdd()) {
            C.iadd(yp);
            D.isub(xp);
          }

          C.iushrn(1);
          D.iushrn(1);
        }
      }

      if (x.cmp(y) >= 0) {
        x.isub(y);
        A.isub(C);
        B.isub(D);
      } else {
        y.isub(x);
        C.isub(A);
        D.isub(B);
      }
    }

    return {
      a: C,
      b: D,
      gcd: y.iushln(g)
    };
  };

  // This is reduced incarnation of the binary EEA
  // above, designated to invert members of the
  // _prime_ fields F(p) at a maximal speed
  BN.prototype._invmp = function _invmp (p) {
    assert(p.negative === 0);
    assert(!p.isZero());

    var a = this;
    var b = p.clone();

    if (a.negative !== 0) {
      a = a.umod(p);
    } else {
      a = a.clone();
    }

    var x1 = new BN(1);
    var x2 = new BN(0);

    var delta = b.clone();

    while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
      for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
      if (i > 0) {
        a.iushrn(i);
        while (i-- > 0) {
          if (x1.isOdd()) {
            x1.iadd(delta);
          }

          x1.iushrn(1);
        }
      }

      for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
      if (j > 0) {
        b.iushrn(j);
        while (j-- > 0) {
          if (x2.isOdd()) {
            x2.iadd(delta);
          }

          x2.iushrn(1);
        }
      }

      if (a.cmp(b) >= 0) {
        a.isub(b);
        x1.isub(x2);
      } else {
        b.isub(a);
        x2.isub(x1);
      }
    }

    var res;
    if (a.cmpn(1) === 0) {
      res = x1;
    } else {
      res = x2;
    }

    if (res.cmpn(0) < 0) {
      res.iadd(p);
    }

    return res;
  };

  BN.prototype.gcd = function gcd (num) {
    if (this.isZero()) return num.abs();
    if (num.isZero()) return this.abs();

    var a = this.clone();
    var b = num.clone();
    a.negative = 0;
    b.negative = 0;

    // Remove common factor of two
    for (var shift = 0; a.isEven() && b.isEven(); shift++) {
      a.iushrn(1);
      b.iushrn(1);
    }

    do {
      while (a.isEven()) {
        a.iushrn(1);
      }
      while (b.isEven()) {
        b.iushrn(1);
      }

      var r = a.cmp(b);
      if (r < 0) {
        // Swap `a` and `b` to make `a` always bigger than `b`
        var t = a;
        a = b;
        b = t;
      } else if (r === 0 || b.cmpn(1) === 0) {
        break;
      }

      a.isub(b);
    } while (true);

    return b.iushln(shift);
  };

  // Invert number in the field F(num)
  BN.prototype.invm = function invm (num) {
    return this.egcd(num).a.umod(num);
  };

  BN.prototype.isEven = function isEven () {
    return (this.words[0] & 1) === 0;
  };

  BN.prototype.isOdd = function isOdd () {
    return (this.words[0] & 1) === 1;
  };

  // And first word and num
  BN.prototype.andln = function andln (num) {
    return this.words[0] & num;
  };

  // Increment at the bit position in-line
  BN.prototype.bincn = function bincn (bit) {
    assert(typeof bit === 'number');
    var r = bit % 26;
    var s = (bit - r) / 26;
    var q = 1 << r;

    // Fast case: bit is much higher than all existing words
    if (this.length <= s) {
      this._expand(s + 1);
      this.words[s] |= q;
      return this;
    }

    // Add bit and propagate, if needed
    var carry = q;
    for (var i = s; carry !== 0 && i < this.length; i++) {
      var w = this.words[i] | 0;
      w += carry;
      carry = w >>> 26;
      w &= 0x3ffffff;
      this.words[i] = w;
    }
    if (carry !== 0) {
      this.words[i] = carry;
      this.length++;
    }
    return this;
  };

  BN.prototype.isZero = function isZero () {
    return this.length === 1 && this.words[0] === 0;
  };

  BN.prototype.cmpn = function cmpn (num) {
    var negative = num < 0;

    if (this.negative !== 0 && !negative) return -1;
    if (this.negative === 0 && negative) return 1;

    this.strip();

    var res;
    if (this.length > 1) {
      res = 1;
    } else {
      if (negative) {
        num = -num;
      }

      assert(num <= 0x3ffffff, 'Number is too big');

      var w = this.words[0] | 0;
      res = w === num ? 0 : w < num ? -1 : 1;
    }
    if (this.negative !== 0) return -res | 0;
    return res;
  };

  // Compare two numbers and return:
  // 1 - if `this` > `num`
  // 0 - if `this` == `num`
  // -1 - if `this` < `num`
  BN.prototype.cmp = function cmp (num) {
    if (this.negative !== 0 && num.negative === 0) return -1;
    if (this.negative === 0 && num.negative !== 0) return 1;

    var res = this.ucmp(num);
    if (this.negative !== 0) return -res | 0;
    return res;
  };

  // Unsigned comparison
  BN.prototype.ucmp = function ucmp (num) {
    // At this point both numbers have the same sign
    if (this.length > num.length) return 1;
    if (this.length < num.length) return -1;

    var res = 0;
    for (var i = this.length - 1; i >= 0; i--) {
      var a = this.words[i] | 0;
      var b = num.words[i] | 0;

      if (a === b) continue;
      if (a < b) {
        res = -1;
      } else if (a > b) {
        res = 1;
      }
      break;
    }
    return res;
  };

  BN.prototype.gtn = function gtn (num) {
    return this.cmpn(num) === 1;
  };

  BN.prototype.gt = function gt (num) {
    return this.cmp(num) === 1;
  };

  BN.prototype.gten = function gten (num) {
    return this.cmpn(num) >= 0;
  };

  BN.prototype.gte = function gte (num) {
    return this.cmp(num) >= 0;
  };

  BN.prototype.ltn = function ltn (num) {
    return this.cmpn(num) === -1;
  };

  BN.prototype.lt = function lt (num) {
    return this.cmp(num) === -1;
  };

  BN.prototype.lten = function lten (num) {
    return this.cmpn(num) <= 0;
  };

  BN.prototype.lte = function lte (num) {
    return this.cmp(num) <= 0;
  };

  BN.prototype.eqn = function eqn (num) {
    return this.cmpn(num) === 0;
  };

  BN.prototype.eq = function eq (num) {
    return this.cmp(num) === 0;
  };

  //
  // A reduce context, could be using montgomery or something better, depending
  // on the `m` itself.
  //
  BN.red = function red (num) {
    return new Red(num);
  };

  BN.prototype.toRed = function toRed (ctx) {
    assert(!this.red, 'Already a number in reduction context');
    assert(this.negative === 0, 'red works only with positives');
    return ctx.convertTo(this)._forceRed(ctx);
  };

  BN.prototype.fromRed = function fromRed () {
    assert(this.red, 'fromRed works only with numbers in reduction context');
    return this.red.convertFrom(this);
  };

  BN.prototype._forceRed = function _forceRed (ctx) {
    this.red = ctx;
    return this;
  };

  BN.prototype.forceRed = function forceRed (ctx) {
    assert(!this.red, 'Already a number in reduction context');
    return this._forceRed(ctx);
  };

  BN.prototype.redAdd = function redAdd (num) {
    assert(this.red, 'redAdd works only with red numbers');
    return this.red.add(this, num);
  };

  BN.prototype.redIAdd = function redIAdd (num) {
    assert(this.red, 'redIAdd works only with red numbers');
    return this.red.iadd(this, num);
  };

  BN.prototype.redSub = function redSub (num) {
    assert(this.red, 'redSub works only with red numbers');
    return this.red.sub(this, num);
  };

  BN.prototype.redISub = function redISub (num) {
    assert(this.red, 'redISub works only with red numbers');
    return this.red.isub(this, num);
  };

  BN.prototype.redShl = function redShl (num) {
    assert(this.red, 'redShl works only with red numbers');
    return this.red.shl(this, num);
  };

  BN.prototype.redMul = function redMul (num) {
    assert(this.red, 'redMul works only with red numbers');
    this.red._verify2(this, num);
    return this.red.mul(this, num);
  };

  BN.prototype.redIMul = function redIMul (num) {
    assert(this.red, 'redMul works only with red numbers');
    this.red._verify2(this, num);
    return this.red.imul(this, num);
  };

  BN.prototype.redSqr = function redSqr () {
    assert(this.red, 'redSqr works only with red numbers');
    this.red._verify1(this);
    return this.red.sqr(this);
  };

  BN.prototype.redISqr = function redISqr () {
    assert(this.red, 'redISqr works only with red numbers');
    this.red._verify1(this);
    return this.red.isqr(this);
  };

  // Square root over p
  BN.prototype.redSqrt = function redSqrt () {
    assert(this.red, 'redSqrt works only with red numbers');
    this.red._verify1(this);
    return this.red.sqrt(this);
  };

  BN.prototype.redInvm = function redInvm () {
    assert(this.red, 'redInvm works only with red numbers');
    this.red._verify1(this);
    return this.red.invm(this);
  };

  // Return negative clone of `this` % `red modulo`
  BN.prototype.redNeg = function redNeg () {
    assert(this.red, 'redNeg works only with red numbers');
    this.red._verify1(this);
    return this.red.neg(this);
  };

  BN.prototype.redPow = function redPow (num) {
    assert(this.red && !num.red, 'redPow(normalNum)');
    this.red._verify1(this);
    return this.red.pow(this, num);
  };

  // Prime numbers with efficient reduction
  var primes = {
    k256: null,
    p224: null,
    p192: null,
    p25519: null
  };

  // Pseudo-Mersenne prime
  function MPrime (name, p) {
    // P = 2 ^ N - K
    this.name = name;
    this.p = new BN(p, 16);
    this.n = this.p.bitLength();
    this.k = new BN(1).iushln(this.n).isub(this.p);

    this.tmp = this._tmp();
  }

  MPrime.prototype._tmp = function _tmp () {
    var tmp = new BN(null);
    tmp.words = new Array(Math.ceil(this.n / 13));
    return tmp;
  };

  MPrime.prototype.ireduce = function ireduce (num) {
    // Assumes that `num` is less than `P^2`
    // num = HI * (2 ^ N - K) + HI * K + LO = HI * K + LO (mod P)
    var r = num;
    var rlen;

    do {
      this.split(r, this.tmp);
      r = this.imulK(r);
      r = r.iadd(this.tmp);
      rlen = r.bitLength();
    } while (rlen > this.n);

    var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
    if (cmp === 0) {
      r.words[0] = 0;
      r.length = 1;
    } else if (cmp > 0) {
      r.isub(this.p);
    } else {
      if (r.strip !== undefined) {
        // r is BN v4 instance
        r.strip();
      } else {
        // r is BN v5 instance
        r._strip();
      }
    }

    return r;
  };

  MPrime.prototype.split = function split (input, out) {
    input.iushrn(this.n, 0, out);
  };

  MPrime.prototype.imulK = function imulK (num) {
    return num.imul(this.k);
  };

  function K256 () {
    MPrime.call(
      this,
      'k256',
      'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f');
  }
  inherits(K256, MPrime);

  K256.prototype.split = function split (input, output) {
    // 256 = 9 * 26 + 22
    var mask = 0x3fffff;

    var outLen = Math.min(input.length, 9);
    for (var i = 0; i < outLen; i++) {
      output.words[i] = input.words[i];
    }
    output.length = outLen;

    if (input.length <= 9) {
      input.words[0] = 0;
      input.length = 1;
      return;
    }

    // Shift by 9 limbs
    var prev = input.words[9];
    output.words[output.length++] = prev & mask;

    for (i = 10; i < input.length; i++) {
      var next = input.words[i] | 0;
      input.words[i - 10] = ((next & mask) << 4) | (prev >>> 22);
      prev = next;
    }
    prev >>>= 22;
    input.words[i - 10] = prev;
    if (prev === 0 && input.length > 10) {
      input.length -= 10;
    } else {
      input.length -= 9;
    }
  };

  K256.prototype.imulK = function imulK (num) {
    // K = 0x1000003d1 = [ 0x40, 0x3d1 ]
    num.words[num.length] = 0;
    num.words[num.length + 1] = 0;
    num.length += 2;

    // bounded at: 0x40 * 0x3ffffff + 0x3d0 = 0x100000390
    var lo = 0;
    for (var i = 0; i < num.length; i++) {
      var w = num.words[i] | 0;
      lo += w * 0x3d1;
      num.words[i] = lo & 0x3ffffff;
      lo = w * 0x40 + ((lo / 0x4000000) | 0);
    }

    // Fast length reduction
    if (num.words[num.length - 1] === 0) {
      num.length--;
      if (num.words[num.length - 1] === 0) {
        num.length--;
      }
    }
    return num;
  };

  function P224 () {
    MPrime.call(
      this,
      'p224',
      'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001');
  }
  inherits(P224, MPrime);

  function P192 () {
    MPrime.call(
      this,
      'p192',
      'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff');
  }
  inherits(P192, MPrime);

  function P25519 () {
    // 2 ^ 255 - 19
    MPrime.call(
      this,
      '25519',
      '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed');
  }
  inherits(P25519, MPrime);

  P25519.prototype.imulK = function imulK (num) {
    // K = 0x13
    var carry = 0;
    for (var i = 0; i < num.length; i++) {
      var hi = (num.words[i] | 0) * 0x13 + carry;
      var lo = hi & 0x3ffffff;
      hi >>>= 26;

      num.words[i] = lo;
      carry = hi;
    }
    if (carry !== 0) {
      num.words[num.length++] = carry;
    }
    return num;
  };

  // Exported mostly for testing purposes, use plain name instead
  BN._prime = function prime (name) {
    // Cached version of prime
    if (primes[name]) return primes[name];

    var prime;
    if (name === 'k256') {
      prime = new K256();
    } else if (name === 'p224') {
      prime = new P224();
    } else if (name === 'p192') {
      prime = new P192();
    } else if (name === 'p25519') {
      prime = new P25519();
    } else {
      throw new Error('Unknown prime ' + name);
    }
    primes[name] = prime;

    return prime;
  };

  //
  // Base reduction engine
  //
  function Red (m) {
    if (typeof m === 'string') {
      var prime = BN._prime(m);
      this.m = prime.p;
      this.prime = prime;
    } else {
      assert(m.gtn(1), 'modulus must be greater than 1');
      this.m = m;
      this.prime = null;
    }
  }

  Red.prototype._verify1 = function _verify1 (a) {
    assert(a.negative === 0, 'red works only with positives');
    assert(a.red, 'red works only with red numbers');
  };

  Red.prototype._verify2 = function _verify2 (a, b) {
    assert((a.negative | b.negative) === 0, 'red works only with positives');
    assert(a.red && a.red === b.red,
      'red works only with red numbers');
  };

  Red.prototype.imod = function imod (a) {
    if (this.prime) return this.prime.ireduce(a)._forceRed(this);
    return a.umod(this.m)._forceRed(this);
  };

  Red.prototype.neg = function neg (a) {
    if (a.isZero()) {
      return a.clone();
    }

    return this.m.sub(a)._forceRed(this);
  };

  Red.prototype.add = function add (a, b) {
    this._verify2(a, b);

    var res = a.add(b);
    if (res.cmp(this.m) >= 0) {
      res.isub(this.m);
    }
    return res._forceRed(this);
  };

  Red.prototype.iadd = function iadd (a, b) {
    this._verify2(a, b);

    var res = a.iadd(b);
    if (res.cmp(this.m) >= 0) {
      res.isub(this.m);
    }
    return res;
  };

  Red.prototype.sub = function sub (a, b) {
    this._verify2(a, b);

    var res = a.sub(b);
    if (res.cmpn(0) < 0) {
      res.iadd(this.m);
    }
    return res._forceRed(this);
  };

  Red.prototype.isub = function isub (a, b) {
    this._verify2(a, b);

    var res = a.isub(b);
    if (res.cmpn(0) < 0) {
      res.iadd(this.m);
    }
    return res;
  };

  Red.prototype.shl = function shl (a, num) {
    this._verify1(a);
    return this.imod(a.ushln(num));
  };

  Red.prototype.imul = function imul (a, b) {
    this._verify2(a, b);
    return this.imod(a.imul(b));
  };

  Red.prototype.mul = function mul (a, b) {
    this._verify2(a, b);
    return this.imod(a.mul(b));
  };

  Red.prototype.isqr = function isqr (a) {
    return this.imul(a, a.clone());
  };

  Red.prototype.sqr = function sqr (a) {
    return this.mul(a, a);
  };

  Red.prototype.sqrt = function sqrt (a) {
    if (a.isZero()) return a.clone();

    var mod3 = this.m.andln(3);
    assert(mod3 % 2 === 1);

    // Fast case
    if (mod3 === 3) {
      var pow = this.m.add(new BN(1)).iushrn(2);
      return this.pow(a, pow);
    }

    // Tonelli-Shanks algorithm (Totally unoptimized and slow)
    //
    // Find Q and S, that Q * 2 ^ S = (P - 1)
    var q = this.m.subn(1);
    var s = 0;
    while (!q.isZero() && q.andln(1) === 0) {
      s++;
      q.iushrn(1);
    }
    assert(!q.isZero());

    var one = new BN(1).toRed(this);
    var nOne = one.redNeg();

    // Find quadratic non-residue
    // NOTE: Max is such because of generalized Riemann hypothesis.
    var lpow = this.m.subn(1).iushrn(1);
    var z = this.m.bitLength();
    z = new BN(2 * z * z).toRed(this);

    while (this.pow(z, lpow).cmp(nOne) !== 0) {
      z.redIAdd(nOne);
    }

    var c = this.pow(z, q);
    var r = this.pow(a, q.addn(1).iushrn(1));
    var t = this.pow(a, q);
    var m = s;
    while (t.cmp(one) !== 0) {
      var tmp = t;
      for (var i = 0; tmp.cmp(one) !== 0; i++) {
        tmp = tmp.redSqr();
      }
      assert(i < m);
      var b = this.pow(c, new BN(1).iushln(m - i - 1));

      r = r.redMul(b);
      c = b.redSqr();
      t = t.redMul(c);
      m = i;
    }

    return r;
  };

  Red.prototype.invm = function invm (a) {
    var inv = a._invmp(this.m);
    if (inv.negative !== 0) {
      inv.negative = 0;
      return this.imod(inv).redNeg();
    } else {
      return this.imod(inv);
    }
  };

  Red.prototype.pow = function pow (a, num) {
    if (num.isZero()) return new BN(1).toRed(this);
    if (num.cmpn(1) === 0) return a.clone();

    var windowSize = 4;
    var wnd = new Array(1 << windowSize);
    wnd[0] = new BN(1).toRed(this);
    wnd[1] = a;
    for (var i = 2; i < wnd.length; i++) {
      wnd[i] = this.mul(wnd[i - 1], a);
    }

    var res = wnd[0];
    var current = 0;
    var currentLen = 0;
    var start = num.bitLength() % 26;
    if (start === 0) {
      start = 26;
    }

    for (i = num.length - 1; i >= 0; i--) {
      var word = num.words[i];
      for (var j = start - 1; j >= 0; j--) {
        var bit = (word >> j) & 1;
        if (res !== wnd[0]) {
          res = this.sqr(res);
        }

        if (bit === 0 && current === 0) {
          currentLen = 0;
          continue;
        }

        current <<= 1;
        current |= bit;
        currentLen++;
        if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;

        res = this.mul(res, wnd[current]);
        currentLen = 0;
        current = 0;
      }
      start = 26;
    }

    return res;
  };

  Red.prototype.convertTo = function convertTo (num) {
    var r = num.umod(this.m);

    return r === num ? r.clone() : r;
  };

  Red.prototype.convertFrom = function convertFrom (num) {
    var res = num.clone();
    res.red = null;
    return res;
  };

  //
  // Montgomery method engine
  //

  BN.mont = function mont (num) {
    return new Mont(num);
  };

  function Mont (m) {
    Red.call(this, m);

    this.shift = this.m.bitLength();
    if (this.shift % 26 !== 0) {
      this.shift += 26 - (this.shift % 26);
    }

    this.r = new BN(1).iushln(this.shift);
    this.r2 = this.imod(this.r.sqr());
    this.rinv = this.r._invmp(this.m);

    this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
    this.minv = this.minv.umod(this.r);
    this.minv = this.r.sub(this.minv);
  }
  inherits(Mont, Red);

  Mont.prototype.convertTo = function convertTo (num) {
    return this.imod(num.ushln(this.shift));
  };

  Mont.prototype.convertFrom = function convertFrom (num) {
    var r = this.imod(num.mul(this.rinv));
    r.red = null;
    return r;
  };

  Mont.prototype.imul = function imul (a, b) {
    if (a.isZero() || b.isZero()) {
      a.words[0] = 0;
      a.length = 1;
      return a;
    }

    var t = a.imul(b);
    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
    var u = t.isub(c).iushrn(this.shift);
    var res = u;

    if (u.cmp(this.m) >= 0) {
      res = u.isub(this.m);
    } else if (u.cmpn(0) < 0) {
      res = u.iadd(this.m);
    }

    return res._forceRed(this);
  };

  Mont.prototype.mul = function mul (a, b) {
    if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);

    var t = a.mul(b);
    var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
    var u = t.isub(c).iushrn(this.shift);
    var res = u;
    if (u.cmp(this.m) >= 0) {
      res = u.isub(this.m);
    } else if (u.cmpn(0) < 0) {
      res = u.iadd(this.m);
    }

    return res._forceRed(this);
  };

  Mont.prototype.invm = function invm (a) {
    // (AR)^-1 * R^2 = (A^-1 * R^-1) * R^2 = A^-1 * R
    var res = this.imod(a._invmp(this.m).mul(this.r2));
    return res._forceRed(this);
  };
})(typeof module === 'undefined' || module, this);

},{"buffer":2}],6:[function(require,module,exports){
var r;

module.exports = function rand(len) {
  if (!r)
    r = new Rand(null);

  return r.generate(len);
};

function Rand(rand) {
  this.rand = rand;
}
module.exports.Rand = Rand;

Rand.prototype.generate = function generate(len) {
  return this._rand(len);
};

// Emulate crypto API using randy
Rand.prototype._rand = function _rand(n) {
  if (this.rand.getBytes)
    return this.rand.getBytes(n);

  var res = new Uint8Array(n);
  for (var i = 0; i < res.length; i++)
    res[i] = this.rand.getByte();
  return res;
};

if (typeof self === 'object') {
  if (self.crypto && self.crypto.getRandomValues) {
    // Modern browsers
    Rand.prototype._rand = function _rand(n) {
      var arr = new Uint8Array(n);
      self.crypto.getRandomValues(arr);
      return arr;
    };
  } else if (self.msCrypto && self.msCrypto.getRandomValues) {
    // IE
    Rand.prototype._rand = function _rand(n) {
      var arr = new Uint8Array(n);
      self.msCrypto.getRandomValues(arr);
      return arr;
    };

  // Safari's WebWorkers do not have `crypto`
  } else if (typeof window === 'object') {
    // Old junk
    Rand.prototype._rand = function() {
      throw new Error('Not implemented yet');
    };
  }
} else {
  // Node.js or Web worker with no crypto support
  try {
    var crypto = require('crypto');
    if (typeof crypto.randomBytes !== 'function')
      throw new Error('Not supported');

    Rand.prototype._rand = function _rand(n) {
      return crypto.randomBytes(n);
    };
  } catch (e) {
  }
}

},{"crypto":2}],7:[function(require,module,exports){
'use strict';

var elliptic = exports;

elliptic.version = require('../package.json').version;
elliptic.utils = require('./elliptic/utils');
elliptic.rand = require('brorand');
elliptic.curve = require('./elliptic/curve');
elliptic.curves = require('./elliptic/curves');

// Protocols
elliptic.ec = require('./elliptic/ec');
elliptic.eddsa = require('./elliptic/eddsa');

},{"../package.json":22,"./elliptic/curve":10,"./elliptic/curves":13,"./elliptic/ec":14,"./elliptic/eddsa":17,"./elliptic/utils":21,"brorand":6}],8:[function(require,module,exports){
'use strict';

var BN = require('bn.js');
var utils = require('../utils');
var getNAF = utils.getNAF;
var getJSF = utils.getJSF;
var assert = utils.assert;

function BaseCurve(type, conf) {
  this.type = type;
  this.p = new BN(conf.p, 16);

  // Use Montgomery, when there is no fast reduction for the prime
  this.red = conf.prime ? BN.red(conf.prime) : BN.mont(this.p);

  // Useful for many curves
  this.zero = new BN(0).toRed(this.red);
  this.one = new BN(1).toRed(this.red);
  this.two = new BN(2).toRed(this.red);

  // Curve configuration, optional
  this.n = conf.n && new BN(conf.n, 16);
  this.g = conf.g && this.pointFromJSON(conf.g, conf.gRed);

  // Temporary arrays
  this._wnafT1 = new Array(4);
  this._wnafT2 = new Array(4);
  this._wnafT3 = new Array(4);
  this._wnafT4 = new Array(4);

  this._bitLength = this.n ? this.n.bitLength() : 0;

  // Generalized Greg Maxwell's trick
  var adjustCount = this.n && this.p.div(this.n);
  if (!adjustCount || adjustCount.cmpn(100) > 0) {
    this.redN = null;
  } else {
    this._maxwellTrick = true;
    this.redN = this.n.toRed(this.red);
  }
}
module.exports = BaseCurve;

BaseCurve.prototype.point = function point() {
  throw new Error('Not implemented');
};

BaseCurve.prototype.validate = function validate() {
  throw new Error('Not implemented');
};

BaseCurve.prototype._fixedNafMul = function _fixedNafMul(p, k) {
  assert(p.precomputed);
  var doubles = p._getDoubles();

  var naf = getNAF(k, 1, this._bitLength);
  var I = (1 << (doubles.step + 1)) - (doubles.step % 2 === 0 ? 2 : 1);
  I /= 3;

  // Translate into more windowed form
  var repr = [];
  var j;
  var nafW;
  for (j = 0; j < naf.length; j += doubles.step) {
    nafW = 0;
    for (var l = j + doubles.step - 1; l >= j; l--)
      nafW = (nafW << 1) + naf[l];
    repr.push(nafW);
  }

  var a = this.jpoint(null, null, null);
  var b = this.jpoint(null, null, null);
  for (var i = I; i > 0; i--) {
    for (j = 0; j < repr.length; j++) {
      nafW = repr[j];
      if (nafW === i)
        b = b.mixedAdd(doubles.points[j]);
      else if (nafW === -i)
        b = b.mixedAdd(doubles.points[j].neg());
    }
    a = a.add(b);
  }
  return a.toP();
};

BaseCurve.prototype._wnafMul = function _wnafMul(p, k) {
  var w = 4;

  // Precompute window
  var nafPoints = p._getNAFPoints(w);
  w = nafPoints.wnd;
  var wnd = nafPoints.points;

  // Get NAF form
  var naf = getNAF(k, w, this._bitLength);

  // Add `this`*(N+1) for every w-NAF index
  var acc = this.jpoint(null, null, null);
  for (var i = naf.length - 1; i >= 0; i--) {
    // Count zeroes
    for (var l = 0; i >= 0 && naf[i] === 0; i--)
      l++;
    if (i >= 0)
      l++;
    acc = acc.dblp(l);

    if (i < 0)
      break;
    var z = naf[i];
    assert(z !== 0);
    if (p.type === 'affine') {
      // J +- P
      if (z > 0)
        acc = acc.mixedAdd(wnd[(z - 1) >> 1]);
      else
        acc = acc.mixedAdd(wnd[(-z - 1) >> 1].neg());
    } else {
      // J +- J
      if (z > 0)
        acc = acc.add(wnd[(z - 1) >> 1]);
      else
        acc = acc.add(wnd[(-z - 1) >> 1].neg());
    }
  }
  return p.type === 'affine' ? acc.toP() : acc;
};

BaseCurve.prototype._wnafMulAdd = function _wnafMulAdd(defW,
  points,
  coeffs,
  len,
  jacobianResult) {
  var wndWidth = this._wnafT1;
  var wnd = this._wnafT2;
  var naf = this._wnafT3;

  // Fill all arrays
  var max = 0;
  var i;
  var j;
  var p;
  for (i = 0; i < len; i++) {
    p = points[i];
    var nafPoints = p._getNAFPoints(defW);
    wndWidth[i] = nafPoints.wnd;
    wnd[i] = nafPoints.points;
  }

  // Comb small window NAFs
  for (i = len - 1; i >= 1; i -= 2) {
    var a = i - 1;
    var b = i;
    if (wndWidth[a] !== 1 || wndWidth[b] !== 1) {
      naf[a] = getNAF(coeffs[a], wndWidth[a], this._bitLength);
      naf[b] = getNAF(coeffs[b], wndWidth[b], this._bitLength);
      max = Math.max(naf[a].length, max);
      max = Math.max(naf[b].length, max);
      continue;
    }

    var comb = [
      points[a], /* 1 */
      null, /* 3 */
      null, /* 5 */
      points[b], /* 7 */
    ];

    // Try to avoid Projective points, if possible
    if (points[a].y.cmp(points[b].y) === 0) {
      comb[1] = points[a].add(points[b]);
      comb[2] = points[a].toJ().mixedAdd(points[b].neg());
    } else if (points[a].y.cmp(points[b].y.redNeg()) === 0) {
      comb[1] = points[a].toJ().mixedAdd(points[b]);
      comb[2] = points[a].add(points[b].neg());
    } else {
      comb[1] = points[a].toJ().mixedAdd(points[b]);
      comb[2] = points[a].toJ().mixedAdd(points[b].neg());
    }

    var index = [
      -3, /* -1 -1 */
      -1, /* -1 0 */
      -5, /* -1 1 */
      -7, /* 0 -1 */
      0, /* 0 0 */
      7, /* 0 1 */
      5, /* 1 -1 */
      1, /* 1 0 */
      3,  /* 1 1 */
    ];

    var jsf = getJSF(coeffs[a], coeffs[b]);
    max = Math.max(jsf[0].length, max);
    naf[a] = new Array(max);
    naf[b] = new Array(max);
    for (j = 0; j < max; j++) {
      var ja = jsf[0][j] | 0;
      var jb = jsf[1][j] | 0;

      naf[a][j] = index[(ja + 1) * 3 + (jb + 1)];
      naf[b][j] = 0;
      wnd[a] = comb;
    }
  }

  var acc = this.jpoint(null, null, null);
  var tmp = this._wnafT4;
  for (i = max; i >= 0; i--) {
    var k = 0;

    while (i >= 0) {
      var zero = true;
      for (j = 0; j < len; j++) {
        tmp[j] = naf[j][i] | 0;
        if (tmp[j] !== 0)
          zero = false;
      }
      if (!zero)
        break;
      k++;
      i--;
    }
    if (i >= 0)
      k++;
    acc = acc.dblp(k);
    if (i < 0)
      break;

    for (j = 0; j < len; j++) {
      var z = tmp[j];
      p;
      if (z === 0)
        continue;
      else if (z > 0)
        p = wnd[j][(z - 1) >> 1];
      else if (z < 0)
        p = wnd[j][(-z - 1) >> 1].neg();

      if (p.type === 'affine')
        acc = acc.mixedAdd(p);
      else
        acc = acc.add(p);
    }
  }
  // Zeroify references
  for (i = 0; i < len; i++)
    wnd[i] = null;

  if (jacobianResult)
    return acc;
  else
    return acc.toP();
};

function BasePoint(curve, type) {
  this.curve = curve;
  this.type = type;
  this.precomputed = null;
}
BaseCurve.BasePoint = BasePoint;

BasePoint.prototype.eq = function eq(/*other*/) {
  throw new Error('Not implemented');
};

BasePoint.prototype.validate = function validate() {
  return this.curve.validate(this);
};

BaseCurve.prototype.decodePoint = function decodePoint(bytes, enc) {
  bytes = utils.toArray(bytes, enc);

  var len = this.p.byteLength();

  // uncompressed, hybrid-odd, hybrid-even
  if ((bytes[0] === 0x04 || bytes[0] === 0x06 || bytes[0] === 0x07) &&
      bytes.length - 1 === 2 * len) {
    if (bytes[0] === 0x06)
      assert(bytes[bytes.length - 1] % 2 === 0);
    else if (bytes[0] === 0x07)
      assert(bytes[bytes.length - 1] % 2 === 1);

    var res =  this.point(bytes.slice(1, 1 + len),
      bytes.slice(1 + len, 1 + 2 * len));

    return res;
  } else if ((bytes[0] === 0x02 || bytes[0] === 0x03) &&
              bytes.length - 1 === len) {
    return this.pointFromX(bytes.slice(1, 1 + len), bytes[0] === 0x03);
  }
  throw new Error('Unknown point format');
};

BasePoint.prototype.encodeCompressed = function encodeCompressed(enc) {
  return this.encode(enc, true);
};

BasePoint.prototype._encode = function _encode(compact) {
  var len = this.curve.p.byteLength();
  var x = this.getX().toArray('be', len);

  if (compact)
    return [ this.getY().isEven() ? 0x02 : 0x03 ].concat(x);

  return [ 0x04 ].concat(x, this.getY().toArray('be', len));
};

BasePoint.prototype.encode = function encode(enc, compact) {
  return utils.encode(this._encode(compact), enc);
};

BasePoint.prototype.precompute = function precompute(power) {
  if (this.precomputed)
    return this;

  var precomputed = {
    doubles: null,
    naf: null,
    beta: null,
  };
  precomputed.naf = this._getNAFPoints(8);
  precomputed.doubles = this._getDoubles(4, power);
  precomputed.beta = this._getBeta();
  this.precomputed = precomputed;

  return this;
};

BasePoint.prototype._hasDoubles = function _hasDoubles(k) {
  if (!this.precomputed)
    return false;

  var doubles = this.precomputed.doubles;
  if (!doubles)
    return false;

  return doubles.points.length >= Math.ceil((k.bitLength() + 1) / doubles.step);
};

BasePoint.prototype._getDoubles = function _getDoubles(step, power) {
  if (this.precomputed && this.precomputed.doubles)
    return this.precomputed.doubles;

  var doubles = [ this ];
  var acc = this;
  for (var i = 0; i < power; i += step) {
    for (var j = 0; j < step; j++)
      acc = acc.dbl();
    doubles.push(acc);
  }
  return {
    step: step,
    points: doubles,
  };
};

BasePoint.prototype._getNAFPoints = function _getNAFPoints(wnd) {
  if (this.precomputed && this.precomputed.naf)
    return this.precomputed.naf;

  var res = [ this ];
  var max = (1 << wnd) - 1;
  var dbl = max === 1 ? null : this.dbl();
  for (var i = 1; i < max; i++)
    res[i] = res[i - 1].add(dbl);
  return {
    wnd: wnd,
    points: res,
  };
};

BasePoint.prototype._getBeta = function _getBeta() {
  return null;
};

BasePoint.prototype.dblp = function dblp(k) {
  var r = this;
  for (var i = 0; i < k; i++)
    r = r.dbl();
  return r;
};

},{"../utils":21,"bn.js":5}],9:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var BN = require('bn.js');
var inherits = require('inherits');
var Base = require('./base');

var assert = utils.assert;

function EdwardsCurve(conf) {
  // NOTE: Important as we are creating point in Base.call()
  this.twisted = (conf.a | 0) !== 1;
  this.mOneA = this.twisted && (conf.a | 0) === -1;
  this.extended = this.mOneA;

  Base.call(this, 'edwards', conf);

  this.a = new BN(conf.a, 16).umod(this.red.m);
  this.a = this.a.toRed(this.red);
  this.c = new BN(conf.c, 16).toRed(this.red);
  this.c2 = this.c.redSqr();
  this.d = new BN(conf.d, 16).toRed(this.red);
  this.dd = this.d.redAdd(this.d);

  assert(!this.twisted || this.c.fromRed().cmpn(1) === 0);
  this.oneC = (conf.c | 0) === 1;
}
inherits(EdwardsCurve, Base);
module.exports = EdwardsCurve;

EdwardsCurve.prototype._mulA = function _mulA(num) {
  if (this.mOneA)
    return num.redNeg();
  else
    return this.a.redMul(num);
};

EdwardsCurve.prototype._mulC = function _mulC(num) {
  if (this.oneC)
    return num;
  else
    return this.c.redMul(num);
};

// Just for compatibility with Short curve
EdwardsCurve.prototype.jpoint = function jpoint(x, y, z, t) {
  return this.point(x, y, z, t);
};

EdwardsCurve.prototype.pointFromX = function pointFromX(x, odd) {
  x = new BN(x, 16);
  if (!x.red)
    x = x.toRed(this.red);

  var x2 = x.redSqr();
  var rhs = this.c2.redSub(this.a.redMul(x2));
  var lhs = this.one.redSub(this.c2.redMul(this.d).redMul(x2));

  var y2 = rhs.redMul(lhs.redInvm());
  var y = y2.redSqrt();
  if (y.redSqr().redSub(y2).cmp(this.zero) !== 0)
    throw new Error('invalid point');

  var isOdd = y.fromRed().isOdd();
  if (odd && !isOdd || !odd && isOdd)
    y = y.redNeg();

  return this.point(x, y);
};

EdwardsCurve.prototype.pointFromY = function pointFromY(y, odd) {
  y = new BN(y, 16);
  if (!y.red)
    y = y.toRed(this.red);

  // x^2 = (y^2 - c^2) / (c^2 d y^2 - a)
  var y2 = y.redSqr();
  var lhs = y2.redSub(this.c2);
  var rhs = y2.redMul(this.d).redMul(this.c2).redSub(this.a);
  var x2 = lhs.redMul(rhs.redInvm());

  if (x2.cmp(this.zero) === 0) {
    if (odd)
      throw new Error('invalid point');
    else
      return this.point(this.zero, y);
  }

  var x = x2.redSqrt();
  if (x.redSqr().redSub(x2).cmp(this.zero) !== 0)
    throw new Error('invalid point');

  if (x.fromRed().isOdd() !== odd)
    x = x.redNeg();

  return this.point(x, y);
};

EdwardsCurve.prototype.validate = function validate(point) {
  if (point.isInfinity())
    return true;

  // Curve: A * X^2 + Y^2 = C^2 * (1 + D * X^2 * Y^2)
  point.normalize();

  var x2 = point.x.redSqr();
  var y2 = point.y.redSqr();
  var lhs = x2.redMul(this.a).redAdd(y2);
  var rhs = this.c2.redMul(this.one.redAdd(this.d.redMul(x2).redMul(y2)));

  return lhs.cmp(rhs) === 0;
};

function Point(curve, x, y, z, t) {
  Base.BasePoint.call(this, curve, 'projective');
  if (x === null && y === null && z === null) {
    this.x = this.curve.zero;
    this.y = this.curve.one;
    this.z = this.curve.one;
    this.t = this.curve.zero;
    this.zOne = true;
  } else {
    this.x = new BN(x, 16);
    this.y = new BN(y, 16);
    this.z = z ? new BN(z, 16) : this.curve.one;
    this.t = t && new BN(t, 16);
    if (!this.x.red)
      this.x = this.x.toRed(this.curve.red);
    if (!this.y.red)
      this.y = this.y.toRed(this.curve.red);
    if (!this.z.red)
      this.z = this.z.toRed(this.curve.red);
    if (this.t && !this.t.red)
      this.t = this.t.toRed(this.curve.red);
    this.zOne = this.z === this.curve.one;

    // Use extended coordinates
    if (this.curve.extended && !this.t) {
      this.t = this.x.redMul(this.y);
      if (!this.zOne)
        this.t = this.t.redMul(this.z.redInvm());
    }
  }
}
inherits(Point, Base.BasePoint);

EdwardsCurve.prototype.pointFromJSON = function pointFromJSON(obj) {
  return Point.fromJSON(this, obj);
};

EdwardsCurve.prototype.point = function point(x, y, z, t) {
  return new Point(this, x, y, z, t);
};

Point.fromJSON = function fromJSON(curve, obj) {
  return new Point(curve, obj[0], obj[1], obj[2]);
};

Point.prototype.inspect = function inspect() {
  if (this.isInfinity())
    return '<EC Point Infinity>';
  return '<EC Point x: ' + this.x.fromRed().toString(16, 2) +
      ' y: ' + this.y.fromRed().toString(16, 2) +
      ' z: ' + this.z.fromRed().toString(16, 2) + '>';
};

Point.prototype.isInfinity = function isInfinity() {
  // XXX This code assumes that zero is always zero in red
  return this.x.cmpn(0) === 0 &&
    (this.y.cmp(this.z) === 0 ||
    (this.zOne && this.y.cmp(this.curve.c) === 0));
};

Point.prototype._extDbl = function _extDbl() {
  // hyperelliptic.org/EFD/g1p/auto-twisted-extended-1.html
  //     #doubling-dbl-2008-hwcd
  // 4M + 4S

  // A = X1^2
  var a = this.x.redSqr();
  // B = Y1^2
  var b = this.y.redSqr();
  // C = 2 * Z1^2
  var c = this.z.redSqr();
  c = c.redIAdd(c);
  // D = a * A
  var d = this.curve._mulA(a);
  // E = (X1 + Y1)^2 - A - B
  var e = this.x.redAdd(this.y).redSqr().redISub(a).redISub(b);
  // G = D + B
  var g = d.redAdd(b);
  // F = G - C
  var f = g.redSub(c);
  // H = D - B
  var h = d.redSub(b);
  // X3 = E * F
  var nx = e.redMul(f);
  // Y3 = G * H
  var ny = g.redMul(h);
  // T3 = E * H
  var nt = e.redMul(h);
  // Z3 = F * G
  var nz = f.redMul(g);
  return this.curve.point(nx, ny, nz, nt);
};

Point.prototype._projDbl = function _projDbl() {
  // hyperelliptic.org/EFD/g1p/auto-twisted-projective.html
  //     #doubling-dbl-2008-bbjlp
  //     #doubling-dbl-2007-bl
  // and others
  // Generally 3M + 4S or 2M + 4S

  // B = (X1 + Y1)^2
  var b = this.x.redAdd(this.y).redSqr();
  // C = X1^2
  var c = this.x.redSqr();
  // D = Y1^2
  var d = this.y.redSqr();

  var nx;
  var ny;
  var nz;
  var e;
  var h;
  var j;
  if (this.curve.twisted) {
    // E = a * C
    e = this.curve._mulA(c);
    // F = E + D
    var f = e.redAdd(d);
    if (this.zOne) {
      // X3 = (B - C - D) * (F - 2)
      nx = b.redSub(c).redSub(d).redMul(f.redSub(this.curve.two));
      // Y3 = F * (E - D)
      ny = f.redMul(e.redSub(d));
      // Z3 = F^2 - 2 * F
      nz = f.redSqr().redSub(f).redSub(f);
    } else {
      // H = Z1^2
      h = this.z.redSqr();
      // J = F - 2 * H
      j = f.redSub(h).redISub(h);
      // X3 = (B-C-D)*J
      nx = b.redSub(c).redISub(d).redMul(j);
      // Y3 = F * (E - D)
      ny = f.redMul(e.redSub(d));
      // Z3 = F * J
      nz = f.redMul(j);
    }
  } else {
    // E = C + D
    e = c.redAdd(d);
    // H = (c * Z1)^2
    h = this.curve._mulC(this.z).redSqr();
    // J = E - 2 * H
    j = e.redSub(h).redSub(h);
    // X3 = c * (B - E) * J
    nx = this.curve._mulC(b.redISub(e)).redMul(j);
    // Y3 = c * E * (C - D)
    ny = this.curve._mulC(e).redMul(c.redISub(d));
    // Z3 = E * J
    nz = e.redMul(j);
  }
  return this.curve.point(nx, ny, nz);
};

Point.prototype.dbl = function dbl() {
  if (this.isInfinity())
    return this;

  // Double in extended coordinates
  if (this.curve.extended)
    return this._extDbl();
  else
    return this._projDbl();
};

Point.prototype._extAdd = function _extAdd(p) {
  // hyperelliptic.org/EFD/g1p/auto-twisted-extended-1.html
  //     #addition-add-2008-hwcd-3
  // 8M

  // A = (Y1 - X1) * (Y2 - X2)
  var a = this.y.redSub(this.x).redMul(p.y.redSub(p.x));
  // B = (Y1 + X1) * (Y2 + X2)
  var b = this.y.redAdd(this.x).redMul(p.y.redAdd(p.x));
  // C = T1 * k * T2
  var c = this.t.redMul(this.curve.dd).redMul(p.t);
  // D = Z1 * 2 * Z2
  var d = this.z.redMul(p.z.redAdd(p.z));
  // E = B - A
  var e = b.redSub(a);
  // F = D - C
  var f = d.redSub(c);
  // G = D + C
  var g = d.redAdd(c);
  // H = B + A
  var h = b.redAdd(a);
  // X3 = E * F
  var nx = e.redMul(f);
  // Y3 = G * H
  var ny = g.redMul(h);
  // T3 = E * H
  var nt = e.redMul(h);
  // Z3 = F * G
  var nz = f.redMul(g);
  return this.curve.point(nx, ny, nz, nt);
};

Point.prototype._projAdd = function _projAdd(p) {
  // hyperelliptic.org/EFD/g1p/auto-twisted-projective.html
  //     #addition-add-2008-bbjlp
  //     #addition-add-2007-bl
  // 10M + 1S

  // A = Z1 * Z2
  var a = this.z.redMul(p.z);
  // B = A^2
  var b = a.redSqr();
  // C = X1 * X2
  var c = this.x.redMul(p.x);
  // D = Y1 * Y2
  var d = this.y.redMul(p.y);
  // E = d * C * D
  var e = this.curve.d.redMul(c).redMul(d);
  // F = B - E
  var f = b.redSub(e);
  // G = B + E
  var g = b.redAdd(e);
  // X3 = A * F * ((X1 + Y1) * (X2 + Y2) - C - D)
  var tmp = this.x.redAdd(this.y).redMul(p.x.redAdd(p.y)).redISub(c).redISub(d);
  var nx = a.redMul(f).redMul(tmp);
  var ny;
  var nz;
  if (this.curve.twisted) {
    // Y3 = A * G * (D - a * C)
    ny = a.redMul(g).redMul(d.redSub(this.curve._mulA(c)));
    // Z3 = F * G
    nz = f.redMul(g);
  } else {
    // Y3 = A * G * (D - C)
    ny = a.redMul(g).redMul(d.redSub(c));
    // Z3 = c * F * G
    nz = this.curve._mulC(f).redMul(g);
  }
  return this.curve.point(nx, ny, nz);
};

Point.prototype.add = function add(p) {
  if (this.isInfinity())
    return p;
  if (p.isInfinity())
    return this;

  if (this.curve.extended)
    return this._extAdd(p);
  else
    return this._projAdd(p);
};

Point.prototype.mul = function mul(k) {
  if (this._hasDoubles(k))
    return this.curve._fixedNafMul(this, k);
  else
    return this.curve._wnafMul(this, k);
};

Point.prototype.mulAdd = function mulAdd(k1, p, k2) {
  return this.curve._wnafMulAdd(1, [ this, p ], [ k1, k2 ], 2, false);
};

Point.prototype.jmulAdd = function jmulAdd(k1, p, k2) {
  return this.curve._wnafMulAdd(1, [ this, p ], [ k1, k2 ], 2, true);
};

Point.prototype.normalize = function normalize() {
  if (this.zOne)
    return this;

  // Normalize coordinates
  var zi = this.z.redInvm();
  this.x = this.x.redMul(zi);
  this.y = this.y.redMul(zi);
  if (this.t)
    this.t = this.t.redMul(zi);
  this.z = this.curve.one;
  this.zOne = true;
  return this;
};

Point.prototype.neg = function neg() {
  return this.curve.point(this.x.redNeg(),
    this.y,
    this.z,
    this.t && this.t.redNeg());
};

Point.prototype.getX = function getX() {
  this.normalize();
  return this.x.fromRed();
};

Point.prototype.getY = function getY() {
  this.normalize();
  return this.y.fromRed();
};

Point.prototype.eq = function eq(other) {
  return this === other ||
         this.getX().cmp(other.getX()) === 0 &&
         this.getY().cmp(other.getY()) === 0;
};

Point.prototype.eqXToP = function eqXToP(x) {
  var rx = x.toRed(this.curve.red).redMul(this.z);
  if (this.x.cmp(rx) === 0)
    return true;

  var xc = x.clone();
  var t = this.curve.redN.redMul(this.z);
  for (;;) {
    xc.iadd(this.curve.n);
    if (xc.cmp(this.curve.p) >= 0)
      return false;

    rx.redIAdd(t);
    if (this.x.cmp(rx) === 0)
      return true;
  }
};

// Compatibility with BaseCurve
Point.prototype.toP = Point.prototype.normalize;
Point.prototype.mixedAdd = Point.prototype.add;

},{"../utils":21,"./base":8,"bn.js":5,"inherits":36}],10:[function(require,module,exports){
'use strict';

var curve = exports;

curve.base = require('./base');
curve.short = require('./short');
curve.mont = require('./mont');
curve.edwards = require('./edwards');

},{"./base":8,"./edwards":9,"./mont":11,"./short":12}],11:[function(require,module,exports){
'use strict';

var BN = require('bn.js');
var inherits = require('inherits');
var Base = require('./base');

var utils = require('../utils');

function MontCurve(conf) {
  Base.call(this, 'mont', conf);

  this.a = new BN(conf.a, 16).toRed(this.red);
  this.b = new BN(conf.b, 16).toRed(this.red);
  this.i4 = new BN(4).toRed(this.red).redInvm();
  this.two = new BN(2).toRed(this.red);
  this.a24 = this.i4.redMul(this.a.redAdd(this.two));
}
inherits(MontCurve, Base);
module.exports = MontCurve;

MontCurve.prototype.validate = function validate(point) {
  var x = point.normalize().x;
  var x2 = x.redSqr();
  var rhs = x2.redMul(x).redAdd(x2.redMul(this.a)).redAdd(x);
  var y = rhs.redSqrt();

  return y.redSqr().cmp(rhs) === 0;
};

function Point(curve, x, z) {
  Base.BasePoint.call(this, curve, 'projective');
  if (x === null && z === null) {
    this.x = this.curve.one;
    this.z = this.curve.zero;
  } else {
    this.x = new BN(x, 16);
    this.z = new BN(z, 16);
    if (!this.x.red)
      this.x = this.x.toRed(this.curve.red);
    if (!this.z.red)
      this.z = this.z.toRed(this.curve.red);
  }
}
inherits(Point, Base.BasePoint);

MontCurve.prototype.decodePoint = function decodePoint(bytes, enc) {
  return this.point(utils.toArray(bytes, enc), 1);
};

MontCurve.prototype.point = function point(x, z) {
  return new Point(this, x, z);
};

MontCurve.prototype.pointFromJSON = function pointFromJSON(obj) {
  return Point.fromJSON(this, obj);
};

Point.prototype.precompute = function precompute() {
  // No-op
};

Point.prototype._encode = function _encode() {
  return this.getX().toArray('be', this.curve.p.byteLength());
};

Point.fromJSON = function fromJSON(curve, obj) {
  return new Point(curve, obj[0], obj[1] || curve.one);
};

Point.prototype.inspect = function inspect() {
  if (this.isInfinity())
    return '<EC Point Infinity>';
  return '<EC Point x: ' + this.x.fromRed().toString(16, 2) +
      ' z: ' + this.z.fromRed().toString(16, 2) + '>';
};

Point.prototype.isInfinity = function isInfinity() {
  // XXX This code assumes that zero is always zero in red
  return this.z.cmpn(0) === 0;
};

Point.prototype.dbl = function dbl() {
  // http://hyperelliptic.org/EFD/g1p/auto-montgom-xz.html#doubling-dbl-1987-m-3
  // 2M + 2S + 4A

  // A = X1 + Z1
  var a = this.x.redAdd(this.z);
  // AA = A^2
  var aa = a.redSqr();
  // B = X1 - Z1
  var b = this.x.redSub(this.z);
  // BB = B^2
  var bb = b.redSqr();
  // C = AA - BB
  var c = aa.redSub(bb);
  // X3 = AA * BB
  var nx = aa.redMul(bb);
  // Z3 = C * (BB + A24 * C)
  var nz = c.redMul(bb.redAdd(this.curve.a24.redMul(c)));
  return this.curve.point(nx, nz);
};

Point.prototype.add = function add() {
  throw new Error('Not supported on Montgomery curve');
};

Point.prototype.diffAdd = function diffAdd(p, diff) {
  // http://hyperelliptic.org/EFD/g1p/auto-montgom-xz.html#diffadd-dadd-1987-m-3
  // 4M + 2S + 6A

  // A = X2 + Z2
  var a = this.x.redAdd(this.z);
  // B = X2 - Z2
  var b = this.x.redSub(this.z);
  // C = X3 + Z3
  var c = p.x.redAdd(p.z);
  // D = X3 - Z3
  var d = p.x.redSub(p.z);
  // DA = D * A
  var da = d.redMul(a);
  // CB = C * B
  var cb = c.redMul(b);
  // X5 = Z1 * (DA + CB)^2
  var nx = diff.z.redMul(da.redAdd(cb).redSqr());
  // Z5 = X1 * (DA - CB)^2
  var nz = diff.x.redMul(da.redISub(cb).redSqr());
  return this.curve.point(nx, nz);
};

Point.prototype.mul = function mul(k) {
  var t = k.clone();
  var a = this; // (N / 2) * Q + Q
  var b = this.curve.point(null, null); // (N / 2) * Q
  var c = this; // Q

  for (var bits = []; t.cmpn(0) !== 0; t.iushrn(1))
    bits.push(t.andln(1));

  for (var i = bits.length - 1; i >= 0; i--) {
    if (bits[i] === 0) {
      // N * Q + Q = ((N / 2) * Q + Q)) + (N / 2) * Q
      a = a.diffAdd(b, c);
      // N * Q = 2 * ((N / 2) * Q + Q))
      b = b.dbl();
    } else {
      // N * Q = ((N / 2) * Q + Q) + ((N / 2) * Q)
      b = a.diffAdd(b, c);
      // N * Q + Q = 2 * ((N / 2) * Q + Q)
      a = a.dbl();
    }
  }
  return b;
};

Point.prototype.mulAdd = function mulAdd() {
  throw new Error('Not supported on Montgomery curve');
};

Point.prototype.jumlAdd = function jumlAdd() {
  throw new Error('Not supported on Montgomery curve');
};

Point.prototype.eq = function eq(other) {
  return this.getX().cmp(other.getX()) === 0;
};

Point.prototype.normalize = function normalize() {
  this.x = this.x.redMul(this.z.redInvm());
  this.z = this.curve.one;
  return this;
};

Point.prototype.getX = function getX() {
  // Normalize coordinates
  this.normalize();

  return this.x.fromRed();
};

},{"../utils":21,"./base":8,"bn.js":5,"inherits":36}],12:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var BN = require('bn.js');
var inherits = require('inherits');
var Base = require('./base');

var assert = utils.assert;

function ShortCurve(conf) {
  Base.call(this, 'short', conf);

  this.a = new BN(conf.a, 16).toRed(this.red);
  this.b = new BN(conf.b, 16).toRed(this.red);
  this.tinv = this.two.redInvm();

  this.zeroA = this.a.fromRed().cmpn(0) === 0;
  this.threeA = this.a.fromRed().sub(this.p).cmpn(-3) === 0;

  // If the curve is endomorphic, precalculate beta and lambda
  this.endo = this._getEndomorphism(conf);
  this._endoWnafT1 = new Array(4);
  this._endoWnafT2 = new Array(4);
}
inherits(ShortCurve, Base);
module.exports = ShortCurve;

ShortCurve.prototype._getEndomorphism = function _getEndomorphism(conf) {
  // No efficient endomorphism
  if (!this.zeroA || !this.g || !this.n || this.p.modn(3) !== 1)
    return;

  // Compute beta and lambda, that lambda * P = (beta * Px; Py)
  var beta;
  var lambda;
  if (conf.beta) {
    beta = new BN(conf.beta, 16).toRed(this.red);
  } else {
    var betas = this._getEndoRoots(this.p);
    // Choose the smallest beta
    beta = betas[0].cmp(betas[1]) < 0 ? betas[0] : betas[1];
    beta = beta.toRed(this.red);
  }
  if (conf.lambda) {
    lambda = new BN(conf.lambda, 16);
  } else {
    // Choose the lambda that is matching selected beta
    var lambdas = this._getEndoRoots(this.n);
    if (this.g.mul(lambdas[0]).x.cmp(this.g.x.redMul(beta)) === 0) {
      lambda = lambdas[0];
    } else {
      lambda = lambdas[1];
      assert(this.g.mul(lambda).x.cmp(this.g.x.redMul(beta)) === 0);
    }
  }

  // Get basis vectors, used for balanced length-two representation
  var basis;
  if (conf.basis) {
    basis = conf.basis.map(function(vec) {
      return {
        a: new BN(vec.a, 16),
        b: new BN(vec.b, 16),
      };
    });
  } else {
    basis = this._getEndoBasis(lambda);
  }

  return {
    beta: beta,
    lambda: lambda,
    basis: basis,
  };
};

ShortCurve.prototype._getEndoRoots = function _getEndoRoots(num) {
  // Find roots of for x^2 + x + 1 in F
  // Root = (-1 +- Sqrt(-3)) / 2
  //
  var red = num === this.p ? this.red : BN.mont(num);
  var tinv = new BN(2).toRed(red).redInvm();
  var ntinv = tinv.redNeg();

  var s = new BN(3).toRed(red).redNeg().redSqrt().redMul(tinv);

  var l1 = ntinv.redAdd(s).fromRed();
  var l2 = ntinv.redSub(s).fromRed();
  return [ l1, l2 ];
};

ShortCurve.prototype._getEndoBasis = function _getEndoBasis(lambda) {
  // aprxSqrt >= sqrt(this.n)
  var aprxSqrt = this.n.ushrn(Math.floor(this.n.bitLength() / 2));

  // 3.74
  // Run EGCD, until r(L + 1) < aprxSqrt
  var u = lambda;
  var v = this.n.clone();
  var x1 = new BN(1);
  var y1 = new BN(0);
  var x2 = new BN(0);
  var y2 = new BN(1);

  // NOTE: all vectors are roots of: a + b * lambda = 0 (mod n)
  var a0;
  var b0;
  // First vector
  var a1;
  var b1;
  // Second vector
  var a2;
  var b2;

  var prevR;
  var i = 0;
  var r;
  var x;
  while (u.cmpn(0) !== 0) {
    var q = v.div(u);
    r = v.sub(q.mul(u));
    x = x2.sub(q.mul(x1));
    var y = y2.sub(q.mul(y1));

    if (!a1 && r.cmp(aprxSqrt) < 0) {
      a0 = prevR.neg();
      b0 = x1;
      a1 = r.neg();
      b1 = x;
    } else if (a1 && ++i === 2) {
      break;
    }
    prevR = r;

    v = u;
    u = r;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
  }
  a2 = r.neg();
  b2 = x;

  var len1 = a1.sqr().add(b1.sqr());
  var len2 = a2.sqr().add(b2.sqr());
  if (len2.cmp(len1) >= 0) {
    a2 = a0;
    b2 = b0;
  }

  // Normalize signs
  if (a1.negative) {
    a1 = a1.neg();
    b1 = b1.neg();
  }
  if (a2.negative) {
    a2 = a2.neg();
    b2 = b2.neg();
  }

  return [
    { a: a1, b: b1 },
    { a: a2, b: b2 },
  ];
};

ShortCurve.prototype._endoSplit = function _endoSplit(k) {
  var basis = this.endo.basis;
  var v1 = basis[0];
  var v2 = basis[1];

  var c1 = v2.b.mul(k).divRound(this.n);
  var c2 = v1.b.neg().mul(k).divRound(this.n);

  var p1 = c1.mul(v1.a);
  var p2 = c2.mul(v2.a);
  var q1 = c1.mul(v1.b);
  var q2 = c2.mul(v2.b);

  // Calculate answer
  var k1 = k.sub(p1).sub(p2);
  var k2 = q1.add(q2).neg();
  return { k1: k1, k2: k2 };
};

ShortCurve.prototype.pointFromX = function pointFromX(x, odd) {
  x = new BN(x, 16);
  if (!x.red)
    x = x.toRed(this.red);

  var y2 = x.redSqr().redMul(x).redIAdd(x.redMul(this.a)).redIAdd(this.b);
  var y = y2.redSqrt();
  if (y.redSqr().redSub(y2).cmp(this.zero) !== 0)
    throw new Error('invalid point');

  // XXX Is there any way to tell if the number is odd without converting it
  // to non-red form?
  var isOdd = y.fromRed().isOdd();
  if (odd && !isOdd || !odd && isOdd)
    y = y.redNeg();

  return this.point(x, y);
};

ShortCurve.prototype.validate = function validate(point) {
  if (point.inf)
    return true;

  var x = point.x;
  var y = point.y;

  var ax = this.a.redMul(x);
  var rhs = x.redSqr().redMul(x).redIAdd(ax).redIAdd(this.b);
  return y.redSqr().redISub(rhs).cmpn(0) === 0;
};

ShortCurve.prototype._endoWnafMulAdd =
    function _endoWnafMulAdd(points, coeffs, jacobianResult) {
      var npoints = this._endoWnafT1;
      var ncoeffs = this._endoWnafT2;
      for (var i = 0; i < points.length; i++) {
        var split = this._endoSplit(coeffs[i]);
        var p = points[i];
        var beta = p._getBeta();

        if (split.k1.negative) {
          split.k1.ineg();
          p = p.neg(true);
        }
        if (split.k2.negative) {
          split.k2.ineg();
          beta = beta.neg(true);
        }

        npoints[i * 2] = p;
        npoints[i * 2 + 1] = beta;
        ncoeffs[i * 2] = split.k1;
        ncoeffs[i * 2 + 1] = split.k2;
      }
      var res = this._wnafMulAdd(1, npoints, ncoeffs, i * 2, jacobianResult);

      // Clean-up references to points and coefficients
      for (var j = 0; j < i * 2; j++) {
        npoints[j] = null;
        ncoeffs[j] = null;
      }
      return res;
    };

function Point(curve, x, y, isRed) {
  Base.BasePoint.call(this, curve, 'affine');
  if (x === null && y === null) {
    this.x = null;
    this.y = null;
    this.inf = true;
  } else {
    this.x = new BN(x, 16);
    this.y = new BN(y, 16);
    // Force redgomery representation when loading from JSON
    if (isRed) {
      this.x.forceRed(this.curve.red);
      this.y.forceRed(this.curve.red);
    }
    if (!this.x.red)
      this.x = this.x.toRed(this.curve.red);
    if (!this.y.red)
      this.y = this.y.toRed(this.curve.red);
    this.inf = false;
  }
}
inherits(Point, Base.BasePoint);

ShortCurve.prototype.point = function point(x, y, isRed) {
  return new Point(this, x, y, isRed);
};

ShortCurve.prototype.pointFromJSON = function pointFromJSON(obj, red) {
  return Point.fromJSON(this, obj, red);
};

Point.prototype._getBeta = function _getBeta() {
  if (!this.curve.endo)
    return;

  var pre = this.precomputed;
  if (pre && pre.beta)
    return pre.beta;

  var beta = this.curve.point(this.x.redMul(this.curve.endo.beta), this.y);
  if (pre) {
    var curve = this.curve;
    var endoMul = function(p) {
      return curve.point(p.x.redMul(curve.endo.beta), p.y);
    };
    pre.beta = beta;
    beta.precomputed = {
      beta: null,
      naf: pre.naf && {
        wnd: pre.naf.wnd,
        points: pre.naf.points.map(endoMul),
      },
      doubles: pre.doubles && {
        step: pre.doubles.step,
        points: pre.doubles.points.map(endoMul),
      },
    };
  }
  return beta;
};

Point.prototype.toJSON = function toJSON() {
  if (!this.precomputed)
    return [ this.x, this.y ];

  return [ this.x, this.y, this.precomputed && {
    doubles: this.precomputed.doubles && {
      step: this.precomputed.doubles.step,
      points: this.precomputed.doubles.points.slice(1),
    },
    naf: this.precomputed.naf && {
      wnd: this.precomputed.naf.wnd,
      points: this.precomputed.naf.points.slice(1),
    },
  } ];
};

Point.fromJSON = function fromJSON(curve, obj, red) {
  if (typeof obj === 'string')
    obj = JSON.parse(obj);
  var res = curve.point(obj[0], obj[1], red);
  if (!obj[2])
    return res;

  function obj2point(obj) {
    return curve.point(obj[0], obj[1], red);
  }

  var pre = obj[2];
  res.precomputed = {
    beta: null,
    doubles: pre.doubles && {
      step: pre.doubles.step,
      points: [ res ].concat(pre.doubles.points.map(obj2point)),
    },
    naf: pre.naf && {
      wnd: pre.naf.wnd,
      points: [ res ].concat(pre.naf.points.map(obj2point)),
    },
  };
  return res;
};

Point.prototype.inspect = function inspect() {
  if (this.isInfinity())
    return '<EC Point Infinity>';
  return '<EC Point x: ' + this.x.fromRed().toString(16, 2) +
      ' y: ' + this.y.fromRed().toString(16, 2) + '>';
};

Point.prototype.isInfinity = function isInfinity() {
  return this.inf;
};

Point.prototype.add = function add(p) {
  // O + P = P
  if (this.inf)
    return p;

  // P + O = P
  if (p.inf)
    return this;

  // P + P = 2P
  if (this.eq(p))
    return this.dbl();

  // P + (-P) = O
  if (this.neg().eq(p))
    return this.curve.point(null, null);

  // P + Q = O
  if (this.x.cmp(p.x) === 0)
    return this.curve.point(null, null);

  var c = this.y.redSub(p.y);
  if (c.cmpn(0) !== 0)
    c = c.redMul(this.x.redSub(p.x).redInvm());
  var nx = c.redSqr().redISub(this.x).redISub(p.x);
  var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
  return this.curve.point(nx, ny);
};

Point.prototype.dbl = function dbl() {
  if (this.inf)
    return this;

  // 2P = O
  var ys1 = this.y.redAdd(this.y);
  if (ys1.cmpn(0) === 0)
    return this.curve.point(null, null);

  var a = this.curve.a;

  var x2 = this.x.redSqr();
  var dyinv = ys1.redInvm();
  var c = x2.redAdd(x2).redIAdd(x2).redIAdd(a).redMul(dyinv);

  var nx = c.redSqr().redISub(this.x.redAdd(this.x));
  var ny = c.redMul(this.x.redSub(nx)).redISub(this.y);
  return this.curve.point(nx, ny);
};

Point.prototype.getX = function getX() {
  return this.x.fromRed();
};

Point.prototype.getY = function getY() {
  return this.y.fromRed();
};

Point.prototype.mul = function mul(k) {
  k = new BN(k, 16);
  if (this.isInfinity())
    return this;
  else if (this._hasDoubles(k))
    return this.curve._fixedNafMul(this, k);
  else if (this.curve.endo)
    return this.curve._endoWnafMulAdd([ this ], [ k ]);
  else
    return this.curve._wnafMul(this, k);
};

Point.prototype.mulAdd = function mulAdd(k1, p2, k2) {
  var points = [ this, p2 ];
  var coeffs = [ k1, k2 ];
  if (this.curve.endo)
    return this.curve._endoWnafMulAdd(points, coeffs);
  else
    return this.curve._wnafMulAdd(1, points, coeffs, 2);
};

Point.prototype.jmulAdd = function jmulAdd(k1, p2, k2) {
  var points = [ this, p2 ];
  var coeffs = [ k1, k2 ];
  if (this.curve.endo)
    return this.curve._endoWnafMulAdd(points, coeffs, true);
  else
    return this.curve._wnafMulAdd(1, points, coeffs, 2, true);
};

Point.prototype.eq = function eq(p) {
  return this === p ||
         this.inf === p.inf &&
             (this.inf || this.x.cmp(p.x) === 0 && this.y.cmp(p.y) === 0);
};

Point.prototype.neg = function neg(_precompute) {
  if (this.inf)
    return this;

  var res = this.curve.point(this.x, this.y.redNeg());
  if (_precompute && this.precomputed) {
    var pre = this.precomputed;
    var negate = function(p) {
      return p.neg();
    };
    res.precomputed = {
      naf: pre.naf && {
        wnd: pre.naf.wnd,
        points: pre.naf.points.map(negate),
      },
      doubles: pre.doubles && {
        step: pre.doubles.step,
        points: pre.doubles.points.map(negate),
      },
    };
  }
  return res;
};

Point.prototype.toJ = function toJ() {
  if (this.inf)
    return this.curve.jpoint(null, null, null);

  var res = this.curve.jpoint(this.x, this.y, this.curve.one);
  return res;
};

function JPoint(curve, x, y, z) {
  Base.BasePoint.call(this, curve, 'jacobian');
  if (x === null && y === null && z === null) {
    this.x = this.curve.one;
    this.y = this.curve.one;
    this.z = new BN(0);
  } else {
    this.x = new BN(x, 16);
    this.y = new BN(y, 16);
    this.z = new BN(z, 16);
  }
  if (!this.x.red)
    this.x = this.x.toRed(this.curve.red);
  if (!this.y.red)
    this.y = this.y.toRed(this.curve.red);
  if (!this.z.red)
    this.z = this.z.toRed(this.curve.red);

  this.zOne = this.z === this.curve.one;
}
inherits(JPoint, Base.BasePoint);

ShortCurve.prototype.jpoint = function jpoint(x, y, z) {
  return new JPoint(this, x, y, z);
};

JPoint.prototype.toP = function toP() {
  if (this.isInfinity())
    return this.curve.point(null, null);

  var zinv = this.z.redInvm();
  var zinv2 = zinv.redSqr();
  var ax = this.x.redMul(zinv2);
  var ay = this.y.redMul(zinv2).redMul(zinv);

  return this.curve.point(ax, ay);
};

JPoint.prototype.neg = function neg() {
  return this.curve.jpoint(this.x, this.y.redNeg(), this.z);
};

JPoint.prototype.add = function add(p) {
  // O + P = P
  if (this.isInfinity())
    return p;

  // P + O = P
  if (p.isInfinity())
    return this;

  // 12M + 4S + 7A
  var pz2 = p.z.redSqr();
  var z2 = this.z.redSqr();
  var u1 = this.x.redMul(pz2);
  var u2 = p.x.redMul(z2);
  var s1 = this.y.redMul(pz2.redMul(p.z));
  var s2 = p.y.redMul(z2.redMul(this.z));

  var h = u1.redSub(u2);
  var r = s1.redSub(s2);
  if (h.cmpn(0) === 0) {
    if (r.cmpn(0) !== 0)
      return this.curve.jpoint(null, null, null);
    else
      return this.dbl();
  }

  var h2 = h.redSqr();
  var h3 = h2.redMul(h);
  var v = u1.redMul(h2);

  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
  var nz = this.z.redMul(p.z).redMul(h);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.mixedAdd = function mixedAdd(p) {
  // O + P = P
  if (this.isInfinity())
    return p.toJ();

  // P + O = P
  if (p.isInfinity())
    return this;

  // 8M + 3S + 7A
  var z2 = this.z.redSqr();
  var u1 = this.x;
  var u2 = p.x.redMul(z2);
  var s1 = this.y;
  var s2 = p.y.redMul(z2).redMul(this.z);

  var h = u1.redSub(u2);
  var r = s1.redSub(s2);
  if (h.cmpn(0) === 0) {
    if (r.cmpn(0) !== 0)
      return this.curve.jpoint(null, null, null);
    else
      return this.dbl();
  }

  var h2 = h.redSqr();
  var h3 = h2.redMul(h);
  var v = u1.redMul(h2);

  var nx = r.redSqr().redIAdd(h3).redISub(v).redISub(v);
  var ny = r.redMul(v.redISub(nx)).redISub(s1.redMul(h3));
  var nz = this.z.redMul(h);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.dblp = function dblp(pow) {
  if (pow === 0)
    return this;
  if (this.isInfinity())
    return this;
  if (!pow)
    return this.dbl();

  var i;
  if (this.curve.zeroA || this.curve.threeA) {
    var r = this;
    for (i = 0; i < pow; i++)
      r = r.dbl();
    return r;
  }

  // 1M + 2S + 1A + N * (4S + 5M + 8A)
  // N = 1 => 6M + 6S + 9A
  var a = this.curve.a;
  var tinv = this.curve.tinv;

  var jx = this.x;
  var jy = this.y;
  var jz = this.z;
  var jz4 = jz.redSqr().redSqr();

  // Reuse results
  var jyd = jy.redAdd(jy);
  for (i = 0; i < pow; i++) {
    var jx2 = jx.redSqr();
    var jyd2 = jyd.redSqr();
    var jyd4 = jyd2.redSqr();
    var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));

    var t1 = jx.redMul(jyd2);
    var nx = c.redSqr().redISub(t1.redAdd(t1));
    var t2 = t1.redISub(nx);
    var dny = c.redMul(t2);
    dny = dny.redIAdd(dny).redISub(jyd4);
    var nz = jyd.redMul(jz);
    if (i + 1 < pow)
      jz4 = jz4.redMul(jyd4);

    jx = nx;
    jz = nz;
    jyd = dny;
  }

  return this.curve.jpoint(jx, jyd.redMul(tinv), jz);
};

JPoint.prototype.dbl = function dbl() {
  if (this.isInfinity())
    return this;

  if (this.curve.zeroA)
    return this._zeroDbl();
  else if (this.curve.threeA)
    return this._threeDbl();
  else
    return this._dbl();
};

JPoint.prototype._zeroDbl = function _zeroDbl() {
  var nx;
  var ny;
  var nz;
  // Z = 1
  if (this.zOne) {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html
    //     #doubling-mdbl-2007-bl
    // 1M + 5S + 14A

    // XX = X1^2
    var xx = this.x.redSqr();
    // YY = Y1^2
    var yy = this.y.redSqr();
    // YYYY = YY^2
    var yyyy = yy.redSqr();
    // S = 2 * ((X1 + YY)^2 - XX - YYYY)
    var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
    s = s.redIAdd(s);
    // M = 3 * XX + a; a = 0
    var m = xx.redAdd(xx).redIAdd(xx);
    // T = M ^ 2 - 2*S
    var t = m.redSqr().redISub(s).redISub(s);

    // 8 * YYYY
    var yyyy8 = yyyy.redIAdd(yyyy);
    yyyy8 = yyyy8.redIAdd(yyyy8);
    yyyy8 = yyyy8.redIAdd(yyyy8);

    // X3 = T
    nx = t;
    // Y3 = M * (S - T) - 8 * YYYY
    ny = m.redMul(s.redISub(t)).redISub(yyyy8);
    // Z3 = 2*Y1
    nz = this.y.redAdd(this.y);
  } else {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html
    //     #doubling-dbl-2009-l
    // 2M + 5S + 13A

    // A = X1^2
    var a = this.x.redSqr();
    // B = Y1^2
    var b = this.y.redSqr();
    // C = B^2
    var c = b.redSqr();
    // D = 2 * ((X1 + B)^2 - A - C)
    var d = this.x.redAdd(b).redSqr().redISub(a).redISub(c);
    d = d.redIAdd(d);
    // E = 3 * A
    var e = a.redAdd(a).redIAdd(a);
    // F = E^2
    var f = e.redSqr();

    // 8 * C
    var c8 = c.redIAdd(c);
    c8 = c8.redIAdd(c8);
    c8 = c8.redIAdd(c8);

    // X3 = F - 2 * D
    nx = f.redISub(d).redISub(d);
    // Y3 = E * (D - X3) - 8 * C
    ny = e.redMul(d.redISub(nx)).redISub(c8);
    // Z3 = 2 * Y1 * Z1
    nz = this.y.redMul(this.z);
    nz = nz.redIAdd(nz);
  }

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype._threeDbl = function _threeDbl() {
  var nx;
  var ny;
  var nz;
  // Z = 1
  if (this.zOne) {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html
    //     #doubling-mdbl-2007-bl
    // 1M + 5S + 15A

    // XX = X1^2
    var xx = this.x.redSqr();
    // YY = Y1^2
    var yy = this.y.redSqr();
    // YYYY = YY^2
    var yyyy = yy.redSqr();
    // S = 2 * ((X1 + YY)^2 - XX - YYYY)
    var s = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
    s = s.redIAdd(s);
    // M = 3 * XX + a
    var m = xx.redAdd(xx).redIAdd(xx).redIAdd(this.curve.a);
    // T = M^2 - 2 * S
    var t = m.redSqr().redISub(s).redISub(s);
    // X3 = T
    nx = t;
    // Y3 = M * (S - T) - 8 * YYYY
    var yyyy8 = yyyy.redIAdd(yyyy);
    yyyy8 = yyyy8.redIAdd(yyyy8);
    yyyy8 = yyyy8.redIAdd(yyyy8);
    ny = m.redMul(s.redISub(t)).redISub(yyyy8);
    // Z3 = 2 * Y1
    nz = this.y.redAdd(this.y);
  } else {
    // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-3.html#doubling-dbl-2001-b
    // 3M + 5S

    // delta = Z1^2
    var delta = this.z.redSqr();
    // gamma = Y1^2
    var gamma = this.y.redSqr();
    // beta = X1 * gamma
    var beta = this.x.redMul(gamma);
    // alpha = 3 * (X1 - delta) * (X1 + delta)
    var alpha = this.x.redSub(delta).redMul(this.x.redAdd(delta));
    alpha = alpha.redAdd(alpha).redIAdd(alpha);
    // X3 = alpha^2 - 8 * beta
    var beta4 = beta.redIAdd(beta);
    beta4 = beta4.redIAdd(beta4);
    var beta8 = beta4.redAdd(beta4);
    nx = alpha.redSqr().redISub(beta8);
    // Z3 = (Y1 + Z1)^2 - gamma - delta
    nz = this.y.redAdd(this.z).redSqr().redISub(gamma).redISub(delta);
    // Y3 = alpha * (4 * beta - X3) - 8 * gamma^2
    var ggamma8 = gamma.redSqr();
    ggamma8 = ggamma8.redIAdd(ggamma8);
    ggamma8 = ggamma8.redIAdd(ggamma8);
    ggamma8 = ggamma8.redIAdd(ggamma8);
    ny = alpha.redMul(beta4.redISub(nx)).redISub(ggamma8);
  }

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype._dbl = function _dbl() {
  var a = this.curve.a;

  // 4M + 6S + 10A
  var jx = this.x;
  var jy = this.y;
  var jz = this.z;
  var jz4 = jz.redSqr().redSqr();

  var jx2 = jx.redSqr();
  var jy2 = jy.redSqr();

  var c = jx2.redAdd(jx2).redIAdd(jx2).redIAdd(a.redMul(jz4));

  var jxd4 = jx.redAdd(jx);
  jxd4 = jxd4.redIAdd(jxd4);
  var t1 = jxd4.redMul(jy2);
  var nx = c.redSqr().redISub(t1.redAdd(t1));
  var t2 = t1.redISub(nx);

  var jyd8 = jy2.redSqr();
  jyd8 = jyd8.redIAdd(jyd8);
  jyd8 = jyd8.redIAdd(jyd8);
  jyd8 = jyd8.redIAdd(jyd8);
  var ny = c.redMul(t2).redISub(jyd8);
  var nz = jy.redAdd(jy).redMul(jz);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.trpl = function trpl() {
  if (!this.curve.zeroA)
    return this.dbl().add(this);

  // hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html#tripling-tpl-2007-bl
  // 5M + 10S + ...

  // XX = X1^2
  var xx = this.x.redSqr();
  // YY = Y1^2
  var yy = this.y.redSqr();
  // ZZ = Z1^2
  var zz = this.z.redSqr();
  // YYYY = YY^2
  var yyyy = yy.redSqr();
  // M = 3 * XX + a * ZZ2; a = 0
  var m = xx.redAdd(xx).redIAdd(xx);
  // MM = M^2
  var mm = m.redSqr();
  // E = 6 * ((X1 + YY)^2 - XX - YYYY) - MM
  var e = this.x.redAdd(yy).redSqr().redISub(xx).redISub(yyyy);
  e = e.redIAdd(e);
  e = e.redAdd(e).redIAdd(e);
  e = e.redISub(mm);
  // EE = E^2
  var ee = e.redSqr();
  // T = 16*YYYY
  var t = yyyy.redIAdd(yyyy);
  t = t.redIAdd(t);
  t = t.redIAdd(t);
  t = t.redIAdd(t);
  // U = (M + E)^2 - MM - EE - T
  var u = m.redIAdd(e).redSqr().redISub(mm).redISub(ee).redISub(t);
  // X3 = 4 * (X1 * EE - 4 * YY * U)
  var yyu4 = yy.redMul(u);
  yyu4 = yyu4.redIAdd(yyu4);
  yyu4 = yyu4.redIAdd(yyu4);
  var nx = this.x.redMul(ee).redISub(yyu4);
  nx = nx.redIAdd(nx);
  nx = nx.redIAdd(nx);
  // Y3 = 8 * Y1 * (U * (T - U) - E * EE)
  var ny = this.y.redMul(u.redMul(t.redISub(u)).redISub(e.redMul(ee)));
  ny = ny.redIAdd(ny);
  ny = ny.redIAdd(ny);
  ny = ny.redIAdd(ny);
  // Z3 = (Z1 + E)^2 - ZZ - EE
  var nz = this.z.redAdd(e).redSqr().redISub(zz).redISub(ee);

  return this.curve.jpoint(nx, ny, nz);
};

JPoint.prototype.mul = function mul(k, kbase) {
  k = new BN(k, kbase);

  return this.curve._wnafMul(this, k);
};

JPoint.prototype.eq = function eq(p) {
  if (p.type === 'affine')
    return this.eq(p.toJ());

  if (this === p)
    return true;

  // x1 * z2^2 == x2 * z1^2
  var z2 = this.z.redSqr();
  var pz2 = p.z.redSqr();
  if (this.x.redMul(pz2).redISub(p.x.redMul(z2)).cmpn(0) !== 0)
    return false;

  // y1 * z2^3 == y2 * z1^3
  var z3 = z2.redMul(this.z);
  var pz3 = pz2.redMul(p.z);
  return this.y.redMul(pz3).redISub(p.y.redMul(z3)).cmpn(0) === 0;
};

JPoint.prototype.eqXToP = function eqXToP(x) {
  var zs = this.z.redSqr();
  var rx = x.toRed(this.curve.red).redMul(zs);
  if (this.x.cmp(rx) === 0)
    return true;

  var xc = x.clone();
  var t = this.curve.redN.redMul(zs);
  for (;;) {
    xc.iadd(this.curve.n);
    if (xc.cmp(this.curve.p) >= 0)
      return false;

    rx.redIAdd(t);
    if (this.x.cmp(rx) === 0)
      return true;
  }
};

JPoint.prototype.inspect = function inspect() {
  if (this.isInfinity())
    return '<EC JPoint Infinity>';
  return '<EC JPoint x: ' + this.x.toString(16, 2) +
      ' y: ' + this.y.toString(16, 2) +
      ' z: ' + this.z.toString(16, 2) + '>';
};

JPoint.prototype.isInfinity = function isInfinity() {
  // XXX This code assumes that zero is always zero in red
  return this.z.cmpn(0) === 0;
};

},{"../utils":21,"./base":8,"bn.js":5,"inherits":36}],13:[function(require,module,exports){
'use strict';

var curves = exports;

var hash = require('hash.js');
var curve = require('./curve');
var utils = require('./utils');

var assert = utils.assert;

function PresetCurve(options) {
  if (options.type === 'short')
    this.curve = new curve.short(options);
  else if (options.type === 'edwards')
    this.curve = new curve.edwards(options);
  else
    this.curve = new curve.mont(options);
  this.g = this.curve.g;
  this.n = this.curve.n;
  this.hash = options.hash;

  assert(this.g.validate(), 'Invalid curve');
  assert(this.g.mul(this.n).isInfinity(), 'Invalid curve, G*N != O');
}
curves.PresetCurve = PresetCurve;

function defineCurve(name, options) {
  Object.defineProperty(curves, name, {
    configurable: true,
    enumerable: true,
    get: function() {
      var curve = new PresetCurve(options);
      Object.defineProperty(curves, name, {
        configurable: true,
        enumerable: true,
        value: curve,
      });
      return curve;
    },
  });
}

defineCurve('p192', {
  type: 'short',
  prime: 'p192',
  p: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff',
  a: 'ffffffff ffffffff ffffffff fffffffe ffffffff fffffffc',
  b: '64210519 e59c80e7 0fa7e9ab 72243049 feb8deec c146b9b1',
  n: 'ffffffff ffffffff ffffffff 99def836 146bc9b1 b4d22831',
  hash: hash.sha256,
  gRed: false,
  g: [
    '188da80e b03090f6 7cbf20eb 43a18800 f4ff0afd 82ff1012',
    '07192b95 ffc8da78 631011ed 6b24cdd5 73f977a1 1e794811',
  ],
});

defineCurve('p224', {
  type: 'short',
  prime: 'p224',
  p: 'ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001',
  a: 'ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff fffffffe',
  b: 'b4050a85 0c04b3ab f5413256 5044b0b7 d7bfd8ba 270b3943 2355ffb4',
  n: 'ffffffff ffffffff ffffffff ffff16a2 e0b8f03e 13dd2945 5c5c2a3d',
  hash: hash.sha256,
  gRed: false,
  g: [
    'b70e0cbd 6bb4bf7f 321390b9 4a03c1d3 56c21122 343280d6 115c1d21',
    'bd376388 b5f723fb 4c22dfe6 cd4375a0 5a074764 44d58199 85007e34',
  ],
});

defineCurve('p256', {
  type: 'short',
  prime: null,
  p: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff ffffffff',
  a: 'ffffffff 00000001 00000000 00000000 00000000 ffffffff ffffffff fffffffc',
  b: '5ac635d8 aa3a93e7 b3ebbd55 769886bc 651d06b0 cc53b0f6 3bce3c3e 27d2604b',
  n: 'ffffffff 00000000 ffffffff ffffffff bce6faad a7179e84 f3b9cac2 fc632551',
  hash: hash.sha256,
  gRed: false,
  g: [
    '6b17d1f2 e12c4247 f8bce6e5 63a440f2 77037d81 2deb33a0 f4a13945 d898c296',
    '4fe342e2 fe1a7f9b 8ee7eb4a 7c0f9e16 2bce3357 6b315ece cbb64068 37bf51f5',
  ],
});

defineCurve('p384', {
  type: 'short',
  prime: null,
  p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'fffffffe ffffffff 00000000 00000000 ffffffff',
  a: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'fffffffe ffffffff 00000000 00000000 fffffffc',
  b: 'b3312fa7 e23ee7e4 988e056b e3f82d19 181d9c6e fe814112 0314088f ' +
     '5013875a c656398d 8a2ed19d 2a85c8ed d3ec2aef',
  n: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff c7634d81 ' +
     'f4372ddf 581a0db2 48b0a77a ecec196a ccc52973',
  hash: hash.sha384,
  gRed: false,
  g: [
    'aa87ca22 be8b0537 8eb1c71e f320ad74 6e1d3b62 8ba79b98 59f741e0 82542a38 ' +
    '5502f25d bf55296c 3a545e38 72760ab7',
    '3617de4a 96262c6f 5d9e98bf 9292dc29 f8f41dbd 289a147c e9da3113 b5f0b8c0 ' +
    '0a60b1ce 1d7e819d 7a431d7c 90ea0e5f',
  ],
});

defineCurve('p521', {
  type: 'short',
  prime: null,
  p: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff ffffffff ffffffff ffffffff',
  a: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff ffffffff ffffffff fffffffc',
  b: '00000051 953eb961 8e1c9a1f 929a21a0 b68540ee a2da725b ' +
     '99b315f3 b8b48991 8ef109e1 56193951 ec7e937b 1652c0bd ' +
     '3bb1bf07 3573df88 3d2c34f1 ef451fd4 6b503f00',
  n: '000001ff ffffffff ffffffff ffffffff ffffffff ffffffff ' +
     'ffffffff ffffffff fffffffa 51868783 bf2f966b 7fcc0148 ' +
     'f709a5d0 3bb5c9b8 899c47ae bb6fb71e 91386409',
  hash: hash.sha512,
  gRed: false,
  g: [
    '000000c6 858e06b7 0404e9cd 9e3ecb66 2395b442 9c648139 ' +
    '053fb521 f828af60 6b4d3dba a14b5e77 efe75928 fe1dc127 ' +
    'a2ffa8de 3348b3c1 856a429b f97e7e31 c2e5bd66',
    '00000118 39296a78 9a3bc004 5c8a5fb4 2c7d1bd9 98f54449 ' +
    '579b4468 17afbd17 273e662c 97ee7299 5ef42640 c550b901 ' +
    '3fad0761 353c7086 a272c240 88be9476 9fd16650',
  ],
});

defineCurve('curve25519', {
  type: 'mont',
  prime: 'p25519',
  p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
  a: '76d06',
  b: '1',
  n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
  hash: hash.sha256,
  gRed: false,
  g: [
    '9',
  ],
});

defineCurve('ed25519', {
  type: 'edwards',
  prime: 'p25519',
  p: '7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed',
  a: '-1',
  c: '1',
  // -121665 * (121666^(-1)) (mod P)
  d: '52036cee2b6ffe73 8cc740797779e898 00700a4d4141d8ab 75eb4dca135978a3',
  n: '1000000000000000 0000000000000000 14def9dea2f79cd6 5812631a5cf5d3ed',
  hash: hash.sha256,
  gRed: false,
  g: [
    '216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a',

    // 4/5
    '6666666666666666666666666666666666666666666666666666666666666658',
  ],
});

var pre;
try {
  pre = require('./precomputed/secp256k1');
} catch (e) {
  pre = undefined;
}

defineCurve('secp256k1', {
  type: 'short',
  prime: 'k256',
  p: 'ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f',
  a: '0',
  b: '7',
  n: 'ffffffff ffffffff ffffffff fffffffe baaedce6 af48a03b bfd25e8c d0364141',
  h: '1',
  hash: hash.sha256,

  // Precomputed endomorphism
  beta: '7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee',
  lambda: '5363ad4cc05c30e0a5261c028812645a122e22ea20816678df02967c1b23bd72',
  basis: [
    {
      a: '3086d221a7d46bcde86c90e49284eb15',
      b: '-e4437ed6010e88286f547fa90abfe4c3',
    },
    {
      a: '114ca50f7a8e2f3f657c1108d9d44cfd8',
      b: '3086d221a7d46bcde86c90e49284eb15',
    },
  ],

  gRed: false,
  g: [
    '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
    pre,
  ],
});

},{"./curve":10,"./precomputed/secp256k1":20,"./utils":21,"hash.js":23}],14:[function(require,module,exports){
'use strict';

var BN = require('bn.js');
var HmacDRBG = require('hmac-drbg');
var utils = require('../utils');
var curves = require('../curves');
var rand = require('brorand');
var assert = utils.assert;

var KeyPair = require('./key');
var Signature = require('./signature');

function EC(options) {
  if (!(this instanceof EC))
    return new EC(options);

  // Shortcut `elliptic.ec(curve-name)`
  if (typeof options === 'string') {
    assert(Object.prototype.hasOwnProperty.call(curves, options),
      'Unknown curve ' + options);

    options = curves[options];
  }

  // Shortcut for `elliptic.ec(elliptic.curves.curveName)`
  if (options instanceof curves.PresetCurve)
    options = { curve: options };

  this.curve = options.curve.curve;
  this.n = this.curve.n;
  this.nh = this.n.ushrn(1);
  this.g = this.curve.g;

  // Point on curve
  this.g = options.curve.g;
  this.g.precompute(options.curve.n.bitLength() + 1);

  // Hash for function for DRBG
  this.hash = options.hash || options.curve.hash;
}
module.exports = EC;

EC.prototype.keyPair = function keyPair(options) {
  return new KeyPair(this, options);
};

EC.prototype.keyFromPrivate = function keyFromPrivate(priv, enc) {
  return KeyPair.fromPrivate(this, priv, enc);
};

EC.prototype.keyFromPublic = function keyFromPublic(pub, enc) {
  return KeyPair.fromPublic(this, pub, enc);
};

EC.prototype.genKeyPair = function genKeyPair(options) {
  if (!options)
    options = {};

  // Instantiate Hmac_DRBG
  var drbg = new HmacDRBG({
    hash: this.hash,
    pers: options.pers,
    persEnc: options.persEnc || 'utf8',
    entropy: options.entropy || rand(this.hash.hmacStrength),
    entropyEnc: options.entropy && options.entropyEnc || 'utf8',
    nonce: this.n.toArray(),
  });

  var bytes = this.n.byteLength();
  var ns2 = this.n.sub(new BN(2));
  for (;;) {
    var priv = new BN(drbg.generate(bytes));
    if (priv.cmp(ns2) > 0)
      continue;

    priv.iaddn(1);
    return this.keyFromPrivate(priv);
  }
};

EC.prototype._truncateToN = function _truncateToN(msg, truncOnly) {
  var delta = msg.byteLength() * 8 - this.n.bitLength();
  if (delta > 0)
    msg = msg.ushrn(delta);
  if (!truncOnly && msg.cmp(this.n) >= 0)
    return msg.sub(this.n);
  else
    return msg;
};

EC.prototype.sign = function sign(msg, key, enc, options) {
  if (typeof enc === 'object') {
    options = enc;
    enc = null;
  }
  if (!options)
    options = {};

  key = this.keyFromPrivate(key, enc);
  msg = this._truncateToN(new BN(msg, 16));

  // Zero-extend key to provide enough entropy
  var bytes = this.n.byteLength();
  var bkey = key.getPrivate().toArray('be', bytes);

  // Zero-extend nonce to have the same byte size as N
  var nonce = msg.toArray('be', bytes);

  // Instantiate Hmac_DRBG
  var drbg = new HmacDRBG({
    hash: this.hash,
    entropy: bkey,
    nonce: nonce,
    pers: options.pers,
    persEnc: options.persEnc || 'utf8',
  });

  // Number of bytes to generate
  var ns1 = this.n.sub(new BN(1));

  for (var iter = 0; ; iter++) {
    var k = options.k ?
      options.k(iter) :
      new BN(drbg.generate(this.n.byteLength()));
    k = this._truncateToN(k, true);
    if (k.cmpn(1) <= 0 || k.cmp(ns1) >= 0)
      continue;

    var kp = this.g.mul(k);
    if (kp.isInfinity())
      continue;

    var kpX = kp.getX();
    var r = kpX.umod(this.n);
    if (r.cmpn(0) === 0)
      continue;

    var s = k.invm(this.n).mul(r.mul(key.getPrivate()).iadd(msg));
    s = s.umod(this.n);
    if (s.cmpn(0) === 0)
      continue;

    var recoveryParam = (kp.getY().isOdd() ? 1 : 0) |
                        (kpX.cmp(r) !== 0 ? 2 : 0);

    // Use complement of `s`, if it is > `n / 2`
    if (options.canonical && s.cmp(this.nh) > 0) {
      s = this.n.sub(s);
      recoveryParam ^= 1;
    }

    return new Signature({ r: r, s: s, recoveryParam: recoveryParam });
  }
};

EC.prototype.verify = function verify(msg, signature, key, enc) {
  msg = this._truncateToN(new BN(msg, 16));
  key = this.keyFromPublic(key, enc);
  signature = new Signature(signature, 'hex');

  // Perform primitive values validation
  var r = signature.r;
  var s = signature.s;
  if (r.cmpn(1) < 0 || r.cmp(this.n) >= 0)
    return false;
  if (s.cmpn(1) < 0 || s.cmp(this.n) >= 0)
    return false;

  // Validate signature
  var sinv = s.invm(this.n);
  var u1 = sinv.mul(msg).umod(this.n);
  var u2 = sinv.mul(r).umod(this.n);
  var p;

  if (!this.curve._maxwellTrick) {
    p = this.g.mulAdd(u1, key.getPublic(), u2);
    if (p.isInfinity())
      return false;

    return p.getX().umod(this.n).cmp(r) === 0;
  }

  // NOTE: Greg Maxwell's trick, inspired by:
  // https://git.io/vad3K

  p = this.g.jmulAdd(u1, key.getPublic(), u2);
  if (p.isInfinity())
    return false;

  // Compare `p.x` of Jacobian point with `r`,
  // this will do `p.x == r * p.z^2` instead of multiplying `p.x` by the
  // inverse of `p.z^2`
  return p.eqXToP(r);
};

EC.prototype.recoverPubKey = function(msg, signature, j, enc) {
  assert((3 & j) === j, 'The recovery param is more than two bits');
  signature = new Signature(signature, enc);

  var n = this.n;
  var e = new BN(msg);
  var r = signature.r;
  var s = signature.s;

  // A set LSB signifies that the y-coordinate is odd
  var isYOdd = j & 1;
  var isSecondKey = j >> 1;
  if (r.cmp(this.curve.p.umod(this.curve.n)) >= 0 && isSecondKey)
    throw new Error('Unable to find sencond key candinate');

  // 1.1. Let x = r + jn.
  if (isSecondKey)
    r = this.curve.pointFromX(r.add(this.curve.n), isYOdd);
  else
    r = this.curve.pointFromX(r, isYOdd);

  var rInv = signature.r.invm(n);
  var s1 = n.sub(e).mul(rInv).umod(n);
  var s2 = s.mul(rInv).umod(n);

  // 1.6.1 Compute Q = r^-1 (sR -  eG)
  //               Q = r^-1 (sR + -eG)
  return this.g.mulAdd(s1, r, s2);
};

EC.prototype.getKeyRecoveryParam = function(e, signature, Q, enc) {
  signature = new Signature(signature, enc);
  if (signature.recoveryParam !== null)
    return signature.recoveryParam;

  for (var i = 0; i < 4; i++) {
    var Qprime;
    try {
      Qprime = this.recoverPubKey(e, signature, i);
    } catch (e) {
      continue;
    }

    if (Qprime.eq(Q))
      return i;
  }
  throw new Error('Unable to find valid recovery factor');
};

},{"../curves":13,"../utils":21,"./key":15,"./signature":16,"bn.js":5,"brorand":6,"hmac-drbg":35}],15:[function(require,module,exports){
'use strict';

var BN = require('bn.js');
var utils = require('../utils');
var assert = utils.assert;

function KeyPair(ec, options) {
  this.ec = ec;
  this.priv = null;
  this.pub = null;

  // KeyPair(ec, { priv: ..., pub: ... })
  if (options.priv)
    this._importPrivate(options.priv, options.privEnc);
  if (options.pub)
    this._importPublic(options.pub, options.pubEnc);
}
module.exports = KeyPair;

KeyPair.fromPublic = function fromPublic(ec, pub, enc) {
  if (pub instanceof KeyPair)
    return pub;

  return new KeyPair(ec, {
    pub: pub,
    pubEnc: enc,
  });
};

KeyPair.fromPrivate = function fromPrivate(ec, priv, enc) {
  if (priv instanceof KeyPair)
    return priv;

  return new KeyPair(ec, {
    priv: priv,
    privEnc: enc,
  });
};

KeyPair.prototype.validate = function validate() {
  var pub = this.getPublic();

  if (pub.isInfinity())
    return { result: false, reason: 'Invalid public key' };
  if (!pub.validate())
    return { result: false, reason: 'Public key is not a point' };
  if (!pub.mul(this.ec.curve.n).isInfinity())
    return { result: false, reason: 'Public key * N != O' };

  return { result: true, reason: null };
};

KeyPair.prototype.getPublic = function getPublic(compact, enc) {
  // compact is optional argument
  if (typeof compact === 'string') {
    enc = compact;
    compact = null;
  }

  if (!this.pub)
    this.pub = this.ec.g.mul(this.priv);

  if (!enc)
    return this.pub;

  return this.pub.encode(enc, compact);
};

KeyPair.prototype.getPrivate = function getPrivate(enc) {
  if (enc === 'hex')
    return this.priv.toString(16, 2);
  else
    return this.priv;
};

KeyPair.prototype._importPrivate = function _importPrivate(key, enc) {
  this.priv = new BN(key, enc || 16);

  // Ensure that the priv won't be bigger than n, otherwise we may fail
  // in fixed multiplication method
  this.priv = this.priv.umod(this.ec.curve.n);
};

KeyPair.prototype._importPublic = function _importPublic(key, enc) {
  if (key.x || key.y) {
    // Montgomery points only have an `x` coordinate.
    // Weierstrass/Edwards points on the other hand have both `x` and
    // `y` coordinates.
    if (this.ec.curve.type === 'mont') {
      assert(key.x, 'Need x coordinate');
    } else if (this.ec.curve.type === 'short' ||
               this.ec.curve.type === 'edwards') {
      assert(key.x && key.y, 'Need both x and y coordinate');
    }
    this.pub = this.ec.curve.point(key.x, key.y);
    return;
  }
  this.pub = this.ec.curve.decodePoint(key, enc);
};

// ECDH
KeyPair.prototype.derive = function derive(pub) {
  if(!pub.validate()) {
    assert(pub.validate(), 'public point not validated');
  }
  return pub.mul(this.priv).getX();
};

// ECDSA
KeyPair.prototype.sign = function sign(msg, enc, options) {
  return this.ec.sign(msg, this, enc, options);
};

KeyPair.prototype.verify = function verify(msg, signature) {
  return this.ec.verify(msg, signature, this);
};

KeyPair.prototype.inspect = function inspect() {
  return '<Key priv: ' + (this.priv && this.priv.toString(16, 2)) +
         ' pub: ' + (this.pub && this.pub.inspect()) + ' >';
};

},{"../utils":21,"bn.js":5}],16:[function(require,module,exports){
'use strict';

var BN = require('bn.js');

var utils = require('../utils');
var assert = utils.assert;

function Signature(options, enc) {
  if (options instanceof Signature)
    return options;

  if (this._importDER(options, enc))
    return;

  assert(options.r && options.s, 'Signature without r or s');
  this.r = new BN(options.r, 16);
  this.s = new BN(options.s, 16);
  if (options.recoveryParam === undefined)
    this.recoveryParam = null;
  else
    this.recoveryParam = options.recoveryParam;
}
module.exports = Signature;

function Position() {
  this.place = 0;
}

function getLength(buf, p) {
  var initial = buf[p.place++];
  if (!(initial & 0x80)) {
    return initial;
  }
  var octetLen = initial & 0xf;

  // Indefinite length or overflow
  if (octetLen === 0 || octetLen > 4) {
    return false;
  }

  var val = 0;
  for (var i = 0, off = p.place; i < octetLen; i++, off++) {
    val <<= 8;
    val |= buf[off];
    val >>>= 0;
  }

  // Leading zeroes
  if (val <= 0x7f) {
    return false;
  }

  p.place = off;
  return val;
}

function rmPadding(buf) {
  var i = 0;
  var len = buf.length - 1;
  while (!buf[i] && !(buf[i + 1] & 0x80) && i < len) {
    i++;
  }
  if (i === 0) {
    return buf;
  }
  return buf.slice(i);
}

Signature.prototype._importDER = function _importDER(data, enc) {
  data = utils.toArray(data, enc);
  var p = new Position();
  if (data[p.place++] !== 0x30) {
    return false;
  }
  var len = getLength(data, p);
  if (len === false) {
    return false;
  }
  if ((len + p.place) !== data.length) {
    return false;
  }
  if (data[p.place++] !== 0x02) {
    return false;
  }
  var rlen = getLength(data, p);
  if (rlen === false) {
    return false;
  }
  var r = data.slice(p.place, rlen + p.place);
  p.place += rlen;
  if (data[p.place++] !== 0x02) {
    return false;
  }
  var slen = getLength(data, p);
  if (slen === false) {
    return false;
  }
  if (data.length !== slen + p.place) {
    return false;
  }
  var s = data.slice(p.place, slen + p.place);
  if (r[0] === 0) {
    if (r[1] & 0x80) {
      r = r.slice(1);
    } else {
      // Leading zeroes
      return false;
    }
  }
  if (s[0] === 0) {
    if (s[1] & 0x80) {
      s = s.slice(1);
    } else {
      // Leading zeroes
      return false;
    }
  }

  this.r = new BN(r);
  this.s = new BN(s);
  this.recoveryParam = null;

  return true;
};

function constructLength(arr, len) {
  if (len < 0x80) {
    arr.push(len);
    return;
  }
  var octets = 1 + (Math.log(len) / Math.LN2 >>> 3);
  arr.push(octets | 0x80);
  while (--octets) {
    arr.push((len >>> (octets << 3)) & 0xff);
  }
  arr.push(len);
}

Signature.prototype.toDER = function toDER(enc) {
  var r = this.r.toArray();
  var s = this.s.toArray();

  // Pad values
  if (r[0] & 0x80)
    r = [ 0 ].concat(r);
  // Pad values
  if (s[0] & 0x80)
    s = [ 0 ].concat(s);

  r = rmPadding(r);
  s = rmPadding(s);

  while (!s[0] && !(s[1] & 0x80)) {
    s = s.slice(1);
  }
  var arr = [ 0x02 ];
  constructLength(arr, r.length);
  arr = arr.concat(r);
  arr.push(0x02);
  constructLength(arr, s.length);
  var backHalf = arr.concat(s);
  var res = [ 0x30 ];
  constructLength(res, backHalf.length);
  res = res.concat(backHalf);
  return utils.encode(res, enc);
};

},{"../utils":21,"bn.js":5}],17:[function(require,module,exports){
'use strict';

var hash = require('hash.js');
var curves = require('../curves');
var utils = require('../utils');
var assert = utils.assert;
var parseBytes = utils.parseBytes;
var KeyPair = require('./key');
var Signature = require('./signature');

function EDDSA(curve) {
  assert(curve === 'ed25519', 'only tested with ed25519 so far');

  if (!(this instanceof EDDSA))
    return new EDDSA(curve);

  curve = curves[curve].curve;
  this.curve = curve;
  this.g = curve.g;
  this.g.precompute(curve.n.bitLength() + 1);

  this.pointClass = curve.point().constructor;
  this.encodingLength = Math.ceil(curve.n.bitLength() / 8);
  this.hash = hash.sha512;
}

module.exports = EDDSA;

/**
* @param {Array|String} message - message bytes
* @param {Array|String|KeyPair} secret - secret bytes or a keypair
* @returns {Signature} - signature
*/
EDDSA.prototype.sign = function sign(message, secret) {
  message = parseBytes(message);
  var key = this.keyFromSecret(secret);
  var r = this.hashInt(key.messagePrefix(), message);
  var R = this.g.mul(r);
  var Rencoded = this.encodePoint(R);
  var s_ = this.hashInt(Rencoded, key.pubBytes(), message)
    .mul(key.priv());
  var S = r.add(s_).umod(this.curve.n);
  return this.makeSignature({ R: R, S: S, Rencoded: Rencoded });
};

/**
* @param {Array} message - message bytes
* @param {Array|String|Signature} sig - sig bytes
* @param {Array|String|Point|KeyPair} pub - public key
* @returns {Boolean} - true if public key matches sig of message
*/
EDDSA.prototype.verify = function verify(message, sig, pub) {
  message = parseBytes(message);
  sig = this.makeSignature(sig);
  var key = this.keyFromPublic(pub);
  var h = this.hashInt(sig.Rencoded(), key.pubBytes(), message);
  var SG = this.g.mul(sig.S());
  var RplusAh = sig.R().add(key.pub().mul(h));
  return RplusAh.eq(SG);
};

EDDSA.prototype.hashInt = function hashInt() {
  var hash = this.hash();
  for (var i = 0; i < arguments.length; i++)
    hash.update(arguments[i]);
  return utils.intFromLE(hash.digest()).umod(this.curve.n);
};

EDDSA.prototype.keyFromPublic = function keyFromPublic(pub) {
  return KeyPair.fromPublic(this, pub);
};

EDDSA.prototype.keyFromSecret = function keyFromSecret(secret) {
  return KeyPair.fromSecret(this, secret);
};

EDDSA.prototype.makeSignature = function makeSignature(sig) {
  if (sig instanceof Signature)
    return sig;
  return new Signature(this, sig);
};

/**
* * https://tools.ietf.org/html/draft-josefsson-eddsa-ed25519-03#section-5.2
*
* EDDSA defines methods for encoding and decoding points and integers. These are
* helper convenience methods, that pass along to utility functions implied
* parameters.
*
*/
EDDSA.prototype.encodePoint = function encodePoint(point) {
  var enc = point.getY().toArray('le', this.encodingLength);
  enc[this.encodingLength - 1] |= point.getX().isOdd() ? 0x80 : 0;
  return enc;
};

EDDSA.prototype.decodePoint = function decodePoint(bytes) {
  bytes = utils.parseBytes(bytes);

  var lastIx = bytes.length - 1;
  var normed = bytes.slice(0, lastIx).concat(bytes[lastIx] & ~0x80);
  var xIsOdd = (bytes[lastIx] & 0x80) !== 0;

  var y = utils.intFromLE(normed);
  return this.curve.pointFromY(y, xIsOdd);
};

EDDSA.prototype.encodeInt = function encodeInt(num) {
  return num.toArray('le', this.encodingLength);
};

EDDSA.prototype.decodeInt = function decodeInt(bytes) {
  return utils.intFromLE(bytes);
};

EDDSA.prototype.isPoint = function isPoint(val) {
  return val instanceof this.pointClass;
};

},{"../curves":13,"../utils":21,"./key":18,"./signature":19,"hash.js":23}],18:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var assert = utils.assert;
var parseBytes = utils.parseBytes;
var cachedProperty = utils.cachedProperty;

/**
* @param {EDDSA} eddsa - instance
* @param {Object} params - public/private key parameters
*
* @param {Array<Byte>} [params.secret] - secret seed bytes
* @param {Point} [params.pub] - public key point (aka `A` in eddsa terms)
* @param {Array<Byte>} [params.pub] - public key point encoded as bytes
*
*/
function KeyPair(eddsa, params) {
  this.eddsa = eddsa;
  this._secret = parseBytes(params.secret);
  if (eddsa.isPoint(params.pub))
    this._pub = params.pub;
  else
    this._pubBytes = parseBytes(params.pub);
}

KeyPair.fromPublic = function fromPublic(eddsa, pub) {
  if (pub instanceof KeyPair)
    return pub;
  return new KeyPair(eddsa, { pub: pub });
};

KeyPair.fromSecret = function fromSecret(eddsa, secret) {
  if (secret instanceof KeyPair)
    return secret;
  return new KeyPair(eddsa, { secret: secret });
};

KeyPair.prototype.secret = function secret() {
  return this._secret;
};

cachedProperty(KeyPair, 'pubBytes', function pubBytes() {
  return this.eddsa.encodePoint(this.pub());
});

cachedProperty(KeyPair, 'pub', function pub() {
  if (this._pubBytes)
    return this.eddsa.decodePoint(this._pubBytes);
  return this.eddsa.g.mul(this.priv());
});

cachedProperty(KeyPair, 'privBytes', function privBytes() {
  var eddsa = this.eddsa;
  var hash = this.hash();
  var lastIx = eddsa.encodingLength - 1;

  var a = hash.slice(0, eddsa.encodingLength);
  a[0] &= 248;
  a[lastIx] &= 127;
  a[lastIx] |= 64;

  return a;
});

cachedProperty(KeyPair, 'priv', function priv() {
  return this.eddsa.decodeInt(this.privBytes());
});

cachedProperty(KeyPair, 'hash', function hash() {
  return this.eddsa.hash().update(this.secret()).digest();
});

cachedProperty(KeyPair, 'messagePrefix', function messagePrefix() {
  return this.hash().slice(this.eddsa.encodingLength);
});

KeyPair.prototype.sign = function sign(message) {
  assert(this._secret, 'KeyPair can only verify');
  return this.eddsa.sign(message, this);
};

KeyPair.prototype.verify = function verify(message, sig) {
  return this.eddsa.verify(message, sig, this);
};

KeyPair.prototype.getSecret = function getSecret(enc) {
  assert(this._secret, 'KeyPair is public only');
  return utils.encode(this.secret(), enc);
};

KeyPair.prototype.getPublic = function getPublic(enc) {
  return utils.encode(this.pubBytes(), enc);
};

module.exports = KeyPair;

},{"../utils":21}],19:[function(require,module,exports){
'use strict';

var BN = require('bn.js');
var utils = require('../utils');
var assert = utils.assert;
var cachedProperty = utils.cachedProperty;
var parseBytes = utils.parseBytes;

/**
* @param {EDDSA} eddsa - eddsa instance
* @param {Array<Bytes>|Object} sig -
* @param {Array<Bytes>|Point} [sig.R] - R point as Point or bytes
* @param {Array<Bytes>|bn} [sig.S] - S scalar as bn or bytes
* @param {Array<Bytes>} [sig.Rencoded] - R point encoded
* @param {Array<Bytes>} [sig.Sencoded] - S scalar encoded
*/
function Signature(eddsa, sig) {
  this.eddsa = eddsa;

  if (typeof sig !== 'object')
    sig = parseBytes(sig);

  if (Array.isArray(sig)) {
    sig = {
      R: sig.slice(0, eddsa.encodingLength),
      S: sig.slice(eddsa.encodingLength),
    };
  }

  assert(sig.R && sig.S, 'Signature without R or S');

  if (eddsa.isPoint(sig.R))
    this._R = sig.R;
  if (sig.S instanceof BN)
    this._S = sig.S;

  this._Rencoded = Array.isArray(sig.R) ? sig.R : sig.Rencoded;
  this._Sencoded = Array.isArray(sig.S) ? sig.S : sig.Sencoded;
}

cachedProperty(Signature, 'S', function S() {
  return this.eddsa.decodeInt(this.Sencoded());
});

cachedProperty(Signature, 'R', function R() {
  return this.eddsa.decodePoint(this.Rencoded());
});

cachedProperty(Signature, 'Rencoded', function Rencoded() {
  return this.eddsa.encodePoint(this.R());
});

cachedProperty(Signature, 'Sencoded', function Sencoded() {
  return this.eddsa.encodeInt(this.S());
});

Signature.prototype.toBytes = function toBytes() {
  return this.Rencoded().concat(this.Sencoded());
};

Signature.prototype.toHex = function toHex() {
  return utils.encode(this.toBytes(), 'hex').toUpperCase();
};

module.exports = Signature;

},{"../utils":21,"bn.js":5}],20:[function(require,module,exports){
module.exports = {
  doubles: {
    step: 4,
    points: [
      [
        'e60fce93b59e9ec53011aabc21c23e97b2a31369b87a5ae9c44ee89e2a6dec0a',
        'f7e3507399e595929db99f34f57937101296891e44d23f0be1f32cce69616821',
      ],
      [
        '8282263212c609d9ea2a6e3e172de238d8c39cabd5ac1ca10646e23fd5f51508',
        '11f8a8098557dfe45e8256e830b60ace62d613ac2f7b17bed31b6eaff6e26caf',
      ],
      [
        '175e159f728b865a72f99cc6c6fc846de0b93833fd2222ed73fce5b551e5b739',
        'd3506e0d9e3c79eba4ef97a51ff71f5eacb5955add24345c6efa6ffee9fed695',
      ],
      [
        '363d90d447b00c9c99ceac05b6262ee053441c7e55552ffe526bad8f83ff4640',
        '4e273adfc732221953b445397f3363145b9a89008199ecb62003c7f3bee9de9',
      ],
      [
        '8b4b5f165df3c2be8c6244b5b745638843e4a781a15bcd1b69f79a55dffdf80c',
        '4aad0a6f68d308b4b3fbd7813ab0da04f9e336546162ee56b3eff0c65fd4fd36',
      ],
      [
        '723cbaa6e5db996d6bf771c00bd548c7b700dbffa6c0e77bcb6115925232fcda',
        '96e867b5595cc498a921137488824d6e2660a0653779494801dc069d9eb39f5f',
      ],
      [
        'eebfa4d493bebf98ba5feec812c2d3b50947961237a919839a533eca0e7dd7fa',
        '5d9a8ca3970ef0f269ee7edaf178089d9ae4cdc3a711f712ddfd4fdae1de8999',
      ],
      [
        '100f44da696e71672791d0a09b7bde459f1215a29b3c03bfefd7835b39a48db0',
        'cdd9e13192a00b772ec8f3300c090666b7ff4a18ff5195ac0fbd5cd62bc65a09',
      ],
      [
        'e1031be262c7ed1b1dc9227a4a04c017a77f8d4464f3b3852c8acde6e534fd2d',
        '9d7061928940405e6bb6a4176597535af292dd419e1ced79a44f18f29456a00d',
      ],
      [
        'feea6cae46d55b530ac2839f143bd7ec5cf8b266a41d6af52d5e688d9094696d',
        'e57c6b6c97dce1bab06e4e12bf3ecd5c981c8957cc41442d3155debf18090088',
      ],
      [
        'da67a91d91049cdcb367be4be6ffca3cfeed657d808583de33fa978bc1ec6cb1',
        '9bacaa35481642bc41f463f7ec9780e5dec7adc508f740a17e9ea8e27a68be1d',
      ],
      [
        '53904faa0b334cdda6e000935ef22151ec08d0f7bb11069f57545ccc1a37b7c0',
        '5bc087d0bc80106d88c9eccac20d3c1c13999981e14434699dcb096b022771c8',
      ],
      [
        '8e7bcd0bd35983a7719cca7764ca906779b53a043a9b8bcaeff959f43ad86047',
        '10b7770b2a3da4b3940310420ca9514579e88e2e47fd68b3ea10047e8460372a',
      ],
      [
        '385eed34c1cdff21e6d0818689b81bde71a7f4f18397e6690a841e1599c43862',
        '283bebc3e8ea23f56701de19e9ebf4576b304eec2086dc8cc0458fe5542e5453',
      ],
      [
        '6f9d9b803ecf191637c73a4413dfa180fddf84a5947fbc9c606ed86c3fac3a7',
        '7c80c68e603059ba69b8e2a30e45c4d47ea4dd2f5c281002d86890603a842160',
      ],
      [
        '3322d401243c4e2582a2147c104d6ecbf774d163db0f5e5313b7e0e742d0e6bd',
        '56e70797e9664ef5bfb019bc4ddaf9b72805f63ea2873af624f3a2e96c28b2a0',
      ],
      [
        '85672c7d2de0b7da2bd1770d89665868741b3f9af7643397721d74d28134ab83',
        '7c481b9b5b43b2eb6374049bfa62c2e5e77f17fcc5298f44c8e3094f790313a6',
      ],
      [
        '948bf809b1988a46b06c9f1919413b10f9226c60f668832ffd959af60c82a0a',
        '53a562856dcb6646dc6b74c5d1c3418c6d4dff08c97cd2bed4cb7f88d8c8e589',
      ],
      [
        '6260ce7f461801c34f067ce0f02873a8f1b0e44dfc69752accecd819f38fd8e8',
        'bc2da82b6fa5b571a7f09049776a1ef7ecd292238051c198c1a84e95b2b4ae17',
      ],
      [
        'e5037de0afc1d8d43d8348414bbf4103043ec8f575bfdc432953cc8d2037fa2d',
        '4571534baa94d3b5f9f98d09fb990bddbd5f5b03ec481f10e0e5dc841d755bda',
      ],
      [
        'e06372b0f4a207adf5ea905e8f1771b4e7e8dbd1c6a6c5b725866a0ae4fce725',
        '7a908974bce18cfe12a27bb2ad5a488cd7484a7787104870b27034f94eee31dd',
      ],
      [
        '213c7a715cd5d45358d0bbf9dc0ce02204b10bdde2a3f58540ad6908d0559754',
        '4b6dad0b5ae462507013ad06245ba190bb4850f5f36a7eeddff2c27534b458f2',
      ],
      [
        '4e7c272a7af4b34e8dbb9352a5419a87e2838c70adc62cddf0cc3a3b08fbd53c',
        '17749c766c9d0b18e16fd09f6def681b530b9614bff7dd33e0b3941817dcaae6',
      ],
      [
        'fea74e3dbe778b1b10f238ad61686aa5c76e3db2be43057632427e2840fb27b6',
        '6e0568db9b0b13297cf674deccb6af93126b596b973f7b77701d3db7f23cb96f',
      ],
      [
        '76e64113f677cf0e10a2570d599968d31544e179b760432952c02a4417bdde39',
        'c90ddf8dee4e95cf577066d70681f0d35e2a33d2b56d2032b4b1752d1901ac01',
      ],
      [
        'c738c56b03b2abe1e8281baa743f8f9a8f7cc643df26cbee3ab150242bcbb891',
        '893fb578951ad2537f718f2eacbfbbbb82314eef7880cfe917e735d9699a84c3',
      ],
      [
        'd895626548b65b81e264c7637c972877d1d72e5f3a925014372e9f6588f6c14b',
        'febfaa38f2bc7eae728ec60818c340eb03428d632bb067e179363ed75d7d991f',
      ],
      [
        'b8da94032a957518eb0f6433571e8761ceffc73693e84edd49150a564f676e03',
        '2804dfa44805a1e4d7c99cc9762808b092cc584d95ff3b511488e4e74efdf6e7',
      ],
      [
        'e80fea14441fb33a7d8adab9475d7fab2019effb5156a792f1a11778e3c0df5d',
        'eed1de7f638e00771e89768ca3ca94472d155e80af322ea9fcb4291b6ac9ec78',
      ],
      [
        'a301697bdfcd704313ba48e51d567543f2a182031efd6915ddc07bbcc4e16070',
        '7370f91cfb67e4f5081809fa25d40f9b1735dbf7c0a11a130c0d1a041e177ea1',
      ],
      [
        '90ad85b389d6b936463f9d0512678de208cc330b11307fffab7ac63e3fb04ed4',
        'e507a3620a38261affdcbd9427222b839aefabe1582894d991d4d48cb6ef150',
      ],
      [
        '8f68b9d2f63b5f339239c1ad981f162ee88c5678723ea3351b7b444c9ec4c0da',
        '662a9f2dba063986de1d90c2b6be215dbbea2cfe95510bfdf23cbf79501fff82',
      ],
      [
        'e4f3fb0176af85d65ff99ff9198c36091f48e86503681e3e6686fd5053231e11',
        '1e63633ad0ef4f1c1661a6d0ea02b7286cc7e74ec951d1c9822c38576feb73bc',
      ],
      [
        '8c00fa9b18ebf331eb961537a45a4266c7034f2f0d4e1d0716fb6eae20eae29e',
        'efa47267fea521a1a9dc343a3736c974c2fadafa81e36c54e7d2a4c66702414b',
      ],
      [
        'e7a26ce69dd4829f3e10cec0a9e98ed3143d084f308b92c0997fddfc60cb3e41',
        '2a758e300fa7984b471b006a1aafbb18d0a6b2c0420e83e20e8a9421cf2cfd51',
      ],
      [
        'b6459e0ee3662ec8d23540c223bcbdc571cbcb967d79424f3cf29eb3de6b80ef',
        '67c876d06f3e06de1dadf16e5661db3c4b3ae6d48e35b2ff30bf0b61a71ba45',
      ],
      [
        'd68a80c8280bb840793234aa118f06231d6f1fc67e73c5a5deda0f5b496943e8',
        'db8ba9fff4b586d00c4b1f9177b0e28b5b0e7b8f7845295a294c84266b133120',
      ],
      [
        '324aed7df65c804252dc0270907a30b09612aeb973449cea4095980fc28d3d5d',
        '648a365774b61f2ff130c0c35aec1f4f19213b0c7e332843967224af96ab7c84',
      ],
      [
        '4df9c14919cde61f6d51dfdbe5fee5dceec4143ba8d1ca888e8bd373fd054c96',
        '35ec51092d8728050974c23a1d85d4b5d506cdc288490192ebac06cad10d5d',
      ],
      [
        '9c3919a84a474870faed8a9c1cc66021523489054d7f0308cbfc99c8ac1f98cd',
        'ddb84f0f4a4ddd57584f044bf260e641905326f76c64c8e6be7e5e03d4fc599d',
      ],
      [
        '6057170b1dd12fdf8de05f281d8e06bb91e1493a8b91d4cc5a21382120a959e5',
        '9a1af0b26a6a4807add9a2daf71df262465152bc3ee24c65e899be932385a2a8',
      ],
      [
        'a576df8e23a08411421439a4518da31880cef0fba7d4df12b1a6973eecb94266',
        '40a6bf20e76640b2c92b97afe58cd82c432e10a7f514d9f3ee8be11ae1b28ec8',
      ],
      [
        '7778a78c28dec3e30a05fe9629de8c38bb30d1f5cf9a3a208f763889be58ad71',
        '34626d9ab5a5b22ff7098e12f2ff580087b38411ff24ac563b513fc1fd9f43ac',
      ],
      [
        '928955ee637a84463729fd30e7afd2ed5f96274e5ad7e5cb09eda9c06d903ac',
        'c25621003d3f42a827b78a13093a95eeac3d26efa8a8d83fc5180e935bcd091f',
      ],
      [
        '85d0fef3ec6db109399064f3a0e3b2855645b4a907ad354527aae75163d82751',
        '1f03648413a38c0be29d496e582cf5663e8751e96877331582c237a24eb1f962',
      ],
      [
        'ff2b0dce97eece97c1c9b6041798b85dfdfb6d8882da20308f5404824526087e',
        '493d13fef524ba188af4c4dc54d07936c7b7ed6fb90e2ceb2c951e01f0c29907',
      ],
      [
        '827fbbe4b1e880ea9ed2b2e6301b212b57f1ee148cd6dd28780e5e2cf856e241',
        'c60f9c923c727b0b71bef2c67d1d12687ff7a63186903166d605b68baec293ec',
      ],
      [
        'eaa649f21f51bdbae7be4ae34ce6e5217a58fdce7f47f9aa7f3b58fa2120e2b3',
        'be3279ed5bbbb03ac69a80f89879aa5a01a6b965f13f7e59d47a5305ba5ad93d',
      ],
      [
        'e4a42d43c5cf169d9391df6decf42ee541b6d8f0c9a137401e23632dda34d24f',
        '4d9f92e716d1c73526fc99ccfb8ad34ce886eedfa8d8e4f13a7f7131deba9414',
      ],
      [
        '1ec80fef360cbdd954160fadab352b6b92b53576a88fea4947173b9d4300bf19',
        'aeefe93756b5340d2f3a4958a7abbf5e0146e77f6295a07b671cdc1cc107cefd',
      ],
      [
        '146a778c04670c2f91b00af4680dfa8bce3490717d58ba889ddb5928366642be',
        'b318e0ec3354028add669827f9d4b2870aaa971d2f7e5ed1d0b297483d83efd0',
      ],
      [
        'fa50c0f61d22e5f07e3acebb1aa07b128d0012209a28b9776d76a8793180eef9',
        '6b84c6922397eba9b72cd2872281a68a5e683293a57a213b38cd8d7d3f4f2811',
      ],
      [
        'da1d61d0ca721a11b1a5bf6b7d88e8421a288ab5d5bba5220e53d32b5f067ec2',
        '8157f55a7c99306c79c0766161c91e2966a73899d279b48a655fba0f1ad836f1',
      ],
      [
        'a8e282ff0c9706907215ff98e8fd416615311de0446f1e062a73b0610d064e13',
        '7f97355b8db81c09abfb7f3c5b2515888b679a3e50dd6bd6cef7c73111f4cc0c',
      ],
      [
        '174a53b9c9a285872d39e56e6913cab15d59b1fa512508c022f382de8319497c',
        'ccc9dc37abfc9c1657b4155f2c47f9e6646b3a1d8cb9854383da13ac079afa73',
      ],
      [
        '959396981943785c3d3e57edf5018cdbe039e730e4918b3d884fdff09475b7ba',
        '2e7e552888c331dd8ba0386a4b9cd6849c653f64c8709385e9b8abf87524f2fd',
      ],
      [
        'd2a63a50ae401e56d645a1153b109a8fcca0a43d561fba2dbb51340c9d82b151',
        'e82d86fb6443fcb7565aee58b2948220a70f750af484ca52d4142174dcf89405',
      ],
      [
        '64587e2335471eb890ee7896d7cfdc866bacbdbd3839317b3436f9b45617e073',
        'd99fcdd5bf6902e2ae96dd6447c299a185b90a39133aeab358299e5e9faf6589',
      ],
      [
        '8481bde0e4e4d885b3a546d3e549de042f0aa6cea250e7fd358d6c86dd45e458',
        '38ee7b8cba5404dd84a25bf39cecb2ca900a79c42b262e556d64b1b59779057e',
      ],
      [
        '13464a57a78102aa62b6979ae817f4637ffcfed3c4b1ce30bcd6303f6caf666b',
        '69be159004614580ef7e433453ccb0ca48f300a81d0942e13f495a907f6ecc27',
      ],
      [
        'bc4a9df5b713fe2e9aef430bcc1dc97a0cd9ccede2f28588cada3a0d2d83f366',
        'd3a81ca6e785c06383937adf4b798caa6e8a9fbfa547b16d758d666581f33c1',
      ],
      [
        '8c28a97bf8298bc0d23d8c749452a32e694b65e30a9472a3954ab30fe5324caa',
        '40a30463a3305193378fedf31f7cc0eb7ae784f0451cb9459e71dc73cbef9482',
      ],
      [
        '8ea9666139527a8c1dd94ce4f071fd23c8b350c5a4bb33748c4ba111faccae0',
        '620efabbc8ee2782e24e7c0cfb95c5d735b783be9cf0f8e955af34a30e62b945',
      ],
      [
        'dd3625faef5ba06074669716bbd3788d89bdde815959968092f76cc4eb9a9787',
        '7a188fa3520e30d461da2501045731ca941461982883395937f68d00c644a573',
      ],
      [
        'f710d79d9eb962297e4f6232b40e8f7feb2bc63814614d692c12de752408221e',
        'ea98e67232d3b3295d3b535532115ccac8612c721851617526ae47a9c77bfc82',
      ],
    ],
  },
  naf: {
    wnd: 7,
    points: [
      [
        'f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9',
        '388f7b0f632de8140fe337e62a37f3566500a99934c2231b6cb9fd7584b8e672',
      ],
      [
        '2f8bde4d1a07209355b4a7250a5c5128e88b84bddc619ab7cba8d569b240efe4',
        'd8ac222636e5e3d6d4dba9dda6c9c426f788271bab0d6840dca87d3aa6ac62d6',
      ],
      [
        '5cbdf0646e5db4eaa398f365f2ea7a0e3d419b7e0330e39ce92bddedcac4f9bc',
        '6aebca40ba255960a3178d6d861a54dba813d0b813fde7b5a5082628087264da',
      ],
      [
        'acd484e2f0c7f65309ad178a9f559abde09796974c57e714c35f110dfc27ccbe',
        'cc338921b0a7d9fd64380971763b61e9add888a4375f8e0f05cc262ac64f9c37',
      ],
      [
        '774ae7f858a9411e5ef4246b70c65aac5649980be5c17891bbec17895da008cb',
        'd984a032eb6b5e190243dd56d7b7b365372db1e2dff9d6a8301d74c9c953c61b',
      ],
      [
        'f28773c2d975288bc7d1d205c3748651b075fbc6610e58cddeeddf8f19405aa8',
        'ab0902e8d880a89758212eb65cdaf473a1a06da521fa91f29b5cb52db03ed81',
      ],
      [
        'd7924d4f7d43ea965a465ae3095ff41131e5946f3c85f79e44adbcf8e27e080e',
        '581e2872a86c72a683842ec228cc6defea40af2bd896d3a5c504dc9ff6a26b58',
      ],
      [
        'defdea4cdb677750a420fee807eacf21eb9898ae79b9768766e4faa04a2d4a34',
        '4211ab0694635168e997b0ead2a93daeced1f4a04a95c0f6cfb199f69e56eb77',
      ],
      [
        '2b4ea0a797a443d293ef5cff444f4979f06acfebd7e86d277475656138385b6c',
        '85e89bc037945d93b343083b5a1c86131a01f60c50269763b570c854e5c09b7a',
      ],
      [
        '352bbf4a4cdd12564f93fa332ce333301d9ad40271f8107181340aef25be59d5',
        '321eb4075348f534d59c18259dda3e1f4a1b3b2e71b1039c67bd3d8bcf81998c',
      ],
      [
        '2fa2104d6b38d11b0230010559879124e42ab8dfeff5ff29dc9cdadd4ecacc3f',
        '2de1068295dd865b64569335bd5dd80181d70ecfc882648423ba76b532b7d67',
      ],
      [
        '9248279b09b4d68dab21a9b066edda83263c3d84e09572e269ca0cd7f5453714',
        '73016f7bf234aade5d1aa71bdea2b1ff3fc0de2a887912ffe54a32ce97cb3402',
      ],
      [
        'daed4f2be3a8bf278e70132fb0beb7522f570e144bf615c07e996d443dee8729',
        'a69dce4a7d6c98e8d4a1aca87ef8d7003f83c230f3afa726ab40e52290be1c55',
      ],
      [
        'c44d12c7065d812e8acf28d7cbb19f9011ecd9e9fdf281b0e6a3b5e87d22e7db',
        '2119a460ce326cdc76c45926c982fdac0e106e861edf61c5a039063f0e0e6482',
      ],
      [
        '6a245bf6dc698504c89a20cfded60853152b695336c28063b61c65cbd269e6b4',
        'e022cf42c2bd4a708b3f5126f16a24ad8b33ba48d0423b6efd5e6348100d8a82',
      ],
      [
        '1697ffa6fd9de627c077e3d2fe541084ce13300b0bec1146f95ae57f0d0bd6a5',
        'b9c398f186806f5d27561506e4557433a2cf15009e498ae7adee9d63d01b2396',
      ],
      [
        '605bdb019981718b986d0f07e834cb0d9deb8360ffb7f61df982345ef27a7479',
        '2972d2de4f8d20681a78d93ec96fe23c26bfae84fb14db43b01e1e9056b8c49',
      ],
      [
        '62d14dab4150bf497402fdc45a215e10dcb01c354959b10cfe31c7e9d87ff33d',
        '80fc06bd8cc5b01098088a1950eed0db01aa132967ab472235f5642483b25eaf',
      ],
      [
        '80c60ad0040f27dade5b4b06c408e56b2c50e9f56b9b8b425e555c2f86308b6f',
        '1c38303f1cc5c30f26e66bad7fe72f70a65eed4cbe7024eb1aa01f56430bd57a',
      ],
      [
        '7a9375ad6167ad54aa74c6348cc54d344cc5dc9487d847049d5eabb0fa03c8fb',
        'd0e3fa9eca8726909559e0d79269046bdc59ea10c70ce2b02d499ec224dc7f7',
      ],
      [
        'd528ecd9b696b54c907a9ed045447a79bb408ec39b68df504bb51f459bc3ffc9',
        'eecf41253136e5f99966f21881fd656ebc4345405c520dbc063465b521409933',
      ],
      [
        '49370a4b5f43412ea25f514e8ecdad05266115e4a7ecb1387231808f8b45963',
        '758f3f41afd6ed428b3081b0512fd62a54c3f3afbb5b6764b653052a12949c9a',
      ],
      [
        '77f230936ee88cbbd73df930d64702ef881d811e0e1498e2f1c13eb1fc345d74',
        '958ef42a7886b6400a08266e9ba1b37896c95330d97077cbbe8eb3c7671c60d6',
      ],
      [
        'f2dac991cc4ce4b9ea44887e5c7c0bce58c80074ab9d4dbaeb28531b7739f530',
        'e0dedc9b3b2f8dad4da1f32dec2531df9eb5fbeb0598e4fd1a117dba703a3c37',
      ],
      [
        '463b3d9f662621fb1b4be8fbbe2520125a216cdfc9dae3debcba4850c690d45b',
        '5ed430d78c296c3543114306dd8622d7c622e27c970a1de31cb377b01af7307e',
      ],
      [
        'f16f804244e46e2a09232d4aff3b59976b98fac14328a2d1a32496b49998f247',
        'cedabd9b82203f7e13d206fcdf4e33d92a6c53c26e5cce26d6579962c4e31df6',
      ],
      [
        'caf754272dc84563b0352b7a14311af55d245315ace27c65369e15f7151d41d1',
        'cb474660ef35f5f2a41b643fa5e460575f4fa9b7962232a5c32f908318a04476',
      ],
      [
        '2600ca4b282cb986f85d0f1709979d8b44a09c07cb86d7c124497bc86f082120',
        '4119b88753c15bd6a693b03fcddbb45d5ac6be74ab5f0ef44b0be9475a7e4b40',
      ],
      [
        '7635ca72d7e8432c338ec53cd12220bc01c48685e24f7dc8c602a7746998e435',
        '91b649609489d613d1d5e590f78e6d74ecfc061d57048bad9e76f302c5b9c61',
      ],
      [
        '754e3239f325570cdbbf4a87deee8a66b7f2b33479d468fbc1a50743bf56cc18',
        '673fb86e5bda30fb3cd0ed304ea49a023ee33d0197a695d0c5d98093c536683',
      ],
      [
        'e3e6bd1071a1e96aff57859c82d570f0330800661d1c952f9fe2694691d9b9e8',
        '59c9e0bba394e76f40c0aa58379a3cb6a5a2283993e90c4167002af4920e37f5',
      ],
      [
        '186b483d056a033826ae73d88f732985c4ccb1f32ba35f4b4cc47fdcf04aa6eb',
        '3b952d32c67cf77e2e17446e204180ab21fb8090895138b4a4a797f86e80888b',
      ],
      [
        'df9d70a6b9876ce544c98561f4be4f725442e6d2b737d9c91a8321724ce0963f',
        '55eb2dafd84d6ccd5f862b785dc39d4ab157222720ef9da217b8c45cf2ba2417',
      ],
      [
        '5edd5cc23c51e87a497ca815d5dce0f8ab52554f849ed8995de64c5f34ce7143',
        'efae9c8dbc14130661e8cec030c89ad0c13c66c0d17a2905cdc706ab7399a868',
      ],
      [
        '290798c2b6476830da12fe02287e9e777aa3fba1c355b17a722d362f84614fba',
        'e38da76dcd440621988d00bcf79af25d5b29c094db2a23146d003afd41943e7a',
      ],
      [
        'af3c423a95d9f5b3054754efa150ac39cd29552fe360257362dfdecef4053b45',
        'f98a3fd831eb2b749a93b0e6f35cfb40c8cd5aa667a15581bc2feded498fd9c6',
      ],
      [
        '766dbb24d134e745cccaa28c99bf274906bb66b26dcf98df8d2fed50d884249a',
        '744b1152eacbe5e38dcc887980da38b897584a65fa06cedd2c924f97cbac5996',
      ],
      [
        '59dbf46f8c94759ba21277c33784f41645f7b44f6c596a58ce92e666191abe3e',
        'c534ad44175fbc300f4ea6ce648309a042ce739a7919798cd85e216c4a307f6e',
      ],
      [
        'f13ada95103c4537305e691e74e9a4a8dd647e711a95e73cb62dc6018cfd87b8',
        'e13817b44ee14de663bf4bc808341f326949e21a6a75c2570778419bdaf5733d',
      ],
      [
        '7754b4fa0e8aced06d4167a2c59cca4cda1869c06ebadfb6488550015a88522c',
        '30e93e864e669d82224b967c3020b8fa8d1e4e350b6cbcc537a48b57841163a2',
      ],
      [
        '948dcadf5990e048aa3874d46abef9d701858f95de8041d2a6828c99e2262519',
        'e491a42537f6e597d5d28a3224b1bc25df9154efbd2ef1d2cbba2cae5347d57e',
      ],
      [
        '7962414450c76c1689c7b48f8202ec37fb224cf5ac0bfa1570328a8a3d7c77ab',
        '100b610ec4ffb4760d5c1fc133ef6f6b12507a051f04ac5760afa5b29db83437',
      ],
      [
        '3514087834964b54b15b160644d915485a16977225b8847bb0dd085137ec47ca',
        'ef0afbb2056205448e1652c48e8127fc6039e77c15c2378b7e7d15a0de293311',
      ],
      [
        'd3cc30ad6b483e4bc79ce2c9dd8bc54993e947eb8df787b442943d3f7b527eaf',
        '8b378a22d827278d89c5e9be8f9508ae3c2ad46290358630afb34db04eede0a4',
      ],
      [
        '1624d84780732860ce1c78fcbfefe08b2b29823db913f6493975ba0ff4847610',
        '68651cf9b6da903e0914448c6cd9d4ca896878f5282be4c8cc06e2a404078575',
      ],
      [
        '733ce80da955a8a26902c95633e62a985192474b5af207da6df7b4fd5fc61cd4',
        'f5435a2bd2badf7d485a4d8b8db9fcce3e1ef8e0201e4578c54673bc1dc5ea1d',
      ],
      [
        '15d9441254945064cf1a1c33bbd3b49f8966c5092171e699ef258dfab81c045c',
        'd56eb30b69463e7234f5137b73b84177434800bacebfc685fc37bbe9efe4070d',
      ],
      [
        'a1d0fcf2ec9de675b612136e5ce70d271c21417c9d2b8aaaac138599d0717940',
        'edd77f50bcb5a3cab2e90737309667f2641462a54070f3d519212d39c197a629',
      ],
      [
        'e22fbe15c0af8ccc5780c0735f84dbe9a790badee8245c06c7ca37331cb36980',
        'a855babad5cd60c88b430a69f53a1a7a38289154964799be43d06d77d31da06',
      ],
      [
        '311091dd9860e8e20ee13473c1155f5f69635e394704eaa74009452246cfa9b3',
        '66db656f87d1f04fffd1f04788c06830871ec5a64feee685bd80f0b1286d8374',
      ],
      [
        '34c1fd04d301be89b31c0442d3e6ac24883928b45a9340781867d4232ec2dbdf',
        '9414685e97b1b5954bd46f730174136d57f1ceeb487443dc5321857ba73abee',
      ],
      [
        'f219ea5d6b54701c1c14de5b557eb42a8d13f3abbcd08affcc2a5e6b049b8d63',
        '4cb95957e83d40b0f73af4544cccf6b1f4b08d3c07b27fb8d8c2962a400766d1',
      ],
      [
        'd7b8740f74a8fbaab1f683db8f45de26543a5490bca627087236912469a0b448',
        'fa77968128d9c92ee1010f337ad4717eff15db5ed3c049b3411e0315eaa4593b',
      ],
      [
        '32d31c222f8f6f0ef86f7c98d3a3335ead5bcd32abdd94289fe4d3091aa824bf',
        '5f3032f5892156e39ccd3d7915b9e1da2e6dac9e6f26e961118d14b8462e1661',
      ],
      [
        '7461f371914ab32671045a155d9831ea8793d77cd59592c4340f86cbc18347b5',
        '8ec0ba238b96bec0cbdddcae0aa442542eee1ff50c986ea6b39847b3cc092ff6',
      ],
      [
        'ee079adb1df1860074356a25aa38206a6d716b2c3e67453d287698bad7b2b2d6',
        '8dc2412aafe3be5c4c5f37e0ecc5f9f6a446989af04c4e25ebaac479ec1c8c1e',
      ],
      [
        '16ec93e447ec83f0467b18302ee620f7e65de331874c9dc72bfd8616ba9da6b5',
        '5e4631150e62fb40d0e8c2a7ca5804a39d58186a50e497139626778e25b0674d',
      ],
      [
        'eaa5f980c245f6f038978290afa70b6bd8855897f98b6aa485b96065d537bd99',
        'f65f5d3e292c2e0819a528391c994624d784869d7e6ea67fb18041024edc07dc',
      ],
      [
        '78c9407544ac132692ee1910a02439958ae04877151342ea96c4b6b35a49f51',
        'f3e0319169eb9b85d5404795539a5e68fa1fbd583c064d2462b675f194a3ddb4',
      ],
      [
        '494f4be219a1a77016dcd838431aea0001cdc8ae7a6fc688726578d9702857a5',
        '42242a969283a5f339ba7f075e36ba2af925ce30d767ed6e55f4b031880d562c',
      ],
      [
        'a598a8030da6d86c6bc7f2f5144ea549d28211ea58faa70ebf4c1e665c1fe9b5',
        '204b5d6f84822c307e4b4a7140737aec23fc63b65b35f86a10026dbd2d864e6b',
      ],
      [
        'c41916365abb2b5d09192f5f2dbeafec208f020f12570a184dbadc3e58595997',
        '4f14351d0087efa49d245b328984989d5caf9450f34bfc0ed16e96b58fa9913',
      ],
      [
        '841d6063a586fa475a724604da03bc5b92a2e0d2e0a36acfe4c73a5514742881',
        '73867f59c0659e81904f9a1c7543698e62562d6744c169ce7a36de01a8d6154',
      ],
      [
        '5e95bb399a6971d376026947f89bde2f282b33810928be4ded112ac4d70e20d5',
        '39f23f366809085beebfc71181313775a99c9aed7d8ba38b161384c746012865',
      ],
      [
        '36e4641a53948fd476c39f8a99fd974e5ec07564b5315d8bf99471bca0ef2f66',
        'd2424b1b1abe4eb8164227b085c9aa9456ea13493fd563e06fd51cf5694c78fc',
      ],
      [
        '336581ea7bfbbb290c191a2f507a41cf5643842170e914faeab27c2c579f726',
        'ead12168595fe1be99252129b6e56b3391f7ab1410cd1e0ef3dcdcabd2fda224',
      ],
      [
        '8ab89816dadfd6b6a1f2634fcf00ec8403781025ed6890c4849742706bd43ede',
        '6fdcef09f2f6d0a044e654aef624136f503d459c3e89845858a47a9129cdd24e',
      ],
      [
        '1e33f1a746c9c5778133344d9299fcaa20b0938e8acff2544bb40284b8c5fb94',
        '60660257dd11b3aa9c8ed618d24edff2306d320f1d03010e33a7d2057f3b3b6',
      ],
      [
        '85b7c1dcb3cec1b7ee7f30ded79dd20a0ed1f4cc18cbcfcfa410361fd8f08f31',
        '3d98a9cdd026dd43f39048f25a8847f4fcafad1895d7a633c6fed3c35e999511',
      ],
      [
        '29df9fbd8d9e46509275f4b125d6d45d7fbe9a3b878a7af872a2800661ac5f51',
        'b4c4fe99c775a606e2d8862179139ffda61dc861c019e55cd2876eb2a27d84b',
      ],
      [
        'a0b1cae06b0a847a3fea6e671aaf8adfdfe58ca2f768105c8082b2e449fce252',
        'ae434102edde0958ec4b19d917a6a28e6b72da1834aff0e650f049503a296cf2',
      ],
      [
        '4e8ceafb9b3e9a136dc7ff67e840295b499dfb3b2133e4ba113f2e4c0e121e5',
        'cf2174118c8b6d7a4b48f6d534ce5c79422c086a63460502b827ce62a326683c',
      ],
      [
        'd24a44e047e19b6f5afb81c7ca2f69080a5076689a010919f42725c2b789a33b',
        '6fb8d5591b466f8fc63db50f1c0f1c69013f996887b8244d2cdec417afea8fa3',
      ],
      [
        'ea01606a7a6c9cdd249fdfcfacb99584001edd28abbab77b5104e98e8e3b35d4',
        '322af4908c7312b0cfbfe369f7a7b3cdb7d4494bc2823700cfd652188a3ea98d',
      ],
      [
        'af8addbf2b661c8a6c6328655eb96651252007d8c5ea31be4ad196de8ce2131f',
        '6749e67c029b85f52a034eafd096836b2520818680e26ac8f3dfbcdb71749700',
      ],
      [
        'e3ae1974566ca06cc516d47e0fb165a674a3dabcfca15e722f0e3450f45889',
        '2aeabe7e4531510116217f07bf4d07300de97e4874f81f533420a72eeb0bd6a4',
      ],
      [
        '591ee355313d99721cf6993ffed1e3e301993ff3ed258802075ea8ced397e246',
        'b0ea558a113c30bea60fc4775460c7901ff0b053d25ca2bdeee98f1a4be5d196',
      ],
      [
        '11396d55fda54c49f19aa97318d8da61fa8584e47b084945077cf03255b52984',
        '998c74a8cd45ac01289d5833a7beb4744ff536b01b257be4c5767bea93ea57a4',
      ],
      [
        '3c5d2a1ba39c5a1790000738c9e0c40b8dcdfd5468754b6405540157e017aa7a',
        'b2284279995a34e2f9d4de7396fc18b80f9b8b9fdd270f6661f79ca4c81bd257',
      ],
      [
        'cc8704b8a60a0defa3a99a7299f2e9c3fbc395afb04ac078425ef8a1793cc030',
        'bdd46039feed17881d1e0862db347f8cf395b74fc4bcdc4e940b74e3ac1f1b13',
      ],
      [
        'c533e4f7ea8555aacd9777ac5cad29b97dd4defccc53ee7ea204119b2889b197',
        '6f0a256bc5efdf429a2fb6242f1a43a2d9b925bb4a4b3a26bb8e0f45eb596096',
      ],
      [
        'c14f8f2ccb27d6f109f6d08d03cc96a69ba8c34eec07bbcf566d48e33da6593',
        'c359d6923bb398f7fd4473e16fe1c28475b740dd098075e6c0e8649113dc3a38',
      ],
      [
        'a6cbc3046bc6a450bac24789fa17115a4c9739ed75f8f21ce441f72e0b90e6ef',
        '21ae7f4680e889bb130619e2c0f95a360ceb573c70603139862afd617fa9b9f',
      ],
      [
        '347d6d9a02c48927ebfb86c1359b1caf130a3c0267d11ce6344b39f99d43cc38',
        '60ea7f61a353524d1c987f6ecec92f086d565ab687870cb12689ff1e31c74448',
      ],
      [
        'da6545d2181db8d983f7dcb375ef5866d47c67b1bf31c8cf855ef7437b72656a',
        '49b96715ab6878a79e78f07ce5680c5d6673051b4935bd897fea824b77dc208a',
      ],
      [
        'c40747cc9d012cb1a13b8148309c6de7ec25d6945d657146b9d5994b8feb1111',
        '5ca560753be2a12fc6de6caf2cb489565db936156b9514e1bb5e83037e0fa2d4',
      ],
      [
        '4e42c8ec82c99798ccf3a610be870e78338c7f713348bd34c8203ef4037f3502',
        '7571d74ee5e0fb92a7a8b33a07783341a5492144cc54bcc40a94473693606437',
      ],
      [
        '3775ab7089bc6af823aba2e1af70b236d251cadb0c86743287522a1b3b0dedea',
        'be52d107bcfa09d8bcb9736a828cfa7fac8db17bf7a76a2c42ad961409018cf7',
      ],
      [
        'cee31cbf7e34ec379d94fb814d3d775ad954595d1314ba8846959e3e82f74e26',
        '8fd64a14c06b589c26b947ae2bcf6bfa0149ef0be14ed4d80f448a01c43b1c6d',
      ],
      [
        'b4f9eaea09b6917619f6ea6a4eb5464efddb58fd45b1ebefcdc1a01d08b47986',
        '39e5c9925b5a54b07433a4f18c61726f8bb131c012ca542eb24a8ac07200682a',
      ],
      [
        'd4263dfc3d2df923a0179a48966d30ce84e2515afc3dccc1b77907792ebcc60e',
        '62dfaf07a0f78feb30e30d6295853ce189e127760ad6cf7fae164e122a208d54',
      ],
      [
        '48457524820fa65a4f8d35eb6930857c0032acc0a4a2de422233eeda897612c4',
        '25a748ab367979d98733c38a1fa1c2e7dc6cc07db2d60a9ae7a76aaa49bd0f77',
      ],
      [
        'dfeeef1881101f2cb11644f3a2afdfc2045e19919152923f367a1767c11cceda',
        'ecfb7056cf1de042f9420bab396793c0c390bde74b4bbdff16a83ae09a9a7517',
      ],
      [
        '6d7ef6b17543f8373c573f44e1f389835d89bcbc6062ced36c82df83b8fae859',
        'cd450ec335438986dfefa10c57fea9bcc521a0959b2d80bbf74b190dca712d10',
      ],
      [
        'e75605d59102a5a2684500d3b991f2e3f3c88b93225547035af25af66e04541f',
        'f5c54754a8f71ee540b9b48728473e314f729ac5308b06938360990e2bfad125',
      ],
      [
        'eb98660f4c4dfaa06a2be453d5020bc99a0c2e60abe388457dd43fefb1ed620c',
        '6cb9a8876d9cb8520609af3add26cd20a0a7cd8a9411131ce85f44100099223e',
      ],
      [
        '13e87b027d8514d35939f2e6892b19922154596941888336dc3563e3b8dba942',
        'fef5a3c68059a6dec5d624114bf1e91aac2b9da568d6abeb2570d55646b8adf1',
      ],
      [
        'ee163026e9fd6fe017c38f06a5be6fc125424b371ce2708e7bf4491691e5764a',
        '1acb250f255dd61c43d94ccc670d0f58f49ae3fa15b96623e5430da0ad6c62b2',
      ],
      [
        'b268f5ef9ad51e4d78de3a750c2dc89b1e626d43505867999932e5db33af3d80',
        '5f310d4b3c99b9ebb19f77d41c1dee018cf0d34fd4191614003e945a1216e423',
      ],
      [
        'ff07f3118a9df035e9fad85eb6c7bfe42b02f01ca99ceea3bf7ffdba93c4750d',
        '438136d603e858a3a5c440c38eccbaddc1d2942114e2eddd4740d098ced1f0d8',
      ],
      [
        '8d8b9855c7c052a34146fd20ffb658bea4b9f69e0d825ebec16e8c3ce2b526a1',
        'cdb559eedc2d79f926baf44fb84ea4d44bcf50fee51d7ceb30e2e7f463036758',
      ],
      [
        '52db0b5384dfbf05bfa9d472d7ae26dfe4b851ceca91b1eba54263180da32b63',
        'c3b997d050ee5d423ebaf66a6db9f57b3180c902875679de924b69d84a7b375',
      ],
      [
        'e62f9490d3d51da6395efd24e80919cc7d0f29c3f3fa48c6fff543becbd43352',
        '6d89ad7ba4876b0b22c2ca280c682862f342c8591f1daf5170e07bfd9ccafa7d',
      ],
      [
        '7f30ea2476b399b4957509c88f77d0191afa2ff5cb7b14fd6d8e7d65aaab1193',
        'ca5ef7d4b231c94c3b15389a5f6311e9daff7bb67b103e9880ef4bff637acaec',
      ],
      [
        '5098ff1e1d9f14fb46a210fada6c903fef0fb7b4a1dd1d9ac60a0361800b7a00',
        '9731141d81fc8f8084d37c6e7542006b3ee1b40d60dfe5362a5b132fd17ddc0',
      ],
      [
        '32b78c7de9ee512a72895be6b9cbefa6e2f3c4ccce445c96b9f2c81e2778ad58',
        'ee1849f513df71e32efc3896ee28260c73bb80547ae2275ba497237794c8753c',
      ],
      [
        'e2cb74fddc8e9fbcd076eef2a7c72b0ce37d50f08269dfc074b581550547a4f7',
        'd3aa2ed71c9dd2247a62df062736eb0baddea9e36122d2be8641abcb005cc4a4',
      ],
      [
        '8438447566d4d7bedadc299496ab357426009a35f235cb141be0d99cd10ae3a8',
        'c4e1020916980a4da5d01ac5e6ad330734ef0d7906631c4f2390426b2edd791f',
      ],
      [
        '4162d488b89402039b584c6fc6c308870587d9c46f660b878ab65c82c711d67e',
        '67163e903236289f776f22c25fb8a3afc1732f2b84b4e95dbda47ae5a0852649',
      ],
      [
        '3fad3fa84caf0f34f0f89bfd2dcf54fc175d767aec3e50684f3ba4a4bf5f683d',
        'cd1bc7cb6cc407bb2f0ca647c718a730cf71872e7d0d2a53fa20efcdfe61826',
      ],
      [
        '674f2600a3007a00568c1a7ce05d0816c1fb84bf1370798f1c69532faeb1a86b',
        '299d21f9413f33b3edf43b257004580b70db57da0b182259e09eecc69e0d38a5',
      ],
      [
        'd32f4da54ade74abb81b815ad1fb3b263d82d6c692714bcff87d29bd5ee9f08f',
        'f9429e738b8e53b968e99016c059707782e14f4535359d582fc416910b3eea87',
      ],
      [
        '30e4e670435385556e593657135845d36fbb6931f72b08cb1ed954f1e3ce3ff6',
        '462f9bce619898638499350113bbc9b10a878d35da70740dc695a559eb88db7b',
      ],
      [
        'be2062003c51cc3004682904330e4dee7f3dcd10b01e580bf1971b04d4cad297',
        '62188bc49d61e5428573d48a74e1c655b1c61090905682a0d5558ed72dccb9bc',
      ],
      [
        '93144423ace3451ed29e0fb9ac2af211cb6e84a601df5993c419859fff5df04a',
        '7c10dfb164c3425f5c71a3f9d7992038f1065224f72bb9d1d902a6d13037b47c',
      ],
      [
        'b015f8044f5fcbdcf21ca26d6c34fb8197829205c7b7d2a7cb66418c157b112c',
        'ab8c1e086d04e813744a655b2df8d5f83b3cdc6faa3088c1d3aea1454e3a1d5f',
      ],
      [
        'd5e9e1da649d97d89e4868117a465a3a4f8a18de57a140d36b3f2af341a21b52',
        '4cb04437f391ed73111a13cc1d4dd0db1693465c2240480d8955e8592f27447a',
      ],
      [
        'd3ae41047dd7ca065dbf8ed77b992439983005cd72e16d6f996a5316d36966bb',
        'bd1aeb21ad22ebb22a10f0303417c6d964f8cdd7df0aca614b10dc14d125ac46',
      ],
      [
        '463e2763d885f958fc66cdd22800f0a487197d0a82e377b49f80af87c897b065',
        'bfefacdb0e5d0fd7df3a311a94de062b26b80c61fbc97508b79992671ef7ca7f',
      ],
      [
        '7985fdfd127c0567c6f53ec1bb63ec3158e597c40bfe747c83cddfc910641917',
        '603c12daf3d9862ef2b25fe1de289aed24ed291e0ec6708703a5bd567f32ed03',
      ],
      [
        '74a1ad6b5f76e39db2dd249410eac7f99e74c59cb83d2d0ed5ff1543da7703e9',
        'cc6157ef18c9c63cd6193d83631bbea0093e0968942e8c33d5737fd790e0db08',
      ],
      [
        '30682a50703375f602d416664ba19b7fc9bab42c72747463a71d0896b22f6da3',
        '553e04f6b018b4fa6c8f39e7f311d3176290d0e0f19ca73f17714d9977a22ff8',
      ],
      [
        '9e2158f0d7c0d5f26c3791efefa79597654e7a2b2464f52b1ee6c1347769ef57',
        '712fcdd1b9053f09003a3481fa7762e9ffd7c8ef35a38509e2fbf2629008373',
      ],
      [
        '176e26989a43c9cfeba4029c202538c28172e566e3c4fce7322857f3be327d66',
        'ed8cc9d04b29eb877d270b4878dc43c19aefd31f4eee09ee7b47834c1fa4b1c3',
      ],
      [
        '75d46efea3771e6e68abb89a13ad747ecf1892393dfc4f1b7004788c50374da8',
        '9852390a99507679fd0b86fd2b39a868d7efc22151346e1a3ca4726586a6bed8',
      ],
      [
        '809a20c67d64900ffb698c4c825f6d5f2310fb0451c869345b7319f645605721',
        '9e994980d9917e22b76b061927fa04143d096ccc54963e6a5ebfa5f3f8e286c1',
      ],
      [
        '1b38903a43f7f114ed4500b4eac7083fdefece1cf29c63528d563446f972c180',
        '4036edc931a60ae889353f77fd53de4a2708b26b6f5da72ad3394119daf408f9',
      ],
    ],
  },
};

},{}],21:[function(require,module,exports){
'use strict';

var utils = exports;
var BN = require('bn.js');
var minAssert = require('minimalistic-assert');
var minUtils = require('minimalistic-crypto-utils');

utils.assert = minAssert;
utils.toArray = minUtils.toArray;
utils.zero2 = minUtils.zero2;
utils.toHex = minUtils.toHex;
utils.encode = minUtils.encode;

// Represent num in a w-NAF form
function getNAF(num, w, bits) {
  var naf = new Array(Math.max(num.bitLength(), bits) + 1);
  naf.fill(0);

  var ws = 1 << (w + 1);
  var k = num.clone();

  for (var i = 0; i < naf.length; i++) {
    var z;
    var mod = k.andln(ws - 1);
    if (k.isOdd()) {
      if (mod > (ws >> 1) - 1)
        z = (ws >> 1) - mod;
      else
        z = mod;
      k.isubn(z);
    } else {
      z = 0;
    }

    naf[i] = z;
    k.iushrn(1);
  }

  return naf;
}
utils.getNAF = getNAF;

// Represent k1, k2 in a Joint Sparse Form
function getJSF(k1, k2) {
  var jsf = [
    [],
    [],
  ];

  k1 = k1.clone();
  k2 = k2.clone();
  var d1 = 0;
  var d2 = 0;
  var m8;
  while (k1.cmpn(-d1) > 0 || k2.cmpn(-d2) > 0) {
    // First phase
    var m14 = (k1.andln(3) + d1) & 3;
    var m24 = (k2.andln(3) + d2) & 3;
    if (m14 === 3)
      m14 = -1;
    if (m24 === 3)
      m24 = -1;
    var u1;
    if ((m14 & 1) === 0) {
      u1 = 0;
    } else {
      m8 = (k1.andln(7) + d1) & 7;
      if ((m8 === 3 || m8 === 5) && m24 === 2)
        u1 = -m14;
      else
        u1 = m14;
    }
    jsf[0].push(u1);

    var u2;
    if ((m24 & 1) === 0) {
      u2 = 0;
    } else {
      m8 = (k2.andln(7) + d2) & 7;
      if ((m8 === 3 || m8 === 5) && m14 === 2)
        u2 = -m24;
      else
        u2 = m24;
    }
    jsf[1].push(u2);

    // Second phase
    if (2 * d1 === u1 + 1)
      d1 = 1 - d1;
    if (2 * d2 === u2 + 1)
      d2 = 1 - d2;
    k1.iushrn(1);
    k2.iushrn(1);
  }

  return jsf;
}
utils.getJSF = getJSF;

function cachedProperty(obj, name, computer) {
  var key = '_' + name;
  obj.prototype[name] = function cachedProperty() {
    return this[key] !== undefined ? this[key] :
      this[key] = computer.call(this);
  };
}
utils.cachedProperty = cachedProperty;

function parseBytes(bytes) {
  return typeof bytes === 'string' ? utils.toArray(bytes, 'hex') :
    bytes;
}
utils.parseBytes = parseBytes;

function intFromLE(bytes) {
  return new BN(bytes, 'hex', 'le');
}
utils.intFromLE = intFromLE;


},{"bn.js":5,"minimalistic-assert":38,"minimalistic-crypto-utils":39}],22:[function(require,module,exports){
module.exports={
  "name": "elliptic",
  "version": "6.5.4",
  "description": "EC cryptography",
  "main": "lib/elliptic.js",
  "files": [
    "lib"
  ],
  "scripts": {
    "lint": "eslint lib test",
    "lint:fix": "npm run lint -- --fix",
    "unit": "istanbul test _mocha --reporter=spec test/index.js",
    "test": "npm run lint && npm run unit",
    "version": "grunt dist && git add dist/"
  },
  "repository": {
    "type": "git",
    "url": "git@github.com:indutny/elliptic"
  },
  "keywords": [
    "EC",
    "Elliptic",
    "curve",
    "Cryptography"
  ],
  "author": "Fedor Indutny <fedor@indutny.com>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/indutny/elliptic/issues"
  },
  "homepage": "https://github.com/indutny/elliptic",
  "devDependencies": {
    "brfs": "^2.0.2",
    "coveralls": "^3.1.0",
    "eslint": "^7.6.0",
    "grunt": "^1.2.1",
    "grunt-browserify": "^5.3.0",
    "grunt-cli": "^1.3.2",
    "grunt-contrib-connect": "^3.0.0",
    "grunt-contrib-copy": "^1.0.0",
    "grunt-contrib-uglify": "^5.0.0",
    "grunt-mocha-istanbul": "^5.0.2",
    "grunt-saucelabs": "^9.0.1",
    "istanbul": "^0.4.5",
    "mocha": "^8.0.1"
  },
  "dependencies": {
    "bn.js": "^4.11.9",
    "brorand": "^1.1.0",
    "hash.js": "^1.0.0",
    "hmac-drbg": "^1.0.1",
    "inherits": "^2.0.4",
    "minimalistic-assert": "^1.0.1",
    "minimalistic-crypto-utils": "^1.0.1"
  }
}

},{}],23:[function(require,module,exports){
var hash = exports;

hash.utils = require('./hash/utils');
hash.common = require('./hash/common');
hash.sha = require('./hash/sha');
hash.ripemd = require('./hash/ripemd');
hash.hmac = require('./hash/hmac');

// Proxy hash functions to the main object
hash.sha1 = hash.sha.sha1;
hash.sha256 = hash.sha.sha256;
hash.sha224 = hash.sha.sha224;
hash.sha384 = hash.sha.sha384;
hash.sha512 = hash.sha.sha512;
hash.ripemd160 = hash.ripemd.ripemd160;

},{"./hash/common":24,"./hash/hmac":25,"./hash/ripemd":26,"./hash/sha":27,"./hash/utils":34}],24:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var assert = require('minimalistic-assert');

function BlockHash() {
  this.pending = null;
  this.pendingTotal = 0;
  this.blockSize = this.constructor.blockSize;
  this.outSize = this.constructor.outSize;
  this.hmacStrength = this.constructor.hmacStrength;
  this.padLength = this.constructor.padLength / 8;
  this.endian = 'big';

  this._delta8 = this.blockSize / 8;
  this._delta32 = this.blockSize / 32;
}
exports.BlockHash = BlockHash;

BlockHash.prototype.update = function update(msg, enc) {
  // Convert message to array, pad it, and join into 32bit blocks
  msg = utils.toArray(msg, enc);
  if (!this.pending)
    this.pending = msg;
  else
    this.pending = this.pending.concat(msg);
  this.pendingTotal += msg.length;

  // Enough data, try updating
  if (this.pending.length >= this._delta8) {
    msg = this.pending;

    // Process pending data in blocks
    var r = msg.length % this._delta8;
    this.pending = msg.slice(msg.length - r, msg.length);
    if (this.pending.length === 0)
      this.pending = null;

    msg = utils.join32(msg, 0, msg.length - r, this.endian);
    for (var i = 0; i < msg.length; i += this._delta32)
      this._update(msg, i, i + this._delta32);
  }

  return this;
};

BlockHash.prototype.digest = function digest(enc) {
  this.update(this._pad());
  assert(this.pending === null);

  return this._digest(enc);
};

BlockHash.prototype._pad = function pad() {
  var len = this.pendingTotal;
  var bytes = this._delta8;
  var k = bytes - ((len + this.padLength) % bytes);
  var res = new Array(k + this.padLength);
  res[0] = 0x80;
  for (var i = 1; i < k; i++)
    res[i] = 0;

  // Append length
  len <<= 3;
  if (this.endian === 'big') {
    for (var t = 8; t < this.padLength; t++)
      res[i++] = 0;

    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = (len >>> 24) & 0xff;
    res[i++] = (len >>> 16) & 0xff;
    res[i++] = (len >>> 8) & 0xff;
    res[i++] = len & 0xff;
  } else {
    res[i++] = len & 0xff;
    res[i++] = (len >>> 8) & 0xff;
    res[i++] = (len >>> 16) & 0xff;
    res[i++] = (len >>> 24) & 0xff;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;
    res[i++] = 0;

    for (t = 8; t < this.padLength; t++)
      res[i++] = 0;
  }

  return res;
};

},{"./utils":34,"minimalistic-assert":38}],25:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var assert = require('minimalistic-assert');

function Hmac(hash, key, enc) {
  if (!(this instanceof Hmac))
    return new Hmac(hash, key, enc);
  this.Hash = hash;
  this.blockSize = hash.blockSize / 8;
  this.outSize = hash.outSize / 8;
  this.inner = null;
  this.outer = null;

  this._init(utils.toArray(key, enc));
}
module.exports = Hmac;

Hmac.prototype._init = function init(key) {
  // Shorten key, if needed
  if (key.length > this.blockSize)
    key = new this.Hash().update(key).digest();
  assert(key.length <= this.blockSize);

  // Add padding to key
  for (var i = key.length; i < this.blockSize; i++)
    key.push(0);

  for (i = 0; i < key.length; i++)
    key[i] ^= 0x36;
  this.inner = new this.Hash().update(key);

  // 0x36 ^ 0x5c = 0x6a
  for (i = 0; i < key.length; i++)
    key[i] ^= 0x6a;
  this.outer = new this.Hash().update(key);
};

Hmac.prototype.update = function update(msg, enc) {
  this.inner.update(msg, enc);
  return this;
};

Hmac.prototype.digest = function digest(enc) {
  this.outer.update(this.inner.digest());
  return this.outer.digest(enc);
};

},{"./utils":34,"minimalistic-assert":38}],26:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var common = require('./common');

var rotl32 = utils.rotl32;
var sum32 = utils.sum32;
var sum32_3 = utils.sum32_3;
var sum32_4 = utils.sum32_4;
var BlockHash = common.BlockHash;

function RIPEMD160() {
  if (!(this instanceof RIPEMD160))
    return new RIPEMD160();

  BlockHash.call(this);

  this.h = [ 0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0 ];
  this.endian = 'little';
}
utils.inherits(RIPEMD160, BlockHash);
exports.ripemd160 = RIPEMD160;

RIPEMD160.blockSize = 512;
RIPEMD160.outSize = 160;
RIPEMD160.hmacStrength = 192;
RIPEMD160.padLength = 64;

RIPEMD160.prototype._update = function update(msg, start) {
  var A = this.h[0];
  var B = this.h[1];
  var C = this.h[2];
  var D = this.h[3];
  var E = this.h[4];
  var Ah = A;
  var Bh = B;
  var Ch = C;
  var Dh = D;
  var Eh = E;
  for (var j = 0; j < 80; j++) {
    var T = sum32(
      rotl32(
        sum32_4(A, f(j, B, C, D), msg[r[j] + start], K(j)),
        s[j]),
      E);
    A = E;
    E = D;
    D = rotl32(C, 10);
    C = B;
    B = T;
    T = sum32(
      rotl32(
        sum32_4(Ah, f(79 - j, Bh, Ch, Dh), msg[rh[j] + start], Kh(j)),
        sh[j]),
      Eh);
    Ah = Eh;
    Eh = Dh;
    Dh = rotl32(Ch, 10);
    Ch = Bh;
    Bh = T;
  }
  T = sum32_3(this.h[1], C, Dh);
  this.h[1] = sum32_3(this.h[2], D, Eh);
  this.h[2] = sum32_3(this.h[3], E, Ah);
  this.h[3] = sum32_3(this.h[4], A, Bh);
  this.h[4] = sum32_3(this.h[0], B, Ch);
  this.h[0] = T;
};

RIPEMD160.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'little');
  else
    return utils.split32(this.h, 'little');
};

function f(j, x, y, z) {
  if (j <= 15)
    return x ^ y ^ z;
  else if (j <= 31)
    return (x & y) | ((~x) & z);
  else if (j <= 47)
    return (x | (~y)) ^ z;
  else if (j <= 63)
    return (x & z) | (y & (~z));
  else
    return x ^ (y | (~z));
}

function K(j) {
  if (j <= 15)
    return 0x00000000;
  else if (j <= 31)
    return 0x5a827999;
  else if (j <= 47)
    return 0x6ed9eba1;
  else if (j <= 63)
    return 0x8f1bbcdc;
  else
    return 0xa953fd4e;
}

function Kh(j) {
  if (j <= 15)
    return 0x50a28be6;
  else if (j <= 31)
    return 0x5c4dd124;
  else if (j <= 47)
    return 0x6d703ef3;
  else if (j <= 63)
    return 0x7a6d76e9;
  else
    return 0x00000000;
}

var r = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
  3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
  1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
  4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
];

var rh = [
  5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
  6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
  15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
  8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
  12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
];

var s = [
  11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
  7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
  11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
  11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
  9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
];

var sh = [
  8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
  9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
  9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
  15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
  8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
];

},{"./common":24,"./utils":34}],27:[function(require,module,exports){
'use strict';

exports.sha1 = require('./sha/1');
exports.sha224 = require('./sha/224');
exports.sha256 = require('./sha/256');
exports.sha384 = require('./sha/384');
exports.sha512 = require('./sha/512');

},{"./sha/1":28,"./sha/224":29,"./sha/256":30,"./sha/384":31,"./sha/512":32}],28:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var common = require('../common');
var shaCommon = require('./common');

var rotl32 = utils.rotl32;
var sum32 = utils.sum32;
var sum32_5 = utils.sum32_5;
var ft_1 = shaCommon.ft_1;
var BlockHash = common.BlockHash;

var sha1_K = [
  0x5A827999, 0x6ED9EBA1,
  0x8F1BBCDC, 0xCA62C1D6
];

function SHA1() {
  if (!(this instanceof SHA1))
    return new SHA1();

  BlockHash.call(this);
  this.h = [
    0x67452301, 0xefcdab89, 0x98badcfe,
    0x10325476, 0xc3d2e1f0 ];
  this.W = new Array(80);
}

utils.inherits(SHA1, BlockHash);
module.exports = SHA1;

SHA1.blockSize = 512;
SHA1.outSize = 160;
SHA1.hmacStrength = 80;
SHA1.padLength = 64;

SHA1.prototype._update = function _update(msg, start) {
  var W = this.W;

  for (var i = 0; i < 16; i++)
    W[i] = msg[start + i];

  for(; i < W.length; i++)
    W[i] = rotl32(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

  var a = this.h[0];
  var b = this.h[1];
  var c = this.h[2];
  var d = this.h[3];
  var e = this.h[4];

  for (i = 0; i < W.length; i++) {
    var s = ~~(i / 20);
    var t = sum32_5(rotl32(a, 5), ft_1(s, b, c, d), e, W[i], sha1_K[s]);
    e = d;
    d = c;
    c = rotl32(b, 30);
    b = a;
    a = t;
  }

  this.h[0] = sum32(this.h[0], a);
  this.h[1] = sum32(this.h[1], b);
  this.h[2] = sum32(this.h[2], c);
  this.h[3] = sum32(this.h[3], d);
  this.h[4] = sum32(this.h[4], e);
};

SHA1.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};

},{"../common":24,"../utils":34,"./common":33}],29:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var SHA256 = require('./256');

function SHA224() {
  if (!(this instanceof SHA224))
    return new SHA224();

  SHA256.call(this);
  this.h = [
    0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
    0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4 ];
}
utils.inherits(SHA224, SHA256);
module.exports = SHA224;

SHA224.blockSize = 512;
SHA224.outSize = 224;
SHA224.hmacStrength = 192;
SHA224.padLength = 64;

SHA224.prototype._digest = function digest(enc) {
  // Just truncate output
  if (enc === 'hex')
    return utils.toHex32(this.h.slice(0, 7), 'big');
  else
    return utils.split32(this.h.slice(0, 7), 'big');
};


},{"../utils":34,"./256":30}],30:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var common = require('../common');
var shaCommon = require('./common');
var assert = require('minimalistic-assert');

var sum32 = utils.sum32;
var sum32_4 = utils.sum32_4;
var sum32_5 = utils.sum32_5;
var ch32 = shaCommon.ch32;
var maj32 = shaCommon.maj32;
var s0_256 = shaCommon.s0_256;
var s1_256 = shaCommon.s1_256;
var g0_256 = shaCommon.g0_256;
var g1_256 = shaCommon.g1_256;

var BlockHash = common.BlockHash;

var sha256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function SHA256() {
  if (!(this instanceof SHA256))
    return new SHA256();

  BlockHash.call(this);
  this.h = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];
  this.k = sha256_K;
  this.W = new Array(64);
}
utils.inherits(SHA256, BlockHash);
module.exports = SHA256;

SHA256.blockSize = 512;
SHA256.outSize = 256;
SHA256.hmacStrength = 192;
SHA256.padLength = 64;

SHA256.prototype._update = function _update(msg, start) {
  var W = this.W;

  for (var i = 0; i < 16; i++)
    W[i] = msg[start + i];
  for (; i < W.length; i++)
    W[i] = sum32_4(g1_256(W[i - 2]), W[i - 7], g0_256(W[i - 15]), W[i - 16]);

  var a = this.h[0];
  var b = this.h[1];
  var c = this.h[2];
  var d = this.h[3];
  var e = this.h[4];
  var f = this.h[5];
  var g = this.h[6];
  var h = this.h[7];

  assert(this.k.length === W.length);
  for (i = 0; i < W.length; i++) {
    var T1 = sum32_5(h, s1_256(e), ch32(e, f, g), this.k[i], W[i]);
    var T2 = sum32(s0_256(a), maj32(a, b, c));
    h = g;
    g = f;
    f = e;
    e = sum32(d, T1);
    d = c;
    c = b;
    b = a;
    a = sum32(T1, T2);
  }

  this.h[0] = sum32(this.h[0], a);
  this.h[1] = sum32(this.h[1], b);
  this.h[2] = sum32(this.h[2], c);
  this.h[3] = sum32(this.h[3], d);
  this.h[4] = sum32(this.h[4], e);
  this.h[5] = sum32(this.h[5], f);
  this.h[6] = sum32(this.h[6], g);
  this.h[7] = sum32(this.h[7], h);
};

SHA256.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};

},{"../common":24,"../utils":34,"./common":33,"minimalistic-assert":38}],31:[function(require,module,exports){
'use strict';

var utils = require('../utils');

var SHA512 = require('./512');

function SHA384() {
  if (!(this instanceof SHA384))
    return new SHA384();

  SHA512.call(this);
  this.h = [
    0xcbbb9d5d, 0xc1059ed8,
    0x629a292a, 0x367cd507,
    0x9159015a, 0x3070dd17,
    0x152fecd8, 0xf70e5939,
    0x67332667, 0xffc00b31,
    0x8eb44a87, 0x68581511,
    0xdb0c2e0d, 0x64f98fa7,
    0x47b5481d, 0xbefa4fa4 ];
}
utils.inherits(SHA384, SHA512);
module.exports = SHA384;

SHA384.blockSize = 1024;
SHA384.outSize = 384;
SHA384.hmacStrength = 192;
SHA384.padLength = 128;

SHA384.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h.slice(0, 12), 'big');
  else
    return utils.split32(this.h.slice(0, 12), 'big');
};

},{"../utils":34,"./512":32}],32:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var common = require('../common');
var assert = require('minimalistic-assert');

var rotr64_hi = utils.rotr64_hi;
var rotr64_lo = utils.rotr64_lo;
var shr64_hi = utils.shr64_hi;
var shr64_lo = utils.shr64_lo;
var sum64 = utils.sum64;
var sum64_hi = utils.sum64_hi;
var sum64_lo = utils.sum64_lo;
var sum64_4_hi = utils.sum64_4_hi;
var sum64_4_lo = utils.sum64_4_lo;
var sum64_5_hi = utils.sum64_5_hi;
var sum64_5_lo = utils.sum64_5_lo;

var BlockHash = common.BlockHash;

var sha512_K = [
  0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd,
  0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
  0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019,
  0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
  0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe,
  0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
  0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1,
  0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
  0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3,
  0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
  0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483,
  0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
  0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210,
  0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
  0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725,
  0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
  0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926,
  0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
  0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8,
  0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
  0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001,
  0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
  0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910,
  0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
  0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53,
  0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
  0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb,
  0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
  0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60,
  0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
  0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9,
  0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
  0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207,
  0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
  0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6,
  0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
  0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493,
  0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
  0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a,
  0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817
];

function SHA512() {
  if (!(this instanceof SHA512))
    return new SHA512();

  BlockHash.call(this);
  this.h = [
    0x6a09e667, 0xf3bcc908,
    0xbb67ae85, 0x84caa73b,
    0x3c6ef372, 0xfe94f82b,
    0xa54ff53a, 0x5f1d36f1,
    0x510e527f, 0xade682d1,
    0x9b05688c, 0x2b3e6c1f,
    0x1f83d9ab, 0xfb41bd6b,
    0x5be0cd19, 0x137e2179 ];
  this.k = sha512_K;
  this.W = new Array(160);
}
utils.inherits(SHA512, BlockHash);
module.exports = SHA512;

SHA512.blockSize = 1024;
SHA512.outSize = 512;
SHA512.hmacStrength = 192;
SHA512.padLength = 128;

SHA512.prototype._prepareBlock = function _prepareBlock(msg, start) {
  var W = this.W;

  // 32 x 32bit words
  for (var i = 0; i < 32; i++)
    W[i] = msg[start + i];
  for (; i < W.length; i += 2) {
    var c0_hi = g1_512_hi(W[i - 4], W[i - 3]);  // i - 2
    var c0_lo = g1_512_lo(W[i - 4], W[i - 3]);
    var c1_hi = W[i - 14];  // i - 7
    var c1_lo = W[i - 13];
    var c2_hi = g0_512_hi(W[i - 30], W[i - 29]);  // i - 15
    var c2_lo = g0_512_lo(W[i - 30], W[i - 29]);
    var c3_hi = W[i - 32];  // i - 16
    var c3_lo = W[i - 31];

    W[i] = sum64_4_hi(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo);
    W[i + 1] = sum64_4_lo(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo);
  }
};

SHA512.prototype._update = function _update(msg, start) {
  this._prepareBlock(msg, start);

  var W = this.W;

  var ah = this.h[0];
  var al = this.h[1];
  var bh = this.h[2];
  var bl = this.h[3];
  var ch = this.h[4];
  var cl = this.h[5];
  var dh = this.h[6];
  var dl = this.h[7];
  var eh = this.h[8];
  var el = this.h[9];
  var fh = this.h[10];
  var fl = this.h[11];
  var gh = this.h[12];
  var gl = this.h[13];
  var hh = this.h[14];
  var hl = this.h[15];

  assert(this.k.length === W.length);
  for (var i = 0; i < W.length; i += 2) {
    var c0_hi = hh;
    var c0_lo = hl;
    var c1_hi = s1_512_hi(eh, el);
    var c1_lo = s1_512_lo(eh, el);
    var c2_hi = ch64_hi(eh, el, fh, fl, gh, gl);
    var c2_lo = ch64_lo(eh, el, fh, fl, gh, gl);
    var c3_hi = this.k[i];
    var c3_lo = this.k[i + 1];
    var c4_hi = W[i];
    var c4_lo = W[i + 1];

    var T1_hi = sum64_5_hi(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo,
      c4_hi, c4_lo);
    var T1_lo = sum64_5_lo(
      c0_hi, c0_lo,
      c1_hi, c1_lo,
      c2_hi, c2_lo,
      c3_hi, c3_lo,
      c4_hi, c4_lo);

    c0_hi = s0_512_hi(ah, al);
    c0_lo = s0_512_lo(ah, al);
    c1_hi = maj64_hi(ah, al, bh, bl, ch, cl);
    c1_lo = maj64_lo(ah, al, bh, bl, ch, cl);

    var T2_hi = sum64_hi(c0_hi, c0_lo, c1_hi, c1_lo);
    var T2_lo = sum64_lo(c0_hi, c0_lo, c1_hi, c1_lo);

    hh = gh;
    hl = gl;

    gh = fh;
    gl = fl;

    fh = eh;
    fl = el;

    eh = sum64_hi(dh, dl, T1_hi, T1_lo);
    el = sum64_lo(dl, dl, T1_hi, T1_lo);

    dh = ch;
    dl = cl;

    ch = bh;
    cl = bl;

    bh = ah;
    bl = al;

    ah = sum64_hi(T1_hi, T1_lo, T2_hi, T2_lo);
    al = sum64_lo(T1_hi, T1_lo, T2_hi, T2_lo);
  }

  sum64(this.h, 0, ah, al);
  sum64(this.h, 2, bh, bl);
  sum64(this.h, 4, ch, cl);
  sum64(this.h, 6, dh, dl);
  sum64(this.h, 8, eh, el);
  sum64(this.h, 10, fh, fl);
  sum64(this.h, 12, gh, gl);
  sum64(this.h, 14, hh, hl);
};

SHA512.prototype._digest = function digest(enc) {
  if (enc === 'hex')
    return utils.toHex32(this.h, 'big');
  else
    return utils.split32(this.h, 'big');
};

function ch64_hi(xh, xl, yh, yl, zh) {
  var r = (xh & yh) ^ ((~xh) & zh);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function ch64_lo(xh, xl, yh, yl, zh, zl) {
  var r = (xl & yl) ^ ((~xl) & zl);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function maj64_hi(xh, xl, yh, yl, zh) {
  var r = (xh & yh) ^ (xh & zh) ^ (yh & zh);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function maj64_lo(xh, xl, yh, yl, zh, zl) {
  var r = (xl & yl) ^ (xl & zl) ^ (yl & zl);
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s0_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 28);
  var c1_hi = rotr64_hi(xl, xh, 2);  // 34
  var c2_hi = rotr64_hi(xl, xh, 7);  // 39

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s0_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 28);
  var c1_lo = rotr64_lo(xl, xh, 2);  // 34
  var c2_lo = rotr64_lo(xl, xh, 7);  // 39

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s1_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 14);
  var c1_hi = rotr64_hi(xh, xl, 18);
  var c2_hi = rotr64_hi(xl, xh, 9);  // 41

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function s1_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 14);
  var c1_lo = rotr64_lo(xh, xl, 18);
  var c2_lo = rotr64_lo(xl, xh, 9);  // 41

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g0_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 1);
  var c1_hi = rotr64_hi(xh, xl, 8);
  var c2_hi = shr64_hi(xh, xl, 7);

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g0_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 1);
  var c1_lo = rotr64_lo(xh, xl, 8);
  var c2_lo = shr64_lo(xh, xl, 7);

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g1_512_hi(xh, xl) {
  var c0_hi = rotr64_hi(xh, xl, 19);
  var c1_hi = rotr64_hi(xl, xh, 29);  // 61
  var c2_hi = shr64_hi(xh, xl, 6);

  var r = c0_hi ^ c1_hi ^ c2_hi;
  if (r < 0)
    r += 0x100000000;
  return r;
}

function g1_512_lo(xh, xl) {
  var c0_lo = rotr64_lo(xh, xl, 19);
  var c1_lo = rotr64_lo(xl, xh, 29);  // 61
  var c2_lo = shr64_lo(xh, xl, 6);

  var r = c0_lo ^ c1_lo ^ c2_lo;
  if (r < 0)
    r += 0x100000000;
  return r;
}

},{"../common":24,"../utils":34,"minimalistic-assert":38}],33:[function(require,module,exports){
'use strict';

var utils = require('../utils');
var rotr32 = utils.rotr32;

function ft_1(s, x, y, z) {
  if (s === 0)
    return ch32(x, y, z);
  if (s === 1 || s === 3)
    return p32(x, y, z);
  if (s === 2)
    return maj32(x, y, z);
}
exports.ft_1 = ft_1;

function ch32(x, y, z) {
  return (x & y) ^ ((~x) & z);
}
exports.ch32 = ch32;

function maj32(x, y, z) {
  return (x & y) ^ (x & z) ^ (y & z);
}
exports.maj32 = maj32;

function p32(x, y, z) {
  return x ^ y ^ z;
}
exports.p32 = p32;

function s0_256(x) {
  return rotr32(x, 2) ^ rotr32(x, 13) ^ rotr32(x, 22);
}
exports.s0_256 = s0_256;

function s1_256(x) {
  return rotr32(x, 6) ^ rotr32(x, 11) ^ rotr32(x, 25);
}
exports.s1_256 = s1_256;

function g0_256(x) {
  return rotr32(x, 7) ^ rotr32(x, 18) ^ (x >>> 3);
}
exports.g0_256 = g0_256;

function g1_256(x) {
  return rotr32(x, 17) ^ rotr32(x, 19) ^ (x >>> 10);
}
exports.g1_256 = g1_256;

},{"../utils":34}],34:[function(require,module,exports){
'use strict';

var assert = require('minimalistic-assert');
var inherits = require('inherits');

exports.inherits = inherits;

function isSurrogatePair(msg, i) {
  if ((msg.charCodeAt(i) & 0xFC00) !== 0xD800) {
    return false;
  }
  if (i < 0 || i + 1 >= msg.length) {
    return false;
  }
  return (msg.charCodeAt(i + 1) & 0xFC00) === 0xDC00;
}

function toArray(msg, enc) {
  if (Array.isArray(msg))
    return msg.slice();
  if (!msg)
    return [];
  var res = [];
  if (typeof msg === 'string') {
    if (!enc) {
      // Inspired by stringToUtf8ByteArray() in closure-library by Google
      // https://github.com/google/closure-library/blob/8598d87242af59aac233270742c8984e2b2bdbe0/closure/goog/crypt/crypt.js#L117-L143
      // Apache License 2.0
      // https://github.com/google/closure-library/blob/master/LICENSE
      var p = 0;
      for (var i = 0; i < msg.length; i++) {
        var c = msg.charCodeAt(i);
        if (c < 128) {
          res[p++] = c;
        } else if (c < 2048) {
          res[p++] = (c >> 6) | 192;
          res[p++] = (c & 63) | 128;
        } else if (isSurrogatePair(msg, i)) {
          c = 0x10000 + ((c & 0x03FF) << 10) + (msg.charCodeAt(++i) & 0x03FF);
          res[p++] = (c >> 18) | 240;
          res[p++] = ((c >> 12) & 63) | 128;
          res[p++] = ((c >> 6) & 63) | 128;
          res[p++] = (c & 63) | 128;
        } else {
          res[p++] = (c >> 12) | 224;
          res[p++] = ((c >> 6) & 63) | 128;
          res[p++] = (c & 63) | 128;
        }
      }
    } else if (enc === 'hex') {
      msg = msg.replace(/[^a-z0-9]+/ig, '');
      if (msg.length % 2 !== 0)
        msg = '0' + msg;
      for (i = 0; i < msg.length; i += 2)
        res.push(parseInt(msg[i] + msg[i + 1], 16));
    }
  } else {
    for (i = 0; i < msg.length; i++)
      res[i] = msg[i] | 0;
  }
  return res;
}
exports.toArray = toArray;

function toHex(msg) {
  var res = '';
  for (var i = 0; i < msg.length; i++)
    res += zero2(msg[i].toString(16));
  return res;
}
exports.toHex = toHex;

function htonl(w) {
  var res = (w >>> 24) |
            ((w >>> 8) & 0xff00) |
            ((w << 8) & 0xff0000) |
            ((w & 0xff) << 24);
  return res >>> 0;
}
exports.htonl = htonl;

function toHex32(msg, endian) {
  var res = '';
  for (var i = 0; i < msg.length; i++) {
    var w = msg[i];
    if (endian === 'little')
      w = htonl(w);
    res += zero8(w.toString(16));
  }
  return res;
}
exports.toHex32 = toHex32;

function zero2(word) {
  if (word.length === 1)
    return '0' + word;
  else
    return word;
}
exports.zero2 = zero2;

function zero8(word) {
  if (word.length === 7)
    return '0' + word;
  else if (word.length === 6)
    return '00' + word;
  else if (word.length === 5)
    return '000' + word;
  else if (word.length === 4)
    return '0000' + word;
  else if (word.length === 3)
    return '00000' + word;
  else if (word.length === 2)
    return '000000' + word;
  else if (word.length === 1)
    return '0000000' + word;
  else
    return word;
}
exports.zero8 = zero8;

function join32(msg, start, end, endian) {
  var len = end - start;
  assert(len % 4 === 0);
  var res = new Array(len / 4);
  for (var i = 0, k = start; i < res.length; i++, k += 4) {
    var w;
    if (endian === 'big')
      w = (msg[k] << 24) | (msg[k + 1] << 16) | (msg[k + 2] << 8) | msg[k + 3];
    else
      w = (msg[k + 3] << 24) | (msg[k + 2] << 16) | (msg[k + 1] << 8) | msg[k];
    res[i] = w >>> 0;
  }
  return res;
}
exports.join32 = join32;

function split32(msg, endian) {
  var res = new Array(msg.length * 4);
  for (var i = 0, k = 0; i < msg.length; i++, k += 4) {
    var m = msg[i];
    if (endian === 'big') {
      res[k] = m >>> 24;
      res[k + 1] = (m >>> 16) & 0xff;
      res[k + 2] = (m >>> 8) & 0xff;
      res[k + 3] = m & 0xff;
    } else {
      res[k + 3] = m >>> 24;
      res[k + 2] = (m >>> 16) & 0xff;
      res[k + 1] = (m >>> 8) & 0xff;
      res[k] = m & 0xff;
    }
  }
  return res;
}
exports.split32 = split32;

function rotr32(w, b) {
  return (w >>> b) | (w << (32 - b));
}
exports.rotr32 = rotr32;

function rotl32(w, b) {
  return (w << b) | (w >>> (32 - b));
}
exports.rotl32 = rotl32;

function sum32(a, b) {
  return (a + b) >>> 0;
}
exports.sum32 = sum32;

function sum32_3(a, b, c) {
  return (a + b + c) >>> 0;
}
exports.sum32_3 = sum32_3;

function sum32_4(a, b, c, d) {
  return (a + b + c + d) >>> 0;
}
exports.sum32_4 = sum32_4;

function sum32_5(a, b, c, d, e) {
  return (a + b + c + d + e) >>> 0;
}
exports.sum32_5 = sum32_5;

function sum64(buf, pos, ah, al) {
  var bh = buf[pos];
  var bl = buf[pos + 1];

  var lo = (al + bl) >>> 0;
  var hi = (lo < al ? 1 : 0) + ah + bh;
  buf[pos] = hi >>> 0;
  buf[pos + 1] = lo;
}
exports.sum64 = sum64;

function sum64_hi(ah, al, bh, bl) {
  var lo = (al + bl) >>> 0;
  var hi = (lo < al ? 1 : 0) + ah + bh;
  return hi >>> 0;
}
exports.sum64_hi = sum64_hi;

function sum64_lo(ah, al, bh, bl) {
  var lo = al + bl;
  return lo >>> 0;
}
exports.sum64_lo = sum64_lo;

function sum64_4_hi(ah, al, bh, bl, ch, cl, dh, dl) {
  var carry = 0;
  var lo = al;
  lo = (lo + bl) >>> 0;
  carry += lo < al ? 1 : 0;
  lo = (lo + cl) >>> 0;
  carry += lo < cl ? 1 : 0;
  lo = (lo + dl) >>> 0;
  carry += lo < dl ? 1 : 0;

  var hi = ah + bh + ch + dh + carry;
  return hi >>> 0;
}
exports.sum64_4_hi = sum64_4_hi;

function sum64_4_lo(ah, al, bh, bl, ch, cl, dh, dl) {
  var lo = al + bl + cl + dl;
  return lo >>> 0;
}
exports.sum64_4_lo = sum64_4_lo;

function sum64_5_hi(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
  var carry = 0;
  var lo = al;
  lo = (lo + bl) >>> 0;
  carry += lo < al ? 1 : 0;
  lo = (lo + cl) >>> 0;
  carry += lo < cl ? 1 : 0;
  lo = (lo + dl) >>> 0;
  carry += lo < dl ? 1 : 0;
  lo = (lo + el) >>> 0;
  carry += lo < el ? 1 : 0;

  var hi = ah + bh + ch + dh + eh + carry;
  return hi >>> 0;
}
exports.sum64_5_hi = sum64_5_hi;

function sum64_5_lo(ah, al, bh, bl, ch, cl, dh, dl, eh, el) {
  var lo = al + bl + cl + dl + el;

  return lo >>> 0;
}
exports.sum64_5_lo = sum64_5_lo;

function rotr64_hi(ah, al, num) {
  var r = (al << (32 - num)) | (ah >>> num);
  return r >>> 0;
}
exports.rotr64_hi = rotr64_hi;

function rotr64_lo(ah, al, num) {
  var r = (ah << (32 - num)) | (al >>> num);
  return r >>> 0;
}
exports.rotr64_lo = rotr64_lo;

function shr64_hi(ah, al, num) {
  return ah >>> num;
}
exports.shr64_hi = shr64_hi;

function shr64_lo(ah, al, num) {
  var r = (ah << (32 - num)) | (al >>> num);
  return r >>> 0;
}
exports.shr64_lo = shr64_lo;

},{"inherits":36,"minimalistic-assert":38}],35:[function(require,module,exports){
'use strict';

var hash = require('hash.js');
var utils = require('minimalistic-crypto-utils');
var assert = require('minimalistic-assert');

function HmacDRBG(options) {
  if (!(this instanceof HmacDRBG))
    return new HmacDRBG(options);
  this.hash = options.hash;
  this.predResist = !!options.predResist;

  this.outLen = this.hash.outSize;
  this.minEntropy = options.minEntropy || this.hash.hmacStrength;

  this._reseed = null;
  this.reseedInterval = null;
  this.K = null;
  this.V = null;

  var entropy = utils.toArray(options.entropy, options.entropyEnc || 'hex');
  var nonce = utils.toArray(options.nonce, options.nonceEnc || 'hex');
  var pers = utils.toArray(options.pers, options.persEnc || 'hex');
  assert(entropy.length >= (this.minEntropy / 8),
         'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');
  this._init(entropy, nonce, pers);
}
module.exports = HmacDRBG;

HmacDRBG.prototype._init = function init(entropy, nonce, pers) {
  var seed = entropy.concat(nonce).concat(pers);

  this.K = new Array(this.outLen / 8);
  this.V = new Array(this.outLen / 8);
  for (var i = 0; i < this.V.length; i++) {
    this.K[i] = 0x00;
    this.V[i] = 0x01;
  }

  this._update(seed);
  this._reseed = 1;
  this.reseedInterval = 0x1000000000000;  // 2^48
};

HmacDRBG.prototype._hmac = function hmac() {
  return new hash.hmac(this.hash, this.K);
};

HmacDRBG.prototype._update = function update(seed) {
  var kmac = this._hmac()
                 .update(this.V)
                 .update([ 0x00 ]);
  if (seed)
    kmac = kmac.update(seed);
  this.K = kmac.digest();
  this.V = this._hmac().update(this.V).digest();
  if (!seed)
    return;

  this.K = this._hmac()
               .update(this.V)
               .update([ 0x01 ])
               .update(seed)
               .digest();
  this.V = this._hmac().update(this.V).digest();
};

HmacDRBG.prototype.reseed = function reseed(entropy, entropyEnc, add, addEnc) {
  // Optional entropy enc
  if (typeof entropyEnc !== 'string') {
    addEnc = add;
    add = entropyEnc;
    entropyEnc = null;
  }

  entropy = utils.toArray(entropy, entropyEnc);
  add = utils.toArray(add, addEnc);

  assert(entropy.length >= (this.minEntropy / 8),
         'Not enough entropy. Minimum is: ' + this.minEntropy + ' bits');

  this._update(entropy.concat(add || []));
  this._reseed = 1;
};

HmacDRBG.prototype.generate = function generate(len, enc, add, addEnc) {
  if (this._reseed > this.reseedInterval)
    throw new Error('Reseed is required');

  // Optional encoding
  if (typeof enc !== 'string') {
    addEnc = add;
    add = enc;
    enc = null;
  }

  // Optional additional data
  if (add) {
    add = utils.toArray(add, addEnc || 'hex');
    this._update(add);
  }

  var temp = [];
  while (temp.length < len) {
    this.V = this._hmac().update(this.V).digest();
    temp = temp.concat(this.V);
  }

  var res = temp.slice(0, len);
  this._update(add);
  this._reseed++;
  return utils.encode(res, enc);
};

},{"hash.js":23,"minimalistic-assert":38,"minimalistic-crypto-utils":39}],36:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],37:[function(require,module,exports){
(function (Buffer){(function (){

var navigator = {};
navigator.userAgent = false;

var window = {};
/*
 * jsrsasign(all) 10.6.0 (2022-11-04) (c) 2010-2022 Kenji Urushima | kjur.github.io/jsrsasign/license
 */

/*! CryptoJS v3.1.2 core-fix.js
 * code.google.com/p/crypto-js
 * (c) 2009-2013 by Jeff Mott. All rights reserved.
 * code.google.com/p/crypto-js/wiki/License
 * THIS IS FIX of 'core.js' to fix Hmac issue.
 * https://code.google.com/p/crypto-js/issues/detail?id=84
 * https://crypto-js.googlecode.com/svn-history/r667/branches/3.x/src/core.js
 */
var CryptoJS=CryptoJS||(function(e,g){var a={};var b=a.lib={};var j=b.Base=(function(){function n(){}return{extend:function(p){n.prototype=this;var o=new n();if(p){o.mixIn(p)}if(!o.hasOwnProperty("init")){o.init=function(){o.$super.init.apply(this,arguments)}}o.init.prototype=o;o.$super=this;return o},create:function(){var o=this.extend();o.init.apply(o,arguments);return o},init:function(){},mixIn:function(p){for(var o in p){if(p.hasOwnProperty(o)){this[o]=p[o]}}if(p.hasOwnProperty("toString")){this.toString=p.toString}},clone:function(){return this.init.prototype.extend(this)}}}());var l=b.WordArray=j.extend({init:function(o,n){o=this.words=o||[];if(n!=g){this.sigBytes=n}else{this.sigBytes=o.length*4}},toString:function(n){return(n||h).stringify(this)},concat:function(t){var q=this.words;var p=t.words;var n=this.sigBytes;var s=t.sigBytes;this.clamp();if(n%4){for(var r=0;r<s;r++){var o=(p[r>>>2]>>>(24-(r%4)*8))&255;q[(n+r)>>>2]|=o<<(24-((n+r)%4)*8)}}else{for(var r=0;r<s;r+=4){q[(n+r)>>>2]=p[r>>>2]}}this.sigBytes+=s;return this},clamp:function(){var o=this.words;var n=this.sigBytes;o[n>>>2]&=4294967295<<(32-(n%4)*8);o.length=e.ceil(n/4)},clone:function(){var n=j.clone.call(this);n.words=this.words.slice(0);return n},random:function(p){var o=[];for(var n=0;n<p;n+=4){o.push((e.random()*4294967296)|0)}return new l.init(o,p)}});var m=a.enc={};var h=m.Hex={stringify:function(p){var r=p.words;var o=p.sigBytes;var q=[];for(var n=0;n<o;n++){var s=(r[n>>>2]>>>(24-(n%4)*8))&255;q.push((s>>>4).toString(16));q.push((s&15).toString(16))}return q.join("")},parse:function(p){var n=p.length;var q=[];for(var o=0;o<n;o+=2){q[o>>>3]|=parseInt(p.substr(o,2),16)<<(24-(o%8)*4)}return new l.init(q,n/2)}};var d=m.Latin1={stringify:function(q){var r=q.words;var p=q.sigBytes;var n=[];for(var o=0;o<p;o++){var s=(r[o>>>2]>>>(24-(o%4)*8))&255;n.push(String.fromCharCode(s))}return n.join("")},parse:function(p){var n=p.length;var q=[];for(var o=0;o<n;o++){q[o>>>2]|=(p.charCodeAt(o)&255)<<(24-(o%4)*8)}return new l.init(q,n)}};var c=m.Utf8={stringify:function(n){try{return decodeURIComponent(escape(d.stringify(n)))}catch(o){throw new Error("Malformed UTF-8 data")}},parse:function(n){return d.parse(unescape(encodeURIComponent(n)))}};var i=b.BufferedBlockAlgorithm=j.extend({reset:function(){this._data=new l.init();this._nDataBytes=0},_append:function(n){if(typeof n=="string"){n=c.parse(n)}this._data.concat(n);this._nDataBytes+=n.sigBytes},_process:function(w){var q=this._data;var x=q.words;var n=q.sigBytes;var t=this.blockSize;var v=t*4;var u=n/v;if(w){u=e.ceil(u)}else{u=e.max((u|0)-this._minBufferSize,0)}var s=u*t;var r=e.min(s*4,n);if(s){for(var p=0;p<s;p+=t){this._doProcessBlock(x,p)}var o=x.splice(0,s);q.sigBytes-=r}return new l.init(o,r)},clone:function(){var n=j.clone.call(this);n._data=this._data.clone();return n},_minBufferSize:0});var f=b.Hasher=i.extend({cfg:j.extend(),init:function(n){this.cfg=this.cfg.extend(n);this.reset()},reset:function(){i.reset.call(this);this._doReset()},update:function(n){this._append(n);this._process();return this},finalize:function(n){if(n){this._append(n)}var o=this._doFinalize();return o},blockSize:512/32,_createHelper:function(n){return function(p,o){return new n.init(o).finalize(p)}},_createHmacHelper:function(n){return function(p,o){return new k.HMAC.init(n,o).finalize(p)}}});var k=a.algo={};return a}(Math));
/*
CryptoJS v3.1.2 x64-core-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(g){var a=CryptoJS,f=a.lib,e=f.Base,h=f.WordArray,a=a.x64={};a.Word=e.extend({init:function(b,c){this.high=b;this.low=c}});a.WordArray=e.extend({init:function(b,c){b=this.words=b||[];this.sigBytes=c!=g?c:8*b.length},toX32:function(){for(var b=this.words,c=b.length,a=[],d=0;d<c;d++){var e=b[d];a.push(e.high);a.push(e.low)}return h.create(a,this.sigBytes)},clone:function(){for(var b=e.clone.call(this),c=b.words=this.words.slice(0),a=c.length,d=0;d<a;d++)c[d]=c[d].clone();return b}})})();

/*
CryptoJS v3.1.2 cipher-core.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
CryptoJS.lib.Cipher||function(u){var g=CryptoJS,f=g.lib,k=f.Base,l=f.WordArray,q=f.BufferedBlockAlgorithm,r=g.enc.Base64,v=g.algo.EvpKDF,n=f.Cipher=q.extend({cfg:k.extend(),createEncryptor:function(a,b){return this.create(this._ENC_XFORM_MODE,a,b)},createDecryptor:function(a,b){return this.create(this._DEC_XFORM_MODE,a,b)},init:function(a,b,c){this.cfg=this.cfg.extend(c);this._xformMode=a;this._key=b;this.reset()},reset:function(){q.reset.call(this);this._doReset()},process:function(a){this._append(a);
return this._process()},finalize:function(a){a&&this._append(a);return this._doFinalize()},keySize:4,ivSize:4,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:function(a){return{encrypt:function(b,c,d){return("string"==typeof c?s:j).encrypt(a,b,c,d)},decrypt:function(b,c,d){return("string"==typeof c?s:j).decrypt(a,b,c,d)}}}});f.StreamCipher=n.extend({_doFinalize:function(){return this._process(!0)},blockSize:1});var m=g.mode={},t=function(a,b,c){var d=this._iv;d?this._iv=u:d=this._prevBlock;for(var e=
0;e<c;e++)a[b+e]^=d[e]},h=(f.BlockCipherMode=k.extend({createEncryptor:function(a,b){return this.Encryptor.create(a,b)},createDecryptor:function(a,b){return this.Decryptor.create(a,b)},init:function(a,b){this._cipher=a;this._iv=b}})).extend();h.Encryptor=h.extend({processBlock:function(a,b){var c=this._cipher,d=c.blockSize;t.call(this,a,b,d);c.encryptBlock(a,b);this._prevBlock=a.slice(b,b+d)}});h.Decryptor=h.extend({processBlock:function(a,b){var c=this._cipher,d=c.blockSize,e=a.slice(b,b+d);c.decryptBlock(a,
b);t.call(this,a,b,d);this._prevBlock=e}});m=m.CBC=h;h=(g.pad={}).Pkcs7={pad:function(a,b){for(var c=4*b,c=c-a.sigBytes%c,d=c<<24|c<<16|c<<8|c,e=[],f=0;f<c;f+=4)e.push(d);c=l.create(e,c);a.concat(c)},unpad:function(a){a.sigBytes-=a.words[a.sigBytes-1>>>2]&255}};f.BlockCipher=n.extend({cfg:n.cfg.extend({mode:m,padding:h}),reset:function(){n.reset.call(this);var a=this.cfg,b=a.iv,a=a.mode;if(this._xformMode==this._ENC_XFORM_MODE)var c=a.createEncryptor;else c=a.createDecryptor,this._minBufferSize=1;
this._mode=c.call(a,this,b&&b.words)},_doProcessBlock:function(a,b){this._mode.processBlock(a,b)},_doFinalize:function(){var a=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){a.pad(this._data,this.blockSize);var b=this._process(!0)}else b=this._process(!0),a.unpad(b);return b},blockSize:4});var p=f.CipherParams=k.extend({init:function(a){this.mixIn(a)},toString:function(a){return(a||this.formatter).stringify(this)}}),m=(g.format={}).OpenSSL={stringify:function(a){var b=a.ciphertext;a=a.salt;
return(a?l.create([1398893684,1701076831]).concat(a).concat(b):b).toString(r)},parse:function(a){a=r.parse(a);var b=a.words;if(1398893684==b[0]&&1701076831==b[1]){var c=l.create(b.slice(2,4));b.splice(0,4);a.sigBytes-=16}return p.create({ciphertext:a,salt:c})}},j=f.SerializableCipher=k.extend({cfg:k.extend({format:m}),encrypt:function(a,b,c,d){d=this.cfg.extend(d);var e=a.createEncryptor(c,d);b=e.finalize(b);e=e.cfg;return p.create({ciphertext:b,key:c,iv:e.iv,algorithm:a,mode:e.mode,padding:e.padding,
blockSize:a.blockSize,formatter:d.format})},decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);return a.createDecryptor(c,d).finalize(b.ciphertext)},_parse:function(a,b){return"string"==typeof a?b.parse(a,this):a}}),g=(g.kdf={}).OpenSSL={execute:function(a,b,c,d){d||(d=l.random(8));a=v.create({keySize:b+c}).compute(a,d);c=l.create(a.words.slice(b),4*c);a.sigBytes=4*b;return p.create({key:a,iv:c,salt:d})}},s=f.PasswordBasedCipher=j.extend({cfg:j.cfg.extend({kdf:g}),encrypt:function(a,
b,c,d){d=this.cfg.extend(d);c=d.kdf.execute(c,a.keySize,a.ivSize);d.iv=c.iv;a=j.encrypt.call(this,a,b,c.key,d);a.mixIn(c);return a},decrypt:function(a,b,c,d){d=this.cfg.extend(d);b=this._parse(b,d.format);c=d.kdf.execute(c,a.keySize,a.ivSize,b.salt);d.iv=c.iv;return j.decrypt.call(this,a,b,c.key,d)}})}();

/*
CryptoJS v3.1.2 aes.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){for(var q=CryptoJS,x=q.lib.BlockCipher,r=q.algo,j=[],y=[],z=[],A=[],B=[],C=[],s=[],u=[],v=[],w=[],g=[],k=0;256>k;k++)g[k]=128>k?k<<1:k<<1^283;for(var n=0,l=0,k=0;256>k;k++){var f=l^l<<1^l<<2^l<<3^l<<4,f=f>>>8^f&255^99;j[n]=f;y[f]=n;var t=g[n],D=g[t],E=g[D],b=257*g[f]^16843008*f;z[n]=b<<24|b>>>8;A[n]=b<<16|b>>>16;B[n]=b<<8|b>>>24;C[n]=b;b=16843009*E^65537*D^257*t^16843008*n;s[f]=b<<24|b>>>8;u[f]=b<<16|b>>>16;v[f]=b<<8|b>>>24;w[f]=b;n?(n=t^g[g[g[E^t]]],l^=g[g[l]]):n=l=1}var F=[0,1,2,4,8,
16,32,64,128,27,54],r=r.AES=x.extend({_doReset:function(){for(var c=this._key,e=c.words,a=c.sigBytes/4,c=4*((this._nRounds=a+6)+1),b=this._keySchedule=[],h=0;h<c;h++)if(h<a)b[h]=e[h];else{var d=b[h-1];h%a?6<a&&4==h%a&&(d=j[d>>>24]<<24|j[d>>>16&255]<<16|j[d>>>8&255]<<8|j[d&255]):(d=d<<8|d>>>24,d=j[d>>>24]<<24|j[d>>>16&255]<<16|j[d>>>8&255]<<8|j[d&255],d^=F[h/a|0]<<24);b[h]=b[h-a]^d}e=this._invKeySchedule=[];for(a=0;a<c;a++)h=c-a,d=a%4?b[h]:b[h-4],e[a]=4>a||4>=h?d:s[j[d>>>24]]^u[j[d>>>16&255]]^v[j[d>>>
8&255]]^w[j[d&255]]},encryptBlock:function(c,e){this._doCryptBlock(c,e,this._keySchedule,z,A,B,C,j)},decryptBlock:function(c,e){var a=c[e+1];c[e+1]=c[e+3];c[e+3]=a;this._doCryptBlock(c,e,this._invKeySchedule,s,u,v,w,y);a=c[e+1];c[e+1]=c[e+3];c[e+3]=a},_doCryptBlock:function(c,e,a,b,h,d,j,m){for(var n=this._nRounds,f=c[e]^a[0],g=c[e+1]^a[1],k=c[e+2]^a[2],p=c[e+3]^a[3],l=4,t=1;t<n;t++)var q=b[f>>>24]^h[g>>>16&255]^d[k>>>8&255]^j[p&255]^a[l++],r=b[g>>>24]^h[k>>>16&255]^d[p>>>8&255]^j[f&255]^a[l++],s=
b[k>>>24]^h[p>>>16&255]^d[f>>>8&255]^j[g&255]^a[l++],p=b[p>>>24]^h[f>>>16&255]^d[g>>>8&255]^j[k&255]^a[l++],f=q,g=r,k=s;q=(m[f>>>24]<<24|m[g>>>16&255]<<16|m[k>>>8&255]<<8|m[p&255])^a[l++];r=(m[g>>>24]<<24|m[k>>>16&255]<<16|m[p>>>8&255]<<8|m[f&255])^a[l++];s=(m[k>>>24]<<24|m[p>>>16&255]<<16|m[f>>>8&255]<<8|m[g&255])^a[l++];p=(m[p>>>24]<<24|m[f>>>16&255]<<16|m[g>>>8&255]<<8|m[k&255])^a[l++];c[e]=q;c[e+1]=r;c[e+2]=s;c[e+3]=p},keySize:8});q.AES=x._createHelper(r)})();

/*
CryptoJS v3.1.2 tripledes-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){function j(b,c){var a=(this._lBlock>>>b^this._rBlock)&c;this._rBlock^=a;this._lBlock^=a<<b}function l(b,c){var a=(this._rBlock>>>b^this._lBlock)&c;this._lBlock^=a;this._rBlock^=a<<b}var h=CryptoJS,e=h.lib,n=e.WordArray,e=e.BlockCipher,g=h.algo,q=[57,49,41,33,25,17,9,1,58,50,42,34,26,18,10,2,59,51,43,35,27,19,11,3,60,52,44,36,63,55,47,39,31,23,15,7,62,54,46,38,30,22,14,6,61,53,45,37,29,21,13,5,28,20,12,4],p=[14,17,11,24,1,5,3,28,15,6,21,10,23,19,12,4,26,8,16,7,27,20,13,2,41,52,31,37,47,
55,30,40,51,45,33,48,44,49,39,56,34,53,46,42,50,36,29,32],r=[1,2,4,6,8,10,12,14,15,17,19,21,23,25,27,28],s=[{"0":8421888,268435456:32768,536870912:8421378,805306368:2,1073741824:512,1342177280:8421890,1610612736:8389122,1879048192:8388608,2147483648:514,2415919104:8389120,2684354560:33280,2952790016:8421376,3221225472:32770,3489660928:8388610,3758096384:0,4026531840:33282,134217728:0,402653184:8421890,671088640:33282,939524096:32768,1207959552:8421888,1476395008:512,1744830464:8421378,2013265920:2,
2281701376:8389120,2550136832:33280,2818572288:8421376,3087007744:8389122,3355443200:8388610,3623878656:32770,3892314112:514,4160749568:8388608,1:32768,268435457:2,536870913:8421888,805306369:8388608,1073741825:8421378,1342177281:33280,1610612737:512,1879048193:8389122,2147483649:8421890,2415919105:8421376,2684354561:8388610,2952790017:33282,3221225473:514,3489660929:8389120,3758096385:32770,4026531841:0,134217729:8421890,402653185:8421376,671088641:8388608,939524097:512,1207959553:32768,1476395009:8388610,
1744830465:2,2013265921:33282,2281701377:32770,2550136833:8389122,2818572289:514,3087007745:8421888,3355443201:8389120,3623878657:0,3892314113:33280,4160749569:8421378},{"0":1074282512,16777216:16384,33554432:524288,50331648:1074266128,67108864:1073741840,83886080:1074282496,100663296:1073758208,117440512:16,134217728:540672,150994944:1073758224,167772160:1073741824,184549376:540688,201326592:524304,218103808:0,234881024:16400,251658240:1074266112,8388608:1073758208,25165824:540688,41943040:16,58720256:1073758224,
75497472:1074282512,92274688:1073741824,109051904:524288,125829120:1074266128,142606336:524304,159383552:0,176160768:16384,192937984:1074266112,209715200:1073741840,226492416:540672,243269632:1074282496,260046848:16400,268435456:0,285212672:1074266128,301989888:1073758224,318767104:1074282496,335544320:1074266112,352321536:16,369098752:540688,385875968:16384,402653184:16400,419430400:524288,436207616:524304,452984832:1073741840,469762048:540672,486539264:1073758208,503316480:1073741824,520093696:1074282512,
276824064:540688,293601280:524288,310378496:1074266112,327155712:16384,343932928:1073758208,360710144:1074282512,377487360:16,394264576:1073741824,411041792:1074282496,427819008:1073741840,444596224:1073758224,461373440:524304,478150656:0,494927872:16400,511705088:1074266128,528482304:540672},{"0":260,1048576:0,2097152:67109120,3145728:65796,4194304:65540,5242880:67108868,6291456:67174660,7340032:67174400,8388608:67108864,9437184:67174656,10485760:65792,11534336:67174404,12582912:67109124,13631488:65536,
14680064:4,15728640:256,524288:67174656,1572864:67174404,2621440:0,3670016:67109120,4718592:67108868,5767168:65536,6815744:65540,7864320:260,8912896:4,9961472:256,11010048:67174400,12058624:65796,13107200:65792,14155776:67109124,15204352:67174660,16252928:67108864,16777216:67174656,17825792:65540,18874368:65536,19922944:67109120,20971520:256,22020096:67174660,23068672:67108868,24117248:0,25165824:67109124,26214400:67108864,27262976:4,28311552:65792,29360128:67174400,30408704:260,31457280:65796,32505856:67174404,
17301504:67108864,18350080:260,19398656:67174656,20447232:0,21495808:65540,22544384:67109120,23592960:256,24641536:67174404,25690112:65536,26738688:67174660,27787264:65796,28835840:67108868,29884416:67109124,30932992:67174400,31981568:4,33030144:65792},{"0":2151682048,65536:2147487808,131072:4198464,196608:2151677952,262144:0,327680:4198400,393216:2147483712,458752:4194368,524288:2147483648,589824:4194304,655360:64,720896:2147487744,786432:2151678016,851968:4160,917504:4096,983040:2151682112,32768:2147487808,
98304:64,163840:2151678016,229376:2147487744,294912:4198400,360448:2151682112,425984:0,491520:2151677952,557056:4096,622592:2151682048,688128:4194304,753664:4160,819200:2147483648,884736:4194368,950272:4198464,1015808:2147483712,1048576:4194368,1114112:4198400,1179648:2147483712,1245184:0,1310720:4160,1376256:2151678016,1441792:2151682048,1507328:2147487808,1572864:2151682112,1638400:2147483648,1703936:2151677952,1769472:4198464,1835008:2147487744,1900544:4194304,1966080:64,2031616:4096,1081344:2151677952,
1146880:2151682112,1212416:0,1277952:4198400,1343488:4194368,1409024:2147483648,1474560:2147487808,1540096:64,1605632:2147483712,1671168:4096,1736704:2147487744,1802240:2151678016,1867776:4160,1933312:2151682048,1998848:4194304,2064384:4198464},{"0":128,4096:17039360,8192:262144,12288:536870912,16384:537133184,20480:16777344,24576:553648256,28672:262272,32768:16777216,36864:537133056,40960:536871040,45056:553910400,49152:553910272,53248:0,57344:17039488,61440:553648128,2048:17039488,6144:553648256,
10240:128,14336:17039360,18432:262144,22528:537133184,26624:553910272,30720:536870912,34816:537133056,38912:0,43008:553910400,47104:16777344,51200:536871040,55296:553648128,59392:16777216,63488:262272,65536:262144,69632:128,73728:536870912,77824:553648256,81920:16777344,86016:553910272,90112:537133184,94208:16777216,98304:553910400,102400:553648128,106496:17039360,110592:537133056,114688:262272,118784:536871040,122880:0,126976:17039488,67584:553648256,71680:16777216,75776:17039360,79872:537133184,
83968:536870912,88064:17039488,92160:128,96256:553910272,100352:262272,104448:553910400,108544:0,112640:553648128,116736:16777344,120832:262144,124928:537133056,129024:536871040},{"0":268435464,256:8192,512:270532608,768:270540808,1024:268443648,1280:2097152,1536:2097160,1792:268435456,2048:0,2304:268443656,2560:2105344,2816:8,3072:270532616,3328:2105352,3584:8200,3840:270540800,128:270532608,384:270540808,640:8,896:2097152,1152:2105352,1408:268435464,1664:268443648,1920:8200,2176:2097160,2432:8192,
2688:268443656,2944:270532616,3200:0,3456:270540800,3712:2105344,3968:268435456,4096:268443648,4352:270532616,4608:270540808,4864:8200,5120:2097152,5376:268435456,5632:268435464,5888:2105344,6144:2105352,6400:0,6656:8,6912:270532608,7168:8192,7424:268443656,7680:270540800,7936:2097160,4224:8,4480:2105344,4736:2097152,4992:268435464,5248:268443648,5504:8200,5760:270540808,6016:270532608,6272:270540800,6528:270532616,6784:8192,7040:2105352,7296:2097160,7552:0,7808:268435456,8064:268443656},{"0":1048576,
16:33555457,32:1024,48:1049601,64:34604033,80:0,96:1,112:34603009,128:33555456,144:1048577,160:33554433,176:34604032,192:34603008,208:1025,224:1049600,240:33554432,8:34603009,24:0,40:33555457,56:34604032,72:1048576,88:33554433,104:33554432,120:1025,136:1049601,152:33555456,168:34603008,184:1048577,200:1024,216:34604033,232:1,248:1049600,256:33554432,272:1048576,288:33555457,304:34603009,320:1048577,336:33555456,352:34604032,368:1049601,384:1025,400:34604033,416:1049600,432:1,448:0,464:34603008,480:33554433,
496:1024,264:1049600,280:33555457,296:34603009,312:1,328:33554432,344:1048576,360:1025,376:34604032,392:33554433,408:34603008,424:0,440:34604033,456:1049601,472:1024,488:33555456,504:1048577},{"0":134219808,1:131072,2:134217728,3:32,4:131104,5:134350880,6:134350848,7:2048,8:134348800,9:134219776,10:133120,11:134348832,12:2080,13:0,14:134217760,15:133152,2147483648:2048,2147483649:134350880,2147483650:134219808,2147483651:134217728,2147483652:134348800,2147483653:133120,2147483654:133152,2147483655:32,
2147483656:134217760,2147483657:2080,2147483658:131104,2147483659:134350848,2147483660:0,2147483661:134348832,2147483662:134219776,2147483663:131072,16:133152,17:134350848,18:32,19:2048,20:134219776,21:134217760,22:134348832,23:131072,24:0,25:131104,26:134348800,27:134219808,28:134350880,29:133120,30:2080,31:134217728,2147483664:131072,2147483665:2048,2147483666:134348832,2147483667:133152,2147483668:32,2147483669:134348800,2147483670:134217728,2147483671:134219808,2147483672:134350880,2147483673:134217760,
2147483674:134219776,2147483675:0,2147483676:133120,2147483677:2080,2147483678:131104,2147483679:134350848}],t=[4160749569,528482304,33030144,2064384,129024,8064,504,2147483679],m=g.DES=e.extend({_doReset:function(){for(var b=this._key.words,c=[],a=0;56>a;a++){var f=q[a]-1;c[a]=b[f>>>5]>>>31-f%32&1}b=this._subKeys=[];for(f=0;16>f;f++){for(var d=b[f]=[],e=r[f],a=0;24>a;a++)d[a/6|0]|=c[(p[a]-1+e)%28]<<31-a%6,d[4+(a/6|0)]|=c[28+(p[a+24]-1+e)%28]<<31-a%6;d[0]=d[0]<<1|d[0]>>>31;for(a=1;7>a;a++)d[a]>>>=
4*(a-1)+3;d[7]=d[7]<<5|d[7]>>>27}c=this._invSubKeys=[];for(a=0;16>a;a++)c[a]=b[15-a]},encryptBlock:function(b,c){this._doCryptBlock(b,c,this._subKeys)},decryptBlock:function(b,c){this._doCryptBlock(b,c,this._invSubKeys)},_doCryptBlock:function(b,c,a){this._lBlock=b[c];this._rBlock=b[c+1];j.call(this,4,252645135);j.call(this,16,65535);l.call(this,2,858993459);l.call(this,8,16711935);j.call(this,1,1431655765);for(var f=0;16>f;f++){for(var d=a[f],e=this._lBlock,h=this._rBlock,g=0,k=0;8>k;k++)g|=s[k][((h^
d[k])&t[k])>>>0];this._lBlock=h;this._rBlock=e^g}a=this._lBlock;this._lBlock=this._rBlock;this._rBlock=a;j.call(this,1,1431655765);l.call(this,8,16711935);l.call(this,2,858993459);j.call(this,16,65535);j.call(this,4,252645135);b[c]=this._lBlock;b[c+1]=this._rBlock},keySize:2,ivSize:2,blockSize:2});h.DES=e._createHelper(m);g=g.TripleDES=e.extend({_doReset:function(){var b=this._key.words;this._des1=m.createEncryptor(n.create(b.slice(0,2)));this._des2=m.createEncryptor(n.create(b.slice(2,4)));this._des3=
m.createEncryptor(n.create(b.slice(4,6)))},encryptBlock:function(b,c){this._des1.encryptBlock(b,c);this._des2.decryptBlock(b,c);this._des3.encryptBlock(b,c)},decryptBlock:function(b,c){this._des3.decryptBlock(b,c);this._des2.encryptBlock(b,c);this._des1.decryptBlock(b,c)},keySize:6,ivSize:2,blockSize:2});h.TripleDES=e._createHelper(g)})();

/*
CryptoJS v3.1.2 enc-base64.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var h=CryptoJS,j=h.lib.WordArray;h.enc.Base64={stringify:function(b){var e=b.words,f=b.sigBytes,c=this._map;b.clamp();b=[];for(var a=0;a<f;a+=3)for(var d=(e[a>>>2]>>>24-8*(a%4)&255)<<16|(e[a+1>>>2]>>>24-8*((a+1)%4)&255)<<8|e[a+2>>>2]>>>24-8*((a+2)%4)&255,g=0;4>g&&a+0.75*g<f;g++)b.push(c.charAt(d>>>6*(3-g)&63));if(e=c.charAt(64))for(;b.length%4;)b.push(e);return b.join("")},parse:function(b){var e=b.length,f=this._map,c=f.charAt(64);c&&(c=b.indexOf(c),-1!=c&&(e=c));for(var c=[],a=0,d=0;d<
e;d++)if(d%4){var g=f.indexOf(b.charAt(d-1))<<2*(d%4),h=f.indexOf(b.charAt(d))>>>6-2*(d%4);c[a>>>2]|=(g|h)<<24-8*(a%4);a++}return j.create(c,a)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}})();

/*
CryptoJS v3.1.2 md5.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(E){function h(a,f,g,j,p,h,k){a=a+(f&g|~f&j)+p+k;return(a<<h|a>>>32-h)+f}function k(a,f,g,j,p,h,k){a=a+(f&j|g&~j)+p+k;return(a<<h|a>>>32-h)+f}function l(a,f,g,j,h,k,l){a=a+(f^g^j)+h+l;return(a<<k|a>>>32-k)+f}function n(a,f,g,j,h,k,l){a=a+(g^(f|~j))+h+l;return(a<<k|a>>>32-k)+f}for(var r=CryptoJS,q=r.lib,F=q.WordArray,s=q.Hasher,q=r.algo,a=[],t=0;64>t;t++)a[t]=4294967296*E.abs(E.sin(t+1))|0;q=q.MD5=s.extend({_doReset:function(){this._hash=new F.init([1732584193,4023233417,2562383102,271733878])},
_doProcessBlock:function(m,f){for(var g=0;16>g;g++){var j=f+g,p=m[j];m[j]=(p<<8|p>>>24)&16711935|(p<<24|p>>>8)&4278255360}var g=this._hash.words,j=m[f+0],p=m[f+1],q=m[f+2],r=m[f+3],s=m[f+4],t=m[f+5],u=m[f+6],v=m[f+7],w=m[f+8],x=m[f+9],y=m[f+10],z=m[f+11],A=m[f+12],B=m[f+13],C=m[f+14],D=m[f+15],b=g[0],c=g[1],d=g[2],e=g[3],b=h(b,c,d,e,j,7,a[0]),e=h(e,b,c,d,p,12,a[1]),d=h(d,e,b,c,q,17,a[2]),c=h(c,d,e,b,r,22,a[3]),b=h(b,c,d,e,s,7,a[4]),e=h(e,b,c,d,t,12,a[5]),d=h(d,e,b,c,u,17,a[6]),c=h(c,d,e,b,v,22,a[7]),
b=h(b,c,d,e,w,7,a[8]),e=h(e,b,c,d,x,12,a[9]),d=h(d,e,b,c,y,17,a[10]),c=h(c,d,e,b,z,22,a[11]),b=h(b,c,d,e,A,7,a[12]),e=h(e,b,c,d,B,12,a[13]),d=h(d,e,b,c,C,17,a[14]),c=h(c,d,e,b,D,22,a[15]),b=k(b,c,d,e,p,5,a[16]),e=k(e,b,c,d,u,9,a[17]),d=k(d,e,b,c,z,14,a[18]),c=k(c,d,e,b,j,20,a[19]),b=k(b,c,d,e,t,5,a[20]),e=k(e,b,c,d,y,9,a[21]),d=k(d,e,b,c,D,14,a[22]),c=k(c,d,e,b,s,20,a[23]),b=k(b,c,d,e,x,5,a[24]),e=k(e,b,c,d,C,9,a[25]),d=k(d,e,b,c,r,14,a[26]),c=k(c,d,e,b,w,20,a[27]),b=k(b,c,d,e,B,5,a[28]),e=k(e,b,
c,d,q,9,a[29]),d=k(d,e,b,c,v,14,a[30]),c=k(c,d,e,b,A,20,a[31]),b=l(b,c,d,e,t,4,a[32]),e=l(e,b,c,d,w,11,a[33]),d=l(d,e,b,c,z,16,a[34]),c=l(c,d,e,b,C,23,a[35]),b=l(b,c,d,e,p,4,a[36]),e=l(e,b,c,d,s,11,a[37]),d=l(d,e,b,c,v,16,a[38]),c=l(c,d,e,b,y,23,a[39]),b=l(b,c,d,e,B,4,a[40]),e=l(e,b,c,d,j,11,a[41]),d=l(d,e,b,c,r,16,a[42]),c=l(c,d,e,b,u,23,a[43]),b=l(b,c,d,e,x,4,a[44]),e=l(e,b,c,d,A,11,a[45]),d=l(d,e,b,c,D,16,a[46]),c=l(c,d,e,b,q,23,a[47]),b=n(b,c,d,e,j,6,a[48]),e=n(e,b,c,d,v,10,a[49]),d=n(d,e,b,c,
C,15,a[50]),c=n(c,d,e,b,t,21,a[51]),b=n(b,c,d,e,A,6,a[52]),e=n(e,b,c,d,r,10,a[53]),d=n(d,e,b,c,y,15,a[54]),c=n(c,d,e,b,p,21,a[55]),b=n(b,c,d,e,w,6,a[56]),e=n(e,b,c,d,D,10,a[57]),d=n(d,e,b,c,u,15,a[58]),c=n(c,d,e,b,B,21,a[59]),b=n(b,c,d,e,s,6,a[60]),e=n(e,b,c,d,z,10,a[61]),d=n(d,e,b,c,q,15,a[62]),c=n(c,d,e,b,x,21,a[63]);g[0]=g[0]+b|0;g[1]=g[1]+c|0;g[2]=g[2]+d|0;g[3]=g[3]+e|0},_doFinalize:function(){var a=this._data,f=a.words,g=8*this._nDataBytes,j=8*a.sigBytes;f[j>>>5]|=128<<24-j%32;var h=E.floor(g/
4294967296);f[(j+64>>>9<<4)+15]=(h<<8|h>>>24)&16711935|(h<<24|h>>>8)&4278255360;f[(j+64>>>9<<4)+14]=(g<<8|g>>>24)&16711935|(g<<24|g>>>8)&4278255360;a.sigBytes=4*(f.length+1);this._process();a=this._hash;f=a.words;for(g=0;4>g;g++)j=f[g],f[g]=(j<<8|j>>>24)&16711935|(j<<24|j>>>8)&4278255360;return a},clone:function(){var a=s.clone.call(this);a._hash=this._hash.clone();return a}});r.MD5=s._createHelper(q);r.HmacMD5=s._createHmacHelper(q)})(Math);

/*
CryptoJS v3.1.2 sha1-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var k=CryptoJS,b=k.lib,m=b.WordArray,l=b.Hasher,d=[],b=k.algo.SHA1=l.extend({_doReset:function(){this._hash=new m.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(n,p){for(var a=this._hash.words,e=a[0],f=a[1],h=a[2],j=a[3],b=a[4],c=0;80>c;c++){if(16>c)d[c]=n[p+c]|0;else{var g=d[c-3]^d[c-8]^d[c-14]^d[c-16];d[c]=g<<1|g>>>31}g=(e<<5|e>>>27)+b+d[c];g=20>c?g+((f&h|~f&j)+1518500249):40>c?g+((f^h^j)+1859775393):60>c?g+((f&h|f&j|h&j)-1894007588):g+((f^h^
j)-899497514);b=j;j=h;h=f<<30|f>>>2;f=e;e=g}a[0]=a[0]+e|0;a[1]=a[1]+f|0;a[2]=a[2]+h|0;a[3]=a[3]+j|0;a[4]=a[4]+b|0},_doFinalize:function(){var b=this._data,d=b.words,a=8*this._nDataBytes,e=8*b.sigBytes;d[e>>>5]|=128<<24-e%32;d[(e+64>>>9<<4)+14]=Math.floor(a/4294967296);d[(e+64>>>9<<4)+15]=a;b.sigBytes=4*d.length;this._process();return this._hash},clone:function(){var b=l.clone.call(this);b._hash=this._hash.clone();return b}});k.SHA1=l._createHelper(b);k.HmacSHA1=l._createHmacHelper(b)})();

/*
CryptoJS v3.1.2 sha256-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(k){for(var g=CryptoJS,h=g.lib,v=h.WordArray,j=h.Hasher,h=g.algo,s=[],t=[],u=function(q){return 4294967296*(q-(q|0))|0},l=2,b=0;64>b;){var d;a:{d=l;for(var w=k.sqrt(d),r=2;r<=w;r++)if(!(d%r)){d=!1;break a}d=!0}d&&(8>b&&(s[b]=u(k.pow(l,0.5))),t[b]=u(k.pow(l,1/3)),b++);l++}var n=[],h=h.SHA256=j.extend({_doReset:function(){this._hash=new v.init(s.slice(0))},_doProcessBlock:function(q,h){for(var a=this._hash.words,c=a[0],d=a[1],b=a[2],k=a[3],f=a[4],g=a[5],j=a[6],l=a[7],e=0;64>e;e++){if(16>e)n[e]=
q[h+e]|0;else{var m=n[e-15],p=n[e-2];n[e]=((m<<25|m>>>7)^(m<<14|m>>>18)^m>>>3)+n[e-7]+((p<<15|p>>>17)^(p<<13|p>>>19)^p>>>10)+n[e-16]}m=l+((f<<26|f>>>6)^(f<<21|f>>>11)^(f<<7|f>>>25))+(f&g^~f&j)+t[e]+n[e];p=((c<<30|c>>>2)^(c<<19|c>>>13)^(c<<10|c>>>22))+(c&d^c&b^d&b);l=j;j=g;g=f;f=k+m|0;k=b;b=d;d=c;c=m+p|0}a[0]=a[0]+c|0;a[1]=a[1]+d|0;a[2]=a[2]+b|0;a[3]=a[3]+k|0;a[4]=a[4]+f|0;a[5]=a[5]+g|0;a[6]=a[6]+j|0;a[7]=a[7]+l|0},_doFinalize:function(){var d=this._data,b=d.words,a=8*this._nDataBytes,c=8*d.sigBytes;
b[c>>>5]|=128<<24-c%32;b[(c+64>>>9<<4)+14]=k.floor(a/4294967296);b[(c+64>>>9<<4)+15]=a;d.sigBytes=4*b.length;this._process();return this._hash},clone:function(){var b=j.clone.call(this);b._hash=this._hash.clone();return b}});g.SHA256=j._createHelper(h);g.HmacSHA256=j._createHmacHelper(h)})(Math);

/*
CryptoJS v3.1.2 sha224-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var b=CryptoJS,d=b.lib.WordArray,a=b.algo,c=a.SHA256,a=a.SHA224=c.extend({_doReset:function(){this._hash=new d.init([3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428])},_doFinalize:function(){var a=c._doFinalize.call(this);a.sigBytes-=4;return a}});b.SHA224=c._createHelper(a);b.HmacSHA224=c._createHmacHelper(a)})();

/*
CryptoJS v3.1.2 sha512-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){function a(){return d.create.apply(d,arguments)}for(var n=CryptoJS,r=n.lib.Hasher,e=n.x64,d=e.Word,T=e.WordArray,e=n.algo,ea=[a(1116352408,3609767458),a(1899447441,602891725),a(3049323471,3964484399),a(3921009573,2173295548),a(961987163,4081628472),a(1508970993,3053834265),a(2453635748,2937671579),a(2870763221,3664609560),a(3624381080,2734883394),a(310598401,1164996542),a(607225278,1323610764),a(1426881987,3590304994),a(1925078388,4068182383),a(2162078206,991336113),a(2614888103,633803317),
a(3248222580,3479774868),a(3835390401,2666613458),a(4022224774,944711139),a(264347078,2341262773),a(604807628,2007800933),a(770255983,1495990901),a(1249150122,1856431235),a(1555081692,3175218132),a(1996064986,2198950837),a(2554220882,3999719339),a(2821834349,766784016),a(2952996808,2566594879),a(3210313671,3203337956),a(3336571891,1034457026),a(3584528711,2466948901),a(113926993,3758326383),a(338241895,168717936),a(666307205,1188179964),a(773529912,1546045734),a(1294757372,1522805485),a(1396182291,
2643833823),a(1695183700,2343527390),a(1986661051,1014477480),a(2177026350,1206759142),a(2456956037,344077627),a(2730485921,1290863460),a(2820302411,3158454273),a(3259730800,3505952657),a(3345764771,106217008),a(3516065817,3606008344),a(3600352804,1432725776),a(4094571909,1467031594),a(275423344,851169720),a(430227734,3100823752),a(506948616,1363258195),a(659060556,3750685593),a(883997877,3785050280),a(958139571,3318307427),a(1322822218,3812723403),a(1537002063,2003034995),a(1747873779,3602036899),
a(1955562222,1575990012),a(2024104815,1125592928),a(2227730452,2716904306),a(2361852424,442776044),a(2428436474,593698344),a(2756734187,3733110249),a(3204031479,2999351573),a(3329325298,3815920427),a(3391569614,3928383900),a(3515267271,566280711),a(3940187606,3454069534),a(4118630271,4000239992),a(116418474,1914138554),a(174292421,2731055270),a(289380356,3203993006),a(460393269,320620315),a(685471733,587496836),a(852142971,1086792851),a(1017036298,365543100),a(1126000580,2618297676),a(1288033470,
3409855158),a(1501505948,4234509866),a(1607167915,987167468),a(1816402316,1246189591)],v=[],w=0;80>w;w++)v[w]=a();e=e.SHA512=r.extend({_doReset:function(){this._hash=new T.init([new d.init(1779033703,4089235720),new d.init(3144134277,2227873595),new d.init(1013904242,4271175723),new d.init(2773480762,1595750129),new d.init(1359893119,2917565137),new d.init(2600822924,725511199),new d.init(528734635,4215389547),new d.init(1541459225,327033209)])},_doProcessBlock:function(a,d){for(var f=this._hash.words,
F=f[0],e=f[1],n=f[2],r=f[3],G=f[4],H=f[5],I=f[6],f=f[7],w=F.high,J=F.low,X=e.high,K=e.low,Y=n.high,L=n.low,Z=r.high,M=r.low,$=G.high,N=G.low,aa=H.high,O=H.low,ba=I.high,P=I.low,ca=f.high,Q=f.low,k=w,g=J,z=X,x=K,A=Y,y=L,U=Z,B=M,l=$,h=N,R=aa,C=O,S=ba,D=P,V=ca,E=Q,m=0;80>m;m++){var s=v[m];if(16>m)var j=s.high=a[d+2*m]|0,b=s.low=a[d+2*m+1]|0;else{var j=v[m-15],b=j.high,p=j.low,j=(b>>>1|p<<31)^(b>>>8|p<<24)^b>>>7,p=(p>>>1|b<<31)^(p>>>8|b<<24)^(p>>>7|b<<25),u=v[m-2],b=u.high,c=u.low,u=(b>>>19|c<<13)^(b<<
3|c>>>29)^b>>>6,c=(c>>>19|b<<13)^(c<<3|b>>>29)^(c>>>6|b<<26),b=v[m-7],W=b.high,t=v[m-16],q=t.high,t=t.low,b=p+b.low,j=j+W+(b>>>0<p>>>0?1:0),b=b+c,j=j+u+(b>>>0<c>>>0?1:0),b=b+t,j=j+q+(b>>>0<t>>>0?1:0);s.high=j;s.low=b}var W=l&R^~l&S,t=h&C^~h&D,s=k&z^k&A^z&A,T=g&x^g&y^x&y,p=(k>>>28|g<<4)^(k<<30|g>>>2)^(k<<25|g>>>7),u=(g>>>28|k<<4)^(g<<30|k>>>2)^(g<<25|k>>>7),c=ea[m],fa=c.high,da=c.low,c=E+((h>>>14|l<<18)^(h>>>18|l<<14)^(h<<23|l>>>9)),q=V+((l>>>14|h<<18)^(l>>>18|h<<14)^(l<<23|h>>>9))+(c>>>0<E>>>0?1:
0),c=c+t,q=q+W+(c>>>0<t>>>0?1:0),c=c+da,q=q+fa+(c>>>0<da>>>0?1:0),c=c+b,q=q+j+(c>>>0<b>>>0?1:0),b=u+T,s=p+s+(b>>>0<u>>>0?1:0),V=S,E=D,S=R,D=C,R=l,C=h,h=B+c|0,l=U+q+(h>>>0<B>>>0?1:0)|0,U=A,B=y,A=z,y=x,z=k,x=g,g=c+b|0,k=q+s+(g>>>0<c>>>0?1:0)|0}J=F.low=J+g;F.high=w+k+(J>>>0<g>>>0?1:0);K=e.low=K+x;e.high=X+z+(K>>>0<x>>>0?1:0);L=n.low=L+y;n.high=Y+A+(L>>>0<y>>>0?1:0);M=r.low=M+B;r.high=Z+U+(M>>>0<B>>>0?1:0);N=G.low=N+h;G.high=$+l+(N>>>0<h>>>0?1:0);O=H.low=O+C;H.high=aa+R+(O>>>0<C>>>0?1:0);P=I.low=P+D;
I.high=ba+S+(P>>>0<D>>>0?1:0);Q=f.low=Q+E;f.high=ca+V+(Q>>>0<E>>>0?1:0)},_doFinalize:function(){var a=this._data,d=a.words,f=8*this._nDataBytes,e=8*a.sigBytes;d[e>>>5]|=128<<24-e%32;d[(e+128>>>10<<5)+30]=Math.floor(f/4294967296);d[(e+128>>>10<<5)+31]=f;a.sigBytes=4*d.length;this._process();return this._hash.toX32()},clone:function(){var a=r.clone.call(this);a._hash=this._hash.clone();return a},blockSize:32});n.SHA512=r._createHelper(e);n.HmacSHA512=r._createHmacHelper(e)})();

/*
CryptoJS v3.1.2 sha384-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var c=CryptoJS,a=c.x64,b=a.Word,e=a.WordArray,a=c.algo,d=a.SHA512,a=a.SHA384=d.extend({_doReset:function(){this._hash=new e.init([new b.init(3418070365,3238371032),new b.init(1654270250,914150663),new b.init(2438529370,812702999),new b.init(355462360,4144912697),new b.init(1731405415,4290775857),new b.init(2394180231,1750603025),new b.init(3675008525,1694076839),new b.init(1203062813,3204075428)])},_doFinalize:function(){var a=d._doFinalize.call(this);a.sigBytes-=16;return a}});c.SHA384=
d._createHelper(a);c.HmacSHA384=d._createHmacHelper(a)})();

/*
CryptoJS v3.1.2 ripemd160-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/*

(c) 2012 by Cedric Mesnil. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
(function(){var q=CryptoJS,d=q.lib,n=d.WordArray,p=d.Hasher,d=q.algo,x=n.create([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,7,4,13,1,10,6,15,3,12,0,9,5,2,14,11,8,3,10,14,4,9,15,8,1,2,7,0,6,13,11,5,12,1,9,11,10,0,8,12,4,13,3,7,15,14,5,6,2,4,0,5,9,7,12,2,10,14,1,3,8,11,6,15,13]),y=n.create([5,14,7,0,9,2,11,4,13,6,15,8,1,10,3,12,6,11,3,7,0,13,5,10,14,15,8,12,4,9,1,2,15,5,1,3,7,14,6,9,11,8,12,2,10,0,4,13,8,6,4,1,3,11,15,0,5,12,2,13,9,7,10,14,12,15,10,4,1,5,8,7,6,2,13,14,0,3,9,11]),z=n.create([11,14,15,12,
5,8,7,9,11,13,14,15,6,7,9,8,7,6,8,13,11,9,7,15,7,12,15,9,11,7,13,12,11,13,6,7,14,9,13,15,14,8,13,6,5,12,7,5,11,12,14,15,14,15,9,8,9,14,5,6,8,6,5,12,9,15,5,11,6,8,13,12,5,12,13,14,11,8,5,6]),A=n.create([8,9,9,11,13,15,15,5,7,7,8,11,14,14,12,6,9,13,15,7,12,8,9,11,7,7,12,7,6,15,13,11,9,7,15,11,8,6,6,14,12,13,5,14,13,13,7,5,15,5,8,11,14,14,6,14,6,9,12,9,12,5,15,8,8,5,12,9,12,5,14,6,8,13,6,5,15,13,11,11]),B=n.create([0,1518500249,1859775393,2400959708,2840853838]),C=n.create([1352829926,1548603684,1836072691,
2053994217,0]),d=d.RIPEMD160=p.extend({_doReset:function(){this._hash=n.create([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(e,v){for(var b=0;16>b;b++){var c=v+b,f=e[c];e[c]=(f<<8|f>>>24)&16711935|(f<<24|f>>>8)&4278255360}var c=this._hash.words,f=B.words,d=C.words,n=x.words,q=y.words,p=z.words,w=A.words,t,g,h,j,r,u,k,l,m,s;u=t=c[0];k=g=c[1];l=h=c[2];m=j=c[3];s=r=c[4];for(var a,b=0;80>b;b+=1)a=t+e[v+n[b]]|0,a=16>b?a+((g^h^j)+f[0]):32>b?a+((g&h|~g&j)+f[1]):48>b?
a+(((g|~h)^j)+f[2]):64>b?a+((g&j|h&~j)+f[3]):a+((g^(h|~j))+f[4]),a|=0,a=a<<p[b]|a>>>32-p[b],a=a+r|0,t=r,r=j,j=h<<10|h>>>22,h=g,g=a,a=u+e[v+q[b]]|0,a=16>b?a+((k^(l|~m))+d[0]):32>b?a+((k&m|l&~m)+d[1]):48>b?a+(((k|~l)^m)+d[2]):64>b?a+((k&l|~k&m)+d[3]):a+((k^l^m)+d[4]),a|=0,a=a<<w[b]|a>>>32-w[b],a=a+s|0,u=s,s=m,m=l<<10|l>>>22,l=k,k=a;a=c[1]+h+m|0;c[1]=c[2]+j+s|0;c[2]=c[3]+r+u|0;c[3]=c[4]+t+k|0;c[4]=c[0]+g+l|0;c[0]=a},_doFinalize:function(){var e=this._data,d=e.words,b=8*this._nDataBytes,c=8*e.sigBytes;
d[c>>>5]|=128<<24-c%32;d[(c+64>>>9<<4)+14]=(b<<8|b>>>24)&16711935|(b<<24|b>>>8)&4278255360;e.sigBytes=4*(d.length+1);this._process();e=this._hash;d=e.words;for(b=0;5>b;b++)c=d[b],d[b]=(c<<8|c>>>24)&16711935|(c<<24|c>>>8)&4278255360;return e},clone:function(){var d=p.clone.call(this);d._hash=this._hash.clone();return d}});q.RIPEMD160=p._createHelper(d);q.HmacRIPEMD160=p._createHmacHelper(d)})(Math);

/*
CryptoJS v3.1.2 hmac.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var c=CryptoJS,k=c.enc.Utf8;c.algo.HMAC=c.lib.Base.extend({init:function(a,b){a=this._hasher=new a.init;"string"==typeof b&&(b=k.parse(b));var c=a.blockSize,e=4*c;b.sigBytes>e&&(b=a.finalize(b));b.clamp();for(var f=this._oKey=b.clone(),g=this._iKey=b.clone(),h=f.words,j=g.words,d=0;d<c;d++)h[d]^=1549556828,j[d]^=909522486;f.sigBytes=g.sigBytes=e;this.reset()},reset:function(){var a=this._hasher;a.reset();a.update(this._iKey)},update:function(a){this._hasher.update(a);return this},finalize:function(a){var b=
this._hasher;a=b.finalize(a);b.reset();return b.finalize(this._oKey.clone().concat(a))}})})();

/*
CryptoJS v3.1.2 pbkdf2-min.js
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function(){var b=CryptoJS,a=b.lib,d=a.Base,m=a.WordArray,a=b.algo,q=a.HMAC,l=a.PBKDF2=d.extend({cfg:d.extend({keySize:4,hasher:a.SHA1,iterations:1}),init:function(a){this.cfg=this.cfg.extend(a)},compute:function(a,b){for(var c=this.cfg,f=q.create(c.hasher,a),g=m.create(),d=m.create([1]),l=g.words,r=d.words,n=c.keySize,c=c.iterations;l.length<n;){var h=f.update(b).finalize(d);f.reset();for(var j=h.words,s=j.length,k=h,p=1;p<c;p++){k=f.finalize(k);f.reset();for(var t=k.words,e=0;e<s;e++)j[e]^=t[e]}g.concat(h);
r[0]++}g.sigBytes=4*n;return g}});b.PBKDF2=function(a,b,c){return l.create(c).compute(a,b)}})();

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
var b64map="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var b64pad="=";function hex2b64(d){var b;var e;var a="";for(b=0;b+3<=d.length;b+=3){e=parseInt(d.substring(b,b+3),16);a+=b64map.charAt(e>>6)+b64map.charAt(e&63)}if(b+1==d.length){e=parseInt(d.substring(b,b+1),16);a+=b64map.charAt(e<<2)}else{if(b+2==d.length){e=parseInt(d.substring(b,b+2),16);a+=b64map.charAt(e>>2)+b64map.charAt((e&3)<<4)}}if(b64pad){while((a.length&3)>0){a+=b64pad}}return a}function b64tohex(f){var d="";var e;var b=0;var c;var a;for(e=0;e<f.length;++e){if(f.charAt(e)==b64pad){break}a=b64map.indexOf(f.charAt(e));if(a<0){continue}if(b==0){d+=int2char(a>>2);c=a&3;b=1}else{if(b==1){d+=int2char((c<<2)|(a>>4));c=a&15;b=2}else{if(b==2){d+=int2char(c);d+=int2char(a>>2);c=a&3;b=3}else{d+=int2char((c<<2)|(a>>4));d+=int2char(a&15);b=0}}}}if(b==1){d+=int2char(c<<2)}return d}function b64toBA(e){var d=b64tohex(e);var c;var b=new Array();for(c=0;2*c<d.length;++c){b[c]=parseInt(d.substring(2*c,2*c+2),16)}return b};
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
var dbits;var canary=244837814094590;var j_lm=((canary&16777215)==15715070);function BigInteger(e,d,f){if(e!=null){if("number"==typeof e){this.fromNumber(e,d,f)}else{if(d==null&&"string"!=typeof e){this.fromString(e,256)}else{this.fromString(e,d)}}}}function nbi(){return new BigInteger(null)}function am1(f,a,b,e,h,g){while(--g>=0){var d=a*this[f++]+b[e]+h;h=Math.floor(d/67108864);b[e++]=d&67108863}return h}function am2(f,q,r,e,o,a){var k=q&32767,p=q>>15;while(--a>=0){var d=this[f]&32767;var g=this[f++]>>15;var b=p*d+g*k;d=k*d+((b&32767)<<15)+r[e]+(o&1073741823);o=(d>>>30)+(b>>>15)+p*g+(o>>>30);r[e++]=d&1073741823}return o}function am3(f,q,r,e,o,a){var k=q&16383,p=q>>14;while(--a>=0){var d=this[f]&16383;var g=this[f++]>>14;var b=p*d+g*k;d=k*d+((b&16383)<<14)+r[e]+o;o=(d>>28)+(b>>14)+p*g;r[e++]=d&268435455}return o}if(j_lm&&(navigator.appName=="Microsoft Internet Explorer")){BigInteger.prototype.am=am2;dbits=30}else{if(j_lm&&(navigator.appName!="Netscape")){BigInteger.prototype.am=am1;dbits=26}else{BigInteger.prototype.am=am3;dbits=28}}BigInteger.prototype.DB=dbits;BigInteger.prototype.DM=((1<<dbits)-1);BigInteger.prototype.DV=(1<<dbits);var BI_FP=52;BigInteger.prototype.FV=Math.pow(2,BI_FP);BigInteger.prototype.F1=BI_FP-dbits;BigInteger.prototype.F2=2*dbits-BI_FP;var BI_RM="0123456789abcdefghijklmnopqrstuvwxyz";var BI_RC=new Array();var rr,vv;rr="0".charCodeAt(0);for(vv=0;vv<=9;++vv){BI_RC[rr++]=vv}rr="a".charCodeAt(0);for(vv=10;vv<36;++vv){BI_RC[rr++]=vv}rr="A".charCodeAt(0);for(vv=10;vv<36;++vv){BI_RC[rr++]=vv}function int2char(a){return BI_RM.charAt(a)}function intAt(b,a){var d=BI_RC[b.charCodeAt(a)];return(d==null)?-1:d}function bnpCopyTo(b){for(var a=this.t-1;a>=0;--a){b[a]=this[a]}b.t=this.t;b.s=this.s}function bnpFromInt(a){this.t=1;this.s=(a<0)?-1:0;if(a>0){this[0]=a}else{if(a<-1){this[0]=a+this.DV}else{this.t=0}}}function nbv(a){var b=nbi();b.fromInt(a);return b}function bnpFromString(h,c){var e;if(c==16){e=4}else{if(c==8){e=3}else{if(c==256){e=8}else{if(c==2){e=1}else{if(c==32){e=5}else{if(c==4){e=2}else{this.fromRadix(h,c);return}}}}}}this.t=0;this.s=0;var g=h.length,d=false,f=0;while(--g>=0){var a=(e==8)?h[g]&255:intAt(h,g);if(a<0){if(h.charAt(g)=="-"){d=true}continue}d=false;if(f==0){this[this.t++]=a}else{if(f+e>this.DB){this[this.t-1]|=(a&((1<<(this.DB-f))-1))<<f;this[this.t++]=(a>>(this.DB-f))}else{this[this.t-1]|=a<<f}}f+=e;if(f>=this.DB){f-=this.DB}}if(e==8&&(h[0]&128)!=0){this.s=-1;if(f>0){this[this.t-1]|=((1<<(this.DB-f))-1)<<f}}this.clamp();if(d){BigInteger.ZERO.subTo(this,this)}}function bnpClamp(){var a=this.s&this.DM;while(this.t>0&&this[this.t-1]==a){--this.t}}function bnToString(c){if(this.s<0){return"-"+this.negate().toString(c)}var e;if(c==16){e=4}else{if(c==8){e=3}else{if(c==2){e=1}else{if(c==32){e=5}else{if(c==4){e=2}else{return this.toRadix(c)}}}}}var g=(1<<e)-1,l,a=false,h="",f=this.t;var j=this.DB-(f*this.DB)%e;if(f-->0){if(j<this.DB&&(l=this[f]>>j)>0){a=true;h=int2char(l)}while(f>=0){if(j<e){l=(this[f]&((1<<j)-1))<<(e-j);l|=this[--f]>>(j+=this.DB-e)}else{l=(this[f]>>(j-=e))&g;if(j<=0){j+=this.DB;--f}}if(l>0){a=true}if(a){h+=int2char(l)}}}return a?h:"0"}function bnNegate(){var a=nbi();BigInteger.ZERO.subTo(this,a);return a}function bnAbs(){return(this.s<0)?this.negate():this}function bnCompareTo(b){var d=this.s-b.s;if(d!=0){return d}var c=this.t;d=c-b.t;if(d!=0){return(this.s<0)?-d:d}while(--c>=0){if((d=this[c]-b[c])!=0){return d}}return 0}function nbits(a){var c=1,b;if((b=a>>>16)!=0){a=b;c+=16}if((b=a>>8)!=0){a=b;c+=8}if((b=a>>4)!=0){a=b;c+=4}if((b=a>>2)!=0){a=b;c+=2}if((b=a>>1)!=0){a=b;c+=1}return c}function bnBitLength(){if(this.t<=0){return 0}return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM))}function bnpDLShiftTo(c,b){var a;for(a=this.t-1;a>=0;--a){b[a+c]=this[a]}for(a=c-1;a>=0;--a){b[a]=0}b.t=this.t+c;b.s=this.s}function bnpDRShiftTo(c,b){for(var a=c;a<this.t;++a){b[a-c]=this[a]}b.t=Math.max(this.t-c,0);b.s=this.s}function bnpLShiftTo(j,e){var b=j%this.DB;var a=this.DB-b;var g=(1<<a)-1;var f=Math.floor(j/this.DB),h=(this.s<<b)&this.DM,d;for(d=this.t-1;d>=0;--d){e[d+f+1]=(this[d]>>a)|h;h=(this[d]&g)<<b}for(d=f-1;d>=0;--d){e[d]=0}e[f]=h;e.t=this.t+f+1;e.s=this.s;e.clamp()}function bnpRShiftTo(g,d){d.s=this.s;var e=Math.floor(g/this.DB);if(e>=this.t){d.t=0;return}var b=g%this.DB;var a=this.DB-b;var f=(1<<b)-1;d[0]=this[e]>>b;for(var c=e+1;c<this.t;++c){d[c-e-1]|=(this[c]&f)<<a;d[c-e]=this[c]>>b}if(b>0){d[this.t-e-1]|=(this.s&f)<<a}d.t=this.t-e;d.clamp()}function bnpSubTo(d,f){var e=0,g=0,b=Math.min(d.t,this.t);while(e<b){g+=this[e]-d[e];f[e++]=g&this.DM;g>>=this.DB}if(d.t<this.t){g-=d.s;while(e<this.t){g+=this[e];f[e++]=g&this.DM;g>>=this.DB}g+=this.s}else{g+=this.s;while(e<d.t){g-=d[e];f[e++]=g&this.DM;g>>=this.DB}g-=d.s}f.s=(g<0)?-1:0;if(g<-1){f[e++]=this.DV+g}else{if(g>0){f[e++]=g}}f.t=e;f.clamp()}function bnpMultiplyTo(c,e){var b=this.abs(),f=c.abs();var d=b.t;e.t=d+f.t;while(--d>=0){e[d]=0}for(d=0;d<f.t;++d){e[d+b.t]=b.am(0,f[d],e,d,0,b.t)}e.s=0;e.clamp();if(this.s!=c.s){BigInteger.ZERO.subTo(e,e)}}function bnpSquareTo(d){var a=this.abs();var b=d.t=2*a.t;while(--b>=0){d[b]=0}for(b=0;b<a.t-1;++b){var e=a.am(b,a[b],d,2*b,0,1);if((d[b+a.t]+=a.am(b+1,2*a[b],d,2*b+1,e,a.t-b-1))>=a.DV){d[b+a.t]-=a.DV;d[b+a.t+1]=1}}if(d.t>0){d[d.t-1]+=a.am(b,a[b],d,2*b,0,1)}d.s=0;d.clamp()}function bnpDivRemTo(n,h,g){var w=n.abs();if(w.t<=0){return}var k=this.abs();if(k.t<w.t){if(h!=null){h.fromInt(0)}if(g!=null){this.copyTo(g)}return}if(g==null){g=nbi()}var d=nbi(),a=this.s,l=n.s;var v=this.DB-nbits(w[w.t-1]);if(v>0){w.lShiftTo(v,d);k.lShiftTo(v,g)}else{w.copyTo(d);k.copyTo(g)}var p=d.t;var b=d[p-1];if(b==0){return}var o=b*(1<<this.F1)+((p>1)?d[p-2]>>this.F2:0);var A=this.FV/o,z=(1<<this.F1)/o,x=1<<this.F2;var u=g.t,s=u-p,f=(h==null)?nbi():h;d.dlShiftTo(s,f);if(g.compareTo(f)>=0){g[g.t++]=1;g.subTo(f,g)}BigInteger.ONE.dlShiftTo(p,f);f.subTo(d,d);while(d.t<p){d[d.t++]=0}while(--s>=0){var c=(g[--u]==b)?this.DM:Math.floor(g[u]*A+(g[u-1]+x)*z);if((g[u]+=d.am(0,c,g,s,0,p))<c){d.dlShiftTo(s,f);g.subTo(f,g);while(g[u]<--c){g.subTo(f,g)}}}if(h!=null){g.drShiftTo(p,h);if(a!=l){BigInteger.ZERO.subTo(h,h)}}g.t=p;g.clamp();if(v>0){g.rShiftTo(v,g)}if(a<0){BigInteger.ZERO.subTo(g,g)}}function bnMod(b){var c=nbi();this.abs().divRemTo(b,null,c);if(this.s<0&&c.compareTo(BigInteger.ZERO)>0){b.subTo(c,c)}return c}function Classic(a){this.m=a}function cConvert(a){if(a.s<0||a.compareTo(this.m)>=0){return a.mod(this.m)}else{return a}}function cRevert(a){return a}function cReduce(a){a.divRemTo(this.m,null,a)}function cMulTo(a,c,b){a.multiplyTo(c,b);this.reduce(b)}function cSqrTo(a,b){a.squareTo(b);this.reduce(b)}Classic.prototype.convert=cConvert;Classic.prototype.revert=cRevert;Classic.prototype.reduce=cReduce;Classic.prototype.mulTo=cMulTo;Classic.prototype.sqrTo=cSqrTo;function bnpInvDigit(){if(this.t<1){return 0}var a=this[0];if((a&1)==0){return 0}var b=a&3;b=(b*(2-(a&15)*b))&15;b=(b*(2-(a&255)*b))&255;b=(b*(2-(((a&65535)*b)&65535)))&65535;b=(b*(2-a*b%this.DV))%this.DV;return(b>0)?this.DV-b:-b}function Montgomery(a){this.m=a;this.mp=a.invDigit();this.mpl=this.mp&32767;this.mph=this.mp>>15;this.um=(1<<(a.DB-15))-1;this.mt2=2*a.t}function montConvert(a){var b=nbi();a.abs().dlShiftTo(this.m.t,b);b.divRemTo(this.m,null,b);if(a.s<0&&b.compareTo(BigInteger.ZERO)>0){this.m.subTo(b,b)}return b}function montRevert(a){var b=nbi();a.copyTo(b);this.reduce(b);return b}function montReduce(a){while(a.t<=this.mt2){a[a.t++]=0}for(var c=0;c<this.m.t;++c){var b=a[c]&32767;var d=(b*this.mpl+(((b*this.mph+(a[c]>>15)*this.mpl)&this.um)<<15))&a.DM;b=c+this.m.t;a[b]+=this.m.am(0,d,a,c,0,this.m.t);while(a[b]>=a.DV){a[b]-=a.DV;a[++b]++}}a.clamp();a.drShiftTo(this.m.t,a);if(a.compareTo(this.m)>=0){a.subTo(this.m,a)}}function montSqrTo(a,b){a.squareTo(b);this.reduce(b)}function montMulTo(a,c,b){a.multiplyTo(c,b);this.reduce(b)}Montgomery.prototype.convert=montConvert;Montgomery.prototype.revert=montRevert;Montgomery.prototype.reduce=montReduce;Montgomery.prototype.mulTo=montMulTo;Montgomery.prototype.sqrTo=montSqrTo;function bnpIsEven(){return((this.t>0)?(this[0]&1):this.s)==0}function bnpExp(h,j){if(h>4294967295||h<1){return BigInteger.ONE}var f=nbi(),a=nbi(),d=j.convert(this),c=nbits(h)-1;d.copyTo(f);while(--c>=0){j.sqrTo(f,a);if((h&(1<<c))>0){j.mulTo(a,d,f)}else{var b=f;f=a;a=b}}return j.revert(f)}function bnModPowInt(b,a){var c;if(b<256||a.isEven()){c=new Classic(a)}else{c=new Montgomery(a)}return this.exp(b,c)}BigInteger.prototype.copyTo=bnpCopyTo;BigInteger.prototype.fromInt=bnpFromInt;BigInteger.prototype.fromString=bnpFromString;BigInteger.prototype.clamp=bnpClamp;BigInteger.prototype.dlShiftTo=bnpDLShiftTo;BigInteger.prototype.drShiftTo=bnpDRShiftTo;BigInteger.prototype.lShiftTo=bnpLShiftTo;BigInteger.prototype.rShiftTo=bnpRShiftTo;BigInteger.prototype.subTo=bnpSubTo;BigInteger.prototype.multiplyTo=bnpMultiplyTo;BigInteger.prototype.squareTo=bnpSquareTo;BigInteger.prototype.divRemTo=bnpDivRemTo;BigInteger.prototype.invDigit=bnpInvDigit;BigInteger.prototype.isEven=bnpIsEven;BigInteger.prototype.exp=bnpExp;BigInteger.prototype.toString=bnToString;BigInteger.prototype.negate=bnNegate;BigInteger.prototype.abs=bnAbs;BigInteger.prototype.compareTo=bnCompareTo;BigInteger.prototype.bitLength=bnBitLength;BigInteger.prototype.mod=bnMod;BigInteger.prototype.modPowInt=bnModPowInt;BigInteger.ZERO=nbv(0);BigInteger.ONE=nbv(1);
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function bnClone(){var a=nbi();this.copyTo(a);return a}function bnIntValue(){if(this.s<0){if(this.t==1){return this[0]-this.DV}else{if(this.t==0){return -1}}}else{if(this.t==1){return this[0]}else{if(this.t==0){return 0}}}return((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0]}function bnByteValue(){return(this.t==0)?this.s:(this[0]<<24)>>24}function bnShortValue(){return(this.t==0)?this.s:(this[0]<<16)>>16}function bnpChunkSize(a){return Math.floor(Math.LN2*this.DB/Math.log(a))}function bnSigNum(){if(this.s<0){return -1}else{if(this.t<=0||(this.t==1&&this[0]<=0)){return 0}else{return 1}}}function bnpToRadix(c){if(c==null){c=10}if(this.signum()==0||c<2||c>36){return"0"}var f=this.chunkSize(c);var e=Math.pow(c,f);var i=nbv(e),j=nbi(),h=nbi(),g="";this.divRemTo(i,j,h);while(j.signum()>0){g=(e+h.intValue()).toString(c).substr(1)+g;j.divRemTo(i,j,h)}return h.intValue().toString(c)+g}function bnpFromRadix(m,h){this.fromInt(0);if(h==null){h=10}var f=this.chunkSize(h);var g=Math.pow(h,f),e=false,a=0,l=0;for(var c=0;c<m.length;++c){var k=intAt(m,c);if(k<0){if(m.charAt(c)=="-"&&this.signum()==0){e=true}continue}l=h*l+k;if(++a>=f){this.dMultiply(g);this.dAddOffset(l,0);a=0;l=0}}if(a>0){this.dMultiply(Math.pow(h,a));this.dAddOffset(l,0)}if(e){BigInteger.ZERO.subTo(this,this)}}function bnpFromNumber(f,e,h){if("number"==typeof e){if(f<2){this.fromInt(1)}else{this.fromNumber(f,h);if(!this.testBit(f-1)){this.bitwiseTo(BigInteger.ONE.shiftLeft(f-1),op_or,this)}if(this.isEven()){this.dAddOffset(1,0)}while(!this.isProbablePrime(e)){this.dAddOffset(2,0);if(this.bitLength()>f){this.subTo(BigInteger.ONE.shiftLeft(f-1),this)}}}}else{var d=new Array(),g=f&7;d.length=(f>>3)+1;e.nextBytes(d);if(g>0){d[0]&=((1<<g)-1)}else{d[0]=0}this.fromString(d,256)}}function bnToByteArray(){var b=this.t,c=new Array();c[0]=this.s;var e=this.DB-(b*this.DB)%8,f,a=0;if(b-->0){if(e<this.DB&&(f=this[b]>>e)!=(this.s&this.DM)>>e){c[a++]=f|(this.s<<(this.DB-e))}while(b>=0){if(e<8){f=(this[b]&((1<<e)-1))<<(8-e);f|=this[--b]>>(e+=this.DB-8)}else{f=(this[b]>>(e-=8))&255;if(e<=0){e+=this.DB;--b}}if((f&128)!=0){f|=-256}if(a==0&&(this.s&128)!=(f&128)){++a}if(a>0||f!=this.s){c[a++]=f}}}return c}function bnEquals(b){return(this.compareTo(b)==0)}function bnMin(b){return(this.compareTo(b)<0)?this:b}function bnMax(b){return(this.compareTo(b)>0)?this:b}function bnpBitwiseTo(c,h,e){var d,g,b=Math.min(c.t,this.t);for(d=0;d<b;++d){e[d]=h(this[d],c[d])}if(c.t<this.t){g=c.s&this.DM;for(d=b;d<this.t;++d){e[d]=h(this[d],g)}e.t=this.t}else{g=this.s&this.DM;for(d=b;d<c.t;++d){e[d]=h(g,c[d])}e.t=c.t}e.s=h(this.s,c.s);e.clamp()}function op_and(a,b){return a&b}function bnAnd(b){var c=nbi();this.bitwiseTo(b,op_and,c);return c}function op_or(a,b){return a|b}function bnOr(b){var c=nbi();this.bitwiseTo(b,op_or,c);return c}function op_xor(a,b){return a^b}function bnXor(b){var c=nbi();this.bitwiseTo(b,op_xor,c);return c}function op_andnot(a,b){return a&~b}function bnAndNot(b){var c=nbi();this.bitwiseTo(b,op_andnot,c);return c}function bnNot(){var b=nbi();for(var a=0;a<this.t;++a){b[a]=this.DM&~this[a]}b.t=this.t;b.s=~this.s;return b}function bnShiftLeft(b){var a=nbi();if(b<0){this.rShiftTo(-b,a)}else{this.lShiftTo(b,a)}return a}function bnShiftRight(b){var a=nbi();if(b<0){this.lShiftTo(-b,a)}else{this.rShiftTo(b,a)}return a}function lbit(a){if(a==0){return -1}var b=0;if((a&65535)==0){a>>=16;b+=16}if((a&255)==0){a>>=8;b+=8}if((a&15)==0){a>>=4;b+=4}if((a&3)==0){a>>=2;b+=2}if((a&1)==0){++b}return b}function bnGetLowestSetBit(){for(var a=0;a<this.t;++a){if(this[a]!=0){return a*this.DB+lbit(this[a])}}if(this.s<0){return this.t*this.DB}return -1}function cbit(a){var b=0;while(a!=0){a&=a-1;++b}return b}function bnBitCount(){var c=0,a=this.s&this.DM;for(var b=0;b<this.t;++b){c+=cbit(this[b]^a)}return c}function bnTestBit(b){var a=Math.floor(b/this.DB);if(a>=this.t){return(this.s!=0)}return((this[a]&(1<<(b%this.DB)))!=0)}function bnpChangeBit(c,b){var a=BigInteger.ONE.shiftLeft(c);this.bitwiseTo(a,b,a);return a}function bnSetBit(a){return this.changeBit(a,op_or)}function bnClearBit(a){return this.changeBit(a,op_andnot)}function bnFlipBit(a){return this.changeBit(a,op_xor)}function bnpAddTo(d,f){var e=0,g=0,b=Math.min(d.t,this.t);while(e<b){g+=this[e]+d[e];f[e++]=g&this.DM;g>>=this.DB}if(d.t<this.t){g+=d.s;while(e<this.t){g+=this[e];f[e++]=g&this.DM;g>>=this.DB}g+=this.s}else{g+=this.s;while(e<d.t){g+=d[e];f[e++]=g&this.DM;g>>=this.DB}g+=d.s}f.s=(g<0)?-1:0;if(g>0){f[e++]=g}else{if(g<-1){f[e++]=this.DV+g}}f.t=e;f.clamp()}function bnAdd(b){var c=nbi();this.addTo(b,c);return c}function bnSubtract(b){var c=nbi();this.subTo(b,c);return c}function bnMultiply(b){var c=nbi();this.multiplyTo(b,c);return c}function bnSquare(){var a=nbi();this.squareTo(a);return a}function bnDivide(b){var c=nbi();this.divRemTo(b,c,null);return c}function bnRemainder(b){var c=nbi();this.divRemTo(b,null,c);return c}function bnDivideAndRemainder(b){var d=nbi(),c=nbi();this.divRemTo(b,d,c);return new Array(d,c)}function bnpDMultiply(a){this[this.t]=this.am(0,a-1,this,0,0,this.t);++this.t;this.clamp()}function bnpDAddOffset(b,a){if(b==0){return}while(this.t<=a){this[this.t++]=0}this[a]+=b;while(this[a]>=this.DV){this[a]-=this.DV;if(++a>=this.t){this[this.t++]=0}++this[a]}}function NullExp(){}function nNop(a){return a}function nMulTo(a,c,b){a.multiplyTo(c,b)}function nSqrTo(a,b){a.squareTo(b)}NullExp.prototype.convert=nNop;NullExp.prototype.revert=nNop;NullExp.prototype.mulTo=nMulTo;NullExp.prototype.sqrTo=nSqrTo;function bnPow(a){return this.exp(a,new NullExp())}function bnpMultiplyLowerTo(b,f,e){var d=Math.min(this.t+b.t,f);e.s=0;e.t=d;while(d>0){e[--d]=0}var c;for(c=e.t-this.t;d<c;++d){e[d+this.t]=this.am(0,b[d],e,d,0,this.t)}for(c=Math.min(b.t,f);d<c;++d){this.am(0,b[d],e,d,0,f-d)}e.clamp()}function bnpMultiplyUpperTo(b,e,d){--e;var c=d.t=this.t+b.t-e;d.s=0;while(--c>=0){d[c]=0}for(c=Math.max(e-this.t,0);c<b.t;++c){d[this.t+c-e]=this.am(e-c,b[c],d,0,0,this.t+c-e)}d.clamp();d.drShiftTo(1,d)}function Barrett(a){this.r2=nbi();this.q3=nbi();BigInteger.ONE.dlShiftTo(2*a.t,this.r2);this.mu=this.r2.divide(a);this.m=a}function barrettConvert(a){if(a.s<0||a.t>2*this.m.t){return a.mod(this.m)}else{if(a.compareTo(this.m)<0){return a}else{var b=nbi();a.copyTo(b);this.reduce(b);return b}}}function barrettRevert(a){return a}function barrettReduce(a){a.drShiftTo(this.m.t-1,this.r2);if(a.t>this.m.t+1){a.t=this.m.t+1;a.clamp()}this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);while(a.compareTo(this.r2)<0){a.dAddOffset(1,this.m.t+1)}a.subTo(this.r2,a);while(a.compareTo(this.m)>=0){a.subTo(this.m,a)}}function barrettSqrTo(a,b){a.squareTo(b);this.reduce(b)}function barrettMulTo(a,c,b){a.multiplyTo(c,b);this.reduce(b)}Barrett.prototype.convert=barrettConvert;Barrett.prototype.revert=barrettRevert;Barrett.prototype.reduce=barrettReduce;Barrett.prototype.mulTo=barrettMulTo;Barrett.prototype.sqrTo=barrettSqrTo;function bnModPow(q,f){var o=q.bitLength(),h,b=nbv(1),v;if(o<=0){return b}else{if(o<18){h=1}else{if(o<48){h=3}else{if(o<144){h=4}else{if(o<768){h=5}else{h=6}}}}}if(o<8){v=new Classic(f)}else{if(f.isEven()){v=new Barrett(f)}else{v=new Montgomery(f)}}var p=new Array(),d=3,s=h-1,a=(1<<h)-1;p[1]=v.convert(this);if(h>1){var A=nbi();v.sqrTo(p[1],A);while(d<=a){p[d]=nbi();v.mulTo(A,p[d-2],p[d]);d+=2}}var l=q.t-1,x,u=true,c=nbi(),y;o=nbits(q[l])-1;while(l>=0){if(o>=s){x=(q[l]>>(o-s))&a}else{x=(q[l]&((1<<(o+1))-1))<<(s-o);if(l>0){x|=q[l-1]>>(this.DB+o-s)}}d=h;while((x&1)==0){x>>=1;--d}if((o-=d)<0){o+=this.DB;--l}if(u){p[x].copyTo(b);u=false}else{while(d>1){v.sqrTo(b,c);v.sqrTo(c,b);d-=2}if(d>0){v.sqrTo(b,c)}else{y=b;b=c;c=y}v.mulTo(c,p[x],b)}while(l>=0&&(q[l]&(1<<o))==0){v.sqrTo(b,c);y=b;b=c;c=y;if(--o<0){o=this.DB-1;--l}}}return v.revert(b)}function bnGCD(c){var b=(this.s<0)?this.negate():this.clone();var h=(c.s<0)?c.negate():c.clone();if(b.compareTo(h)<0){var e=b;b=h;h=e}var d=b.getLowestSetBit(),f=h.getLowestSetBit();if(f<0){return b}if(d<f){f=d}if(f>0){b.rShiftTo(f,b);h.rShiftTo(f,h)}while(b.signum()>0){if((d=b.getLowestSetBit())>0){b.rShiftTo(d,b)}if((d=h.getLowestSetBit())>0){h.rShiftTo(d,h)}if(b.compareTo(h)>=0){b.subTo(h,b);b.rShiftTo(1,b)}else{h.subTo(b,h);h.rShiftTo(1,h)}}if(f>0){h.lShiftTo(f,h)}return h}function bnpModInt(e){if(e<=0){return 0}var c=this.DV%e,b=(this.s<0)?e-1:0;if(this.t>0){if(c==0){b=this[0]%e}else{for(var a=this.t-1;a>=0;--a){b=(c*b+this[a])%e}}}return b}function bnModInverse(f){var j=f.isEven();if((this.isEven()&&j)||f.signum()==0){return BigInteger.ZERO}var i=f.clone(),h=this.clone();var g=nbv(1),e=nbv(0),l=nbv(0),k=nbv(1);while(i.signum()!=0){while(i.isEven()){i.rShiftTo(1,i);if(j){if(!g.isEven()||!e.isEven()){g.addTo(this,g);e.subTo(f,e)}g.rShiftTo(1,g)}else{if(!e.isEven()){e.subTo(f,e)}}e.rShiftTo(1,e)}while(h.isEven()){h.rShiftTo(1,h);if(j){if(!l.isEven()||!k.isEven()){l.addTo(this,l);k.subTo(f,k)}l.rShiftTo(1,l)}else{if(!k.isEven()){k.subTo(f,k)}}k.rShiftTo(1,k)}if(i.compareTo(h)>=0){i.subTo(h,i);if(j){g.subTo(l,g)}e.subTo(k,e)}else{h.subTo(i,h);if(j){l.subTo(g,l)}k.subTo(e,k)}}if(h.compareTo(BigInteger.ONE)!=0){return BigInteger.ZERO}if(k.compareTo(f)>=0){return k.subtract(f)}if(k.signum()<0){k.addTo(f,k)}else{return k}if(k.signum()<0){return k.add(f)}else{return k}}var lowprimes=[2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];var lplim=(1<<26)/lowprimes[lowprimes.length-1];function bnIsProbablePrime(e){var d,b=this.abs();if(b.t==1&&b[0]<=lowprimes[lowprimes.length-1]){for(d=0;d<lowprimes.length;++d){if(b[0]==lowprimes[d]){return true}}return false}if(b.isEven()){return false}d=1;while(d<lowprimes.length){var a=lowprimes[d],c=d+1;while(c<lowprimes.length&&a<lplim){a*=lowprimes[c++]}a=b.modInt(a);while(d<c){if(a%lowprimes[d++]==0){return false}}}return b.millerRabin(e)}function bnpMillerRabin(f){var g=this.subtract(BigInteger.ONE);var c=g.getLowestSetBit();if(c<=0){return false}var h=g.shiftRight(c);f=(f+1)>>1;if(f>lowprimes.length){f=lowprimes.length}var b=nbi();for(var e=0;e<f;++e){b.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);var l=b.modPow(h,this);if(l.compareTo(BigInteger.ONE)!=0&&l.compareTo(g)!=0){var d=1;while(d++<c&&l.compareTo(g)!=0){l=l.modPowInt(2,this);if(l.compareTo(BigInteger.ONE)==0){return false}}if(l.compareTo(g)!=0){return false}}}return true}BigInteger.prototype.chunkSize=bnpChunkSize;BigInteger.prototype.toRadix=bnpToRadix;BigInteger.prototype.fromRadix=bnpFromRadix;BigInteger.prototype.fromNumber=bnpFromNumber;BigInteger.prototype.bitwiseTo=bnpBitwiseTo;BigInteger.prototype.changeBit=bnpChangeBit;BigInteger.prototype.addTo=bnpAddTo;BigInteger.prototype.dMultiply=bnpDMultiply;BigInteger.prototype.dAddOffset=bnpDAddOffset;BigInteger.prototype.multiplyLowerTo=bnpMultiplyLowerTo;BigInteger.prototype.multiplyUpperTo=bnpMultiplyUpperTo;BigInteger.prototype.modInt=bnpModInt;BigInteger.prototype.millerRabin=bnpMillerRabin;BigInteger.prototype.clone=bnClone;BigInteger.prototype.intValue=bnIntValue;BigInteger.prototype.byteValue=bnByteValue;BigInteger.prototype.shortValue=bnShortValue;BigInteger.prototype.signum=bnSigNum;BigInteger.prototype.toByteArray=bnToByteArray;BigInteger.prototype.equals=bnEquals;BigInteger.prototype.min=bnMin;BigInteger.prototype.max=bnMax;BigInteger.prototype.and=bnAnd;BigInteger.prototype.or=bnOr;BigInteger.prototype.xor=bnXor;BigInteger.prototype.andNot=bnAndNot;BigInteger.prototype.not=bnNot;BigInteger.prototype.shiftLeft=bnShiftLeft;BigInteger.prototype.shiftRight=bnShiftRight;BigInteger.prototype.getLowestSetBit=bnGetLowestSetBit;BigInteger.prototype.bitCount=bnBitCount;BigInteger.prototype.testBit=bnTestBit;BigInteger.prototype.setBit=bnSetBit;BigInteger.prototype.clearBit=bnClearBit;BigInteger.prototype.flipBit=bnFlipBit;BigInteger.prototype.add=bnAdd;BigInteger.prototype.subtract=bnSubtract;BigInteger.prototype.multiply=bnMultiply;BigInteger.prototype.divide=bnDivide;BigInteger.prototype.remainder=bnRemainder;BigInteger.prototype.divideAndRemainder=bnDivideAndRemainder;BigInteger.prototype.modPow=bnModPow;BigInteger.prototype.modInverse=bnModInverse;BigInteger.prototype.pow=bnPow;BigInteger.prototype.gcd=bnGCD;BigInteger.prototype.isProbablePrime=bnIsProbablePrime;BigInteger.prototype.square=bnSquare;
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function Arcfour(){this.i=0;this.j=0;this.S=new Array()}function ARC4init(d){var c,a,b;for(c=0;c<256;++c){this.S[c]=c}a=0;for(c=0;c<256;++c){a=(a+this.S[c]+d[c%d.length])&255;b=this.S[c];this.S[c]=this.S[a];this.S[a]=b}this.i=0;this.j=0}function ARC4next(){var a;this.i=(this.i+1)&255;this.j=(this.j+this.S[this.i])&255;a=this.S[this.i];this.S[this.i]=this.S[this.j];this.S[this.j]=a;return this.S[(a+this.S[this.i])&255]}Arcfour.prototype.init=ARC4init;Arcfour.prototype.next=ARC4next;function prng_newstate(){return new Arcfour()}var rng_psize=256;
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
var rng_state;var rng_pool;var rng_pptr;function rng_seed_int(a){rng_pool[rng_pptr++]^=a&255;rng_pool[rng_pptr++]^=(a>>8)&255;rng_pool[rng_pptr++]^=(a>>16)&255;rng_pool[rng_pptr++]^=(a>>24)&255;if(rng_pptr>=rng_psize){rng_pptr-=rng_psize}}function rng_seed_time(){rng_seed_int(new Date().getTime())}if(rng_pool==null){rng_pool=new Array();rng_pptr=0;var t;if(window!==undefined&&(window.crypto!==undefined||window.msCrypto!==undefined)){var crypto=window.crypto||window.msCrypto;if(crypto.getRandomValues){var ua=new Uint8Array(32);crypto.getRandomValues(ua);for(t=0;t<32;++t){rng_pool[rng_pptr++]=ua[t]}}else{if(navigator.appName=="Netscape"&&navigator.appVersion<"5"){var z=window.crypto.random(32);for(t=0;t<z.length;++t){rng_pool[rng_pptr++]=z.charCodeAt(t)&255}}}}while(rng_pptr<rng_psize){t=Math.floor(65536*Math.random());rng_pool[rng_pptr++]=t>>>8;rng_pool[rng_pptr++]=t&255}rng_pptr=0;rng_seed_time()}function rng_get_byte(){if(rng_state==null){rng_seed_time();rng_state=prng_newstate();rng_state.init(rng_pool);for(rng_pptr=0;rng_pptr<rng_pool.length;++rng_pptr){rng_pool[rng_pptr]=0}rng_pptr=0}return rng_state.next()}function rng_get_bytes(b){var a;for(a=0;a<b.length;++a){b[a]=rng_get_byte()}}function SecureRandom(){}SecureRandom.prototype.nextBytes=rng_get_bytes;
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function parseBigInt(b,a){return new BigInteger(b,a)}function linebrk(c,d){var a="";var b=0;while(b+d<c.length){a+=c.substring(b,b+d)+"\n";b+=d}return a+c.substring(b,c.length)}function byte2Hex(a){if(a<16){return"0"+a.toString(16)}else{return a.toString(16)}}function pkcs1pad2(e,h){if(h<e.length+11){throw"Message too long for RSA";return null}var g=new Array();var d=e.length-1;while(d>=0&&h>0){var f=e.charCodeAt(d--);if(f<128){g[--h]=f}else{if((f>127)&&(f<2048)){g[--h]=(f&63)|128;g[--h]=(f>>6)|192}else{g[--h]=(f&63)|128;g[--h]=((f>>6)&63)|128;g[--h]=(f>>12)|224}}}g[--h]=0;var b=new SecureRandom();var a=new Array();while(h>2){a[0]=0;while(a[0]==0){b.nextBytes(a)}g[--h]=a[0]}g[--h]=2;g[--h]=0;return new BigInteger(g)}function oaep_mgf1_arr(c,a,e){var b="",d=0;while(b.length<a){b+=e(String.fromCharCode.apply(String,c.concat([(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255])));d+=1}return b}function oaep_pad(q,a,f,l){var c=KJUR.crypto.MessageDigest;var o=KJUR.crypto.Util;var b=null;if(!f){f="sha1"}if(typeof f==="string"){b=c.getCanonicalAlgName(f);l=c.getHashLength(b);f=function(i){return hextorstr(o.hashHex(rstrtohex(i),b))}}if(q.length+2*l+2>a){throw"Message too long for RSA"}var k="",e;for(e=0;e<a-q.length-2*l-2;e+=1){k+="\x00"}var h=f("")+k+"\x01"+q;var g=new Array(l);new SecureRandom().nextBytes(g);var j=oaep_mgf1_arr(g,h.length,f);var p=[];for(e=0;e<h.length;e+=1){p[e]=h.charCodeAt(e)^j.charCodeAt(e)}var m=oaep_mgf1_arr(p,g.length,f);var d=[0];for(e=0;e<g.length;e+=1){d[e+1]=g[e]^m.charCodeAt(e)}return new BigInteger(d.concat(p))}function RSAKey(){this.n=null;this.e=0;this.d=null;this.p=null;this.q=null;this.dmp1=null;this.dmq1=null;this.coeff=null}function RSASetPublic(b,a){this.isPublic=true;this.isPrivate=false;if(typeof b!=="string"){this.n=b;this.e=a}else{if(b!=null&&a!=null&&b.length>0&&a.length>0){this.n=parseBigInt(b,16);this.e=parseInt(a,16)}else{throw"Invalid RSA public key"}}}function RSADoPublic(a){return a.modPowInt(this.e,this.n)}function RSAEncrypt(d){var a=pkcs1pad2(d,(this.n.bitLength()+7)>>3);if(a==null){return null}var e=this.doPublic(a);if(e==null){return null}var b=e.toString(16);if((b.length&1)==0){return b}else{return"0"+b}}function RSAEncryptOAEP(f,e,b){var a=oaep_pad(f,(this.n.bitLength()+7)>>3,e,b);if(a==null){return null}var g=this.doPublic(a);if(g==null){return null}var d=g.toString(16);if((d.length&1)==0){return d}else{return"0"+d}}RSAKey.prototype.doPublic=RSADoPublic;RSAKey.prototype.setPublic=RSASetPublic;RSAKey.prototype.encrypt=RSAEncrypt;RSAKey.prototype.encryptOAEP=RSAEncryptOAEP;RSAKey.prototype.type="RSA";
/*! (c) Tom Wu, Kenji Urushima | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function pkcs1unpad2(g,j){var a=g.toByteArray();var f=0;while(f<a.length&&a[f]==0){++f}if(a.length-f!=j-1||a[f]!=2){return null}++f;while(a[f]!=0){if(++f>=a.length){return null}}var e="";while(++f<a.length){var h=a[f]&255;if(h<128){e+=String.fromCharCode(h)}else{if((h>191)&&(h<224)){e+=String.fromCharCode(((h&31)<<6)|(a[f+1]&63));++f}else{e+=String.fromCharCode(((h&15)<<12)|((a[f+1]&63)<<6)|(a[f+2]&63));f+=2}}}return e}function oaep_mgf1_str(c,a,e){var b="",d=0;while(b.length<a){b+=e(c+String.fromCharCode.apply(String,[(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255]));d+=1}return b}function oaep_unpad(o,b,g,p){var e=KJUR.crypto.MessageDigest;var r=KJUR.crypto.Util;var c=null;if(!g){g="sha1"}if(typeof g==="string"){c=e.getCanonicalAlgName(g);p=e.getHashLength(c);g=function(d){return hextorstr(r.hashHex(rstrtohex(d),c))}}o=o.toByteArray();var h;for(h=0;h<o.length;h+=1){o[h]&=255}while(o.length<b){o.unshift(0)}o=String.fromCharCode.apply(String,o);if(o.length<2*p+2){throw"Cipher too short"}var f=o.substr(1,p);var s=o.substr(p+1);var q=oaep_mgf1_str(s,p,g);var k=[],h;for(h=0;h<f.length;h+=1){k[h]=f.charCodeAt(h)^q.charCodeAt(h)}var l=oaep_mgf1_str(String.fromCharCode.apply(String,k),o.length-p,g);var j=[];for(h=0;h<s.length;h+=1){j[h]=s.charCodeAt(h)^l.charCodeAt(h)}j=String.fromCharCode.apply(String,j);if(j.substr(0,p)!==g("")){throw"Hash mismatch"}j=j.substr(p);var a=j.indexOf("\x01");var m=(a!=-1)?j.substr(0,a).lastIndexOf("\x00"):-1;if(m+1!=a){throw"Malformed data"}return j.substr(a+1)}function RSASetPrivate(c,a,b){this.isPrivate=true;if(typeof c!=="string"){this.n=c;this.e=a;this.d=b}else{if(c!=null&&a!=null&&c.length>0&&a.length>0){this.n=parseBigInt(c,16);this.e=parseInt(a,16);this.d=parseBigInt(b,16)}else{throw"Invalid RSA private key"}}}function RSASetPrivateEx(g,d,e,c,b,a,h,f){this.isPrivate=true;this.isPublic=false;if(g==null){throw"RSASetPrivateEx N == null"}if(d==null){throw"RSASetPrivateEx E == null"}if(g.length==0){throw"RSASetPrivateEx N.length == 0"}if(d.length==0){throw"RSASetPrivateEx E.length == 0"}if(g!=null&&d!=null&&g.length>0&&d.length>0){this.n=parseBigInt(g,16);this.e=parseInt(d,16);this.d=parseBigInt(e,16);this.p=parseBigInt(c,16);this.q=parseBigInt(b,16);this.dmp1=parseBigInt(a,16);this.dmq1=parseBigInt(h,16);this.coeff=parseBigInt(f,16)}else{throw"Invalid RSA private key in RSASetPrivateEx"}}function RSAGenerate(b,l){var a=new SecureRandom();var g=b>>1;this.e=parseInt(l,16);var c=new BigInteger(l,16);var d=(b/2)-100;var k=BigInteger.ONE.shiftLeft(d);for(;;){for(;;){this.p=new BigInteger(b-g,1,a);if(this.p.subtract(BigInteger.ONE).gcd(c).compareTo(BigInteger.ONE)==0&&this.p.isProbablePrime(10)){break}}for(;;){this.q=new BigInteger(g,1,a);if(this.q.subtract(BigInteger.ONE).gcd(c).compareTo(BigInteger.ONE)==0&&this.q.isProbablePrime(10)){break}}if(this.p.compareTo(this.q)<=0){var j=this.p;this.p=this.q;this.q=j}var h=this.q.subtract(this.p).abs();if(h.bitLength()<d||h.compareTo(k)<=0){continue}var i=this.p.subtract(BigInteger.ONE);var e=this.q.subtract(BigInteger.ONE);var f=i.multiply(e);if(f.gcd(c).compareTo(BigInteger.ONE)==0){this.n=this.p.multiply(this.q);if(this.n.bitLength()==b){this.d=c.modInverse(f);this.dmp1=this.d.mod(i);this.dmq1=this.d.mod(e);this.coeff=this.q.modInverse(this.p);break}}}this.isPrivate=true}function RSADoPrivate(a){if(this.p==null||this.q==null){return a.modPow(this.d,this.n)}var c=a.mod(this.p).modPow(this.dmp1,this.p);var b=a.mod(this.q).modPow(this.dmq1,this.q);while(c.compareTo(b)<0){c=c.add(this.p)}return c.subtract(b).multiply(this.coeff).mod(this.p).multiply(this.q).add(b)}function RSADecrypt(b){if(b.length!=Math.ceil(this.n.bitLength()/4)){throw new Error("wrong ctext length")}var d=parseBigInt(b,16);var a=this.doPrivate(d);if(a==null){return null}return pkcs1unpad2(a,(this.n.bitLength()+7)>>3)}function RSADecryptOAEP(e,d,b){if(e.length!=Math.ceil(this.n.bitLength()/4)){throw new Error("wrong ctext length")}var f=parseBigInt(e,16);var a=this.doPrivate(f);if(a==null){return null}return oaep_unpad(a,(this.n.bitLength()+7)>>3,d,b)}RSAKey.prototype.doPrivate=RSADoPrivate;RSAKey.prototype.setPrivate=RSASetPrivate;RSAKey.prototype.setPrivateEx=RSASetPrivateEx;RSAKey.prototype.generate=RSAGenerate;RSAKey.prototype.decrypt=RSADecrypt;RSAKey.prototype.decryptOAEP=RSADecryptOAEP;
/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
function ECFieldElementFp(b,a){this.x=a;this.q=b}function feFpEquals(a){if(a==this){return true}return(this.q.equals(a.q)&&this.x.equals(a.x))}function feFpToBigInteger(){return this.x}function feFpNegate(){return new ECFieldElementFp(this.q,this.x.negate().mod(this.q))}function feFpAdd(a){return new ECFieldElementFp(this.q,this.x.add(a.toBigInteger()).mod(this.q))}function feFpSubtract(a){return new ECFieldElementFp(this.q,this.x.subtract(a.toBigInteger()).mod(this.q))}function feFpMultiply(a){return new ECFieldElementFp(this.q,this.x.multiply(a.toBigInteger()).mod(this.q))}function feFpSquare(){return new ECFieldElementFp(this.q,this.x.square().mod(this.q))}function feFpDivide(a){return new ECFieldElementFp(this.q,this.x.multiply(a.toBigInteger().modInverse(this.q)).mod(this.q))}ECFieldElementFp.prototype.equals=feFpEquals;ECFieldElementFp.prototype.toBigInteger=feFpToBigInteger;ECFieldElementFp.prototype.negate=feFpNegate;ECFieldElementFp.prototype.add=feFpAdd;ECFieldElementFp.prototype.subtract=feFpSubtract;ECFieldElementFp.prototype.multiply=feFpMultiply;ECFieldElementFp.prototype.square=feFpSquare;ECFieldElementFp.prototype.divide=feFpDivide;ECFieldElementFp.prototype.sqrt=function(){return new ECFieldElementFp(this.q,this.x.sqrt().mod(this.q))};function ECPointFp(c,a,d,b){this.curve=c;this.x=a;this.y=d;if(b==null){this.z=BigInteger.ONE}else{this.z=b}this.zinv=null}function pointFpGetX(){if(this.zinv==null){this.zinv=this.z.modInverse(this.curve.q)}return this.curve.fromBigInteger(this.x.toBigInteger().multiply(this.zinv).mod(this.curve.q))}function pointFpGetY(){if(this.zinv==null){this.zinv=this.z.modInverse(this.curve.q)}return this.curve.fromBigInteger(this.y.toBigInteger().multiply(this.zinv).mod(this.curve.q))}function pointFpEquals(a){if(a==this){return true}if(this.isInfinity()){return a.isInfinity()}if(a.isInfinity()){return this.isInfinity()}var c,b;c=a.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(a.z)).mod(this.curve.q);if(!c.equals(BigInteger.ZERO)){return false}b=a.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(a.z)).mod(this.curve.q);return b.equals(BigInteger.ZERO)}function pointFpIsInfinity(){if((this.x==null)&&(this.y==null)){return true}return this.z.equals(BigInteger.ZERO)&&!this.y.toBigInteger().equals(BigInteger.ZERO)}function pointFpNegate(){return new ECPointFp(this.curve,this.x,this.y.negate(),this.z)}function pointFpAdd(l){if(this.isInfinity()){return l}if(l.isInfinity()){return this}var p=l.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(l.z)).mod(this.curve.q);var o=l.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(l.z)).mod(this.curve.q);if(BigInteger.ZERO.equals(o)){if(BigInteger.ZERO.equals(p)){return this.twice()}return this.curve.getInfinity()}var j=new BigInteger("3");var e=this.x.toBigInteger();var n=this.y.toBigInteger();var c=l.x.toBigInteger();var k=l.y.toBigInteger();var m=o.square();var i=m.multiply(o);var d=e.multiply(m);var g=p.square().multiply(this.z);var a=g.subtract(d.shiftLeft(1)).multiply(l.z).subtract(i).multiply(o).mod(this.curve.q);var h=d.multiply(j).multiply(p).subtract(n.multiply(i)).subtract(g.multiply(p)).multiply(l.z).add(p.multiply(i)).mod(this.curve.q);var f=i.multiply(this.z).multiply(l.z).mod(this.curve.q);return new ECPointFp(this.curve,this.curve.fromBigInteger(a),this.curve.fromBigInteger(h),f)}function pointFpTwice(){if(this.isInfinity()){return this}if(this.y.toBigInteger().signum()==0){return this.curve.getInfinity()}var g=new BigInteger("3");var c=this.x.toBigInteger();var h=this.y.toBigInteger();var e=h.multiply(this.z);var j=e.multiply(h).mod(this.curve.q);var i=this.curve.a.toBigInteger();var k=c.square().multiply(g);if(!BigInteger.ZERO.equals(i)){k=k.add(this.z.square().multiply(i))}k=k.mod(this.curve.q);var b=k.square().subtract(c.shiftLeft(3).multiply(j)).shiftLeft(1).multiply(e).mod(this.curve.q);var f=k.multiply(g).multiply(c).subtract(j.shiftLeft(1)).shiftLeft(2).multiply(j).subtract(k.square().multiply(k)).mod(this.curve.q);var d=e.square().multiply(e).shiftLeft(3).mod(this.curve.q);return new ECPointFp(this.curve,this.curve.fromBigInteger(b),this.curve.fromBigInteger(f),d)}function pointFpMultiply(d){if(this.isInfinity()){return this}if(d.signum()==0){return this.curve.getInfinity()}var m=d;var l=m.multiply(new BigInteger("3"));var b=this.negate();var j=this;var q=this.curve.q.subtract(d);var o=q.multiply(new BigInteger("3"));var c=new ECPointFp(this.curve,this.x,this.y);var a=c.negate();var g;for(g=l.bitLength()-2;g>0;--g){j=j.twice();var n=l.testBit(g);var f=m.testBit(g);if(n!=f){j=j.add(n?this:b)}}for(g=o.bitLength()-2;g>0;--g){c=c.twice();var p=o.testBit(g);var r=q.testBit(g);if(p!=r){c=c.add(p?c:a)}}return j}function pointFpMultiplyTwo(c,a,b){var d;if(c.bitLength()>b.bitLength()){d=c.bitLength()-1}else{d=b.bitLength()-1}var f=this.curve.getInfinity();var e=this.add(a);while(d>=0){f=f.twice();if(c.testBit(d)){if(b.testBit(d)){f=f.add(e)}else{f=f.add(this)}}else{if(b.testBit(d)){f=f.add(a)}}--d}return f}ECPointFp.prototype.getX=pointFpGetX;ECPointFp.prototype.getY=pointFpGetY;ECPointFp.prototype.equals=pointFpEquals;ECPointFp.prototype.isInfinity=pointFpIsInfinity;ECPointFp.prototype.negate=pointFpNegate;ECPointFp.prototype.add=pointFpAdd;ECPointFp.prototype.twice=pointFpTwice;ECPointFp.prototype.multiply=pointFpMultiply;ECPointFp.prototype.multiplyTwo=pointFpMultiplyTwo;function ECCurveFp(e,d,c){this.q=e;this.a=this.fromBigInteger(d);this.b=this.fromBigInteger(c);this.infinity=new ECPointFp(this,null,null)}function curveFpGetQ(){return this.q}function curveFpGetA(){return this.a}function curveFpGetB(){return this.b}function curveFpEquals(a){if(a==this){return true}return(this.q.equals(a.q)&&this.a.equals(a.a)&&this.b.equals(a.b))}function curveFpGetInfinity(){return this.infinity}function curveFpFromBigInteger(a){return new ECFieldElementFp(this.q,a)}function curveFpDecodePointHex(m){switch(parseInt(m.substr(0,2),16)){case 0:return this.infinity;case 2:case 3:var c=m.substr(0,2);var l=m.substr(2);var j=this.fromBigInteger(new BigInteger(k,16));var i=this.getA();var h=this.getB();var e=j.square().add(i).multiply(j).add(h);var g=e.sqrt();if(c=="03"){g=g.negate()}return new ECPointFp(this,j,g);case 4:case 6:case 7:var d=(m.length-2)/2;var k=m.substr(2,d);var f=m.substr(d+2,d);return new ECPointFp(this,this.fromBigInteger(new BigInteger(k,16)),this.fromBigInteger(new BigInteger(f,16)));default:return null}}ECCurveFp.prototype.getQ=curveFpGetQ;ECCurveFp.prototype.getA=curveFpGetA;ECCurveFp.prototype.getB=curveFpGetB;ECCurveFp.prototype.equals=curveFpEquals;ECCurveFp.prototype.getInfinity=curveFpGetInfinity;ECCurveFp.prototype.fromBigInteger=curveFpFromBigInteger;ECCurveFp.prototype.decodePointHex=curveFpDecodePointHex;
/*! (c) Stefan Thomas | https://github.com/bitcoinjs/bitcoinjs-lib
 */
ECFieldElementFp.prototype.getByteLength=function(){return Math.floor((this.toBigInteger().bitLength()+7)/8)};ECPointFp.prototype.getEncoded=function(c){var d=function(h,f){var g=h.toByteArrayUnsigned();if(f<g.length){g=g.slice(g.length-f)}else{while(f>g.length){g.unshift(0)}}return g};var a=this.getX().toBigInteger();var e=this.getY().toBigInteger();var b=d(a,32);if(c){if(e.isEven()){b.unshift(2)}else{b.unshift(3)}}else{b.unshift(4);b=b.concat(d(e,32))}return b};ECPointFp.decodeFrom=function(g,c){var f=c[0];var e=c.length-1;var d=c.slice(1,1+e/2);var b=c.slice(1+e/2,1+e);d.unshift(0);b.unshift(0);var a=new BigInteger(d);var h=new BigInteger(b);return new ECPointFp(g,g.fromBigInteger(a),g.fromBigInteger(h))};ECPointFp.decodeFromHex=function(g,c){var f=c.substr(0,2);var e=c.length-2;var d=c.substr(2,e/2);var b=c.substr(2+e/2,e/2);var a=new BigInteger(d,16);var h=new BigInteger(b,16);return new ECPointFp(g,g.fromBigInteger(a),g.fromBigInteger(h))};ECPointFp.prototype.add2D=function(c){if(this.isInfinity()){return c}if(c.isInfinity()){return this}if(this.x.equals(c.x)){if(this.y.equals(c.y)){return this.twice()}return this.curve.getInfinity()}var g=c.x.subtract(this.x);var e=c.y.subtract(this.y);var a=e.divide(g);var d=a.square().subtract(this.x).subtract(c.x);var f=a.multiply(this.x.subtract(d)).subtract(this.y);return new ECPointFp(this.curve,d,f)};ECPointFp.prototype.twice2D=function(){if(this.isInfinity()){return this}if(this.y.toBigInteger().signum()==0){return this.curve.getInfinity()}var b=this.curve.fromBigInteger(BigInteger.valueOf(2));var e=this.curve.fromBigInteger(BigInteger.valueOf(3));var a=this.x.square().multiply(e).add(this.curve.a).divide(this.y.multiply(b));var c=a.square().subtract(this.x.multiply(b));var d=a.multiply(this.x.subtract(c)).subtract(this.y);return new ECPointFp(this.curve,c,d)};ECPointFp.prototype.multiply2D=function(b){if(this.isInfinity()){return this}if(b.signum()==0){return this.curve.getInfinity()}var g=b;var f=g.multiply(new BigInteger("3"));var l=this.negate();var d=this;var c;for(c=f.bitLength()-2;c>0;--c){d=d.twice();var a=f.testBit(c);var j=g.testBit(c);if(a!=j){d=d.add2D(a?this:l)}}return d};ECPointFp.prototype.isOnCurve=function(){var d=this.getX().toBigInteger();var i=this.getY().toBigInteger();var f=this.curve.getA().toBigInteger();var c=this.curve.getB().toBigInteger();var h=this.curve.getQ();var e=i.multiply(i).mod(h);var g=d.multiply(d).multiply(d).add(f.multiply(d)).add(c).mod(h);return e.equals(g)};ECPointFp.prototype.toString=function(){return"("+this.getX().toBigInteger().toString()+","+this.getY().toBigInteger().toString()+")"};ECPointFp.prototype.validate=function(){var c=this.curve.getQ();if(this.isInfinity()){throw new Error("Point is at infinity.")}var a=this.getX().toBigInteger();var b=this.getY().toBigInteger();if(a.compareTo(BigInteger.ONE)<0||a.compareTo(c.subtract(BigInteger.ONE))>0){throw new Error("x coordinate out of bounds")}if(b.compareTo(BigInteger.ONE)<0||b.compareTo(c.subtract(BigInteger.ONE))>0){throw new Error("y coordinate out of bounds")}if(!this.isOnCurve()){throw new Error("Point is not on the curve.")}if(this.multiply(c).isInfinity()){throw new Error("Point is not a scalar multiple of G.")}return true};
/*! Mike Samuel (c) 2009 | code.google.com/p/json-sans-eval
 */
var jsonParse=(function(){var e="(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)";var j='(?:[^\\0-\\x08\\x0a-\\x1f"\\\\]|\\\\(?:["/\\\\bfnrt]|u[0-9A-Fa-f]{4}))';var i='(?:"'+j+'*")';var d=new RegExp("(?:false|true|null|[\\{\\}\\[\\]]|"+e+"|"+i+")","g");var k=new RegExp("\\\\(?:([^u])|u(.{4}))","g");var g={'"':'"',"/":"/","\\":"\\",b:"\b",f:"\f",n:"\n",r:"\r",t:"\t"};function h(l,m,n){return m?g[m]:String.fromCharCode(parseInt(n,16))}var c=new String("");var a="\\";var f={"{":Object,"[":Array};var b=Object.hasOwnProperty;return function(u,q){var p=u.match(d);var x;var v=p[0];var l=false;if("{"===v){x={}}else{if("["===v){x=[]}else{x=[];l=true}}var t;var r=[x];for(var o=1-l,m=p.length;o<m;++o){v=p[o];var w;switch(v.charCodeAt(0)){default:w=r[0];w[t||w.length]=+(v);t=void 0;break;case 34:v=v.substring(1,v.length-1);if(v.indexOf(a)!==-1){v=v.replace(k,h)}w=r[0];if(!t){if(w instanceof Array){t=w.length}else{t=v||c;break}}w[t]=v;t=void 0;break;case 91:w=r[0];r.unshift(w[t||w.length]=[]);t=void 0;break;case 93:r.shift();break;case 102:w=r[0];w[t||w.length]=false;t=void 0;break;case 110:w=r[0];w[t||w.length]=null;t=void 0;break;case 116:w=r[0];w[t||w.length]=true;t=void 0;break;case 123:w=r[0];r.unshift(w[t||w.length]={});t=void 0;break;case 125:r.shift();break}}if(l){if(r.length!==1){throw new Error()}x=x[0]}else{if(r.length){throw new Error()}}if(q){var s=function(C,B){var D=C[B];if(D&&typeof D==="object"){var n=null;for(var z in D){if(b.call(D,z)&&D!==C){var y=s(D,z);if(y!==void 0){D[z]=y}else{if(!n){n=[]}n.push(z)}}}if(n){for(var A=n.length;--A>=0;){delete D[n[A]]}}}return q.call(C,B,D)};x=s({"":x},"")}return x}})();
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}KJUR.asn1.ASN1Util=new function(){this.integerToByteHex=function(a){var b=a.toString(16);if((b.length%2)==1){b="0"+b}return b};this.bigIntToMinTwosComplementsHex=function(j){var f=j.toString(16);if(f.substr(0,1)!="-"){if(f.length%2==1){f="0"+f}else{if(!f.match(/^[0-7]/)){f="00"+f}}}else{var a=f.substr(1);var e=a.length;if(e%2==1){e+=1}else{if(!f.match(/^[0-7]/)){e+=2}}var g="";for(var d=0;d<e;d++){g+="f"}var c=new BigInteger(g,16);var b=c.xor(j).add(BigInteger.ONE);f=b.toString(16).replace(/^-/,"")}return f};this.getPEMStringFromHex=function(a,b){return hextopem(a,b)};this.newObject=function(k){var F=KJUR,o=F.asn1,v=o.ASN1Object,B=o.DERBoolean,e=o.DERInteger,t=o.DERBitString,h=o.DEROctetString,x=o.DERNull,y=o.DERObjectIdentifier,m=o.DEREnumerated,g=o.DERUTF8String,f=o.DERNumericString,A=o.DERPrintableString,w=o.DERTeletexString,q=o.DERIA5String,E=o.DERUTCTime,j=o.DERGeneralizedTime,b=o.DERVisibleString,l=o.DERBMPString,n=o.DERSequence,c=o.DERSet,s=o.DERTaggedObject,p=o.ASN1Util.newObject;if(k instanceof o.ASN1Object){return k}var u=Object.keys(k);if(u.length!=1){throw new Error("key of param shall be only one.")}var H=u[0];if(":asn1:bool:int:bitstr:octstr:null:oid:enum:utf8str:numstr:prnstr:telstr:ia5str:utctime:gentime:visstr:bmpstr:seq:set:tag:".indexOf(":"+H+":")==-1){throw new Error("undefined key: "+H)}if(H=="bool"){return new B(k[H])}if(H=="int"){return new e(k[H])}if(H=="bitstr"){return new t(k[H])}if(H=="octstr"){return new h(k[H])}if(H=="null"){return new x(k[H])}if(H=="oid"){return new y(k[H])}if(H=="enum"){return new m(k[H])}if(H=="utf8str"){return new g(k[H])}if(H=="numstr"){return new f(k[H])}if(H=="prnstr"){return new A(k[H])}if(H=="telstr"){return new w(k[H])}if(H=="ia5str"){return new q(k[H])}if(H=="utctime"){return new E(k[H])}if(H=="gentime"){return new j(k[H])}if(H=="visstr"){return new b(k[H])}if(H=="bmpstr"){return new l(k[H])}if(H=="asn1"){return new v(k[H])}if(H=="seq"){var d=k[H];var G=[];for(var z=0;z<d.length;z++){var D=p(d[z]);G.push(D)}return new n({array:G})}if(H=="set"){var d=k[H];var G=[];for(var z=0;z<d.length;z++){var D=p(d[z]);G.push(D)}return new c({array:G})}if(H=="tag"){var C=k[H];if(Object.prototype.toString.call(C)==="[object Array]"&&C.length==3){var r=p(C[2]);return new s({tag:C[0],explicit:C[1],obj:r})}else{return new s(C)}}};this.jsonToASN1HEX=function(b){var a=this.newObject(b);return a.tohex()}};KJUR.asn1.ASN1Util.oidHexToInt=function(a){var j="";var k=parseInt(a.substr(0,2),16);var d=Math.floor(k/40);var c=k%40;var j=d+"."+c;var e="";for(var f=2;f<a.length;f+=2){var g=parseInt(a.substr(f,2),16);var h=("00000000"+g.toString(2)).slice(-8);e=e+h.substr(1,7);if(h.substr(0,1)=="0"){var b=new BigInteger(e,2);j=j+"."+b.toString(10);e=""}}return j};KJUR.asn1.ASN1Util.oidIntToHex=function(f){var e=function(a){var k=a.toString(16);if(k.length==1){k="0"+k}return k};var d=function(o){var n="";var k=new BigInteger(o,10);var a=k.toString(2);var l=7-a.length%7;if(l==7){l=0}var q="";for(var m=0;m<l;m++){q+="0"}a=q+a;for(var m=0;m<a.length-1;m+=7){var p=a.substr(m,7);if(m!=a.length-7){p="1"+p}n+=e(parseInt(p,2))}return n};if(!f.match(/^[0-9.]+$/)){throw"malformed oid string: "+f}var g="";var b=f.split(".");var j=parseInt(b[0])*40+parseInt(b[1]);g+=e(j);b.splice(0,2);for(var c=0;c<b.length;c++){g+=d(b[c])}return g};KJUR.asn1.ASN1Object=function(e){var c=true;var b=null;var d="00";var f="00";var a="";this.params=null;this.getLengthHexFromValue=function(){if(typeof this.hV=="undefined"||this.hV==null){throw new Error("this.hV is null or undefined")}if(this.hV.length%2==1){throw new Error("value hex must be even length: n="+a.length+",v="+this.hV)}var j=this.hV.length/2;var i=j.toString(16);if(i.length%2==1){i="0"+i}if(j<128){return i}else{var h=i.length/2;if(h>15){throw new Error("ASN.1 length too long to represent by 8x: n = "+j.toString(16))}var g=128+h;return g.toString(16)+i}};this.tohex=function(){if(this.hTLV==null||this.isModified){this.hV=this.getFreshValueHex();this.hL=this.getLengthHexFromValue();this.hTLV=this.hT+this.hL+this.hV;this.isModified=false}return this.hTLV};this.getEncodedHex=function(){return this.tohex()};this.getValueHex=function(){this.tohex();return this.hV};this.getFreshValueHex=function(){return""};this.setByParam=function(g){this.params=g};if(e!=undefined){if(e.tlv!=undefined){this.hTLV=e.tlv;this.isModified=false}}};KJUR.asn1.DERAbstractString=function(c){KJUR.asn1.DERAbstractString.superclass.constructor.call(this);var b=null;var a=null;this.getString=function(){return this.s};this.setString=function(d){this.hTLV=null;this.isModified=true;this.s=d;this.hV=utf8tohex(this.s).toLowerCase()};this.setStringHex=function(d){this.hTLV=null;this.isModified=true;this.s=null;this.hV=d};this.getFreshValueHex=function(){return this.hV};if(typeof c!="undefined"){if(typeof c=="string"){this.setString(c)}else{if(typeof c.str!="undefined"){this.setString(c.str)}else{if(typeof c.hex!="undefined"){this.setStringHex(c.hex)}}}}};extendClass(KJUR.asn1.DERAbstractString,KJUR.asn1.ASN1Object);KJUR.asn1.DERAbstractTime=function(c){KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);var b=null;var a=null;this.localDateToUTC=function(g){var e=g.getTime()+(g.getTimezoneOffset()*60000);var f=new Date(e);return f};this.formatDate=function(m,o,e){var g=this.zeroPadding;var n=this.localDateToUTC(m);var p=String(n.getFullYear());if(o=="utc"){p=p.substr(2,2)}var l=g(String(n.getMonth()+1),2);var q=g(String(n.getDate()),2);var h=g(String(n.getHours()),2);var i=g(String(n.getMinutes()),2);var j=g(String(n.getSeconds()),2);var r=p+l+q+h+i+j;if(e===true){var f=n.getMilliseconds();if(f!=0){var k=g(String(f),3);k=k.replace(/[0]+$/,"");r=r+"."+k}}return r+"Z"};this.zeroPadding=function(e,d){if(e.length>=d){return e}return new Array(d-e.length+1).join("0")+e};this.setByParam=function(d){this.hV=null;this.hTLV=null;this.params=d};this.getString=function(){return undefined};this.setString=function(d){this.hTLV=null;this.isModified=true;if(this.params==undefined){this.params={}}this.params.str=d};this.setByDate=function(d){this.hTLV=null;this.isModified=true;if(this.params==undefined){this.params={}}this.params.date=d};this.setByDateValue=function(h,j,e,d,f,g){var i=new Date(Date.UTC(h,j-1,e,d,f,g,0));this.setByDate(i)};this.getFreshValueHex=function(){return this.hV}};extendClass(KJUR.asn1.DERAbstractTime,KJUR.asn1.ASN1Object);KJUR.asn1.DERAbstractStructured=function(b){KJUR.asn1.DERAbstractString.superclass.constructor.call(this);var a=null;this.setByASN1ObjectArray=function(c){this.hTLV=null;this.isModified=true;this.asn1Array=c};this.appendASN1Object=function(c){this.hTLV=null;this.isModified=true;this.asn1Array.push(c)};this.asn1Array=new Array();if(typeof b!="undefined"){if(typeof b.array!="undefined"){this.asn1Array=b.array}}};extendClass(KJUR.asn1.DERAbstractStructured,KJUR.asn1.ASN1Object);KJUR.asn1.DERBoolean=function(a){KJUR.asn1.DERBoolean.superclass.constructor.call(this);this.hT="01";if(a==false){this.hTLV="010100"}else{this.hTLV="0101ff"}};extendClass(KJUR.asn1.DERBoolean,KJUR.asn1.ASN1Object);KJUR.asn1.DERInteger=function(a){KJUR.asn1.DERInteger.superclass.constructor.call(this);this.hT="02";this.setByBigInteger=function(b){this.hTLV=null;this.isModified=true;this.hV=KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(b)};this.setByInteger=function(c){var b=new BigInteger(String(c),10);this.setByBigInteger(b)};this.setValueHex=function(b){this.hV=b};this.getFreshValueHex=function(){return this.hV};if(typeof a!="undefined"){if(typeof a.bigint!="undefined"){this.setByBigInteger(a.bigint)}else{if(typeof a["int"]!="undefined"){this.setByInteger(a["int"])}else{if(typeof a=="number"){this.setByInteger(a)}else{if(typeof a.hex!="undefined"){this.setValueHex(a.hex)}}}}}};extendClass(KJUR.asn1.DERInteger,KJUR.asn1.ASN1Object);KJUR.asn1.DERBitString=function(b){if(b!==undefined&&typeof b.obj!=="undefined"){var a=KJUR.asn1.ASN1Util.newObject(b.obj);b.hex="00"+a.tohex()}KJUR.asn1.DERBitString.superclass.constructor.call(this);this.hT="03";this.setHexValueIncludingUnusedBits=function(c){this.hTLV=null;this.isModified=true;this.hV=c};this.setUnusedBitsAndHexValue=function(c,e){if(c<0||7<c){throw"unused bits shall be from 0 to 7: u = "+c}var d="0"+c;this.hTLV=null;this.isModified=true;this.hV=d+e};this.setByBinaryString=function(e){e=e.replace(/0+$/,"");var f=8-e.length%8;if(f==8){f=0}e+="0000000".substr(0,f);var j="";for(var g=0;g<e.length-1;g+=8){var d=e.substr(g,8);var c=parseInt(d,2).toString(16);if(c.length==1){c="0"+c}j+=c}this.hTLV=null;this.isModified=true;this.hV="0"+f+j};this.setByBooleanArray=function(e){var d="";for(var c=0;c<e.length;c++){if(e[c]==true){d+="1"}else{d+="0"}}this.setByBinaryString(d)};this.newFalseArray=function(e){var c=new Array(e);for(var d=0;d<e;d++){c[d]=false}return c};this.getFreshValueHex=function(){return this.hV};if(typeof b!="undefined"){if(typeof b=="string"&&b.toLowerCase().match(/^[0-9a-f]+$/)){this.setHexValueIncludingUnusedBits(b)}else{if(typeof b.hex!="undefined"){this.setHexValueIncludingUnusedBits(b.hex)}else{if(typeof b.bin!="undefined"){this.setByBinaryString(b.bin)}else{if(typeof b.array!="undefined"){this.setByBooleanArray(b.array)}}}}}};extendClass(KJUR.asn1.DERBitString,KJUR.asn1.ASN1Object);KJUR.asn1.DEROctetString=function(b){if(b!==undefined&&typeof b.obj!=="undefined"){var a=KJUR.asn1.ASN1Util.newObject(b.obj);b.hex=a.tohex()}KJUR.asn1.DEROctetString.superclass.constructor.call(this,b);this.hT="04"};extendClass(KJUR.asn1.DEROctetString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERNull=function(){KJUR.asn1.DERNull.superclass.constructor.call(this);this.hT="05";this.hTLV="0500"};extendClass(KJUR.asn1.DERNull,KJUR.asn1.ASN1Object);KJUR.asn1.DERObjectIdentifier=function(a){KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);this.hT="06";this.setValueHex=function(b){this.hTLV=null;this.isModified=true;this.s=null;this.hV=b};this.setValueOidString=function(b){var c=oidtohex(b);if(c==null){throw new Error("malformed oid string: "+b)}this.hTLV=null;this.isModified=true;this.s=null;this.hV=c};this.setValueName=function(c){var b=KJUR.asn1.x509.OID.name2oid(c);if(b!==""){this.setValueOidString(b)}else{throw new Error("DERObjectIdentifier oidName undefined: "+c)}};this.setValueNameOrOid=function(b){if(b.match(/^[0-2].[0-9.]+$/)){this.setValueOidString(b)}else{this.setValueName(b)}};this.getFreshValueHex=function(){return this.hV};this.setByParam=function(b){if(typeof b==="string"){this.setValueNameOrOid(b)}else{if(b.oid!==undefined){this.setValueNameOrOid(b.oid)}else{if(b.name!==undefined){this.setValueNameOrOid(b.name)}else{if(b.hex!==undefined){this.setValueHex(b.hex)}}}}};if(a!==undefined){this.setByParam(a)}};extendClass(KJUR.asn1.DERObjectIdentifier,KJUR.asn1.ASN1Object);KJUR.asn1.DEREnumerated=function(a){KJUR.asn1.DEREnumerated.superclass.constructor.call(this);this.hT="0a";this.setByBigInteger=function(b){this.hTLV=null;this.isModified=true;this.hV=KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(b)};this.setByInteger=function(c){var b=new BigInteger(String(c),10);this.setByBigInteger(b)};this.setValueHex=function(b){this.hV=b};this.getFreshValueHex=function(){return this.hV};if(typeof a!="undefined"){if(typeof a["int"]!="undefined"){this.setByInteger(a["int"])}else{if(typeof a=="number"){this.setByInteger(a)}else{if(typeof a.hex!="undefined"){this.setValueHex(a.hex)}}}}};extendClass(KJUR.asn1.DEREnumerated,KJUR.asn1.ASN1Object);KJUR.asn1.DERUTF8String=function(a){KJUR.asn1.DERUTF8String.superclass.constructor.call(this,a);this.hT="0c"};extendClass(KJUR.asn1.DERUTF8String,KJUR.asn1.DERAbstractString);KJUR.asn1.DERNumericString=function(a){KJUR.asn1.DERNumericString.superclass.constructor.call(this,a);this.hT="12"};extendClass(KJUR.asn1.DERNumericString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERPrintableString=function(a){KJUR.asn1.DERPrintableString.superclass.constructor.call(this,a);this.hT="13"};extendClass(KJUR.asn1.DERPrintableString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERTeletexString=function(a){KJUR.asn1.DERTeletexString.superclass.constructor.call(this,a);this.hT="14"};extendClass(KJUR.asn1.DERTeletexString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERIA5String=function(a){KJUR.asn1.DERIA5String.superclass.constructor.call(this,a);this.hT="16"};extendClass(KJUR.asn1.DERIA5String,KJUR.asn1.DERAbstractString);KJUR.asn1.DERVisibleString=function(a){KJUR.asn1.DERIA5String.superclass.constructor.call(this,a);this.hT="1a"};extendClass(KJUR.asn1.DERVisibleString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERBMPString=function(a){KJUR.asn1.DERBMPString.superclass.constructor.call(this,a);this.hT="1e"};extendClass(KJUR.asn1.DERBMPString,KJUR.asn1.DERAbstractString);KJUR.asn1.DERUTCTime=function(a){KJUR.asn1.DERUTCTime.superclass.constructor.call(this,a);this.hT="17";this.params=undefined;this.getFreshValueHex=function(){var d=this.params;if(this.params==undefined){d={date:new Date()}}if(typeof d=="string"){if(d.match(/^[0-9]{12}Z$/)||d.match(/^[0-9]{12}\.[0-9]+Z$/)){this.hV=stohex(d)}else{throw new Error("malformed string for UTCTime: "+d)}}else{if(d.str!=undefined){this.hV=stohex(d.str)}else{if(d.date==undefined&&d.millis==true){var c=new Date();this.hV=stohex(this.formatDate(c,"utc",true))}else{if(d.date!=undefined&&d.date instanceof Date){var b=(d.millis===true);this.hV=stohex(this.formatDate(d.date,"utc",b))}else{if(d instanceof Date){this.hV=stohex(this.formatDate(d,"utc"))}}}}}if(this.hV==undefined){throw new Error("parameter not specified properly for UTCTime")}return this.hV};if(a!=undefined){this.setByParam(a)}};extendClass(KJUR.asn1.DERUTCTime,KJUR.asn1.DERAbstractTime);KJUR.asn1.DERGeneralizedTime=function(a){KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this,a);this.hT="18";this.params=a;this.getFreshValueHex=function(){var d=this.params;if(this.params==undefined){d={date:new Date()}}if(typeof d=="string"){if(d.match(/^[0-9]{14}Z$/)||d.match(/^[0-9]{14}\.[0-9]+Z$/)){this.hV=stohex(d)}else{throw new Error("malformed string for GeneralizedTime: "+d)}}else{if(d.str!=undefined){this.hV=stohex(d.str)}else{if(d.date==undefined&&d.millis==true){var c=new Date();this.hV=stohex(this.formatDate(c,"gen",true))}else{if(d.date!=undefined&&d.date instanceof Date){var b=(d.millis===true);this.hV=stohex(this.formatDate(d.date,"gen",b))}else{if(d instanceof Date){this.hV=stohex(this.formatDate(d,"gen"))}}}}}if(this.hV==undefined){throw new Error("parameter not specified properly for GeneralizedTime")}return this.hV};if(a!=undefined){this.setByParam(a)}};extendClass(KJUR.asn1.DERGeneralizedTime,KJUR.asn1.DERAbstractTime);KJUR.asn1.DERSequence=function(a){KJUR.asn1.DERSequence.superclass.constructor.call(this,a);this.hT="30";this.getFreshValueHex=function(){var c="";for(var b=0;b<this.asn1Array.length;b++){var d=this.asn1Array[b];c+=d.tohex()}this.hV=c;return this.hV}};extendClass(KJUR.asn1.DERSequence,KJUR.asn1.DERAbstractStructured);KJUR.asn1.DERSet=function(a){KJUR.asn1.DERSet.superclass.constructor.call(this,a);this.hT="31";this.sortFlag=true;this.getFreshValueHex=function(){var b=new Array();for(var c=0;c<this.asn1Array.length;c++){var d=this.asn1Array[c];b.push(d.tohex())}if(this.sortFlag==true){b.sort()}this.hV=b.join("");return this.hV};if(typeof a!="undefined"){if(typeof a.sortflag!="undefined"&&a.sortflag==false){this.sortFlag=false}}};extendClass(KJUR.asn1.DERSet,KJUR.asn1.DERAbstractStructured);KJUR.asn1.DERTaggedObject=function(f){KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);var d=KJUR.asn1,e=ASN1HEX,a=e.getV,c=e.isASN1HEX,b=d.ASN1Util.newObject;this.hT="a0";this.hV="";this.isExplicit=true;this.asn1Object=null;this.params={tag:"a0",explicit:true};this.setASN1Object=function(g,h,i){this.params={tag:h,explicit:g,obj:i}};this.getFreshValueHex=function(){var h=this.params;if(h.explicit==undefined){h.explicit=true}if(h.tage!=undefined){h.tag=h.tage;h.explicit=true}if(h.tagi!=undefined){h.tag=h.tagi;h.explicit=false}if(h.str!=undefined){this.hV=utf8tohex(h.str)}else{if(h.hex!=undefined){this.hV=h.hex}else{if(h.obj!=undefined){var g;if(h.obj instanceof d.ASN1Object){g=h.obj.tohex()}else{if(typeof h.obj=="object"){g=b(h.obj).tohex()}}if(h.explicit){this.hV=g}else{this.hV=a(g,0)}}else{throw new Error("str, hex nor obj not specified")}}}if(h.tag==undefined){h.tag="a0"}this.hT=h.tag;this.hTLV=null;this.isModified=true;return this.hV};this.setByParam=function(g){this.params=g};if(f!==undefined){this.setByParam(f)}};extendClass(KJUR.asn1.DERTaggedObject,KJUR.asn1.ASN1Object);
var ASN1HEX=new function(){};ASN1HEX.getLblen=function(c,a){if(c.substr(a+2,1)!="8"){return 1}var b=parseInt(c.substr(a+3,1));if(b==0){return -1}if(0<b&&b<10){return b+1}return -2};ASN1HEX.getL=function(c,b){var a=ASN1HEX.getLblen(c,b);if(a<1){return""}return c.substr(b+2,a*2)};ASN1HEX.getVblen=function(d,a){var c,b;c=ASN1HEX.getL(d,a);if(c==""){return -1}if(c.substr(0,1)==="8"){b=new BigInteger(c.substr(2),16)}else{b=new BigInteger(c,16)}return b.intValue()};ASN1HEX.getVidx=function(c,b){var a=ASN1HEX.getLblen(c,b);if(a<0){return a}return b+(a+1)*2};ASN1HEX.getV=function(d,a){var c=ASN1HEX.getVidx(d,a);var b=ASN1HEX.getVblen(d,a);return d.substr(c,b*2)};ASN1HEX.getTLV=function(b,a){return b.substr(a,2)+ASN1HEX.getL(b,a)+ASN1HEX.getV(b,a)};ASN1HEX.getTLVblen=function(b,a){return 2+ASN1HEX.getLblen(b,a)*2+ASN1HEX.getVblen(b,a)*2};ASN1HEX.getNextSiblingIdx=function(d,a){var c=ASN1HEX.getVidx(d,a);var b=ASN1HEX.getVblen(d,a);return c+b*2};ASN1HEX.getChildIdx=function(e,k){var l=ASN1HEX;var j=[];var c,f,g;c=l.getVidx(e,k);f=l.getVblen(e,k)*2;if(e.substr(k,2)=="03"){c+=2;f-=2}g=0;var d=c;while(g<=f){var b=l.getTLVblen(e,d);g+=b;if(g<=f){j.push(d)}d+=b;if(g>=f){break}}return j};ASN1HEX.getNthChildIdx=function(d,b,e){var c=ASN1HEX.getChildIdx(d,b);return c[e]};ASN1HEX.getIdxbyList=function(e,d,c,i){var g=ASN1HEX;var f,b;if(c.length==0){if(i!==undefined){if(e.substr(d,2)!==i){return -1}}return d}f=c.shift();b=g.getChildIdx(e,d);if(f>=b.length){return -1}return g.getIdxbyList(e,b[f],c,i)};ASN1HEX.getIdxbyListEx=function(f,k,b,g){var m=ASN1HEX;var d,l;if(b.length==0){if(g!==undefined){if(f.substr(k,2)!==g){return -1}}return k}d=b.shift();l=m.getChildIdx(f,k);var j=0;for(var e=0;e<l.length;e++){var c=f.substr(l[e],2);if((typeof d=="number"&&(!m.isContextTag(c))&&j==d)||(typeof d=="string"&&m.isContextTag(c,d))){return m.getIdxbyListEx(f,l[e],b,g)}if(!m.isContextTag(c)){j++}}return -1};ASN1HEX.getTLVbyList=function(d,c,b,f){var e=ASN1HEX;var a=e.getIdxbyList(d,c,b,f);if(a==-1){return null}if(a>=d.length){return null}return e.getTLV(d,a)};ASN1HEX.getTLVbyListEx=function(d,c,b,f){var e=ASN1HEX;var a=e.getIdxbyListEx(d,c,b,f);if(a==-1){return null}return e.getTLV(d,a)};ASN1HEX.getVbyList=function(e,c,b,g,i){var f=ASN1HEX;var a,d;a=f.getIdxbyList(e,c,b,g);if(a==-1){return null}if(a>=e.length){return null}d=f.getV(e,a);if(i===true){d=d.substr(2)}return d};ASN1HEX.getVbyListEx=function(b,e,a,d,f){var j=ASN1HEX;var g,c,i;g=j.getIdxbyListEx(b,e,a,d);if(g==-1){return null}i=j.getV(b,g);if(b.substr(g,2)=="03"&&f!==false){i=i.substr(2)}return i};ASN1HEX.getInt=function(e,b,f){if(f==undefined){f=-1}try{var c=e.substr(b,2);if(c!="02"&&c!="03"){return f}var a=ASN1HEX.getV(e,b);if(c=="02"){return parseInt(a,16)}else{return bitstrtoint(a)}}catch(d){return f}};ASN1HEX.getOID=function(c,a,d){if(d==undefined){d=null}try{if(c.substr(a,2)!="06"){return d}var e=ASN1HEX.getV(c,a);return hextooid(e)}catch(b){return d}};ASN1HEX.getOIDName=function(d,a,f){if(f==undefined){f=null}try{var e=ASN1HEX.getOID(d,a,f);if(e==f){return f}var b=KJUR.asn1.x509.OID.oid2name(e);if(b==""){return e}return b}catch(c){return f}};ASN1HEX.getString=function(d,b,e){if(e==undefined){e=null}try{var a=ASN1HEX.getV(d,b);return hextorstr(a)}catch(c){return e}};ASN1HEX.hextooidstr=function(e){var h=function(b,a){if(b.length>=a){return b}return new Array(a-b.length+1).join("0")+b};var l=[];var o=e.substr(0,2);var f=parseInt(o,16);l[0]=new String(Math.floor(f/40));l[1]=new String(f%40);var m=e.substr(2);var k=[];for(var g=0;g<m.length/2;g++){k.push(parseInt(m.substr(g*2,2),16))}var j=[];var d="";for(var g=0;g<k.length;g++){if(k[g]&128){d=d+h((k[g]&127).toString(2),7)}else{d=d+h((k[g]&127).toString(2),7);j.push(new String(parseInt(d,2)));d=""}}var n=l.join(".");if(j.length>0){n=n+"."+j.join(".")}return n};ASN1HEX.dump=function(t,c,l,g){var p=ASN1HEX;var j=p.getV;var y=p.dump;var w=p.getChildIdx;var e=t;if(t instanceof KJUR.asn1.ASN1Object){e=t.tohex()}var q=function(A,i){if(A.length<=i*2){return A}else{var v=A.substr(0,i)+"..(total "+A.length/2+"bytes).."+A.substr(A.length-i,i);return v}};if(c===undefined){c={ommit_long_octet:32}}if(l===undefined){l=0}if(g===undefined){g=""}var x=c.ommit_long_octet;var z=e.substr(l,2);if(z=="01"){var h=j(e,l);if(h=="00"){return g+"BOOLEAN FALSE\n"}else{return g+"BOOLEAN TRUE\n"}}if(z=="02"){var h=j(e,l);return g+"INTEGER "+q(h,x)+"\n"}if(z=="03"){var h=j(e,l);if(p.isASN1HEX(h.substr(2))){var k=g+"BITSTRING, encapsulates\n";k=k+y(h.substr(2),c,0,g+"  ");return k}else{return g+"BITSTRING "+q(h,x)+"\n"}}if(z=="04"){var h=j(e,l);if(p.isASN1HEX(h)){var k=g+"OCTETSTRING, encapsulates\n";k=k+y(h,c,0,g+"  ");return k}else{return g+"OCTETSTRING "+q(h,x)+"\n"}}if(z=="05"){return g+"NULL\n"}if(z=="06"){var m=j(e,l);var b=KJUR.asn1.ASN1Util.oidHexToInt(m);var o=KJUR.asn1.x509.OID.oid2name(b);var a=b.replace(/\./g," ");if(o!=""){return g+"ObjectIdentifier "+o+" ("+a+")\n"}else{return g+"ObjectIdentifier ("+a+")\n"}}if(z=="0a"){return g+"ENUMERATED "+parseInt(j(e,l))+"\n"}if(z=="0c"){return g+"UTF8String '"+hextoutf8(j(e,l))+"'\n"}if(z=="13"){return g+"PrintableString '"+hextoutf8(j(e,l))+"'\n"}if(z=="14"){return g+"TeletexString '"+hextoutf8(j(e,l))+"'\n"}if(z=="16"){return g+"IA5String '"+hextoutf8(j(e,l))+"'\n"}if(z=="17"){return g+"UTCTime "+hextoutf8(j(e,l))+"\n"}if(z=="18"){return g+"GeneralizedTime "+hextoutf8(j(e,l))+"\n"}if(z=="1a"){return g+"VisualString '"+hextoutf8(j(e,l))+"'\n"}if(z=="1e"){return g+"BMPString '"+ucs2hextoutf8(j(e,l))+"'\n"}if(z=="30"){if(e.substr(l,4)=="3000"){return g+"SEQUENCE {}\n"}var k=g+"SEQUENCE\n";var d=w(e,l);var f=c;if((d.length==2||d.length==3)&&e.substr(d[0],2)=="06"&&e.substr(d[d.length-1],2)=="04"){var o=p.oidname(j(e,d[0]));var r=JSON.parse(JSON.stringify(c));r.x509ExtName=o;f=r}for(var u=0;u<d.length;u++){k=k+y(e,f,d[u],g+"  ")}return k}if(z=="31"){var k=g+"SET\n";var d=w(e,l);for(var u=0;u<d.length;u++){k=k+y(e,c,d[u],g+"  ")}return k}var z=parseInt(z,16);if((z&128)!=0){var n=z&31;if((z&32)!=0){var k=g+"["+n+"]\n";var d=w(e,l);for(var u=0;u<d.length;u++){k=k+y(e,c,d[u],g+"  ")}return k}else{var h=j(e,l);if(ASN1HEX.isASN1HEX(h)){var k=g+"["+n+"]\n";k=k+y(h,c,0,g+"  ");return k}else{if(h.substr(0,8)=="68747470"){h=hextoutf8(h)}else{if(c.x509ExtName==="subjectAltName"&&n==2){h=hextoutf8(h)}}}var k=g+"["+n+"] "+h+"\n";return k}}return g+"UNKNOWN("+z+") "+j(e,l)+"\n"};ASN1HEX.parse=function(x){var t=ASN1HEX,f=t.parse,a=t.isASN1HEX,l=t.getV,b=t.getTLV,y=t.getChildIdx,i=KJUR.asn1,e=i.ASN1Util.oidHexToInt,B=i.x509.OID.oid2name,k=hextoutf8,n=ucs2hextoutf8,q=iso88591hextoutf8;var c={"0c":"utf8str","12":"numstr","13":"prnstr","14":"telstr","16":"ia5str","17":"utctime","18":"gentime","1a":"visstr","1e":"bmpstr","30":"seq","31":"set"};var u=function(H){var D=[];var E=y(H,0);for(var G=0;G<E.length;G++){var s=E[G];var d=b(H,s);var F=f(d);D.push(F)}return D};var C=x.substr(0,2);var j={};var p=l(x,0);if(C=="01"){if(x=="0101ff"){return{bool:true}}return{bool:false}}else{if(C=="02"){return{"int":{hex:p}}}else{if(C=="03"){try{if(p.substr(0,2)!="00"){throw"not encap"}var v=p.substr(2);if(!a(v)){throw"not encap"}return{bitstr:{obj:f(v)}}}catch(z){var m=null;if(p.length<=10){m=bitstrtobinstr(p)}if(m==null){return{bitstr:{hex:p}}}else{return{bitstr:{bin:m}}}}}else{if(C=="04"){try{if(!a(p)){throw"not encap"}return{octstr:{obj:f(p)}}}catch(z){return{octstr:{hex:p}}}}else{if(C=="05"){return{"null":""}}else{if(C=="06"){var g=e(p);var r=B(g);if(r==""){return{oid:g}}else{return{oid:r}}}else{if(C=="0a"){if(p.length>4){return{"enum":{hex:p}}}else{return{"enum":parseInt(p,16)}}}else{if(C=="30"||C=="31"){j[c[C]]=u(x);return j}else{if(C=="14"){var o=q(p);j[c[C]]={str:o};return j}else{if(C=="1e"){var o=n(p);j[c[C]]={str:o};return j}else{if(":0c:12:13:16:17:18:1a:".indexOf(C)!=-1){var o=k(p);j[c[C]]={str:o};return j}else{if(C.match(/^8[0-9]$/)){var o=k(p);if(o==null|o==""){return{tag:{tag:C,explicit:false,hex:p}}}else{if(o.match(/[\x00-\x1F\x7F-\x9F]/)!=null||o.match(/[\u0000-\u001F\u0080–\u009F]/)!=null){return{tag:{tag:C,explicit:false,hex:p}}}else{return{tag:{tag:C,explicit:false,str:o}}}}}else{if(C.match(/^a[0-9]$/)){try{if(!a(p)){throw new Error("not encap")}return{tag:{tag:C,explicit:true,obj:f(p)}}}catch(z){return{tag:{tag:C,explicit:true,hex:p}}}}else{var A=new KJUR.asn1.ASN1Object();A.hV=p;var w=A.getLengthHexFromValue();return{asn1:{tlv:C+w+p}}}}}}}}}}}}}}}};ASN1HEX.isContextTag=function(c,b){c=c.toLowerCase();var f,e;try{f=parseInt(c,16)}catch(d){return -1}if(b===undefined){if((f&192)==128){return true}else{return false}}try{var a=b.match(/^\[[0-9]+\]$/);if(a==null){return false}e=parseInt(b.substr(1,b.length-1),10);if(e>31){return false}if(((f&192)==128)&&((f&31)==e)){return true}return false}catch(d){return false}};ASN1HEX.isASN1HEX=function(e){var d=ASN1HEX;if(e.length%2==1){return false}var c=d.getVblen(e,0);var b=e.substr(0,2);var f=d.getL(e,0);var a=e.length-b.length-f.length;if(a==c*2){return true}return false};ASN1HEX.checkStrictDER=function(g,o,d,c,r){var s=ASN1HEX;if(d===undefined){if(typeof g!="string"){throw new Error("not hex string")}g=g.toLowerCase();if(!KJUR.lang.String.isHex(g)){throw new Error("not hex string")}d=g.length;c=g.length/2;if(c<128){r=1}else{r=Math.ceil(c.toString(16))+1}}var k=s.getL(g,o);if(k.length>r*2){throw new Error("L of TLV too long: idx="+o)}var n=s.getVblen(g,o);if(n>c){throw new Error("value of L too long than hex: idx="+o)}var q=s.getTLV(g,o);var f=q.length-2-s.getL(g,o).length;if(f!==(n*2)){throw new Error("V string length and L's value not the same:"+f+"/"+(n*2))}if(o===0){if(g.length!=q.length){throw new Error("total length and TLV length unmatch:"+g.length+"!="+q.length)}}var b=g.substr(o,2);if(b==="02"){var a=s.getVidx(g,o);if(g.substr(a,2)=="00"&&g.charCodeAt(a+2)<56){throw new Error("not least zeros for DER INTEGER")}}if(parseInt(b,16)&32){var p=s.getVblen(g,o);var m=0;var l=s.getChildIdx(g,o);for(var e=0;e<l.length;e++){var j=s.getTLV(g,l[e]);m+=j.length;s.checkStrictDER(g,l[e],d,c,r)}if((p*2)!=m){throw new Error("sum of children's TLV length and L unmatch: "+(p*2)+"!="+m)}}};ASN1HEX.oidname=function(a){var c=KJUR.asn1;if(KJUR.lang.String.isHex(a)){a=c.ASN1Util.oidHexToInt(a)}var b=c.x509.OID.oid2name(a);if(b===""){b=a}return b};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.x509=="undefined"||!KJUR.asn1.x509){KJUR.asn1.x509={}}KJUR.asn1.x509.Certificate=function(h){KJUR.asn1.x509.Certificate.superclass.constructor.call(this);var d=KJUR,c=d.asn1,f=c.DERBitString,b=c.DERSequence,g=c.x509,a=g.TBSCertificate,e=g.AlgorithmIdentifier;this.params=undefined;this.setByParam=function(i){this.params=i};this.sign=function(){var l=this.params;var k=l.sigalg;if(l.sigalg.name!=undefined){k=l.sigalg.name}var i=l.tbsobj.tohex();var j=new KJUR.crypto.Signature({alg:k});j.init(l.cakey);j.updateHex(i);l.sighex=j.sign()};this.getPEM=function(){return hextopem(this.tohex(),"CERTIFICATE")};this.tohex=function(){var k=this.params;if(k.tbsobj==undefined||k.tbsobj==null){k.tbsobj=new a(k)}if(k.sighex==undefined&&k.cakey!=undefined){this.sign()}if(k.sighex==undefined){throw new Error("sighex or cakey parameter not defined")}var i=[];i.push(k.tbsobj);i.push(new e({name:k.sigalg}));i.push(new f({hex:"00"+k.sighex}));var j=new b({array:i});return j.tohex()};this.getEncodedHex=function(){return this.tohex()};if(h!=undefined){this.params=h}};extendClass(KJUR.asn1.x509.Certificate,KJUR.asn1.ASN1Object);KJUR.asn1.x509.TBSCertificate=function(f){KJUR.asn1.x509.TBSCertificate.superclass.constructor.call(this);var b=KJUR,i=b.asn1,d=i.x509,c=i.DERTaggedObject,h=i.DERInteger,g=i.DERSequence,l=d.AlgorithmIdentifier,e=d.Time,a=d.X500Name,j=d.Extensions,k=d.SubjectPublicKeyInfo;this.params=null;this.setByParam=function(m){this.params=m};this.tohex=function(){var n=[];var q=this.params;if(q.version!=undefined||q.version!=1){var m=2;if(q.version!=undefined){m=q.version-1}var p=new c({obj:new h({"int":m})});n.push(p)}n.push(new h(q.serial));n.push(new l({name:q.sigalg}));n.push(new a(q.issuer));n.push(new g({array:[new e(q.notbefore),new e(q.notafter)]}));n.push(new a(q.subject));n.push(new k(KEYUTIL.getKey(q.sbjpubkey)));if(q.ext!==undefined&&q.ext.length>0){n.push(new c({tag:"a3",obj:new j(q.ext)}))}var o=new KJUR.asn1.DERSequence({array:n});return o.tohex()};this.getEncodedHex=function(){return this.tohex()};if(f!==undefined){this.setByParam(f)}};extendClass(KJUR.asn1.x509.TBSCertificate,KJUR.asn1.ASN1Object);KJUR.asn1.x509.Extensions=function(d){KJUR.asn1.x509.Extensions.superclass.constructor.call(this);var c=KJUR,b=c.asn1,a=b.DERSequence,e=b.x509;this.aParam=[];this.setByParam=function(f){this.aParam=f};this.tohex=function(){var f=[];for(var h=0;h<this.aParam.length;h++){var l=this.aParam[h];var k=l.extname;var j=null;if(l.extn!=undefined){j=new e.PrivateExtension(l)}else{if(k=="subjectKeyIdentifier"){j=new e.SubjectKeyIdentifier(l)}else{if(k=="keyUsage"){j=new e.KeyUsage(l)}else{if(k=="subjectAltName"){j=new e.SubjectAltName(l)}else{if(k=="issuerAltName"){j=new e.IssuerAltName(l)}else{if(k=="basicConstraints"){j=new e.BasicConstraints(l)}else{if(k=="nameConstraints"){j=new e.NameConstraints(l)}else{if(k=="cRLDistributionPoints"){j=new e.CRLDistributionPoints(l)}else{if(k=="certificatePolicies"){j=new e.CertificatePolicies(l)}else{if(k=="authorityKeyIdentifier"){j=new e.AuthorityKeyIdentifier(l)}else{if(k=="extKeyUsage"){j=new e.ExtKeyUsage(l)}else{if(k=="authorityInfoAccess"){j=new e.AuthorityInfoAccess(l)}else{if(k=="cRLNumber"){j=new e.CRLNumber(l)}else{if(k=="cRLReason"){j=new e.CRLReason(l)}else{if(k=="ocspNonce"){j=new e.OCSPNonce(l)}else{if(k=="ocspNoCheck"){j=new e.OCSPNoCheck(l)}else{if(k=="adobeTimeStamp"){j=new e.AdobeTimeStamp(l)}else{if(k=="subjectDirectoryAttributes"){j=new e.SubjectDirectoryAttributes(l)}else{throw new Error("extension not supported:"+JSON.stringify(l))}}}}}}}}}}}}}}}}}}if(j!=null){f.push(j)}}var g=new a({array:f});return g.tohex()};this.getEncodedHex=function(){return this.tohex()};if(d!=undefined){this.setByParam(d)}};extendClass(KJUR.asn1.x509.Extensions,KJUR.asn1.ASN1Object);KJUR.asn1.x509.Extension=function(d){KJUR.asn1.x509.Extension.superclass.constructor.call(this);var f=null,a=KJUR,e=a.asn1,h=e.DERObjectIdentifier,i=e.DEROctetString,b=e.DERBitString,g=e.DERBoolean,c=e.DERSequence;this.tohex=function(){var m=new h({oid:this.oid});var l=new i({hex:this.getExtnValueHex()});var k=new Array();k.push(m);if(this.critical){k.push(new g())}k.push(l);var j=new c({array:k});return j.tohex()};this.getEncodedHex=function(){return this.tohex()};this.critical=false;if(d!==undefined){if(d.critical!==undefined){this.critical=d.critical}}};extendClass(KJUR.asn1.x509.Extension,KJUR.asn1.ASN1Object);KJUR.asn1.x509.KeyUsage=function(c){KJUR.asn1.x509.KeyUsage.superclass.constructor.call(this,c);var b=Error;var a={digitalSignature:0,nonRepudiation:1,keyEncipherment:2,dataEncipherment:3,keyAgreement:4,keyCertSign:5,cRLSign:6,encipherOnly:7,decipherOnly:8};this.getExtnValueHex=function(){var d=this.getBinValue();this.asn1ExtnValue=new KJUR.asn1.DERBitString({bin:d});return this.asn1ExtnValue.tohex()};this.getBinValue=function(){var d=this.params;if(typeof d!="object"||(typeof d.names!="object"&&typeof d.bin!="string")){throw new b("parameter not yet set")}if(d.names!=undefined){return namearraytobinstr(d.names,a)}else{if(d.bin!=undefined){return d.bin}else{throw new b("parameter not set properly")}}};this.oid="2.5.29.15";if(c!==undefined){this.params=c}};extendClass(KJUR.asn1.x509.KeyUsage,KJUR.asn1.x509.Extension);KJUR.asn1.x509.BasicConstraints=function(g){KJUR.asn1.x509.BasicConstraints.superclass.constructor.call(this,g);var c=KJUR.asn1,e=c.DERBoolean,f=c.DERInteger,b=c.DERSequence;var a=false;var d=-1;this.getExtnValueHex=function(){var i=new Array();if(this.cA){i.push(new e())}if(this.pathLen>-1){i.push(new f({"int":this.pathLen}))}var h=new b({array:i});this.asn1ExtnValue=h;return this.asn1ExtnValue.tohex()};this.oid="2.5.29.19";this.cA=false;this.pathLen=-1;if(g!==undefined){if(g.cA!==undefined){this.cA=g.cA}if(g.pathLen!==undefined){this.pathLen=g.pathLen}}};extendClass(KJUR.asn1.x509.BasicConstraints,KJUR.asn1.x509.Extension);KJUR.asn1.x509.CRLDistributionPoints=function(d){KJUR.asn1.x509.CRLDistributionPoints.superclass.constructor.call(this,d);var b=KJUR,a=b.asn1,c=a.x509;this.getExtnValueHex=function(){return this.asn1ExtnValue.tohex()};this.setByDPArray=function(e){var f=[];for(var g=0;g<e.length;g++){if(e[g] instanceof KJUR.asn1.ASN1Object){f.push(e[g])}else{var h=new c.DistributionPoint(e[g]);f.push(h)}}this.asn1ExtnValue=new a.DERSequence({array:f})};this.setByOneURI=function(f){var e=new c.DistributionPoint({fulluri:f});this.setByDPArray([e])};this.oid="2.5.29.31";if(d!==undefined){if(d.array!==undefined){this.setByDPArray(d.array)}else{if(d.uri!==undefined){this.setByOneURI(d.uri)}}}};extendClass(KJUR.asn1.x509.CRLDistributionPoints,KJUR.asn1.x509.Extension);KJUR.asn1.x509.DistributionPoint=function(e){KJUR.asn1.x509.DistributionPoint.superclass.constructor.call(this);var a=null,c=KJUR,b=c.asn1,d=b.x509.DistributionPointName;this.tohex=function(){var f=new b.DERSequence();if(this.asn1DP!=null){var g=new b.DERTaggedObject({explicit:true,tag:"a0",obj:this.asn1DP});f.appendASN1Object(g)}this.hTLV=f.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){if(e.dpobj!==undefined){this.asn1DP=e.dpobj}else{if(e.dpname!==undefined){this.asn1DP=new d(e.dpname)}else{if(e.fulluri!==undefined){this.asn1DP=new d({full:[{uri:e.fulluri}]})}}}}};extendClass(KJUR.asn1.x509.DistributionPoint,KJUR.asn1.ASN1Object);KJUR.asn1.x509.DistributionPointName=function(h){KJUR.asn1.x509.DistributionPointName.superclass.constructor.call(this);var g=null,d=null,a=null,f=null,c=KJUR,b=c.asn1,e=b.DERTaggedObject;this.tohex=function(){if(this.type!="full"){throw new Error("currently type shall be 'full': "+this.type)}this.asn1Obj=new e({explicit:false,tag:this.tag,obj:this.asn1V});this.hTLV=this.asn1Obj.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(h!==undefined){if(b.x509.GeneralNames.prototype.isPrototypeOf(h)){this.type="full";this.tag="a0";this.asn1V=h}else{if(h.full!==undefined){this.type="full";this.tag="a0";this.asn1V=new b.x509.GeneralNames(h.full)}else{throw new Error("This class supports GeneralNames only as argument")}}}};extendClass(KJUR.asn1.x509.DistributionPointName,KJUR.asn1.ASN1Object);KJUR.asn1.x509.CertificatePolicies=function(f){KJUR.asn1.x509.CertificatePolicies.superclass.constructor.call(this,f);var c=KJUR,b=c.asn1,e=b.x509,a=b.DERSequence,d=e.PolicyInformation;this.params=null;this.getExtnValueHex=function(){var j=[];for(var h=0;h<this.params.array.length;h++){j.push(new d(this.params.array[h]))}var g=new a({array:j});this.asn1ExtnValue=g;return this.asn1ExtnValue.tohex()};this.oid="2.5.29.32";if(f!==undefined){this.params=f}};extendClass(KJUR.asn1.x509.CertificatePolicies,KJUR.asn1.x509.Extension);KJUR.asn1.x509.PolicyInformation=function(d){KJUR.asn1.x509.PolicyInformation.superclass.constructor.call(this,d);var c=KJUR.asn1,b=c.DERSequence,e=c.DERObjectIdentifier,a=c.x509.PolicyQualifierInfo;this.params=null;this.tohex=function(){if(this.params.policyoid===undefined&&this.params.array===undefined){throw new Error("parameter oid and array missing")}var f=[new e(this.params.policyoid)];if(this.params.array!==undefined){var j=[];for(var h=0;h<this.params.array.length;h++){j.push(new a(this.params.array[h]))}if(j.length>0){f.push(new b({array:j}))}}var g=new b({array:f});return g.tohex()};this.getEncodedHex=function(){return this.tohex()};if(d!==undefined){this.params=d}};extendClass(KJUR.asn1.x509.PolicyInformation,KJUR.asn1.ASN1Object);KJUR.asn1.x509.PolicyQualifierInfo=function(e){KJUR.asn1.x509.PolicyQualifierInfo.superclass.constructor.call(this,e);var c=KJUR.asn1,b=c.DERSequence,d=c.DERIA5String,f=c.DERObjectIdentifier,a=c.x509.UserNotice;this.params=null;this.tohex=function(){if(this.params.cps!==undefined){var g=new b({array:[new f({oid:"1.3.6.1.5.5.7.2.1"}),new d({str:this.params.cps})]});return g.tohex()}if(this.params.unotice!=undefined){var g=new b({array:[new f({oid:"1.3.6.1.5.5.7.2.2"}),new a(this.params.unotice)]});return g.tohex()}};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){this.params=e}};extendClass(KJUR.asn1.x509.PolicyQualifierInfo,KJUR.asn1.ASN1Object);KJUR.asn1.x509.UserNotice=function(e){KJUR.asn1.x509.UserNotice.superclass.constructor.call(this,e);var a=KJUR.asn1.DERSequence,d=KJUR.asn1.DERInteger,c=KJUR.asn1.x509.DisplayText,b=KJUR.asn1.x509.NoticeReference;this.params=null;this.tohex=function(){var f=[];if(this.params.noticeref!==undefined){f.push(new b(this.params.noticeref))}if(this.params.exptext!==undefined){f.push(new c(this.params.exptext))}var g=new a({array:f});return g.tohex()};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){this.params=e}};extendClass(KJUR.asn1.x509.UserNotice,KJUR.asn1.ASN1Object);KJUR.asn1.x509.NoticeReference=function(d){KJUR.asn1.x509.NoticeReference.superclass.constructor.call(this,d);var a=KJUR.asn1.DERSequence,c=KJUR.asn1.DERInteger,b=KJUR.asn1.x509.DisplayText;this.params=null;this.tohex=function(){var f=[];if(this.params.org!==undefined){f.push(new b(this.params.org))}if(this.params.noticenum!==undefined){var h=[];var e=this.params.noticenum;for(var j=0;j<e.length;j++){h.push(new c(e[j]))}f.push(new a({array:h}))}if(f.length==0){throw new Error("parameter is empty")}var g=new a({array:f});return g.tohex()};this.getEncodedHex=function(){return this.tohex()};if(d!==undefined){this.params=d}};extendClass(KJUR.asn1.x509.NoticeReference,KJUR.asn1.ASN1Object);KJUR.asn1.x509.DisplayText=function(a){KJUR.asn1.x509.DisplayText.superclass.constructor.call(this,a);this.hT="0c";if(a!==undefined){if(a.type==="ia5"){this.hT="16"}else{if(a.type==="vis"){this.hT="1a"}else{if(a.type==="bmp"){this.hT="1e"}}}}};extendClass(KJUR.asn1.x509.DisplayText,KJUR.asn1.DERAbstractString);KJUR.asn1.x509.NameConstraints=function(f){KJUR.asn1.x509.NameConstraints.superclass.constructor.call(this,f);var c=KJUR,b=c.asn1,e=b.x509,a=b.ASN1Util.newObject,d=e.GeneralSubtree;this.params=null;this.getExtnValueHex=function(){var l=this.params;var g=[];if(l.permit!=undefined&&l.permit.length!=undefined){var k=[];for(var h=0;h<l.permit.length;h++){k.push(new d(l.permit[h]))}g.push({tag:{tagi:"a0",obj:{seq:k}}})}if(l.exclude!=undefined&&l.exclude.length!=undefined){var j=[];for(var h=0;h<l.exclude.length;h++){j.push(new d(l.exclude[h]))}g.push({tag:{tagi:"a1",obj:{seq:j}}})}this.asn1ExtnValue=a({seq:g});return this.asn1ExtnValue.tohex()};this.oid="2.5.29.30";if(f!==undefined){this.params=f}};extendClass(KJUR.asn1.x509.NameConstraints,KJUR.asn1.x509.Extension);KJUR.asn1.x509.GeneralSubtree=function(e){KJUR.asn1.x509.GeneralSubtree.superclass.constructor.call(this);var b=KJUR.asn1,d=b.x509,c=d.GeneralName,a=b.ASN1Util.newObject;this.params=null;this.setByParam=function(f){this.params=f};this.tohex=function(){var h=this.params;var f=[new c(h)];if(h.min!=undefined){f.push({tag:{tagi:"80",obj:{"int":h.min}}})}if(h.max!=undefined){f.push({tag:{tagi:"81",obj:{"int":h.max}}})}var g=a({seq:f});return g.tohex()};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){this.setByParam(e)}};extendClass(KJUR.asn1.x509.GeneralSubtree,KJUR.asn1.ASN1Object);KJUR.asn1.x509.ExtKeyUsage=function(c){KJUR.asn1.x509.ExtKeyUsage.superclass.constructor.call(this,c);var b=KJUR,a=b.asn1;this.setPurposeArray=function(d){this.asn1ExtnValue=new a.DERSequence();for(var e=0;e<d.length;e++){var f=new a.DERObjectIdentifier(d[e]);this.asn1ExtnValue.appendASN1Object(f)}};this.getExtnValueHex=function(){return this.asn1ExtnValue.tohex()};this.oid="2.5.29.37";if(c!==undefined){if(c.array!==undefined){this.setPurposeArray(c.array)}}};extendClass(KJUR.asn1.x509.ExtKeyUsage,KJUR.asn1.x509.Extension);KJUR.asn1.x509.AuthorityKeyIdentifier=function(f){KJUR.asn1.x509.AuthorityKeyIdentifier.superclass.constructor.call(this,f);var b=KJUR,a=b.asn1,d=a.DERTaggedObject,e=a.x509.GeneralNames,c=b.crypto.Util.isKey;this.asn1KID=null;this.asn1CertIssuer=null;this.asn1CertSN=null;this.getExtnValueHex=function(){var h=new Array();if(this.asn1KID){h.push(new d({explicit:false,tag:"80",obj:this.asn1KID}))}if(this.asn1CertIssuer){h.push(new d({explicit:false,tag:"a1",obj:new e([{dn:this.asn1CertIssuer}])}))}if(this.asn1CertSN){h.push(new d({explicit:false,tag:"82",obj:this.asn1CertSN}))}var g=new a.DERSequence({array:h});this.asn1ExtnValue=g;return this.asn1ExtnValue.tohex()};this.setKIDByParam=function(i){if(i.str!==undefined||i.hex!==undefined){this.asn1KID=new KJUR.asn1.DEROctetString(i)}else{if((typeof i==="object"&&KJUR.crypto.Util.isKey(i))||(typeof i==="string"&&i.indexOf("BEGIN ")!=-1)){var h=i;if(typeof i==="string"){h=KEYUTIL.getKey(i)}var g=KEYUTIL.getKeyID(h);this.asn1KID=new KJUR.asn1.DEROctetString({hex:g})}}};this.setCertIssuerByParam=function(g){if(g.str!==undefined||g.ldapstr!==undefined||g.hex!==undefined||g.certsubject!==undefined||g.certissuer!==undefined){this.asn1CertIssuer=new KJUR.asn1.x509.X500Name(g)}else{if(typeof g==="string"&&g.indexOf("BEGIN ")!=-1&&g.indexOf("CERTIFICATE")!=-1){this.asn1CertIssuer=new KJUR.asn1.x509.X500Name({certissuer:g})}}};this.setCertSNByParam=function(i){if(i.str!==undefined||i.bigint!==undefined||i.hex!==undefined){this.asn1CertSN=new KJUR.asn1.DERInteger(i)}else{if(typeof i==="string"&&i.indexOf("BEGIN ")!=-1&&i.indexOf("CERTIFICATE")){var g=new X509();g.readCertPEM(i);var h=g.getSerialNumberHex();this.asn1CertSN=new KJUR.asn1.DERInteger({hex:h})}}};this.oid="2.5.29.35";if(f!==undefined){if(f.kid!==undefined){this.setKIDByParam(f.kid)}if(f.issuer!==undefined){this.setCertIssuerByParam(f.issuer)}if(f.sn!==undefined){this.setCertSNByParam(f.sn)}if(f.issuersn!==undefined&&typeof f.issuersn==="string"&&f.issuersn.indexOf("BEGIN ")!=-1&&f.issuersn.indexOf("CERTIFICATE")){this.setCertSNByParam(f.issuersn);this.setCertIssuerByParam(f.issuersn)}}};extendClass(KJUR.asn1.x509.AuthorityKeyIdentifier,KJUR.asn1.x509.Extension);KJUR.asn1.x509.SubjectKeyIdentifier=function(d){KJUR.asn1.x509.SubjectKeyIdentifier.superclass.constructor.call(this,d);var b=KJUR,a=b.asn1,c=a.DEROctetString;this.asn1KID=null;this.getExtnValueHex=function(){this.asn1ExtnValue=this.asn1KID;return this.asn1ExtnValue.tohex()};this.setKIDByParam=function(g){if(g.str!==undefined||g.hex!==undefined){this.asn1KID=new c(g)}else{if((typeof g==="object"&&KJUR.crypto.Util.isKey(g))||(typeof g==="string"&&g.indexOf("BEGIN")!=-1)){var f=g;if(typeof g==="string"){f=KEYUTIL.getKey(g)}var e=KEYUTIL.getKeyID(f);this.asn1KID=new KJUR.asn1.DEROctetString({hex:e})}}};this.oid="2.5.29.14";if(d!==undefined){if(d.kid!==undefined){this.setKIDByParam(d.kid)}}};extendClass(KJUR.asn1.x509.SubjectKeyIdentifier,KJUR.asn1.x509.Extension);KJUR.asn1.x509.AuthorityInfoAccess=function(a){KJUR.asn1.x509.AuthorityInfoAccess.superclass.constructor.call(this,a);this.setAccessDescriptionArray=function(k){var d=new Array(),b=KJUR,g=b.asn1,c=g.DERSequence,j=g.DERObjectIdentifier,l=g.x509.GeneralName;for(var f=0;f<k.length;f++){var e;var h=k[f];if(h.ocsp!==undefined){e=new c({array:[new j({oid:"1.3.6.1.5.5.7.48.1"}),new l({uri:h.ocsp})]})}else{if(h.caissuer!==undefined){e=new c({array:[new j({oid:"1.3.6.1.5.5.7.48.2"}),new l({uri:h.caissuer})]})}else{throw new Error("unknown AccessMethod parameter: "+JSON.stringify(h))}}d.push(e)}this.asn1ExtnValue=new c({array:d})};this.getExtnValueHex=function(){return this.asn1ExtnValue.tohex()};this.oid="1.3.6.1.5.5.7.1.1";if(a!==undefined){if(a.array!==undefined){this.setAccessDescriptionArray(a.array)}}};extendClass(KJUR.asn1.x509.AuthorityInfoAccess,KJUR.asn1.x509.Extension);KJUR.asn1.x509.SubjectAltName=function(a){KJUR.asn1.x509.SubjectAltName.superclass.constructor.call(this,a);this.setNameArray=function(b){this.asn1ExtnValue=new KJUR.asn1.x509.GeneralNames(b)};this.getExtnValueHex=function(){return this.asn1ExtnValue.tohex()};this.oid="2.5.29.17";if(a!==undefined){if(a.array!==undefined){this.setNameArray(a.array)}}};extendClass(KJUR.asn1.x509.SubjectAltName,KJUR.asn1.x509.Extension);KJUR.asn1.x509.IssuerAltName=function(a){KJUR.asn1.x509.IssuerAltName.superclass.constructor.call(this,a);this.setNameArray=function(b){this.asn1ExtnValue=new KJUR.asn1.x509.GeneralNames(b)};this.getExtnValueHex=function(){return this.asn1ExtnValue.tohex()};this.oid="2.5.29.18";if(a!==undefined){if(a.array!==undefined){this.setNameArray(a.array)}}};extendClass(KJUR.asn1.x509.IssuerAltName,KJUR.asn1.x509.Extension);KJUR.asn1.x509.SubjectDirectoryAttributes=function(e){KJUR.asn1.x509.SubjectDirectoryAttributes.superclass.constructor.call(this,e);var c=KJUR.asn1,a=c.DERSequence,b=c.ASN1Util.newObject,d=c.x509.OID.name2oid;this.params=null;this.getExtnValueHex=function(){var f=[];for(var j=0;j<this.params.array.length;j++){var k=this.params.array[j];var h={seq:[{oid:"1.2.3.4"},{set:[{utf8str:"DE"}]}]};if(k.attr=="dateOfBirth"){h.seq[0].oid=d(k.attr);h.seq[1].set[0]={gentime:k.str}}else{if(k.attr=="placeOfBirth"){h.seq[0].oid=d(k.attr);h.seq[1].set[0]={utf8str:k.str}}else{if(k.attr=="gender"){h.seq[0].oid=d(k.attr);h.seq[1].set[0]={prnstr:k.str}}else{if(k.attr=="countryOfCitizenship"){h.seq[0].oid=d(k.attr);h.seq[1].set[0]={prnstr:k.str}}else{if(k.attr=="countryOfResidence"){h.seq[0].oid=d(k.attr);h.seq[1].set[0]={prnstr:k.str}}else{throw new Error("unsupported attribute: "+k.attr)}}}}}f.push(new b(h))}var g=new a({array:f});this.asn1ExtnValue=g;return this.asn1ExtnValue.tohex()};this.oid="2.5.29.9";if(e!==undefined){this.params=e}};extendClass(KJUR.asn1.x509.SubjectDirectoryAttributes,KJUR.asn1.x509.Extension);KJUR.asn1.x509.PrivateExtension=function(f){KJUR.asn1.x509.PrivateExtension.superclass.constructor.call(this,f);var c=KJUR,e=c.lang.String.isHex,b=c.asn1,d=b.x509.OID.name2oid,a=b.ASN1Util.newObject;this.params=null;this.setByParam=function(g){this.oid=d(g.extname);this.params=g};this.getExtnValueHex=function(){if(this.params.extname==undefined||this.params.extn==undefined){throw new Error("extname or extnhex not specified")}var h=this.params.extn;if(typeof h=="string"&&e(h)){return h}else{if(typeof h=="object"){try{return a(h).tohex()}catch(g){}}}throw new Error("unsupported extn value")};if(f!=undefined){this.setByParam(f)}};extendClass(KJUR.asn1.x509.PrivateExtension,KJUR.asn1.x509.Extension);KJUR.asn1.x509.CRL=function(g){KJUR.asn1.x509.CRL.superclass.constructor.call(this);var c=KJUR,b=c.asn1,a=b.DERSequence,e=b.DERBitString,f=b.x509,d=f.AlgorithmIdentifier,h=f.TBSCertList;this.params=undefined;this.setByParam=function(i){this.params=i};this.sign=function(){var j=(new h(this.params)).tohex();var k=new KJUR.crypto.Signature({alg:this.params.sigalg});k.init(this.params.cakey);k.updateHex(j);var i=k.sign();this.params.sighex=i};this.getPEM=function(){return hextopem(this.tohex(),"X509 CRL")};this.tohex=function(){var k=this.params;if(k.tbsobj==undefined){k.tbsobj=new h(k)}if(k.sighex==undefined&&k.cakey!=undefined){this.sign()}if(k.sighex==undefined){throw new Error("sighex or cakey parameter not defined")}var i=[];i.push(k.tbsobj);i.push(new d({name:k.sigalg}));i.push(new e({hex:"00"+k.sighex}));var j=new a({array:i});return j.tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!=undefined){this.params=g}};extendClass(KJUR.asn1.x509.CRL,KJUR.asn1.ASN1Object);KJUR.asn1.x509.TBSCertList=function(f){KJUR.asn1.x509.TBSCertList.superclass.constructor.call(this);var b=KJUR,i=b.asn1,h=i.DERInteger,g=i.DERSequence,c=i.DERTaggedObject,k=i.DERObjectIdentifier,d=i.x509,l=d.AlgorithmIdentifier,e=d.Time,j=d.Extensions,a=d.X500Name;this.params=null;this.setByParam=function(m){this.params=m};this.getRevCertSequence=function(){var m=[];var n=this.params.revcert;for(var o=0;o<n.length;o++){var p=[new h(n[o].sn),new e(n[o].date)];if(n[o].ext!=undefined){p.push(new j(n[o].ext))}m.push(new g({array:p}))}return new g({array:m})};this.tohex=function(){var n=[];var r=this.params;if(r.version!=undefined){var m=r.version-1;var p=new h({"int":m});n.push(p)}n.push(new l({name:r.sigalg}));n.push(new a(r.issuer));n.push(new e(r.thisupdate));if(r.nextupdate!=undefined){n.push(new e(r.nextupdate))}if(r.revcert!=undefined){n.push(this.getRevCertSequence())}if(r.ext!=undefined){var q=new j(r.ext);n.push(new c({tag:"a0",explicit:true,obj:q}))}var o=new g({array:n});return o.tohex()};this.getEncodedHex=function(){return this.tohex()};if(f!==undefined){this.setByParam(f)}};extendClass(KJUR.asn1.x509.TBSCertList,KJUR.asn1.ASN1Object);KJUR.asn1.x509.CRLEntry=function(e){KJUR.asn1.x509.CRLEntry.superclass.constructor.call(this);var d=null,c=null,b=KJUR,a=b.asn1;this.setCertSerial=function(f){this.sn=new a.DERInteger(f)};this.setRevocationDate=function(f){this.time=new a.x509.Time(f)};this.tohex=function(){var f=new a.DERSequence({array:[this.sn,this.time]});this.TLV=f.tohex();return this.TLV};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){if(e.time!==undefined){this.setRevocationDate(e.time)}if(e.sn!==undefined){this.setCertSerial(e.sn)}}};extendClass(KJUR.asn1.x509.CRLEntry,KJUR.asn1.ASN1Object);KJUR.asn1.x509.CRLNumber=function(a){KJUR.asn1.x509.CRLNumber.superclass.constructor.call(this,a);this.params=undefined;this.getExtnValueHex=function(){this.asn1ExtnValue=new KJUR.asn1.DERInteger(this.params.num);return this.asn1ExtnValue.tohex()};this.oid="2.5.29.20";if(a!=undefined){this.params=a}};extendClass(KJUR.asn1.x509.CRLNumber,KJUR.asn1.x509.Extension);KJUR.asn1.x509.CRLReason=function(a){KJUR.asn1.x509.CRLReason.superclass.constructor.call(this,a);this.params=undefined;this.getExtnValueHex=function(){this.asn1ExtnValue=new KJUR.asn1.DEREnumerated(this.params.code);return this.asn1ExtnValue.tohex()};this.oid="2.5.29.21";if(a!=undefined){this.params=a}};extendClass(KJUR.asn1.x509.CRLReason,KJUR.asn1.x509.Extension);KJUR.asn1.x509.OCSPNonce=function(a){KJUR.asn1.x509.OCSPNonce.superclass.constructor.call(this,a);this.params=undefined;this.getExtnValueHex=function(){this.asn1ExtnValue=new KJUR.asn1.DEROctetString(this.params);return this.asn1ExtnValue.tohex()};this.oid="1.3.6.1.5.5.7.48.1.2";if(a!=undefined){this.params=a}};extendClass(KJUR.asn1.x509.OCSPNonce,KJUR.asn1.x509.Extension);KJUR.asn1.x509.OCSPNoCheck=function(a){KJUR.asn1.x509.OCSPNoCheck.superclass.constructor.call(this,a);this.params=undefined;this.getExtnValueHex=function(){this.asn1ExtnValue=new KJUR.asn1.DERNull();return this.asn1ExtnValue.tohex()};this.oid="1.3.6.1.5.5.7.48.1.5";if(a!=undefined){this.params=a}};extendClass(KJUR.asn1.x509.OCSPNoCheck,KJUR.asn1.x509.Extension);KJUR.asn1.x509.AdobeTimeStamp=function(g){KJUR.asn1.x509.AdobeTimeStamp.superclass.constructor.call(this,g);var c=KJUR,b=c.asn1,f=b.DERInteger,d=b.DERBoolean,a=b.DERSequence,e=b.x509.GeneralName;this.params=null;this.getExtnValueHex=function(){var i=this.params;var h=[new f(1)];h.push(new e({uri:i.uri}));if(i.reqauth!=undefined){h.push(new d(i.reqauth))}this.asn1ExtnValue=new a({array:h});return this.asn1ExtnValue.tohex()};this.oid="1.2.840.113583.1.1.9.1";if(g!==undefined){this.setByParam(g)}};extendClass(KJUR.asn1.x509.AdobeTimeStamp,KJUR.asn1.x509.Extension);KJUR.asn1.x509.X500Name=function(f){KJUR.asn1.x509.X500Name.superclass.constructor.call(this);this.asn1Array=[];this.paramArray=[];this.sRule="utf8";var c=KJUR,b=c.asn1,e=b.x509,d=e.RDN,a=pemtohex;this.setByString=function(g,l){if(l!==undefined){this.sRule=l}var k=g.split("/");k.shift();var j=[];for(var m=0;m<k.length;m++){if(k[m].match(/^[^=]+=.+$/)){j.push(k[m])}else{var h=j.length-1;j[h]=j[h]+"/"+k[m]}}for(var m=0;m<j.length;m++){this.asn1Array.push(new d({str:j[m],rule:this.sRule}))}};this.setByLdapString=function(g,h){if(h!==undefined){this.sRule=h}var i=e.X500Name.ldapToCompat(g);this.setByString(i,h)};this.setByObject=function(j,i){if(i!==undefined){this.sRule=i}for(var g in j){if(j.hasOwnProperty(g)){var h=new d({str:g+"="+j[g],rule:this.sRule});this.asn1Array?this.asn1Array.push(h):this.asn1Array=[h]}}};this.setByParam=function(h){if(h.rule!==undefined){this.sRule=h.rule}if(h.array!==undefined){this.paramArray=h.array}else{if(h.str!==undefined){this.setByString(h.str)}else{if(h.ldapstr!==undefined){this.setByLdapString(h.ldapstr)}else{if(h.hex!==undefined){this.hTLV=h.hex}else{if(h.certissuer!==undefined){var g=new X509();g.readCertPEM(h.certissuer);this.hTLV=g.getIssuerHex()}else{if(h.certsubject!==undefined){var g=new X509();g.readCertPEM(h.certsubject);this.hTLV=g.getSubjectHex()}else{if(typeof h==="object"&&h.certsubject===undefined&&h.certissuer===undefined){this.setByObject(h)}}}}}}}};this.tohex=function(){if(typeof this.hTLV=="string"){return this.hTLV}if(this.asn1Array.length==0&&this.paramArray.length>0){for(var g=0;g<this.paramArray.length;g++){var k={array:this.paramArray[g]};if(this.sRule!="utf8"){k.rule=this.sRule}var h=new d(k);this.asn1Array.push(h)}}var j=new b.DERSequence({array:this.asn1Array});this.hTLV=j.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(f!==undefined){this.setByParam(f)}};extendClass(KJUR.asn1.x509.X500Name,KJUR.asn1.ASN1Object);KJUR.asn1.x509.X500Name.compatToLDAP=function(d){if(d.substr(0,1)!=="/"){throw"malformed input"}var b="";d=d.substr(1);var c=d.split("/");c.reverse();c=c.map(function(a){return a.replace(/,/,"\\,")});return c.join(",")};KJUR.asn1.x509.X500Name.onelineToLDAP=function(a){return KJUR.asn1.x509.X500Name.compatToLDAP(a)};KJUR.asn1.x509.X500Name.ldapToCompat=function(g){var c=g.split(",");var e=false;var b=[];for(var f=0;c.length>0;f++){var h=c.shift();if(e===true){var d=b.pop();var j=(d+","+h).replace(/\\,/g,",");b.push(j);e=false}else{b.push(h)}if(h.substr(-1,1)==="\\"){e=true}}b=b.map(function(a){return a.replace("/","\\/")});b.reverse();return"/"+b.join("/")};KJUR.asn1.x509.X500Name.ldapToOneline=function(a){return KJUR.asn1.x509.X500Name.ldapToCompat(a)};KJUR.asn1.x509.RDN=function(b){KJUR.asn1.x509.RDN.superclass.constructor.call(this);this.asn1Array=[];this.paramArray=[];this.sRule="utf8";var a=KJUR.asn1.x509.AttributeTypeAndValue;this.setByParam=function(c){if(c.rule!==undefined){this.sRule=c.rule}if(c.str!==undefined){this.addByMultiValuedString(c.str)}if(c.array!==undefined){this.paramArray=c.array}};this.addByString=function(c){this.asn1Array.push(new KJUR.asn1.x509.AttributeTypeAndValue({str:c,rule:this.sRule}))};this.addByMultiValuedString=function(e){var c=KJUR.asn1.x509.RDN.parseString(e);for(var d=0;d<c.length;d++){this.addByString(c[d])}};this.tohex=function(){if(this.asn1Array.length==0&&this.paramArray.length>0){for(var d=0;d<this.paramArray.length;d++){var f=this.paramArray[d];if(f.rule!==undefined&&this.sRule!="utf8"){f.rule=this.sRule}var c=new a(f);this.asn1Array.push(c)}}var e=new KJUR.asn1.DERSet({array:this.asn1Array});this.TLV=e.tohex();return this.TLV};this.getEncodedHex=function(){return this.tohex()};if(b!==undefined){this.setByParam(b)}};extendClass(KJUR.asn1.x509.RDN,KJUR.asn1.ASN1Object);KJUR.asn1.x509.RDN.parseString=function(m){var j=m.split(/\+/);var h=false;var c=[];for(var g=0;j.length>0;g++){var k=j.shift();if(h===true){var f=c.pop();var d=(f+"+"+k).replace(/\\\+/g,"+");c.push(d);h=false}else{c.push(k)}if(k.substr(-1,1)==="\\"){h=true}}var l=false;var b=[];for(var g=0;c.length>0;g++){var k=c.shift();if(l===true){var e=b.pop();if(k.match(/"$/)){var d=(e+"+"+k).replace(/^([^=]+)="(.*)"$/,"$1=$2");b.push(d);l=false}else{b.push(e+"+"+k)}}else{b.push(k)}if(k.match(/^[^=]+="/)){l=true}}return b};KJUR.asn1.x509.AttributeTypeAndValue=function(c){KJUR.asn1.x509.AttributeTypeAndValue.superclass.constructor.call(this);this.sRule="utf8";this.sType=null;this.sValue=null;this.dsType=null;var a=KJUR,g=a.asn1,d=g.DERSequence,l=g.DERUTF8String,i=g.DERPrintableString,h=g.DERTeletexString,b=g.DERIA5String,e=g.DERVisibleString,k=g.DERBMPString,f=a.lang.String.isMail,j=a.lang.String.isPrintable;this.setByParam=function(o){if(o.rule!==undefined){this.sRule=o.rule}if(o.ds!==undefined){this.dsType=o.ds}if(o.value===undefined&&o.str!==undefined){var n=o.str;var m=n.match(/^([^=]+)=(.+)$/);if(m){this.sType=m[1];this.sValue=m[2]}else{throw new Error("malformed attrTypeAndValueStr: "+attrTypeAndValueStr)}}else{this.sType=o.type;this.sValue=o.value}};this.setByString=function(n,o){if(o!==undefined){this.sRule=o}var m=n.match(/^([^=]+)=(.+)$/);if(m){this.setByAttrTypeAndValueStr(m[1],m[2])}else{throw new Error("malformed attrTypeAndValueStr: "+attrTypeAndValueStr)}};this._getDsType=function(){var o=this.sType;var n=this.sValue;var m=this.sRule;if(m==="prn"){if(o=="CN"&&f(n)){return"ia5"}if(j(n)){return"prn"}return"utf8"}else{if(m==="utf8"){if(o=="CN"&&f(n)){return"ia5"}if(o=="C"){return"prn"}return"utf8"}}return"utf8"};this.setByAttrTypeAndValueStr=function(o,n,m){if(m!==undefined){this.sRule=m}this.sType=o;this.sValue=n};this.getValueObj=function(n,m){if(n=="utf8"){return new l({str:m})}if(n=="prn"){return new i({str:m})}if(n=="tel"){return new h({str:m})}if(n=="ia5"){return new b({str:m})}if(n=="vis"){return new e({str:m})}if(n=="bmp"){return new k({str:m})}throw new Error("unsupported directory string type: type="+n+" value="+m)};this.tohex=function(){if(this.dsType==null){this.dsType=this._getDsType()}var n=KJUR.asn1.x509.OID.atype2obj(this.sType);var m=this.getValueObj(this.dsType,this.sValue);var p=new d({array:[n,m]});this.TLV=p.tohex();return this.TLV};this.getEncodedHex=function(){return this.tohex()};if(c!==undefined){this.setByParam(c)}};extendClass(KJUR.asn1.x509.AttributeTypeAndValue,KJUR.asn1.ASN1Object);KJUR.asn1.x509.SubjectPublicKeyInfo=function(f){KJUR.asn1.x509.SubjectPublicKeyInfo.superclass.constructor.call(this);var l=null,k=null,a=KJUR,j=a.asn1,i=j.DERInteger,b=j.DERBitString,m=j.DERObjectIdentifier,e=j.DERSequence,h=j.ASN1Util.newObject,d=j.x509,o=d.AlgorithmIdentifier,g=a.crypto,n=g.ECDSA,c=g.DSA;this.getASN1Object=function(){if(this.asn1AlgId==null||this.asn1SubjPKey==null){throw"algId and/or subjPubKey not set"}var p=new e({array:[this.asn1AlgId,this.asn1SubjPKey]});return p};this.tohex=function(){var p=this.getASN1Object();this.hTLV=p.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};this.setPubKey=function(q){try{if(q instanceof RSAKey){var u=h({seq:[{"int":{bigint:q.n}},{"int":{"int":q.e}}]});var s=u.tohex();this.asn1AlgId=new o({name:"rsaEncryption"});this.asn1SubjPKey=new b({hex:"00"+s})}}catch(p){}try{if(q instanceof KJUR.crypto.ECDSA){var r=new m({name:q.curveName});this.asn1AlgId=new o({name:"ecPublicKey",asn1params:r});this.asn1SubjPKey=new b({hex:"00"+q.pubKeyHex})}}catch(p){}try{if(q instanceof KJUR.crypto.DSA){var r=new h({seq:[{"int":{bigint:q.p}},{"int":{bigint:q.q}},{"int":{bigint:q.g}}]});this.asn1AlgId=new o({name:"dsa",asn1params:r});var t=new i({bigint:q.y});this.asn1SubjPKey=new b({hex:"00"+t.tohex()})}}catch(p){}};if(f!==undefined){this.setPubKey(f)}};extendClass(KJUR.asn1.x509.SubjectPublicKeyInfo,KJUR.asn1.ASN1Object);KJUR.asn1.x509.Time=function(f){KJUR.asn1.x509.Time.superclass.constructor.call(this);var e=null,a=null,d=KJUR,c=d.asn1,b=c.DERUTCTime,g=c.DERGeneralizedTime;this.params=null;this.type=null;this.setTimeParams=function(h){this.timeParams=h};this.setByParam=function(h){this.params=h};this.getType=function(h){if(h.match(/^[0-9]{12}Z$/)){return"utc"}if(h.match(/^[0-9]{14}Z$/)){return"gen"}if(h.match(/^[0-9]{12}\.[0-9]+Z$/)){return"utc"}if(h.match(/^[0-9]{14}\.[0-9]+Z$/)){return"gen"}return null};this.tohex=function(){var i=this.params;var h=null;if(typeof i=="string"){i={str:i}}if(i!=null&&i.str&&(i.type==null||i.type==undefined)){i.type=this.getType(i.str)}if(i!=null&&i.str){if(i.type=="utc"){h=new b(i.str)}if(i.type=="gen"){h=new g(i.str)}}else{if(this.type=="gen"){h=new g()}else{h=new b()}}if(h==null){throw new Error("wrong setting for Time")}this.TLV=h.tohex();return this.TLV};this.getEncodedHex=function(){return this.tohex()};if(f!=undefined){this.setByParam(f)}};KJUR.asn1.x509.Time_bak=function(f){KJUR.asn1.x509.Time_bak.superclass.constructor.call(this);var e=null,a=null,d=KJUR,c=d.asn1,b=c.DERUTCTime,g=c.DERGeneralizedTime;this.setTimeParams=function(h){this.timeParams=h};this.tohex=function(){var h=null;if(this.timeParams!=null){if(this.type=="utc"){h=new b(this.timeParams)}else{h=new g(this.timeParams)}}else{if(this.type=="utc"){h=new b()}else{h=new g()}}this.TLV=h.tohex();return this.TLV};this.getEncodedHex=function(){return this.tohex()};this.type="utc";if(f!==undefined){if(f.type!==undefined){this.type=f.type}else{if(f.str!==undefined){if(f.str.match(/^[0-9]{12}Z$/)){this.type="utc"}if(f.str.match(/^[0-9]{14}Z$/)){this.type="gen"}}}this.timeParams=f}};extendClass(KJUR.asn1.x509.Time,KJUR.asn1.ASN1Object);KJUR.asn1.x509.AlgorithmIdentifier=function(e){KJUR.asn1.x509.AlgorithmIdentifier.superclass.constructor.call(this);this.nameAlg=null;this.asn1Alg=null;this.asn1Params=null;this.paramEmpty=false;var b=KJUR,a=b.asn1,c=a.x509.AlgorithmIdentifier.PSSNAME2ASN1TLV;this.tohex=function(){if(this.nameAlg===null&&this.asn1Alg===null){throw new Error("algorithm not specified")}if(this.nameAlg!==null){var f=null;for(var h in c){if(h===this.nameAlg){f=c[h]}}if(f!==null){this.hTLV=f;return this.hTLV}}if(this.nameAlg!==null&&this.asn1Alg===null){this.asn1Alg=a.x509.OID.name2obj(this.nameAlg)}var g=[this.asn1Alg];if(this.asn1Params!==null){g.push(this.asn1Params)}var i=new a.DERSequence({array:g});this.hTLV=i.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){if(e.name!==undefined){this.nameAlg=e.name}if(e.asn1params!==undefined){this.asn1Params=e.asn1params}if(e.paramempty!==undefined){this.paramEmpty=e.paramempty}}if(this.asn1Params===null&&this.paramEmpty===false&&this.nameAlg!==null){if(this.nameAlg.name!==undefined){this.nameAlg=this.nameAlg.name}var d=this.nameAlg.toLowerCase();if(d.substr(-7,7)!=="withdsa"&&d.substr(-9,9)!=="withecdsa"){this.asn1Params=new a.DERNull()}}};extendClass(KJUR.asn1.x509.AlgorithmIdentifier,KJUR.asn1.ASN1Object);KJUR.asn1.x509.AlgorithmIdentifier.PSSNAME2ASN1TLV={SHAwithRSAandMGF1:"300d06092a864886f70d01010a3000",SHA256withRSAandMGF1:"303d06092a864886f70d01010a3030a00d300b0609608648016503040201a11a301806092a864886f70d010108300b0609608648016503040201a203020120",SHA384withRSAandMGF1:"303d06092a864886f70d01010a3030a00d300b0609608648016503040202a11a301806092a864886f70d010108300b0609608648016503040202a203020130",SHA512withRSAandMGF1:"303d06092a864886f70d01010a3030a00d300b0609608648016503040203a11a301806092a864886f70d010108300b0609608648016503040203a203020140"};KJUR.asn1.x509.GeneralName=function(f){KJUR.asn1.x509.GeneralName.superclass.constructor.call(this);var l={rfc822:"81",dns:"82",dn:"a4",uri:"86",ip:"87",otherName:"a0"},b=KJUR,h=b.asn1,d=h.x509,a=d.X500Name,g=d.OtherName,e=h.DERIA5String,i=h.DERPrintableString,k=h.DEROctetString,c=h.DERTaggedObject,m=h.ASN1Object,j=Error;this.params=null;this.setByParam=function(n){this.params=n};this.tohex=function(){var p=this.params;var A,y,q;var y=false;if(p.other!==undefined){A="a0",q=new g(p.other)}else{if(p.rfc822!==undefined){A="81";q=new e({str:p.rfc822})}else{if(p.dns!==undefined){A="82";q=new e({str:p.dns})}else{if(p.dn!==undefined){A="a4";y=true;if(typeof p.dn==="string"){q=new a({str:p.dn})}else{if(p.dn instanceof KJUR.asn1.x509.X500Name){q=p.dn}else{q=new a(p.dn)}}}else{if(p.ldapdn!==undefined){A="a4";y=true;q=new a({ldapstr:p.ldapdn})}else{if(p.certissuer!==undefined||p.certsubj!==undefined){A="a4";y=true;var n,o;var z=null;if(p.certsubj!==undefined){n=false;o=p.certsubj}else{n=true;o=p.certissuer}if(o.match(/^[0-9A-Fa-f]+$/)){z==o}if(o.indexOf("-----BEGIN ")!=-1){z=pemtohex(o)}if(z==null){throw new Error("certsubj/certissuer not cert")}var w=new X509();w.hex=z;var s;if(n){s=w.getIssuerHex()}else{s=w.getSubjectHex()}q=new m();q.hTLV=s}else{if(p.uri!==undefined){A="86";q=new e({str:p.uri})}else{if(p.ip!==undefined){A="87";var v;var t=p.ip;try{if(t.match(/^[0-9a-f]+$/)){var r=t.length;if(r==8||r==16||r==32||r==64){v=t}else{throw"err"}}else{v=iptohex(t)}}catch(u){throw new j("malformed IP address: "+p.ip+":"+u.message)}q=new k({hex:v})}else{throw new j("improper params")}}}}}}}}var B=new c({tag:A,explicit:y,obj:q});return B.tohex()};this.getEncodedHex=function(){return this.tohex()};if(f!==undefined){this.setByParam(f)}};extendClass(KJUR.asn1.x509.GeneralName,KJUR.asn1.ASN1Object);KJUR.asn1.x509.GeneralNames=function(d){KJUR.asn1.x509.GeneralNames.superclass.constructor.call(this);var a=null,c=KJUR,b=c.asn1;this.setByParamArray=function(g){for(var e=0;e<g.length;e++){var f=new b.x509.GeneralName(g[e]);this.asn1Array.push(f)}};this.tohex=function(){var e=new b.DERSequence({array:this.asn1Array});return e.tohex()};this.getEncodedHex=function(){return this.tohex()};this.asn1Array=new Array();if(typeof d!="undefined"){this.setByParamArray(d)}};extendClass(KJUR.asn1.x509.GeneralNames,KJUR.asn1.ASN1Object);KJUR.asn1.x509.OtherName=function(g){KJUR.asn1.x509.OtherName.superclass.constructor.call(this);var f=null,e=null,d=KJUR,c=d.asn1,h=c.DERObjectIdentifier,a=c.DERSequence,b=c.ASN1Util.newObject;this.params=null;this.setByParam=function(i){this.params=i};this.tohex=function(){var k=this.params;if(k.oid==undefined||k.value==undefined){throw new Error("oid or value not specified")}var l=new h({oid:k.oid});var i=b({tag:{tag:"a0",explicit:true,obj:k.value}});var j=new a({array:[l,i]});return j.tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!==undefined){this.setByParam(g)}};extendClass(KJUR.asn1.x509.OtherName,KJUR.asn1.ASN1Object);KJUR.asn1.x509.OID=new function(){var a=KJUR.asn1.DERObjectIdentifier;this.name2oidList={sha1:"1.3.14.3.2.26",sha256:"2.16.840.1.101.3.4.2.1",sha384:"2.16.840.1.101.3.4.2.2",sha512:"2.16.840.1.101.3.4.2.3",sha224:"2.16.840.1.101.3.4.2.4",md5:"1.2.840.113549.2.5",md2:"1.3.14.7.2.2.1",ripemd160:"1.3.36.3.2.1",MD2withRSA:"1.2.840.113549.1.1.2",MD4withRSA:"1.2.840.113549.1.1.3",MD5withRSA:"1.2.840.113549.1.1.4",SHA1withRSA:"1.2.840.113549.1.1.5","pkcs1-MGF":"1.2.840.113549.1.1.8",rsaPSS:"1.2.840.113549.1.1.10",SHA224withRSA:"1.2.840.113549.1.1.14",SHA256withRSA:"1.2.840.113549.1.1.11",SHA384withRSA:"1.2.840.113549.1.1.12",SHA512withRSA:"1.2.840.113549.1.1.13",SHA1withECDSA:"1.2.840.10045.4.1",SHA224withECDSA:"1.2.840.10045.4.3.1",SHA256withECDSA:"1.2.840.10045.4.3.2",SHA384withECDSA:"1.2.840.10045.4.3.3",SHA512withECDSA:"1.2.840.10045.4.3.4",dsa:"1.2.840.10040.4.1",SHA1withDSA:"1.2.840.10040.4.3",SHA224withDSA:"2.16.840.1.101.3.4.3.1",SHA256withDSA:"2.16.840.1.101.3.4.3.2",rsaEncryption:"1.2.840.113549.1.1.1",commonName:"2.5.4.3",countryName:"2.5.4.6",localityName:"2.5.4.7",stateOrProvinceName:"2.5.4.8",streetAddress:"2.5.4.9",organizationName:"2.5.4.10",organizationalUnitName:"2.5.4.11",domainComponent:"0.9.2342.19200300.100.1.25",userId:"0.9.2342.19200300.100.1.1",surname:"2.5.4.4",givenName:"2.5.4.42",title:"2.5.4.12",distinguishedName:"2.5.4.49",emailAddress:"1.2.840.113549.1.9.1",description:"2.5.4.13",businessCategory:"2.5.4.15",postalCode:"2.5.4.17",uniqueIdentifier:"2.5.4.45",organizationIdentifier:"2.5.4.97",jurisdictionOfIncorporationL:"1.3.6.1.4.1.311.60.2.1.1",jurisdictionOfIncorporationSP:"1.3.6.1.4.1.311.60.2.1.2",jurisdictionOfIncorporationC:"1.3.6.1.4.1.311.60.2.1.3",subjectDirectoryAttributes:"2.5.29.9",subjectKeyIdentifier:"2.5.29.14",keyUsage:"2.5.29.15",subjectAltName:"2.5.29.17",issuerAltName:"2.5.29.18",basicConstraints:"2.5.29.19",cRLNumber:"2.5.29.20",cRLReason:"2.5.29.21",nameConstraints:"2.5.29.30",cRLDistributionPoints:"2.5.29.31",certificatePolicies:"2.5.29.32",anyPolicy:"2.5.29.32.0",authorityKeyIdentifier:"2.5.29.35",policyConstraints:"2.5.29.36",extKeyUsage:"2.5.29.37",authorityInfoAccess:"1.3.6.1.5.5.7.1.1",ocsp:"1.3.6.1.5.5.7.48.1",ocspBasic:"1.3.6.1.5.5.7.48.1.1",ocspNonce:"1.3.6.1.5.5.7.48.1.2",ocspNoCheck:"1.3.6.1.5.5.7.48.1.5",caIssuers:"1.3.6.1.5.5.7.48.2",anyExtendedKeyUsage:"2.5.29.37.0",serverAuth:"1.3.6.1.5.5.7.3.1",clientAuth:"1.3.6.1.5.5.7.3.2",codeSigning:"1.3.6.1.5.5.7.3.3",emailProtection:"1.3.6.1.5.5.7.3.4",timeStamping:"1.3.6.1.5.5.7.3.8",ocspSigning:"1.3.6.1.5.5.7.3.9",smtpUTF8Mailbox:"1.3.6.1.5.5.7.8.9",dateOfBirth:"1.3.6.1.5.5.7.9.1",placeOfBirth:"1.3.6.1.5.5.7.9.2",gender:"1.3.6.1.5.5.7.9.3",countryOfCitizenship:"1.3.6.1.5.5.7.9.4",countryOfResidence:"1.3.6.1.5.5.7.9.5",ecPublicKey:"1.2.840.10045.2.1","P-256":"1.2.840.10045.3.1.7",secp256r1:"1.2.840.10045.3.1.7",secp256k1:"1.3.132.0.10",secp384r1:"1.3.132.0.34",secp521r1:"1.3.132.0.35",pkcs5PBES2:"1.2.840.113549.1.5.13",pkcs5PBKDF2:"1.2.840.113549.1.5.12","des-EDE3-CBC":"1.2.840.113549.3.7",data:"1.2.840.113549.1.7.1","signed-data":"1.2.840.113549.1.7.2","enveloped-data":"1.2.840.113549.1.7.3","digested-data":"1.2.840.113549.1.7.5","encrypted-data":"1.2.840.113549.1.7.6","authenticated-data":"1.2.840.113549.1.9.16.1.2",tstinfo:"1.2.840.113549.1.9.16.1.4",signingCertificate:"1.2.840.113549.1.9.16.2.12",timeStampToken:"1.2.840.113549.1.9.16.2.14",signaturePolicyIdentifier:"1.2.840.113549.1.9.16.2.15",etsArchiveTimeStamp:"1.2.840.113549.1.9.16.2.27",signingCertificateV2:"1.2.840.113549.1.9.16.2.47",etsArchiveTimeStampV2:"1.2.840.113549.1.9.16.2.48",extensionRequest:"1.2.840.113549.1.9.14",contentType:"1.2.840.113549.1.9.3",messageDigest:"1.2.840.113549.1.9.4",signingTime:"1.2.840.113549.1.9.5",counterSignature:"1.2.840.113549.1.9.6",archiveTimeStampV3:"0.4.0.1733.2.4",pdfRevocationInfoArchival:"1.2.840.113583.1.1.8",adobeTimeStamp:"1.2.840.113583.1.1.9.1",};this.atype2oidList={CN:"2.5.4.3",L:"2.5.4.7",ST:"2.5.4.8",O:"2.5.4.10",OU:"2.5.4.11",C:"2.5.4.6",STREET:"2.5.4.9",DC:"0.9.2342.19200300.100.1.25",UID:"0.9.2342.19200300.100.1.1",SN:"2.5.4.4",T:"2.5.4.12",DN:"2.5.4.49",E:"1.2.840.113549.1.9.1",description:"2.5.4.13",businessCategory:"2.5.4.15",postalCode:"2.5.4.17",serialNumber:"2.5.4.5",uniqueIdentifier:"2.5.4.45",organizationIdentifier:"2.5.4.97",jurisdictionOfIncorporationL:"1.3.6.1.4.1.311.60.2.1.1",jurisdictionOfIncorporationSP:"1.3.6.1.4.1.311.60.2.1.2",jurisdictionOfIncorporationC:"1.3.6.1.4.1.311.60.2.1.3"};this.objCache={};this.name2obj=function(b){if(typeof this.objCache[b]!="undefined"){return this.objCache[b]}if(typeof this.name2oidList[b]=="undefined"){throw"Name of ObjectIdentifier not defined: "+b}var c=this.name2oidList[b];var d=new a({oid:c});this.objCache[b]=d;return d};this.atype2obj=function(b){if(this.objCache[b]!==undefined){return this.objCache[b]}var c;if(b.match(/^\d+\.\d+\.[0-9.]+$/)){c=b}else{if(this.atype2oidList[b]!==undefined){c=this.atype2oidList[b]}else{if(this.name2oidList[b]!==undefined){c=this.name2oidList[b]}else{throw new Error("AttributeType name undefined: "+b)}}}var d=new a({oid:c});this.objCache[b]=d;return d};this.registerOIDs=function(b){if(!this.checkOIDs(b)){return}for(var c in b){this.name2oidList[c]=b[c]}};this.checkOIDs=function(b){try{var d=Object.keys(b);if(d.length==0){return false}d.map(function(g,e,h){var f=this[g];if(!f.match(/^[0-2]\.[0-9.]+$/)){throw new Error("value is not OID")}},b);return true}catch(c){return false}}};KJUR.asn1.x509.OID.oid2name=function(b){var c=KJUR.asn1.x509.OID.name2oidList;for(var a in c){if(c[a]==b){return a}}return""};KJUR.asn1.x509.OID.oid2atype=function(b){var c=KJUR.asn1.x509.OID.atype2oidList;for(var a in c){if(c[a]==b){return a}}return b};KJUR.asn1.x509.OID.name2oid=function(a){if(a.match(/^[0-9.]+$/)){return a}var b=KJUR.asn1.x509.OID.name2oidList;if(b[a]===undefined){return""}return b[a]};KJUR.asn1.x509.X509Util={};KJUR.asn1.x509.X509Util.newCertPEM=function(e){var d=KJUR.asn1.x509,b=d.TBSCertificate,a=d.Certificate;var c=new a(e);return c.getPEM()};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.cms=="undefined"||!KJUR.asn1.cms){KJUR.asn1.cms={}}KJUR.asn1.cms.Attribute=function(f){var e=Error,d=KJUR,c=d.asn1,b=c.DERSequence,a=c.DERSet,g=c.DERObjectIdentifier;this.params=null;this.typeOid=null;this.setByParam=function(h){this.params=h};this.getValueArray=function(){throw new e("not yet implemented abstract")};this.tohex=function(){var j=new g({oid:this.typeOid});var h=new a({array:this.getValueArray()});var i=new b({array:[j,h]});return i.tohex()};this.getEncodedHex=function(){return this.tohex()}};extendClass(KJUR.asn1.cms.Attribute,KJUR.asn1.ASN1Object);KJUR.asn1.cms.ContentType=function(c){var b=KJUR,a=b.asn1;a.cms.ContentType.superclass.constructor.call(this);this.typeOid="1.2.840.113549.1.9.3";this.getValueArray=function(){var d=new a.DERObjectIdentifier(this.params.type);return[d]};if(c!=undefined){this.setByParam(c)}};extendClass(KJUR.asn1.cms.ContentType,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.MessageDigest=function(e){var b=KJUR,a=b.asn1,c=a.DEROctetString,d=a.cms;d.MessageDigest.superclass.constructor.call(this);this.typeOid="1.2.840.113549.1.9.4";this.getValueArray=function(){var f=new c(this.params);return[f]};if(e!=undefined){this.setByParam(e)}};extendClass(KJUR.asn1.cms.MessageDigest,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.SigningTime=function(c){var b=KJUR,a=b.asn1;a.cms.SigningTime.superclass.constructor.call(this);this.typeOid="1.2.840.113549.1.9.5";this.getValueArray=function(){var d=new a.x509.Time(this.params);return[d]};if(c!=undefined){this.setByParam(c)}};extendClass(KJUR.asn1.cms.SigningTime,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.SigningCertificate=function(h){var e=Error,d=KJUR,c=d.asn1,b=c.DERSequence,g=c.cms,a=g.ESSCertID,f=d.crypto;g.SigningCertificate.superclass.constructor.call(this);this.typeOid="1.2.840.113549.1.9.16.2.12";this.getValueArray=function(){if(this.params==null||this.params==undefined||this.params.array==undefined){throw new e("parameter 'array' not specified")}var o=this.params.array;var k=[];for(var l=0;l<o.length;l++){var n=o[l];if(h.hasis==false&&(typeof n=="string"&&(n.indexOf("-----BEGIN")!=-1||ASN1HEX.isASN1HEX(n)))){n={cert:n}}if(n.hasis!=false&&h.hasis==false){n.hasis=false}k.push(new a(n))}var j=new b({array:k});var m=new b({array:[j]});return[m]};if(h!=undefined){this.setByParam(h)}};extendClass(KJUR.asn1.cms.SigningCertificate,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.ESSCertID=function(g){KJUR.asn1.cms.ESSCertID.superclass.constructor.call(this);var d=Error,c=KJUR,b=c.asn1,f=b.DEROctetString,a=b.DERSequence,e=b.cms.IssuerSerial;this.params=null;this.getCertHash=function(k,h){if(k.hash!=undefined){return k.hash}if(typeof k=="string"&&k.indexOf("-----BEGIN")==-1&&!ASN1HEX.isASN1HEX(k)){return k}var i;if(typeof k=="string"){i=k}else{if(k.cert!=undefined){i=k.cert}else{throw new d("hash nor cert unspecified")}}var j;if(i.indexOf("-----BEGIN")!=-1){j=pemtohex(i)}else{j=i}if(typeof k=="string"){if(k.indexOf("-----BEGIN")!=-1){j=pemtohex(k)}else{if(ASN1HEX.isASN1HEX(k)){j=k}}}var l;if(k.alg!=undefined){l=k.alg}else{if(h!=undefined){l=h}else{throw new d("hash alg unspecified")}}return c.crypto.Util.hashHex(j,l)};this.tohex=function(){var k=this.params;var j=this.getCertHash(k,"sha1");var h=[];h.push(new f({hex:j}));if((typeof k=="string"&&k.indexOf("-----BEGIN")!=-1)||(k.cert!=undefined&&k.hasis!=false)||(k.issuer!=undefined&&k.serial!=undefined)){h.push(new e(k))}var i=new a({array:h});return i.tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!=undefined){this.setByParam(g)}};extendClass(KJUR.asn1.cms.ESSCertID,KJUR.asn1.ASN1Object);KJUR.asn1.cms.SigningCertificateV2=function(d){var h=Error,a=KJUR,g=a.asn1,e=g.DERSequence,b=g.x509,i=g.cms,c=i.ESSCertIDv2,f=a.crypto;i.SigningCertificateV2.superclass.constructor.call(this);this.typeOid="1.2.840.113549.1.9.16.2.47";this.getValueArray=function(){if(this.params==null||this.params==undefined||this.params.array==undefined){throw new h("parameter 'array' not specified")}var o=this.params.array;var l=[];for(var m=0;m<o.length;m++){var n=o[m];if((d.alg!=undefined||d.hasis==false)&&(typeof n=="string"&&(n.indexOf("-----BEGIN")!=-1||ASN1HEX.isASN1HEX(n)))){n={cert:n}}if(n.alg==undefined&&d.alg!=undefined){n.alg=d.alg}if(n.hasis!=false&&d.hasis==false){n.hasis=false}l.push(new c(n))}var k=new e({array:l});var j=new e({array:[k]});return[j]};if(d!=undefined){this.setByParam(d)}};extendClass(KJUR.asn1.cms.SigningCertificateV2,KJUR.asn1.cms.Attribute);KJUR.asn1.cms.ESSCertIDv2=function(h){KJUR.asn1.cms.ESSCertIDv2.superclass.constructor.call(this);var d=Error,c=KJUR,b=c.asn1,f=b.DEROctetString,a=b.DERSequence,e=b.cms.IssuerSerial,g=b.x509.AlgorithmIdentifier;this.params=null;this.tohex=function(){var l=this.params;var k=this.getCertHash(l,"sha256");var i=[];if(l.alg!=undefined&&l.alg!="sha256"){i.push(new g({name:l.alg}))}i.push(new f({hex:k}));if((typeof l=="string"&&l.indexOf("-----BEGIN")!=-1)||(l.cert!=undefined&&l.hasis!=false)||(l.issuer!=undefined&&l.serial!=undefined)){i.push(new e(l))}var j=new a({array:i});return j.tohex()};this.getEncodedHex=function(){return this.tohex()};if(h!=undefined){this.setByParam(h)}};extendClass(KJUR.asn1.cms.ESSCertIDv2,KJUR.asn1.cms.ESSCertID);KJUR.asn1.cms.IssuerSerial=function(e){var i=Error,c=KJUR,h=c.asn1,g=h.DERInteger,f=h.DERSequence,j=h.cms,d=h.x509,a=d.GeneralNames,b=X509;j.IssuerSerial.superclass.constructor.call(this);this.setByParam=function(k){this.params=k};this.tohex=function(){var p=this.params;var l,r;if((typeof p=="string"&&p.indexOf("-----BEGIN")!=-1)||p.cert!=undefined){var n;if(p.cert!=undefined){n=p.cert}else{n=p}var k=new b();k.readCertPEM(n);l=k.getIssuer();r={hex:k.getSerialNumberHex()}}else{if(p.issuer!=undefined&&p.serial){l=p.issuer;r=p.serial}else{throw new i("cert or issuer and serial parameter not specified")}}var q=new a([{dn:l}]);var o=new g(r);var m=new f({array:[q,o]});return m.tohex()};this.getEncodedHex=function(){return this.tohex()};if(e!=undefined){this.setByParam(e)}};extendClass(KJUR.asn1.cms.IssuerSerial,KJUR.asn1.ASN1Object);KJUR.asn1.cms.SignerIdentifier=function(f){var c=KJUR,i=c.asn1,h=i.DERInteger,g=i.DERSequence,l=i.cms,k=l.IssuerAndSerialNumber,d=l.SubjectKeyIdentifier,e=i.x509,a=e.X500Name,b=X509,j=Error;l.SignerIdentifier.superclass.constructor.call(this);this.params=null;this.tohex=function(){var o=this.params;if(o.type=="isssn"){var m=new k(o);return m.tohex()}else{if(o.type=="skid"){var n=new d(o);return n.tohex()}else{throw new Error("wrong property for isssn or skid")}}};this.getEncodedHex=function(){return this.tohex()};if(f!=undefined){this.setByParam(f)}};extendClass(KJUR.asn1.cms.SignerIdentifier,KJUR.asn1.ASN1Object);KJUR.asn1.cms.IssuerAndSerialNumber=function(e){var c=KJUR,h=c.asn1,g=h.DERInteger,f=h.DERSequence,j=h.cms,d=h.x509,a=d.X500Name,b=X509,i=Error;j.IssuerAndSerialNumber.superclass.constructor.call(this);this.params=null;this.tohex=function(){var p=this.params;var l,r;if((typeof p=="string"&&p.indexOf("-----BEGIN")!=-1)||p.cert!=undefined){var n;if(p.cert!=undefined){n=p.cert}else{n=p}var k=new b();k.readCertPEM(n);l=k.getIssuer();r={hex:k.getSerialNumberHex()}}else{if(p.issuer!=undefined&&p.serial){l=p.issuer;r=p.serial}else{throw new i("cert or issuer and serial parameter not specified")}}var q=new a(l);var o=new g(r);var m=new f({array:[q,o]});return m.tohex()};this.getEncodedHex=function(){return this.tohex()};this.setByParam=function(k){this.params=k};if(e!=undefined){this.setByParam(e)}};extendClass(KJUR.asn1.cms.IssuerAndSerialNumber,KJUR.asn1.ASN1Object);KJUR.asn1.cms.SubjectKeyIdentifier=function(g){var d=KJUR,k=d.asn1,i=k.DERInteger,h=k.DERSequence,j=k.ASN1Util.newObject,m=k.cms,f=m.IssuerAndSerialName,c=m.SubjectKeyIdentifier,e=k.x509,a=e.X500Name,b=X509,l=Error;m.SubjectKeyIdentifier.superclass.constructor.call(this);this.tohex=function(){var r=this.params;if(r.cert==undefined&&r.skid==undefined){throw new l("property cert nor skid undefined")}var q;if(r.cert!=undefined){var n=new b(r.cert);var o=n.getExtSubjectKeyIdentifier();q=o.kid.hex}else{if(r.skid!=undefined){q=r.skid}}var p=j({tag:{tage:"a0",obj:{octstr:{hex:q}}}});return p.tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!=undefined){this.setByParam(g)}};extendClass(KJUR.asn1.cms.SubjectKeyIdentifier,KJUR.asn1.ASN1Object);KJUR.asn1.cms.AttributeList=function(f){var d=Error,c=KJUR,b=c.asn1,a=b.DERSet,e=b.cms;e.AttributeList.superclass.constructor.call(this);this.params=null;this.hTLV=null;this.setByParam=function(g){this.params=g};this.tohex=function(){var o=this.params;if(this.hTLV!=null){return this.hTLV}var m=true;if(o.sortflag!=undefined){m=o.sortflag}var j=o.array;var g=[];for(var l=0;l<j.length;l++){var n=j[l];var k=n.attr;if(k=="contentType"){g.push(new e.ContentType(n))}else{if(k=="messageDigest"){g.push(new e.MessageDigest(n))}else{if(k=="signingTime"){g.push(new e.SigningTime(n))}else{if(k=="signingCertificate"){g.push(new e.SigningCertificate(n))}else{if(k=="signingCertificateV2"){g.push(new e.SigningCertificateV2(n))}else{if(k=="signaturePolicyIdentifier"){g.push(new KJUR.asn1.cades.SignaturePolicyIdentifier(n))}else{if(k=="signatureTimeStamp"||k=="timeStampToken"){g.push(new KJUR.asn1.cades.SignatureTimeStamp(n))}else{throw new d("unknown attr: "+k)}}}}}}}}var h=new a({array:g,sortflag:m});this.hTLV=h.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(f!=undefined){this.setByParam(f)}};extendClass(KJUR.asn1.cms.AttributeList,KJUR.asn1.ASN1Object);KJUR.asn1.cms.SignerInfo=function(q){var n=Error,r=KJUR,i=r.asn1,c=i.DERInteger,f=i.DEROctetString,h=i.DERSequence,m=i.DERTaggedObject,k=i.cms,p=k.SignerIdentifier,l=k.AttributeList,g=k.ContentType,e=k.EncapsulatedContentInfo,d=k.MessageDigest,j=k.SignedData,a=i.x509,s=a.AlgorithmIdentifier,b=r.crypto,o=KEYUTIL;k.SignerInfo.superclass.constructor.call(this);this.params=null;this.sign=function(){var y=this.params;var x=y.sigalg;var u=(new l(y.sattrs)).tohex();var v=o.getKey(y.signkey);var w=new b.Signature({alg:x});w.init(v);w.updateHex(u);var t=w.sign();y.sighex=t};this.tohex=function(){var w=this.params;var t=[];t.push(new c({"int":w.version}));t.push(new p(w.id));t.push(new s({name:w.hashalg}));if(w.sattrs!=undefined){var x=new l(w.sattrs);try{t.push(new m({tag:"a0",explicit:false,obj:x}))}catch(v){throw new n("si sattr error: "+v)}}if(w.sigalgfield!=undefined){t.push(new s({name:w.sigalgfield}))}else{t.push(new s({name:w.sigalg}))}if(w.sighex==undefined&&w.signkey!=undefined){this.sign()}t.push(new f({hex:w.sighex}));if(w.uattrs!=undefined){var x=new l(w.uattrs);try{t.push(new m({tag:"a1",explicit:false,obj:x}))}catch(v){throw new n("si uattr error: "+v)}}var u=new h({array:t});return u.tohex()};this.getEncodedHex=function(){return this.tohex()};if(q!=undefined){this.setByParam(q)}};extendClass(KJUR.asn1.cms.SignerInfo,KJUR.asn1.ASN1Object);KJUR.asn1.cms.EncapsulatedContentInfo=function(g){var c=KJUR,b=c.asn1,e=b.DERTaggedObject,a=b.DERSequence,h=b.DERObjectIdentifier,d=b.DEROctetString,f=b.cms;f.EncapsulatedContentInfo.superclass.constructor.call(this);this.params=null;this.tohex=function(){var m=this.params;var i=[];i.push(new h(m.type));if(m.content!=undefined&&(m.content.hex!=undefined||m.content.str!=undefined)&&m.isDetached!=true){var k=new d(m.content);var l=new e({tag:"a0",explicit:true,obj:k});i.push(l)}var j=new a({array:i});return j.tohex()};this.getEncodedHex=function(){return this.tohex()};this.setByParam=function(i){this.params=i};if(g!=undefined){this.setByParam(g)}};extendClass(KJUR.asn1.cms.EncapsulatedContentInfo,KJUR.asn1.ASN1Object);KJUR.asn1.cms.ContentInfo=function(g){var c=KJUR,b=c.asn1,d=b.DERTaggedObject,a=b.DERSequence,h=b.DERObjectIdentifier,f=b.x509,e=f.OID.name2obj;KJUR.asn1.cms.ContentInfo.superclass.constructor.call(this);this.params=null;this.tohex=function(){var l=this.params;var i=[];i.push(new h(l.type));var k=new d({tag:"a0",explicit:true,obj:l.obj});i.push(k);var j=new a({array:i});return j.tohex()};this.getEncodedHex=function(){return this.tohex()};this.setByParam=function(i){this.params=i};if(g!=undefined){this.setByParam(g)}};extendClass(KJUR.asn1.cms.ContentInfo,KJUR.asn1.ASN1Object);KJUR.asn1.cms.SignedData=function(e){var j=Error,a=KJUR,h=a.asn1,m=h.ASN1Object,g=h.DERInteger,p=h.DERSet,f=h.DERSequence,b=h.DERTaggedObject,o=h.cms,l=o.EncapsulatedContentInfo,d=o.SignerInfo,q=o.ContentInfo,k=o.CertificateSet,i=o.RevocationInfoChoices,c=h.x509,n=c.AlgorithmIdentifier;KJUR.asn1.cms.SignedData.superclass.constructor.call(this);this.params=null;this.checkAndFixParam=function(){var r=this.params;this._setDigestAlgs(r);this._setContentTypeByEContent(r);this._setMessageDigestByEContent(r);this._setSignerInfoVersion(r);this._setSignedDataVersion(r)};this._setDigestAlgs=function(v){var u={};var t=v.sinfos;for(var r=0;r<t.length;r++){var s=t[r];u[s.hashalg]=1}v.hashalgs=Object.keys(u).sort()};this._setContentTypeByEContent=function(w){var u=w.econtent.type;var v=w.sinfos;for(var r=0;r<v.length;r++){var t=v[r];var s=this._getAttrParamByName(t,"contentType");s.type=u}};this._setMessageDigestByEContent=function(r){var v=r.econtent;var y=r.econtent.type;var x=v.content.hex;if(x==undefined&&v.type=="data"&&v.content.str!=undefined){x=rstrtohex(v.content.str)}var A=r.sinfos;for(var u=0;u<A.length;u++){var t=A[u];var s=t.hashalg;var z=this._getAttrParamByName(t,"messageDigest");var w=KJUR.crypto.Util.hashHex(x,s);z.hex=w}};this._getAttrParamByName=function(t,s){var u=t.sattrs.array;for(var r=0;r<u.length;r++){if(u[r].attr==s){return u[r]}}};this._setSignerInfoVersion=function(v){var t=v.sinfos;for(var r=0;r<t.length;r++){var s=t[r];var u=1;if(s.id.type=="skid"){u=3}s.version=u}};this._setSignedDataVersion=function(s){var r=this._getSignedDataVersion(s);s.version=r};this._getSignedDataVersion=function(w){if(w.revinfos!=undefined){var r=w.revinfos;for(var t=0;t<r.length;t++){var s=r[t];if(s.ocsp!=undefined){return 5}}}var v=w.sinfos;for(var t=0;t<v.length;t++){var u=w.sinfos[t];if(u.version==3){return 3}}if(w.econtent.type!="data"){return 3}return 1};this.tohex=function(){var y=this.params;if(this.getEncodedHexPrepare!=undefined){this.getEncodedHexPrepare()}if(y.fixed!=true){this.checkAndFixParam()}var r=[];r.push(new g({"int":y.version}));var w=[];for(var v=0;v<y.hashalgs.length;v++){var t=y.hashalgs[v];w.push(new n({name:t}))}r.push(new p({array:w}));r.push(new l(y.econtent));if(y.certs!=undefined){r.push(new k(y.certs))}if(y.revinfos!=undefined){r.push(new i(y.revinfos))}var u=[];for(var v=0;v<y.sinfos.length;v++){var x=y.sinfos[v];u.push(new d(x))}r.push(new p({array:u}));var s=new f({array:r});return s.tohex()};this.getEncodedHex=function(){return this.tohex()};this.getContentInfo=function(){var r=new q({type:"signed-data",obj:this});return r};this.getContentInfoEncodedHex=function(){return this.getContentInfo().tohex()};if(e!=undefined){this.setByParam(e)}};extendClass(KJUR.asn1.cms.SignedData,KJUR.asn1.ASN1Object);KJUR.asn1.cms.CertificateSet=function(f){KJUR.asn1.cms.CertificateSet.superclass.constructor.call(this);var c=Error,b=KJUR.asn1,e=b.DERTaggedObject,a=b.DERSet,d=b.ASN1Object;this.params=null;this.tohex=function(){var j=this.params;var p=[];var q;if(j instanceof Array){q=j}else{if(j.array!=undefined){q=j.array}else{throw new c("cert array not specified")}}for(var k=0;k<q.length;k++){var l=q[k];var n=pemtohex(l);var g=new d();g.hTLV=n;p.push(g)}var m={array:p};if(j.sortflag==false){m.sortflag=false}var o=new a(m);var h=new e({tag:"a0",explicit:false,obj:o});return h.tohex()};this.getEncodedHex=function(){return this.tohex()};if(f!=undefined){this.setByParam(f)}};extendClass(KJUR.asn1.cms.CertificateSet,KJUR.asn1.ASN1Object);KJUR.asn1.cms.RevocationInfoChoices=function(a){KJUR.asn1.cms.RevocationInfoChoices.superclass.constructor.call(this);this.params=null;this.tohex=function(){var e=this.params;if(!e instanceof Array){throw new Error("params is not array")}var b=[];for(var c=0;c<e.length;c++){b.push(new KJUR.asn1.cms.RevocationInfoChoice(e[c]))}var d=KJUR.asn1.ASN1Util.newObject({tag:{tagi:"a1",obj:{set:b}}});return d.tohex()};this.getEncodedHex=function(){return this.tohex()};if(a!=undefined){this.setByParam(a)}};extendClass(KJUR.asn1.cms.RevocationInfoChoices,KJUR.asn1.ASN1Object);KJUR.asn1.cms.RevocationInfoChoice=function(a){KJUR.asn1.cms.RevocationInfoChoice.superclass.constructor.call(this);this.params=null;this.tohex=function(){var d=this.params;if(d.crl!=undefined&&typeof d.crl=="string"){var b=d.crl;if(d.crl.indexOf("-----BEGIN")!=-1){b=pemtohex(d.crl)}return b}else{if(d.ocsp!=undefined){var c=KJUR.asn1.ASN1Util.newObject({tag:{tagi:"a1",obj:new KJUR.asn1.cms.OtherRevocationFormat(d)}});return c.tohex()}else{throw new Error("property crl or ocsp undefined")}}};this.getEncodedHex=function(){return this.tohex()};if(a!=undefined){this.setByParam(a)}};extendClass(KJUR.asn1.cms.RevocationInfoChoice,KJUR.asn1.ASN1Object);KJUR.asn1.cms.OtherRevocationFormat=function(f){KJUR.asn1.cms.OtherRevocationFormat.superclass.constructor.call(this);var d=Error,c=KJUR,b=c.asn1,a=b.ASN1Util.newObject,e=c.lang.String.isHex;this.params=null;this.tohex=function(){var h=this.params;if(h.ocsp==undefined){throw new d("property ocsp not specified")}if(!e(h.ocsp)||!ASN1HEX.isASN1HEX(h.ocsp)){throw new d("ocsp value not ASN.1 hex string")}var g=a({seq:[{oid:"1.3.6.1.5.5.7.16.2"},{asn1:{tlv:h.ocsp}}]});return g.tohex()};this.getEncodedHex=function(){return this.tohex()};if(f!=undefined){this.setByParam(f)}};extendClass(KJUR.asn1.cms.OtherRevocationFormat,KJUR.asn1.ASN1Object);KJUR.asn1.cms.CMSUtil=new function(){};KJUR.asn1.cms.CMSUtil.newSignedData=function(a){return new KJUR.asn1.cms.SignedData(a)};KJUR.asn1.cms.CMSUtil.verifySignedData=function(n){var C=KJUR,p=C.asn1,s=p.cms,D=s.SignerInfo,q=s.SignedData,y=s.SigningTime,b=s.SigningCertificate,d=s.SigningCertificateV2,A=p.cades,u=A.SignaturePolicyIdentifier,i=C.lang.String.isHex,v=ASN1HEX,h=v.getVbyList,a=v.getTLVbyList,t=v.getIdxbyList,z=v.getChildIdx,c=v.getTLV,B=v.oidname,j=C.crypto.Util.hashHex;if(n.cms===undefined&&!i(n.cms)){}var E=n.cms;var g=function(J,H){var G;for(var I=3;I<6;I++){G=t(J,0,[1,0,I]);if(G!==undefined){var F=J.substr(G,2);if(F==="a0"){H.certsIdx=G}if(F==="a1"){H.revinfosIdx=G}if(F==="31"){H.signerinfosIdx=G}}}};var l=function(I,F){var H=F.signerinfosIdx;if(H===undefined){return}var L=z(I,H);F.signerInfoIdxList=L;for(var G=0;G<L.length;G++){var K=L[G];var J={idx:K};k(I,J);F.signerInfos.push(J)}};var k=function(I,J){var F=J.idx;J.signerid_issuer1=a(I,F,[1,0],"30");J.signerid_serial1=h(I,F,[1,1],"02");J.hashalg=B(h(I,F,[2,0],"06"));var H=t(I,F,[3],"a0");J.idxSignedAttrs=H;f(I,J,H);var G=z(I,F);var K=G.length;if(K<6){throw"malformed SignerInfo"}J.sigalg=B(h(I,F,[K-2,0],"06"));J.sigval=h(I,F,[K-1],"04")};var f=function(L,M,F){var J=z(L,F);M.signedAttrIdxList=J;for(var K=0;K<J.length;K++){var I=J[K];var G=h(L,I,[0],"06");var H;if(G==="2a864886f70d010905"){H=hextoutf8(h(L,I,[1,0]));M.saSigningTime=H}else{if(G==="2a864886f70d010904"){H=h(L,I,[1,0],"04");M.saMessageDigest=H}}}};var w=function(G,F){if(h(G,0,[0],"06")!=="2a864886f70d010702"){return F}F.cmsType="signedData";F.econtent=h(G,0,[1,0,2,1,0]);g(G,F);F.signerInfos=[];l(G,F)};var o=function(J,F){var G=F.parse.signerInfos;var L=G.length;var K=true;for(var I=0;I<L;I++){var H=G[I];e(J,F,H,I);if(!H.isValid){K=false}}F.isValid=K};var x=function(F,Q,J,P){var N=Q.parse.certsIdx;var H;if(Q.certs===undefined){H=[];Q.certkeys=[];var K=z(F,N);for(var I=0;I<K.length;I++){var M=c(F,K[I]);var O=new X509();O.readCertHex(M);H[I]=O;Q.certkeys[I]=O.getPublicKey()}Q.certs=H}else{H=Q.certs}Q.cccc=H.length;Q.cccci=K.length;for(var I=0;I<H.length;I++){var L=O.getIssuerHex();var G=O.getSerialNumberHex();if(J.signerid_issuer1===L&&J.signerid_serial1===G){J.certkey_idx=I}}};var e=function(F,R,I,N){I.verifyDetail={};var Q=I.verifyDetail;var K=R.parse.econtent;var G=I.hashalg;var L=I.saMessageDigest;Q.validMessageDigest=false;if(j(K,G)===L){Q.validMessageDigest=true}x(F,R,I,N);Q.validSignatureValue=false;var H=I.sigalg;var M="31"+c(F,I.idxSignedAttrs).substr(2);I.signedattrshex=M;var J=R.certs[I.certkey_idx].getPublicKey();var P=new KJUR.crypto.Signature({alg:H});P.init(J);P.updateHex(M);var O=P.verify(I.sigval);Q.validSignatureValue_isValid=O;if(O===true){Q.validSignatureValue=true}I.isValid=false;if(Q.validMessageDigest&&Q.validSignatureValue){I.isValid=true}};var m=function(){};var r={isValid:false,parse:{}};w(E,r.parse);o(E,r);return r};KJUR.asn1.cms.CMSParser=function(){var g=Error,a=X509,h=new a(),l=ASN1HEX,i=l.getV,b=l.getTLV,f=l.getIdxbyList,c=l.getTLVbyList,d=l.getTLVbyListEx,e=l.getVbyList,k=l.getVbyListEx,j=l.getChildIdx;this.getCMSSignedData=function(m){var o=c(m,0,[1,0]);var n=this.getSignedData(o);return n};this.getSignedData=function(o){var q=j(o,0);var v={};var p=i(o,q[0]);var n=parseInt(p,16);v.version=n;var r=b(o,q[1]);v.hashalgs=this.getHashAlgArray(r);var t=b(o,q[2]);v.econtent=this.getEContent(t);var m=d(o,0,["[0]"]);if(m!=null){v.certs=this.getCertificateSet(m)}var u=d(o,0,["[1]"]);if(u!=null){}var s=d(o,0,[3]);v.sinfos=this.getSignerInfos(s);return v};this.getHashAlgArray=function(s){var q=j(s,0);var m=new a();var n=[];for(var r=0;r<q.length;r++){var p=b(s,q[r]);var o=m.getAlgorithmIdentifierName(p);n.push(o)}return n};this.getEContent=function(m){var n={};var p=e(m,0,[0]);var o=e(m,0,[1,0]);n.type=KJUR.asn1.x509.OID.oid2name(ASN1HEX.hextooidstr(p));n.content={hex:o};return n};this.getSignerInfos=function(p){var r=[];var m=j(p,0);for(var n=0;n<m.length;n++){var o=b(p,m[n]);var q=this.getSignerInfo(o);r.push(q)}return r};this.getSignerInfo=function(s){var y={};var u=j(s,0);var q=l.getInt(s,u[0],-1);if(q!=-1){y.version=q}var t=b(s,u[1]);var p=this.getIssuerAndSerialNumber(t);y.id=p;var z=b(s,u[2]);var n=h.getAlgorithmIdentifierName(z);y.hashalg=n;var w=d(s,0,["[0]"]);if(w!=null){var A=this.getAttributeList(w);y.sattrs=A}var m=d(s,0,[3]);var x=h.getAlgorithmIdentifierName(m);y.sigalg=x;var o=k(s,0,[4]);y.sighex=o;var r=d(s,0,["[1]"]);if(r!=null){var v=this.getAttributeList(r);y.uattrs=v}return y};this.getSignerIdentifier=function(m){if(m.substr(0,2)=="30"){return this.getIssuerAndSerialNumber(m)}else{throw new Error("SKID of signerIdentifier not supported")}};this.getIssuerAndSerialNumber=function(n){var o={type:"isssn"};var m=j(n,0);var p=b(n,m[0]);o.issuer=h.getX500Name(p);var q=i(n,m[1]);o.serial={hex:q};return o};this.getAttributeList=function(q){var m=[];var n=j(q,0);for(var o=0;o<n.length;o++){var p=b(q,n[o]);var r=this.getAttribute(p);m.push(r)}return{array:m}};this.getAttribute=function(p){var t={};var q=j(p,0);var o=l.getOID(p,q[0]);var m=KJUR.asn1.x509.OID.oid2name(o);t.attr=m;var r=b(p,q[1]);var u=j(r,0);if(u.length==1){t.valhex=b(r,u[0])}else{var s=[];for(var n=0;n<u.length;n++){s.push(b(r,u[n]))}t.valhex=s}if(m=="contentType"){this.setContentType(t)}else{if(m=="messageDigest"){this.setMessageDigest(t)}else{if(m=="signingTime"){this.setSigningTime(t)}else{if(m=="signingCertificate"){this.setSigningCertificate(t)}else{if(m=="signingCertificateV2"){this.setSigningCertificateV2(t)}else{if(m=="signaturePolicyIdentifier"){this.setSignaturePolicyIdentifier(t)}}}}}}return t};this.setContentType=function(m){var n=l.getOIDName(m.valhex,0,null);if(n!=null){m.type=n;delete m.valhex}};this.setSigningTime=function(o){var n=i(o.valhex,0);var m=hextoutf8(n);o.str=m;delete o.valhex};this.setMessageDigest=function(m){var n=i(m.valhex,0);m.hex=n;delete m.valhex};this.setSigningCertificate=function(n){var q=j(n.valhex,0);if(q.length>0){var m=b(n.valhex,q[0]);var p=j(m,0);var t=[];for(var o=0;o<p.length;o++){var s=b(m,p[o]);var u=this.getESSCertID(s);t.push(u)}n.array=t}if(q.length>1){var r=b(n.valhex,q[1]);n.polhex=r}delete n.valhex};this.setSignaturePolicyIdentifier=function(s){var q=j(s.valhex,0);if(q.length>0){var r=l.getOID(s.valhex,q[0]);s.oid=r}if(q.length>1){var m=new a();var t=j(s.valhex,q[1]);var p=b(s.valhex,t[0]);var o=m.getAlgorithmIdentifierName(p);s.alg=o;var n=i(s.valhex,t[1]);s.hash=n}delete s.valhex};this.setSigningCertificateV2=function(o){var s=j(o.valhex,0);if(s.length>0){var n=b(o.valhex,s[0]);var r=j(n,0);var u=[];for(var q=0;q<r.length;q++){var m=b(n,r[q]);var p=this.getESSCertIDv2(m);u.push(p)}o.array=u}if(s.length>1){var t=b(o.valhex,s[1]);o.polhex=t}delete o.valhex};this.getESSCertID=function(o){var p={};var n=j(o,0);if(n.length>0){var q=i(o,n[0]);p.hash=q}if(n.length>1){var m=b(o,n[1]);var r=this.getIssuerSerial(m);if(r.serial!=undefined){p.serial=r.serial}if(r.issuer!=undefined){p.issuer=r.issuer}}return p};this.getESSCertIDv2=function(q){var s={};var p=j(q,0);if(p.length<1||3<p.length){throw new g("wrong number of elements")}var r=0;if(q.substr(p[0],2)=="30"){var o=b(q,p[0]);s.alg=h.getAlgorithmIdentifierName(o);r++}else{s.alg="sha256"}var n=i(q,p[r]);s.hash=n;if(p.length>r+1){var m=b(q,p[r+1]);var t=this.getIssuerSerial(m);s.issuer=t.issuer;s.serial=t.serial}return s};this.getIssuerSerial=function(q){var r={};var n=j(q,0);var m=b(q,n[0]);var p=h.getGeneralNames(m);var o=p[0].dn;r.issuer=o;var s=i(q,n[1]);r.serial={hex:s};return r};this.getCertificateSet=function(p){var n=j(p,0);var m=[];for(var o=0;o<n.length;o++){var r=b(p,n[o]);if(r.substr(0,2)=="30"){var q=hextopem(r,"CERTIFICATE");m.push(q)}}return{array:m,sortflag:false}}};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.tsp=="undefined"||!KJUR.asn1.tsp){KJUR.asn1.tsp={}}KJUR.asn1.tsp.TimeStampToken=function(d){var c=KJUR,b=c.asn1,a=b.tsp;a.TimeStampToken.superclass.constructor.call(this);this.params=null;this.getEncodedHexPrepare=function(){var e=new a.TSTInfo(this.params.econtent.content);this.params.econtent.content.hex=e.tohex()};if(d!=undefined){this.setByParam(d)}};extendClass(KJUR.asn1.tsp.TimeStampToken,KJUR.asn1.cms.SignedData);KJUR.asn1.tsp.TSTInfo=function(f){var m=Error,c=KJUR,j=c.asn1,g=j.DERSequence,i=j.DERInteger,l=j.DERBoolean,h=j.DERGeneralizedTime,n=j.DERObjectIdentifier,e=j.DERTaggedObject,k=j.tsp,d=k.MessageImprint,b=k.Accuracy,a=j.x509.X500Name,o=j.x509.GeneralName;k.TSTInfo.superclass.constructor.call(this);this.dVersion=new i({"int":1});this.dPolicy=null;this.dMessageImprint=null;this.dSerial=null;this.dGenTime=null;this.dAccuracy=null;this.dOrdering=null;this.dNonce=null;this.dTsa=null;this.tohex=function(){var p=[this.dVersion];if(this.dPolicy==null){throw new Error("policy shall be specified.")}p.push(this.dPolicy);if(this.dMessageImprint==null){throw new Error("messageImprint shall be specified.")}p.push(this.dMessageImprint);if(this.dSerial==null){throw new Error("serialNumber shall be specified.")}p.push(this.dSerial);if(this.dGenTime==null){throw new Error("genTime shall be specified.")}p.push(this.dGenTime);if(this.dAccuracy!=null){p.push(this.dAccuracy)}if(this.dOrdering!=null){p.push(this.dOrdering)}if(this.dNonce!=null){p.push(this.dNonce)}if(this.dTsa!=null){p.push(this.dTsa)}var q=new g({array:p});this.hTLV=q.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(f!==undefined){if(typeof f.policy=="string"){if(!f.policy.match(/^[0-9.]+$/)){throw"policy shall be oid like 0.1.4.134"}this.dPolicy=new n({oid:f.policy})}if(f.messageImprint!==undefined){this.dMessageImprint=new d(f.messageImprint)}if(f.serial!==undefined){this.dSerial=new i(f.serial)}if(f.genTime!==undefined){this.dGenTime=new h(f.genTime)}if(f.accuracy!==undefined){this.dAccuracy=new b(f.accuracy)}if(f.ordering!==undefined&&f.ordering==true){this.dOrdering=new l()}if(f.nonce!==undefined){this.dNonce=new i(f.nonce)}if(f.tsa!==undefined){this.dTsa=new e({tag:"a0",explicit:true,obj:new o({dn:f.tsa})})}}};extendClass(KJUR.asn1.tsp.TSTInfo,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.Accuracy=function(d){var c=KJUR,b=c.asn1,a=b.ASN1Util.newObject;b.tsp.Accuracy.superclass.constructor.call(this);this.params=null;this.tohex=function(){var f=this.params;var e=[];if(f.seconds!=undefined&&typeof f.seconds=="number"){e.push({"int":f.seconds})}if(f.millis!=undefined&&typeof f.millis=="number"){e.push({tag:{tagi:"80",obj:{"int":f.millis}}})}if(f.micros!=undefined&&typeof f.micros=="number"){e.push({tag:{tagi:"81",obj:{"int":f.micros}}})}return a({seq:e}).tohex()};this.getEncodedHex=function(){return this.tohex()};if(d!=undefined){this.setByParam(d)}};extendClass(KJUR.asn1.tsp.Accuracy,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.MessageImprint=function(g){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.DEROctetString,f=b.x509,e=f.AlgorithmIdentifier;b.tsp.MessageImprint.superclass.constructor.call(this);this.params=null;this.tohex=function(){var k=this.params;var j=new e({name:k.alg});var h=new d({hex:k.hash});var i=new a({array:[j,h]});return i.tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!==undefined){this.setByParam(g)}};extendClass(KJUR.asn1.tsp.MessageImprint,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.TimeStampReq=function(c){var a=KJUR,f=a.asn1,d=f.DERSequence,e=f.DERInteger,h=f.DERBoolean,j=f.ASN1Object,i=f.DERObjectIdentifier,g=f.tsp,b=g.MessageImprint;g.TimeStampReq.superclass.constructor.call(this);this.params=null;this.tohex=function(){var m=this.params;var k=[];k.push(new e({"int":1}));if(m.messageImprint instanceof KJUR.asn1.ASN1Object){k.push(m.messageImprint)}else{k.push(new b(m.messageImprint))}if(m.policy!=undefined){k.push(new i(m.policy))}if(m.nonce!=undefined){k.push(new e(m.nonce))}if(m.certreq==true){k.push(new h())}var l=new d({array:k});return l.tohex()};this.getEncodedHex=function(){return this.tohex()};if(c!=undefined){this.setByParam(c)}};extendClass(KJUR.asn1.tsp.TimeStampReq,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.TimeStampResp=function(g){var e=KJUR,d=e.asn1,c=d.DERSequence,f=d.ASN1Object,a=d.tsp,b=a.PKIStatusInfo;a.TimeStampResp.superclass.constructor.call(this);this.params=null;this.tohex=function(){var j=this.params;var h=[];if(j.econtent!=undefined||j.tst!=undefined){if(j.statusinfo!=undefined){h.push(new b(j.statusinfo))}else{h.push(new b("granted"))}if(j.econtent!=undefined){h.push((new a.TimeStampToken(j)).getContentInfo())}else{if(j.tst instanceof d.ASN1Object){h.push(j.tst)}else{throw new Error("improper member tst value")}}}else{if(j.statusinfo!=undefined){h.push(new b(j.statusinfo))}else{throw new Error("parameter for token nor statusinfo not specified")}}var i=new c({array:h});return i.tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!=undefined){this.setByParam(g)}};extendClass(KJUR.asn1.tsp.TimeStampResp,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIStatusInfo=function(d){var h=Error,a=KJUR,g=a.asn1,e=g.DERSequence,i=g.tsp,f=i.PKIStatus,c=i.PKIFreeText,b=i.PKIFailureInfo;i.PKIStatusInfo.superclass.constructor.call(this);this.params=null;this.tohex=function(){var l=this.params;var j=[];if(typeof l=="string"){j.push(new f(l))}else{if(l.status==undefined){throw new h("property 'status' unspecified")}j.push(new f(l.status));if(l.statusstr!=undefined){j.push(new c(l.statusstr))}if(l.failinfo!=undefined){j.push(new b(l.failinfo))}}var k=new e({array:j});return k.tohex()};this.getEncodedHex=function(){return this.tohex()};if(d!=undefined){this.setByParam(d)}};extendClass(KJUR.asn1.tsp.PKIStatusInfo,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIStatus=function(g){var e=Error,d=KJUR,c=d.asn1,f=c.DERInteger,b=c.tsp;b.PKIStatus.superclass.constructor.call(this);var a={granted:0,grantedWithMods:1,rejection:2,waiting:3,revocationWarning:4,revocationNotification:5};this.params=null;this.tohex=function(){var k=this.params;var h,j;if(typeof k=="string"){try{j=a[k]}catch(i){throw new e("undefined name: "+k)}}else{if(typeof k=="number"){j=k}else{throw new e("unsupported params")}}return(new f({"int":j})).tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!=undefined){this.setByParam(g)}};extendClass(KJUR.asn1.tsp.PKIStatus,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIFreeText=function(g){var f=Error,e=KJUR,d=e.asn1,b=d.DERSequence,c=d.DERUTF8String,a=d.tsp;a.PKIFreeText.superclass.constructor.call(this);this.params=null;this.tohex=function(){var l=this.params;if(!l instanceof Array){throw new f("wrong params: not array")}var h=[];for(var k=0;k<l.length;k++){h.push(new c({str:l[k]}))}var j=new b({array:h});return j.tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!=undefined){this.setByParam(g)}};extendClass(KJUR.asn1.tsp.PKIFreeText,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.PKIFailureInfo=function(h){var f=Error,e=KJUR,d=e.asn1,g=d.DERBitString,b=d.tsp,c=b.PKIFailureInfo;var a={badAlg:0,badRequest:2,badDataFormat:5,timeNotAvailable:14,unacceptedPolicy:15,unacceptedExtension:16,addInfoNotAvailable:17,systemFailure:25};c.superclass.constructor.call(this);this.params=null;this.getBinValue=function(){var n=this.params;var m=0;if(typeof n=="number"&&0<=n&&n<=25){m|=1<<n;var k=m.toString(2);var l="";for(var j=k.length-1;j>=0;j--){l+=k[j]}return l}else{if(typeof n=="string"&&a[n]!=undefined){return namearraytobinstr([n],a)}else{if(typeof n=="object"&&n.length!=undefined){return namearraytobinstr(n,a)}else{throw new f("wrong params")}}}return};this.tohex=function(){var j=this.params;var i=this.getBinValue();return(new g({bin:i})).tohex()};this.getEncodedHex=function(){return this.tohex()};if(h!=undefined){this.setByParam(h)}};extendClass(KJUR.asn1.tsp.PKIFailureInfo,KJUR.asn1.ASN1Object);KJUR.asn1.tsp.AbstractTSAAdapter=function(a){this.getTSTHex=function(c,b){throw"not implemented yet"}};KJUR.asn1.tsp.SimpleTSAAdapter=function(e){var d=KJUR,c=d.asn1,a=c.tsp,b=d.crypto.Util.hashHex;a.SimpleTSAAdapter.superclass.constructor.call(this);this.params=null;this.serial=0;this.getTSTHex=function(g,f){var i=b(g,f);this.params.econtent.content.messageImprint={alg:f,hash:i};this.params.econtent.content.serial={"int":this.serial++};var h=Math.floor(Math.random()*1000000000);this.params.econtent.content.nonce={"int":h};var j=new a.TimeStampToken(this.params);return j.getContentInfoEncodedHex()};if(e!==undefined){this.params=e}};extendClass(KJUR.asn1.tsp.SimpleTSAAdapter,KJUR.asn1.tsp.AbstractTSAAdapter);KJUR.asn1.tsp.FixedTSAAdapter=function(e){var d=KJUR,c=d.asn1,a=c.tsp,b=d.crypto.Util.hashHex;a.FixedTSAAdapter.superclass.constructor.call(this);this.params=null;this.getTSTHex=function(g,f){var h=b(g,f);this.params.econtent.content.messageImprint={alg:f,hash:h};var i=new a.TimeStampToken(this.params);return i.getContentInfoEncodedHex()};if(e!==undefined){this.params=e}};extendClass(KJUR.asn1.tsp.FixedTSAAdapter,KJUR.asn1.tsp.AbstractTSAAdapter);KJUR.asn1.tsp.TSPUtil=new function(){};KJUR.asn1.tsp.TSPUtil.newTimeStampToken=function(a){return new KJUR.asn1.tsp.TimeStampToken(a)};KJUR.asn1.tsp.TSPUtil.parseTimeStampReq=function(a){var b=new KJUR.asn1.tsp.TSPParser();return b.getTimeStampReq(a)};KJUR.asn1.tsp.TSPUtil.parseMessageImprint=function(a){var b=new KJUR.asn1.tsp.TSPParser();return b.getMessageImprint(a)};KJUR.asn1.tsp.TSPParser=function(){var e=Error,a=X509,f=new a(),k=ASN1HEX,g=k.getV,b=k.getTLV,d=k.getIdxbyList,c=k.getTLVbyListEx,i=k.getChildIdx;var j=["granted","grantedWithMods","rejection","waiting","revocationWarning","revocationNotification"];var h={0:"badAlg",2:"badRequest",5:"badDataFormat",14:"timeNotAvailable",15:"unacceptedPolicy",16:"unacceptedExtension",17:"addInfoNotAvailable",25:"systemFailure"};this.getResponse=function(n){var l=i(n,0);if(l.length==1){return this.getPKIStatusInfo(b(n,l[0]))}else{if(l.length>1){var o=this.getPKIStatusInfo(b(n,l[0]));var m=b(n,l[1]);var p=this.getToken(m);p.statusinfo=o;return p}}};this.getToken=function(m){var l=new KJUR.asn1.cms.CMSParser;var n=l.getCMSSignedData(m);this.setTSTInfo(n);return n};this.setTSTInfo=function(l){var o=l.econtent;if(o.type=="tstinfo"){var n=o.content.hex;var m=this.getTSTInfo(n);o.content=m}};this.getTSTInfo=function(r){var x={};var s=i(r,0);var p=g(r,s[1]);x.policy=hextooid(p);var o=b(r,s[2]);x.messageImprint=this.getMessageImprint(o);var u=g(r,s[3]);x.serial={hex:u};var y=g(r,s[4]);x.genTime={str:hextoutf8(y)};var q=0;if(s.length>5&&r.substr(s[5],2)=="30"){var v=b(r,s[5]);x.accuracy=this.getAccuracy(v);q++}if(s.length>5+q&&r.substr(s[5+q],2)=="01"){var z=g(r,s[5+q]);if(z=="ff"){x.ordering=true}q++}if(s.length>5+q&&r.substr(s[5+q],2)=="02"){var n=g(r,s[5+q]);x.nonce={hex:n};q++}if(s.length>5+q&&r.substr(s[5+q],2)=="a0"){var m=b(r,s[5+q]);m="30"+m.substr(2);pGeneralNames=f.getGeneralNames(m);var t=pGeneralNames[0].dn;x.tsa=t;q++}if(s.length>5+q&&r.substr(s[5+q],2)=="a1"){var l=b(r,s[5+q]);l="30"+l.substr(2);var w=f.getExtParamArray(l);x.ext=w;q++}return x};this.getAccuracy=function(q){var r={};var o=i(q,0);for(var p=0;p<o.length;p++){var m=q.substr(o[p],2);var l=g(q,o[p]);var n=parseInt(l,16);if(m=="02"){r.seconds=n}else{if(m=="80"){r.millis=n}else{if(m=="81"){r.micros=n}}}}return r};this.getMessageImprint=function(n){if(n.substr(0,2)!="30"){throw new Error("head of messageImprint hex shall be x30")}var s={};var l=i(n,0);var t=d(n,0,[0,0]);var o=g(n,t);var p=k.hextooidstr(o);var r=KJUR.asn1.x509.OID.oid2name(p);if(r==""){throw new Error("hashAlg name undefined: "+p)}var m=r;var q=d(n,0,[1]);s.alg=m;s.hash=g(n,q);return s};this.getPKIStatusInfo=function(o){var t={};var r=i(o,0);var n=0;try{var l=g(o,r[0]);var p=parseInt(l,16);t.status=j[p]}catch(s){}if(r.length>1&&o.substr(r[1],2)=="30"){var m=b(o,r[1]);t.statusstr=this.getPKIFreeText(m);n++}if(r.length>n&&o.substr(r[1+n],2)=="03"){var q=b(o,r[1+n]);t.failinfo=this.getPKIFailureInfo(q)}return t};this.getPKIFreeText=function(n){var o=[];var l=i(n,0);for(var m=0;m<l.length;m++){o.push(k.getString(n,l[m]))}return o};this.getPKIFailureInfo=function(l){var m=k.getInt(l,0);if(h[m]!=undefined){return h[m]}else{return m}};this.getTimeStampReq=function(q){var p={};p.certreq=false;var s=i(q,0);if(s.length<2){throw new Error("TimeStampReq must have at least 2 items")}var n=b(q,s[1]);p.messageImprint=KJUR.asn1.tsp.TSPUtil.parseMessageImprint(n);for(var o=2;o<s.length;o++){var m=s[o];var l=q.substr(m,2);if(l=="06"){var r=g(q,m);p.policy=k.hextooidstr(r)}if(l=="02"){p.nonce=g(q,m)}if(l=="01"){p.certreq=true}}return p}};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.cades=="undefined"||!KJUR.asn1.cades){KJUR.asn1.cades={}}KJUR.asn1.cades.SignaturePolicyIdentifier=function(e){var c=KJUR,b=c.asn1,a=b.cades,d=a.SignaturePolicyId;a.SignaturePolicyIdentifier.superclass.constructor.call(this);this.typeOid="1.2.840.113549.1.9.16.2.15";this.params=null;this.getValueArray=function(){return[new d(this.params)]};this.setByParam=function(f){this.params=f};if(e!=undefined){this.setByParam(e)}};extendClass(KJUR.asn1.cades.SignaturePolicyIdentifier,KJUR.asn1.cms.Attribute);KJUR.asn1.cades.SignaturePolicyId=function(e){var a=KJUR,g=a.asn1,f=g.DERSequence,i=g.DERObjectIdentifier,d=g.x509,j=d.AlgorithmIdentifier,c=g.cades,h=c.SignaturePolicyId,b=c.OtherHashAlgAndValue;h.superclass.constructor.call(this);this.params=null;this.tohex=function(){var m=this.params;var k=[];k.push(new i(m.oid));k.push(new b(m));var l=new f({array:k});return l.tohex()};this.getEncodedHex=function(){return this.tohex()};this.setByParam=function(k){this.params=k};if(e!=undefined){this.setByParam(e)}};extendClass(KJUR.asn1.cades.SignaturePolicyId,KJUR.asn1.ASN1Object);KJUR.asn1.cades.OtherHashAlgAndValue=function(e){var h=Error,a=KJUR,g=a.asn1,f=g.DERSequence,i=g.DEROctetString,d=g.x509,j=d.AlgorithmIdentifier,c=g.cades,b=c.OtherHashAlgAndValue;b.superclass.constructor.call(this);this.params=null;this.tohex=function(){var o=this.params;if(o.alg==undefined){throw new h("property 'alg' not specified")}if(o.hash==undefined&&o.cert==undefined){throw new h("property 'hash' nor 'cert' not specified")}var m=null;if(o.hash!=undefined){m=o.hash}else{if(o.cert!=undefined){if(typeof o.cert!="string"){throw new h("cert not string")}var n=o.cert;if(o.cert.indexOf("-----BEGIN")!=-1){n=pemtohex(o.cert)}m=KJUR.crypto.Util.hashHex(n,o.alg)}}var k=[];k.push(new j({name:o.alg}));k.push(new i({hex:m}));var l=new f({array:k});return l.tohex()};this.getEncodedHex=function(){return this.tohex()};if(e!=undefined){this.setByParam(e)}};extendClass(KJUR.asn1.cades.OtherHashAlgAndValue,KJUR.asn1.ASN1Object);KJUR.asn1.cades.OtherHashValue=function(g){KJUR.asn1.cades.OtherHashValue.superclass.constructor.call(this);var d=Error,c=KJUR,f=c.lang.String.isHex,b=c.asn1,e=b.DEROctetString,a=c.crypto.Util.hashHex;this.params=null;this.tohex=function(){var j=this.params;if(j.hash==undefined&&j.cert==undefined){throw new d("hash or cert not specified")}var h=null;if(j.hash!=undefined){h=j.hash}else{if(j.cert!=undefined){if(typeof j.cert!="string"){throw new d("cert not string")}var i=j.cert;if(j.cert.indexOf("-----BEGIN")!=-1){i=pemtohex(j.cert)}h=KJUR.crypto.Util.hashHex(i,"sha1")}}return(new e({hex:h})).tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!=undefined){this.setByParam(g)}};extendClass(KJUR.asn1.cades.OtherHashValue,KJUR.asn1.ASN1Object);KJUR.asn1.cades.SignatureTimeStamp=function(h){var d=Error,c=KJUR,f=c.lang.String.isHex,b=c.asn1,e=b.ASN1Object,g=b.x509,a=b.cades;a.SignatureTimeStamp.superclass.constructor.call(this);this.typeOid="1.2.840.113549.1.9.16.2.14";this.params=null;this.getValueArray=function(){var l=this.params;if(l.tst!=undefined){if(f(l.tst)){var j=new e();j.hTLV=l.tst;return[j]}else{if(l.tst instanceof e){return[l.tst]}else{throw new d("params.tst has wrong value")}}}else{if(l.res!=undefined){var k=l.res;if(k instanceof e){k=k.tohex()}if(typeof k!="string"||(!f(k))){throw new d("params.res has wrong value")}var i=ASN1HEX.getTLVbyList(k,0,[1]);var j=new e();j.hTLV=l.tst;return[j]}}};if(h!=null){this.setByParam(h)}};extendClass(KJUR.asn1.cades.SignatureTimeStamp,KJUR.asn1.cms.Attribute);KJUR.asn1.cades.CompleteCertificateRefs=function(h){var f=Error,e=KJUR,d=e.asn1,b=d.DERSequence,c=d.cades,a=c.OtherCertID,g=e.lang.String.isHex;c.CompleteCertificateRefs.superclass.constructor.call(this);this.typeOid="1.2.840.113549.1.9.16.2.21";this.params=null;this.getValueArray=function(){var o=this.params;var k=[];for(var m=0;m<o.array.length;m++){var n=o.array[m];if(typeof n=="string"){if(n.indexOf("-----BEGIN")!=-1){n={cert:n}}else{if(g(n)){n={hash:n}}else{throw new f("unsupported value: "+n)}}}if(o.alg!=undefined&&n.alg==undefined){n.alg=o.alg}if(o.hasis!=undefined&&n.hasis==undefined){n.hasis=o.hasis}var j=new a(n);k.push(j)}var l=new b({array:k});return[l]};if(h!=undefined){this.setByParam(h)}};extendClass(KJUR.asn1.cades.CompleteCertificateRefs,KJUR.asn1.cms.Attribute);KJUR.asn1.cades.OtherCertID=function(e){var a=KJUR,h=a.asn1,f=h.DERSequence,i=h.cms,g=i.IssuerSerial,c=h.cades,d=c.OtherHashValue,b=c.OtherHashAlgAndValue;c.OtherCertID.superclass.constructor.call(this);this.params=e;this.tohex=function(){var n=this.params;if(typeof n=="string"){if(n.indexOf("-----BEGIN")!=-1){n={cert:n}}else{if(_isHex(n)){n={hash:n}}}}var j=[];var m=null;if(n.alg!=undefined){m=new b(n)}else{m=new d(n)}j.push(m);if((n.cert!=undefined&&n.hasis==true)||(n.issuer!=undefined&&n.serial!=undefined)){var l=new g(n);j.push(l)}var k=new f({array:j});return k.tohex()};this.getEncodedHex=function(){return this.tohex()};if(e!=undefined){this.setByParam(e)}};extendClass(KJUR.asn1.cades.OtherCertID,KJUR.asn1.ASN1Object);KJUR.asn1.cades.OtherHash=function(g){var i=Error,a=KJUR,h=a.asn1,j=h.cms,c=h.cades,b=c.OtherHashAlgAndValue,e=c.OtherHashValue,d=a.crypto.Util.hashHex,f=a.lang.String.isHex;c.OtherHash.superclass.constructor.call(this);this.params=null;this.tohex=function(){var l=this.params;if(typeof l=="string"){if(l.indexOf("-----BEGIN")!=-1){l={cert:l}}else{if(f(l)){l={hash:l}}}}var k=null;if(l.alg!=undefined){k=new b(l)}else{k=new e(l)}return k.tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!=undefined){this.setByParam(g)}};extendClass(KJUR.asn1.cades.OtherHash,KJUR.asn1.ASN1Object);KJUR.asn1.cades.CAdESUtil=new function(){};KJUR.asn1.cades.CAdESUtil.parseSignedDataForAddingUnsigned=function(a){var c=new KJUR.asn1.cms.CMSParser();var b=c.getCMSSignedData(a);return b};KJUR.asn1.cades.CAdESUtil.parseSignerInfoForAddingUnsigned=function(g,q,c){var p=ASN1HEX,s=p.getChildIdx,a=p.getTLV,l=p.getV,v=KJUR,h=v.asn1,n=h.ASN1Object,j=h.cms,k=j.AttributeList,w=j.SignerInfo;var o={};var t=s(g,q);if(t.length!=6){throw"not supported items for SignerInfo (!=6)"}var d=t.shift();o.version=a(g,d);var e=t.shift();o.si=a(g,e);var m=t.shift();o.digalg=a(g,m);var f=t.shift();o.sattrs=a(g,f);var i=t.shift();o.sigalg=a(g,i);var b=t.shift();o.sig=a(g,b);o.sigval=l(g,b);var u=null;o.obj=new w();u=new n();u.hTLV=o.version;o.obj.dCMSVersion=u;u=new n();u.hTLV=o.si;o.obj.dSignerIdentifier=u;u=new n();u.hTLV=o.digalg;o.obj.dDigestAlgorithm=u;u=new n();u.hTLV=o.sattrs;o.obj.dSignedAttrs=u;u=new n();u.hTLV=o.sigalg;o.obj.dSigAlg=u;u=new n();u.hTLV=o.sig;o.obj.dSig=u;o.obj.dUnsignedAttrs=new k();return o};
if(typeof KJUR.asn1.csr=="undefined"||!KJUR.asn1.csr){KJUR.asn1.csr={}}KJUR.asn1.csr.CertificationRequest=function(g){var d=KJUR,c=d.asn1,e=c.DERBitString,b=c.DERSequence,a=c.csr,f=c.x509,h=a.CertificationRequestInfo;a.CertificationRequest.superclass.constructor.call(this);this.setByParam=function(i){this.params=i};this.sign=function(){var j=(new h(this.params)).tohex();var k=new KJUR.crypto.Signature({alg:this.params.sigalg});k.init(this.params.sbjprvkey);k.updateHex(j);var i=k.sign();this.params.sighex=i};this.getPEM=function(){return hextopem(this.tohex(),"CERTIFICATE REQUEST")};this.tohex=function(){var l=this.params;var j=new KJUR.asn1.csr.CertificationRequestInfo(this.params);var m=new KJUR.asn1.x509.AlgorithmIdentifier({name:l.sigalg});if(l.sighex==undefined&&l.sbjprvkey!=undefined){this.sign()}if(l.sighex==undefined){throw new Error("sighex or sbjprvkey parameter not defined")}var k=new e({hex:"00"+l.sighex});var i=new b({array:[j,m,k]});return i.tohex()};this.getEncodedHex=function(){return this.tohex()};if(g!==undefined){this.setByParam(g)}};extendClass(KJUR.asn1.csr.CertificationRequest,KJUR.asn1.ASN1Object);KJUR.asn1.csr.CertificationRequestInfo=function(f){var b=KJUR,j=b.asn1,c=j.DERBitString,g=j.DERSequence,i=j.DERInteger,p=j.DERUTF8String,d=j.DERTaggedObject,h=j.ASN1Util.newObject,n=j.csr,e=j.x509,a=e.X500Name,l=e.Extensions,o=e.SubjectPublicKeyInfo,k=n.AttributeList;n.CertificationRequestInfo.superclass.constructor.call(this);this.params=null;this.setByParam=function(q){if(q!=undefined){this.params=q}};this.tohex=function(){var v=this.params;var r=[];r.push(new i({"int":0}));r.push(new a(v.subject));r.push(new o(KEYUTIL.getKey(v.sbjpubkey)));if(v.attrs!=undefined){var u=m(v.attrs);var t=h({tag:{tage:"a0",obj:u}});r.push(t)}else{if(v.extreq!=undefined){var q=new l(v.extreq);var t=h({tag:{tage:"a0",obj:{seq:[{oid:"1.2.840.113549.1.9.14"},{set:[q]}]}}});r.push(t)}else{r.push(new d({tag:"a0",explicit:false,obj:new p({str:""})}))}}var s=new g({array:r});return s.tohex()};this.getEncodedHex=function(){return this.tohex()};function m(s){var w=Error,v=KJUR.asn1.x509.Extensions;var y=[];for(var u=0;u<s.length;u++){var r=s[u];var x=r.attr;if(x=="extensionRequest"){var t=new v(r.ext);var q={seq:[{oid:"1.2.840.113549.1.9.14"},{set:[t]}]};y.push(q)}else{if(x=="unstructuredName"){var q={seq:[{oid:"1.2.840.113549.1.9.2"},{set:r.names}]};y.push(q)}else{if(x=="challengePassword"){var q={seq:[{oid:"1.2.840.113549.1.9.7"},{set:[{utf8str:r.password}]}]};y.push(q)}else{throw new w("unknown CSR attribute")}}}}return{set:y}}if(f!=undefined){this.setByParam(f)}};extendClass(KJUR.asn1.csr.CertificationRequestInfo,KJUR.asn1.ASN1Object);KJUR.asn1.csr.AttributeList=function(b){function a(c){}};extendClass(KJUR.asn1.csr.AttributeList,KJUR.asn1.ASN1Object);KJUR.asn1.csr.CSRUtil=new function(){};KJUR.asn1.csr.CSRUtil.newCSRPEM=function(e){var b=KEYUTIL,a=KJUR.asn1.csr;var c=new a.CertificationRequest(e);var d=c.getPEM();return d};KJUR.asn1.csr.CSRUtil.getParam=function(d,a){var m=ASN1HEX,i=m.getV,j=m.getIdxbyList,b=m.getTLVbyList,o=m.getTLVbyListEx,n=m.getVbyListEx;var l=function(u){var t=j(u,0,[0,3,0,0],"06");if(i(u,t)!="2a864886f70d01090e"){return null}return b(u,0,[0,3,0,1,0],"30")};var g={};if(d.indexOf("-----BEGIN CERTIFICATE REQUEST")==-1){throw new Error("argument is not PEM file")}var e=pemtohex(d,"CERTIFICATE REQUEST");if(a){g.tbs=b(e,0,[0])}try{var p=o(e,0,[0,1]);if(p=="3000"){g.subject={}}else{var f=new X509();g.subject=f.getX500Name(p)}}catch(q){}var k=o(e,0,[0,2]);var r=KEYUTIL.getKey(k,null,"pkcs8pub");g.sbjpubkey=KEYUTIL.getPEM(r,"PKCS8PUB");var c=l(e);var f=new X509();if(c!=null){g.extreq=f.getExtParamArray(c)}try{var h=o(e,0,[1],"30");var f=new X509();g.sigalg=f.getAlgorithmIdentifierName(h)}catch(q){}try{var s=n(e,0,[2]);g.sighex=s}catch(q){}return g};KJUR.asn1.csr.CSRUtil.verifySignature=function(b){try{var c=null;if(typeof b=="string"&&b.indexOf("-----BEGIN CERTIFICATE REQUEST")!=-1){c=KJUR.asn1.csr.CSRUtil.getParam(b,true)}else{if(typeof b=="object"&&b.sbjpubkey!=undefined&&b.sigalg!=undefined&&b.sighex!=undefined&&b.tbs!=undefined){c=b}}if(c==null){return false}var d=new KJUR.crypto.Signature({alg:c.sigalg});d.init(c.sbjpubkey);d.updateHex(c.tbs);return d.verify(c.sighex)}catch(a){alert(a);return false}};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.asn1=="undefined"||!KJUR.asn1){KJUR.asn1={}}if(typeof KJUR.asn1.ocsp=="undefined"||!KJUR.asn1.ocsp){KJUR.asn1.ocsp={}}KJUR.asn1.ocsp.DEFAULT_HASH="sha1";KJUR.asn1.ocsp.OCSPResponse=function(e){KJUR.asn1.ocsp.OCSPResponse.superclass.constructor.call(this);var a=KJUR.asn1.DEREnumerated,b=KJUR.asn1.ASN1Util.newObject,c=KJUR.asn1.ocsp.ResponseBytes;var d=["successful","malformedRequest","internalError","tryLater","_not_used_","sigRequired","unauthorized"];this.params=null;this._getStatusCode=function(){var f=this.params.resstatus;if(typeof f=="number"){return f}if(typeof f!="string"){return -1}return d.indexOf(f)};this.setByParam=function(f){this.params=f};this.tohex=function(){var h=this.params;var g=this._getStatusCode();if(g==-1){throw new Error("responseStatus not supported: "+h.resstatus)}if(g!=0){return b({seq:[{"enum":{"int":g}}]}).tohex()}var f=new c(h);return b({seq:[{"enum":{"int":0}},{tag:{tag:"a0",explicit:true,obj:f}}]}).tohex()};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){this.setByParam(e)}};extendClass(KJUR.asn1.ocsp.OCSPResponse,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.ResponseBytes=function(e){KJUR.asn1.ocsp.ResponseBytes.superclass.constructor.call(this);var b=KJUR.asn1,a=b.DERSequence,f=b.DERObjectIdentifier,c=b.DEROctetString,d=b.ocsp.BasicOCSPResponse;this.params=null;this.setByParam=function(g){this.params=g};this.tohex=function(){var j=this.params;if(j.restype!="ocspBasic"){throw new Error("not supported responseType: "+j.restype)}var i=new d(j);var g=[];g.push(new f({name:"ocspBasic"}));g.push(new c({hex:i.tohex()}));var h=new a({array:g});return h.tohex()};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){this.setByParam(e)}};extendClass(KJUR.asn1.ocsp.ResponseBytes,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.BasicOCSPResponse=function(d){KJUR.asn1.ocsp.BasicOCSPResponse.superclass.constructor.call(this);var i=Error,g=KJUR.asn1,j=g.ASN1Object,e=g.DERSequence,f=g.DERGeneralizedTime,c=g.DERTaggedObject,b=g.DERBitString,h=g.x509.Extensions,k=g.x509.AlgorithmIdentifier,l=g.ocsp,a=l.ResponderID;_SingleResponseList=l.SingleResponseList,_ResponseData=l.ResponseData;this.params=null;this.setByParam=function(m){this.params=m};this.sign=function(){var o=this.params;var m=o.tbsresp.tohex();var n=new KJUR.crypto.Signature({alg:o.sigalg});n.init(o.reskey);n.updateHex(m);o.sighex=n.sign()};this.tohex=function(){var t=this.params;if(t.tbsresp==undefined){t.tbsresp=new _ResponseData(t)}if(t.sighex==undefined&&t.reskey!=undefined){this.sign()}var n=[];n.push(t.tbsresp);n.push(new k({name:t.sigalg}));n.push(new b({hex:"00"+t.sighex}));if(t.certs!=undefined&&t.certs.length!=undefined){var m=[];for(var q=0;q<t.certs.length;q++){var s=t.certs[q];var r=null;if(ASN1HEX.isASN1HEX(s)){r=s}else{if(s.match(/-----BEGIN/)){r=pemtohex(s)}else{throw new i("certs["+q+"] not hex or PEM")}}m.push(new j({tlv:r}))}var p=new e({array:m});n.push(new c({tag:"a0",explicit:true,obj:p}))}var o=new e({array:n});return o.tohex()};this.getEncodedHex=function(){return this.tohex()};if(d!==undefined){this.setByParam(d)}};extendClass(KJUR.asn1.ocsp.BasicOCSPResponse,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.ResponseData=function(c){KJUR.asn1.ocsp.ResponseData.superclass.constructor.call(this);var h=Error,f=KJUR.asn1,d=f.DERSequence,e=f.DERGeneralizedTime,b=f.DERTaggedObject,g=f.x509.Extensions,i=f.ocsp,a=i.ResponderID;_SingleResponseList=i.SingleResponseList;this.params=null;this.tohex=function(){var m=this.params;if(m.respid!=undefined){new h("respid not specified")}if(m.prodat!=undefined){new h("prodat not specified")}if(m.array!=undefined){new h("array not specified")}var j=[];j.push(new a(m.respid));j.push(new e(m.prodat));j.push(new _SingleResponseList(m.array));if(m.ext!=undefined){var l=new g(m.ext);j.push(new b({tag:"a1",explicit:true,obj:l}))}var k=new d({array:j});return k.tohex()};this.getEncodedHex=function(){return this.tohex()};this.setByParam=function(j){this.params=j};if(c!==undefined){this.setByParam(c)}};extendClass(KJUR.asn1.ocsp.ResponseData,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.ResponderID=function(g){KJUR.asn1.ocsp.ResponderID.superclass.constructor.call(this);var d=KJUR,c=d.asn1,b=c.ASN1Util.newObject,f=c.x509.X500Name,e=d.lang.String.isHex,a=Error;this.params=null;this.tohex=function(){var m=this.params;if(m.key!=undefined){var l=null;if(typeof m.key=="string"){if(e(m.key)){l=m.key}if(m.key.match(/-----BEGIN CERTIFICATE/)){var h=new X509(m.key);var k=h.getExtSubjectKeyIdentifier();if(k!=null){l=k.kid.hex}}}else{if(m.key instanceof X509){var k=m.key.getExtSubjectKeyIdentifier();if(k!=null){l=k.kid.hex}}}if(l==null){throw new a("wrong key member value")}var j=b({tag:{tag:"a2",explicit:true,obj:{octstr:{hex:l}}}});return j.tohex()}else{if(m.name!=undefined){var i=null;if(typeof m.name=="string"&&m.name.match(/-----BEGIN CERTIFICATE/)){var h=new X509(m.name);i=h.getSubject()}else{if(m.name instanceof X509){i=m.name.getSubject()}else{if(typeof m.name=="object"&&(m.name.array!=undefined||m.name.str!=undefined)){i=m.name}}}if(i==null){throw new a("wrong name member value")}var j=b({tag:{tag:"a1",explicit:true,obj:new f(i)}});return j.tohex()}}throw new a("key or name not specified")};this.getEncodedHex=function(){return this.tohex()};this.setByParam=function(h){this.params=h};if(g!==undefined){this.setByParam(g)}};extendClass(KJUR.asn1.ocsp.ResponderID,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.SingleResponseList=function(d){KJUR.asn1.ocsp.SingleResponseList.superclass.constructor.call(this);var c=KJUR.asn1,b=c.DERSequence,a=c.ocsp.SingleResponse;this.params=null;this.tohex=function(){var h=this.params;if(typeof h!="object"||h.length==undefined){throw new Error("params not specified properly")}var e=[];for(var g=0;g<h.length;g++){e.push(new a(h[g]))}var f=new b({array:e});return f.tohex()};this.getEncodedHex=function(){return this.tohex()};this.setByParam=function(e){this.params=e};if(d!==undefined){this.setByParam(d)}};extendClass(KJUR.asn1.ocsp.SingleResponseList,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.SingleResponse=function(e){var k=Error,a=KJUR,i=a.asn1,f=i.DERSequence,g=i.DERGeneralizedTime,b=i.DERTaggedObject,l=i.ocsp,h=l.CertID,c=l.CertStatus,d=i.x509,j=d.Extensions;l.SingleResponse.superclass.constructor.call(this);this.params=null;this.tohex=function(){var q=this.params;var n=[];if(q.certid==undefined){throw new k("certid unspecified")}if(q.status==undefined){throw new k("status unspecified")}if(q.thisupdate==undefined){throw new k("thisupdate unspecified")}n.push(new h(q.certid));n.push(new c(q.status));n.push(new g(q.thisupdate));if(q.nextupdate!=undefined){var m=new g(q.nextupdate);n.push(new b({tag:"a0",explicit:true,obj:m}))}if(q.ext!=undefined){var p=new j(q.ext);n.push(new b({tag:"a1",explicit:true,obj:p}))}var o=new f({array:n});return o.tohex()};this.getEncodedHex=function(){return this.tohex()};this.setByParam=function(m){this.params=m};if(e!==undefined){this.setByParam(e)}};extendClass(KJUR.asn1.ocsp.SingleResponse,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.CertID=function(e){var b=KJUR,i=b.asn1,l=i.DEROctetString,h=i.DERInteger,f=i.DERSequence,d=i.x509,m=d.AlgorithmIdentifier,n=i.ocsp,k=n.DEFAULT_HASH,g=b.crypto,c=g.Util.hashHex,a=X509,o=ASN1HEX,j=o.getVbyList;n.CertID.superclass.constructor.call(this);this.DEFAULT_HASH="sha1";this.params=null;this.setByValue=function(s,r,p,q){if(q==undefined){q=this.DEFAULT_HASH}this.params={alg:q,issname:s,isskey:r,sbjsn:p}};this.setByCert=function(p,q,r){if(r==undefined){r=this.DEFAULT_HASH}this.params={alg:r,issuerCert:p,subjectCert:q,}};this.getParamByCerts=function(y,x,t){if(t==undefined){t=this.DEFAULT_HASH}var q=new a(y);var v=new a(x);var s=c(q.getSubjectHex(),t);var u=q.getPublicKeyHex();var p=c(j(u,0,[1],"03",true),t);var w=v.getSerialNumberHex();var r={alg:t,issname:s,isskey:p,sbjsn:w};return r};this.tohex=function(){if(typeof this.params!="object"){throw new Error("params not set")}var s=this.params;var u,r,y,q;if(s.alg==undefined){q=this.DEFAULT_HASH}else{q=s.alg}if(s.issuerCert!=undefined&&s.subjectCert!=undefined){var t=this.getParamByCerts(s.issuerCert,s.subjectCert,q);u=t.issname;r=t.isskey;y=t.sbjsn}else{if(s.issname!=undefined&&s.isskey!=undefined&&s.sbjsn!=undefined){u=s.issname;r=s.isskey;y=s.sbjsn}else{throw new Error("required param members not defined")}}var A=new m({name:q});var v=new l({hex:u});var x=new l({hex:r});var w=new h({hex:y});var z=new f({array:[A,v,x,w]});this.hTLV=z.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){this.setByParam(e)}};extendClass(KJUR.asn1.ocsp.CertID,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.CertStatus=function(a){KJUR.asn1.ocsp.CertStatus.superclass.constructor.call(this);this.params=null;this.tohex=function(){var d=this.params;if(d.status=="good"){return"8000"}if(d.status=="unknown"){return"8200"}if(d.status=="revoked"){var c=[{gentime:{str:d.time}}];if(d.reason!=undefined){c.push({tag:{tag:"a0",explicit:true,obj:{"enum":{"int":d.reason}}}})}var b={tag:"a1",explicit:false,obj:{seq:c}};return KJUR.asn1.ASN1Util.newObject({tag:b}).tohex()}throw new Error("bad status")};this.getEncodedHex=function(){return this.tohex()};this.setByParam=function(b){this.params=b};if(a!==undefined){this.setByParam(a)}};extendClass(KJUR.asn1.ocsp.CertStatus,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.Request=function(f){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.ocsp;d.Request.superclass.constructor.call(this);this.dReqCert=null;this.dExt=null;this.tohex=function(){var g=[];if(this.dReqCert===null){throw"reqCert not set"}g.push(this.dReqCert);var h=new a({array:g});this.hTLV=h.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(typeof f!=="undefined"){var e=new d.CertID(f);this.dReqCert=e}};extendClass(KJUR.asn1.ocsp.Request,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.TBSRequest=function(e){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.ocsp;d.TBSRequest.superclass.constructor.call(this);this.version=0;this.dRequestorName=null;this.dRequestList=[];this.dRequestExt=null;this.setRequestListByParam=function(h){var f=[];for(var g=0;g<h.length;g++){var j=new d.Request(h[0]);f.push(j)}this.dRequestList=f};this.tohex=function(){var f=[];if(this.version!==0){throw"not supported version: "+this.version}if(this.dRequestorName!==null){throw"requestorName not supported"}var h=new a({array:this.dRequestList});f.push(h);if(this.dRequestExt!==null){throw"requestExtensions not supported"}var g=new a({array:f});this.hTLV=g.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(e!==undefined){if(e.reqList!==undefined){this.setRequestListByParam(e.reqList)}}};extendClass(KJUR.asn1.ocsp.TBSRequest,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.OCSPRequest=function(f){var c=KJUR,b=c.asn1,a=b.DERSequence,d=b.ocsp;d.OCSPRequest.superclass.constructor.call(this);this.dTbsRequest=null;this.dOptionalSignature=null;this.tohex=function(){var g=[];if(this.dTbsRequest!==null){g.push(this.dTbsRequest)}else{throw"tbsRequest not set"}if(this.dOptionalSignature!==null){throw"optionalSignature not supported"}var h=new a({array:g});this.hTLV=h.tohex();return this.hTLV};this.getEncodedHex=function(){return this.tohex()};if(f!==undefined){if(f.reqList!==undefined){var e=new d.TBSRequest(f);this.dTbsRequest=e}}};extendClass(KJUR.asn1.ocsp.OCSPRequest,KJUR.asn1.ASN1Object);KJUR.asn1.ocsp.OCSPUtil={};KJUR.asn1.ocsp.OCSPUtil.getRequestHex=function(a,b,h){var d=KJUR,c=d.asn1,e=c.ocsp;if(h===undefined){h=e.DEFAULT_HASH}var g={alg:h,issuerCert:a,subjectCert:b};var f=new e.OCSPRequest({reqList:[g]});return f.tohex()};KJUR.asn1.ocsp.OCSPUtil.getOCSPResponseInfo=function(b){var m=ASN1HEX,c=m.getVbyList,k=m.getVbyListEx,e=m.getIdxbyList,d=m.getIdxbyListEx,g=m.getV;var n={};try{var j=k(b,0,[0],"0a");n.responseStatus=parseInt(j,16)}catch(f){}if(n.responseStatus!==0){return n}try{var i=e(b,0,[1,0,1,0,0,2,0,1]);if(b.substr(i,2)==="80"){n.certStatus="good"}else{if(b.substr(i,2)==="a1"){n.certStatus="revoked";n.revocationTime=hextoutf8(c(b,i,[0]))}else{if(b.substr(i,2)==="82"){n.certStatus="unknown"}}}}catch(f){}try{var a=e(b,0,[1,0,1,0,0,2,0,2]);n.thisUpdate=hextoutf8(g(b,a))}catch(f){}try{var l=e(b,0,[1,0,1,0,0,2,0,3]);if(b.substr(l,2)==="a0"){n.nextUpdate=hextoutf8(c(b,l,[0]))}}catch(f){}return n};KJUR.asn1.ocsp.OCSPParser=function(){var g=Error,a=X509,h=new a(),l=ASN1HEX,i=l.getV,b=l.getTLV,f=l.getIdxbyList,e=l.getVbyList,c=l.getTLVbyList,k=l.getVbyListEx,d=l.getTLVbyListEx,j=l.getChildIdx;this.getOCSPRequest=function(o){var n=j(o,0);if(n.length!=1&&n.length!=2){throw new g("wrong number elements: "+n.length)}var m=this.getTBSRequest(b(o,n[0]));return m};this.getTBSRequest=function(o){var m={};var n=d(o,0,[0],"30");m.array=this.getRequestList(n);var p=d(o,0,["[2]",0],"30");if(p!=null){m.ext=h.getExtParamArray(p)}return m};this.getRequestList=function(p){var m=[];var n=j(p,0);for(var o=0;o<n.length;o++){var p=b(p,n[o]);m.push(this.getRequest(p))}return m};this.getRequest=function(n){var m=j(n,0);if(m.length!=1&&m.length!=2){throw new g("wrong number elements: "+m.length)}var p=this.getCertID(b(n,m[0]));if(m.length==2){var o=f(n,0,[1,0]);p.ext=h.getExtParamArray(b(n,o))}return p};this.getCertID=function(p){var o=j(p,0);if(o.length!=4){throw new g("wrong number elements: "+o.length)}var n=new a();var m={};m.alg=n.getAlgorithmIdentifierName(b(p,o[0]));m.issname=i(p,o[1]);m.isskey=i(p,o[2]);m.sbjsn=i(p,o[3]);return m};this.getOCSPResponse=function(r){var o=j(r,0);var m;var q=i(r,o[0]);var p=parseInt(q);if(o.length==1){return{resstatus:p}}var n=c(r,0,[1,0]);m=this.getResponseBytes(n);m.resstatus=p;return m};this.getResponseBytes=function(p){var o=j(p,0);var n;var q=c(p,0,[1,0]);n=this.getBasicOCSPResponse(q);var m=i(p,o[0]);n.restype=KJUR.asn1.x509.OID.oid2name(hextooid(m));return n};this.getBasicOCSPResponse=function(q){var t=j(q,0);var v;v=this.getResponseData(b(q,t[0]));var u=new X509();v.alg=u.getAlgorithmIdentifierName(b(q,t[1]));var n=i(q,t[2]);v.sighex=n.substr(2);var m=k(q,0,["[0]"]);if(m!=null){var r=j(m,0);var o=[];for(var p=0;p<r.length;p++){var s=b(m,r[p]);o.push(s)}v.certs=o}return v};this.getResponseData=function(q){var p=j(q,0);var r=p.length;var o={};var n=0;if(q.substr(p[0],2)=="a0"){n++}o.respid=this.getResponderID(b(q,p[n++]));var t=i(q,p[n++]);o.prodat=hextoutf8(t);o.array=this.getSingleResponseList(b(q,p[n++]));if(q.substr(p[r-1],2)=="a1"){var s=c(q,p[r-1],[0]);var m=new X509();o.ext=m.getExtParamArray(s)}return o};this.getResponderID=function(o){var n={};if(o.substr(0,2)=="a2"){var p=e(o,0,[0]);n.key=p}if(o.substr(0,2)=="a1"){var q=c(o,0,[0]);var m=new X509();n.name=m.getX500Name(q)}return n};this.getSingleResponseList=function(q){var n=j(q,0);var m=[];for(var o=0;o<n.length;o++){var r=this.getSingleResponse(b(q,n[o]));m.push(r)}return m};this.getSingleResponse=function(p){var t=j(p,0);var v={};var r=this.getCertID(b(p,t[0]));v.certid=r;var u=this.getCertStatus(b(p,t[1]));v.status=u;if(p.substr(t[2],2)=="18"){var q=i(p,t[2]);v.thisupdate=hextoutf8(q)}for(var o=3;o<t.length;o++){if(p.substr(t[o],2)=="a0"){var m=e(p,t[o],[0],"18");v.nextupdate=hextoutf8(m)}if(p.substr(t[o],2)=="a1"){var s=new X509();var n=c(p,0,[o,0]);v.ext=s.getExtParamArray(n)}}return v};this.getCertStatus=function(p){var m={};if(p=="8000"){return{status:"good"}}if(p=="8200"){return{status:"unknown"}}if(p.substr(0,2)=="a1"){m.status="revoked";var o=e(p,0,[0]);var n=hextoutf8(o);m.time=n}return m}};
var KJUR;if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.lang=="undefined"||!KJUR.lang){KJUR.lang={}}KJUR.lang.String=function(){};function Base64x(){}function stoBA(d){var b=new Array();for(var c=0;c<d.length;c++){b[c]=d.charCodeAt(c)}return b}function BAtos(b){var d="";for(var c=0;c<b.length;c++){d=d+String.fromCharCode(b[c])}return d}function BAtohex(b){var e="";for(var d=0;d<b.length;d++){var c=b[d].toString(16);if(c.length==1){c="0"+c}e=e+c}return e}function stohex(a){return BAtohex(stoBA(a))}function stob64(a){return hex2b64(stohex(a))}function stob64u(a){return b64tob64u(hex2b64(stohex(a)))}function b64utos(a){return BAtos(b64toBA(b64utob64(a)))}function b64tob64u(a){a=a.replace(/\=/g,"");a=a.replace(/\+/g,"-");a=a.replace(/\//g,"_");return a}function b64utob64(a){if(a.length%4==2){a=a+"=="}else{if(a.length%4==3){a=a+"="}}a=a.replace(/-/g,"+");a=a.replace(/_/g,"/");return a}function hextob64u(a){if(a.length%2==1){a="0"+a}return b64tob64u(hex2b64(a))}function b64utohex(a){return b64tohex(b64utob64(a))}var utf8tob64u,b64utoutf8;if(typeof Buffer==="function"){utf8tob64u=function(a){return b64tob64u(Buffer.from(a,"utf8").toString("base64"))};b64utoutf8=function(a){return Buffer.from(b64utob64(a),"base64").toString("utf8")}}else{utf8tob64u=function(a){return hextob64u(uricmptohex(encodeURIComponentAll(a)))};b64utoutf8=function(a){return decodeURIComponent(hextouricmp(b64utohex(a)))}}function utf8tob64(a){return hex2b64(uricmptohex(encodeURIComponentAll(a)))}function b64toutf8(a){return decodeURIComponent(hextouricmp(b64tohex(a)))}function utf8tohex(a){return uricmptohex(encodeURIComponentAll(a)).toLowerCase()}function hextoutf8(b){try{return decodeURIComponent(hextouricmp(b))}catch(a){return null}}function iso88591hextoutf8(a){return hextoutf8(iso88591hextoutf8hex(a))}function utf8toiso88591hex(a){return utf8hextoiso88591hex(utf8tohex(a))}function iso88591hextoutf8hex(e){var c=e.match(/.{1,2}/g);var b=[];for(var d=0;d<c.length;d++){var f=parseInt(c[d],16);if(161<=f&&f<=191){b.push("c2");b.push(c[d])}else{if(192<=f&&f<=255){b.push("c3");b.push((f-64).toString(16))}else{b.push(c[d])}}}return b.join("")}function utf8hextoiso88591hex(f){var c=f.match(/.{1,2}/g);var b=[];for(var e=0;e<c.length;e++){if(c[e]=="c2"){e++;b.push(c[e])}else{if(c[e]=="c3"){e++;var d=c[e];var g=parseInt(c[e],16)+64;b.push(g.toString(16))}else{b.push(c[e])}}}return b.join("")}function hextorstr(c){var b="";for(var a=0;a<c.length-1;a+=2){b+=String.fromCharCode(parseInt(c.substr(a,2),16))}return b}function rstrtohex(c){var a="";for(var b=0;b<c.length;b++){a+=("0"+c.charCodeAt(b).toString(16)).slice(-2)}return a}function hextob64(a){return hex2b64(a)}function hextob64nl(b){var a=hextob64(b);var c=a.replace(/(.{64})/g,"$1\r\n");c=c.replace(/\r\n$/,"");return c}function b64nltohex(b){var a=b.replace(/[^0-9A-Za-z\/+=]*/g,"");var c=b64tohex(a);return c}function hextopem(a,b){var c=hextob64nl(a);return"-----BEGIN "+b+"-----\r\n"+c+"\r\n-----END "+b+"-----\r\n"}function pemtohex(a,b){if(a.indexOf("-----BEGIN ")==-1){throw"can't find PEM header: "+b}if(b!==undefined){a=a.replace(new RegExp("^[^]*-----BEGIN "+b+"-----"),"");a=a.replace(new RegExp("-----END "+b+"-----[^]*$"),"")}else{a=a.replace(/^[^]*-----BEGIN [^-]+-----/,"");a=a.replace(/-----END [^-]+-----[^]*$/,"")}return b64nltohex(a)}function hextoArrayBuffer(d){if(d.length%2!=0){throw"input is not even length"}if(d.match(/^[0-9A-Fa-f]+$/)==null){throw"input is not hexadecimal"}var b=new ArrayBuffer(d.length/2);var a=new DataView(b);for(var c=0;c<d.length/2;c++){a.setUint8(c,parseInt(d.substr(c*2,2),16))}return b}function ArrayBuffertohex(b){var d="";var a=new DataView(b);for(var c=0;c<b.byteLength;c++){d+=("00"+a.getUint8(c).toString(16)).slice(-2)}return d}function zulutomsec(n){var l,j,m,e,f,i,b,k;var a,h,g,c;c=n.match(/^(\d{2}|\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(|\.\d+)Z$/);if(c){a=c[1];l=parseInt(a);if(a.length===2){if(50<=l&&l<100){l=1900+l}else{if(0<=l&&l<50){l=2000+l}}}j=parseInt(c[2])-1;m=parseInt(c[3]);e=parseInt(c[4]);f=parseInt(c[5]);i=parseInt(c[6]);b=0;h=c[7];if(h!==""){g=(h.substr(1)+"00").substr(0,3);b=parseInt(g)}return Date.UTC(l,j,m,e,f,i,b)}throw new Error("unsupported zulu format: "+n)}function zulutosec(a){return Math.round(zulutomsec(a)/1000)}function zulutodate(a){return new Date(zulutomsec(a))}function datetozulu(g,e,f){var b;var a=g.getUTCFullYear();if(e){if(a<1950||2049<a){throw"not proper year for UTCTime: "+a}b=(""+a).slice(-2)}else{b=("000"+a).slice(-4)}b+=("0"+(g.getUTCMonth()+1)).slice(-2);b+=("0"+g.getUTCDate()).slice(-2);b+=("0"+g.getUTCHours()).slice(-2);b+=("0"+g.getUTCMinutes()).slice(-2);b+=("0"+g.getUTCSeconds()).slice(-2);if(f){var c=g.getUTCMilliseconds();if(c!==0){c=("00"+c).slice(-3);c=c.replace(/0+$/g,"");b+="."+c}}b+="Z";return b}function uricmptohex(a){return a.replace(/%/g,"")}function hextouricmp(a){return a.replace(/(..)/g,"%$1")}function ipv6tohex(g){var b="malformed IPv6 address";if(!g.match(/^[0-9A-Fa-f:]+$/)){throw b}g=g.toLowerCase();var d=g.split(":").length-1;if(d<2){throw b}var e=":".repeat(7-d+2);g=g.replace("::",e);var c=g.split(":");if(c.length!=8){throw b}for(var f=0;f<8;f++){c[f]=("0000"+c[f]).slice(-4)}return c.join("")}function hextoipv6(d){if(!d.match(/^[0-9A-Fa-f]{32}$/)){throw new Error("malformed IPv6 address: "+d)}d=d.toLowerCase();var b=d.match(/.{1,4}/g);b=b.map(function(a){return a.replace(/^0+/,"")});b=b.map(function(a){return a==""?"0":a});d=":"+b.join(":")+":";var c=d.match(/:(0:){2,}/g);if(c==null){return d.slice(1,-1)}var e=c.sort().slice(-1)[0];d=d.replace(e.substr(0,e.length-1),":");if(d.substr(0,2)!="::"){d=d.substr(1)}if(d.substr(-2,2)!="::"){d=d.substr(0,d.length-1)}return d}function hextoip(b){var c=new Error("malformed hex value");if(!b.match(/^([0-9A-Fa-f][0-9A-Fa-f]){1,}$/)){throw c}if(b.length==8){var d;try{d=parseInt(b.substr(0,2),16)+"."+parseInt(b.substr(2,2),16)+"."+parseInt(b.substr(4,2),16)+"."+parseInt(b.substr(6,2),16);return d}catch(a){throw c}}else{if(b.length==16){try{return hextoip(b.substr(0,8))+"/"+ipprefixlen(b.substr(8))}catch(a){throw c}}else{if(b.length==32){return hextoipv6(b)}else{if(b.length==64){try{return hextoipv6(b.substr(0,32))+"/"+ipprefixlen(b.substr(32))}catch(a){throw c}return}else{return b}}}}}function ipprefixlen(c){var d=new Error("malformed mask");var a;try{a=new BigInteger(c,16).toString(2)}catch(b){throw d}if(!a.match(/^1*0*$/)){throw d}return a.replace(/0+$/,"").length}function iptohex(g){var j=new Error("malformed IP address");g=g.toLowerCase(g);if(!g.match(/^[0-9a-f.:/]+$/)){throw j}if(g.match(/^[0-9.]+$/)){var b=g.split(".");if(b.length!==4){throw j}var h="";try{for(var f=0;f<4;f++){var k=parseInt(b[f]);h+=("0"+k.toString(16)).slice(-2)}return h}catch(e){throw j}}else{if(g.match(/^[0-9.]+\/[0-9]+$/)){var c=g.split("/");return iptohex(c[0])+ipnetmask(parseInt(c[1]),32)}else{if(g.match(/^[0-9a-f:]+$/)&&g.indexOf(":")!==-1){return ipv6tohex(g)}else{if(g.match(/^[0-9a-f:]+\/[0-9]+$/)&&g.indexOf(":")!==-1){var c=g.split("/");return ipv6tohex(c[0])+ipnetmask(parseInt(c[1]),128)}else{throw j}}}}}function ipnetmask(d,c){if(c==32&&d==0){return"00000000"}if(c==128&&d==0){return"00000000000000000000000000000000"}var a=Array(d+1).join("1")+Array(c-d+1).join("0");return new BigInteger(a,2).toString(16)}function ucs2hextoutf8(d){function e(f){var h=parseInt(f.substr(0,2),16);var a=parseInt(f.substr(2),16);if(h==0&a<128){return String.fromCharCode(a)}if(h<8){var j=192|((h&7)<<3)|((a&192)>>6);var i=128|(a&63);return hextoutf8(j.toString(16)+i.toString(16))}var j=224|((h&240)>>4);var i=128|((h&15)<<2)|((a&192)>>6);var g=128|(a&63);return hextoutf8(j.toString(16)+i.toString(16)+g.toString(16))}var c=d.match(/.{4}/g);var b=c.map(e);return b.join("")}function encodeURIComponentAll(a){var d=encodeURIComponent(a);var b="";for(var c=0;c<d.length;c++){if(d[c]=="%"){b=b+d.substr(c,3);c=c+2}else{b=b+"%"+stohex(d[c])}}return b}function newline_toUnix(a){a=a.replace(/\r\n/mg,"\n");return a}function newline_toDos(a){a=a.replace(/\r\n/mg,"\n");a=a.replace(/\n/mg,"\r\n");return a}KJUR.lang.String.isInteger=function(a){if(a.match(/^[0-9]+$/)){return true}else{if(a.match(/^-[0-9]+$/)){return true}else{return false}}};KJUR.lang.String.isHex=function(a){return ishex(a)};function ishex(a){if(a.length%2==0&&(a.match(/^[0-9a-f]+$/)||a.match(/^[0-9A-F]+$/))){return true}else{return false}}KJUR.lang.String.isBase64=function(a){a=a.replace(/\s+/g,"");if(a.match(/^[0-9A-Za-z+\/]+={0,3}$/)&&a.length%4==0){return true}else{return false}};KJUR.lang.String.isBase64URL=function(a){if(a.match(/[+/=]/)){return false}a=b64utob64(a);return KJUR.lang.String.isBase64(a)};function isBase64URLDot(a){if(a.match(/^[0-9A-Za-z-_.]+$/)){return true}return false}KJUR.lang.String.isIntegerArray=function(a){a=a.replace(/\s+/g,"");if(a.match(/^\[[0-9,]+\]$/)){return true}else{return false}};KJUR.lang.String.isPrintable=function(a){if(a.match(/^[0-9A-Za-z '()+,-./:=?]*$/)!==null){return true}return false};KJUR.lang.String.isIA5=function(a){if(a.match(/^[\x20-\x21\x23-\x7f]*$/)!==null){return true}return false};KJUR.lang.String.isMail=function(a){if(a.match(/^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}\.[A-Za-z0-9]{1,}$/)!==null){return true}return false};function hextoposhex(a){if(a.length%2==1){return"0"+a}if(a.substr(0,1)>"7"){return"00"+a}return a}function intarystrtohex(b){b=b.replace(/^\s*\[\s*/,"");b=b.replace(/\s*\]\s*$/,"");b=b.replace(/\s*/g,"");try{var c=b.split(/,/).map(function(g,e,h){var f=parseInt(g);if(f<0||255<f){throw"integer not in range 0-255"}var d=("00"+f.toString(16)).slice(-2);return d}).join("");return c}catch(a){throw"malformed integer array string: "+a}}var strdiffidx=function(c,a){var d=c.length;if(c.length>a.length){d=a.length}for(var b=0;b<d;b++){if(c.charCodeAt(b)!=a.charCodeAt(b)){return b}}if(c.length!=a.length){return d}return -1};function oidtohex(g){var f=function(a){var l=a.toString(16);if(l.length==1){l="0"+l}return l};var e=function(p){var o="";var l=parseInt(p,10);var a=l.toString(2);var m=7-a.length%7;if(m==7){m=0}var r="";for(var n=0;n<m;n++){r+="0"}a=r+a;for(var n=0;n<a.length-1;n+=7){var q=a.substr(n,7);if(n!=a.length-7){q="1"+q}o+=f(parseInt(q,2))}return o};try{if(!g.match(/^[0-9.]+$/)){return null}var j="";var b=g.split(".");var k=parseInt(b[0],10)*40+parseInt(b[1],10);j+=f(k);b.splice(0,2);for(var d=0;d<b.length;d++){j+=e(b[d])}return j}catch(c){return null}}function hextooid(g){if(!ishex(g)){return null}try{var m=[];var p=g.substr(0,2);var e=parseInt(p,16);m[0]=new String(Math.floor(e/40));m[1]=new String(e%40);var n=g.substr(2);var l=[];for(var f=0;f<n.length/2;f++){l.push(parseInt(n.substr(f*2,2),16))}var k=[];var d="";for(var f=0;f<l.length;f++){if(l[f]&128){d=d+strpad((l[f]&127).toString(2),7)}else{d=d+strpad((l[f]&127).toString(2),7);k.push(new String(parseInt(d,2)));d=""}}var o=m.join(".");if(k.length>0){o=o+"."+k.join(".")}return o}catch(j){return null}}var strpad=function(c,b,a){if(a==undefined){a="0"}if(c.length>=b){return c}return new Array(b-c.length+1).join(a)+c};function bitstrtoint(e){if(e.length%2!=0){return -1}e=e.toLowerCase();if(e.match(/^[0-9a-f]+$/)==null){return -1}try{var a=e.substr(0,2);if(a=="00"){return parseInt(e.substr(2),16)}var b=parseInt(a,16);if(b>7){return -1}var g=e.substr(2);var d=parseInt(g,16).toString(2);if(d=="0"){d="00000000"}d=d.slice(0,0-b);var f=parseInt(d,2);if(f==NaN){return -1}return f}catch(c){return -1}}function inttobitstr(e){if(typeof e!="number"){return null}if(e<0){return null}var c=Number(e).toString(2);var b=8-c.length%8;if(b==8){b=0}c=c+strpad("",b,"0");var d=parseInt(c,2).toString(16);if(d.length%2==1){d="0"+d}var a="0"+b;return a+d}function bitstrtobinstr(g){if(typeof g!="string"){return null}if(g.length%2!=0){return null}if(!g.match(/^[0-9a-f]+$/)){return null}try{var c=parseInt(g.substr(0,2),16);if(c<0||7<c){return null}var j=g.substr(2);var f="";for(var e=0;e<j.length;e+=2){var b=j.substr(e,2);var a=parseInt(b,16).toString(2);a=("0000000"+a).slice(-8);f+=a}return f.substr(0,f.length-c)}catch(d){return null}}function binstrtobitstr(b){if(typeof b!="string"){return null}if(b.match(/^[01]+$/)==null){return null}try{var c=parseInt(b,2);return inttobitstr(c)}catch(a){return null}}function namearraytobinstr(e,g){var f=0;for(var a=0;a<e.length;a++){f|=1<<g[e[a]]}var b=f.toString(2);var c="";for(var a=b.length-1;a>=0;a--){c+=b[a]}return c}function extendClass(c,a){var b=function(){};b.prototype=a.prototype;c.prototype=new b();c.prototype.constructor=c;c.superclass=a.prototype;if(a.prototype.constructor==Object.prototype.constructor){a.prototype.constructor=a}};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.Util=new function(){this.DIGESTINFOHEAD={sha1:"3021300906052b0e03021a05000414",sha224:"302d300d06096086480165030402040500041c",sha256:"3031300d060960864801650304020105000420",sha384:"3041300d060960864801650304020205000430",sha512:"3051300d060960864801650304020305000440",md2:"3020300c06082a864886f70d020205000410",md5:"3020300c06082a864886f70d020505000410",ripemd160:"3021300906052b2403020105000414",};this.DEFAULTPROVIDER={md5:"cryptojs",sha1:"cryptojs",sha224:"cryptojs",sha256:"cryptojs",sha384:"cryptojs",sha512:"cryptojs",ripemd160:"cryptojs",hmacmd5:"cryptojs",hmacsha1:"cryptojs",hmacsha224:"cryptojs",hmacsha256:"cryptojs",hmacsha384:"cryptojs",hmacsha512:"cryptojs",hmacripemd160:"cryptojs",MD5withRSA:"cryptojs/jsrsa",SHA1withRSA:"cryptojs/jsrsa",SHA224withRSA:"cryptojs/jsrsa",SHA256withRSA:"cryptojs/jsrsa",SHA384withRSA:"cryptojs/jsrsa",SHA512withRSA:"cryptojs/jsrsa",RIPEMD160withRSA:"cryptojs/jsrsa",MD5withECDSA:"cryptojs/jsrsa",SHA1withECDSA:"cryptojs/jsrsa",SHA224withECDSA:"cryptojs/jsrsa",SHA256withECDSA:"cryptojs/jsrsa",SHA384withECDSA:"cryptojs/jsrsa",SHA512withECDSA:"cryptojs/jsrsa",RIPEMD160withECDSA:"cryptojs/jsrsa",SHA1withDSA:"cryptojs/jsrsa",SHA224withDSA:"cryptojs/jsrsa",SHA256withDSA:"cryptojs/jsrsa",MD5withRSAandMGF1:"cryptojs/jsrsa",SHAwithRSAandMGF1:"cryptojs/jsrsa",SHA1withRSAandMGF1:"cryptojs/jsrsa",SHA224withRSAandMGF1:"cryptojs/jsrsa",SHA256withRSAandMGF1:"cryptojs/jsrsa",SHA384withRSAandMGF1:"cryptojs/jsrsa",SHA512withRSAandMGF1:"cryptojs/jsrsa",RIPEMD160withRSAandMGF1:"cryptojs/jsrsa",};this.CRYPTOJSMESSAGEDIGESTNAME={md5:CryptoJS.algo.MD5,sha1:CryptoJS.algo.SHA1,sha224:CryptoJS.algo.SHA224,sha256:CryptoJS.algo.SHA256,sha384:CryptoJS.algo.SHA384,sha512:CryptoJS.algo.SHA512,ripemd160:CryptoJS.algo.RIPEMD160};this.getDigestInfoHex=function(a,b){if(typeof this.DIGESTINFOHEAD[b]=="undefined"){throw"alg not supported in Util.DIGESTINFOHEAD: "+b}return this.DIGESTINFOHEAD[b]+a};this.getPaddedDigestInfoHex=function(h,a,j){var c=this.getDigestInfoHex(h,a);var d=j/4;if(c.length+22>d){throw"key is too short for SigAlg: keylen="+j+","+a}var b="0001";var k="00"+c;var g="";var l=d-b.length-k.length;for(var f=0;f<l;f+=2){g+="ff"}var e=b+g+k;return e};this.hashString=function(a,c){var b=new KJUR.crypto.MessageDigest({alg:c});return b.digestString(a)};this.hashHex=function(b,c){var a=new KJUR.crypto.MessageDigest({alg:c});return a.digestHex(b)};this.sha1=function(a){return this.hashString(a,"sha1")};this.sha256=function(a){return this.hashString(a,"sha256")};this.sha256Hex=function(a){return this.hashHex(a,"sha256")};this.sha512=function(a){return this.hashString(a,"sha512")};this.sha512Hex=function(a){return this.hashHex(a,"sha512")};this.isKey=function(a){if(a instanceof RSAKey||a instanceof KJUR.crypto.DSA||a instanceof KJUR.crypto.ECDSA){return true}else{return false}}};KJUR.crypto.Util.md5=function(a){var b=new KJUR.crypto.MessageDigest({alg:"md5",prov:"cryptojs"});return b.digestString(a)};KJUR.crypto.Util.ripemd160=function(a){var b=new KJUR.crypto.MessageDigest({alg:"ripemd160",prov:"cryptojs"});return b.digestString(a)};KJUR.crypto.Util.SECURERANDOMGEN=new SecureRandom();KJUR.crypto.Util.getRandomHexOfNbytes=function(b){var a=new Array(b);KJUR.crypto.Util.SECURERANDOMGEN.nextBytes(a);return BAtohex(a)};KJUR.crypto.Util.getRandomBigIntegerOfNbytes=function(a){return new BigInteger(KJUR.crypto.Util.getRandomHexOfNbytes(a),16)};KJUR.crypto.Util.getRandomHexOfNbits=function(d){var c=d%8;var a=(d-c)/8;var b=new Array(a+1);KJUR.crypto.Util.SECURERANDOMGEN.nextBytes(b);b[0]=(((255<<c)&255)^255)&b[0];return BAtohex(b)};KJUR.crypto.Util.getRandomBigIntegerOfNbits=function(a){return new BigInteger(KJUR.crypto.Util.getRandomHexOfNbits(a),16)};KJUR.crypto.Util.getRandomBigIntegerZeroToMax=function(b){var a=b.bitLength();while(1){var c=KJUR.crypto.Util.getRandomBigIntegerOfNbits(a);if(b.compareTo(c)!=-1){return c}}};KJUR.crypto.Util.getRandomBigIntegerMinToMax=function(e,b){var c=e.compareTo(b);if(c==1){throw"biMin is greater than biMax"}if(c==0){return e}var a=b.subtract(e);var d=KJUR.crypto.Util.getRandomBigIntegerZeroToMax(a);return d.add(e)};KJUR.crypto.MessageDigest=function(c){var b=null;var a=null;var d=null;this.setAlgAndProvider=function(g,f){g=KJUR.crypto.MessageDigest.getCanonicalAlgName(g);if(g!==null&&f===undefined){f=KJUR.crypto.Util.DEFAULTPROVIDER[g]}if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(g)!=-1&&f=="cryptojs"){try{this.md=KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[g].create()}catch(e){throw"setAlgAndProvider hash alg set fail alg="+g+"/"+e}this.updateString=function(h){this.md.update(h)};this.updateHex=function(h){var i=CryptoJS.enc.Hex.parse(h);this.md.update(i)};this.digest=function(){var h=this.md.finalize();return h.toString(CryptoJS.enc.Hex)};this.digestString=function(h){this.updateString(h);return this.digest()};this.digestHex=function(h){this.updateHex(h);return this.digest()}}if(":sha256:".indexOf(g)!=-1&&f=="sjcl"){try{this.md=new sjcl.hash.sha256()}catch(e){throw"setAlgAndProvider hash alg set fail alg="+g+"/"+e}this.updateString=function(h){this.md.update(h)};this.updateHex=function(i){var h=sjcl.codec.hex.toBits(i);this.md.update(h)};this.digest=function(){var h=this.md.finalize();return sjcl.codec.hex.fromBits(h)};this.digestString=function(h){this.updateString(h);return this.digest()};this.digestHex=function(h){this.updateHex(h);return this.digest()}}};this.updateString=function(e){throw"updateString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName};this.updateHex=function(e){throw"updateHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName};this.digest=function(){throw"digest() not supported for this alg/prov: "+this.algName+"/"+this.provName};this.digestString=function(e){throw"digestString(str) not supported for this alg/prov: "+this.algName+"/"+this.provName};this.digestHex=function(e){throw"digestHex(hex) not supported for this alg/prov: "+this.algName+"/"+this.provName};if(c!==undefined){if(c.alg!==undefined){this.algName=c.alg;if(c.prov===undefined){this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]}this.setAlgAndProvider(this.algName,this.provName)}}};KJUR.crypto.MessageDigest.getCanonicalAlgName=function(a){if(typeof a==="string"){a=a.toLowerCase();a=a.replace(/-/,"")}return a};KJUR.crypto.MessageDigest.getHashLength=function(c){var b=KJUR.crypto.MessageDigest;var a=b.getCanonicalAlgName(c);if(b.HASHLENGTH[a]===undefined){throw"not supported algorithm: "+c}return b.HASHLENGTH[a]};KJUR.crypto.MessageDigest.HASHLENGTH={md5:16,sha1:20,sha224:28,sha256:32,sha384:48,sha512:64,ripemd160:20};KJUR.crypto.Mac=function(d){var f=null;var c=null;var a=null;var e=null;var b=null;this.setAlgAndProvider=function(k,i){k=k.toLowerCase();if(k==null){k="hmacsha1"}k=k.toLowerCase();if(k.substr(0,4)!="hmac"){throw"setAlgAndProvider unsupported HMAC alg: "+k}if(i===undefined){i=KJUR.crypto.Util.DEFAULTPROVIDER[k]}this.algProv=k+"/"+i;var g=k.substr(4);if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(g)!=-1&&i=="cryptojs"){try{var j=KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[g];this.mac=CryptoJS.algo.HMAC.create(j,this.pass)}catch(h){throw"setAlgAndProvider hash alg set fail hashAlg="+g+"/"+h}this.updateString=function(l){this.mac.update(l)};this.updateHex=function(l){var m=CryptoJS.enc.Hex.parse(l);this.mac.update(m)};this.doFinal=function(){var l=this.mac.finalize();return l.toString(CryptoJS.enc.Hex)};this.doFinalString=function(l){this.updateString(l);return this.doFinal()};this.doFinalHex=function(l){this.updateHex(l);return this.doFinal()}}};this.updateString=function(g){throw"updateString(str) not supported for this alg/prov: "+this.algProv};this.updateHex=function(g){throw"updateHex(hex) not supported for this alg/prov: "+this.algProv};this.doFinal=function(){throw"digest() not supported for this alg/prov: "+this.algProv};this.doFinalString=function(g){throw"digestString(str) not supported for this alg/prov: "+this.algProv};this.doFinalHex=function(g){throw"digestHex(hex) not supported for this alg/prov: "+this.algProv};this.setPassword=function(h){if(typeof h=="string"){var g=h;if(h.length%2==1||!h.match(/^[0-9A-Fa-f]+$/)){g=rstrtohex(h)}this.pass=CryptoJS.enc.Hex.parse(g);return}if(typeof h!="object"){throw"KJUR.crypto.Mac unsupported password type: "+h}var g=null;if(h.hex!==undefined){if(h.hex.length%2!=0||!h.hex.match(/^[0-9A-Fa-f]+$/)){throw"Mac: wrong hex password: "+h.hex}g=h.hex}if(h.utf8!==undefined){g=utf8tohex(h.utf8)}if(h.rstr!==undefined){g=rstrtohex(h.rstr)}if(h.b64!==undefined){g=b64tohex(h.b64)}if(h.b64u!==undefined){g=b64utohex(h.b64u)}if(g==null){throw"KJUR.crypto.Mac unsupported password type: "+h}this.pass=CryptoJS.enc.Hex.parse(g)};if(d!==undefined){if(d.pass!==undefined){this.setPassword(d.pass)}if(d.alg!==undefined){this.algName=d.alg;if(d.prov===undefined){this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]}this.setAlgAndProvider(this.algName,this.provName)}}};KJUR.crypto.Signature=function(o){var q=null;var n=null;var r=null;var c=null;var l=null;var d=null;var k=null;var h=null;var p=null;var e=null;var b=-1;var g=null;var j=null;var a=null;var i=null;var f=null;this._setAlgNames=function(){var s=this.algName.match(/^(.+)with(.+)$/);if(s){this.mdAlgName=s[1].toLowerCase();this.pubkeyAlgName=s[2].toLowerCase();if(this.pubkeyAlgName=="rsaandmgf1"&&this.mdAlgName=="sha"){this.mdAlgName="sha1"}}};this._zeroPaddingOfSignature=function(x,w){var v="";var t=w/4-x.length;for(var u=0;u<t;u++){v=v+"0"}return v+x};this.setAlgAndProvider=function(u,t){this._setAlgNames();if(t!="cryptojs/jsrsa"){throw new Error("provider not supported: "+t)}if(":md5:sha1:sha224:sha256:sha384:sha512:ripemd160:".indexOf(this.mdAlgName)!=-1){try{this.md=new KJUR.crypto.MessageDigest({alg:this.mdAlgName})}catch(s){throw new Error("setAlgAndProvider hash alg set fail alg="+this.mdAlgName+"/"+s)}this.init=function(w,x){var y=null;try{if(x===undefined){y=KEYUTIL.getKey(w)}else{y=KEYUTIL.getKey(w,x)}}catch(v){throw"init failed:"+v}if(y.isPrivate===true){this.prvKey=y;this.state="SIGN"}else{if(y.isPublic===true){this.pubKey=y;this.state="VERIFY"}else{throw"init failed.:"+y}}};this.updateString=function(v){this.md.updateString(v)};this.updateHex=function(v){this.md.updateHex(v)};this.sign=function(){this.sHashHex=this.md.digest();if(this.prvKey===undefined&&this.ecprvhex!==undefined&&this.eccurvename!==undefined&&KJUR.crypto.ECDSA!==undefined){this.prvKey=new KJUR.crypto.ECDSA({curve:this.eccurvename,prv:this.ecprvhex})}if(this.prvKey instanceof RSAKey&&this.pubkeyAlgName==="rsaandmgf1"){this.hSign=this.prvKey.signWithMessageHashPSS(this.sHashHex,this.mdAlgName,this.pssSaltLen)}else{if(this.prvKey instanceof RSAKey&&this.pubkeyAlgName==="rsa"){this.hSign=this.prvKey.signWithMessageHash(this.sHashHex,this.mdAlgName)}else{if(this.prvKey instanceof KJUR.crypto.ECDSA){this.hSign=this.prvKey.signWithMessageHash(this.sHashHex)}else{if(this.prvKey instanceof KJUR.crypto.DSA){this.hSign=this.prvKey.signWithMessageHash(this.sHashHex)}else{throw"Signature: unsupported private key alg: "+this.pubkeyAlgName}}}}return this.hSign};this.signString=function(v){this.updateString(v);return this.sign()};this.signHex=function(v){this.updateHex(v);return this.sign()};this.verify=function(v){this.sHashHex=this.md.digest();if(this.pubKey===undefined&&this.ecpubhex!==undefined&&this.eccurvename!==undefined&&KJUR.crypto.ECDSA!==undefined){this.pubKey=new KJUR.crypto.ECDSA({curve:this.eccurvename,pub:this.ecpubhex})}if(this.pubKey instanceof RSAKey&&this.pubkeyAlgName==="rsaandmgf1"){return this.pubKey.verifyWithMessageHashPSS(this.sHashHex,v,this.mdAlgName,this.pssSaltLen)}else{if(this.pubKey instanceof RSAKey&&this.pubkeyAlgName==="rsa"){return this.pubKey.verifyWithMessageHash(this.sHashHex,v)}else{if(KJUR.crypto.ECDSA!==undefined&&this.pubKey instanceof KJUR.crypto.ECDSA){return this.pubKey.verifyWithMessageHash(this.sHashHex,v)}else{if(KJUR.crypto.DSA!==undefined&&this.pubKey instanceof KJUR.crypto.DSA){return this.pubKey.verifyWithMessageHash(this.sHashHex,v)}else{throw"Signature: unsupported public key alg: "+this.pubkeyAlgName}}}}}}};this.init=function(s,t){throw"init(key, pass) not supported for this alg:prov="+this.algProvName};this.updateString=function(s){throw"updateString(str) not supported for this alg:prov="+this.algProvName};this.updateHex=function(s){throw"updateHex(hex) not supported for this alg:prov="+this.algProvName};this.sign=function(){throw"sign() not supported for this alg:prov="+this.algProvName};this.signString=function(s){throw"digestString(str) not supported for this alg:prov="+this.algProvName};this.signHex=function(s){throw"digestHex(hex) not supported for this alg:prov="+this.algProvName};this.verify=function(s){throw"verify(hSigVal) not supported for this alg:prov="+this.algProvName};this.initParams=o;if(o!==undefined){if(o.alg!==undefined){this.algName=o.alg;if(o.prov===undefined){this.provName=KJUR.crypto.Util.DEFAULTPROVIDER[this.algName]}else{this.provName=o.prov}this.algProvName=this.algName+":"+this.provName;this.setAlgAndProvider(this.algName,this.provName);this._setAlgNames()}if(o.psssaltlen!==undefined){this.pssSaltLen=o.psssaltlen}if(o.prvkeypem!==undefined){if(o.prvkeypas!==undefined){throw"both prvkeypem and prvkeypas parameters not supported"}else{try{var q=KEYUTIL.getKey(o.prvkeypem);this.init(q)}catch(m){throw"fatal error to load pem private key: "+m}}}}};KJUR.crypto.Cipher=function(a){};KJUR.crypto.Cipher.encrypt=function(e,f,d){if(f instanceof RSAKey&&f.isPublic){var c=KJUR.crypto.Cipher.getAlgByKeyAndName(f,d);if(c==="RSA"){return f.encrypt(e)}if(c==="RSAOAEP"){return f.encryptOAEP(e,"sha1")}var b=c.match(/^RSAOAEP(\d+)$/);if(b!==null){return f.encryptOAEP(e,"sha"+b[1])}throw"Cipher.encrypt: unsupported algorithm for RSAKey: "+d}else{throw"Cipher.encrypt: unsupported key or algorithm"}};KJUR.crypto.Cipher.decrypt=function(e,f,d){if(f instanceof RSAKey&&f.isPrivate){var c=KJUR.crypto.Cipher.getAlgByKeyAndName(f,d);if(c==="RSA"){return f.decrypt(e)}if(c==="RSAOAEP"){return f.decryptOAEP(e,"sha1")}var b=c.match(/^RSAOAEP(\d+)$/);if(b!==null){return f.decryptOAEP(e,"sha"+b[1])}throw"Cipher.decrypt: unsupported algorithm for RSAKey: "+d}else{throw"Cipher.decrypt: unsupported key or algorithm"}};KJUR.crypto.Cipher.getAlgByKeyAndName=function(b,a){if(b instanceof RSAKey){if(":RSA:RSAOAEP:RSAOAEP224:RSAOAEP256:RSAOAEP384:RSAOAEP512:".indexOf(a)!=-1){return a}if(a===null||a===undefined){return"RSA"}throw"getAlgByKeyAndName: not supported algorithm name for RSAKey: "+a}throw"getAlgByKeyAndName: not supported algorithm name: "+a};KJUR.crypto.OID=new function(){this.oidhex2name={"2a864886f70d010101":"rsaEncryption","2a8648ce3d0201":"ecPublicKey","2a8648ce380401":"dsa","2a8648ce3d030107":"secp256r1","2b8104001f":"secp192k1","2b81040021":"secp224r1","2b8104000a":"secp256k1","2b81040022":"secp384r1","2b81040023":"secp521r1","2a8648ce380403":"SHA1withDSA","608648016503040301":"SHA224withDSA","608648016503040302":"SHA256withDSA",}};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.ECDSA=function(e){var g="secp256r1";var p=null;var b=null;var i=null;var j=Error,f=BigInteger,h=ECPointFp,m=KJUR.crypto.ECDSA,c=KJUR.crypto.ECParameterDB,d=m.getName,q=ASN1HEX,n=q.getVbyListEx,k=q.isASN1HEX;var a=new SecureRandom();var o=null;this.type="EC";this.isPrivate=false;this.isPublic=false;function l(x,t,w,s){var r=Math.max(t.bitLength(),s.bitLength());var y=x.add2D(w);var v=x.curve.getInfinity();for(var u=r-1;u>=0;--u){v=v.twice2D();v.z=f.ONE;if(t.testBit(u)){if(s.testBit(u)){v=v.add2D(y)}else{v=v.add2D(x)}}else{if(s.testBit(u)){v=v.add2D(w)}}}return v}this.getBigRandom=function(r){return new f(r.bitLength(),a).mod(r.subtract(f.ONE)).add(f.ONE)};this.setNamedCurve=function(r){this.ecparams=c.getByName(r);this.prvKeyHex=null;this.pubKeyHex=null;this.curveName=r};this.setPrivateKeyHex=function(r){this.isPrivate=true;this.prvKeyHex=r};this.setPublicKeyHex=function(r){this.isPublic=true;this.pubKeyHex=r};this.getPublicKeyXYHex=function(){var t=this.pubKeyHex;if(t.substr(0,2)!=="04"){throw"this method supports uncompressed format(04) only"}var s=this.ecparams.keycharlen;if(t.length!==2+s*2){throw"malformed public key hex length"}var r={};r.x=t.substr(2,s);r.y=t.substr(2+s);return r};this.getShortNISTPCurveName=function(){var r=this.curveName;if(r==="secp256r1"||r==="NIST P-256"||r==="P-256"||r==="prime256v1"){return"P-256"}if(r==="secp384r1"||r==="NIST P-384"||r==="P-384"){return"P-384"}if(r==="secp521r1"||r==="NIST P-521"||r==="P-521"){return"P-521"}return null};this.generateKeyPairHex=function(){var s=this.ecparams.n;var u=this.getBigRandom(s);var r=this.ecparams.keycharlen;var t=("0000000000"+u.toString(16)).slice(-r);this.setPrivateKeyHex(t);var v=this.generatePublicKeyHex();return{ecprvhex:t,ecpubhex:v}};this.generatePublicKeyHex=function(){var u=new f(this.prvKeyHex,16);var w=this.ecparams.G.multiply(u);var t=w.getX().toBigInteger();var s=w.getY().toBigInteger();var r=this.ecparams.keycharlen;var y=("0000000000"+t.toString(16)).slice(-r);var v=("0000000000"+s.toString(16)).slice(-r);var x="04"+y+v;this.setPublicKeyHex(x);return x};this.signWithMessageHash=function(r){return this.signHex(r,this.prvKeyHex)};this.signHex=function(x,u){var A=new f(u,16);var v=this.ecparams.n;var z=new f(x.substring(0,this.ecparams.keycharlen),16);do{var w=this.getBigRandom(v);var B=this.ecparams.G;var y=B.multiply(w);var t=y.getX().toBigInteger().mod(v)}while(t.compareTo(f.ZERO)<=0);var C=w.modInverse(v).multiply(z.add(A.multiply(t))).mod(v);return m.biRSSigToASN1Sig(t,C)};this.sign=function(w,B){var z=B;var u=this.ecparams.n;var y=f.fromByteArrayUnsigned(w);do{var v=this.getBigRandom(u);var A=this.ecparams.G;var x=A.multiply(v);var t=x.getX().toBigInteger().mod(u)}while(t.compareTo(BigInteger.ZERO)<=0);var C=v.modInverse(u).multiply(y.add(z.multiply(t))).mod(u);return this.serializeSig(t,C)};this.verifyWithMessageHash=function(s,r){return this.verifyHex(s,r,this.pubKeyHex)};this.verifyHex=function(v,y,u){try{var t,B;var w=m.parseSigHex(y);t=w.r;B=w.s;var x=h.decodeFromHex(this.ecparams.curve,u);var z=new f(v.substring(0,this.ecparams.keycharlen),16);return this.verifyRaw(z,t,B,x)}catch(A){return false}};this.verify=function(z,A,u){var w,t;if(Bitcoin.Util.isArray(A)){var y=this.parseSig(A);w=y.r;t=y.s}else{if("object"===typeof A&&A.r&&A.s){w=A.r;t=A.s}else{throw"Invalid value for signature"}}var v;if(u instanceof ECPointFp){v=u}else{if(Bitcoin.Util.isArray(u)){v=h.decodeFrom(this.ecparams.curve,u)}else{throw"Invalid format for pubkey value, must be byte array or ECPointFp"}}var x=f.fromByteArrayUnsigned(z);return this.verifyRaw(x,w,t,v)};this.verifyRaw=function(z,t,E,y){var x=this.ecparams.n;var D=this.ecparams.G;if(t.compareTo(f.ONE)<0||t.compareTo(x)>=0){return false}if(E.compareTo(f.ONE)<0||E.compareTo(x)>=0){return false}var A=E.modInverse(x);var w=z.multiply(A).mod(x);var u=t.multiply(A).mod(x);var B=D.multiply(w).add(y.multiply(u));var C=B.getX().toBigInteger().mod(x);return C.equals(t)};this.serializeSig=function(v,u){var w=v.toByteArraySigned();var t=u.toByteArraySigned();var x=[];x.push(2);x.push(w.length);x=x.concat(w);x.push(2);x.push(t.length);x=x.concat(t);x.unshift(x.length);x.unshift(48);return x};this.parseSig=function(y){var x;if(y[0]!=48){throw new Error("Signature not a valid DERSequence")}x=2;if(y[x]!=2){throw new Error("First element in signature must be a DERInteger")}var w=y.slice(x+2,x+2+y[x+1]);x+=2+y[x+1];if(y[x]!=2){throw new Error("Second element in signature must be a DERInteger")}var t=y.slice(x+2,x+2+y[x+1]);x+=2+y[x+1];var v=f.fromByteArrayUnsigned(w);var u=f.fromByteArrayUnsigned(t);return{r:v,s:u}};this.parseSigCompact=function(w){if(w.length!==65){throw"Signature has the wrong length"}var t=w[0]-27;if(t<0||t>7){throw"Invalid signature type"}var x=this.ecparams.n;var v=f.fromByteArrayUnsigned(w.slice(1,33)).mod(x);var u=f.fromByteArrayUnsigned(w.slice(33,65)).mod(x);return{r:v,s:u,i:t}};this.readPKCS5PrvKeyHex=function(u){if(k(u)===false){throw new Error("not ASN.1 hex string")}var r,t,v;try{r=n(u,0,["[0]",0],"06");t=n(u,0,[1],"04");try{v=n(u,0,["[1]",0],"03")}catch(s){}}catch(s){throw new Error("malformed PKCS#1/5 plain ECC private key")}this.curveName=d(r);if(this.curveName===undefined){throw"unsupported curve name"}this.setNamedCurve(this.curveName);this.setPublicKeyHex(v);this.setPrivateKeyHex(t);this.isPublic=false};this.readPKCS8PrvKeyHex=function(v){if(k(v)===false){throw new j("not ASN.1 hex string")}var t,r,u,w;try{t=n(v,0,[1,0],"06");r=n(v,0,[1,1],"06");u=n(v,0,[2,0,1],"04");try{w=n(v,0,[2,0,"[1]",0],"03")}catch(s){}}catch(s){throw new j("malformed PKCS#8 plain ECC private key")}this.curveName=d(r);if(this.curveName===undefined){throw new j("unsupported curve name")}this.setNamedCurve(this.curveName);this.setPublicKeyHex(w);this.setPrivateKeyHex(u);this.isPublic=false};this.readPKCS8PubKeyHex=function(u){if(k(u)===false){throw new j("not ASN.1 hex string")}var t,r,v;try{t=n(u,0,[0,0],"06");r=n(u,0,[0,1],"06");v=n(u,0,[1],"03")}catch(s){throw new j("malformed PKCS#8 ECC public key")}this.curveName=d(r);if(this.curveName===null){throw new j("unsupported curve name")}this.setNamedCurve(this.curveName);this.setPublicKeyHex(v)};this.readCertPubKeyHex=function(t,v){if(k(t)===false){throw new j("not ASN.1 hex string")}var r,u;try{r=n(t,0,[0,5,0,1],"06");u=n(t,0,[0,5,1],"03")}catch(s){throw new j("malformed X.509 certificate ECC public key")}this.curveName=d(r);if(this.curveName===null){throw new j("unsupported curve name")}this.setNamedCurve(this.curveName);this.setPublicKeyHex(u)};if(e!==undefined){if(e.curve!==undefined){this.curveName=e.curve}}if(this.curveName===undefined){this.curveName=g}this.setNamedCurve(this.curveName);if(e!==undefined){if(e.prv!==undefined){this.setPrivateKeyHex(e.prv)}if(e.pub!==undefined){this.setPublicKeyHex(e.pub)}}};KJUR.crypto.ECDSA.parseSigHex=function(a){var b=KJUR.crypto.ECDSA.parseSigHexInHexRS(a);var d=new BigInteger(b.r,16);var c=new BigInteger(b.s,16);return{r:d,s:c}};KJUR.crypto.ECDSA.parseSigHexInHexRS=function(f){var j=ASN1HEX,i=j.getChildIdx,g=j.getV;j.checkStrictDER(f,0);if(f.substr(0,2)!="30"){throw new Error("signature is not a ASN.1 sequence")}var h=i(f,0);if(h.length!=2){throw new Error("signature shall have two elements")}var e=h[0];var d=h[1];if(f.substr(e,2)!="02"){throw new Error("1st item not ASN.1 integer")}if(f.substr(d,2)!="02"){throw new Error("2nd item not ASN.1 integer")}var c=g(f,e);var b=g(f,d);return{r:c,s:b}};KJUR.crypto.ECDSA.asn1SigToConcatSig=function(d){var e=KJUR.crypto.ECDSA.parseSigHexInHexRS(d);var b=e.r;var a=e.s;if(b.length>=130&&b.length<=134){if(b.length%2!=0){throw Error("unknown ECDSA sig r length error")}if(a.length%2!=0){throw Error("unknown ECDSA sig s length error")}if(b.substr(0,2)=="00"){b=b.substr(2)}if(a.substr(0,2)=="00"){a=a.substr(2)}var c=Math.max(b.length,a.length);b=("000000"+b).slice(-c);a=("000000"+a).slice(-c);return b+a}if(b.substr(0,2)=="00"&&(b.length%32)==2){b=b.substr(2)}if(a.substr(0,2)=="00"&&(a.length%32)==2){a=a.substr(2)}if((b.length%32)==30){b="00"+b}if((a.length%32)==30){a="00"+a}if(b.length%32!=0){throw Error("unknown ECDSA sig r length error")}if(a.length%32!=0){throw Error("unknown ECDSA sig s length error")}return b+a};KJUR.crypto.ECDSA.concatSigToASN1Sig=function(a){if(a.length%4!=0){throw Error("unknown ECDSA concatinated r-s sig length error")}var c=a.substr(0,a.length/2);var b=a.substr(a.length/2);return KJUR.crypto.ECDSA.hexRSSigToASN1Sig(c,b)};KJUR.crypto.ECDSA.hexRSSigToASN1Sig=function(b,a){var d=new BigInteger(b,16);var c=new BigInteger(a,16);return KJUR.crypto.ECDSA.biRSSigToASN1Sig(d,c)};KJUR.crypto.ECDSA.biRSSigToASN1Sig=function(f,d){var c=KJUR.asn1;var b=new c.DERInteger({bigint:f});var a=new c.DERInteger({bigint:d});var e=new c.DERSequence({array:[b,a]});return e.tohex()};KJUR.crypto.ECDSA.getName=function(a){if(a==="2b8104001f"){return"secp192k1"}if(a==="2a8648ce3d030107"){return"secp256r1"}if(a==="2b8104000a"){return"secp256k1"}if(a==="2b81040021"){return"secp224r1"}if(a==="2b81040022"){return"secp384r1"}if(a==="2b81040023"){return"secp521r1"}if("|secp256r1|NIST P-256|P-256|prime256v1|".indexOf(a)!==-1){return"secp256r1"}if("|secp256k1|".indexOf(a)!==-1){return"secp256k1"}if("|secp224r1|NIST P-224|P-224|".indexOf(a)!==-1){return"secp224r1"}if("|secp384r1|NIST P-384|P-384|".indexOf(a)!==-1){return"secp384r1"}if("|secp521r1|NIST P-521|P-521|".indexOf(a)!==-1){return"secp521r1"}return null};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.ECParameterDB=new function(){var b={};var c={};function a(d){return new BigInteger(d,16)}this.getByName=function(e){var d=e;if(typeof c[d]!="undefined"){d=c[e]}if(typeof b[d]!="undefined"){return b[d]}throw"unregistered EC curve name: "+d};this.regist=function(A,l,o,g,m,e,j,f,k,u,d,x){b[A]={};var s=a(o);var z=a(g);var y=a(m);var t=a(e);var w=a(j);var r=new ECCurveFp(s,z,y);var q=r.decodePointHex("04"+f+k);b[A]["name"]=A;b[A]["keylen"]=l;b[A]["keycharlen"]=Math.ceil(l/8)*2;b[A]["curve"]=r;b[A]["G"]=q;b[A]["n"]=t;b[A]["h"]=w;b[A]["oid"]=d;b[A]["info"]=x;for(var v=0;v<u.length;v++){c[u[v]]=A}}};KJUR.crypto.ECParameterDB.regist("secp128r1",128,"FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF","FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC","E87579C11079F43DD824993C2CEE5ED3","FFFFFFFE0000000075A30D1B9038A115","1","161FF7528B899B2D0C28607CA52C5B86","CF5AC8395BAFEB13C02DA292DDED7A83",[],"","secp128r1 : SECG curve over a 128 bit prime field");KJUR.crypto.ECParameterDB.regist("secp160k1",160,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFAC73","0","7","0100000000000000000001B8FA16DFAB9ACA16B6B3","1","3B4C382CE37AA192A4019E763036F4F5DD4D7EBB","938CF935318FDCED6BC28286531733C3F03C4FEE",[],"","secp160k1 : SECG curve over a 160 bit prime field");KJUR.crypto.ECParameterDB.regist("secp160r1",160,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFC","1C97BEFC54BD7A8B65ACF89F81D4D4ADC565FA45","0100000000000000000001F4C8F927AED3CA752257","1","4A96B5688EF573284664698968C38BB913CBFC82","23A628553168947D59DCC912042351377AC5FB32",[],"","secp160r1 : SECG curve over a 160 bit prime field");KJUR.crypto.ECParameterDB.regist("secp192k1",192,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFEE37","0","3","FFFFFFFFFFFFFFFFFFFFFFFE26F2FC170F69466A74DEFD8D","1","DB4FF10EC057E9AE26B07D0280B7F4341DA5D1B1EAE06C7D","9B2F2F6D9C5628A7844163D015BE86344082AA88D95E2F9D",[]);KJUR.crypto.ECParameterDB.regist("secp192r1",192,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFC","64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1","FFFFFFFFFFFFFFFFFFFFFFFF99DEF836146BC9B1B4D22831","1","188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012","07192B95FFC8DA78631011ED6B24CDD573F977A11E794811",[]);KJUR.crypto.ECParameterDB.regist("secp224r1",224,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000001","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFE","B4050A850C04B3ABF54132565044B0B7D7BFD8BA270B39432355FFB4","FFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D","1","B70E0CBD6BB4BF7F321390B94A03C1D356C21122343280D6115C1D21","BD376388B5F723FB4C22DFE6CD4375A05A07476444D5819985007E34",[]);KJUR.crypto.ECParameterDB.regist("secp256k1",256,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F","0","7","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141","1","79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798","483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8",[]);KJUR.crypto.ECParameterDB.regist("secp256r1",256,"FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF","FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC","5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B","FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551","1","6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296","4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5",["NIST P-256","P-256","prime256v1"]);KJUR.crypto.ECParameterDB.regist("secp384r1",384,"FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC","B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF","FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973","1","AA87CA22BE8B05378EB1C71EF320AD746E1D3B628BA79B9859F741E082542A385502F25DBF55296C3A545E3872760AB7","3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f",["NIST P-384","P-384"]);KJUR.crypto.ECParameterDB.regist("secp521r1",521,"1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF","1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC","051953EB9618E1C9A1F929A21A0B68540EEA2DA725B99B315F3B8B489918EF109E156193951EC7E937B1652C0BD3BB1BF073573DF883D2C34F1EF451FD46B503F00","1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA51868783BF2F966B7FCC0148F709A5D03BB5C9B8899C47AEBB6FB71E91386409","1","00C6858E06B70404E9CD9E3ECB662395B4429C648139053FB521F828AF606B4D3DBAA14B5E77EFE75928FE1DC127A2FFA8DE3348B3C1856A429BF97E7E31C2E5BD66","011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650",["NIST P-521","P-521"]);
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.crypto=="undefined"||!KJUR.crypto){KJUR.crypto={}}KJUR.crypto.DSA=function(){var b=ASN1HEX,e=b.getVbyList,d=b.getVbyListEx,a=b.isASN1HEX,c=BigInteger;this.p=null;this.q=null;this.g=null;this.y=null;this.x=null;this.type="DSA";this.isPrivate=false;this.isPublic=false;this.setPrivate=function(j,i,h,k,f){this.isPrivate=true;this.p=j;this.q=i;this.g=h;this.y=k;this.x=f};this.setPrivateHex=function(i,g,k,n,o){var h,f,j,l,m;h=new BigInteger(i,16);f=new BigInteger(g,16);j=new BigInteger(k,16);if(typeof n==="string"&&n.length>1){l=new BigInteger(n,16)}else{l=null}m=new BigInteger(o,16);this.setPrivate(h,f,j,l,m)};this.setPublic=function(i,h,f,j){this.isPublic=true;this.p=i;this.q=h;this.g=f;this.y=j;this.x=null};this.setPublicHex=function(k,j,i,l){var g,f,m,h;g=new BigInteger(k,16);f=new BigInteger(j,16);m=new BigInteger(i,16);h=new BigInteger(l,16);this.setPublic(g,f,m,h)};this.signWithMessageHash=function(j){var i=this.p;var h=this.q;var m=this.g;var o=this.y;var t=this.x;var l=KJUR.crypto.Util.getRandomBigIntegerMinToMax(BigInteger.ONE.add(BigInteger.ONE),h.subtract(BigInteger.ONE));var u=j.substr(0,h.bitLength()/4);var n=new BigInteger(u,16);var f=(m.modPow(l,i)).mod(h);var w=(l.modInverse(h).multiply(n.add(t.multiply(f)))).mod(h);var v=KJUR.asn1.ASN1Util.jsonToASN1HEX({seq:[{"int":{bigint:f}},{"int":{bigint:w}}]});return v};this.verifyWithMessageHash=function(m,l){var j=this.p;var h=this.q;var o=this.g;var u=this.y;var n=this.parseASN1Signature(l);var f=n[0];var C=n[1];var B=m.substr(0,h.bitLength()/4);var t=new BigInteger(B,16);if(BigInteger.ZERO.compareTo(f)>0||f.compareTo(h)>0){throw"invalid DSA signature"}if(BigInteger.ZERO.compareTo(C)>=0||C.compareTo(h)>0){throw"invalid DSA signature"}var x=C.modInverse(h);var k=t.multiply(x).mod(h);var i=f.multiply(x).mod(h);var A=o.modPow(k,j).multiply(u.modPow(i,j)).mod(j).mod(h);return A.compareTo(f)==0};this.parseASN1Signature=function(f){try{var i=new c(d(f,0,[0],"02"),16);var h=new c(d(f,0,[1],"02"),16);return[i,h]}catch(g){throw new Error("malformed ASN.1 DSA signature")}};this.readPKCS5PrvKeyHex=function(j){var k,i,g,l,m;if(a(j)===false){throw new Error("not ASN.1 hex string")}try{k=d(j,0,[1],"02");i=d(j,0,[2],"02");g=d(j,0,[3],"02");l=d(j,0,[4],"02");m=d(j,0,[5],"02")}catch(f){throw new Error("malformed PKCS#1/5 plain DSA private key")}this.setPrivateHex(k,i,g,l,m)};this.readPKCS8PrvKeyHex=function(j){var k,i,g,l;if(a(j)===false){throw new Error("not ASN.1 hex string")}try{k=d(j,0,[1,1,0],"02");i=d(j,0,[1,1,1],"02");g=d(j,0,[1,1,2],"02");l=d(j,0,[2,0],"02")}catch(f){throw new Error("malformed PKCS#8 plain DSA private key")}this.setPrivateHex(k,i,g,null,l)};this.readPKCS8PubKeyHex=function(j){var k,i,g,l;if(a(j)===false){throw new Error("not ASN.1 hex string")}try{k=d(j,0,[0,1,0],"02");i=d(j,0,[0,1,1],"02");g=d(j,0,[0,1,2],"02");l=d(j,0,[1,0],"02")}catch(f){throw new Error("malformed PKCS#8 DSA public key")}this.setPublicHex(k,i,g,l)};this.readCertPubKeyHex=function(j,m){var k,i,g,l;if(a(j)===false){throw new Error("not ASN.1 hex string")}try{k=d(j,0,[0,5,0,1,0],"02");i=d(j,0,[0,5,0,1,1],"02");g=d(j,0,[0,5,0,1,2],"02");l=d(j,0,[0,5,1,0],"02")}catch(f){throw new Error("malformed X.509 certificate DSA public key")}this.setPublicHex(k,i,g,l)}};
var KEYUTIL=function(){var d=function(p,r,q){return k(CryptoJS.AES,p,r,q)};var e=function(p,r,q){return k(CryptoJS.TripleDES,p,r,q)};var a=function(p,r,q){return k(CryptoJS.DES,p,r,q)};var k=function(s,x,u,q){var r=CryptoJS.enc.Hex.parse(x);var w=CryptoJS.enc.Hex.parse(u);var p=CryptoJS.enc.Hex.parse(q);var t={};t.key=w;t.iv=p;t.ciphertext=r;var v=s.decrypt(t,w,{iv:p});return CryptoJS.enc.Hex.stringify(v)};var l=function(p,r,q){return g(CryptoJS.AES,p,r,q)};var o=function(p,r,q){return g(CryptoJS.TripleDES,p,r,q)};var f=function(p,r,q){return g(CryptoJS.DES,p,r,q)};var g=function(t,y,v,q){var s=CryptoJS.enc.Hex.parse(y);var x=CryptoJS.enc.Hex.parse(v);var p=CryptoJS.enc.Hex.parse(q);var w=t.encrypt(s,x,{iv:p});var r=CryptoJS.enc.Hex.parse(w.toString());var u=CryptoJS.enc.Base64.stringify(r);return u};var i={"AES-256-CBC":{proc:d,eproc:l,keylen:32,ivlen:16},"AES-192-CBC":{proc:d,eproc:l,keylen:24,ivlen:16},"AES-128-CBC":{proc:d,eproc:l,keylen:16,ivlen:16},"DES-EDE3-CBC":{proc:e,eproc:o,keylen:24,ivlen:8},"DES-CBC":{proc:a,eproc:f,keylen:8,ivlen:8}};var c=function(p){return i[p]["proc"]};var m=function(p){var r=CryptoJS.lib.WordArray.random(p);var q=CryptoJS.enc.Hex.stringify(r);return q};var n=function(v){var w={};var q=v.match(new RegExp("DEK-Info: ([^,]+),([0-9A-Fa-f]+)","m"));if(q){w.cipher=q[1];w.ivsalt=q[2]}var p=v.match(new RegExp("-----BEGIN ([A-Z]+) PRIVATE KEY-----"));if(p){w.type=p[1]}var u=-1;var x=0;if(v.indexOf("\r\n\r\n")!=-1){u=v.indexOf("\r\n\r\n");x=2}if(v.indexOf("\n\n")!=-1){u=v.indexOf("\n\n");x=1}var t=v.indexOf("-----END");if(u!=-1&&t!=-1){var r=v.substring(u+x*2,t-x);r=r.replace(/\s+/g,"");w.data=r}return w};var j=function(q,y,p){var v=p.substring(0,16);var t=CryptoJS.enc.Hex.parse(v);var r=CryptoJS.enc.Utf8.parse(y);var u=i[q]["keylen"]+i[q]["ivlen"];var x="";var w=null;for(;;){var s=CryptoJS.algo.MD5.create();if(w!=null){s.update(w)}s.update(r);s.update(t);w=s.finalize();x=x+CryptoJS.enc.Hex.stringify(w);if(x.length>=u*2){break}}var z={};z.keyhex=x.substr(0,i[q]["keylen"]*2);z.ivhex=x.substr(i[q]["keylen"]*2,i[q]["ivlen"]*2);return z};var b=function(p,v,r,w){var s=CryptoJS.enc.Base64.parse(p);var q=CryptoJS.enc.Hex.stringify(s);var u=i[v]["proc"];var t=u(q,r,w);return t};var h=function(p,s,q,u){var r=i[s]["eproc"];var t=r(p,q,u);return t};return{version:"1.0.0",parsePKCS5PEM:function(p){return n(p)},getKeyAndUnusedIvByPasscodeAndIvsalt:function(q,p,r){return j(q,p,r)},decryptKeyB64:function(p,r,q,s){return b(p,r,q,s)},getDecryptedKeyHex:function(y,x){var q=n(y);var t=q.type;var r=q.cipher;var p=q.ivsalt;var s=q.data;var w=j(r,x,p);var v=w.keyhex;var u=b(s,r,v,p);return u},getEncryptedPKCS5PEMFromPrvKeyHex:function(x,s,A,t,r){var p="";if(typeof t=="undefined"||t==null){t="AES-256-CBC"}if(typeof i[t]=="undefined"){throw new Error("KEYUTIL unsupported algorithm: "+t)}if(typeof r=="undefined"||r==null){var v=i[t]["ivlen"];var u=m(v);r=u.toUpperCase()}var z=j(t,A,r);var y=z.keyhex;var w=h(s,t,y,r);var q=w.replace(/(.{64})/g,"$1\r\n");var p="-----BEGIN "+x+" PRIVATE KEY-----\r\n";p+="Proc-Type: 4,ENCRYPTED\r\n";p+="DEK-Info: "+t+","+r+"\r\n";p+="\r\n";p+=q;p+="\r\n-----END "+x+" PRIVATE KEY-----\r\n";return p},parseHexOfEncryptedPKCS8:function(y){var B=ASN1HEX;var z=B.getChildIdx;var w=B.getV;var t={};var r=z(y,0);if(r.length!=2){throw new Error("malformed format: SEQUENCE(0).items != 2: "+r.length)}t.ciphertext=w(y,r[1]);var A=z(y,r[0]);if(A.length!=2){throw new Error("malformed format: SEQUENCE(0.0).items != 2: "+A.length)}if(w(y,A[0])!="2a864886f70d01050d"){throw new Error("this only supports pkcs5PBES2")}var p=z(y,A[1]);if(A.length!=2){throw new Error("malformed format: SEQUENCE(0.0.1).items != 2: "+p.length)}var q=z(y,p[1]);if(q.length!=2){throw new Error("malformed format: SEQUENCE(0.0.1.1).items != 2: "+q.length)}if(w(y,q[0])!="2a864886f70d0307"){throw"this only supports TripleDES"}t.encryptionSchemeAlg="TripleDES";t.encryptionSchemeIV=w(y,q[1]);var s=z(y,p[0]);if(s.length!=2){throw new Error("malformed format: SEQUENCE(0.0.1.0).items != 2: "+s.length)}if(w(y,s[0])!="2a864886f70d01050c"){throw new Error("this only supports pkcs5PBKDF2")}var x=z(y,s[1]);if(x.length<2){throw new Error("malformed format: SEQUENCE(0.0.1.0.1).items < 2: "+x.length)}t.pbkdf2Salt=w(y,x[0]);var u=w(y,x[1]);try{t.pbkdf2Iter=parseInt(u,16)}catch(v){throw new Error("malformed format pbkdf2Iter: "+u)}return t},getPBKDF2KeyHexFromParam:function(u,p){var t=CryptoJS.enc.Hex.parse(u.pbkdf2Salt);var q=u.pbkdf2Iter;var s=CryptoJS.PBKDF2(p,t,{keySize:192/32,iterations:q});var r=CryptoJS.enc.Hex.stringify(s);return r},_getPlainPKCS8HexFromEncryptedPKCS8PEM:function(x,y){var r=pemtohex(x,"ENCRYPTED PRIVATE KEY");var p=this.parseHexOfEncryptedPKCS8(r);var u=KEYUTIL.getPBKDF2KeyHexFromParam(p,y);var v={};v.ciphertext=CryptoJS.enc.Hex.parse(p.ciphertext);var t=CryptoJS.enc.Hex.parse(u);var s=CryptoJS.enc.Hex.parse(p.encryptionSchemeIV);var w=CryptoJS.TripleDES.decrypt(v,t,{iv:s});var q=CryptoJS.enc.Hex.stringify(w);return q},getKeyFromEncryptedPKCS8PEM:function(s,q){var p=this._getPlainPKCS8HexFromEncryptedPKCS8PEM(s,q);var r=this.getKeyFromPlainPrivatePKCS8Hex(p);return r},parsePlainPrivatePKCS8Hex:function(s){var v=ASN1HEX;var u=v.getChildIdx;var t=v.getV;var q={};q.algparam=null;if(s.substr(0,2)!="30"){throw new Error("malformed plain PKCS8 private key(code:001)")}var r=u(s,0);if(r.length<3){throw new Error("malformed plain PKCS8 private key(code:002)")}if(s.substr(r[1],2)!="30"){throw new Error("malformed PKCS8 private key(code:003)")}var p=u(s,r[1]);if(p.length!=2){throw new Error("malformed PKCS8 private key(code:004)")}if(s.substr(p[0],2)!="06"){throw new Error("malformed PKCS8 private key(code:005)")}q.algoid=t(s,p[0]);if(s.substr(p[1],2)=="06"){q.algparam=t(s,p[1])}if(s.substr(r[2],2)!="04"){throw new Error("malformed PKCS8 private key(code:006)")}q.keyidx=v.getVidx(s,r[2]);return q},getKeyFromPlainPrivatePKCS8PEM:function(q){var p=pemtohex(q,"PRIVATE KEY");var r=this.getKeyFromPlainPrivatePKCS8Hex(p);return r},getKeyFromPlainPrivatePKCS8Hex:function(p){var q=this.parsePlainPrivatePKCS8Hex(p);var r;if(q.algoid=="2a864886f70d010101"){r=new RSAKey()}else{if(q.algoid=="2a8648ce380401"){r=new KJUR.crypto.DSA()}else{if(q.algoid=="2a8648ce3d0201"){r=new KJUR.crypto.ECDSA()}else{throw new Error("unsupported private key algorithm")}}}r.readPKCS8PrvKeyHex(p);return r},_getKeyFromPublicPKCS8Hex:function(q){var p;var r=ASN1HEX.getVbyList(q,0,[0,0],"06");if(r==="2a864886f70d010101"){p=new RSAKey()}else{if(r==="2a8648ce380401"){p=new KJUR.crypto.DSA()}else{if(r==="2a8648ce3d0201"){p=new KJUR.crypto.ECDSA()}else{throw new Error("unsupported PKCS#8 public key hex")}}}p.readPKCS8PubKeyHex(q);return p},parsePublicRawRSAKeyHex:function(r){var u=ASN1HEX;var t=u.getChildIdx;var s=u.getV;var p={};if(r.substr(0,2)!="30"){throw new Error("malformed RSA key(code:001)")}var q=t(r,0);if(q.length!=2){throw new Error("malformed RSA key(code:002)")}if(r.substr(q[0],2)!="02"){throw new Error("malformed RSA key(code:003)")}p.n=s(r,q[0]);if(r.substr(q[1],2)!="02"){throw new Error("malformed RSA key(code:004)")}p.e=s(r,q[1]);return p},parsePublicPKCS8Hex:function(t){var v=ASN1HEX;var u=v.getChildIdx;var s=v.getV;var q={};q.algparam=null;var r=u(t,0);if(r.length!=2){throw new Error("outer DERSequence shall have 2 elements: "+r.length)}var w=r[0];if(t.substr(w,2)!="30"){throw new Error("malformed PKCS8 public key(code:001)")}var p=u(t,w);if(p.length!=2){throw new Error("malformed PKCS8 public key(code:002)")}if(t.substr(p[0],2)!="06"){throw new Error("malformed PKCS8 public key(code:003)")}q.algoid=s(t,p[0]);if(t.substr(p[1],2)=="06"){q.algparam=s(t,p[1])}else{if(t.substr(p[1],2)=="30"){q.algparam={};q.algparam.p=v.getVbyList(t,p[1],[0],"02");q.algparam.q=v.getVbyList(t,p[1],[1],"02");q.algparam.g=v.getVbyList(t,p[1],[2],"02")}}if(t.substr(r[1],2)!="03"){throw new Error("malformed PKCS8 public key(code:004)")}q.key=s(t,r[1]).substr(2);return q},}}();KEYUTIL.getKey=function(l,k,n){var G=ASN1HEX,L=G.getChildIdx,v=G.getV,d=G.getVbyList,c=KJUR.crypto,i=c.ECDSA,C=c.DSA,w=RSAKey,M=pemtohex,F=KEYUTIL;if(typeof w!="undefined"&&l instanceof w){return l}if(typeof i!="undefined"&&l instanceof i){return l}if(typeof C!="undefined"&&l instanceof C){return l}if(l.curve!==undefined&&l.xy!==undefined&&l.d===undefined){return new i({pub:l.xy,curve:l.curve})}if(l.curve!==undefined&&l.d!==undefined){return new i({prv:l.d,curve:l.curve})}if(l.kty===undefined&&l.n!==undefined&&l.e!==undefined&&l.d===undefined){var P=new w();P.setPublic(l.n,l.e);return P}if(l.kty===undefined&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined&&l.p!==undefined&&l.q!==undefined&&l.dp!==undefined&&l.dq!==undefined&&l.co!==undefined&&l.qi===undefined){var P=new w();P.setPrivateEx(l.n,l.e,l.d,l.p,l.q,l.dp,l.dq,l.co);return P}if(l.kty===undefined&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined&&l.p===undefined){var P=new w();P.setPrivate(l.n,l.e,l.d);return P}if(l.p!==undefined&&l.q!==undefined&&l.g!==undefined&&l.y!==undefined&&l.x===undefined){var P=new C();P.setPublic(l.p,l.q,l.g,l.y);return P}if(l.p!==undefined&&l.q!==undefined&&l.g!==undefined&&l.y!==undefined&&l.x!==undefined){var P=new C();P.setPrivate(l.p,l.q,l.g,l.y,l.x);return P}if(l.kty==="RSA"&&l.n!==undefined&&l.e!==undefined&&l.d===undefined){var P=new w();P.setPublic(b64utohex(l.n),b64utohex(l.e));return P}if(l.kty==="RSA"&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined&&l.p!==undefined&&l.q!==undefined&&l.dp!==undefined&&l.dq!==undefined&&l.qi!==undefined){var P=new w();P.setPrivateEx(b64utohex(l.n),b64utohex(l.e),b64utohex(l.d),b64utohex(l.p),b64utohex(l.q),b64utohex(l.dp),b64utohex(l.dq),b64utohex(l.qi));return P}if(l.kty==="RSA"&&l.n!==undefined&&l.e!==undefined&&l.d!==undefined){var P=new w();P.setPrivate(b64utohex(l.n),b64utohex(l.e),b64utohex(l.d));return P}if(l.kty==="EC"&&l.crv!==undefined&&l.x!==undefined&&l.y!==undefined&&l.d===undefined){var j=new i({curve:l.crv});var t=j.ecparams.keycharlen;var B=("0000000000"+b64utohex(l.x)).slice(-t);var z=("0000000000"+b64utohex(l.y)).slice(-t);var u="04"+B+z;j.setPublicKeyHex(u);return j}if(l.kty==="EC"&&l.crv!==undefined&&l.x!==undefined&&l.y!==undefined&&l.d!==undefined){var j=new i({curve:l.crv});var t=j.ecparams.keycharlen;var B=("0000000000"+b64utohex(l.x)).slice(-t);var z=("0000000000"+b64utohex(l.y)).slice(-t);var u="04"+B+z;var b=("0000000000"+b64utohex(l.d)).slice(-t);j.setPublicKeyHex(u);j.setPrivateKeyHex(b);return j}if(n==="pkcs5prv"){var J=l,G=ASN1HEX,N,P;N=L(J,0);if(N.length===9){P=new w();P.readPKCS5PrvKeyHex(J)}else{if(N.length===6){P=new C();P.readPKCS5PrvKeyHex(J)}else{if(N.length>2&&J.substr(N[1],2)==="04"){P=new i();P.readPKCS5PrvKeyHex(J)}else{throw new Error("unsupported PKCS#1/5 hexadecimal key")}}}return P}if(n==="pkcs8prv"){var P=F.getKeyFromPlainPrivatePKCS8Hex(l);return P}if(n==="pkcs8pub"){return F._getKeyFromPublicPKCS8Hex(l)}if(n==="x509pub"){return X509.getPublicKeyFromCertHex(l)}if(l.indexOf("-END CERTIFICATE-",0)!=-1||l.indexOf("-END X509 CERTIFICATE-",0)!=-1||l.indexOf("-END TRUSTED CERTIFICATE-",0)!=-1){return X509.getPublicKeyFromCertPEM(l)}if(l.indexOf("-END PUBLIC KEY-")!=-1){var O=pemtohex(l,"PUBLIC KEY");return F._getKeyFromPublicPKCS8Hex(O)}if(l.indexOf("-END RSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")==-1){var m=M(l,"RSA PRIVATE KEY");return F.getKey(m,null,"pkcs5prv")}if(l.indexOf("-END DSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")==-1){var I=M(l,"DSA PRIVATE KEY");var E=d(I,0,[1],"02");var D=d(I,0,[2],"02");var K=d(I,0,[3],"02");var r=d(I,0,[4],"02");var s=d(I,0,[5],"02");var P=new C();P.setPrivate(new BigInteger(E,16),new BigInteger(D,16),new BigInteger(K,16),new BigInteger(r,16),new BigInteger(s,16));return P}if(l.indexOf("-END EC PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")==-1){var m=M(l,"EC PRIVATE KEY");return F.getKey(m,null,"pkcs5prv")}if(l.indexOf("-END PRIVATE KEY-")!=-1){return F.getKeyFromPlainPrivatePKCS8PEM(l)}if(l.indexOf("-END RSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")!=-1){var o=F.getDecryptedKeyHex(l,k);var H=new RSAKey();H.readPKCS5PrvKeyHex(o);return H}if(l.indexOf("-END EC PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")!=-1){var I=F.getDecryptedKeyHex(l,k);var P=d(I,0,[1],"04");var f=d(I,0,[2,0],"06");var A=d(I,0,[3,0],"03").substr(2);var e="";if(KJUR.crypto.OID.oidhex2name[f]!==undefined){e=KJUR.crypto.OID.oidhex2name[f]}else{throw new Error("undefined OID(hex) in KJUR.crypto.OID: "+f)}var j=new i({curve:e});j.setPublicKeyHex(A);j.setPrivateKeyHex(P);j.isPublic=false;return j}if(l.indexOf("-END DSA PRIVATE KEY-")!=-1&&l.indexOf("4,ENCRYPTED")!=-1){var I=F.getDecryptedKeyHex(l,k);var E=d(I,0,[1],"02");var D=d(I,0,[2],"02");var K=d(I,0,[3],"02");var r=d(I,0,[4],"02");var s=d(I,0,[5],"02");var P=new C();P.setPrivate(new BigInteger(E,16),new BigInteger(D,16),new BigInteger(K,16),new BigInteger(r,16),new BigInteger(s,16));return P}if(l.indexOf("-END ENCRYPTED PRIVATE KEY-")!=-1){return F.getKeyFromEncryptedPKCS8PEM(l,k)}throw new Error("not supported argument")};KEYUTIL.generateKeypair=function(a,c){if(a=="RSA"){var b=c;var h=new RSAKey();h.generate(b,"10001");h.isPrivate=true;h.isPublic=true;var f=new RSAKey();var e=h.n.toString(16);var i=h.e.toString(16);f.setPublic(e,i);f.isPrivate=false;f.isPublic=true;var k={};k.prvKeyObj=h;k.pubKeyObj=f;return k}else{if(a=="EC"){var d=c;var g=new KJUR.crypto.ECDSA({curve:d});var j=g.generateKeyPairHex();var h=new KJUR.crypto.ECDSA({curve:d});h.setPublicKeyHex(j.ecpubhex);h.setPrivateKeyHex(j.ecprvhex);h.isPrivate=true;h.isPublic=false;var f=new KJUR.crypto.ECDSA({curve:d});f.setPublicKeyHex(j.ecpubhex);f.isPrivate=false;f.isPublic=true;var k={};k.prvKeyObj=h;k.pubKeyObj=f;return k}else{throw new Error("unknown algorithm: "+a)}}};KEYUTIL.getPEM=function(b,D,y,m,q,j){var F=KJUR,k=F.asn1,z=k.DERObjectIdentifier,f=k.DERInteger,l=k.ASN1Util.newObject,a=k.x509,C=a.SubjectPublicKeyInfo,e=F.crypto,u=e.DSA,r=e.ECDSA,n=RSAKey;function A(s){var H=l({seq:[{"int":0},{"int":{bigint:s.n}},{"int":s.e},{"int":{bigint:s.d}},{"int":{bigint:s.p}},{"int":{bigint:s.q}},{"int":{bigint:s.dmp1}},{"int":{bigint:s.dmq1}},{"int":{bigint:s.coeff}}]});return H}function B(H){var s=l({seq:[{"int":1},{octstr:{hex:H.prvKeyHex}},{tag:["a0",true,{oid:{name:H.curveName}}]},{tag:["a1",true,{bitstr:{hex:"00"+H.pubKeyHex}}]}]});return s}function x(s){var H=l({seq:[{"int":0},{"int":{bigint:s.p}},{"int":{bigint:s.q}},{"int":{bigint:s.g}},{"int":{bigint:s.y}},{"int":{bigint:s.x}}]});return H}if(((n!==undefined&&b instanceof n)||(u!==undefined&&b instanceof u)||(r!==undefined&&b instanceof r))&&b.isPublic==true&&(D===undefined||D=="PKCS8PUB")){var E=new C(b);var w=E.tohex();return hextopem(w,"PUBLIC KEY")}if(D=="PKCS1PRV"&&n!==undefined&&b instanceof n&&(y===undefined||y==null)&&b.isPrivate==true){var E=A(b);var w=E.tohex();return hextopem(w,"RSA PRIVATE KEY")}if(D=="PKCS1PRV"&&r!==undefined&&b instanceof r&&(y===undefined||y==null)&&b.isPrivate==true){var i=new z({name:b.curveName});var v=i.tohex();var h=B(b);var t=h.tohex();var p="";p+=hextopem(v,"EC PARAMETERS");p+=hextopem(t,"EC PRIVATE KEY");return p}if(D=="PKCS1PRV"&&u!==undefined&&b instanceof u&&(y===undefined||y==null)&&b.isPrivate==true){var E=x(b);var w=E.tohex();return hextopem(w,"DSA PRIVATE KEY")}if(D=="PKCS5PRV"&&n!==undefined&&b instanceof n&&(y!==undefined&&y!=null)&&b.isPrivate==true){var E=A(b);var w=E.tohex();if(m===undefined){m="DES-EDE3-CBC"}return this.getEncryptedPKCS5PEMFromPrvKeyHex("RSA",w,y,m,j)}if(D=="PKCS5PRV"&&r!==undefined&&b instanceof r&&(y!==undefined&&y!=null)&&b.isPrivate==true){var E=B(b);var w=E.tohex();if(m===undefined){m="DES-EDE3-CBC"}return this.getEncryptedPKCS5PEMFromPrvKeyHex("EC",w,y,m,j)}if(D=="PKCS5PRV"&&u!==undefined&&b instanceof u&&(y!==undefined&&y!=null)&&b.isPrivate==true){var E=x(b);var w=E.tohex();if(m===undefined){m="DES-EDE3-CBC"}return this.getEncryptedPKCS5PEMFromPrvKeyHex("DSA",w,y,m,j)}var o=function(H,s){var J=c(H,s);var I=new l({seq:[{seq:[{oid:{name:"pkcs5PBES2"}},{seq:[{seq:[{oid:{name:"pkcs5PBKDF2"}},{seq:[{octstr:{hex:J.pbkdf2Salt}},{"int":J.pbkdf2Iter}]}]},{seq:[{oid:{name:"des-EDE3-CBC"}},{octstr:{hex:J.encryptionSchemeIV}}]}]}]},{octstr:{hex:J.ciphertext}}]});return I.tohex()};var c=function(O,P){var I=100;var N=CryptoJS.lib.WordArray.random(8);var M="DES-EDE3-CBC";var s=CryptoJS.lib.WordArray.random(8);var J=CryptoJS.PBKDF2(P,N,{keySize:192/32,iterations:I});var K=CryptoJS.enc.Hex.parse(O);var L=CryptoJS.TripleDES.encrypt(K,J,{iv:s})+"";var H={};H.ciphertext=L;H.pbkdf2Salt=CryptoJS.enc.Hex.stringify(N);H.pbkdf2Iter=I;H.encryptionSchemeAlg=M;H.encryptionSchemeIV=CryptoJS.enc.Hex.stringify(s);return H};if(D=="PKCS8PRV"&&n!=undefined&&b instanceof n&&b.isPrivate==true){var g=A(b);var d=g.tohex();var E=l({seq:[{"int":0},{seq:[{oid:{name:"rsaEncryption"}},{"null":true}]},{octstr:{hex:d}}]});var w=E.tohex();if(y===undefined||y==null){return hextopem(w,"PRIVATE KEY")}else{var t=o(w,y);return hextopem(t,"ENCRYPTED PRIVATE KEY")}}if(D=="PKCS8PRV"&&r!==undefined&&b instanceof r&&b.isPrivate==true){var G={seq:[{"int":1},{octstr:{hex:b.prvKeyHex}}]};if(typeof b.pubKeyHex=="string"){G.seq.push({tag:["a1",true,{bitstr:{hex:"00"+b.pubKeyHex}}]})}var g=new l(G);var d=g.tohex();var E=l({seq:[{"int":0},{seq:[{oid:{name:"ecPublicKey"}},{oid:{name:b.curveName}}]},{octstr:{hex:d}}]});var w=E.tohex();if(y===undefined||y==null){return hextopem(w,"PRIVATE KEY")}else{var t=o(w,y);return hextopem(t,"ENCRYPTED PRIVATE KEY")}}if(D=="PKCS8PRV"&&u!==undefined&&b instanceof u&&b.isPrivate==true){var g=new f({bigint:b.x});var d=g.tohex();var E=l({seq:[{"int":0},{seq:[{oid:{name:"dsa"}},{seq:[{"int":{bigint:b.p}},{"int":{bigint:b.q}},{"int":{bigint:b.g}}]}]},{octstr:{hex:d}}]});var w=E.tohex();if(y===undefined||y==null){return hextopem(w,"PRIVATE KEY")}else{var t=o(w,y);return hextopem(t,"ENCRYPTED PRIVATE KEY")}}throw new Error("unsupported object nor format")};KEYUTIL.getKeyFromCSRPEM=function(b){var a=pemtohex(b,"CERTIFICATE REQUEST");var c=KEYUTIL.getKeyFromCSRHex(a);return c};KEYUTIL.getKeyFromCSRHex=function(a){var c=KEYUTIL.parseCSRHex(a);var b=KEYUTIL.getKey(c.p8pubkeyhex,null,"pkcs8pub");return b};KEYUTIL.parseCSRHex=function(d){var i=ASN1HEX;var f=i.getChildIdx;var c=i.getTLV;var b={};var g=d;if(g.substr(0,2)!="30"){throw new Error("malformed CSR(code:001)")}var e=f(g,0);if(e.length<1){throw new Error("malformed CSR(code:002)")}if(g.substr(e[0],2)!="30"){throw new Error("malformed CSR(code:003)")}var a=f(g,e[0]);if(a.length<3){throw new Error("malformed CSR(code:004)")}b.p8pubkeyhex=c(g,a[2]);return b};KEYUTIL.getKeyID=function(f){var c=KEYUTIL;var e=ASN1HEX;if(typeof f==="string"&&f.indexOf("BEGIN ")!=-1){f=c.getKey(f)}var d=pemtohex(c.getPEM(f));var b=e.getIdxbyList(d,0,[1]);var a=e.getV(d,b).substring(2);return KJUR.crypto.Util.hashHex(a,"sha1")};KEYUTIL.getJWK=function(d,h,g,b,f){var i;var k={};var e;var c=KJUR.crypto.Util.hashHex;if(typeof d=="string"){i=KEYUTIL.getKey(d);if(d.indexOf("CERTIFICATE")!=-1){e=pemtohex(d)}}else{if(typeof d=="object"){if(d instanceof X509){i=d.getPublicKey();e=d.hex}else{i=d}}else{throw new Error("unsupported keyinfo type")}}if(i instanceof RSAKey&&i.isPrivate){k.kty="RSA";k.n=hextob64u(i.n.toString(16));k.e=hextob64u(i.e.toString(16));k.d=hextob64u(i.d.toString(16));k.p=hextob64u(i.p.toString(16));k.q=hextob64u(i.q.toString(16));k.dp=hextob64u(i.dmp1.toString(16));k.dq=hextob64u(i.dmq1.toString(16));k.qi=hextob64u(i.coeff.toString(16))}else{if(i instanceof RSAKey&&i.isPublic){k.kty="RSA";k.n=hextob64u(i.n.toString(16));k.e=hextob64u(i.e.toString(16))}else{if(i instanceof KJUR.crypto.ECDSA&&i.isPrivate){var a=i.getShortNISTPCurveName();if(a!=="P-256"&&a!=="P-384"&&a!=="P-521"){throw new Error("unsupported curve name for JWT: "+a)}var j=i.getPublicKeyXYHex();k.kty="EC";k.crv=a;k.x=hextob64u(j.x);k.y=hextob64u(j.y);k.d=hextob64u(i.prvKeyHex)}else{if(i instanceof KJUR.crypto.ECDSA&&i.isPublic){var a=i.getShortNISTPCurveName();if(a!=="P-256"&&a!=="P-384"&&a!=="P-521"){throw new Error("unsupported curve name for JWT: "+a)}var j=i.getPublicKeyXYHex();k.kty="EC";k.crv=a;k.x=hextob64u(j.x);k.y=hextob64u(j.y)}}}}if(k.kty==undefined){throw new Error("unsupported keyinfo")}if((!i.isPrivate)&&h!=true){k.kid=KJUR.jws.JWS.getJWKthumbprint(k)}if(e!=undefined&&g!=true){k.x5c=[hex2b64(e)]}if(e!=undefined&&b!=true){k.x5t=b64tob64u(hex2b64(c(e,"sha1")))}if(e!=undefined&&f!=true){k["x5t#S256"]=b64tob64u(hex2b64(c(e,"sha256")))}return k};KEYUTIL.getJWKFromKey=function(a){return KEYUTIL.getJWK(a,true,true,true,true)};
RSAKey.getPosArrayOfChildrenFromHex=function(a){return ASN1HEX.getChildIdx(a,0)};RSAKey.getHexValueArrayOfChildrenFromHex=function(f){var n=ASN1HEX;var i=n.getV;var k=RSAKey.getPosArrayOfChildrenFromHex(f);var e=i(f,k[0]);var j=i(f,k[1]);var b=i(f,k[2]);var c=i(f,k[3]);var h=i(f,k[4]);var g=i(f,k[5]);var m=i(f,k[6]);var l=i(f,k[7]);var d=i(f,k[8]);var k=new Array();k.push(e,j,b,c,h,g,m,l,d);return k};RSAKey.prototype.readPrivateKeyFromPEMString=function(d){var c=pemtohex(d);var b=RSAKey.getHexValueArrayOfChildrenFromHex(c);this.setPrivateEx(b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8])};RSAKey.prototype.readPKCS5PrvKeyHex=function(c){var b=RSAKey.getHexValueArrayOfChildrenFromHex(c);this.setPrivateEx(b[1],b[2],b[3],b[4],b[5],b[6],b[7],b[8])};RSAKey.prototype.readPKCS8PrvKeyHex=function(e){var c,i,k,b,a,f,d,j;var m=ASN1HEX;var l=m.getVbyListEx;if(m.isASN1HEX(e)===false){throw new Error("not ASN.1 hex string")}try{c=l(e,0,[2,0,1],"02");i=l(e,0,[2,0,2],"02");k=l(e,0,[2,0,3],"02");b=l(e,0,[2,0,4],"02");a=l(e,0,[2,0,5],"02");f=l(e,0,[2,0,6],"02");d=l(e,0,[2,0,7],"02");j=l(e,0,[2,0,8],"02")}catch(g){throw new Error("malformed PKCS#8 plain RSA private key")}this.setPrivateEx(c,i,k,b,a,f,d,j)};RSAKey.prototype.readPKCS5PubKeyHex=function(c){var e=ASN1HEX;var b=e.getV;if(e.isASN1HEX(c)===false){throw new Error("keyHex is not ASN.1 hex string")}var a=e.getChildIdx(c,0);if(a.length!==2||c.substr(a[0],2)!=="02"||c.substr(a[1],2)!=="02"){throw new Error("wrong hex for PKCS#5 public key")}var f=b(c,a[0]);var d=b(c,a[1]);this.setPublic(f,d)};RSAKey.prototype.readPKCS8PubKeyHex=function(b){var c=ASN1HEX;if(c.isASN1HEX(b)===false){throw new Error("not ASN.1 hex string")}if(c.getTLVbyListEx(b,0,[0,0])!=="06092a864886f70d010101"){throw new Error("not PKCS8 RSA public key")}var a=c.getTLVbyListEx(b,0,[1,0]);this.readPKCS5PubKeyHex(a)};RSAKey.prototype.readCertPubKeyHex=function(b,d){var a,c;a=new X509();a.readCertHex(b);c=a.getPublicKeyHex();this.readPKCS8PubKeyHex(c)};
var _RE_HEXDECONLY=new RegExp("[^0-9a-f]","gi");function _rsasign_getHexPaddedDigestInfoForString(d,e,a){var b=function(f){return KJUR.crypto.Util.hashString(f,a)};var c=b(d);return KJUR.crypto.Util.getPaddedDigestInfoHex(c,a,e)}function _zeroPaddingOfSignature(e,d){var c="";var a=d/4-e.length;for(var b=0;b<a;b++){c=c+"0"}return c+e}RSAKey.prototype.sign=function(d,a){var b=function(e){return KJUR.crypto.Util.hashString(e,a)};var c=b(d);return this.signWithMessageHash(c,a)};RSAKey.prototype.signWithMessageHash=function(e,c){var f=KJUR.crypto.Util.getPaddedDigestInfoHex(e,c,this.n.bitLength());var b=parseBigInt(f,16);var d=this.doPrivate(b);var a=d.toString(16);return _zeroPaddingOfSignature(a,this.n.bitLength())};function pss_mgf1_str(c,a,e){var b="",d=0;while(b.length<a){b+=hextorstr(e(rstrtohex(c+String.fromCharCode.apply(String,[(d&4278190080)>>24,(d&16711680)>>16,(d&65280)>>8,d&255]))));d+=1}return b}RSAKey.prototype.signPSS=function(e,a,d){var c=function(f){return KJUR.crypto.Util.hashHex(f,a)};var b=c(rstrtohex(e));if(d===undefined){d=-1}return this.signWithMessageHashPSS(b,a,d)};RSAKey.prototype.signWithMessageHashPSS=function(l,a,k){var b=hextorstr(l);var g=b.length;var m=this.n.bitLength()-1;var c=Math.ceil(m/8);var d;var o=function(i){return KJUR.crypto.Util.hashHex(i,a)};if(k===-1||k===undefined){k=g}else{if(k===-2){k=c-g-2}else{if(k<-2){throw new Error("invalid salt length")}}}if(c<(g+k+2)){throw new Error("data too long")}var f="";if(k>0){f=new Array(k);new SecureRandom().nextBytes(f);f=String.fromCharCode.apply(String,f)}var n=hextorstr(o(rstrtohex("\x00\x00\x00\x00\x00\x00\x00\x00"+b+f)));var j=[];for(d=0;d<c-k-g-2;d+=1){j[d]=0}var e=String.fromCharCode.apply(String,j)+"\x01"+f;var h=pss_mgf1_str(n,e.length,o);var q=[];for(d=0;d<e.length;d+=1){q[d]=e.charCodeAt(d)^h.charCodeAt(d)}var p=(65280>>(8*c-m))&255;q[0]&=~p;for(d=0;d<g;d++){q.push(n.charCodeAt(d))}q.push(188);return _zeroPaddingOfSignature(this.doPrivate(new BigInteger(q)).toString(16),this.n.bitLength())};function _rsasign_getDecryptSignatureBI(a,d,c){var b=new RSAKey();b.setPublic(d,c);var e=b.doPublic(a);return e}function _rsasign_getHexDigestInfoFromSig(a,c,b){var e=_rsasign_getDecryptSignatureBI(a,c,b);var d=e.toString(16).replace(/^1f+00/,"");return d}function _rsasign_getAlgNameAndHashFromHexDisgestInfo(f){for(var e in KJUR.crypto.Util.DIGESTINFOHEAD){var d=KJUR.crypto.Util.DIGESTINFOHEAD[e];var b=d.length;if(f.substring(0,b)==d){var c=[e,f.substring(b)];return c}}return[]}RSAKey.prototype.verify=function(f,l){l=l.toLowerCase();if(l.match(/^[0-9a-f]+$/)==null){return false}var b=parseBigInt(l,16);var k=this.n.bitLength();if(b.bitLength()>k){return false}var j=this.doPublic(b);var i=j.toString(16);if(i.length+3!=k/4){return false}var e=i.replace(/^1f+00/,"");var g=_rsasign_getAlgNameAndHashFromHexDisgestInfo(e);if(g.length==0){return false}var d=g[0];var h=g[1];var a=function(m){return KJUR.crypto.Util.hashString(m,d)};var c=a(f);return(h==c)};RSAKey.prototype.verifyWithMessageHash=function(e,a){if(a.length!=Math.ceil(this.n.bitLength()/4)){return false}var b=parseBigInt(a,16);if(b.bitLength()>this.n.bitLength()){return 0}var h=this.doPublic(b);var g=h.toString(16).replace(/^1f+00/,"");var c=_rsasign_getAlgNameAndHashFromHexDisgestInfo(g);if(c.length==0){return false}var d=c[0];var f=c[1];return(f==e)};RSAKey.prototype.verifyPSS=function(c,b,a,f){var e=function(g){return KJUR.crypto.Util.hashHex(g,a)};var d=e(rstrtohex(c));if(f===undefined){f=-1}return this.verifyWithMessageHashPSS(d,b,a,f)};RSAKey.prototype.verifyWithMessageHashPSS=function(f,s,l,c){if(s.length!=Math.ceil(this.n.bitLength()/4)){return false}var k=new BigInteger(s,16);var r=function(i){return KJUR.crypto.Util.hashHex(i,l)};var j=hextorstr(f);var h=j.length;var g=this.n.bitLength()-1;var m=Math.ceil(g/8);var q;if(c===-1||c===undefined){c=h}else{if(c===-2){c=m-h-2}else{if(c<-2){throw new Error("invalid salt length")}}}if(m<(h+c+2)){throw new Error("data too long")}var a=this.doPublic(k).toByteArray();for(q=0;q<a.length;q+=1){a[q]&=255}while(a.length<m){a.unshift(0)}if(a[m-1]!==188){throw new Error("encoded message does not end in 0xbc")}a=String.fromCharCode.apply(String,a);var d=a.substr(0,m-h-1);var e=a.substr(d.length,h);var p=(65280>>(8*m-g))&255;if((d.charCodeAt(0)&p)!==0){throw new Error("bits beyond keysize not zero")}var n=pss_mgf1_str(e,d.length,r);var o=[];for(q=0;q<d.length;q+=1){o[q]=d.charCodeAt(q)^n.charCodeAt(q)}o[0]&=~p;var b=m-h-c-2;for(q=0;q<b;q+=1){if(o[q]!==0){throw new Error("leftmost octets not zero")}}if(o[b]!==1){throw new Error("0x01 marker not found")}return e===hextorstr(r(rstrtohex("\x00\x00\x00\x00\x00\x00\x00\x00"+j+String.fromCharCode.apply(String,o.slice(-c)))))};RSAKey.SALT_LEN_HLEN=-1;RSAKey.SALT_LEN_MAX=-2;RSAKey.SALT_LEN_RECOVER=-2;
function X509(u){var n=ASN1HEX,r=n.getChildIdx,k=n.getV,x=n.dump,j=n.parse,b=n.getTLV,c=n.getVbyList,o=n.getVbyListEx,a=n.getTLVbyList,p=n.getTLVbyListEx,l=n.getIdxbyList,f=n.getIdxbyListEx,m=n.getVidx,w=n.getInt,t=n.oidname,q=n.hextooidstr,d=X509,v=pemtohex,g;try{g=KJUR.asn1.x509.AlgorithmIdentifier.PSSNAME2ASN1TLV}catch(s){}this.HEX2STAG={"0c":"utf8","13":"prn","16":"ia5","1a":"vis","1e":"bmp"};this.hex=null;this.version=0;this.foffset=0;this.aExtInfo=null;this.getVersion=function(){if(this.hex===null||this.version!==0){return this.version}var z=a(this.hex,0,[0,0]);if(z.substr(0,2)=="a0"){var A=a(z,0,[0]);var y=w(A,0);if(y<0||2<y){throw new Error("malformed version field")}this.version=y+1;return this.version}else{this.version=1;this.foffset=-1;return 1}};this.getSerialNumberHex=function(){return o(this.hex,0,[0,0],"02")};this.getSignatureAlgorithmField=function(){var y=p(this.hex,0,[0,1]);return this.getAlgorithmIdentifierName(y)};this.getAlgorithmIdentifierName=function(y){for(var z in g){if(y===g[z]){return z}}return t(o(y,0,[0],"06"))};this.getIssuer=function(z,y){return this.getX500Name(this.getIssuerHex(),z,y)};this.getIssuerHex=function(){return a(this.hex,0,[0,3+this.foffset],"30")};this.getIssuerString=function(){var y=this.getIssuer();return y.str};this.getSubject=function(z,y){return this.getX500Name(this.getSubjectHex(),z,y)};this.getSubjectHex=function(){return a(this.hex,0,[0,5+this.foffset],"30")};this.getSubjectString=function(){var y=this.getSubject();return y.str};this.getNotBefore=function(){var y=c(this.hex,0,[0,4+this.foffset,0]);y=y.replace(/(..)/g,"%$1");y=decodeURIComponent(y);return y};this.getNotAfter=function(){var y=c(this.hex,0,[0,4+this.foffset,1]);y=y.replace(/(..)/g,"%$1");y=decodeURIComponent(y);return y};this.getPublicKeyHex=function(){return this.getSPKI()};this.getSPKI=function(){return a(this.hex,0,[0,6+this.foffset],"30")};this.getSPKIValue=function(){var y=this.getSPKI();if(y==null){return null}return c(y,0,[1],"03",true)};this.getPublicKeyIdx=function(){return l(this.hex,0,[0,6+this.foffset],"30")};this.getPublicKeyContentIdx=function(){var y=this.getPublicKeyIdx();return l(this.hex,y,[1,0],"30")};this.getPublicKey=function(){return KEYUTIL.getKey(this.getPublicKeyHex(),null,"pkcs8pub")};this.getSignatureAlgorithmName=function(){var y=a(this.hex,0,[1],"30");return this.getAlgorithmIdentifierName(y)};this.getSignatureValueHex=function(){return c(this.hex,0,[2],"03",true)};this.verifySignature=function(A){var B=this.getSignatureAlgorithmField();var y=this.getSignatureValueHex();var z=a(this.hex,0,[0],"30");var C=new KJUR.crypto.Signature({alg:B});C.init(A);C.updateHex(z);return C.verify(y)};this.parseExt=function(H){var A,y,C;if(H===undefined){C=this.hex;if(this.version!==3){return -1}A=l(C,0,[0,7,0],"30");y=r(C,A)}else{C=pemtohex(H);var D=l(C,0,[0,3,0,0],"06");if(k(C,D)!="2a864886f70d01090e"){this.aExtInfo=new Array();return}A=l(C,0,[0,3,0,1,0],"30");y=r(C,A);this.hex=C}this.aExtInfo=new Array();for(var B=0;B<y.length;B++){var F={};F.critical=false;var E=r(C,y[B]);var z=0;if(E.length===3){F.critical=true;z=1}F.oid=n.hextooidstr(c(C,y[B],[0],"06"));var G=l(C,y[B],[1+z]);F.vidx=m(C,G);this.aExtInfo.push(F)}};this.getExtInfo=function(A){var y=this.aExtInfo;var B=A;if(!A.match(/^[0-9.]+$/)){B=KJUR.asn1.x509.OID.name2oid(A)}if(B===""){return undefined}for(var z=0;z<y.length;z++){if(y[z].oid===B){return y[z]}}return undefined};this.getExtBasicConstraints=function(z,D){if(z===undefined&&D===undefined){var B=this.getExtInfo("basicConstraints");if(B===undefined){return undefined}z=b(this.hex,B.vidx);D=B.critical}var y={extname:"basicConstraints"};if(D){y.critical=true}if(z==="3000"){return y}if(z==="30030101ff"){y.cA=true;return y}if(z.substr(0,12)==="30060101ff02"){var C=k(z,10);var A=parseInt(C,16);y.cA=true;y.pathLen=A;return y}throw new Error("hExtV parse error: "+z)};this.getExtNameConstraints=function(H,F){if(H===undefined&&F===undefined){var z=this.getExtInfo("nameConstraints");if(z===undefined){return undefined}H=b(this.hex,z.vidx);F=z.critical}var J={extname:"nameConstraints"};if(F){J.critical=true}var E=r(H,0);for(var C=0;C<E.length;C++){var D=[];var A=r(H,E[C]);for(var B=0;B<A.length;B++){var G=b(H,A[B]);var y=this.getGeneralSubtree(G);D.push(y)}var I=H.substr(E[C],2);if(I=="a0"){J.permit=D}else{if(I=="a1"){J.exclude=D}}}return J};this.getGeneralSubtree=function(E){var C=r(E,0);var B=C.length;if(B<1||2<B){throw new Error("wrong num elements")}var A=this.getGeneralName(b(E,C[0]));for(var D=1;D<B;D++){var z=E.substr(C[D],2);var y=k(E,C[D]);var F=parseInt(y,16);if(z=="80"){A.min=F}if(z=="81"){A.max=F}}return A};this.getExtKeyUsage=function(z,B){if(z===undefined&&B===undefined){var A=this.getExtInfo("keyUsage");if(A===undefined){return undefined}z=b(this.hex,A.vidx);B=A.critical}var y={extname:"keyUsage"};if(B){y.critical=true}y.names=this.getExtKeyUsageString(z).split(",");return y};this.getExtKeyUsageBin=function(z){if(z===undefined){var A=this.getExtInfo("keyUsage");if(A===undefined){return""}z=b(this.hex,A.vidx)}if(z.length!=8&&z.length!=10){throw new Error("malformed key usage value: "+z)}var y="000000000000000"+parseInt(z.substr(6),16).toString(2);if(z.length==8){y=y.slice(-8)}if(z.length==10){y=y.slice(-16)}y=y.replace(/0+$/,"");if(y==""){y="0"}return y};this.getExtKeyUsageString=function(A){var B=this.getExtKeyUsageBin(A);var y=new Array();for(var z=0;z<B.length;z++){if(B.substr(z,1)=="1"){y.push(X509.KEYUSAGE_NAME[z])}}return y.join(",")};this.getExtSubjectKeyIdentifier=function(A,C){if(A===undefined&&C===undefined){var B=this.getExtInfo("subjectKeyIdentifier");if(B===undefined){return undefined}A=b(this.hex,B.vidx);C=B.critical}var y={extname:"subjectKeyIdentifier"};if(C){y.critical=true}var z=k(A,0);y.kid={hex:z};return y};this.getExtAuthorityKeyIdentifier=function(E,C){if(E===undefined&&C===undefined){var y=this.getExtInfo("authorityKeyIdentifier");if(y===undefined){return undefined}E=b(this.hex,y.vidx);C=y.critical}var F={extname:"authorityKeyIdentifier"};if(C){F.critical=true}var D=r(E,0);for(var z=0;z<D.length;z++){var G=E.substr(D[z],2);if(G==="80"){F.kid={hex:k(E,D[z])}}if(G==="a1"){var B=b(E,D[z]);var A=this.getGeneralNames(B);F.issuer=A[0]["dn"]}if(G==="82"){F.sn={hex:k(E,D[z])}}}return F};this.getExtExtKeyUsage=function(B,D){if(B===undefined&&D===undefined){var C=this.getExtInfo("extKeyUsage");if(C===undefined){return undefined}B=b(this.hex,C.vidx);D=C.critical}var y={extname:"extKeyUsage",array:[]};if(D){y.critical=true}var z=r(B,0);for(var A=0;A<z.length;A++){y.array.push(t(k(B,z[A])))}return y};this.getExtExtKeyUsageName=function(){var C=this.getExtInfo("extKeyUsage");if(C===undefined){return C}var y=new Array();var B=b(this.hex,C.vidx);if(B===""){return y}var z=r(B,0);for(var A=0;A<z.length;A++){y.push(t(k(B,z[A])))}return y};this.getExtSubjectAltName=function(z,B){if(z===undefined&&B===undefined){var A=this.getExtInfo("subjectAltName");if(A===undefined){return undefined}z=b(this.hex,A.vidx);B=A.critical}var y={extname:"subjectAltName",array:[]};if(B){y.critical=true}y.array=this.getGeneralNames(z);return y};this.getExtIssuerAltName=function(z,B){if(z===undefined&&B===undefined){var A=this.getExtInfo("issuerAltName");if(A===undefined){return undefined}z=b(this.hex,A.vidx);B=A.critical}var y={extname:"issuerAltName",array:[]};if(B){y.critical=true}y.array=this.getGeneralNames(z);return y};this.getGeneralNames=function(C){var A=r(C,0);var y=[];for(var B=0;B<A.length;B++){var z=this.getGeneralName(b(C,A[B]));if(z!==undefined){y.push(z)}}return y};this.getGeneralName=function(z){var y=z.substr(0,2);var B=k(z,0);var A=hextorstr(B);if(y=="81"){return{rfc822:A}}if(y=="82"){return{dns:A}}if(y=="86"){return{uri:A}}if(y=="87"){return{ip:hextoip(B)}}if(y=="a4"){return{dn:this.getX500Name(B)}}if(y=="a0"){return{other:this.getOtherName(z)}}return undefined};this.getExtSubjectAltName2=function(){var C,F,E;var D=this.getExtInfo("subjectAltName");if(D===undefined){return D}var y=new Array();var B=b(this.hex,D.vidx);var z=r(B,0);for(var A=0;A<z.length;A++){E=B.substr(z[A],2);C=k(B,z[A]);if(E==="81"){F=hextoutf8(C);y.push(["MAIL",F])}if(E==="82"){F=hextoutf8(C);y.push(["DNS",F])}if(E==="84"){F=X509.hex2dn(C,0);y.push(["DN",F])}if(E==="86"){F=hextoutf8(C);y.push(["URI",F])}if(E==="87"){F=hextoip(C);y.push(["IP",F])}}return y};this.getExtCRLDistributionPoints=function(C,E){if(C===undefined&&E===undefined){var D=this.getExtInfo("cRLDistributionPoints");if(D===undefined){return undefined}C=b(this.hex,D.vidx);E=D.critical}var z={extname:"cRLDistributionPoints",array:[]};if(E){z.critical=true}var A=r(C,0);for(var B=0;B<A.length;B++){var y=b(C,A[B]);z.array.push(this.getDistributionPoint(y))}return z};this.getDistributionPoint=function(D){var A={};var B=r(D,0);for(var C=0;C<B.length;C++){var z=D.substr(B[C],2);var y=b(D,B[C]);if(z=="a0"){A.dpname=this.getDistributionPointName(y)}}return A};this.getDistributionPointName=function(D){var A={};var B=r(D,0);for(var C=0;C<B.length;C++){var z=D.substr(B[C],2);var y=b(D,B[C]);if(z=="a0"){A.full=this.getGeneralNames(y)}}return A};this.getExtCRLDistributionPointsURI=function(){var C=this.getExtCRLDistributionPoints();if(C==undefined){return C}var z=C.array;var y=[];for(var B=0;B<z.length;B++){try{if(z[B].dpname.full[0].uri!=undefined){y.push(z[B].dpname.full[0].uri)}}catch(A){}}return y};this.getExtAIAInfo=function(){var C=this.getExtInfo("authorityInfoAccess");if(C===undefined){return C}var y={ocsp:[],caissuer:[]};var z=r(this.hex,C.vidx);for(var A=0;A<z.length;A++){var D=c(this.hex,z[A],[0],"06");var B=c(this.hex,z[A],[1],"86");if(D==="2b06010505073001"){y.ocsp.push(hextoutf8(B))}if(D==="2b06010505073002"){y.caissuer.push(hextoutf8(B))}}return y};this.getExtAuthorityInfoAccess=function(F,D){if(F===undefined&&D===undefined){var y=this.getExtInfo("authorityInfoAccess");if(y===undefined){return undefined}F=b(this.hex,y.vidx);D=y.critical}var G={extname:"authorityInfoAccess",array:[]};if(D){G.critical=true}var E=r(F,0);for(var z=0;z<E.length;z++){var C=o(F,E[z],[0],"06");var A=c(F,E[z],[1],"86");var B=hextoutf8(A);if(C=="2b06010505073001"){G.array.push({ocsp:B})}else{if(C=="2b06010505073002"){G.array.push({caissuer:B})}else{throw new Error("unknown method: "+C)}}}return G};this.getExtCertificatePolicies=function(C,F){if(C===undefined&&F===undefined){var E=this.getExtInfo("certificatePolicies");if(E===undefined){return undefined}C=b(this.hex,E.vidx);F=E.critical}var y={extname:"certificatePolicies",array:[]};if(F){y.critical=true}var z=r(C,0);for(var A=0;A<z.length;A++){var D=b(C,z[A]);var B=this.getPolicyInformation(D);y.array.push(B)}return y};this.getPolicyInformation=function(C){var y={};var E=c(C,0,[0],"06");y.policyoid=t(E);var F=f(C,0,[1],"30");if(F!=-1){y.array=[];var z=r(C,F);for(var A=0;A<z.length;A++){var D=b(C,z[A]);var B=this.getPolicyQualifierInfo(D);y.array.push(B)}}return y};this.getOtherName=function(A){var y={};var z=r(A,0);var C=c(A,z[0],[],"06");var B=c(A,z[1],[]);y.oid=t(C);y.value=j(B);return y};this.getPolicyQualifierInfo=function(z){var y={};var A=c(z,0,[0],"06");if(A==="2b06010505070201"){var C=o(z,0,[1],"16");y.cps=hextorstr(C)}else{if(A==="2b06010505070202"){var B=a(z,0,[1],"30");y.unotice=this.getUserNotice(B)}}return y};this.getUserNotice=function(C){var z={};var A=r(C,0);for(var B=0;B<A.length;B++){var y=b(C,A[B]);if(y.substr(0,2)!="30"){z.exptext=this.getDisplayText(y)}}return z};this.getDisplayText=function(z){var A={"0c":"utf8","16":"ia5","1a":"vis","1e":"bmp"};var y={};y.type=A[z.substr(0,2)];y.str=hextorstr(k(z,0));return y};this.getExtCRLNumber=function(z,A){var y={extname:"cRLNumber"};if(A){y.critical=true}if(z.substr(0,2)=="02"){y.num={hex:k(z,0)};return y}throw new Error("hExtV parse error: "+z)};this.getExtCRLReason=function(z,A){var y={extname:"cRLReason"};if(A){y.critical=true}if(z.substr(0,2)=="0a"){y.code=parseInt(k(z,0),16);return y}throw new Error("hExtV parse error: "+z)};this.getExtOcspNonce=function(z,B){var y={extname:"ocspNonce"};if(B){y.critical=true}var A=k(z,0);y.hex=A;return y};this.getExtOcspNoCheck=function(z,A){var y={extname:"ocspNoCheck"};if(A){y.critical=true}return y};this.getExtAdobeTimeStamp=function(B,E){if(B===undefined&&E===undefined){var D=this.getExtInfo("adobeTimeStamp");if(D===undefined){return undefined}B=b(this.hex,D.vidx);E=D.critical}var y={extname:"adobeTimeStamp"};if(E){y.critical=true}var A=r(B,0);if(A.length>1){var F=b(B,A[1]);var z=this.getGeneralName(F);if(z.uri!=undefined){y.uri=z.uri}}if(A.length>2){var C=b(B,A[2]);if(C=="0101ff"){y.reqauth=true}if(C=="010100"){y.reqauth=false}}return y};var e=function(D){var y={};try{var A=D.seq[0].oid;var C=KJUR.asn1.x509.OID.name2oid(A);y.type=KJUR.asn1.x509.OID.oid2atype(C);var z=D.seq[1];if(z.utf8str!=undefined){y.ds="utf8";y.value=z.utf8str.str}else{if(z.numstr!=undefined){y.ds="num";y.value=z.numstr.str}else{if(z.telstr!=undefined){y.ds="tel";y.value=z.telstr.str}else{if(z.prnstr!=undefined){y.ds="prn";y.value=z.prnstr.str}else{if(z.ia5str!=undefined){y.ds="ia5";y.value=z.ia5str.str}else{if(z.visstr!=undefined){y.ds="vis";y.value=z.visstr.str}else{if(z.bmpstr!=undefined){y.ds="bmp";y.value=z.bmpstr.str}else{throw"error"}}}}}}}return y}catch(B){throw new Erorr("improper ASN.1 parsed AttrTypeAndValue")}};var i=function(z){try{return z.set.map(function(A){return e(A)})}catch(y){throw new Error("improper ASN.1 parsed RDN: "+y)}};var h=function(z){try{return z.seq.map(function(A){return i(A)})}catch(y){throw new Error("improper ASN.1 parsed X500Name: "+y)}};this.getX500NameRule=function(y){var F=true;var J=true;var I=false;var z="";var C="";var L=null;var G=[];for(var B=0;B<y.length;B++){var D=y[B];for(var A=0;A<D.length;A++){G.push(D[A])}}for(var B=0;B<G.length;B++){var K=G[B];var M=K.ds;var H=K.value;var E=K.type;z+=":"+M;if(M!="prn"&&M!="utf8"&&M!="ia5"){return"mixed"}if(M=="ia5"){if(E!="CN"){return"mixed"}else{if(!KJUR.lang.String.isMail(H)){return"mixed"}else{continue}}}if(E=="C"){if(M=="prn"){continue}else{return"mixed"}}C+=":"+M;if(L==null){L=M}else{if(L!==M){return"mixed"}}}if(L==null){return"prn"}else{return L}};this.getAttrTypeAndValue=function(y){var z=j(y);return e(z)};this.getRDN=function(y){var z=j(y);return i(z)};this.getX500NameArray=function(y){var z=j(y);return h(z)};this.getX500Name=function(B,D,C){var z=this.getX500NameArray(B);var A=this.dnarraytostr(z);var y={str:A};y.array=z;if(C==true){y.hex=B}if(D==true){y.canon=this.c14nRDNArray(z)}return y};this.readCertPEM=function(y){this.readCertHex(v(y))};this.readCertHex=function(y){this.hex=y;this.getVersion();try{l(this.hex,0,[0,7],"a3");this.parseExt()}catch(z){}};this.getParam=function(z){var y={};if(z==undefined){z={}}y.version=this.getVersion();y.serial={hex:this.getSerialNumberHex()};y.sigalg=this.getSignatureAlgorithmField();y.issuer=this.getIssuer(z.dncanon,z.dnhex);y.notbefore=this.getNotBefore();y.notafter=this.getNotAfter();y.subject=this.getSubject(z.dncanon,z.dnhex);y.sbjpubkey=hextopem(this.getPublicKeyHex(),"PUBLIC KEY");if(this.aExtInfo!=undefined&&this.aExtInfo.length>0){y.ext=this.getExtParamArray()}y.sighex=this.getSignatureValueHex();if(z.tbshex==true){y.tbshex=a(this.hex,0,[0])}if(z.nodnarray==true){delete y.issuer.array;delete y.subject.array}return y};this.getExtParamArray=function(z){if(z==undefined){var B=f(this.hex,0,[0,"[3]"]);if(B!=-1){z=p(this.hex,0,[0,"[3]",0],"30")}}var y=[];var A=r(z,0);for(var C=0;C<A.length;C++){var E=b(z,A[C]);var D=this.getExtParam(E);if(D!=null){y.push(D)}}return y};this.getExtParam=function(z){var G={};var B=r(z,0);var C=B.length;if(C!=2&&C!=3){throw new Error("wrong number elements in Extension: "+C+" "+z)}var A=q(c(z,0,[0],"06"));var E=false;if(C==3&&a(z,0,[1])=="0101ff"){E=true}var F=a(z,0,[C-1,0]);var D=undefined;if(A=="2.5.29.14"){D=this.getExtSubjectKeyIdentifier(F,E)}else{if(A=="2.5.29.15"){D=this.getExtKeyUsage(F,E)}else{if(A=="2.5.29.17"){D=this.getExtSubjectAltName(F,E)}else{if(A=="2.5.29.18"){D=this.getExtIssuerAltName(F,E)}else{if(A=="2.5.29.19"){D=this.getExtBasicConstraints(F,E)}else{if(A=="2.5.29.30"){D=this.getExtNameConstraints(F,E)}else{if(A=="2.5.29.31"){D=this.getExtCRLDistributionPoints(F,E)}else{if(A=="2.5.29.32"){D=this.getExtCertificatePolicies(F,E)}else{if(A=="2.5.29.35"){D=this.getExtAuthorityKeyIdentifier(F,E)}else{if(A=="2.5.29.37"){D=this.getExtExtKeyUsage(F,E)}else{if(A=="1.3.6.1.5.5.7.1.1"){D=this.getExtAuthorityInfoAccess(F,E)}else{if(A=="2.5.29.20"){D=this.getExtCRLNumber(F,E)}else{if(A=="2.5.29.21"){D=this.getExtCRLReason(F,E)}else{if(A=="1.3.6.1.5.5.7.48.1.2"){D=this.getExtOcspNonce(F,E)}else{if(A=="1.3.6.1.5.5.7.48.1.5"){D=this.getExtOcspNoCheck(F,E)}else{if(A=="1.2.840.113583.1.1.9.1"){D=this.getExtAdobeTimeStamp(F,E)}}}}}}}}}}}}}}}}if(D!=undefined){return D}var y={extname:A,extn:F};if(E){y.critical=true}return y};this.findExt=function(z,A){for(var y=0;y<z.length;y++){if(z[y].extname==A){return z[y]}}return null};this.updateExtCDPFullURI=function(C,y){var B=this.findExt(C,"cRLDistributionPoints");if(B==null){return}if(B.array==undefined){return}var E=B.array;for(var A=0;A<E.length;A++){if(E[A].dpname==undefined){continue}if(E[A].dpname.full==undefined){continue}var F=E[A].dpname.full;for(var z=0;z<F.length;z++){var D=F[A];if(D.uri==undefined){continue}D.uri=y}}};this.updateExtAIAOCSP=function(C,z){var B=this.findExt(C,"authorityInfoAccess");if(B==null){return}if(B.array==undefined){return}var y=B.array;for(var A=0;A<y.length;A++){if(y[A].ocsp!=undefined){y[A].ocsp=z}}};this.updateExtAIACAIssuer=function(C,z){var B=this.findExt(C,"authorityInfoAccess");if(B==null){return}if(B.array==undefined){return}var y=B.array;for(var A=0;A<y.length;A++){if(y[A].caissuer!=undefined){y[A].caissuer=z}}};this.dnarraytostr=function(A){function y(B){return B.map(function(C){return z(C).replace(/\+/,"\\+")}).join("+")}function z(B){return B.type+"="+B.value}return"/"+A.map(function(B){return y(B).replace(/\//,"\\/")}).join("/")};this.setCanonicalizedDN=function(z){var B;if(z.str!=undefined&&z.array==undefined){var A=new KJUR.asn1.x509.X500Name({str:z.str});var y=A.tohex();B=this.getX500NameArray(y)}else{B=z.array}if(z.canon==undefined){z.canon=this.c14nRDNArray(B)}};this.c14nRDNArray=function(F){var z=[];for(var B=0;B<F.length;B++){var D=F[B];var y=[];for(var A=0;A<D.length;A++){var C=D[A];var E=C.value;E=E.replace(/^\s*/,"");E=E.replace(/\s*$/,"");E=E.replace(/\s+/g," ");E=E.toLowerCase();y.push(C.type.toLowerCase()+"="+E)}z.push(y.join("+"))}return"/"+z.join("/")};this.getInfo=function(){var z=function(S){var Y="";var Q="    ";var U="\n";var V=S.array;for(var T=0;T<V.length;T++){var R=V[T];if(R.dn!=undefined){Y+=Q+"dn: "+R.dn.str+U}if(R.ip!=undefined){Y+=Q+"ip: "+R.ip+U}if(R.rfc822!=undefined){Y+=Q+"rfc822: "+R.rfc822+U}if(R.dns!=undefined){Y+=Q+"dns: "+R.dns+U}if(R.uri!=undefined){Y+=Q+"uri: "+R.uri+U}if(R.other!=undefined){var X=R.other.oid;var W=JSON.stringify(R.other.value).replace(/\"/g,"");Y+=Q+"other: "+X+"="+W+U}}Y=Y.replace(/\n$/,"");return Y};var F=function(W){var U="";var Q=W.array;for(var T=0;T<Q.length;T++){var V=Q[T];U+="    policy oid: "+V.policyoid+"\n";if(V.array===undefined){continue}for(var S=0;S<V.array.length;S++){var R=V.array[S];if(R.cps!==undefined){U+="    cps: "+R.cps+"\n"}}}return U};var I=function(U){var T="";var Q=U.array;for(var S=0;S<Q.length;S++){var V=Q[S];try{if(V.dpname.full[0].uri!==undefined){T+="    "+V.dpname.full[0].uri+"\n"}}catch(R){}try{if(V.dname.full[0].dn.hex!==undefined){T+="    "+X509.hex2dn(V.dpname.full[0].dn.hex)+"\n"}}catch(R){}}return T};var G=function(U){var T="";var Q=U.array;for(var R=0;R<Q.length;R++){var S=Q[R];if(S.caissuer!==undefined){T+="    caissuer: "+S.caissuer+"\n"}if(S.ocsp!==undefined){T+="    ocsp: "+S.ocsp+"\n"}}return T};var A=X509;var K,J,P;K="Basic Fields\n";K+="  serial number: "+this.getSerialNumberHex()+"\n";K+="  signature algorithm: "+this.getSignatureAlgorithmField()+"\n";K+="  issuer: "+this.getIssuerString()+"\n";K+="  notBefore: "+this.getNotBefore()+"\n";K+="  notAfter: "+this.getNotAfter()+"\n";K+="  subject: "+this.getSubjectString()+"\n";K+="  subject public key info: \n";J=this.getPublicKey();K+="    key algorithm: "+J.type+"\n";if(J.type==="RSA"){K+="    n="+hextoposhex(J.n.toString(16)).substr(0,16)+"...\n";K+="    e="+hextoposhex(J.e.toString(16))+"\n"}P=this.aExtInfo;if(P!==undefined&&P!==null){K+="X509v3 Extensions:\n";for(var M=0;M<P.length;M++){var O=P[M];var y=KJUR.asn1.x509.OID.oid2name(O.oid);if(y===""){y=O.oid}var L="";if(O.critical===true){L="CRITICAL"}K+="  "+y+" "+L+":\n";if(y==="basicConstraints"){var B=this.getExtBasicConstraints();if(B.cA===undefined){K+="    {}\n"}else{K+="    cA=true";if(B.pathLen!==undefined){K+=", pathLen="+B.pathLen}K+="\n"}}else{if(y==="keyUsage"){K+="    "+this.getExtKeyUsageString()+"\n"}else{if(y==="subjectKeyIdentifier"){K+="    "+this.getExtSubjectKeyIdentifier().kid.hex+"\n"}else{if(y==="authorityKeyIdentifier"){var C=this.getExtAuthorityKeyIdentifier();if(C.kid!==undefined){K+="    kid="+C.kid.hex+"\n"}}else{if(y==="extKeyUsage"){var N=this.getExtExtKeyUsage().array;K+="    "+N.join(", ")+"\n"}else{if(y==="subjectAltName"){var D=z(this.getExtSubjectAltName());K+=D+"\n"}else{if(y==="cRLDistributionPoints"){var H=this.getExtCRLDistributionPoints();K+=I(H)}else{if(y==="authorityInfoAccess"){var E=this.getExtAuthorityInfoAccess();K+=G(E)}else{if(y==="certificatePolicies"){K+=F(this.getExtCertificatePolicies())}}}}}}}}}}}K+="signature algorithm: "+this.getSignatureAlgorithmName()+"\n";K+="signature: "+this.getSignatureValueHex().substr(0,16)+"...\n";return K};if(typeof u=="string"){if(u.indexOf("-----BEGIN")!=-1){this.readCertPEM(u)}else{if(KJUR.lang.String.isHex(u)){this.readCertHex(u)}}}}X509.hex2dn=function(e,b){if(b===undefined){b=0}var a=new X509();var c=ASN1HEX.getTLV(e,b);var d=a.getX500Name(e);return d.str};X509.hex2rdn=function(f,b){if(b===undefined){b=0}if(f.substr(b,2)!=="31"){throw new Error("malformed RDN")}var c=new Array();var d=ASN1HEX.getChildIdx(f,b);for(var e=0;e<d.length;e++){c.push(X509.hex2attrTypeValue(f,d[e]))}c=c.map(function(a){return a.replace("+","\\+")});return c.join("+")};X509.hex2attrTypeValue=function(d,i){var j=ASN1HEX;var h=j.getV;if(i===undefined){i=0}if(d.substr(i,2)!=="30"){throw new Error("malformed attribute type and value")}var g=j.getChildIdx(d,i);if(g.length!==2||d.substr(g[0],2)!=="06"){"malformed attribute type and value"}var b=h(d,g[0]);var f=KJUR.asn1.ASN1Util.oidHexToInt(b);var e=KJUR.asn1.x509.OID.oid2atype(f);var a=h(d,g[1]);var c=hextorstr(a);return e+"="+c};X509.getPublicKeyFromCertHex=function(b){var a=new X509();a.readCertHex(b);return a.getPublicKey()};X509.getPublicKeyFromCertPEM=function(b){var a=new X509();a.readCertPEM(b);return a.getPublicKey()};X509.getPublicKeyInfoPropOfCertPEM=function(c){var e=ASN1HEX;var g=e.getVbyList;var b={};var a,f,d;b.algparam=null;a=new X509();a.readCertPEM(c);f=a.getPublicKeyHex();b.keyhex=g(f,0,[1],"03").substr(2);b.algoid=g(f,0,[0,0],"06");if(b.algoid==="2a8648ce3d0201"){b.algparam=g(f,0,[0,1],"06")}return b};X509.KEYUSAGE_NAME=["digitalSignature","nonRepudiation","keyEncipherment","dataEncipherment","keyAgreement","keyCertSign","cRLSign","encipherOnly","decipherOnly"];
var X509CRL=function(e){var a=KJUR,f=a.lang.String.isHex,m=ASN1HEX,k=m.getV,b=m.getTLV,h=m.getVbyList,c=m.getTLVbyList,d=m.getTLVbyListEx,i=m.getIdxbyList,g=m.getIdxbyListEx,l=m.getChildIdx,j=new X509();this.hex=null;this.posSigAlg=null;this.posRevCert=null;this.parsed=null;this._setPos=function(){var o=i(this.hex,0,[0,0]);var n=this.hex.substr(o,2);if(n=="02"){this.posSigAlg=1}else{if(n=="30"){this.posSigAlg=0}else{throw new Error("malformed 1st item of TBSCertList: "+n)}}var s=i(this.hex,0,[0,this.posSigAlg+3]);var r=this.hex.substr(s,2);if(r=="17"||r=="18"){var q,p;q=i(this.hex,0,[0,this.posSigAlg+4]);this.posRevCert=null;if(q!=-1){p=this.hex.substr(q,2);if(p=="30"){this.posRevCert=this.posSigAlg+4}}}else{if(r=="30"){this.posRevCert=this.posSigAlg+3}else{if(r=="a0"){this.posRevCert=null}else{throw new Error("malformed nextUpdate or revCert tag: "+r)}}}};this.getVersion=function(){if(this.posSigAlg==0){return null}return parseInt(h(this.hex,0,[0,0],"02"),16)+1};this.getSignatureAlgorithmField=function(){var n=c(this.hex,0,[0,this.posSigAlg],"30");return j.getAlgorithmIdentifierName(n)};this.getIssuer=function(){return j.getX500Name(this.getIssuerHex())};this.getIssuerHex=function(){return c(this.hex,0,[0,this.posSigAlg+1],"30")};this.getThisUpdate=function(){var n=h(this.hex,0,[0,this.posSigAlg+2]);return result=hextorstr(n)};this.getNextUpdate=function(){var o=i(this.hex,0,[0,this.posSigAlg+3]);var n=this.hex.substr(o,2);if(n!="17"&&n!="18"){return null}return hextorstr(k(this.hex,o))};this.getRevCertArray=function(){if(this.posRevCert==null){return null}var o=[];var n=i(this.hex,0,[0,this.posRevCert]);var p=l(this.hex,n);for(var q=0;q<p.length;q++){var r=b(this.hex,p[q]);o.push(this.getRevCert(r))}return o};this.getRevCert=function(p){var o={};var n=l(p,0);o.sn={hex:h(p,0,[0],"02")};o.date=hextorstr(h(p,0,[1]));if(n.length==3){o.ext=j.getExtParamArray(c(p,0,[2]))}return o};this.findRevCert=function(p){var n=new X509(p);var o=n.getSerialNumberHex();return this.findRevCertBySN(o)};this.findRevCertBySN=function(o){if(this.parsed==null){this.getParam()}if(this.parsed.revcert==null){return null}var n=this.parsed.revcert;for(var p=0;p<n.length;p++){if(o==n[p].sn.hex){return n[p]}}return null};this.getSignatureValueHex=function(){return h(this.hex,0,[2],"03",true)};this.verifySignature=function(o){var p=this.getSignatureAlgorithmField();var n=this.getSignatureValueHex();var q=c(this.hex,0,[0],"30");var r=new KJUR.crypto.Signature({alg:p});r.init(o);r.updateHex(q);return r.verify(n)};this.getParam=function(r){var n={};var p=this.getVersion();if(p!=null){n.version=p}n.sigalg=this.getSignatureAlgorithmField();n.issuer=this.getIssuer();n.thisupdate=this.getThisUpdate();var q=this.getNextUpdate();if(q!=null){n.nextupdate=q}var t=this.getRevCertArray();if(t!=null){n.revcert=t}var s=g(this.hex,0,[0,"[0]"]);if(s!=-1){var o=d(this.hex,0,[0,"[0]",0]);n.ext=j.getExtParamArray(o)}n.sighex=this.getSignatureValueHex();this.parsed=n;if(typeof r=="object"){if(r.tbshex==true){n.tbshex=c(this.hex,0,[0])}if(r.nodnarray==true){delete n.issuer.array}}return n};if(typeof e=="string"){if(f(e)){this.hex=e}else{if(e.match(/-----BEGIN X509 CRL/)){this.hex=pemtohex(e)}}this._setPos()}};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.jws=="undefined"||!KJUR.jws){KJUR.jws={}}KJUR.jws.JWS=function(){var b=KJUR,a=b.jws.JWS,c=a.isSafeJSONString;this.parseJWS=function(g,j){if((this.parsedJWS!==undefined)&&(j||(this.parsedJWS.sigvalH!==undefined))){return}var i=g.match(/^([^.]+)\.([^.]+)\.([^.]+)$/);if(i==null){throw"JWS signature is not a form of 'Head.Payload.SigValue'."}var k=i[1];var e=i[2];var l=i[3];var n=k+"."+e;this.parsedJWS={};this.parsedJWS.headB64U=k;this.parsedJWS.payloadB64U=e;this.parsedJWS.sigvalB64U=l;this.parsedJWS.si=n;if(!j){var h=b64utohex(l);var f=parseBigInt(h,16);this.parsedJWS.sigvalH=h;this.parsedJWS.sigvalBI=f}var d=b64utoutf8(k);var m=b64utoutf8(e);this.parsedJWS.headS=d;this.parsedJWS.payloadS=m;if(!c(d,this.parsedJWS,"headP")){throw"malformed JSON string for JWS Head: "+d}}};KJUR.jws.JWS.sign=function(j,w,z,A,a){var x=KJUR,n=x.jws,r=n.JWS,h=r.readSafeJSONString,q=r.isSafeJSONString,d=x.crypto,l=d.ECDSA,p=d.Mac,c=d.Signature,u=JSON;var t,k,o;if(typeof w!="string"&&typeof w!="object"){throw"spHeader must be JSON string or object: "+w}if(typeof w=="object"){k=w;t=u.stringify(k)}if(typeof w=="string"){t=w;if(!q(t)){throw"JWS Head is not safe JSON string: "+t}k=h(t)}o=z;if(typeof z=="object"){o=u.stringify(z)}if((j==""||j==null)&&k.alg!==undefined){j=k.alg}if((j!=""&&j!=null)&&k.alg===undefined){k.alg=j;t=u.stringify(k)}if(j!==k.alg){throw"alg and sHeader.alg doesn't match: "+j+"!="+k.alg}var s=null;if(r.jwsalg2sigalg[j]===undefined){throw"unsupported alg name: "+j}else{s=r.jwsalg2sigalg[j]}var e=utf8tob64u(t);var m=utf8tob64u(o);var b=e+"."+m;var y="";if(s.substr(0,4)=="Hmac"){if(A===undefined){throw"mac key shall be specified for HS* alg"}var i=new p({alg:s,prov:"cryptojs",pass:A});i.updateString(b);y=i.doFinal()}else{if(s.indexOf("withECDSA")!=-1){var f=new c({alg:s});f.init(A,a);f.updateString(b);var g=f.sign();y=KJUR.crypto.ECDSA.asn1SigToConcatSig(g)}else{if(s!="none"){var f=new c({alg:s});f.init(A,a);f.updateString(b);y=f.sign()}}}var v=hextob64u(y);return b+"."+v};KJUR.jws.JWS.verify=function(w,B,n){var x=KJUR,q=x.jws,t=q.JWS,i=t.readSafeJSONString,e=x.crypto,p=e.ECDSA,s=e.Mac,d=e.Signature,m;if(typeof RSAKey!==undefined){m=RSAKey}if(!isBase64URLDot(w)){return false}var y=w.split(".");if(y.length!==3){return false}var f=y[0];var r=y[1];var c=f+"."+r;var A=b64utohex(y[2]);var l=i(b64utoutf8(y[0]));var k=null;var z=null;if(l.alg===undefined){throw"algorithm not specified in header"}else{k=l.alg;z=k.substr(0,2)}if(n!=null&&Object.prototype.toString.call(n)==="[object Array]"&&n.length>0){var b=":"+n.join(":")+":";if(b.indexOf(":"+k+":")==-1){throw"algorithm '"+k+"' not accepted in the list"}}if(k!="none"&&B===null){throw"key shall be specified to verify."}if(typeof B=="string"&&B.indexOf("-----BEGIN ")!=-1){B=KEYUTIL.getKey(B)}if(z=="RS"||z=="PS"){if(!(B instanceof m)){throw"key shall be a RSAKey obj for RS* and PS* algs"}}if(z=="ES"){if(!(B instanceof p)){throw"key shall be a ECDSA obj for ES* algs"}}if(k=="none"){}var u=null;if(t.jwsalg2sigalg[l.alg]===undefined){throw"unsupported alg name: "+k}else{u=t.jwsalg2sigalg[k]}if(u=="none"){throw"not supported"}else{if(u.substr(0,4)=="Hmac"){var o=null;if(B===undefined){throw"hexadecimal key shall be specified for HMAC"}var j=new s({alg:u,pass:B});j.updateString(c);o=j.doFinal();return A==o}else{if(u.indexOf("withECDSA")!=-1){var h=null;try{h=p.concatSigToASN1Sig(A)}catch(v){return false}var g=new d({alg:u});g.init(B);g.updateString(c);return g.verify(h)}else{var g=new d({alg:u});g.init(B);g.updateString(c);return g.verify(A)}}}};KJUR.jws.JWS.parse=function(g){var c=g.split(".");var b={};var f,e,d;if(c.length!=2&&c.length!=3){throw"malformed sJWS: wrong number of '.' splitted elements"}f=c[0];e=c[1];if(c.length==3){d=c[2]}b.headerObj=KJUR.jws.JWS.readSafeJSONString(b64utoutf8(f));b.payloadObj=KJUR.jws.JWS.readSafeJSONString(b64utoutf8(e));b.headerPP=JSON.stringify(b.headerObj,null,"  ");if(b.payloadObj==null){b.payloadPP=b64utoutf8(e)}else{b.payloadPP=JSON.stringify(b.payloadObj,null,"  ")}if(d!==undefined){b.sigHex=b64utohex(d)}return b};KJUR.jws.JWS.verifyJWT=function(e,l,r){var d=KJUR,j=d.jws,o=j.JWS,n=o.readSafeJSONString,p=o.inArray,f=o.includedArray;if(!isBase64URLDot(e)){return false}var k=e.split(".");if(k.length!=3){return false}var c=k[0];var i=k[1];var q=c+"."+i;var m=b64utohex(k[2]);var h=n(b64utoutf8(c));var g=n(b64utoutf8(i));if(h.alg===undefined){return false}if(r.alg===undefined){throw"acceptField.alg shall be specified"}if(!p(h.alg,r.alg)){return false}if(g.iss!==undefined&&typeof r.iss==="object"){if(!p(g.iss,r.iss)){return false}}if(g.sub!==undefined&&typeof r.sub==="object"){if(!p(g.sub,r.sub)){return false}}if(g.aud!==undefined&&typeof r.aud==="object"){if(typeof g.aud=="string"){if(!p(g.aud,r.aud)){return false}}else{if(typeof g.aud=="object"){if(!f(g.aud,r.aud)){return false}}}}var b=j.IntDate.getNow();if(r.verifyAt!==undefined&&typeof r.verifyAt==="number"){b=r.verifyAt}if(r.gracePeriod===undefined||typeof r.gracePeriod!=="number"){r.gracePeriod=0}if(g.exp!==undefined&&typeof g.exp=="number"){if(g.exp+r.gracePeriod<b){return false}}if(g.nbf!==undefined&&typeof g.nbf=="number"){if(b<g.nbf-r.gracePeriod){return false}}if(g.iat!==undefined&&typeof g.iat=="number"){if(b<g.iat-r.gracePeriod){return false}}if(g.jti!==undefined&&r.jti!==undefined){if(g.jti!==r.jti){return false}}if(!o.verify(e,l,r.alg)){return false}return true};KJUR.jws.JWS.includedArray=function(b,a){var c=KJUR.jws.JWS.inArray;if(b===null){return false}if(typeof b!=="object"){return false}if(typeof b.length!=="number"){return false}for(var d=0;d<b.length;d++){if(!c(b[d],a)){return false}}return true};KJUR.jws.JWS.inArray=function(d,b){if(b===null){return false}if(typeof b!=="object"){return false}if(typeof b.length!=="number"){return false}for(var c=0;c<b.length;c++){if(b[c]==d){return true}}return false};KJUR.jws.JWS.jwsalg2sigalg={HS256:"HmacSHA256",HS384:"HmacSHA384",HS512:"HmacSHA512",RS256:"SHA256withRSA",RS384:"SHA384withRSA",RS512:"SHA512withRSA",ES256:"SHA256withECDSA",ES384:"SHA384withECDSA",ES512:"SHA512withECDSA",PS256:"SHA256withRSAandMGF1",PS384:"SHA384withRSAandMGF1",PS512:"SHA512withRSAandMGF1",none:"none",};KJUR.jws.JWS.isSafeJSONString=function(c,b,d){var e=null;try{e=jsonParse(c);if(typeof e!="object"){return 0}if(e.constructor===Array){return 0}if(b){b[d]=e}return 1}catch(a){return 0}};KJUR.jws.JWS.readSafeJSONString=function(b){var c=null;try{c=jsonParse(b);if(typeof c!="object"){return null}if(c.constructor===Array){return null}return c}catch(a){return null}};KJUR.jws.JWS.getEncodedSignatureValueFromJWS=function(b){var a=b.match(/^[^.]+\.[^.]+\.([^.]+)$/);if(a==null){throw"JWS signature is not a form of 'Head.Payload.SigValue'."}return a[1]};KJUR.jws.JWS.getJWKthumbprint=function(d){if(d.kty!=="RSA"&&d.kty!=="EC"&&d.kty!=="oct"){throw"unsupported algorithm for JWK Thumprint"}var a="{";if(d.kty==="RSA"){if(typeof d.n!="string"||typeof d.e!="string"){throw"wrong n and e value for RSA key"}a+='"e":"'+d.e+'",';a+='"kty":"'+d.kty+'",';a+='"n":"'+d.n+'"}'}else{if(d.kty==="EC"){if(typeof d.crv!="string"||typeof d.x!="string"||typeof d.y!="string"){throw"wrong crv, x and y value for EC key"}a+='"crv":"'+d.crv+'",';a+='"kty":"'+d.kty+'",';a+='"x":"'+d.x+'",';a+='"y":"'+d.y+'"}'}else{if(d.kty==="oct"){if(typeof d.k!="string"){throw"wrong k value for oct(symmetric) key"}a+='"kty":"'+d.kty+'",';a+='"k":"'+d.k+'"}'}}}var b=rstrtohex(a);var c=KJUR.crypto.Util.hashHex(b,"sha256");var e=hextob64u(c);return e};KJUR.jws.IntDate={};KJUR.jws.IntDate.get=function(c){var b=KJUR.jws.IntDate,d=b.getNow,a=b.getZulu;if(c=="now"){return d()}else{if(c=="now + 1hour"){return d()+60*60}else{if(c=="now + 1day"){return d()+60*60*24}else{if(c=="now + 1month"){return d()+60*60*24*30}else{if(c=="now + 1year"){return d()+60*60*24*365}else{if(c.match(/Z$/)){return a(c)}else{if(c.match(/^[0-9]+$/)){return parseInt(c)}}}}}}}throw"unsupported format: "+c};KJUR.jws.IntDate.getZulu=function(a){return zulutosec(a)};KJUR.jws.IntDate.getNow=function(){var a=~~(new Date()/1000);return a};KJUR.jws.IntDate.intDate2UTCString=function(a){var b=new Date(a*1000);return b.toUTCString()};KJUR.jws.IntDate.intDate2Zulu=function(e){var i=new Date(e*1000),h=("0000"+i.getUTCFullYear()).slice(-4),g=("00"+(i.getUTCMonth()+1)).slice(-2),b=("00"+i.getUTCDate()).slice(-2),a=("00"+i.getUTCHours()).slice(-2),c=("00"+i.getUTCMinutes()).slice(-2),f=("00"+i.getUTCSeconds()).slice(-2);return h+g+b+a+c+f+"Z"};
if(typeof KJUR=="undefined"||!KJUR){KJUR={}}if(typeof KJUR.jws=="undefined"||!KJUR.jws){KJUR.jws={}}KJUR.jws.JWSJS=function(){var c=KJUR,b=c.jws,a=b.JWS,d=a.readSafeJSONString;this.aHeader=[];this.sPayload="";this.aSignature=[];this.init=function(){this.aHeader=[];this.sPayload=undefined;this.aSignature=[]};this.initWithJWS=function(f){this.init();var e=f.split(".");if(e.length!=3){throw"malformed input JWS"}this.aHeader.push(e[0]);this.sPayload=e[1];this.aSignature.push(e[2])};this.addSignature=function(e,h,m,k){if(this.sPayload===undefined||this.sPayload===null){throw"there's no JSON-JS signature to add."}var l=this.aHeader.length;if(this.aHeader.length!=this.aSignature.length){throw"aHeader.length != aSignature.length"}try{var f=KJUR.jws.JWS.sign(e,h,this.sPayload,m,k);var j=f.split(".");var n=j[0];var g=j[2];this.aHeader.push(j[0]);this.aSignature.push(j[2])}catch(i){if(this.aHeader.length>l){this.aHeader.pop()}if(this.aSignature.length>l){this.aSignature.pop()}throw"addSignature failed: "+i}};this.verifyAll=function(h){if(this.aHeader.length!==h.length||this.aSignature.length!==h.length){return false}for(var g=0;g<h.length;g++){var f=h[g];if(f.length!==2){return false}var e=this.verifyNth(g,f[0],f[1]);if(e===false){return false}}return true};this.verifyNth=function(f,j,g){if(this.aHeader.length<=f||this.aSignature.length<=f){return false}var h=this.aHeader[f];var k=this.aSignature[f];var l=h+"."+this.sPayload+"."+k;var e=false;try{e=a.verify(l,j,g)}catch(i){return false}return e};this.readJWSJS=function(g){if(typeof g==="string"){var f=d(g);if(f==null){throw"argument is not safe JSON object string"}this.aHeader=f.headers;this.sPayload=f.payload;this.aSignature=f.signatures}else{try{if(g.headers.length>0){this.aHeader=g.headers}else{throw"malformed header"}if(typeof g.payload==="string"){this.sPayload=g.payload}else{throw"malformed signatures"}if(g.signatures.length>0){this.aSignature=g.signatures}else{throw"malformed signatures"}}catch(e){throw"malformed JWS-JS JSON object: "+e}}};this.getJSON=function(){return{headers:this.aHeader,payload:this.sPayload,signatures:this.aSignature}};this.isEmpty=function(){if(this.aHeader.length==0){return 1}return 0}};
exports.SecureRandom = SecureRandom;
exports.rng_seed_time = rng_seed_time;

exports.BigInteger = BigInteger;
exports.RSAKey = RSAKey;
exports.ECDSA = KJUR.crypto.ECDSA;
exports.DSA = KJUR.crypto.DSA;
exports.Signature = KJUR.crypto.Signature;
exports.MessageDigest = KJUR.crypto.MessageDigest;
exports.Mac = KJUR.crypto.Mac;
exports.Cipher = KJUR.crypto.Cipher;
exports.KEYUTIL = KEYUTIL;
exports.ASN1HEX = ASN1HEX;
exports.X509 = X509;
exports.X509CRL = X509CRL;
exports.CryptoJS = CryptoJS;

// ext/base64.js
exports.b64tohex = b64tohex;
exports.b64toBA = b64toBA;

// ext/ec*.js
exports.ECFieldElementFp = ECFieldElementFp;
exports.ECPointFp = ECPointFp;
exports.ECCurveFp = ECCurveFp;

// base64x.js
exports.stoBA = stoBA;
exports.BAtos = BAtos;
exports.BAtohex = BAtohex;
exports.stohex = stohex;
exports.stob64 = stob64;
exports.stob64u = stob64u;
exports.b64utos = b64utos;
exports.b64tob64u = b64tob64u;
exports.b64utob64 = b64utob64;
exports.hex2b64 = hex2b64;
exports.hextob64u = hextob64u;
exports.b64utohex = b64utohex;
exports.utf8tob64u = utf8tob64u;
exports.b64utoutf8 = b64utoutf8;
exports.utf8tob64 = utf8tob64;
exports.b64toutf8 = b64toutf8;
exports.utf8tohex = utf8tohex;
exports.hextoutf8 = hextoutf8;
exports.hextorstr = hextorstr;
exports.rstrtohex = rstrtohex;
exports.hextob64 = hextob64;
exports.hextob64nl = hextob64nl;
exports.b64nltohex = b64nltohex;
exports.hextopem = hextopem;
exports.pemtohex = pemtohex;
exports.hextoArrayBuffer = hextoArrayBuffer;
exports.ArrayBuffertohex = ArrayBuffertohex;
exports.zulutomsec = zulutomsec;
exports.zulutosec = zulutosec;
exports.zulutodate = zulutodate;
exports.datetozulu = datetozulu;
exports.uricmptohex = uricmptohex;
exports.hextouricmp = hextouricmp;
exports.ipv6tohex = ipv6tohex;
exports.hextoipv6 = hextoipv6;
exports.hextoip = hextoip;
exports.iptohex = iptohex;
exports.ucs2hextoutf8 = ucs2hextoutf8;
exports.encodeURIComponentAll = encodeURIComponentAll;
exports.newline_toUnix = newline_toUnix;
exports.newline_toDos = newline_toDos;
exports.hextoposhex = hextoposhex;
exports.intarystrtohex = intarystrtohex;
exports.strdiffidx = strdiffidx;
exports.oidtohex = oidtohex;
exports.hextooid = hextooid;
exports.strpad = strpad;
exports.bitstrtoint = bitstrtoint;
exports.inttobitstr = inttobitstr;
exports.bitstrtobinstr = bitstrtobinstr;
exports.binstrtobitstr = binstrtobitstr;
exports.isBase64URLDot = isBase64URLDot;
exports.namearraytobinstr = namearraytobinstr;
exports.extendClass = extendClass;

// name spaces
exports.KJUR = KJUR;
exports.crypto = KJUR.crypto;
exports.asn1 = KJUR.asn1;
exports.jws = KJUR.jws;
exports.lang = KJUR.lang;



}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":3}],38:[function(require,module,exports){
module.exports = assert;

function assert(val, msg) {
  if (!val)
    throw new Error(msg || 'Assertion failed');
}

assert.equal = function assertEqual(l, r, msg) {
  if (l != r)
    throw new Error(msg || ('Assertion failed: ' + l + ' != ' + r));
};

},{}],39:[function(require,module,exports){
'use strict';

var utils = exports;

function toArray(msg, enc) {
  if (Array.isArray(msg))
    return msg.slice();
  if (!msg)
    return [];
  var res = [];
  if (typeof msg !== 'string') {
    for (var i = 0; i < msg.length; i++)
      res[i] = msg[i] | 0;
    return res;
  }
  if (enc === 'hex') {
    msg = msg.replace(/[^a-z0-9]+/ig, '');
    if (msg.length % 2 !== 0)
      msg = '0' + msg;
    for (var i = 0; i < msg.length; i += 2)
      res.push(parseInt(msg[i] + msg[i + 1], 16));
  } else {
    for (var i = 0; i < msg.length; i++) {
      var c = msg.charCodeAt(i);
      var hi = c >> 8;
      var lo = c & 0xff;
      if (hi)
        res.push(hi, lo);
      else
        res.push(lo);
    }
  }
  return res;
}
utils.toArray = toArray;

function zero2(word) {
  if (word.length === 1)
    return '0' + word;
  else
    return word;
}
utils.zero2 = zero2;

function toHex(msg) {
  var res = '';
  for (var i = 0; i < msg.length; i++)
    res += zero2(msg[i].toString(16));
  return res;
}
utils.toHex = toHex;

utils.encode = function encode(arr, enc) {
  if (enc === 'hex')
    return toHex(arr);
  else
    return arr;
};

},{}],40:[function(require,module,exports){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
var client = require("./transaction-handler");

// Flash messages that are displayed to the user in case of success or failure of the transaction execution
var successFlashMessage = "<div  id=\"flash-message\" class=\"alert alert-success alert-dismissible fade show mb-3 mt-3\" role=\"alert\">" + "Transa\xE7\xE3o realizada com sucesso" + "<button id=\"flash-button\" type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>" + "</div>";
var failureFlashMessage = "<div class=\"alert alert-danger alert-dismissible fade show mb-3 mt-3\" role=\"alert\">" + "Ocorreu um erro na execu\xE7\xE3o da transa\xE7\xE3o" + "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>" + "</div>";

/**
 * Calls Server or Client-Side Signing Mint functions depending on where the user chose
 * to store his Private Key (on his computer or on the server).
 */
window.mintFT = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
  var keyOnServer;
  return _regeneratorRuntime().wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          keyOnServer = localStorage.getItem("keyOnServer");
          if (keyOnServer == "true") mintFTServerSideSigning();else mintFTClientSideSigning();
        case 2:
        case "end":
          return _context.stop();
      }
    }
  }, _callee);
}));
window.mintNFT = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
  var keyOnServer;
  return _regeneratorRuntime().wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          keyOnServer = localStorage.getItem("keyOnServer");
          if (keyOnServer == "true") mintNFTServerSideSigning();else mintNFTClientSideSigning();
        case 2:
        case "end":
          return _context2.stop();
      }
    }
  }, _callee2);
}));

/**
 * Executes "Mint" transaction in Client-Side Signing Mode.
 */
var mintFTClientSideSigning = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3() {
    var _document$getElementB, username, qty, clientAccountId, transaction, response;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!(localStorage.getItem("keyOnServer") == "false")) {
              _context3.next = 25;
              break;
            }
            // Hides the file upload fields and displays loading image while the transaction is processing.
            document.getElementById("signing-files").style.display = "none";
            document.getElementById("submitButton").style.display = "none";
            document.getElementById("loader").style.display = "flex";
            (_document$getElementB = document.getElementById("flash-button")) === null || _document$getElementB === void 0 ? void 0 : _document$getElementB.click();
            event.preventDefault();
            username = document.getElementById("username").value;
            qty = document.getElementById("qty").value; // Temporary way to get ClientAccountId while we don't know how to get it without needing the client's private key to access the Chaincode
            clientAccountId = "x509::CN=".concat(username, ",OU=client+OU=carbon+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US"); // Base-64 encoding of clientAccountId
            clientAccountId = window.btoa(clientAccountId);
            transaction = {
              chaincodeId: 'erc1155',
              channelId: 'mychannel',
              fcn: "Mint",
              args: [clientAccountId, "$ylvas", qty]
            };
            _context3.prev = 11;
            _context3.next = 14;
            return client.offlineTransaction(transaction);
          case 14:
            response = _context3.sent;
            // Hides the loading image and displays the file upload fields again
            document.getElementById("signing-files").style.display = "block";
            document.getElementById("submitButton").style.display = "block";
            document.getElementById("loader").style.display = "none";

            // Displays Flash Messages
            if (response.result == "SUCCESS") {
              document.getElementById("flash").innerHTML = successFlashMessage;
            } else {
              document.getElementById("flash").innerHTML = failureFlashMessage;
            }
            _context3.next = 25;
            break;
          case 21:
            _context3.prev = 21;
            _context3.t0 = _context3["catch"](11);
            document.getElementById("flash").innerHTML = failureFlashMessage;
            console.log("Error:", _context3.t0.message);
          case 25:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[11, 21]]);
  }));
  return function mintFTClientSideSigning() {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Executes "Mint" transaction in Server-Side Signing Mode.
 */
var mintFTServerSideSigning = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4() {
    var username, qty, token, headers, url, init, body, response, element, _element, _element2;
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            event.preventDefault();
            document.getElementById("loader").style.display = "flex";
            document.getElementById("submitButton").style.display = "none";
            username = document.getElementById("username").value;
            qty = document.getElementById("qty").value;
            token = localStorage.getItem("token");
            headers = new Headers();
            headers.append("Content-Type", "application/json");
            headers.append("Authorization", "Bearer " + token);
            url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/mint";
            init = {
              method: "POST",
              headers: headers
            };
            body = {
              tokenId: "$ylvas",
              tokenAmount: qty,
              tokenReceiver: username
            };
            init.body = JSON.stringify(body);
            _context4.next = 15;
            return fetch(url, init);
          case 15:
            response = _context4.sent;
            if (!response.ok) {
              _context4.next = 23;
              break;
            }
            _context4.next = 19;
            return response.json();
          case 19:
            response = _context4.sent;
            if (response.result != "success") {
              document.getElementById("submitButton").style.display = "flex";
              document.getElementById("loader").style.display = "none";
              element = "<div class=\"alert alert-danger alert-dismissible fade show mb-3 mt-3\" role=\"alert\">" + "Ocorreu um erro na emissao" + "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>" + "</div>";
              document.getElementById("flash").innerHTML = element;
            } else {
              document.getElementById("submitButton").style.display = "flex";
              document.getElementById("loader").style.display = "none";
              _element = "<div class=\"alert alert-success alert-dismissible fade show mb-3 mt-3\" role=\"alert\">" + "$ylvas emitidos com sucesso" + "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>" + "</div>";
              document.getElementById("flash").innerHTML = _element;
            }
            _context4.next = 29;
            break;
          case 23:
            console.log("HTTP Error ", response.status);
            document.getElementById("submitButton").style.display = "flex";
            document.getElementById("loader").style.display = "none";
            _element2 = "<div class=\"alert alert-danger alert-dismissible fade show mb-3 mt-3\" role=\"alert\">" + "Ocorreu um erro na emissao" + "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>" + "</div>";
            document.getElementById("flash").innerHTML = _element2;
            return _context4.abrupt("return", null);
          case 29:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return function mintFTServerSideSigning() {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Executes "Mint" transaction in Client-Side Signing Mode.
 */
var mintNFTClientSideSigning = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5() {
    var _document$getElementB2, username, nftId, qty, clientAccountId, transaction, response;
    return _regeneratorRuntime().wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!(localStorage.getItem("keyOnServer") == "false")) {
              _context5.next = 26;
              break;
            }
            // Hides the file upload fields and displays loading image while the transaction is processing.
            document.getElementById("signing-files").style.display = "none";
            document.getElementById("submitButton").style.display = "none";
            document.getElementById("loader").style.display = "flex";
            (_document$getElementB2 = document.getElementById("flash-button")) === null || _document$getElementB2 === void 0 ? void 0 : _document$getElementB2.click();
            event.preventDefault();
            username = document.getElementById("username").value;
            nftId = document.getElementById("nftId").value;
            qty = document.getElementById("amount").value; //let phyto = document.getElementById("phyto").value;
            //let location = document.getElementById("location").value;
            // Temporary way to get ClientAccountId while we don't know how to get it without needing the client's private key to access the Chaincode
            clientAccountId = "x509::CN=".concat(username, ",OU=client+OU=carbon+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US"); // Base-64 encoding of clientAccountId
            clientAccountId = window.btoa(clientAccountId);
            transaction = {
              chaincodeId: 'erc1155',
              channelId: 'mychannel',
              fcn: "Mint",
              args: [clientAccountId, nftId, qty]
            };
            _context5.prev = 12;
            _context5.next = 15;
            return client.offlineTransaction(transaction);
          case 15:
            response = _context5.sent;
            // Hides the loading image and displays the file upload fields again
            document.getElementById("signing-files").style.display = "block";
            document.getElementById("submitButton").style.display = "block";
            document.getElementById("loader").style.display = "none";

            // Displays Flash Messages
            if (response.result == "SUCCESS") {
              document.getElementById("flash").innerHTML = successFlashMessage;
            } else {
              document.getElementById("flash").innerHTML = failureFlashMessage;
            }
            _context5.next = 26;
            break;
          case 22:
            _context5.prev = 22;
            _context5.t0 = _context5["catch"](12);
            document.getElementById("flash").innerHTML = failureFlashMessage;
            console.log("Error:", _context5.t0.message);
          case 26:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[12, 22]]);
  }));
  return function mintNFTClientSideSigning() {
    return _ref5.apply(this, arguments);
  };
}();

/**
 * Executes "Mint" transaction in Server-Side Signing Mode.
 */
var mintNFTServerSideSigning = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6() {
    var username, nftId, phyto, location, qty, token, headers, url, init, body, response, postMetadataURL, metadataResponse, element, _element3, _element4;
    return _regeneratorRuntime().wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            event.preventDefault();
            document.getElementById("loader").style.display = "flex";
            document.getElementById("submitButton").style.display = "none";
            username = document.getElementById("username").value;
            nftId = document.getElementById("nftId").value;
            phyto = document.getElementById("phyto").value;
            location = document.getElementById("location").value;
            qty = document.getElementById("amount").value;
            token = localStorage.getItem("token");
            headers = new Headers();
            headers.append("Content-Type", "application/json");
            headers.append("Authorization", "Bearer " + token);
            url = "http://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/mint";
            init = {
              method: "POST",
              headers: headers
            };
            body = {
              tokenId: nftId,
              tokenAmount: qty,
              tokenReceiver: username
            };
            init.body = JSON.stringify(body);
            _context6.next = 18;
            return fetch(url, init);
          case 18:
            response = _context6.sent;
            // Post metadata through ipfs node
            postMetadataURL = "http://localhost:4000/meta/postMetadata";
            init.body = JSON.stringify({
              // TODO: match schema with forms
              metadata: {
                id: nftId,
                phyto: phyto,
                geolocation: location,
                custom_notes: "qty: ".concat(qty)
              },
              tokenId: nftId,
              token: token
            });
            _context6.next = 23;
            return fetch(postMetadataURL, init);
          case 23:
            metadataResponse = _context6.sent;
            if (!(response.ok && metadataResponse.ok)) {
              _context6.next = 31;
              break;
            }
            _context6.next = 27;
            return response.json();
          case 27:
            response = _context6.sent;
            if (response.result == null) {
              document.getElementById("submitButton").style.display = "flex";
              document.getElementById("loader").style.display = "none";
              element = "<div class=\"alert alert-danger alert-dismissible fade show mb-3 mt-3\" role=\"alert\">" + "Ocorreu um erro na emissao" + "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>" + "</div>";
              document.getElementById("flash").innerHTML = element;
            } else {
              document.getElementById("submitButton").style.display = "flex";
              document.getElementById("loader").style.display = "none";
              _element3 = "<div class=\"alert alert-success alert-dismissible fade show mb-3 mt-3\" role=\"alert\">" + "NFT emitido com sucesso" + "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>" + "</div>";
              document.getElementById("flash").innerHTML = _element3;
            }
            _context6.next = 37;
            break;
          case 31:
            console.log("HTTP Error ", response.status);
            document.getElementById("submitButton").style.display = "flex";
            document.getElementById("loader").style.display = "none";
            _element4 = "<div class=\"alert alert-danger alert-dismissible fade show mb-3 mt-3\" role=\"alert\">" + "Ocorreu um erro na emissao" + "<button type=\"button\" class=\"btn-close\" data-bs-dismiss=\"alert\" aria-label=\"Close\"></button>" + "</div>";
            document.getElementById("flash").innerHTML = _element4;
            return _context6.abrupt("return", null);
          case 37:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));
  return function mintNFTServerSideSigning() {
    return _ref6.apply(this, arguments);
  };
}();

},{"./transaction-handler":41}],41:[function(require,module,exports){
(function (Buffer){(function (){
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.offlineTransaction = void 0;
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return exports; }; var exports = {}, Op = Object.prototype, hasOwn = Op.hasOwnProperty, defineProperty = Object.defineProperty || function (obj, key, desc) { obj[key] = desc.value; }, $Symbol = "function" == typeof Symbol ? Symbol : {}, iteratorSymbol = $Symbol.iterator || "@@iterator", asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator", toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag"; function define(obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: !0, configurable: !0, writable: !0 }), obj[key]; } try { define({}, ""); } catch (err) { define = function define(obj, key, value) { return obj[key] = value; }; } function wrap(innerFn, outerFn, self, tryLocsList) { var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator, generator = Object.create(protoGenerator.prototype), context = new Context(tryLocsList || []); return defineProperty(generator, "_invoke", { value: makeInvokeMethod(innerFn, self, context) }), generator; } function tryCatch(fn, obj, arg) { try { return { type: "normal", arg: fn.call(obj, arg) }; } catch (err) { return { type: "throw", arg: err }; } } exports.wrap = wrap; var ContinueSentinel = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var IteratorPrototype = {}; define(IteratorPrototype, iteratorSymbol, function () { return this; }); var getProto = Object.getPrototypeOf, NativeIteratorPrototype = getProto && getProto(getProto(values([]))); NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol) && (IteratorPrototype = NativeIteratorPrototype); var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype); function defineIteratorMethods(prototype) { ["next", "throw", "return"].forEach(function (method) { define(prototype, method, function (arg) { return this._invoke(method, arg); }); }); } function AsyncIterator(generator, PromiseImpl) { function invoke(method, arg, resolve, reject) { var record = tryCatch(generator[method], generator, arg); if ("throw" !== record.type) { var result = record.arg, value = result.value; return value && "object" == _typeof(value) && hasOwn.call(value, "__await") ? PromiseImpl.resolve(value.__await).then(function (value) { invoke("next", value, resolve, reject); }, function (err) { invoke("throw", err, resolve, reject); }) : PromiseImpl.resolve(value).then(function (unwrapped) { result.value = unwrapped, resolve(result); }, function (error) { return invoke("throw", error, resolve, reject); }); } reject(record.arg); } var previousPromise; defineProperty(this, "_invoke", { value: function value(method, arg) { function callInvokeWithMethodAndArg() { return new PromiseImpl(function (resolve, reject) { invoke(method, arg, resolve, reject); }); } return previousPromise = previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(innerFn, self, context) { var state = "suspendedStart"; return function (method, arg) { if ("executing" === state) throw new Error("Generator is already running"); if ("completed" === state) { if ("throw" === method) throw arg; return doneResult(); } for (context.method = method, context.arg = arg;;) { var delegate = context.delegate; if (delegate) { var delegateResult = maybeInvokeDelegate(delegate, context); if (delegateResult) { if (delegateResult === ContinueSentinel) continue; return delegateResult; } } if ("next" === context.method) context.sent = context._sent = context.arg;else if ("throw" === context.method) { if ("suspendedStart" === state) throw state = "completed", context.arg; context.dispatchException(context.arg); } else "return" === context.method && context.abrupt("return", context.arg); state = "executing"; var record = tryCatch(innerFn, self, context); if ("normal" === record.type) { if (state = context.done ? "completed" : "suspendedYield", record.arg === ContinueSentinel) continue; return { value: record.arg, done: context.done }; } "throw" === record.type && (state = "completed", context.method = "throw", context.arg = record.arg); } }; } function maybeInvokeDelegate(delegate, context) { var method = delegate.iterator[context.method]; if (undefined === method) { if (context.delegate = null, "throw" === context.method) { if (delegate.iterator["return"] && (context.method = "return", context.arg = undefined, maybeInvokeDelegate(delegate, context), "throw" === context.method)) return ContinueSentinel; context.method = "throw", context.arg = new TypeError("The iterator does not provide a 'throw' method"); } return ContinueSentinel; } var record = tryCatch(method, delegate.iterator, context.arg); if ("throw" === record.type) return context.method = "throw", context.arg = record.arg, context.delegate = null, ContinueSentinel; var info = record.arg; return info ? info.done ? (context[delegate.resultName] = info.value, context.next = delegate.nextLoc, "return" !== context.method && (context.method = "next", context.arg = undefined), context.delegate = null, ContinueSentinel) : info : (context.method = "throw", context.arg = new TypeError("iterator result is not an object"), context.delegate = null, ContinueSentinel); } function pushTryEntry(locs) { var entry = { tryLoc: locs[0] }; 1 in locs && (entry.catchLoc = locs[1]), 2 in locs && (entry.finallyLoc = locs[2], entry.afterLoc = locs[3]), this.tryEntries.push(entry); } function resetTryEntry(entry) { var record = entry.completion || {}; record.type = "normal", delete record.arg, entry.completion = record; } function Context(tryLocsList) { this.tryEntries = [{ tryLoc: "root" }], tryLocsList.forEach(pushTryEntry, this), this.reset(!0); } function values(iterable) { if (iterable) { var iteratorMethod = iterable[iteratorSymbol]; if (iteratorMethod) return iteratorMethod.call(iterable); if ("function" == typeof iterable.next) return iterable; if (!isNaN(iterable.length)) { var i = -1, next = function next() { for (; ++i < iterable.length;) { if (hasOwn.call(iterable, i)) return next.value = iterable[i], next.done = !1, next; } return next.value = undefined, next.done = !0, next; }; return next.next = next; } } return { next: doneResult }; } function doneResult() { return { value: undefined, done: !0 }; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, defineProperty(Gp, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), defineProperty(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, toStringTagSymbol, "GeneratorFunction"), exports.isGeneratorFunction = function (genFun) { var ctor = "function" == typeof genFun && genFun.constructor; return !!ctor && (ctor === GeneratorFunction || "GeneratorFunction" === (ctor.displayName || ctor.name)); }, exports.mark = function (genFun) { return Object.setPrototypeOf ? Object.setPrototypeOf(genFun, GeneratorFunctionPrototype) : (genFun.__proto__ = GeneratorFunctionPrototype, define(genFun, toStringTagSymbol, "GeneratorFunction")), genFun.prototype = Object.create(Gp), genFun; }, exports.awrap = function (arg) { return { __await: arg }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, asyncIteratorSymbol, function () { return this; }), exports.AsyncIterator = AsyncIterator, exports.async = function (innerFn, outerFn, self, tryLocsList, PromiseImpl) { void 0 === PromiseImpl && (PromiseImpl = Promise); var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList), PromiseImpl); return exports.isGeneratorFunction(outerFn) ? iter : iter.next().then(function (result) { return result.done ? result.value : iter.next(); }); }, defineIteratorMethods(Gp), define(Gp, toStringTagSymbol, "Generator"), define(Gp, iteratorSymbol, function () { return this; }), define(Gp, "toString", function () { return "[object Generator]"; }), exports.keys = function (val) { var object = Object(val), keys = []; for (var key in object) { keys.push(key); } return keys.reverse(), function next() { for (; keys.length;) { var key = keys.pop(); if (key in object) return next.value = key, next.done = !1, next; } return next.done = !0, next; }; }, exports.values = values, Context.prototype = { constructor: Context, reset: function reset(skipTempReset) { if (this.prev = 0, this.next = 0, this.sent = this._sent = undefined, this.done = !1, this.delegate = null, this.method = "next", this.arg = undefined, this.tryEntries.forEach(resetTryEntry), !skipTempReset) for (var name in this) { "t" === name.charAt(0) && hasOwn.call(this, name) && !isNaN(+name.slice(1)) && (this[name] = undefined); } }, stop: function stop() { this.done = !0; var rootRecord = this.tryEntries[0].completion; if ("throw" === rootRecord.type) throw rootRecord.arg; return this.rval; }, dispatchException: function dispatchException(exception) { if (this.done) throw exception; var context = this; function handle(loc, caught) { return record.type = "throw", record.arg = exception, context.next = loc, caught && (context.method = "next", context.arg = undefined), !!caught; } for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i], record = entry.completion; if ("root" === entry.tryLoc) return handle("end"); if (entry.tryLoc <= this.prev) { var hasCatch = hasOwn.call(entry, "catchLoc"), hasFinally = hasOwn.call(entry, "finallyLoc"); if (hasCatch && hasFinally) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } else if (hasCatch) { if (this.prev < entry.catchLoc) return handle(entry.catchLoc, !0); } else { if (!hasFinally) throw new Error("try statement without catch or finally"); if (this.prev < entry.finallyLoc) return handle(entry.finallyLoc); } } } }, abrupt: function abrupt(type, arg) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) { var finallyEntry = entry; break; } } finallyEntry && ("break" === type || "continue" === type) && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc && (finallyEntry = null); var record = finallyEntry ? finallyEntry.completion : {}; return record.type = type, record.arg = arg, finallyEntry ? (this.method = "next", this.next = finallyEntry.finallyLoc, ContinueSentinel) : this.complete(record); }, complete: function complete(record, afterLoc) { if ("throw" === record.type) throw record.arg; return "break" === record.type || "continue" === record.type ? this.next = record.arg : "return" === record.type ? (this.rval = this.arg = record.arg, this.method = "return", this.next = "end") : "normal" === record.type && afterLoc && (this.next = afterLoc), ContinueSentinel; }, finish: function finish(finallyLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.finallyLoc === finallyLoc) return this.complete(entry.completion, entry.afterLoc), resetTryEntry(entry), ContinueSentinel; } }, "catch": function _catch(tryLoc) { for (var i = this.tryEntries.length - 1; i >= 0; --i) { var entry = this.tryEntries[i]; if (entry.tryLoc === tryLoc) { var record = entry.completion; if ("throw" === record.type) { var thrown = record.arg; resetTryEntry(entry); } return thrown; } } throw new Error("illegal catch attempt"); }, delegateYield: function delegateYield(iterable, resultName, nextLoc) { return this.delegate = { iterator: values(iterable), resultName: resultName, nextLoc: nextLoc }, "next" === this.method && (this.arg = undefined), ContinueSentinel; } }, exports; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
var elliptic = require('elliptic');
var _require = require('jsrsasign'),
  KEYUTIL = _require.KEYUTIL;

/**
 * This script is responsible for dealing with offline transactions
 */

/**
 * Listens for the page loading event, after which it renders the
 * upload fields for the client's private key and certificate if
 * the client chose the client-side transaction signing mode at signup.
 */
window.addEventListener("load", function () {
  var keyOnServer = localStorage.getItem("keyOnServer");
  var signingFilesElement = document.getElementById("signing-files");
  if (signingFilesElement && keyOnServer) {
    // Renders uploading crypto files element conditionally, depending on the value of keyOnServer
    signingFilesElement.hidden = keyOnServer == "true" ? true : false;
  }
});

/**
 * Executes a transaction in client-side signing mode.
 * Important reference: https://hyperledger-fabric.readthedocs.io/en/latest/txflow.html
 * @param {*} transaction The dictionary that represents the transaction 
 * to be executed
 * @returns The transaction result
 */
var offlineTransaction = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(transaction) {
    var privateKey, certificate, body, token, url, proposalResponse, digest, proposalHex, proposalSignature, proposalSignatureHex, signedProposal, sendProposalResponse, transactionDigest, transactionHex, proposalResponseStatus, payload, transactionSignature, transactionSignatureHex, signedTransactionProposal, commitTransactionResponse, commitResult;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return readUploadedFile("private-key");
          case 2:
            privateKey = _context.sent;
            _context.next = 5;
            return readUploadedFile("certificate");
          case 5:
            certificate = _context.sent;
            // 1. Request transaction proposal generation
            body = {
              username: localStorage.getItem("username"),
              transaction: transaction,
              certificate: certificate
            };
            token = localStorage.getItem("token");
            console.log("### 1. Request transaction proposal generation");
            // Sends transaction proposal generation request to server
            url = "/invoke/channels/mychannel/chaincodes/erc1155/generate-proposal";
            _context.next = 12;
            return sendToServer("POST", url, body, token);
          case 12:
            proposalResponse = _context.sent;
            // The transaction proposal hash
            digest = proposalResponse.result.digest;
            console.log('Transaction proposal hash =', digest);

            // The transaction proposal in Hex
            proposalHex = proposalResponse.result.proposal;
            console.log('proposal bytes', Buffer.from(proposalHex, 'hex'));

            // 2. Sign transaction proposal
            console.log("### 2. Sign transaction proposal");
            _context.next = 20;
            return signTransaction(digest, privateKey);
          case 20:
            proposalSignature = _context.sent;
            proposalSignatureHex = Buffer.from(proposalSignature).toString('hex');
            console.log('signature 1 =', proposalSignature);
            console.log('proposalHex =', proposalHex);
            signedProposal = {
              signature: proposalSignatureHex,
              proposal: proposalHex
            }; // 3. Send signed transaction proposal to server
            console.log("### 3. Send signed transaction proposal to server");
            url = "/invoke/channels/mychannel/chaincodes/erc1155/send-proposal";
            _context.next = 29;
            return sendToServer("POST", url, signedProposal, token);
          case 29:
            sendProposalResponse = _context.sent;
            transactionDigest = sendProposalResponse.result.transactionDigest;
            transactionHex = sendProposalResponse.result.transaction;
            proposalResponseStatus = sendProposalResponse.result.status;
            payload = sendProposalResponse.result.payload;
            if (!(proposalResponseStatus == 200)) {
              _context.next = 48;
              break;
            }
            // 4. Sign transaction
            console.log("### 4. Sign transaction");
            _context.next = 38;
            return signTransaction(transactionDigest, privateKey);
          case 38:
            transactionSignature = _context.sent;
            transactionSignatureHex = Buffer.from(transactionSignature).toString('hex');
            signedTransactionProposal = {
              signature: transactionSignatureHex,
              transaction: transactionHex
            }; // 5. Send signed transaction to server
            url = "/invoke/channels/mychannel/chaincodes/erc1155/commit-transaction";
            _context.next = 44;
            return sendToServer("POST", url, signedTransactionProposal, token);
          case 44:
            commitTransactionResponse = _context.sent;
            commitResult = commitTransactionResponse.result;
            if (!(commitResult == "SUCCESS")) {
              _context.next = 48;
              break;
            }
            return _context.abrupt("return", {
              result: "SUCCESS",
              payload: payload
            });
          case 48:
            return _context.abrupt("return", {
              result: "FAILURE"
            });
          case 49:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return function offlineTransaction(_x) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Sends Request to the server. Returns the server's response
 * @param {*} method POST or GET
 * @param {*} url URL of the server
 * @param {*} body Body to be sent to the server in case of POST
 * @param {*} token Bearer token for authorization
 * @returns Response of the server
 */
exports.offlineTransaction = offlineTransaction;
var sendToServer = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(method, url, body, token) {
    var headers, init, response, json;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            headers = new Headers();
            headers.append("Content-Type", "application/json");
            if (token != null) headers.append("Authorization", "Bearer " + token);
            init = {
              method: method,
              headers: headers
            };
            if (method == "POST") init.body = JSON.stringify(body);
            _context2.next = 7;
            return fetch(url, init);
          case 7:
            response = _context2.sent;
            if (!response.ok) {
              _context2.next = 15;
              break;
            }
            _context2.next = 11;
            return response.json();
          case 11:
            json = _context2.sent;
            return _context2.abrupt("return", json);
          case 15:
            console.log("HTTP Error ", response.status);
            return _context2.abrupt("return", null);
          case 17:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return function sendToServer(_x2, _x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

/**
 * Signs a hashed transaction proposal.
 * @param {*} digest Hash of a transaction proposal
 * @returns The signature of the transaction proposal
 */
var signTransaction = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(digest, privateKeyPEM) {
    var _KEYUTIL$getKey, prvKeyHex, EC, ecdsaCurve, ecdsa, signKey, sig, signature;
    return _regeneratorRuntime().wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            console.log('entrou signtransaction');

            //let prvKeyHex = await KEYUTIL.getKeyFromPlainPrivatePKCS8PEM(privateKeyPEM);
            _KEYUTIL$getKey = KEYUTIL.getKey(privateKeyPEM), prvKeyHex = _KEYUTIL$getKey.prvKeyHex;
            EC = elliptic.ec;
            ecdsaCurve = elliptic.curves['p256'];
            ecdsa = new EC(ecdsaCurve);
            _context3.next = 7;
            return ecdsa.keyFromPrivate(prvKeyHex, 'hex');
          case 7:
            signKey = _context3.sent;
            _context3.next = 10;
            return ecdsa.sign(Buffer.from(digest, 'hex'), signKey);
          case 10:
            sig = _context3.sent;
            sig = _preventMalleability(sig);

            // now we have the signature, next we should send the signed transaction proposal to the peer
            signature = Buffer.from(sig.toDER());
            return _context3.abrupt("return", signature);
          case 14:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return function signTransaction(_x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();

// Helper function for signTransaction
var _preventMalleability = function _preventMalleability(sig) {
  var halfOrder = elliptic.curves.p256.n.shrn(1);
  if (sig.s.cmp(halfOrder) === 1) {
    var bigNum = elliptic.curves.p256.n;
    sig.s = bigNum.sub(sig.s);
  }
  return sig;
};

/**
 * Reads a uploaded file and return the text within it.
 * @param {*} fileId The id of the upload field in the DOM.
 * @returns The file's text as a string.
 */
var readUploadedFile = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(fileId) {
    return _regeneratorRuntime().wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            return _context4.abrupt("return", new Promise(function (resolve) {
              var reader = new FileReader();
              reader.onload = function () {
                resolve(reader.result);
              };
              var file = document.getElementById(fileId).files[0];
              reader.readAsText(file);
            }));
          case 1:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return function readUploadedFile(_x8) {
    return _ref4.apply(this, arguments);
  };
}();

}).call(this)}).call(this,require("buffer").Buffer)
},{"buffer":3,"elliptic":7,"jsrsasign":37}]},{},[40]);
