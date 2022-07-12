const express = require("express");
const cors = require("cors");
//var bodyParser = require('body-parser');
//app.use(bodyParser.urlencoded({ extended: false }));
const pm2 = require('pm2');
const qs = require('qs');
const app = express()
const server = require("http").createServer(app);
const server_io = require("socket.io")(server);
const client_io = require("socket.io-client");
const { default: axios } = require("axios");

const { v4: uuidv4 } = require('uuid');
const SERVER_PORT = 4000;

let twin_ids = {}; // 트윈  이름에 대한 고유 아이디 저장 
let twin_infos = {} // 모든 트윈 정보 저장
let entity_infos = {} // 모든 트윈의 엔티티 정보 저장 key : 엔티티 아이디
let policy_infos = {
    1: {
        id: 1,
        title: '미세먼지 계절관리제',
        enable: true, // 시작상태
        duration: 1000, // 주기
        startTime: "",
        endTime: "",
        twinIds: [],// 연합 참여 트윈
        targetProps: [] // 연협 실행 시 타겟 프로퍼티 설정 값 리스트
    }
    // 2: {
    //     id: 2,
    //     title: '재난상황 발생',
    //     enable: false,
    //     duration: 1000, // 주기
    //     startTime: "",
    //     endTime: "",
    //     twinIds: [], // 연합 참여 트윈,
    //     targetProps: [] // 연협 실행 시 타겟 프로퍼티 설정 값 리스트
    // }
}

function makePolicyTwinConfigs(policy) {

    // 접속중인 트윗 수 
    // let connect_twin_count = Object.keys(twin_infos).map(key => twin_infos[key]).filter(twin_info => twin_info.status === 'connect').length;

    // 1.프로퍼티 아이디 별 못표 값 초기화
    let targetValueMap = new Map();
    //console.log(policy);
    policy.targetProps.forEach(prop => {
        targetValueMap.set(prop.prop_id, prop.target_value);
    })

    // 2.현재 트윈 별 정책관련 프로퍼티 값 합산 (접속중인 트윈만)
    let currentValueAccMap = new Map();
    Object.keys(twin_infos).map(key => twin_infos[key]).filter(twin_info => policy.twinIds.includes(twin_info.id)).forEach(twin_info => {
        twin_info.entities.forEach(entity => {
            entity.props.forEach(prop => {
                if (targetValueMap.get(prop.prop_id)) {
                    // 트윈 별 프로퍼티 값을 누적
                    if (currentValueAccMap.get(prop.prop_id)) {
                        currentValueAccMap.set(prop.prop_id, currentValueAccMap.get(prop.prop_id) + prop.value)
                    } else {
                        currentValueAccMap.set(prop.prop_id, prop.value)
                    }
                }

            })
        })
    });

    let policyConfigs = {};
    Object.keys(twin_infos).map(key => twin_infos[key]).filter(twin_info => policy.twinIds.includes(twin_info.id)).forEach(twin_info => {

        let config = {};
        twin_info.entities.forEach(entity => {
            entity.props.forEach(prop => {
                let target_prop_value = targetValueMap.get(prop.prop_id);
                let acc_current_prop_value = currentValueAccMap.get(prop.prop_id);
                let current_value = prop.value;
                if (target_prop_value != null && acc_current_prop_value != null) {

                    console.log(target_prop_value, acc_current_prop_value);

                    if (acc_current_prop_value !== 0) {
                        // 감축 비율
                        let reduce_ratio = Number(target_prop_value / acc_current_prop_value);
                        config[prop.prop_id] = current_value * reduce_ratio;
                    }

                }
            })
        })
        policyConfigs[twin_info.id] = config;
    });

    console.log(targetValueMap, currentValueAccMap);
    console.log(policyConfigs);

    return policyConfigs



}

