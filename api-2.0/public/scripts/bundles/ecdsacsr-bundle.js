'use strict';

var crypto = require('crypto');

// 1.2.840.10045.3.1.7
// prime256v1 (ANSI X9.62 named elliptic curve)
var OBJ_ID_EC  = '06 08 2A8648CE3D030107'.replace(/\s+/g, '').toLowerCase();

var ECDSACSR = {};
var ECDSA = {};
var DER = {};
var PEM = {};
var ASN1;
var Hex = {};
var AB = {};

//
// CSR - the main event
//

ECDSACSR.create = function createEcCsr(keypem, domains) {
  var pemblock = PEM.parseBlock(keypem);
  var ecpub = PEM.parseEcPubkey(pemblock.der);
  var request = ECDSACSR.request(ecpub, domains);
  return AB.fromHex(ECDSACSR.sign(keypem, request));
};

ECDSACSR.request = function createCsrBodyEc(xy, domains) {
  var publen = xy.x.byteLength;
  var compression = '04';
  var hxy = '';
  // 04 == x+y, 02 == x-only
  if (xy.y) {
    publen += xy.y.byteLength;
  } else {
    // Note: I don't intend to support compression - it isn't used by most
    // libraries and it requir more dependencies for bigint ops to deflate.
    // This is more just a placeholder. It won't work right now anyway
    // because compression requires an exta bit stored (odd vs even), which
    // I haven't learned yet, and I'm not sure if it's allowed at all
    compression = '02';
  }
  hxy += Hex.fromAB(xy.x);
  if (xy.y) { hxy += Hex.fromAB(xy.y); }

  // Sorry for the mess, but it is what it is
  return ASN1('30'

      // Version (0)
    , ASN1.UInt('00')

      // CN / Subject
    , ASN1('30'
      , ASN1('31'
        , ASN1('30'
            // object id (commonName)
          , ASN1('06', '55 04 03')
          , ASN1('0C', Hex.fromString(domains[0])))))

      // EC P-256 Public Key
    , ASN1('30'
      , ASN1('30'
          // 1.2.840.10045.2.1 ecPublicKey
          // (ANSI X9.62 public key type)
        , ASN1('06', '2A 86 48 CE 3D 02 01')
          // 1.2.840.10045.3.1.7 prime256v1
          // (ANSI X9.62 named elliptic curve)
        , ASN1('06', '2A 86 48 CE 3D 03 01 07')
        )
      , ASN1.BitStr(compression + hxy))

      // CSR Extension Subject Alternative Names
    , ASN1('A0'
      , ASN1('30'
          // (extensionRequest (PKCS #9 via CRMF))
        , ASN1('06', '2A 86 48 86 F7 0D 01 09 0E')
        , ASN1('31'
          , ASN1('30'
            , ASN1('30'
                // (subjectAltName (X.509 extension))
              , ASN1('06', '55 1D 11')
              , ASN1('04'
                , ASN1('30', domains.map(function (d) {
                    return ASN1('82', Hex.fromString(d));
                  }).join(''))))))))
  );
};

ECDSACSR.sign = function csrEcSig(keypem, request) {
  var sig = ECDSA.sign(keypem, AB.fromHex(request));
  var rLen = sig.r.byteLength;
  var rc = '';
  var sLen = sig.s.byteLength;
  var sc = '';

  if (0x80 & new Uint8Array(sig.r)[0]) { rc = '00'; rLen += 1; }
  if (0x80 & new Uint8Array(sig.s)[0]) { sc = '00'; sLen += 1; }

  return ASN1('30'
      // The Full CSR Request Body
    , request

      // The Signature Type
    , ASN1('30'
        // 1.2.840.10045.4.3.2 ecdsaWithSHA256
        // (ANSI X9.62 ECDSA algorithm with SHA256)
      , ASN1('06', '2A 86 48 CE 3D 04 03 02')
      )

      // The Signature, embedded in a Bit Stream
    , ASN1.BitStr(
        // As far as I can tell this is a completely separate ASN.1 structure
        // that just so happens to be embedded in a Bit String of another ASN.1
        ASN1('30'
        , ASN1.UInt(Hex.fromAB(sig.r))
        , ASN1.UInt(Hex.fromAB(sig.s))))
  );
};

//
// ECDSA
//

