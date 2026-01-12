/**
 * 하루잇(HARUIT) - 메인 애플리케이션 로직
 */

// ============================================
// 앱 상태 관리
// ============================================
const AppState = {
    currentScreen: 'role-select',
    currentUser: null,
    isAdmin: false,

    // 카메라 스트림
    cameraStream: null,

    // AI 모델
    objectDetectionModel: null,
    isModelLoading: false,

    // 미션 진행 상태
    selectedMobility: null,
    detectedEnvironments: [],
    currentMission: null,
    missionAttempts: 0,

    // 스몰토크 상태
    smallTalkQuestion: null,
    smallTalkAttempts: 0,
    smallTalkResponse: null,
    missionCompleted: false,
    smallTalkCompleted: false,

    // 타이머
    missionStartTime: null,

    // [동작 모니터링 상태]
    isMonitoring: false,
    isManualMission: false, // [NEW] 수동 미션 여부
    movementCount: 0,
    targetMovement: 5,
    lastObjectPos: null,
    monitoringStartTime: null,

    reset() {
        this.selectedMobility = null;
        this.detectedEnvironments = [];
        this.currentMission = null;
        this.missionAttempts = 0;
        this.smallTalkQuestion = null;
        this.smallTalkAttempts = 0;
        this.smallTalkResponse = null;
        this.missionCompleted = false;
        this.smallTalkCompleted = false;
        this.missionStartTime = null;
        this.stopCamera();
    },

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }
};

// ============================================
// 화면 전환
// ============================================
function showScreen(screenId) {
    // 모든 화면 숨기기
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // 대상 화면 표시
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        AppState.currentScreen = screenId;

        // 화면별 초기화
        initScreen(screenId);
    }
}

function initScreen(screenId) {
    switch (screenId) {
        case 'home':
            updateHomeStats();
            break;
        case 'records':
            renderCalendar();
            renderRecentActivities();
            break;
        case 'admin-dashboard':
            renderAdminDashboard();
            break;
        case 'environment-scan':
            startCamera(); // 화면 진입 시 카메라 시작
            speak("카메라를 활용해 주변을 천천히 비춰보세요. 운동할 대상을 찾아드릴게요.");
            break;
        case 'mission-suggest':
            speak(AppState.currentMission?.mission || "미션을 시작해볼까요?");
            break;
        case 'ar-simulation':
            startARCamera(); // AR 배경용 카메라 시작
            updateARGuidance(); // 가이드 비주얼 설정
            speak("준비되셨다면 시작해볼까요? 동작을 인식하고 있습니다.");
            break;
    }
}

// ============================================
// 역할 선택 화면
// ============================================
function selectRole(role) {
    if (role === 'user') {
        // 현재 사용자 확인
        const currentUser = DataManager.getCurrentUser();
        if (currentUser) {
            AppState.currentUser = currentUser;
            showScreen('home');
        } else {
            showScreen('user-setup');
        }
    } else if (role === 'admin') {
        showScreen('admin-login');
    }
}

// ============================================
// 사용자 설정 화면
// ============================================
function setupUser() {
    const nameInput = document.getElementById('user-name-input');
    const name = nameInput.value.trim();

    if (name.length < 1) {
        showToast('이름을 입력해주세요');
        return;
    }

    // 새 사용자 생성
    const user = DataManager.createUser(name);
    AppState.currentUser = user;
    showScreen('home');
}

// ============================================
// 홈 화면
// ============================================
function updateHomeStats() {
    const user = AppState.currentUser;
    if (!user) return;

    const stats = Statistics.getUserStats(user);

    // 연속 사용 날
    const consecutiveEl = document.getElementById('consecutive-days');
    if (consecutiveEl) {
        consecutiveEl.textContent = stats.consecutiveDays;
    }

    // 이번 주 참여
    const weeklyEl = document.getElementById('weekly-participation');
    if (weeklyEl) {
        const weeklyCount = stats.weeklyParticipation.reduce((a, b) => a + b, 0);
        weeklyEl.textContent = weeklyCount;
    }

    // 사용자 이름
    const nameEl = document.getElementById('home-user-name');
    if (nameEl) {
        nameEl.textContent = user.name;
    }
}

function startMission() {
    AppState.reset();
    AppState.missionStartTime = new Date();
    showScreen('mobility-select');
}

function takeRestDay() {
    const user = AppState.currentUser;
    if (user) {
        DataManager.addRestDay(user.userId);
        showToast('쉬는 날로 기록되었습니다');
        updateHomeStats();
    }
}

