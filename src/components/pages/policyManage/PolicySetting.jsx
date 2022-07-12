import React, { useRef, useState ,useCallback, useMemo,useEffect } from 'react';
import './policySetting.scss'
import {Link,useparam,useLocation, useNavigate} from 'react-router-dom';

import {DataGrid} from '@mui/x-data-grid'
import useAsync from '../../../useAsync'
import {getAllInfos, updatePolicy} from '../../../api'
export default function PolicySetting(){

    //const {plicyId} = useparam();
    const [state, refetch] = useAsync(()=>getAllInfos(), []);
    const { loading, data, error } = state; // state.data 를 users 키워드로 조회

    //const { event_logs} = state;
    const navigate = useNavigate();
    const location = useLocation();
    const initPolicy = location.state?.policy; // 외부 주입된 정책정보
    const [policy, setPolicy] = useState(initPolicy);
    const [twinId, setTwinId] = useState(null);

    const getTwinList = useMemo(()  =>{
        var list = [];
        if(data){
            for (const [id, twin] of Object.entries(data.twin_infos)) {
                list.push(twin); 
            }
        }
        return list;
    },[data]);


    const getSelectTwinPropSum = useCallback(()  =>{
        
        let list = [];
        // {id : 0, name : "미세먼지", value :10 , target_value : 20},
        if(data){
            for (let [id, entity] of Object.entries(data.entity_infos)) {
                if(policy.twinIds.includes(entity.source_id)){
                    entity.props.forEach(prop => {
                      
                        if(prop.prop_id !== 'device_count'){
                            var target_value = policy.targetProps.filter(p => p.prop_id ===prop.prop_id && p.target_value != null)

                            var item = list.find(item => item.prop_id === prop.prop_id);
                            if(item){
                                item.current_value = Number((item.current_value +prop.value).toFixed(1));
                            }else{
                                list.push({
                                    id : prop.prop_id,
                                    prop_id : prop.prop_id,
                                    prop_name : prop.name,
                                    current_value : prop.value,
                                    target_value : (target_value.length>0?target_value[0].target_value:null)
                                });
                            }
                        }


                    });
                }
            }
        }
        return list;
    },[data,policy]);


    // const getPropList = useCallback((twin_id)  =>{
    //     var list = [];
    //     // {id : 0, name : "미세먼지", value :10 , target_value : 20},
    //     if(data){
    //         for (let [id, entity] of Object.entries(data.entity_infos)) {
    //             if(entity.source_id === twin_id && entity.enable){
                   
    //                 entity.props.forEach(prop => {
    //                     var target_value = policy.targetProps.filter(p => p.id ===prop.id && p.target_value != null)
                        
    //                     // if(entity.type=="relation"){
    //                     //     prop.min = 1;
    //                     //     prop.max = 2;
    //                     // }

    //                     var item = {
    //                         ...prop,
    //                         twinId : twin_id,
    //                         entityId: entity.id,
    //                         entityName : entity.name, // 객체 이름,
    //                         entityType : entity.type, // 객체 타입 
    //                         target_value : (target_value.length>0?target_value[0].target_value:null)
    //                     }
    //                     list.push(item);
    //                 });
    //             }
    //         }
    //     }
    //     return list;
    // },[data]);

    // policy  ******
    // const getRelationTwinIds = useMemo(()  =>{
    //     return policy.twinIds;
    // },[policy]);

    // const getRelationTargetPropIds = useMemo(()  =>{
    //     return policy.targetProps.map(prop=> prop.id);
    // },[policy]);

    const twin_select_columns = [
        { field: "id", headerName: "", width: 20 ,renderCell : (param) =>{
            return (
                <>
                    <input type="checkbox" checked={policy.twinIds.includes(param.row.id)} onChange={(e)=>{
                        
                        if(e.target.checked && param.row.status !== "connect"){
                            alert("연결되어있지 않습니다")
                            return;
                        }

                        if(e.target.checked){
                            if(!policy.twinIds.includes(param.row.id)){
                                setPolicy({
                                    ...policy,
                                    twinIds : [...policy.twinIds,param.row.id]
                                })
                                setTwinId(param.row.id)
                            }
                        }else{
                            setPolicy({
                                ...policy,
                                twinIds : policy.twinIds.filter((twin_id)=> twin_id !==param.row.id)
                            })

                            setTwinId(null)
                        }
                    
                    }} />
                </>
            )
        }}, 
        { field: "name", headerName: "트윈명", width: 100 },
        { field: "type", headerName: "타입", width: 100 ,
        renderCell : (param) =>{
            return (
                <>
                    <p >{param.row.type===1?'제조':'에너지'}</p>
                </>
            )
        }},
        { field: "status", headerName: "연결상태", width: 100,
        renderCell : (param) =>{
            return (
                <>
                    <p style={param.row.status==="connect"?{color:"green"}:{color:"red"}}>{param.row.status}</p>
                </>
            )
        }},
        { field: "tag", headerName: "태그", width: 150 }
    ];
    
    const prop_select_columns = [
        { field: "id", headerName: "", width: 50 ,renderCell : (param) =>{
            return (
                <>
                    <input type="checkbox" checked={policy.targetProps.some(prop=> prop.prop_id ===param.row.prop_id)?true:false} onChange={(e)=>{
                        
                         if(e.target.checked){
                             // 추가되어있지 않으면 추가
                             if(!policy.targetProps.some(prop=> prop.prop_id ===param.row.prop_id)){
                                param.row.target_value = param.row.value;
                                policy.targetProps.push(param.row)
                                setPolicy({...policy})
                             }
                         }else{
                            policy.targetProps = policy.targetProps.filter(prop => prop.prop_id !==param.row.prop_id);
                            setPolicy({...policy})
                         }
                    }} />
                </>
            )
        }},
        // { field: "entityName", headerName: "객체명", width: 100 },
        // { field: "entityType", headerName: "entityType", width: 100 },
        // { field: "prop_id", headerName: "propId", width: 150 },
        { field: "prop_id", headerName: "Prop ID", width: 150 },
        { field: "prop_name", headerName: "Prop Name", width: 150 },
        { field: "current_value", headerName: "현재값(누적)", width: 150 },
        // { field: "range", headerName: "설정 범위", width: 150 ,
        // renderCell : (param) =>{
        //     if(param.row.max !==undefined){
        //         return (
        //             <>
        //                 <p >{param.row.min}~{param.row.max}</p>
        //             </>
        //         )
        //     }else{
        //         return (
        //             <>
        //                <p>-</p>
        //             </>
        //         )
        //     }
            
        // }},
        { field: "target_value", headerName: "목표값", width: 100 ,editable: true,type: 'number',
        renderCell : (param) =>{
            var selected = policy.targetProps?.some((prop)=>param.row.prop_id === prop.prop_id);
            return (
                <>
                    <p >{selected?param.row.target_value:''}</p>
                </>
            )
        }}
    ];

    return (
        <div className='policySetting'>

            <div className='policySettingWrap center'>
                <h1 style={{flex:1}} >Policy Setting</h1> 
                <p className='policySettingSaveButton outline' onClick={async (e)=>{
                    var response = await updatePolicy({
                        type : "POLICY_UPDATE",
                        data : policy
                    });
                    console.log('response',response);
                    if(response.message){
                        alert(response.message)
                    }
                    navigate(-1)
                }}>SAVE</p>
            </div>
            <div className='policySettingTop'>
                <div className='policySettingTopItem'>
                    <label>정책명</label>
                    <input type="text" name="title" placeholder='ex)계절관리제' value={policy.title} onChange={(e)=>{
                        setPolicy({...policy,title:e.target.value})
                    }} className='policySettingInput'></input>
                </div>
                <div className='policySettingTopItem'>
                    <label>동작주기</label>
                    <input type="text" placeholder='duration' value={policy.duration} onChange={(e)=>{
                        setPolicy({...policy,duration:e.target.value})
                    }} className='policySettingInput'></input>
                </div>
            </div>

            <div className='policySettingWrap'>
                <div className='policySettingLeft'>
                   Select Relation Twins
                   <DataGrid
                        rows={getTwinList}
                        
                        columns = {twin_select_columns}
                        pageSize = {20}
                        // checkboxSelection
                        hideFooter
                        // disableSelectionOnClick
                        // selectionModel={getRelationTwinIds}
                        onRowClick={(param)=>{
                            //nodeFocusTableHandler(param.row);
                            //console.log(JSON.stringify(param.row));
                        }}
                        onSelectionModelChange ={(ids)=>{
                            setPolicy((policy)=>{
                                return {...policy,twinIds:ids}
                            })
                            setTwinId(ids[0])
                            // setTwinSelectId(ids[0]);
                        }}
                    />

                </div>
                <div className='policySettingRight'>
                    
                    Select Twin Prop Info (SUM)
                    <DataGrid
                        rows={getSelectTwinPropSum()}
                        columns = {prop_select_columns}
                        // pageSize = {20}
                        // checkboxSelection
                        checkboxSelection={false}
                        hideFooter
                        disableSelectionOnClick
                        onRowClick={(param)=>{
                            //nodeFocusTableHandler(param.row);
                            //console.log(JSON.stringify(param.row));
                        }}
                        
                        isCellEditable={(param) => {
                            return policy.targetProps.some(prop=> prop.prop_id ===param.row.prop_id);
                        }}

                        onCellEditCommit={(param)=>{
                            policy.targetProps = policy.targetProps.map(prop => {
                               if(prop.prop_id ===param.id){
                                   //console.log(prop.prop_id,param.id,param.value);
                                   prop.target_value = param.value;
                                  
                               }

                               return prop
                            });

                            //console.log(policy);
                            setPolicy({...policy})
                        }}
                    />

                    {/* Props {data?.twin_infos[twinId]?.name} */}
                    {/* <DataGrid
                        rows={getPropList(twinId)}
                        columns = {prop_select_columns}
                        // pageSize = {20}
                        // checkboxSelection
                        checkboxSelection={false}
                        hideFooter
                        disableSelectionOnClick
                        onRowClick={(param)=>{
                            //nodeFocusTableHandler(param.row);
                            //console.log(JSON.stringify(param.row));
                        }}
                        
                        isCellEditable={(param) => {
                            return policy.targetProps.some(prop=> prop.id ===param.row.id);
                        }}

                        onCellEditCommit={(param)=>{
                            policy.targetProps.forEach(prop => {
                               if(prop.id ===param.id){
                                   console.log(prop.id,param.id);
                                   prop.target_value = param.value;
                               }
                            });
                            setPolicy({...policy})
                        }}
                    /> */}
                   
                </div>
            </div>

        </div>
    )
}