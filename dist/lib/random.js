"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Random = void 0;
const crypto = require("crypto");
class Random {
    static id(digits = 17) {
        let id = '';
        const bytes = crypto.randomBytes(digits);
        for (let x = 0; x < digits; x++) {
            id += this.UNMISTAKABLE_CHARS[bytes[x] % digits];
        }
        return id;
    }
}
exports.Random = Random;
Random.UNMISTAKABLE_CHARS = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
//# sourceMappingURL=random.js.map