// ============================================
// 거동 상태 선택
// ============================================
function selectMobility(mobility) {
    AppState.selectedMobility = mobility;

    // 라디오 카드 UI 업데이트
    document.querySelectorAll('.radio-card').forEach(card => {
        card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`[data-mobility="${mobility}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
}

function confirmMobility() {
    if (!AppState.selectedMobility) {
        showToast('거동 상태를 선택해주세요');
        return;
    }
    AppState.isManualMission = false; // [NEW] 일반 스캔 모드
    showScreen('environment-scan');
}

// [NEW] 수동 미션 선택 (비카메라 모드)
function startManualMissionSelecting() {
    if (!AppState.selectedMobility) {
        showToast("먼저 거동 상태를 선택해주세요");
        return;
    }
    showScreen('manual-mission-list');
    renderManualEnvList();
}

function renderManualEnvList() {
    const container = document.getElementById('manual-env-list');
    if (!container) return;

    container.innerHTML = ENVIRONMENTS.map(env => `
        <div class="card flex items-center p-md" style="cursor: pointer; margin-bottom: var(--spacing-md);" onclick="selectManualMission('${env.id}')">
            <div style="font-size: 32px; margin-right: 16px;">${env.icon}</div>
            <div class="flex-1">
                <div style="font-weight: 600; font-size: 18px;">${env.name}</div>
                <div class="text-muted" style="font-size: 14px;">주변의 ${env.name}과 관련된 활동</div>
            </div>
            <div style="font-size: 20px;">➡️</div>
        </div>
    `).join('');
}

function selectManualMission(envId) {
    const env = ENVIRONMENTS.find(e => e.id === envId);
    if (!env) return;

    AppState.isManualMission = true;
    generateMission(env);
    showScreen('mission-suggest');
}

// ============================================
// 환경 스캔 (카메라 연동)
// ============================================
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        AppState.cameraStream = stream;

        const videoElement = document.getElementById('camera-feed');
        if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.play();
        }

        // UI 초기화
        startRealTimeDetection();

    } catch (err) {
        console.error("카메라 접근 오류:", err);
        document.getElementById('scan-message').textContent = '카메라를 켤 수 없어요 (설정에서 권한을 확인해주세요)';
        showToast('카메라 권한이 필요합니다');
    }
}

function stopCamera() {
    if (AppState.cameraStream) {
        AppState.cameraStream.getTracks().forEach(track => track.stop());
        AppState.cameraStream = null;
    }
}

// UI 상태 초기화 (촬영 준비)
function resetCameraUI() {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('capture-canvas');
    const resultContainer = document.getElementById('scan-result-container');
    const captureBtn = document.getElementById('capture-btn');
    const retakeBtn = document.getElementById('retake-btn');
    const scanMessage = document.getElementById('scan-message');
    const scanLine = document.querySelector('.scan-line');
    const overlayText = document.querySelector('.scan-overlay-text');

    if (video) video.style.display = 'block';
    if (canvas) canvas.style.display = 'none';
    if (resultContainer) resultContainer.style.display = 'none';

    if (captureBtn) captureBtn.style.display = 'block';
    if (retakeBtn) retakeBtn.style.display = 'none';

    if (scanLine) scanLine.style.display = 'none';
    if (overlayText) overlayText.style.opacity = 0;

    if (scanMessage) scanMessage.textContent = '카메라로 주변을 비춰주세요';
}

// 재촬영
function resetCamera() {
    startRealTimeDetection();
    // 비디오 재생 재개
    const video = document.getElementById('camera-feed');
    if (video) video.play();
}


// 실시간 감지 루프
let detectionFrameId = null;
let lastPredictions = [];

function startRealTimeDetection() {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('capture-canvas');
    const overlayText = document.querySelector('.scan-overlay-text');
    const scanLine = document.querySelector('.scan-line');

    if (!video || !canvas) return;

    // UI 초기화
    canvas.style.display = 'block'; // 오버레이 표시
    if (overlayText) overlayText.style.opacity = 0; // "분석 중" 텍스트 숨김
    if (scanLine) scanLine.style.display = 'block'; // 스캔 라인 효과 유지 (선택사항)

    // 캔버스 크기 맞춤
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;

    AppState.isScanning = true;

    // 터치 이벤트 리스너 (한 번만 등록)
    canvas.style.cursor = 'pointer';
    canvas.removeEventListener('click', canvas._clickHandler); // 기존 제거
    canvas._clickHandler = (e) => handleCanvasClick(e, canvas);
    canvas.addEventListener('click', canvas._clickHandler);

    // 감지 및 그리기 루프 시작
    loop();
}

function stopRealTimeDetection() {
    AppState.isScanning = false;
    if (detectionFrameId) {
        cancelAnimationFrame(detectionFrameId);
        detectionFrameId = null;
    }
}

async function loop() {
    if (!AppState.isScanning) return;

    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('capture-canvas');
    const overlayText = document.querySelector('.scan-overlay-text');

    // 비디오 크기와 캔버스 크기 동기화 (중요)
    if (video.videoWidth > 0 && canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
    }

    if (video.readyState === 4) { // HAVE_ENOUGH_DATA
        // 1. 감지 (비동기지만 매 프레임 시도)
        try {
            // 모델 로딩 상태 표시
            if (AppState.isModelLoading || !AppState.objectDetectionModel) {
                if (overlayText) {
                    overlayText.style.opacity = 1;
                    overlayText.textContent = "AI 모델을 불러오고 있어요...";
                }
            } else {
                if (overlayText) overlayText.style.opacity = 0; // 준비 완료되면 숨김

                const predictions = await detectObjects(video);
                lastPredictions = predictions;
                drawAROverlay(canvas, lastPredictions);
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (AppState.isScanning) {
        detectionFrameId = requestAnimationFrame(loop);
    }
}


function drawAROverlay(canvas, predictions) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 이전 프레임 지우기

    // 매핑 정의
    const map = {
        'chair': 'chair', 'couch': 'chair', 'bench': 'chair', 'sofa': 'chair',
        'cup': 'cup', 'bottle': 'cup', 'glass': 'cup', 'wine glass': 'cup', 'bowl': 'cup',
        'dining table': 'table', 'desk': 'table',
        'bed': 'bed'
    };

    if (predictions && predictions.length > 0) {
        ctx.lineWidth = 4;
        ctx.font = 'bold 20px Pretendard';

        predictions.forEach(p => {
            const [x, y, width, height] = p.bbox;
            const isMapped = map[p.class];

            // 색상 정의 (RGBA 사용으로 투명도 부여)
            // Mapped(Green): #00FF00 -> rgba(0, 255, 0, 0.3)
            // Unmapped(Orange): #FF9500 -> rgba(255, 149, 0, 0.3)
            const boxColor = isMapped ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 149, 0, 0.2)';
            const strokeColor = isMapped ? '#00FF00' : '#FF9500';

            // 박스 배경색 (투명도 있음)
            ctx.fillStyle = boxColor;
            ctx.fillRect(x, y, width, height);

            // 박스 테두리 (불투명)
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, width, height);

            // 라벨 배경
            ctx.fillStyle = strokeColor;
            const textWidth = ctx.measureText(p.class).width;
            ctx.fillRect(x, y, textWidth + 20, 30);

            // 라벨 텍스트
            ctx.fillStyle = '#000000';
            ctx.fillText(p.class, x + 5, y + 22);

            // 터치 유도 아이콘 (옵션)
            if (isMapped) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '30px serif'; // ctx. 추가 (버그 수정)
                ctx.fillText('👆', x + width / 2 - 15, y + height / 2 + 10);
                // Font 복구
                ctx.font = 'bold 20px Pretendard';
            }
        });
    }
}

function handleCanvasClick(event, canvas) {
    console.log("Canvas clicked!", event.clientX, event.clientY);
    showToast("터치 감지됨"); // 터치 자체가 먹는지 확인용 (임시)

    if (!lastPredictions || lastPredictions.length === 0) {
        console.log("No predictions available yet.");
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const video = document.getElementById('camera-feed');
    if (!video) return;

    // [트래킹 개선] object-fit: contain 대응 좌표 계산
    const videoRatio = video.videoWidth / video.videoHeight;
    const elementRatio = rect.width / rect.height;

    let renderW, renderH, offsetX, offsetY;

    if (elementRatio > videoRatio) {
        renderH = rect.height;
        renderW = renderH * videoRatio;
        offsetX = (rect.width - renderW) / 2;
        offsetY = 0;
    } else {
        renderW = rect.width;
        renderH = renderW / videoRatio;
        offsetX = 0;
        offsetY = (rect.height - renderH) / 2;
    }

    const relativeX = event.clientX - rect.left - offsetX;
    const relativeY = event.clientY - rect.top - offsetY;

    const scaleX = video.videoWidth / renderW;
    const scaleY = video.videoHeight / renderH;

    const clickX = relativeX * scaleX;
    const clickY = relativeY * scaleY;

    console.log(`Debug Click - Relative: (${relativeX}, ${relativeY}), Internal: (${clickX}, ${clickY})`);

    // 시각적 피드백 (디버깅용 점 그리기)
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(clickX, clickY, 10, 0, Math.PI * 2);
    ctx.fill();

    const map = {
        'chair': 'chair', 'couch': 'chair', 'bench': 'chair', 'sofa': 'chair',
        'cup': 'cup', 'bottle': 'cup', 'glass': 'cup', 'wine glass': 'cup', 'bowl': 'cup',
        'dining table': 'table', 'desk': 'table',
        'bed': 'bed'
    };

    let selected = null;
    for (let i = lastPredictions.length - 1; i >= 0; i--) {
        const p = lastPredictions[i];
        const [x, y, width, height] = p.bbox;

        console.log(`Checking box: ${p.class} at [${x}, ${y}, ${width}, ${height}]`);

        if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
            selected = p;
            console.log("Match found!", p.class);
            break;
        }
    }

    if (selected) {
        const mappedId = map[selected.class];
        if (mappedId) {
            showToast(`✨ ${selected.class} 인식 성공!`);
            selectEnvironment(mappedId);
        } else {
            showToast(`[${selected.class}] 대신 의자나 컵을 눌러보세요!`);
        }
    } else {
        console.log("No box matched the click coordinates.");
    }
}
// 결과 표시 로직
function showScanResults(detectedIds, customMessage) {
    const scanLine = document.querySelector('.scan-line');
    const overlayText = document.querySelector('.scan-overlay-text');
    const resultContainer = document.getElementById('scan-result-container');
    const scanResult = document.getElementById('scan-result');
    const scanMessage = document.getElementById('scan-message');
    const retakeBtn = document.getElementById('retake-btn');

    // 분석 UI 숨기기
    if (scanLine) scanLine.style.display = 'none';
    if (overlayText) overlayText.style.opacity = 0;

    let displayEnvs = [];

    // 감지 결과 매핑
    if (detectedIds && detectedIds.length > 0) {
        const detectedEnvs = ENVIRONMENTS.filter(e => detectedIds.includes(e.id));
        displayEnvs = [...detectedEnvs];

        // 대화형 메시지 생성
        if (customMessage) {
            scanMessage.textContent = customMessage;
        } else {
            const mainItem = displayEnvs[0].name;
            const messages = [
                `오! 여기에 ${mainItem}이(가) 있군요!`,
                `${mainItem}을(를) 발견했어요! 이걸로 운동해볼까요?`,
                `${mainItem}이(가) 보이네요. 아주 좋아요!`
            ];
            scanMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
        }

    } else {
        if (customMessage) {
            scanMessage.textContent = customMessage;
        } else {
            scanMessage.textContent = '특별한 물건은 안 보이지만, 이 공간도 괜찮아요!';
        }
    }

    // 나머지 채우기 (감지된 게 없을 때만)
    if (detectedIds.length === 0) {
        const currentIds = displayEnvs.map(e => e.id);
        const remaining = ENVIRONMENTS.filter(e => !currentIds.includes(e.id));
        const shuffled = remaining.sort(() => Math.random() - 0.5);

        while (displayEnvs.length < 4 && shuffled.length > 0) {
            displayEnvs.push(shuffled.pop());
        }
    }

    // 안전장치
    if (displayEnvs.length === 0) displayEnvs = ENVIRONMENTS.slice(0, 4);

    AppState.detectedEnvironments = displayEnvs;

    AppState.detectedEnvironments = displayEnvs;

    // 리스트 렌더링
    // 1개일 때는 중앙 정렬을 위해 Flex, 여러 개일 때는 Grid
    if (displayEnvs.length === 1) {
        scanResult.style.display = 'flex';
        scanResult.style.flexDirection = 'column';
    } else {
        scanResult.style.display = 'grid';
    }

    scanResult.innerHTML = displayEnvs.map(env => {
        const isDetected = detectedIds && detectedIds.includes(env.id);
        const badge = isDetected ? '<span style="position:absolute; top:-10px; right:-10px; background:#FFD700; color:black; font-size:12px; padding:4px 8px; border-radius:12px; font-weight:bold; box-shadow:0 2px 4px rgba(0,0,0,0.2);">추천</span>' : '';
        const borderStyle = isDetected ? 'border: 2px solid #FFD700; background: rgba(255, 215, 0, 0.2);' : '';

        return `
        <div class="scan-item" style="position:relative; ${borderStyle}" onclick="selectEnvironment('${env.id}')">
            ${badge}
            <span class="scan-item-icon">${env.icon}</span>
            <span class="scan-item-name">${env.name}</span>
        </div>`;
    }).join('');

    // 결과창 및 재촬영 버튼 표시
    if (resultContainer) resultContainer.style.display = 'flex';
    if (retakeBtn) retakeBtn.style.display = 'block';
}

// TensorFLow.js 감지 로직
async function detectObjects(videoElement) {
    // 모델 로딩 중이면 최대 5초 대기
    if (AppState.isModelLoading) {
        console.log("Waiting for model to load...");
        let retries = 0;
        while (AppState.isModelLoading && retries < 10) {
            await new Promise(r => setTimeout(r, 500));
            retries++;
        }
    }

    if (!AppState.objectDetectionModel || !videoElement) {
        // 모델이 없으면 2초 딜레이 후 빈 배열 반환 (랜덤 폴백)
        return new Promise(resolve => setTimeout(() => resolve([]), 2000));
    }

    try {
        const predictions = await AppState.objectDetectionModel.detect(videoElement);
        console.log("Predictions:", predictions);

        // 30% 이상 정확도만 반환 (더 잘 찾도록 완화)
        return predictions.filter(p => p.score > 0.3);

    } catch (e) {
        console.error("Detection error:", e);
        return [];
    }
}

function selectEnvironment(envId) {
    const env = ENVIRONMENTS.find(e => e.id === envId);
    if (!env) return;

    // [심사위원 보완 사항 반영] 안전 체크 단계 추가
    stopRealTimeDetection(); // 선택되면 스캔 중지
    AppState.selectedEnvForSafety = env;
    showSafetyCheck(env);
}

function showSafetyCheck(env) {
    // 안전 체크용 토스트나 오버레이 UI를 통해 사용자에게 주의 환기
    // 여기서는 간단히 UI를 통해 안전 확인 모달을 띄우는 것으로 시뮬레이션
    const safetyOverlay = document.createElement('div');
    safetyOverlay.id = 'safety-check-modal';
    safetyOverlay.style = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); z-index: 10000;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 40px; text-align: center; color: white;
    `;

    let safetyContent = '';
    if (env.id === 'chair') {
        safetyContent = '⚠️ 의자가 벽에 붙어있거나 고정되어 있나요? <br> 미끄러운 바퀴 의자는 위험해요!';
    } else if (env.id === 'cup') {
        safetyContent = '⚠️ 컵에 물이 들어있다면 쏟아지지 않게 주의하세요! <br> 미끄럽지 않은 곳에 두었나요?';
    } else {
        safetyContent = '⚠️ 주변에 부딪힐 만한 물건은 없는지 확인해주세요!';
    }

    safetyOverlay.innerHTML = `
        <div style="background: #1a1a1a; padding: 30px; border-radius: 24px; border: 2px solid #FFD700; max-width: 320px;">
            <div style="font-size: 48px; margin-bottom: 20px;">🛡️</div>
            <h2 style="color: #FFD700; margin-bottom: 20px;">안전을 확인하세요!</h2>
            <p style="font-size: 18px; line-height: 1.6; margin-bottom: 30px;">${safetyContent}</p>
            <button class="btn btn-primary btn-full" onclick="confirmSafety()">예, 안전합니다!</button>
            <button class="btn btn-ghost btn-full mt-sm" onclick="cancelSafety()" style="color: rgba(255,255,255,0.6);">다시 비춰보기</button>
        </div>
    `;
    document.body.appendChild(safetyOverlay);
}

function confirmSafety() {
    const env = AppState.selectedEnvForSafety;
    const modal = document.getElementById('safety-check-modal');
    if (modal) modal.remove();

    // 미션 생성 및 화면 전환
    generateMission(env);
    stopCamera();
    showScreen('mission-suggest');
}

function cancelSafety() {
    const modal = document.getElementById('safety-check-modal');
    if (modal) modal.remove();
    startRealTimeDetection(); // 다시 스캔 시작
}

// ============================================
// AI 미션 생성
// ============================================
function generateMission(specificEnv = null) {
    const mobility = AppState.selectedMobility;

    // 특정 환경이 주어지면 그것 사용, 아니면 기존 랜덤 로직 (재시도용)
    let env;
    if (specificEnv) {
        env = specificEnv;
    } else {
        const environments = AppState.detectedEnvironments;
        if (environments.length === 0) return;
        env = environments[Math.floor(Math.random() * environments.length)];
    }

    const missionList = MISSIONS[env.id][mobility];
    if (!missionList || missionList.length === 0) return;

    // 랜덤 미션 선택
    const mission = missionList[Math.floor(Math.random() * missionList.length)];

    AppState.currentMission = {
        environment: env.id,
        environmentName: env.name,
        environmentIcon: env.icon,
        mission: mission
    };

    // UI 업데이트
    const missionTextEl = document.getElementById('mission-text');
    if (missionTextEl) {
        missionTextEl.textContent = mission;
    }

    const missionEnvEl = document.getElementById('mission-environment');
    if (missionEnvEl) {
        missionEnvEl.textContent = `${env.icon} ${env.name}`;
    }
}

function acceptMission() {
    if (AppState.isManualMission) {
        // [수동 미션] AR 시뮬레이션 대신 모니터링만 바로 시작
        showScreen('ar-simulation');
        startARAnimation();
    } else {
        showScreen('ar-simulation');
        startARAnimation();
    }
}

function requestNewMission() {
    AppState.missionAttempts++;

    if (AppState.missionAttempts >= 3) {
        showToast('더 이상 다른 미션을 받을 수 없어요');
        return;
    }

    generateMission();

    // 남은 횟수 표시
    const remainingEl = document.getElementById('mission-attempts-remaining');
    if (remainingEl) {
        remainingEl.textContent = `다른 미션 받기 (${3 - AppState.missionAttempts}회 남음)`;
    }
}

// ============================================
// AR 시뮬레이션
// ============================================
function startARCamera() {
    startCameraAPI('ar-camera-bg');
}

async function startCameraAPI(elementId) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        AppState.cameraStream = stream;

        const videoElement = document.getElementById(elementId);
        if (videoElement) {
            videoElement.srcObject = stream;
        }
    } catch (err) {
        console.error("AR 카메라 접근 오류:", err);
    }
}

