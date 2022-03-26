import { parseMarkdown, MarkdownSection } from "./util/markdown";
import * as art from "./util/artefacts";
import { sleep } from "./util/misc";
import * as bscotch from "./bscotch";

export type BlogPost = bscotch.BlogPostInfo & {
	contents: string;
}

function getSpotlightNumber(spotlight: bscotch.BlogPostInfo): number {
	return parseInt(spotlight.name.replace(/[^0-9]/g, ""));
}

//The actual stuff

export async function dlSpotlights() {
	const spotlights = await bscotch.getSpotlights();
	await art.put("rawSpotlights.json", spotlights);
}

// Inconsistencies/mistakes/typos won't be fixed, see https://www.bscotch.net/feedbag/rumpus/entries/622fa4e11f9a1fcff8038493
let patches: {
	[key: number]: (spotlightContents: string) => string
} = {
	138: (s) => s.replace("# Hypnotic Labyrinth", "## Hypnotic Labyrinth"),
	137: (s) => s.replace("# Driving Lesson 1", "## Driving Lesson 1"),
	129: (s) => s.replace("[FlowArt's](https://levelhead.io/+7m16sz4@8bjq18)", "[FlowArt's](https://levelhead.io/@8bjq18)"),
	127: (s) => s.replace("[Cyra998's](https://levelhead.io/+xs1m042@362q2b)", "[Cyra998's](https://levelhead.io/@362q2b)"),
	118: (s) => s.replace("## Featured Viewing", "# Featured Viewing"),
	110: (s) => s.replace("# Picnic Activites", "# Picnic Activities"),
	104: (s) => s.replace("# Community Annoucements:", "# Community Announcements:"),
	103: (s) => {
		return s.replace("# Featured Annoucements", "# Featured Announcements")
			.replace("[Omikron's](https://levelhead.io/+s48c000@3xz1xt)", "[Omikron's](https://levelhead.io/@3xz1xt)");
	},
	93: (s) => s.replace(/# (?!feat|high)/gsi, "## "), // All the level headers are on level 1
	87: (s) => s.replace("[Sundiszno's](https://levelhead.io/+nfj0s08@jssmcl)", "[Sundiszno's](https://levelhead.io/@jssmcl)"),
	85: (s) => s.replace(/(?<=\n\n)([^\n]+)\n(## Christmas Tree Decoration!\n[^\n]+)/gsi, "$2\n\n$1"), // level info above the header
	81: (s) => s.replace(/(?<=\n\n)([^\n]+)\n\n(## Treehouse excursion\n[^\n]+)/gsi, "$2\n\n$1"), // level info above the header
	74: (s) => s.replace("[Friendzie's](https://levelhead.io/+xk501kr)", "[Friendzie's](https://levelhead.io/@slbx5z)"),
	66: (s) => s.replace("## Highlights:", "# Highlights:"),
	61: (s) => s.replace("[Calyris's](https://levelhead.io/+0lwl011)", "[Calyris's](https://levelhead.io/@0v13kb)"),
	38: (s) => s.replace("[SchuhBaum's](https://levelhead.io/03w4c4)", "[SchuhBaum's](https://levelhead.io/@03w4c4)"),
	7: (s) => s.replace("[Sephy](https://lvlhd.co/+f7km4h7)","[Sephy](https://lvlhd.co/@95rrwp)"),
	5: (s) => s.replace("[Stratonian](https://lvlhd.co/+r798bmx)","[Stratonian](https://lvlhd.co/@83dr8d)"),
	2: (s) => {
		return s.replace("[Ps7cho](https://lvlhd.co/+0057xdz)", "[Ps7cho](https://lvlhd.co/@xppvz7)")
			.replace("[Popdonk Baggycool](6rad6u)", "[Popdonk Baggycool](https://lvlhd.co/@6rad6u)")
			.replace("[Beevall](https://lvlhd.co/+vt46xnv)", "[Beevall](https://lvlhd.co/@nczvz5)");
	},
}

export async function dlSpotlightContents() {
	art.haveFolder("spotlights");
	const spotlights = await art.get("rawSpotlights.json");
	for (const spotlight of spotlights) {
		const number = getSpotlightNumber(spotlight);
		if (number % 15 == 0) {
			console.log(`Downloading ${number}...`);
		}
		let contents: string = await bscotch.getBlogContents(spotlight.name);
		if (number in patches) {
			let oldContents = contents;
			contents = patches[number](contents);
			if (contents == oldContents) {
				console.error(`Patch at ${number} failed!`);
			}
		}
		spotlight.contents = contents;
		await art.putRaw(`spotlights/${number}.md`, contents);
		sleep(50); // Us? Getting a 429? We would neveeeeeeeeeeeeeeer
	}
	await art.put("spotlights.json",spotlights);
}

export async function stats() {
	const searches = [
		"chaoshead",
		"highlight",
		"paragon",
		"/games/levelhead/"
	];
	const mdSearches = [
		"level",
		"highlightRegex",
		"other",
	];
	
	class SearchStat {
		count = 0;
		appearences: number[] = [];
		add(spotlight: any) {
			this.appearences.push(getSpotlightNumber(spotlight));
			this.count++;
		}
	}
	
	const stats: Record<string, SearchStat> = {};
	for (const group of searches) {
		stats[group] = new SearchStat();
	}
	for (const group of mdSearches) {
		stats[group] = new SearchStat();
	}
	
	const spotlights = await art.get("spotlights.json");
	for (const spotlight of spotlights) {
		for (const needle of searches) {
			const haystack: string = spotlight.contents;
			if (haystack.toLowerCase().includes(needle)) {
				stats[needle].add(spotlight)
			}
		}
		const md = parseMarkdown(spotlight.contents);
		let otherAdded = false;
		md.visit((section) => {
			if (!section.header) return true;
			if (/^(featured )?level(s| )/is.test(section.header)) {
				stats.level.add(spotlight)
				return false
			} else if (/(^highlight(s|ed( levels?)?)?|dev(eveloper)?s? fav)/is.test(section.header)) {
				stats.highlightRegex.add(spotlight)
				return false
			} else if (!otherAdded) {
				stats.other.add(spotlight);
				otherAdded = true;
			}
			return true;
		})
	}
	
	await art.put("stats.json", stats);
}


// SPOTLIGHT PARSING


// Regexes

const LEVEL_SECTION_REGEX = /^(featured )?levels?:?$/si;
const VIEWINGS_HEADER_REGEX = /^(featured )?viewings?:?$/si;
//Exceptions built-in because that was easier at the start than adding CUSTOM_REGEXES support for this one
//TODO split into system like the ignorable links
const ANNOUNCEMENT_SECTION_REGEX = /(^nominate next|WHATTTTTTTTTT|THE SPOTLIGHT|220 days)|((announcement|happening|bulletin board|community calling)s?:?$)/si;
const FANART_SECTION_REGEX = /^(fan|featured|birthday) ?(art|creations)/si;

const LEVEL_LINK_CODE_REGEX = /(?<=(levelhead.io|lvlhd.co)\/\+)[0-9a-z]+/si;

// Exceptions & static data needed:

const LAST_NON_COMMUNITY_SPOTLIGHT = 146;
const LAST_SPOTLIGHT_WITHOUT_LEVELS_SECTION = 50;
const NO_LEVELS = [ //WIP auto-detect recaps?
	146, // paragons & farewell
	140, // favs
	139, // prevs
	88, // new year
	83, // prevs
	62, // prevs
	32, // prevs
];
const IGNORABLE_LINKS: RegExp[] = [ // links which can be ignored in a level/highlights section
	/@|bscotch\.net\/games\/levelhead\/players/si, // level author
	/levelcup.net/si, // levelcup
	/^https:\/\/www.google.com\/search\?q=lightning\+bolt\+pose/si, // spotlight 64
	/^(https?:\/\/)?youtu.be\//si, //spotlight 48 and 38
	/youtube.com\/watch/si, // spotlight 43 and 4 others
	/youtube.com\/embed/si, //spotlight 5
	/(^discord\.gg|discordapp.com\/invite)\/bscotch$/,
	/reddit\.com\/r\/levelhead\/comments/, // spotlight 20
];
let KNOWN_MULTIPLE_LEVEL_SECTIONS: {
	[key: number]: string
} = {
	70: "Fire Away",
	47: "Two is better than one",
	45: "Hearts & Flowers",
	26: "Double the fun",
	19: "The big century!",
	13: "Hiding is speeding!",
	12: "Steek Hutsy tests our reflexes",
	2: "Race Way levels to bookmark",
};
const CUSTOM_REGEXES: {
	[key: number]: {
		levels: RegExp,
		viewings: RegExp
	}
} = {
	112: {
		levels: /^vacation featured levels$/si,
		viewings: /^vacation featured viewings$/si,
	},
	110: {
		levels: /^picnic activities:?$/si,
		viewings: /^picnic break:?$/si,
	},
	107: {
		levels: LEVEL_SECTION_REGEX,
		viewings: /^video evidence:?$/si,
	},
	106: {
		levels: /^featured journies:?$/si,
		viewings: /^featured viewing breaks:?$/si,
	},
	105: {
		levels: /^birthday levels:?$/si,
		viewings: /^birthday viewings:?$/si,
	},
	104: {
		levels: /^featured levels:?$/si,
		viewings: /^outdoor viewings:?$/si,
	},
	103: {
		levels: /^featured rides:?$/si,
		viewings: /^featured viewings:?$/si,
	},
	102: {
		levels: /^builders workshop:?$/si,
		viewings: /^corporate camera:?$/si,
	},
	101: {
		levels: /^builders workshop:?$/si,
		viewings: /^run highlights:?$/si,
	},
	100: {
		levels: /^wonders of the world:?$/si,
		viewings: /^onwards & upwards:?$/si,
	},
	73: {
		levels: LEVEL_SECTION_REGEX,
		viewings: /^indielands$/si, // maybe more of an event
	},
};

interface SpotlightInfo {
	number: number;
	link: string;
	timestamp: string;
	warnings: string[];
	
	noLevels: boolean; // whether does intentionally have no levels (fixed list, if it has no levels otherwise it's a parsing error)
	community: boolean; // whether this spotlight has been made by the community (147 and up)
	levels: bscotch.LevelCode[];
	highlights: bscotch.LevelCode[];
}

class SpotlightParser implements SpotlightInfo {
	number: number;
	link: string;
	timestamp: string;
	warnings: string[] = [];
	
	noLevels: boolean;
	community: boolean;
	levels: bscotch.LevelCode[] = [];
	highlights: bscotch.LevelCode[] = [];
	
	constructor(spotlight: BlogPost) {
		this.number = getSpotlightNumber(spotlight);
		this.link = `https://www.bscotch.net/post/${spotlight.name}`;
		this.timestamp = spotlight.createdAt;
		this.community = this.number > LAST_NON_COMMUNITY_SPOTLIGHT;
		if (NO_LEVELS.includes(this.number)) {
			this.noLevels = true;
			// WIP Parse other stuff even if there're no levels
		} else {
			this.noLevels = false;
			this.parse(spotlight);
		}
	}
	
	warn(section: MarkdownSection|string, n: number, desc: string) {
		let label;
		if (typeof section == "string") {
			label = section;
		} else {
			label = section.header;
		}
		this.warnings.push(`W${n} at ${label}: ${desc}`)
	}
	
	getLevelRegex(): RegExp {
		if (this.number in CUSTOM_REGEXES) {
			return CUSTOM_REGEXES[this.number].levels
		}
		return LEVEL_SECTION_REGEX;
	}
	getViewingRegex(): RegExp {
		if (this.number in CUSTOM_REGEXES) {
			return CUSTOM_REGEXES[this.number].viewings
		}
		return VIEWINGS_HEADER_REGEX
	}
	isLegacy(): boolean {
		return this.number<=LAST_SPOTLIGHT_WITHOUT_LEVELS_SECTION;
	}
	
	canIgnoreLinkNextToLevel(link: string): boolean {
		for (const regex of IGNORABLE_LINKS) {
			if (regex.test(link)) {
				return true;
			}
		}
		return false;
	}
	hasKnownMultipleLevels(section: MarkdownSection): boolean {
		if (section.header == KNOWN_MULTIPLE_LEVEL_SECTIONS[this.number]) {
			return true;
		}
		return false;
	}
	
	parseLevel(levelSection: MarkdownSection): boolean {
		//TODO allow no level links but other links for early spotlights without dedicated levels section
		if (levelSection.subsections.length>0) {
			//A level section has subsection
			this.warn(levelSection, 14, "level has subsections");
		}
		let done = false;
		let otherLinks = [];
		for (const link of levelSection.getLinks()) {
			if (link.isImage) continue; // don't care about images
			
			const code = link.to.match(LEVEL_LINK_CODE_REGEX);
			if (code) {
				if (done && !this.hasKnownMultipleLevels(levelSection)) {
					this.warn(levelSection, 11, `multiple level links: ${link.to}`);
				}
				this.levels.push(code[0]);
				done = true;
			} else {
				otherLinks.push(link);
			}
		}
		if (done) {
			let nonIgnorableLink: boolean|string = false;
			for (let link of otherLinks) {
				if (!this.canIgnoreLinkNextToLevel(link.to)) {
					nonIgnorableLink = link.to;
					break;
				}
			}
			if (nonIgnorableLink) {
				this.warn(levelSection, 12,`non-level link ${nonIgnorableLink}`);
			}
		} else {
			if (!(this.isLegacy() && otherLinks.length>0)) {
				//not actually a level section
				this.warn(levelSection, 13, "no level link");
			}
		}
		return false;
	}
	
	parseHighlights(section: MarkdownSection): boolean {
		if (section.subsections.length!=0) {
			this.warn(section, 24, `highlights has subsections`);
		}
		
		let links = section.getLinks()
		if (links.length == 0) {
			this.warn(section, 23, `no links in the highlights section`);
		}
		for (const link of links) {
			if (link.isImage) {
				this.warn(section, 21, `image link ${link.to} in highlights`);
			}
			if (this.canIgnoreLinkNextToLevel(link.to)) continue;
			const code = link.to.match(LEVEL_LINK_CODE_REGEX);
			if (code) {
				this.highlights.push(code[0]);
			} else {
				if (this.number<=LAST_SPOTLIGHT_WITHOUT_LEVELS_SECTION) {
					//non-level highlights are a thing here	
				} else {
					this.warn(section, 22, `non-level link ${link.to}`);
				}
			}
		}
		return false;
	}
	
	parse(spotlight: BlogPost) {
		const md = parseMarkdown(spotlight.contents);
		md.visit(section=>{
			if (!section.header) {
				this.warn(section, 1, "no header");
				return false;
			}
			if (section.header.match(this.getLevelRegex())) {
				section.visit((s) => this.parseLevel(s));
				return false;
			} else if (section.header.match(this.getViewingRegex())) {
				// WIP parse viewings
				return false;
			} else if (section.header.match(/(^(quick )?highlights?:?$)|dev favorites|highlights from the devs/si)) {
				if (this.number==31) return false; // WIP actually fan-art in this case
				this.parseHighlights(section);
				return false;
			} else if (section.header.match(/^(birthday |featured )?events?:?$/si)) {
				// WIP parse events
				return false;
			} else if (section.header.match(ANNOUNCEMENT_SECTION_REGEX)) {
				// WIP parse announcements
				return false;
			} else if (section.header.match(FANART_SECTION_REGEX)) {
				// WIP parse fan art
				return false;
			} else if (section.header.match(/paragons!?:?$/si)) {
				// WIP parse Paragons
			} else {
				if (this.isLegacy()) {
					if (section.header.match(/^quick shots$/si)) { //Spotlight 3
						section.visit((s) => this.parseHighlights(s));
						return false;
					} else if (section.header.match(/genre: the race way/si)) { //Spotlight 2
						section.visit((s) => this.parseLevel(s))
						return false;
					} else {
						// Old spotlights have their levels in the top section
						return this.parseLevel(section);
					}
				} else {
					if (section.subsections.length>0) {
						this.warn(section, 2,`unknown section with children`);
					} else {
						this.warn(section, 3,`unknown section without children`);
					}
				}
			}
			return true;
		});
		if (this.levels.length==0) {
			this.warn("$Global", 4, "no levels");
		}
	}
}

export async function parseSpotlights() {
	const out = [];
	const spotlights: BlogPost[] = await art.get("spotlights.json");
	let totalWarnings = 0;
	let lastWithWarnings = -1;
	
	for (const spotlight of spotlights) {
		const parsed = new SpotlightParser(spotlight);
		out[parsed.number] = parsed;
		totalWarnings += parsed.warnings.length;
		if (parsed.warnings.length > 0 && parsed.number > lastWithWarnings) {
			lastWithWarnings = parsed.number;
		}
	}
	
	console.log(`Parsed spotlights with ${totalWarnings} warnings. Last one with warnings is ${lastWithWarnings}`)
	await art.put("parsed.json", out);
}