async function startServer() {
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    //2. 웹 서버 가동
    app.use(cors()); // 외부접근 허용
    app.use(express.static("build"));

    // 1. 트윈아이디 생성 
    app.get("/twinId/:user_id", function (req, res) {
        const user_id = req.params.user_id;

        // 아이디 생성
        if (twin_ids[user_id]) {
            res.send(twin_ids[user_id])
        } else {
            const twin_id = uuidv4();
            twin_ids[user_id] = twin_id;
            res.send(twin_id)
        }

    })

    //2. 객체 정보 요청
    app.get("/entity/:id", function (req, res) {
        const entity = entity_infos[req.params.id]
        if (entity) {
            //console.log(entity);
            res.send(JSON.stringify(entity))
        } else {
            res.send("")
        }
    })

    //3. 트윈 정보 요청 
    app.get("/twin/:id", function (req, res) {
        const twin = twin_infos[req.params.id]
        if (twin) {
            //console.log(twin);
            res.send(JSON.stringify(twin))
        } else {
            res.send("")
        }
    })

    //4. 트윈 삭제
    app.delete("/twin", function (req, res) {
        var { id } = req.body.data;

        if (delete twin_infos[id]) {

            sendMessage(JSON.stringify({
                type: "TWIN_DELETE",
                data: {
                    id: id // twin_id
                },
                message: "TWIN_DELETE"
            }), null)
        } else {
            // twin not found
        }

        res.send("OK")

    })

    //3. 종합 정보 (모든 트윈의 정보 종합)
    app.get("/allInfos", function (req, res) {

        // 정책 상태 , 
        //var all_twin_counts = Object.keys(twin_infos).length;
        //var con_twins_count = Object.keys(twin_infos).filter(key => twin_infos[key].status === "connect").length;
        //var run_policy_info = Object.keys(policy_infos).map(key => policy_infos[key]).filter(policy => policy.enable === true)
        console.log(entity_infos);
        res.send(JSON.stringify({
            twin_infos: twin_infos, // 전체트윈 수 / 연결상태 수 조회
            policy_infos: policy_infos, // 정책 수 / 현재 동작 정책 상태 조회
            entity_infos: entity_infos // 모든 객체 정보
        }))
    })

    app.get("/policyInfos", function (req, res) {
        res.send(JSON.stringify(policy_infos))
    })

    app.put("/policyUpdate", async function (req, res) {
        var { type, data } = req.body;

        switch (type) {
            case "POLICY_START": // 정책 시작
                // var other_policy_run = Object.keys(policy_infos).map(key => policy_infos[key]).filter(policy => policy.id !== data.id && policy.enable === true)

                // if (other_policy_run.length == 0) {
                //     policy_infos = {
                //         ...policy_infos,
                //         [data.id]: {
                //             ...policy_infos[data.id],
                //             enable: true
                //         }
                //     }
                //     res.send(JSON.stringify({
                //         result: "OK"
                //     }))
                // } else {
                //     res.send(JSON.stringify({
                //         error: "다른 정책이 실행 중입니다.\n(정지 후 다시 시도해주세요)"
                //     }))
                // }

                policy_infos = {
                    ...policy_infos,
                    [data.id]: {
                        ...policy_infos[data.id],
                        enable: true
                    }
                }

                // 실행한 정책 정보 가져오기
                var policy = policy_infos[data.id];
                // 정책에 연합중인 트윈의 모표 값을 계산
                let policyConfigs = makePolicyTwinConfigs(policy);

                var keys = Object.keys(twin_infos);
                for (var i = 0; i < keys.length; i++) {
                    let twin_info = twin_infos[keys[i]];
                    try {

                        // 실행정책에 해당 트윈이 포함되어있는지 파악 

                        if (policy.twinIds.includes(twin_info.id)) {
                            console.log('ttttttt', twin_info.id, policyConfigs, policyConfigs[twin_info.id]);
                            // 정책 실행 요청
                            let response = await axios.put( // delte , put 구분하기!
                                twin_info.server_url + "/policyExcute",
                                {
                                    type: 'start',
                                    policy_info: {
                                        ...policy,
                                        policy_config: policyConfigs[twin_info.id]
                                    }
                                }
                            );

                            // 
                            if (response) { // 응답으로 트윈 정보가 넘어온다.
                                twin_info[twin_info.id] = response.data;
                            }

                        } else {
                            // 정책에 관련되지 않은 트윈들은 정책 삭제를 요청
                            let response = await axios.put( // 
                                twin_info.server_url + "/policyDelete",
                                {
                                    policy_info: {
                                        ...policy
                                    }
                                }
                            );

                            if (response) {
                                twin_info[twin_info.id] = response.data;
                            }
                        }


                        // let response = await axios.put(
                        //     twin_info.server_url + "/policyStart",
                        //     {
                        //         policyId: data.id
                        //     }
                        // );

                        // console.log('ttttttt', response);
                        // if (response.data) { // 응답으로 트윈 정보가 넘어온다.
                        //     twin_info[response.data.id] = response.data;
                        // }

                    } catch (e) {
                        console.log(e.message);
                    }
                }

                res.send(JSON.stringify({
                    result: "OK"
                }))

                return;
            case "POLICY_STOP": // 정책 중지
                policy_infos = {
                    ...policy_infos,
                    [data.id]: {
                        ...policy_infos[data.id],
                        enable: false
                    }
                }

                var keys = Object.keys(twin_infos);
                for (var i = 0; i < keys.length; i++) {
                    let twin_info = twin_infos[keys[i]];
                    try {

                        var policy = policy_infos[data.id];

                        if (policy.twinIds.includes(twin_info.id)) {
                            let response = await axios.put( // delte , put 구분하기!
                                twin_info.server_url + "/policyExcute",
                                {
                                    type: 'stop',
                                    policy_info: {
                                        ...policy
                                    }
                                }
                            );

                            if (response) { // 응답으로 트윈 정보가 넘어온다.
                                twin_info[twin_info.id] = response.data;
                            }

                        } else {
                            // 정책에 관련되지 않은 트윈들은 정책 삭제를 요청
                            let response = await axios.put( // 
                                twin_info.server_url + "/policyDelete",
                                {
                                    policy_info: {
                                        ...policy
                                    }
                                }
                            );

                            if (response) {
                                twin_info[twin_info.id] = response.data;
                            }
                        }


                    } catch (e) {
                        console.log(e.message);
                    }

                }


                res.send(JSON.stringify({
                    result: "OK"
                }))

                return;
            case "POLICY_UPDATE":
                var twinIds = data.twinIds;
                var targetProps = data.targetProps;
                //twinIds: [] ,// 연합 참여 트윈
                // targetProps: [] // 연협 실행 시 타겟 프로퍼티 설정 값 리스트

                var keys = Object.keys(twin_infos);
                var success = 0;
                var fail = 0;
                for (var i = 0; i < keys.length; i++) {
                    let twin_info = twin_infos[keys[i]];
                    try {
                        console.log(twin_info.server_url);
                        //if (twinIds.includes(twin_info.id)) {
                        await axios.put(
                            twin_info.server_url + "/policy", data
                        );
                        success++;
                        //}
                    } catch (e) {
                        fail++;

                        // 실패한 트윈의 정책 정보는 제거한다.
                        twinIds = twinIds.filter((twinId) => twinId !== twin_info.id);
                        targetProps = targetProps.filter((prop) => prop.twinId !== twin_info.id);
                    }
                }

                data.twinIds = twinIds;
                data.targetProps = targetProps;

                policy_infos = {
                    ...policy_infos,
                    [data.id]: data
                }

                res.send(JSON.stringify({
                    result: "OK",
                    message: `성공 : ${success} / 실패 : ${fail}`
                }))

                return;
            default:
        }
        res.send(JSON.stringify({
            result: "OK"
        }))
    })

    server.listen(SERVER_PORT, async function () {
        console.log(`application is listening on port@ ${SERVER_PORT}...`);
    });

    // 웹 소켓
    server_io.on("connection", (socket) => {
        // console.log("websocket connected ID : ", socket.id);
        //console.log(socket.handshake.headers);
        if (socket.handshake.headers.twin_id) {
            // 트윈 소켓 연결

            // 트윈 ID 주입
            socket.twin_id = socket.handshake.headers.twin_id;
            console.log("TWIN_SOCKET_CONNECT >" + socket.handshake.headers.twin_id);

            // - 트윈이 연결되면 트윈정보와 트윈이 가지고있는 객체 정보를 전달한다.
            socket.on("twin_connect", ({ twin_info, entity_info_list }) => {
                twin_info.status = "connect";

                //갱신
                twin_infos[twin_info.id] = twin_info;
                entity_info_list.forEach(entity => {
                    entity_infos[entity.id] = entity;
                });

                // 트윈 연결을 알린다.
                sendMessage(JSON.stringify({
                    type: "TWIN_CONNECT",
                    data: twin_info
                }), null)
            })


            // 정책정보를 갱신
            socket.on("twin_info_update", (data) => {

                twin_infos[data.id] = data;

                // 트윈 연결을 알린다.
                sendMessage(JSON.stringify({
                    type: "TWIN_UPDATE",
                    data: data
                }), null)
            })




            // - 트윈에서 객체 활성화 상태를 변경
            socket.on("entity_info_list_update", ({ entity_info_list }) => {


                if (twin_infos[socket.twin_id]) {
                    // 트윈의 전체 Entity 정보를 갱신한다.
                    twin_infos[socket.twin_id].entities = entity_info_list;
                    entity_info_list.forEach(entity => {
                        entity_infos[entity.id] = entity;
                    })

                    sendMessage(JSON.stringify({
                        type: "ENTITY_INFO_LIST_UPDATE",
                        data: {
                            twin_id: socket.twin_id,
                            entity_info_list: entity_info_list
                        },
                    }), null)
                }

            })

            // - 트윈에서 객체를 삭제
            socket.on("entity_remove", ({ entity }) => {
                twin_infos[entity.source_id].entities = twin_infos[entity.source_id].entities.filter(en => en.id !== entity.id)
                delete entity_infos[entity.id];

                sendMessage(JSON.stringify({
                    type: "ENTITY_REMOVE",
                    data: entity,
                }), null)
            })

            // - 트윈에서 객체 값을 변경 (칼탈로그 웹에서는 주기적으로 /entity/:id get 요청을 통해 값을 갱신)
            socket.on("entity_update", ({ entity }) => {

                if (twin_infos[entity.source_id]) {
                    entity_infos[entity.id] = entity;
                    twin_infos[entity.source_id].entities = twin_infos[entity.source_id].entities.map(old_entity => {
                        if (old_entity.id === entity.id) {
                            return entity;
                        } else {
                            return old_entity
                        }
                    })
                }

            })

            socket.on("disconnect", () => {
                if (twin_infos[socket.twin_id]) {
                    twin_infos[socket.twin_id].status = "disconnect"

                    twin_infos[socket.twin_id].entities = [];

                    Object.keys(entity_infos).forEach(key => {
                        var entity = entity_infos[key];
                        if (entity.source_id === socket.twin_id) {
                            delete entity_infos[key];
                        }
                    })

                    policy_infos[1].targetProps = policy_infos[1].targetProps.filter(prop => prop.twinId !== socket.twin_id);
                    //policy_infos[2].targetProps = policy_infos[2].targetProps.filter(prop => prop.twinId !== socket.twin_id);

                    sendMessage(JSON.stringify({
                        type: "TWIN_DISCONNECT",
                        data: twin_infos[socket.twin_id]
                    }), null)
                }

            })
        } else {
            console.log("WEB_UI_SOCKET_CONNECT");

            // init twin_info
            sendMessage(JSON.stringify({
                type: "TWIN_INFO",
                data: {
                    twin_infos: twin_infos,
                    entity_infos: entity_infos,
                    policy_infos: policy_infos
                }
            }), socket)
        }
    });
}

