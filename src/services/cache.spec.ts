import { ok } from "@/core/result";
import { CALC_VERSION } from "@/core/types";
import {
  cacheKey,
  createMemoryCache,
  createPersistentCache,
  type CachedResult,
  type KeyValueStorage,
} from "@/services/cache";
import { processBatch, type GridReader, type InputFile } from "@/services/process-batch";
import { sampleGrid } from "@/tests/helpers";

const STORAGE_KEY = "planilhas-anna:cache";
const EMPTY_FILE_RESULT: CachedResult = { status: "failed", errors: [{ code: "EmptyFile" }] };

const encode = (text: string) => new TextEncoder().encode(text);

const file = (name: string, content = "content A"): InputFile => ({
  name,
  arrayBuffer: async () => encode(content).buffer as ArrayBuffer,
});

/** Fake reader that records what it read. */
function countingReader() {
  const calls: string[] = [];
  const read: GridReader = (bytes) => {
    calls.push(new TextDecoder().decode(bytes));
    return ok(sampleGrid());
  };
  return { read, calls };
}

function fakeStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

describe("service: cacheKey", () => {
  const sut = cacheKey;

  it("should give the same key for the same content and another key for other content", async () => {
    const key = await sut(encode("abc"));
    expect(key).toBe(await sut(encode("abc")));
    expect(key).not.toBe(await sut(encode("abd")));
  });

  it("should include the rules version", async () => {
    expect(await sut(encode("abc"))).toBe(
      `v${CALC_VERSION}:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`,
    );
  });
});

describe("service: processBatch with a cache", () => {
  it("should not recompute the same content, even under another name", async () => {
    const cache = createMemoryCache();
    const { read, calls } = countingReader();

    const first = await processBatch([file("exp1.xls")], { read, cache });
    const second = await processBatch([file("exp1 (cópia).xls"), file("exp2.xls", "content B")], {
      read,
      cache,
    });

    expect(calls).toEqual(["content A", "content B"]);
    expect(first[0].cached).toBe(undefined);
    expect(second[0].cached).toBe(true);
    expect(second[0].fileName).toBe("exp1 (cópia).xls");
    expect(second[0].id).not.toBe(first[0].id);
    expect(second[1].cached).toBe(undefined);

    const withoutIdentity = ({
      id: _id,
      fileName: _name,
      cached: _cached,
      ...rest
    }: (typeof first)[number]) => rest;
    expect(withoutIdentity(second[0])).toEqual(withoutIdentity(first[0]));
  });

  it("should serve the second copy of a file from the cache in the same batch", async () => {
    const { read, calls } = countingReader();
    const reports = await processBatch([file("a.xls"), file("b.xls")], {
      read,
      cache: createMemoryCache(),
    });
    expect(calls).toHaveLength(1);
    expect(reports.map((r) => r.cached ?? false)).toEqual([false, true]);
  });

  it("should not cache an unexpected reader error", async () => {
    const cache = createMemoryCache();
    let shouldFail = true;
    const read: GridReader = () => {
      if (shouldFail) throw new Error("Temporary failure");
      return ok(sampleGrid());
    };
    const [first] = await processBatch([file("x.xls")], { read, cache });
    expect(first.status).toBe("failed");
    expect(cache.size).toBe(0);

    shouldFail = false;
    const [second] = await processBatch([file("x.xls")], { read, cache });
    expect(second.status).toBe("ok");
    expect(second.cached).toBe(undefined);
  });

  it("should recompute everything without a cache", async () => {
    const { read, calls } = countingReader();
    await processBatch([file("a.xls"), file("a.xls")], { read });
    expect(calls).toHaveLength(2);
  });
});

describe("service: createPersistentCache", () => {
  const sut = createPersistentCache;

  it("should survive a page reload", async () => {
    const storage = fakeStorage();
    const { read, calls } = countingReader();
    await processBatch([file("exp1.xls")], { read, cache: sut(storage) });

    const [report] = await processBatch([file("exp1.xls")], { read, cache: sut(storage) });
    expect(calls).toHaveLength(1);
    expect(report.cached).toBe(true);
  });

  it("should clear everything, storage included", () => {
    const storage = fakeStorage();
    const cache = sut(storage);
    cache.set(`v${CALC_VERSION}:aa`, EMPTY_FILE_RESULT);
    expect(storage.data.size).toBe(1);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(storage.data.size).toBe(0);
  });

  it("should drop the oldest entries past the limit", () => {
    const cache = sut(fakeStorage(), { storageKey: "k", maxEntries: 2 });
    cache.set("v1:a", EMPTY_FILE_RESULT);
    cache.set("v1:b", EMPTY_FILE_RESULT);
    cache.set("v1:c", EMPTY_FILE_RESULT);
    expect(cache.size).toBe(2);
    expect(cache.get("v1:a")).toBe(undefined);
    expect(cache.get("v1:c")).toEqual(EMPTY_FILE_RESULT);
  });

  it("should ignore corrupted data and entries from an old rules version", () => {
    const storage = fakeStorage();
    storage.setItem(STORAGE_KEY, "{not json");
    expect(sut(storage).size).toBe(0);

    const oldEntry = { "v0:abc": { savedAt: 1, value: { status: "ok", panels: {} } } };
    storage.setItem(STORAGE_KEY, JSON.stringify(oldEntry));
    expect(sut(storage).size).toBe(0);
  });

  it("should keep working from memory when the storage is full", () => {
    const storage: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
    };
    const cache = sut(storage);
    cache.set("v1:a", EMPTY_FILE_RESULT);
    expect(cache.size).toBe(1);
  });
});