function startARAnimation() {
    const arMissionEl = document.getElementById('ar-mission-text');
    const arArrowEl = document.getElementById('ar-arrow');
    const arObjectIconEl = document.getElementById('ar-object-icon');

    if (arMissionEl && AppState.currentMission) {
        arMissionEl.textContent = AppState.currentMission.mission;

        // [사용자 피드백 반영] 인식된 사물에 따른 화살표 및 아이콘 변경
        const envId = AppState.currentMission.environment;
        const envIcon = AppState.currentMission.environmentIcon;

        if (arObjectIconEl) {
            arObjectIconEl.textContent = envIcon; // 🪑, 🥛 등
        }

        if (arArrowEl) {
            // 사물에 맞는 동작 화살표 설정
            if (envId === 'chair') {
                arArrowEl.textContent = '↓'; // 의자는 앉는 동작 위주
            } else if (envId === 'cup') {
                arArrowEl.textContent = '↑'; // 컵은 들어올리는 동작 위주
            } else if (envId === 'bed') {
                arArrowEl.textContent = '↔️'; // 침대는 눕거나 짚는 동작
            } else {
                arArrowEl.textContent = '⭕'; // 일반적인 타겟 지점
            }
        }
    }

    // 파티클 효과 시작
    createParticles();

    // [핵심] 실시간 동작 모니터링 시작
    startMonitoringMovement();
}

