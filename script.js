var currentSubPage = 0;
        var totalSubPages = 22;
        var bookmarks = JSON.parse(localStorage.getItem('user_bookmarks') || '[]');
        var completes = JSON.parse(localStorage.getItem('user_completes') || '[]');
        var currentFontSize = parseInt(localStorage.getItem('user_font_size') || '14', 10);
        var memorizeTimerSec = parseInt(localStorage.getItem('user_timer_sec') || '3', 10);
        
        var quizAnswerState = {}; 
        var filterWrongModes = {};
        var wasDarkModeBeforeMemo = false;
        var isChosungMode = false;
        var originalElementsData = [];
        var wrongNotes = JSON.parse(localStorage.getItem('user_wrong_notes') || '{}');
        var lastSearchQuery = ""; // 검색어 변경 여부 추적용

        var bibleQuotes100 = [
            { text: "시작은 미약하였으나 네 나중은 심히 창대하리라.", ref: "욥기 8:7" },
            { text: "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라.", ref: "이사야 41:10" },
            { text: "네 길을 여호와께 맡기라 그를 의지하면 그가 이루시고.", ref: "시편 37:5" },
            { text: "우리가 선을 행하되 낙심하지 말지니 포기하지 아니하면 때가 이르매 거두리라.", ref: "갈라디아서 6:9" },
            { text: "사람이 마음으로 자기의 길을 계획할지라도 그의 걸음을 인도하시는 이는 여호와시니라.", ref: "잠언 16:9" },
            { text: "지혜가 제일이니 지혜를 얻으라 네가 얻은 모든 것을 가지고 명철을 얻을지니라.", ref: "잠언 4:7" },
            { text: "너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라.", ref: "잠언 3:5" },
            { text: "오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요.", ref: "이사야 40:31" },
            { text: "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라.", ref: "빌립보서 4:13" },
            { text: "강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라.", ref: "여호수아 1:9" },
            { text: "여호와를 경외하는 것이 지식의 근본이거늘 미련한 자는 지혜와 훈계를 멸시하느니라.", ref: "잠언 1:7" },
            { text: "무릇 지킬 만한 것보다 더욱 네 마음을 지키라 생명의 근원이 이에서 남이니라.", ref: "잠언 4:23" },
            { text: "환난 중에도 즐거워하나니 이는 환난은 인내를, 인내는 연단을, 연단은 소망을 이루는 줄 앎이로다.", ref: "로마서 5:3-4" },
            { text: "쉬지 말고 기도하라.", ref: "데살로니가전서 5:17" },
            { text: "구하라 그리하면 너희에게 주실 것이요 찾으라 그리하면 찾아낼 것이요.", ref: "마태복음 7:7" },
            { text: "여호와는 나의 목자시니 내게 부족함이 없으리로다.", ref: "시편 23:1" }
        ];

        document.addEventListener("DOMContentLoaded", function() {
            loadSavedStates();
            setupMemorizeClickEvents();
            setupPenOnlyMemoInputs();
            setupPenAnnotationOverlays();
            disablePenScrollGlobally();
            setupPenScrollGuard();
            setupPenDebugPanel();
            updateProgress();
            calculateDDay();
            renderHourlyBibleQuote();
            setupMiniEnterKeys();
            renderWrongNotes();
            checkDailyNotify();

            // 스크롤바 클릭 시 input 포커스 튐 및 리셋 방지
            var searchResults = document.getElementById("search-results");
            if (searchResults) {
                searchResults.addEventListener('mousedown', function(e) {
                    if (e.target === searchResults) {
                        e.preventDefault();
                    }
                });
            }
        });

        function toggleTopPanel() {
            var content = document.getElementById("collapsible-control-content");
            var btnText = document.getElementById("panel-toggle-btn-text");
            var isCollapsed = content.classList.toggle("collapsed");
            
            if (isCollapsed) {
                btnText.innerText = "▼ 메뉴 펼치기";
                localStorage.setItem("user_top_panel_collapsed", "true");
            } else {
                btnText.innerText = "▲ 메뉴 접기";
                localStorage.setItem("user_top_panel_collapsed", "false");
            }
        }

        function calculateDDay() {
            var targetDate = new Date("2026-10-02T00:00:00+09:00");
            var now = new Date();
            var diff = targetDate.getTime() - now.getTime();
            var days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            var badgeEl = document.getElementById("exam-dday-badge");
            
            var text = "";
            if (days > 0) text = "D-" + days;
            else if (days === 0) text = "D-DAY 🔥";
            else text = "D+" + Math.abs(days);

            if (badgeEl) badgeEl.innerText = "시험 " + text;
        }

        function renderHourlyBibleQuote() {
            var now = new Date();
            var currentHourKey = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "-" + now.getHours();
            
            var savedHourKey = localStorage.getItem("last_quote_hour_key");
            var savedQuoteIndex = localStorage.getItem("current_quote_index");
            var chosenIndex = 0;

            if (savedHourKey === currentHourKey && savedQuoteIndex !== null) {
                chosenIndex = parseInt(savedQuoteIndex, 10);
            } else {
                chosenIndex = Math.floor(Math.random() * bibleQuotes100.length);
                localStorage.setItem("last_quote_hour_key", currentHourKey);
                localStorage.setItem("current_quote_index", chosenIndex);
            }

            var q = bibleQuotes100[chosenIndex] || bibleQuotes100[0];
            var box = document.getElementById("daily-quote-box");
            if (box) {
                box.innerHTML = '"' + q.text + '" <span>- ' + q.ref + '</span>';
            }
        }

        function applyFontSize() {
            document.documentElement.style.setProperty('--base-font-size', currentFontSize + 'px');
            localStorage.setItem('user_font_size', currentFontSize);
        }
        function changeFontSize(delta) {
            currentFontSize += delta;
            if (currentFontSize < 11) currentFontSize = 11;
            if (currentFontSize > 22) currentFontSize = 22;
            applyFontSize();
        }
        function resetFontSize() {
            currentFontSize = 14;
            applyFontSize();
        }

        function toggleDarkMode() {
            document.body.classList.toggle('dark-mode');
            var isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('user_dark_mode', isDark);
            document.getElementById('darkmode-toggle-btn').innerText = isDark ? "☀️ 주간" : "🌙 야간";
        }

        function toggleMemorizeMode() {
            if (isChosungMode) toggleChosungMode();

            document.body.classList.toggle('memorize-mode');
            var isMemo = document.body.classList.contains('memorize-mode');
            var btn = document.getElementById('memorize-toggle-btn');
            btn.innerText = isMemo ? "👁️ 암기 ON" : "🙈 암기 OFF";
            btn.classList.toggle('active', isMemo);

            document.getElementById('timer-control-bar').style.display = isMemo ? "flex" : "none";
            updateTimerUI();
        }

        function getChosung(str) {
            var cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
            var result = "";
            for (var i = 0; i < str.length; i++) {
                var code = str.charCodeAt(i) - 44032;
                if (code >= 0 && code <= 11171) {
                    result += cho[Math.floor(code / 588)];
                } else {
                    result += str.charAt(i);
                }
            }
            return result;
        }

        function toggleChosungMode() {
            if (document.body.classList.contains('memorize-mode')) toggleMemorizeMode();

            isChosungMode = !isChosungMode;
            document.body.classList.toggle('chosung-mode', isChosungMode);
            var btn = document.getElementById('chosung-toggle-btn');
            btn.classList.toggle('active', isChosungMode);
            btn.innerText = isChosungMode ? "💡 원문 복원" : "💡 초성 퀴즈";

            var targets = document.querySelectorAll('.red, .blue, .yellow, .mint, .orange, .highlight');
            if (isChosungMode) {
                originalElementsData = [];
                targets.forEach(function(el, idx) {
                    originalElementsData[idx] = el.innerText;
                    el.innerText = getChosung(el.innerText);
                });
            } else {
                targets.forEach(function(el, idx) {
                    if (originalElementsData[idx] !== undefined) {
                        el.innerText = originalElementsData[idx];
                    }
                });
            }
        }

        function setTimerSec(sec) {
            memorizeTimerSec = sec;
            localStorage.setItem('user_timer_sec', sec);
            updateTimerUI();
        }

        function updateTimerUI() {
            document.getElementById('timer-btn-3').classList.toggle('active', memorizeTimerSec === 3);
            document.getElementById('timer-btn-5').classList.toggle('active', memorizeTimerSec === 5);
            document.getElementById('timer-btn-0').classList.toggle('active', memorizeTimerSec === 0);

            if (memorizeTimerSec === 0) {
                document.body.classList.add('press-mode');
            } else {
                document.body.classList.remove('press-mode');
            }
        }

        function setupMemorizeClickEvents() {
            var targets = document.querySelectorAll('.red, .blue, .yellow, .mint, .orange, .highlight');
            targets.forEach(function(el) {
                el.addEventListener('click', function(e) {
                    if (!document.body.classList.contains('memorize-mode')) return;
                    if (memorizeTimerSec === 0) return;

                    if (el.dataset.timerId) {
                        clearTimeout(parseInt(el.dataset.timerId, 10));
                    }

                    el.classList.add('revealed');

                    var timerId = setTimeout(function() {
                        el.classList.remove('revealed');
                        delete el.dataset.timerId;
                    }, memorizeTimerSec * 1000);

                    el.dataset.timerId = timerId;
                });
            });
        }

        // ============================================================
        // 🖊️ 메모창 "펜 전용 필기" 기능
        // 갤럭시 S펜, 레노버 액티브펜 등 스타일러스(pointerType === 'pen')로만
        // 메모창에 포커스/입력이 가능하도록 하고, 손가락 터치나 마우스 클릭으로는
        // 포커스 자체가 되지 않도록 막는다. (물리 키보드 Tab 이동도 함께 차단됨)
        // ============================================================
        var lastMemoPointerType = null;
        var appToastEl = null;
        var appToastTimer = null;
        var penDebugLogFn = null; // 🐛 디버그 패널이 켜져 있으면 여기에 로그 함수가 연결됨

        function showAppToast(msg, duration) {
            if (!appToastEl) {
                appToastEl = document.createElement('div');
                appToastEl.id = 'app-toast';
                appToastEl.style.cssText =
                    'position:fixed;left:50%;bottom:90px;transform:translateX(-50%) translateY(10px);' +
                    'background:rgba(30,30,30,0.92);color:#fff;padding:10px 18px;border-radius:20px;' +
                    'font-size:13px;z-index:99999;pointer-events:none;opacity:0;max-width:85vw;text-align:center;' +
                    'transition:opacity 0.2s, transform 0.2s;';
                document.body.appendChild(appToastEl);
            }
            appToastEl.innerText = msg;
            appToastEl.style.opacity = '1';
            appToastEl.style.transform = 'translateX(-50%) translateY(0)';
            clearTimeout(appToastTimer);
            appToastTimer = setTimeout(function() {
                appToastEl.style.opacity = '0';
                appToastEl.style.transform = 'translateX(-50%) translateY(10px)';
            }, duration || 1400);
        }

        function showPenOnlyToast() {
            showAppToast('✏️ 이 메모는 펜(S펜 등)으로만 필기할 수 있어요');
        }

        function isMemoTextarea(el) {
            return !!(el && el.classList && el.classList.contains('page-memo-textarea'));
        }

        // ============================================================
        // 🖊️ 펜으로는 화면(표, 본문, 목록 등 어디서든) 스크롤이 절대 되지 않도록 전역 차단
        // 손가락 스크롤에는 영향 없음. 표(가로 스크롤 테이블) 포함 모든 영역 대상.
        //
        // (중요) 펜이 화면에 "닿는 순간"에 막으려 하면 브라우저(특히 크롬 계열)가
        // 그 전에 이미 스크롤 여부를 컴포지터 단에서 결정해버려 preventDefault가
        // 씹히는 경우가 많다. 그래서 S펜/액티브펜처럼 화면에 닿기 전에 "호버(근접)"를
        // 감지할 수 있는 펜은 그 호버 단계(pointerover/hover pointermove)에서부터
        // 미리 문서 전체의 touch-action을 'none'으로 잠가서, 실제로 펜이 닿기 전에
        // 이미 스크롤이 차단된 상태로 만들어 놓는다. (호버를 지원하지 않는 펜은
        // pointerdown 시점에 바로 잠가 최대한 빨리 대응한다.)
        // ============================================================
        // ============================================================
        // 🐛 임시 디버그 패널: 펜 터치 시 실제로 어떤 포인터 이벤트가
        // 어떤 순서로 찍히는지 화면에서 바로 확인하기 위한 도구.
        // 문제 원인 파악 후에는 이 함수와 호출부만 지우면 됨.
        // ============================================================
        function setupPenDebugPanel() {
            if (setupPenDebugPanel._bound) return;
            setupPenDebugPanel._bound = true;

            var LOG_KEY = 'user_pen_debug_log';
            var MAX_LINES = 300;

            var toggleBtn = document.createElement('button');
            toggleBtn.innerText = '🐛';
            toggleBtn.style.cssText =
                'position:fixed;left:8px;bottom:8px;z-index:100000;width:36px;height:36px;' +
                'border-radius:50%;border:1px solid #999;background:#fff;opacity:0.55;font-size:16px;';
            document.body.appendChild(toggleBtn);

            var panel = document.createElement('div');
            panel.style.cssText =
                'position:fixed;left:8px;right:8px;bottom:52px;z-index:100000;max-height:45vh;' +
                'background:rgba(0,0,0,0.9);border-radius:8px;display:none;';
            document.body.appendChild(panel);

            var toolbar = document.createElement('div');
            toolbar.style.cssText = 'display:flex;gap:6px;padding:6px 8px;border-bottom:1px solid #333;';
            var copyBtn = document.createElement('button');
            copyBtn.innerText = '📋 복사';
            copyBtn.style.cssText = 'font-size:11px;padding:4px 10px;border-radius:10px;border:1px solid #666;background:#222;color:#fff;';
            var clearBtn = document.createElement('button');
            clearBtn.innerText = '🗑️ 로그 지우기';
            clearBtn.style.cssText = copyBtn.style.cssText;
            toolbar.appendChild(copyBtn);
            toolbar.appendChild(clearBtn);
            panel.appendChild(toolbar);

            var logBox = document.createElement('div');
            logBox.style.cssText =
                'max-height:calc(45vh - 40px);overflow-y:auto;color:#0f0;font-size:11px;' +
                'font-family:monospace;padding:8px;white-space:pre-wrap;';
            panel.appendChild(logBox);

            var visible = false;
            toggleBtn.addEventListener('click', function() {
                visible = !visible;
                panel.style.display = visible ? 'block' : 'none';
            });

            // 앱을 껐다 켜도 이전 로그가 이어지도록 localStorage에서 불러옴
            var lines = [];
            try {
                var savedLog = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
                if (Array.isArray(savedLog)) lines = savedLog;
            } catch (err) { lines = []; }

            function render() {
                logBox.innerText = lines.join('\n');
                logBox.scrollTop = logBox.scrollHeight;
            }
            function persistLog() {
                try { localStorage.setItem(LOG_KEY, JSON.stringify(lines)); } catch (err) { /* 무시 */ }
            }
            function log(msg) {
                var t = new Date().toISOString().substr(11, 12);
                lines.push(t + '  ' + msg);
                if (lines.length > MAX_LINES) lines.shift();
                render();
                persistLog();
            }
            render();
            penDebugLogFn = log;

            copyBtn.addEventListener('click', function() {
                var text = lines.join('\n');
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(function() {
                        showAppToast('📋 로그를 복사했어요. 붙여넣기 해서 보내주세요.');
                    }).catch(function() {
                        showAppToast('⚠️ 복사에 실패했어요. 로그를 길게 눌러 직접 선택해주세요.');
                    });
                } else {
                    showAppToast('⚠️ 이 브라우저는 자동 복사를 지원하지 않아요. 로그를 길게 눌러 직접 선택해주세요.');
                }
            });

            clearBtn.addEventListener('click', function() {
                lines = [];
                render();
                persistLog();
            });

            ['pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerleave', 'pointerout']
                .forEach(function(evt) {
                    document.addEventListener(evt, function(e) {
                        // pointermove는 너무 많이 찍히니 대략 100ms에 한 번만 기록
                        if (evt === 'pointermove') {
                            var now = Date.now();
                            if (log._lastMove && now - log._lastMove < 100) return;
                            log._lastMove = now;
                        }
                        log(evt + '  type=' + e.pointerType + ' buttons=' + e.buttons +
                            ' x=' + Math.round(e.clientX) + ',' + Math.round(e.clientY) +
                            ' htmlTA=' + (document.documentElement.style.touchAction || '(기본)'));
                    }, true);
                });

            document.addEventListener('touchmove', function(e) {
                var t = e.touches && e.touches[0];
                log('touchmove  touchType=' + (t ? t.touchType : '?'));
            }, { capture: true, passive: true });

            log('--- 디버그 패널 시작됨 (앱 재실행) ---');
        }

        // ============================================================
        // 🖊️ 펜으로 인한 스크롤 "즉시 되돌리기" 가드
        // touch-action 잠금은 타이밍상 첫 움직임에서 아주 살짝 새는 경우가
        // 있어서, 그 대신 실제로 스크롤이 발생하면 그 즉시 원래 있던
        // 위치(창 스크롤 + 표 등 내부 스크롤 컨테이너 모두)로 강제로
        // 되돌려서 사실상 스크롤이 전혀 안 된 것처럼 보이게 만든다.
        // ============================================================
        function setupPenScrollGuard() {
            if (setupPenScrollGuard._bound) return;
            setupPenScrollGuard._bound = true;

            var guardActive = false;
            var lockedWindowX = 0, lockedWindowY = 0;
            var lockedEls = []; // [{ el, top, left }]

            function isScrollable(el) {
                if (!el || el.nodeType !== 1) return false;
                var style = window.getComputedStyle(el);
                var canY = (style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
                var canX = (style.overflowX === 'auto' || style.overflowX === 'scroll') && el.scrollWidth > el.clientWidth;
                return canY || canX;
            }

            function startGuard(e) {
                guardActive = true;
                lockedWindowX = window.scrollX;
                lockedWindowY = window.scrollY;
                lockedEls = [];
                var node = e.target;
                while (node && node !== document.documentElement) {
                    if (isScrollable(node)) {
                        lockedEls.push({ el: node, top: node.scrollTop, left: node.scrollLeft });
                    }
                    node = node.parentElement;
                }
            }

            function stopGuard() {
                guardActive = false;
                lockedEls = [];
                clearTimeout(guardWatchdog);
            }

            var guardWatchdog = null;
            function armWatchdog() {
                // 혹시라도 pointerup/cancel을 못 받는 경우를 대비한 안전 장치.
                // 손가락 스크롤이 영영 막히는 사고를 막기 위해 일정 시간 후 무조건 해제.
                clearTimeout(guardWatchdog);
                guardWatchdog = setTimeout(function() {
                    if (guardActive) {
                        if (penDebugLogFn) penDebugLogFn('⏱️ 워치독: 스크롤 가드 강제 해제');
                        stopGuard();
                    }
                }, 4000);
            }

            // 캡처 단계라서 창 스크롤이든, 표처럼 내부에서 스크롤되는 요소든 다 잡힘
            document.addEventListener('scroll', function(e) {
                if (!guardActive) return;
                var target = e.target;
                if (target === document) {
                    if (window.scrollX !== lockedWindowX || window.scrollY !== lockedWindowY) {
                        if (penDebugLogFn) penDebugLogFn('🔁 창 스크롤 되돌림 (' + Math.round(window.scrollY) + ' -> ' + lockedWindowY + ')');
                        window.scrollTo(lockedWindowX, lockedWindowY);
                    }
                    return;
                }
                for (var i = 0; i < lockedEls.length; i++) {
                    if (lockedEls[i].el === target) {
                        if (penDebugLogFn) penDebugLogFn('🔁 요소 스크롤 되돌림');
                        target.scrollTop = lockedEls[i].top;
                        target.scrollLeft = lockedEls[i].left;
                        return;
                    }
                }
            }, true);

            // 호버(근접) 트리거는 일부러 사용하지 않음: 펜을 뗀 뒤에도 호버가
            // 살짝 남아있으면 해제가 안 되고 손가락 스크롤까지 막혀버리는
            // 부작용이 있었음. pointerdown(실제로 닿는 순간)만 기준으로 삼음.
            document.addEventListener('pointerdown', function(e) {
                if (e.pointerType === 'pen') { startGuard(e); armWatchdog(); }
            }, true);
            document.addEventListener('pointermove', function(e) {
                if (e.pointerType === 'pen' && guardActive) armWatchdog();
            }, true);
            document.addEventListener('pointerup', function(e) {
                if (e.pointerType === 'pen') stopGuard();
            }, true);
            document.addEventListener('pointercancel', function(e) {
                if (e.pointerType === 'pen') stopGuard();
            }, true);
        }

        function disablePenScrollGlobally() {
            if (disablePenScrollGlobally._bound) return;
            disablePenScrollGlobally._bound = true;

            var penLocked = false;
            var unlockWatchdog = null;

            function lockScroll() {
                clearTimeout(unlockWatchdog);
                unlockWatchdog = setTimeout(unlockScroll, 4000); // 안전장치: 4초 후 자동 해제
                if (penLocked) return;
                penLocked = true;
                document.documentElement.style.touchAction = 'none';
                document.body.style.touchAction = 'none';
            }
            function unlockScroll() {
                clearTimeout(unlockWatchdog);
                if (!penLocked) return;
                penLocked = false;
                document.documentElement.style.touchAction = '';
                document.body.style.touchAction = '';
            }

            // 호버(근접) 트리거는 사용하지 않음 (펜을 뗀 뒤 잠금이 안 풀리는 문제 방지).
            // 실제로 화면에 닿는 pointerdown 시점부터만 잠금.
            document.addEventListener('pointerdown', function(e) {
                if (e.pointerType === 'pen') lockScroll();
            }, true);
            document.addEventListener('pointermove', function(e) {
                if (e.pointerType === 'pen') {
                    lockScroll();
                    e.preventDefault();
                }
            }, { capture: true, passive: false });

            document.addEventListener('pointerup', function(e) {
                if (e.pointerType === 'pen') unlockScroll();
            }, true);
            document.addEventListener('pointercancel', function(e) {
                if (e.pointerType === 'pen') unlockScroll();
            }, true);

            // 사파리 등 일부 브라우저의 스타일러스 호환 처리
            document.addEventListener('touchmove', function(e) {
                var t = e.touches && e.touches[0];
                if (t && t.touchType === 'stylus') {
                    e.preventDefault();
                }
            }, { capture: true, passive: false });
        }

        function setupPenOnlyMemoInputs() {
            if (setupPenOnlyMemoInputs._bound) return; // 전역 위임 리스너는 한 번만 등록
            setupPenOnlyMemoInputs._bound = true;

            // 포인터 종류를 먼저 감지 (펜/손가락/마우스)
            document.addEventListener('pointerdown', function(e) {
                if (!isMemoTextarea(e.target)) return;
                lastMemoPointerType = e.pointerType;
                if (e.pointerType !== 'pen') {
                    e.preventDefault();
                    if (document.activeElement === e.target) {
                        e.target.blur();
                    }
                    showPenOnlyToast();
                }
            }, true);

            // 혹시 터치/마우스/키보드 탭 등으로 포커스가 걸리면 즉시 해제
            document.addEventListener('focusin', function(e) {
                if (!isMemoTextarea(e.target)) return;
                if (lastMemoPointerType !== 'pen') {
                    e.target.blur();
                    showPenOnlyToast();
                }
            }, true);

            // 터치 기기 호환성을 위한 이중 안전장치
            document.addEventListener('touchstart', function(e) {
                if (isMemoTextarea(e.target)) {
                    e.preventDefault();
                }
            }, { passive: false, capture: true });
        }

        // ============================================================
        // 🖊️ 단원 본문(설명 내용) 위에 펜으로 직접 필기하는 기능
        // - 각 단원 본문(sub-page-header ~ quiz-section 사이 영역)만 대상으로 함
        //   (문제 풀이 화면, 종합모의고사(ch3) 화면, 메모창은 대상 아님)
        // - 펜(pointerType === 'pen')만 그림을 그릴 수 있고,
        //   손가락 터치/마우스는 항상 그대로 스크롤·버튼 클릭 등 기존 동작을 함
        // - 항상 켜져있는 상태로 동작 (별도 on/off 버튼 없음)
        // ============================================================
        var PEN_INK_COLOR = '#2b6cb0';

        function createPenCanvasForPage(page) {
            var header = page.querySelector('.sub-page-header');
            var quizSection = page.querySelector('.quiz-section');
            if (!header || !quizSection) return; // 본문 구조가 아니면(예: 종합모의고사) 건드리지 않음

            var wrap = document.createElement('div');
            wrap.className = 'unit-body-wrap';

            var node = header.nextSibling;
            var toMove = [];
            while (node && node !== quizSection) {
                toMove.push(node);
                node = node.nextSibling;
            }
            toMove.forEach(function(n) { wrap.appendChild(n); });
            page.insertBefore(wrap, quizSection);

            var canvas = document.createElement('canvas');
            canvas.className = 'unit-pen-canvas';
            wrap.appendChild(canvas);
            var ctx = canvas.getContext('2d');

            // ---- 필기 데이터: 이미지(PNG)가 아니라 "선 좌표"만 저장 ----
            // 이미지로 저장하면 페이지가 길수록 용량이 커져서 저장 공간이 금방
            // 부족해지고, 그러면 조용히 저장 실패하는 문제가 있었음.
            // 좌표(벡터)로 저장하면 용량이 훨씬 작고 저장 실패 위험도 크게 줄어듦.
            var strokes = loadStrokes();

            function loadStrokes() {
                try {
                    var raw = localStorage.getItem('user_pen_body_' + page.id);
                    if (!raw) return [];
                    var parsed = JSON.parse(raw);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (err) { return []; }
            }

            function persistStrokes() {
                try {
                    if (strokes.length === 0) {
                        localStorage.removeItem('user_pen_body_' + page.id);
                    } else {
                        localStorage.setItem('user_pen_body_' + page.id, JSON.stringify(strokes));
                    }
                } catch (err) {
                    showAppToast('⚠️ 저장 공간이 부족해 필기가 저장되지 않았어요. 다른 페이지의 필기를 지워보세요.', 2500);
                }
            }

            function redrawAll() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                strokes.forEach(function(s) {
                    if (!s.pts || s.pts.length < 2) return;
                    ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
                    ctx.lineWidth = s.w || 2;
                    ctx.beginPath();
                    ctx.moveTo(s.pts[0][0], s.pts[0][1]);
                    for (var i = 1; i < s.pts.length; i++) {
                        ctx.lineTo(s.pts[i][0], s.pts[i][1]);
                    }
                    ctx.stroke();
                });
                ctx.globalCompositeOperation = 'source-over';
            }

            var toolbar = document.createElement('div');
            toolbar.className = 'unit-pen-toolbar';

            var isEraserMode = false;
            var modeBtn = document.createElement('button');
            modeBtn.type = 'button';
            modeBtn.className = 'unit-pen-mode-btn';
            modeBtn.innerText = '✏️ 펜';
            modeBtn.addEventListener('click', function() {
                isEraserMode = !isEraserMode;
                modeBtn.innerText = isEraserMode ? '🧹 지우개' : '✏️ 펜';
                modeBtn.classList.toggle('erasing', isEraserMode);
            });

            var clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'unit-pen-clear-btn';
            clearBtn.innerText = '🗑️ 전체 지우기';
            clearBtn.addEventListener('click', function() {
                if (!confirm('이 페이지의 펜 필기를 모두 지울까요?')) return;
                strokes = [];
                redrawAll();
                localStorage.removeItem('user_pen_body_' + page.id);
            });

            toolbar.appendChild(modeBtn);
            toolbar.appendChild(clearBtn);
            wrap.appendChild(toolbar);

            function resizeCanvas() {
                var dpr = Math.min(window.devicePixelRatio || 1, 2);
                var w = wrap.clientWidth;
                var h = wrap.scrollHeight;
                if (!w || !h) return;
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
                canvas.style.width = w + 'px';
                canvas.style.height = h + 'px';
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.strokeStyle = PEN_INK_COLOR;
                redrawAll();
            }

            if (window.ResizeObserver) {
                new ResizeObserver(resizeCanvas).observe(wrap);
            } else {
                window.addEventListener('resize', resizeCanvas);
            }
            resizeCanvas();

            // ---- 실제 필기 입력 처리 ----
            var currentStroke = null;

            function getPos(e) {
                var rect = canvas.getBoundingClientRect();
                return [e.clientX - rect.left, e.clientY - rect.top];
            }

            wrap.addEventListener('pointerdown', function(e) {
                if (e.pointerType !== 'pen') return; // 손가락/마우스는 무시 -> 기존 클릭/스크롤 동작 유지
                if (e.target && e.target.closest && (e.target.closest('.unit-pen-clear-btn') || e.target.closest('.unit-pen-mode-btn'))) return;
                e.preventDefault();
                var strokeIsEraser = isEraserMode || (e.buttons & 32) === 32 || e.button === 5;
                var lineWidth = strokeIsEraser ? 24 : (1.2 + (e.pressure || 0.5) * 2.5);
                currentStroke = { pts: [getPos(e)], erase: strokeIsEraser, w: lineWidth };
                try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
                ctx.globalCompositeOperation = strokeIsEraser ? 'destination-out' : 'source-over';
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
                ctx.moveTo(currentStroke.pts[0][0], currentStroke.pts[0][1]);
            }, true);

            wrap.addEventListener('pointermove', function(e) {
                if (!currentStroke || e.pointerType !== 'pen') return;
                e.preventDefault();
                var pos = getPos(e);
                if (!currentStroke.erase) {
                    ctx.lineWidth = 1.2 + (e.pressure || 0.5) * 2.5;
                }
                currentStroke.pts.push(pos);
                ctx.lineTo(pos[0], pos[1]);
                ctx.stroke();
            });

            function endStroke(e) {
                if (!currentStroke || e.pointerType !== 'pen') return;
                ctx.globalCompositeOperation = 'source-over';
                try { wrap.releasePointerCapture(e.pointerId); } catch (err) {}
                if (currentStroke.pts.length >= 2) {
                    strokes.push(currentStroke);
                    persistStrokes(); // 디바운스 없이 즉시 저장 (앱을 바로 꺼도 유실 안 되도록)
                }
                currentStroke = null;
            }
            wrap.addEventListener('pointerup', endStroke);
            wrap.addEventListener('pointercancel', endStroke);
        }

        function setupPenAnnotationOverlays() {
            var pages = document.querySelectorAll('.sub-page:not([data-pen-ready])');
            pages.forEach(function(page) {
                page.setAttribute('data-pen-ready', '1');
                createPenCanvasForPage(page);
            });
        }

        function savePageMemo(pageNum) {
            var memoText = document.getElementById("memo-input-" + pageNum).value;
            localStorage.setItem("user_memo_page_" + pageNum, memoText);
        }

        function savePageMemoB2(pageNum) {
            var memoText = document.getElementById("memo-input-b2-" + pageNum).value;
            localStorage.setItem("user_memo_page_b2_" + pageNum, memoText);
        }

        async function exportUserData() {
            var backupData = { 
                bookmarks: bookmarks, 
                completes: completes, 
                wrongNotes: wrongNotes,
                memos: {},
                bookmarksB2: bookmarksB2,
                completesB2: completesB2,
                memosB2: {},
                bookmarksP21: bookmarksP21,
                completesP21: completesP21,
                memosP21: {}
            };
            for (var i = 1; i <= totalSubPages; i++) {
                var memo = localStorage.getItem("user_memo_page_" + i);
                if (memo) backupData.memos[i] = memo;
            }
            for (var j = 1; j <= totalSubPagesB2; j++) {
                var memoB2 = localStorage.getItem("user_memo_page_b2_" + j);
                if (memoB2) backupData.memosB2[j] = memoB2;
            }
            for (var k = 1; k <= totalSubPagesP21; k++) {
                var memoP21 = localStorage.getItem("user_memo_page_p21_" + k);
                if (memoP21) backupData.memosP21[k] = memoP21;
            }
            // 단원 본문에 펜으로 필기한 내용도 함께 백업
            backupData.penDrawings = {};
            for (var pi = 0; pi < localStorage.length; pi++) {
                var lsKey = localStorage.key(pi);
                if (lsKey && lsKey.indexOf('user_pen_body_') === 0) {
                    backupData.penDrawings[lsKey.substring('user_pen_body_'.length)] = localStorage.getItem(lsKey);
                }
            }

            // 파일명에 백업 시각(YYMMDDHHmm)을 붙여서 매번 새 이름으로 저장되게 함 (예전처럼 -1, -2 안 쌓임)
            var now = new Date();
            var pad = function(n) { return String(n).padStart(2, '0'); };
            var timestamp = String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate()) + pad(now.getHours()) + pad(now.getMinutes());
            var filename = "소방2급_학습데이터_백업_" + timestamp + ".json";
            var jsonStr = JSON.stringify(backupData, null, 2);

            // 크롬/엣지 등 최신 브라우저: 저장 위치를 직접 고를 수 있는 "다른 이름으로 저장" 창을 띄움
            // (기기별로 마지막에 저장한 폴더를 브라우저가 자체적으로 기억해줌)
            if (window.showSaveFilePicker) {
                try {
                    var handle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{ description: 'JSON 백업 파일', accept: { 'application/json': ['.json'] } }]
                    });
                    var writable = await handle.createWritable();
                    await writable.write(jsonStr);
                    await writable.close();
                    alert("💾 백업 파일이 저장되었습니다! (소방관계법령 + 건축관계법령 + 소방훈련·계획 전체 포함)");
                } catch (err) {
                    if (err && err.name === 'AbortError') {
                        return; // 사용자가 저장을 취소한 경우 - 알림 없이 조용히 종료
                    }
                    alert("❌ 백업 저장 중 오류가 발생했습니다.");
                }
                return;
            }

            // 저장 위치 선택 기능을 지원하지 않는 브라우저(사파리 등)를 위한 예전 방식
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonStr);
            var downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", filename);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            alert("💾 메모와 학습 진도, 오답노트가 안전하게 백업 파일로 다운로드되었습니다! (소방관계법령 + 건축관계법령 + 소방훈련·계획 전체 포함)");
        }

        function importUserData(event) {
            var file = event.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var data = JSON.parse(e.target.result);
                    if (data.bookmarks) localStorage.setItem('user_bookmarks', JSON.stringify(data.bookmarks));
                    if (data.completes) localStorage.setItem('user_completes', JSON.stringify(data.completes));
                    if (data.wrongNotes) localStorage.setItem('user_wrong_notes', JSON.stringify(data.wrongNotes));
                    if (data.memos) {
                        for (var key in data.memos) {
                            localStorage.setItem("user_memo_page_" + key, data.memos[key]);
                        }
                    }
                    if (data.bookmarksB2) localStorage.setItem('user_bookmarks_b2', JSON.stringify(data.bookmarksB2));
                    if (data.completesB2) localStorage.setItem('user_completes_b2', JSON.stringify(data.completesB2));
                    if (data.memosB2) {
                        for (var keyB2 in data.memosB2) {
                            localStorage.setItem("user_memo_page_b2_" + keyB2, data.memosB2[keyB2]);
                        }
                    }
                    if (data.bookmarksP21) localStorage.setItem('user_bookmarks_p21', JSON.stringify(data.bookmarksP21));
                    if (data.completesP21) localStorage.setItem('user_completes_p21', JSON.stringify(data.completesP21));
                    if (data.memosP21) {
                        for (var keyP21 in data.memosP21) {
                            localStorage.setItem("user_memo_page_p21_" + keyP21, data.memosP21[keyP21]);
                        }
                    }
                    if (data.penDrawings) {
                        for (var penKey in data.penDrawings) {
                            localStorage.setItem("user_pen_body_" + penKey, data.penDrawings[penKey]);
                        }
                    }
                    alert("📂 백업 데이터를 성공적으로 복원했습니다! 페이지를 새로고침합니다.");
                    location.reload();
                } catch(err) {
                    alert("❌ 파일 형식이 올바르지 않습니다.");
                }
            };
            reader.readAsText(file);
        }

        function updateProgress() {
            var totalUnits = totalSubPages + totalSubPagesB2 + totalSubPagesP21; // 소방 22 + 건축 7 + 소방훈련.계획 11 = 40
            var doneCount = completes.length + completesB2.length + completesP21.length;
            var percent = Math.round((doneCount / totalUnits) * 100);
            document.getElementById('progress-text').innerText = doneCount + " / " + totalUnits + " (" + percent + "%)";
            document.getElementById('progress-fill').style.width = percent + "%";

            for (var i = 1; i <= totalSubPages; i++) {
                var doneBadge = document.getElementById("card-done-" + i);
                if (doneBadge) {
                    doneBadge.style.display = completes.includes(i) ? "inline-block" : "none";
                }
            }
        }

        function toggleComplete(pageNum) {
            var chk = document.getElementById("check-page-" + pageNum);
            if (chk.checked) {
                if (!completes.includes(pageNum)) completes.push(pageNum);
            } else {
                var idx = completes.indexOf(pageNum);
                if (idx > -1) completes.splice(idx, 1);
            }
            localStorage.setItem('user_completes', JSON.stringify(completes));
            updateProgress();
        }

        function toggleBookmark(pageNum) {
            var index = bookmarks.indexOf(pageNum);
            if (index > -1) {
                bookmarks.splice(index, 1);
            } else {
                bookmarks.push(pageNum);
            }
            localStorage.setItem('user_bookmarks', JSON.stringify(bookmarks));
            updateBookmarkUI();
        }

        function updateBookmarkUI() {
            for (var i = 1; i <= totalSubPages; i++) {
                var btn = document.getElementById("star-btn-" + i);
                var cardStar = document.getElementById("card-star-" + i);
                var isBookmarked = bookmarks.includes(i);
                if (btn) {
                    btn.innerText = isBookmarked ? "★" : "☆";
                    btn.classList.toggle('active', isBookmarked);
                }
                if (cardStar) {
                    cardStar.innerText = isBookmarked ? " ★" : "";
                    cardStar.style.color = "#f59e0b";
                }
            }
        }

        function filterBookmarks() {
            if (bookmarks.length === 0) {
                alert("등록된 북마크가 없습니다.");
                return;
            }
            var cards = document.querySelectorAll("#main-menu-grid .sub-nav-card");
            cards.forEach(function(card, idx) {
                var pageNum = idx + 1;
                card.style.display = bookmarks.includes(pageNum) ? "flex" : "none";
            });
        }

        // ============================================================
        // 📦 파트별 콘텐츠 지연 로딩 (Lazy Loading)
        // 각 파트(Part1-1, Part1-2, Part2-1)의 실제 내용은 index.html이 아니라
        // parts/ 폴더의 별도 파일에 있고, 처음 클릭할 때만 가져와서 채워넣음.
        // 한 번 가져온 파트는 loadedParts에 기록해두고 다시 안 가져옴.
        // ============================================================
        var loadedParts = {};
        var partFileMap = {
            'part1-1': 'parts/part1-1.html',
            'part1-2': 'parts/part1-2.html',
            'part2-1': 'parts/part2-1.html'
        };

        async function loadPartIfNeeded(partName) {
            if (loadedParts[partName]) return true; // 이미 불러온 파트면 다시 안 가져옴

            var containerId = "ch1-" + partName + "-container";
            var container = document.getElementById(containerId);
            container.innerHTML = '<div style="text-align:center; padding:60px 0; color:var(--text-sub);">📦 불러오는 중...</div>';

            try {
                var resp = await fetch(partFileMap[partName]);
                if (!resp.ok) throw new Error('응답 실패');
                var html = await resp.text();
                container.innerHTML = html;
                loadedParts[partName] = true;

                // 방금 채워진 콘텐츠에 저장해둔 체크박스·메모·북마크 상태를 다시 입혀줌
                if (partName === 'part1-1') restorePart1_1State();
                if (partName === 'part1-2') restorePart1_2State();
                if (partName === 'part2-1') restorePart2_1State();

                // 🌟 나중에 불러온 파트의 핵심 단어에도 터치 타이머 리스너 연결
                setupMemorizeClickEvents();
                setupPenOnlyMemoInputs();
                setupPenAnnotationOverlays();

                return true;
            } catch (err) {
                container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#dc2626;">⚠️ 콘텐츠를 불러오지 못했습니다.<br>인터넷 연결을 확인하고 다시 시도해주세요.</div>';
                return false;
            }
        }

        async function showCh1Part(partName) {
            document.getElementById("ch1-part1-1-container").style.display = "none";
            document.getElementById("ch1-part1-2-container").style.display = "none";
            document.getElementById("ch1-part2-1-container").style.display = "none";
            document.getElementById("ch1-main-menu").style.display = "none";

            var containerId = "ch1-" + partName + "-container";
            document.getElementById(containerId).style.display = "block";
            window.scrollTo({ top: 0, behavior: 'instant' });

            var ok = await loadPartIfNeeded(partName);
            if (!ok) return;

            if (partName === 'part1-1') { showSubMenu(); }
            if (partName === 'part1-2') { showSubMenuB2(); }
            if (partName === 'part2-1') { showSubMenuP21(); }
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        // 검색을 하려면 아직 안 열어본 파트의 내용도 미리 다 가져와 있어야 검색이 됨
        // (검색을 실제로 시도할 때만 한 번 다 불러오고, 그 다음부턴 캐시되어 바로 검색됨)
        async function ensureAllPartsLoaded() {
            var names = Object.keys(partFileMap);
            for (var i = 0; i < names.length; i++) {
                if (!loadedParts[names[i]]) {
                    var container = document.getElementById("ch1-" + names[i] + "-container");
                    var wasVisible = container.style.display !== "none";
                    if (!wasVisible) {
                        // 검색용으로 몰래 불러오되, 화면엔 잠깐도 안 보이게 처리
                        try {
                            var resp = await fetch(partFileMap[names[i]]);
                            var html = await resp.text();
                            container.innerHTML = html;
                            loadedParts[names[i]] = true;
                            if (names[i] === 'part1-1') restorePart1_1State();
                            if (names[i] === 'part1-2') restorePart1_2State();
                            if (names[i] === 'part2-1') restorePart2_1State();
                        } catch (err) { /* 실패해도 검색은 계속 진행 (해당 파트만 검색 안 될 뿐) */ }
                    } else {
                        await loadPartIfNeeded(names[i]);
                    }
                }
            }
        }


        function showCh1MainMenu() {
            currentSubPage = 0;
            for (var i = 1; i <= totalSubPages; i++) {
                var page = document.getElementById("sub-page-" + i);
                if (page) page.style.display = "none";
            }
            var cards = document.querySelectorAll("#main-menu-grid .sub-nav-card");
            cards.forEach(function(card) { card.style.display = "flex"; });

            subMenu11 = document.getElementById("sub-page-menu");
            if (subMenu11) subMenu11.style.display = "block";

            document.getElementById("page-nav-bar").style.display = "none";
            document.getElementById("ch1-part1-1-container").style.display = "none";
            document.getElementById("ch1-part1-2-container").style.display = "none";
            document.getElementById("ch1-part2-1-container").style.display = "none";
            document.getElementById("ch1-main-menu").style.display = "block";
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        var currentSubPageB2 = 0;
        var totalSubPagesB2 = 7;
        var completesB2 = JSON.parse(localStorage.getItem('user_completes_b2') || '[]');
        var bookmarksB2 = JSON.parse(localStorage.getItem('user_bookmarks_b2') || '[]');

        function showSubPageB2(pageNum) {
            currentSubPageB2 = pageNum;
            document.getElementById("sub-page-menu-b2").style.display = "none";
            for (var i = 1; i <= totalSubPagesB2; i++) {
                var page = document.getElementById("sub-page-b2-" + i);
                if (page) page.style.display = "none";
            }
            var targetPage = document.getElementById("sub-page-b2-" + pageNum);
            if (targetPage) targetPage.style.display = "block";

            document.getElementById("page-nav-bar-b2").style.display = "flex";
            updateNavButtonsB2();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function showSubMenuB2() {
            currentSubPageB2 = 0;
            for (var i = 1; i <= totalSubPagesB2; i++) {
                var page = document.getElementById("sub-page-b2-" + i);
                if (page) page.style.display = "none";
            }
            var cards = document.querySelectorAll("#main-menu-grid-b2 .sub-nav-card");
            cards.forEach(function(card) { card.style.display = "flex"; });

            document.getElementById("sub-page-menu-b2").style.display = "block";
            document.getElementById("page-nav-bar-b2").style.display = "none";
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function prevSubPageB2() { if (currentSubPageB2 > 1) showSubPageB2(currentSubPageB2 - 1); }
        function nextSubPageB2() { if (currentSubPageB2 < totalSubPagesB2) showSubPageB2(currentSubPageB2 + 1); }

        function updateNavButtonsB2() {
            document.getElementById("btn-prev-b2").disabled = (currentSubPageB2 <= 1);
            document.getElementById("btn-next-b2").disabled = (currentSubPageB2 >= totalSubPagesB2);
        }

        function toggleCompleteB2(pageNum) {
            var chk = document.getElementById("check-page-b2-" + pageNum);
            if (chk.checked) {
                if (!completesB2.includes(pageNum)) completesB2.push(pageNum);
            } else {
                var idx = completesB2.indexOf(pageNum);
                if (idx > -1) completesB2.splice(idx, 1);
            }
            localStorage.setItem('user_completes_b2', JSON.stringify(completesB2));
            updateProgressB2();
            updateProgress(); // 표지의 통합 진도율(소방+건축)도 같이 갱신
        }

        function updateProgressB2() {
            for (var i = 1; i <= totalSubPagesB2; i++) {
                var doneBadge = document.getElementById("card-done-b2-" + i);
                if (doneBadge) doneBadge.style.display = completesB2.includes(i) ? "inline-block" : "none";
            }
        }

        function toggleBookmarkB2(pageNum) {
            var index = bookmarksB2.indexOf(pageNum);
            if (index > -1) bookmarksB2.splice(index, 1);
            else bookmarksB2.push(pageNum);
            localStorage.setItem('user_bookmarks_b2', JSON.stringify(bookmarksB2));
            updateBookmarkUIB2();
        }

        function updateBookmarkUIB2() {
            for (var i = 1; i <= totalSubPagesB2; i++) {
                var btn = document.getElementById("star-btn-b2-" + i);
                var cardStar = document.getElementById("card-star-b2-" + i);
                var isBookmarked = bookmarksB2.includes(i);
                if (btn) {
                    btn.innerText = isBookmarked ? "★" : "☆";
                    btn.classList.toggle('active', isBookmarked);
                }
                if (cardStar) {
                    cardStar.innerText = isBookmarked ? " ★" : "";
                    cardStar.style.color = "#f59e0b";
                }
            }
        }

        function filterBookmarksB2() {
            if (bookmarksB2.length === 0) {
                alert("등록된 북마크가 없습니다.");
                return;
            }
            var cards = document.querySelectorAll("#main-menu-grid-b2 .sub-nav-card");
            cards.forEach(function(card, idx) {
                var pageNum = idx + 1;
                card.style.display = bookmarksB2.includes(pageNum) ? "flex" : "none";
            });
        }

        // ============================================================
        // 🚒 Part2-1. 소방안전교육 및 훈련 / 소방계획의 수립 (11개 단원)
        // Part1-1, Part1-2와는 별도의 독립된 진도/북마크/메모를 씀 (접미사 P21)
        // ============================================================
        var currentSubPageP21 = 0;
        var totalSubPagesP21 = 11;
        var completesP21 = JSON.parse(localStorage.getItem('user_completes_p21') || '[]');
        var bookmarksP21 = JSON.parse(localStorage.getItem('user_bookmarks_p21') || '[]');

        function showSubPageP21(pageNum) {
            currentSubPageP21 = pageNum;
            document.getElementById("sub-page-menu-p21").style.display = "none";
            for (var i = 1; i <= totalSubPagesP21; i++) {
                var page = document.getElementById("sub-page-p21-" + i);
                if (page) page.style.display = "none";
            }
            var targetPage = document.getElementById("sub-page-p21-" + pageNum);
            if (targetPage) targetPage.style.display = "block";

            document.getElementById("page-nav-bar-p21").style.display = "flex";
            updateNavButtonsP21();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function showSubMenuP21() {
            currentSubPageP21 = 0;
            for (var i = 1; i <= totalSubPagesP21; i++) {
                var page = document.getElementById("sub-page-p21-" + i);
                if (page) page.style.display = "none";
            }
            var cards = document.querySelectorAll("#main-menu-grid-p21 .sub-nav-card");
            cards.forEach(function(card) { card.style.display = "flex"; });

            document.getElementById("sub-page-menu-p21").style.display = "block";
            document.getElementById("page-nav-bar-p21").style.display = "none";
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function prevSubPageP21() { if (currentSubPageP21 > 1) showSubPageP21(currentSubPageP21 - 1); }
        function nextSubPageP21() { if (currentSubPageP21 < totalSubPagesP21) showSubPageP21(currentSubPageP21 + 1); }

        function updateNavButtonsP21() {
            document.getElementById("btn-prev-p21").disabled = (currentSubPageP21 <= 1);
            document.getElementById("btn-next-p21").disabled = (currentSubPageP21 >= totalSubPagesP21);
        }

        function toggleCompleteP21(pageNum) {
            var chk = document.getElementById("check-page-p21-" + pageNum);
            if (chk.checked) {
                if (!completesP21.includes(pageNum)) completesP21.push(pageNum);
            } else {
                var idx = completesP21.indexOf(pageNum);
                if (idx > -1) completesP21.splice(idx, 1);
            }
            localStorage.setItem('user_completes_p21', JSON.stringify(completesP21));
            updateProgressP21();
            updateProgress(); // 표지의 통합 진도율도 같이 갱신
        }

        function updateProgressP21() {
            for (var i = 1; i <= totalSubPagesP21; i++) {
                var doneBadge = document.getElementById("card-done-p21-" + i);
                if (doneBadge) doneBadge.style.display = completesP21.includes(i) ? "inline-block" : "none";
            }
        }

        function toggleBookmarkP21(pageNum) {
            var index = bookmarksP21.indexOf(pageNum);
            if (index > -1) bookmarksP21.splice(index, 1);
            else bookmarksP21.push(pageNum);
            localStorage.setItem('user_bookmarks_p21', JSON.stringify(bookmarksP21));
            updateBookmarkUIP21();
        }

        function updateBookmarkUIP21() {
            for (var i = 1; i <= totalSubPagesP21; i++) {
                var btn = document.getElementById("star-btn-p21-" + i);
                var cardStar = document.getElementById("card-star-p21-" + i);
                var isBookmarked = bookmarksP21.includes(i);
                if (btn) {
                    btn.innerText = isBookmarked ? "★" : "☆";
                    btn.classList.toggle('active', isBookmarked);
                }
                if (cardStar) {
                    cardStar.innerText = isBookmarked ? " ★" : "";
                    cardStar.style.color = "#f59e0b";
                }
            }
        }

        function filterBookmarksP21() {
            if (bookmarksP21.length === 0) {
                alert("등록된 북마크가 없습니다.");
                return;
            }
            var cards = document.querySelectorAll("#main-menu-grid-p21 .sub-nav-card");
            cards.forEach(function(card, idx) {
                var pageNum = idx + 1;
                card.style.display = bookmarksP21.includes(pageNum) ? "flex" : "none";
            });
        }

        function savePageMemoP21(pageNum) {
            var memoText = document.getElementById("memo-input-p21-" + pageNum).value;
            localStorage.setItem("user_memo_page_p21_" + pageNum, memoText);
        }

        function showCh11Part(partName) {
            if (partName === 'part1-1') {
                document.getElementById("ch1-1-main-menu").style.display = "none";
                document.getElementById("ch1-1-part1-1-container").style.display = "block";
            }
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function showCh11MainMenu() {
            document.getElementById("ch1-1-part1-1-container").style.display = "none";
            document.getElementById("ch1-1-main-menu").style.display = "block";
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function showCh3Page(pageNum) {
            document.getElementById("ch3-page-menu").style.display = "none";
            document.getElementById("ch3-sub-page-1").style.display = "none";
            document.getElementById("ch3-sub-page-2").style.display = "none";
            document.getElementById("ch3-sub-page-3").style.display = "none";
            document.getElementById("ch3-sub-page-4").style.display = "none";
            document.getElementById("ch3-sub-page-5").style.display = "none";
            
            var testPage = document.getElementById("ch3-sub-page-" + pageNum);
            if (testPage) testPage.style.display = "block";
            if (pageNum === 5) {
                backToRandomSelect();
            }
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function showCh3Menu() {
            document.getElementById("ch3-sub-page-1").style.display = "none";
            document.getElementById("ch3-sub-page-2").style.display = "none";
            document.getElementById("ch3-sub-page-3").style.display = "none";
            document.getElementById("ch3-sub-page-4").style.display = "none";
            document.getElementById("ch3-sub-page-5").style.display = "none";
            document.getElementById("ch3-page-menu").style.display = "block";
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function checkMiniChoice(qKey, clickedBtn, correctVal) {
            var item = clickedBtn.closest('.mini-q-item');
            var resEl = document.getElementById("res-" + qKey);
            var isDark = document.body.classList.contains('dark-mode');

            var allBtns = item.querySelectorAll('.mini-opt-grid button');
            allBtns.forEach(function(btn) {
                btn.style.backgroundColor = "";
                btn.style.color = "";
            });

            var userVal = clickedBtn.innerText.trim();
            resEl.style.display = "block";

            var qTitleEl = item.querySelector('.mini-q-title');
            var qTitle = qTitleEl ? qTitleEl.innerText.trim() : "단원 퀴즈";

            if (userVal === correctVal.trim()) {
                resEl.innerHTML = "<span style='color:" + (isDark ? "#4ade80" : "#16a34a") + ";'>정답입니다! 🎉</span>";
                clickedBtn.style.backgroundColor = isDark ? "#064e3b" : "#dcfce7";
                clickedBtn.style.color = isDark ? "#86efac" : "#166534";
                
                if (wrongNotes[qKey]) {
                    delete wrongNotes[qKey];
                    localStorage.setItem('user_wrong_notes', JSON.stringify(wrongNotes));
                    renderWrongNotes();
                }
            } else {
                resEl.innerHTML = "<span style='color:" + (isDark ? "#f87171" : "#dc2626") + ";'>오답입니다! (정답: " + correctVal + ")</span>";
                clickedBtn.style.backgroundColor = isDark ? "#7f1d1d" : "#fee2e2";
                clickedBtn.style.color = isDark ? "#fca5a5" : "#991b1b";

                wrongNotes[qKey] = {
                    id: qKey,
                    title: qTitle,
                    correct: correctVal.trim(),
                    wrongChoice: userVal,
                    expl: "단원별 핵심 기출 확인 문제입니다.",
                    type: "단원별 3선 퀴즈"
                };
                localStorage.setItem('user_wrong_notes', JSON.stringify(wrongNotes));
                renderWrongNotes();
            }
        }

        function resetSectionQuiz(secKey) {
            var items = document.querySelectorAll('.mini-q-item[data-sec="' + secKey + '"]');
            items.forEach(function(item) {
                var btns = item.querySelectorAll('button');
                btns.forEach(function(b) {
                    b.style.backgroundColor = "";
                    b.style.color = "";
                });
                var res = item.querySelector('[id^="res-"]');
                if (res) {
                    res.style.display = "none";
                    res.innerHTML = "";
                }
            });
        }

        function checkAnswerByText(qId, clickedBtn, correctText) {
            var box = clickedBtn.closest('.quiz-box');
            var resultEl = document.getElementById("q-result-" + qId);
            var explEl = document.getElementById("q-expl-" + qId);
            var isDark = document.body.classList.contains('dark-mode');

            var allBtns = box.querySelectorAll('.opt-btn');
            allBtns.forEach(function(btn) {
                btn.style.backgroundColor = "";
                btn.style.color = "";
                btn.style.borderColor = "";
            });

            var selectedText = clickedBtn.innerText.trim();
            var isCorrect = (selectedText === correctText.trim());
            quizAnswerState[qId] = isCorrect;

            if (resultEl) resultEl.style.display = "block";
            if (explEl) explEl.style.display = "block";

            var qTitleEl = box.querySelector('.quiz-q-title');
            var qTitle = qTitleEl ? qTitleEl.innerText.trim() : "문제";
            var qExpl = explEl ? explEl.innerText.replace("💡 해설:", "").trim() : "";

            if (isCorrect) {
                if (resultEl) resultEl.innerHTML = "<span style='color: " + (isDark ? "#4ade80" : "#16a34a") + ";'>정답입니다! 🎉</span>";
                clickedBtn.style.backgroundColor = isDark ? "#064e3b" : "#dcfce7";
                clickedBtn.style.color = isDark ? "#86efac" : "#166534";

                if (wrongNotes[qId]) {
                    delete wrongNotes[qId];
                    localStorage.setItem('user_wrong_notes', JSON.stringify(wrongNotes));
                    renderWrongNotes();
                }
            } else {
                if (resultEl) resultEl.innerHTML = "<span style='color: " + (isDark ? "#f87171" : "#dc2626") + ";'>오답입니다! (정답: " + correctText + ")</span>";
                clickedBtn.style.backgroundColor = isDark ? "#7f1d1d" : "#fee2e2";
                clickedBtn.style.color = isDark ? "#fca5a5" : "#991b1b";

                var itemType = "모의고사";
                if (qId.startsWith("ch11-")) itemType = "I. 복습예제";
                else if (qId.startsWith("ch3-1-")) itemType = "모의고사 01회차";
                else if (qId.startsWith("ch3-2-")) itemType = "모의고사 02회차";

                wrongNotes[qId] = {
                    id: qId,
                    title: qTitle,
                    correct: correctText.trim(),
                    wrongChoice: selectedText,
                    expl: qExpl,
                    type: itemType
                };
                localStorage.setItem('user_wrong_notes', JSON.stringify(wrongNotes));
                renderWrongNotes();
            }

            if (qId.startsWith('ch3-1-')) updateQuizScore(1, 10);
            if (qId.startsWith('ch3-2-')) updateQuizScore(2, 20);
            if (qId.startsWith('ch3-3-')) updateQuizScore(3, 40);
            if (qId.startsWith('ch3-4-')) updateQuizScore(4, 60);
            if (qId.startsWith('ch3-5-')) updateQuizScore(5, currentRandomExamCount);
        }

        function checkAnswerByInput(qId, inputEl, correctList) {
            var box = inputEl.closest('.quiz-box');
            var resultEl = document.getElementById("q-result-" + qId);
            var explEl = document.getElementById("q-expl-" + qId);
            var isDark = document.body.classList.contains('dark-mode');

            var userVal = inputEl.value.trim();
            var isCorrect = correctList.some(function(c) { return userVal === c.trim(); });
            quizAnswerState[qId] = isCorrect;

            if (resultEl) resultEl.style.display = "block";
            if (explEl) explEl.style.display = "block";

            var qTitleEl = box ? box.querySelector('.quiz-q-title') : null;
            var qTitle = qTitleEl ? qTitleEl.innerText.trim() : "문제";
            var qExpl = explEl ? explEl.innerText.replace("💡 해설:", "").trim() : "";
            var correctDisplay = correctList[0];

            inputEl.style.borderColor = isCorrect ? (isDark ? "#4ade80" : "#16a34a") : (isDark ? "#f87171" : "#dc2626");

            if (isCorrect) {
                if (resultEl) resultEl.innerHTML = "<span style='color: " + (isDark ? "#4ade80" : "#16a34a") + ";'>정답입니다! 🎉</span>";
                if (wrongNotes[qId]) {
                    delete wrongNotes[qId];
                    localStorage.setItem('user_wrong_notes', JSON.stringify(wrongNotes));
                    renderWrongNotes();
                }
            } else {
                if (resultEl) resultEl.innerHTML = "<span style='color: " + (isDark ? "#f87171" : "#dc2626") + ";'>오답입니다! (정답: " + correctDisplay + ")</span>";
                wrongNotes[qId] = {
                    id: qId,
                    title: qTitle,
                    correct: correctDisplay,
                    wrongChoice: userVal || "(미입력)",
                    expl: qExpl,
                    type: "모의고사 03회차"
                };
                localStorage.setItem('user_wrong_notes', JSON.stringify(wrongNotes));
                renderWrongNotes();
            }

            if (qId.startsWith('ch3-3-')) updateQuizScore(3, 40);
            if (qId.startsWith('ch3-4-')) updateQuizScore(4, 60);
            if (qId.startsWith('ch3-5-')) updateQuizScore(5, currentRandomExamCount);
        }

        function updateQuizScore(subPageNum, totalQ) {
            var correctCount = 0;
            var pointsPerQ = 100 / totalQ;
            for (var i = 1; i <= totalQ; i++) {
                if (quizAnswerState['ch3-' + subPageNum + '-' + i] === true) correctCount++;
            }
            var score = Math.round(correctCount * pointsPerQ);
            document.getElementById('quiz-score-text-' + subPageNum).innerText = "점수: " + score + " / 100점 (정답: " + correctCount + "개)";
            
            var passEl = document.getElementById('quiz-pass-text-' + subPageNum);
            if (score >= 70) {
                passEl.innerText = "합격권 도달! 🏆";
                passEl.style.color = "#16a34a";
            } else {
                passEl.innerText = "합격 기준 미달 (70점 이상 합격)";
                passEl.style.color = "#dc2626";
            }
        }

        function resetAnswer(qId) {
            var box = document.querySelector('[data-qid="' + qId + '"]') || document.getElementById('box-' + qId);
            var resultEl = document.getElementById("q-result-" + qId);
            var explEl = document.getElementById("q-expl-" + qId);

            if (resultEl) { resultEl.style.display = "none"; resultEl.innerHTML = ""; }
            if (explEl) explEl.style.display = "none";

            if (box) {
                var btns = box.querySelectorAll('.opt-btn');
                btns.forEach(function(b) { b.style.backgroundColor = ""; b.style.color = ""; b.style.borderColor = ""; });
                var inputs = box.querySelectorAll('input[type="text"]');
                inputs.forEach(function(inp) { inp.value = ""; inp.style.borderColor = ""; });
            }
            delete quizAnswerState[qId];
        }

        function resetAllQuestions(prefix, totalQ) {
            for (var i = 1; i <= totalQ; i++) { resetAnswer(prefix + i); }
        }

        function toggleWrongOnly(subPageNum, totalQ) {
            var btn = document.getElementById('btn-filter-wrong-' + subPageNum);
            var isCurrentMode = !filterWrongModes[subPageNum];
            filterWrongModes[subPageNum] = isCurrentMode;

            for (var i = 1; i <= totalQ; i++) {
                var box = document.getElementById('box-ch3-' + subPageNum + '-' + i);
                if (!box) continue;

                if (isCurrentMode) {
                    if (quizAnswerState['ch3-' + subPageNum + '-' + i] === false) {
                        box.style.display = 'block';
                    } else {
                        box.style.display = 'none';
                    }
                } else {
                    box.style.display = 'block';
                }
            }

            btn.classList.toggle('active', isCurrentMode);
            btn.innerText = isCurrentMode ? "📑 전체 문제 보기" : "❌ 오답만 보기";
        }

        function shuffleSection(containerId) {
            var wrap = document.getElementById(containerId);
            if (!wrap) return;
            var boxes = Array.from(wrap.children);
            for (var i = boxes.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                wrap.appendChild(boxes[j]);
            }
            alert("🔀 문제 순서가 섞였습니다!");
        }

        function loadSavedStates() {
            if (localStorage.getItem('user_dark_mode') === 'true') {
                document.body.classList.add('dark-mode');
                document.getElementById('darkmode-toggle-btn').innerText = "☀️ 주간";
            }
            if (localStorage.getItem('user_top_panel_collapsed') === 'false') {
                var panelContent = document.getElementById('collapsible-control-content');
                var panelBtnText = document.getElementById('panel-toggle-btn-text');
                if (panelContent) panelContent.classList.remove('collapsed');
                if (panelBtnText) panelBtnText.innerText = "▲ 메뉴 접기";
            }
            if (localStorage.getItem('user_tab_menu_flat') === 'true') {
                document.body.classList.add('flat-tab-menu');
                var tabMenuBtn = document.getElementById('tab-menu-style-btn');
                if (tabMenuBtn) tabMenuBtn.innerText = "☰ 탭 메뉴: 일자형";
            }
            completes.forEach(function(pageNum) {
                var chk = document.getElementById("check-page-" + pageNum);
                if (chk) chk.checked = true;
            });
            for (var i = 1; i <= totalSubPages; i++) {
                var savedMemo = localStorage.getItem("user_memo_page_" + i);
                if (savedMemo) {
                    var memoInput = document.getElementById("memo-input-" + i);
                    if (memoInput) memoInput.value = savedMemo;
                }
            }
            updateBookmarkUI();
            updateTimerUI();
            updateProgress();
        }

        // Part1-1 콘텐츠가 나중에(지연 로딩으로) 화면에 채워진 직후 호출 - 체크박스·메모·북마크 복원
        function restorePart1_1State() {
            completes.forEach(function(pageNum) {
                var chk = document.getElementById("check-page-" + pageNum);
                if (chk) chk.checked = true;
            });
            for (var i = 1; i <= totalSubPages; i++) {
                var savedMemo = localStorage.getItem("user_memo_page_" + i);
                if (savedMemo) {
                    var memoInput = document.getElementById("memo-input-" + i);
                    if (memoInput) memoInput.value = savedMemo;
                }
            }
            updateBookmarkUI();
            updateProgress();
        }

        // Part1-2 콘텐츠가 지연 로딩으로 채워진 직후 호출
        function restorePart1_2State() {
            completesB2.forEach(function(pageNum) {
                var chk = document.getElementById("check-page-b2-" + pageNum);
                if (chk) chk.checked = true;
            });
            for (var j = 1; j <= totalSubPagesB2; j++) {
                var savedMemoB2 = localStorage.getItem("user_memo_page_b2_" + j);
                if (savedMemoB2) {
                    var memoInputB2 = document.getElementById("memo-input-b2-" + j);
                    if (memoInputB2) memoInputB2.value = savedMemoB2;
                }
            }
            updateBookmarkUIB2();
            updateProgressB2();
            updateProgress();
        }

        // Part2-1 콘텐츠가 지연 로딩으로 채워진 직후 호출
        function restorePart2_1State() {
            completesP21.forEach(function(pageNum) {
                var chkP21 = document.getElementById("check-page-p21-" + pageNum);
                if (chkP21) chkP21.checked = true;
            });
            for (var k = 1; k <= totalSubPagesP21; k++) {
                var savedMemoP21 = localStorage.getItem("user_memo_page_p21_" + k);
                if (savedMemoP21) {
                    var memoInputP21 = document.getElementById("memo-input-p21-" + k);
                    if (memoInputP21) memoInputP21.value = savedMemoP21;
                }
            }
            updateBookmarkUIP21();
            updateProgressP21();
            updateProgress();
        }

        function highlightSearchMatch(pageEl, query) {
            var tieredSelectors = ['span', 'li', 'td', 'p', '.note', '.highlight-box', 'h2'];
            var target = null;
            for (var t = 0; t < tieredSelectors.length && !target; t++) {
                var candidates = pageEl.querySelectorAll(tieredSelectors[t]);
                for (var i = 0; i < candidates.length; i++) {
                    if (candidates[i].textContent.toLowerCase().includes(query)) {
                        target = candidates[i];
                        break;
                    }
                }
            }
            if (target) {
                setTimeout(function() {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.classList.add('search-match-flash');
                    setTimeout(function() { target.classList.remove('search-match-flash'); }, 1600);
                }, 150);
            }
        }

        function getSearchableBodyText(pageEl) {
            var clone = pageEl.cloneNode(true);
            var h2 = clone.querySelector('h2');
            if (h2) h2.parentNode.removeChild(h2);
            return (clone.innerText || clone.textContent || "").toLowerCase();
        }

        async function handleSearch() {
            var input = document.getElementById("search-input");
            var clearBtn = document.getElementById("search-clear-btn");
            var query = input.value.trim().toLowerCase();
            var resultsContainer = document.getElementById("search-results");
            
            clearBtn.style.display = input.value.length > 0 ? "block" : "none";

            if (query.length < 1) { 
                resultsContainer.style.display = "none"; 
                resultsContainer.innerHTML = "";
                lastSearchQuery = "";
                return; 
            }

            // 검색어가 동일할 때 스크롤바 클릭 등에 의한 불필요한 innerHTML 초기화 방지
            if (query === lastSearchQuery && resultsContainer.children.length > 0) {
                return;
            }
            lastSearchQuery = query;

            // 아직 안 열어본 파트가 있으면 검색을 위해 미리 다 불러옴 (최초 검색 시 한 번만 살짝 지연될 수 있음)
            resultsContainer.innerHTML = '<div class="search-result-item" style="color:var(--text-sub);">🔍 검색 중...</div>';
            resultsContainer.style.display = "block";
            await ensureAllPartsLoaded();

            // 그 사이 검색어가 또 바뀌었으면(사용자가 계속 타이핑 중) 이 결과는 버림
            if (input.value.trim().toLowerCase() !== query) return;

            resultsContainer.innerHTML = "";

            var matches = [];
            for (var i = 1; i <= totalSubPages; i++) {
                var pageEl = document.getElementById("sub-page-" + i);
                if (pageEl && getSearchableBodyText(pageEl).includes(query)) {
                    var title = pageEl.querySelector("h2").innerText;
                    matches.push({ pageNum: i, title: title, part: 'part1-1' });
                }
            }
            for (var j = 1; j <= totalSubPagesB2; j++) {
                var pageElB2 = document.getElementById("sub-page-b2-" + j);
                if (pageElB2 && getSearchableBodyText(pageElB2).includes(query)) {
                    var titleB2 = pageElB2.querySelector("h2").innerText;
                    matches.push({ pageNum: j, title: titleB2, part: 'part1-2' });
                }
            }
            for (var k = 1; k <= totalSubPagesP21; k++) {
                var pageElP21 = document.getElementById("sub-page-p21-" + k);
                if (pageElP21 && getSearchableBodyText(pageElP21).includes(query)) {
                    var titleP21 = pageElP21.querySelector("h2").innerText;
                    matches.push({ pageNum: k, title: titleP21, part: 'part2-1' });
                }
            }

            if (matches.length > 0) {
                matches.forEach(function(m) {
                    var div = document.createElement("div");
                    div.className = "search-result-item";
                    var partLabel = (m.part === 'part1-2') ? "[건축법령 " + m.pageNum + "페이지]" : (m.part === 'part2-1') ? "[소방훈련·계획 " + m.pageNum + "페이지]" : "[" + m.pageNum + "페이지]";
                    div.innerHTML = "<b>" + partLabel + "</b> " + m.title;

                    var selectResult = async function() {
                        openTab(null, 'tab-ch1');
                        await showCh1Part(m.part);
                        var targetPageEl;
                        if (m.part === 'part1-2') {
                            showSubPageB2(m.pageNum);
                            targetPageEl = document.getElementById("sub-page-b2-" + m.pageNum);
                        } else if (m.part === 'part2-1') {
                            showSubPageP21(m.pageNum);
                            targetPageEl = document.getElementById("sub-page-p21-" + m.pageNum);
                        } else {
                            showSubPage(m.pageNum);
                            targetPageEl = document.getElementById("sub-page-" + m.pageNum);
                        }
                        highlightSearchMatch(targetPageEl, query);
                        resultsContainer.style.display = "none";
                        input.value = "";
                        clearBtn.style.display = "none";
                        lastSearchQuery = "";
                    };
                    div.onclick = selectResult;
                    resultsContainer.appendChild(div);
                });
                resultsContainer.style.display = "block";
            } else {
                resultsContainer.style.display = "none";
            }
        }

        function clearSearch() {
            var input = document.getElementById("search-input");
            input.value = "";
            document.getElementById("search-clear-btn").style.display = "none";
            document.getElementById("search-results").style.display = "none";
            lastSearchQuery = "";
            input.focus();
        }

        var tabDropdownLabels = {
            'tab-cover': '표지',
            'tab-ch1': 'I. 이론과 개념',
            'tab-numbers': '📐 숫자·기한 총정리',
            'tab-ch1-1': 'I. 복습예제',
            'tab-ch3': '모의고사',
            'tab-wrong': '📕 오답노트'
        };

        function toggleTabDropdown() {
            var list = document.getElementById('tab-dropdown-list');
            var arrow = document.getElementById('tab-dropdown-arrow');
            var isOpen = list.classList.toggle('open');
            arrow.innerText = isOpen ? '▲' : '▼';
        }

        function closeTabDropdown() {
            var list = document.getElementById('tab-dropdown-list');
            var arrow = document.getElementById('tab-dropdown-arrow');
            list.classList.remove('open');
            arrow.innerText = '▼';
        }

        document.addEventListener('click', function(e) {
            var container = document.getElementById('tab-dropdown-container');
            if (container && !container.contains(e.target)) {
                closeTabDropdown();
            }
        });

        function openTab(evt, tabName) {
            var tabcontent = document.getElementsByClassName("tab-content");
            for (var i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
                tabcontent[i].classList.remove("active");
            }
            var tablinks = document.getElementsByClassName("tab-btn");
            for (var i = 0; i < tablinks.length; i++) {
                tablinks[i].classList.remove("active");
            }
            document.getElementById(tabName).style.display = "block";
            document.getElementById(tabName).classList.add("active");
            if (evt && evt.currentTarget) { evt.currentTarget.classList.add("active"); }

            var labelEl = document.getElementById('tab-dropdown-label');
            if (labelEl && tabDropdownLabels[tabName]) {
                labelEl.innerText = tabDropdownLabels[tabName];
            }
            closeTabDropdown();

            if (tabName === 'tab-ch1') {
                showCh1MainMenu();
            }
            if (tabName === 'tab-ch3') {
                showCh3Menu();
            }
            if (tabName === 'tab-wrong') {
                renderWrongNotes();
            }
        }		

        function showSubPage(pageNum) {
            currentSubPage = pageNum;
            document.getElementById("sub-page-menu").style.display = "none";
            for (var i = 1; i <= totalSubPages; i++) {
                var page = document.getElementById("sub-page-" + i);
                if (page) page.style.display = "none";
            }
            var targetPage = document.getElementById("sub-page-" + pageNum);
            if (targetPage) targetPage.style.display = "block";

            document.getElementById("page-nav-bar").style.display = "flex";
            updateNavButtons();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function showSubMenu() {
            currentSubPage = 0;
            for (var i = 1; i <= totalSubPages; i++) {
                var page = document.getElementById("sub-page-" + i);
                if (page) page.style.display = "none";
            }
            document.getElementById("sub-page-menu").style.display = "block";
            document.getElementById("page-nav-bar").style.display = "none";
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function prevSubPage() { if (currentSubPage > 1) showSubPage(currentSubPage - 1); }
        function nextSubPage() { if (currentSubPage < totalSubPages) showSubPage(currentSubPage + 1); }

        function updateNavButtons() {
            document.getElementById("btn-prev").disabled = (currentSubPage <= 1);
            document.getElementById("btn-next").disabled = (currentSubPage >= totalSubPages);
        }

        window.onscroll = function() {
            var topBtn = document.getElementById("top-btn");
            if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
                topBtn.style.display = "flex";
            } else {
                topBtn.style.display = "none";
            }
        };

        function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

        function setupMiniEnterKeys() {
            document.querySelectorAll('.mini-text-input').forEach(function(inp) {
                inp.addEventListener('keyup', function(e) {
                    if (e.key === 'Enter') { var btn = inp.nextElementSibling; if (btn) btn.click(); }
                });
            });
        }

        // 오답노트 항목 하나에서 어느 단원(파트+단원 번호)의 문제인지 추정해서 뽑아냄
        function extractUnitFromWrongNote(key, note) {
            var m = note.title.match(/\[(\d+)단원\]/); // 모의고사류: 제목에 "[13단원]"처럼 박혀있음
            if (m) return { part: '1', unit: parseInt(m[1], 10) };
            var m2 = key.match(/^secb2-(\d+)-/); // Part1-2(건축관계법령) 단원 퀴즈
            if (m2) return { part: 'b2', unit: parseInt(m2[1], 10) };
            var m4 = key.match(/^secp21-(\d+)-/); // Part2-1(소방훈련·소방계획) 단원 퀴즈
            if (m4) return { part: 'p21', unit: parseInt(m4[1], 10) };
            var m3 = key.match(/^sec(\d+)-/); // Part1-1(소방관계법령) 단원 퀴즈
            if (m3) return { part: '1', unit: parseInt(m3[1], 10) };
            return null; // 복습예제 등 단원을 특정하기 애매한 경우
        }

        // 오답이 가장 많이 쌓인 단원 TOP 5를 계산해서 보여줌 (복습 우선순위 파악용)
        function renderWeakUnitSummary() {
            var summaryEl = document.getElementById("wrong-unit-summary");
            if (!summaryEl) return;

            var counts = {}; // key: "1-13" 또는 "b2-3" 형태, value: {part, unit, count}
            Object.keys(wrongNotes).forEach(function(k) {
                var info = extractUnitFromWrongNote(k, wrongNotes[k]);
                if (!info) return;
                var mapKey = info.part + "-" + info.unit;
                if (!counts[mapKey]) counts[mapKey] = { part: info.part, unit: info.unit, count: 0 };
                counts[mapKey].count++;
            });

            var list = Object.keys(counts).map(function(k) { return counts[k]; });
            list.sort(function(a, b) { return b.count - a.count; });
            list = list.slice(0, 5);

            if (list.length === 0) { summaryEl.innerHTML = ""; return; }

            var html = '<div class="box" style="margin-top:6px; padding: 12px 14px;">';
            html += '<div style="font-weight:800; font-size:0.92em; margin-bottom:8px; color:var(--text-color);">🎯 오답이 많이 쌓인 단원 TOP ' + list.length + ' (복습 우선순위)</div>';
            list.forEach(function(item, idx) {
                var partLabel = (item.part === 'b2') ? '건축법령' : (item.part === 'p21') ? '소방훈련·계획' : '소방법령';
                html += '<div style="display:flex; justify-content:space-between; align-items:center; padding:7px 0; ' + (idx < list.length - 1 ? 'border-bottom:1px dashed var(--border-color);' : '') + '">';
                html += '  <span style="font-size:0.88em; cursor:pointer; color:var(--primary); font-weight:700;" onclick="jumpToWeakUnit(&#39;' + item.part + '&#39;, ' + item.unit + ')">' + (idx + 1) + '. [' + partLabel + '] ' + item.unit + '단원</span>';
                html += '  <span class="badge red" style="font-size:0.78em; padding:2px 8px; border-radius:6px; background:#fee2e2; color:#dc2626; font-weight:800;">' + item.count + '회 오답</span>';
                html += '</div>';
            });
            html += '</div>';
            summaryEl.innerHTML = html;
        }

        // 취약 단원 요약에서 단원명을 누르면 바로 그 단원 이론 페이지로 이동
        async function jumpToWeakUnit(part, unit) {
            openTab(null, 'tab-ch1');
            if (part === 'b2') {
                await showCh1Part('part1-2');
                showSubPageB2(unit);
            } else if (part === 'p21') {
                await showCh1Part('part2-1');
                showSubPageP21(unit);
            } else {
                await showCh1Part('part1-1');
                showSubPage(unit);
            }
        }

        function renderWrongNotes() {
            var container = document.getElementById("wrong-notes-list");
            var countBadge = document.getElementById("wrong-count-badge");
            var keys = Object.keys(wrongNotes);
            
            if (countBadge) {
                countBadge.innerText = keys.length + "개";
            }

            renderWeakUnitSummary();

            if (!container) return;

            if (keys.length === 0) {
                container.innerHTML = '<div class="box" style="text-align:center; color:var(--text-sub); padding:40px 10px;">🎉 현재 오답노트에 등록된 문제가 없습니다!<br>문제를 풀다 틀리면 이곳에 자동으로 누적 정리됩니다.</div>';
                return;
            }

            var html = "";
            keys.forEach(function(k) {
                var item = wrongNotes[k];
                html += '<div class="box wrong-note-card" style="border-left: 4px solid #ef4444; position: relative; margin-bottom: 14px;">';
                html += '  <button class="font-btn" onclick="removeWrongNote(\'' + k + '\')" style="position: absolute; top: 12px; right: 12px; font-size: 0.75em; padding: 4px 8px; background-color: #10b981; color: #ffffff;">완전 정복 (삭제)</button>';
                html += '  <span class="badge blue" style="display:inline-block; font-size: 0.78em; padding: 2px 8px; border-radius: 4px; margin-bottom: 8px;">' + item.type + '</span>';
                html += '  <p style="font-weight: 700; font-size: 1.02em; margin: 4px 0 10px 0; padding-right: 95px; color: var(--text-color); line-height: 1.5;">' + item.title + '</p>';
                html += '  <div style="font-size: 0.9em; margin-bottom: 6px;">❌ <b>내가 고른 답:</b> <span style="color:#dc2626; text-decoration:line-through; font-weight:600;">' + item.wrongChoice + '</span></div>';
                html += '  <div style="font-size: 0.9em; margin-bottom: 8px;">✅ <b>정답:</b> <span style="color:#16a34a; font-weight:700;">' + item.correct + '</span></div>';
                if (item.expl) {
                    html += '  <div class="note" style="margin: 8px 0 0 0; padding: 9px 12px; font-size: 0.88em; line-height: 1.5;">💡 <b>해설:</b> ' + item.expl + '</div>';
                }
                html += '</div>';
            });

            container.innerHTML = html;
        }

        function removeWrongNote(key) {
            delete wrongNotes[key];
            localStorage.setItem('user_wrong_notes', JSON.stringify(wrongNotes));
            renderWrongNotes();
        }

        function clearAllWrongNotes() {
            var keys = Object.keys(wrongNotes);
            if (keys.length === 0) {
                alert("비울 오답노트 내역이 없습니다.");
                return;
            }
            if (confirm("오답노트에 저장된 모든 문제를 삭제하시겠습니까?")) {
                wrongNotes = {};
                localStorage.setItem('user_wrong_notes', JSON.stringify(wrongNotes));
                renderWrongNotes();
            }
        }

        var exitTrapArmed = false;

        function armExitTrap() {
            if (location.hash !== '#studying') {
                history.pushState({ exitTrap: true }, '', '#studying');
            }
            exitTrapArmed = true;
        }

        function handleBackAttempt() {
            if (exitTrapArmed) {
                exitTrapArmed = false;
                var overlay = document.getElementById('exit-confirm-overlay');
                if (overlay) overlay.style.display = 'flex';
            }
        }

        window.addEventListener('popstate', handleBackAttempt);
        window.addEventListener('hashchange', handleBackAttempt);

        function cancelExitApp() {
            var overlay = document.getElementById('exit-confirm-overlay');
            if (overlay) overlay.style.display = 'none';
            armExitTrap();
        }

        function confirmExitApp() {
            var overlay = document.getElementById('exit-confirm-overlay');
            if (overlay) overlay.style.display = 'none';
            window.close();
        }

        armExitTrap();
        document.addEventListener('DOMContentLoaded', armExitTrap);

        var questionPool = [{"unit":null,"type":"mc","q":"소방기본법의 제정 목적으로 가장 적절한 것은?","opts":["공공의 안녕 및 질서 유지와 복리증진","화재의 예방 및 진압 우선","건축물 안전기준 확립","위험물 허가 업무 수행"],"correct":"공공의 안녕 및 질서 유지와 복리증진","expl":"소방기본법의 목적은 공공의 안녕 및 질서 유지와 복리증진입니다."},{"unit":null,"type":"mc","q":"다음 중 소방관계법령상 '관계인'의 범위에 포함되지 않는 사람은?","opts":["소유자","관리자","소방안전관리자","점유자"],"correct":"소방안전관리자","expl":"관계인은 소유자, 관리자, 점유자입니다."},{"unit":null,"type":"mc","q":"무창층 요건 중 개구부의 크기 및 위치 기준이 옳은 것은?","opts":["지름 40cm 이상, 1.5m 이내","지름 50cm 이상, 1.2m 이내","지름 60cm 이상, 1.0m 이내","지름 50cm 이상, 1.5m 이내"],"correct":"지름 50cm 이상, 1.2m 이내","expl":"지름 50cm 이상 내접원, 하단 바닥에서 1.2m 이내입니다."},{"unit":null,"type":"mc","q":"다음 중 한국소방안전원의 업무가 아닌 것은?","opts":["종사자 기술 교육","대국민 홍보","행정 위탁업무 수행","위험물 시설의 허가 및 승인"],"correct":"위험물 시설의 허가 및 승인","expl":"위험물 시설의 허가/승인은 행정관청의 업무입니다."},{"unit":null,"type":"mc","q":"아파트로서 50층 이상 또는 지상높이 200m 이상인 건축물의 소방안전관리대상물 등급은?","opts":["특급","1급","2급","3급"],"correct":"특급","expl":"아파트 50층 이상 또는 200m 이상은 특급입니다."},{"unit":null,"type":"mc","q":"관리업자에게 대행시킬 수 있는 업무 범위는?","opts":["소방계획서 작성","피난·방화시설 및 소방시설 관리","화기취급 감독","자위소방대 편성"],"correct":"피난·방화시설 및 소방시설 관리","expl":"피난·방화시설 관리 및 소방시설 관리만 대행 가능합니다."},{"unit":null,"type":"mc","q":"다른 안전관리자와 겸직이 불가능한 등급은?","opts":["특급 및 1급","1급 및 2급","2급 및 3급","모든 등급 겸직 가능"],"correct":"특급 및 1급","expl":"특급 및 1급은 겸직이 엄격히 금지됩니다."},{"unit":null,"type":"mc","q":"소방안전관리자 선임 기한은 사유 발생일로부터 며칠 이내인가?","opts":["14일 이내","20일 이내","30일 이내","60일 이내"],"correct":"30일 이내","expl":"선임은 30일 이내, 신고는 선임일로부터 14일 이내입니다."},{"unit":null,"type":"mc","q":"소방안전관리자 선임 연기 신청이 가능한 대상물은?","opts":["2급 및 3급","특급","1급","전 등급"],"correct":"2급 및 3급","expl":"선임 연기는 2급 및 3급 대상물만 신청 가능합니다."},{"unit":null,"type":"mc","q":"현황표에 반드시 표기해야 하는 항목이 아닌 것은?","opts":["관리자 성명/연락처","근무 위치 (수신기 위치)","대상물 등급 및 명칭","관리자의 자격증 종류"],"correct":"관리자의 자격증 종류","expl":"자격 등급(자격증 종류)은 표기 대상이 아닙니다."},{"unit":1,"type":"mc","q":"「화재의 예방 및 안전관리에 관한 법률」의 제정 목적으로 옳은 것은?","opts":["공공의 안녕 및 질서 유지와 복리증진","공공의 안전과 복리증진","소방시설의 규격화 및 산업 육성","국민의 재산권 보호와 피해보상"],"correct":"공공의 안전과 복리증진","expl":"화재예방법과 소방시설법의 목적은 '공공의 안전과 복리증진'이며, 소방기본법의 목적은 '공공의 안녕 및 질서 유지와 복리증진'입니다."},{"unit":2,"type":"mc","q":"소방관계법령상 '소방대상물'에 해당하지 않는 것은?","opts":["항구에 매어둔 선박","도로상에서 운행 중인 차량","산림 및 야외 물건","공해상을 항해 중인 선박"],"correct":"공해상을 항해 중인 선박","expl":"선박은 '항구에 매어둔 선박'만 소방대상물이며, 항해 중인 선박은 제외됩니다."},{"unit":2,"type":"mc","q":"소방기본법령상 화재 현장에서 소방대를 지휘하는 '소방대장'에 해당하는 사람은?","opts":["소방청장 또는 시·도지사","소방본부장 또는 소방서장","의용소방대장","자위소방대장"],"correct":"소방본부장 또는 소방서장","expl":"소방대장은 화재 현장에서 소방대를 지휘하는 '소방본부장 또는 소방서장(본또서장)' 등 현장지휘관을 말합니다."},{"unit":3,"type":"mc","q":"'무창층'이란 지상층 중 유효 개구부 면적의 합계가 해당 층 바닥면적의 얼마 이하가 되는 층인가?","opts":["1/10 이하","1/20 이하","1/30 이하","1/50 이하"],"correct":"1/30 이하","expl":"무창층은 개구부 면적의 합계가 해당 층 바닥면적의 30분의 1 이하인 지상층을 말합니다."},{"unit":4,"type":"mc","q":"다음 중 한국소방안전원의 업무 범위에 속하지 않는 것은?","opts":["소방안전에 관한 대국민 교육 및 홍보","소방기술과 안전관리에 관한 조사·연구","소방안전에 관한 간행물 발간","소방용품의 형식승인 및 제품검사"],"correct":"소방용품의 형식승인 및 제품검사","expl":"소방용품의 형식승인 및 제품검사는 '한국소방산업기술원(KFI)'의 고유 업무입니다."},{"unit":5,"type":"mc","q":"'1급 소방안전관리대상물'의 기준에 해당하는 것은?","opts":["연면적 10만m² 이상인 특정소방대상물","50층 이상이거나 높이 200m 이상인 아파트","30층 이상이거나 지상높이 120m 이상인 아파트","자동화재탐지설비만 설치된 대상물"],"correct":"30층 이상이거나 지상높이 120m 이상인 아파트","expl":"아파트 30층 이상 또는 120m 이상은 1급입니다. (연면적 10만m² 및 아파트 50층/200m 이상은 특급)"},{"unit":5,"type":"mc","q":"'간이스프링클러설비' 또는 '자동화재탐지설비'만 설치된 특정소방대상물의 등급은?","opts":["특급 소방안전관리대상물","1급 소방안전관리대상물","2급 소방안전관리대상물","3급 소방안전관리대상물"],"correct":"3급 소방안전관리대상물","expl":"간이스프링클러설비 또는 자동화재탐지설비 설치 대상은 3급입니다. (일반 스프링클러설비 설치 대상은 2급)"},{"unit":6,"type":"mc","q":"소방안전관리자의 피난·방화시설 관리 및 화기취급 감독 업무일지 작성 주기 및 보관 연수는?","opts":["주 1회 이상 작성, 1년간 보관","월 1회 이상 작성, 2년간 보관","분기 1회 이상 작성, 3년간 보관","반기 1회 이상 작성, 5년간 보관"],"correct":"월 1회 이상 작성, 2년간 보관","expl":"업무수행에 관한 기록·유지는 월 1회 이상 작성하고, 작성한 날부터 2년간 보관해야 합니다."},{"unit":6,"type":"mc","q":"관리업자에게 업무를 대행하게 하여 선임된 소방안전관리자는 선임일로부터 몇 개월 이내에 강습교육을 이수해야 하는가?","opts":["1개월 이내","2개월 이내","3개월 이내","6개월 이내"],"correct":"3개월 이내","expl":"업무 대행 시 소방안전관리자는 선임된 날부터 3개월 이내에 안전원이 실시하는 강습교육을 이수해야 합니다."},{"unit":7,"type":"mc","q":"다음 중 '2급 소방안전관리자'로 선임될 수 있는 자격 기준에 해당하는 사람은?","opts":["소방공무원으로 1년 이상 근무한 자","경찰공무원으로 3년 이상 근무한 자","위험물기능사 자격 취득자","의용소방대원으로 3년 이상 근무한 자"],"correct":"위험물기능사 자격 취득자","expl":"위험물기능장, 위험물산업기사, 위험물기능사는 2급 선임 자격이 주어집니다. (소방공무원은 3년 이상 근무해야 2급)"},{"unit":8,"type":"mc","q":"2·3급 대상물에서 선임연기 승인을 받은 기간 동안 소방안전관리 업무를 수행해야 하는 자는?","opts":["소방본부장 또는 서장","관계인","인근 소방안전관리자","한국소방안전원장"],"correct":"관계인","expl":"선임 연기 기간 중에는 관계인이 직접 소방안전관리 업무를 수행해야 합니다."},{"unit":8,"type":"mc","q":"소방안전관리자 '실무교육' 이수 기한 및 주기로 옳은 것은?","opts":["선임된 날부터 3개월 이내 이수, 이후 1년 주기","선임된 날부터 6개월 이내 이수, 이후 2년 주기","선임된 날부터 1년 이내 이수, 이후 2년 주기","선임된 날부터 6개월 이내 이수, 이후 3년 주기"],"correct":"선임된 날부터 6개월 이내 이수, 이후 2년 주기","expl":"최초 실무교육은 선임일로부터 6개월 이내, 이후에는 2년마다 1회씩 이수해야 합니다."},{"unit":9,"type":"mc","q":"소방안전관리자 현황표에 기재하는 관리자의 '근무 위치'는 원칙적으로 어디를 의미하는가?","opts":["건물 주출입구 안내데스크","소방 펌프실","화재수신기 설치 장소","옥상 출입문 앞"],"correct":"화재수신기 설치 장소","expl":"현황표의 근무 위치는 평상시 감시 및 제어가 이루어지는 '화재수신기 설치 장소(방재실, 경비실 등)'를 뜻합니다."},{"unit":10,"type":"mc","q":"건설현장 소방안전관리자 선임 신고 시 첨부해야 하는 서류 4종에 해당하지 않는 것은?","opts":["건설현장 소방안전관리자 선임신고서","소방안전관리자 자격증","건설현장 공사 계약서 (사본)","시공사의 사업자등록증 사본"],"correct":"시공사의 사업자등록증 사본","expl":"첨부서류 4가지는 ①선임신고서, ②자격증, ③강습교육 수료증, ④공사 계약서 사본입니다."},{"unit":11,"type":"mc","q":"소방본부장 또는 서장이 의료·노유자시설 등에 불시 소방훈련을 실시하려는 경우, 며칠 전까지 관계인에게 사전 통지해야 하는가?","opts":["3일 전까지","7일 전까지","10일 전까지","14일 전까지"],"correct":"10일 전까지","expl":"불시 소방훈련 사전 통지는 실시 10일 전까지, 평가결과서 통보는 훈련 종료일로부터 10일 이내입니다."},{"unit":11,"type":"mc","q":"관계인이 소방훈련 및 교육을 실시한 후 작성한 훈련결과기록부의 자체 보관 기간은?","opts":["실시한 날부터 1년간","소방훈련 및 교육을 실시한 날부터 2년간","실시한 날부터 3년간","영구 보관"],"correct":"소방훈련 및 교육을 실시한 날부터 2년간","expl":"소방훈련 및 교육 결과기록부는 실시한 날부터 2년간 보관해야 합니다."},{"unit":12,"type":"mc","q":"다음 중 법령상 자체점검 중 '작동점검'을 면제(제외)받는 대상물은?","opts":["1급 소방안전관리대상물","스프링클러가 설치된 아파트","특급 소방안전관리대상물","다중이용업소가 입점한 연면적 3천m² 상가"],"correct":"특급 소방안전관리대상물","expl":"특급 대상물은 종합점검을 반기별(연 2회)로 고강도로 실시하므로 작동점검 대상에서 제외됩니다."},{"unit":12,"type":"mc","q":"다음 중 자체점검 중 '종합점검' 대상에 해당하지 않는 것은?","opts":["스프링클러설비가 설치된 연면적 2천m² 근린생활시설","호스릴 방식의 물분무등소화설비만 설치된 연면적 6천m² 공장","다중이용업 영업장이 설치된 연면적 2천m² 특정소방대상물","제연설비가 설치된 터널"],"correct":"호스릴 방식의 물분무등소화설비만 설치된 연면적 6천m² 공장","expl":"물분무등소화설비 연면적 5천m² 이상 기준에서 '호스릴 방식만을 설치한 곳은 제외'합니다."},{"unit":12,"type":"mc","q":"건축물의 사용승인일이 4월 12일이며, 종합점검과 작동점검을 모두 받아야 하는 특정소방대상물의 작동점검 실시 기한은?","opts":["4월 30일","6월 30일","10월 31일","12월 31일"],"correct":"10월 31일","expl":"둘 다 받는 건물은 사용승인 달인 4월에 종합점검을 받고, 6개월이 되는 달인 10월에 작동점검을 실시합니다."},{"unit":12,"type":"mc","q":"소방시설관리업자가 자체점검을 마친 경우, 점검표를 첨부하여 점검 결과를 관계인에게 제출해야 하는 기한은?","opts":["7일 이내","10일 이내","14일 이내","15일 이내"],"correct":"10일 이내","expl":"관리업자는 점검이 끝난 날부터 10일 이내에 관계인에게 제출하고, 관계인은 15일 이내에 소방서에 보고합니다."},{"unit":13,"type":"mc","q":"화재안전조사 계획을 인터넷 홈페이지 등에 공개해야 하는 기간은?","opts":["3일 이상","7일 이상","14일 이상","30일 이상"],"correct":"7일 이상","expl":"화재안전조사 계획(대상·기간·사유 등)은 조사 전 7일 이상 공개해야 합니다."},{"unit":13,"type":"mc","q":"화재안전조사 항목 전부를 확인하는 조사 방법은?","opts":["부분조사","종합조사","정기조사","수시조사"],"correct":"종합조사","expl":"조사 항목 전부를 확인하면 종합조사, 일부만 확인하면 부분조사입니다."},{"unit":13,"type":"short","q":"화재안전조사를 실시할 수 있는 자는 소방청장, 소방본부장 또는 무엇인가?","answers":["소방서장"],"expl":"화재안전조사 주체는 소방청장, 소방본부장 또는 소방서장(소방관서장)입니다."},{"unit":13,"type":"mc","q":"화재안전조사 결과에 따라 소방관서장이 관계인에게 명할 수 없는 것은?","opts":["개수(고치거나 다시 만듦)","이전·제거","사용금지 또는 제한","형사처벌"],"correct":"형사처벌","expl":"소방관서장은 개수·이전·제거·사용금지(제한)·사용폐쇄·공사정지 등을 명할 수 있으나, 형사처벌은 법원의 권한입니다."},{"unit":14,"type":"mc","q":"단독주택 및 공동주택의 소유자가 설치해야 하는 소방시설은?","opts":["스프링클러설비, 자동화재탐지설비","소화기, 단독경보형감지기","옥내소화전, 옥외소화전","제연설비, 배연설비"],"correct":"소화기, 단독경보형감지기","expl":"단독주택·공동주택 소유자는 소화기와 단독경보형감지기를 설치해야 합니다."},{"unit":14,"type":"mc","q":"소화기·단독경보형감지기 설치 의무에서 제외되는 대상은?","opts":["단독주택","연립주택","다세대주택","아파트 및 기숙사"],"correct":"아파트 및 기숙사","expl":"아파트 및 기숙사는 별도의 소방시설 기준이 적용되어 이 규정에서 제외됩니다."},{"unit":14,"type":"short","q":"소화기·단독경보형감지기 설치 의무는 주택의 누구에게 있는가?","answers":["소유자"],"expl":"설치 의무는 단독주택·공동주택의 소유자에게 있습니다."},{"unit":14,"type":"mc","q":"다음 중 소화기·단독경보형감지기 설치 의무 적용을 받는 대상은?","opts":["아파트","기숙사","연립주택","오피스텔(업무시설)"],"correct":"연립주택","expl":"아파트·기숙사는 제외 대상이며, 연립주택은 공동주택으로서 적용 대상입니다."},{"unit":15,"type":"mc","q":"특별피난계단의 피난 이동 경로 순서로 옳은 것은?","opts":["옥내 → 계단실 → 부속실 → 복도 → 피난층","옥내 → 복도 → 부속실 → 계단실 → 피난층","옥내 → 부속실 → 복도 → 계단실 → 피난층","복도 → 옥내 → 부속실 → 계단실 → 피난층"],"correct":"옥내 → 복도 → 부속실 → 계단실 → 피난층","expl":"특별피난계단의 이동 경로는 옥내 → 복도 → 부속실 → 계단실 → 피난층 순서입니다."},{"unit":15,"type":"mc","q":"옥내와 계단실 사이, 방화문을 이중 설치해 화재·연기 확산을 막는 구획된 공간은?","opts":["복도","부속실","피난층","옥상광장"],"correct":"부속실","expl":"방화문을 이중 설치하여 화재·연기의 영향을 최소화한 공간이 부속실입니다."},{"unit":15,"type":"short","q":"'피난층'이란 곧바로 어디로 가는 출입구가 있는 층인가?","answers":["지상"],"expl":"피난층은 곧바로 지상으로 나가는 출입구가 있는 층입니다."},{"unit":15,"type":"mc","q":"특별피난계단을 설계하는 주된 목적은?","opts":["건축비 절감","화재·연기의 영향 최소화","소음 차단","냉난방 효율 향상"],"correct":"화재·연기의 영향 최소화","expl":"특별피난계단은 화재·연기가 피난·방화시설에 끼치는 영향을 최소화하기 위해 설계됩니다."},{"unit":16,"type":"mc","q":"방화문에 도어스톱(고임장치)을 설치해 항상 열어두는 행위는 어떤 금지행위 유형인가?","opts":["폐쇄행위","훼손행위","설치(적치)행위","변경행위"],"correct":"훼손행위","expl":"자동폐쇄장치의 기능을 저해하는 도어스톱 설치는 훼손행위에 해당합니다."},{"unit":16,"type":"mc","q":"비상구에 고정식 잠금장치(시건장치)를 설치하는 행위는?","opts":["문제 없음","금지행위(폐쇄행위)에 해당","권장 사항","소방서 승인 시 가능"],"correct":"금지행위(폐쇄행위)에 해당","expl":"비상구에 고정식 잠금장치를 설치해 쉽게 열 수 없게 하는 것은 폐쇄행위로 금지됩니다."},{"unit":16,"type":"short","q":"시건장치는 어떤 장치와 같은 의미인가?","answers":["잠금장치","잠금"],"expl":"시건장치는 잠금장치와 같은 뜻으로, 방화문에 시건장치가 있으면 금지행위에 해당합니다."},{"unit":16,"type":"mc","q":"계단·복도·출입구에 물건을 쌓아 장애물을 방치하는 행위는?","opts":["폐쇄행위","훼손행위","설치(적치)행위","변경행위"],"correct":"설치(적치)행위","expl":"계단·복도·출입구에 물건을 적재하거나 장애물을 방치하는 것은 설치(적치)행위입니다."},{"unit":17,"type":"mc","q":"화재 등 비상 시 소방시스템과 연동되어 옥상 출입문 잠금이 자동으로 풀리는 장치는?","opts":["자동폐쇄장치","비상문 자동개폐장치","방화셔터","자동화재탐지설비"],"correct":"비상문 자동개폐장치","expl":"이러한 대상물은 비상 시 잠금이 자동으로 풀리는 비상문 자동개폐장치를 설치해야 합니다."},{"unit":17,"type":"mc","q":"옥상공간을 확보해야 하는 대상 건축물의 층수 기준은?","opts":["5층 이상","11층 이상","15층 이상","20층 이상"],"correct":"11층 이상","expl":"층수가 11층 이상이고 11층 이상 층의 바닥면적 합계가 1만㎡ 이상인 건축물이 해당됩니다."},{"unit":17,"type":"short","q":"피난 용도 광장을 옥상에 설치해야 하는 공동주택의 연면적 기준은 몇 ㎡ 이상인가? (숫자만 입력)","answers":["1000","1천"],"expl":"연면적 1천㎡ 이상인 공동주택이 해당됩니다."},{"unit":17,"type":"mc","q":"5층 이상의 층이 문화 및 집회시설, 종교시설, 판매시설 등으로 쓰이는 경우 설치해야 하는 것은?","opts":["비상문 자동개폐장치 및 옥상 피난 광장","소화기만 추가 비치","스프링클러설비만 추가 설치","해당 없음"],"correct":"비상문 자동개폐장치 및 옥상 피난 광장","expl":"이런 대상은 피난 용도 광장을 옥상에 설치하고 비상문 자동개폐장치를 갖춰야 합니다."},{"unit":18,"type":"mc","q":"소방안전관리자 실무교육을 받아야 하는 대상은?","opts":["자격증만 취득한 사람 전원","실제로 선임된 소방안전관리자 및 보조자","소방공무원 전원","건축주 전원"],"correct":"실제로 선임된 소방안전관리자 및 보조자","expl":"자격증만 취득하고 선임되지 않았다면 실무교육 의무는 없습니다."},{"unit":18,"type":"mc","q":"소방안전관련 업무경력으로 선임된 '보조자'의 최초 실무교육 이수 기한은?","opts":["1개월 이내","3개월 이내","6개월 이내","1년 이내"],"correct":"3개월 이내","expl":"일반 소방안전관리자·보조자는 6개월 이내, 경력으로 선임된 보조자는 3개월 이내입니다."},{"unit":18,"type":"short","q":"최초 실무교육 이후에는 몇 년마다 1회 이상 실무교육을 받아야 하는가? (숫자만 입력)","answers":["2"],"expl":"최초 실무교육 후에는 2년마다 1회 이상 실무교육을 받아야 합니다."},{"unit":18,"type":"mc","q":"실무교육을 받지 않은 경우 소방청장이 정할 수 있는 자격정지의 최대 기간은?","opts":["3개월 이하","6개월 이하","1년 이하","2년 이하"],"correct":"1년 이하","expl":"소방청장은 1년 이하의 기간을 정해 자격을 정지시킬 수 있습니다."},{"unit":19,"type":"mc","q":"소방차 출동을 고의로 방해한 경우의 처벌 기준은?","opts":["200만 원 이하 과태료","5년 이하 징역 또는 5천만 원 이하 벌금","100만 원 이하 과태료","1년 이하 징역"],"correct":"5년 이하 징역 또는 5천만 원 이하 벌금","expl":"고의 방해는 벌금형(5년/5천만원 이하), 단순히 지장을 준 경우는 200만원 이하 과태료입니다."},{"unit":19,"type":"mc","q":"소방안전관리자 자격증을 다른 사람에게 빌려준 경우의 벌칙은?","opts":["300만 원 이하 과태료","1년 이하 징역 또는 1천만 원 이하 벌금","경고 조치만","처벌 규정 없음"],"correct":"1년 이하 징역 또는 1천만 원 이하 벌금","expl":"자격증 대여·알선은 1년 이하 징역 또는 1천만 원 이하 벌금에 해당합니다."},{"unit":19,"type":"short","q":"양벌규정은 벌금형과 과태료 중 어디에만 적용되는가?","answers":["벌금형","벌금"],"expl":"양벌규정은 벌금형에만 적용되며, 과태료에는 적용되지 않습니다."},{"unit":19,"type":"mc","q":"화재·구조·구급이 필요한 상황을 거짓으로 신고한 경우의 과태료는?","opts":["100만 원 이하","200만 원 이하","500만 원 이하","20만 원 이하"],"correct":"500만 원 이하","expl":"거짓 신고는 500만 원 이하의 과태료에 해당하는 가장 높은 과태료 항목 중 하나입니다."},{"unit":20,"type":"mc","q":"화재예방강화지구 지정 대상이 아닌 것은?","opts":["시장지역","석유화학제품 생산공장이 있는 지역","소방시설·소방용수시설이 충분히 갖춰진 지역","노후·불량건축물이 밀집한 지역"],"correct":"소방시설·소방용수시설이 충분히 갖춰진 지역","expl":"오히려 소방시설·소방용수시설 또는 소방출동로가 '없는' 지역이 지정 대상입니다."},{"unit":20,"type":"mc","q":"화재예방강화지구 등에서 원칙적으로 금지되는 행위가 아닌 것은?","opts":["모닥불 피우기","풍등 등 소형 열기구 날리기","안전조치를 한 용접·용단 작업","흡연 등 화기 취급"],"correct":"안전조치를 한 용접·용단 작업","expl":"행안부령에 따라 안전조치를 한 경우는 예외로 인정됩니다."},{"unit":20,"type":"short","q":"소방관서장이 옮긴 물건은 그 날부터 며칠 동안 보관 사실을 공고해야 하는가? (숫자만 입력)","answers":["14"],"expl":"옮긴 날부터 14일 동안 인터넷 홈페이지 등에 공고해야 합니다."},{"unit":20,"type":"mc","q":"물건의 보관기간은 공고 기간 종료일 다음날부터 며칠로 하는가?","opts":["3일","5일","7일","14일"],"correct":"7일","expl":"보관기간은 공고 종료일 다음날부터 7일입니다. (예: 12/1 옮김 → 12/14까지 공고 → 12/15~21 보관, 총 21일)"},{"unit":21,"type":"mc","q":"방염의 목적으로 옳은 것은?","opts":["화재 발생 자체를 원천 차단","연소확대 방지·지연 및 피난시간 확보","건축 비용 절감","소음 차단"],"correct":"연소확대 방지·지연 및 피난시간 확보","expl":"방염의 목적은 연소확대 방지·지연, 피난시간 확보, 인명·재산 피해 최소화입니다."},{"unit":21,"type":"mc","q":"방염대상물품 중 '선처리물품'의 방염성능검사 실시기관은?","opts":["한국소방산업기술원","관할 소방서장","시·도지사","소방청"],"correct":"한국소방산업기술원","expl":"선처리물품은 한국소방산업기술원, 현장처리물품은 시·도지사(관할 소방서장)가 검사합니다."},{"unit":21,"type":"short","q":"현장처리물품의 방염성능검사 실시기관은 시·도지사 또는 관할 무엇인가?","answers":["소방서장"],"expl":"현장처리물품은 시·도지사(관할 소방서장)가 검사를 실시합니다."},{"unit":21,"type":"mc","q":"단란주점·유흥주점·노래연습장 영업장에서 방염대상물품 의무 대상은?","opts":["벽지류 전체","천장재 전체","섬유류·합성수지류를 원료로 한 소파·의자","카펫 전체"],"correct":"섬유류·합성수지류를 원료로 한 소파·의자","expl":"이 업종들은 섬유류·합성수지류 소파·의자에 대해서만 방염 의무가 적용됩니다."},{"unit":22,"type":"mc","q":"합판·섬유판·소파·의자처럼 합격표시를 '바로' 붙일 수 있는 물품의 표시 규격은?","opts":["5mm","8mm","10mm","15mm"],"correct":"8mm","expl":"바로 붙이는 방식은 8mm입니다. (암기: 빨리빨리=8mm)"},{"unit":22,"type":"mc","q":"커튼처럼 '가열'하여 합격표시를 붙이는 물품의 표시 규격은?","opts":["5mm","8mm","10mm","15mm"],"correct":"5mm","expl":"가열하여 붙이는 방식은 5mm입니다. (암기: 오! 뜨거워=5mm)"},{"unit":22,"type":"short","q":"두루마리 포장 방염물품의 합격표시는 제품 폭 끝에서 중앙 방향으로 최소 몇 cm 이상 떨어진 지점에 부착하는가? (숫자만 입력)","answers":["20"],"expl":"두루마리 포장 방염물품은 폭 끝에서 중앙 방향으로 최소 20cm 이상 떨어진 지점에 부착합니다."},{"unit":22,"type":"mc","q":"카펫·소파·의자·섬유판용 합격표시의 바탕색은?","opts":["흰 바탕","은색 바탕","금색 바탕","투명 바탕"],"correct":"흰 바탕","expl":"카펫·소파·의자·섬유판은 흰 바탕에 남색 글자로 표시합니다."},{"unit":1,"type":"mc","q":"소방기본법의 제정 목적으로 옳은 것은?","opts":["공공의 안전과 복리증진","공공의 안녕 및 질서 유지와 복리증진","국민 재산권 보호 최우선","소방시설의 규격화"],"correct":"공공의 안녕 및 질서 유지와 복리증진","expl":"소방기본법의 목적은 공공의 안녕 및 질서 유지와 복리증진입니다."},{"unit":1,"type":"mc","q":"화재예방 및 안전관리에 관한 법률의 제정 목적으로 옳은 것은?","opts":["공공의 안녕 및 질서 유지","공공의 안전과 복리증진","위험물 시설의 안전 확보","건축허가 절차 간소화"],"correct":"공공의 안전과 복리증진","expl":"화재예방법과 소방시설법의 목적은 '공공의 안전과 복리증진'입니다."},{"unit":1,"type":"short","q":"소방기본법에서 규정하는 5대 활동 목적 중 화재를 끄는 활동은 무엇인가?","answers":["진압"],"expl":"예방·경계·진압·구조·구급 중 화재를 끄는 활동이 진압입니다."},{"unit":2,"type":"mc","q":"소방대상물에 해당하지 않는 것은?","opts":["건축물","항구에 매어둔 선박","항해 중인 선박","산림"],"correct":"항해 중인 선박","expl":"항해 중인 선박은 소방대상물에서 제외됩니다."},{"unit":2,"type":"mc","q":"관계인에 해당하지 않는 자는?","opts":["소유자","관리자","점유자","소방안전관리자"],"correct":"소방안전관리자","expl":"소방안전관리자는 원칙적으로 관계인에 포함되지 않습니다."},{"unit":2,"type":"short","q":"곧바로 지상으로 나가는 출입구가 있는 층을 무엇이라 하는가?","answers":["피난층"],"expl":"피난층은 곧바로 지상으로 나가는 출입구가 있는 층입니다."},{"unit":3,"type":"mc","q":"무창층의 개구부 면적 기준으로 옳은 것은?","opts":["바닥면적의 1/20 이하","바닥면적의 1/30 이하","바닥면적의 1/50 이하","바닥면적의 1/10 이하"],"correct":"바닥면적의 1/30 이하","expl":"무창층은 개구부 면적의 합계가 바닥면적의 1/30 이하인 층입니다."},{"unit":3,"type":"short","q":"무창층 개구부 하단이 바닥면으로부터 몇 m 이내에 위치해야 하는가? (숫자만 입력)","answers":["1.2"],"expl":"개구부 하단은 바닥면으로부터 1.2m 이내에 위치해야 합니다."},{"unit":3,"type":"short","q":"무창층 개구부는 지름 몇 cm 이상의 원이 내접할 수 있어야 하는가? (숫자만 입력)","answers":["50"],"expl":"개구부는 지름 50cm 이상의 원이 내접할 수 있어야 합니다."},{"unit":4,"type":"mc","q":"한국소방안전원의 업무가 아닌 것은?","opts":["교육·연구·조사","대국민 홍보","위탁 업무 수행","소방시설의 축조"],"correct":"소방시설의 축조","expl":"소방시설의 축조는 안전원의 업무가 아닙니다."},{"unit":4,"type":"short","q":"한국소방안전원의 주요 목적 중 하나로, 소방 및 안전관리 기술의 향상과 무엇을 하는가? (두 글자)","answers":["홍보"],"expl":"안전원은 소방·안전관리 기술 향상 및 홍보 등을 목적으로 합니다."},{"unit":5,"type":"mc","q":"특급 소방안전관리대상물의 아파트 기준으로 옳은 것은?","opts":["30층 이상 또는 120m 이상","50층 이상 또는 200m 이상","11층 이상 또는 연면적 1.5만m² 이상","층수 무관"],"correct":"50층 이상 또는 200m 이상","expl":"특급 아파트 기준은 50층 이상 또는 지상높이 200m 이상입니다."},{"unit":5,"type":"mc","q":"2급 소방안전관리대상물에 해당하는 것은?","opts":["스프링클러설비 설치 대상","30층 이상 아파트","11층 이상 일반건축물","연면적 10만m² 이상"],"correct":"스프링클러설비 설치 대상","expl":"2급 대상물은 스프링클러설비 설치 대상, 가연성가스 100톤~1천톤 미만 등입니다."},{"unit":5,"type":"short","q":"1급 일반건축물 기준은 11층 이상 또는 연면적 몇 만m² 이상인가? (숫자만 입력)","answers":["1.5"],"expl":"1급 일반건축물은 11층 이상 또는 연면적 1.5만m² 이상입니다."},{"unit":6,"type":"mc","q":"소방안전관리자 업무 대행이 가능한 항목은?","opts":["소방계획서 작성","피난·방화시설의 유지·관리","자위소방대 구성·운영","소방훈련 및 교육"],"correct":"피난·방화시설의 유지·관리","expl":"업무 대행은 피난·방화시설의 유지·관리, 소방시설의 관리(3, 4번 항목)만 가능합니다."},{"unit":6,"type":"short","q":"업무 대행 시 선임된 날부터 몇 개월 내에 강습교육을 이수해야 하는가? (숫자만 입력)","answers":["3"],"expl":"업무 대행 시 선임일로부터 3개월 내에 강습교육을 이수해야 합니다."},{"unit":6,"type":"mc","q":"소방안전관리자 업무수행 기록·유지는 얼마나 자주 작성해야 하는가?","opts":["주 1회 이상","월 1회 이상","분기 1회","연 1회"],"correct":"월 1회 이상","expl":"업무수행 기록은 월 1회 이상 작성하고 2년간 보관해야 합니다."},{"unit":7,"type":"mc","q":"타 안전관리자와 겸직이 절대 불가능한 등급은?","opts":["2급 및 3급","특급 및 1급","1급 및 2급","전체 등급"],"correct":"특급 및 1급","expl":"특급 및 1급 소방안전관리자는 겸직이 절대 불가능합니다."},{"unit":7,"type":"mc","q":"소방공무원 경력 3년 이상으로 선임 가능한 등급은?","opts":["특급","1급","2급","3급"],"correct":"2급","expl":"소방공무원 3년 이상 경력자는 2급 선임이 가능합니다."},{"unit":7,"type":"short","q":"소방공무원 경력 몇 년 이상이면 3급 선임이 가능한가? (숫자만 입력)","answers":["1"],"expl":"소방공무원 1년 이상 경력자는 3급 선임이 가능합니다."},{"unit":8,"type":"short","q":"소방안전관리자 선임 기한은 사유 발생일로부터 몇 일 이내인가? (숫자만 입력)","answers":["30"],"expl":"선임 기한은 사유 발생일로부터 30일 이내입니다."},{"unit":8,"type":"short","q":"소방안전관리자 선임 신고는 선임일로부터 며칠 이내인가? (숫자만 입력)","answers":["14"],"expl":"선임 신고는 선임일로부터 14일 이내에 해야 합니다."},{"unit":8,"type":"mc","q":"선임연기 신청이 가능한 대상물은?","opts":["특급 및 1급 대상물","2급 및 3급 대상물","모든 대상물","해당 없음"],"correct":"2급 및 3급 대상물","expl":"선임연기 신청은 2급·3급 대상물만 가능하며, 특급·1급은 연기가 불가합니다."},{"unit":9,"type":"short","q":"소방안전관리자 현황표 신고 기한은 선임일로부터 며칠 이내인가? (숫자만 입력)","answers":["14"],"expl":"현황표 신고 기한은 선임일로부터 14일 이내입니다."},{"unit":9,"type":"mc","q":"소방안전관리자 현황표에 표기하지 않는 항목은?","opts":["대상물 명칭","선임일자 및 연락처","근무 위치(수신기 위치)","자격증 종류(자격 등급)"],"correct":"자격증 종류(자격 등급)","expl":"자격증 종류(자격 등급)는 현황표 표기 대상이 아닙니다."},{"unit":9,"type":"short","q":"현황표에 기재하는 근무 위치는 주로 어떤 설비의 위치를 말하는가? (설비명)","answers":["화재수신기","화재 수신기","수신기"],"expl":"근무 위치는 주로 화재수신기의 위치를 의미합니다."},{"unit":10,"type":"mc","q":"건설현장 소방안전관리자 선임 신고 의무자는?","opts":["소방서장","공사시공자","건축주","감리자"],"correct":"공사시공자","expl":"건설현장 소방안전관리자 선임 신고는 공사시공자가 합니다."},{"unit":10,"type":"short","q":"건설현장 소방안전관리자 선임 신고 기한은 선임일로부터 며칠 이내인가? (숫자만 입력)","answers":["14"],"expl":"선임일로부터 14일 이내에 신고해야 합니다."},{"unit":11,"type":"short","q":"특급 및 1급 대상물의 소방훈련·교육 결과 제출 기한은 훈련일로부터 며칠 이내인가? (숫자만 입력)","answers":["30"],"expl":"특급·1급 관계인은 훈련 실시 후 30일 이내에 결과를 제출해야 합니다."},{"unit":11,"type":"short","q":"소방훈련 및 교육은 최소 연 몇 회 이상 실시해야 하는가? (숫자만 입력)","answers":["1"],"expl":"소방훈련 및 교육은 연 1회 이상 실시해야 합니다."},{"unit":11,"type":"mc","q":"불시 소방훈련 사전 통지 기한은?","opts":["5일 전까지","10일 전까지","20일 전까지","통지 불필요"],"correct":"10일 전까지","expl":"불시 소방훈련은 실시 10일 전까지 관계인에게 통지해야 합니다."},{"unit":12,"type":"mc","q":"작동점검만 받는 대상의 점검 실시 시기는?","opts":["사용승인일이 속하는 달의 말일까지","연중 아무 때나","분기별 1회","반기별 1회"],"correct":"사용승인일이 속하는 달의 말일까지","expl":"작동점검만 받는 대상은 사용승인일이 속하는 달의 말일까지 실시합니다."},{"unit":12,"type":"mc","q":"종합점검 대상에 해당하지 않는 것은?","opts":["스프링클러설비 설치 대상","다중이용업소 연면적 2천m² 이상","제연설비 설치 터널","연면적 500m² 소규모 근린생활시설"],"correct":"연면적 500m² 소규모 근린생활시설","expl":"연면적 500m²의 소규모 근린생활시설은 종합점검 대상에 해당하지 않습니다."},{"unit":12,"type":"short","q":"자체점검 결과보고서는 점검 완료일로부터 며칠 이내에 관리업자가 관계인에게 제출하는가? (숫자만 입력)","answers":["10"],"expl":"관리업자는 점검 완료일로부터 10일 이내에 결과보고서를 제출합니다."},{"unit":13,"type":"short","q":"화재안전조사 계획은 며칠 이상 공개해야 하는가? (숫자만 입력)","answers":["7"],"expl":"화재안전조사 계획은 조사 전 7일 이상 공개해야 합니다."},{"unit":13,"type":"mc","q":"조사 항목 일부만 확인하는 조사 방법은?","opts":["종합조사","부분조사","정기조사","특별조사"],"correct":"부분조사","expl":"일부 항목만 확인하는 것은 부분조사입니다."},{"unit":13,"type":"short","q":"화재안전조사 실시 주체는 소방청장, 소방본부장 또는 무엇인가?","answers":["소방서장"],"expl":"화재안전조사 주체는 소방청장, 소방본부장 또는 소방서장입니다."},{"unit":14,"type":"mc","q":"소화기·단독경보형감지기 설치 의무에서 제외되는 대상은?","opts":["단독주택","연립주택","다세대주택","아파트 및 기숙사"],"correct":"아파트 및 기숙사","expl":"아파트 및 기숙사는 이 규정에서 제외됩니다."},{"unit":14,"type":"short","q":"소화기·단독경보형감지기 설치 의무는 누구에게 있는가? (두 글자)","answers":["소유자"],"expl":"설치 의무는 주택의 소유자에게 있습니다."},{"unit":15,"type":"mc","q":"특별피난계단의 피난 이동 경로 순서로 옳은 것은?","opts":["옥내→계단실→부속실→복도→피난층","옥내→복도→부속실→계단실→피난층","복도→옥내→부속실→계단실→피난층","옥내→부속실→복도→계단실→피난층"],"correct":"옥내→복도→부속실→계단실→피난층","expl":"이동 경로는 옥내→복도→부속실→계단실→피난층 순서입니다."},{"unit":15,"type":"short","q":"옥내와 계단실 사이 방화문 이중구획된 공간을 무엇이라 하는가? (세 글자)","answers":["부속실"],"expl":"방화문을 이중 설치한 구획 공간이 부속실입니다."},{"unit":16,"type":"mc","q":"방화문에 도어스톱을 설치해 항상 열어두는 행위는?","opts":["폐쇄행위","훼손행위","설치(적치)행위","변경행위"],"correct":"훼손행위","expl":"자동폐쇄장치 기능을 저해하는 도어스톱 설치는 훼손행위입니다."},{"unit":16,"type":"mc","q":"계단·복도·출입구에 물건을 쌓아 장애물을 방치하는 행위는?","opts":["폐쇄행위","훼손행위","설치(적치)행위","변경행위"],"correct":"설치(적치)행위","expl":"물건 적재 및 장애물 방치는 설치(적치)행위입니다."},{"unit":16,"type":"short","q":"시건장치는 어떤 장치와 같은 의미인가? (세 글자)","answers":["잠금장치"],"expl":"시건장치는 잠금장치와 같은 의미입니다."},{"unit":17,"type":"mc","q":"비상시 옥상 출입문 잠금이 자동으로 풀리는 장치는?","opts":["자동폐쇄장치","비상문 자동개폐장치","방화셔터","배연설비"],"correct":"비상문 자동개폐장치","expl":"비상 시 잠금이 자동으로 풀리는 장치는 비상문 자동개폐장치입니다."},{"unit":17,"type":"short","q":"옥상공간 확보 대상 건축물의 층수 기준은 몇 층 이상인가? (숫자만 입력)","answers":["11"],"expl":"층수가 11층 이상인 건축물이 대상입니다."},{"unit":17,"type":"short","q":"피난 용도 광장을 옥상에 설치해야 하는 공동주택의 연면적 기준은 몇 ㎡ 이상인가? (숫자만 입력)","answers":["1000","1천"],"expl":"연면적 1천㎡ 이상인 공동주택이 대상입니다."},{"unit":18,"type":"mc","q":"실무교육 대상은?","opts":["자격증 취득자 전원","실제 선임된 소방안전관리자 및 보조자","소방공무원 전원","건축주"],"correct":"실제 선임된 소방안전관리자 및 보조자","expl":"자격증만 취득하고 선임되지 않았다면 실무교육 의무가 없습니다."},{"unit":18,"type":"mc","q":"최초 실무교육 이후 재교육 주기는?","opts":["1년마다","2년마다","3년마다","5년마다"],"correct":"2년마다","expl":"최초 실무교육 이후에는 2년마다 1회 이상 받아야 합니다."},{"unit":18,"type":"short","q":"실무교육 미이수 시 부과될 수 있는 과태료는 몇 만 원인가? (숫자만 입력)","answers":["50"],"expl":"실무교육 미이수 시 50만 원의 과태료가 부과될 수 있습니다."},{"unit":19,"type":"mc","q":"소방차 출동을 고의로 방해한 경우의 처벌은?","opts":["200만 원 이하 과태료","5년 이하 징역 또는 5천만 원 이하 벌금","100만 원 이하 과태료","처벌 없음"],"correct":"5년 이하 징역 또는 5천만 원 이하 벌금","expl":"고의 방해는 5년 이하 징역 또는 5천만 원 이하 벌금에 해당합니다."},{"unit":19,"type":"short","q":"양벌규정이 적용되는 벌칙 종류는 무엇인가? (예: 벌금형)","answers":["벌금형","벌금"],"expl":"양벌규정은 벌금형에만 적용되며 과태료에는 적용되지 않습니다."},{"unit":19,"type":"short","q":"소방안전관리자 자격증을 빌려준 경우 처벌은 1년 이하 징역 또는 몇 천만 원 이하 벌금인가? (숫자만 입력)","answers":["1"],"expl":"자격증 대여는 1년 이하 징역 또는 1천만 원 이하 벌금에 해당합니다."},{"unit":20,"type":"mc","q":"화재예방강화지구 지정 대상이 아닌 것은?","opts":["시장지역","석유화학제품 생산공장 지역","소방시설이 충분히 갖춰진 지역","노후·불량건축물 밀집 지역"],"correct":"소방시설이 충분히 갖춰진 지역","expl":"오히려 소방시설·소방용수시설이 없는 지역이 지정 대상입니다."},{"unit":20,"type":"short","q":"옮긴 물건은 그 날부터 며칠 동안 보관 사실을 공고해야 하는가? (숫자만 입력)","answers":["14"],"expl":"옮긴 날부터 14일 동안 공고해야 합니다."},{"unit":20,"type":"short","q":"물건 보관 기간은 공고 종료일 다음날부터 며칠인가? (숫자만 입력)","answers":["7"],"expl":"보관기간은 공고 종료일 다음날부터 7일입니다."},{"unit":21,"type":"mc","q":"방염의 목적으로 옳은 것은?","opts":["화재 발생 자체를 원천 차단","연소확대 방지·지연 및 피난시간 확보","건축비 절감","소음 차단"],"correct":"연소확대 방지·지연 및 피난시간 확보","expl":"방염의 목적은 연소확대 방지·지연 및 피난시간 확보입니다."},{"unit":21,"type":"short","q":"선처리물품의 방염성능검사 실시기관은? (기관명)","answers":["한국소방산업기술원"],"expl":"선처리물품은 한국소방산업기술원이 검사를 실시합니다."},{"unit":22,"type":"mc","q":"합격표시를 바로 붙일 수 있는 물품의 표시 규격은?","opts":["5mm","8mm","10mm","15mm"],"correct":"8mm","expl":"바로 붙이는 방식은 8mm입니다."},{"unit":22,"type":"short","q":"가열하여 합격표시를 붙이는 방식의 표시 규격은 몇 mm인가? (숫자만 입력)","answers":["5"],"expl":"가열하여 붙이는 방식은 5mm입니다."}];

        var currentRandomExamCount = 0;

        function startRandomExam(n) {
            currentRandomExamCount = n;

            var shuffled = questionPool.slice();
            for (var i = shuffled.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = tmp;
            }
            var picked = shuffled.slice(0, n);

            var html = "";
            picked.forEach(function(q, idx) {
                var num = idx + 1;
                var qid = "ch3-5-" + num;
                var unitLabel = q.unit ? ("[" + q.unit + "단원] ") : "";
                var qtext = "Q" + num + ". " + unitLabel + q.q;

                if (q.type === "mc") {
                    var optsHtml = "";
                    q.opts.forEach(function(opt) {
                        optsHtml += '<button class="font-btn opt-btn" onclick="checkAnswerByText(\'' + qid + '\', this, \'' + q.correct + '\')">' + opt + '</button>';
                    });
                    html += '<div class="box quiz-box" id="box-' + qid + '" data-qid="' + qid + '" data-correct-text="' + q.correct.replace(/"/g, '&quot;') + '">' +
                        '<button class="font-btn" onclick="resetAnswer(\'' + qid + '\'); updateQuizScore(5, ' + n + ');" style="float:right; font-size: 0.75em; padding: 4px 8px;">🔄 초기화</button>' +
                        '<p class="quiz-q-title" style="font-weight: bold; margin-top:0;">' + qtext + '</p>' +
                        '<div class="quiz-opt-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0;">' + optsHtml + '</div>' +
                        '<div id="q-result-' + qid + '" style="margin-top: 10px; font-weight: bold; display: none;"></div>' +
                        '<div id="q-expl-' + qid + '" class="note" style="display: none;">💡 해설: ' + q.expl + '</div>' +
                        '</div>';
                } else {
                    var answersLiteral = "[" + q.answers.map(function(a) { return "'" + a + "'"; }).join(", ") + "]";
                    html += '<div class="box quiz-box" id="box-' + qid + '" data-qid="' + qid + '">' +
                        '<button class="font-btn" onclick="resetAnswer(\'' + qid + '\'); updateQuizScore(5, ' + n + ');" style="float:right; font-size: 0.75em; padding: 4px 8px;">🔄 초기화</button>' +
                        '<p class="quiz-q-title" style="font-weight: bold; margin-top:0;">' + qtext + ' <span class="blue_nb" style="font-size:0.8em;">(단답형)</span></p>' +
                        '<div style="display:flex; gap:6px; margin:12px 0;">' +
                        '<input type="text" id="input-' + qid + '" class="mini-text-input" placeholder="정답 입력" style="max-width:180px;">' +
                        '<button class="font-btn" onclick="checkAnswerByInput(\'' + qid + '\', document.getElementById(\'input-' + qid + '\'), ' + answersLiteral + ')">확인</button>' +
                        '</div>' +
                        '<div id="q-result-' + qid + '" style="margin-top: 10px; font-weight: bold; display: none;"></div>' +
                        '<div id="q-expl-' + qid + '" class="note" style="display: none;">💡 해설: ' + q.expl + '</div>' +
                        '</div>';
                }
            });

            document.getElementById('ch3-5-questions-wrap').innerHTML = html;
            document.getElementById('ch3-5-select').style.display = 'none';
            document.getElementById('ch3-5-quiz-area').style.display = 'block';

            for (var key in quizAnswerState) {
                if (key.indexOf('ch3-5-') === 0) delete quizAnswerState[key];
            }
            filterWrongModes[5] = false;

            updateQuizScore(5, n);
            setupMiniEnterKeys();
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function backToRandomSelect() {
            document.getElementById('ch3-5-select').style.display = 'block';
            document.getElementById('ch3-5-quiz-area').style.display = 'none';
        }

        function toggleTabMenuStyle() {
            var isFlat = document.body.classList.toggle('flat-tab-menu');
            localStorage.setItem('user_tab_menu_flat', isFlat);
            var btn = document.getElementById('tab-menu-style-btn');
            btn.innerText = isFlat ? "☰ 탭 메뉴: 일자형" : "▾ 탭 메뉴: 드롭다운형";
        }

        function toggleDailyNotify() {
            var btn = document.getElementById('notify-toggle-btn');
            var isEnabled = localStorage.getItem('user_notify_enabled') === 'true';

            if (!isEnabled) {
                if (!('Notification' in window)) {
                    alert('이 브라우저는 알림 기능을 지원하지 않아요.');
                    return;
                }
                Notification.requestPermission().then(function(permission) {
                    if (permission === 'granted') {
                        localStorage.setItem('user_notify_enabled', 'true');
                        btn.innerText = '🔕 매일 알림 끄기';
                        btn.classList.add('active');
                        new Notification('알림이 켜졌어요! 🔔', { body: '이제 앱을 열 때마다 오늘 공부 여부를 확인해드릴게요.' });
                    } else {
                        alert('알림 권한이 거부되었어요. 폰 설정에서 이 사이트의 알림 권한을 허용해주세요.');
                    }
                });
            } else {
                localStorage.setItem('user_notify_enabled', 'false');
                btn.innerText = '🔔 매일 알림 켜기';
                btn.classList.remove('active');
            }
        }

        function checkDailyNotify() {
            var isEnabled = localStorage.getItem('user_notify_enabled') === 'true';
            var btn = document.getElementById('notify-toggle-btn');
            if (isEnabled && btn) {
                btn.innerText = '🔕 매일 알림 끄기';
                btn.classList.add('active');
            }
            if (!isEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;

            var today = new Date().toDateString();
            var lastNotifyDate = localStorage.getItem('last_notify_date');
            if (lastNotifyDate !== today) {
                localStorage.setItem('last_notify_date', today);
                new Notification('소방안전관리자 2급 요약집 🔥', {
                    body: '오늘 아직 공부 안 하셨죠? 지금 잠깐이라도 시작해볼까요?'
                });
            }
        }