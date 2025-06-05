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
     * addDataQueue終了時に呼び出され，listenerに登録されたコールバックを実行する。
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
     * 複数のリソースを管理し，イベントが発生していないResourceにはコールバックを登録する。
     * イベントが発生したResourceがあれば
     * @param resources - Resource[] - 監視するリソースの配列
     * @returns Promise<EventResources[]> - データが準備できたリソースのイベント
     */
    async watch(resources) {
        return new Promise((resolve) => {
            // イベントが発生するまでは待機する
            console.log("Waiting for events...");
            const ready = []; // イベント発生中のリソースの配列
            let waiting = resources.length;
            for (const resource of resources) {
                console.log(`Watching resource: ${resource.name}`);
                resource.read().then((data) => {
                    if (data == "NO_DATA_AVAILABLE") {
                        // データがない場合にはリソースが準備できたときに呼び出されるコールバック関数として，Promiseを解決する関数を登録する。
                        resource.onDataReady(() => {
                            resolve([{ resource }]);
                        });
                    }
                    else {
                        // データがある場合にはイベント発生中のリソースの配列に追加する。
                        ready.push({ resource });
                        waiting--;
                        if (waiting === 0) {
                            // NOTE: JSではPromiseオブジェクトを完了するための関数としてresolve()を使用する。
                            // resolve(ready)がよびだされるとPromiseは完了する。
                            resolve(ready);
                        }
                    }
                });
            }
        });
    }
}
/**
 * 以下を無限ループする
 * 1. イベント(addDataQueue)が終了するまではwatch()は終了せず，待機する。この歳にデータが準備できた歳に実行するコールバック関数を登録する。
 * 2. イベント(addDataQueue)が発生する。その終了時にemit()が呼び出され、登録されたコールバックが実行される。
 * 3. watch()が終了し、データが準備できたResource[]を返す。
 * 4. Resourceに格納されているデータを読み込み，使用する。
 *
 * @param resources
 */
async function demultiplexedWait(resources) {
    const demultiplexer = new Demultiplexer();
    while (true) {
        // NOTE: watch()はリソースの準備ができるまで終了しないので，定期的にリソースを監視するbusy-waitingよりも効率的。
        const events = await demultiplexer.watch(resources);
        console.log("watch() returned with events:", events.length);
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