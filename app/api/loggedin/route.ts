import { NextRequest, NextResponse } from "next/server";
import { createRedisClient } from "../../(helpers)/api-helpers";
import { checkAuth } from "../auth/(helper)/auth-helper";

const redis = await createRedisClient();

export async function GET(request: NextRequest) {
    const loggedIn = await checkAuth(request, redis);
    return NextResponse.json(loggedIn);
};