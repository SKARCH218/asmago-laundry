const pptxgen = require("pptxgenjs");
const path = require("path");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5

const COLOR = {
  primary: "2E6FF2", // bright blue
  secondary: "5B9BFF", // lighter blue
  accent: "D7E6FF", // pale ice blue
  dark: "1B3A8C", // brighter dark-blue background (was navy-black)
  ink: "1C2A4A",
  sub: "5B6690",
  bg: "F3F6FC",
  white: "FFFFFF",
};

const IMG_DIR = "/private/tmp/claude-501/-Users-kimtaehun/9469ed0c-5516-41e2-b53a-bbdebee482d3/scratchpad/ppt";
const LOGO_PATH = "/Users/kimtaehun/Documents/asmago-laundry/public/logo.png";

function iconCircle(slide, { x, y, d = 0.5, fill = COLOR.accent, char = "", emoji = false }) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
  slide.addText(char, {
    x, y, w: d, h: d, align: "center", valign: "middle",
    fontSize: 20, color: COLOR.white, bold: true,
    fontFace: emoji ? "Toss Face Font Mac" : "Arial",
    isTextBox: true, margin: 0,
  });
}

// ---------- Slide 1: Title ----------
{
  const s = pres.addSlide();
  s.background = { color: COLOR.dark };

  // Faint decorative circles suggesting a washer drum
  s.addShape("ellipse", { x: 9.9, y: 1.3, w: 5.2, h: 5.2, fill: { color: COLOR.primary, transparency: 70 }, line: { type: "none" } });
  s.addShape("ellipse", { x: 10.9, y: 2.3, w: 3.2, h: 3.2, fill: { color: COLOR.accent, transparency: 60 }, line: { type: "none" } });

  s.addShape("roundRect", {
    x: 0.7, y: 0.55, w: 2.2, h: 1.3, rectRadius: 0.1,
    fill: { color: COLOR.white }, line: { type: "none" },
  });
  s.addImage({ path: LOGO_PATH, x: 0.9, y: 0.72, w: 1.8, h: 0.96, sizing: { type: "contain", w: 1.8, h: 0.96 } });

  s.addText("아스마고 세탁실", {
    x: 0.9, y: 2.5, w: 8.5, h: 1.2, fontSize: 44, bold: true, color: COLOR.white,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  s.addText("기숙사 세탁실, 이제 가보지 않아도 알 수 있습니다", {
    x: 0.9, y: 3.6, w: 8.5, h: 0.6, fontSize: 18, color: COLOR.accent,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  s.addText("SmartThings 연동 세탁실 실시간 현황 웹앱", {
    x: 0.9, y: 6.6, w: 8, h: 0.4, fontSize: 12, color: "8FA3D9",
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });

  s.addNotes(
    "안녕하세요. 오늘 제가 만든 '아스마고 세탁실'이라는 웹 서비스를 소개해드리려고 합니다. " +
    "기숙사 세탁실을 이용하면서 겪었던 불편함을 직접 해결해보고 싶어서 만들게 됐습니다."
  );
}

// ---------- Slide 2: 문제의식 ----------
{
  const s = pres.addSlide();
  s.background = { color: COLOR.bg };

  s.addText("왜 만들었나요?", {
    x: 0.6, y: 0.5, w: 8, h: 0.7, fontSize: 32, bold: true, color: COLOR.ink,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  s.addText("기숙사 세탁실을 이용하며 반복적으로 겪는 두 가지 문제", {
    x: 0.6, y: 1.15, w: 9, h: 0.4, fontSize: 14, color: COLOR.sub,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });

  const problems = [
    { icon: "?", title: "가봐야 아는 상태", body: "세탁실까지 가야 세탁기가 비어있는지 알 수 있음\n헛걸음이 잦음" },
    { icon: "!", title: "완료 후 방치", body: "다 된 세탁물을 안 가져가서\n다음 사람이 못 씀" },
  ];
  const cardW = 5.6, cardX = [0.6, 6.9], cardY = 2.0, cardH = 3.3;
  problems.forEach((p, i) => {
    s.addShape("roundRect", {
      x: cardX[i], y: cardY, w: cardW, h: cardH, rectRadius: 0.12,
      fill: { color: COLOR.white }, line: { type: "none" },
      shadow: { type: "outer", color: "1E2761", opacity: 0.18, blur: 8, offset: 3, angle: 90 },
    });
    iconCircle(s, { x: cardX[i] + 0.5, y: cardY + 0.5, d: 0.7, fill: COLOR.primary, char: p.icon });
    s.addText(p.title, {
      x: cardX[i] + 0.5, y: cardY + 1.5, w: cardW - 1.0, h: 0.5, fontSize: 22, bold: true, color: COLOR.ink,
      fontFace: "Calibri", isTextBox: true, margin: 0,
    });
    s.addText(p.body, {
      x: cardX[i] + 0.5, y: cardY + 2.1, w: cardW - 1.0, h: 1.0, fontSize: 14, color: COLOR.sub,
      fontFace: "Calibri", isTextBox: true, margin: 0, lineSpacingMultiple: 1.3,
    });
  });

  s.addText("→ 실시간으로 상태를 확인할 수 있는 웹을 만들면 두 문제를 동시에 줄일 수 있습니다.", {
    x: 0.6, y: 5.6, w: 12, h: 0.6, fontSize: 16, bold: true, color: COLOR.primary,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });

  s.addNotes(
    "기숙사 세탁실을 쓰면서 반복적으로 겪는 문제가 두 가지 있었습니다. " +
    "첫 번째는 세탁기가 사용중인지 아닌지 직접 가봐야 알 수 있다는 점이고, " +
    "두 번째는 세탁이 끝난 뒤에도 빨래를 안 가져가서 다음 사람이 못 쓰는 경우가 많다는 점입니다. " +
    "이 두 가지를 해결하려면 실시간으로 세탁기 상태를 확인할 수 있는 서비스가 필요하다고 생각했습니다."
  );
}

// ---------- Slide 3: 기능 소개 ----------
{
  const s = pres.addSlide();
  s.background = { color: COLOR.white };

  s.addText("무엇을 만들었나요?", {
    x: 0.6, y: 0.5, w: 8, h: 0.7, fontSize: 32, bold: true, color: COLOR.ink,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  s.addText("삼성 SmartThings API로 실제 세탁기·건조기 상태를 가져오는 웹앱", {
    x: 0.6, y: 1.15, w: 10, h: 0.4, fontSize: 14, color: COLOR.sub,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });

  const feats = [
    { icon: "●", title: "실시간 상태 확인", body: "대기중 · 사용중 · 완료를\n세탁기별로 실시간 표시" },
    { icon: "⏱", title: "남은 시간 표시", body: "돌아가고 있는 세탁기의\n남은 시간을 초 단위로 확인" },
    { icon: "🔔", title: "완료 알림", body: "세탁 끝나면 웹 푸시 알림\n(탭을 안 열어놔도 옴)" },
    { icon: "🏢", title: "위치별 분류", body: "B동 2층 / C동 1층 / C동 3층\n세탁실별로 따로 확인" },
  ];
  const cols = 4, gap = 0.35, startX = 0.6, cw = (13.3 - startX * 2 - gap * (cols - 1)) / cols;
  feats.forEach((f, i) => {
    const x = startX + i * (cw + gap), y = 2.1, h = 3.6;
    s.addShape("roundRect", {
      x, y, w: cw, h, rectRadius: 0.1,
      fill: { color: COLOR.bg }, line: { type: "none" },
    });
    iconCircle(s, { x: x + 0.35, y: y + 0.4, d: 0.6, fill: COLOR.secondary, char: f.icon, emoji: true });
    s.addText(f.title, {
      x: x + 0.3, y: y + 1.25, w: cw - 0.6, h: 0.7, fontSize: 15, bold: true, color: COLOR.ink,
      fontFace: "Calibri", isTextBox: true, margin: 0,
    });
    s.addText(f.body, {
      x: x + 0.3, y: y + 1.95, w: cw - 0.6, h: 1.4, fontSize: 11.5, color: COLOR.sub,
      fontFace: "Calibri", isTextBox: true, margin: 0, lineSpacingMultiple: 1.3,
    });
  });

  s.addNotes(
    "그래서 삼성 SmartThings API를 이용해서, 실제 세탁기·건조기의 상태를 가져오는 웹앱을 만들었습니다. " +
    "핵심 기능은 네 가지입니다. 첫째, 세탁기별로 대기중·사용중·완료 상태를 실시간으로 보여줍니다. " +
    "둘째, 지금 돌아가고 있는 세탁기의 남은 시간을 초 단위로 확인할 수 있습니다. " +
    "셋째, 세탁이 끝나면 웹 푸시 알림을 보내줘서 탭을 계속 열어두지 않아도 됩니다. " +
    "넷째, B동 2층, C동 1층, C동 3층처럼 세탁실 위치별로 나눠서 확인할 수 있습니다."
  );
}

// ---------- Slide 4: 데모 화면 ----------
{
  const s = pres.addSlide();
  s.background = { color: COLOR.dark };

  s.addText("실제 화면", {
    x: 0.6, y: 0.45, w: 8, h: 0.7, fontSize: 32, bold: true, color: COLOR.white,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  s.addText("(예시 데이터로 상태를 미리 채워 화면을 보여드립니다)", {
    x: 0.6, y: 1.05, w: 10, h: 0.4, fontSize: 12, color: "8FA3D9",
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });

  const frame = (x, y, w, h) => {
    s.addShape("roundRect", {
      x: x - 0.08, y: y - 0.08, w: w + 0.16, h: h + 0.16, rectRadius: 0.08,
      fill: { color: COLOR.white }, line: { type: "none" },
      shadow: { type: "outer", color: "000000", opacity: 0.35, blur: 12, offset: 4, angle: 90 },
    });
  };

  const homeW = 5.6, homeH = homeW * (450 / 800);
  frame(0.7, 1.9, homeW, homeH);
  s.addImage({ path: path.join(IMG_DIR, "home.png"), x: 0.7, y: 1.9, w: homeW, h: homeH });
  s.addText("홈 — 세탁실 목록 + 실시간 요약", {
    x: 0.7, y: 1.9 + homeH + 0.15, w: homeW, h: 0.4, fontSize: 13, color: COLOR.accent,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });

  const roomW = 6.1, roomH = roomW * (450 / 800);
  frame(6.9, 1.9, roomW, roomH);
  s.addImage({ path: path.join(IMG_DIR, "room.png"), x: 6.9, y: 1.9, w: roomW, h: roomH });
  s.addText("세탁실 상세 — 세탁기별 카드 + 상태", {
    x: 6.9, y: 1.9 + roomH + 0.15, w: roomW, h: 0.4, fontSize: 13, color: COLOR.accent,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });

  s.addNotes(
    "실제 화면을 보여드리면, 왼쪽이 홈 화면입니다. 동·층별로 세탁실이 나뉘어 있고, " +
    "각 세탁실에 사용중이거나 완료된 세탁기가 몇 대인지 한눈에 보여줍니다. " +
    "오른쪽은 세탁실 상세 화면인데, 세탁기 하나하나가 카드로 표시되고 " +
    "지금처럼 완료된 세탁기는 초록색 체크 표시로 바로 알 수 있습니다."
  );
}

// ---------- Slide 5: 향후 개선점 ----------
{
  const s = pres.addSlide();
  s.background = { color: COLOR.bg };

  s.addText("앞으로 개선할 점", {
    x: 0.6, y: 0.5, w: 8, h: 0.7, fontSize: 32, bold: true, color: COLOR.ink,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });

  const items = [
    { title: "미등록 세탁기 연결", body: "SmartThings에 아직 안 잡히는 일부 세탁기를 확인해서 전부 연동" },
    { title: "정식 서버 운영", body: "상시 켜져 있는 서버(라즈베리파이 등)에 올려서 24시간 서비스" },
    { title: "학교 홍보 지면 활용", body: "기숙사생들이 매일 들어올 웹이라, 공지사항 · 행사 안내를 노출하면 전달력이 큼" },
  ];
  const y0 = 1.8, rowH = 1.55;
  items.forEach((it, i) => {
    const y = y0 + i * (rowH + 0.25);
    s.addShape("roundRect", {
      x: 0.6, y, w: 12.1, h: rowH, rectRadius: 0.1,
      fill: { color: COLOR.white }, line: { type: "none" },
      shadow: { type: "outer", color: "1E2761", opacity: 0.15, blur: 6, offset: 2, angle: 90 },
    });
    s.addText(String(i + 1).padStart(2, "0"), {
      x: 0.9, y, w: 1.0, h: rowH, fontSize: 30, bold: true, color: COLOR.secondary, valign: "middle",
      fontFace: "Calibri", isTextBox: true, margin: 0,
    });
    s.addText(it.title, {
      x: 2.0, y: y + 0.22, w: 10.4, h: 0.5, fontSize: 17, bold: true, color: COLOR.ink,
      fontFace: "Calibri", isTextBox: true, margin: 0,
    });
    s.addText(it.body, {
      x: 2.0, y: y + 0.72, w: 10.4, h: 0.7, fontSize: 13, color: COLOR.sub,
      fontFace: "Calibri", isTextBox: true, margin: 0,
    });
  });

  s.addNotes(
    "앞으로 개선하고 싶은 부분도 세 가지 말씀드리겠습니다. " +
    "첫째, 아직 SmartThings에 등록이 안 된 세탁기가 일부 있어서 이걸 전부 연동할 계획입니다. " +
    "둘째, 지금은 제 컴퓨터로 임시로 돌리고 있는데, 라즈베리파이 같은 상시 서버에 올려서 24시간 안정적으로 서비스할 예정입니다. " +
    "셋째, 기숙사생들이 세탁기 확인하려고 매일 들어올 웹이기 때문에, 여기에 학교 공지사항이나 행사 안내를 노출하면 " +
    "홍보 효과가 클 거라고 생각합니다. 이 부분은 학교 측에서 원하시면 같이 논의해보고 싶습니다."
  );
}

// ---------- Slide 6: 마무리 ----------
{
  const s = pres.addSlide();
  s.background = { color: COLOR.dark };

  s.addShape("ellipse", { x: -1.5, y: 4.5, w: 5, h: 5, fill: { color: COLOR.primary, transparency: 70 }, line: { type: "none" } });

  s.addText("감사합니다", {
    x: 0.9, y: 2.7, w: 8, h: 1.1, fontSize: 40, bold: true, color: COLOR.white,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });
  s.addText("아스마고 세탁실 — 궁금하신 점 편하게 질문해주세요", {
    x: 0.9, y: 3.75, w: 9, h: 0.5, fontSize: 16, color: COLOR.accent,
    fontFace: "Calibri", isTextBox: true, margin: 0,
  });

  s.addNotes(
    "이상으로 발표를 마치겠습니다. 부족한 부분이 많지만, 실제로 기숙사 학생들이 겪는 불편을 " +
    "직접 해결해보고 싶어서 만들었습니다. 궁금하신 점 있으시면 편하게 질문해주세요. 감사합니다."
  );
}

pres.writeFile({ fileName: "/Users/kimtaehun/Documents/asmago-laundry/presentation/아스마고_세탁실_발표.pptx" }).then(() => {
  console.log("done");
});
