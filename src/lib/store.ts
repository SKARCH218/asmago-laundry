import fs from "fs";
import path from "path";

// 기기별 "완료 시각"을 저장하는 최소 상태 저장소.
// 로컬 개발: JSON 파일. 서버리스 배포 시에는 이 파일의 함수 시그니처를
// 그대로 유지한 채 Vercel KV / Upstash Redis 호출로 교체하면 된다.
//
// 완료 후 실제로 빨래를 가져갔는지는 센서가 없어 확인할 수 없다(도어/무게 센서 미지원).
// 그래서 "가져감 확인" 절차 없이, 완료 후 일정 시간이 지나면 그냥 대기중으로 간주하고 넘어간다.
export const COMPLETION_TIMEOUT_MS = 5 * 60 * 1000; // 완료 후 5분 지나면 대기중으로 표시

interface DeviceMeta {
  completedAt: number | null; // 완료 감지 시각 (ms epoch)
  lastJobState: string | null;
}

const DATA_FILE = path.join(process.cwd(), ".data", "laundry-state.json");

function readAll(): Record<string, DeviceMeta> {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, DeviceMeta>) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function getMeta(deviceId: string): DeviceMeta {
  const all = readAll();
  return all[deviceId] ?? { completedAt: null, lastJobState: null };
}

// 새로 폴링한 jobState를 반영하고, running -> complete 전환 시 completedAt을 기록한다.
// jobState가 complete가 아니게 되면(다시 돌리기 시작하면) completedAt을 초기화한다.
export function updateJobState(deviceId: string, jobState: string, now: number): DeviceMeta {
  const all = readAll();
  const prev = all[deviceId] ?? { completedAt: null, lastJobState: null };

  let next: DeviceMeta = { ...prev, lastJobState: jobState };

  if (jobState === "complete" && prev.lastJobState !== "complete") {
    next.completedAt = now;
  } else if (jobState !== "complete") {
    next.completedAt = null;
  }

  all[deviceId] = next;
  writeAll(all);
  return next;
}

// --- Web Push 구독 저장 ---
// 브라우저(엔드포인트)별로 "어떤 기기 완료 알림을 구독 중인지" 저장한다.
// 서버리스 배포 시 위 DeviceMeta 저장소와 함께 KV/Firestore 등으로 교체.

interface PushRecord {
  subscription: unknown; // PushSubscription.toJSON() 결과
  deviceIds: string[];
}

const PUSH_FILE = path.join(process.cwd(), ".data", "push-subscriptions.json");

