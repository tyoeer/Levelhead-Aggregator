import axios from "axios";

export type Params = Record<string,{toString: () => string}>;

function parseParams(params: Params): string {
	return Object.keys(params)
		.map(k => k + "=" + params[k].toString())
		.join("&");
}

export async function fetch(path: string, params?: Params) {
	let paramsString = "";
	if (params) {
		paramsString = "?" + parseParams(params);
	}
	const url = "https://" + path + paramsString;
	try {
		const response = await axios.get(url);
		return response.data;
	} catch (error) {
		console.error("Error fetching " + url)
		console.error(error);
		if (axios.isAxiosError(error)) {
			console.error(error.toJSON());
		}
	}
}