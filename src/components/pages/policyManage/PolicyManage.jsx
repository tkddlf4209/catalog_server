import React, { useRef, useState } from 'react';
import './policyManage.scss'
import PolicyManageItem from './PolicyManageItem';
import {DataGrid} from '@mui/x-data-grid'
import useAsync from '../../../useAsync'
import {getPlicyInfos} from '../../../api'

const log_columns = [
    { field: "id", headerName: "Id", width: 150 },
    { field: "timestamp", headerName: "Time", width: 150 },
    { field: "type", headerName: "type", width: 150 },
    { field: "data", headerName: "data",  flex: 1,// minWidth: 100
    renderCell : (params) =>{
        return (
            <>
                <p >{JSON.stringify(params.row.data)}</p>
            </>
        )
    }}
];

export default function PolicyManage(){
       //const {plicyId} = useParams();
    const [state, refetch] = useAsync(()=>getPlicyInfos(), []);
    const { loading, data, error } = state; // state.data 를 users 키워드로 조회

    return (
        <div className='policy'>
            <h1 >Policy Management</h1>
            <div className='policyContainer'>
                {data?Object.keys(data).map((key, idx)=> {
                    var policy = data[key];
                     return  <PolicyManageItem policy={policy} refetch={refetch}/>
                }):""}
            </div> 
            
            {/* <div className='policyCardBackgound' style={{height:600,marginTop:7}}>
                    EventLog
                    <DeleteOutline
                        rows={[{id:0}]}
                        columns = {log_columns}
                        pageSize = {20}
                        // checkboxSelection
                        onRowClick={(param)=>{
                            //nodeFocusTableHandler(param.row);
                            //console.log(JSON.stringify(param.row));
                        }}
                        onSelectionModelChange ={(ids)=>{
                           // setTwinSelectId(ids[0]);
                        }}
                    />
            </div> */}
        </div>
    )
}