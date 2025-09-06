import { RedisArgument } from "redis";

export const FAQ_ENTRY_PREFIX = "faq:";

export async function getAllFaqKeys(redis) {
    let cursor: RedisArgument = "0";
    const allKeys = [];
    do {
        const scanResult = await redis.scan(cursor, { "MATCH": FAQ_ENTRY_PREFIX + "*" });
        cursor = scanResult.cursor;
        scanResult.keys.forEach(key => allKeys.push(key));
    } while (cursor != "0");

    return allKeys
        .filter(key => key.indexOf(FAQ_ENTRY_PREFIX) === 0)
        .map(key => key.substring(FAQ_ENTRY_PREFIX.length))
        .filter(key => key.indexOf(":") === -1);
}

export async function getFaqEntry(id, redis) {
    const result = await redis.get(`faq:${id}`);
    if (result != null && typeof result !== "string") {
        return null;
    }
    return JSON.parse(result as string);
}