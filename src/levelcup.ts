import {fetch} from "./util/network";
import * as rce from "@bscotch/rumpus-ce"
import * as bscotch from "./bscotch";

export type ContestId = string;


export type Submission = {
	contestId: ContestId;
	dateSubmitted: Date;
	rumpusCreatorId: bscotch.CreatorCode;
	lookupCode: bscotch.LevelCode;
	levelMetaData: rce.LevelheadLevelDownload; //some info actually appears to be missing
	submittedByUserId: string;
	votes?: number;
	overwrite?: boolean //No idea what this one does
}

const BASE_URL = "levelcup-prod.herokuapp.com/api/";

export async function getSubmissions(): Promise<Submission[]> {
	return await fetch(BASE_URL+"submissions")
}

export async function getContest(id: ContestId) {
	return await fetch(BASE_URL+"contests/"+id)
}