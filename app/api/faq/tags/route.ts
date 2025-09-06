import { NextRequest, NextResponse } from "next/server";
import { createRedisClient } from "../../../(helpers)/api-helpers";
import { checkAuth } from "../../auth/(helper)/auth-helper";

const redis = await createRedisClient();

export async function GET(request: NextRequest, { params }) {
    const result = await redis.get(`faq_meta:tags`);
    
    let resultParsed = result ? JSON.parse(result as string) : undefined;
    if (!resultParsed || !Array.isArray(resultParsed)) {
        resultParsed = [];
    }
    return NextResponse.json(resultParsed);
}

export async function PUT(request: NextRequest, { params }) {
    if (!await checkAuth(request, redis)) {
        return NextResponse.json({error: "unauthorized"}, {status: 401});
    }
    
    const body = await request.json();
    if (body == null || !Array.isArray(body)) {
        return NextResponse.json({"error": "Invalid body"}, {status: 400});
    }

    let invalidTag = body.find(tag => !/[a-zA-Z0-9_-]{1,50}/.test(tag));
    if (invalidTag !== undefined) {
        return NextResponse.json({error: "bad tag: " + invalidTag}, {status: 400});
    }
    
    const result = await redis.set(`faq_meta:tags`, JSON.stringify(body));
    return NextResponse.json(result);
}