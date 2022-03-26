import {fetch,Params} from "./util/network";

const BASE_URL = "www.bscotch.net/api/";

export type CreatorCode = string;
export type LevelCode = string;

export type BlogPostInfo = {
	userId: CreatorCode;
	name: string;
	collaborators: CreatorCode[];
	tags: string[];
	etag: string;
	mimetype: string;
	bytes: number;
	createdAt: string; // ISO date
	updatedAt: string; // ISO Date
	store: string;
	itemId: string;
	crateId: string; // = "posts"
	createdAgo: number;
	updatedAgo: number;
	_id: string; 
}

export async function getSpotlights(): Promise<BlogPostInfo[]> {
	const list = [];
	const datetime = new Date();
	for (let i=0; i<50; i++) {
		const params: Params = {
			// tags: "topic:levelhead",
			tags: "topic:levelhead,topic:spotlight",
			sort: "createdAt",
			dates: "createdAt<=" + datetime.toISOString(),
		};
		// console.log(params.dates);
		const res = await fetch(BASE_URL+"storage/crates/posts/items", params);
		const blogs = res.data;
		if (blogs.length==0) break;
		list.push(...blogs);
		const last = blogs[blogs.length-1];
		const lastTime = new Date(last.createdAt);
		datetime.setTime(lastTime.getTime() - (24*60*60*1000) ); //add a day to not grab these again
	}
	return list;
}

// get contents: https://www.bscotch.net/api/storage/crates/posts/items?download=true&names=community-spotlight-146
export async function getBlogContents(name: string) {
	return await fetch(BASE_URL+"storage/crates/posts/items", {
		download: true,
		names: name
	});
}