/*
 网易云音乐
*/
const $ = new Env('网易云音乐');
let APIURL = 'http://api_music163.kongdf.com/'
let userList = []
let Guser = {}
let Gi = 0
let cookie = ''
let dakaNum = 0 
function getUserList() {
    $.post(taskUrl3(`http://api_admin.kongdf.com/music/user_List`), (resp, data) => {
        let res = JSON.parse(data.body)
        userList = res
        start()
        //   console.log(res)
    });
}
getUserList()
function erro(){
     let options = {
        url: `http://api_admin.kongdf.com/music/user_upuser_err`,
        body: JSON.stringify({ 
                 uin:Guser.uin,
                 playstatus:'1' 
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
    $.post(options, (err, resp, data) => {
        console.log(data)
    })
}
// 
function start() {
    if (Gi < userList.length) {
        let user = userList[Gi]
        Guser = user
        login(Guser)
    } else {
        console.log('今日所有账号打卡结束')
        $.done();
    }
}

function login(user) {
    $.get(taskUrl(`${APIURL}?do=login&uin=${user.uin}&pwd=${user.pwd}`), (resp, data) => {
        let res = JSON.parse(data.body)
        // console.log(data)
        // console.log(data.headers['set-cookie'])
        cookie = data.headers['set-cookie']
        if (res.code == 200) {
            user.account = res.account
            user.token = res.token
            user.account = res.account
            user.profile = res.profile
            console.log(user.profile.nickname + ' 登陆成功')
            sign()
        } else {
            erro()


            sendNotify(user.uin + res.msg)
            Gi++
            start()
        }
    });
}
function taskUrl(url) {
    url = url + '&r=' + new Date().getTime()
    return {
        url,
        headers: {
            "Cookie": cookie,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Encoding': 'gzip, deflate',     
            'Accept': '*/*'
         // "Connection": "keep-alive",
         // "User-Agent": "okhttp/3.12.1;jdmall;android;version/10.1.2;build/89743;screen/1080x2030;os/9;network/wifi;",
         // "Accept": "*/* ",
        // "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
      // cookies:cookie
   }
}
function taskUrl3(url) {
    url = url
    return {
        url,
        headers: {
            // "cookies":cookie
            // "Connection": "keep-alive",
            // "User-Agent": "okhttp/3.12.1;jdmall;android;version/10.1.2;build/89743;screen/1080x2030;os/9;network/wifi;",
            // "Accept": "*/*",
            // "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        // cookies:cookie
    }
}


function sign() {
    $.get(taskUrl(`${APIURL}?do=sign`), (err, resp, data) => {
        let res = JSON.parse(data)
        if (res.code == 200) {
            console.log('签到成功')
        } else {
            console.log('重复签到')
        }
        detail()
    });
}
function daka() {
    if (dakaNum < 10) {
        $.post(taskUrl(`${APIURL}?do=daka`), (err, resp, data) => {
            let res = JSON.parse(data)
            if (res.code == 200) {
                console.log('打卡成功')
                dakaNum++

                setTimeout(function () {
                    daka()

                }, 20000)
            } else {
                      erro()
                sendNotify(user.uin + res.msg)
                Gi++
                start()
            }
        });
    } else {
        dakaNum = 0
        detail2()
    }



}
function detail() {
    $.get(taskUrl(`${APIURL}?do=detail&uid=${Guser.account.id}`), (err, resp, data) => {
        let res = JSON.parse(data)
        if (res.code == 200) {
            Guser.info1 = JSON.parse(resp.body)
            console.log('获取详情成功，开始打卡')
            console.log(Guser.info1.listenSongs)
            daka()
        } else {

            sendNotify(user.uin + res.msg)
            Gi++
            start()
        }

    });
}

function detail2() {
    $.get(taskUrl(`${APIURL}?do=detail&uid=${Guser.account.id}`), (err, resp, data) => {
        let res = JSON.parse(data)
        if (res.code == 200) {
            Guser.info2 = JSON.parse(resp.body)
            console.log(Guser.info2.listenSongs)

            // console.log(Guser.info2.listenSongs - Guser.info1.listenSongs, '今日共打卡')
            let notify = `### 网易云音乐
                     #### 账户信息
                     > 用户名称：<font color="warning">${Guser.profile.nickname}</font>
                     > 当前等级：<font color="warning">${Guser.info2.level}</font>
                     > 累计播放：<font color="warning">${Guser.info2.listenSongs}</font>首
                     > 还需打卡：<font color="warning">${Math.ceil((20000 - Guser.info2.listenSongs) / 300)}</font>天 `
            console.log('等十秒后开始下一个账号')

            let options = {
        url: `http://api_admin.kongdf.com/music/user_upuser`,
        body: JSON.stringify({
                 username:Guser.profile.nickname,
                 level:Guser.info2.level,
                 listenSongs:Guser.info2.listenSongs,
                 endday:Math.ceil((20000 - Guser.info2.listenSongs) / 300),
                 uin:Guser.uin,
                 playstatus:'1' 
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
    $.post(options, (err, resp, data) => {
        console.log(data)
    })


            sendNotify(notify)

            setTimeout(function () {
                Gi++

                start()

            }, 10000)
        } else {

            sendNotify(user.uin + res.msg)
            Gi++
            start()
        }

    });
}
function sendNotify(notify) {


    let options = {
        url: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=8069dfd9-0e62-4f94-a715-2997381ae1bf`,
        body: JSON.stringify({
            msgtype: "markdown",
            markdown: {
                content: notify
            }

        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
    $.post(options, (err, resp, data) => {
        console.log(data)
    })
}
// prettier-ignore
function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
