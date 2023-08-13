import Head from "next/head";
import Link from "next/link";
import appleTouchIcon from "../assets/apple-touch-icon.png";
import favicon32 from "../assets/favicon-32x32.png";
import manifest from "../assets/manifest.json";

export default function CommonHead({children}) {
    return (
        <Head>
            <Link rel="apple-touch-icon" href={appleTouchIcon}/>
            <Link rel="icon" type="image/png" href={favicon32}/>
            <Link rel="manifest" href={manifest}/>
            {children}
        </Head>
    )
}