type LinkInfo = {
	//inList: boolean,
	to: string,
	label: string,
	isImage: boolean;
	//isList: boolean;
}

const splitRegex = /^(?<contents>.*?\n *)?(?<level>#+)(?<header>[^\n]+)(?<rest>.*)$/s
//Apparently newlines are allowed in links
const linkRegex = /(?<image>!)?\[(?<label>[^[\]]*)\]\((?<to>[^()]*)\)/gsi
const rawLinkRegex = /(?<!\()(https?:\/\/\S+)(?!\))/gsi;

export class MarkdownSection {
	level = 0;
	header?: string;
	contents?: string;
	subsections: this[] = [];
	parent?: this;
	
	add(child: this) {
		this.subsections.push(child);
		child.parent = this;
	}
	
	/** Calls callback on each section, in a depth-first search.
	 * If the callback returns false, that section's children will be skipped.
	 */
	visit(callback: (section: this) => boolean) {
		for (const child of this.subsections) {
			const visitChildren = callback(child);
			if (visitChildren) child.visit(callback);
		}
	}
	
	getLinks(): LinkInfo[] {
		const out: LinkInfo[] = [];
		if (this.contents) {
			const matches = this.contents.matchAll(linkRegex);
			for (const match of matches) {
				out.push({
					// We now the groups exist due to how the regex is defined
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					to: match.groups!.to,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					label: match.groups!.label,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					isImage: match.groups!.image ? true : false, //Ternary to turn it's existence into a boolean
				});
			}
			const rawMatches = this.contents.matchAll(rawLinkRegex);
			for (const match of rawMatches) {
				out.push({
					to: match[1],
					label: match[1],
					isImage: false,
				});
			}
		}
		return out;
	}
}



export function parseMarkdown(raw: string): MarkdownSection {
	const root = new MarkdownSection();
	let current = root;
	while (true) {
		const match = splitRegex.exec(raw);
		if (match && match.groups) {
			raw = match.groups.rest;
			const level = match.groups.level.length;
			const contents = match.groups.contents
			if (contents && contents.trim() != "") {
				current.contents = contents.trim();
			}
			
			const next = new MarkdownSection();
			next.level = level;
			next.header = match.groups.header.trim();
			
			while (current.level+1 > level) {
				if (!current.parent) {
					throw "Something went very wrng when parsing markdown!"
				}
				current = current.parent
			}
			
			current.add(next);
			current = next;
		} else {
			//no headers left
			current.contents = raw.trim();
			break;
		}
	}
	return root;
}