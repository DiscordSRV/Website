import { NextResponse } from "next/server";
import { RedisArgument } from "redis";
import { createRedisClient } from "../../../(helpers)/api-helpers";
import { getAllFaqKeys } from "../(helper)/faq-helper";

const redis = await createRedisClient();

export async function GET() {
    return NextResponse.json(getAllFaqKeys(redis));
}
  