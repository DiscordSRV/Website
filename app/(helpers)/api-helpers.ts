import { NextRequest } from "next/server";
import { createClient } from "redis";

export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
export const ALLOWED_USER_IDS = new Set(process.env.ALLOWED_DISCORD_USER_IDS?.split(",") ?? []);

export async function createRedisClient() {
    return await createClient({ url: process.env.REDIS_URL }).connect();
}

export async function checkAuth(request: NextRequest, redis) {
    const userState = request.cookies.get("user")?.value;
    const tokenState = request.cookies.get("token")?.value;

    if (!userState || !tokenState) {
        return false;
    }

    const user = JSON.parse(userState);
    if (!user || !user.id) {
        return false;
    }

    const redisToken = await redis.get(`user:${user.id}`);
    if (!redisToken) {
        return false;
    }

    return redisToken === tokenState;
}