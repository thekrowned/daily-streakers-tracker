export function convertNumber(number: unknown): number {
	const converted = Number(number);

	if (isNaN(converted)) {
		throw new Error(`Can't convert ${number} to number!`);
	}

	return converted;
}