function sendMessage(data, socket) {
    if (socket) {
        socket.emit('message', data);
    } else {
        server_io.sockets.emit('message', data);
    }
}

var i = 0;
var twin_id = 0;
var entity_id = 0;
var toggle = true;
// setInterval(() => {

//     if (toggle) {
//         twin_id++;
//         server_io.sockets.emit('message', JSON.stringify({
//             type: "TWIN_ADD",
//             data: { id: "TWIN_" + twin_id, name: "TN_" + twin_id, entities: [] }
//         }));
//     } else {
//         entity_id++;
//         server_io.sockets.emit('message', JSON.stringify({
//             type: "ENTITY_ADD",
//             data: { id: "ENTITY_" + entity_id, name: "EN_" + entity_id, source_id: "TWIN_" + twin_id }
//         }));
//     }

//     if (twin_id * entity_id % 3 == 0) {
//         toggle = !toggle;
//     }
//     i++;


// }, 3000);

// setInterval(() => {

//     twin_id = newID();

//     twins.push({
//         id: "TWIN_" + twin_id,
//         name: "TN_" + twin_id,
//         entities: [
//             { id: "ENTITY_" + (++entity_id), name: "EN_" + entity_id, source_id: "TWIN_" + twin_id },
//             { id: "ENTITY_" + (++entity_id), name: "EN_" + entity_id, source_id: "TWIN_" + twin_id }
//         ]
//     })

//     server_io.sockets.emit('message', JSON.stringify({
//         type: "TWIN_INFO",
//         data: twins
//     }));

// }, 3000);

startServer();
