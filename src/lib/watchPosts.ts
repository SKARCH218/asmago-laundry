// 이 브라우저가 댓글 알림을 켜둔 글 목록(서버의 watchers와 짝). 기기 알림 구독과 같은 방식으로 localStorage에 둔다.
const KEY = "asmago:watchPosts";

export function loadWatchedPosts(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function setWatchedPost(postId: string, watching: boolean) {
  const s = loadWatchedPosts();
  if (watching) s.add(postId);
  else s.delete(postId);
  localStorage.setItem(KEY, JSON.stringify([...s]));
}
