"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("timers/promises");
/**
 * 非ブロッキングI/Oのデモ用リソースクラス
 * name: string - リソースの名前
 * dataQueue: (string | null)[] - データキュー（nullはリソースのクローズを示す）
 * closed: boolean - リソースがクローズされているかどうか
 */
class Resource {
    name;
    dataQueue;
    constructor(name, dataQueue = []) {
        this.name = name;
        this.dataQueue = dataQueue;
    }
    /**
     * dataQueueにデータを追加する。
     */
    async addDataQueue(data) {
        console.log(`Adding data to ${this.name}: ${data}`);
        // データ追加の非ブロッキングI/O操作をシミュレート
        await (0, promises_1.setTimeout)(3000);
        this.dataQueue.push(data);
    }
    /**
     * 非同期的にデータを読み，込み返す。
     * 読み込んだデータはdataQueueから削除される。
     * データがなくなった場合にはclosedをtrueに設定し、"NO_DATA_AVAILABLE"を返す。
     * @returns Promise<string>
     */
    async read() {
        // 非ブロッキングI/O操作をシミュレート
        await (0, promises_1.setTimeout)(1000);
        if (this.dataQueue.length === 0) {
            return "NO_DATA_AVAILABLE";
        }
        const data = this.dataQueue.shift();
        return data || "NO_DATA_AVAILABLE";
    }
    /**
     * データを使用する
     * @param data
     */
    useData(data) {
        console.log(data);
    }
}
/**
 * busy-waiting
 * @param resources - resources: Resource[]
 */
async function busyWait(resources) {
    await Promise.all(resources.map(async (resource) => {
        console.log(`----- Start watching ${resource.name} -----`);
        while (resources.includes(resource)) {
            const data = await resource.read();
            if (data === "NO_DATA_AVAILABLE") {
                console.log(`Waiting for data on ${resource.name})...`);
                continue;
            }
            console.log(`Data received on ${resource.name}!`);
            resource.useData(data);
        }
    }));
}
async function main() {
    const socketA = new Resource("socketA", []);
    const socketB = new Resource("socketB", []);
    const socketC = new Resource("socketC", []);
    // busyWaitを非同期で開始し、awaitしないことで、後続のコードも実行できるようにする
    const busyWaitPromise = busyWait([socketA, socketB, socketC]);
    // データ追加のシミュレーション
    await socketA.addDataQueue("sample data A");
    await socketB.addDataQueue("sample data B");
    // すべてのリソース監視が完了するまで待機（実際には完了しないので、Ctrl+Cで終了する必要があります）
    await busyWaitPromise;
}
main();
//# sourceMappingURL=busy_wait.js.map