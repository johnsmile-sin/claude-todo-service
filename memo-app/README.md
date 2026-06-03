# MY TODO — 할일 관리 앱

Firebase 기반 실시간 할일 관리 웹 앱입니다.  
회원가입·로그인 후 개인 할일을 추가·완료·삭제할 수 있으며, 데이터는 Firebase Realtime Database에 실시간으로 저장됩니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 회원가입 | 소속·이름·아이디(이메일)·비밀번호 입력 후 가입 |
| 로그인 | 이메일 + 비밀번호 인증 (Firebase Authentication) |
| 비밀번호 찾기 | 가입 이메일로 재설정 링크 발송 |
| 할일 추가 | 제목·일정(날짜)·메모 입력 |
| 완료 체크 | 체크박스 클릭 → 취소선 처리 |
| 할일 삭제 | 확인 모달 후 삭제 |
| 실시간 동기화 | Firebase Realtime Database `onValue` 리스너 |
| 작성자 표시 | 각 할일 카드에 작성자 이름 표시 |
| 마감일 배지 | 오늘(노란색) / 기한 초과(빨간색) / 완료(초록색) |
| 검색 | 제목·메모 키워드 실시간 검색 |
| 자동 정렬 | 미완료(마감일 순) → 완료 항목 순 |
| 반응형 | 데스크탑·태블릿·모바일 지원 |

---

## 기술 스택

- **Frontend** — HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **인증** — Firebase Authentication (Email / Password)
- **데이터베이스** — Firebase Realtime Database
- **배포** — Vercel

---

## 페이지 구조

```
index.html            로그인 페이지 (진입점)
signup.html           회원가입 페이지
forgot-password.html  비밀번호 찾기 페이지
app.html              할일 앱 메인 페이지
```

### 페이지 이동 흐름

```
접속
 └─ index.html (로그인)
     ├─ 로그인 성공        → app.html
     ├─ 이미 로그인 중     → app.html (자동 리다이렉트)
     ├─ 회원가입 링크      → signup.html
     │    └─ 가입 완료     → app.html
     └─ 비밀번호 찾기      → forgot-password.html
          └─ 뒤로가기      → index.html

app.html (로그인 필요)
 └─ 미로그인 접속         → index.html (자동 리다이렉트)
 └─ 로그아웃 버튼         → index.html
```

---

## 파일 구조

```
memo-app/
├── firebase-config.js      Firebase 초기화 공유 모듈
├── index.html              로그인 페이지
├── login.js                로그인 로직
├── signup.html             회원가입 페이지
├── signup.js               회원가입 로직
├── forgot-password.html    비밀번호 찾기 페이지
├── forgot-password.js      비밀번호 찾기 로직
├── app.html                할일 앱 메인 페이지
├── app.js                  할일 앱 로직
└── style.css               공통 스타일
```

---

## Firebase 데이터 구조

```
(root)
├── users/
│   └── {uid}/
│       ├── org        소속
│       ├── name       이름
│       ├── email      이메일
│       └── createdAt  가입일시
│
└── todos/
    └── {uid}/
        └── {todoId}/
            ├── title       할일 제목
            ├── dueDate     마감일 (yyyy-MM-dd)
            ├── notes       메모
            ├── done        완료 여부 (boolean)
            ├── authorName  작성자 이름
            ├── authorId    작성자 UID
            ├── createdAt   생성일시
            └── updatedAt   수정일시
```

---

## Firebase 콘솔 설정

앱을 정상적으로 사용하려면 Firebase 콘솔에서 아래 두 가지를 활성화해야 합니다.

### 1. Authentication — 이메일/비밀번호 로그인 활성화

```
Firebase 콘솔 → Authentication → Sign-in method
→ Email/Password → 사용 설정
```

### 2. Realtime Database — 보안 규칙 설정

개발/테스트 환경 (인증된 사용자만 자신의 데이터 접근):

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read":  "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "todos": {
      "$uid": {
        ".read":  "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

---

## 배포 URL

| 환경 | URL |
|------|-----|
| Production | https://memo-app-nu-eight.vercel.app |

---

## 로컬 실행

별도 빌드 과정 없이 정적 파일로 동작합니다.  
로컬에서는 CORS 제한으로 ES Module import가 차단될 수 있으므로 간단한 HTTP 서버를 통해 실행하세요.

```bash
# Python
python -m http.server 3000

# Node.js (npx)
npx serve .
```

브라우저에서 `http://localhost:3000` 접속