// Took some tips from https://gist.github.com/codermapuche/da4f96cdb6d5ff53b7ebc156ec46a10a
ECDSA.sign = function signEc(keypem, ab) {
  // Signer is a stream
  var sign = crypto.createSign('sha256');
  sign.write(new Uint8Array(ab));
  sign.end();

  // The signature is ASN1 encoded
  var sig = sign.sign(keypem);

  // Convert to a JavaScript ArrayBuffer just because
  sig = new Uint8Array(sig.buffer.slice(sig.byteOffset, sig.byteOffset + sig.byteLength));

  // The first two bytes '30 xx' signify SEQUENCE and LENGTH
  // The sequence length byte will be a single byte because the signature is less that 128 bytes (0x80, 1024-bit)
  // (this would not be true for P-521, but I'm not supporting that yet)
  // The 3rd byte will be '02', signifying INTEGER
  // The 4th byte will tell us the length of 'r' (which, on occassion, will be less than the full 255 bytes)
  var rIndex = 3;
  var rLen = sig[rIndex];
  var rEnd = rIndex + 1 + rLen;
  var sIndex = rEnd + 1;
  var sLen = sig[sIndex];
  var sEnd = sIndex + 1 + sLen;
  var r = sig.slice(rIndex + 1, rEnd);
  var s = sig.slice(sIndex + 1, sEnd); // this should be end-of-file

  // ASN1 INTEGER types use the high-order bit to signify a negative number,
  // hence a leading '00' is used for numbers that begin with '80' or greater
  // which is why r length is sometimes a byte longer than its bit length
  if (0 === s[0]) { s = s.slice(1); }
  if (0 === r[0]) { r = r.slice(1); }

  return { raw: sig.buffer, r: r.buffer, s: s.buffer };
};

//
// DER
//

DER.toCSR = function createEcCsrPem(der) {
  var pem = PEM._format(AB.toBase64(der));
  return '-----BEGIN CERTIFICATE REQUEST-----\n' + pem + '-----END CERTIFICATE REQUEST-----';
};

//
// PEM
//

// Just for error checking
PEM.from = function ensurePem(key) {
  if (!key) { throw new Error("no private key given"); }
  // whether PEM or DER, convert to Uint8Array
  if ('string' === typeof key) { key = AB.utf8ToUint8Array(key); }

  // for consistency
  if (key instanceof Buffer) { key = new Uint8Array(key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength)); }

  // just as a sanity check
  if (key instanceof Array) {
    key = Uint8Array.from(key);
    if (!key.every(function (el) {
      return ('number' === typeof el) && (el >= 0) && (el <= 255);
    })) {
      throw new Error("key was an array, but not an array of ints between 0 and 255");
    }
  }

  // no matter which path we take, we should arrive at a Uint8Array
  if (!(key instanceof Uint8Array)) {
    throw new Error("typeof key is '" + typeof key + "', not any of the supported types: utf8 string,"
      + " binary string, node Buffer, Uint8Array, or Array of ints between 0 and 255");
  }

  // if DER, convert to PEM
  if ((0x30 === key[0]) && (0x80 & key[1])) {
    key = AB.toBase64(key);
  }
  key = [].map.call(key, function (i) {
    return String.fromCharCode(i);
  }).join('');
  if ('M' === key[0]) {
    key = '-----BEGIN EC PRIVATE KEY-----\n' + key + '-----END EC PRIVATE KEY-----';
  }
  if ('-' === key[0]) {
    return key;
  } else {
    throw new Error("key does not appear to be in PEM formt (does not begin with either '-' or 'M'),"
      + " nor DER format (does not begin with 0x308X)");
  }
};

PEM.parseBlock = function parsePem(pem) {
  var typ;
  var pub;
  var crv;
  var der = AB.fromBase64(pem.split(/\n/).filter(function (line, i) {
    if (0 === i) {
      if (/ PUBLIC /.test(line)) {
        pub = true;
      } else if (/ PRIVATE /.test(line)) {
        pub = false;
      }
      if (/ EC/.test(line)) {
        typ = 'EC';
      }
    }
    return !/---/.test(line);
  }).join(''));

  if (!typ || 'EC' === typ) {
    var hex = Hex.fromAB(der).toLowerCase();
    if (-1 !== hex.indexOf(OBJ_ID_EC)) {
      typ = 'EC';
      crv = 'P-256';
    } else {
      // TODO support P-384 as well (but probably nothing else)
      console.warn("unsupported ec curve");
    }
  }

  return { typ: typ, pub: pub, der: der, crv: crv };
};

PEM._format = function formatAsPem(str) {
  var finalString = '';

  while (str.length > 0) {
      finalString += str.substring(0, 64) + '\n';
      str = str.substring(64);
  }
  return finalString;
};

PEM.parseEcPubkey = function readEcPubkey(der) {
  // the key is the last 520 bits of both the private key and the public key
  // he 3 bits prior identify the key as
  var x, y;
  var compressed;
  var keylen = 32;
  var offset = 64;
  var headerSize = 4;
  var header = Hex.fromAB(der.slice(der.byteLength - (offset + headerSize), der.byteLength - offset));

  if ('03420004' !== header) {
    offset = 32;
    header = Hex.fromAB(der.slice(der.byteLength - (offset + headerSize), der.byteLength - offset));
    if ('03420002' !== header) {
      throw new Error("not a valid EC P-256 key (expected 0x0342004 or 0x0342002 as pub key preamble, but found " + header + ")");
    }
  }

  // The one good thing that came from the b***kchain hysteria: good EC documentation
  // https://davidederosa.com/basic-blockchain-programming/elliptic-curve-keys/
  compressed = ('2' === header[header.byteLength -1]);
  x = der.slice(der.byteLength - offset, (der.byteLength - offset) + keylen);
  if (!compressed) {
    y = der.slice(der.byteLength - keylen, der.byteLength);
  }

  return {
    x: x
  , y: y || null
  };
};

//
// A dumbed-down, minimal ASN.1 packer
//

