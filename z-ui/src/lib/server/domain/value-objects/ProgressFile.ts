export interface ProgressFileDescriptor {
	progressKey: string;
	metadataFileName: string;
	extension: string;
	baseName: string;
}

export function extractSummaryModified(content: string): string | null {
	const match = content.match(/\["summary"\][\s\S]*?\["modified"\]\s*=\s*"(\d{4}-\d{2}-\d{2})"/);
	return match?.[1] ?? null;
}

export function buildProgressFileDescriptor(title: string): ProgressFileDescriptor {
	const lastDot = title.lastIndexOf('.');
	if (lastDot <= 0 || lastDot === title.length - 1) {
		throw new Error('Invalid title format. Expected filename with extension.');
	}

	const extension = title.slice(lastDot + 1);
	const baseName = title.slice(0, lastDot);
	const metadataFileName = `metadata.${extension}.lua`;
	const progressKey = `${baseName}.sdr/${metadataFileName}`;

	return { progressKey, metadataFileName, extension, baseName };
}

export function normalizeProgressLookupTitle(targetTitle: string): string {
	const lastUnderscoreIndex = targetTitle.lastIndexOf('_');
	if (lastUnderscoreIndex <= 0) {
		return targetTitle;
	}

	const titlePart = targetTitle.substring(0, lastUnderscoreIndex);
	const idPart = targetTitle.substring(lastUnderscoreIndex);
	return titlePart.replace(/_/g, ' ') + idPart;
}
