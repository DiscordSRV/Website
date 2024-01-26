import axios from "axios";

export async function GET(request, { params }) {
    let response = await axios.get(`https://bin.scarsz.me/v1/${params.file}.json`);
    let data = response.data;
    return Response.json(data);
}