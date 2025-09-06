import { NextRequest, NextResponse } from "next/server";
import { createRedisClient } from "../../../(helpers)/api-helpers";
import { ALLOWED_USER_IDS, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } from "../(helper)/auth-helper";

const redis = await createRedisClient();

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    const cookieState = request.cookies.get("state")?.value;
    console.log("query", code, state, cookieState);
    if (state !== cookieState) {
        return NextResponse.json({error: "bad state"}, {status: 401});
    }

    const formData = new FormData();
    formData.append("client_id", DISCORD_CLIENT_ID);
    formData.append("client_secret", DISCORD_CLIENT_SECRET);
    formData.append("grant_type", "authorization_code");
    formData.append("code", code);
    formData.append("redirect_uri", request.url.substring(0, request.url.indexOf("?")));

    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", { method: "POST", body: formData });
    if (!tokenResponse.ok) {
        return NextResponse.json({error: "unauthorized"}, {status: 401});
    }

    const responseBody = await tokenResponse.json();
    if (!responseBody || responseBody.scope.indexOf("identify") === -1) {
        return NextResponse.json({error: "unauthorized"}, {status: 401});
    }

    const accessToken = responseBody["access_token"];
    const userResponse = await fetch("https://discord.com/api/users/@me", { headers: { "Authorization": `Bearer ${accessToken}`}});
    if (!userResponse.ok) {
        return NextResponse.json({error: "unauthorized"}, {status: 401});
    }

    const user = await userResponse.json();
    if (!user || !ALLOWED_USER_IDS.has(user.id)) {
        return NextResponse.json({error: "unauthorized"}, {status: 401});
    }

    const expiryS = 60 * 60 * 24 * 2;
    await redis.set(`user:${user.id}`, accessToken, { expiration: { type: "EX", value: expiryS } });

    const url = request.nextUrl.clone()
    url.pathname = '/';
    url.searchParams.forEach(searchParameter => url.searchParams.delete(searchParameter)); 

    const response = NextResponse.redirect(url);
    response.cookies.set("user", JSON.stringify(user), { secure: true, httpOnly: true, sameSite: "strict", maxAge: expiryS });
    response.cookies.set("token", accessToken, { secure: true, httpOnly: true, sameSite: "strict", maxAge: expiryS });
    return response;
}