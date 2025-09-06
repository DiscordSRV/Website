import { NextRequest, NextResponse } from "next/server";
import { DISCORD_CLIENT_ID } from "../../(helpers)/api-helpers";

export async function GET(request: NextRequest) {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const state = btoa(array.join(","));

    const redirectUrl = request.url + "/token";
    let url = `https://discord.com/oauth2/authorize?client_id=${encodeURI(DISCORD_CLIENT_ID)}&scope=identify&redirect_uri=${encodeURI(redirectUrl)}&response_type=code&state=${encodeURI(state)}`;

    const response = NextResponse.redirect(url);
    response.cookies.set("state", state, { sameSite: "lax", httpOnly: true, secure: true, path: "/api/auth/token", maxAge: 300 });
    return response;
}