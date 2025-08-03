"use client";
import {useParams, useSearchParams} from "next/navigation";
import {LinkPage} from "../component";

export default function LinkPageWithServices() {
    const params = useParams();
    let { services } = params;

    const searchParams = useSearchParams();
    let command = searchParams.has("command") && searchParams.get("command");

    return <LinkPage command={command} services={services} />
}