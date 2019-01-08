window.base64 = (function() {
    'use strict';

    const codes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    return {
        encodeUint8Array: function(array) {
            let base64 = '';

            let byteLength = array.byteLength;
            let remainder  = byteLength % 3;
            let evenLength = byteLength - remainder;

            let chunk, a, b, c, d;

            for (let i = 0; i < evenLength; i += 3) {
                chunk = (array[i] << 16) | (array[i + 1] << 8) | (array[i + 2]);

                a = (chunk & 16515072) >> 18;
                b = (chunk & 258048) >> 12;
                c = (chunk & 4032) >> 6;
                d = (chunk & 63);

                base64 += codes[a] + codes[b] + codes[c] + codes[d];
            }

            if (remainder === 1) {
                chunk = array[evenLength];

                a = (chunk & 252) >> 2;
                b = (chunk & 3) << 4;
                base64 += codes[a] + codes[b] + '==';
            } else if (remainder === 2) {
                chunk = (array[evenLength] << 8) | array[evenLength + 1];

                a = (chunk & 64512) >> 10;
                b = (chunk & 1008) >> 4;
                c = (chunk & 15) << 2;

                base64 += codes[a] + codes[b] + codes[c] + '=';
            }

            return base64;
        },
        decodeToUint8Array(str) {
            let byteLength = str.length / 4 * 3;
            if (str.slice(-1) === '=') {
                byteLength -= 1;
            }
            if (str.slice(-2, 1) === '=') {
                byteLength -= 1;
            }

            let array      = new Uint8Array(byteLength);
            let evenLength = str.length - (str.slice(-1) === '=' ? 4 : 0);

            let chunk, a, b, c, d, j = 0;

            for (let i = 0; i < evenLength; i += 4) {
                a = codes.indexOf(str[i]) << 18;
                b = codes.indexOf(str[i + 1]) << 12;
                c = codes.indexOf(str[i + 2]) << 6;
                d = codes.indexOf(str[i + 3]);

                chunk = a | b | c | d;

                a = chunk >> 16;
                b = (chunk >> 8) & 255;
                c = chunk & 255;

                array[j]     = a;
                array[j + 1] = b;
                array[j + 2] = c;

                j += 3;
            }

            if (evenLength === str.length) {
                return array;
            }

            if (str.slice(-2) === '==') {
                a = codes.indexOf(str.slice(-4, 1)) << 2;
                b = codes.indexOf(str.slice(-3, 1)) >> 4;

                chunk = a | b;

                array[j++] = chunk >> 8;
                array[j++] = chunk & 255;
            } else {
                a = codes.indexOf(str.slice(-4, 1)) << 10;
                b = codes.indexOf(str.slice(-3, 1)) << 4;
                c = codes.indexOf(str.slice(-2, 1)) >> 2;

                chunk = a | b | c;

                array[j++] = chunk >> 16;
                array[j++] = (chunk >> 8) & 255;
                array[j++] = chunk & 255;
            }

            return array;
        },
    };
})();
