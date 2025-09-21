export function assertNumber(number: unknown): number {
	if (typeof number != "number") {
		throw new Error(`${number} is not a number!`);
	}
	// Additionally checks whether it's NaN
	if (isNaN(number)) {
		throw new Error(`${number} is a NaN!`);
	}
	return number;
}

export function assertString(string: unknown): string {
	if (typeof string != "string") {
		throw new Error(`${string} is not a string!`);
	}
	return string;
}
