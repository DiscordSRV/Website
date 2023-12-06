import Link from "next/link";
import styles from './error.style.css'

export const manifest = {
    title: "DiscordSRV | Not Found"
}

export default function NotFound() {
    return (
        <>
            <div className={styles.error}>
                <h2>404 Not Found</h2>
                <p>Took a wrong turn?</p>
                <Link href="/">Return to homepage</Link>
            </div>
        </>
    );
}
