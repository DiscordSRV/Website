import * as aesjs from "aes-js";

function decrypt(data, decryptionKey) {
    decryptionKey = toArray(b64Decode(decryptionKey));
    return JSON.parse(decryptRaw(data, decryptionKey));
}

function decryptRaw(data, decryptionKey) {
    const encrypted = toArray(b64Decode(data));
    if (decryptionKey.length < 16 || decryptionKey.length % 16 !== 0) {
        throw "Invalid length decryption key: " + decryptionKey.length
    }

    let iv = encrypted.subarray(0, 16);
    let content = encrypted.subarray(16);
    const aes = new aesjs.ModeOfOperation.cbc(decryptionKey, iv);

    let decrypted = aes.decrypt(content);
    // Remove padding
    decrypted = decrypted.subarray(0, decrypted.byteLength - decrypted[decrypted.byteLength - 1]);

    return aesjs.utils.utf8.fromBytes(decrypted);
}

function toArray(input) {
    // @ts-ignore
    return Uint8Array.from(input, c => c.charCodeAt(0));
}

function b64Decode(b64) {
    let standard = b64.replaceAll('-', '+').replaceAll('_', '/');
    return atob(standard);
}

async function getFromBytebin(url) {
    const response = await fetch(url);
    if (response.headers.get('content-type') !== 'application/octet-stream') {
        throw { notFound: true };
    }
    return await response.text();
}
async function getFromBin(url) {
    const response = await fetch(url);
    return await response.json();
}

export {decrypt, decryptRaw, toArray, b64Decode, getFromBytebin, getFromBin}
