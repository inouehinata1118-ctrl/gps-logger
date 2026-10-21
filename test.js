window.addEventListener("load", ()=> {
    // 保存するファイル名（位置情報専用のファイルに分ける）
    let filename = "geolocation.csv";

    // 取得した最新のデータを、ログに表示・保存するまで取っておく変数
    let latitude, longitude, altitude, accuracy, speed, heading;
    let gpsTime;  // 位置が測定された時刻

    // 記録した行をためておく配列（最後にまとめてCSVにする）
    let rows = [];

    /*
    // iPhoneでは加速度・角速度の取得に設定が必要なため、今回は使わない
    // デバイスの方向の検出
    window.addEventListener("deviceorientation", (event)=> {
        ...
    });
    // 加速度・角加速速度
    window.addEventListener("devicemotion", (event)=> {
        ...
    });
    */

    // 位置情報
    // enableHighAccuracy: GPSを優先して精度の高い位置を取る
    navigator.geolocation.watchPosition((pos)=> {
        let coords = pos.coords;
        latitude = coords.latitude;
        longitude = coords.longitude;
        altitude  = coords.altitude;
        accuracy  = coords.accuracy;   // 水平方向の誤差[m]
        speed     = coords.speed;      // 速度[m/s]（止まっているとnull）
        heading   = coords.heading;    // 進行方向[度]（北=0、止まっているとnull）
        gpsTime   = new Date(pos.timestamp).toLocaleString("ja-JP");
        result.geolocation.value = [latitude, longitude, altitude, accuracy, speed, heading].join(",");
    }, (err)=> {
        show("位置情報エラー: " + err.message);
    }, {enableHighAccuracy: true});

    // 最初に列名を1行だけ記録しておく
    log(["記録時刻", "測定時刻", "緯度", "経度", "高度", "精度m", "速度m/s", "方角"]);

    // 5000ミリ秒毎に実行される
    // 1回につき1行だけ、時刻と位置情報を全部並べて記録する
    setInterval(()=> {
        if(latitude === undefined){
            return;  // まだ位置が取れていない間は記録しない
        }
        let now = new Date().toLocaleString("ja-JP");
        log([now, gpsTime, latitude, longitude, altitude, accuracy, speed, heading]);
    }, 5000);

    // 結果を表示するテキストエリアなどをゲットしておく
    let result = {
        result: document.getElementById("result"),
        geolocation: document.getElementById("geolocation"),
        count: document.getElementById("count"),
    }

    // 「CSVを保存」ボタンが押されたら、ためた行をファイルにして書き出す
    document.getElementById("save").addEventListener("click", ()=> {
        saveCsv();
    });

    // データをログに表示・記録する関数
    function log(data){
        let dataStr;
        if(Array.isArray(data)){
            dataStr = data.join(",");
        }else{
            dataStr = data;
        }
        show(dataStr);
        rows.push(dataStr);
        result.count.textContent = rows.length - 1;  // 列名の行は数えない
        // upload(dataStr);  // 授業サーバには送らない
    }

    // テキストエリアに結果を表示する
    function show(str){
        result.result.value = str + "\n" + result.result.value;
    }

    // ためた行をCSVファイルにして、iPhoneの共有メニュー（AirDrop・ファイルに保存）で書き出す
    async function saveCsv(){
        // 先頭のBOMは、Excelで開いたときに日本語が文字化けしないようにするため
        let file = new File(["﻿" + rows.join("\n") + "\n"], filename, {type: "text/csv"});
        if(navigator.canShare && navigator.canShare({files: [file]})){
            try{
                await navigator.share({files: [file]});
                show("共有メニューを開きました");
            }catch(e){
                show("保存をキャンセル: " + e.message);
            }
        }else{
            // 共有メニューが使えないブラウザ（パソコンなど）では普通にダウンロード
            let a = document.createElement("a");
            a.href = URL.createObjectURL(file);
            a.download = filename;
            a.click();
            show("ダウンロードしました");
        }
    }

    /*
    // 授業サーバにアップロードする関数（今回は使わない）
    function upload(data){
        let request = new XMLHttpRequest();
        request.open("get", "../log/" + filename + "?data=" + encodeURIComponent(data), true);
        request.onreadystatechange = ()=> {
            if(request.readyState != 4){
                return;
            }
            if(request.status == 200){
                show("アップロード完了");
            }else{
                show("アップロード失敗");
            }
        };
        request.send();
    };
    */
});
