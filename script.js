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
        var lastSearchQuery = "";

        var bibleQuotes100 = null;
        var bibleQuotesLoadPromise = null;

        function ensureBibleQuotesLoaded() {
            if (bibleQuotes100) return Promise.resolve(bibleQuotes100);
            if (bibleQuotesLoadPromise) return bibleQuotesLoadPromise;
            bibleQuotesLoadPromise = fetch('parts/bibleQuotes.json')
                .then(function(resp) { return resp.json(); })
                .then(function(data) { bibleQuotes100 = data; return bibleQuotes100; })
                .catch(function() {
                    bibleQuotes100 = [{ text: "환난 중에도 즐거워하나니 이는 환난은 인내를, 인내는 연단을, 연단은 소망을 이루는 줄 앎이로다.", ref: "로마서 5:3-4" }];
                    return bibleQuotes100;
                });
            return bibleQuotesLoadPromise;
        }

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

        async function renderHourlyBibleQuote() {
            var box = document.getElementById("daily-quote-box");
            var quotes = await ensureBibleQuotesLoaded();
            if (!quotes || quotes.length === 0) return;

            var now = new Date();
            var currentHourKey = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + "-" + now.getHours();

            var savedHourKey = localStorage.getItem("last_quote_hour_key");
            var savedQuoteIndex = localStorage.getItem("current_quote_index");
            var chosenIndex = 0;

            if (savedHourKey === currentHourKey && savedQuoteIndex !== null) {
                chosenIndex = parseInt(savedQuoteIndex, 10);
            } else {
                chosenIndex = Math.floor(Math.random() * quotes.length);
                localStorage.setItem("last_quote_hour_key", currentHourKey);
                localStorage.setItem("current_quote_index", chosenIndex);
            }

            var q = quotes[chosenIndex] || quotes[0];
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

        var lastMemoPointerType = null;
        var appToastEl = null;
        var appToastTimer = null;
        var penDebugLogFn = null;

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
            var downloadBtn = document.createElement('button');
            downloadBtn.innerText = '⬇️ 다운로드';
            downloadBtn.style.cssText = copyBtn.style.cssText;
            toolbar.appendChild(copyBtn);
            toolbar.appendChild(clearBtn);
            toolbar.appendChild(downloadBtn);
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
                try { localStorage.setItem(LOG_KEY, JSON.stringify(lines)); } catch (err) {}
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

            downloadBtn.addEventListener('click', function() {
                try {
                    var text = lines.join('\n');
                    var blob = new Blob([text], { type: 'text/plain' });
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    var ts = new Date().toISOString().replace(/[:.]/g, '-');
                    a.href = url;
                    a.download = 'pen-debug-log-' + ts + '.txt';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
                    showAppToast('⬇️ 로그 파일을 다운로드했어요.');
                } catch (err) {
                    showAppToast('⚠️ 다운로드에 실패했어요. 복사 버튼을 이용해주세요.');
                }
            });

            ['pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerleave', 'pointerout']
                .forEach(function(evt) {
                    document.addEventListener(evt, function(e) {
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

        function setupPenScrollGuard() {
            if (setupPenScrollGuard._bound) return;
            setupPenScrollGuard._bound = true;

            var guardActive = false;
            var lockedWindowX = 0, lockedWindowY = 0;
            var releaseTimer = null;

            function startGuard(e) {
                clearTimeout(releaseTimer);
                guardActive = true;
                lockedWindowX = window.scrollX;
                lockedWindowY = window.scrollY;
            }

            function stopGuardNow() {
                guardActive = false;
                clearTimeout(guardWatchdog);
                clearTimeout(releaseTimer);
            }

            function scheduleRelease(delay) {
                clearTimeout(releaseTimer);
                releaseTimer = setTimeout(stopGuardNow, delay);
            }

            var guardWatchdog = null;
            function armWatchdog() {
                clearTimeout(guardWatchdog);
                guardWatchdog = setTimeout(function() {
                    if (guardActive) {
                        stopGuardNow();
                    }
                }, 4000);
            }

            document.addEventListener('scroll', function(e) {
                if (!guardActive) return;
                var target = e.target;
                if (target === document) {
                    if (window.scrollX !== lockedWindowX || window.scrollY !== lockedWindowY) {
                        window.scrollTo(lockedWindowX, lockedWindowY);
                    }
                }
            }, true);

            document.addEventListener('pointerdown', function(e) {
                if (e.pointerType === 'pen') { startGuard(e); armWatchdog(); }
            }, true);
            document.addEventListener('pointermove', function(e) {
                if (e.pointerType === 'pen') {
                    if (!guardActive) { startGuard(e); }
                    armWatchdog();
                }
            }, true);
            document.addEventListener('pointerup', function(e) {
                if (e.pointerType === 'pen') scheduleRelease(200);
            }, true);
            document.addEventListener('pointercancel', function(e) {
                if (e.pointerType === 'pen') scheduleRelease(500);
            }, true);
            document.addEventListener('touchend', function() {
                if (guardActive) scheduleRelease(150);
            }, true);
        }

        function disablePenScrollGlobally() {
            if (disablePenScrollGlobally._bound) return;
            disablePenScrollGlobally._bound = true;

            var penLocked = false;
            var unlockTimer = null;

            function lockScroll() {
                clearTimeout(unlockTimer);
                if (penLocked) return;
                penLocked = true;
                document.documentElement.style.touchAction = 'none';
                document.body.style.touchAction = 'none';
            }
            function unlockScrollNow() {
                clearTimeout(unlockTimer);
                if (!penLocked) return;
                penLocked = false;
                document.documentElement.style.touchAction = '';
                document.body.style.touchAction = '';
            }
            function scheduleUnlock(delay) {
                clearTimeout(unlockTimer);
                unlockTimer = setTimeout(unlockScrollNow, delay);
            }

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
                if (e.pointerType === 'pen') scheduleUnlock(200);
            }, true);
            document.addEventListener('pointercancel', function(e) {
                if (e.pointerType === 'pen') scheduleUnlock(500);
            }, true);
            document.addEventListener('touchend', function() {
                if (penLocked) scheduleUnlock(150);
            }, true);

            document.addEventListener('touchmove', function(e) {
                var t = e.touches && e.touches[0];
                if (t && t.touchType === 'stylus') {
                    e.preventDefault();
                }
            }, { capture: true, passive: false });
        }

        function setupPenOnlyMemoInputs() {
            if (setupPenOnlyMemoInputs._bound) return;
            setupPenOnlyMemoInputs._bound = true;

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

            document.addEventListener('focusin', function(e) {
                if (!isMemoTextarea(e.target)) return;
                if (lastMemoPointerType !== 'pen') {
                    e.target.blur();
                    showPenOnlyToast();
                }
            }, true);

            document.addEventListener('touchstart', function(e) {
                if (isMemoTextarea(e.target)) {
                    e.preventDefault();
                }
            }, { passive: false, capture: true });
        }

        // ============================================================
        // 🖊️ 본문 S펜 필기: 단원 헤더 밑 전용 툴바 + 3색 볼펜 + 고발색 형광펜 + 지우개
        // ============================================================
        function createPenCanvasForPage(page) {
            var header = page.querySelector('.sub-page-header');
            var quizSection = page.querySelector('.quiz-section');
            if (!header || !quizSection) return;

            // 🌟 1. 툴바를 '단원 목록' 헤더 바로 밑에 독립 행으로 생성
            var toolbarRow = document.createElement('div');
            toolbarRow.className = 'unit-pen-toolbar-row';

            var toolbar = document.createElement('div');
            toolbar.className = 'unit-pen-toolbar';

            var currentTool = 'pen';
            var penColor = '#2563eb';
            var highlighterColor = 'rgba(250, 204, 21, 0.78)';

            var btnPen = document.createElement('button');
            btnPen.type = 'button';
            btnPen.className = 'unit-pen-btn active';
            btnPen.innerText = '✏️ 펜';

            var btnHighlighter = document.createElement('button');
            btnHighlighter.type = 'button';
            btnHighlighter.className = 'unit-pen-btn';
            btnHighlighter.innerText = '🖍️ 형광펜';

            var btnEraser = document.createElement('button');
            btnEraser.type = 'button';
            btnEraser.className = 'unit-pen-btn';
            btnEraser.innerText = '🧹 지우개';

            var btnClear = document.createElement('button');
            btnClear.type = 'button';
            btnClear.className = 'unit-pen-btn';
            btnClear.innerText = '🗑️ 비우기';

            var divider1 = document.createElement('div');
            divider1.className = 'unit-pen-divider';
            var divider2 = document.createElement('div');
            divider2.className = 'unit-pen-divider';

            var palette = document.createElement('div');
            palette.style.cssText = 'display:inline-flex;align-items:center;gap:4px;';

            var penColors = [
                { color: '#2563eb', bg: '#2563eb' },
                { color: '#dc2626', bg: '#dc2626' },
                { color: '#0f172a', bg: '#0f172a' }
            ];
            var highColors = [
                { color: 'rgba(250, 204, 21, 0.78)', bg: '#facc15' },
                { color: 'rgba(74, 222, 128, 0.75)', bg: '#4ade80' },
                { color: 'rgba(244, 114, 182, 0.75)', bg: '#f472b6' }
            ];

            function updatePaletteUI() {
                palette.innerHTML = '';
                if (currentTool === 'eraser') {
                    palette.style.display = 'none';
                    return;
                }
                palette.style.display = 'inline-flex';
                var list = (currentTool === 'highlighter') ? highColors : penColors;
                var currentSelected = (currentTool === 'highlighter') ? highlighterColor : penColor;

                list.forEach(function(item) {
                    var dot = document.createElement('span');
                    dot.className = 'unit-pen-color-dot' + (item.color === currentSelected ? ' active' : '');
                    dot.style.backgroundColor = item.bg;
                    dot.addEventListener('click', function(e) {
                        e.stopPropagation();
                        if (currentTool === 'highlighter') {
                            highlighterColor = item.color;
                        } else {
                            penColor = item.color;
                        }
                        updatePaletteUI();
                    });
                    palette.appendChild(dot);
                });
            }

            function setTool(tool) {
                currentTool = tool;
                btnPen.classList.toggle('active', tool === 'pen');
                btnHighlighter.classList.toggle('active', tool === 'highlighter');
                btnEraser.classList.toggle('active', tool === 'eraser');
                updatePaletteUI();
            }

            btnPen.addEventListener('click', function() { setTool('pen'); });
            btnHighlighter.addEventListener('click', function() { setTool('highlighter'); });
            btnEraser.addEventListener('click', function() { setTool('eraser'); });
            btnClear.addEventListener('click', function() {
                if (!confirm('이 페이지의 모든 필기를 지울까요?')) return;
                strokes = [];
                redrawAll();
                localStorage.removeItem('user_pen_body_' + page.id);
            });

            toolbar.appendChild(btnPen);
            toolbar.appendChild(btnHighlighter);
            toolbar.appendChild(btnEraser);
            toolbar.appendChild(divider1);
            toolbar.appendChild(palette);
            toolbar.appendChild(divider2);
            toolbar.appendChild(btnClear);
            toolbarRow.appendChild(toolbar);
            updatePaletteUI();

            // 헤더 바로 아래에 툴바 배치
            header.parentNode.insertBefore(toolbarRow, header.nextSibling);

            // 🌟 2. 본문 내용 영역을 감싸는 wrap 생성
            var wrap = document.createElement('div');
            wrap.className = 'unit-body-wrap';

            var node = toolbarRow.nextSibling;
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
                    
                    if (s.erase) {
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.lineWidth = s.w || 24;
                    } else if (s.isHighlighter) {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.strokeStyle = s.color || 'rgba(250, 204, 21, 0.78)';
                        ctx.lineWidth = s.w || 18;
                    } else {
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.strokeStyle = s.color || '#2563eb';
                        ctx.lineWidth = s.w || 2;
                    }

                    ctx.beginPath();
                    ctx.moveTo(s.pts[0][0], s.pts[0][1]);
                    for (var i = 1; i < s.pts.length; i++) {
                        ctx.lineTo(s.pts[i][0], s.pts[i][1]);
                    }
                    ctx.stroke();
                });
                ctx.globalCompositeOperation = 'source-over';
            }

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
                redrawAll();
            }

            if (window.ResizeObserver) {
                new ResizeObserver(resizeCanvas).observe(wrap);
            } else {
                window.addEventListener('resize', resizeCanvas);
            }
            resizeCanvas();

            var currentStroke = null;

            function getPos(e) {
                var rect = canvas.getBoundingClientRect();
                return [e.clientX - rect.left, e.clientY - rect.top];
            }

            wrap.addEventListener('pointerdown', function(e) {
                if (e.pointerType !== 'pen') return;

                e.preventDefault();
                e.stopPropagation();

                var isEraser = (currentTool === 'eraser') || (e.buttons & 32) === 32 || e.button === 5;
                var isHigh = (currentTool === 'highlighter') && !isEraser;

                var widthVal = isEraser ? 24 : (isHigh ? 18 : (1.2 + (e.pressure || 0.5) * 2.5));
                var strokeColor = isEraser ? '#000000' : (isHigh ? highlighterColor : penColor);

                currentStroke = {
                    pts: [getPos(e)],
                    erase: isEraser,
                    isHighlighter: isHigh,
                    color: strokeColor,
                    w: widthVal
                };

                try { wrap.setPointerCapture(e.pointerId); } catch (err) {}

                ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = widthVal;
                ctx.beginPath();
                ctx.moveTo(currentStroke.pts[0][0], currentStroke.pts[0][1]);
            }, true);

            wrap.addEventListener('pointermove', function(e) {
                if (!currentStroke || e.pointerType !== 'pen') return;
                e.preventDefault();
                e.stopPropagation();
                var pos = getPos(e);
                if (!currentStroke.erase && !currentStroke.isHighlighter) {
                    ctx.lineWidth = 1.2 + (e.pressure || 0.5) * 2.5;
                }
                currentStroke.pts.push(pos);
                ctx.lineTo(pos[0], pos[1]);
                ctx.stroke();
            }, { capture: true, passive: false });

            function endStroke(e) {
                if (!currentStroke || e.pointerType !== 'pen') return;
                ctx.globalCompositeOperation = 'source-over';
                try { wrap.releasePointerCapture(e.pointerId); } catch (err) {}
                if (currentStroke.pts.length >= 2) {
                    strokes.push(currentStroke);
                    persistStrokes();
                }
                currentStroke = null;
            }
            wrap.addEventListener('pointerup', endStroke, true);
            wrap.addEventListener('pointercancel', endStroke, true);
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
            backupData.penDrawings = {};
            for (var pi = 0; pi < localStorage.length; pi++) {
                var lsKey = localStorage.key(pi);
                if (lsKey && lsKey.indexOf('user_pen_body_') === 0) {
                    backupData.penDrawings[lsKey.substring('user_pen_body_'.length)] = localStorage.getItem(lsKey);
                }
            }

            var now = new Date();
            var pad = function(n) { return String(n).padStart(2, '0'); };
            var timestamp = String(now.getFullYear()).slice(2) + pad(now.getMonth() + 1) + pad(now.getDate()) + pad(now.getHours()) + pad(now.getMinutes());
            var filename = "소방2급_학습데이터_백업_" + timestamp + ".json";
            var jsonStr = JSON.stringify(backupData, null, 2);

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
                    if (err && err.name === 'AbortError') return;
                    alert("❌ 백업 저장 중 오류가 발생했습니다.");
                }
                return;
            }

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
            var totalUnits = totalSubPages + totalSubPagesB2 + totalSubPagesP21;
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

        var loadedParts = {};
        var partFileMap = {
            'part1-1': 'parts/part1-1.html',
            'part1-2': 'parts/part1-2.html',
            'part2-1': 'parts/part2-1.html'
        };

        async function loadPartIfNeeded(partName) {
            if (loadedParts[partName]) return true;

            var containerId = "ch1-" + partName + "-container";
            var container = document.getElementById(containerId);
            container.innerHTML = '<div style="text-align:center; padding:60px 0; color:var(--text-sub);">📦 불러오는 중...</div>';

            try {
                var resp = await fetch(partFileMap[partName]);
                if (!resp.ok) throw new Error('응답 실패');
                var html = await resp.text();
                container.innerHTML = html;
                loadedParts[partName] = true;

                if (partName === 'part1-1') restorePart1_1State();
                if (partName === 'part1-2') restorePart1_2State();
                if (partName === 'part2-1') restorePart2_1State();

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

        async function ensureAllPartsLoaded() {
            var names = Object.keys(partFileMap);
            for (var i = 0; i < names.length; i++) {
                if (!loadedParts[names[i]]) {
                    var container = document.getElementById("ch1-" + names[i] + "-container");
                    var wasVisible = container.style.display !== "none";
                    if (!wasVisible) {
                        try {
                            var resp = await fetch(partFileMap[names[i]]);
                            var html = await resp.text();
                            container.innerHTML = html;
                            loadedParts[names[i]] = true;
                            if (names[i] === 'part1-1') restorePart1_1State();
                            if (names[i] === 'part1-2') restorePart1_2State();
                            if (names[i] === 'part2-1') restorePart2_1State();
                        } catch (err) {}
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

            var subMenu11 = document.getElementById("sub-page-menu");
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
            updateProgress();
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
            updateProgress();
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

        var ch11PartContainerIds = { 'part1-1': 'ch1-1-part1-1-container', 'part1-2': 'ch1-1-part1-2-container' };

        function showCh11Part(partName) {
            document.getElementById("ch1-1-main-menu").style.display = "none";
            for (var key in ch11PartContainerIds) {
                var el = document.getElementById(ch11PartContainerIds[key]);
                if (el) el.style.display = (key === partName) ? "block" : "none";
            }
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function showCh11MainMenu() {
            for (var key in ch11PartContainerIds) {
                var el = document.getElementById(ch11PartContainerIds[key]);
                if (el) el.style.display = "none";
            }
            document.getElementById("ch1-1-main-menu").style.display = "block";
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        var loadedCh3Parts = {};
        var ch3PartFileMap = {
            3: 'parts/part3-1.html',
            4: 'parts/part3-2.html'
        };

        async function loadCh3PartIfNeeded(pageNum) {
            if (!ch3PartFileMap[pageNum] || loadedCh3Parts[pageNum]) return true;

            var container = document.getElementById("ch3-sub-page-" + pageNum);
            if (!container) return false;
            container.innerHTML = '<div style="text-align:center; padding:60px 0; color:var(--text-sub);">📦 불러오는 중...</div>';

            try {
                var resp = await fetch(ch3PartFileMap[pageNum]);
                if (!resp.ok) throw new Error('응답 실패');
                var html = await resp.text();
                container.innerHTML = html;
                loadedCh3Parts[pageNum] = true;

                setupMemorizeClickEvents();
                setupPenOnlyMemoInputs();
                setupPenAnnotationOverlays();

                return true;
            } catch (err) {
                container.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#dc2626;">⚠️ 콘텐츠를 불러오지 못했습니다.<br>인터넷 연결을 확인하고 다시 시도해주세요.</div>';
                return false;
            }
        }

        async function showCh3Page(pageNum) {
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

            if (pageNum === 3 || pageNum === 4) {
                await loadCh3PartIfNeeded(pageNum);
            }
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

            if (query === lastSearchQuery && resultsContainer.children.length > 0) {
                return;
            }
            lastSearchQuery = query;

            resultsContainer.innerHTML = '<div class="search-result-item" style="color:var(--text-sub);">🔍 검색 중...</div>';
            resultsContainer.style.display = "block";
            await ensureAllPartsLoaded();

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

        function extractUnitFromWrongNote(key, note) {
            var m = note.title.match(/\[(\d+)단원\]/);
            if (m) return { part: '1', unit: parseInt(m[1], 10) };
            var m2 = key.match(/^secb2-(\d+)-/);
            if (m2) return { part: 'b2', unit: parseInt(m2[1], 10) };
            var m4 = key.match(/^secp21-(\d+)-/);
            if (m4) return { part: 'p21', unit: parseInt(m4[1], 10) };
            var m3 = key.match(/^sec(\d+)-/);
            if (m3) return { part: '1', unit: parseInt(m3[1], 10) };
            return null;
        }

        function renderWeakUnitSummary() {
            var summaryEl = document.getElementById("wrong-unit-summary");
            if (!summaryEl) return;

            var counts = {};
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

        var questionPool = null;
        var questionPoolLoadPromise = null;

        function ensureQuestionPoolLoaded() {
            if (questionPool) return Promise.resolve(questionPool);
            if (questionPoolLoadPromise) return questionPoolLoadPromise;
            questionPoolLoadPromise = fetch('parts/questionPool.json')
                .then(function(resp) { return resp.json(); })
                .then(function(data) { questionPool = data; return questionPool; })
                .catch(function() {
                    alert('문제 데이터를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.');
                    questionPool = [];
                    return questionPool;
                });
            return questionPoolLoadPromise;
        }

        var currentRandomExamCount = 0;

        async function startRandomExam(n) {
            currentRandomExamCount = n;

            var selectBox = document.getElementById('ch3-5-select');
            var originalSelectHtml = selectBox ? selectBox.innerHTML : null;
            if (selectBox) {
                selectBox.innerHTML = '<div style="text-align:center; padding:40px 0; color:var(--text-sub);">📦 문제 불러오는 중...</div>';
            }
            var pool = await ensureQuestionPoolLoaded();
            if (selectBox && originalSelectHtml !== null) {
                selectBox.innerHTML = originalSelectHtml;
            }
            if (!pool || pool.length === 0) return;

            var shuffled = pool.slice();
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
