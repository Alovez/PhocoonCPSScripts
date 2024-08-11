// ==UserScript==
// @name         Download CPS Url for Games by Collection
// @namespace    http://tampermonkey.net/
// @version      2024-08-08
// @description  download cps url
// @author       AloveZ
// @match        https://game.weixin.qq.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=qq.com
// @require  http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require  https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/core.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/md5.js
// @grant       GM_getValue
// @grant       GM_setValue
// ==/UserScript==

(function() {
    'use strict';

    const COLLECTOIN_COUNT = 50;
    let progress_title = document.createElement("p");
    let progress = document.createElement("div");
    progress.setAttribute('class', 'progress-bar');
    progress.setAttribute('style', 'width: 100%; background-color: #ddd;');
    let progress_bar = document.createElement("div");
    progress_bar.setAttribute('style', '  width: 1%; height: 30px; background-color: #04AA6D;text-align: center; line-height: 30px; color: white;');
    progress.appendChild(progress_bar);

    let collectionFullList = [];

    function saveFile(fileContent, game) {
        const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
        const fileUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");
        downloadLink.href = fileUrl;
        downloadLink.setAttribute("download", "cps_url_"+ game +".csv"); // 指定下载文件的名称
        document.body.appendChild(downloadLink); // 将a标签添加到文档中
        downloadLink.click(); // 模拟点击a标签，触发下载
        document.body.removeChild(downloadLink); // 下载后从文档中移除a标签
    }


    async function getUrl(game_id, channel) {
        const resp = await fetch("https://game.weixin.qq.com/cgi-bin/gamewxagchannelwap/setcpspromotedlinkforsinglegame", {
            "headers": {
                "accept": "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                "content-type": "application/json; charset=UTF-8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Microsoft Edge\";v=\"126\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": "https://game.weixin.qq.com/cgi-bin/minigame/static/minigame_service/cps.html?",
            "referrerPolicy": "same-origin",
            "body": "{\"appid\":\"" + game_id + "\",\"channel_id\":"+channel+"}",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
        const data = await resp.json();
        return data.data.promoted_link;
    }

    async function createCollection(collection_name, collection_desc) {
        fetch("https://game.weixin.qq.com/cgi-bin/gamewxagchannelwap/setchannelep", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json; charset=UTF-8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Microsoft Edge\";v=\"127\", \"Chromium\";v=\"127\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": "https://game.weixin.qq.com/cgi-bin/minigame/static/minigame_service/cps.html?",
            "referrerPolicy": "same-origin",
            "body": "{\"name\":\""+collection_name+"\",\"desc\":\""+collection_desc+"\",\"path\":\"?\",\"type\":2}",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
    }

    async function getCollectionsCount() {
        const resp = await fetch("https://game.weixin.qq.com/cgi-bin/gamewxagchannelwap/getchannellistep", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json; charset=UTF-8",
                "priority": "u=1, i",
                "sec-ch-ua": "\"Not)A;Brand\";v=\"99\", \"Microsoft Edge\";v=\"127\", \"Chromium\";v=\"127\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": "https://game.weixin.qq.com/cgi-bin/minigame/static/minigame_service/cps.html?",
            "referrerPolicy": "same-origin",
            "body": "{\"type\":2}",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
        const data = await resp.json();
        collectionFullList = data.data.channel_list;
        console.log(collectionFullList);
        return data.data.total_count;
    }

    function task_run(all_game_const) {
        var all_game = JSON.parse(JSON.stringify(all_game_const));
        var all_collection = JSON.parse(JSON.stringify(collectionFullList));
        var result = "";
        var game = all_game.shift();
        var collection = {};

        const intervalId = setInterval(async() => {
            if (all_collection.length > 0) {
                collection = all_collection.shift();
                const url = await getUrl(game,collection.channel_id); // Call the getUrl function with the game element
                result += game + "," + collection.wxgamecid + ","+ collection.name + "," + url + '\n'; // Append the url to the result string with a comma separator
                console.log("game "+ game + " " + all_collection.length + " left");
                updateProgress(collectionFullList.length - all_collection.length, collectionFullList.length, "正在获取" + game + "的链接...");
            } else {
                saveFile(result, game); // Save the result string to a file
                result = '';
                if (all_game.length > 0){
                    game = all_game.shift();
                    all_collection = JSON.parse(JSON.stringify(collectionFullList));
                } else {
                    clearInterval(intervalId);
                }
            }
        }, 1200);
    }

    async function create_collection_task_run(collection_name) {
        let collectionCount = await getCollectionsCount();
        const intervalId = setInterval(async() => {
            if (collectionCount <= COLLECTOIN_COUNT) {
                createCollection(collection_name + collectionCount, collection_name + collectionCount);
                updateProgress(collectionCount, COLLECTOIN_COUNT, "正在创建第" + collectionCount + "个合集...");
                collectionCount += 1;
            } else {
                clearInterval(intervalId);
            }
        }, 1000);
    }

    function showPorgress(title){
        progress_title.innerText = title;
        document.getElementsByClassName('title-box')[0].appendChild(progress_title);
        document.getElementsByClassName('title-box')[0].appendChild(progress);
    }

    function updateProgress(cur, max, title) {
        progress_title.innerText = title;
        var p_value = cur/max * 100;
        progress_bar.innerText = p_value.toFixed(1) + "%";
        progress_bar.style.width = p_value + "%";
    }


    if (window.top === window.self) {
        //--- Script is on domain_B.com when/if it is the MAIN PAGE.
    }
    else {
        console.log("scripts running...");
        let btn=document.createElement("button");
        btn.setAttribute('class', 'weui-desktop-btn weui-desktop-btn_primary');
        btn.setAttribute('style', 'margin-top: 10px');
        btn.innerHTML="下载链接";
        btn.onclick=function(){
            var games = prompt("请输入游戏id列表（多个使用,分割）","wx6829af59103dabf1,wx3ff214289b9455a9");
//             var collection_start = 48;
//             var task = CryptoJS.MD5(games).toString();
//             var last_task = GM_getValue("last_task", null);
//             if (last_task != null){
//                 var last_collectoin = GM_getValue("collection", null);
//                 if (last_collectoin != null){
//                     var continue_confirm = confirm("检测到相同的游戏列表已完成" + last_collectoin + "个合集的抓取，是否继续？（是：继续抓取，否：重新抓取）");
//                     if (continue_confirm) {
//                         alert("继续抓取");
//                         collection_start = last_collectoin;
//                     } else {
//                         alert("重新抓取");
//                     }
//                 }
//             } else {
//                 GM_setValue("last_task", task);
//             }
            if (games) {
                showPorgress("抓取准备中...");
                task_run(games.split(','));
            }

        }

        let createCollectionBtn=document.createElement("button");
        createCollectionBtn.setAttribute('class', 'weui-desktop-btn weui-desktop-btn_primary');
        createCollectionBtn.setAttribute('style', 'margin-top: 10px');
        createCollectionBtn.innerHTML="批量生成合集";
        createCollectionBtn.onclick = function() {
            var collection_name = prompt("请输入合集前缀：", "合集");
            if (collection_name) {
                showPorgress("创建准备中...");
                create_collection_task_run(collection_name);
            }
        }
        let elementFound = false;

        waitForKeyElements(".title-extra", async (jNd) => {
            if (!elementFound) {
                elementFound = true;
                const collectionCount = await getCollectionsCount();
                if (collectionCount < COLLECTOIN_COUNT) {
                    jNd[0].appendChild(createCollectionBtn);
                } else {
                    jNd[0].appendChild(btn);
                }
            }
        }, true);
    }
})();