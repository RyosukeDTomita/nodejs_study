import { setTimeout } from "timers/promises";
// 型定義
type EventResources = { resource: Resource };

/**
 * 非ブロッキングI/Oのデモ用リソースクラス
 * name: string - リソースの名前
 * dataQueue: (string | null)[] - データキュー（nullはリソースのクローズを示す）
 */
class Resource {
  name: string;
  dataQueue: (string | null)[];
  listeners: (() => void)[] = [];

  constructor(name: string, dataQueue: (string | null)[] = []) {
    this.name = name;
    this.dataQueue = dataQueue;
  }

  /**
   * dataQueueにデータを追加する。
   * @param data: string - 追加するデータ
   */
  async addDataQueue(data: string) {
    console.log(`Trying to Add data to ${this.name}: ${data}`);
    await setTimeout(3000);
    this.dataQueue.push(data);
    this.emit();
  }

  /**
   * 非同期的にデータを読み，込み返す。
   * 読み込んだデータはdataQueueから削除される。
   * データがなくなった場合にはclosedをtrueに設定し、"NO_DATA_AVAILABLE"を返す。
   * @returns Promise<string>
   */
  async read(): Promise<string> {
    await setTimeout(1000);
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
  useData(data: string) {
    console.log("use", data);
  }

  /**
   * データが準備できたときに呼び出されるコールバックを登録する。
   * @param callback
   */
  onDataReady(callback: () => void) {
    this.listeners.push(callback);
  }

  /**
   * addDataQueue終了時に呼び出され，listenerに登録されたコールバックを実行する。
   */
  private emit() {
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
   * @returns Promise<EventResources[]> - データが準備できたリソースのイベント
   */
  async watch(resources: Resource[]): Promise<EventResources[]> {
    return new Promise((resolve) => {
      // イベントが発生するまでは待機する
      console.log("Waiting for events...");
      const ready: EventResources[] = [];
      let waiting = resources.length;

      for (const resource of resources) {
        resource.read().then((data) => {
          if (data == "NO_DATA_AVAILABLE") {
            // データがない場合にはリソースが準備できたときに呼び出されるコールバックを登録する。
            resource.onDataReady(() => {
              resolve([{ resource }]);
            });
          } else {
            ready.push({ resource });
            waiting--;
            if (waiting === 0) {
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
 * 1. イベント=addDataQueueが終了するまではwatch()は終了せず，待機する。
 * 2. addDataQueueが終了時にemit()が呼び出され、登録されたコールバックが実行される。
 * 3. watch()はresolveされ、データが準備できたリソースを返す。
 * 4. watch()が返すリソースをもとに，データを取得して使用する。
 * 
 * @param resources 
 */
async function demultiplexedWait(resources: Resource[]) {
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
  await setTimeout(5000);
  await socketA.addDataQueue("sample data A");
  await socketB.addDataQueue("sample data B");

  await waitPromise; // Ctrl+Cで手動停止
}

main();