// 동작 모니터링 시작
async function startMonitoringMovement() {
    if (AppState.isMonitoring) return;

    // 비디오 다시 연결 (AR 배경용)
    const video = document.getElementById('ar-camera-bg');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        if (video) video.srcObject = stream;

        AppState.isMonitoring = true;
        AppState.movementCount = 0;
        AppState.targetMovement = 5; // [버그 수정] 기본값 보장
        AppState.lastObjectPos = null;
        AppState.monitoringStartTime = new Date();

        // UI 초기화
        const progressContainer = document.getElementById('monitoring-progress-container');
        if (progressContainer) progressContainer.style.display = 'block';

        updateARGuidance(); // 가이드 비주얼 설정
        updateMonitoringUI();

        monitoringLoop();
    } catch (e) {
        console.error("Monitoring camera error:", e);
    }
}

async function monitoringLoop() {
    if (!AppState.isMonitoring) return;

    const video = document.getElementById('ar-camera-bg');
    const canvas = document.getElementById('ar-tracking-canvas');

    if (!video || !canvas || !AppState.objectDetectionModel) return;

    // [트래킹 개선] 캔버스 크기를 비디오의 실제 렌더링 크기에 맞춤
    if (video.videoWidth > 0) {
        // 비디오 해상도와 캔버스 해상도 완전 일치
        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (video.readyState === 4) {
        try {
            const predictions = await AppState.objectDetectionModel.detect(video);
            const targetClass = AppState.currentMission.environment; // 'chair', 'cup' 등

            // 타겟 사물만 필터링
            const target = predictions.find(p => p.class === targetClass && p.score > 0.3);

            if (target) {
                const [x, y, w, h] = target.bbox;

                // 트래킹 박스 그리기
                ctx.strokeStyle = '#00FF00';
                ctx.setLineDash([10, 5]);
                ctx.lineWidth = 4;
                ctx.strokeRect(x, y, w, h);
                ctx.setLineDash([]);

                // 반투명 배경
                ctx.fillStyle = 'rgba(0, 255, 0, 0.15)';
                ctx.fillRect(x, y, w, h);

                const currentPos = { x: x + w / 2, y: y + h / 2 };

                if (AppState.lastObjectPos) {
                    const dist = Math.sqrt(
                        Math.pow(currentPos.x - AppState.lastObjectPos.x, 2) +
                        Math.pow(currentPos.y - AppState.lastObjectPos.y, 2)
                    );

                    // 민감도 15px 유지
                    if (dist > 15) {
                        AppState.movementCount++;
                        showSuccessEffect();
                        updateMonitoringUI();
                        triggerInteractiveReaction();

                        if (AppState.movementCount === Math.floor(AppState.targetMovement / 2)) {
                            showToast("거의 다 왔어요! 조금만 더!");
                        }

                        if (AppState.movementCount >= AppState.targetMovement) {
                            handleMonitoringSuccess();
                            return;
                        }
                    }
                }
                AppState.lastObjectPos = currentPos;
            }
        } catch (err) {
            console.error(err);
        }
    }

    monitoringFrameId = requestAnimationFrame(monitoringLoop);
}

function updateARGuidance() {
    const missionText = AppState.currentMission?.mission || "";
    const arrow = document.getElementById('ar-arrow');
    const icon = document.getElementById('ar-object-icon');
    const statusMsg = document.getElementById('ar-status-message');

    if (!arrow || !icon) return;

    // 미션 키워드에 따른 아이콘/화살표 변경
    if (missionText.includes("두드려") || missionText.includes("만져") || missionText.includes("느껴")) {
        arrow.textContent = "👆";
        icon.textContent = "🖐️";
        if (statusMsg) statusMsg.textContent = "물체를 가볍게 터치하거나 느껴보세요";
    } else if (missionText.includes("돌려") || missionText.includes("움직여") || missionText.includes("바꿔")) {
        arrow.textContent = "🔄";
        icon.textContent = "📦";
        if (statusMsg) statusMsg.textContent = "물체를 조금씩 움직여보세요";
    } else if (missionText.includes("닦아") || missionText.includes("정리")) {
        arrow.textContent = "↔️";
        icon.textContent = "✨";
        if (statusMsg) statusMsg.textContent = "사물을 깨끗하게 정리하거나 닦아볼까요?";
    } else if (missionText.includes("기지개") || missionText.includes("일어나")) {
        arrow.textContent = "↑";
        icon.textContent = "🙋";
        if (statusMsg) statusMsg.textContent = "몸을 쭉 펴서 동작을 완료해주세요";
    } else if (missionText.includes("바라봐") || missionText.includes("살펴")) {
        arrow.textContent = "👁️";
        icon.textContent = "🔍";
        if (statusMsg) statusMsg.textContent = "사물을 차분히 들여다보세요";
    } else {
        arrow.textContent = "↑";
        icon.textContent = "🎯";
    }
}

function triggerInteractiveReaction() {
    const arrow = document.getElementById('ar-arrow');
    const icon = document.getElementById('ar-object-icon');
    const container = document.querySelector('.ar-visual');

    // [인터랙티브 강화] 반응 애니메이션
    [arrow, icon].forEach(el => {
        if (el) {
            el.animate([
                { transform: 'scale(1)', opacity: 1 },
                { transform: 'scale(1.5)', opacity: 0.8 },
                { transform: 'scale(1)', opacity: 1 }
            ], {
                duration: 300,
                easing: 'ease-out'
            });
        }
    });

    // 화면 번쩍임 효과
    if (container) {
        container.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
        setTimeout(() => {
            container.style.backgroundColor = 'transparent';
        }, 300);
    }
}

function updateMonitoringUI() {
    const progressInner = document.getElementById('monitoring-progress-inner');
    const statusMsg = document.getElementById('ar-status-message');

    if (progressInner) {
        const percent = (AppState.movementCount / AppState.targetMovement) * 100;
        progressInner.style.width = `${percent}%`;
    }

    if (statusMsg) {
        if (AppState.movementCount === 0) {
            statusMsg.textContent = "사물을 움직여보세요! AI가 지켜보고 있어요 👀";
        } else {
            statusMsg.textContent = `잘하고 계세요! (${AppState.movementCount}/${AppState.targetMovement})`;
        }
    }
}

function showSuccessEffect() {
    const screen = document.getElementById('ar-simulation');
    if (screen) {
        screen.classList.add('success-flash');
        setTimeout(() => screen.classList.remove('success-flash'), 500);
    }
}

function handleMonitoringSuccess() {
    AppState.isMonitoring = false;
    if (monitoringFrameId) cancelAnimationFrame(monitoringFrameId);

    showToast("✨ 대단해요! 동작 완벽 인식!");

    // 약간의 딜레이 후 결과 화면으로
    setTimeout(() => {
        completeMission(true);
    }, 1500);
}

function stopMonitoring() {
    AppState.isMonitoring = false;
    if (monitoringFrameId) {
        cancelAnimationFrame(monitoringFrameId);
        monitoringFrameId = null;
    }
    const video = document.getElementById('ar-camera-bg');
    if (video && video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(t => t.stop());
    }
}

function createParticles() {
    const container = document.querySelector('.ar-particles');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 3}s`;
        container.appendChild(particle);
    }
}

function showSmallTalkOption() {
    showScreen('smalltalk-check');
}

function hasSomeoneNearby(hasCompany) {
    AppState.stopCamera(); // 카메라 중지

    if (hasCompany) {
        generateSmallTalkQuestion();
        showScreen('smalltalk-question');
    } else {
        // 혼자인 경우 바로 보상 화면으로
        skipSmallTalk();
    }
}

function completeMission(completed) {
    AppState.missionCompleted = completed;

    // [사용자 피드백 반영] 모니터링 중지 및 명확한 리소스 정리
    stopMonitoring();

    if (completed) {
        // 미션 완료 시 스몰토크 여부 질문 화면으로
        showScreen('smalltalk-check');
    } else {
        // 미완료 시 바로 보상 화면 (격려)
        AppState.stopCamera();
        showRewardScreen();
    }
}

// ============================================
// 스몰토크
// ============================================
function generateSmallTalkQuestion() {
    const usedQuestions = [];
    let question;

    do {
        const idx = Math.floor(Math.random() * SMALL_TALK_QUESTIONS.length);
        question = SMALL_TALK_QUESTIONS[idx];
    } while (usedQuestions.includes(question) && usedQuestions.length < SMALL_TALK_QUESTIONS.length);

    usedQuestions.push(question);
    AppState.smallTalkQuestion = question;

    // UI 업데이트
    const questionEl = document.getElementById('smalltalk-question-text');
    if (questionEl) {
        questionEl.textContent = question;
    }
}

function acceptSmallTalkQuestion() {
    showScreen('smalltalk-response');

    // 질문 다시 표시
    const questionEl = document.getElementById('smalltalk-response-question');
    if (questionEl) {
        questionEl.textContent = AppState.smallTalkQuestion;
    }
}

function requestNewSmallTalkQuestion() {
    AppState.smallTalkAttempts++;

    if (AppState.smallTalkAttempts >= 3) {
        showToast('더 이상 다른 질문을 받을 수 없어요');
        return;
    }

    generateSmallTalkQuestion();

    // 남은 횟수 표시
    const remainingEl = document.getElementById('smalltalk-attempts-remaining');
    if (remainingEl) {
        remainingEl.textContent = `다른 질문 원해요 (${3 - AppState.smallTalkAttempts}회 남음)`;
    }
}

function skipSmallTalk() {
    AppState.smallTalkCompleted = false;
    showRewardScreen();
}

function completeSmallTalk() {
    const responseInput = document.getElementById('smalltalk-response-input');
    AppState.smallTalkResponse = responseInput?.value.trim() || null;
    AppState.smallTalkCompleted = true;
    showRewardScreen();
}

function cancelSmallTalk() {
    AppState.smallTalkCompleted = false;
    showScreen('ar-simulation');
}

// ============================================
// 보상 화면
// ============================================
function showRewardScreen() {
    showScreen('reward');

    const iconEl = document.getElementById('reward-icon');
    const messageEl = document.getElementById('reward-message');
    const submessageEl = document.getElementById('reward-submessage');

    if (AppState.missionCompleted) {
        if (AppState.smallTalkCompleted) {
            iconEl.textContent = '💝';
            messageEl.textContent = '누군가와 따뜻한 대화를 나눴네요';
            submessageEl.textContent = '오늘의 한 걸음이 남았습니다 ✨';
        } else {
            iconEl.textContent = '🌟';
            messageEl.textContent = '오늘의 한 걸음이 남았습니다';
            submessageEl.textContent = '작은 움직임이 큰 변화를 만들어요 ✨';
        }
    } else {
        iconEl.textContent = '💫';
        messageEl.textContent = '오늘도 여기까지면 충분해요';
        submessageEl.textContent = '언제든 다시 시도할 수 있어요';
    }

    // [사용자 피드백 반영] 답변 표시 로직 추가
    const responseContainer = document.getElementById('reward-response-container');
    const responseText = document.getElementById('reward-response-text');

    if (AppState.smallTalkCompleted && AppState.smallTalkResponse) {
        if (responseContainer && responseText) {
            responseContainer.style.display = 'block';
            responseText.textContent = AppState.smallTalkResponse;
        }
    } else {
        if (responseContainer) responseContainer.style.display = 'none';
    }

    // 활동 기록 저장
    saveActivity();

    // 3초 후 홈으로 자동 이동
    setTimeout(() => {
        if (AppState.currentScreen === 'reward') {
            goHome();
        }
    }, 5000);
}

function saveActivity() {
    const user = AppState.currentUser;
    if (!user) return;

    const now = new Date();
    const duration = AppState.missionStartTime
        ? Math.floor((now - AppState.missionStartTime) / 1000)
        : 0;

    const activity = {
        date: getDateString(now),
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
        mobility: AppState.selectedMobility,
        environment: AppState.currentMission?.environment,
        mission: AppState.currentMission?.mission || '',
        completed: AppState.missionCompleted,
        duration: duration,
        smallTalkIncluded: !!AppState.smallTalkQuestion,
        smallTalkQuestion: AppState.smallTalkQuestion,
        smallTalkCompleted: AppState.smallTalkCompleted,
        smallTalkResponse: AppState.smallTalkResponse
    };

    DataManager.addActivity(user.userId, activity);

    // 사용자 데이터 갱신
    AppState.currentUser = DataManager.getUser(user.userId);
}

function goHome() {
    AppState.reset();
    showScreen('home');
}

// ============================================
// 기록 화면
// ============================================
let calendarDate = new Date();

function renderCalendar() {
    const user = AppState.currentUser;
    if (!user) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    // 제목 업데이트
    const titleEl = document.getElementById('calendar-title');
    if (titleEl) {
        titleEl.textContent = `${year}년 ${month + 1}월`;
    }

    // 달력 날짜 생성
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const today = new Date();
    const todayStr = getDateString(today);

    // 활동 날짜 맵
    const activityDates = {};
    user.activities.forEach(act => {
        activityDates[act.date] = act.isRestDay ? 'rest' : 'participated';
    });

    // HTML 생성
    let html = '';

    // 빈 칸
    for (let i = 0; i < startDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // 날짜
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let classes = 'calendar-day';

        if (dateStr === todayStr) classes += ' today';
        if (activityDates[dateStr] === 'participated') classes += ' participated';
        if (activityDates[dateStr] === 'rest') classes += ' rest';

        html += `<div class="${classes}">${day}</div>`;
    }

    const daysContainer = document.getElementById('calendar-days');
    if (daysContainer) {
        daysContainer.innerHTML = html;
    }

    // 월간 통계
    updateMonthlyStats(user, year, month);
}

function updateMonthlyStats(user, year, month) {
    const monthActivities = user.activities.filter(a => {
        const actDate = new Date(a.date);
        return actDate.getMonth() === month && actDate.getFullYear() === year && !a.isRestDay;
    });

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const participationRate = Math.round((monthActivities.length / daysInMonth) * 100);

    const rateEl = document.getElementById('monthly-rate');
    const countEl = document.getElementById('monthly-count');

    if (rateEl) rateEl.textContent = `${participationRate}%`;
    if (countEl) countEl.textContent = `${monthActivities.length}일`;
}

function prevMonth() {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
}

function renderRecentActivities() {
    const user = AppState.currentUser;
    if (!user) return;

    const container = document.getElementById('recent-activities');
    if (!container) return;

    const recentActivities = user.activities.slice(0, 10);

    if (recentActivities.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">아직 활동 기록이 없습니다</p>';
        return;
    }

    container.innerHTML = recentActivities.map(act => {
        const envInfo = ENVIRONMENTS.find(e => e.id === act.environment);
        const icon = envInfo?.icon || '📋';
        const statusIcon = act.completed ? '✅' : (act.isRestDay ? '😴' : '⏸️');

        // [사용자 피드백 반영] 답변이 있을 경우 표시
        const smallTalkBadge = act.smallTalkCompleted
            ? '<span class="badge badge-primary">대화 완료 ✓</span>'
            : '';

        const responseText = (act.smallTalkCompleted && act.smallTalkResponse)
            ? `<div class="mt-xs" style="font-size: 13px; color: var(--color-primary); background: rgba(74, 144, 226, 0.1); padding: 4px 8px; border-radius: 4px;">💬 ${act.smallTalkResponse}</div>`
            : '';

        return `
            <div class="card" style="padding: var(--spacing-md);">
                <div class="flex items-center gap-md">
                    <div style="font-size: 24px;">${icon}</div>
                    <div class="flex-1">
                        <div class="flex items-center gap-sm">
                            <span class="font-weight: 600;">${act.date || '-'}</span>
                            <span>${statusIcon}</span>
                            ${smallTalkBadge}
                        </div>
                        <div class="text-muted" style="font-size: var(--font-size-sm);">
                            ${act.isRestDay ? '쉬는 날' : (act.mission || '-')}
                        </div>
                        ${responseText}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// 관리자 기능
// ============================================
let selectedUserId = null;

function adminLogin() {
    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput.value;

    if (DataManager.verifyAdminPassword(password)) {
        AppState.isAdmin = true;
        showScreen('admin-dashboard');
    } else {
        showToast('비밀번호가 올바르지 않습니다');
        passwordInput.value = '';
    }
}

function renderAdminDashboard() {
    // 전체 통계
    const overallStats = Statistics.getOverallStats();

    document.getElementById('admin-total-users').textContent = overallStats.totalUsers;
    document.getElementById('admin-today-participants').textContent =
        `${overallStats.todayParticipants}명 (${overallStats.todayParticipationRate}%)`;
    document.getElementById('admin-weekly-rate').textContent = `${overallStats.weeklyAvgRate}%`;
    document.getElementById('admin-new-users').textContent = overallStats.newUsers;

    // 사용자 목록
    renderUserList();
}

function renderUserList(searchQuery = '') {
    const users = DataManager.getAllUsers();
    const container = document.getElementById('admin-user-list');

    const filteredUsers = searchQuery
        ? users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : users;

    if (filteredUsers.length === 0) {
        container.innerHTML = '<p class="text-muted text-center p-md">사용자가 없습니다</p>';
        return;
    }

    container.innerHTML = filteredUsers.map(user => {
        const stats = Statistics.getUserStats(user);
        const lastActivity = user.lastActivity
            ? new Date(user.lastActivity).toLocaleDateString('ko-KR')
            : '없음';

        return `
            <div class="user-card" onclick="viewUserDetail('${user.userId}')">
                <div class="user-avatar">${user.name[0]}</div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-meta">마지막 참여: ${lastActivity}</div>
                </div>
                <div class="user-stats">
                    <div class="user-rate">${stats.monthlyParticipationRate}%</div>
                    <div class="user-streak">${stats.consecutiveDays}일 연속</div>
                </div>
            </div>
        `;
    }).join('');
}

function searchUsers() {
    const query = document.getElementById('admin-search').value;
    renderUserList(query);
}

function viewUserDetail(userId) {
    selectedUserId = userId;
    showScreen('admin-user-detail');
}

function renderUserDetail() {
    const user = DataManager.getUser(selectedUserId);
    if (!user) return;

    const stats = Statistics.getUserStats(user);

    // 기본 정보
    document.getElementById('detail-user-name').textContent = user.name;
    document.getElementById('detail-user-joindate').textContent =
        `가입일: ${user.joinDate}`;

    // 통계
    document.getElementById('detail-total-days').textContent = stats.totalParticipation;
    document.getElementById('detail-monthly-rate').textContent = `${stats.monthlyParticipationRate}%`;
    document.getElementById('detail-consecutive').textContent = stats.consecutiveDays;
    document.getElementById('detail-completion-rate').textContent = `${stats.completionRate}%`;

    // 스몰토크 통계
    document.getElementById('detail-smalltalk-count').textContent = stats.smallTalkCount;
    document.getElementById('detail-smalltalk-rate').textContent = `${stats.smallTalkRate}%`;
    document.getElementById('detail-frequent-question').textContent =
        stats.mostFrequentQuestion?.question || '없음';

    // 선호 미션 유형
    renderPreferredMissions(stats.preferredMissions);

    // 월별 차트
    renderMonthlyChart(user);

    // 최근 활동
    renderDetailActivities(user);
}

function renderPreferredMissions(preferredMissions) {
    const container = document.getElementById('preferred-missions');
    if (!container) return;

    const sorted = Object.entries(preferredMissions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-muted">데이터 없음</p>';
        return;
    }

    container.innerHTML = sorted.map(([envId, count]) => {
        const env = ENVIRONMENTS.find(e => e.id === envId);
        return `
            <div class="flex items-center justify-between mb-sm">
                <span>${env?.icon || '📋'} ${env?.name || envId}</span>
                <span class="text-primary font-weight: 600;">${count}회</span>
            </div>
        `;
    }).join('');
}

function renderMonthlyChart(user) {
    const container = document.getElementById('monthly-chart');
    if (!container) return;

    const monthlyData = Statistics.getMonthlyData(user, 6);
    const maxRate = Math.max(...monthlyData.map(d => d.rate), 1);

    container.innerHTML = monthlyData.map(data => `
        <div class="bar-item">
            <div class="bar" style="height: ${(data.rate / maxRate) * 100}px;"></div>
            <div class="bar-label">${data.label}</div>
        </div>
    `).join('');
}

function renderDetailActivities(user) {
    const container = document.getElementById('detail-activities');
    if (!container) return;

    const activities = user.activities.slice(0, 20);

    if (activities.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">활동 기록이 없습니다</p>';
        return;
    }

    container.innerHTML = `
        <div class="table-container">
            <table class="table">
                <thead>
                    <tr>
                        <th>날짜</th>
                        <th>환경</th>
                        <th>완료</th>
                        <th>스몰토크</th>
                        <th>답변</th>
                    </tr>
                </thead>
                <tbody>
                    ${activities.map(act => {
        const env = ENVIRONMENTS.find(e => e.id === act.environment);
        // [사용자 피드백 반영] 답변 있을 경우 표시
        const response = (act.smallTalkCompleted && act.smallTalkResponse) ? act.smallTalkResponse : '-';
        return `
                            <tr>
                                <td>${act.date || '-'}</td>
                                <td>${env?.icon || '-'} ${env?.name || '-'}</td>
                                <td>${act.completed ? '✅' : '⏸️'}</td>
                                <td>${act.smallTalkCompleted ? '✅' : '-'}</td>
                                <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${response}">${response}</td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function exportUserData() {
    const csv = DataManager.exportToCSV(selectedUserId);
    downloadCSV(csv, `haruit_${selectedUserId}_data.csv`);
}

function exportAllData() {
    const csv = DataManager.exportToCSV();
    downloadCSV(csv, 'haruit_all_data.csv');
}

function downloadCSV(csv, filename) {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast('데이터가 다운로드되었습니다');
}

function deleteUser() {
    if (confirm('정말 이 사용자를 삭제하시겠습니까?')) {
        DataManager.deleteUser(selectedUserId);
        showScreen('admin-dashboard');
        showToast('사용자가 삭제되었습니다');
    }
}

function adminLogout() {
    AppState.isAdmin = false;
    showScreen('role-select');
}

function backToAdminDashboard() {
    showScreen('admin-dashboard');
}

// ============================================
// 유틸리티
// ============================================
function showToast(message) {
    // 기존 토스트 제거
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// CSS 애니메이션 추가
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// ============================================
// 데이터 관리자 초기화 및 앱 시작
// ============================================
// ============================================
// 데이터 관리자 초기화 및 앱 시작
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // 데이터 초기화
    DataManager.init();

    // URL 해시 라우팅 지원
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.substring(1);
        if (hash) showScreen(hash);
    });

    // 시작 화면 표시
    showScreen('role-select');

    // 키보드 접근성
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const currentScreen = AppState.currentScreen;
            if (currentScreen !== 'role-select' && currentScreen !== 'home') {
                goHome();
            }
        }
    });

    // TensorFlow 모델 로드 시작 (백그라운드)
    loadRunningModel();
});

