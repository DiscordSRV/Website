import DebugClient from "./client";
import {useParams} from "next/navigation";

export const metadata = {
    title: "DiscordSRV | Debug report"
}

export default function Page() {
    const params = useParams();
    return <DebugClient params={params}/>
}