import Link from "next/link";
import styles from '../styles/error.module.css'
import CommonHead from "../components/CommonHead";

export default function Custom404() {
    return (
        <>
            <CommonHead>
                <title>DiscordSRV | Not Found</title>
            </CommonHead>
            <div className={styles.error}>
                <h2>404 Not Found</h2>
                <p>Took a wrong turn?</p>
                <Link href="/">Return to homepage</Link>
            </div>
        </>
    );
}
