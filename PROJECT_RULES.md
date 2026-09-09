# 소방안전관리자 2급 요약집 - 작업 규칙

이 프로젝트를 수정하는 AI(어떤 모델이든)는 아래 규칙을 반드시 따라주세요.

## 1. 버전 관리
- 파일을 수정할 때마다 버전을 **0.0.1씩** 올린다. (예: V5.9.4 → V5.9.5)
- 버전 숫자는 `index.html` 안에 총 4곳에 등장한다:
  - 표지 상단 `버전: V5.x.x (...)` 문구 1곳
  - 업데이트 내역(changelog) 패널의 최신 항목 제목 1곳
  - 하단 푸터의 `버전: V5.x.x` 2곳
  - 이 4곳을 전부 동일한 새 버전으로 일치시킬 것 (grep으로 확인 권장)

## 2. 업데이트 내역(changelog) 기록
- `index.html`의 `id="changelog-panel"` 안, 기존 항목들 **바로 위**에 새 버전 항목을 추가한다.
- 형식:
  ```html
  <div style="margin-bottom: 12px;">
      <div style="font-weight: 700; font-size: 0.95em;">V5.x.x <span style="font-weight:400; color:var(--text-sub); font-size:0.85em;">- 한 줄 요약</span></div>
      <ul style="margin: 4px 0 0 0; padding-left: 18px; font-size: 0.88em; color: var(--text-sub);">
          <li>구체적인 수정 내용</li>
      </ul>
  </div>
  ```
- 기존 항목들은 지우거나 순서를 바꾸지 않는다 (최신순으로 위에 계속 쌓는다).

## 3. 서비스워커 캐시 버전 (매우 중요!)
- `sw.js`의 `const CACHE_NAME = 'sobang2gup-cache-vN';` 도 **파일을 수정할 때마다 N을 1씩 올린다.**
- 이걸 안 올리면 PWA로 설치한 사용자 브라우저가 예전 캐시된 파일을 계속 보여줄 수 있다 (앱 버전 번호와는 별개의 캐시 버전이므로 절대 빠뜨리지 말 것).
- `FILES_TO_CACHE` 목록에 새 파일(`parts/partX-Y.html` 등)을 추가했다면 여기에도 경로를 추가한다.

## 4. 파일 구조
- 각 단원 콘텐츠는 `parts/partX-Y.html`에 있다.
- 다이어그램은 순수 인라인 SVG로 그려져 있다 (`<svg viewBox=... >` + `<circle>`/`<polygon>`/`<text>` 등). 새 다이어그램을 추가하거나 수정할 때도 이 스타일(외부 라이브러리 없이 순수 SVG)을 유지한다.
- 색상은 하드코딩하지 않고 가능한 한 CSS 변수(`var(--primary)`, `var(--text-color)`, `var(--text-sub)` 등, `style.css`에 정의됨)를 사용한다.

## 5. 마무리 시 항상 할 것
1. 수정 완료 후 프로젝트 폴더 전체를 다시 zip으로 압축한다.
2. 파일명 형식: `VX.X.X(업데이트내용요약).zip`
   - 버전 번호 + 괄호 안에 이번 업데이트 핵심 내용을 짧게 요약해서 넣는다.
   - 예: `V5.9.6(서비스워커_캐시버전_동기화).zip`
   - 띄어쓰기 대신 점(`.`)을 사용한다 (파일명 호환성).
3. 사용자에게 파일을 제공(present)한다.

---
### 다른 채팅방/다른 AI로 옮길 때 사용법
이 zip 파일을 업로드한 뒤, 아래처럼 요청하면 규칙이 이어집니다:

> "압축 파일 안의 PROJECT_RULES.md를 참고해서 이 규칙대로 작업해줘. [원하는 수정 내용]"
