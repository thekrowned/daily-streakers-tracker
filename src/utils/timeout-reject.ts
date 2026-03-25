// For use with Promise.race

function timeoutReject(timeMs: number) {
	return new Promise<void>((resolve, reject) => {
		setTimeout(() => reject("Timeout"), timeMs);
	});
}

export { timeoutReject };
