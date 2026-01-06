/**
 * 하루잇(HARUIT) - 데이터 모델 및 샘플 데이터
 */

// ============================================
// 환경별 미션 템플릿
// ============================================
const MISSIONS = {
    chair: {
        seated: [
            "의자에서 천천히 기지개를 켜볼까요?",
            "의자 팔걸이를 두 번 두드려볼까요?",
            "의자에 앉은 채로 발목을 돌려볼까요?"
        ],
        limited: [
            "의자에서 일어났다 다시 앉아볼까요?",
            "의자 주변을 한 바퀴 걸어볼까요?",
            "의자를 조금 옮겨볼까요?"
        ],
        full: [
            "의자를 다른 곳으로 옮겨볼까요?",
            "의자 아래를 살펴보고 정리해볼까요?",
            "의자 위치를 창문 쪽으로 바꿔볼까요?"
        ]
    },
    table: {
        seated: [
            "테이블 위의 물건 하나를 살짝 만져볼까요?",
            "테이블을 손바닥으로 세 번 두드려볼까요?",
            "테이블 위에 손을 올려 온기를 느껴볼까요?"
        ],
        limited: [
            "테이블 위의 물건을 정리해볼까요?",
            "테이블을 한 번 닦아볼까요?",
            "테이블 위에 있는 것을 다른 곳에 놓아볼까요?"
        ],
        full: [
            "테이블 위의 물건을 모두 정리해볼까요?",
            "테이블을 깨끗이 닦아볼까요?",
            "테이블 위치를 조금 바꿔볼까요?"
        ]
    },
    cup: {
        seated: [
            "컵을 들어 한 모금만 마셔볼까요?",
            "컵의 온도를 손으로 느껴볼까요?",
            "컵을 천천히 돌려볼까요?"
        ],
        limited: [
            "컵에 물을 따라볼까요?",
            "컵을 다른 곳에 옮겨볼까요?",
            "빈 컵을 씻으러 가볼까요?"
        ],
        full: [
            "컵을 씻고 제자리에 놓아볼까요?",
            "새로운 음료를 컵에 준비해볼까요?",
            "컵을 싱크대까지 가져가볼까요?"
        ]
    },
    window: {
        seated: [
            "창문 밖 풍경을 바라봐볼까요?",
            "창문에 손을 대고 온도를 느껴볼까요?",
            "커튼을 5cm만 움직여볼까요?"
        ],
        limited: [
            "창문 가까이 가서 밖을 바라봐볼까요?",
            "창문을 조금 열어볼까요?",
            "커튼을 살짝 열어볼까요?"
        ],
        full: [
            "창문을 활짝 열고 환기해볼까요?",
            "창문을 닦아볼까요?",
            "커튼을 완전히 열어 햇빛을 받아볼까요?"
        ]
    },
    mirror: {
        seated: [
            "거울을 보고 눈을 한 번 깜빡여볼까요?",
            "거울 속 자신에게 미소 지어볼까요?",
            "거울을 보며 볼을 부풀려볼까요?"
        ],
        limited: [
            "거울 앞에 서서 자세를 바르게 해볼까요?",
            "거울 앞에서 기지개를 켜볼까요?",
            "거울을 살짝 닦아볼까요?"
        ],
        full: [
            "거울을 깨끗이 닦아볼까요?",
            "거울 앞에서 간단한 체조를 해볼까요?",
            "거울 위치를 조정해볼까요?"
        ]
    },
    bed: {
        seated: [
            "침대에 앉아 베개를 정리해볼까요?",
            "이불 끝을 손으로 매만져볼까요?",
            "침대에서 다리를 천천히 펴볼까요?"
        ],
        limited: [
            "침대 시트를 펴볼까요?",
            "베개 위치를 바꿔볼까요?",
            "침대 위의 물건을 정리해볼까요?"
        ],
        full: [
            "침대를 정리해볼까요?",
            "이불을 개켜볼까요?",
            "침대 주변을 정리해볼까요?"
        ]
    }
};

// 환경 목록 (아이콘 포함)
const ENVIRONMENTS = [
    { id: 'chair', name: '의자', icon: '🪑' },
    { id: 'table', name: '테이블', icon: '🪵' },
    { id: 'cup', name: '컵', icon: '☕' },
    { id: 'window', name: '창문', icon: '🪟' },
    { id: 'mirror', name: '거울', icon: '🪞' },
    { id: 'bed', name: '침대', icon: '🛏️' }
];

