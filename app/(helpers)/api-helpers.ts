import { createClient } from "redis";

export async function createRedisClient() {
    return await createClient({ url: process.env.REDIS_URL }).connect();
}