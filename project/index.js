import fetch from 'node-fetch';
import TelegramBot from 'node-telegram-bot-api';

const token = "7646681831:AAGam7Y2hrPH9s-oZtI42Cz_OJuK5NjsSFU"; // 텔레그램 봇 토큰
const bot = new TelegramBot(token, { polling: true });

// 텔레그램 메시지 처리
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
        bot.sendMessage(chatId, "안녕하세요! 텔레그램 봇입니다.\n'비' 또는 '눈'이라고 입력하면 현재 강수 정보를 알려드립니다.");
    } else if (text === '비' || text === '눈') {
        try {
            const weatherInfo = await getWeatherInfo();
            bot.sendMessage(chatId, weatherInfo);
        } catch (error) {
            bot.sendMessage(chatId, "강수 정보를 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
    } else {
        bot.sendMessage(chatId, `알 수 없는 명령입니다: "${text}"`);
    }
});

// 기상청 API 호출
async function getWeatherInfo() {
    const API_URL = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
    const SERVICE_KEY = "b++PUdnWEFUjX65QvY82TwlITk1bdxcD5PqTb+3h+i7sgGvNKzWCP3v0IAn8qRpUz90kiRMdzm62RshJAmhF8A=="; // 기상청 API 서비스 키
    const params = {
        serviceKey: SERVICE_KEY,
        pageNo: 1,
        numOfRows: 1000,
        dataType: "JSON",
        base_date: getCurrentDate(), // 현재 날짜로 수정
        base_time: "0500",          // 기준 시간 (기상청 기준 0500, 0800 등)
        nx: 98,                     // 부산의 격자 X 좌표
        ny: 76                      // 부산의 격자 Y 좌표
    };

    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_URL}?${queryString}`);
    if (!response.ok) {
        throw new Error("기상청 API 호출 실패");
    }

    const data = await response.json();
    const items = data.response.body.items.item;

    let rainAmount = 0;
    let precipitationType = "없음";

    items.forEach(item => {
        if (item.category === "RN1") {
            rainAmount = parseFloat(item.fcstValue);
        } else if (item.category === "PTY") {
            switch (item.fcstValue) {
                case "1":
                    precipitationType = "비";
                    break;
                case "2":
                    precipitationType = "비와 눈";
                    break;
                case "3":
                    precipitationType = "눈";
                    break;
                case "4":
                    precipitationType = "소나기";
                    break;
            }
        }
    });

    // 강수량이나 강수유형이 있으면 정보 반환
    if (rainAmount > 0 || precipitationType !== "없음") {
        return `현재 부산에서 ${precipitationType}가 내리고 있습니다.\n강수량: ${rainAmount}mm`;
    } else {
        return "현재 부산에 비나 눈이 내리지 않습니다.";
    }
}

// 현재 날짜 가져오기 함수 (YYYYMMDD 형식)
function getCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}
