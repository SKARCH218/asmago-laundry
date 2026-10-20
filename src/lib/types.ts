export type JobState = "idle" | "running" | "paused" | "complete" | "offline";

export interface DeviceView {
  deviceId: string;
  label: string;
  kind: "washer" | "dryer";
  jobState: JobState;
  remainingSeconds: number | null;
  remainingEndAt: number | null;
  completedAt: number | null;
  roomId: string;
  index: string; // 보통 "1","2"... 이지만 "9A"/"9B"처럼 문자가 붙을 수 있음
}
