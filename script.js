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
            updateProgress();
            calculateDDay();
            renderHourlyBibleQuote();
            setupMiniEnterKeys();
            renderWrongNotes();
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

        function savePageMemo(pageNum) {
            var memoText = document.getElementById("memo-input-" + pageNum).value;
            localStorage.setItem("user_memo_page_" + pageNum, memoText);
        }

        function exportUserData() {
            var backupData = { 
                bookmarks: bookmarks, 
                completes: completes, 
                wrongNotes: wrongNotes,
                memos: {} 
            };
            for (var i = 1; i <= totalSubPages; i++) {
                var memo = localStorage.getItem("user_memo_page_" + i);
                if (memo) backupData.memos[i] = memo;
            }
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
            var downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "소방2급_학습데이터_백업.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            alert("💾 메모와 학습 진도, 오답노트가 안전하게 백업 파일로 다운로드되었습니다!");
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
                    alert("📂 백업 데이터를 성공적으로 복원했습니다! 페이지를 새로고침합니다.");
                    location.reload();
                } catch(err) {
                    alert("❌ 파일 형식이 올바르지 않습니다.");
                }
            };
            reader.readAsText(file);
        }

        function updateProgress() {
            var doneCount = completes.length;
            var percent = Math.round((doneCount / totalSubPages) * 100);
            document.getElementById('progress-text').innerText = doneCount + " / " + totalSubPages + " (" + percent + "%)";
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

        function showCh1Part(partName) {
            if (partName === 'part1-1') {
                document.getElementById("ch1-main-menu").style.display = "none";
                document.getElementById("ch1-part1-1-container").style.display = "block";
            }
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function showCh1MainMenu() {
            currentSubPage = 0;
            for (var i = 1; i <= totalSubPages; i++) {
                var page = document.getElementById("sub-page-" + i);
                if (page) page.style.display = "none";
            }
            var cards = document.querySelectorAll("#main-menu-grid .sub-nav-card");
            cards.forEach(function(card) { card.style.display = "flex"; });

            document.getElementById("sub-page-menu").style.display = "block";
            document.getElementById("page-nav-bar").style.display = "none";
            document.getElementById("ch1-part1-1-container").style.display = "none";
            document.getElementById("ch1-main-menu").style.display = "block";
            window.scrollTo({ top: 0, behavior: 'instant' });
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
            
            var testPage = document.getElementById("ch3-sub-page-" + pageNum);
            if (testPage) testPage.style.display = "block";
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        function showCh3Menu() {
            document.getElementById("ch3-sub-page-1").style.display = "none";
            document.getElementById("ch3-sub-page-2").style.display = "none";
            document.getElementById("ch3-sub-page-3").style.display = "none";
            document.getElementById("ch3-sub-page-4").style.display = "none";
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
        }

        // 모의고사 단답형(주관식) 문제 채점 함수 - correctList: 정답으로 인정할 문자열들의 배열
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
            // 상단 "학습 도구" 패널: 이전에 펼쳐둔 적이 있으면 그 상태를 기억하고, 처음 방문이면 기본값(닫힘)을 유지
            if (localStorage.getItem('user_top_panel_collapsed') === 'false') {
                var panelContent = document.getElementById('collapsible-control-content');
                var panelBtnText = document.getElementById('panel-toggle-btn-text');
                if (panelContent) panelContent.classList.remove('collapsed');
                if (panelBtnText) panelBtnText.innerText = "▲ 메뉴 접기";
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

        function handleSearch() {
            var input = document.getElementById("search-input");
            var clearBtn = document.getElementById("search-clear-btn");
            var query = input.value.trim().toLowerCase();
            var resultsContainer = document.getElementById("search-results");
            resultsContainer.innerHTML = "";
            clearBtn.style.display = input.value.length > 0 ? "block" : "none";

            if (query.length < 1) { resultsContainer.style.display = "none"; return; }

            var matches = [];
            for (var i = 1; i <= totalSubPages; i++) {
                var pageEl = document.getElementById("sub-page-" + i);
                if (pageEl && pageEl.innerText.toLowerCase().includes(query)) {
                    var title = pageEl.querySelector("h2").innerText;
                    matches.push({ pageNum: i, title: title });
                }
            }

            if (matches.length > 0) {
                matches.forEach(function(m) {
                    var div = document.createElement("div");
                    div.className = "search-result-item";
                    div.innerHTML = "<b>[" + m.pageNum + "페이지]</b> " + m.title;
                    div.onclick = function() {
                        showCh1Part('part1-1');
                        showSubPage(m.pageNum);
                        resultsContainer.style.display = "none";
                        input.value = "";
                        clearBtn.style.display = "none";
                    };
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
            input.focus();
        }

        // 드롭다운 버튼을 눌렀을 때 목록을 열고 닫음
        var tabDropdownLabels = {          // 탭 id별로 드롭다운 버튼에 표시할 짧은 이름
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

        // 드롭다운 목록을 강제로 닫음 (탭 선택 후, 또는 바깥을 클릭했을 때 호출)
        function closeTabDropdown() {
            var list = document.getElementById('tab-dropdown-list');
            var arrow = document.getElementById('tab-dropdown-arrow');
            list.classList.remove('open');
            arrow.innerText = '▼';
        }

        // 드롭다운이 열려있는 상태에서, 메뉴 바깥(다른 곳)을 클릭하면 자동으로 닫히게 함
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

            // 드롭다운 버튼의 표시 글자를 선택한 탭 이름으로 바꾸고, 목록은 닫음
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

        var touchstartX = 0, touchendX = 0, touchstartY = 0, touchendY = 0;

        document.addEventListener('touchstart', function(event) {
            touchstartX = event.changedTouches[0].screenX;
            touchstartY = event.changedTouches[0].screenY;
        }, false);

        document.addEventListener('touchend', function(event) {
            if (event.target.closest('.table-wrapper') || event.target.closest('.search-box-container') || event.target.closest('.page-memo-textarea')) {
                return;
            }
            touchendX = event.changedTouches[0].screenX;
            touchendY = event.changedTouches[0].screenY;
            handleSwipe();
        }, false);

        function handleSwipe() {
            var xDiff = touchstartX - touchendX;
            var yDiff = touchstartY - touchendY;

            if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 50) {
                if (currentSubPage > 0) {
                    if (xDiff > 0) nextSubPage();
                    else prevSubPage();
                }
            }
        }

        function setupMiniEnterKeys() {
            document.querySelectorAll('.mini-text-input').forEach(function(inp) {
                inp.addEventListener('keyup', function(e) {
                    if (e.key === 'Enter') { var btn = inp.nextElementSibling; if (btn) btn.click(); }
                });
            });
        }

        // ==========================================
        // 📕 나만의 자동 오답노트 관리 함수
        // ==========================================
        function renderWrongNotes() {
            var container = document.getElementById("wrong-notes-list");
            var countBadge = document.getElementById("wrong-count-badge");
            var keys = Object.keys(wrongNotes);
            
            if (countBadge) {
                countBadge.innerText = keys.length + "개";
            }

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

        // ============================================================
        // 🚪 뒤로가기 버튼으로 앱 종료할 때 확인 팝업 띄우기
        // ============================================================
        var exitTrapArmed = false;

        function armExitTrap() {
            history.pushState({ exitTrap: true }, '');
            exitTrapArmed = true;
        }

        window.addEventListener('popstate', function() {
            if (exitTrapArmed) {
                exitTrapArmed = false;
                var overlay = document.getElementById('exit-confirm-overlay');
                if (overlay) overlay.style.display = 'flex';
            }
        });

        function cancelExitApp() {
            var overlay = document.getElementById('exit-confirm-overlay');
            if (overlay) overlay.style.display = 'none';
            armExitTrap(); // 다시 뒤로가기 함정을 걸어서 계속 공부하게 함
        }

        function confirmExitApp() {
            var overlay = document.getElementById('exit-confirm-overlay');
            if (overlay) overlay.style.display = 'none';
            // 앱 종료 시도 (환경에 따라 바로 안 닫힐 수 있음 - 그럴 땐 뒤로가기 한 번 더 누르면 종료됨)
            window.close();
        }

        document.addEventListener('DOMContentLoaded', function() {
            armExitTrap();
        });
