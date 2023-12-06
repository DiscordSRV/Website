import CommonHead from "../components/CommonHead";
import styles from '../styles/linking.succcess.module.css'
import {useRouter} from "next/router";

export default function Home() {
    const router = useRouter()
    const { state } = router.query;

    const isDiscord = state === "discord";

    return (
        <>
            <CommonHead>
                <title>DiscordSRV | Linking Success</title>
            </CommonHead>
            <div style={{display: "flex", justifyContent: "center"}}>
                <div className={styles.linkingSuccess}>
                    <h1>You are now successfully linked</h1>
                    <span>Return to the game and run the <code>{"/" + (isDiscord ? "discord " : "") + "link"}</code> command again, and you will be linked. You may close this tab</span>
                </div>
            </div>
        </>
    )
}