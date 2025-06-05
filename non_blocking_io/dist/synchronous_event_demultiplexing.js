"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("timers/promises");
/**
 * 非ブロッキングI/Oのデモ用リソースクラス
 * name: string - リソースの名前
 * dataQueue: (string | null)[] - データキュー（nullはリソースのクローズを示す）
 */
class Resource {
    name;
    dataQueue;
    listeners = [];
    constructor(name, dataQueue = []) {
        this.name = name;
        this.dataQueue = dataQueue;
    }
    /**
     * dataQueueにデータを追加する。
     * @param data: string - 追加するデータ
     */
    async addDataQueue(data) {
        console.log(`Trying to Add data to ${this.name}: ${data}`);
        await (0, promises_1.setTimeout)(3000);
        this.dataQueue.push(data);
        this.emit();
    }
    /**
     * 非同期的にデータを読み，込み返す。
     * 読み込んだデータはdataQueueから削除される。
     * データがなくなった場合にはclosedをtrueに設定し、"NO_DATA_AVAILABLE"を返す。
     * @returns Promise<string>
     */
    async read() {
        await (0, promises_1.setTimeout)(1000);
        if (this.dataQueue.length === 0) {
            return "NO_DATA_AVAILABLE";
        }
        const data = this.dataQueue.shift();
        return data || "NO_DATA_AVAILABLE";
    }
    /**
     * データを使用する
     * NOTE: ここではコンソールに出力するだけだが，実際には何らかの処理を行うことが想定される。
     * @param data 使うデータ
     */
    useData(data) {
        console.log("use", data);
    }
    /**
     * データが準備できたときに呼び出されるコールバックを登録する。
     * @param callback
     */
    onDataReady(callback) {
        this.listeners.push(callback);
    }
    /**
     * データが準備できたときに登録されたコールバックを呼び出す。
     */
    emit() {
        for (const listener of this.listeners) {
            listener();
        }
        this.listeners = [];
    }
}
/**
 * イベント多重分離のサンプル
 */
class Demultiplexer {
    /**
     * 複数のリソースを監視し、データが準備できたリソースのイベントを返す。
     * @param resources - 監視するリソースの配列
     * @returns Promise<Event[]> - データが準備できたリソースのイベント
     */
    async watch(resources) {
        return new Promise((resolve) => {
            console.log("Watching resources for data...");
            const ready = [];
            let waiting = resources.length;
            for (const resource of resources) {
                resource.read().then((data) => {
                    if (data !== "NO_DATA_AVAILABLE") {
                        ready.push({ resource });
                        waiting--;
                        if (waiting === 0) {
                            resolve(ready);
                        }
                    }
                    else {
                        resource.onDataReady(() => {
                            resolve([{ resource }]);
                        });
                    }
                });
            }
        });
    }
}
async function demultiplexedWait(resources) {
    const demultiplexer = new Demultiplexer();
    while (true) {
        const events = await demultiplexer.watch(resources);
        for (const event of events) {
            console.log(`Event detected from ${event.resource.name}`);
            const data = await event.resource.read();
            if (data !== "NO_DATA_AVAILABLE") {
                console.log(`Data received on ${event.resource.name}!`);
                event.resource.useData(data);
            }
        }
    }
}
async function main() {
    const socketA = new Resource("socketA", []);
    const socketB = new Resource("socketB", []);
    const socketC = new Resource("socketC", []);
    // 非同期で開始し、awaitしないことで、後続のコードも実行できるようにする
    const waitPromise = demultiplexedWait([socketA, socketB, socketC]);
    // 5秒後にデータを追加を呼び出す
    await (0, promises_1.setTimeout)(5000);
    await socketA.addDataQueue("sample data A");
    await socketB.addDataQueue("sample data B");
    await waitPromise; // Ctrl+Cで手動停止
}
main();
//# sourceMappingURL=synchronous_event_demultiplexing.js.map