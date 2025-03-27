"use client"
import {useRouter} from "next/navigation";

export default function Page() {
    const router = useRouter()

    function checkUrl(inputtedUrl) {
        const regex = /https:\/\/bin.scarsz.me\/([0-9a-f-]{36}#.{16,32})/
        const match = regex.exec(inputtedUrl);
        if (match) {
            router.push("/bin/" + match[1]);
        }
    }

    return (
        <div style={{display: "flex", justifyContent: "center", margin: "3rem"}}>
            <div style={{display: "flex", flexDirection: "column", maxWidth: "40rem", width: "100%"}}>
                <h2>Paste your Bin url below</h2>
                <textarea
                    style={{width: "100%", backgroundColor: "transparent", borderRadius: "2px", color: "white", resize: "none"}}
                    placeholder="https://bin.scarsz.me/..."
                    onChange={event => checkUrl(event.target.value)}
                />
            </div>
        </div>
    )
}