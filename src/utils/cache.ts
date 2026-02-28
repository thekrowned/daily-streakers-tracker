const Cache = class {
	static #map = new Map<string, { data: any; expire: number }>();

	static get = function (cacheName: string) {
		const existingCache = Cache.#map.get(cacheName);
		const currentMs = new Date().getTime();

		if (existingCache && existingCache.expire > currentMs) {
			return existingCache?.data;
		} else {
			return undefined;
		}
	};

	static set = function (
		cacheName: string,
		cacheData: any,
		maxAgeMs: number = 60000,
	) {
		const currentMs = new Date().getTime();
		Cache.#map.set(cacheName, {
			data: cacheData,
			expire: currentMs + maxAgeMs,
		});
	};
};

export { Cache };
