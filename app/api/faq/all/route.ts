import { NextResponse } from "next/server";
import { createRedisClient } from "../../../(helpers)/api-helpers";
import { getAllFaqKeys, getFaqEntry } from "../(helper)/faq-helper";

const redis = await createRedisClient();

export async function GET() {
    const allKeys = await getAllFaqKeys(redis);
    const allEntries = {};
    for (const key of allKeys) {
        allEntries[key] = await getFaqEntry(key, redis);
    }
    return NextResponse.json(allEntries);
}