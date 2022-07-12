import React, { createContext, useReducer, useContext } from 'react';
import {
    createAsyncDispatcher,
    createAsyncHandler,
    initialAsyncState
} from './asyncActionUtils';
import * as api from './api'; // api 파일에서 내보낸 모든 함수들을 불러옴
import moment from "moment"

var log_idx = 0;
// UsersContext 에서 사용 할 기본 상태
const initialState = {
    // rest data
    users: initialAsyncState,
    user: initialAsyncState,

    twin: initialAsyncState,
    entity: initialAsyncState,

    //web socket data
    twin_infos: {},
    event_logs: [],
    socket_status: 'disconnect'
};

const usersHandler = createAsyncHandler('GET_USERS', 'users');
const userHandler = createAsyncHandler('GET_USER', 'user');

function timestamp() {
    return moment(new Date()).format("HH:mm:ss")
}

// 위에서 만든 객체 / 유틸 함수들을 사용하여 리듀서 작성
function usersReducer(state, action) { // 2

    switch (action.type) {

        case 'GET_USERS':
        case 'GET_USERS_SUCCESS':
        case 'GET_USERS_ERROR':
            return usersHandler(state, action);  // 3 결과 처리
        case 'GET_USER':
        case 'GET_USER_SUCCESS':
        case 'GET_USER_ERROR':
            return userHandler(state, action);
        case 'SOCKET_STATUS': // 카탈로그 서버와의 연결상태
            return {
                ...state,
                socket_status: action.socket_status
            };
        case 'SOCKET_MESSAGE':
            const type = action.data.type;
            const data = action.data.data;
            //console.log(state.event_logs);
            switch (type) {
                case "TWIN_INFO": // 전체 트윈 및 엔티티 정보 초기화 (소켓 연결 성공 시 최초 한 번 수신)
                    return {
                        ...state,
                        twin_infos: data.twin_infos,
                        event_logs: [...state.event_logs, { id: log_idx++, timestamp: timestamp(), type: type, data: data }]
                    }
                case "TWIN_CONNECT": // 트윈 정보 추가 및 갱신
                    state.twin_infos[data.id] = data
                    return {
                        ...state,
                        twin_infos: { ...state.twin_infos },
                        event_logs: [...state.event_logs, { id: log_idx++, timestamp: timestamp(), type: type, data: data }]
                    }
                case "TWIN_DISCONNECT": // 트윈 정보 추가 및 갱신
                    state.twin_infos[data.id] = data
                    return {
                        ...state,
                        twin_infos: { ...state.twin_infos },
                        event_logs: [...state.event_logs, { id: log_idx++, timestamp: timestamp(), type: type, data: data }]
                    }

                case "TWIN_DELETE": // 트윈 삭제
                    delete state.twin_infos[data.id];
                    return {
                        ...state,
                        twin_infos: { ...state.twin_infos },
                        event_logs: [...state.event_logs, { id: log_idx++, timestamp: timestamp(), type: type, data: data }]
                    }

                case "TWIN_UPDATE":
                    return {
                        ...state,
                        twin_infos: state.twin_infos.map(twin => {
                            if (data.id === twin.id) {
                                return data;
                            } else {
                                return twin
                            }
                        })
                    }
                case "ENTITY_INFO_LIST_UPDATE": // 엔티티 추가
                    //console.log('ENTITY_ADD',data);
                    console.log('test', data);
                    state.twin_infos[data.twin_id].entities = data.entity_info_list;
                    return {
                        ...state,
                        twin_infos: { ...state.twin_infos },
                        event_logs: [...state.event_logs, { id: log_idx++, timestamp: timestamp(), type: type, data: data }]
                    }

                case "ENTITY_REMOVE": // 엔티티 삭제

                    state.twin_infos[data.source_id].entities = state.twin_infos[data.source_id].entities.filter(en => en.id !== data.id)
                    return {
                        ...state,
                        twin_infos: { ...state.twin_infos },
                        event_logs: [...state.event_logs, { id: log_idx++, timestamp: timestamp(), type: type, data: data }]
                    }
                // case "ENTITY_ADD":
                //     var source_id = data.source_id;
                //     return {
                //         ...state,
                //         twin_info: state.twin_info.map(twin => {
                //             if (twin.id === source_id) {
                //                 twin.entities.push(data);
                //             }

                //             return twin;

                //         })
                //     }
                default:
                    throw new Error(`Unhanded action type: ${action.type}`);
            }


        default:
            throw new Error(`Unhanded action type: ${action.type}`);
    }
}

// State 용 Context 와 Dispatch 용 Context 따로 만들어주기
const UsersStateContext = createContext(null);
const UsersDispatchContext = createContext(null);

// 위에서 선언한 두가지 Context 들의 Provider 로 감싸주는 컴포넌트
export function UsersProvider({ children }) {
    const [state, dispatch] = useReducer(usersReducer, initialState);
    return (
        <UsersStateContext.Provider value={state}>
            <UsersDispatchContext.Provider value={dispatch}>
                {children}
            </UsersDispatchContext.Provider>
        </UsersStateContext.Provider>
    );
}

// State 를 쉽게 조회 할 수 있게 해주는 커스텀 Hook
export function useUsersState() {
    const state = useContext(UsersStateContext);
    if (!state) {
        throw new Error('Cannot find UsersProvider');
    }
    return state;
}

// Dispatch 를 쉽게 사용 할 수 있게 해주는 커스텀 Hook
export function useUsersDispatch() {
    const dispatch = useContext(UsersDispatchContext);
    if (!dispatch) {
        throw new Error('Cannot find UsersProvider');
    }
    return dispatch;
}

export const getUsers = createAsyncDispatcher('GET_USERS', api.getUsers); // 1 , action 실행
export const getUser = createAsyncDispatcher('GET_USER', api.getUser);
export const API = api;
