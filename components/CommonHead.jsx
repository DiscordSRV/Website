import Head from "next/head";

export default function CommonHead({children}) {
    // noinspection HtmlUnknownTarget
    return (
        <Head>
            <link rel="apple-touch-icon" href="apple-touch-icon.png" />
            <link rel="icon" type="image/png" href="favicon-32x32.png" sizes="32x32" />
            <link rel="icon" type="image/png" href="favicon-16x16.png" sizes="16x16" />
            <link rel="manifest" href="manifest.json" />
            {children}
        </Head>
    )
}