function readPush(): Record<string, PushRecord> {
  try {
    return JSON.parse(fs.readFileSync(PUSH_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writePush(data: Record<string, PushRecord>) {
  fs.mkdirSync(path.dirname(PUSH_FILE), { recursive: true });
  fs.writeFileSync(PUSH_FILE, JSON.stringify(data, null, 2));
}

// 특정 브라우저의 구독 목록을 통째로 교체한다 (클라이언트가 로컬에 들고 있는 전체 목록을 매번 동기화).
export function saveSubscription(endpoint: string, subscription: unknown, deviceIds: string[]) {
  const all = readPush();
  all[endpoint] = { subscription, deviceIds };
  writePush(all);
}

export function removeSubscription(endpoint: string) {
  const all = readPush();
  delete all[endpoint];
  writePush(all);
}

// 완료 알림을 보낸 기기는 모든 브라우저의 구독에서 뺀다(다음 세탁은 새로 신청). 남은 기기가 없으면 레코드도 지운다.
export function clearDeviceSubscriptions(deviceId: string) {
  const all = readPush();
  let changed = false;
  for (const [endpoint, record] of Object.entries(all)) {
    if (!record.deviceIds.includes(deviceId)) continue;
    changed = true;
    record.deviceIds = record.deviceIds.filter((id) => id !== deviceId);
    if (record.deviceIds.length === 0) delete all[endpoint];
  }
  if (changed) writePush(all);
}

export function getSubscribedDeviceIds(endpoint: string): string[] {
  return readPush()[endpoint]?.deviceIds ?? [];
}

export function getSubscriptionsForDevice(deviceId: string): { endpoint: string; subscription: unknown }[] {
  const all = readPush();
  return Object.entries(all)
    .filter(([, record]) => record.deviceIds.includes(deviceId))
    .map(([endpoint, record]) => ({ endpoint, subscription: record.subscription }));
}

// 브라우저(구독자) 수와, 실제로 1개 이상 기기를 구독 중인 구독자 수를 반환한다.
export function getSubscriberStats() {
  const all = readPush();
  const records = Object.values(all);
  return {
    total: records.length,
    active: records.filter((r) => r.deviceIds.length > 0).length,
  };
}

// --- SmartThings OAuth 토큰 저장 ---
// PAT(Personal Access Token)은 24시간 만료라서 OAuth authorization code + refresh token 방식을 쓴다.
// 서버리스 배포 시 위 저장소들과 함께 KV/Firestore 등으로 교체.

export interface SmartThingsTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // ms epoch
}

const TOKEN_FILE = path.join(process.cwd(), ".data", "smartthings-tokens.json");

export function getSmartThingsTokens(): SmartThingsTokens | null {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export function saveSmartThingsTokens(tokens: SmartThingsTokens) {
  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

// --- 테스트 기기 ---
// SmartThings 연결과 무관하게 상태를 수동으로 바꿔가며 UI/알림/방치경고를 확인해보기 위한 가짜 기기.
// "사용중"으로 설정하면 실제 시간이 흘러 남은시간이 줄어들고, 0이 되면 자동으로 "완료"로 바뀐다.

export interface TestDeviceState {
  jobState: "idle" | "running" | "complete";
  durationSeconds: number | null; // 사용중으로 설정할 때 지정한 총 시간
  startedAt: number | null; // 사용중 시작 시각 (ms epoch)
}

const TEST_DEVICE_FILE = path.join(process.cwd(), ".data", "test-devices.json");
const DEFAULT_TEST_STATE: TestDeviceState = { jobState: "idle", durationSeconds: null, startedAt: null };

function readTestDevices(): Record<string, TestDeviceState> {
  try {
    return JSON.parse(fs.readFileSync(TEST_DEVICE_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeTestDevices(data: Record<string, TestDeviceState>) {
  fs.mkdirSync(path.dirname(TEST_DEVICE_FILE), { recursive: true });
  fs.writeFileSync(TEST_DEVICE_FILE, JSON.stringify(data, null, 2));
}

export function getTestDeviceState(deviceId: string): TestDeviceState {
  return readTestDevices()[deviceId] ?? DEFAULT_TEST_STATE;
}

export function setTestDeviceState(deviceId: string, state: TestDeviceState) {
  const all = readTestDevices();
  all[deviceId] = state;
  writeTestDevices(all);
}

// --- 방문자(사용자) 추적 ---
// 로그인/계정이 없는 앱이라 "이용자"는 브라우저별 임의 클라이언트 ID로 셀 수밖에 없다.
// 클라이언트가 주기적으로 ping을 보내면 마지막 접속 시각만 저장해두고,
// 관리자 통계에서 "최근 N분 내 접속 = 온라인", "오늘 날짜 기준 = 오늘 방문자"로 집계한다.

const VISITORS_FILE = path.join(process.cwd(), ".data", "visitors.json");
const ONLINE_WINDOW_MS = 60 * 1000; // 마지막 ping이 이 시간 이내면 "온라인"으로 간주 (ping 주기 15초 기준)

function readVisitors(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(VISITORS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeVisitors(data: Record<string, number>) {
  fs.mkdirSync(path.dirname(VISITORS_FILE), { recursive: true });
  fs.writeFileSync(VISITORS_FILE, JSON.stringify(data, null, 2));
}

export function recordVisit(clientId: string, now: number) {
  const all = readVisitors();
  all[clientId] = now;
  writeVisitors(all);
}

export function getVisitorStats(now: number) {
  const all = readVisitors();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMs = startOfDay.getTime();

  let online = 0;
  let today = 0;
  for (const lastSeen of Object.values(all)) {
    if (now - lastSeen <= ONLINE_WINDOW_MS) online++;
    if (lastSeen >= startOfDayMs) today++;
  }
  return { online, today, total: Object.keys(all).length };
}

// --- 완료 횟수 통계 ---
// 기기별로 "완료 감지" 이벤트가 몇 번 있었는지 누적 카운트한다 (오늘 하루가 아니라 전체 누적).

const COMPLETIONS_FILE = path.join(process.cwd(), ".data", "completions.json");

function readCompletions(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(COMPLETIONS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeCompletions(data: Record<string, number>) {
  fs.mkdirSync(path.dirname(COMPLETIONS_FILE), { recursive: true });
  fs.writeFileSync(COMPLETIONS_FILE, JSON.stringify(data, null, 2));
}

export function incrementCompletion(deviceId: string) {
  const all = readCompletions();
  all[deviceId] = (all[deviceId] ?? 0) + 1;
  writeCompletions(all);
}

export function getCompletionCounts(): Record<string, number> {
  return readCompletions();
}

// --- 분실물 게시판 / 관리자 문의 / 조식 평점 ---
// 로그인이 없어서 작성자는 브라우저별 clientId로만 구분한다(도배 제한용, 외부에는 노출하지 않는다).

function readJsonFile<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJsonFile(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// 글 알림 구독자: 댓글이 달리면 이 브라우저(Web Push)로 알려준다. 기기 완료 알림 구독과는 별개로 글에 직접 저장한다.
export interface PostWatcher {
  endpoint: string;
  subscription: unknown;
  clientId: string;
}

export interface BoardPost {
  id: string;
  roomCode: string | null;
  text: string;
  createdAt: number;
  clientId: string;
  watchers?: PostWatcher[];
}

export interface BoardComment {
  id: string;
  postId: string;
  text: string;
  createdAt: number;
  clientId: string;
}

const BOARD_FILE = path.join(process.cwd(), ".data", "board.json");
const COMMENTS_FILE = path.join(process.cwd(), ".data", "board-comments.json");
const BOARD_MIN_GAP_MS = 20 * 1000;
const BOARD_MAX_PER_DAY = 10;
const BOARD_MAX_KEEP = 500;
const COMMENT_MIN_GAP_MS = 10 * 1000;
const COMMENT_MAX_PER_DAY = 30;

export function listBoardPosts(): BoardPost[] {
  return readJsonFile<BoardPost[]>(BOARD_FILE, []).sort((a, b) => b.createdAt - a.createdAt);
}

export function getBoardPost(id: string): BoardPost | undefined {
  return readJsonFile<BoardPost[]>(BOARD_FILE, []).find((p) => p.id === id);
}

export function addBoardPost(
  clientId: string,
  roomCode: string | null,
  text: string,
  watcher: Omit<PostWatcher, "clientId"> | null,
  now: number
): { ok: true; post: BoardPost } | { ok: false; error: string } {
  const all = readJsonFile<BoardPost[]>(BOARD_FILE, []);
  const mine = all.filter((p) => p.clientId === clientId);
  if (mine.some((p) => now - p.createdAt < BOARD_MIN_GAP_MS)) {
    return { ok: false, error: "너무 빨라요. 잠시 후 다시 작성해주세요." };
  }
  if (mine.filter((p) => now - p.createdAt < 24 * 3600 * 1000).length >= BOARD_MAX_PER_DAY) {
    return { ok: false, error: "하루에 작성할 수 있는 글 수를 넘었어요." };
  }
  const post: BoardPost = {
    id: crypto.randomUUID(),
    roomCode,
    text,
    createdAt: now,
    clientId,
    watchers: watcher ? [{ ...watcher, clientId }] : [],
  };
  writeJsonFile(BOARD_FILE, [post, ...all].slice(0, BOARD_MAX_KEEP));
  return { ok: true, post };
}

export function setPostWatcher(postId: string, watcher: PostWatcher, watch: boolean): boolean {
  const all = readJsonFile<BoardPost[]>(BOARD_FILE, []);
  const post = all.find((p) => p.id === postId);
  if (!post) return false;
  const rest = (post.watchers ?? []).filter((w) => w.endpoint !== watcher.endpoint);
  post.watchers = watch ? [...rest, watcher] : rest;
  writeJsonFile(BOARD_FILE, all);
  return true;
}

export function removePostWatchers(postId: string, endpoints: string[]) {
  if (endpoints.length === 0) return;
  const all = readJsonFile<BoardPost[]>(BOARD_FILE, []);
  const post = all.find((p) => p.id === postId);
  if (!post) return;
  post.watchers = (post.watchers ?? []).filter((w) => !endpoints.includes(w.endpoint));
  writeJsonFile(BOARD_FILE, all);
}

export function deleteBoardPost(id: string) {
  writeJsonFile(BOARD_FILE, readJsonFile<BoardPost[]>(BOARD_FILE, []).filter((p) => p.id !== id));
  writeJsonFile(COMMENTS_FILE, readJsonFile<BoardComment[]>(COMMENTS_FILE, []).filter((c) => c.postId !== id));
}

export function listComments(postId?: string): BoardComment[] {
  const all = readJsonFile<BoardComment[]>(COMMENTS_FILE, []);
  return (postId ? all.filter((c) => c.postId === postId) : all).sort((a, b) => a.createdAt - b.createdAt);
}

export function countCommentsByPost(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of readJsonFile<BoardComment[]>(COMMENTS_FILE, [])) counts[c.postId] = (counts[c.postId] ?? 0) + 1;
  return counts;
}

export function addComment(
  postId: string,
  clientId: string,
  text: string,
  now: number
): { ok: true; comment: BoardComment } | { ok: false; error: string } {
  const all = readJsonFile<BoardComment[]>(COMMENTS_FILE, []);
  const mine = all.filter((c) => c.clientId === clientId);
  if (mine.some((c) => now - c.createdAt < COMMENT_MIN_GAP_MS)) {
    return { ok: false, error: "너무 빨라요. 잠시 후 다시 작성해주세요." };
  }
  if (mine.filter((c) => now - c.createdAt < 24 * 3600 * 1000).length >= COMMENT_MAX_PER_DAY) {
    return { ok: false, error: "하루에 작성할 수 있는 댓글 수를 넘었어요." };
  }
  const comment: BoardComment = { id: crypto.randomUUID(), postId, text, createdAt: now, clientId };
  writeJsonFile(COMMENTS_FILE, [...all, comment].slice(-2000));
  return { ok: true, comment };
}

export function deleteComment(id: string) {
  writeJsonFile(COMMENTS_FILE, readJsonFile<BoardComment[]>(COMMENTS_FILE, []).filter((c) => c.id !== id));
}

export interface Inquiry {
  id: string;
  text: string;
  contact: string;
  createdAt: number;
  clientId: string;
}

const INQUIRY_FILE = path.join(process.cwd(), ".data", "inquiries.json");

export function listInquiries(): Inquiry[] {
  return readJsonFile<Inquiry[]>(INQUIRY_FILE, []).sort((a, b) => b.createdAt - a.createdAt);
}

export function addInquiry(
  clientId: string,
  text: string,
  contact: string,
  now: number
): { ok: true } | { ok: false; error: string } {
  const all = readJsonFile<Inquiry[]>(INQUIRY_FILE, []);
  if (all.filter((i) => i.clientId === clientId && now - i.createdAt < 3600 * 1000).length >= 3) {
    return { ok: false, error: "문의는 1시간에 3번까지 보낼 수 있어요." };
  }
  writeJsonFile(INQUIRY_FILE, [{ id: crypto.randomUUID(), text, contact, createdAt: now, clientId }, ...all].slice(0, 500));
  return { ok: true };
}

export function deleteInquiry(id: string) {
  writeJsonFile(INQUIRY_FILE, readJsonFile<Inquiry[]>(INQUIRY_FILE, []).filter((i) => i.id !== id));
}

// 조식 평점: { "20261006": { clientId: 1~5 } } — 기기당 하루 1번(다시 누르면 수정).
const RATINGS_FILE = path.join(process.cwd(), ".data", "meal-ratings.json");

export function setMealRating(date: string, clientId: string, score: number) {
  const all = readJsonFile<Record<string, Record<string, number>>>(RATINGS_FILE, {});
  all[date] = { ...(all[date] ?? {}), [clientId]: score };
  writeJsonFile(RATINGS_FILE, all);
}

export function getMealRatingSummary(date: string, clientId?: string) {
  const day = readJsonFile<Record<string, Record<string, number>>>(RATINGS_FILE, {})[date] ?? {};
  const scores = Object.values(day);
  return {
    count: scores.length,
    average: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    mine: clientId ? day[clientId] ?? null : null,
  };
}

export function listMealRatingDays(limit = 7) {
  const all = readJsonFile<Record<string, Record<string, number>>>(RATINGS_FILE, {});
  return Object.keys(all)
    .sort()
    .reverse()
    .slice(0, limit)
    .map((date) => {
      const scores = Object.values(all[date]);
      return { date, count: scores.length, average: scores.reduce((a, b) => a + b, 0) / scores.length };
    });
}
