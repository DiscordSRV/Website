import LinkPage from "../page";

export default function LinkPageWithServices({ searchParams, params }) {
    let { services } = params ?? {};
    return <LinkPage searchParams={searchParams} services={services}/>
}