// 거동 상태 옵션
const MOBILITY_OPTIONS = [
    { id: 'seated', name: '앉아서만 가능', icon: '🪑', description: '움직일 때 어려움이 있으신가요?' },
    { id: 'limited', name: '제한적 이동 가능', icon: '🚶', description: '조금은 움직일 수 있으신가요?' },
    { id: 'full', name: '자유롭게 이동 가능', icon: '🏃', description: '문제없이 이동하실 수 있으신가요?' }
];

// ============================================
// 스몰토크 질문 (20개)
// ============================================
const SMALL_TALK_QUESTIONS = [
    "오늘 날씨 어떠세요?",
    "최근에 가장 기뻤던 일이 뭐예요?",
    "가장 좋아하는 계절이 언제세요?",
    "어렸을 때 즐겨하던 놀이가 뭐였어요?",
    "요즘 가장 관심 있는 게 뭐세요?",
    "가장 맛있게 먹는 음식이 뭐예요?",
    "꼭 가보고 싶은 장소가 있으세요?",
    "가장 존경하는 사람이 누구예요?",
    "최근에 본 영화나 드라마 중 재밌던 게 있어요?",
    "요즘 즐겨 하는 활동이 뭐예요?",
    "가장 소중한 사람이 누구예요?",
    "지난주에 특별했던 일이 있었어요?",
    "좋아하는 책이나 작가가 있으세요?",
    "제일 행복했던 기억이 뭐예요?",
    "가장 자랑스러워하는 일이 뭐예요?",
    "앞으로 해보고 싶은 일이 있으세요?",
    "가장 편안함을 느끼는 장소가 어디예요?",
    "지금 가장 필요한 게 뭐라고 생각하세요?",
    "가장 감사한 사람이 누구예요?",
    "오늘 하루 중 가장 좋았던 순간은?"
];

