import LinkPage from "../page";
import {useParams, useSearchParams} from "next/navigation";

export default function LinkPageWithServices() {
    const params = useParams();
    const searchParams = useSearchParams();
    let { services } = params ?? {};
    return <LinkPage searchParams={searchParams} services={services}/>
}