import React, { useRef, useState,useMemo } from 'react';
import './policyStatus.scss'
import {DataGrid} from '@mui/x-data-grid'
import useAsync from '../../../useAsync'
import {getAllInfos} from '../../../api'
import {useInterval} from '../../../utils'
import {useLocation ,useParams } from 'react-router-dom';
import StatusBox from '../../widget/StatusBox';


export default function PolicyStatus(){
    const {policyId} = useParams();
    const location = useLocation();
    //const policy = location.state?.policy; // 외부 주입된 정책정보
    const [state, refetch] = useAsync(()=>getAllInfos(), []);
    const { loading, data, error } = state; // state.data 를 users 키워드로 조회


   //const [policy , setPolicy] = useState(policy);
    useInterval(()=>{
        refetch();
    },3000)

    const policy = data?data.policy_infos[policyId]:null;
    const getPolicyStatusList = useMemo(()  =>{
        var list = [];
        if(data && policy){
          Object.keys(data.twin_infos)
          .map(twin_id => data.twin_infos[twin_id])
          .filter(twin_info => policy.twinIds.includes(twin_info.id))
          .forEach(twin_info =>{
            console.log(twin_info);
            list.push({
                id : twin_info.id,
                twin_name : twin_info.name,
                twin_type : twin_info.type,
                server_url :  twin_info.server_url,
                entities : twin_info.entities,
                status : twin_info.status, // 연결상태
                policy_config : twin_info.policy_info[policy.id],
            })
          })
            
        }
        return list;
    },[data]);

    const getCurrentPropsInfo = (policy,entity_infos) =>{
        let result = "";
        let list = [];
        if(entity_infos){
            for (let [id, entity] of Object.entries(data.entity_infos)) {
                // 연합에 들어있는 트윈만 조회
                if(policy.twinIds.includes(entity.source_id)){

                    // 연합에 들어있는 트윈에서 프로퍼티 순회
                    entity.props.forEach(prop => {

                        // 타겟 프로퍼티만 조회
                        if(policy.targetProps.find(p => p.prop_id === prop.prop_id)){

                            // 누적 하기
                            var item = list.find(item => item.prop_id === prop.prop_id);
                            if(item){
                                item.current_value = Number((item.current_value +prop.value).toFixed(1));
                            }else{
                                list.push({
                                    id : prop.prop_id,
                                    prop_id : prop.prop_id,
                                    prop_name : prop.name,
                                    current_value : prop.value,
                                });
                            }
                        }

                    });
                }
            }

            list.forEach((item, idx)=>{
                result += item.prop_id +" : "+item.current_value;

                if(idx !== list.length-1){
                    result +=", "
                }
                
            })

           
        }

        return result
    }

    const getTargetPropsInfo = (targetProps) =>{
        let result = "";
        targetProps.forEach((prop, idx) =>{
            var prop_name = prop.prop_name;
            var prop_id = prop.prop_id;
            var target_value = prop.target_value;

            result +=prop_id +" : "+target_value;

            if(idx !== targetProps.length-1){
                result +=", "
            }
        })

        return result
    }

    if (loading) return <div>로딩중..</div>;
    if (error) return <div>Load Fail getAllInfos </div>;
    if (!data) return <div>getAllInfos empty  </div>;

    const policy_status = [
        { field: "id", headerName: "Id", width: 150 , hide:true },
        { field: "twin_name", headerName: "트윈 명", width: 100 },
        { field: "twin_type", headerName: "트윈 타입", width: 100,
        renderCell : (params) =>{
           return (
               <>
                   <p >{params.row.twin_type ===1 ?'제조':'에너지'}</p>
               </>
           )
       }},
        { field: "status", headerName: "연결상태", width: 100,
         renderCell : (params) =>{
            return (
                <>
                    <p style={{color:params.row.status==='connect'?'green':'red'}}>{params.row.status}</p>
                </>
            )
        }},
        { field: "server_url", headerName: "주소", width: 200},

        { field: "entities", headerName: "현재 값", width: 150, flex:1,
        renderCell : (params) =>{
            let current_values = {};
            let policy_config = params.row.policy_config;
            params.row.entities.forEach(entity =>{
                entity.props.forEach(prop => {
                  
                    if(policy && policy_config && policy_config[prop.prop_id]){
                       current_values[prop.prop_id] = prop.value;
                    }
                })
            });
           return (
               <>
                   <p >{JSON.stringify(current_values)}</p>
               </>
           )
       }},
       { field: "policy_config", headerName: "정책 목표 값", width: 150, flex:1,
       renderCell : (params) =>{
           
          return (
              <>
                  <p >{JSON.stringify(params.row.policy_config)}</p>
              </>
          )
      }},
      { field: "policy_status", headerName: "정책상태", width: 150,
      renderCell : (params) =>{
         return (
             <>
                 <p style={{color:params.row.policy_config?'green':'white'}}>{params.row.policy_config?"진행중":"완료"}</p>
             </>
         )
     }}
        // { field: "status", headerName: "연결상태",  flex: 1,
        // renderCell : (params) =>{
        //     return (
        //         <>
        //             <p >{JSON.stringify(params.row)}</p>
        //         </>
        //     )
        // }}
    ];

    return (
        <div className='policy'>
            <h1 >{policy.title}</h1>
            <div className='policyContainer'>
                
                <StatusBox status={{title:"상태",content:policy.enable?"실행중":"대기중",style:{color:policy.enable?'green':'grey'}}}/>
                <StatusBox status={{title:"주기",content:policy.duration+"ms",style:{color:'white'}}}/>
                <StatusBox status={{title:"연합트윈 수",content:policy.twinIds.length+" TWINS",style:{color:policy.twinIds.length===0?'grey':'green'}}}/>
               
            </div> 
            <div className='policyContainer'>
                <StatusBox status={{title:"현재 값 (전체)",content:getCurrentPropsInfo(policy, data.entity_infos)}}/>
                <StatusBox status={{title:"감축 목표 값 (전체)",content:getTargetPropsInfo(policy.targetProps)}}/>
            </div>

            <div className='policyCardBackgound'>
                <DataGrid
                    rows={getPolicyStatusList}
                    columns = {policy_status}
                    pageSize = {20}
                    autoHeight
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