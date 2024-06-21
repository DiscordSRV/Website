function b64Decode(b64) {
    return atob(b64.replaceAll('-', '+').replaceAll('_', '/'));
}

function stringToBytes(string) {
    return Uint8Array.from(string, (m) => m.charCodeAt(0));
}

async function decrypt(encryptedData, decryptionKey) {
    const key = await crypto.subtle.importKey(
        "raw",
        stringToBytes(decryptionKey),
        {
            name: "AES-CBC",
            keyLength: 16
        },
        false,
        ["decrypt"]
    );

    const bytes = stringToBytes(encryptedData);
    const decryptedBytes = await crypto.subtle.decrypt(
        {
            name: "AES-CBC",
            iv: bytes.slice(0, 16)
        },
        key,
        bytes.slice(16)
    );
    return new TextDecoder().decode(decryptedBytes);
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

export {b64Decode, decrypt, getFromBytebin, getFromBin}