async function loadRunningModel() {
    if (AppState.isModelLoading || AppState.objectDetectionModel) return;

    try {
        AppState.isModelLoading = true;
        console.log("Loading TensorFlow model...");
        // showToast("AI 모델을 준비하고 있어요..."); // 너무 일찍 뜨면 귀찮을 수 있음

        AppState.objectDetectionModel = await cocoSsd.load();
        console.log("Model loaded successfully");
        showToast("✨ AI 분석 준비 완료!"); // 사용자에게 모델 로드 완료 알림

    } catch (err) {
        console.error("Failed to load model:", err);
        showToast("AI 모델 로드 실패 (기본 모드로 동작합니다)");
    } finally {
        AppState.isModelLoading = false;
    }
}

// ============================================
// [NEW] 접근성 및 긴급 기능
// ============================================

/**
 * 긴급 도움 요청 (SOS)
 */
function handleSOS() {
    if (confirm("🚨 긴급 상황인가요? 119로 전화를 연결하시겠습니까?")) {
        window.location.href = "tel:119";
    }
}

/**
 * 큰 글씨 모드 선택
 */
function toggleLargeText(enabled) {
    if (enabled) {
        document.body.classList.add('large-text');
    } else {
        document.body.classList.remove('large-text');
    }
    // 설정 저장 (선택 사항)
    localStorage.setItem('haruit_large_text', enabled);
}

