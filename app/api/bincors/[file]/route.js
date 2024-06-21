export async function GET(request, { params }) {
    let response = await fetch(`https://bin.scarsz.me/v1/${params.file}.json`);
    let data = await response.json();
    return Response.json(data);
}