const API_KEY = 
"2d0ec3d247245897757f871161e78b96c07105d990c860fb649f767b3bba8f66";

const tickersHandlers = new Map();
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

const AGGREGATE_INDEX = "5";

socket.addEventListener("message", e => {
    const {TYPE: type, FROMSYMBOL: currency, PRICE: newPrice} = JSON.parse(e.data);
    if(type !== AGGREGATE_INDEX || newPrice === undefined){
        return;
    }
    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach(fn => fn(newPrice));
});

function sendToWebSocket(message){
    const stringifiedMassage = JSON.stringify(message);
    if(socket.readyState === WebSocket.OPEN){
        socket.send(stringifiedMassage);
        return;
    }

    socket.addEventListener(
        "open", () => {socket.send(stringifiedMassage);
        },
        {once: true}
    );
}

function subscribeToTickerOnWs(ticker){
    sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

function unsubscribeFromTickerOnWs(ticker){
    sendToWebSocket({
        action: "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}


export const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
    subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = ticker => {
    tickersHandlers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker);
}; 