// Almost every ASN.1 type that's important for CSR
// can be represented generically with only a few rules.
ASN1 = function ASN1(/*type, hexstrings...*/) {
  var args = Array.prototype.slice.call(arguments);
  var typ = args.shift();
  var str = args.join('').replace(/\s+/g, '').toLowerCase();
  var len = (str.length/2);
  var lenlen = 0;
  var hex = typ;

  // We can't have an odd number of hex chars
  if (len !== Math.round(len)) {
    throw new Error("invalid hex");
  }

  // The first byte of any ASN.1 sequence is the type (Sequence, Integer, etc)
  // The second byte is either the size of the value, or the size of its size

  // 1. If the second byte is < 0x80 (128) it is considered the size
  // 2. If it is > 0x80 then it describes the number of bytes of the size
  //    ex: 0x82 means the next 2 bytes describe the size of the value
  // 3. The special case of exactly 0x80 is "indefinite" length (to end-of-file)

  if (len > 127) {
    lenlen += 1;
    while (len > 255) {
      lenlen += 1;
      len = len >> 8;
    }
  }

  if (lenlen) { hex += Hex.fromInt(0x80 + lenlen); }
  return hex + Hex.fromInt(str.length/2) + str;
};

// The Integer type has some special rules
ASN1.UInt = function UINT() {
  var str = Array.prototype.slice.call(arguments).join('');
  var first = parseInt(str.slice(0, 2), 16);

  // If the first byte is 0x80 or greater, the number is considered negative
  // Therefore we add a '00' prefix if the 0x80 bit is set
  if (0x80 & first) { str = '00' + str; }

  return ASN1('02', str);
};

// The Bit String type also has a special rule
ASN1.BitStr = function BITSTR() {
  var str = Array.prototype.slice.call(arguments).join('');
  // '00' is a mask of how many bits of the next byte to ignore
  return ASN1('03', '00' + str);
};

//
// Hex, Base64, Buffer, String
//

Hex.fromAB = function toHex(ab) {
  var hex = [];
  var u8 = new Uint8Array(ab);
  var size = u8.byteLength;
  var i;
  var h;
  for (i = 0; i < size; i += 1) {
    h = u8[i].toString(16);
    if (2 === h.length) {
      hex.push(h);
    } else {
      hex.push('0' + h);
    }
  }
  return hex.join('');
};

Hex.fromString = function strToHex(str) {
  var escstr = encodeURIComponent(str);
  // replaces any uri escape sequence, such as %0A,
  // with binary escape, such as 0x0A
  var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode('0x' + p1);
  });
  return binstr.split('').map(function (b) {
    var h = b.charCodeAt(0).toString(16);
    if (2 === h.length) { return h; }
    return '0' + h;
  }).join('');
};

Hex.fromInt = function numToHex(d) {
  d = d.toString(16);
  if (d.length % 2) {
    return '0' + d;
  }
  return d;
};

// Taken from Unibabel
// https://git.coolaj86.com/coolaj86/unibabel.js#readme
// https://coolaj86.com/articles/base64-unicode-utf-8-javascript-and-you/
AB.utf8ToUint8Array = function (str) {
  var escstr = encodeURIComponent(str);
  // replaces any uri escape sequence, such as %0A,
  // with binary escape, such as 0x0A
  var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode('0x' + p1);
  });
  var buf = new Uint8Array(binstr.length);
  binstr.split('').forEach(function (ch, i) {
    buf[i] = ch.charCodeAt(0);
  });

  return buf;
};

AB.fromHex = function fromHex(hex) {
  if ('undefined' !== typeof Buffer) {
    return Buffer.from(hex, 'hex');
  }
  var ab = new ArrayBuffer(hex.length/2);
  var i;
  var j;
  ab = new Uint8Array(ab);
  for (i = 0, j = 0; i < (hex.length/2); i += 1) {
    ab[i] = parseInt(hex.slice(j, j+1), 16);
    j += 2;
  }
  return ab.buffer;
};

AB.fromBase64 = function fromBase64(b64) {
  var buf = Buffer.from(b64, 'base64');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
};

AB.toBase64 = function toBase64(der) {
  return Buffer.from(der).toString('base64');
};

/*global Promise*/
module.exports = function (opts) {
  // We're using a Promise here to be compatible with the browser version
  // which uses the webcrypto API for some of the conversions
  return Promise.resolve().then(function () {

    // We do a bit of extra error checking for user convenience
    if (!opts) { throw new Error("You must pass options with key and domains to ecdsacsr"); }
    if (!Array.isArray(opts.domains) || 0 === opts.domains.length) {
      new Error("You must pass options.domains as a non-empty array");
    }

    // I need to check that 例.中国 is a valid domain name
    if (!opts.domains.every(function (d) {
      // allow punycode? xn--
      if ('string' === typeof d /*&& /\./.test(d) && !/--/.test(d)*/) {
        return true;
      }
    })) {
      throw new Error("You must pass options.domains as utf8 strings (not punycode)");
    }
    var key = PEM.from(opts.key);
    return DER.toCSR(ECDSACSR.create(key, opts.domains));
  });
};
