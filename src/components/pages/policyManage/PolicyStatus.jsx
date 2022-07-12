import React, { useRef, useState,useMemo } from 'react';
import './policyStatus.scss'
import {DataGrid} from '@mui/x-data-grid'
import useAsync from '../../../useAsync'
import {getAllInfos} from '../../../api'
import {useInterval} from '../../../utils'
import {useLocation } from 'react-router-dom';
const policy_status = [
    { field: "id", headerName: "Id", width: 150 },
    { field: "twin_id", headerName: "트윈 아이디", width: 150 },
    { field: "twin_name", headerName: "트윈 명", width: 150 },
    { field: "status", headerName: "진행상태",  flex: 1,
    renderCell : (params) =>{
        return (
            <>
                <p >{JSON.stringify(params.row)}</p>
            </>
        )
    }}
];

export default function PolicyStatus(){
    //const {plicyId} = useParams();
    const location = useLocation();
    const policy = location.state?.policy; // 외부 주입된 정책정보
    const [state, refetch] = useAsync(()=>getAllInfos(), []);
    const { loading, data, error } = state; // state.data 를 users 키워드로 조회

    useInterval(()=>{
        refetch();
    },3000)

    const getPolicyStatusList = useMemo(()  =>{
        var list = [];
        if(data){
            var policy = data.policy_infos[policy.id];
            if(policy){
                for (const [id, twin] of Object.entries(data.twin_infos)) {
                    if(policy.twinIds.includes(twin.id)){
                        list.push({
                            id : twin.id, // 트윈 아이디
                            name : twin.name, // 트윈 명
                            type : twin.type, // 트윈 타입 , 제조 ,에너지
                            status : twin.status, // 소켓 연결 상태
                            entities : twin.entities ,// 객체 값 리스트
                            policy_status : twin.policy_status, // 정책 상태 (정책 시나리오에 따라 다르게 판단됨)
                            policy_config : twin.policy_config // 정책 시작시 목표 타겟값
                        })
                    }
                }
            }
            
        }
        return list;
    },[data]);


    if (loading) return <div>로딩중..</div>;
    if (error) return <div>Load Fail getAllInfos </div>;
    if (!data) return <div>getAllInfos empty  </div>;

    return (
        <div className='policy'>
            <h1 >Policy Status</h1>
            <div className='policyContainer'>
                <DataGrid
                    rows={getPolicyStatusList}
                    columns = {policy_status}
                    pageSize = {20}
                    // checkboxSelection
                    hideFooter
                    // disableSelectionOnClick
                    // selectionModel={getRelationTwinIds}
                    onRowClick={(param)=>{
                        //nodeFocusTableHandler(param.row);
                        //console.log(JSON.stringify(param.row));
                    }}
                    // onSelectionModelChange ={(ids)=>{
                    // }}
                />
            </div> 
         
        </div>
    )
}