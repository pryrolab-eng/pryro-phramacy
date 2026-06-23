import { Queue, QueueEvents } from "bullmq";
import { getRedisConnection } from "./redis";

export type MaintenanceNotifyJobData = {
  email: string;
  message: string;
  scheduledAt: string;
  batchId: string;
};

export type MaintenanceNotifyJobResult = {
  email: string;
  sent: boolean;
  error?: string;
};

const QUEUE_NAME = "maintenance-notify";

let _queue: Queue | null = null;

export function getMaintenanceNotifyQueue(): Queue {
  if (!_queue) {
    _queue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });
  }
  return _queue;
}

let _queueEvents: QueueEvents | null = null;

export function getMaintenanceNotifyQueueEvents(): QueueEvents {
  if (!_queueEvents) {
    _queueEvents = new QueueEvents(QUEUE_NAME, {
      connection: getRedisConnection(),
    });
  }
  return _queueEvents;
}

export { QUEUE_NAME as MAINTENANCE_NOTIFY_QUEUE };
