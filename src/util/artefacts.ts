import fs from "fs/promises";

const workDir = "artefacts";

function resolvePath(path: string): string {
	let fc = path.charAt(0);
	if (fc=="/" || fc=="\\") {
		return workDir + path;
	} else {
		return workDir + "/" + path;
	}
}

async function folderExistsInternal(path: string) {
	try {
		await fs.access(path);
		return true;
	} catch (e) {
		return false;
	}
}
async function haveFolderInternal(path: string) {
	if (!await folderExistsInternal(path)) {
		await fs.mkdir(path);
	}
}

export async function haveWorkFolder() {
	await haveFolderInternal(workDir);
}
export async function haveFolder(path: string) {
	await haveFolderInternal(resolvePath(path));
}


export async function putRaw(path: string, data: string) {
	await fs.writeFile(resolvePath(path), data);
}

export async function put(path: string, data: any) {
	await putRaw(path, JSON.stringify(data,null,"\t"));
}


export async function getRaw(path: string): Promise<string> {
	let buffer = await fs.readFile(resolvePath(path))
	return buffer.toString();
}

export async function get(path: string): Promise<any> {
	return JSON.parse(await getRaw(path));
}