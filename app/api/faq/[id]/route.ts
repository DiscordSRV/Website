import { NextRequest, NextResponse } from "next/server";
import { createRedisClient } from "../../../(helpers)/api-helpers";
import { checkAuth } from "../../auth/(helper)/auth-helper";
import { FAQ_ENTRY_PREFIX, getFaqEntry } from "../(helper)/faq-helper";

const redis = await createRedisClient();

export async function GET(request: NextRequest, { params }) {
    return NextResponse.json(getFaqEntry(params.id, redis));
}

export async function POST(request: NextRequest, { params }) {
    return alter(request, params.id, Operation.CREATE);
}

export async function PUT(request: NextRequest, { params }) {
    return alter(request, params.id, Operation.UPDATE);
}

export async function DELETE(request: NextRequest, { params }) {
    return alter(request, params.id, Operation.DELETE);
}

enum Operation {
    CREATE,
    UPDATE,
    DELETE
}

async function alter(request: NextRequest, id: string, operation: Operation) {
    if (!await checkAuth(request, redis)) {
        return NextResponse.json({error: "unauthorized"}, {status: 401});
    }

    if (!/[a-zA-Z0-9_-]{1,50}/.test(id)) {
        return NextResponse.json({error: "bad id"}, {status: 400});
    }

    const key = `${FAQ_ENTRY_PREFIX}${id}`;
    const existing = await redis.get(key);
    if (operation != Operation.CREATE ? existing == null : existing != null) {
        return NextResponse.json({"error": operation  ? "Doesn't exist" : "Already exists"}, {status: 400})
    }

    let result;
    if (operation != Operation.DELETE) {
        const body = await request.json();
        if (body == null) {
            return NextResponse.json({"error": "Invalid body"}, {status: 400});
        }
    
        result = await redis.set(key, JSON.stringify(body));
    } else {
        result = await redis.del(key);
    }
    return NextResponse.json(result);
}