// ============================================
// 샘플 데이터 생성 (테스트용)
// ============================================
function generateSampleData() {
    const today = new Date();
    const users = [
        {
            userId: "user_001",
            name: "김순자",
            ageGroup: "senior",
            joinDate: getDateString(new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)),
            lastActivity: null,
            activities: []
        },
        {
            userId: "user_002",
            name: "박영수",
            ageGroup: "senior",
            joinDate: getDateString(new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000)),
            lastActivity: null,
            activities: []
        },
        {
            userId: "user_003",
            name: "이옥희",
            ageGroup: "senior",
            joinDate: getDateString(new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000)),
            lastActivity: null,
            activities: []
        }
    ];

    const envIds = Object.keys(MISSIONS);
    const mobilities = ['seated', 'limited', 'full'];

    // 각 사용자에 대해 7일치 활동 데이터 생성
    users.forEach(user => {
        for (let i = 0; i < 7; i++) {
            // 일부 날짜는 활동 없음 (랜덤)
            if (Math.random() < 0.2) continue;

            const activityDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const env = envIds[Math.floor(Math.random() * envIds.length)];
            const mobility = mobilities[Math.floor(Math.random() * mobilities.length)];
            const missionList = MISSIONS[env][mobility];
            const mission = missionList[Math.floor(Math.random() * missionList.length)];
            const completed = Math.random() > 0.15;
            const includeSmallTalk = Math.random() > 0.4;
            const smallTalkCompleted = includeSmallTalk && Math.random() > 0.3;

            const activity = {
                date: getDateString(activityDate),
                time: `${10 + Math.floor(Math.random() * 8)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
                mobility: mobility,
                environment: env,
                mission: mission,
                completed: completed,
                duration: Math.floor(Math.random() * 180) + 60,
                smallTalkIncluded: includeSmallTalk,
                smallTalkQuestion: includeSmallTalk ? SMALL_TALK_QUESTIONS[Math.floor(Math.random() * SMALL_TALK_QUESTIONS.length)] : null,
                smallTalkCompleted: smallTalkCompleted,
                smallTalkResponse: smallTalkCompleted ? "네, 좋았어요." : null
            };

            user.activities.push(activity);
        }

        // 마지막 활동 시간 설정
        if (user.activities.length > 0) {
            const lastAct = user.activities[0];
            user.lastActivity = `${lastAct.date}T${lastAct.time}:00`;
        }
    });

    return users;
}

// 날짜 문자열 변환 (YYYY-MM-DD)
function getDateString(date) {
    return date.toISOString().split('T')[0];
}

// ============================================
// 데이터 관리 함수
// ============================================
const DataManager = {
    STORAGE_KEY: 'haruit_data',
    ADMIN_PASSWORD_KEY: 'haruit_admin_password',
    CURRENT_USER_KEY: 'haruit_current_user',

    // 초기 데이터 로드 또는 생성
    init() {
        let data = this.getData();
        if (!data || !data.users || data.users.length === 0) {
            data = {
                users: generateSampleData(),
                settings: {
                    adminPassword: 'admin123'
                }
            };
            this.saveData(data);
        }
        return data;
    },

    // 전체 데이터 가져오기
    getData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('데이터 로드 오류:', e);
            return null;
        }
    },

    // 전체 데이터 저장
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('데이터 저장 오류:', e);
            return false;
        }
    },

    // 현재 사용자 ID 저장
    setCurrentUser(userId) {
        localStorage.setItem(this.CURRENT_USER_KEY, userId);
    },

    // 현재 사용자 ID 가져오기
    getCurrentUserId() {
        return localStorage.getItem(this.CURRENT_USER_KEY);
    },

    // 사용자 찾기
    getUser(userId) {
        const data = this.getData();
        return data?.users?.find(u => u.userId === userId) || null;
    },

    // 현재 사용자 가져오기
    getCurrentUser() {
        const userId = this.getCurrentUserId();
        return userId ? this.getUser(userId) : null;
    },

    // 새 사용자 생성
    createUser(name, ageGroup = 'senior') {
        const data = this.getData() || { users: [], settings: { adminPassword: 'admin123' } };
        const userId = 'user_' + Date.now();
        const newUser = {
            userId: userId,
            name: name,
            ageGroup: ageGroup,
            joinDate: getDateString(new Date()),
            lastActivity: null,
            activities: []
        };
        data.users.push(newUser);
        this.saveData(data);
        this.setCurrentUser(userId);
        return newUser;
    },

    // 활동 기록 추가
    addActivity(userId, activity) {
        const data = this.getData();
        const user = data?.users?.find(u => u.userId === userId);
        if (user) {
            user.activities.unshift(activity);
            user.lastActivity = `${activity.date}T${activity.time}:00`;
            this.saveData(data);
            return true;
        }
        return false;
    },

    // 쉬는 날 기록
    addRestDay(userId) {
        const today = new Date();
        const activity = {
            date: getDateString(today),
            time: `${today.getHours()}:${String(today.getMinutes()).padStart(2, '0')}`,
            mobility: null,
            environment: null,
            mission: '쉬는 날',
            completed: false,
            duration: 0,
            isRestDay: true,
            smallTalkIncluded: false,
            smallTalkQuestion: null,
            smallTalkCompleted: false,
            smallTalkResponse: null
        };
        return this.addActivity(userId, activity);
    },

    // 모든 사용자 가져오기
    getAllUsers() {
        const data = this.getData();
        return data?.users || [];
    },

    // 관리자 비밀번호 확인
    verifyAdminPassword(password) {
        const data = this.getData();
        return data?.settings?.adminPassword === password;
    },

    // 관리자 비밀번호 변경
    changeAdminPassword(newPassword) {
        const data = this.getData();
        if (data) {
            data.settings.adminPassword = newPassword;
            this.saveData(data);
            return true;
        }
        return false;
    },

    // 사용자 삭제
    deleteUser(userId) {
        const data = this.getData();
        if (data) {
            data.users = data.users.filter(u => u.userId !== userId);
            this.saveData(data);
            return true;
        }
        return false;
    },

    // 사용자 데이터 초기화
    resetUserData(userId) {
        const data = this.getData();
        const user = data?.users?.find(u => u.userId === userId);
        if (user) {
            user.activities = [];
            user.lastActivity = null;
            this.saveData(data);
            return true;
        }
        return false;
    },

    // 전체 데이터 초기화
    resetAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.CURRENT_USER_KEY);
        return this.init();
    },

    // CSV 내보내기 데이터 생성
    exportToCSV(userId = null) {
        const data = this.getData();
        let users = data?.users || [];
        
        if (userId) {
            users = users.filter(u => u.userId === userId);
        }

        let csv = '사용자ID,이름,날짜,시간,거동상태,환경,미션,완료여부,소요시간,스몰토크질문,스몰토크완료,스몰토크답변\n';
        
        users.forEach(user => {
            user.activities.forEach(act => {
                csv += `${user.userId},${user.name},${act.date},${act.time},${act.mobility || ''},${act.environment || ''},`;
                csv += `"${act.mission}",${act.completed ? '완료' : '미완료'},${act.duration},`;
                csv += `"${act.smallTalkQuestion || ''}",${act.smallTalkCompleted ? '완료' : '미완료'},"${act.smallTalkResponse || ''}"\n`;
            });
        });

        return csv;
    }
};

// ============================================
// 통계 계산 함수
// ============================================
const Statistics = {
    // 사용자 통계 계산
    getUserStats(user) {
        if (!user || !user.activities) return null;

        const activities = user.activities.filter(a => !a.isRestDay);
        const totalParticipation = activities.length;
        const completedActivities = activities.filter(a => a.completed).length;
        const completionRate = totalParticipation > 0 
            ? Math.round((completedActivities / totalParticipation) * 100) 
            : 0;

        // 월간 참여율 (최근 30일)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyActivities = activities.filter(a => new Date(a.date) >= thirtyDaysAgo);
        const monthlyParticipationRate = Math.round((monthlyActivities.length / 30) * 100);

        // 주간 참여 (최근 7일)
        const weeklyParticipation = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = getDateString(date);
            const dayActivities = activities.filter(a => a.date === dateStr);
            weeklyParticipation.push(dayActivities.length > 0 ? 1 : 0);
        }

        // 연속 참여일 계산
        let consecutiveDays = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = getDateString(date);
            const hasActivity = activities.some(a => a.date === dateStr);
            if (hasActivity) {
                consecutiveDays++;
            } else if (i > 0) {
                break;
            }
        }

        // 선호 미션 유형 (환경별)
        const envCounts = {};
        activities.forEach(a => {
            if (a.environment) {
                envCounts[a.environment] = (envCounts[a.environment] || 0) + 1;
            }
        });

        // 스몰토크 통계
        const smallTalkActivities = activities.filter(a => a.smallTalkIncluded);
        const smallTalkCompleted = smallTalkActivities.filter(a => a.smallTalkCompleted);
        const smallTalkRate = smallTalkActivities.length > 0
            ? Math.round((smallTalkCompleted.length / smallTalkActivities.length) * 100)
            : 0;

        // 가장 자주 받은 질문
        const questionCounts = {};
        smallTalkActivities.forEach(a => {
            if (a.smallTalkQuestion) {
                questionCounts[a.smallTalkQuestion] = (questionCounts[a.smallTalkQuestion] || 0) + 1;
            }
        });
        const mostFrequentQuestion = Object.entries(questionCounts)
            .sort((a, b) => b[1] - a[1])[0] || null;

        return {
            totalParticipation,
            completedActivities,
            completionRate,
            monthlyParticipationRate,
            weeklyParticipation,
            consecutiveDays,
            preferredMissions: envCounts,
            smallTalkCount: smallTalkActivities.length,
            smallTalkCompletedCount: smallTalkCompleted.length,
            smallTalkRate,
            mostFrequentQuestion: mostFrequentQuestion ? {
                question: mostFrequentQuestion[0],
                count: mostFrequentQuestion[1]
            } : null
        };
    },

    // 전체 통계 (관리자용)
    getOverallStats() {
        const users = DataManager.getAllUsers();
        const today = getDateString(new Date());
        
        const totalUsers = users.length;
        const todayParticipants = users.filter(u => 
            u.activities.some(a => a.date === today && !a.isRestDay)
        ).length;

        // 주간 평균 참여율
        let weeklyTotal = 0;
        users.forEach(u => {
            const stats = this.getUserStats(u);
            weeklyTotal += stats.weeklyParticipation.reduce((a, b) => a + b, 0);
        });
        const weeklyAvgRate = totalUsers > 0 
            ? Math.round((weeklyTotal / (totalUsers * 7)) * 100) 
            : 0;

        // 7일 이내 신규 가입
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newUsers = users.filter(u => new Date(u.joinDate) >= sevenDaysAgo).length;

        return {
            totalUsers,
            todayParticipants,
            todayParticipationRate: totalUsers > 0 ? Math.round((todayParticipants / totalUsers) * 100) : 0,
            weeklyAvgRate,
            newUsers
        };
    },

    // 월별 데이터 (차트용)
    getMonthlyData(user, months = 6) {
        const data = [];
        const today = new Date();

        for (let i = 0; i < months; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const monthActivities = user.activities.filter(a => {
                const actDate = new Date(a.date);
                return actDate.getMonth() === month && actDate.getFullYear() === year && !a.isRestDay;
            });

            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const participationRate = Math.round((monthActivities.length / daysInMonth) * 100);

            data.unshift({
                month: `${year}-${String(month + 1).padStart(2, '0')}`,
                label: `${month + 1}월`,
                count: monthActivities.length,
                rate: participationRate
            });
        }

        return data;
    }
};
