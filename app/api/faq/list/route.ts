import { NextResponse } from "next/server";
import { RedisArgument } from "redis";
import { createRedisClient } from "../../../(helpers)/api-helpers";

const redis = await createRedisClient();

const prefix = "faq:";
export async function GET() {
    let cursor: RedisArgument = "0";
    const allKeys = [];
    do {
        const scanResult = await redis.scan(cursor, { "MATCH": prefix + "*" });
        cursor = scanResult.cursor;
        scanResult.keys.forEach(key => allKeys.push(key));
    } while (cursor != "0");

    return NextResponse.json(
        allKeys
            .filter(key => key.indexOf(prefix) === 0)
            .map(key => key.substring(prefix.length))
            .filter(key => key.indexOf(":") === -1)
    );
}
  