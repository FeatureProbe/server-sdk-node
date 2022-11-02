"use strict";

import pino from "pino";

require("isomorphic-fetch");
import pkg from "../package.json";

const UA = `Node/${pkg.version}`;

interface IAccessEvent {
  time: number;
  key: string;
  value: any;
  index: number;
  version: number;
  reason: string | null;
}

interface IToggleCounter {
  value: any;
  version: number;
  index: number;
  count: number;
}

interface IAccess {
  startTime: number;
  endTime: number;
  counters: { [key: string]: IToggleCounter[] };
}

export class EventRecorder {
  private _serverSdkKey: string;
  private _eventsUrl: string;

  private _closed: boolean;
  private _sendQueue: IAccessEvent[];
  private _taskQueue: AsyncBlockingQueue<Promise<void>>;
  private _timer: NodeJS.Timer;
  private readonly _dispatch: Promise<void>;

  private readonly _logger?: pino.Logger;

  get serverSdkKey(): string {
    return this._serverSdkKey;
  }

  set serverSdkKey(value: string) {
    this._serverSdkKey = value;
  }

  get eventsUrl(): string {
    return this._eventsUrl;
  }

  set eventsUrl(value: string) {
    this._eventsUrl = value;
  }

  set flushInterval(value: number) {
    clearInterval(this._timer);
    this._timer = setInterval(() => this.flush(), value);
  }

  constructor(serverSdkKey: string,
              eventsUrl: URL | string,
              flushInterval: number,
              logger?: pino.Logger) {
    this._serverSdkKey = serverSdkKey;
    this._eventsUrl = new URL(eventsUrl).toString();
    this._closed = false;
    this._sendQueue = [];
    this._taskQueue = new AsyncBlockingQueue<Promise<void>>();
    this._timer = setInterval(() => this.flush(), flushInterval);
    this._dispatch = this.startDispatch();
    this._logger = logger;
  }

  public record(event: IAccessEvent) {
    if (this._closed) {
      this._logger?.warn("Trying to push access record to a closed EventProcessor, omitted");
      return;
    }
    this._sendQueue.push(event);
  }

  public flush() {
    if (this._closed) {
      this._logger?.warn("Trying to flush a closed EventProcessor, omitted");
      return;
    }
    this._taskQueue.enqueue(this.doFlush());
  }

  public async stop(): Promise<void> {
    if (this._closed) {
      this._logger?.warn("EventProcessor is already closed");
      return;
    }
    clearInterval(this._timer);
    this._closed = true;
    this._taskQueue.enqueue(this.doFlush());
    await this._dispatch;
  }

  private async startDispatch(): Promise<void> {
    while (!this._closed || !this._taskQueue.isEmpty()) {
      await this._taskQueue.dequeue();
    }
  }

  private static prepareSendData(events: IAccessEvent[]): IAccess {
    let start = -1, end = -1;
    const counters: { [key: string]: IToggleCounter[] } = {};
    for (const event of events) {
      if (start < 0 || start < event.time) {
        start = event.time;
      }
      if (end < 0 || end > event.time) {
        end = event.time;
      }

      if (counters[event.key] === undefined) {
        counters[event.key] = [];
      }
      let added = false;
      for (const counter of counters[event.key]) {
        if (counter.index === event.index
          && counter.version === event.version
          && counter.value === event.value) {
          counter.count++;
          added = true;
          break;
        }
      }
      if (!added) {
        counters[event.key].push({
          index: event.index,
          version: event.version,
          value: event.value,
          count: 1
        } as IToggleCounter);
      }
    }
    return {
      startTime: start,
      endTime: end,
      counters: counters
    } as IAccess;
  }

  private async doFlush(): Promise<void> {
    if (this._sendQueue.length === 0) {
      return;
    }
    const events = Object.assign([], this._sendQueue);
    this._sendQueue = [];
    const eventRepos = [{
      events: events,
      access: EventRecorder.prepareSendData(events)
    }];

    await fetch(this._eventsUrl, {
      method: "POST",
      cache: "no-cache",
      headers: {
        Authorization: this._serverSdkKey,
        "Content-Type": "application/json",
        UA: UA
      },
      body: JSON.stringify(eventRepos)
    })
      .then(resp =>
        this._logger?.debug(resp, "Http response (event push)"))
      .catch(err =>
        this._logger?.error(err, "Failed to report access events")
      );
  }
}

// cred: https://stackoverflow.com/questions/47157428/how-to-implement-a-pseudo-blocking-async-queue-in-js-ts
class AsyncBlockingQueue<T> {
  private _promises: Promise<T>[];
  private _resolvers: ( (t: T) => void )[];

  constructor() {
    this._resolvers = [];
    this._promises = [];
  }

  private _add() {
    this._promises.push(new Promise(resolve => {
      this._resolvers.push(resolve);
    }));
  }

  enqueue(t: T) {
    if (!this._resolvers.length) {
      this._add();
    }
    this._resolvers.shift()?.(t);
  }

  dequeue(): Promise<T> {
    if (!this._promises.length) {
      this._add();
    }
    return this._promises.shift()!;
  }

  isEmpty() {
    return !this._promises.length;
  }
}
