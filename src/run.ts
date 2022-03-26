import * as lc from "./levelcup";
import * as cs from "./spotlight";
import * as artefacts from "./util/artefacts";

// LEVELCUP

async function _getLevelcupContests() {
	const idMap: Record<lc.ContestId,boolean> = {};
	const submissions = await lc.getSubmissions();
	for (const sub of submissions) {
		idMap[sub.contestId] = true;
	}
	const ids = Object.keys(idMap);
	const links = ids.map(id => `https://levelcup-prod.herokuapp.com/contest/${id}`).join("\n");
	await artefacts.putRaw("links.txt",links);
}



async function go() {
	// await cs.dlSpotlights();
	// await cs.dlSpotlightContents();
	// await cs.stats();
	await cs.parseSpotlights();
}

async function run() {
	artefacts.haveWorkFolder();
	await go();
}

run().then(()=>{console.log("Done!");}).catch((e)=>{throw e;});