/**
 * 음성 안내 (TTS)
 */
function speak(text) {
    if (!window.speechSynthesis) return;

    // 이전 음성 중단
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // 조금 천천히
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
}

// 초기 설정 복구
document.addEventListener('DOMContentLoaded', () => {
    const largeTextEnabled = localStorage.getItem('haruit_large_text') === 'true';
    if (largeTextEnabled) {
        toggleLargeText(true);
        const toggle = document.getElementById('toggle-large-text');
        if (toggle) toggle.checked = true;
    }
});

// ============================================
// [NEW] 관리자 주간 요약 리포트
// ============================================

function generateWeeklySummaryReport() {
    showScreen('admin-weekly-report');

    const users = DataManager.getAllUsers();
    if (users.length === 0) {
        document.getElementById('weekly-report-content').innerHTML = `
            <div class="text-center p-xl">
                <p class="text-muted">데이터가 충분하지 않습니다.</p>
            </div>
        `;
        return;
    }

    // 통계 계산
    const weeklyParticipants = users.filter(u => {
        const stats = Statistics.getUserStats(u);
        return stats.weeklyParticipation.some(p => p > 0);
    }).length;

    const participationRate = Math.round((weeklyParticipants / users.length) * 100);

    // 미션 및 스몰토크 데이터 취합
    let allMissions = [];
    let allSmallTalks = [];

    users.forEach(u => {
        const activities = DataManager.getActivityHistory(u.userId);
        activities.forEach(act => {
            const actDate = act.date ? new Date(act.date) : null;
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            if (actDate && actDate > oneWeekAgo) {
                if (act.mission) allMissions.push(act.environment);
                if (act.smallTalkResponse) allSmallTalks.push({
                    user: u.username,
                    response: act.smallTalkResponse
                });
            }
        });
    });

    // 최다 빈도 환경 추출
    const envCounts = allMissions.reduce((acc, env) => {
        acc[env] = (acc[env] || 0) + 1;
        return acc;
    }, {});

    const topEnvs = Object.entries(envCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id, count]) => {
            const env = ENVIRONMENTS.find(e => e.id === id);
            return `${env?.icon || '❓'} ${env?.name || '기타'} (${count}회)`;
        });

    // 리포트 렌더링
    const today = new Date().toLocaleDateString();
    const contentEl = document.getElementById('weekly-report-content');

    contentEl.innerHTML = `
        <div class="report-header text-center mb-xl" style="border-bottom: 2px solid #333; padding-bottom: 20px;">
            <div style="font-size: 14px; color: var(--color-primary); font-weight: 700;">HARUIT INSTITUTIONAL REPORT</div>
            <h1 style="font-size: 28px; margin: 10px 0;">주간 활동 및 정서 요약 리포트</h1>
            <div style="color: #666;">발행일: ${today} | 대상: ${users.length}명</div>
        </div>

        <div class="report-section mb-xl">
            <h2 style="font-size: 20px; border-left: 5px solid var(--color-primary); padding-left: 10px; margin-bottom: 15px;">📊 주간 참여 지표</h2>
            <div class="stats-grid" style="grid-template-columns: 1fr 1fr;">
                <div class="card bg-main p-md text-center">
                    <div style="font-size: 14px; color: #666;">전체 참여율</div>
                    <div style="font-size: 32px; font-weight: 800; color: var(--color-primary);">${participationRate}%</div>
                </div>
                <div class="card bg-main p-md text-center">
                    <div style="font-size: 14px; color: #666;">활동 사용자</div>
                    <div style="font-size: 32px; font-weight: 800; color: var(--color-secondary);">${weeklyParticipants}명</div>
                </div>
            </div>
        </div>

        <div class="report-section mb-xl">
            <h2 style="font-size: 20px; border-left: 5px solid var(--color-primary); padding-left: 10px; margin-bottom: 15px;">🎯 인기 미션 환경</h2>
            <div class="card p-md">
                ${topEnvs.length > 0 ? topEnvs.map(env => `<div class="mb-xs" style="font-size: 18px;">${env}</div>`).join('') : '<p class="text-muted">기록된 활동이 없습니다.</p>'}
            </div>
        </div>

        <div class="report-section">
            <h2 style="font-size: 20px; border-left: 5px solid var(--color-primary); padding-left: 10px; margin-bottom: 15px;">💬 스몰토크 하이라이트</h2>
            <div class="flex flex-col gap-sm">
                ${allSmallTalks.length > 0 ? allSmallTalks.slice(-5).map(st => `
                    <div class="p-sm" style="background: #f9f9f9; border-radius: 8px; border-left: 3px solid #ddd;">
                        <span style="font-weight: 700; font-size: 14px;">${st.user}님:</span>
                        <span style="font-style: italic; color: #444;">"${st.response}"</span>
                    </div>
                `).join('') : '<p class="text-muted">기록된 대화가 없습니다.</p>'}
            </div>
        </div>

        <div class="report-footer mt-2xl text-center" style="border-top: 1px dashed #ccc; padding-top: 20px; font-size: 12px; color: #999;">
            본 리포트는 하루잇(HARUIT) AI 분석 시스템에 의해 자동으로 생성되었습니다.
        </div>
    `;
}
